// V1.5-r20 activity management, activity records and check-in statistics.
(()=>{
  const C=window.__g8Core;
  if(!C)return;
  const data=()=>window.R3?.state;
  const ae=C.ae;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const btn=(text,action,attrs='',cls='secondary small')=>C.ab(text,action,attrs,cls);
  const today=()=>data()?.now?.slice(0,10)||window.__DUYA_LOCAL_ENGINE.dateKey(Date.now());
  const month=()=>today().slice(0,7);
  const unique=rows=>[...new Set(rows)];
  const sum=(rows,fn)=>rows.reduce((total,row)=>total+Number(fn(row)||0),0);

  const ui={
    activities:{keyword:'',status:'',page:1,size:10},
    records:{view:'participation',keyword:'',activityId:'',userId:'',status:'',from:'',to:'',page:1,size:10},
    users:{keyword:'',page:1,size:10}
  };
  C.g6Tabs.activityRecords=C.g6Tabs.activityRecords||'participation';

  let growthGroup=navGroups.find(group=>group.label==='增长运营');
  if(growthGroup)growthGroup.items=growthGroup.items.filter(([page])=>page!=='user-growth');
  let activityGroup=navGroups.find(group=>group.label==='活动管理');
  if(!activityGroup){
    activityGroup={label:'活动管理',items:[]};
    const growthIndex=navGroups.findIndex(group=>group.label==='增长运营');
    navGroups.splice(growthIndex>=0?growthIndex+1:Math.max(0,navGroups.length-2),0,activityGroup);
  }
  activityGroup.items=[
    ['user-growth','trend','用户成长活动'],
    ['checkin-activities','calendar','打卡活动'],
    ['activity-records','record','活动记录']
  ];
  if(growthGroup&&!growthGroup.items.some(([page])=>page==='checkin-users'))growthGroup.items.push(['checkin-users','users','用户打卡管理']);
  Object.assign(pageMeta,{
    'user-growth':['活动管理','用户成长活动'],
    'user-growth-form':['活动管理','编辑用户成长活动'],
    'checkin-activities':['活动管理','打卡活动'],
    'activity-records':['活动管理','活动记录'],
    'checkin-users':['增长运营','用户打卡管理'],
    'checkin-activity-form':['活动管理','编辑打卡活动']
  });

  const shellBase=renderShell;
  renderShell=function(){
    const result=shellBase.apply(this,arguments);
    const parents={'user-growth-form':'user-growth'};
    const parent=parents[state.page];
    if(parent)document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.page===parent));
    return result;
  };

  function rewardText(activity){
    return (activity.rewards||[]).map(reward=>{
      if(reward.type==='coupon')return data().templates.find(template=>template.id===reward.couponId)?.name||'优惠券';
      if(reward.type==='meal')return '赠餐 '+Number(reward.count||1)+' 餐';
      return reward.name||'自定义奖励';
    }).join('、')||'未配置';
  }

  function activityCode(activity){
    return window.R20Data?.activityStatus(activity,today())||'已停用';
  }

  function userStats(user){
    const dates=unique(user.checkins||[]).sort();
    const set=new Set(dates);
    let cursor=today();
    if(!set.has(cursor)){
      const previous=new Date(cursor+'T12:00:00+08:00');
      previous.setUTCDate(previous.getUTCDate()-1);
      cursor=previous.toISOString().slice(0,10);
    }
    let streak=0;
    while(set.has(cursor)){
      streak++;
      const previous=new Date(cursor+'T12:00:00+08:00');
      previous.setUTCDate(previous.getUTCDate()-1);
      cursor=previous.toISOString().slice(0,10);
    }
    const monthDays=dates.filter(day=>day.startsWith(month())).length;
    const progress=Object.values(user.checkinProgress||{});
    return {
      dates,
      streak,
      monthDays,
      total:dates.length,
      last:dates.at(-1)||'',
      participated:progress.filter(item=>Number(item.checkinDays)>0).length,
      qualified:progress.filter(item=>Number(item.checkinDays)>=Number(item.targetDays||0)).length,
      awarded:progress.filter(item=>item.status==='已获奖').length
    };
  }

  function pager(prefix,total,page,size){
    const pages=Math.max(1,Math.ceil(total/Number(size||10)));
    const current=Math.min(Math.max(1,Number(page)||1),pages);
    const numbers=new Set([1,pages,current-1,current,current+1]);
    const links=[...numbers].filter(value=>value>=1&&value<=pages).sort((a,b)=>a-b);
    let previous=0;
    const numbered=links.map(value=>{
      const gap=value-previous>1?'<span class="g20-page-gap">…</span>':'';
      previous=value;
      return gap+'<button type="button" class="g20-page-button '+(value===current?'active':'')+'" data-action="'+prefix+'-page" data-page="'+value+'">'+value+'</button>';
    }).join('');
    return '<div class="g20-pager"><span>共 '+total+' 条 · 第 '+current+' / '+pages+' 页</span><div class="g20-page-buttons"><button type="button" class="g20-page-button" data-action="'+prefix+'-page" data-page="'+Math.max(1,current-1)+'" '+(current===1?'disabled':'')+'>上一页</button>'+numbered+'<button type="button" class="g20-page-button" data-action="'+prefix+'-page" data-page="'+Math.min(pages,current+1)+'" '+(current===pages?'disabled':'')+'>下一页</button></div><label>每页<select data-g20-size="'+prefix+'">'+[10,20,30].map(value=>'<option value="'+value+'" '+(Number(size)===value?'selected':'')+'>'+value+' 条</option>').join('')+'</select></label><label>跳至<input type="number" min="1" max="'+pages+'" value="'+current+'" data-g20-jump="'+prefix+'">页</label><button type="button" class="button secondary small" data-action="'+prefix+'-jump">跳转</button></div>';
  }

  function activityRows(){
    const keyword=ui.activities.keyword.trim().toLowerCase(),status=ui.activities.status;
    return (data().checkinActivities||[]).filter(activity=>{
      if(keyword&&![activity.name,activity.desc,activity.id].join(' ').toLowerCase().includes(keyword))return false;
      return !status||activityCode(activity)===status;
    }).map(activity=>{
      const progress=data().users.flatMap(user=>Object.values(user.checkinProgress||{})).filter(item=>item.activityId===activity.id);
      return {
        activity,
        participated:progress.filter(item=>Number(item.checkinDays)>0).length,
        qualified:progress.filter(item=>Number(item.checkinDays)>=Number(item.targetDays||0)).length,
        awarded:progress.filter(item=>item.status==='已获奖').length
      };
    });
  }

  function activityTable(rows,page,size){
    return C.atable(['活动名称','简介','活动时间','达标条件','活动奖励','获奖上限 / 统计范围','已完成用户数量','操作'],rows.slice((page-1)*size,page*size).map(({activity})=>{
      const count=window.R21Data.completed(window.__DUYA_LOCAL__.store).filter(r=>r.activity.activityType==='checkin'&&r.activity.id===activity.id).length;
      const types=[...new Set((activity.rewards||[]).map(r=>({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[r.type]||'自定义奖励')))];
      return ['<b>'+ae(activity.name)+'</b><small>'+(data().featuredCheckinActivityId===activity.id?C.badge('首页展示'):'')+'</small>',ae(activity.desc)+'<small>'+ (activity.publishedAt?C.dateTime(activity.publishedAt):'尚未发布')+'</small>',ae(activity.start+' 至 '+activity.end)+'<small>'+C.badge(activityCode(activity))+'</small>','累计打卡 ≥ '+activity.targetDays+' 天','<small>'+ae(types.join(' / '))+'</small>'+ae(rewardText(activity)),(Number(activity.limit)===0?'不限':Number(activity.limit)+' 人')+'<small>'+(activity.includeBefore?'包含发布前数据':'仅统计发布后')+'</small>','<button class="cell-link g19-metric-link" data-action="g21-checkin-completed" data-id="'+activity.id+'">'+count+'</button>','<div class="table-actions">'+btn('编辑','g20-activity-edit','data-id="'+activity.id+'"')+btn(activity.status==='启用'?'停用':'启用','g20-activity-toggle','data-id="'+activity.id+'"')+btn('设为首页','g20-activity-feature','data-id="'+activity.id+'"')+btn('活动记录','g20-activity-records','data-id="'+activity.id+'"')+'</div>'];
    }));
  }

  C.V15_PAGES['checkin-activities']=function(){
    const rows=activityRows(),size=Number(ui.activities.size),page=Math.min(ui.activities.page,Math.max(1,Math.ceil(rows.length/size)));
    ui.activities.page=page;
    const enabled=(data().checkinActivities||[]).filter(activity=>activity.status==='启用');
    return C.ar3Head('打卡活动','配置累计打卡奖励、获奖名额和首页展示活动；活动奖励自动进入统一奖励记录。','')+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>活动总数</span><strong>'+(data().checkinActivities||[]).length+'</strong></div><div><span>进行中</span><strong>'+enabled.filter(item=>activityCode(item)==='进行中').length+'</strong></div><div><span>首页活动</span><strong>'+((data().checkinActivities||[]).find(item=>item.id===data().featuredCheckinActivityId)?.name||'未设置')+'</strong></div><div><span>累计获奖</span><strong>'+data().users.flatMap(user=>Object.values(user.checkinProgress||{})).filter(item=>item.status==='已获奖').length+'</strong></div></div>'+
      '<section class="r3-card"><div class="g20-table-toolbar"><div class="g20-table-actions"><button type="button" class="button primary small" data-action="g20-activity-new">新建打卡活动</button><button type="button" class="button secondary small" data-action="g20-activity-export">导出</button></div><div class="g20-filter-row"><label>关键词<input name="g20ActivityKeyword" value="'+ae(ui.activities.keyword)+'" placeholder="活动名称 / 简介"></label><label>活动状态<select name="g20ActivityStatus"><option value="">全部状态</option>'+['进行中','未开始','已过期','已停用'].map(value=>'<option '+(ui.activities.status===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label><button type="button" class="button primary small" data-action="g20-activity-find">查找</button><button type="button" class="button secondary small" data-action="g20-activity-reset">重置</button></div></div>'+
      (rows.length?activityTable(rows,page,size):'<p class="r3-empty">当前筛选没有打卡活动。新建活动后即可在小程序展示。</p>')+
      pager('g20-activity',rows.length,page,size)+'</section></section>';
  };

  function rewardRow(reward={type:'coupon',couponId:'',probability:100},index=0,mode='fixed'){
    const type=reward.type||'coupon';
    const coupons=(data().templates||[]).filter(template=>template.status==='启用');
    const selectedCoupon=coupons.find(template=>template.id===reward.couponId)||coupons[0];
    return '<article class="g20-reward-tier r3-reward-row" data-g20-reward>'+
      '<header><b>奖励档位 '+(index+1)+'</b><span>'+({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[type]||'优惠券')+'</span><button type="button" class="button secondary small" data-action="g20-remove-reward">删除</button></header>'+
      '<div class="g20-reward-grid"><label class="r3-field"><span>奖励类型</span><select data-g20-field="type">'+[['coupon','优惠券'],['meal','赠餐'],['custom','自定义奖励']].map(([value,label])=>'<option value="'+value+'" '+(type===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+
      '<label class="r3-field" data-g20-panel="coupon" '+(type==='coupon'?'':'hidden')+'><span>具体优惠券</span><select name="g20-coupon-'+index+'-couponId" data-g20-field="couponId">'+coupons.map(coupon=>'<option value="'+coupon.id+'" '+(selectedCoupon?.id===coupon.id?'selected':'')+'>'+ae(coupon.name)+' · ¥'+coupon.amount+'</option>').join('')+'</select></label>'+
      '<label class="r3-field" data-g20-panel="meal" '+(type==='meal'?'':'hidden')+'><span>赠餐数量</span><input data-g20-field="count" type="number" min="1" value="'+ae(reward.count||1)+'"></label>'+
      '<label class="r3-field" data-g20-panel="custom" '+(type==='custom'?'':'hidden')+'><span>奖励名称</span><input data-g20-field="name" value="'+ae(reward.name||'')+'" placeholder="例如：健康食谱手册"></label>'+
      '<label class="r3-field" data-g20-probability '+(mode==='probability'?'':'hidden')+'><span>概率（%）</span><input data-g20-field="probability" type="number" min="0" max="100" value="'+ae(reward.probability??100)+'"></label></div></article>';
  }

  function refreshRewardForm(scope=document){
    const form=scope.querySelector?.('#g20-checkin-form')||scope.closest?.('#g20-checkin-form');
    if(!form)return;
    const mode=form.querySelector('[name="rewardMode"]')?.value||'fixed';
    form.querySelectorAll('[data-g20-reward]').forEach((row,index)=>{
      const type=row.querySelector('[data-g20-field="type"]')?.value||'coupon';
      row.querySelectorAll('[data-g20-panel]').forEach(panel=>panel.hidden=panel.dataset.g20Panel!==type);
      row.querySelectorAll('[data-g20-probability]').forEach(panel=>{
        panel.hidden=mode!=='probability';
        panel.querySelector('input').disabled=mode!=='probability';
      });
      row.hidden=mode==='fixed'&&index>0;
      row.querySelector('header span').textContent=({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[type]||'优惠券');
    });
    const total=sum([...form.querySelectorAll('[data-g20-reward]')].filter(row=>!row.hidden),row=>row.querySelector('[data-g20-field="probability"]')?.value);
    const meter=form.querySelector('[data-g20-probability-total]');
    if(meter){
      meter.hidden=mode!=='probability';
      meter.textContent='概率合计 '+total+'%'+(Math.abs(total-100)<0.001?' · 可保存':' · 需为 100%');
      meter.className='g20-probability-total '+(Math.abs(total-100)<0.001?'ok':'warn');
    }
    const add=form.querySelector('[data-action="g20-add-reward"]');
    if(add)add.disabled=mode==='fixed';
  }

  let modalDirty=false,activityFormMarkup=null;
  function saveFormDraft(){const form=document.querySelector('#g20-checkin-form');if(!form||!activityFormMarkup)return;const copy=form.cloneNode(true);form.querySelectorAll('input,select,textarea').forEach((field,i)=>{const dest=copy.querySelectorAll('input,select,textarea')[i];if(field.tagName==='SELECT')[...dest.options].forEach(o=>{o.selected=o.value===field.value;o.toggleAttribute('selected',o.selected);});else if(field.tagName==='TEXTAREA')dest.textContent=field.value;else dest.setAttribute('value',field.value);});activityFormMarkup.body=copy.outerHTML;}
  C.V15_PAGES['checkin-activity-form']=()=>{setTimeout(()=>{const form=document.querySelector('#g20-checkin-form');window.G9?.enhanceRewardPickers(form);refreshRewardForm(form);form?.addEventListener('input',()=>{modalDirty=true;refreshRewardForm(form);saveFormDraft();});form?.addEventListener('change',()=>{modalDirty=true;refreshRewardForm(form);saveFormDraft();});},0);return C.ar3Head(activityFormMarkup?.title||'打卡活动','活动保存后才生效，已有奖励和营养快照继续保留。',btn('返回活动列表','g21-activity-back'))+'<section class="r3-card">'+(activityFormMarkup?.body||'')+'<div class="g21-checkin-form-footer">'+btn('取消','g21-activity-back')+btn('保存打卡活动','g20-activity-save','','primary')+'</div></section></section>';};
  C.ar3Action('g21-activity-back',()=>{modalDirty=false;C.navigate('checkin-activities');});
  document.addEventListener('click',ev=>{const target=ev.target.closest('[data-page]');if(!target||!modalDirty||state.page!=='checkin-activity-form')return;ev.preventDefault();ev.stopImmediatePropagation();G6.confirm('放弃未保存的修改',['打卡活动尚未保存，离开后本次修改将丢失。']).then(ok=>{if(ok){modalDirty=false;C.navigate(target.dataset.page);}});},true);
  window.addEventListener('beforeunload',ev=>{if(modalDirty&&state.page==='checkin-activity-form'){ev.preventDefault();ev.returnValue='';}});

  function openActivityForm(activity){
    const value=activity||{
      name:'',desc:'',start:today(),end:'2027-12-31',targetDays:7,limit:0,includeBefore:true,status:'启用',
      rewardMode:'fixed',rewards:[{type:'coupon',couponId:(data().templates||[]).find(item=>item.status==='启用')?.id||'',probability:100}]
    };
    modalDirty=false;
    activityFormMarkup={
      title:(activity?.id?'编辑':'新建')+'打卡活动',
      wide:true,
      body:'<form id="g20-checkin-form" data-id="'+ae(value.id||'')+'" data-revision="'+ae(value.revision||1)+'"><section class="g20-form-section"><h3>活动基础信息</h3><div class="r3-form-grid"><label class="r3-field"><span>活动名称</span><input name="name" value="'+ae(value.name)+'" placeholder="例如：秋日轻食打卡季"></label><label class="r3-field"><span>活动状态</span><select name="status"><option '+(value.status!=='停用'?'selected':'')+'>启用</option><option '+(value.status==='停用'?'selected':'')+'>停用</option></select></label><label class="r3-field"><span>开始日期</span><input name="start" type="date" value="'+ae(value.start)+'"></label><label class="r3-field"><span>结束日期</span><input name="end" type="date" value="'+ae(value.end)+'"></label><label class="r3-field g20-span-2"><span>活动简介</span><textarea name="desc" rows="3" placeholder="说明活动玩法、参与方式和用户可获得的奖励">'+ae(value.desc)+'</textarea></label></div></section><section class="g20-form-section"><h3>参与与结算规则</h3><div class="r3-form-grid"><label class="r3-field"><span>累计打卡达标天数</span><input name="targetDays" type="number" min="1" value="'+ae(value.targetDays)+'"></label><label class="r3-field"><span>获奖人数上限（0 为不限）</span><input name="limit" type="number" min="0" value="'+ae(value.limit||0)+'"></label><label class="r3-field"><span>统计范围</span><select name="includeBefore"><option value="true" '+(value.includeBefore?'selected':'')+'>包含活动发布前的历史打卡</option><option value="false" '+(value.includeBefore?'':'selected')+'>仅统计发布后的新打卡</option></select></label></div><p class="form-hint">每个用户每个活动最多获奖一次。有获奖上限时，按达到目标天数的先后排序，同一时间按用户 ID 稳定排序。</p></section><section class="g20-form-section"><div class="g20-section-head"><div><h3>活动奖励</h3><p>复用增长运营统一奖励类型；固定奖励仅使用一档，概率抽奖需合计 100%。</p></div><button type="button" class="button secondary small" data-action="g20-add-reward">添加奖励档位</button></div><div class="r3-form-grid"><label class="r3-field"><span>发放方式</span><select name="rewardMode"><option value="fixed" '+(value.rewardMode!=='probability'?'selected':'')+'>固定奖励</option><option value="probability" '+(value.rewardMode==='probability'?'selected':'')+'>概率抽奖</option></select></label></div><div class="g20-probability-total" data-g20-probability-total></div><div data-g20-reward-list>'+(value.rewards||[]).map((reward,index)=>rewardRow(reward,index,value.rewardMode||'fixed')).join('')+'</div></section></form>',
      footer:''
    };
    C.navigate('checkin-activity-form');
    setTimeout(()=>{
      const form=document.querySelector('#g20-checkin-form');
      window.G9?.enhanceRewardPickers(form);
      refreshRewardForm(form);
      form?.addEventListener('input',()=>{modalDirty=true;refreshRewardForm(form);});
      form?.addEventListener('change',()=>{modalDirty=true;refreshRewardForm(form);});
    },0);
  }

  C.ar3Action('g20-activity-new',()=>openActivityForm(null));
  C.ar3Action('g20-activity-edit',node=>{
    const activity=data().checkinActivities.find(item=>item.id===node.dataset.id);
    if(activity)openActivityForm(clone(activity));
  });
  C.ar3Action('g20-add-reward',node=>{
    const form=node.closest('form'),list=form?.querySelector('[data-g20-reward-list]');
    if(!form||!list)return;
    if(form.querySelector('[name="rewardMode"]').value==='fixed')throw Error('固定奖励仅保留一个档位');
    const coupon=(data().templates||[]).find(item=>item.status==='启用');
    list.insertAdjacentHTML('beforeend',rewardRow({type:'coupon',couponId:coupon?.id||'',probability:0},list.children.length,'probability'));
    window.G9?.enhanceRewardPickers(list.lastElementChild);
    modalDirty=true;
    refreshRewardForm(form);
    saveFormDraft();
  });
  C.ar3Action('g20-remove-reward',async node=>{
    const row=node.closest('[data-g20-reward]'),form=row?.closest('form');
    if(!row||!form)return;
    if(form.querySelectorAll('[data-g20-reward]').length<=1)throw Error('至少保留一个奖励档位');
    if(!await window.G6.confirm('删除奖励档位',['删除后保存才生效；已经发放的历史奖励不会变化。']))return;
    row.remove();
    modalDirty=true;
    refreshRewardForm(form);
    saveFormDraft();
  });
  C.ar3Action('g20-activity-save',async()=>{
    const form=document.querySelector('#g20-checkin-form');
    if(!form)return;
    const value=name=>form.querySelector('[name="'+name+'"]')?.value||'';
    const mode=value('rewardMode');
    const rewards=[...form.querySelectorAll('[data-g20-reward]')].filter(row=>!row.hidden).map(row=>{
      const type=row.querySelector('[data-g20-field="type"]').value;
      return {
        type,
        ...(type==='coupon'?{couponId:row.querySelector('[data-g20-field="couponId"]').value}:{}),
        ...(type==='meal'?{count:Number(row.querySelector('[data-g20-field="count"]').value)}:{}),
        ...(type==='custom'?{name:row.querySelector('[data-g20-field="name"]').value.trim()}:{}),
        probability:mode==='probability'?Number(row.querySelector('[data-g20-field="probability"]').value):100
      };
    });
    const activityId=form.dataset.id||undefined;
    try{
      await window.R3.cmd('ADMIN_SAVE',{entity:'checkinActivity',record:{
        id:activityId,
        ...(activityId?{expectedRevision:Number(form.dataset.revision)||1}:{}),
        name:value('name'),desc:value('desc'),start:value('start'),end:value('end'),
        targetDays:Number(value('targetDays')),limit:Number(value('limit')||0),
        includeBefore:value('includeBefore')==='true',status:value('status'),
        rewardMode:mode,rewards
      }});
      modalDirty=false;
      C.navigate('checkin-activities');
      window.__g7UI?.toast?.('打卡活动已保存','活动记录和奖励结算已同步');
    }catch(error){
      if(!error.cancelled)window.__g7UI?.toast?.('保存未完成',error.message,'error');
    }
  });
  C.ar3Action('g20-activity-toggle',async node=>{
    const activity=data().checkinActivities.find(item=>item.id===node.dataset.id);
    if(!activity)return;
    try{
      await window.R3.cmd('ADMIN_SAVE',{entity:'checkinActivity',record:{...clone(activity),status:activity.status==='启用'?'停用':'启用',expectedRevision:activity.revision||1}});
      C.renderApp();
    }catch(error){
      if(!error.cancelled)window.__g7UI?.toast?.('操作未完成',error.message,'error');
    }
  });
  C.ar3Action('g20-activity-feature',async node=>{
    try{
      await window.R3.cmd('ADMIN_FEATURE_CHECKIN',{id:node.dataset.id});
      C.renderApp();
      window.__g7UI?.toast?.('首页活动已更新','小程序首页打卡卡下方将展示该活动');
    }catch(error){
      if(!error.cancelled)window.__g7UI?.toast?.('设置未完成',error.message,'error');
    }
  });
  C.ar3Action('g20-activity-records',node=>{
    ui.records.activityId=node.dataset.id;
    ui.records.page=1;
    navToRecords('participation');
  });
  C.ar3Action('g20-activity-find',()=>{
    ui.activities.keyword=document.querySelector('[name="g20ActivityKeyword"]')?.value||'';
    ui.activities.status=document.querySelector('[name="g20ActivityStatus"]')?.value||'';
    ui.activities.page=1;
    C.renderApp();
  });
  C.ar3Action('g20-activity-reset',()=>{
    ui.activities={keyword:'',status:'',page:1,size:ui.activities.size};
    C.renderApp();
  });

  function exportBook(name,headers,rows){
    const sheet=XLSX.utils.aoa_to_sheet([headers,...rows]),book=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,sheet,name);
    window.__r20LastExport={name,headers,rows};
    XLSX.writeFile(book,'渡鸦管家-r22-'+name+'-'+today()+'.xlsx');
  }

  C.ar3Action('g20-activity-export',async()=>{
    const rows=activityRows();
    if(!rows.length)throw Error('当前筛选没有可导出的活动');
    if(!await G6.confirm('导出打卡活动',['全部筛选结果 '+rows.length+' 条，不限当前页。']))return;
    exportBook('打卡活动',['活动名称','活动简介','开始日期','结束日期','达标天数','奖励','获奖上限','统计范围','状态','发布时间','首页活动','已完成用户数量','获奖人数'],
      rows.map(({activity,participated,awarded})=>[activity.name,activity.desc,activity.start,activity.end,activity.targetDays,rewardText(activity),Number(activity.limit)||'不限',activity.includeBefore?'包含发布前':'仅发布后',activityCode(activity),activity.publishedAt||'',data().featuredCheckinActivityId===activity.id?'是':'否',window.R21Data.completed(window.__DUYA_LOCAL__.store).filter(r=>r.activity.activityType==='checkin'&&r.activity.id===activity.id).length,awarded]));
  });

  function participationRows(){
    const rows=[];
    for(const activity of data().checkinActivities||[]){
      for(const user of data().users||[]){
        const snapshot=window.R20Data.activitySnapshot(window.__DUYA_LOCAL__.store,activity,user);
        const progress=user.checkinProgress?.[activity.id]||{};
        let status='未参与';
        if(activity.status==='停用')status='已停用';
        else if(progress.status==='已获奖')status='已获奖';
        else if(progress.status==='已达未获奖')status='已达未获奖';
        else if(today()<activity.start)status='未开始';
        else if(today()>activity.end)status=snapshot.qualified?'已达标':'已过期未达标';
        else if(snapshot.qualified)status='已达标';
        else if(snapshot.count>0)status='进行中';
        const reward=progress.rewardEventKey?data().users.find(owner=>owner.id===user.id)?.rewards.find(event=>event.id===progress.rewardEventKey):null;
        rows.push({activity,user,snapshot,progress,status,reward,lastCheckin:snapshot.entries.at(-1)?.date||''});
      }
    }
    return rows;
  }

  function activitySummaryRows(){
    const users=data().users||[];
    return (data().checkinActivities||[]).map(activity=>{
      const rows=users.map(user=>({user,progress:user.checkinProgress?.[activity.id]||{},snapshot:window.R20Data.activitySnapshot(window.__DUYA_LOCAL__.store,activity,user)}));
      return {
        activity,
        participated:rows.filter(row=>row.snapshot.count>0).length,
        qualified:rows.filter(row=>row.snapshot.qualified).length,
        awarded:rows.filter(row=>row.progress.status==='已获奖').length,
        checks:sum(rows,row=>row.snapshot.count),
        latest:rows.map(row=>row.snapshot.entries.at(-1)?.date).filter(Boolean).sort().at(-1)||''
      };
    });
  }

  function userSummaryRows(){
    return (data().users||[]).map(user=>{
      const progress=(data().checkinActivities||[]).map(activity=>({activity,snapshot:window.R20Data.activitySnapshot(window.__DUYA_LOCAL__.store,activity,user),state:user.checkinProgress?.[activity.id]||{}}));
      const participated=progress.filter(item=>item.snapshot.count>0);
      return {
        user,
        participated:participated.length,
        qualified:participated.filter(item=>item.snapshot.qualified).length,
        awarded:progress.filter(item=>item.state.status==='已获奖').length,
        latest:participated.map(item=>item.snapshot.entries.at(-1)?.date).filter(Boolean).sort().at(-1)||''
      };
    });
  }

  function filteredRecords(){
    const filter=ui.records,keyword=filter.keyword.trim().toLowerCase();
    if(filter.view==='activities'){
      return activitySummaryRows().filter(row=>{
        if(keyword&&![row.activity.name,row.activity.id].join(' ').toLowerCase().includes(keyword))return false;
        if(filter.activityId&&row.activity.id!==filter.activityId)return false;
        if(filter.status&&activityCode(row.activity)!==filter.status)return false;
        if(filter.from&&row.latest&&row.latest<filter.from)return false;
        if(filter.to&&row.latest&&row.latest>filter.to)return false;
        return true;
      });
    }
    if(filter.view==='users'){
      return userSummaryRows().filter(row=>{
        if(keyword&&![row.user.name,row.user.id,row.user.profile?.phone||''].join(' ').toLowerCase().includes(keyword))return false;
        if(filter.userId&&row.user.id!==filter.userId)return false;
        if(filter.from&&row.latest&&row.latest<filter.from)return false;
        if(filter.to&&row.latest&&row.latest>filter.to)return false;
        return true;
      });
    }
    return participationRows().filter(row=>{
      if(keyword&&![row.user.name,row.user.id,row.user.profile?.phone||'',row.activity.name].join(' ').toLowerCase().includes(keyword))return false;
      if(filter.activityId&&row.activity.id!==filter.activityId)return false;
      if(filter.userId&&row.user.id!==filter.userId)return false;
      if(filter.status&&row.status!==filter.status)return false;
      if(filter.from&&row.lastCheckin&&row.lastCheckin<filter.from)return false;
      if(filter.to&&row.lastCheckin&&row.lastCheckin>filter.to)return false;
      return true;
    });
  }

  function recordsTable(rows,page,size){
    const currentRows=rows.slice((page-1)*size,page*size);
    if(ui.records.view==='activities'){
      return C.atable(['活动名称','状态','有效期','参与人数','达标人数','实际获奖','活动期打卡总次数','奖励配置','最近参与'],
        currentRows.map(row=>['<b>'+ae(row.activity.name)+'</b><small>'+ae(row.activity.id)+'</small>',C.badge(activityCode(row.activity)),ae(row.activity.start+' 至 '+row.activity.end),row.participated,row.qualified,row.awarded,row.checks,ae(rewardText(row.activity)),ae(row.latest||'—')]));
    }
    if(ui.records.view==='users'){
      return C.atable(['用户 / ID','手机号','参与活动数','达标活动数','获奖数','最近参与日期','操作'],
        currentRows.map(row=>['<b>'+ae(row.user.name)+'</b><small>'+ae(row.user.id)+'</small>',ae(row.user.profile?.phone||'—'),row.participated,row.qualified,row.awarded,ae(row.latest||'—'),btn('查看打卡详情','g20-checkin-user-detail','data-id="'+row.user.id+'"')]));
    }
    return C.atable(['用户 / ID','手机号','活动名称','统计打卡天数','达标天数','是否参与','达成状态','奖励','获奖时间','最近打卡','操作'],
      currentRows.map(row=>[
        '<b>'+ae(row.user.name)+'</b><small>'+ae(row.user.id)+'</small>',
        ae(row.user.profile?.phone||'—'),
        '<b>'+ae(row.activity.name)+'</b><small>'+ae(row.activity.start+' 至 '+row.activity.end)+'</small>',
        row.snapshot.count,
        row.snapshot.target,
        row.snapshot.count>0?'已参与':'未参与',
        C.badge(row.status)+'<small>'+ae(row.progress.reason||'')+'</small>',
        ae(row.reward?.name||row.progress.rewardName||(row.snapshot.qualified?'待结算':'—'))+'<small>'+ae(row.reward?.status||row.progress.rewardStatus||'')+'</small>',
        ae(row.progress.wonAt?C.dateTime(row.progress.wonAt):'—'),
        ae(row.lastCheckin||'—'),
        btn('详情','g20-record-detail','data-user="'+row.user.id+'" data-activity="'+row.activity.id+'"')
      ]));
  }

  function navToRecords(view){
    C.g6Tabs.activityRecords=view;
    if(state.page!=='activity-records')C.navigate('activity-records');
    else C.renderApp();
  }

  C.V15_PAGES['activity-records']=function(){
    const view=C.g6Tabs.activityRecords||'participation';
    ui.records.view=view;
    const rows=filteredRecords(),size=Number(ui.records.size),page=Math.min(ui.records.page,Math.max(1,Math.ceil(rows.length/size)));
    ui.records.page=page;
    const activities=data().checkinActivities||[],users=data().users||[];
    const statuses=view==='activities'?['进行中','未开始','已过期','已停用']:view==='users'?[]:['已获奖','已达未获奖','已达标','进行中','未参与','已过期未达标','未开始','已停用'];
    return C.ar3Head('活动记录','参与明细从活动配置、用户打卡和奖励事件实时派生，不维护重复参与表。',btn('导出','g20-record-export'))+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>参与明细</span><strong>'+participationRows().length+'</strong></div><div><span>活动数</span><strong>'+activities.length+'</strong></div><div><span>参与用户</span><strong>'+userSummaryRows().filter(row=>row.participated>0).length+'</strong></div><div><span>实际获奖</span><strong>'+data().users.flatMap(user=>Object.values(user.checkinProgress||{})).filter(item=>item.status==='已获奖').length+'</strong></div></div>'+
      C.g6Buttons('activityRecords',[['participation','参与明细'],['activities','活动汇总'],['users','用户汇总']])+
      '<section class="r3-card"><div class="g20-table-toolbar"><div class="g20-table-actions"><button type="button" class="button secondary small" data-action="g20-record-export">导出</button></div><div class="g20-filter-row"><label>关键词<input name="g20RecordKeyword" value="'+ae(ui.records.keyword)+'" placeholder="用户 / 活动 / 手机号"></label><label>活动<select name="g20RecordActivity"><option value="">全部活动</option>'+activities.map(activity=>'<option value="'+activity.id+'" '+(ui.records.activityId===activity.id?'selected':'')+'>'+ae(activity.name)+'</option>').join('')+'</select></label><label>用户<select name="g20RecordUser"><option value="">全部用户</option>'+users.map(user=>'<option value="'+user.id+'" '+(ui.records.userId===user.id?'selected':'')+'>'+ae(user.name)+'</option>').join('')+'</select></label>'+(statuses.length?'<label>状态<select name="g20RecordStatus"><option value="">全部状态</option>'+statuses.map(status=>'<option '+(ui.records.status===status?'selected':'')+'>'+status+'</option>').join('')+'</select></label>':'')+'<label>开始日期<input type="date" name="g20RecordFrom" value="'+ae(ui.records.from)+'"></label><label>结束日期<input type="date" name="g20RecordTo" value="'+ae(ui.records.to)+'"></label><button type="button" class="button primary small" data-action="g20-record-find">查找</button><button type="button" class="button secondary small" data-action="g20-record-reset">重置</button></div></div>'+
      (rows.length?recordsTable(rows,page,size):'<p class="r3-empty">当前筛选没有活动记录。</p>')+pager('g20-record',rows.length,page,size)+'</section></section>';
  };

  C.ar3Action('g20-record-find',()=>{
    ui.records.keyword=document.querySelector('[name="g20RecordKeyword"]')?.value||'';
    ui.records.activityId=document.querySelector('[name="g20RecordActivity"]')?.value||'';
    ui.records.userId=document.querySelector('[name="g20RecordUser"]')?.value||'';
    ui.records.status=document.querySelector('[name="g20RecordStatus"]')?.value||'';
    ui.records.from=document.querySelector('[name="g20RecordFrom"]')?.value||'';
    ui.records.to=document.querySelector('[name="g20RecordTo"]')?.value||'';
    ui.records.page=1;
    C.renderApp();
  });
  C.ar3Action('g20-record-reset',()=>{
    ui.records={view:C.g6Tabs.activityRecords||'participation',keyword:'',activityId:'',userId:'',status:'',from:'',to:'',page:1,size:ui.records.size};
    C.renderApp();
  });
  C.ar3Action('g20-record-export',()=>{
    const view=C.g6Tabs.activityRecords||'participation',rows=filteredRecords();
    if(!rows.length)throw Error('当前筛选没有可导出的活动记录');
    if(view==='activities'){
      exportBook('活动汇总',['活动名称','活动ID','状态','开始日期','结束日期','参与人数','达标人数','实际获奖人数','活动期打卡总次数','奖励配置','最近参与'],rows.map(row=>[row.activity.name,row.activity.id,activityCode(row.activity),row.activity.start,row.activity.end,row.participated,row.qualified,row.awarded,row.checks,rewardText(row.activity),row.latest]));
    }else if(view==='users'){
      exportBook('用户活动汇总',['用户名称','用户ID','手机号','参与活动数','达标活动数','获奖数','最近参与日期'],rows.map(row=>[row.user.name,row.user.id,row.user.profile?.phone||'',row.participated,row.qualified,row.awarded,row.latest]));
    }else{
      exportBook('活动参与明细',['用户名称','用户ID','手机号','活动名称','活动ID','统计打卡天数','达标天数','是否参与','达成状态','奖励','奖励状态','获奖时间','最近打卡'],rows.map(row=>[row.user.name,row.user.id,row.user.profile?.phone||'',row.activity.name,row.activity.id,row.snapshot.count,row.snapshot.target,row.snapshot.count>0?'已参与':'未参与',row.status,row.reward?.name||row.progress.rewardName||'',row.reward?.status||row.progress.rewardStatus||'',row.progress.wonAt||'',row.lastCheckin]));
    }
  });
  C.ar3Action('g20-record-detail',node=>{
    const user=data().users.find(item=>item.id===node.dataset.user),activity=data().checkinActivities.find(item=>item.id===node.dataset.activity);
    if(!user||!activity)return;
    const participant=participationRows().find(row=>row.user.id===user.id&&row.activity.id===activity.id);
    C.openModal({
      title:user.name+' · '+activity.name,
      wide:true,
      body:'<div class="g20-detail-grid"><div><span>用户</span><b>'+ae(user.name+' · '+user.id)+'</b></div><div><span>手机号</span><b>'+ae(user.profile?.phone||'—')+'</b></div><div><span>活动时间</span><b>'+ae(activity.start+' 至 '+activity.end)+'</b></div><div><span>统计范围</span><b>'+ae(activity.includeBefore?'包含发布前':'仅发布后')+'</b></div><div><span>打卡进度</span><b>'+participant.snapshot.count+' / '+participant.snapshot.target+' 天</b></div><div><span>达成状态</span><b>'+ae(participant.status)+'</b></div><div><span>奖励</span><b>'+ae(participant.reward?.name||participant.progress.rewardName||'—')+'</b></div><div><span>奖励状态</span><b>'+ae(participant.reward?.status||participant.progress.rewardStatus||'—')+'</b></div><div><span>获奖时间</span><b>'+ae(participant.progress.wonAt?C.dateTime(participant.progress.wonAt):'—')+'</b></div><div><span>未获奖原因</span><b>'+ae(participant.progress.reason||'—')+'</b></div></div><h3>统计范围内打卡日期</h3><div class="g20-date-cloud">'+(participant.snapshot.entries.map(entry=>'<span>'+ae(entry.date)+'</span>').join('')||'<p class="r3-empty">暂无符合统计范围的打卡</p>')+'</div>',
      footer:btn('关闭','close-modal')
    });
  });

  function calendar(user){
    const prefix=month(),year=prefix.slice(0,4),mon=Number(prefix.slice(5,7)),days=new Date(Date.UTC(year,mon,0)).getUTCDate(),offset=new Date(Date.UTC(year,mon-1,1)).getUTCDay(),done=new Set(user.checkins||[]);
    return '<div class="g20-calendar"><b>'+year+'年'+mon+'月</b><div>'+['日','一','二','三','四','五','六'].map(day=>'<small>'+day+'</small>').join('')+Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,index)=>{const day=prefix+'-'+String(index+1).padStart(2,'0');return '<span class="'+(done.has(day)?'done ':'')+(day===today()?'today':'')+'">'+(index+1)+(done.has(day)?'<i>✓</i>':'')+'</span>';}).join('')+'</div></div>';
  }

  C.V15_PAGES['checkin-users']=function(){
    const keyword=ui.users.keyword.trim().toLowerCase(),rows=data().users.filter(user=>!keyword||[user.name,user.id,user.profile?.phone||''].join(' ').toLowerCase().includes(keyword)).map(user=>({user,stats:userStats(user)}));
    const size=Number(ui.users.size),page=Math.min(ui.users.page,Math.max(1,Math.ceil(rows.length/size)));
    ui.users.page=page;
    return C.ar3Head('用户打卡管理','按用户查看连续、本月、累计打卡天数，以及活动参与和获奖情况。',btn('导出','g20-checkin-user-export'))+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>用户数</span><strong>'+data().users.length+'</strong></div><div><span>本月有打卡</span><strong>'+rows.filter(row=>row.stats.monthDays>0).length+'</strong></div><div><span>今日已打卡</span><strong>'+rows.filter(row=>row.stats.dates.includes(today())).length+'</strong></div><div><span>累计打卡人次</span><strong>'+sum(rows,row=>row.stats.total)+'</strong></div></div>'+
      '<section class="r3-card"><div class="g20-table-toolbar"><div class="g20-table-actions"><button type="button" class="button secondary small" data-action="g20-checkin-user-export">导出</button></div><div class="g20-filter-row"><label>关键词<input name="g20UserKeyword" value="'+ae(ui.users.keyword)+'" placeholder="用户名 / 用户ID / 手机号"></label><button type="button" class="button primary small" data-action="g20-checkin-user-find">查找</button><button type="button" class="button secondary small" data-action="g20-checkin-user-reset">重置</button></div></div>'+
      C.atable(['用户 / ID','手机号','连续打卡','本月打卡','累计打卡','最近打卡','参与活动','获奖活动','操作'],rows.slice((page-1)*size,page*size).map(({user,stats})=>['<b>'+ae(user.name)+'</b><small>'+ae(user.id)+'</small>',ae(user.profile?.phone||'—'),stats.streak+' 天',stats.monthDays+' 天',stats.total+' 天',ae(stats.last||'—'),stats.participated,stats.awarded,btn('详情','g20-checkin-user-detail','data-id="'+user.id+'"')]))+
      pager('g20-checkin-user',rows.length,page,size)+'</section></section>';
  };

  C.ar3Action('g20-checkin-user-find',()=>{
    ui.users.keyword=document.querySelector('[name="g20UserKeyword"]')?.value||'';
    ui.users.page=1;
    C.renderApp();
  });
  C.ar3Action('g20-checkin-user-reset',()=>{
    ui.users={keyword:'',page:1,size:ui.users.size};
    C.renderApp();
  });
  C.ar3Action('g20-checkin-user-export',async()=>{
    const keyword=ui.users.keyword.trim().toLowerCase(),rows=data().users.filter(user=>!keyword||[user.name,user.id,user.profile?.phone||''].join(' ').toLowerCase().includes(keyword)).map(user=>({user,stats:userStats(user)}));
    if(!rows.length)throw Error('当前筛选没有可导出的用户');
    if(!await G6.confirm('导出用户打卡管理',['全部筛选用户 '+rows.length+' 条，不限当前页。']))return;
    exportBook('用户打卡管理',['用户名称','用户ID','手机号','连续打卡天数','本月打卡天数','累计打卡天数','最近打卡日期','参与活动数','达标活动数','获奖活动数'],rows.map(({user,stats})=>[user.name,user.id,user.profile?.phone||'',stats.streak,stats.monthDays,stats.total,stats.last,stats.participated,stats.qualified,stats.awarded]));
  });
  C.ar3Action('g20-checkin-user-detail',node=>{
    const user=data().users.find(item=>item.id===node.dataset.id);
    if(!user)return;
    const stats=userStats(user);
    C.openModal({
      title:user.name+' · 打卡详情',
      wide:true,
      body:'<div class="g20-user-overview"><div><span>当前连续</span><b>'+stats.streak+' 天</b></div><div><span>本月打卡</span><b>'+stats.monthDays+' 天</b></div><div><span>累计打卡</span><b>'+stats.total+' 天</b></div><div><span>最近打卡</span><b>'+ae(stats.last||'—')+'</b></div></div>'+calendar(user) ,
      footer:btn('关闭','close-modal')
    });
  });

  function pageAction(prefix,key,node){
    const page=Number(node.dataset.page)||1;
    ui[key].page=page;
    C.renderApp();
  }
  C.ar3Action('g20-activity-page',node=>pageAction('g20-activity','activities',node));
  C.ar3Action('g20-record-page',node=>pageAction('g20-record','records',node));
  C.ar3Action('g20-checkin-user-page',node=>pageAction('g20-checkin-user','users',node));
  C.ar3Action('g20-activity-jump',()=>{const value=document.querySelector('[data-g20-jump="g20-activity"]')?.value;ui.activities.page=Math.max(1,Number(value)||1);C.renderApp();});
  C.ar3Action('g20-record-jump',()=>{const value=document.querySelector('[data-g20-jump="g20-record"]')?.value;ui.records.page=Math.max(1,Number(value)||1);C.renderApp();});
  C.ar3Action('g20-checkin-user-jump',()=>{const value=document.querySelector('[data-g20-jump="g20-checkin-user"]')?.value;ui.users.page=Math.max(1,Number(value)||1);C.renderApp();});

  document.addEventListener('change',event=>{
    const size=event.target.closest('[data-g20-size]');
    if(size){const key=size.dataset.g20Size==='g20-activity'?'activities':size.dataset.g20Size==='g20-record'?'records':'users';ui[key].size=Number(size.value);ui[key].page=1;C.renderApp();return;}
    if(event.target.closest('#g20-checkin-form'))refreshRewardForm(event.target.closest('form'));
  });
  document.addEventListener('input',event=>{
    if(event.target.closest('#g20-checkin-form'))refreshRewardForm(event.target.closest('form'));
  });

  const closeBefore=closeModal;
  closeModal=function(){
    if(modalDirty&&document.querySelector('#g20-checkin-form')){
      window.G6.confirm('放弃未保存的修改',['打卡活动配置尚未保存，关闭后本次修改将丢失。']).then(ok=>{
        if(ok){modalDirty=false;closeBefore();}
      });
      return;
    }
    return closeBefore.apply(this,arguments);
  };

  const describeBase=window.G6.describe;
  window.G6.describe=function(type,payload,stateData){
    if(type==='ADMIN_SAVE'&&payload.entity==='checkinActivity'){
      const activity=payload.record||{};
      return {title:'保存打卡活动',lines:['活动：'+(activity.name||'未命名活动'),'有效期：'+(activity.start||'—')+' 至 '+(activity.end||'—'),'达标：累计打卡 ≥ '+activity.targetDays+' 天；获奖上限：'+(Number(activity.limit)===0?'不限':activity.limit+' 人'),'统计范围：'+(activity.includeBefore?'包含发布前打卡':'仅统计发布后新打卡'),'保存后会按规则重新结算可获奖用户，并写入统一奖励记录。']};
    }
    if(type==='ADMIN_FEATURE_CHECKIN'){
      const activity=stateData.checkinActivities?.find(item=>item.id===payload.id);
      return {title:'设置首页活动',lines:['活动：'+(activity?.name||payload.id),'该活动将展示在小程序首页每日打卡卡片下方。','新的选择会替换原首页活动。']};
    }
    return describeBase(type,payload,stateData);
  };

  window.R20={activityRows,participationRows,activitySummaryRows,userSummaryRows,filteredRecords,userStats,rewardText,ui};
})();
