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

(async()=>{
 const {chromium}=loadPlaywright();
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],requests=[];
 try{
  const context=await browser.newContext({viewport:{width:375,height:850},acceptDownloads:true});
  await context.setOffline(true);
  await context.addInitScript(()=>localStorage.setItem('duya-local-r39-mini-user','INV'));
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
  await page.goto(artifact);
  await page.waitForFunction(()=>window.R3?.state?.me&&window.R39PlanUI);
  await page.locator('#login-tick').click();
  await page.locator('#login-wechat').click();
  await page.waitForSelector('.home-page');

  await page.evaluate(async()=>{await R3.cmd('PLAN_MODE_SAVE',{mode:'advanced',advancedPlanType:'customized'});R39PlanUI.open();});
  await page.waitForSelector('.m39-mode-page');
  check('计划版本包含基础版和进阶版',await page.locator('[data-version="basic"]').count()===1&&await page.locator('[data-version="advanced"]').count()===1);
  check('进阶模式包含定制化和自定义',await page.locator('[data-type="customized"]').count()===1&&await page.locator('[data-type="manual"]').count()===1);
  await page.locator('[data-act="m39-mode-confirm"]').click();
  await page.waitForSelector('.m39-target-page');
  check('定制化默认减脂和稳定减脂',await page.locator('.m39-goal-card.on').innerText().then(text=>text.includes('减脂'))&&await page.locator('.m39-plan-card.on').innerText().then(text=>text.includes('稳定减脂')));
  check('增肌和塑形维持锁定',await page.locator('.m39-goal-card.locked').count()===2);
  check('已删除强控减脂参考',!await page.locator('.m39-target-page').innerText().then(text=>text.includes('强控减脂参考')));
  check('目标体重日期和忌口字段存在',await page.locator('[data-p39="targetWeight"]').count()===1&&await page.locator('[data-p39="targetDate"]').count()===1&&await page.locator('[data-act="p39-taboo"]').count()===12);

  await page.locator('[data-p39="targetWeight"]').fill('50');
  await page.locator('[data-p39="targetDate"]').fill('2027-02-01');
  await page.locator('[data-act="p39-taboo"][data-tag="鸡肉"]').click();
  await page.locator('[data-p39="tabooText"]').fill('羊肉');
  check('具体忌口自动取消无',await page.evaluate(()=>!R39PlanUI.draft.taboos.includes('无')&&R39PlanUI.draft.taboos.includes('鸡肉')));
  await page.locator('[data-act="p39-generate"]').click();
  await page.waitForSelector('.m39-result-page');
  const planState=await page.evaluate(()=>{const p=R3.state.me.advancedPlan39;return {mode:p.mode,meals:p.meals.map(x=>x.meal),history:R3.state.me.advancedPlanHistory39.length,target:p.target.kcal,taboos:p.input.taboos};});
  check('定制化生成午餐和晚餐方案',planState.mode==='customized'&&planState.meals.join('|')==='lunch|dinner');
  check('方案不生成早餐和加餐',!await page.locator('.m39-result-page').innerText().then(text=>/早餐|训练后加餐/.test(text)));
  check('方案目标与历史快照已保存',planState.target>=1200&&planState.history===1);
  check('方案页提供直接修改入口',await page.locator('[data-act="p39-edit"]').count()===1);

  await page.locator('[data-act="p39-edit"]').click();
  await page.waitForSelector('.m39-target-page');
  check('修改方案回填目标体重与日期',await page.locator('[data-p39="targetWeight"]').inputValue().then(value=>value==='50')&&await page.locator('[data-p39="targetDate"]').inputValue().then(value=>value==='2027-02-01'));
  await page.locator('[data-act="p39-generate"]').click();
  await page.waitForSelector('.m39-result-page');
  check('重新生成保留历史快照',await page.evaluate(()=>R3.state.me.advancedPlanHistory39.length===2));

  await page.locator('[data-act="p39-full-report"]').click();
  await page.waitForSelector('.m39-report-sheet');
  check('完整报告包含午餐晚餐与预期效果',await page.locator('.m39-report-sheet').innerText().then(text=>text.includes('午餐')&&text.includes('晚餐')&&text.includes('预期效果')&&!text.includes('早餐')&&!text.includes('训练后加餐')));
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-act="p39-report-download"]').click();
  const download=await downloadPromise;
  check('完整报告可下载PNG',download.suggestedFilename().endsWith('.png'));
  check('免责声明可打开',await page.locator('[data-act="p39-report-disclaimer"]').click().then(async()=>Boolean(await page.locator('.m39-disclaimer').count())));
  if(await page.locator('[data-act="close-modal"],[data-act="sheet-close"]').count())await page.locator('[data-act="close-modal"],[data-act="sheet-close"]').last().click();
  await page.locator('[data-act="p39-report-back"]').click();
  await page.waitForSelector('.m39-result-page');
  await page.locator('[data-act="p39-history"]').click();
  await page.waitForSelector('.m39-history-page');
  check('历史方案入口可查看快照列表',await page.locator('.m39-history-list button').count()===2);
  await page.locator('[data-act="p39-history-open"]').first().click();
  await page.waitForSelector('.m39-report-sheet');
  await page.locator('[data-act="p39-report-back"]').click();
  await page.waitForSelector('.m39-result-page');

  await page.locator('[data-act="p39-start"]').click();
  await page.waitForTimeout(150);
  const prefill=await page.evaluate(()=>({route:window.__duya.state.route,rows:R38DietUI.batch().rows.filter(row=>row.date===window.__duya.state.v15.dietDate&&row.meal==='午餐').map(row=>row.name)}));
  check('开始执行进入择食并预填午餐',prefill.route==='dietSearch'&&prefill.rows.length>=2);

  await page.evaluate(()=>window.__duya.go('menu'));
  await page.locator('.nav-goal').click();
  await page.waitForSelector('.m39-version-sheet');
  await page.locator('[data-act="p39-version-set"][data-version="basic"]').click();
  await page.waitForFunction(()=>document.body.innerText.includes('Leapeer 鹿跃森'));
  check('基础版保留原品牌列表',await page.locator('body').innerText().then(text=>text.includes('Leapeer 鹿跃森')&&text.includes('薄荷晨间')));
  await page.locator('.nav-goal').click();
  await page.locator('[data-act="p39-version-set"][data-version="advanced"]').click();
  await page.waitForSelector('.m39-result-page');

  await page.evaluate(async()=>{await R3.cmd('PLAN_MODE_SAVE',{mode:'advanced',advancedPlanType:'manual'});R39PlanUI.openManual();});
  await page.waitForSelector('.m39-manual-target');
  await page.locator('[data-r25-target="kcal"]').fill('1500');
  await page.locator('[data-act="p39-manual-save"]').dispatchEvent('click');
  await page.waitForSelector('.m39-result-page');
  check('自定义营养数值可生成方案',await page.evaluate(()=>R3.state.me.advancedPlan39.mode==='manual'&&R3.state.me.advancedPlan39.meals.length===2));
  await page.evaluate(()=>R39PlanUI.openManual());
  await page.waitForSelector('.m39-manual-target');
  await page.locator('[data-r25-target="kcal"]').fill('1000');
  await page.locator('[data-act="p39-manual-save"]').dispatchEvent('click');
  await page.waitForSelector('.m39-safety');
  check('低于阈值弹出安全提示',await page.locator('.m39-safety').innerText().then(text=>text.includes('1200')&&text.includes('基础代谢')));
  check('安全提示提供基础版和修改按钮',await page.locator('[data-act="p39-safe-base"]').count()===1&&await page.locator('[data-act="p39-safe-edit"]').count()===1);
  await page.locator('[data-act="p39-safe-edit"]').click();
  check('安全提示去修改保留目标值',await page.locator('[data-r25-target="kcal"]').inputValue().then(value=>Number(value)===1000));
  await page.locator('[data-act="p39-manual-save"]').dispatchEvent('click');
  await page.waitForSelector('.m39-safety');
  await page.locator('[data-act="p39-safe-base"]').click();
  await page.waitForFunction(()=>document.body.innerText.includes('Leapeer 鹿跃森'));
  check('安全提示切换基础版成功',await page.evaluate(()=>R3.state.me.planMode==='basic'));

  for(const width of [320,375,430]){
   await page.setViewportSize({width,height:850});
   await page.evaluate(()=>{const p=R39PlanMode.preview(R3.state,R3.state.me,{mode:'customized',goal:'减脂',planKey:'stable',targetWeight:50,targetDate:'2027-02-01',taboos:['无'],tabooText:''});});
   await page.evaluate(()=>window.__duya.go('planTarget39'));
   await page.waitForSelector('.m39-target-page');
   check(width+'px定制化目标页无横向溢出',await page.locator('.m39-target-page').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
   await page.evaluate(()=>window.__duya.go('planResult39'));
   await page.waitForSelector('.m39-result-page');
   check(width+'px方案结果页无横向溢出',await page.locator('.m39-result-page').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
   await page.evaluate(()=>window.__duya.go('planReport39'));
   await page.waitForSelector('.m39-report-sheet');
   check(width+'px完整报告页无横向溢出',await page.locator('.m39-report-page').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  }
  check('进阶计划专项无脚本异常',errors.length===0);
  check('进阶计划专项无HTTP请求',requests.length===0);
 }finally{
  await browser.close();
 }
 console.log(JSON.stringify({role:'mini-plan39',passed:checks.length,errors,requests}));
})().catch(error=>{console.error(error);process.exit(1);});
