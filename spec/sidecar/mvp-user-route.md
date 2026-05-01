# MVP User Route

## 路线目标

最简单的 user 路线是：

```text
agent 审查权限和完成
  -> Nera 给到通知和审批能力
```

第一版聚焦两类 agent -> human 事件：

- 权限审查：agent 需要用户 approve / deny。
- 完成通知：agent 完成当前任务或当前 turn，通知用户查看。

第一版不把普通 human input 作为主路径，只保留为后续扩展或辅助能力。

## 最小闭环

### 权限审查闭环

```text
agent 触发 permission request
  -> hook CLI 收到事件
  -> sidecar daemon 记录 pending permission
  -> sidecar daemon 上报 Nera server
  -> Nera server 推送 touchpoint
  -> 用户在 touchpoint approve / deny
  -> Nera server 将审批结果投递给 sidecar daemon
  -> sidecar daemon 找到 pending permission
  -> sidecar daemon 返回 hook response
  -> agent 继续或中止
```

### 完成通知闭环

```text
agent 完成任务 / turn
  -> hook CLI 收到完成事件
  -> sidecar daemon 上报 Nera server
  -> Nera server 推送 touchpoint
  -> 用户在 touchpoint 查看结果
```

## 已设计到的部分

- sidecar 采用 thin CLI + 常驻 daemon。
- sidecar daemon 通过 polling / long polling 主动拉取服务器消息。
- polling 粒度是 sidecar 级别，消息携带 `session_id`。
- `session_id` 复用 coding agent 原生 session id。
- sidecar 本地维护 session registry。
- 服务器消息不直接注入 agent，由 sidecar daemon 在本机完成注入。
- approve / deny 优先通过 pending hook response 注入。
- 普通 human input 第一版可以通过 terminal stdin injection 注入，但不是本路线的第一主路径。
- touchpoint 通过 APNs 接收主动推送，不需要像 sidecar 一样维护长连接。
- touchpoint 卡片交互已经画过原型图。
- 第一版 pending permission 不持久化；sidecar daemon 重启时所有 pending permission 失效。
- pending permission 的超时时间跟随 agent hook 的最大允许时间。
- pending permission 超时后，Nera 不自动 approve，也不自动 deny；由 agent 原生行为处理 hook timeout / fallback。

## 还没设计清楚的部分

### 1. Permission request 的标准事件模型

需要定义 sidecar 上报给 Nera server 的权限请求字段，例如：

- `event_id`
- `sidecar_id`
- `agent_type`
- `session_id`
- `request_id`
- `tool_name`
- `tool_use_id`
- `title`
- `summary`
- `risk_preview`
- `cwd`
- `command` / `affected_path`
- `created_at`
- `expires_at`

### 2. Approval response 的标准消息模型

需要定义 touchpoint 审批后，server 下发给 sidecar 的消息字段，例如：

- `message_id`
- `sidecar_id`
- `agent_type`
- `session_id`
- `request_id`
- `type`: `approval_response`
- `decision`: `approve` / `deny`
- `created_at`

### 3. Pending permission 的生命周期

已确认第一版不持久化 pending permission；sidecar daemon 重启时所有 pending permission 失效。详细记录见 `pending-permission-lifecycle.md`。

仍需要设计：

- 用户超时未审批时如何处理。
- agent hook 是否允许长时间阻塞。
- 如果 hook 超时，touchpoint 上的审批卡片如何失效。

### 4. 完成事件的标准模型

需要定义完成通知字段，例如：

- `event_id`
- `sidecar_id`
- `agent_type`
- `session_id`
- `summary`
- `result_preview`
- `cwd`
- `transcript_path`
- `created_at`

### 5. 通知状态与去重

需要设计：

- 同一个 permission request 多次上报时如何去重。
- 同一个 completion 多次上报时如何去重。
- touchpoint 通知是否需要 collapse key。
- 用户已经处理审批后，其他设备上的通知如何更新或撤销。

### 6. Delivery ack

需要设计至少两层 ack：

- sidecar daemon 上报事件给 server 后，server ack。
- sidecar daemon 从 server 拉到审批消息后，sidecar ack。

如果没有 ack，可能出现：

- 审批卡片发出但 server 没记录成功。
- approve / deny 到了 sidecar 但未成功返回给 hook。
- retry 后重复 approve / deny。

### 7. Touchpoint 卡片交互

卡片交互已经画过原型图；后续需要将原型图转写为实现规格或引用到 spec 中。

仍需要确认：

- 原型图是否作为第一版 touchpoint 卡片交互的 source of truth。
- 原型图文件或链接放在哪里。

### 8. 安全边界

需要明确：

- 哪些权限可以远程 approve。
- 是否需要二次确认高风险命令。
- touchpoint 到 server 的身份认证。
- server 到 sidecar 的消息签名或鉴权。
- sidecar 是否要验证审批来自同一用户。

### 9. 第一版失败处理

需要定义失败状态：

- sidecar offline。
- session 不存在。
- pending permission 不存在或已过期。
- hook 已经超时。
- approval response 注入失败。
- completion notification 发送失败。

### 10. Agent-specific hook 能力差异

第一版如果优先 Codex，需要明确：

- Codex 哪个 hook 对应 permission request。
- Codex hook 是否支持阻塞等待 approve / deny。
- Codex hook response stdout schema 是什么。
- Codex completion 事件来自哪个 hook。

## 下一个优先设计点

为了走通最简单 user 路线，下一步优先设计：

1. Permission request event schema。
2. Approval response message schema。
3. Pending permission 生命周期。
4. Completion event schema。

其中最关键的是 pending permission 生命周期，因为它决定用户审批是否能可靠返回 agent。
