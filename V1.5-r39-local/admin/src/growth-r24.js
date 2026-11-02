// V1.5-r24: explicit growth filters, compact coupon tables and unified user identity cells.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const state=()=>window.R3?.state;
  const ae=C.ae;
  const TODAY=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(state().now));
  const coupon=id=>state().templates.find(item=>item.id===id);
  const walletStatus=wallet=>wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<TODAY()?'已过期':wallet.start>TODAY()?'待生效':'可使用';
  const userById=id=>state().users.find(item=>item.id===id);
  const normalized=value=>String(value||'').trim().toLowerCase();
  const includes=(value,query)=>normalized(value).includes(normalized(query));
  const headerIndex=(table,test)=>{
    const headers=[...table.tHead?.rows?.[0]?.cells||[]];
    return headers.findIndex(cell=>test(cell.textContent.trim()));
  };
  const currentOperator=()=>document.querySelector('.operator-meta b')?.textContent.trim()||'运营管理员';

  function channelLabel(wallet,job){
    if(job)return '后台-'+(job.grantedBy||'运营管理员');
    if(!wallet)return '系统-未知';
    const source=String(wallet.source||'系统活动');
    if(source==='后台下发'||wallet.grantedBy==='运营管理员'||/后台/.test(source)){
      const operator=wallet.grantedBy&&!/系统|自动/.test(wallet.grantedBy)?wallet.grantedBy:'运营管理员';
      return '后台-'+operator;
    }
    if(/连续打卡/.test(source))return '系统-'+source.replace(/^连续打卡奖励/,'连续打卡活动');
    if(/邀请|受邀/.test(source))return '系统-'+source.replace(/^邀请好友奖励/,'邀请活动').replace(/^受邀注册奖励/,'邀请活动·受邀注册');
    if(/问卷/.test(source))return '系统-'+source.replace(/^问卷调查奖励/,'问卷活动');
    return '系统-'+source;
  }

  function activeFilterView(){
    return C.g6Tabs;
  }

  function filterDefinition(page,tab,rows){
    const statuses=options=>options.filter(Boolean);
    if(page==='coupons'){
      if(tab==='templates')return [
        {key:'couponName',label:'优惠券名称',placeholder:'输入优惠券名称'},
        {key:'couponDesc',label:'优惠券描述',placeholder:'输入优惠券描述'},
        {key:'couponStatus',label:'优惠券状态',type:'select',allLabel:'全部状态',options:statuses(['启用','停用'])}
      ];
      if(tab==='issues'){
        const channelIndex=rows.length?headerIndex(rows[0].row.closest('table'),text=>text==='发放渠道'):-1;
        const channels=[...new Set(rows.map(info=>channelIndex>=0?info.row.cells[channelIndex]?.innerText.trim():'').filter(Boolean))].sort();
        const states=[...new Set(rows.flatMap(info=>info.states))].sort();
        return [
          {key:'couponName',label:'优惠券名称',placeholder:'输入优惠券名称'},
          {key:'issueChannel',label:'发放渠道',type:'select',allLabel:'全部渠道',options:channels},
          {key:'recipient',label:'领券人',placeholder:'用户名 / 用户ID / 手机号'},
          {key:'issueStatus',label:'状态',type:'select',allLabel:'全部状态',options:states}
        ];
      }
      return [{key:'userKeyword',label:'用户',placeholder:'用户名 / 用户ID / 手机号'}];
    }
    if(page==='invites'||page==='invite-users'||page==='invite-relations'){
      const inviteTab=page==='invite-relations'?'records':page==='invite-users'?'user':tab;
      if(inviteTab==='merchant')return [
        {key:'merchantContact',label:'商户名/手机号',placeholder:'商户名或手机号'},
        {key:'merchantCode',label:'商户邀请码',placeholder:'输入邀请码'},
        {key:'merchantStatus',label:'邀请码状态',type:'select',allLabel:'全部状态',options:['启用','停用']}
      ];
      if(inviteTab==='user')return [];
      return [
        {key:'relationUser',label:'用户',placeholder:'姓名 / 用户ID / 手机号'},
        {key:'relationCode',label:'邀请码',placeholder:'输入邀请码'},
        {key:'codeStatus',label:'邀请码状态',type:'select',allLabel:'全部状态',options:['启用','停用','未知']}
      ];
    }
    if(page==='invite-rewards')return [{key:'rewardUser',label:'用户',placeholder:'用户名 / 用户ID / 手机号'}];
    return null;
  }

  function codeStatus(info){
    const relationAction=info.row.querySelector('[data-action="g9-relation-detail"][data-id]');
    if(relationAction){
      const relation=state().inviteRelations.find(item=>item.id===relationAction.dataset.id);
      if(relation?.merchantId)return state().merchants.find(item=>item.id===relation.merchantId)?.status||'未知';
      if(relation?.inviterId)return userById(relation.inviterId)?.inviteStatus==='停用'?'停用':'启用';
    }
    const merchantAction=info.row.querySelector('[data-action="merchant-invite-records"][data-id]');
    if(merchantAction)return state().merchants.find(item=>item.id===merchantAction.dataset.id)?.status||'未知';
    const userAction=info.row.querySelector('[data-action="user-invite-records"][data-id]');
    if(userAction)return userById(userAction.dataset.id)?.inviteStatus==='停用'?'停用':'启用';
    return '未知';
  }

  function match(info,view,page,tab){
    const headers=[...info.row.closest('table').tHead.rows[0].cells].map(cell=>cell.textContent.trim());
    const cellBy=test=>{
      const index=headers.findIndex(test);
      return index>=0?info.row.cells[index]?.innerText.trim()||'':'';
    };
    if(page==='coupons'&&tab==='templates'){
      const name=info.row.cells[0]?.querySelector('b')?.textContent||'';
      const desc=[...info.row.cells[0]?.querySelectorAll('small')||[]].map(node=>node.textContent).join(' ');
      return (!view.couponName||includes(name,view.couponName))&&(!view.couponDesc||includes(desc,view.couponDesc))&&(!view.couponStatus||info.states.includes(view.couponStatus));
    }
    if(page==='coupons'&&tab==='issues'){
      return (!view.couponName||includes(cellBy(text=>text==='优惠券名称'),view.couponName))&&(!view.issueChannel||cellBy(text=>text==='发放渠道')===view.issueChannel)&&(!view.recipient||includes(cellBy(text=>text==='领券人'),view.recipient))&&(!view.issueStatus||info.states.includes(view.issueStatus));
    }
    if(page==='coupons')return !view.userKeyword||includes(cellBy(text=>text==='用户'),view.userKeyword);
    if((page==='invites'||page==='invite-users'||page==='invite-relations')&&!(page==='invite-relations')&&tab==='merchant'){
      return (!view.merchantContact||includes(cellBy(text=>text==='商户 / 电话'||text==='商户/电话'),view.merchantContact))&&(!view.merchantCode||includes(cellBy(text=>text==='邀请码'||text==='商户邀请码'),view.merchantCode))&&(!view.merchantStatus||info.states.includes(view.merchantStatus));
    }
    if(page==='invite-relations'||(page==='invites'&&tab==='records')){
      const people=headers.map((header,index)=>header.startsWith('邀请人')||header.startsWith('被邀请人')?info.row.cells[index]?.innerText||'':'').join(' ');
      return (!view.relationUser||includes(people,view.relationUser))&&(!view.relationCode||includes(cellBy(text=>text.startsWith('邀请码')),view.relationCode))&&(!view.codeStatus||codeStatus(info)===view.codeStatus);
    }
    if(page==='invite-rewards')return !view.rewardUser||includes(cellBy(text=>text==='用户'),view.rewardUser);
    return true;
  }

  window.R24Filters={get:filterDefinition,match};

  function markCouponTab(box){
    box.querySelectorAll('[data-group="coupons"][data-tab="templates"]').forEach(button=>button.textContent='优惠券');
    const card=[...box.querySelectorAll('.r3-card h3')].find(node=>node.textContent.trim()==='优惠券模板');
    if(card)card.textContent='优惠券';
  }

  function splitValidity(cell){
    const text=cell.innerText.trim();
    const match=text.match(/^(固定有效期|相对有效期)\s*·\s*(.+)$/);
    if(match)cell.innerHTML='<b>'+ae(match[1])+'</b><small>'+ae(match[2])+'</small>';
  }

  function couponCellName(cell){
    const link=cell.querySelector('[data-action="g10-wallet-detail"],.g10-link');
    if(link)return link.cloneNode(true);
    const name=cell.querySelector('b')?.textContent||cell.textContent.split('\n')[0];
    const span=document.createElement('span');
    span.className='g10-link';
    span.textContent=name;
    return span;
  }

  function patchIssueRows(box){
    for(const table of box.querySelectorAll('table.data-table')){
      const headers=[...table.tHead.rows[0].cells].map(cell=>cell.textContent.trim());
      const couponIndex=headers.indexOf('优惠券');
      const channelIndex=headers.indexOf('发放渠道');
      const activityIndex=headers.indexOf('活动来源');
      const statusIndex=headers.indexOf('状态');
      const recipientIndex=headers.indexOf('领取人');
      const actionIndex=headers.indexOf('操作');
      if(couponIndex<0||channelIndex<0||activityIndex<0||statusIndex<0)continue;
      for(const row of table.tBodies[0].rows){
        const status=row.cells[statusIndex]?.innerText.trim()||'';
        const walletId=row.querySelector('[data-action="g10-wallet-detail"][data-id]')?.dataset.id;
        const jobId=row.querySelector('[data-action="r3-cancel-job"][data-id]')?.dataset.id;
        const wallet=walletId?state().users.flatMap(owner=>owner.wallet).find(item=>item.id===walletId):null;
        const job=jobId?state().issues.find(item=>item.id===jobId):null;
        const nameNode=couponCellName(row.cells[couponIndex]);
        row.cells[couponIndex].replaceChildren(nameNode);
        row.cells[couponIndex].insertAdjacentHTML('beforeend','<small class="r24-coupon-status">'+C.badge(status)+'</small>');
        row.dataset.r24Channel=channelLabel(wallet,job);
        row.cells[channelIndex].textContent=row.dataset.r24Channel;
        if(job&&recipientIndex>=0){
          row.cells[recipientIndex].innerHTML=job.users.map(id=>{const owner=userById(id);return owner?userIdentity(owner):'<b>'+ae(id)+'</b>';}).join('');
          row.cells[recipientIndex].dataset.r24Identity='yes';
          row.cells[recipientIndex].classList.add('g24-user-cell');
        }
        if(actionIndex>=0)row.cells[actionIndex]?.querySelectorAll('button[data-action="g10-wallet-detail"],button[data-action="g10-template-detail"]').forEach(button=>button.remove());
      }
      for(const row of table.tBodies[0].rows){
        if(row.cells.length!==headers.length)continue;
        if(statusIndex>row.cells.length-1)continue;
        row.deleteCell(statusIndex);
        row.deleteCell(activityIndex);
      }
      table.tHead.rows[0].deleteCell(statusIndex);
      table.tHead.rows[0].deleteCell(activityIndex);
      table.tHead.rows[0].cells[couponIndex].textContent='优惠券名称';
      if(recipientIndex>=0)table.tHead.rows[0].cells[recipientIndex-(activityIndex<recipientIndex?1:0)-(statusIndex<recipientIndex?1:0)].textContent='领券人';
    }
  }

  function patchCouponCounts(box){
    for(const table of box.querySelectorAll('table.data-table')){
      const heads=[...table.tHead.rows[0].cells];
      const scoreIndex=heads.findIndex(cell=>cell.textContent.trim()==='券总数');
      if(scoreIndex<0)continue;
      for(const row of table.tBodies[0].rows){
        const cell=row.cells[scoreIndex];
        if(cell)cell.innerHTML='<span class="r24-red-count">'+ae(cell.textContent.trim())+'</span>';
      }
    }
  }

  const couponBase=C.V15_PAGES.coupons;
  C.V15_PAGES.coupons=function(){
    const box=document.createElement('div');
    box.innerHTML=couponBase();
    markCouponTab(box);
    if(C.g6Tabs.coupons==='templates'){
      for(const table of box.querySelectorAll('table.data-table')){
        const index=headerIndex(table,text=>text==='有效期');
        if(index<0)continue;
        for(const row of table.tBodies[0].rows)splitValidity(row.cells[index]);
      }
    }else if(C.g6Tabs.coupons==='issues'){
      patchIssueRows(box);
    }else{
      patchCouponCounts(box);
    }
    return box.innerHTML;
  };

  function stripNoRewardNote(scope=document){
    if(!state()||!['invites','invite-relations','invite-rewards'].includes(C.state.page))return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const heads=[...table.tHead?.rows?.[0]?.cells||[]].map(cell=>cell.textContent.trim());
      heads.forEach((head,index)=>{
        if(!/邀请人奖励|被邀请人奖励/.test(head))return;
        for(const row of table.tBodies[0]?.rows||[]){
          const cell=row.cells[index];
          if(cell?.querySelector('b')?.textContent.trim()==='不发放')cell.querySelector('small')?.remove();
        }
      });
    });
  }

  const invitationBase=C.V15_PAGES.invites;
  C.V15_PAGES.invites=function(){
    const box=document.createElement('div');
    box.innerHTML=invitationBase();
    stripNoRewardNote(box);
    return box.innerHTML;
  };

  if(C.V15_PAGES['invite-relations']){
    const relationsBase=C.V15_PAGES['invite-relations'];
    C.V15_PAGES['invite-relations']=function(){
      const box=document.createElement('div');
      box.innerHTML=relationsBase();
      stripNoRewardNote(box);
      return box.innerHTML;
    };
  }

  const rewardBase=C.V15_PAGES['invite-rewards'];
  C.V15_PAGES['invite-rewards']=function(){
    const box=document.createElement('div');
    box.innerHTML=rewardBase();
    return box.innerHTML;
  };

  const userHeader=/^(用户(?:\s*\/\s*(?:ID|用户号|手机号))?|用户名称(?:\s*\/\s*ID)?|领券人|领取人|邀请人(?:\s*\/\s*(?:ID|手机号))?|被邀请人(?:\s*\/\s*(?:ID|手机号))?|受邀人)$/;
  function findUser(cell){
    const text=cell.innerText.trim();
    const seen=new Set();
    for(const small of cell.querySelectorAll('small')){
      const value=small.textContent.replace(/^ID[：:]\s*/,'').trim();
      if(!value||seen.has(value))continue;
      seen.add(value);
      const byId=userById(value);
      if(byId)return byId;
      const byPhone=state().users.find(owner=>owner.profile?.phone===value);
      if(byPhone)return byPhone;
    }
    for(const button of cell.querySelectorAll('[data-id]')){
      const owner=userById(button.dataset.id);
      if(owner)return owner;
    }
    const name=cell.querySelector('b')?.textContent.trim()||text.split('\n')[0].trim();
    const matches=state().users.filter(owner=>owner.name===name);
    return matches.length===1?matches[0]:null;
  }

  function userIdentity(owner){
    return '<span class="r24-identity" data-r24-user="'+ae(owner.id)+'"><b>'+ae(owner.name)+'</b><small class="r24-user-id">'+ae(owner.id)+'</small><small class="r24-user-phone">'+ae(owner.profile?.phone||'—')+'</small></span>';
  }

  function decorateIdentities(scope=document){
    if(!state())return;
    const pages=new Set(['coupons','invites','invite-relations','invite-users','invite-rewards','user-growth','user-growth-form','foods','surveys','checkin-activities','activity-records','checkin-users']);
    if(!pages.has(C.state.page))return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const headers=[...table.tHead?.rows?.[0]?.cells||[]];
      headers.forEach((head,index)=>{
        let label=head.textContent.trim();
        if(label==='领取人'){label='领券人';head.textContent=label;}
        if(!userHeader.test(label))return;
        for(const row of table.tBodies[0]?.rows||[]){
          const cell=row.cells[index];
          if(!cell||cell.dataset.r24Identity)continue;
          const owner=findUser(cell);
          if(!owner)continue;
          cell.innerHTML=userIdentity(owner);
          cell.dataset.r24Identity='yes';
          cell.classList.add('g24-user-cell');
        }
        head.textContent=label.startsWith('邀请人')?'邀请人':label.startsWith('被邀请人')?'被邀请人':label==='领券人'||label==='领取人'?label:'用户';
      });
      const phoneIndex=headers.findIndex(cell=>cell.textContent.trim()==='手机号');
      if(phoneIndex>=0){
        const rows=[table.tHead.rows[0],...(table.tBodies[0]?.rows||[])];
        const previousUserCell=table.tBodies[0]?.rows[0]?.cells[phoneIndex-1];
        if(previousUserCell?.dataset.r24Identity){
          for(const row of rows)if(row.cells[phoneIndex])row.deleteCell(phoneIndex);
        }
      }
    });
    scope.querySelectorAll('.g10-coupon-detail span').forEach(node=>{if(node.textContent.trim()==='领取人')node.textContent='领券人';});
  }

  function cleanModalTables(scope){
    if(!scope)return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const headers=[...table.tHead?.rows?.[0]?.cells||[]],actionIndex=headers.findIndex(cell=>/操作|查看/.test(cell.textContent.trim()));
      if(actionIndex<0)return;
      let keepAction=false;
      for(const row of table.tBodies[0]?.rows||[]){
        const cell=row.cells[actionIndex];
        if(!cell)continue;
        cell.querySelectorAll('[data-action]').forEach(node=>{if(/detail/i.test(node.dataset.action||''))node.remove();});
        if(cell.querySelector('button,[data-action]'))keepAction=true;
      }
      if(!keepAction){
        for(const row of table.tBodies[0]?.rows||[])if(row.cells[actionIndex])row.deleteCell(actionIndex);
        table.tHead.rows[0].deleteCell(actionIndex);
      }
    });
  }

  const decorateBase=window.G7?.decorate;
  if(decorateBase){
    window.G7.decorate=function(scope=document,page){
      const result=decorateBase.apply(this,arguments);
      decorateIdentities(scope);
      if(scope?.id==='modal-root'||scope?.id==='drawer-root')cleanModalTables(scope);
      stripNoRewardNote(scope);
      return result;
    };
  }

  const cmdBase=window.R3.cmd;
  window.R3.cmd=function(type,payload={},id){
    if(type==='ADMIN_ISSUE')payload={...payload,grantedBy:payload.grantedBy||currentOperator()};
    return cmdBase.call(this,type,payload,id);
  };

  window.R24Identity={render:userIdentity,decorate:decorateIdentities};
  window.R24={channelLabel,cleanModalTables,findUser};
})();
