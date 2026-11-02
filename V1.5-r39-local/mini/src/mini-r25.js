  // V1.5-r25 mini-program invitation, nutrition target and meal recording redesign.
  (()=>{
    const MEALS=['早餐','午餐','晚餐','加餐'];
    const MACROS=[['carb','碳水'],['protein','蛋白质'],['fat','脂肪']];
    const PORTION_MACROS=[['kcal','热量'],...MACROS];
    const RATIOS={
      '健康饮食':{carb:50,protein:20,fat:30},
      '减重':{carb:45,protein:25,fat:30},
      '增肌':{carb:45,protein:30,fat:25},
      '减脂':{carb:40,protein:30,fat:30}
    };
    const round1=value=>Math.round(Number(value||0)*10)/10;
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
    const mealItems=date=>(r3Me()?.diet||[]).filter(item=>item.date===date);
    const currentTarget=()=>window.R25Nutrition.getTarget(r3Me());
    const nutrition=()=>window.R25Nutrition.totals(mealItems(r3Date()));
    const userById=id=>r3.state.users.find(user=>user.id===id);
    const todayIntake=()=>window.R25Nutrition.totals(mealItems(r3Date()));

    function targetFromPercent(kcal,percentages){
      kcal=clamp(kcal,500,6000);
      const p={
        carb:round1(percentages.carb),
        protein:round1(percentages.protein),
        fat:round1(percentages.fat)
      };
      return {
        kcal:Math.round(kcal),percentages:p,
        grams:{
          carb:round1(kcal*p.carb/100/4),
          protein:round1(kcal*p.protein/100/4),
          fat:round1(kcal*p.fat/100/9)
        }
      };
    }
    function targetFromGrams(grams){
      const g=Object.fromEntries(MACROS.map(([key])=>[key,round1(clamp(grams[key],0,1500))]));
      const kcal=Math.max(1,round1(g.carb*4+g.protein*4+g.fat*9));
      const percentages={
        carb:round1(g.carb*4/kcal*100),
        protein:round1(g.protein*4/kcal*100),
        fat:round1(g.fat*9/kcal*100)
      };
      const diff=round1(100-percentages.carb-percentages.protein-percentages.fat);
      percentages.fat=round1(percentages.fat+diff);
      return {kcal,grams:g,percentages};
    }
    function recommendedTarget(user=r3Me()){
      const ratio=RATIOS[user?.goal]||RATIOS['健康饮食'];
      return targetFromPercent(Number(r3.state.settings.references?.kcal)||1333,ratio);
    }
    function getTarget(user=r3Me()){
      const saved=user?.nutritionTarget;
      if(saved&&saved.kcal&&saved.grams&&saved.percentages)return saved;
      return recommendedTarget(user);
    }
    function spreadPercentage(target,key,value){
      const next=round1(clamp(value,0,100));
      const others=MACROS.map(([name])=>name).filter(name=>name!==key);
      const rest=round1(100-next);
      const oldTotal=others.reduce((sum,name)=>sum+Number(target.percentages[name]||0),0);
      const a=oldTotal>0?round1(rest*Number(target.percentages[others[0]]||0)/oldTotal):round1(rest/2);
      const b=round1(rest-a);
      return targetFromPercent(target.kcal,{[key]:next,[others[0]]:a,[others[1]]:b});
    }
    function totals(items){
      const out={kcal:0,carb:0,protein:0,fat:0};
      for(const item of items||[])for(const key of Object.keys(out))out[key]+=item.pending?0:Number(item[key])||0;
      for(const key of Object.keys(out))out[key]=round1(out[key]);
      return out;
    }
    window.R25Nutrition={RATIOS,recommended:recommendedTarget,getTarget,targetFromPercent,targetFromGrams,spreadPercentage,totals};

    function r25State(){
      r3UI.r25=r3UI.r25||{targetDraft:null,targetMode:'percent',flow:{meal:'午餐',date:r3Date(),editId:null,added:0,searchScroll:0,activityId:null}};
      r3UI.r25.flow=r3UI.r25.flow||{meal:'午餐',date:r3Date(),editId:null,added:0,searchScroll:0,activityId:null};
      return r3UI.r25;
    }
    const saveDraft=()=>r3SaveDraft();
    const mealTotal=items=>round1(items.reduce((sum,item)=>sum+(item.pending?0:Number(item.kcal)||0),0));
    const macroText=item=>[['carb','碳'],['protein','蛋'],['fat','脂']].map(([key,label])=>label+' '+v15Num(item[key],1)+'g').join(' · ');
    const imageMap={主食:'grain.png',肉蛋奶:'meal-1.jpg',蔬菜:'meal-2.jpg',水果:'goal-food.png',汤羹:'noodle.png',饮品:'water-glass.jpg',套餐菜品:'shop-salad.png'};
    const foodImage=food=>assetImg('assets/'+(food?.image||imageMap[food?.cat]||'shop-salad.png'),'r25-food-image');
    const selectedFood=()=>{
      const draft=V15().dietDraft||{};
      return V15_FOODS.find(food=>food.id===draft.foodId)||V15_FOODS.find(food=>food.name===draft.name)||null;
    };
    const inviteQuery=()=>window.R23Invite.query(r3.state,r3Me().id);
    const inviteRows=()=>inviteQuery().rows.slice().sort((a,b)=>Date.parse(b.boundAt)-Date.parse(a.boundAt));
    const inviteEffective=()=>inviteRows().filter(row=>['已达成','有效'].includes(row.status)).length;
    const inviteDate=value=>value?new Date(value).toLocaleDateString('zh-CN'):'—';

    function inviteStats(){
      const q=inviteQuery(),count=inviteEffective();
      return '<div class="r25-invite-stat"><div><span>有效邀请</span><b>'+count+(q.cap? '<em> / '+q.cap+'</em>':'')+'</b><small>'+(q.cap?'有效邀请 / 可邀请人数':'当前有效邀请')+'</small></div><div class="r25-stat-mark">'+I('partners')+'</div></div>';
    }
    function inviteRecordList(){
      const rows=inviteRows();
      return '<section class="r25-invite-records"><header><h3>邀请记录</h3><span>'+rows.length+' 条</span></header>'+(rows.length?rows.map(row=>{const owner=userById(row.userId);return '<article class="r25-invite-record"><span class="r25-avatar">'+esc((owner?.name||'用').slice(0,1))+'</span><div><b>'+esc(owner?.name||row.userId)+'</b><small>'+esc(inviteDate(row.boundAt))+' · '+esc(row.code)+'</small></div><em class="'+(['已达成','有效'].includes(row.status)?'done':'')+'">'+esc(row.status==='有效'?'已达成':row.status)+'</em></article>';}).join(''):'<div class="r25-empty">还没有邀请记录</div>')+'</section>';
    }
    function inviteRulesContent(){
      const q=inviteQuery();
      return '<div class="r25-rules-sheet"><p><b>活动时间</b><span>'+esc(q.time)+'</span></p><p><b>有效邀请条件</b><span>'+esc(q.settings.userInviteConditionLabel||q.settings.conditionLabel||'完成初始设置')+'</span></p><p><b>邀请人奖励</b><span>'+esc(q.stages.map(stage=>stage.name).join('、')||'当前暂无邀请奖励')+'</span></p><p><b>补填期限</b><span>新用户注册后 '+q.days+' 天内可补填</span></p><p class="r3-muted">有效邀请以完成生效条件为准，实际奖励以奖励记录状态为准。</p></div>';
    }
    function inviteHome(){
      const q=inviteQuery(),owner=q.user,revealed=Boolean(owner.inviteCode&&owner.inviteCodeRevealedAt),code=revealed?owner.inviteCode:'';
      const canReveal=owner.inviteCode||q.available;
      return '<div class="v15-page r25-invite-page"><section class="r25-code-card"><header><div><small>MY INVITATION</small><h2>我的邀请码</h2></div><span>'+esc(q.state)+'</span></header>'+(code?'<div class="r25-code">'+esc(code)+'</div><div class="r25-code-actions">'+v15Btn('复制邀请码','v15-copy-code','','ghost')+'<button class="v25-primary" data-act="v15-poster" '+(!q.available?'disabled':'')+'>邀请海报</button></div>':'<div class="r25-generate"><p>首次使用点击生成专属邀请码</p><button class="v25-primary" data-act="v15-gen-code" '+(!canReveal?'disabled':'')+'>生成我的邀请码</button></div>')+(q.reason?'<p class="r25-reason">'+esc(q.reason)+'</p>':'')+'<footer><span>'+esc(q.time)+'</span><button data-act="r25-invite-rules">活动规则 ›</button></footer></section>'+inviteStats()+inviteRecordList()+'<button class="r25-reward-link" data-act="local-invite-go" data-route="inviteRewards"><span>'+I('gift')+'</span><div><b>奖励记录</b><small>查看邀请奖励和发放状态</small></div><em>›</em></button></div>';
    }
    const inviteBase=SCREENS.invite;
    SCREENS.invite={...inviteBase,title:'邀请码',noTab:true,render:inviteHome};
    SCREENS.inviteOwn={...SCREENS.invite,render:inviteHome};
    SCREENS.inviteRecords={...SCREENS.invite,title:'邀请码',render:inviteHome};
    r3Act('v15-gen-code',async()=>{const q=inviteQuery(),owner=r3Me();if(!owner.inviteCode&&!q.available)throw Error(q.reason||'当前无法生成邀请码');await r3.cmd('INVITE_GENERATE',{});render();toast(owner.inviteCode?'邀请码已生成':'原邀请码已找回');});
    ACTIONS['r25-invite-rules']=()=>bottomSheet('活动规则',inviteRulesContent(),{dismissible:true});
    SCREENS.invitePoster.render=function(){
      const q=inviteQuery(),owner=q.user,code=owner.inviteCode||'';
      if(!code)return '<div class="v15-page r3-empty"><h2>请先生成邀请码</h2>'+v15Btn('返回邀请码','local-invite-go','data-route="invite"')+'</div>';
      let qr='';
      try{qr=window.G13QR.canvas(code,8).toDataURL('image/png');}catch(e){qr='';}
      return '<div class="v15-page r25-poster-page"><article class="r25-poster"><span class="r25-poster-brand">渡鸦管家</span><h1>认真吃饭<br>也认真分享</h1><p>邀请好友一起开启健康饮食</p><div class="r25-poster-code"><small>我的邀请码</small><b>'+esc(code)+'</b></div>'+(qr?'<img class="r25-poster-qr" src="'+qr+'" alt="邀请码二维码">':'')+'<div class="r25-poster-time">'+esc(q.time)+'</div><div class="r25-poster-reward">'+esc(q.stages.map(stage=>stage.name).join('、')||'邀请人奖励')+'</div></article>'+v15Fixed(v15Btn('保存海报截图','v15-save-poster'))+'</div>';
    };
    const r25OldGo=go;
    go=function(route,options){if(route==='inviteOwn'||route==='inviteRecords')route='invite';return r25OldGo(route,options);};

    SCREENS.coupons.render=function(){
      const tab=V15().couponTab||'可用',tabs=['可用','已使用','已过期'],all=V15().coupons||[];
      const list=all.filter(coupon=>coupon.status===tab).sort((a,b)=>(a.expire||'').localeCompare(b.expire||''));
      const available=all.filter(coupon=>coupon.status==='可用');
      return '<div class="v15-page r25-coupon-page"><section class="r25-coupon-summary"><div><small>MY COUPONS</small><h1>优惠券</h1><p>'+available.length+' 张可用，选一张享受更好的每一餐</p></div><b>'+available.length+'<small>可用</small></b></section><div class="v15-tabs r25-coupon-tabs">'+tabs.map(value=>'<button class="'+(value===tab?'on':'')+'" data-act="v15-coupon-tab" data-tab="'+value+'">'+value+' <em>'+all.filter(coupon=>coupon.status===value).length+'</em></button>').join('')+'</div><div class="r25-coupon-list">'+(list.length?list.map(coupon=>'<article class="r25-coupon-card '+(coupon.status!=='可用'?'muted':'')+'" data-act="v15-coupon-detail" data-id="'+esc(coupon.id)+'"><div class="r25-coupon-value"><small>¥</small><b>'+v15Num(coupon.amount)+'</b><span>'+(coupon.threshold?'满 '+coupon.threshold+' 元可用':'无门槛')+'</span></div><div class="r25-coupon-content"><div><h3>'+esc(coupon.name)+'</h3><p>'+esc(coupon.brands||'全部品牌')+'</p></div><footer><span>有效期至 '+esc(coupon.expire)+'</span><em>'+esc(coupon.status)+'</em></footer>'+(coupon.status==='可用'?'<button data-act="v25-coupon-use" data-id="'+esc(coupon.id)+'">去使用</button>':'')+'</div></article>').join(''):'<div class="r25-empty r25-coupon-empty"><b>暂无'+tab+'优惠券</b><p>完成活动或问卷后，奖励会出现在这里</p></div>')+'</div></div>';
    };
    SCREENS.couponDetail.render=function(){
      const coupon=V15().coupons.find(item=>item.id===V15().couponId)||V15().coupons[0];
      if(!coupon)return '<div class="v15-page r3-empty"><h2>优惠券不存在</h2></div>';
      return '<div class="v15-page r25-coupon-detail"><section class="r25-coupon-hero"><small>'+esc(coupon.status)+'</small><div><span>¥</span><b>'+v15Num(coupon.amount)+'</b></div><h1>'+esc(coupon.name)+'</h1><p>'+(coupon.threshold?'满 '+coupon.threshold+' 元可用':'无门槛使用')+'</p></section><section class="card r25-coupon-info">'+[['可用品牌',coupon.brands||'全部品牌'],['有效期',coupon.expire],['来源',coupon.source],['状态',coupon.status]].map(([label,value])=>'<div><span>'+label+'</span><b>'+esc(value)+'</b></div>').join('')+'<p>'+esc(coupon.desc||'每单限用一张优惠券，具体使用范围以订单结算页为准。')+'</p></section>'+(coupon.status==='可用'?v15Fixed(v15Btn('去使用','v25-coupon-use','data-id="'+esc(coupon.id)+'"')):'<p class="r25-muted-note">该券当前不可使用</p>')+'</div>';
    };
    r3Act('v25-coupon-use',()=>go('menu'));

    function activityStatus(activity){return window.R20Data.activityStatus(activity,r3Date());}
    function activityReward(activity){return (activity.rewards||[]).map(reward=>reward.type==='coupon'?(r3.state.templates.find(template=>template.id===reward.couponId)?.name||'优惠券'):reward.type==='meal'?'赠餐 '+Number(reward.count||1)+' 餐':reward.name||'自定义奖励').join('、')||'活动奖励';}
    function activityWon(activity){const user=r3Me(),key=user?.checkinProgress?.[activity.id]?.rewardEventKey;return key?user.rewards.find(reward=>reward.id===key):null;}
    function featuredActivity(){return r3.state.checkinActivities.find(activity=>activity.id===r3.state.featuredCheckinActivityId&&activity.status==='启用');}
    function compactActivity(){
      const activity=featuredActivity();
      return activity?'<button class="r25-home-activity" data-act="r25-open-activity" data-id="'+esc(activity.id)+'"><span><b>'+esc(activity.name)+'</b><small>'+esc(activity.start+' 至 '+activity.end)+'</small></span><em>›</em></button>':'';
    }
    function activityDetail(){
      const activity=r3.state.checkinActivities.find(item=>item.id===r25State().flow.activityId)||featuredActivity();
      if(!activity)return '<div class="v15-page r25-empty">活动不存在</div>';
      const won=activityWon(activity),progress=r3Me()?.checkinProgress?.[activity.id]||{};
      return '<div class="v15-page r25-activity-detail"><section class="r25-activity-white"><span>'+esc(activityStatus(activity))+'</span><h1>'+esc(activity.name)+'</h1><p>'+esc(activity.desc)+'</p></section><section class="card r25-activity-info">'+[['活动时间',activity.start+' 至 '+activity.end],['达标条件','累计打卡 ≥ '+activity.targetDays+' 天'],['活动奖励',activityReward(activity)],['已累计',(progress.checkinDays||0)+' 天'],['获奖状态',won?won.name+' · '+won.status:'未获奖']].map(([label,value])=>'<div><span>'+label+'</span><b>'+esc(value)+'</b></div>').join('')+'</section><button class="r25-secondary-button" data-act="r25-more-activities">查看全部活动 ›</button></div>';
    }
    SCREENS.checkinActivities.render=function(){
      const activities=(r3.state.checkinActivities||[]).filter(activity=>activity.status==='启用');
      return '<div class="v15-page r25-activity-page"><header class="r25-page-title"><small>ACTIVITIES</small><h1>全部活动</h1><p>每个活动独立计算，达标后自动发奖</p></header>'+activities.map(activity=>{const won=activityWon(activity);return '<button class="r25-activity-list-card" data-act="r25-open-activity" data-id="'+esc(activity.id)+'"><header><b>'+esc(activity.name)+'</b><em>'+esc(activityStatus(activity))+'</em></header><p>'+esc(activity.desc)+'</p><footer><span>'+esc(activity.start+' 至 '+activity.end)+'</span><span>'+esc(activityReward(activity))+'</span></footer>'+(won?'<div class="r25-activity-won">已获奖：'+esc(won.name)+' · '+esc(won.status)+'</div>':'')+'</button>';}).join('')+'</div>';
    };
    SCREENS.checkinActivityDetail={title:'活动详情',logo:true,noTab:true,navStyle:{bg:'#f8faf7',ink:'#1f2b24'},render:activityDetail};
    r3Act('r25-open-activity',node=>{r25State().flow.activityId=node.dataset.id;go('checkinActivityDetail');});
    r3Act('r25-more-activities',()=>go('checkinActivities'));
    const r25HomeBase=SCREENS.home.render;
    SCREENS.home.render=function(){
      const box=document.createElement('div');box.innerHTML=r25HomeBase();
      box.querySelectorAll('.r4-intake').forEach(node=>node.replaceWith(createFromHTML(nutritionHomeCard())));
      box.querySelectorAll('.r4-diet').forEach(node=>node.replaceWith(createFromHTML(homeMealsCard())));
      box.querySelectorAll('.r20-home-activity,.r20-more-activities').forEach(node=>node.remove());
      const checkin=box.querySelector('.r4-checkin');
      if(checkin)checkin.insertAdjacentHTML('beforeend',compactActivity());
      return box.innerHTML;
    };
    function createFromHTML(html){const box=document.createElement('div');box.innerHTML=html;return box.firstElementChild;}
    function nutritionHomeCard(){
      const t=todayIntake(),target=currentTarget();
      return '<section class="r4-card r25-nutrition-home" data-r4-section="intake"><header><h3>'+r4Icon('flame')+'今日营养摄入</h3><button class="r25-icon-button" data-act="r25-open-target" aria-label="调整营养目标">'+r4Icon('settings')+'</button></header><div class="r25-energy-main"><b>'+v15Num(t.kcal)+'</b><span>/ '+target.kcal+' kcal</span><em class="'+(t.kcal>target.kcal?'over':'')+'">'+(t.kcal>target.kcal?'超出 '+v15Num(t.kcal-target.kcal):'剩余 '+v15Num(Math.max(0,target.kcal-t.kcal)))+'</em></div><div class="r25-home-macros">'+MACROS.map(([key,label])=>'<div><span>'+label+'</span><b>'+v15Num(t[key],1)+' / '+v15Num(target.grams[key],1)+'g</b><small>剩余 '+v15Num(Math.max(0,target.grams[key]-t[key]),1)+'g</small></div>').join('')+'</div><button class="r4-water" data-act="water" aria-label="记录饮水"><span class="r4-glass">'+r4Icon('glass')+'</span><span><small>今日饮水</small><b>'+v15Num((state.drinkMl||0)/1000,2)+' <em>L</em></b></span><i class="r4-water-add">'+r4Icon('plus')+'</i></button></section>';
    }
    function homeMealsCard(){
      const items=mealItems(r3Date());
      return '<section class="r4-card r25-home-diet" data-r4-section="diet"><header><h3>'+r4Icon('meal')+'今日饮食记录</h3><button class="r4-history" data-act="r4-diet-history">'+r4Icon('clock')+'历史记录</button></header><div class="r25-home-meals">'+MEALS.map(meal=>{const list=items.filter(item=>item.meal===meal);return '<section class="r25-home-meal"><button class="r25-meal-head" data-act="r25-meal-open" data-meal="'+meal+'"><span><b>'+meal+'</b><small>'+(list.length?list.map(item=>item.name).slice(0,2).join('、'):'还没有记录')+'</small></span><em>'+(list.length?v15Num(mealTotal(list))+' kcal':'添加 ›')+'</em></button></section>';}).join('')+'</div></section>';
    }
    r3Act('r25-meal-open',node=>{
      const date=state.route==='home'?r3Date():(V15().dietDate||r3Date()),s=r25State();s.flow={...s.flow,meal:node.dataset.meal,date,editId:null,added:0,searchScroll:0};
      V15().dietDate=date;V15().dietDraft={meal:node.dataset.meal};V15().foodKeyword='';V15().foodCat='全部';V15().foodView='全部';saveDraft();go('dietSearch');
    });

    function targetPage(){
      const target=r25State().targetDraft||currentTarget(),mode=r25State().targetMode||'percent';
      const row=(key,label)=>'<div class="r25-target-row"><span>'+label+'</span>'+(mode==='percent'?'<label><input data-r25-target="pct-'+key+'" type="number" min="0" max="100" step="0.1" value="'+target.percentages[key]+'"><em>%</em></label><small>'+v15Num(target.grams[key],1)+' 克</small>':'<label><input data-r25-target="gram-'+key+'" type="number" min="0" max="1500" step="0.1" value="'+target.grams[key]+'"><em>克</em></label><small>'+v15Num(target.percentages[key],1)+'%</small>')+'</div>';
      return '<div class="v15-page r25-target-page"><header class="r25-page-title"><small>NUTRITION TARGET</small><h1>每日营养目标</h1><p>根据「'+esc(r3Me()?.goal||'健康饮食')+'」推荐，可自由调整</p></header><section class="card r25-target-form"><div class="r25-mode-tabs"><button class="'+(mode==='percent'?'on':'')+'" data-act="r25-target-mode" data-mode="percent">按比例</button><button class="'+(mode==='grams'?'on':'')+'" data-act="r25-target-mode" data-mode="grams">按克重</button></div><label class="r25-kcal-input"><span>每日热量</span><input data-r25-target="kcal" type="number" min="500" max="6000" value="'+target.kcal+'"><em>kcal</em></label><div class="r25-target-list">'+MACROS.map(([key,label])=>row(key,label)).join('')+'</div><p class="r25-total-meter '+(Math.abs(Object.values(target.percentages).reduce((a,b)=>a+b,0)-100)<.2?'ok':'warn')+'">比例合计 '+v15Num(Object.values(target.percentages).reduce((a,b)=>a+b,0),1)+'%</p><div class="r25-target-actions"><button class="v15-btn ghost" data-act="r25-target-reset">恢复推荐值</button><button class="v15-btn" data-act="r25-target-save">保存目标</button></div></section></div>';
    }
    SCREENS.nutritionTarget={title:'营养目标',logo:true,noTab:true,navStyle:{bg:'#f8faf7',ink:'#1f2b24'},render:targetPage};
    ACTIONS['r25-open-target']=()=>{const s=r25State();s.targetDraft=currentTarget();s.targetMode='percent';saveDraft();go('nutritionTarget');};
    r3Act('r25-target-mode',node=>{const s=r25State();s.targetMode=node.dataset.mode;saveDraft();render();});
    r3Act('r25-target-reset',()=>{const s=r25State();s.targetDraft=recommendedTarget();saveDraft();render();});
    r3Act('r25-target-save',async()=>{const target=r25State().targetDraft||currentTarget();await r3.cmd('NUTRITION_TARGET_SAVE',{target});r25State().targetDraft=null;saveDraft();go('home',{root:true,tab:'home'});toast('营养目标已保存');});
    document.addEventListener('change',event=>{
      const input=event.target.closest('[data-r25-target]');if(!input)return;
      const s=r25State(),current=s.targetDraft||currentTarget(),kind=input.dataset.r25Target;
      if(kind==='kcal')s.targetDraft=targetFromPercent(Number(input.value),current.percentages);
      else if(kind.startsWith('pct-'))s.targetDraft=spreadPercentage(current,kind.slice(4),input.value);
      else if(kind.startsWith('gram-')){const grams={...current.grams,[kind.slice(5)]:input.value};s.targetDraft=targetFromGrams(grams);}
      saveDraft();render();
    });

    SCREENS.dietSearch.render=function(){
      const keyword=(V15().foodKeyword||'').trim(),category=V15().foodCat||'全部',view=V15().foodView||'全部';
      const categories=['全部','主食','肉蛋奶','蔬菜','水果','汤羹','饮品','套餐菜品'];
      let foods=V15_FOODS.filter(food=>(category==='全部'||food.cat===category)&&(!keyword||food.name.includes(keyword)||food.cat.includes(keyword)));
      if(view==='最近')foods=foods.filter(food=>(V15().recentFoods||[]).includes(food.name));
      if(view==='收藏')foods=foods.filter(food=>(V15().favoriteFoods||[]).includes(food.name));
      const flow=r25State().flow;
      return '<div class="v15-page r25-food-page"><header class="r25-food-head"><button data-act="back">'+I('back')+'</button><div><small>添加到</small><h1>'+esc(flow.meal||'午餐')+'</h1></div><span>'+(flow.added?'本次已添加 '+flow.added+' 项':'选择食物')+'</span></header><div class="r25-food-methods">'+[['v15-custom-open','手动填写','edit'],['v15-photo-open','拍照上传','camera'],['v15-barcode-open','扫条形码','scan']].map(([act,label,icon])=>'<button data-act="'+act+'"><i>'+I(icon)+'</i><b>'+label+'</b></button>').join('')+'</div><div class="r25-food-search"><input id="v15-food-kw" value="'+esc(keyword)+'" placeholder="搜索食物名称、分类"><button data-act="v15-search">搜索</button></div><div class="v25-scroll-tabs">'+['全部','最近','收藏'].map(value=>'<button class="'+(view===value?'on':'')+'" data-act="r2-food-view" data-value="'+value+'">'+value+'</button>').join('')+'</div><div class="v15-cats">'+categories.map(value=>'<button class="v15-chip v15-chip-btn '+(value===category?'on':'')+'" data-act="v15-food-cat" data-cat="'+value+'">'+value+'</button>').join('')+'</div><div class="r25-food-list">'+(foods.length?foods.map(food=>'<div class="r25-food-card">'+foodImage(food)+'<button class="r25-food-main" data-act="v15-food-pick" data-name="'+esc(food.name)+'"><span><b>'+esc(food.name)+'</b><small>'+esc(food.cat)+' · '+v15Num(food.kcal)+' kcal/100g</small><em>碳 '+v15Num(food.carb,1)+' · 蛋 '+v15Num(food.protein,1)+' · 脂 '+v15Num(food.fat,1)+'</em></span></button><button class="r25-favorite '+(Boolean((V15().favoriteFoods||[]).includes(food.name))?'on':'')+'" data-act="r2-food-favorite" data-name="'+esc(food.name)+'" aria-label="收藏食物">'+(Boolean((V15().favoriteFoods||[]).includes(food.name))?'★':'☆')+'</button></div>').join(''):'<div class="r25-empty">没有找到食物，试试其他关键词或手动填写</div>')+'</div></div>';
    };
    const oldFoodPick=ACTIONS['v15-food-pick'];ACTIONS['v15-food-pick']=n=>{r25State().flow.searchScroll=$('#stage').scrollTop;const food=V15_FOODS.find(item=>item.name===n.dataset.name);V15().dietDraft={...(V15().dietDraft||{}),foodId:food?.id||null,name:n.dataset.name,grams:food?.units?.[0]?.[1]||100,meal:r25State().flow.meal};saveDraft();oldFoodPick(n);};
    const oldPhotoPick=ACTIONS['v15-photo-pick'];ACTIONS['v15-photo-pick']=n=>{const food=V15_FOODS.find(item=>item.name===n.dataset.name);V15().dietDraft={...(V15().dietDraft||{}),foodId:food?.id||null,meal:r25State().flow.meal};saveDraft();oldPhotoPick(n);};
    ACTIONS['r25-back-to-activity-list']=()=>go('checkinActivities');

    function portionNumber(){
      const raw=Number($('#v15-grams')?.value);return Number.isFinite(raw)&&raw>0?raw:0;
    }
    function portionMacros(food,grams){const ratio=grams/100;return Object.fromEntries(['kcal','carb','protein','fat'].map(key=>[key,food?.[key]==null?null:round1(Number(food[key])*ratio)]));}
    SCREENS.dietPortion.render=function(){
      const draft=V15().dietDraft||{},food=selectedFood();
      if(!food)return '<div class="v15-page r3-empty">请选择食物后录入。</div>';
      const grams=Number(draft.grams||food.units?.[0]?.[1]||100),values=portionMacros(food,grams);
      const editing=Boolean(r25State().flow.editId);
      return '<div class="v15-page r25-portion-page"><header class="r25-portion-head">'+foodImage(food)+'<div><small>添加到 '+esc(draft.meal||r25State().flow.meal||'午餐')+'</small><h1>'+esc(food.name)+'</h1><p>每100克 '+v15Num(food.kcal)+' kcal</p></div></header><section class="card r25-portion-card"><h3>选择份量</h3><div class="r25-unit-grid">'+food.units.map(unit=>'<button data-act="v15-unit" data-grams="'+unit[1]+'">1'+esc(unit[0])+' · '+unit[1]+'g</button>').join('')+'<button data-act="v15-unit" data-grams="100">100g</button></div><label class="r25-grams"><span>实际克重</span><input id="v15-grams" type="number" min="1" step="0.1" value="'+grams+'"><em>g</em></label><div class="r25-portion-macros">'+PORTION_MACROS.map(([key,label])=>'<div><span>'+label+'</span><b data-r25-portion="'+key+'">'+(values[key]==null?'暂无':v15Num(values[key],1))+'</b><small>'+(key==='kcal'?'kcal':'g')+'</small></div>').join('')+'</div></section><div class="r25-portion-actions">'+(editing?'<button class="v25-primary wide" data-act="r25-portion-finish">保存修改</button>':'<button class="v25-primary" data-act="r25-portion-continue">确认并继续添加</button><button class="r25-secondary-button" data-act="r25-portion-finish">确认并完成</button>')+'</div></div>';
    };
    document.addEventListener('input',event=>{if(event.target.id!=='v15-grams'||state.route!=='dietPortion')return;const food=selectedFood(),grams=Number(event.target.value);if(!food)return;V15().dietDraft={...(V15().dietDraft||{}),grams};const values=portionMacros(food,grams);document.querySelectorAll('[data-r25-portion]').forEach(node=>{const key=node.dataset.r25Portion;node.textContent=values[key]==null?'暂无':v15Num(values[key],1);});});
    async function savePortion(continueAdding){
      const food=selectedFood();if(!food)throw Error('请先选择食物');
      const grams=portionNumber();if(!grams)throw Error('请填写有效份量');
      const flow=r25State().flow,draft=V15().dietDraft||{};
      if(flow.editId)await r3.cmd('DIET_UPDATE',{id:flow.editId,foodId:food.id,grams,meal:draft.meal||flow.meal});
      else await r3.cmd('DIET_ADD',{foodId:food.id,grams,meal:draft.meal||flow.meal,date:flow.date||r3Date()});
      if(continueAdding&&!flow.editId){flow.added=(flow.added||0)+1;V15().dietDraft={meal:draft.meal||flow.meal};V15().dietDate=flow.date||r3Date();saveDraft();const scroll=flow.searchScroll||0;go('dietSearch',{keepScroll:true});requestAnimationFrame(()=>{$('#stage').scrollTop=scroll;});toast('已添加，可继续选择');return;}
      V15().dietDraft=null;saveDraft();go('dietHome');toast(flow.editId?'饮食记录已更新':'饮食已记录');
    }
    r3Act('r25-portion-continue',()=>savePortion(true));r3Act('r25-portion-finish',()=>savePortion(false));

    SCREENS.dietCustom.render=function(){
      const d=V15().dietDraft||{},editing=Boolean(r25State().flow.editId);
      return '<div class="v15-page r25-manual-page"><header class="r25-page-title"><small>MANUAL ENTRY</small><h1>手动填写</h1><p>添加到 '+esc(d.meal||r25State().flow.meal||'午餐')+'</p></header><section class="card r25-manual-form">'+[['name','食物名称','text'],['grams','重量','number'],['kcal','热量','number'],['carb','碳水','number'],['protein','蛋白质','number'],['fat','脂肪','number']].map(([key,label,type])=>'<label><span>'+label+'</span><input type="'+type+'" data-r25-manual="'+key+'" value="'+esc(d[key]==null?'':d[key])+'"><em>'+(key==='kcal'?'kcal':key==='name'?'':'g')+'</em></label>').join('')+'</section><div class="r25-portion-actions">'+(editing?'<button class="v25-primary wide" data-act="r25-manual-finish">保存修改</button>':'<button class="v25-primary" data-act="r25-manual-continue">保存并继续添加</button><button class="r25-secondary-button" data-act="r25-manual-finish">保存并完成</button>')+'</div></div>';
    };
    async function saveManual(continueAdding){
      const rows={};document.querySelectorAll('[data-r25-manual]').forEach(node=>rows[node.dataset.r25Manual]=node.value);
      if(!rows.name?.trim())throw Error('请填写食物名称');if(!(Number(rows.grams)>0))throw Error('请填写有效重量');
      for(const key of ['kcal','carb','protein','fat'])if(rows[key]!==''&&(!Number.isFinite(Number(rows[key]))||Number(rows[key])<0))throw Error('营养值须为非负数字');
      const flow=r25State().flow,draft=V15().dietDraft||{},payload={name:rows.name.trim(),grams:Number(rows.grams),kcal:rows.kcal===''?null:Number(rows.kcal),carb:rows.carb===''?null:Number(rows.carb),protein:rows.protein===''?null:Number(rows.protein),fat:rows.fat===''?null:Number(rows.fat),meal:draft.meal||flow.meal,date:flow.date||r3Date()};
      if(flow.editId)await r3.cmd('DIET_UPDATE',{...payload,id:flow.editId});else await r3.cmd('DIET_ADD',payload);
      if(continueAdding&&!flow.editId){flow.added=(flow.added||0)+1;V15().dietDraft={meal:payload.meal};r3UI.dietDraft={...V15().dietDraft};saveDraft();go('dietSearch',{keepScroll:true});toast('已添加，可继续选择');}else{V15().dietDraft=null;r3UI.dietDraft=null;saveDraft();go('dietHome');toast('饮食已保存');}
    }
    r3Act('r25-manual-continue',()=>saveManual(true));r3Act('r25-manual-finish',()=>saveManual(false));

    SCREENS.dietPhoto.render=function(){
      const step=V15().photoStep||'idle',cands=V15().photoCandidates||[];
      return '<div class="v15-page r25-photo-page"><header class="r25-page-title"><small>PHOTO</small><h1>拍照识别</h1><p>添加到 '+esc(r25State().flow.meal||'午餐')+' · 演示识别</p></header><button class="r25-photo-box" data-act="v15-photo-shot">'+I('scan')+'<b>'+(step==='idle'?'拍照或从相册选择':step==='analyzing'?'正在识别…':'重新拍照')+'</b></button>'+(step==='done'?'<section class="r25-photo-results"><h3>请选择食物</h3>'+cands.map(candidate=>{const food=V15_FOODS.find(item=>item.name===candidate.name);return '<button class="r25-photo-result" data-act="v15-photo-pick" data-name="'+esc(candidate.name)+'">'+(food?foodImage(food):'')+'<span><b>'+esc(candidate.name)+'</b><small>置信度 '+candidate.conf+'%</small></span><em>'+(candidate.conf<60?'需确认':'选择 ›')+'</em></button>';}).join('')+'<button class="r25-text-link" data-act="v15-photo-degrade">都不是，改用搜索</button></section>':'')+'</div>';
    };
    SCREENS.dietBarcode.render=function(){
      const code=V15().barcode||'',hit=V15_FOODS.find(food=>food.barcode===code);
      return '<div class="v15-page r25-barcode-page"><header class="r25-page-title"><small>BARCODE</small><h1>扫条形码</h1><p>添加到 '+esc(r25State().flow.meal||'午餐')+'</p></header><section class="card r25-barcode-card"><div class="r25-scan-window">'+I('scan')+'</div><label class="r25-barcode-input"><span>包装食品条码</span><input id="v15-barcode" value="'+esc(code)+'" placeholder="输入或模拟扫描"><button data-act="v15-barcode-scan">模拟扫描</button></label><button class="v25-primary wide" data-act="v15-barcode-query">查询条码</button>'+(code?(hit?'<button class="r25-photo-result" data-act="v15-food-pick" data-name="'+esc(hit.name)+'">'+foodImage(hit)+'<span><b>'+esc(hit.name)+'</b><small>已命中食物库 · '+v15Num(hit.kcal)+' kcal/100g</small></span><em>选择 ›</em></button>':'<div class="r25-empty">未找到该条码<button data-act="v15-photo-degrade">改用搜索</button></div>'):'')+'</section></div>';
    };

    function dietRing(t,target){
      const pct=target?.kcal?Math.min(100,t.kcal/target.kcal*100):0;
      return '<div class="r25-calorie-ring" style="--r25-pct:'+pct+'%"><div><b>'+Math.round(pct)+'%</b><span>'+v15Num(t.kcal)+' / '+(target?.kcal||'—')+'</span><small>kcal</small></div></div>';
    }
    function mealSection(meal,items){
      return '<section class="r25-record-meal"><header><div><h3>'+meal+'</h3><span>'+v15Num(mealTotal(items))+' kcal</span></div><button data-act="r25-meal-open" data-meal="'+meal+'">＋ 添加</button></header>'+(items.length?items.map((item,index)=>{const food=item.foodId?V15_FOODS.find(food=>food.id===item.foodId):null;return '<div class="r25-record-food">'+(food?foodImage(food):'<span class="r25-food-placeholder">'+I('meal')+'</span>')+'<button data-act="r25-edit-diet" data-id="'+esc(item.id)+'"><b>'+esc(item.name)+'</b><small>'+v15Num(item.grams)+'g · '+(item.kcal==null?'热量暂无':v15Num(item.kcal)+' kcal')+'</small><em>'+macroText(item)+'</em></button><button class="r25-delete" data-act="v15-diet-del" data-meal="'+meal+'" data-i="'+index+'">'+I('trash')+'</button></div>';}).join(''):'<button class="r25-empty-meal" data-act="r25-meal-open" data-meal="'+meal+'">还没有记录，点击添加'+meal+'</button>')+'</section>';
    }
    SCREENS.dietHome.render=function(){
      const date=V15().dietDate||r3Date(),items=mealItems(date),target=currentTarget(),t=totals(items);
      return '<div class="v15-page r25-record-page"><header class="r25-record-head"><div class="r25-date-switch"><button data-act="v15-diet-date" data-step="-1">‹</button><b>'+date.slice(5,7)+' 月 '+date.slice(8,10)+' 日</b><button data-act="v15-diet-date" data-step="1" '+(date>=r3Date()?'disabled':'')+'>›</button></div><button class="r25-target-link" data-act="r25-open-target">'+r4Icon('settings')+'调整目标</button></header><section class="card r25-record-summary">'+dietRing(t,target)+'<div class="r25-record-macros">'+MACROS.map(([key,label])=>'<div><span>'+label+'</span><b>'+v15Num(t[key],1)+' / '+v15Num(target.grams[key],1)+'g</b><i><em style="width:'+Math.min(100,target.grams[key]?t[key]/target.grams[key]*100:0)+'%"></em></i></div>').join('')+'</div></section>'+MEALS.map(meal=>mealSection(meal,items.filter(item=>item.meal===meal))).join('')+'</div>';
    };
    r3Act('r25-edit-diet',node=>{const item=r3Me().diet.find(row=>row.id===node.dataset.id);if(!item)return;const s=r25State();s.flow={...s.flow,editId:item.id,meal:item.meal,date:item.date};const food=item.foodId?V15_FOODS.find(food=>food.id===item.foodId):null;V15().dietDraft={...item,foodId:food?.id||item.foodId||null};saveDraft();if(food)go('dietPortion');else go('dietCustom');});
  })();
