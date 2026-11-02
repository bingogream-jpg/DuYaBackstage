// V1.5-r33 grouped filters, fixed actions and final list spacing.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const ae=C.ae;
  const filterSelector='.g6-filters,.g20-filter-row,.g21-record-filters,.r31-reward-filters';

  function captionFor(label){
    return label.querySelector(':scope>span')?.textContent.trim()||label.childNodes[0]?.textContent.trim()||'';
  }

  function normalizeFilter(card){
    const filter=card.querySelector(filterSelector);
    if(!filter||filter.dataset.r33Normalized)return;
    filter.dataset.r33Normalized='yes';
    filter.classList.add('r33-filter');
    const host=filter.querySelector(':scope>.toolbar-group')||filter;
    const textRow=document.createElement('div');textRow.className='r33-filter-text-row';
    const tabsRow=document.createElement('div');tabsRow.className='r33-filter-tabs-row';
    const storage=document.createElement('div');storage.className='r33-hidden-filter-storage';storage.hidden=true;
    let actionGroup=null;
    const tabSources=[];
    let pendingCaption='';
    for(const node of [...host.children]){
      if(node.classList?.contains('g19-filter-actions')){actionGroup=node;continue;}
      if(node.matches?.('label')){
        const tabs=node.querySelector(':scope>.r26-filter-tabs,:scope>.r31-filter-tabs');
        const select=node.querySelector(':scope>select');
        if(tabs&&select){
          tabSources.push({node,tabs,caption:captionFor(node)});
          node.hidden=true;
          storage.append(node);
          continue;
        }
        textRow.append(node);
        continue;
      }
      if(node.matches?.('.r31-filter-label,.r31-filter-tabs')){
        if(node.classList.contains('r31-filter-label')){pendingCaption=node.textContent.trim();continue;}
        tabSources.push({node,tabs:node,caption:pendingCaption});
        pendingCaption='';
        continue;
      }
      if(node.matches?.('.r31-filter-row')){
        for(const child of [...node.children]){
          if(child.classList.contains('g19-filter-actions'))actionGroup=child;
          else if(child.matches('label'))textRow.append(child);
          else if(child.matches('.r31-filter-label,.r31-filter-tabs'))continue;
        }
        continue;
      }
      textRow.append(node);
    }
    if(actionGroup)textRow.append(actionGroup);
    for(const source of tabSources){
      const group=document.createElement('div');group.className='r33-tab-group';
      if(source.caption)group.insertAdjacentHTML('afterbegin','<span class="r33-tab-caption">'+ae(source.caption)+'</span>');
      const scroll=document.createElement('div');scroll.className='r33-tab-scroll';
      source.tabs.classList.add('r33-tab-scroll-inner');
      scroll.append(source.tabs);
      group.append(scroll);
      tabsRow.append(group);
    }
    tabsRow.append(storage);
    host.replaceChildren(textRow);
    if(tabsRow.childElementCount>1)host.append(tabsRow);
    if(!textRow.childElementCount)textRow.remove();
  }

  function dedupeActions(root){
    for(const row of root.querySelectorAll('.r32-actions-row')){
      const seen=new Set();
      for(const button of [...row.querySelectorAll(':scope>button,:scope>.button')]){
        const key=button.textContent.trim();
        if(seen.has(key))button.remove();else seen.add(key);
      }
    }
  }

  function enhance(scope=document){
    const root=scope?.querySelector?.('#workspace .r3-admin-page,.r3-admin-page')||scope;
    if(!root?.querySelectorAll)return;
    if(root.id==='modal-root'||scope.id==='modal-root'){
      root.querySelectorAll('table.data-table').forEach(C.R32Layout?.decorateTable||(()=>{}));
      return;
    }
    if(C.state?.page==='foods'){
      root.querySelectorAll('.r3-card>.r3-tabs').forEach(node=>node.remove());
    }
    for(const card of root.querySelectorAll('.r32-list-card'))normalizeFilter(card);
    dedupeActions(root);
  }

  const renderBase=C.renderApp;
  C.renderApp=function(){const result=renderBase.apply(this,arguments);enhance(document);return result;};
  const decorateBase=window.G7?.decorate;
  if(decorateBase)window.G7.decorate=function(){const result=decorateBase.apply(this,arguments);enhance(arguments[0]||document);return result;};

  window.R33={enhance,normalizeFilter,dedupeActions};
})();
