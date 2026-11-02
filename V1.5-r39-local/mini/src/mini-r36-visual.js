// Presentation-only refresh for the five approved r36 screens.
(()=>{
  const art=(name,cls='')=>'<img class="r36v-art '+cls+'" src="'+esc(window.__offlineAsset('assets-r36-visual/'+name+'.png'))+'" alt="" aria-hidden="true">';
  const wrap=(route,decorate)=>{const base=SCREENS[route].render;SCREENS[route].navStyle={...SCREENS[route].navStyle,bg:'#f5f8e9',ink:'#263c26'};SCREENS[route].render=function(){const box=document.createElement('div');box.innerHTML=base();decorate(box);return box.innerHTML;};};
  wrap('coupons',box=>{
    box.firstElementChild.classList.add('r36v-assets');
    box.querySelector('.r36-page-head').insertAdjacentHTML('beforeend',art('coupon','r36v-coupon-art'));
    box.querySelectorAll('.r36-meal-card').forEach(card=>{
      card.insertAdjacentHTML('afterbegin',art('reward-meal','r36v-meal-art'));
      const expired=card.classList.contains('expired'),count=Number(card.querySelector('.r36-meal-count b')?.textContent||0);
      if(!expired&&count===0)card.querySelector('header em').textContent='已用完';
    });
  });
  wrap('dietHome',box=>{
    box.firstElementChild.classList.add('r36v-record');
    box.querySelectorAll('.r25-record-food .r25-food-image,.r25-record-food .r25-food-placeholder').forEach(n=>n.remove());
    box.querySelector('.r25-calorie-ring')?.insertAdjacentHTML('beforeend',art('intake','r36v-intake-art'));
    box.querySelectorAll('.r25-record-meal').forEach((meal,index)=>{
      meal.querySelector('header>div').insertAdjacentHTML('afterbegin','<i class="r36v-meal-icon">'+['☀','☼','☾','♧'][index]+'</i>');
      meal.querySelector('.r25-empty-meal')?.insertAdjacentHTML('afterbegin','<span aria-hidden="true">'+I('meal')+'</span>');
    });
  });
  let manualDirty=Boolean(r3UI.dietDraft?.name||r3UI.dietDraft?.grams);
  wrap('dietCustom',box=>{
    const page=box.firstElementChild;page.classList.add('r36v-manual');
    const head=box.querySelector('.r25-page-title'),meal=V15().dietDraft?.meal||r3UI.r25?.flow?.meal||'午餐';
    head.querySelector('p').innerHTML='添加到 <select data-r36v-meal aria-label="餐次">'+['早餐','午餐','晚餐','加餐'].map(m=>'<option '+(m===meal?'selected':'')+'>'+m+'</option>').join('')+'</select>';
    head.insertAdjacentHTML('beforeend',art('manual','r36v-manual-art'));
    box.querySelectorAll('.r25-manual-form label').forEach((label,index)=>{
      label.insertAdjacentHTML('afterbegin','<i class="r36v-field-icon tone-'+index+'">'+art('field-'+index)+'</i>');
      const input=label.querySelector('input');input.placeholder='输入'+label.querySelector('span').textContent;
      if(input.type==='number'){input.min=index===1?'0.1':'0';input.step='0.1';input.inputMode='decimal';}
    });
    box.querySelector('.r25-portion-actions').insertAdjacentHTML('beforebegin','<aside class="r36v-tip"><b>☀ 小贴士</b><span>填写越详细，营养记录越准确哦～</span></aside>');
  });
  document.addEventListener('input',e=>{
    const key=e.target.dataset.r25Manual;if(!key||state.route!=='dietCustom')return;
    V15().dietDraft={...(V15().dietDraft||{}),[key]:e.target.value};r3UI.dietDraft={...V15().dietDraft};manualDirty=true;r3SaveDraft();
  });
  document.addEventListener('change',e=>{
    if(!e.target.hasAttribute('data-r36v-meal'))return;
    V15().dietDraft={...(V15().dietDraft||{}),meal:e.target.value};r3UI.r25.flow.meal=e.target.value;r3UI.dietDraft={...V15().dietDraft};manualDirty=true;r3SaveDraft();
  });
  const back=ACTIONS.back;
  ACTIONS.back=async node=>{
    if(state.route==='dietCustom')manualDirty=false;
    return back(node);
  };
  for(const action of ['r25-manual-finish','r25-manual-continue']){const original=ACTIONS[action];ACTIONS[action]=async node=>{const result=await original(node);if(state.route!=='dietCustom')manualDirty=false;return result;};}
  wrap('dietSearch',box=>{
    box.firstElementChild.classList.add('r36v-food');
    const search=box.querySelector('.r27-food-search'),head=box.querySelector('.r27-food-head');
    if(search&&head){head.before(search);head.remove();}
    box.querySelectorAll('.r27-food-main').forEach(n=>n.insertAdjacentHTML('beforeend','<span class="r36v-chevron" aria-hidden="true">›</span>'));
  });
  for(const route of ['rewardRecords','inviteRewards'])wrap(route,box=>{
    box.firstElementChild.classList.add('r36v-rewards');
    box.querySelectorAll('.r36-reward-card').forEach(card=>{
      const event=r3Me()?.rewards?.find(e=>e.id===card.dataset.rewardId);
      card.insertAdjacentHTML('afterbegin',art('reward-'+(event?.type==='meal'?'meal':event?.type==='custom'?'custom':'coupon'),'r36v-reward-art'));
    });
  });
})();
