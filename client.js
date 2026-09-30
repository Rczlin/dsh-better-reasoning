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
.dbr_menu{z-index:1100;width:max-content;min-width:min(240px,calc(100vw - 32px));max-width:min(420px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);border:0;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-elevated,#1e1e1e));flex-direction:column;padding:4px;display:flex;position:fixed;overflow:hidden}
.dbr_section{flex-shrink:0;color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px;padding:6px 8px 2px;text-transform:uppercase;letter-spacing:.04em}
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

    function ModelEffortSelect(props) {
      ensureStyle();
      const { available, directory, load, select, locked } = props;
      const snap = useStore(directory);
      const [open, setOpen] = React.useState(false);
      const [pane, setPane] = React.useState('effort'); // 'effort' | 'model'
      const [query, setQuery] = React.useState('');
      const rootRef = React.useRef(null);
      const menuRef = React.useRef(null);

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
      const pending = snap?.pending;
      const disabled = locked || available === false || snap?.status === 'selecting';

      // find reasoning metadata for the current selection from the catalog groups
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

      const chooseModel = async (provider, model) => {
        await select?.({ provider, model });
        setPane('effort');
      };
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
          // effort pane: thinking levels on top, then a "Model ›" row
          children.push(h('div', { key: 'sec', className: 'dbr_section' }, '思考等级'));
          const opts = [];
          if (!current) {
            opts.push(h('div', { key: 'none', className: 'dbr_status' }, 'Select a model first'));
          } else if (efforts.length === 0) {
            opts.push(h('div', { key: 'none', className: 'dbr_status' }, '该模型无可调思考等级'));
          } else {
            for (const e of efforts) {
              const active = e.id === activeEffort;
              opts.push(h('button', {
                key: e.id, type: 'button', className: 'dbr_option', onClick: () => chooseEffort(e.id),
              },
                h('span', { className: 'dbr_check' }, active ? h(Check) : null),
                h('span', { className: 'dbr_optionLabel' }, e.name ?? e.id),
                e.id === defaultEffort ? h('span', { className: 'dbr_optionValue' }, '默认') : null));
            }
          }
          children.push(h('div', { key: 'efforts', className: 'dbr_list' }, opts));
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
      inject: ['slots', 'modelDirectories', 'sessions'],
      apply(ctx) {
        ctx.inject(['slots', 'modelDirectories', 'sessions'], (scope) => {
          const models = scope.modelDirectories;
          const sessions = scope.sessions;
          scope.slots.inject('conversation.input.model', () => scope.slots.register({
            name: 'conversation.input.model',
            priority: -10,
            locale: undefined,
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
          }, (slotProps) => h(ModelEffortSelect, slotProps)));
        });
      },
    };
  },
});
