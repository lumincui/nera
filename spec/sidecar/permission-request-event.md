# Permission Request Event

## 定位

`permission_request` 是 sidecar daemon 上报给 Nera server 的权限审批事件。

第一版用于承载 coding agent 即将执行、且需要用户远程 approve / deny 的动作。

## 已确认方向

- 第一版采用统一的 `target` 结构描述被审批对象。
- 不在顶层展开 `command` / `affected_path` 等 agent-specific 字段。
- `target.kind` 用于区分 shell command、file edit、MCP tool 等不同审批目标。
- Server / touchpoint 主要依赖统一字段展示审批卡片，agent-specific 原始信息可以保留在 `target` 或后续扩展字段中。

## 第一版事件结构

```json
{
  "type": "permission_request",
  "event_id": "evt_...",
  "sidecar_id": "sidecar_...",
  "agent_type": "codex",
  "session_id": "codex-session-id",
  "turn_id": "codex-turn-id",
  "request_id": "req_...",
  "tool_name": "Bash",
  "permission_kind": "shell_command",
  "title": "Codex wants to run a command",
  "summary": "Run tests",
  "risk_preview": "May execute shell command in workspace",
  "cwd": "/Users/lumin/nera",
  "transcript_path": "/Users/lumin/.codex/...",
  "target": {
    "kind": "command",
    "command": "npm test"
  },
  "created_at": "2026-05-01T00:00:00Z",
  "expires_at": "2026-05-01T00:10:00Z"
}
```

## 字段说明

- `type`：固定为 `permission_request`。
- `event_id`：事件 id，用于 server 接收 sidecar 上报事件时去重。
- `sidecar_id`：开发机上的 sidecar 标识。
- `agent_type`：发起请求的 agent 类型，例如 `codex`。
- `session_id`：复用 coding agent 原生 session id。
- `turn_id`：agent 当前 turn id；如果某个 agent 没有 turn 概念，可以为空或省略。
- `request_id`：审批请求 id，用于后续 approval response 回到 sidecar 时匹配 pending permission。
- `tool_name`：agent hook 中的工具名，例如 Codex 的 `Bash` / `apply_patch` / MCP tool name。
- `permission_kind`：Nera 归一化后的权限类型。
- `title`：给 touchpoint 审批卡片展示的短标题。
- `summary`：给用户看的动作摘要。
- `risk_preview`：给用户看的风险提示。
- `cwd`：agent 会话当前工作目录。
- `transcript_path`：agent transcript 路径，用于后续跳转或排查。
- `target`：被审批对象的统一描述。
- `created_at`：sidecar 创建审批事件的时间。
- `expires_at`：审批过期时间，由 adapter 根据 hook timeout 计算。

## Target 结构

### Command target

```json
{
  "kind": "command",
  "command": "npm test"
}
```

### File edit target

```json
{
  "kind": "file_edit",
  "path": "src/main.ts"
}
```

### MCP tool target

```json
{
  "kind": "mcp_tool",
  "server": "filesystem",
  "tool": "write_file",
  "args_preview": {}
}
```

## Codex 映射

Codex `PermissionRequest` hook 可以映射为：

```text
agent_type = codex
session_id = input.session_id
turn_id = input.turn_id
request_id = derived from session_id + turn_id + tool_name + tool_input hash / local run id
tool_name = input.tool_name
cwd = input.cwd
transcript_path = input.transcript_path
command = input.tool_input.command, when present
summary / risk_preview = input.tool_input.description, when present
created_at = sidecar receive time
expires_at = created_at + configured hook timeout
```

Codex `PermissionRequest` hook input 不暴露稳定的 `tool_use_id`，所以第一版不依赖 Codex `tool_use_id`。
