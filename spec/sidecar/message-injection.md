# Sidecar 消息注入

## 已确认方向

- 第一版接受通过 terminal stdin injection 注入普通 human input。
- 优先目标是先走通 `touchpoint -> Nera server -> sidecar daemon -> agent session` 的完整流程。
- 服务器不直接注入 agent 会话，只负责把消息投递给本机 sidecar daemon。
- 真正注入由 sidecar daemon 在本机完成。

## 注入通道

### Control channel

用于需要语义化响应的阻塞交互：

- approve
- deny
- answer blocking question
- 返回 pending hook response

如果 sidecar daemon 中存在对应 `session_id` 的 pending hook，优先通过 pending hook response 完成注入。

### Text input channel

用于普通 human input：

- 继续
- 补充要求
- 修改方向
- 普通用户指令

第一版通过 terminal stdin injection 完成。

## 普通 human input 注入流程

```text
touchpoint
  -> Nera server
  -> sidecar daemon polling 拉取消息
  -> sidecar daemon 根据 session_id 查本地 session registry
  -> sidecar daemon 得到 agent_type 和 jump_target
  -> sidecar daemon 选择 adapter
  -> adapter 将文本注入 terminal stdin
```

## 本地 session registry 的必要字段

sidecar daemon 需要维护本地 session registry。每个 session 至少需要：

- `session_id`：复用 coding agent 原生 session id。
- `agent_type`：例如 `codex`、`claude_code`、`opencode`。
- `jump_target`：用于定位本机 agent 会话。
- `pending_hook`：如果当前 session 正在等待 hook response，则记录 pending 状态。

`jump_target` 可以包含：

- terminal app
- terminal session id
- terminal TTY
- tmux target
- tmux socket path
- working directory
- pane title

## 注入策略优先级

sidecar daemon 收到服务器消息后：

1. 如果消息是 approve / deny / answer blocking question，且存在对应 pending hook，则通过 pending hook response 注入。
2. 如果消息是普通 human input，第一版通过 terminal stdin injection 注入。
3. 如果以后 agent 提供 local API / IPC，可以在 adapter 中替换 terminal stdin injection。
4. 如果找不到 session 或 jump target，则标记 delivery failed。

## Terminal stdin injection

第一版把普通 human input 当作用户在终端中输入：

- 对 tmux：使用 `tmux send-keys -t <target> -l <text>`，再发送 Enter。
- 对支持 AppleScript 的 terminal：定位目标 terminal / pane 后，输入文本并发送 Enter。

## 对 server message 的要求

服务器下发给 sidecar daemon 的消息至少包含：

```json
{
  "message_id": "...",
  "sidecar_id": "...",
  "agent_type": "codex",
  "session_id": "...",
  "type": "human_input",
  "payload": {
    "text": "继续实现 polling"
  }
}
```

其中：

- `sidecar_id` 用于投递到对应开发机。
- `session_id` 用于 sidecar 本地查找 agent session。
- `agent_type` 用于 adapter 分发。
- `type` 用于区分 control channel 和 text input channel。
