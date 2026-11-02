// V1.5-r25 user nutrition targets, invite reveal and diet item editing.
(()=>{
  const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const ok=(value,message)=>{if(!value)throw Error(message);};
  const good=value=>value!==''&&value!=null&&Number.isFinite(+value)&&+value>=0;

  function migrate(data){
    for(const user of data.users||[]){
      user.inviteCodeRevealedAt=user.inviteCodeRevealedAt||null;
      user.nutritionTarget=user.nutritionTarget||null;
    }
    return data;
  }

  function validateTarget(target){
    ok(target&&typeof target==='object','营养目标无效');
    const kcal=Number(target.kcal),grams=target.grams||{},percentages=target.percentages||{};
    ok(Number.isFinite(kcal)&&kcal>=500&&kcal<=6000,'每日热量须在500至6000 kcal之间');
    for(const key of ['carb','protein','fat']){
      ok(Number.isFinite(+grams[key])&&+grams[key]>=0&&+grams[key]<=1500,'营养素克重无效');
      ok(Number.isFinite(+percentages[key])&&+percentages[key]>=0&&+percentages[key]<=100,'营养素比例无效');
    }
    const total=['carb','protein','fat'].reduce((sum,key)=>sum+Number(percentages[key]),0);
    ok(Math.abs(total-100)<0.2,'三大营养素比例合计必须为100%');
    return {
      kcal:Math.round(kcal),
      grams:Object.fromEntries(['carb','protein','fat'].map(key=>[key,Math.round(Number(grams[key])*10)/10])),
      percentages:Object.fromEntries(['carb','protein','fat'].map(key=>[key,Math.round(Number(percentages[key])*10)/10])),
      updatedAt:new Date(this.now()).toISOString()
    };
  }

  function dietMacros(food,grams){
    const ratio=Number(grams)/100;
    return Object.fromEntries(['kcal','carb','protein','fat','fiber','na','k','ca','fe','zn'].map(key=>[key,food?.[key]==null?null:Math.round(Number(food[key])*ratio*10)/10]));
  }

  const run=P.run;
  P.run=function(type,user,payload={}){
    if(type==='INVITE_GENERATE'){
      const owner=this.user(user);
      if(owner.inviteCode){
        owner.inviteCodeRevealedAt=new Date(this.now()).toISOString();
        return {code:owner.inviteCode,revealedAt:owner.inviteCodeRevealedAt};
      }
      const result=run.call(this,type,user,payload);
      owner.inviteCodeRevealedAt=new Date(this.now()).toISOString();
      return {...result,revealedAt:owner.inviteCodeRevealedAt};
    }
    if(type==='NUTRITION_TARGET_SAVE'){
      const owner=this.user(user);
      owner.nutritionTarget=validateTarget.call(this,clone(payload.target||{}));
      return owner.nutritionTarget;
    }
    if(type==='DIET_UPDATE'){
      const owner=this.user(user),item=owner.diet.find(row=>row.id===payload.id);
      ok(item,'饮食记录不存在');
      const grams=Number(payload.grams);
      ok(Number.isFinite(grams)&&grams>0,'份量须大于零');
      item.grams=Math.round(grams*10)/10;
      if(payload.meal&&['早餐','午餐','晚餐','加餐'].includes(payload.meal))item.meal=payload.meal;
      if(payload.foodId)item.foodId=payload.foodId;
      if(item.foodId){
        const food=this.data.foods.find(food=>food.id===item.foodId);
        ok(food,'原食物不存在，无法修改份量');
        Object.assign(item,dietMacros(food,grams));
      }else{
        for(const key of ['kcal','carb','protein','fat']){
          ok(payload[key]===undefined||payload[key]===null||good(payload[key]),'营养值须为非负数字');
          item[key]=payload[key]===undefined?item[key]:payload[key]===null||payload[key]===''?null:Number(payload[key]);
        }
        item.fiber=null;item.na=null;item.k=null;item.ca=null;item.fe=null;item.zn=null;
      }
      return item;
    }
    if(type==='DIET_DELETE')return run.call(this,type,user,payload);
    return run.call(this,type,user,payload);
  };

  window.R25Data={migrate,dietMacros,validateTarget};
})();
