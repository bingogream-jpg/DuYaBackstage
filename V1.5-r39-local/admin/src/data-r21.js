// Shared read-only projections. Records come from completed events, never audience cross products.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,day=t=>t?E.dateKey(Date.parse(t)):'',unique=xs=>new Set(xs).size;
 const inRange=(x,d)=>x.validityMode==='always'||(!x.start||x.start<=d)&&(!x.end||x.end>=d);
 const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 function validateRange(x){x.validityMode=x.validityMode==='always'?'always':'range';if(x.validityMode==='always'){x.start='';x.end='';}else if(!validDate(x.start)||!validDate(x.end)||x.start>x.end)throw Error('请选择有效的开始日期和结束日期');return x;}
 const reward=(u,key)=>(u.rewards||[]).find(r=>r.id===key);
 function captureGrowthEvidence(store,a,s,u,at,legacy=false){const condition=s?.condition||{},since=Math.max(Date.parse(a.activatedAt||a.start+'T00:00:00+08:00')||0,s?.activeMode==='range'?Date.parse(s.start+'T00:00:00+08:00'):0),end=Math.min(Date.parse(at),s?.activeMode==='range'?Date.parse(s.end+'T23:59:59+08:00'):Infinity),within=t=>Date.parse(t)>=since&&Date.parse(t)<=end;let entries=[];
  if(['order_count','order_amount'].includes(condition.type))entries=(u.orders||[]).filter(o=>o.paidAt&&within(o.paidAt)&&(legacy||o.status!=='已退款')).map(o=>({label:'订单 '+o.id,at:o.paidAt,value:'¥'+Number(o.price||0).toFixed(2),status:o.status}));
  else if(condition.type==='login_days'){const dates=new Set();entries=(u.loginEvents||[]).filter(event=>{if(!within(event.at)||dates.has(event.date))return false;dates.add(event.date);return true;}).map(event=>({label:'登录 '+event.date,at:event.at,value:'1 天',status:'已记录'}));}
  else if(condition.type==='profile_complete'&&within(u.onboardedAt))entries=[{label:'完成初始设置',at:u.onboardedAt,value:u.name,status:'已完成'}];
  return {condition:s?.conditionLabel||store.conditionLabel(condition),capturedAt:at,legacy,entries};
 }
 function evidenceText(snapshot){return '条件：'+snapshot.condition+'\n'+(snapshot.legacy?'历史达成记录：以下为当前仍可核对的行为，历史快照缺失时不补造明细。\n':'达成时保存的行为快照：\n')+(snapshot.entries.length?snapshot.entries.map(row=>[row.label,row.at,row.value,row.status].join(' · ')).join('\n'):'暂无可核对的历史行为明细');}
 function activities(d){return [...(d.checkinActivities||[]).map(a=>({...a,activityType:'checkin',typeName:'打卡活动'})),...(d.growthActivities||[]).map(a=>({...a,activityType:'growth',typeName:'用户成长活动'}))];}
 function completed(store){const d=store.data,rows=[],displayStatus=event=>event?(window.R36Rewards?.label(event,d,Date.parse(d.now))||event.status):'未获奖';
  for(const a of activities(d))for(const u of d.users){
   if(a.activityType==='checkin'){
    const snapshot=window.R20Data.activitySnapshot(store,a,u),p=u.checkinProgress?.[a.id]||{};
    if(!snapshot.qualified&&!p.qualifiedAt)continue;
    const r=reward(u,p.rewardEventKey);rows.push({id:'checkin:'+a.id+':'+u.id,activity:a,user:u,stageId:'',stage:'累计打卡 ≥ '+a.targetDays+' 天',completedAt:p.qualifiedAt||snapshot.qualifiedAt,reward:r||null,rewardName:r?.name||p.rewardName||'未获奖',rewardStatus:r?displayStatus(r):p.rewardStatus||'未获奖',reason:p.reason||(!r?'尚未发奖':''),evidence:snapshot.entries.map(e=>e.date).join('、'),awarded:!!r});
   }else{
    for(const p of u.growthProgress?.[a.id]?.stages||[]){if(p.status!=='已达成'||!p.metAt)continue;const s=(a.stages||[]).find(s=>s.id===p.stageId),r=reward(u,p.rewardEventKey),snapshot=p.evidence||captureGrowthEvidence(store,a,s,u,p.metAt,true);rows.push({id:'growth:'+a.id+':'+p.stageId+':'+u.id,activity:a,user:u,stageId:p.stageId,stage:s?.name||p.name||p.stageId,completedAt:p.metAt,reward:r||null,rewardName:r?.name||'未获奖',rewardStatus:r?displayStatus(r):'未获奖',reason:!r?'该阶段没有实际奖励事件':'',evidence:evidenceText(snapshot),evidenceSnapshot:snapshot,awarded:!!r});}
   }
  }return rows.sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt)||a.id.localeCompare(b.id));
 }
 function hasBehavior(a,u){const since=Date.parse(a.activatedAt||a.start+'T00:00:00+08:00'),until=Date.parse(a.end+'T23:59:59+08:00');const within=t=>Number.isFinite(Date.parse(t))&&Date.parse(t)>=since&&(!Number.isFinite(until)||Date.parse(t)<=until);
  return (a.stages||[]).filter(s=>s.enabled!==false).some(s=>{const c=s.condition||{},active=t=>within(t)&&(s.activeMode!=='range'||day(t)>=s.start&&day(t)<=s.end);if(c.type==='profile_complete')return active(u.onboardedAt);if(c.type==='login_days')return (u.loginEvents||[]).some(e=>active(e.at));if(['order_count','order_amount'].includes(c.type))return (u.orders||[]).some(o=>o.status!=='已退款'&&active(o.paidAt));return false;});
 }
 function growthCounts(store,a){const users=store.data.users.filter(u=>store.growthAudienceMet(a,u)),stages=(a.stages||[]).filter(s=>s.enabled!==false);let done=0,ongoing=0;for(const u of users){const p=u.growthProgress?.[a.id]?.stages||[];if(stages.length&&stages.every(s=>p.some(p=>p.stageId===s.id&&p.status==='已达成')))done++;else if(p.some(p=>p.status==='已达成')||hasBehavior(a,u))ongoing++;}return {done,ongoing,total:users.length};}
 function summaries(store){const rows=completed(store);return activities(store.data).map(activity=>{const items=rows.filter(r=>r.activity.id===activity.id&&r.activity.activityType===activity.activityType);return {activity,awarded:unique(items.filter(r=>r.awarded).map(r=>r.user.id)),rows:items,latest:items[0]?.completedAt||''};});}
 function users(store){const rows=completed(store);return store.data.users.map(user=>{const items=rows.filter(r=>r.user.id===user.id);return {user,completed:items.length,activities:unique(items.map(r=>r.activity.activityType+':'+r.activity.id)),awarded:items.filter(r=>r.awarded).length,latest:items[0]?.completedAt||''};}).filter(x=>x.completed);}
 function confirmMenuVersion(previous,token,id){const confirmed=previous?.token===token?[...previous.confirmed]:[];if(!confirmed.includes(id))confirmed.push(id);return {token,confirmed};}
 function menuVersionDone(version,token,ids){return !!ids.length&&version?.token===token&&ids.every(id=>version.confirmed.includes(id));}
 window.R21Data={inRange,validateRange,activities,completed,growthCounts,summaries,users,confirmMenuVersion,menuVersionDone,captureGrowthEvidence};
 const run=E.Store.prototype.run;
 E.Store.prototype.run=function(type,user,p){if(type!=='ADMIN_MENU_IMAGE')return run.call(this,type,user,p);if(user!=='admin')throw Error('仅管理员可操作');if(!this.data.brands.some(b=>b.name===p.brand)||!/^W\d+$/.test(p.weekId||''))throw Error('菜单品牌或周次无效');if(!p.remove&&!/^data:image\/[^;]+;base64,/.test(p.image||''))throw Error('请选择有效的本地菜单图片');const list=this.data.menuImageOverrides=this.data.menuImageOverrides||{},key=p.brand+'|'+p.weekId,old=list[key];if(p.expectedRevision!=null&&p.expectedRevision!==(old?.revision||0))throw Error('图片已被其他窗口修改，请重新打开');const next={id:old?.id||'MI21-'+key,brand:p.brand,weekId:p.weekId,image:p.remove?null:p.image,revision:(old?.revision||0)+1,uploadedAt:new Date(this.now()).toISOString()};list[key]=next;return next;};
})();
