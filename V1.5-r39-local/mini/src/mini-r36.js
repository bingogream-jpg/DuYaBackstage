// V1.5-r36 reward inbox, meal credits, reward reminder and meal-enhanced checkout.
(()=>{
  const me=()=>r3Me();
  const ui=()=>{
    r3UI.r36=r3UI.r36||{};
    return r3UI.r36;
  };
  const map=key=>{
    ui()[key]=ui()[key]||{};
    return ui()[key];
  };
  const rewardTime=event=>Date.parse(event?.time||event?.issuedAt||event?.claimedAt||0)||0;
  const latestTime=owner=>Math.max(0,...(owner?.rewards||[]).map(rewardTime));
  const rewardReadMap=()=>map('rewardReadAtByUser');
  const popupReadMap=()=>map('rewardPopupReadAtByUser');
  const rewardReadIds=()=>map('rewardReadIdsByUser');
  const popupSeenIds=()=>map('rewardPopupSeenIdsByUser');
  const unreadItems=owner=>(owner?.rewards||[]).filter(event=>!(rewardReadIds()[owner.id]||[]).includes(event.id));
  const popupItems=owner=>(owner?.rewards||[]).filter(event=>!(popupSeenIds()[owner.id]||[]).includes(event.id));
  const rewardUnread=owner=>unreadItems(owner).length>0;
  function markRewardsRead(owner=me()){
    if(!owner)return;
    rewardReadMap()[owner.id]=new Date(latestTime(owner)||Date.now()).toISOString();
    rewardReadIds()[owner.id]=(owner.rewards||[]).map(event=>event.id);
    try{r3SaveDraft();}catch{}
  }
  function markPopupRead(owner=me()){
    if(!owner)return;
    popupReadMap()[owner.id]=new Date(latestTime(owner)||Date.now()).toISOString();
    popupSeenIds()[owner.id]=(owner.rewards||[]).map(event=>event.id);
    try{r3SaveDraft();}catch{}
  }
  const initialized=new Set();
  function initializeSeen(owner=me()){
    if(!owner||initialized.has(owner.id))return;
    initialized.add(owner.id);
    if(owner.id==='REWARD')return;
    if(!popupReadMap()[owner.id]){
      const latest=latestTime(owner);
      if(latest){
        popupReadMap()[owner.id]=new Date(latest).toISOString();
        rewardReadMap()[owner.id]=new Date(latest).toISOString();
        popupSeenIds()[owner.id]=(owner.rewards||[]).map(event=>event.id);
        rewardReadIds()[owner.id]=(owner.rewards||[]).map(event=>event.id);
        try{r3SaveDraft();}catch{}
      }
    }
  }
  const statuses=event=>window.R36Rewards?.statuses?.(event,r3.state,r3.state?.now?Date.parse(r3.state.now):Date.now())||[];
  function claimed(event){return event?.claimedAt||['已领取'].includes(event?.status)||Boolean(event?.walletId||event?.mealCreditId);}
  const statusMarkup=event=>'<div class="r36-reward-status">'+statuses(event).map(label=>'<span class="'+({未领取:'wait',已领取:'claimed',未使用:'unused',已过期:'expired',已发放:'issued',未发放:'unissued'}[label]||'')+'">'+esc(label)+'</span>').join('')+'</div>';
  const rewardTitle=event=>event?.name||({coupon:'优惠券奖励',meal:'赠餐奖励',custom:'自定义奖励'}[event?.type]||'奖励');
  const rewardSource=event=>event?.source||'活动奖励';
  const rewardType=event=>({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[event?.type]||'奖励');
  const sortedRewards=()=>(me()?.rewards||[]).slice().sort((a,b)=>rewardTime(b)-rewardTime(a));
  const ruleText=credit=>{
    const entries=Object.entries(credit?.eligiblePackages||{}).map(([brandId,ids])=>({brandId,ids:(ids||[]).filter(Boolean)})).filter(item=>item.ids.length);
    if(!entries.length)return '暂无适用套餐';
    const brands=r3.state.brands||[],packages=r3.state.packages||[];
    return entries.map(item=>{
      const brand=brands.find(entry=>entry.id===item.brandId)?.name||item.brandId;
      const names=item.ids.map(id=>packages.find(entry=>entry.id===id)?.name||id);
      return brand+'：'+names.join('、');
    }).join('；');
  };
  const activeCredits=()=> (me()?.mealCredits||[]).filter(credit=>Number(credit.remaining)>0&&credit.expiresAt>=r3Date());

  function pendingRewards(owner=me()){
    return popupItems(owner).sort((a,b)=>rewardTime(b)-rewardTime(a));
  }
  function showRewardPopup(){
    if(state.route!=='home'||document.querySelector('#r36-reward-popup'))return;
    const owner=me(),newRewards=pendingRewards(owner);
    if(!newRewards.length){markPopupRead(owner);return;}
    const box=document.createElement('div');
    box.id='r36-reward-popup';
    box.className='r36-reward-popup';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.innerHTML='<section class="r36-reward-popup-card r36n-popup"><button type="button" class="r36n-popup-close" data-r36-popup-close aria-label="关闭">×</button><header class="r36n-popup-hero"><h2>有新的奖励<br>等你来<span>领取</span>！</h2><p>快来看看吧～</p><img src="assets-r36-refine/gift.png" alt="" aria-hidden="true"></header><section class="r36n-popup-preview"><h3>奖励预览 <small>'+newRewards.length+' 项</small></h3><div class="r36-popup-list">'+newRewards.map(event=>'<article><i>'+I(event.type==='meal'?'meal':'gift')+'</i><span><b>'+esc(rewardTitle(event))+'</b><small>'+esc(rewardType(event))+' · '+esc(statuses(event).join(' · '))+'</small><small>'+esc(event.claimExpiresAt?'请于 '+new Date(event.claimExpiresAt).toLocaleString('zh-CN')+' 前领取':event.type==='custom'?'线下奖励以后台发放状态为准':'领取后开始计算使用有效期')+'</small></span></article>').join('')+'</div><p class="r36n-popup-note">领取期限以每项奖励为准，可前往“我的—奖励记录”查看。</p><footer><button type="button" data-r36-popup-later>稍后</button><button type="button" data-r36-popup-open>去领取</button></footer></section></section><span class="r36n-dismiss-note">点击空白处关闭</span>';
    document.body.append(box);
    const close=open=>{
      markPopupRead(owner);
      if(open){ui().rewardTab='未领取';markRewardsRead(owner);box.remove();go('rewardRecords');}
      else box.remove();
    };
    box.querySelector('[data-r36-popup-close]').onclick=()=>close(false);
    box.querySelector('[data-r36-popup-later]').onclick=()=>close(false);
    box.querySelector('[data-r36-popup-open]').onclick=()=>close(true);
    box.addEventListener('click',event=>{if(event.target===box)close(false);});
  }
  const profileBase=SCREENS.profile.render;
  function decorateProfile(){
    if(!me())return;
    const box=document.createElement('div');
    box.innerHTML=profileBase();
    const coupon=box.querySelector('.quick-item[data-key="coupon"] span');
    if(coupon)coupon.textContent='优惠券/赠餐';
    const grid=box.querySelector('.profile-grid');
    if(grid&&!grid.querySelector('[data-key="rewardRecord"]')){
      grid.insertAdjacentHTML('beforeend','<button class="quick-item r36-reward-quick" data-act="profile-quick" data-key="rewardRecord"><i class="quick-icon">'+I('gift')+(rewardUnread(me())?'<em class="r36-red-dot" aria-label="有新奖励"></em>':'')+'</i><span>奖励记录</span></button><button class="quick-item" data-act="profile-quick" data-key="checkinActivities"><i class="quick-icon">'+I('calendar')+'</i><span>活动列表</span></button>');
    }
    return box.innerHTML;
  }

  function rewardMatches(event,tab){
    if(event.type==='custom')return tab===(event.status==='已发放'?'已领取':'未领取');
    if(tab==='已领取')return Boolean(claimed(event));
    if(tab==='未领取')return !claimed(event)&&!statuses(event).some(s=>s.includes('过期'))&&!event.revokedAt;
    return !event.revokedAt&&statuses(event).some(s=>s.includes('过期'));
  }
  r3Act('r36-reward-tab',node=>{ui().rewardTab=node.dataset.tab;render();});
  function rewardsPage(){
    const owner=me(),all=sortedRewards().filter(e=>!e.revokedAt),tab=['未领取','已领取','已过期'].includes(ui().rewardTab)?ui().rewardTab:'未领取',rewards=all.filter(event=>rewardMatches(event,tab));
    markRewardsRead(owner);
    return '<div class="v15-page r36-rewards-page"><header class="r36-page-head"><small>REWARD CENTER</small><h1>奖励记录</h1><p>优惠券、赠餐和自定义奖励统一查看</p></header><nav class="r36v-reward-tabs" aria-label="奖励分类">'+['未领取','已领取','已过期'].map(value=>'<button data-act="r36-reward-tab" data-tab="'+value+'" class="'+(tab===value?'on':'')+'" aria-pressed="'+(tab===value)+'">'+value+' <b>'+all.filter(event=>rewardMatches(event,value)).length+'</b></button>').join('')+'</nav><div class="r36-reward-list">'+(rewards.length?rewards.map(event=>{
      const labels=statuses(event),canClaim=['coupon','meal'].includes(event.type)&&!claimed(event)&&!labels.some(s=>s.includes('过期'))&&!event.revokedAt,unused=labels.includes('已领取未使用');
      return '<article class="r36-reward-card" data-reward-id="'+esc(event.id)+'"><header><span>'+esc(rewardType(event))+'</span>'+statusMarkup(event)+'</header><h2>'+esc(rewardTitle(event))+'</h2><p>'+esc(rewardSource(event))+'</p><footer><span>'+esc(new Date(rewardTime(event)||Date.now()).toLocaleDateString('zh-CN'))+'</span>'+(canClaim?'<button data-act="r36-claim-reward" data-id="'+esc(event.id)+'">立即领取</button>':unused?'<button data-act="r36-use-reward" data-type="'+esc(event.type)+'">去使用</button>':'<small>'+esc(event.reason||'')+'</small>')+'</footer>'+(event.image?'<img src="'+esc(window.__offlineAsset(event.image))+'" alt="奖励图片">':'')+'</article>';
    }).join(''):'<div class="r36-empty">'+I('gift')+'<b>暂无'+(tab==='全部'?'':esc(tab))+'奖励</b><p>完成活动后，奖励会显示在这里。</p></div>')+'</div></div>';
  }
  r3Act('r36-claim-reward',async node=>{
    await r3.cmd('REWARD_CLAIM',{rewardId:node.dataset.id});
    markRewardsRead();
    render();
    toast('奖励已领取');
  });
  r3Act('r36-use-reward',node=>{
    if(node.dataset.type==='meal'){V15().assetTab='meals';go('coupons');return;}
    V15().assetTab='coupons';V15().couponTab='可用';go('coupons');
  });
  SCREENS.rewardRecords={...SCREENS.inviteRewards,title:'奖励记录',noTab:true,render:rewardsPage};
  SCREENS.inviteRewards={...SCREENS.inviteRewards,title:'奖励记录',render:rewardsPage};
  const oldOpenRewards=ACTIONS['r27-open-rewards'];
  ACTIONS['r27-open-rewards']=()=>{ui().rewardTab='未领取';markRewardsRead();go('rewardRecords');};
  window.R27Mini.rewardUnread=()=>rewardUnread(me());
  window.R27Mini.markRewardsRead=()=>markRewardsRead(me());

  function couponsPage(){
    const tab=V15().assetTab||'coupons';
    const couponTab=V15().couponTab||'可用',coupons=V15().coupons||[],couponList=coupons.filter(item=>item.status===couponTab).sort((a,b)=>String(a.expire).localeCompare(String(b.expire)));
    const credits=me()?.mealCredits||[],active=activeCredits(),available=active.reduce((sum,credit)=>sum+Number(credit.remaining||0),0);
    return '<div class="v15-page r36-assets-page"><header class="r36-page-head"><small>MY BENEFITS</small><h1>优惠券/赠餐</h1><p>优惠与赠餐，都在这里管理</p></header><div class="r36-asset-tabs"><button class="'+(tab==='coupons'?'on':'')+'" data-act="r36-asset-tab" data-tab="coupons">优惠券 <b>'+coupons.filter(item=>item.status==='可用').length+'</b></button><button class="'+(tab==='meals'?'on':'')+'" data-act="r36-asset-tab" data-tab="meals">赠餐 <b>'+available+'</b></button></div>'+
      (tab==='coupons'?'<div class="r33m-coupon-tabs r36-coupon-status">'+['可用','已使用','已过期'].map(value=>'<button class="'+(value===couponTab?'on':'')+'" data-act="v15-coupon-tab" data-tab="'+value+'">'+value+' <b>'+coupons.filter(item=>item.status===value).length+'</b></button>').join('')+'</div><div class="r33m-coupon-list">'+(couponList.length?couponList.map(coupon=>'<article class="r33m-ticket '+(coupon.status!=='可用'?'muted':'')+'" data-act="v15-coupon-detail" data-id="'+esc(coupon.id)+'"><div class="r33m-ticket-value"><small>¥</small><b style="font-size:'+Math.min(33,94/String(v15Num(coupon.amount)).length)+'px">'+v15Num(coupon.amount)+'</b><span>'+(coupon.threshold?'满 '+v15Num(coupon.threshold)+' 元可用':'无门槛')+'</span></div><div class="r33m-ticket-info"><header><h2>'+esc(coupon.name)+'</h2><em>'+esc(coupon.status)+'</em></header><p>'+esc(coupon.brands||'全部品牌')+'</p><footer><span><i>◷</i> 有效期至 '+esc(coupon.expire||'—')+'</span><button data-act="v25-coupon-use" data-id="'+esc(coupon.id)+'" '+(coupon.status==='可用'?'':'disabled')+'>'+(coupon.status==='可用'?'去使用 ›':'不可用')+'</button></footer></div></article>').join(''):'<div class="r33m-empty"><b>暂无'+esc(couponTab)+'优惠券</b><p>参与活动后，奖励会出现在这里。</p></div>')+'</div>'
      :'<div class="r36-meal-summary"><span>可用赠餐</span><b>'+available+'<small>份</small></b><p>使用赠餐会增加套餐餐数，不抵扣现金</p></div><div class="r36-meal-list">'+(credits.length?credits.map(credit=>{const expired=credit.expiresAt<r3Date(),remaining=Number(credit.remaining)||0;return '<article class="r36-meal-card '+(expired?'expired':'')+'"><header><span>'+esc(credit.source||'赠餐奖励')+'</span><em>'+(expired?'已过期':remaining>0?'未使用':'已领取')+'</em></header><div class="r36-meal-count"><b>'+remaining+'</b><small>剩余份数</small><span>共 '+credit.total+' 份</span></div><dl><div><dt>有效期</dt><dd>'+esc(credit.expiresAt||'—')+'</dd></div><div><dt>使用规则</dt><dd>'+esc(ruleText(credit))+'</dd></div></dl>'+(remaining>0&&!expired?'<button data-act="r36-use-reward" data-type="meal">去使用 ›</button>':'')+'</article>';}).join(''):'<div class="r36-empty">'+I('meal')+'<b>暂无赠餐</b><p>领取赠餐奖励后会显示在这里。</p></div>')+'</div>')+'</div>';
  }
  r3Act('r36-asset-tab',node=>{V15().assetTab=node.dataset.tab;render();});
  SCREENS.coupons={...SCREENS.coupons,title:'优惠券/赠餐',render:couponsPage};

  const quickBase=ACTIONS['profile-quick'];
  ACTIONS['profile-quick']=node=>{
    const key=node?.dataset?.key;
    if(key==='rewardRecord'){ui().rewardTab='未领取';markRewardsRead();go('rewardRecords');return;}
    if(key==='checkinActivities'){go('checkinActivities');return;}
    if(key==='coupon'){V15().assetTab='coupons';go('coupons');return;}
    return quickBase(node);
  };
  SCREENS.profile.render=decorateProfile;

  const homeBase=SCREENS.home.render;
  SCREENS.home.render=function(){initializeSeen();const html=homeBase();setTimeout(showRewardPopup,60);return html;};
  r3.on(()=>initializeSeen());

  const foodBase=SCREENS.dietSearch.render;
  SCREENS.dietSearch.render=function(){
    const box=document.createElement('div');box.innerHTML=foodBase();
    box.querySelectorAll('.r27-food-card').forEach(card=>{card.classList.add('r36-no-food-image');card.querySelectorAll('.r27-food-image').forEach(image=>image.remove());});
    return box.innerHTML;
  };

  function checkoutContext(){
    if(!state.checkout)return null;
    const pkg=shopPackage(state.checkout.packageId);
    if(!pkg)return null;
    const credits=window.R36MealRules.availableCredits(me(),state.checkout.brandId,pkg.id,Date.parse(r3.state.now||Date.now()));
    return {checkout:state.checkout,pkg,credits,available:credits.reduce((sum,credit)=>sum+Number(credit.remaining||0),0)};
  }
  function clampMealCount(context=checkoutContext()){
    const current=Math.max(0,Number(ui().checkoutMealCount)||0);
    const next=Math.min(current,context?.available||0);
    ui().checkoutMealCount=next;
    return next;
  }
  function mealPicker(){
    const context=checkoutContext();if(!context)return;
    const count=context.available,credits=context.credits;
    bottomSheet('选择赠餐','<div class="r36-meal-picker"><label><span>本次使用</span><input id="r36-checkout-meal-count" type="number" min="0" max="'+context.available+'" step="1" value="'+count+'"><em>份</em></label><p>赠餐会增加套餐餐数，不抵扣现金价格。</p><div class="r36-meal-picker-list">'+(credits.length?credits.map(credit=>'<article><b>'+esc(credit.source||'赠餐奖励')+'</b><small>剩余 '+credit.remaining+' 份 · '+esc(credit.expiresAt)+'</small><span>'+esc(ruleText(credit))+'</span></article>').join(''):'<p class="r3-empty">当前套餐没有可用赠餐</p>')+'</div><button class="v25-primary wide" data-act="r36-meal-save" '+(context.available?'':'disabled')+'>确认使用</button></div>',{dismissible:true});
  }
  r3Act('r36-meal-open',()=>mealPicker());
  r3Act('r36-meal-save',()=>{
    const context=checkoutContext();if(!context)return;
    const value=Number(document.querySelector('#r36-checkout-meal-count')?.value);
    if(!Number.isInteger(value)||value<0||value>context.available)throw Error('请输入有效的赠餐份数');
    ui().checkoutMealCount=value;closeAllLayers();openShopPackages();
  });
  const packagesBase=openShopPackages;
  openShopPackages=function(){
    packagesBase();
    const body=document.querySelector('.shop-package-sheet .sheet-body'),context=checkoutContext();
    if(!body||!context)return;
    if(ui().checkoutMealToken!==context.checkout.token){ui().checkoutMealToken=context.checkout.token;ui().checkoutMealCount=0;}
    const count=clampMealCount(context),coupon=window.R26Coupons?.selected?.()||[],off=Math.min(context.pkg.price-0.01,coupon.reduce((sum,item)=>sum+Number(item.amount||0),0));
    const couponRow=body.querySelector('.v15-checkout-coupon button');
    if(couponRow)couponRow.textContent=coupon.length?coupon[0].name+'（－¥'+v15Num(off)+'） ›':'不使用优惠券 ›';
    const total=body.querySelector('.v15-checkout-total b');if(total)total.textContent='¥'+v15Num(Math.max(0.01,context.pkg.price-off),2);
    body.querySelector('.v36-checkout-meal')?.remove();
    const row=document.createElement('div');row.className='v36-checkout-meal';
    row.innerHTML='<span>赠餐</span><button data-act="r36-meal-open" '+(context.available?'':'disabled')+'>'+(context.available?(count?'已选 '+count+' 份':'可用 '+context.available+' 份')+' ›':'本套餐不可用')+'</button>';
    const anchor=body.querySelector('.v15-checkout-coupon');anchor?.after(row);
    const note=body.querySelector('.v15-note');if(note)note.textContent='优惠券用于抵扣现金；赠餐用于增加套餐餐数，二者可同时使用。';
  };
  const payBase=openShopPay;
  openShopPay=function(){
    payBase();
    const context=checkoutContext(),count=clampMealCount(context),amount=document.querySelector('.shop-pay-amount');
    if(context&&count&&amount&&!amount.querySelector('.r36-pay-meal')){
      amount.insertAdjacentHTML('beforeend','<small class="r36-pay-meal">赠送 '+count+' 餐</small>');
    }
  };
  const orderSuccessBase=SCREENS.orderSuccess.render;
  SCREENS.orderSuccess.render=function(){
    const box=document.createElement('div');box.innerHTML=orderSuccessBase();
    const order=shopOrder(),label=box.querySelector('.shop-result-package p');
    if(order?.giftMeals&&label&&!label.querySelector('.r36-gift-note'))label.insertAdjacentHTML('beforeend','<small class="r36-gift-note">含赠餐 '+order.giftMeals+' 餐</small>');
    return box.innerHTML;
  };

  window.R36Mini={
    rewardUnread:()=>rewardUnread(me()),
    markRewardsRead,
    pendingRewards,
    showRewardPopup,
    statuses,
    activeCredits,
    checkoutMealCount:()=>clampMealCount(),
    resetCheckoutMeal:()=>{ui().checkoutMealCount=0;}
  };
})();
