# Agent -> Human

## 定位

- sidecar 要处理 agent -> human 的交互。

## 交互类型

- `question`：这是 OpenCode 的概念，模型用 question 向用户反问、澄清问题。
- `idle`：agent 已经完成任务，要通知用户查看结果或者 review。
- `tool permission request`：需要用户批准权限，执行有风险的动作。
