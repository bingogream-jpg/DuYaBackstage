(()=>{const E=window.__DUYA_LOCAL_ENGINE,P=E.Store.prototype,run=P.run;
P.run=function(type,user,p={}){if(type!=='ADMIN_REWARD_STATUS')return run.call(this,type,user,p);
 if(user!=='admin')throw Error('仅管理员可操作');const owner=this.data.users.find(u=>(u.rewards||[]).some(r=>r.id===p.id)),event=owner?.rewards.find(r=>r.id===p.id);
 if(!event||event.type!=='custom')throw Error('仅自定义奖励可切换发放状态');if(!['已发放','待领取'].includes(p.status))throw Error('奖励状态无效');
 event.status=p.status;if(p.status==='待领取'){event.issuedAt=null;event.reason='请联系客服领取线下奖励';}else{event.issuedAt=new Date(this.now()).toISOString();event.reason='';}
 if(this.data.rewardEvents[event.id])Object.assign(this.data.rewardEvents[event.id],event);return event;};})();
