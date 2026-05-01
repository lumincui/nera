# Codex Hook 能力调研

## 调研来源

- 本机 Codex CLI：`codex-cli 0.128.0`。
- OpenAI Codex 官方 Hooks 文档：`https://developers.openai.com/codex/hooks`。
- OpenAI Codex 官方配置文档：`https://developers.openai.com/codex/config-reference`。
- OpenAI Codex 开源仓库 `openai/codex` 中的 hook runtime 与测试用例。

## 总体结论

Codex 当前提供 lifecycle hooks，可以支撑 Nera 第一版 MVP 的两类 agent -> human 事件：

1. `PermissionRequest`：在 Codex 即将向用户请求 approval 时触发，可由 hook 返回 allow / deny。
2. `Stop`：在 Codex turn 停止时触发，可用于完成通知。

因此第一版 Codex adapter 可以不侵入 Codex 本体，而是通过项目级或用户级 `.codex/hooks.json` / `config.toml` 注册 hooks，让 hook CLI 把事件交给 Nera sidecar daemon。

## Codex Hooks 基础

需要启用 feature flag：

```toml
[features]
codex_hooks = true
```

Codex 会从以下位置加载 hooks：

- `~/.codex/hooks.json`
- `~/.codex/config.toml`
- `<repo>/.codex/hooks.json`
- `<repo>/.codex/config.toml`

项目级 hooks 只有在项目 `.codex/` layer 被信任时加载。多个 hook source 会合并加载，不是覆盖关系。

每个 command hook 从 `stdin` 接收一个 JSON object。常见字段包括：

```text
session_id
transcript_path
cwd
hook_event_name
model
```

多数 turn-scoped hooks 还会带 `turn_id`。

hook `timeout` 单位是秒；如果省略，Codex 默认使用 `600` 秒。

## PermissionRequest 能力

### 触发时机

`PermissionRequest` 在 Codex 即将向用户请求 approval 时触发，例如：

- shell escalation。
- managed-network approval。
- 需要 approval 的 Bash / apply_patch / MCP tool。

它不会在不需要 approval 的命令上触发。

### matcher

`PermissionRequest.matcher` 作用于 `tool_name` 和 matcher aliases。

当前典型值包括：

```text
Bash
apply_patch
Edit
Write
mcp__server__tool
```

### 输入字段

除 common fields 外，`PermissionRequest` 会带：

```text
turn_id
tool_name
tool_input
tool_input.description
```

其中 Bash / apply_patch 常用 `tool_input.command`，MCP tool 会传全部 args。

### 输出字段

允许：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

拒绝：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "Blocked by Nera remote approval."
    }
  }
}
```

如果多个 matching hooks 返回 decision，`deny` 优先；否则任一 `allow` 会让请求继续，不再显示正常 approval prompt。如果没有 hook 做决定，Codex 走正常 approval flow。

### 对 Nera 的含义

Nera 的 hook CLI 可以在 `PermissionRequest` 里阻塞等待 sidecar daemon 返回 approval response，然后把结果作为上述 JSON 写到 stdout。

第一版 pending permission 的超时时间可以直接跟随 hook timeout。若不配置，Codex hook 默认 timeout 是 `600s`，但 Nera 第一版应显式配置 timeout，避免依赖默认值。

## Stop / 完成通知能力

### 触发时机

`Stop` 在 Codex turn 停止时触发。它适合用来做 completion notification。

### 输入字段

除 common fields 外，`Stop` 会带：

```text
turn_id
stop_hook_active
last_assistant_message
```

其中 `last_assistant_message` 可以作为第一版完成通知的摘要或 preview 来源。

### 输出行为

`Stop` 期望 stdout 是 JSON。

如果只做通知，hook 可以返回成功 JSON，让 Codex 正常结束。例如：

```json
{
  "continue": true
}
```

`Stop` 也支持 `decision: "block"` 或 `continue: false` 来让 Codex 继续，但这不是 Nera 第一版 completion notification 需要的能力。

## 推荐的第一版 Codex adapter 方案

### Hook 配置

项目级或用户级配置注册两个 hook：

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "Bash|apply_patch|Edit|Write|mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "nera-sidecar codex permission-request",
            "timeout": 600,
            "statusMessage": "Waiting for Nera approval"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "nera-sidecar codex stop",
            "timeout": 30,
            "statusMessage": "Notifying Nera"
          }
        ]
      }
    ]
  }
}
```

### Permission request flow

```text
Codex PermissionRequest hook
  -> nera-sidecar codex permission-request receives JSON on stdin
  -> hook CLI sends payload to local sidecar daemon
  -> daemon creates in-memory pending permission keyed by request_id
  -> daemon reports permission request to Nera server
  -> Nera server pushes touchpoint via APNs
  -> user approve / deny in touchpoint
  -> sidecar daemon receives approval response via polling
  -> hook CLI receives result from daemon
  -> hook CLI writes Codex PermissionRequest decision JSON to stdout
```

### Completion notification flow

```text
Codex Stop hook
  -> nera-sidecar codex stop receives JSON on stdin
  -> hook CLI sends completion event to local sidecar daemon
  -> daemon reports completion to Nera server
  -> Nera server pushes touchpoint via APNs
  -> hook CLI returns success JSON to Codex
```

## 第一版 event mapping

### Codex PermissionRequest -> Nera permission_request

可映射字段：

```text
agent_type = codex
session_id = input.session_id
turn_id = input.turn_id
request_id = derived from session_id + turn_id + tool_name + tool_input hash / run id
tool_name = input.tool_name
tool_use_id = absent in PermissionRequest input; use request_id instead
cwd = input.cwd
transcript_path = input.transcript_path
model = input.model
command = input.tool_input.command, when present
summary / risk_preview = input.tool_input.description, when present
created_at = sidecar receive time
expires_at = created_at + configured hook timeout
```

### Codex Stop -> Nera completion_event

可映射字段：

```text
agent_type = codex
session_id = input.session_id
turn_id = input.turn_id
cwd = input.cwd
transcript_path = input.transcript_path
model = input.model
summary = input.last_assistant_message
created_at = sidecar receive time
```

## 仍需验证 / 注意点

- `PermissionRequest` hook input 文档没有暴露 `tool_use_id`；第一版不能依赖 Codex tool_use_id 做 request id。
- `PermissionRequest` 不是所有 shell/tool 调用都会触发，只在 Codex 本来就要请求 approval 的场景触发。
- `PreToolUse` 可以提前 deny，但不能用于远程 approve，因为它不支持 allow / ask 生效；`permissionDecision: "allow"` 当前被解析但不支持，fail open。
- hook 多来源会合并执行。如果用户已有其他 `PermissionRequest` hook，`deny` 会优先，可能导致 Nera approve 也无法放行。
- hook command 的默认 timeout 是 `600s`，但 Nera 应显式配置，并把该 timeout 传到 touchpoint 的 `expires_at`。
- repo-local hooks 需要项目 `.codex/` layer 被信任；如果要稳定接管 Codex，用户级 hook 或安装器写入用户配置更可靠。
