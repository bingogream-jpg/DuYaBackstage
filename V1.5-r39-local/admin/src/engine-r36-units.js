// Shared measurement rules. Existing diet rows are never migrated or reinterpreted.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,copy=x=>JSON.parse(JSON.stringify(x));
 const nutrients=['kcal','carb','protein','fat','fiber','na','k','ca','fe','zn'];
 const ok=(value,message)=>{if(!value)throw Error(message);};
 const kind=f=>f?.measureType==='liquid'?'liquid':f?.measureType==='solid'?'solid':f?.cat==='饮品'?'liquid':'solid';
 const baseName=f=>kind(f)==='liquid'?'毫升':'克';
 function normalized(food,strict=false){
  const f=copy(food),type=kind(f),base=type==='liquid'?'毫升':'克',other=type==='liquid'?'克':'毫升';
  if(strict&&f.measureType!=null)ok(['solid','liquid'].includes(f.measureType),'请选择固体或液体');
  const canonical=name=>/^g$/i.test(name)?'克':/^ml$/i.test(name)?'毫升':name;
  const raw=(f.units||[]).map(u=>[canonical(String(u[0]||'').trim()),Number(u[1])]);
  if(strict&&f.defaultUnit!=null)ok(String(f.defaultUnit).trim(),'请重新选择默认单位');
  if(strict){ok(new Set(raw.map(u=>u[0])).size===raw.length,'份量单位不能重复');ok(raw.every(u=>u[0]&&Number.isFinite(u[1])&&u[1]>0),'单位换算量须为正数');ok(!raw.some(u=>u[0]===other),'不同计量维度的单位不能混用');ok(!raw.some(u=>u[0]===base&&u[1]!==1),'基础单位换算量必须为1');}
  f.measureType=type;f.nutritionBasis=type==='liquid'?'100ml':'100g';
  f.units=[...raw.filter(u=>u[0]!==base&&u[0]!==other),[base,1]];
  f.defaultUnit=canonical(f.defaultUnit||base);
  if(!strict&&f.defaultUnit===other)f.defaultUnit=base;
  if(strict)ok(f.units.some(u=>u[0]===f.defaultUnit),'默认单位不存在，请重新选择');
  if(!f.units.some(u=>u[0]===f.defaultUnit))f.defaultUnit=base;
  f.defaultQuantity=f.defaultQuantity==null?(f.defaultUnit===base?100:1):Number(f.defaultQuantity);
  if(strict)ok(Number.isFinite(f.defaultQuantity)&&f.defaultQuantity>0,'默认数量须为正数');
  return f;
 }
 function migrate(data){data.foods=(data.foods||[]).map(f=>normalized(f));return data;}
 const units=f=>{const n=normalized(f),base=baseName(n);return [[base,1],...n.units.filter(u=>u[0]!==base)];};
 const recordAmount=item=>item.baseAmount??(item.volumeMl??item.grams);
 const recordUnit=item=>item.baseUnit==='ml'?'ml':'g';
 const amountText=item=>item.pending&&recordAmount(item)==null?'份量待确认':recordAmount(item)==null?'份量未记录':Number(Number(recordAmount(item)).toFixed(2))+recordUnit(item);
 function recordFood(item,food){
  if(!item)return normalized(food);
  const amount=Number(recordAmount(item)),type=item.measureType||'solid';
  const base=item.nutritionBase||Object.fromEntries(nutrients.map(k=>[k,item[k]==null||!(amount>0)?null:Number(item[k])*100/amount]));
  return normalized({...food,...base,name:item.name,measureType:type,units:item.unitSnapshot||[[type==='liquid'?'毫升':'克',1]],defaultUnit:item.unit|| (type==='liquid'?'毫升':'克'),defaultQuantity:item.quantity??amount});
 }
 const save=P.saveEntity;P.saveEntity=function(entity,record){return save.call(this,entity,entity==='food'?normalized({...this.data.foods.find(f=>f.id===record.id),...record},true):record);};
 function importRow(row){
  const type=row['食物形态']||row.measureType;
  if(type)ok(['固体','液体','solid','liquid'].includes(type),'食物形态须为固体或液体');
  const text=row['单位配置']||row['单位换算']||'',config=text?String(text).split(/[;；]/).filter(s=>s.trim()).map(part=>{const m=part.trim().match(/^(.+?)([:=＝])\s*(\d*\.?\d+(?:e[+-]?\d+)?)\s*(?:克|毫升|g|ml)?$/i);ok(m,'单位配置格式须为“个:100；份:250”');const name=m[2]===':'?m[1].trim():m[1].trim().replace(/^1/,'');ok(name&&Number.isFinite(Number(m[3]))&&Number(m[3])>0,'单位配置换算量须为正数');return [name,Number(m[3])];}):null;
  if(config)ok(new Set(config.map(u=>u[0])).size===config.length,'单位配置名称不能重复');
  let unit=row['份量单位']||row.unit||row['默认单位']||config?.[0]?.[0]||'份';
  const legacyLiquid=!type&&(row['分类']||row.cat)==='饮品';if(legacyLiquid&&['克','g'].includes(unit))unit='毫升';
  return {...row,'食物名称':String(row['食物名称']||row.name||'').trim(),...(legacyLiquid&&['克','g'].includes(row['默认单位'])?{'默认单位':'毫升'}:{}),'份量单位':unit,unitConfig:config,'每单位克重':row['每单位基准量']??row['每单位克重']??row.grams??config?.find(u=>u[0]===unit)?.[1],'每100克热量':row['每100基准量热量']??row['每100毫升热量']??row['每100克热量']??row.kcal};
 }
 const run=P.run;P.run=function(type,user,payload={}){
  if(type==='ADMIN_IMPORT_FOODS'){
   const before=this.data.foods.length,known=new Set(this.data.foods.map(f=>f.id)),rows=(payload.rows||[]).map(importRow),result=run.call(this,type,user,{...payload,rows});
   this.data.foods=this.data.foods.map((f,index)=>{if(index<before)return f;if(known.has(f.id))f.id=f.id+'-'+Math.random().toString(36).slice(2,8);known.add(f.id);const row=rows.find(r=>(r['食物名称']||r.name)===f.name)||{};if(row.__standardR38)return f;const t=row['食物形态']||row.measureType;return normalized({...f,measureType:t?(t==='液体'||t==='liquid'?'liquid':'solid'):kind(f),units:row.unitConfig||f.units,defaultUnit:row['默认单位']||f.defaultUnit,defaultQuantity:row['默认数量']??f.defaultQuantity},true);});return result;
  }
  if((type==='DIET_ADD'&&payload.foodId)||(type==='DIET_UPDATE'&&(payload.foodId||this.user(user).diet.find(d=>d.id===payload.id)?.foodId))){
   const owner=this.user(user),old=type==='DIET_UPDATE'?owner.diet.find(d=>d.id===payload.id):null;
   if(type==='DIET_UPDATE')ok(old,'饮食记录不存在');
   const food=this.data.foods.find(f=>f.id===(payload.foodId||old?.foodId));ok(food,'食物不存在');
   const reselect=payload.reselectFood||Boolean(old&&payload.foodId&&payload.foodId!==old.foodId);
   if(!old||reselect)ok(food.status==='启用','食物已停用，请重新选择');
   const meta=old&&!reselect?recordFood(old,food):normalized(food);
   const unit=payload.unit||baseName(meta),factor=units(meta).find(u=>u[0]===unit)?.[1];ok(factor,'所选单位不存在或不适用');
   const quantity=Number(payload.quantity??(payload.baseAmount??payload.grams??payload.volumeMl??recordAmount(old||{})??100)/factor);ok(Number.isFinite(quantity)&&quantity>0,'请填写有效的正数数量');
   const amount=Math.round(quantity*factor*10000)/10000;ok(Number.isFinite(amount)&&amount>0,'实际份量无效');
   const date=payload.date||old?.date,meal=payload.meal||old?.meal,time=payload.mealTime??old?.mealTime;
   ok(/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&Number.isFinite(Date.parse(date+'T12:00:00+08:00'))&&E.dateKey(Date.parse(date+'T12:00:00+08:00'))===date,'请选择有效日期');ok(date<=E.dateKey(this.now()),'不能记录未来日期');ok(['早餐','午餐','晚餐','加餐'].includes(meal),'请选择餐次');ok(time==null||time===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(time),'用餐时间无效');
   if(!old)ok(this.data.settings.dietEnabled,'饮食记录已关闭');
   const item=old||{id:'DIET'+this.now()+Math.random().toString(36).slice(2,7)};
   Object.assign(item,{date,meal,name:old&&!reselect?old.name:food.name,foodId:food.id,pending:false,measureType:kind(meta),baseUnit:kind(meta)==='liquid'?'ml':'g',baseAmount:amount,quantity,unit,unitAmount:factor,unitSnapshot:copy(units(meta)),nutritionBasis:meta.nutritionBasis,nutritionBase:Object.fromEntries(nutrients.map(k=>[k,meta[k]??null])),grams:kind(meta)==='solid'?amount:null});
   if(kind(meta)==='liquid')item.volumeMl=amount;else delete item.volumeMl;
   if(time!=null&&time!=='')item.mealTime=time;else delete item.mealTime;
   for(const k of nutrients){const scale=['kcal','na','k','ca'].includes(k)?1:10;item[k]=meta[k]==null?null:Math.round(Number(meta[k])*amount/100*scale)/scale;}
   if(!old)owner.diet.push(item);return item;
  }
  const result=run.call(this,type,user,payload);
  if(['DIET_ADD','DIET_UPDATE'].includes(type)&&result&&!result.pending&&!result.foodId&&Number(result.grams)>0){if(payload.name!=null){ok(String(payload.name).trim(),'请填写食物名称');result.name=String(payload.name).trim();}Object.assign(result,{measureType:'solid',baseUnit:'g',baseAmount:result.grams,unit:'克',quantity:result.grams,unitAmount:1,unitSnapshot:[['克',1]],nutritionBasis:'100g',nutritionBase:Object.fromEntries(nutrients.map(k=>[k,result[k]==null?null:result[k]*100/result.grams]))});}
  if(['ADMIN_MENU','ADMIN_MENU_DISH','ADMIN_AUDIT_FOOD'].includes(type))migrate(this.data);
  return result;
 };
 window.R36Measure={kind,baseName,normalize:normalized,migrate,units,amountText,recordAmount,recordUnit,recordFood,importRow,nutrients};
})();
