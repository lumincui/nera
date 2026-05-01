# VibeIsland / Open Island 反向寻址参考

## 参考项目

- 参考实现：`Octane0411/open-vibe-island`
- 本地路径：`/Users/lumin/open-vibe-island`

## 已观察到的实现结构

Open Island 将 agent session 抽象为 `AgentSession`，核心定位字段包括：

- `id`：agent session id。
- `tool`：agent 类型，例如 Codex、Claude Code、OpenCode。
- `jumpTarget`：用于从 UI / 消息反向定位到本机 agent 所在位置。

`JumpTarget` 包含多种本机定位信息：

- `terminalApp`
- `workspaceName`
- `paneTitle`
- `workingDirectory`
- `terminalSessionID`
- `terminalTTY`
- `tmuxTarget`
- `tmuxSocketPath`
- `warpPaneUUID`
- `codexThreadID`

## Hook 到本地 app 的通道

Open Island 的 hook binary 从 stdin 读取 coding agent hook payload，然后通过本机 Unix socket 发给常驻 app：

- Hook CLI：`Sources/OpenIslandHooks/OpenIslandHooksCLI.swift`
- Bridge client：`Sources/OpenIslandCore/BridgeCommandClient.swift`
- Bridge server：`Sources/OpenIslandCore/BridgeServer.swift`
- Socket 位置：`~/Library/Application Support/OpenIsland/bridge.sock`

这对应一种本地 thin CLI + 常驻 daemon/app 的结构。

## Session 反向寻址方式

Open Island 不是只靠一个 `session_id` 反向定位 agent，而是维护多层定位信息。

### 1. 直接用 agent 原生 session id

Codex hook payload 中包含：

- `session_id`
- `cwd`
- `transcript_path`
- `terminal_app`
- `terminal_session_id`
- `terminal_tty`
- `terminal_title`

Open Island 将 `session_id` 作为 `AgentSession.id`。

### 2. 运行时补充 terminal 上下文

Codex payload 会通过 `withRuntimeContext` 补充运行时上下文：

- 当前 TTY。
- terminal app。
- terminal session id。
- terminal title。
- Warp pane uuid。
- cmux surface id。
- Zellij pane id / session name。

### 3. 进程发现补充定位

`ActiveAgentProcessDiscovery` 通过 `ps` 和 `lsof` 发现活跃 agent 进程，并提取：

- agent 类型。
- session id。
- working directory。
- terminal TTY。
- terminal app。
- transcript path。
- tmux target。
- tmux socket path。

Codex 的 session id 可以从 `/.codex/sessions/*.jsonl` transcript path 中提取 UUID。

Claude 的 session id 可以从 transcript path 或命令参数中提取。

### 4. Terminal attachment probe

`TerminalSessionAttachmentProbe` 会把已有 `AgentSession` 与当前 terminal snapshot 匹配，判断 session 是否仍 attached。

匹配依据包括：

- terminal session id。
- TTY。
- working directory。
- terminal title 中是否包含 session id prefix。
- agent tool hint，例如 title 中包含 `codex` 或 `claude`。
- active process 是否仍存在。

### 5. 回传用户输入

Open Island 的 `TerminalTextSender` 通过 `AgentSession.jumpTarget` 向 agent 所在终端发送文本：

- tmux：使用 `tmux send-keys -t <target>`。
- Ghostty：使用 AppleScript 找到目标 terminal，然后 `input text` + Enter。

这说明从消息反向寻址 agent 时，消息最终不是只靠 `session_id` 注入，而是先找到 `AgentSession`，再使用 `jumpTarget` 注入。

## 对 Nera 的启发

- Nera 可以复用 coding agent 的原生 `session_id`，但消息路由不应只依赖 `session_id`。
- sidecar 应维护 session registry，记录 `session_id -> agent_type + jump_target + metadata`。
- server 下发给 sidecar 的消息可以携带 `session_id`，sidecar 在本地 registry 中查找对应 session。
- 查到 session 后，sidecar 再根据 `agent_type` 与 `jump_target` 选择具体注入方式。
- `agent_type` 虽然不一定用于唯一性，但对选择 adapter 很有价值。
- 反向寻址需要把 agent session id、terminal / pane 定位、工作目录、transcript path 结合起来，而不是只依赖单一字段。

## 对当前问题的影响

之前的问题是：唯一定位一个 agent session 时，要不要包含 `agent_type`。

参考 Open Island 的实现后，可以看到：

- `session_id` 用于找到 session。
- `tool` / `agent_type` 用于知道这是哪类 agent。
- `jumpTarget` 用于找到本机可操作目标。

因此 Nera 的消息中建议包含：

```json
{
  "sidecar_id": "...",
  "agent_type": "codex",
  "session_id": "..."
}
```

其中 `agent_type` 不一定是防冲突的主键，但它是本地 adapter 分发和注入策略选择所需的字段。
