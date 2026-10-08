import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

// schemastery resolves against the Harness profile's node_modules, which a
// linked bundle's real path cannot reach. Prefer the package's own dependency,
// fall back to the profile copy so activation does not hard-fail.
let z;
try {
  z = (await import('@deepseek-ai/schemastery')).default;
} catch {
  const candidates = [
    process.env.DSH_PROFILE_DIR ? join(process.env.DSH_PROFILE_DIR, 'node_modules', '@deepseek-ai', 'schemastery', 'lib', 'index.mjs') : undefined,
    join(MODULE_DIR, 'node_modules', '@deepseek-ai', 'schemastery', 'lib', 'index.mjs'),
  ].filter(Boolean);
  let loaded;
  for (const p of candidates) {
    try { loaded = (await import(pathToFileURL(p).href)).default; if (loaded) break; } catch { /* next */ }
  }
  z = loaded;
}

/** All reasoning levels the Harness understands, in escalation order. */
const ALL_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const LEVEL_SET = new Set(ALL_LEVELS);
const DEFAULT_CATALOG_URL = 'https://models.dev/api.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_FILE = join(MODULE_DIR, 'models-dev-cache.json');

const title = (s) => (typeof s === 'string' && s.length ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s);
const effort = (id) => ({ id, name: title(id) });

/**
 * In-memory mirror of the models.dev capability index plus fetch lifecycle.
 * Persisted to CACHE_FILE so restarts reuse the last good fetch.
 */
function createCatalog(log) {
  const state = {
    /** @type {Map<string, object>} provider id -> provider entry */
    providers: new Map(),
    fetchedAt: 0,
    loading: null,
  };
  const norm = (s) => String(s ?? '').toLowerCase();

  function index(payload) {
    state.providers.clear();
    for (const provider of Object.values(payload ?? {})) {
      if (!provider || typeof provider !== 'object' || !provider.models) continue;
      const models = new Map();
      for (const model of Object.values(provider.models)) {
        if (!model || typeof model !== 'object' || !model.id) continue;
        models.set(norm(model.id), model);
        if (model.canonical_model_id) models.set(norm(model.canonical_model_id), model);
      }
      state.providers.set(norm(provider.id), { provider, models });
      // index bare ids too, so a custom route whose provider id differs can still match
      state.providers.set(`*${norm(provider.id)}`, { provider, models });
    }
    return state.providers.size;
  }

  async function fetchRemote(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`models.dev HTTP ${res.status}`);
    return res.json();
  }

  async function persist(payload) {
    try {
      await mkdir(MODULE_DIR, { recursive: true });
      await writeFile(CACHE_FILE, JSON.stringify({ fetchedAt: state.fetchedAt, payload }), 'utf8');
    } catch (error) {
      log?.warn?.('dsh-better-reasoning: failed to persist models.dev cache: %s', error?.message ?? error);
    }
  }

  async function restore() {
    try {
      const raw = await readFile(CACHE_FILE, 'utf8');
      const doc = JSON.parse(raw);
      if (!doc || typeof doc !== 'object' || !doc.payload) return false;
      index(doc.payload);
      state.fetchedAt = Number(doc.fetchedAt) || 0;
      return true;
    } catch {
      return false;
    }
  }

  async function refresh(url) {
    if (state.loading) return state.loading;
    state.loading = (async () => {
      const payload = await fetchRemote(url);
      state.fetchedAt = Date.now();
      index(payload);
      await persist(payload);
      return state.providers.size;
    })().finally(() => { state.loading = null; });
    return state.loading;
  }

  async function ensure(url, { force = false } = {}) {
    const fresh = state.fetchedAt > 0 && Date.now() - state.fetchedAt < CACHE_TTL_MS;
    if (fresh && !force) return { source: 'cache', providers: state.providers.size };
    if (!state.providers.size) await restore();
    const stillFresh = state.fetchedAt > 0 && Date.now() - state.fetchedAt < CACHE_TTL_MS;
    if (!stillFresh || force || !state.providers.size) {
      try {
        const n = await refresh(url);
        return { source: 'fetched', providers: n };
      } catch (error) {
        log?.warn?.('dsh-better-reasoning: models.dev fetch failed, using %s: %s',
          state.providers.size ? 'stale cache' : 'fallback-all', error?.message ?? error);
        return { source: state.providers.size ? 'stale' : 'none', providers: state.providers.size, error: String(error?.message ?? error) };
      }
    }
    return { source: 'cache', providers: state.providers.size };
  }

  function find(provider, modelId) {
    const p = norm(provider), m = norm(modelId);
    const direct = state.providers.get(p) ?? state.providers.get(`*${p}`);
    if (direct?.models?.has(m)) return direct.models.get(m);
    // fallback: search every provider for the model id / canonical id
    for (const entry of state.providers.values()) {
      if (entry.models?.has(m)) return entry.models.get(m);
    }
    return undefined;
  }

  return { ensure, find, refresh, get fetchedAt() { return state.fetchedAt; }, get size() { return state.providers.size; } };
}

