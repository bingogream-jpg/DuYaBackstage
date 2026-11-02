(()=>{
 const C=window.__g8Core;if(!C)return;const S=()=>R3.state,M=window.R36Measure,e=C.ae;
 const button=(label,action,attrs='',primary=false)=>'<button type="button" class="button '+(primary?'primary':'secondary')+' small" data-action="'+action+'" '+attrs+'>'+label+'</button>';
 const ui=()=>C.state.units36||(C.state.units36={query:'',type:'',category:'',page:1});
 const getFood=id=>S().foods.find(f=>f.id===id);
 function fields(source={}){
  const f=M.normalize({units:[],...source}),base=M.baseName(f);
  return '<div class="r36-unit-editor" data-original-kind="'+(source.measureType||M.kind(source))+'"><div class="r36-unit-config"><label>食物形态<select data-r28-flat="native" data-u36-kind><option value="solid" '+(f.measureType==='solid'?'selected':'')+'>固体</option><option value="liquid" '+(f.measureType==='liquid'?'selected':'')+'>液体</option></select></label><p data-u36-basis>营养按每100'+base+'填写；形态变更不重算历史记录。</p></div><div class="r36-unit-base"><b>固定基础单位：<span data-u36-base>'+base+'</span></b><span>1基础单位＝1'+base+'，不可删除</span></div><div class="r36-unit-tools">'+button('添加单位','u36-add')+button('添加通用单位模板','u36-template')+'</div><div data-u36-rows>'+f.units.filter(u=>u[0]!==base).map(row).join('')+'</div><div class="r36-unit-default"><label>默认单位<select data-r28-flat="native" data-u36-default>'+f.units.map(u=>'<option '+(u[0]===f.defaultUnit?'selected':'')+'>'+e(u[0])+'</option>').join('')+'</select></label><label>默认数量<input data-u36-quantity type="number" min="0.0001" step="any" value="'+f.defaultQuantity+'"></label></div><p data-u36-preview></p></div>';
 }
 function row(u=['','']){return '<div class="r36-unit-row"><span>1</span><input data-u36-name aria-label="单位名称" value="'+e(u[0])+'" placeholder="个、份、杯…"><span>＝</span><input data-u36-value aria-label="每单位基准量" type="number" min="0.0001" step="any" value="'+e(u[1])+'"><span data-u36-label></span>'+button('删除','u36-remove')+'</div>';}
 function sync(scope=document){
  const box=scope.querySelector('.r36-unit-editor');if(!box)return;
  const liquid=box.querySelector('[data-u36-kind]').value==='liquid',base=liquid?'毫升':'克',select=box.querySelector('[data-u36-default]'),chosen=select.value;
  box.querySelector('[data-u36-base]').textContent=base;box.querySelector('[data-u36-basis]').textContent='营养按每100'+base+'填写；形态变更不重算历史记录。';
  box.querySelector('.r36-unit-base>span').textContent='1基础单位＝1'+base+'，不可删除';box.querySelectorAll('[data-u36-label]').forEach(n=>n.textContent=base);
  const names=[base,...[...box.querySelectorAll('[data-u36-name]')].map(n=>n.value.trim()).filter(Boolean)];select.innerHTML='<option value="">请选择默认单位</option>'+names.map(n=>'<option>'+e(n)+'</option>').join('');select.value=names.includes(chosen)?chosen:'';
  const factor=select.value===base?1:Number([...box.querySelectorAll('.r36-unit-row')].find(n=>n.querySelector('[data-u36-name]').value.trim()===select.value)?.querySelector('[data-u36-value]').value),quantity=Number(box.querySelector('[data-u36-quantity]').value);
  box.querySelector('[data-u36-preview]').textContent=quantity>0&&factor>0?'默认录入：'+quantity+select.value+'＝'+Number((factor*quantity).toFixed(4))+base:'请填写有效的单位和默认数量';
  box.querySelector('[data-action="u36-template"]').disabled=liquid;
  const form=document.querySelector('#r3-editor');if(form)for(const [key,label]of [['kcal','热量'],['carb','碳水'],['protein','蛋白质'],['fat','脂肪'],['fiber','膳食纤维']]){const input=form.querySelector('[name="'+key+'"]'),parent=input?.closest('label');if(parent)for(const n of parent.childNodes)if(n.nodeType===3&&n.textContent.trim()){n.textContent=label+'（每100'+base+'）';break;}}
 }
 function read(){if(!document.querySelector('[data-u36-default]').value)throw Error('请重新选择默认单位');const box=document.querySelector('.r36-unit-editor'),measureType=box.querySelector('[data-u36-kind]').value,base=measureType==='liquid'?'毫升':'克';const units=[[base,1],...[...box.querySelectorAll('.r36-unit-row')].map(n=>[n.querySelector('[data-u36-name]').value.trim(),Number(n.querySelector('[data-u36-value]').value)])];return M.normalize({measureType,units,defaultUnit:box.querySelector('[data-u36-default]').value,defaultQuantity:Number(box.querySelector('[data-u36-quantity]').value)},true);}
 const formBase=ar3Form;ar3Form=function(entity){const box=document.createElement('div');box.innerHTML=formBase(entity);if(entity==='food'){const section=box.querySelector('#r3-food-units')?.closest('section');if(section){section.remove();}}return box.innerHTML;};
 const reader=readEditor;readEditor=function(publish){const p=reader(publish);if(p.entity==='food'&&document.querySelector('.r36-unit-editor')){const f=read();Object.assign(p.record,{measureType:f.measureType,nutritionBasis:f.nutritionBasis,units:f.units,defaultUnit:f.defaultUnit,defaultQuantity:f.defaultQuantity});}return p;};
 async function confirmKind(){const box=document.querySelector('.r36-unit-editor');if(!box||box.dataset.originalKind===box.querySelector('[data-u36-kind]').value)return true;return G6.confirm('确认变更食物计量口径',['变更后按每100'+(box.querySelector('[data-u36-kind]').value==='liquid'?'毫升':'克')+'解释营养值，请确认已核对营养数据；历史记录不变。']);}
 const saveFood=v15Actions['r3-save'];C.ar3Action('r3-save',async node=>{if(document.querySelector('#r3-editor')?.dataset.entity==='food'&&!await confirmKind())return;if(node)node.disabled=false;return saveFood(node);});
 C.pageMeta['food-units']=['增长运营','单位管理'];C.pageMeta['food-unit-editor']=['增长运营','食物单位设置'];
 const foodsPage=C.V15_PAGES.foods;C.V15_PAGES.foods=function(){return foodsPage.apply(this,arguments);};
 const filtered=()=>S().foods.filter(f=>(!ui().query||f.name.includes(ui().query))&&(!ui().type||f.measureType===ui().type)&&(!ui().category||f.cat===ui().category));
 C.V15_PAGES['food-units']=()=>foodsPage();
 C.V15_PAGES['food-unit-editor']=()=>foodsPage();
 C.ar3Action('u36-open',()=>C.navigate('food-units'));C.ar3Action('u36-back',()=>C.navigate('foods'));C.ar3Action('u36-list',()=>C.navigate('food-units'));
 C.ar3Action('u36-find',()=>{for(const key of ['query','type','category'])ui()[key]=document.querySelector('[data-u36-filter="'+key+'"]').value.trim();ui().page=1;C.renderApp();});
 C.ar3Action('u36-reset',()=>{Object.assign(ui(),{query:'',type:'',category:'',page:1});C.renderApp();});
 C.ar3Action('u36-page',node=>{ui().page=Math.max(1,ui().page+Number(node.dataset.step));C.renderApp();});
 C.ar3Action('u36-edit',node=>{ui().editing=node.dataset.id;C.navigate('food-unit-editor');});
 C.ar3Action('u36-add',()=>{document.querySelector('[data-u36-rows]').insertAdjacentHTML('beforeend',row());g6Dirty=true;sync();});
 C.ar3Action('u36-remove',async node=>{const row=node.closest('.r36-unit-row');if(row.querySelector('[data-u36-name]').value.trim()===document.querySelector('[data-u36-default]').value)throw Error('请先选择其他默认单位');row.remove();g6Dirty=true;sync();});
 C.ar3Action('u36-template',()=>{const names=[...document.querySelectorAll('[data-u36-name]')].map(n=>n.value.trim());for(const u of S().units||[])if(!names.includes(u[0])&&u[0]!=='克')document.querySelector('[data-u36-rows]').insertAdjacentHTML('beforeend',row(u));g6Dirty=true;sync();});
 C.ar3Action('u36-save',async()=>{const f=getFood(ui().editing),n=read();if(!await confirmKind())return;await R3.cmd('ADMIN_SAVE',{entity:'food',record:{...f,measureType:n.measureType,nutritionBasis:n.nutritionBasis,units:n.units,defaultUnit:n.defaultUnit,defaultQuantity:n.defaultQuantity,expectedRevision:f.revision||1}});g6Dirty=false;C.navigate('food-units');});
 async function exportRows(rows){if(!rows.length)throw Error('没有可导出的食物');if(!await G6.confirm('导出食物单位',['将导出当前筛选的 '+rows.length+' 条食物。']))return;const data=rows.map(f=>({'食物名称':f.name,'分类':f.cat,'食物形态':f.measureType==='liquid'?'液体':'固体','营养基准':f.nutritionBasis,'每100基准量热量':f.kcal,'碳水':f.carb,'蛋白质':f.protein,'脂肪':f.fat,'膳食纤维':f.fiber,'份量单位':f.defaultUnit,'每单位基准量':f.units.find(u=>u[0]===f.defaultUnit)?.[1],'单位配置':f.units.map(u=>u[0]+':'+u[1]).join('；'),'单位换算':f.units.map(u=>'1'+u[0]+'='+u[1]+M.baseName(f)).join('；'),'默认单位':f.defaultUnit,'默认数量':f.defaultQuantity})),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),'食物单位');XLSX.writeFile(wb,'渡鸦管家-r36-食物单位.xlsx');}
 C.ar3Action('u36-export',()=>exportRows(filtered()));
 for(const type of ['input','change'])document.addEventListener(type,event=>{if(event.target.closest('.r36-unit-editor')){g6Dirty=true;sync();}});
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.closest('.r36-units-filters')){event.preventDefault();document.querySelector('[data-action="u36-find"]').click();}});
 const render=C.renderApp;C.renderApp=function(){const result=render.apply(this,arguments);sync();return result;};
 const modal=C.openModal;C.openModal=function(options){const result=modal.apply(this,arguments);sync();return result;};
 window.R36UnitAdmin={fields,read,sync,filtered};
})();
