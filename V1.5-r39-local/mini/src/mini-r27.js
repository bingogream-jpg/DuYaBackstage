  // V1.5-r27 invitation, coupon, home activity and nutrition refinements.
  (()=>{
    const MEALS=['早餐','午餐','晚餐','加餐'];
    const MACROS=[['carb','碳水'],['protein','蛋白质'],['fat','脂肪']];
    const today=()=>r3Date();
    const userById=id=>r3.state.users.find(user=>user.id===id);
    const inviteQuery=()=>window.R23Invite.query(r3.state,r3Me().id);
    const inviteRows=()=>inviteQuery().rows.slice().sort((a,b)=>Date.parse(b.boundAt)-Date.parse(a.boundAt));
    const rewardTime=reward=>Date.parse(reward?.time||reward?.issuedAt||reward?.createdAt||0)||0;
    const latestReward=()=>inviteQuery().rewards.reduce((latest,reward)=>rewardTime(reward)>rewardTime(latest)?reward:latest,null);
    const seenMap=()=>{
      r3UI.r27RewardSeenAtByUser=r3UI.r27RewardSeenAtByUser||{};
      return r3UI.r27RewardSeenAtByUser;
    };
    function rewardUnread(userId=r3Me()?.id){
      const latest=latestReward();
      if(!latest||!rewardTime(latest))return false;
      const seen=Date.parse(seenMap()[userId]||0)||0;
      return rewardTime(latest)>seen;
    }
    function markRewardsRead(userId=r3Me()?.id){
      const latest=latestReward();
      if(!latest)return;
      seenMap()[userId]=new Date(rewardTime(latest)||Date.now()).toISOString();
      try{r3SaveDraft();}catch{}
    }
    const dateText=value=>value?new Date(value).toLocaleDateString('zh-CN'):'—';
    const r27Flow=()=>r3UI.r25?.flow||{};
    const currentTarget=()=>r3UI.r25?.targetDraft||window.R25Nutrition.getTarget(r3Me());
    const rewardName=reward=>reward?.type==='coupon'
      ?(r3.state.templates.find(template=>template.id===reward.config?.couponId)?.name||reward.name||'优惠券')
      :reward?.type==='meal'?'赠餐 '+Number(reward.config?.count||1)+' 餐':reward?.name||'自定义奖励';
    const rewardType=reward=>({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[reward?.type]||'奖励');

    function inviteRuleContent(){
      const q=inviteQuery();
      return '<div class="r27-rules-sheet"><section><small>活动简介</small><b>'+esc(String(q.settings.inviteIntro||'').trim()||'暂无活动简介')+'</b></section><section><small>活动时间</small><b>'+esc(q.time)+'</b></section><section><small>有效邀请条件</small><b>'+esc(q.settings.userInviteConditionLabel||q.settings.conditionLabel||'完成初始设置')+'</b></section><section><small>补填期限</small><b>新用户注册后 '+q.days+' 天内可补填</b></section><section><small>邀请人阶段奖励</small>'+(q.stages.length?'<div class="r27-rule-stages">'+q.stages.map(stage=>'<article><b>'+esc(stage.name)+'</b><p>'+esc(stage.inviter?.conditionLabel||stage.desc||'按活动条件达成')+'</p><em>'+esc((stage.inviter?.rewards||[]).map(rewardName).join('、')||'不发放')+'</em></article>').join('')+'</div>':'<p>当前暂无邀请人奖励</p>')+'</section><p class="r27-rule-note">有效邀请以完成生效条件为准，实际奖励以奖励记录状态为准。</p></div>';
    }
    function inviteCodeCard(){
      const q=inviteQuery(),owner=q.user,revealed=Boolean(owner.inviteCode&&owner.inviteCodeRevealedAt),code=revealed?owner.inviteCode:'',canReveal=owner.inviteCode||q.available;
      const cap=q.settings.cap?q.settings.cap:0,effective=q.effective||0;
      return '<section class="r27-invite-card"><header><div><small>MY INVITATION</small><h1>我的邀请码</h1></div><span class="r27-status">'+esc(q.state)+'</span></header>'+
        (code?'<div class="r27-code">'+esc(code)+'</div><div class="r27-code-actions">'+v15Btn('复制邀请码','v15-copy-code','','ghost')+'<button class="v27-primary" data-act="v15-poster" '+(!q.available?'disabled':'')+'>邀请海报</button></div>':'<div class="r27-generate"><p>点击生成你的专属邀请码</p><button class="v27-primary" data-act="v15-gen-code" '+(!canReveal?'disabled':'')+'>生成我的邀请码</button></div>')+
        '<div class="r27-invite-summary"><div><span>有效邀请</span><b>'+effective+(cap?'<em> / '+cap+'</em>':'')+'</b></div><div><span>活动时间</span><b>'+esc(q.time)+'</b></div></div>'+
        (q.reason?'<p class="r27-reason">'+esc(q.reason)+'</p>':'')+
        '<footer><span>有效邀请 / 可邀请人数以绑定占用为准</span><button data-act="r25-invite-rules">活动规则 ›</button></footer></section>';
    }
    function inviteRecordList(){
      const rows=inviteRows();
      return '<section class="r27-record-card"><header><h2>邀请记录</h2><span>'+rows.length+' 条</span></header>'+
        (rows.length?rows.map(row=>{
          const invitee=userById(row.userId);
          return '<article class="r27-invite-row"><span class="r27-avatar">'+esc((invitee?.name||'用').slice(0,1))+'</span><div><b>'+esc(invitee?.name||row.userId)+'</b><small>'+esc(dateText(row.boundAt))+' · '+esc(row.code)+'</small></div><em class="'+(['已达成','有效'].includes(row.status)?'done':'')+'">'+esc(row.status==='有效'?'已达成':row.status)+'</em></article>';
        }).join(''):'<div class="r27-empty">还没有邀请记录</div>')+'</section>';
    }
    function rewardLink(){
      return '<button class="r27-reward-link" data-act="r27-open-rewards"><span>'+I('gift')+'</span><div><b>奖励记录'+(rewardUnread()?'<i class="r27-dot" aria-label="有新奖励"></i>':'')+'</b><small>查看邀请奖励和发放状态</small></div><em>›</em></button>';
    }
    function inviteHome(){
      return '<div class="v15-page r27-invite-page">'+inviteCodeCard()+inviteRecordList()+rewardLink()+'</div>';
    }
    SCREENS.invite={...SCREENS.invite,title:'邀请码',noTab:true,render:inviteHome};
    SCREENS.inviteOwn={...SCREENS.invite,render:inviteHome};
    SCREENS.inviteRecords={...SCREENS.invite,render:inviteHome};
    ACTIONS['r25-invite-rules']=()=>bottomSheet('活动规则',inviteRuleContent(),{dismissible:true});
    ACTIONS['r27-open-rewards']=()=>{markRewardsRead();go('inviteRewards');};
    SCREENS.inviteRewards.title='奖励记录';
    SCREENS.inviteRewards.render=()=>{
      const rewards=inviteQuery().rewards.slice().sort((a,b)=>rewardTime(b)-rewardTime(a));
      markRewardsRead();
      return '<div class="v15-page r27-rewards-page"><header class="r27-subpage-head"><div><small>REWARDS</small><h1>奖励记录</h1></div><span>'+rewards.length+' 条</span></header>'+
        (rewards.length?'<div class="r27-reward-list">'+rewards.map(reward=>'<article class="r27-reward-card"><header><span>'+esc(rewardType(reward))+'</span><em>'+esc(reward.status||'已发放')+'</em></header><h2>'+esc(rewardName(reward))+'</h2><p>'+esc(reward.source||'邀请奖励')+'</p><footer><span>'+esc(dateText(reward.time||reward.issuedAt||reward.createdAt))+'</span>'+(reward.reason?'<small>'+esc(reward.reason)+'</small>':'')+'</footer>'+(reward.image?'<img src="'+esc(window.__offlineAsset(reward.image))+'" alt="奖励图片">':'')+'</article>').join('')+'</div>':'<div class="r27-empty-state">'+I('gift')+'<b>暂无奖励记录</b><p>达成邀请条件后，奖励会显示在这里。</p></div>')+'</div>';
    };
    SCREENS.invitePoster.render=function(){
      const q=inviteQuery(),owner=q.user,code=owner.inviteCode||'';
      if(!code)return '<div class="v15-page r3-empty"><h2>请先生成邀请码</h2>'+v15Btn('返回邀请码','local-invite-go','data-route="invite"')+'</div>';
      let qr='';try{qr=window.G13QR.canvas(code,8).toDataURL('image/png');}catch{}
      return '<div class="v15-page r27-poster-page"><article class="r27-poster"><span class="r27-poster-brand">渡鸦管家</span><h1>把好好吃饭<br>分享给朋友</h1><p>一起记录每一餐的健康节奏</p><div class="r27-poster-code"><small>我的邀请码</small><b>'+esc(code)+'</b></div>'+(qr?'<img class="r27-poster-qr" src="'+qr+'" alt="邀请码二维码">':'')+'<div class="r27-poster-footer"><span>'+esc(q.time)+'</span><em>'+esc(q.stages.map(stage=>stage.name).join('、')||'邀请人奖励')+'</em></div></article><button class="r27-save-poster" data-act="v15-save-poster">保存海报截图</button></div>';
    };

    SCREENS.coupons.render=function(){
      const tab=V15().couponTab||'可用',all=V15().coupons||[],tabs=['可用','已使用','已过期'];
      const list=all.filter(coupon=>coupon.status===tab).sort((a,b)=>String(a.expire).localeCompare(String(b.expire)));
      const available=all.filter(coupon=>coupon.status==='可用').length;
      return '<div class="v15-page r27-coupon-page"><header class="r27-coupon-head"><div><small>MY COUPONS</small><h1>优惠券</h1></div><span><b>'+available+'</b> 张可用</span></header>'+
        '<div class="r27-coupon-tabs">'+tabs.map(value=>'<button class="'+(value===tab?'on':'')+'" data-act="v15-coupon-tab" data-tab="'+value+'">'+value+'<em>'+all.filter(coupon=>coupon.status===value).length+'</em></button>').join('')+'</div>'+
        '<div class="r27-coupon-list">'+(list.length?list.map(coupon=>'<article class="r27-coupon-card '+(coupon.status!=='可用'?'muted':'')+'" data-act="v15-coupon-detail" data-id="'+esc(coupon.id)+'"><div class="r27-coupon-value"><small>¥</small><b>'+v15Num(coupon.amount)+'</b><span>'+(coupon.threshold?'满 '+coupon.threshold+' 元':'无门槛')+'</span></div><div class="r27-coupon-main"><header><h2>'+esc(coupon.name)+'</h2><em>'+esc(coupon.status)+'</em></header><p>'+esc(coupon.brands||'全部品牌')+'</p><footer><span>有效期至 '+esc(coupon.expire)+'</span><button data-act="v25-coupon-use" data-id="'+esc(coupon.id)+'" '+(coupon.status==='可用'?'':'disabled')+'>'+(coupon.status==='可用'?'去使用':'不可用')+' ›</button></footer></div></article>').join(''):'<div class="r27-empty-state"><b>暂无'+tab+'优惠券</b><p>参与活动后，奖励会出现在这里。</p></div>')+'</div></div>';
    };

    function sortedActivities(){
      return (r3.state.checkinActivities||[]).filter(activity=>activity.status==='启用').sort((a,b)=>{
        const aFeatured=a.id===r3.state.featuredCheckinActivityId?1:0,bFeatured=b.id===r3.state.featuredCheckinActivityId?1:0;
        return bFeatured-aFeatured||String(b.start||'').localeCompare(String(a.start||''));
      });
    }
    const activityStatus=activity=>window.R20Data.activityStatus(activity,today())||'尚未开始';
    const activityWon=activity=>{
      const key=r3Me()?.checkinProgress?.[activity.id]?.rewardEventKey;
      return key?r3Me().rewards.find(reward=>reward.id===key):null;
    };
    const activityRewards=activity=>(activity.rewards||[]).map(reward=>reward.type==='coupon'
      ?(r3.state.templates.find(template=>template.id===reward.couponId)?.name||'优惠券')
      :reward.type==='meal'?'赠餐 '+Number(reward.count||1)+' 餐':reward.name||'自定义奖励').join('、')||'活动奖励';
    let activeActivityId=null;
    SCREENS.checkinActivities.render=function(){
      const activities=sortedActivities();
      return '<div class="v15-page r27-activity-page"><div class="r27-activity-list">'+(activities.length?activities.map(activity=>{
        const won=activityWon(activity),featured=activity.id===r3.state.featuredCheckinActivityId;
        return '<button class="r27-activity-card" data-act="r27-open-activity" data-id="'+esc(activity.id)+'"><header><div><h2>'+esc(activity.name)+'</h2><span>'+esc(activity.start+' 至 '+activity.end)+'</span></div><em>'+esc(activityStatus(activity))+'</em></header><p>'+esc(activity.desc)+'</p><footer>'+(featured?'<i>首页推荐</i>':'')+'<span>'+esc(activityRewards(activity))+'</span><b>查看详情 ›</b></footer>'+(won?'<div class="r27-won">已获奖 · '+esc(won.name)+'</div>':'')+'</button>';
      }).join(''):'<div class="r27-empty-state"><b>暂无打卡活动</b><p>新活动发布后会显示在这里。</p></div>')+'</div></div>';
    };
    SCREENS.checkinActivityDetail.render=function(){
      const activity=r3.state.checkinActivities.find(item=>item.id===activeActivityId)||sortedActivities()[0];
      if(!activity)return '<div class="v15-page r27-empty-state"><b>活动不存在</b></div>';
      const won=activityWon(activity),progress=r3Me()?.checkinProgress?.[activity.id]||{};
      return '<div class="v15-page r27-activity-detail"><section class="r27-activity-title"><span>'+esc(activityStatus(activity))+'</span><h1>'+esc(activity.name)+'</h1><p>'+esc(activity.desc)+'</p></section>'+
        '<section class="r27-detail-card"><div class="r27-detail-grid"><div><small>活动时间</small><b>'+esc(activity.start+' 至 '+activity.end)+'</b></div><div><small>达标天数</small><b>累计 '+activity.targetDays+' 天</b></div><div><small>已累计</small><b>'+(progress.checkinDays||0)+' 天</b></div><div><small>获奖状态</small><b>'+(won?esc(won.name):'暂未获奖')+'</b></div></div></section>'+
        '<section class="r27-detail-section"><small>活动奖励</small><b>'+esc(activityRewards(activity))+'</b><p>按活动期累计打卡天数结算，每个用户每个活动最多获奖一次。</p></section>'+
        '<section class="r27-detail-section"><small>参与记录</small><b>'+(progress.status||'待参与')+'</b><p>'+(won?'奖励状态：'+esc(window.R36Rewards?.label(won,r3.state,Date.parse(r3.state.now))||won.status):'达到 '+activity.targetDays+' 天后自动参与结算。')+'</p></section></div>';
    };
    r3Act('r27-open-activity-list',()=>go('checkinActivities'));
    r3Act('r27-open-activity',node=>{activeActivityId=node.dataset.id;go('checkinActivityDetail');});

    function mealItems(){return (r3Me()?.diet||[]).filter(item=>item.date===today());}
    function mealButton(meal,items){
      const total=Math.round(items.reduce((sum,item)=>sum+Number(item.kcal||0),0)*10)/10;
      return '<button class="r27-meal-quick" data-act="r25-meal-open" data-meal="'+meal+'"><span>'+meal+'</span><b>'+(items.length?total+' kcal':'＋ 添加')+'</b><small>'+items.length+' 项</small></button>';
    }
    function mealRecordRow(item){
      return '<button class="r27-diet-row" data-act="r25-edit-diet" data-id="'+esc(item.id)+'"><span class="r27-meal-tag">'+esc(item.meal)+'</span><div><b>'+esc(item.name)+'</b><small>'+v15Num(item.grams)+'g · '+(item.kcal==null?'热量暂无':v15Num(item.kcal)+' kcal')+'</small></div><em>›</em></button>';
    }
    function homeDietCard(){
      const items=mealItems();
      return '<section class="r4-card r27-home-diet" data-r4-section="diet"><header><h3>'+r4Icon('meal')+'今日饮食记录</h3><button class="r4-history" data-act="r4-diet-history">'+r4Icon('clock')+'历史记录</button></header><div class="r27-meal-row">'+MEALS.map(meal=>mealButton(meal,items.filter(item=>item.meal===meal))).join('')+'</div><div class="r27-diet-list">'+(items.length?MEALS.flatMap(meal=>items.filter(item=>item.meal===meal)).map(mealRecordRow).join(''):'<div class="r27-empty">今天还没有饮食记录，点击餐次开始添加。</div>')+'</div></section>';
    }
    const homeBase=SCREENS.home.render;
    SCREENS.home.render=function(){
      const box=document.createElement('div');box.innerHTML=homeBase();
      box.querySelectorAll('.r3-weight-link').forEach(node=>node.remove());
      box.querySelectorAll('.r25-home-diet').forEach(node=>node.replaceWith(createNode(homeDietCard())));
      const activity=box.querySelector('.r25-home-activity');
      if(activity){activity.dataset.act='r27-open-activity-list';activity.removeAttribute('data-id');}
      return box.innerHTML;
    };
    function createNode(html){const box=document.createElement('div');box.innerHTML=html;return box.firstElementChild;}

    const menuBase=SCREENS.menu.render;
    SCREENS.menu.render=function(){
      const box=document.createElement('div');box.innerHTML=menuBase();
      box.querySelectorAll('.v15-rec-entry').forEach(node=>node.remove());
      return box.innerHTML;
    };

    const foodImageMap={主食:'grain.png',肉蛋奶:'meal-1.jpg',蔬菜:'meal-2.jpg',水果:'goal-food.png',汤羹:'noodle.png',饮品:'water-glass.jpg',套餐菜品:'shop-salad.png'};
    const foodImage=food=>assetImg('assets/'+(food?.image||foodImageMap[food?.cat]||'shop-salad.png'),'r27-food-image');
    SCREENS.dietSearch.render=function(){
      const keyword=(V15().foodKeyword||'').trim(),storedCategory=V15().foodCat||'最近',category=storedCategory==='全部'?'最近':storedCategory,view=V15().foodView==='收藏'?'收藏':'最近',categories=['最近','主食','肉蛋奶','蔬菜','水果','汤羹','饮品','套餐菜品'],recent=V15().recentFoods||[];
      let foods=V15_FOODS.filter(food=>(category==='最近'?recent.includes(food.name):food.cat===category)&&(!keyword||food.name.includes(keyword)));
      if(view==='最近')foods=[...foods].sort((a,b)=>{
       const ai=recent.indexOf(a.name),bi=recent.indexOf(b.name);
       if(ai<0&&bi<0)return 0;
       if(ai<0)return 1;
       if(bi<0)return -1;
       return ai-bi;
      });
      if(view==='收藏')foods=foods.filter(food=>(V15().favoriteFoods||[]).includes(food.name));
      return '<div class="v15-page r27-food-page"><header class="r27-food-head"><button data-act="back">'+I('back')+'</button><div><small>FOOD LIBRARY</small><h1>选择食物</h1></div><span>'+(r27Flow().added?'本次已添加 '+r27Flow().added+' 项':'')+'</span></header>'+
        '<div class="r27-food-search"><input id="v15-food-kw" value="'+esc(keyword)+'" placeholder="搜索食物名称"><button data-act="v15-search">搜索</button></div>'+
        '<div class="r27-food-tools"><div class="r27-view-tabs">'+['最近','收藏'].map(value=>'<button class="'+(view===value?'on':'')+'" data-act="r2-food-view" data-value="'+value+'">'+value+'</button>').join('')+'</div><div class="r27-methods">'+[['v15-custom-open','自定义','edit'],['v15-barcode-open','扫码','scan']].map(([act,label,icon])=>'<button data-act="'+act+'">'+I(icon)+'<span>'+label+'</span></button>').join('')+'</div></div>'+
        '<div class="r27-food-body"><nav class="r27-cats">'+categories.map(value=>'<button class="'+(value===category?'on':'')+'" data-act="v15-food-cat" data-cat="'+value+'">'+(value==='主食'?'自定义':value)+'</button>').join('')+'</nav><div class="r27-food-results">'+(foods.length?foods.map(food=>'<article class="r27-food-card">'+foodImage(food)+'<button class="r27-food-main" data-act="v15-food-pick" data-name="'+esc(food.name)+'"><b>'+esc(food.name)+'</b><small>'+v15Num(food.kcal)+' kcal/100g</small><em>碳 '+v15Num(food.carb,1)+' · 蛋 '+v15Num(food.protein,1)+' · 脂 '+v15Num(food.fat,1)+'</em></button><button class="r27-favorite '+(Boolean((V15().favoriteFoods||[]).includes(food.name))?'on':'')+'" data-act="r2-food-favorite" data-name="'+esc(food.name)+'" aria-label="收藏食物">'+(Boolean((V15().favoriteFoods||[]).includes(food.name))?'★':'☆')+'</button></article>').join(''):'<div class="r27-empty">没有找到食物，试试其他关键词。</div>')+'</div></div></div>';
    };

    function macroCard(key,label,target,mode){
      const pct=Number(target.percentages[key])||0,grams=Number(target.grams[key])||0;
      const input=mode==='percent'?'<input data-r25-target="pct-'+key+'" type="number" min="0" max="100" step="0.1" value="'+pct+'"><em>%</em>':'<input data-r25-target="gram-'+key+'" type="number" min="0" max="1500" step="0.1" value="'+grams+'"><em>g</em>';
      return '<article class="r27-target-card"><header><span>'+label+'</span><label>'+input+'</label></header><i><em style="width:'+Math.max(0,Math.min(100,pct))+'%"></em></i><footer>'+(mode==='percent'?v15Num(grams,1)+' 克':v15Num(pct,1)+'%')+'</footer></article>';
    }
    SCREENS.nutritionTarget.render=function(){
      const target=currentTarget(),mode=r3UI.r25?.targetMode||'percent';
      const total=Object.values(target.percentages).reduce((sum,value)=>sum+Number(value||0),0);
      return '<div class="v15-page r27-target-page"><header class="r27-target-head"><small>NUTRITION TARGET</small><h1>每日营养目标</h1><p>按「'+esc(r3Me()?.goal||'健康饮食')+'」推荐，可自由调整</p></header><section class="r27-target-form"><div class="r25-mode-tabs"><button class="'+(mode==='percent'?'on':'')+'" data-act="r25-target-mode" data-mode="percent">按比例</button><button class="'+(mode==='grams'?'on':'')+'" data-act="r25-target-mode" data-mode="grams">按克重</button></div><label class="r27-kcal"><span>每日热量</span><input data-r25-target="kcal" type="number" min="500" max="6000" value="'+target.kcal+'"><em>kcal</em></label><div class="r27-target-grid">'+MACROS.map(([key,label])=>macroCard(key,label,target,mode)).join('')+'</div><p class="r25-total-meter '+(Math.abs(total-100)<.2?'ok':'warn')+'">三大营养素合计 '+v15Num(total,1)+'%</p><div class="r25-target-actions"><button class="v15-btn ghost" data-act="r25-target-reset">恢复推荐值</button><button class="v15-btn" data-act="r25-target-save">保存目标</button></div></section></div>';
    };

    const percentageTotal=target=>Object.values(target?.percentages||{}).reduce((sum,value)=>sum+Number(value||0),0);
    window.R27Mini={rewardUnread,markRewardsRead,sortedActivities,percentageTotal};
  })();
