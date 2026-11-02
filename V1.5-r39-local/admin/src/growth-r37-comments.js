// Final r37 comments overlay for admin-only presentation and safe cleanup.
(()=>{
 const C=window.__g8Core;
 if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
 const S=()=>window.R3?.state;
 const text=node=>String(node?.textContent||'').replace(/\s+/g,'').trim();
 function enhance(root=document){
  root.querySelectorAll('button,a').forEach(node=>{
   if(/撤回日志|查看撤回|审计日志/.test(text(node)))node.remove();
  });
  root.querySelectorAll('.r37-activity-merged').forEach(node=>{
   node.setAttribute('aria-label',text(node));
  });
  root.querySelectorAll('table').forEach(table=>{
   const heads=[...(table.tHead?.rows?.[0]?.cells||[])];
   const tagIndex=heads.findIndex(cell=>text(cell)==='标签');
   const activityIndex=heads.findIndex(cell=>/活动名称/.test(text(cell)));
   if(tagIndex<0||activityIndex<0)return;
   table.dataset.r37MergedActivityTag='yes';
  });
  const form=root.querySelector('#activity37-form');
  if(form&&!form.querySelector('[name="intro"]')){
   const name=form.querySelector('[name="name"]')?.closest('label');
   if(name)name.insertAdjacentHTML('afterend','<label>活动简介<input name="intro" value=""></label>');
  }
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
  enhance(document.querySelector('#modal-root')||document);
  return result;
 };
 document.addEventListener('click',event=>{
  const log=event.target.closest('button,a');
  if(!log||!/撤回日志|查看撤回|审计日志/.test(text(log)))return;
  event.preventDefault();
  event.stopImmediatePropagation();
 },true);
 window.R37CommentsAdmin={enhance};
})();
