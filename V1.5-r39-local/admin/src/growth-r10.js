// V1.5-r10 coupon detail, navigation state and invitation reward page.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const {V15_PAGES,g6Tabs,ar3Head,atable,card,ab,badge,note,ae,af,atable:tableFactory,g6User,g6Rewards,g6RecordTable,g6RewardTable,g6RelationFor,dateTime,rewardSummary,ar3Action,openModal,openDrawer,closeModal,closeDrawer,renderApp,navigate,g6Stats,g6Buttons}=C;
  const data=()=>window.R3.state;
  const today=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(data().now));
  const user=id=>data().users.find(item=>item.id===id);
  const template=id=>data().templates.find(item=>item.id===id);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const baseCouponPage=V15_PAGES.coupons;
  const walletStatus=wallet=>wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<today()?'已过期':wallet.start>today()?'待生效':'可使用';
  const brandText=coupon=>{
    const names=(coupon?.brands||[]).map(id=>data().brands.find(brand=>brand.id===id||brand.name===id)?.name||id).filter(Boolean);
    return names.length?names.join('、'):'全部品牌';
  };
  const channelInfo=wallet=>{
    if(!wallet)return {channel:'券模板配置',activity:'尚未发放'};
    if(wallet.source==='后台下发'||wallet.grantedBy==='运营管理员')return {channel:'后台手动下发',activity:'后台发券'};
    if(/邀请/.test(wallet.source))return {channel:'系统自动下发',activity:'邀请活动'};
    if(/问卷/.test(wallet.source))return {channel:'系统自动下发',activity:'问卷活动'};
    if(/打卡/.test(wallet.source))return {channel:'系统自动下发',activity:'连续打卡活动'};
    return {channel:'系统自动下发',activity:wallet.source||'系统活动'};
  };
  const orderFor=(wallet,owner)=>wallet?.orderId?owner?.orders.find(order=>order.id===wallet.orderId):null;
  const detailRow=(label,value)=>'<div><span>'+label+'</span><b>'+(value||'—')+'</b></div>';
  function openTemplateDetail(templateId){
    const coupon=template(templateId);if(!coupon)return;
    openModal({title:'优惠券详情 · '+coupon.name,wide:true,body:'<div class="g10-coupon-detail">'+[
      detailRow('券名称',ae(coupon.name)),detailRow('面额','¥'+coupon.amount),detailRow('使用门槛',coupon.threshold?'满 ¥'+coupon.threshold:'无门槛'),detailRow('可用品牌',ae(brandText(coupon))),detailRow('有效期',coupon.validMode==='relative'?'领取后 '+coupon.days+' 天':coupon.start+' 至 '+coupon.end),detailRow('发放渠道','后台手动创建'),detailRow('活动',coupon.source||'券模板'),detailRow('状态',ae(coupon.status))
    ].join('')+'</div>',footer:'<button class="button secondary" data-action="close-modal">关闭</button>'});
  }
  function openWalletDetail(walletId){
    const owner=data().users.find(item=>item.wallet.some(wallet=>wallet.id===walletId)),wallet=owner?.wallet.find(item=>item.id===walletId);if(!wallet)return;
    const info=channelInfo(wallet),order=orderFor(wallet,owner),status=walletStatus(wallet);
    openModal({title:'优惠券发放与使用详情',wide:true,body:'<div class="g10-coupon-detail">'+[
      detailRow('券名称',ae(wallet.name)),detailRow('面额','¥'+wallet.amount),detailRow('使用门槛',wallet.threshold?'满 ¥'+wallet.threshold:'无门槛'),detailRow('可用品牌',ae(brandText(wallet))),detailRow('领取人',ae(owner?.name||wallet.userId)+'（'+ae(owner?.id||'')+'）'),detailRow('手机号',ae(owner?.profile?.phone||'—')),detailRow('发放渠道',info.channel),detailRow('活动来源',info.activity),detailRow('发放时间',dateTime(wallet.obtainedAt)),detailRow('有效期',wallet.start+' 至 '+wallet.expire),detailRow('状态',status),detailRow('使用时间',dateTime(wallet.usedAt)),detailRow('关联订单',order?ae(order.id+' · '+order.pkg+' · ¥'+order.price):'—'),detailRow('发放方',ae(wallet.grantedBy||'系统'))
    ].join('')+'</div>',footer:'<button class="button secondary" data-action="close-modal">关闭</button>'});
  }
  window.G9.couponBrandText=brandText;
  ar3Action('g10-template-detail',n=>openTemplateDetail(n.dataset.id));
  ar3Action('g10-wallet-detail',n=>openWalletDetail(n.dataset.id));
  document.addEventListener('keydown',event=>{
    const target=event.target.closest('.g10-link,.g10-status-link');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.click();}
  });

  function walletLink(wallet){
    return '<span class="g10-link" data-action="g10-wallet-detail" data-id="'+ae(wallet.id)+'" role="button" tabindex="0">'+ae(wallet.name)+'</span>';
  }
  function statusLink(wallet){
    return '<span class="g10-status-link" data-action="g10-wallet-detail" data-id="'+ae(wallet.id)+'" role="button" tabindex="0">'+badge(walletStatus(wallet))+'</span>';
  }
  function userCouponRows(owner){
    return owner.wallet.map(wallet=>[
      walletLink(wallet),
      ae(wallet.source),
      dateTime(wallet.obtainedAt),
      wallet.start+' 至 '+wallet.expire,
      statusLink(wallet),
      ae(wallet.grantedBy||'系统'),
      ab(walletStatus(wallet)==='已使用'?'查看使用':'详情','g10-wallet-detail',`data-id="${wallet.id}"`,'secondary small')
    ]);
  }
  function openUserCoupons(userId){
    const owner=user(userId);if(!owner)return;
    const counts={'可使用':0,'已使用':0,'已过期':0,'已撤回':0,'待生效':0};owner.wallet.forEach(wallet=>counts[walletStatus(wallet)]++);
    const body='<div class="g8-user-summary">'+[['优惠券总数',owner.wallet.length],['可使用',counts['可使用']],['已使用',counts['已使用']],['已过期',counts['已过期']],['已撤回',counts['已撤回']],['待生效',counts['待生效']]].map(([label,value])=>'<article><span>'+label+'</span><b>'+value+'</b></article>').join('')+'</div><div class="g8-user-meta"><span>'+ae(owner.name)+'</span><span>'+ae(owner.id)+'</span><span>'+ae(owner.profile?.phone||'—')+'</span></div>'+card('全部优惠券',atable(['优惠券','来源','获得时间','有效期','状态','发放方','操作'],userCouponRows(owner)));
    openDrawer({title:owner.name+' · 用户优惠券',body,footer:ab('导出该用户券','g8-export-user',`data-id="${owner.id}"`)});
  }
  ar3Action('g8-user-coupon-detail',n=>openUserCoupons(n.dataset.id));

  function grantRows(){
    const rows=[];
    for(const owner of data().users)for(const wallet of owner.wallet){
      const info=channelInfo(wallet);
      rows.push([
        walletLink(wallet)+'<small>'+ae(info.channel)+' · '+ae(info.activity)+'</small>',
        ae(info.channel),
        ae(info.activity),
        ae(owner.name)+'<small>'+ae(owner.id)+'</small>',
        dateTime(wallet.obtainedAt),
        ae(wallet.start+' 至 '+wallet.expire),
        statusLink(wallet),
        ab(walletStatus(wallet)==='已使用'?'查看使用':'详情','g10-wallet-detail',`data-id="${wallet.id}"`,'secondary small')+ab('查看用户','g8-user-coupon-detail',`data-id="${owner.id}"`,'secondary small')+(['已使用','已撤回','已过期'].includes(walletStatus(wallet))?'':' '+ab('撤回','r3-revoke',`data-id="${wallet.id}"`,'secondary small'))
      ]);
    }
    for(const job of data().issues.filter(job=>job.status==='待执行'))rows.push([
      '<span class="g10-link" data-action="g10-template-detail" data-id="'+ae(job.templateId)+'" role="button" tabindex="0">'+ae(template(job.templateId)?.name||'优惠券')+'</span><small>定时发放任务</small>',
      '后台手动下发',
      '定时发券',
      job.users.map(g6User).map(ae).join('、'),
      dateTime(job.scheduledAt),
      '—',
      badge('待发放'),
      ab('券详情','g10-template-detail',`data-id="${job.templateId}"`,'secondary small')+ab('撤回任务','r3-cancel-job',`data-id="${job.id}"`,'secondary small')
    ]);
    return rows;
  }

  function enhanceTemplateTable(html){
    const box=document.createElement('div');box.innerHTML=html;
    box.querySelector('table')?.classList.add('g11-coupon-table');
    box.querySelectorAll('tbody tr').forEach(row=>{
      const edit=row.querySelector('[data-action="r3-edit"][data-entity="coupon"]');if(!edit)return;
      const id=edit.dataset.id,first=row.cells[0],name=first?.querySelector('b'),status=row.querySelector('.r3-badge');
      const headers=[...row.closest('table').tHead.rows[0].cells].map(cell=>cell.textContent.trim()),usageIndex=headers.findIndex(text=>text.includes('发放 / 使用')||text.includes('发放/使用'));
      if(usageIndex>=0&&row.cells[usageIndex]){
        const cell=row.cells[usageIndex],link=document.createElement('span');
        link.className='g10-link g10-usage-link';
        link.dataset.action='g10-template-detail';
        link.dataset.id=id;
        link.setAttribute('role','button');
        link.tabIndex=0;
        link.innerHTML=cell.innerHTML;
        cell.replaceChildren(link);
      }
    });
    return box.innerHTML;
  }
  function couponsPage(){
    const tab=g6Tabs.coupons,state=data();let content='';
    if(tab==='templates'){
      const old=g6Tabs.coupons;g6Tabs.coupons='templates';const base=baseCouponPage();g6Tabs.coupons=old;
      const box=document.createElement('div');box.innerHTML=base;content=enhanceTemplateTable(box.querySelector('.r3-card')?.outerHTML||'');
    }else if(tab==='issues'){
      content=card('发放记录',atable(['优惠券','发放渠道','活动来源','领取人','发放时间','有效期','状态','操作'],grantRows()));
    }else{
      const rows=state.users.map(owner=>{
        const counts={'可使用':0,'已使用':0,'已过期':0,'已撤回':0,'待生效':0};owner.wallet.forEach(wallet=>counts[walletStatus(wallet)]++);
        return ['<b>'+ae(owner.name)+'</b><small>'+ae(owner.id)+'</small>',ae(owner.profile?.phone||'—'),owner.wallet.length,counts['可使用'],counts['已使用'],counts['已过期'],counts['已撤回'],ab('查看详情','g8-user-coupon-detail',`data-id="${owner.id}"`,'secondary small')+ab('导出','g8-export-user',`data-id="${owner.id}"`,'secondary small')];
      });
      content=card('用户优惠券',atable(['用户 / 用户号','手机号','券总数','可使用','已使用','已过期','已撤回','操作'],rows));
    }
    return ar3Head('优惠券管理','券模板、发放记录和用户优惠券统一管理。',tab==='templates'?ab('新建优惠券','r3-new','data-entity="coupon"','primary'):'')+
      g6Stats([['券模板',state.templates.length],['发放记录',state.users.reduce((total,owner)=>total+owner.wallet.length,0)+state.issues.filter(job=>job.status==='待执行').length],['用户数',state.users.length],['可使用',state.users.reduce((total,owner)=>total+owner.wallet.filter(wallet=>walletStatus(wallet)==='可使用').length,0)]])+
      g6Buttons('coupons',[['templates','券模板'],['issues','发放记录'],['user-coupons','用户优惠券']])+content+'</section>';
  }
  V15_PAGES.coupons=couponsPage;

  function phoneOfMember(rel){
    if(rel.merchantId)return data().merchants.find(item=>item.id===rel.merchantId)?.phone||'—';
    return user(rel.inviterId)?.profile?.phone||'—';
  }
  const memberLabel=(name,phone)=>'<b>'+ae(name||'—')+'</b><small>'+ae(phone||'—')+'</small>';
  const inviteeLabel=rel=>{const invitee=user(rel.userId);return memberLabel(invitee?.name||rel.userId,invitee?.profile?.phone);};
  const inviterLabel=rel=>rel.merchantId?memberLabel(data().merchants.find(item=>item.id===rel.merchantId)?.name||rel.merchantId,phoneOfMember(rel)):memberLabel(user(rel.inviterId)?.name||rel.inviterId,phoneOfMember(rel));
  const conditionLabel=rel=>rel.conditionLabel||window.G9.conditionLabel(rel.condition);
  const statusText=rel=>rel.status==='待达成'?'未达成':rel.status==='已达成'?'已达成':'已失效';
  function rewardFor(rel,side){
    const snapshot=rel.rewardSnapshot||{};
    if(side==='inviter'&&rel.merchantId)return {name:'不发放',status:'—'};
    if(rel.merchantId){const reward=(snapshot.reward||[])[0];return reward?{name:reward.type==='coupon'?template(reward.couponId)?.name||'优惠券':reward.type==='meal'?'赠餐 '+reward.count+' 餐':reward.name||'奖励',status:rel.status==='已达成'?'已达成':rel.status==='待达成'?'未达成':'已失效'}:{name:'不发放',status:'—'};}
    const target=snapshot.target||'both',rows=side==='inviter'?snapshot.oldReward:snapshot.newReward,allowed=target==='both'||target===side;
    const reward=allowed?(rows||[])[0]:null;if(!reward)return {name:'不发放',status:'—'};
    const name=reward.type==='coupon'?template(reward.couponId)?.name||'优惠券':reward.type==='meal'?'赠餐 '+reward.count+' 餐':reward.name||'奖励';
    const key=rel.rewardKeys?.find(id=>id.endsWith(side==='inviter'?'-old':'-new')),event=data().users.flatMap(owner=>owner.rewards).find(item=>item.id===key);
    const status=rel.status==='待达成'?'未达成':rel.status==='已达成'?'已达成'+(event?' · '+event.status:''):'已失效';
    return {name,status};
  }
  function rewardCell(rel,side){const info=rewardFor(rel,side);return '<b>'+ae(info.name)+'</b><small>'+ae(info.status)+'</small>';}
  function relationRows(relations){return relations.map(rel=>[badge(rel.merchantId?'商户邀请':'用户邀请'),inviterLabel(rel),inviteeLabel(rel),ae(rel.code)+'<small>'+dateTime(rel.boundAt)+'</small>',ae(conditionLabel(rel)),badge(statusText(rel)),rewardCell(rel,'inviter'),rewardCell(rel,'invitee'),ab('查看详情','g9-relation-detail',`data-id="${rel.id}"`,'secondary small')]);}

  function invitationPage(){
    const state=data(),tab=g6Tabs.invites;let content='',actions='';
    if(tab==='merchant'){
      actions=ab('新建商户邀请码','r3-new','data-entity="merchant"','primary');
      content=card('商户邀请码',atable(['商户 / 电话','邀请码','有效期','生效条件','新用户奖励','邀请 / 订购人数','订购次数 / 实收','状态','操作'],state.merchants.map(merchant=>[memberLabel(merchant.name,merchant.phone),'<code>'+ae(merchant.code)+'</code>',merchant.start+' 至 '+merchant.end,ae(merchant.conditionLabel||window.G9.conditionLabel(merchant.condition)),ae(merchant.withReward?rewardSummary(merchant.reward):'不发放'),(merchant.users||0)+' / '+(merchant.buyers||0),(merchant.orders||0)+' / ¥'+Number(merchant.revenue||0).toFixed(2),badge(merchant.status),ab('复制','g10-copy-merchant',`data-id="${merchant.id}"`,'secondary small')+ab('编辑','r3-edit','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')+ab(merchant.status==='启用'?'停用':'启用','r3-toggle','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')])));
    }else if(tab==='user'){
      actions=ab('新增用户邀请码','g8-new-user-code','','primary')+ab('活动设置','g6-settings');
      const oldName=rewardSummary(state.settings.oldReward),newName=rewardSummary(state.settings.newReward),userRelations=state.inviteRelations.filter(rel=>!rel.merchantId);
      content=card('用户邀请码',atable(['用户 / 手机号','邀请码','状态','有效邀请','生效条件','老用户奖励','新用户奖励','操作'],state.users.filter(item=>item.inviteCode).map(owner=>{const count=userRelations.filter(rel=>rel.inviterId===owner.id&&rel.status==='已达成').length,status=owner.inviteStatus==='停用'?'停用':!state.settings.enabled?'活动关闭':count>=state.settings.cap?'已达上限':'启用';return [memberLabel(owner.name,owner.profile?.phone),'<code>'+ae(owner.inviteCode)+'</code>',badge(status),count+' / '+state.settings.cap,ae(state.settings.conditionLabel||window.G9.conditionLabel(state.settings.condition)),ae(oldName),ae(newName),ab('查看记录','g9-user-invites',`data-id="${owner.id}"`,'secondary small')+ab(owner.inviteStatus==='停用'?'启用':'停用','g6-user-code-toggle',`data-id="${owner.id}"`,'secondary small')]})));
    }else{
      content=card('邀请记录',atable(['邀请类型','邀请人 / 手机号','被邀请人 / 手机号','邀请码 / 时间','生效条件','达成状态','邀请人奖励','被邀请人奖励','操作'],relationRows(state.inviteRelations)));
    }
    return ar3Head('邀请码管理','商户码、用户码和邀请达成记录统一管理。',actions)+g6Stats([['商户邀请',state.inviteRelations.filter(rel=>rel.merchantId).length],['用户邀请',state.inviteRelations.filter(rel=>!rel.merchantId).length],['待达成',state.inviteRelations.filter(rel=>rel.status==='待达成').length],['补填期限',(state.settings.bindWindowDays||7)+' 天']])+g6Buttons('invites',[['merchant','商户邀请码'],['user','用户邀请码'],['records','邀请记录']])+content+'</section>';
  }
  V15_PAGES.invites=invitationPage;
  V15_PAGES['invite-relations']=()=>{g6Tabs.invites='records';return invitationPage();};
  V15_PAGES['invite-users']=V15_PAGES.invites;

  function rewardPage(){
    const relations=data().inviteRelations;
    return ar3Head('奖励记录','查看邀请人和被邀请人的奖励内容与达成状态。')+g6Stats([['全部邀请',relations.length],['已达成',relations.filter(rel=>rel.status==='已达成').length],['未达成',relations.filter(rel=>rel.status==='待达成').length],['双方奖励',relations.filter(rel=>!rel.merchantId).length]])+card('邀请奖励',atable(['邀请类型','邀请人 / 手机号','被邀请人 / 手机号','邀请码 / 时间','邀请人奖励','被邀请人奖励','操作'],relations.map(rel=>[badge(rel.merchantId?'商户邀请':'用户邀请'),inviterLabel(rel),inviteeLabel(rel),'<code>'+ae(rel.code)+'</code><small>'+dateTime(rel.boundAt)+'</small>',rewardCell(rel,'inviter'),rewardCell(rel,'invitee'),ab('查看邀请','g9-relation-detail',`data-id="${rel.id}"`,'secondary small')])))+'</section>';
  }
  V15_PAGES['invite-rewards']=rewardPage;

  ar3Action('g10-copy-merchant',n=>{
    const source=data().merchants.find(item=>item.id===n.dataset.id);if(!source)return;
    const copy=clone(source);delete copy.users;delete copy.buyers;delete copy.orders;delete copy.revenue;Object.assign(copy,{id:null,code:null,name:'',phone:'',note:'',status:'启用',revision:0});C.kind='merchant';C.editing=copy;C.navigate('invite-form');
  });

  function conditionSection(prefix,condition={}){
    const type=condition.type||'profile_complete';
    return '<section class="g10-invite-condition g9-condition-box"><h3>邀请条件</h3>'+'<div class="g10-condition-row"><label><span>生效条件</span><select name="'+prefix+'ConditionType">'+[['profile_complete','完成初始设置'],['order_count','新用户购餐次数'],['order_amount','新用户累计实付金额'],['login_days','新用户累计登录天数']].map(([value,label])=>'<option value="'+value+'" '+(value===type?'selected':'')+'>'+label+'</option>').join('')+'</select></label><div class="g10-condition-value">'+
      '<label data-g10-param="profile_complete"><span>新用户完成初始设置后达成</span></label>'+
      '<label data-g10-param="order_count"><span>订单次数 ≥</span><input name="'+prefix+'ConditionCount" type="number" min="1" value="'+ae(condition.count||1)+'"></label>'+
      '<label data-g10-param="order_amount"><span>累计实付 ≥</span><input name="'+prefix+'ConditionAmount" type="number" min="1" value="'+ae(condition.amount||99)+'"></label>'+
      '<label data-g10-param="login_days"><span>累计登录 ≥</span><input name="'+prefix+'ConditionDays" type="number" min="1" value="'+ae(condition.days||3)+'"></label></div></div><p class="r3-help">绑定后先记为待达成；条件满足后自动发放奖励，条件和奖励使用绑定时的快照。</p></section>';
  }
  function refreshConditionSection(scope=document){
    scope.querySelectorAll('.g10-condition-row').forEach(row=>{
      const type=row.querySelector('[name$="ConditionType"]')?.value;
      row.querySelectorAll('[data-g10-param]').forEach(item=>item.hidden=item.dataset.g10Param!==type);
    });
  }
  document.addEventListener('change',event=>{if(event.target.matches('[name$="ConditionType"]'))refreshConditionSection(event.target.closest('.g10-invite-condition'));});

  const baseInviteForm=V15_PAGES['invite-form'];
  V15_PAGES['invite-form']=function(){
    const box=document.createElement('div');box.innerHTML=baseInviteForm();
    const old=box.querySelector('.g9-condition-box');if(old){const holder=document.createElement('div');holder.innerHTML=conditionSection('merchant',C.editing?.condition);old.replaceWith(holder.firstElementChild);}
    setTimeout(()=>{refreshConditionSection(document);window.G9.enhanceRewardPickers(document);},0);
    return box.innerHTML;
  };

  function openSettings(){
    const settings=data().settings,box=document.createElement('div');box.innerHTML=C.ar3SettingsForm();
    const target=box.querySelector('[name="target"]');if(target&&!target.querySelector('option[value="none"]'))target.insertAdjacentHTML('beforeend','<option value="none">无</option>');if(target)target.value=settings.target||'both';
    const enabled=box.querySelector('[data-condition="invite-enabled"]'),anchor=enabled?.querySelector('[data-condition="reward-old"]');
    if(anchor)anchor.insertAdjacentHTML('beforebegin',conditionSection('invite',settings.condition));
    openModal({title:'用户邀请活动设置',body:box.innerHTML,wide:true});
    setTimeout(()=>{const root=document.querySelector('#modal-root');refreshConditionSection(root);window.G9.enhanceRewardPickers(root);const targetInput=root.querySelector('[name="target"]');const refreshReward=()=>{root.querySelectorAll('[data-condition="reward-old"]').forEach(el=>el.hidden=!['old','both'].includes(targetInput?.value));root.querySelectorAll('[data-condition="reward-new"]').forEach(el=>el.hidden=!['new','both'].includes(targetInput?.value));};targetInput?.addEventListener('change',refreshReward);refreshReward();},0);
  }
  ar3Action('g6-settings',openSettings);

  const parentPage={coupon:'coupons','coupon-form':'coupons','coupon-issue':'coupons','invite-form':'invites','invite-settings':'invites','invite-users':'invites','invite-relations':'invites','user-growth-form':'user-growth','invite-rewards':'invite-rewards','food-form':'foods','survey-form':'surveys'};
  let navScheduled=false;
  function applyNavState(){
    if(navScheduled)return;navScheduled=true;requestAnimationFrame(()=>{
      navScheduled=false;
      let rewardItem=document.querySelector('.sidebar-nav .nav-item[data-page="invite-rewards"]');
      if(!rewardItem){const inviteItem=document.querySelector('.sidebar-nav .nav-item[data-page="invites"]');if(inviteItem){rewardItem=inviteItem.cloneNode(true);rewardItem.dataset.page='invite-rewards';rewardItem.classList.remove('active');const label=rewardItem.querySelector('span');if(label)label.textContent='奖励记录';inviteItem.after(rewardItem);}}
      const current=C.state?.page,target=parentPage[current]||current,items=[...document.querySelectorAll('.sidebar-nav .nav-item')];
      items.forEach(item=>item.classList.toggle('active',item.dataset.page===target));
      document.querySelectorAll('.sidebar-nav .nav-section').forEach(section=>section.classList.toggle('g10-active-group',Boolean(section.querySelector('.nav-item.active'))));
    });
  }
  const observer=new MutationObserver(applyNavState);observer.observe(document.body,{childList:true,subtree:true});applyNavState();

  window.G10={openTemplateDetail,openWalletDetail,openUserCoupons,openSettings,refreshConditionSection};
})();
