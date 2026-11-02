// V1.5-r31 backend visual settings, table status layout and invitation/reward refinements.
(()=>{
  const C=window.__g8Core;
  if(!C||window.__DUYA_LOCAL_ROLE__!=='admin')return;
  const S=()=>window.R3?.state;
  const ae=C.ae;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const today=()=>S()?.now?.slice(0,10)||window.__DUYA_LOCAL_ENGINE.dateKey(Date.now());
  const template=id=>S()?.templates.find(item=>item.id===id);
  const ownerById=id=>S()?.users.find(item=>item.id===id);
  const normalize=value=>String(value||'').trim().toLowerCase();
  const includes=(value,query)=>normalize(value).includes(normalize(query));
  const pathOf=record=>{
    const value=String(record?.path||record?.source||'');
    if(/邀请|受邀|invite/i.test(value))return '用户邀请';
    if(/成长|growth/i.test(value))return '成长活动';
    if(/打卡|checkin/i.test(value))return '打卡活动';
    if(/后台|管理员|运营|下发/.test(value))return '后台';
    return '后台';
  };
  const rewardType=record=>({coupon:'优惠券',meal:'赠餐',custom:'自定义奖励'}[record?.type]||'自定义奖励');
  const rewardName=record=>record?.type==='coupon'
    ?record.name||record.content||'优惠券'
    :record?.type==='meal'?record.content||record.name||'赠餐'
    :record?.name||record?.content||'自定义奖励';
  const rewardStatuses=record=>window.R36Rewards?.statuses(record,S(),Date.parse(S()?.now)||Date.now())||[record?.status||'—'];
  const rewardStatusMarkup=record=>{const f=window.R36Review.status(record,S(),Date.parse(S()?.now));return '<div class="r36-admin-status"><span>领取状态</span>'+C.badge(f.claimStatus)+'<span>使用状态</span>'+C.badge(f.usageStatus)+'</div>';};
  const walletStatus=wallet=>wallet.status==='已使用'?'已使用':wallet.status==='已撤回'?'已撤回':wallet.expire<today()?'已过期':wallet.start>today()?'待生效':'可使用';
  const dateTime=value=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'—';
  const fileSize=value=>Math.ceil((String(value||'').split(',')[1]?.length||0)*.75);
  const maxPages=(total,size)=>Math.max(1,Math.ceil(total/size));
  const optionButtons=(name,options,value,empty='全部')=>'<div class="r31-filter-tabs" data-r31-filter-tabs="'+ae(name)+'">'+[{value:'',label:empty},...options].map(item=>'<button type="button" class="'+(item.value===value?'on':'')+'" data-r31-filter-value="'+ae(item.value)+'">'+ae(item.label)+'</button>').join('')+'</div>';
  const plainTable=html=>String(html).replace('<table class="data-table"','<table class="data-table r31-static-table" data-g7="no" data-g6="yes"');

  function downloadWorkbook(filename,sheet,rows){
    if(!window.XLSX)throw Error('Excel 组件未就绪，请刷新后重试');
    if(!rows?.length)throw Error('当前筛选没有可导出的记录');
    const workbook=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(rows),sheet);
    XLSX.writeFile(workbook,filename);
  }

  // Keep all switch confirmations deliberately short while retaining the confirmation gate.
  const confirmBase=window.G6.confirm.bind(window.G6);
  window.G6.confirm=function(title,lines){
    const match=String(title||'').match(/^(启用|停用|开启|关闭)/);
    if(match)return confirmBase(title,['是否确认'+match[1]+'？']);
    return confirmBase(title,Array.isArray(lines)?lines.slice(0,1):lines);
  };

  function appRules(){
    const defaults=window.R31Data?.defaults||{};
    return {...clone(defaults),...(S()?.settings?.appRules||{})};
  }
  function imageValue(key){
    const value=appRules()[key];
    if(key==='loginBg')return typeof value==='string'?value:'';
    return value?.dataUrl||'';
  }
  function imageControl(key,label,hint,ratio,objectMode=true){
    const value=imageValue(key);
    const version=objectMode?appRules()[key]?.updatedAt||'':'';
    return '<div class="r32-upload-control" data-r31-image-field="'+ae(key)+'"><div class="r32-image-preview r32-image-'+ae(key)+' '+(value?'has-image':'')+'" data-r31-preview>'+ (value?'<img src="'+ae(value)+'" alt="'+ae(label)+'预览">':'<span>尚未上传</span>')+'</div><div class="r32-upload-copy"><b>'+ae(label)+'</b><p>'+ae(hint)+'</p><small>'+ae(ratio)+' · PNG / JPG / WebP，最大 2 MB</small><div class="r31-image-actions"><label class="button secondary small">'+(value?'替换图片':'上传图片')+'<input type="file" accept="image/png,image/jpeg,image/webp" data-r31-image-upload="'+ae(key)+'" hidden></label>'+(value?'<button type="button" class="button secondary small" data-action="r31-remove-image" data-key="'+ae(key)+'">删除</button>':'')+'</div></div><input type="hidden" data-r31-image="'+ae(key)+'" data-r31-image-object="'+(objectMode?'yes':'no')+'" value="'+ae(value)+'" data-updated-at="'+ae(version)+'"></div>';
  }
  function deliverySlotRow(slot={time:'11:30',meals:['午餐','晚餐']}){
    return '<div class="delivery-slot-row r32-slot-row" data-r31-slot><input type="time" value="'+ae(slot.time||'11:30')+'"><label><input type="checkbox" data-meal="午餐" '+((slot.meals||[]).includes('午餐')?'checked':'')+'>午餐</label><label><input type="checkbox" data-meal="晚餐" '+((slot.meals||[]).includes('晚餐')?'checked':'')+'>晚餐</label><button type="button" class="button secondary small" data-action="r31-remove-slot">删除</button></div>';
  }
  function field(label,name,value='',type='text',options=[],wide=false){
    const control=type==='select'?'<select name="'+ae(name)+'">'+options.map(item=>{const id=Array.isArray(item)?item[0]:item,text=Array.isArray(item)?item[1]:item;return '<option value="'+ae(id)+'" '+(String(id)===String(value)?'selected':'')+'>'+ae(text)+'</option>';}).join('')+'</select>':'<input name="'+ae(name)+'" type="'+ae(type)+'" value="'+ae(value??'')+'">';
    return '<div class="form-field '+(wide?'wide':'')+'"><label>'+ae(label)+'</label>'+control+'</div>';
  }
  const pausePeriods=[['week','近7天'],['month','近30天'],['quarter','近90天'],['year','近365天']];
  function rulesPanel(){
    const rules=appRules(),limits={week:1,month:3,quarter:6,year:12,...(rules.pauseLimits||{})},period=C.state.pausePeriod||'week';
    return '<div class="form-section"><h3>小程序规则</h3><p>配置小程序端下单、配送时间与专属客服展示信息。</p><form id="r31-app-rules-form"><div class="form-grid">'+
      '<div class="form-group-head"><b>一、小程序规则</b></div>'+field('用户次日订单调整截止','cutoff',rules.cutoff||'17:30','time')+field('新用户注册后可补填邀请码天数','bindWindowDays',S()?.settings?.bindWindowDays??7,'number')+
      '<div class="form-field wide"><label>配送时间选项设置</label><div class="r31-slot-list">'+(rules.deliverySlots||[]).map(deliverySlotRow).join('')+'</div><button type="button" class="button secondary small" data-action="r31-add-slot">添加配送时间选项</button><p class="form-hint">每个选项后自动带“之前”，并勾选适用餐别。</p></div>'+
      '<div class="form-field wide"><label>单品牌暂停次数限制</label><div class="pause-limit-editor"><select name="pausePeriod" data-action="r31-pause-period">'+pausePeriods.map(([value,label])=>'<option value="'+value+'" '+(period===value?'selected':'')+'>'+label+'</option>').join('')+'</select><div class="input-with-suffix"><input name="pauseLimitValue" type="number" min="0" step="1" value="'+ae(limits[period])+'"><span>次</span></div></div><p class="form-hint">先选择统计周期，再填写同一用户对同一品牌的暂停上限；0 表示该周期不允许暂停。</p></div>'+
      '<div class="form-group-head"><b>二、专属客服（个人页面-专属客服部分）</b></div>'+field('客服电话','servicePhone',rules.servicePhone)+field('微信号','serviceWechat',rules.serviceWechat)+field('工作时间描述','serviceHours',rules.serviceHours,'text',[],true)+
      '<div class="form-group-head"><b>三、退款客服（退款相关展示信息）</b></div>'+field('客服微信号','refundWechatId',rules.refundWechatId)+field('客服电话','refundPhone',rules.refundPhone)+'<div class="form-field wide">'+imageControl('refundQr','客服二维码（选填）','退款页面展示的客服二维码','推荐方形图片',false)+'</div>'+
      '<div class="form-group-head"><b>四、付款后客服弹窗</b></div><div class="form-field wide">'+imageControl('postPaymentServiceImage','付款后客服图片','用户支付成功后显示，仅上传一张图片','推荐竖版 3:4 或方形',true)+'</div>'+
      '<div class="form-actions"><button type="button" class="button secondary" data-action="r31-reset-app-rules">恢复默认</button><button type="button" class="button primary" data-action="r31-save-app-rules">保存设置</button></div></div></form></div>';
  }
  function imagePanel(title,description,key,label,hint,ratio){
    return '<div class="form-section"><h3>'+title+'</h3><p>'+description+'</p><form><div class="form-grid"><div class="form-field wide">'+imageControl(key,label,hint,ratio,key!=='loginBg')+'</div><div class="form-actions"><button type="button" class="button primary" data-action="r31-save-app-rules">保存设置</button></div></div></form></div>';
  }
  function posterPanel(kind){
    const share=kind==='sharePoster';
    return imagePanel(share?'小程序分享海报设置':'用户邀请海报设置',share?'用于微信转发小程序时的分享背景。':'用于邀请码海报背景；邀请码、二维码、活动时间和奖励信息由小程序安全区叠加。',kind,share?'分享背景图':'邀请海报背景','支持单图上传、预览、替换和删除，后台与小程序实时同步。',share?'宽:高 = 2:3':'宽:高 = 16:9');
  }
  function loginPanel(){
    return imagePanel('小程序登录页背景设置','登录页使用竖版背景图，支持常见图片格式。','loginBg','登录页背景图','支持图片或 GIF 动图，建议使用 750 × 1334 或同比例图片。','推荐 750 × 1334');
  }
  C.V15_PAGES['app-rules']=function(){
    const tab=C.state.appRulesTab||'rules';
    const tabs=[['rules','小程序规则设置'],['sharePoster','小程序分享海报设置'],['invitePoster','用户邀请海报设置'],['loginbg','小程序登录页背景设置']];
    const body=tab==='sharePoster'?posterPanel('sharePoster'):tab==='invitePoster'?posterPanel('invitePoster'):tab==='loginbg'?loginPanel():rulesPanel();
    return C.ar3Head('小程序规则','配置小程序端下单规则、配送时间选项、专属客服、邀请海报与登录页背景。')+'<div class="tabs">'+tabs.map(([id,label])=>'<button class="tab-button '+(tab===id?'active':'')+'" data-action="r31-app-rules-tab" data-tab="'+id+'">'+label+'</button>').join('')+'</div><div class="r32-rules-body">'+body+'</div></section>';
  };
  C.ar3Action('r31-app-rules-tab',node=>{C.state.appRulesTab=node.dataset.tab;C.renderApp();});
  C.ar3Action('r31-add-slot',()=>document.querySelector('.r31-slot-list')?.insertAdjacentHTML('beforeend',deliverySlotRow({time:'18:00',meals:['晚餐']})));
  C.ar3Action('r31-remove-slot',node=>node.closest('[data-r31-slot]')?.remove());
  C.ar3Action('r31-remove-image',node=>{
    const field=document.querySelector('[data-r31-image="'+node.dataset.key+'"]');
    if(field)field.value='';
    const wrap=node.closest('[data-r31-image-field]');
    if(wrap){wrap.querySelector('[data-r31-preview]').classList.remove('has-image');wrap.querySelector('[data-r31-preview]').innerHTML='<span>尚未上传</span>';node.remove();const label=wrap.querySelector('.r31-image-actions label');if(label)label.childNodes[0].textContent='上传图片';}
  });
  C.ar3Action('r31-save-app-rules',async()=>{
    const rules={...appRules()};
    const form=document.querySelector('#r31-app-rules-form');
    if(form){
      rules.cutoff=form.querySelector('[name="cutoff"]')?.value||rules.cutoff;
      const bindWindowDays=Number(form.querySelector('[name="bindWindowDays"]')?.value);
      if(!Number.isInteger(bindWindowDays)||bindWindowDays<1||bindWindowDays>365)throw Error('补填邀请码天数须为1至365的整数');
      for(const key of ['servicePhone','serviceWechat','serviceHours','refundWechatId','refundPhone'])rules[key]=form.querySelector('[name="'+key+'"]')?.value.trim()||'';
      rules.deliverySlots=[...form.querySelectorAll('[data-r31-slot]')].map(row=>({time:row.querySelector('input[type="time"]')?.value||'',meals:[...row.querySelectorAll('[data-meal]:checked')].map(input=>input.dataset.meal)})).filter(slot=>slot.time);
      if(rules.deliverySlots.some(slot=>!slot.meals.length))throw Error('每个配送时间至少选择一个餐别');
      const period=form.querySelector('[name="pausePeriod"]')?.value||'week';
      const raw=form.querySelector('[name="pauseLimitValue"]')?.value;
      const pauseLimit=Number(raw);
      if(raw===''||!Number.isInteger(pauseLimit)||pauseLimit<0)throw Error('暂停次数必须为非负整数');
      rules.pauseLimits={...(rules.pauseLimits||{}),[period]:pauseLimit};
      C.state.pausePeriod=period;
    }
    for(const key of (window.R31Data?.imageKeys||['sharePoster','invitePoster','postPaymentServiceImage'])){
      const input=document.querySelector('[data-r31-image="'+key+'"]');
      if(!input)continue;
      const dataUrl=input.value||null;
      if(dataUrl&&fileSize(dataUrl)>2*1024*1024)throw Error('图片不能超过 2 MB');
      if(key==='loginBg')rules[key]=dataUrl||'assets/article-balanced-hydration.jpg';
      else rules[key]={dataUrl,updatedAt:dataUrl?(input.dataset.updatedAt||new Date().toISOString()):null};
    }
    const refundQr=document.querySelector('[data-r31-image="refundQr"]');
    if(refundQr){
      if(refundQr.value&&fileSize(refundQr.value)>2*1024*1024)throw Error('客服二维码不能超过 2 MB');
      rules.refundQr=refundQr.value||'';
    }
    const blank=document.querySelector('[data-r31-image="loginBg"]');
    if(blank){
      const loginCard=blank.closest('[data-r31-image-field]');
      if(loginCard&&!blank.value)rules.loginBg='assets/article-balanced-hydration.jpg';
    }
    await window.R3.cmd('ADMIN_SAVE_APP_RULES',{appRules:rules,bindWindowDays:Number(form?.querySelector('[name="bindWindowDays"]')?.value||S()?.settings?.bindWindowDays||7)});
    C.renderApp();
    window.__g7UI?.toast?.('小程序设置已保存','后台与小程序共享配置已更新');
  });
  C.ar3Action('r31-reset-app-rules',async()=>{
    if(!await window.G6.confirm('恢复默认小程序规则',['是否确认恢复默认？']))return;
    const next=clone(window.R31Data?.defaults||{});
    for(const key of window.R31Data?.imageKeys||[])next[key]={dataUrl:null,updatedAt:null};
    await window.R3.cmd('ADMIN_SAVE_APP_RULES',{appRules:next,bindWindowDays:7});
    C.renderApp();
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('[name="pausePeriod"]')){
      const period=event.target.value,limits={week:1,month:3,quarter:6,year:12,...(appRules().pauseLimits||{})};
      const input=document.querySelector('[name="pauseLimitValue"]');
      if(input)input.value=limits[period];
      C.state.pausePeriod=period;
    }
    const upload=event.target.closest('[data-r31-image-upload]');
    if(!upload)return;
    const file=upload.files?.[0];
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){
      upload.value='';window.__g7UI?.toast?.('图片未添加','请选择不超过 2 MB 的 PNG、JPG 或 WebP 图片','error');return;
    }
    const key=upload.dataset.r31ImageUpload,wrap=upload.closest('[data-r31-image-field]'),input=wrap.querySelector('[data-r31-image]'),reader=new FileReader();
    reader.onload=()=>{
      input.value=String(reader.result);input.dataset.updatedAt=new Date().toISOString();
      const preview=wrap.querySelector('[data-r31-preview]');preview.classList.add('has-image');preview.innerHTML='<img src="'+ae(reader.result)+'" alt="图片预览">';
      if(!wrap.querySelector('[data-action="r31-remove-image"]')){
        wrap.querySelector('.r31-image-actions').insertAdjacentHTML('beforeend','<button type="button" class="button secondary small" data-action="r31-remove-image" data-key="'+ae(key)+'">删除</button>');
      }
      upload.closest('label').childNodes[0].textContent='替换图片';
    };
    reader.onerror=()=>window.__g7UI?.toast?.('图片读取失败','请重新选择','error');
    reader.readAsDataURL(file);
  });

  function moveActionBars(scope){
    if(!scope?.querySelector)return;
    const page=scope.querySelector('#workspace .r3-admin-page,.r3-admin-page')||scope;
    if(!page)return;
    const actions=page.querySelector('.page-head .page-actions');
    const card=page.querySelector('.r3-card');
    if(!actions||!card||actions.dataset.r31Moved)return;
    actions.dataset.r31Moved='yes';actions.classList.add('r31-page-actions');
    const filter=card.querySelector('.g6-filters,.g20-filter-row,.g6-table-toolbar');
    if(filter)filter.after(actions);else card.prepend(actions);
  }
  function ensureStatusColumns(scope){
    if(!scope?.querySelectorAll)return;
    scope.querySelectorAll('table.data-table').forEach(table=>{
      const head=table.tHead?.rows?.[0],body=table.tBodies?.[0];
      if(!head||!body)return;
      let statusIndex=[...head.cells].findIndex(cell=>cell.textContent.trim()==='状态');
      const hasNameSwitch=Boolean(body.querySelector('.r26-name-status [data-r26-switch]'));
      if(statusIndex<0&&hasNameSwitch){
        const operationIndex=[...head.cells].findIndex(cell=>/操作|查看/.test(cell.textContent.trim()));
        statusIndex=operationIndex>0?operationIndex:head.cells.length;
        const th=document.createElement('th');th.textContent='状态';
        if(head.cells[statusIndex])head.cells[statusIndex].before(th);else head.append(th);
        for(const row of body.rows){
          if(row.cells.length===1&&row.cells[0].colSpan>1)continue;
          row.insertCell(statusIndex);
        }
      }
      body.querySelectorAll('.r26-name-status [data-r26-switch]').forEach(input=>{
        const row=input.closest('tr'),cell=row?.cells[statusIndex];
        if(cell)cell.append(input.closest('.r26-switch')||input);
      });
      if(statusIndex>=0&&body.querySelector('[data-r26-switch]'))for(const row of body.rows){const cell=row.cells[statusIndex];cell?.querySelectorAll('.r3-badge,.status,.r26-switch>span').forEach(node=>node.remove());}
    });
  }
  function patchFormSwitches(scope){
    if(!scope?.querySelectorAll)return;
    scope.querySelectorAll('.r28-form-switch').forEach(wrap=>{
      const input=wrap.querySelector('input[type="checkbox"]'),select=wrap.previousElementSibling?.matches('select')?wrap.previousElementSibling:null;
      const label=wrap.querySelector(':scope>span');
      if(label)label.textContent=input?.checked?'启用':'禁用';
      if(input&&!input.dataset.r31Bound){input.dataset.r31Bound='yes';input.addEventListener('change',()=>{if(label)label.textContent=input.checked?'启用':'禁用';});}
      if(select)select.dataset.r31Status='yes';
    });
  }
  function patchCouponPage(scope){
    if(!scope?.querySelector)return;
    const page=scope.querySelector('#workspace .r3-admin-page,.r3-admin-page')||scope;
    if(!page)return;
    page.querySelectorAll('[data-group="coupons"][data-tab="issues"]').forEach(node=>node.remove());
    page.querySelectorAll('table.data-table').forEach(table=>{
      const heads=[...table.tHead?.rows?.[0]?.cells||[]];
      const usageIndex=heads.findIndex(cell=>/发放\s*\/\s*使用/.test(cell.textContent));
      const templateRow=table.tBodies[0]?.rows[0]?.querySelector('[data-entity="coupon"][data-id]');
      if(usageIndex>=0){
        table.tHead.rows[0].cells[usageIndex].textContent='已使用 / 总发放';
        for(const row of table.tBodies[0]?.rows||[]){
          const edit=row.querySelector('[data-entity="coupon"][data-id]'),id=edit?.dataset.id,wallet=S().users.flatMap(owner=>owner.wallet).filter(item=>item.templateId===id);
          const cell=row.cells[usageIndex];if(!cell||!id)continue;
          const used=wallet.filter(item=>item.status==='已使用').length;
          cell.innerHTML='<button type="button" class="cell-link r31-usage-link" data-action="r31-coupon-usage" data-id="'+ae(id)+'">'+used+' / '+wallet.length+'</button>';
        }
      }
      if(templateRow){
        for(const row of table.tBodies[0].rows){
          const edit=row.querySelector('[data-entity="coupon"][data-id]'),operation=edit?.closest('td');
          if(operation&&!operation.querySelector('[data-action="r31-template-issues"]'))operation.insertAdjacentHTML('beforeend',C.ab('下发记录','r31-template-issues','data-id="'+edit.dataset.id+'"','secondary small'));
        }
      }
      const actionIndex=[...table.tHead?.rows?.[0]?.cells||[]].findIndex(cell=>cell.textContent.trim()==='操作');
      if(actionIndex>=0&&table.querySelector('.r26-count-link')){
        for(const row of table.tBodies[0]?.rows||[])if(row.cells[actionIndex])row.deleteCell(actionIndex);
        table.tHead.rows[0].deleteCell(actionIndex);
      }
    });
  }
  const couponBase=C.V15_PAGES.coupons;
  C.V15_PAGES.coupons=function(){
    if(C.g6Tabs.coupons==='issues')C.g6Tabs.coupons='templates';
    const box=document.createElement('div');box.innerHTML=couponBase();patchCouponPage(box);return box.innerHTML;
  };

  function openCouponUsage(templateId){
    const coupon=template(templateId);if(!coupon)return;
    const rows=S().users.flatMap(owner=>owner.wallet.filter(wallet=>wallet.templateId===templateId).map(wallet=>({owner,wallet,status:walletStatus(wallet),channel:pathOf({source:wallet.source})})));
    const body='<div class="r31-modal-table" data-r31-usage data-template="'+ae(templateId)+'"><div class="r31-modal-summary"><b>'+ae(coupon.name)+'</b><span>总发放 '+rows.length+' · 已使用 '+rows.filter(item=>item.status==='已使用').length+'</span></div><div class="r31-filter-grid"><label>领券人<input data-r31-usage-query placeholder="用户名 / 用户ID / 手机号"></label><label>发放渠道<div class="r31-filter-tabs">'+['全部','用户邀请','打卡活动','成长活动','后台'].map(value=>'<button type="button" class="'+(value==='全部'?'on':'')+'" data-r31-usage-channel="'+value+'">'+value+'</button>').join('')+'</div></label><label data-r31-activity-filter hidden>活动名称<input data-r31-usage-activity placeholder="可选填活动名称"></label><label>状态<select data-r31-usage-status><option value="">全部</option>'+['待生效','可使用','已使用','已过期','已撤回'].map(value=>'<option>'+value+'</option>').join('')+'</select></label></div><div data-r31-usage-table>'+usageTable(rows)+'</div></div>';
    C.openModal({title:'优惠券发放使用明细 · '+coupon.name,wide:true,body,footer:C.ab('导出','r31-coupon-usage-export','','secondary')+C.ab('关闭','close-modal','','secondary')});
  }
  function usageTable(rows){
    return C.atable(['领券人','发放渠道','发放时间','有效期','状态'],rows.map(({owner,wallet,status,channel})=>[window.R24Identity.render(owner),ae(channel),ae(dateTime(wallet.obtainedAt)),ae(wallet.start+' 至 '+wallet.expire),C.badge(status)])).replace('class="data-table"','class="data-table r31-usage-table"');
  }
  function filteredUsageRows(){
    const root=document.querySelector('[data-r31-usage]');if(!root)return [];
    const id=root.dataset.template,query=root.querySelector('[data-r31-usage-query]')?.value.trim()||'',status=root.querySelector('[data-r31-usage-status]')?.value||'',channel=root.querySelector('[data-r31-usage-channel].on')?.dataset.r31UsageChannel||'全部',activity=root.querySelector('[data-r31-usage-activity]')?.value.trim()||'';
    return S().users.flatMap(owner=>owner.wallet.filter(wallet=>wallet.templateId===id).map(wallet=>({owner,wallet,status:walletStatus(wallet),channel:pathOf({source:wallet.source})}))).filter(item=>(!query||includes([item.owner.name,item.owner.id,item.owner.profile?.phone].join(' '),query))&&(!status||item.status===status)&&(channel==='全部'||item.channel===channel)&&(!activity||[item.wallet.source,item.wallet.activityName].filter(Boolean).join(' ').toLowerCase().includes(activity.toLowerCase())));
  }
  function refreshUsageTable(){const root=document.querySelector('[data-r31-usage]');if(root)root.querySelector('[data-r31-usage-table]').innerHTML=usageTable(filteredUsageRows());}
  C.ar3Action('r31-coupon-usage',node=>openCouponUsage(node.dataset.id));
  C.ar3Action('r31-coupon-usage-export',()=>{
    const rows=filteredUsageRows();
    downloadWorkbook('渡鸦管家-r31-优惠券发放使用明细.xlsx','发放使用明细',rows.map(({owner,wallet,status,channel})=>({用户名:owner.name,用户ID:owner.id,手机号:owner.profile?.phone||'',优惠券:wallet.name,发放渠道:channel,活动名称:wallet.activityName||wallet.source||'',发放时间:wallet.obtainedAt||'',有效期:wallet.start+' 至 '+wallet.expire,状态:status})));
  });
  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-r31-usage-channel]');if(!tab)return;
    tab.closest('.r31-filter-tabs').querySelectorAll('button').forEach(node=>node.classList.toggle('on',node===tab));
    const root=document.querySelector('[data-r31-usage]'),activity=root?.querySelector('[data-r31-activity-filter]');if(activity)activity.hidden=!['打卡活动','成长活动'].includes(tab.dataset.r31UsageChannel);
    refreshUsageTable();
  });
  document.addEventListener('input',event=>{if(event.target.closest('[data-r31-usage]'))refreshUsageTable();});
  document.addEventListener('change',event=>{if(event.target.closest('[data-r31-usage]'))refreshUsageTable();});

  function templateIssues(templateId){
    const coupon=template(templateId);if(!coupon)return;
    const jobs=(S().issues||[]).filter(job=>job.templateId===templateId).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    const rows=[];
    for(const job of jobs){
      if(job.status==='待执行'){
        rows.push({job,users:job.users||[],wallet:null,status:'待发放'});
      }else{
        for(const result of job.results||[]){
          if(!result.ok)continue;
          const owner=S().users.find(item=>(item.wallet||[]).some(wallet=>wallet.id===result.walletId)),wallet=owner?.wallet.find(item=>item.id===result.walletId);
          rows.push({job,owner,wallet,users:[result.userId],status:wallet?walletStatus(wallet):'已发放'});
        }
      }
    }
    const table='<div class="r31-native-table-wrap"><table class="r31-native-table"><thead><tr><th>领券人</th><th>操作人</th><th>发放时间</th><th>状态</th><th>操作</th></tr></thead><tbody>'+rows.map(row=>'<tr><td>'+(row.owner?window.R24Identity.render(row.owner):'<b>'+ae(row.users.map(id=>ownerById(id)?.name||id).join('、'))+'</b>')+'</td><td>'+ae(row.job.grantedBy||'运营管理员')+'</td><td>'+ae(dateTime(row.job.executedAt||row.job.createdAt))+'</td><td><span class="r31-plain-status">'+ae(row.status)+'</span></td><td>'+(row.job.status==='待执行'?C.ab('撤回任务','r31-cancel-issue','data-id="'+row.job.id+'"','secondary small'):row.wallet&&!['已使用','已撤回'].includes(row.wallet.status)?C.ab('撤回','r31-revoke-wallet','data-id="'+row.wallet.id+'"','secondary small'):'—')+'</td></tr>').join('')+(!rows.length?'<tr><td colspan="5" class="r3-empty">该优惠券暂无后台下发记录</td></tr>':'')+'</tbody></table></div>';
    C.openModal({title:coupon.name+' · 后台下发记录',wide:true,body:table,footer:C.ab('关闭','close-modal','','secondary')});
  }
  C.ar3Action('r31-template-issues',node=>templateIssues(node.dataset.id));
  C.ar3Action('r31-cancel-issue',async node=>{
    if(!await G6.confirm('撤回定时发放',['是否确认撤回？']))return;
    await R3.cmd('ADMIN_CANCEL_JOB',{id:node.dataset.id});C.closeModal();C.renderApp();
  });
  C.ar3Action('r31-revoke-wallet',async node=>{
    if(!await G6.confirm('撤回优惠券',['是否确认撤回？']))return;
    await R3.cmd('ADMIN_REVOKE',{walletId:node.dataset.id});C.closeModal();C.renderApp();
  });

  C.ar3Action('g13-user-coupon-stat',node=>{
    const owner=ownerById(node.dataset.id);if(!owner)return;
    const scope=node.dataset.scope||'总数',rows=owner.wallet.filter(wallet=>scope==='总数'||walletStatus(wallet)===scope);
    const content=rows.length?plainTable(C.atable(['优惠券','来源','获得时间','有效期','状态'],rows.map(wallet=>['<b>'+ae(wallet.name)+'</b><small>'+ae(wallet.id)+'</small>',ae(wallet.source||'后台'),ae(dateTime(wallet.obtainedAt)),ae(wallet.start+' 至 '+wallet.expire),C.badge(walletStatus(wallet))]))):'<p class="r3-empty">当前范围暂无优惠券</p>';
    C.openModal({title:owner.name+' · '+(scope==='总数'?'全部优惠券':scope),wide:true,body:content,footer:C.ab('导出','r31-export-user-coupons','data-user="'+ae(owner.id)+'" data-scope="'+ae(scope)+'"','secondary')+C.ab('关闭','close-modal','','secondary')});
  });
  C.ar3Action('r31-export-user-coupons',node=>{
    const owner=ownerById(node.dataset.user),scope=node.dataset.scope,rows=owner.wallet.filter(wallet=>scope==='总数'||walletStatus(wallet)===scope);
    downloadWorkbook('渡鸦管家-r31-用户优惠券.xlsx','用户优惠券',rows.map(wallet=>({用户:owner.name,用户ID:owner.id,手机号:owner.profile?.phone||'',优惠券:wallet.name,来源:wallet.source||'',获得时间:wallet.obtainedAt||'',有效期:wallet.start+' 至 '+wallet.expire,状态:walletStatus(wallet)})));
  });

  function rewardRecords(){
    const records=window.G17Rewards?.records?.()||[];
    return records.map(record=>{
      const wallet=record.walletId?S().users.flatMap(owner=>owner.wallet).find(item=>item.id===record.walletId):null;
      const sourceText=String(record.source||'');
      const detail=sourceText.includes('·')?sourceText.split('·').slice(1).join('·').trim():wallet?.grantedBy||sourceText||'—';
      const normalized={...record,pathLabel:pathOf(record),pathDetail:detail};
      normalized.statusLabels=rewardStatuses(normalized);
      return normalized;
    });
  }
  const rewardUI={view:'summary',user:'',path:'',activity:'',type:'',page:1};
  function rewardMatches(record){
    return (!rewardUI.user||includes([record.userName,record.userId,record.phone].join(' '),rewardUI.user))
      &&(!rewardUI.path||record.pathLabel===rewardUI.path)
      &&(!rewardUI.activity||includes([record.pathDetail,record.source,record.name,record.content].join(' '),rewardUI.activity))
      &&(!rewardUI.type||record.type===rewardUI.type);
  }
  function filteredRewards(){return rewardRecords().filter(rewardMatches);}
  function rewardSummaryRows(records){
    const map=new Map();
    for(const record of records){
      let row=map.get(record.userId);
      if(!row){row={userId:record.userId,userName:record.userName,phone:record.phone,total:0,counts:{未领取:0,已领取:0,未使用:0,已过期:0,已发放:0,未发放:0},latest:record.time};map.set(record.userId,row);}
      row.total++;
      for(const label of record.statusLabels||[])row.counts[label]=(row.counts[label]||0)+1;
      if(Date.parse(record.time)>Date.parse(row.latest))row.latest=record.time;
    }
    return [...map.values()].sort((a,b)=>Date.parse(b.latest)-Date.parse(a.latest));
  }
  function rewardPageSize(view=rewardUI.view){return view==='summary'?10:20;}
  function rewardPageSlice(rows){const size=rewardPageSize(),pages=Math.max(1,Math.ceil(rows.length/size));rewardUI.page=Math.min(pages,Math.max(1,rewardUI.page||1));return {size,pages,page:rewardUI.page,rows:rows.slice((rewardUI.page-1)*size,rewardUI.page*size)};}
  function rewardPager(total,page,size){
    const pages=Math.max(1,Math.ceil(total/size));
    const numbers=new Set([1,pages,page-1,page,page+1]);const links=[...numbers].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b);
    return '<div class="r33-reward-pager"><span>共 '+total+' 条 · 第 '+page+' / '+pages+' 页</span><div><button type="button" data-action="r31-reward-page" data-page="'+Math.max(1,page-1)+'" '+(page===1?'disabled':'')+'>上一页</button>'+links.map(n=>'<button type="button" class="'+(n===page?'active':'')+'" data-action="r31-reward-page" data-page="'+n+'">'+n+'</button>').join('')+'<button type="button" data-action="r31-reward-page" data-page="'+Math.min(pages,page+1)+'" '+(page===pages?'disabled':'')+'>下一页</button></div></div>';
  }
  function rewardCount(value,user,scope){return '<button type="button" class="r31-number-link" data-action="r31-reward-detail" data-user="'+ae(user)+'" data-scope="'+ae(scope)+'">'+value+'</button>';}
  function rewardFilterMarkup(){
    return '<div class="r31-reward-filters g6-filters"><div class="toolbar-group"><div class="r31-filter-row"><label class="g7-filter"><span>用户</span><input data-r31-reward-user value="'+ae(rewardUI.user)+'" placeholder="用户名 / 用户ID / 手机号"></label><label class="g7-filter"><span>活动名称</span><input data-r31-reward-activity value="'+ae(rewardUI.activity)+'" placeholder="可选填活动名称"></label><div class="g19-filter-actions"><button type="button" class="button primary small" data-action="r31-reward-find">查找</button><button type="button" class="button secondary small" data-action="r31-reward-reset">重置</button></div></div><div class="r31-filter-label">获得途径</div>'+optionButtons('path',[{value:'用户邀请',label:'用户邀请'},{value:'打卡活动',label:'打卡活动'},{value:'成长活动',label:'成长活动'},{value:'后台',label:'后台'}],rewardUI.path)+'<div class="r31-filter-label">奖励类型</div>'+optionButtons('type',[{value:'coupon',label:'优惠券'},{value:'meal',label:'赠餐'},{value:'custom',label:'自定义奖励'}],rewardUI.type)+'</div></div>';
  }
  function rewardsPage(){
    const nextView=C.g6Tabs.rewardView||rewardUI.view||'summary';
    if(nextView!==rewardUI.view)rewardUI.page=1;
    rewardUI.view=nextView;
    const records=filteredRewards(),summary=rewardSummaryRows(records),view=rewardUI.view;
    const sourceRows=view==='summary'?summary:records,paging=rewardPageSlice(sourceRows);
    const content=view==='summary'
      ?plainTable(C.atable(['用户','奖励总数','未领取','已领取','未使用','已过期','已发放','未发放','最近获得'],paging.rows.map(item=>[
        window.R24Identity.render(ownerById(item.userId)||{id:item.userId,name:item.userName,profile:{phone:item.phone}}),
        rewardCount(item.total,item.userId,'total'),
        ...['未领取','已领取','未使用','已过期','已发放','未发放'].map(label=>rewardCount(item.counts[label]||0,item.userId,label)),
        ae(dateTime(item.latest))
      ])))
      :plainTable(C.atable(['用户','奖励','获得途径','获得时间','发放状态','操作'],paging.rows.map(record=>[
        window.R24Identity.render(ownerById(record.userId)||{id:record.userId,name:record.userName,profile:{phone:record.phone}}),
        '<div class="r26-reward-cell r31-reward-value"><span>'+ae(rewardType(record))+'</span><b>'+ae(rewardName(record))+'</b></div>',
        '<div class="r31-path-cell"><span>'+ae(record.pathLabel)+'</span><small>'+ae(record.pathDetail||'—')+'</small></div>',
        ae(dateTime(record.time)),rewardStatusMarkup(record),
        record.type==='custom'&&String(record.id).startsWith('E-')?C.ab(record.status==='已发放'?'改为未发放':'标记已发放','r31-custom-reward-toggle','data-id="'+ae(record.id.slice(2))+'" data-status="'+ae(record.status)+'" data-name="'+ae(record.name)+'"','secondary small'):'—'
      ])));
    const all=rewardRecords();
    return C.ar3Head('奖励记录','奖励明细统一按用户、途径、活动和奖励类型查询。')+
      '<div class="summary-ribbon finance-filter-strip g18-summary"><div><span>奖励总数</span><strong><button type="button" class="r31-number-link" data-action="r31-reward-detail" data-scope="total">'+all.length+'</button></strong></div><div><span>未领取</span><strong><button type="button" class="r31-number-link" data-action="r31-reward-detail" data-scope="未领取">'+all.filter(item=>item.statusLabels.includes('未领取')).length+'</button></strong></div><div><span>未使用</span><strong><button type="button" class="r31-number-link" data-action="r31-reward-detail" data-scope="未使用">'+all.filter(item=>item.statusLabels.includes('未使用')).length+'</button></strong></div><div><span>已过期</span><strong><button type="button" class="r31-number-link" data-action="r31-reward-detail" data-scope="已过期">'+all.filter(item=>item.statusLabels.includes('已过期')).length+'</button></strong></div></div>'+
      C.g6Buttons('rewardView',[['summary','用户汇总'],['details','奖励明细']])+
      '<section class="r3-card r31-table-card">'+rewardFilterMarkup()+(content||'<p class="r3-empty">当前筛选没有奖励记录</p>')+rewardPager(sourceRows.length,paging.page,paging.size)+'</section></section>';
  }
  C.V15_PAGES['invite-rewards']=rewardsPage;
  C.ar3Action('r31-reward-find',()=>{rewardUI.user=document.querySelector('[data-r31-reward-user]')?.value.trim()||'';rewardUI.activity=document.querySelector('[data-r31-reward-activity]')?.value.trim()||'';rewardUI.page=1;C.renderApp();});
  C.ar3Action('r31-reward-reset',()=>{Object.assign(rewardUI,{user:'',path:'',activity:'',type:'',page:1});C.renderApp();});
  C.ar3Action('r31-reward-page',node=>{rewardUI.page=Math.max(1,Number(node.dataset.page)||1);C.renderApp();});
  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-r31-filter-tabs] [data-r31-filter-value]');if(!tab)return;
    const name=tab.closest('[data-r31-filter-tabs]').dataset.r31FilterTabs;if(!['path','type'].includes(name))return;
    rewardUI[name]=tab.dataset.r31FilterValue;rewardUI.page=1;tab.closest('[data-r31-filter-tabs]').querySelectorAll('button').forEach(node=>node.classList.toggle('on',node===tab));
    C.renderApp();
  });
  function rewardDetailRows(records){
    return plainTable(C.atable(['用户','奖励','获得途径','获得时间','发放状态'],records.map(record=>[
      window.R24Identity.render(ownerById(record.userId)||{id:record.userId,name:record.userName,profile:{phone:record.phone}}),
      '<div class="r26-reward-cell r31-reward-value"><span>'+ae(rewardType(record))+'</span><b>'+ae(rewardName(record))+'</b></div>',
      '<div class="r31-path-cell"><span>'+ae(record.pathLabel)+'</span><small>'+ae(record.pathDetail||'—')+'</small></div>',
      ae(dateTime(record.time)),rewardStatusMarkup(record)
    ])));
  }
  let lastRewardDetail=[],lastRewardTitle='奖励明细';
  function modalRewardPager(total,page,size){
    const pages=Math.max(1,Math.ceil(total/size)),numbers=new Set([1,pages,page-1,page,page+1]),links=[...numbers].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b);
    return '<div class="r33-modal-pager"><span>共 '+total+' 条 · 第 '+page+' / '+pages+' 页</span><div><button type="button" data-action="r33-reward-modal-page" data-page="'+Math.max(1,page-1)+'" '+(page===1?'disabled':'')+'>上一页</button>'+links.map(n=>'<button type="button" class="'+(n===page?'active':'')+'" data-action="r33-reward-modal-page" data-page="'+n+'">'+n+'</button>').join('')+'<button type="button" data-action="r33-reward-modal-page" data-page="'+Math.min(pages,page+1)+'" '+(page===pages?'disabled':'')+'>下一页</button></div></div>';
  }
  function openRewardDetailModal(page=1){
    const size=20,pages=Math.max(1,Math.ceil(lastRewardDetail.length/size));page=Math.min(pages,Math.max(1,Number(page)||1));
    const rows=lastRewardDetail.slice((page-1)*size,page*size);
    C.openModal({title:lastRewardTitle,wide:true,body:lastRewardDetail.length?'<div class="r33-modal-summary"><b>'+ae(lastRewardTitle)+'</b><span>全部筛选结果 '+lastRewardDetail.length+' 条，仅展示当前页</span></div>'+rewardDetailRows(rows)+modalRewardPager(lastRewardDetail.length,page,size):'<p class="r3-empty">当前范围没有奖励记录</p>',footer:C.ab('导出','r31-export-reward-detail','','secondary')+C.ab('关闭','close-modal','','secondary')});
  }
  C.ar3Action('r31-reward-detail',node=>{
    const scope=node.dataset.scope||'total';lastRewardDetail=filteredRewards().filter(record=>(!node.dataset.user||record.userId===node.dataset.user)&&(scope==='total'||record.statusLabels.includes(scope)));
    const owner=node.dataset.user?ownerById(node.dataset.user):null;lastRewardTitle=(owner?.name||'全部用户')+' · '+(scope==='total'?'全部奖励':scope);
    openRewardDetailModal(1);
  });
  C.ar3Action('r33-reward-modal-page',node=>openRewardDetailModal(Number(node.dataset.page)||1));
  C.ar3Action('r31-export-reward-detail',()=>downloadWorkbook('渡鸦管家-r36-奖励明细.xlsx','奖励明细',lastRewardDetail.map(record=>({用户名:record.userName,用户ID:record.userId,手机号:record.phone,奖励类型:rewardType(record),奖励名称:rewardName(record),获得途径:record.pathLabel,活动或操作人:record.pathDetail,获得时间:record.time,领取状态:window.R36Review.status(record,S(),Date.parse(S().now)).claimStatus,使用状态:window.R36Review.status(record,S(),Date.parse(S().now)).usageStatus}))));
  C.ar3Action('r31-custom-reward-toggle',async node=>{
    const next=node.dataset.status==='已发放'?'待领取':'已发放';
    if(!await G6.confirm(next==='已发放'?'标记奖励已发放':'改为未发放',['是否确认'+(next==='已发放'?'标记为已发放':'改为未发放')+'？']))return;
    await R3.cmd('ADMIN_REWARD_STATUS',{id:node.dataset.id,status:next});C.closeModal();C.renderApp();
  });

  function inviteStageReward(stage){
    const rewards=(stage.inviter?.rewards||stage.rewards||[]).filter(Boolean);
    return rewards.map(reward=>reward.type==='coupon'?(template(reward.couponId)?.name||'优惠券'):reward.type==='meal'?'赠餐 '+Number(reward.count||1)+' 餐':reward.name||'自定义奖励').join('、')||'不发放';
  }
  C.ar3Action('r28-user-invite-stages',node=>{
    const owner=ownerById(node.dataset.id),stages=owner?.inviteProgram?.stages||S().settings.userInviteStages||[];
    const relations=S().inviteRelations.filter(relation=>relation.inviterId===owner?.id&&relation.status!=='已失效');
    const tags=relations.map(relation=>{const user=ownerById(relation.userId);return '<span class="r31-user-tag"><b>'+ae(user?.name||relation.userId)+'</b><small>'+ae(user?.id||relation.userId)+'</small></span>';}).join('')||'<span class="r31-muted">暂无关联用户</span>';
    const body='<div class="table-wrap r31-stage-table"><table class="data-table r31-static-table" data-g7="no" data-g6="yes"><thead><tr><th>阶段</th><th>条件</th><th>有效期</th><th>奖励</th><th>状态</th><th>操作</th></tr></thead><tbody>'+stages.map((stage,index)=>'<tr><td><b>'+ae(stage.name)+'</b></td><td>'+ae(stage.inviter?.conditionLabel||stage.conditionLabel||'—')+'</td><td>'+(stage.activeMode==='range'?ae(stage.start+' 至 '+stage.end):'长期有效')+'</td><td>'+ae(inviteStageReward(stage))+'</td><td>'+C.badge(stage.inviter?.status||stage.status||'待达成')+'</td><td><button type="button" class="button secondary small" data-action="r31-toggle-stage-users" data-index="'+index+'">展开</button></td></tr><tr class="r31-stage-user-row" data-stage-row="'+index+'" hidden><td colspan="6"><span>关联有效邀请用户</span><div class="r31-user-tags">'+tags+'</div></td></tr>').join('')+'</tbody></table></div>';
    C.openModal({title:(owner?.name||node.dataset.id)+' · 邀请人奖励阶段',wide:true,body,footer:C.ab('关闭','close-modal','','secondary')});
  });
  C.ar3Action('r31-toggle-stage-users',node=>{
    const row=document.querySelector('[data-stage-row="'+node.dataset.index+'"]');if(!row)return;
    row.hidden=!row.hidden;node.textContent=row.hidden?'展开':'收起';
  });

  C.ar3Action('merchant-invite-records',node=>{
    const merchant=S().merchants.find(item=>item.id===node.dataset.id);if(!merchant)return;
    const relations=(S().inviteRelations||[]).filter(relation=>relation.merchantId===merchant.id);
    const rows=relations.map(relation=>{
      const user=ownerById(relation.userId),orders=(user?.orders||[]).filter(order=>order.attributionCode===merchant.code&&order.status!=='已退款');
      return [window.R24Identity.render(user||{id:relation.userId,name:relation.userId,profile:{}}),orders.length,'¥'+orders.reduce((sum,order)=>sum+Number(order.price||0),0).toFixed(2),C.badge(relation.status),ae(dateTime(relation.boundAt))];
    });
    C.openModal({title:merchant.name+' · 邀请记录',wide:true,body:rows.length?plainTable(C.atable(['被邀请人','订购次数','累计付款','邀请状态','邀请时间'],rows)):'<p class="r3-empty">该商户暂无邀请记录</p>',footer:C.ab('导出','r31-export-merchant-invites','data-id="'+ae(merchant.id)+'"','secondary')+C.ab('关闭','close-modal','','secondary')});
  });
  C.ar3Action('r31-export-merchant-invites',node=>{
    const merchant=S().merchants.find(item=>item.id===node.dataset.id);
    const rows=S().inviteRelations.filter(relation=>relation.merchantId===merchant.id).map(relation=>{const user=ownerById(relation.userId),orders=(user?.orders||[]).filter(order=>order.attributionCode===merchant.code&&order.status!=='已退款');return {商户:merchant.name,被邀请人:user?.name||relation.userId,用户ID:relation.userId,手机号:user?.profile?.phone||'',订购次数:orders.length,累计付款:orders.reduce((sum,order)=>sum+Number(order.price||0),0),邀请状态:relation.status,邀请时间:relation.boundAt};});
    downloadWorkbook('渡鸦管家-r31-商户邀请记录.xlsx','商户邀请记录',rows);
  });

  const inviteFormBase=C.V15_PAGES['invite-form'];
  C.V15_PAGES['invite-form']=function(){
    const box=document.createElement('div');box.innerHTML=inviteFormBase();
    box.querySelector('.g8-invite-aside,.g13-invite-aside')?.remove();
    const layout=box.querySelector('.g8-invite-layout');if(layout)layout.classList.add('r31-invite-layout');
    const main=box.querySelector('.g8-invite-main');if(main)main.style.width='100%';
    return box.innerHTML;
  };
  const invitesBase=C.V15_PAGES.invites;
  C.V15_PAGES.invites=function(){
    const box=document.createElement('div');box.innerHTML=invitesBase();
    box.querySelectorAll('small').forEach(node=>{if(node.textContent.trim()==='有效邀请条件')node.remove();});
    box.querySelectorAll('table.data-table').forEach(table=>{
      const heads=[...table.tHead?.rows?.[0]?.cells||[]].map(cell=>cell.textContent.trim());
      heads.forEach((head,index)=>{
        if(!/邀请人奖励|被邀请人奖励/.test(head))return;
        for(const row of table.tBodies[0]?.rows||[]){const cell=row.cells[index];if(!cell)continue;const text=cell.innerText.trim();if(/^不发放/.test(text))cell.querySelectorAll('.r26-reward-type,.r3-badge').forEach(node=>node.remove());}
      });
    });
    if(C.g6Tabs.invites==='user'){
      box.querySelectorAll('.g6-stats,.summary-ribbon').forEach(node=>node.remove());
      const settings=box.querySelector('[data-action="g6-settings"]');
      if(settings&&!box.querySelector('[data-action="r31-export-user-invites"]'))settings.insertAdjacentHTML('afterend',C.ab('导出','r31-export-user-invites','','secondary'));
    }
    return box.innerHTML;
  };
  C.ar3Action('r31-export-user-invites',()=>{
    const rows=S().users.filter(owner=>owner.inviteCode).map(owner=>{const effective=S().inviteRelations.filter(relation=>relation.inviterId===owner.id&&['已达成','有效'].includes(relation.status)).length;return {用户名:owner.name,用户ID:owner.id,手机号:owner.profile?.phone||'',邀请码:owner.inviteCode,邀请码状态:owner.inviteStatus||'启用',有效邀请:effective,可邀请人数:Number(S().settings.cap)||'不限'};});
    downloadWorkbook('渡鸦管家-r31-用户邀请码.xlsx','用户邀请码',rows);
  });
  const relationsBase=C.V15_PAGES['invite-relations'];
  if(relationsBase)C.V15_PAGES['invite-relations']=function(){const box=document.createElement('div');box.innerHTML=relationsBase();box.querySelectorAll('small').forEach(node=>{if(node.textContent.trim()==='有效邀请条件')node.remove();});return box.innerHTML;};

  const checkinFocusBase=C.V15_PAGES['checkin-users'];
  C.V15_PAGES['checkin-users']=function(){
    const box=document.createElement('div');box.innerHTML=checkinFocusBase();
    const h=box.querySelector('.page-head h1');if(h)h.textContent='打卡管理';
    return box.innerHTML;
  };
  C.pageMeta['checkin-users']=['增长运营','打卡管理'];
  C.ar3Action('r28-checkin-focus',node=>{
    const trigger=document.createElement('button');trigger.dataset.action='r26-checkin-user-detail';trigger.dataset.id=node.dataset.id;document.body.append(trigger);trigger.click();trigger.remove();
    setTimeout(()=>{
      const modal=document.querySelector('#modal-root'),body=modal?.querySelector('.modal-body,.g6-modal-body');const tableTitle=[...(modal?.querySelectorAll('h3')||[])].find(item=>item.textContent.includes('参加的打卡活动'));const target=tableTitle||modal?.querySelector('.r3-table-wrap');
      if(target&&body){body.scrollTop=Math.max(0,target.offsetTop-body.offsetTop-20);target.scrollIntoView({block:'start',behavior:'smooth'});}
    },120);
  });

  function commonEnhance(scope=document){
    moveActionBars(scope);
    ensureStatusColumns(scope);
    patchFormSwitches(scope);
    document.querySelectorAll('#workspace .r31-reward-filters+.g6-filters,#workspace .r31-reward-filters~.g6-filters').forEach(node=>node.remove());
    if(C.state?.page==='invite-rewards'){
      document.querySelectorAll('#workspace .g6-filters:not(.r31-reward-filters):not(.r37-filter-grid)').forEach(node=>node.remove());
    }
    if(C.state?.page==='invites'&&C.g6Tabs.invites==='user'){
      document.querySelectorAll('#workspace .summary-ribbon,#workspace .g6-stats').forEach(node=>node.remove());
      const buttons=[...document.querySelectorAll('#workspace .page-actions button,#workspace .r31-page-actions button')];
      const exportButton=buttons.find(button=>button.textContent.trim()==='导出');
      if(exportButton){
        exportButton.dataset.action='r31-export-user-invites';
        delete exportButton.dataset.tab;
      }else{
        const settings=document.querySelector('#workspace [data-action="g6-settings"]');
        settings?.insertAdjacentHTML('afterend',C.ab('导出','r31-export-user-invites','','secondary'));
      }
      const exports=[...document.querySelectorAll('#workspace .page-actions button,#workspace .r31-page-actions button')].filter(button=>button.textContent.trim()==='导出');
      exports.slice(1).forEach(button=>button.remove());
      document.querySelectorAll('#workspace table.data-table').forEach(table=>{
        const index=[...table.tHead?.rows?.[0]?.cells||[]].findIndex(cell=>/邀请人奖励阶段/.test(cell.textContent));
        if(index>=0)for(const row of table.tBodies[0]?.rows||[])row.cells[index]?.querySelectorAll('.r26-reward-type,.r3-badge').forEach(node=>node.remove());
      });
    }
  }
  const renderBase=C.renderApp;
  C.renderApp=function(){const result=renderBase.apply(this,arguments);commonEnhance(document);return result;};
  const modalBase=C.openModal;
  C.openModal=function(){
    const result=modalBase.apply(this,arguments);
    const root=document.querySelector('#modal-root');
    root?.querySelectorAll('.g6-filters').forEach(node=>node.remove());
    const title=root?.querySelector('.modal-head h3')?.textContent||'';
    if(title.includes('邀请人奖励阶段')){
      root.querySelectorAll('.r26-reward-type').forEach(node=>node.remove());
      root.querySelectorAll('.r26-reward-legacy').forEach(node=>node.classList.remove('r26-reward-legacy'));
    }
    commonEnhance(document);
    return result;
  };
  const decorateBase=window.G7?.decorate;
  if(decorateBase)window.G7.decorate=function(){const result=decorateBase.apply(this,arguments);commonEnhance(arguments[0]||document);return result;};

  window.R31={
    appRules,
    moveActionBars,
    ensureStatusColumns,
    patchFormSwitches,
    rewardPath:pathOf,
    rewardType,
    rewardName
  };
})();
