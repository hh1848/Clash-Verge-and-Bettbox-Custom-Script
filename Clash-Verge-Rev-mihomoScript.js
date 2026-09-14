// Clash Verge Rev 全局扩展脚本
// Version: 2026.09.14-r1
// 目标：国内直连、国外代理；AI 强制代理；常用国际服务独立；地区聚合（自动测速 + 手动节点）。
// 用法：订阅 -> 全局扩展脚本（Script）

function main(config, profileName) {
  const oldGroups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];
  // ---------- 0. 基础检查：保留机场 proxies / proxy-providers ----------
  const directProxyCount = Array.isArray(config.proxies) ? config.proxies.length : 0;
  const providers = config["proxy-providers"];
  const providerNames = providers && typeof providers === "object"
    ? Object.keys(providers)
    : [];
  const providerCount = providerNames.length;

  if (directProxyCount === 0 && providerCount === 0) {
    return config;
  }

  const TEST_URL = "https://www.gstatic.com/generate_204";
  const INTERVAL = 600;
  const RULE_INTERVAL = 86400;
  const BYPASS_TYPES = ["direct", "pass", "compatible"];
  const GROUP_EXCLUDE_TYPES = "Direct|Pass|Compatible";
  const isProxyCandidate = (proxy) =>
    proxy && !BYPASS_TYPES.includes(String(proxy.type || "").toLowerCase());

  // provider 节点的 url-test 依赖 provider 自身 health-check 数据。
  // 仅补齐缺失项并强制启用，不覆盖机场已有的 url / interval / timeout 等配置。
  const ensureProviderHealthCheck = (provider) => {
    if (!provider || typeof provider !== "object" || Array.isArray(provider)) {
      return;
    }

    const current =
      provider["health-check"] &&
      typeof provider["health-check"] === "object" &&
      !Array.isArray(provider["health-check"])
        ? provider["health-check"]
        : {};

    provider["health-check"] = {
      ...current,
      enable: true,
      url: current.url || TEST_URL,
      interval:
        typeof current.interval === "number" && current.interval > 0
          ? current.interval
          : INTERVAL,
      lazy:
        typeof current.lazy === "boolean"
          ? current.lazy
          : true
    };

    // 仅默认 generate_204 配套补 204；自定义 URL 保持原有状态码语义。
    if (current["expected-status"] == null) {
      delete provider["health-check"]["expected-status"];
      if (provider["health-check"].url === TEST_URL) {
        provider["health-check"]["expected-status"] = 204;
      }
    }
  };

  for (const name of providerNames) {
    ensureProviderHealthCheck(providers[name]);
  }
  // provider 内的直连出站可能是旧组依赖，因此保留原定义；在新组的 exclude-type 中过滤。

  // 仅排除明确的信息/提醒节点，避免误伤“香港01｜不限流量”等正常节点。
  const PSEUDO_PATTERN_BODY =
    "到期|过期|剩余(?:流量|时间|天数|[:：]|\\s*\\d)|流量(?:剩余|到期|重置|[:：]\\s*\\d)|套餐(?:到期|剩余|[:：])|官网(?:地址)?|网址|订阅(?:到期|更新|地址)|(?:下次|距离).*重置|公告(?:[:：]|$)|通知(?:[:：]|$)|提示(?:[:：]|$)|教程(?:[:：]|$)|使用说明|使用须知|客服(?:[:：]|$)|联系(?:客服)?|有超时|超时.*重启|请.*重启网络|重启.*网络|Expire(?:d)?(?:\\s*[:：]|\\s*\\d|$)|Traffic(?:\\s*(?:Left|Remaining)|[:：]\\s*\\d)|Remaining(?:\\s*Traffic)?|Website(?:\\s*[:：]|$)";

  const EXCLUDE = `(?i)(${PSEUDO_PATTERN_BODY})`;

  // ---------- 1. 图标 ----------
  const ICON = {
    foreign:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Global.png",

    manual:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",

    auto:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",

    final:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png",

    chatgpt:
      "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/openai.png",
    claude:
      "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/claude-color.png",
    gemini:
      "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/gemini-color.png",

    google:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Google_Search.png",
    github:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/GitHub.png",
    microsoft:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Microsoft.png",
    apple:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Apple.png",
    telegram:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Telegram.png",
    x:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Twitter(X).png",
    youtube:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/YouTube.png",
    netflix:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Netflix.png",

    hk: "https://flagcdn.com/w160/hk.png",
    mo: "https://flagcdn.com/w160/mo.png",
    tw: "https://flagcdn.com/w160/tw.png",
    kr: "https://flagcdn.com/w160/kr.png",
    sg: "https://flagcdn.com/w160/sg.png",
    jp: "https://flagcdn.com/w160/jp.png",
    us: "https://flagcdn.com/w160/us.png",
    eu: "https://flagcdn.com/w160/eu.png",

    // 美化：其他地区
    other:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png"
  };

  // ---------- 2. 节点地区筛选 ----------
  // 同一套地区规则同时用于 Mihomo filter、其他地区排除和全球手动排序，避免三份规则漂移。
  const REGION_PATTERN_BODY = {
    hk: "🇭🇰|香港|Hong ?Kong|(?:^|[^A-Za-z])HK(?:G)?(?:[0-9]|[^A-Za-z]|$)",
    mo: "🇲🇴|澳门|澳門|Macao|Macau|(?:^|[^A-Za-z])MO(?:[0-9]|[^A-Za-z]|$)",
    tw: "🇹🇼|台湾|台灣|Taiwan|Taipei|(?:^|[^A-Za-z])TW(?:N)?(?:[0-9]|[^A-Za-z]|$)",
    kr: "🇰🇷|韩国|韓國|Korea|Seoul|(?:^|[^A-Za-z])(?:KR|KOR)(?:[0-9]|[^A-Za-z]|$)",
    sg: "🇸🇬|新加坡|狮城|獅城|Singapore|(?:^|[^A-Za-z])SG(?:P)?(?:[0-9]|[^A-Za-z]|$)",
    jp: "🇯🇵|日本|东京|東京|大阪|Japan|Tokyo|Osaka|(?:^|[^A-Za-z])JP(?:N)?(?:[0-9]|[^A-Za-z]|$)",
    us: "🇺🇸|美国|美國|美[.·|｜_\\s-]|United ?States|America|Los ?Angeles|洛杉矶|洛杉磯|San ?Jose|圣何塞|聖何塞|Seattle|西雅图|西雅圖|New ?York|纽约|紐約|Phoenix|凤凰城|鳳凰城|Salt ?Lake(?: ?City)?|盐湖城|鹽湖城|San ?Francisco|旧金山|舊金山|Dallas|达拉斯|達拉斯|Chicago|芝加哥|Las ?Vegas|拉斯维加斯|拉斯維加斯|Ashburn|阿什本|Boston|波士顿|波士頓|Miami|迈阿密|邁阿密|Denver|丹佛|Houston|休斯顿|休士頓|Austin|奥斯汀|奧斯汀|Washington ?D\\.?C\\.?|华盛顿(?:特区)?|華盛頓(?:特區)?|(?:^|[^A-Za-z])(?:LAX|SJC|SEA|NYC|PHX|SLC|SFO|DFW|ORD|LAS|IAD|BOS|MIA|DEN|IAH|HOU|DCA|US|USA)(?:[0-9]|[^A-Za-z]|$)",
    // 挪威保留国旗/中文/英文/NOR；不使用易与 No.01 编号混淆的两字母 NO。
    eu: "🇪🇺|🇬🇧|🇩🇪|🇫🇷|🇳🇱|🇪🇸|🇮🇹|🇨🇭|🇸🇪|🇫🇮|🇳🇴|🇵🇱|🇮🇪|🇦🇹|🇧🇪|🇨🇿|🇩🇰|🇵🇹|🇬🇷|🇮🇸|🇱🇺|欧洲|歐洲|Europe|European|英国|英國|法国|法國|德国|德國|荷兰|荷蘭|西班牙|意大利|瑞士|瑞典|芬兰|挪威|Norway|波兰|爱尔兰|London|Paris|Frankfurt|Amsterdam|Madrid|Milan|Zurich|Stockholm|Helsinki|Oslo|Warsaw|Dublin|(?:^|[^A-Za-z])(?:EU|UK|GB|GBR|DE|DEU|FR|FRA|NL|NLD|ES|ESP|IT|ITA|CH|CHE|SE|SWE|FI|FIN|NOR|PL|POL|IE|IRL|AT|AUT|BE|BEL|CZ|CZE|DK|DNK|PT|PRT|GR|GRC)(?:[0-9]|[^A-Za-z]|$)"
  };

  // 地区优先级同时定义“全球手动”排序和地区组互斥关系。
  // 若一个名称同时含多个地区标识（如“香港→美国”），只归入最靠前的地区。
  const REGION_KEYS = ["hk", "mo", "tw", "sg", "kr", "jp", "us", "eu"];

  const FILTER = Object.fromEntries(
    REGION_KEYS.map((key) => [key, `(?i)(${REGION_PATTERN_BODY[key]})`])
  );

  const REGION_EXCLUDE = Object.fromEntries(
    REGION_KEYS.map((key, index) => {
      const higherPriorityPatterns = REGION_KEYS
        .slice(0, index)
        .map((higherKey) => REGION_PATTERN_BODY[higherKey]);

      return [
        key,
        higherPriorityPatterns.length > 0
          ? `(?i)(${PSEUDO_PATTERN_BODY}|${higherPriorityPatterns.join("|")})`
          : EXCLUDE
      ];
    })
  );

  const MANUAL_REGION_TESTS = REGION_KEYS.map(
    (key) => new RegExp(`(?:${REGION_PATTERN_BODY[key]})`, "i")
  );

  const OTHER_EXCLUDE =
    `(?i)(${PSEUDO_PATTERN_BODY}|${REGION_KEYS.map((key) => REGION_PATTERN_BODY[key]).join("|")})`;

  const PSEUDO_NODE_RE = new RegExp(`(?:${PSEUDO_PATTERN_BODY})`, "i");

  const manualRegionRank = (name) => {
    for (let i = 0; i < MANUAL_REGION_TESTS.length; i += 1) {
      if (MANUAL_REGION_TESTS[i].test(name)) return i;
    }
    return MANUAL_REGION_TESTS.length;
  };

  // Boa 未启用 Intl 时 localeCompare 的 numeric 选项会被忽略；使用纯 JS 自然排序保持跨引擎一致。
  const naturalCompare = (a, b) => {
    const ax = String(a).toLowerCase().split(/(\d+)/);
    const bx = String(b).toLowerCase().split(/(\d+)/);
    const length = Math.max(ax.length, bx.length);

    for (let i = 0; i < length; i += 1) {
      const x = ax[i];
      const y = bx[i];

      if (x === undefined) return -1;
      if (y === undefined) return 1;
      if (x === y) continue;

      const xIsNumber = /^\d+$/.test(x);
      const yIsNumber = /^\d+$/.test(y);

      if (xIsNumber && yIsNumber) {
        const xn = x.replace(/^0+(?=\d)/, "");
        const yn = y.replace(/^0+(?=\d)/, "");

        if (xn.length !== yn.length) return xn.length - yn.length;
        if (xn !== yn) return xn < yn ? -1 : 1;
        if (x.length !== y.length) return x.length - y.length;
        continue;
      }

      return x < y ? -1 : 1;
    }

    return 0;
  };

  const manualProxyNames = Array.isArray(config.proxies)
    ? config.proxies
        .filter(isProxyCandidate)
        .map((proxy) => proxy && proxy.name)
        .filter(
          (name) =>
            typeof name === "string" &&
            name.length > 0 &&
            !PSEUDO_NODE_RE.test(name)
        )
        .sort((a, b) => {
          const rankDiff = manualRegionRank(a) - manualRegionRank(b);
          return rankDiff !== 0 ? rankDiff : naturalCompare(a, b);
        })
    : [];

  // ---------- 3. 工具函数 ----------
  const select = (name, icon, proxies) => ({
    name,
    type: "select",
    icon,
    proxies
  });

  const regionAuto = (name, icon, filter, excludeFilter = EXCLUDE) => ({
    name,
    type: "url-test",
    icon,
    // 底层地区测速组仅供地区聚合组调用，不在 Clash Verge Rev 主界面显示。
    hidden: true,
    "include-all": true,
    "exclude-type": GROUP_EXCLUDE_TYPES,
    filter,
    "exclude-filter": excludeFilter,
    url: TEST_URL,
    interval: INTERVAL,
    tolerance: 80,
    lazy: true,
    "expected-status": 204,
    "empty-fallback": "REJECT"
  });

  // 地区聚合组：首项为该地区自动测速，同时保留该地区全部节点供手动切换。
  const regionAggregate = (
    name,
    autoName,
    icon,
    filter,
    excludeFilter = EXCLUDE
  ) => ({
    name,
    type: "select",
    icon,
    proxies: [autoName],
    "include-all": true,
    "exclude-type": GROUP_EXCLUDE_TYPES,
    filter,
    "exclude-filter": excludeFilter,
    "empty-fallback": "REJECT"
  });

  const DOMAIN_BASE =
    "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/";

  const IP_BASE =
    "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/";

  const domainProvider = (file) => ({
    type: "http",
    behavior: "domain",
    format: "mrs",
    path: `./ruleset/skull/${file}`,
    url: DOMAIN_BASE + file,
    interval: RULE_INTERVAL
  });

  const ipProvider = (file) => ({
    type: "http",
    behavior: "ipcidr",
    format: "mrs",
    path: `./ruleset/skull/ip-${file}`,
    url: IP_BASE + file,
    interval: RULE_INTERVAL
  });

  // ---------- 4. 策略组 ----------
  const REGION_GROUPS = [
    "香港聚合",
    "澳门聚合",
    "台湾聚合",
    "新加坡聚合",
    "韩国聚合",
    "日本聚合",
    "美国聚合",
    "欧洲聚合",
    "其他地区"
  ];

  // AI 不提供 DIRECT，也不引用任何可切换到 DIRECT 的上级组，避免间接直连。
  const AI_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS
  ];

  // 普通国际服务允许用户显式选择 DIRECT。
  const SERVICE_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS,
    "DIRECT"
  ];

  // “国外流量”只负责一般国外流量，不提供 DIRECT。
  const FOREIGN_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS
  ];

  config["proxy-groups"] = [
    // 1. 基础策略
    {
      name: "全球手动",
      type: "select",
      icon: ICON.manual,
      "exclude-type": GROUP_EXCLUDE_TYPES,
      // 直接节点按 香港→澳门→台湾→新加坡→韩国→日本→美国→欧洲→其他 排序。
      // provider 动态节点通过 use 引入，不参与这里的 JS 自然排序。
      // 不加入 DIRECT，并排除自定义直连/绕过出站。
      ...(manualProxyNames.length > 0
        ? { proxies: [...manualProxyNames] }
        : providerNames.length === 0
          ? { proxies: ["REJECT"] }
          : {}),
      ...(providerNames.length > 0
        ? {
            use: providerNames,
            "exclude-filter": EXCLUDE
          }
        : {}),
      "empty-fallback": "REJECT"
    },

    {
      name: "自动选择",
      type: "url-test",
      icon: ICON.auto,
      "include-all": true,
      "exclude-type": GROUP_EXCLUDE_TYPES,
      "exclude-filter": EXCLUDE,
      url: TEST_URL,
      interval: INTERVAL,
      tolerance: 80,
      lazy: true,
      "expected-status": 204,
      "empty-fallback": "REJECT"
    },

    select("国外流量", ICON.foreign, FOREIGN_OPTIONS),

    // 未被任何明确规则命中的流量默认交给“国外流量”，但保留 DIRECT 手动兜底。
    select("漏网之鱼", ICON.final, [
      "国外流量",
      "自动选择",
      "全球手动",
      "DIRECT"
    ]),

    // 2. AI：强制代理，无 DIRECT
    select("ChatGPT", ICON.chatgpt, AI_OPTIONS),
    select("Claude", ICON.claude, AI_OPTIONS),
    select("Gemini / NotebookLM", ICON.gemini, AI_OPTIONS),

    // 3. 常用国际服务
    select("Google", ICON.google, SERVICE_OPTIONS),
    select("GitHub", ICON.github, SERVICE_OPTIONS),
    select("Microsoft", ICON.microsoft, SERVICE_OPTIONS),
    select("Apple", ICON.apple, SERVICE_OPTIONS),
    select("Telegram", ICON.telegram, SERVICE_OPTIONS),
    select("X", ICON.x, SERVICE_OPTIONS),
    select("YouTube", ICON.youtube, SERVICE_OPTIONS),
    select("Netflix", ICON.netflix, SERVICE_OPTIONS),

    // 4. 地区聚合：聚合组 = 地区自动测速 + 该地区全部节点
    regionAggregate("香港聚合", "香港自动", ICON.hk, FILTER.hk, REGION_EXCLUDE.hk),
    regionAggregate("澳门聚合", "澳门自动", ICON.mo, FILTER.mo, REGION_EXCLUDE.mo),
    regionAggregate("台湾聚合", "台湾自动", ICON.tw, FILTER.tw, REGION_EXCLUDE.tw),
    regionAggregate("新加坡聚合", "新加坡自动", ICON.sg, FILTER.sg, REGION_EXCLUDE.sg),
    regionAggregate("韩国聚合", "韩国自动", ICON.kr, FILTER.kr, REGION_EXCLUDE.kr),
    regionAggregate("日本聚合", "日本自动", ICON.jp, FILTER.jp, REGION_EXCLUDE.jp),
    regionAggregate("美国聚合", "美国自动", ICON.us, FILTER.us, REGION_EXCLUDE.us),
    regionAggregate("欧洲聚合", "欧洲自动", ICON.eu, FILTER.eu, REGION_EXCLUDE.eu),
    regionAggregate("其他地区", "其他自动", ICON.other, "(?i)^.*$", OTHER_EXCLUDE),

    // 5. 地区自动测速子组
    regionAuto("香港自动", ICON.hk, FILTER.hk, REGION_EXCLUDE.hk),
    regionAuto("澳门自动", ICON.mo, FILTER.mo, REGION_EXCLUDE.mo),
    regionAuto("台湾自动", ICON.tw, FILTER.tw, REGION_EXCLUDE.tw),
    regionAuto("新加坡自动", ICON.sg, FILTER.sg, REGION_EXCLUDE.sg),
    regionAuto("韩国自动", ICON.kr, FILTER.kr, REGION_EXCLUDE.kr),
    regionAuto("日本自动", ICON.jp, FILTER.jp, REGION_EXCLUDE.jp),
    regionAuto("美国自动", ICON.us, FILTER.us, REGION_EXCLUDE.us),
    regionAuto("欧洲自动", ICON.eu, FILTER.eu, REGION_EXCLUDE.eu),
    regionAuto("其他自动", ICON.other, "(?i)^.*$", OTHER_EXCLUDE)
  ];

  // ---------- 5. Rule Providers ----------
  const customRuleProviders = {
    SKULL_Lan: domainProvider("private.mrs"),
    SKULL_China: domainProvider("cn.mrs"),
    SKULL_Foreign: domainProvider("geolocation-!cn.mrs"),

    SKULL_OpenAI: domainProvider("openai.mrs"),
    SKULL_Claude: domainProvider("anthropic.mrs"),
    SKULL_Gemini: domainProvider("google-gemini.mrs"),

    SKULL_Google: domainProvider("google.mrs"),
    SKULL_GitHub: domainProvider("github.mrs"),
    SKULL_Microsoft: domainProvider("microsoft.mrs"),
    SKULL_MicrosoftCN: domainProvider("microsoft@cn.mrs"),
    SKULL_AppleCN: domainProvider("apple@cn.mrs"),
    SKULL_Apple: domainProvider("apple.mrs"),
    SKULL_Telegram: domainProvider("telegram.mrs"),
    SKULL_X: domainProvider("x.mrs"),
    SKULL_YouTube: domainProvider("youtube.mrs"),
    SKULL_Netflix: domainProvider("netflix.mrs"),

    SKULL_LanIP: ipProvider("private.mrs"),
    SKULL_ChinaIP: ipProvider("cn.mrs"),
    SKULL_GoogleIP: ipProvider("google.mrs"),
    SKULL_TelegramIP: ipProvider("telegram.mrs"),
    SKULL_XIP: ipProvider("twitter.mrs"),
    SKULL_NetflixIP: ipProvider("netflix.mrs")
  };

  config["rule-providers"] = {
    ...(config["rule-providers"] || {}),
    ...customRuleProviders
  };

  // 仅保留节点、provider 等显式引用的旧组及其传递依赖。
  // 同名旧组使用稳定别名，避免覆盖脚本主组；辅助组隐藏，不加入 AI 选项。
  const preserveDependencies = () => {
    const newNames = new Set(config["proxy-groups"].map((group) => group.name));
    const builtins = new Set(["DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE", "GLOBAL"]);
    const nodes = new Map();
    for (const proxy of config.proxies || []) {
      if (!proxy || typeof proxy.name !== "string") continue;
      if (nodes.has(proxy.name) || newNames.has(proxy.name) || builtins.has(proxy.name)) {
        throw new Error(`节点名称冲突：${proxy.name}。请为订阅节点设置唯一名称。`);
      }
      nodes.set(proxy.name, proxy);
    }
    const old = new Map();
    for (const group of oldGroups) {
      if (!group || typeof group.name !== "string") continue;
      if (old.has(group.name) || nodes.has(group.name) || builtins.has(group.name)) {
        throw new Error(`原配置名称冲突：${group.name}`);
      }
      old.set(group.name, group);
    }
    const used = new Set([...newNames, ...nodes.keys(), ...old.keys(), ...providerNames]);
    const renamed = new Map();
    const aliases = new Set();
    const visiting = new Set();
    const retained = [];

    const resolve = (name) => {
      if (typeof name !== "string" || !name || builtins.has(name)) return name;
      if (visiting.has(name)) throw new Error(`代理依赖存在循环：${name}`);
      if (renamed.has(name)) return renamed.get(name);
      if (aliases.has(name)) return name;
      if (old.has(name)) {
        visiting.add(name);
        let alias = name;
        if (newNames.has(name)) {
          alias = `__SKULL_DEP__${name}`;
          while (used.has(alias)) alias = `_${alias}`;
        }
        used.add(alias);
        const copy = { ...old.get(name), name: alias, hidden: true };
        if (Array.isArray(copy.proxies)) copy.proxies = copy.proxies.map(resolve);
        // default-selected 失效时由内核回退；只改写实际指向旧组的默认项。
        if (old.has(copy["default-selected"])) {
          copy["default-selected"] = resolve(copy["default-selected"]);
        }
        visiting.delete(name);
        renamed.set(name, alias);
        aliases.add(alias);
        retained.push(copy);
        return alias;
      }
      if (nodes.has(name)) {
        visiting.add(name);
        const proxy = nodes.get(name);
        if (proxy["dialer-proxy"]) proxy["dialer-proxy"] = resolve(proxy["dialer-proxy"]);
        visiting.delete(name);
        return name;
      }
      // provider 动态节点尚未加载，无法在扩展脚本阶段枚举或验证其名字。
      if (providerCount > 0 && !newNames.has(name)) return name;
      throw new Error(`代理依赖不存在：${name}`);
    };
    const rewrite = (object, key) => {
      if (object && object[key]) object[key] = resolve(object[key]);
    };
    for (const proxy of nodes.values()) rewrite(proxy, "dialer-proxy");
    for (const name of providerNames) {
      const provider = providers[name];
      if (!provider || typeof provider !== "object") continue;
      rewrite(provider, "proxy");
      rewrite(provider.override, "dialer-proxy");
      for (const proxy of provider.payload || []) rewrite(proxy, "dialer-proxy");
    }
    for (const provider of Object.values(config["rule-providers"])) rewrite(provider, "proxy");
    for (const listener of config.listeners || []) rewrite(listener, "proxy");
    for (const tunnel of config.tunnels || []) rewrite(tunnel, "proxy");
    rewrite(config.ntp, "proxy");
    config["proxy-groups"].push(...retained);
  };
  preserveDependencies();

  // ---------- 6. 分流规则 ----------
  // 优先级：LAN → AI → 特殊国际服务 → 中国域名 → 一般国外域名 → IP → MATCH
  // NotebookLM / Gemini 必须早于通用 Google。
  config.rules = [
    // LAN
    "RULE-SET,SKULL_Lan,DIRECT",

    // AI
    "DOMAIN-SUFFIX,notebooklm.google,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,notebooklm.google.com,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,aistudio.google.com,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,ai.google.dev,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini / NotebookLM",

    "RULE-SET,SKULL_OpenAI,ChatGPT",
    "RULE-SET,SKULL_Claude,Claude",
    "RULE-SET,SKULL_Gemini,Gemini / NotebookLM",

    // 中国区 Apple 必须在通用 Apple 前直连
    "RULE-SET,SKULL_AppleCN,DIRECT",
    "RULE-SET,SKULL_MicrosoftCN,DIRECT",

    // 常用国际服务
    "RULE-SET,SKULL_YouTube,YouTube",
    "RULE-SET,SKULL_Google,Google",
    "RULE-SET,SKULL_GitHub,GitHub",
    "RULE-SET,SKULL_Microsoft,Microsoft",
    "RULE-SET,SKULL_Apple,Apple",
    "RULE-SET,SKULL_Telegram,Telegram",
    "RULE-SET,SKULL_X,X",
    "RULE-SET,SKULL_Netflix,Netflix",

    // 中国大陆域名优先直连
    "RULE-SET,SKULL_China,DIRECT",

    // 除上述特殊服务外，其余明确的国外域名统一交给“国外流量”
    "RULE-SET,SKULL_Foreign,国外流量",

    // IP 规则
    "RULE-SET,SKULL_LanIP,DIRECT,no-resolve",
    "RULE-SET,SKULL_GoogleIP,Google,no-resolve",
    "RULE-SET,SKULL_TelegramIP,Telegram,no-resolve",
    "RULE-SET,SKULL_XIP,X,no-resolve",
    "RULE-SET,SKULL_NetflixIP,Netflix,no-resolve",

    // 中国 IP 作为未知域名的最终国内兜底：允许触发 DNS 解析
    "RULE-SET,SKULL_ChinaIP,DIRECT",

    // 无法明确判断的流量
    "MATCH,漏网之鱼"
  ];

  // ---------- 7. DNS ----------
  // DNS 关键行为由脚本明确控制；国内域名使用国内 DNS 直连，其余域名使用境外 DNS 并经“国外流量”发送。
  const DOMESTIC_DNS = [
    "https://dns.alidns.com/dns-query#DIRECT",
    "https://doh.pub/dns-query#DIRECT"
  ];
  config.dns = {
    enable: true,
    ipv6: false,
    "prefer-h3": false,
    "respect-rules": true,

    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "fake-ip-filter-mode": "blacklist",

    "fake-ip-filter": [
      "*.lan",
      "*.local",
      "localhost.ptlogin2.qq.com",
      "time.*.com",
      "time.*.gov",
      "time.*.edu.cn",
      "ntp.*.com",
      "+.pool.ntp.org",
      "+.msftconnecttest.com",
      "+.msftncsi.com"
    ],

    // 仅用于 DNS 上游域名 bootstrap；不承担普通业务域名解析。
    "default-nameserver": [
      "223.5.5.5",
      "119.29.29.29"
    ],

    // 默认 / 境外域名：使用境外 DoH，并明确从“国外流量”出口发送，避免本地 DNS 暴露查询。
    nameserver: [
      "https://1.1.1.1/dns-query#国外流量",
      "https://8.8.8.8/dns-query#国外流量"
    ],

    // 国内域名：仅使用国内 DoH，并明确直连，保持国内 CDN / GeoDNS 结果。
    "nameserver-policy": {
      "rule-set:SKULL_China": [...DOMESTIC_DNS],
      "rule-set:SKULL_Lan": [...DOMESTIC_DNS],
      "rule-set:SKULL_AppleCN": [...DOMESTIC_DNS],
      "rule-set:SKULL_MicrosoftCN": [...DOMESTIC_DNS]
    },

    // 已判定为 DIRECT 的域名连接独立解析，避免手选直连后仍依赖国外 DNS 出口。
    // 不将所有 Apple/Microsoft 域名固定国内解析，保留手选代理时的默认 DNS 路径。
    "direct-nameserver": [...DOMESTIC_DNS],
    "direct-nameserver-follow-policy": false,

    // 代理服务器域名必须独立直连解析，避免 nameserver -> 国外流量 -> 节点域名解析形成循环依赖。
    "proxy-server-nameserver": [...DOMESTIC_DNS]
  };

  // ---------- 8. TUN ----------
  // 不强制开启，保留 Clash Verge Rev 当前 TUN 开关状态
  const oldTun = config.tun || {};

  config.tun = {
    ...oldTun,

    enable:
      typeof oldTun.enable === "boolean"
        ? oldTun.enable
        : false,

    stack: oldTun.stack || "mixed",

    "auto-route": true,
    "auto-detect-interface": true,
    "strict-route": true,

    "dns-hijack": [
      "any:53",
      "tcp://any:53"
    ]
  };

  // ---------- 9. 常规增强 ----------
  config.mode = "rule";
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["find-process-mode"] = "strict";

  config.profile = {
    ...(config.profile || {}),
    "store-selected": true,
    "store-fake-ip": true
  };

  return config;
}
