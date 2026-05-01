# 三端配对流程

## 目标

- 完成 sidecar、touchpoint、relay 三端之间的设备配对。
- 让 relay 能识别 pairing 和设备。
- 让 sidecar 与 touchpoint 建立后续通信所需的设备身份。

## 流程

1. sidecar 向 relay 请求创建 pairing。
2. relay 创建 pairing，状态为 `created`。
3. relay 返回 pairing id、pairing nonce、pairing code、expires at。
4. sidecar 生成 QR Code 或显示配对码。
5. pairing 状态进入 `pending`。
6. touchpoint 扫描 QR Code 或输入配对码。
7. touchpoint 向 relay 提交 pairing claim。
8. relay 校验 pairing code、pairing nonce 和过期时间。
9. pairing 状态进入 `claimed`。
10. relay 将 touchpoint claim 转发给 sidecar。
11. sidecar 展示 touchpoint 的配对请求。
12. sidecar 二次确认配对。
13. pairing 状态进入 `confirmed`。
14. sidecar 和 touchpoint 使用各自端上的设备密钥。
15. touchpoint 向 relay 提交 touchpoint device id 和 APNs device token。
16. sidecar 向 relay 提交 sidecar device id。
17. relay 记录 pairing 与设备关系。
18. pairing 状态进入 `active`。

## 二次确认

- `claimed` 到 `confirmed` 必须经过 sidecar 二次确认。
- sidecar 二次确认用于降低配对码泄漏或旁观者扫码的风险。
- sidecar 拒绝配对时，pairing 不应进入 `active`。

## 过期与失败

- 配对码过期后，pairing 进入 `expired`。
- 配对码使用后失效。
- touchpoint claim 失败后，需要重新扫码或输入新的配对码。
- sidecar 拒绝配对后，touchpoint 需要重新发起配对。

## 成功结果

- relay 识别 pairing。
- relay 识别 sidecar device id。
- relay 识别 touchpoint device id。
- relay 记录 touchpoint APNs device token。
- sidecar 保存 sidecar 设备私钥。
- touchpoint 保存 touchpoint 设备私钥。
