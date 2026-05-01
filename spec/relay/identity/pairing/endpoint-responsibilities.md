# 三端职责

## Sidecar

- 发起配对。
- 请求 relay 创建 pairing。
- 生成一次性配对码或 QR Code。
- 展示一次性配对码或 QR Code。
- 接收 relay 转发的 touchpoint claim。
- 向用户展示待确认的 touchpoint 配对请求。
- 二次确认或拒绝配对。
- 生成 sidecar 设备密钥。
- 保存 sidecar 设备密钥。
- 后续连接 relay 时证明自己属于某个 pairing。

## Touchpoint

- 扫描 QR Code 或输入配对码。
- 向 relay 提交配对请求。
- 提交 touchpoint device id。
- 提交 touchpoint APNs device token。
- 生成 touchpoint 设备密钥。
- 保存 touchpoint 设备密钥。
- 接收 pairing 状态。
- 后续连接 relay 时证明自己属于某个 pairing。

## Relay

- 创建 pairing。
- 生成或记录 pairing id。
- 校验 pairing code 和 pairing nonce。
- 维护 pairing 状态机。
- 将 touchpoint claim 转发给 sidecar。
- 记录 sidecar device id。
- 记录 touchpoint device id。
- 记录 touchpoint APNs device token。
- 记录 pairing 与设备的关系。
- 为后续通信提供信令和投递通道。

## Relay 不做的事

- 不识别自然人账号。
- 不要求手机号。
- 不要求用户名或密码。
- 不读取消息明文内容。
- 不保存长期设备密钥。
