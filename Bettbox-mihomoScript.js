const Compatible_With_Bettbox = { ruleOptionsEnable: true };

// Bettbox v1.18.8+ 可视化覆写开关；默认全部启用，关闭后对应流量回落到“国外流量”。
var ruleOptionsEnable = {
  ChatGPT: true,
  Claude: true,
  "Gemini / NotebookLM": true,
  Google: true,
  GitHub: true,
  Microsoft: true,
  Apple: true,
  Telegram: true,
  X: true,
  YouTube: true,
  Netflix: true,
  "地区分组": true
};

// Bettbox 会读取该数组，为可视化开关显示对应图标。
var serviceConfigs = [
  { name: "ChatGPT", icon: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/openai.png" },
  { name: "Claude", icon: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/claude-color.png" },
  { name: "Gemini / NotebookLM", icon: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/gemini-color.png" },
  { name: "Google", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Google_Search.png" },
  { name: "GitHub", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/GitHub.png" },
  { name: "Microsoft", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Microsoft.png" },
  { name: "Apple", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Apple.png" },
  { name: "Telegram", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Telegram.png" },
  { name: "X", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Twitter(X).png" },
  { name: "YouTube", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/YouTube.png" },
  { name: "Netflix", icon: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Netflix.png" },
  { name: "地区分组", icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png" }
];

// Bettbox Android 全局覆写脚本
// Version: 2026.09.14
// 目标：国内直连、国外代理；AI 强制代理；常用国际服务独立；地区聚合（自动测速 + 手动节点）。
// 用法：设置 -> 高级设置 -> 脚本；配置 -> 订阅 -> 覆写 -> 脚本。

function main(config) {
  // Bettbox / QuickJS 安全初始化
  config = config || {};

  const featureEnabled = (name) =>
    !ruleOptionsEnable || ruleOptionsEnable[name] !== false;

  const serviceTarget = (name) =>
    featureEnabled(name) ? name : "国外流量";

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
          : true,
      "expected-status":
        current["expected-status"] !== undefined
          ? current["expected-status"]
          : 204
    };
  };

  for (let i = 0; i < providerNames.length; i += 1) {
    ensureProviderHealthCheck(providers[providerNames[i]]);
  }

  // 仅排除明确的信息/提醒节点，避免误伤“香港01｜不限流量”等正常节点。
  const PSEUDO_PATTERN_BODY =
    "到期|过期|剩余(?:流量|时间|天数|[:：]|\\s*\\d)|流量(?:剩余|到期|重置|[:：]\\s*\\d)|套餐(?:到期|剩余|[:：])|官网(?:地址)?|网址|订阅(?:到期|更新|地址)|(?:下次|距离).*重置|公告(?:[:：]|$)|通知(?:[:：]|$)|提示(?:[:：]|$)|教程(?:[:：]|$)|使用说明|使用须知|客服(?:[:：]|$)|联系(?:客服)?|有超时|超时.*重启|请.*重启网络|重启.*网络|Expire(?:d)?(?:\\s*[:：]|\\s*\\d|$)|Traffic(?:\\s*(?:Left|Remaining)|[:：]\\s*\\d)|Remaining(?:\\s*Traffic)?|Website(?:\\s*[:：]|$)";

  const EXCLUDE = `(?i)(${PSEUDO_PATTERN_BODY})`;

  // ---------- 1. 图标 ----------
  const ICON = {
    foreign: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Global.png",
    manual: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
    auto: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",
    final: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Final.png",

    chatgpt: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/openai.png",
    claude: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/claude-color.png",
    gemini: "https://fastly.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/light/gemini-color.png",

    google: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Google_Search.png",
    github: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/GitHub.png",
    microsoft: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Microsoft.png",
    apple: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Apple.png",
    telegram: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Telegram.png",
    x: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Twitter(X).png",
    youtube: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/YouTube.png",
    netflix: "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Netflix.png",

    hk: "https://flagcdn.com/w160/hk.png",
    mo: "https://flagcdn.com/w160/mo.png",
    tw: "https://flagcdn.com/w160/tw.png",
    sg: "https://flagcdn.com/w160/sg.png",
    kr: "https://flagcdn.com/w160/kr.png",
    jp: "https://flagcdn.com/w160/jp.png",
    us: "https://flagcdn.com/w160/us.png",
    eu: "https://flagcdn.com/w160/eu.png",
    other: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png"
  };

  // ---------- 2. 节点地区筛选 ----------
  const REGION_PATTERN_BODY = {
    hk: "🇭🇰|香港|Hong ?Kong|(?:^|[^A-Za-z])HK(?:G)?(?:[0-9]|[^A-Za-z]|$)",
    mo: "🇲🇴|澳门|澳門|Macao|Macau|(?:^|[^A-Za-z])MO(?:[0-9]|[^A-Za-z]|$)",
    tw: "🇹🇼|台湾|台灣|Taiwan|Taipei|(?:^|[^A-Za-z])TW(?:N)?(?:[0-9]|[^A-Za-z]|$)",
    sg: "🇸🇬|新加坡|狮城|獅城|Singapore|(?:^|[^A-Za-z])SG(?:P)?(?:[0-9]|[^A-Za-z]|$)",
    kr: "🇰🇷|韩国|韓國|Korea|Seoul|(?:^|[^A-Za-z])(?:KR|KOR)(?:[0-9]|[^A-Za-z]|$)",
    jp: "🇯🇵|日本|东京|東京|大阪|Japan|Tokyo|Osaka|(?:^|[^A-Za-z])JP(?:N)?(?:[0-9]|[^A-Za-z]|$)",
    us: "🇺🇸|美国|美國|美[.·|｜_\\s-]|United ?States|America|Los ?Angeles|洛杉矶|洛杉磯|San ?Jose|圣何塞|聖何塞|Seattle|西雅图|西雅圖|New ?York|纽约|紐約|Phoenix|凤凰城|鳳凰城|Salt ?Lake(?: ?City)?|盐湖城|鹽湖城|San ?Francisco|旧金山|舊金山|Dallas|达拉斯|達拉斯|Chicago|芝加哥|Las ?Vegas|拉斯维加斯|拉斯維加斯|Ashburn|阿什本|Boston|波士顿|波士頓|Miami|迈阿密|邁阿密|Denver|丹佛|Houston|休斯顿|休士頓|Austin|奥斯汀|奧斯汀|Washington ?D\\.?C\\.?|华盛顿(?:特区)?|華盛頓(?:特區)?|(?:^|[^A-Za-z])(?:LAX|SJC|SEA|NYC|PHX|SLC|SFO|DFW|ORD|LAS|IAD|BOS|MIA|DEN|IAH|HOU|DCA|US|USA)(?:[0-9]|[^A-Za-z]|$)",
    eu: "🇪🇺|🇬🇧|🇩🇪|🇫🇷|🇳🇱|🇪🇸|🇮🇹|🇨🇭|🇸🇪|🇫🇮|🇳🇴|🇵🇱|🇮🇪|🇦🇹|🇧🇪|🇨🇿|🇩🇰|🇵🇹|🇬🇷|🇮🇸|🇱🇺|欧洲|歐洲|Europe|European|英国|英國|法国|法國|德国|德國|荷兰|荷蘭|西班牙|意大利|瑞士|瑞典|芬兰|挪威|Norway|波兰|爱尔兰|London|Paris|Frankfurt|Amsterdam|Madrid|Milan|Zurich|Stockholm|Helsinki|Oslo|Warsaw|Dublin|(?:^|[^A-Za-z])(?:EU|UK|GB|GBR|DE|DEU|FR|FRA|NL|NLD|ES|ESP|IT|ITA|CH|CHE|SE|SWE|FI|FIN|NOR|PL|POL|IE|IRL|AT|AUT|BE|BEL|CZ|CZE|DK|DNK|PT|PRT|GR|GRC)(?:[0-9]|[^A-Za-z]|$)"
  };

  // 地区优先级：香港 → 澳门 → 台湾 → 新加坡 → 韩国 → 日本 → 美国 → 欧洲 → 其他
  const REGION_KEYS = ["hk", "mo", "tw", "sg", "kr", "jp", "us", "eu"];

  // QuickJS 兼容：不用 Object.fromEntries。
  const FILTER = {};
  const REGION_EXCLUDE = {};

  for (let i = 0; i < REGION_KEYS.length; i += 1) {
    const key = REGION_KEYS[i];
    FILTER[key] = `(?i)(${REGION_PATTERN_BODY[key]})`;

    const higherPriorityPatterns = [];
    for (let j = 0; j < i; j += 1) {
      higherPriorityPatterns.push(REGION_PATTERN_BODY[REGION_KEYS[j]]);
    }

    REGION_EXCLUDE[key] = higherPriorityPatterns.length > 0
      ? `(?i)(${PSEUDO_PATTERN_BODY}|${higherPriorityPatterns.join("|")})`
      : EXCLUDE;
  }

  const MANUAL_REGION_TESTS = REGION_KEYS.map(
    (key) => new RegExp(`(?:${REGION_PATTERN_BODY[key]})`, "i")
  );

  const regionPatternList = [];
  for (let i = 0; i < REGION_KEYS.length; i += 1) {
    regionPatternList.push(REGION_PATTERN_BODY[REGION_KEYS[i]]);
  }

  const OTHER_EXCLUDE =
    `(?i)(${PSEUDO_PATTERN_BODY}|${regionPatternList.join("|")})`;

  const PSEUDO_NODE_RE = new RegExp(`(?:${PSEUDO_PATTERN_BODY})`, "i");

  const manualRegionRank = (name) => {
    for (let i = 0; i < MANUAL_REGION_TESTS.length; i += 1) {
      if (MANUAL_REGION_TESTS[i].test(name)) return i;
    }
    return MANUAL_REGION_TESTS.length;
  };

  // QuickJS / Android 兼容：不依赖 Intl.localeCompare。
  const naturalCompare = (a, b) => {
    const aa = String(a).toLowerCase().match(/\\d+|\\D+/g) || [String(a).toLowerCase()];
    const bb = String(b).toLowerCase().match(/\\d+|\\D+/g) || [String(b).toLowerCase()];
    const len = Math.min(aa.length, bb.length);

    for (let i = 0; i < len; i += 1) {
      const x = aa[i];
      const y = bb[i];
      const xn = /^\\d+$/.test(x);
      const yn = /^\\d+$/.test(y);

      if (xn && yn) {
        const diff = Number(x) - Number(y);
        if (diff !== 0) return diff;
      } else if (x !== y) {
        return x < y ? -1 : 1;
      }
    }

    return aa.length - bb.length;
  };

  const manualProxyNames = Array.isArray(config.proxies)
    ? config.proxies
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

  // 隐藏的地区自动测速子组，只供地区聚合组调用。
  const regionAuto = (name, icon, filter, excludeFilter) => ({
    name,
    type: "url-test",
    icon,
    hidden: true,
    "include-all": true,
    filter,
    "exclude-filter": excludeFilter || EXCLUDE,
    url: TEST_URL,
    interval: INTERVAL,
    tolerance: 80,
    lazy: true,
    "expected-status": 204,
    "empty-fallback": "REJECT"
  });

  // 地区聚合：首项为该地区自动测速，同时保留该地区全部节点供手动选择。
  const regionAggregate = (name, autoName, icon, filter, excludeFilter) => ({
    name,
    type: "select",
    icon,
    proxies: [autoName],
    "include-all": true,
    filter,
    "exclude-filter": excludeFilter || EXCLUDE,
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

  const REGION_AUTO_GROUPS = [
    "香港自动",
    "澳门自动",
    "台湾自动",
    "新加坡自动",
    "韩国自动",
    "日本自动",
    "美国自动",
    "欧洲自动",
    "其他自动"
  ];

  // AI 不提供 DIRECT，也不引用任何可以切到 DIRECT 的上级组。
  const AI_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS
  ];

  // 普通国际服务允许显式 DIRECT。
  const SERVICE_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS,
    "DIRECT"
  ];

  // 一般国外流量只允许代理路径。
  const FOREIGN_OPTIONS = [
    "自动选择",
    "全球手动",
    ...REGION_GROUPS
  ];

  config["proxy-groups"] = [
    // 1. 全球手动：不加入 DIRECT，避免 AI 通过上级组间接直连。
    {
      name: "全球手动",
      type: "select",
      icon: ICON.manual,
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

    // 2. 全局自动测速
    {
      name: "自动选择",
      type: "url-test",
      icon: ICON.auto,
      "include-all": true,
      "exclude-filter": EXCLUDE,
      url: TEST_URL,
      interval: INTERVAL,
      tolerance: 80,
      lazy: true,
      "expected-status": 204,
      "empty-fallback": "REJECT"
    },

    // 3. 一般国外流量
    select("国外流量", ICON.foreign, FOREIGN_OPTIONS),

    // 4. 最终无法分类的流量默认交给国外流量，但保留手动 DIRECT 兜底。
    select("漏网之鱼", ICON.final, [
      "国外流量",
      "自动选择",
      "全球手动",
      "DIRECT"
    ]),

    // 5. AI：强制代理，无 DIRECT
    select("ChatGPT", ICON.chatgpt, AI_OPTIONS),
    select("Claude", ICON.claude, AI_OPTIONS),
    select("Gemini / NotebookLM", ICON.gemini, AI_OPTIONS),

    // 6. 常用国际服务
    select("Google", ICON.google, SERVICE_OPTIONS),
    select("GitHub", ICON.github, SERVICE_OPTIONS),
    select("Microsoft", ICON.microsoft, SERVICE_OPTIONS),
    select("Apple", ICON.apple, SERVICE_OPTIONS),
    select("Telegram", ICON.telegram, SERVICE_OPTIONS),
    select("X", ICON.x, SERVICE_OPTIONS),
    select("YouTube", ICON.youtube, SERVICE_OPTIONS),
    select("Netflix", ICON.netflix, SERVICE_OPTIONS),

    // 7. 地区聚合：自动测速 + 本地区全部节点
    regionAggregate("香港聚合", "香港自动", ICON.hk, FILTER.hk, REGION_EXCLUDE.hk),
    regionAggregate("澳门聚合", "澳门自动", ICON.mo, FILTER.mo, REGION_EXCLUDE.mo),
    regionAggregate("台湾聚合", "台湾自动", ICON.tw, FILTER.tw, REGION_EXCLUDE.tw),
    regionAggregate("新加坡聚合", "新加坡自动", ICON.sg, FILTER.sg, REGION_EXCLUDE.sg),
    regionAggregate("韩国聚合", "韩国自动", ICON.kr, FILTER.kr, REGION_EXCLUDE.kr),
    regionAggregate("日本聚合", "日本自动", ICON.jp, FILTER.jp, REGION_EXCLUDE.jp),
    regionAggregate("美国聚合", "美国自动", ICON.us, FILTER.us, REGION_EXCLUDE.us),
    regionAggregate("欧洲聚合", "欧洲自动", ICON.eu, FILTER.eu, REGION_EXCLUDE.eu),
    regionAggregate("其他地区", "其他自动", ICON.other, "(?i)^.*$", OTHER_EXCLUDE),

    // 8. 隐藏地区自动测速子组
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

  // Bettbox 可视化开关联动：
  // 关闭某个服务组后移除该组，并将规则目标回退至“国外流量”；
  // 关闭“地区分组”后同时移除地区聚合组和隐藏的地区自动测速组。
  const optionalServiceGroups = [
    "ChatGPT",
    "Claude",
    "Gemini / NotebookLM",
    "Google",
    "GitHub",
    "Microsoft",
    "Apple",
    "Telegram",
    "X",
    "YouTube",
    "Netflix"
  ];

  const disabledGroupNames = {};

  for (let i = 0; i < optionalServiceGroups.length; i += 1) {
    const name = optionalServiceGroups[i];
    if (!featureEnabled(name)) disabledGroupNames[name] = true;
  }

  if (!featureEnabled("地区分组")) {
    for (let i = 0; i < REGION_GROUPS.length; i += 1) {
      disabledGroupNames[REGION_GROUPS[i]] = true;
    }
    for (let i = 0; i < REGION_AUTO_GROUPS.length; i += 1) {
      disabledGroupNames[REGION_AUTO_GROUPS[i]] = true;
    }
  }

  config["proxy-groups"] = config["proxy-groups"]
    .filter((group) => !disabledGroupNames[group.name])
    .map((group) => {
      if (Array.isArray(group.proxies)) {
        group.proxies = group.proxies.filter(
          (name) => !disabledGroupNames[name]
        );
      }
      return group;
    });

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

  // ---------- 6. 分流规则 ----------
  // 优先级：LAN → AI → 特殊国际服务 → 中国域名 → 一般国外域名 → IP → MATCH
  // NotebookLM / Gemini 必须早于通用 Google。
  config.rules = [
    // LAN
    "RULE-SET,SKULL_Lan,DIRECT",

    // AI
    `DOMAIN-SUFFIX,notebooklm.google,${serviceTarget("Gemini / NotebookLM")}`,
    `DOMAIN-SUFFIX,notebooklm.google.com,${serviceTarget("Gemini / NotebookLM")}`,
    `DOMAIN-SUFFIX,aistudio.google.com,${serviceTarget("Gemini / NotebookLM")}`,
    `DOMAIN-SUFFIX,ai.google.dev,${serviceTarget("Gemini / NotebookLM")}`,
    `DOMAIN-SUFFIX,generativelanguage.googleapis.com,${serviceTarget("Gemini / NotebookLM")}`,

    `RULE-SET,SKULL_OpenAI,${serviceTarget("ChatGPT")}`,
    `RULE-SET,SKULL_Claude,${serviceTarget("Claude")}`,
    `RULE-SET,SKULL_Gemini,${serviceTarget("Gemini / NotebookLM")}`,

    // 中国区 Apple 必须在通用 Apple 前直连
    "RULE-SET,SKULL_AppleCN,DIRECT",

    // 常用国际服务
    `RULE-SET,SKULL_YouTube,${serviceTarget("YouTube")}`,
    `RULE-SET,SKULL_Google,${serviceTarget("Google")}`,
    `RULE-SET,SKULL_GitHub,${serviceTarget("GitHub")}`,
    `RULE-SET,SKULL_Microsoft,${serviceTarget("Microsoft")}`,
    `RULE-SET,SKULL_Apple,${serviceTarget("Apple")}`,
    `RULE-SET,SKULL_Telegram,${serviceTarget("Telegram")}`,
    `RULE-SET,SKULL_X,${serviceTarget("X")}`,
    `RULE-SET,SKULL_Netflix,${serviceTarget("Netflix")}`,

    // 中国大陆域名
    "RULE-SET,SKULL_China,DIRECT",

    // 除上述特殊服务外，其余明确的国外域名统一交给“国外流量”
    "RULE-SET,SKULL_Foreign,国外流量",

    // IP 规则
    "RULE-SET,SKULL_LanIP,DIRECT,no-resolve",
    `RULE-SET,SKULL_GoogleIP,${serviceTarget("Google")},no-resolve`,
    `RULE-SET,SKULL_TelegramIP,${serviceTarget("Telegram")},no-resolve`,
    `RULE-SET,SKULL_XIP,${serviceTarget("X")},no-resolve`,
    `RULE-SET,SKULL_NetflixIP,${serviceTarget("Netflix")},no-resolve`,

    // 中国 IP 作为未知域名的最终国内兜底
    "RULE-SET,SKULL_ChinaIP,DIRECT",

    // 无法明确判断的流量
    "MATCH,漏网之鱼"
  ];

  // ---------- 7. DNS ----------
  // Android 端保留 Bettbox 原有的“国内主解析 + 国外 fallback”方案，
  // 不强行照搬桌面端 #策略组 DNS，以减少 Android VPN / DNS 实现差异带来的兼容风险。
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
      "ntp.*.com"
    ],

    "default-nameserver": [
      "223.5.5.5",
      "119.29.29.29"
    ],

    // 国内 DNS 作为默认解析：优先保证未收录的小众国内域名获得国内结果
    nameserver: [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query"
    ],

    // 已知国内域名固定使用国内 DNS
    "nameserver-policy": {
      "RULE-SET:SKULL_China,SKULL_Lan": [
        "https://dns.alidns.com/dns-query",
        "https://doh.pub/dns-query"
      ]
    },

    // 境外 DNS 作为后备；非 CN 结果使用 fallback
    fallback: [
      "https://dns.cloudflare.com/dns-query",
      "https://dns.google/dns-query"
    ],

    "fallback-filter": {
      geoip: true,
      "geoip-code": "CN",
      ipcidr: [
        "240.0.0.0/4",
        "0.0.0.0/32",
        "127.0.0.1/32"
      ]
    },

    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "https://doh.pub/dns-query"
    ]
  };

  // ---------- 8. Android TUN / VPN ----------
  // Bettbox Android 的 TUN/VPN 生命周期、路由、DNS 劫持由 App 管理。
  // 这里不覆写 config.tun，避免脚本参数与 Android VPN 层互相覆盖。

  // ---------- 9. 常规增强 ----------
  config.mode = "rule";
  config.ipv6 = false;
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["find-process-mode"] = "off";

  config.profile = {
    ...(config.profile || {}),
    "store-selected": true,
    "store-fake-ip": true
  };

  return config;
}
