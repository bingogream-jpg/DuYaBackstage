// R19: deterministic layout, menu dialog stack, and read-only merchant drill-downs.
(()=>{
 const C=window.__g8Core,S=()=>R3.state,e=C.ae,btn=(t,a,x='',cls='secondary small')=>C.ab(t,a,x,cls);
 const growth=new Set(['coupons','coupon-issue','invites','invite-settings','invite-relations','invite-users','invite-rewards','user-growth','user-growth-form','checkin-activities','checkin-activity-form','activity-records','checkin-users','foods','surveys','coupon-form','survey-form','invite-form','food-form','food-categories','menu']);
 function prepareFilters(scope=document){
   for(const find of scope.querySelectorAll('button')){
     if(!/^(查找|查询)$/.test(find.textContent.trim())||find.closest('.g19-filter-actions'))continue;
     const parent=find.parentElement,reset=[...parent.children].find(n=>n.tagName==='BUTTON'&&/^(重置|重置筛选|清空筛选)$/.test(n.textContent.trim()));if(!reset)continue;
     const group=document.createElement('div');group.className='g19-filter-actions';find.before(group);group.append(find,reset);
   }
 }
 function actionRows(scope=document){
   scope.querySelectorAll('.table-actions').forEach(box=>{
     // Flatten old row wrappers once; retain button nodes and handlers.
     box.querySelectorAll('.action-button-row').forEach(row=>row.replaceWith(...row.childNodes));
     const buttons=[...box.children].filter(n=>n.matches('button,.row-button,.button'));if(!buttons.length)return;
     const width=buttons.reduce((sum,b)=>sum+Math.max(64,b.textContent.trim().length*12+20),0)+(buttons.length-1)*8;
     box.classList.add('g19-action-buttons');box.style.setProperty('--g19-actions-width',width+'px');
     const cell=box.closest('td');if(cell){cell.classList.add('g19-action-cell');cell.style.setProperty('--g19-actions-width',width+'px');}
   });
 }
 function decorate(scope=document){
   prepareFilters(scope);window.R22?.people(scope);
   if(!growth.has(C.state.page))return;
   actionRows(scope);
   scope.querySelectorAll('table.data-table').forEach(table=>{
     table.classList.add('g19-table');const heads=[...table.querySelectorAll('thead tr:first-child th')];
     heads.forEach((th,index)=>{const name=th.textContent.trim(),kind=name==='奖励内容'?'content':name==='奖励来源'?'source':name==='奖励名称'?'name':null;if(kind){th.classList.add('g19-reward-'+kind);for(const row of table.tBodies[0]?.rows||[])row.cells[index]?.classList.add('g19-reward-'+kind);}});
   });
 }
 const legacyRows=styleActionRows;styleActionRows=function(){if(!growth.has(C.state.page))legacyRows();else actionRows(document);prepareFilters(document);};
 document.addEventListener('keydown',event=>{const link=event.target.closest('.g19-metric-link');if(link&&['Enter',' '].includes(event.key)){event.preventDefault();link.click();}});
 const priorDecorate=G7.decorate;G7.decorate=function(){const result=priorDecorate.apply(this,arguments);decorate(arguments[0]||document);return result;};
 const renderBase=renderApp;renderApp=function(){const r=renderBase.apply(this,arguments);decorate(document);return r;};
 const modalBase=openModal;openModal=function(){const r=modalBase.apply(this,arguments);decorate(document.querySelector('#modal-root'));return r;};
 document.addEventListener('change',event=>{if(event.target.closest('[data-g15-stage],[data-g15-growth-stage]'))queueMicrotask(()=>R18.enhance(document));});
 document.addEventListener('click',event=>{if(event.target.closest('[data-g15-stage]>header,[data-g15-growth-stage]>header'))queueMicrotask(()=>R18.enhance(document));});

 // Restore the pre-r18 image cards; nutrition belongs to a separate brand/week dialog.
 renderMenuWeek=function(){const box=document.createElement('div');box.innerHTML=R18.menuBase();box.querySelectorAll('section.r3-card').forEach(section=>{if(section.querySelector('h3')?.textContent.includes('V1.5 菜品营养值补录'))section.remove();});
   box.querySelectorAll('.menu-card,.menu-grid-card').forEach(card=>{const trigger=card.querySelector('[data-brand][data-week]');if(!trigger)return;const footer=card.querySelector('footer,.menu-grid-ops');footer?.insertAdjacentHTML('beforeend','<button type="button" class="row-button compact" data-action="g19-menu-nutrition" data-brand="'+e(trigger.dataset.brand)+'" data-week="'+e(trigger.dataset.week)+'">营养成分</button>');});return box.innerHTML;
 };
 let nutritionContext=null,parentLayer=null,parentScroll={top:0,left:0,bodyTop:0,bodyLeft:0};
 function currentPlan(){const c=nutritionContext,week=data.menuWeeks.find(w=>w.id===c.weekId);return R18.planFor(c.brand,week);}
 function updateNutrition(){const root=document.querySelector('#modal-root .g19-nutrition');if(!root)return;const plan=currentPlan(),host=root.querySelector('[data-g19-nutrition-table]'),{date,meal}=nutritionContext.applied;
   host.innerHTML=plan.dishes.length?R18.nutritionTable(plan):'<div class="r3-empty"><b>本周暂无菜品营养记录</b><p>添加每日菜品并填写实际克重，未补录不显示虚构营养值。</p>'+btn('添加菜品','g18-menu-edit','data-brand="'+e(plan.brand)+'" data-week="'+plan.weekId+'"','primary')+'</div>';
   host.querySelectorAll('tbody tr').forEach(row=>{const b=row.querySelector('[data-action="g18-menu-edit"]');row.hidden=!!(date&&b?.dataset.date!==date||meal&&b?.dataset.meal!==meal);});
   if(plan.dishes.length&&![...host.querySelectorAll('tbody tr')].some(r=>!r.hidden))host.insertAdjacentHTML('beforeend','<p class="r3-empty">没有符合日期和餐次的记录，请重置筛选。</p>');decorate(root);
 }
 C.ar3Action('g19-menu-nutrition',node=>{
   nutritionContext={brand:node.dataset.brand,weekId:node.dataset.week,applied:{date:'',meal:''}};const plan=currentPlan(),week=data.menuWeeks.find(w=>w.id===plan.weekId);
   openModal({title:plan.brand+' · 营养成分 · '+plan.start+' 至 '+plan.end,wide:true,body:'<div class="g19-nutrition"><div class="g19-dialog-filters"><label>日期<select name="nutritionDate"><option value="">本周全部日期</option>'+Array.from({length:7},(_,i)=>{const d=new Date(plan.start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);const value=d.toISOString().slice(0,10);return '<option>'+value+'</option>';}).join('')+'</select></label><label>餐次<select name="nutritionMeal"><option value="">全部餐次</option><option>午餐</option><option>晚餐</option></select></label><div class="g19-filter-actions"><button type="button" class="button primary small" data-g19-menu-find>查找</button><button type="button" class="button secondary small" data-g19-menu-reset>重置</button></div></div><div data-g19-nutrition-table></div></div>',footer:btn('关闭','close-modal')});
   const root=document.querySelector('.g19-nutrition'),find=()=>{nutritionContext.applied={date:root.querySelector('[name="nutritionDate"]').value,meal:root.querySelector('[name="nutritionMeal"]').value};updateNutrition();};root.querySelector('[data-g19-menu-find]').onclick=find;root.querySelector('[data-g19-menu-reset]').onclick=()=>{root.querySelectorAll('select').forEach(s=>s.value='');find();};root.querySelector('.g19-dialog-filters').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();find();}};updateNutrition();
 });
 const editDish=v15Actions['g18-menu-edit'];C.ar3Action('g18-menu-edit',async node=>{
   const root=document.querySelector('#modal-root'),parent=root.querySelector('.g19-nutrition')?.closest('.modal-backdrop');if(parent){parentLayer=parent;const table=parent.querySelector('.g18-menu-section .table-wrap'),body=parent.querySelector('.modal-body');parentScroll={top:table?.scrollTop||0,left:table?.scrollLeft||0,bodyTop:body.scrollTop,bodyLeft:body.scrollLeft};}
   node.disabled=false;await editDish(node);if(!document.querySelector('#g18-menu-form'))parentLayer=null;
 });
 // A narrow observer restores the preserved parent node only when its child closes.
 new MutationObserver(()=>{const root=document.querySelector('#modal-root');if(!root.children.length&&parentLayer){const saved=parentLayer;parentLayer=null;if(C.state.page!=='menu')return;root.append(saved);updateNutrition();const scroll=saved.querySelector('.g18-menu-section .table-wrap');if(scroll){scroll.scrollTop=parentScroll.top;scroll.scrollLeft=parentScroll.left;}const body=saved.querySelector('.modal-body');body.scrollTop=parentScroll.bodyTop;body.scrollLeft=parentScroll.bodyLeft;}}).observe(document.querySelector('#modal-root'),{childList:true});

 // Merchant table links and drill-downs share R19Stats with Store.snapshot.
 const inviteBase=C.V15_PAGES.invites;
 const metricLink=(m,view,text,label)=>'<span role="button" tabindex="0" class="cell-link g19-metric-link" data-action="g19-merchant-stats" data-id="'+m.id+'" data-view="'+view+'" aria-label="'+e(m.name+' '+label)+'">'+e(text)+'</span>';
 C.V15_PAGES.invites=function(){const box=document.createElement('div');box.innerHTML=inviteBase();if(C.g6Tabs.invites!=='merchant')return box.innerHTML;
   box.querySelectorAll('tbody tr').forEach(row=>{const id=row.querySelector('[data-entity="merchant"][data-id]')?.dataset.id;if(!id)return;const m=S().merchants.find(m=>m.id===id),x=R19Stats.merchant(S(),id),heads=[...row.closest('table').querySelectorAll('th')].map(h=>h.textContent.trim()),people=heads.indexOf('邀请 / 订购人数'),money=heads.indexOf('订购次数 / 实收');if(people>=0)row.cells[people].innerHTML=metricLink(m,'invitations',x.invitations.length,'邀请人数')+' <span class="cell-subtle">/</span> '+metricLink(m,'buyers',x.buyers.length,'订购人数');if(money>=0)row.cells[money].innerHTML=metricLink(m,'orders',x.orders.length,'订购次数')+' <span class="cell-subtle">/</span> '+metricLink(m,'receipts','¥'+x.revenue.toFixed(2),'实收金额');});return box.innerHTML;
 };
 let merchantView=null;
 const tabs=[['invitations','邀请用户'],['buyers','订购用户'],['orders','订购订单'],['receipts','实收明细']];
 const identity=u=>'<b>'+e(u?.name||'未知用户')+'</b><small>'+e(u?.id||'—')+'</small>',money=n=>'¥'+Number(n).toFixed(2),date=t=>t?new Date(t).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'—',localDay=t=>t?__DUYA_LOCAL_ENGINE.dateKey(Date.parse(t)):'';
 function merchantRows(){const v=merchantView,x=R19Stats.merchant(S(),v.id);let headers,rows;
   if(v.tab==='invitations'){headers=['用户 / ID','手机号','邀请码','绑定时间','邀请状态'];rows=x.invitations.map(r=>({cells:[identity(r.user),e(r.user?.profile?.phone||'—'),e(r.relation.code),date(r.relation.boundAt),C.badge(r.relation.status)],search:[r.user?.name,r.user?.id,r.user?.profile?.phone,r.relation.code].join(' '),status:r.relation.status,time:r.relation.boundAt}));}
   else if(v.tab==='buyers'){headers=['用户 / ID','手机号','计入订单数','计入实收','最近支付时间'];rows=x.buyers.map(r=>{const payments=x.orders.filter(o=>o.user.id===r.user.id).map(o=>o.order.paidAt).sort();return {cells:[identity(r.user),e(r.user.profile?.phone||'—'),r.count,money(r.revenue),date(payments.at(-1))],search:[r.user.name,r.user.id,r.user.profile?.phone].join(' '),status:'',time:payments.at(-1)};});}
   else {headers=['订单号','用户 / ID','手机号','套餐 / 品牌','支付时间','支付金额','订单状态',v.tab==='receipts'?'退款金额':'退款状态','计入实收'];rows=x[v.tab].map(r=>({cells:[e(r.order.id),identity(r.user),e(r.user.profile?.phone||'—'),'<b>'+e(r.order.pkg||'—')+'</b><small>'+e(r.order.brand||'—')+'</small>',date(r.order.paidAt),money(r.order.price),C.badge(r.order.status),v.tab==='receipts'?money(r.order.status==='已退款'?r.order.price:0):'未退款',money(r.net)],search:[r.order.id,r.user.name,r.user.id,r.user.profile?.phone,r.order.pkg,r.order.brand].join(' '),status:r.order.status,time:r.order.paidAt}));}
   const f=v.views[v.tab].applied;rows=rows.filter(r=>(!f.keyword||r.search.toLowerCase().includes(f.keyword.toLowerCase()))&&(!f.status||r.status===f.status)&&(!f.from||localDay(r.time)>=f.from)&&(!f.to||localDay(r.time)<=f.to));rows.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||'')));return {headers,rows,x};
 }
 function mountMerchant(){
   const root=document.querySelector('.g19-merchant-detail');if(!root)return;const v=merchantView,view=v.views[v.tab],{headers,rows,x}=merchantRows(),pages=Math.max(1,Math.ceil(rows.length/view.size));view.page=Math.min(view.page,pages);
   root.querySelector('[data-g19-stats-summary]').textContent='邀请 '+x.invitations.length+' 人 · 订购 '+x.buyers.length+' 人 · 订购 '+x.orders.length+' 单 · 实收 '+money(x.revenue);
   root.querySelector('[data-g19-stats-table]').innerHTML='<div class="table-wrap"><table class="data-table g19-stats-table" data-g7="yes"><thead><tr>'+headers.map(h=>'<th>'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice((view.page-1)*view.size,view.page*view.size).map(r=>'<tr>'+r.cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+(rows.length?'':'<p class="r3-empty">暂无符合条件的记录</p>');
   root.querySelector('[data-g19-stats-count]').textContent='共 '+rows.length+' 条 · 第 '+view.page+' / '+pages+' 页';root.querySelector('[data-g19-stats-prev]').disabled=view.page===1;root.querySelector('[data-g19-stats-next]').disabled=view.page===pages;root.querySelector('[data-g19-stats-size]').value=view.size;decorate(root);
 }
 function renderMerchant(){const root=document.querySelector('.g19-merchant-detail'),v=merchantView,view=v.views[v.tab];root.innerHTML='<div class="tabs g19-stats-tabs">'+tabs.map(([id,label])=>'<button type="button" class="tab-button '+(v.tab===id?'active':'')+'" data-g19-stats-tab="'+id+'">'+label+'</button>').join('')+'</div><p class="g19-stats-summary" data-g19-stats-summary></p><p class="form-hint">仅统计绑定后的归属订单；退款不计入订购人数、次数和实收。实收明细保留退款订单，计入金额为零。</p><div class="g19-dialog-filters"><label>关键词<input name="merchantKeyword" placeholder="用户名 / 用户ID / 手机号 / 订单号" value="'+e(view.draft.keyword)+'"></label><label>状态<select name="merchantStatus"><option value="">全部状态</option>'+[...new Set(v.tab==='invitations'?R19Stats.merchant(S(),v.id).invitations.map(r=>r.relation.status):v.tab==='buyers'?[]:R19Stats.merchant(S(),v.id)[v.tab].map(r=>r.order.status))].map(s=>'<option '+(s===view.draft.status?'selected':'')+'>'+e(s)+'</option>').join('')+'</select></label><label>开始日期<input type="date" name="merchantFrom" value="'+e(view.draft.from)+'"></label><label>结束日期<input type="date" name="merchantTo" value="'+e(view.draft.to)+'"></label><div class="g19-filter-actions"><button type="button" class="button primary small" data-g19-stats-find>查找</button><button type="button" class="button secondary small" data-g19-stats-reset>重置</button></div></div><div class="g19-stats-toolbar">'+btn('导出','g19-merchant-export')+'</div><div data-g19-stats-table></div><div class="table-footer"><span data-g19-stats-count></span><div class="g19-stats-pager"><button type="button" class="button secondary small" data-g19-stats-prev>上一页</button><button type="button" class="button secondary small" data-g19-stats-next>下一页</button><select data-g19-stats-size><option value="10">10条/页</option><option value="20">20条/页</option><option value="30">30条/页</option></select></div></div>';
   const readDraft=()=>view.draft={keyword:root.querySelector('[name="merchantKeyword"]').value.trim(),status:root.querySelector('[name="merchantStatus"]').value,from:root.querySelector('[name="merchantFrom"]').value,to:root.querySelector('[name="merchantTo"]').value};
   root.querySelectorAll('[data-g19-stats-tab]').forEach(b=>b.onclick=()=>{readDraft();v.tab=b.dataset.g19StatsTab;renderMerchant();});root.querySelector('[data-g19-stats-find]').onclick=()=>{readDraft();if(view.draft.from&&view.draft.to&&view.draft.from>view.draft.to){toast('日期范围无效','开始日期不能晚于结束日期','error');return;}view.applied={...view.draft};view.page=1;mountMerchant();};root.querySelector('[data-g19-stats-reset]').onclick=()=>{view.draft=view.applied={keyword:'',status:'',from:'',to:''};view.page=1;renderMerchant();};root.querySelector('.g19-dialog-filters').onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();root.querySelector('[data-g19-stats-find]').click();}};root.querySelector('[data-g19-stats-prev]').onclick=()=>{view.page--;mountMerchant();};root.querySelector('[data-g19-stats-next]').onclick=()=>{view.page++;mountMerchant();};root.querySelector('[data-g19-stats-size]').onchange=ev=>{view.size=+ev.target.value;view.page=1;mountMerchant();};mountMerchant();
 }
 C.ar3Action('g19-merchant-stats',node=>{merchantView={id:node.dataset.id,tab:node.dataset.view,views:Object.fromEntries(tabs.map(([id])=>[id,{page:1,size:10,draft:{keyword:'',status:'',from:'',to:''},applied:{keyword:'',status:'',from:'',to:''}}]))};const m=S().merchants.find(m=>m.id===merchantView.id);openModal({title:m.name+' · 邀请与订购详情',wide:true,body:'<div class="g19-merchant-detail"></div>',footer:btn('关闭','close-modal')});renderMerchant();});
 C.ar3Action('g19-merchant-export',async()=>{const {headers,rows,x}=merchantRows(),label=tabs.find(([id])=>id===merchantView.tab)[1];if(!rows.length){toast('暂无可导出数据','请调整筛选条件后再试','error');return;}if(!await G6.confirm('导出'+label,['商户：'+x.merchant.name,'将导出当前标签全部筛选结果，共 '+rows.length+' 条，不限当前页。']))return;
   const plain=html=>{if(typeof html==='number')return html;const box=document.createElement('div');box.innerHTML=String(html);box.querySelectorAll('small').forEach(n=>n.before(document.createTextNode(' ')));return box.textContent.trim();},values=rows.map(r=>r.cells.map((cell,index)=>{const value=plain(cell);return ['支付金额','退款金额','计入实收'].includes(headers[index])?Number(String(value).replace(/[¥,]/g,'')):value;})),book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([headers,...values]),label);window.__r19LastExport={merchantId:merchantView.id,tab:merchantView.tab,headers,rows:values};XLSX.writeFile(book,'渡鸦管家-'+x.merchant.name+'-'+label+'.xlsx');
 });
 window.R19={prepareFilters,decorate,actionRows,merchantRows,updateNutrition};
})();
