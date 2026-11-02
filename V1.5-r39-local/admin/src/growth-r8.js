// V1.5-r8 growth operations, coupon issuing and richer demo tables.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const {V15_PAGES,g6Tabs,ab,ae,atable,card,badge,dateTime,ar3Head,g6Stats,g6Buttons,g6User,g6Rewards,g6RewardTable,g6RecordTable,rewardSummary,ar3SettingsForm,ar3Action,renderApp,navigate,openModal,openDrawer,closeDrawer}=C;
  const originalCoupons=V15_PAGES.coupons,originalInvites=V15_PAGES.invites,originalInviteForm=V15_PAGES['invite-form'];
  const datum=()=>window.R3.state;
  const today=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(datum().now));
  const fmt=value=>value?dateTime(value):'—';
  const findUser=id=>datum().users.find(user=>user.id===id);
  const findTemplate=id=>datum().templates.find(template=>template.id===id);
  const activeTemplates=()=>datum().templates.filter(template=>template.status==='启用'&&(template.validMode!=='fixed'||template.end>=today()));
  let issueDraft={templateId:activeTemplates()[0]?.id||null,userIds:[],mode:'now',scheduledAt:'',note:''};
  C.pageMeta['coupon-issue']=['增长运营','发放优惠券'];

  const daysAgo=value=>{
    const time=Date.parse(value);
    return Number.isFinite(time)?Math.floor((Date.parse(datum().now)-time)/86400000):999;
  };
  const recentCheckins=user=>(user.checkins||[]).filter(day=>day>=window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(datum().now)-30*86400000)&&day<=today()).length;
  const activity=user=>{const days=recentCheckins(user);return days>=20?'高活跃':days>=5?'中活跃':'低活跃';};
  const orderState=user=>window.R38Data?.orderStatus(user)||'0订购';
  const grantStatus=wallet=>{
    if(wallet.status==='已使用')return '已使用';
    if(wallet.status==='已撤回')return '已撤回';
    if(wallet.expire<today())return '已过期';
    if(wallet.start>today())return '待生效';
    return '可使用';
  };
  const statsFor=user=>{
    const counts={'可使用':0,'已使用':0,'已过期':0,'已撤回':0,'待生效':0};
    for(const wallet of user.wallet)counts[grantStatus(wallet)]+=1;
    const obtained=user.wallet.map(item=>item.obtainedAt).filter(Boolean).sort().at(-1);
    const used=user.wallet.map(item=>item.usedAt).filter(Boolean).sort().at(-1);
    return {...counts,total:user.wallet.length,obtained,used};
  };
  const eligible=user=>{
    const template=findTemplate(issueDraft.templateId);
    if(!template)return '请选择优惠券';
    if(template.status!=='启用'||(template.validMode==='fixed'&&template.end<today()))return '券模板不可用';
    const held=window.R36Review?window.R36Review.couponRows(datum(),template.id,Date.parse(datum().now)||Date.now()).filter(r=>r.user.id===user.id&&r.label!=='未领取过期').length:user.wallet.filter(wallet=>wallet.templateId===template.id&&wallet.status!=='已撤回').length;
    void held;
    return '';
  };
  const orderText=wallet=>{
    if(!wallet.orderId)return '—';
    const order=datum().users.flatMap(user=>user.orders).find(order=>order.id===wallet.orderId);
    return order?order.pkg+' · ¥'+order.price:wallet.orderId;
  };
  const pagerButtons=(pages,current)=>{
    const values=[];
    for(let page=1;page<=pages;page++)if(pages<=7||page===1||page===pages||Math.abs(page-current)<=1)values.push(page);
    return [...new Set(values)].sort((a,b)=>a-b).map((page,index,all)=>`${index&&page-all[index-1]>1?'<span class="page-ellipsis">…</span>':''}<button type="button" data-page="${page}" class="${page===current?'active':''}">${page}</button>`).join('');
  };
  function exportRows(title,headers,rows){
    if(!window.XLSX){window.__g7UI?.toast?.('导出失败','表格组件未加载','error');return;}
    if(!rows.length){window.__g7UI?.toast?.('没有可导出的数据','请调整筛选条件后再试','error');return;}
    window.G6.confirm('导出'+title,[`将导出当前筛选的 ${rows.length} 条记录。`,'导出不会修改业务数据。']).then(ok=>{
      if(!ok)return;
      const records=rows.map(row=>Object.fromEntries(headers.map((header,index)=>[header,row[index]??''])));
      const workbook=window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook,window.XLSX.utils.json_to_sheet(records),title.slice(0,28));
      window.XLSX.writeFile(workbook,'渡鸦管家-r8-'+title+'-'+today()+'.xlsx');
    });
  }

  function userWalletRows(user){
    return user.wallet.map(wallet=>[
      wallet.name,
      wallet.source,
      fmt(wallet.obtainedAt),
      wallet.start+' 至 '+wallet.expire,
      grantStatus(wallet),
      wallet.grantedBy||'系统发放',
      ab('复制券号','g8-copy-code',`data-code="${wallet.id}"`,'secondary small')
    ]);
  }

  function openUserCouponDrawer(userId){
    const user=findUser(userId);
    if(!user)return;
    const summary=statsFor(user);
    const body=`<div class="g8-user-summary">
      <article><span>优惠券总数</span><b>${summary.total}</b></article>
      <article><span>可使用</span><b>${summary['可使用']}</b></article>
      <article><span>已使用</span><b>${summary['已使用']}</b></article>
      <article><span>已过期</span><b>${summary['已过期']}</b></article>
      <article><span>已撤回</span><b>${summary['已撤回']}</b></article>
      <article><span>待生效</span><b>${summary['待生效']}</b></article>
    </div><div class="g8-user-meta"><span>${ae(user.name)}</span><span>${ae(user.id)}</span><span>${ae(user.profile?.phone||'—')}</span><span>${activity(user)} · 近30天打卡 ${recentCheckins(user)} 天</span></div>`+
      card('全部优惠券',atable(['优惠券','来源','获得时间','有效期','状态','发放方','操作'],userWalletRows(user)));
    openDrawer({title:user.name+' · 用户优惠券',body,footer:ab('导出该用户券','g8-export-user',`data-id="${user.id}"`)});
  }

  function renderCoupons(){
    const data=datum(),tab=g6Tabs.coupons;
    let content='';
    if(tab==='templates'){
      const saved=g6Tabs.coupons;g6Tabs.coupons='templates';
      const box=document.createElement('div');box.innerHTML=originalCoupons();
      content=box.querySelector('.r3-card')?.outerHTML||'';
      g6Tabs.coupons=saved;
    }else if(tab==='issues'){
      const rows=[];
      for(const user of data.users)for(const wallet of user.wallet){
        rows.push([
          `<b>${ae(wallet.name)}</b><small>${ae(wallet.source)}</small>`,
          ae(wallet.source),
          ae(user.name)+`<small>${ae(user.id)}</small>`,
          fmt(wallet.obtainedAt),
          ae(wallet.start+' 至 '+wallet.expire),
          badge(grantStatus(wallet)),
          ab('查看用户','g8-user-coupon-detail',`data-id="${user.id}"`,'secondary small')+(['已使用','已撤回','已过期'].includes(grantStatus(wallet))?'':' '+ab('撤回','r3-revoke',`data-id="${wallet.id}"`,'secondary small'))
        ]);
      }
      for(const job of data.issues.filter(job=>job.status==='待执行')){
        rows.push([
          `<b>${ae(findTemplate(job.templateId)?.name||'优惠券')}</b><small>定时任务</small>`,
          '后台定时发放',
          job.users.map(g6User).map(ae).join('、'),
          fmt(job.scheduledAt),
          findTemplate(job.templateId)?.start+' 至 '+findTemplate(job.templateId)?.end,
          badge('待发放'),
          ab('撤任务','r3-cancel-job',`data-id="${job.id}"`,'secondary small')
        ]);
      }
      content=card('发放记录',atable(['优惠券','发放来源','接收人','发放时间','有效期','状态','操作'],rows));
    }else{
      const rows=data.users.map(user=>{
        const summary=statsFor(user);
        return [
          `<b>${ae(user.name)}</b><small>${ae(user.id)}</small>`,
          ae(user.profile?.phone||'—'),
          badge(activity(user))+`<small>打卡 ${recentCheckins(user)} 天</small>`,
          summary.total,
          summary['可使用'],
          summary['已使用'],
          summary['已过期'],
          summary['已撤回'],
          fmt(summary.obtained),
          ab('查看详情','g8-user-coupon-detail',`data-id="${user.id}"`,'secondary small')+ab('导出','g8-export-user',`data-id="${user.id}"`,'secondary small')
        ];
      });
      content=card('用户优惠券',atable(['用户 / 用户号','手机号','活跃度','券总数','可使用','已使用','已过期','已撤回','最近获得','操作'],rows));
    }
    const actions=tab==='templates'?ab('新建优惠券','r3-new','data-entity="coupon"','primary'):'';
    const totalGrants=data.users.reduce((total,user)=>total+user.wallet.length,0)+data.issues.filter(job=>job.status==='待执行').length;
    return ar3Head('优惠券管理','券模板、发送记录与用户优惠券统一管理。',actions)+
      g6Stats([['券模板',data.templates.length],['发放记录',totalGrants],['用户数',data.users.length],['可使用',data.users.reduce((total,user)=>total+statsFor(user)['可使用'],0)]])+
      g6Buttons('coupons',[['templates','券模板'],['issues','发放记录'],['user-coupons','用户优惠券']])+content+'</section>';
  }
  V15_PAGES.coupons=renderCoupons;

  function openUserPicker(options={}){
    const single=Boolean(options.single),forCode=options.forCode;
    const picker=options.picker||{
      query:'',activity:'',order:'',minCheckin:'',eligibleOnly:!forCode,page:1,pageSize:10,
      selected:new Set(options.selectedIds||(forCode?[]:issueDraft.userIds))
    };
    openModal({
      title:forCode?'选择用户生成邀请码':'选择下发人员',wide:true,
      body:`<div class="g8-picker" data-g8-picker>
        <div class="g8-picker-filters">
          <label>人员<input data-picker-query placeholder="名称 / 用户号 / 手机号"></label>
          <label>本人邀请码<input data-picker-own placeholder="输入本人邀请码"></label><label>绑定邀请码<input data-picker-merchant placeholder="输入绑定邀请码"></label><label>活跃度<select data-picker-activity><option value="">全部活跃度</option><option>高活跃</option><option>中活跃</option><option>低活跃</option></select></label>
          <label>订购状态<select data-picker-order><option value="">全部</option><option>订购中</option><option>过往订购</option><option>0订购</option></select></label>
          <label>近30天打卡 ≥<input data-picker-checkin type="number" min="0" placeholder="天数"></label>
          ${forCode?'':'<label class="g8-check"><input type="checkbox" data-picker-eligible checked> 仅显示可发放用户</label>'}
          <button type="button" class="button primary small" data-picker-find>查找</button><button type="button" class="button secondary small" data-picker-clear>重置</button>
        </div>
        <div class="g8-picker-count"><button type="button" class="button secondary small" data-picker-export>导出</button><span data-picker-count></span><span data-picker-selected></span></div>
        <div class="table-wrap g8-picker-table"><table class="data-table" data-g7="yes"><thead><tr>${single?'<th></th>':'<th><input type="checkbox" data-picker-all></th>'}<th>用户</th><th>用户号</th><th>手机号</th><th>本人邀请码</th><th>绑定邀请码</th><th>活跃度 / 打卡</th><th>订购状态</th><th>当前券</th><th>可发放状态</th></tr></thead><tbody data-picker-rows></tbody></table></div>
        <footer class="g8-picker-footer"><span data-picker-pages></span><select data-picker-size><option value="10">10 条/页</option><option value="20">20 条/页</option><option value="30">30 条/页</option></select><label class="g8-jump">跳至 <input data-picker-jump type="number" min="1" value="1"> 页</label></footer>
      </div>`,
      footer:'<button type="button" class="button secondary" data-picker-cancel>取消</button><button type="button" class="button primary" data-picker-apply>应用已选</button>'
    });
    const modal=document.querySelector('#modal-root .modal');modal?.classList.add('g8-user-picker-modal');
    const root=document.querySelector('[data-g8-picker]');if(!root)return;
    const q=root.querySelector('[data-picker-query]'),activitySelect=root.querySelector('[data-picker-activity]'),orderSelect=root.querySelector('[data-picker-order]'),minCheckin=root.querySelector('[data-picker-checkin]'),eligibleOnly=root.querySelector('[data-picker-eligible]'),rowsBox=root.querySelector('[data-picker-rows]'),countBox=root.querySelector('[data-picker-count]'),selectedBox=root.querySelector('[data-picker-selected]'),pagesBox=root.querySelector('[data-picker-pages]'),allBox=root.querySelector('[data-picker-all]'),sizeBox=root.querySelector('[data-picker-size]'),jump=root.querySelector('[data-picker-jump]');
    root.querySelector('[data-picker-own]').value=picker.own||'';root.querySelector('[data-picker-merchant]').value=picker.merchant||'';q.value=picker.query;activitySelect.value=picker.activity;orderSelect.value=picker.order;minCheckin.value=picker.minCheckin;if(eligibleOnly)eligibleOnly.checked=picker.eligibleOnly;sizeBox.value=String(picker.pageSize);
    function filtered(){
      return datum().users.filter(user=>{
        const codes=window.R38DietUpgrade.personalCodes(user,datum());if(picker.own&&!codes.own.toLowerCase().includes(picker.own.toLowerCase()))return false;if(picker.merchant&&!codes.bound.toLowerCase().includes(picker.merchant.toLowerCase()))return false;const keyword=picker.query.trim().toLowerCase();
        const text=[user.name,user.id,user.profile?.phone||''].join(' ').toLowerCase();
        if(keyword&&!text.includes(keyword))return false;
        if(picker.activity&&activity(user)!==picker.activity)return false;
        if(picker.order&&orderState(user)!==picker.order)return false;
        if(picker.minCheckin!==''&&recentCheckins(user)<Number(picker.minCheckin))return false;
        if(!forCode&&picker.eligibleOnly&&eligible(user))return false;
        return true;
      });
    }
    function render(){
      const list=filtered(),pages=Math.max(1,Math.ceil(list.length/picker.pageSize));
      picker.page=Math.min(picker.page,pages);
      const pageRows=list.slice((picker.page-1)*picker.pageSize,picker.page*picker.pageSize);
      rowsBox.innerHTML=pageRows.map(user=>{
        const reason=forCode?'可新增':eligible(user)||'可发放';
        const held=window.R36Review?window.R36Review.couponRows(datum(),issueDraft.templateId,Date.parse(datum().now)||Date.now()).filter(r=>r.user.id===user.id&&r.label!=='未领取过期').length:user.wallet.filter(wallet=>wallet.templateId===issueDraft.templateId&&wallet.status!=='已撤回').length;
        return `<tr data-user-id="${ae(user.id)}"><td class="g7-select-cell"><input type="${single?'radio':'checkbox'}" name="g8-picker-user" data-picker-user="${ae(user.id)}" ${picker.selected.has(user.id)?'checked':''} ${!forCode&&eligible(user)?'disabled':''}></td>
          <td><b>${ae(user.name)}</b></td><td>${ae(user.id)}</td><td>${ae(user.profile?.phone||'—')}</td><td>${ae(window.R38DietUpgrade.personalCodes(user,datum()).own||'—')}</td><td>${ae(window.R38DietUpgrade.personalCodes(user,datum()).boundText||'—')}</td><td>${badge(activity(user))}<small>${recentCheckins(user)} 天</small></td><td>${orderState(user)}</td><td>${user.wallet.length} 张${!forCode?`<small>当前券 ${held} 张</small>`:''}</td><td>${!forCode&&eligible(user)?`<span class="g8-disabled-reason" title="${ae(reason)}">${ae(reason)}</span>`:badge(reason)}</td></tr>`;
      }).join('')||'<tr><td colspan="10" class="r3-empty">没有符合条件的人员</td></tr>';
      countBox.textContent=`共 ${list.length} 人`;
      selectedBox.textContent=`已选 ${picker.selected.size} 人`;
      pagesBox.innerHTML=`<button type="button" data-picker-prev ${picker.page===1?'disabled':''}>上一页</button>${pagerButtons(pages,picker.page)}<button type="button" data-picker-next ${picker.page===pages?'disabled':''}>下一页</button>`;
      jump.max=String(pages);jump.value=String(picker.page);
      if(allBox){
        const selectable=filtered().filter(user=>forCode||!eligible(user));
        allBox.checked=selectable.length>0&&selectable.every(user=>picker.selected.has(user.id));allBox.indeterminate=selectable.some(user=>picker.selected.has(user.id))&&!allBox.checked;allBox.disabled=!selectable.length;
      }
      rowsBox.querySelectorAll('[data-picker-user]').forEach(box=>box.addEventListener('change',()=>{
        const id=box.dataset.pickerUser;
        if(single){picker.selected.clear();picker.selected.add(id);}
        else box.checked?picker.selected.add(id):picker.selected.delete(id);
        render();
      }));
      pagesBox.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{picker.page=Number(button.dataset.page);render();}));
      pagesBox.querySelector('[data-picker-prev]').addEventListener('click',()=>{picker.page=Math.max(1,picker.page-1);render();});
      pagesBox.querySelector('[data-picker-next]').addEventListener('click',()=>{picker.page=Math.min(pages,picker.page+1);render();});
    }
    root.querySelector('[data-picker-export]').onclick=()=>window.R36AdminReview.xlsx(forCode?'用户邀请码候选人':'下发人员',['用户','用户号','手机号','本人邀请码','绑定邀请码','活跃度','订购状态','近30天打卡'],filtered().map(u=>{const c=window.R38DietUpgrade.personalCodes(u,datum());return [u.name,u.id,u.profile?.phone||'—',c.own||'—',c.boundText||'—',activity(u),orderState(u),recentCheckins(u)]}));const find=()=>{Object.assign(picker,{query:q.value,own:root.querySelector('[data-picker-own]').value.trim(),merchant:root.querySelector('[data-picker-merchant]').value.trim(),activity:activitySelect.value,order:orderSelect.value,minCheckin:minCheckin.value,eligibleOnly:eligibleOnly?.checked??true,page:1});render();};root.querySelector('[data-picker-find]').onclick=find;root.querySelector('.g8-picker-filters').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();find();}};
    root.querySelector('[data-picker-clear]').addEventListener('click',()=>{Object.assign(picker,{query:'',own:'',merchant:'',activity:'',order:'',minCheckin:'',eligibleOnly:!forCode,page:1});q.value='';root.querySelector('[data-picker-own]').value='';root.querySelector('[data-picker-merchant]').value='';activitySelect.value='';orderSelect.value='';minCheckin.value='';if(eligibleOnly)eligibleOnly.checked=picker.eligibleOnly;render();});
    allBox?.addEventListener('change',()=>{
      const list=filtered().filter(user=>forCode||!eligible(user));
      list.forEach(user=>allBox.checked?picker.selected.add(user.id):picker.selected.delete(user.id));
      render();
    });
    sizeBox.addEventListener('change',()=>{picker.pageSize=Number(sizeBox.value)||10;picker.page=1;render();});
    jump.addEventListener('change',()=>{picker.page=Math.max(1,Number(jump.value)||1);render();});
    document.querySelector('[data-picker-apply]').onclick=()=>{
      const ids=[...picker.selected];
      if(!ids.length){window.__g7UI?.toast?.('请选择用户','至少选择一位用户','error');return;}
      if(forCode){C.closeModal();onPickUserCode(ids[0]);}
      else{issueDraft.userIds=ids;C.closeModal();renderApp();}
    };
    document.querySelector('[data-picker-cancel]').onclick=()=>C.closeModal();
    render();
  }

  function renderIssuePage(){
    if(!issueDraft.templateId)issueDraft.templateId=activeTemplates()[0]?.id||null;
    const template=findTemplate(issueDraft.templateId);
    const selected=issueDraft.userIds.map(findUser).filter(Boolean);
    const eligibleSelected=selected.filter(user=>!eligible(user));
    const selectedPreview=selected.length?selected.slice(0,8).map(user=>`<span class="g8-user-chip">${ae(user.name)}<small>${ae(user.id)}</small></span>`).join('')+(selected.length>8?`<span class="g8-user-chip">等 ${selected.length} 人</span>`:''):'<p class="g8-muted">尚未选择下发人员</p>';
    const brands=template?.brands?.map(brand=>datum().brands.find(item=>item.id===brand||item.name===brand)?.name||brand).filter(Boolean)||[];
    const couponPreview=template?'<div class="g8-coupon-preview-card"><strong>¥'+template.amount+'</strong><div><b>'+ae(template.name)+'</b><p>'+(template.threshold?'满 ¥'+template.threshold+' 可用':'无门槛')+' · '+(brands.length?brands.map(ae).join('、'):'全部品牌')+'</p><small>'+(template.validMode==='relative'?'领取后 '+template.days+' 天有效':template.start+' 至 '+template.end)+'</small></div></div>':'';
    const couponCard=card('优惠券信息',couponPreview||'<p class="g8-muted">没有可发放的优惠券，请返回券模板后重新进入。</p>');
    const recipientCard=card('1. 选择下发人员','<div class="g8-selected-head"><div><b>已选 '+selected.length+' 人</b><p>可发放 '+eligibleSelected.length+' 人'+(selected.length>eligibleSelected.length?' · '+(selected.length-eligibleSelected.length)+' 人当前不可发放':'')+'</p></div>'+ab('选择下发人员','g8-pick-users','','primary')+'</div><div class="g8-selected-users">'+selectedPreview+'</div>');
    const settingsCard=card('2. 发放设置','<div class="r3-form-grid"><label class="r3-field"><span>发放方式</span><select data-g8-mode><option value="now" '+(issueDraft.mode==='now'?'selected':'')+'>立即发放</option><option value="scheduled" '+(issueDraft.mode==='scheduled'?'selected':'')+'>定时发放</option></select></label><label class="r3-field g8-schedule-field" '+(issueDraft.mode==='now'?'hidden':'')+'><span>计划时间</span><input type="datetime-local" data-g8-schedule value="'+ae(issueDraft.scheduledAt)+'"></label></div><label class="r3-field"><span>备注（选填）</span><textarea data-g8-note placeholder="说明本次发放活动或人群">'+ae(issueDraft.note)+'</textarea></label>');
    return ar3Head('发放优惠券','核对当前优惠券和下发人员，完成后立即或定时发放。','')+'<section class="g8-issue-layout"><div class="g8-issue-main">'+couponCard+recipientCard+settingsCard+'</div></section><footer class="r33c-footer">'+ab('返回','g8-back-coupons')+ab('确认发放','g8-submit-issue','','primary')+'</footer>';
  }
  V15_PAGES['coupon-issue']=renderIssuePage;

  function userInvitePage(){
    const data=datum(),sub=g6Tabs.inviteUserSub||'codes',settings=data.settings;
    const userRelations=data.inviteRelations.filter(relation=>relation.inviterId);
    const oldName=rewardSummary(settings.oldReward),newName=rewardSummary(settings.newReward);
    let content='';
    if(sub==='codes'){
      const rows=data.users.filter(user=>user.inviteCode).map(user=>{
        const count=userRelations.filter(relation=>relation.inviterId===user.id&&relation.status==='有效').length;
        const status=user.inviteStatus==='停用'?'停用':!settings.enabled?'活动关闭':settings.start>today()?'尚未开始':settings.end<today()?'已结束':count>=settings.cap?'已达上限':'启用';
        return [`<b>${ae(user.name)}</b><small>${ae(user.id)}</small>`,ae(user.profile?.phone||'—'),`<code>${ae(user.inviteCode)}</code>`,badge(status),count+' / '+settings.cap,ae(oldName),ae(newName),ab('复制','g8-copy-code',`data-code="${ae(user.inviteCode)}"`,'secondary small')+ab('查看记录','g8-user-invites',`data-id="${user.id}"`,'secondary small')+ab(user.inviteStatus==='停用'?'启用':'停用','g6-user-code-toggle',`data-id="${user.id}"`,'secondary small')];
      });
      content=card('用户邀请码',atable(['用户','手机号','邀请码','状态','有效邀请','老用户奖励','新用户奖励','操作'],rows));
    }else if(sub==='relations'){
      content=card('用户邀请记录',g6RecordTable(userRelations));
    }else{
      content=`<div class="g8-reward-config">${card('老用户邀请奖励',`<div class="g8-reward-line"><span>邀请人获得</span><b>${ae(oldName)}</b></div><p>邀请关系生效后自动发放，奖励对象：邀请人。当前已发放 ${g6Rewards().filter(reward=>reward.source==='邀请好友奖励'&&reward.status==='已发放').length} 条。</p>${ab('编辑奖励设置','g6-settings')}`)}${card('新用户邀请奖励',`<div class="g8-reward-line"><span>新用户获得</span><b>${ae(newName)}</b></div><p>新用户成功绑定后自动发放，奖励对象：受邀新用户。当前已发放 ${g6Rewards().filter(reward=>reward.source==='受邀注册奖励'&&reward.status==='已发放').length} 条。</p>${ab('编辑奖励设置','g6-settings')}`)}</div>`+card('邀请奖励记录',g6RewardTable(g6Rewards()));
    }
    return ar3Head('邀请码管理','商户码、用户码、邀请记录和双方奖励统一维护。',ab('新增用户邀请码','g8-new-user-code','','primary')+ab('活动设置','g6-settings'))+
      g6Stats([['用户邀请码',data.users.filter(user=>user.inviteCode).length],['有效邀请',userRelations.filter(relation=>relation.status==='有效').length],['老用户奖励',oldName],['新用户奖励',newName]])+
      g6Buttons('invites',[['merchant','商户邀请码'],['user','用户邀请码']])+
      g6Buttons('inviteUserSub',[['codes','用户邀请码'],['relations','邀请记录'],['rewards','奖励设置']])+content+'</section>';
  }
  V15_PAGES.invites=function(){
    if(g6Tabs.invites==='merchant')return originalInvites();
    return userInvitePage();
  };

  async function onGenerateUserCode(userId){
    const user=findUser(userId);if(!user)return;
    window.R3.skipConfirm=true;
    try{
      const result=await window.R3.cmd('ADMIN_GENERATE_USER_CODE',{id:userId});
      g6Tabs.invites='user';g6Tabs.inviteUserSub='codes';renderApp();
      window.__g7UI?.toast?.('邀请码已生成',result.code||user.inviteCode);
    }catch(error){if(!error.cancelled)window.__g7UI?.toast?.('操作未完成',error.message,'error');}
    finally{window.R3.skipConfirm=false;}
  }
  function onPickUserCode(userId){
    const user=findUser(userId);if(!user)return;
    window.G6.confirm('生成或复用用户邀请码',[`用户：${user.name}（${user.id}）`,user.inviteCode?'已有邀请码：'+user.inviteCode:'尚未生成邀请码','生成后保持固定，不因后续编辑而变化。']).then(ok=>{if(ok)onGenerateUserCode(userId);});
  }

  const baseInviteForm=originalInviteForm;
  V15_PAGES['invite-form']=function(){
    const box=document.createElement('div');box.innerHTML=baseInviteForm();
    const page=box.querySelector('.r3-admin-page');const form=page?.querySelector('#r3-editor');if(!form)return box.innerHTML;
    const title=page.querySelector('.page-head h2')?.textContent||page.querySelector('.page-head h1')?.textContent||'邀请码';
    const footer=form.querySelector('.r3-form-footer');const sections=[...form.querySelectorAll('.r3-card')];
    const layout=document.createElement('div');layout.className='g8-invite-layout';
    const main=document.createElement('div');main.className='g8-invite-main';sections.forEach(section=>main.append(section));
    const aside=document.createElement('aside');aside.className='g8-invite-aside';
    aside.innerHTML=`<div class="g8-invite-preview"><span>邀请卡预览</span><h3 data-invite-preview-name>${ae(C.editing?.name||'新商户邀请码')}</h3><div class="g8-invite-code">保存后生成固定八位码</div><p data-invite-preview-validity>${ae(C.editing?.start||'2026-10-01')} 至 ${ae(C.editing?.end||'2027-12-31')}</p><p data-invite-preview-reward>${ae(C.editing?.withReward?rewardSummary(C.editing.reward):'不发放奖励')}</p><em data-invite-preview-status>${ae(C.editing?.status||'启用')}</em></div><div class="g8-rules"><b>绑定规则</b><p>一个用户只能绑定一个商户码或用户码；绑定前的订单不追溯，绑定后的支付订单才计入商户统计。</p><p>停用后不能再绑定，历史邀请和奖励记录保留。</p></div>`;
    layout.append(main,aside);footer.before(layout);
    return box.innerHTML;
  };

  function updateInvitePreview(){
    const root=document.querySelector('.g8-invite-aside');if(!root)return;
    const value=name=>C.av(name);
    const name=value('name')||'新商户邀请码';
    root.querySelector('[data-invite-preview-name]').textContent=name;
    root.querySelector('[data-invite-preview-validity]').textContent=(value('start')||'开始日期')+' 至 '+(value('end')||'结束日期');
    root.querySelector('[data-invite-preview-reward]').textContent=value('withReward')==='on'?'按所选奖励配置发放':'不发放奖励';
    root.querySelector('[data-invite-preview-status]').textContent=value('status')||'启用';
  }
  document.addEventListener('input',updateInvitePreview);
  document.addEventListener('change',updateInvitePreview);

  ar3Action('r3-issue',n=>{issueDraft={templateId:n.dataset.id,userIds:[],mode:'now',scheduledAt:'',note:''};navigate('coupon-issue');});
  ar3Action('g8-back-coupons',()=>{g6Tabs.coupons='templates';navigate('coupons');});
  ar3Action('g8-pick-users',()=>openUserPicker());
  ar3Action('g8-user-coupon-detail',n=>openUserCouponDrawer(n.dataset.id));
  ar3Action('g8-export-user',n=>{const user=findUser(n.dataset.id);if(user)exportRows('用户优惠券-'+user.name,['优惠券','来源','获得时间','有效期','状态','发放方'],userWalletRows(user).map(row=>row.slice(0,6)));});
  ar3Action('g8-copy-code',n=>copyText(n.dataset.code));
  ar3Action('g8-user-invites',n=>{const user=findUser(n.dataset.id);openDrawer({title:user.name+' · 邀请记录',body:card('邀请记录',g6RecordTable(datum().inviteRelations.filter(relation=>relation.inviterId===user.id)))});});
  ar3Action('g8-new-user-code',()=>openUserPicker({single:true,forCode:true}));
  ar3Action('g8-submit-issue',()=>submitIssue());

  function copyText(text){
    const value=String(text||'');if(!value)return;
    const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();
    try{document.execCommand('copy');window.__g7UI?.toast?.('已复制',value);}catch{document.execCommand('copy');}
    area.remove();
  }

  function submitIssue(){
    const template=findTemplate(issueDraft.templateId);if(!template)return window.__g7UI?.toast?.('请选择优惠券','优惠券模板不可用','error');
    const selected=issueDraft.userIds.map(findUser).filter(Boolean);
    if(!selected.length)return window.__g7UI?.toast?.('请选择下发人员','至少选择一位用户','error');
    const valid=selected.filter(user=>!eligible(user));
    if(!valid.length)return window.__g7UI?.toast?.('没有可发放人员','所选用户均已达到限领或不符合条件','error');
    const scheduled=issueDraft.mode==='scheduled'?issueDraft.scheduledAt:null;
    if(scheduled&&Date.parse(scheduled)<=Date.parse(datum().now))return window.__g7UI?.toast?.('计划时间无效','请选择未来时间','error');
    const lines=[`优惠券：${template.name} · ¥${template.amount}`,`下发人员：${valid.length} 人`,scheduled?'计划发放：'+scheduled:'立即发放',selected.length>valid.length?`已自动排除 ${selected.length-valid.length} 位不可发放人员。`:'全部人员均可发放。'];
    window.G6.confirm('确认发放优惠券',lines).then(async ok=>{
      if(!ok)return;
      window.R3.skipConfirm=true;
      try{await window.R3.cmd('ADMIN_ISSUE',{templateId:template.id,users:valid.map(user=>user.id),note:issueDraft.note,scheduledAt:scheduled?new Date(scheduled).toISOString():null});g6Tabs.coupons='issues';issueDraft={templateId:activeTemplates()[0]?.id||null,userIds:[],mode:'now',scheduledAt:'',note:''};navigate('coupons');window.__g7UI?.toast?.('发放完成',valid.length+' 位用户');}catch(error){window.__g7UI?.toast?.('发放未完成',error.message,'error');}finally{window.R3.skipConfirm=false;}
    });
  }

  document.addEventListener('change',event=>{
    if(event.target.matches('[data-g8-mode]')){issueDraft.mode=event.target.value;renderApp();}
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('[data-g8-schedule]'))issueDraft.scheduledAt=event.target.value;
    if(event.target.matches('[data-g8-note]'))issueDraft.note=event.target.value;
  });
  const previousDescribe=window.G6.describe.bind(window.G6);
  window.G6.describe=(type,payload,data)=>{
    if(type==='ADMIN_GENERATE_USER_CODE'){const user=data.users.find(item=>item.id===payload.id);return {title:'生成用户邀请码',lines:['用户：'+(user?.name||payload.id),user?.inviteCode?'已有邀请码将直接复用。':'将生成唯一固定八位邀请码。','生成后不因后续编辑而变化。']};}
    return previousDescribe(type,payload,data);
  };
  window.G8={openUserPicker,openUserCouponDrawer,renderIssuePage};
})();
