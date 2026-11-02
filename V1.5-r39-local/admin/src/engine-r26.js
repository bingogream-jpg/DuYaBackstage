// V1.5-r26 coupon stacking and backward-compatible wallet snapshots.
(()=>{
  const E=window.__DUYA_LOCAL_ENGINE;
  if(!E)return;
  const P=E.Store.prototype;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const ok=(value,message)=>{if(!value)throw Error(message);};
  const boundedStack=value=>{
    const number=Number(value);
    return Number.isInteger(number)&&number>=1&&number<=5?number:1;
  };

  function migrate(data){
    const templates=data.templates||[];
    templates.forEach((template,index)=>{
      template.stackMax=boundedStack(template.stackMax??(index<2?index+2:1));
    });
    for(const owner of data.users||[]){
      for(const wallet of owner.wallet||[]){
        const template=templates.find(item=>item.id===wallet.templateId);
        wallet.stackMax=boundedStack(wallet.stackMax??template?.stackMax??1);
      }
    }
    return data;
  }

  const issue=P.issue;
  P.issue=function(user,templateId,key,source){
    const wallet=issue.call(this,user,templateId,key,source);
    const template=this.data.templates.find(item=>item.id===templateId);
    wallet.stackMax=boundedStack(template?.stackMax??1);
    return wallet;
  };

  const run=P.run;
  P.run=function(type,user,payload={}){
    if(type==='ADMIN_SAVE'&&payload.entity==='coupon'){
      const record={...clone(payload.record||{}),stackMax:boundedStack(payload.record?.stackMax??1)};
      return run.call(this,type,user,{...payload,record});
    }
    if(type==='PAY'){
      ok(typeof payload.token==='string'&&payload.token.length>0,'缺少结算编号，请重新结算');
      const owner=this.user(user);
      const existing=owner.orders.find(order=>order.checkoutToken===payload.token);
      if(existing)return existing;
      const pkg=this.data.packages.find(item=>item.id===payload.packageId);
      const brand=this.data.brands.find(item=>item.id===payload.brandId&&item.status==='上架');
      ok(pkg&&brand,'套餐或品牌不可购买');

      const requested=Array.isArray(payload.couponIds)
        ?payload.couponIds.map(String)
        :payload.couponId?[String(payload.couponId)]:[];
      ok(new Set(requested).size===requested.length,'同一张优惠券不能重复选择');
      ok(requested.length<=5,'单笔订单最多使用5张优惠券');
      const wallets=requested.map(id=>{
        const wallet=owner.wallet.find(item=>item.id===id);
        ok(wallet,'优惠券不存在');
        return wallet;
      });
      ok(new Set(wallets.map(wallet=>wallet.templateId)).size===wallets.length,'同一种优惠券每单最多使用一张');
      for(const wallet of wallets){
        ok(boundedStack(wallet.stackMax??1)>=wallets.length,'当前优惠券组合超过叠加上限');
        const reason=this.eligible(wallet,pkg.price,payload.brandId);
        ok(!reason,reason);
      }

      const discount=wallets.length
        ?Math.round(Math.min(pkg.price-0.01,wallets.reduce((sum,wallet)=>sum+Number(wallet.amount||0),0))*100)/100
        :0;
      const now=new Date(this.now()).toISOString();
      const orderId='order-'+payload.token;
      for(const wallet of wallets){
        wallet.status='已使用';
        wallet.orderId=orderId;
        wallet.usedAt=now;
      }
      const relation=owner.binding&&this.data.inviteRelations.find(item=>item.id===owner.binding.relationId&&item.status!=='已失效');
      const order={
        id:orderId,
        checkoutToken:payload.token,
        userId:owner.id,
        newShop:true,
        brandId:brand.id,
        brand:brand.name,
        packageId:pkg.id,
        pkg:pkg.name,
        total:pkg.total,
        remaining:pkg.total,
        used:0,
        originalPrice:pkg.price,
        discount,
        price:Math.round((pkg.price-discount)*100)/100,
        couponId:wallets[0]?.id||null,
        couponIds:wallets.map(wallet=>wallet.id),
        status:'待使用',
        paidAt:now,
        time:E.dateKey(this.now())+' 12:00',
        attributionCode:relation?owner.binding.code:null
      };
      owner.orders.unshift(order);
      this.settleInvitesFor(owner.id);
      return order;
    }
    return run.call(this,type,user,payload);
  };

  window.R26Data={migrate,boundedStack};
})();
