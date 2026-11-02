// Coupon and invitation-poster presentation only. Preserve existing actions and data.
(()=>{
  function crop(name,x,y,w,h,totalHeight){return '<span class="r33m-art r33m-art-'+name+'" aria-hidden="true" style="aspect-ratio:'+w+'/'+h+'"><img draggable="false" alt="" src="'+esc(window.__offlineAsset('assets-r33-mini/'+name+'.png'))+'" style="left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%;width:'+(2016/w*100)+'%;height:'+(totalHeight/h*100)+'%"></span>';}
  SCREENS.coupons={...SCREENS.coupons,navStyle:{bg:'#f4f8e5',ink:'#1a2910'},render(){
    const all=V15().coupons||[],tabs=['可用','已使用','已过期'],tab=V15().couponTab||'可用';
    const list=all.filter(c=>c.status===tab).sort((a,b)=>String(a.expire).localeCompare(String(b.expire)));
    return '<div class="v15-page r33m-coupons"><header class="r33m-coupon-hero"><small>MY COUPONS</small><h1>我的优惠券</h1><p>美味相伴 · 优惠常在</p>'+crop('coupons',970,240,970,730,3584)+'<span class="r33m-available"><b>'+all.filter(c=>c.status==='可用').length+'</b><small>张可用</small></span></header><div class="r33m-coupon-tabs">'+tabs.map(t=>'<button class="'+(t===tab?'on':'')+'" data-act="v15-coupon-tab" data-tab="'+t+'">'+t+' <b>'+all.filter(c=>c.status===t).length+'</b></button>').join('')+'</div><div class="r33m-coupon-list">'+(list.length?list.map(c=>'<article class="r33m-ticket '+(c.status!=='可用'?'muted':'')+'" data-act="v15-coupon-detail" data-id="'+esc(c.id)+'"><div class="r33m-ticket-value"><small>¥</small><b style="font-size:'+Math.min(33,94/String(v15Num(c.amount)).length)+'px">'+v15Num(c.amount)+'</b><span>'+(c.threshold?'满 '+v15Num(c.threshold)+' 元可用':'无门槛')+'</span></div><div class="r33m-ticket-info"><header><h2>'+esc(c.name)+'</h2><em>'+esc(c.status)+'</em></header><p>'+esc(c.brands||'全部品牌')+'</p><footer><span><i>◷</i> 有效期至 '+esc(c.expire||'—')+'</span><button data-act="v25-coupon-use" data-id="'+esc(c.id)+'" '+(c.status==='可用'?'':'disabled')+'>'+(c.status==='可用'?'去使用 ›':'不可用')+'</button></footer></div></article>').join(''):'<div class="r33m-empty"><b>暂无'+esc(tab)+'优惠券</b><p>参与活动后，奖励会出现在这里。</p></div>')+'</div></div>';
  }};
  SCREENS.invitePoster={...SCREENS.invitePoster,navStyle:{bg:'#f8faed',ink:'#172710'},render(){
    const q=window.R23Invite.query(r3.state,r3Me().id),code=q.user.inviteCode||'';
    if(!code)return '<div class="v15-page r3-empty"><h2>请先生成邀请码</h2>'+v15Btn('返回邀请码','local-invite-go','data-route="invite"')+'</div>';
    let qr='';try{qr=window.G13QR.canvas(code,8).toDataURL('image/png');}catch{}
    const background=window.R31Mini?.invitePoster()||'';
    const artwork=background?'<div class="r33m-uploaded-art"><img src="'+esc(window.__offlineAsset(background))+'" alt="后台配置的邀请海报"></div>':crop('poster',79,308,1860,2245,3583);
    return '<div class="v15-page r33m-poster-page"><article class="r33m-poster">'+artwork+'<div class="r33m-poster-footer"><div class="r33m-poster-code"><small>我的邀请码</small><b>'+esc(code)+'</b><span>'+esc(q.time)+'</span></div><div class="r33m-qr">'+(qr?'<img src="'+qr+'" alt="邀请码二维码">':'<span>二维码暂不可用</span>')+'<small>扫码获取邀请码</small></div></div></article><div class="r33c-poster-actions"><button class="r33m-save-poster r33c-save" data-act="v15-save-poster">保存海报截图</button><button type="button" class="r33m-save-poster r33c-share" aria-disabled="true">分享给好友</button></div></div>';
  }};
})();