/** Map a models.dev model entry to Harness reasoning efforts, or undefined when it is not a reasoning model. */
function effortsFromCatalogModel(model) {
  if (!model || model.reasoning !== true) return undefined;
  const options = Array.isArray(model.reasoning_options) ? model.reasoning_options : [];
  const levels = new Set();
  let sawToggle = false;
  for (const opt of options) {
    if (!opt || typeof opt !== 'object') continue;
    if (opt.type === 'effort' && Array.isArray(opt.values)) {
      for (const v of opt.values) {
        const lv = normLevel(v);
        if (lv) levels.add(lv);
      }
    } else if (opt.type === 'toggle') {
      sawToggle = true;
    }
  }
  if (levels.size === 0 && sawToggle) levels.add('high'); // a plain on/off thinking model
  if (levels.size === 0) return undefined;
  if (!levels.has('off')) levels.add('off');
  return ALL_LEVELS.filter((l) => levels.has(l)).map(effort);
}

function normLevel(value) {
  const v = String(value ?? '').toLowerCase();
  if (v === 'none' || v === 'off') return 'off';
  if (v === 'min' || v === 'minimal') return 'minimal';
  if (LEVEL_SET.has(v)) return v;
  if (v === 'max' || v === 'maximum') return 'max';
  return undefined;
}

const ALL_EFFORTS = ALL_LEVELS.map(effort);
const FALLBACK_EFFORTS = ALL_EFFORTS; // 'support everything' last resort

/**
 * Decide the reasoning block for a resolved model:
 *  - keep whatever the adapter already declared (user reasoningEfforts / built-in catalog)
 *  - else exact models.dev effort levels
 *  - else all levels
 * Returns the reasoning object to attach, or undefined to leave info untouched.
 */
function augmentReasoning(provider, model, info, catalog) {
  if (info?.reasoning && Array.isArray(info.reasoning.efforts) && info.reasoning.efforts.length > 0) return undefined;
  const hit = catalog?.find(provider, model);
  const fromCatalog = hit ? effortsFromCatalogModel(hit) : undefined;
  if (fromCatalog && fromCatalog.length > 0) return { efforts: fromCatalog };
  if (hit && hit.reasoning === false) return undefined; // known non-reasoning: keep it clean
  return { efforts: FALLBACK_EFFORTS };
}

function withReasoning(info, reasoning) {
  if (!reasoning) return info;
  return { ...info, reasoning };
}

/**
 * Close the describe/send gap: `augmentReasoning` only edits the modelInfo the
 * UI reads, but pi-ai validates `options.reasoningEffort` against the adapter's
 * internal `model.thinkingLevelMap` — a model with no declared reasoningEfforts
 * (custom provider entries) has no xhigh/max mapping, so offering them makes the
 * picker selectable-then-rejected ("does not support reasoning effort").
 * Patch the resolved descriptor's map in place: wire value = level name, which
 * OpenAI-style routes send verbatim. Returns the descriptor when patched.
 */
