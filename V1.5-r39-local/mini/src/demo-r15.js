// V1.5-r15 invitation reward separation and independent user growth activities.
window.__g15Demo=function(data,now){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const templates=data.templates.filter(item=>item.status==='启用');
  const reward=(index)=>({type:'coupon',couponId:templates[index%templates.length].id,probability:100});
  const inviterStage=(id,name,desc,condition,label,index)=>({id,name,desc,enabled:true,activeMode:'always',start:'',end:'',inviter:{enabled:true,condition:clone(condition),conditionLabel:label,rewardMode:'fixed',rewards:[reward(index)]}});
  data.settings.userInviteStages=[
    inviterStage('ui-invite-count','邀请人数礼','成功邀请达到人数后发放',{type:'invite_count',count:1},'邀请人数 ≥ 1 人',0),
    inviterStage('ui-invite-orders','邀请消费礼','被邀请人累计购买达到次数',{type:'invitee_order_count',count:2},'被邀请人购买次数 ≥ 2 次',1),
    inviterStage('ui-invite-amount','邀请金额礼','被邀请人累计付款达到门槛',{type:'invitee_order_amount',amount:199},'被邀请人累计付款 ≥ ¥199',2),
    inviterStage('ui-invite-login','邀请活跃礼','被邀请人累计登录达到天数',{type:'invitee_login_days',count:5},'被邀请人累计登录 ≥ 5 天',3)
  ];
  data.settings.userInviteCondition=clone(data.settings.condition||{type:'profile_complete'});
  data.settings.userInviteConditionLabel='完成初始设置';
  data.settings.rewardsEnabled=true;
  data.settings.revision=1;
  data.merchants.forEach((merchant,index)=>{
    merchant.condition=clone(merchant.condition||data.settings.userInviteCondition);
    merchant.conditionLabel=merchant.conditionLabel||'完成初始设置';
    merchant.withReward=false;
    merchant.rewardStages=[];
    merchant.reward=[];
  });
  for(const user of data.users){
    user.loginEvents=user.loginEvents||[];
    user.growthProgress={};
    if(user.onboarded&&!user.onboardedAt)user.onboardedAt=user.registeredAt;
    if(user.inviteProgram){
      user.inviteProgram.stages=(user.inviteProgram.stages||[]).filter(stage=>stage.inviter).map(stage=>({stageId:stage.stageId,name:stage.name,desc:stage.desc,enabled:stage.enabled!==false,activeMode:stage.activeMode,start:stage.start,end:stage.end,inviter:clone(stage.inviter)}));
    }
  }
  for(const relation of data.inviteRelations){
    relation.stageSnapshots=[];
    if(relation.merchantId){const merchant=data.merchants.find(item=>item.id===relation.merchantId);relation.condition=clone(relation.condition||merchant?.condition||{type:'profile_complete'});relation.conditionLabel=relation.conditionLabel||merchant?.conditionLabel||'完成初始设置';}
  }
  const activityStage=(id,name,desc,condition,label,index)=>({id,name,desc,enabled:true,activeMode:'always',start:'',end:'',condition:clone(condition),conditionLabel:label,rewardMode:'fixed',rewards:[reward(index)]});
  const activatedAt=new Date(now).toISOString();
  data.growthActivities=[
    {id:'GA-ALL',name:'全用户成长计划',desc:'面向全部用户的成长奖励演示',status:'启用',start:'2026-10-01',end:'2027-12-31',activatedAt,audience:{allUsers:true,userIds:[],merchantCodes:[],userInviteCodes:[],inviteStatus:'any',registeredFrom:'',registeredTo:''},stages:[
      activityStage('all-profile','完善资料礼','完成初始设置后发放',{type:'profile_complete'},'完成初始设置',0),
      activityStage('all-first','首单成长礼','完成首笔支付后发放',{type:'order_count',count:1},'购餐满 1 次',1),
      activityStage('all-login','持续登录礼','累计登录后发放',{type:'login_days',days:3},'累计登录 3 天',2)
    ],revision:1},
    {id:'GA-MERCHANT',name:'商户渠道成长计划',desc:'绑定指定商户码的用户可参与',status:'启用',start:'2026-10-01',end:'2027-12-31',activatedAt,audience:{allUsers:false,userIds:[],merchantCodes:['K7HQ92MD'],userInviteCodes:[],inviteStatus:'any',registeredFrom:'',registeredTo:''},stages:[
      activityStage('merchant-first','渠道首单礼','渠道用户首单奖励',{type:'order_count',count:1},'购餐满 1 次',3),
      activityStage('merchant-amount','渠道消费礼','渠道用户累计消费奖励',{type:'order_amount',amount:299},'累计实付满 ¥299',4)
    ],revision:1},
    {id:'GA-INVITED',name:'好友邀请成长计划',desc:'由指定用户邀请码邀请的用户可参与',status:'启用',start:'2026-10-01',end:'2027-12-31',activatedAt,audience:{allUsers:false,userIds:[],merchantCodes:[],userInviteCodes:['H8NQ4W3R'],inviteStatus:'invited',registeredFrom:'',registeredTo:''},stages:[
      activityStage('invited-login','好友活跃礼','被邀请用户累计登录奖励',{type:'login_days',days:2},'累计登录 2 天',5)
    ],revision:1}
  ];
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
