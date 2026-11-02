// V1.5-r13 merchant multi-stage invitation rewards.
window.__g13Demo=function(data,now){
  const clone=value=>JSON.parse(JSON.stringify(value));
  data.merchants.forEach((merchant,index)=>{
    const firstReward=clone(merchant.reward||[]);
    if(!merchant.withReward||!firstReward.length){
      merchant.rewardStages=[];
      return;
    }
    const templates=data.templates.filter(item=>item.status==='启用');
    const stage=(id,name,desc,condition,conditionLabel,rewardMode,rewards,activeMode,start,end)=>({id,name,desc,enabled:true,condition:clone(condition),conditionLabel,rewardMode,rewards:clone(rewards),activeMode,start:start||'',end:end||''});
    const stages=[
      stage('stage-register','注册礼','新用户绑定后完成初始设置可获得奖励',merchant.condition||{type:'profile_complete'},merchant.conditionLabel||'完成初始设置',merchant.rewardMode||'fixed',firstReward,'always'),
      stage('stage-first-order','首单礼','绑定后完成首笔未退款支付订单',{type:'order_count',count:1},'购餐满 1 次','fixed',[{type:'coupon',couponId:templates[(index+2)%templates.length].id,probability:100}],'always')
    ];
    if(merchant.withReward&&index%2===0){
      stages.push(stage('stage-amount','消费进阶礼','绑定后累计实付达到指定金额',{type:'order_amount',amount:99},'累计实付满 ¥99','fixed',[{type:'coupon',couponId:templates[(index+5)%templates.length].id,probability:100}],index%6===0?'range':'always',index%6===0?'2026-10-01':'',index%6===0?'2027-12-31':''));
    }
    merchant.rewardStages=stages;
  });
  for(const relation of data.inviteRelations){
    if(!relation.merchantId){relation.stageSnapshots=relation.stageSnapshots||[];continue;}
    const merchant=data.merchants.find(item=>item.id===relation.merchantId);
    if(!merchant){relation.stageSnapshots=[];continue;}
    const snapshots=clone(merchant.rewardStages||[]).filter(stage=>stage.enabled).map(item=>({...item,stageId:item.id,status:'待达成',metAt:null,rewardEventKey:null}));
    if(relation.status==='已达成'&&snapshots.length){
      Object.assign(snapshots[0],{status:'已达成',metAt:relation.metAt||relation.boundAt,rewardEventKey:relation.rewardKeys?.[0]||null});
    }else if(relation.status==='已失效'){
      snapshots.forEach(stage=>{stage.status='已失效';});
    }
    relation.stageSnapshots=snapshots;
  }
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
