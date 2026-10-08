import { test } from 'node:test';
import assert from 'node:assert/strict';

// The unit under test is imported lazily inside each test so that a missing
// export fails as a real assertion error (RED) rather than a module crash.
const load = () => import('./index.js');

// ---------------------------------------------------------------------------
// Test doubles ---------------------------------------------------------------
// ---------------------------------------------------------------------------

function sessionStub({ origin, parentSession, headerConfig } = {}) {
  return {
    header: {
      id: 'session-child',
      ...(origin === undefined ? {} : { origin }),
      ...(parentSession === undefined ? {} : { parentSession }),
    },
    requestHeader() {
      return headerConfig === undefined ? undefined : { config: headerConfig };
    },
  };
}

function ctxStub({ sessions = {}, projections = {}, defaultSelection } = {}) {
  const listeners = {};
  return {
    logger: { warn() {}, info() {} },
    listeners,
    sessions: {
      get: (id) => sessions[id],
    },
    sessionProjections: {
      stateOf: (_session, key) => projections[key],
    },
    agentDefaultModel: {
      currentSelection: () => defaultSelection,
    },
    on(event, fn) {
      (listeners[event] ??= []).push(fn);
      return () => {
        const l = listeners[event];
        const i = l.indexOf(fn);
        if (i >= 0) l.splice(i, 1);
      };
    },
  };
}

function agentStub({ origin = 'subagent', parentSession = 'session-parent', headerConfig } = {}) {
  const agentListeners = {};
  const agent = {
    id: 'session-child',
    session: sessionStub({ origin, parentSession, headerConfig }),
    ctx: {
      on(event, fn) {
        (agentListeners[event] ??= []).push(fn);
        return () => {};
      },
    },
    __listeners: agentListeners,
  };
  return agent;
}

// Drive the registered 'agent/request' waterfall for `agent` as the runtime
// would: each listener wraps the next; the innermost next yields `baseConfig`.
async function runRequestWaterfall(agent, baseConfig) {
  const fns = agent.__listeners['agent/request'] ?? [];
  const dispatch = (i) => async () => {
    if (i === fns.length) return baseConfig;
    return fns[i]({ agent, turn: 1, step: 1 }, dispatch(i + 1));
  };
  return dispatch(0)();
}

// ---------------------------------------------------------------------------
// inheritedReasoningEffort --------------------------------------------------
// ---------------------------------------------------------------------------

test('inheritedReasoningEffort returns parent requestHeader effort when route matches', async () => {
  const { inheritedReasoningEffort } = await load();
  const parentSession = sessionStub({
    headerConfig: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'xhigh' },
  });
  const ctx = ctxStub({ sessions: { 'session-parent': parentSession } });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, 'xhigh');
});

test('inheritedReasoningEffort ignores parent header when route differs', async () => {
  const { inheritedReasoningEffort } = await load();
  const parentSession = sessionStub({
    headerConfig: { provider: 'mgw', model: 'other-model', reasoningEffort: 'xhigh' },
  });
  const ctx = ctxStub({ sessions: { 'session-parent': parentSession } });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, undefined);
});

test('inheritedReasoningEffort falls back to modelSelection projection', async () => {
  const { inheritedReasoningEffort } = await load();
  const parentSession = sessionStub({ headerConfig: undefined });
  const ctx = ctxStub({
    sessions: { 'session-parent': parentSession },
    projections: {
      modelSelection: {
        pending: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'high' },
        lastUsed: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'low' },
      },
    },
  });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, 'high'); // pending wins over lastUsed
});

test('inheritedReasoningEffort uses projection lastUsed when no pending', async () => {
  const { inheritedReasoningEffort } = await load();
  const ctx = ctxStub({
    sessions: { 'session-parent': sessionStub({}) },
    projections: {
      modelSelection: {
        pending: null,
        lastUsed: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'low' },
      },
    },
  });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, 'low');
});

test('inheritedReasoningEffort falls back to agentDefaultModel selection', async () => {
  const { inheritedReasoningEffort } = await load();
  const ctx = ctxStub({
    sessions: { 'session-parent': sessionStub({}) },
    defaultSelection: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'xhigh' },
  });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, 'xhigh');
});

test('inheritedReasoningEffort returns undefined when no source matches', async () => {
  const { inheritedReasoningEffort } = await load();
  const ctx = ctxStub({ sessions: { 'session-parent': sessionStub({}) } });
  const effort = inheritedReasoningEffort(ctx, 'session-parent', { provider: 'mgw', model: 'swe-2' });
  assert.equal(effort, undefined);
});

// ---------------------------------------------------------------------------
// installSubagentInheritance (wiring) ---------------------------------------
// ---------------------------------------------------------------------------

test('subagent child request gains inherited effort from parent header', async () => {
  const { installSubagentInheritance } = await load();
  const parentSession = sessionStub({
    headerConfig: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'xhigh' },
  });
  const ctx = ctxStub({ sessions: { 'session-parent': parentSession } });
  installSubagentInheritance(ctx);

  const child = agentStub();
  for (const fn of ctx.listeners['agent/created'] ?? []) await fn({ agent: child, source: 'startup' });
  assert.ok(child.__listeners['agent/request']?.length > 0, 'child scope must carry an agent/request listener');

  const config = await runRequestWaterfall(child, { provider: 'mgw', model: 'swe-2' });
  assert.equal(config.reasoningEffort, 'xhigh');
});

test('existing child reasoningEffort is not overwritten', async () => {
  const { installSubagentInheritance } = await load();
  const parentSession = sessionStub({
    headerConfig: { provider: 'mgw', model: 'swe-2', reasoningEffort: 'xhigh' },
  });
  const ctx = ctxStub({ sessions: { 'session-parent': parentSession } });
  installSubagentInheritance(ctx);

  const child = agentStub();
  for (const fn of ctx.listeners['agent/created'] ?? []) await fn({ agent: child, source: 'startup' });

  const config = await runRequestWaterfall(child, { provider: 'mgw', model: 'swe-2', reasoningEffort: 'low' });
  assert.equal(config.reasoningEffort, 'low');
});

test('ordinary agents get no inheritance listener', async () => {
  const { installSubagentInheritance } = await load();
  const ctx = ctxStub({});
  installSubagentInheritance(ctx);

  const child = agentStub({ origin: 'ordinary', parentSession: undefined });
  for (const fn of ctx.listeners['agent/created'] ?? []) await fn({ agent: child, source: 'startup' });
  assert.equal(child.__listeners['agent/request'], undefined);
});

test('child keeps config unchanged when parent yields no effort', async () => {
  const { installSubagentInheritance } = await load();
  const ctx = ctxStub({ sessions: { 'session-parent': sessionStub({}) } });
  installSubagentInheritance(ctx);

  const child = agentStub();
  for (const fn of ctx.listeners['agent/created'] ?? []) await fn({ agent: child, source: 'startup' });

  const config = await runRequestWaterfall(child, { provider: 'mgw', model: 'swe-2' });
  assert.deepEqual(config, { provider: 'mgw', model: 'swe-2' });
});
