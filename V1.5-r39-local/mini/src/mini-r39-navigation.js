// Final r39 profile and bottom-navigation corrections.
(()=>{
 const App=window.__duya;
 if(!App)return;
 const SCREENS=App.SCREENS,I=App.I;
 const e=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const settings=()=>window.R3?.state?.settings||{};
 const effectiveInvites=()=>{
  const data=window.R3?.state,userId=data?.me?.id;
  return userId?Number(window.R23Invite?.query?.(data,userId)?.effective)||0:0;
 };
 const normalizePackageTab=()=>{
  const item=document.querySelector('#tab-bar [data-tab="package"]'),label=item?.children?.[1];
  if(label&&label.textContent!=='订购')label.textContent='订购';
 };
 function inviteRules(){
  const current=settings(),time=current.validityMode==='always'?'长期有效':current.start&&current.end?current.start+' 至 '+current.end:'活动时间待配置';
  const cap=Number(current.cap)>0?'每位邀请人最多邀请 '+Number(current.cap)+' 人':'邀请人数不限';
  const days=Math.max(1,Number(current.bindWindowDays)||7);
  const target={old:'邀请人获奖',new:'新用户获奖',both:'邀请人与新用户均可获奖'}[current.target]||'奖励对象以活动设置为准';
  return {intro:String(current.inviteIntro||'').trim(),rows:[time,cap,'注册后 '+days+' 天内可补填',target],enabled:current.enabled!==false};
 }
 const profileBase=SCREENS.profile.render;
 SCREENS.profile.render=function(){
  const box=document.createElement('div');
  box.innerHTML=profileBase();
  box.querySelector('.quick-item[data-key="service"]')?.remove();
  box.querySelector('.quick-item[data-key="favorites"]')?.remove();
  box.querySelector('.quick-item[data-key="invite"]')?.remove();
  const cards=[...box.querySelectorAll('.card')];
  const quick=cards.find(card=>card.querySelector('.card-head h3')?.textContent.trim()==='快捷服务');
  if(quick&&!box.querySelector('.r39-invite-card')){
   const rules=inviteRules();
   const invite=document.createElement('section');
   invite.className='card r39-invite-card';
   const artwork=window.__offlineAsset('assets-r39-profile/invite-gift-banner.png');
   invite.innerHTML='<div class="r39-invite-copy"><span class="r39-invite-eyebrow">邀请好友 · 共享健康</span><div class="card-head"><h3>邀请码活动</h3></div><p class="r39-invite-intro">'+e(rules.intro||'邀请好友加入，一起开启健康生活')+'</p></div><div class="r39-invite-footer"><span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="7" r="3.2"/><path d="M2.5 20v-2a6.5 6.5 0 0 1 13 0v2M16 4a3.2 3.2 0 0 1 0 6.3M18 13a6 6 0 0 1 3.5 5.5V20"/></svg>已邀请 <b>'+effectiveInvites()+'</b> 人</span><button type="button" class="r39-invite-entry" data-act="profile-quick" data-key="invite">立即邀请<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3 5 5-5 5"/></svg></button></div>';
   invite.insertAdjacentHTML('afterbegin','<img class="r39-invite-art" src="'+e(artwork)+'" alt="" aria-hidden="true">');
   quick.after(invite);
  }
  const tools=[...box.querySelectorAll('.card')].find(card=>card.querySelector('.card-head h3')?.textContent.trim()==='更多工具');
  if(tools&&!tools.querySelector('.r39-service-tool')){
   const row=document.createElement('button');
   row.type='button';
   row.className='row r39-service-tool';
   row.dataset.act='service';
   row.innerHTML=I('headset')+'<span class="row-main"><span class="row-title">专属客服</span><span class="row-sub">工作时间：周一到周五 09:00–18:00</span></span><span class="row-tail">'+I('chev','chev')+'</span>';
   const rows=tools.querySelector('.rows');
   if(rows)rows.prepend(row);
   else tools.insertBefore(row,tools.querySelector('button.row'));
  }
  return box.innerHTML;
 };

 const articlesBase=SCREENS.articles.render;
 SCREENS.articles.render=function(){
  const box=document.createElement('div');
  box.innerHTML=articlesBase();
  const search=box.querySelector('.search-bar');
  if(search&&!box.querySelector('.r39-article-toolbar .r39-my-favorites')){
   const count=(window.R3?.state?.favorites||[]).length;
   const toolbar=document.createElement('div');toolbar.className='r39-article-toolbar';
   search.replaceWith(toolbar);toolbar.append(search);
   toolbar.insertAdjacentHTML('beforeend','<button type="button" class="r39-my-favorites" data-act="profile-quick" data-key="favorites"><span>我的收藏</span><b>'+count+'</b></button>');
  }
  return box.innerHTML;
 };

 const articleBase=SCREENS.article.render;
 SCREENS.article.render=function(){
  const box=document.createElement('div');
  box.innerHTML=articleBase();
  const detail=box.querySelector('.article-detail'),meta=detail?.querySelector('.ad-meta');
  if(detail&&meta&&!detail.querySelector('.r39-my-favorites')){
   const count=(window.R3?.state?.favorites||[]).length;
   meta.insertAdjacentHTML('afterend','<button type="button" class="r39-my-favorites" data-act="profile-quick" data-key="favorites"><span>我的收藏</span><b>'+count+'</b><em>查看已收藏的营养资讯 ›</em></button>');
  }
  return box.innerHTML;
 };

 const inviteBase=SCREENS.invite.render;
 SCREENS.invite.render=function(){
  const box=document.createElement('div');
  box.innerHTML=inviteBase();
  const data=window.R3?.state,user=data?.me,query=user?window.R23Invite?.query?.(data,user.id):null;
  if(query?.canBind&&!user?.binding&&!box.querySelector('.r39-invite-bind')){
   const anchor=box.querySelector('.r29-invite-main');
   const card='<section class="r29-paper r39-invite-bind"><header><div><h2>补填邀请码</h2><p>注册时未填写，可在有效期内补填一次</p></div><span>可补填</span></header><p>补填截止 '+e(new Date(query.deadline).toLocaleString('zh-CN'))+'，绑定前的订单不追溯计入邀请进度。</p><div><input id="r3-bind-code" maxlength="8" value="'+e(window.R3?.state?.ui?.bindCode||'')+'" placeholder="填写好友或商户邀请码"><button data-act="r3-bind">确认绑定</button></div></section>';
   if(anchor)anchor.insertAdjacentHTML('afterend',card);else box.prepend(Object.assign(document.createElement('div'),{innerHTML:card}).firstElementChild);
  }
  return box.innerHTML;
 };

 for(const route of ['deliveryCalendar','plans']){
  if(!SCREENS[route])continue;
  SCREENS[route]={
   ...SCREENS[route],
   title:'渡鸦管家',
   logo:true,
   noTab:false,
   tab:'package',
   navLeft:SCREENS.package.navLeft,
   navStyle:SCREENS.package.navStyle
  };
 }

 normalizePackageTab();
 const appRoot=document.querySelector('#app');
 if(appRoot)new MutationObserver(normalizePackageTab).observe(appRoot,{childList:true,subtree:true});

 window.R39Navigation={
  routes:['deliveryCalendar','plans'],
  packageLabel:'订购',
  profile:{
   quickKeys:['rewardRecord','checkinActivities','coupon'],
   inviteLocation:'separate-card',
   serviceLocation:'more-tools'
  },
  articleFavorites:true
 };
})();
