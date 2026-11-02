// Final r38 admin interaction normalizer and idempotent presentation fixes.
(()=>{
 const C=window.__g8Core;
 if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
 const S=()=>window.R3?.state;
 const text=node=>String(node?.textContent||'').replace(/\s+/g,' ').trim();

 function normalizeTabs(root){
  const groups=[...root.querySelectorAll('.tabs,.g7-tabs,.r37-admin-tabs')];
  const seen=new Set();
  for(const group of groups){
   if(!group.isConnected)continue;
   const buttons=[...group.querySelectorAll(':scope>button,.tab-button')];
   const signatures=[];
   const ids=new Set();
   for(const button of buttons){
    const signature=[button.dataset.action||'',button.dataset.group||'',button.dataset.tab||'',button.dataset.view||'',text(button)].join('|');
    if(ids.has(signature)){button.remove();continue;}
    ids.add(signature);signatures.push(signature);
   }
   if(!signatures.length)continue;
   const groupSignature=signatures.join('::');
   if(seen.has(groupSignature)){group.remove();continue;}
   seen.add(groupSignature);
   const active=[...group.querySelectorAll('.active,[aria-selected="true"],[aria-pressed="true"]')];
   active.slice(1).forEach(button=>{button.classList.remove('active');button.setAttribute('aria-selected','false');button.setAttribute('aria-pressed','false');});
   group.setAttribute('role','tablist');
   buttons.filter(button=>button.isConnected).forEach(button=>{
    button.setAttribute('role','tab');
    const on=button.classList.contains('active')||button.getAttribute('aria-selected')==='true'||button.getAttribute('aria-pressed')==='true';
    if(on){button.classList.add('active');button.setAttribute('aria-selected','true');button.setAttribute('aria-pressed','true');}
   });
  }
 }

 function normalizeStack(root){
  const form=root.querySelector('#r3-editor');
  if(!form||form.dataset.entity!=='coupon')return;
  const mode=form.querySelector('[data-r28-stack-mode]');if(!mode)return;
  const labels=[...form.querySelectorAll('.r37f-stack-label,.rev-stack-caption')];
  if(labels.length!==1||labels[0].nextElementSibling!==mode||labels[0].textContent!=='叠加规则'){
   labels.forEach(node=>node.remove());
   const label=document.createElement('span');label.className='r37f-stack-label';label.textContent='叠加规则';mode.before(label);
  }
  form.querySelectorAll('.r28-choice-row').forEach(node=>{
   if(node!==mode&&text(node).replace(/\s/g,'')==='不可叠加可叠加')node.remove();
  });
 }

 function normalizeInviteTable(root){
  if(C.state?.page!=='invites'||C.g6Tabs?.invites!=='user')return;
  const table=root.querySelector('#workspace table');if(!table)return;
  const heads=[...table.tHead?.rows?.[0]?.cells||[]],index=heads.findIndex(cell=>/邀请奖励活动/.test(text(cell)));
  if(index<0)return;
  heads[index].textContent='邀请奖励活动';
  for(const row of table.tBodies?.[0]?.rows||[]){
   const cell=row.cells[index];if(!cell)continue;
   const button=cell.querySelector('[data-action="r28-user-invite-stages"]');if(!button)continue;
   button.className='cell-link r38-invite-activity-count';
   const next=(button.dataset.count||button.textContent.match(/\d+/)?.[0]||'0')+' 个活动';
   if(button.textContent!==next)button.textContent=next;
   if(cell.children.length!==1||cell.firstElementChild!==button)cell.replaceChildren(button);
  }
 }

 function normalizeIssuePicker(root){
  root.querySelectorAll('[data-picker-order]').forEach(select=>{
   const current=select.value;
   const options=[['','全部'],['订购中','订购中'],['过往订购','过往订购'],['0订购','0订购']];
   const next=options.map(([value,label])=>'<option value="'+value+'" '+(value===current?'selected':'')+'>'+label+'</option>').join('');
   if(select.innerHTML!==next)select.innerHTML=next;
  });
 }

 function normalizeLabels(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const node=walker.currentNode;
   if(node.parentElement?.closest('script,style,input,textarea,option'))continue;
   const value=node.nodeValue
    .replaceAll('用户活跃活动','用户活动')
    .replaceAll('用户成长活动','用户活动')
    .replaceAll('普通活跃活动','普通活动')
    .replaceAll('新建活跃活动','新建用户活动')
    .replaceAll('保存活跃活动','保存用户活动')
    .replaceAll('绑定商户邀请码','绑定邀请码');
   if(value!==node.nodeValue)node.nodeValue=value;
  }
 }
 const describe=window.G6.describe.bind(window.G6);
 window.G6.describe=function(type,payload,data){
  const info=describe(type,payload,data);
  if(type==='ADMIN_SAVE'&&payload?.entity==='food')info.lines=info.lines.map(line=>line.startsWith('按每100克保存')?'按每100克保存。':line);
  return info;
 };
function normalizeResidualRules(root){
 if(C.state?.page==='foods')root.querySelectorAll('[data-action="u36-open"]').forEach(node=>node.remove());
 if(C.state?.page==='invite-settings')root.querySelectorAll('[name="bindWindowDays"]').forEach(node=>node.closest('label,.form-field')?.remove());
 const coupon=root.querySelector('#r3-editor[data-entity="coupon"]');
 if(coupon){
  coupon.querySelectorAll('[name="limit"],[name="limitMode"]').forEach(node=>node.closest('label,.r3-field')?.remove());
  coupon.querySelectorAll('[data-condition="coupon-limit"]').forEach(node=>node.remove());
  coupon.querySelectorAll('[data-r28-stack-mode]').forEach(node=>node.closest('label')?.classList.remove('x38-coupon-limit'));
 }
 root.querySelectorAll('#activity37-form [name="audienceMode"]').forEach(select=>{
  select.querySelectorAll('option[value="merchants"],option[value="userCodes"]').forEach(option=>option.remove());
  if(!['all','users'].includes(select.value))select.value='all';
 });
}

function normalizeInviteTime(root){
 const forms=[...root.querySelectorAll('#r3-editor[data-entity="merchant"],#invite-settings-editor')];
 for(const form of forms){
  const start=form.querySelector('[name="start"]'),end=form.querySelector('[name="end"]');
  if(!start||!end)continue;
  const record=form.id==='invite-settings-editor'?S()?.settings:C.editing||{};
  const inferred=record?.validityMode==='always'||record?.validityMode==='range'
   ?record.validityMode
   :record?.start&&record?.end?'range':'always';
  let select=form.querySelector('[name="validityMode"]'),created=false;
  if(!select){
   const label=document.createElement('label');
   label.className='r3-field';
   label.innerHTML='<span>活动时间</span><select name="validityMode"><option value="always">长期有效</option><option value="range">时间段</option></select>';
   start.closest('label')?.before(label);
   select=label.querySelector('select');created=true;
  }
  if(created)select.value=inferred;
  const alwaysOption=select.querySelector('option[value="always"]'),rangeOption=select.querySelector('option[value="range"]');
  if(alwaysOption)alwaysOption.textContent='长期有效';
  if(rangeOption)rangeOption.textContent='时间段';
  const caption=select.closest('label')?.querySelector(':scope>span');
  if(caption)caption.textContent='活动时间';
  const sync=()=>{
   const always=select.value==='always';
   for(const input of [start,end]){
    const field=input.closest('label');
    if(field)field.hidden=always;
    input.disabled=always;
    input.required=!always;
   }
  };
  if(!select.dataset.r38InviteTime){select.dataset.r38InviteTime='yes';select.addEventListener('change',sync);}
  sync();
 }
}
if(window.R36AdminReview&&!window.R36AdminReview.r38ExportNormalized){
 const xlsx=window.R36AdminReview.xlsx;
 window.R36AdminReview.xlsx=function(title,heads,rows){
  if(/用户活动|用户活跃活动/.test(title)){
   const index=heads.indexOf('开展位置');
   if(index>=0){heads=heads.filter((_,i)=>i!==index);rows=rows.map(row=>row.filter((_,i)=>i!==index));}
  }
  return xlsx.call(this,title,heads,rows);
 };
 window.R36AdminReview.r38ExportNormalized=true;
}

 function fixedOptions(root){
  // Keep each native control as the authoritative value/event target. Only fixed
  // enumerations get a presentation group; dynamic users, coupons and brands stay searchable.
  const allow=/^(r37Growth(Tag|Status|Range|Audience)|audienceMode|validityMode|rewardMode|limitMode|conditionChoice|includeBefore|tierType\d*|status|type|validMode|stackMode|enabled|gender)$/i;
  for(const select of root.querySelectorAll('select')){
   if(select.multiple||select.parentElement?.closest('[hidden],.g16-audience-store')||(!select.classList.contains('x38-choice-native')&&select.hidden)||!select.options.length)continue;
   const options=[...select.options];
   const labels=options.map(o=>o.textContent.trim());
   const fixed=allow.test(select.name)||select.matches('[data-g16-audience-activity],[data-g16-audience-order],[data-g16-audience-status],[data-picker-order],[data-bind37="target"],[data-bind37="mode"],[data-bind37="type"]')||labels.every(t=>/^(全部.*|启用|停用|已.*|未.*|待.*|可使用|已撤回|高活跃|中活跃|低活跃|不活跃|订购中|过往订购|0订购|线上|线下|长期|有效期|固定有效期|相对有效期|优惠券|赠餐|自定义奖励|用户邀请|商户邀请|用户活动|打卡活动|后台)$/.test(t));
   if(!fixed||options.length>15)continue;
   // Older flat decorators hid the native select then removed its replacement.
   // A private class and adjacent ownership make this conversion idempotent.
   select.dataset.r28Flat='native';
   select.classList.add('x38-choice-native');
   select.hidden=true;select.style.setProperty('display','none','important');
   let group=select.nextElementSibling;
   if(!group?.classList.contains('x38-options')){group=document.createElement('div');group.className='x38-options';group.setAttribute('role','radiogroup');select.after(group);}
   const isFilter=!!select.closest('.g6-filters,.toolbar,.r31-filter-grid,.r37-filter-grid,.g16-picker-filters,.g8-picker-filters,.r6-filters,.rev-modal-filters');group.classList.toggle('x38-filter-options',isFilter);group.classList.toggle('x38-field-options',!isFilter);
   const signature=options.map(o=>o.value+'|'+o.textContent+'|'+o.disabled).join('::');
   if(group.dataset.signature!==signature){
    group.replaceChildren(...options.map(option=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','radio');b.dataset.value=option.value;b.textContent=option.textContent;b.disabled=option.disabled||select.disabled;b.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));fixedOptions(root);};return b;}));group.dataset.signature=signature;
   }
   for(const b of group.children){const on=b.dataset.value===select.value;b.classList.toggle('on',on);if(b.getAttribute('aria-checked')!==String(on))b.setAttribute('aria-checked',String(on));}
  }
  for(const input of root.querySelectorAll('input:not([placeholder]),textarea:not([placeholder])')){
   if(input.tagName==='INPUT'&&!['text','number','search','tel','url','email',''].includes(input.getAttribute('type')||''))continue;
   const label=input.closest('label'),name=label?.querySelector(':scope>span')?.textContent||label?.childNodes?.[0]?.textContent||input.name||input.getAttribute('aria-label');
   if(name?.trim())input.placeholder='请输入'+name.trim().replace(/\s+/g,' ').slice(0,25);
  }
 }
 function enhance(root=document){
  const scope=root.querySelector?.('#workspace')||root;
  normalizeTabs(scope);
  normalizeStack(scope);
  normalizeInviteTable(scope);
  normalizeIssuePicker(scope);
  normalizeLabels(scope);
  normalizeResidualRules(scope);
  normalizeInviteTime(scope);
  fixedOptions(root);
  window.R38AdminBinding?.syncInviteEnabled(scope);
 }

 const render=C.renderApp;
 C.renderApp=function(){
  const result=render.apply(this,arguments);
  enhance(document);
  return result;
 };
 const modal=C.openModal;
 C.openModal=function(){
  const result=modal.apply(this,arguments);
  enhance(document);
  return result;
 };
 let queued=false;
 new MutationObserver(()=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;enhance(document);});
 }).observe(document.body,{childList:true,subtree:true});
 window.R38Admin={enhance,normalizeTabs,orderStatus:user=>window.R38Data?.orderStatus(user)||'0订购'};
 enhance();
})();
