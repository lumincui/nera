# Sidecar

## 定位

- sidecar 嵌入到 coding agent。
- sidecar 用来传递和 coding agent 的交互和指令。
- sidecar 是异构的。
- sidecar 要支持从不同的 coding agent 完成交互。

## 设计状态

- 当前开始深入设计 sidecar 内部架构。

## 当前结构

- `runtime-model.md`：记录 sidecar 的运行形态。
- `message-injection.md`：记录服务器消息如何经由 sidecar 注入 agent 会话。
- `mvp-user-route.md`：记录最简单 user 路线及尚未设计清楚的部分。
- `permission-request-event.md`：记录 sidecar 上报给 Nera server 的权限请求事件模型。
- `pending-permission-lifecycle.md`：记录 pending permission 的生命周期。
- `timeout-policy.md`：记录 sidecar 的超时策略。
- `vibeisland-reverse-addressing.md`：记录 VibeIsland / Open Island 从消息反向寻址 agent 的参考实现。
- `heterogeneous-agents.md`：记录 sidecar 对异构 coding agent 的支持。
- `codex/`：记录 sidecar 在 Codex 中的实现。
