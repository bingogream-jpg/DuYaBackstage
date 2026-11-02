// V1.5-r9 invitation conditions, coupon integration and food import.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const {V15_PAGES,g6Tabs,ar3Head,atable,card,ab,badge,note,ae,af,atable:tableFactory,g6User,rewardSummary,ar3Action,openModal,openDrawer,closeDrawer,closeModal,renderApp,navigate,g6Stats,g6Buttons}=C;
  const data=()=>window.R3.state;
  const today=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(data().now));
  const user=id=>data().users.find(item=>item.id===id);
  const template=id=>data().templates.find(item=>item.id===id);
  const relationById=id=>data().inviteRelations.find(item=>item.id===id);
  let importDraft=null;

  const conditionLabels={
    profile_complete:'完成初始设置',
    order_count:'新用户购餐次数',
    order_amount:'新用户累计实付金额',
    login_days:'新用户累计登录天数'
  };
  function conditionLabel(condition={}){
    if(condition.type==='order_count')return '购餐满 '+condition.count+' 次';
    if(condition.type==='order_amount')return '累计实付满 ¥'+condition.amount;
    if(condition.type==='login_days')return '累计登录 '+condition.days+' 天';
    return '完成初始设置';
  }
  function conditionFields(prefix,condition={}){
    const type=condition.type||'profile_complete';
    return `<div class="g9-condition-box"><div class="r3-form-grid">${af('生效条件',prefix+'ConditionType',type,'select',[['profile_complete','新用户完成初始设置'],['order_count','新用户购餐次数'],['order_amount','新用户累计实付金额'],['login_days','新用户累计登录天数']])}</div><div class="g9-condition-params" data-g9-condition-for="order_count">${af('订单次数 ≥',prefix+'ConditionCount',condition.count||1,'number')}</div><div class="g9-condition-params" data-g9-condition-for="order_amount">${af('累计实付 ≥（元）',prefix+'ConditionAmount',condition.amount||99,'number')}</div><div class="g9-condition-params" data-g9-condition-for="login_days">${af('累计登录天数 ≥',prefix+'ConditionDays',condition.days||3,'number')}</div><p class="r3-help">绑定后先记为“待达成”，完成所选条件后自动发放奖励。购餐次数和金额只统计绑定后未退款订单。</p></div>`;
  }
  function readCondition(prefix){
    const type=document.querySelector(`[name="${prefix}ConditionType"]`)?.value||'profile_complete';
    if(type==='order_count')return {type,count:Number(document.querySelector(`[name="${prefix}ConditionCount"]`)?.value||0)};
    if(type==='order_amount')return {type,amount:Number(document.querySelector(`[name="${prefix}ConditionAmount"]`)?.value||0)};
    if(type==='login_days')return {type,days:Number(document.querySelector(`[name="${prefix}ConditionDays"]`)?.value||0)};
    return {type:'profile_complete'};
  }
  function refreshConditions(scope=document){
    scope.querySelectorAll('[data-g9-condition-for]').forEach(group=>group.hidden=true);
    scope.querySelectorAll('[name$="ConditionType"]').forEach(select=>{
      const box=select.closest('.g9-condition-box'),target=box?.querySelector('[data-g9-condition-for="'+select.value+'"]');
      if(target)target.hidden=false;
    });
  }
  document.addEventListener('change',event=>{
    if(event.target.matches('[name$="ConditionType"]'))refreshConditions(event.target.closest('.g9-condition-box'));
  });

  const baseCouponForm=V15_PAGES['coupon-form'];
  V15_PAGES['coupon-form']=function(){
    const box=document.createElement('div');box.innerHTML=baseCouponForm();
    const status=box.querySelector('[name="status"]');
    if(status){
      const previous=status.value;
      status.innerHTML='<option value="启用">启用</option><option value="停用">停用</option>';
      status.value=previous==='停用'||previous==='草稿'?'停用':'启用';
    }
    return box.innerHTML;
  };

  function enhanceRewardPickers(scope=document){
    scope.querySelectorAll('.r3-reward-row select[name$="-couponId"]').forEach(select=>{
      if(select.dataset.g9Enhanced)return;
      select.dataset.g9Enhanced='yes';select.hidden=true;
      const choice=document.createElement('div');choice.className='g9-coupon-choice';
      choice.innerHTML='<div data-g9-coupon-summary></div><button type="button" class="button secondary small" data-g9-coupon-target="'+ae(select.name)+'">选择优惠券</button>';
      select.closest('label')?.after(choice);
      updateCouponChoice(select);
      select.addEventListener('change',()=>updateCouponChoice(select));
    });
  }
  function updateCouponChoice(select){
    const choice=select.closest('.r3-reward-row')?.querySelector('.g9-coupon-choice');if(!choice)return;
    const coupon=template(select.value),summary=choice.querySelector('[data-g9-coupon-summary]');
    summary.innerHTML=coupon?`<b>${ae(coupon.name)}</b><span>¥${coupon.amount} · ${coupon.threshold?'满 ¥'+coupon.threshold:'无门槛'} · ${coupon.status}</span>`:'<span class="g9-error">尚未选择可用优惠券</span>';
  }
  function couponBrandText(coupon){
    const names=(coupon.brands||[]).map(id=>data().brands.find(brand=>brand.id===id||brand.name===id)?.name||id);
    return names.length?names.join('、'):'全部品牌';
  }
  function openCouponPicker(selectName){
    const select=document.querySelector(`[name="${selectName}"]`);if(!select)return;
    const overlay=document.createElement('div');overlay.className='g9-nested-overlay';
    overlay.innerHTML='<section class="g9-nested-panel"><header><div><span>奖励配置</span><h3>选择奖励优惠券</h3></div><button type="button" data-g9-coupon-cancel aria-label="关闭">×</button></header><div class="g9-coupon-picker"><label class="g9-coupon-search">搜索<input data-g9-coupon-search placeholder="优惠券名称、金额或品牌"></label><div class="g9-coupon-list" data-g9-coupon-list></div></div><footer><button type="button" class="button secondary" data-g9-coupon-cancel>取消</button></footer></section>';
    document.body.append(overlay);
    const root=overlay.querySelector('.g9-coupon-picker'),list=root.querySelector('[data-g9-coupon-list]'),search=root.querySelector('[data-g9-coupon-search]');
    const close=()=>overlay.remove();
    function render(){
      const keyword=search.value.trim().toLowerCase();
      const rows=data().templates.filter(coupon=>!keyword||[coupon.name,String(coupon.amount),couponBrandText(coupon)].join(' ').toLowerCase().includes(keyword));
      list.innerHTML=rows.map(coupon=>`<button type="button" class="g9-coupon-option ${coupon.id===select.value?'selected':''}" data-g9-coupon-id="${coupon.id}" ${coupon.status!=='启用'?'disabled':''}><span class="g9-coupon-amount">¥${coupon.amount}</span><span class="g9-coupon-main"><b>${ae(coupon.name)}</b><small>${coupon.threshold?'满 ¥'+coupon.threshold:'无门槛'} · ${ae(couponBrandText(coupon))} · ${coupon.validMode==='relative'?'领取后'+coupon.days+'天':coupon.start+' 至 '+coupon.end}</small></span><em>${ae(coupon.status)}</em></button>`).join('')||'<p class="r3-empty">没有匹配的优惠券</p>';
      list.querySelectorAll('[data-g9-coupon-id]:not([disabled])').forEach(button=>button.addEventListener('click',()=>{
        select.value=button.dataset.g9CouponId;select.dispatchEvent(new Event('change',{bubbles:true}));close();
      }));
    }
    search.addEventListener('input',render);overlay.querySelectorAll('[data-g9-coupon-cancel]').forEach(button=>button.addEventListener('click',close));render();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-g9-coupon-target]');if(!button)return;
    event.preventDefault();event.stopPropagation();openCouponPicker(button.dataset.g9CouponTarget);
  },true);
  document.addEventListener('change',event=>{
    if(event.target.matches('[name$="-couponId"]'))updateCouponChoice(event.target);
  });

  const baseInviteForm=V15_PAGES['invite-form'];
  V15_PAGES['invite-form']=function(){
    const box=document.createElement('div');box.innerHTML=baseInviteForm();
    const main=box.querySelector('.g8-invite-main'),first=main?.querySelector('.r3-card');
    if(first){
      const holder=document.createElement('div');holder.innerHTML=card('邀请生效条件',conditionFields('merchant',C.editing?.condition));
      first.after(holder.firstElementChild);refreshConditions(holder);
    }
    setTimeout(()=>enhanceRewardPickers(document),0);
    return box.innerHTML;
  };

  function openSettingsModal(){
    const settings=data().settings,box=document.createElement('div');box.innerHTML=C.ar3SettingsForm();
    const grid=box.querySelector('.r3-form-grid');
    if(grid)grid.insertAdjacentHTML('beforeend',conditionFields('invite',settings.condition));
    openModal({title:'用户邀请活动设置',body:box.innerHTML,wide:true});
    setTimeout(()=>{const root=document.querySelector('#modal-root');refreshConditions(root);enhanceRewardPickers(root);},0);
  }
  ar3Action('g6-settings',openSettingsModal);

  function inviterLabel(rel){
    if(rel.merchantId)return (data().merchants.find(item=>item.id===rel.merchantId)?.name||rel.merchantId)+'<small>商户</small>';
    const inviter=user(rel.inviterId);return ae(inviter?.name||rel.inviterId||'—')+'<small>'+ae(inviter?.id||'')+'</small>';
  }
  function inviteeLabel(rel){const invitee=user(rel.userId);return ae(invitee?.name||rel.userId)+'<small>'+ae(rel.userId)+'</small>';}
  function rewardText(rel){
    if(!rel.rewardKeys?.length)return rel.status==='待达成'?'待达成后发放':'不发放';
    return rel.rewardKeys.map(id=>data().users.flatMap(item=>item.rewards.map(reward=>({reward,owner:item}))).find(item=>item.reward.id===id)).filter(Boolean).map(item=>ae(item.reward.name)+' · '+ae(item.reward.status)).join('<br>')||'奖励记录已归档';
  }
  function relationTable(relations){
    return atable(['邀请类型','邀请人 / 商户','被邀请人','邀请码 / 绑定时间','生效条件','达成状态','奖励状态','操作'],relations.map(rel=>[
      badge(rel.merchantId?'商户邀请':'用户邀请'),
      inviterLabel(rel),
      inviteeLabel(rel),
      '<code>'+ae(rel.code)+'</code><small>'+C.dateTime(rel.boundAt)+'</small>',
      ae(rel.conditionLabel||conditionLabel(rel.condition)),
      badge(rel.status),
      rewardText(rel),
      ab('查看详情','g9-relation-detail',`data-id="${rel.id}"`,'secondary small')
    ]));
  }
  function relationDetail(rel){
    return '<div class="g9-relation-detail"><div><span>邀请类型</span><b>'+ae(rel.type==='merchant'?'商户邀请':'用户邀请')+'</b></div><div><span>邀请人</span><b>'+inviterLabel(rel)+'</b></div><div><span>被邀请人</span><b>'+inviteeLabel(rel)+'</b></div><div><span>邀请码</span><b>'+ae(rel.code)+'</b></div><div><span>绑定时间</span><b>'+C.dateTime(rel.boundAt)+'</b></div><div><span>生效条件</span><b>'+ae(rel.conditionLabel||conditionLabel(rel.condition))+'</b></div><div><span>达成状态</span><b>'+ae(rel.status)+'</b></div><div><span>达成时间</span><b>'+C.dateTime(rel.metAt)+'</b></div><div><span>奖励状态</span><b>'+rewardText(rel)+'</b></div></div>';
  }

  function invitationPage(){
    const state=data(),tab=g6Tabs.invites,userRelations=state.inviteRelations.filter(item=>!item.merchantId),merchantRelations=state.inviteRelations.filter(item=>item.merchantId);
    let content='',actions='';
    if(tab==='merchant'){
      actions=ab('新建商户邀请码','r3-new','data-entity="merchant"','primary');
      const rows=state.merchants.map(merchant=>[
        '<b>'+ae(merchant.name)+'</b><small>'+ae(merchant.note||'')+'</small>',
        '<code>'+ae(merchant.code)+'</code>',
        merchant.start+' 至 '+merchant.end,
        ae(merchant.conditionLabel||conditionLabel(merchant.condition)),
        ae(merchant.withReward?rewardSummary(merchant.reward):'不发放'),
        (merchant.users||0)+' / '+(merchant.buyers||0),
        (merchant.orders||0)+' / ¥'+Number(merchant.revenue||0).toFixed(2),
        badge(merchant.status),
        ab('复制','g8-copy-code',`data-code="${merchant.code}"`,'secondary small')+ab('编辑','r3-edit','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')+ab(merchant.status==='启用'?'停用':'启用','r3-toggle','data-entity="merchant" data-id="'+merchant.id+'"','secondary small')
      ]);
      content=card('商户邀请码',atable(['商户','邀请码','有效期','生效条件','新用户奖励','邀请 / 订购人数','订购次数 / 实收','状态','操作'],rows));
    }else if(tab==='user'){
      actions=ab('新增用户邀请码','g8-new-user-code','','primary')+ab('活动设置','g6-settings');
      const oldName=rewardSummary(state.settings.oldReward),newName=rewardSummary(state.settings.newReward);
      const rows=state.users.filter(item=>item.inviteCode).map(item=>{
        const count=userRelations.filter(rel=>rel.inviterId===item.id&&rel.status==='已达成').length;
        const status=item.inviteStatus==='停用'?'停用':!state.settings.enabled?'活动关闭':state.settings.start>today()?'尚未开始':state.settings.end<today()?'已结束':count>=state.settings.cap?'已达上限':'启用';
        return ['<b>'+ae(item.name)+'</b><small>'+ae(item.id)+'</small>',ae(item.profile?.phone||'—'),'<code>'+ae(item.inviteCode)+'</code>',badge(status),count+' / '+state.settings.cap,ae(state.settings.conditionLabel||conditionLabel(state.settings.condition)),ae(oldName),ae(newName),ab('复制','g8-copy-code',`data-code="${item.inviteCode}"`,'secondary small')+ab('查看记录','g9-user-invites',`data-id="${item.id}"`,'secondary small')+ab(item.inviteStatus==='停用'?'启用':'停用','g6-user-code-toggle',`data-id="${item.id}"`,'secondary small')];
      });
      content=card('用户邀请码',atable(['用户','手机号','邀请码','状态','有效邀请','生效条件','老用户奖励','新用户奖励','操作'],rows));
    }else{
      content=card('邀请记录',relationTable(state.inviteRelations));
    }
    return ar3Head('邀请码管理','商户码、用户码和邀请达成记录统一管理。',actions)+
      g6Stats([['商户邀请',merchantRelations.length],['用户邀请',userRelations.length],['待达成',state.inviteRelations.filter(item=>item.status==='待达成').length],['补填期限',(state.settings.bindWindowDays||7)+' 天']])+
      g6Buttons('invites',[['merchant','商户邀请码'],['user','用户邀请码'],['records','邀请记录']])+content+'</section>';
  }
  V15_PAGES.invites=invitationPage;
  V15_PAGES['invite-relations']=()=>{g6Tabs.invites='records';return invitationPage();};
  V15_PAGES['invite-users']=V15_PAGES.invites;
  V15_PAGES['invite-rewards']=V15_PAGES.invites;

  ar3Action('g9-relation-detail',n=>{const rel=relationById(n.dataset.id);openDrawer({title:'邀请详情 · '+(user(rel.userId)?.name||rel.userId),body:relationDetail(rel)});});
  ar3Action('g9-user-invites',n=>{const owner=user(n.dataset.id);openDrawer({title:owner.name+' · 邀请记录',body:card('邀请记录',relationTable(data().inviteRelations.filter(rel=>rel.inviterId===owner.id)))});});

  function openFoodImport(){
    importDraft={rows:[],errors:[],skipped:[],filename:''};
    openModal({title:'批量导入食物',wide:true,body:`<div class="g9-food-import"><div class="g9-import-head"><div><b>按模板批量导入</b><p>支持 XLSX、CSV；热量、碳水、蛋白质、脂肪必须填写；所有食物统一按每100克保存。</p></div><button type="button" class="button secondary" data-g9-download-template>下载导入模板</button></div><label class="g9-import-drop"><span>选择或拖入文件</span><small data-g9-file-name>尚未选择文件</small><input type="file" accept=".xlsx,.xls,.csv" data-g9-import-file></label><div data-g9-import-result></div></div>`,footer:'<button type="button" class="button secondary" data-g9-import-cancel>取消</button><button type="button" class="button primary" data-g9-import-confirm disabled>确认导入</button>'});
    const root=document.querySelector('.g9-food-import'),fileInput=root.querySelector('[data-g9-import-file]'),result=root.querySelector('[data-g9-import-result]'),confirm=document.querySelector('[data-g9-import-confirm]');
    document.querySelector('[data-g9-download-template]').onclick=()=>downloadFoodTemplate();
    document.querySelector('[data-g9-import-cancel]').onclick=closeModal;
    fileInput.addEventListener('change',async()=>{const file=fileInput.files[0];if(!file)return;root.querySelector('[data-g9-file-name]').textContent=file.name;try{const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'}),rows=XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]],{defval:''});importDraft=validateImportRows(rows,file.name);renderImportResult(result,confirm);}catch(error){importDraft={rows:[],errors:[error.message],skipped:[],filename:file.name};renderImportResult(result,confirm);}});
    confirm.onclick=async()=>{
      if(importDraft.errors.length||!importDraft.rows.length)return;
      if(!await window.G6.confirm('确认导入食物',[`文件：${importDraft.filename}`,`将导入 ${importDraft.rows.length} 条食物。`,importDraft.skipped.length?`跳过 ${importDraft.skipped.length} 条同名或重复条码记录。`:'没有重复记录需要跳过。']))return;
      window.R3.skipConfirm=true;
      try{const resultData=await window.R3.cmd('ADMIN_IMPORT_FOODS',{rows:importDraft.rows});closeModal();renderApp();window.__g7UI?.toast?.('批量导入完成','成功 '+resultData.imported+' 条，跳过 '+resultData.skipped.length+' 条');}catch(error){importDraft.errors=[error.message];renderImportResult(result,confirm);}finally{window.R3.skipConfirm=false;}
    };
  }
  function downloadFoodTemplate(){
    const headers=['食物名称','分类','每100克热量','碳水','蛋白质','脂肪','膳食纤维','条码'],example=['示例鸡胸饭','套餐菜品',139,15,11,4,3.4,'6900000999999'];
    const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.aoa_to_sheet([headers,example]),'食物导入模板');XLSX.writeFile(workbook,'渡鸦管家-r9-食物导入模板.xlsx');
  }
  function validateImportRows(rows,filename){
    rows=rows.map(row=>({...row,'每100克热量':row['每100克热量']??row['每100基准量热量']??row['每100毫升热量']??row['热量']??row.kcal}));
    const errors=[],skipped=[],accepted=[],names=new Set(data().foods.map(item=>String(item.name||'').trim())),barcodes=new Set(data().foods.map(item=>item.barcode).filter(Boolean));
    rows.forEach((row,index)=>{
      const line=index+2,name=String(row['食物名称']||'').trim(),barcode=String(row['条码']||'').trim();
      if(!name){errors.push('第 '+line+' 行缺少食物名称');return;}
      for(const key of ['每100克热量','碳水','蛋白质','脂肪'])if(row[key]===''||row[key]==null||!Number.isFinite(Number(row[key]))){errors.push('第 '+line+' 行'+key+'无效');return;}
      if(barcode&&!/^\d{8,14}$/.test(barcode)){errors.push('第 '+line+' 行条码格式无效');return;}
      if(names.has(name)||(barcode&&barcodes.has(barcode))){skipped.push({line,name,reason:names.has(name)?'同名食物已存在':'条码已存在'});return;}
      names.add(name);if(barcode)barcodes.add(barcode);accepted.push(row);
    });
    return {rows:accepted,errors,skipped,filename};
  }
  function renderImportResult(container,confirm){
    if(!importDraft){confirm.disabled=true;container.innerHTML='';return;}
    const preview=importDraft.rows.slice(0,8).map((row,index)=>`<tr><td>${index+2}</td><td>${ae(row['食物名称']||'')}</td><td>${ae(row['分类']||'主食')}</td><td>${ae(row['每100克热量']??'')}</td><td>${ae(row['碳水']??'')}</td><td>${ae(row['蛋白质']??'')}</td><td>${ae(row['脂肪']??'')}</td></tr>`).join('');
    container.innerHTML=`<div class="g9-import-summary"><span>有效 <b>${importDraft.rows.length}</b> 条</span><span>跳过 <b>${importDraft.skipped.length}</b> 条</span><span class="${importDraft.errors.length?'g9-error':''}">错误 <b>${importDraft.errors.length}</b> 条</span></div>${preview?`<div class="table-wrap"><table class="data-table" data-g7="yes"><thead><tr><th>行</th><th>食物名称</th><th>分类</th><th>热量/100克</th><th>碳水</th><th>蛋白质</th><th>脂肪</th></tr></thead><tbody>${preview}</tbody></table></div>`:''}${importDraft.errors.length?`<div class="g9-import-errors">${importDraft.errors.slice(0,8).map(message=>'<p>'+ae(message)+'</p>').join('')}</div>`:''}${importDraft.skipped.length?`<div class="g9-import-errors skipped">${importDraft.skipped.slice(0,8).map(item=>'<p>第 '+item.line+' 行 '+ae(item.name)+'：'+ae(item.reason)+'</p>').join('')}</div>`:''}`;
    confirm.disabled=importDraft.errors.length>0||!importDraft.rows.length;
  }
  ar3Action('g9-import-food',openFoodImport);
  const baseFoods=V15_PAGES.foods;
  V15_PAGES.foods=function(){
    const box=document.createElement('div');box.innerHTML=baseFoods();
    const actions=box.querySelector('.r3-admin-page>.page-head .page-actions');
    if(actions&&!actions.querySelector('[data-action="g9-import-food"]'))actions.insertAdjacentHTML('afterbegin',ab('批量导入','g9-import-food'));
    return box.innerHTML;
  };

  window.G9={conditionFields,readCondition,conditionLabel,refreshConditions,enhanceRewardPickers,openCouponPicker,openFoodImport};
})();
