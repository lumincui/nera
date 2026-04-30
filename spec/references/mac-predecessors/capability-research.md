# Mac 同类产品能力调研

## 调研目的

- Vibe Island 对比了其他同类产品。
- 对这些产品做能力调研，可以帮助 Nera 拓展思路。

## 组织原则

- 按能力维度归类。

## 产品范围

### Vibe Island 对比页提到的产品

- Vibe Island
- Open Island
- Claude Island
- Notchi
- AgentNotch

### 额外发现的相邻产品

- xIsland
- Vibe Notch

## 能力维度

| 能力 | 说明 | 参考产品 |
| --- | --- | --- |
| 多 agent 支持 | 同一个界面中支持多个 AI coding agent。 | Vibe Island、xIsland、AgentNotch |
| 实时状态监控 | 显示 agent 的处理状态、工具调用、文件操作、错误或完成状态。 | Vibe Island、Vibe Notch、Notchi、AgentNotch、xIsland |
| 权限审批 | 在 Mac UI 中批准或拒绝 agent 的权限请求。 | Vibe Island、Open Island、Claude Island、xIsland |
| 问题回答 | 在 Mac UI 中回答 agent 提出的问题。 | Vibe Island |
| Plan review | 在 Mac UI 中查看 plan，并进行反馈。 | Vibe Island |
| Terminal jump | 从 Mac UI 跳转回对应 terminal、tab、pane 或 session。 | Vibe Island、xIsland |
| Chat history | 查看对话历史，并支持 Markdown 或语法高亮。 | Vibe Notch |
| Token / cost / usage tracking | 显示 token、成本或 quota 使用情况。 | Vibe Island、AgentNotch、xIsland |
| 通知与提示 | 在 agent 需要用户注意、完成任务或发生错误时提示用户。 | Vibe Island、Vibe Notch、Notchi、AgentNotch、xIsland |
| 零配置 | 自动配置 hooks 或连接方式。 | Vibe Island |
| 本地优先 | 数据和通信尽量留在本机。 | Vibe Island、AgentNotch |
| 原生 Mac 实现 | 使用 Native Swift 或 SwiftUI，贴近 macOS 体验。 | Vibe Island、Vibe Notch、AgentNotch、xIsland |
| 远程 agent 支持 | 监控运行在远程服务器上的 agent。 | Vibe Island |

## 可参考点

- Mac 上的 notch / menu bar 可以作为低打扰的 agent 状态入口。
- 用户真正需要的不只是监控，还包括及时介入。
- 权限审批、问题回答、plan review、进度查看，是 agent 协作从“看见”走向“参与”的关键能力。
- 多 agent 支持说明用户可能同时运行多个 coding agent。
- terminal jump 说明 agent 协作系统需要把用户带回具体上下文。
- token、成本、quota 感知是锦上添花的能力。
- 在电脑端有足够的屏幕信息可供查看 token、成本、quota。
- 移动端并不适合让用户一直盯着手机看余额。

## 能力优先级判断

- `Token / cost / usage tracking` 是锦上添花的能力，不是移动端第一目标。

## 对 Nera 的启发

- Nera 的目标不是只做 Mac 上的可视化伴随工具。
- Nera 要让 agent 的协作随处可行。
- Nera 可以参考这些先行者已经验证过的 Mac 能力。
- Nera 需要进一步思考如何把这些能力延伸到移动端。

## Sources

- Vibe Island alternatives：https://vibeisland.app/alternatives/
- Vibe Island：https://vibeisland.app/
- Vibe Notch：https://vibenotch.app/
- Notchi：https://notchi.app/
- AgentNotch：https://www.productcool.com/product/agentnotch
- xIsland：https://xisland.app/
