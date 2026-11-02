(()=>{
const role=window.__DUYA_LOCAL_ROLE__,admin=role==='admin',key='duya-local-r39-data',backupKey=key+'-before-import';
const cleanupSummary={removedKeys:0,releasedBytes:0,removed:[],available:true};
let memoryOnly=false,lastStorageError='',bootError=null,bootstrapRaw=null,bootstrapData=null,bootstrapSource='initial',backupStatus='none';
function isObsoleteKey(name){
  if(String(name).startsWith('duya-local-r26-'))return false;
  return /^duya-local-r(?:[4-9]|1\d|2[0-5])(?:-|$)/.test(name)
    ||/^duya-r4-/.test(name)
    ||/^duya-v15-r4/.test(name)
    ||/^duya-admin-v15-r4/.test(name);
}
function storageBytes(name,value){return (String(name).length+String(value||'').length)*2;}
function cleanupObsoleteCaches(){return cleanupSummary;

  if(typeof localStorage==='undefined')return cleanupSummary;
  try{
    const names=[];
    for(let index=0;index<localStorage.length;index++){
      const name=localStorage.key(index);
      if(name&&name!==key&&!name.startsWith(key+'-')&&isObsoleteKey(name))names.push(name);
    }
    for(const name of names){
      try{
        const value=localStorage.getItem(name);
        localStorage.removeItem(name);
        cleanupSummary.removedKeys++;
        cleanupSummary.releasedBytes+=storageBytes(name,value);
        cleanupSummary.removed.push(name);
      }catch(error){lastStorageError=error?.message||String(error);}
    }
  }catch(error){
    cleanupSummary.available=false;
    lastStorageError=error?.message||String(error);
  }
  return cleanupSummary;
}
function enterMemoryMode(error){
  memoryOnly=true;
  lastStorageError=error?.message||String(error||lastStorageError||'浏览器存储不可用');
  window.__DUYA_MEMORY_ONLY__=true;
}
function showStorageNotice(){
  const message=bootError?'r39 初始化未完成，原缓存和备份均已保留，当前禁止业务操作：'+bootError.message:memoryOnly
    ?'浏览器存储空间仍不足，当前为临时会话；原缓存仍保留，可继续操作，但刷新后本次未保存内容可能丢失。'
    :backupStatus==='backup-skipped'
      ?'迁移前重复备份空间不足，已直接使用 r38/r37/r26 原缓存作为备份；r39 业务数据已正常保存。'
    :cleanupSummary.removedKeys
      ?'已清理 '+cleanupSummary.removedKeys+' 个旧版本缓存，释放约 '+Math.max(1,Math.round(cleanupSummary.releasedBytes/1024))+' KB；当前 r26 数据已保留。'
      :'';
  if(!message)return;
  try{
    if(!bootError&&sessionStorage.getItem('duya-local-r39-storage-notice'))return;
    sessionStorage.setItem('duya-local-r39-storage-notice','1');
  }catch{}
  const mount=()=>{
    if(!document.body||document.querySelector('#r39-storage-notice'))return;
    const style=document.createElement('style');
    style.textContent='#r39-storage-notice{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99999;max-width:min(92vw,560px);padding:10px 15px;border:1px solid '+(memoryOnly?'#e6b77a':'#c8dcc8')+';border-radius:10px;background:'+(memoryOnly?'#fff8eb':'#f2f8f1')+';box-shadow:0 8px 24px #1d32251f;color:'+(memoryOnly?'#81591f':'#365a3e')+';font:12px/1.6 "Microsoft YaHei",Arial,sans-serif;text-align:center}';
    const notice=document.createElement('div');
    notice.id='r39-storage-notice';
    notice.setAttribute('role','status');
    notice.textContent=message;
    document.head.append(style);
    document.body.append(notice);
    if(!memoryOnly&&!bootError)setTimeout(()=>notice.remove(),6500);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else setTimeout(mount,0);
}
cleanupObsoleteCaches();
const storedUser=admin?'admin':localStorage.getItem('duya-local-r39-mini-user')||localStorage.getItem('duya-local-r38-mini-user')||localStorage.getItem('duya-local-r37-mini-user')||localStorage.getItem('duya-local-r26-mini-user');
let user=admin?'admin':(['NEW','INV','REWARD'].includes(storedUser)?storedUser:'NEW');
if(!admin)try{localStorage.setItem('duya-local-r39-mini-user',user);}catch(error){enterMemoryMode(error);}
let state=null,busy=0,listeners=[],lastSavedRaw=null;
function normalize(d){window.R20Data?.migrate(d);window.R25Data?.migrate(d);window.R26Data?.migrate(d);window.R31Data?.migrate(d);window.R36Data?.migrate(d);window.R36Measure?.migrate(d);window.R36Review?.migrate(d);window.R37Activities?.migrate(d);if([window.R37Followup?.migrate(d),window.R37CommentsData?.migrate(d),window.R38Data?.migrate(d)].some(Boolean))window.__R39_MIGRATION_DIRTY__=true;if(!d.r39Migration){d.r39Migration={version:1,at:new Date().toISOString()};window.__R39_MIGRATION_DIRTY__=true;}for(const u of d.users)for(const r of u.rewards)if(r.type==='coupon'&&!r.name)r.name=d.templates.find(t=>t.id===r.config?.couponId)?.name||'优惠券奖励';return d;}
function initialData(){return JSON.parse(JSON.stringify(window.__DUYA_INITIAL__));}
function safeBackup(name,value){try{localStorage.setItem(name,value);return true;}catch(error){lastStorageError=error?.message||String(error);backupStatus='backup-skipped';return false;}}
function backupFollowup(raw){
 const d=window.R37Storage.decode(raw);
 if(!d.r38Migration&&!localStorage.getItem(key+'-before-r38-migration'))safeBackup(key+'-before-r38-migration',raw);
 if(Number(d.r38DietUpgrade?.version||0)<3){
  const repairKey=key+'-before-history-repair-v3';
  if(!localStorage.getItem(repairKey))safeBackup(repairKey,raw);
  window.__R38_REPAIR_BACKUPS__=[];
  for(const suffix of ['-before-diet-upgrade','-before-r38-migration','-before-migration']){
   const saved=localStorage.getItem(key+suffix);if(!saved)continue;
   try{const prior=window.R37Storage.decode(saved);if(window.R38DietUpgrade.reliableBackup(d,prior)){window.__R38_REPAIR_BACKUPS__.push(prior);break;}}catch{}
  }
 }
 return d;
}
function readSaved(){
  try{const raw=localStorage.getItem(key);if(raw){const data=normalize(backupFollowup(raw));if(window.__R39_MIGRATION_DIRTY__){window.__R39_MIGRATION_DIRTY__=false;persist(data);}return data;}
  const previousR38=localStorage.getItem('duya-local-r38-data'),previousR37=localStorage.getItem('duya-local-r37-data'),previousR26=localStorage.getItem('duya-local-r26-data');
  if(previousR38){bootstrapSource='r38';bootstrapRaw=JSON.stringify(window.R37Storage.decode(previousR38));}
  else if(previousR37){bootstrapSource='r37';bootstrapRaw=JSON.stringify(window.R37Storage.decode(previousR37));}
  else if(previousR26){bootstrapSource='r26';bootstrapRaw=previousR26;}
  else bootstrapRaw=JSON.stringify(window.__DUYA_LEGACY_INITIAL__||window.__DUYA_INITIAL__);
  const original=JSON.parse(bootstrapRaw);if(!Array.isArray(original.users)||!original.settings||!Array.isArray(original.growthActivities))throw Error('原版本业务数据不完整');
  bootstrapData=normalize(JSON.parse(bootstrapRaw));return bootstrapData;
 }catch(error){bootError=error;memoryOnly=true;lastStorageError=error.message;return normalize(initialData());}
}

function persist(data){
  if(memoryOnly)return false;
  try{localStorage.setItem(key,window.R37Storage.encode(data));return true;}
  catch(error){
    enterMemoryMode(error);
    const retryAfterBackup=()=>{
      try{localStorage.setItem(key,window.R37Storage.encode(data));memoryOnly=false;window.__DUYA_MEMORY_ONLY__=false;lastStorageError='';return true;}catch(retryError){lastStorageError=retryError?.message||String(retryError);return false;}
    };
    if(retryAfterBackup())return true;
    showStorageNotice();return false;
  }
}
const store=new window.__DUYA_LOCAL_ENGINE.Store({initial:readSaved(),persist});
function announce(){listeners.forEach(fn=>fn(state));}
const atomic=fn=>navigator.locks?.request?navigator.locks.request(key+'-write',fn):Promise.resolve().then(fn);
function refreshSync(){
  let saved=null;
  if(!memoryOnly){
    try{saved=localStorage.getItem(key);}
    catch(error){enterMemoryMode(error);}
  }
  const changed=saved!==lastSavedRaw;
  lastSavedRaw=saved;
  if(saved&&changed){
    try{store.data=normalize(backupFollowup(saved));if(window.__R39_MIGRATION_DIRTY__){window.__R39_MIGRATION_DIRTY__=false;persist(store.data);}}
    catch(error){bootError=error;enterMemoryMode(error);showStorageNotice();}
  }
  
  const previous=state?.revision;
  state=store.snapshot(user);
  if(previous!==state.revision||changed)announce();
  return state;
}
async function refresh(){
  try{return await atomic(refreshSync);}
  catch(error){
    enterMemoryMode(error);
    state=store.snapshot(user);
    announce();
    return state;
  }
}
 window.R3={get user(){return user;},admin,get state(){return state;},get busy(){return busy;},on(fn){listeners.push(fn);if(state)fn(state);},setUser(next){if(!admin&&['NEW','INV','REWARD'].includes(next)){user=next;try{localStorage.setItem('duya-local-r39-mini-user',user);}catch(error){enterMemoryMode(error);showStorageNotice();}state=store.snapshot(user);announce();}return user;},refresh,async cmd(type,payload={},id){if(bootError)throw Error('r39初始化失败，原缓存已保留：'+bootError.message);busy++;try{await refresh();if(bootError)throw Error('r39缓存读取失败，原数据已保留：'+bootError.message);const operation=id||user+'-'+type+'-'+crypto.randomUUID();if(admin&&!window.R3.skipConfirm&&/^(ADMIN_|REFUND)/.test(type)){const preview=new window.__DUYA_LOCAL_ENGINE.Store({initial:store.data});preview.action({id:operation,type,user,payload});const info=window.G6.describe(type,payload,store.data);if(!await window.G6.confirm(info.title,info.lines))throw Object.assign(Error('已取消操作'),{cancelled:true});}return await atomic(()=>{refreshSync();if(bootError)throw Error('r39缓存读取失败：'+bootError.message);const before=JSON.parse(JSON.stringify(store.data));let result;try{result=store.action({id:operation,type,user,payload});}catch(error){store.data=before;throw error;}state=store.snapshot(user);announce();if(admin)window.dispatchEvent(new Event('g6-business-saved'));return result;});}finally{busy--;}}};
 window.R3.ready=atomic(()=>{if(bootError){try{if(bootstrapRaw&&bootstrapSource==='initial'&&!localStorage.getItem(key+'-before-migration'))safeBackup(key+'-before-migration',window.R37Storage.packRaw(bootstrapRaw));}catch{}throw bootError;}const saved=localStorage.getItem(key);if(saved){store.data=normalize(backupFollowup(saved));if(window.__R39_MIGRATION_DIRTY__){window.__R39_MIGRATION_DIRTY__=false;persist(store.data);}return;}if(!bootstrapData)throw Error('未取得初始化数据');if(['r38','r37','r26'].includes(bootstrapSource))backupStatus='source-cache';else safeBackup(key+'-before-migration',window.R37Storage.packRaw(bootstrapRaw));store.data=bootstrapData;persist(bootstrapData);showStorageNotice();}).then(refresh).catch(error=>{bootError=error;enterMemoryMode(error);showStorageNotice();state=store.snapshot(user);announce();return state;});
setInterval(()=>{if(!busy)refresh().catch(err=>window.dispatchEvent(new CustomEvent('local-error',{detail:err.message})));},1500);
function validatePacket(packet){if(packet?.format!=='duya-local-prototype'||packet.schemaVersion!==1||!packet.data)throw Error('文件格式不正确，请选择本地文件版导出的数据。');const d=packet.data;for(const k of ['users','brands','packages','templates','foods','menu','units','merchants','surveys','growthActivities','checkinActivities','runs','answers','issues','inviteRelations','review','barcodeQueue','foodSubmissions','logs'])if(!Array.isArray(d[k]))throw Error('数据文件缺少有效的'+k+'，未导入。');if(!d.settings?.references||!d.operations||!d.rewardEvents||!d.usage||!Number.isInteger(d.revision))throw Error('数据文件不完整，未导入。');for(const id of ['NEW','INV','PAID']){const u=d.users.find(u=>u.id===id);if(!u?.profile||!u.delivery||!Array.isArray(u.delivery.plans)||!Array.isArray(u.delivery.addresses)||!u.delivery.dayChanges||!Array.isArray(u.orders)||!Array.isArray(u.wallet)||!Array.isArray(u.diet)||!u.answers||!Array.isArray(u.rewards))throw Error('用户资料不完整，未导入。');}return normalize(JSON.parse(JSON.stringify(d)));}
function packet(){return {format:'duya-local-prototype',schemaVersion:1,source:role,exportedAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(store.data))};}
function importPacket(p){const next=validatePacket(p);safeBackup(backupKey,window.R37Storage.encode(store.data));if(!persist(next))throw Error(lastStorageError||'保存失败，原缓存及备份保留');store.data=next;return next;}
window.__DUYA_LOCAL__={role,key,backupKey,store,packet,validatePacket,importPacket,storageHealth:()=>({key,role,memoryOnly,bootError:bootError?.message||null,lastStorageError,backupStatus,bootstrapSource,cleanup:{...cleanupSummary,removed:[...cleanupSummary.removed]},currentBytes:(()=>{try{return storageBytes(key,localStorage.getItem(key));}catch{return 0;}})()})};
window.addEventListener('storage',e=>{if(e.key===key&&!busy)refresh().catch(()=>{});});
showStorageNotice();
})();