function syncThinkingLevelMap(registration, provider, model, reasoning, log) {
  const efforts = reasoning?.efforts;
  if (!Array.isArray(efforts) || efforts.length === 0) return;
  try {
    const adapter = registration?.adapter;
    const snapshot = typeof adapter?.current === 'function' ? adapter.current() : undefined;
    const resolved = snapshot?.models?.getModel?.(provider, model);
    if (!resolved) return;
    const map = { ...(resolved.thinkingLevelMap ?? {}) };
    let changed = false;
    for (const e of efforts) {
      const level = e?.id;
      if (!LEVEL_SET.has(level)) continue;
      // off = parameter absent; don't give it a wire value
      if (level === 'off') continue;
      if (map[level] === undefined || map[level] === null) {
        map[level] = level;
        changed = true;
      }
    }
    // Absent map keys default to supported for base levels, so the map starts
    // empty for most routes; flag the model as reasoning so validation reads it.
    if (changed) {
      resolved.thinkingLevelMap = map;
      resolved.reasoning = true;
    }

    // Anthropic Opus 4.7+/5.x requires adaptive thinking: the endpoint rejects
    // the legacy {type:"enabled", budget_tokens} shape with a 400 demanding
    // {type:"adaptive"} + output_config.effort. It ALSO rejects
    // {type:"disabled"} — the off level must omit the thinking field entirely.
    //
    // Custom anthropic-messages entries authored before that requirement have
    // no compat flag, so the adapter falls into the legacy branches the moment
    // any level is picked. Force the flag on anthropic-messages routes that
    // resolve as reasoning, and pin thinkingLevelMap.off to null so the pi-ai
    // "disabled" emit branch (which requires off !== null) never fires.
    if (resolved.api === 'anthropic-messages' && resolved.reasoning === true) {
      if (resolved.compat?.forceAdaptiveThinking !== true) {
        resolved.compat = { ...(resolved.compat ?? {}), forceAdaptiveThinking: true };
      }
      // Explicit null keeps the wire silent on `off`. This must run after the
      // efforts loop above so a just-patched map also gets its `off` key.
      if (resolved.thinkingLevelMap && resolved.thinkingLevelMap.off !== null) {
        resolved.thinkingLevelMap = { ...resolved.thinkingLevelMap, off: null };
      }
    }
  } catch (error) {
    log?.warn?.('dsh-better-reasoning: thinkingLevelMap sync failed for %s/%s: %s', provider, model, error?.message ?? error);
  }
}

/**
 * Wrap LlmRuntime so every resolved model gains a reasoning capability when the
 * adapter left it undefined. Wraps the public surface only; restores on dispose.
 */
