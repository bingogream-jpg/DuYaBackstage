// V1.5-r35: compact in-table summaries, semantic status columns and modal exports.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const S=()=>window.R3?.state;
  const ae=C.ae;
  const summaryPages=new Set(['invite-rewards','user-growth','activity-records','checkin-users','foods','surveys']);
  const removeSummaryPages=new Set(['coupons','invites','invite-users','invite-relations']);
  let activeGrowthId='';

  function pageRoot(scope=document){
    return scope?.querySelector?.('#workspace .r3-admin-page')||scope?.querySelector?.('.r3-admin-page')||scope;
  }
  function tableSwitch(table){
    return table.querySelector('tbody [data-r26-switch]');
  }
  function headerIndex(table,text){
    return [...table.tHead?.rows?.[0]?.cells||[]].findIndex(cell=>cell.textContent.trim()===text||cell.textContent.trim().startsWith(text));
  }
  function operationIndex(table){
    const cells=[...table.tHead?.rows?.[0]?.cells||[]];
    return cells.findIndex(cell=>/^(操作|操作项|查看)$/.test(cell.textContent.trim()));
  }
  function today(){
    const store=S();
    return window.__DUYA_LOCAL_ENGINE?.dateKey?.(Date.parse(store?.now||Date.now()))||new Date().toISOString().slice(0,10);
  }
  function badge(text){return C.badge(text);}
  function switchNode(input){
    return input.closest('.r26-switch')||input.parentElement;
  }
  function removeSwitchCaption(node){
    node?.querySelectorAll?.(':scope>span').forEach(span=>span.remove());
  }
  function markStatusColumn(table,index,label){
    const head=table.tHead?.rows?.[0];
    if(!head)return null;
    const th=head.cells[index];
    if(!th)return null;
    th.textContent=label;
    th.dataset.r32Col='status';
    for(const row of table.tBodies?.[0]?.rows||[]){
      const cell=row.cells[index];
      if(cell){
        cell.dataset.r32Col='status';
        cell.classList.add('r35-status-cell');
      }
    }
    return th;
  }
  function prepareSwitchCell(cell,node){
    cell.innerHTML='';
    removeSwitchCaption(node);
    node.classList.add('r35-switch');
    node.removeAttribute('style');
    cell.append(node);
    cell.classList.add('r35-switch-cell');
  }
  function insertColumn(table,beforeIndex,label){
    const head=table.tHead?.rows?.[0];
    if(!head)return null;
    const index=beforeIndex<0?head.cells.length:beforeIndex;
    const th=document.createElement('th');
    th.textContent=label;
    th.dataset.r32Col='status';
    const reference=head.cells[index]||null;
    head.insertBefore(th,reference);
    for(const row of table.tBodies?.[0]?.rows||[]){
      const cell=row.insertCell(index);
      cell.dataset.r32Col='status';
      if(label==='启用/禁用'){
        cell.dataset.r35Col='switch';
        cell.classList.add('r35-switch-cell');
      }else{
        cell.dataset.r35Col='business-status';
      }
    }
    return index;
  }
  function setCellWidthMeta(table){
    table.dataset.r32Columns=String(table.tHead?.rows?.[0]?.cells.length||0);
    table.dataset.r32Integrity=String([...table.tBodies?.[0]?.rows||[]].every(row=>row.cells.length===table.tHead.rows[0].cells.length));
  }
  function pureSwitch(table,input){
    const cell=input.closest('td');
    if(!cell)return;
    const index=cell.cellIndex;
    markStatusColumn(table,index,'启用/禁用');
    prepareSwitchCell(cell,switchNode(input));
    setCellWidthMeta(table);
  }
  function userInviteState(owner){
    const settings=S()?.settings||{};
    if(!owner)return{label:'未知',enabled:false};
    if(owner.inviteStatus==='停用')return{label:'停用',enabled:false};
    if(!settings.enabled)return{label:'活动关闭',enabled:true};
    if(settings.start&&settings.start>today())return{label:'尚未开始',enabled:true};
    if(settings.end&&settings.end<today())return{label:'已结束',enabled:true};
    const count=(S().inviteRelations||[]).filter(relation=>relation.inviterId===owner.id&&['已达成','有效'].includes(relation.status)).length;
    if(Number(settings.cap)>0&&count>=Number(settings.cap))return{label:'已达上限',enabled:true};
    return{label:'可邀请',enabled:true};
  }
  function dualUserInvite(table,input){
    const cell=input.closest('td'),statusIndex=cell?.cellIndex;
    if(!cell||statusIndex<0)return;
    const rows=[...table.tBodies[0].rows],nodes=rows.map(row=>switchNode(row.cells[statusIndex]?.querySelector('[data-r26-switch]')));
    rows.forEach((row,rowIndex)=>{
      const owner=(S().users||[]).find(user=>user.id===nodes[rowIndex]?.querySelector('input')?.dataset.id);
      nodes[rowIndex]?.remove();
      row.cells[statusIndex].innerHTML=badge(userInviteState(owner).label);
    });
    markStatusColumn(table,statusIndex,'邀请状态');
    const op=operationIndex(table);
    const switchIndex=insertColumn(table,op,'启用/禁用');
    rows.forEach((row,rowIndex)=>prepareSwitchCell(row.cells[switchIndex],nodes[rowIndex]));
    setCellWidthMeta(table);
  }
  function activityState(activity){
    if(!activity)return '未知';
    if(activity.status!=='启用')return '已停用';
    return window.R20Data?.activityStatus?.(activity,today())||'进行中';
  }
  function dualCheckin(table,input){
    const rows=[...table.tBodies[0].rows],switches=rows.map(row=>switchNode(row.querySelector('[data-r26-switch]'))),ids=switches.map(node=>node?.querySelector('input')?.dataset.id);
    rows.forEach(row=>{
      const nameCell=row.cells[0];
      nameCell?.querySelectorAll('.r3-badge,.status,.r26-switch').forEach(item=>item.remove());
      if(nameCell&&!nameCell.querySelector('.r26-home-tag'))nameCell.querySelector('.r26-name-status>div')?.remove();
    });
    const businessIndex=insertColumn(table,1,'活动状态');
    rows.forEach((row,rowIndex)=>{
      const id=ids[rowIndex];
      const item=(S().checkinActivities||[]).find(entry=>entry.id===id);
      row.cells[businessIndex].innerHTML=badge(activityState(item));
    });
    const op=operationIndex(table);
    const switchIndex=insertColumn(table,op,'启用/禁用');
    rows.forEach((row,rowIndex)=>prepareSwitchCell(row.cells[switchIndex],switches[rowIndex]));
    setCellWidthMeta(table);
  }
  function dualSurvey(table,input){
    const cell=input.closest('td'),statusIndex=cell?.cellIndex;
    if(!cell||statusIndex<0)return;
    const rows=[...table.tBodies[0].rows],nodes=rows.map(row=>switchNode(row.cells[statusIndex]?.querySelector('[data-r26-switch]')));
    rows.forEach((row,rowIndex)=>{
      const record=(S().surveys||[]).find(item=>item.id===nodes[rowIndex]?.querySelector('input')?.dataset.id);
      nodes[rowIndex]?.remove();
      row.cells[statusIndex].innerHTML=badge(record?.status||'停用');
    });
    markStatusColumn(table,statusIndex,'发布状态');
    const op=operationIndex(table);
    const switchIndex=insertColumn(table,op,'启用/禁用');
    rows.forEach((row,rowIndex)=>prepareSwitchCell(row.cells[switchIndex],nodes[rowIndex]));
    setCellWidthMeta(table);
  }
  function businessHeader(table,label){
    const index=[...table.tHead?.rows?.[0]?.cells||[]].findIndex(cell=>cell.textContent.trim()==='状态');
    if(index>=0)markStatusColumn(table,index,label);
  }
  function decoratePageStatuses(root){
    const page=C.state?.page;
    for(const table of root.querySelectorAll('#workspace table.data-table,table.data-table')){
      if(table.closest('#modal-root'))continue;
      if(table.dataset.r35StatusDone==='yes')continue;
      const input=tableSwitch(table);
      if(input){
        const kind=input.dataset.kind;
        if(kind==='checkin'&&page==='checkin-activities')dualCheckin(table,input);
        else if(kind==='survey'&&page==='surveys')dualSurvey(table,input);
        else if(kind==='user'&&['invites','invite-users'].includes(page))dualUserInvite(table,input);
        else pureSwitch(table,input);
      }else if(page==='invite-rewards'&&/获得途径/.test(table.tHead?.textContent||'')){
        businessHeader(table,'发放状态');
      }else if(page==='activity-records'){
        businessHeader(table,'活动状态');
      }
      table.dataset.r35StatusDone='yes';
    }
  }
  function summaryNode(root){
    return root.querySelector('.summary-ribbon,.g18-summary,.g6-stats');
  }
  function arrangeSummary(root){
    const page=C.state?.page;
    const summary=summaryNode(root);
    if(!summary)return;
    if(removeSummaryPages.has(page)){summary.remove();return;}
    if(!summaryPages.has(page))return;
    const card=[...root.querySelectorAll('section.r3-card')].find(item=>item.querySelector('table.data-table')&&!item.closest('#modal-root'));
    if(!card)return;
    const tableWrap=card.querySelector('.g6-table-shell,.r3-table-wrap,.table-wrap');
    if(!tableWrap)return;
    card.classList.add('r35-has-summary');
    summary.classList.add('r35-summary-strip');
    summary.classList.remove('g6-stats');
    const divider=card.querySelector(':scope>.r32-table-divider');
    (divider||tableWrap).before(summary);
    const actions=card.querySelector(':scope>.r32-actions-row');
    actions?.classList.add('r35-actions-row');
  }
  function moveModalExports(root){
    if(!root?.querySelector)return;
    const footer=root.querySelector('.modal-foot');
    if(!footer)return;
    const exportButton=[...footer.querySelectorAll('button')].find(button=>/导出/.test(button.textContent));
    if(!exportButton)return;
    const table=root.querySelector('.modal-body table.data-table');
    if(!table)return;
    const wrap=table.closest('.table-wrap,.r3-table-wrap,.r31-native-table-wrap')||table.parentElement;
    const row=document.createElement('div');
    row.className='r35-modal-export-row';
    row.append(exportButton);
    wrap.before(row);
  }
  function growthStageSwitches(root,title){
    if(!/成长阶段/.test(title)||!activeGrowthId)return;
    const activity=(S().growthActivities||[]).find(item=>item.id===activeGrowthId);
    const table=root.querySelector('table.data-table');
    if(!activity||!table)return;
    const index=headerIndex(table,'状态');
    if(index<0)return;
    markStatusColumn(table,index,'启用/禁用');
    [...table.tBodies[0].rows].forEach((row,rowIndex)=>{
      const stage=activity.stages?.[rowIndex];
      const cell=row.cells[index];
      if(!stage||!cell)return;
      const enabled=stage.enabled!==false;
      cell.innerHTML='<label class="r26-switch r35-switch" title="切换成长阶段启停"><input type="checkbox" data-r35-growth-stage-switch data-activity="'+ae(activity.id)+'" data-stage="'+ae(stage.id)+'" '+(enabled?'checked':'')+' aria-label="'+ae(stage.name)+'启停开关"><i></i></label>';
      cell.classList.add('r35-switch-cell');
    });
    setCellWidthMeta(table);
  }
  function modalBusinessHeaders(root,title){
    for(const table of root.querySelectorAll('table.data-table')){
      const heads=[...table.tHead?.rows?.[0]?.cells||[]].map(cell=>cell.textContent.trim());
      if(heads.includes('领券人')&&heads.includes('发放渠道'))businessHeader(table,'使用状态');
      else if(heads.includes('优惠券')&&heads.includes('获得时间'))businessHeader(table,'使用状态');
      else if(heads.includes('获得途径')&&heads.includes('获得时间'))businessHeader(table,'发放状态');
      else if(/后台下发记录/.test(title))businessHeader(table,'发放状态');
    }
  }
  function enhance(scope=document){
    const root=pageRoot(scope);
    if(!root?.querySelectorAll)return;
    if(scope?.id==='modal-root'||root.id==='modal-root'){
      const modal=root;
      const title=modal.querySelector('.modal-head h3')?.textContent||'';
      modalBusinessHeaders(modal,title);
      growthStageSwitches(modal,title);
      moveModalExports(modal);
      return;
    }
    arrangeSummary(root);
    decoratePageStatuses(root);
  }
  async function handleSwitch(input){
    const kind=input.dataset.kind,id=input.dataset.id,nextStatus=input.checked?'启用':'停用';
    const definitions={
      coupon:{label:'优惠券',entity:'coupon',list:'templates'},
      merchant:{label:'商户邀请码',entity:'merchant',list:'merchants'},
      food:{label:'食物',entity:'food',list:'foods'},
      survey:{label:'问卷',entity:'survey',list:'surveys'},
      growth:{label:'用户成长活动',entity:'growth',list:'growthActivities'},
      checkin:{label:'打卡活动',entity:'checkinActivity',list:'checkinActivities'},
      category:{label:'食物分类',list:'foodCategories'},
      user:{label:'用户邀请码'}
    };
    const meta=definitions[kind];
    if(!meta)return;
    const record=meta.list?(S()[meta.list]||[]).find(item=>item.id===id):null;
    const name=record?.name||(S().users||[]).find(user=>user.id===id)?.name||id;
    if(!await window.G6.confirm(nextStatus+meta.label,['是否确认'+nextStatus+'？'])){input.checked=!input.checked;return;}
    input.disabled=true;
    window.R3.skipConfirm=true;
    try{
      if(kind==='user'){
        await window.R3.cmd('ADMIN_USER_CODE',{id,status:nextStatus});
      }else if(kind==='category'){
        const payload=JSON.parse(JSON.stringify(record));
        payload.status=nextStatus;
        payload.expectedRevision=record?.revision||1;
        await window.R3.cmd('ADMIN_CATEGORY',payload);
      }else{
        const payload=JSON.parse(JSON.stringify(record));
        payload.status=kind==='survey'?(input.checked?'已发布':'停用'):nextStatus;
        payload.expectedRevision=record?.revision||1;
        await window.R3.cmd('ADMIN_SAVE',{entity:meta.entity,record:payload});
      }
      C.renderApp();
      window.__g7UI?.toast?.('状态已更新',meta.label+'：'+nextStatus);
    }catch(error){
      input.checked=!input.checked;
      if(!error.cancelled)window.__g7UI?.toast?.('状态更新失败',error.message||String(error),'error');
    }finally{
      window.R3.skipConfirm=false;
      input.disabled=false;
    }
  }
  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-r26-switch]');
    if(!input)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleSwitch(input);
  },true);
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-action="r26-growth-stages"]');
    if(target)activeGrowthId=target.dataset.id||'';
  },true);
  document.addEventListener('change',async event=>{
    const input=event.target.closest('[data-r35-growth-stage-switch]');
    if(!input)return;
    const activity=(S().growthActivities||[]).find(item=>item.id===input.dataset.activity);
    const stage=activity?.stages?.find(item=>item.id===input.dataset.stage);
    if(!activity||!stage)return;
    const next=input.checked;
    if(!await window.G6.confirm((next?'启用':'禁用')+'成长阶段',['是否确认'+(next?'启用':'禁用')+'“'+stage.name+'”？'])){input.checked=!next;return;}
    input.disabled=true;
    window.R3.skipConfirm=true;
    try{
      const record=JSON.parse(JSON.stringify(activity));
      record.stages=record.stages.map(item=>item.id===stage.id?{...item,enabled:next}:item);
      record.expectedRevision=activity.revision||1;
      await window.R3.cmd('ADMIN_SAVE',{entity:'growth',record});
      C.renderApp();
      window.__g7UI?.toast?.('状态已更新','成长阶段：'+(next?'启用':'禁用'));
    }catch(error){
      input.checked=!next;
      if(!error.cancelled)window.__g7UI?.toast?.('状态更新失败',error.message,'error');
    }finally{
      window.R3.skipConfirm=false;
      input.disabled=false;
    }
  });
  const renderBase=C.renderApp;
  C.renderApp=function(){const result=renderBase.apply(this,arguments);enhance(document);return result;};
  const decorateBase=window.G7?.decorate;
  if(decorateBase)window.G7.decorate=function(){const result=decorateBase.apply(this,arguments);enhance(arguments[0]||document);return result;};
  const modalBase=C.openModal;
  C.openModal=function(){const result=modalBase.apply(this,arguments);enhance(document.querySelector('#modal-root'));return result;};
  window.R35Admin={enhance,arrangeSummary,decoratePageStatuses,moveModalExports};
})();
