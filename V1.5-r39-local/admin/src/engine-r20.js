// V1.5-r20 check-in activity engine. All writes continue through Store.action.
(()=>{
  const E=window.__DUYA_LOCAL_ENGINE;
  if(!E)return;
  const P=E.Store.prototype;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const ok=(condition,message)=>{if(!condition)throw Error(message);};
  const dateKey=E.dateKey||window.dateKey;
  const unique=rows=>[...new Set(rows.filter(Boolean))].sort();
  const dayTime=day=>Date.parse(day+'T08:00:00+08:00');
  const nowIso=store=>new Date(store.now()).toISOString();

  function migrateCheckins(user){
    user.checkins=unique(Array.isArray(user.checkins)?user.checkins:[]);
    const events=Array.isArray(user.checkinEvents)?user.checkinEvents.slice():[];
    const byDate=new Map();
    for(const event of events){
      if(!event?.date||!event?.at)continue;
      if(!byDate.has(event.date))byDate.set(event.date,event);
    }
    for(const day of user.checkins){
      if(!byDate.has(day))byDate.set(day,{date:day,at:day+'T08:00:00+08:00',legacy:true});
    }
    for(const event of byDate.values()){
      if(!user.checkins.includes(event.date)&&event.date<=dateKey(Date.now()))user.checkins.push(event.date);
    }
    user.checkins=unique(user.checkins);
    user.checkinEvents=[...byDate.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    user.checkinProgress=user.checkinProgress||{};
    return user;
  }

  function migrate(data){
    data.checkinActivities=Array.isArray(data.checkinActivities)?data.checkinActivities:[];
    data.featuredCheckinActivityId=data.featuredCheckinActivityId||null;
    for(const user of data.users||[])migrateCheckins(user);
    return data;
  }

  function activityStatus(activity,day=dateKey(Date.now())){
    if(activity.status!=='启用')return '已停用';
    if(activity.start&&day<activity.start)return '未开始';
    if(activity.end&&day>activity.end)return '已过期';
    return '进行中';
  }

  function scopedEntries(store,activity,user){
    const begin=activity.start||'0000-01-01',end=activity.end||'9999-12-31';
    const today=dateKey(store.now());
    if(activity.includeBefore){
      return unique((user.checkins||[]).filter(day=>day>=begin&&day<=end&&day<=today))
        .map(day=>({date:day,at:dayTime(day),legacy:true}));
    }
    const published=Date.parse(activity.publishedAt||activity.activatedAt||0);
    const byDate=new Map();
    for(const event of user.checkinEvents||[]){
      if(!event?.date||event.date<begin||event.date>end||event.date>today)continue;
      if(!Number.isFinite(published)||Date.parse(event.at)<published)continue;
      const current=byDate.get(event.date);
      if(!current||Date.parse(event.at)<Date.parse(current.at))byDate.set(event.date,event);
    }
    return [...byDate.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  }

  function activitySnapshot(store,activity,user){
    const entries=scopedEntries(store,activity,user),target=Math.max(1,Number(activity.targetDays)||1);
    const qualified=entries.length>=target;
    return {
      entries,
      count:entries.length,
      target,
      qualified,
      qualifiedAt:qualified?entries[target-1].at:null
    };
  }

  P.settleCheckinActivities=function(userId){
    const d=this.data;
    migrate(d);
    const users=d.users.slice(),today=dateKey(this.now());
    for(const activity of d.checkinActivities){
      if(activity.status!=='启用')continue;
      const candidates=[];
      for(const user of users){
        const progress=user.checkinProgress[activity.id]||(user.checkinProgress[activity.id]={activityId:activity.id,joinedAt:null,checkinDays:0,targetDays:Number(activity.targetDays)||1,status:'未参与',qualifiedAt:null,wonAt:null,rewardEventKey:null,reason:''});
        const snapshot=activitySnapshot(this,activity,user);
        progress.checkinDays=snapshot.count;
        progress.targetDays=snapshot.target;
        progress.lastCheckinAt=snapshot.entries.at(-1)?.at||null;
        progress.periodStart=activity.start||'';
        progress.periodEnd=activity.end||'';
        if(snapshot.count>0&&!progress.joinedAt)progress.joinedAt=snapshot.entries[0].at;
        if(progress.status!=='已获奖'&&snapshot.qualified)candidates.push({user,progress,snapshot});
      }
      candidates.sort((a,b)=>Date.parse(a.snapshot.qualifiedAt)-Date.parse(b.snapshot.qualifiedAt)||a.user.id.localeCompare(b.user.id));
      let winners=users.filter(user=>user.checkinProgress?.[activity.id]?.status==='已获奖').length;
      const limit=Math.max(0,Number(activity.limit)||0);
      for(const candidate of candidates){
        const {user,progress,snapshot}=candidate;
        if(progress.status==='已获奖')continue;
        progress.qualifiedAt=snapshot.qualifiedAt;
        if(limit&&winners>=limit){
          progress.status='已达未获奖';
          progress.reason='活动获奖名额已满，按达标先后排序';
          continue;
        }
        progress.status='已获奖';
        progress.wonAt=nowIso(this);
        progress.reason='';
        winners++;
        if(activity.rewards?.length){
          const key='checkin-activity-'+activity.id+'-'+user.id;
          const reward=this.award(user,activity.rewards,activity.rewardMode||'fixed',key,'连续打卡奖励 · '+activity.name);
          progress.rewardEventKey=key;
          progress.rewardName=reward?.name||activity.name+'奖励';
          progress.rewardStatus=reward?.status||'';
        }
      }
      for(const user of users){
        const progress=user.checkinProgress[activity.id];
        if(!progress||progress.status==='已获奖'||progress.status==='已达未获奖')continue;
        progress.status=progress.checkinDays>0?'进行中':today<activity.start?'未开始':today>activity.end?'已过期':'未参与';
      }
    }
    return userId?this.data.users.find(user=>user.id===userId)?.checkinProgress:null;
  };

  function saveCheckinActivity(record){
    ok(record&&typeof record==='object','打卡活动内容无效');
    const list=this.data.checkinActivities=this.data.checkinActivities||[];
    const existing=list.find(item=>item.id===record.id);
    if(record.expectedRevision!=null&&existing)ok(record.expectedRevision===(existing.revision||1),'打卡活动已被其他窗口修改，请重新打开');
    const x={...existing,...clone(record)};
    delete x.expectedRevision;
    x.id=x.id||'CA'+this.now()+Math.random().toString(36).slice(2,6);
    x.name=String(x.name||'').trim();
    x.desc=String(x.desc||'').trim();
    ok(x.name,'请填写活动名称');
    ok(x.desc,'请填写活动简介');
    x.start=String(x.start||'').trim();
    x.end=String(x.end||'').trim();
    ok(/^\d{4}-\d{2}-\d{2}$/.test(x.start)&&/^\d{4}-\d{2}-\d{2}$/.test(x.end)&&x.start<=x.end,'活动起止日期无效');
    x.targetDays=Number(x.targetDays);
    ok(Number.isInteger(x.targetDays)&&x.targetDays>0,'累计达标天数须为正整数');
    x.limit=Number(x.limit||0);
    ok(Number.isInteger(x.limit)&&x.limit>=0,'获奖人数上限须为非负整数');
    x.status=x.status==='停用'?'停用':'启用';
    x.includeBefore=Boolean(x.includeBefore);
    x.rewardMode=x.rewardMode==='probability'?'probability':'fixed';
    x.rewards=clone(x.rewards||[]);
    this.validRewards(x.rewards,x.rewardMode);
    x.updatedAt=nowIso(this);
    x.revision=(existing?.revision||0)+1;
    const wasEnabled=existing?.status==='启用';
    if(x.status==='启用'&&(!wasEnabled||!x.publishedAt))x.publishedAt=nowIso(this);
    if(x.status==='停用'&&!existing?.publishedAt)x.publishedAt=null;
    if(existing)Object.assign(existing,x);else list.push(x);
    if(x.status==='停用')this.data.featuredCheckinActivityId=this.data.featuredCheckinActivityId===x.id?null:this.data.featuredCheckinActivityId;
    if(x.end<dateKey(this.now())&&this.data.featuredCheckinActivityId===x.id)this.data.featuredCheckinActivityId=null;
    this.settleCheckinActivities();
    return x;
  }

  P.saveCheckinActivity=saveCheckinActivity;
  const run=P.run;
  P.run=function(type,user,payload={}){
    if(type==='CHECKIN'){
      const result=run.call(this,type,user,payload);
      const owner=this.user(user),day=dateKey(this.now()),at=nowIso(this);
      migrateCheckins(owner);
      const event=owner.checkinEvents.find(item=>item.date===day);
      if(event)event.at=at;
      else owner.checkinEvents.push({date:day,at});
      if(!owner.checkins.includes(day))owner.checkins.push(day);
      owner.checkins=unique(owner.checkins);
      owner.checkinEvents.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
      this.settleCheckinActivities(user);
      return {...result,checkinDate:day};
    }
    if(type==='ADMIN_SAVE'&&payload.entity==='checkinActivity'){
      ok(user==='admin','仅管理员可操作打卡活动');
      return saveCheckinActivity.call(this,payload.record);
    }
    if(type==='ADMIN_FEATURE_CHECKIN'){
      ok(user==='admin','仅管理员可设置首页活动');
      const activity=this.data.checkinActivities.find(item=>item.id===payload.id);
      ok(activity,'打卡活动不存在');
      ok(activity.status==='启用','停用活动不能设为首页');
      ok(activity.end>=dateKey(this.now()),'已结束活动不能设为首页');
      this.data.featuredCheckinActivityId=activity.id;
      return activity;
    }
    if(type==='ADMIN_SETTLE_CHECKINS'){
      ok(user==='admin','仅管理员可重新结算');
      this.settleCheckinActivities();
      return {ok:true};
    }
    return run.call(this,type,user,payload);
  };

  window.R20Data={migrate,migrateCheckins,activityStatus,activitySnapshot,scopedEntries};
})();
