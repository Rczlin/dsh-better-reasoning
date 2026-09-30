# dsh-better-reasoning

一个 [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) 插件,让第三方(pi-ai 路由)模型的**思考等级调节**开箱即用,并把模型选择器改成 Codex 式竖向两级面板。

## 它解决什么

DSH 默认情况下,第三方模型的"思考等级"(reasoning effort / thinking level)选择器**只有当你手动在 settings 里给该模型写了 `reasoningEfforts` 才会出现**。没写 = 没有调节 UI。

这个插件把那段手动声明变成自动回退。

## 思考等级回退链

对 pi-ai 适配器覆盖的每个 provider 的每个模型,插件包装 `ctx.llm` 的 `resolveModelInfo` / `resolveModelInfoFor` / `resolveCallFor` / `prepareCall`,在返回前补齐 `reasoning` 元数据,优先级:

```
1. 已定义(用户 settings 里的 reasoningEfforts / pi-ai 内置 catalog)→ 原样使用,不动
2. 云端 models.dev(https://models.dev/api.json)
     - reasoning_options[{type:"effort",values:[…]}] → 精确等级
     - {type:"toggle"} → off + 一档
3. 都没有 → 全部 7 档: off / minimal / low / medium / high / xhigh / max
```

- 已声明的模型绝不被覆盖。
- models.dev 标 `reasoning:false` 的模型保持无选项,不硬塞。
- 兜底全 7 档时,某些端点对不支持的等级可能 400——此时给该模型写 `reasoningEfforts` 收窄即可。

### 缓存

- models.dev 在插件激活时后台拉取,缓存到插件目录的 `models-dev-cache.json`(24h TTL)。
- 离线/拉取失败 → 用上次缓存;没缓存 → 直接全兜底,不阻塞。
- **手动刷新**:在会话里跑 `/better-reasoning-refresh`(强制重新拉取)。

## 模型选择器(Codex 式)

替换了 composer 里 `conversation.input.model` slot 的默认组件(priority `-10`,shadow 官方 `0`):

- 触发器 chip 显示 `模型 · 等级`,点开竖向浮层
- **上段 = 思考等级**:当前模型的所有档位 + provider 默认档,点击即选
- **下段 = `模型 ›` 行**:点开切到竖向模型列表(按 provider 分组,可搜索)
- 数据仍走 `modelDirectories` / `modelCatalog` remote,reasoning 元数据由 host 包装补全

## 安装

把仓库 clone / 复制到本地后,在 DSH 里:

```
plugin_manager → install_bundle → <本目录绝对路径>
```

或用 `dsh` CLI / Plugin Manager UI 添加 bundle。安装后**需要重启 DSH**(host 代码改动不热更)。

### 验证生效

1. 重启后打开一个会话,看 composer 的模型 chip 变成新样式
2. 选一个第三方模型,点 chip → 顶部应列出思考等级(之前没有的话)
3. `cordis_inspect_query Slots.listSubTree root=conversation.input.model` 应看到 `priority:-10 active:true`

## 配置

`cordis.patch.yml` 里该插件行可加:

```yaml
config:
  catalogUrl: https://models.dev/api.json   # 可换源
  autoRefresh: true                          # 激活时是否后台拉取
```

## 结构

| 文件 | 平台 | 作用 |
|---|---|---|
| `index.js` | host | 三层回退包装 + models.dev 缓存 + `/better-reasoning-refresh` |
| `client.js` | web | Codex 式竖向选择器 |
| `cordis.patch.yml` | – | bundle patch |
| `package.json` | – | manifest (`dsh.bundle.patch` + `dsh.client`) |

## 兼容性与限制

- 只作用于 **pi-ai adapter** 覆盖的 provider(openai/anthropic/openrouter/google/自定义 OpenAI 兼容端点等)。DeepSeek 官方账号路由不受影响。
- 包装依赖 `LlmRuntime` 的内部方法名(`resolveModelInfoFor`/`prepareCall`/`resolveCallConfig`),DSH 大版本升级后若方法名变化,增强会静默失效(原功能不受影响)——届时需更新插件。
- 全 7 档兜底是给"信息未知的模型"的最佳猜测;遇到端点拒绝某个等级,在该模型的 settings 写 `reasoningEfforts` 精确声明。

## License

MIT
