// Clash Verge Rev 全局扩展脚本
// 目标：国内直连、国外代理；ChatGPT / Claude / Gemini & NotebookLM 独立；常用国际服务独立；地区自动测速。
// 用法：订阅 -> 全局扩展脚本（Script）

function main(config, profileName) {
  // ---------- 0. 基础检查：保留机场 proxies / proxy-providers ----------
  const directProxyCount = Array.isArray(config.proxies) ? config.proxies.length : 0;
  const providers = config["proxy-providers"];
  const providerNames = providers && typeof providers === "object"
    ? Object.keys(providers)
    : [];
  const providerCount = providerNames.length;
  const originalProxyGroups = Array.isArray(config["proxy-groups"])
    ? config["proxy-groups"]
    : [];

  if (directProxyCount === 0 && providerCount === 0) {
    return config;
  }

  const TEST_URL = "https://www.gstatic.com/generate_204";
  const INTERVAL = 300;
  const RULE_INTERVAL = 86400;

  // 脚本固定创建的组名。用于冲突检查；不自动重命名节点或原组，避免破坏已有引用。
  const REGION_GROUPS = [
    "🇭🇰 香港",
    "🇲🇴 澳门",
    "🇹🇼 台湾",
    "🇰🇷 韩国",
    "🇸🇬 新加坡",
    "🇯🇵 日本",
    "🇺🇸 美国",
    "🇪🇺 欧洲",
    "其他地区"
  ];

  const SCRIPT_GROUP_NAMES = [
    "全球手动",
    "默认代理",
    "自动选择",
    "国内直连",
    "国外流量",
    "漏网之鱼",
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
    "Netflix",
    ...REGION_GROUPS
  ];

  const SCRIPT_GROUP_NAME_SET = new Set(SCRIPT_GROUP_NAMES);
  const BUILTIN_TARGETS = new Set(["DIRECT", "REJECT", "PASS", "COMPATIBLE"]);

  const warn = (message) => {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.warn === "function"
    ) {
      console.warn(`[SKULL] ${message}`);
    }
  };

  const directProxyEntries = Array.isArray(config.proxies)
    ? config.proxies.map((proxy, index) => ({
        proxy,
        index,
        name: proxy && typeof proxy.name === "string" ? proxy.name : null
      }))
    : [];

  const namedDirectProxies = directProxyEntries.filter(
    ({ name }) => typeof name === "string" && name.trim().length > 0
  );

  const invalidDirectProxyCount = directProxyEntries.length - namedDirectProxies.length;
  if (invalidDirectProxyCount > 0) {
    warn(
      `检测到 ${invalidDirectProxyCount} 个缺少有效 name 的直接节点；它们仍保留在 config.proxies 中，但不会加入脚本生成的手动/地区引用。`
    );
  }

  const directProxyNamesAll = namedDirectProxies.map(({ name }) => name);
  const directProxyNameSet = new Set(directProxyNamesAll);

  const duplicateDirectProxyNames = directProxyNamesAll.filter(
    (name, index, names) => names.indexOf(name) !== index
  );

  if (duplicateDirectProxyNames.length > 0) {
    throw new Error(
      `[SKULL] 检测到重复节点名称，未自动删除或重命名：${[
        ...new Set(duplicateDirectProxyNames)
      ].join("、")}`
    );
  }

  const directNodeGroupCollisions = directProxyNamesAll.filter((name) =>
    SCRIPT_GROUP_NAME_SET.has(name)
  );

  if (directNodeGroupCollisions.length > 0) {
    throw new Error(
      `[SKULL] 节点名称与脚本代理组重名，无法安全生成配置：${[
        ...new Set(directNodeGroupCollisions)
      ].join("、")}`
    );
  }

  // 仅排除明确的信息/提醒节点，避免误伤“香港01｜不限流量”等正常节点。
  const PSEUDO_PATTERN_BODY =
    "到期|过期|剩余(?:流量|时间|天数|[:：]|\\s*\\d)|流量(?:剩余|到期|重置|[:：]\\s*\\d)|套餐(?:到期|剩余|[:：])|官网(?:地址)?|网址|订阅(?:到期|更新|地址)|(?:下次|距离).*重置|公告(?:[:：]|$)|通知(?:[:：]|$)|提示(?:[:：]|$)|教程(?:[:：]|$)|使用说明|使用须知|客服(?:[:：]|$)|联系(?:客服)?|有超时|超时.*重启|请.*重启网络|重启.*网络|Expire(?:d)?|Traffic(?:\\s*(?:Left|Remaining)|[:：]\\s*\\d)|Remaining(?:\\s*Traffic)?|Website";

  const EXCLUDE = `(?i)(${PSEUDO_PATTERN_BODY})`;

  // ---------- 1. 图标 ----------
  const ICON = {
    default:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Rocket.png",

    foreign:
      "https://fastly.jsdelivr.net/gh/0xWans/Qure@master/IconSet/Color/Global.png",

    manual:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",

    auto:
      "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",

    direct:
      "https://flagcdn.com/w160/cn.png",

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
    us: "🇺🇸|美国|美國|美[.·|｜_\\s-]|United ?States|America|Los ?Angeles|洛杉矶|洛杉磯|San ?Jose|圣何塞|聖何塞|Seattle|西雅图|西雅圖|New ?York|纽约|紐約|Phoenix|凤凰城|鳳凰城|Salt ?Lake(?: ?City)?|盐湖城|鹽湖城|San ?Francisco|旧金山|舊金山|Dallas|达拉斯|達拉斯|Chicago|芝加哥|Las ?Vegas|拉斯维加斯|拉斯維加斯|Ashburn|阿什本|(?:^|[^A-Za-z])(?:LAX|SJC|SEA|NYC|PHX|SLC|SFO|DFW|ORD|LAS|IAD|US|USA)(?:[0-9]|[^A-Za-z]|$)",
    // 挪威保留国旗/中文/英文/NOR；不使用易与 No.01 编号混淆的两字母 NO。
    eu: "🇪🇺|🇬🇧|🇩🇪|🇫🇷|🇳🇱|🇪🇸|🇮🇹|🇨🇭|🇸🇪|🇫🇮|🇳🇴|🇵🇱|🇮🇪|🇦🇹|🇧🇪|🇨🇿|🇩🇰|🇵🇹|🇬🇷|🇮🇸|🇱🇺|欧洲|歐洲|Europe|European|英国|英國|法国|法國|德国|德國|荷兰|荷蘭|西班牙|意大利|瑞士|瑞典|芬兰|挪威|Norway|波兰|爱尔兰|London|Paris|Frankfurt|Amsterdam|Madrid|Milan|Zurich|Stockholm|Helsinki|Oslo|Warsaw|Dublin|(?:^|[^A-Za-z])(?:EU|UK|GB|GBR|DE|DEU|FR|FRA|NL|NLD|ES|ESP|IT|ITA|CH|CHE|SE|SWE|FI|FIN|NOR|PL|POL|IE|IRL|AT|AUT|BE|BEL|CZ|CZE|DK|DNK|PT|PRT|GR|GRC)(?:[0-9]|[^A-Za-z]|$)"
  };

  // 地区优先级同时定义“全球手动”排序和地区组互斥关系。
  // 多地区名称继续沿用当前优先级；未确认机场“入口→出口”命名语义前不改变归属规则。
  const REGION_KEYS = ["hk", "mo", "tw", "kr", "sg", "jp", "us", "eu"];

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

  const naturalCompare = (a, b) =>
    String(a).localeCompare(String(b), "zh-CN", {
      numeric: true,
      sensitivity: "base"
    });

  // 普通节点继续按地区 + 数字自然排序；完全相同时显式回退到原订阅序号。
  const manualProxyNames = namedDirectProxies
    .filter(({ name }) => !PSEUDO_NODE_RE.test(name))
    .sort((a, b) => {
      const rankDiff = manualRegionRank(a.name) - manualRegionRank(b.name);
      if (rankDiff !== 0) return rankDiff;

      const nameDiff = naturalCompare(a.name, b.name);
      return nameDiff !== 0 ? nameDiff : a.index - b.index;
    })
    .map(({ name }) => name);

  // ---------- 3. 工具函数 ----------
  const select = (name, icon, proxies) => ({
    name,
    type: "select",
    icon,
    proxies
  });

  const region = (name, icon, filter, excludeFilter = EXCLUDE) => ({
    name,
    type: "url-test",
    icon,
    "include-all": true,
    filter,
    "exclude-filter": excludeFilter,
    url: TEST_URL,
    interval: INTERVAL,
    tolerance: 80,
    lazy: true,
    "expected-status": 204,
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
  const FOREIGN_OPTIONS = [
    "默认代理",
    "自动选择",
    "全球手动",
    ...REGION_GROUPS,
    "DIRECT"
  ];

  const SERVICE_OPTIONS = [
    "国外流量",
    "默认代理",
    "自动选择",
    "全球手动",
    ...REGION_GROUPS,
    "DIRECT"
  ];

  // ---------- 4.1 原代理组依赖保留 ----------
  // 仅保存“节点 dialer-proxy / provider 下载出口”真正依赖到的原组，并递归保留其组依赖。
  const originalGroupsByName = new Map();
  for (const group of originalProxyGroups) {
    if (!group || typeof group !== "object") continue;
    if (typeof group.name !== "string" || group.name.trim().length === 0) continue;

    if (!originalGroupsByName.has(group.name)) {
      originalGroupsByName.set(group.name, []);
    }
    originalGroupsByName.get(group.name).push(group);
  }

  const requiredOriginalGroupNames = new Set();
  const rootDependencyRefs = [];

  const addRootRef = (ref, source) => {
    if (typeof ref !== "string" || ref.length === 0) return;
    rootDependencyRefs.push({ ref, source });
  };

  for (const { proxy, name } of namedDirectProxies) {
    addRootRef(proxy && proxy["dialer-proxy"], `节点「${name}」的 dialer-proxy`);
  }

  for (const providerName of providerNames) {
    const provider = providers[providerName];
    if (!provider || typeof provider !== "object") continue;

    addRootRef(provider.proxy, `provider「${providerName}」的 proxy`);
    addRootRef(provider["dialer-proxy"], `provider「${providerName}」的 dialer-proxy`);

    if (provider["health-check"] && typeof provider["health-check"] === "object") {
      addRootRef(
        provider["health-check"].proxy,
        `provider「${providerName}」health-check 的 proxy`
      );
    }
  }

  const requireOriginalGroup = (name, source) => {
    const candidates = originalGroupsByName.get(name);
    if (!candidates) return false;

    if (candidates.length !== 1) {
      throw new Error(
        `[SKULL] 原订阅存在重名代理组「${name}」，且被${source}引用，无法判断应保留哪一个。`
      );
    }

    if (directProxyNameSet.has(name)) {
      throw new Error(
        `[SKULL] 原代理组「${name}」与直接节点同名，且被${source}引用，无法安全判断引用目标。`
      );
    }

    if (SCRIPT_GROUP_NAME_SET.has(name)) {
      throw new Error(
        `[SKULL] 原代理组「${name}」被${source}依赖，但该名称会被脚本创建的新组占用；未自动替换或重命名。`
      );
    }

    requiredOriginalGroupNames.add(name);
    return true;
  };

  for (const { ref, source } of rootDependencyRefs) {
    if (requireOriginalGroup(ref, source)) continue;

    if (SCRIPT_GROUP_NAME_SET.has(ref)) {
      throw new Error(
        `[SKULL] ${source}引用「${ref}」，该名称属于脚本固定代理组，但原订阅中没有可确认的同名依赖组；为避免语义被静默改变，已停止生成。`
      );
    }

    if (!directProxyNameSet.has(ref) && !BUILTIN_TARGETS.has(ref)) {
      // 可能是动态 provider 内部节点名，脚本阶段无法完整枚举；只提示，不武断判定为悬空。
      warn(`${source}引用「${ref}」，当前静态配置中无法确认目标；若它来自动态 provider，可忽略此提示。`);
    }
  }

  const dependencyEdges = new Map();
  const processedDependencyGroups = new Set();
  const dependencyQueue = [...requiredOriginalGroupNames];

  while (dependencyQueue.length > 0) {
    const groupName = dependencyQueue.shift();
    if (processedDependencyGroups.has(groupName)) continue;
    processedDependencyGroups.add(groupName);

    const candidates = originalGroupsByName.get(groupName) || [];
    if (candidates.length !== 1) {
      throw new Error(
        `[SKULL] 无法唯一解析需要保留的原代理组「${groupName}」。`
      );
    }

    const group = candidates[0];
    const groupEdges = new Set();

    const groupProxyRefs = Array.isArray(group.proxies) ? group.proxies : [];
    for (const ref of groupProxyRefs) {
      if (typeof ref !== "string" || ref.length === 0) continue;

      if (originalGroupsByName.has(ref)) {
        const source = `原代理组「${groupName}」`;
        requireOriginalGroup(ref, source);
        groupEdges.add(ref);
        if (!processedDependencyGroups.has(ref)) dependencyQueue.push(ref);
        continue;
      }

      if (
        !directProxyNameSet.has(ref) &&
        !BUILTIN_TARGETS.has(ref) &&
        !SCRIPT_GROUP_NAME_SET.has(ref)
      ) {
        warn(
          `原代理组「${groupName}」引用「${ref}」，静态配置中无法确认目标；它可能来自动态 provider。`
        );
      }
    }

    const groupDialerProxy = group["dialer-proxy"];
    if (typeof groupDialerProxy === "string" && groupDialerProxy.length > 0) {
      if (originalGroupsByName.has(groupDialerProxy)) {
        requireOriginalGroup(groupDialerProxy, `原代理组「${groupName}」的 dialer-proxy`);
        groupEdges.add(groupDialerProxy);
        if (!processedDependencyGroups.has(groupDialerProxy)) {
          dependencyQueue.push(groupDialerProxy);
        }
      } else if (
        SCRIPT_GROUP_NAME_SET.has(groupDialerProxy) &&
        !directProxyNameSet.has(groupDialerProxy)
      ) {
        throw new Error(
          `[SKULL] 原代理组「${groupName}」的 dialer-proxy 引用脚本固定组「${groupDialerProxy}」，无法确认原始语义。`
        );
      }
    }

    const usedProviders = Array.isArray(group.use) ? group.use : [];
    for (const providerName of usedProviders) {
      if (typeof providerName !== "string" || providerName.length === 0) continue;
      if (!providerNames.includes(providerName)) {
        throw new Error(
          `[SKULL] 原代理组「${groupName}」依赖缺失的 proxy-provider「${providerName}」。`
        );
      }
    }

    dependencyEdges.set(groupName, groupEdges);
  }

  // 检查仅限“需要保留”的原组依赖链，避免把与本脚本无关的原组问题扩大化。
  const visitState = new Map();
  const visitStack = [];

  const visitGroup = (groupName) => {
    const state = visitState.get(groupName) || 0;
    if (state === 2) return;
    if (state === 1) {
      const cycleStart = visitStack.indexOf(groupName);
      const cycle = [...visitStack.slice(cycleStart), groupName];
      throw new Error(`[SKULL] 检测到原代理组循环依赖：${cycle.join(" -> ")}`);
    }

    visitState.set(groupName, 1);
    visitStack.push(groupName);

    const deps = dependencyEdges.get(groupName) || new Set();
    for (const dep of deps) visitGroup(dep);

    visitStack.pop();
    visitState.set(groupName, 2);
  };

  for (const groupName of requiredOriginalGroupNames) {
    visitGroup(groupName);
  }

  const preservedOriginalGroups = originalProxyGroups.filter(
    (group) =>
      group &&
      typeof group === "object" &&
      typeof group.name === "string" &&
      requiredOriginalGroupNames.has(group.name)
  );

  const manualReferences = manualProxyNames.length > 0
    ? [...manualProxyNames, "DIRECT"]
    : providerNames.length === 0
      ? ["REJECT"]
      : [];

  const duplicateManualReferences = manualReferences.filter(
    (name, index, names) => names.indexOf(name) !== index
  );

  if (duplicateManualReferences.length > 0) {
    throw new Error(
      `[SKULL] 「全球手动」将产生重复引用：${[
        ...new Set(duplicateManualReferences)
      ].join("、")}`
    );
  }

  const generatedProxyGroups = [
    // 1. 基础策略
    {
      name: "全球手动",
      type: "select",
      icon: ICON.manual,
      // 纯 provider 场景不显式插入 DIRECT，避免首次加载时 DIRECT 成为首选。
      ...(manualProxyNames.length > 0
        ? { proxies: manualReferences }
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

    select("默认代理", ICON.default, [
      "自动选择",
      "全球手动",
      ...REGION_GROUPS,
      "DIRECT"
    ]),

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

    select("国内直连", ICON.direct, [
      "DIRECT",
      "默认代理",
      "全球手动"
    ]),

    select("国外流量", ICON.foreign, FOREIGN_OPTIONS),

    select("漏网之鱼", ICON.final, [
      "国外流量",
      "默认代理",
      "全球手动",
      "DIRECT"
    ]),

    // 2. AI
    select("ChatGPT", ICON.chatgpt, SERVICE_OPTIONS),
    select("Claude", ICON.claude, SERVICE_OPTIONS),
    select("Gemini / NotebookLM", ICON.gemini, SERVICE_OPTIONS),

    // 3. 常用国际服务
    select("Google", ICON.google, SERVICE_OPTIONS),
    select("GitHub", ICON.github, SERVICE_OPTIONS),
    select("Microsoft", ICON.microsoft, SERVICE_OPTIONS),
    select("Apple", ICON.apple, SERVICE_OPTIONS),
    select("Telegram", ICON.telegram, SERVICE_OPTIONS),
    select("X", ICON.x, SERVICE_OPTIONS),
    select("YouTube", ICON.youtube, SERVICE_OPTIONS),
    select("Netflix", ICON.netflix, SERVICE_OPTIONS),

    // 4. 地区节点
    region("🇭🇰 香港", ICON.hk, FILTER.hk, REGION_EXCLUDE.hk),
    region("🇲🇴 澳门", ICON.mo, FILTER.mo, REGION_EXCLUDE.mo),
    region("🇹🇼 台湾", ICON.tw, FILTER.tw, REGION_EXCLUDE.tw),
    region("🇰🇷 韩国", ICON.kr, FILTER.kr, REGION_EXCLUDE.kr),
    region("🇸🇬 新加坡", ICON.sg, FILTER.sg, REGION_EXCLUDE.sg),
    region("🇯🇵 日本", ICON.jp, FILTER.jp, REGION_EXCLUDE.jp),
    region("🇺🇸 美国", ICON.us, FILTER.us, REGION_EXCLUDE.us),
    region("🇪🇺 欧洲", ICON.eu, FILTER.eu, REGION_EXCLUDE.eu),

    {
      name: "其他地区",
      type: "url-test",
      icon: ICON.other,
      "include-all": true,
      filter: "(?i)^.*$",
      "exclude-filter": OTHER_EXCLUDE,
      url: TEST_URL,
      interval: INTERVAL,
      tolerance: 80,
      lazy: true,
      "expected-status": 204,
      "empty-fallback": "REJECT"
    }
  ];

  config["proxy-groups"] = [
    ...generatedProxyGroups,
    ...preservedOriginalGroups
  ];

  // ---------- 5. Rule Providers ----------
  const customRuleProviders = {
    SKULL_Lan: domainProvider("private.mrs"),
    SKULL_China: domainProvider("cn.mrs"),

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
  // NotebookLM / Gemini 必须早于通用 Google
  config.rules = [
    // LAN
    "RULE-SET,SKULL_Lan,国内直连",

    // AI
    "DOMAIN-SUFFIX,notebooklm.google,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,notebooklm.google.com,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,aistudio.google.com,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,ai.google.dev,Gemini / NotebookLM",
    "DOMAIN-SUFFIX,generativelanguage.googleapis.com,Gemini / NotebookLM",

    "RULE-SET,SKULL_OpenAI,ChatGPT",
    "RULE-SET,SKULL_Claude,Claude",
    "RULE-SET,SKULL_Gemini,Gemini / NotebookLM",

    // 中国区 Apple 直连
    "RULE-SET,SKULL_AppleCN,国内直连",

    // 中国大陆域名
    "RULE-SET,SKULL_China,国内直连",

    // 国际服务
    "RULE-SET,SKULL_YouTube,YouTube",
    "RULE-SET,SKULL_Google,Google",
    "RULE-SET,SKULL_GitHub,GitHub",
    "RULE-SET,SKULL_Microsoft,Microsoft",
    "RULE-SET,SKULL_Apple,Apple",
    "RULE-SET,SKULL_Telegram,Telegram",
    "RULE-SET,SKULL_X,X",
    "RULE-SET,SKULL_Netflix,Netflix",

    // IP 规则
    "RULE-SET,SKULL_LanIP,国内直连,no-resolve",
    "RULE-SET,SKULL_GoogleIP,Google,no-resolve",
    "RULE-SET,SKULL_TelegramIP,Telegram,no-resolve",
    "RULE-SET,SKULL_XIP,X,no-resolve",
    "RULE-SET,SKULL_NetflixIP,Netflix,no-resolve",

    // 中国 IP 作为未知域名的最终国内兜底：允许触发 DNS 解析
    "RULE-SET,SKULL_ChinaIP,国内直连",

    // 最终
    "MATCH,漏网之鱼"
  ];

  // ---------- 7. DNS ----------
  // DNS 关键行为由脚本明确控制；国内域名使用国内 DNS 直连，其余域名使用境外 DNS 并经默认代理发送。
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

    // 仅用于 DNS 上游域名 bootstrap；不承担普通业务域名解析。
    "default-nameserver": [
      "223.5.5.5",
      "119.29.29.29"
    ],

    // 默认 / 境外域名：使用境外 DoH，并明确从默认代理出口发送，避免本地 DNS 暴露查询。
    nameserver: [
      "https://1.1.1.1/dns-query#默认代理",
      "https://8.8.8.8/dns-query#默认代理"
    ],

    // 国内域名：仅使用国内 DoH，并明确直连，保持国内 CDN / GeoDNS 结果。
    "nameserver-policy": {
      "rule-set:SKULL_China": [
        "https://dns.alidns.com/dns-query#DIRECT",
        "https://doh.pub/dns-query#DIRECT"
      ],
      "rule-set:SKULL_Lan": [
        "https://dns.alidns.com/dns-query#DIRECT",
        "https://doh.pub/dns-query#DIRECT"
      ]
    },

    // 代理服务器域名必须独立直连解析，避免 nameserver -> 默认代理 -> 节点域名解析形成循环依赖。
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query#DIRECT",
      "https://doh.pub/dns-query#DIRECT"
    ]
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
