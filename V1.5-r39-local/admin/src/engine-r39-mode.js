// r39 plan version, guided target calculation and immutable lunch/dinner snapshots.
(()=>{
 const Store=window.__DUYA_LOCAL_ENGINE.Store,run=Store.prototype.run;
 const goals=['减脂'],lockedGoals=['增肌','塑形/维持'];
 const plans={
  stable:{label:'稳定减脂',deficit:0.15,note:'约 15% 热量缺口，节奏更温和'},
  standard:{label:'标准减脂',deficit:0.20,note:'约 20% 热量缺口，适合多数人',recommended:true},
  aggressive:{label:'激进减脂',deficit:0.25,note:'约 25% 热量缺口，适合短期执行'}
 };
 const tabooTags=['坚果','乳制品','蛋类','豆制品','海鲜','牛肉','鸡肉','香菜','辛辣','高糖','油炸','无'];
 const tabooTerms={
  '坚果':['坚果','杏仁','花生','核桃','腰果'],
  '乳制品':['乳','酸奶','牛奶','奶酪','芝士','奶油'],
  '蛋类':['鸡蛋','蛋类','蛋黄','蛋白'],
  '豆制品':['豆腐','豆干','豆浆','大豆','腐竹'],
  '海鲜':['海鲜','虾','鱼','蟹','贝','鱿鱼'],
  '牛肉':['牛肉','牛里脊'],
  '鸡肉':['鸡肉','鸡胸'],
  '香菜':['香菜'],
  '辛辣':['辛辣','辣椒','辣味'],
  '高糖':['高糖','糖','蜂蜜','蛋糕','甜品'],
  '油炸':['油炸','炸鸡','薯条']
 };
 const activityFactor={'久坐不动':1.2,'轻度活动':1.375,'中度活动':1.55,'高度活动':1.725,'极高活动':1.9};
 const copy=x=>JSON.parse(JSON.stringify(x)),round=x=>Math.round(Number(x||0)*10)/10;
 const dateKey=time=>window.__DUYA_LOCAL_ENGINE.dateKey(Number.isFinite(Number(time))?Number(time):Date.parse(time));
 const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&Number.isFinite(Date.parse(value+'T00:00:00+08:00'));
 const positive=(value,message)=>{if(!(Number(value)>0))throw Error(message);return Number(value)};
 const nonNegative=(value,message)=>{if(!Number.isFinite(Number(value))||Number(value)<0)throw Error(message);return Number(value)};
 const userOf=(data,user)=>typeof user==='string'?(data.users||[]).find(item=>item.id===user):user;
 const macros=kcal=>({kcal:Math.round(kcal),percentages:{carb:40,protein:30,fat:30},grams:{carb:round(kcal*.4/4),protein:round(kcal*.3/4),fat:round(kcal*.3/9)}});

 function read(user){
  const pending=user?.modeSelectionPending===true||(!user?.planMode&&!user?.onboarded);
  const inferred=['减重','增肌','减脂'].includes(user?.goal)?'advanced':'basic';
  const mode=user?.planMode==='advanced'||user?.planMode==='basic'?user.planMode:pending?'advanced':inferred;
  const type=['customized','manual'].includes(user?.advancedPlanType)?user.advancedPlanType:mode==='advanced'?'customized':null;
  return {
   mode,
   type,
   goal:mode==='advanced'?'减脂':null,
   pending:user?.modeSelectionPending===true||(mode==='advanced'&&!user?.advancedPlan39),
   current:user?.advancedPlan39||null,
   history:Array.isArray(user?.advancedPlanHistory39)?user.advancedPlanHistory39:[]
  };
 }

 function migrate(data){
  if(!data||Number(data.r39PlanFlowMigration?.version)>=1)return false;
  for(const user of data.users||[]){
   if(!['basic','advanced'].includes(user.planMode)){
    user.planMode=['减重','增肌','减脂'].includes(user.goal)?'advanced':user.hasPlan?'basic':user.onboarded?'basic':null;
   }
   if(user.planMode==='advanced'){
    if(!['customized','manual'].includes(user.advancedPlanType))user.advancedPlanType='customized';
    user.advancedGoal=goals.includes(user.advancedGoal)?user.advancedGoal:'减脂';
   }
   if(!Array.isArray(user.advancedPlanHistory39))user.advancedPlanHistory39=[];
  }
  data.r39PlanFlowMigration={version:1,at:new Date().toISOString(),modes:['basic','advanced'],advancedTypes:['customized','manual']};
  return true;
 }

 function normalizeInput(data,user,input={}){
  const mode=input.mode==='manual'?'manual':'customized';
  if(mode==='manual'){
   const target=input.target||{},kcal=positive(target.kcal,'请填写每日热量');
   if(kcal<500||kcal>6000)throw Error('每日热量须在 500 至 6000 kcal 之间');
   const grams={};
   for(const key of ['carb','protein','fat'])grams[key]=nonNegative(target.grams?.[key],'请填写有效的三大营养素');
   return {mode,goal:'自定义',planKey:'manual',target:{kcal:Math.round(kcal),grams,percentages:target.percentages||{},source:'manual'},targetWeight:null,targetDate:null,taboos:[],tabooText:''};
  }
  const currentWeight=Number(user?.profile?.weight);
  if(!(currentWeight>0))throw Error('请先完善当前体重');
  const targetWeight=positive(input.targetWeight,'请填写目标体重');
  if(targetWeight>=currentWeight)throw Error('目标体重需要低于当前体重');
  if(!validDate(input.targetDate))throw Error('请选择目标达成日期');
  const today=dateKey(data.now);
  if(input.targetDate<=today)throw Error('目标达成日期需要晚于今天');
  if(!plans[input.planKey])throw Error('请选择有效的减脂方案');
  const raw=Array.isArray(input.taboos)?input.taboos:['无'];
  const tags=[...new Set(raw.filter(value=>tabooTags.includes(value)))];
  const taboos=tags.some(value=>value!=='无')?tags.filter(value=>value!=='无'):['无'];
  return {mode,goal:'减脂',planKey:input.planKey,targetWeight,targetDate:input.targetDate,taboos,tabooText:String(input.tabooText||'').trim()};
 }

 function preview(data,user,input={}){
  const owner=userOf(data,user);if(!owner)throw Error('用户不存在');
  const normalized=normalizeInput(data,owner,input);
  const profile=owner.profile||{},weight=Number(profile.weight),height=Number(profile.height),age=Number(profile.age)||27;
  if(!(weight>0&&height>0))throw Error('请先完善身高和体重');
  const gender=profile.gender==='男'?'male':'female';
  const bmr=Math.round(10*weight+6.25*height-5*age+(gender==='male'?5:-161));
  const tdee=Math.round(bmr*(activityFactor[profile.activity]||1.2));
  let target=normalized.target,plan=null,neededDeficit=0,actualDeficit=0,projectedDays=0;
  if(normalized.mode==='customized'){
   const days=Math.max(1,Math.ceil((Date.parse(normalized.targetDate+'T00:00:00+08:00')-Date.parse(dateKey(data.now)+'T00:00:00+08:00'))/86400000));
   neededDeficit=Math.max(0,(weight-normalized.targetWeight)*7700/days);
   plan=plans[normalized.planKey];
   actualDeficit=Math.min(neededDeficit,tdee*plan.deficit);
   target=macros(Math.max(1,Math.round(tdee-actualDeficit)));
   projectedDays=actualDeficit>0?Math.ceil((weight-normalized.targetWeight)*7700/actualDeficit):days;
  }else actualDeficit=Math.max(0,tdee-target.kcal);
  const safe=target.kcal>=1200&&target.kcal>=bmr;
  return {
   input:normalized,
   profile:{gender:profile.gender||'女',age,height,weight,activity:profile.activity||'轻度活动'},
   calculation:{bmr,tdee,neededDeficit:Math.round(neededDeficit),actualDeficit:Math.round(actualDeficit),deficitRate:tdee?round(actualDeficit/tdee*100):0,projectedDays,estimatedDate:projectedDays?dateKey(Date.parse(dateKey(data.now)+'T00:00:00+08:00')+projectedDays*86400000):'—',safe},
   target
  };
 }

 function forbidden(food,taboos,customText){
  const custom=String(customText||'').split(/[,，、;；\s]+/).map(value=>value.trim()).filter(value=>value.length>=1);
  const terms=[];
  for(const tag of taboos||[])if(tabooTerms[tag])terms.push(...tabooTerms[tag]);
  terms.push(...custom);
  return terms.some(term=>String(food?.name||'').includes(term));
 }

 function replacementFood(data,meal,plateId,group,current,taboos,customText){
  if(!forbidden(current,taboos,customText))return current;
  const items=(window.R39Recipes?.candidates(data,meal,plateId,group)||[]).filter(food=>!forbidden(food,taboos,customText));
  const food=items[0];if(!food)throw Error('“'+current.name+'”与食物忌口冲突，且暂无可替换食材，请修改忌口或餐盘配置');
  return {foodId:food.id,name:food.name,group:food.group,image:food.image||'',grams:current.grams,nutrition:{basis:100,kcal:Number(food.kcal),carb:Number(food.carb),protein:Number(food.protein),fat:Number(food.fat)}};
 }

 function buildMeal(data,userId,meal,mealTarget,taboos,customText){
  const view=window.R39Recipes?.query(data,userId,meal);if(!view?.ready)throw Error(meal==='lunch'?'午餐餐盘配置尚未就绪':'晚餐餐盘配置尚未就绪');
  const cfg=window.R39Recipes.config(data);
  const prepared=view.plates.map(plate=>{
   if(!cfg.plates.find(item=>item.id===plate.id))throw Error('餐盘配置已失效，请重新生成');
   const slots={};
   for(const group of Object.keys(window.R39Recipes.groups))slots[group]=replacementFood(data,meal,plate.id,group,plate.slots[group],taboos,customText);
   return {...plate,slots};
  });
  const sourceTotal=prepared.reduce((sum,plate)=>sum+Object.values(plate.slots).reduce((n,item)=>n+item.nutrition.kcal*item.grams/100,0),0);
  const factor=sourceTotal>0?mealTarget/sourceTotal:1;
  const plates=prepared.map(plate=>{
   const slots=Object.fromEntries(Object.entries(plate.slots).map(([group,item])=>[group,{...item,grams:Math.max(1,round(item.grams*factor))}]));
   const next={...plate,slots};return {...next,...window.R39Recipes.plateStats(next)};
  });
  const grouped=new Map();
  for(const plate of plates)for(const item of Object.values(plate.slots)){
   const key=item.foodId||item.name,existing=grouped.get(key);
   if(existing){existing.grams=round(existing.grams+item.grams);existing.kcal=round(existing.nutrition.kcal*existing.grams/100);existing.carb=round(existing.nutrition.carb*existing.grams/100);existing.protein=round(existing.nutrition.protein*existing.grams/100);existing.fat=round(existing.nutrition.fat*existing.grams/100);}
   else grouped.set(key,{foodId:item.foodId,name:item.name,group:item.group,image:item.image||'',grams:item.grams,nutrition:item.nutrition,kcal:round(item.nutrition.kcal*item.grams/100),carb:round(item.nutrition.carb*item.grams/100),protein:round(item.nutrition.protein*item.grams/100),fat:round(item.nutrition.fat*item.grams/100)});
  }
  const items=[...grouped.values()],total={kcal:0,carb:0,protein:0,fat:0};
  for(const item of items)for(const key of Object.keys(total))total[key]=round(total[key]+Number(item[key]||0));
  return {key:meal,meal,title:meal==='lunch'?'午餐':'晚餐',targetKcal:Math.round(mealTarget),plates,items,total};
 }

 function generate(data,user,input){
  const owner=userOf(data,user),previewData=preview(data,owner,input);
  if(!previewData.calculation.safe)throw Error('SAFE_PLAN_REQUIRED');
  if(!window.R39Recipes)throw Error('进阶食谱引擎未加载');
  const shares={lunch:.54,dinner:.46};
  const meals=['lunch','dinner'].map(meal=>buildMeal(data,owner.id,meal,previewData.target.kcal*shares[meal],previewData.input.taboos,previewData.input.tabooText));
  const totals={kcal:0,carb:0,protein:0,fat:0};
  for(const meal of meals)for(const key of Object.keys(totals))totals[key]=round(totals[key]+Number(meal.total[key]||0));
  const now=new Date(data.now??Date.now()).toISOString();
  const plan={
   id:'AP39-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
   algorithmVersion:'r39-plan-v1',generatedAt:now,date:dateKey(data.now),
   mode:previewData.input.mode,planKey:previewData.input.planKey,goal:previewData.input.goal,
   input:copy(previewData.input),profile:copy(previewData.profile),calculation:copy(previewData.calculation),
   target:copy(previewData.target),meals,totals,configRevision:Number(window.R39Recipes.config(data).revision)||0
  };
  owner.planMode='advanced';owner.advancedPlanType=plan.mode;owner.advancedGoal=plan.goal;owner.goal=plan.goal;owner.hasPlan=true;
  owner.modeSelectionPending=false;owner.planModeConfirmedAt=now;owner.nutritionTarget=copy(plan.target);
  owner.advancedPlan39=copy(plan);owner.advancedPlanHistory39=[copy(plan),...(Array.isArray(owner.advancedPlanHistory39)?owner.advancedPlanHistory39:[])].slice(0,30);
  return copy(plan);
 }

 Store.prototype.run=function(type,user,p={}){
  if(type==='PLAN_MODE_SAVE'){
   if(user==='admin')throw Error('请先登录用户');
   if(!['basic','advanced'].includes(p.mode))throw Error('请选择有效的计划版本');
   if(p.mode==='advanced'&&p.advancedPlanType!=null&&!['customized','manual'].includes(p.advancedPlanType))throw Error('请选择有效的进阶方案模式');
   const owner=this.user(user);if(!owner.onboarded)throw Error('请先完成初始设置');
   if(!owner.modeSelectionPending&&!owner.nutritionTarget&&!Object.prototype.hasOwnProperty.call(owner,'nutritionGoalBeforeMode39'))owner.nutritionGoalBeforeMode39=owner.goal||'健康饮食';
   owner.planMode=p.mode;owner.advancedPlanType=p.mode==='advanced'?(p.advancedPlanType||owner.advancedPlanType||'customized'):(owner.advancedPlanType||null);
   owner.advancedGoal=p.mode==='advanced'?'减脂':owner.advancedGoal||null;owner.goal=p.mode==='advanced'?'减脂':owner.goal||'健康饮食';
   owner.hasPlan=p.mode==='basic'||Boolean(owner.advancedPlan39);owner.modeSelectionPending=false;owner.planModeConfirmedAt=new Date(this.now()).toISOString();
   return copy(read(owner));
  }
  if(type==='PLAN_GENERATE39')return generate(this.data,user,p.input||{});
  const firstSetup=type==='PROFILE_COMPLETE'&&!this.user(user).onboarded;
  const result=run.call(this,type,user,p);
  if(firstSetup)this.user(user).modeSelectionPending=true;
  return result;
 };

 window.R39PlanMode={read,migrate,preview,generate,goals,lockedGoals,plans,taboos:tabooTags,dateKey};
})();
