const fs=require('fs');
const path=require('path');
const os=require('os');
const assert=require('assert/strict');

function loadPlaywright(){
 try{return require('playwright');}
 catch(error){
  const base=path.join(os.homedir(),'AppData','Local','OpenAI','Codex','runtimes','cua_node');
  for(const folder of fs.existsSync(base)?fs.readdirSync(base):[]){
   const candidate=path.join(base,folder,'bin','node_modules','playwright');
   if(fs.existsSync(candidate))return require(candidate);
  }
  throw error;
 }
}

const root=path.resolve(__dirname,'..');
const artifact='file:///'+path.join(root,'dist','渡鸦管家-小程序.html').replaceAll('\\','/');
const checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
const used=new Set(manifest.sourceFiles.map(item=>item.path));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const files=walk(root).map(file=>path.relative(root,file).replaceAll('\\','/'));
const managed=files.filter(file=>!/^(dist\/|tests\/|README\.md$|build-manifest\.json$)/.test(file));
check('目录内文件全部被构建引用',managed.every(file=>used.has(file)));
const hashes=managed.map(file=>require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'));
check('目录内无完全重复文件',new Set(hashes).size===hashes.length);

(async()=>{
 const {chromium}=loadPlaywright();
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],requests=[];
 try{
  const context=await browser.newContext({viewport:{width:375,height:850}});
  await context.setOffline(true);
  await context.addInitScript(()=>localStorage.setItem('duya-local-r39-mini-user','INV'));
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
  await page.goto(artifact);
  try{await page.waitForFunction(()=>window.R3?.state?.me&&window.R38Mini);}
  catch(error){console.error(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(0,1200)}));throw error;}
  check('小程序独立文件加载',await page.evaluate(()=>__DUYA_LOCAL__.key==='duya-local-r39-data'));
  check('r39导航覆盖层加载',await page.evaluate(()=>Boolean(window.R39Navigation)));
  const buildSource=fs.readFileSync(path.join(root,'tools','build.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src','transfer-tools.js'),'utf8');
  check('小程序构建不引用其他版本或后台目录',!buildSource.includes('../V1.5-')&&!buildSource.includes("'..','admin'")&&!buildSource.includes('渡鸦管家-后台.html'));
  await page.locator('#login-tick').click();
  await page.locator('#login-wechat').click();
  await page.waitForSelector('.home-page');
  if(await page.locator('[data-r36-popup-later]').count()){
   check('新奖励弹窗图片已内嵌加载',await page.locator('.r36n-popup-hero img').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));
   await page.locator('[data-r36-popup-later]').click();
  }
  const go=async route=>{
   await page.evaluate(target=>{const button=document.createElement('button');button.dataset.act='local-invite-go';button.dataset.route=target;document.body.append(button);button.click();button.remove();},route);
   await page.waitForTimeout(180);
  };

  await page.evaluate(()=>{
   const me=window.R3.state.me,date=new Date(Date.parse(window.R3.state.now)+8*3600000).toISOString().slice(0,10);
   for(let index=1;index<=4;index++)me.diet.push({id:'R39-PLAN-'+index,date,meal:'早餐',name:'计划测试食物 '+index,grams:100,kcal:100+index,carb:10,protein:5,fat:2,fiber:1});
  });
  await go('track');
  const planCardState=await page.evaluate(()=>{
   const met=document.querySelector('.track-met'),diet=document.querySelector('.r29-diet');
   return {gap:diet.getBoundingClientRect().top-met.getBoundingClientRect().bottom,rows:document.querySelectorAll('.r29-diet .r29-diet-rows>button').length,visible:document.querySelectorAll('.r29-diet .r29-diet-rows>button:not([hidden])').length};
  });
  check('计划页代谢与饮食卡片间距为16px',planCardState.gap>=15);
  check('计划营养卡移除饮食详情入口',await page.locator('.x38-met-actions [data-act="r37h-open-diet"]').count()===0);
  check('计划页饮食卡移除历史记录入口',await page.locator('.r29-diet .r4-history').count()===0);
  check('计划营养卡显示目标按钮',await page.locator('.x38-met-actions [data-act="r25-open-target"]').count()===1);
  const targetAlign=await page.locator('.x38-met-actions').evaluate(node=>({justify:getComputedStyle(node).justifyContent,display:getComputedStyle(node).display,margin:getComputedStyle(node.querySelector('button')).marginLeft,right:node.getBoundingClientRect().right-node.querySelector('button').getBoundingClientRect().right}));
  check('计划营养目标按钮右对齐 '+JSON.stringify(targetAlign),targetAlign.justify==='flex-end'&&targetAlign.right<=1);
  check('计划页饮食默认折叠三项',planCardState.rows>3&&planCardState.visible===3);
  await page.locator('[data-r37c-diet-expand]').click();
  await page.waitForTimeout(220);
  check('展开饮食记录仍停留在计划页',await page.evaluate(()=>window.__duya.state.route==='track'));
  const expandedRows=await page.locator('.r29-diet .r29-diet-rows>button:not([hidden])').count();
  check('展开饮食记录显示全部项目 '+JSON.stringify({expected:planCardState.rows,actual:expandedRows}),expandedRows===planCardState.rows);
  await page.locator('[data-r37c-diet-expand]').click();
  await page.waitForTimeout(220);
  check('收起饮食记录仍停留在计划页',await page.evaluate(()=>window.__duya.state.route==='track'&&document.querySelectorAll('.r29-diet .r29-diet-rows>button:not([hidden])').length===3));
  await page.locator('.x38-met-actions [data-act="r25-open-target"]').click();
  await page.waitForTimeout(140);
  check('调整目标进入营养目标页',await page.locator('.r25-target-page,.r29-target').count()>0);

  await go('profile');
  const quickKeys=await page.locator('.profile-grid .quick-item').evaluateAll(nodes=>nodes.map(node=>node.dataset.key));
  check('快捷服务移除专属客服',!quickKeys.includes('service'));
  check('快捷服务移除我的收藏',!quickKeys.includes('favorites'));
  check('快捷服务移除邀请码',!quickKeys.includes('invite'));
  check('快捷服务保留奖励和活动入口',quickKeys.includes('rewardRecord')&&quickKeys.includes('checkinActivities'));
  const inviteCard=await page.evaluate(()=>{
   const card=document.querySelector('.r39-invite-card'),effective=window.R23Invite.query(window.R3.state,window.R3.state.me.id).effective;
   return {intro:card.querySelector('.r39-invite-intro')?.textContent.trim(),count:card.querySelector('.r39-invite-footer>span')?.textContent.replace(/\s+/g,''),status:card.querySelector('.r39-invite-status')?.textContent,effective};
  });
  check('邀请码活动卡删除进行中状态',!inviteCard.status);
  check('邀请码活动卡显示活动简介',Boolean(inviteCard.intro));
  check('邀请码活动卡显示有效邀请人数',inviteCard.count==='已邀请'+inviteCard.effective+'人');
  check('邀请码活动卡片提供立即邀请入口',await page.locator('.r39-invite-card .r39-invite-entry[data-key="invite"]').count()===1&&await page.locator('.r39-invite-entry').innerText()==='立即邀请');
  check('更多工具新增唯一专属客服入口',await page.locator('.r39-service-tool[data-act="service"]').count()===1);
  await page.locator('.r39-invite-entry').click();
  await page.waitForTimeout(120);
  check('邀请码活动卡片进入邀请码页面',await page.locator('#nav').innerText().then(text=>text.includes('邀请码')));
  await page.locator('[data-act="r25-invite-rules"]').click();
  await page.waitForSelector('.r27-rules-sheet');
  check('邀请码活动规则显示活动简介',await page.locator('.r27-rules-sheet section').first().innerText().then(text=>text.includes('活动简介')&&Boolean(text.trim().replace('活动简介','').trim())));
  await page.evaluate(()=>window.__duya.closeLayer());
  await page.evaluate(()=>{
   window.__r39InviteOriginalUser=window.R3.user;
   window.R3.setUser('NEW');
   window.__duya.render();
  });
  const newInviteState=await page.evaluate(()=>{const me=window.R3.state.me,q=window.R23Invite.query(window.R3.state,me.id);return {me:me.id,route:window.__duya.state.route,binding:me.binding?.code||null,registeredAt:me.registeredAt,deadline:new Date(q.deadline).toISOString(),canBind:q.canBind,card:document.querySelectorAll('.r39-invite-bind').length};});
  check('新用户邀请码详情显示补填入口 '+JSON.stringify(newInviteState),newInviteState.card>0&&await page.locator('.r39-invite-bind #r3-bind-code').count()===1&&await page.locator('.r39-invite-bind [data-act="r3-bind"]').count()===1);
  await page.locator('.r39-invite-bind #r3-bind-code').fill('H8NQ4W3R');
  await page.locator('.r39-invite-bind [data-act="r3-bind"]').click();
  await page.waitForTimeout(180);
  const bindResult=await page.evaluate(()=>({binding:window.R3.state.me?.binding?.code||null,toast:document.querySelector('#toast')?.textContent||'',card:document.querySelectorAll('.r39-invite-bind').length}));
  check('新用户可从邀请码详情完成补填 '+JSON.stringify(bindResult),Boolean(bindResult.binding)&&bindResult.card===0);
  await page.evaluate(()=>{window.R3.setUser(window.__r39InviteOriginalUser);window.__duya.render();});

  await go('article');
  await go('articles');
  check('营养资讯搜索框旁显示我的收藏入口',await page.locator('.r39-article-toolbar>.search-bar+.r39-my-favorites').count()===1);
  await page.locator('.r39-article-toolbar .r39-my-favorites').click();
  await page.waitForTimeout(120);
  check('营养资讯搜索框旁入口打开收藏列表',await page.locator('#nav').innerText().then(text=>text.includes('我的收藏'))&&await page.locator('.article-list .article-row').count()>0);
  await go('article');
  check('营养资讯详情显示我的收藏入口',await page.locator('.article-detail .r39-my-favorites[data-key="favorites"]').count()===1);
  await page.locator('.r39-my-favorites').click();
  await page.waitForTimeout(120);
  check('我的收藏入口打开收藏列表',await page.locator('.article-list .article-row').count()>0&&await page.locator('#nav').innerText().then(text=>text.includes('我的收藏')));
  await go('article');
  const favorite=page.locator('.article-detail .ad-fav[data-act="favorite"]');
  check('营养资讯详情显示收藏入口',await favorite.count()===1);
  const favoriteBefore=await favorite.innerText();
  await favorite.click();
  await page.waitForTimeout(100);
  check('营养资讯详情收藏可切换',await page.locator('.article-detail .ad-fav').innerText().then(text=>text!==favoriteBefore));

  await go('dietHome');
  const calendarState=await page.locator('.r25-record-head .x38-calendar').evaluate(node=>({inside:Boolean(node.closest('.r25-date-switch')),svg:Boolean(node.querySelector('svg'))}));
  check('饮食日期图标独立于日期切换控件',!calendarState.inside);
  check('饮食日期入口使用日历图标',calendarState.svg);
  await page.locator('.x38-calendar').click();
  await page.waitForTimeout(100);
  check('日历图标打开日期弹窗',await page.locator('.r37-calendar-backdrop').count()===1);
  await page.locator('[data-r37-calendar-close]').click();

  await page.evaluate(()=>window.__duya.state.v15.foodCat='全部');
  await go('dietSearch');
  const tools=await page.locator('.r27-food-tools').innerText();
  check('选食页仅显示最近和收藏',tools.includes('最近')&&tools.includes('收藏')&&!tools.includes('全部'));
  check('选食页录入改名自定义',tools.includes('自定义')&&!tools.includes('手填'));
  check('选食页移除拍照',await page.locator('[data-act="v15-photo-open"]').count()===0);
  check('选食页左侧首个分类为最近',await page.locator('.r27-cats button').first().innerText()==='最近'&&await page.locator('.r27-cats button').first().evaluate(node=>node.classList.contains('on')));
  check('旧全部分类自动按最近筛选',await page.evaluate(()=>{const recent=window.__duya.state.v15.recentFoods||[];return [...document.querySelectorAll('.r27-food-main')].every(node=>recent.includes(node.dataset.name));}));
  check('主食分类显示自定义',await page.locator('.r27-cats button').filter({hasText:'自定义'}).count()===1);
  check('食物列表不显示实物图',await page.locator('.r27-food-card .r27-food-image').count()===0);
  await page.locator('[data-act="v15-custom-open"]').click();
  await page.waitForSelector('.x38-custom');
  check('自定义食物删除日期和餐次',await page.locator('.x38-custom [data-custom38="date"],.x38-custom [data-custom38="meal"]').count()===0);
  await page.locator('[data-custom38="name"]').fill('线上自定义测试食物');
  await page.locator('[data-custom38="grams"]').fill('120');
  await page.locator('[data-act="x38-custom-save"]').click();
  await page.waitForTimeout(120);
  check('自定义食物继承当前日期餐次',await page.evaluate(()=>{const b=window.__duya.state.v15?.batch38;const row=window.R38DietUI.batch().rows.at(-1);return Boolean(row?.custom&&row.date&&row.meal);}));
  await page.evaluate(()=>window.R38DietUI.popup(window.R3.state.foods[0].id));
  await page.waitForSelector('.x38-portion');
  const portionText=await page.locator('.x38-portion').innerText();
  check('选择份量不显示ml估算演示提示',!portionText.includes('1ml≈1g')&&!portionText.includes('仅用于演示')&&await page.locator('.x38-ml-note').count()===0);
  check('选择份量底部显示最近使用份量',await page.locator('.x38-recent-portion').count()===1&&await page.locator('.x38-recent-portion .x38-history button').first().innerText()==='100克');
  await page.locator('[data-x38="quantity"]').fill('250');
  await page.locator('.x38-recent-portion .x38-history button').first().click();
  const recentSync=await page.evaluate(()=>({
   quantity:Number(document.querySelector('[data-x38="quantity"]')?.value),
   actual:document.querySelector('[data-x38-actual]')?.textContent||'',
   kcal:Number(document.querySelector('[data-x38-value="kcal"]')?.textContent),
   expectedKcal:Number(window.R3.state.foods[0].kcal)
  }));
  check('最近份量标签点击后同步数量和营养',recentSync.quantity===100&&Number.parseFloat(recentSync.actual)===100&&recentSync.actual.endsWith('克')&&Math.abs(recentSync.kcal-recentSync.expectedKcal)<0.11);
  await page.locator('[data-act="sheet-close"]').click();

  await go('coupons');
  check('优惠券与赠餐双Tab存在',await page.locator('.r36-asset-tabs>button').count()===2);
  await page.locator('[data-act="r36-asset-tab"][data-tab="meals"]').click();
  await page.waitForTimeout(100);
  const mealArtLoaded=await page.locator('.r36v-meal-art').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/')));
  check('优惠券赠餐资产图片正常加载',mealArtLoaded);
  await go('rewardRecords');
  const rewardTabs=page.locator('.r36v-reward-tabs button');
  check('奖励记录包含三个分类Tab',await rewardTabs.count()===3);
  for(let index=0;index<3;index++){
   const tab=rewardTabs.nth(index);
   await tab.click();
   await page.waitForTimeout(100);
   const loaded=await page.locator('.r36v-reward-art').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/')));
   check('奖励分类'+(index+1)+'图片正常加载',loaded);
  }
  check('奖励页无动态资源相对路径',await page.locator('img').evaluateAll(nodes=>nodes.every(node=>!(node.getAttribute('src')||'').startsWith('assets-r36-visual/')&&!(node.getAttribute('src')||'').startsWith('assets-r38-visual/'))));
  await page.evaluate(()=>{const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';for(const activity of window.R3.state.activities37)activity.image=image;});
  await go('checkinActivities');
  check('活动列表直接显示卡片',await page.locator('.r37-activity-card').count()>0);
  check('活动列表显示上传图片',await page.locator('.r38v-activity-photo').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));
  check('活动字段图标正常加载',await page.locator('.r38v-field-icon').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));
  await page.locator('.r37-activity-card').first().click();
  await page.waitForTimeout(160);
  check('活动详情显示上传图片',await page.locator('.r38v-detail-art').evaluateAll(nodes=>nodes.length===1&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));
  check('活动详情图标正常加载',await page.locator('.r38v-detail-icon').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));

  await go('package');
  await page.locator('.shop-subnav [data-route="deliveryCalendar"]').click();
  await page.waitForTimeout(120);
  check('配送日历显示底部订单Tab',await page.locator('#tab-bar').evaluate(node=>!node.hidden));
  check('配送日历激活订单Tab',await page.locator('#tab-bar [data-tab="package"]').evaluate(node=>node.classList.contains('active')));
  await page.locator('.shop-subnav [data-route="plans"]').click();
  await page.waitForTimeout(120);
  check('配送计划显示底部订单Tab',await page.locator('#tab-bar').evaluate(node=>!node.hidden));
  check('配送计划激活订单Tab',await page.locator('#tab-bar [data-tab="package"]').evaluate(node=>node.classList.contains('active')));
  const packageTabLabel=await page.locator('#tab-bar [data-tab="package"]>span:last-child').evaluate(node=>node.textContent.trim());
  check('底部导航套餐入口显示订购 '+JSON.stringify({actual:packageTabLabel}),packageTabLabel==='订购');

  const originalCheckout=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__duya.state.checkout||null)));
  await page.evaluate(()=>{
   window.__duya.closeLayer();
   window.__duya.state.checkout={brandId:'deer',packageId:'trial7',token:'r39-picker-test',paid:false,pin:'',date:'',planId:null};
   window.__duya.ACTIONS['v15-checkout-pick']();
  });
  await page.waitForSelector('.v26-coupon-picker');
  const couponPickerState=await page.evaluate(()=>({
   note:document.querySelectorAll('.v26-coupon-note').length,
   cards:document.querySelectorAll('.r39-coupon-ticket-list>.r33m-ticket').length,
   counts:[...document.querySelectorAll('.r39-coupon-ticket-list .v26-coupon-count')].map(node=>Number.parseInt(node.textContent,10)),
   styled:[...document.querySelectorAll('.r39-coupon-ticket-list>.r33m-ticket')].every(node=>node.querySelector('.r33m-ticket-value')&&node.querySelector('.r33m-ticket-info'))
  }));
  check('优惠券弹窗删除顶部统计卡',couponPickerState.note===0&&!await page.locator('.v26-coupon-picker').innerText().then(text=>text.includes('最多可抵扣')));
  check('优惠券选择器使用资产页票券样式',couponPickerState.cards>0&&couponPickerState.styled);
  check('优惠券按模板合并且在卡内显示数量',couponPickerState.cards>0&&couponPickerState.counts.length===couponPickerState.cards&&couponPickerState.counts.every(Number.isFinite)&&couponPickerState.counts.some(count=>count>1));
  check('优惠券弹窗无横向溢出',await page.locator('.v26-coupon-picker').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  check('多券组合校验已禁用',await page.evaluate(()=>!window.R26Coupons.valid([{},{}])&&window.R26Coupons.best().length<=1));
  const enabledCoupons=page.locator('.v26-coupon-option:not([disabled])');
  check('优惠券弹窗存在可选优惠券',await enabledCoupons.count()>0);
  await enabledCoupons.nth(0).click();
  await page.waitForTimeout(80);
  if(await page.locator('.v26-coupon-option:not([disabled])').count()>1){
   await page.locator('.v26-coupon-option:not([disabled])').nth(1).click();
   await page.waitForTimeout(80);
  }
  check('优惠券弹窗始终仅选择一张',await page.evaluate(()=>window.__duya.state.v15.r26CouponPick.length===1&&document.querySelectorAll('.v26-coupon-option.on').length===1));
  for(const width of [320,375,430]){
   await page.setViewportSize({width,height:850});
   check(width+'px优惠券分组卡无横向溢出',await page.locator('.v26-coupon-picker').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  }
  await page.setViewportSize({width:375,height:850});
  const multiCouponGuard=await page.evaluate(async()=>{
   const state=window.R3.state,brand=state.brands.find(item=>item.status==='上架')||state.brands[0],pkg=state.packages[0];
   try{await window.R3.cmd('PAY',{brandId:brand.id,packageId:pkg.id,couponIds:['r39-a','r39-b'],token:'r39-single-coupon-guard'});return 'accepted';}
   catch(error){return error.message;}
  });
  check('结算引擎拒绝多券',multiCouponGuard.includes('最多使用1张优惠券'));
  await page.evaluate(()=>window.__duya.closeLayer());
  await page.evaluate(()=>window.__duya.ACTIONS['v3-package']({dataset:{id:'trial7'}}));
  await page.waitForSelector('.v36-checkout-meal');
  const mealCountBefore=await page.evaluate(()=>window.R36Mini.checkoutMealCount());
  await page.locator('.v36-checkout-meal button').click();
  await page.waitForSelector('.r36-meal-picker');
  check('选择赠餐弹窗删除当前套餐可用卡片',await page.locator('.r36-meal-picker-head').count()===0&&!await page.locator('.r36-meal-picker').innerText().then(text=>text.includes('当前套餐可用')));
  check('选择赠餐弹窗保留份数输入',await page.locator('#r36-checkout-meal-count').count()===1);
  const mealMax=await page.locator('#r36-checkout-meal-count').evaluate(node=>Number(node.max));
  check('选择赠餐默认填入最大可用份数',mealMax>0&&await page.locator('#r36-checkout-meal-count').inputValue().then(value=>Number(value)===mealMax));
  check('选择赠餐弹窗无横向溢出',await page.locator('.r36-meal-picker').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  for(const width of [320,375,430]){
   await page.setViewportSize({width,height:850});
   check(width+'px赠餐弹窗无横向溢出',await page.locator('.r36-meal-picker').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  }
  await page.setViewportSize({width:375,height:850});
  await page.locator('#r36-checkout-meal-count').fill('0');
  await page.evaluate(()=>window.__duya.closeLayer());
  check('关闭赠餐弹窗不提交草稿',await page.evaluate(before=>window.R36Mini.checkoutMealCount()===before,mealCountBefore));
  await page.evaluate(async()=>window.__duya.ACTIONS['r36-meal-open']());
  await page.waitForSelector('.r36-meal-picker');
  check('再次打开赠餐弹窗仍默认最大',await page.locator('#r36-checkout-meal-count').inputValue().then(value=>Number(value)===mealMax));
  await page.locator('[data-act="r36-meal-save"]').click();
  await page.waitForSelector('.v36-checkout-meal');
  const mealCheckoutText=await page.locator('.v36-checkout-meal button').innerText();
  check('确认赠餐后结算页回显最大份数 '+JSON.stringify({expected:mealMax,actual:mealCheckoutText}),mealCheckoutText.includes('已选 '+mealMax+' 份'));
  await page.evaluate(original=>{window.__duya.closeLayer();window.__duya.state.checkout=original;},originalCheckout);

  for(const route of ['home','track','coupons','rewardRecords','checkinActivities','invite','dietSearch']){
   await go(route);
   await page.waitForTimeout(100);
   check(route+'页面无图片加载失败',await page.locator('img').evaluateAll(nodes=>nodes.every(node=>!node.complete||node.naturalWidth>0)));
  }

  for(const width of [320,375,430]){
   await page.setViewportSize({width,height:850});
   await go('track');
   check(width+'px计划营养卡无横向溢出',await page.locator('.x38-met-nutrition').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
   check(width+'px计划代谢与饮食卡间距稳定',await page.evaluate(()=>{const met=document.querySelector('.track-met'),diet=document.querySelector('.r29-diet');return diet.getBoundingClientRect().top-met.getBoundingClientRect().bottom>=15;}));
   await go('profile');
   check(width+'px邀请活动卡无横向溢出',await page.locator('.r39-invite-card').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
   await go('articles');
   check(width+'px营养资讯搜索与收藏入口无横向溢出',await page.locator('.r39-article-toolbar').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
   await go('dietSearch');
   check(width+'px选食页无横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await go('rewardRecords');
   check(width+'px奖励页无横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   check(width+'px奖励图片正常加载',await page.locator('.r36v-reward-art').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0)));
   for(const route of ['home','track','menu','package','deliveryCalendar','plans','profile']){
    await go(route);
    const geometry=await page.locator('#tab-bar').evaluate(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node);return{hidden:node.hidden,x:box.x,width:box.width,borderRadius:style.borderRadius,boxShadow:style.boxShadow}});
    check(width+'px '+route+'底部导航平铺',!geometry.hidden&&Math.abs(geometry.x)<=1&&Math.abs(geometry.width-width)<=1&&geometry.borderRadius==='0px'&&(geometry.boxShadow==='none'||geometry.boxShadow===''));
   }
   await go('package');
   check(width+'px订单内容不被导航遮挡',await page.evaluate(()=>{const stage=document.querySelector('#stage').getBoundingClientRect(),tab=document.querySelector('#tab-bar').getBoundingClientRect();return stage.bottom<=tab.top+1;}));
  }
  check('小程序无HTTP请求',requests.length===0);
  check('小程序无脚本异常',errors.length===0);
  const rewardContext=await browser.newContext({viewport:{width:375,height:850}});
  await rewardContext.setOffline(true);
  await rewardContext.addInitScript(()=>localStorage.setItem('duya-local-r39-mini-user','REWARD'));
  const rewardPage=await rewardContext.newPage();
  rewardPage.on('pageerror',error=>errors.push('reward:'+error.message));
  rewardPage.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
  await rewardPage.goto(artifact);
  await rewardPage.waitForFunction(()=>window.R3?.state?.me);
  await rewardPage.locator('#login-tick').click();
  await rewardPage.locator('#login-wechat').click();
  await rewardPage.waitForSelector('.home-page');
  check('新奖励用户弹窗图片正常加载',await rewardPage.locator('.r36n-popup-hero img').evaluateAll(nodes=>nodes.length>0&&nodes.every(node=>node.complete&&node.naturalWidth>0&&node.src.startsWith('data:image/'))));
  await rewardContext.close();
 }finally{
  await browser.close();
 }
 console.log(JSON.stringify({role:'mini',passed:checks.length,errors,requests}));
})().catch(error=>{console.error(error);process.exit(1);});
