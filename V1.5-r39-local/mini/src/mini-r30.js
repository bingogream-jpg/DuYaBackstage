// Explicit first-use generation; preserve revealed codes and all business relations.
(()=>{
  let generating=false;
  const errors=new Map();
  for(const route of ['invite','inviteOwn','inviteRecords']){
    const base=SCREENS[route].render;
    SCREENS[route].render=function(){
      const box=document.createElement('div');box.innerHTML=base();
      const reason=errors.get(r3Me().id),form=box.querySelector('.r29-generate');
      if(reason&&form){const p=document.createElement('p');p.className='r30-generation-error';p.setAttribute('role','alert');p.textContent=reason;form.append(p);}
      if(generating)box.querySelectorAll('[data-act="v15-gen-code"]').forEach(n=>{n.disabled=true;n.setAttribute('aria-busy','true');});
      return box.innerHTML;
    };
  }
  r3Act('v15-gen-code',async()=>{
    if(generating)return;
    const user=r3Me(),q=window.R23Invite.query(r3.state,user.id);
    if(user.inviteCode&&user.inviteCodeRevealedAt){render();return;}
    if(!user.inviteCode&&!q.available)throw Error(q.reason||'当前无法生成邀请码');
    generating=true;errors.delete(user.id);
    try{
      await r3.cmd('INVITE_GENERATE',{});
      generating=false;render();toast('邀请码已生成');
    }catch(error){
      generating=false;errors.set(user.id,error.message||'生成失败，请重试');render();throw error;
    }
  });
})();
