// R18 extensions run inside Store.action's existing rollback/dedup/persistence boundary.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,copy=x=>JSON.parse(JSON.stringify(x));
 const ok=(v,m)=>{if(!v)throw Error(m);},number=v=>v!==''&&v!=null&&Number.isFinite(+v)&&+v>=0;
 function categories(d){
   d.foodCategories=d.foodCategories||[];
   for(const f of d.foods){let c=d.foodCategories.find(c=>c.id===f.categoryId||c.name===f.cat);if(!c){c={id:'FC-legacy-'+d.foodCategories.length,name:f.cat||'未分类',status:'启用',revision:1};d.foodCategories.push(c);}f.categoryId=c.id;f.cat=c.name;}
   return d.foodCategories;
 }
 const save=P.saveEntity;
 P.saveEntity=function(entity,r){if(entity!=='food')return save.call(this,entity,r);
   const list=categories(this.data),old=this.data.foods.find(f=>f.id===r.id),c=list.find(c=>r.categoryId?c.id===r.categoryId:c.name===r.cat);
   ok(c,'请选择已有食物分类；导入未知分类前请先新增或匹配');ok(c.status==='启用'||old?.categoryId===c.id,'该分类已停用，请选择启用分类');
   return save.call(this,entity,{...r,cat:c.name,categoryId:c.id});
 };
 const run=P.run;
 P.run=function(type,user,p){
   if(type==='ADMIN_IMPORT_FOODS'){
     const list=categories(this.data),rows=(p.rows||[]).map(row=>{const name=String(row['分类']||row.cat||'主食').trim(),c=list.find(c=>c.name===name);ok(c,'未知食物分类「'+name+'」，请先新增或匹配已有分类');ok(c.status==='启用','分类「'+name+'」已停用，不能导入新食物');return {...row,cat:c.name,...(row['分类']!=null?{'分类':c.name}:{})};});
     const result=run.call(this,type,user,{...p,rows});categories(this.data);return result;
   }
   if(type==='ADMIN_CATEGORY'){
     ok(user==='admin','仅管理员可操作');const list=categories(this.data),old=list.find(c=>c.id===p.id),name=String(p.name||'').trim();
     ok(name&&name.length<=30,'分类名称须为1至30字');ok(!list.some(c=>c.id!==old?.id&&c.name.toLowerCase()===name.toLowerCase()),'分类名称重复');
     if(old&&p.expectedRevision!=null)ok(p.expectedRevision===old.revision,'分类已被其他窗口修改，请重新打开');
     const c={id:old?.id||'FC'+this.now()+Math.random().toString(36).slice(2,6),name,status:p.status==='停用'?'停用':'启用',revision:(old?.revision||0)+1};
     if(old)Object.assign(old,c);else list.push(c);for(const f of this.data.foods)if(f.categoryId===c.id)f.cat=c.name;return c;
   }
   if(type==='ADMIN_MENU_DISH'){
     ok(user==='admin','仅管理员可操作');const plans=this.data.menuPlans=this.data.menuPlans||[];
     let plan=plans.find(x=>x.id===p.planId);if(!plan){ok(p.brand&&p.weekId&&p.start&&p.end,'菜单关联信息不完整');plan={id:p.planId,brand:p.brand,brandId:p.brandId||null,weekId:p.weekId,start:p.start,end:p.end,dishes:[],revision:1};plans.push(plan);}
     ok(p.date>=plan.start&&p.date<=plan.end&&/^\d{4}-\d{2}-\d{2}$/.test(p.date),'请选择菜单周内日期');ok(['午餐','晚餐'].includes(p.meal),'请选择午餐或晚餐');
     const old=plan.dishes.find(x=>x.id===p.id);if(old&&p.expectedRevision!=null)ok(old.revision===p.expectedRevision,'菜品已被其他窗口修改，请重新打开');
     const f=p.foodId?this.data.foods.find(f=>f.id===p.foodId):null;ok(!p.foodId||f?.status==='启用','所选食物不可用');
     const name=String(p.name||f?.name||'').trim();ok(name,'请填写菜品名称');ok(Number.isFinite(+p.grams)&&+p.grams>0,'实际份量须大于零');
     const base={};for(const k of ['kcal','carb','protein','fat','fiber']){const v=p[k];if(k!=='fiber')ok(number(v),'请填写热量与三大营养素四项数值');else ok(v==null||v===''||number(v),'膳食纤维须为非负数');base[k]=v==null||v===''?null:+v;}
     const dish={id:old?.id||'MD'+this.now()+Math.random().toString(36).slice(2,7),date:p.date,meal:p.meal,name,grams:+p.grams,foodId:f?.id||null,base,nutrition:Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v==null?null:Math.round(v*p.grams)/100])),done:true,revision:(old?.revision||0)+1,updatedAt:new Date(this.now()).toISOString()};
     if(old)Object.assign(old,dish);else plan.dishes.push(dish);plan.revision++;if(p.legacyId){const m=this.data.menu.find(x=>x.id===p.legacyId);if(m)m.assignedDishId=dish.id;}return dish;
   }
   return run.call(this,type,user,p);
 };
 window.R18Data={categories};
})();
