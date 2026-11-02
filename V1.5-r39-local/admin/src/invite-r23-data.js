// Read-only presentation projection. Binding and reward settlement remain in Store.
(()=>{
  const day=value=>new Date(Date.parse(value)+8*3600000).toISOString().slice(0,10);
  function query(data,userId,now=data.now||new Date().toISOString()){
    const user=data.users.find(u=>u.id===userId)||{},settings=data.settings||{},today=day(now);
    const rows=(data.inviteRelations||[]).filter(r=>r.inviterId===userId);
    const effective=rows.filter(r=>['已达成','有效'].includes(r.status)).length;
    const pending=rows.filter(r=>r.status==='待达成').length;
    const occupied=rows.filter(r=>r.status!=='已失效').length;
    const cap=Number(settings.cap)||0,unlimited=cap===0;
    let state='进行中';
    if(!settings.enabled)state='活动关闭';
    else if(settings.validityMode!=='always'&&today<settings.start)state='未开始';
    else if(settings.validityMode!=='always'&&today>settings.end)state='已结束';
    else if(user.inviteStatus==='停用')state='邀请码停用';
    else if(!unlimited&&occupied>=cap)state='名额已满';
    const days=Math.max(1,Number(settings.bindWindowDays)||7),deadline=Date.parse(user.registeredAt)+days*86400000;
    const rewards=(user.rewards||[]).filter(r=>String(r.id).startsWith('invite-')||/邀请|受邀/.test(r.source||''));
    const stages=(user.inviteProgram?user.inviteProgram.stages||[]:settings.userInviteStages||[]).filter(s=>s.enabled!==false&&s.inviter?.enabled!==false&&s.inviter);
    const reason={活动关闭:'邀请活动暂未开启',未开始:'邀请活动尚未开始',已结束:'邀请活动已结束',邀请码停用:'当前邀请码已停用',名额已满:'邀请名额已满，已有记录仍可查看'}[state]||'';
    return {user,settings,rows,effective,pending,occupied,cap,unlimited,remaining:unlimited?null:Math.max(0,cap-occupied),state,reason,available:state==='进行中',rewards,stages,days,deadline,canBind:!user.binding&&Number.isFinite(deadline)&&Date.parse(now)<=deadline,time:settings.validityMode==='always'?'长期':settings.start+' 至 '+settings.end};
  }
  window.R23Invite={query};
})();
