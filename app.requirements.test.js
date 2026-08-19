const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Admin（无密码）/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');

const pageUrl = `file:///D:/Project/DuYaGuanJia/new-chat/back/index.html?test=${Date.now()}`;
let browser;
let page;
const pageErrors = [];

async function navigate(pageId) {
  await page.locator(`.sidebar-nav button[data-action="navigate"][data-page="${pageId}"]`).click();
  await page.waitForTimeout(50);
}

test.before(async () => {
  browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(pageUrl);
  await page.locator('#login-account').fill('admin');
  await page.locator('#login-password').fill('Raven@2026');
  await page.locator('#login-submit').click();
  await page.locator('.sidebar-nav').waitFor();
});

test.after(async () => {
  await browser?.close();
});

test.beforeEach(async () => {
  const closeButton = page.locator('button[data-action="close-modal"]');
  if (await closeButton.count()) await closeButton.first().click();
});

test('顶部栏不显示全局搜索和帮助按钮', async () => {
  assert.equal(await page.locator('#global-search').count(), 0);
  assert.equal(await page.locator('button[data-action="help"]').count(), 0);
});

test('每周菜单视图保持左侧且切换设置组靠最右侧', async () => {
  await navigate('menu');
  const layout = await page.locator('.menu-actions-bar').evaluate((bar) => {
    const view = bar.querySelector('.seg-group').getBoundingClientRect();
    const settings = bar.querySelector('.menu-switch-settings')?.getBoundingClientRect();
    const bounds = bar.getBoundingClientRect();
    return settings ? {
      viewLeft: view.left,
      barLeft: bounds.left,
      settingsLeft: settings.left,
      settingsRight: settings.right,
      barRight: bounds.right,
    } : null;
  });
  assert.ok(layout, '菜单切换设置需要独立成组');
  assert.ok(layout.viewLeft - layout.barLeft < 30, '左侧视图按钮不应移动');
  assert.ok(layout.settingsLeft > layout.viewLeft, '切换设置组应位于视图按钮右侧');
  assert.ok(layout.barRight - layout.settingsRight < 25, '切换设置组应贴近操作栏最右侧');
});

