# Pairing 状态机

## 目标

- 明确 pairing 从创建到可用再到失效的状态。
- 让 relay 能判断配对码是否可用。
- 让 sidecar 和 touchpoint 能知道当前配对是否成功。

## 状态

| 状态 | 说明 |
| --- | --- |
| `created` | sidecar 发起配对，relay 创建 pairing。 |
| `pending` | 配对码或 QR Code 已生成，等待 touchpoint 扫码或输入。 |
| `claimed` | touchpoint 已提交配对请求。 |
| `confirmed` | sidecar 和 touchpoint 的设备关系已确认。 |
| `active` | pairing 可用于 relay 通信。 |
| `expired` | 配对码过期。 |
| `revoked` | pairing 被用户或设备撤销。 |

## 状态转换

| From | To | 触发 |
| --- | --- | --- |
| `created` | `pending` | sidecar 生成配对码或 QR Code。 |
| `pending` | `claimed` | touchpoint 扫码或输入配对码。 |
| `claimed` | `confirmed` | relay 校验配对码有效。 |
| `confirmed` | `active` | 设备密钥或 token 建立完成。 |
| `pending` | `expired` | 配对码超时。 |
| `created` | `expired` | 配对流程超时。 |
| `active` | `revoked` | 用户或设备解绑。 |

## 失败处理

- 配对码过期后，touchpoint 需要重新扫码或输入新的配对码。
- 配对码使用后应立即失效。
- 被撤销的 pairing 不应继续用于 relay 通信。

## 待设计

- `claimed` 是否需要 sidecar 二次确认。
- `confirmed` 到 `active` 的具体握手。
- 配对状态如何同步给 sidecar。
- 配对状态如何同步给 touchpoint。
