  // V1.5-r39 single-coupon checkout.
  (()=>{
    const uniqueWallets=list=>{
      const seen=new Set();
      return (list||[]).filter(coupon=>{
        if(!coupon||seen.has(coupon.id))return false;
        seen.add(coupon.id);
        return true;
      });
    };
    const checkoutContext=()=>{
      const checkout=state.checkout;
      if(!checkout)return null;
      const pkg=shopPackage(checkout.packageId);
      return pkg?{checkout,pkg,price:Number(pkg.price)||0,brandId:checkout.brandId}:null;
    };
    const eligible=list=>{
      const context=checkoutContext();
      if(!context)return [];
      return uniqueWallets(list).filter(coupon=>coupon.status==='可用'&&!r2CouponReason(coupon,context.price,context.brandId));
    };
    function validSelection(list){
      return !Array.isArray(list)||list.length<=1;
    }
    function bestSelection(){
      const candidates=eligible(V15().coupons).sort((a,b)=>(b.amount-a.amount)||String(a.expire).localeCompare(String(b.expire)));
      return candidates.length?[candidates[0]]:[];
    }
    function selectedCoupons(){
      if(V15().checkoutCoupon==='none')return [];
      if(V15().checkoutCoupon==='manual'){
        return eligible((V15().checkoutCouponIds||[]).map(id=>V15().coupons.find(coupon=>coupon.id===id))).slice(0,1);
      }
      if(V15().checkoutCoupon&&!['auto','manual','none'].includes(V15().checkoutCoupon)){
        const selected=eligible(V15().coupons.filter(coupon=>coupon.id===V15().checkoutCoupon));
        if(selected.length)return selected;
      }
      return bestSelection();
    }
    const couponGroupKey=coupon=>String(coupon?.templateId||coupon?.id||'');
    function currentCouponInstances(){
      const today=r3Date();
      return uniqueWallets(V15().coupons).filter(coupon=>coupon.status==='可用'&&(!coupon.start||coupon.start<=today)&&(!coupon.expire||coupon.expire>=today));
    }
    function groupedCoupons(context){
      const groups=new Map();
      for(const coupon of currentCouponInstances()){
        const key=couponGroupKey(coupon);
        if(!groups.has(key))groups.set(key,[]);
        groups.get(key).push(coupon);
      }
      return [...groups.entries()].map(([key,items])=>{
        const byExpiry=items.slice().sort((a,b)=>String(a.expire||'9999-12-31').localeCompare(String(b.expire||'9999-12-31'))||String(a.id).localeCompare(String(b.id)));
        const eligibleItems=byExpiry.filter(coupon=>!r2CouponReason(coupon,context.price,context.brandId));
        return {key,items:byExpiry,eligible:eligibleItems,representative:byExpiry[0],reason:eligibleItems.length?'':r2CouponReason(byExpiry[0],context.price,context.brandId)};
      }).sort((a,b)=>String(a.representative.expire||'').localeCompare(String(b.representative.expire||''))||a.key.localeCompare(b.key));
    }
    r2SelectedCoupon=function(){
      const list=selectedCoupons();
      if(!list.length)return null;
      const selected=list[0],amount=Math.round(Number(selected.amount||0)*100)/100;
      return {
        id:selected.id,
        ids:[selected.id],
        name:selected.name,
        amount,
        threshold:Number(selected.threshold)||0,
        brands:selected.brands||'全部品牌',
        expire:selected.expire,
        stackMax:1
      };
    };
    function selectionDraft(){
      if(!Array.isArray(V15().r26CouponPick))V15().r26CouponPick=selectedCoupons().map(coupon=>coupon.id);
      if(V15().r26CouponPick.length>1)V15().r26CouponPick=V15().r26CouponPick.slice(0,1);
      return V15().r26CouponPick;
    }
    function pickerBody(){
      const context=checkoutContext();
      if(!context)return '<p class="shop-empty">请先选择套餐</p>';
      const selected=selectionDraft();
      const groups=groupedCoupons(context);
      const selectedRows=eligible(selected.map(id=>V15().coupons.find(coupon=>coupon.id===id))).slice(0,1);
      const selectedKey=selectedRows.length?couponGroupKey(selectedRows[0]):'';
      const cards=groups.map(group=>{
        const coupon=group.representative,checked=group.key===selectedKey,id=(checked?selectedRows[0]:group.eligible[0]||coupon).id;
        const state=checked?'已选':group.reason||'可用';
        return '<button type="button" class="r33m-ticket v26-coupon-option '+(checked?'on ':'')+(group.reason?'off':'')+'" data-act="v26-coupon-toggle" data-id="'+esc(id)+'" data-group="'+esc(group.key)+'" '+(group.eligible.length?'':'disabled')+'>'+
          '<span class="r33m-ticket-value"><small>¥</small><b>'+v15Num(coupon.amount)+'</b><span>'+(Number(coupon.threshold)>0?'满 '+v15Num(coupon.threshold)+' 元可用':'无门槛')+'</span></span>'+
          '<span class="r33m-ticket-info"><span class="v26-ticket-head"><strong>'+esc(coupon.name)+'</strong><em class="v26-coupon-count">'+group.items.length+' 张</em></span><span class="v26-ticket-brand">'+esc(coupon.brands||'全部品牌')+'</span><span class="v26-ticket-footer"><span>有效期至 '+esc(coupon.expire||'—')+'</span><em class="'+(group.reason?'blocked':'')+'">'+esc(state)+'</em></span></span>'+
          '<span class="v26-coupon-check">'+(checked?'✓':'')+'</span></button>';
      }).join('');
      return '<div class="v26-coupon-picker">'+
        '<div class="v26-coupon-options r39-coupon-ticket-list">'+(cards||'<div class="r33m-empty"><b>暂无可选优惠券</b><p>领取优惠券后会显示在这里。</p></div>')+'</div>'+
        '<div class="v26-coupon-actions"><button data-act="v26-coupon-auto">自动最优</button><button data-act="v26-coupon-none">不使用优惠券</button><button class="primary" data-act="v26-coupon-save" '+(selectedRows.length?'':'disabled')+'>确认使用 '+selectedRows.length+' 张</button></div>'+
        '<p class="v26-coupon-help">优惠券需通过品牌和原价门槛校验，最多不超过订单金额减 0.01 元。</p></div>';
    }
    function refreshPicker(){
      const holder=document.querySelector('.sheet .v26-coupon-picker');
      if(holder)holder.outerHTML=pickerBody();
    }
    function openPicker(){
      V15().r26CouponPick=selectedCoupons().map(coupon=>coupon.id);
      bottomSheet('选择优惠券',pickerBody(),{dismissible:true});
    }
    ACTIONS['v15-checkout-pick']=openPicker;
    ACTIONS['v26-coupon-toggle']=node=>{
      const id=node.dataset.id,list=selectionDraft(),index=list.indexOf(id);
      if(index>=0)list.splice(index,1);
      else list.splice(0,list.length,id);
      refreshPicker();
    };
    ACTIONS['v26-coupon-auto']=()=>{
      V15().checkoutCoupon='auto';
      V15().checkoutCouponIds=[];
      V15().r26CouponPick=bestSelection().map(coupon=>coupon.id);
      closeLayer();
      render();
    };
    ACTIONS['v26-coupon-none']=()=>{
      V15().checkoutCoupon='none';
      V15().checkoutCouponIds=[];
      V15().r26CouponPick=[];
      closeLayer();
      render();
    };
    ACTIONS['v26-coupon-save']=()=>{
      const list=eligible(selectionDraft().map(id=>V15().coupons.find(coupon=>coupon.id===id)));
      if(!list.length)throw Error('请选择一张可用优惠券');
      if(!validSelection(list))throw Error('每单最多使用一张优惠券');
      V15().checkoutCoupon='manual';
      V15().checkoutCouponIds=list.map(coupon=>coupon.id);
      closeLayer();
      render();
    };
    paid=async function(){
      if(r3PayBusy||!state.checkout||state.checkout.paid)return;
      r3PayBusy=true;
      try{
        const checkout=state.checkout,coupons=selectedCoupons();
        const order=await r3.cmd('PAY',{
          brandId:checkout.brandId,
          packageId:checkout.packageId,
          couponId:coupons[0]?.id||null,
          couponIds:coupons.map(coupon=>coupon.id),
          mealRewardCount:window.R36Mini?.checkoutMealCount?window.R36Mini.checkoutMealCount():0,
          token:checkout.token
        },'pay-'+checkout.token);
        checkout.pin='';
        checkout.paid=true;
        checkout.orderId=order.id;
        state.activeOrderId=order.id;
        V15().checkoutCoupon='auto';
        V15().checkoutCouponIds=[];
        V15().r26CouponPick=[];
        if(window.R36Mini?.resetCheckoutMeal)window.R36Mini.resetCheckoutMeal();
        r3Apply();
        save();
        openShopPlans();
      }catch(error){
        if(state.checkout)state.checkout.pin='';
        toast(error.message);
      }finally{
        r3PayBusy=false;
      }
    };
    const couponDetailBase=SCREENS.couponDetail.render;
    SCREENS.couponDetail.render=function(){
      const html=couponDetailBase();
      const coupon=V15().coupons.find(item=>item.id===V15().couponId)||V15().coupons[0];
      if(!coupon)return html;
      const summary='<div><span>使用规则</span><b>每单最多使用一张优惠券</b></div>';
      return html.replace('<p>'+esc(coupon.desc||'每单限用一张优惠券，具体使用范围以订单结算页为准。')+'</p>',summary+'<p>'+esc(coupon.desc||'具体使用范围以订单结算页为准。')+'</p>');
    };
    window.R26Coupons={selected:selectedCoupons,best:bestSelection,valid:validSelection};
  })();
