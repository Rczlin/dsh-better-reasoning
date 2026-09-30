window.__ModuleLoader__.load({
  id: '@dsh-better-reasoning/plugin',
  factory(require) {
    const React = require('react');
    const { useSyncExternalStore } = React;
    const h = React.createElement;

    const css = `
.dbr_root{min-width:0;position:relative}
.dbr_trigger{border-radius:var(--dsw-radius-sm);min-width:0;max-width:min(360px,45cqw);height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;outline:none;align-items:center;gap:4px;padding:0 4px 0 8px;font-size:13px;font-weight:400;line-height:20px;display:flex}
.dbr_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dbr_trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dbr_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}
.dbr_triggerEffort{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-caption);flex-shrink:1000;overflow:hidden}
.dbr_chevron{color:var(--dsw-alias-label-caption);flex:none;transition:transform .12s}
.dbr_chevronOpen{transform:rotate(180deg)}
.dbr_menu{z-index:1100;width:max-content;min-width:min(260px,calc(100vw - 32px));max-width:min(420px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);border:0;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-elevated,#1e1e1e));flex-direction:column;padding:4px;display:flex;position:fixed;overflow:hidden}
.dbr_section{flex-shrink:0;color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px;padding:6px 8px 2px;letter-spacing:.04em}
.dbr_list{min-height:0;overflow-y:auto}
.dbr_option{box-sizing:border-box;border-radius:var(--dsw-radius-md);width:100%;min-height:32px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;outline:none;align-items:center;gap:6px;padding:5px 8px;display:flex;font-size:13px;line-height:18px}
.dbr_option:hover:not(:disabled),.dbr_option:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
.dbr_option:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dbr_optionLabel{flex:1;min-width:0;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
.dbr_optionValue{text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--dsw-alias-label-tertiary);min-width:0;overflow:hidden}
.dbr_check{color:var(--dsw-alias-state-business-primary);flex:0 0 14px;display:grid;place-items:center}
.dbr_divider{height:1px;background:var(--dsw-alias-border-l1);margin:4px 4px;flex:none}
.dbr_status{color:var(--dsw-alias-label-tertiary);padding:8px;font-size:12px;line-height:18px}
.dbr_back{display:flex;align-items:center;gap:4px;color:var(--dsw-alias-label-secondary);font-size:12px;padding:4px 8px;cursor:pointer;background:0 0;border:none}
.dbr_back:hover{color:var(--dsw-alias-label-primary)}
.dbr_effortLabel{display:flex;align-items:center;justify-content:space-between;padding:8px 12px 2px}
.dbr_effortName{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);transition:color .18s}
.dbr_effortName[data-max]{background:linear-gradient(90deg,#b99ee2,#8f62d4);-webkit-background-clip:text;background-clip:text;color:transparent}
.dbr_effortDef{font-size:11px;color:var(--dsw-alias-label-caption);border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:1px 6px;line-height:15px}
/* --- capsule slider (Claude-style) --- */
.dbr_track2{position:relative;height:40px;margin:4px 12px 0;flex:none;cursor:pointer;touch-action:none;user-select:none;border-radius:999px;outline-offset:2px}
.dbr_track2:focus-visible{outline:2px solid color-mix(in srgb,var(--dsw-alias-state-business-primary) 45%,transparent)}
.dbr_rail{position:absolute;inset:7px 0;border-radius:999px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover,#2a2a2a));box-shadow:inset 0 1px 2px rgba(0,0,0,.28),inset 0 -1px 0 rgba(255,255,255,.04)}
.dbr_fill{position:absolute;top:7px;bottom:7px;left:0;width:0;border-radius:999px 0 0 999px;background:linear-gradient(90deg,#dccdf0 0%,#c8b2e8 32%,#b99ee2 56%,#a583dd 78%,#8f62d4 100%);transition:width .18s cubic-bezier(.22,.61,.36,1);pointer-events:none}
.dbr_track2.dbr_dragging .dbr_fill{transition:none}
.dbr_dot{position:absolute;top:50%;left:0;width:5px;height:5px;border-radius:999px;background:rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(0,0,0,.25);transform:translate(-50%,-50%);pointer-events:none;transition:background .15s,opacity .15s}
.dbr_dotOn{background:#fff;opacity:.95}
.dbr_thumb2{position:absolute;top:50%;left:0;width:24px;height:26px;border-radius:8px;transform:translate(-50%,-50%);background:linear-gradient(180deg,#ffffff,#f6f3fb 52%,#ece7f5);border:1px solid rgba(76,70,65,.15);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 1px rgba(76,70,65,.05),0 1px 2px rgba(62,56,50,.12),0 4px 10px rgba(62,56,50,.08);cursor:grab;transition:left .18s cubic-bezier(.22,.61,.36,1),transform .18s;pointer-events:none}
.dbr_thumb2::before,.dbr_thumb2::after{content:"";position:absolute;top:50%;width:1.5px;height:38%;border-radius:999px;background:rgba(76,70,65,.25);opacity:0;transform:translateY(-50%);transition:opacity .14s}
.dbr_thumb2::before{left:42%}.dbr_thumb2::after{right:42%}
.dbr_track2:hover .dbr_thumb2::before,.dbr_track2:hover .dbr_thumb2::after,.dbr_track2:focus-visible .dbr_thumb2::before,.dbr_track2:focus-visible .dbr_thumb2::after,.dbr_track2.dbr_dragging .dbr_thumb2::before,.dbr_track2.dbr_dragging .dbr_thumb2::after{opacity:1}
.dbr_track2.dbr_dragging .dbr_thumb2{cursor:grabbing;transition:none;transform:translate(-50%,-50%) scale(.96)}
`;

    function ensureStyle() {
      const id = 'dsh-better-reasoning-css';
      if (typeof document === 'undefined' || document.querySelector(`style[data-dbr="${id}"]`)) return;
      const tag = document.createElement('style');
      tag.dataset.dbr = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    const Check = () => h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true },
      h('path', { d: 'M6.5 11.5 3 8l1-1 2.5 2.5L12 5l1 1z', fill: 'currentColor' }));
    const Chevron = ({ open, dir }) => h('svg', { viewBox: '0 0 16 16', width: 12, height: 12, 'aria-hidden': true, className: 'dbr_chevron' + (open ? ' dbr_chevronOpen' : ''), style: dir === 'right' ? { transform: 'rotate(-90deg)' } : undefined },
      h('path', { d: 'M4 6l4 4 4-4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));

    function useStore(store) {
      return useSyncExternalStore((cb) => store.subscribe(cb), () => store.getSnapshot(), () => store.getSnapshot());
    }

    // Boundary: a render throw must not abdicate the slot entry for good.
    class SafeSelect extends React.Component {
      constructor(p) { super(p); this.state = { err: null }; }
      static getDerivedStateFromError(err) { return { err }; }
      render() {
        if (this.state.err) {
          return h('button', { type: 'button', className: 'dbr_trigger', disabled: true, title: String(this.state.err?.message ?? this.state.err) },
            h('span', { className: 'dbr_triggerLabel' }, 'Model'));
        }
        return h(ModelEffortSelect, this.props);
      }
    }

    function ModelEffortSelect(props) {
      ensureStyle();
      const { available, directory, load, select, locked } = props;
      const snap = useStore(directory);
      const [open, setOpen] = React.useState(false);
      const [pane, setPane] = React.useState('effort'); // 'effort' | 'model'
      const [query, setQuery] = React.useState('');
      const [menuPos, setMenuPos] = React.useState(null);
      const [dragIdx, setDragIdx] = React.useState(null); // hoisted: unconditional hook
      const rootRef = React.useRef(null);
      const menuRef = React.useRef(null);
      const trackRef = React.useRef(null); // hoisted: hooks must run unconditionally

      React.useEffect(() => { if (open) load?.(); }, [open]);
      React.useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
          if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
          setOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => { document.removeEventListener('mousedown', onDown, true); document.removeEventListener('keydown', onKey, true); };
      }, [open]);
      // Position menu after mount so real offsetHeight/offsetWidth are known;
      // opens upward like the shipped selector. Re-run on pane/size changes.
      React.useEffect(() => {
        if (!open) return;
        const place = () => {
          const rect = rootRef.current?.getBoundingClientRect();
          if (!rect) return;
          const lh = menuRef.current?.offsetHeight ?? 0;
          const lw = menuRef.current?.offsetWidth ?? 0;
          const M = 8;
          const top = Math.max(M, Math.min(rect.top - 6 - lh, window.innerHeight - lh - M));
          const left = Math.max(M, Math.min(rect.right - lw, window.innerWidth - lw - M));
          setMenuPos({ top, left });
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
      }, [open, pane, snap]);

      const current = snap?.current ?? null;
      const groups = snap?.groups ?? [];
      const disabled = locked || available === false || snap?.status === 'selecting';

      const findModel = (provider, modelId) => {
        for (const g of groups) for (const m of g.models ?? []) if (g.id === provider && m.id === modelId) return m;
        return undefined;
      };
      const currentModel = current ? findModel(current.provider, current.model) : undefined;
      const efforts = currentModel?.reasoning?.efforts ?? [];
      const defaultEffort = currentModel?.reasoning?.defaultEffort;
      const activeEffort = current?.reasoningEffort ?? defaultEffort;
      const effortLabel = activeEffort === undefined ? undefined : (efforts.find((e) => e.id === activeEffort)?.name ?? snap?.retainedEffort ?? activeEffort);
      const modelLabel = currentModel?.name ?? current?.model ?? 'Select model';
      const triggerLabel = effortLabel ? `${modelLabel} · ${effortLabel}` : modelLabel;

      const chooseModel = async (provider, model) => { await select?.({ provider, model }); setPane('effort'); };
      const chooseEffort = async (id) => {
        if (!current) return;
        await select?.({ provider: current.provider, model: current.model, reasoningEffort: id });
      };

      const trigger = h('button', {
        ref: rootRef, type: 'button', className: 'dbr_trigger', disabled,
        'aria-haspopup': 'menu', 'aria-expanded': open,
        onClick: () => setOpen((v) => !v),
      },
        h('span', { className: 'dbr_triggerLabel' }, snap?.status === 'loading' && !current ? 'Loading…' : triggerLabel),
        h(Chevron, { open }));

      let menu = null;
      if (open) {
        const style = menuPos ? { top: menuPos.top, left: menuPos.left } : { visibility: 'hidden', top: 0, left: 0 };
        const children = [];

        if (pane === 'model') {
          children.push(h('button', { key: 'back', type: 'button', className: 'dbr_back', onClick: () => setPane('effort') },
            h(Chevron, { dir: 'right' }), '思考等级'));
          children.push(h('input', {
            key: 'search', className: 'dbr_option', autoFocus: true, placeholder: 'Search models…',
            value: query, onChange: (e) => setQuery(e.target.value),
            style: { cursor: 'text', position: 'sticky', top: 0, background: 'inherit' },
          }));
          const list = [];
          const q = query.trim().toLowerCase();
          for (const g of groups) {
            const models = (g.models ?? []).filter((m) => !q || m.name?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
            if (models.length === 0) continue;
            list.push(h('div', { key: `g:${g.id}`, className: 'dbr_section' }, g.name ?? g.id));
            for (const m of models) {
              const active = current && current.provider === g.id && current.model === m.id;
              list.push(h('button', {
                key: `${g.id}/${m.id}`, type: 'button', className: 'dbr_option',
                onClick: () => chooseModel(g.id, m.id),
              },
                h('span', { className: 'dbr_check' }, active ? h(Check) : null),
                h('span', { className: 'dbr_optionLabel' }, m.name ?? m.id),
                m.reasoning?.efforts?.length ? h('span', { className: 'dbr_optionValue' }, `${m.reasoning.efforts.length} 档`) : null));
            }
          }
          children.push(h('div', { key: 'models', className: 'dbr_list' }, list.length ? list : h('div', { className: 'dbr_status' }, 'No models')));
        } else {
          // effort pane: segmented labels + draggable slider, then a "Model ›" row
          children.push(h('div', { key: 'sec', className: 'dbr_section' }, '思考等级'));
          if (!current) {
            children.push(h('div', { key: 'none', className: 'dbr_status' }, 'Select a model first'));
          } else if (efforts.length === 0) {
            children.push(h('div', { key: 'none', className: 'dbr_status' }, '该模型无可调思考等级'));
          } else {
            const activeIdx = Math.max(0, efforts.findIndex((e) => e.id === activeEffort));
            const maxIdx = Math.max(0, efforts.length - 1);
            const nameOf = (e) => e.name ?? e.id;
            // local drag index so the thumb glides without firing select() per pixel;
            // commit (select) only on pointerup / key.
            const shownIdx = dragIdx ?? activeIdx;
            const idxFromX = (clientX) => {
              const r = trackRef.current?.getBoundingClientRect();
              if (!r || r.width <= 0) return shownIdx;
              const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
              return Math.round(t * maxIdx);
            };
            const commit = (i) => { if (efforts[i] && i !== activeIdx) chooseEffort(efforts[i].id); };
            const onPointerDown = (ev) => {
              ev.preventDefault();
              const el = ev.currentTarget;
              el.classList.add('dbr_dragging');
              el.setPointerCapture?.(ev.pointerId);
              setDragIdx(idxFromX(ev.clientX));
              const move = (e) => setDragIdx(idxFromX(e.clientX));
              const up = (e) => {
                const i = idxFromX(e.clientX);
                el.classList.remove('dbr_dragging');
                el.releasePointerCapture?.(e.pointerId);
                window.removeEventListener('pointermove', move, true);
                window.removeEventListener('pointerup', up, true);
                setDragIdx(null);
                commit(i);
              };
              window.addEventListener('pointermove', move, true);
              window.addEventListener('pointerup', up, true);
            };
            const onKey = (ev) => {
              const n = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[ev.key];
              if (n !== undefined) { ev.preventDefault(); commit(Math.min(maxIdx, Math.max(0, activeIdx + n))); }
              else if (ev.key === 'Home') { ev.preventDefault(); commit(0); }
              else if (ev.key === 'End') { ev.preventDefault(); commit(maxIdx); }
            };
            const pct = maxIdx === 0 ? 0 : (shownIdx / maxIdx) * 100;
            const frac = shownIdx / Math.max(1, maxIdx);
            const shown = efforts[shownIdx];
            const isMax = shown?.id === 'max';
            // thumb is 24px wide; keep its center inside the rail so it never
            // overhangs the ends — offset by half its width at both extremes.
            const px = (f) => `calc(12px + (100% - 24px) * ${f.toFixed(4)})`;
            children.push(h('div', { key: 'lbl', className: 'dbr_effortLabel' },
              h('span', { className: 'dbr_effortName', ...(isMax ? { 'data-max': '' } : {}) }, nameOf(shown)),
              shown?.id === defaultEffort ? h('span', { className: 'dbr_effortDef' }, '默认') : null));
            children.push(h('div', {
              key: 'track', ref: trackRef, className: 'dbr_track2' + (isMax ? ' dbr_atMax' : ''), role: 'slider', tabIndex: 0,
              'aria-label': '思考等级', 'aria-valuemin': 0, 'aria-valuemax': maxIdx, 'aria-valuenow': shownIdx,
              'aria-valuetext': nameOf(shown) ?? String(shownIdx),
              onPointerDown, onKeyDown: onKey,
            },
              h('div', { className: 'dbr_rail' }),
              h('div', { className: 'dbr_fill', style: { width: px(frac) } }),
              efforts.map((e, i) => maxIdx === 0 ? null :
                h('span', { key: e.id, className: 'dbr_dot' + (i <= shownIdx ? ' dbr_dotOn' : ''), style: { left: px(i / maxIdx) } })),
              h('div', { className: 'dbr_thumb2', style: { left: px(frac) } })));
          }
          children.push(h('div', { key: 'div', className: 'dbr_divider' }));
          children.push(h('button', { key: 'model', type: 'button', className: 'dbr_option', onClick: () => setPane('model') },
            h('span', { className: 'dbr_optionLabel' }, '模型'),
            h('span', { className: 'dbr_optionValue' }, modelLabel),
            h(Chevron, { dir: 'right' })));
        }
        if (snap?.error) children.push(h('div', { key: 'err', className: 'dbr_status' }, String(snap.error)));

        menu = h('div', { ref: menuRef, className: 'dbr_menu', role: 'menu', style }, children);
      }
      return h('div', { className: 'dbr_root' }, trigger, menu);
    }

    return {
      inject: ['slots', 'remote', 'remote.session', 'modelDirectories', 'sessions'],
      apply(ctx) {
        ctx.inject(['slots', 'remote', 'remote.session', 'modelDirectories', 'sessions'], (scope) => {
          const models = scope.modelDirectories;
          const sessions = scope.sessions;
          try {
            scope.slots.inject('conversation.input.model', () => scope.slots.register({
              name: 'conversation.input.model',
              priority: -10,
              inject: (sessionId) => {
                const directory = models.directoryFor(sessionId);
                const available = sessions.subagentAddress(sessionId) === void 0;
                return {
                  available,
                  directory: directory.store,
                  load: () => { if (available) directory.load().catch(() => {}); },
                  select: (selection) => (available ? directory.select(selection) : Promise.resolve(undefined)),
                };
              },
            }, (slotProps) => h(SafeSelect, slotProps)));
          } catch (e) {
            try { console?.warn?.('dsh-better-reasoning: slot inject failed', e); } catch {}
          }
        });
      },
    };
  },
});
