// Remaining r37 visual and interaction feedback. Existing page commands remain authoritative.
(()=>{
 const C=window.R37CommentsData,state=()=>window.R37CommentsMini||(window.R37CommentsMini={dietExpanded:false,activityTag:'',activityId:''});
 const S=()=>window.R3?.state,me=()=>S()?.me,route=target=>{const n=document.createElement('button');n.dataset.act='local-invite-go';n.dataset.route=target;document.body.append(n);n.click();n.remove();};
 const esc=window.esc||(value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
 const now=()=>Date.parse(S()?.now||Date.now());
 const dayGap=(from,to)=>Math.ceil((Date.parse(to)-from)/86400000);
 const tags=()=> (S()?.activityTags||[]).filter(tag=>tag.status==='启用');
 const activityRows=()=>window.R37Mini?.query?.()||[];
 const activityTag=id=>S()?.activityTags?.find(tag=>tag.id===id)||null;
 const activityConfig=a=>window.R37Activities?.effective(a,me())||a;
 const activityPeriod=a=>a.validityMode==='always'?'长期':a.start+' 至 '+a.end;
 const rewardText=a=>a.rewardMode==='none'?'不发放':(a.rewardMode==='probability'?'概率奖励：':'')+(a.rewards||[]).map(reward=>reward.type==='coupon'?(S().templates.find(t=>t.id===reward.couponId)?.name||'优惠券'):reward.type==='meal'?'赠餐 '+Number(reward.count||1)+' 餐':reward.name||'自定义奖励').join('、');
 const statusClass=status=>status==='进行中'?'running':status==='未开始'?'pending':status==='已结束'?'ended':'disabled';
 function activityCard(row){
  const a=activityConfig(row.activity),quota=a.rewardMode==='none'?'无获奖名额限制':a.limit?'上限 '+a.limit+' 人':'不限制';
  return '<button class="r36n-activity-card r37-activity-card r37f-activity-card" data-r37c-card="yes" data-act="a37-open" data-id="'+esc(a.id)+'"><div class="r37f-card-badges"><span>'+esc(row.tag?.name||'普通活跃活动')+'</span><span class="r37-status-tag '+statusClass(row.status)+'">'+esc(row.status)+'</span></div><h2>'+esc(a.name)+'</h2><p class="r37f-intro">'+esc(a.intro||a.desc||'暂无简介')+'</p><dl class="r37f-activity-grid"><div><dt>▣ 活动时间</dt><dd>'+esc(activityPeriod(a))+'</dd></div><div><dt>◎ 达标条件</dt><dd>'+esc(window.R37Activities.label(a))+'</dd></div><div><dt>♧ 活动奖励</dt><dd>'+esc(rewardText(a))+'</dd></div><div><dt>♜ 获奖名额</dt><dd>'+esc(quota)+'</dd></div></dl></button>';
 }
 function decorateHome(){
  const panel=document.querySelector('#stage .r29-diet');if(!panel)return;
  const targetEntry=panel.closest('#stage')?.querySelector('.r37h-intake .r29-target-entry');
  if(targetEntry&&!targetEntry.dataset.r37cGoal){targetEntry.dataset.r37cGoal='yes';targetEntry.classList.add('r37c-goal-entry');targetEntry.insertAdjacentHTML('afterbegin','<span>'+esc(me()?.goal||'每日营养目标')+'</span>');}
  const rows=[...panel.querySelectorAll('.r29-diet-rows>button')],expanded=state().dietExpanded;
  rows.forEach((row,index)=>{row.hidden=!expanded&&index>=3;});
  let button=panel.querySelector('[data-r37c-diet-expand]');
  if(rows.length>3){if(!button){button=document.createElement('button');button.type='button';button.dataset.r37cDietExpand='';button.className='r37c-expand';panel.append(button);}button.textContent=expanded?'收起饮食记录':'展开全部 '+rows.length+' 条';}else button?.remove();
 }
 function decorateFood(){
  const root=document.querySelector('#stage .r36v-food');if(root)root.classList.add('r37c-white-food');
 }
 function decoratePortion(){
  const select=document.querySelector('#stage .r37p-unit [data-p36="unit"]');if(!select||select.dataset.r37cUnits)return;
  select.dataset.r37cUnits='yes';select.hidden=true;const options=[...select.options],box=document.createElement('div');box.className='r37c-unit-options';box.innerHTML=options.map(option=>'<button type="button" role="radio" aria-checked="'+(option.selected?'true':'false')+'" class="'+(option.selected?'on':'')+'" data-r37c-unit="'+esc(option.value)+'">'+esc(option.textContent)+'</button>').join('');select.after(box);
 }
 function decorateMeals(){
  const credits=me()?.mealCredits||[];document.querySelectorAll('#stage .r36-meal-card').forEach((card,index)=>{
   const credit=credits[index];if(!credit||card.dataset.r37cMeal)return;card.dataset.r37cMeal='yes';const header=card.querySelector('header>span'),count=card.querySelector('.r36-meal-count'),date=card.querySelector('dl>div:first-child');
   if(header)header.textContent='赠餐数量';
   if(count){const b=count.querySelector('b'),small=count.querySelector('small'),span=count.querySelector('span');if(b)b.innerHTML=Number(credit.remaining||0)+'<i>餐</i>';if(small)small.textContent='可用餐数';if(span)span.textContent='有效期至 '+(credit.expiresAt||'—');}
   date?.remove();
  });
 }
 function decorateInvite(){
  const root=document.querySelector('#stage .r29-page');if(!root)return;root.querySelectorAll('.a37-invite-activities').forEach(node=>node.remove());if(root.querySelector('[data-r37c-invite-activities]'))return;
  const entry=root.querySelector('.r29-reward-entry');if(!entry)return;entry.insertAdjacentHTML('afterend','<button class="r29-paper r29-reward-entry r37c-activity-entry" data-r37c-invite-activities><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-2c0-4 14-4 14 0v2M17 5a3 3 0 0 1 0 6M20 21v-3c0-2-1-3-3-3"/></svg></i><span><b>邀请活动</b><small>查看邀请任务与奖励进度</small></span><em>›</em></button>');
 }
 function decorateActivityList(){
  const root=document.querySelector('#stage .r37-activity-list');if(!root)return;
  if(root.dataset.r37cActivityList)return;root.dataset.r37cActivityList='yes';
  const all=activityRows(),selected=state().activityTag||'',available=tags();
  root.querySelector('.r37c-activity-tabs')?.remove();
  const tabs=document.createElement('nav');tabs.className='r37c-activity-tabs';tabs.setAttribute('aria-label','活动标签');
  tabs.innerHTML='<button type="button" data-r37c-tag="" class="'+(selected?'':'on')+'">全部</button>'+available.map(tag=>'<button type="button" data-r37c-tag="'+esc(tag.id)+'" class="'+(selected===tag.id?'on':'')+'">'+esc(tag.name)+'</button>').join('');root.prepend(tabs);
  root.querySelectorAll('.r37-activity-card').forEach(card=>{const row=all.find(item=>item.activity.id===card.dataset.id);if(!row){card.hidden=true;return;}if(!card.dataset.r37cCard)card.outerHTML=activityCard(row);});
  root.querySelectorAll('.r37-activity-card').forEach(card=>{const row=all.find(item=>item.activity.id===card.dataset.id);if(row)card.hidden=Boolean(selected&&row.activity.tagId!==selected);});
 }
 function decorateActivityDetail(){
  const root=document.querySelector('#stage .r36n-activity-detail');if(!root)return;
  if(root.dataset.r37cDetail)return;
  const row=activityRows().find(item=>item.activity.id===state().activityId);if(!row)return;
  root.dataset.r37cDetail='yes';root.classList.add('r37-activity-detail');
  const a=activityConfig(row.activity),actual=me()?.rewards?.find(reward=>reward.id===row.progress?.rewardEventKey);
  const status=actual?window.R36Rewards.label(actual,S(),now()):row.progress?.reason||'尚未产生实际奖励';
  const rewardStatus=actual?window.R36Rewards.label(actual,S(),now()):'—';
  root.innerHTML='<header><div class="r37c-detail-badges"><span class="rev-category-tag">'+esc(row.tag?.name||'普通活跃活动')+'</span><span class="r37-status-tag '+statusClass(row.status)+'">'+esc(row.status)+'</span></div><h1>'+esc(a.name)+'</h1></header><section class="r37c-detail-info"><div><span>活动简介</span><p>'+esc(a.intro||a.desc||'暂无简介')+'</p></div><div><span>活动时间</span><p>'+esc(activityPeriod(a))+'</p></div><div><span>达标条件</span><p>'+esc(window.R37Activities.label(a))+'</p></div><div><span>参与进度</span><p>'+esc(row.progress?.completedAt?'已达标 · '+new Date(row.progress.completedAt).toLocaleDateString('zh-CN'):a.location==='offline'?'线下展示':'当前 '+row.metrics.value+' / '+row.metrics.target)+'</p></div></section><section class="r37c-detail-info"><div><span>奖励内容</span><p>'+esc(rewardText(a))+'</p></div><div><span>获奖人数</span><p>'+esc(a.rewardMode==='none'?'不产生奖励':a.limit?'上限 '+a.limit+' 人':'不限制')+'</p></div></section><button class="r36n-back-activities" data-act="r36n-back-activities">返回活动列表</button>';
 }
 function decorateRewards(){
  const root=document.querySelector('#stage .r36-rewards-page');if(!root)return;
  if(root.dataset.r37cRewards)return;root.dataset.r37cRewards='yes';
  const third=root.querySelector('.r36v-reward-tabs button[data-tab="已过期"]');if(third)third.textContent=third.textContent.replace('已过期','已失效');
  root.querySelectorAll('[data-reward-id]').forEach(card=>{
   const event=me()?.rewards?.find(reward=>reward.id===card.dataset.rewardId);if(!event)return;
   const pair=card.querySelector('.r37-reward-pair');if(pair){const badges=pair.querySelectorAll('b');const claim=badges[0]?.textContent.trim(),usage=badges[1]?.textContent.trim();if(badges[0])badges[0].className=claim==='未领取'||claim==='未发放'?'r37-state-green':claim==='已领取'||claim==='已发放'?'r37-state-orange':'';if(badges[1])badges[1].className='r37-state-neutral';}
   const countdown=card.querySelector('.r36-claim-countdown');if(countdown&&C&&['coupon','meal'].includes(event.type)&&!event.claimedAt&&!event.walletId&&!event.mealCreditId){const left=Date.parse(event.claimExpiresAt)-now();countdown.textContent=left<=0?'已失效':left<86400000?'还剩不足1天失效':'还剩 '+Math.ceil(left/86400000)+' 天失效';}
  });
 }
 function decorate(){
  decorateHome();decorateFood();decoratePortion();decorateMeals();decorateInvite();decorateActivityList();decorateActivityDetail();decorateRewards();window.R37FollowupMini?.decorate();window.R38Mini?.decorate();
 }
 document.addEventListener('click',event=>{
  const unit=event.target.closest('[data-r37c-unit]');if(unit){event.preventDefault();event.stopImmediatePropagation();window.R37FollowupMini?.chooseUnit(unit);return;}
  const expand=event.target.closest('[data-r37c-diet-expand]');if(expand){event.preventDefault();state().dietExpanded=!state().dietExpanded;decorateHome();return;}
  const tag=event.target.closest('[data-r37c-tag]');if(tag){event.preventDefault();state().activityTag=tag.dataset.r37cTag;route('checkinActivities');return;}
  if(event.target.closest('[data-r37c-invite-activities]')){event.preventDefault();state().activityTag='builtin-invite';route('checkinActivities');return;}
  const activity=event.target.closest('[data-act="a37-open"]');if(activity){state().activityId=activity.dataset.id;setTimeout(decorateActivityDetail,0);}
  if(event.target.closest('.r37h-intake .r29-target-entry')){event.preventDefault();event.stopImmediatePropagation();route('nutritionTarget');}
 },true);
 const stage=document.querySelector('#stage');
 if(stage){let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;decorate();});}).observe(stage,{childList:true,subtree:true});}
 window.R37CommentsMiniApi={decorate};
})();
