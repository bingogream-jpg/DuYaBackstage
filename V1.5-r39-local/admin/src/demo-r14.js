// V1.5-r14 user invitation dual-sided multi-stage program demo.
window.__g14Demo=function(data,now){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const templates=data.templates.filter(item=>item.status==='启用');
  const side=(enabled,condition,conditionLabel,rewardMode,rewards)=>({enabled,condition:clone(condition),conditionLabel,rewardMode,rewards:clone(rewards)});
  const stage=(id,name,desc,conditionInvitee,conditionInviter,inviteeReward,inviterReward,inviteeLabel,inviterLabel)=>({
    id,name,desc,enabled:true,activeMode:'always',start:'',end:'',
    invitee:side(true,conditionInvitee,inviteeLabel,'fixed',[{type:'coupon',couponId:inviteeReward.id,probability:100}]),
    inviter:side(true,conditionInviter,inviterLabel,'fixed',[{type:'coupon',couponId:inviterReward.id,probability:100}])
  });
  data.settings.userInviteStages=[
    stage('ui-register','注册礼','被邀请人完成初始设置，邀请人获得首邀奖励',{type:'profile_complete'},{type:'invite_count',count:1},templates[0],templates[1],'完成初始设置','邀请人数 ≥ 1 人'),
    stage('ui-first-order','首单激励','被邀请人完成首单后，双方分别获得奖励',{type:'order_count',count:1},{type:'invitee_order_count',count:1},templates[2],templates[3],'购餐满 1 次','被邀请人购买次数 ≥ 1 次'),
    stage('ui-active','持续活跃礼','被邀请人累计登录后，邀请人同步达成阶段',{type:'login_days',days:3},{type:'invitee_login_days',count:3},templates[4],templates[5],'累计登录 3 天','被邀请人累计登录 ≥ 3 天'),
    stage('ui-amount','消费进阶礼','被邀请人累计付款达到门槛后触发双方奖励',{type:'order_amount',amount:99},{type:'invitee_order_amount',amount:99},templates[6],templates[7],'累计实付满 ¥99','被邀请人累计付款 ≥ ¥99')
  ];
  data.settings.rewardsEnabled=true;
  data.settings.revision=1;
  const programs=new Map();
  const makeProgram=(inviter,firstRelation)=>{
    const legacy=firstRelation?.rewardSnapshot||{};
    const firstCondition=firstRelation?.condition||data.settings.condition||{type:'profile_complete'};
    const configured=clone(data.settings.userInviteStages);
    configured[0].invitee={
      enabled:(legacy.target||'both')==='new'||(legacy.target||'both')==='both',
      condition:clone(firstCondition),
      conditionLabel:firstRelation?.conditionLabel||'完成初始设置',
      rewardMode:legacy.newRewardMode||'fixed',
      rewards:clone(legacy.newReward||configured[0].invitee.rewards)
    };
    configured[0].inviter={
      enabled:(legacy.target||'both')==='old'||(legacy.target||'both')==='both',
      condition:{type:'invite_count',count:1},
      conditionLabel:'邀请人数 ≥ 1 人',
      rewardMode:legacy.oldRewardMode||'fixed',
      rewards:clone(legacy.oldReward||configured[0].inviter.rewards)
    };
    const stages=configured.filter(item=>item.enabled).map(item=>({
      stageId:item.id,name:item.name,desc:item.desc,enabled:true,activeMode:item.activeMode,start:item.start,end:item.end,
      invitee:{...clone(item.invitee),status:item.invitee.enabled?'待达成':'不适用',metAt:null,rewardEventKey:null},
      inviter:{...clone(item.inviter),status:item.inviter.enabled?'待达成':'不适用',metAt:null,rewardEventKey:null}
    }));
    return {id:'IP-LEGACY-'+inviter.id,inviterId:inviter.id,createdAt:firstRelation?.boundAt||new Date(now).toISOString(),stages,rewardKeys:[],status:stages.length?'待达成':'已达成'};
  };
  for(const relation of data.inviteRelations.filter(item=>!item.merchantId)){
    const inviter=data.users.find(item=>item.id===relation.inviterId);
    if(!inviter)continue;
    if(!programs.has(inviter.id))programs.set(inviter.id,inviter.inviteProgram||makeProgram(inviter,relation));
    const program=programs.get(inviter.id);
    relation.inviterProgramId=program.id;
    relation.stageSnapshots=program.stages.filter(item=>item.invitee).map(item=>({stageId:item.stageId,name:item.name,desc:item.desc,activeMode:item.activeMode,start:item.start,end:item.end,enabled:item.invitee.enabled,condition:clone(item.invitee.condition),conditionLabel:item.invitee.conditionLabel,rewardMode:item.invitee.rewardMode,rewards:clone(item.invitee.rewards),status:item.invitee.enabled?'待达成':'不适用',metAt:null,rewardEventKey:null}));
    if(relation.status==='已达成'&&relation.stageSnapshots.length){
      const key=(relation.rewardKeys||[]).find(id=>id.endsWith('-new'));
      if(key){Object.assign(relation.stageSnapshots[0],{status:'已达成',metAt:relation.metAt||relation.boundAt,rewardEventKey:key});}
      const oldKey=(relation.rewardKeys||[]).find(id=>id.endsWith('-old'));
      if(oldKey&&program.stages[0]?.inviter?.enabled&&program.stages[0].inviter.status!=='已达成'){
        Object.assign(program.stages[0].inviter,{status:'已达成',metAt:relation.metAt||relation.boundAt,rewardEventKey:oldKey});
        if(!program.rewardKeys.includes(oldKey))program.rewardKeys.push(oldKey);
      }
    }
  }
  for(const [id,program] of programs){data.users.find(item=>item.id===id).inviteProgram=program;}
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
