// r39 plan version switch, guided/manual generation, reports and execution hand-off.
(()=>{
 const P=window.R39PlanMode,e=esc,baseMenu=SCREENS.menu.render;
 const N=x=>Math.round(Number(x||0)*10)/10;
 let modeDraft=null,customDraft=null,manualFlow=false,saving=false,safetyPending=null,reportId='current';
 const user=()=>r3Me(),plan=()=>P.read(user()).current;
 const fmtDate=value=>value?new Date(value).toLocaleDateString('zh-CN'):'—';
 const addDays=days=>{const date=new Date(Date.parse(r3.state.now)+days*86400000),key=window.__DUYA_LOCAL_ENGINE.dateKey(date.getTime());return key};
 const modeTitle=value=>value==='advanced'?'进阶版':'基础版';
 const typeTitle=value=>value==='manual'?'自定义':'定制化';
 const mealTitle=key=>key==='lunch'?'午餐':'晚餐';
 const modeAssets={hero:window.__offlineAsset('assets-r39-mode/hero.png'),basic:window.__offlineAsset('assets-r39-mode/basic.png'),advanced:window.__offlineAsset('assets-r39-mode/advanced.png')};
 const art=(name,cls)=>'<img class="'+cls+'" data-r39-mode-art="'+e(name)+'" loading="eager" decoding="sync" src="'+e(modeAssets[name]||window.__offlineAsset('assets-r39-mode/'+name+'.png'))+'" alt="" aria-hidden="true">';
 const activityText=value=>({'久坐不动':'日常轻活动','轻度活动':'每周轻运动 2～3 次','中度活动':'规律运动 3～5 次','高度活动':'高频运动 5～6 次','极高活动':'高强度训练或体力工作'})[value]||value||'日常活动';
 const safeAsync=fn=>()=>Promise.resolve().then(fn).catch(error=>{if(!error?.cancelled)toast('操作未完成',error?.message||'请稍后重试','error')});

 function ensureModeDraft(){
  if(!modeDraft||modeDraft.user!==r3.user){
   const selected=P.read(user());
   modeDraft={user:r3.user,version:selected.mode};
  }
  return modeDraft;
 }
 function openMode(onboarding=false){
  const selected=P.read(user());
  modeDraft={user:r3.user,version:onboarding?'advanced':selected.mode};
  closeAllLayers();go('planMode39',{replace:true,root:onboarding,tab:'menu'});
 }
 function modeCard(version,title,subtitle,description,image){
  const selected=ensureModeDraft().version===version;
  return '<button type="button" role="radio" aria-checked="'+selected+'" class="m39-choice '+(selected?'on':'')+'" data-act="m39-version-pick" data-version="'+version+'">'+art(image,'m39-choice-art')+'<span><b>'+title+'</b><small>'+subtitle+'<br>'+description+'</small></span><i class="m39-choice-mark">'+(selected?'✓':'›')+'</i></button>';
 }
 SCREENS.planMode39={title:'选择计划版本',noTab:true,navStyle:{bg:'#fafdf8',ink:'#163c31'},render(){
  return '<div class="m39-page m39-mode-page"><header class="m39-hero"><div><h1>选择适合你的<br>计划版本</h1><i></i><p>基础版保留品牌菜单，进阶版按目标生成餐食方案。</p></div>'+art('hero','m39-hero-art')+'</header>'+
   '<section class="m39-version-box"><h2>① 选择版本</h2>'+modeCard('basic','基础版','保留原有品牌菜单','自行选择品牌和餐食','basic')+modeCard('advanced','进阶版','目标管理与餐食方案','生成午餐、晚餐和完整报告','advanced')+'</section>'+
   '<footer class="m39-footer"><button type="button" class="m39-confirm" data-act="m39-mode-confirm">确认并进入</button></footer></div>';
 },mounted(){
  document.querySelectorAll('.m39-mode-page [data-r39-mode-art]').forEach(image=>{
   const key=image.dataset.r39ModeArt;if(modeAssets[key])image.src=modeAssets[key];
   image.onerror=()=>{image.onerror=null;if(modeAssets[key]&&image.src!==modeAssets[key])image.src=modeAssets[key];};
  });
 }};

 async function activateVersion(version){
  if(saving)return;saving=true;
  try{
   await r3.cmd('PLAN_MODE_SAVE',{mode:version});
   modeDraft=null;closeAllLayers();
   manualFlow=false;go('menu',{replace:true,root:true,tab:'menu'});toast(version==='advanced'?'已切换到进阶版':'已切换为基础版');
  }finally{saving=false;}
 }
 ACTIONS['goal-chip']=()=>openMode(false);
 ACTIONS['r3-plan-create']=()=>openMode(P.read(user()).pending);
 ACTIONS['goal-edit']=()=>{const current=plan();if(current)editPlan();else openMode(false);};
 ACTIONS['m39-target-open']=()=>openMode(false);
 r3Act('m39-version-pick',node=>{ensureModeDraft().version=node.dataset.version;render();});
 r3Act('m39-mode-confirm',()=>activateVersion(ensureModeDraft().version));

 function advancedModeSheet(){
  const selected=P.read(user()).type;
  sheet({title:'选择进阶模式',body:'<div class="m39-version-sheet"><button data-act="p39-mode-set" data-type="customized" class="'+(selected==='customized'?'on':'')+'"><span><b>定制化</b><small>填写减脂目标，由系统计算热量并生成午晚餐</small></span><i>'+(selected==='customized'?'✓':'›')+'</i></button><button data-act="p39-mode-set" data-type="manual" class="'+(selected==='manual'?'on':'')+'"><span><b>自定义</b><small>自行填写每日热量与三大营养素</small></span><i>'+(selected==='manual'?'✓':'›')+'</i></button></div>',dismissible:true});
 }
 async function chooseAdvancedMode(type){
  if(saving)return;saving=true;
  try{
   await r3.cmd('PLAN_MODE_SAVE',{mode:'advanced',advancedPlanType:type});
   closeAllLayers();
   if(type==='customized')openCustomTarget();
   else openManual();
  }finally{saving=false;}
 }
 r3Act('p39-mode-open',advancedModeSheet);
 r3Act('p39-mode-set',node=>chooseAdvancedMode(node.dataset.type));

 function defaultCustomDraft(){
  const current=plan(),weight=Number(user()?.profile?.weight)||60;
  if(current?.mode==='customized')return JSON.parse(JSON.stringify(current.input));
  return {mode:'customized',goal:'减脂',planKey:'stable',targetWeight:Math.max(35,Math.round((weight-2)*10)/10),targetDate:addDays(90),taboos:['无'],tabooText:''};
 }
 function openCustomTarget(input){
  customDraft=input?JSON.parse(JSON.stringify(input)):defaultCustomDraft();
  closeAllLayers();go('planTarget39',{replace:true});
 }
 function goalCard(goal,description,locked){
  const selected=!locked&&goal==='减脂';
  return '<button type="button" class="m39-goal-card '+(selected?'on':'')+' '+(locked?'locked':'')+'" '+(locked?'aria-disabled="true" data-locked="yes"':'data-act="p39-goal"')+' data-goal="'+e(goal)+'"><b>'+e(goal)+'</b><small>'+e(description)+'</small><i>'+(locked?'🔒':selected?'✓':'')+'</i></button>';
 }
 function planOption(key){
  const meta=P.plans[key],selected=customDraft.planKey===key;
  return '<button type="button" class="m39-plan-card '+(selected?'on':'')+'" data-act="p39-plan" data-plan="'+key+'"><span><b>'+e(meta.label)+'</b>'+(meta.recommended?'<em>推荐</em>':'')+'<small>'+e(meta.note)+'</small></span><i>'+(selected?'✓':'○')+'</i></button>';
 }
 function tabooHTML(){
  const selected=customDraft.taboos||['无'];
  return P.taboos.map(tag=>'<button type="button" class="'+(selected.includes(tag)?'on':'')+'" data-act="p39-taboo" data-tag="'+e(tag)+'">'+e(tag)+'</button>').join('');
 }
 SCREENS.planTarget39={title:'设置减脂目标',noTab:true,navStyle:{bg:'#f6faf7',ink:'#164534'},render(){
  if(!customDraft)customDraft=defaultCustomDraft();
  const profile=user()?.profile||{},weight=Number(profile.weight)||0;
  return '<div class="m39-target-page"><header class="m39-flow-head"><small>ADVANCED GOAL</small><h1>选择方案模式</h1><p>先明确目标和节奏，再生成适合你的午餐晚餐方案。</p></header>'+
   '<section class="m39-target-card"><h2><i>1</i>你的主要目标是什么？</h2><div class="m39-goal-grid">'+goalCard('减脂','降低体脂，管理体重',false)+goalCard('增肌','支持肌肉增长和训练',true)+goalCard('塑形/维持','维持体重，优化体型',true)+'</div>'+
   '<h2><i>2</i>选择具体方案</h2><div class="m39-plan-list">'+Object.keys(P.plans).map(planOption).join('')+'</div>'+
   '<h2><i>3</i>目标体重和达成日期</h2><div class="m39-target-fields"><label class="readonly"><span>当前体重</span><b>'+N(weight)+' kg</b></label><label><span>目标体重</span><div><input data-p39="targetWeight" type="number" min="25" max="'+(weight?weight-.1:200)+'" step="0.1" value="'+e(customDraft.targetWeight||'')+'"><em>kg</em></div></label><label><span>目标达成日期</span><input data-p39="targetDate" type="date" min="'+addDays(1)+'" value="'+e(customDraft.targetDate||'')+'"></label></div>'+
   '<h2><i>4</i>食物忌口</h2><p class="m39-field-note">可多选；选择具体忌口会自动取消“无”。</p><div class="m39-taboos">'+tabooHTML()+'</div><label class="m39-custom-taboo"><span>其他忌口</span><input data-p39="tabooText" maxlength="120" value="'+e(customDraft.tabooText||'')+'" placeholder="如：不吃羊肉、少油"></label>'+
   '</section><footer class="m39-sticky-actions"><button class="m39-outline" data-act="p39-target-back">返回</button><button class="m39-confirm" data-act="p39-generate">'+(plan()?.mode==='customized'?'修改并生成方案':'确认并生成方案')+'</button></footer></div>';
 }};
 document.addEventListener('input',event=>{const key=event.target.dataset.p39;if(!key||state.route!=='planTarget39'||!customDraft)return;customDraft[key]=event.target.value;r3SaveDraft();});
 document.addEventListener('change',event=>{const key=event.target.dataset.p39;if(!key||state.route!=='planTarget39'||!customDraft)return;customDraft[key]=event.target.value;r3SaveDraft();});
 r3Act('p39-goal',node=>{if(node.dataset.locked)return;customDraft.goal=node.dataset.goal;render();});
 r3Act('p39-plan',node=>{customDraft.planKey=node.dataset.plan;render();});
 r3Act('p39-taboo',node=>{
  const tag=node.dataset.tag,selected=new Set(customDraft.taboos||['无']);
  if(tag==='无')customDraft.taboos=['无'];
  else{selected.delete('无');selected.has(tag)?selected.delete(tag):selected.add(tag);customDraft.taboos=selected.size?[...selected]:['无'];}
  render();
 });
 r3Act('p39-target-back',()=>{manualFlow=false;go('menu',{replace:true,tab:'menu'});});

 function targetPage(){
  const target=r3UI.r25?.targetDraft||window.R25Nutrition.getTarget(user()),mode=r3UI.r25?.targetMode||'percent';
  const row=(key,label)=>'<div class="r25-target-row"><span>'+label+'</span>'+(mode==='percent'?'<label><input data-r25-target="pct-'+key+'" type="number" min="0" max="100" step="0.1" value="'+target.percentages[key]+'"><em>%</em></label><small>'+v15Num(target.grams[key],1)+' 克</small>':'<label><input data-r25-target="gram-'+key+'" type="number" min="0" max="1500" step="0.1" value="'+target.grams[key]+'"><em>克</em></label><small>'+v15Num(target.percentages[key],1)+'%</small>')+'</div>';
  return '<div class="v15-page r25-target-page m39-manual-target"><header class="m39-flow-head"><small>CUSTOM TARGET</small><h1>自定义营养数值</h1><p>填写每日热量和三大营养素，系统将据此生成午餐晚餐方案。</p></header><section class="card r25-target-form"><div class="r25-mode-tabs"><button class="'+(mode==='percent'?'on':'')+'" data-act="r25-target-mode" data-mode="percent">按比例</button><button class="'+(mode==='grams'?'on':'')+'" data-act="r25-target-mode" data-mode="grams">按克重</button></div><label class="r25-kcal-input"><span>每日热量</span><input data-r25-target="kcal" type="number" min="500" max="6000" value="'+target.kcal+'"><em>kcal</em></label><div class="r25-target-list">'+['carb','protein','fat'].map((key,i)=>row(key,['碳水','蛋白质','脂肪'][i])).join('')+'</div><p class="r25-total-meter '+(Math.abs(Object.values(target.percentages).reduce((a,b)=>a+b,0)-100)<.2?'ok':'warn')+'">比例合计 '+v15Num(Object.values(target.percentages).reduce((a,b)=>a+b,0),1)+'%</p><div class="r25-target-actions"><button class="v15-btn ghost" data-act="r25-target-reset">恢复推荐值</button><button class="v15-btn" data-act="p39-manual-save">确认并生成方案</button></div></section></div>';
 }
 const originalTargetRender=SCREENS.nutritionTarget.render;
 SCREENS.nutritionTarget.render=function(){return manualFlow?targetPage():originalTargetRender.apply(this,arguments)};
 function openManual(){
  manualFlow=true;
  const current=plan();
  r3UI.r25=r3UI.r25||{};
  if(current?.mode==='manual'&&current.target)r3UI.r25.targetDraft=JSON.parse(JSON.stringify(current.target));
  else if(!r3UI.r25.targetDraft)r3UI.r25.targetDraft=window.R25Nutrition.getTarget(user());
  r3UI.r25.targetMode='percent';r3SaveDraft();closeAllLayers();go('nutritionTarget',{replace:true});
 }
 const originalTargetSave=ACTIONS['r25-target-save'];
 document.addEventListener('input',event=>{
  if(!manualFlow||state.route!=='nutritionTarget'||!event.target.matches('[data-r25-target]'))return;
  const current=r3UI.r25?.targetDraft||window.R25Nutrition.getTarget(user()),kind=event.target.dataset.r25Target;
  if(kind==='kcal')r3UI.r25.targetDraft=window.R25Nutrition.targetFromPercent(Number(event.target.value),current.percentages);
  else if(kind.startsWith('pct-'))r3UI.r25.targetDraft=window.R25Nutrition.spreadPercentage(current,kind.slice(4),event.target.value);
  else if(kind.startsWith('gram-'))r3UI.r25.targetDraft=window.R25Nutrition.targetFromGrams({...current.grams,[kind.slice(5)]:event.target.value});
  r3SaveDraft();
 });
 ACTIONS['r25-target-save']=async()=>{
  if(!manualFlow)return originalTargetSave();
  const target=r3UI.r25?.targetDraft||window.R25Nutrition.getTarget(user());
  return generatePlan({mode:'manual',target},()=>render());
 };
 r3Act('p39-manual-save',()=>{const target=r3UI.r25?.targetDraft||window.R25Nutrition.getTarget(user());return generatePlan({mode:'manual',target},()=>render());});

 function manualInputFromDraft(){
  const input=JSON.parse(JSON.stringify(customDraft||{}));
  input.mode='customized';
  return input;
 }
 function safetySheet(result,retry){
  safetyPending={result,retry};
  const c=result.calculation;
  sheet({
   title:'当前方案强度较高',
   body:'<div class="m39-safety"><div class="m39-safety-icon">!</div><p>当前方案每日热量约为 <b>'+N(result.target.kcal)+' kcal</b>，低于 1200 kcal 或低于你的基础代谢 <b>'+N(c.bmr)+' kcal</b>。长期执行可能导致营养不足、基础代谢下降和反弹，也难以稳定减脂。</p><p>建议调整目标日期或降低方案强度。如仍需自行控制，可切换基础版并每日记录热量。</p></div>',
   footer:'<button class="m39-outline" data-act="p39-safe-base">切换为基础版</button><button class="m39-confirm" data-act="p39-safe-edit">去修改</button>'
  });
 }
 async function generatePlan(input,retry){
  if(saving)return;
  let preview;
  try{preview=P.preview(r3.state,user(),input);}catch(error){toast('请检查填写内容',error.message,'error');return;}
  if(!preview.calculation.safe){safetySheet(preview,retry);return;}
  saving=true;
  try{await r3.cmd('PLAN_GENERATE39',{input},'plan39-'+Date.now());manualFlow=false;customDraft=null;reportId='current';closeAllLayers();go('menu',{replace:true,root:true,tab:'menu'});toast('餐食方案已生成');}
  catch(error){if(error.message==='SAFE_PLAN_REQUIRED')safetySheet(preview,retry);else throw error;}
  finally{saving=false;}
 }
 r3Act('p39-generate',()=>generatePlan(manualInputFromDraft(),()=>go('planTarget39',{replace:true})));
 r3Act('p39-safe-edit',()=>{const retry=safetyPending?.retry;safetyPending=null;closeLayer();retry?.();});
 r3Act('p39-safe-base',async()=>{saving=true;try{await r3.cmd('PLAN_MODE_SAVE',{mode:'basic'});manualFlow=false;safetyPending=null;closeLayer();go('menu',{replace:true,root:true,tab:'menu'});toast('已切换为基础版');}finally{saving=false;}});

 function foodRows(meal){
  return '<div class="m39-meal-foods">'+meal.items.map(item=>'<div>'+(item.image?'<img src="'+e(window.__offlineAsset(item.image))+'" alt="">':'<span class="m39-food-placeholder">'+e(({staple:'主',protein:'蛋',vegetable:'蔬'})[item.group]||'食')+'</span>')+'<span><b>'+e(item.name)+'</b><small>'+N(item.grams)+'g</small></span><em>'+N(item.kcal)+' kcal</em></div>').join('')+'</div>';
 }
 function mealCards(current){
  return '<div class="m39-meal-list">'+current.meals.map(meal=>'<article class="m39-meal-card"><header><div><small>'+mealTitle(meal.meal)+'</small><h3>'+N(meal.total.kcal)+' <em>kcal</em></h3></div><span>目标 '+meal.targetKcal+' kcal</span></header>'+foodRows(meal)+'</article>').join('')+'</div>';
 }
 function macroRows(current){
  return [['热量','kcal','kcal'],['蛋白质','protein','g'],['碳水','carb','g'],['脂肪','fat','g']].map(([label,key,unit])=>{const target=key==='kcal'?current.target.kcal:current.target.grams[key],actual=current.totals[key]||0,pct=target?Math.round(actual/target*100):0;return '<div class="m39-macro-row"><span>'+label+'</span><b>'+N(actual)+' / '+N(target)+' '+unit+'</b><strong>'+pct+'%</strong><i><em style="width:'+Math.min(100,pct)+'%"></em></i></div>';}).join('');
 }
 function planResultHTML(current,standalone=true){
  if(!current)return '';
  const profile=user()?.profile||{},input=current.input||{},calc=current.calculation||{};
  return '<div class="m39-result-page'+(standalone?'':' m39-result-embedded')+'"><header class="m39-result-head"><div><small>TODAY PLAN · '+e(current.date)+'</small><h1>今日餐食方案</h1><p>'+e(user()?.profile?.gender||'')+' · '+N(profile.height)+'cm · '+N(profile.weight)+'kg · '+(profile.age||'—')+'岁</p></div><button data-act="p39-edit">修改方案</button></header>'+
   '<section class="m39-summary-card"><div class="m39-goal-chip">目标 · '+e(current.goal)+'</div><h2>今日目标</h2><div class="m39-macro-grid">'+['kcal','protein','carb','fat'].map(key=>'<div><small>'+({kcal:'热量',protein:'蛋白质',carb:'碳水',fat:'脂肪'})[key]+'</small><b>'+N(key==='kcal'?current.target.kcal:current.target.grams[key])+'</b><em>'+(key==='kcal'?'kcal':'g')+'</em></div>').join('')+'</div><div class="m39-activities"><span>活动安排</span><b>'+e(activityText(profile.activity))+'</b></div>'+(input.mode==='customized'?'<div class="m39-target-progress">目标体重 <b>'+N(input.targetWeight)+'kg</b> · 目标日期 <b>'+e(input.targetDate)+'</b></div>':'')+'</section>'+
   '<section class="m39-plan-section"><header><h2>今日午餐与晚餐</h2><span>合计 '+N(current.totals.kcal)+' kcal</span></header>'+mealCards(current)+'</section>'+
   '<section class="m39-progress-card"><header><h2>今日营养情况</h2><span class="'+(Math.abs((current.totals.kcal-current.target.kcal)/(current.target.kcal||1))>.1?'warn':'')+'">'+(Math.abs((current.totals.kcal-current.target.kcal)/(current.target.kcal||1))>.1?'与目标有偏差':'接近目标')+'</span></header>'+macroRows(current)+'</section>'+
   '<p class="m39-plan-note">餐食克重按目标热量自动换算；如与实际执行不同，可在每天的饮食记录中调整。</p><div class="m39-result-actions"><button class="m39-primary" data-act="p39-start">开始今日执行</button><button class="m39-outline" data-act="p39-full-report">查看完整报告</button><button class="m39-text-action" data-act="p39-history">历史方案 ›</button></div></div>';
 }
 SCREENS.planResult39={title:'今日餐食方案',noTab:true,navStyle:{bg:'#eff7f5',ink:'#17473b'},render(){
  const current=plan();if(!current)return '<div class="m39-page"><div class="m39-empty-plan"><h2>还没有进阶方案</h2><p>完成减脂目标或自定义营养值后即可生成午餐晚餐方案。</p><button class="m39-confirm" data-act="r3-plan-create">开始设置</button></div></div>';
  return planResultHTML(current,true);
 }};
 function editPlan(){
  const current=plan(),selected=P.read(user());
  if(!current){
   if(selected.type==='manual'){openManual();return;}
   if(selected.type==='customized'){openCustomTarget();return;}
   advancedModeSheet();return;
  }
  if(current.mode==='manual'){openManual();return;}
  customDraft=JSON.parse(JSON.stringify(current.input));go('planTarget39',{replace:true});
 }
 r3Act('p39-edit',editPlan);
 r3Act('p39-edit-from-food',editPlan);
 r3Act('p39-start',()=>startExecution());

 function startExecution(){
  const current=plan(),lunch=current?.meals?.find(meal=>meal.meal==='lunch');if(!current||!lunch)return toast('当前没有可执行方案');
  const today=r3Date(),batch=window.R38DietUI?.batch();
  if(batch){
   const keep=batch.rows.filter(row=>!(row.date===today&&row.meal==='午餐'));
   const rows=lunch.items.map(item=>({custom:true,customId:'PLAN39-'+current.id+'-'+item.foodId,name:item.name,quantity:item.grams,unit:'克',grams:item.grams,kcal:item.kcal,carb:item.carb,protein:item.protein,fat:item.fat,date:today,meal:'午餐',plan39Id:current.id}));
   batch.rows=[...keep,...rows];batch.expanded=true;batch.token='diet38-'+Date.now();
  }
  r3UI.r25=r3UI.r25||{};r3UI.r25.flow={...r3UI.r25.flow,meal:'午餐',date:today,editId:null,added:0,searchScroll:0};
  V15().dietDate=today;V15().dietDraft={meal:'午餐'};r3SaveDraft();go('dietSearch',{tab:'menu'});
  toast('已将午餐推荐加入待选');
 }

 function reportForCurrent(){
  const selected=P.read(user());
  if(reportId==='current')return selected.current;
  return selected.history.find(item=>item.id===reportId)||selected.current;
 }
 function reportHTML(snapshot,readonly=false){
  if(!snapshot)return '<div class="m39-page"><div class="m39-empty-plan"><h2>方案不存在</h2><p>请返回结果页重新选择。</p></div></div>';
  const profile=snapshot.profile||{},input=snapshot.input||{},calc=snapshot.calculation||{};
  return '<article class="m39-report-sheet" data-report-id="'+e(snapshot.id)+'"><header class="m39-report-head"><div><small>DAILY NUTRITION REPORT</small><h1>今日饮食计划</h1><p>'+e(snapshot.date)+'</p></div><span>目标 · '+e(snapshot.goal)+'</span></header><p class="m39-report-profile">'+e(profile.gender)+' · '+N(profile.height)+'cm · '+N(profile.weight)+'kg · '+(profile.age||'—')+'岁'+(input.mode==='customized'?' · 目标体重 '+N(input.targetWeight)+'kg · '+e(input.targetDate):'')+'</p>'+
   '<section class="m39-report-target"><header><h2>今日目标</h2><small>进度 = 餐单合计 ÷ 目标</small></header><div class="m39-report-target-grid">'+['kcal','protein','carb','fat'].map(key=>{const target=key==='kcal'?snapshot.target.kcal:snapshot.target.grams[key],actual=snapshot.totals[key]||0,pct=target?Math.round(actual/target*100):0;return '<div><span>'+({kcal:'热量',protein:'蛋白质',carb:'碳水',fat:'脂肪'})[key]+'</span><b>'+N(target)+'</b><em>'+(key==='kcal'?'kcal':'g')+'</em><i><strong style="width:'+Math.min(100,pct)+'%"></strong></i><small>餐单 '+N(actual)+' · '+pct+'%</small></div>';}).join('')+'</div><p><b>活动安排</b> '+e(activityText(profile.activity))+'</p></section>'+
   '<section class="m39-report-meals"><header><h2>今日午餐与晚餐</h2><b>合计 '+N(snapshot.totals.kcal)+' kcal</b></header>'+snapshot.meals.map(meal=>'<article><header><h3>'+meal.title+'</h3><b>'+N(meal.total.kcal)+' kcal</b></header><div>'+meal.items.map(item=>'<div class="m39-report-food">'+(item.image?'<img src="'+e(window.__offlineAsset(item.image))+'" alt="">':'')+'<span><b>'+e(item.name)+'</b><small>'+N(item.grams)+'g</small></span><em>'+N(item.kcal)+' kcal</em></div>').join('')+'</div></article>').join('')+'</section>'+
   '<section class="m39-report-effect"><h2>预期效果</h2><div><span><b>'+Math.round(calc.actualDeficit||0)+'</b> kcal<small>每日缺口</small></span><span><b>'+N((calc.actualDeficit||0)*7/7700*2)+'</b> 斤<small>7天约减脂</small></span><span><b>'+N((calc.actualDeficit||0)*30/7700*2)+'</b> 斤<small>30天约减脂</small></span></div>'+(input.mode==='customized'?'<p>按当前节奏预计于 '+e(calc.estimatedDate)+' 接近目标体重。</p>':'')+'</section>'+
   '<footer><b>渡鸦管家 · 轻食计划</b><p>预期效果按当前方案估算，实际受训练、睡眠及执行情况影响。数据仅供一般健康饮食和体型管理参考，不替代医生、营养师或专业诊疗建议。</p></footer></article>'+(readonly?'':'');
 }
 SCREENS.planReport39={title:'完整报告',noTab:true,navStyle:{bg:'#edf6f5',ink:'#17473b'},render(){
  const snapshot=reportForCurrent();
  return '<div class="m39-report-page">'+reportHTML(snapshot)+'<div class="m39-report-actions"><button class="m39-primary" data-act="p39-report-download">保存到相册</button><button class="m39-outline" data-act="p39-report-back">返回择食页</button><button class="m39-text-action" data-act="p39-report-disclaimer">查看数据说明与免责声明</button></div></div>';
 }};
 r3Act('p39-full-report',()=>{reportId='current';go('planReport39');});
 r3Act('p39-report-back',()=>{reportId='current';go('menu',{replace:true,root:true,tab:'menu'});});
 r3Act('p39-report-disclaimer',()=>sheet({title:'数据说明与免责声明',body:'<div class="m39-disclaimer"><p>方案依据你当前填写的身高、体重、年龄、活动水平和目标，结合后台餐盘配置自动计算。</p><p>营养值按食材每100克基准及实际克重换算，可能因品牌、生熟状态和烹饪用油产生差异。</p><p>本方案仅供一般健康饮食和体重管理参考，不替代医生、营养师或专业诊疗建议。如处于孕期、哺乳期、慢性病治疗期或存在进食障碍，请先咨询专业人员。</p></div>',dismissible:true}));

 function canvasBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/png'))}
 async function downloadReport(){
  const snapshot=reportForCurrent();if(!snapshot)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  canvas.width=900;canvas.height=1900;
  ctx.fillStyle='#edf7f5';ctx.fillRect(0,0,900,1900);
  ctx.fillStyle='#fff';ctx.fillRect(35,35,830,1830);
  ctx.fillStyle='#153f35';ctx.font='bold 40px Microsoft YaHei,Arial';ctx.fillText('今日饮食计划',70,105);
  ctx.font='22px Microsoft YaHei,Arial';ctx.fillStyle='#687b73';ctx.fillText(snapshot.date+'  ·  目标 '+snapshot.goal,70,145);
  const p=snapshot.profile||{},input=snapshot.input||{},calc=snapshot.calculation||{};
  ctx.fillStyle='#344c43';ctx.font='22px Microsoft YaHei,Arial';
  ctx.fillText(p.gender+' · '+N(p.height)+'cm · '+N(p.weight)+'kg · '+(p.age||'—')+'岁',70,190);
  if(input.mode==='customized')ctx.fillText('目标体重 '+N(input.targetWeight)+'kg · 达成日期 '+input.targetDate,70,225);
  ctx.fillStyle='#f6fbfa';ctx.strokeStyle='#dfece8';ctx.fillRect(65,260,770,190);ctx.strokeRect(65,260,770,190);
  ctx.fillStyle='#163f35';ctx.font='bold 26px Microsoft YaHei,Arial';ctx.fillText('今日目标',90,305);
  const metrics=[['热量',snapshot.target.kcal,'kcal'],['蛋白质',snapshot.target.grams.protein,'g'],['碳水',snapshot.target.grams.carb,'g'],['脂肪',snapshot.target.grams.fat,'g']];
  metrics.forEach((item,i)=>{const x=90+i*185;ctx.fillStyle='#73847d';ctx.font='18px Microsoft YaHei,Arial';ctx.fillText(item[0],x,350);ctx.fillStyle='#173f35';ctx.font='bold 28px Microsoft YaHei,Arial';ctx.fillText(String(N(item[1])),x,390);ctx.font='16px Microsoft YaHei,Arial';ctx.fillText(item[2],x,415);});
  let y=500;ctx.fillStyle='#163f35';ctx.font='bold 28px Microsoft YaHei,Arial';ctx.fillText('午餐与晚餐',70,y);y+=45;
  for(const meal of snapshot.meals){
   ctx.fillStyle='#f7faf8';ctx.strokeStyle='#e2ece8';ctx.fillRect(65,y-28,770,55+meal.items.length*45);ctx.strokeRect(65,y-28,770,55+meal.items.length*45);
   ctx.fillStyle='#173f35';ctx.font='bold 23px Microsoft YaHei,Arial';ctx.fillText(meal.title,90,y+8);ctx.textAlign='right';ctx.fillText(N(meal.total.kcal)+' kcal',810,y+8);ctx.textAlign='left';y+=48;
   for(const item of meal.items){ctx.fillStyle='#52645c';ctx.font='19px Microsoft YaHei,Arial';ctx.fillText(item.name+'  '+N(item.grams)+'g',95,y);ctx.textAlign='right';ctx.fillText(N(item.kcal)+' kcal',800,y);ctx.textAlign='left';y+=45;}
   y+=35;
  }
  ctx.fillStyle='#163f35';ctx.font='bold 26px Microsoft YaHei,Arial';ctx.fillText('预期效果',70,y+20);y+=60;ctx.font='20px Microsoft YaHei,Arial';ctx.fillStyle='#586d63';ctx.fillText('每日缺口 '+Math.round(calc.actualDeficit||0)+' kcal · 7天约 '+N((calc.actualDeficit||0)*7/7700*2)+' 斤 · 30天约 '+N((calc.actualDeficit||0)*30/7700*2)+' 斤',70,y);
  ctx.fillStyle='#8a9992';ctx.font='16px Microsoft YaHei,Arial';const note='预期效果按当前方案估算，实际受训练、睡眠及执行情况影响。数据仅供一般健康饮食和体型管理参考，不替代医生、营养师或专业诊疗建议。';ctx.fillText(note.slice(0,55),70,1780);ctx.fillText(note.slice(55),70,1808);
  const blob=await canvasBlob(canvas);if(!blob)throw Error('报告图片生成失败');
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='渡鸦管家-今日饮食计划-'+snapshot.date+'.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('报告图片已生成');
 }
 r3Act('p39-report-download',()=>safeAsync(downloadReport)());

 SCREENS.planHistory39={title:'历史方案',noTab:true,navStyle:{bg:'#f2f8f7',ink:'#17473b'},render(){
  const history=P.read(user()).history||[];
  return '<div class="m39-history-page"><header class="m39-flow-head"><small>PLAN HISTORY</small><h1>历史方案</h1><p>每次生成的报告都会保留为只读快照。</p></header>'+(history.length?'<div class="m39-history-list">'+history.map(item=>'<button data-act="p39-history-open" data-id="'+e(item.id)+'"><span><b>'+e(item.date+' · '+item.goal)+'</b><small>'+e(typeTitle(item.mode))+' · '+N(item.target.kcal)+' kcal</small></span><em>'+e(item.generatedAt?new Date(item.generatedAt).toLocaleString('zh-CN'):'')+' ›</em></button>').join('')+'</div>':'<div class="m39-empty-plan"><h2>暂无历史方案</h2><p>生成第一份方案后会显示在这里。</p></div>')+'</div>';
 }};
 r3Act('p39-history',()=>go('planHistory39'));
 r3Act('p39-history-open',node=>{reportId=node.dataset.id;go('planReport39');});

 function advancedFoodBar(selected){
  if(!selected.type)return '<section class="m39-food-planbar"><div><small>进阶模式</small><b>请选择进阶模式</b></div><button data-act="p39-mode-open">选择进阶模式</button></section>';
  if(!selected.current)return '<section class="m39-food-planbar"><div><small>进阶模式</small><b>'+typeTitle(selected.type)+' · 待生成方案</b></div><button data-act="p39-edit-from-food">继续设置</button></section>';
  return '<section class="m39-food-planbar"><div><small>当前进阶方案</small><b>'+typeTitle(selected.type)+' · '+e(selected.current.goal)+' · '+N(selected.current.target.kcal)+' kcal</b></div><div class="m39-food-planbar-actions"><button data-act="p39-edit-from-food">修改方案</button><button data-act="p39-full-report">查看报告</button></div></section>';
 }
 SCREENS.menu.render=function(){
  const selected=P.read(user()),html=baseMenu.apply(this,arguments);
  if(selected.mode==='basic')return html;
  const box=document.createElement('div');box.innerHTML=html;const page=box.querySelector('.rp39-page');
  if(page)page.insertAdjacentHTML('afterbegin',advancedFoodBar(selected));
  return box.innerHTML;
 };
 const nav=navMarkup;navMarkup=function(){const box=document.createElement('div');box.innerHTML=nav();const chip=box.querySelector('.nav-goal');if(chip&&user()){const selected=P.read(user());chip.innerHTML=e(modeTitle(selected.mode))+'⌄';chip.setAttribute('aria-label','切换基础版或进阶版');}return box.innerHTML;};

 r3Act('r3-setup-submit',async()=>{if(saving)return;saving=true;try{await r3.cmd('PROFILE_COMPLETE',r3UI.setup);r3UI.setup=null;r3SaveDraft();openMode(true);}finally{saving=false;}});
 const loginMounted=SCREENS.login.mounted;
 SCREENS.login.mounted=function(){loginMounted.call(this);$('#login-wechat').onclick=r3Safe(async()=>{if(!$('#login-tick').classList.contains('on'))return toast('请先阅读并同意协议');await r3.ready;r3Apply();if(!r3Me().onboarded)go('onboarding',{root:true,tab:'home'});else if(P.read(r3Me()).pending||!P.read(r3Me()).current&&P.read(r3Me()).mode==='advanced')openMode(true);else go('home',{root:true,tab:'home'});});};
 const previousBack=ACTIONS.back;
 ACTIONS.back=node=>{
  if(manualFlow&&state.route==='nutritionTarget'){manualFlow=false;openMode(false);return;}
  if(state.route==='planTarget39'){go('menu',{replace:true,tab:'menu'});return;}
  if(state.route==='planMode39'){if(modeDraft?.onboarding)return;go('menu',{replace:true,tab:'menu'});return;}
  if(state.route==='planReport39'){reportId='current';go('menu',{replace:true,root:true,tab:'menu'});return;}
  if(state.route==='planHistory39'){go('menu',{replace:true,root:true,tab:'menu'});return;}
  if(state.route==='planResult39'){go('menu',{replace:true,root:true,tab:'menu'});return;}
  return previousBack(node);
 };
 window.R39PlanUI={open:openMode,openManual,generate:generatePlan,current:plan,reportForCurrent,get draft(){return customDraft;},get manualFlow(){return manualFlow;},get manualTarget(){return r3UI.r25?.targetDraft||null;}};
})();
