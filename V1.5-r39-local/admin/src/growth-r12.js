// V1.5-r12 coupon usage details, invitation record popups and batch-control removal.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const {V15_PAGES,g6Tabs,ar3Head,atable,card,ab,badge,note,ae,af,atable:tableFactory,g6User,g6Rewards,g6RecordTable,g6RewardTable,g6RelationFor,dateTime,rewardSummary,ar3Action,openModal,openDrawer,closeModal,closeDrawer,renderApp,navigate,g6Stats,g6Buttons}=C;
  const data=()=>window.R3?.state;
  const today=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(data().now));
  const user=id=>data().users.find(item=>item.id===id);
  const template=id=>data().templates.find(item=>item.id===id);
  const baseCouponPage=V15_PAGES.coupons;
  const walletStatus=wallet=>wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<today()?'已过期':wallet.start>today()?'待生效':'可使用';
  const brandNames=template=>{
    const names=(template?.brands||[]).map(id=>data().brands.find(brand=>brand.id===id||brand.name===id)?.name||id).filter(Boolean);
    return names.length?names.join('、'):'全部品牌';
  };
  const validity=template=>template.validMode==='relative'?'相对有效期 · 领取后 '+template.days+' 天':'固定有效期 · '+template.start+' 至 '+template.end;
  const channel=wallet=>{
    if(wallet.source==='后台下发'||wallet.grantedBy==='运营管理员')return {type:'后台手动下发',activity:'后台发券'};
    if(/邀请/.test(wallet.source))return {type:'系统自动下发',activity:'邀请活动'};
    if(/问卷/.test(wallet.source))return {type:'系统自动下发',activity:'问卷活动'};
    if(/打卡/.test(wallet.source))return {type:'系统自动下发',activity:'连续打卡活动'};
    return {type:'系统自动下发',activity:wallet.source||'系统活动'};
  };
  const orderFor=(owner,wallet)=>wallet.orderId?owner.orders.find(order=>order.id===wallet.orderId):null;
  const item=(label,value)=>'<div><span>'+label+'</span><b>'+(value||'—')+'</b></div>';

  function openCouponUsage(templateId){
    const coupon=template(templateId);if(!coupon)return;
    const recipients=[];
    for(const owner of data().users)for(const wallet of owner.wallet.filter(item=>item.templateId===templateId)){
      const info=channel(wallet),order=orderFor(owner,wallet);
      recipients.push([
        '<b>'+ae(owner.name)+'</b><small>'+ae(owner.id)+'</small>',
        ae(owner.profile?.phone||'—'),
        ae(info.type),
        ae(info.activity),
        dateTime(wallet.obtainedAt),
        wallet.start+' 至 '+wallet.expire,
        badge(walletStatus(wallet)),
        walletStatus(wallet)==='已使用'?'是':'否',
        dateTime(wallet.usedAt)
      ]);
    }
    const summary='<div class="g12-coupon-summary">'+[
      item('券名称',ae(coupon.name)),item('面额','¥'+coupon.amount),item('门槛',coupon.threshold?'满 ¥'+coupon.threshold:'无门槛'),item('可用品牌',ae(brandNames(coupon))),item('有效期',validity(coupon))
    ].join('')+'</div>';
    openModal({title:'发放 / 使用明细 · '+coupon.name,wide:true,body:summary+card('发放人员',recipients.length?atable(['领取人','手机号','发放渠道','活动来源','发放时间','有效期','当前状态','是否使用','使用时间'],recipients):'<p class="r3-empty">该优惠券尚未发放给任何用户</p>'),footer:'<button class="button secondary" data-action="close-modal">关闭</button>'});
  }
  ar3Action('coupon-usage-detail',n=>openCouponUsage(n.dataset.id));

  function couponsPage(){
    const state=data(),tab=g6Tabs.coupons;
    if(tab!=='templates')return baseCouponPage();
    const rows=state.templates.map(coupon=>{
      const wallets=state.users.flatMap(owner=>owner.wallet.filter(wallet=>wallet.templateId===coupon.id)),issued=wallets.length,used=wallets.filter(wallet=>walletStatus(wallet)==='已使用').length;
      return ['<b>'+ae(coupon.name)+'</b><small>'+ae(coupon.desc||'')+'</small>','¥'+coupon.amount,coupon.threshold?'满 ¥'+coupon.threshold:'无门槛',ae(brandNames(coupon)),ae(validity(coupon)),`<span class="g12-usage-link" data-action="coupon-usage-detail" data-id="${ae(coupon.id)}" role="button" tabindex="0">${issued} / ${used}</span>`,badge(coupon.status),ab('编辑','r3-edit','data-entity="coupon" data-id="'+coupon.id+'"','secondary small')+ab(coupon.status==='启用'?'停用':'启用','r3-toggle','data-entity="coupon" data-id="'+coupon.id+'"','secondary small')+ab('下发','r3-issue','data-id="'+coupon.id+'"','primary small')];
    });
    return ar3Head('优惠券管理','券模板、发放记录和用户优惠券统一管理。',ab('新建优惠券','r3-new','data-entity="coupon"','primary'))+
      g6Stats([['券模板',state.templates.length],['发放记录',state.users.reduce((total,owner)=>total+owner.wallet.length,0)+state.issues.filter(job=>job.status==='待执行').length],['用户数',state.users.length],['可使用',state.users.reduce((total,owner)=>total+owner.wallet.filter(wallet=>walletStatus(wallet)==='可使用').length,0)]])+
      g6Buttons('coupons',[['templates','券模板'],['issues','发放记录'],['user-coupons','用户优惠券']])+
      card('优惠券模板','<div class="g12-coupon-table">'+atable(['名称 / 描述','减免金额','使用门槛','可用品牌','有效期','发放 / 使用','状态','操作'],rows)+'</div>')+'</section>';
  }
  V15_PAGES.coupons=couponsPage;

  const memberLabel=(name,phone)=>'<b>'+ae(name||'—')+'</b><small>'+ae(phone||'—')+'</small>';
  const inviterLabel=rel=>rel.merchantId?memberLabel(data().merchants.find(item=>item.id===rel.merchantId)?.name||rel.merchantId,data().merchants.find(item=>item.id===rel.merchantId)?.phone):memberLabel(user(rel.inviterId)?.name||rel.inviterId,user(rel.inviterId)?.profile?.phone);
  const inviteeLabel=rel=>memberLabel(user(rel.userId)?.name||rel.userId,user(rel.userId)?.profile?.phone);
  const statusText=rel=>rel.status==='待达成'?'未达成':rel.status==='已达成'?'已达成':'已失效';
  const conditionText=rel=>rel.conditionLabel||window.G9.conditionLabel(rel.condition);
  function rewardFor(rel,side){
    const snapshot=rel.rewardSnapshot||{};
    if(side==='inviter'&&rel.merchantId)return {name:'不发放',status:'—'};
    const reward=rel.merchantId?(snapshot.reward||[])[0]:(()=>{const target=snapshot.target||'both',allowed=target==='both'||target===side;return allowed?((side==='inviter'?snapshot.oldReward:snapshot.newReward)||[])[0]:null;})();
    if(!reward)return {name:'不发放',status:'—'};
    const name=reward.type==='coupon'?template(reward.couponId)?.name||'优惠券':reward.type==='meal'?'赠餐 '+reward.count+' 餐':reward.name||'奖励';
    const key=rel.rewardKeys?.find(id=>id.endsWith(side==='inviter'?'-old':'-new')),event=data().users.flatMap(owner=>owner.rewards).find(item=>item.id===key);
    return {name,status:rel.status==='待达成'?'未达成':rel.status==='已达成'?'已达成'+(event?' · '+event.status:''):'已失效'};
  }
  const rewardCell=(rel,side)=>{const reward=rewardFor(rel,side);return '<b>'+ae(reward.name)+'</b><small>'+ae(reward.status)+'</small>';};
  const relationRows=relations=>relations.map(rel=>[badge(rel.merchantId?'商户邀请':'用户邀请'),inviterLabel(rel),inviteeLabel(rel),'<code>'+ae(rel.code)+'</code><small>'+dateTime(rel.boundAt)+'</small>',ae(conditionText(rel)),badge(statusText(rel)),rewardCell(rel,'inviter'),rewardCell(rel,'invitee'),ab('查看详情','g9-relation-detail',`data-id="${rel.id}"`,'secondary small')]);
  const relationTable=relations=>atable(['邀请类型','邀请人 / 手机号','被邀请人 / 手机号','邀请码 / 绑定时间','生效条件','达成状态','邀请人奖励','被邀请人奖励','操作'],relationRows(relations));
  function openRelations(title,relations){
    openModal({title,wide:true,body:relations.length?relationTable(relations):'<p class="r3-empty">暂无邀请记录</p>',footer:'<button class="button secondary" data-action="close-modal">关闭</button>'});
  }
  ar3Action('merchant-invite-records',n=>{const merchant=data().merchants.find(item=>item.id===n.dataset.id);openRelations((merchant?.name||'商户')+' · 邀请记录',data().inviteRelations.filter(rel=>rel.merchantId===n.dataset.id));});
  ar3Action('user-invite-records',n=>{const owner=user(n.dataset.id);openRelations((owner?.name||n.dataset.id)+' · 邀请记录',data().inviteRelations.filter(rel=>rel.inviterId===n.dataset.id));});
  ar3Action('valid-invite-members',n=>{const owner=user(n.dataset.id);openRelations((owner?.name||n.dataset.id)+' · 有效邀请人员',data().inviteRelations.filter(rel=>rel.inviterId===n.dataset.id&&rel.status==='已达成'));});

  function invitationPage(){
    const state=data(),tab=g6Tabs.invites;let content='',actions='';
    if(tab==='merchant'){
      actions=ab('新建商户邀请码','r3-new','data-entity="merchant"','primary');
      content=card('商户邀请码',atable(['商户 / 电话','邀请码','有效期','生效条件','新用户奖励','邀请 / 订购人数','订购次数 / 实收','状态','操作'],state.merchants.map(merchant=>[memberLabel(merchant.name,merchant.phone),'<code>'+ae(merchant.code)+'</code>',merchant.start+' 至 '+merchant.end,ae(merchant.conditionLabel||window.G9.conditionLabel(merchant.condition)),ae(merchant.withReward?rewardSummary(merchant.reward):'不发放'),(merchant.users||0)+' / '+(merchant.buyers||0),(merchant.orders||0)+' / ¥'+Number(merchant.revenue||0).toFixed(2),badge(merchant.status),ab('复制','g10-copy-merchant',`data-id="${merchant.id}"`,'secondary small')+ab('编辑','r3-edit','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')+ab(merchant.status==='启用'?'停用':'启用','r3-toggle','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')+ab('邀请记录','merchant-invite-records',`data-id="${merchant.id}"`,'secondary small')])));
    }else if(tab==='user'){
      actions=ab('活动设置','g6-settings');
      const oldName=rewardSummary(state.settings.oldReward),newName=rewardSummary(state.settings.newReward),relations=state.inviteRelations.filter(rel=>!rel.merchantId);
      content=card('用户邀请码',atable(['用户 / 手机号','邀请码','状态','有效邀请','生效条件','老用户奖励','新用户奖励','操作'],state.users.filter(owner=>owner.inviteCode).map(owner=>{const count=relations.filter(rel=>rel.inviterId===owner.id&&rel.status==='已达成').length,status=owner.inviteStatus==='停用'?'停用':!state.settings.enabled?'活动关闭':count>=state.settings.cap?'已达上限':'启用';return [memberLabel(owner.name,owner.profile?.phone),'<code>'+ae(owner.inviteCode)+'</code>',badge(status),`<span class="g12-invite-count" data-action="valid-invite-members" data-id="${ae(owner.id)}" role="button" tabindex="0">${count} / ${state.settings.cap}</span>`,ae(state.settings.conditionLabel||window.G9.conditionLabel(state.settings.condition)),ae(oldName),ae(newName),ab('邀请记录','user-invite-records',`data-id="${owner.id}"`,'secondary small')+ab(owner.inviteStatus==='停用'?'启用':'停用','g6-user-code-toggle',`data-id="${owner.id}"`,'secondary small')]})));
    }else{
      content=card('邀请记录',relationTable(state.inviteRelations));
    }
    return ar3Head('邀请码管理','商户码、用户码和邀请达成记录统一管理。',actions)+g6Stats([['商户邀请',state.inviteRelations.filter(rel=>rel.merchantId).length],['用户邀请',state.inviteRelations.filter(rel=>!rel.merchantId).length],['待达成',state.inviteRelations.filter(rel=>rel.status==='待达成').length],['补填期限',(state.settings.bindWindowDays||7)+' 天']])+g6Buttons('invites',[['merchant','商户邀请码'],['user','用户邀请码'],['records','邀请记录']])+content+'</section>';
  }
  V15_PAGES.invites=invitationPage;
  V15_PAGES['invite-relations']=()=>{g6Tabs.invites='records';return invitationPage();};
  V15_PAGES['invite-users']=V15_PAGES.invites;

  document.addEventListener('keydown',event=>{
    const target=event.target.closest('.g12-usage-link,.g12-invite-count');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.click();}
  });
  window.G12={openCouponUsage,openRelations};
})();
