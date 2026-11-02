// V1.5-r13 coupon detail panels, invitation QR codes and merchant reward stages.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const {V15_PAGES,g6Tabs,ar3Head,atable,card,ab,badge,ae,af,ar3Action,openModal,openDrawer,closeModal,renderApp,navigate,g6Stats,g6Buttons,rewardSummary,dateTime}=C;
  const data=()=>window.R3?.state;
  const user=id=>data()?.users.find(item=>item.id===id);
  const template=id=>data()?.templates.find(item=>item.id===id);
  const today=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(data().now));
  const walletStatus=wallet=>wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<today()?'已过期':wallet.start>today()?'待生效':'可使用';
  const channel=wallet=>{
    if(wallet.source==='后台下发'||wallet.grantedBy==='运营管理员')return {type:'后台手动下发',activity:'后台发券'};
    if(/邀请/.test(wallet.source))return {type:'系统自动下发',activity:'邀请活动'};
    if(/问卷/.test(wallet.source))return {type:'系统自动下发',activity:'问卷活动'};
    if(/打卡/.test(wallet.source))return {type:'系统自动下发',activity:'连续打卡活动'};
    return {type:'系统自动下发',activity:wallet.source||'系统活动'};
  };
  const orderFor=(owner,wallet)=>wallet.orderId?owner.orders.find(order=>order.id===wallet.orderId):null;
  const validCoupons=()=>data().templates.filter(coupon=>coupon.status==='启用');
  const pagerButtons=(pages,current)=>{
    const values=[];
    for(let page=1;page<=pages;page++)if(pages<=7||page===1||page===pages||Math.abs(page-current)<=1)values.push(page);
    return [...new Set(values)].sort((a,b)=>a-b).map((page,index)=>`${index&&page-values[index-1]>1?'<span class="page-ellipsis">…</span>':''}<button type="button" data-page="${page}" class="${page===current?'active':''}">${page}</button>`).join('');
  };
  function dataTable(headers,rows){
    return '<div class="table-wrap g13-data-table"><table class="data-table" data-g7="yes"><thead><tr>'+headers.map(item=>'<th>'+ae(item)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function mountFilteredTable(root,config){
    const query=root.querySelector('[data-g13-query]'),status=root.querySelector('[data-g13-status]'),channelBox=root.querySelector('[data-g13-channel]'),tbody=root.querySelector('[data-g13-rows]'),pager=root.querySelector('[data-g13-pager]'),sizeBox=root.querySelector('[data-g13-size]'),jump=root.querySelector('[data-g13-jump]'),empty=root.querySelector('[data-g13-empty]');
    let page=1,pageSize=10,applied={query:'',status:'',channel:''};
    const filtered=()=>config.rows.filter(row=>{
      const keyword=applied.query;
      if(keyword&&!row.search.toLowerCase().includes(keyword))return false;
      if(applied.status&&row.status!==applied.status)return false;
      if(applied.channel&&row.channel!==applied.channel)return false;
      return true;
    });
    function render(){
      const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
      const visible=rows.slice((page-1)*pageSize,page*pageSize);
      tbody.innerHTML=visible.map(row=>'<tr>'+row.cells.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('');
      empty.hidden=rows.length>0;tbody.closest('.table-wrap').hidden=rows.length===0;
      pager.innerHTML='<span>共 '+rows.length+' 条 · 第 '+page+' / '+pages+' 页</span><div class="g13-page-buttons"><button type="button" data-prev '+(page===1?'disabled':'')+'>上一页</button>'+pagerButtons(pages,page)+'<button type="button" data-next '+(page===pages?'disabled':'')+'>下一页</button></div>';
      jump.max=String(pages);jump.value=String(page);window.R22?.people(root);
      pager.querySelector('[data-prev]').onclick=()=>{page=Math.max(1,page-1);render();};
      pager.querySelector('[data-next]').onclick=()=>{page=Math.min(pages,page+1);render();};
      pager.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>{page=Number(button.dataset.page);render();});
    }
    const find=()=>{applied={query:query?.value.trim().toLowerCase()||'',status:status?.value||'',channel:channelBox?.value||''};page=1;render();};const findButton=document.createElement('button');findButton.className='button primary small';findButton.type='button';findButton.textContent='查找';root.querySelector('[data-g13-reset]')?.before(findButton);findButton.onclick=find;root.querySelector('.g13-filters')?.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();find();}});
    root.querySelector('[data-g13-reset]')?.addEventListener('click',()=>{if(query)query.value='';if(status)status.value='';if(channelBox)channelBox.value='';find();});
    sizeBox.addEventListener('change',()=>{pageSize=Number(sizeBox.value)||10;page=1;render();});
    jump.addEventListener('change',()=>{page=Math.max(1,Math.min(Number(jump.value)||1,Number(jump.max)));render();});
    window.R19?.prepareFilters(root);render();
  }

  function openCouponUsage(templateId){
    const coupon=template(templateId);if(!coupon)return;
    const rows=[];
    for(const owner of data().users)for(const wallet of owner.wallet.filter(item=>item.templateId===templateId)){
      const info=channel(wallet),order=orderFor(owner,wallet),state=walletStatus(wallet);
      rows.push({
        search:[owner.name,owner.id,owner.profile?.phone||'',wallet.id].join(' '),status:state,channel:info.type,
        cells:[
          '<b>'+ae(owner.name)+'</b><small>'+ae(owner.id)+'</small>',ae(owner.profile?.phone||'—'),ae(info.type),ae(info.activity),dateTime(wallet.obtainedAt),ae(wallet.start+' 至 '+wallet.expire),badge(state),state==='已使用'?'是':'否',dateTime(wallet.usedAt)
        ]
      });
    }
    openModal({title:'发放 / 使用明细 · '+coupon.name,wide:true,body:
      '<div class="g13-detail-only" data-g13-detail>'+
        '<div class="g13-filters"><label>人员、用户号或手机号<input data-g13-query placeholder="输入关键词"></label><label>当前状态<select data-g13-status><option value="">全部状态</option>'+['待发放','待生效','可使用','已使用','已过期','已撤回'].map(item=>'<option>'+item+'</option>').join('')+'</select></label><label>发放渠道<select data-g13-channel><option value="">全部渠道</option><option>后台手动下发</option><option>系统自动下发</option></select></label><button type="button" class="button secondary small" data-g13-reset>重置</button></div>'+
        dataTable(['领取人','手机号','发放渠道','活动来源','发放时间','有效期','当前状态','是否使用','使用时间'],[]).replace('<tbody></tbody>','<tbody data-g13-rows></tbody>')+
        '<p class="r3-empty g13-empty" data-g13-empty hidden>没有符合筛选条件的发放记录</p>'+
        '<footer class="g13-pager"><div data-g13-pager></div><select data-g13-size><option value="10">10 条/页</option><option value="20">20 条/页</option><option value="30">30 条/页</option></select><label>跳至 <input data-g13-jump type="number" min="1" value="1"> 页</label></footer>'+
      '</div>'
    });
    mountFilteredTable(document.querySelector('[data-g13-detail]'),{rows});
  }
  ar3Action('coupon-usage-detail',node=>openCouponUsage(node.dataset.id));

  function openUserCouponList(listId,scope){
    const owner=user(listId);if(!owner)return;
    const rows=owner.wallet.map(wallet=>{
      const state=walletStatus(wallet),info=channel(wallet),order=orderFor(owner,wallet);
      return {
        search:[wallet.name,wallet.id,wallet.source||'',order?.id||''].join(' '),status:state,channel:info.type,
        cells:['<b>'+ae(wallet.name)+'</b><small>'+ae(wallet.id)+'</small>',ae(info.type+' · '+info.activity),dateTime(wallet.obtainedAt),ae(wallet.start+' 至 '+wallet.expire),badge(state)]
      };
    }).filter(row=>scope==='总数'||row.status===scope);
    openModal({title:(owner.name||owner.id)+' · '+(scope==='总数'?'全部优惠券':scope),wide:true,body:
      '<div class="g13-detail-only" data-g13-detail><div class="g13-filters"><label>优惠券、来源或券号<input data-g13-query placeholder="输入关键词"></label><label>当前状态<select data-g13-status><option value="">全部状态</option>'+['待生效','可使用','已使用','已过期','已撤回'].map(item=>'<option>'+item+'</option>').join('')+'</select></label><label>发放渠道<select data-g13-channel><option value="">全部渠道</option><option>后台手动下发</option><option>系统自动下发</option></select></label><button type="button" class="button secondary small" data-g13-reset>重置</button></div>'+dataTable(['优惠券','来源','获得时间','有效期','状态'],[]).replace('<tbody></tbody>','<tbody data-g13-rows></tbody>')+'<p class="r3-empty g13-empty" data-g13-empty hidden>该用户暂无此状态的优惠券</p><footer class="g13-pager"><div data-g13-pager></div><select data-g13-size><option value="10">10 条/页</option><option value="20">20 条/页</option><option value="30">30 条/页</option></select><label>跳至 <input data-g13-jump type="number" min="1" value="1"> 页</label></footer></div>'
    });
    mountFilteredTable(document.querySelector('[data-g13-detail]'),{rows});
  }
  ar3Action('g13-user-coupon-stat',node=>openUserCouponList(node.dataset.id,node.dataset.scope));

  function userCouponPage(){
    const state=data(),relations=state.inviteRelations;
    const rows=state.users.map(owner=>{
      const counts={'可使用':0,'已使用':0,'已过期':0,'已撤回':0,'待生效':0};owner.wallet.forEach(wallet=>counts[walletStatus(wallet)]++);
      const stat=(scope,value)=>`<span class="g13-stat-link" data-action="g13-user-coupon-stat" data-id="${ae(owner.id)}" data-scope="${scope}" role="button" tabindex="0">${value}</span>`;
      return ['<b>'+ae(owner.name)+'</b><small>ID：'+ae(owner.id)+'</small>',ae(owner.profile?.phone||'—'),stat('总数',owner.wallet.length),stat('可使用',counts['可使用']),stat('已使用',counts['已使用']),stat('已过期',counts['已过期']),stat('已撤回',counts['已撤回']),ab('查看详情','g8-user-coupon-detail',`data-id="${owner.id}"`,'secondary small')+ab('导出','g8-export-user',`data-id="${owner.id}"`,'secondary small')];
    });
    return ar3Head('优惠券管理','券模板、发放记录和用户优惠券统一管理。')+g6Stats([['券模板',state.templates.length],['发放记录',state.users.reduce((total,owner)=>total+owner.wallet.length,0)+state.issues.filter(job=>job.status==='待执行').length],['用户数',state.users.length],['可使用',state.users.reduce((total,owner)=>total+owner.wallet.filter(wallet=>walletStatus(wallet)==='可使用').length,0)]])+
      g6Buttons('coupons',[['templates','券模板'],['issues','发放记录'],['user-coupons','用户优惠券']])+
      card('用户优惠券',atable(['用户名称 / ID','手机号','券总数','可使用','已使用','已过期','已撤回','操作'],rows))+'</section>';
  }
  const baseCouponPage=V15_PAGES.coupons;
  V15_PAGES.coupons=function(){return g6Tabs.coupons==='user-coupons'?userCouponPage():baseCouponPage();};

  const memberLabel=(name,phone)=>'<b>'+ae(name||'—')+'</b><small>'+ae(phone||'—')+'</small>';
  const merchant=id=>data().merchants.find(item=>item.id===id);
  const relationById=id=>data().inviteRelations.find(item=>item.id===id);
  const inviterLabel=rel=>rel.merchantId?memberLabel(merchant(rel.merchantId)?.name||rel.merchantId,merchant(rel.merchantId)?.phone):memberLabel(user(rel.inviterId)?.name||rel.inviterId,user(rel.inviterId)?.id);
  const inviteeLabel=rel=>memberLabel(user(rel.userId)?.name||rel.userId,user(rel.userId)?.id);
  const conditionLabel=condition=>{if(condition?.type==='order_count')return '购餐满 '+condition.count+' 次';if(condition?.type==='order_amount')return '累计实付满 ¥'+condition.amount;if(condition?.type==='login_days')return '累计登录 '+condition.days+' 天';return '完成初始设置';};
  const stageCondition=stage=>stage.conditionLabel||conditionLabel(stage.condition);
  const relationCondition=rel=>rel.conditionLabel||conditionLabel(rel.condition);
  const stageList=rel=>Array.isArray(rel.stageSnapshots)?rel.stageSnapshots:[];
  const rewardEvent=key=>key?data().users.flatMap(owner=>owner.rewards).find(item=>item.id===key):null;
  const rewardName=stage=>{const event=rewardEvent(stage.rewardEventKey);return event?.name||(stage.rewardMode==='probability'?'概率抽奖 · '+stage.rewards.length+' 档':rewardSummary(stage.rewards||[]));};
  const stageState=stage=>{
    if(stage.status==='已达成'){const event=rewardEvent(stage.rewardEventKey);return {label:'已达成 · '+(event?.status||'已达成'),tone:'ok'};}
    if(stage.status==='已失效')return {label:'已失效',tone:'off'};
    if(stage.activeMode==='range'&&stage.start&&today()<stage.start)return {label:'未到生效时间',tone:''};
    return {label:'未达成',tone:''};
  };
  function rewardCell(rel,side){
    if(side==='inviter'&&rel.merchantId)return '<b>不发放</b><small>商户邀请码</small>';
    if(rel.merchantId){
      const stages=stageList(rel);if(!stages.length)return '<b>不发放</b><small>未配置奖励阶段</small>';
      return '<div class="g13-reward-list">'+stages.map(stage=>{const state=stageState(stage);return '<div><b>'+ae(stage.name)+'：'+ae(rewardName(stage))+'</b><small>'+ae(state.label)+'</small></div>';}).join('')+'</div>';
    }
    const snapshot=rel.rewardSnapshot||{},allowed=(snapshot.target||'both')==='both'||(snapshot.target||'both')===side;
    const reward=allowed?((side==='inviter'?snapshot.oldReward:snapshot.newReward)||[])[0]:null;
    if(!reward)return '<b>不发放</b><small>活动配置</small>';
    const name=reward.type==='coupon'?template(reward.couponId)?.name||'优惠券':reward.type==='meal'?'赠餐 '+reward.count+' 餐':reward.name||'奖励';
    const event=rewardEvent(rel.rewardKeys?.find(id=>id.endsWith(side==='inviter'?'-old':'-new')));
    return '<b>'+ae(name)+'</b><small>'+ae(rel.status==='待达成'?'未达成':rel.status==='已达成'?'已达成'+(event?' · '+event.status:''):'已失效')+'</small>';
  }
  const relationRows=relations=>relations.map(rel=>[badge(rel.merchantId?'商户邀请':'用户邀请'),inviterLabel(rel),inviteeLabel(rel),'<code>'+ae(rel.code)+'</code><small>'+dateTime(rel.boundAt)+'</small>',rel.merchantId?stageList(rel).map(stage=>'<b>'+ae(stage.name)+'</b><small>'+ae(stageCondition(stage))+'</small>').join(''):ae(relationCondition(rel)),badge(rel.status==='待达成'?'未达成':rel.status),rewardCell(rel,'inviter'),rewardCell(rel,'invitee'),ab('查看详情','g9-relation-detail',`data-id="${rel.id}"`,'secondary small')]);
  const relationTable=relations=>atable(['邀请类型','邀请人 / ID','被邀请人 / ID','邀请码 / 绑定时间','生效条件','达成状态','邀请人奖励','被邀请人奖励','操作'],relationRows(relations));
  function openRelations(title,relations){
    openModal({title,wide:true,body:relations.length?relationTable(relations):'<p class="r3-empty">暂无邀请记录</p>',footer:ab('关闭','close-modal','','secondary')});
  }
  ar3Action('merchant-invite-records',node=>openRelations((merchant(node.dataset.id)?.name||'商户')+' · 邀请记录',data().inviteRelations.filter(rel=>rel.merchantId===node.dataset.id)));
  ar3Action('user-invite-records',node=>openRelations((user(node.dataset.id)?.name||node.dataset.id)+' · 邀请记录',data().inviteRelations.filter(rel=>rel.inviterId===node.dataset.id)));
  ar3Action('valid-invite-members',node=>openRelations((user(node.dataset.id)?.name||node.dataset.id)+' · 有效邀请人员',data().inviteRelations.filter(rel=>rel.inviterId===node.dataset.id&&rel.status==='已达成')));

  function relationDetail(rel){
    const stages=stageList(rel);
    const stageTable=stages.length?dataTable(['阶段','生效条件','有效期','状态','奖励'],stages.map(stage=>['<b>'+ae(stage.name)+'</b><small>'+ae(stage.desc||'')+'</small>',ae(stageCondition(stage)),stage.activeMode==='range'?ae(stage.start+' 至 '+stage.end):'长期有效',badge(stageState(stage).label),ae(rewardName(stage))])):'<p class="r3-empty">未配置奖励阶段</p>';
    return '<div class="g9-relation-detail"><div><span>邀请类型</span><b>'+ae(rel.merchantId?'商户邀请':'用户邀请')+'</b></div><div><span>邀请人</span><b>'+inviterLabel(rel)+'</b></div><div><span>被邀请人</span><b>'+inviteeLabel(rel)+'</b></div><div><span>邀请码</span><b>'+ae(rel.code)+'</b></div><div><span>绑定时间</span><b>'+dateTime(rel.boundAt)+'</b></div><div><span>关系状态</span><b>'+ae(rel.status)+'</b></div></div>'+card('奖励阶段进度',stageTable);
  }
  ar3Action('g9-relation-detail',node=>{const rel=relationById(node.dataset.id);if(rel)openDrawer({title:'邀请详情 · '+(user(rel.userId)?.name||rel.userId),body:relationDetail(rel)});});

  function stageSummary(merchantRecord){
    const stages=(merchantRecord.rewardStages||[]).filter(stage=>stage.enabled!==false);
    if(!merchantRecord.withReward||!stages.length)return '<b>不发放</b><small>无奖励阶段</small>';
    return '<b>'+stages.length+' 个启用阶段</b><small>'+stages.map(stage=>ae(stage.name)).join('、')+'</small>';
  }
  function invitationPage(){
    const state=data(),tab=g6Tabs.invites;let content='',actions='';
    if(tab==='merchant'){
      actions=ab('新建商户邀请码','r3-new','data-entity="merchant"','primary');
      const rows=state.merchants.map(item=>[memberLabel(item.name,item.phone),'<code>'+ae(item.code)+'</code>',item.start+' 至 '+item.end,stageSummary(item),(item.users||0)+' / '+(item.buyers||0),(item.orders||0)+' / ¥'+Number(item.revenue||0).toFixed(2),badge(item.status),ab('复制','g10-copy-merchant',`data-id="${item.id}"`,'secondary small')+ab('编辑','r3-edit','data-entity="merchant" data-id="'+item.id+'"','secondary small')+ab(item.status==='启用'?'停用':'启用','r3-toggle','data-entity="merchant" data-id="'+item.id+'"','secondary small')+ab('邀请记录','merchant-invite-records',`data-id="${item.id}"`,'secondary small')+ab('下载二维码','g13-download-qr',`data-code="${item.code}" data-name="${ae(item.name)}" data-kind="商户"`,'secondary small')]);
      content=card('商户邀请码',atable(['商户 / 电话','邀请码','有效期','奖励阶段','邀请 / 订购人数','订购次数 / 实收','状态','操作'],rows));
    }else if(tab==='user'){
      actions=ab('活动设置','g6-settings');
      const relations=state.inviteRelations.filter(rel=>!rel.merchantId),oldName=rewardSummary(state.settings.oldReward),newName=rewardSummary(state.settings.newReward);
      const rows=state.users.filter(owner=>owner.inviteCode).map(owner=>{
        const count=relations.filter(rel=>rel.inviterId===owner.id&&rel.status==='已达成').length,status=owner.inviteStatus==='停用'?'停用':!state.settings.enabled?'活动关闭':count>=state.settings.cap?'已达上限':'启用';
        return [memberLabel(owner.name,owner.profile?.phone),'<code>'+ae(owner.inviteCode)+'</code>',badge(status),`<span class="g12-invite-count" data-action="valid-invite-members" data-id="${ae(owner.id)}" role="button" tabindex="0">${count} / ${state.settings.cap}</span>`,ae(state.settings.conditionLabel||conditionLabel(state.settings.condition)),ae(oldName),ae(newName),ab('邀请记录','user-invite-records',`data-id="${owner.id}"`,'secondary small')+ab(owner.inviteStatus==='停用'?'启用':'停用','g6-user-code-toggle',`data-id="${owner.id}"`,'secondary small')+ab('下载二维码','g13-download-qr',`data-code="${owner.inviteCode}" data-name="${ae(owner.name)}" data-kind="用户"`,'secondary small')];
      });
      content=card('用户邀请码',atable(['用户 / 手机号','邀请码','状态','有效邀请','生效条件','老用户奖励','新用户奖励','操作'],rows));
    }else content=card('邀请记录',relationTable(state.inviteRelations));
    return ar3Head('邀请码管理','商户码、用户码和邀请达成记录统一管理。',actions)+g6Stats([['商户邀请',state.inviteRelations.filter(rel=>rel.merchantId).length],['用户邀请',state.inviteRelations.filter(rel=>!rel.merchantId).length],['待达成',state.inviteRelations.filter(rel=>rel.status==='待达成').length],['补填期限',(state.settings.bindWindowDays||7)+' 天']])+g6Buttons('invites',[['merchant','商户邀请码'],['user','用户邀请码'],['records','邀请记录']])+content+'</section>';
  }
  V15_PAGES.invites=invitationPage;
  V15_PAGES['invite-relations']=()=>{g6Tabs.invites='records';return invitationPage();};
  V15_PAGES['invite-users']=V15_PAGES.invites;

  function safeFilename(value){return String(value||'邀请码').replace(/[\\/:*?"<>|]/g,'-').slice(0,60);}
  ar3Action('g13-download-qr',async node=>{
    const code=String(node.dataset.code||'').toUpperCase();
    if(!code)throw Error('邀请码不存在');
    await window.G13QR.download(code,'邀请二维码-'+safeFilename(node.dataset.kind)+'-'+safeFilename(node.dataset.name)+'-'+code+'.png');
    const disabled=node.dataset.kind==='用户'?data().users.find(owner=>owner.inviteCode===code)?.inviteStatus==='停用':data().merchants.find(item=>item.code===code)?.status==='停用';
    window.__g7UI?.toast?.('二维码已下载',disabled?'当前邀请码已停用，扫码后暂不能绑定':'内容：'+code);
  });

  const clone=value=>JSON.parse(JSON.stringify(value));
  const stageId=()=>'STAGE'+Date.now()+Math.random().toString(36).slice(2,5).toUpperCase();
  const conditionOptions=condition=>[['profile_complete','完成初始设置'],['order_count','新用户购餐次数'],['order_amount','新用户累计实付金额'],['login_days','新用户累计登录天数']].map(([value,label])=>'<option value="'+value+'" '+((condition?.type||'profile_complete')===value?'selected':'')+'>'+label+'</option>').join('');
  function rewardRow(stageIdValue,reward={type:'coupon',couponId:validCoupons()[0]?.id||'',probability:100},index=0){
    const couponId=reward.couponId||'',coupon=template(couponId);
    return '<div class="g13-reward-row g14-reward-row" data-g13-reward-row><label class="g14-reward-type"><span>奖励类型</span><select data-reward-field="type">'+[['coupon','优惠券'],['meal','赠餐'],['custom','自定义奖励']].map(([value,label])=>'<option value="'+value+'" '+((reward.type||'coupon')===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label><div class="g14-reward-config"><div data-reward-panel="coupon"><span>优惠券</span><select name="g13-'+stageIdValue+'-reward-'+index+'-couponId" data-reward-field="couponId" hidden>'+validCoupons().map(item=>'<option value="'+item.id+'" '+(item.id===couponId?'selected':'')+'>'+ae(item.name)+'</option>').join('')+'</select><span class="g13-choice-text">'+(coupon?ae(coupon.name+' · ¥'+coupon.amount):'尚未选择优惠券')+'</span><button type="button" class="button secondary small" data-g9-coupon-target="g13-'+stageIdValue+'-reward-'+index+'-couponId">选择优惠券</button></div><label data-reward-panel="meal"><span>赠餐数量</span><input data-reward-field="count" type="number" min="1" value="'+ae(reward.count||1)+'"></label><label data-reward-panel="custom"><span>奖励名称</span><input data-reward-field="name" value="'+ae(reward.name||'')+'"></label></div><label data-g14-probability><span>概率（%）</span><input data-reward-field="probability" type="number" min="0" max="100" value="'+ae(reward.probability??100)+'"></label>'+ab('删除档位','g13-remove-reward','','secondary small')+'</div>';
  }
  function stageCard(stage,index){
    stage.id=stage.id||stageId();
    const condition=stage.condition||{type:'profile_complete'},rewards=stage.rewards?.length?stage.rewards:[{type:'coupon',couponId:validCoupons()[0]?.id||'',probability:100}];
    return '<article class="g13-stage-card" data-g13-stage data-stage-id="'+ae(stage.id||stageId())+'"><header><div><span>奖励阶段 '+(index+1)+'</span><h4>'+ae(stage.name||'未命名阶段')+'</h4></div><label class="g13-switch"><input type="checkbox" data-stage-field="enabled" '+(stage.enabled!==false?'checked':'')+'> 开启</label><button type="button" class="button secondary small" data-action="g13-remove-stage">删除阶段</button></header><div class="r3-form-grid"><label class="r3-field"><span>邀请阶段名称</span><input data-stage-field="name" value="'+ae(stage.name||'')+'" placeholder="例如：注册礼、首单礼"></label><label class="r3-field"><span>描述（选填）</span><input data-stage-field="desc" value="'+ae(stage.desc||'')+'" placeholder="说明本阶段的可视化文案"></label><label class="r3-field"><span>邀请生效条件</span><select data-stage-field="conditionType">'+conditionOptions(condition)+'</select></label><div class="g13-condition-value">'+[
      '<label data-stage-param="profile_complete"><span>条件结果</span><em>新用户完成初始设置即达成</em></label>',
      '<label data-stage-param="order_count"><span>订单次数 ≥</span><input data-stage-field="conditionCount" type="number" min="1" value="'+ae(condition.count||1)+'"></label>',
      '<label data-stage-param="order_amount"><span>累计实付 ≥（元）</span><input data-stage-field="conditionAmount" type="number" min="1" value="'+ae(condition.amount||99)+'"></label>',
      '<label data-stage-param="login_days"><span>累计登录天数 ≥</span><input data-stage-field="conditionDays" type="number" min="1" value="'+ae(condition.days||3)+'"></label>'
    ].join('')+'</div><label class="r3-field"><span>发放方式</span><select data-stage-field="rewardMode"><option value="fixed" '+((stage.rewardMode||'fixed')==='fixed'?'selected':'')+'>固定奖励</option><option value="probability" '+(stage.rewardMode==='probability'?'selected':'')+'>概率抽奖</option></select></label><label class="r3-field"><span>生效时间</span><select data-stage-field="activeMode"><option value="always" '+(stage.activeMode!=='range'?'selected':'')+'>长期有效</option><option value="range" '+(stage.activeMode==='range'?'selected':'')+'>指定日期范围</option></select></label><div class="g13-stage-dates" data-stage-dates><label><span>开始日期</span><input data-stage-field="start" type="date" value="'+ae(stage.start||C.editing?.start||today())+'"></label><label><span>结束日期</span><input data-stage-field="end" type="date" value="'+ae(stage.end||C.editing?.end||'2027-12-31')+'"></label></div></div><div class="g13-tier-head"><div><b>奖励档位</b><small>'+(stage.rewardMode==='probability'?'概率合计必须为 100%':'固定奖励仅使用第一档')+'</small></div><button type="button" class="button secondary small" data-action="g13-add-reward">添加奖励档位</button></div><div data-g13-reward-list>'+rewards.map((reward,index)=>rewardRow(stage.id||stageId(),reward,index)).join('')+'</div></article>';
  }
  function merchantForm(){
    const record=C.editing||{},stages=Array.isArray(record.rewardStages)?record.rewardStages:(record.withReward&&record.reward?.length?[{id:stageId(),name:'注册礼',desc:'',enabled:true,condition:record.condition||{type:'profile_complete'},conditionLabel:record.conditionLabel||'',rewardMode:record.rewardMode||'fixed',rewards:record.reward,activeMode:'always',start:'',end:''}]:[{id:stageId(),name:'注册礼',desc:'新用户完成初始设置后获得奖励',enabled:true,condition:{type:'profile_complete'},conditionLabel:'完成初始设置',rewardMode:'fixed',rewards:[{type:'coupon',couponId:validCoupons()[0]?.id||'',probability:100}],activeMode:'always',start:'',end:''}]);
    const withReward=record.withReward!==false;
    return ar3Head((record.id?'编辑':'新建')+'商户邀请码','配置多阶段奖励、邀请条件、奖励档位与二维码。',ab('返回列表','r3-back'))+
      '<form id="r3-editor" data-entity="merchant"><div class="g8-invite-layout g13-invite-layout"><div class="g8-invite-main">'+
      card('基础信息','<div class="r3-form-grid">'+af('商户名称','name',record.name)+af('联系电话（选填）','phone',record.phone)+af('备注（选填）','note',record.note)+af('状态','status',record.status||'启用','select',['启用','停用'])+af('邀请码开始日期','start',record.start||'2026-10-01','date')+af('邀请码结束日期','end',record.end||'2027-12-31','date')+af('是否发放奖励','withReward',withReward?'on':'off','select',[['on','发放奖励'],['off','不发放']])+'</div>')+
      '<section class="r3-card g13-stage-section" data-g13-stage-section><div class="g13-stage-section-head"><div><h3>邀请奖励阶段</h3><p>各启用阶段独立判断、可累计发放；每个阶段最多发放一次。</p></div>'+ab('新增奖励阶段','g13-add-stage','','secondary')+'</div><div class="g13-stage-list" data-g13-stage-list>'+stages.map(stageCard).join('')+'</div><p class="r3-help">绑定时保存阶段条件的奖励快照。后续修改、停用邀请码或关闭阶段，不改变已经绑定的记录。</p></section>'+
      '</div><aside class="g8-invite-aside"><div class="g8-invite-preview g13-invite-preview"><span>邀请卡预览</span><h3 data-invite-preview-name>'+ae(record.name||'新商户邀请码')+'</h3><div class="g8-invite-code">'+(record.code||'保存后生成固定八位码')+'</div><p data-invite-preview-validity>'+ae((record.start||'2026-10-01')+' 至 '+(record.end||'2027-12-31'))+'</p><div data-invite-preview-reward></div><em data-invite-preview-status>'+ae(record.status||'启用')+'</em></div><div class="g8-rules"><b>多阶段发放规则</b><p>注册、首单、消费金额等阶段独立累计。订单只统计绑定后的未退款支付记录。</p><p>长期有效阶段不受日期限制；指定日期阶段包含开始和结束当天。</p><p>无奖励或阶段关闭时仍保存邀请关系，但不创建奖励。</p></div></aside></div><div class="r3-form-footer">'+ab('取消','r3-back')+ab('保存商户邀请码','r3-save','','primary')+'</div></form></section>';
  }
  V15_PAGES['invite-form']=function(){C.kind='merchant';return merchantForm();};

  function refreshStage(card){
    if(!card)return;
    const condition=card.querySelector('[data-stage-field="conditionType"]')?.value||'profile_complete';
    card.querySelectorAll('[data-stage-param]').forEach(item=>item.hidden=item.dataset.stageParam!==condition);
    const mode=card.querySelector('[data-stage-field="rewardMode"]')?.value||'fixed';
    const active=card.querySelector('[data-stage-field="activeMode"]')?.value||'always';
    const dates=card.querySelector('[data-stage-dates]');if(dates)dates.hidden=active!=='range';
    card.querySelectorAll('[data-g13-reward-row]').forEach((row,index)=>row.hidden=mode==='fixed'&&index>0);
    const add=card.querySelector('[data-action="g13-add-reward"]');if(add){add.disabled=mode==='fixed';add.title=mode==='fixed'?'固定奖励仅保留一个档位':'添加概率抽奖档位';}
    card.querySelectorAll('[data-g14-probability]').forEach(item=>{item.hidden=mode==='fixed';item.querySelector('input').disabled=mode==='fixed';});
    card.querySelectorAll('[data-g13-reward-row]').forEach(row=>{
      const type=row.querySelector('[data-reward-field="type"]')?.value||'coupon';
      row.querySelectorAll('[data-reward-panel]').forEach(item=>item.hidden=item.dataset.rewardPanel!==type);
    });
    const name=card.querySelector('[data-stage-field="name"]')?.value||'未命名阶段';
    const title=card.querySelector('header h4');if(title)title.textContent=name;
  }
  function refreshPreview(){
    const aside=document.querySelector('.g13-invite-preview');if(!aside)return;
    const field=name=>document.querySelector('[name="'+name+'"]')?.value||'';
    aside.querySelector('[data-invite-preview-name]').textContent=field('name')||'新商户邀请码';
    aside.querySelector('[data-invite-preview-validity]').textContent=(field('start')||'开始日期')+' 至 '+(field('end')||'结束日期');
    aside.querySelector('[data-invite-preview-status]').textContent=field('status')||'启用';
    const enabled=field('withReward')==='on',stages=[...document.querySelectorAll('[data-g13-stage]')].filter(card=>card.querySelector('[data-stage-field="enabled"]')?.checked);
    aside.querySelector('[data-invite-preview-reward]').innerHTML=!enabled?'<b>不发放奖励</b><small>仅记录邀请关系</small>':stages.length?'<b>'+stages.length+' 个启用阶段</b>'+stages.map(card=>'<small>'+ae(card.querySelector('[data-stage-field="name"]')?.value||'未命名阶段')+'</small>').join(''):'<b class="g9-error">请至少启用一个阶段</b>';
    const section=document.querySelector('[data-g13-stage-section]');if(section)section.hidden=!enabled;
  }
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-stage-field]'))refreshStage(event.target.closest('[data-g13-stage]'));
    if(event.target.matches('[data-reward-field="type"]'))refreshStage(event.target.closest('[data-g13-stage]'));
    if(['withReward','name','start','end','status'].includes(event.target.name))refreshPreview();
  });
  document.addEventListener('input',event=>{if(event.target.closest('#r3-editor[data-entity="merchant"]'))refreshPreview();});
  setTimeout(()=>document.querySelectorAll('[data-g13-stage]').forEach(refreshStage),0);
  setTimeout(refreshPreview,0);

  ar3Action('g13-add-stage',()=>{
    const list=document.querySelector('[data-g13-stage-list]');if(!list)return;
    const stage={id:stageId(),name:'新奖励阶段',desc:'',enabled:true,condition:{type:'order_count',count:1},conditionLabel:'购餐满 1 次',rewardMode:'fixed',rewards:[{type:'coupon',couponId:validCoupons()[0]?.id||'',probability:100}],activeMode:'always',start:'',end:''};
    list.insertAdjacentHTML('beforeend',stageCard(stage,list.querySelectorAll('[data-g13-stage]').length));refreshStage(list.lastElementChild);refreshPreview();
    document.querySelector('[data-g13-stage] input')?.dispatchEvent(new Event('input',{bubbles:true}));
  });
  ar3Action('g13-remove-stage',async node=>{
    const card=node.closest('[data-g13-stage]'),list=card?.parentElement;
    if(!card||!list||list.querySelectorAll('[data-g13-stage]').length<=1)throw Error('至少保留一个奖励阶段');
    if(!await window.G6.confirm('删除奖励阶段',['阶段：'+(card.querySelector('[data-stage-field="name"]')?.value||'未命名阶段'),'保存后不再用于新绑定；历史邀请快照不变。']))return;
    card.remove();refreshPreview();
  });
  ar3Action('g13-add-reward',node=>{
    const card=node.closest('[data-g13-stage]'),list=card?.querySelector('[data-g13-reward-list]');if(!list)return;
    const mode=card.querySelector('[data-stage-field="rewardMode"]')?.value;
    if(mode==='fixed')throw Error('固定奖励仅保留一个档位');
    list.insertAdjacentHTML('beforeend',rewardRow(card.dataset.stageId,{type:'coupon',couponId:validCoupons()[0]?.id||'',probability:0},list.querySelectorAll('[data-g13-reward-row]').length));
    refreshStage(card);
  });
  ar3Action('g13-remove-reward',node=>{
    const card=node.closest('[data-g13-stage]'),list=card?.querySelector('[data-g13-reward-list]'),rows=list?[...list.querySelectorAll('[data-g13-reward-row]')]:[];
    if(rows.length<=1)throw Error('每个奖励阶段至少保留一个档位');
    node.closest('[data-g13-reward-row]').remove();refreshStage(card);
  });

  function readReward(row){
    const type=row.querySelector('[data-reward-field="type"]')?.value||'coupon',probability=Number(row.querySelector('[data-reward-field="probability"]')?.value||100);
    if(type==='coupon')return {type,couponId:row.querySelector('[data-reward-field="couponId"]')?.value||'',probability};
    if(type==='meal')return {type,count:Number(row.querySelector('[data-reward-field="count"]')?.value||0),probability};
    return {type:'custom',name:row.querySelector('[data-reward-field="name"]')?.value.trim()||'',probability};
  }
  function readStages(){
    return [...document.querySelectorAll('[data-g13-stage]')].map(card=>{
      const field=name=>card.querySelector('[data-stage-field="'+name+'"]');
      const type=field('conditionType')?.value||'profile_complete';
      let condition={type};
      if(type==='order_count')condition.count=Number(field('conditionCount')?.value||1);
      if(type==='order_amount')condition.amount=Number(field('conditionAmount')?.value||99);
      if(type==='login_days')condition.days=Number(field('conditionDays')?.value||3);
      const rewardMode=field('rewardMode')?.value||'fixed',rows=[...card.querySelectorAll('[data-g13-reward-row]')].filter(row=>!row.hidden);
      return {id:card.dataset.stageId,name:field('name')?.value.trim()||'',desc:field('desc')?.value.trim()||'',enabled:Boolean(field('enabled')?.checked),condition,conditionLabel:conditionLabel(condition),rewardMode,rewards:rows.map(readReward),activeMode:field('activeMode')?.value||'always',start:field('start')?.value||'',end:field('end')?.value||''};
    });
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action="r3-save"]'),form=button?.closest('#r3-editor[data-entity="merchant"]');
    if(!button||!form)return;
    event.preventDefault();event.stopImmediatePropagation();
    const value=name=>document.querySelector('[name="'+name+'"]')?.value||'',record=C.editing||{};
    const withReward=value('withReward')==='on';
    try{
      const next={id:record.id,expectedRevision:record.id?record.revision||1:undefined,name:value('name').trim(),phone:value('phone').trim(),note:value('note').trim(),status:value('status')||'启用',start:value('start'),end:value('end'),withReward,rewardStages:withReward?readStages():[]};
      await window.R3.cmd('ADMIN_SAVE',{entity:'merchant',record:next});
      g6Tabs.invites='merchant';navigate('invites');window.__g7UI?.toast?.('商户邀请码已保存','奖励阶段与邀请记录已更新');
    }catch(error){if(!error.cancelled)window.__g7UI?.toast?.('保存未完成',error.message,'error');}
  },true);

  function downloadQrForCode(code,name,kind){
    return window.G13QR.download(code,'邀请二维码-'+safeFilename(kind)+'-'+safeFilename(name)+'-'+code+'.png');
  }
  document.addEventListener('keydown',event=>{
    const target=event.target.closest('.g13-stat-link,.g12-invite-count');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.click();}
  });
  window.G13={openCouponUsage,openUserCouponList,downloadQrForCode,readStages,refreshStage,refreshPreview};
})();
