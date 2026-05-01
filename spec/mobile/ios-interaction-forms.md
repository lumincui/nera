# iOS 交互形式

## 调研目的

- 对 mobile 端候选方案补充 iOS 上能满足实时性和交互能力的形式。

## 候选形式

| 形式 | 适合的交互 | 实时性判断 | 交互能力判断 |
| --- | --- | --- | --- |
| 可操作通知 | 授权类请求、question 请求。 | 适合即时打断。 | 支持按钮动作和文本输入。 |
| Live Activities / Dynamic Island | agent 状态、任务进度、等待用户介入、持续事件。 | 可通过 ActivityKit push notifications 更新，适合实时状态。 | 可提供快速交互。 |
| 小组件 | 概览类信息。 | 刷新频率好像不满足。 | 可交互，但不适合作为实时交互主通道。 |
| App Intents / interactive snippets | 系统入口中的后续动作。 | 更偏用户主动触发，不是主要实时通道。 | 支持交互式 snippet 和 follow-up action。 |
| Controls | Control Center、Lock Screen、Action Button 中的用户主动操作。 | 更偏用户主动触发，不是主要实时通道。 | 支持按钮或 toggle 类操作。 |
| App 内实时会话 | 连续对话、复杂 review、长文本输入。 | 用户打开 App 时可作为实时交互界面。 | 交互能力最完整。 |

## 初步判断

- 可操作通知适合解决授权类请求和 question 请求。
- Live Activities / Dynamic Island 更接近“实时 xx”，适合承载实时状态和轻量交互。
- 小组件不适合作为实时交互主通道。
- App 内实时会话适合复杂 review、长文本输入和连续对话。

## Apple Reference

- User Notifications：https://developer.apple.com/documentation/usernotifications
- Declaring your actionable notification types：https://developer.apple.com/documentation/UserNotifications/declaring-your-actionable-notification-types
- UNTextInputNotificationAction：https://developer.apple.com/documentation/usernotifications/untextinputnotificationaction
- ActivityKit：https://developer.apple.com/documentation/activitykit
- Displaying live data with Live Activities：https://developer.apple.com/documentation/ActivityKit/displaying-live-data-with-live-activities
- Starting and updating Live Activities with ActivityKit push notifications：https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications
- Widgets, Live Activities, and controls：https://developer.apple.com/documentation/appintents/widgets-and-live-activities
- App Intents：https://developer.apple.com/documentation/appintents/app-intents
- Displaying static and interactive snippets：https://developer.apple.com/documentation/appintents/displaying-static-and-interactive-snippets
- WidgetKit Timeline：https://developer.apple.com/documentation/widgetkit/timeline
