// V1.5-r9 invitation conditions and login history.
window.__g9Demo=function(data,now){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const dateKey=ts=>new Date(ts).toISOString().slice(0,10);
  const conditions=[
    {type:'profile_complete'},
    {type:'order_count',count:1},
    {type:'order_amount',amount:99},
    {type:'login_days',days:3}
  ];
  data.settings.bindWindowDays=7;
  data.settings.condition=clone(conditions[0]);
  data.settings.conditionLabel='完成初始设置';
  for(const coupon of data.templates)if(coupon.status==='草稿')coupon.status='停用';
  data.merchants.forEach((merchant,index)=>{
    merchant.condition=clone(conditions[(index+1)%conditions.length]);
    merchant.conditionLabel=['完成初始设置','购餐满 1 次','累计实付满 ¥99','累计登录 3 天'][(index+1)%4];
  });
  data.users.forEach((user,index)=>{
    user.loginDates=[];
    const days=index%6===0?0:1+index%18;
    for(let day=0;day<days;day++)user.loginDates.push(dateKey(now-day*86400000));
  });
  const userRewardSnapshot=()=>({
    target:data.settings.target||'both',
    oldReward:clone(data.settings.oldReward||[]),
    oldRewardMode:data.settings.oldRewardMode||data.settings.rewardMode||'fixed',
    newReward:clone(data.settings.newReward||[]),
    newRewardMode:data.settings.newRewardMode||data.settings.rewardMode||'fixed'
  });
  for(const [index,relation]of data.inviteRelations.entries()){
    const merchant=data.merchants.find(item=>item.id===relation.merchantId);
    relation.type=merchant?'merchant':'user';
    relation.condition=clone(merchant?merchant.condition:data.settings.condition);
    relation.conditionLabel=merchant?merchant.conditionLabel:'完成初始设置';
    relation.rewardSnapshot=merchant?{target:'new',reward:clone(merchant.reward||[]),rewardMode:merchant.rewardMode||'fixed'}:userRewardSnapshot();
    if(relation.status==='待复核')relation.status='待达成';
    else if(relation.status==='已判异常')relation.status='已失效';
    else relation.status='已达成';
    relation.metAt=relation.status==='已达成'?relation.boundAt:null;
    relation.source=merchant?'商户邀请码':'用户邀请码';
  }
  const pending=data.inviteRelations.find(relation=>relation.userId==='DEMO-R');
  if(pending){
    for(const key of pending.rewardKeys||[]){
      for(const user of data.users){
        const reward=user.rewards.find(item=>item.id===key);
        if(reward?.walletId)user.wallet=user.wallet.filter(item=>item.id!==reward.walletId);
        user.rewards=user.rewards.filter(item=>item.id!==key);
        delete data.rewardEvents[key];
      }
    }
    pending.rewardKeys=[];
    pending.status='待达成';
    pending.metAt=null;
    pending.condition={type:'order_count',count:2};
    pending.conditionLabel='购餐满 2 次';
  }
  const pendingUser=data.users.find(item=>item.id==='DEMO-R');
  if(pendingUser){pendingUser.name='条件待达成 · 小青';pendingUser.profile.name=pendingUser.name;}
  data.answers.forEach(answer=>{if(answer.userId==='DEMO-R')answer.user='条件待达成 · 小青';});
  data.review=[];
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
