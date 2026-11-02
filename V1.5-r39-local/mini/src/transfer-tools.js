(()=>{
function install(){const api=window.__DUYA_LOCAL__,admin=api.role==='admin';const box=document.createElement('section');box.className='local-transfer';box.innerHTML='<b>本地数据</b><p>后台与小程序共用 r39 数据；导出和导入用于备份与恢复。</p><div><button type="button" id="local-export">导出数据</button><button type="button" id="local-import">导入数据</button></div><button type="button" id="local-restore">恢复导入前数据</button><input type="file" id="local-import-file" accept="application/json,.json" hidden><span id="local-status" role="status"></span>';
const toolbar=document.querySelector('.r3-demo-tools');if(toolbar&&!admin){toolbar.append(box);toolbar.querySelector('a')?.remove();}else document.body.append(box);
const status=box.querySelector('#local-status'),restore=box.querySelector('#local-restore');restore.hidden=!localStorage.getItem(api.backupKey);function message(text){status.textContent=text;}
box.querySelector('#local-export').onclick=async()=>{if(!await G6.confirm('导出本地数据',['将导出本文件全部演示数据，包括用户、订单、奖励和配置。','导入会替换 r39 后台与小程序共享数据；旧版本数据不变。']))return;const p=api.packet(),url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='渡鸦管家-'+(admin?'后台':'小程序')+'-本地数据-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},60000);message('已导出 r39 数据备份。');};
const input=box.querySelector('#local-import-file');box.querySelector('#local-import').onclick=()=>input.click();input.onchange=async()=>{const f=input.files[0];if(!f)return;try{const packet=JSON.parse(await f.text()),d=api.validatePacket(packet);if(!await G6.confirm('导入并替换本地数据',['包含 '+d.users.length+' 位用户、'+d.foods.length+' 个食物。','将替换 r39 双端共享数据并刷新，未保存编辑请先保存。','可通过恢复导入前数据撤销最近一次导入。']))return;api.importPacket(packet);location.reload();}catch(e){message('未导入：'+e.message);}finally{input.value='';}};
restore.onclick=async()=>{const raw=localStorage.getItem(api.backupKey);if(!raw)return;if(!await G6.confirm('恢复导入前数据',['恢复到最近一次导入之前的快照，并刷新当前文件。']))return;try{localStorage.setItem(api.key,raw);localStorage.removeItem(api.backupKey);location.reload();}catch(e){message('恢复失败，原数据保留。');}};
window.addEventListener('local-error',e=>message(e.detail));
}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();