test('菜单汇总展示本周下周上传情况且平铺视图使用两组日期范围', async () => {
  await navigate('menu');
  const summary = await page.locator('.menu-upload-summary').innerText();
  assert.match(summary, /本周[\s\S]*已上传\s*\d+[\s\S]*未上传\s*\d+/);
  assert.match(summary, /下周[\s\S]*已上传\s*\d+[\s\S]*未上传\s*\d+/);
  assert.doesNotMatch(summary, /预警/);
  assert.equal(await page.locator('.menu-switch-settings small.cell-sub').count(), 0);
  await page.locator('[data-action="menu-view-tab"][data-value="grid"]').click();
  assert.equal(await page.locator('[data-filter="menuGridSearch"]').count(), 0);
  assert.equal(await page.locator('[data-filter="menuGridWeek"]').count(), 0);
  assert.equal(await page.locator('[data-filter="menuGridUploaded"]').count(), 0);
  assert.equal(await page.locator('.menu-date-range').count(), 2);
  await page.locator('[data-filter="menuGridWeekStart"]').fill('2026-08-10');
  await page.locator('[data-action="apply-filters"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /日期范围不完整/);
  await page.locator('[data-filter="menuGridWeekEnd"]').fill('2026-08-16');
  await page.locator('[data-action="apply-filters"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /已应用筛选/);
});

test('订单列表退款金额列上方显示金额下方显示退款时间', async () => {
  await navigate('orders');
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.equal(headers[5], '退款金额');
  const refundStatus = page.locator('table.data-table tbody .status').filter({ hasText: '退款' }).first();
  const refundRow = refundStatus.locator('xpath=ancestor::tr');
  const refundCell = await refundRow.locator('td').nth(5).innerText();
  assert.match(refundCell, /¥[\d,.]+/);
  assert.match(refundCell, /\d{4}-\d{2}-\d{2}/);
});

test('套餐购买入口合并到订单管理且导航只保留订单管理', async () => {
  const tradeNav = page.locator('.sidebar-nav');
  assert.equal(await tradeNav.locator('button[data-page="orders"]').count(), 1);
  assert.equal(await tradeNav.locator('button[data-page="subscriptions"]').count(), 0);
  await navigate('orders');
  assert.match(await page.locator('.page-head').innerText(), /订单管理/);
});

test('订单管理按新字段结构合并展示订单和套餐数据', async () => {
  await navigate('orders');
  const headers = await page.locator('table.data-table thead th').allTextContents();
  for (const field of ['订单号 / 状态', '用户', '品牌', '套餐 / 状态', '实付 / 支付时间', '退款金额', '餐次数量', '有效期', '配送计划', '下单渠道 / 操作人', '订单备注', '操作']) {
    assert.ok(headers.includes(field), `missing merged field: ${field}`);
  }
  for (const removed of ['用户手机号', '品牌 / 套餐', '已使用', '剩余', '最近配送', '下单渠道', '操作人', '备注']) assert.equal(headers.includes(removed), false);
  const orderLink = page.getByText('OD202608050018', { exact: true }).first();
  const row = orderLink.locator('xpath=ancestor::tr');
  const text = await row.innerText();
  assert.match(text, /138 6621 8888/);
  assert.match(text, /薄荷晨间/);
  assert.match(text, /14天进阶套餐/);
  assert.match(text, /28 餐/);
  assert.match(text, /已使用 8 · 剩余 18/);
  assert.match(text, /2026\.08\.05 - 2026\.09\.18/);
  assert.match(text, /还剩.*到期/);
  assert.match(text, /小程序/);
  assert.match(text, /轻食用户/);
  assert.match(text, /企业福利券抵扣 30 元/);
  assert.equal(await row.locator('.expiry-remaining.negative').count(), 1);
  assert.ok(await row.locator('button[data-action="view-order"]').count());
  assert.equal((await row.locator('.row-button[data-action="view-order"]').innerText()).trim(), '详情');
  assert.equal(await row.locator('button[data-action="view-sub"]').count(), 0);
  assert.ok(await row.locator('button[data-action="extend-sub"]').count());
  assert.ok(await row.locator('button[data-action="toggle-sub"]').count());
  assert.equal((await row.locator('button[data-action="adjust-meals"]').innerText()).trim(), '赠送/扣除');
});

test('配送计划仅显示正在使用和未使用两种状态', async () => {
  await navigate('plans');
  const options = await page.locator('select[data-filter="planStatus"] option').allTextContents();
  assert.deepEqual(options, ['全部状态', '正在使用', '未使用']);
  const statusIndex = (await page.locator('table.data-table thead th').allTextContents()).indexOf('状态') + 1;
  const statuses = await page.locator(`table.data-table tbody tr td:nth-child(${statusIndex}) .status`).allTextContents();
  assert.ok(statuses.length > 0);
  assert.ok(statuses.every((value) => ['正在使用', '未使用'].includes(value)));
  const actionLabels = await page.locator('button[data-action="toggle-plan"]').allTextContents();
  assert.ok(actionLabels.every((value) => ['停用', '启用'].includes(value)));
});

test('配送计划停用后显示未使用并可再次启用', async () => {
  await navigate('plans');
  const row = page.locator('table.data-table tbody tr').first();
  await row.locator('button[data-action="toggle-plan"]').click();
  await page.locator('button[data-action="confirm-toggle-plan"]').click();
  const statusIndex = (await page.locator('table.data-table thead th').allTextContents()).indexOf('状态');
  assert.match(await row.locator('td').nth(statusIndex).innerText(), /未使用/);
  assert.equal((await row.locator('button[data-action="toggle-plan"]').innerText()).trim(), '启用');
});

test('激励词语隐藏编号并将待使用显示为待开始', async () => {
  await navigate('phrases');
  const firstCell = await page.locator('table.data-table tbody tr').first().locator('td').first().innerText();
  assert.doesNotMatch(firstCell, /PH\d+/);
  assert.equal(await page.getByText('待使用', { exact: true }).count(), 0);
  assert.ok(await page.getByText('待开始', { exact: true }).count() > 0);
});

test('内容标题下不重复显示栏目名称', async () => {
  await navigate('articles');
  const articleCell = await page.locator('table.data-table tbody tr').first().locator('td').first().innerText();
  assert.doesNotMatch(articleCell, /营养咨询/);
  await navigate('announcements');
  const announcementCell = await page.locator('table.data-table tbody tr').first().locator('td').first().innerText();
  assert.doesNotMatch(announcementCell, /公告管理/);
});

test('合并订单页隐藏创建订阅按钮和冻结列', async () => {
  await navigate('orders');
  assert.equal(await page.locator('button[data-action="new-subscription"]').count(), 0);
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.equal(headers.includes('冻结'), false);
});

test('暂停套餐时要求选择开始和恢复日期', async () => {
  await navigate('orders');
  await page.locator('button[data-action="toggle-sub"]').first().click();
  assert.ok(await page.locator('#pause-start').isVisible());
  assert.ok(await page.locator('#pause-end').isVisible());
  const start = await page.locator('#pause-start').getAttribute('value');
  const end = await page.locator('#pause-end').getAttribute('value');
  assert.match(start || '', /^\d{4}-\d{2}-\d{2}$/);
  assert.match(end || '', /^\d{4}-\d{2}-\d{2}$/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('确认暂停后在订单详情套餐信息显示暂停时间段', async () => {
  await navigate('orders');
  const toggle = page.locator('button[data-action="toggle-sub"]').first();
  const row = toggle.locator('xpath=ancestor::tr');
  await toggle.click();
  await page.locator('#pause-start').fill('2026-08-17');
  await page.locator('#pause-end').fill('2026-08-24');
  await page.locator('button[data-action="confirm-pause-range"]').click();
  assert.match(await row.innerText(), /已暂停/);
  await row.locator('.row-button[data-action="view-order"]').click();
  assert.match(await page.locator('#drawer-root').innerText(), /暂停时间/);
  assert.match(await page.locator('#drawer-root').innerText(), /2026-08-17 至 2026-08-24/);
  await page.locator('button[data-action="close-drawer"]').first().click();
});

test('暂停恢复日期早于开始日期时不提交', async () => {
  await navigate('orders');
  await page.locator('button[data-action="toggle-sub"]').nth(1).click();
  await page.locator('#pause-start').fill('2026-08-24');
  await page.locator('#pause-end').fill('2026-08-17');
  await page.locator('button[data-action="confirm-pause-range"]').click();
  assert.ok(await page.locator('#pause-start').isVisible());
  assert.match(await page.locator('#toast-root').innerText(), /恢复日期不能早于开始日期/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('延期天数使用带“天”单位的数字输入并校验范围', async () => {
  await navigate('orders');
  await page.locator('button[data-action="extend-sub"]').first().click();
  const input = page.locator('#extend-days');
  assert.equal(await input.getAttribute('type'), 'number');
  assert.equal(await input.getAttribute('min'), '1');
  assert.equal(await input.getAttribute('max'), '365');
  assert.ok(await page.getByText('天', { exact: true }).count() > 0);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('延期天数超出范围时不提交', async () => {
  await navigate('orders');
  await page.locator('button[data-action="extend-sub"]').first().click();
  await page.locator('#extend-days').fill('366');
  await page.locator('button[data-action="confirm-extend"]').click();
  assert.ok(await page.locator('#extend-days').isVisible());
  assert.match(await page.locator('#toast-root').innerText(), /请输入 1–365 的整数天数/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('财务报表不显示复核操作列', async () => {
  await navigate('finance');
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.equal(headers.includes('操作'), false);
  assert.equal(await page.locator('button[data-action="review-finance"]').count(), 0);
});

test('品牌标签管理分别使用类型名称和特点名称', async () => {
  await navigate('brands');
  await page.locator('button[data-action="brand-tags"]').click();
  const sections = page.locator('.tag-manager-section');
  assert.equal((await sections.nth(0).locator('thead th').allTextContents()).includes('类型名称'), true);
  assert.equal((await sections.nth(1).locator('thead th').allTextContents()).includes('特点名称'), true);
  assert.equal((await sections.nth(0).locator('.tag-manager-head button').innerText()).trim(), '新增类型');
  assert.equal((await sections.nth(1).locator('.tag-manager-head button').innerText()).trim(), '新增特点');
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('新增类型和特点弹窗只填写对应名称且限制10字', async () => {
  await navigate('brands');
  await page.locator('button[data-action="brand-tags"]').click();
  await page.locator('button[data-action="new-brand-tag"][data-value="type"]').click();
  assert.match(await page.locator('.modal-head').innerText(), /新增类型/);
  assert.equal(await page.locator('#entity-form .form-field').count(), 1);
  assert.equal(await page.locator('#entity-form input[name="name"]').getAttribute('maxlength'), '10');
  assert.match(await page.locator('#entity-form').innerText(), /类型名称/);
  await page.locator('button[data-action="close-modal"]').first().click();

  await navigate('brands');
  await page.locator('button[data-action="brand-tags"]').click();
  await page.locator('button[data-action="new-brand-tag"][data-value="feature"]').click();
  assert.match(await page.locator('.modal-head').innerText(), /新增特点/);
  assert.equal(await page.locator('#entity-form .form-field').count(), 1);
  assert.equal(await page.locator('#entity-form input[name="name"]').getAttribute('maxlength'), '10');
  assert.match(await page.locator('#entity-form').innerText(), /特点名称/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('两个品牌标签表都有最多10行的独立滚动区域', async () => {
  await navigate('brands');
  await page.locator('button[data-action="brand-tags"]').click();
  const scrollAreas = page.locator('.tag-manager-table-scroll');
  assert.equal(await scrollAreas.count(), 2);
  for (let i = 0; i < 2; i += 1) {
    const style = await scrollAreas.nth(i).evaluate((node) => getComputedStyle(node));
    assert.equal(style.overflowY, 'auto');
    assert.ok(parseFloat(style.maxHeight) > 500 && parseFloat(style.maxHeight) < 700);
  }
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('工作台将今日新增订阅改为今日新增订购', async () => {
  await navigate('dashboard');
  assert.ok(await page.getByText('今日新增订购', { exact: true }).count());
  assert.equal(await page.getByText('今日新增订阅', { exact: true }).count(), 0);
});

test('每日配送中心可按品牌和下单人切换层级', async () => {
  await navigate('daily');
  const tabs = page.locator('.daily-view-tabs button');
  assert.deepEqual(await tabs.allTextContents(), ['按品牌', '按下单人']);
  await tabs.filter({ hasText: '按下单人' }).click();
  assert.match(await page.locator('.daily-view-tabs button.active').innerText(), /按下单人/);
});

test('配送计划详情不显示调整记录', async () => {
  await navigate('plans');
  await page.locator('button[data-action="view-plan"][data-id="PL260704"]').first().click();
  assert.doesNotMatch(await page.locator('#drawer-root').innerText(), /调整记录|临时调整记录/);
  await page.locator('button[data-action="close-drawer"]').first().click();
});

test('订单详情汇总订单套餐用户和配送计划信息', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('.row-button[data-action="view-order"]').click();
  const detail = await page.locator('#drawer-root').innerText();
  for (const section of ['订单信息', '套餐信息', '用户信息', '配送计划']) assert.match(detail, new RegExp(section));
  assert.match(detail, /138 6621 8888/);
  assert.match(detail, /28 餐/);
  assert.match(detail, /工作日午晚餐计划/);
  await page.locator('button[data-action="close-drawer"]').first().click();
});

test('赠送扣除弹窗要求先选类型并输入正整数', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="adjust-meals"]').click();
  assert.deepEqual(await page.locator('#meal-adjust-type option').allTextContents(), ['请选择调整类型', '赠送', '扣除']);
  assert.equal(await page.locator('#meal-adjust').getAttribute('step'), '1');
  assert.ok(await page.locator('#meal-adjust-note').count());
  await page.locator('button[data-action="confirm-adjust-meals"]').click();
  assert.ok(await page.locator('#meal-adjust-type').isVisible());
  assert.match(await page.locator('#toast-root').innerText(), /请选择赠送或扣除/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('扣除餐次不能超过当前剩余餐次', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="adjust-meals"]').click();
  await page.locator('#meal-adjust-type').selectOption('deduct');
  await page.locator('#meal-adjust').fill('999');
  await page.locator('button[data-action="confirm-adjust-meals"]').click();
  assert.ok(await page.locator('#meal-adjust-type').isVisible());
  assert.match(await page.locator('#toast-root').innerText(), /不能超过当前剩余餐次/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('赠送餐次后更新表格并可查看调整记录', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="adjust-meals"]').click();
  await page.locator('#meal-adjust-type').selectOption('gift');
  await page.locator('#meal-adjust').fill('3');
  await page.locator('#meal-adjust-note').fill('售后补偿');
  await page.locator('button[data-action="confirm-adjust-meals"]').click();
  assert.match(await row.innerText(), /31 餐/);
  assert.match(await row.innerText(), /剩余 21/);
  const adjustment = row.locator('button[data-action="view-meal-adjustments"]');
  assert.match(await adjustment.innerText(), /\+3 餐/);
  await adjustment.click();
  const historyHeaders = await page.locator('#modal-root table.data-table thead th').allTextContents();
  assert.deepEqual(historyHeaders, ['类型', '次数', '备注', '操作人', '操作时间']);
  const history = await page.locator('#modal-root table.data-table tbody tr').first().innerText();
  assert.match(history, /赠送/);
  assert.match(history, /\+3/);
  assert.match(history, /售后补偿/);
  assert.match(history, /林方/);
  assert.match(history, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('订单用户和渠道信息合并且操作按钮每行最多两个', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  const cells = row.locator('td');
  assert.match(await cells.nth(1).innerText(), /轻食用户\s+138 6621 8888/);
  assert.match(await cells.nth(9).innerText(), /小程序\s+轻食用户/);
  const perLine = await row.locator('.order-row-actions button').evaluateAll((buttons) => {
    const counts = new Map();
    buttons.forEach((button) => {
      const top = Math.round(button.getBoundingClientRect().top);
      counts.set(top, (counts.get(top) || 0) + 1);
    });
    return [...counts.values()];
  });
  assert.ok(perLine.length > 1);
  assert.ok(perLine.every((count) => count <= 2));
});

test('多个订单显示演示餐次调整数据', async () => {
  await navigate('orders');
  const adjustments = page.locator('button[data-action="view-meal-adjustments"]');
  assert.ok(await adjustments.count() >= 3);
  const labels = await adjustments.allTextContents();
  assert.ok(labels.some((label) => /调整 \+\d+ 餐/.test(label.trim())));
  assert.ok(labels.some((label) => /调整 -\d+ 餐/.test(label.trim())));
});

test('退款金额可点击并显示完整退款记录表', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608040091', { exact: true }).first().locator('xpath=ancestor::tr');
  const refund = row.locator('button[data-action="view-refunds"]');
  assert.match(await refund.innerText(), /¥412/);
  await refund.click();
  assert.deepEqual(await page.locator('#modal-root table thead th').allTextContents(), ['退款金额', '退款类型', '退款原因', '退款时间', '操作人', '操作时间']);
  const record = await page.locator('#modal-root table tbody tr').first().innerText();
  assert.match(record, /¥412/);
  assert.match(record, /未核销餐次退款/);
  assert.match(record, /林方/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('退款金额必填且退款原因可以留空', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="request-refund"]').click();
  assert.equal(await page.locator('[name="amount"]').getAttribute('required'), '');
  assert.equal(await page.locator('[name="reason"]').getAttribute('required'), null);
  assert.equal(await page.locator('[name="reason"]').getAttribute('placeholder'), '选填退款原因');
  await page.locator('[name="refundTypeId"]').selectOption({ index: 1 });
  await page.locator('[name="amount"]').fill('');
  await page.locator('button[data-action="confirm-refund"]').click();
  assert.ok(await page.locator('[name="amount"]').isVisible());
  assert.match(await page.locator('#toast-root').innerText(), /请输入有效退款金额/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('公告列表显示实际标签值', async () => {
  await navigate('announcements');
  const tags = await page.locator('table.data-table tbody tr td:nth-child(2)').allTextContents();
  assert.ok(tags.length >= 4);
  assert.ok(tags.slice(0, 4).every((tag) => tag.trim() && tag.trim() !== '—'));
});

test('用户ID显示在名称下方并显示总购买次数', async () => {
  await navigate('users');
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.equal(headers.includes('ID'), false);
  assert.equal(headers.includes('订阅次数'), false);
  assert.equal(headers.includes('总购买次数'), true);
  const first = page.locator('table.data-table tbody tr').first();
  assert.match(await first.locator('td').first().innerText(), /轻食用户\s+U2026070001/);
  assert.match(await first.innerText(), /2 次/);
});

test('工作台展示累计经营概览且累计指标不随时间改变', async () => {
  await navigate('dashboard');
  assert.deepEqual(await page.locator('.dashboard-period-tabs button').allTextContents(), ['今日', '近 7 天', '近 30 天', '自定义']);
  assert.equal(await page.locator('.dashboard-period-tabs button.active').innerText(), '今日');
  assert.equal(await page.getByText('经营与履约数据已集中到一个工作台。', { exact: true }).count(), 0);
  assert.equal(await page.getByText('进入每日配送中心', { exact: false }).count(), 0);
  for (const label of ['累计用户规模', '累计实收金额与核销构成', '累计退款规模与订单退款率', '当前订购用户与历史覆盖', '基础信息完整用户构成']) {
    assert.ok(await page.locator('.dashboard-global-kpis').getByText(label, { exact: true }).count(), `missing KPI: ${label}`);
  }
  const before = await page.locator('.dashboard-global-kpis article strong').allTextContents();
  await page.locator('button[data-action="dashboard-period"][data-value="30"]').click();
  assert.deepEqual(await page.locator('.dashboard-global-kpis article strong').allTextContents(), before);
  for (const detail of ['高活跃', '中活跃', '低活跃', '不活跃', '已核销金额', '未核销金额', '历史订购用户总数', '男性', '女性']) assert.ok(await page.getByText(detail, { exact: true }).count());
  assert.equal(await page.locator('[data-dashboard-metric="refund-summary"]').getByText('已付款订单', { exact: true }).count(), 0);
});

test('工作台展示今日业务指标和书面化统计图标题', async () => {
  await navigate('dashboard');
  for (const label of ['今日新增用户数量', '今日新增订购', '今日配送餐数', '明日配送餐数']) assert.ok(await page.getByText(label, { exact: true }).count());
  for (const detail of ['午餐', '晚餐']) assert.ok(await page.locator('[data-dashboard-metric="tomorrow-delivery-period"]').getByText(detail, { exact: true }).count());
  for (const heading of ['筛选周期内新增用户与套餐购买趋势', '筛选周期内登录用户年龄分布', '品牌购买与履约经营排名', '筛选周期内退款类型订单构成']) assert.ok(await page.getByText(heading, { exact: true }).count());
  assert.deepEqual(await page.locator('.age-login-chart [data-age-bucket]').allTextContents(), ['18–24', '25–29', '30–34', '35–39', '40岁及以上']);
  const rankHeaders = await page.locator('.brand-ranking table thead th').allTextContents();
  assert.deepEqual(rankHeaders, ['排名', '品牌', '新增购买', '购买用户数', '已核销金额', '未核销金额', '退款金额', '总购买餐数', '已完成餐数', '未完成餐数', '复购率']);
  assert.equal(rankHeaders.includes('待配送单量'), false);
  assert.ok(await page.locator('#refund-pie-brand option').count() > 1);
});

test('工作台周期与自定义日期校验会联动刷新', async () => {
  await navigate('dashboard');
  const metric = page.locator('[data-dashboard-metric="period-purchases"] strong');
  const before = await metric.innerText();
  await page.locator('button[data-action="dashboard-period"][data-value="30"]').click();
  assert.equal(await page.locator('.dashboard-period-tabs button.active').innerText(), '近 30 天');
  assert.notEqual(await metric.innerText(), before);
  await page.locator('button[data-action="dashboard-period"][data-value="custom"]').click();
  await page.locator('#dashboard-start').fill('2026-08-10');
  await page.locator('#dashboard-end').fill('2026-08-01');
  await page.locator('button[data-action="apply-dashboard-range"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /开始日期不能晚于结束日期/);
  await page.locator('#dashboard-start').fill('2026-08-01');
  await page.locator('#dashboard-end').fill('2026-08-06');
  await page.locator('button[data-action="apply-dashboard-range"]').click();
  assert.equal(await page.locator('.dashboard-period-tabs button.active').innerText(), '自定义');
  await page.locator('#refund-pie-brand').selectOption({ index: 1 });
  assert.notEqual(await page.locator('#refund-pie-brand').inputValue(), '全部品牌');
});

test('后台设置管理支付方式并只向补录订单提供启用项', async () => {
  await navigate('backend-settings');
  assert.ok(await page.getByText('支付方式', { exact: true }).count());
  const defaultRow = page.getByText('小程序支付', { exact: true }).locator('xpath=ancestor::tr');
  assert.match(await defaultRow.innerText(), /启用/);
  assert.equal(await defaultRow.locator('button[data-action="delete-payment-method"]').count(), 0);
  await page.locator('button[data-action="new-payment-method"]').click();
  await page.locator('#payment-method-form [name="name"]').fill('企业转账');
  await page.locator('button[data-action="save-payment-method"]').click();
  assert.ok(await page.getByText('企业转账', { exact: true }).count());
  const created = page.getByText('企业转账', { exact: true }).locator('xpath=ancestor::tr');
  await created.locator('button[data-action="toggle-payment-method"]').click();
  assert.match(await page.getByText('企业转账', { exact: true }).locator('xpath=ancestor::tr').innerText(), /停用/);
});

test('后台设置预置退款类型并支持新增编辑停用', async () => {
  await navigate('backend-settings');
  await page.locator('.backend-settings-tabs button').filter({ hasText: '退款类型' }).click();
  for (const name of ['用户原因', '配送异常', '商品质量', '重复付款', '其他']) assert.ok(await page.getByText(name, { exact: true }).count());
  await page.locator('button[data-action="new-refund-type"]').click();
  await page.locator('#refund-type-form [name="name"]').fill('售后补偿');
  await page.locator('button[data-action="save-refund-type"]').click();
  const row = page.getByText('售后补偿', { exact: true }).locator('xpath=ancestor::tr');
  await row.locator('button[data-action="edit-refund-type"]').click();
  await page.locator('#refund-type-form [name="name"]').fill('客服补偿');
  await page.locator('button[data-action="save-refund-type"]').click();
  const edited = page.getByText('客服补偿', { exact: true }).locator('xpath=ancestor::tr');
  await edited.locator('button[data-action="toggle-refund-type"]').click();
  assert.match(await page.getByText('客服补偿', { exact: true }).locator('xpath=ancestor::tr').innerText(), /停用/);
});

test('订单退款必须选择退款类型且原因仍可为空', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="request-refund"]').click();
  const type = page.locator('#refund-form [name="refundTypeId"]');
  assert.equal(await type.getAttribute('required'), '');
  assert.ok(await type.locator('option').count() >= 6);
  assert.equal(await page.locator('#refund-form [name="reason"]').getAttribute('required'), null);
  await type.selectOption('');
  await page.locator('button[data-action="confirm-refund"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /请选择退款类型/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('没有启用退款类型时引导前往后台设置管理', async () => {
  await navigate('backend-settings');
  await page.locator('.backend-settings-tabs button').filter({ hasText: '退款类型' }).click();
  const enabled = page.locator('.refund-type-table tbody tr', { has: page.locator('button[data-action="toggle-refund-type"]', { hasText: '停用' }) });
  while (await enabled.count()) await enabled.first().locator('button[data-action="toggle-refund-type"]').click();
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="request-refund"]').click();
  assert.ok(await page.getByText('暂无可用退款类型', { exact: true }).count());
  await page.locator('button[data-action="goto-refund-types"]').click();
  assert.ok(await page.locator('.refund-type-table').count());
  const disabled = page.locator('.refund-type-table button[data-action="toggle-refund-type"]', { hasText: '启用' });
  while (await disabled.count()) await disabled.first().click();
});

test('退款记录保存并显示退款类型名称快照', async () => {
  await navigate('orders');
  const row = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="request-refund"]').click();
  await page.locator('#refund-form [name="refundTypeId"]').selectOption({ label: '用户原因' });
  await page.locator('#refund-form [name="amount"]').fill('1');
  await page.locator('button[data-action="confirm-refund"]').click();
  await page.locator('button[data-action="finalize-refund"]').click();
  const updated = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  await updated.locator('button[data-action="view-refunds"]').click();
  assert.deepEqual(await page.locator('#modal-root table thead th').allTextContents(), ['退款金额', '退款类型', '退款原因', '退款时间', '操作人', '操作时间']);
  assert.match(await page.locator('#modal-root table tbody tr').first().innerText(), /用户原因/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('补录订单进入独立详情页并使用弹窗选择用户品牌套餐', async () => {
  await navigate('orders');
  await page.locator('button[data-action="manual-order"]').click();
  assert.equal(await page.locator('.manual-order-page').count(), 1);
  for (const title of ['用户信息', '品牌与套餐', '支付信息', '配送计划']) assert.ok(await page.getByText(title, { exact: true }).count());
  await page.locator('button[data-action="choose-manual-user"]').click();
  await page.locator('#manual-user-search').fill('U20260116');
  await page.locator('button[data-action="select-manual-user"][data-id="U20260116"]').click();
  assert.match(await page.locator('[data-manual-summary="user"]').innerText(), /顾明远.*139 5508 9067/s);
  await page.locator('button[data-action="choose-manual-brand"]').click();
  assert.equal(await page.locator('#modal-root [data-brand-status="下架"]').count(), 0);
  await page.locator('button[data-action="select-manual-brand"][data-id="B002"]').click();
  await page.locator('button[data-action="choose-manual-package"]').click();
  const packageRows = page.locator('#modal-root button[data-action="select-manual-package"]');
  assert.ok(await packageRows.count() > 0);
  await packageRows.first().click();
  assert.equal(await page.locator('#manual-order-amount').inputValue(), '299');
});

test('新手机号创建临时用户且重复手机号引导选择已有用户', async () => {
  assert.equal(await page.locator('.manual-order-page').count(), 1);
  await page.locator('button[data-action="choose-manual-user"]').click();
  await page.locator('button[data-action="manual-user-mode"][data-value="new"]').click();
  await page.locator('#manual-new-user-phone').fill('13612345678');
  await page.locator('button[data-action="create-manual-user"]').click();
  assert.match(await page.locator('[data-manual-summary="user"]').innerText(), /新用户5678.*136 1234 5678/s);
  await page.locator('button[data-action="choose-manual-user"]').click();
  await page.locator('button[data-action="manual-user-mode"][data-value="new"]').click();
  await page.locator('#manual-new-user-phone').fill('13612345678');
  await page.locator('button[data-action="create-manual-user"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /手机号已存在/);
  assert.ok(await page.locator('button[data-action="select-manual-user"]').count());
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('补录配送计划可跳过也可打开小程序同款计划编辑器', async () => {
  await page.locator('button[data-action="choose-manual-plan"]').click();
  assert.ok(await page.getByText('暂不选择配送计划', { exact: true }).count());
  await page.locator('button[data-action="add-manual-plan"]').click();
  for (const label of ['计划名称', '联系人', '配送规则', '统一设置', '分别设置每天', '一天一餐', '一天两餐', '配送地址', '忌口', '过敏信息', '配送备注']) {
    assert.ok(await page.getByText(label, { exact: true }).count(), `missing plan editor field: ${label}`);
  }
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('补录配送计划支持自定义星期和按天分别设置', async () => {
  await navigate('orders');
  await page.locator('button[data-action="manual-order"]').click();
  await page.locator('button[data-action="choose-manual-user"]').click();
  await page.locator('button[data-action="select-manual-user"][data-id="U20260116"]').click();
  await page.locator('button[data-action="choose-manual-plan"]').click();
  await page.locator('button[data-action="add-manual-plan"]').click();
  await page.locator('button[data-action="manual-plan-rule"][data-value="自定义配送"]').click();
  await page.locator('button[data-action="save-manual-plan"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /至少选择一个配送日期/);
  await page.locator('button[data-action="manual-plan-day"][data-value="一"]').click();
  await page.locator('button[data-action="manual-plan-setting"][data-value="daily"]').click();
  assert.ok(await page.locator('[data-daily-day="一"]').count());
  await page.locator('button[data-action="save-manual-plan"]').click();
  assert.match(await page.locator('[data-manual-summary="plan"]').innerText(), /工作日午晚餐计划/);
});

test('确认补录同步生成订单套餐购买和财务流水', async () => {
  await page.locator('button[data-action="choose-manual-user"]').click();
  await page.locator('#manual-user-search').fill('顾明远');
  await page.locator('button[data-action="select-manual-user"][data-id="U20260116"]').click();
  await page.locator('button[data-action="choose-manual-brand"]').click();
  await page.locator('button[data-action="select-manual-brand"][data-id="B002"]').click();
  await page.locator('button[data-action="choose-manual-package"]').click();
  await page.locator('button[data-action="select-manual-package"]').first().click();
  assert.equal(await page.locator('#manual-order-payment option').allTextContents().then(x => x.includes('企业转账')), false);
  await page.locator('#manual-order-note').fill('测试补录联动');
  await page.locator('button[data-action="submit-manual-order"]').click();
  assert.equal(await page.locator('.manual-order-page').count(), 0);
  const newest = page.locator('table.data-table tbody tr').first();
  assert.match(await newest.innerText(), /顾明远/);
  assert.match(await newest.innerText(), /后台.*林方/s);
  assert.match(await newest.innerText(), /测试补录联动/);
  await navigate('finance');
  assert.match(await page.locator('table.data-table tbody tr').first().innerText(), /顾明远.*小程序支付/s);
});

test('品牌表单使用双价格、字数限制、等高描述和上架开关', async () => {
  await navigate('brands');
  await page.locator('button[data-action="edit-brand"]').first().click();
  assert.equal(await page.locator('[name="name"]').getAttribute('maxlength'), '30');
  assert.equal(await page.locator('textarea[name="abbr"]').getAttribute('maxlength'), '100');
  assert.equal(await page.locator('[name="priceMin"]').count(), 1);
  assert.equal(await page.locator('[name="priceMax"]').count(), 1);
  assert.match(await page.locator('.brand-price-range').innerText(), /￥.*~.*\/餐/s);
  assert.ok(await page.getByText('参考比例 1:1', { exact: true }).count());
  assert.equal(await page.locator('[name="statusSwitch"][type="checkbox"]').count(), 1);
  assert.equal(await page.locator('.brand-identity-layout > .brand-logo-field').count(), 1);
  assert.equal(await page.locator('.brand-primary-fields > .form-field').first().locator('[name="name"]').count(), 1);
  await page.locator('[name="priceMin"]').fill('40');
  await page.locator('[name="priceMax"]').fill('20');
  await page.locator('button[data-action="save-entity"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /最低价不能高于最高价/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('品牌列表显示订购用户历史总数和品牌介绍按钮', async () => {
  await navigate('brands');
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.ok(headers.includes('订购用户'));
  assert.equal(headers.includes('订阅用户'), false);
  const firstRow = page.locator('table.data-table tbody tr').first();
  assert.match(await firstRow.innerText(), /历史订购用户\s*\d+\s*人/);
  assert.ok(await firstRow.getByText('品牌介绍', { exact: true }).count());
  assert.equal(await firstRow.getByText('详情设置', { exact: true }).count(), 0);
});

test('品牌管理精简汇总并展示浏览量和明日午晚餐拆分', async () => {
  await navigate('brands');
  const workspace = await page.locator('#workspace').innerText();
  assert.doesNotMatch(workspace, /配送覆盖/);
  assert.match(workspace, /关联套餐/);
  assert.match(workspace, /预计明日配送餐数/);
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.ok(headers.includes('详情页浏览量'));
  const firstRow = page.locator('table.data-table tbody tr').first();
  assert.match(await firstRow.innerText(), /\d[\d,]* 次/);
  const delivery = await firstRow.locator('td').nth(headers.indexOf('明日配送')).innerText();
  const values = [...delivery.matchAll(/\d+/g)].map(match => Number(match[0]));
  assert.equal(values[0], values[1] + values[2]);
});

test('品牌配送范围为选填且空值统一显示占位符', async () => {
  await navigate('brands');
  await page.locator('button[data-action="edit-brand"]').first().click();
  const area = page.locator('[name="area"]');
  assert.equal(await area.getAttribute('required'), null);
  await area.fill('');
  await page.locator('[name="logo"]').evaluate(node => { node.value = 'assets/meal-seasonal-fruit-nuts.jpg'; });
  await page.locator('button[data-action="save-entity"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /保存成功/);
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.equal((await page.locator('table.data-table tbody tr').first().locator('td').nth(headers.indexOf('配送范围')).innerText()).trim(), '—');
});

test('品牌详情和介绍编辑器统一使用品牌介绍文案', async () => {
  await navigate('brands');
  await page.locator('button[data-action="view-brand"]').first().click();
  assert.equal((await page.locator('#drawer-root').innerText()).includes('详情设置'), false);
  await page.locator('#drawer-root button[data-action="brand-detail-editor"]').click();
  assert.match(await page.locator('#modal-root .modal-head').innerText(), /品牌介绍/);
  assert.equal((await page.locator('#modal-root').innerText()).includes('详情设置'), false);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('套餐管理删除归档和启用停用操作按钮', async () => {
  await navigate('packages');
  assert.equal(await page.getByText('套餐归档', { exact: true }).count(), 0);
  const actions = page.locator('table.data-table tbody tr').first().locator('.table-actions');
  assert.deepEqual(await actions.locator('button').allTextContents(), ['详情', '编辑', '下发', '复制']);
});

test('配送中心默认明日并支持日期时间范围筛选', async () => {
  await navigate('daily');
  assert.deepEqual(await page.locator('.daily-date-tabs button').allTextContents(), ['今日', '明日']);
  assert.equal(await page.locator('.daily-date-tabs button.active').innerText(), '明日');
  assert.equal(await page.locator('#daily-time-start').inputValue(), '00:00');
  assert.equal(await page.locator('#daily-time-end').inputValue(), '23:59');
  const allRows = await page.locator('table.data-table tbody tr').count();
  await page.locator('#daily-time-start').fill('11:00');
  await page.locator('#daily-time-end').fill('12:30');
  await page.locator('button[data-action="apply-daily-time"]').click();
  assert.ok(await page.locator('table.data-table tbody tr').count() < allRows);
  assert.equal((await page.locator('table.data-table tbody tr td:nth-child(8)').allTextContents()).some(text => text.includes('晚餐')), false);
  await page.locator('#daily-time-start').fill('18:00');
  await page.locator('#daily-time-end').fill('11:00');
  await page.locator('button[data-action="apply-daily-time"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /开始时间不能晚于结束时间/);
});

test('配送中心展示完整资料并可修改配送状态且不再显示合包操作', async () => {
  await navigate('daily');
  for (const removed of ['新增异常/售后', '待运营确认', '确认数据', '同址合包']) assert.equal(await page.getByText(removed, { exact: true }).count(), 0);
  assert.equal((await page.locator('#workspace').innerText()).includes('合包'), false);
  await page.locator('.daily-view-tabs button[data-value="person"]').click();
  const headers = await page.locator('table.data-table thead th').allTextContents();
  assert.ok(headers.includes('下单人'));
  assert.ok(headers.includes('配送状态'));
  assert.equal(headers.includes('用户'), false);
  assert.equal(headers.includes('联系电话'), false);
  const body = await page.locator('table.data-table tbody').innerText();
  assert.equal(body.includes('缺失'), false);
  assert.match(body, /1\d{2}\s?\d{4}\s?\d{4}/);
  const firstRow = page.locator('table.data-table tbody tr').first();
  await firstRow.locator('button[data-action="change-delivery-status"]').click();
  assert.deepEqual(await page.locator('[name="deliveryStatus"] option').allTextContents(), ['请选择配送状态', '已送达', '待配送', '未送达']);
  await page.locator('[name="deliveryStatus"]').selectOption('未送达');
  await page.locator('button[data-action="save-delivery-status"]').click();
  assert.match(await firstRow.innerText(), /未送达/);
});

test('工作台按累计概览排名筛选业务和分析顺序展示', async () => {
  await navigate('dashboard');
  const order = await page.locator('.dashboard-page').evaluate((root) => {
    const selectors = ['.dashboard-global-kpis', '.brand-ranking', '.dashboard-filterbar', '.dashboard-period-kpis', '.dashboard-analysis-grid', '.dashboard-pie-grid'];
    return selectors.map(selector => [...root.children].indexOf(root.querySelector(selector)));
  });
  assert.ok(order.every((value, index) => index === 0 || value > order[index - 1]), `unexpected order: ${order}`);
});

test('工作台年龄分布使用SVG折线并展示三个经营构成饼图', async () => {
  await navigate('dashboard');
  assert.equal(await page.locator('.age-login-chart svg.age-line-svg').count(), 1);
  assert.equal(await page.locator('.age-login-chart svg polyline').count(), 1);
  assert.equal(await page.locator('.age-login-chart [data-age-bucket]').count(), 5);
  assert.deepEqual(await page.locator('.dashboard-pie-grid .panel-head h3').allTextContents(), ['筛选周期内品牌购买数量构成', '筛选周期内品牌购买金额构成', '筛选周期内退款类型订单构成']);
  assert.equal(await page.locator('.dashboard-pie-grid .refund-pie').count(), 3);
});

test('每日配送中心仅保留按品牌和按下单人视图', async () => {
  await navigate('daily');
  assert.deepEqual(await page.locator('.daily-view-tabs button').allTextContents(), ['按品牌', '按下单人']);
});

test('用户地址管理使用用户一行并在弹窗展示全部地址', async () => {
  await navigate('addresses');
  assert.equal(await page.locator('table.address-users-table tbody tr').count(), 7);
  const first = page.locator('table.address-users-table tbody tr').first();
  assert.match(await first.innerText(), /U\d+.*1\d{2}/s);
  await first.getByText('查看地址', { exact: true }).click();
  assert.deepEqual(await page.locator('#modal-root table thead th').allTextContents(), ['完整地址', '收货人 / 电话', '标签', '默认状态', '操作']);
  assert.ok(await page.locator('#modal-root table tbody tr').count() >= 1);
  assert.deepEqual(await page.locator('#modal-root table tbody tr').first().locator('.table-actions button').allTextContents(), ['编辑', '设默认', '删除']);
});

test('后台设置以支付方式和退款类型Tab分类并支持退款跳转', async () => {
  await navigate('backend-settings');
  const settingTabs = await page.locator('.backend-settings-tabs button').allTextContents();
  assert.match(settingTabs[0], /^支付方式（\d+）$/);
  assert.match(settingTabs[1], /^退款类型（\d+）$/);
  assert.equal(await page.locator('.settings-data-section').count(), 1);
  await page.locator('.backend-settings-tabs button').filter({ hasText: '退款类型' }).click();
  assert.match(await page.locator('.settings-data-section').innerText(), /新增退款类型/);
});

test('角色不可删除且管理员表单显示角色名密码规则和状态开关', async () => {
  await navigate('roles');
  assert.equal(await page.locator('button[data-action="delete-role-confirm"]').count(), 0);
  await navigate('admins');
  await page.locator('button[data-action="new-admin"]').click();
  const roleTexts = await page.locator('[name="roleId"] option').allTextContents();
  assert.ok(roleTexts.includes('超级管理员'));
  assert.equal(roleTexts.some(text => /^R\d+$/.test(text)), false);
  assert.equal(await page.locator('[name="password"]').getAttribute('required'), '');
  assert.equal(await page.locator('[name="statusSwitch"][type="checkbox"]').count(), 1);
  await page.locator('[name="account"]').fill('operator2');
  await page.locator('[name="name"]').fill('测试管理员');
  await page.locator('[name="phone"]').fill('13800001234');
  await page.locator('[name="password"]').fill('weakpassword');
  await page.locator('button[data-action="save-entity"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /至少12位.*大写.*小写.*数字.*符号/);
  await page.locator('button[data-action="close-modal"]').first().click();
});

test('订单状态并入订单号且渠道操作人使用业务名称', async () => {
  await navigate('orders');
  const headers = await page.locator('.orders-table thead th').allTextContents();
  assert.equal(headers.includes('订单状态'), false);
  const firstRow = page.getByText('OD202608050018', { exact: true }).first().locator('xpath=ancestor::tr');
  assert.ok(await firstRow.locator('td').first().locator('.status').count());
  assert.match(await firstRow.locator('td').nth(9).innerText(), /小程序\s+轻食用户/s);
});

test('小程序规则先选周期再配置暂停次数并保留四套数据', async () => {
  await navigate('app-rules');
  assert.equal(await page.locator('#pause-period').inputValue(), 'week');
  assert.equal(await page.locator('#pause-limit-value').inputValue(), '1');
  assert.equal(await page.locator('.pause-limit-summary').count(), 0);
  await page.locator('#pause-limit-value').fill('-1');
  await page.locator('button[data-action="save-app-rules"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /暂停次数必须为非负整数/);
  await page.locator('#pause-limit-value').fill('2');
  await page.locator('#pause-period').selectOption('month');
  assert.equal(await page.locator('#pause-limit-value').inputValue(), '3');
  await page.locator('#pause-period').selectOption('week');
  assert.equal(await page.locator('#pause-limit-value').inputValue(), '2');
  await page.locator('button[data-action="save-app-rules"]').click();
  assert.match(await page.locator('#toast-root').innerText(), /小程序规则已保存/);
  assert.equal(await page.locator('#pause-limit-value').inputValue(), '2');
  assert.equal(await page.locator('[data-upload-box="refundQr"]').count(), 1);
});

test('登录用户和用户数据共享备注且精简登录信息列', async () => {
  await navigate('login-users');
  const headers=await page.locator('.data-table thead th').allTextContents();
  assert.equal(headers[0], '用户 ID');
  assert.equal(headers.includes('登录设备'), false);
  assert.equal(headers.includes('登录 IP'), false);
  assert.ok(headers.includes('用户备注'));
  const row=page.getByText('U2026070001',{exact:true}).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="edit-user-note"]').click();
  await page.locator('#user-note').fill('重点跟进用户');
  await page.locator('button[data-action="save-user-note"]').click();
  await navigate('users');
  assert.match(await page.getByText('轻食用户',{exact:true}).first().locator('xpath=ancestor::tr').innerText(),/重点跟进用户/);
});

test('互动运营展示合作申请并支持跟进状态和备注', async () => {
  await navigate('collaborations');
  assert.match(await page.locator('.breadcrumb').innerText(),/互动运营.*与我合作/s);
  assert.equal(await page.locator('.collaboration-table thead th').count(),8);
  const row=page.getByText('顾明远',{exact:true}).first().locator('xpath=ancestor::tr');
  await row.locator('button[data-action="edit-collaboration-status"]').click();
  await page.locator('#collaboration-status').selectOption({label:'跟进中'});
  await page.locator('button[data-action="save-collaboration-status"]').click();
  assert.match(await page.getByText('顾明远',{exact:true}).first().locator('xpath=ancestor::tr').innerText(),/跟进中/);
  await page.getByText('顾明远',{exact:true}).first().locator('xpath=ancestor::tr').locator('button[data-action="edit-collaboration-note"]').click();
  await page.locator('#collaboration-note').fill('明日电话联系');
  await page.locator('button[data-action="save-collaboration-note"]').click();
  assert.match(await page.getByText('顾明远',{exact:true}).first().locator('xpath=ancestor::tr').innerText(),/明日电话联系/);
});

test('用户数据合并订阅用户并可查看剩余次数明细', async () => {
  await navigate('users');
  assert.equal(await page.locator('.sidebar-nav button[data-page="sub-users"]').count(), 0);
  const headers = await page.locator('.users-table thead th').allTextContents();
  assert.ok(headers.includes('订购品牌'));
  assert.ok(headers.includes('剩余次数'));
  const row = page.getByText('轻食用户', { exact: true }).first().locator('xpath=ancestor::tr');
  assert.match(await row.innerText(), /薄荷晨间.*青禾轻食/s);
  await row.locator('button[data-action="view-user-remaining"]').click();
  assert.deepEqual(await page.locator('#modal-root table thead th').allTextContents(), ['品牌', '剩余次数', '有效期', '已用次数', '对应订单号']);
  assert.ok(await page.locator('#modal-root table tbody tr').count() >= 2);
  await page.locator('button[data-action="close-modal"]').filter({ hasText: '完成' }).click();
});

test('用户数据可仅查看包含暂停状态的订阅中用户', async () => {
  await navigate('users');
  await page.locator('.subscribed-only-switch').click();
  assert.equal(await page.getByText('周若宁', { exact: true }).count(), 0);
  assert.ok(await page.getByText('陈奕川', { exact: true }).count());
});

test('工作台今日全部组件有数据且固定排名和明日配送不随时间变化', async () => {
  await navigate('dashboard');
  assert.match(await page.locator('[data-dashboard-metric="period-users"] strong').innerText(), /[1-9]/);
  assert.match(await page.locator('[data-dashboard-metric="period-purchases"] strong').innerText(), /[1-9]/);
  assert.equal(await page.locator('.dashboard-pie-grid .refund-pie.empty').count(), 0);
  assert.ok(await page.locator('.dashboard-global-kpis [data-dashboard-metric="tomorrow-delivery"]').count());
  assert.equal(await page.locator('.dashboard-period-kpis [data-dashboard-metric="tomorrow-delivery"]').count(), 0);
  assert.equal((await page.locator('.brand-ranking h3').innerText()).trim(), '品牌购买与履约经营排名');
  const rankingBefore = await page.locator('.brand-ranking tbody').innerText();
  const deliveryBefore = await page.locator('[data-dashboard-metric="tomorrow-delivery"]').innerText();
  await page.locator('[data-action="dashboard-period"][data-value="30"]').click();
  assert.equal(await page.locator('.brand-ranking tbody').innerText(), rankingBefore);
  assert.equal(await page.locator('[data-dashboard-metric="tomorrow-delivery"]').innerText(), deliveryBefore);
});

test('品牌套餐内容页面提供新增组合筛选', async () => {
  await navigate('brands');
  assert.equal(await page.locator('[data-multi-menu="brandTypes"]').count(), 1);
  assert.equal(await page.locator('[data-multi-menu="brandFeatures"]').count(), 1);
  assert.ok(await page.locator('[data-filter="brandIntro"]').count());
  assert.ok((await page.locator('table.data-table thead th').allTextContents()).includes('关联套餐'));
  assert.equal(await page.locator('table.data-table tbody td:first-child [data-action="view-brand"]').count(), 0);
  await navigate('packages');
  assert.equal(await page.locator('[data-multi-menu="packageBrands"]').count(), 1);
  await navigate('phrases');
  assert.ok(await page.locator('[data-filter="phraseDisplay"]').count());
  assert.equal(await page.locator('[data-filter="phraseDateStart"]').getAttribute('type'), 'date');
  await navigate('articles');
  assert.ok(await page.locator('[data-filter="contentHome"]').count());
  await navigate('announcements');
  assert.ok(await page.locator('[data-filter="contentTag"]').count());
});

test('订单财务用户组合筛选和订单业务详情入口可用', async () => {
  await navigate('orders');
  for (const key of ['orderBuyer','orderChannel','orderPayment','orderRefund']) assert.ok(await page.locator(`[data-filter="${key}"]`).count());
  assert.equal(await page.locator('[data-multi-menu="orderBrands"]').count(), 1);
  const first=page.locator('.orders-table tbody tr').first();
  await first.locator('[data-action="view-order-brand"]').click();
  assert.match(await page.locator('#drawer-root').innerText(), /品牌详情/);
  await page.locator('#drawer-root button[data-action="close-drawer"]').last().click();
  await first.locator('[data-action="view-order-package"]').click();
  assert.match(await page.locator('#drawer-root').innerText(), /套餐详情/);
  await page.locator('#drawer-root button[data-action="close-drawer"]').last().click();
  await navigate('finance');
  assert.ok(await page.locator('[data-filter="financePayment"]').count());
  assert.ok(await page.locator('[data-filter="financeRefund"]').count());
  await navigate('users');
  for (const key of ['userGender','userActivity','userActive','userHeightMin','userWeightMax','userBmiMin','userBmrMax','userTdeeMin']) assert.ok(await page.locator(`[data-filter="${key}"]`).count());
  assert.equal((await page.locator('[data-action="edit-user-note"]').first().innerText()).trim(),'用户备注');
});

test('登录品牌区移除数字统计并保留动态效果', async () => {
  await page.locator('.top-operator').click();
  await page.locator('[data-action="logout"]').click();
  await page.locator('[data-action="confirm-logout"]').click();
  assert.equal(await page.locator('.login-stat-row').count(), 0);
  assert.equal(await page.locator('.tech-scan').count(), 0);
  assert.ok(await page.locator('.tech-orbit').count() > 0);
  assert.notEqual(await page.locator('.login-brand-panel').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.locator('#login-account').fill('admin');
  await page.locator('#login-password').fill('Raven@2026');
  await page.locator('#login-submit').click();
  await page.waitForTimeout(750);
});

test('页面运行期间没有 JavaScript 异常', () => {
  assert.deepEqual(pageErrors, []);
});
