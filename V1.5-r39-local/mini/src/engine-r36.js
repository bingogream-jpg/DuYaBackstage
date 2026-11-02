// V1.5-r36 reward claiming, meal credits, meal-enhanced checkout and demo reward user.
(()=>{
  const E=window.__DUYA_LOCAL_ENGINE;
  if(!E)return;
  const P=E.Store.prototype;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const ok=(value,message)=>{if(!value)throw Error(message);};
  const day=time=>E.dateKey(time);
  const DEFAULT_DAYS=30;
  function rewardRules(data){
    const rules=data.settings?.appRules?.rewardRules||{};
    const valid=value=>Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=365?Number(value):15;
    return {couponClaimDays:valid(rules.couponClaimDays),mealClaimDays:valid(rules.mealClaimDays)};
  }
  function claimExpired(event,now=Date.now()){
    return ['coupon','meal'].includes(event?.type)&&!event.claimedAt&&!event.walletId&&!event.mealCreditId&&event.status!=='已领取'&&Number.isFinite(Date.parse(event.claimExpiresAt))&&now>=Date.parse(event.claimExpiresAt);
  }

  function packageMap(data){
    const map={};
    for(const brand of data.brands||[])map[brand.id]=(data.packages||[]).map(item=>item.id);
    return map;
  }
  function effectiveRules(data){
    const rules=data.settings?.appRules?.mealRewardRules||{};
    const validity=Number(rules.validityDays);
    const fallback=packageMap(data);
    const selected={};
    for(const brand of data.brands||[]){
      const ids=Array.isArray(rules.eligiblePackages?.[brand.id])?rules.eligiblePackages[brand.id]:fallback[brand.id]||[];
      selected[brand.id]=ids.filter(id=>(data.packages||[]).some(item=>item.id===id));
    }
    return {validityDays:Number.isInteger(validity)&&validity>=1&&validity<=365?validity:DEFAULT_DAYS,eligiblePackages:selected};
  }
  function canUse(credit,brandId,packageId,now=Date.now()){
    if(!credit||Number(credit.remaining)<=0)return false;
    if(credit.expiresAt&&credit.expiresAt<day(now))return false;
    return Boolean(credit.eligiblePackages?.[brandId]?.includes(packageId));
  }
  function availableCredits(owner,brandId,packageId,now=Date.now()){
    return (owner?.mealCredits||[]).filter(credit=>canUse(credit,brandId,packageId,now));
  }
  function syncMealBalance(owner,now=Date.now()){
    owner.mealCredits=(owner.mealCredits||[]).map(credit=>{
      if(credit.expiresAt&&credit.expiresAt<day(now))return {...credit,remaining:0};
      return credit;
    });
    owner.mealBalance=(owner.mealCredits||[]).reduce((sum,credit)=>sum+Math.max(0,Number(credit.remaining)||0),0);
    return owner.mealBalance;
  }
  function eventFor(record,data){
    if(!record)return null;
    if(record.config&&record.userId&&record.type)return record;
    const owner=(data?.users||[]).find(user=>user.id===record.userId);
    if(!owner)return null;
    const id=String(record.id||'');
    if(id.startsWith('E-'))return owner.rewards.find(event=>event.id===id.slice(2))||null;
    if(id.startsWith('W-')){
      const wallet=owner.wallet.find(item=>item.id===id.slice(2));
      return wallet?{id:wallet.key||id,userId:owner.id,type:'coupon',status:'已领取',claimedAt:wallet.obtainedAt,walletId:wallet.id,config:{couponId:wallet.templateId}}:null;
    }
    return owner.rewards.find(event=>event.id===record.id)||null;
  }
  function statuses(record,data=window.R3?.state,now=Date.now()){
    const event=eventFor(record,data);
    if(!event)return [];
    const owner=(data?.users||[]).find(user=>user.id===event.userId);
    if(event.type==='custom')return [event.status==='已发放'?'已发放':'未发放'];
    const wallet=owner?.wallet.find(item=>item.id===event.walletId||item.key===event.id);
    const credit=owner?.mealCredits?.find(item=>item.id===event.mealCreditId);
    const claimed=Boolean(event.claimedAt||event.status==='已领取'||wallet||credit);
    if(!claimed)return [claimExpired(event,now)?'已过期':'未领取'];
    const expire=event.type==='coupon'?wallet?.expire||event.expiresAt:credit?.expiresAt||event.expiresAt;
    if(expire&&expire<day(now))return ['已过期'];
    const unused=event.type==='coupon'
      ?Boolean(wallet&&['可用','待生效'].includes(wallet.status))
      :Boolean(credit&&Number(credit.remaining)>0);
    return unused?['已领取','未使用']:['已领取'];
  }
  function label(record,data,now){
    return statuses(record,data,now).join(' / ')||'—';
  }
  function createRewardUser(data,now){
    if((data.users||[]).some(user=>user.id==='REWARD'))return;
    const base=clone((data.users||[]).find(user=>user.id==='INV')||(data.users||[])[0]);
    if(!base)return;
    const stamp=Number(now);
    const user={
      ...base,
      id:'REWARD',
      name:'新奖励用户',
      registeredAt:new Date(stamp-2*86400000).toISOString(),
      onboarded:true,
      onboardedAt:new Date(stamp-2*86400000).toISOString(),
      profile:{...base.profile,name:'新奖励用户',phone:'13920000009'},
      goal:'健康饮食',
      hasPlan:true,
      wallet:[],
      diet:[],
      answers:{},
      mealBalance:0,
      mealCredits:[],
      rewards:[],
      inviteCode:null,
      inviteCodeRevealedAt:null,
      inviteStatus:'启用',
      inviteProgram:null,
      binding:null,
      loginDates:[],
      loginEvents:[],
      growthProgress:{},
      checkinProgress:{},
      checkins:[],
      delivery:clone(base.delivery||{plans:[],addresses:[],dayChanges:{}}),
      orders:[]
    };
    const couponConfig={type:'coupon',couponId:'CP001',probability:100};
    const couponName=data.templates.find(item=>item.id==='CP001')?.name||'满 39 减 8 元券';
    const events=[
      {id:'r36-new-coupon',userId:'REWARD',source:'新奖励体验 · 优惠券奖励',type:'coupon',name:couponName,status:'待领取',time:new Date(stamp-3*60000).toISOString(),config:couponConfig,claimedAt:null},
      {id:'r36-new-meal',userId:'REWARD',source:'新奖励体验 · 赠餐奖励',type:'meal',name:'赠餐 2 餐',status:'待领取',time:new Date(stamp-2*60000).toISOString(),config:{type:'meal',count:2,probability:100},claimedAt:null},
      {id:'r36-new-custom',userId:'REWARD',source:'新奖励体验 · 成长奖励',type:'custom',name:'健康食谱手册',status:'待领取',reason:'请联系客服领取线下奖励',time:new Date(stamp-60000).toISOString(),config:{type:'custom',name:'健康食谱手册',probability:100},claimedAt:null,image:''}
    ];
    user.rewards=events;
    data.users.push(user);
    for(const event of events)data.rewardEvents[event.id]=event;
  }
  function migrate(data,now=Date.now()){
    data.settings=data.settings||{};
    data.settings.appRules=data.settings.appRules||{};
    data.settings.appRules.rewardRules=rewardRules(data);
    const current=data.settings.appRules.mealRewardRules;
    data.settings.appRules.mealRewardRules=current?effectiveRules(data):{validityDays:DEFAULT_DAYS,eligiblePackages:packageMap(data)};
    createRewardUser(data,now);
    for(const owner of data.users||[]){
      owner.mealCredits=Array.isArray(owner.mealCredits)?owner.mealCredits:[];
      const legacy=Math.max(0,Number(owner.mealBalance)||0);
      if(!owner.mealCredits.length&&legacy>0){
        const rules=effectiveRules(data);
        owner.mealCredits.push({
          id:'R36-LEGACY-'+owner.id,
          rewardId:null,
          source:'历史赠餐余额',
          total:legacy,
          remaining:legacy,
          claimedAt:new Date(now).toISOString(),
          expiresAt:day(now+rules.validityDays*86400000),
          eligiblePackages:clone(rules.eligiblePackages),
          legacy:true
        });
      }
      for(const event of owner.rewards||[]){
        if(!['coupon','meal'].includes(event.type))continue;
        const wallet=owner.wallet.find(item=>item.id===event.walletId||item.key===event.id);
        const claimed=Boolean(event.claimedAt||wallet||event.mealCreditId||['已发放','已领取'].includes(event.status));
        if(claimed){
          event.claimedAt=event.claimedAt||event.issuedAt||wallet?.obtainedAt||event.time||new Date(now).toISOString();
          event.status='已领取';
          if(wallet&&event.type==='coupon')event.walletId=wallet.id;
        }else{
          event.claimedAt=null;
          event.status='待领取';
        }
      }
      for(const wallet of owner.wallet||[]){
        const event=owner.rewards.find(item=>item.id===wallet.key&&item.type==='coupon');
        if(event&&!event.claimedAt){event.claimedAt=wallet.obtainedAt||event.time||new Date(now).toISOString();event.status='已领取';event.walletId=wallet.id;}
      }
      syncMealBalance(owner,now);
    }
    const inviter=data.users.find(user=>user.id==='INV');
    if(inviter&&!inviter.rewards.some(event=>event.id==='r36-demo-expired-coupon')){
      const template=data.templates.find(item=>item.id==='CP001')||data.templates[0];
      const event={id:'r36-demo-expired-coupon',userId:'INV',source:'历史奖励 · 已过期示例',type:'coupon',name:template?.name||'优惠券',status:'已领取',time:'2026-08-01T02:00:00.000Z',claimedAt:'2026-08-01T02:00:00.000Z',expiresAt:'2026-08-31',config:{type:'coupon',couponId:template?.id||'',probability:100},walletId:'W-R36-EXPIRED'};
      inviter.rewards.push(event);data.rewardEvents[event.id]=event;
      if(!inviter.wallet.some(wallet=>wallet.id==='W-R36-EXPIRED'))inviter.wallet.push({id:'W-R36-EXPIRED',templateId:template?.id||'',key:event.id,name:event.name,amount:Number(template?.amount)||0,threshold:Number(template?.threshold)||0,brands:clone(template?.brands||[]),start:'2026-08-01',expire:'2026-08-31',status:'已过期',source:event.source,obtainedAt:event.time,stackMax:template?.stackMax||1});
    }
    const paid=data.users.find(user=>user.id==='PAID');
    if(paid&&!paid.rewards.some(event=>event.id==='r36-demo-custom-issued')){
      const event={id:'r36-demo-custom-issued',userId:'PAID',source:'历史成长奖励 · 已发放示例',type:'custom',name:'定制餐盒礼遇',status:'已发放',time:'2026-10-12T02:00:00.000Z',claimedAt:'2026-10-12T02:00:00.000Z',reason:'',config:{type:'custom',name:'定制餐盒礼遇',probability:100},image:''};
      paid.rewards.push(event);data.rewardEvents[event.id]=event;
    }
    return data;
  }

  P.award=function(owner,rows,mode,key,source){
    if(this.data.rewardEvents[key])return this.data.rewardEvents[key];
    if(!rows?.length)return null;
    let chosen=rows[0];
    if(mode==='probability'){
      let pick=Math.random()*100;
      for(const row of rows){pick-=Number(row.probability);if(pick<0){chosen=row;break;}}
    }
    const template=chosen.type==='coupon'?this.data.templates.find(item=>item.id===chosen.couponId):null;
    const event={
      id:key,
      userId:owner.id,
      source,
      type:chosen.type,
      name:chosen.type==='coupon'?template?.name||'优惠券奖励':chosen.type==='meal'?'赠餐 '+Number(chosen.count||1)+' 餐':chosen.name||'自定义奖励',
      status:'待领取',
      reason:chosen.type==='custom'?'请联系客服领取线下奖励':'',
      time:new Date(this.now()).toISOString(),
      config:clone(chosen),
      claimedAt:null,
      image:chosen.image||''
    };
    if(['coupon','meal'].includes(event.type)){
      event.claimValidityDays=rewardRules(this.data)[event.type==='coupon'?'couponClaimDays':'mealClaimDays'];
      event.claimExpiresAt=new Date(this.now()+event.claimValidityDays*86400000).toISOString();
    }
    owner.rewards.push(event);
    this.data.rewardEvents[key]=event;
    return event;
  };

  function claim(owner,event){
    ok(event&&event.userId===owner.id,'奖励不存在');
    ok(['coupon','meal'].includes(event.type),'该奖励无需领取');
    if(event.claimedAt){
      const duplicate=event.type==='meal'?owner.mealCredits.find(item=>item.rewardId===event.id):owner.wallet.find(item=>item.id===event.walletId||item.key===event.id);
      return {event,credit:duplicate||null};
    }
    const now=this.now(),rules=effectiveRules(this.data);
    ok(!claimExpired(event,now),'奖励已过期，无法领取');
    if(event.type==='coupon'){
      const wallet=this.issue(owner,event.config.couponId,event.id,event.source);
      event.walletId=wallet.id;
      event.claimedAt=new Date(now).toISOString();
      event.expiresAt=wallet.expire;
      event.status='已领取';
      return {event,wallet};
    }
    const count=Math.max(1,Number(event.config?.count)||1);
    const credit={
      id:'R36-MEAL-'+now+'-'+Math.random().toString(36).slice(2,6),
      rewardId:event.id,
      source:event.source,
      total:count,
      remaining:count,
      claimedAt:new Date(now).toISOString(),
      expiresAt:day(now+rules.validityDays*86400000),
      eligiblePackages:clone(rules.eligiblePackages)
    };
    owner.mealCredits=owner.mealCredits||[];
    owner.mealCredits.push(credit);
    event.mealCreditId=credit.id;
    event.claimedAt=credit.claimedAt;
    event.expiresAt=credit.expiresAt;
    event.status='已领取';
    syncMealBalance(owner,now);
    return {event,credit};
  }

  const runBase=P.run;
  P.run=function(type,user,payload={}){
    if(type==='ADMIN_SAVE_APP_RULES'&&payload.appRules?.rewardRules){
      const rules=payload.appRules.rewardRules;
      for(const key of ['couponClaimDays','mealClaimDays'])ok(Number.isInteger(Number(rules[key]))&&Number(rules[key])>=1&&Number(rules[key])<=365,'奖励领取期限须为1至365天的整数');
      payload={...payload,appRules:{...payload.appRules,rewardRules:rewardRules({settings:{appRules:{rewardRules:rules}}})}};
    }
    if(type==='REWARD_CLAIM'){
      const owner=this.user(user),event=owner.rewards.find(item=>item.id===payload.rewardId);
      return claim.call(this,owner,event);
    }
    if(type==='ADMIN_SAVE_APP_RULES'&&payload.appRules?.mealRewardRules){
      const rules=payload.appRules.mealRewardRules;
      ok(Number.isInteger(Number(rules.validityDays))&&Number(rules.validityDays)>=1&&Number(rules.validityDays)<=365,'赠餐有效期须为1至365天');
      const eligible={};
      for(const brand of this.data.brands){
        const ids=Array.isArray(rules.eligiblePackages?.[brand.id])?rules.eligiblePackages[brand.id]:[];
        eligible[brand.id]=[...new Set(ids.filter(id=>this.data.packages.some(item=>item.id===id)))];
      }
      payload={...payload,appRules:{...payload.appRules,mealRewardRules:{validityDays:Number(rules.validityDays),eligiblePackages:eligible}}};
    }
    if(type!=='PAY')return runBase.call(this,type,user,payload);
    const owner=this.user(user),existing=owner.orders.find(order=>order.checkoutToken===payload.token);
    if(existing)return existing;
    const order=runBase.call(this,type,user,payload);
    const count=Number(payload.mealRewardCount)||0;
    if(!count)return order;
    ok(Number.isInteger(count)&&count>0,'赠餐数量须为正整数');
    const credits=availableCredits(owner,order.brandId,order.packageId,this.now()).sort((a,b)=>String(a.expiresAt).localeCompare(String(b.expiresAt)));
    const available=credits.reduce((sum,credit)=>sum+Number(credit.remaining||0),0);
    ok(count<=available,'所选赠餐数量超过当前套餐可用数量');
    let left=count;
    const uses=[];
    for(const credit of credits){
      if(!left)break;
      const used=Math.min(left,Number(credit.remaining)||0);
      credit.remaining-=used;
      left-=used;
      uses.push({creditId:credit.id,count:used,rewardId:credit.rewardId||null});
    }
    ok(left===0,'赠餐扣减失败，请重试');
    syncMealBalance(owner,this.now());
    order.giftMeals=count;
    order.mealUses=uses;
    order.mealCreditIds=uses.flatMap(item=>Array(item.count).fill(item.creditId));
    order.total=Number(order.total)+count;
    order.remaining=Number(order.remaining)+count;
    order.r36MealApplied=true;
    return order;
  };
  window.R36MealRules={effectiveRules,canUse,availableCredits,syncMealBalance,defaults:()=>({validityDays:DEFAULT_DAYS,eligiblePackages:{}})};
  window.R36Rewards={eventFor,statuses,label,rewardRules,claimExpired};
  window.R36Data={migrate,claim};
})();
