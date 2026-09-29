<div align="center">

# Clash Verge Rev & Bettbox Custom Script

**为 Clash Verge Rev 与 Bettbox 提供一套可迁移、可控、面向 Mihomo 的统一分流脚本。**

**换机场，不换代理组，不换分流习惯。**

[![Clash Verge Rev](https://img.shields.io/badge/Clash%20Verge%20Rev-支持-2f81f7)](./Clash-Verge-Rev-mihomoScript.js)
[![Bettbox](https://img.shields.io/badge/Bettbox%20Android-v1.18.8%2B-3ddc84)](./Bettbox-mihomoScript.js)
[![Mihomo](https://img.shields.io/badge/内核-Mihomo-orange)](https://github.com/MetaCubeX/mihomo)

[快速开始](#快速开始) · [代理组架构](#代理组架构) · [分流规则](#分流规则) · [DNS](#dns-设计) · [客户端差异](#两版脚本差异) · [常见问题](#注意事项)

</div>

> [!IMPORTANT]
> 本仓库只提供 **Mihomo 配置覆写脚本**，不提供代理节点、机场订阅、网络接入或任何售卖服务。Raw 地址是脚本源码地址，**不是订阅地址**。

---

## 项目简介

不同机场往往自带完全不同的代理组、规则和 DNS。每次更换订阅，都重新整理一遍配置既费时，也容易让 AI、DNS、国内直连等关键策略出现偏差。

本项目采用统一覆写思路：

> **保留订阅中的 `proxies` / `proxy-providers`，重建主策略组、分流规则、Rule Providers 与 DNS；只有在节点或 provider 确实依赖旧策略组时，才保留必要依赖并自动隐藏。**

因此，只要新订阅能够正常提供节点，通常无需修改脚本，就可以继续使用同一套代理组结构和分流逻辑。

### 核心特性

| 能力 | 默认行为 |
| --- | --- |
| 国内流量 | 中国大陆域名 / IP 与局域网优先 `DIRECT` |
| AI 服务 | ChatGPT、Claude、Gemini / NotebookLM 独立分流，**不提供 `DIRECT` 路径** |
| 常用国际服务 | Google、GitHub、X、YouTube、Netflix、Telegram、Microsoft、Apple 独立策略组；Microsoft / Apple 首次默认 `DIRECT` |
| 游戏平台 | 两版均独立分流，首次默认 `DIRECT`；Bettbox 可通过可视化开关关闭 |
| 地区节点 | 香港、澳门、台湾、新加坡、韩国、日本、美国、欧洲、其他地区；同时支持自动测速与手动选择 |
| 节点整理 | 过滤公告 / 流量提示等伪节点；内联节点按地区 + 数字自然排序 |
| Provider | 自动补齐缺失的 health-check 参数，同时尊重机场显式关闭的健康检查 |
| DNS | 国内查询直连；默认国外查询经 `国外流量`；提供独立 `direct-nameserver` |
| 兼容性 | 自动保留真正被节点、provider、listener、tunnel、NTP 等引用的旧策略组依赖 |
| Bettbox | v1.18.8+ 提供 13 个可视化覆写开关 |

## 快速开始

### 选择对应脚本

| 客户端 | 平台 | 当前版本 | 脚本 |
| --- | --- | --- | --- |
| **Clash Verge Rev** | Windows / macOS / Linux | `2026.09.29-r1` | [`Clash-Verge-Rev-mihomoScript.js`](./Clash-Verge-Rev-mihomoScript.js) |
| **Bettbox** | Android | `2026.09.29-r1` | [`Bettbox-mihomoScript.js`](./Bettbox-mihomoScript.js) |

> 需要使用 **Mihomo 内核**，并支持 `include-all`、`exclude-type`、Rule Providers、`.mrs` 等相关特性。

### Clash Verge Rev

1. 正常导入机场订阅。
2. 打开 `订阅` → **全局扩展脚本**。
3. 选择 **Script**，不要放进 Merge 覆写。
4. 将 [`Clash-Verge-Rev-mihomoScript.js`](./Clash-Verge-Rev-mihomoScript.js) 全文复制进去并保存。
5. 刷新订阅。
6. 代理页出现 `全球手动`、`自动选择`、`国外流量`、`漏网之鱼`、服务组和地区聚合组，即表示脚本已执行。

### Bettbox

1. 正常导入机场订阅。
2. 在脚本覆写入口新建 JavaScript 覆写。
3. 将 [`Bettbox-mihomoScript.js`](./Bettbox-mihomoScript.js) 全文复制保存，并关联当前订阅。
4. 刷新订阅。
5. Bettbox v1.18.8+ 会读取脚本顶部声明的 13 个覆写开关。

> [!WARNING]
> 如果希望使用本脚本定义的完整 DNS 策略，请关闭 Bettbox 自带的 **DNS 覆写**。开启后，App 会在脚本执行之后重新生成 `dns` 配置，脚本中的 `nameserver-policy`、`direct-nameserver` 等设置将被覆盖。

### Raw 地址

```text
https://raw.githubusercontent.com/hh1848/Clash-Verge-and-Bettbox-Custom-Script/main/Clash-Verge-Rev-mihomoScript.js
https://raw.githubusercontent.com/hh1848/Clash-Verge-and-Bettbox-Custom-Script/main/Bettbox-mihomoScript.js
```

> Raw 地址适合复制或同步脚本源码。脚本更新后，需要重新加载 / 刷新对应覆写，客户端才会使用新版本。

---

## 默认分流逻辑

| 流量类型 | 默认去向 | 说明 |
| --- | --- | --- |
| LAN / 中国大陆域名与 IP | `DIRECT` | 国内流量不经过额外“国内直连”策略组 |
| ChatGPT / Claude / Gemini / NotebookLM | 对应 AI 组 | AI 组只提供代理路径 |
| Apple CN / Microsoft CN | `DIRECT` | 中国区规则优先于通用服务规则 |
| Google / GitHub / X / YouTube / Netflix / Telegram / Microsoft / Apple | 对应服务组 | 可手动选择自动、地区、具体节点或 `DIRECT`；Microsoft / Apple 首次默认 `DIRECT` |
| 游戏平台 | `游戏平台` | 两版均覆盖 Steam / Epic / Battle.net / EA / Ubisoft / Riot / Xbox；首次默认 `DIRECT` |
| 其他明确国外域名 | `国外流量` | 统一代理出口 |
| 无法分类的流量 | `漏网之鱼` | 默认走 `国外流量`，保留手动 `DIRECT` 兜底 |



## 工作原理与配置规模

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
  两版: 34 组 / 37 条 / 31 个
  25 可见 + 9 隐藏                         │
        │                                  │
        └────────────── DNS ───────────────┘
                 Fake-IP + 国内外分流
                            │
                            ▼
                     最终 Mihomo 配置
```

> 两版脚本均定义 34 个策略组。若订阅节点、provider、listener、tunnel、NTP 或 Rule Provider 仍引用旧策略组，脚本会额外保留必要旧组并设置为隐藏，因此最终组数可能更高。

### 默认配置规模

| 项目 | Clash Verge Rev | Bettbox（全部开关启用） |
| --- | ---: | ---: |
| 脚本定义策略组 | **34** | **34** |
| 主界面可见组 | **25** | **25** |
| 隐藏地区测速组 | **9** | **9** |
| 分流规则 | **37** | **37** |
| Rule Providers | **31** | **31** |

Bettbox 关闭服务或地区开关后，对应组会动态减少。

---

## 代理组架构

### 主界面显示顺序（两版一致）

| 顺序 | 策略组 |
| --- | --- |
| 01–04 基础 | `全球手动` → `自动选择` → `国外流量` → `漏网之鱼` |
| 05–07 AI | `ChatGPT` → `Claude` → `Gemini / NotebookLM` |
| 08–16 服务 | `Google` → `GitHub` → `X` → `YouTube` → `Netflix` → `Telegram` → `Microsoft` → `Apple` → `游戏平台` |
| 17–25 地区 | `香港聚合` → `澳门聚合` → `台湾聚合` → `新加坡聚合` → `韩国聚合` → `日本聚合` → `美国聚合` → `欧洲聚合` → `其他地区` |

另外还有 9 个隐藏的地区自动测速组。Bettbox 关闭服务或「地区分组」开关后，相应组会从显示列表移除。上述顺序与「国外流量」的职责彼此独立：有专属规则的服务仍由各自策略组控制。

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

`Google` · `GitHub` · `X` · `YouTube` · `Netflix` · `Telegram` · `Microsoft` · `Apple`

这些服务组允许：

```text
自动选择 / 全球手动 / 各地区聚合组 / DIRECT
```

`Microsoft` 与 `Apple` 首次默认选中 `DIRECT`；已有手动选择由 `profile.store-selected` 保留。Apple 中国区、Microsoft 中国区由前置规则直接 `DIRECT`，不受这两个组的选择影响。

### 游戏平台（两版均支持）

`游戏平台` 组覆盖 Steam、Epic Games、Battle.net（Blizzard）、EA、Ubisoft、Riot 和 Xbox 的域名规则。选项依次是自动选择、全球手动、各地区聚合组、`DIRECT`；通过 `default-selected: DIRECT` 保持首次使用默认直连。已有手动选择由 `profile.store-selected` 保留。Bettbox 可单独关闭「游戏平台」开关，相关国际游戏规则会回落到 `国外流量`。

两版均让 `category-games@cn` 和 `category-game-platforms-download@cn` 先于游戏平台规则直连，涵盖已收录的国内游戏域名及下载 CDN。此组依靠域名规则；未知下载域名或直连 IP 不保证命中，下载前可在客户端连接页面检查实际策略。

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

- `health-check.enable` 缺失时补为 `true`；若机场显式设置为 `false`，则保留原值并记录告警
- 缺少测速 URL 时使用 `https://www.gstatic.com/generate_204`
- 缺少 interval 时使用 `600`
- 缺少 lazy 时使用 `true`
- 仅当使用默认 `generate_204` 且原配置没有声明状态码时补 `expected-status: 204`
- **不会覆盖机场已经自定义的 URL / interval / timeout 等有效配置**

这样 provider 节点参与地区 `url-test` 和全局自动测速时更稳定。

---

## 分流规则

两版均有 **37 条**分流规则；自上而下匹配，命中即停止。

| 阶段 | 内容 | 目标 | 条数 |
| --- | --- | --- | ---: |
| 1 | `private` 局域网域名 | `DIRECT` | 1 |
| 2 | NotebookLM / AI Studio / Gemini API 精确域名 | `Gemini / NotebookLM` | 5 |
| 3 | `openai` / `anthropic` / `google-gemini` | 三个 AI 组 | 3 |
| 4 | `apple@cn` / `microsoft@cn` / 国内游戏平台与下载 CDN | `DIRECT` | 4 |
| 5 | 七个平台域名规则 | `游戏平台` | 7 |
| 6 | YouTube / Google / GitHub / Microsoft / Apple / Telegram / X / Netflix | 对应服务组 | 8 |
| 7 | `cn` 中国大陆域名 | `DIRECT` | 1 |
| 8 | `geolocation-!cn` | `国外流量` | 1 |
| 9 | private / Google / Telegram / Twitter / Netflix IP | 对应目标，`no-resolve` | 5 |
| 10 | China IP | `DIRECT`，允许解析 | 1 |
| 末 | `MATCH` | `漏网之鱼` | 1 |
|  | **每版合计** |  | **37** |

### 关键优先级

- NotebookLM / Gemini 精确域名位于通用 Google 之前，防止 AI 流量被 Google 组提前接管
- `apple@cn` 位于通用 Apple 之前
- `microsoft@cn` 位于通用 Microsoft 之前
- 两版的国内游戏域名及下载 CDN 均位于七个平台的通用规则之前；Xbox 位于通用 Microsoft 之前
- 中国域名位于 `geolocation-!cn` 之前
- 中国 IP 作为未知域名的最终国内兜底，并允许触发解析

### Bettbox 开关回落

Bettbox 中关闭某个服务开关后：

- 对应策略组从最终配置中移除
- 原本指向该组的域名 / IP 规则自动改为 `国外流量`
- Apple 中国区 / Microsoft 中国区及国内游戏和下载 CDN 规则仍保持 `DIRECT`

---

## Rule Providers

两版均定义 **31 个** `SKULL_*` Rule Providers，均来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)，使用 `.mrs` 格式并通过 jsDelivr 拉取，默认更新间隔 `86400s`。

### 域名规则（两版均为 25 个）

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
category-games@cn
category-game-platforms-download@cn
steam
epicgames
blizzard
ea
ubisoft
riot
xbox
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
| 国内游戏与下载 CDN（Clash Verge Rev） | AliDNS DoH / DNSPod DoH | `#DIRECT` |
| `direct-nameserver` | AliDNS DoH / DNSPod DoH | `DIRECT` |
| 代理节点域名 | AliDNS DoH / DNSPod DoH | `DIRECT` |

Bettbox 版虽同样让国内游戏与下载 CDN 的**业务规则**直连，但目前没有为这两类域名添加专门的 `nameserver-policy`；其 DNS 查询会按现有 DNS 配置处理。两端网络环境不同，排查游戏更新时可同时检查连接策略与 DNS 查询出口。

设计目的：

- 国外业务 DNS 查询随代理出口发送，减少直接暴露给本地网络
- 中国业务使用国内 DNS，保持 CDN / GeoDNS 结果
- 用户将普通国际服务手动切到 `DIRECT` 时，可使用独立 `direct-nameserver`，避免仍依赖境外代理 DNS
- 代理服务器域名独立解析，避免 `nameserver → 国外流量 → 节点域名解析` 形成循环依赖

> [!WARNING]
> **Bettbox 请关闭 App 内的「DNS 覆写」后再使用本节策略。** Bettbox 会在脚本执行后继续应用客户端设置；一旦开启 DNS 覆写，整段 `dns` 会被客户端重新生成，脚本中的 `nameserver-policy`、`direct-nameserver` 等设置将不再生效。

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

> [!NOTE]
> 两版客户端在脚本执行失败时都可能放弃本次覆写，因此脚本优先采用“就地降级 + 日志告警”，而不是直接抛错。对于无法安全解析的依赖，降级目标使用 `REJECT` 而不是 `DIRECT`，避免未知流量意外直连。

降级原因通过 `console.error` 写入客户端日志（Bettbox 日志面板 / Clash Verge Rev 日志），末尾另有一行 `共 N 处异常已按降级策略处理` 汇总。

---

## Bettbox 可视化覆写开关

Bettbox v1.18.8+ 读取：

- `ruleOptionsEnable`
- `serviceConfigs`

共 13 个开关：

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
游戏平台
地区分组
```

| 操作 | 结果 |
| --- | --- |
| 关闭某服务 | 删除对应服务组，相关规则回落 `国外流量` |
| 关闭 `地区分组` | 同时删除 9 个地区聚合组和 9 个隐藏自动测速组，并清理其他组中的地区引用 |
| 保持默认 | 与 Clash Verge Rev 使用相同的策略组顺序和基本分流逻辑，游戏平台组首次默认 `DIRECT` |

---

## 两版脚本差异

| 项目 | Clash Verge Rev | Bettbox |
| --- | --- | --- |
| 核心策略组 / 规则 / Rule Providers | 34 / 37 / 31 | 默认 34 / 37 / 31，组可被开关裁剪 |
| 地区自动测速组 | 9 个，全部隐藏 | 9 个，全部隐藏 |
| 自动测速间隔 | 600s | 600s |
| 节点自然排序 | 纯 JS 实现，避免依赖 `Intl` | 同一套纯 JS 实现，兼容 QuickJS |
| provider 引用 | `use: providerNames` | `use: providerNames` |
| 可视化开关 | 无 | 13 个 |
| `find-process-mode` | `strict` | `off` ※ |
| 顶层 `ipv6` | 不强制覆盖 | `false` ※ |
| TUN | 在原配置上补充 `mixed`、auto-route、strict-route、auto-detect-interface、DNS hijack；不强制开启 | 不覆写 `config.tun` |
| Fake-IP Filter | 基础项 + Windows/NTP 额外项 | 基础项 |

※ Bettbox 会在脚本执行**之后**继续应用 App 内设置，因此这些字段的最终值以客户端设置为准。详见下方「常规增强参数」。

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

> Clash Verge Rev 会在扩展脚本之后继续应用部分客户端侧配置，因此 `mode`、`unified-delay` 等最终值仍以客户端当前设置为准；`tcp-concurrent` / `find-process-mode` 则可由脚本写入。

TUN 会在客户端原配置基础上**补缺失项**：

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

> TUN 相关字段最终仍受 Clash Verge Rev 客户端设置控制。脚本只为缺失项补默认值，不强行覆盖用户已经明确设置的值。

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

> **Bettbox 会在脚本执行后再次应用 App 内设置。** 因此 `mode`、顶层 `ipv6`、`unified-delay`、`tcp-concurrent`、`find-process-mode` 的最终值以 Bettbox 设置为准；`profile.store-selected` / `store-fake-ip` 可由脚本保留。

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

`Apple` 组首次默认 `DIRECT`，也可手动切换。由于 DNS 已提供 `direct-nameserver`，直连业务不会继续强依赖 `国外流量` 的境外 DNS 出口。

中国区 Apple 业务由 `apple@cn` 规则提前直接 `DIRECT`，不受 `Apple` 组选择影响。

### 国内流量

LAN、中国大陆域名、中国区 Apple、中国区 Microsoft、两版中已收录的国内游戏域名与下载 CDN，以及最终命中的中国 IP 均直接 `DIRECT`，不会经过可手动切换的代理组。

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
<summary><b>为什么最终策略组数量超过脚本定义数量？</b></summary>

两版脚本均定义 34 组。若原订阅中的节点、provider、listener、tunnel、NTP 或 Rule Provider 引用了旧策略组，脚本会额外保留必要依赖并隐藏，因此最终数量可能增加。

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
<summary><b>规则集提示体积超限，或者担心上游内容变化？</b></summary>

两版脚本都为每个 Rule Provider 设置了 `size-limit`（16 MiB）。超过该体积的响应会被内核拒绝加载，相关流量回落到后续规则——正常 `.mrs` 文件远小于此值，触发通常意味着上游异常或响应被中间设备替换。

另外，规则集 URL 指向 `meta-rules-dat` 的 **`@meta` 可变分支**，上游改动会在下一个 `interval`（86400s）到期时静默生效。需要确定性时，把脚本里的 `RULESET_REF` 改成固定 tag 或 commit SHA 即可——**改完必须清空一次规则集缓存**，否则会继续使用已下载的旧文件。

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

## 问题反馈

如果遇到脚本不生效、节点分类错误、规则命中异常或 DNS 行为异常，可通过 [GitHub Issues](https://github.com/hh1848/Clash-Verge-and-Bettbox-Custom-Script/issues) 反馈。

建议同时提供：

- 客户端名称与版本
- Mihomo 内核版本
- 当前脚本版本
- 相关日志中的 `[SKULL]` 告警
- 已脱敏的配置片段或节点名称示例

> [!CAUTION]
> **不要上传订阅 URL、节点密码、UUID、Token、Cookie 或其他凭据。**

---

## 致谢

- [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) — Mihomo 内核
- [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat) — GeoSite / GeoIP `.mrs` 规则集
- [Koolson/Qure](https://github.com/Koolson/Qure) · [0xWans/Qure](https://github.com/0xWans/Qure) · [lobehub/lobe-icons](https://github.com/lobehub/lobe-icons) — 图标资源

---

## 免责声明

本项目仅用于 Mihomo 配置研究、学习与个人网络配置管理。

使用者应自行确保：

- 遵守所在国家或地区的法律法规
- 遵守网络服务提供商及相关平台的服务条款
- 自行判断第三方 Rule Provider 的可用性与安全性
- 自行承担配置修改造成的网络异常

**本项目不提供任何代理节点、机场订阅或相关网络服务。**
