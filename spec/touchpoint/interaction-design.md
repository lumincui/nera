# Touchpoint 交互设计

## 设计原则

- Touchpoint 是 Nera 和用户的交互界面。
- Touchpoint 当前面向移动端。
- Touchpoint 不要求用户一直盯着手机。
- 当前设计场景是通过可操作通知完成交互。
- 需要用户立即响应的事项应该主动触达用户。
- 持续状态应该可见，但不应持续打扰用户。
- 复杂输入和 review 应进入 App 内完成。
- 第一版通知 action 默认在后台提交；只有 review / 查看详情这类需要完整上下文的动作才打开 App。

## 交互入口

| 入口 | 适合承载 | 不适合承载 |
| --- | --- | --- |
| 可操作通知 | 授权类请求、question 请求、需要立即响应的事项。 | 持续状态、复杂 review、长文本输入。 |
| Live Activities / Dynamic Island | agent 状态、任务进度、等待用户介入、已完成待 review。 | 复杂 review、长文本输入、多轮对话。 |
| App 内实时会话 | 下达命令、补充命令、要求汇报进度、复杂 review、长文本输入。 | 只需要快速 approve 的轻量事项。 |
| 小组件 | 概览类信息。 | 实时交互主通道。 |

## Agent -> Human

| 事件 | 推荐入口 | 用户动作 |
| --- | --- | --- |
| `tool permission request` | 可操作通知 | approve 或拒绝。 |
| `question` | 可操作通知 | 回答问题。 |
| `idle` | Live Activities / Dynamic Island | 查看结果或进入 review。 |
| agent 正在工作 | Live Activities / Dynamic Island | 查看状态。 |
| agent 需要复杂 review | App 内实时会话 | review 工作进度和内容。 |

## 通知 Action 执行方式

- 一键动作默认不打开 App，在通知 action 的后台回调中直接提交给 relay / nera-server，例如 approve、deny、continue、stop 和简单 choice。
- 文本回复也默认不打开 App，使用 `UNTextInputNotificationAction` 在通知内收集文本，并在后台回调中提交。
- Review、查看详情、复杂上下文阅读、多步输入等动作需要打开 App。
- 后台 action 只承载短任务：组装响应、发起一次网络请求、记录结果；不能依赖后台长期运行。
- 如果后台提交失败，touchpoint 应本地记录 pending response，等待 App 下次启动或后续后台机会重试。

## 权限请求形态

- 权限请求不一定需要标签。
- 权限请求需要说明是哪个任务的权限请求。
- 权限请求需要说明请求的权限是什么。
- 权限请求需要说明执行的命令是什么。
- 权限请求可能是动态的。
- 权限请求可能有第三选项：`approve always deny`。

## Question 形态

| 形态 | 可操作通知支持情况 | 说明 |
| --- | --- | --- |
| 选择 | 支持 | 选择题可能是多选的。 |
| 直接输入文本 | 支持 | 使用 `UNTextInputNotificationAction`。 |
| 语音输入 | 间接支持 | 文本输入动作显示输入控件，系统允许用户输入或听写文本。 |

- 选择和输入是一起的。

## Human -> Agent

| 用户意图 | 推荐入口 | 动作 |
| --- | --- | --- |
| 向 agent 下达命令 | App 内实时会话 | 输入命令。 |
| 向 agent 补充命令 | App 内实时会话 | 输入补充命令。 |
| 要求 agent 汇报进度 | App 内实时会话 | 发起进度汇报请求。 |
| `permission approve` | 可操作通知 | approve。 |

## 后续可能扩展

- 并行式的指派任务是未来可能扩展的点，但不是第一目标，后面再展开。
