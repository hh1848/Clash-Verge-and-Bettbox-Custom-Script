<div align="center">

# Clash Verge Rev & Bettbox Custom Script

**一套 Mihomo 覆写脚本，让你更换机场时无需重新整理代理组、规则和 DNS。**

[![Clash Verge Rev](https://img.shields.io/badge/Clash%20Verge%20Rev-支持-2f81f7)](./Clash-Verge-Rev-mihomoScript.js)
[![Bettbox](https://img.shields.io/badge/Bettbox%20(Android)-支持-3ddc84)](./Bettbox-mihomoScript.js)
[![Mihomo](https://img.shields.io/badge/内核-Mihomo-orange)](https://github.com/MetaCubeX/mihomo)

</div>

> [!IMPORTANT]
> 本仓库只提供 Mihomo 配置覆写脚本，**不提供任何代理节点、机场订阅、网络接入或售卖服务**。

---

## 项目简介

不同机场订阅通常自带不同的代理组、规则和 DNS 配置。本项目采用统一覆写方式：

> **保留当前订阅中的 `proxies` / `proxy-providers` 节点，在此基础上重建主策略组、分流规则、Rule Providers 和 DNS；若节点或 provider 仍依赖原订阅中的旧策略组，则只保留必要依赖并自动隐藏。**

因此更换机场后，可以继续使用同一套代理组结构和分流逻辑。脚本中**不需要填写机场 URL**，也不包含任何节点信息。

当前脚本版本：**Clash Verge Rev `2026.09.14-r1`** / **Bettbox `2026.09.23-r1`**。

### 当前设计重点

- 国内流量优先 `DIRECT`，明确的国外域名统一交给 `国外流量`
- ChatGPT / Claude / Gemini & NotebookLM 独立分流，**AI 组不提供任何 DIRECT 路径**
- Google / GitHub / Microsoft / Apple / Telegram / X / YouTube / Netflix 独立分流
- Apple 中国区与 Microsoft 中国区规则前置直连
- 8 个主要地区 + `其他地区`，采用“**地区聚合组 + 隐藏自动测速子组**”结构
- `全球手动` 自动过滤机场公告、流量提示等伪节点，并按地区 + 数字自然排序
- 自动补全 `proxy-providers` 的 health-check，尽量保留机场原有测速参数
- 国内 DNS 直连，国外 DNS 固定经 `国外流量` 发送，并提供独立 `direct-nameserver`
- Bettbox v1.18.8+ 支持 12 个可视化覆写开关

---

## 适用环境

| 客户端 | 平台 | 脚本 | 说明 |
| --- | --- | --- | --- |
| **Clash Verge Rev** | Windows / macOS / Linux | [`Clash-Verge-Rev-mihomoScript.js`](./Clash-Verge-Rev-mihomoScript.js) | 桌面版，补充 TUN 路由与 DNS 劫持参数 |
| **Bettbox**（v1.18.8+） | Android | [`Bettbox-mihomoScript.js`](./Bettbox-mihomoScript.js) | Android 版，支持可视化覆写开关，不接管 App 的 TUN/VPN 生命周期 |

必须使用 **Mihomo 内核**以及支持 `include-all`、`exclude-type`、Rule Providers、`.mrs` 等相关特性的客户端。

---

## 安装与配置

### Clash Verge Rev

1. 正常导入机场订阅
2. 打开 `订阅` → **全局扩展脚本**（Script，不是 Merge 覆写）
3. 将 [`Clash-Verge-Rev-mihomoScript.js`](./Clash-Verge-Rev-mihomoScript.js) 全文复制进去并保存
4. 刷新订阅
5. 代理页出现 `全球手动`、`自动选择`、`国外流量`、`漏网之鱼`、各服务组和地区聚合组，即表示脚本已执行

### Bettbox

1. 正常导入机场订阅
2. 在脚本覆写入口新建 JavaScript 覆写（具体入口以 App 当前版本为准）
3. 将 [`Bettbox-mihomoScript.js`](./Bettbox-mihomoScript.js) 全文复制保存并关联当前订阅
4. 刷新订阅
5. Bettbox v1.18.8+ 会读取脚本顶部声明的 12 个覆写开关

### Raw 地址

```text
https://raw.githubusercontent.com/hh1848/Clash-Verge-and-Bettbox-Custom-Script/main/Clash-Verge-Rev-mihomoScript.js
https://raw.githubusercontent.com/hh1848/Clash-Verge-and-Bettbox-Custom-Script/main/Bettbox-mihomoScript.js
```

> Raw 地址用于查看或同步脚本源码，**不是机场订阅地址**。

---

## 工作原理

```text
机场订阅
   ├── proxies ─────────────┐
   └── proxy-providers ─────┤  ← 节点 / provider 保留
                            ▼
                     自定义覆写脚本
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  proxy-groups            rules          rule-providers
  33 个脚本组            28 条              22 个
  24 可见 + 9 隐藏                         │
        │                                  │
        └────────────── DNS ───────────────┘
                 Fake-IP + 国内外分流
                            │
                            ▼
                     最终 Mihomo 配置
```

> `33` 是脚本自身定义的策略组数量。若订阅节点、provider、listener、tunnel、NTP 或 Rule Provider 仍引用旧策略组，脚本会额外保留必要旧组并设置为隐藏，因此最终配置中的实际组数可能高于 33。

### 默认配置规模

| 项目 | Clash Verge Rev | Bettbox（全部开关启用） |
| --- | ---: | ---: |
| 脚本定义策略组 | **33** | **33** |
| 主界面可见组 | **24** | **24** |
| 隐藏地区测速组 | **9** | **9** |
| 分流规则 | **28** | **28** |
| Rule Providers | **22** | **22** |

Bettbox 关闭服务或地区开关后，对应组会动态减少。

---

## 代理组架构

### 基础组（4 个）

| 代理组 | 类型 | 用途 |
| --- | --- | --- |
| `全球手动` | `select` | 手动选择节点；过滤伪节点；内联节点按地区和数字自然排序 |
| `自动选择` | `url-test` | 全节点自动测速，默认 `600s`、容差 `80ms`、Lazy 模式 |
| `国外流量` | `select` | 一般国外流量的统一出口，只允许代理路径 |
| `漏网之鱼` | `select` | 最终 `MATCH` 落点，默认首选 `国外流量`，同时保留手动 `DIRECT` 兜底 |

国内流量不经过额外的“国内直连”策略组：命中相关规则后直接落到 `DIRECT`。

### AI 组（3 个）

- `ChatGPT`
- `Claude`
- `Gemini / NotebookLM`

AI 组选项仅包含：

```text
自动选择
全球手动
各地区聚合组
```

**不包含 `DIRECT`，也不引用任何可以再切换到 `DIRECT` 的上级策略组。** 这样可避免 AI 服务因持久化选择或上级组设置而间接直连。

### 常用国际服务（8 个）

`Google` · `GitHub` · `Microsoft` · `Apple` · `Telegram` · `X` · `YouTube` · `Netflix`

这些服务组允许：

```text
自动选择 / 全球手动 / 各地区聚合组 / DIRECT
```

其中 Apple 中国区、Microsoft 中国区由前置规则直接 `DIRECT`，不会被国际服务组抢走。

### 地区聚合组（9 个，可见）

```text
香港聚合
澳门聚合
台湾聚合
新加坡聚合
韩国聚合
日本聚合
美国聚合
欧洲聚合
其他地区
```

每个地区聚合组都是 `select`：

```text
地区聚合
├── 地区自动        ← 隐藏 url-test 子组，默认第一项
├── 该地区节点 01
├── 该地区节点 02
└── ...
```

这样主界面只展示一个地区入口，同时兼顾自动测速和手动选节点。

### 隐藏地区自动组（9 个）

`香港自动` · `澳门自动` · `台湾自动` · `新加坡自动` · `韩国自动` · `日本自动` · `美国自动` · `欧洲自动` · `其他自动`

这些组全部设置 `hidden: true`，只供对应地区聚合组调用，不在 Clash Verge Rev / Bettbox 主策略组列表中占用界面空间。

---

## 节点识别、过滤与排序

### 地区优先级

当前统一顺序为：

**香港 → 澳门 → 台湾 → 新加坡 → 韩国 → 日本 → 美国 → 欧洲 → 其他**

若同一节点名称同时命中多个地区标识，只归入优先级最高的地区，避免一个节点重复出现在多个地区组。

### 识别范围

地区规则同时支持中文、繁体中文、emoji 国旗、英文国家/城市名称、常见机场代码和缩写。

美国识别额外覆盖 Los Angeles、San Jose、Seattle、New York、Phoenix、Salt Lake City、San Francisco、Dallas、Chicago、Las Vegas、Ashburn、Boston、Miami、Denver、Houston、Austin、Washington D.C. 等常见节点名。

欧洲识别覆盖英国、德国、法国、荷兰、西班牙、意大利、瑞士、瑞典、芬兰、挪威、波兰、爱尔兰、奥地利、比利时、捷克、丹麦、葡萄牙、希腊等常见区域标识。

### 伪节点过滤

`全球手动`、`自动选择` 和地区组会排除明显的机场信息节点，例如：

```text
到期 / 过期 / 剩余流量 / 流量重置 / 套餐信息
官网 / 网址 / 订阅地址 / 公告 / 通知 / 教程 / 客服
Expire / Traffic Remaining / Website ...
```

过滤规则刻意避免简单匹配“流量”两个字，以减少误伤“香港01｜不限流量”这类真实节点。

### 全球手动排序

对 `config.proxies` 中的内联节点：

1. 过滤 Direct / Pass / Compatible 等绕过型出站
2. 过滤机场伪节点
3. 按地区优先级排序
4. 同一地区内使用纯 JavaScript 数字自然排序

例如：

```text
香港1
香港2
香港10
```

不会被错误排序成 `1 → 10 → 2`。

若订阅使用 `proxy-providers`，`全球手动` 通过 `use` 动态引用 provider；provider 内部节点顺序由 Mihomo 运行时管理。

---

## Proxy Provider Health Check

脚本会遍历现有 `proxy-providers` 并确保 health-check 可用：

- 强制 `enable: true`
- 缺少测速 URL 时使用 `https://www.gstatic.com/generate_204`
- 缺少 interval 时使用 `600`
- 缺少 lazy 时使用 `true`
- 仅当使用默认 `generate_204` 且原配置没有声明状态码时补 `expected-status: 204`
- **不会覆盖机场已经自定义的 URL / interval / timeout 等有效配置**

这样 provider 节点参与地区 `url-test` 和全局自动测速时更稳定。

---

## 分流规则

共 **28 条**，自上而下匹配，命中即停止。

| 阶段 | 内容 | 目标 | 条数 |
| --- | --- | --- | ---: |
| 1 | `private` 局域网域名 | `DIRECT` | 1 |
| 2 | NotebookLM / AI Studio / Gemini API 精确域名 | `Gemini / NotebookLM` | 5 |
| 3 | `openai` / `anthropic` / `google-gemini` | 三个 AI 组 | 3 |
| 4 | `apple@cn` / `microsoft@cn` | `DIRECT` | 2 |
| 5 | YouTube / Google / GitHub / Microsoft / Apple / Telegram / X / Netflix | 对应服务组 | 8 |
| 6 | `cn` 中国大陆域名 | `DIRECT` | 1 |
| 7 | `geolocation-!cn` | `国外流量` | 1 |
| 8 | private / Google / Telegram / Twitter / Netflix IP | 对应目标，`no-resolve` | 5 |
| 9 | China IP | `DIRECT`，允许解析 | 1 |
| 末 | `MATCH` | `漏网之鱼` | 1 |
|  | **合计** |  | **28** |

### 关键优先级

- NotebookLM / Gemini 精确域名位于通用 Google 之前，防止 AI 流量被 Google 组提前接管
- `apple@cn` 位于通用 Apple 之前
- `microsoft@cn` 位于通用 Microsoft 之前
- 中国域名位于 `geolocation-!cn` 之前
- 中国 IP 作为未知域名的最终国内兜底，并允许触发解析

### Bettbox 开关回落

Bettbox 中关闭某个服务开关后：

- 对应策略组从最终配置中移除
- 原本指向该组的域名 / IP 规则自动改为 `国外流量`
- Apple 中国区 / Microsoft 中国区仍保持 `DIRECT`

---

## Rule Providers

脚本当前定义 **22 个** `SKULL_*` Rule Providers，均来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)，使用 `.mrs` 格式并通过 jsDelivr 拉取，默认更新间隔 `86400s`。

### 域名规则（16 个）

```text
private
cn
geolocation-!cn
openai
anthropic
google-gemini
google
github
microsoft
microsoft@cn
apple@cn
apple
telegram
x
youtube
netflix
```

### IP 规则（6 个）

```text
private
cn
google
telegram
twitter
netflix
```

缓存路径统一位于：

```text
./ruleset/skull/
```

机场原有 `rule-providers` 会被合并保留，以避免其被节点、provider 或其他配置引用时产生依赖断裂；脚本自己的主分流规则只引用 `SKULL_*` 系列。

---

## DNS 设计

两版脚本均采用：

```yaml
enable: true
ipv6: false
prefer-h3: false
respect-rules: true
enhanced-mode: fake-ip
fake-ip-range: 198.18.0.1/16
fake-ip-filter-mode: blacklist
```

### DNS 出口

| 用途 | 上游 | 出口 |
| --- | --- | --- |
| Bootstrap | `223.5.5.5` / `119.29.29.29` | 本地 |
| 默认 / 国外域名 | Cloudflare DoH / Google DoH | `#国外流量` |
| 中国域名 / LAN / Apple CN / Microsoft CN | AliDNS DoH / DNSPod DoH | `#DIRECT` |
| `direct-nameserver` | AliDNS DoH / DNSPod DoH | `DIRECT` |
| 代理节点域名 | AliDNS DoH / DNSPod DoH | `DIRECT` |

设计目的：

- 国外业务 DNS 查询随代理出口发送，减少直接暴露给本地网络
- 中国业务使用国内 DNS，保持 CDN / GeoDNS 结果
- 用户将普通国际服务手动切到 `DIRECT` 时，可使用独立 `direct-nameserver`，避免仍依赖境外代理 DNS
- 代理服务器域名独立解析，避免 `nameserver → 国外流量 → 节点域名解析` 形成循环依赖

> **Bettbox 前提**：脚本把 `enable` 显式写成 `true` 是有意为之——客户端的 `patchRawConfig()` 只在 `overrideDns 为真` 或 `dns.enable` 不为 `true` 时，才用 App 内的 DNS 配置**整体替换**整段 `dns` 并清空 `nameserver-policy`。换句话说：**只要在 App 里打开了「DNS 覆写」，本节的所有策略都会失效。** 要使用本脚本的 DNS 设计，请在 App 中关闭 DNS 覆写。

### Fake-IP Filter

两版均包含局域网、时间同步、QQ 登录等基础排除项。Clash Verge Rev 版另外加入：

```text
+.pool.ntp.org
+.msftconnecttest.com
+.msftncsi.com
```

用于桌面系统的 NTP 与 Windows 网络连通性检测场景。

---

## 旧策略组依赖兼容

新版脚本不会无条件保留机场原代理组，但会检查以下对象中的策略组引用：

- 节点 `dialer-proxy`
- `proxy-providers` 的 `proxy` / `override.dialer-proxy`
- Rule Providers 的 `proxy`
- listeners
- tunnels
- NTP 的 `dialer-proxy`

只有真正被引用的旧组及其传递依赖会被保留，并统一设置 `hidden: true`。

若旧组名称与脚本主组重名，会使用 `__SKULL_DEP__...` 形式生成隐藏别名，避免覆盖脚本主策略组。

若发现节点／旧组名称冲突、循环依赖或指向不存在目标的引用，脚本会**就地降级并逐条告警**，而不是中断执行：

- 重复名称：跳过重复项
- 旧组与订阅节点重名：改用 `__SKULL_OLD__...` 作为隐藏组保留
- 依赖成环或指向不存在的目标：切断该引用并替换为 `REJECT`
- provider 显式关闭 `health-check`：遵循原设置，不改写

> 之所以不抛错：Bettbox 的 `handleEvaluate` 在脚本抛错时会丢弃全部产出、回退到**未覆写的原配置**，用户只得到一个错误提示条，实际拿到的是机场裸配置而非"部分生效"的脚本。就地降级至少能保证策略组与规则结构完好。

> 降级刻意**不使用 `DIRECT`** 兜底——把未知引用指向直连会造成隐私泄漏，`REJECT` 只影响可用性。

降级原因通过 `console.error` 写入客户端日志（Bettbox 日志面板 / Clash Verge Rev 日志），末尾另有一行 `共 N 处异常已按降级策略处理` 汇总。

---

## Bettbox 可视化覆写开关

Bettbox v1.18.8+ 读取：

- `ruleOptionsEnable`
- `serviceConfigs`

共 12 个开关：

```text
ChatGPT
Claude
Gemini / NotebookLM
Google
GitHub
Microsoft
Apple
Telegram
X
YouTube
Netflix
地区分组
```

| 操作 | 结果 |
| --- | --- |
| 关闭某服务 | 删除对应服务组，相关规则回落 `国外流量` |
| 关闭 `地区分组` | 同时删除 9 个地区聚合组和 9 个隐藏自动测速组，并清理其他组中的地区引用 |
| 保持默认 | 与 Clash Verge Rev 使用相同的主分流逻辑 |

---

## 两版脚本差异

| 项目 | Clash Verge Rev | Bettbox |
| --- | --- | --- |
| 核心策略组 / 规则 / Rule Providers | 33 / 28 / 22 | 默认 33 / 28 / 22，可被开关裁剪 |
| 地区自动测速组 | 9 个，全部隐藏 | 9 个，全部隐藏 |
| 自动测速间隔 | 600s | 600s |
| 节点自然排序 | 纯 JS 实现，避免依赖 `Intl` | 同一套纯 JS 实现，兼容 QuickJS |
| provider 引用 | `use: providerNames` | `use: providerNames` |
| 可视化开关 | 无 | 12 个 |
| `find-process-mode` | `strict` | `off` ※ |
| 顶层 `ipv6` | 不强制覆盖 | `false` ※ |
| TUN | 在原配置上补充 `mixed`、auto-route、strict-route、auto-detect-interface、DNS hijack；不强制开启 | 不覆写 `config.tun` |
| Fake-IP Filter | 基础项 + Windows/NTP 额外项 | 基础项 |

※ Bettbox 在脚本执行**之后**会无条件改写这些字段（`lib/state.dart` 的 `patchRawConfig`），实际取值由 App 内设置决定。详见下方「常规增强参数」。

---

## 常规增强参数

### Clash Verge Rev

```yaml
mode: rule
unified-delay: true
tcp-concurrent: true
find-process-mode: strict
profile:
  store-selected: true
  store-fake-ip: true
```

TUN 会在客户端原配置基础上补充：

```yaml
stack: mixed
auto-route: true
auto-detect-interface: true
strict-route: true
dns-hijack:
  - any:53
  - tcp://any:53
```

脚本**不会强制开启 TUN**，`enable` 仍服从客户端现有状态。

### Bettbox

```yaml
mode: rule
ipv6: false
unified-delay: true
tcp-concurrent: true
find-process-mode: off
profile:
  store-selected: true
  store-fake-ip: true
```

> **注意：以上 5 个字段在 Bettbox 上不会生效。** 脚本运行于 `State.patchRawConfig()` 的第 627 行，而客户端在其后（665–679 行）对这 5 个字段**无条件赋值**，取值来自 App 内设置。保留这段代码只为与其他客户端的同源脚本保持结构一致，并作为「不启用客户端覆写」场景的兜底；要改变这些行为请改 App 设置。
>
> 其中只有 `profile.store-selected` / `store-fake-ip` 是真正生效的——客户端对这两项使用 `== null` 判断，仅补缺失值。

Android 的 TUN / VPN 生命周期交由 Bettbox 自身管理，因此脚本不修改 `config.tun`（客户端同样会无条件写入 TUN 的全部字段，脚本写了也无效）。

---

## 使用示例

### ChatGPT 固定美国线路

进入：

```text
ChatGPT → 美国聚合
```

默认先使用隐藏的 `美国自动` 选择低延迟美国节点；也可以继续进入 `美国聚合` 手动选择具体节点。

### 普通 Apple 国际流量直连

可在 `Apple` 组手动选择 `DIRECT`。由于 DNS 已提供 `direct-nameserver`，直连业务不会继续强依赖 `国外流量` 的境外 DNS 出口。

中国区 Apple 业务由 `apple@cn` 规则提前直接 `DIRECT`，不受 `Apple` 组选择影响。

### 国内流量

LAN、中国大陆域名、中国区 Apple、中国区 Microsoft 以及最终命中的中国 IP 均直接 `DIRECT`，不会经过可手动切换的代理组。

### Bettbox 关闭 Netflix 分流

关闭 `Netflix` 开关后：

```text
Netflix 组删除
Netflix 域名规则 → 国外流量
Netflix IP 规则 → 国外流量
```

### 更换机场

无需修改脚本。只要新的订阅能正常提供 `proxies` 或 `proxy-providers`，刷新后脚本会重新生成统一结构。

---

## 注意事项

<details>
<summary><b>配置里没有任何节点会怎样？</b></summary>

当 `proxies` 和 `proxy-providers` 同时为空时，脚本直接返回原配置，不执行覆写，避免订阅获取失败时破坏配置。

</details>

<details>
<summary><b>为什么最终策略组数量超过 33？</b></summary>

33 是脚本自身定义的组数。若原订阅中的节点、provider、listener、tunnel、NTP 或 Rule Provider 引用了旧策略组，脚本会额外保留必要依赖并隐藏，因此最终数量可能增加。

</details>

<details>
<summary><b>为什么 provider 节点没有按“全球手动”的地区顺序排列？</b></summary>

JavaScript 排序只能直接处理 `config.proxies` 中已经展开的节点。`proxy-providers` 中的节点由 Mihomo 运行时加载，`全球手动` 通过 `use` 动态引用，provider 内顺序由内核管理。

</details>

<details>
<summary><b>为什么地区组里还有一个“XX自动”？</b></summary>

这是设计行为。可见的地区组是 `select` 聚合组，第一项是隐藏的 `url-test` 自动测速子组，后面才是该地区全部节点，从而同时保留自动和手动两种用法。

</details>

<details>
<summary><b>规则集首次加载失败怎么办？</b></summary>

Rule Providers 通过 jsDelivr 获取 `.mrs` 文件。首次加载需要网络可达；失败时相关流量会继续匹配后续规则或最终进入 `漏网之鱼`，后续按 interval 重新更新。

</details>

<details>
<summary><b>Bettbox 开关修改后为什么没有立即变化？</b></summary>

覆写脚本需要重新执行。修改开关后刷新对应订阅/配置，再检查最终生成的策略组和规则。

</details>

<details>
<summary><b>IPv6 为什么被关闭？</b></summary>

DNS 层两版均设置 `ipv6: false`；Bettbox 另外设置顶层 `ipv6: false`。这是为了避免在无完整 IPv6 代理/路由能力的网络中返回不可用 AAAA 结果。

</details>

---

## 致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) — Mihomo 内核
- [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) — GeoSite / GeoIP `.mrs` 规则集
- [Koolson/Qure](https://github.com/Koolson/Qure) · [0xWans/Qure](https://github.com/0xWans/Qure) · [lobehub/lobe-icons](https://github.com/lobehub/lobe-icons) — 图标资源

---

## Disclaimer

本项目仅用于 Mihomo 配置研究、学习与个人网络配置管理。

使用者应自行确保：

- 遵守所在国家或地区的法律法规
- 遵守网络服务提供商及相关平台的服务条款
- 自行判断第三方 Rule Provider 的可用性与安全性
- 自行承担配置修改造成的网络异常

**本项目不提供任何代理节点、机场订阅或相关网络服务。**
