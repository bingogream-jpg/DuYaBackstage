// R18 presentation and menu/category workflow. All writes use R3.cmd.
(()=>{
 const C=window.__g8Core;if(!C)return;
 const S=()=>window.R3.state,e=C.ae,clone=x=>JSON.parse(JSON.stringify(x)),button=(text,action,attrs='',cls='secondary small')=>C.ab(text,action,attrs,cls);
 const chevron='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>';
 const err=error=>{if(!error.cancelled)toast('操作未完成',error.message,'error');};

 // Preserve the normal renderer/decorator lifecycle. No full-page MutationObserver.
 function enhance(scope=document){
   if(!['coupons','coupon-issue','invites','invite-settings','invite-relations','invite-users','invite-rewards','user-growth','user-growth-form','checkin-activities','checkin-activity-form','activity-records','checkin-users','foods','surveys','coupon-form','survey-form','invite-form','food-form','food-categories','menu'].includes(C.state.page))return;
   scope.querySelectorAll('.g7-summary,.g6-stats').forEach(node=>{
     if(node.dataset.r18Summary)return;node.dataset.r18Summary='yes';
     const children=[...node.children];node.className='summary-ribbon finance-filter-strip g18-summary';
     children.forEach(child=>{const value=child.querySelector('b,strong');if(!value)return;const label=child.textContent.replace(value.textContent,'').trim(),div=document.createElement('div');div.innerHTML='<span>'+e(label)+'</span><strong>'+e(value.textContent)+'</strong>';child.replaceWith(div);});
   });
   scope.querySelectorAll('[data-g15-stage],[data-g15-growth-stage]').forEach(card=>{
     const header=card.querySelector(':scope>header'),indicator=header?.querySelector('.g16-accordion-indicator');
     if(header&&!header.querySelector('.g18-stage-tools')){const tools=document.createElement('div');tools.className='g18-stage-tools';[...header.children].slice(1).forEach(child=>tools.append(child));header.append(tools);}
     const toggle=header?.querySelector('input[type="checkbox"]'),label=toggle?.closest('label');
     if(label&&!label.classList.contains('g18-switch')){label.className='g18-switch';[...label.childNodes].filter(n=>n!==toggle).forEach(n=>n.remove());label.insertAdjacentHTML('beforeend','<span class="g18-switch-track"></span><span>启用</span>');toggle.setAttribute('role','switch');}
     if(indicator){indicator.innerHTML=chevron;indicator.setAttribute('aria-expanded',String(!card.classList.contains('g16-collapsed')));}
     card.querySelectorAll('.g15-reward-config').forEach(config=>{
       const select=config.querySelector('select[data-g15-field="couponId"]'),choice=config.querySelector('.g9-coupon-choice');
       if(select&&choice){select.closest('label').classList.add('g18-coupon-storage');choice.dataset.g15Panel='coupon';choice.hidden=config.closest('[data-g15-reward-row]').querySelector('[data-g15-field="rewardType"]').value!=='coupon';const change=choice.querySelector('button');if(change)change.textContent=select.value?'更换优惠券':'选择优惠券';}
     });
   });
   scope.querySelectorAll('table.data-table').forEach(table=>{
     table.classList.add('g18-table');const header=table.tHead?.rows[0];
     if(header&&/操作|查看/.test(header.lastElementChild?.textContent||'')){table.classList.add('g18-has-actions');header.lastElementChild.classList.add('g18-action-cell');[...table.tBodies[0]?.rows||[]].forEach(row=>{if(row.cells.length===header.cells.length)row.lastElementChild.classList.add('g18-action-cell');});}

   });
   // Existing select-all checkboxes remain backed by their original selection state.
   scope.querySelectorAll('[data-picker-all]').forEach(input=>{if(!input.closest('label')){const label=document.createElement('label');label.className='g18-select-all';input.before(label);label.append(input,' 全选');}});
   if(C.state.page==='invite-rewards'){
     const tabs=document.querySelector('.r3-admin-page>.tabs.g7-tabs'),toolbar=document.querySelector('#workspace .g6-table-tools');
     if(tabs&&toolbar){tabs.classList.add('g18-record-tabs');tabs.querySelectorAll('button').forEach(b=>{b.textContent=b.dataset.tab==='summary'?'汇总':'明细';});toolbar.append(tabs);}
   }
   if(C.state.page==='foods'){
     const toolbar=document.querySelector('#workspace .g8-table-actions-left');if(toolbar&&!toolbar.querySelector('[data-action="g18-categories"]'))toolbar.insertAdjacentHTML('beforeend',button('食物分类','g18-categories'));
   }
   if(document.querySelector('#r3-food-units'))syncPortions();
 }
 const oldRender=renderApp;renderApp=function(){const r=oldRender.apply(this,arguments);enhance(document);return r;};
 const oldModal=openModal;openModal=function(){const r=oldModal.apply(this,arguments);enhance(document);return r;};
 const oldDecorate=window.G7.decorate;window.G7.decorate=function(){const r=oldDecorate.apply(this,arguments);enhance(arguments[0]||document);return r;};



 C.ar3Action('g15-remove-reward',async node=>{const card=node.closest('[data-g15-stage],[data-g15-growth-stage]'),rows=card?[...card.querySelectorAll('[data-g15-reward-row]')]:[];if(rows.length<=1)throw Error('至少保留一个奖励档位');if(!await G6.confirm('删除奖励档位',['保存后使用剩余奖励配置，已发放记录不变。']))return;node.closest('[data-g15-reward-row]').remove();g6Dirty=true;card.closest('form')?.dispatchEvent(new Event('input',{bubbles:true}));window.R17.syncPage(document);enhance(document);});
 for(const action of ['g15-add-stage','g15-add-growth-stage','g15-remove-stage','g15-remove-growth-stage','g15-add-reward','g15-add-growth-reward']){
   const original=v15Actions[action];if(!original)continue;
   C.ar3Action(action,async node=>{const form=node.closest('form'),before=form?.querySelectorAll('[data-g15-stage],[data-g15-growth-stage],[data-g15-reward-row]').length;if(node)node.disabled=false;const result=await original(node);const after=form?.querySelectorAll('[data-g15-stage],[data-g15-growth-stage],[data-g15-reward-row]').length;if(form&&before!==after){g6Dirty=true;form.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>{window.R16.initAccordions(form);window.R17.syncPage(form);enhance(form);},45);}return result;});
 }
 // Newly added modal forms get the same abandon-draft protection as page editors.
 let modalDirty=false,allowClose=false;
 document.addEventListener('input',event=>{if(event.target.closest('#g18-menu-form,#g18-category-form'))modalDirty=true;});
 document.addEventListener('change',event=>{if(event.target.closest('#g18-menu-form,#g18-category-form'))modalDirty=true;});
 window.addEventListener('g6-business-saved',()=>{modalDirty=false;});
 const closeBase=closeModal;closeModal=function(){if(modalDirty&&!allowClose&&document.querySelector('#g18-menu-form,#g18-category-form')){G6.confirm('放弃未保存的修改',['当前输入尚未保存，放弃后关闭窗口。']).then(ok=>{if(ok){modalDirty=false;g6Dirty=false;closeBase();}});return;}return closeBase();};
 document.addEventListener('click',async event=>{const close=event.target.closest('[data-action]');if(!close||close.dataset.action!=='close-modal'||!close.closest('#modal-root')||close.classList.contains('modal-backdrop')&&event.target!==close||!modalDirty||allowClose||!document.querySelector('#g18-menu-form,#g18-category-form'))return;event.preventDefault();event.stopImmediatePropagation();if(await G6.confirm('放弃未保存的修改',['当前输入尚未保存，放弃后关闭窗口。'])){modalDirty=false;g6Dirty=false;allowClose=true;try{closeModal();}finally{allowClose=false;}}},true);
 document.addEventListener('change',event=>{if(!event.target.matches('[data-g18-custom-upload]'))return;const input=event.target,file=input.files?.[0],row=input.closest('[data-g15-reward-row]');if(!file||!row)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){toast('图片未添加','请选择不超过2MB的PNG、JPG或WebP图片','error');input.value='';return;}const reader=new FileReader();input.disabled=true;reader.onload=()=>{row.querySelector('[data-g15-field="image"]').value=String(reader.result);const preview=row.querySelector('.g18-custom-preview');preview.src=String(reader.result);preview.hidden=false;input.disabled=false;g6Dirty=true;};reader.onerror=()=>{input.disabled=false;toast('读取失败','请选择图片重试','error');};reader.readAsDataURL(file);});

 // Clear, independently managed single-level categories.
 C.ar3Action('g18-categories',()=>navigate('food-categories'));
 C.pageMeta['food-categories']=['增长运营','食物分类'];
 C.V15_PAGES['food-categories']=()=>C.ar3Head('食物分类','分类用于新建、编辑与导入食物；停用保留历史归属。',button('返回食物库','g18-food-back')+button('新增分类','g18-category-new','','primary'))+C.card('分类列表',C.atable(['分类名称','食物数量','状态','操作'],(S().foodCategories||[]).map(c=>[e(c.name),S().foods.filter(f=>f.categoryId===c.id).length,C.badge(c.status),button('编辑','g18-category-edit','data-id="'+c.id+'"')+button(c.status==='启用'?'停用':'启用','g18-category-toggle','data-id="'+c.id+'"')])) )+'</section>';
 C.ar3Action('g18-food-back',()=>navigate('foods'));
 function categoryEditor(id){const c=S().foodCategories.find(c=>c.id===id)||{};openModal({title:c.id?'编辑食物分类':'新增食物分类',body:'<form id="g18-category-form" class="r3-form-grid">'+C.af('分类名称','categoryName',c.name)+C.af('状态','categoryStatus',c.status||'启用','select',['启用','停用'])+'</form><p class="form-hint">名称不能重复。重命名同步更新食物分类名称；停用不影响历史记录。</p>',footer:button('取消','close-modal')+button('保存分类','g18-category-save','data-id="'+e(c.id||'')+'" data-revision="'+(c.revision||0)+'"','primary')});}
 C.ar3Action('g18-category-new',()=>categoryEditor());C.ar3Action('g18-category-edit',n=>categoryEditor(n.dataset.id));
 C.ar3Action('g18-category-save',async n=>{try{await R3.cmd('ADMIN_CATEGORY',{id:n.dataset.id||undefined,expectedRevision:+n.dataset.revision,name:C.av('categoryName'),status:C.av('categoryStatus')});g6Dirty=false;closeModal();renderApp();toast('分类已保存');}catch(error){err(error);}});
 C.ar3Action('g18-category-toggle',async n=>{const c=S().foodCategories.find(c=>c.id===n.dataset.id);try{await R3.cmd('ADMIN_CATEGORY',{...c,expectedRevision:c.revision,status:c.status==='启用'?'停用':'启用'});renderApp();}catch(error){err(error);}});

 // The first two inputs remain unit name and grams for the existing food reader.
 unitRow=function(u=['份','']){return '<div class="r3-unit-row g6-unit-row g18-unit-row"><span>1</span><input aria-label="份量单位" list="g6-unit-options" placeholder="选择或输入单位" value="'+e(u[0])+'"><span>＝</span><input aria-label="每单位克重" type="number" step="0.01" min="0.01" placeholder="实际克重" value="'+e(u[1])+'"><span>克</span><label class="g18-unit-default"><input type="radio" name="portionDefault" aria-label="设为默认份量"> 默认份量</label>'+button('删除','g18-remove-unit')+'</div>';};
 const baseForm=ar3Form;ar3Form=function(entity){const box=document.createElement('div');box.innerHTML=baseForm(entity);if(entity!=='food')return box.innerHTML;
   const cat=box.querySelector('[name="cat"]'),current=C.editing?.categoryId;cat.innerHTML='<option value="">请选择分类</option>'+(S().foodCategories||[]).filter(c=>c.status==='启用'||c.id===current).map(c=>'<option value="'+e(c.name)+'" '+(c.id===current||!current&&c.name==='主食'?'selected':'')+'>'+e(c.name)+(c.status==='停用'?'（已停用，仅保留当前归属）':'')+'</option>').join('');
   const section=box.querySelector('#r3-food-units').closest('section'),r=C.editing||{},du=r.defaultUnit||r.units?.[0]?.[0]||'克',dq=r.defaultQuantity||(r.units?.length?1:100);
   section.innerHTML='<h3>份量设置</h3><p class="form-hint">营养以每100克记录。配置常用份量后，录入时可直接选择“碗、份、杯”等单位。</p><div class="g18-gram-base"><div><b>基础单位：克</b><small>始终可用，无需配置</small></div><label><input type="radio" name="portionDefault" value="克" '+(du==='克'?'checked':'')+'> 设为默认份量</label></div><div class="g18-unit-title"><b>常用份量</b><div>'+button('添加单位','r3-add-unit')+button('从模板添加','r3-template-units')+'</div></div><datalist id="g6-unit-options">'+['份','碗','盒','杯','个','片','块','勺'].map(u=>'<option value="'+u+'">').join('')+'</datalist><div id="r3-food-units">'+(r.units||[]).filter(u=>u[0]!=='克').map(unitRow).join('')+'</div><p class="form-hint g18-unit-empty">暂无常用份量时，直接按克录入。杯等单位也需要称重，不按毫升换算。</p><div class="g18-default-quantity"><label>默认数量<input name="defaultQuantity" aria-label="默认数量" type="number" min="0.01" step="0.01" value="'+dq+'"></label><div><span>默认录入预览</span><strong id="g6-conversion"></strong></div></div><select name="defaultUnit" hidden>'+['克',...(r.units||[]).map(u=>u[0]).filter(u=>u!=='克')].map(u=>'<option '+(du===u?'selected':'')+'>'+e(u)+'</option>').join('')+'</select>';
   [...section.querySelectorAll('.g18-unit-row')].forEach(row=>{const radio=row.querySelector('[name="portionDefault"]');if(row.querySelector('input').value===du)radio.setAttribute('checked','');else radio.removeAttribute('checked');});return box.innerHTML;
 };
 const baseRead=readEditor;readEditor=function(publish){const p=baseRead(publish);if(p.entity==='food'){const c=S().foodCategories.find(c=>c.name===p.record.cat);if(!c)throw Error('请选择食物分类');p.record.categoryId=c.id;}return p;};
 function syncPortions(){const root=document.querySelector('#r3-food-units');if(!root)return;const select=document.querySelector('[name="defaultUnit"]'),quantity=document.querySelector('[name="defaultQuantity"]');if(!select||!quantity)return;
   const rows=[...root.querySelectorAll('.r3-unit-row')];rows.forEach(row=>{if(!row.querySelector('[name="portionDefault"]')){row.insertAdjacentHTML('beforeend','<label class="g18-unit-default"><input type="radio" name="portionDefault"> 默认份量</label>');row.querySelector('[data-action="r3-remove-row"]')?.setAttribute('data-action','g18-remove-unit');row.classList.add('g18-unit-row');}});
   const chosen=document.querySelector('[name="portionDefault"]:checked'),selected=chosen?.closest('.r3-unit-row'),name=selected?.querySelector('input')?.value.trim()||'克';
   if(!chosen)document.querySelector('.g18-gram-base input').checked=true;
   const options=['克',...new Set(rows.map(row=>row.querySelector('input').value.trim()).filter(Boolean))];select.innerHTML=options.map(u=>'<option>'+e(u)+'</option>').join('');select.value=name;
   const grams=name==='克'?1:Number(selected.querySelectorAll('input')[1].value),q=Number(quantity.value),hint=document.querySelector('#g6-conversion');hint.textContent=q>0&&grams>0?q+' '+name+' ＝ '+Math.round(q*grams*100)/100+' 克':'请填写正数克重和数量';
   const empty=document.querySelector('.g18-unit-empty');if(empty)empty.hidden=rows.length>0;
 }
 document.addEventListener('input',event=>{if(event.target.closest('#r3-food-units')||event.target.name==='defaultQuantity')syncPortions();},true);
 document.addEventListener('change',event=>{if(event.target.name==='portionDefault')syncPortions();},true);
 C.ar3Action('g18-remove-unit',async n=>{const row=n.closest('.r3-unit-row');if(row.querySelector('[name="portionDefault"]')?.checked)throw Error('请先将其他单位设为默认份量，再删除此单位');if(await G6.confirm('删除份量单位',['删除后保存食物才会生效，历史饮食记录保持原快照。'])){row.remove();g6Dirty=true;syncPortions();}});
 const applyUnits=v15Actions['g6-apply-units'];C.ar3Action('g6-apply-units',async n=>{const selected=[...document.querySelectorAll('[name="g6-template"]:checked')];if(!selected.length)throw Error('请勾选单位');if(!await G6.confirm('添加所选份量模板',selected.map(x=>'1 '+S().units[+x.value][0]+' ＝ '+S().units[+x.value][1]+' 克').concat('同名单位保留当前值，不覆盖。')))return;if(n)n.disabled=false;await applyUnits(n);syncPortions();});

 // Each menu owns dated meal/dish snapshots; the image remains an independent reference.
 const menuBase=renderMenuWeek;
 function planFor(brand,week){return S().menuPlans?.find(p=>p.brand===brand&&p.weekId===week.id)||{id:'MP-'+week.id+'-'+(data.brands.find(b=>b.name===brand)?.id||brand),brand,brandId:S().brands.find(b=>b.name===brand)?.id||null,weekId:week.id,start:week.startDate,end:week.endDate,dishes:[]};}
 function nutritionTable(plan){const rows=[];for(let day=0;day<7;day++){const date=new Date(plan.start+'T12:00:00+08:00');date.setUTCDate(date.getUTCDate()+day);const key=date.toISOString().slice(0,10);for(const meal of ['午餐','晚餐']){const dishes=plan.dishes.filter(d=>d.date===key&&d.meal===meal);for(const dish of dishes.length?dishes:[null]){const attrs='data-plan="'+e(plan.id)+'" data-brand="'+e(plan.brand)+'" data-week="'+plan.weekId+'" data-date="'+key+'" data-meal="'+meal+'"'+(dish?' data-id="'+dish.id+'"':'');rows.push('<tr><td>'+key.slice(5)+'<small>'+['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]+'</small></td><td>'+meal+'</td><td>'+(dish?'<b>'+e(dish.name)+'</b>':'<span class="cell-sub">暂无菜品</span>')+'</td><td>'+(dish?dish.grams+' g':'—')+'</td>'+['kcal','carb','protein','fat'].map(k=>'<td>'+(dish?.done&&dish.nutrition?.[k]!=null?dish.nutrition[k]:'—')+'</td>').join('')+'<td>'+C.badge(dish?(dish.done?'已补录':'待补录'):'待配置')+'</td><td>'+button(dish?'查看 / 补录':'添加菜品','g18-menu-edit',attrs)+'</td></tr>');}}}
 return '<div class="g18-menu-section"><div class="g18-menu-caption"><div><b>每日菜品与营养</b><small>每份摄入量 · 热量 kcal，其余 g'+(plan.demo?' · 以下为结构化示例，非图片识别结果':'')+'</small></div>'+button('添加菜品','g18-menu-edit','data-plan="'+e(plan.id)+'" data-brand="'+e(plan.brand)+'" data-week="'+plan.weekId+'"')+'</div><div class="table-wrap"><table class="data-table g18-menu-table" data-g7="yes"><thead><tr>'+['日期','餐次','菜品','份量','热量','碳水','蛋白质','脂肪','状态','操作'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div></div>';
 }
 renderMenuWeek=function(){const box=document.createElement('div');box.innerHTML=menuBase();box.querySelectorAll('section.r3-card').forEach(section=>{if(section.querySelector('h3')?.textContent.includes('V1.5 菜品营养值补录'))section.remove();});
   box.querySelectorAll('.menu-card,.menu-grid-card').forEach(card=>{const trigger=card.querySelector('[data-brand]'),brand=trigger?.dataset.brand,weekId=trigger?.dataset.week,week=data.menuWeeks.find(w=>w.id===weekId);if(!brand||!week)return;card.classList.add('g18-menu-card');card.insertAdjacentHTML('beforeend',nutritionTable(planFor(brand,week)));});
   const caption=box.querySelector('.menu-week-head .cell-sub');if(caption)caption.textContent='保留菜单图片，并按日期、餐次维护每道菜的实际份量和营养值';
   const unassigned=S().menu.filter(m=>!m.assignedDishId);box.insertAdjacentHTML('beforeend','<section class="r3-card"><h3>待关联的历史菜品</h3><p class="form-hint">'+unassigned.length+' 道旧菜品尚未确定菜单日期与餐次。添加菜品时可选择历史记录，再明确归属；不会自动猜测。</p></section>');return box.innerHTML;
 };
 let editingMenu=null;
 C.ar3Action('g18-menu-edit',n=>{const week=data.menuWeeks.find(w=>w.id===n.dataset.week),plan=planFor(n.dataset.brand,week),dish=plan.dishes.find(d=>d.id===n.dataset.id);editingMenu={plan,dish};const b=dish?.base||{};
   openModal({title:(dish?'菜品营养 · ':'添加菜单菜品 · ')+plan.brand,wide:true,body:'<form id="g18-menu-form"><p class="form-hint">'+plan.start+' 至 '+plan.end+' · 每道菜单独保存营养快照，修改不影响其他菜单或食物库。</p><div class="r3-form-grid">'+C.af('日期','dishDate',dish?.date||n.dataset.date||plan.start,'date')+C.af('餐次','dishMeal',dish?.meal||n.dataset.meal||'午餐','select',['午餐','晚餐'])+'<label class="r3-field"><span>录入方式</span><select name="dishSource"><option value="manual">手动填写</option><option value="food">从食物库选择</option><option value="legacy">关联历史菜品</option></select></label><label class="r3-field" data-g18-food-picker hidden><span>选择食物</span><select name="dishFood"><option value="">请选择食物</option>'+S().foods.filter(f=>f.status==='启用').map(f=>'<option value="'+f.id+'">'+e(f.name)+'</option>').join('')+'</select></label><label class="r3-field" data-g18-legacy-picker hidden><span>历史菜品</span><select name="dishLegacy"><option value="">请选择历史菜品</option>'+S().menu.filter(m=>!m.assignedDishId&&m.brand===plan.brand).map(m=>'<option value="'+m.id+'">'+e(m.name)+'</option>').join('')+'</select></label>'+C.af('菜品名称','dishName',dish?.name)+C.af('实际每份克重（g）','dishGrams',dish?.grams||'','number')+'</div><h3>每100克基础营养值</h3><p class="form-hint">前四项必填；待补录菜品不预填未知数值。</p><div class="r3-form-grid">'+[['kcal','热量 kcal'],['carb','碳水 g'],['protein','蛋白质 g'],['fat','脂肪 g'],['fiber','膳食纤维 g（选填）']].map(([k,l])=>C.af(l,'dish-'+k,b[k],'number')).join('')+'</div><div class="g18-portion-preview" id="g18-dish-preview">填写克重与营养值后，显示每份摄入量。</div></form>',footer:button('取消','close-modal')+button('保存菜品营养','g18-menu-save','','primary')});
   const f=document.querySelector('#g18-menu-form');f.querySelector('[name="dishDate"]').min=plan.start;f.querySelector('[name="dishDate"]').max=plan.end;f.addEventListener('input',menuPreview);f.addEventListener('change',ev=>{const mode=C.av('dishSource');f.querySelector('[data-g18-food-picker]').hidden=mode!=='food';f.querySelector('[data-g18-legacy-picker]').hidden=mode!=='legacy';if(['dishFood','dishLegacy'].includes(ev.target.name)){const item=mode==='food'?S().foods.find(x=>x.id===C.av('dishFood')):S().menu.find(x=>x.id===C.av('dishLegacy'));if(item){f.querySelector('[name="dishName"]').value=item.name;for(const k of ['kcal','carb','protein','fat','fiber'])f.querySelector('[name="dish-'+k+'"]').value=mode==='legacy'&&!item.done?'':item[k]??'';f.querySelector('[name="dishGrams"]').value=item.grams||item.units?.[0]?.[1]||'';}}menuPreview();});menuPreview();
 });
 function menuPreview(){const box=document.querySelector('#g18-dish-preview');if(!box)return;const grams=Number(C.av('dishGrams'));box.textContent=grams>0?('每份 '+grams+' g：'+[['kcal','热量','kcal'],['carb','碳水','g'],['protein','蛋白质','g'],['fat','脂肪','g']].map(([k,l,u])=>l+' '+(C.av('dish-'+k)===''?'待补录':Math.round(Number(C.av('dish-'+k))*grams)/100+u)).join(' · ')):'请填写实际每份克重';}
 C.ar3Action('g18-menu-save',async()=>{const {plan,dish}=editingMenu,mode=C.av('dishSource');try{if(mode==='food'&&!C.av('dishFood'))throw Error('请选择食物');if(mode==='legacy'&&!C.av('dishLegacy'))throw Error('请选择历史菜品');const p={planId:plan.id,brand:plan.brand,brandId:plan.brandId,weekId:plan.weekId,start:plan.start,end:plan.end,id:dish?.id,expectedRevision:dish?.revision,date:C.av('dishDate'),meal:C.av('dishMeal'),name:C.av('dishName'),grams:C.av('dishGrams'),foodId:mode==='food'?C.av('dishFood'):null,legacyId:mode==='legacy'?C.av('dishLegacy'):null};for(const k of ['kcal','carb','protein','fat','fiber'])p[k]=C.av('dish-'+k);await R3.cmd('ADMIN_MENU_DISH',p);g6Dirty=false;closeModal();renderApp();toast('菜品营养已保存');}catch(error){err(error);}});
 const describe=G6.describe;G6.describe=function(type,p,d){if(type==='ADMIN_CATEGORY')return {title:'确认保存食物分类',lines:['分类：'+p.name,'状态：'+p.status,p.status==='停用'?'停用后不可用于新建或重新分类，原有食物归属保留。':'重命名同步更新所属食物，历史营养快照不变。']};if(type==='ADMIN_MENU_DISH')return {title:'确认保存菜单菜品',lines:[p.brand+' · '+p.date+' · '+p.meal,'菜品：'+p.name+'；实际份量：'+p.grams+'克','每100克热量 '+p.kcal+'kcal；每份 '+Math.round(p.kcal*p.grams)/100+'kcal','仅保存当前菜单菜品，不修改食物库及历史记录。']};return describe(type,p,d);};
 window.R18={enhance,syncPortions,menuPreview,menuBase,planFor,nutritionTable};
})();
