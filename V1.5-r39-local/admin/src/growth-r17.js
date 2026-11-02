// V1.5-r17 stable conditional fields and unified user reward records.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const data=()=>window.R3?.state;
  const user=id=>data().users.find(item=>item.id===id);
  const template=id=>data().templates.find(item=>item.id===id);
  const ae=C.ae,clone=value=>JSON.parse(JSON.stringify(value));

  function updateProbability(stage,card){
    const mode=stage.matches('[data-g15-growth-stage]')?stage.querySelector('[data-growth-stage-field="rewardMode"]')?.value:stage.querySelector('[data-g15-stage-field="rewardMode"]')?.value;
    let meter=stage.querySelector('.g17-probability-total');
    if(!meter){meter=document.createElement('div');meter.className='g17-probability-total';stage.querySelector('[data-g15-reward-list]')?.before(meter);}
    meter.hidden=mode!=='probability';
    const total=[...stage.querySelectorAll('[data-g15-reward-row]')].filter(row=>!row.hidden).reduce((sum,row)=>sum+Number(row.querySelector('[data-g15-field="probability"]')?.value||0),0);
    const nextClass='g17-probability-total '+(Math.abs(total-100)<.001?'ok':'warn');
    const nextText=mode==='probability'?'概率合计 '+total+'%'+(Math.abs(total-100)<.001?' · 可保存':' · 需为100%'):'';
    if(meter.className!==nextClass)meter.className=nextClass;
    if(meter.textContent!==nextText)meter.textContent=nextText;
  }
  function syncRewardRow(row,stage){
    const type=row.querySelector('[data-g15-field="rewardType"]')?.value||'coupon';
    row.querySelectorAll('[data-g15-panel]').forEach(panel=>panel.hidden=panel.dataset.g15Panel!==type);
    const label=row.querySelector('[data-g17-tier-type]');const text=({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'})[type]||'优惠券';if(label&&label.textContent!==text)label.textContent=text;
    const mode=stage.matches('[data-g15-growth-stage]')?stage.querySelector('[data-growth-stage-field="rewardMode"]')?.value:stage.querySelector('[data-g15-stage-field="rewardMode"]')?.value;
    const probability=row.querySelector('[data-g15-probability]'),input=probability?.querySelector('input');
    if(probability)probability.hidden=mode!=='probability';
    if(input)input.disabled=mode!=='probability';
  }
  function syncStage(stage){
    const isGrowth=stage.matches('[data-g15-growth-stage]'),condition=stage.querySelector(isGrowth?'[data-growth-stage-field="conditionType"]':'[data-g15-stage-field="conditionType"]')?.value,active=stage.querySelector(isGrowth?'[data-growth-stage-field="activeMode"]':'[data-g15-stage-field="activeMode"]')?.value,mode=stage.querySelector(isGrowth?'[data-growth-stage-field="rewardMode"]':'[data-g15-stage-field="rewardMode"]')?.value||'fixed';
    stage.querySelectorAll(isGrowth?'[data-growth-param]':'[data-g15-param]').forEach(item=>item.hidden=(isGrowth?item.dataset.growthParam:item.dataset.g15Param)!==condition);
    const dates=stage.querySelector(isGrowth?'[data-growth-stage-dates]':'[data-g15-stage-dates]');if(dates)dates.hidden=active!=='range';
    stage.querySelectorAll('[data-g15-reward-row]').forEach((row,index)=>{row.hidden=mode==='fixed'&&index>0;syncRewardRow(row,stage);});
    const title=stage.querySelector('header h3'),name=stage.querySelector(isGrowth?'[data-growth-stage-field="name"]':'[data-g15-stage-field="name"]')?.value;if(title&&title.textContent!==(name||'未命名阶段'))title.textContent=name||'未命名阶段';
    updateProbability(stage);
  }
  function syncPage(scope=document){
    scope.querySelectorAll?.('[data-g15-stage],[data-g15-growth-stage]').forEach(syncStage);
    scope.querySelectorAll?.('.g15-inline-condition').forEach(row=>{const type=row.querySelector('select')?.value;row.querySelectorAll('[data-g15-param]').forEach(item=>item.hidden=item.dataset.g15Param!==type);});
    if(scope.matches?.('[data-g15-stage],[data-g15-growth-stage]'))syncStage(scope);
  }
  document.addEventListener('change',event=>{const stage=event.target.closest('[data-g15-stage],[data-g15-growth-stage]');if(stage)syncStage(stage);const condition=event.target.closest('.g15-inline-condition');if(condition)syncPage(condition.closest('.g15-condition-box')||condition.parentElement);});
  document.addEventListener('input',event=>{const stage=event.target.closest('[data-g15-stage],[data-g15-growth-stage]');if(stage)syncStage(stage);});
  setTimeout(()=>syncPage(document),0);
  document.addEventListener('click',event=>{const add=event.target.closest('[data-action="g15-add-stage"],[data-action="g15-add-growth-stage"]');if(!add)return;setTimeout(()=>{window.R16?.initAccordions(document);syncPage(document);},40);},true);

  const baseInviteSettings=C.V15_PAGES['invite-settings'];
  C.V15_PAGES['invite-settings']=function(){const html=baseInviteSettings();setTimeout(()=>{window.R16?.initAccordions(document);window.G9?.enhanceRewardPickers(document);syncPage(document);},0);return html;};
  const baseGrowthForm=C.V15_PAGES['user-growth-form'];
  C.V15_PAGES['user-growth-form']=function(){const html=baseGrowthForm();setTimeout(()=>{window.R16?.initAccordions(document);window.G9?.enhanceRewardPickers(document);syncPage(document);},0);return html;};

  function rewardPath(source='',id=''){
    const text=String(source)+' '+String(id);
    if(/邀请|受邀|invite/i.test(text))return '邀请码奖励';
    if(/用户成长|growth/i.test(text))return '用户成长奖励';
    if(/问卷|survey/i.test(text))return '问卷奖励';
    if(/打卡|连续|checkin/i.test(text))return '连续打卡奖励';
    if(/后台|管理员|运营|下发/.test(text))return '后台发放';
    if(/系统|自动/.test(text))return '系统发放';
    return '其他奖励';
  }
  function rewardContent(event,owner){
    const config=event.config||template(event.config?.couponId)||{};
    if(event.type==='coupon'){const coupon=template(config.couponId)||owner.wallet.find(wallet=>wallet.id===event.walletId||wallet.key===event.id);return coupon?('优惠券 · ¥'+coupon.amount+(coupon.threshold?' / 满 ¥'+coupon.threshold:' / 无门槛')):'优惠券';}
    if(event.type==='meal')return '赠餐 '+Number(config.count||String(event.name||'').match(/\d+/)?.[0]||1)+' 餐';
    if(event.type==='custom')return '自定义奖励'+(event.reason?' · '+event.reason:'');
    return event.name||'奖励';
  }
  function rewardRecords(){
    const records=[];
    for(const owner of data().users){
      const eventIds=new Set(),referencedWallets=new Set();
      for(const event of owner.rewards||[]){
        eventIds.add(event.id);if(event.walletId)referencedWallets.add(event.walletId);
        const wallet=(owner.wallet||[]).find(item=>item.id===event.walletId||item.key===event.id);
        if(wallet)referencedWallets.add(wallet.id);
        records.push({id:'E-'+event.id,userId:owner.id,userName:owner.name,phone:owner.profile?.phone||'—',name:event.name||(event.type==='coupon'?'优惠券奖励':event.type==='meal'?'赠餐奖励':'自定义奖励'),type:event.type||'other',content:rewardContent(event,owner),path:rewardPath(event.source,event.id),source:event.source||'奖励系统',status:event.status||'已发放',time:event.time||event.issuedAt||new Date(0).toISOString(),walletId:event.walletId||wallet?.id||'',orderId:wallet?.orderId||''});
      }
      for(const wallet of owner.wallet||[]){
        if(referencedWallets.has(wallet.id)||eventIds.has(wallet.key))continue;
        records.push({id:'W-'+wallet.id,userId:owner.id,userName:owner.name,phone:owner.profile?.phone||'—',name:wallet.name||'优惠券',type:'coupon',content:'优惠券 · ¥'+wallet.amount+(wallet.threshold?' / 满 ¥'+wallet.threshold:' / 无门槛'),path:rewardPath(wallet.source,wallet.id),source:wallet.source||'优惠券发放',status:'已发放',time:wallet.obtainedAt||new Date(0).toISOString(),walletId:wallet.id,orderId:wallet.orderId||''});
      }
    }
    return records.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
  }
  function rewardSummary(records=rewardRecords()){
    const map=new Map();
    for(const record of records){let item=map.get(record.userId);if(!item){item={userId:record.userId,userName:record.userName,phone:record.phone,total:0,issued:0,pendingClaim:0,pendingIssue:0,paths:{},latest:record.time};map.set(record.userId,item);}item.total++;if(record.status==='已发放')item.issued++;else if(record.status==='待领取')item.pendingClaim++;else if(record.status==='待发放')item.pendingIssue++;item.paths[record.path]=(item.paths[record.path]||0)+1;if(Date.parse(record.time)>Date.parse(item.latest))item.latest=record.time;}
    return [...map.values()].map(item=>({...item,mainPath:Object.entries(item.paths).sort((a,b)=>b[1]-a[1])[0]?.[0]||'其他奖励'})).sort((a,b)=>Date.parse(b.latest)-Date.parse(a.latest));
  }
  const typeLabel=type=>type==='coupon'?'优惠券':type==='meal'?'赠餐':type==='custom'?'自定义奖励':'其他';
  function detailTable(records,compact=false){
    const headers=compact?['用户','奖励','内容','获得途径','状态','获得时间']:['用户 / ID','手机号','奖励名称','奖励内容','获得途径','奖励来源','状态','获得时间','关联券包','操作'];
    const rows=records.map(record=>compact?[ '<b>'+ae(record.userName)+'</b><small>'+ae(record.userId)+'</small>','<b>'+ae(record.name)+'</b><small>'+typeLabel(record.type)+'</small>',ae(record.content),ae(record.path),C.badge(record.status),C.dateTime(record.time)]:[ '<b>'+ae(record.userName)+'</b><small>'+ae(record.userId)+'</small>',ae(record.phone),'<b>'+ae(record.name)+'</b><small>'+typeLabel(record.type)+'</small>',ae(record.content),C.badge(record.path),ae(record.source),C.badge(record.status),C.dateTime(record.time),ae(record.walletId||'—'),C.ab('详情','g17-reward-detail',`data-id="${record.id}"`,'secondary small')]);
    return C.atable(headers,rows).replace('class="data-table"','class="data-table g19-reward-detail-table"');
  }
  C.g6Tabs.rewardView=C.g6Tabs.rewardView||'summary';
  C.ar3Action('g17-reward-view',node=>{C.g6Tabs.rewardView=node.dataset.view;C.renderApp();});
  C.ar3Action('g17-user-reward-details',node=>{const records=rewardRecords().filter(record=>record.userId===node.dataset.id),owner=user(node.dataset.id);C.openModal({title:(owner?.name||node.dataset.id)+' · 全部奖励明细',wide:true,body:records.length?detailTable(records,false):'<p class="r3-empty">该用户暂无奖励记录</p>',footer:C.ab('关闭','close-modal','','secondary')});});
  C.ar3Action('g17-reward-detail',node=>{const record=rewardRecords().find(item=>item.id===node.dataset.id);if(!record)return;C.openModal({title:'奖励详情 · '+record.name,wide:false,body:'<div class="g10-coupon-detail"><div><span>领取用户</span><b>'+ae(record.userName+' · '+record.userId)+'</b></div><div><span>奖励内容</span><b>'+ae(record.content)+'</b></div><div><span>获得途径</span><b>'+ae(record.path)+'</b></div><div><span>奖励来源</span><b>'+ae(record.source)+'</b></div><div><span>发放状态</span><b>'+ae(record.status)+'</b></div><div><span>获得时间</span><b>'+ae(C.dateTime(record.time))+'</b></div><div><span>关联券包</span><b>'+ae(record.walletId||'—')+'</b></div><div><span>关联订单</span><b>'+ae(record.orderId||'—')+'</b></div></div>',footer:C.ab('关闭','close-modal','','secondary')});});
  C.V15_PAGES['invite-rewards']=function(){const records=rewardRecords(),summary=rewardSummary(records),view=C.g6Tabs.rewardView,rows=view==='summary'?summary.map(item=>['<b>'+ae(item.userName)+'</b><small>'+ae(item.userId)+'</small>',ae(item.phone),item.total,item.issued,item.pendingClaim,item.pendingIssue,ae(item.mainPath),C.dateTime(item.latest),C.ab('查看详情','g17-user-reward-details',`data-id="${item.userId}"`,'secondary small')]):[];const content=view==='summary'?C.atable(['用户 / ID','手机号','奖励总数','已发放','待领取','待发放','主要途径','最近获得','操作'],rows):detailTable(records);return C.ar3Head('奖励记录','按用户汇总全部已获得奖励，或查看按时间降序的完整明细。')+C.g6Stats([['奖励总条数',records.length],['获奖用户',summary.length],['待领取',records.filter(item=>item.status==='待领取').length],['待发放',records.filter(item=>item.status==='待发放').length]])+C.g6Buttons('rewardView',[['summary','用户汇总'],['details','奖励明细']])+C.card(view==='summary'?'用户奖励汇总':'奖励明细',content)+'</section>';};

  window.R17={syncPage,syncStage};
  window.G17Rewards={records:rewardRecords,summary:rewardSummary,rewardPath};
})();
