// Advanced food selection is independent from the basic brand catalogue and diet ledger.
(()=>{
 const R=window.R39Recipes,e=esc,base=SCREENS.menu.render,colors={staple:'#f8e6d2',protein:'#e5ead2',vegetable:'#d4e0ea'};
 let meal='lunch',selection=null,sub='',saving=false;
 const state39=()=>R.query(r3.state,r3Me().id,meal),n=x=>Number(x).toFixed(1).replace(/\.0$/,'');
 const image=(food,cls='')=>food.image?'<img class="'+cls+'" src="'+e(window.__offlineAsset(food.image))+'" alt="'+e(food.name)+'">':'<span class="rp39-noimg '+cls+'">'+e(R.groups[food.group])+'</span>';
 const polar=(r,a)=>[150+r*Math.cos(a*Math.PI/180),150+r*Math.sin(a*Math.PI/180)];
 function disc(plate){
  return '<svg class="rp39-disc" viewBox="0 0 300 300" aria-label="'+e(plate.name)+'，点击区域替换食物"><circle cx="150" cy="150" r="145" fill="white"/>'+['protein','vegetable','staple'].map((group,i)=>{
   const a=-90+i*120,b=a+120,start=polar(137,a),end=polar(137,b),pos=polar(76,a+60),s=plate.slots[group],stats=R.nutrients(s),label=s.name.length>7?s.name.slice(0,7)+'…':s.name;
   const picture=s.image?'<image href="'+e(window.__offlineAsset(s.image))+'" x="'+(pos[0]-29)+'" y="'+(pos[1]-45)+'" width="58" height="52" preserveAspectRatio="xMidYMid meet"/>':'<text x="'+pos[0]+'" y="'+(pos[1]-14)+'" class="rp39-svg-placeholder">'+R.groups[group]+'</text>';
   return '<g role="button" tabindex="0" data-act="rp39-open" data-plate="'+e(plate.id)+'" data-group="'+group+'" aria-label="替换'+e(plate.name)+R.groups[group]+'：'+e(s.name)+'"><title>'+e(s.name)+' '+n(s.grams)+'g</title><path d="M150 150 L'+start.join(' ')+' A137 137 0 0 1 '+end.join(' ')+' Z" fill="'+colors[group]+'" stroke="white" stroke-width="5"/>'+picture+'<text x="'+pos[0]+'" y="'+(pos[1]+19)+'" class="rp39-svg-name">'+e(label)+'</text><text x="'+pos[0]+'" y="'+(pos[1]+34)+'" class="rp39-svg-data">'+n(stats.kcal)+'kcal · '+n(s.grams)+'g</text></g>';
  }).join('')+'</svg>';
 }
 function plateHTML(p){return '<article class="rp39-plate"><div class="rp39-plate-body"><div class="rp39-disc-wrap">'+disc(p)+'<p>餐盘 '+p.code+' <small>实际热量 '+n(p.total.kcal)+' kcal</small></p></div><aside><div><small>参考热量</small><strong>'+n(p.referenceKcal)+' <em>kcal</em></strong></div><div><small>烹调用油上限</small><strong>≤'+n(p.oilLimit)+'g</strong></div></aside></div><div class="rp39-ratios"><div>'+Object.keys(R.groups).map(g=>'<span><i style="background:'+colors[g]+'"></i>'+({staple:'主食',protein:'蛋白类食材',vegetable:'蔬菜'}[g])+' '+n(p.ratio[g])+'%</span>').join('')+'</div><div class="rp39-ratio-bar">'+Object.keys(R.groups).map(g=>'<i style="width:'+p.ratio[g]+'%;background:'+colors[g]+'"></i>').join('')+'</div><small>按食材重量计算占比</small></div></article>';}
 SCREENS.menu.render=function(){
  const mode=window.R39PlanMode.read(r3Me());if(mode.mode!=='advanced')return base();
  if(!mode.goal)return '<div class="rp39-page"><p class="rp39-quote">好好吃饭，是照顾身体最温柔也最坚定的方式。</p><section class="rp39-empty"><div>◎</div><h2>先设置目标</h2><p>选择减重、增肌或减脂目标后，查看你的午晚餐盘搭配。</p><button class="m39-confirm" data-act="m39-target-open">设置进阶目标</button></section></div>';
  const v=state39();return '<div class="rp39-page"><p class="rp39-quote">好好吃饭，是照顾身体最温柔也最坚定的方式。</p><div class="rp39-meal-tabs" role="tablist">'+Object.entries(R.meals).map(([key,title])=>'<button role="tab" aria-selected="'+(key===meal)+'" class="'+(key===meal?'on':'')+'" data-act="rp39-meal" data-meal="'+key+'">'+title+'</button>').join('')+'</div>'+(v.ready?'<section class="rp39-meal"><header><h2>'+I('meal')+R.meals[meal]+'</h2><span>两盘总热量 <b>'+n(v.total.kcal)+' kcal</b></span></header><p class="rp39-tip">点击餐盘中的食物可替换 · 餐盘 A、B 共同组成一餐</p><p class="rp39-meal-macros">碳水 '+n(v.total.carb)+'g · 蛋白质 '+n(v.total.protein)+'g · 脂肪 '+n(v.total.fat)+'g</p>'+v.plates.map(plateHTML).join('')+'</section><button class="rp39-reset" data-act="rp39-reset">恢复默认搭配</button>':'<section class="rp39-empty"><h2>暂无'+R.meals[meal]+'餐盘</h2><p>餐盘配置尚未完整启用，请稍后再试。</p></section>')+'</div>';
 };
 function candidateRow(f,grams,current=false){const s={...f,grams,nutrition:f.nutrition||Object.fromEntries(R.macros.map(k=>[k,f[k]]))},v=R.nutrients(s);return '<'+(current?'div':'button')+' class="rp39-food '+(current?'current':'')+'" '+(current?'':'data-act="rp39-replace" data-food="'+e(f.id)+'"')+'>'+image(f)+'<div><header><b>'+e(f.name)+'</b><span>'+n(grams)+'g</span><strong>'+n(v.kcal)+' kcal</strong></header><p>碳水：<b>'+n(v.carb)+'g</b> · 蛋白质：<b>'+n(v.protein)+'g</b> · 脂肪：<b>'+n(v.fat)+'g</b></p></div></'+(current?'div':'button')+'>';}
 function openSheet(){
  const v=state39(),plate=v.plates.find(p=>p.id===selection?.plate),s=plate?.slots[selection?.group];if(!s)return;
  const items=R.candidates(r3.state,meal,plate.id,selection.group),cfg=R.config(r3.state),categories=cfg.subcategories.filter(c=>c.status==='启用'&&c.group===selection.group&&items.some(f=>f.subId===c.id));
  if(sub&&!categories.some(c=>c.id===sub))sub='';const list=items.filter(f=>!sub||f.subId===sub);
  sheet({title:'替换'+R.meals[meal]+'食物',size:'rp39-sheet',body:'<div class="rp39-replacement">'+candidateRow(s,s.grams,true)+'<h3>可替换食物</h3><p class="rp39-tip">替换后保持 '+n(s.grams)+' 克，以下营养按此份量计算。</p><div class="rp39-subtabs" role="tablist">'+[{id:'',name:'全部'},...categories].map(c=>'<button role="tab" aria-selected="'+(c.id===sub)+'" class="'+(c.id===sub?'on':'')+'" data-act="rp39-sub" data-sub="'+e(c.id)+'">'+e(c.name)+'</button>').join('')+'</div><div class="rp39-candidates">'+(list.map(f=>candidateRow(f,s.grams)).join('')||'<p class="rp39-tip">暂无可替换食物</p>')+'</div></div>',dismissible:true});
 }
 r3Act('rp39-meal',node=>{meal=node.dataset.meal;selection=null;render();});
 r3Act('rp39-open',node=>{selection={plate:node.dataset.plate,group:node.dataset.group};sub='';openSheet();});
 r3Act('rp39-sub',node=>{sub=node.dataset.sub;openSheet();});
 r3Act('rp39-replace',async node=>{if(saving||!selection)return;saving=true;try{await r3.cmd('RECIPE39_REPLACE',{meal,plateId:selection.plate,group:selection.group,foodId:node.dataset.food});selection=null;closeAllLayers();render();toast('餐盘食物已替换');}finally{saving=false;}});
 r3Act('rp39-reset',()=>confirmModal('恢复默认搭配','将清除本餐替换结果，并读取后台当前搭配。不会影响饮食记录。','恢复默认',r3Safe(async()=>{if(saving)return;saving=true;try{await r3.cmd('RECIPE39_RESET',{meal});render();}finally{saving=false;}})));
 document.addEventListener('keydown',ev=>{const n=ev.target.closest('.rp39-disc [role="button"]');if(n&&['Enter',' '].includes(ev.key)){ev.preventDefault();ACTIONS['rp39-open'](n);}});
 window.R39RecipeUI={query:state39};
})();
