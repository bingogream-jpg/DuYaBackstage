// r38 reviewed diet and shared configuration upgrade. History is never recalculated.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,M=window.R36Measure,copy=x=>JSON.parse(JSON.stringify(x)),ok=(x,m)=>{if(!x)throw Error(m)};
 const standardUnits=[['克',1],['两',50],['斤',500]],unitWeight={克:1,两:50,斤:500,ml:1,毫升:1};
 const fixed=f=>({...f,measureType:'solid',nutritionBasis:'100g',units:copy(standardUnits),defaultUnit:'克',defaultQuantity:100});
 const remember=(u,row)=>{if(!row.foodId)return;u.foodPortionHistory38=u.foodPortionHistory38||{};const pair={quantity:Number(row.quantity||row.baseAmount||row.grams),unit:row.unit||'克',baseAmount:Number(row.baseAmount??row.grams??row.volumeMl)};if(!(pair.quantity>0))return;u.foodPortionHistory38[row.foodId]=[pair,...(u.foodPortionHistory38[row.foodId]||[]).filter(x=>x.unit!==pair.unit||x.quantity!==pair.quantity)].slice(0,5);u.foodPortionPrefs38=u.foodPortionPrefs38||{};u.foodPortionPrefs38[row.foodId]=pair;};
 // Archive only: historical references must remain available to reward/history queries.
 const removeOfflineActivities=d=>{
  let changed=false;
  for(const a of d.activities37||[])if(a.location==='offline'||a.removed38||a.archivedLocation38==='offline'){
   if(!a.removed38||a.location!=='offline'){a.removed38=true;a.archivedLocation38='offline';a.location='offline';changed=true;}
   if(d.featuredActivity37Id===a.id){d.featuredActivity37Id='';changed=true;}
   if(d.settings?.featuredCheckinActivityId===a.id){d.settings.featuredCheckinActivityId='';changed=true;}
  }
  return changed;
 };
 function personalCodes(u,d){
  const binding=u?.binding,relation=(d?.inviteRelations||[]).find(r=>r.id===binding?.relationId);
  const merchant=!!binding&&(binding.source==='商户邀请码'||binding.type==='merchant'||!!binding.merchantId||!!relation?.merchantId);
  const bound=binding?.code||relation?.code||'';
  const boundType=bound?(merchant?'商户邀请码':'用户邀请码'):'';
  return {own:u?.inviteCode||'',merchant:merchant?bound:'',bound,boundType,boundText:bound?(boundType+' · '+bound):'—'};
 }
 function normalizeActivityAudience(audience={}){
  const keepUsers=audience.mode==='users'&&Array.isArray(audience.userIds)&&audience.userIds.length;
  return {...audience,mode:keepUsers?'users':'all',allUsers:!keepUsers,userIds:keepUsers?copy(audience.userIds):[],merchantCodes:[],userInviteCodes:[]};
 }
 function reliableBackup(d,backup){
  if(!backup||!Array.isArray(backup.users)||!Array.isArray(backup.activities37)||Number(backup.r38DietUpgrade?.version)>=2)return false;
  if(!Number.isInteger(backup.revision)||backup.revision>d.revision)return false;
  // A shared demo ID is not lineage. Require matching identity and immutable order facts
  // for the same users, and reject a backup that disagrees with any surviving order.
  let evidence=0;
  for(const old of backup.users){const u=d.users.find(x=>x.id===old.id);if(!u)continue;
   if(old.profile?.phone&&u.profile?.phone&&old.profile.phone!==u.profile.phone)return false;
   for(const order of old.orders||[]){const current=(u.orders||[]).find(x=>x.id===order.id);if(!current)continue;
    for(const field of ['createdAt','paidAt','packageId','amount','paidAmount'])if(order[field]!=null&&current[field]!=null&&order[field]!==current[field])return false;
    evidence++;
   }
  }
  return evidence>0;
 }
 function repairOfflineHistory(d,backup){
  if(!reliableBackup(d,backup))return {restored:0,skipped:0};
  const activities=backup.activities37.filter(a=>a.location==='offline'||a.archivedLocation38==='offline'),ids=new Set(activities.map(a=>a.id));
  let restored=0,skipped=0;
  const revoked=x=>x&&(x.revoked||x.revokedAt||x.withdrawnAt||/撤回|撤销/.test(String(x.status||'')));
  const audit=[...(d.logs||[]),...(d.issues||[]),...Object.values(d.operations||{})];
  const withdrawn=[...Object.values(d.rewardEvents||{}),...(d.users||[]).flatMap(u=>[...(u.rewards||[]),...(u.wallet||[]),...(u.mealCredits||[])])].filter(revoked);
  const blocked=(...keys)=>withdrawn.some(x=>keys.filter(Boolean).some(id=>[x.id,x.key,x.rewardId,x.walletId].includes(id)))||audit.some(entry=>{const text=JSON.stringify(entry);return /撤回|撤销|REVOKE|WITHDRAW/i.test(text)&&keys.filter(Boolean).some(id=>text.includes(id));});
  d.activities37=d.activities37||[];d.rewardEvents=d.rewardEvents||{};
  for(const a of activities)if(!d.activities37.some(x=>x.id===a.id)){d.activities37.push({...copy(a),removed38:true,archivedLocation38:'offline',location:'offline'});restored++;}
  for(const previous of backup.users){
   const u=d.users.find(x=>x.id===previous.id);if(!u)continue;
   const priorRewards=(previous.rewards||[]).filter(r=>ids.has(r.activity37Id)||activities.some(a=>previous.activityProgress37?.[a.id]?.rewardEventKey===r.id));
   const rewardIds=new Set(priorRewards.map(r=>r.id));
   for(const [id,event] of Object.entries(backup.rewardEvents||{}))if(ids.has(event.activity37Id))rewardIds.add(id);
   u.activityProgress37=u.activityProgress37||{};u.rewards=u.rewards||[];u.wallet=u.wallet||[];u.mealCredits=u.mealCredits||[];
   for(const id of ids)if(previous.activityProgress37?.[id]&&!Object.hasOwn(u.activityProgress37,id)){u.activityProgress37[id]=copy(previous.activityProgress37[id]);restored++;}
   for(const r of priorRewards){if(revoked(r)||blocked(r.id,r.walletId)){skipped++;continue;}if(!u.rewards.some(x=>x.id===r.id)){u.rewards.push(copy(r));restored++;}}
   for(const id of rewardIds){const event=backup.rewardEvents?.[id];if(event&&event.userId===u.id&&!d.rewardEvents[id]&&!revoked(event)&&!blocked(id,event.walletId)){d.rewardEvents[id]=copy(event);restored++;}}
   for(const item of previous.wallet||[]){
    if(!rewardIds.has(item.key)&&!priorRewards.some(r=>r.walletId===item.id))continue;
    if(revoked(item)||blocked(item.id,item.key)){skipped++;continue;}
    if(!u.wallet.some(x=>x.id===item.id||x.key===item.key)){
     const next=copy(item),used=(u.orders||[]).find(o=>JSON.stringify(o).includes(item.id));
     if(used){next.status='已使用';next.orderId=used.id;}
     u.wallet.push(next);restored++;
    }
   }
   let restoredMeals=0;
   for(const item of previous.mealCredits||[]){
    if(!rewardIds.has(item.rewardId))continue;
    if(revoked(item)||blocked(item.id,item.rewardId)){skipped++;continue;}
    if(!u.mealCredits.some(x=>x.id===item.id||x.rewardId===item.rewardId)){
     // If a later consumption refers to a missing credit, its current balance cannot be established safely.
     if((u.orders||[]).some(o=>JSON.stringify(o).includes(item.id))){skipped++;continue;}
     u.mealCredits.push(copy(item));restoredMeals+=Math.max(0,Number(item.remaining)||0);restored++;
    }
   }
   if(restoredMeals)u.mealBalance=(Number(u.mealBalance)||0)+restoredMeals;
  }
  removeOfflineActivities(d);return {restored,skipped};
 }

 const oldMigrate=window.R38Data.migrate;
 window.R38Data.migrate=function(d){
  let changed=oldMigrate(d);
  const previous=Number(d.r38DietUpgrade?.version)||0;
  if(previous>=3)return changed;
  if(previous===0){
   d.foods=(d.foods||[]).map(f=>({...fixed(f),legacyUnits38:copy(f.units||[]),legacyMeasureType38:f.measureType}));
   for(const u of d.users||[]){u.foodPortionPrefs38={};u.foodPortionHistory38={};for(const row of u.diet||[])remember(u,row);}
   changed=true;
  }
  if(removeOfflineActivities(d))changed=true;
  
  const results=[];
  for(const backup of window.__R38_REPAIR_BACKUPS__||[])results.push(repairOfflineHistory(d,backup));
  d.r38HistoryRepair={version:1,at:new Date().toISOString(),restored:results.reduce((n,r)=>n+r.restored,0),skipped:results.reduce((n,r)=>n+r.skipped,0)};
  d.r38DietUpgrade={version:3,at:new Date().toISOString()};return true;
 };
 const query=window.R37Activities.query;window.R37Activities.query=function(){return query.apply(this,arguments).filter(x=>!(x.activity||x).removed38)};
 const amountText=M.amountText;M.amountText=function(row){return row.estimatedMl&&row.unit==='ml'?Number(Number(row.quantity).toFixed(2))+'ml（估算）':amountText(row)};
 const save=P.saveEntity;P.saveEntity=function(entity,record){return save.call(this,entity,entity==='food'?fixed(record):record)};
 const run=P.run;P.run=function(type,user,p={}){
  if(type==='DIET_UPDATE38')return this.run('DIET_UPDATE',user,p);
  if(['DIET_ADD','DIET_UPDATE'].includes(type)){
   if(p.date!=null){const time=Date.parse(p.date+'T12:00:00+08:00');ok(/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(time)&&E.dateKey(time)===p.date&&p.date<=E.dateKey(this.now()),'请选择有效日期，不能晚于今天');}
   if(p.mealTime!=null&&p.mealTime!=='')ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(p.mealTime),'用餐时间无效');
  }
  if(['DIET_ADD','DIET_UPDATE'].includes(type)&&p.unit&&Number.isFinite(Number(p.quantity)))p={...p,grams:Number(p.quantity)*unitWeight[p.unit]};
  if(type==='ADMIN_IMPORT_FOODS'){
   p={...p,rows:(p.rows||[]).map(row=>{
    const standard=!row['食物形态']&&!row.measureType&&!row['单位配置']&&!row['单位换算']&&!row['份量单位']&&!row['默认单位']&&!row.unit&&row['每单位基准量']==null&&row['每单位克重']==null&&row.grams==null;
    return {...row,__standardR38:standard,'每100克热量':row['每100克热量']??row['每100基准量热量']??row['每100毫升热量']??row['热量']??row.kcal,'份量单位':row['份量单位']||row['默认单位']||row.unit||'克','每单位克重':row['每单位基准量']??row['每单位克重']??row.grams??100};
   })};
  }
  if(type==='DIET_BATCH_ADD'){
   ok(Array.isArray(p.rows)&&p.rows.length>0,'请先添加食物');ok(p.rows.length<=100,'一次最多添加100种食物');
   const before=copy(this.data);try{return p.rows.map(row=>this.run('DIET_ADD',user,row));}catch(error){this.data=before;throw error;}
  }
  if(type==='DIET_PORTION_PREF'){const u=this.user(user);ok(this.data.foods.some(f=>f.id===p.foodId),'食物不存在');ok(['克','两','斤','ml'].includes(p.unit)&&Number.isFinite(Number(p.quantity))&&Number(p.quantity)>0,'份量无效');u.foodPortionPrefs38=u.foodPortionPrefs38||{};u.foodPortionPrefs38[p.foodId]={unit:p.unit,quantity:Number(p.quantity),baseAmount:Number(p.quantity)*unitWeight[p.unit]};return u.foodPortionPrefs38[p.foodId];}
  if(type==='ADMIN_SET_BIND_WINDOW'){ok(user==='admin','仅管理员可操作');ok(Number.isInteger(Number(p.days))&&p.days>=1&&p.days<=365,'补填期限须为1至365天');this.data.settings.bindWindowDays=Number(p.days);return {days:Number(p.days)}}
  if(type==='ADMIN_SAVE'&&p.entity==='activity37')p={...p,record:{...p.record,location:'online',audience:normalizeActivityAudience(p.record?.audience)}};
  const approximate=['DIET_ADD','DIET_UPDATE'].includes(type)&&p.unit==='ml';
  const source=p;
  const result=run.call(this,type,user,approximate?{...p,unit:'克',quantity:Number(p.quantity),grams:Number(p.quantity)}:p);
  if(['DIET_ADD','DIET_UPDATE'].includes(type)&&result){
   if(!result.foodId&&source.unit&&unitWeight[source.unit]&&Number.isFinite(Number(source.quantity))){result.unit=source.unit;result.quantity=Number(source.quantity);result.unitAmount=unitWeight[source.unit];result.unitSnapshot=[...(result.unitSnapshot||[]).filter(x=>x[0]!==source.unit),[source.unit,unitWeight[source.unit]]];}
   if(approximate){Object.assign(result,{unit:'ml',quantity:Number(source.quantity),unitAmount:1,estimatedMl:true,mlToGramEstimate:1,enteredVolumeMl:Number(source.quantity)});result.unitSnapshot=[...(result.unitSnapshot||[]).filter(x=>x[0]!=='ml'),['ml',1]];}
   else if(result.estimatedMl&&source.unit){delete result.estimatedMl;delete result.mlToGramEstimate;delete result.enteredVolumeMl;}
   if(source.date)result.date=source.date;
   if(source.mealTime!=null){if(source.mealTime)result.mealTime=source.mealTime;else delete result.mealTime;}
  }
  if(['DIET_ADD','DIET_UPDATE'].includes(type)&&result)remember(this.user(user),result);
  if(type==='ADMIN_IMPORT_FOODS')this.data.foods=this.data.foods.map(f=>fixed(f));
  return result;
 };
 window.R38DietUpgrade={fixed,remember,removeOfflineActivities,personalCodes,normalizeActivityAudience,reliableBackup,repairOfflineHistory};
})();
