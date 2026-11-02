// V1.5-r31 mini-program poster configuration and post-payment service image.
(()=>{
  const appRules=()=>r3.state?.settings?.appRules||{};
  const imageValue=key=>{
    const value=appRules()[key];
    if(typeof value==='string')return value||'';
    return value?.dataUrl||'';
  };
  function currentInvitePoster(){
    const q=window.R23Invite.query(r3.state,r3Me().id),owner=q.user,code=owner.inviteCode||'';
    if(!code)return '<div class="v15-page r3-empty"><h2>请先生成邀请码</h2>'+v15Btn('返回邀请码','local-invite-go','data-route="invite"')+'</div>';
    let qr='';
    try{qr=window.G13QR.canvas(code,8).toDataURL('image/png');}catch{}
    const background=imageValue('invitePoster');
    const style=background?' style="--r31-poster-bg:url(&quot;'+esc(background)+'&quot;)"':'';
    return '<div class="v15-page r27-poster-page r31-poster-page"><article class="r27-poster r31-invite-poster '+(background?'has-background':'')+'"'+style+'><span class="r31-poster-shade"></span><span class="r27-poster-brand">渡鸦管家</span><h1>把好好吃饭<br>分享给朋友</h1><p>一起记录每一餐的健康节奏</p><div class="r27-poster-code"><small>我的邀请码</small><b>'+esc(code)+'</b></div>'+(qr?'<img class="r27-poster-qr" src="'+qr+'" alt="邀请码二维码">':'')+'<div class="r27-poster-footer"><span>'+esc(q.time)+'</span><em>'+esc(q.stages.map(stage=>stage.name).join('、')||'邀请人奖励')+'</em></div></article><button class="r27-save-poster" data-act="v15-save-poster">保存海报截图</button></div>';
  }
  SCREENS.invitePoster.render=currentInvitePoster;

  function showPostPaymentService(){
    const image=imageValue('postPaymentServiceImage');
    if(!image||document.querySelector('#r31-service-popup'))return;
    const box=document.createElement('div');
    box.id='r31-service-popup';
    box.className='r31-service-popup';
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.setAttribute('aria-label','付款后客服');
    box.innerHTML='<div class="r31-service-panel"><button type="button" class="r31-service-close" aria-label="关闭">×</button><img src="'+esc(image)+'" alt="付款后客服提示"><button type="button" class="r31-service-done">我知道了</button></div>';
    document.body.append(box);
    const close=()=>box.remove();
    box.querySelector('.r31-service-close').onclick=close;
    box.querySelector('.r31-service-done').onclick=close;
    box.addEventListener('click',event=>{if(event.target===box)close();});
  }
  const cmdBase=window.R3.cmd;
  window.R3.cmd=async function(type,payload={},id){
    const result=await cmdBase.call(this,type,payload,id);
    if(type==='PAY')setTimeout(showPostPaymentService,180);
    return result;
  };

  // WeChat share payloads can consume this value without adding a network dependency.
  window.R31Mini={
    sharePoster:()=>imageValue('sharePoster'),
    invitePoster:()=>imageValue('invitePoster'),
    postPaymentService:()=>imageValue('postPaymentServiceImage'),
    showPostPaymentService
  };
})();
