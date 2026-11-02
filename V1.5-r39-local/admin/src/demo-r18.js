window.__g18Demo=function(data,now){
 const copy=x=>JSON.parse(JSON.stringify(x));
 const names={'INV':'林小鸦','NEW':'初晴','PAID':'小悠','DEMO-M':'小禾','DEMO-U':'小满','DEMO-R':'小青','DEMO-G':'小谷'};
 for(const u of data.users)if(names[u.id]){u.name=names[u.id];u.profile.name=u.name;}
 window.R18Data.categories(data);
 const E=window.__DUYA_LOCAL_ENGINE,store=new E.Store({initial:data,now:()=>now}),past=new Date(now-10*86400000).toISOString();
 const titles=['新客首单成长礼','工作日轻食计划','七日登录挑战','营养记录成长礼','午餐订购成长礼','晚餐轻食成长礼','商户新客体验礼','好友活跃成长礼','周末健康成长礼','秋日饮食成长礼','长期陪伴成长礼','冬季预热成长礼'];
 for(let i=0;i<12;i++){
   const mode=i%4===0?'users':i%4===1?'merchants':i%4===2?'userCodes':'all';
   const a={id:'GA18-'+i,name:titles[i],desc:'示例活动 · 用于核对人群、阶段及奖励记录',status:i===8||i===10?'停用':'启用',start:i===11?'2027-11-01':'2026-10-01',end:i===9?'2026-10-05':'2027-12-31',audience:{mode,allUsers:mode==='all',userIds:mode==='users'?['PAID','INV']:[],merchantCodes:mode==='merchants'?['K7HQ92MD']:[],userInviteCodes:mode==='userCodes'?['H8NQ4W3R']:[]},stages:[{id:'g18-stage-'+i,name:i%2?'活跃成长礼':'完善资料礼',enabled:true,activeMode:'always',condition:i%2?{type:'login_days',days:2}:{type:'profile_complete'},rewardMode:'fixed',rewards:[{type:i%3===0?'meal':'custom',...(i%3===0?{count:1}:{name:'健康食谱手册',image:''}),probability:100}]}]};
   store.saveGrowthActivityV16(a);const saved=store.data.growthActivities.find(x=>x.id===a.id);if(i!==11)saved.activatedAt=past;
 }
 for(const u of store.data.users)store.settleGrowthActivities(u.id);
 data=store.data;
 // Explicit, labelled example rows, not an interpretation of the menu image.
 const brands=['Leapeer 鹿跃森','薄荷晨间','谷物碗社'];
 data.menuPlans=brands.map((brand,i)=>({id:'MP18-'+i,brand,brandId:data.brands.find(b=>b.name===brand)?.id||null,weekId:'W33',start:'2026-08-10',end:'2026-08-16',demo:true,revision:1,dishes:Array.from({length:7},(_,day)=>['午餐','晚餐'].map((meal,j)=>{const f=data.foods[(i*3+day+j)%data.foods.length],grams=150+25*j,done=(day+j)%4!==0,base=Object.fromEntries(['kcal','carb','protein','fat','fiber'].map(k=>[k,f[k]??null]));return {id:'MD18-'+i+'-'+day+'-'+j,date:'2026-08-'+String(10+day).padStart(2,'0'),meal,name:f.name,grams,foodId:f.id,done,base:done?copy(base):null,nutrition:done?Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v==null?null:Math.round(v*grams)/100])):null,revision:1};})).flat()}));
 data.revision=1;data.now=new Date(now).toISOString();return data;
};
