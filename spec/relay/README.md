# Relay

## 定位

- Relay 负责实现 human 和 agent 的交互传递。
- Relay 需要考虑通过 APNs 等机制实现 human agent 交互。
- Relay 是从 sidecar 和 touchpoint 之间分离出来的部分。

## 价值表达

- `agent <-- nera --> human`

## 要求

- 高效。
- 请求的往返都是实时的。
- 安全。
- 短期先依赖 Apple 的信道安全。
- Apple 不应该是完全信任的对象。
- 不完全信任 Apple 是后面要完成的。
- 中转服务器是 human 和 agent 通信的通道。
- 数据必须通过中转服务器中转。
- 内容对中转服务器是透明的。
- 中转服务器不应成为内容信任方。
- 第一版采用设备配对身份。
- 第一版不引入手机号、用户名或密码。
- Relay 识别 pairing 和设备，不识别自然人账号。

## 已决策问题

- Relay 包含公网中转服务。
- 采用设备配对身份。

## 当前结构

- `identity.md`：记录 relay 身份设计。
- `public-relay-service.md`：记录是否需要公网中转服务的设计决策。

## 命名

- 该模块命名为 `relay`。
