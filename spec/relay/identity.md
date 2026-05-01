# Relay 身份设计

## 决策记录

- 第一版采用设备配对身份。
- 第一版不引入手机号。
- 第一版不引入用户名或密码。
- Relay 识别 pairing 和设备。
- Relay 不识别自然人账号。

## 配对模型

- 电脑端 sidecar 生成一次性配对码或 QR Code。
- iPhone touchpoint 扫码或输入配对码。
- 配对完成后，两端各自生成设备密钥。
- Relay 只知道设备属于某个 pairing。
- 后续通信靠设备密钥签名或 token 证明身份。

## Relay 身份边界

- Relay 需要鉴定连接和设备身份。
- Relay 作为信令服务器和投递通道。
- Relay 不读取、不理解消息内容。
- 内容身份和业务语义由 sidecar 与 touchpoint 两端处理。

## 后续可能扩展

- 多人协作。
- 跨设备恢复。
- 团队审计。
- 账号体系。
