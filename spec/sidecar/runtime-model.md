# Sidecar 运行形态

## 已表达的关注

- 如果 sidecar 只是短生命周期 CLI，会担心服务器主动推送的消息如何接收。
- sidecar 在 NAT 后面时，需要考虑消息如何穿透并触达本机 sidecar。

## 已确认方向

- 排除纯短生命周期 CLI 作为完整 sidecar 形态。
- sidecar 需要由 Codex hook 调用的 thin CLI 和本地常驻 daemon 组成。
- thin CLI 负责接收 Codex hook 事件，并投递给本地 daemon。
- 本地 daemon 常驻，并主动向 Nera server 建立 outbound 连接，用于接收服务器侧消息。
- sidecar 在 NAT 后面时，不依赖服务器直接 inbound 触达，而依赖 sidecar 主动连出去。

## Touchpoint 长连接机制

- Nera server 到 touchpoint 的主动触达通过 APNs 完成。
- touchpoint 通过 APNs 接收服务器主动推送。
- 因为 touchpoint 可以借助 APNs 接收主动推送，所以不需要刻意维护长连接。

## 已确认的传输策略

- sidecar daemon 与 Nera server 之间先采用 polling / long polling。
- 优先目标是先让链路跑起来，再优化传输机制。
- WebSocket 可以作为后续优化方向。
- 即使先采用 polling，也需要避免把业务协议绑定死在 polling 上。
- polling 粒度采用 sidecar 级别。
- sidecar daemon 维护一个 polling loop，向 Nera server 拉取发给该 sidecar 的消息。
- polling 返回的消息需要携带 `session_id`，用于路由到具体 agent session。
- 这种方式允许一个 sidecar 管理多个 Codex session / Claude session / OpenCode session。
- `session_id` 直接复用 coding agent 自己的 session id。
- coding agent 自己的 session id 不容易冲突，因此不额外引入 Nera 内部 session id。

## 待澄清问题

- polling / long polling 的具体超时时间、重试策略和 cursor / ack 机制是什么。
- 服务器主动消息触达 sidecar 的具体协议是什么。
- sidecar 如何将携带 `session_id` 的消息分发给具体 agent session。
- 如果不同 coding agent 的 session id 理论上发生冲突，是否需要通过 `agent_type` 或 `sidecar_id` 共同构成唯一键。
