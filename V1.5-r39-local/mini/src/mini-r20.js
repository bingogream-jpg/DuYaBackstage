  // V1.5-r20 mini-program activity feed and home promotion.
  const r20Today=()=>r3Date();
  const r20ActivityStatus=activity=>window.R20Data?.activityStatus(activity,r20Today())||(activity.status==='启用'?'进行中':'已停用');
  const r20Progress=(activity,user)=>{
    if(!user)return {count:0,target:Number(activity.targetDays)||1,entries:[],qualified:false};
    return window.R20Data.activitySnapshot(window.__DUYA_LOCAL__.store,activity,user);
  };
  const r20RewardText=activity=>(activity.rewards||[]).map(reward=>{
    if(reward.type==='coupon')return r3.state.templates.find(template=>template.id===reward.couponId)?.name||'优惠券';
    if(reward.type==='meal')return '赠餐 '+Number(reward.count||1)+' 餐';
    return reward.name||'自定义奖励';
  }).join('、')||'参与奖励';
  const r20WonReward=(activity,user)=>{
    const eventId=user?.checkinProgress?.[activity.id]?.rewardEventKey;
    return eventId?user.rewards.find(event=>event.id===eventId):null;
  };
  function r20HomePromotion(){
    const user=r3Me(),activities=r3.state.checkinActivities||[];
    const featured=activities.find(activity=>activity.id===r3.state.featuredCheckinActivityId&&activity.status==='启用');
    if(!featured)return '<button type="button" class="r20-more-activities" data-act="r20-more-activities">更多活动 &gt;&gt;</button>';
    const progress=r20Progress(featured,user),status=r20ActivityStatus(featured),won=r20WonReward(featured,user);
    return '<div class="r20-home-activity"><div class="r20-home-activity-head"><div><h4>'+esc(featured.name)+'</h4><p>'+esc(featured.desc)+'</p></div><span class="r20-home-activity-status">'+esc(status)+'</span></div><div class="r20-progress"><div class="r20-progress-head"><span>累计 '+progress.count+' 天</span><span>达标 '+progress.target+' 天</span></div><div class="r20-progress-bar"><i style="width:'+Math.min(100,progress.count/progress.target*100)+'%"></i></div></div>'+(won?'<div class="r20-winner">已获得 '+esc(won.name)+' · '+esc(won.status)+'</div>':'')+'<button type="button" class="r20-more-activities" data-act="r20-more-activities">更多活动 &gt;&gt;</button></div>';
  }
  const r20HomeBase=SCREENS.home.render;
  SCREENS.home.render=function(){
    const box=document.createElement('div');
    box.innerHTML=r20HomeBase();
    const checkin=box.querySelector('.r4-checkin');
    if(checkin)checkin.insertAdjacentHTML('beforeend',r20HomePromotion());
    return box.innerHTML;
  };
  screen('checkinActivities',{
    title:'打卡活动',
    logo:true,
    noTab:true,
    navStyle:{bg:'#eef4e8',ink:'#1f2b24'},
    render(){
      const user=r3Me(),activities=(r3.state.checkinActivities||[]).filter(activity=>activity.status==='启用');
      return '<div class="r20-activity-page"><section class="r20-activity-hero"><small>HEALTH CHECK-IN</small><h2>坚持打卡，收获成长</h2><p>活动按累计打卡天数独立判断。多个活动可以同时参与，奖励达标后自动发放。</p></section><div class="r20-activity-list">'+(activities.length?activities.map(activity=>{
        const progress=r20Progress(activity,user),status=r20ActivityStatus(activity),won=r20WonReward(activity,user);
        return '<article class="r20-activity-card"><header><div><h3>'+esc(activity.name)+'</h3><p>'+esc(activity.desc)+'</p></div><span class="r20-status '+(status==='已过期'?'expired':status==='未开始'?'upcoming':'')+'">'+esc(status)+'</span></header><div class="r20-progress"><div class="r20-progress-head"><span>累计 '+progress.count+' 天</span><span>达标 '+progress.target+' 天</span></div><div class="r20-progress-bar"><i style="width:'+Math.min(100,progress.count/progress.target*100)+'%"></i></div></div><div class="r20-activity-meta"><span>'+esc(activity.start+' 至 '+activity.end)+'</span><span>'+esc(r20RewardText(activity))+'</span></div>'+(won?'<div class="r20-winner"><b>已获奖：</b>'+esc(won.name)+' · '+esc(won.status)+'</div>':'')+'</article>';
      }).join(''):'<div class="r20-empty">暂无打卡活动</div>')+'</div></div>';
    }
  });
  r3Act('r20-more-activities',()=>go('checkinActivities'));
