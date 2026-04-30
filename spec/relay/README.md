# Relay

## 定位

- Relay 负责实现 human 和 agent 的交互传递。
- Relay 需要考虑通过 APNs 等机制实现 human agent 交互。
- Relay 是从 sidecar 和移动端之间分离出来的部分。

## 价值表达

- `agent <-- nera --> human`

## 要求

- 高效。
- 请求的往返都是实时的。
- 安全。
- 短期先依赖 Apple 的信道安全。
- Apple 不应该是完全信任的对象。
- 不完全信任 Apple 是后面要完成的。

## 命名

- 该模块命名为 `relay`。
