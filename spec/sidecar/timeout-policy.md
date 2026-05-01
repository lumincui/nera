# Sidecar 超时策略

## Pending permission 超时

- pending permission 的超时时间跟随 agent hook 的最大允许时间。
- Nera 不独立拍脑袋定义统一超时时间。
- 不同 agent adapter 可以根据对应 agent 的 hook 能力设置超时时间。
- 如果某个 agent hook 的最大等待时间未知，该 adapter 需要先明确能力边界，再进入实现。
- pending permission 超时后，Nera 不自动 approve，也不自动 deny。
- 超时后由 agent 原生行为处理 hook timeout / fallback。
- Nera 只负责把 pending permission 标记为 expired。

## 原因

pending permission 能否继续返回给 agent，取决于原 hook process 是否仍在等待 response。

因此真正的上限不是 Nera server 或 touchpoint 想等待多久，而是：

```text
agent hook 能阻塞等待多久
```

## 对 adapter 的要求

每个 agent adapter 需要暴露：

- 是否支持阻塞式 permission response。
- permission hook 最大等待时间。
- 超时后 agent 的行为。
- 超时后 sidecar 应如何返回状态给 server。

## Touchpoint 影响

- touchpoint 审批卡片的 `expires_at` 应由 sidecar / adapter 根据 hook 最大等待时间计算后上报。
- touchpoint 不应该展示超过 `expires_at` 仍可点击的审批能力。
- 如果用户点击过期卡片，server 应返回 expired / stale。