function wrapLlm(llm, catalog, log) {
  const originals = {
    resolveModelInfo: llm.resolveModelInfo,
    resolveModelInfoFor: llm.resolveModelInfoFor,
    prepareCall: llm.prepareCall,
    resolveCallFor: llm.resolveCallFor,
  };
  const patchInfo = (provider, model) => async (info) => {
    try {
      const reasoning = augmentReasoning(provider, model, info, catalog);
      return withReasoning(info, reasoning);
    } catch (error) {
      log?.warn?.('dsh-better-reasoning: augment failed for %s/%s: %s', provider, model, error?.message ?? error);
      return info;
    }
  };

  llm.resolveModelInfo = async function (provider, model, signal) {
    return patchInfo(provider, model)(await originals.resolveModelInfo.call(this, provider, model, signal));
  };
  llm.resolveModelInfoFor = async function (registration, model, signal) {
    const provider = registration?.provider?.id ?? registration?.provider;
    return patchInfo(provider, model)(await originals.resolveModelInfoFor.call(this, registration, model, signal));
  };
  llm.resolveCallFor = async function (registration, config, signal) {
    const resolved = await originals.resolveCallFor.call(this, registration, config, signal);
    if (resolved?.modelInfo) {
      const provider = registration?.provider?.id ?? registration?.provider ?? config?.provider;
      const reasoning = augmentReasoning(provider, config?.model, resolved.modelInfo, catalog);
      if (reasoning) {
        // Also teach the adapter's own model map so the request path accepts
        // the levels the picker now offers (describe/send consistency).
        syncThinkingLevelMap(registration, provider, config?.model, reasoning, log);
        const modelInfo = withReasoning(resolved.modelInfo, reasoning);
        return { ...resolved, modelInfo, config: this.resolveCallWithInfo(config, modelInfo).config };
      }
    }
    return resolved;
  };
  const freeze = (o) => (typeof structuredClone === 'function' && typeof Object.freeze === 'function' ? Object.freeze(structuredClone(o)) : o);
  const sameConfig = (a, b) => a === b || (
    a?.provider === b?.provider && a?.model === b?.model && a?.reasoningEffort === b?.reasoningEffort &&
    a?.temperature === b?.temperature && a?.maxTokens === b?.maxTokens
  );

  llm.prepareCall = async function (config, signal) {
    const registration = this.registration(config.provider);
    const adapterCall = await registration.adapter.prepareCall(config.provider, config.model, signal);
    let modelInfo = this.normalizeModelInfo(registration, config.model, adapterCall.model);
    try {
      const reasoning = augmentReasoning(config.provider, config.model, modelInfo, catalog);
      if (reasoning) {
        syncThinkingLevelMap(registration, config.provider, config.model, reasoning, log);
        modelInfo = withReasoning(modelInfo, reasoning);
      }
    } catch (error) {
      log?.warn?.('dsh-better-reasoning: prepareCall augment failed for %s/%s: %s', config.provider, config.model, error?.message ?? error);
    }
    const resolved = this.resolveCallWithInfo(config, modelInfo);
    const resolvedConfig = freeze(resolved.config);
    const context = resolved.context === undefined ? undefined : freeze(resolved.context);
    const adapterDefaults = freeze({
      ...(config.reasoningEffort === undefined && resolvedConfig.reasoningEffort !== undefined ? { reasoningEffort: true } : {}),
      ...(config.maxTokens === undefined && resolvedConfig.maxTokens !== undefined ? { maxTokens: true } : {}),
    });
    let dispatched = false;
    return Object.freeze({
      config: resolvedConfig,
      retryPolicy: registration.retryPolicy,
      adapterDefaults,
      ...(context === undefined ? {} : { context }),
      ...(modelInfo.inputModalities === undefined ? {} : { inputModalities: Object.freeze([...modelInfo.inputModalities]) }),
      ...(modelInfo.systemPromptUpdate === undefined ? {} : { systemPromptUpdate: modelInfo.systemPromptUpdate }),
      ...(modelInfo.toolUpdate === undefined ? {} : { toolUpdate: modelInfo.toolUpdate }),
      stream: (options) => {
        if (dispatched) throw new Error('a prepared LLM call can only be dispatched once');
        if (!sameConfig(options, resolvedConfig)) throw new Error('prepared LLM call config changed before adapter dispatch');
        dispatched = true;
        return this.streamWithRegistration(options, { registration, config: resolvedConfig, modelInfo, dispatch: (o) => adapterCall.stream(o) });
      },
    });
  };
  return () => {
    for (const [key, fn] of Object.entries(originals)) {
      if (typeof fn === 'function') llm[key] = fn;
    }
  };
}

/**
 * Subagent reasoning-effort inheritance.
 *
 * Why this exists: ordinary sessions get their effort at REQUEST time through
 * `installModelSelection`'s agent/request waterfall (the session-controller
 * selection reads `agentDefaultModel`, which is where the configured
 * `reasoningEffort` actually lives — `Agent.options` only carries
 * provider/model). Delegated children compose their preset but never install
 * that waterfall, so their config carries only what `parentAgentOptionsForDelegation`
 * found in `parent.options` or a durable `request/header`. A parent that has
 * not logged a header with an explicit effort hands the child nothing, and
 * the child then validates its request without an effort at all.
 *
 * The fix mirrors the same waterfall for `origin: 'subagent'` agents only: if
 * the proposed config already carries an effort, we leave it alone (explicit
 * child selection wins); otherwise we resolve the parent's current effort for
 * the child's resolved route. Route must match — inheriting an effort across
 * a different provider/model would validate against the wrong capability set.
 *
 * Source order, first hit wins:
 *   1. parent's latest request/header config (matches dsh-subagent's own rule)
 *   2. parent's modelSelection projection (pending selection before its next
 *      request, else lastUsed)
 *   3. agentDefaultModel.currentSelection() (deployment default)
 */

function routeMatches(a, b) {
  return a?.provider === b?.provider && a?.model === b?.model;
}

