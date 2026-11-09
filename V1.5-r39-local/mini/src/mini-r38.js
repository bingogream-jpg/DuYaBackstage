// r38 asset counters, flat portion meals and final mini-page presentation.
(()=>{
 const state=()=>window.R3?.state,me=()=>state()?.me;
 const today=()=>typeof r3Date==='function'?r3Date():window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(state()?.now||Date.now()));
 const visual=(path,cls='')=>'<img class="'+cls+'" alt="" src="'+esc(window.__offlineAsset(path))+'">';
 const couponStatus=coupon=>{
  if(coupon.status==='已使用')return '已使用';
  if(coupon.status==='已过期'||coupon.expire&&coupon.expire<today())return '已过期';
  if(coupon.status==='可用')return '可用';
  return coupon.status||'可用';
 };
 const mealUsage=credit=>{
  const owner=me();
  const fromOrders=(owner?.orders||[]).flatMap(order=>order.mealUses||[]).filter(use=>use.creditId===credit.id).reduce((sum,use)=>sum+Number(use.count||0),0);
  const used=Math.max(fromOrders,Number(credit.total||0)-Number(credit.remaining||0));
  const expired=String(credit.expiresAt||'')<today();
  const category=expired?'已过期':Number(credit.remaining||0)>0?'可用':'已使用';
  return {category,remaining:Number(credit.remaining||0),used:Math.max(0,used),expiredLost:expired?Math.max(0,Number(credit.remaining||0)):0};
 };
 function decorateAssets(){
  const root=document.querySelector('#stage .r36-assets-page');if(!root)return;
  const coupons=(typeof V15==='function'?V15().coupons:[])||[],top=[...root.querySelectorAll('.r36-asset-tabs>button')];
  const couponTabHTML='优惠券 <b>'+coupons.length+'</b>';
  if(top[0]&&top[0].innerHTML!==couponTabHTML)top[0].innerHTML=couponTabHTML;
  const credits=me()?.mealCredits||[];const usage=credits.map(mealUsage);
  const mealCounts={可用:usage.filter(item=>item.category==='可用').reduce((sum,item)=>sum+item.remaining,0),已使用:usage.filter(item=>item.category==='已使用').reduce((sum,item)=>sum+item.used,0),已过期:usage.filter(item=>item.category==='已过期').reduce((sum,item)=>sum+item.expiredLost,0)};
  const mealTabHTML='赠餐 <b>'+mealCounts.可用+'</b>';
  if(top[1]&&top[1].innerHTML!==mealTabHTML)top[1].innerHTML=mealTabHTML;
  root.querySelectorAll('.r33m-ticket[data-id]').forEach(card=>{
   delete card.dataset.act;card.setAttribute('role','group');
   const wallet=(me()?.wallet||[]).find(item=>item.id===card.dataset.id),status=couponStatus(wallet||{});
   const label=card.querySelector('header em');if(label&&label.textContent!==status)label.textContent=status;
  });
  root.querySelectorAll('.r33m-coupon-tabs button').forEach(button=>{
   const value=button.dataset.tab;
   const next=value+' <b>'+coupons.filter(coupon=>couponStatus(coupon)===value).length+'</b>';
   if(button.innerHTML!==next)button.innerHTML=next;
  });
  const list=root.querySelector('.r36-meal-list');if(!list)return;
  root.querySelector('.r37f-empty')?.remove();
  let nav=root.querySelector('.r37f-meal-tabs');
  if(!nav){nav=document.createElement('nav');nav.className='r33m-coupon-tabs r37f-meal-tabs';list.before(nav);}
  const active=nav.querySelector('button.on')?.dataset.meal37Tab||'可用';
  const navHTML=['可用','已使用','已过期'].map(value=>'<button type="button" data-meal37-tab="'+value+'" class="'+(value===active?'on':'')+'">'+value+' <b>'+mealCounts[value]+'</b></button>').join('');
  if(nav.innerHTML!==navHTML)nav.innerHTML=navHTML;
  const cards=[...list.querySelectorAll('.r36-meal-card')];
  cards.forEach((card,index)=>{
   const item=usage[index];if(!item)return;
   card.dataset.mealState=item.category;card.hidden=item.category!==active;
  });
  if(!cards.some((card,index)=>usage[index]?.category===active)){
   const empty=document.createElement('p');empty.className='r37f-empty';empty.textContent='暂无'+active+'赠餐';list.append(empty);
  }
 }
 function decoratePortion(){
  const page=document.querySelector('#stage .r37p-page');if(!page)return;
  page.querySelector('.r36p-food>p')?.remove();
  const select=page.querySelector('[data-p36="meal"]');if(!select||select.dataset.r38Meals)return;
  const time=select.closest('.r36p-time'),mealField=select.closest('label');if(!time||!mealField)return;
  select.dataset.r38Meals='yes';select.hidden=true;
  const box=document.createElement('div');box.className='r38-meal-options';box.setAttribute('role','radiogroup');box.setAttribute('aria-label','餐次');
  box.innerHTML=['早餐','午餐','晚餐','加餐'].map(value=>'<button type="button" role="radio" data-r38-meal="'+value+'" class="'+(value===select.value?'on':'')+'" aria-checked="'+(value===select.value)+'">'+value+'</button>').join('');
  time.classList.add('r38-time-row');mealField.classList.add('r38-meal-row');mealField.append(box);time.after(mealField);
 }
 function decorateSearch(){
  const button=document.querySelector('#stage .r27-food-search button[data-act="v15-search"]');
  if(button)button.setAttribute('aria-label','搜索食物');
 }

 // Pure presentation over the current route DOM; no writes to business state.
 function decorateVisual(){
  document.querySelectorAll('.r37h-intake .r29-target-entry>span').forEach(n=>n.remove());
  const list=document.querySelector('#stage .r37-activity-list');
  if(list){
   list.classList.add('r38v-activities');
   list.querySelectorAll('.r37c-activity-tabs button').forEach(button=>{
    if(button.querySelector('.r38v-tab-icon'))return;
    const icon=document.createElement('i');icon.className='r38v-tab-icon';icon.textContent=button.textContent==='全部'?'▦':button.textContent.includes('邀请')?'♧':'☑';button.prepend(icon);
   });
   list.querySelectorAll('.r37-activity-card').forEach(card=>{
    if(card.dataset.r38Visual)return;card.dataset.r38Visual='yes';
    const title=card.querySelector('h2'),row=window.R37Mini?.query?.().find(item=>item.activity.id===card.dataset.id),activity=row?.activity,fallback=card.querySelector('.r37f-card-badges>span')?.textContent.includes('打卡')?'assets-r38-visual/activity-checkin.png':'assets-r38-visual/activity-invite.png',image=document.createElement('img');
    image.className='r38v-activity-photo';image.alt=activity?.name||'活动图片';image.dataset.fallback=window.__offlineAsset(fallback);image.src=activity?.image||image.dataset.fallback;image.onerror=()=>{image.onerror=null;image.src=image.dataset.fallback};title?.before(image);
    const icons=['calendar','condition','reward','people'];
    card.querySelectorAll('.r37f-activity-grid>div').forEach((row,i)=>{const dt=row.querySelector('dt');if(dt)dt.textContent=dt.textContent.replace(/^[^\u4e00-\u9fff]+/,'');row.insertAdjacentHTML('afterbegin',visual('assets-r38-visual/icon-'+icons[i]+'.png','r38v-field-icon'));});
   });
  }
  const detail=document.querySelector('#stage .r37-activity-detail');
  if(detail&&!detail.dataset.r38Visual){
   detail.dataset.r38Visual='yes';detail.classList.add('r38v-detail');
   const header=detail.querySelector(':scope>header'),row=window.R37Mini?.query?.().find(item=>item.activity.id===window.R37CommentsMini?.activityId),image=document.createElement('img');
   image.className='r38v-detail-art';image.alt=row?.activity?.name||'活动图片';image.dataset.fallback=window.__offlineAsset('assets-r38-visual/activity-hero.png');image.src=row?.activity?.image||image.dataset.fallback;image.onerror=()=>{image.onerror=null;image.src=image.dataset.fallback};header?.append(image);
   const sections=[...detail.querySelectorAll('.r37c-detail-info')],first=sections[0];
   sections.slice(1).forEach(section=>{while(section.firstChild)first.append(section.firstChild);section.remove();});
   const icons={'活动简介':'intro','活动时间':'calendar','达标条件':'condition','参与进度':'progress','奖励内容':'reward','获奖人数':'people'};
   first?.querySelectorAll(':scope>div').forEach(row=>{const key=row.querySelector('span')?.textContent;row.insertAdjacentHTML('afterbegin',visual('assets-r38-visual/icon-'+(icons[key]||'intro')+'.png','r38v-detail-icon'));});
  }
  const water=document.querySelector('#stage .r37f-water');
  if(water&&!water.dataset.r38Visual){water.dataset.r38Visual='yes';
   const glass=water.querySelector('.r37f-glass');if(glass)glass.innerHTML=visual('assets-r38-visual/water-glass.png');
   water.querySelectorAll('.r37f-water-history article>span').forEach(n=>n.innerHTML=visual('assets-r38-visual/water-small.png'));
  }
  const assets=document.querySelector('#stage .r36-assets-page');
  if(assets&&!assets.dataset.r38Visual){assets.dataset.r38Visual='yes';assets.classList.add('r38v-assets');
   const header=assets.querySelector('.r36-page-head');if(header){header.insertAdjacentHTML('beforeend',visual('assets-r38-visual/benefits-hero.png','r38v-benefits-art'));}
  }
 }

 function decorate(){
  decorateAssets();decoratePortion();decorateSearch();decorateVisual();
 }
 document.addEventListener('click',event=>{
  const meal=event.target.closest('[data-r38-meal]');
  if(!meal)return;
  event.preventDefault();event.stopImmediatePropagation();
  const select=document.querySelector('[data-p36="meal"]');if(!select)return;
  select.value=meal.dataset.r38Meal;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  meal.parentElement.querySelectorAll('button').forEach(button=>{
   const on=button===meal;button.classList.toggle('on',on);button.setAttribute('aria-checked',String(on));
  });
 },true);
 window.R38Mini={decorate,mealUsage,mealCounts:()=> (me()?.mealCredits||[]).map(mealUsage)};
})();
