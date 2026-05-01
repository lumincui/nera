# Pending Permission 生命周期

## 已确认方向

- 第一版 pending permission 不持久化。
- pending permission 只存在 sidecar daemon 内存中。
- 如果 sidecar daemon 重启，所有 pending permission 失效。
- 失效原因是 pending hook response 依赖正在阻塞等待的 hook process；daemon 重启后，即使恢复本地记录，也通常无法再把 response 返回给原 hook process。

## 生命周期

```text
hook CLI 收到 permission request
  -> 连接 sidecar daemon
  -> sidecar daemon 创建 pending permission
  -> sidecar daemon 上报 Nera server
  -> Nera server 推送 touchpoint
  -> 用户 approve / deny
  -> Nera server 下发 approval response
  -> sidecar daemon 查找 pending permission
  -> sidecar daemon 返回 hook response
  -> pending permission 结束
```

## 结束状态

pending permission 可以通过以下方式结束：

- `approved`：用户批准，sidecar daemon 返回 allow 给 hook。
- `denied`：用户拒绝，sidecar daemon 返回 deny 给 hook。
- `expired`：用户超时未处理，或者 hook 等待超时。
- `lost`：sidecar daemon 重启或 pending hook connection 丢失。
- `not_found`：server 下发 approval response 时，本地已经没有对应 pending permission。

## 第一版行为

- sidecar daemon 内存中维护 `request_id -> pending permission`。
- 每个 pending permission 需要记录对应 hook connection / response handle。
- approval response 必须携带 `request_id`。
- 收到 approval response 后，如果找到 pending permission，则返回 hook response 并移除 pending。
- 如果找不到 pending permission，则返回 delivery failed / stale approval 给 server。
- sidecar daemon 重启后，不尝试恢复 pending permission。
- sidecar daemon 重启后，如果 server 仍下发旧 approval response，sidecar 应返回 stale / not_found。

## 对 touchpoint 的影响

- touchpoint 上的审批卡片需要能进入过期状态。
- 如果用户点击已经过期的审批卡片，server 应返回 stale / expired，而不是让用户误以为审批成功。
- 如果审批已经被处理，其他设备上的卡片应显示已处理或失效。

## 待澄清问题

- hook process 能等待多久。
- expired 后默认 deny 还是 fail open / fail closed。
- touchpoint 卡片过期状态如何展示。
