/* 渡鸦管家小程序原型 v1.0
   设计基准 415x777（录屏 830x1554 ÷ 2）；所有页面文案与数据取自 2026-10-10 实机录屏。 */
(function () {
  "use strict";

  /* ============================ 工具 ============================ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const money = (v) => "¥" + Number(v).toFixed(2);
  const n1 = (v) => Number(v).toFixed(1);

  /* 从录屏帧里裁出来的真实图片资源 */
  const ASSETS = {
    article: {
      a1: "assets/article-1.jpg", a2: "assets/article-2.jpg",
      a3: "assets/article-3.jpg", a4: "assets/article-4.jpg",
      a5: "assets/meal-1.jpg",
    },
    brand: {
      eattime: "assets/brand-cover-1.jpg", xixi: "assets/brand-cover-2.jpg",
      senlin: "assets/brand-cover-3.jpg", baiwei: "assets/meal-2.jpg",
    },
    brandByName: {
      EatTime: "assets/brand-cover-1.jpg", 嘻嘻轻食: "assets/brand-cover-2.jpg",
      森林健康: "assets/brand-cover-3.jpg", 百味: "assets/meal-2.jpg",
    },
    gallery: ["assets/brand-detail-2.jpg", "assets/meal-1.jpg", "assets/meal-2.jpg", "assets/brand-detail-3.jpg"],
  };
  const assetImg = (src, cls) => '<img class="' + (cls || "") + '" src="' + esc(src) + '" alt="">';
  const brandCover = (key) => ASSETS.brand[key] || ASSETS.brandByName[key] || ASSETS.brand.eattime;

  const I = (name, cls) =>
    '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[name] || "") + "</svg>";

  const ICONS = {
    back: '<path d="M15 5 8 12l7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    heart: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/>',
    home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9.5 20v-6h5v6"/>',
    chart: '<path d="M7 17v-4M12 17V7M17 17v-6"/>',
    meal: '<path d="M5 12a7 7 0 0 0 14 0z"/><path d="M5 12h14"/><path d="M9.6 12c0-3.2 1.4-5.4 5.2-5.4"/>',
    bag: '<path d="M4.6 7h14.8l-1.1 13H5.7z"/><path d="M8.8 10V6.8A3.2 3.2 0 0 1 12 3.6a3.2 3.2 0 0 1 3.2 3.2V10"/>',
    user: '<circle cx="12" cy="8.4" r="3.5"/><path d="M5 20c.9-3.6 3.6-5.4 7-5.4s6.1 1.8 7 5.4"/>',
    calendar: '<rect x="3.6" y="5" width="16.8" height="15" rx="2.4"/><path d="M3.6 9.6h16.8M8 3.6v3M16 3.6v3"/>',
    check: '<path d="m5 12.8 4.2 4.2L19 7.4"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.3 2.8 2.8 5-5.4"/>',
    clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/>',
    drop: '<path d="M12 3.6S6.6 9.4 6.6 13.4a5.4 5.4 0 0 0 10.8 0C17.4 9.4 12 3.6 12 3.6z"/>',
    scale: '<rect x="3.6" y="4.6" width="16.8" height="15" rx="3"/><path d="M9.4 10a2.6 2.6 0 1 1 5.2 0"/>',
    record: '<path d="M5.4 4.6h13v15h-13z"/><path d="M8.4 9h7.2M8.4 12.6h7.2M8.4 16.2h4.2"/>',
    book: '<path d="M5 5.4A2.4 2.4 0 0 1 7.4 3h9.2A2.4 2.4 0 0 1 19 5.4v15H7.4A2.4 2.4 0 0 1 5 18z"/><path d="M8.6 3v15"/>',
    pin: '<path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.4"/>',
    tools: '<path d="M14.6 6.6a3.6 3.6 0 0 1-4.9 4.6l-5 5 2.1 2.1 5-5a3.6 3.6 0 0 0 4.6-4.9z"/>',
    gift: '<rect x="3.6" y="8.6" width="16.8" height="11.4" rx="2"/><path d="M3.6 12.4h16.8M12 8.6V20M8.6 8.6a2.4 2.4 0 1 1 3.4-2.2 2.4 2.4 0 1 1 3.4 2.2z"/>',
    headset: '<path d="M5.4 14v-2a6.6 6.6 0 0 1 13.2 0v2"/><path d="M5.4 13.4h1.8v5H6.2a.8.8 0 0 1-.8-.8zM18.6 13.4h-1.8v5h1a.8.8 0 0 0 .8-.8z"/>',
    hand: '<path d="M6.6 11V5.4a1.4 1.4 0 1 1 2.8 0V11m0-1.6V4.4a1.4 1.4 0 1 1 2.8 0v5m0-1V5.2a1.4 1.4 0 1 1 2.8 0V11"/><path d="M15 11V7.6a1.4 1.4 0 0 1 2.8 0V14a7 7 0 0 1-7 7 6 6 0 0 1-6-6v-3.4"/>',
    bell: '<path d="M8 17V10.6a4 4 0 0 1 8 0V17l1.6 2.2H6.4z"/><path d="M10.6 19.6a1.6 1.6 0 0 0 2.8 0"/>',
    question: '<circle cx="12" cy="12" r="8.6"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3 2.2v1.6"/><path d="M12 16.6h.01"/>',
    more: '<circle cx="5.4" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.6" cy="12" r="1.3"/>',
    service: '<path d="M12 3.6 4.6 7v6c0 4 3.4 6.4 7.4 7.4 4-1 7.4-3.4 7.4-7.4V7z"/><path d="M14.4 12.4H9.6"/>',
    partners: '<path d="M8.4 13.6 6 16a2.4 2.4 0 0 0 3.4 3.4l3.4-3.4"/><path d="M15.6 10.4 18 8a2.4 2.4 0 0 0-3.4-3.4l-3.4 3.4"/>',
    compass: '<circle cx="12" cy="12" r="8.6"/><path d="m14.6 9.4-1.6 4.2-4.2 1.6 1.6-4.2z"/>',
    exit: '<path d="M14.4 4.6H6.6A1.6 1.6 0 0 0 5 6.2v11.6a1.6 1.6 0 0 0 1.6 1.6h7.8"/><path d="M17.4 8.6 21 12l-3.6 3.4M10.6 12H21"/>',
    scan: '<path d="M4.6 8.6V6.2a1.6 1.6 0 0 1 1.6-1.6h2.4M15.4 4.6h2.4a1.6 1.6 0 0 1 1.6 1.6v2.4M19.4 15.4v2.4a1.6 1.6 0 0 1-1.6 1.6h-2.4M8.6 19.4H6.2a1.6 1.6 0 0 1-1.6-1.6v-2.4"/><path d="M4.6 12h14.8"/>',
    edit: '<path d="M15.6 4.6 19.4 8.4 9 18.8l-4.6 1 1-4.6z"/>',
    trash: '<path d="M4.6 7.4h14.8M9.4 7.4V5.2a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1v2.2M6.6 7.4 7.6 20h8.8l1-12.6"/>',
    copy: '<rect x="8.4" y="8.4" width="11" height="11" rx="2"/><path d="M15.6 8.4V6.4a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
    plus: '<path d="M12 5.6v12.8M5.6 12h12.8"/>',
    minus: '<path d="M5.6 12h12.8"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4M12 7.8h.01"/>',
    leaf: '<path d="M19 5c-8 0-12 3.4-12 8.4A5.6 5.6 0 0 0 12.6 19C17.6 19 19 14 19 5z"/><path d="M11.4 13.6 19 5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3.4v2M12 18.6v2M3.4 12h2M18.6 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/>',
    moon: '<path d="M20 14.4A8.4 8.4 0 0 1 9.6 4a8.4 8.4 0 1 0 10.4 10.4z"/>',
    bowl: '<path d="M4 11h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8z"/><path d="M8.6 8.4C8.6 6 12 6 12 3.6"/>',
    logo: '<path d="M5 5.6c3.2-.6 5 1 6 3.2 1.6-1.4 4.4-2 8-.6"/><path d="M7.4 9.4 5.6 18h12.8l-1.8-8.6"/><path d="M10.4 13.4h3.2"/>',
  };

  /* ============================ 演示数据（取自录屏） ============================ */
  const TODAY = new Date(Date.now()+8*3600000).toISOString().slice(0,10);
  const DATA = {
    profile: {
      name: "Opalite",
      account: "ID：2026092118996555",
      gender: "女",
      age: 27,
      height: 158,
      weight: 49.6,
      startWeight: 54.5,
      activity: "久坐不动",
    },
    quote: "健康生活从每天的坚持开始",
    home: {
      loss: 4.9,
      bmi: 19.9,
      bmr: 1111,
      tdee: 1333,
      intake: 1333,
      drink: 0,
      streak: 1,
      monthCheckin: 1,
      totalCheckin: 5,
      weightTrend: [54.8, 54.6, 49.6, 49.6, 49.6, 49.6],
      trendLabels: ["10/5", "10/6", "10/7", "10/8", "10/9", "10/10"],
    },
    week: [
      { wd: "周一", d: 5 }, { wd: "周二", d: 6 }, { wd: "周三", d: 7 },
      { wd: "周四", d: 8 }, { wd: "周五", d: 9 }, { wd: "周六", d: 10 },
      { wd: "周日", d: 11 },
    ],
    checkinDays: [5, 6, 7, 8, 9],
    quick: [
      { key: "health", label: "健康档案", icon: "record" },
      { key: "address", label: "地址管理", icon: "pin" },
      { key: "articles", label: "营养资讯", icon: "book" },
      { key: "tomorrow", label: "次日改单", icon: "calendar" },
    ],
    banner: { title: "新用户活动丨前一百名免单！！", date: "2026-09-30" },
    notices: [
      { id: "n1", sys: true, title: "新用户活动丨前一百名免单！！", desc: "国庆活动开启，快来参与", date: "2026-09-30" },
      { id: "n2", sys: true, title: "系统上线！免费送餐！！", desc: "新活动开始，快来参与", date: "2026-09-16" },
    ],
    articles: [
      { id: "a1", title: "一天吃几餐更合适", cat: "健康", author: "赵营养师", ago: "02周前", tag: "营养",
        body: ["没有哪种餐次安排适合所有人，但有几条原则比较稳。", "三餐规律是基础，两餐之间隔 4 到 5 小时，比较符合大多数人消化和饥饿感的节奏。", "如果两餐间隔太长，或者晚上睡得晚，可以加一次小加餐，把总量从正餐里匀出来，而不是额外多吃。", "反过来，如果每餐都吃得很撑、还频繁加餐，那问题通常不在餐次，在每餐的份量。", "还有一种常见情况是白天吃太少、晚上吃太多，第二天的状态和胃口都会乱。把午餐和晚餐的份量调匀，通常比改餐次更有效。"] },
      { id: "a2", title: "少油少盐，不等于水煮", cat: "抗炎", author: "李营养师", ago: "03周前", tag: "健康",
        body: ["一说健康饮食就水煮一切，很难坚持下去，油盐太少也会让人觉得没味道、吃不饱。", "更可行的做法是控总量、换做法。", "用油上，一天控制在两三勺以内，优先植物油。凉拌或者出锅前淋一点，比一开始就倒一大勺省很多。", "调味上，用葱姜蒜、花椒、辣椒、柠檬、香醋和香料提味，盐就可以少放，口味也不会寡淡。", "做法上，蒸、烤、炖、快炒都比油炸省油。川味里很多香辛料的用法，本来就不靠盐和油撑味道。"] },
      { id: "a3", title: "蛋白质怎么吃才够", cat: "健身", author: "陈营养师", ago: "02周前", tag: "健身",
        body: ["一餐里有蛋白和没有蛋白，饱腹感差别很大。", "比较实用的算法：每餐一份蛋白，大小和手掌心差不多，厚度相当于一根手指。", "来源换着来：鸡蛋、牛奶酸奶、鱼虾、鸡肉、瘦牛肉、豆腐豆浆。做法尽量用蒸、煮、煎，少用油炸和裹粉。", "早餐是最容易缺蛋白的一餐。只有粥和包子，往往撑不到中午；加一个鸡蛋、一杯牛奶或者一份豆制品，上午的状态会稳很多。", "吃素的朋友可以靠豆制品、豆类和坚果互补，量要比吃荤的人多一点。"] },
      { id: "a4", title: "主食到底能不能吃", cat: "减脂", author: "胡营养师", ago: "02周前", tag: "减脂",
        body: ["很多人一调整饮食就先戒主食，这往往是最先崩的一步。", "主食是身体主要的能量来源。完全不吃，容易饿、没力气、注意力差，反而更容易在下午或晚上补回来。", "真正要改的是两点。", "一是量，一餐一份就够，大概一个拳头大小。", "二是种类，白米白面之外，尽量掺一部分粗粮杂粮，糙米、燕麦、玉米、红薯、杂豆都行。粗粮纤维多、消化慢，饱腹感更久，餐后也不容易困。", "不用全换，一半白米一半粗粮，就已经有明显差别。"] },
      { id: "a5", title: "211 配比到底是什么", cat: "营养", author: "张营养师", ago: "02周前", tag: "营养",
        body: ["211 是最好记的一种搭配方法：两份蔬菜、一份优质蛋白、一份主食，按体积分就行，不用称重。", "盘子里先放菜。绿叶菜、菌菇、瓜类都算，两份大概占掉半盘。再放蛋白：鸡蛋、鱼虾、鸡肉、瘦牛肉、豆制品，一份。剩下是主食：米饭、面、杂粮、玉米、红薯都可以，一份。", "为什么按这个顺序摆？菜和蛋白的体积大、热量低，先把盘子占住，主食就不容易超量，吃饱了但热量不会太高。", "刚开始可以拍一张自己平时的餐盘对比一下。大多数人的问题是菜太少、主食太多。"] },
    ],
    weights: [
      { date: "2026-10-10 17:50", value: 49.6, delta: -5.0 },
      { date: "2026-09-29 15:33", value: 54.6, delta: -5.4 },
      { date: "2026-09-29 15:26", value: 60.0, delta: 5.2 },
      { date: "2026-09-28 10:01", value: 54.8, delta: -0.5 },
    ],
    addresses: [
      { id: 1, tag: "公司", name: "李", phone: "136****6666", region: "四川省成都市双流区", street: "华阳街道 2 段 188 号", door: "A 座 1203", def: true },
      { id: 2, tag: "学校", name: "张", phone: "135****6888", region: "四川省成都市双流区", street: "雅和北三路与新裕路交叉口东北 100 米", door: "3256 栋", def: false },
      { id: 3, tag: "家", name: "赵", phone: "139****9999", region: "四川省成都市双流区", street: "兴隆街道 123 号", door: "3 单元 501", def: false },
    ],
    brands: [
      { id: "eattime", name: "EatTime", desc: "每餐约 500、600Kcal，川味为主，每餐油脂（包括肉类食物内脂肪重）不超过 20g。", price: "均价 ¥26～¥32", tags: ["川味", "低脂"], cat: ["中式", "低脂", "川味"] },
      { id: "xixi", name: "嘻嘻轻食", desc: "嘻嘻轻食，营养健康", price: "均价 ¥15～¥20", tags: ["健康", "轻食"], cat: ["西式", "健康", "低脂"] },
      { id: "senlin", name: "森林健康", desc: "海陆大满贯鸡肉 * 牛肉 * 虾仁，每日菜品现做", price: "均价 ¥20～¥40", tags: ["健身", "饱腹感强"], cat: ["中式", "熟食", "健身"] },
      { id: "baiwei", name: "百味", desc: "食材均采用新鲜食材现制作，为您提供各类餐食", price: "均价 ¥20～¥30", tags: ["控糖", "低GI"], cat: ["中式", "控糖", "低GI"] },
    ],
    filters: ["全部", "西式", "中式", "低脂", "熟食", "冷食", "低GI", "控糖", "川味", "代餐", "饱腹感强"],
    packages: [
      { id: "p1", name: "新用户专享", meals: "5 餐 · 用于激发你们的购买欲！", price: 0.01, tag: "人气推荐" },
      { id: "p2", name: "10 餐", meals: "10 餐 · 用于激发你们的购买欲！", price: 298, tag: "新用户专享" },
      { id: "p3", name: "45 餐", meals: "45 餐没什么好说的（套餐简介）", price: 1299, tag: "" },
    ],
    brandDetail: {
      name: "燃卡计划",
      kicker: "精选品牌",
      title: "练完这一餐，不用再纠结吃什么",
      tags: ["低脂", "西式"],
      price: "均价 ¥30-¥50/餐",
      paras: [
        "燃卡计划是给有训练习惯的人做的。练完不知道吃什么、外卖蛋白不够、自己煮鸡胸又难以下咽，大概是健身的人每天都要面对的问题。",
        "做法还是中式的，以蒸、烤、炖为主，调味清淡但不寡淡，不用为了吃得干净天天啃白水煮。",
        "一餐一份，练完回工位或者到家，热几分钟就能吃，省下来的时间用来睡觉更划算。",
        "怎么选也不复杂：一周练三次以内的，中午和晚上各订一份就够；每天都练的，可以再加一份练后加餐。盒子上标了菜名和克数，方便记在训练日志里。不吃鱼或者不吃某种肉，提前说一声就能换成同等蛋白的菜。",
        "全成都均可配送，午餐晚餐都能安排。出差、备赛或者休息期可以暂停，不浪费。",
      ],
    },
    orders: [
      { id: "P20261010470123460908286250", brand: "EatTime", pkg: "新用户专享", status: "待付款", meals: "5 餐 · 优惠已锁定", time: "2026-10-10 17:53", price: 0.01, countdown: "14分53秒" },
      { id: "P20261009470123460908286206", brand: "EatTime", pkg: "新用户专享", status: "待使用", meals: "5 餐尚未启用", time: "2026-10-09 10:17", price: 0.01 },
      { id: "P20261009470123460908286206b", brand: "EatTime", pkg: "新用户专享", status: "进行中", meals: "剩余 5 餐已使用 0 餐", time: "2026-10-09 10:17", price: 0.01, next: "下次配送：10月16日 · 送达时间 12:00 前" },
      { id: "P20261008470123460908286160", brand: "EatTime", pkg: "新用户专享（10 餐）", status: "进行中", meals: "剩余 8 餐已使用 2 餐", time: "2026-10-08 23:03", price: 0.01, next: "下次配送：10月12日 · 送达时间 12:00 前" },
      { id: "P20261008470123460908286147", brand: "EatTime", pkg: "新用户专享（10 餐）", status: "进行中", meals: "剩余 8 餐已使用 2 餐", time: "2026-10-08 22:55", price: 0.01, next: "下次配送：10月12日 · 送达时间 12:00 前" },
      { id: "P20261008470123460908286134", brand: "森林健康", pkg: "新用户专享（10 餐）", status: "进行中", meals: "剩余 10 餐已使用 0 餐", time: "2026-10-08 19:13", price: 0.01, next: "下次配送：10月12日 · 送达时间 11:00 前" },
      { id: "P20261008470123460908286121", brand: "嘻嘻轻食", pkg: "新用户专享（10 餐）", status: "进行中", meals: "剩余 8 餐已使用 2 餐", time: "2026-10-08 19:11", price: 0.01, next: "下次配送：10月12日 · 送达时间 11:00 前" },
      { id: "P20260928462662140642459793", brand: "白味", pkg: "周套餐", status: "已完成", meals: "剩余 7 餐已使用 0 餐", time: "2026-09-28 16:27", finish: "2026-10-02 11:00", price: 0.02 },
      { id: "P20260928462662140642459764", brand: "白味", pkg: "新人套餐", status: "已完成", meals: "剩余 5 餐已使用 0 餐", time: "2026-09-28 15:59", finish: "2026-10-08 11:00", price: 0.03 },
      { id: "P20260930464298978448769231", brand: "燃卡计划", pkg: "新人套餐（单品牌仅可购买一次）", status: "已取消", meals: "取消原因：超时未支付", time: "2026-09-30 16:44", cancel: "2026-09-30 16:59", price: 298 },
      { id: "P20260930464298978448769103", brand: "百味", pkg: "新人套餐（单品牌仅可购买一次）", status: "已取消", meals: "取消原因：超时未支付", time: "2026-09-30 15:19", cancel: "2026-09-30 15:34", price: 0.01 },
    ],
    deliveries: [
      { id: "d1", brand: "EatTime", name: "工作日晚餐计划", rule: "工作日配送", time: "12:00 前", left: 8, meals: "晚餐 1 餐" },
      { id: "d2", brand: "嘻嘻轻食", name: "工作日午晚餐计划", rule: "工作日配送", time: "12:00 前", left: 10, meals: "午餐 1 餐、晚餐 1 餐" },
      { id: "d3", brand: "森林健康", name: "工作日晚餐计划", rule: "工作日配送", time: "12:00 前", left: 8, meals: "晚餐 1 餐" },
      { id: "d4", brand: "百味", name: "工作日午晚餐计划 123", rule: "每日配送", time: "12:00 前", left: 17, meals: "午餐 1 餐、晚餐 1 餐", active: true },
    ],
    plans: [
      { id: "pl1", name: "工作日午晚餐计划 123", rule: "每日配送", meals: ["午餐", "晚餐"], time: "12:00 前送达", left: 17, active: true, address: 0, taboo: "", allergy: "", note: "" },
      { id: "pl2", name: "工作日晚餐计划", rule: "工作日配送", meals: ["晚餐"], time: "12:00 前送达", left: 8, active: false, address: 0, taboo: "", allergy: "", note: "" },
      { id: "pl3", name: "轻盈工作日计划", rule: "工作日配送", meals: ["午餐"], time: "11:00 前送达", left: 9, active: false, address: 0, taboo: "不吃香菜", allergy: "无", note: "放前台" },
    ],
  };

  /* ============================ 状态 ============================ */
  const STORAGE_KEY = "duya-v15-r4";
  const state = {
    route: "login",
    tab: "home",
    stack: [],
    goal: "健康饮食",
    profile: Object.assign({}, DATA.profile),
    weights: DATA.weights.slice(),
    checkinDays: DATA.checkinDays.slice(),
    goalTasks: { drink: false, sleep: false, temper: false },
    addresses: DATA.addresses.map((a) => Object.assign({}, a)),
    plans: DATA.plans.map((p) => Object.assign({}, p)),
    filters: "全部",
    favorites: ["a3"],
    orderTab: "全部",
    currentPackage: "p1",
    currentBrand: "eattime",
    startDate: "2026-10-12",
    weightMonth: { y: 2026, m: 9 },
    checkinMonth: { y: 2026, m: 9 },
    weightRange: "week",
    regionPick: { p: "四川省", c: "成都市", d: "" },
    startMonth: { y: 2026, m: 9 },
    pauseRange: [12, 18],
    existChoice: "renew",
    adjustMode: "unified",
    deliveryAdjust: {
      lunch: true, dinner: true, lunchTime: "11:00 前送达", dinnerTime: "12:00 前送达",
      lunchCount: 1, dinnerCount: 1,
    },
    planForm: {
      name: "", rule: "工作日配送", perDay: "一天两餐", meals: ["午餐", "晚餐"],
      lunchTime: "11:00 前送达", dinnerTime: "12:00 前送达", customDays: [], taboo: "", allergy: "", note: "",
    },
    editingAddressId: null,
    editingPlanId: null,
    orderDetailId: null,
    currentOrderPlanId: "pl1",
    dietWeekOffset: 0,
  };

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile: state.profile, weights: state.weights, checkinDays: state.checkinDays,
        goalTasks: state.goalTasks, addresses: state.addresses, plans: state.plans,
        favorites: state.favorites, goal: state.goal, checkin: state.tab,
      }));
    } catch (err) { /* 原型：忽略存储异常 */ }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.keys(saved).forEach((key) => {
        if (key === "profile") Object.assign(state.profile, saved[key]);
        else if (key in state) state[key] = saved[key];
      });
    } catch (err) { /* ignore */ }
  }

  /* ============================ 派生值 ============================ */
  const bmi = () => n1(state.profile.weight / Math.pow(state.profile.height / 100, 2));
  const loss = () => n1(state.profile.startWeight - state.profile.weight);
  const tdee = () => 1333;
  const bmr = () => 1111;
  const intakeTotal = () => 0;

  /* ============================ 路由 ============================ */
  const TABS = [
    { key: "home", label: "首页", icon: "home" },
    { key: "track", label: "计划", icon: "chart" },
    { key: "menu", label: "择食", icon: "meal" },
    { key: "package", label: "订购", icon: "bag" },
    { key: "profile", label: "我的", icon: "user" },
  ];
  const TAB_ROUTES = { home: "home", track: "track", menu: "menu", package: "package", profile: "profile" };

  const SCREENS = {};       // route -> { nav, render, tab, navStyle }
  const NAV_HIDE = { login: true };
  const noTab = ["login"];

  function go(route, options) {
    const opts = options || {};
    if (state.route !== route) {
      if (opts.root) state.stack = [];
      else if (!opts.replace) state.stack.push(state.route);
    }
    state.route = route;
    if (opts.tab) state.tab = opts.tab;
    render();
    const stage = $("#stage");
    if (stage && !opts.keepScroll) stage.scrollTop = 0;
  }
  function back() {
    const prev = state.stack.pop();
    state.route = prev || TAB_ROUTES[state.tab] || "home";
    render();
  }

  /* ============================ 导航栏 / 底栏 ============================ */
  function navMarkup() {
    const screen = SCREENS[state.route];
    if (!screen || NAV_HIDE[state.route]) return "";
    const left = screen.navLeft
      ? screen.navLeft()
      : '<button class="nav-back" data-act="back" aria-label="返回">' + I("back") + "</button>";
    const title = screen.title === false ? "" :
      '<div class="nav-title">' + (screen.logo ? I("logo") : "") + "<span>" + esc(screen.title || "") + "</span></div>";
    return left + title +
      '<div class="nav-capsule" aria-hidden="true"><i class="dots"><b></b><b></b><b></b></i>' +
      '<i class="divider"></i><i class="target"></i></div>';
  }
  function tabbarMarkup() {
    const hidden = noTab.indexOf(state.route) >= 0 ||
      (SCREENS[state.route] && SCREENS[state.route].noTab);
    return TABS.map((tab) =>
      '<button class="tab-item ' + (state.tab === tab.key && !hidden ? "active" : "") + '" data-tab="' + tab.key + '">' +
      '<span class="tab-icon">' + I(tab.icon) + "</span><span>" + tab.label + "</span></button>").join("");
  }

  /* ============================ 弹层 ============================ */
  const layers = [];
  function openLayer(markup, options) {
    const opts = options || {};
    if (!opts.stack) closeAllLayers();
    const layer = document.createElement("div");
    const tabbar = $("#tab-bar");
    const tabbarVisible = tabbar && !tabbar.hidden;
    layer.className = "mask" + (opts.center ? " center" : "") +
      (tabbarVisible ? " with-tabbar" : "") + (opts.transparent ? " clear" : "");
    layer.innerHTML = markup;
    layer.addEventListener("click", (event) => {
      if (event.target === layer && opts.dismissible !== false) closeLayer();
    });
    $("#layers").appendChild(layer);
    layers.push(layer);
    return layer;
  }
  function closeLayer() {
    const layer = layers.pop();
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
  }
  function closeAllLayers() {
    while (layers.length) closeLayer();
  }
  let toastTimer = null;
  function toast(text) {
    const node = $("#toast");
    node.textContent = text;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 1600);
  }
  function confirmModal(title, desc, okText, onOk, cancelText) {
    return dialog({ title, desc, okText, cancelText, onOk });
  }

  /* 居中确认框：录屏里「取消订单 / 删除地址 / 删除计划」都是这个形态 */
  function dialog(options) {
    const opts = options || {};
    const body = (opts.lines || []).map((line) => "<p>" + esc(line) + "</p>").join("");
    const box = openLayer(
      '<div class="dialog"><h3>' + esc(opts.title || "") + "</h3>" +
      (opts.desc ? "<p>" + esc(opts.desc) + "</p>" : "") + body +
      '<div class="dialog-actions"><button class="dialog-btn" data-act="cancel">' +
      esc(opts.cancelText || "取消") + '</button><button class="dialog-btn primary" data-act="ok">' +
      esc(opts.okText || "确认") + "</button></div></div>",
      { center: true, dismissible: opts.dismissible });
    $('[data-act="cancel"]', box).onclick = () => { closeLayer(); opts.onCancel && opts.onCancel(); };
    $('[data-act="ok"]', box).onclick = () => { closeLayer(); opts.onOk && opts.onOk(); };
    return box;
  }

  /* 底部半屏。header="picker" 时是「取消 | 标题 | 确认」，否则是「标题 + ✕」 */
  function sheet(options) {
    const opts = options || {};
    const head = opts.picker
      ? '<div class="sheet-head picker-head"><button class="sheet-cancel" data-act="sheet-close">取消</button>' +
        "<h3>" + esc(opts.title || "") + '</h3><button class="sheet-ok" data-act="sheet-confirm">确认</button></div>'
      : '<div class="sheet-head"><h3>' + esc(opts.title || "") + "</h3>" +
        '<button class="close" data-act="sheet-close" aria-label="关闭">✕</button></div>';
    const box = openLayer(
      '<div class="sheet ' + (opts.size || "") + '">' + head +
      '<div class="sheet-body">' + (opts.body || "") + "</div>" +
      (opts.footer ? '<div class="sheet-footer">' + opts.footer + "</div>" : "") +
      "</div>", { dismissible: opts.dismissible, stack: opts.stack });
    if (opts.onMount) opts.onMount(box);
    return box;
  }

  /* 选项列表行（单选用） */
  function optionList(items, current, actName, extra) {
    return '<ul class="sheet-options">' + items.map((item) => {
      const value = typeof item === "string" ? item : item.value;
      const label = typeof item === "string" ? item : item.label;
      const note = typeof item === "string" ? "" : (item.note || "");
      const on = value === current;
      return '<li class="' + (on ? "on" : "") + '" data-act="' + actName + '" data-value="' + esc(value) + '">' +
        "<span>" + esc(label) + (note ? '<small>' + esc(note) + "</small>" : "") + "</span>" +
        (on ? I("check") : "") + "</li>";
    }).join("") + "</ul>" + (extra || "");
  }
  function bottomSheet(title, body, options) {
    const opts = options || {};
    const box = openLayer(
      '<div class="sheet"><div class="sheet-head"><h3>' + esc(title) + "</h3>" +
      '<button class="close" data-act="sheet-close" aria-label="关闭">✕</button></div>' + body + "</div>",
      opts);
    return box;
  }
  function pickerSheet(title, items, current, onPick) {
    const box = openLayer(
      '<div class="picker"><div class="picker-head"><button class="cancel" data-act="cancel">取消</button>' +
      "<h3>" + esc(title) + '</h3><button data-act="done">确定</button></div>' +
      '<ul class="picker-list">' + items.map((item, index) =>
        '<li class="' + (item === current ? "on" : "") + '" data-pick="' + index + '">' +
        esc(item) + (item === current ? I("check", "chev") : "") + "</li>").join("") + "</ul></div>");
    let picked = current;
    $$("[data-pick]", box).forEach((node) => {
      node.onclick = () => {
        picked = items[Number(node.dataset.pick)];
        $$("[data-pick]", box).forEach((other) => {
          other.classList.toggle("on", other === node);
        });
      };
    });
    $('[data-act="cancel"]', box).onclick = () => closeLayer();
    $('[data-act="done"]', box).onclick = () => { closeLayer(); onPick(picked); };
    return box;
  }

  /* ============================ 页面注册 ============================ */
  function screen(route, config) { SCREENS[route] = config; }

  /* ---------- 登录页 ---------- */
  screen("login", {
    title: false, noTab: true, navStyle: { bg: "#F4FBE7", ink: "#121212" },
    render() {
      return (
        '<div class="login-page">' +
        '<div class="login-logo">' + assetImg("assets/login-logo.jpg") + "</div>" +
        '<div class="login-name">渡鸦管家</div>' +
        '<div class="login-spacer"></div>' +
        '<button class="btn login-wechat" id="login-wechat">微信一键登录</button>' +
        '<label class="login-agree"><i class="tick" id="login-tick"></i>' +
        '<span>我已阅读并同意《用户协议》和《隐私政策》</span></label>' +
        "</div>"
      );
    },
    mounted() {
      let agreed = false;
      const tick = $("#login-tick");
      tick.onclick = () => { agreed = !agreed; tick.classList.toggle("on", agreed); };
      $("#login-wechat").onclick = () => {
        if (!agreed) { toast("请先阅读并同意用户协议与隐私政策"); return; }
        go("home", { root: true, tab: "home" });
      };
    },
  });

  /* ---------- 首页 ---------- */
  screen("home", {
    title: "渡鸦管家", logo: true, tab: "home",
    navStyle: { bg: "#EDF8D6", ink: "#121212" },
    navLeft() {
      return '<button class="nav-goal" data-act="goal-chip">' + esc(state.goal) + I("chev") + "</button>";
    },
    render() {
      const checked = state.checkinDays.indexOf(10) >= 0;
      return (
        '<div class="hero">' +
        '<div class="date">' + I("calendar", "hero-cal") + "<span>10月10日 星期六</span></div>" +
        "<h1>Hi, " + esc(state.profile.name) + ".</h1>" +
        '<div class="quote">' + I("leaf", "quote-icon") + "<span>“" + esc(DATA.quote) + "”</span></div>" +
        "</div>" +
        '<div class="page">' +
        metricsStrip() +
        weightChartCard() +
        checkinCard(checked) +
        bannerCard() +
        quickCard() +
        articlesCard() +
        '<section class="home-bottom">' +
        '<div class="hb-left">' +
        '<section class="card mini-intake">' +
        '<div class="intake-grid">' +
        '<div class="intake-cell"><span class="label">今日热量摄入</span>' +
        '<b class="num">' + intakeTotal() + '<em>kcal/1333</em></b><small>剩余可摄入 1333kcal</small></div>' +
        '<div class="intake-cell water-cell" data-act="water">' +
        '<span class="label">今日饮水</span>' +
        '<b class="num">0<em>ml</em></b><small>建议每日饮水 1.5～2L</small>' +
        '<i class="water-illo">' + assetImg("assets/water-glass.jpg") + "</i></div>" +
        "</div></section>" +
        "</div>" +
        '<section class="hb-right menu-placeholder"><div class="ph-title">择食</div>' +
        '<div class="ph-note">研发中，敬请期待</div></section>' +
        "</section>" +
        '<section class="card mini-intake record-card">' +
        '<div class="intake-record"><span>今日饮食记录</span>' +
        '<button class="link" data-act="record-diet">手动添加饮食</button></div>' +
        '<div class="intake-empty">暂无饮食记录</div>' +
        "</section>" +
        "</div>"
      );
    },
  });

  function weightCard() {
    return metricsStrip();
  }

  function metricsStrip() {
    return (
      '<section class="metrics-strip" data-act="weight-page">' +
      '<div class="ms-cell left"><b class="num">' + loss() + "</b><span>已减重<em>(kg)</em></span></div>" +
      '<div class="ms-cell center"><b class="num">' + n1(state.profile.weight) + "</b><span>体重<em>(kg)</em></span></div>" +
      '<div class="ms-cell right"><b class="num">' + bmi() + "</b><span>BMI</span></div>" +
      "</section>"
    );
  }

  function weightChartCard() {
    const h = DATA.home;
    return (
      '<section class="card weight-chart-card">' +
      '<div class="weight-chart">' +
      '<div class="wc-axis">' + ["49kg", "48kg", "47kg"].map((t) => "<span>" + t + "</span>").join("") + "</div>" +
      '<svg class="wc-svg" viewBox="0 0 300 74" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0 20 L50 24 L100 32 L150 52 L200 58 L250 58 L300 58 L300 72 L0 72 Z" fill="rgba(100,164,5,.12)"/>' +
      '<path d="M0 20 L50 24 L100 32 L150 52 L200 58 L250 58 L300 58" fill="none" stroke="#64A405" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="300" cy="58" r="3.2" fill="#64A405"/>' +
      "</svg>" +
      '<div class="wc-labels">' + h.trendLabels.map((t) => "<span>" + t + "</span>").join("") + "</div>" +
      "</div>" +
      '<div class="weight-foot">' +
      '<span class="segmented"><button class="' + (state.weightRange === "week" ? "active" : "") + '" data-range="week">周</button>' +
      '<button class="' + (state.weightRange === "month" ? "active" : "") + '" data-range="month">月</button>' +
      '<button class="' + (state.weightRange === "season" ? "active" : "") + '" data-range="season">季</button></span>' +
      '<span class="spacer"></span>' +
      '<span class="check-pill ' + (state.weightRange === "custom" ? "on" : "") + '">' + I("check") + "</span>" +
      "</div>" +
      "</section>"
    );
  }

  function checkinCard(checked) {
    const month = state.checkinDays.length;
    const total = DATA.home.totalCheckin + (checked ? 1 : 0);
    const streak = checked ? 2 : 1;
    return (
      '<section class="card checkin-card">' +
      '<div class="checkin-top"><b class="num">已连续打卡 ' + streak + " 天</b>" +
      '<span class="tiny">本月打卡 ' + month + " 天　累计打卡 " + total + " 天</span></div>" +
      '<div class="checkin-week">' + DATA.week.map((day) =>
        '<div class="cw-item ' + (day.d === 10 ? "today" : "") + (state.checkinDays.indexOf(day.d) >= 0 ? " done" : "") + '">' +
        "<small>" + day.wd + "</small><span>" + day.d + "</span></div>").join("") + "</div>" +
      '<button class="btn ' + (checked ? "ghost" : "") + '" data-act="checkin">' +
      (checked ? "今日已打卡" : "立即打卡") + "</button>" +
      "</section>"
    );
  }

  function bannerCard() {
    return (
      '<section class="card banner-card" data-act="notice">' +
      '<div class="banner-icon">' + I("gift") + "</div>" +
      '<div class="banner-main"><b>' + esc(DATA.banner.title) + "</b>" +
      "<small>" + esc(DATA.banner.date) + "</small></div>" +
      '<span class="banner-more">查看详情›</span>' +
      "</section>"
    );
  }

  function quickCard() {
    return (
      '<section class="card quick-card">' +
      '<div class="card-head"><h3>快捷入口</h3></div>' +
      '<div class="quick-grid">' + DATA.quick.map((item) =>
        '<button class="quick-item" data-act="quick" data-key="' + item.key + '">' +
        '<i class="quick-icon">' + I(item.icon) + "</i><span>" + item.label + "</span></button>").join("") +
      "</div></section>"
    );
  }

  function articlesCard() {
    return (
      '<section class="sec"><div class="sec-head"><h2>营养资讯</h2>' +
      '<button class="more" data-act="articles">更多' + I("chev") + "</button></div>" +
      '<div class="article-list">' + DATA.articles.slice(0, 5).map(articleRow).join("") + "</div></section>"
    );
  }
  function articleRow(item) {
    return (
      '<article class="article-row" data-act="article" data-id="' + item.id + '">' +
      '<div class="ar-thumb">' + assetImg(ASSETS.article[item.id] || ASSETS.article.a1) + "</div>" +
      '<div class="ar-main"><b>' + esc(item.title) + "</b>" +
      '<span class="tag tint">' + esc(item.tag) + "</span>" +
      '<div class="ar-meta">' + esc(item.author) + "　" + esc(item.ago) + "</div></div></article>"
    );
  }

  /* ---------- 资讯列表 / 详情 ---------- */
  screen("articles", {
    title: "营养资讯",
    render() {
      const cats = ["全部", "营养", "健康", "健身", "减脂"];
      const list = state.articleCat && state.articleCat !== "全部"
        ? DATA.articles.filter((a) => a.tag === state.articleCat)
        : DATA.articles;
      return (
        '<div class="page">' +
        '<div class="search-bar">' + I("scan", "sb-icon") + "<span>搜索关键字</span></div>" +
        '<div class="chips article-chips">' + cats.map((c) =>
          '<button class="chip ' + ((state.articleCat || "全部") === c ? "active" : "") +
          '" data-act="article-cat" data-cat="' + c + '">' + c + "</button>").join("") + "</div>" +
        '<div class="article-list wide">' + list.map(articleRow).join("") + "</div>" +
        (list.length ? '<div class="list-end">没有更多了</div>' : '<div class="empty">暂无相关资讯</div>') +
        "</div>"
      );
    },
  });

  screen("article", {
    title: "资讯详情",
    navLeft() {
      return '<button class="nav-back" data-act="back">' + I("back") + "</button>";
    },
    render() {
      const item = DATA.articles.find((a) => a.id === state.articleId) || DATA.articles[0];
      const fav = state.favorites.indexOf(item.id) >= 0;
      return (
        '<div class="page article-detail">' +
        '<div class="ad-hero"><i class="ad-cover">' +
        assetImg(ASSETS.article[item.id] || ASSETS.article.a1) + "</i></div>" +
        '<h1 class="ad-title">' + esc(item.title) + "</h1>" +
        '<div class="ad-meta"><span class="tag tint">' + esc(item.tag) + "</span>" +
        "<span>" + esc(item.author) + "</span><span>" + esc(item.ago) + "</span></div>" +
        '<div class="ad-body">' + item.body.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>" +
        '<button class="btn ' + (fav ? "plain" : "") + ' ad-fav" data-act="favorite" data-id="' +
        item.id + '">' + I("heart", "fav-icon") + (fav ? "已收藏" : "收藏") + "</button>" +
        "</div>"
      );
    },
  });

  screen("favorites", {
    title: "我的收藏",
    render() {
      const list = DATA.articles.filter((a) => state.favorites.indexOf(a.id) >= 0);
      return (
        '<div class="page">' +
        (list.length
          ? '<div class="article-list wide">' + list.map(articleRow).join("") + '</div><div class="list-end">没有更多了</div>'
          : '<div class="empty">' + I("heart") + "<div>还没有收藏的内容</div></div>") +
        "</div>"
      );
    },
  });

  /* ---------- 消息中心 / 公告 ---------- */
  screen("noticeCenter", {
    title: "消息中心",
    render() {
      return (
        '<div class="page">' +
        '<div class="search-bar">' + I("scan", "sb-icon") + "<span>搜索关键字</span></div>" +
        '<div class="notice-list">' + DATA.notices.map((n) =>
          '<article class="card notice-row" data-act="notice-detail" data-id="' + n.id + '">' +
          '<div class="nr-head"><span class="tag">系统</span><b>' + esc(n.title) + "</b></div>" +
          '<p>' + esc(n.desc) + "</p>" +
          '<div class="nr-foot"><small>' + esc(n.date) + "</small>" +
          '<span class="link">查看详情' + I("chev") + "</span></div></article>").join("") +
        '<div class="list-end">没有更多了</div></div>' +
        "</div>"
      );
    },
  });

  screen("notice", {
    title: "公告详情",
    render() {
      const item = DATA.notices[0];
      return (
        '<div class="page notice-detail">' +
        '<h1 class="nd-title">' + esc(item.title) + "</h1>" +
        '<div class="nd-date">' + esc(item.date) + "</div>" +
        '<div class="ad-body"><p>国庆活动开启，快来参与。</p>' +
        "<p>活动期间新用户首单免单，名额有限先到先得；已领取的权益在「我的订单」中查看。</p>" +
        "<p>如有疑问请联系专属客服。</p></div>" +
        "</div>"
      );
    },
  });

  /* ---------- 体重记录 ---------- */
  screen("weight", {
    title: "体重记录",
    navActions: true,
    render() {
      const month = state.weightMonth;
      const cells = monthGrid(month.y, month.m);
      const record = state.weights.find((w) => w.date.indexOf("2026-10-10") === 0);
      return (
        '<div class="page">' +
        '<section class="card cal-card">' +
        '<div class="cal-head"><span class="cal-title">' + month.y + "年" + (month.m + 1) + "月</span>" +
        '<span class="cal-nav"><button data-act="cal-prev">' + I("back") + "</button>" +
        '<button data-act="cal-next">' + I("chev") + "</button></span></div>" +
        '<div class="cal-grid">' + ["日", "一", "二", "三", "四", "五", "六"].map((d) => '<span class="wd">' + d + "</span>").join("") +
        cells.map((cell) =>
          '<button class="cal-cell ' + (cell.dim ? "dim" : "") + (cell.today ? " today" : "") +
          (cell.marked ? " marked" : "") + '" data-act="cal-pick" data-day="' + cell.day + '">' +
          "<span>" + cell.day + "</span>" +
          (cell.marked ? '<i class="dot"></i>' : "") + "</button>").join("") +
        "</div>" +
        "</section>" +
        '<section class="card weight-today">' +
        '<div class="wt-value"><b class="num">' + (record ? n1(record.value) : "--") + "</b><em>kg</em></div>" +
        '<div class="wt-meta">' + (record ? esc(record.date) : "当天还没有体重记录") + "</div>" +
        '<div class="wt-actions">' +
        '<button class="btn" data-act="weight-add">' + (record ? "继续录入当天体重" : "录入当天体重") + "</button>" +
        '<button class="btn plain" data-act="weight-list">查看' + state.weights.length + "条记录</button>" +
        "</div></section>" +
        "</div>"
      );
    },
  });

  function monthGrid(year, month) {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i += 1) cells.push({ day: "", dim: true });
    for (let d = 1; d <= days; d += 1) {
      cells.push({
        day: d,
        dim: false,
        today: year === 2026 && month === 9 && d === 10,
        marked: DATA.weights.some((w) => w.date.indexOf("2026-10-" + String(d).padStart(2, "0")) === 0),
      });
    }
    while (cells.length % 7 !== 0) cells.push({ day: "", dim: true });
    return cells;
  }

  /* ---------- 健康档案 ---------- */
  screen("health", {
    title: "健康档案", logo: true,
    render() {
      const p = state.profile;
      return (
        '<div class="page">' +
        '<div class="hr-kicker"><b>健康档案</b><span class="eng-label">Health Record</span></div>' +
        '<section class="card">' +
        '<div class="card-head"><h3>个人健康基础信息</h3></div>' +
        '<p class="hr-note">来源于首次登录时提交的健康资料</p>' +
        '<div class="hr-grid">' +
        '<div class="hr-item"><span>' + I("user", "hr-icon") + "年龄</span><b>" + p.age + "岁</b></div>" +
        '<div class="hr-item"><span>' + I("chart", "hr-icon") + "身高</span><b>" + p.height + "cm</b></div>" +
        '<div class="hr-item"><span>' + I("scale", "hr-icon") + "体重</span><b>" + n1(p.weight) + "kg</b></div>" +
        '<div class="hr-item"><button data-act="activity">' + I("compass", "hr-icon") + "活动水平</button>" +
        "<b>" + esc(p.activity) + "</b></div>" +
        "</div>" +
        '<p class="hr-tip">' + I("info", "hr-icon") + "基础资料用于计算 BMI 与每日营养建议，体重变化请在「体重记录」中持续更新。</p>" +
        "</section>" +
        '<section class="card">' +
        '<div class="card-head"><h3>健康评估报告</h3></div>' +
        '<p class="hr-note">BMI 处于正常区间，基础资料用于计算每日营养建议。</p>' +
        '<div class="hr-report">' +
        '<div class="rp-item"><small>BMI</small><b class="num">' + bmi() + "</b><em>正常</em></div>" +
        '<div class="rp-item"><small>基础代谢</small><b class="num">' + bmr() + "</b><em>kcal</em></div>" +
        '<div class="rp-item"><small>建议摄入</small><b class="num">' + tdee() + "</b><em>kcal</em></div>" +
        '<div class="rp-item"><small>建议每日饮水</small><b class="num">1.5～2</b><em>L</em></div>' +
        "</div>" +
        '<div class="hr-advice"><b>本周建议：</b>建议每日饮水 1.5～2L，关注饮水与体重记录，保持规律作息。</div>' +
        "</section>" +
        "</div>"
      );
    },
  });

  /* ---------- 计划页 ---------- */
  screen("track", {
    title: "渡鸦管家", logo: true, tab: "track",
    navStyle: { bg: "#EDF8D6", ink: "#121212" },
    navLeft() {
      return '<button class="nav-goal" data-act="goal-chip">' + esc(state.goal) + I("chev") + "</button>";
    },
    render() {
      const done = Object.keys(state.goalTasks).filter((k) => state.goalTasks[k]).length;
      const tasks = [
        { key: "drink", name: "饮水", desc: "一日多次，够两升", icon: "drop", streak: "连续 7 天 · 累计 38 天" },
        { key: "sleep", name: "睡眠", desc: "早睡早起，八小时", icon: "moon", streak: "连续 0 天 · 累计 1 天" },
        { key: "temper", name: "节制", desc: "一日三餐，不暴食", icon: "bowl", streak: "连续 0 天 · 累计 1 天" },
      ];
      return (
        '<div class="page">' +
        '<blockquote class="track-quote">“' + esc(DATA.quote) + "”</blockquote>" +
        '<section class="card">' +
        '<div class="card-head"><div><span class="tiny">我的目标</span>' +
        '<h3 class="goal-name">' + esc(state.goal) + "</h3>" +
        '<span class="tiny">开始日期 2026.09.28 · 已坚持 19 天</span></div>' +
        '<button class="link-muted" data-act="goal-edit">修改计划</button></div>' +
        '<div class="track-stats">' +
        '<span><small>健康饮食天数</small><b class="num">19 天</b></span>' +
        '<span><small>七天达标率</small><b class="num">86%</b></span>' +
        '<span><small>目标打卡天数</small><b class="num">21 天</b></span>' +
        "</div></section>" +
        '<section class="card">' +
        '<div class="card-head"><h3>代谢水平</h3></div>' +
        '<div class="met-row">' +
        '<span><small>BMR 基础代谢</small><b class="num">' + bmr() + "</b><em>kcal/天</em></span>" +
        '<span><small>TDEE 每日消耗</small><b class="num">' + tdee() + "</b><em>kcal/天</em></span>" +
        "</div>" +
        '<p class="met-tip">' + I("info", "hr-icon") + "建议每日摄入 1200—1466 kcal（TDEE ±10%）</p>" +
        "</section>" +
        '<section class="card">' +
        '<div class="card-head"><div><span class="eng-label">Daily quest</span><h3>今天的三个小目标</h3>' +
        '<span class="tiny">连续 ' + (DATA.home.streak) + " 天 · 累计 " + DATA.home.totalCheckin + " 天</span></div>" +
        '<button class="quest-progress" data-act="goal-calendar"><b class="num">' + done + "/3</b><small>今日进度</small></button></div>" +
        '<div class="quest-list">' + tasks.map((task) =>
          '<article class="quest-row"><i class="quest-icon">' + I(task.icon) + "</i>" +
          "<span><b>" + task.name + "</b><small>" + task.desc + "</small><em>" + task.streak + "</em></span>" +
          '<button class="btn sm ' + (state.goalTasks[task.key] ? "plain" : "ghost") +
          '" data-act="task" data-key="' + task.key + '">' +
          (state.goalTasks[task.key] ? "✓ 已搞定" : "搞定") + "</button></article>").join("") +
        "</div></section></div>"
      );
    },
  });

  screen("goalQuiz", {
    title: "修改计划",
    render() {
      const goals = [
        { name: "健康饮食", desc: "均衡营养，吃出健康好身体", ready: true },
        { name: "减重", desc: "科学减重，轻盈无负担" },
        { name: "增肌", desc: "增加肌肉，塑造强壮体魄" },
        { name: "减脂", desc: "减少脂肪，塑造紧致身材" },
      ];
      return (
        '<div class="page">' +
        '<h1 class="quiz-title">你的目标是什么？</h1>' +
        '<p class="quiz-sub">选择一个目标，开启你的健康之旅吧！</p>' +
        '<div class="goal-options">' + goals.map((g) =>
          '<button class="goal-option ' + (state.goal === g.name ? "on" : "") +
          '" data-act="pick-goal" data-goal="' + g.name + '">' +
          '<i class="go-icon">' + I(g.name === "健康饮食" ? "leaf" : "chart") + "</i>" +
          "<span><b>" + g.name + "</b><small>" + g.desc + "</small></span>" +
          (g.ready ? "" : '<em class="go-tag">研发中，敬请期待</em>') + "</button>").join("") + "</div>" +
        '<div class="goal-extra ' + (state.goal === "健康饮食" ? "hidden" : "") + '">' +
        '<div class="form-row"><label>目标体重</label><input inputmode="decimal" placeholder="请输入目标体重" value="47"><span class="unit">kg</span></div>' +
        '<div class="form-row"><label>目标日期</label><input type="date" value="2026-12-31"></div></div>' +
        '<button class="btn block" data-act="goal-done">完成并生成计划</button>' +
        "</div>"
      );
    },
  });

  screen("goalCalendar", {
    title: "健康打卡计划",
    render() {
      const cells = monthGrid(2026, 9);
      return (
        '<div class="page">' +
        '<section class="card cal-card">' +
        '<div class="cal-head"><span class="cal-title">2026年10月</span>' +
        '<span class="cal-legend"><i class="lg full"></i>全部完成<i class="lg part"></i>部分完成</span></div>' +
        '<div class="cal-grid">' + ["日", "一", "二", "三", "四", "五", "六"].map((d) => '<span class="wd">' + d + "</span>").join("") +
        cells.map((cell) =>
          '<span class="cal-cell ' + (cell.dim ? "dim" : "") + (cell.today ? " today" : "") + '">' +
          "<span>" + cell.day + "</span></span>").join("") + "</div>" +
        "</section>" +
        '<section class="card"><div class="card-head"><h3>10月10日打卡详情</h3></div>' +
        '<div class="checkin-detail">' +
        ["饮水", "睡眠", "节制"].map((name, i) => {
          const ok = i === 0 ? state.goalTasks.drink : (i === 1 ? state.goalTasks.sleep : state.goalTasks.temper);
          return '<div class="cd-row"><span>' + name + "</span><em class=\"" + (ok ? "ok" : "") + "\">" +
            (ok ? "已搞定" : "未打卡") + "</em></div>";
        }).join("") +
        "</div></section></div>"
      );
    },
  });

  screen("metabolism", {
    title: "代谢计算器",
    render() {
      const r = state.metabolism || {};
      return (
        '<div class="page">' +
        '<div class="tip-bar">' + I("info", "hr-icon") + "本工具仅用于临时估算，计算结果不会写入或修改您的体重记录与健康档案。</div>" +
        '<div class="rows form-rows">' +
        '<button class="form-row" data-act="meta-gender"><label>性别</label>' +
        '<span class="pick ' + (r.gender ? "" : "empty") + '">' + (r.gender || "请选择性别") + "</span>" + I("chev", "chev") + "</button>" +
        '<button class="form-row" data-act="meta-number" data-field="age"><label>年龄</label>' +
        '<span class="pick ' + (r.age ? "" : "empty") + '">' + (r.age || "请输入年龄") + "</span>" + I("chev", "chev") + "</button>" +
        '<button class="form-row" data-act="meta-number" data-field="height"><label>身高(cm)</label>' +
        '<span class="pick ' + (r.height ? "" : "empty") + '">' + (r.height || "请输入身高") + "</span>" + I("chev", "chev") + "</button>" +
        '<button class="form-row" data-act="meta-number" data-field="weight"><label>体重(kg)</label>' +
        '<span class="pick ' + (r.weight ? "" : "empty") + '">' + (r.weight || "请输入体重") + "</span>" + I("chev", "chev") + "</button>" +
        "</div>" +
        (r.bmr ? '<section class="card"><div class="card-head"><h3>临时代谢估算结果</h3></div>' +
          '<div class="met-row"><span><small>基础代谢(BMR)</small><b class="num">' + r.bmr + "</b><em>kcal</em></span>" +
          '<span><small>每日消耗(TDEE)</small><b class="num">' + r.tdee + "</b><em>kcal</em></span></div></section>" : "") +
        "</div>"
      );
    },
  });

  /* ---------- 地址管理 ---------- */
  screen("addresses", {
    title: "地址管理",
    render() {
      return (
        '<div class="page">' +
        '<div class="addr-list">' + state.addresses.map((a) =>
          '<article class="card addr-card">' +
          '<div class="addr-head"><span class="tag">' + esc(a.tag) + "</span>" +
          "<b>" + esc(a.name) + "　" + esc(a.phone) + "</b>" +
          (a.def ? '<em class="addr-default">默认地址</em>' : "") + "</div>" +
          '<p class="addr-text">' + esc(a.region) + esc(a.street) + esc(a.door) + "</p>" +
          '<div class="addr-foot"><button class="raddio ' + (a.def ? "on" : "") + '" data-act="addr-default" data-id="' + a.id + '">' +
          I("check", "rd-icon") + "设为默认</button>" +
          '<span class="addr-ops"><button data-act="addr-edit" data-id="' + a.id + '">编辑</button>' +
          '<button data-act="addr-del" data-id="' + a.id + '">删除</button></span></div>' +
          "</article>").join("") + "</div>" +
        '<button class="btn block addr-add" data-act="addr-new">＋ 新增收货地址</button>' +
        "</div>"
      );
    },
  });

  screen("addressEdit", {
    title: "新增收货地址",
    render() {
      const a = state.addresses.find((x) => x.id === state.editingAddressId);
      return (
        '<div class="page">' +
        '<div class="map-picker" data-act="map-pick"><i class="map-bg"></i>' +
        '<span class="map-pin">' + I("pin") + "</span>" +
        '<span class="map-city">' + (a ? esc(a.region) : "成都高新孵化园") + "</span>" +
        '<span class="map-btn">' + I("pin", "map-btn-icon") + "地图选址</span></div>" +
        '<div class="rows form-rows">' +
        '<button class="form-row" data-act="addr-region"><label>地区选址</label>' +
        '<span class="pick empty">所在地区请选择所在地区</span>' + I("chev", "chev") + "</button>" +
        fieldRow("地址", "街道/小区", a ? a.street : "请输入街道/小区") +
        fieldRow("门牌号", "门牌", a ? a.door : "为配送顺利，请确认门牌号准确") +
        fieldRow("收货人", "收货人姓名", a ? a.name : "请填写收货人姓名") +
        fieldRow("手机号", "手机号", a ? a.phone.replace(/\*/g, "") : "请填写收货人手机号") +
        "</div>" +
        '<section class="card">' +
        '<div class="card-head"><h3>地址标签</h3></div>' +
        '<div class="chip-row">' + ["家", "公司", "学校", "自定义"].map((t, i) =>
          '<button class="chip ' + (i === 0 ? "active" : "") + '" data-act="addr-tag" data-tag="' + t + '">' + t + "</button>").join("") + "</div>" +
        "</section>" +
        '<section class="card"><div class="row plain-row"><span class="row-title">设为购物默认地址</span>' +
        '<button class="switch on" data-act="addr-def-switch"></button></div>' +
        '<p class="tiny">仅快递商品可优先使用该默认地址，秒送/外卖暂不支持</p></section>' +
        '<button class="paste-bar" data-act="addr-paste">' + I("copy", "pb-icon") +
        "试试粘贴收件人姓名、手机号、收货地址，可快速识别您的收货信息<span>粘贴</span></button>" +
        '<button class="btn block addr-save" data-act="addr-save">确认</button>' +
        "</div>"
      );
    },
  });

  function fieldRow(label, placeholder, value) {
    return '<div class="form-row"><label>' + label + '</label><input placeholder="' +
      esc(placeholder) + '" value="' + esc(value) + '"></div>';
  }

  /* ---------- 择食 ---------- */
  /* 录屏里筛选条分两组：口味做法 与 营养目标，每组第一个都是「全部」 */
  const MENU_FILTERS = [
    ["全部", "西式", "中式", "熟食", "冷食", "川味", "代餐"],
    ["全部", "健康", "低脂", "低GI", "控糖", "饱腹感强"],
  ];
  screen("menu", {
    title: "渡鸦管家", logo: true, tab: "menu",
    navLeft() {
      return '<button class="nav-goal" data-act="goal-chip">' + esc(state.goal) + I("chev") + "</button>";
    },
    render() {
      const list = state.filters === "全部"
        ? DATA.brands
        : DATA.brands.filter((b) => b.cat.indexOf(state.filters) >= 0);
      return (
        '<div class="page menu-page">' +
        '<div class="menu-hero"></div>' +
        '<div class="chips menu-filters">' + MENU_FILTERS[0].map((c) =>
          '<button class="chip ' + (state.filters === c ? "active" : "") +
          '" data-act="filter" data-filter="' + c + '">' + c + "</button>").join("") + "</div>" +
        '<div class="chips menu-filters second">' + MENU_FILTERS[1].map((c) =>
          '<button class="chip ' + (state.filters === c ? "active" : "") +
          '" data-act="filter" data-filter="' + c + '">' + c + "</button>").join("") + "</div>" +
        '<div class="brand-list">' + list.map((b) =>
          '<article class="card brand-card" data-act="brand" data-id="' + b.id + '">' +
          '<div class="brand-main"><b>' + esc(b.name) + "</b>" +
          '<p>' + esc(b.desc) + "</p>" +
          '<div class="brand-tags">' + b.tags.map((t) => '<span class="tag tint">' + t + "</span>").join("") + "</div>" +
          '<div class="brand-foot"><span class="brand-price">' + esc(b.price) + "</span>" +
          '<button class="btn sm" data-act="buy" data-id="' + b.id + '">购买</button></div>' +
          "</div></article>").join("") +
        "</div>" +
        (list.length ? '<div class="list-end">没有更多了</div>' : '<div class="empty">该分类下暂无可选品牌</div>') +
        "</div>"
      );
    },
  });

  screen("menuResearch", {
    title: "择食", noTab: true,
    render() {
      return '<div class="page"><div class="empty">' + I("meal") + "<div>这一分类还在研发中，敬请期待</div></div></div>";
    },
  });

  screen("brandDetail", {
    title: "精选品牌",
    render() {
      const d = DATA.brandDetail;
      return (
        '<div class="page brand-detail">' +
        '<div class="bd-hero"><i class="bd-cover">' + assetImg("assets/brand-detail-hero.jpg") + "</i></div>" +
        '<span class="tiny">' + esc(d.kicker) + "</span>" +
        '<h1 class="bd-title">' + esc(d.title) + "</h1>" +
        '<div class="bd-tags">' + d.tags.map((t) => '<span class="tag">' + t + "</span>").join("") +
        '<b class="bd-price">' + esc(d.price) + "</b></div>" +
        '<div class="ad-body">' + d.paras.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>" +
        '<div class="bd-gallery">' + ASSETS.gallery.map((src) =>
          "<i>" + assetImg(src) + "</i>").join("") + "</div>" +
        '<div class="bottom-bar"><span class="price">已选<b>新用户专享 5 餐</b></span>' +
        '<button class="btn" data-act="buy">购买品牌套餐</button></div>' +
        "</div>"
      );
    },
  });

  /* ---------- 确认套餐 / 支付 ---------- */
  screen("packageConfirm", {
    title: "确认套餐",
    render() {
      const brand = DATA.brands.find((b) => b.id === state.currentBrand) || DATA.brands[0];
      return (
        '<div class="page">' +
        '<div class="pk-brand"><i class="pk-logo">' + assetImg(brandCover(brand.id)) + "</i>" +
        "<b>" + esc(brand.name) + '</b><span class="tiny">点击确认即表示已阅读并同意相关规则</span></div>' +
        '<div class="pk-list">' + DATA.packages.map((p) =>
          '<article class="card pk-card ' + (state.currentPackage === p.id ? "on" : "") +
          '" data-act="pick-package" data-id="' + p.id + '">' +
          '<div class="pk-head"><b>' + esc(p.name) + "</b>" +
          (p.tag ? '<span class="tag">' + esc(p.tag) + "</span>" : "") + "</div>" +
          '<p class="pk-meals">' + esc(p.meals) + "</p>" +
          '<div class="pk-foot"><b class="pk-price num">' + money(p.price) + "</b>" +
          '<button class="link" data-act="package-detail">查看详情' + I("chev") + "</button></div>" +
          "</article>").join("") + "</div>" +
        '<div class="agree-line"><i class="tick on"></i><span>点击确认即表示已阅读并同意《套餐服务规则》和《配送及退改说明》</span></div>' +
        '<div class="bottom-bar"><button class="btn" data-act="pay">确认套餐并付款</button></div>' +
        "</div>"
      );
    },
  });

  screen("pay", {
    title: "订单支付",
    render() {
      const pkg = DATA.packages.find((p) => p.id === state.currentPackage) || DATA.packages[0];
      return (
        '<div class="page pay-page">' +
        '<section class="card pay-card"><div class="pay-amount num">' + money(pkg.price) + "</div>" +
        '<div class="pay-name">' + esc(pkg.name) + "</div>" +
        '<div class="qr-box"><i class="qr"></i><span>二维码支付</span></div>' +
        '<p class="tiny">请使用微信扫一扫完成支付，支付成功后自动绑定配送计划。</p></section>' +
        '<button class="btn block" data-act="pay-done">模拟支付成功</button>' +
        "</div>"
      );
    },
  });

  screen("orderSuccess", {
    title: "订购结果",
    render() {
      return (
        '<div class="page">' +
        '<div class="success-hero"><i class="sc-icon">' + I("checkCircle") + "</i>" +
        "<b>订购成功</b><p>套餐权益已到账，配送计划已成功绑定</p></div>" +
        '<section class="card"><div class="card-head"><h3>品牌信息</h3></div>' +
        '<div class="os-brand"><i class="pk-logo">' + assetImg(brandCover("eattime")) + "</i><b>EatTime</b></div>" +
        '<p class="tiny">每餐约 500、600Kcal，川味为主，每餐油脂（包括肉类食物内脂肪重）不超过 20g；每周更新菜单，每餐菜品不重样。</p></section>' +
        '<section class="card"><div class="card-head"><h3>套餐信息</h3></div>' +
        '<div class="os-row"><span>人气推荐 · 新用户专享</span><b>剩余 5 餐 · 已使用 0 餐</b></div></section>' +
        '<section class="card"><div class="card-head"><h3>基本信息</h3></div>' +
        '<div class="os-row"><span>配送计划名称</span><b>工作日午晚餐计划 123</b></div>' +
        '<div class="os-row"><span>配送日期规则</span><b>每日配送，一天一餐（晚餐）</b></div></section>' +
        '<div class="os-actions"><button class="btn plain" data-act="home">返回首页</button>' +
        '<button class="btn" data-act="package">查看我的订购</button></div>' +
        "</div>"
      );
    },
  });

  /* ---------- 我的订单 ---------- */
  screen("orders", {
    title: "我的订单",
    render() {
      const tabs = ["全部", "进行中", "待使用", "待付款", "已完成", "取消退款"];
      const list = state.orderTab === "全部"
        ? DATA.orders
        : DATA.orders.filter((o) => o.status === state.orderTab);
      return (
        '<div class="page orders-page">' +
        '<div class="order-tabs">' + tabs.map((t) =>
          '<button class="' + (state.orderTab === t ? "active" : "") + '" data-act="order-tab" data-tab="' + t + '">' +
          t + "</button>").join("") + "</div>" +
        '<div class="order-list">' + list.map(orderCard).join("") + "</div>" +
        (list.length ? '<div class="list-end">没有更多了</div>' : '<div class="empty">暂无相关订单</div>') +
        "</div>"
      );
    },
  });

  function orderCard(order) {
    const actions = {
      待付款: '<button class="oc-btn" data-act="order-cancel" data-id="' + order.id + '">取消订单</button>' +
        '<button class="oc-btn" data-act="order-detail" data-id="' + order.id + '">查看详情</button>' +
        '<button class="oc-btn primary" data-act="order-pay" data-id="' + order.id + '">立即付款</button>',
      待使用: '<button class="oc-btn" data-act="order-cancel" data-id="' + order.id + '">取消订单</button>' +
        '<button class="oc-btn" data-act="order-detail" data-id="' + order.id + '">查看详情</button>' +
        '<button class="oc-btn primary" data-act="order-use" data-id="' + order.id + '">立即使用</button>',
      进行中: '<button class="oc-btn" data-act="order-detail" data-id="' + order.id + '">查看详情</button>' +
        '<button class="oc-btn primary" data-act="order-renew" data-id="' + order.id + '">续费</button>',
      已完成: '<button class="oc-btn" data-act="order-detail" data-id="' + order.id + '">查看详情</button>' +
        '<button class="oc-btn primary" data-act="order-again" data-id="' + order.id + '">再次购买</button>',
      已取消: '<button class="oc-btn" data-act="order-detail" data-id="' + order.id + '">查看详情</button>' +
        '<button class="oc-btn primary" data-act="order-again" data-id="' + order.id + '">再次购买</button>',
    };
    return (
      '<article class="card order-card">' +
      '<div class="oc-head"><i class="oc-logo">' + assetImg(brandCover(order.brand)) + "</i>" +
      '<b class="oc-brand">' + esc(order.brand) + "</b>" +
      '<span class="oc-status ' + esc(order.status) + '">' + esc(order.status) + "</span></div>" +
      '<div class="oc-id">订单号：' + esc(order.id) + "</div>" +
      '<div class="oc-row"><b class="oc-pkg">' + esc(order.pkg) + "</b>" +
      '<b class="oc-price num">' + money(order.price) + "</b></div>" +
      '<div class="oc-meals">' + esc(order.meals) + "</div>" +
      (order.next ? '<div class="oc-next">' + esc(order.next) + "</div>" : "") +
      '<div class="oc-time">下单时间：' + esc(order.time) + "</div>" +
      (order.countdown ? '<div class="oc-count"><b>' + esc(order.countdown) + "</b><span>后关闭订单</span></div>" : "") +
      '<div class="oc-btns">' + (actions[order.status] || "") + "</div>" +
      "</article>"
    );
  }

  screen("orderDetail", {
    title: "订购详情",
    render() {
      const order = DATA.orders.find((o) => o.id === state.orderDetailId) || DATA.orders[3];
      const days = [
        { d: "10月5日", wd: "周一", n: 1, state: "已送达" },
        { d: "10月6日", wd: "周二", n: 1, state: "已送达" },
        { d: "10月7日", wd: "周三", n: 1, state: "已送达" },
        { d: "10月8日", wd: "周四", n: 0, state: "无配送计划" },
        { d: "10月9日", wd: "周五", n: 0, state: "无配送计划" },
        { d: "10月10日", wd: "周六", n: 0, state: "无配送计划" },
        { d: "10月11日", wd: "周日", n: 0, state: "无配送计划" },
      ];
      return (
        '<div class="page order-detail">' +
        '<section class="card od-head"><div class="od-brand"><i class="pk-logo">' +
        assetImg(brandCover("eattime")) + "</i>" +
        "<b>" + esc(order.brand) + "</b><span class=\"tag\">" + esc(order.pkg) + "</span></div>" +
        '<p class="tiny">每餐约 500、600Kcal，川味为主，每餐油脂（包括肉类食物内脂肪重）不超过 20g；每周更新菜单，每餐菜品不重样。</p>' +
        '<div class="od-info"><span>订购时间：' + esc(order.time) + "</span><span>订单号：" + esc(order.id) + "</span></div>" +
        '<div class="od-stats"><span><small>开始配送</small><b>2026-10-10</b></span>' +
        "<span><small>已用餐数</small><b>2</b></span>" +
        "<span><small>剩余餐数</small><b>8</b></span>" +
        "<span><small>到期时间</small><b>2026-10-21</b></span></div>" +
        '<div class="od-plan"><span>配送计划</span><b>工作日配送</b><button class="link" data-act="change-plan">更换配送计划</button></div>' +
        "</section>" +
        '<section class="card"><div class="card-head"><h3>本周订单</h3><span class="tiny">10.5–10.11</span></div>' +
        '<div class="od-days">' + days.map((day, i) =>
          '<div class="od-day ' + (day.state === "已送达" ? "done" : "") + '">' +
          "<small>" + day.wd + "</small><b>" + day.d + "</b>" +
          "<em>" + (day.n ? day.n + " 餐" : "—") + "</em>" +
          "<span>" + day.state + "</span></div>").join("") + "</div>" +
        '<button class="btn plain block od-menu" data-act="weekly-menu">查看本周菜单</button>' +
        "</section>" +
        '<div class="od-actions"><button class="btn plain" data-act="order-renew">续费订单</button>' +
        '<button class="btn plain" data-act="order-pause">暂停订单</button>' +
        '<button class="btn plain" data-act="order-refund">退订订单</button></div>' +
        "</div>"
      );
    },
  });

  /* ---------- 已购套餐 ---------- */
  screen("package", {
    title: "渡鸦管家", logo: true, tab: "package",
    navLeft() {
      return '<button class="nav-goal" data-act="goal-chip">' + esc(state.goal) + I("chev") + "</button>";
    },
    render() {
      const counts = { 1: 5, 2: 2, 5: 9, 6: 14, 7: 2, 8: 7, 9: 6, 10: 2, 11: 5, 12: 10, 13: 7,
        14: 2, 15: 5, 16: 9, 17: 6, 18: 7, 19: 2, 20: 5, 21: 4, 22: 6, 23: 3, 24: 2, 25: 5,
        26: 7, 27: 2, 28: 6, 29: 1, 30: 1, 31: 2 };
      const days = [];
      for (let d = 1; d <= 31; d += 1) days.push({ d, n: counts[d] || 0, today: d === 10 });
      return (
        '<div class="page package-page">' +
        '<div class="pkg-tabs"><button class="active">已购套餐</button><button data-act="plans">配送计划</button></div>' +
        '<section class="card">' +
        '<div class="card-head"><h3>配送日历</h3><span class="tiny">2026年10月</span></div>' +
        '<div class="cal-grid delivery-cal">' +
        ["日", "一", "二", "三", "四", "五", "六"].map((w) => '<span class="wd">' + w + "</span>").join("") +
        [0, 1, 2, 3].map(() => '<span class="cal-cell dim"></span>').join("") +
        days.map((day) =>
          '<span class="cal-cell dc-day ' + (day.today ? "today" : "") + '">' +
          "<span>" + day.d + "</span>" +
          (day.n ? '<i class="badge">' + day.n + "餐</i>" : "") + "</span>").join("") + "</div>" +
        "</section>" +
        '<section class="card">' +
        '<div class="card-head"><h3>订阅明细</h3><span class="tiny">共 ' + DATA.deliveries.reduce((n, d) => n + d.left, 0) + " 餐</span></div>" +
        '<div class="sub-list">' + DATA.deliveries.map((d) =>
          '<article class="sub-row" data-act="delivery" data-id="' + d.id + '">' +
          '<i class="pk-logo">' + assetImg(brandCover(d.brand)) + "</i>" +
          "<div><b>" + esc(d.name) + "</b><small>配送计划：" + esc(d.name) + "</small>" +
          "<small>" + esc(d.meals) + " · " + esc(d.time) + "</small></div>" +
          '<span class="sub-left">剩余 ' + d.left + " 餐</span></article>").join("") + "</div>" +
        "</section>" +
        '<button class="btn block package-tomorrow" data-act="tomorrow">次日订单</button>' +
        "</div>"
      );
    },
  });

  /* ---------- 我的配送计划 ---------- */
  screen("plans", {
    title: "我的配送计划",
    render() {
      return (
        '<div class="page plans-page">' +
        '<div class="plans-kicker"><b>DELIVERY PLANS</b><span class="eng-label">我的配送计划</span></div>' +
        '<div class="plan-list">' + state.plans.map((p) =>
          '<article class="card plan-card">' +
          '<div class="plan-head"><b>' + esc(p.name) + "</b>" +
          (p.active ? '<span class="tag">正在使用</span>' : "") + "</div>" +
          '<div class="plan-meta"><span>' + esc(p.rule) + "</span><span>" + esc(p.time) + "</span>" +
          "<span>剩余 " + p.left + " 餐</span></div>" +
          '<div class="plan-foot"><button class="link-muted" data-act="plan-view" data-id="' + p.id + '">查看详情</button>' +
          '<button class="link" data-act="plan-edit" data-id="' + p.id + '">修改计划</button></div>' +
          "</article>").join("") + "</div>" +
        '<button class="btn block" data-act="plan-new">＋ 新建计划</button>' +
        "</div>"
      );
    },
  });

  screen("planDetail", {
    title: "配送计划详情",
    render() {
      const p = state.plans.find((x) => x.id === state.editingPlanId) || state.plans[0];
      return (
        '<div class="page plan-detail">' +
        '<section class="card pd-head"><div class="pd-title"><b>' + esc(p.name) + "</b>" +
        (p.active ? '<span class="tag">正在使用</span>' : "") + "</div>" +
        '<p class="tiny">' + esc(p.rule) + " | " + esc(p.time) + "</p></section>" +
        '<section class="card"><div class="card-head"><h3>基本信息</h3></div>' +
        '<div class="pd-rows">' +
        pdRow("配送计划名称", p.name) +
        pdRow("配送日期规则", p.rule + " 一天一餐（" + p.meals.join("、") + "）") +
        pdRow("忌口", p.taboo || "无") +
        pdRow("过敏信息", p.allergy || "无") +
        pdRow("备注", p.note || "无") + "</div></section>" +
        '<section class="card"><div class="card-head"><h3>配送配置详情</h3></div>' +
        '<div class="pd-weeks">' + ["周四", "周五", "周六"].map((wd) =>
          '<div class="pd-week"><b>' + wd + '</b><span>1 餐 · ' + esc(p.time) + "</span>" +
          "<small>配送地址：四川省成都市双流区华阳街道 2 段 188 号</small>" +
          "<small>联系人：李 · 136****6666</small></div>").join("") + "</div></section>" +
        '<div class="pd-actions"><button class="btn plain" data-act="plan-del">删除计划</button>' +
        '<button class="btn" data-act="plan-edit" data-id="' + p.id + '">修改配送计划</button></div>' +
        "</div>"
      );
    },
  });

  function pdRow(label, value) {
    return '<div class="pd-row"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>";
  }

  screen("planForm", {
    title: "添加配送计划",
    render() {
      const f = state.planForm || {};
      const meals = f.meals || ["午餐", "晚餐"];
      const rule = f.rule || "工作日配送";
      return (
        '<div class="page plan-form">' +
        '<section class="plan-section"><h3>' + I("record") + "基础信息</h3>" +
        '<div class="stack-row"><span>配送计划名称</span>' +
        '<input id="plan-name" placeholder="请填写计划名称" value="' + esc(f.name || "") + '"></div>' +
        '<div class="stack-row"><span>配送地址</span>' +
        "<p>四川省成都市双流区华阳街道 2 段 188 号</p><p>李 13666666666</p></div>" +
        "</section>" +
        '<section class="plan-section"><h3>' + I("clock") + "每次配送时间</h3>" +
        '<div class="rule-chips">' + ["工作日配送", "每日配送", "自定义配送"].map((r) =>
          '<button class="chip ' + (rule === r ? "active" : "") +
          '" data-act="plan-rule" data-rule="' + r + '">' + r + "</button>").join("") + "</div>" +
        (rule === "自定义配送"
          ? '<div class="chip-row plan-days">' + WEEKDAYS.map((wd) =>
            '<button class="chip ' + ((f.customDays || []).indexOf(wd) >= 0 ? "active" : "") +
            '" data-act="plan-day" data-day="' + wd + '">' + wd + "</button>").join("") + "</div>"
          : "") +
        '<div class="rule-chips two per-day">' + ["一天一餐", "一天两餐"].map((m) =>
          '<button class="chip ' + ((f.perDay || "一天两餐") === m ? "active" : "") +
          '" data-act="plan-perday" data-per="' + m + '">' + m + "</button>").join("") + "</div>" +
        '<div class="plan-meals">' +
        '<div class="plan-meal-row"><b>选择餐次</b>' +
        '<span class="meal-chips">' + ["午餐", "晚餐"].map((m) =>
          '<button class="chip ' + (meals.indexOf(m) >= 0 ? "active" : "") +
          '" data-act="plan-meal" data-meal="' + m + '">' + m + "</button>").join("") + "</span></div>" +
        (meals.indexOf("午餐") >= 0
          ? '<div class="plan-meal-row"><b>配送时间</b>' +
            '<button class="ab-pick" data-act="plan-meal-time" data-meal="午餐">' +
            esc(f.lunchTime || "11:00 前送达") + "</button></div>" : "") +
        (meals.indexOf("晚餐") >= 0
          ? '<div class="plan-meal-row"><b>配送时间</b>' +
            '<button class="ab-pick" data-act="plan-meal-time" data-meal="晚餐">' +
            esc(f.dinnerTime || "12:00 前送达") + "</button></div>" : "") +
        "</div></section>" +
        '<section class="plan-section"><h3>' + I("leaf") + "饮食偏好</h3>" +
        '<div class="stack-row"><span>忌口</span><input placeholder="如：不吃香菜、少油" value="' + esc(f.taboo || "") + '"></div>' +
        '<div class="stack-row"><span>过敏信息</span><input placeholder="如：坚果、乳制品过敏" value="' + esc(f.allergy || "") + '"></div>' +
        '<div class="stack-row"><span>备注</span><input placeholder="如：不打电话、联系不上放门口" value="' + esc(f.note || "") + '"></div>' +
        "</section>" +
        '<button class="btn block plan-submit" data-act="plan-save">确认创建配送计划</button>' +
        "</div>"
      );
    },
  });

  screen("weeklyMenu", {
    title: "本周菜单",
    render() {
      return (
        '<div class="page">' +
        (state.menuFailed
          ? '<div class="empty">' + I("record") + "<div>菜单暂时加载失败</div>" +
            '<button class="btn sm ghost menu-retry" data-act="menu-reload">重新加载</button></div>'
          : '<div class="week-menu">' + ["周一", "周二", "周三", "周四", "周五"].map((wd, i) =>
            '<section class="card"><div class="card-head"><h3>' + wd + "</h3>" +
            '<span class="tiny">午餐 · 晚餐</span></div>' +
            '<div class="wm-meals"><div class="wm-meal"><i>' + assetImg("assets/meal-1.jpg") +
            "</i><b>香煎鸡胸配糙米饭</b><small>约 520Kcal</small></div>" +
            '<div class="wm-meal"><i>' + assetImg("assets/meal-2.jpg") +
            "</i><b>黑椒牛肉时蔬碗</b><small>约 560Kcal</small></div></div></section>" + "</div>").join("") + "</div>") +
        "</div>"
      );
    },
  });

  screen("tomorrow", {
    title: "明日配送",
    render() {
      return (
        '<div class="page">' +
        '<div class="tm-head"><b>2026-10-11 明日配送</b>' +
        "<span>" + I("info", "hr-icon") + "已过今天 17:00，不可再修改；可分别调整各品牌订单</span></div>" +
        '<div class="tm-list">' + [
          { brand: "嘻嘻轻食", desc: "嘻嘻轻食，营养健康", plan: "工作日午晚餐计划 123", meal: "晚餐 12:00 前送达", left: 1 },
          { brand: "森林健康", desc: "海陆大满贯鸡肉 * 牛肉 * 虾仁", plan: "工作日晚餐计划", meal: "晚餐 12:00 前送达", left: 1 },
          { brand: "EatTime", desc: "川味为主，每餐油脂不超过 20g", plan: "工作日午晚餐计划 123", meal: "午餐 11:00 前送达", left: 1 },
        ].map((item) =>
          '<article class="card tm-card"><div class="tm-brand"><i class="pk-logo">' + assetImg(brandCover(item.brand)) + "</i>" +
          "<div><b>" + esc(item.brand) + "</b><small>" + esc(item.desc) + "</small></div>" +
          '<span class="tiny">明日 ' + item.left + " 餐</span></div>" +
          '<p class="tiny">配送计划：' + esc(item.plan) + " · " + esc(item.meal) + "</p>" +
          '<p class="tiny">四川省成都市双流区四川省成都市双流区东升街道 2 段</p>' +
          '<button class="btn plain block" data-act="adjust-order">调整订单</button></article>').join("") + "</div>" +
        "</div>"
      );
    },
  });

  /* ---------- 我的 ---------- */
  screen("profile", {
    title: "渡鸦管家", logo: true, tab: "profile",
    navStyle: { bg: "#F3FAE3", ink: "#121212" },
    render() {
      const p = state.profile;
      const quick = [
        { key: "weight", label: "体重记录", icon: "scale" },
        { key: "addresses", label: "收货地址", icon: "pin" },
        { key: "health", label: "健康档案", icon: "record" },
        { key: "coupon", label: "优惠福利", icon: "gift" },
        { key: "favorites", label: "我的收藏", icon: "heart" },
        { key: "metabolism", label: "代谢计算器", icon: "chart" },
        { key: "survey", label: "问卷调查", icon: "question" },
      ];
      return (
        '<div class="page profile-page">' +
        '<section class="card user-card">' +
        '<div class="uc-top"><i class="uc-avatar">' + I("user") + "</i>" +
        "<div><b>" + esc(p.name) + "</b><small>" + esc(p.account) + "</small>" +
        '<small class="uc-met">BMR ' + bmr() + " kcal · TDEE " + tdee() + " kcal</small></div>" +
        '<button class="link-muted" data-act="edit-profile">编辑资料</button></div>' +
        "</section>" +
        '<section class="card">' +
        '<div class="card-head"><h3>我的订单</h3>' +
        '<button class="more" data-act="orders">全部' + I("chev") + "</button></div>" +
        '<div class="order-quick">' + ["全部", "进行中", "待使用", "待付款"].map((t) =>
          '<button data-act="orders-tab" data-tab="' + t + '">' +
          '<b class="num">' + DATA.orders.filter((o) => t === "全部" || o.status === t).length + "</b>" +
          "<span>" + t + "</span></button>").join("") + "</div>" +
        "</section>" +
        '<section class="card"><div class="card-head"><h3>快捷服务</h3></div>' +
        '<div class="quick-grid profile-grid">' + quick.map((item) =>
          '<button class="quick-item" data-act="profile-quick" data-key="' + item.key + '">' +
          '<i class="quick-icon">' + I(item.icon) + "</i><span>" + item.label + "</span></button>").join("") + "</div></section>" +
        '<section class="card"><div class="card-head"><h3>更多工具</h3></div>' +
        '<div class="rows">' +
        '<button class="row" data-act="service"><span class="row-main"><span class="row-title">专属客服</span>' +
        '<span class="row-sub">工作时间：周一到周五 09:00–18:00</span></span><span class="row-tail">' + I("chev", "chev") + "</span></button>" +
        '<button class="row" data-act="cooperation"><span class="row-main"><span class="row-title">与我合作</span>' +
        '<span class="row-sub">品牌、企业餐配与渠道合作</span></span><span class="row-tail">' + I("chev", "chev") + "</span></button>" +
        "</div></section>" +
        '<button class="btn plain block logout" data-act="logout">退出登录</button>' +
        "</div>"
      );
    },
  });

  screen("cooperation", {
    title: "与我合作",
    render() {
      return (
        '<div class="page">' +
        '<h1 class="quiz-title">品牌联名、企业餐配与渠道合作</h1>' +
        '<div class="rows form-rows">' +
        '<div class="form-row"><label>姓名</label><input value="Opalite"></div>' +
        '<div class="form-row"><label>联系方式</label><input placeholder="请输入手机号"></div>' +
        "</div>" +
        '<section class="card"><div class="card-head"><h3>合作内容</h3></div>' +
        '<textarea class="co-textarea" placeholder="请描述品牌联名、企业餐配或渠道合作需求"></textarea></section>' +
        '<button class="btn block" data-act="coop-submit">提交合作意向</button>' +
        "</div>"
      );
    },
  });

  screen("survey", {
    title: "问卷调查",
    render() {
      return '<div class="page"><div class="empty">' + I("question") + "<div>敬请期待</div>" +
        '<p class="tiny">问卷调查功能正在准备中</p></div></div>';
    },
  });

  screen("editProfile", {
    title: "编辑资料",
    render() {
      const p = state.profile;
      return (
        '<div class="page">' +
        '<div class="rows form-rows">' +
        '<div class="form-row"><label>昵称</label><input id="ep-name" value="' + esc(p.name) + '"></div>' +
        '<div class="form-row"><label>身高(cm)</label><input id="ep-height" inputmode="numeric" value="' + p.height + '"></div>' +
        '<div class="form-row"><label>当前体重</label><input id="ep-weight" inputmode="decimal" value="' + n1(p.weight) + '"></div>' +
        '<div class="form-row"><label>初始体重</label><input id="ep-start" inputmode="decimal" value="' + n1(p.startWeight) + '"></div>' +
        "</div>" +
        '<button class="btn block" data-act="profile-save">保存资料</button>' +
        "</div>"
      );
    },
  });

  /* ============================ 渲染 ============================ */
  function render() {
    const screenDef = SCREENS[state.route] || SCREENS.home;
    const style = screenDef.navStyle || {};
    const root = document.documentElement;
    root.style.setProperty("--nav-bg", style.bg || "#fff");
    root.style.setProperty("--nav-ink", style.ink || "#121212");
    $("#nav").innerHTML = navMarkup();
    const stage = $("#stage");
    stage.innerHTML = screenDef.render();
    const tabbar = $("#tab-bar");
    tabbar.innerHTML = tabbarMarkup();
    tabbar.hidden = noTab.indexOf(state.route) >= 0 || !!screenDef.noTab;
    if (screenDef.mounted) screenDef.mounted();
  }

  /* ============================ 事件委托 ============================ */
  document.addEventListener("click", (event) => {
    const tabNode = event.target.closest(".tab-bar [data-tab]");
    if (tabNode) {
      const key = tabNode.dataset.tab;
      state.tab = key;
      go(TAB_ROUTES[key], { root: true, tab: key });
      return;
    }
    const rangeNode = event.target.closest("[data-range]");
    if (rangeNode) {
      state.weightRange = rangeNode.dataset.range;
      render();
      return;
    }
    const node = event.target.closest("[data-act]");
    if (!node) return;
    const act = node.dataset.act;
    if (ACTIONS[act]) ACTIONS[act](node, event);
  });

  const ACTIONS = {
    back() { back(); },
    "goal-chip"() { go("track"); },
    weight(node) { node && go("weight"); },
    "weight-page"() { go("weight"); },
    water() {
      sheet({ title: "今日饮水", body: '<div class="water-panel"><b class="num">0</b><em>ml</em>' +
        "<p>建议每日饮水 1.5～2L，分次小口补充。</p>" +
        '<div class="chip-row">' + [200, 300, 500].map((v) =>
          '<button class="chip" data-act="water-add" data-ml="' + v + '">+' + v + "ml</button>").join("") + "</div></div>",
      });
    },
    "water-add"(node) { closeLayer(); toast("已记录 " + node.dataset.ml + "ml 饮水"); },
    checkin() {
      const index = state.checkinDays.indexOf(10);
      if (index >= 0) state.checkinDays.splice(index, 1);
      else state.checkinDays.push(10);
      save();
      render();
      toast(index >= 0 ? "已取消打卡" : "打卡成功");
    },
    notice() { go("notice"); },
    articles() { go("articles"); },
    article(node) { state.articleId = node.dataset.id; go("article"); },
    quick(node) {
      const key = node.dataset.key;
      if (key === "health") go("health");
      else if (key === "address") go("addresses");
      else if (key === "articles") go("articles");
      else if (key === "tomorrow") go("tomorrow");
    },
    "article-cat"(node) { state.articleCat = node.dataset.cat; render(); },
    favorite(node) {
      const id = node.dataset.id;
      const index = state.favorites.indexOf(id);
      if (index >= 0) state.favorites.splice(index, 1);
      else state.favorites.push(id);
      save();
      render();
      toast(index >= 0 ? "已取消收藏" : "已收藏");
    },
    "notice-detail"() { go("notice"); },

    /* 体重记录 */
    "cal-prev"() { shiftMonth(-1); },
    "cal-next"() { shiftMonth(1); },
    "cal-pick"(node) { toast("10月" + node.dataset.day + "日"); },
    "weight-add"() {
      weightEntrySheet();
    },
    "sheet-close"() { closeLayer(); },
    "weight-key"(node) {
      const input = $("#weight-input");
      if (!input) return;
      if (node.dataset.key === "⌫") input.value = input.value.slice(0, -1);
      else input.value = (input.value === "0" ? "" : input.value) + node.dataset.key;
      const display = $("#we-value");
      if (display) display.textContent = input.value || "0.0";
    },
    "we-quick"(node) {
      const input = $("#weight-input");
      if (input) input.value = n1(node.dataset.v);
      const display = $("#we-value");
      if (display) display.textContent = n1(node.dataset.v);
      $$(".we-quick button").forEach((b) => b.classList.toggle("focus", b === node));
    },
    "weight-save"() {
      const input = $("#weight-input");
      const value = Number(input && input.value);
      if (!value) { toast("请输入体重"); return; }
      const existing = state.weights.find((w) => w.date.indexOf("2026-10-10") === 0);
      const prev = state.weights[0].value;
      if (existing) existing.value = value;
      else state.weights.unshift({ date: "2026-10-10 17:50", value: value, delta: 0 });
      state.weights[0].delta = Number((value - prev).toFixed(1));
      state.profile.weight = value;
      save(); closeLayer(); render(); toast("体重已记录");
    },
    "weight-list"() {
      sheet({ title: "月度体重列表", body: '<div class="weight-history">' + state.weights.map((w) =>
        '<div class="wh-row"><i class="wh-icon">' + I("scale") + "</i>" +
        '<span><b class="num">' + n1(w.value) + "kg</b><small>" + esc(w.date) + "</small></span>" +
        '<em class="' + (w.delta < 0 ? "down" : "up") + '">较上次 ' +
        (w.delta > 0 ? "+" : "") + n1(w.delta) + "kg</em></div>").join("") + "</div>" });
    },

    /* 健康档案 */
    activity() { activitySheet(); },
    "activity-tip"() { activityTipSheet(); },
    "activity-pick"(node) {
      state.pendingActivity = node.dataset.value;
      $$(".sheet-options li").forEach((li) => {
        const on = li.dataset.value === node.dataset.value;
        li.classList.toggle("on", on);
        const mark = li.querySelector("svg");
        if (on && !mark) li.insertAdjacentHTML("beforeend", I("check"));
        if (!on && mark) mark.remove();
      });
    },
    "activity-save"() {
      if (state.pendingActivity) state.profile.activity = state.pendingActivity;
      save(); closeLayer(); render(); toast("活动水平已修改");
    },

    /* 计划页 */
    "goal-edit"() { go("goalQuiz"); },
    "goal-calendar"() { go("goalCalendar"); },
    task(node) {
      const key = node.dataset.key;
      state.goalTasks[key] = !state.goalTasks[key];
      save(); render();
      if (state.goalTasks[key]) toast("打卡成功");
    },
    "pick-goal"(node) {
      const name = node.dataset.goal;
      if (name !== "健康饮食") { toast("该目标研发中，敬请期待"); return; }
      state.goal = name;
      render();
    },
    "goal-done"() { save(); toast("计划已生成"); back(); },
    "meta-gender"() {
      sheet({
        picker: true,
        title: "选择性别",
        body: optionList(["男", "女"], (state.metabolism || {}).gender, "meta-gender-pick"),
      });
    },
    "meta-gender-pick"(node) {
      state.metabolism = Object.assign({}, state.metabolism, { gender: node.dataset.value });
      closeLayer();
      render();
    },
    "meta-number"(node) {
      const field = node.dataset.field;
      const labels = { age: "请输入年龄", height: "请输入身高", weight: "请输入体重" };
      sheet({
        title: labels[field],
        body: '<div class="weight-form"><input id="meta-input" inputmode="decimal" value="' +
          ((state.metabolism || {})[field] || "") + '"></div>',
        footer: '<button class="btn block" data-act="meta-save" data-field="' + field + '">保存</button>',
      });
    },
    "meta-save"(node) {
      const input = $("#meta-input");
      const value = Number(input && input.value);
      if (!value) { toast("请输入有效数值"); return; }
      const next = Object.assign({}, state.metabolism, { [node.dataset.field]: value });
      let complete = false;
      if (next.height && next.weight && next.age) {
        const sex = next.gender === "男" ? 5 : -161;
        const bmrValue = Math.round(10 * next.weight + 6.25 * next.height - 5 * next.age + sex);
        next.bmr = bmrValue;
        next.tdee = Math.round(bmrValue * 1.55);
        complete = true;
      }
      state.metabolism = next;
      closeLayer();
      render();
      if (complete) metabolismSheet();
    },

    /* 地址 */
    "addr-default"(node) {
      state.addresses.forEach((a) => { a.def = a.id === Number(node.dataset.id); });
      save(); render(); toast("已设为默认地址");
    },
    "addr-edit"(node) { state.editingAddressId = Number(node.dataset.id); go("addressEdit"); },
    "addr-del"(node) {
      const id = Number(node.dataset.id);
      confirmModal("删除收货地址？", "删除后无法恢复，后续配送将不再使用该地址。", "确认删除", () => {
        state.addresses = state.addresses.filter((a) => a.id !== id);
        save(); render(); toast("删除成功");
      });
    },
    "addr-new"() { state.editingAddressId = null; go("addressEdit"); },
    "map-pick"() { toast("已使用当前位置：成都高新孵化园"); },
    "addr-region"() {
      regionSheet();
    },
    "region-pick"(node) {
      const next = Object.assign({}, state.regionPick);
      next[node.dataset.key] = node.dataset.value;
      if (node.dataset.key === "p") { next.c = "成都市"; next.d = ""; }
      state.regionPick = next;
      closeLayer();
      regionSheet();
    },
    "sheet-confirm"() {
      const pick = state.regionPick || {};
      if (pick.d) {
        const node = $(".form-row .pick.empty");
        if (node) { node.textContent = pick.p + " " + pick.c + " " + pick.d; node.classList.remove("empty"); }
      }
      closeLayer();
    },
    "addr-tag"(node) {
      $$("[data-act='addr-tag']").forEach((other) => {
        other.classList.toggle("active", other === node);
      });
      if (node.dataset.tag === "自定义") tagCustomSheet();
    },
    "tag-save"() {
      const input = $("#tag-input");
      const value = (input && input.value.trim()) || "自定义";
      const chip = $("[data-act='addr-tag'][data-tag='自定义']");
      if (chip) chip.textContent = value;
      closeLayer();
    },
    "addr-def-switch"(node) { node.classList.toggle("on"); },
    "addr-paste"() {
      toast("已识别：张 135****6888 成都市双流区…");
    },
    "addr-save"() { save(); toast("保存成功"); back(); },

    /* 择食 / 套餐 / 支付 */
    filter(node) { state.filters = node.dataset.filter; render(); },
    brand(node) { state.currentBrand = node.dataset.id; go("brandDetail"); },
    buy(node) {
      if (node && node.dataset.id) state.currentBrand = node.dataset.id;
      packageSheet();
    },
    "pick-package"(node) {
      state.currentPackage = node.dataset.id;
      closeLayer();
      packageSheet();
    },
    "package-detail"() {
      packageDetailSheet();
    },
    "pay-open"() { closeLayer(); paySheet(); },
    pay() { go("pay"); },
    "pay-done"() {
      closeLayer();
      toast("支付成功");
      const order = DATA.orders.find((o) => o.status === "待付款");
      if (order) order.status = "进行中";
      go("orders", { root: true });
    },
    home() { go("home", { root: true, tab: "home" }); },
    package() { go("package", { root: true, tab: "package" }); },

    /* 订单 */
    "order-tab"(node) { state.orderTab = node.dataset.tab; render(); },
    orders() { go("orders"); },
    "orders-tab"(node) { state.orderTab = node.dataset.tab; go("orders"); },
    "order-detail"(node) { state.orderDetailId = node.dataset.id; go("orderDetail"); },
    "order-cancel"() {
      dialog({
        title: "取消订单",
        lines: ["确定取消该订单？", "确定取消该待付款订单吗？"],
        cancelText: "取消",
        okText: "确认取消",
        onOk() {
          const order = DATA.orders.find((o) => o.status === "待付款" || o.status === "待使用");
          if (order) order.status = "已取消";
          render();
          toast("订单已取消");
        },
      });
    },
    "order-pay"() { paySheet(); },
    "order-use"() { planPickerSheet("选择配送计划"); },
    "order-renew"() { planPickerSheet("续费订单"); },
    "order-again"() { packageSheet(); },
    "order-pause"() { pauseRangeSheet(); },
    "pause-pick"(node) {
      const day = Number(node.dataset.day);
      const range = (state.pauseRange || [12, 18]).slice();
      state.pauseRange = (day < range[0] || day > range[1]) ? [day, day] : [day, range[1]];
      closeLayer();
      pauseRangeSheet();
    },
    "pause-confirm"() { closeLayer(); toast("暂停成功"); },
    "order-refund"() { serviceSheet(); },
    call() { closeLayer(); toast("正在拨打 13666666666"); },
    "copy-wx"() { closeLayer(); toast("客服微信已复制"); },
    "change-plan"() { planPickerSheet("更换配送计划"); },
    "weekly-menu"() { state.menuFailed = true; go("weeklyMenu"); },
    "menu-reload"() { state.menuFailed = false; render(); toast("已重新加载"); },
    "adjust-order"() { deliveryAdjustSheet(); },
    "adjust-toggle"(node) {
      const key = node.dataset.key;
      const next = Object.assign({}, state.deliveryAdjust);
      next[key] = !next[key];
      state.deliveryAdjust = next;
      node.textContent = (next[key] ? "点击关闭" : "点击恢复") + (key === "lunch" ? "午餐" : "晚餐");
      const head = node.closest(".adjust-block").querySelector(".ab-head b");
      if (head) head.style.opacity = next[key] ? "1" : ".4";
    },
    "adjust-step"(node) {
      const key = node.dataset.key;
      const next = Object.assign({}, state.deliveryAdjust);
      next[key] = clamp((next[key] || 1) + Number(node.dataset.delta), 0, 12);
      state.deliveryAdjust = next;
      node.parentNode.querySelector("b").textContent = next[key] + " 餐";
    },
    "adjust-time"(node) {
      state.pendingTimeKey = node.dataset.key;
      timeSheet("选择配送时间", state.deliveryAdjust[node.dataset.key], "adjust-time-pick");
    },
    "adjust-time-pick"(node) {
      const key = state.pendingTimeKey || "lunchTime";
      const next = Object.assign({}, state.deliveryAdjust);
      next[key] = node.dataset.value;
      state.deliveryAdjust = next;
      closeLayer();
      deliveryAdjustSheet();
    },
    "toggle-switch"(node) { node.classList.toggle("on"); },
    "adjust-save"() { closeLayer(); toast("修改成功"); },

    /* 配送计划 */
    plans() { go("plans"); },
    delivery() { go("orderDetail"); },
    tomorrow() { go("tomorrow"); },
    "plan-view"(node) { state.editingPlanId = node.dataset.id; go("planDetail"); },
    "plan-pick"(node) {
      state.currentOrderPlanId = node.dataset.id;
      $$(".plan-pick").forEach((card) => card.classList.toggle("on", card === node));
    },
    "plan-confirm"() { closeLayer(); toast("已选择配送计划"); },
    "exist-pick"(node) {
      state.existChoice = node.dataset.value;
      $$(".exist-opt").forEach((opt) => opt.classList.toggle("on", opt === node));
    },
    "start-prev"() { shiftStartMonth(-1); },
    "start-next"() { shiftStartMonth(1); },
    "start-pick"(node) {
      state.startDate = "2026-" + String(state.startMonth.m + 1).padStart(2, "0") + "-" +
        String(node.dataset.day).padStart(2, "0");
      $$(".cal-cell").forEach((cell) => cell.classList.remove("sel"));
      node.classList.add("sel");
    },
    "start-confirm"() { closeLayer(); toast("开始配送日期已设置为 " + state.startDate); },
    "unified-time"() { timeSheet("选择配送时间", "12:00 前送达", "unified-time-pick"); },
    "unified-time-pick"() { closeLayer(); unifiedTimeSheet(); },
    "unified-save"() { closeLayer(); toast("保存成功"); },
    "plan-edit"(node) {
      state.editingPlanId = node.dataset.id;
      const plan = state.plans.find((p) => p.id === node.dataset.id);
      state.planForm = plan
        ? Object.assign({}, state.planForm, {
          name: plan.name, rule: plan.rule,
          perDay: plan.meals.length > 1 ? "一天两餐" : "一天一餐", meals: plan.meals,
          taboo: plan.taboo, allergy: plan.allergy, note: plan.note,
        })
        : Object.assign({}, state.planForm, { name: "", meals: ["午餐", "晚餐"] });
      go("planForm");
    },
    "plan-new"() {
      state.editingPlanId = null;
      state.planForm = Object.assign({}, state.planForm, { name: "", meals: ["午餐", "晚餐"], customDays: [] });
      go("planForm");
    },
    "plan-rule"(node) { state.planForm = Object.assign({}, state.planForm, { rule: node.dataset.rule }); render(); },
    "plan-perday"(node) { state.planForm = Object.assign({}, state.planForm, { perDay: node.dataset.per }); render(); },
    "plan-meal"(node) {
      const meals = (state.planForm.meals || ["午餐", "晚餐"]).slice();
      const index = meals.indexOf(node.dataset.meal);
      if (index >= 0) meals.splice(index, 1);
      else meals.push(node.dataset.meal);
      state.planForm = Object.assign({}, state.planForm, { meals });
      render();
    },
    "plan-time"() {
      timeSheet("选择配送时间", (state.planForm || {}).lunchTime, "plan-time-pick");
    },
    "plan-time-pick"(node) {
      state.planForm = Object.assign({}, state.planForm, {
        lunchTime: node.dataset.value, dinnerTime: node.dataset.value,
      });
      closeLayer();
      render();
    },
    "plan-meal-time"(node) {
      state.pendingMealKey = node.dataset.meal === "午餐" ? "lunchTime" : "dinnerTime";
      timeSheet("选择配送时间", state.planForm[state.pendingMealKey], "plan-meal-time-pick");
    },
    "plan-meal-time-pick"(node) {
      const key = state.pendingMealKey || "lunchTime";
      state.planForm = Object.assign({}, state.planForm, { [key]: node.dataset.value });
      closeLayer();
      render();
    },
    "plan-day"(node) {
      const days = (state.planForm.customDays || []).slice();
      const index = days.indexOf(node.dataset.day);
      if (index >= 0) days.splice(index, 1);
      else days.push(node.dataset.day);
      state.planForm = Object.assign({}, state.planForm, { customDays: days });
      node.classList.toggle("active");
    },
    "plan-save"() {
      const nameInput = $("#plan-name");
      const name = (nameInput && nameInput.value.trim()) || "";
      if (!name) { toast("请填写配送计划名称"); return; }
      const exists = state.plans.some((p) => p.name === name &&
        p.id !== state.editingPlanId);
      if (exists) { toast("配送计划名称已存在"); return; }
      const form = state.planForm || {};
      if (state.editingPlanId) {
        const plan = state.plans.find((p) => p.id === state.editingPlanId);
        Object.assign(plan, { name, rule: form.rule || plan.rule, meals: form.meals || plan.meals });
      } else {
        state.plans.push({
          id: "pl" + (state.plans.length + 1), name,
          rule: form.rule || "工作日配送", meals: form.meals || ["午餐", "晚餐"],
          time: "12:00 前送达", left: 0, active: false, tab: form.taboo, allergy: form.allergy, note: form.note,
        });
      }
      save(); toast("保存成功");
      state.stack = state.stack.filter((r) => r !== "planForm");
      go("plans", { replace: true });
    },
    "plan-del"() {
      confirmModal("删除配送计划？", "删除后正在使用该计划的订单需要重新绑定。", "确认删除", () => {
        state.plans = state.plans.filter((p) => p.id !== state.editingPlanId);
        save(); toast("删除成功"); go("plans", { replace: true });
      });
    },

    /* 我的 */
    "profile-quick"(node) {
      const key = node.dataset.key;
      const routes = {
        weight: "weight", addresses: "addresses", health: "health",
        favorites: "favorites", metabolism: "metabolism", survey: "survey",
      };
      if (key === "coupon") { toast("优惠福利功能研发中"); return; }
      if (routes[key]) go(routes[key]);
    },
    "edit-profile"() { go("editProfile"); },
    "profile-save"() {
      const name = $("#ep-name");
      const height = $("#ep-height");
      const weight = $("#ep-weight");
      const start = $("#ep-start");
      if (name && name.value.trim()) state.profile.name = name.value.trim();
      if (height && Number(height.value)) state.profile.height = Number(height.value);
      if (weight && Number(weight.value)) state.profile.weight = Number(weight.value);
      if (start && Number(start.value)) state.profile.startWeight = Number(start.value);
      save(); toast("保存成功"); back();
    },
    service() {
      sheet({ title: "专属客服", body: '<div class="rows">' +
        '<div class="row"><span class="row-main"><span class="row-title">工作时间</span>' +
        '<span class="row-sub">周一到周五 09:00–18:00</span></span></div>' +
        '<div class="row"><span class="row-main"><span class="row-title">客服电话</span>' +
        '<span class="row-sub">13666666666</span></span><button class="btn sm" data-act="call">拨打</button></div>' +
        '<div class="row"><span class="row-main"><span class="row-title">添加客服微信</span>' +
        '<span class="row-sub">hhhhh</span></span><button class="btn sm plain" data-act="copy-wx">复制</button></div>' +
        "</div>" });
    },
    cooperation() { go("cooperation"); },
    "coop-submit"() { toast("合作意向已提交"); back(); },
    survey() { go("survey"); },
    logout() {
      confirmModal("退出登录", "退出后需要重新登录才能继续使用。", "退出", () => {
        go("login", { root: true });
      });
    },
  };

  function shiftMonth(step) {
    const month = state.weightMonth;
    let m = month.m + step;
    let y = month.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    state.weightMonth = { y, m };
    render();
  }

  function shiftStartMonth(step) {
    const month = state.startMonth;
    let m = month.m + step;
    let y = month.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    state.startMonth = { y, m };
    closeLayer();
    startDateSheet();
  }

  /* ============================ 弹窗（全部照抄录屏形态与文案） ============================ */
  const ACTIVITY_LEVELS = [
    ["久坐不动", "几乎不运动，办公室坐着，很少走路"],
    ["轻度活动", "每周轻度运动 1—3 天，平时会走路"],
    ["中度活动", "每周运动 3—5 天，每次 30—60 分钟"],
    ["高度活动", "每周高强度运动 6—7 天，或从事体力活动"],
    ["极高活动", "每天训练 2 次以上，或重体力工作"],
  ];
  const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  /* 54s：录入当天体重（标题 + 大数值 + 数值快选 + 确定） */
  function weightEntrySheet() {
    const current = Number(state.profile.weight) || 47.8;
    const quick = [47.0, 48.0, 49.0];
    sheet({
      title: "录入10月7日体重",
      size: "tall",
      body: '<input id="weight-input" class="visually-hidden" inputmode="decimal" value="' + n1(current) + '">' +
        '<div class="we-value"><b class="num" id="we-value">' + n1(current) + "</b><em>kg</em></div>" +
        '<div class="we-quick">' + quick.map((v, i) =>
          '<button class="' + (i === 1 ? "focus" : "") + '" data-act="we-quick" data-v="' + v + '">' + n1(v) + "</button>").join("") + "</div>" +
        '<div class="weight-pad">' + ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) =>
          '<button data-act="weight-key" data-key="' + k + '">' + k + "</button>").join("") + "</div>",
      footer: '<button class="btn block" data-act="weight-save">确定</button>',
    });
  }

  /* 105s：修改活动水平（5 个等级行 + 确认修改） */
  function activitySheet() {
    sheet({
      title: "修改活动水平",
      size: "tall",
      body: '<p class="sheet-sub">你的活动水平为　' + esc(state.profile.activity) + "</p>" +
        optionList(ACTIVITY_LEVELS.map((l) => l[0]), state.profile.activity, "activity-pick") +
        '<button class="btn ghost block sheet-extra" data-act="activity-tip">活动水平说明</button>',
      footer: '<button class="btn block" data-act="activity-save">确认修改</button>',
    });
  }

  /* 107s：活动水平说明（表格 + 返回） */
  function activityTipSheet() {
    sheet({
      title: "活动水平说明",
      size: "tall",
      stack: true,
      body: '<p class="sheet-sub">根据日常活动和运动频率选择最接近的等级。</p>' +
        '<div class="explain">' + ACTIVITY_LEVELS.map(([name, text]) =>
          '<div class="ex-row"><b>' + name + "</b><span>" + text + "</span></div>").join("") + "</div>",
      footer: '<button class="btn plain block" data-act="sheet-close">返回</button>',
    });
  }

  /* 138s：地区三级选择（取消 / 省·市·区 / 确定） */
  function regionSheet() {
    const data = {
      四川省: ["成都市"], 成都市: ["双流区", "武侯区", "成华区", "龙泉驿区", "新都区", "金牛区"],
    };
    const pick = state.regionPick || { p: "四川省", c: "成都市", d: "" };
    const provinces = ["四川省"];
    const cities = data[pick.p] || [];
    const districts = data[pick.c] || [];
    const column = (title, items, key) =>
      '<div class="region-col"><b>' + title + "</b>" + items.map((item) =>
        '<button class="' + (pick[key] === item ? "on" : "") + '" data-act="region-pick" data-key="' + key +
        '" data-value="' + esc(item) + '">' + esc(item) + "</button>").join("") + "</div>";
    sheet({
      picker: true,
      title: "地区选址",
      size: "tall",
      body: '<div class="region-cols">' +
        column("四川省", provinces, "p") + column("成都市", cities, "c") + column("区县", districts, "d") +
        "</div>",
    });
    return;
  }

  /* 144s：地址标签自定义（输入 + 保存资料） */
  function tagCustomSheet() {
    sheet({
      title: "自定义标签",
      body: '<div class="form-row"><label>标签名称</label><input id="tag-input" placeholder="请输入标签名称" value="123"></div>',
      footer: '<button class="btn block" data-act="tag-save">保存资料</button>',
    });
  }

  /* 222s：确认套餐（卡片列表 + 协议 + 确认套餐并付款） */
  function packageSheet() {
    sheet({
      title: "确认套餐",
      size: "tall",
      picker: false,
      body: '<ul class="plan-picker-list">' + DATA.packages.map((p) =>
        '<li class="picker-card ' + (state.currentPackage === p.id ? "on" : "") +
        '" data-act="pick-package" data-id="' + p.id + '">' +
        '<p class="pc-desc">' + esc(p.desc || "这是哪个位置？我来看看") + "</p>" +
        '<div class="pc-head"><b class="pc-name">' + esc(p.name) + "</b>" +
        '<b class="pk-price num">' + money(p.price) + "</b></div>" +
        '<div class="pc-foot"><span>' + esc(p.meals) + '</span>' +
        '<button class="link" data-act="package-detail">查看详情' + I("chev") + "</button></div></li>").join("") + "</ul>" +
        '<div class="agree-line"><i class="tick on"></i><span>点击确认即表示已阅读并同意《套餐服务规则》和《配送及退改说明》</span></div>',
      footer: '<button class="btn block" data-act="pay-open">确认套餐并付款</button>',
    });
  }

  /* 222s：套餐详情 */
  function packageDetailSheet() {
    const pkg = DATA.packages.find((p) => p.id === state.currentPackage) || DATA.packages[0];
    sheet({
      title: "套餐详情",
      size: "tall",
      stack: true,
      body: '<div class="ad-body"><p>' + esc(pkg.meals) + "</p>" +
        "<p>套餐含 " + esc(pkg.name) + "，可自由选择开始配送日期；套餐固定绑定一个品牌，餐次按天数 × 2 计算。</p>" +
        "<p>当日 17:30 前可修改次日订单，20:00 后不可更改；未核销餐次可退，退款在十五个工作日内处理完毕。</p></div>",
      footer: '<button class="btn block" data-act="sheet-close">我知道了</button>',
    });
  }

  /* 228s：订单支付（二维码支付） */
  function paySheet() {
    const pkg = DATA.packages.find((p) => p.id === state.currentPackage) || DATA.packages[0];
    sheet({
      title: "订单支付",
      body: '<div class="pay-sheet"><div class="pay-amount num">' + money(pkg.price) + "</div>" +
        '<div class="pay-name">' + esc(pkg.name) + "</div>" +
        '<div class="qr-box"><i class="qr"></i><span>二维码支付</span></div>' +
        '<p class="tiny">请使用微信扫一扫完成支付，支付成功后自动绑定配送计划。</p></div>',
      footer: '<button class="btn block" data-act="pay-done">我已完成支付</button>',
    });
  }

  /* 383s：选择配送计划 / 更换配送计划 */
  function planPickerSheet(title) {
    const box = sheet({
      title: title || "选择配送计划",
      size: "tall",
      body: '<div class="plan-picker">' + state.plans.map((p) =>
        '<article class="plan-pick ' + (state.currentOrderPlanId === p.id ? "on" : "") +
        '" data-act="plan-pick" data-id="' + p.id + '">' +
        '<div class="pp-head"><b>' + esc(p.name) + "</b>" +
        (p.active ? '<span class="tag">正在使用</span>' : "") + "</div>" +
        '<div class="pp-row"><span>配送规则</span><b>' + esc(p.rule) + "</b></div>" +
        '<div class="pp-row"><span>收货信息</span><b>136****6666</b></div>' +
        '<p class="pp-addr">四川省成都市双流区四川省成都市双流区华阳街道 2 段</p>' +
        '<div class="pp-row"><span>订购品牌</span><b>' + esc(p.brands || "森林健康、百味、EatTime") + "</b></div>" +
        "</article>").join("") + "</div>",
      footer: '<button class="btn block" data-act="plan-confirm">确认选择</button>' +
        '<button class="btn ghost block plan-new-btn" data-act="plan-new">＋ 新建配送计划</button>',
    });
    return box;
  }

  /* 387s：检测到已有订购 */
  function existingOrderSheet() {
    sheet({
      title: "检测到已有订购",
      size: "tall",
      body: '<div class="exist-block"><div class="eb-head"><i class="pk-logo">' +
        assetImg(brandCover("eattime")) + "</i><b>EatTime．工作日午晚餐计划 123</b></div>" +
        '<p class="tiny">当前订购仍剩余 0 餐</p></div>' +
        '<p class="sheet-sub">请选择本次购买的套餐权益如何使用：</p>' +
        '<div class="exist-options">' +
        '<button class="exist-opt on" data-act="exist-pick" data-value="renew">' +
        '<span class="eo-head"><b>续订当前订购</b><em class="tag">推荐</em></span>' +
        "<small>将新套餐餐次累加到现有订购，继续使用当前配送计划</small>" + I("check") + "</button>" +
        '<button class="exist-opt" data-act="exist-pick" data-value="new">' +
        '<span class="eo-head"><b>开启全新订购</b></span>' +
        "<small>保留原订购，并为本次购买单独建立一条新订购</small>" + I("check") + "</button>" +
        "</div>",
      footer: '<button class="btn plain block" data-act="sheet-close">暂不选择</button>',
    });
  }

  /* 390s：设置开始配送日期 */
  function startDateSheet() {
    const cells = monthGrid(2026, 9);
    sheet({
      title: "设置开始配送日期",
      size: "tall",
      body: '<div class="month-switch"><button data-act="start-prev">' + I("back") + "</button>" +
        "<b>" + state.startMonth.y + "年" + (state.startMonth.m + 1) + "月</b>" +
        '<button data-act="start-next">' + I("chev") + "</button></div>" +
        '<div class="cal-grid pad-top">' +
        ["日", "一", "二", "三", "四", "五", "六"].map((w) => '<span class="wd">' + w + "</span>").join("") +
        monthGrid(state.startMonth.y, state.startMonth.m).map((cell) =>
          '<button class="cal-cell ' + (cell.dim ? "dim" : "") +
          (state.startDate === "2026-" + String(state.startMonth.m + 1).padStart(2, "0") + "-" + String(cell.day).padStart(2, "0") ? " sel" : "") +
          '" data-act="start-pick" data-day="' + cell.day + '"><span>' + cell.day + "</span></button>").join("") +
        "</div>",
      footer: '<button class="btn block" data-act="start-confirm">确定</button>',
    });
  }

  /* 262s：选择暂停时段（日历选起止 + 确认暂停） */
  function pauseRangeSheet() {
    sheet({
      title: "选择暂停时段",
      size: "tall",
      body: '<p class="sheet-sub">请在日历上选择起止日期，暂停期内不再配送。</p>' +
        '<div class="month-switch"><b>2026年10月</b></div>' +
        '<div class="cal-grid pad-top">' +
        ["日", "一", "二", "三", "四", "五", "六"].map((w) => '<span class="wd">' + w + "</span>").join("") +
        monthGrid(2026, 9).map((cell) => {
          const day = cell.day;
          const inRange = day >= 12 && day <= 18 && !cell.dim;
          const edge = day === 12 || day === 18;
          return '<button class="cal-cell ' + (cell.dim ? "dim" : "") +
            (inRange ? " in-range" : "") + (edge ? " edge" : "") +
            '" data-act="pause-pick" data-day="' + day + '"><span>' + day + "</span></button>";
        }).join("") + "</div>" +
        '<p class="range-text">' + esc(pauseRangeText()) + "</p>",
      footer: '<button class="btn block" data-act="pause-confirm">确认暂停</button>',
    });
  }

  /* 265s：客服联系方式 */
  function serviceSheet() {
    sheet({
      title: "退订单",
      body: '<div class="rows">' +
        '<div class="row"><span class="row-main"><span class="row-title">拨打客服电话</span>' +
        '<span class="row-sub">13666666666</span></span><button class="btn sm" data-act="call">拨打</button></div>' +
        '<div class="row"><span class="row-main"><span class="row-title">添加客服微信</span>' +
        '<span class="row-sub">hhhhh</span></span><button class="btn sm plain" data-act="copy-wx">复制</button></div>' +
        "</div>" +
        '<p class="sheet-sub">退订需要客服核对未配送餐次与退款金额，请选择联系方式。</p>',
    });
  }

  /* 289s：森林健康·配送安排 */
  function deliveryAdjustSheet() {
    const adjust = state.deliveryAdjust || { lunch: true, dinner: true, lunchTime: "11:00 前送达", dinnerTime: "12:00 前送达", lunchCount: 1, dinnerCount: 1 };
    const block = (key, label, timeKey, countKey) =>
      '<div class="adjust-block">' +
      '<div class="ab-head"><b>' + label + " " + esc(adjust[timeKey]) + "</b>" +
      '<button class="link" data-act="adjust-toggle" data-key="' + key + '">点击关闭' + label + "</button></div>" +
      '<div class="ab-row"><span>配送地址</span><b>四川省成都市双流区华阳街道 2 段 188 号</b></div>' +
      '<div class="ab-row"><span>配送时间</span><button class="ab-pick" data-act="adjust-time" data-key="' + timeKey + '">' +
      esc(adjust[timeKey]) + I("chev") + "</button></div>" +
      '<div class="ab-row"><span>餐数</span><span class="stepper">' +
      '<button data-act="adjust-step" data-key="' + countKey + '" data-delta="-1">' + I("minus") + "</button>" +
      "<b>" + adjust[countKey] + " 餐</b>" +
      '<button data-act="adjust-step" data-key="' + countKey + '" data-delta="1">' + I("plus") + "</button></span></div>" +
      "</div>";
    sheet({
      title: "森林健康·配送安排",
      size: "tall",
      body: '<p class="sheet-sub">周三 10月14日可关闭午餐或晚餐，并直接修改餐数。</p>' +
        block("lunch", "午餐", "lunchTime", "lunchCount") +
        block("dinner", "晚餐", "dinnerTime", "dinnerCount"),
      footer: '<button class="btn block" data-act="adjust-save">确认修改</button>',
    });
  }

  /* 300s / 327s：选择配送时间 */
  function timeSheet(title, current, actName) {
    sheet({
      picker: true,
      stack: true,
      title: title || "选择配送时间",
      body: optionList(["11:00 前送达", "12:00 前送达"], current, actName || "time-pick"),
    });
  }

  /* 360s：修改配送计划（按统一餐次设置） */
  function unifiedTimeSheet() {
    const box = sheet({
      title: "修改配送计划",
      size: "tall",
      body: '<div class="unified-head"><span>按统一餐次设置：</span>' +
        '<button class="ab-pick" data-act="unified-time">12:00 前送达' + I("chev") + "</button></div>" +
        '<div class="unified-list">' + WEEKDAYS.map((wd) =>
          '<div class="unified-row"><b>' + wd + "</b><span>配送时间　按统一餐次设置：12:00 前送达</span></div>").join("") + "</div>",
      footer: '<button class="btn block" data-act="unified-save">保存修改</button>',
    });
    return box;
  }

  /* 462s：代谢估算结果 */
  function metabolismSheet() {
    const r = state.metabolism || {};
    sheet({
      title: "代谢估算结果",
      body: '<p class="sheet-sub">临时代谢估算结果</p>' +
        '<div class="met-row"><span><small>基础代谢(BMR)</small><b class="num">' + (r.bmr || 1276) + "</b><em>kcal</em></span>" +
        '<span><small>每日消耗(TDEE)</small><b class="num">' + (r.tdee || 2201) + "</b><em>kcal</em></span></div>",
      footer: '<button class="btn plain block" data-act="sheet-close">返回</button>',
    });
  }

  function pauseRangeText() {
    const range = state.pauseRange || [12, 18];
    return "2026-10-" + String(range[0]).padStart(2, "0") + " 至 2026-10-" + String(range[1]).padStart(2, "0");
  }

  /* 实机录屏还原层。所有素材引用由单文件构建器内嵌。 */
  const art = (name, cls = '') => assetImg('assets/' + name + '.png', cls);
  DATA.checkinDays = [9]; state.checkinDays = [9];
  DATA.quote = '啦啦啦啦啦啦~';
  DATA.home.loss = 6.7; DATA.home.bmi = 19.1;
  DATA.home.trendLabels = ['10/4','10/5','10/6','10/7','10/8','10/9','10/10'];
  DATA.quick = [{key:'health',label:'健康档案',icon:'record'},{key:'address',label:'地址管理',icon:'pin'},{key:'tomorrow',label:'次日改单',icon:'calendar'}];
  state.homeWeight = 47.8; state.goalDays = 19; state.menuFailed = true;
  state.weights.splice(1,0,{date:'2026-10-07 17:50',value:47.8,delta:0});
  ASSETS.brand = {eattime:'assets/brand-eattime.png',xixi:'assets/brand-xixi.png',senlin:'assets/brand-senlin.png',baiwei:'assets/brand-baiwei.png',ranka:'assets/article-5.jpg',chuan:'assets/brand-chuan.png'};
  ASSETS.brandByName = {EatTime:ASSETS.brand.eattime,'嘻嘻轻食':ASSETS.brand.xixi,'森林健康':ASSETS.brand.senlin,'百味':ASSETS.brand.baiwei,'白味':ASSETS.brand.baiwei,'燃卡计划':ASSETS.brand.ranka};
  ASSETS.article.a5 = 'assets/article-5.jpg';
  ['assets/article-real-1.png','assets/article-real-2.png','assets/article-real-3.png','assets/article-real-4.png','assets/article-real-5.png'].forEach((src,i)=>ASSETS.article['a'+(i+1)]=src);
  DATA.articles[0].tag='健康2';DATA.articles[1].tag='抗炎';DATA.articles[2].tag='健身2';DATA.articles[3].tag='减脂2';
  DATA.brands[0].tags = ['低GI','控糖','低钠','中式','熟食','川味']; DATA.brands[0].cat.push('熟食','低GI','控糖','低钠');
  DATA.brands[1].tags=['健康','西式']; DATA.brands[2].tags=['健康','西式'];
  DATA.brands[3].tags=['低脂']; DATA.brands[3].price='均价 ¥22～¥40';
  DATA.brands.push({id:'ranka',name:'燃卡计划',desc:'练完这一餐，不用再纠结吃什么',price:'均价 ¥30～¥50',tags:['低脂','西式'],cat:['低脂','西式']},{id:'chuan',name:'川轻记',desc:'川味照旧，油盐降下来',price:'均价 ¥20～¥30',tags:['健康','西式'],cat:['健康','西式']});
  DATA.packages = [{id:'p1',name:'新用户专享',meals:'5餐 · 用于激发你们的购买欲！',price:.01,tag:'这是哪个位置？我来看看'},{id:'p2',name:'一月初章',meals:'45餐 · 没什么好说的（套餐简介）',price:298,tag:'？？？这个标签到底是'},{id:'p3',name:"新用户专享u'﹏'h（10餐）",meals:'10餐 · 用于激发你们的购买欲！',price:.01,tag:'这是哪个位置？我来看看'}];
  DATA.orders[3].pkg="新用户专享u'﹏'h（10餐）";
  DATA.addresses[0].street='华阳街道2';DATA.addresses[0].door='';
  state.addresses[0].street='华阳街道2';state.addresses[0].door='';
  state.plans[0].name='工作日午晚餐计划123';state.plans[0].meals=['晚餐'];state.plans[0].rule='工作日配送';
  state.planForm.perDay='一天两餐';state.favorites=['a1','a3'];
  TABS[1].icon='leaf';TABS[3].icon='record';
  ICONS.logo = '<rect x="1" y="1" width="22" height="22" rx="6" fill="#64a405" stroke="none"/><path d="M5 15c5-9 10-9 14-9-2 2-3 3-4 5-4-2-8 0-10 4Zm1 1c4-1 8 0 11 3" stroke="white" fill="white"/>';
  ICONS.record='<rect x="3.5" y="4" width="17" height="17" rx="3"/><path d="M3.5 8h17M8 13h8M8 16h5M8 4V2h8v2"/>';
  const ROOT_ROUTES = ['home','track','menu','package','profile'];
  Object.keys(SCREENS).forEach(r=>SCREENS[r].noTab=!ROOT_ROUTES.includes(r));
  ROOT_ROUTES.forEach(r=>SCREENS[r].navStyle={bg:'#e5f6b6',ink:'#121212'});
  const oldNav = navMarkup;
  navMarkup = function(){
    const html=oldNav();
    return html.replace(I('logo'),art('nav-logo','nav-real-logo')).replace('<i class="divider"></i>','<i class="divider"></i><i class="capsule-dash"></i><i class="divider"></i>');
  };
  const sectionTitle=(title,icon='record')=>'<h3 class="record-section-title">'+I(icon)+title+'</h3>';
  const field=(label,html)=>'<div class="record-field"><label>'+label+'</label>'+html+'</div>';
  const fixed=(html)=>'<div class="record-fixed">'+html+'</div>';
  const greenBtn=(text,act,extra='')=>'<button class="btn block" data-act="'+act+'" '+extra+'>'+text+'</button>';
  const grayHint=(text)=>'<p class="record-hint">'+I('info')+text+'</p>';
  const brandBlock=(brand)=>'<div class="record-brand">'+assetImg(brandCover(brand))+'<div><b>'+esc(brand)+'</b><p>每餐约500～600Kcl，川味为主，每餐油脂（包括肉类食物内脂肪g重）不超过20g；每周更新菜单，每餐菜品不重样</p></div></div>';
  screen('login',{
    noTab:true,title:false,navStyle:{bg:'#f3fadf',ink:'#121212'},
    render(){return '<div class="login-page"><div class="nav-capsule login-capsule"><i class="dots"><b></b><b></b><b></b></i><i class="divider"></i><i class="capsule-dash"></i><i class="divider"></i><i class="target"></i></div><div class="login-logo">'+art('login-mark')+'</div><button class="btn login-wechat" id="login-wechat">微信一键登录</button><div class="login-agree"><button class="tick" id="login-tick" aria-label="同意协议"></button><span>我已阅读并同意 <button data-act="agreement" data-title="用户协议">《用户协议》</button> 和 <button data-act="agreement" data-title="隐私政策">《隐私政策》</button></span></div></div>';},
    mounted(){let yes=false;$('#login-tick').onclick=()=>{$('#login-tick').classList.toggle('on',yes=!yes);};$('#login-wechat').onclick=()=>yes?go('home',{root:true,tab:'home'}):toast('请先阅读并同意用户协议与隐私政策');}
  });
  metricsStrip=function(){const w=state.homeWeight||47.8;return '<section class="metrics-strip"><button class="ms-cell left" data-act="weight-page"><b class="num">'+n1(54.5-w)+'<em class="loss-arrow">↓</em></b><span>已减重(kg)</span></button><button class="ms-cell center" data-act="weight-page"><svg class="weight-ring" viewBox="0 0 140 140"><defs><linearGradient id="ringGradient" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#f6ec34"/><stop offset=".65" stop-color="#afea14"/><stop offset="1" stop-color="#a4e81a"/></linearGradient></defs><circle cx="70" cy="70" r="55" fill="white" stroke="#e8e9eb" stroke-width="2"/><path d="M27 112A62 62 0 1 1 113 112" stroke="#e8f5d4" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M27 112A62 62 0 1 1 130 55" stroke="url(#ringGradient)" stroke-width="9" fill="none" stroke-linecap="round"/></svg><b class="num">'+n1(w)+'</b><span>体重(kg)</span></button><button class="ms-cell right" data-act="quick" data-key="health"><b class="num">'+n1(w/Math.pow(state.profile.height/100,2))+'</b><span>BMI</span></button></section>';};
  weightChartCard=function(){return '<section class="card weight-chart-card"><div class="chart-pointer"></div><div class="weight-chart"><div class="wc-axis"><span>49kg</span><span>48kg</span><span>47kg</span></div><svg class="wc-svg" viewBox="0 0 308 69" preserveAspectRatio="none"><path d="M0 0H308M0 34H308M0 68H308" stroke="#dedede" stroke-width="1"/><circle cx="154" cy="40" r="2.5" fill="#69a70b"/></svg><div class="wc-labels">'+DATA.home.trendLabels.map(x=>'<span>'+x+'</span>').join('')+'</div></div><div class="weight-foot"><button class="range-button '+(state.weightRange==='week'?'active':'')+'" data-range="week">周</button><button class="range-button '+(state.weightRange==='month'?'active':'')+'" data-range="month">月</button><button class="range-button '+(state.weightRange==='season'?'active':'')+'" data-range="season">季</button><button class="chart-filter" data-act="chart-filter" aria-label="筛选">'+I('filter')+'</button><button class="chart-calendar" data-act="weight-page" aria-label="体重日历">'+I('calendar')+'</button></div><div class="binding left"></div><div class="binding right"></div></section>';};
  ICONS.filter='<path d="M4 4h16l-6.5 7.5V20l-3-1.5v-7z"/>';
  checkinCard=function(checked){return '<section class="card checkin-card"><div class="checkin-top"><b>'+I('calendar')+'已连续打卡 <em>'+(checked?2:1)+'</em> 天</b><span class="tiny"><i>本月打卡'+state.checkinDays.length+'天</i><i>累计打卡'+(checked?6:5)+'天</i></span></div><div class="checkin-week">'+DATA.week.map(d=>'<button class="cw-item '+(d.d===10?'today':'')+' '+(state.checkinDays.includes(d.d)?'done':'')+'" data-act="checkin-day" data-day="'+d.d+'"><small>'+d.wd+'</small><span>'+(d.d===10?'今天':d.d)+'</span></button>').join('')+'</div><button class="btn" data-act="checkin">'+(checked?'今日已打卡':'立即打卡')+'</button><button class="checkin-expand" data-act="checkin-calendar" aria-label="展开日历">'+I('chevDown')+'</button></section>';};
  quickCard=function(){return '<section class="card quick-card">'+sectionTitle('快捷入口','service')+'<div class="quick-grid">'+DATA.quick.map(q=>'<button class="quick-item" data-act="quick" data-key="'+q.key+'"><i class="quick-icon">'+I(q.icon)+'</i><span>'+q.label+'</span></button>').join('')+'</div></section>';};
  bannerCard=function(){return '<section class="card banner-card" data-act="notice"><div class="banner-icon">'+I('bell')+'<small>公告</small></div><div class="banner-main"><b>'+DATA.banner.title+'</b><small>'+DATA.banner.date+'</small></div>'+I('chev')+'</section>';};
  SCREENS.home.render=function(){return '<div class="hero"><div class="date">'+I('calendar')+'10月10日 星期六</div><h1>Hi, '+esc(state.profile.name)+'._</h1><div class="quote">“ '+DATA.quote+' ”</div></div><div class="page home-page">'+metricsStrip()+weightChartCard()+checkinCard(state.checkinDays.includes(10))+bannerCard()+quickCard()+'<section class="card article-card">'+sectionTitle('营养资讯','record')+'<button class="article-more" data-act="articles">更多 ›</button>'+DATA.articles.map(articleRow).join('')+'</section><section class="card recorded-intake">'+sectionTitle('今日热量摄入','sun')+'<span class="research-badge">♧ 研发中，敬请期待</span><div class="intake-value">0 <small>kcal / 1333</small><span>剩余可摄入 <em>1333 kcal</em></span></div><div class="intake-progress"></div><button class="record-water" data-act="water">'+I('drop')+'<span>今日饮水<b>'+(state.drinkMl?state.drinkMl/1000:0)+' L</b></span><i>＋</i></button></section><section class="card recorded-diet">'+sectionTitle('今日饮食记录','bowl')+'<span class="research-badge">♧ 研发中，敬请期待</span>'+art('diet-empty')+'<b>暂无饮食记录</b><button data-act="record-diet">＋ 手动添加饮食</button></section></div>';};
  SCREENS.health.navStyle={bg:'#e4f6b6',ink:'#121212'};
  SCREENS.health.render=function(){return '<div class="record-health"><div class="illustrated-heading"><h1>健康档案</h1><p>Health Record</p>'+art('health-illustration')+'</div><section class="card health-base"><h3>个人健康基础信息</h3><p class="record-hint">来源于首次登录时提交的健康资料</p><div class="health-metrics">'+[['年龄',state.profile.age,'岁'],['身高',state.profile.height,'cm'],['体重',n1(state.profile.weight),'kg']].map(x=>'<div><label>'+x[0]+'</label><b>'+x[1]+'<small>'+x[2]+'</small></b></div>').join('')+'</div><button class="health-activity" data-act="activity"><span>活动水平</span><b>'+esc(state.profile.activity)+'</b>'+I('edit')+'</button>'+grayHint('基础资料用于计算BMI与每日营养建议，体重变化请在“体重记录”中持续更新。')+'</section><section class="card health-report"><div class="fold"></div><div class="eng-label">▸ ▸ HEALTH CHECK REPORT</div><h2>健康评估报告</h2><p>BMI处于<span class="green">正常</span>区间，基础资料用于计算每日营养建议。</p><div class="report-grid"><div><label>BMI <em>正常</em></label><b>'+bmi()+'</b><div class="bmi-scale"><i></i><i></i><i></i><i></i></div></div><div><label>基础代谢 <em>kcal</em></label><b>1111</b><div class="met-scale"></div></div></div><div class="report-wide">'+I('sun')+' 建议摄入<b>1333<small>kcal</small></b><svg viewBox="0 0 140 40"><path d="M0 30Q25 40 34 12T60 30T96 12T139 9" fill="none" stroke="#e8be9d"/></svg></div><div class="report-wide water">'+I('drop')+' 建议每日饮水<b>1.5～2 L</b></div><div class="report-tip">本周建议：<p>建议饮水1.5～2 L，建议饮水分时多次记录，特别是在运动前后。</p></div></section></div>';};
  SCREENS.goalQuiz.navStyle={bg:'#f4fad8',ink:'#121212'};
  SCREENS.goalQuiz.render=function(){return '<div class="goal-quiz"><div class="goal-intro"><h1>你的目标是什么？</h1><p>选择一个目标，开启你的健康之旅吧！</p>'+art('goal-header')+'</div><div class="goal-options">'+[['健康饮食','均衡营养，吃出健康好身体','goal-food'],['减重','科学减重，轻盈无负担','goal-scale'],['增肌','增加肌肉，塑造强壮体魄','goal-muscle'],['减脂','减少脂肪，塑造紧致身材','goal-fat']].map((a,i)=>'<button class="goal-option '+(i?'locked':'active')+'" data-act="goal-pick" data-goal="'+a[0]+'">'+art(a[2])+'<span><b>'+a[0]+'</b><p>'+a[1]+'</p>'+(i?'<small>研发中，敬请期待</small>':'')+'</span>'+(i?'<i>♧</i>':'')+'</button>').join('')+'</div>'+fixed(greenBtn('完成并生成计划','goal-done'))+'</div>';};
  SCREENS.track.render=function(){const n=Object.values(state.goalTasks).filter(Boolean).length;return '<div class="record-track"><p class="track-quote">“健康生活从每天的坚持开始”</p><section class="card track-goal"><div class="track-meta">'+I('compass')+'我的目标<span>开始日期2026.09.28</span></div><button class="goal-heading" data-act="goal-edit">'+state.goal+I('edit')+'</button>'+art('goal-tree','goal-tree')+'<div class="goal-stats"><div><b>1<small>天</small></b><span>目标打卡天数</span></div><div><b>'+state.goalDays+'<small>天</small></b><span>健康饮食天数</span></div><div><b>0<small>%</small></b><span>七天达标率</span></div></div></section><section class="card track-met">'+sectionTitle('代谢水平','leaf')+'<div class="met-row"><span><small>BMR 基础代谢</small><b>1111<em>kcal/天</em></b></span><span><small>TDEE 每日消耗</small><b>1333<em>kcal/天</em></b></span></div>'+grayHint('建议每日摄入 <span class="green">1200-1466</span> kcal（TDEE±10%）')+'</section><section class="card quest-card"><div class="eng-label">DAILY QUEST</div><h2>今天的三个小目标</h2><b class="quest-count">'+n+'/3</b><span class="tag">连续 0 天 ｜ 累计 1 天</span><div class="quest-progress">今日进度</div>'+[['drink','饮水','一日多次，够两升','drop'],['sleep','睡眠','睡得足，八小时','moon'],['temper','节制','一日三餐，吃八分饱','leaf']].map((q,i)=>'<div class="quest-row"><i class="q-icon q-'+i+'">'+I(q[3])+'</i><span><b>'+q[1]+'</b><p>'+q[2]+'</p><small>连续0天 ｜ 累计1天</small></span><button class="btn sm" data-act="task" data-key="'+q[0]+'">'+(state.goalTasks[q[0]]?'✓ 已搞定':'搞定')+'</button></div>').join('')+'<button class="quest-calendar" data-act="goal-calendar">'+I('calendar')+'健康打卡计划 ›</button></section></div>';};
  SCREENS.menu.render=function(){let list=DATA.brands.filter(b=>(!state.foodFilter||state.foodFilter==='全部'||b.cat.includes(state.foodFilter))&&(!state.nutriFilter||state.nutriFilter==='全部'||b.cat.includes(state.nutriFilter)));return '<div class="menu-page"><div class="menu-hero"></div><div class="menu-filter-card">'+MENU_FILTERS.map((a,i)=>'<div class="chips menu-filters">'+a.map(x=>'<button class="chip '+(((i?state.nutriFilter:state.foodFilter)||'全部')===x?'active':'')+'" data-act="record-filter" data-group="'+i+'" data-filter="'+x+'">'+x+'</button>').join('')+'</div>').join('')+'</div><div class="brand-list">'+list.map(b=>'<article class="card brand-card" data-act="brand" data-id="'+b.id+'">'+assetImg(brandCover(b.id),'brand-cover')+'<div class="brand-main"><b>'+esc(b.name)+'</b><p>'+esc(b.desc)+'</p><div class="brand-tags">'+b.tags.map((t,i)=>'<span class="tag tag-'+i+'">'+t+'</span>').join('')+'</div><div class="brand-foot"><span class="brand-price">'+esc(b.price).replace('均价','<small>均价</small>')+'</span><button class="btn sm" data-act="buy" data-id="'+b.id+'">购买</button></div></div></article>').join('')+'</div><div class="list-end">没有更多了</div></div>';};
  SCREENS.brandDetail.render=function(){const d=DATA.brandDetail;return '<div class="record-brand-detail"><div class="brand-hero">'+art('brand-hero')+'</div><section class="brand-description"><h1>燃卡计划 <span class="tag">精选品牌</span></h1><p>练完这一餐，不用再纠结吃什么</p><div class="brand-tags"><span class="tag">低脂</span><span class="tag">西式</span><b>均价 ¥30～¥50/餐</b></div>'+d.paras.map((p,i)=>'<p class="brand-paragraph">'+p+'</p>'+(i===1?art('brand-gallery'):i===0?assetImg('assets/article-5.jpg'):'')).join('')+'</section>'+fixed(greenBtn('购买品牌套餐','buy'))+'</div>';};
  SCREENS.orders.render=function(){const tabs=['全部','进行中','待使用','待付款','已完成','取消退款'];const list=state.orderTab==='全部'?DATA.orders:DATA.orders.filter(o=>state.orderTab==='取消退款'?o.status==='已取消':o.status===state.orderTab);return '<div class="page orders-page"><div class="order-tabs">'+tabs.map(t=>'<button class="'+(state.orderTab===t?'active':'')+'" data-act="order-tab" data-tab="'+t+'">'+t+(t==='进行中'?'<i>18</i>':t==='待使用'?'<i>9</i>':t==='待付款'?'<i>1</i>':'')+'</button>').join('')+'</div><div class="order-list">'+list.map(orderCard).join('')+'</div><div class="list-end">没有更多了</div></div>';};
  const oldOrderCard=orderCard;
  orderCard=function(o){let html=oldOrderCard(o);html=html.replace('<div class="oc-head">','<div class="oc-head">').replace('<div class="oc-row">','<div class="oc-inner"><div class="oc-row">').replace('<div class="oc-btns">','</div><div class="oc-btns">');html=html.replace('<div class="oc-meals">','<div class="oc-meals">'+I('meal')).replace('<div class="oc-time">','<div class="oc-time">'+I('clock'));if(o.status==='待使用')html=html.replace(/<button class="oc-btn" data-act="order-cancel"[^>]*>取消订单<\/button>/,'');return html;};
  SCREENS.orderDetail.render=function(){const o=DATA.orders.find(x=>x.id===state.orderDetailId)||DATA.orders[3];return '<div class="page order-detail"><section class="card">'+sectionTitle('订单信息')+brandBlock(o.brand)+'<div class="od-info"><span>订购时间：2026-10-08</span><span>订单号：'+esc(o.id)+'</span></div><div class="od-start"><span>开始配送</span><b>'+esc(state.startDate==='2026-10-12'?'2026-10-10':state.startDate)+'</b></div><div class="od-stats"><span><small>已用餐数</small><b>2</b></span><span><small>剩余餐数</small><b>8</b></span><span><small>到期时间</small><b>2026-10-21</b></span></div><button class="detail-toggle" data-act="detail-more">点击显示 ⌄</button></section><section class="card">'+sectionTitle('配送计划','record')+'<button class="od-change" data-act="change-plan">调整配送计划</button><div class="od-plan"><b>'+esc((state.plans.find(p=>p.id===state.currentOrderPlanId)||state.plans[0]).name)+'</b><span>工作日配送</span><p>四川省成都市双流区华阳街道2</p></div></section><section class="card">'+sectionTitle('本周订单','calendar')+'<div class="od-week">‹　10.5 · 10.11　›</div><div class="od-days">'+['周一','周二','周三','周四','周五','周六','周日'].map((w,i)=>'<button class="od-day" data-act="day-order" data-day="'+(5+i)+'"><small>'+w+'</small><b>10月'+(5+i)+'日</b><em>'+(i===4||i===5?'1餐':'-')+'</em><span class="'+(i===4||i===5?'delivered':'')+'">'+(i===4||i===5?'已送达':'无配送计划')+'</span></button>').join('')+'</div><button class="od-menu" data-act="weekly-menu">'+I('record')+'<span>查看本周菜单<small>查看营养美味的本周菜单图片</small></span>'+I('chev')+'</button></section><section class="card od-actions"><button data-act="order-renew">'+I('clock')+'续费订购</button><button data-act="order-pause">'+I('calendar')+'暂停订购</button><button data-act="order-refund">'+I('exit')+'退订订购</button></section></div>';};
  function pkgNav(current){return '<div class="pkg-tabs">'+[['已购套餐','package'],['配送日历','deliveryCalendar'],['配送计划','plans']].map(a=>'<button class="'+(current===a[1]?'active':'')+'" data-act="record-route" data-route="'+a[1]+'">'+a[0]+'</button>').join('')+'</div>';}
  SCREENS.package.render=function(){return '<div class="record-package">'+pkgNav('package')+'<div class="page"><div class="package-title">'+I('record')+'已订购 <button data-act="plans">订购明细</button></div>'+DATA.brands.slice(0,4).map(b=>'<section class="card subscription-brand">'+brandBlock(b.name)+'<button class="brand-order-entry" data-act="order-detail" data-id="'+DATA.orders[3].id+'">次日订购 ›</button>'+state.plans.slice(0,2).map(p=>'<button class="subscription-row" data-act="order-detail" data-id="'+DATA.orders[3].id+'"><span>'+esc(p.name)+'</span><small>剩余 8 餐 ›</small></button>').join('')+'</section>').join('')+'<button class="btn block package-tomorrow" data-act="tomorrow">次日订单</button></div></div>';};
  screen('deliveryCalendar',{title:'渡鸦管家',logo:true,noTab:false,navLeft:SCREENS.package.navLeft,navStyle:SCREENS.package.navStyle,render(){return '<div class="record-package">'+pkgNav('deliveryCalendar')+'<div class="page"><section class="card">'+sectionTitle('配送日历','calendar')+'<div class="month-switch"><button data-act="delivery-prev">‹</button><b>'+state.weightMonth.y+'年'+(state.weightMonth.m+1)+'月</b><button data-act="delivery-next">›</button></div><div class="cal-grid">'+['日','一','二','三','四','五','六'].map(w=>'<span class="wd">'+w+'</span>').join('')+monthGrid(state.weightMonth.y,state.weightMonth.m).map(d=>'<button class="cal-cell '+(d.dim?'dim':'')+' '+(d.day===10?'sel':'')+'" data-act="delivery-day" data-day="'+d.day+'">'+d.day+(!d.dim?'<small>'+((d.day%3)+1)+'餐</small>':'')+'</button>').join('')+'</div></section><section class="card" id="delivery-day-detail">'+sectionTitle('10月'+(state.deliveryDay||10)+'日配送')+brandBlock('EatTime')+'<p>午餐1餐　11:00前送达</p><p>晚餐1餐　12:00前送达</p></section></div></div>';}});
  SCREENS.plans.noTab=false;SCREENS.plans.title='渡鸦管家';SCREENS.plans.logo=true;SCREENS.plans.navLeft=SCREENS.package.navLeft;SCREENS.plans.navStyle=SCREENS.package.navStyle;
  SCREENS.plans.render=function(){return '<div class="record-package">'+pkgNav('plans')+'<div class="page plans-page"><div class="plans-kicker"><div><b>DELIVERY PLANS</b><strong>我的配送计划</strong></div><button class="btn sm" data-act="plan-new">⊕ 新建计划</button></div>'+state.plans.map(p=>'<section class="card plan-card"><div class="plan-head"><b>'+esc(p.name)+'</b><span class="tag">＋ 正在使用</span></div><p class="tiny">'+esc(p.rule)+'</p>'+DATA.brands.slice(0,p.id==='pl1'?3:5).map((b,i)=>'<button class="subscription-row" data-act="order-detail" data-id="'+DATA.orders[3].id+'">'+assetImg(brandCover(b.id))+'<b>'+b.name+'</b><small>剩余'+(i===2?17:8)+'餐</small></button>').join('')+'<div class="plan-foot"><button class="btn sm ghost" data-act="plan-view" data-id="'+p.id+'">查看详情</button><button class="btn sm ghost" data-act="plan-edit" data-id="'+p.id+'">修改计划</button></div></section>').join('')+'</div></div>';};
  SCREENS.planForm.render=function(){const f=state.planForm;const single=f.perDay==='一天一餐';const meal=(f.meals||['午餐'])[0];return '<div class="page plan-form"><section class="plan-section">'+sectionTitle('基础信息')+field('配送计划名称','<input id="plan-name" data-form="name" placeholder="请填写计划名称" value="'+esc(f.name)+'">')+field('配送地址','<button class="plan-address" data-act="plan-address"><span>'+esc(f.addressText||'四川省成都市双流区华阳街道2')+'<br>李 13666666666</span>'+I('chev')+'</button>')+'</section><section class="plan-section">'+sectionTitle('每次配送时间','calendar')+'<div class="rule-chips">'+['工作日配送','每日配送','自定义配送'].map(r=>'<button class="chip '+(f.rule===r?'active':'')+'" data-act="plan-rule" data-rule="'+r+'">'+r+'</button>').join('')+'</div>'+(f.rule==='自定义配送'?'<div class="plan-days">'+WEEKDAYS.map(d=>'<button class="chip '+((f.customDays||[]).includes(d)?'active':'')+'" data-act="plan-day" data-day="'+d+'">'+d+'</button>').join('')+'</div>':'')+'<div class="record-delivery-options"><div class="rule-chips per-day">'+['一天一餐','一天两餐'].map(p=>'<button class="chip '+(f.perDay===p?'active':'')+'" data-act="plan-perday" data-per="'+p+'">'+p+'</button>').join('')+'</div>'+(single?'<div class="plan-meal-row"><b>选择餐次</b><div class="meal-chips">'+['午餐','晚餐'].map(m=>'<button class="chip '+(meal===m?'active':'')+'" data-act="plan-meal" data-meal="'+m+'">'+m+'</button>').join('')+'</div></div>':'')+'<div class="plan-meal-row"><b>配送时间</b><button class="ab-pick" data-act="plan-meal-time" data-meal="'+(single?meal:'午餐')+'">'+esc(single&&meal==='晚餐'?f.dinnerTime:f.lunchTime)+I('chevDown')+'</button></div></div></section><section class="plan-section">'+sectionTitle('饮食偏好','meal')+field('忌口','<input data-form="taboo" placeholder="如：不吃香菜、少油" value="'+esc(f.taboo||'')+'">')+field('过敏信息','<input data-form="allergy" placeholder="如：坚果、乳制品过敏" value="'+esc(f.allergy||'')+'">')+'</section><section class="plan-section">'+sectionTitle('配送备注')+field('备注','<textarea data-form="note" placeholder="如：不打电话、联系不上放门口">'+esc(f.note||'')+'</textarea>')+'</section>'+fixed(greenBtn(state.editingPlanId?'保存修改':'确认创建配送计划','plan-save'))+'</div>';};
  SCREENS.cooperation.navStyle={bg:'#f2fad9',ink:'#121212'};
  SCREENS.cooperation.render=function(){return '<div class="page cooperation-page"><div class="illustrated-heading"><h1>品牌联名、企业餐配与<br>渠道合作</h1>'+art('cooperation-illustration')+'</div><section class="card">'+field('♙ 姓名','<input id="coop-name" placeholder="请输入姓名" value="Opalite._">')+field('♧ 联系方式','<input id="coop-phone" inputmode="tel" placeholder="请输入手机号">')+field('▱ 合作内容','<textarea id="coop-content" placeholder="请描述品牌联名、企业餐配或渠道合作需求"></textarea>')+'</section>'+fixed(greenBtn('提交合作意向','coop-submit'))+'</div>';};
  SCREENS.metabolism.navStyle={bg:'#f2fad9',ink:'#121212'};
  SCREENS.metabolism.render=function(){const r=state.metabolism||{};return '<div class="page metabolism-page"><div class="illustrated-heading"><h1>代谢计算器</h1>'+art('metabolism-illustration')+'</div>'+grayHint('本工具仅用于临时估算，计算结果不会写入或修改您的体重记录与健康档案。')+'<section class="card">'+field('♙ 性别','<button class="ab-pick" data-act="meta-gender">'+(r.gender||'请选择性别')+I('chevDown')+'</button>')+[['age','年龄','请输入年龄'],['height','身高（cm）','请输入身高'],['weight','体重（kg）','请输入体重']].map(a=>field(a[1],'<button class="ab-pick" data-act="meta-number" data-field="'+a[0]+'">'+(r[a[0]]||a[2])+'</button>')).join('')+field('活动水平 ⓘ','<button class="ab-pick" data-act="meta-activity">'+(r.activity||'请选择活动水平')+I('chevDown')+'</button>')+'</section>'+fixed(greenBtn('计算代谢','meta-calculate'))+'</div>';};
  SCREENS.survey.render=()=>'<div class="record-empty">'+art('survey-illustration')+'<b>敬请期待</b><p>问卷调查功能正在准备中</p></div>';
  const oldWeekly=SCREENS.weeklyMenu.render;
  SCREENS.weeklyMenu.render=()=>state.menuFailed?'<div class="record-empty">'+art('menu-error')+'<b>菜单暂时加载失败</b><button class="btn ghost" data-act="menu-reload">重新加载</button></div>':oldWeekly();
  const oldTomorrow=SCREENS.tomorrow.render;
  SCREENS.tomorrow.render=()=>state.tomorrowEmpty?'<div class="page"><div class="tm-head"><b>2026-10-11 明日配送</b><span>已过今天17:00，不可再修改</span></div><div class="record-empty">'+art('tomorrow-empty')+'<b>明日暂无配送</b></div></div>':oldTomorrow();
  const oldSuccess=SCREENS.orderSuccess.render;
  SCREENS.orderSuccess.navStyle={bg:'#f2f7e9',ink:'#121212'};
  SCREENS.orderSuccess.render=()=>oldSuccess().replace('<i class="sc-icon">'+I('checkCircle')+'</i>',art('order-success')).replace('<div class="os-brand">','<div class="os-brand">');
  const oldAddressEdit=SCREENS.addressEdit.render;
  SCREENS.addressEdit.render=function(){let html=oldAddressEdit();html=html.replace(/<div class="addr-map"[^>]*>[\s\S]*?<\/div>/,'<div class="addr-map" data-act="map-pick">'+art('address-map')+'</div>');return html;};
  const oldProfile=SCREENS.profile.render;
  SCREENS.profile.render=()=>oldProfile().replace(/<i class="avatar">[\s\S]*?<\/i>/,'').replace('Opalite','Opalite._');
  SCREENS.health.logo=false;
  SCREENS.profile.navLeft=SCREENS.home.navLeft;
  SCREENS.profile.render=function(){const quick=[['weight','体重记录','scale'],['health','健康档案','record'],['service','专属客服','headset'],['survey','问卷调查','book'],['addresses','收货地址','pin'],['coupon','优惠福利','gift'],['favorites','我的收藏','heart']];return '<div class="record-profile"><div class="profile-hero"><button class="profile-name" data-act="edit-profile">'+esc(state.profile.name)+'._ '+I('edit')+'</button><p class="profile-id">ID：2026092118996555</p></div><div class="page"><section class="card"><div class="card-head"><h3>我的订单</h3><button class="more" data-act="orders">全部 ›</button></div><div class="order-quick">'+[['全部','record',0],['进行中','clock',18],['待使用','bag',9],['待付款','bag',1]].map(a=>'<button data-act="orders-tab" data-tab="'+a[0]+'"><i>'+I(a[1])+(a[2]?'<em>'+a[2]+'</em>':'')+'</i><span>'+a[0]+'</span></button>').join('')+'</div></section><section class="card"><div class="card-head"><h3>快捷服务</h3></div><div class="profile-grid">'+quick.map(a=>'<button class="quick-item" data-act="'+(a[0]==='service'?'service':'profile-quick')+'" data-key="'+a[0]+'"><i class="quick-icon">'+I(a[2])+'</i><span>'+a[1]+'</span></button>').join('')+'</div></section><section class="card"><div class="card-head"><h3>更多工具</h3></div><button class="row" data-act="cooperation">'+I('heart')+'<span><b>与我合作</b><small>品牌、企业餐配与渠道合作</small></span>'+I('chev')+'</button><button class="row" data-act="profile-quick" data-key="metabolism">'+I('chart')+'<span><b>代谢计算器</b><small>BMR 1111 kcal · TDEE 1333 kcal</small></span>'+I('chev')+'</button><button class="row" data-act="logout">'+I('exit')+'<span><b>退出登录</b></span>'+I('chev')+'</button></section></div></div>';};
  SCREENS.addresses.render=function(){return '<div class="page addresses-page">'+state.addresses.map(a=>'<section class="card addr-card"><div class="addr-head"><span class="tag">'+esc(a.tag)+'</span><button data-act="addr-edit" data-id="'+a.id+'">'+I('edit')+' 编辑</button></div><b>'+esc(a.region+a.street+(a.door||''))+'</b><p>'+esc(a.name)+' · '+esc(a.phone)+'</p><div class="addr-foot"><button data-act="addr-default" data-id="'+a.id+'"><i class="tick '+(a.def?'on':'')+'"></i>'+(a.def?'默认地址':'设为默认')+'</button><button data-act="addr-del" data-id="'+a.id+'">删除</button></div></section>').join('')+fixed(greenBtn('⊕ 新增收货地址','addr-new'))+'</div>';};
  SCREENS.addressEdit.render=function(){const a=state.addressDraft||{};const region=state.regionPick;return '<div class="address-edit"><div class="address-tabs"><button class="'+(state.addressMode!=='region'?'on':'')+'" data-act="address-mode" data-mode="map">地图选址</button><button class="'+(state.addressMode==='region'?'on':'')+'" data-act="address-mode" data-mode="region">地区选址</button></div>'+(state.addressMode==='region'?'':'<button class="addr-map" data-act="map-pick" aria-label="选择地图位置">'+art('address-map')+'</button>')+'<section class="card address-fields">'+(state.addressMode==='region'?'<button class="form-row" data-act="addr-region"><label>所在地区</label><span class="pick empty">'+(region.d?region.p+region.c+region.d:'请选择所在地区')+'</span>'+I('chev')+'</button>':'')+[['street',state.addressMode==='region'?'街道/小区':'地址',state.addressMode==='region'?'请输入街道/小区':'选择收货地址'],['door','门牌号','为配送顺利，请确认门牌号准确'],['name','收货人','请填写收货人姓名'],['phone','手机号','请填写收货人手机号']].map(f=>'<div class="form-row"><label>'+f[1]+'</label><input data-address="'+f[0]+'" placeholder="'+f[2]+'" value="'+esc(a[f[0]]||'')+'"></div>').join('')+'<div class="form-row"><label>地址标签</label><div class="chip-row">'+['家','公司','学校','自定义'].map(t=>'<button class="chip '+((a.tag||'家')===t?'active':'')+'" data-act="addr-tag" data-tag="'+t+'">'+t+'</button>').join('')+'</div></div><div class="address-default"><div><b>设为购物默认地址</b><p>仅快递商品可优先使用该默认地址，秒送/外卖暂不支持</p></div><button class="tick '+(a.def?'on':'')+'" data-act="addr-def-switch"></button></div></section><section class="card addr-recognize"><textarea id="address-paste-text" placeholder="试试粘贴收件人姓名、手机号、收货地址，可快速识别您的收货信息"></textarea><button data-act="addr-paste">粘贴</button><button data-act="addr-recognize">识别</button></section>'+fixed(greenBtn('确认','addr-save'))+'</div>';};
  SCREENS.weight.render=function(){return '<div class="page weight-record-page"><section class="card"><button class="weight-date" data-act="weight-calendar">'+I('calendar')+'2026年10月10日 ⌄</button><div class="weight-current"><input id="record-weight" type="number" step=".1" min="20" max="250" value="'+n1(state.profile.weight)+'"><small>kg</small></div><input class="weight-ruler" type="range" min="20" max="120" step=".1" value="'+state.profile.weight+'" data-act="weight-ruler"><div class="ruler-labels">40.0　　　　　　50.0</div>'+greenBtn('记录体重','record-weight-save')+'</section><section class="card">'+sectionTitle('月度体重列表','clock')+state.weights.map((w,i)=>'<div class="wh-row"><span><b>'+n1(w.value)+' kg</b><small>'+esc(w.date)+'</small></span><em>较上次 '+n1(w.delta)+' kg</em><button data-act="weight-delete" data-index="'+i+'">···</button></div>').join('')+'<button class="link" data-act="weight-add">录入当天体重</button><button class="link" data-act="weight-list">查看全部记录</button></section></div>';};
  weightEntrySheet=function(){const w=state.homeWeight||47.8;sheet({title:'录入10月7日体重',stack:true,body:'<div class="we-value"><input id="weight-input" type="number" step=".1" min="20" max="250" value="'+n1(w)+'"><em>kg</em></div><div class="we-quick">'+[47,48,49].map(v=>'<button data-act="we-quick" data-v="'+v+'">'+n1(v)+'</button>').join('')+'</div><input class="entry-ruler" type="range" min="30" max="100" step=".1" value="'+w+'"><div class="ruler-labels">47.0　　　　　　48.0　　　　　　49.0</div>',footer:greenBtn('确定','weight-save')});};
  function weightCalendarSheet(){const m=state.weightMonth;sheet({title:m.y+'年'+(m.m+1)+'月',size:'weight-calendar-sheet',body:'<div class="month-switch"><button data-act="weight-month" data-step="-1">‹</button><b>'+m.y+'年'+(m.m+1)+'月</b><button data-act="weight-month" data-step="1">›</button></div><div class="cal-grid">'+['日','一','二','三','四','五','六'].map(w=>'<span class="wd">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>'<button class="cal-cell '+(d.dim?'dim':'')+' '+(d.day===(state.weightDay||10)?'sel':'')+'" data-act="cal-pick" data-day="'+d.day+'">'+d.day+(d.day===7?'<small>47.8</small>':'')+'</button>').join('')+'</div><p class="weight-calendar-date">10月'+(state.weightDay||10)+'日</p><div class="calendar-empty">当天暂无体重记录</div>',footer:greenBtn('⊕ 录入当天体重','weight-add')});}
  ACTIONS['weight-calendar']=()=>weightCalendarSheet();
  ACTIONS['cal-pick']=(n)=>{state.weightDay=Number(n.dataset.day);closeLayer();weightCalendarSheet();};
  ACTIONS['weight-month']=(n)=>{const d=new Date(state.weightMonth.y,state.weightMonth.m+Number(n.dataset.step),1);state.weightMonth={y:d.getFullYear(),m:d.getMonth()};closeLayer();weightCalendarSheet();};
  document.addEventListener('input',e=>{if(e.target.matches('.entry-ruler'))$('#weight-input').value=e.target.value;if(e.target.matches('.weight-ruler'))$('#record-weight').value=e.target.value;if(e.target.dataset.address)state.addressDraft[e.target.dataset.address]=e.target.value;});
  ACTIONS['record-weight-save']=()=>{const v=Number($('#record-weight').value);if(v<20||v>250||!v)return toast('请输入20～250kg的有效体重');state.profile.weight=v;state.homeWeight=v;state.weights.unshift({date:'2026-10-10 17:50',value:v,delta:Number((v-state.weights[0].value).toFixed(1))});save();render();toast('体重已记录');};
  ACTIONS['weight-ruler']=()=>{};
  ACTIONS['weight-delete']=(n)=>confirmModal('删除体重记录？','删除后无法恢复。','删除',()=>{state.weights.splice(Number(n.dataset.index),1);save();render();toast('删除成功');});
  const homeWithCalendar=SCREENS.home.render;
  SCREENS.home.render=()=>homeWithCalendar().replace('class="chart-calendar" data-act="weight-page"','class="chart-calendar" data-act="weight-calendar"');
  ACTIONS['goal-pick']=ACTIONS['pick-goal'];
  ACTIONS['addr-new']=()=>{state.editingAddressId=null;state.addressMode='map';state.addressDraft={tag:'家',def:false};go('addressEdit');};
  ACTIONS['addr-edit']=(n)=>{state.editingAddressId=Number(n.dataset.id);state.addressDraft=Object.assign({},state.addresses.find(a=>a.id===state.editingAddressId));state.addressMode='region';go('addressEdit');};
  ACTIONS['address-mode']=(n)=>{state.addressMode=n.dataset.mode;render();};
  ACTIONS['map-pick']=()=>{state.addressDraft=Object.assign({},state.addressDraft,{region:'四川省成都市双流区',street:'华阳街道2'});render();toast('已选择收货位置');};
  const oldAddressTag=ACTIONS['addr-tag'];
  ACTIONS['addr-tag']=(n)=>{state.addressDraft.tag=n.dataset.tag;oldAddressTag(n);};
  const oldTagSave=ACTIONS['tag-save'];
  ACTIONS['tag-save']=()=>{state.addressDraft.tag=($('#tag-input').value||'自定义').trim();oldTagSave();};
  ACTIONS['addr-def-switch']=(n)=>{state.addressDraft.def=!state.addressDraft.def;n.classList.toggle('on',state.addressDraft.def);};
  ACTIONS['addr-paste']=()=>{const el=$('#address-paste-text');el.value='李 13666666666 四川省成都市双流区华阳街道2';toast('已填入演示收货信息');};
  ACTIONS['addr-recognize']=()=>{const t=$('#address-paste-text').value;const phone=t.match(/1\d{10}/);if(!phone)return toast('请粘贴包含姓名、手机号和地址的文字');state.addressDraft=Object.assign({},state.addressDraft,{name:t.split(phone[0])[0].trim(),phone:phone[0],street:t.split(phone[0])[1].trim(),region:''});render();toast('识别成功');};
  ACTIONS['addr-save']=()=>{const a=state.addressDraft;if(!a||!a.name||!a.street||!/^1\d{10}$/.test(a.phone||''))return toast('请填写完整地址、姓名和有效手机号');a.region=a.region||((state.regionPick.d?state.regionPick.p+state.regionPick.c+state.regionPick.d:'')||'四川省成都市双流区');if(a.def)state.addresses.forEach(x=>x.def=false);const existing=state.addresses.find(x=>x.id===state.editingAddressId);if(existing)Object.assign(existing,a);else state.addresses.push(Object.assign({},a,{id:Date.now()}));save();go('addresses',{replace:true});toast('保存成功');};
  state.addressDraft={tag:'家',def:false};
  const oldOrderCancel=ACTIONS['order-cancel'];
  ACTIONS['order-cancel']=(n)=>confirmModal('取消订单','确定取消该订单？','确认取消',()=>{const o=DATA.orders.find(x=>x.id===n.dataset.id);if(o)o.status='已取消';save();render();toast('订单已取消');});
  ACTIONS['order-use']=(n)=>{state.orderFlow='activate';state.activeOrderId=n.dataset.id;planPickerSheet('选择配送计划');};
  ACTIONS['order-renew']=(n)=>{state.orderFlow='renew';state.activeOrderId=n&&n.dataset.id||state.orderDetailId;planPickerSheet('选择配送计划');};
  ACTIONS['change-plan']=()=>{state.orderFlow='change';planPickerSheet('更换配送计划');};
  ACTIONS['plan-confirm']=()=>{closeLayer();if(state.orderFlow==='change'){save();render();return toast('已更换配送计划');}startDateSheet();};
  ACTIONS['start-confirm']=()=>{const o=DATA.orders.find(x=>x.id===state.activeOrderId);if(o)o.status='进行中';save();closeAllLayers();go('orderSuccess');};
  ACTIONS['pause-confirm']=()=>{state.pauseConfirmed=pauseRangeText();save();closeLayer();toast('暂停成功');};
  const oldSave=save;
  save=function(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({profile:state.profile,weights:state.weights,checkinDays:state.checkinDays,goalTasks:state.goalTasks,addresses:state.addresses,plans:state.plans,favorites:state.favorites,goal:state.goal,homeWeight:state.homeWeight,drinkMl:state.drinkMl,deliveryAdjust:state.deliveryAdjust,orders:DATA.orders}));}catch(e){}};
  const oldRestore=restore;
  restore=function(){oldRestore();try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(s.orders)DATA.orders=s.orders;if(s.pauseConfirmed)state.pauseConfirmed=s.pauseConfirmed;}catch(e){}};
  ACTIONS['pay-done']=()=>{const p=DATA.packages.find(p=>p.id===state.currentPackage)||DATA.packages[0];const b=DATA.brands.find(b=>b.id===state.currentBrand)||DATA.brands[0];DATA.orders.unshift({id:'demo'+Date.now(),brand:b.name,pkg:p.name,status:'待使用',price:p.price,remaining:parseInt(p.meals)||5,total:parseInt(p.meals)||5,date:'2026/10/10 12:00'});save();closeAllLayers();state.orderTab='全部';go('orders');toast('支付成功');};
  const oldWeightSave=ACTIONS['weight-save'];
  ACTIONS['weight-save']=()=>{const input=$('#weight-input');const v=Number(input&&input.value);if(!Number.isFinite(v)||v<20||v>250)return toast('请输入20～250kg的有效体重');state.homeWeight=v;oldWeightSave();};
  ACTIONS['record-route']=(n)=>{const r=n.dataset.route;state.tab='package';go(r,{root:true,tab:'package'});};
  ACTIONS['record-filter']=(n)=>{state[n.dataset.group==='0'?'foodFilter':'nutriFilter']=n.dataset.filter;render();};
  ACTIONS['filter']=(n)=>{state.foodFilter=n.dataset.filter;render();};
  ACTIONS['agreement']=(n)=>sheet({title:n.dataset.title,body:'<div class="ad-body"><p>欢迎使用渡鸦管家。服务用于轻食订购、配送计划和健康记录。</p><p>演示页面仅在本机保存您输入的数据。请阅读后自主选择是否同意。</p></div>',footer:greenBtn('我已阅读','sheet-close')});
  ACTIONS['chart-filter']=()=>sheet({title:'体重筛选',body:'<div class="chip-row">'+['全部记录','最近7天','最近30天'].map(x=>'<button class="chip" data-act="chart-filter-pick">'+x+'</button>').join('')});
  ACTIONS['chart-filter-pick']=(n)=>{state.weightRange=n.textContent;closeLayer();toast('已切换为'+n.textContent);};
  ACTIONS['checkin-day']=(n)=>toast('10月'+n.dataset.day+'日'+(state.checkinDays.includes(Number(n.dataset.day))?'已打卡':'尚未打卡'));
  ACTIONS['checkin-calendar']=()=>go('goalCalendar');
  ACTIONS['water-add']=(n)=>{state.drinkMl=(state.drinkMl||0)+Number(n.dataset.ml);closeLayer();save();render();toast('饮水已记录');};
  ACTIONS['record-diet']=()=>toast('研发中，敬请期待');
  ACTIONS['detail-more']=()=>toast('订单已用2餐，剩余8餐');
  ACTIONS['day-order']=(n)=>{state.tomorrowEmpty=false;sheet({title:'10月'+n.dataset.day+'日配送',body:brandBlock('EatTime')+'<p>午餐1餐 · 11:00前送达</p><p>晚餐1餐 · 12:00前送达</p>',footer:greenBtn('查看配送安排','adjust-order')});};
  ACTIONS['delivery-day']=(n)=>{state.deliveryDay=Number(n.dataset.day);render();};
  ACTIONS['delivery-prev']=()=>shiftMonth(-1);ACTIONS['delivery-next']=()=>shiftMonth(1);
  ACTIONS['plan-address']=()=>sheet({title:'选择配送地址',body:state.addresses.map(a=>'<button class="record-address-choice" data-act="plan-address-pick" data-id="'+a.id+'"><b>'+esc(a.region+a.street)+'</b><p>'+esc(a.name)+' '+esc(a.phone)+'</p></button>').join('')});
  ACTIONS['plan-address-pick']=(n)=>{const a=state.addresses.find(x=>String(x.id)===n.dataset.id);state.planForm.addressText=a.region+a.street;closeLayer();render();};
  document.addEventListener('input',e=>{if(e.target.dataset.form)state.planForm[e.target.dataset.form]=e.target.value;});
  ACTIONS['plan-perday']=(n)=>{state.planForm.perDay=n.dataset.per;state.planForm.meals=n.dataset.per==='一天两餐'?['午餐','晚餐']:['午餐'];render();};
  ACTIONS['plan-meal']=(n)=>{state.planForm.meals=state.planForm.perDay==='一天一餐'?[n.dataset.meal]:['午餐','晚餐'];render();};
  const oldPlanSave=ACTIONS['plan-save'];
  ACTIONS['plan-save']=()=>{const f=state.planForm;const name=($('#plan-name').value||'').trim();if(!name)return toast('请填写配送计划名称');if(state.plans.some(p=>p.name===name&&p.id!==state.editingPlanId))return toast('配送计划名称已存在');if(f.rule==='自定义配送'&&!(f.customDays||[]).length)return toast('请选择配送日期');const p=state.plans.find(p=>p.id===state.editingPlanId);const values=Object.assign({},f,{name,time:f.meals.includes('晚餐')?f.dinnerTime:f.lunchTime,taboo:f.taboo||'',addressText:f.addressText||'四川省成都市双流区华阳街道2'});if(p)Object.assign(p,values);else state.plans.push(Object.assign({id:'pl'+Date.now(),left:0,active:false},values));save();go('plans',{replace:true,tab:'package'});toast('保存成功');};
  ACTIONS['meta-activity']=()=>sheet({title:'选择活动水平',body:optionList(ACTIVITY_LEVELS.map(x=>x[0]),(state.metabolism||{}).activity,'meta-activity-pick')});
  ACTIONS['meta-activity-pick']=(n)=>{state.metabolism=Object.assign({},state.metabolism,{activity:n.dataset.value});closeLayer();render();};
  ACTIONS['meta-calculate']=()=>{const r=state.metabolism||{};if(!r.gender||!r.age||!r.height||!r.weight)return toast('请完整填写性别、年龄、身高和体重');const b=Math.round(10*Number(r.weight)+6.25*Number(r.height)-5*Number(r.age)+(r.gender==='男'?5:-161));r.bmr=b;r.tdee=Math.round(b*[1.2,1.375,1.55,1.725,1.9][Math.max(0,ACTIVITY_LEVELS.findIndex(a=>a[0]===r.activity))]);metabolismSheet();};
  const oldCoop=ACTIONS['coop-submit'];
  ACTIONS['coop-submit']=()=>{if(!$('#coop-phone').value.trim()||!$('#coop-content').value.trim())return toast('请填写联系方式和合作内容');if(!/^1\d{10}$/.test($('#coop-phone').value))return toast('请输入正确的手机号');oldCoop();};
  ACTIONS['goal-done']=()=>{state.goal='健康饮食';save();go('track',{replace:true,tab:'track'});};
  // 补齐头像、个人订单、资讯搜索和键盘返回。
  SCREENS.goalCalendar.render=function(){const m=state.goalMonth||{y:2026,m:9};const day=state.goalDay||10;return '<div class="goal-calendar-record"><div class="goal-cal-stats">'+[['连续打卡','0','warm'],['累计打卡','1','green'],['本月参与','0','blue']].map(a=>'<div class="'+a[2]+'"><span>'+a[0]+'</span><b>'+a[1]+'<small>天</small></b></div>').join('')+'</div><div class="goal-month"><button data-act="goal-month" data-step="-1">‹</button><b>'+m.y+'年'+(m.m+1)+'月</b><button data-act="goal-month" data-step="1">›</button></div><div class="cal-grid">'+['日','一','二','三','四','五','六'].map(d=>'<span class="wd">'+d+'</span>').join('')+monthGrid(m.y,m.m).map(d=>'<button class="cal-cell '+(d.dim?'dim':'')+' '+(d.day===day?'selected':'')+'" data-act="goal-day" data-day="'+d.day+'">'+String(d.day).padStart(2,'0')+(d.day===10&&!d.dim?'<small>今天</small>':'')+'</button>').join('')+'</div><div class="goal-legend"><span>🟩 全部完成</span><span>▧ 部分完成</span><span>□ 未打卡</span></div><section class="goal-cal-details"><h3>'+ (m.m+1)+'月'+day+'日打卡详情</h3>'+[['drink','饮水','water'],['sleep','睡眠','moon'],['temper','节制','leaf']].map(a=>'<button data-act="task" data-key="'+a[0]+'"><i>'+I(a[2])+'</i><b>'+a[1]+'</b><span>'+(state.goalTasks[a[0]]?'✓ 已搞定':'未打卡')+'</span></button>').join('')+'</section></div>';};
  ACTIONS['goal-month']=(n)=>{const m=state.goalMonth||{y:2026,m:9};const d=new Date(m.y,m.m+Number(n.dataset.step),1);state.goalMonth={y:d.getFullYear(),m:d.getMonth()};render();};
  ACTIONS['goal-day']=(n)=>{state.goalDay=Number(n.dataset.day);render();};
  SCREENS.planDetail.render=function(){const p=state.plans.find(p=>p.id===state.editingPlanId)||state.plans[0];const days=p.rule==='每日配送'?WEEKDAYS:p.rule==='自定义配送'?(p.customDays||[]):WEEKDAYS.slice(0,5);return '<div class="page plan-detail video-plan-detail"><section class="card pd-head"><div class="pd-title"><b>'+esc(p.name)+'</b>'+(p.active?'<span class="tag">● 正在使用</span>':'')+'</div><p>'+esc(p.rule)+' | '+esc(p.time)+'</p></section><section class="card"><h3>♧ 基本信息</h3><div class="pd-info"><label>配送计划名称</label><p>'+esc(p.name)+'</p></div><div class="pd-info"><label>配送日期规则</label><p>'+esc(p.rule)+' '+(p.meals.length===1?'一天一餐':'一天两餐')+'（'+p.meals.join('、')+'）</p></div><button class="pd-expand" data-act="plan-extra">忌口、过敏信息、备注 '+I('chevDown')+'</button>'+(state.planExtra?'<div class="pd-info"><p>忌口：'+esc(p.taboo||'无')+'</p><p>过敏信息：'+esc(p.allergy||'无')+'</p><p>备注：'+esc(p.note||'无')+'</p></div>':'')+'</section><section class="card"><h3>'+I('truck')+' 配送配置详情</h3>'+days.map(d=>'<div class="pd-day"><b>'+d+'</b><p><label>餐数 / 配送时间</label><span>'+p.meals.length+' 餐 · '+esc(p.time)+'</span></p><p><label>配送地址</label><span>'+esc(p.addressText||'华阳街道2')+'</span></p><p><label>联系人 / 联系电话</label><span>李 · 136****6666</span></p></div>').join('')+'</section>'+fixed('<div class="pd-actions"><button class="btn plain" data-act="plan-del">删除计划</button><button class="btn" data-act="plan-edit" data-id="'+p.id+'">修改配送计划</button></div>')+'</div>';};
  ACTIONS['plan-extra']=()=>{state.planExtra=!state.planExtra;render();};
  ACTIONS.service=()=>sheet({title:'专属客服',size:'service-record',body:'<div class="service-portrait">'+art('service-avatar')+'</div><h3>工作时间：周一到周五09:00～18:00</h3><div class="service-contact">'+I('phone')+'<span>客服电话<small>13666666666</small></span><button data-act="call">拨打</button></div><button class="service-contact" data-act="copy-wx">'+I('message')+'<span>添加客服微信<small>hhhhh</small></span>'+I('chev')+'</button>'});
  ACTIONS['adjust-save']=()=>{save();closeLayer();render();toast('修改成功');};
  // 日历、编辑与详情读取同一份演示数据。
  articleRow=function(a){return '<article class="article-row" data-act="article" data-id="'+a.id+'"><div class="ar-thumb">'+assetImg(ASSETS.article[a.id])+'</div><div class="ar-main"><b>'+esc(a.title)+'</b><span class="tag tint">'+esc(a.tag)+'</span><div class="ar-meta"><span>'+I('user')+esc(a.author)+'</span><span>'+I('clock')+a.ago.replace(/^0/,'')+'</span></div></div></article>';};
  SCREENS.notice.render=()=>'<div class="page notice-detail"><section class="card"><div class="notice-label"><i>'+I('bell')+'</i><span class="tag">公告</span><small>2026-09-30</small></div><h1>新用户活动 | 前一百名免单！！</h1><p>国庆活动开启，快来参与</p></section></div>';
  SCREENS.orderSuccess.render=function(){const p=state.plans.find(p=>p.id===state.currentOrderPlanId)||state.plans[0]||{name:'未选择配送计划',rule:'工作日配送',meals:['晚餐'],time:'12:00前送达'};const pkg=DATA.packages.find(x=>x.id===state.currentPackage)||DATA.packages[0];return '<div class="page video-success"><div class="success-hero">'+art('order-success')+'<b>订购成功</b><p>套餐权益已到账，配送计划已成功绑定</p></div><section class="card">'+sectionTitle('品牌信息','shop')+brandBlock('EatTime')+'</section><section class="card">'+sectionTitle('套餐信息','cube')+'<div class="success-package"><span class="tag">人气推荐</span><b>'+esc(pkg.name)+'</b><p>剩余 '+parseInt(pkg.meals)+' 餐·<small>已使用 0 餐</small></p><strong>¥'+pkg.price.toFixed(2)+'</strong></div></section><section class="card">'+sectionTitle('基本信息','cube')+'<div class="pd-info"><label>配送计划名称</label><p>'+esc(p.name)+'</p></div><div class="pd-info"><label>配送日期规则</label><p>'+esc(p.rule)+' '+(p.meals.length===1?'一天一餐':'一天两餐')+'（'+p.meals.join('、')+'）</p></div></section><section class="card">'+sectionTitle('配送配置详情','truck')+WEEKDAYS.slice(0,5).map(d=>'<div class="pd-day"><b>'+d+'</b><p><label>餐数 / 配送时间</label><span>'+p.meals.length+' 餐 · '+p.time+'</span></p><p><label>配送地址</label><span>华阳街道2</span></p><p><label>联系人 / 联系电话</label><span>李 · 136****6666</span></p></div>').join('')+'</section>'+fixed('<button class="btn plain" data-act="home">返回首页</button><button class="btn" data-act="package">查看我的订购</button>')+'</div>';};
  ICONS.shop='<path d="M3 9v12h18V9M2 4h20l-2 6c-1 2-3 2-4 0-1 2-3 2-4 0-1 2-3 2-4 0-1 2-3 2-4 0L2 4ZM8 21v-7h8v7"/>';
  ICONS.cube='<path d="M3 6 12 2l9 4v12l-9 4-9-4V6ZM3 6l9 5 9-5M12 11v11"/>';
  const noticeRenderOriginal=SCREENS.notice.render;
  SCREENS.notice.render=function(){const n=DATA.notices.find(n=>n.id===state.noticeId);if(!n||n.id==='n1')return noticeRenderOriginal();return noticeRenderOriginal().replace('新用户活动 | 前一百名免单！！',esc(n.title)).replace('国庆活动开启，快来参与',esc(n.desc)).replace('2026-09-30',n.date);};
  ACTIONS['notice-detail']=(n)=>{state.noticeId=n.dataset.id;go('notice');};
  const noticeCenterOriginal=SCREENS.noticeCenter.render;
  SCREENS.noticeCenter.render=function(){let html=noticeCenterOriginal().replace('<span>搜索关键字</span>','<input id="notice-search" placeholder="搜索关键字" value="'+esc(state.noticeSearch||'')+'">');return html;};
  document.addEventListener('input',e=>{if(e.target.id==='notice-search'){state.noticeSearch=e.target.value;$$('.notice-row').forEach(n=>n.hidden=!!e.target.value&&!n.textContent.includes(e.target.value));}});
  const payCompleteOriginal=ACTIONS['pay-done'];
  ACTIONS['pay-done']=()=>{payCompleteOriginal();const o=DATA.orders[0];o.time='2026-10-10 12:00';o.meals=o.total+'餐尚未启用';save();render();};
  const startCompleteOriginal=ACTIONS['start-confirm'];
  ACTIONS['start-confirm']=()=>{const o=DATA.orders.find(o=>o.id===state.activeOrderId);if(o){o.meals='剩余 '+(o.total||5)+' 餐·已使用 0 餐';o.startDate=state.startDate;o.planId=state.currentOrderPlanId;}startCompleteOriginal();};
  ACTIONS['order-again']=(n)=>{const o=DATA.orders.find(o=>o.id===n.dataset.id);const b=o&&DATA.brands.find(b=>b.name===o.brand);state.currentBrand=b?b.id:'eattime';packageSheet();};
  paySheet=function(){openLayer('<div class="video-payment"><button class="payment-close" data-act="sheet-close">✕</button><svg class="pay-icon" viewBox="0 0 42 38"><path d="M21 0C8 0 0 9 0 18c0 8 5 13 10 15l-2 5 9-4c17 2 25-7 25-17C42 7 34 0 21 0Z" fill="#aaa"/><path d="m12 15 5 4 22-13-22 18Z" fill="#fff"/></svg><h2>订单支付</h2><button class="payment-send" data-act="pay-done">发送到手机微信支付</button><button class="payment-qr" data-act="local-qr">二维码支付</button></div>',{center:true});};
  ACTIONS['local-qr']=()=>sheet({title:'二维码支付',stack:true,body:'<div class="local-payment-confirm"><p>微信支付本地演示</p><p>套餐金额：'+money((DATA.packages.find(p=>p.id===state.currentPackage)||DATA.packages[0]).price)+'</p></div>',footer:greenBtn('我已完成支付','pay-done')});
  packageSheet=function(){sheet({title:'确认套餐',size:'video-package',body:'<ul class="plan-picker-list">'+DATA.packages.map(p=>'<li class="picker-card '+(state.currentPackage===p.id?'on':'')+'" data-act="pick-package" data-id="'+p.id+'"><p class="pc-desc">'+esc(p.tag)+'</p><div class="pc-head"><b class="pc-name">'+esc(p.name)+'</b><b class="pk-price">'+money(p.price)+'</b></div><div class="pc-foot"><span>'+esc(p.meals)+'</span><button class="link" data-act="package-detail">查看详情 '+I('chevDown')+'</button></div></li>').join('')+'</ul>',footer:'<div class="agree-line">点击确认即表示已阅读并同意 <button data-act="agreement" data-title="套餐服务规则">《套餐服务规则》</button> 和 <button data-act="agreement" data-title="配送及退改说明">《配送及退改说明》</button></div>'+greenBtn('确认套餐并付款','pay-open')});};
  ASSETS.brand.ranka=ASSETS.article.a5;
  ICONS.user='<rect x="3" y="2" width="18" height="21" rx="5"/><circle cx="12" cy="9" r="3"/><path d="M6 22v-2a6 6 0 0 1 12 0v2"/>';
  ICONS.leaf='<path d="M3 21c1-6 5-7 9-10M6 17C3 7 17 9 20 2c2 11-3 17-10 16"/>';
  ICONS.meal='<path d="M3 13h18c0 6-4 9-9 9s-9-3-9-9Zm4 0L5 9c-1-5 4-6 6-3 1-4 5-4 6-2 5-2 6 3 3 5l-2 4M8 10l7-5M13 13l6-5"/>';
  ICONS.truck='<path d="M2 5h12v12H2M14 9h4l4 5v3h-8M2 8h6M2 11h4"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>';
  ICONS.phone='<path d="M4 3h5l1 5-3 2c2 4 4 6 7 7l2-3 5 1v5C10 23 1 12 4 3Z"/>';
  ICONS.message='<path d="M3 6c7-5 15-2 15 5 0 5-6 8-11 6l-5 2 1-4C0 12 0 9 3 6ZM15 12c6-2 11 4 7 8l1 3-4-1c-4 0-7-3-7-6"/><circle cx="6" cy="10" r=".5"/><circle cx="12" cy="10" r=".5"/>';
  ICONS.water='<path d="M4 5h14l-3 16H7L4 5ZM11 15l5-14h5"/><path d="M6 12q3 4 6 0t5 0l-2 9H7Z" fill="#93dbe4"/>';
  const trackOriginal=SCREENS.track.render;
  SCREENS.track.render=()=>trackOriginal().replace(I('drop'),I('water'));
  const goalsOriginal=SCREENS.goalCalendar.render;
  SCREENS.goalCalendar.render=()=>goalsOriginal().replace(I('water'),I('water'));
  const DELIVERY_COUNTS=[0,13,10,6,7,5,5,5,6,9,10,1,10,9,9,6,6,0,0,7,7,6,4,3,0,0,2,2,2,1,1,0];
  function deliveries(y,m,d){if(y!==2026||m!==9)return [];const count=DELIVERY_COUNTS[d]||0;if(state.pauseConfirmed&&Array.isArray(state.pauseRange)&&d>=state.pauseRange[0]&&d<=state.pauseRange[1])return [];return Array.from({length:count},(_,i)=>({brand:DATA.brands[(i+3)%DATA.brands.length],meal:'晚餐',time:'12:00前',plan:'工作日晚餐计划',status:d<=10?'已送达':'待配送'}));}
  SCREENS.deliveryCalendar.render=function(){const m=state.deliveryMonth;const day=state.deliveryDay||10;const rows=deliveries(m.y,m.m,day);return '<div class="record-package">'+pkgNav('deliveryCalendar')+'<div class="video-delivery-calendar"><div class="month-switch"><button data-act="delivery-prev">‹</button><b>'+m.y+' 年 '+(m.m+1)+' 月</b><button data-act="delivery-next">›</button></div><div class="cal-grid">'+['日','一','二','三','四','五','六'].map(w=>'<span class="wd">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>'<button class="cal-cell '+(d.dim?'dim':'')+' '+(d.day===day?'sel':'')+'" data-act="delivery-day" data-day="'+d.day+'">'+d.day+(deliveries(m.y,m.m,Number(d.day)).length?'<small>'+deliveries(m.y,m.m,Number(d.day)).length+'餐</small>':'')+'</button>').join('')+'</div><div class="delivery-date"><span>'+(m.m+1)+'月'+day+'日</span><span>共'+rows.length+'餐</span></div>'+rows.map(r=>'<button class="delivery-record" data-act="adjust-order">'+assetImg(brandCover(r.brand.id))+'<div><b>'+r.brand.name+'</b><p>'+r.meal+' 1餐 ｜ '+r.time+'</p><small>配送计划：'+r.plan+'</small></div><em>'+r.status+'</em></button>').join('')+(!rows.length?'<div class="record-empty"><b>当日暂无配送</b></div>':'')+'</div></div>';};
  function shiftDelivery(step){const m=state.deliveryMonth;const d=new Date(m.y,m.m+step,1);state.deliveryMonth={y:d.getFullYear(),m:d.getMonth()};state.deliveryDay=1;render();}
  ACTIONS['delivery-prev']=()=>shiftDelivery(-1);ACTIONS['delivery-next']=()=>shiftDelivery(1);
  const brandDetailOriginal=SCREENS.brandDetail.render;
  SCREENS.brandDetail.render=function(){const b=DATA.brands.find(b=>b.id===state.currentBrand);if(!b||b.id==='ranka')return brandDetailOriginal().replace(art('brand-hero'),assetImg(ASSETS.article.a5)).replace(assetImg('assets/article-5.jpg'),assetImg(ASSETS.article.a3));return '<div class="record-brand-detail"><div class="brand-hero">'+assetImg(brandCover(b.id))+'</div><section class="brand-description"><h1>'+esc(b.name)+' <span class="tag">精选品牌</span></h1><p>'+esc(b.desc)+'</p><div class="brand-tags">'+b.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'<b>'+esc(b.price)+'</b></div><p class="brand-paragraph">'+esc(b.desc)+'</p></section>'+fixed(greenBtn('购买品牌套餐','buy'))+'</div>';};
  const dateKey=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  state.goalHistory={};state.deliveryMonth={y:2026,m:9};state.weightDay=7;
  const saveState=save;
  save=function(){saveState();try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');Object.assign(s,{goalHistory:state.goalHistory,pauseConfirmed:state.pauseConfirmed,orderPlans:state.orderPlans||{}});localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch(e){}};
  const restoreState=restore;
  restore=function(){restoreState();try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');state.goalHistory=s.goalHistory||{};state.orderPlans=s.orderPlans||{};}catch(e){}};
  ACTIONS['weight-save']=()=>{const v=Number($('#weight-input').value);if(v<20||v>250||!v)return toast('请输入20～250kg的有效体重');const m=state.weightMonth;const day=dateKey(m.y,m.m,state.weightDay||7);const w=state.weights.find(w=>w.date.startsWith(day));const prev=state.weights[0]?state.weights[0].value:v;if(w){w.value=v;w.delta=Number((v-prev).toFixed(1));}else state.weights.unshift({date:day+' 17:50',value:v,delta:Number((v-prev).toFixed(1))});state.homeWeight=v;state.profile.weight=v;save();closeLayer();render();toast('体重已记录');};
  const weightEntryOriginal=weightEntrySheet;
  weightEntrySheet=function(){weightEntryOriginal();const m=state.weightMonth;const title=$('.sheet:last-child .sheet-head h3');if(title)title.textContent='录入'+(m.m+1)+'月'+(state.weightDay||7)+'日体重';};
  const calendarOriginal=weightCalendarSheet;
  weightCalendarSheet=function(){calendarOriginal();const m=state.weightMonth;const prefix=dateKey(m.y,m.m,state.weightDay||7);const matches=state.weights.filter(w=>w.date.startsWith(prefix));const body=$('.weight-calendar-sheet .calendar-empty');if(body)body.innerHTML=matches.length?matches.map(w=>'<b>'+n1(w.value)+' kg</b><small>'+esc(w.date)+'</small>').join(''):'当天暂无体重记录';const label=$('.weight-calendar-date');if(label)label.textContent=(m.m+1)+'月'+(state.weightDay||7)+'日';$$('.weight-calendar-sheet .cal-cell').forEach(n=>{const d=Number(n.dataset.day);const entry=state.weights.find(w=>w.date.startsWith(dateKey(m.y,m.m,d)));const old=n.querySelector('small');if(old)old.remove();if(entry)n.insertAdjacentHTML('beforeend','<small>'+n1(entry.value)+'</small>');});};
  ACTIONS['record-weight-save']=()=>{const v=Number($('#record-weight').value);if(v<20||v>250||!v)return toast('请输入20～250kg的有效体重');const prev=state.weights[0]?state.weights[0].value:v;state.weights.unshift({date:'2026-10-10 17:50',value:v,delta:Number((v-prev).toFixed(1))});state.homeWeight=v;state.profile.weight=v;save();render();toast('体重已记录');};
  const chartOriginal=weightChartCard;
  weightChartCard=function(){let html=chartOriginal();const range=state.weightRange;const days=range==='month'?30:range==='season'?90:7;const filtered=state.weights.filter(w=>new Date(w.date.slice(0,10))>=new Date(2026,9,11-days));if(state.homeWeight!==47.8||range!=='week'){const values=filtered.slice(0,10).reverse();const points=values.map((w,i)=>[15+i*(275/Math.max(1,values.length-1)),Math.max(3,Math.min(66,68-(w.value-47)*34))]);const path=points.map((p,i)=>(i?'L':'M')+p.join(' ')).join('');html=html.replace('<circle cx="154" cy="40" r="2.5" fill="#69a70b"/>','<path d="'+path+'" fill="none" stroke="#69a70b" stroke-width="1.5"/>'+points.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.5" fill="#69a70b"/>').join(''));if(days!==7)html=html.replace(DATA.home.trendLabels.map(x=>'<span>'+x+'</span>').join(''),values.map(w=>'<span>'+w.date.slice(5,10).replace('-','/')+'</span>').join(''));}return html;};
  ACTIONS['chart-filter-pick']=(n)=>{state.weightRange=n.textContent==='最近7天'?'week':n.textContent==='最近30天'?'month':'season';closeLayer();render();};
  const taskOriginal=ACTIONS.task;
  ACTIONS.task=(n)=>{if(state.route==='goalCalendar'){const m=state.goalMonth||{y:2026,m:9};const key=dateKey(m.y,m.m,state.goalDay||10);const tasks=Object.assign({drink:false,sleep:false,temper:false},key==='2026-10-10'?state.goalTasks:state.goalHistory[key]);tasks[n.dataset.key]=!tasks[n.dataset.key];state.goalHistory[key]=tasks;if(key==='2026-10-10')state.goalTasks=tasks;save();render();}else{taskOriginal(n);state.goalHistory['2026-10-10']=Object.assign({},state.goalTasks);save();}};
  const goalCalendarOriginal=SCREENS.goalCalendar.render;
  SCREENS.goalCalendar.render=function(){const old=state.goalTasks;const m=state.goalMonth||{y:2026,m:9};const key=dateKey(m.y,m.m,state.goalDay||10);state.goalTasks=key==='2026-10-10'?old:(state.goalHistory[key]||{drink:false,sleep:false,temper:false});const html=goalCalendarOriginal();state.goalTasks=old;return html;};
  ACTIONS['plan-edit']=(n)=>{const p=state.plans.find(p=>p.id===n.dataset.id);state.editingPlanId=p?p.id:null;state.planForm=Object.assign({name:'',rule:'工作日配送',perDay:'一天两餐',meals:['午餐','晚餐'],lunchTime:'11:00 前送达',dinnerTime:'12:00 前送达',customDays:[],taboo:'',allergy:'',note:''},p||{});if(p){state.planForm.perDay=p.meals.length===1?'一天一餐':'一天两餐';state.planForm.lunchTime=p.lunchTime||p.time;state.planForm.dinnerTime=p.dinnerTime||p.time;}go('planForm');};
  ACTIONS['sheet-confirm']=()=>{const p=state.regionPick;if(state.route==='addressEdit'&&p.d){state.addressDraft.region=p.p+p.c+p.d;closeLayer();render();}else closeLayer();};
  const addressEditOriginal=ACTIONS['addr-edit'];
  ACTIONS['addr-edit']=(n)=>{addressEditOriginal(n);const a=state.addressDraft;state.regionPick={p:'四川省',c:'成都市',d:(a.region||'').match(/(双流区|武侯区|高新区|锦江区|天府新区)/)?.[0]||'双流区'};render();};
  const planConfirmOriginal=ACTIONS['plan-confirm'];
  ACTIONS['plan-confirm']=()=>{if(!state.plans.length)return toast('请先创建配送计划');state.orderPlans=state.orderPlans||{};state.orderPlans[state.activeOrderId||state.orderDetailId]=state.currentOrderPlanId;planConfirmOriginal();};
  ACTIONS['change-plan']=()=>{state.activeOrderId=state.orderDetailId;state.currentOrderPlanId=(state.orderPlans||{})[state.orderDetailId]||state.plans[0]?.id;state.orderFlow='change';planPickerSheet('更换配送计划');};
  const orderDetailOriginal=SCREENS.orderDetail.render;
  SCREENS.orderDetail.render=function(){if(!state.plans.length){return '<div class="page"><section class="card"><h3>暂未创建配送计划</h3>'+greenBtn('创建配送计划','plan-new')+'</section></div>';}state.currentOrderPlanId=(state.orderPlans||{})[state.orderDetailId]||state.currentOrderPlanId;let html=orderDetailOriginal();if(state.pauseConfirmed)html=html.replace('<div class="od-start">','<p class="record-hint">已暂停：'+esc(state.pauseConfirmed)+'</p><div class="od-start">');return html;};
  ACTIONS['edit-profile']=()=>sheet({title:'编辑资料',body:field('名字','<input id="ep-name" value="'+esc(state.profile.name)+'">'),footer:greenBtn('保存资料','profile-name-save')});
  ACTIONS['profile-name-save']=()=>{const value=$('#ep-name').value.trim();if(!value)return toast('请输入名字');state.profile.name=value.replace(/[._]+$/,'');save();closeLayer();render();toast('保存成功');};
  SCREENS.articles.render=function(){const cat=state.articleCat||'全部';const list=DATA.articles.filter(a=>(cat==='全部'||a.tag.replace(/2$/,'')===cat)&&(!state.articleSearch||a.title.includes(state.articleSearch)));return '<div class="page"><div class="search-bar"><input id="article-search" placeholder="搜索关键字" value="'+esc(state.articleSearch||'')+'"></div><div class="chips article-chips">'+['全部','营养','健康','健身','减脂','抗炎'].map(c=>'<button class="chip '+(cat===c?'active':'')+'" data-act="article-cat" data-cat="'+c+'">'+c+'</button>').join('')+'</div><div class="article-list wide">'+list.map(articleRow).join('')+'</div><div class="list-end">'+(list.length?'没有更多了':'暂无相关资讯')+'</div></div>';};
  document.addEventListener('input',e=>{if(e.target.id==='article-search'){state.articleSearch=e.target.value;const pos=e.target.selectionStart;render();$('#article-search').focus();$('#article-search').setSelectionRange(pos,pos);}});
  ACTIONS['goal-edit']=()=>go('goalQuiz');
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){layers.length?closeLayer():back();}});
  const originalRender=render;
  const recordedMetrics=metricsStrip;
  metricsStrip=function(){return recordedMetrics().replace('<b class="num">'+n1(state.homeWeight||47.8)+'</b>','<b class="num">'+Math.floor(state.homeWeight||47.8)+'<small>.'+n1(state.homeWeight||47.8).split('.')[1]+'</small></b>');};
  ICONS.wallet='<path d="M3 5h14a3 3 0 0 1 3 3v13H6a3 3 0 0 1-3-3V5Zm0 3h17M3 5V3h12a3 3 0 0 1 3 2M16 12h6v6h-6a3 3 0 0 1 0-6Z"/>';
  ICONS.box='<path d="M3 8h18v12H3V8Zm0 0 4-5h10l4 5M6 15h4M6 18h3"/>';
  ICONS.star='<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>';
  ICONS.personScan='<path d="M8 2H5a3 3 0 0 0-3 3v3m14-6h3a3 3 0 0 1 3 3v3M2 16v3a3 3 0 0 0 3 3h3m8 0h3a3 3 0 0 0 3-3v-3"/><circle cx="12" cy="9" r="3" stroke="#6aa700"/><path d="M6 19c0-7 12-7 12 0" stroke="#6aa700"/>';
  ICONS.calc='<rect x="3" y="2" width="18" height="20" rx="5"/><path d="M6 8h4m6-2v4m-2-2h4M6 14l4 4m0-4-4 4m8-3h4m-4 3h4"/>';
  ICONS.handshake='<path d="m12 5 3-2c6-2 10 4 6 8l-6 8c-2 3-4 2-6 0l-5-5C-2 8 3 0 9 3l7 6c2 2-1 5-3 3l-3-3-3 3"/>';
  const preciseProfile=SCREENS.profile.render;
  SCREENS.profile.render=function(){return preciseProfile().replace(I('record')+'<em>',''+I('box')+'<em>').replace(I('clock')+'<em>18',''+I('truck')+'<em>18').replace(I('bag')+'<em>9',I('clock')+'<em>9').replace(I('bag')+'<em>1',I('wallet')+'<em>1').replace('data-key="health"><i class="quick-icon">'+I('record'),'data-key="health"><i class="quick-icon">'+I('personScan')).replace('data-key="favorites"><i class="quick-icon">'+I('heart'),'data-key="favorites"><i class="quick-icon">'+I('star')).replace(I('heart')+'<span><b>与我合作',I('handshake')+'<span><b>与我合作').replace(I('chart')+'<span><b>代谢计算器',I('calc')+'<span><b>代谢计算器');};
  const measuredPackageSheet=packageSheet;
  const profileVectorRender=SCREENS.profile.render;
  SCREENS.profile.render=function(){let html=profileVectorRender();[['record','icon-order-all'],['clock','icon-order-unused'],['wallet','icon-order-pay'],['scale','icon-weight'],['personScan','icon-health'],['headset','icon-headset'],['book','icon-survey'],['pin','icon-address'],['gift','icon-gift'],['star','icon-star'],['handshake','icon-cooperate'],['calc','icon-calc']].forEach(([icon,name])=>html=html.split(I(icon)).join(art(name,'profile-glyph')));return html;};
  packageSheet=function(){measuredPackageSheet();$$('.video-package .pk-price').forEach(n=>n.textContent=n.textContent.replace('.00',''));$$('.video-package .pc-foot>span').forEach(n=>n.innerHTML=esc(n.textContent).replace(/^(\d+餐)/,'<em>$1</em>'));};
  activitySheet=function(){sheet({title:'修改活动水平',size:'activity-video',body:'<p class="sheet-sub">你的活动水平为 <button aria-label="活动水平说明" data-act="activity-tip">ⓘ</button></p>'+optionList(ACTIVITY_LEVELS.map(l=>l[0]),state.profile.activity,'activity-pick'),footer:greenBtn('确认修改','activity-save')});};
  weightCalendarSheet=function(){const m=state.weightMonth,day=state.weightDay||7;const entries=d=>state.weights.filter(w=>w.date.startsWith(dateKey(m.y,m.m,d)));const matches=entries(day);const baseline=matches;sheet({title:m.y+'年'+(m.m+1)+'月',size:'weight-calendar-sheet',body:'<div class="cal-grid">'+['日','一','二','三','四','五','六'].map(w=>'<span class="wd">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>{const entry=entries(d.day)[0];const recorded=entry?entry.value:null;return '<button class="cal-cell '+(d.dim?'dim':'')+' '+(d.day===day?'sel':'')+' '+(m.y===2026&&m.m===9&&d.day===10?'today':'')+'" data-act="cal-pick" data-day="'+d.day+'">'+d.day+(recorded!==null?'<small>'+n1(recorded)+'</small>':'')+'</button>';}).join('')+'</div><div class="weight-calendar-detail"><span class="weight-calendar-date">'+(m.m+1)+'月'+day+'日</span><button data-act="weight-list">查看'+baseline.length+'条记录 ›</button></div><div class="calendar-empty '+(baseline.length?'has-record':'')+'">'+(baseline.length?baseline.map(w=>'<div><b>'+n1(w.value)+' <small>kg</small></b><span><button aria-label="删除体重" data-act="calendar-delete">♧</button><button aria-label="编辑体重" data-act="weight-add">✎</button></span></div>').join(''):'当天暂无体重记录')+'</div>',footer:greenBtn('⊕ 录入当天体重','weight-add')});const h=$('.weight-calendar-sheet .sheet-head h3');h.insertAdjacentHTML('beforebegin','<button class="weight-prev" data-act="weight-month" data-step="-1">‹</button>');h.insertAdjacentHTML('afterend','<button class="weight-next" data-act="weight-month" data-step="1">›</button>');};
  ACTIONS['calendar-delete']=()=>{const prefix=dateKey(state.weightMonth.y,state.weightMonth.m,state.weightDay||7);const i=state.weights.findIndex(w=>w.date.startsWith(prefix));if(i<0)return toast('当天暂无体重记录');state.weights.splice(i,1);state.removedBaseline=true;save();closeLayer();weightCalendarSheet();};
  const measuredWeightCalendar=weightCalendarSheet;
  weightCalendarSheet=function(){measuredWeightCalendar();const del=$('.weight-calendar-sheet [data-act="calendar-delete"]'),edit=$('.weight-calendar-sheet .calendar-empty [data-act="weight-add"]');if(del)del.innerHTML=I('trash');if(edit)edit.innerHTML=I('edit');};
  ACTIONS['order-renew']=(n)=>{state.activeOrderId=n&&n.dataset.id||state.orderDetailId;packageSheet();};
  ACTIONS['detail-more']=()=>packageSheet();
  const orderWordingRender=SCREENS.orderDetail.render;
  SCREENS.orderDetail.render=function(){return orderWordingRender().replace('点击显示 ⌄','点击续费 ›').replace('调整配送计划','更换配送计划').replace('续费订购','续费订单').replace('暂停订购','暂停订单').replace('退订订购','退订订单');};
  ACTIONS['wx-open']=()=>sheet({title:'添加客服微信',stack:true,size:'wechat-contact-sheet',body:'<div class="wechat-contact">'+art('customer-wechat')+'<p>hhhhh·<button data-act="copy-wx">复制</button></p><small>扫描二维码添加客服微信</small></div>'});
  ACTIONS['copy-wx']=()=>{if(navigator.clipboard)navigator.clipboard.writeText('hhhhh').catch(()=>{});toast('客服微信已复制');};
  const serviceOriginal=ACTIONS.service;
  ACTIONS.service=()=>{serviceOriginal();const btn=$('.service-record [data-act="copy-wx"]');if(btn)btn.dataset.act='wx-open';};
  const refundOriginal=serviceSheet;
  serviceSheet=function(){refundOriginal();const btn=$('.sheet [data-act="copy-wx"]');if(btn)btn.dataset.act='wx-open';};
  const initialOrderCounts={};['进行中','待使用','待付款'].forEach(s=>initialOrderCounts[s]=DATA.orders.filter(o=>o.status===s).length);
  const displayedCount=s=>({进行中:18,待使用:9,待付款:1})[s]+DATA.orders.filter(o=>o.status===s).length-initialOrderCounts[s];
  const profileCountRender=SCREENS.profile.render;
  SCREENS.profile.render=function(){return profileCountRender().replace('<em>18</em>','<em>'+displayedCount('进行中')+'</em>').replace('<em>9</em>','<em>'+displayedCount('待使用')+'</em>').replace('<em>1</em>','<em>'+displayedCount('待付款')+'</em>');};
  const orderCountRender=SCREENS.orders.render;
  SCREENS.orders.render=function(){return orderCountRender().replace('<i>18</i>','<i>'+displayedCount('进行中')+'</i>').replace('<i>9</i>','<i>'+displayedCount('待使用')+'</i>').replace('<i>1</i>','<i>'+displayedCount('待付款')+'</i>');};
  render=function(){originalRender();$('#app').dataset.route=state.route;};
  const originalGo=go;
  state.scrollPositions={};
  go=function(route,opts){state.scrollPositions[state.route]=$('#stage').scrollTop;closeAllLayers();originalGo(route,opts);};
  const originalBack=back;
  back=function(){if(layers.length){closeLayer();return;}originalBack();$('#stage').scrollTop=state.scrollPositions[state.route]||0;};

  /* 新图版择食与订购；保留 v2 其余页面。 */
  const SHOP_ROUTES=['menu','brandDetail','package','deliveryCalendar','plans','orderSuccess'];
  const isShopRoute=()=>SHOP_ROUTES.includes(state.route)||(state.route==='orderDetail'&&DATA.orders.some(o=>o.id===state.orderDetailId&&o.newShop))||(state.route==='tomorrow'&&!!state.shopTomorrowBrand);
  const SHOP_BRANDS=[
    {id:'deer',name:'Leapeer 鹿跃森',desc:'轻盈早餐  元气开场',price:'均价 ¥20～¥25',low:20,high:25,cover:'assets/deer.png',hero:'assets/deer-hero.png',color:'#8fbb31',tags:['健康食材','西式冷餐'],cat:['健康食材','西式冷餐'],recommended:true},
    {id:'mint',name:'薄荷晨间',desc:'轻盈早餐  元气开场',price:'均价 ¥25～¥35',low:25,high:35,cover:'assets/mint.png',color:'#f1f0e7',tags:['健康食材','西式冷餐'],cat:['健康食材','西式冷餐']},
    {id:'grain',name:'谷物碗社',desc:'东方谷物  日常均衡',price:'均价 ¥20～¥25',low:20,high:25,cover:'assets/grain.png',color:'#eef2df',tags:['健康食材','西式冷餐'],cat:['营养均衡','健康食材','能量碗','西式冷餐']},
    {id:'noodle',name:'鲜面研究所',desc:'轻盈早餐  元气开场',price:'均价 ¥20～¥30',low:20,high:30,cover:'assets/noodle.png',color:'#f64444',tags:['健康食材','西式冷餐'],cat:['营养均衡','中式热食','健康食材','西式冷餐']}
  ];
  const SHOP_PACKAGES=[
    {id:'trial',name:'试餐套餐',price:19.9,total:2,tag:'轻盈试餐',desc:'适合初次体验',days:2},
    {id:'trial7',name:'7天体验套餐',price:299,total:20,tag:'轻盈体验',desc:'适合首次体验',days:7},
    {id:'trial14',name:'14天进阶套餐',price:549,total:40,tag:'人气推荐',desc:'营养师推荐',days:14},
    {id:'manage28',name:'28天管理套餐',price:999,total:80,tag:'周期管理',desc:'完整管理周期',days:28},
    {id:'lowSalt',name:'低钠轻盈套餐',price:369,total:28,tag:'周期管理',desc:'低钠饮食管理',days:14}
  ].map(p=>({...p,meals:p.total+'餐 · '+p.desc}));
  DATA.brands=SHOP_BRANDS;DATA.packages=SHOP_PACKAGES;
  for(const b of SHOP_BRANDS){ASSETS.brand[b.id]=b.cover;ASSETS.brandByName[b.name]=b.cover;}
  const shopBrand=id=>SHOP_BRANDS.find(b=>b.id===id)||SHOP_BRANDS[0];
  const shopPackage=id=>SHOP_PACKAGES.find(p=>p.id===id)||SHOP_PACKAGES[0];
  const priceText=n=>'¥'+Number(n);
  state.currentBrand='deer';state.currentPackage='trial';state.foodFilter='全部';state.nutriFilter='全部';
  state.checkout=null;state.shopExpanded=null;state.shopMonth={y:2026,m:7};state.shopDay='2026-08-05';
  state.plans=[
    {id:'shop-work',name:'工作日午晚餐计划',rule:'工作日配送',meals:['午餐','晚餐'],perDay:'一天两餐',time:'12:00前送达',lunchTime:'12:00前送达',dinnerTime:'18:00前送达',contact:'张小琴',phone:'13854875454',addressText:'深南大道英龙大厦',active:true,brands:'薄荷晨间、谷物碗社、暖汤小馆',customDays:[]},
    {id:'shop-light',name:'轻盈工作日计划',rule:'工作日配送',meals:['午餐','晚餐'],perDay:'一天两餐',time:'12:00前送达',lunchTime:'12:00前送达',dinnerTime:'18:00前送达',contact:'张小琴',phone:'13854875454',addressText:'深南大道英龙大厦',active:false,brands:'暂无',customDays:[]},
    {id:'shop-weekend',name:'周末家庭配送计划',rule:'自定义配送',customDays:['周六','周日'],meals:['午餐'],perDay:'一天一餐',time:'12:00前送达',lunchTime:'12:00前送达',dinnerTime:'18:00前送达',contact:'张小琴',phone:'13854875454',addressText:'世纪大道100号 3栋502室',active:false,brands:'暂无'}
  ];
  state.currentOrderPlanId=state.plans[0].id;
  const SHOP_SEEDS=[
    {id:'shop-seed-deer-1',brandId:'deer',planId:'shop-work',remaining:6},
    {id:'shop-seed-deer-2',brandId:'deer',planId:'shop-light',remaining:12},
    {id:'shop-seed-mint-1',brandId:'mint',planId:'shop-work',remaining:6}
  ].map(o=>({...o,brand:shopBrand(o.brandId).name,pkg:'7天体验套餐',packageId:'trial7',status:'进行中',newShop:true,seed:true,total:20,used:20-o.remaining,price:299,startDate:'2026-07-31',endDate:'2026-08-27',time:'2026-07-31 09:41',meals:'剩余 '+o.remaining+' 餐'}));
  DATA.orders=[...SHOP_SEEDS,...DATA.orders];
  function localDay(iso){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso||Date.now()));const v={};parts.forEach(p=>v[p.type]=p.value);return {date:v.year+'-'+v.month+'-'+v.day,hour:+v.hour,minute:+v.minute};}
  function addDay(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  function earliest(iso){const d=localDay(iso);return addDay(d.date,d.hour*60+d.minute<1050?1:2);}
  function matches(date,plan){const day=new Date(date+'T00:00:00Z').getUTCDay();if(plan.rule==='工作日配送')return day>0&&day<6;if(plan.rule==='自定义配送')return (plan.customDays||[]).includes(['周日','周一','周二','周三','周四','周五','周六'][day]);return true;}
  function finishDate(start,total,plan){let day=start,left=total;for(let i=0;i<3660;i++,day=addDay(day,1)){if(matches(day,plan))left-=Math.max(1,plan.meals.length);if(left<=0)return day;}return start;}
  const SHOP={earliest,matches,addDay,now:()=>state.shopNow||new Date().toISOString()};
  const shopPlan=()=>state.plans.find(p=>p.id===state.currentOrderPlanId)||state.plans[0];
  const shopOrder=()=>DATA.orders.find(o=>o.id===state.checkout?.orderId)||DATA.orders.find(o=>o.id===state.activeOrderId);
  const shopImg=(src,cls='')=>assetImg(src,cls);
  const shopBtn=(label,act,extra='',cls='')=>'<button class="shop-button '+cls+'" data-act="'+act+'" '+extra+'>'+label+'</button>';
  function statusMarkup(){return '<div class="shop-status"><b>9:41</b><span><svg viewBox="0 0 22 16"><path d="M1 11h3v5H1zm6-4h3v9H7zm6-4h3v13h-3zm6-3h3v16h-3z" fill="currentColor"/></svg><svg viewBox="0 0 22 17"><path d="M1 5Q11-3 21 5M4 9q7-6 14 0M8 13q3-3 6 0" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="11" cy="16" r="1.3" fill="currentColor"/></svg><svg viewBox="0 0 28 15"><rect x="1" y="1" width="23" height="13" rx="3" stroke="currentColor" fill="none"/><rect x="3" y="3" width="19" height="9" rx="1" fill="currentColor"/><path d="M26 5v5" stroke="currentColor" stroke-width="2"/></svg></span></div>';}
  const beforeShopNav=navMarkup;
  navMarkup=function(){if(!isShopRoute())return beforeShopNav();const root=['menu','package','plans','deliveryCalendar'].includes(state.route);return (root?'<button class="nav-goal" data-act="goal-chip">健康饮食⌄</button><div class="shop-app-logo"><i>LOGO</i><b>渡鸦管家</b></div>':'<button class="nav-back" data-act="back" aria-label="返回">'+I('back')+'</button>'+(state.route==='orderSuccess'?'<span class="shop-nav-heading">订购结果</span>':''))+'<div class="nav-capsule"><i class="dots"><b></b><b></b><b></b></i><i class="divider"></i><i class="target"></i></div>';};
  const beforeShopRender=render;
  render=function(){beforeShopRender();const active=isShopRoute()||!!state.shopFormReturn&&state.route==='planForm';$('#app').classList.toggle('shop-screen',active);$('#app').classList.toggle('shop-detail-screen',state.route==='brandDetail');$('.shop-status')?.remove();if(active)$('#app').insertAdjacentHTML('afterbegin',statusMarkup());if(active){$$('#tab-bar [data-tab="package"]>span:last-child').forEach(n=>n.textContent='订单');$$('#tab-bar [data-tab="package"] .tab-icon').forEach(n=>n.innerHTML=I('box'));} };
  const oldSaveShop=save;
  save=function(){oldSaveShop();try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');data.checkout=state.checkout?{...state.checkout,pin:''}:null;data.shopVersion=3;data.shopMonth=state.shopMonth;data.shopDay=state.shopDay;data.orders=DATA.orders;localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){}};
  const oldRestoreShop=restore;
  restore=function(){oldRestoreShop();try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(data.shopVersion===3){state.checkout=data.checkout;state.shopMonth=data.shopMonth||state.shopMonth;state.shopDay=data.shopDay||state.shopDay;if(state.checkout){state.checkout.pin='';state.currentBrand=state.checkout.brandId;state.currentPackage=state.checkout.packageId;state.currentOrderPlanId=state.checkout.planId||state.currentOrderPlanId;}}}catch(e){}};
  const brandTags=b=>'<div class="shop-tags">'+b.tags.map((t,i)=>'<span class="shop-tag tag-'+i+'">'+esc(t)+'</span>').join('')+'</div>';
  SCREENS.menu.render=function(){const brands=SHOP_BRANDS.filter(b=>(state.foodFilter==='全部'||b.cat.includes(state.foodFilter))&&(state.nutriFilter==='全部'||b.cat.includes(state.nutriFilter)));return '<div class="shop-menu"><p class="shop-quote">"好好吃饭，是照顾身体最温柔也最坚定的方式。"</p><section class="shop-filters">'+[['全部','中式热食','西式冷餐','能量碗'],['全部','健康食材','营养均衡']].map((items,i)=>'<div>'+items.map(x=>'<button class="'+((i?state.nutriFilter:state.foodFilter)===x?'selected':'')+'" data-act="v3-filter" data-group="'+i+'" data-value="'+x+'">'+x+'</button>').join('')+'</div>').join('')+'</section><div class="shop-brand-list">'+brands.map(b=>'<article class="shop-brand-card" data-act="v3-brand" data-id="'+b.id+'">'+(b.recommended?'<span class="shop-recommend">推荐</span>':'')+shopImg(b.cover,'shop-brand-image')+'<div class="shop-brand-main"><h2>'+esc(b.name)+'</h2><p>'+esc(b.desc)+'</p>'+brandTags(b)+'<div class="shop-brand-bottom"><span>均价 <b>¥'+b.low+' ～¥'+b.high+'</b></span>'+shopBtn('购买','v3-buy','data-id="'+b.id+'"')+'</div></div></article>').join('')+(!brands.length?'<p class="shop-empty">暂无符合条件的品牌</p>':'')+'</div></div>';};
  const intro='关注日常饮食的长期可持续性。从原料筛选、当日备餐到配送交付，每一个环节都建立清晰标准；在控制油盐的同时保留食材本味，让一份轻食既适合阶段管理，也能自然融入忙碌工作日。';
  SCREENS.brandDetail.render=function(){const b=shopBrand(state.currentBrand);return '<div class="shop-brand-detail"><div class="shop-brand-hero" style="background:'+b.color+'">'+shopImg(b.hero||b.cover,b.hero?'shop-hero-wide':'shop-hero-logo')+'</div><section class="shop-brand-summary"><h1><span class="shop-brand-title">'+esc(b.name)+'</span><span class="shop-featured">精选品牌</span></h1><p>'+esc(b.desc)+'</p><div>'+brandTags(b)+'<span class="shop-detail-price">均价 <b>¥'+b.low+' - ¥'+b.high+'</b>/餐</span></div></section><section class="shop-story"><h3>品牌介绍</h3><p>'+esc(b.name.replace('Leapeer ',''))+intro+'</p>'+shopImg('assets/shop-salad.png','shop-story-photo')+'<small>每日餐食根据时令供应和营养结构灵活组合</small><blockquote>认真准备一餐，不只是计算热量，更是在安排一天的能量与状态。</blockquote><h3>食材与制作</h3><p>'+esc(b.name.replace('Leapeer ',''))+intro+'</p><p>'+esc(b.name.replace('Leapeer ',''))+intro+'</p></section><div class="shop-fixed">'+shopBtn('购买品牌套餐','v3-buy')+'</div></div>';};
  function shopSheet(title,body,footer,cls='',stack=false){const box=sheet({title,size:'shop-sheet '+cls,body,footer,stack});box.classList.add('shop-mask');box.classList.remove('with-tabbar');return box;}
  function checkoutStart(brandId){const b=shopBrand(brandId||state.currentBrand);state.currentBrand=b.id;if(state.checkout?.paid&&shopOrder()?.status==='待使用'&&state.checkout.brandId===b.id){openShopPlans();return;}state.currentPackage=SHOP_PACKAGES.some(p=>p.id===state.currentPackage)?state.currentPackage:'trial';state.checkout={token:'purchase-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),brandId:b.id,packageId:state.currentPackage,paid:false,pin:'',date:'',planId:null};openShopPackages();}
  function openShopPackages(){const c=state.checkout;if(!c)return;state.shopStep='package';shopSheet('确认套餐','<div class="shop-packages">'+SHOP_PACKAGES.map(p=>'<article class="shop-package '+(c.packageId===p.id?'selected':'')+'" data-act="v3-package" data-id="'+p.id+'"><span class="shop-package-tag">'+p.tag+'</span><div class="shop-package-head"><b>'+p.name+'</b><strong><small>¥</small>'+p.price+'</strong></div><div class="shop-package-foot"><span><b>'+p.total+'餐</b> · '+p.desc+'</span><button data-act="v3-package-more" data-id="'+p.id+'">查看详情 <i>'+(state.shopExpanded===p.id?'⌃':'⌄')+'</i></button></div>'+(state.shopExpanded===p.id?'<div class="shop-package-detail"><p>以一周为周期建立规律饮食节奏，灵活安排工作日用餐。</p><div><span>✓每日营养搭配</span><span>✓配送日前可调整</span><span>✓订单进度追踪</span><span>✓'+p.days+'天轻盈管理</span></div></div>':'')+'</article>').join('')+'</div>',shopBtn('确认套餐','v3-package-confirm'),'shop-package-sheet');}
  function openShopPay(){state.checkout.pin='';state.shopStep='pay';shopSheet('请输入支付密码','<p class="shop-payment-label">支付金额</p><strong class="shop-pay-amount">'+priceText(shopPackage(state.checkout.packageId).price)+'</strong><div class="shop-pin">'+Array.from({length:6},(_,i)=>'<span class="'+(i===0?'focused':'')+'"></span>').join('')+'</div><div class="shop-keypad">'+['1','2','3','4','5','6','7','8','9','','0','delete'].map(k=>'<button '+(!k?'disabled':'data-act="v3-digit" data-key="'+k+'"')+' aria-label="'+(k==='delete'?'删除':k)+'">'+(k==='delete'?'⌫':k)+'</button>').join('')+'</div>','','shop-payment-sheet');}
  function paid(){const c=state.checkout;if(!c||c.paid)return;c.pin='';c.paid=true;const existing=DATA.orders.find(o=>o.checkoutToken===c.token);const pkg=shopPackage(c.packageId),brand=shopBrand(c.brandId);const order=existing||{id:c.token,checkoutToken:c.token,newShop:true,brandId:brand.id,brand:brand.name,packageId:pkg.id,pkg:pkg.name,price:pkg.price,total:pkg.total,remaining:pkg.total,used:0,status:'待使用',time:localDay(SHOP.now()).date+' 09:41',meals:pkg.total+'餐尚未启用'};if(!existing)DATA.orders.unshift(order);c.orderId=order.id;state.activeOrderId=order.id;state.orderFlow='activate';save();openShopPlans();}
  function plansCard(p,picker=false){const bound=DATA.orders.filter(o=>o.newShop&&o.planId===p.id&&o.status==='进行中');const active=p.active||bound.length;return '<article class="shop-plan '+(!active?'unused':'')+'"><div class="shop-plan-head"><b>'+esc(p.name)+'</b><span class="shop-plan-state">● '+(active?'正在使用':'未使用')+'</span></div><p class="shop-plan-rule">'+esc(p.rule)+'　|　'+esc(p.time||p.lunchTime)+'</p>'+(picker?'<dl><div><dt>联系人</dt><dd class="green">'+esc(p.contact||'张小琴')+'</dd></div><div><dt>联系电话</dt><dd class="green">'+esc(p.phone||'13854875454')+'</dd></div><div><dt>配送地址</dt><dd>'+esc(p.addressText||'')+'</dd></div><div><dt>订购品牌</dt><dd>'+esc(bound.length?[...new Set(bound.map(o=>o.brand))].join('、'):'暂无')+'</dd></div></dl>':bound.map(o=>'<button class="shop-bound-brand" data-act="v3-brand" data-id="'+o.brandId+'">'+shopImg(shopBrand(o.brandId).cover)+'<b>'+esc(o.brand)+'</b><span>剩余 <em>'+o.remaining+'</em> 餐</span></button>').join(''))+'<div class="shop-plan-buttons">'+(!active&&!picker?'<button aria-label="删除计划" class="shop-delete" data-act="v3-plan-delete" data-id="'+p.id+'">'+I('trash')+'</button>':'')+(picker?shopBtn('修改配送计划','v3-plan-edit','data-id="'+p.id+'"','outline')+shopBtn('确认选择','v3-plan-confirm','data-id="'+p.id+'"'):shopBtn('查看详情','plan-detail','data-id="'+p.id+'"','outline')+shopBtn('修改计划','v3-plan-edit','data-id="'+p.id+'"','pale'))+'</div></article>';}
  function openShopPlans(){const c=state.checkout;if(!c?.paid&&!state.shopChangingOrder)return;state.shopStep='plans';shopSheet(state.shopChangingOrder?'更换配送计划':'选择配送计划','<div class="shop-plan-picker">'+state.plans.map(p=>plansCard(p,true)).join('')+(!state.plans.length?'<p class="shop-empty">暂无配送计划，请先新建</p>':'')+'</div>',shopBtn('新建配送计划','v3-plan-new'),'shop-plan-sheet');}
  function openShopStart(){const c=state.checkout,p=shopPlan();if(!c||!p)return;state.shopStep='start';shopSheet('设置开始配送日期','<div class="shop-checkout-summary"><b>'+esc(p.name)+'</b><p>'+esc(shopBrand(c.brandId).name)+' · '+esc(shopPackage(c.packageId).name)+' · '+esc(p.addressText||'')+'</p></div><h4>开始配送日期</h4><button class="shop-date-field" data-act="v3-date-open"><span>'+(c.date||'选择日配送日期')+'</span>'+I('calendar')+'</button><p class="shop-cutoff">'+I('info')+'<span>当天17:30前完成设置，最早可从明天开始配送;17:30 后则最早从后天开始。</span></p>',shopBtn('确认配送时间','v3-start-confirm'),'shop-start-sheet');}
  function openShopDate(){const c=state.checkout,min=earliest(SHOP.now());if(!state.shopDateMonth){const d=c.date||min;state.shopDateMonth={y:+d.slice(0,4),m:+d.slice(5,7)-1};}const m=state.shopDateMonth,p=shopPlan();shopSheet('选择开始配送日期','<div class="shop-month"><button data-act="v3-date-month" data-step="-1">‹</button><b>'+m.y+'年'+(m.m+1)+'月</b><button data-act="v3-date-month" data-step="1">›</button></div><div class="shop-calendar">'+['日','一','二','三','四','五','六'].map(w=>'<span class="weekday">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>{const date=dateKey(m.y,m.m,d.day),disabled=d.dim||date<min||!matches(date,p);return '<button '+(disabled?'disabled':'')+' class="'+(d.dim?'dim':'')+' '+(state.shopDateDraft===date?'selected':'')+'" data-act="v3-date-pick" data-date="'+date+'">'+d.day+'</button>';}).join('')+'</div><p class="shop-calendar-note">灰色日期不可选，最早可选 '+min+'，以当前计划的配送星期为准。</p>',shopBtn('确认日期','v3-date-confirm'),'shop-calendar-sheet',true);}
  function shopFinish(){const c=state.checkout,o=shopOrder(),p=shopPlan();if(!c?.paid||!o||!p)return;if(o.status==='进行中'){closeAllLayers();go('orderSuccess');return;}const min=earliest(SHOP.now());if(!c.date||c.date<min||!matches(c.date,p))return toast('请选择有效的开始配送日期');Object.assign(o,{status:'进行中',startDate:c.date,planId:p.id,endDate:finishDate(c.date,o.total,p),meals:'剩余 '+o.remaining+' 餐·已使用 0 餐'});p.active=true;c.planId=p.id;state.orderPlans=state.orderPlans||{};state.orderPlans[o.id]=p.id;state.orderDetailId=o.id;state.checkout.complete=true;save();closeAllLayers();go('orderSuccess');}
  function shopNav(active){return '<p class="shop-quote">"把每一餐安排好，把生活的主动权握在自己手里。"</p><div class="shop-subnav">'+[['package','已购套餐'],['deliveryCalendar','配送日历'],['plans','配送计划']].map(([r,t])=>'<button class="'+(active===r?'selected':'')+'" data-act="v3-subtab" data-route="'+r+'">'+t+'</button>').join('')+'</div>';}
  function ordersForDay(date){return DATA.orders.filter(o=>{const p=state.plans.find(p=>p.id===o.planId);return p&&o.newShop&&o.status==='进行中'&&date>=o.startDate&&date<=o.endDate&&matches(date,p);});}
  SCREENS.package.render=function(){const orders=DATA.orders.filter(o=>o.newShop&&o.status==='进行中');return '<div class="shop-orders-root">'+shopNav('package')+'<div class="shop-purchased"><div class="shop-section-heading"><h3>'+I('record')+'已订购</h3><button data-act="orders">订阅明细</button></div>'+SHOP_BRANDS.filter(b=>orders.some(o=>o.brandId===b.id)).map(b=>'<section class="shop-purchase-group"><div class="shop-purchased-brand">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+b.desc+'</p>'+brandTags(b)+'</div>'+shopBtn('次日订单','tomorrow','data-id="'+b.id+'"','outline')+'</div><div class="shop-binding">'+orders.filter(o=>o.brandId===b.id).map(o=>'<button data-act="v3-order-detail" data-id="'+o.id+'"><b>'+esc(state.plans.find(p=>p.id===o.planId)?.name||'未绑定计划')+'</b><span>剩余 <em>'+o.remaining+'</em> 餐 ›</span></button>').join('')+'</div></section>').join('')+(!orders.length?'<div class="shop-empty">暂无订购 '+shopBtn('去择食','v3-subtab','data-route="menu"')+'</div>':'')+'</div></div>';};
  SCREENS.deliveryCalendar.render=function(){const m=state.shopMonth,date=state.shopDay;const orders=ordersForDay(date),count=orders.reduce((n,o)=>n+(state.plans.find(p=>p.id===o.planId)?.meals.length||1),0);return '<div class="shop-orders-root">'+shopNav('deliveryCalendar')+'<div class="shop-delivery-calendar"><div class="shop-month"><button data-act="v3-delivery-month" data-step="-1">‹</button><b>'+m.y+'年'+(m.m+1)+'月</b><button data-act="v3-delivery-month" data-step="1">›</button></div><div class="shop-calendar">'+['日','一','二','三','四','五','六'].map(w=>'<span class="weekday">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>{const day=dateKey(m.y,m.m,d.day),n=ordersForDay(day).reduce((v,o)=>v+(state.plans.find(p=>p.id===o.planId)?.meals.length||1),0);return '<button class="'+(d.dim?'dim':'')+' '+(date===day?'selected':'')+'" data-act="v3-delivery-day" data-date="'+day+'" '+(d.dim?'disabled':'')+'>'+String(d.day).padStart(2,'0')+(n?'<small>'+n+'餐</small>':'')+'</button>';}).join('')+'</div><div class="shop-delivery-date"><b>'+Number(date.slice(5,7))+'月'+Number(date.slice(8))+'日</b><span>共'+count+'餐 · 查看品牌详情</span></div>'+orders.map(o=>{const p=state.plans.find(p=>p.id===o.planId);return '<button class="shop-delivery-row" data-act="v3-brand" data-id="'+o.brandId+'">'+shopImg(shopBrand(o.brandId).cover)+'<div><b>'+esc(o.brand)+'</b><em>'+(date<localDay(SHOP.now()).date?'已送达':'待配送')+'</em><p>'+p.meals.map(meal=>'<span>'+meal+' 1餐 ｜ '+(meal==='午餐'?p.lunchTime:p.dinnerTime)+'</span>').join('')+'</p><small>配送计划：'+esc(p.name)+'</small></div></button>';}).join('')+(!orders.length?'<p class="shop-empty">当日暂无配送安排</p>':'')+'</div></div>';};
  SCREENS.plans.render=function(){return '<div class="shop-orders-root">'+shopNav('plans')+'<div class="shop-plans-page"><header><div><small>DELIVERY PLANS</small><h3>我的配送计划</h3><p>查看与调整固定配送安排</p></div>'+shopBtn('⊕ 新建计划','v3-plan-new')+'</header>'+state.plans.map(p=>plansCard(p)).join('')+'</div></div>';};
  SCREENS.orderSuccess.render=function(){const o=shopOrder()||DATA.orders.find(o=>o.newShop),b=shopBrand(o?.brandId),pkg=shopPackage(o?.packageId),p=state.plans.find(p=>p.id===o?.planId)||shopPlan();return '<div class="shop-result"><div class="shop-success-hero">'+art('order-success')+'<h2>订购成功</h2><p>套餐权益已到账，配送计划已成功绑定</p></div><section><h3>'+I('shop')+'品牌信息</h3><div class="shop-result-brand">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+b.desc+'</p></div></div></section><section><h3>'+I('cube')+'套餐信息</h3><div class="shop-result-package"><span>'+pkg.tag+'</span><b>'+esc(o?.pkg||pkg.name)+'</b><p><strong>剩余 '+(o?.remaining??pkg.total)+' 餐</strong> · 已使用 '+(o?.used||0)+' 餐</p><em>'+priceText(o?.price??pkg.price)+'</em></div></section><section><h3>'+I('truck')+'配送计划信息</h3>'+[['配餐计划名称',p?.name],['计划周期',(o?.startDate||'')+' 至 '+(o?.endDate||'')],['配送日期规则',p?.rule],['配送餐数',(p?.meals.length||0)+' 餐'],['配送时间',p?.meals.map(m=>m+' '+(m==='午餐'?p.lunchTime:p.dinnerTime)).join(' / ')],['配送地址',p?.addressText],['联系人',(p?.contact||'')+' '+(p?.phone||'')]].map(([k,v])=>'<div class="shop-result-field"><label>'+k+'</label><p>'+esc(v||'')+'</p></div>').join('')+'</section><div class="shop-result-actions">'+shopBtn('返回首页','home','','outline')+shopBtn('查看我的订购','v3-subtab','data-route="package"')+'</div></div>';};
  Object.assign(ACTIONS,{
    'v3-filter':n=>{state[n.dataset.group==='0'?'foodFilter':'nutriFilter']=n.dataset.value;render();},
    'v3-brand':n=>{state.currentBrand=shopBrand(n.dataset.id).id;go('brandDetail');},
    'v3-buy':n=>checkoutStart(n?.dataset.id),
    'v3-package':n=>{const scroll=$('.shop-package-sheet .sheet-body')?.scrollTop||0;state.checkout.packageId=n.dataset.id;state.currentPackage=n.dataset.id;openShopPackages();$('.shop-package-sheet .sheet-body').scrollTop=scroll;},
    'v3-package-more':n=>{const scroll=$('.shop-package-sheet .sheet-body')?.scrollTop||0;state.shopExpanded=state.shopExpanded===n.dataset.id?null:n.dataset.id;openShopPackages();$('.shop-package-sheet .sheet-body').scrollTop=scroll;},
    'v3-package-confirm':()=>{if(!state.checkout)return;openShopPay();},
    'v3-digit':n=>{const c=state.checkout;if(!c||c.paid||state.shopStep!=='pay')return;const k=n.dataset.key;c.pin=k==='delete'?c.pin.slice(0,-1):(c.pin+k).slice(0,6);$$('.shop-pin>span').forEach((s,i)=>{s.textContent=c.pin[i]||'';s.classList.toggle('focused',i===Math.max(0,c.pin.length-1));});if(c.pin.length===6)paid();},
    'v3-close':()=>{if(state.checkout)state.checkout.pin='';closeLayer();},
    'v3-plan-confirm':n=>{const id=n?.dataset.id||state.currentOrderPlanId;if(!state.plans.some(p=>p.id===id))return toast('请先新建配送计划');state.currentOrderPlanId=id;state.checkout.planId=id;state.checkout.date='';state.shopDateMonth=null;save();openShopStart();},
    'v3-date-open':()=>{state.shopDateDraft=state.checkout.date;state.shopDateMonth=null;openShopDate();},
    'v3-date-month':n=>{const m=state.shopDateMonth,d=new Date(Date.UTC(m.y,m.m+Number(n.dataset.step),1));state.shopDateMonth={y:d.getUTCFullYear(),m:d.getUTCMonth()};closeLayer();openShopDate();},
    'v3-date-pick':n=>{if(n.disabled)return;state.shopDateDraft=n.dataset.date;$$('.shop-calendar-sheet [data-date]').forEach(b=>b.classList.toggle('selected',b.dataset.date===state.shopDateDraft));},
    'v3-date-confirm':()=>{if(!state.shopDateDraft||state.shopDateDraft<earliest(SHOP.now())||!matches(state.shopDateDraft,shopPlan()))return toast('请选择可配送的日期');state.checkout.date=state.shopDateDraft;closeAllLayers();openShopStart();},
    'v3-start-confirm':()=>shopFinish(),
    'v3-subtab':n=>go(n.dataset.route,{root:true,tab:n.dataset.route==='menu'?'menu':'package'}),
    'v3-delivery-month':n=>{const m=state.shopMonth,d=new Date(Date.UTC(m.y,m.m+Number(n.dataset.step),1));state.shopMonth={y:d.getUTCFullYear(),m:d.getUTCMonth()};state.shopDay=dateKey(state.shopMonth.y,state.shopMonth.m,1);render();},
    'v3-delivery-day':n=>{if(n.disabled)return;state.shopDay=n.dataset.date;render();},
    'v3-order-detail':n=>{state.orderDetailId=n.dataset.id;go('orderDetail');},
    'v3-plan-edit':n=>{state.shopFormReturn=state.checkout?.paid&&!state.checkout.complete?'picker':'plans';ACTIONS['plan-edit'](n);},
    'v3-plan-new':()=>{state.shopFormReturn=state.checkout?.paid&&!state.checkout.complete?'picker':'plans';ACTIONS['plan-new']();},
    'v3-plan-delete':n=>{if(DATA.orders.some(o=>o.newShop&&o.planId===n.dataset.id&&o.status==='进行中'))return toast('正在使用的计划不可删除');confirmModal('删除配送计划','确定删除该配送计划吗？','删除',()=>{state.plans=state.plans.filter(p=>p.id!==n.dataset.id);save();render();});}
  });
  const oldShopSheet=shopSheet;
  shopSheet=function(...args){const box=oldShopSheet(...args);$$('[data-act="sheet-close"]',box).forEach(n=>n.dataset.act='v3-close');return box;};
  const beforeShopPlanSave=ACTIONS['plan-save'];
  ACTIONS['plan-save']=()=>{const intent=state.shopFormReturn,edit=state.editingPlanId;beforeShopPlanSave();if(state.route==='planForm')return;const p=state.plans.find(p=>p.id===edit)||state.plans.at(-1);if(p){p.contact=p.contact||'张小琴';p.phone=p.phone||'13854875454';}save();if(intent==='picker'){state.currentOrderPlanId=p.id;state.shopFormReturn=null;go('brandDetail');openShopPlans();}else state.shopFormReturn=null;};
  const beforeShopBack=back;
  back=function(){if(state.route==='planForm'&&state.shopFormReturn){const intent=state.shopFormReturn;state.shopFormReturn=null;go(intent==='picker'?'brandDetail':'plans');if(intent==='picker')openShopPlans();return;}if(state.checkout)state.checkout.pin='';beforeShopBack();};
  const beforeOrderUse=ACTIONS['order-use'];
  ACTIONS['order-use']=n=>{const o=DATA.orders.find(o=>o.id===n.dataset.id);if(!o?.newShop)return beforeOrderUse(n);state.checkout={token:o.checkoutToken||o.id,orderId:o.id,brandId:o.brandId,packageId:o.packageId,paid:true,pin:'',date:'',planId:null};state.activeOrderId=o.id;state.currentBrand=o.brandId;state.currentPackage=o.packageId;go('brandDetail');openShopPlans();};
  ACTIONS.buy=n=>checkoutStart(n?.dataset.id);ACTIONS['pay-open']=()=>{if(!state.checkout)checkoutStart();openShopPay();};
  ACTIONS['plan-detail']=n=>{state.editingPlanId=n.dataset.id;go('planDetail');};
  const beforeShopPlanAddress=ACTIONS['plan-address-pick'];
  ACTIONS['plan-address-pick']=n=>{const a=state.addresses.find(a=>String(a.id)===n.dataset.id);if(a){state.planForm.contact=a.name;state.planForm.phone=a.phone;}beforeShopPlanAddress(n);};
  const beforeShopForm=SCREENS.planForm.render;
  SCREENS.planForm.render=()=>beforeShopForm().replace('李 13666666666',esc((state.planForm.contact||'张小琴')+' '+(state.planForm.phone||'13854875454')));
  const beforeShopNewPlan=ACTIONS['plan-new'];
  ACTIONS['plan-new']=()=>{state.planForm={name:'',rule:'工作日配送',perDay:'一天两餐',meals:['午餐','晚餐'],lunchTime:'12:00前送达',dinnerTime:'18:00前送达',addressText:'深南大道英龙大厦',contact:'张小琴',phone:'13854875454',customDays:[],taboo:'',allergy:'',note:''};beforeShopNewPlan();};
  const oldPlanDetails=SCREENS.planDetail.render;
  SCREENS.planDetail.render=function(){const p=state.plans.find(p=>p.id===state.editingPlanId);return oldPlanDetails().replaceAll('李 · 136****6666',esc((p?.contact||'张小琴')+' · '+(p?.phone||'13854875454')));};
  const oldShopFinish=shopFinish;
  shopFinish=function(){oldShopFinish();const o=shopOrder();if(o?.status==='进行中'&&o.startDate){state.shopDay=o.startDate;state.shopMonth={y:+o.startDate.slice(0,4),m:+o.startDate.slice(5,7)-1};save();}};
  const oldRenewShop=ACTIONS['order-renew'];
  ACTIONS['order-renew']=n=>{const o=DATA.orders.find(o=>o.id===(n?.dataset.id||state.orderDetailId));if(o?.newShop){state.currentBrand=o.brandId;checkoutStart(o.brandId);}else oldRenewShop(n);};
  packageSheet=()=>checkoutStart();
  const freshCheckoutStart=checkoutStart;
  checkoutStart=function(id){state.shopChangingOrder=null;freshCheckoutStart(id);};
  const oldPickerEdit=ACTIONS['v3-plan-edit'],oldPickerNew=ACTIONS['v3-plan-new'];
  ACTIONS['v3-plan-edit']=n=>{const picker=!!$('.shop-plan-picker');oldPickerEdit(n);if(picker)state.shopFormReturn='picker';};
  ACTIONS['v3-plan-new']=()=>{const picker=!!$('.shop-plan-picker');oldPickerNew();if(picker)state.shopFormReturn='picker';};
  const ungroupedShopPurchases=SCREENS.package.render;
  SCREENS.package.render=function(){const holder=document.createElement('div');holder.innerHTML=ungroupedShopPurchases();const active=DATA.orders.filter(o=>o.newShop&&o.status==='进行中'),brands=SHOP_BRANDS.filter(b=>active.some(o=>o.brandId===b.id));holder.querySelectorAll('.shop-binding').forEach((box,i)=>{const orders=active.filter(o=>o.brandId===brands[i].id),plans=[...new Set(orders.map(o=>o.planId))];box.innerHTML=plans.map(id=>{const bound=orders.filter(o=>o.planId===id),p=state.plans.find(p=>p.id===id);return '<button data-act="v3-order-detail" data-id="'+bound[0].id+'"><b>'+esc(p?.name||'未绑定计划')+'</b><span>剩余 <em>'+bound.reduce((n,o)=>n+o.remaining,0)+'</em> 餐 ›</span></button>';}).join('');});return holder.innerHTML;};
  const beforeShopCloseLayer=closeLayer;
  closeLayer=function(){if(layers.at(-1)?.querySelector('.shop-payment-sheet')&&state.checkout)state.checkout.pin='';beforeShopCloseLayer();};
  const oldGuardedPlanDelete=ACTIONS['plan-del'];
  ACTIONS['plan-del']=()=>{if(DATA.orders.some(o=>o.newShop&&o.planId===state.editingPlanId&&o.status==='进行中'))return toast('正在使用的计划不可删除');oldGuardedPlanDelete();};
  const beforeRecalculatePlan=ACTIONS['plan-save'];
  ACTIONS['plan-save']=()=>{const id=state.editingPlanId;beforeRecalculatePlan();if(state.route==='planForm')return;const p=state.plans.find(p=>p.id===id);if(p)DATA.orders.filter(o=>o.newShop&&o.status==='进行中'&&o.planId===id).forEach(o=>o.endDate=finishDate(o.startDate,o.total,p));save();};
  const beforeShopChangePlan=ACTIONS['change-plan'];
  ACTIONS['change-plan']=()=>{const o=DATA.orders.find(o=>o.id===state.orderDetailId);if(!o?.newShop)return beforeShopChangePlan();state.shopChangingOrder=o.id;state.currentOrderPlanId=o.planId;openShopPlans();};
  const beforeShopConfirmPlan=ACTIONS['v3-plan-confirm'];
  ACTIONS['v3-plan-confirm']=n=>{if(!state.shopChangingOrder)return beforeShopConfirmPlan(n);const o=DATA.orders.find(o=>o.id===state.shopChangingOrder),p=state.plans.find(p=>p.id===n.dataset.id);if(!o||!p)return toast('请选择配送计划');o.planId=p.id;o.endDate=finishDate(o.startDate,o.total,p);state.orderPlans[o.id]=p.id;state.currentOrderPlanId=p.id;state.shopChangingOrder=null;save();closeAllLayers();render();toast('配送计划已更新');};
  const beforeShopOrderDetail=SCREENS.orderDetail.render;
  SCREENS.orderDetail.render=function(){const o=DATA.orders.find(o=>o.id===state.orderDetailId);if(!o?.newShop)return beforeShopOrderDetail();const b=shopBrand(o.brandId),p=state.plans.find(p=>p.id===o.planId);return '<div class="shop-result shop-order-detail"><section><h3>订单信息</h3><div class="shop-result-brand">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+esc(o.pkg)+'</p></div></div>'+[['订单号',o.id],['开始配送',o.startDate||'尚未设置'],['已用餐数',(o.used||0)+' 餐'],['剩余餐数',o.remaining+' 餐'],['到期时间',o.endDate||'尚未设置'],['支付金额',priceText(o.price)]].map(([k,v])=>'<div class="shop-result-field"><label>'+k+'</label><p>'+esc(v)+'</p></div>').join('')+'</section><section><h3>配送计划</h3><b>'+esc(p?.name||'未绑定计划')+'</b><p>'+esc(p?.rule||'')+'</p><p>'+esc(p?.addressText||'')+'</p><div class="shop-result-actions">'+shopBtn('更换配送计划','change-plan','','outline')+(p?shopBtn('查看计划详情','plan-detail','data-id="'+p.id+'"'):'')+'</div></section>'+shopBtn('返回我的订购','v3-subtab','data-route="package"')+'</div>';};
  const beforeTomorrowShop=ACTIONS.tomorrow;
  ACTIONS.tomorrow=n=>{if(n?.dataset.id&&SHOP_BRANDS.some(b=>b.id===n.dataset.id)){state.shopTomorrowBrand=n.dataset.id;go('tomorrow');}else{state.shopTomorrowBrand=null;beforeTomorrowShop(n);}};
  const beforeTomorrowRender=SCREENS.tomorrow.render;
  SCREENS.tomorrow.render=function(){if(!state.shopTomorrowBrand)return beforeTomorrowRender();const date=addDay(localDay(SHOP.now()).date,1),orders=ordersForDay(date).filter(o=>o.brandId===state.shopTomorrowBrand),b=shopBrand(state.shopTomorrowBrand);return '<div class="shop-result shop-tomorrow"><section><h3>次日订单 · '+date+'</h3><div class="shop-result-brand">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+b.desc+'</p></div></div></section>'+orders.map(o=>{const p=state.plans.find(p=>p.id===o.planId);return '<section><h3>'+esc(p.name)+'</h3><p>'+esc(p.addressText)+'</p>'+p.meals.map(m=>'<div class="shop-result-field"><label>'+m+' · 1 餐</label><p>'+esc(m==='午餐'?p.lunchTime:p.dinnerTime)+'</p></div>').join('')+'</section>';}).join('')+(!orders.length?'<section class="shop-empty">明日暂无该品牌配送安排</section>':'')+shopBtn('返回我的订购','v3-subtab','data-route="package"')+'</div>';};
  document.addEventListener('keydown',e=>{if(state.shopStep!=='pay'||!$('.shop-payment-sheet'))return;if(/^\d$/.test(e.key)||e.key==='Backspace'){e.preventDefault();ACTIONS['v3-digit']({dataset:{key:e.key==='Backspace'?'delete':e.key}});}});
window.addEventListener("DOMContentLoaded",()=>{const route=location.hash.slice(1);if(["menu","package","plans","deliveryCalendar"].includes(route))go(route,{root:true,tab:route==="menu"?"menu":"package"});});

  /* 订购三页与次日改单。预约分配和余额分别记录，保存预约不会扣餐。 */
  SHOP_ROUTES.push('subscriptionDetails','tomorrow');
  const D31_MEALS=[['lunch','午餐'],['dinner','晚餐']];
  const D31_TIMES={lunch:['11:00前送达','11:30前送达','12:00前送达','12:30前送达'],dinner:['17:30前送达','18:00前送达','18:30前送达','19:00前送达']};
  state.dayChanges={};state.deliveryDraft=null;state.subscriptionFilter=null;
  const d31Today=()=>localDay(SHOP.now()).date;
  const d31Tomorrow=()=>addDay(d31Today(),1);
  const d31CanEdit=()=>{const t=localDay(SHOP.now());return t.hour*60+t.minute<1050;};
  const d31Key=(date,b,p)=>date+'|'+b+'|'+p;
  const d31Clone=value=>JSON.parse(JSON.stringify(value));
  const d31Address=a=>[a.region,a.street,a.door].filter(Boolean).join('');
  const d31AddressLabel=a=>(a.tag||'地址')+' · '+d31Address(a);
  const d31Orders=()=>DATA.orders.filter(o=>o.newShop&&o.planId&&o.status==='进行中'&&o.remaining>0&&state.plans.some(p=>p.id===o.planId));
  function d31DefaultMeals(p){const result={};for(const [key,label] of D31_MEALS){const addressId=p[key+'AddressId']||null,a=state.addresses.find(a=>String(a.id)===String(addressId));result[key]={enabled:(p.meals||[]).includes(label),count:1,time:p[key+'Time']||p.time||(key==='lunch'?'12:00前送达':'18:00前送达'),addressId,addressText:a?d31AddressLabel(a):(p.addressText||''),contact:a?.name||p.contact||'',phone:a?.phone||p.phone||''};}return result;}
  let d31Cache=null,d31CacheKey='';
  function d31Schedule(){
    const key=JSON.stringify([d31Today(),DATA.orders.map(o=>[o.id,o.newShop,o.status,o.remaining,o.startDate,o.planId,o.time]),state.plans,state.dayChanges,state.addresses]);
    if(key===d31CacheKey&&d31Cache)return d31Cache;
    const groups=new Map(),rows=[],ends={},leftovers={};
    for(const o of d31Orders()){const k=o.brandId+'|'+o.planId;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o);}
    for(const orders of groups.values()){
      orders.sort((a,b)=>(a.startDate||'').localeCompare(b.startDate||'')||(a.time||'').localeCompare(b.time||'')||a.id.localeCompare(b.id));
      const p=state.plans.find(p=>p.id===orders[0].planId),brandId=orders[0].brandId,balances=new Map(orders.map(o=>[o.id,Math.max(0,Math.floor(o.remaining))]));
      let date=d31Tomorrow();
      for(let n=0;n<3660&&[...balances.values()].some(v=>v>0);n++,date=addDay(date,1)){
        const available=orders.filter(o=>(o.startDate||date)<=date&&balances.get(o.id)>0),capacity=available.reduce((v,o)=>v+balances.get(o.id),0),change=state.dayChanges[d31Key(date,brandId,p.id)];
        if(!capacity||!matches(date,p)&&!change)continue;
        const meals=d31Clone(change?.userSaved?change.meals:d31DefaultMeals(p)),allocations={};let total=0;
        for(const [meal] of D31_MEALS){const m=meals[meal];m.count=Math.max(1,Math.floor(Number(m.count)||1));let wanted=m.enabled?m.count:0,allocated=0;
          for(const o of available){const take=Math.min(wanted,balances.get(o.id));if(take){balances.set(o.id,balances.get(o.id)-take);allocations[o.id]=allocations[o.id]||{lunch:0,dinner:0};allocations[o.id][meal]+=take;ends[o.id]=date;allocated+=take;wanted-=take;}if(!wanted)break;}
          m.enabled=allocated>0;m.count=allocated||m.count;m.reserved=allocated;total+=allocated;
        }
        rows.push({key:d31Key(date,brandId,p.id),date,brandId,planId:p.id,capacity,meals,total,allocations,changed:!!change?.userSaved});
      }
      for(const [id,count] of balances)if(count)leftovers[id]=count;
    }
    for(const o of d31Orders())if(ends[o.id])o.endDate=ends[o.id];
    d31CacheKey=key;d31Cache={rows,ends,leftovers};return d31Cache;
  }
  function d31Rows(date){return d31Schedule().rows.filter(r=>!date||r.date===date);}
  function d31SeedSamples(){
    const today=d31Today(),tomorrow=d31Tomorrow();state.dayChanges={};
    state.addresses=state.addresses.filter(a=>!String(a.id).startsWith('d31-'));
    state.addresses.push({id:'d31-home',name:'张小琴',phone:'13854875454',region:'',street:'世纪大道100号',door:'',tag:'家',def:false},{id:'d31-office',name:'张小琴',phone:'13854875454',region:'',street:'南京路200号',door:'',tag:'公司',def:false});
    DATA.orders=DATA.orders.filter(o=>!o.id.startsWith('d31-mint-'));
    const mint=DATA.orders.find(o=>o.id==='shop-seed-mint-1');if(mint){mint.remaining=2;mint.used=mint.total-2;for(let n=2;n<=3;n++)DATA.orders.push({...mint,id:'d31-mint-'+n});}
    let i=0;for(const o of DATA.orders.filter(o=>o.seed)){o.startDate=addDay(today,-3);o.time=addDay(today,-5)+' 09:'+String(40+i).padStart(2,'0');o.orderNumber='RF'+today.replaceAll('-','')+String(++i).padStart(5,'0');}
    for(const p of state.plans.filter(p=>p.id==='shop-work'||p.id==='shop-light')){p.lunchAddressId='d31-home';p.dinnerAddressId='d31-office';}
    const groups=new Set();for(const o of d31Orders()){const key=d31Key(tomorrow,o.brandId,o.planId);if(groups.has(key))continue;groups.add(key);const p=state.plans.find(p=>p.id===o.planId);state.dayChanges[key]={date:tomorrow,brandId:o.brandId,planId:p.id,meals:d31DefaultMeals(p),sample:true,userSaved:false};}
    state.shopDay=tomorrow;state.shopMonth={y:+tomorrow.slice(0,4),m:+tomorrow.slice(5,7)-1};d31CacheKey='';d31Schedule();
  }
  const d31SaveBefore=save;
  save=function(){d31Schedule();d31SaveBefore();try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');data.delivery31={version:1,changes:state.dayChanges};localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){}};
  const d31RestoreBefore=restore;
  restore=function(){d31RestoreBefore();try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(data.delivery31?.version===1)state.dayChanges=data.delivery31.changes||{};else d31SeedSamples();}catch(e){d31SeedSamples();}state.deliveryDraft=null;d31CacheKey='';};
  const DELIVERY31={rows:d31Rows,tomorrow:d31Tomorrow,canEdit:d31CanEdit,seedSamples:d31SeedSamples,schedule:d31Schedule};
  const d31NavBefore=navMarkup;
  navMarkup=function(){const title=state.route==='subscriptionDetails'?'订购明细':state.route==='tomorrow'?'明日订单':null;return d31NavBefore()+(title?'<span class="shop-nav-heading">'+title+'</span>':'');};
  const d31RenderBefore=render;
  render=function(){d31Schedule();d31RenderBefore();$('#app').classList.toggle('d31-white-nav',['subscriptionDetails','tomorrow'].includes(state.route));};
  function d31Bound(brandId,planId){return d31Orders().filter(o=>(!brandId||o.brandId===brandId)&&(!planId||o.planId===planId));}
  function d31Balance(brand,plan){return d31Bound(brand,plan).reduce((n,o)=>n+o.remaining,0);}
  SCREENS.package.render=function(){const brands=SHOP_BRANDS.filter(b=>d31Bound(b.id).length);return '<div class="shop-orders-root d31-root">'+shopNav('package')+'<div class="d31-purchased"><div class="d31-section-title"><h3>'+I('record')+'已订购</h3><button data-act="d31-details">订阅明细</button></div>'+brands.map(b=>'<section class="d31-purchase-group"><div class="d31-brand-heading">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+esc(b.desc)+'</p>'+brandTags(b)+'</div>'+shopBtn('次日订单','tomorrow','data-id="'+b.id+'"','outline')+'</div><div class="d31-plan-bindings">'+[...new Set(d31Bound(b.id).map(o=>o.planId))].map(id=>'<button class="d31-purchase-plan" data-act="d31-details" data-brand="'+b.id+'" data-plan="'+id+'"><b>'+esc(state.plans.find(p=>p.id===id)?.name||'未绑定计划')+'</b><span>剩余 <em>'+d31Balance(b.id,id)+'</em> 餐 '+I('chev')+'</span></button>').join('')+'</div></section>').join('')+(!brands.length?'<div class="shop-empty">暂无已订购套餐</div>':'')+'</div></div>';};
  SCREENS.deliveryCalendar.render=function(){const m=state.shopMonth,date=state.shopDay,rows=d31Rows(date).filter(r=>r.total),count=rows.reduce((n,r)=>n+r.total,0);return '<div class="shop-orders-root d31-root">'+shopNav('deliveryCalendar')+'<div class="d31-calendar"><div class="shop-month"><button data-act="v3-delivery-month" data-step="-1" aria-label="上个月">‹</button><b>'+m.y+'年'+(m.m+1)+'月</b><button data-act="v3-delivery-month" data-step="1" aria-label="下个月">›</button></div><div class="shop-calendar">'+['日','一','二','三','四','五','六'].map(w=>'<span class="weekday">'+w+'</span>').join('')+monthGrid(m.y,m.m).map(d=>{const day=dateKey(m.y,m.m,d.day),total=d31Rows(day).reduce((n,r)=>n+r.total,0);return '<button class="'+(d.dim?'dim':'')+' '+(day===date?'selected':'')+'" data-act="v3-delivery-day" data-date="'+day+'" '+(d.dim?'disabled':'')+'>'+String(d.day).padStart(2,'0')+(total?'<small>'+total+'餐</small>':'')+'</button>';}).join('')+'</div><div class="d31-calendar-date"><b>'+Number(date.slice(5,7))+'月'+Number(date.slice(8))+'日</b><button class="d31-calendar-total" data-count="'+count+'" data-act="d31-brand-list" '+(!rows.length?'disabled':'')+'>共'+count+'餐 · 查看品牌详情</button></div>'+rows.map(r=>{const b=shopBrand(r.brandId),p=state.plans.find(p=>p.id===r.planId);return '<button class="d31-delivery-card" data-act="v3-brand" data-id="'+b.id+'">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><em>待配送</em><p>'+D31_MEALS.filter(([k])=>r.meals[k].enabled).map(([k,t])=>'<span>'+t+' '+r.meals[k].reserved+'餐 ｜ '+esc(r.meals[k].time.replace('送达',''))+'</span>').join('')+'</p><small>配送计划：'+esc(p.name)+'</small></div></button>';}).join('')+(!rows.length?'<div class="shop-empty">当日暂无配送安排</div>':'')+'</div></div>';};
  SCREENS.plans.render=function(){return '<div class="shop-orders-root d31-root">'+shopNav('plans')+'<div class="d31-plans"><header><div><small>DELIVERY PLANS</small><h3>我的配送计划</h3><p>查看与调整固定配送安排</p></div>'+shopBtn('⊕ 新建计划','v3-plan-new')+'</header>'+state.plans.map(p=>{const orders=d31Bound(null,p.id),brands=SHOP_BRANDS.filter(b=>orders.some(o=>o.brandId===b.id));return '<section class="d31-plan-card '+(!orders.length?'unused':'')+'"><div class="d31-plan-title"><b>'+esc(p.name)+'</b><span>● '+(orders.length?'正在使用':'未使用')+'</span></div><p class="d31-plan-rule">'+esc(p.rule)+'　|　'+esc(p.time)+'</p>'+brands.map(b=>'<button class="d31-bound-brand" data-act="d31-details" data-brand="'+b.id+'" data-plan="'+p.id+'">'+shopImg(b.cover)+'<b>'+esc(b.name)+'</b><span>剩余 <em>'+d31Balance(b.id,p.id)+'</em> 餐</span></button>').join('')+'<div class="d31-plan-actions">'+(!orders.length?'<button class="d31-delete" data-act="v3-plan-delete" data-id="'+p.id+'" aria-label="删除计划">'+I('trash')+'</button>':'')+shopBtn('查看详情','plan-detail','data-id="'+p.id+'"','outline')+shopBtn('修改计划','v3-plan-edit','data-id="'+p.id+'"','pale')+'</div></section>';}).join('')+'</div></div>';};
  screen('subscriptionDetails',{title:'订购明细',noTab:true,render(){const f=state.subscriptionFilter||{},orders=DATA.orders.filter(o=>o.newShop&&o.status!=='已取消'&&(!f.brandId||o.brandId===f.brandId)&&(!f.planId||o.planId===f.planId));return '<div class="d31-subscriptions">'+orders.map(o=>{const b=shopBrand(o.brandId),p=state.plans.find(p=>p.id===o.planId),status=o.status==='待使用'||o.startDate>d31Today()?'未开始':o.remaining<=0?'已完成':'进行中';return '<button class="d31-detail-card" data-act="v3-order-detail" data-id="'+o.id+'"><div class="d31-order-heading"><span>订单号：'+esc(o.orderNumber||o.id)+'</span><em class="'+(status==='未开始'?'not-started':'')+'">'+status+'</em></div><div class="d31-order-body">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+' · '+esc(o.pkg)+'</b><p>订购 '+esc((o.time||'').slice(0,10).replaceAll('-','.'))+' ｜ 剩余 '+o.remaining+' 次</p><p>配送计划：'+esc(p?.name||'尚未绑定')+'</p></div></div></button>';}).join('')+(!orders.length?'<p class="shop-empty">暂无订购记录</p>':'')+'</div>';}});
  function d31TomorrowGroups(){const date=d31Tomorrow();return d31Rows(date).filter(r=>!state.shopTomorrowBrand||r.brandId===state.shopTomorrowBrand);}
  SCREENS.tomorrow.render=function(){const date=d31Tomorrow(),rows=d31TomorrowGroups(),editable=d31CanEdit();return '<div class="d31-tomorrow"><header><h2>'+I('truck')+date+' 明日配送</h2><p>'+(editable?'17:30前可修改　|　可分别调整各品牌订单':'已过今天17:30，明日订单不可再修改')+'</p></header>'+rows.map(r=>{const b=shopBrand(r.brandId),p=state.plans.find(p=>p.id===r.planId),multi=rows.some(v=>v.brandId===r.brandId&&v.planId!==r.planId);return '<section class="d31-tomorrow-group" data-brand="'+b.id+'" data-plan="'+p.id+'"><div class="d31-brand-heading">'+shopImg(b.cover)+'<div><b>'+esc(b.name)+'</b><p>'+esc(b.desc)+'</p>'+brandTags(b)+'</div><span class="d31-tomorrow-count">明日'+r.total+'餐</span></div><div class="d31-tomorrow-content">'+(multi?'<p class="d31-source-plan">配送计划：'+esc(p.name)+'</p>':'')+D31_MEALS.filter(([key])=>r.meals[key].enabled).map(([key,label])=>'<div class="d31-meal-line">'+shopImg('assets/shop-salad.png')+'<div><b>'+label+' ｜ '+esc(r.meals[key].time)+'</b><p>'+esc(r.meals[key].addressText)+'</p></div><span><em>'+r.meals[key].reserved+'</em> 餐</span></div>').join('')+(!r.total?'<p class="d31-paused">明日已暂停配送</p>':'')+shopBtn(editable?'调整订单':'已过修改截止时间','d31-edit','data-brand="'+b.id+'" data-plan="'+p.id+'" '+(!editable?'disabled':''))+'</div></section>';}).join('')+(!rows.length?'<div class="d31-empty">'+art('tomorrow-empty')+'<p>明日暂无'+(state.shopTomorrowBrand?esc(shopBrand(state.shopTomorrowBrand).name):'')+'配送安排</p></div>':'')+'</div>';};
  function d31Sheet(title,body,footer,cls,stack=false){const box=shopSheet(title,body,footer,'d31-sheet '+cls,stack);$$('[data-act="v3-close"]',box).forEach(n=>n.dataset.act='d31-close');return box;}
  function d31DraftTotal(draft){return D31_MEALS.reduce((n,[key])=>n+(draft.meals[key].enabled?draft.meals[key].count:0),0);}
  function d31EditorBody(){const d=state.deliveryDraft,b=shopBrand(d.brandId);return '<p class="d31-edit-hint">'+I('info')+'<span>'+esc(b.name)+'的次日订单可在当日17:30前调整，可关闭午餐或晚餐，并直接修改餐数。</span></p>'+D31_MEALS.map(([key,label])=>{const m=d.meals[key],disabled=!m.enabled;return '<section class="d31-edit-meal '+(disabled?'off':'')+'" data-meal="'+key+'"><div class="d31-edit-heading"><b>'+label+' ｜ '+esc(m.time)+'</b><span>关闭'+label+'</span><button class="d31-switch" data-act="d31-toggle" data-meal="'+key+'" role="switch" aria-label="'+label+'配送" aria-checked="'+m.enabled+'"></button></div><label>配送地址</label><button class="d31-input" data-act="d31-address" data-meal="'+key+'" '+(disabled?'disabled':'')+'><span>'+esc(m.addressText||'选择配送地址')+'</span>'+I('chev')+'</button><label>配送时间</label><button class="d31-input" data-act="d31-time" data-meal="'+key+'" '+(disabled?'disabled':'')+'><span>'+esc(m.time)+'</span>'+I('chev')+'</button><label>餐数</label><div class="d31-stepper"><button data-act="d31-step" data-meal="'+key+'" data-delta="-1" aria-label="减少'+label+'" '+(disabled||m.count<=1?'disabled':'')+'>−</button><b>'+m.count+'餐</b><button data-act="d31-step" data-meal="'+key+'" data-delta="1" aria-label="增加'+label+'" '+(disabled||d31DraftTotal(d)>=d.capacity?'disabled':'')+'>＋</button></div></section>';}).join('');}
  function d31RefreshEditor(){const body=$('.d31-edit .sheet-body');if(body&&state.deliveryDraft){const scroll=body.scrollTop;body.innerHTML=d31EditorBody();body.scrollTop=scroll;}}
  function d31OpenEditor(brand,plan){if(!d31CanEdit())return toast('已过今天17:30，无法修改明日订单');const r=d31Rows(d31Tomorrow()).find(r=>r.brandId===brand&&r.planId===plan);if(!r)return toast('明日暂无该计划配送安排');state.deliveryDraft=d31Clone(r);d31Sheet('调整次日订单',d31EditorBody(),shopBtn('确认修改','d31-save'),'d31-edit');}
  function d31SaveDraft(){const d=state.deliveryDraft;if(!d)return;if(!d31CanEdit()||d.date!==d31Tomorrow())return toast('已过修改截止时间，请重新查看订单');const current=d31Rows(d.date).find(r=>r.brandId===d.brandId&&r.planId===d.planId);if(!current||!state.plans.some(p=>p.id===d.planId))return toast('配送计划已发生变化，请重新打开');if(d31DraftTotal(d)>current.capacity)return toast('餐数不能超过该品牌计划的剩余权益');for(const [key] of D31_MEALS){const m=d.meals[key];if(m.enabled&&(!Number.isInteger(m.count)||m.count<1||!m.addressText||m.addressId&&!state.addresses.some(a=>String(a.id)===String(m.addressId))))return toast('请选择有效配送地址和餐数');}
    state.dayChanges[d.key]={date:d.date,brandId:d.brandId,planId:d.planId,meals:d31Clone(d.meals),userSaved:true};d31CacheKey='';save();closeAllLayers();render();toast('修改成功');
  }
  Object.assign(ACTIONS,{
    'd31-details':n=>{state.subscriptionFilter={brandId:n.dataset.brand||null,planId:n.dataset.plan||null};go('subscriptionDetails');},
    'd31-edit':n=>d31OpenEditor(n.dataset.brand,n.dataset.plan),
    'd31-close':()=>closeLayer(),
    'd31-toggle':n=>{const d=state.deliveryDraft,m=d?.meals[n.dataset.meal];if(!m)return;const total=d31DraftTotal(d)+(m.enabled?-m.count:m.count);if(total>d.capacity)return toast('餐数不能超过剩余权益');m.enabled=!m.enabled;d31RefreshEditor();},
    'd31-step':n=>{const d=state.deliveryDraft,m=d?.meals[n.dataset.meal];if(!m||!m.enabled)return;const delta=Number(n.dataset.delta),count=m.count+delta;if(count<1||d31DraftTotal(d)+delta>d.capacity)return toast('餐数不能超过剩余权益');m.count=count;d31RefreshEditor();},
    'd31-address':n=>{const d=state.deliveryDraft;if(!d?.meals[n.dataset.meal]?.enabled)return;state.deliveryPendingMeal=n.dataset.meal;d31Sheet('选择配送地址','<div class="d31-address-list">'+state.addresses.map(a=>'<button data-act="d31-address-pick" data-id="'+a.id+'"><b>'+esc(d31AddressLabel(a))+'</b><p>'+esc(a.name)+' '+esc(a.phone)+'</p></button>').join('')+(!state.addresses.length?'<p class="shop-empty">暂无可用地址，请先在“我的”中添加地址</p>':'')+'</div>','','d31-address-sheet',true);},
    'd31-address-pick':n=>{const a=state.addresses.find(a=>String(a.id)===n.dataset.id),m=state.deliveryDraft?.meals[state.deliveryPendingMeal];if(!a||!m)return;Object.assign(m,{addressId:a.id,addressText:d31AddressLabel(a),contact:a.name,phone:a.phone});closeLayer();d31RefreshEditor();},
    'd31-time':n=>{const m=state.deliveryDraft?.meals[n.dataset.meal];if(!m?.enabled)return;state.deliveryPendingMeal=n.dataset.meal;d31Sheet('选择配送时间','<div class="d31-time-options">'+D31_TIMES[n.dataset.meal].map(t=>'<button data-act="d31-time-pick" data-value="'+t+'" class="'+(m.time.replaceAll(' ','')===t?'selected':'')+'">'+t+'</button>').join('')+'</div>','','d31-time-sheet',true);},
    'd31-time-pick':n=>{const key=state.deliveryPendingMeal,m=state.deliveryDraft?.meals[key];if(!m||!D31_TIMES[key].includes(n.dataset.value))return;m.time=n.dataset.value;closeLayer();d31RefreshEditor();},
    'd31-save':d31SaveDraft,
    'd31-brand-list':()=>{const rows=d31Rows(state.shopDay).filter(r=>r.total),ids=[...new Set(rows.map(r=>r.brandId))];if(ids.length===1){state.currentBrand=ids[0];go('brandDetail');return;}d31Sheet('查看品牌详情','<div class="d31-brand-options">'+ids.map(id=>'<button data-act="v3-brand" data-id="'+id+'">'+shopImg(shopBrand(id).cover)+esc(shopBrand(id).name)+I('chev')+'</button>').join('')+'</div>','','d31-brand-sheet');}
  });
  ACTIONS.tomorrow=n=>{state.shopTomorrowBrand=n?.dataset.id||n?.dataset.brand||null;go('tomorrow');};
  const d31CloseBefore=closeLayer;
  closeLayer=function(){if(layers.at(-1)?.querySelector('.d31-edit'))state.deliveryDraft=null;d31CloseBefore();};
  const d31PlanAddressBefore=ACTIONS['plan-address-pick'];
  ACTIONS['plan-address-pick']=n=>{d31PlanAddressBefore(n);state.planForm.lunchAddressId=null;state.planForm.dinnerAddressId=null;};

  /* ================================================================
     V1.5 新增模块：问卷调查 / 品牌推荐 / 优惠券 / 邀请码 / 饮食记录
     说明：本文件注入到主 IIFE 内部，可直接使用 state / SCREENS / ACTIONS
     ================================================================ */

  /* ---------------- 品牌标签与品牌扩充 ---------------- */
  const V15_TAG_FEATURE = ['健康食材', '营养均衡', '低卡轻负担', '高蛋白', '高饱腹', '少油少盐', '素食友好', '时令鲜食', '暖胃'];
  const V15_BRAND_TAGS = {
    deer: ['西式冷餐', '健康食材', '低卡轻负担', '时令鲜食'],
    mint: ['轻食沙拉', '健康食材', '时令鲜食', '低卡轻负担'],
    grain: ['能量碗', '营养均衡', '高饱腹', '健康食材'],
    noodle: ['中式热食', '少油少盐', '健康食材', '高饱腹'],
    soup: ['汤品', '营养均衡', '暖胃', '少油少盐'],
    qinghe: ['轻食沙拉', '素食友好', '时令鲜食', '营养均衡']
  };
  if (!SHOP_BRANDS.some((b) => b.id === 'soup')) {
    SHOP_BRANDS.push({
      id: 'soup', name: '暖汤小馆', desc: '慢炖热汤  温润滋养', price: '均价 ¥24～¥34', low: 24, high: 34,
      cover: 'assets/brand-baiwei.png', hero: 'assets/brand-detail-hero.jpg', color: '#f3ecdf',
      tags: V15_BRAND_TAGS.soup, cat: ['汤品', '暖胃'], heat: 94
    });
    SHOP_BRANDS.push({
      id: 'qinghe', name: '青禾轻食', desc: '时蔬谷物  清新鲜甜', price: '均价 ¥22～¥32', low: 22, high: 32,
      cover: 'assets/brand-senlin.png', hero: 'assets/brand-gallery.png', color: '#e8f2e2',
      tags: V15_BRAND_TAGS.qinghe, cat: ['轻食沙拉', '时令鲜食'], heat: 128
    });
  }
  SHOP_BRANDS.forEach((b) => {
    if (V15_BRAND_TAGS[b.id]) { b.tags = V15_BRAND_TAGS[b.id].slice(); b.cat = b.tags.slice(0, 2); }
    if (b.heat == null) b.heat = { deer: 186, mint: 286, grain: 228, noodle: 112 }[b.id] || 60;
    b.status = b.status || '上架';
    ASSETS.brand[b.id] = b.cover;
  });
  const V15_HARD_EXCLUDE = [];

  /* ---------------- 问卷题目（基础题组 + 四套目标题组） ---------------- */
  const V15_BASE_QUESTIONS = [
    { id: 'b1', text: '你更喜欢哪种口味？', type: 'multi', options: [
      { text: '清淡少油', tags: { '少油少盐': 4, '低卡轻负担': 2 } },
      { text: '温热汤羹', tags: { '暖胃': 3, '汤品': 2 } },
      { text: '西式轻食冷餐', tags: { '西式冷餐': 2, '轻食沙拉': 2 } },
      { text: '中式热食', tags: { '中式热食': 3 } },
      { text: '谷物能量碗', tags: { '能量碗': 3, '高饱腹': 2 } }
    ] },
    { id: 'b2', text: '有需要避开食材吗？', type: 'multi', options: [
      { text: '素食为主', tags: { '素食友好': 4 } },
      { text: '不吃辣', tags: { '少油少盐': 2 } },
      { text: '乳制品敏感', tags: {} },
      { text: '没有忌口', tags: {} }
    ] },
    { id: 'b3', text: '打算订哪几餐？', type: 'multi', recommend: false, options: [
      { text: '午餐', tags: {} }, { text: '晚餐', tags: {} }
    ] },
    { id: 'b4', text: '能接受的辣度？', type: 'single', options: [
      { text: '完全不辣', tags: { '少油少盐': 2 } },
      { text: '微辣', tags: {} },
      { text: '重辣', tags: { '中式热食': 2 } }
    ] },
    { id: 'b5', text: '主食偏好？', type: 'single', options: [
      { text: '米饭 / 杂粮饭', tags: { '能量碗': 3, '高饱腹': 2 } },
      { text: '面食', tags: { '中式热食': 3 } },
      { text: '沙拉蔬菜为主', tags: { '轻食沙拉': 3, '低卡轻负担': 2 } },
      { text: '汤品为主', tags: { '汤品': 3, '暖胃': 2 } }
    ] },
    { id: 'b6', text: '每餐预算？', type: 'single', recommend: false, options: [
      { text: '20 元以内', tags: {} }, { text: '20 - 35 元', tags: {} }, { text: '35 元以上', tags: {} }
    ] },
    { id: 'b7', text: '更喜欢的烹饪方式？', type: 'single', options: [
      { text: '蒸煮少油', tags: { '少油少盐': 4, '低卡轻负担': 2 } },
      { text: '炖煮汤品', tags: { '汤品': 3, '暖胃': 2 } },
      { text: '冷餐凉拌', tags: { '西式冷餐': 3, '轻食沙拉': 2 } },
      { text: '都可以', tags: {} }
    ] },
    { id: 'b8', text: '常在外就餐的场景？', type: 'multi', options: [
      { text: '工作日午餐', tags: {} },
      { text: '加班晚餐', tags: { '暖胃': 2 } },
      { text: '周末聚会', tags: {} },
      { text: '很少外食', tags: {} }
    ] }
  ];

  const V15_GOAL_QUESTIONS = {
    '减重': [
      { id: 'r1', text: '你在意饭后很快饿吗？', type: 'single', options: [
        { text: '很在意', tags: { '高饱腹': 4, '高蛋白': 2 } },
        { text: '一般', tags: { '高饱腹': 2 } },
        { text: '不在意', tags: {} }
      ] },
      { id: 'r2', text: '每天热量想控制在什么范围？', type: 'single', options: [
        { text: '1200 千卡以内', tags: { '低卡轻负担': 5 } },
        { text: '1300 - 1500 千卡', tags: { '低卡轻负担': 3 } },
        { text: '不算热量', tags: {} }
      ] },
      { id: 'r3', text: '甜食和含糖饮料的频次？', type: 'single', options: [
        { text: '几乎每天', tags: { '低卡轻负担': 2 } },
        { text: '偶尔', tags: {} },
        { text: '基本不吃', tags: {} }
      ] },
      { id: 'r4', text: '能接受少油少盐的清淡口味吗？', type: 'single', options: [
        { text: '完全接受', tags: { '少油少盐': 4 } },
        { text: '部分接受', tags: { '少油少盐': 2 } },
        { text: '不太接受', tags: { '少油少盐': -3 } }
      ] },
      { id: 'r5', text: '你现在的减重阶段？', type: 'single', options: [
        { text: '刚开始', tags: { '低卡轻负担': 3 } },
        { text: '平台期', tags: { '高蛋白': 3, '高饱腹': 2 } },
        { text: '维持期', tags: { '营养均衡': 3 } }
      ] }
    ],
    '增肌': [
      { id: 'm1', text: '每天的蛋白质摄入够吗？', type: 'single', options: [
        { text: '明显不足', tags: { '高蛋白': 5 } },
        { text: '一般', tags: { '高蛋白': 3 } },
        { text: '已经足够', tags: { '高蛋白': 1 } }
      ] },
      { id: 'm2', text: '有加餐习惯吗？', type: 'single', options: [
        { text: '每天加餐', tags: { '高蛋白': 3, '高饱腹': 2 } },
        { text: '偶尔加餐', tags: {} },
        { text: '不加餐', tags: {} }
      ] },
      { id: 'm3', text: '每周训练几次？', type: 'single', options: [
        { text: '3 次以上', tags: { '高蛋白': 4, '能量碗': 3 } },
        { text: '1 - 2 次', tags: { '高蛋白': 2 } },
        { text: '基本不练', tags: {} }
      ] },
      { id: 'm4', text: '每餐饭量？', type: 'single', options: [
        { text: '要大份', tags: { '能量碗': 4, '高饱腹': 3 } },
        { text: '正常', tags: { '高饱腹': 2 } },
        { text: '吃不太多', tags: { '低卡轻负担': 2 } }
      ] },
      { id: 'm5', text: '训练日的主食安排？', type: 'single', options: [
        { text: '碳水要够', tags: { '能量碗': 4 } },
        { text: '适中', tags: { '能量碗': 2 } },
        { text: '少吃主食', tags: { '低卡轻负担': 3 } }
      ] }
    ],
    '健康饮食': [
      { id: 'h1', text: '每天蔬果吃够了吗？', type: 'single', options: [
        { text: '明显不足', tags: { '时令鲜食': 4, '健康食材': 3 } },
        { text: '一般', tags: { '健康食材': 2 } },
        { text: '比较充足', tags: { '健康食材': 1 } }
      ] },
      { id: 'h2', text: '每周外食频次？', type: 'single', options: [
        { text: '几乎每天外食', tags: { '少油少盐': 4, '健康食材': 2 } },
        { text: '每周几次', tags: { '少油少盐': 2 } },
        { text: '很少外食', tags: {} }
      ] },
      { id: 'h3', text: '更想要的膳食结构？', type: 'single', options: [
        { text: '荤素均衡', tags: { '营养均衡': 5 } },
        { text: '清淡为主', tags: { '少油少盐': 3 } },
        { text: '汤羹为主', tags: { '汤品': 3, '暖胃': 2 } }
      ] },
      { id: 'h4', text: '用餐规律吗？', type: 'single', options: [
        { text: '规律三餐', tags: { '营养均衡': 3 } },
        { text: '常忙到顾不上', tags: { '高饱腹': 3, '能量碗': 2 } },
        { text: '晚睡晚起', tags: { '暖胃': 2 } }
      ] }
    ],
    '减脂': [
      { id: 'f1', text: '最想改善的是？', type: 'single', options: [
        { text: '降低体脂率', tags: { '低卡轻负担': 4, '高蛋白': 3 } },
        { text: '减少腹部脂肪', tags: { '低卡轻负担': 3, '高饱腹': 2 } },
        { text: '保持当前体态', tags: { '营养均衡': 2 } }
      ] },
      { id: 'f2', text: '愿意尝试低碳水吗？', type: 'single', options: [
        { text: '愿意', tags: { '低卡轻负担': 3, '高蛋白': 2 } },
        { text: '正常碳水', tags: {} },
        { text: '不太想', tags: { '能量碗': 2 } }
      ] },
      { id: 'f3', text: '对油盐的敏感度？', type: 'single', options: [
        { text: '特别在意', tags: { '少油少盐': 5 } },
        { text: '一般', tags: { '少油少盐': 2 } },
        { text: '不太在意', tags: { '少油少盐': -3 } }
      ] },
      { id: 'f4', text: '一天的进食节奏？', type: 'single', options: [
        { text: '一日两餐', tags: { '高饱腹': 3 } },
        { text: '少量多餐', tags: { '低卡轻负担': 2 } },
        { text: '正常三餐', tags: { '营养均衡': 2 } }
      ] }
    ]
  };

  const V15_GOALS = ['健康饮食', '减重', '增肌', '减脂'];
  const v15GoalQuestions = (goal) => V15_BASE_QUESTIONS.concat(V15_GOAL_QUESTIONS[goal] || []);
  const v15AllQuestions = (goal) => v15GoalQuestions(goal);

  /* ---------------- 优惠券 / 邀请码 / 饮食记录 演示数据 ---------------- */
  const V15_COUPONS = [
    { id: 'cp1', name: '满 39 减 8 元券', amount: 8, threshold: 39, brands: '全部品牌', expire: '2026-11-30', status: '可用', source: '问卷调查奖励', desc: '订单满 39 元可用，每单限用一张，不与其他优惠券叠加。' },
    { id: 'cp2', name: '无门槛 5 元券', amount: 5, threshold: 0, brands: '全部品牌', expire: '2026-10-31', status: '可用', source: '邀请好友奖励', desc: '无门槛，下单直接抵扣 5 元，每单限用一张。' },
    { id: 'cp3', name: '满 69 减 15 元券', amount: 15, threshold: 69, brands: '薄荷晨间、谷物碗社', expire: '2026-12-31', status: '可用', source: '新客礼包', desc: '限指定品牌订单，满 69 元可用。' },
    { id: 'cp4', name: '满 39 减 8 元券', amount: 8, threshold: 39, brands: '全部品牌', expire: '2026-09-30', status: '已过期', source: '问卷调查奖励', desc: '订单满 39 元可用。' },
    { id: 'cp5', name: '无门槛 5 元券', amount: 5, threshold: 0, brands: '全部品牌', expire: '2026-09-12', status: '已使用', source: '邀请好友奖励', desc: '已于 2026-09-10 在「薄荷晨间 · 7 天体验套餐」订单中使用。' }
  ];

  const V15_INVITE_RECORDS = [
    { name: '微信好友 微**', date: '2026-10-08', reward: '满 39 减 8 元券', status: '已发放' },
    { name: '微信好友 阿*', date: '2026-10-12', reward: '满 39 减 8 元券', status: '已发放' }
  ];

  const V15_FOODS = [
    { name: '香草鸡胸藜麦碗', cat: '套餐菜品', kcal: 139, carb: 15, protein: 11, fat: 4, fiber: 3.4, na: 149, k: 174, ca: 34, fe: 0.9, zn: 0.7, units: [['份', 350]] },
    { name: '牛油果温泉蛋沙拉', cat: '套餐菜品', kcal: 122, carb: 6, protein: 7, fat: 8, fiber: 4.3, na: 168, k: 210, ca: 28, fe: 1.1, zn: 0.6, units: [['份', 350]] },
    { name: '五谷三蔬能量碗', cat: '套餐菜品', kcal: 144, carb: 22, protein: 8, fat: 3, fiber: 4.8, na: 132, k: 190, ca: 26, fe: 1.3, zn: 0.8, units: [['份', 350]] },
    { name: '菌菇豆腐杂粮饭', cat: '套餐菜品', kcal: 132, carb: 19, protein: 7, fat: 3, fiber: 4.5, na: 145, k: 205, ca: 42, fe: 1.5, zn: 0.9, units: [['份', 350]] },
    { name: '鲜虾蔬菜荞麦面', cat: '套餐菜品', kcal: 148, carb: 21, protein: 10, fat: 3, fiber: 3.1, na: 210, k: 168, ca: 38, fe: 1.4, zn: 1.0, units: [['份', 350]] },
    { name: '菌菇鸡肉暖汤', cat: '套餐菜品', kcal: 113, carb: 8, protein: 9, fat: 4, fiber: 2.6, na: 186, k: 232, ca: 30, fe: 1.0, zn: 0.8, units: [['份', 350]] },
    { name: '糙米饭', cat: '主食', kcal: 112, carb: 23, protein: 2.6, fat: 0.9, fiber: 1.6, na: 3, k: 78, ca: 10, fe: 0.6, zn: 0.6, units: [['碗', 150], ['小碗', 100]] },
    { name: '白米饭', cat: '主食', kcal: 116, carb: 25.9, protein: 2.6, fat: 0.3, fiber: 0.3, na: 2.5, k: 30, ca: 7, fe: 0.3, zn: 0.5, units: [['碗', 150], ['小碗', 100]] },
    { name: '荞麦面（熟）', cat: '主食', kcal: 108, carb: 21, protein: 4.4, fat: 0.6, fiber: 1.8, na: 60, k: 62, ca: 10, fe: 0.8, zn: 0.7, units: [['碗', 200]] },
    { name: '全麦面包', cat: '主食', kcal: 246, carb: 43, protein: 9, fat: 3.3, fiber: 6, na: 330, k: 230, ca: 40, fe: 2.5, zn: 1.5, units: [['片', 35], ['个', 60]] },
    { name: '鸡胸肉（煮）', cat: '肉蛋奶', kcal: 133, carb: 1.2, protein: 24.6, fat: 3.2, fiber: 0, na: 63, k: 338, ca: 9, fe: 0.6, zn: 0.9, units: [['份', 100], ['块', 120]] },
    { name: '牛里脊（煎）', cat: '肉蛋奶', kcal: 172, carb: 1, protein: 26, fat: 7, fiber: 0, na: 58, k: 320, ca: 8, fe: 2.8, zn: 4.6, units: [['份', 120]] },
    { name: '三文鱼（烤）', cat: '肉蛋奶', kcal: 208, carb: 0, protein: 20, fat: 13, fiber: 0, na: 108, k: 380, ca: 12, fe: 0.6, zn: 0.5, units: [['份', 100]] },
    { name: '水煮蛋', cat: '肉蛋奶', kcal: 143, carb: 1.1, protein: 12.6, fat: 9.5, fiber: 0, na: 131, k: 154, ca: 50, fe: 1.2, zn: 1.1, units: [['个', 50]] },
    { name: '北豆腐', cat: '肉蛋奶', kcal: 116, carb: 3.8, protein: 12.2, fat: 6.5, fiber: 0.5, na: 7.2, k: 106, ca: 138, fe: 1.5, zn: 0.9, units: [['块', 100], ['份', 150]] },
    { name: '无糖希腊酸奶', cat: '肉蛋奶', kcal: 62, carb: 4, protein: 9, fat: 1.5, fiber: 0, na: 40, k: 140, ca: 110, fe: 0.1, zn: 0.5, units: [['杯', 120]] },
    { name: '西兰花（蒸）', cat: '蔬菜', kcal: 34, carb: 6.6, protein: 2.8, fat: 0.4, fiber: 2.6, na: 33, k: 316, ca: 47, fe: 0.7, zn: 0.4, units: [['份', 150]] },
    { name: '混合沙拉菜', cat: '蔬菜', kcal: 18, carb: 3.2, protein: 1.4, fat: 0.2, fiber: 1.8, na: 28, k: 220, ca: 36, fe: 0.6, zn: 0.2, units: [['份', 150]] },
    { name: '清炒时蔬', cat: '蔬菜', kcal: 62, carb: 6, protein: 2.2, fat: 3.4, fiber: 2.4, na: 240, k: 260, ca: 52, fe: 0.9, zn: 0.4, units: [['份', 200]] },
    { name: '菌菇汤', cat: '汤羹', kcal: 42, carb: 4.6, protein: 2.4, fat: 1.6, fiber: 1.6, na: 210, k: 190, ca: 14, fe: 0.5, zn: 0.4, units: [['碗', 250]] },
    { name: '番茄鸡蛋汤', cat: '汤羹', kcal: 46, carb: 5, protein: 3.1, fat: 1.8, fiber: 1, na: 260, k: 205, ca: 26, fe: 0.6, zn: 0.3, units: [['碗', 250]] },
    { name: '牛油果', cat: '水果', kcal: 171, carb: 7.4, protein: 2, fat: 15.3, fiber: 6.7, na: 8, k: 599, ca: 12, fe: 0.6, zn: 0.6, units: [['个', 140], ['份', 70]] },
    { name: '蓝莓', cat: '水果', kcal: 57, carb: 14.5, protein: 0.7, fat: 0.3, fiber: 2.4, na: 1, k: 77, ca: 6, fe: 0.3, zn: 0.2, units: [['份', 100], ['盒', 125]] },
    { name: '苹果', cat: '水果', kcal: 53, carb: 13.5, protein: 0.2, fat: 0.2, fiber: 1.7, na: 1.6, k: 119, ca: 4, fe: 0.2, zn: 0.1, units: [['个', 200]] },
    { name: '无糖气泡水', cat: '饮品', kcal: 0, carb: 0, protein: 0, fat: 0, fiber: 0, na: 12, k: 2, ca: 4, fe: 0, zn: 0, units: [['瓶', 500]] },
    { name: '美式咖啡（无糖）', cat: '饮品', kcal: 2, carb: 0.3, protein: 0.1, fat: 0, fiber: 0, na: 5, k: 49, ca: 2, fe: 0, zn: 0, units: [['杯', 350]] }
  ];

  const V15_MENU = [
    { id: 'mn1', brand: '薄荷晨间', name: '香草鸡胸藜麦碗', spec: '350g', kcal: 486, done: true },
    { id: 'mn2', brand: '薄荷晨间', name: '牛油果温泉蛋沙拉', spec: '350g', kcal: 428, done: true },
    { id: 'mn3', brand: '谷物碗社', name: '五谷三蔬能量碗', spec: '350g', kcal: 505, done: true },
    { id: 'mn4', brand: '谷物碗社', name: '菌菇豆腐杂粮饭', spec: '350g', kcal: null, done: false },
    { id: 'mn5', brand: '暖汤小馆', name: '菌菇鸡肉暖汤', spec: '350g', kcal: null, done: false },
    { id: 'mn6', brand: '青禾轻食', name: '时蔬鸡肉谷物碗', spec: '350g', kcal: null, done: false }
  ];

  /* ---------------- 状态默认值（在 restore 之前并入 state） ---------------- */
  Object.assign(state, {
    v15: {
      goal: '健康饮食',
      surveyGoal: null,
      answers: {},
      surveyIndex: 0,
      surveyDraft: null,
      surveyEntry: 'center',
      lastResult: null,
      recommend: { offset: 0, goal: null, rows: null },
      coupons: V15_COUPONS.map((c) => Object.assign({}, c)),
      couponTab: '可用',
      couponId: null,
      checkoutCoupon: 'auto',
      mealBalance: 3,
      invite: {
        code: null, cap: 10, invited: V15_INVITE_RECORDS.length,
        activity: { start: '2026-10-01', end: '2026-12-31' },
        target: 'both',
        oldReward: '满 39 减 8 元券', newReward: '无门槛 5 元券',
        records: V15_INVITE_RECORDS.map((r) => Object.assign({}, r))
      },
      customAnswered: {},
      diet: {},
      dietDate: TODAY,
      dietDraft: null,
      dietFood: null,
      photoStep: 'idle',
      photoCandidates: [],
      barcode: '',
      dietTab: '最近'
    }
  });
  const V15 = () => state.v15;
  const v15Save = () => save();

  /* ---------------- 推荐算法（覆盖率分档 + 总分排序 + 负分降档） ---------------- */
  function v15TagScores(goal) {
    const answers = V15().answers[goal] || {};
    const scores = {};
    v15GoalQuestions(goal).forEach((q) => {
      if (q.recommend === false) return;
      const picked = answers[q.id];
      if (picked == null) return;
      (Array.isArray(picked) ? picked : [picked]).forEach((idx) => {
        const opt = q.options[idx];
        if (!opt || !opt.tags) return;
        Object.keys(opt.tags).forEach((tag) => {
          scores[tag] = (scores[tag] || 0) + opt.tags[tag];
        });
      });
    });
    return scores;
  }
  function v15PrefTags(scores) {
    return Object.keys(scores)
      .filter((t) => scores[t] !== 0)
      .sort((a, b) => Math.abs(scores[b]) - Math.abs(scores[a]))
      .slice(0, 5);
  }
  function v15Rank(goal) {
    const scores = v15TagScores(goal);
    const pref = v15PrefTags(scores);
    const rows = [];
    SHOP_BRANDS.forEach((b) => {
      if (b.status === '下架') return;
      const tags = b.tags || [];
      if (V15_HARD_EXCLUDE.some((t) => tags.indexOf(t) >= 0 && scores[t] < 0)) return;
      const total = tags.reduce((n, t) => n + (scores[t] || 0), 0);
      const hitTags = tags.filter((t) => pref.indexOf(t) >= 0 && (scores[t] || 0) > 0);
      const cover = pref.length ? hitTags.length / pref.length : 0;
      const minScore = tags.length ? Math.min.apply(null, tags.map((t) => scores[t] || 0)) : 0;
      rows.push({ brand: b, total, cover, hitTags, minScore, penalty: minScore <= -3 });
    });
    rows.sort((a, b) =>
      (a.penalty === b.penalty ? 0 : a.penalty ? 1 : -1) ||
      (b.cover - a.cover) || (b.total - a.total) || (b.brand.heat - a.brand.heat));
    return { scores, pref, rows };
  }
  function v15AnsweredCount(goal) {
    const answers = V15().answers[goal] || {};
    return v15GoalQuestions(goal).filter((q) => answers[q.id] != null).length;
  }
  function v15ScoreText(scores) {
    const pref = v15PrefTags(scores);
    return pref.length ? pref.slice(0, 3).map((t) => t + ' ' + (scores[t] > 0 ? '+' : '') + scores[t]).join(' · ') : '暂无';
  }
  function v15Why(row) {
    const hits = row.hitTags.slice(0, 3);
    if (!hits.length) return '综合均衡，适合作为日常选择';
    return hits.join('、') + '，和你想要的一致';
  }

  /* ---------------- 通用小组件 ---------------- */
  const v15Chip = (text, cls) => '<span class="v15-chip ' + (cls || '') + '">' + esc(text) + '</span>';
  const v15TagRow = (list, cls) => '<div class="v15-tags">' + list.map((t) => v15Chip(t, cls)).join('') + '</div>';
  const v15Btn = (label, act, extra, cls) => '<button class="v15-btn ' + (cls || '') + '" data-act="' + act + '" ' + (extra || '') + '>' + label + '</button>';
  const v15Fixed = (html) => '<div class="v15-fixed">' + html + '</div>';
  const v15SecHead = (title, right) => '<div class="v15-sec-head"><h3>' + title + '</h3>' + (right ? '<span>' + right + '</span>' : '') + '</div>';
  const v15Num = (n, d) => { if (n == null) return '暂无'; const v = Number(n) || 0; return d ? v.toFixed(d) : String(Math.round(v)); };

  /* ---------------- 问卷中心 ---------------- */
  SCREENS.survey = {
    title: '问卷调查',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const goal = V15().centerGoal || state.goal;
      const qs = v15GoalQuestions(goal);
      const done = v15AnsweredCount(goal);
      const finished = done === qs.length;
      const others = V15_GOALS.filter((g) => g !== goal);
      const custom = [
        { id: 'cs1', name: '口味偏好调研', desc: '帮助我们了解你更喜欢的口味与食材', until: '2026-11-30', left: 1, reward: '满 39 减 8 元券' },
        { id: 'cs2', name: '配送体验回访', desc: '关于配送时间与包装的 6 个问题', until: '2026-10-25', left: 0, reward: '无门槛 5 元券' }
      ];
      return '<div class="v15-page">' +
        '<section class="v15-hero"><h2>问卷调查</h2><p>答完目标问卷，我们会按你的情况推荐更合适的品牌</p>' +
        v15TagRow([v15ScoreText(v15TagScores(goal))], 'v15-chip-plain') + '</section>' +
        '<section class="card v15-block">' + v15SecHead('目标问卷', '当前目标：' + state.goal + (goal !== state.goal ? ' · 查看历史：' + goal : '')) +
        '<article class="v15-q-card" data-act="v15-goalsurvey">' +
        '<div class="v15-q-top"><b>' + goal + '目标问卷</b><span class="v15-state ' + (finished ? 'on' : '') + '">' +
        (finished ? '已完成' : '待完成') + '</span></div>' +
        '<p>共 ' + qs.length + ' 题（基础 ' + V15_BASE_QUESTIONS.length + ' 题 + ' + goal + '专属 ' +
        (V15_GOAL_QUESTIONS[goal] || []).length + ' 题）· 已答 ' + done + ' 题</p>' +
        '<div class="v15-progress"><i style="width:' + Math.round((done / qs.length) * 100) + '%"></i></div>' +
        '<div class="v15-q-foot"><span class="v15-chip">' + v15ScoreText(v15TagScores(goal)) + '</span>' +
        '<button class="v15-link" data-act="v15-goalsurvey">' + (finished ? '查看并修改' : '继续作答') + ' ›</button></div>' +
        '</article>' +
        '<p class="v15-note">在问卷中心修改只能改答案，不能改目标；要换目标请到「我的目标」里切换。</p>' +
        '<div class="v15-goal-switch">' + others.map((g) =>
          '<button class="v15-chip v15-chip-btn" data-act="v15-switch-goal" data-goal="' + g + '">查看 ' + g + '问卷</button>').join('') +
        '</div>' +
        '</section>' +
        '<section class="card v15-block">' + v15SecHead('问卷调研', '共 ' + custom.length + ' 份') +
        custom.map((c) => '<article class="v15-q-card">' +
          '<div class="v15-q-top"><b>' + c.name + '</b><span class="v15-state">' + (c.left ? '可作答' : '已完成') + '</span></div>' +
          '<p>' + c.desc + '</p>' +
          '<div class="v15-meta"><span>有效期至 ' + c.until + '</span><span>剩余 ' + c.left + ' 次</span></div>' +
          '<div class="v15-q-foot"><span class="v15-chip">奖励：' + c.reward + '</span>' +
          '<button class="v15-link" data-act="v15-custom" data-id="' + c.id + '">' + (c.left ? '开始作答 ›' : '已完成 ›') + '</button></div>' +
          '</article>').join('') +
        '</section></div>';
    }
  };

  /* ---------------- 目标问卷作答 ---------------- */
  function v15SurveyState() {
    const goal = V15().surveyGoal || state.goal;
    const qs = v15GoalQuestions(goal);
    const index = Math.min(V15().surveyIndex || 0, qs.length - 1);
    return { goal, qs, index, question: qs[index] };
  }
  SCREENS.goalSurvey = {
    title: '目标问卷',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const st = v15SurveyState();
      const q = st.question;
      const answers = V15().answers[st.goal] || {};
      const picked = answers[q.id];
      const pickedList = picked == null ? [] : (Array.isArray(picked) ? picked : [picked]);
      const locked = V15().surveyEntry === 'center';
      return '<div class="v15-page v15-survey">' +
        '<div class="v15-progress-row"><span>' + (st.index + 1) + ' / ' + st.qs.length + '</span>' +
        '<div class="v15-progress"><i style="width:' + Math.round(((st.index + 1) / st.qs.length) * 100) + '%"></i></div></div>' +
        (locked ? '<p class="v15-note">正在修改已有答案，目标仍为「' + st.goal + '」</p>' : '') +
        '<section class="card v15-question"><h2>' + esc(q.text) + '</h2>' +
        (q.type === 'multi' ? '<p class="v15-sub">可多选</p>' : '<p class="v15-sub">单选</p>') +
        '<div class="v15-opts">' + q.options.map((o, i) => {
          const on = pickedList.indexOf(i) >= 0;
          return '<button class="v15-opt ' + (on ? 'on' : '') + '" data-act="v15-pick" data-q="' + q.id + '" data-i="' + i + '">' +
            '<span>' + esc(o.text) + '</span>' + (on ? I('check') : '') + '</button>';
        }).join('') + '</div></section>' +
        '<p class="v15-hint">选项会绑定品牌标签与分值，用于生成推荐结果（演示数据）。</p>' +
        v15Fixed('<button class="v15-btn ghost" data-act="v15-prev" ' + (st.index === 0 ? 'disabled' : '') + '>上一题</button>' +
          (st.index === st.qs.length - 1
            ? '<button class="v15-btn" data-act="v15-submit">提交问卷</button>'
            : '<button class="v15-btn" data-act="v15-next">下一题</button>')) +
        '</div>';
    }
  };

  /* ---------------- 问卷结果页 ---------------- */
  SCREENS.surveyResult = {
    title: '问卷结果',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const goal = V15().surveyGoal || state.goal;
      const scores = v15TagScores(goal);
      const pref = v15PrefTags(scores);
      const rank = v15Rank(goal);
      return '<div class="v15-page">' +
        '<section class="v15-hero"><h2>问卷已完成</h2><p>' + goal + '目标问卷已提交，可以为你推荐更合适的品牌了</p></section>' +
        '<section class="card v15-block">' + v15SecHead('你的偏好标签', '取前 5 个') +
        v15TagRow(pref.map((t) => t + ' ' + (scores[t] > 0 ? '+' : '') + scores[t]), 'v15-chip-key') +
        '<p class="v15-note">标签得分由你选择的选项累加得到，负分表示不太合拍的标签。</p></section>' +
        '<section class="card v15-block">' + v15SecHead('推荐结果', '前 3 个品牌') +
        rank.rows.slice(0, 3).map((r) => '<div class="v15-brand-row">' + shopImg(r.brand.cover, 'v15-brand-logo') +
          '<div><b>' + esc(r.brand.name) + '</b><p>' + v15Why(r) + '</p>' +
          v15TagRow(r.hitTags.slice(0, 3), 'v15-chip-hit') + '</div></div>').join('') +
        '</section>' +
        '<div class="v15-actions-row">' + v15Btn('查看推荐详情', 'v15-recommend') + v15Btn('回到我的', 'v15-profile', '', 'ghost') + '</div>' +
        '</div>';
    }
  };

  /* ---------------- 为我推荐（择食页入口） ---------------- */
  SCREENS.recommend = {
    title: '为我推荐',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const goal = state.goal;
      const qs = v15GoalQuestions(goal);
      const done = v15AnsweredCount(goal);
      if (done < qs.length) {
        return '<div class="v15-page"><section class="card v15-empty">' +
          '<h2>还差 ' + (qs.length - done) + ' 题</h2>' +
          '<p>答完「' + goal + '」目标问卷后再为你推荐品牌，这样推荐结果才准。</p>' +
          v15Btn('去回答目标问卷', 'v15-goalsurvey') + '</section></div>';
      }
      const rank = v15Rank(goal);
      const offset = Math.min(V15().recommend.offset || 0, 3);
      const rows = rank.rows.slice(offset, offset + 3);
      const scores = rank.scores;
      const pref = rank.pref;
      if (!rows.length) {
        return '<div class="v15-page"><section class="card v15-empty">' +
          '<h2>暂时没有完全匹配的品牌</h2><p>先为你展示全部品牌，也可以补答几题让推荐更准确。</p>' +
          v15Btn('查看全部品牌', 'v15-all-brands') + v15Btn('重新推荐', 'v15-rerank', '', 'ghost') + '</section></div>';
      }
      return '<div class="v15-page">' +
        '<section class="v15-hero"><h2>为你推荐的品牌</h2><p>目标：' + goal + ' · 偏好标签：' + pref.join('、') + '</p></section>' +
        rows.map((r, i) => '<section class="card v15-rec-card">' +
          '<div class="v15-rec-head"><span class="v15-rank">' + (offset + i + 1) + '</span>' +
          shopImg(r.brand.cover, 'v15-rec-logo') +
          '<div><b>' + esc(r.brand.name) + '</b><p>' + esc(r.brand.desc) + '</p></div>' +
          '<span class="v15-match">契合度 ' + Math.round(r.cover * 100) + '%</span></div>' +
          '<p class="v15-why">' + I('info') + v15Why(r) + '</p>' +
          v15TagRow(r.hitTags, 'v15-chip-hit') +
          '<div class="v15-rec-foot"><span>' + esc(r.brand.price) + '</span>' +
          '<button class="shop-button" data-act="v3-brand" data-id="' + r.brand.id + '">去看看</button></div>' +
          (r.penalty ? '<p class="v15-warn">含你排斥的标签，已降档展示</p>' : '') +
          '</section>').join('') +
        '<div class="v15-actions-row">' +
        (offset === 0 ? v15Btn('换一批', 'v15-more', '', 'ghost') : v15Btn('收起换一批', 'v15-reset-offset', '', 'ghost')) +
        v15Btn('重新推荐', 'v15-rerank', '', 'ghost') + v15Btn('查看全部品牌', 'v15-all-brands', '', 'ghost') +
        '</div>' +
        '<p class="v15-note">推荐依据：目标问卷的标签得分 → 覆盖率分档 → 总分排序 → 负分降档，全部按规则可复算。</p>' +
        '</div>';
    }
  };

  /* ---------------- 优惠券 ---------------- */
  SCREENS.coupons = {
    title: '优惠券',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const tab = V15().couponTab || '可用';
      const tabs = ['可用', '已使用', '已过期'];
      const list = V15().coupons.filter((c) => c.status === tab);
      return '<div class="v15-page">' +
        '<section class="card v15-balance">' + I('bowl') +
        '<div><span>餐次余额</span><b>' + V15().mealBalance + ' <small>餐</small></b></div>' +
        '<p>来自赠餐奖励，下单结算时可直接抵扣</p></section>' +
        '<div class="v15-tabs">' + tabs.map((t) =>
          '<button class="' + (t === tab ? 'on' : '') + '" data-act="v15-coupon-tab" data-tab="' + t + '">' + t +
          '（' + V15().coupons.filter((c) => c.status === t).length + '）</button>').join('') + '</div>' +
        '<div class="v15-coupon-list">' + (list.length ? list.map((c) => '<article class="v15-coupon" data-act="v15-coupon-detail" data-id="' + c.id + '">' +
          '<div class="v15-coupon-amount"><b>' + c.amount + '</b><span>元</span></div>' +
          '<div class="v15-coupon-main"><b>' + esc(c.name) + '</b>' +
          '<p>' + (c.threshold ? '满 ' + c.threshold + ' 元可用' : '无门槛使用') + ' · ' + esc(c.brands) + '</p>' +
          '<div class="v15-meta"><span>有效期至 ' + c.expire + '</span><span>' + esc(c.source) + '</span></div></div>' +
          '<i>' + I('chev') + '</i></article>').join('') : '<p class="v15-empty-text">暂无' + tab + '的优惠券</p>') +
        '</div></div>';
    }
  };
  SCREENS.couponDetail = {
    title: '券详情',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const c = V15().coupons.find((x) => x.id === V15().couponId) || V15().coupons[0];
      return '<div class="v15-page"><section class="card v15-coupon-detail">' +
        '<div class="v15-coupon-big"><b>' + c.amount + '</b><span>元</span></div>' +
        '<h2>' + esc(c.name) + '</h2>' +
        '<p>' + esc(c.desc) + '</p>' +
        '<dl class="v15-dl">' +
        '<div><dt>使用条件</dt><dd>' + (c.threshold ? '满 ' + c.threshold + ' 元可用' : '无门槛') + '</dd></div>' +
        '<div><dt>可使用品牌</dt><dd>' + esc(c.brands) + '</dd></div>' +
        '<div><dt>有效期</dt><dd>' + c.expire + '</dd></div>' +
        '<div><dt>来源</dt><dd>' + esc(c.source) + '</dd></div>' +
        '<div><dt>状态</dt><dd>' + c.status + '</dd></div>' +
        '</dl></section>' +
        '<section class="card v15-block">' + v15SecHead('使用说明') +
        '<p>· 每单限用一张优惠券，优惠券之间不可叠加；可与套餐价、活动价叠加。</p>' +
        '<p>· 可用品牌范围外的品牌订单不能使用本券。</p>' +
        '<p>· 订单全额退款且券未过期时，券会退回券包；券已过期则不退回。</p>' +
        '</section></div>';
    }
  };

  /* ---------------- 邀请码 ---------------- */
  SCREENS.invite = {
    title: '邀请码',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const inv = V15().invite;
      const code = inv.code || '点击生成';
      return '<div class="v15-page">' +
        '<section class="card v15-invite-hero">' +
        '<span class="v15-invite-label">我的邀请码</span>' +
        '<b class="v15-code">' + code + '</b>' +
        '<p class="v15-invite-live">活动时间：' + inv.activity.start + ' 至 ' + inv.activity.end + '，活动结束前邀请都有效</p>' +
        (inv.code
          ? '<div class="v15-actions-row">' + v15Btn('复制邀请码', 'v15-copy-code', '', 'ghost') +
            v15Btn('分享海报', 'v15-poster') + '</div>'
          : v15Btn('生成我的邀请码', 'v15-gen-code')) +
        '</section>' +
        '<section class="card v15-block">' + v15SecHead('邀请规则', '活动期内有效') +
        '<div class="v15-rule"><b>邀请成功可各得奖励</b>' +
        '<p>好友通过你的邀请码完成注册即可算邀请成功：你得「' + inv.oldReward + '」，好友得「' + inv.newReward + '」。</p></div>' +
        '<div class="v15-progress-row"><span>已邀请 ' + inv.invited + ' / 上限 ' + inv.cap + ' 人</span>' +
        '<div class="v15-progress"><i style="width:' + Math.round((inv.invited / inv.cap) * 100) + '%"></i></div></div>' +
        '<p class="v15-note">一个新用户只能使用一个邀请码，注册完成后不可更换与叠加。</p>' +
        '</section>' +
        '<section class="card v15-block">' + v15SecHead('我的邀请记录', '共 ' + inv.records.length + ' 条') +
        (inv.records.length ? inv.records.map((r) => '<div class="v15-row">' +
          '<div><b>' + esc(r.name) + '</b><p>' + r.date + ' 注册成功</p></div>' +
          '<div class="v15-row-right"><span class="v15-chip">' + esc(r.reward) + '</span><em>' + r.status + '</em></div>' +
          '</div>').join('') : '<p class="v15-empty-text">还没有邀请记录</p>') +
        '</section></div>';
    }
  };
  SCREENS.invitePoster = {
    title: '分享海报',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const inv = V15().invite;
      return '<div class="v15-page"><div class="v15-poster">' +
        '<div class="v15-poster-brand">渡鸦管家</div>' +
        '<h2>邀请好友一起吃好每一餐</h2>' +
        '<p>你和好友各得一份奖励</p>' +
        '<div class="v15-poster-code"><b>' + (inv.code || 'RAVEN888') + '</b><span>我的邀请码</span></div>' +
        '<div class="v15-poster-qr">' + I('scan') + '<span>二维码占位</span></div>' +
        '<p class="v15-poster-tip">活动时间 ' + inv.activity.start + ' 至 ' + inv.activity.end + '</p>' +
        '</div>' +
        '<p class="v15-note">海报为静态样式演示，实际分享会带上你的邀请码与参数二维码。</p>' +
        v15Fixed(v15Btn('保存海报', 'v15-save-poster')) +
        '</div>';
    }
  };

  /* ---------------- 饮食记录 ---------------- */
  function v15DietDay(date) {
    const d = V15().diet;
    if (!d[date]) d[date] = [];
    return d[date];
  }
  function v15DietTotal(items) {
    const fields = ['kcal', 'carb', 'protein', 'fat', 'fiber', 'na', 'k', 'ca', 'fe', 'zn'];
    const t = {};
    fields.forEach((f) => { t[f] = 0; });
    items.forEach((i) => fields.forEach((f) => { if (i[f] != null) t[f] += i[f]; }));
    return t;
  }
  const V15_MEALS = ['早餐', '午餐', '晚餐', '加餐'];
  SCREENS.dietHome = {
    title: '饮食记录',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const date = V15().dietDate || TODAY;
      const items = v15DietDay(date);
      const t = v15DietTotal(items);
      const budget = V15().references && V15().references.kcal;
      const pct = Math.min(100, Math.round((t.kcal / budget) * 100));
      return '<div class="v15-page">' +
        '<section class="v15-hero v15-diet-hero">' +
        '<div class="v15-date-row"><button data-act="v15-diet-date" data-step="-1">‹</button>' +
        '<b>' + date.slice(5, 7) + ' 月 ' + date.slice(8, 10) + ' 日</b>' +
        '<button data-act="v15-diet-date" data-step="1" ' + (date >= TODAY ? 'disabled' : '') + '>›</button></div>' +
        '<div class="v15-intake"><b>' + v15Num(t.kcal) + '<small> kcal</small></b>' +
        '<span>' + (budget ? '建议 ' + budget + ' kcal · 剩余 ' + v15Num(Math.max(0, budget - t.kcal)) : '当日摄入量 · 暂未配置参考值') + '</span></div>' +
        (budget ? '<div class="v15-progress big"><i style="width:' + pct + '%"></i></div>' : '') +
        '<div class="v15-macros">' + [['碳水', t.carb, 'g'], ['蛋白', t.protein, 'g'], ['脂肪', t.fat, 'g'], ['膳食纤维', t.fiber, 'g']]
          .map(([k, v, u]) => '<div><span>' + k + '</span><b>' + v15Num(v, 1) + u + '</b></div>').join('') + '</div>' +
        '<div class="v15-minerals">' + [['钠', t.na, 'mg'], ['钾', t.k, 'mg'], ['钙', t.ca, 'mg'], ['铁', t.fe, 'mg'], ['锌', t.zn, 'mg']]
          .map(([k, v, u]) => '<span>' + k + ' ' + v15Num(v) + ' ' + u + '</span>').join('') + '</div>' +
        '</section>' +
        V15_MEALS.map((meal) => {
          const list = items.filter((i) => i.meal === meal);
          const sub = list.reduce((n, i) => n + (i.kcal || 0), 0);
          return '<section class="card v15-meal"><div class="v15-sec-head"><h3>' + meal + '</h3>' +
            '<span>' + (list.length ? v15Num(sub) + ' kcal' : '未记录') + '</span></div>' +
            list.map((i, idx) => '<div class="v15-food-row"><div><b>' + esc(i.name) + '</b>' +
              '<p>' + (i.pending ? '<em class="v15-pending">待补录</em>' : '') + v15Num(i.grams) + ' g' +
              (i.pending ? '' : ' · ' + v15Num(i.kcal) + ' kcal · 蛋白 ' + v15Num(i.protein, 1) + ' g') + '</p></div>' +
              '<button class="v15-del" data-act="v15-diet-del" data-meal="' + meal + '" data-i="' + idx + '">' + I('trash') + '</button></div>').join('') +
            '<button class="v15-add" data-act="v15-add-open" data-meal="' + meal + '">＋ 添加' + meal + '</button>' +
            '</section>';
        }).join('') +
        '<p class="v15-note">未补录营养值的菜品只显示名称，不计入合计；空值字段显示「暂无」且不参与达标判定。</p>' +
        '</div>';
    }
  };
  SCREENS.dietSearch = {
    title: '选择食物',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const kw = (V15().foodKeyword || '').trim();
      const cats = ['全部', '主食', '肉蛋奶', '蔬菜', '水果', '汤羹', '饮品', '套餐菜品'];
      const cat = V15().foodCat || '全部';
      const list = V15_FOODS.filter((f) =>
        (cat === '全部' || f.cat === cat) && (!kw || f.name.indexOf(kw) >= 0 || f.cat.indexOf(kw) >= 0));
      return '<div class="v15-page">' +
        '<div class="v15-search"><input id="v15-food-kw" placeholder="搜索食物名称、分类" value="' + esc(kw) + '">' +
        '<button data-act="v15-search">搜索</button></div>' +
        '<div class="v15-cats">' + cats.map((c) =>
          '<button class="v15-chip v15-chip-btn ' + (c === cat ? 'on' : '') + '" data-act="v15-food-cat" data-cat="' + c + '">' + c + '</button>').join('') + '</div>' +
        '<div class="v15-food-list">' + list.map((f) => '<button class="v15-food-item" data-act="v15-food-pick" data-name="' + esc(f.name) + '">' +
          '<div><b>' + esc(f.name) + '</b><p>' + f.cat + ' · 每 100 克 ' + f.kcal + ' kcal · 蛋白 ' + f.protein + ' g</p></div>' +
          '<span>' + f.units.map((u) => u[0] + ' ' + u[1] + 'g').join(' / ') + '</span>' + I('chev') + '</button>').join('') +
        '</div>' +
        '<div class="v15-actions-row">' + v15Btn('找不到？手动填写', 'v15-custom-open', '', 'ghost') +
        v15Btn('拍照识别', 'v15-photo-open', '', 'ghost') + v15Btn('扫条形码', 'v15-barcode-open', '', 'ghost') + '</div>' +
        '</div>';
    }
  };
  SCREENS.dietPortion = {
    title: '选择份量',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const draft = V15().dietDraft || {};
      const food = V15_FOODS.find((f) => f.name === draft.name) || V15_FOODS[0];
      const grams = draft.grams || (food.units[0] ? food.units[0][1] : 100);
      const k = grams / 100;
      const calc = (v) => (v == null ? null : v * k);
      return '<div class="v15-page">' +
        '<section class="card v15-block">' + v15SecHead(food.name, '每 100 克基准') +
        '<div class="v15-units">' + food.units.map((u) =>
          '<button class="v15-chip v15-chip-btn" data-act="v15-unit" data-grams="' + u[1] + '">1 ' + u[0] + ' = ' + u[1] + ' g</button>').join('') +
        '<button class="v15-chip v15-chip-btn" data-act="v15-unit" data-grams="100">按 100 g</button></div>' +
        '<div class="v15-field"><label>重量</label><input id="v15-grams" type="number" value="' + grams + '">' +
        '<span>克</span></div>' +
        '<dl class="v15-dl">' +
        [['热量', calc(food.kcal), 'kcal', 0], ['碳水化合物', calc(food.carb), 'g', 1], ['蛋白质', calc(food.protein), 'g', 1],
         ['脂肪', calc(food.fat), 'g', 1], ['膳食纤维', calc(food.fiber), 'g', 1], ['钠', calc(food.na), 'mg', 0],
         ['钾', calc(food.k), 'mg', 0], ['钙', calc(food.ca), 'mg', 0], ['铁', calc(food.fe), 'mg', 1], ['锌', calc(food.zn), 'mg', 1]]
          .map(([label, v, unit, d]) => '<div><dt>' + label + '</dt><dd>' + (v == null ? '暂无' : v15Num(v, d) + ' ' + unit) + '</dd></div>').join('') +
        '</dl>' +
        '<p class="v15-note">按 克重 ÷ 100 × 每 100 克数值 自动计算；记录后可删除并重新录入。</p>' +
        '</section>' +
        v15Fixed(v15Btn('保存到' + (draft.meal || '午餐'), 'v15-portion-save')) +
        '</div>';
    }
  };
  SCREENS.dietPhoto = {
    title: '拍照识别',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const step = V15().photoStep || 'idle';
      const cands = V15().photoCandidates || [];
      return '<div class="v15-page"><section class="card v15-block">' + v15SecHead('拍照识别', '第三方识别服务 · 演示模拟') +
        '<div class="v15-photo-frame">' + (step === 'analyzing' ? '<span class="v15-analyzing">识别中…</span>' : I('scan', 'v15-scan-icon')) + '</div>' +
        (step === 'idle' ? v15Btn('拍照 / 从相册选择', 'v15-photo-shot') : '') +
        (step === 'analyzing' ? '<p class="v15-note">正在调用识别服务，请稍候…</p>' : '') +
        (step === 'done' ? '<div class="v15-cands">' + cands.map((c) => '<button class="v15-cand" data-act="v15-photo-pick" data-name="' + esc(c.name) + '">' +
          '<b>' + esc(c.name) + '</b><span>置信度 ' + c.conf + '%</span>' + (c.conf < 60 ? '<em>需确认</em>' : '') + '</button>').join('') +
          '<p class="v15-note">低置信候选不会默认选中，需你确认后才进入份量选择。</p>' +
          '<button class="v15-link" data-act="v15-photo-degrade">都不是？改用搜索</button></div>' : '') +
        '</section>' +
        '<section class="card v15-block">' + v15SecHead('识别说明') +
        '<p>· 本期走第三方图像识别服务，不自建识别模型。</p>' +
        '<p>· 不根据照片自动估算重量，份量由你选择或填写。</p>' +
        '<p>· 识别失败或候选都不对时降级到搜索，已填写的内容不丢失。</p>' +
        '<p>· 每个用户每日识别上限 20 次（后台可配）。</p>' +
        '</section></div>';
    }
  };
  SCREENS.dietBarcode = {
    title: '扫条形码',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const code = V15().barcode || '';
      const hit = V15_FOODS.find((f) => f.barcode === code);
      return '<div class="v15-page"><section class="card v15-block">' + v15SecHead('扫条形码', '仅覆盖包装食品') +
        '<div class="v15-photo-frame">' + I('scan', 'v15-scan-icon') + '</div>' +
        '<div class="v15-field"><label>条码</label><input id="v15-barcode" placeholder="6900000000000" value="' + esc(code) + '"></div>' +
        '<div class="v15-actions-row">' + v15Btn('模拟扫描', 'v15-barcode-scan', '', 'ghost') +
        v15Btn('查询', 'v15-barcode-query') + '</div>' +
        (code ? (hit
          ? '<div class="v15-cands"><button class="v15-cand" data-act="v15-food-pick" data-name="' + esc(hit.name) + '"><b>' + esc(hit.name) +
            '</b><span>已命中食物库 · 每 100 克 ' + hit.kcal + ' kcal</span></button></div>'
          : '<div class="v15-cands"><p class="v15-empty-text">未命中食物库，已降级到搜索</p>' +
            '<div class="v15-actions-row">' + v15Btn('去搜索', 'v15-photo-degrade', '', 'ghost') +
            v15Btn('补录这个条码', 'v15-barcode-report') + '</div></div>') : '') +
        '</section>' +
        '<p class="v15-note">条码只覆盖包装食品；现制餐食请使用搜索或拍照识别。</p></div>';
    }
  };
  SCREENS.dietCustom = {
    title: '手动填写',
    navStyle: { bg: '#f4fad8', ink: '#121212' },
    render() {
      const d = V15().dietDraft || {};
      const fields = [['name', '食物名称', 'text'], ['grams', '重量（克）', 'number'], ['kcal', '热量（kcal）', 'number'],
        ['carb', '碳水（g）', 'number'], ['protein', '蛋白质（g）', 'number'], ['fat', '脂肪（g）', 'number'],
        ['fiber', '膳食纤维（g）', 'number'], ['na', '钠（mg）', 'number'], ['k', '钾（mg）', 'number'],
        ['ca', '钙（mg）', 'number'], ['fe', '铁（mg）', 'number'], ['zn', '锌（mg）', 'number']];
      return '<div class="v15-page"><section class="card v15-block">' + v15SecHead('手动填写', '用于没有对应食物的记录') +
        fields.map(([key, label, type]) => '<div class="v15-field"><label>' + label + '</label>' +
          '<input type="' + type + '" data-act="v15-custom-field" data-key="' + key + '" value="' + esc(d[key] == null ? '' : d[key]) + '"></div>').join('') +
        '<p class="v15-note">营养值可以只填热量，其余留空会显示「暂无」且不参与达标判定。</p>' +
        '</section>' +
        v15Fixed(v15Btn('保存到' + (d.meal || '午餐'), 'v15-custom-save')) +
        '</div>';
    }
  };

  /* ---------------- V1.5 交互动作 ---------------- */
  Object.assign(ACTIONS, {
    'v15-goalsurvey': () => {
      V15().surveyEntry = 'center';
      V15().surveyGoal = V15().centerGoal || state.goal;
      V15().surveyIndex = 0;
      go('goalSurvey');
    },
    'v15-switch-goal': (n) => {
      V15().centerGoal = n.dataset.goal;
      V15().surveyGoal = n.dataset.goal;
      V15().surveyIndex = 0;
      V15().surveyEntry = 'center';
      save();
      render();
    },
    'v15-pick': (n) => {
      const st = v15SurveyState();
      const goal = st.goal;
      const q = st.question;
      const i = Number(n.dataset.i);
      const answers = V15().answers;
      answers[goal] = answers[goal] || {};
      if (q.type === 'multi') {
        const cur = Array.isArray(answers[goal][q.id]) ? answers[goal][q.id].slice() : [];
        const at = cur.indexOf(i);
        if (at >= 0) cur.splice(at, 1); else cur.push(i);
        answers[goal][q.id] = cur;
      } else {
        answers[goal][q.id] = i;
      }
      save();
      render();
    },
    'v15-next': () => {
      const st = v15SurveyState();
      if (!r2AnswerValid(st.question, (V15().answers[st.goal] || {})[st.question.id])) return toast('请先选择答案');
      V15().surveyIndex = Math.min(st.index + 1, st.qs.length - 1);
      render();
    },
    'v15-prev': () => {
      const st = v15SurveyState();
      V15().surveyIndex = Math.max(0, st.index - 1);
      render();
    },
    'v15-submit': () => {
      const st = v15SurveyState();
      const done = v15AnsweredCount(st.goal);
      if (done < st.qs.length) {
        const firstMissing = st.qs.findIndex((q) => !r2AnswerValid(q, (V15().answers[st.goal] || {})[q.id]));
        V15().surveyIndex = firstMissing < 0 ? 0 : firstMissing;
        render();
        return toast('还有 ' + (st.qs.length - done) + ' 题未作答');
      }
      const rank = v15Rank(st.goal);
      V15().lastResult = { goal: st.goal, scores: rank.scores, pref: rank.pref };
      V15().recommend = { offset: 0, goal: st.goal, rows: rank.rows.slice(0, 3).map((r) => r.brand.id) };
      save();
      go('surveyResult');
    },
    'v15-recommend': () => go('recommend'),
    'v15-more': () => { V15().recommend.offset = 3; render(); },
    'v15-reset-offset': () => { V15().recommend.offset = 0; render(); },
    'v15-rerank': () => { V15().recommend.offset = 0; toast('已按最新答案重新推荐'); render(); },
    'v15-all-brands': () => go('menu', { root: true, tab: 'menu' }),
    'v15-profile': () => go('profile', { root: true, tab: 'profile' }),
    'v15-custom': (n) => {
      const id = n.dataset.id;
      V15().customAnswered[id] = true;
      V15().coupons.push({ id: 'cp' + Date.now(), name: '满 39 减 8 元券', amount: 8, threshold: 39, brands: '全部品牌', expire: '2026-11-30', status: '可用', source: '问卷调查奖励', desc: '订单满 39 元可用。' });
      save();
      confirmModal('问卷已完成', '感谢参与，奖励「满 39 减 8 元券」已放入券包，可在「优惠券」中查看。', '去查看', () => go('coupons'));
    },
    'v15-coupon-tab': (n) => { V15().couponTab = n.dataset.tab; render(); },
    'v15-coupon-detail': (n) => { V15().couponId = n.dataset.id; go('couponDetail'); },
    'v15-gen-code': () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
      V15().invite.code = code;
      save();
      render();
      toast('邀请码已生成：' + code);
    },
    'v15-copy-code': () => {
      toast('邀请码 ' + V15().invite.code + ' 已复制');
    },
    'v15-poster': () => go('invitePoster'),
    'v15-save-poster': () => toast('海报已保存到相册（演示）'),
    'v15-diet-date': (n) => {
      const step = Number(n.dataset.step);
      const d = new Date((V15().dietDate || TODAY) + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + step);
      const key = d.toISOString().slice(0, 10);
      if (key > TODAY) return;
      V15().dietDate = key;
      render();
    },
    'v15-add-open': (n) => {
      V15().dietDraft = { meal: n.dataset.meal };
      const body = '<div class="v15-sheet-grid">' +
        '<button data-act="v15-go" data-route="dietSearch">选食物</button>' +
        '<button data-act="v15-go" data-route="dietPhoto">拍照识别</button>' +
        '<button data-act="v15-go" data-route="dietBarcode">扫条形码</button>' +
        '<button data-act="v15-go" data-route="dietCustom">手动填写</button>' +
        '<button data-act="v15-add-menu">从本周菜单添加</button>' +
        '<button data-act="v15-copy-yesterday">复制昨天</button>' +
        '</div>';
      bottomSheet('添加' + n.dataset.meal, body, { dismissible: true });
    },
    'v15-go': (n) => { closeLayer(); go(n.dataset.route); },
    'v15-add-menu': () => {
      closeLayer();
      const body = '<div class="v15-menu-list">' + V15_MENU.map((m) => '<button data-act="v15-menu-pick" data-id="' + m.id + '">' +
        '<b>' + esc(m.name) + '</b><span>' + m.brand + ' · ' + m.spec +
        (m.done ? ' · ' + m.kcal + ' kcal' : ' · 待补录') + '</span></button>').join('') + '</div>';
      bottomSheet('本周菜单', body, { dismissible: true });
    },
    'v15-menu-pick': (n) => {
      closeLayer();
      const m = V15_MENU.find((x) => x.id === n.dataset.id);
      const food = V15_FOODS.find((f) => f.name === m.name);
      const meal = (V15().dietDraft || {}).meal || '午餐';
      if (!m.done || !food) {
        v15DietDay(V15().dietDate || TODAY).push({ meal, name: m.name, grams: 350, kcal: null, carb: null, protein: null, fat: null, fiber: null, na: null, k: null, ca: null, fe: null, zn: null, pending: true });
        save(); render();
        return toast('该菜品营养值待补录，已先记录名称');
      }
      v15DietDay(V15().dietDate || TODAY).push(v15PortionItem(food, 350, meal));
      save(); render();
    },
    'v15-copy-yesterday': () => {
      closeLayer();
      const d = new Date((V15().dietDate || TODAY) + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      const prev = v15DietDay(d.toISOString().slice(0, 10));
      if (!prev.length) return toast('昨天还没有记录');
      v15DietDay(V15().dietDate || TODAY).push.apply(v15DietDay(V15().dietDate || TODAY), prev.map((x) => Object.assign({}, x)));
      save(); render();
      toast('已复制昨天的 ' + prev.length + ' 条记录');
    },
    'v15-diet-del': (n) => {
      const meal = n.dataset.meal;
      const items = v15DietDay(V15().dietDate || TODAY).filter((i) => i.meal === meal);
      const target = items[Number(n.dataset.i)];
      const all = v15DietDay(V15().dietDate || TODAY);
      all.splice(all.indexOf(target), 1);
      save(); render();
    },
    'v15-search': () => {
      const input = $('#v15-food-kw');
      V15().foodKeyword = input ? input.value : '';
      render();
    },
    'v15-food-cat': (n) => { V15().foodCat = n.dataset.cat; render(); },
    'v15-food-pick': (n) => {
      const name = n.dataset.name;
      V15().dietDraft = Object.assign({}, V15().dietDraft, { name: name });
      const food = V15_FOODS.find((f) => f.name === name);
      V15().dietDraft.grams = food && food.units[0] ? food.units[0][1] : 100;
      go('dietPortion');
    },
    'v15-unit': (n) => {
      V15().dietDraft = Object.assign({}, V15().dietDraft, { grams: Number(n.dataset.grams) });
      render();
    },
    'v15-portion-save': () => {
      const draft = V15().dietDraft || {};
      const food = V15_FOODS.find((f) => f.name === draft.name);
      const input = $('#v15-grams');
      const grams = Number(input && input.value ? input.value : draft.grams) || (food && food.units[0] ? food.units[0][1] : 100);
      if (!food) return toast('请先选择食物');
      v15DietDay(V15().dietDate || TODAY).push(v15PortionItem(food, grams, draft.meal || '午餐'));
      save();
      go('dietHome');
      toast('已记录 ' + food.name);
    },
    'v15-custom-open': () => { V15().dietDraft = Object.assign({}, V15().dietDraft); go('dietCustom'); },
    'v15-custom-field': (n) => { V15().dietDraft = Object.assign({}, V15().dietDraft); V15().dietDraft[n.dataset.key] = n.value; },
    'v15-custom-save': () => {
      const d = V15().dietDraft || {};
      if (!d.name) return toast('请填写食物名称');
      const grams = Number(d.grams) || 100;
      const num = (k) => (d[k] === '' || d[k] == null ? null : Number(d[k]));
      v15DietDay(V15().dietDate || TODAY).push({
        meal: d.meal || '午餐', name: d.name, grams: grams, kcal: num('kcal'),
        carb: num('carb'), protein: num('protein'), fat: num('fat'), fiber: num('fiber'),
        na: num('na'), k: num('k'), ca: num('ca'), fe: num('fe'), zn: num('zn'), pending: false
      });
      save(); go('dietHome'); toast('已记录 ' + d.name);
    },
    'v15-photo-open': () => { V15().photoStep = 'idle'; go('dietPhoto'); },
    'v15-photo-shot': () => {
      V15().photoStep = 'analyzing';
      render();
      setTimeout(() => {
        V15().photoStep = 'done';
        V15().photoCandidates = [
          { name: '香草鸡胸藜麦碗', conf: 92 },
          { name: '五谷三蔬能量碗', conf: 64 },
          { name: '牛油果温泉蛋沙拉', conf: 41 }
        ];
        render();
      }, 900);
    },
    'v15-photo-pick': (n) => {
      const name = n.dataset.name;
      const food = V15_FOODS.find((f) => f.name === name);
      V15().dietDraft = Object.assign({}, V15().dietDraft, { name: name, grams: food && food.units[0] ? food.units[0][1] : 350 });
      go('dietPortion');
    },
    'v15-photo-degrade': () => { toast('已切换到搜索'); go('dietSearch'); },
    'v15-barcode-open': () => { V15().barcode = ''; go('dietBarcode'); },
    'v15-barcode-scan': () => {
      V15().barcode = V15_FOODS[6].barcode || '6900000000012';
      render();
    },
    'v15-barcode-query': () => {
      const input = $('#v15-barcode');
      V15().barcode = input ? input.value.trim() : '';
      render();
    },
    'v15-barcode-report': () => toast('已提交条码补录，后台会补全食物信息'),
    'v15-focus-profile': () => go('profile', { root: true, tab: 'profile' })
  });

  function v15PortionItem(food, grams, meal) {
    const k = grams / 100;
    const val = (v, d) => (v == null ? null : Math.round(v * k * Math.pow(10, d || 0)) / Math.pow(10, d || 0));
    return {
      meal: meal, name: food.name, grams: grams, kcal: val(food.kcal, 0), carb: val(food.carb, 1),
      protein: val(food.protein, 1), fat: val(food.fat, 1), fiber: val(food.fiber, 1), na: val(food.na, 0),
      k: val(food.k, 0), ca: val(food.ca, 0), fe: val(food.fe, 1), zn: val(food.zn, 1), pending: false
    };
  }

  /* ---------------- 覆盖与增强 ---------------- */
  // 1) 择食页新增「为我推荐」入口
  const v15BaseMenuRender = SCREENS.menu.render;
  SCREENS.menu.render = function () {
    const html = v15BaseMenuRender();
    const entry = '<button class="v15-rec-entry" data-act="v15-recommend">' +
      I('question') + '<span><b>不知道怎么选择品牌？</b><small>点击为我推荐，按你的问卷得分匹配</small></span>' + I('chev') + '</button>';
    return html.replace('<div class="shop-brand-list">', entry + '<div class="shop-brand-list">');
  };

  // 2) 首页饮食记录卡片启用
  const v15BaseHomeRender = SCREENS.home.render;
  SCREENS.home.render = function () {
    let html = v15BaseHomeRender();
    const items = (V15().diet[r2Today()] || []);
    const total = v15DietTotal(items);
    const budget = V15().references && V15().references.kcal;
    const pct = Math.min(100, Math.round((total.kcal / budget) * 100));
    html = html.replace(
      '<div class="intake-value">0 <small>kcal / 1333</small><span>剩余可摄入 <em>1333 kcal</em></span></div>',
      '<div class="intake-value">' + v15Num(total.kcal) + ' <small>' + (budget ? 'kcal / ' + budget : 'kcal') + '</small><span>' +
      (budget ? '剩余可摄入 <em>' + v15Num(Math.max(0, budget - total.kcal)) + ' kcal</em>' : '暂未配置参考值') + '</span></div>')
      .replace('<div class="intake-progress"></div>', budget ? '<div class="intake-progress"><i style="width:' + pct + '%"></i></div>' : '');
    html = html.replace('<span class="research-badge">♧ 研发中，敬请期待</span>', '');
    const dietCard = '<section class="card recorded-diet">' + sectionTitle('今日饮食记录', 'bowl') +
      (items.length
        ? '<div class="v15-home-diet">' + items.slice(0, 3).map((i) => '<div class="v15-home-row"><span>' + i.meal + ' · ' +
          esc(i.name) + '</span><b>' + (i.pending ? '待补录' : v15Num(i.kcal) + ' kcal') + '</b></div>').join('') +
          '<div class="v15-home-total"><span>共 ' + items.length + ' 条记录</span><b>' + v15Num(total.kcal) + ' kcal</b></div></div>'
        : '<b>暂无饮食记录</b>') +
      '<button data-act="record-diet">＋ 记录今天吃了什么</button></section>';
    html = html.replace(/<section class="card recorded-diet">[\s\S]*?<\/section>/, dietCard);
    return html;
  };
  ACTIONS['record-diet'] = () => go('dietHome');

  // 3) 我的页：优惠福利改名优惠券，并新增邀请码入口
  const v15BaseProfileRender = SCREENS.profile.render;
  SCREENS.profile.render = function () {
    const inviteBtn = '<button class="quick-item" data-act="profile-quick" data-key="invite">' +
      '<i class="quick-icon">' + I('partners') + '</i><span>邀请码</span></button>';
    return v15BaseProfileRender()
      .replace('<span>优惠福利</span>', '<span>优惠券</span>')
      .replace('<button class="quick-item" data-act="profile-quick" data-key="favorites">', inviteBtn + '<button class="quick-item" data-act="profile-quick" data-key="favorites">');
  };

  // 4) 目标选择页：四个目标全部开放，下一步进入目标问卷
  SCREENS.goalQuiz.render = function () {
    const goals = [
      ['健康饮食', '均衡营养，吃出健康好身体', 'goal-food'],
      ['减重', '科学减重，轻盈无负担', 'goal-scale'],
      ['增肌', '增加肌肉，塑造强壮体魄', 'goal-muscle'],
      ['减脂', '减少脂肪，塑造紧致身材', 'goal-fat']
    ];
    return '<div class="goal-quiz"><div class="goal-intro"><h1>你的目标是什么？</h1>' +
      '<p>选择一个目标，接着回答对应的目标问卷吧！</p>' + art('goal-header') + '</div>' +
      '<div class="goal-options">' + goals.map((a) =>
        '<button class="goal-option ' + (state.goal === a[0] ? 'active' : '') + '" data-act="goal-pick" data-goal="' + a[0] + '">' +
        art(a[2]) + '<span><b>' + a[0] + '</b><p>' + a[1] + '</p></span></button>').join('') + '</div>' +
      '<p class="v15-note">选择后需要完成「' + state.goal + '」目标问卷（基础题 + 专属题），答完才能生成推荐。</p>' +
      fixed(greenBtn('下一步 · 回答目标问卷', 'v15-goal-next')) + '</div>';
  };
  ACTIONS['v15-goal-next'] = () => {
    V15().surveyGoal = state.goal;
    V15().surveyIndex = 0;
    V15().surveyEntry = 'setup';
    const done = v15AnsweredCount(state.goal);
    if (done >= v15GoalQuestions(state.goal).length) {
      V15().surveyEntry = 'modify';
      toast('该目标的问卷已答过，可直接修改');
    }
    save();
    go('goalSurvey');
  };

  // 5) 下单确认页：自动挑选最优优惠券，可切换为不使用
  function v15BestCoupon(price) {
    const usable = V15().coupons.filter((c) => c.status === '可用' && price >= (c.threshold || 0));
    usable.sort((a, b) => b.amount - a.amount);
    return usable[0] || null;
  }
  const v15BaseOpenShopPackages = openShopPackages;
  openShopPackages = function () {
    v15BaseOpenShopPackages();
    const body = document.querySelector('.shop-package-sheet .sheet-body');
    if (!body) return;
    const pkg = shopPackage(state.checkout.packageId);
    const chosen = V15().checkoutCoupon === 'none' ? null : (V15().checkoutCoupon === 'auto' ? v15BestCoupon(pkg.price) : V15().coupons.find((c) => c.id === V15().checkoutCoupon));
    const off = chosen ? chosen.amount : 0;
    body.insertAdjacentHTML('beforeend',
      '<div class="v15-checkout-coupon"><span>优惠券</span>' +
      '<button data-act="v15-checkout-pick">' + (chosen ? esc(chosen.name) + '（－¥' + off + '）' : '不使用优惠券') + ' ›</button></div>' +
      '<div class="v15-checkout-total"><span>应付金额</span><b>¥' + v15Num(Math.max(0.01, pkg.price - off), 2) + '</b></div>' +
      '<p class="v15-note">每单限用一张券，不与其它券叠加；可与套餐价、活动价叠加。餐次余额 ' + V15().mealBalance + ' 餐可抵扣（演示）。</p>');
  };
  const v15BaseOpenShopPay = openShopPay;
  openShopPay = function () {
    v15BaseOpenShopPay();
    const el = document.querySelector('.shop-pay-amount');
    const pkg = state.checkout ? shopPackage(state.checkout.packageId) : null;
    if (!el || !pkg) return;
    const chosen = V15().checkoutCoupon === 'none' ? null : (V15().checkoutCoupon === 'auto' ? v15BestCoupon(pkg.price) : V15().coupons.find((c) => c.id === V15().checkoutCoupon));
    if (!chosen) return;
    el.innerHTML = '¥' + v15Num(Math.max(0.01, pkg.price - chosen.amount), 2) + '<small>已优惠 ¥' + chosen.amount + '</small>';
  };
  ACTIONS['v15-checkout-pick'] = () => {
    const pkg = shopPackage(state.checkout.packageId);
    const list = V15().coupons.filter((c) => c.status === '可用');
    const body = '<div class="v15-coupon-picker">' + list.map((c) => {
      const ok = pkg.price >= (c.threshold || 0);
      return '<button class="v15-coupon-pick ' + (ok ? '' : 'off') + '" data-act="v15-checkout-choose" data-id="' + c.id + '" ' + (ok ? '' : 'disabled') + '>' +
        '<b>' + c.name + '</b><span>' + (c.threshold ? '满 ' + c.threshold + ' 元可用' : '无门槛') + ' · ' + esc(c.brands) + '</span>' +
        (ok ? '<em>－¥' + c.amount + '</em>' : '<em class="v15-warn">' + (pkg.price < c.threshold ? '未满门槛' : '品牌不可用') + '</em>') +
        '</button>';
    }).join('') + '<button class="v15-coupon-pick" data-act="v15-checkout-choose" data-id="none"><b>不使用优惠券</b><span>按原价下单</span></button></div>';
    bottomSheet('选择优惠券', body, { dismissible: true });
  };
  ACTIONS['v15-checkout-choose'] = (n) => {
    V15().checkoutCoupon = n.dataset.id;
    save();
    closeAllLayers();
    openShopPackages();
  };

  /* v3.1 + V1.5 integration. All persistence is confined to duya-v15-r2. */
  const r2Today = () => localDay(SHOP.now()).date;
  // Two packaged foods provide deterministic barcode hit examples.
  V15_FOODS.find(f=>f.name==='无糖希腊酸奶').barcode='6900000000012';
  V15_FOODS.find(f=>f.name==='美式咖啡（无糖）').barcode='6900000000029';
  ACTIONS['v15-barcode-scan']=()=>{V15().barcode='6900000000012';render();};
  const r2AnswerValid = (q, value) => q.type === 'multi'
    ? Array.isArray(value) && value.length > 0 && value.every(i => Number.isInteger(i) && !!q.options[i])
    : Number.isInteger(value) && !!q.options[value];
  v15AnsweredCount = goal => v15GoalQuestions(goal).filter(q => r2AnswerValid(q, (V15().answers[goal] || {})[q.id])).length;
  Object.assign(state.v15, { references: {kcal:1333}, photoDailyLimit:20, photoUsage:{}, registrationBindings:{}, rewardLedger:{}, customDrafts:{} });
  const r2SaveBefore=save, r2RestoreBefore=restore;
  save=function(){r2SaveBefore();try{const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');stored.v15=V15();localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));}catch(e){toast('当前浏览器无法保存演示数据');}};
  restore=function(){r2RestoreBefore();try{const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(stored.v15)state.v15=Object.assign({},state.v15,stored.v15);else state.v15.dietDate=r2Today();}catch(e){} };
  const r2RenderBefore=render;
  render=function(){for(const c of V15().coupons)if(c.status==='可用'&&c.expire<r2Today())c.status='已过期';r2RenderBefore();};
  ACTIONS['goal-pick']=ACTIONS['pick-goal']=n=>{if(V15_GOALS.includes(n.dataset.goal)){state.goal=n.dataset.goal;V15().centerGoal=null;render();}};
  ACTIONS['goal-done']=ACTIONS['v15-goal-next'];
  const r2ProfileQuick=ACTIONS['profile-quick'];
  ACTIONS['profile-quick']=n=>{if(n.dataset.key==='coupon')return go('coupons');if(n.dataset.key==='invite')return go('invite');if(n.dataset.key==='survey')V15().centerGoal=null;return r2ProfileQuick(n);};
  ACTIONS['v15-goalsurvey']=()=>{const center=state.route==='survey';V15().surveyEntry=center?'center':'recommend';V15().surveyGoal=center?(V15().centerGoal||state.goal):state.goal;V15().surveyIndex=0;go('goalSurvey');};
  const r2SubmitBefore=ACTIONS['v15-submit'];
  ACTIONS['v15-submit']=()=>{const st=v15SurveyState();if(v15AnsweredCount(st.goal)!==st.qs.length)return r2SubmitBefore();V15().goalCompleted=V15().goalCompleted||{};V15().goalCompleted[st.goal]=true;r2SubmitBefore();};

  // Coupon eligibility is shared by the picker, payment sheet and persisted order.
  function r2CouponReason(c, price, brandId){
    if(!c||c.status!=='可用')return '优惠券不可用';
    if(c.expire<r2Today())return '已过期';
    if(c.start&&c.start>r2Today())return '尚未生效';
    if(price<(c.threshold||0))return '未满门槛';
    const names=Array.isArray(c.brands)?c.brands:String(c.brands||'').split(/[、,，]/);
    if(!names.includes('全部品牌')&&!names.includes(brandId)&&!names.includes(shopBrand(brandId).name)&&!names.includes(shopBrand(brandId).name.replace('Leapeer ','')))return '品牌不可用';
    return '';
  }
  v15BestCoupon=function(price){return V15().coupons.filter(c=>!r2CouponReason(c,price,state.checkout?.brandId||state.currentBrand)).sort((a,b)=>b.amount-a.amount)[0]||null;};
  function r2SelectedCoupon(){const c=state.checkout;if(!c)return null;const price=shopPackage(c.packageId).price;const id=V15().checkoutCoupon;return id==='none'?null:id==='auto'?v15BestCoupon(price):V15().coupons.find(x=>x.id===id&&!r2CouponReason(x,price,c.brandId))||null;}
  const r2PackagesBefore=openShopPackages;
  openShopPackages=function(){if(!state.checkout)return;const selected=V15().coupons.find(c=>c.id===V15().checkoutCoupon);if(selected&&r2CouponReason(selected,shopPackage(state.checkout.packageId).price,state.checkout.brandId))V15().checkoutCoupon='auto';r2PackagesBefore();};
  const r2PayBefore=openShopPay;
  openShopPay=function(){const selected=r2SelectedCoupon();if(V15().checkoutCoupon!=='none'&&V15().checkoutCoupon!=='auto'&&!selected)V15().checkoutCoupon='none';r2PayBefore();};
  const r2PaidBefore=paid;
  paid=function(){const c=state.checkout;if(!c||c.paid)return;const coupon=r2SelectedCoupon(),pkg=shopPackage(c.packageId);r2PaidBefore();const o=shopOrder();if(!o)return;Object.assign(o,{originalPrice:pkg.price,discount:coupon?Math.min(coupon.amount,pkg.price-0.01):0,couponId:coupon?.id||null});o.price=Math.round((pkg.price-o.discount)*100)/100;if(coupon){coupon.status='已使用';coupon.orderId=o.id;coupon.usedAt=r2Today();}V15().checkoutCoupon='auto';save();};
  ACTIONS['v15-checkout-pick']=()=>{const pkg=shopPackage(state.checkout.packageId);bottomSheet('选择优惠券','<div class="v15-coupon-picker">'+V15().coupons.filter(c=>c.status==='可用').map(c=>{const why=r2CouponReason(c,pkg.price,state.checkout.brandId);return '<button class="v15-coupon-pick '+(why?'off':'')+'" data-act="v15-checkout-choose" data-id="'+c.id+'" '+(why?'disabled':'')+'><b>'+esc(c.name)+'</b><span>'+esc(c.brands)+' · '+esc(c.expire)+'</span><em>'+esc(why||'－¥'+c.amount)+'</em></button>';}).join('')+'<button class="v15-coupon-pick" data-act="v15-checkout-choose" data-id="none"><b>不使用优惠券</b></button></div>',{dismissible:true});};
  const r2ChooseBefore=ACTIONS['v15-checkout-choose'];
  ACTIONS['v15-checkout-choose']=n=>{const c=V15().coupons.find(c=>c.id===n.dataset.id);if(n.dataset.id!=='none'&&r2CouponReason(c,shopPackage(state.checkout.packageId).price,state.checkout.brandId))return toast('该优惠券不满足使用条件');r2ChooseBefore(n);};

  // Custom questionnaires award only once after all required questions are submitted.
  const R2_CUSTOM={cs1:{name:'口味偏好调研',until:'2026-11-30',limit:1,reward:{type:'coupon',name:'满 39 减 8 元券'},questions:[{text:'你更喜欢哪类餐食？',options:['中式热食','西式轻食','谷物能量碗']},{text:'你在意哪些体验？',options:['食材新鲜','口味清淡','搭配丰富']},{text:'你希望多久更新一次菜单？',options:['每周','每两周','每月']}]},cs2:{name:'配送体验回访',until:'2026-10-25',limit:1,reward:{type:'meal',count:1,name:'赠餐 1 餐'},questions:[{text:'配送时间是否合适？',options:['合适','偏早','偏晚']},{text:'包装是否完好？',options:['完好','一般','需改善']},{text:'你对本次配送的评价？',options:['满意','一般','不满意']}]}};
  function r2Award(key,reward,source){if(V15().rewardLedger[key])return V15().rewardLedger[key];const result={name:reward.name,source,status:'已发放'};if(reward.type==='coupon'){const template=V15_COUPONS.find(c=>c.name===reward.name)||V15_COUPONS[1];V15().coupons.push({...template,id:'reward-'+key,status:'可用',expire:addDay(r2Today(),15),source});}else if(reward.type==='meal'){if(DATA.orders.some(o=>o.status==='进行中'&&o.remaining>0))V15().mealBalance+=reward.count;else{result.status='待发放';result.message='暂无有效订购，请联系客服领取赠餐';}}else{result.status='待领取';result.message='请联系客服领取线下奖励';}V15().rewardLedger[key]=result;return result;}
  const r2SurveyBefore=SCREENS.survey.render;
  SCREENS.survey.render=function(){const box=document.createElement('div');box.innerHTML=r2SurveyBefore();box.querySelectorAll('[data-act="v15-custom"]').forEach(n=>{const q=R2_CUSTOM[n.dataset.id],done=!!V15().customAnswered[n.dataset.id],card=n.closest('.v15-q-card');n.textContent=done?'查看结果 ›':'开始作答 ›';card.querySelector('.v15-state').textContent=done?'已完成':'可作答';card.querySelector('.v15-meta span:last-child').textContent='剩余 '+(done?0:q.limit)+' 次';if(n.dataset.id==='cs2'){card.querySelector('p').textContent='关于配送时间与包装的 3 个问题';card.querySelector('.v15-q-foot .v15-chip').textContent='奖励：赠餐 1 餐';}});return box.innerHTML;};
  ACTIONS['v15-custom']=n=>{const q=R2_CUSTOM[n.dataset.id];if(!q)return;if(V15().customAnswered[n.dataset.id]){const r=V15().rewardLedger['survey-'+n.dataset.id];return confirmModal('已完成问卷',r?esc(r.name+' · '+r.status+(r.message?' · '+r.message:'')):'这份问卷已完成，不能重复领取奖励。','我知道了',()=>{});}if(q.until<r2Today())return toast('问卷已结束');V15().customId=n.dataset.id;go('surveyRun');};
  SCREENS.surveyRun={title:'问卷调研',navStyle:{bg:'#f4fad8',ink:'#121212'},render(){const id=V15().customId||'cs1',q=R2_CUSTOM[id],draft=V15().customDrafts[id]||{};return '<div class="v15-page"><section class="v15-hero"><h2>'+q.name+'</h2><p>提交后可获'+q.reward.name+' · 每人限 1 次</p></section>'+q.questions.map((question,i)=>'<section class="card v15-question"><h2>'+(i+1)+'．'+question.text+'</h2><div class="v15-opts">'+question.options.map((s,j)=>'<button class="v15-opt '+(draft[i]===j?'on':'')+'" data-act="r2-custom-pick" data-q="'+i+'" data-i="'+j+'">'+s+'</button>').join('')+'</div></section>').join('')+v15Fixed(v15Btn('提交问卷','r2-custom-submit'))+'</div>';}};
  ACTIONS['r2-custom-pick']=n=>{const id=V15().customId;V15().customDrafts[id]=V15().customDrafts[id]||{};V15().customDrafts[id][n.dataset.q]=Number(n.dataset.i);save();render();};
  ACTIONS['r2-custom-submit']=()=>{const id=V15().customId,q=R2_CUSTOM[id],draft=V15().customDrafts[id]||{};if(!q||V15().customAnswered[id])return toast('本问卷已完成');if(q.until<r2Today())return toast('问卷已结束');if(q.questions.some((_,i)=>draft[i]==null))return toast('请完成所有问题');const result=r2Award('survey-'+id,q.reward,'问卷调查奖励');V15().customAnswered[id]=true;save();go('survey');confirmModal('问卷已完成',esc(result.name+' · '+result.status+(result.message?' · '+result.message:'')),'我知道了',()=>{});};

  const r2GenBefore=ACTIONS['v15-gen-code'];
  ACTIONS['v15-gen-code']=()=>{if(V15().invite.code)return toast('你的邀请码已生成');const a=V15().invite.activity;if(r2Today()<a.start||r2Today()>a.end)return toast('当前不在活动有效期内');r2GenBefore();};
  // Registration is a local demonstration; a phone identifies a new user, with one immutable attribution.
  function r2BindInvite(code,phone){code=String(code||'').trim().toUpperCase();if(!/^1[3-9]\d{9}$/.test(phone))return {ok:false,message:'请填写正确的手机号'};const bindings=V15().registrationBindings;if(bindings[phone])return {ok:false,message:'该用户已注册，不能再次绑定邀请码'};const own=V15().invite;let source='';if(code){if(code===own.code)return {ok:false,message:'不能使用自己的邀请码'};const merchant={K7HQ92MD:['2026-10-01','2026-12-31'],P3FZ68TN:['2026-09-01','2026-11-30']};if(merchant[code]){const range=merchant[code];if(r2Today()<range[0]||r2Today()>range[1])return {ok:false,message:'邀请码不在有效期内'};source='商户邀请码';}else if(code==='H8NQ4W3R'){if(r2Today()<own.activity.start||r2Today()>own.activity.end)return {ok:false,message:'邀请活动不在有效期内'};source='用户邀请码';}else return {ok:false,message:'邀请码无效'};}
    bindings[phone]={code,source,registeredAt:r2Today()};if(code)r2Award('register-'+phone,{type:'coupon',name:'无门槛 5 元券'},source+'注册奖励');save();return {ok:true,message:'注册成功'};}
  SCREENS.inviteRegister={title:'注册',noTab:true,render(){return '<div class="v15-page"><section class="v15-hero"><h2>欢迎加入渡鸦管家</h2><p>完善资料，开启健康饮食计划</p></section><section class="card v15-block"><div class="v15-field"><label>手机号</label><input id="r2-phone" type="tel" placeholder="请输入手机号"></div><div class="v15-field"><label>邀请码（选填）</label><input id="r2-invite" maxlength="8" placeholder="商户或好友的八位邀请码"></div><p class="v15-note">注册后邀请码不可更换；商户码与好友码不能同时使用。当前为本地原型演示。</p>'+v15Btn('完成注册','r2-register')+'</section></div>';}};
  ACTIONS['r2-register']=()=>{const r=r2BindInvite($('#r2-invite').value,$('#r2-phone').value);if(!r.ok)return toast(r.message);V15().registered=true;save();go('goalQuiz');};
  const r2LoginBefore=SCREENS.login.mounted;
  SCREENS.login.mounted=function(){r2LoginBefore();const btn=$('#login-wechat'),before=btn.onclick;btn.onclick=()=>{before();if(state.route==='home'&&!V15().registered)go('inviteRegister');};};
  const r2PhotoBefore=ACTIONS['v15-photo-shot'];
  ACTIONS['v15-photo-shot']=()=>{const day=r2Today();if((V15().photoUsage[day]||0)>=V15().photoDailyLimit)return toast('今日识别次数已用完，请使用搜索或手填');V15().photoUsage[day]=(V15().photoUsage[day]||0)+1;save();r2PhotoBefore();};
  // Catalogue browsing, recent choices and favourites share the same food identities.
  const r2FoodBefore=ACTIONS['v15-food-pick'];
  ACTIONS['v15-food-pick']=n=>{V15().recentFoods=[n.dataset.name,...(V15().recentFoods||[]).filter(x=>x!==n.dataset.name)].slice(0,10);r2FoodBefore(n);save();};
  ACTIONS['r2-food-favorite']=n=>{const list=V15().favoriteFoods||[];V15().favoriteFoods=list.includes(n.dataset.name)?list.filter(x=>x!==n.dataset.name):[...list,n.dataset.name];save();render();};
  const r2SearchBefore=SCREENS.dietSearch.render;
  SCREENS.dietSearch.render=function(){const box=document.createElement('div');box.innerHTML=r2SearchBefore();const filter=V15().foodView||'全部';box.querySelector('.v15-search').insertAdjacentHTML('afterend','<div class="v15-tabs">'+['全部','最近','收藏'].map(t=>'<button class="'+(filter===t?'on':'')+'" data-act="r2-food-view" data-value="'+t+'">'+t+'</button>').join('')+'</div>');box.querySelectorAll('.v15-food-item').forEach(n=>{const name=n.dataset.name;if(filter==='最近'&&!(V15().recentFoods||[]).includes(name)||filter==='收藏'&&!(V15().favoriteFoods||[]).includes(name)){n.remove();return;}const wrapper=document.createElement('div');wrapper.className='r2-food-line';n.replaceWith(wrapper);wrapper.append(n);const fav=document.createElement('button');fav.className='r2-star';fav.dataset.act='r2-food-favorite';fav.dataset.name=name;fav.setAttribute('aria-label','收藏 '+name);fav.textContent=(V15().favoriteFoods||[]).includes(name)?'★':'☆';wrapper.append(fav);});if(!box.querySelector('.v15-food-item'))box.querySelector('.v15-food-list').innerHTML='<p class="v15-note">暂无符合条件的食物，试试其他分类或搜索。</p>';return box.innerHTML;};
  ACTIONS['r2-food-view']=n=>{V15().foodView=n.dataset.value;render();};
  const r2PortionBefore=ACTIONS['v15-portion-save'];
  ACTIONS['v15-portion-save']=()=>{const grams=Number($('#v15-grams')?.value);if(!Number.isFinite(grams)||grams<=0)return toast('请填写大于零的克重');V15().dietDraft.grams=grams;r2PortionBefore();};
  const r2CustomFoodBefore=ACTIONS['v15-custom-save'];
  ACTIONS['v15-custom-save']=()=>{const d=V15().dietDraft||{};for(const k of ['grams','kcal','carb','protein','fat','fiber','na','k','ca','fe','zn'])if(d[k]!=null&&d[k]!==''&&(!Number.isFinite(Number(d[k]))||Number(d[k])<0||(k==='grams'&&Number(d[k])===0)))return toast('重量须大于零，营养值须为非负数字');r2CustomFoodBefore();};
  document.addEventListener('input',event=>{if(event.target.id!=='v15-grams')return;const grams=Number(event.target.value);V15().dietDraft=V15().dietDraft||{};V15().dietDraft.grams=grams;const food=V15_FOODS.find(f=>f.name===V15().dietDraft.name);if(!food||!Number.isFinite(grams)||grams<=0)return;const item=v15PortionItem(food,grams,'午餐');const keys=['kcal','carb','protein','fat','fiber','na','k','ca','fe','zn'];document.querySelectorAll('.v15-dl dd').forEach((dd,i)=>{const k=keys[i],unit=i===0?'kcal':i<5?'g':'mg';dd.textContent=item[k]==null?'暂无':item[k]+' '+unit;});});
  // Exported inside the original IIFE so the v3.1 debugging interface stays intact.
  const R2_V15_API={rank:v15Rank,scores:v15TagScores,pref:v15PrefTags,questions:v15GoalQuestions,baseQuestions:V15_BASE_QUESTIONS,goalQuestions:V15_GOAL_QUESTIONS,foods:V15_FOODS,menu:V15_MENU,brands:SHOP_BRANDS,tags:V15_TAG_FEATURE,portion:v15PortionItem,bindInvite:r2BindInvite,today:r2Today,award:r2Award,save:()=>save()};

  const r3=window.R3, r3Key='duya-r4-ui-'+r3.user;
  const r3Me=()=>r3.state?.me;
  const r3Safe=fn=>async n=>{const button=n?.tagName==='BUTTON'?n:null;if(button?.disabled)return;try{if(button){button.disabled=true;button.setAttribute('aria-busy','true');}return await fn(n);}catch(e){toast(e.message);return false;}finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}};
  const r3Act=(name,fn)=>ACTIONS[name]=r3Safe(fn);
  const r3Date=()=>r3.state?localDay(r3.state.now).date:r2Today();
  const r3DraftRead=()=>{try{return JSON.parse(localStorage.getItem(r3Key)||'{}');}catch(e){return {};}};
  let r3UI=r3DraftRead(),r3Run=r3UI.run||null,r3Answers=r3UI.answers||{},r3Goal=r3UI.goal||'健康饮食';
  const r3SaveDraft=()=>localStorage.setItem(r3Key,JSON.stringify({...r3UI,run:r3Run,answers:r3Answers,goal:r3Goal}));
  function r3Apply(){const s=r3.state,u=s?.me;if(!u)return;Object.assign(state.profile,u.profile);state.goal=u.goal||'健康饮食';state.homeWeight=u.profile.weight;V15().answers=Object.fromEntries(Object.entries(u.answers).map(([goal,a])=>[goal,a.answers]));state.weights=JSON.parse(JSON.stringify(u.weights||[{date:r3Date()+' 12:00',value:u.profile.weight,delta:0}]));state.checkinDays=(u.checkins||[]).map(d=>Number(d.slice(8)));V15().coupons=u.wallet.map(c=>({...c,brands:c.brands.length?c.brands.map(id=>s.brands.find(b=>b.id===id)?.name||id).join('、'):'全部品牌'}));V15().mealBalance=u.mealBalance;V15().references=s.settings.references;V15().photoDailyLimit=s.settings.photoLimit;V15().invite={...V15().invite,code:u.inviteCode,activity:{start:s.settings.start,end:s.settings.end},cap:s.settings.cap,invited:s.inviteRelations.filter(x=>x.inviterId===u.id&&x.status==='有效').length,records:s.inviteRelations.filter(x=>x.inviterId===u.id).map(x=>({name:s.users.find(v=>v.id===x.userId)?.name,date:x.boundAt.slice(0,10),reward:x.rewardKeys.map(k=>s.users.flatMap(u=>u.rewards).find(r=>r.id===k)?.name||'').join('、'),status:x.status}))};const grouped={};for(const item of u.diet)(grouped[item.date]??=[]).push(item);V15().diet=grouped;if(!V15().dietDate||V15().dietDate==='2026-10-10')V15().dietDate=r3Date();V15_FOODS.splice(0,V15_FOODS.length,...s.foods.filter(f=>f.status==='启用'));V15_MENU.splice(0,V15_MENU.length,...s.menu);for(const b of SHOP_BRANDS){const srv=s.brands.find(x=>x.id===b.id);if(srv)Object.assign(b,{tags:srv.tags,status:srv.status});}DATA.orders=JSON.parse(JSON.stringify(u.orders));if(state.route!=='planForm'&&!state.deliveryDraft){state.plans=JSON.parse(JSON.stringify(u.delivery.plans));state.addresses=JSON.parse(JSON.stringify(u.delivery.addresses));state.dayChanges=JSON.parse(JSON.stringify(u.delivery.dayChanges));}const indicator=document.querySelector('#r3-sync');if(indicator)indicator.textContent='已连接 · '+u.name;}
  r3.on(()=>{r3Apply();if(!r3.busy&&['home','profile','coupons','invite','survey','recommend','dietHome','menu'].includes(state.route)&&!document.querySelector('.layer-root>*'))render();});
  r3.ready.then(()=>{if(r3UI.dietDraft)V15().dietDraft=r3UI.dietDraft;r3Apply();render();}).catch(()=>toast('本地数据尚未就绪'));
  const r3RestoreBase=restore;
  restore=function(){r3RestoreBase();state.route='login';};
  const r3SaveBase=save;
  save=function(){r3SaveBase();};
  SCREENS.login.mounted=function(){let yes=false;$('#login-tick').onclick=()=>$('#login-tick').classList.toggle('on',yes=!yes);$('#login-wechat').onclick=r3Safe(async()=>{if(!yes)return toast('请先阅读并同意协议');await r3.ready;r3Apply();go(r3Me().onboarded?'home':'onboarding',{root:true,tab:'home'});});};
  SCREENS.onboarding={title:'',noTab:true,navStyle:{bg:'#e8f6b7',ink:'#173b25'},render(){const f=r3UI.setup||{name:'',gender:'',birthday:'2000-01-01',height:170,weight:60,activity:'久坐不动',code:''};r3UI.setup=f;const b=f.birthday.split('-');return '<div class="r3-onboard"><header class="r3-welcome"><div><h1>初始设置</h1><p>请完善基础信息，开启健康生活。</p></div>'+assetImg('assets/health-illustration.png')+'</header><section class="r3-setup-card"><label>用户名称<input data-r3-setup="name" placeholder="请输入昵称" value="'+esc(f.name)+'"></label><h3>请选择你的性别</h3><div class="r3-genders">'+[['男','男生','gender-male-video.png'],['女','女生','gender-female-video.png']].map(([v,t,img])=>'<button class="'+(f.gender===v?'selected':'')+'" data-act="r3-gender" data-value="'+v+'">'+assetImg('assets/'+img)+'<span>我是'+t+'</span>'+(f.gender===v?'<i>✓</i>':'')+'</button>').join('')+'</div><h3>你的生日是</h3><div class="r3-birth">'+[['year',Number(b[0]),Array.from({length:90},(_,i)=>new Date().getFullYear()-i)],['month',Number(b[1]),Array.from({length:12},(_,i)=>i+1)],['day',Number(b[2]),Array.from({length:new Date(+b[0],+b[1],0).getDate()},(_,i)=>i+1)]].map(([k,value,list])=>'<select aria-label="'+({year:'出生年',month:'出生月',day:'出生日'}[k])+'" data-r3-birth="'+k+'">'+list.map(n=>'<option value="'+n+'" '+(n===value?'selected':'')+'>'+String(n).padStart(k==='year'?4:2,'0')+'</option>').join('')+'</select>').join('')+'</div>'+[['height','请选择你的身高','cm',100,220,1],['weight','请选择你的体重','kg',25,200,.1]].map(([key,title,unit,min,max,step])=>'<h3>'+title+'</h3><div class="r3-measure"><b id="r3-'+key+'-value">'+f[key]+'</b><span>'+unit+'</span></div><div class="r3-ruler"><input aria-label="'+title+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" data-r3-setup="'+key+'" value="'+f[key]+'"></div>').join('')+'<h3>你的活动水平为</h3><div class="r3-activities">'+['久坐不动','轻度活动','中度活动','高度活动','极高活动'].map(a=>'<button class="'+(f.activity===a?'selected':'')+'" data-act="r3-activity" data-value="'+a+'">'+a+'</button>').join('')+'</div><label class="r3-invite-field">邀请码 <small>选填</small><input maxlength="8" data-r3-setup="code" placeholder="有好友或商户邀请码可在此填写" value="'+esc(f.code)+'"></label><p class="r3-muted">暂时没有也可继续，注册7天内可在“我的→邀请码”补填一次。</p></section><div class="r3-bottom">'+v15Btn('开始使用','r3-setup-submit')+'</div></div>';}};
  document.addEventListener('input',e=>{const key=e.target.dataset.r3Setup;if(key){r3UI.setup[key]=['height','weight'].includes(key)?Number(e.target.value):e.target.value;const out=$('#r3-'+key+'-value');if(out)out.textContent=e.target.value;r3SaveDraft();}});
  document.addEventListener('change',e=>{const k=e.target.dataset.r3Birth;if(k){const b=r3UI.setup.birthday.split('-').map(Number);b[{year:0,month:1,day:2}[k]]=+e.target.value;b[2]=Math.min(b[2],new Date(b[0],b[1],0).getDate());r3UI.setup.birthday=b.map((n,i)=>String(n).padStart(i?2:4,'0')).join('-');r3SaveDraft();render();}});
  r3Act('r3-gender',n=>{r3UI.setup.gender=n.dataset.value;r3SaveDraft();render();});r3Act('r3-activity',n=>{r3UI.setup.activity=n.dataset.value;r3SaveDraft();render();});
  r3Act('r3-setup-submit',async()=>{await r3.cmd('PROFILE_COMPLETE',r3UI.setup);r3UI.setup=null;r3SaveDraft();go('home',{root:true,tab:'home'});bottomSheet('创建健康计划','<div class="r3-plan-prompt"><h3>是否现在创建健康计划？</h3><p>选择目标并完成问卷，获得更适合你的饮食建议。</p><div>'+v15Btn('暂不创建','r3-plan-skip','','ghost')+v15Btn('创建计划','r3-plan-create')+'</div></div>',{dismissible:true});});
  r3Act('r3-plan-skip',async()=>{await r3.cmd('PLAN_SKIP');closeAllLayers();go('home',{root:true,tab:'home'});});r3Act('r3-plan-create',()=>{closeAllLayers();go('goalQuiz');});
  const r3TrackBase=SCREENS.track.render;SCREENS.track.render=()=>r3Me()&&!r3Me().hasPlan?'<div class="v15-page r3-empty">'+art('goal-header')+'<h2>从一个小目标开始</h2><p>创建健康计划，找到适合你的饮食节奏。</p>'+v15Btn('创建健康计划','r3-plan-create')+'</div>':r3TrackBase();
  const r3NavBefore=navMarkup;navMarkup=function(){const html=r3NavBefore();if(!r3Me())return html;const box=document.createElement('div');box.innerHTML=html;const chip=box.querySelector('.nav-goal');if(chip)chip.innerHTML=esc(r3Me().hasPlan?r3Me().goal:'创建计划')+I('chev');return box.innerHTML;};
  ACTIONS['goal-chip']=()=>go(r3Me()?.hasPlan?'track':'goalQuiz');ACTIONS['goal-edit']=()=>go('goalQuiz');
  SCREENS.goalQuiz.render=function(){return '<div class="goal-quiz"><div class="goal-intro"><h1>你的目标是什么？</h1><p>选择一个目标，建立适合自己的饮食节奏。</p>'+art('goal-header')+'</div><div class="goal-options">'+[['健康饮食','goal-food'],['减重','goal-scale'],['增肌','goal-muscle'],['减脂','goal-fat']].map(([goal,img])=>'<button class="goal-option '+(r3Goal===goal?'active':'')+'" data-act="goal-pick" data-goal="'+goal+'">'+art(img)+'<span><b>'+goal+'</b><p>回答专属问卷，获得品牌推荐</p></span></button>').join('')+'</div>'+fixed(greenBtn('下一步 · 回答目标问卷','v15-goal-next'))+'</div>';};
  r3Act('goal-pick',n=>{r3Goal=n.dataset.goal;r3SaveDraft();render();});
  async function r3StartSurvey(id,mode){const previous=r3Run?.id,run=await r3.cmd('SURVEY_START',{surveyId:id,mode});r3Run=run;r3Answers=previous===run.id?r3Answers:(mode==='edit'?r3Me().answers[run.snapshot.goal]?.answers||{}:{});r3SaveDraft();go(run.snapshot.type==='goal'?'goalSurvey':'surveyRun');}
  r3Act('v15-goal-next',()=>{const s=r3.state.surveys.find(s=>s.type==='goal'&&s.goal===r3Goal);if(!s)throw Error('当前目标问卷暂不可用');return r3StartSurvey(s.id);});
  SCREENS.survey.render=function(){const me=r3Me();if(!me)return '<div class="r3-empty">正在加载问卷…</div>';const targets=r3.state.surveys.filter(s=>s.type==='goal'&&s.status==='已发布'),custom=r3.state.surveys.filter(s=>s.type==='custom'&&r3SurveyVisible(s));return '<div class="v15-page"><div class="r3-section-title"><h2>问卷调查</h2><p>更了解你，才能推荐更适合的品牌</p></div><section class="card v15-block"><h3>目标问卷</h3><p class="r3-muted">'+(me.hasPlan?'当前目标：'+me.goal:'尚未创建健康计划')+'</p>'+targets.filter(s=>s.goal===me.goal||me.answers[s.goal]).map(s=>'<button class="r3-list-card" data-act="r3-survey-start" data-id="'+s.id+'"><span><b>'+s.name+'</b><small>'+s.questions.length+'题 · 目标不变，可修改答案</small></span><em>查看并修改 ›</em></button>').join('')+(!me.hasPlan?v15Btn('创建目标计划','r3-plan-create'):'')+'</section><section class="card v15-block"><h3>问卷调研</h3>'+custom.map(s=>{const count=r3.state.answers.filter(a=>a.userId===me.id&&a.surveyId===s.id).length,done=s.limit&&count>=s.limit;return '<button class="r3-list-card" data-act="r3-survey-start" data-id="'+s.id+'"><span><b>'+esc(s.name)+'</b><small>有效期至 '+s.end+' · '+(s.limit?'剩余'+Math.max(0,s.limit-count)+'次':'不限次数')+'</small><small>奖励：'+r3RewardText(s.reward)+'</small></span><em>'+(done?'已完成':'去作答 ›')+'</em></button>';}).join('')+(!custom.length?'<p class="r3-muted">暂时没有可参与的调研</p>':'')+'</section></div>';};
  function r3SurveyVisible(s){const u=r3Me(),day=r3Date();return s.status==='已发布'&&(!s.start||s.start<=day)&&(!s.end||s.end>=day)&&(s.audience!=='new'||Date.parse(r3.state.now)-Date.parse(u.registeredAt)<=168*3600000)&&(s.audience!=='paid'||u.orders.length)&&(s.audience!=='users'||s.userIds?.includes(u.id))&&(s.audience!=='group'||s.group!=='已记录饮食用户'||u.diet.length);}
  function r3RewardText(rows){return rows?.length?rows.map(r=>r.type==='coupon'?(r3.state.templates.find(t=>t.id===r.couponId)?.name||'优惠券'):r.type==='meal'?'赠餐'+r.count+'餐':r.name).join(' / '):'无奖励';}
  r3Act('r3-survey-start',n=>r3StartSurvey(n.dataset.id,'edit'));r3Act('v15-custom',n=>r3StartSurvey(n.dataset.id));
  function r3SurveyRunHTML(){if(!r3Run)return '<div class="r3-empty">请先从问卷中心进入</div>';const s=r3Run.snapshot;return '<div class="v15-page"><section class="r3-banner"><h2>'+esc(s.name)+'</h2><p>'+s.questions.length+'题 · '+(s.type==='goal'?'仅用于品牌推荐，不发放奖励':'完成后：'+r3RewardText(s.reward))+'</p></section>'+s.questions.map((q,qi)=>'<section class="card v15-question"><h2>'+(qi+1)+'. '+esc(q.text)+'</h2><p class="r3-muted">'+(q.type==='multi'?'可多选':'请选择一项')+'</p><div class="v15-opts">'+q.options.map((o,i)=>'<button class="v15-opt '+([].concat(r3Answers[q.id]??[]).includes(i)?'on':'')+'" data-act="r3-answer" data-q="'+q.id+'" data-i="'+i+'">'+esc(o.text)+'</button>').join('')+'</div></section>').join('')+v15Fixed(v15Btn('提交问卷','r3-survey-submit'))+'</div>';}
  SCREENS.goalSurvey.render=r3SurveyRunHTML;SCREENS.surveyRun.render=r3SurveyRunHTML;
  r3Act('r3-answer',n=>{const q=r3Run.snapshot.questions.find(q=>q.id===n.dataset.q),i=+n.dataset.i;if(q.type==='multi'){const cur=r3Answers[q.id]||[];r3Answers[q.id]=cur.includes(i)?cur.filter(x=>x!==i):[...cur,i];}else r3Answers[q.id]=i;r3SaveDraft();const scroll=$('#stage').scrollTop;render();$('#stage').scrollTop=scroll;});
  r3Act('r3-survey-submit',async()=>{const result=await r3.cmd('SURVEY_SUBMIT',{runId:r3Run.id,answers:r3Answers},'submit-'+r3Run.id);const goal=r3Run.snapshot.type==='goal';r3Run=null;r3Answers={};r3SaveDraft();go(goal?'recommend':'survey');if(result.reward)confirmModal('问卷已完成',esc(result.reward.name+' · '+result.reward.status+(result.reward.reason?' · '+result.reward.reason:'')),'我知道了',()=>{});});
  SCREENS.surveyResult.render=()=>SCREENS.recommend.render();
  SCREENS.recommend.render=function(){const u=r3Me(),rank=u?.recommendations;if(!u?.hasPlan||!rank?.rows.length)return '<div class="v15-page r3-empty">'+art('goal-header')+'<h2>先了解你的饮食目标</h2><p>完成目标问卷，为你推荐合适品牌。</p>'+v15Btn('创建或完善计划','r3-plan-create')+'</div>';const offset=V15().recommend.offset||0;return '<div class="v15-page"><section class="r3-banner"><h2>为你推荐的品牌</h2><p>'+u.goal+' · '+rank.pref.join('、')+'</p></section>'+rank.rows.slice(offset,offset+3).map((r,i)=>'<section class="card v15-rec-card"><div class="v15-rec-head"><span class="v15-rank">'+(offset+i+1)+'</span>'+shopImg(shopBrand(r.brand.id).cover,'v15-rec-logo')+'<div><b>'+esc(r.brand.name)+'</b><p>契合度 '+Math.round(r.cover*100)+'%</p></div></div>'+v15TagRow(r.hitTags,'v15-chip-hit')+'<p>'+esc(r.hitTags.length?r.hitTags.join('、')+'，和你的饮食偏好更契合':'可作为日常搭配选择')+'</p>'+(r.penalty?'<p class="v15-warn">含低分偏好，已降档</p>':'')+v15Btn('查看品牌','v3-brand','data-id="'+r.brand.id+'"','ghost')+'</section>').join('')+'<div class="v15-actions-row">'+v15Btn(offset?'返回前三名':'换一批',offset?'v15-reset-offset':'v15-more','','ghost')+v15Btn('查看全部品牌','v15-all-brands')+'</div></div>';};
  SCREENS.invite.render=function(){const s=r3.state,u=r3Me();if(!u)return '';const binding=u.binding,deadline=new Date(Date.parse(u.registeredAt)+168*3600000),can=!binding&&Date.parse(s.now)<=deadline.getTime(),rels=s.inviteRelations.filter(r=>r.inviterId===u.id);return '<div class="v15-page"><section class="r3-banner"><h2>邀请与福利</h2><p>把健康饮食分享给身边的人</p></section><section class="card v15-block"><h3>我收到的邀请码</h3>'+(binding?'<div class="r3-bound">✓ 已绑定 '+esc(binding.code)+'</div><p class="r3-muted">'+binding.source+' · 绑定后不可更换</p>':can?'<p class="r3-muted">可补填至 '+deadline.toLocaleString('zh-CN')+'。已有订单也可补填，绑定前订单不追溯计入业绩。</p><input id="r3-bind-code" value="'+esc(r3UI.bindCode||'')+'" maxlength="8" placeholder="填写好友或商户的8位邀请码">'+v15Btn('确认绑定','r3-bind'):'<p class="r3-muted">注册已超过7天，补填资格已结束。</p>')+'</section><section class="card v15-block"><h3>我的邀请码</h3>'+(!s.settings.enabled?'<p class="r3-muted">邀请活动暂未开启</p>':'<p class="r3-muted">活动时间 '+s.settings.start+' 至 '+s.settings.end+'</p><div class="v15-code">'+(u.inviteCode||'尚未生成')+'</div>'+(!u.inviteCode?v15Btn('生成我的邀请码','v15-gen-code'):v15Btn('复制邀请码','v15-copy-code','','ghost')+v15Btn('分享海报','v15-poster','','ghost'))+'<p>已邀请 '+rels.filter(r=>r.status==='有效').length+' / '+s.settings.cap+' 人</p><p class="r3-muted">'+(s.settings.target==='both'?'双方均可获奖':s.settings.target==='old'?'邀请人可获奖':'新用户可获奖')+'，注册并成功绑定后发放。</p>')+'</section><section class="card v15-block"><h3>邀请记录</h3>'+rels.map(r=>'<div class="r3-list-card"><span><b>'+esc(s.users.find(x=>x.id===r.userId)?.name)+'</b><small>'+r.boundAt.slice(0,10)+' · '+r.status+'</small><small>'+r.rewardKeys.map(k=>s.users.flatMap(x=>x.rewards).find(e=>e.id===k)).filter(Boolean).map(e=>e.name+' · '+e.status).join('、')+'</small></span></div>').join('')+(!rels.length?'<p class="r3-muted">还没有邀请记录，分享给朋友试试吧。</p>':'')+'</section></div>';};
  r3Act('r3-bind',async()=>{await r3.cmd('INVITE_BIND',{code:$('#r3-bind-code').value});r3UI.bindCode='';r3SaveDraft();render();toast('邀请码已绑定，奖励可在福利记录查看');});r3Act('v15-gen-code',async()=>{await r3.cmd('INVITE_GENERATE');render();});r3Act('v15-copy-code',async()=>{await navigator.clipboard.writeText(r3Me().inviteCode);toast('邀请码已复制');});
  const r3CouponBase=SCREENS.coupons.render;SCREENS.coupons.render=function(){const html=r3CouponBase();const u=r3Me();return html.replace('</div>',(u?.rewards.some(r=>r.status!=='已发放')?'<p class="r3-muted">有奖励待处理，请查看下方奖励记录。</p>':'')+'</div>')+'<div class="v15-page"><section class="card v15-block"><h3>奖励记录</h3>'+(u?.rewards||[]).map(r=>'<div class="r3-list-card"><span><b>'+esc(r.name)+'</b><small>'+esc(r.source)+' · '+r.status+'</small><small>'+esc(r.reason||'')+'</small>'+(r.image?'<img class="r3-reward-image" src="'+esc(r.image)+'">':'')+'</span></div>').join('')+'</section></div>';};
  r2CouponReason=function(c,price,brandId){if(!c||c.status!=='可用')return '优惠券不可用';if(c.expire<r3Date())return '已过期';if(c.start>r3Date())return '尚未生效';if(price<c.threshold)return '未满门槛';const raw=r3Me()?.wallet.find(w=>w.id===c.id);if(raw?.brands.length&&!raw.brands.some(b=>b===brandId||b===shopBrand(brandId).name||b===shopBrand(brandId).name.replace('Leapeer ','')))return '品牌不可用';return '';};
  v15BestCoupon=function(price){return V15().coupons.filter(c=>!r2CouponReason(c,price,state.checkout?.brandId)).sort((a,b)=>b.amount-a.amount)[0]||null;};
  let r3PayBusy=false;
  paid=async function(){if(r3PayBusy||!state.checkout||state.checkout.paid)return;r3PayBusy=true;try{const c=state.checkout,coupon=r2SelectedCoupon();const order=await r3.cmd('PAY',{brandId:c.brandId,packageId:c.packageId,couponId:coupon?.id||null,token:c.token},'pay-'+c.token);c.pin='';c.paid=true;c.orderId=order.id;state.activeOrderId=order.id;V15().checkoutCoupon='auto';r3Apply();save();openShopPlans();}catch(e){if(state.checkout)state.checkout.pin='';toast(e.message);}finally{r3PayBusy=false;}};
  shopFinish=async function(){try{const c=state.checkout,p=shopPlan();if(!c?.paid||!p)return;const min=earliest(SHOP.now());if(!c.date||c.date<min||!matches(c.date,p))return toast('请选择有效的开始配送日期');await r3.cmd('DELIVERY_UPDATE',{plans:state.plans,addresses:state.addresses,dayChanges:state.dayChanges});await r3.cmd('ORDER_ACTIVATE',{orderId:c.orderId,date:c.date,planId:p.id});c.complete=true;state.orderDetailId=c.orderId;closeAllLayers();go('orderSuccess');}catch(e){toast(e.message);}};
  for(const name of ['plan-save','d31-save','plan-del','v3-plan-delete','address-save','addr-save'])if(ACTIONS[name]){const before=ACTIONS[name];ACTIONS[name]=r3Safe(async n=>{before(n);if(name==='plan-save'&&state.route==='planForm'||name==='d31-save'&&state.deliveryDraft||name==='addr-save'&&state.route==='addressEdit')return;const delivery={plans:JSON.parse(JSON.stringify(state.plans)),addresses:JSON.parse(JSON.stringify(state.addresses)),dayChanges:JSON.parse(JSON.stringify(state.dayChanges))};await r3.cmd('DELIVERY_UPDATE',delivery);});}
  r3Act('v15-portion-save',async()=>{const draft=V15().dietDraft||{},f=V15_FOODS.find(f=>f.name===draft.name),grams=Number($('#v15-grams').value);if(!f)throw Error('请先选择食物');await r3.cmd('DIET_ADD',{foodId:f.id,grams,meal:draft.meal||'午餐',date:V15().dietDate||r3Date()});go('dietHome');toast('饮食已记录');});
  r3Act('v15-custom-save',async()=>{document.querySelectorAll('[data-act="v15-custom-field"]').forEach(n=>{V15().dietDraft[n.dataset.key]=n.value;});await r3.cmd('DIET_ADD',{...V15().dietDraft,meal:V15().dietDraft?.meal||'午餐',date:V15().dietDate||r3Date()});r3UI.dietDraft=null;r3SaveDraft();go('dietHome');});
  r3Act('v15-menu-pick',async n=>{await r3.cmd('DIET_ADD',{menuId:n.dataset.id,grams:350,meal:V15().dietDraft?.meal||'午餐',date:V15().dietDate||r3Date()});closeAllLayers();go('dietHome');});
  r3Act('v15-diet-del',async n=>{const item=(V15().diet[V15().dietDate]||[]).filter(i=>i.meal===n.dataset.meal)[+n.dataset.i];if(item)await r3.cmd('DIET_DELETE',{id:item.id});render();});
  r3Act('v15-copy-yesterday',async()=>{const day=V15().dietDate||r3Date(),items=r3Me().diet.filter(i=>i.date===addDay(day,-1));if(!items.length)return toast('昨天还没有记录');await r3.cmd('DIET_COPY',{ids:items.map(i=>i.id),date:day});closeAllLayers();render();toast('已复制昨天的记录');});
  r3Act('v15-photo-shot',async()=>{V15().photoStep='analyzing';render();try{const r=await r3.cmd('PHOTO');await new Promise(res=>setTimeout(res,650));V15().photoCandidates=r.candidates;V15().photoStep='done';render();}catch(e){V15().photoStep='idle';render();throw e;}});
  r3Act('v15-barcode-report',async()=>{await r3.cmd('BARCODE_REPORT',{code:V15().barcode});toast('已提交条码补录');});
  const r3PlanConfirmBase=ACTIONS['v3-plan-confirm'];r3Act('v3-plan-confirm',async n=>{const id=state.shopChangingOrder;if(id){await r3.cmd('ORDER_PLAN_CHANGE',{orderId:id,planId:n.dataset.id});state.shopChangingOrder=null;closeAllLayers();render();toast('配送计划已更新');}else r3PlanConfirmBase(n);});
  for(const action of ['plan-del','v3-plan-delete'])r3Act(action,n=>{const id=n?.dataset.id||state.editingPlanId;if(DATA.orders.some(o=>o.status==='进行中'&&o.planId===id))throw Error('正在使用的计划不可删除');confirmModal('删除配送计划','确定删除该配送计划吗？','删除',r3Safe(async()=>{await r3.cmd('DELIVERY_UPDATE',{plans:state.plans.filter(p=>p.id!==id),addresses:state.addresses,dayChanges:state.dayChanges});go('plans');}));});
  const r3MetricsBase=metricsStrip;
  metricsStrip=function(){const box=document.createElement('div');box.innerHTML=r3MetricsBase();const n=box.querySelector('.ms-cell.left .num');if(n)n.innerHTML=n1(state.profile.startWeight-state.profile.weight);return box.innerHTML;};
  weightChartCard=function(){const list=(r3Me()?.weights||[{value:state.profile.weight,date:r3Date()}]).slice(0,7).reverse(),vals=list.map(w=>w.value),low=Math.min(...vals)-1,high=Math.max(...vals)+1,points=vals.map((v,i)=>[(i+1)*280/(vals.length+1),(high-v)/(high-low)*60+5]),line=points.map(p=>p.join(',')).join(' ');return '<section class="card weight-chart-card"><div class="r3-real-chart"><span>'+n1(high)+'kg</span><svg viewBox="0 0 300 80"><path d="M0 10H300M0 40H300M0 70H300" stroke="#e4e9df"/>'+(points.length>1?'<polyline points="'+line+'" fill="none" stroke="#83ac2c" stroke-width="2"/>':'')+points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#85ae2e"/>').join('')+'</svg><span>'+n1(low)+'kg</span><div>'+list.map(w=>'<small>'+w.date.slice(5,10)+'</small>').join('')+'</div></div><p class="r3-muted">'+(list.length===1?'已记录初始体重，继续记录后可查看变化趋势。':'展示实际录入的体重记录。')+'</p><button class="r3-weight-link" data-act="weight-page">记录体重 ›</button></section>';};
  const r3HomeBase=SCREENS.home.render;SCREENS.home.render=function(){const box=document.createElement('div');box.innerHTML=r3HomeBase().replace(/10月10日 星期六/g,r3Date().replace(/^\d{4}-/,'').replace('-','月')+'日');const check=box.querySelector('.checkin-card,.record-checkin');if(check){const dates=r3Me()?.checkins||[],today=dates.includes(r3Date());check.innerHTML='<h3>已累计打卡 '+dates.length+' 天</h3><p class="r3-muted">每天一点小坚持，记录自己的健康节奏。</p>'+greenBtn(today?'今日已打卡':'立即打卡','checkin');}return box.innerHTML;};
  r3Act('checkin',async()=>{await r3.cmd('CHECKIN');render();});r3Act('record-weight-save',async()=>{await r3.cmd('WEIGHT_SAVE',{weight:Number($('#record-weight').value)});render();toast('体重已记录');});
  const r3DietBase=SCREENS.dietHome.render;SCREENS.dietHome.render=()=>r3.state&&!r3.state.settings.dietEnabled?'<div class="v15-page r3-empty"><h2>饮食记录暂未开启</h2><p>管理员开启后即可记录。</p></div>':r3DietBase();
  ACTIONS['record-diet']=()=>{V15().dietDate=r3Date();go('dietHome');};
  document.addEventListener('r3-offline',()=>{const n=$('#r3-sync');if(n)n.textContent='连接中断 · 操作不会假保存';});
  window.__r3Mini={apply:r3Apply,get run(){return r3Run;},get setup(){return r3UI.setup;}};
  window.addEventListener('DOMContentLoaded',()=>{document.querySelector('#reset-demo')?.remove();const toolbar=document.createElement('aside');toolbar.className='r3-demo-tools';toolbar.innerHTML='<b>本地文件演示</b><label>演示账户<select id="r3-account"><option value="NEW">首次登录用户</option><option value="INV">邀请人 · 已有计划</option><option value="PAID">已购新用户 · 可补填</option></select></label><span id="r3-sync">正在连接共享服务…</span>';document.body.append(toolbar);$('#r3-account').value=r3.user;$('#r3-account').onchange=e=>{localStorage.setItem('duya-local-r39-mini-user',e.target.value);location.reload();};r3Apply();});

  document.addEventListener('input',e=>{if(e.target.dataset.act==='v15-custom-field'){V15().dietDraft=V15().dietDraft||{};V15().dietDraft[e.target.dataset.key]=e.target.value;r3UI.dietDraft={...V15().dietDraft};r3SaveDraft();}if(e.target.id==='r3-bind-code'){r3UI.bindCode=e.target.value;r3SaveDraft();}});
  document.addEventListener('r3-online',()=>{document.querySelector('#r3-sync').textContent='已连接 · '+(r3Me()?.name||'');});

  r3Act('v15-barcode-scan',()=>{const food=V15_FOODS.find(f=>f.barcode);V15().barcode=food?.barcode||'6909999999999';render();});

  const r3NewPlan=ACTIONS['plan-new'];r3Act('plan-new',()=>{r3NewPlan();const a=state.addresses[0];Object.assign(state.planForm,{addressText:a?[a.region,a.street,a.door].filter(Boolean).join(''):'',contact:a?.name||'',phone:a?.phone||''});render();});
  const r3PlanForm=SCREENS.planForm.render;SCREENS.planForm.render=function(){const box=document.createElement('div');box.innerHTML=r3PlanForm();const n=box.querySelector('.plan-address'),f=state.planForm;if(n)n.innerHTML='<span>'+esc(f.addressText||'请选择配送地址')+(f.contact?'<br>'+esc(f.contact+' '+f.phone):'')+'</span>'+I('chev');return box.innerHTML;};
  r3Act('plan-address',()=>sheet({title:'选择配送地址',body:state.addresses.map(a=>'<button class="record-address-choice" data-act="plan-address-pick" data-id="'+a.id+'"><b>'+esc([a.region,a.street,a.door].filter(Boolean).join(''))+'</b><p>'+esc(a.name+' '+a.phone)+'</p></button>').join('')+v15Btn('新建配送地址','r3-plan-address-new')}));
  r3Act('r3-plan-address-new',()=>{state.r3AddressReturn=true;state.addressDraft={name:'',phone:'',street:'',door:'',region:'',tag:'家',def:false};state.editingAddressId=null;closeAllLayers();go('addressEdit');});
  const r3AddressSave=ACTIONS['addr-save'];r3Act('addr-save',async n=>{const result=await r3AddressSave({dataset:n?.dataset||{}});if(state.r3AddressReturn&&state.route!=='addressEdit'&&result!==false){const draft=state.addressDraft,a=state.addresses.find(a=>a.name===draft.name&&a.phone===draft.phone&&a.street===draft.street);if(a)Object.assign(state.planForm,{addressText:[a.region,a.street,a.door].filter(Boolean).join(''),contact:a.name,phone:a.phone});state.r3AddressReturn=false;go('planForm');}});
  const r3PlanSave=ACTIONS['plan-save'];r3Act('plan-save',async n=>{if(!state.planForm.addressText||!state.planForm.contact||!/^1\d{10}$/.test(state.planForm.phone||''))throw Error('请先选择有效配送地址');return r3PlanSave({dataset:n?.dataset||{}});});

  const r4Home=window.DuyaHomeR4;
  // The existing restore() only restores keys already declared on state.
  state.drinkMl ??= 0;
  const r4Paths={
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-9 5 2 2 4-4"/>',
    flame:'<path d="M13 2c1 6-5 6-3 11 2-1 3-3 3-5 4 3 7 6 6 10-1 4-9 6-13 1C2 14 6 9 8 7c-1 5 0 5 1 5 0-5 4-7 4-10Z"/>',
    meal:'<path d="M8 10a4 4 0 1 1 1-7 4 4 0 0 1 7 0 4 4 0 1 1 1 7l-2 2v8H9v-8Z"/><path d="M10 9v4m4-4v4"/>',
    cube:'<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5M3 7l9 5v10"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    arrow:'<path d="m9 5 7 7-7 7"/>',down:'<path d="m6 9 6 6 6-6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',more:'<circle cx="5" cy="12" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="19" cy="12" r=".8"/>',
    bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4M12 2v2"/>',
    news:'<rect x="3" y="3" width="14" height="18" rx="2"/><path d="M17 8h4v11a2 2 0 0 1-2 2M7 7h6M7 11h6M7 15h4"/>',
    glass:'<path d="m6 7 2 14h9l2-14ZM13 11l4-9h4"/><path d="m7 13 4-1 4 2 3-1" stroke="#35bfd0" stroke-width="3"/>'
  };
  const r4Icon=(type,cls='')=>'<svg class="r4-icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(r4Paths[type]||r4Paths.cube)+'</svg>';
  let r4CalendarOpen=false;
  function r4Calendar(today,checkins){const year=+today.slice(0,4),month=+today.slice(5,7),offset=new Date(Date.UTC(year,month-1,1)).getUTCDay(),days=new Date(Date.UTC(year,month,0)).getUTCDate();return '<div class="r4-month"><b>'+year+'年'+month+'月</b><div>'+['日','一','二','三','四','五','六'].map(d=>'<small>'+d+'</small>').join('')+Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,i)=>{const day=year+'-'+String(month).padStart(2,'0')+'-'+String(i+1).padStart(2,'0');return '<span class="'+(checkins.includes(day)?'done ':'')+(day===today?'today':'')+'">'+(i+1)+(checkins.includes(day)?'<i>✓</i>':'')+'</span>';}).join('')+'</div><p>仅展示实际打卡记录</p></div>';}
  function r4CheckinCard(){const today=r3Date(),dates=r3Me()?.checkins||[],done=dates.includes(today);return '<section class="r4-card r4-checkin" data-r4-section="checkin"><h3>'+r4Icon('calendar')+'<span>已连续打卡 <em>'+r4Home.streak(today,dates)+'</em> 天</span></h3><div class="r4-week">'+r4Home.week(today,dates).map(d=>'<button class="'+(d.today?'today ':'')+(d.future?'future ':'')+(d.done?'done':'')+'" data-act="r4-checkin-day" data-date="'+d.date+'"><small>'+d.weekday+'</small><span>'+d.label+'</span>'+(d.done?'<i>✓</i>':'')+'</button>').join('')+'</div><div class="r4-checkin-actions"><button class="r4-check-button" data-act="checkin" '+(done?'disabled':'')+'>'+ (done?'今日已打卡':'立即打卡')+'</button><button class="r4-round '+(r4CalendarOpen?'expanded':'')+'" data-act="r4-calendar-toggle" aria-label="'+(r4CalendarOpen?'收起打卡日历':'展开打卡日历')+'" aria-expanded="'+r4CalendarOpen+'">'+r4Icon('down')+'</button></div>'+(r4CalendarOpen?r4Calendar(today,dates):'')+'</section>';}
  function r4Announcement(){return '<button class="r4-card r4-announcement" data-r4-section="announcement" data-act="notice"><span class="r4-notice-icon">'+r4Icon('bell')+'<small>公告</small></span><span class="r4-notice-copy"><b>'+esc(DATA.banner.title)+'</b><time>'+esc(DATA.banner.date)+'</time></span>'+r4Icon('arrow')+'</button>';}
  function r4IntakeCard(items){const t=r4Home.intake(items,r3.state?.settings.references?.kcal);return '<section class="r4-card r4-intake" data-r4-section="intake"><header><h3>'+r4Icon('flame')+'今日热量摄入</h3>'+(t.budget?'<span class="r4-status '+(t.within?'':'over')+'"><i></i>'+(t.within?'范围内':'已超出')+'</span>':'')+'</header><div class="r4-energy"><div><b>'+v15Num(t.total)+'</b><span> kcal'+(t.budget?' / '+v15Num(t.budget):'')+'</span></div>'+(t.budget?'<p>'+(t.excess?'已超出':'剩余可摄入')+' <strong class="'+(t.excess?'over':'')+'">'+v15Num(t.excess||t.remaining)+' kcal</strong></p>':'')+'</div>'+(t.budget?'<div class="r4-progress"><span style="width:'+t.percent+'%"></span><i style="left:clamp(12px,'+t.percent+'%,calc(100% - 12px))">'+r4Icon('flame')+'</i></div>':'')+'<button class="r4-water" data-act="water" aria-label="记录饮水"><span class="r4-glass">'+r4Icon('glass')+'</span><span><small>今日饮水</small><b>'+v15Num((state.drinkMl||0)/1000,2)+' <em>L</em></b></span><i class="r4-water-add">'+r4Icon('plus')+'</i><svg class="r4-wave" viewBox="0 0 360 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 15Q70 0 140 12T280 5T420 14V20H0Z" fill="#b7f1fa"/><path d="M0 18Q100 9 170 15T360 12V20H0Z" fill="#d7f8fc"/></svg></button></section>';}
  function r4DietCard(items){const enabled=r3.state?.settings.dietEnabled!==false;return '<section class="r4-card r4-diet" data-r4-section="diet"><header><h3>'+r4Icon('meal')+'今日饮食记录</h3><button class="r4-history" data-act="r4-diet-history">'+r4Icon('clock')+'历史记录</button></header>'+(items.length?'<div class="r4-diet-list">'+items.map(item=>'<button class="r4-diet-row" data-act="r4-diet-view" data-id="'+esc(item.id)+'"><img src="assets/shop-salad.png" alt="" class="r4-food-thumb"><span class="r4-food-copy"><span><b>'+esc(item.name)+'</b>'+(item.source?'<small>'+esc(item.source)+'</small>':'')+'</span><span class="r4-food-energy">'+(item.pending?'<em class="r4-pending">待补录</em>':item.kcal==null?'<em class="r4-pending">热量暂无</em>':'<strong>'+v15Num(item.kcal)+'</strong> kcal')+'</span></span><span class="r4-round r4-more" aria-hidden="true">'+r4Icon('more')+'</span></button>').join('')+'</div>':'<div class="r4-empty-diet">'+assetImg('assets/diet-empty.png')+'<p>'+(enabled?'今天还没有饮食记录':'饮食记录暂未开启')+'</p></div>')+'<button class="r4-add-diet" data-act="r4-diet-add" '+(!enabled?'disabled':'')+'><i>'+r4Icon('plus')+'</i>手动添加饮食</button></section>';}
  function r4QuickCard(){return '<section class="r4-card r4-quick" data-r4-section="quick"><h3>'+r4Icon('cube')+'快捷入口</h3><div>'+[['health','健康档案','icon-health.png'],['address','地址管理','icon-address.png'],['tomorrow','次日改单','icon-order-all.png']].map(([key,label,img])=>'<button data-act="quick" data-key="'+key+'"><span>'+assetImg('assets/'+img)+'</span><b>'+label+'</b></button>').join('')+'</div></section>';}
  const r4PreviousHome=SCREENS.home.render;
  SCREENS.home.render=function(){const box=document.createElement('div');box.innerHTML=r4PreviousHome();const page=box.querySelector('.home-page');if(!page)return box.innerHTML;const article=page.querySelector('.article-card')?.cloneNode(true),items=(r3Me()?.diet||[]).filter(i=>i.date===r3Date());let cut=false;for(const child of [...page.children]){if(child.matches('.checkin-card'))cut=true;if(cut)child.remove();}const stack=document.createElement('div');stack.className='r4-home-stack';stack.innerHTML=r4CheckinCard()+r4Announcement()+r4IntakeCard(items)+r4DietCard(items)+r4QuickCard();if(article){article.classList.add('r4-card','r4-home-articles');article.dataset.r4Section='articles';const title=article.querySelector('.record-section-title');if(title)title.innerHTML=r4Icon('news')+'营养资讯';stack.append(article);}page.append(stack);return box.innerHTML;};
  ACTIONS['r4-calendar-toggle']=()=>{const scroll=$('#stage').scrollTop;r4CalendarOpen=!r4CalendarOpen;render();$('#stage').scrollTop=scroll;};
  ACTIONS['r4-checkin-day']=n=>{const date=n.dataset.date;toast(date+' '+((r3Me()?.checkins||[]).includes(date)?'已打卡':date>r3Date()?'尚未到来':'未打卡'));};
  ACTIONS['r4-diet-history']=()=>{V15().dietDate=r3Date();go('dietHome');};
  ACTIONS['r4-diet-view']=n=>{V15().dietDate=r3Date();go('dietHome');};
  ACTIONS['r4-diet-add']=()=>{if(r3.state?.settings.dietEnabled===false)return toast('饮食记录暂未开启');V15().dietDate=r3Date();bottomSheet('选择餐次','<div class="v15-sheet-grid">'+['早餐','午餐','晚餐','加餐'].map(meal=>'<button data-act="v15-add-open" data-meal="'+meal+'">'+meal+'</button>').join('')+'</div>',{dismissible:true});};
  window.__r4Home={model:r4Home,get calendarOpen(){return r4CalendarOpen;}};

  /* ============================ 启动 ============================ */
  restore();
  render();
  window.__duya = {
    state, go, back, render, toast, DATA, I, openLayer, closeLayer, shop:SHOP, delivery31:DELIVERY31, v15:R2_V15_API,
    confirmModal, bottomSheet, pickerSheet, screen, ACTIONS, $, $$,
    SCREENS, has: (route) => !!SCREENS[route],
  };
})();
