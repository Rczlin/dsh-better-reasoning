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
.dbr_seg{display:flex;gap:2px;padding:4px 6px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover,transparent);margin:2px 6px 4px}
.dbr_segBtn{flex:1;min-width:0;border:none;cursor:pointer;border-radius:var(--dsw-radius-sm);padding:5px 4px;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);background:0 0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .1s,color .1s}
.dbr_segBtn:hover:not(:disabled):not(.dbr_segOn){background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-interactive-bg-hover))}
.dbr_segOn{background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-onAccent,#fff)}
.dbr_segDefault{color:var(--dsw-alias-label-caption)}
.dbr_track{position:relative;height:16px;margin:4px 10px 10px;flex:none;cursor:pointer;touch-action:none;user-select:none}
.dbr_trackRail{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:var(--dsw-alias-border-l1)}
.dbr_trackFill{position:absolute;left:0;top:50%;height:4px;margin-top:-2px;border-radius:2px;background:var(--dsw-alias-state-business-primary)}
.dbr_thumb{position:absolute;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:var(--dsw-alias-state-business-primary);border:2px solid var(--dsw-alias-bg-module-platform,#fff);transform:translateX(-50%);box-shadow:0 0 0 1px var(--dsw-alias-border-l1);cursor:grab;transition:left .08s}
.dbr_track.dragging .dbr_thumb{cursor:grabbing;transition:none}
.dbr_track:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.dbr_ticks{position:absolute;left:0;right:0;top:50%;height:4px;pointer-events:none}
.dbr_tick{position:absolute;top:50%;width:1px;height:4px;margin-top:-2px;background:var(--dsw-alias-label-dimmed);opacity:.5;transform:translateX(-0.5px)}
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
        const rect = rootRef.current?.getBoundingClientRect();
        const style = rect ? { top: Math.max(8, rect.bottom + 4), left: Math.max(8, Math.min(rect.left, (window.innerWidth || 1000) - 432)) } : {};
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
            const SHORT = { off: 'Off', minimal: 'Min', low: 'Low', medium: 'Med', high: 'High', xhigh: 'XHi', max: 'Max' };
            const seg = h('div', { key: 'seg', className: 'dbr_seg', role: 'radiogroup', 'aria-label': '思考等级' },
              efforts.map((e) => {
                const active = e.id === activeEffort;
                return h('button', {
                  key: e.id, type: 'button', role: 'radio', 'aria-checked': active,
                  className: 'dbr_segBtn' + (active ? ' dbr_segOn' : ''),
                  onClick: () => chooseEffort(e.id),
                  title: `${e.name ?? e.id}${e.id === defaultEffort ? ' (默认)' : ''}`,
                }, SHORT[e.id] ?? e.name ?? e.id, e.id === defaultEffort ? h('span', { className: 'dbr_segDefault' }, ' ·') : null);
              }));
            const idxFromX = (clientX) => {
              const r = trackRef.current?.getBoundingClientRect();
              if (!r || r.width <= 0) return activeIdx;
              const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
              return Math.round(t * maxIdx);
            };
            const applyAt = (clientX) => {
              const i = idxFromX(clientX);
              if (i !== activeIdx && efforts[i]) chooseEffort(efforts[i].id);
            };
            const onPointerDown = (ev) => {
              ev.preventDefault();
              const el = ev.currentTarget;
              el.classList.add('dragging');
              el.setPointerCapture?.(ev.pointerId);
              applyAt(ev.clientX);
              const move = (e) => applyAt(e.clientX);
              const up = (e) => {
                el.classList.remove('dragging');
                el.releasePointerCapture?.(e.pointerId);
                window.removeEventListener('pointermove', move, true);
                window.removeEventListener('pointerup', up, true);
              };
              window.addEventListener('pointermove', move, true);
              window.addEventListener('pointerup', up, true);
            };
            const onKey = (ev) => {
              if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { ev.preventDefault(); if (activeIdx > 0) chooseEffort(efforts[activeIdx - 1].id); }
              else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { ev.preventDefault(); if (activeIdx < maxIdx) chooseEffort(efforts[activeIdx + 1].id); }
              else if (ev.key === 'Home') { ev.preventDefault(); chooseEffort(efforts[0].id); }
              else if (ev.key === 'End') { ev.preventDefault(); chooseEffort(efforts[maxIdx].id); }
            };
            const pct = maxIdx === 0 ? 0 : (activeIdx / maxIdx) * 100;
            const track = h('div', {
              key: 'track', ref: trackRef, className: 'dbr_track', role: 'slider', tabIndex: 0,
              'aria-label': '思考等级', 'aria-valuemin': 0, 'aria-valuemax': maxIdx, 'aria-valuenow': activeIdx,
              'aria-valuetext': efforts[activeIdx]?.name ?? String(activeIdx),
              onPointerDown, onKeyDown: onKey,
            },
              h('div', { className: 'dbr_trackRail' }),
              h('div', { className: 'dbr_trackFill', style: { width: `${pct.toFixed(1)}%` } }),
              h('div', { className: 'dbr_ticks' },
                efforts.map((e, i) => maxIdx === 0 ? null : h('span', { key: e.id, className: 'dbr_tick', style: { left: `${((i / maxIdx) * 100).toFixed(1)}%` } }))),
              h('div', { className: 'dbr_thumb', style: { left: `${pct.toFixed(1)}%` } }));
            children.push(seg, track);
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
