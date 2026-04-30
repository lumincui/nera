# Codex Sidecar

## 定位

- Codex 是 sidecar 优先考虑的 coding agent 实现。
- sidecar 在 Codex 中通过 hook 机制完成与 Codex 的嵌合。

## 外部知识 Reference

- Codex Hooks：https://developers.openai.com/codex/hooks
- Codex Config Reference：https://developers.openai.com/codex/config-reference

## Codex Hook 上下文

- Codex hooks 是 Codex 的扩展机制。
- Codex hooks 需要通过 `config.toml` 中的 `[features] codex_hooks = true` 启用。
- Codex 可以从 `hooks.json` 或 `config.toml` 中的 `[hooks]` 加载 hooks。
- Codex 当前相关 hook 事件包括 `PreToolUse`、`PermissionRequest`、`PostToolUse`、`UserPromptSubmit` 和 `Stop`。
- `PermissionRequest` 会在 Codex 即将请求 approval 时运行。
- `PreToolUse` 可以在工具调用执行前介入。
- `PostToolUse` 可以在工具调用执行后介入。
