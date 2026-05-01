# 设备配对机制

## 目标

- 用设备配对作为第一版身份机制。
- 不引入手机号。
- 不引入用户名或密码。
- 让 touchpoint 和 sidecar 建立一个 relay 可识别的 pairing。

## 参与方

- sidecar：电脑端，嵌入 coding agent。
- touchpoint：移动端，用户交互界面。
- relay：公网中转服务，识别 pairing 和设备。

## 配对流程

1. sidecar 发起配对。
2. sidecar 生成一次性配对码或 QR Code。
3. touchpoint 扫码或输入配对码。
4. touchpoint 向 relay 提交配对请求。
5. relay 校验配对码是否有效。
6. 配对成功后，sidecar 和 touchpoint 各自生成设备密钥。
7. relay 记录 pairing 和设备的关系。
8. 后续通信靠设备密钥签名或 token 证明身份。

## 配对码要求

- 一次性。
- 短时有效。
- 只能用于建立 pairing。
- 使用后失效。

## Relay 记录的信息

- pairing id。
- sidecar device id。
- touchpoint device id。
- touchpoint APNs device token。
- pairing 状态。

## Relay 不记录的信息

- 手机号。
- 用户名。
- 密码。
- 自然人账号。
- 消息明文内容。

## 后续认证

- sidecar 连接 relay 时，需要证明自己属于某个 pairing。
- touchpoint 连接 relay 时，需要证明自己属于某个 pairing。
- human 的通知响应需要带上可被 relay 路由的 request id。
- relay 只验证 envelope 层身份，不理解消息内容。

## 待设计

- 设备密钥生成与保存方式。
- token 签发与轮换方式。
- 设备解绑方式。

## 当前结构

- `qr-code.md`：记录配对码和 QR Code 内容。
- `state-machine.md`：记录 pairing 状态机。
