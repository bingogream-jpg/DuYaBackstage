// R22: readable person columns, including dynamically paged coupon detail tables.
(()=>{
 const labels=new Set(['领取人','领取用户','用户','用户 / ID','用户 / 手机号','用户 / 电话','用户名称','用户名称 / ID','用户名','邀请人','邀请人 / ID','被邀请人','被邀请人 / ID','受邀人']);
 function people(scope=document){for(const table of scope.querySelectorAll('table.data-table')){const heads=[...table.querySelectorAll('thead tr:first-child th')];heads.forEach((head,i)=>{if(!labels.has(head.textContent.trim()))return;head.classList.add('g22-person');for(const row of table.tBodies[0]?.rows||[])row.cells[i]?.classList.add('g22-person');});}}
 const render=renderApp;renderApp=function(){const result=render.apply(this,arguments);people();return result;};
 const modal=openModal;openModal=function(){const result=modal.apply(this,arguments);people(document.querySelector('#modal-root'));return result;};
 const drawer=openDrawer;openDrawer=function(){const result=drawer.apply(this,arguments);people(document.querySelector('#drawer-root'));return result;};
 const decorate=G7.decorate;G7.decorate=function(){const result=decorate.apply(this,arguments);people(arguments[0]||document);return result;};
 window.R22={people};
})();
