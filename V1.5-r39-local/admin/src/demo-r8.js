// Deterministic V1.5-r8 demo data. This expands the growth modules without changing engine rules.
window.__g8Demo=function(base,now){
  const data=base;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const dateKey=ts=>new Date(ts).toISOString().slice(0,10);
  const today=dateKey(now);
  const dayOffset=n=>new Date(now+n*86400000).toISOString();
  const sourcePool=['后台下发','邀请好友奖励','受邀注册奖励','商户邀请奖励','问卷调查奖励','连续打卡奖励'];
  const names=['沈知夏','陈一禾','周清越','顾念安','林星野','许清欢','宋予川','唐小满','苏晚晴','叶青禾','陆知遥','江晚舟','程以南','温言','谢南乔','罗一宁','韩沐晨','白知夏','何星遥','梁清和','秦予安','杜若','夏知微','邵景行','乔安然','方以宁','孟秋','袁小满','彭一川','魏清妍'];
  const packageNames=['7天体验套餐','14天进阶套餐','28天管理套餐','3天轻体验套餐'];
  const brandIds=data.brands.map(item=>item.id);
  const couponLabels=['新客尝鲜券','会员回馈券','轻食满减券','早餐加餐券','晚餐安心券','邀请好友券','问卷答谢券','连续打卡券','品牌专享券','周末活力券'];
  const templateNames=['满 39 减 8 元券','无门槛 5 元券','满 69 减 15 元券'];

  while(data.templates.length<36){
    const index=data.templates.length;
    const amount=[3,5,8,10,12,15,20,25,30][index%9];
    const threshold=[0,19,29,39,49,69,99][index%7];
    const id='CP'+String(index+1).padStart(3,'0');
    templateNames.push(couponLabels[index%couponLabels.length]+' '+amount+'元');
    data.templates.push({
      id,
      name:templateNames.at(-1),
      amount,
      threshold,
      brands:index%5===0?[data.brands[index%data.brands.length].name]:[],
      expire:'2027-12-31',
      status:index%11===0?'停用':index%13===0?'草稿':'启用',
      source:sourcePool[index%sourcePool.length],
      desc:threshold?'订单满 '+threshold+' 元可用，每单限用一张。':'无门槛抵扣 '+amount+' 元，每单限用一张。',
      validMode:index%3===0?'fixed':'relative',
      days:[15,30,45][index%3],
      start:'2026-10-01',
      end:'2027-12-31',
      limit:index%4===0?2:1,
      revision:1
    });
  }

  const existingIds=new Set(data.users.map(item=>item.id));
  while(data.users.length<36){
    const index=data.users.length;
    const id='U2026'+String(1000+index).padStart(4,'0');
    if(existingIds.has(id))continue;
    existingIds.add(id);
    const user=clone(data.users.find(item=>item.id==='PAID')||data.users[0]);
    const name=names[(index-3)%names.length];
    user.id=id;
    user.name=name;
    user.registeredAt=dayOffset(-(index+3));
    user.onboarded=index%9!==0;
    user.profile={...user.profile,name,phone:'139'+String(10000000+index).slice(-8),activity:index%3===0?'中度活动':'轻度活动'};
    user.goal=['健康饮食','减重','增肌','减脂'][index%4];
    user.hasPlan=user.onboarded;
    user.wallet=[];
    user.rewards=[];
    user.diet=[];
    user.answers={};
    user.binding=null;
    user.inviteCode='U8'+String(1000+index).padStart(6,'0');
    user.inviteStatus=index%19===0?'停用':'启用';
    user.delivery={plans:clone(data.users.find(item=>item.id==='PAID')?.delivery?.plans?.slice(0,1)||[]),addresses:clone(data.users.find(item=>item.id==='PAID')?.delivery?.addresses?.slice(0,1)||[]),dayChanges:{}};
    user.orders=[];
    user.checkins=[];
    user.mealBalance=0;
    data.users.push(user);
  }
  data.users.forEach((user,index)=>{
    user.profile=user.profile||{};
    user.profile.phone=user.profile.phone||'139'+String(20000000+index).slice(-8);
    user.inviteCode=user.inviteCode||'U8'+String(1000+index).padStart(6,'0');
    user.inviteStatus=user.inviteStatus||'启用';
    user.checkins=Array.isArray(user.checkins)?user.checkins:[];
    const checkinDays=[27,23,20,18,12,8,5,3,1,0][index%10];
    user.checkins=[];
    for(let d=0;d<checkinDays;d++)user.checkins.push(dateKey(now-d*86400000));
    if(index%3===0&&!user.orders.some(order=>order.status==='进行中')){
      const brandId=brandIds[index%brandIds.length],brand=data.brands.find(item=>item.id===brandId);
      user.orders.push({
        id:'r8-active-'+user.id,
        userId:user.id,
        brandId,
        brand:brand?.name||'轻食品牌',
        packageId:'trial7',
        pkg:packageNames[index%packageNames.length],
        total:20,
        remaining:6+index%8,
        used:14-index%8,
        price:299,
        originalPrice:299,
        status:'进行中',
        paidAt:dayOffset(-(index+1)),
        time:dateKey(now-(index+1)*86400000)+' 12:00',
        attributionCode:null
      });
    }else if(index%3===1&&!user.orders.length){
      const brandId=brandIds[index%brandIds.length],brand=data.brands.find(item=>item.id===brandId);
      user.orders.push({
        id:'r8-history-'+user.id,
        userId:user.id,
        brandId,
        brand:brand?.name||'轻食品牌',
        packageId:'trial7',
        pkg:packageNames[index%packageNames.length],
        total:20,
        remaining:0,
        used:20,
        price:299,
        originalPrice:299,
        status:'已完成',
        paidAt:dayOffset(-(35+index)),
        time:dateKey(now-(35+index)*86400000)+' 12:00',
        attributionCode:null
      });
    }
  });

  const walletStatuses=['可用','已使用','已过期','已撤回','待生效'];
  data.users.forEach((user,userIndex)=>{
    const targetCount=2+userIndex%4;
    const usedTemplates=new Set(user.wallet.map(item=>item.templateId));
    let cursor=0;
    while(user.wallet.length<targetCount){
      const template=data.templates[(userIndex*3+cursor)%data.templates.length];
      cursor+=1;
      if(usedTemplates.has(template.id)&&user.wallet.filter(item=>item.templateId===template.id).length>=Math.max(1,template.limit||1))continue;
      usedTemplates.add(template.id);
      const displayStatus=walletStatuses[(userIndex+cursor)%walletStatuses.length];
      const source=sourcePool[(userIndex+cursor)%sourcePool.length];
      const start=displayStatus==='待生效'?dateKey(now+4*86400000):dateKey(now-(12+cursor)*86400000);
      const expire=displayStatus==='已过期'?dateKey(now-(2+cursor)*86400000):dateKey(now+(20+userIndex+cursor)*86400000);
      const walletId='W8'+String(userIndex+1).padStart(3,'0')+String(cursor).padStart(2,'0');
      const wallet={
        id:walletId,
        templateId:template.id,
        key:'r8-grant-'+user.id+'-'+cursor,
        name:template.name,
        amount:template.amount,
        threshold:template.threshold,
        brands:clone(template.brands||[]),
        start,
        expire,
        status:displayStatus==='已撤回'?'已撤回':displayStatus==='已使用'?'已使用':'可用',
        source,
        obtainedAt:dayOffset(-(5+userIndex%20)),
        grantedBy:source==='后台下发'?'运营管理员':'系统自动发放'
      };
      if(displayStatus==='已使用'){
        const orderId='r8-use-'+user.id+'-'+cursor;
        wallet.orderId=orderId;
        wallet.usedAt=dayOffset(-(1+userIndex%8));
        const brandId=brandIds[(userIndex+cursor)%brandIds.length],brand=data.brands.find(item=>item.id===brandId);
        user.orders.push({
          id:orderId,
          userId:user.id,
          brandId,
          brand:brand?.name||'轻食品牌',
          packageId:'trial7',
          pkg:packageNames[(userIndex+cursor)%packageNames.length],
          total:20,
          remaining:12,
          used:8,
          price:Math.max(1,299-template.amount),
          originalPrice:299,
          discount:template.amount,
          couponId:walletId,
          status:'进行中',
          paidAt:wallet.usedAt,
          time:wallet.usedAt.slice(0,10)+' 12:00',
          attributionCode:null
        });
      }
      user.wallet.push(wallet);
    }
  });

  while(data.merchants.length<36){
    const index=data.merchants.length;
    data.merchants.push({
      id:'MC8'+String(index+1).padStart(3,'0'),
      name:['社区健康站','城市轻食联盟','运动生活馆','企业健康福利','亲子营养中心'][index%5]+' '+(index+1),
      code:'M8'+String(1000+index).padStart(6,'0'),
      phone:'028-66'+String(100000+index).slice(-6),
      note:index%4===0?'重点合作商户':'活动渠道商户',
      status:index%17===0?'停用':'启用',
      start:'2026-10-01',
      end:'2027-12-31',
      withReward:index%3!==0,
      reward:[{type:'coupon',couponId:data.templates[1+(index%8)].id,probability:100}],
      rewardMode:'fixed',
      revision:1
    });
  }

  data.inviteRelations=data.inviteRelations.slice(0,5);
  let relationIndex=0;
  while(data.inviteRelations.length<36){
    relationIndex+=1;
    const inviter=data.users[relationIndex%Math.min(18,data.users.length)];
    let invitee=data.users[Math.min(data.users.length-1,18+(relationIndex%18))];
    if(invitee.id===inviter.id)invitee=data.users[(18+relationIndex+1)%data.users.length];
    const status=relationIndex%13===0?'待复核':relationIndex%17===0?'已判异常':'有效';
    const relation={
      id:'IR8'+String(relationIndex).padStart(3,'0'),
      inviterId:inviter.id,
      userId:invitee.id,
      merchantId:null,
      source:'用户邀请码',
      code:inviter.inviteCode,
      boundAt:dayOffset(-(relationIndex%28)),
      status,
      rewardKeys:[]
    };
    if(status==='有效'){
      const oldTemplate=data.templates[(relationIndex*2)%data.templates.length];
      const newTemplate=data.templates[(relationIndex*2+1)%data.templates.length];
      for(const [owner,template,source,kind] of [[inviter,oldTemplate,'邀请好友奖励','old'],[invitee,newTemplate,'受邀注册奖励','new']]){
        const rewardId='invite-r8-'+relation.id+'-'+kind;
        const walletId='W8R'+String(relationIndex).padStart(3,'0')+kind;
        owner.wallet.push({
          id:walletId,templateId:template.id,key:rewardId,name:template.name,amount:template.amount,threshold:template.threshold,
          brands:clone(template.brands||[]),start:'2026-10-01',expire:'2027-12-31',status:'可用',source,
          obtainedAt:relation.boundAt,grantedBy:'邀请奖励自动发放'
        });
        owner.rewards.push({
          id:rewardId,userId:owner.id,source,type:'coupon',name:template.name,status:'已发放',
          time:relation.boundAt,config:{type:'coupon',couponId:template.id,probability:100},walletId
        });
        relation.rewardKeys.push(rewardId);
      }
    }
    data.inviteRelations.push(relation);
  }

  const publishedCustom=data.surveys.filter(item=>item.type==='custom'&&item.status==='已发布');
  while(data.surveys.length<36){
    const index=data.surveys.length;
    const template=data.surveys[index%Math.max(1,data.surveys.length)];
    const survey={
      ...clone(template),
      id:'CS8'+String(index).padStart(3,'0'),
      name:'用户体验调研 '+(index-5),
      type:'custom',
      goal:null,
      status:index%10===0?'草稿':index%13===0?'停用':'已发布',
      start:'2026-10-01',
      end:'2027-12-31',
      audience:['all','new','paid','group'][index%4],
      group:index%4===3?'已记录饮食用户':null,
      limit:2,
      version:1+(index%3),
      rewardMode:'fixed',
      reward:[{type:'coupon',couponId:data.templates[index%data.templates.length].id,probability:100}],
      resultText:'感谢参与，优惠券已放入用户优惠券。',
      questions:[
        {id:'q1-'+index,text:'本次体验最满意哪一点？',type:'single',options:[{text:'食材新鲜'},{text:'口味合适'},{text:'配送准时'}]},
        {id:'q2-'+index,text:'希望我们继续优化什么？',type:'multi',options:[{text:'菜品丰富度'},{text:'配送时段'},{text:'价格'},{text:'售后响应'}]}
      ],
      revision:1
    };
    data.surveys.push(survey);
  }
  let goalIndex=0;
  while(data.surveys.filter(item=>item.type==='goal').length<36){
    const source=data.surveys.find(item=>item.type==='goal');
    const goal=['健康饮食','减重','增肌','减脂'][goalIndex%4];
    data.surveys.push({
      ...clone(source),
      id:'GS8'+String(goalIndex+1).padStart(3,'0'),
      name:goal+'目标问卷 · 历史版本 '+(goalIndex+1),
      type:'goal',
      goal,
      status:goalIndex%8===0?'已发布':'停用',
      version:1+goalIndex%4,
      questions:clone(source.questions||[]),
      reward:[],
      limit:0,
      audience:'all',
      revision:1
    });
    goalIndex+=1;
  }
  let customIndex=0;
  while(data.surveys.filter(item=>item.type==='custom').length<36){
    const source=data.surveys.find(item=>item.type==='custom');
    data.surveys.push({
      ...clone(source),
      id:'CS8H'+String(customIndex+1).padStart(3,'0'),
      name:'运营体验回访问卷 '+(customIndex+1),
      type:'custom',
      status:customIndex%9===0?'已发布':customIndex%5===0?'草稿':'停用',
      start:'2026-10-01',
      end:'2027-12-31',
      audience:'all',
      limit:1,
      version:1,
      revision:1
    });
    customIndex+=1;
  }
  data.answers=[];
  data.users.forEach((user,index)=>{
    const survey=data.surveys.filter(item=>item.status==='已发布')[index%data.surveys.filter(item=>item.status==='已发布').length];
    if(!survey)return;
    const answers={};
    survey.questions.forEach((question,qIndex)=>{
      answers[question.id]=question.type==='multi'?[qIndex%question.options.length]:0;
    });
    data.answers.push({
      id:'A8'+String(index+1).padStart(3,'0'),
      runId:'RUN8'+String(index+1).padStart(3,'0'),
      surveyId:survey.id,
      survey:survey.name,
      userId:user.id,
      user:user.name,
      version:survey.version,
      time:dayOffset(-(index%20)),
      answers,
      questions:clone(survey.questions),
      reward:null
    });
  });

  while(data.foods.length<36){
    const index=data.foods.length;
    data.foods.push({
      id:'F8'+String(index+1).padStart(3,'0'),
      name:['南瓜鸡肉能量碗','番茄牛肉糙米饭','芝麻菠菜沙拉','虾仁豆腐蒸蛋','紫薯燕麦杯','菌菇豆腐汤','香煎鳕鱼时蔬','低脂鸡肉卷','藜麦水果沙拉','桂花山药泥'][index-26],
      cat:['套餐菜品','主食','蔬菜','肉蛋奶','水果'][index%5],
      kcal:120+index*3,carb:12+index%18,protein:8+index%13,fat:3+index%7,fiber:2+index%4,
      na:80+index,k:180+index*2,ca:20+index,fe:0.5+index%3,zn:0.3+index%2,
      units:[['份',180+index%120]],idAlias:'',alias:'',status:index%14===0?'停用':'启用',source:'品牌菜单',barcode:index%9===0?'69000002'+String(1000+index):''
    });
  }
  data.menu=data.foods.slice(0,36).map((food,index)=>({
    id:'MN8'+String(index+1).padStart(3,'0'),
    brand:data.brands[index%data.brands.length].name,
    name:food.name,
    spec:(180+index%120)+'g',
    grams:180+index%120,
    kcal:food.kcal,carb:food.carb,protein:food.protein,fat:food.fat,fiber:food.fiber,
    done:index%7!==0,
    foodId:food.id
  }));
  data.barcodeQueue=Array.from({length:36},(_,index)=>({
    id:'BQ8'+String(index+1).padStart(3,'0'),
    code:'6901000'+String(100000+index),
    userId:data.users[index%data.users.length].id,
    status:index%8===0?'已补录':'待补录',
    name:'条码待补录食物 '+(index+1)
  }));
  data.foodSubmissions=Array.from({length:36},(_,index)=>({
    id:'FS8'+String(index+1).padStart(3,'0'),
    name:'用户补录食物 '+(index+1),
    userId:data.users[index%data.users.length].id,
    kcal:120+index*4,
    status:index%7===0?'已通过':index%9===0?'已驳回':'待审核',
    snapshot:{
      id:'FS8'+String(index+1).padStart(3,'0'),
      date:dateKey(now-index*86400000),
      meal:'午餐',
      grams:180+index,
      pending:false,
      name:'用户补录食物 '+(index+1),
      kcal:120+index*4,
      carb:20+index%15,protein:10+index%12,fat:4+index%6,fiber:2+index%5
    }
  }));

  data.issues=[];
  const issueWallets=data.users.flatMap(user=>user.wallet.map(wallet=>({user,wallet}))).filter(item=>item.wallet.source==='后台下发');
  for(let index=0;index<34;index++){
    const item=issueWallets[index%Math.max(1,issueWallets.length)];
    if(!item)break;
    data.issues.push({
      id:'ISSUE8'+String(index+1).padStart(3,'0'),
      templateId:item.wallet.templateId,
      users:[item.user.id],
      source:'后台下发',
      note:'r8 运营发放记录 '+(index+1),
      scheduledAt:null,
      status:'已完成',
      createdAt:dayOffset(-(index%25)),
      executedAt:dayOffset(-(index%25)),
      results:[{userId:item.user.id,ok:true,walletId:item.wallet.id}]
    });
  }
  for(let index=0;index<2;index++){
    const user=data.users[index];
    data.issues.push({
      id:'ISSUE8S'+String(index+1).padStart(2,'0'),
      templateId:data.templates.filter(item=>item.status==='启用')[index].id,
      users:[user.id],
      source:'后台下发',
      note:'定时发放 · 次日执行',
      scheduledAt:dayOffset(1+index),
      status:'待执行',
      createdAt:dayOffset(-1),
      results:[]
    });
  }

  data.review=[];
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