function effortOf(selection) {
  const effort = selection?.reasoningEffort;
  return typeof effort === 'string' && effort.length > 0 ? effort : undefined;
}

export function inheritedReasoningEffort(ctx, parentId, config) {
  if (!parentId || !config) return undefined;
  // Each source is isolated: a missing session or unregistered projection must
  // not skip the remaining fallbacks.
  try {
    const parentSession = ctx.sessions?.get?.(parentId);
    const headerConfig = parentSession?.requestHeader?.()?.config;
    if (routeMatches(headerConfig, config)) {
      const e = effortOf(headerConfig);
      if (e !== undefined) return e;
    }
    const projection = ctx.sessionProjections?.stateOf?.(parentSession, 'modelSelection');
    for (const selection of [projection?.pending, projection?.lastUsed]) {
      if (routeMatches(selection, config)) {
        const e = effortOf(selection);
        if (e !== undefined) return e;
      }
    }
  } catch { /* capability absence is not fatal to request admission */ }
  try {
    const fallback = ctx.agentDefaultModel?.currentSelection?.();
    if (routeMatches(fallback, config)) return effortOf(fallback);
  } catch { /* no default configured */ }
  return undefined;
}

/**
 * Register the per-agent inheritance waterfall for delegated children.
 * Listens on the global `agent/created` serial event (every entered agent
 * passes through it), then attaches the request waterfall on the child's own
 * context so scope-filtered dispatch reaches it — the same pattern
 * `installModelSelection` uses for ordinary sessions.
 */
export function installSubagentInheritance(ctx) {
  return ctx.on?.('agent/created', ({ agent }) => {
    try {
      const header = agent?.session?.header;
      if (header?.origin !== 'subagent' || header.parentSession === undefined) return;
      const parentId = header.parentSession;
      agent.ctx?.on?.('agent/request', async (_payload, next) => {
        const config = await next();
        if (config?.reasoningEffort !== undefined) return config;
        const effort = inheritedReasoningEffort(ctx, parentId, config);
        return effort === undefined ? config : { ...config, reasoningEffort: effort };
      });
    } catch { /* a child without these hooks keeps its own defaults */ }
  });
}

export const inject = ['llm'];

export const Config = z.object({
  catalogUrl: z.string().default(DEFAULT_CATALOG_URL),
  autoRefresh: z.boolean().default(true),
});

export function apply(ctx, config) {
  const log = ctx.logger ?? console;
  const catalog = createCatalog(log);
  const catalogUrl = config?.catalogUrl?.get?.() ?? config?.catalogUrl ?? DEFAULT_CATALOG_URL;
  const autoRefresh = config?.autoRefresh?.get?.() ?? config?.autoRefresh ?? true;

  if (!ctx.llm || typeof ctx.llm.resolveModelInfo !== 'function') {
    log?.warn?.('dsh-better-reasoning: ctx.llm unavailable or unexpected shape; reasoning fallback disabled');
    return;
  }

  const unwrap = wrapLlm(ctx.llm, catalog, log);
  ctx.on?.('dispose', unwrap);
  installSubagentInheritance(ctx);

  if (autoRefresh !== false) {
    catalog.ensure(catalogUrl).then((r) => {
      log?.info?.('dsh-better-reasoning: capability catalog ready (source=%s, providers=%d)', r.source, r.providers ?? 0);
    }).catch(() => {});
  }

  // Manual refresh: register `/better-reasoning-refresh` so a user can re-pull
  // models.dev on demand without a restart.
  try {
    ctx.inject?.(['commands'], (scope) => {
      const commands = scope.get('commands');
      if (!commands?.register) return;
      scope.effect(() => commands.register({
        name: 'better-reasoning-refresh',
        description: 'Re-fetch models.dev reasoning-level capability cache',
        input: { hint: '' },
        handler: async () => {
          const r = await catalog.ensure(catalogUrl, { force: true });
          const text = `reasoning capability catalog refreshed (source=${r.source}, providers=${r.providers ?? 0})`;
          log?.info?.('dsh-better-reasoning: %s', text);
          return { kind: 'success', text };
        },
      }));
    });
  } catch (error) {
    log?.warn?.('dsh-better-reasoning: could not register refresh command: %s', error?.message ?? error);
  }
}
