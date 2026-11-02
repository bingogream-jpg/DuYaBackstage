// V1.5-r32 unified growth/activity list layout and compact text presentation.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const ae=C.ae;
  const pages=new Set(['coupons','invites','invite-relations','invite-users','invite-rewards','user-growth','checkin-activities','activity-records','checkin-users','foods','food-categories','surveys']);
  const actionSelector='.page-actions,.r31-page-actions,.g21-export-toolbar,.g20-table-actions,.g6-table-tools';
  const filterSelector='.g6-filters,.g20-filter-row,.g21-record-filters,.r31-reward-filters';
  const tableSelector='.g6-table-shell,.r3-table-wrap,.table-wrap';

  function columnKind(label){
    if(/^(操作|查看|操作项)$/.test(label))return 'actions';
    if(/状态/.test(label))return 'status';
    if(/简介|描述|说明|内容|原因/.test(label))return 'description';
    if(/奖励|获奖/.test(label))return 'reward';
    if(/时间|日期|有效期/.test(label))return 'date';
    if(/人数|数量|次数|天数|总数|上限|发放|完成/.test(label))return 'number';
    if(/用户|名称|商户|阶段|菜品|问卷|分类/.test(label))return 'name';
    return '';
  }

  function simpleTextCell(cell){
    if(!cell||cell.querySelector('button,input,select,textarea,.r24-identity,.r26-switch,.r26-reward-cell,.r26-audience,.r26-path-cell,.r31-reward-value,.r31-path-cell,.r32-cell-clamp'))return false;
    return ![...cell.children].some(node=>!['B','STRONG','EM','BR'].includes(node.tagName));
  }

  function decorateTable(table){
    const head=table.tHead?.rows?.[0],body=table.tBodies?.[0];
    if(!head||!body)return;
    table.classList.add('r32-table');
    const heads=[...head.cells];
    heads.forEach((th,index)=>{
      const kind=columnKind(th.textContent.trim());
      if(kind)th.dataset.r32Col=kind;
      for(const row of body.rows){
        const cell=row.cells[index];
        if(!cell)continue;
        if(kind)cell.dataset.r32Col=kind;
        const text=cell.innerText.trim();
        if(text&&kind!=='actions'&&kind!=='status')cell.title=text;
        if(kind==='description'&&simpleTextCell(cell)){
          cell.innerHTML='<span class="r32-cell-clamp">'+ae(text)+'</span>';
        }else if(kind!=='actions'&&kind!=='status'&&simpleTextCell(cell)&&text.length>48){
          cell.innerHTML='<span class="r32-cell-clamp">'+ae(text)+'</span>';
        }
      }
    });
    table.dataset.r32Columns=String(heads.length);
    table.dataset.r32Integrity=String([...body.rows].every(row=>row.cells.length===heads.length));
  }

  function sourceButtons(root,card){
    const buttons=[];
    for(const source of root.querySelectorAll(actionSelector)){
      if(source.closest('table')||source.closest('#modal-root'))continue;
      for(const button of source.querySelectorAll('button'))if(!button.closest('table')&&!buttons.includes(button))buttons.push(button);
      if(source!==card&&!source.querySelector('button'))source.remove();
    }
    return buttons;
  }

  function arrangeCard(root,card){
    const filter=card.querySelector(filterSelector);
    const tableWrap=card.querySelector(tableSelector);
    if(!filter||!tableWrap||filter.classList.contains('a37-filters'))return;
    card.classList.add('r32-list-card');
    card.querySelectorAll(':scope>.r32-filter-divider,:scope>.r32-actions-row,:scope>.r32-table-divider').forEach(node=>node.remove());
    const heading=card.querySelector(':scope>h3');
    if(root.querySelector(':scope>.tabs')&&heading)heading.remove();else if(heading)heading.after(filter);
    if(!heading?.isConnected)card.prepend(filter);
    const buttons=sourceButtons(root,card);
    const actions=document.createElement('div');actions.className='r32-actions-row';
    if(buttons.length)buttons.forEach(button=>actions.append(button));
    const solid=document.createElement('div');solid.className='r32-table-divider';
    if(buttons.length)tableWrap.before(actions);
    tableWrap.before(solid);
    root.querySelectorAll('.page-actions,.r31-page-actions,.g21-export-toolbar,.g20-table-actions,.g6-table-tools').forEach(node=>{
      if(node!==actions&&!node.closest('table')&&!node.querySelector('button'))node.remove();
    });
    card.querySelectorAll('table.data-table').forEach(decorateTable);
  }

  function enhance(scope=document){
    if(!scope?.querySelectorAll)return;
    const root=scope.querySelector('#workspace .r3-admin-page,.r3-admin-page')||scope;
    if(!root?.querySelectorAll)return;
    if(root.id==='modal-root'||scope.id==='modal-root'){
      root.querySelectorAll('table.data-table').forEach(decorateTable);
      return;
    }
    if(!pages.has(C.state?.page))return;
    root.classList.add('r32-admin-page');
    const cards=[...root.querySelectorAll('section.r3-card')].filter(card=>card.querySelector('table.data-table')&&!card.closest('#modal-root'));
    if(!cards.length){root.querySelectorAll('table.data-table').forEach(decorateTable);return;}
    cards.forEach(card=>arrangeCard(root,card));
  }

  const renderBase=C.renderApp;
  C.renderApp=function(){const result=renderBase.apply(this,arguments);enhance(document);return result;};
  const modalBase=C.openModal;
  C.openModal=function(){const result=modalBase.apply(this,arguments);enhance(document.querySelector('#modal-root'));return result;};
  const decorateBase=window.G7?.decorate;
  if(decorateBase)window.G7.decorate=function(){const result=decorateBase.apply(this,arguments);enhance(arguments[0]||document);return result;};

  window.R32Layout={enhance,arrangeCard,decorateTable,columnKind};
})();
