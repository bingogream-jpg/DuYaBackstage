// Shared reward facts, pending operator grants and one-condition activity compatibility.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,copy=x=>JSON.parse(JSON.stringify(x)),ok=(x,m)=>{if(!x)throw Error(m);},day=t=>E.dateKey(t),stamp=t=>Date.parse(t),types={coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'};
 function migrate(d){
  d.activityTags=d.activityTags||[];if(d.r36ActivitySplit)return d;
  d.r36ActivitySplit={version:1,map:{},originals:copy(d.growthActivities||[])};const next=[];
  for(const a of d.growthActivities||[]){for(const s of a.stages||[]){const id='A36-'+encodeURIComponent(a.id)+'-'+encodeURIComponent(s.id),x={...copy(a),id,name:a.name+' · '+s.name,location:'online',tagId:'',validityMode:a.start||a.end?'range':'always',legacyActivityId:a.id,legacyStageId:s.id,stages:[copy(s)],status:s.enabled===false?'停用':a.status};
    const starts=[a.start,s.activeMode==='range'?s.start:''].filter(Boolean),ends=[a.end,s.activeMode==='range'?s.end:''].filter(Boolean);x.start=starts.sort().at(-1)||'';x.end=ends.sort()[0]||'';x.rewardMode=s.rewards?.length?s.rewardMode||'fixed':'none';x.stages[0].activeMode='always';x.stages[0].start='';x.stages[0].end='';next.push(x);d.r36ActivitySplit.map[a.id+'|'+s.id]=id;
    for(const u of d.users||[]){const old=u.growthProgress?.[a.id],state=old?.stages?.find(p=>p.stageId===s.id);if(!state)continue;u.growthProgress[id]={...copy(old),activityId:id,stages:[copy(state)],rewardKeys:state.rewardEventKey?[state.rewardEventKey]:[]};}
  }}d.growthActivities=next;return d;
 }
 function facts(event,d,now=Date.now()){
  const owner=d.users?.find(u=>u.id===event.userId),wallet=owner?.wallet?.find(w=>w.id===event.walletId||w.key===event.id),credit=owner?.mealCredits?.find(c=>c.id===event.mealCreditId||c.rewardId===event.id);
  if(event.revokedAt||wallet?.status==='已撤回')return {label:'已撤回',revoked:true,claimed:!!wallet};
  if(event.type==='custom')return {label:event.status==='已发放'?'已发放':'未发放',claimed:event.status==='已发放',expired:false};
  const claimed=!!(wallet||credit||event.claimedAt||event.status==='已领取'||event.status==='已发放'),expiry=wallet?.expire||credit?.expiresAt||event.expiresAt,expired=claimed?!!expiry&&expiry<day(now):Number.isFinite(stamp(event.claimExpiresAt))&&now>=stamp(event.claimExpiresAt);
  const orderUsed=credit?(owner?.orders||[]).reduce((sum,o)=>sum+(o.mealUses||[]).filter(x=>x.creditId===credit.id).reduce((n,x)=>n+Number(x.count||0),0),0):0,usedCount=credit?Math.max(orderUsed,!expired?Number(credit.total)-Number(credit.remaining):0):0;
  const used=event.type==='coupon'?wallet?.status==='已使用':!!credit&&Number(credit.total)>0&&usedCount>=Number(credit.total);
  return {label:used?'已使用':expired?(claimed?'已领取过期':'未领取过期'):claimed?'已领取未使用':'未领取',claimed,expired:!used&&expired,used,usedCount,orderId:wallet?.orderId||'',start:wallet?.start||'',expiry,remaining:credit?.remaining,total:credit?.total,wallet,credit};
 }
 function resolve(r,d){return window.R36Rewards.eventFor(r,d)||r;}
 function status(r,d,now=Date.now()){
  if(!r)return {label:'—',claimStatus:'—',usageStatus:'—'};
  const f=facts(resolve(r,d),d,Number.isFinite(now)?now:Date.now());
  f.claimStatus=f.revoked?'—':['已发放','未发放'].includes(f.label)?f.label:f.claimed?'已领取':'未领取';
  f.usageStatus=f.revoked||['已发放','未发放'].includes(f.claimStatus)?'—':f.used?'已使用':f.expired?'已过期':'未使用';
  return f;
 }
 const dimensions=['已领取','未领取','已发放','未发放','未使用','已使用','已过期'];
 function matches(r,value,d,now){const f=status(r,d,now);return !value||[f.claimStatus,f.usageStatus].includes(value)||(!dimensions.includes(value)&&f.label===value);}
 function stateText(r,d,now){const f=status(r,d,now);return '领取状态：'+f.claimStatus+'；使用状态：'+f.usageStatus;}

 function couponRows(d,id,now=Date.now()){const rows=[];for(const u of d.users||[]){const seen=new Set();for(const event of u.rewards||[]){if(event.type!=='coupon'||event.config?.couponId!==id)continue;const f=facts(event,d,now);if(f.revoked)continue;if(f.wallet)seen.add(f.wallet.id);rows.push({user:u,event,wallet:f.wallet,...f});}for(const w of u.wallet||[]){if(w.templateId!==id||seen.has(w.id)||w.status==='已撤回')continue;const e={id:w.key||'wallet-'+w.id,userId:u.id,type:'coupon',walletId:w.id,claimedAt:w.obtainedAt,source:w.source,time:w.obtainedAt,config:{couponId:id},name:w.name};rows.push({user:u,event:e,wallet:w,...facts(e,d,now)});}}return rows;}
 const oldStatus=window.R36Rewards.statuses;
 window.R36Rewards.statuses=(r,d=window.R3?.state,now=Date.now())=>[status(r,d,now).label];window.R36Rewards.label=(r,d=window.R3?.state,now)=>stateText(r,d,now);
 const issue=P.issue;
 function reserved(owner,id,except){return (owner.rewards||[]).filter(e=>e.id!==except&&e.type==='coupon'&&e.config?.couponId===id&&!e.claimedAt&&!e.walletId&&!e.revokedAt&&!window.R36Rewards.claimExpired(e,this.now())).length;}
 P.issue=function(u,id,key,source){const e=u.rewards?.find(r=>r.id===key),current=this.data.templates.find(t=>t.id===id);if(e?.couponSnapshot){const index=this.data.templates.indexOf(current),snapshot={...copy(e.couponSnapshot),status:'启用',limit:0};this.data.templates[index]=snapshot;try{return issue.call(this,u,id,key,source);}finally{this.data.templates[index]=current;}}if(current?.limit)ok(u.wallet.filter(w=>w.templateId===id&&w.status!=='已撤回').length+reserved.call(this,u,id,key)<Number(current.limit),'已达到该券每人限领数量');return issue.call(this,u,id,key,source);};
 P.executeIssue=function(job){job.results=[];for(const uid of job.users){try{const u=this.user(uid),t=this.data.templates.find(t=>t.id===job.templateId),key='issue-'+job.id+'-'+uid;ok(t&&t.status==='启用','优惠券不存在或已停用');if(t.validMode!=='relative')ok(t.end>=day(this.now()),'优惠券已过期');const duplicate=u.rewards.find(r=>r.id===key);if(duplicate){job.results.push({userId:uid,ok:true,rewardId:key});continue;}ok(!t.limit||u.wallet.filter(w=>w.templateId===t.id&&w.status!=='已撤回').length+reserved.call(this,u,t.id)<t.limit,'已达到该券每人限领数量');const e=this.award(u,[{type:'coupon',couponId:t.id,probability:100}],'fixed',key,'后台下发');e.couponSnapshot=copy(t);e.issueJobId=job.id;e.grantedBy=job.grantedBy;job.results.push({userId:uid,ok:true,rewardId:e.id});}catch(e){job.results.push({userId:uid,ok:false,reason:e.message});}}job.status=job.results.some(x=>!x.ok)?'部分失败':'已完成';job.executedAt=new Date(this.now()).toISOString();};
 const growth=P.settleGrowthActivities;
 P.settleGrowthActivities=function(id){const all=this.data.growthActivities;this.data.growthActivities=all.filter(a=>a.location!=='offline');try{const result=growth.call(this,id);const u=this.user(id);for(const a of this.data.growthActivities){if(!a.legacyActivityId)continue;const p=u.growthProgress?.[a.id]?.stages?.[0],key='growth-'+a.legacyActivityId+'-'+a.legacyStageId+'-'+u.id;if(p&&this.data.rewardEvents[key])p.rewardEventKey=key;}return result;}finally{this.data.growthActivities=all;}};
 const award=P.award;P.award=function(u,rows,mode,key,source){for(const a of this.data.growthActivities||[]){if(!a.legacyActivityId)continue;const expected='growth-'+a.id+'-'+a.stages[0].id+'-'+u.id;if(key===expected){key='growth-'+a.legacyActivityId+'-'+a.legacyStageId+'-'+u.id;break;}}return award.call(this,u,rows,mode,key,source);};
 const save=P.saveGrowthActivityV16;
 P.saveGrowthActivityV16=function(record){const r=copy(record),existing=this.data.growthActivities.find(a=>a.id===r.id);ok(!existing||r.expectedRevision==null||r.expectedRevision===(existing.revision||1),'活动已被其他窗口修改');ok(r.stages?.length===1,'每个活动仅配置一个达标条件');window.R21Data.validateRange(r);r.location=r.location==='offline'?'offline':'online';r.rewardMode=['none','probability'].includes(r.rewardMode)?r.rewardMode:'fixed';if(r.tagId){const tag=this.data.activityTags.find(t=>t.id===r.tagId);ok(tag&&(tag.status==='启用'||existing?.tagId===tag.id),'请选择启用的活动标签');}const s=r.stages[0];s.enabled=true;s.rewardMode=r.rewardMode==='probability'?'probability':'fixed';if(r.rewardMode==='none')s.rewards=[];const rewards=s.rewards;if(!rewards?.length)s.rewards=[{type:'custom',name:'不发放',probability:100}];if(r.location==='offline')s.condition={type:'profile_complete'};const always=r.validityMode==='always';if(always){r.start='2000-01-01';r.end='2099-12-31';}const saved=save.call(this,r);if(always){saved.start='';saved.end='';}if(r.rewardMode==='none')saved.stages[0].rewards=[];return saved;};
 const run=P.run;P.run=function(type,user,p={}){
  if(type==='ADMIN_REVOKE'){ok(user==='admin','仅管理员可操作');const e=this.data.users.flatMap(u=>u.rewards).find(e=>e.id===p.rewardId);ok(e,'仅可撤回未领取的下发奖励，已领取优惠券不可撤回');ok(e.issueJobId,'仅后台下发奖励可撤回');const f=facts(e,this.data,this.now());ok(f.label==='未领取','仅未领取且未失效的下发奖励可撤回');e.revokedAt=new Date(this.now()).toISOString();this.data.logs.push({id:'L-revoke-'+e.id,time:e.revokedAt,type:'撤回下发奖励',text:'用户 '+e.userId+' · 奖励 '+e.name+' · '+e.id,rewardId:e.id,userId:e.userId});return e;}
  if(type==='REWARD_CLAIM'){const e=this.user(user).rewards.find(e=>e.id===p.rewardId);ok(!e?.revokedAt,'奖励已撤回');}
  if(type==='ADMIN_REWARD_STATUS'){ok(user==='admin','仅管理员可操作');const e=this.data.users.flatMap(u=>u.rewards).find(e=>e.id===p.id);ok(e?.type==='custom','仅自定义奖励可修改');if(p.status!=='已发放'){ok(e.issuedAt&&Number.isFinite(stamp(e.issuedAt)),'旧记录缺少可靠发放时间，不能撤销');ok(this.now()-stamp(e.issuedAt)<86400000,'已超过发放后24小时，不能撤销');}else if(e.status==='已发放')return e;}
  if(type==='ADMIN_SAVE_TAG'){ok(user==='admin','仅管理员可操作');const r=copy(p.record||{});r.name=String(r.name||'').trim();ok(r.name,'请输入标签名称');ok(!(this.data.activityTags||[]).some(t=>t.id!==r.id&&t.name===r.name),'标签名称重复');r.status=r.status==='停用'?'停用':'启用';const old=this.data.activityTags.find(t=>t.id===r.id);if(old)Object.assign(old,r);else{r.id='TAG'+this.now()+Math.random().toString(36).slice(2,5);this.data.activityTags.push(r);}return r;}
  if(type==='ADMIN_SAVE'&&p.entity==='coupon'&&Number(p.record.threshold)>0)p={...p,record:{...p.record,stackMax:1}};
  return run.call(this,type,user,p);
 };
 const countGrowth=window.R21Data.growthCounts;window.R21Data.growthCounts=(store,a)=>{const counts=countGrowth(store,a);if(a.location==='offline')counts.ongoing=0;return counts;};
 const activities=window.R21Data.activities;window.R21Data.activities=d=>activities(d).map(a=>({...a,typeName:a.activityType==='growth'?'用户活跃活动':a.typeName}));
 window.R36Review={migrate,status,couponRows,types,matches,stateText,dimensions};
})();
