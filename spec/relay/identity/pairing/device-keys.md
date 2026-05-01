# 设备密钥

## 目标

- sidecar 和 touchpoint 用设备密钥证明自己的设备身份。
- relay 不保存长期设备私钥。

## 生成

- sidecar 生成 sidecar 设备密钥。
- touchpoint 生成 touchpoint 设备密钥。
- 设备密钥由各自端生成。
- 设备私钥不离开本端设备。

## 保存

- sidecar 保存 sidecar 设备私钥。
- touchpoint 保存 touchpoint 设备私钥。
- relay 不保存长期设备私钥。

## Relay 可记录的信息

- sidecar device id。
- touchpoint device id。
- 与设备身份相关的公开材料。
- pairing 与设备的关系。

## 后续用途

- sidecar 连接 relay 时证明自己属于某个 pairing。
- touchpoint 连接 relay 时证明自己属于某个 pairing。
- 后续通信靠设备密钥签名或 token 证明身份。

## 待设计

- 设备密钥类型。
- 设备密钥保存位置。
- 公开材料格式。
- 签名格式。
- token 签发与轮换方式。
