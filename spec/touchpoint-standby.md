# Touchpoint StandBy 状态

## 思维火花

- 苹果手机横向充电时有 StandBy 状态。
- 这个状态可能可以被 Nera 利用。

## 可能价值

- 当用户离开电脑、手机横向充电放在桌面上时，touchpoint 可以成为 Nera 的常驻可见状态面板。
- Nera 可以在 StandBy 场景中展示 agent 当前状态，例如：
  - 正在运行。
  - 等待权限审批。
  - 已完成，等待 review。
- 权限审批或完成通知可以在这个状态下更容易被用户看到。

## 边界

- 这是思维火花，不是第一版必须实现的能力。
- 当前 MVP 仍以权限审查和完成通知为主。
- 是否能利用 StandBy，需要后续确认 iOS / WidgetKit / Live Activity / StandBy 的能力边界。

## 待澄清问题

- StandBy 能否展示 Nera 的实时状态。
- StandBy 是否需要 Live Activity / widget 支持。
- StandBy 中能否直接完成 approve / deny，还是只能跳转到 app。
- APNs 推送是否能更新 StandBy 中的展示状态。
