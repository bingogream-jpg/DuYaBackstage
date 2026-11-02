// r36 nutrition inputs, unified read-only activities, assets and route navigation.
(()=>{
  const N=window.R25Nutrition,keys=['carb','protein','fat'];
  const targetUI=()=>r3UI.r25||(r3UI.r25={});
  const current=()=>targetUI().targetDraft||N.getTarget(r3Me());
  const wrap=(route,fn)=>{const base=SCREENS[route].render;SCREENS[route].render=function(){const box=document.createElement('div');box.innerHTML=base();fn(box);return box.innerHTML;};};
  const gramDraft=()=>{const t=targetUI();return t.directGrams||(t.directGrams={...current().grams});};
  wrap('nutritionTarget',box=>{
    box.firstElementChild.classList.add('r36n-target');
    if(targetUI().targetMode!=='grams')return;
    box.querySelector('.r29-macro-heading em').textContent='直接填写克数，自动换算热量';
    const values=gramDraft();
    box.querySelectorAll('.r29-macro-grid>button').forEach(button=>{
      const key=button.dataset.kind.slice(5),card=document.createElement('div');
      card.className=button.className;card.innerHTML=button.innerHTML;
      card.querySelector(':scope>span:not(.r29-art)').innerHTML='<label class="r36n-gram-field"><input type="number" min="0" max="1500" step="0.1" inputmode="decimal" data-r36n-gram="'+key+'" aria-label="'+button.getAttribute('aria-label')+'" value="'+esc(values[key])+'"><span>克</span></label>';
      button.replaceWith(card);
    });
  });
  function validGrams(){const fields=[...document.querySelectorAll('[data-r36n-gram]')];return fields.length===3&&fields.every(n=>n.value.trim()!==''&&n.checkValidity()&&Number.isFinite(Number(n.value)));}
  document.addEventListener('input',event=>{
    const key=event.target.dataset.r36nGram;if(!key)return;
    gramDraft()[key]=event.target.value;
    const valid=validGrams();document.querySelectorAll('[data-r36n-gram]').forEach(n=>n.setAttribute('aria-invalid',String(n.value===''||!n.checkValidity())));
    if(valid){targetUI().targetDraft=N.targetFromGrams(Object.fromEntries(keys.map(k=>[k,Number(gramDraft()[k])])));const t=current();document.querySelector('[data-r29-kcal]').textContent=v15Num(t.kcal);document.querySelectorAll('[data-r29-pct]').forEach(n=>n.textContent=v15Num(t.percentages[n.dataset.r29Pct],1));}
    r3SaveDraft();
  });
  const saveTarget=ACTIONS['r25-target-save'];
  r3Act('r25-target-save',async node=>{if(targetUI().targetMode==='grams'&&!validGrams())throw Error('请填写0至1500克的有效数值');if(node)node.disabled=false;return saveTarget(node);});
  const reset=ACTIONS['r25-target-reset'];ACTIONS['r25-target-reset']=node=>{delete targetUI().directGrams;return reset(node);};
  const modeAction=ACTIONS['r25-target-mode'];
  r3Act('r25-target-mode',async node=>{
    if(targetUI().targetMode==='grams'&&!validGrams())throw Error('请先填写完整有效的克数');
    delete targetUI().directGrams;if(node)node.disabled=false;return modeAction(node);
  });
  const openTarget=ACTIONS['r25-open-target'];ACTIONS['r25-open-target']=node=>{delete targetUI().directGrams;return openTarget(node);};
  const editTarget=ACTIONS['r29-edit-target'];
  r3Act('r29-edit-target',node=>{if(targetUI().targetMode==='grams'&&!validGrams())throw Error('请先填写完整有效的克数');return editTarget(node);});
  const confirmTarget=ACTIONS['r29-confirm-target'];
  r3Act('r29-confirm-target',async node=>{if(targetUI().targetMode==='grams')delete targetUI().directGrams;if(node)node.disabled=false;return confirmTarget(node);});
  wrap('coupons',box=>{
    box.firstElementChild.classList.add('r36n-assets');box.querySelector('.r36-meal-summary')?.remove();
    const list=box.querySelector('.r36-meal-list');
    if(list)list.insertAdjacentHTML('beforebegin','<p class="r36n-meal-hint">可在购买适用品牌的套餐时使用赠餐，增加餐数，不抵扣现金。</p>');
    box.querySelectorAll('.r36-meal-card').forEach(card=>{
      const pairs=card.querySelectorAll('dl>div');pairs[0]?.querySelector('dd')?.classList.add('r36n-date');
      const rules=pairs[1]?.querySelector('dd');if(!rules)return;
      rules.classList.add('r36n-rule-text');rules.insertAdjacentHTML('afterend','<button type="button" class="r36n-rule-toggle" data-act="r36n-rule-toggle" aria-expanded="false" hidden>展开</button>');
    });
    requestAnimationFrame(()=>{document.querySelectorAll('.r36n-rule-text').forEach(n=>{const button=n.nextElementSibling;if(button)button.hidden=n.scrollHeight<=n.clientHeight+1;});});
  });
  ACTIONS['r36n-rule-toggle']=node=>{const expanded=node.getAttribute('aria-expanded')==='true';node.setAttribute('aria-expanded',String(!expanded));node.textContent=expanded?'展开':'收起';node.previousElementSibling.classList.toggle('expanded',!expanded);};

  function queryActivities(data,userId){
    const user=data.users.find(u=>u.id===userId);if(!user)return [];
    const today=localDay(data.now).date,rows=[];
    const dateState=a=>a.start&&today<a.start?'未开始':a.end&&today>a.end?'已结束':'进行中';
    for(const activity of data.checkinActivities||[])if(activity.status==='启用')rows.push({key:'checkin:'+activity.id,type:'checkin',typeName:'打卡活动',activity,status:dateState(activity)});
    const audience=window.__DUYA_LOCAL_ENGINE.Store.prototype.growthAudienceMet;
    for(const activity of data.growthActivities||[])if(activity.status==='启用'&&audience.call({data},activity,user))rows.push({key:'growth:'+activity.id,type:'growth',typeName:'活跃度活动',activity,status:dateState(activity)});
    if(data.settings.enabled){const q=window.R23Invite.query(data,userId);rows.push({key:'invite:user',type:'invite',typeName:'邀请活动',activity:{id:'user',name:'好友邀请活动',desc:'邀请好友，按有效邀请与阶段条件获得奖励。',start:q.settings.validityMode==='always'?'':q.settings.start,end:q.settings.validityMode==='always'?'':q.settings.end},status:dateState(q.settings.validityMode==='always'?{}:q.settings),query:q});}
    return rows.sort((a,b)=>Number(b.type==='checkin'&&b.activity.id===data.featuredCheckinActivityId)-Number(a.type==='checkin'&&a.activity.id===data.featuredCheckinActivityId)||String(b.activity.start||'').localeCompare(String(a.activity.start||''))||a.key.localeCompare(b.key));
  }
  const rows=()=>queryActivities(r3.state,r3Me().id);
  const rewardText=configs=>(configs||[]).map(c=>c.type==='coupon'?r3.state.templates.find(t=>t.id===c.couponId)?.name||'优惠券':c.type==='meal'?'赠餐 '+Number(c.count||1)+' 餐':c.name||'自定义奖励').join('、')||'暂无奖励';
  const timeText=row=>row.query?.time||(!row.activity.start&&!row.activity.end?'长期':(row.activity.start||'—')+' 至 '+(row.activity.end||'—'));
  const configs=row=>row.type==='checkin'?row.activity.rewards:row.type==='growth'?(row.activity.stages||[]).filter(s=>s.enabled!==false).flatMap(s=>s.rewards||[]):row.query.stages.flatMap(s=>s.inviter?.rewards||[]);
  const stateUI=()=>r3UI.activities36||(r3UI.activities36={});
  const recordLabel=event=>event?event.name+' · '+window.R36Rewards.label(event,r3.state,Date.parse(r3.state.now)):'暂未获得奖励';
  const findReward=id=>r3Me().rewards.find(r=>r.id===id);
  function listPage(){
    return '<div class="v15-page r36n-activities"><header><small>ACTIVITIES</small><h1>活动列表</h1><p>发现适合你的健康活动</p></header>'+rows().map(row=>'<button class="r36n-activity-card" data-act="r36n-open-activity" data-key="'+esc(row.key)+'"><header><span>'+row.typeName+'</span><em>'+row.status+'</em></header><h2>'+esc(row.activity.name)+'</h2><p>'+esc(row.activity.desc||'')+'</p><small>'+esc(timeText(row))+'</small><footer><span>'+esc(rewardText(configs(row)))+'</span><b>查看详情 ›</b></footer></button>').join('')+(rows().length?'':'<p class="r36-empty">暂无适用活动</p>')+'</div>';
  }
  function detailPage(){
    const row=rows().find(r=>r.key===stateUI().selected);if(!row)return '<div class="v15-page r36-empty">活动不存在或当前不适用</div>';
    let content='';
    if(row.type==='checkin'){
      const progress=r3Me().checkinProgress?.[row.activity.id]||{};
      content='<section><h3>打卡要求</h3><p>累计打卡 ≥ '+row.activity.targetDays+' 天</p><p>当前已累计 '+Number(progress.checkinDays||0)+' 天</p><p>'+esc(row.activity.includeBefore?'包含发布前的活动期打卡记录':'仅统计活动发布后的打卡记录')+'</p></section><section><h3>活动奖励</h3><p>'+esc(rewardText(row.activity.rewards))+'</p><p>获奖人数：'+(Number(row.activity.limit)>0?'上限 '+Number(row.activity.limit)+' 人':'不限')+'</p><p>'+esc(recordLabel(findReward(progress.rewardEventKey)))+'</p>'+(progress.reason?'<p>'+esc(progress.reason)+'</p>':'')+'</section>';
    }else if(row.type==='growth'){
      const progress=r3Me().growthProgress?.[row.activity.id];
      content=(row.activity.stages||[]).filter(s=>s.enabled!==false).map(stage=>{const p=progress?.stages?.find(p=>p.stageId===stage.id);return '<section><h3>'+esc(stage.name)+'</h3><p>'+esc(stage.conditionLabel||stage.desc||'按活动条件完成')+'</p>'+(stage.activeMode==='range'?'<small>'+esc(stage.start+' 至 '+stage.end)+'</small>':'')+'<p>阶段奖励：'+esc(rewardText(stage.rewards))+'</p><p>'+esc(p?.status||'未达成')+(p?.metAt?' · '+esc(new Date(p.metAt).toLocaleString('zh-CN')):'')+'</p><p>'+esc(recordLabel(findReward(p?.rewardEventKey)))+'</p></section>';}).join('');
    }else{
      const q=row.query;content='<section><h3>参与资格</h3><p>'+esc(q.reason||'当前可参与邀请活动')+'</p><p>'+(q.unlimited?'邀请人数不限':'已占用 '+q.occupied+' / '+q.cap+' 个名额')+'</p><p>有效邀请 '+q.effective+' 人，待达成 '+q.pending+' 人</p></section>'+q.stages.map(s=>'<section><h3>'+esc(s.name)+'</h3><p>'+esc(s.inviter.conditionLabel||s.conditionLabel||'按邀请阶段条件达成')+'</p><p>'+esc(rewardText(s.inviter.rewards))+'</p></section>').join('')+'<button class="r36n-activity-primary" data-act="local-invite-go" data-route="invite">查看我的邀请码</button>';
    }
    return '<div class="v15-page r36n-activity-detail"><header><small>'+row.typeName+' · '+row.status+'</small><h1>'+esc(row.activity.name)+'</h1><p>'+esc(timeText(row))+'</p><p>'+esc(row.activity.desc||'')+'</p></header>'+content+'<button class="r36n-back-activities" data-act="r36n-back-activities">返回活动列表</button></div>';
  }
  SCREENS.checkinActivities={...SCREENS.checkinActivities,title:'活动列表',noTab:true,render:listPage};
  SCREENS.activityDetail36={title:'活动详情',noTab:true,navStyle:{bg:'#f5f8e9',ink:'#263c26'},render:detailPage};
  ACTIONS['r36n-open-activity']=node=>{stateUI().selected=node.dataset.key;stateUI().scroll=$('#stage').scrollTop;go('activityDetail36');};
  ACTIONS['r36n-back-activities']=()=>{go('checkinActivities');requestAnimationFrame(()=>{$('#stage').scrollTop=stateUI().scroll||0;});};
  const back=ACTIONS.back;ACTIONS.back=node=>{const restore=state.route==='activityDetail36';const result=back(node);if(restore)requestAnimationFrame(()=>{if(state.route==='checkinActivities')$('#stage').scrollTop=stateUI().scroll||0;});return result;};
  window.R36Activities={query:queryActivities};
  const roots=new Set(['home','track','menu','package','profile']);
  for(const [route,screen]of Object.entries(SCREENS))screen.noTab=!roots.has(route);
  window.R36Navigation={roots:[...roots],pages:()=>Object.keys(SCREENS).map(route=>({route,noTab:SCREENS[route].noTab}))};
})();
