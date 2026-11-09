const fs=require('fs');
const path=require('path');
const os=require('os');
const vm=require('vm');
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
const artifact='file:///'+path.join(root,'dist','渡鸦管家-后台.html').replaceAll('\\','/');
const checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const navigate=async(page,route)=>{await page.evaluate(target=>__g8Core.navigate(target),route);await page.waitForTimeout(150);};
const setNativeSelect=async(page,locator,value)=>{await locator.evaluate((node,next)=>{node.value=next;node.dispatchEvent(new Event('change',{bubbles:true}));},value);await page.waitForTimeout(150);};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
const used=new Set(manifest.sourceFiles.map(item=>item.path));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const files=walk(root).map(file=>path.relative(root,file).replaceAll('\\','/'));
const managed=files.filter(file=>!/^(dist\/|tests\/|README\.md$|build-manifest\.json$)/.test(file));
check('目录内文件全部被构建引用',managed.every(file=>used.has(file)));
const hashes=managed.map(file=>require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'));
check('目录内无完全重复文件',new Set(hashes).size===hashes.length);

function packedInitial(){
 const context={window:{},TextEncoder,TextDecoder};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'src','storage-r37.js'),'utf8'),context);
 const data=JSON.parse(fs.readFileSync(path.join(root,'data','initial-state.json'),'utf8'));
 return context.window.R37Storage.encode(data);
}

