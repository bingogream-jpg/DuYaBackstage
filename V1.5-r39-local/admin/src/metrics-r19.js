// One read-only projection drives both merchant totals and drill-downs.
(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x)),round=n=>Math.round(n*100)/100;
 function merchant(d,id){
   const m=d.merchants.find(x=>x.id===id);if(!m)return null;
   const users=new Map(d.users.map(u=>[u.id,u])),invitations=d.inviteRelations.filter(r=>r.merchantId===id&&['已达成','有效'].includes(r.status)).map(r=>({relation:r,user:users.get(r.userId)}));
   const receipts=d.users.flatMap(u=>(u.orders||[]).filter(o=>o.attributionCode===m.code&&o.paidAt).map(order=>({user:u,order,net:order.status==='已退款'?0:Number(order.price)||0}))),orders=receipts.filter(r=>r.order.status!=='已退款');
   const grouped=new Map();for(const row of orders){let item=grouped.get(row.user.id);if(!item){item={user:row.user,count:0,revenue:0};grouped.set(row.user.id,item);}item.count++;item.revenue=round(item.revenue+row.net);}
   return {merchant:m,invitations,buyers:[...grouped.values()],orders,receipts,revenue:round(receipts.reduce((n,r)=>n+r.net,0))};
 }
 window.R19Stats={merchant};
 const P=window.__DUYA_LOCAL_ENGINE.Store.prototype,base=P.snapshot;
 P.snapshot=function(user){const d=base.call(this,user);d.merchants=d.merchants.map(m=>{const x=merchant(d,m.id);return {...m,users:x.invitations.length,buyers:x.buyers.length,orders:x.orders.length,revenue:x.revenue};});return d;};
})();
