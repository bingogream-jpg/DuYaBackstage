// V1.5-r36 meal reward settings and unified reward status presentation.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const S=()=>window.R3.state;
  const ae=C.ae;
  const appRules=()=>window.R31.appRules();
  const effective=()=>window.R36MealRules.effectiveRules(S());
  const tabs=()=>[['rules','小程序规则设置'],['mealReward','奖励设置'],['sharePoster','小程序分享海报设置'],['invitePoster','用户邀请海报设置'],['loginbg','小程序登录页背景设置']];
  function tabsMarkup(active){
    return '<div class="tabs r36-settings-tabs">'+tabs().map(([id,label])=>'<button class="tab-button '+(active===id?'active':'')+'" data-action="r31-app-rules-tab" data-tab="'+id+'">'+label+'</button>').join('')+'</div>';
  }
  function treeMarkup(){
    const rules=effective(),brands=S().brands||[],packages=S().packages||[];
    return '<div class="r36-meal-tree">'+brands.map(brand=>{
      const selected=rules.eligiblePackages[brand.id]||[],all=selected.length===packages.length;
      return '<details class="r36-brand-tree" open><summary><span>'+ae(brand.name)+'</span><em>'+selected.length+' / '+packages.length+' 个套餐</em></summary><div class="r36-package-tree"><label class="r36-brand-check"><input type="checkbox" data-r36-brand="'+ae(brand.id)+'" '+(all?'checked':'')+'>品牌全选</label>'+packages.map(item=>'<label><input type="checkbox" data-r36-package data-brand="'+ae(brand.id)+'" value="'+ae(item.id)+'" '+(selected.includes(item.id)?'checked':'')+'><span><b>'+ae(item.name)+'</b><small>'+item.total+' 餐 · ¥'+item.price+'</small></span></label>').join('')+'</div></details>';
    }).join('')+'</div>';
  }
  function mealPage(){
    return C.ar3Head('小程序设置','配置小程序规则、分享物料、邀请海报、登录背景和赠餐使用范围。')+tabsMarkup('mealReward')+'<div class="r32-rules-body r36-meal-settings"><section class="r3-card"><h3>奖励设置</h3><div class="r36-claim-settings"><label>优惠券未领取失效天数<input type="number" min="1" max="365" step="1" data-r36-claim="couponClaimDays" value="'+window.R36Rewards.rewardRules(S()).couponClaimDays+'"><em>天</em></label><label>赠餐未领取失效天数<input type="number" min="1" max="365" step="1" data-r36-claim="mealClaimDays" value="'+window.R36Rewards.rewardRules(S()).mealClaimDays+'"><em>天</em></label></div><p class="form-hint">领取期限从新奖励获得时起计算并保存快照；旧奖励不补期限，调整不影响已产生的奖励。自定义奖励按后台发放状态展示。</p><h3>赠餐使用设置</h3><p class="form-hint">用户领取赠餐时保存当前适用范围与有效期快照；此处调整只影响之后领取的赠餐。</p><div class="r36-meal-config-bar"><label>领取后赠餐有效天数<input data-r36-meal-days type="number" min="1" max="365" step="1" value="'+effective().validityDays+'"><em>天</em></label><div><button type="button" class="button secondary small" data-action="r36-meal-select-all">全选全部</button><button type="button" class="button secondary small" data-action="r36-meal-clear-all">清空全部</button></div></div><div class="r36-meal-tree-head"><div><b>适用品牌与套餐</b><p>先选品牌下可参与赠餐的套餐；未勾选任何套餐时赠餐保留但不可在结算页使用。</p></div><span>按品牌展开</span></div>'+treeMarkup()+'<div class="r36-meal-save"><span>用户可在所选品牌的对应套餐结算时使用赠餐，并增加套餐餐数。</span><button type="button" class="button primary" data-action="r36-save-meal-rules">保存奖励设置</button></div></section></div>';
  }
  const base=C.V15_PAGES['app-rules'];
  C.V15_PAGES['app-rules']=function(){
    if(C.state.appRulesTab==='mealReward')return mealPage();
    const box=document.createElement('div');box.innerHTML=base();
    const bar=box.querySelector('.tabs');
    if(bar){
      const rulesButton=bar.querySelector('[data-action="r31-app-rules-tab"][data-tab="rules"]');
      if(rulesButton&&!bar.querySelector('[data-tab="mealReward"]'))rulesButton.insertAdjacentHTML('afterend','<button class="tab-button" data-action="r31-app-rules-tab" data-tab="mealReward">奖励设置</button>');
    }
    return box.innerHTML;
  };
  C.ar3Action('r31-app-rules-tab',async node=>{
    if(C.state.appRulesTab===node.dataset.tab)return;
    if(g6Dirty&&C.state.appRulesTab==='mealReward'&&node.dataset.tab!=='mealReward'){
      if(!await G6.confirm('离开未保存的奖励设置',['当前修改尚未保存，离开将放弃这些修改。']))return;g6Dirty=false;
    }
    C.state.appRulesTab=node.dataset.tab;C.renderApp();
  });
  for(const type of ['input','change'])document.addEventListener(type,event=>{if(event.target.closest('.r36-meal-settings'))g6Dirty=true;});
  document.addEventListener('click',event=>{if(event.target.closest('[data-action="r36-meal-select-all"],[data-action="r36-meal-clear-all"]'))g6Dirty=true;});
  function syncBrand(brandId){
    const box=document.querySelector('.r36-meal-tree');
    if(!box)return;
    const parent=box.querySelector('[data-r36-brand="'+CSS.escape(brandId)+'"]'),items=[...box.querySelectorAll('[data-r36-package][data-brand="'+CSS.escape(brandId)+'"]')];
    const checked=items.filter(item=>item.checked).length;
    parent.checked=items.length>0&&checked===items.length;
    parent.indeterminate=checked>0&&checked<items.length;
    const details=parent.closest('.r36-brand-tree');if(details)details.querySelector('summary em').textContent=checked+' / '+items.length+' 个套餐';
  }
  function syncAll(){document.querySelectorAll('[data-r36-brand]').forEach(input=>syncBrand(input.dataset.r36Brand));}
  C.ar3Action('r36-meal-select-all',()=>{document.querySelectorAll('[data-r36-package]').forEach(input=>input.checked=true);syncAll();});
  C.ar3Action('r36-meal-clear-all',()=>{document.querySelectorAll('[data-r36-package]').forEach(input=>input.checked=false);syncAll();});
  C.ar3Action('r36-save-meal-rules',async()=>{
    const rewardRules={};for(const key of ['couponClaimDays','mealClaimDays']){const raw=document.querySelector('[data-r36-claim="'+key+'"]').value;const value=Number(raw);if(!raw||!Number.isInteger(value)||value<1||value>365)throw Error('奖励领取期限须为1至365天的整数');rewardRules[key]=value;}
    const days=Number(document.querySelector('[data-r36-meal-days]')?.value);
    if(!Number.isInteger(days)||days<1||days>365)throw Error('领取后赠餐有效天数须为1至365的整数');
    const eligiblePackages={};
    for(const brand of S().brands||[]){
      eligiblePackages[brand.id]=[...document.querySelectorAll('[data-r36-package][data-brand="'+CSS.escape(brand.id)+'"]:checked')].map(input=>input.value);
    }
    await window.R3.cmd('ADMIN_SAVE_APP_RULES',{appRules:{...appRules(),rewardRules,mealRewardRules:{validityDays:days,eligiblePackages}}});
    C.renderApp();
    window.__g7UI?.toast?.('奖励设置已保存','新奖励采用领取期限，新领取赠餐采用使用规则');
  });
  document.addEventListener('change',event=>{
    const brand=event.target.closest('[data-r36-brand]');
    if(brand){document.querySelectorAll('[data-r36-package][data-brand="'+CSS.escape(brand.dataset.r36Brand)+'"]').forEach(input=>input.checked=brand.checked);syncBrand(brand.dataset.r36Brand);return;}
    const item=event.target.closest('[data-r36-package]');if(item)syncBrand(item.dataset.brand);
  });
  const renderBase=C.renderApp;
  C.renderApp=function(){const result=renderBase.apply(this,arguments);if(C.state.page==='app-rules'&&C.state.appRulesTab==='mealReward')syncAll();return result;};
  window.R36Admin={tabs,treeMarkup,mealPage,statusMarkup:(record)=>window.R36Rewards.statuses(record,S(),Date.parse(S().now)||Date.now()).map(C.badge).join('')};
})();
