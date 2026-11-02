// One-time invitation benefits and dated water records. No settlement on reads.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,copy=x=>JSON.parse(JSON.stringify(x)),ok=(x,m)=>{if(!x)throw Error(m);};
 function normalizeRules(input){const r=copy(input||{});r.target=['none','old','new','both'].includes(r.target)?r.target:'none';for(const side of ['inviter','invitee']){r[side]=r[side]||{mode:'fixed',rewards:[]};r[side].mode=r[side].mode==='probability'?'probability':'fixed';r[side].rewards=r[side].rewards||[];}return r;}
 function validate(store,r,merchant){r=normalizeRules(r);ok(!merchant||['none','new'].includes(r.target),'商户码仅支持被邀请人奖励');for(const [side,target]of [['inviter','old'],['invitee','new']])if(r.target===target||r.target==='both')store.validRewards(r[side].rewards,r[side].mode);return r;}
 function migrate(d){if(d.r37FollowupMigration)return false;for(const u of d.users||[])u.waterRecords=u.waterRecords||[];d.r37FollowupMigration={version:1};return true;}
 function total(u,date){return (u.waterRecords||[]).filter(r=>r.date===date).reduce((n,r)=>n+Number(r.ml||0),0);}
 const bind=P.bind;P.bind=function(u,code){const existed=!!u.binding,m=this.data.merchants.find(x=>x.code===String(code||'').trim().toUpperCase());this.__binding37=existed?null:normalizeRules(m?.bindingRewards||(!m?this.data.settings.bindingRewards:null));try{return bind.call(this,u,code);}finally{delete this.__binding37;}};
 const settle=P.settleInvite;P.settleInvite=function(rel){if(this.__binding37&&!rel.bindingRewards37)rel.bindingRewards37=copy(this.__binding37);const result=settle.call(this,rel);const r=rel.bindingRewards37;if(!r||!['已达成','有效'].includes(rel.status))return result;
  rel.bindingRewardKeys37=rel.bindingRewardKeys37||{};
  for(const [side,target,id]of [['inviter','old',rel.inviterId],['invitee','new',rel.userId]]){if(!id||!(r.target===target||r.target==='both')||rel.bindingRewardKeys37[side])continue;const cfg=r[side];if(!cfg?.rewards?.length)continue;const key='binding37-'+rel.id+'-'+side,event=this.award(this.user(id),cfg.rewards,cfg.mode,key,'有效邀请奖励 · '+(side==='inviter'?'邀请人':'被邀请人'));if(event){event.inviteRelationId=rel.id;event.bindingRewardSide=side;event.path='用户邀请';event.bindingReward37=true;rel.bindingRewardKeys37[side]=event.id;rel.rewardKeys=rel.rewardKeys||[];if(!rel.rewardKeys.includes(event.id))rel.rewardKeys.push(event.id);}}
  return result;
 };
 const run=P.run;P.run=function(type,user,p={}){
  if(type.startsWith('WATER_')){ok(user!=='admin','请使用用户账户记录饮水');const u=this.user(user);u.waterRecords=u.waterRecords||[];const old=u.waterRecords.find(r=>r.id===p.id);if(type==='WATER_DELETE'){ok(old,'饮水记录不存在');u.waterRecords=u.waterRecords.filter(r=>r!==old);return {id:old.id};}ok(['WATER_ADD','WATER_UPDATE'].includes(type),'不支持的饮水操作');if(type==='WATER_UPDATE')ok(old,'饮水记录不存在');const date=String(p.date||''),time=String(p.time||''),ml=Number(p.ml);ok(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00+08:00'))&&E.dateKey(Date.parse(date+'T12:00:00+08:00'))===date&&date<=E.dateKey(this.now()),'请选择有效日期，不能晚于今天');ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(time),'请选择有效饮水时间');ok(Number.isFinite(ml)&&ml>0&&ml<=100000,'饮水量须为0至100000毫升之间的正数');const row=old||{id:'WATER'+this.now()+Math.random().toString(36).slice(2,8)};Object.assign(row,{date,time,ml,recordedAt:old?.recordedAt||new Date(this.now()).toISOString()});if(!old)u.waterRecords.push(row);return row;}
  let rules;if(type==='ADMIN_SAVE'&&['merchant','settings'].includes(p.entity)&&p.record?.bindingRewards){rules=validate(this,p.record.bindingRewards,p.entity==='merchant');p={...p,record:{...p.record,bindingRewards:rules}};}
  const result=run.call(this,type,user,p);if(rules){const target=p.entity==='settings'?this.data.settings:this.data.merchants.find(m=>m.id===result?.id||m.id===p.record.id);if(target)target.bindingRewards=copy(rules);}return result;
 };
 window.R37Followup={migrate,total,normalizeRules,validate};
})();
