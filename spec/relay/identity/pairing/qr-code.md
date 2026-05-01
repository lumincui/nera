# 配对码与 QR Code

## 目标

- sidecar 通过一次性配对码或 QR Code，让 touchpoint 建立设备配对。
- QR Code 只用于建立 pairing。
- QR Code 不承载消息内容。

## QR Code 内容

QR Code 应包含：

- relay endpoint。
- pairing nonce。
- pairing code。
- sidecar device id。
- expires at。

QR Code 不应包含：

- 手机号。
- 用户名。
- 密码。
- 消息明文内容。
- 长期设备密钥。

## 配对码要求

- 一次性。
- 短时有效。
- 使用后失效。
- 只能用于建立 pairing。
- 不能作为后续长期认证凭证。

## 配对码格式

- 待设计。

## 待设计

- pairing code 的长度。
- pairing nonce 的生成方式。
- QR Code 的 URL scheme。
- QR Code 是否需要包含 relay endpoint。
- sidecar device id 是否需要脱敏。
