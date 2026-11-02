// V1.5-r26 growth/activity table interaction and coupon stacking UI.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const S=()=>window.R3?.state;
  const ae=C.ae;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const today=()=>S()?.now?.slice(0,10)||window.__DUYA_LOCAL_ENGINE.dateKey(Date.now());
  const user=id=>S()?.users.find(item=>item.id===id);
  const template=id=>S()?.templates.find(item=>item.id===id);
  const userIdentity=id=>{
    const owner=user(id);
    return owner&&window.R24Identity?window.R24Identity.render(owner):'<b>'+ae(id)+'</b>';
  };
  const normalized=value=>String(value||'').trim().toLowerCase();
  const includes=(value,query)=>normalized(value).includes(normalized(query));
  const headerIndex=(table,test)=>[...table.tHead?.rows?.[0]?.cells||[]].findIndex(cell=>test(cell.textContent.trim()));
  const cellBy=(info,test)=>{
    const index=headerIndex(info.row.closest('table'),test);
    return index>=0?info.row.cells[index]?.innerText.trim()||'':'';
  };

  const growthGroup=navGroups.find(group=>group.label==='增长运营');
  if(growthGroup){
    const item=growthGroup.items.find(([page])=>page==='checkin-users');
    if(item){
      growthGroup.items=growthGroup.items.filter(([page])=>page!=='checkin-users');
      const surveyIndex=growthGroup.items.findIndex(([page])=>page==='surveys');
      growthGroup.items.splice(surveyIndex>=0?surveyIndex:growthGroup.items.length,0,item);
    }
  }

  function typeOfRecord(record){
    if(!record)return '自定义奖励';
    if(record.type==='coupon')return '优惠券';
    if(record.type==='meal')return '赠餐';
    if(record.type==='custom')return '自定义奖励';
    return record.type||'奖励';
  }
  function rewardContent(record){
    if(!record)return '不发放';
    if(record.type==='coupon'){
      const coupon=template(record.couponId);
      return coupon?coupon.name+' · ¥'+coupon.amount:'优惠券';
    }
    if(record.type==='meal')return '赠餐 '+Number(record.count||1)+' 餐';
    return record.name||'自定义奖励';
  }
  function rewardCell(rows){
    const list=(rows||[]).filter(Boolean);
    if(!list.length)return '<div class="r26-reward-cell"><span>奖励</span><b>不发放</b></div>';
    return '<div class="r26-reward-cell">'+list.map(record=>{const status=record.userId?window.R36Rewards?.label(record,S(),Date.parse(S().now)||Date.now()):'';return '<div><span>'+ae(typeOfRecord(record))+'</span><b>'+ae(rewardContent(record))+'</b>'+(status?'<small>'+ae(status)+'</small>':'')+'</div>';}).join('')+'</div>';
  }

  function audienceSummary(activity){
    const audience=activity.audience||{},mode=audience.mode||(audience.allUsers?'all':audience.userInviteCodes?.length?'userCodes':audience.merchantCodes?.length?'merchants':audience.userIds?.length?'users':'all');
    if(mode==='all')return '<b>全部用户</b><small>满足活动时间后自动参与</small>';
    if(mode==='users'){
      const names=(audience.userIds||[]).map(id=>user(id)?.name||id);
      return '<b>指定用户</b><small>'+ae(names.join('、')||'尚未选择')+'</small>';
    }
    if(mode==='merchants')return '<b>绑定指定商户码</b><small>'+ae((audience.merchantCodes||[]).join('、')||'尚未选择')+'</small>';
    return '<b>由指定用户邀请码邀请</b><small>'+ae((audience.userInviteCodes||[]).join('、')||'尚未选择')+'</small>';
  }
  function stageCount(activity){return (activity.stages||[]).filter(stage=>stage.enabled!==false).length;}
  function published(activity){return activity.activatedAt||activity.publishedAt||'';}
  function badgeState(activity){return activity.status==='启用'?'启用':'停用';}
  const localFilters={
    checkin:{name:'',desc:'',status:'',page:1,size:10},
    users:{keyword:'',page:1,size:10}
  };
  function pager(prefix,total,state){
    const pages=Math.max(1,Math.ceil(total/state.size));state.page=Math.min(pages,Math.max(1,state.page));
    return '<div class="g20-pager"><span>共 '+total+' 条 · 第 '+state.page+' / '+pages+' 页</span><div class="g20-page-buttons"><button type="button" class="g20-page-button" data-action="'+prefix+'-page" data-page="'+Math.max(1,state.page-1)+'" '+(state.page===1?'disabled':'')+'>上一页</button>'+Array.from({length:pages},(_,index)=>index+1).filter(page=>pages<=7||page===1||page===pages||Math.abs(page-state.page)<=1).map(page=>'<button type="button" class="g20-page-button '+(page===state.page?'active':'')+'" data-action="'+prefix+'-page" data-page="'+page+'">'+page+'</button>').join('')+'<button type="button" class="g20-page-button" data-action="'+prefix+'-page" data-page="'+Math.min(pages,state.page+1)+'" '+(state.page===pages?'disabled':'')+'>下一页</button></div><label>每页<select data-action="'+prefix+'-size">'+[10,20,30].map(size=>'<option value="'+size+'" '+(size===state.size?'selected':'')+'>'+size+' 条</option>').join('')+'</select></label><label>跳至<input type="number" min="1" max="'+pages+'" value="'+state.page+'" data-action="'+prefix+'-jump">页</label></div>';
  }
  function statusSwitch(kind,id,checked,label){
    return '<label class="r26-switch" title="切换'+label+'状态"><input type="checkbox" data-r26-switch data-kind="'+ae(kind)+'" data-id="'+ae(id)+'" '+(checked?'checked':'')+' aria-label="'+ae(label)+'启停开关"><i></i><span>'+(checked?'启用':'停用')+'</span></label>';
  }

  // Explicit R26 filter definitions. Option fields are rendered as segmented tabs later.
  const rewardPaths=['邀请码奖励','用户成长奖励','问卷奖励','连续打卡奖励','后台发放','系统发放','其他奖励'];
  const rewardStatuses=['已发放','待领取','待发放','未发放'];
  const baseGet=window.R24Filters?.get;
  const baseMatch=window.R24Filters?.match;
  function filterDefinition(page,tab,rows){
    if(page==='coupons'&&tab==='templates')return [
      {key:'couponName',label:'优惠券名称',placeholder:'输入优惠券名称'},
      {key:'couponDesc',label:'优惠券描述',placeholder:'输入优惠券描述'},
      {key:'couponStatus',label:'优惠券状态',type:'select',allLabel:'全部',options:['启用','停用']},
      {key:'couponValidity',label:'有效期',type:'select',allLabel:'全部',options:['固定有效期','相对有效期']}
    ];
    if(page==='coupons'&&tab==='issues')return [
      {key:'couponName',label:'优惠券名称',placeholder:'输入优惠券名称'},
      {key:'issueChannel',label:'发放渠道',type:'select',allLabel:'全部',options:['用户邀请','打卡活动','成长活动','后台']},
      {key:'issueActivity',label:'活动名称',placeholder:'活动名称（选填）'},
      {key:'recipient',label:'领券人',placeholder:'用户名 / 用户ID / 手机号'},
      {key:'issueStatus',label:'状态',type:'select',allLabel:'全部状态',options:[...new Set(rows.flatMap(info=>info.states))]}
    ];
    if(page==='coupons')return [{key:'userKeyword',label:'用户',placeholder:'用户名 / 用户ID / 手机号'}];
    if(page==='invites'&&tab==='user')return [
      {key:'userInviteUser',label:'用户',placeholder:'用户名 / 用户ID / 手机号'},
      {key:'userInviteCode',label:'用户邀请码',placeholder:'输入邀请码'},
      {key:'userInviteStatus',label:'邀请码状态',type:'select',allLabel:'全部',options:['启用','停用']}
    ];
    if(page==='invite-relations'||(page==='invites'&&tab==='records'))return [
      {key:'relationUser',label:'用户',placeholder:'姓名 / 用户ID / 手机号'},
      {key:'relationCode',label:'邀请码',placeholder:'输入邀请码'},
      {key:'relationStatus',label:'邀请状态',type:'select',allLabel:'全部',options:['已达成','待达成','已失效']}
    ];
    if(page==='invite-rewards')return [
      {key:'rewardUser',label:'用户',placeholder:'用户名 / 用户ID / 手机号'},
      {key:'rewardPath',label:'获得途径',type:'select',allLabel:'全部',options:['用户邀请','打卡活动','成长活动','后台']},
      {key:'rewardActivity',label:'活动名称',placeholder:'活动名称（选填）'}
    ];
    if(page==='foods'){
      const table=rows[0]?.row?.closest('table');
      if(!table||!/每100(?:克|基准量)热量/.test(table.tHead?.textContent||''))return [];
      return [
        {key:'foodName',label:'食物名称',placeholder:'输入食物名称'},
        {key:'foodCategory',label:'分类',type:'select',allLabel:'全部分类',options:[...new Set((S()?.foods||[]).map(item=>item.cat).filter(Boolean))]},
        {key:'foodStatus',label:'状态',type:'select',allLabel:'全部状态',options:['启用','停用']}
      ];
    }
    if(page==='checkin-users')return [{key:'checkinUser',label:'用户',placeholder:'用户名 / 用户ID / 手机号'}];
    if(page==='user-growth')return [
      {key:'growthName',label:'活动名称',placeholder:'输入活动名称'},
      {key:'growthDesc',label:'活动描述',placeholder:'输入活动描述'},
      {key:'growthStatus',label:'状态',type:'select',allLabel:'全部状态',options:['启用','停用']},
      {key:'growthAudience',label:'生效人群',type:'select',allLabel:'全部人群',options:['全部用户','指定用户','商户邀请码','用户邀请码']},
      {key:'growthAudienceValue',label:'人群关键词',placeholder:'按所选人群搜索'}
    ];
    if(page==='checkin-activities')return [
      {key:'checkinName',label:'活动名称',placeholder:'输入活动名称'},
      {key:'checkinDesc',label:'活动描述',placeholder:'输入活动描述'},
      {key:'checkinStatus',label:'状态',type:'select',allLabel:'全部状态',options:['进行中','未开始','已过期','已停用']}
    ];
    if(page==='surveys')return [
      {key:'surveyName',label:'问卷名称',placeholder:'输入问卷名称'},
      {key:'surveyStatus',label:'状态',type:'select',allLabel:'全部状态',options:['已发布','草稿','停用']}
    ];
    return baseGet?baseGet(page,tab,rows):null;
  }

  function growthAudienceText(activity){
    const audience=activity.audience||{},mode=audience.mode||(audience.allUsers?'all':audience.userInviteCodes?.length?'userCodes':audience.merchantCodes?.length?'merchants':audience.userIds?.length?'users':'all');
    if(mode==='all')return '全部用户';
    if(mode==='users')return (audience.userIds||[]).map(id=>{
      const owner=user(id);
      return [owner?.name,owner?.id,owner?.profile?.phone].filter(Boolean).join(' ');
    }).join(' ');
    if(mode==='merchants')return (audience.merchantCodes||[]).map(code=>{
      const merchant=S().merchants.find(item=>item.code===code);
      return [code,merchant?.name,merchant?.phone].filter(Boolean).join(' ');
    }).join(' ');
    return (audience.userInviteCodes||[]).map(code=>{
      const owner=S().users.find(item=>item.inviteCode===code);
      return [code,owner?.name,owner?.id,owner?.profile?.phone].filter(Boolean).join(' ');
    }).join(' ');
  }
  function checkinStatus(activity){return window.R20Data?.activityStatus(activity,today())||(activity.status==='启用'?'进行中':'已停用');}
  function match(info,view,page,tab){
    if(page==='coupons'&&tab==='templates'){
      const text=info.text;
      return (!view.couponName||includes(text,view.couponName))&&(!view.couponDesc||includes(text,view.couponDesc))&&(!view.couponStatus||info.states.includes(view.couponStatus))&&(!view.couponValidity||includes(text,view.couponValidity));
    }
    if(page==='coupons'&&tab==='issues'){
      const channel=info.row.dataset.r24Channel||cellBy(info,t=>t==='发放渠道');
      const group=/邀请/.test(channel)?'用户邀请':/打卡/.test(channel)?'打卡活动':/成长/.test(channel)?'成长活动':/后台/.test(channel)?'后台':'';
      return (!view.couponName||includes(info.text,view.couponName))&&(!view.issueChannel||group===view.issueChannel)&&(!view.issueActivity||includes(info.text,view.issueActivity))&&(!view.recipient||includes(cellBy(info,t=>t==='领券人'),view.recipient))&&(!view.issueStatus||info.states.includes(view.issueStatus));
    }
    if((page==='invites'||page==='invite-users')&&tab==='user'){
      return (!view.userInviteUser||includes(info.text,view.userInviteUser))&&(!view.userInviteCode||includes(info.text,view.userInviteCode))&&(!view.userInviteStatus||info.states.includes(view.userInviteStatus));
    }
    if(page==='invite-rewards'){
      const summary=C.g6Tabs.rewardView==='summary';
      const path=/邀请/.test(info.text)?'用户邀请':/打卡/.test(info.text)?'打卡活动':/成长/.test(info.text)?'成长活动':/后台/.test(info.text)?'后台':'';
      return (!view.rewardUser||includes(info.text,view.rewardUser))&&(!view.rewardPath||path===view.rewardPath)&&(!view.rewardActivity||includes(info.text,view.rewardActivity));
    }
    if(page==='invite-relations'||(page==='invites'&&tab==='records'))return (!view.relationUser||includes(info.text,view.relationUser))&&(!view.relationCode||includes(cellBy(info,t=>t.startsWith('邀请码')),view.relationCode))&&(!view.relationStatus||info.states.includes(view.relationStatus));
    if(page==='foods'){
      return (!view.foodName||includes(cellBy(info,text=>text==='名称'||text==='食物名称'),view.foodName))&&
        (!view.foodCategory||cellBy(info,text=>text==='分类')===view.foodCategory)&&
        (!view.foodStatus||info.states.includes(view.foodStatus));
    }
    if(page==='checkin-users'){
      return !view.checkinUser||includes(info.text,view.checkinUser);
    }
    if(page==='user-growth'){
      const id=info.row.querySelector('[data-action="g15-edit-growth"]')?.dataset.id;
      const activity=S().growthActivities.find(item=>item.id===id);
      const audienceText=activity?growthAudienceText(activity):'';
      const audienceMode={ '全部用户':'all','指定用户':'users','商户邀请码':'merchants','用户邀请码':'userCodes' }[view.growthAudience]||'';
      const activityMode=activity?.audience?.mode||(activity?.audience?.allUsers?'all':'');
      return (!view.growthName||includes(activity?.name||'',view.growthName))&&
        (!view.growthDesc||includes(activity?.desc||'',view.growthDesc))&&
        (!view.growthStatus||activity?.status===view.growthStatus)&&
        (!audienceMode||activityMode===audienceMode)&&
        (!view.growthAudienceValue||includes(audienceText,view.growthAudienceValue));
    }
    if(page==='checkin-activities'){
      return (!view.checkinName||includes(cellBy(info,text=>text==='活动名称'),view.checkinName))&&
        (!view.checkinDesc||includes(cellBy(info,text=>text==='简介'||text==='活动描述'),view.checkinDesc))&&
        (!view.checkinStatus||info.states.includes(view.checkinStatus));
    }
    if(page==='surveys'){
      return (!view.surveyName||includes(info.text,view.surveyName))&&(!view.surveyStatus||info.states.includes(view.surveyStatus));
    }
    return baseMatch?baseMatch(info,view,page,tab):true;
  }
  window.R24Filters={get:filterDefinition,match};

  function filterTabs(scope=document){
    if(!['coupons','invites','invite-relations','invite-users','invite-rewards','foods','surveys','checkin-users','user-growth','checkin-activities','activity-records'].includes(C.state.page))return;
    scope.querySelectorAll('.g6-filters select[data-g6-filter], .g20-filter-row select').forEach(select=>{
      if(select.dataset.r26Tabs)return;
      select.dataset.r26Tabs='yes';
      const options=[...select.options].map(option=>({value:option.value,label:option.textContent.trim()}));
      const box=document.createElement('div');
      box.className='r26-filter-tabs';
      box.setAttribute('role','tablist');
      box.innerHTML=options.map(option=>'<button type="button" role="tab" data-value="'+ae(option.value)+'" aria-selected="'+(select.value===option.value?'true':'false')+'" class="'+(select.value===option.value?'on':'')+'">'+ae(option.label)+'</button>').join('');
      select.classList.add('r26-native-select');
      select.after(box);
      box.addEventListener('click',event=>{
        const button=event.target.closest('button[data-value]');
        if(!button)return;
        select.value=button.dataset.value;
        box.querySelectorAll('button').forEach(item=>{const active=item===button;item.classList.toggle('on',active);item.setAttribute('aria-selected',String(active));});
        select.dispatchEvent(new Event('change',{bubbles:true}));
        const find=select.closest('.g6-filters')?.querySelector('.g18-find')||select.closest('.g20-filter-row')?.querySelector('[data-action$="-find"]');
        find?.click();
      });
      select.addEventListener('change',()=>box.querySelectorAll('button').forEach(button=>{const active=button.dataset.value===select.value;button.classList.toggle('on',active);button.setAttribute('aria-selected',String(active));}));
    });
    if(C.state.page==='user-growth'){
      const audience=scope.querySelector('[data-g6-filter="growthAudience"]');
      const keyword=scope.querySelector('[data-g7-filter-field="growthAudienceValue"]');
      if(audience&&keyword){
        const sync=()=>{
          const active=Boolean(audience.value);
          keyword.hidden=!active;
          if(!active){
            const input=keyword.querySelector('input');
            if(input)input.value='';
          }
        };
        sync();
        audience.addEventListener('change',sync);
      }
    }
  }

  function removeBulk(scope=document){
    if(!['coupons','invites','invite-relations','invite-users','invite-rewards','foods','surveys','checkin-users','user-growth','checkin-activities','activity-records'].includes(C.state.page))return;
    scope.querySelectorAll('.g7-select-cell,.g6-selection').forEach(node=>node.remove());
    scope.querySelectorAll('.g6-table-tools button,.g8-table-actions-left button,#workspace .page-actions button').forEach(button=>{
      if(/^批量(启用|停用)$/.test(button.textContent.trim()))button.remove();
    });
  }

  const switchMeta={
    coupon:{action:'save',entity:'coupon',label:'优惠券'},
    merchant:{action:'save',entity:'merchant',label:'商户邀请码'},
    food:{action:'save',entity:'food',label:'食物'},
    survey:{action:'save',entity:'survey',label:'问卷'},
    category:{action:'category',entity:'category',label:'食物分类'},
    growth:{action:'save',entity:'growth',label:'用户成长活动'},
    checkin:{action:'save',entity:'checkinActivity',label:'打卡活动'},
    user:{action:'user',label:'用户邀请码'}
  };
  function switchInfo(kind,id){
    if(kind==='user'){
      const owner=user(id);
      return {checked:owner?.inviteStatus!=='停用',name:owner?.name||id};
    }
    const entity=switchMeta[kind]?.entity;
    const map={coupon:'templates',merchant:'merchants',food:'foods',survey:'surveys',category:'foodCategories',growth:'growthActivities',checkin:'checkinActivities'};
    const record=S()[map[entity]]?.find(item=>item.id===id);
    const active=record?.status==='启用'||record?.status==='已发布';
    return {checked:Boolean(active),name:record?.name||id,record};
  }
  function enhanceSwitches(scope=document){
    if(!['coupons','invites','invite-relations','invite-users','foods','food-categories','surveys','user-growth','checkin-activities'].includes(C.state.page))return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const headers=[...table.tHead?.rows?.[0]?.cells||[]].map(cell=>cell.textContent.trim());
      for(const row of table.tBodies[0]?.rows||[]){
        const button=row.querySelector('[data-action="r3-toggle"],[data-action="g6-user-code-toggle"],[data-action="g15-toggle-growth"],[data-action="g20-activity-toggle"],[data-action="g18-category-toggle"]');
        if(!button)continue;
        const action=button.dataset.action,id=button.dataset.id,entity=button.dataset.entity;
        const kind=action==='g6-user-code-toggle'?'user':action==='g15-toggle-growth'?'growth':action==='g20-activity-toggle'?'checkin':action==='g18-category-toggle'?'category':entity==='coupon'?'coupon':entity==='merchant'?'merchant':entity==='food'?'food':entity==='survey'?'survey':'';
        button.remove();
        if(!kind||row.querySelector('[data-r26-switch]'))continue;
        const info=switchInfo(kind,id);
        let index=headers.findIndex(text=>text==='状态'||text.startsWith('状态'));
        if(index<0&&(kind==='growth'||kind==='checkin'))index=0;
        const cell=row.cells[index];
        if(!cell)continue;
        const statusText=kind==='survey'?(info.checked?'已发布':'停用'):info.checked?'启用':(info.record?.status||'停用');
        cell.innerHTML='<div class="r26-status-cell">'+C.badge(statusText)+statusSwitch(kind,id,info.checked,switchMeta[kind]?.label||'记录')+'</div>';
      }
    });
  }

  async function changeStatus(input){
    const kind=input.dataset.kind,id=input.dataset.id,meta=switchMeta[kind];
    if(!meta)return;
    const next=input.checked?'启用':'停用';
    if(!await window.G6.confirm((input.checked?'启用':'停用')+(meta.label||'记录'),[switchInfo(kind,id).name])){input.checked=!input.checked;return;}
    input.disabled=true;
    window.R3.skipConfirm=true;
    try{
      if(kind==='user')await window.R3.cmd('ADMIN_USER_CODE',{id,status:next});
      else if(kind==='category'){
        const record=S().foodCategories.find(item=>item.id===id);
        await window.R3.cmd('ADMIN_CATEGORY',{...clone(record),status:next,expectedRevision:record.revision||1});
      }else{
        const ref=switchInfo(kind,id),record=ref.record;
        const status=kind==='survey'?(input.checked?'已发布':'停用'):next;
        await window.R3.cmd('ADMIN_SAVE',{entity:meta.entity,record:{...clone(record),status,expectedRevision:record.revision||1}});
      }
      C.renderApp();
      window.__g7UI?.toast?.('状态已更新',meta.label+'：'+next);
    }catch(error){
      input.checked=!input.checked;
      if(!error.cancelled)window.__g7UI?.toast?.('状态更新失败',error.message,'error');
    }finally{
      window.R3.skipConfirm=false;
      input.disabled=false;
    }
  }

  function inferRewardType(cell){
    const text=cell.innerText;
    if(!text.trim()||/^不发放|^—$/.test(text.trim()))return '奖励';
    const names=(S()?.templates||[]).map(item=>item.name).filter(Boolean);
    const couponCount=names.filter(name=>text.includes(name)).length;
    const hasMeal=/赠餐|餐数/.test(text),hasCustom=/自定义|线下/.test(text);
    const kinds=[couponCount? '优惠券':'',hasMeal?'赠餐':'',hasCustom?'自定义奖励':''].filter(Boolean);
    if(kinds.length>1)return '多项奖励';
    return kinds[0]||(/券/.test(text)?'优惠券':hasMeal?'赠餐':'自定义奖励');
  }
  function enhanceRewardCells(scope=document){
    if(!['coupons','invites','invite-relations','invite-rewards','surveys','user-growth','checkin-activities','activity-records'].includes(C.state.page))return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const headers=[...table.tHead?.rows?.[0]?.cells||[]].map(cell=>cell.textContent.trim());
      headers.forEach((header,index)=>{
        if(!/奖励/.test(header)||/奖励状态|总数|数量|条数|次数|记录数|获奖数/.test(header))return;
        for(const row of table.tBodies[0]?.rows||[]){
          const cell=row.cells[index];
          if(!cell||cell.querySelector('.r26-reward-cell'))continue;
          const type=inferRewardType(cell);
          cell.insertAdjacentHTML('afterbegin','<span class="r26-reward-type">'+ae(type)+'</span>');
          cell.classList.add('r26-reward-legacy');
        }
      });
    });
  }

  function patchTemplateTable(html){
    const box=document.createElement('div');
    box.innerHTML=html;
    const table=box.querySelector('table.data-table');
    if(!table)return box.innerHTML;
    const headers=[...table.tHead.rows[0].cells].map(cell=>cell.textContent.trim());
    const usageIndex=headers.findIndex(text=>/发放\s*\/\s*使用/.test(text));
    if(usageIndex<0||headers.includes('叠加规则'))return box.innerHTML;
    const usageHeader=table.tHead.rows[0].cells[usageIndex];
    const stackHeader=document.createElement('th');
    stackHeader.textContent='叠加规则';
    usageHeader.before(stackHeader);
    for(const row of table.tBodies[0].rows){
      const edit=row.querySelector('[data-action="r3-edit"][data-entity="coupon"]');
      const coupon=template(edit?.dataset.id);
      const value=coupon?.stackMax&&coupon.stackMax>1?'最多 '+coupon.stackMax+' 张':'不可叠加';
      const cell=row.insertCell(usageIndex);
      cell.innerHTML='<span class="r26-stack-rule">'+ae(value)+'</span>';
    }
    return box.innerHTML;
  }
  function walletStatus(wallet){
    return wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<today()?'已过期':wallet.start>today()?'待生效':'可使用';
  }
  function userCouponPage(){
    const state=S();
    const rows=state.users.map(owner=>{
      const counts={'可使用':0,'已使用':0,'已过期':0,'已撤回':0};
      owner.wallet.forEach(wallet=>counts[walletStatus(wallet)]++);
      const stat=(scope,value,red=false)=>'<span class="r26-count-link '+(red?'red':'')+'" data-action="g13-user-coupon-stat" data-id="'+ae(owner.id)+'" data-scope="'+ae(scope)+'" role="button" tabindex="0">'+value+'</span>';
      return [userIdentity(owner.id),stat('总数',owner.wallet.length,true),stat('可使用',counts['可使用']),stat('已使用',counts['已使用']),stat('已过期',counts['已过期']),stat('已撤回',counts['已撤回']),C.ab('查看详情','g8-user-coupon-detail','data-id="'+owner.id+'"','secondary small')];
    });
    return C.ar3Head('优惠券管理','券模板、发放记录和用户优惠券统一管理。')+
      C.g6Stats([['券模板',state.templates.length],['发放记录',state.users.reduce((total,owner)=>total+owner.wallet.length,0)+state.issues.filter(job=>job.status==='待执行').length],['用户数',state.users.length],['可使用',state.users.reduce((total,owner)=>total+owner.wallet.filter(wallet=>walletStatus(wallet)==='可使用').length,0)]])+
      C.g6Buttons('coupons',[['templates','优惠券'],['issues','发放记录'],['user-coupons','用户优惠券']])+
      C.card('用户优惠券',C.atable(['用户名称 / ID','券总数','可使用','已使用','已过期','已撤回','操作'],rows))+'</section>';
  }
  const couponBase=C.V15_PAGES.coupons;
  C.V15_PAGES.coupons=function(){
    if(C.g6Tabs.coupons==='user-coupons')return userCouponPage();
    const html=couponBase();
    return C.g6Tabs.coupons==='templates'?patchTemplateTable(html):html;
  };

  function rewardRecords(){return window.G17Rewards?.records?.()||[];}
  function rewardSummary(records=rewardRecords()){return window.G17Rewards?.summary?.(records)||[];}
  function rewardUserCell(record){return userIdentity(record.userId)+'<span class="r26-user-phone">'+ae(record.phone||'—')+'</span>';}
  function rewardTypeLabel(record){return {coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[record.type]||'其他奖励';}
  function rewardDetailCelled(record){return '<div class="r26-reward-cell"><div><span>'+ae(rewardTypeLabel(record))+'</span><b>'+ae(record.content||record.name)+'</b></div></div>';}
  function rewardTableView(){
    const records=rewardRecords(),summary=rewardSummary(records),view=C.g6Tabs.rewardView||'summary';
    const content=view==='summary'
      ?C.atable(['用户','奖励总数','已发放','待领取','待发放','主要途径','最近获得','操作'],summary.map(item=>[
        userIdentity(item.userId)+'<span class="r26-user-phone">'+ae(item.phone||'—')+'</span>',
        item.total,item.issued,item.pendingClaim,item.pendingIssue,ae(item.mainPath),C.dateTime(item.latest),
        C.ab('查看详情','r26-reward-user-detail','data-id="'+ae(item.userId)+'"','secondary small')
      ]))
      :C.atable(['用户','奖励内容','获得途径与时间','原始来源','状态'],records.map(record=>[
        userIdentity(record.userId)+'<span class="r26-user-phone">'+ae(record.phone||'—')+'</span>',
        rewardDetailCelled(record),
        '<div class="r26-path-time"><b>'+ae(record.path)+'</b><small>'+ae(C.dateTime(record.time))+'</small></div>',
        ae(record.source||'—')+(record.orderId?'<small>订单 '+ae(record.orderId)+'</small>':''),
        C.badge(record.status)
      ]));
    return C.ar3Head('奖励记录','按用户汇总全部已获得奖励，或查看按时间降序的完整明细。')+
      C.g6Stats([['奖励总条数',records.length],['获奖用户',summary.length],['待领取',records.filter(item=>item.status==='待领取').length],['待发放',records.filter(item=>item.status==='待发放').length]])+
      C.g6Buttons('rewardView',[['summary','用户汇总'],['details','奖励明细']])+
      C.card(view==='summary'?'用户奖励汇总':'奖励明细',content)+'</section>';
  }
  C.V15_PAGES['invite-rewards']=rewardTableView;
  C.ar3Action('r26-reward-user-detail',node=>{
    const records=rewardRecords().filter(record=>record.userId===node.dataset.id),owner=user(node.dataset.id);
    C.openModal({title:(owner?.name||node.dataset.id)+' · 全部奖励明细',wide:true,body:records.length?C.atable(['用户','奖励内容','获得途径与时间','原始来源','状态'],records.map(record=>[
      userIdentity(record.userId)+'<span class="r26-user-phone">'+ae(record.phone||'—')+'</span>',
      rewardDetailCelled(record),
      '<div class="r26-path-time"><b>'+ae(record.path)+'</b><small>'+ae(C.dateTime(record.time))+'</small></div>',
      ae(record.source||'—')+(record.orderId?'<small>订单 '+ae(record.orderId)+'</small>':''),
      C.badge(record.status)
    ])):'<p class="r3-empty">该用户暂无奖励记录</p>',footer:C.ab('关闭','close-modal','','secondary')});
  });

  function growthPage(){
    const activities=S().growthActivities||[];
    const rows=activities.map(activity=>[
      '<div class="r26-name-status"><b>'+ae(activity.name)+'</b><div>'+C.badge(badgeState(activity))+statusSwitch('growth',activity.id,activity.status==='启用','用户成长活动')+'</div></div>',
      ae(activity.desc||'—'),
      '<div class="r26-audience">'+audienceSummary(activity)+'</div>',
      ae(activity.start+' 至 '+activity.end),
      '<span class="r26-cell-link" data-action="r26-growth-stages" data-id="'+ae(activity.id)+'" role="button" tabindex="0">'+stageCount(activity)+' 个阶段</span>',
      ae(published(activity)?C.dateTime(published(activity)):'尚未启用'),
      C.ab('编辑','g15-edit-growth','data-id="'+activity.id+'"','secondary small')+C.ab('参与用户','g15-growth-users','data-id="'+activity.id+'"','secondary small')
    ]);
    return C.ar3Head('用户成长活动','面向全体或指定人群配置用户阶段成长奖励。',C.ab('新建成长活动','g15-new-growth','','primary'))+
      C.g6Stats([['全部活动',activities.length],['启用活动',activities.filter(item=>item.status==='启用').length],['成长阶段',activities.reduce((total,item)=>total+stageCount(item),0)],['参与记录',S().users.reduce((total,item)=>total+Object.keys(item.growthProgress||{}).length,0)]])+
      C.card('成长活动配置',C.atable(['活动名称','活动描述','生效人群','活动时间','成长阶段','发布时间','操作'],rows))+'</section>';
  }
  C.V15_PAGES['user-growth']=growthPage;
  C.ar3Action('r26-growth-stages',node=>{
    const activity=S().growthActivities.find(item=>item.id===node.dataset.id);
    if(!activity)return;
    C.openModal({title:activity.name+' · 成长阶段',wide:true,body:C.atable(['阶段','描述','条件 / 有效期','发放方式','奖励','状态'],(activity.stages||[]).map(stage=>[
      '<b>'+ae(stage.name)+'</b>',
      ae(stage.desc||'—'),
      ae(stage.conditionLabel||window.__g8Core.conditionLabel?.(stage.condition)||'完成初始设置')+'<small>'+(stage.activeMode==='range'?ae(stage.start+' 至 '+stage.end):'长期有效')+'</small>',
      stage.rewardMode==='probability'?'概率抽奖':'固定奖励',
      rewardCell(stage.rewards||[]),
      C.badge(stage.enabled===false?'停用':'启用')
    ])),footer:C.ab('关闭','close-modal','','secondary')});
  });

  function checkinPage(){
    const activities=(S().checkinActivities||[]).filter(activity=>{
      const filter=localFilters.checkin;
      return (!filter.name||includes(activity.name,filter.name))&&(!filter.desc||includes(activity.desc,filter.desc))&&(!filter.status||checkinStatus(activity)===filter.status);
    }),featured=S().featuredCheckinActivityId;
    const rows=activities.map(activity=>{
      const count=window.R21Data.completed(window.__DUYA_LOCAL__.store).filter(row=>row.activity.activityType==='checkin'&&row.activity.id===activity.id).length;
      return [
        '<div class="r26-name-status"><b>'+ae(activity.name)+'</b><div>'+(featured===activity.id?'<span class="r26-home-tag">首页展示</span>':'')+C.badge(checkinStatus(activity))+statusSwitch('checkin',activity.id,activity.status==='启用','打卡活动')+'</div></div>',
        ae(activity.desc||'—'),
        ae(activity.start+' 至 '+activity.end),
        '累计打卡 ≥ '+activity.targetDays+' 天',
        rewardCell(activity.rewards||[]),
        (Number(activity.limit)===0?'不限':Number(activity.limit)+' 人')+'<small>'+(activity.includeBefore?'包含发布前数据':'仅统计发布后')+'</small>',
        '<span class="r26-cell-link" data-action="g21-checkin-completed" data-id="'+ae(activity.id)+'" role="button" tabindex="0">'+count+'</span>',
        ae(activity.publishedAt?C.dateTime(activity.publishedAt):'尚未发布'),
        C.ab('编辑','g20-activity-edit','data-id="'+activity.id+'"','secondary small')+C.ab('活动记录','g20-activity-records','data-id="'+activity.id+'"','secondary small')
      ];
    });
    const page=localFilters.checkin,view=rows.slice((page.page-1)*page.size,page.page*page.size);
    return C.ar3Head('打卡活动','配置累计打卡奖励、获奖名额和首页展示活动；活动奖励自动进入统一奖励记录。',C.ab('设置首页打卡活动','r26-feature-checkin','','secondary')+C.ab('导出','r26-checkin-export','','secondary'))+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>活动总数</span><strong>'+activities.length+'</strong></div><div><span>进行中</span><strong>'+activities.filter(item=>checkinStatus(item)==='进行中').length+'</strong></div><div><span>首页活动</span><strong>'+ae(activities.find(item=>item.id===featured)?.name||'未设置')+'</strong></div><div><span>累计获奖</span><strong>'+S().users.flatMap(owner=>Object.values(owner.checkinProgress||{})).filter(item=>item.status==='已获奖').length+'</strong></div></div>'+
      '<section class="r3-card"><div class="g20-filter-row"><label class="g7-filter">活动名称<input name="r26CheckinName" value="'+ae(page.name)+'" placeholder="输入活动名称"></label><label class="g7-filter">活动描述<input name="r26CheckinDesc" value="'+ae(page.desc)+'" placeholder="输入活动描述"></label><label class="g7-filter">状态<select name="r26CheckinStatus"><option value="">全部状态</option>'+['进行中','未开始','已过期','已停用'].map(status=>'<option '+(page.status===status?'selected':'')+'>'+status+'</option>').join('')+'</select></label><button type="button" class="button primary small" data-action="r26-checkin-find">查找</button><button type="button" class="button secondary small" data-action="r26-checkin-reset">重置</button></div>'+(rows.length?C.atable(['活动名称','简介','活动时间','达标条件','活动奖励','获奖上限','完成人数','发布时间','操作'],view):'<p class="r3-empty">当前没有打卡活动。</p>')+pager('r26-checkin',rows.length,page)+'</section></section>';
  }
  C.V15_PAGES['checkin-activities']=checkinPage;
  C.ar3Action('r26-feature-checkin',()=>{
    const candidates=(S().checkinActivities||[]).filter(activity=>activity.status==='启用'&&activity.end>=today());
    C.openModal({title:'设置首页打卡活动',wide:true,body:candidates.length?'<div class="r26-feature-list">'+candidates.map(activity=>'<label><input type="radio" name="r26FeatureActivity" value="'+ae(activity.id)+'" '+(S().featuredCheckinActivityId===activity.id?'checked':'')+'><span><b>'+ae(activity.name)+'</b><small>'+ae(activity.start+' 至 '+activity.end)+' · '+ae(checkinStatus(activity))+'</small></span></label>').join('')+'</div>':'<p class="r3-empty">暂无启用且未结束的打卡活动。</p>',footer:C.ab('取消','close-modal')+C.ab('设为首页活动','r26-feature-save','','primary')});
  });
  C.ar3Action('r26-feature-save',async()=>{
    const id=document.querySelector('[name="r26FeatureActivity"]:checked')?.value;
    if(!id)throw Error('请选择一个打卡活动');
    await window.R3.cmd('ADMIN_FEATURE_CHECKIN',{id});
    C.closeModal();
    C.renderApp();
    window.__g7UI?.toast?.('首页活动已更新');
  });
  C.ar3Action('r26-checkin-find',()=>{
    localFilters.checkin.name=document.querySelector('[name="r26CheckinName"]')?.value.trim()||'';
    localFilters.checkin.desc=document.querySelector('[name="r26CheckinDesc"]')?.value.trim()||'';
    localFilters.checkin.status=document.querySelector('[name="r26CheckinStatus"]')?.value||'';
    localFilters.checkin.page=1;
    C.renderApp();
  });
  C.ar3Action('r26-checkin-reset',()=>{
    localFilters.checkin={name:'',desc:'',status:'',page:1,size:localFilters.checkin.size};
    C.renderApp();
  });
  C.ar3Action('r26-checkin-page',node=>{localFilters.checkin.page=Number(node.dataset.page)||1;C.renderApp();});
  C.ar3Action('r26-checkin-export',()=>{
    const rows=(S().checkinActivities||[]).filter(activity=>(!localFilters.checkin.name||includes(activity.name,localFilters.checkin.name))&&(!localFilters.checkin.desc||includes(activity.desc,localFilters.checkin.desc))&&(!localFilters.checkin.status||checkinStatus(activity)===localFilters.checkin.status));
    if(!rows.length)throw Error('当前筛选没有可导出的打卡活动');
    const dataRows=rows.map(activity=>({活动名称:activity.name,活动简介:activity.desc,活动时间:activity.start+' 至 '+activity.end,达标条件:'累计打卡 ≥ '+activity.targetDays+' 天',奖励:rewardContent((activity.rewards||[])[0]||{}),获奖上限:Number(activity.limit)||'不限',状态:checkinStatus(activity),发布时间:activity.publishedAt||''}));
    const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(dataRows),'打卡活动');XLSX.writeFile(workbook,'渡鸦管家-r26-打卡活动.xlsx');
  });

  function userStats(owner){
    const dates=[...new Set(owner.checkins||[])].sort(),set=new Set(dates);
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
    return {dates,streak,month:dates.filter(day=>day.startsWith(today().slice(0,7))).length,total:dates.length,last:dates.at(-1)||''};
  }
  function userActivities(owner){
    return (S().checkinActivities||[]).map(activity=>{
      const snapshot=window.R20Data.activitySnapshot(window.__DUYA_LOCAL__.store,activity,owner);
      const progress=owner.checkinProgress?.[activity.id]||{};
      const reward=progress.rewardEventKey?owner.rewards.find(item=>item.id===progress.rewardEventKey):null;
      return {activity,snapshot,progress,reward};
    }).filter(item=>item.snapshot.count>0);
  }
  function checkinUsersPage(){
    const page=localFilters.users;
    const rows=S().users.filter(owner=>!page.keyword||includes([owner.name,owner.id,owner.profile?.phone].join(' '),page.keyword)).map(owner=>({owner,stats:userStats(owner),activities:userActivities(owner)}));
    const view=rows.slice((page.page-1)*page.size,page.page*page.size);
    return C.ar3Head('用户打卡管理','按用户查看连续、本月、累计打卡天数，以及参加的打卡活动。')+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>用户数</span><strong>'+S().users.length+'</strong></div><div><span>本月有打卡</span><strong>'+rows.filter(row=>row.stats.month>0).length+'</strong></div><div><span>今日已打卡</span><strong>'+rows.filter(row=>row.stats.dates.includes(today())).length+'</strong></div><div><span>累计打卡人次</span><strong>'+rows.reduce((sum,row)=>sum+row.stats.total,0)+'</strong></div></div>'+
      '<section class="r3-card"><div class="g20-filter-row"><label class="g7-filter">用户<input name="r26CheckinUser" value="'+ae(page.keyword)+'" placeholder="用户名 / 用户ID / 手机号"></label><button type="button" class="button primary small" data-action="r26-checkin-user-find">查找</button><button type="button" class="button secondary small" data-action="r26-checkin-user-reset">重置</button></div>'+C.atable(['用户','连续打卡','本月打卡','累计打卡','最近打卡','参加打卡活动','操作'],view.map(({owner,stats,activities})=>[
        userIdentity(owner.id),
        stats.streak+' 天',stats.month+' 天',stats.total+' 天',ae(stats.last||'—'),
        '<span class="r26-cell-link" data-action="r26-checkin-user-detail" data-id="'+ae(owner.id)+'" role="button" tabindex="0">'+activities.length+' 个活动</span>',
        C.ab('详情','r26-checkin-user-detail','data-id="'+owner.id+'"','secondary small')
      ]))+pager('r26-checkin-user',rows.length,page)+'</section></section>';
  }
  C.V15_PAGES['checkin-users']=checkinUsersPage;
  function calendar(owner){
    const prefix=today().slice(0,7),year=prefix.slice(0,4),month=Number(prefix.slice(5,7)),days=new Date(Date.UTC(year,month,0)).getUTCDate(),offset=new Date(Date.UTC(year,month-1,1)).getUTCDay(),done=new Set(owner.checkins||[]);
    return '<div class="g20-calendar"><b>'+year+'年'+month+'月</b><div>'+['日','一','二','三','四','五','六'].map(day=>'<small>'+day+'</small>').join('')+Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,index)=>{const day=prefix+'-'+String(index+1).padStart(2,'0');return '<span class="'+(done.has(day)?'done ':'')+(day===today()?'today':'')+'">'+(index+1)+(done.has(day)?'<i>✓</i>':'')+'</span>';}).join('')+'</div></div>';
  }
  C.ar3Action('r26-checkin-user-detail',node=>{
    const owner=user(node.dataset.id);
    if(!owner)return;
    const stats=userStats(owner),activities=userActivities(owner);
    C.openModal({title:owner.name+' · 打卡详情',wide:true,body:'<div class="g20-user-overview"><div><span>当前连续</span><b>'+stats.streak+' 天</b></div><div><span>本月打卡</span><b>'+stats.month+' 天</b></div><div><span>累计打卡</span><b>'+stats.total+' 天</b></div><div><span>最近打卡</span><b>'+ae(stats.last||'—')+'</b></div></div>'+calendar(owner)+'<h3>参加的打卡活动</h3>'+C.atable(['活动名称','活动时间','统计打卡天数','达标状态','奖励及状态','获奖时间'],activities.map(item=>[
      '<span class="r26-cell-link" data-action="r26-open-user-activity" data-user="'+ae(owner.id)+'" data-activity="'+ae(item.activity.id)+'" role="button" tabindex="0">'+ae(item.activity.name)+'</span>',
      ae(item.activity.start+' 至 '+item.activity.end),
      item.snapshot.count+' / '+item.snapshot.target+' 天',
      C.badge(item.progress.status==='已获奖'?'已获奖':item.snapshot.qualified?'已达标':'进行中'),
      rewardCell(item.reward?[{...item.reward,type:item.reward.type,couponId:item.reward.config?.couponId,name:item.reward.name,count:item.reward.config?.count}]:[]),
      ae(item.progress.wonAt?C.dateTime(item.progress.wonAt):'—')
    ])),footer:C.ab('关闭','close-modal','','secondary')});
  });
  C.ar3Action('r26-checkin-user-find',()=>{
    localFilters.users.keyword=document.querySelector('[name="r26CheckinUser"]')?.value.trim()||'';
    localFilters.users.page=1;C.renderApp();
  });
  C.ar3Action('r26-checkin-user-reset',()=>{
    localFilters.users={keyword:'',page:1,size:localFilters.users.size};C.renderApp();
  });
  C.ar3Action('r26-checkin-user-page',node=>{localFilters.users.page=Number(node.dataset.page)||1;C.renderApp();});
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-action="r26-checkin-size"]')){localFilters.checkin.size=Number(event.target.value)||10;localFilters.checkin.page=1;C.renderApp();}
    if(event.target.matches('[data-action="r26-checkin-user-size"]')){localFilters.users.size=Number(event.target.value)||10;localFilters.users.page=1;C.renderApp();}
    if(event.target.matches('[data-action="r26-checkin-jump"]')){localFilters.checkin.page=Number(event.target.value)||1;C.renderApp();}
    if(event.target.matches('[data-action="r26-checkin-user-jump"]')){localFilters.users.page=Number(event.target.value)||1;C.renderApp();}
  });
  C.ar3Action('r26-open-user-activity',node=>{
    const trigger=document.createElement('button');
    trigger.dataset.action='g20-record-detail';
    trigger.dataset.user=node.dataset.user;
    trigger.dataset.activity=node.dataset.activity;
    document.body.append(trigger);
    trigger.click();
    trigger.remove();
  });

  function patchCouponForm(scope=document){
    if(C.state.page!=='coupon-form')return;
    const form=scope.querySelector('#r3-editor[data-entity="coupon"]');
    if(!form||form.querySelector('[data-r26-stack-max]'))return;
    const status=form.querySelector('[name="status"]')?.closest('label');
    if(!status)return;
    const current=Number(ar3Editing?.stackMax||1);
    status.insertAdjacentHTML('beforebegin','<label class="r3-field"><span>叠加规则</span><select data-r26-stack-max name="stackMax">'+Array.from({length:5},(_,index)=>{
      const value=index+1;
      return '<option value="'+value+'" '+(value===current?'selected':'')+'>'+(value===1?'不可叠加':'最多叠加 '+value+' 张')+'</option>';
    }).join('')+'</select><small>同一种优惠券每单仍最多使用一张。</small></label>');
  }
  function patchCouponDetail(scope=document){
    const root=scope.querySelector?.('#modal-root')||document.querySelector('#modal-root');
    const title=root?.querySelector('.modal-head h2,.modal-title')?.textContent.trim()||'';
    if(!title.startsWith('优惠券详情 ·'))return;
    const detail=root.querySelector('.g10-coupon-detail');
    if(!detail||detail.querySelector('[data-r26-stack-detail]'))return;
    const name=title.replace(/^优惠券详情\s*·\s*/,'').trim();
    const coupon=S().templates.find(item=>item.name===name);
    if(!coupon)return;
    const rule=Number(coupon.stackMax||1)>1?'最多叠加 '+coupon.stackMax+' 张':'不可与其他优惠券叠加';
    detail.insertAdjacentHTML('beforeend','<div data-r26-stack-detail><span>叠加规则</span><b>'+ae(rule)+'</b></div>');
  }

  function patchFoodUnits(scope=document){
    if(C.state.page!=='foods')return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const index=headerIndex(table,text=>text==='份量单位');
      if(index<0)return;
      for(const row of [table.tHead.rows[0],...table.tBodies[0]?.rows||[]])row.deleteCell(index);
    });
  }
  function removeCheckinExport(scope=document){
    if(C.state.page!=='checkin-users')return;
    scope.querySelectorAll('button,.button').forEach(button=>{if(button.textContent.trim()==='导出')button.remove();});
  }

  function enhance(scope=document){
    removeBulk(scope);
    patchFoodUnits(scope);
    patchCouponForm(scope);
    patchCouponDetail(scope);
    enhanceSwitches(scope);
    enhanceRewardCells(scope);
    filterTabs(scope);
    removeCheckinExport(scope);
  }

  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-r26-switch]');
    if(input)changeStatus(input);
  });
  document.addEventListener('keydown',event=>{
    const target=event.target.closest('.r26-cell-link,.r26-count-link');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.click();}
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('.g6-clear'))setTimeout(()=>filterTabs(document),0);
  });
  const decorateBase=window.G7?.decorate;
  if(decorateBase){
    window.G7.decorate=function(){
      const result=decorateBase.apply(this,arguments);
      enhance(arguments[0]||document);
      return result;
    };
  }
  const renderBase=C.renderApp;
  C.renderApp=function(){
    const result=renderBase.apply(this,arguments);
    enhance(document);
    return result;
  };
  const openBase=C.openModal;
  C.openModal=function(){
    const result=openBase.apply(this,arguments);
    enhance(document);
    return result;
  };
  const cmdBase=window.R3.cmd;
  window.R3.cmd=function(type,payload={},id){
    if(type==='ADMIN_SAVE'&&payload.entity==='coupon'&&C.state?.page==='coupon-form'){
      const stackMax=Number(document.querySelector('[data-r26-stack-max]')?.value||payload.record?.stackMax||1);
      payload={...payload,record:{...payload.record,stackMax}};
    }
    return cmdBase.call(this,type,payload,id);
  };
  window.R26={rewardCell,userIdentity,filterTabs,enhance};
})();
