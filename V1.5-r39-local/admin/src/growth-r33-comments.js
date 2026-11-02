// Scoped comment corrections; retain original DOM controls and their event handlers.
(()=>{
  const C=window.__g8Core;if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  function enhance(scope=document){
    const root=scope?.querySelectorAll?scope:document;
    root.querySelectorAll('.r33-filter').forEach(filter=>{
      const host=filter.querySelector(':scope>.toolbar-group')||filter;
      const text=host.querySelector(':scope>.r33-filter-text-row'),tabs=host.querySelector(':scope>.r33-filter-tabs-row');
      if(!text)return;
      const actions=text.querySelector('.g19-filter-actions');
      if(tabs){for(const group of [...tabs.children]){if(group.classList.contains('r33-hidden-filter-storage'))filter.append(group);else actions?text.insertBefore(group,actions):text.append(group);}tabs.remove();}
      filter.classList.add('r33c-filter');
    });
    root.querySelectorAll('.r31-filter-grid').forEach(grid=>{
      const query=grid.querySelector('[data-r31-usage-query]')?.closest('label'),status=grid.querySelector('[data-r31-usage-status]')?.closest('label');if(query&&status){query.after(status);grid.closest('.r31-modal-table')?.classList.add('g21-readonly');}
    });
    root.querySelectorAll('.g8-picker-filters').forEach(filters=>{const eligible=filters.querySelector('.g8-check');if(eligible)filters.append(eligible);});
    // Old decorators attach action classes to the last cell, even on numeric summaries.
    root.querySelectorAll('table.r32-table').forEach(table=>{
      const heads=[...table.tHead?.rows[0]?.cells||[]];
      heads.forEach((th,index)=>{
        const action=/^(操作|查看|操作项)$/.test(th.textContent.trim());
        for(const cell of [th,...[...table.tBodies[0]?.rows||[]].map(row=>row.cells[index]).filter(Boolean)]){
          cell.classList.toggle('r33c-data-cell',!action);
          if(!action&&cell.dataset.r32Col==='actions')delete cell.dataset.r32Col;
        }
      });
    });
    root.querySelectorAll('.r33c-footer').forEach(n=>{if(C.state.page!=='coupon-issue')n.remove();});
  }
  const original=C.renderApp;C.renderApp=function(){const result=original.apply(this,arguments);enhance(document);return result;};
  const decorate=window.G7?.decorate;if(decorate)window.G7.decorate=function(){const result=decorate.apply(this,arguments);enhance(arguments[0]||document);return result;};
  const modal=C.openModal;C.openModal=function(){const result=modal.apply(this,arguments);enhance(document.querySelector('#modal-root'));return result;};
  const dirtyIssue=event=>{if(C.state.page==='coupon-issue'&&event.target.closest('.g8-issue-main'))g6Dirty=true;};
  document.addEventListener('input',dirtyIssue);document.addEventListener('change',dirtyIssue);
  document.addEventListener('click',event=>{if(C.state.page==='coupon-issue'&&event.target.closest('[data-picker-apply]'))g6Dirty=true;});
  window.R33Comments={enhance};
})();
