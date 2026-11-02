// V1.5-r31 shared mini-program visual settings and backend contract.
(()=>{
  const E=window.__DUYA_LOCAL_ENGINE;
  if(!E)return;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const blank=()=>({dataUrl:null,updatedAt:null});
  const imageKeys=['sharePoster','invitePoster','postPaymentServiceImage'];
  const defaults={
    cutoff:'17:30',
    deliverySlots:[{time:'11:30',meals:['午餐','晚餐']},{time:'17:30',meals:['午餐','晚餐']}],
    pauseLimits:{week:1,month:3,quarter:6,year:12},
    servicePhone:'400-118-2026',
    serviceWechat:'raven-life-2026',
    serviceHours:'周一至周日 09:00-20:00',
    refundWechatId:'raven-life-2026',
    refundPhone:'400-118-2026',
    refundQr:'',
    loginBg:'assets/article-balanced-hydration.jpg'
  };
  function normalizeImage(value){
    if(typeof value==='string')return {dataUrl:value||null,updatedAt:null};
    return {...blank(),...(value||{})};
  }
  function migrate(data){
    const settings=data.settings=data.settings||{};
    const rules=settings.appRules=settings.appRules||{};
    for(const [key,value]of Object.entries(defaults)){
      if(rules[key]==null)rules[key]=clone(value);
    }
    for(const key of imageKeys)rules[key]=normalizeImage(rules[key]);
    return data;
  }
  function validateImage(value,label){
    if(!value?.dataUrl)return;
    if(!/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value.dataUrl))throw Error(label+'格式无效');
    const bytes=Math.ceil((value.dataUrl.split(',')[1]?.length||0)*0.75);
    if(bytes>2*1024*1024)throw Error(label+'不能超过 2 MB');
  }
  if(E.Store?.prototype){
    const P=E.Store.prototype;
    const run=P.run;
    P.run=function(type,user,payload={}){
      if(type!=='ADMIN_SAVE_APP_RULES')return run.call(this,type,user,payload);
      if(user!=='admin')throw Error('仅管理员可修改小程序设置');
      const rules=payload.appRules;
      if(!rules||typeof rules!=='object')throw Error('小程序设置内容无效');
      if(payload.bindWindowDays!=null){
        const days=Number(payload.bindWindowDays);
        if(!Number.isInteger(days)||days<1||days>365)throw Error('补填邀请码天数须为1至365的整数');
        this.data.settings.bindWindowDays=days;
      }
      for(const key of imageKeys)validateImage(rules[key],{sharePoster:'分享海报',invitePoster:'邀请海报',postPaymentServiceImage:'付款后客服图片'}[key]);
      const current=this.data.settings.appRules||{};
      const next=this.data.settings.appRules={...clone(current),...clone(rules)};
      for(const key of imageKeys)next[key]=normalizeImage(next[key]);
      next.updatedAt=new Date(this.now()).toISOString();
      return clone(next);
    };
  }
  window.R31Data={migrate,defaults,imageKeys,normalizeImage,validateImage};
})();
