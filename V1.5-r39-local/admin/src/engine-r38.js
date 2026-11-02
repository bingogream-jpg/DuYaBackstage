// r38 data compatibility and deterministic coupon-issue demonstrations.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE;
 if(!E)return;
 const clone=value=>JSON.parse(JSON.stringify(value));
 const day=time=>E.dateKey(time);

 function migrate(data){
  if(!data)return false;
  const previousVersion=Number(data.r38Migration?.version)||0;
  if(previousVersion>=2)return false;
  let changed=previousVersion===0;
  const currentTime=data.now??Date.now(),now=typeof currentTime==='number'?currentTime:Date.parse(currentTime);
  const today=day(now);
  if(previousVersion===0){
   const template=data.templates?.find(item=>item.status==='启用')||data.templates?.[0];
   const cases=[
    {id:'ISSUE-R38-REVOKE',userId:'PAID',state:'revocable',label:'可撤回演示 · 运营管理员',daysAgo:1},
    {id:'ISSUE-R38-CLAIMED',userId:'NEW',state:'claimed',label:'已领取演示 · 城市运营',daysAgo:2},
    {id:'ISSUE-R38-EXPIRED',userId:'INV',state:'expired',label:'已失效演示 · 用户运营',daysAgo:12}
   ];
   data.issues=data.issues||[];
   data.rewardEvents=data.rewardEvents||{};
   if(template)for(const item of cases){
    if(data.issues.some(job=>job.id===item.id))continue;
    const owner=data.users?.find(user=>user.id===item.userId);
    if(!owner)continue;
    const issuedAt=new Date(now-item.daysAgo*86400000).toISOString();
    const rewardId=item.id+'-REWARD';
    const walletId=item.state==='claimed'?item.id+'-WALLET':null;
    const event={
     id:rewardId,
     userId:owner.id,
     source:'后台下发',
     type:'coupon',
     name:template.name,
     status:item.state==='claimed'?'已领取':'待领取',
     time:issuedAt,
     config:{type:'coupon',couponId:template.id,probability:100},
     claimedAt:item.state==='claimed'?issuedAt:null,
     walletId,
     issueJobId:item.id,
     grantedBy:item.label.split(' · ')[1],
     claimValidityDays:15,
     claimExpiresAt:new Date(now+(item.state==='expired'?-5:12)*86400000).toISOString(),
     couponSnapshot:clone(template)
    };
    owner.rewards=owner.rewards||[];
    owner.rewards.push(event);
    data.rewardEvents[rewardId]=clone(event);
    if(walletId){
     owner.wallet=owner.wallet||[];
     owner.wallet.push({
      id:walletId,key:rewardId,templateId:template.id,name:template.name,
      amount:template.amount,threshold:template.threshold,brands:clone(template.brands||[]),
      start:template.validMode==='fixed'?template.start:today,
      expire:template.validMode==='fixed'?template.end||template.expire||'2099-12-31':new Date(now+30*86400000).toISOString().slice(0,10),
      status:'可用',source:'后台下发',obtainedAt:issuedAt,grantedBy:event.grantedBy,stackMax:Number(template.stackMax)||1
     });
    }
    data.issues.push({
     id:item.id,templateId:template.id,users:[owner.id],source:'后台下发',note:item.label,
     scheduledAt:null,status:'已完成',createdAt:issuedAt,executedAt:issuedAt,
     grantedBy:event.grantedBy,
     results:[{userId:owner.id,ok:true,rewardId,walletId:walletId||undefined}]
    });
   }
   data.r38Migration={...(data.r38Migration||{}),demos:cases.map(item=>item.id)};
  }

  // r38 closure: coupon issuance is unlimited, invitation time is explicit and
  // legacy merchant/invite-code audiences collapse to the supported all-users mode.
  for(const template of data.templates||[])if(Number(template.limit)!==0){template.limit=0;changed=true;}
  const normalizeTime=record=>{
   const mode=record.validityMode==='always'||record.validityMode==='range'
    ?record.validityMode
    :record.start&&record.end?'range':'always';
   let touched=false;
   if(record.validityMode!==mode){record.validityMode=mode;touched=true;}
   if(mode==='always'&&(record.start||record.end)){record.start='';record.end='';touched=true;}
   if(mode==='range'&&(!record.start||!record.end)){record.validityMode='always';record.start='';record.end='';touched=true;}
   return touched;
  };
  for(const merchant of data.merchants||[])if(normalizeTime(merchant))changed=true;
  if(data.settings&&normalizeTime(data.settings))changed=true;
  for(const activity of data.activities37||[]){
   const audience=activity.audience&&typeof activity.audience==='object'?activity.audience:{mode:'all'};
   const mode=audience.mode==='users'&&Array.isArray(audience.userIds)&&audience.userIds.length?'users':'all';
   const next={...audience,mode,allUsers:mode==='all',userIds:mode==='users'?clone(audience.userIds):[],merchantCodes:[],userInviteCodes:[]};
   if(JSON.stringify(audience)!==JSON.stringify(next)){activity.audience=next;changed=true;}
  }
  data.r38Migration={
   ...(data.r38Migration||{}),
   version:2,
   at:new Date(Number.isFinite(now)?now:Date.now()).toISOString(),
   closure:{couponUnlimited:true,inviteActivityTime:true,audienceModes:['all','users']}
  };
  return changed||previousVersion<2;
 }

 const prototype=E.Store.prototype;
 const issue=prototype.issue;
 prototype.issue=function(user,templateId,key,source){
  const template=this.data.templates?.find(item=>item.id===templateId);
  if(!template||!Number(template.limit))return issue.call(this,user,templateId,key,source);
  const limit=template.limit;template.limit=0;
  try{return issue.call(this,user,templateId,key,source);}
  finally{template.limit=limit;}
 };
 const executeIssue=prototype.executeIssue;
 prototype.executeIssue=function(job){
  const template=this.data.templates?.find(item=>item.id===job.templateId);
  if(!template||!Number(template.limit))return executeIssue.call(this,job);
  const limit=template.limit;template.limit=0;
  try{return executeIssue.call(this,job);}
  finally{template.limit=limit;}
 };
 const saveEntity=prototype.saveEntity;
 prototype.saveEntity=function(entity,record){
  return saveEntity.call(this,entity,entity==='coupon'?{...record,limit:0}:record);
 };

 function orderStatus(user){
  const orders=(user?.orders||[]).filter(order=>order.status!=='已退款');
  if(orders.some(order=>Number(order.remaining)>0&&['进行中','待使用','未开始','已暂停'].includes(order.status)))return '订购中';
  if(orders.length)return '过往订购';
  return '0订购';
 }

 window.R38Data={migrate,orderStatus};
})();
