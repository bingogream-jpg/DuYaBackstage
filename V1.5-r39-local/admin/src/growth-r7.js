// V1.5-r7 presentation layer: keep single-record actions in the operation column.
(()=>{
  const GROWTH_PAGES=new Set(['coupons','coupon-issue','invites','invite-settings','invite-relations','invite-users','invite-rewards','user-growth','user-growth-form','foods','surveys','coupon-form','survey-form','invite-form','food-form']);
  const TABLE_MAP={coupon:'templates',survey:'surveys',merchant:'merchants',food:'foods'};
  const memo=new Map();
  let lastFoodIds=null;
  let currentPage=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state=()=>window.R3?.state;
  const user=id=>state()?.users.find(item=>item.id===id);
  const day=()=>window.__DUYA_LOCAL_ENGINE.dateKey(Date.parse(state().now));
  const isGrowth=()=>GROWTH_PAGES.has(currentPage);
  const actionKind=button=>button?.dataset?.action;
  const isToggle=button=>['r3-toggle','g6-user-code-toggle'].includes(actionKind(button));
  const dateOf=text=>{const match=/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/.exec(text||'');return match?[match[1],String(match[2]).padStart(2,'0'),String(match[3]).padStart(2,'0')].join('-'):'';};

  function rewardOf(id){return state().users.flatMap(item=>item.rewards.map(reward=>({reward,owner:item}))).find(item=>item.reward.id===id);}
  function templateOf(id){return state().templates.find(item=>item.id===id);}
  function toggleInfo(button){
    if(actionKind(button)==='g6-user-code-toggle'){
      const owner=user(button.dataset.id);
      return {kind:'user',id:button.dataset.id,label:owner?.name||button.dataset.id,current:(owner?.inviteStatus||'启用')!=='停用'};
    }
    const entity=button.dataset.entity,record=state()?.[TABLE_MAP[entity]]?.find(item=>item.id===button.dataset.id);
    if(!record)return null;
    const current=entity==='survey'?record.status==='已发布':record.status==='启用';
    return {kind:'entity',entity,id:record.id,label:record.name,current,record};
  }

  function blockedReason(button){
    const action=actionKind(button);
    if(action==='local-reward-issue'||action==='r3-reward'){
      const found=rewardOf(button.dataset.id);
      if(!found)return '奖励记录不存在';
      const reward=found.reward;
      if(reward.status==='已发放')return '奖励已发放，无需重复处理';
      if(reward.type==='meal'&&!found.owner.orders.some(order=>order.status==='进行中'&&order.remaining>0))return '用户暂无有效订购，赠餐继续待发放，请联系客服';
      if(reward.type==='coupon'){
        const template=templateOf(reward.config?.couponId);
        if(!template||template.status!=='启用'||(template.validMode==='fixed'&&template.end<day()))return '奖励优惠券不可用，请先处理券配置';
      }
    }
    if(action==='r3-issue'){
      const template=templateOf(button.dataset.id);
      if(!template||template.status!=='启用'||(template.validMode==='fixed'&&template.end<day()))return '该券未启用或已过期，不能发放';
    }
    if(action==='r3-cancel-job'){
      const job=state().issues.find(item=>item.id===button.dataset.id);
      if(job?.status!=='待执行')return '只有待执行任务可以撤回';
    }
    if(action==='r3-retry'){
      const job=state().issues.find(item=>item.id===button.dataset.id);
      if(!job?.results.some(result=>!result.ok))return '当前任务没有可重试的失败项';
    }
    if(action==='r3-revoke'){
      const wallet=state().users.flatMap(item=>item.wallet).find(item=>item.id===button.dataset.id);
      if(!wallet||wallet.status==='已使用'||wallet.status==='已撤回')return '已使用或已撤回的券不能再次撤回';
    }
    if(action==='r3-audit'){
      const submission=state().foodSubmissions.find(item=>item.id===button.dataset.id);
      if(submission?.status!=='待审核')return '该食物已完成审核';
    }
    return '';
  }

  function annotateToggle(button){
    const info=toggleInfo(button);
    if(!info)return null;
    button.textContent=info.current?'停用':'启用';
    button.dataset.g7Target=info.current?'停用':'启用';
    button.title=info.current?'停用后保留历史记录，但不再用于后续业务':'启用后恢复后续业务使用';
    return info;
  }

  function normalizeRowButtons(row){
    const buttons=[...row.querySelectorAll('button[data-action]')].filter(button=>!button.classList.contains('cell-link')&&!button.hasAttribute('data-inline-cell'));
    if(!buttons.length)return buttons;
    const cell=row.cells[row.cells.length-1];
    const box=document.createElement('div');
    box.className='table-actions';
    for(const button of buttons){
      button.classList.remove('button','primary','secondary','small');
      button.classList.add('row-button');
      const reason=blockedReason(button);
      if(reason){
        button.disabled=true;
        button.title=reason;
      }
      box.append(button);
    }
    cell.replaceChildren(box);
    return [...box.querySelectorAll('button[data-action]')];
  }

  function buildFilters(headerText,rows){
    const filterTab=currentPage==='coupons'?g6Tabs.coupons:currentPage==='invites'||currentPage==='invite-relations'||currentPage==='invite-users'?g6Tabs.invites:currentPage==='invite-rewards'?g6Tabs.rewardView:'';
    const custom=window.R24Filters?.get(currentPage,filterTab,rows);
    if(Array.isArray(custom)){
      if(!custom.length)return null;
      const wrap=document.createElement('div');
      wrap.className='g6-filters toolbar toolbar-filters g24-filters';
      wrap.innerHTML='<div class="toolbar-group">'+custom.map(field=>{
        if(field.type==='select')return '<label class="g7-filter" data-g7-filter-field="'+esc(field.key)+'"><span>'+esc(field.label)+'</span><select data-g6-filter="'+esc(field.key)+'"><option value="">'+esc(field.allLabel||('全部'+field.label))+'</option>'+(field.options||[]).map(option=>'<option value="'+esc(option)+'">'+esc(option)+'</option>').join('')+'</select></label>';
        return '<label class="g7-filter" data-g7-filter-field="'+esc(field.key)+'"><span>'+esc(field.label)+'</span><input data-g6-filter="'+esc(field.key)+'" placeholder="'+esc(field.placeholder||('请输入'+field.label))+'"></label>';
      }).join('')+'<button type="button" class="button primary small g18-find">查找</button><button type="button" class="button secondary small g6-clear">重置</button></div>';
      return wrap;
    }
    const statuses=[...new Set(rows.flatMap(info=>info.states))];
    const sources=['商户邀请码','用户邀请码','后台手动下发','后台定时发放','后台发券','系统自动下发','邀请活动','问卷活动','连续打卡活动','邀请好友奖励','受邀注册奖励','商户邀请奖励','问卷调查奖励','连续打卡奖励','品牌菜单','后台录入'].filter(source=>rows.some(info=>info.text.includes(source)));
    const wrap=document.createElement('div');
    wrap.className='g6-filters toolbar toolbar-filters';
    wrap.innerHTML='<div class="toolbar-group">'
      +'<label class="g7-filter" data-g7-filter-field="query"><span>关键词</span><input data-g6-filter="query" placeholder="名称 / 邀请码 / 条码"></label>'
      +'<label class="g7-filter" data-g7-filter-field="user"><span>用户</span><input data-g6-filter="user" placeholder="用户名称"></label>'
      +'<label class="g7-filter" data-g7-filter-field="status"><span>状态</span><select data-g6-filter="status"><option value="">全部状态</option>'+statuses.map(item=>'<option>'+esc(item)+'</option>').join('')+'</select></label>'
      +'<label class="g7-filter" data-g7-filter-field="source"><span>来源</span><select data-g6-filter="source"><option value="">全部来源</option>'+sources.map(item=>'<option>'+esc(item)+'</option>').join('')+'</select></label>'
      +'<label class="g7-filter" data-g7-filter-field="from"><span>开始日期</span><input type="date" data-g6-filter="from"></label>'
      +'<label class="g7-filter" data-g7-filter-field="to"><span>结束日期</span><input type="date" data-g6-filter="to"></label>'
      +'<button type="button" class="button primary small g18-find">查找</button><button type="button" class="button secondary small g6-clear">重置</button>'
      +'</div>';
    if(!/用户|领取人|受邀/.test(headerText))wrap.querySelector('[data-g7-filter-field="user"]').hidden=true;
    if(!sources.length)wrap.querySelector('[data-g7-filter-field="source"]').hidden=true;
    if(!rows.some(info=>info.date)&&!/时间|有效期/.test(headerText)){
      wrap.querySelector('[data-g7-filter-field="from"]').hidden=true;
      wrap.querySelector('[data-g7-filter-field="to"]').hidden=true;
    }
    return wrap;
  }

  function pageButtons(pages,current){
    const values=[];
    for(let page=1;page<=pages;page++){
      if(pages<=7||page===1||page===pages||Math.abs(page-current)<=1)values.push(page);
    }
    const unique=[...new Set(values)].sort((a,b)=>a-b);
    return unique.map((page,index)=>`${index&&page-unique[index-1]>1?'<span class="page-ellipsis">…</span>':''}<button type="button" data-page="${page}" class="${page===current?'active':''}">${page}</button>`).join('');
  }

  async function runBatch(target,infos,button,view){
    const selected=infos.filter(info=>info.check.checked&&isToggle(info.toggle));
    const changes=selected.map(info=>({info,toggle:toggleInfo(info.toggle)})).filter(entry=>entry.toggle&&entry.toggle.current!==(target==='启用'));
    if(!changes.length)return;
    const lines=changes.map(entry=>entry.toggle.label+'：'+(entry.toggle.current?'已启用':'已停用')+' → '+target);
    lines.push('确认后逐条提交，失败记录会保留原状态并在结果中说明。');
    if(!await window.G6.confirm('批量'+target+' '+changes.length+'条记录',lines))return;
    button.disabled=true;
    const outcomes=[];
    window.R3.skipConfirm=true;
    try{
      for(const entry of changes){
        const toggle=entry.toggle;
        try{
          if(toggle.kind==='user'){
            await window.R3.cmd('ADMIN_USER_CODE',{id:toggle.id,status:target});
          }else{
            const current=state()[TABLE_MAP[toggle.entity]].find(item=>item.id===toggle.id);
            await window.R3.cmd('ADMIN_SAVE',{entity:toggle.entity,record:{...current,status:toggle.entity==='survey'?(target==='启用'?'已发布':'停用'):target,expectedRevision:current.revision||1}});
          }
          outcomes.push(toggle.label+'：成功');
        }catch(error){
          outcomes.push(toggle.label+'：'+error.message);
        }
      }
    }finally{
      window.R3.skipConfirm=false;
    }
    view?.selectedIds?.clear();
    window.__g7UI?.render?.();
    window.__g7UI?.openModal?.({title:'批量处理结果',body:'<div class="g7-result-list">'+outcomes.map(line=>'<p>'+esc(line)+'</p>').join('')+'</div>',footer:'<button class="button primary" data-action="close-modal">知道了</button>'});
  }

  function decorateTable(table,tableIndex,scope){
    table.dataset.g7='yes';
    const tbody=table.tBodies[0];
    if(!tbody)return;
    const rows=[...tbody.rows].filter(row=>!row.querySelector('[colspan]'));
    if(!rows.length)return;
    const header=table.tHead?.rows[0];
    const headerText=header?.textContent||'';
    const panel=table.closest('.r3-card');
    panel?.classList.add('data-panel','g7-panel');
    const infos=rows.map((row,index)=>{
      const buttons=normalizeRowButtons(row);
      const toggle=buttons.find(isToggle)||null;
      if(toggle)annotateToggle(toggle);
      const text=row.textContent;
      return {
        row,
        index,
        id:buttons.find(button=>button.dataset.id)?.dataset.id||buttons.find(button=>button.dataset.code)?.dataset.code||String(index),
        buttons,
        toggle,
        text,
        lower:text.toLowerCase(),
        states:[...row.querySelectorAll('.r3-badge,.status')].map(item=>item.textContent.trim()).filter(Boolean),
        date:dateOf(text),
        check:null
      };
    });
    const key=[currentPage,tableIndex,panel?.querySelector('h3')?.textContent||'',headerText].join('|');
    const view=memo.get(key)||{query:'',user:'',status:'',source:'',from:'',to:'',page:1,pageSize:10,selectedIds:new Set()};
    if(!view.pageSize)view.pageSize=10;
    if(!view.selectedIds)view.selectedIds=new Set();
    memo.set(key,view);
    const hasToggle=false;
    if(hasToggle){
      if(header){
        const th=document.createElement('th');
        th.className='g7-select-cell';
        th.innerHTML='<input type="checkbox" aria-label="选择当前页全部">';
        header.prepend(th);
      }
      for(const info of infos){
        const cell=document.createElement('td');
        cell.className='g7-select-cell';
        cell.innerHTML='<input type="checkbox" aria-label="选择记录 '+(info.index+1)+'">';
        info.row.prepend(cell);
        info.check=cell.firstChild;
        info.check.checked=view.selectedIds.has(info.id);
      }
    }
    const wrap=document.createElement('div');
    wrap.className='g6-table-shell';
    table.parentElement.before(wrap);
    wrap.append(table.parentElement);
    const inDrawer=scope?.id==='drawer-root',inOverlay=inDrawer||scope?.id==='modal-root';
    let filters=null;
    if(!inDrawer){
      filters=buildFilters(headerText,infos);
      const stack=document.createElement('div');
      stack.className='toolbar-stack';
      stack.append(filters);
      wrap.prepend(stack);
    }
    let toolbar=null,selection=null,actionNodes=[],leftActions=null;
    if(!inDrawer){
      toolbar=document.createElement('div');
      toolbar.className='g6-table-tools toolbar toolbar-actions g8-table-toolbar';
      leftActions=document.createElement('div');
      leftActions.className='g8-table-actions-left';
      const pageActions=document.querySelector('.r3-admin-page>.page-head .page-actions');
      if(pageActions&&!inOverlay){
        while(pageActions.firstElementChild){
          const action=pageActions.firstElementChild;
          if(/导出/.test(action.textContent))action.remove();else leftActions.append(action);
        }
      }
      const exportButton=document.createElement('button');
      exportButton.type='button';
      exportButton.className='button secondary small g8-export';
      exportButton.textContent='导出';
      exportButton.title='导出当前筛选结果';
      exportButton.addEventListener('click',()=>exportCurrent());
      leftActions.append(exportButton);
      toolbar.append(leftActions);
      selection=document.createElement('span');
      selection.className='g6-selection';
      selection.textContent='已选 0 条';
      toolbar.append(selection);
      for(const target of ['启用','停用']){
        if(!hasToggle)break;
        const button=document.createElement('button');
        button.type='button';
        button.className='button secondary small';
        button.textContent='批量'+target;
        button.disabled=true;
        toolbar.append(button);
        actionNodes.push({button,target});
        button.addEventListener('click',()=>runBatch(target,infos,button,view));
      }
      const stack=wrap.querySelector('.toolbar-stack')||document.createElement('div');
      if(!stack.parentNode){
        stack.className='toolbar-stack';
        wrap.prepend(stack);
      }
      stack.append(toolbar);
    }
    const footer=document.createElement('div');
    footer.className='g6-pagination table-footer';
    footer.innerHTML='<span></span><div class="g8-pager"><div class="pagination" data-pages></div><select class="select-control" data-page-size aria-label="每页条数"><option value="10">10 条/页</option><option value="20">20 条/页</option><option value="30">30 条/页</option></select><label class="g8-jump">跳至 <input type="number" min="1" value="1" data-jump aria-label="跳转页码"> 页</label></div>';
    wrap.append(footer);
    const empty=document.createElement('p');
    empty.className='g6-empty';
    empty.textContent='没有符合筛选条件的记录，可重置后重试。';
    wrap.append(empty);

    function apply(){
      const filterTab=currentPage==='coupons'?g6Tabs.coupons:currentPage==='invites'||currentPage==='invite-relations'||currentPage==='invite-users'?g6Tabs.invites:currentPage==='invite-rewards'?g6Tabs.rewardView:'';
      const custom=window.R24Filters?.get(currentPage,filterTab,infos);
      const visible=Array.isArray(custom)?infos.filter(info=>window.R24Filters.match(info,view,currentPage,filterTab)):infos.filter(info=>(!view.query||info.lower.includes(view.query.toLowerCase()))
        &&(!view.user||info.text.includes(view.user))
        &&(!view.status||info.states.includes(view.status))
        &&(!view.source||info.text.includes(view.source))
        &&(!view.from||(info.date&&info.date>=view.from))
        &&(!view.to||(info.date&&info.date<=view.to)));
      const pages=Math.max(1,Math.ceil(visible.length/view.pageSize));
      view.page=Math.min(pages,view.page||1);
      view.visibleRows=visible;
      infos.forEach(info=>{info.row.hidden=true;});
      const pageRows=visible.slice((view.page-1)*view.pageSize,view.page*view.pageSize);
      pageRows.forEach(info=>{info.row.hidden=false;});
      const selected=infos.filter(info=>info.check?.checked);
      if(selection)selection.textContent='已选 '+selected.length+' 条';
      for(const node of actionNodes){
        const candidates=selected.map(info=>({info,toggle:toggleInfo(info.toggle)})).filter(entry=>entry.toggle&&entry.toggle.current!==(node.target==='启用'));
        node.button.disabled=!candidates.length;
        node.button.title=candidates.length?'仅处理已选记录中需要'+node.target+'的项目':'请先勾选需要'+node.target+'的记录';
      }
      footer.querySelector('span').textContent='共 '+visible.length+' 条 · 第 '+view.page+' / '+pages+' 页';
      footer.querySelector('[data-page-size]').value=String(view.pageSize);
      const jump=footer.querySelector('[data-jump]');jump.max=String(pages);jump.value=String(view.page);
      const pageBox=footer.querySelector('[data-pages]');pageBox.innerHTML='<button type="button" data-prev aria-label="上一页">上一页</button>'+pageButtons(pages,view.page)+'<button type="button" data-next aria-label="下一页">下一页</button>';
      pageBox.querySelector('[data-prev]').disabled=view.page===1;
      pageBox.querySelector('[data-next]').disabled=view.page===pages;
      pageBox.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{view.page=Number(button.dataset.page)||1;apply();}));
      empty.hidden=visible.length>0;
      if(header?.querySelector('.g7-select-cell input')){
        header.querySelector('.g7-select-cell input').checked=pageRows.length>0&&pageRows.every(info=>info.check?.checked);
      }
      if(currentPage==='foods'&&/份量单位/.test(headerText))lastFoodIds=visible.map(info=>info.buttons.find(button=>actionKind(button)==='r3-edit')?.dataset.id).filter(Boolean);
    }

    if(filters){
      filters.querySelectorAll('[data-g6-filter]').forEach(input=>{
        input.value=view[input.dataset.g6Filter]||'';

      });
      const find=()=>{filters.querySelectorAll('[data-g6-filter]').forEach(input=>view[input.dataset.g6Filter]=input.value);view.page=1;apply();};
      filters.querySelector('.g18-find').addEventListener('click',find);
      filters.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();find();}});
      filters.querySelector('.g6-clear').addEventListener('click',()=>{
        Object.assign(view,{query:'',user:'',status:'',source:'',from:'',to:'',page:1});
        filters.querySelectorAll('[data-g6-filter]').forEach(input=>{input.value='';view[input.dataset.g6Filter]='';});
        view.selectedIds.clear();
        apply();
      });
    }
    function exportCurrent(){
      const rowsSource=(view.visibleRows||infos).filter(info=>!info.row.hidden||view.visibleRows);
      const hasSelect=Boolean(header.querySelector('.g7-select-cell'));
      const headers=[...header.cells].map((cell,index)=>({text:cell.textContent.trim(),index})).filter(item=>item.text&&item.text!=='操作'&&!(hasSelect&&item.index===0)).map(item=>item.text);
      if(!headers.length||!rowsSource.length){window.__g7UI?.toast?.('没有可导出的数据','请调整筛选条件后再试','error');return;}
      const title=panel?.querySelector('h3')?.textContent?.trim()||document.querySelector('.page-head h1')?.textContent?.trim()||'增长运营数据';
      if(!window.XLSX){window.__g7UI?.toast?.('导出失败','表格组件未加载','error');return;}
      const dataRows=rowsSource.map(info=>{
        const cells=[...info.row.cells].slice(hasSelect?1:0);
        const record={};
        headers.forEach((label,index)=>{record[label]=cells[index]?.innerText?.trim().replace(/\s+/g,' ')||'';});
        return record;
      });
      window.G6.confirm('导出'+title,[`将导出当前筛选的 ${dataRows.length} 条记录。`,'导出包含当前表格显示的字段，不修改业务数据。']).then(ok=>{
        if(!ok)return;
        window.__g8LastExport={title,headers,rows:dataRows,page:currentPage};
        const workbook=window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook,window.XLSX.utils.json_to_sheet(dataRows),title.slice(0,28)||'数据');
        window.XLSX.writeFile(workbook,'渡鸦管家-r8-'+title+'-'+day()+'.xlsx');
      });
    }
    infos.forEach(info=>{if(info.check)info.check.addEventListener('change',()=>{info.check.checked?view.selectedIds.add(info.id):view.selectedIds.delete(info.id);apply();});});
    if(header?.querySelector('.g7-select-cell input')){
      header.querySelector('.g7-select-cell input').addEventListener('change',event=>{
        infos.filter(info=>!info.row.hidden).forEach(info=>{
          if(!info.check)return;
          info.check.checked=event.target.checked;
          info.check.checked?view.selectedIds.add(info.id):view.selectedIds.delete(info.id);
        });
        apply();
      });
    }
    footer.querySelector('[data-pages]').addEventListener('click',event=>{
      if(event.target.closest('[data-prev]')){view.page=Math.max(1,view.page-1);apply();}
      else if(event.target.closest('[data-next]')){
        const pages=Math.max(1,Math.ceil((view.visibleRows?.length||infos.length)/view.pageSize));
        view.page=Math.min(pages,view.page+1);apply();
      }
    });
    footer.querySelector('[data-page-size]').addEventListener('change',event=>{
      view.pageSize=Number(event.target.value)||10;
      view.page=1;
      apply();
    });
    footer.querySelector('[data-jump]').addEventListener('change',event=>{
      const pages=Math.max(1,Math.ceil((view.visibleRows?.length||infos.length)/view.pageSize));
      view.page=Math.min(pages,Math.max(1,Number(event.target.value)||1));
      apply();
    });
    apply();
  }

  function decorate(scope=document,page=currentPage){
    currentPage=page;
    if(!isGrowth()||!state())return;
    if(['coupon-form','survey-form','invite-form','food-form'].includes(currentPage)){
      scope.querySelectorAll('.r3-card').forEach(card=>card.classList.add('form-section'));
      scope.querySelectorAll('.r3-form-grid').forEach(grid=>grid.classList.add('form-grid'));
      scope.querySelectorAll('.r3-field').forEach(field=>field.classList.add('form-field'));
      scope.querySelectorAll('.r3-form-footer').forEach(footer=>footer.classList.add('form-actions'));
    }
    [...scope.querySelectorAll('table.data-table:not([data-g7])')].forEach((table,index)=>decorateTable(table,index,scope));
  }

  document.addEventListener('click',async event=>{
    const button=event.target.closest('button[data-action="g6-user-code-toggle"]');
    if(!button||button.disabled)return;
    event.preventDefault();
    event.stopPropagation();
    const owner=user(button.dataset.id);
    if(!owner)return;
    button.disabled=true;
    try{
      await window.R3.cmd('ADMIN_USER_CODE',{id:owner.id,status:(owner.inviteStatus||'启用')==='停用'?'启用':'停用'});
      window.__g7UI?.render?.();
      window.__g7UI?.toast?.('状态已更新',owner.name);
    }catch(error){
      if(!error.cancelled)window.__g7UI?.toast?.('操作未完成',error.message,'error');
    }finally{
      button.disabled=false;
    }
  },true);

  const originalDescribe=window.G6?.describe?.bind(window.G6);
  if(originalDescribe)window.G6.describe=(type,payload,data)=>{
    const info=originalDescribe(type,payload,data);
    info.lines=(info.lines||[]).map(line=>line.replace('保存后通过导出/导入同步另一端，历史邀请及奖励不会删除。','保存后仅更新当前后台演示数据，历史邀请及奖励不会删除。'));
    return info;
  };
  window.G7={decorate,foodIds:()=>lastFoodIds?[...lastFoodIds]:null};
})();
