// Final r37 interaction pass: stable tabs, actions, filters, form choices and pagers.
(()=>{
 const C=window.__g8Core;if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
 const A=window.R37Activities,E=window.__DUYA_LOCAL_ENGINE,Q=window.R36Review,S=()=>R3.state,e=C.ae;
 const b=(text,action,attrs='',kind='secondary small')=>C.ab(text,action,attrs,kind);
 const now=()=>Date.parse(S().now)||Date.now(),day=t=>E.dateKey(t);
 const store=()=>Object.assign(Object.create(E.Store.prototype),{data:S(),now});
 const identity=u=>window.R24Identity?.render(u)||'<b>'+e(u?.name||'—')+'</b><small>'+e(u?.id||'')+'</small>';
 const statuses=Q.dimensions;
 const stateCells=r=>window.R36AdminReview.stateCells(r);
 const matches=(r,value)=>Q.matches(r,value,S(),now());
 const pair=r=>Q.status(r,S(),now());
 const rewardTypes=Q.types;
 const filters={growth:{},record:{activity:'',user:'',status:'',from:'',to:''},reward:{}};
 const pages={growth:{page:1,size:10},record:{page:1,size:10},reward:{page:1,size:10},rewardModal:{page:1,size:10},checkin:{page:1,size:10}};
 let rewardView='summary';
 let rewardModal={userId:'',status:'',rows:[]};

 const tabs=(items,active,action='g6-tab',group='')=>'<div class="tabs g7-tabs r37-admin-tabs">'+items.map(([id,label])=>'<button type="button" class="tab-button '+(id===active?'active':'')+'" data-action="'+action+'" '+(group?'data-group="'+group+'" ':'')+'data-tab="'+id+'" data-view="'+id+'" aria-pressed="'+(id===active)+'">'+label+'</button>').join('')+'</div>';
 const input=(label,name,value='',placeholder='')=>'<label>'+label+'<input name="'+name+'" value="'+e(value)+'" placeholder="'+e(placeholder)+'"></label>';
 const select=(label,name,options,value='')=>'<label>'+label+'<select data-r28-flat="native" name="'+name+'">'+options.map(([v,t])=>'<option value="'+e(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+e(t)+'</option>').join('')+'</select></label>';
 const table=(heads,rows)=>'<div class="a37-scroll"><table class="r31-native-table a37-table" data-cols="'+heads.length+'"><thead><tr>'+heads.map(h=>'<th'+(h==='操作'?' class="a37-ops"':'')+'>'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(row=>'<tr>'+heads.map((_,i)=>{const cell=row[i];return '<td'+(heads[i]==='操作'?' class="a37-ops"':'')+'>'+(cell==null||cell===''?'—':cell)+'</td>';}).join('')+'</tr>').join(''):'<tr><td colspan="'+heads.length+'" class="r3-empty">暂无匹配数据</td></tr>')+'</tbody></table></div>';

 function pageNumbers(target,current,total){
  const values=[];for(let i=1;i<=total;i++)if(total<=7||i===1||i===total||Math.abs(i-current)<=1)values.push(i);
  return [...new Set(values)].map((value,index,all)=>`${index&&value-all[index-1]>1?'<span class="page-ellipsis">…</span>':''}<button type="button" class="${value===current?'active':''}" data-r37-page-target="${target}" data-r37-page="${value}">${value}</button>`).join('');
 }
 function pager(target,total,page,size){
  const state=pages[target],count=Math.max(1,Math.ceil(total/size)),current=Math.min(Math.max(1,page),count);
  state.page=current;
  return '<div class="g6-pagination table-footer r37-unified-pager" data-r37-pager="'+target+'"><span>共 '+total+' 条 · 第 '+current+' / '+count+' 页</span><div class="g8-pager"><div class="pagination"><button type="button" data-r37-page-target="'+target+'" data-r37-page="'+Math.max(1,current-1)+'" '+(current===1?'disabled':'')+'>上一页</button>'+pageNumbers(target,current,count)+'<button type="button" data-r37-page-target="'+target+'" data-r37-page="'+Math.min(count,current+1)+'" '+(current===count?'disabled':'')+'>下一页</button></div><div class="r28-choice-row" role="group" aria-label="每页条数">'+[10,20,30].map(value=>'<button type="button" data-r37-page-size="'+value+'" data-r37-size-target="'+target+'" class="'+(size===value?'on':'')+'">'+value+' 条/页</button>').join('')+'</div><label class="g8-jump">跳至 <input type="number" min="1" max="'+count+'" value="'+current+'" data-r37-jump-target="'+target+'"> 页</label></div></div>';
 }

 function exportRows(title,heads,rows){return window.R36AdminReview.xlsx(title,heads,rows);}
 function rewardPath(r){const value=window.R31?.rewardPath(r)||(/邀请/.test(r.source||'')?'用户邀请':/打卡/.test(r.source||'')?'打卡活动':/成长|活跃/.test(r.source||'')?'用户活动':'后台');return value.replaceAll('成长活动','用户活动').replaceAll('用户活跃活动','用户活动');}
 function rewardRecords(){
  return window.G17Rewards.records().filter(r=>!Q.status(r,S(),now()).revoked).map(r=>{
   const owner=S().users.find(u=>u.id===r.userId),activity=S().activities37?.find(a=>a.id===r.activity37Id||owner?.activityProgress37?.[a.id]?.rewardEventKey===r.id);
   return {...r,status:Q.status(r,S(),now()).label,path:rewardPath(r),activityName:activity?.name,userName:owner?.name||r.userName,phone:owner?.profile?.phone||r.phone};
  });
 }
 function filteredRewards(){
  const f=filters.reward;
  return rewardRecords().filter(r=>(!f.user||[r.userName,r.userId,r.phone].join(' ').includes(f.user))&&(!f.activity||[r.source,r.activityName].filter(Boolean).join(' ').includes(f.activity))&&(!f.type||r.type===f.type)&&(!f.status||pair(r).claimStatus===f.status)&&(!f.usage||pair(r).usageStatus===f.usage)&&(!f.path||r.path===f.path));
 }
 const typed=r=>window.R36AdminReview.typed(r);
 const statusHTML=r=>window.R36AdminReview.statusHTML(r);
 function rewardHeads(){return ['用户','奖励','获得途径','获得时间','领取状态','使用状态','操作'];}
 function rewardExportHeads(){return ['用户','奖励','获得途径','获得时间','领取状态','使用状态','订单ID'];}
 function rewardExportRows(rows){return rows.map(r=>[r.userName,r.name,r.path,r.time,pair(r).claimStatus,pair(r).usageStatus,pair(r).orderId||'']);}
 function rewardRows(rows){return rows.map(r=>{const ev=window.R36Rewards.eventFor(r,S())||r,custom=ev.type==='custom',canUndo=ev.issuedAt&&now()-Date.parse(ev.issuedAt)<86400000;return [identity(S().users.find(u=>u.id===r.userId)),typed(r),e(r.path)+'<small>'+e(r.activityName||r.source||'')+'</small>',e(C.dateTime(r.time)),...stateCells(r),custom?(ev.status==='已发放'?(canUndo?b('撤销发放','rev-custom','data-id="'+e(ev.id)+'" data-status="待领取"'):'<small>已超过可撤销时间</small>'):b('标记已发放','rev-custom','data-id="'+e(ev.id)+'" data-status="已发放"')):'—'];});}
 function rewardPage(){
  const all=filteredRewards(),state=pages.reward,heads=rewardHeads();
  let rows;
  if(rewardView==='details')rows=rewardRows(all);
  else{const map=new Map();for(const r of all){if(!map.has(r.userId))map.set(r.userId,{user:S().users.find(u=>u.id===r.userId),rows:[]});map.get(r.userId).rows.push(r);}const groups=[...map.values()];heads.splice(0,heads.length,'用户','奖励总数',...statuses,'最近获得');rows=groups.map(x=>[identity(x.user),b(String(x.rows.length),'r37-reward-user','data-user="'+x.user.id+'"','table-link'),...statuses.map(s=>b(String(x.rows.filter(r=>matches(r,s)).length),'r37-reward-user','data-user="'+x.user.id+'" data-status="'+s+'"','table-link')),e(C.dateTime(x.rows.map(r=>r.time).sort().at(-1)))]);}
  const first=(state.page-1)*state.size;
  return C.ar3Head('奖励记录','按真实领取、使用和发放事实查询。')+tabs([['summary','用户汇总'],['details','奖励明细']],rewardView,'r37-reward-view')+
   '<section class="r3-card r32-list-card"><div class="g6-filters a37-filters r37-filter-grid">'+input('用户','r37RewardUser',filters.reward.user||'','用户名 / ID / 手机号')+input('活动名称','r37RewardActivity',filters.reward.activity||'','活动名称 / 备注')+select('获得途径','r37RewardPath',[['','全部'],...['用户邀请','打卡活动','用户活跃活动','后台'].map(x=>[x,x])],filters.reward.path||'')+select('奖励类型','r37RewardType',[['','全部'],...Object.entries(rewardTypes)],filters.reward.type||'')+select('领取状态','r37RewardStatus',[['','全部'],...statuses.slice(0,4).map(x=>[x,x])],filters.reward.status||'')+select('使用状态','r37RewardUsage',[['','全部'],...statuses.slice(4).map(x=>[x,x]),['—','—']],filters.reward.usage||'')+'<div class="g19-filter-actions">'+b('查找','r37-reward-find','','primary small')+b('重置','r37-reward-reset')+'</div></div>'+
   '<div class="r32-actions-row r37-actions-row">'+b('导出','r37-reward-export')+'</div><div class="r32-table-divider"></div>'+table(heads,rows.slice(first,first+state.size))+pager('reward',rows.length,state.page,state.size)+'</section>';
 }
 C.V15_PAGES['invite-rewards']=rewardPage;
 C.ar3Action('r37-reward-view',n=>{rewardView=n.dataset.view==='details'?'details':'summary';pages.reward.page=1;C.renderApp();});
 C.ar3Action('r37-reward-find',()=>{filters.reward={user:document.querySelector('[name="r37RewardUser"]').value.trim(),activity:document.querySelector('[name="r37RewardActivity"]').value.trim(),path:document.querySelector('[name="r37RewardPath"]').value,type:document.querySelector('[name="r37RewardType"]').value,status:document.querySelector('[name="r37RewardStatus"]').value,usage:document.querySelector('[name="r37RewardUsage"]').value};pages.reward.page=1;C.renderApp();});
 C.ar3Action('r37-reward-reset',()=>{filters.reward={};pages.reward.page=1;C.renderApp();});
 C.ar3Action('r37-reward-export',()=>{const rows=filteredRewards();if(rewardView==='details')return exportRows('奖励明细',rewardExportHeads(),rewardExportRows(rows));const heads=['用户','奖励总数',...statuses,'最近获得'],values=[];const map=new Map();for(const r of rows){if(!map.has(r.userId))map.set(r.userId,{name:S().users.find(u=>u.id===r.userId)?.name||r.userName,rows:[]});map.get(r.userId).rows.push(r);}for(const x of map.values())values.push([x.name,x.rows.length,...statuses.map(s=>x.rows.filter(r=>matches(r,s)).length),x.rows.map(r=>r.time).sort().at(-1)]);return exportRows('用户奖励汇总',heads,values);});
 C.ar3Action('r37-reward-user',n=>{rewardModal={userId:n.dataset.user,status:n.dataset.status||'',rows:filteredRewards().filter(r=>r.userId===n.dataset.user&&(!n.dataset.status||matches(r,n.dataset.status)))};pages.rewardModal.page=1;renderRewardModal();});
 function renderRewardModal(){const state=pages.rewardModal,rows=rewardModal.rows,start=(state.page-1)*state.size;const title=(S().users.find(u=>u.id===rewardModal.userId)?.name||rewardModal.userId)+' · '+(rewardModal.status||'全部奖励');C.openModal({title,wide:true,body:'<div class="r37-actions-row r37-modal-actions">'+b('导出','r37-reward-modal-export')+'</div><div class="r37-modal-scroll">'+table(rewardHeads(),rewardRows(rows.slice(start,start+state.size)))+pager('rewardModal',rows.length,state.page,state.size)+'</div>',footer:b('关闭','close-modal')});}
 C.ar3Action('r37-reward-modal-export',()=>exportRows('奖励明细',rewardExportHeads(),rewardExportRows(rewardModal.rows)));

 function recordRows(){
  const f=filters.record;
  return A.completed(store()).filter(r=>(!f.activity||[r.activity.name,r.activity.id,r.activity.kind,'打卡活动','邀请活动','用户活跃活动'].join(' ').includes(f.activity))&&(!f.user||[r.user.name,r.user.id,r.user.profile?.phone].join(' ').includes(f.user))&&(!f.status||pair(r.reward).claimStatus===f.status)&&(!f.usage||pair(r.reward).usageStatus===f.usage)&&(!f.from||day(Date.parse(r.completedAt))>=f.from)&&(!f.to||day(Date.parse(r.completedAt))<=f.to));
 }
 function recordAggregate(rows,view){
  const grouped=new Map();
  for(const r of rows){const key=view==='users'?r.user.id:r.activity.id;if(!grouped.has(key))grouped.set(key,{r,count:0,activities:new Set(),users:new Set(),awarded:new Set(),last:''});const g=grouped.get(key);g.count++;g.activities.add(r.activity.id);g.users.add(r.user.id);if(r.awarded)g.awarded.add(r.reward.id);if(r.completedAt>g.last)g.last=r.completedAt;}
  return view==='users'?{heads:['用户','完成活动数','完成记录数','实际获奖数','最近完成'],rows:[...grouped.values()].map(g=>[identity(g.r.user),g.activities.size,g.count,g.awarded.size,e(C.dateTime(g.last))])}:{heads:['活动','完成记录','已达标人数','已获奖人数'],rows:[...grouped.values()].map(g=>[e(g.r.activity.name),g.count,g.users.size,g.awarded.size])};
 }
 function activityRecordsPage(){
  const view=C.g6Tabs.activityRecords||'participation',rows=recordRows(),state=pages.record;
  let heads,data;
  if(view==='participation'){heads=['活动','用户','达标时间','实际奖励','领取状态','使用状态'];data=rows.map(r=>{const tag=e(S().activityTags.find(t=>t.id===r.activity.tagId)?.name||'普通活动');return ['<span class="r37-activity-merged"><span class="rev-category-tag">'+tag+'</span>'+b(r.activity.name,'a37-detail','data-id="'+r.activity.id+'"','table-link')+'</span>',identity(r.user),e(C.dateTime(r.completedAt)),r.reward?typed(r.reward):'—',...stateCells(r.reward)];});}
  else{const projection=recordAggregate(rows,view);heads=projection.heads;data=projection.rows;}
  const start=(state.page-1)*state.size;
  return C.ar3Head('参与活动记录','统一查看打卡、邀请及活跃活动的完成记录。')+tabs([['participation','参与明细'],['activities','活动汇总'],['users','用户汇总']],view,'g6-tab','activityRecords')+
   '<section class="r3-card r32-list-card"><div class="g6-filters a37-filters r37-record-filters">'+input('活动','r37RecordActivityQuery',filters.record.activity,'活动名称 / ID / 类型')+input('用户','r37RecordUserQuery',filters.record.user,'用户名 / 用户ID / 手机号')+select('领取状态','r37RecordStatus',[['','全部'],...statuses.slice(0,4).map(x=>[x,x])],filters.record.status)+select('使用状态','r37RecordUsage',[['','全部'],...statuses.slice(4).map(x=>[x,x]),['—','—']],filters.record.usage||'')+'<label>开始日期<input type="date" name="r37RecordFrom" value="'+e(filters.record.from)+'"></label><label>结束日期<input type="date" name="r37RecordTo" value="'+e(filters.record.to)+'"></label><div class="g19-filter-actions">'+b('查找','r37-record-find','','primary small')+b('重置','r37-record-reset')+'</div></div>'+
   '<div class="r32-actions-row r37-actions-row">'+b('导出','r37-record-export')+'</div><div class="r32-table-divider"></div>'+table(heads,data.slice(start,start+state.size))+pager('record',data.length,state.page,state.size)+'</section>';
 }
 C.V15_PAGES['activity-records']=activityRecordsPage;
 C.ar3Action('r37-record-find',()=>{const from=document.querySelector('[name="r37RecordFrom"]').value,to=document.querySelector('[name="r37RecordTo"]').value;if(from&&to&&from>to)throw Error('开始日期不能晚于结束日期');filters.record={activity:document.querySelector('[name="r37RecordActivityQuery"]').value.trim(),user:document.querySelector('[name="r37RecordUserQuery"]').value.trim(),status:document.querySelector('[name="r37RecordStatus"]').value,usage:document.querySelector('[name="r37RecordUsage"]').value,from,to};pages.record.page=1;C.renderApp();});
 C.ar3Action('r37-record-reset',()=>{filters.record={activity:'',user:'',status:'',from:'',to:''};pages.record.page=1;C.renderApp();});
 C.ar3Action('r37-record-export',()=>{const view=C.g6Tabs.activityRecords||'participation',rows=recordRows();if(view==='participation')return exportRows('参与活动记录',['活动','用户','达标时间','实际奖励','领取状态','使用状态'],rows.map(r=>[(S().activityTags.find(t=>t.id===r.activity.tagId)?.name||'普通活动')+' · '+r.activity.name,r.user.name+' '+r.user.id,r.completedAt,r.rewardName,pair(r.reward).claimStatus,pair(r.reward).usageStatus]));const p=recordAggregate(rows,view);return exportRows(view==='users'?'参与活动用户汇总':'参与活动汇总',p.heads,p.rows.map(r=>r.map(x=>String(x).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())));});
 const audienceText=a=>({all:'全部用户',users:'指定用户 '+(a.audience?.userIds?.length||0)+' 人'})[a.audience?.mode]||'全部用户';
 const activityTime=a=>a.validityMode==='always'?'长期':a.start+' 至 '+a.end;
 const activityReward=a=>a.rewardMode==='none'?'不发放':(a.rewardMode==='probability'?'概率奖励':'固定奖励')+' · '+a.rewards.map(r=>r.type==='coupon'?S().templates.find(t=>t.id===r.couponId)?.name||'优惠券':r.type==='meal'?'赠餐 '+r.count+' 餐':r.name).join('、');
 function growthRows(){const f=filters.growth;return A.query(S(),null,now()).filter(x=>{const a=x.activity;return (!f.name||[a.name,a.intro,a.desc].filter(Boolean).join(' ').includes(f.name))&&(!f.tag||a.tagId===f.tag)&&(!f.status||x.status===f.status)&&(!f.range||a.validityMode===f.range)&&(!f.audience||a.audience.mode===f.audience);});}
 function activityListPage(){
  const f=filters.growth,state=pages.growth,rows=growthRows();
  const start=(state.page-1)*state.size;
  const heads=['活动名称','标签','生效人群','活动时间','达标要求 / 统计口径','奖励','已获奖/限制人数','启用/禁用','操作'];
  const data=rows.map(({activity:a,status,counts,tag})=>['<div class="r37-activity-name"><b>'+e(a.name)+'</b>'+C.badge(status)+'</div>'+(a.legacyOnly?'<small>历史活动，仅原用户参与</small>':'')+(a.personalSnapshots?'<small>已有用户保留个人快照</small>':'')+(a.id===S().featuredActivity37Id?'<small>首页展示</small>':''),'<span class="rev-category-tag">'+e(tag?.name||'普通活动')+'</span>',e(audienceText(a)),e(activityTime(a)),e(A.label(a)),activityReward(a),'<span class="r38-award-limit">'+b(String(counts.awarded),'a37-users','data-id="'+a.id+'" data-scope="awarded"')+'<em>/</em><span>'+(a.limit?String(a.limit):'不限')+'</span></span>','<label class="r26-switch"><input type="checkbox" data-a37-toggle="'+a.id+'" '+(a.status==='启用'?'checked':'')+'><i></i></label>','<div class="a37-buttons">'+b('详情','a37-detail','data-id="'+a.id+'"')+b('编辑','a37-edit','data-id="'+a.id+'"')+b('参与记录','a37-users','data-id="'+a.id+'"')+'</div>']);
  return C.ar3Head('用户活动','统一配置活跃、打卡及邀请奖励；每个活动每位用户最多获奖一次。')+'<section class="r3-card r32-list-card"><div class="g6-filters a37-filters r37-growth-filters">'+input('活动名称 / 备注','r37GrowthName',f.name||'','输入活动名称或备注')+select('活动标签','r37GrowthTag',[['','全部'],...S().activityTags.map(t=>[t.id,t.name])],f.tag||'')+select('状态','r37GrowthStatus',[['','全部'],...['未开始','进行中','已结束','已停用'].map(x=>[x,x])],f.status||'')+select('时间范围','r37GrowthRange',[['','全部'],['always','长期'],['range','有效期']],f.range||'')+select('活动人群','r37GrowthAudience',[['','全部'],['all','全部用户'],['users','指定用户']],f.audience||'')+'<div class="g19-filter-actions">'+b('查找','r37-growth-find','','primary small')+b('重置','r37-growth-reset')+'</div></div>'+
   '<div class="r32-actions-row r37-actions-row">'+b('新建活动','a37-new','','primary small')+b('导出','r37-growth-export')+b('活动标签管理','rev-tags')+b('首页打卡活动','a37-feature')+'</div><div class="r32-table-divider"></div>'+table(heads,data.slice(start,start+state.size))+pager('growth',rows.length,state.page,state.size)+'</section>';
 }
 C.V15_PAGES['user-growth']=activityListPage;
 C.ar3Action('r37-growth-find',()=>{filters.growth={...filters.growth,name:document.querySelector('[name="r37GrowthName"]').value.trim(),tag:document.querySelector('[name="r37GrowthTag"]').value,status:document.querySelector('[name="r37GrowthStatus"]').value,range:document.querySelector('[name="r37GrowthRange"]').value,audience:document.querySelector('[name="r37GrowthAudience"]').value};pages.growth.page=1;C.renderApp();});
 C.ar3Action('r37-growth-reset',()=>{filters.growth={};pages.growth.page=1;C.renderApp();});
 C.ar3Action('r37-growth-export',()=>{const rows=growthRows();return exportRows('用户活动',['活动名称','标签','生效人群','活动时间','状态','达标要求','奖励','获奖上限','已获奖'],rows.map(x=>{const a=x.activity;return [a.name,x.tag?.name||'',audienceText(a),activityTime(a),x.status,A.label(a),activityReward(a),a.rewardMode==='none'?'不适用':a.limit||'不限制',x.counts.awarded];}));});
 function checkinUsersPage(){
  const state=pages.checkin,query=filters.growth.checkinQuery||'';
  const list=S().users.filter(u=>!query||[u.name,u.id,u.profile?.phone].join(' ').includes(query));
  const completed=A.completed(store()),today=day(now());
  const rows=list.map(u=>{const ds=[...new Set((u.checkins||[]).filter(d=>typeof d==='string'&&d<=today))].sort();let streak=0,d=today;while(ds.includes(d)){streak++;d=day(Date.parse(d+'T12:00:00+08:00')-86400000);}const count=completed.filter(r=>r.user.id===u.id&&r.activity.kind==='checkin').length;return [identity(u),streak+' 天',ds.filter(x=>x.startsWith(today.slice(0,7))).length+' 天',ds.filter(x=>x.startsWith(today.slice(0,4))).length+' 天',ds.length+' 天',e(ds.at(-1)||'—'),b(String(count),'rev-checkin-detail','data-id="'+u.id+'"'),b('详情','rev-checkin-detail','data-id="'+u.id+'"')];});
  const start=(state.page-1)*state.size;
  return C.ar3Head('打卡管理','自然年、自然月按真实日期去重；已达标活动使用完成快照。')+'<section class="r3-card r32-list-card"><div class="g6-filters a37-filters r37-checkin-filters">'+input('用户','a37CheckinQuery',query,'用户名 / 用户ID / 手机号')+'<div class="g19-filter-actions">'+b('查找','r37-checkin-find','','primary small')+b('重置','r37-checkin-reset')+'</div></div><div class="r32-actions-row r37-actions-row">'+b('导出','r37-checkin-export')+'</div><div class="r32-table-divider"></div>'+table(['用户','连续打卡','本月打卡','本年打卡','累计打卡','最近打卡','已达标活动','操作'],rows.slice(start,start+state.size))+pager('checkin',rows.length,state.page,state.size)+'</section>';
 }
 C.V15_PAGES['checkin-users']=checkinUsersPage;
 C.ar3Action('r37-checkin-find',()=>{filters.growth.checkinQuery=document.querySelector('[name="a37CheckinQuery"]').value.trim();pages.checkin.page=1;C.renderApp();});
 C.ar3Action('r37-checkin-reset',()=>{filters.growth.checkinQuery='';pages.checkin.page=1;C.renderApp();});
 C.ar3Action('r37-checkin-export',()=>{const today=day(now()),complete=A.completed(store()),list=S().users.filter(u=>!filters.growth.checkinQuery||[u.name,u.id,u.profile?.phone].join(' ').includes(filters.growth.checkinQuery));return exportRows('打卡管理',['用户','连续打卡','本月打卡','本年打卡','累计打卡','最近打卡','已达标活动'],list.map(u=>{const ds=[...new Set((u.checkins||[]).filter(d=>typeof d==='string'&&d<=today))].sort();let streak=0,d=today;while(ds.includes(d)){streak++;d=day(Date.parse(d+'T12:00:00+08:00')-86400000);}return [u.name,streak,ds.filter(x=>x.startsWith(today.slice(0,7))).length,ds.filter(x=>x.startsWith(today.slice(0,4))).length,ds.length,ds.at(-1)||'',complete.filter(r=>r.user.id===u.id&&r.activity.kind==='checkin').length];}));});
 const inviteTabPage=C.V15_PAGES.invites;
 function inviteAlias(tab){return function(){C.g6Tabs.invites=tab;const box=document.createElement('div');box.innerHTML=inviteTabPage();box.querySelectorAll('[data-group="invites"][data-action="g6-tab"]').forEach(node=>node.dataset.action='r37-invite-tab');enhance(box,'invites');return box.innerHTML;};}
 C.V15_PAGES['invite-relations']=inviteAlias('records');
 C.V15_PAGES['invite-users']=inviteAlias('user');
 C.ar3Action('r37-invite-tab',node=>{C.g6Tabs.invites=node.dataset.tab;C.navigate('invites');});

 function ensureActionRow(card,html,key){if(!card||card.querySelector('[data-r37-actions="'+key+'"]'))return;const row=document.createElement('div');row.className='r32-actions-row r37-actions-row';row.dataset.r37Actions=key;row.innerHTML=html;const anchor=card.querySelector('.r32-table-divider,.r3-table-wrap,.a37-scroll,.g6-table-shell');(anchor||card).before(row);}
 function ensureActions(root,html,key){const card=root.querySelector('.r32-list-card');if(card){ensureActionRow(card,html,key);return;}const page=root.querySelector('.r3-admin-page')||root,head=page.querySelector('.page-head');if(!head||page.querySelector('[data-r37-source-actions="'+key+'"]'))return;head.insertAdjacentHTML('beforeend','<div class="page-actions r37-source-actions" data-r37-source-actions="'+key+'">'+html+'</div>');}
 function fixInvite(root=document){
  const page=root.querySelector('.r3-admin-page')||root,head=page.querySelector('.page-head');
  if(head&&!page.querySelector('[data-group="invites"]'))head.insertAdjacentHTML('afterend',tabs([['merchant','商户邀请码'],['user','用户邀请码'],['records','邀请记录']],C.g6Tabs.invites||'merchant','r37-invite-tab','invites'));
  if(C.g6Tabs.invites!=='user')return;
  ensureActions(root,b('活动设置','g6-settings')+b('导出','r31-export-user-invites'),'invite-user');
 }
 function fixFood(root=document){ensureActions(root,b('批量导入','g9-import-food')+b('新建食物','r3-new','data-entity="food"','primary small')+b('导出','r3-export-food')+b('食物分类','g18-categories'),'foods');}
 function fixTables(root=document){root.querySelectorAll('table').forEach(t=>{const action=[...t.tHead?.rows?.[0]?.cells||[]].findIndex(c=>/^(操作|操作项|查看)$/.test(c.textContent.trim()));for(const row of t.tBodies[0]?.rows||[])for(let i=0;i<row.cells.length;i++){if(i===action)continue;row.cells[i].querySelectorAll('button:not(.r26-switch)').forEach(btn=>btn.classList.add('r37-table-link'));}});}
 function enhanceSimplePagers(root=document){root.querySelectorAll('.rev-pager:not([data-r37-numbered])').forEach(p=>{p.dataset.r37Numbered='yes';p.classList.add('r37-unified-pager');const matches=[...p.textContent.matchAll(/第\s*(\d+)\s*\/\s*(\d+)/g)].at(-1);if(!matches)return;const current=Number(matches[1]),tot=Number(matches[2]),next=p.querySelector('button[data-page]');if(!next)return;const holder=document.createElement('div');holder.className='pagination';for(let n=1;n<=tot;n++){if(tot>7&&n!==1&&n!==tot&&Math.abs(n-current)>1)continue;const btn=next.cloneNode(true);btn.textContent=String(n);btn.dataset.page=String(n);btn.className=n===current?'active':'';holder.append(btn);}next.before(holder);p.classList.add('g6-pagination');});}
 function decorateActivityForm(root=document){
  const form=root.querySelector('#activity37-form');if(!form)return;
  for(const name of ['conditionChoice','audienceMode']){const sel=form.querySelector('[name="'+name+'"]');if(!sel)continue;sel.querySelector('option[value=""]')?.remove();if(!sel.value)sel.selectedIndex=0;}
  form.querySelectorAll('select').forEach(sel=>{
   if(sel.dataset.r37ChoiceDone)return;sel.dataset.r37ChoiceDone='yes';const options=[...sel.options];
   if(/^tierCoupon/.test(sel.name)){const label=sel.closest('label');sel.hidden=true;if(label){const chosen=sel.selectedOptions[0]?.textContent||'请选择优惠券';label.classList.add('r37-coupon-field');label.insertAdjacentHTML('beforeend','<button type="button" class="r37-coupon-picker" data-r37-coupon="'+sel.name+'">'+e(chosen)+'<small>点击选择优惠券</small></button>');}return;}
   if(options.length>7)return;const label=sel.closest('label');if(!label)return;sel.hidden=true;const box=document.createElement('div');box.className='r37-choice';box.setAttribute('role','radiogroup');box.innerHTML=options.map(opt=>'<button type="button" role="radio" aria-checked="'+(opt.selected?'true':'false')+'" class="'+(opt.selected?'on':'')+'" data-r37-choice="'+sel.name+'" data-value="'+e(opt.value)+'">'+e(opt.textContent)+'</button>').join('');sel.after(box);
  });
  form.querySelectorAll('.a37-tier').forEach(row=>{const type=row.querySelector('[name^="tierType"]')?.value,image=row.querySelector('.a37-reward-image');if(image)image.hidden=type!=='custom';});
  const online=(form.querySelector('[name="location"]')?.value||'online')!=='offline';
  form.querySelectorAll('select[name="conditionChoice"],input[name="conditionValue"],select[name="includeBefore"],.a37-condition-result').forEach(n=>{const label=n.closest('label')||n;label.hidden=!online;});
  form.querySelectorAll('.r3-card').forEach(section=>{const title=section.querySelector(':scope>h3')?.textContent.trim();if(title==='活动奖励'||title==='活动人群')section.hidden=!online;});
  form.querySelector('[data-r37-offline-note]')?.remove();if(!online)form.querySelector(':scope>.r3-card')?.insertAdjacentHTML('beforeend','<p class="r37-offline-note" data-r37-offline-note>线下活动仅展示，不自动结算，也不使用奖励和生效人群限制。</p>');
  form.querySelectorAll('[data-action="a37-audience"]').forEach(node=>node.remove());
 }
 function enhance(root=document,page=C.state?.page||'',final=false){
  if(final&&page==='invites')fixInvite(root);
  if(final&&page==='foods')fixFood(root);
  fixTables(root);enhanceSimplePagers(root);decorateActivityForm(root);
  if(page==='checkin-users'){const input=root.querySelector('[name="a37CheckinQuery"]');input?.closest('label')?.classList.add('r37-checkin-query');}
 }

 const render=C.renderApp;C.renderApp=function(){const result=render.apply(this,arguments);enhance();return result;};
 const modal=C.openModal;C.openModal=function(){const result=modal.apply(this,arguments);enhance(document.querySelector('#modal-root'));return result;};
 const navigate=C.navigate;C.navigate=function(page){
  if(page==='invite-relations'||page==='invite-users'){C.g6Tabs.invites=page==='invite-users'?'user':'records';return navigate.call(this,'invites');}
  if(page==='checkin-activities'){filters.growth.tag='builtin-checkin';return navigate.call(this,'user-growth');}
  if(page==='food-units'||page==='food-unit-editor')return navigate.call(this,'foods');
  return navigate.apply(this,arguments);
 };
 for(const page of ['coupons','invites','invite-rewards','foods','surveys','user-growth','user-growth-form','activity-records','checkin-users']){
  const base=C.V15_PAGES[page];if(!base)continue;
  C.V15_PAGES[page]=function(){const box=document.createElement('div');box.innerHTML=base.apply(this,arguments);enhance(box,page);return box.innerHTML;};
 }
 const workspace=document.querySelector('#workspace');
 if(workspace){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;express();});}).observe(workspace,{childList:true,subtree:true});}
 function express(){enhance(document,C.state?.page||'',true);}
 document.addEventListener('click',ev=>{
  const choice=ev.target.closest('[data-r37-choice]');if(choice){const sel=document.querySelector('[name="'+choice.dataset.r37Choice+'"]');if(!sel)return;sel.value=choice.dataset.value;choice.parentElement.querySelectorAll('button').forEach(n=>{const on=n===choice;n.classList.toggle('on',on);n.setAttribute('aria-checked',String(on));});sel.dispatchEvent(new Event('change',{bubbles:true}));return;}
  const pageButton=ev.target.closest('[data-r37-page-target]');if(pageButton&&!pageButton.disabled){const target=pageButton.dataset.r37PageTarget,state=pages[target];if(!state)return;state.page=Math.max(1,Number(pageButton.dataset.r37Page)||1);if(target==='rewardModal')renderRewardModal();else C.renderApp();return;}
  const sizeButton=ev.target.closest('[data-r37-size-target]');if(sizeButton){const target=sizeButton.dataset.r37SizeTarget,state=pages[target];if(!state)return;state.size=Number(sizeButton.dataset.r37PageSize)||10;state.page=1;if(target==='rewardModal')renderRewardModal();else C.renderApp();return;}
  const couponButton=ev.target.closest('[data-r37-coupon]');if(couponButton){openCouponPicker(couponButton.dataset.r37Coupon);}
 },true);
 document.addEventListener('keydown',ev=>{const jump=ev.target.closest('[data-r37-jump-target]');if(!jump||ev.key!=='Enter')return;ev.preventDefault();const target=jump.dataset.r37JumpTarget,state=pages[target];if(!state)return;state.page=Math.max(1,Number(jump.value)||1);if(target==='rewardModal')renderRewardModal();else C.renderApp();});
 function openCouponPicker(name){
  const native=document.querySelector('[name="'+name+'"]'),tier=native?.closest('.a37-tier'),index=tier?.dataset.a37Tier,current=native?.value;
  if(!native)return;const coupons=S().templates.filter(t=>t.status==='启用'||t.id===current);
  C.openModal({title:'选择优惠券',wide:true,body:'<div class="r37-coupon-modal"><label>搜索<input id="r37-coupon-search" placeholder="优惠券名称 / 金额"></label><div class="r37-coupon-options">'+coupons.map(t=>'<button type="button" class="'+(t.id===current?'on':'')+'" data-r37-pick-coupon="'+e(t.id)+'" data-tier="'+index+'"><b>'+e(t.name)+'</b><span>¥'+e(t.amount)+' · '+(t.threshold?'满 '+e(t.threshold)+' 元':'无门槛')+' · '+(t.status==='启用'?'可用':'当前已停用')+'</span></button>').join('')+'</div></div>',footer:b('关闭','close-modal')});
  const root=document.querySelector('#modal-root');root?.querySelector('#r37-coupon-search')?.addEventListener('input',ev=>{const q=ev.target.value.trim().toLowerCase();root.querySelectorAll('[data-r37-pick-coupon]').forEach(btn=>btn.hidden=Boolean(q&&!btn.textContent.toLowerCase().includes(q)));});
 }
 document.addEventListener('click',ev=>{const pick=ev.target.closest('[data-r37-pick-coupon]');if(!pick)return;const native=document.querySelector('[name="tierCoupon'+pick.dataset.tier+'"]');if(!native)return;native.value=pick.dataset.r37PickCoupon;C.closeModal();native.dispatchEvent(new Event('change',{bubbles:true}));},true);
 window.R37AdminRefine={enhance,pager,rewardPage,activityRecordsPage,openCouponPicker};
})();
