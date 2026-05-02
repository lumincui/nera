# Touchpoint Prototype

这是 Nera touchpoint 的可操作通知静态交互原型。

## 目标

- 验证可操作通知如何承载授权类请求、question 请求和完成提醒。
- 将文字 spec 转换为可操作、可感知的交互形态。

## 运行

- 直接用浏览器打开 `index.html`。
- 或在仓库根目录运行 `python3 -m http.server 4173` 后打开 `http://localhost:4173/prototype/touchpoint/`。

## 覆盖场景

- `tool permission request`
- 权限请求说明任务、权限和命令
- 权限请求支持动态选项：`Deny`、`Approve`、`Always`
- `question` 多选
- `question` 选择和文本输入一起提交
- `question` 通过系统听写输入文本
- `question` 回复生成 `answer_question` payload，并进入交互式 action 已回传状态
- `idle` 触发完成通知，生成 `completion_notification` payload
- `idle` 的 `Review` / `稍后` 响应生成后续消息
