// Demo-only, additive and idempotent. No business command or settlement is invoked.
(()=>{
  const recipes=[['早餐','F010',50],['早餐','F014',50],['午餐','F001',200],['午餐','F007',100],['晚餐','F005',175],['晚餐','F006',180],['加餐','F002',100]];
  function seed(data,now=Date.now()){
    const user=data.users?.find(u=>u.id==='INV');if(!user)return false;
    const marks=user.demoDietSeededDates||(user.demoDietSeededDates={});let changed=false;
    for(let offset=0;offset<7;offset++){
      const date=new Date(now+8*3600000-offset*86400000).toISOString().slice(0,10);
      if(marks[date])continue;
      if(!user.diet.some(item=>item.date===date)){
        for(const [index,[meal,id,grams]]of recipes.entries()){
          const food=data.foods.find(f=>f.id===id);if(!food)continue;
          const item={id:'DEMO-R33-INV-'+date+'-'+index,date,meal,foodId:id,name:food.name,grams,pending:false,demo:true};
          for(const k of ['kcal','carb','protein','fat','fiber','na','k','ca','fe','zn']){const factor=['kcal','na','k','ca'].includes(k)?1:10;item[k]=food[k]==null?null:Math.round(Number(food[k])*grams/100*factor)/factor;}
          user.diet.push(item);
        }
      }
      marks[date]=true;changed=true;
    }
    return changed;
  }
  window.R33DietDemo={seed};
})();
