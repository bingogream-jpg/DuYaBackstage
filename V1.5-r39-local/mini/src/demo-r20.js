// V1.5-r20 activity catalogue and historical settlement demonstration.
window.__g20Demo=function(data,now){
  const copy=value=>JSON.parse(JSON.stringify(value));
  data=window.R20Data.migrate(copy(data));
  const templates=(data.templates||[]).filter(item=>item.status==='启用');
  const fallback=templates[0];
  const reward=(index)=>{
    if(index%9===7)return {type:'meal',count:index%2?2:1,probability:100};
    if(index%9===8)return {type:'custom',name:index%2?'轻食搭配手册':'健康饮食贴纸',probability:100};
    const coupon=templates[index%Math.max(1,templates.length)]||fallback;
    return {type:'coupon',couponId:coupon?.id||'',probability:100};
  };
  const titles=[
    '秋日轻食打卡季','工作日健康餐打卡','连续七日轻盈计划','周末元气打卡',
    '午餐均衡挑战','晚餐轻负担计划','早餐认真吃打卡','蔬果彩虹挑战',
    '好水好状态打卡','规律吃饭七日礼','轻食探索家','秋日暖胃计划',
    '通勤健康餐打卡','午间活力挑战','晚餐七分饱计划','一周三餐规律礼',
    '四季食桌打卡','轻盈星期三','健康领餐人','细嚼慢咽体验周',
    '新鲜蔬果周','低负担晚餐季','元气早餐月','周末自律挑战',
    '城市轻食地图','选对一餐计划','每日一份好心情','健康习惯养成季',
    '上班族午餐打卡','晚餐早一点计划','饮食记录习惯周','健康餐连续挑战',
    '换季营养打卡','轻食新客体验周','金秋丰收餐桌','年度坚持者活动'
  ];
  const descriptions=[
    '累计完成打卡即可获得活动奖励，名额有限，先达标先得。',
    '记录每天的一餐，让稳定的小习惯累积成看得见的改变。',
    '从一餐开始建立节奏，达标后奖励自动进入用户券包。',
    '面向全部用户的日常健康打卡活动，按活动期累计天数结算。'
  ];
  data.checkinActivities=titles.map((name,index)=>{
    const id='CA20-'+String(index+1).padStart(2,'0');
    let start='2026-09-01',end='2026-12-31',status='启用',includeBefore=index<3;
    if(index===3){start='2027-01-05';end='2027-01-31';}
    else if(index>=4&&index<=15){start='2026-06-01';end='2026-08-31';}
    else if(index>=16&&index<=23){start='2026-09-15';end='2026-11-30';}
    else if(index>=24){start='2026-09-01';end='2027-03-31';}
    if(index%7===5)status='停用';
    const publishedAt=index===3?null:new Date(now-(index<3?35:index%2?16:8)*86400000).toISOString();
    return {
      id,name,desc:descriptions[index%descriptions.length],start,end,
      targetDays:[3,5,7,10,15][index%5],limit:index<3?(index===1?2:0):0,
      includeBefore,status,publishedAt,createdAt:new Date(now-60*86400000).toISOString(),
      updatedAt:new Date(now-2*86400000).toISOString(),rewardMode:'fixed',rewards:[reward(index)],
      revision:1,demo:true
    };
  });
  data.featuredCheckinActivityId='CA20-01';
  const store=new window.__DUYA_LOCAL_ENGINE.Store({initial:data,now:()=>now});
  store.settleCheckinActivities();
  store.data.revision=1;
  store.data.now=new Date(now).toISOString();
  return store.data;
};
