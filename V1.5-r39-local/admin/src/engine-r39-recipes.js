// Independent advanced recipe configuration and user-owned, immutable nutrition snapshots.
(()=>{
 const Store=window.__DUYA_LOCAL_ENGINE.Store,prior=Store.prototype.run;
 const groups={staple:'主食',protein:'蛋白类',vegetable:'蔬菜'},meals={lunch:'午餐',dinner:'晚餐'},macros=['kcal','carb','protein','fat'];
 const copy=x=>JSON.parse(JSON.stringify(x)),round=x=>Math.round(x*10)/10,ok=(v,m)=>{if(!v)throw Error(m);};
 const finite=(v,positive=false)=>v!==''&&v!=null&&Number.isFinite(Number(v))&&(positive?Number(v)>0:Number(v)>=0);
 const enabled=x=>x?.status==='启用',stamp=store=>new Date(store.now()).toISOString();
 function seed(){
  const row=(id,name,group,subId,kcal,carb,protein,fat,image='')=>({id,name,group,subId,kcal,carb,protein,fat,image,status:'启用',revision:1});
  const ingredients=[row('RI39-RICE','糙米饭','staple','RS39-WHOLE',112,23,2.6,.9,'assets/recipe39-rice.png'),row('RI39-WHITE','白米饭','staple','RS39-REFINED',116,25.9,2.6,.3),row('RI39-CHICKEN','鸡胸肉','protein','',133,0,31,1.6,'assets/recipe39-chicken.png'),row('RI39-TOFU','北豆腐','protein','',116,3,12.2,6.8),row('RI39-BROCCOLI','西兰花','vegetable','',34,6.6,2.8,.4,'assets/recipe39-broccoli.png'),row('RI39-LEAVES','混合沙拉菜','vegetable','',18,3,1.5,.2)];
  const plates=[];for(const meal of Object.keys(meals))for(const code of ['A','B'])plates.push({id:'RP39-'+meal+'-'+code,name:meals[meal]+'餐盘 '+code,meal,code,status:'启用',referenceKcal:480,oilLimit:12,revision:1,slots:{staple:{foodId:'RI39-RICE',grams:100,allowedIds:['RI39-RICE','RI39-WHITE']},protein:{foodId:'RI39-CHICKEN',grams:120,allowedIds:['RI39-CHICKEN','RI39-TOFU']},vegetable:{foodId:'RI39-BROCCOLI',grams:150,allowedIds:['RI39-BROCCOLI','RI39-LEAVES']}}});
  return {version:1,revision:1,ingredients,plates,subcategories:[{id:'RS39-REFINED',name:'精制快碳',group:'staple',status:'启用',revision:1},{id:'RS39-WHOLE',name:'粗粮慢碳',group:'staple',status:'启用',revision:1}]};
 }
 function migrate(data){if(Object.prototype.hasOwnProperty.call(data,'advancedRecipes39'))return false;data.advancedRecipes39=seed();return true;}
 const config=d=>d.advancedRecipes39||{version:1,revision:0,ingredients:[],plates:[],subcategories:[]};
 function checkRevision(old,record){if(old&&record.expectedRevision!=null)ok(Number(record.expectedRevision)===old.revision,'配置已在其他窗口修改，请重新打开');}
 function validateIngredient(record,d){
  const cfg=config(d),old=cfg.ingredients.find(x=>x.id===record.id);checkRevision(old,record);
  const x={...copy(record),name:String(record.name||'').trim(),subId:record.subId||'',image:record.image||''};delete x.expectedRevision;
  ok(x.name,'请输入食材名称');ok(groups[x.group],'请选择食材类别');ok(['启用','停用'].includes(x.status),'请选择食材状态');
  ok(!cfg.ingredients.some(i=>i.id!==x.id&&i.name.toLocaleLowerCase()===x.name.toLocaleLowerCase()),'食材名称已存在');
  for(const k of macros){ok(finite(x[k]),'请填写有效的'+({kcal:'热量',carb:'碳水',protein:'蛋白质',fat:'脂肪'}[k]));x[k]=Number(x[k]);}
  if(x.subId){const sub=cfg.subcategories.find(s=>s.id===x.subId);ok(sub&&sub.group===x.group&&(enabled(sub)||old?.subId===x.subId),'请选择有效的细分类');}
  if(x.image)ok(/^data:image\/(png|jpeg|webp);base64,/.test(x.image)&&x.image.length<=1450000||/^assets\/recipe39-[a-z]+\.png$/.test(x.image),'图片仅支持本地 PNG、JPEG、WebP，最大1 MiB');
  const refs=cfg.plates.filter(p=>enabled(p)&&Object.keys(groups).some(g=>p.slots?.[g]?.foodId===x.id));
  ok(!refs.length||enabled(x),'该食材是启用餐盘的默认食材，请先调整餐盘');
  ok(!cfg.plates.some(p=>Object.keys(groups).some(g=>g!==x.group&&(p.slots?.[g]?.foodId===x.id||p.slots?.[g]?.allowedIds?.includes(x.id)))),'该食材已用于餐盘默认或替换范围，请先调整餐盘再更换类别');
  ok(!refs.some(p=>Object.keys(groups).some(g=>p.slots[g].foodId===x.id&&g!==x.group)),'该食材已用于其他类别餐盘区域，请先调整餐盘');
  return x;
 }
 function validatePlate(record,d){
  const cfg=config(d),old=cfg.plates.find(x=>x.id===record.id);checkRevision(old,record);
  const x=copy(record);delete x.expectedRevision;x.name=String(x.name||'').trim();
  ok(x.name,'请输入餐盘名称');ok(meals[x.meal]&&['A','B'].includes(x.code),'请选择午餐或晚餐及餐盘 A/B');
  ok(!cfg.plates.some(p=>p.id!==x.id&&p.meal===x.meal&&p.code===x.code),'该餐次的餐盘编号已存在');
  ok(['启用','停用'].includes(x.status),'请选择餐盘状态');
  for(const key of ['referenceKcal','oilLimit']){ok(finite(x[key]),'请填写有效的'+(key==='oilLimit'?'烹调用油上限':'参考热量'));x[key]=Number(x[key]);}
  for(const g of Object.keys(groups)){
   const s=x.slots?.[g],food=cfg.ingredients.find(f=>f.id===s?.foodId);
   ok(s&&finite(s.grams,true),groups[g]+'克重必须大于零');s.grams=Number(s.grams);
   ok(food&&enabled(food)&&food.group===g,'请选择启用的'+groups[g]+'默认食材');
   ok(Array.isArray(s.allowedIds)&&s.allowedIds.includes(s.foodId),'默认食材必须包含在允许替换范围内');s.allowedIds=[...new Set(s.allowedIds)];
   ok(s.allowedIds.every(id=>cfg.ingredients.some(f=>f.id===id&&f.group===g)),'替换范围包含不存在或类别不符的食材');
  }
  return x;
 }
 const foodSnapshot=(food,grams)=>({foodId:food.id,name:food.name,group:food.group,image:food.image||'',grams:Number(grams),nutrition:{basis:100,...Object.fromEntries(macros.map(k=>[k,Number(food[k])]))}});
 function defaultMeal(d,meal){
  const cfg=config(d),plates=['A','B'].map(code=>cfg.plates.find(p=>p.meal===meal&&p.code===code&&enabled(p)));
  if(plates.some(p=>!p))return null;
  try{return plates.map(p=>{validatePlate(p,d);return {id:p.id,name:p.name,code:p.code,referenceKcal:p.referenceKcal,oilLimit:p.oilLimit,slots:Object.fromEntries(Object.keys(groups).map(g=>[g,foodSnapshot(cfg.ingredients.find(f=>f.id===p.slots[g].foodId),p.slots[g].grams)]))};});}catch{return null;}
 }
 const nutrients=s=>Object.fromEntries(macros.map(k=>[k,round(s.nutrition[k]*s.grams/100)]));
 function plateStats(p){
  const total=Object.fromEntries(macros.map(k=>[k,round(Object.values(p.slots).reduce((n,s)=>n+s.nutrition[k]*s.grams/100,0))]));
  const mass=Object.values(p.slots).reduce((n,s)=>n+s.grams,0),ratio={};const keys=Object.keys(groups);
  keys.forEach((g,i)=>ratio[g]=i===keys.length-1?round(100-Object.values(ratio).reduce((n,v)=>n+v,0)):round(p.slots[g].grams/mass*100));return {total,ratio};
 }
 function validSnapshot(plates){return Array.isArray(plates)&&plates.length===2&&plates.every(p=>p.slots&&Object.keys(groups).every(g=>{const s=p.slots[g];return s&&finite(s.grams,true)&&s.nutrition&&macros.every(k=>finite(s.nutrition[k]));}));}
 function query(d,userId,meal){
  const defaults=defaultMeal(d,meal);if(!defaults)return {ready:false,plates:[],total:Object.fromEntries(macros.map(k=>[k,0]))};
  const owner=d.users.find(u=>u.id===userId),saved=owner?.advancedRecipePlans39?.[meal];
  const plates=copy(saved&&validSnapshot(saved.plates)?saved.plates:defaults);
  return {ready:true,customized:!!saved,plates:plates.map(p=>({...p,...plateStats(p)})),total:Object.fromEntries(macros.map(k=>[k,round(plates.reduce((n,p)=>n+Object.values(p.slots).reduce((a,s)=>a+s.nutrition[k]*s.grams/100,0),0))]))};
 }
 function candidates(d,meal,plateId,group){const cfg=config(d),p=cfg.plates.find(p=>p.id===plateId&&p.meal===meal&&enabled(p));return !p||!groups[group]?[]:cfg.ingredients.filter(f=>enabled(f)&&f.group===group&&p.slots[group].allowedIds.includes(f.id));}
 function upsert(list,x,store,prefix){const old=list.find(r=>r.id===x.id);x.id=x.id||prefix+store.now()+'-'+Math.random().toString(36).slice(2,7);x.revision=(old?.revision||0)+1;x.updatedAt=stamp(store);if(old)list.splice(list.indexOf(old),1,x);else list.push(x);return copy(x);}
 Store.prototype.run=function(type,user,p={}){
  if(type.startsWith('ADMIN_RECIPE39_')){
   ok(user==='admin','仅管理员可维护进阶食谱');const cfg=config(this.data);ok(this.data.advancedRecipes39,'进阶食谱尚未初始化');let result;
   if(type==='ADMIN_RECIPE39_INGREDIENT')result=upsert(cfg.ingredients,validateIngredient(p.record,this.data),this,'RI39-');
   else if(type==='ADMIN_RECIPE39_PLATE')result=upsert(cfg.plates,validatePlate(p.record,this.data),this,'RP39-');
   else if(type==='ADMIN_RECIPE39_CATEGORY'){
    const x=copy(p.record||{}),old=cfg.subcategories.find(s=>s.id===x.id);checkRevision(old,x);delete x.expectedRevision;x.name=String(x.name||'').trim();
    ok(x.name&&groups[x.group]&&['启用','停用'].includes(x.status),'请填写细分类名称、类别和状态');
    ok(!cfg.subcategories.some(s=>s.id!==x.id&&s.group===x.group&&s.name===x.name),'同类食材的细分类名称不能重复');
    ok(!old||x.group===old.group||!cfg.ingredients.some(f=>f.subId===x.id),'细分类已被使用，不能更换所属类别');result=upsert(cfg.subcategories,x,this,'RS39-');
   }else throw Error('未知进阶食谱动作');cfg.revision++;return result;
  }
  if(['RECIPE39_REPLACE','RECIPE39_RESET'].includes(type)){
   ok(user!=='admin','请先登录用户');const u=this.user(user),mode=window.R39PlanMode?.read(u);
   ok(mode?.mode==='advanced'&&mode.goal,'请先设置进阶目标');ok(meals[p.meal],'请选择有效餐次');
   if(type==='RECIPE39_RESET'){if(u.advancedRecipePlans39)delete u.advancedRecipePlans39[p.meal];return {ok:true};}
   const view=query(this.data,user,p.meal);ok(view.ready,'餐盘配置尚未就绪');ok(groups[p.group],'请选择有效餐盘区域');
   const plate=view.plates.find(x=>x.id===p.plateId),food=candidates(this.data,p.meal,p.plateId,p.group).find(f=>f.id===p.foodId);ok(plate&&food,'该食材不在当前可替换范围内');
   const plates=view.plates.map(({total,ratio,...plate})=>plate);const target=plates.find(x=>x.id===p.plateId);target.slots[p.group]=foodSnapshot(food,target.slots[p.group].grams);
   u.advancedRecipePlans39=u.advancedRecipePlans39||{};u.advancedRecipePlans39[p.meal]={plates,savedAt:stamp(this),configRevision:config(this.data).revision};return query(this.data,user,p.meal);
  }
  const result=prior.call(this,type,user,p);if(type==='RESET')migrate(this.data);return result;
 };
 window.R39Recipes={migrate,config,groups,meals,macros,query,candidates,nutrients,plateStats,validateIngredient,validatePlate};
})();