(async()=>{
 const {chromium}=loadPlaywright();
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],requests=[];
 try{
  const context=await browser.newContext({viewport:{width:1384,height:820}});
  await context.setOffline(true);
  await context.addInitScript(value=>localStorage.setItem('duya-local-r38-data',value),packedInitial());
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
  await page.goto(artifact);
  try{await page.waitForFunction(()=>window.R3?.state&&window.R38Admin);}
  catch(error){console.error(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(0,1200)}));throw error;}
  check('后台独立文件加载',await page.evaluate(()=>__DUYA_LOCAL__.key==='duya-local-r39-data'));
  check('迁移生成r39数据',await page.evaluate(()=>Boolean(localStorage.getItem('duya-local-r39-data'))));
  check('r38原缓存保留',await page.evaluate(()=>Boolean(localStorage.getItem('duya-local-r38-data'))));
  check('r38作为迁移来源',await page.evaluate(()=>__DUYA_LOCAL__.storageHealth().bootstrapSource==='r38'));

  await page.locator('#login-account').fill('admin');
  await page.locator('#login-password').fill('Raven@2026');
  await page.locator('#login-submit').click();
  await page.waitForSelector('.nav-label');
  const issueCheck=await page.evaluate(async()=>{
   window.R3.skipConfirm=true;
   const template=window.R3.state.templates.find(item=>item.status==='启用');
   const user=window.R3.state.users.find(item=>item.id==='PAID');
   const before=user.rewards.filter(item=>item.config?.couponId===template.id).length;
   await window.R3.cmd('ADMIN_ISSUE',{templateId:template.id,users:[user.id],note:'r39独立发券检查'},'r39-issue-check-1');
   await window.R3.cmd('ADMIN_ISSUE',{templateId:template.id,users:[user.id],note:'r39独立发券检查'},'r39-issue-check-2');
   const after=window.R3.state.users.find(item=>item.id==='PAID').rewards.filter(item=>item.config?.couponId===template.id).length;
   return {before,after,limit:template.limit};
  });
  check('r39优惠券不限领取数量',issueCheck.limit===0&&issueCheck.after===issueCheck.before+2);

  await navigate(page,'coupons');
  await page.locator('[data-group="coupons"][data-tab="templates"]').click();
  await page.locator('[data-action="r3-new"][data-entity="coupon"]').first().click();
  await page.waitForTimeout(120);
  check('优惠券编辑无每人限领字段',await page.locator('#r3-editor [name="limit"],#r3-editor [name="limitMode"]').count()===0);

  await navigate(page,'invites');
  await page.locator('[data-group="invites"][data-tab="merchant"]').click();
  await page.locator('[data-action="r3-new"][data-entity="merchant"]').first().click();
  await page.waitForTimeout(120);
  check('商户邀请码显示活动时间',await page.locator('#r3-editor [name="validityMode"]').count()===1);
  check('活动时间包含长期和时段',await page.locator('#r3-editor [name="validityMode"] option').allTextContents().then(values=>values.join('|')==='长期有效|时间段'));
  await page.locator('#r3-editor button').filter({hasText:'时间段'}).click();
  check('时间段显示日期字段',await page.locator('#r3-editor [name="start"]').isVisible());
  await setNativeSelect(page,page.locator('[data-binding37-editor] [data-bind37="target"]'),'new');
  check('商户邀请奖励类型仅显示一次',await page.locator('[data-binding37-editor] [data-bind37="type"]').count()===1&&await page.locator('[data-binding37-editor] .r37f-binding-tier').count()===1);
  check('商户邀请奖励类型文案明确',await page.locator('[data-binding37-editor] .r37f-binding-tier>label').first().evaluate(node=>node.childNodes[0].textContent.trim())==='被邀请人奖励类型');
  await page.locator('[data-bind37="mode"] + .x38-options [data-value="probability"]').first().click();
  await page.waitForTimeout(120);
  check('切换概率奖励不产生重复档位',await page.locator('[data-binding37-editor] .r37f-binding-tier').count()===1&&await page.locator('[data-binding37-editor] .r37f-binding-tier>label').filter({hasText:'被邀请人奖励类型'}).count()===1);
  check('概率切档不再生成NaN',await page.locator('[data-binding37-editor] [data-bind37="probability"]').inputValue().then(value=>value!=='NaN'&&Number.isFinite(Number(value))));
  check('单档概率奖励显示至少保留一档',await page.locator('[data-binding37-editor] .r37f-tier-minimum').innerText()==='至少保留一档'&&await page.locator('[data-binding37-editor] [data-action="bind37-remove"]').count()===0);
  await page.locator('[data-binding37-editor] [data-action="bind37-add"]').click();
  await page.waitForTimeout(120);
  check('新增奖励档位只增加一条',await page.locator('[data-binding37-editor] .r37f-binding-tier').count()===2);
  await page.locator('[data-binding37-editor] [data-action="bind37-remove"]').first().click();
  await page.waitForTimeout(120);
  check('删除奖励档位立即生效',await page.locator('[data-binding37-editor] .r37f-binding-tier').count()===1&&await page.locator('[data-binding37-editor] .r37f-tier-minimum').count()===1);
  await page.locator('[data-bind37="type"] + .x38-options [data-value="custom"]').first().click();
  await page.waitForTimeout(120);
  check('自定义奖励切换后图片控件正常',await page.locator('[data-binding37-editor] .r37f-binding-tier').count()===1&&await page.locator('[data-binding37-editor] [data-bind37-image]').count()===1);
  for(const width of [1384,1280,900]){
   await page.setViewportSize({width,height:820});
   check(width+'px邀请奖励表单无横向溢出',await page.locator('[data-binding37-editor]').evaluate(node=>node.scrollWidth<=node.clientWidth+1));
  }
  await page.setViewportSize({width:1384,height:820});
  const buildSource=fs.readFileSync(path.join(root,'tools','build.js'),'utf8');
  check('后台构建不引用其他版本或小程序目录',!buildSource.includes('../V1.5-')&&!buildSource.includes("'..','mini'")&&!buildSource.includes('"../mini"'));

  await page.reload();
  await page.waitForFunction(()=>window.R3?.state&&window.R38Admin);
  await page.locator('#login-account').fill('admin');
  await page.locator('#login-password').fill('Raven@2026');
  await page.locator('#login-submit').click();
  await page.waitForSelector('.nav-label');
  await navigate(page,'invite-settings');
  check('用户邀请设置显示活动时间',await page.locator('#invite-settings-editor [name="validityMode"]').count()===1);
  check('邀请活动简介位于基础设置整行',await page.locator('#invite-settings-editor .r39-invite-intro textarea[name="inviteIntro"]').count()===1);
  const originalBindingTarget=await page.locator('[data-binding37-editor] [data-bind37="target"]').inputValue();
  await setNativeSelect(page,page.locator('[data-binding37-editor] [data-bind37="target"]'),'both');
  const userBindingState=await page.locator('[data-binding37-editor] [data-bind37-side]').evaluateAll(sections=>sections.map(section=>({side:section.dataset.bind37Side,tiers:section.querySelectorAll(':scope > .r37f-binding-tier').length,types:section.querySelectorAll('[data-bind37="type"]').length,label:section.querySelector('.r37f-binding-tier>label')?.childNodes[0]?.textContent.trim()})));
  check('用户邀请双方奖励类型各显示一次',userBindingState.length===2&&userBindingState.every(item=>item.tiers===1&&item.types===1)&&userBindingState.find(item=>item.side==='inviter')?.label==='邀请人奖励类型'&&userBindingState.find(item=>item.side==='invitee')?.label==='被邀请人奖励类型');
  await setNativeSelect(page,page.locator('[data-bind37-side="invitee"] [data-bind37="mode"]'),'probability');
  await page.locator('[data-bind37-side="invitee"] [data-action="bind37-add"]').click();
  await page.waitForTimeout(120);
  check('用户邀请只增加被邀请人档位',await page.locator('[data-bind37-side="invitee"]>.r37f-binding-tier').count()===2&&await page.locator('[data-bind37-side="inviter"]>.r37f-binding-tier').count()===1);
  await page.locator('[data-bind37-side="invitee"] [data-action="bind37-remove"]').first().click();
  await page.waitForTimeout(120);
  check('用户邀请删除档位不影响邀请人奖励',await page.locator('[data-bind37-side="invitee"]>.r37f-binding-tier').count()===1&&await page.locator('[data-bind37-side="inviter"]>.r37f-binding-tier').count()===1);
  await setNativeSelect(page,page.locator('[data-binding37-editor] [data-bind37="target"]'),originalBindingTarget);
  const intro='好友完成注册并满足活动条件后，双方按活动规则获得对应奖励。';
  await page.locator('[name="inviteIntro"]').fill(intro);
  await page.evaluate(()=>{window.R3.skipConfirm=true;});
  await page.locator('[data-action="g15-save-invite-settings"]').click();
  await page.waitForTimeout(180);
  check('邀请活动简介保存到设置',await page.evaluate(value=>window.R3.state.settings.inviteIntro===value,intro));
  check('邀请奖励保存后无重复档位',await page.evaluate(()=>{const rules=window.R3.state.settings.bindingRewards;return rules.inviter.rewards.length===1&&rules.invitee.rewards.length===1;}));

  await navigate(page,'users');
  check('用户数据使用绑定邀请码文案',await page.locator('#workspace').innerText().then(text=>text.includes('绑定邀请码')&&!text.includes('绑定商户邀请码')));
  await navigate(page,'user-growth');
  await page.locator('[data-action="a37-new"]').click();
  await page.waitForTimeout(120);
  check('用户活动人群只保留全量和指定用户',await page.locator('#activity37-form [name="audienceMode"] option').evaluateAll(nodes=>nodes.map(node=>node.value).join('|')==='all|users'));
  check('移除选择具体人群按钮',await page.locator('[data-action="a37-audience"]').count()===0);
  await page.locator('#activity37-form button').filter({hasText:'指定用户'}).click();
  check('指定用户直接打开人员弹窗',await page.locator('.g16-picker-panel').count()===1);
  await page.locator('.g16-picker-panel [data-g16-audience-cancel]').last().click();
  const activityCountBefore=await page.evaluate(()=>window.R3.state.activities37.length);
  const activityImageField=page.locator('#activity37-form .a37-activity-image-field');
  check('活动编辑显示整行活动图片上传',await activityImageField.count()===1&&await activityImageField.evaluate(node=>getComputedStyle(node).gridColumn==='1 / -1'));
  await page.evaluate(()=>{window.R3.skipConfirm=true;});
  await page.locator('[data-action="a37-save"]').click();
  await page.waitForTimeout(120);
  check('新建活动未上传图片时阻止保存',await page.locator('#activity37-form').count()===1&&await page.evaluate(()=>window.R3.state.activities37.length)===activityCountBefore);
  const imageInput=page.locator('[data-a37-activity-image]');
  await imageInput.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
  await page.waitForTimeout(80);
  check('活动图片拒绝不支持格式',await page.locator('.a37-activity-image-preview img').count()===0);
  await imageInput.setInputFiles({name:'too-large.png',mimeType:'image/png',buffer:Buffer.alloc(1024*1024+1,1)});
  await page.waitForTimeout(80);
  check('活动图片限制1MiB',await page.locator('.a37-activity-image-preview img').count()===0);
  const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  await imageInput.setInputFiles({name:'activity.png',mimeType:'image/png',buffer:tinyPng});
  await page.waitForSelector('.a37-activity-image-preview img');
  check('活动图片上传后可预览',await page.locator('.a37-activity-image-preview img').evaluate(node=>node.src.startsWith('data:image/png;base64,')));
  await page.locator('#activity37-form [name="name"]').fill('r39活动图片验证');
  await page.locator('[data-action="a37-save"]').click();
  await page.waitForFunction(count=>window.R3.state.activities37.length===count+1,activityCountBefore);
  check('活动图片保存到活动数据',await page.evaluate(()=>{const item=window.R3.state.activities37.find(activity=>activity.name==='r39活动图片验证');return Boolean(item?.image?.startsWith('data:image/png;base64,'));}));
  await page.locator('[name="r37GrowthName"]').fill('r39活动图片验证');
  await page.locator('[data-action="r37-growth-find"]').click();
  await page.waitForTimeout(120);
  const newActivityRow=page.locator('.a37-table tbody tr').filter({hasText:'r39活动图片验证'});
  check('用户活动表显示独立图片列',await page.locator('.a37-table thead th').filter({hasText:'活动图片'}).count()===1&&await newActivityRow.locator('.a37-activity-thumb').evaluate(async node=>{if(!node.complete)await new Promise(resolve=>node.addEventListener('load',resolve,{once:true}));return node.src.startsWith('data:image/png;base64,')&&node.naturalWidth>0;}));
  await page.locator('[data-action="r37-growth-reset"]').click();
  await page.waitForTimeout(120);
  check('无图用户活动显示图片占位',await page.locator('.a37-table .a37-activity-noimg').count()>0);
  const legacyActivity=await page.evaluate(()=>{const item=window.R3.state.activities37.find(activity=>!activity.image);return item?{id:item.id,name:item.name,count:window.R3.state.activities37.length}:null;});
  check('存在无图历史活动用于兼容验证',Boolean(legacyActivity));
  await navigate(page,'user-growth');
  await page.locator('[data-action="a37-edit"][data-id="'+legacyActivity.id+'"]').click();
  await page.waitForSelector('#activity37-form');
  await page.locator('[data-action="a37-save"]').click();
  await page.waitForFunction(count=>window.R3.state.activities37.length===count,legacyActivity.count);
  check('无图历史活动仍可编辑保存',await page.evaluate(id=>Boolean(window.R3.state.activities37.find(activity=>activity.id===id)),legacyActivity.id));

  await page.reload();
  await page.waitForFunction(()=>window.R3?.state&&window.R38Admin);
  await page.locator('#login-account').fill('admin');
  await page.locator('#login-password').fill('Raven@2026');
  await page.locator('#login-submit').click();
  await page.waitForSelector('.nav-label');
  await navigate(page,'app-rules');
  check('系统设置正常打开',await page.locator('#workspace').innerText().then(text=>text.includes('小程序规则')));
  check('后台无HTTP请求',requests.length===0);
  check('后台无脚本异常',errors.length===0);
 }finally{
  await browser.close();
 }
 console.log(JSON.stringify({role:'admin',passed:checks.length,errors,requests}));
})().catch(error=>{console.error(error);process.exit(1);});
