(function(root){
  const shift=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const week=(today,checkins=[])=>{const start=shift(today,-new Date(today+'T12:00:00Z').getUTCDay());return Array.from({length:7},(_,i)=>{const date=shift(start,i);return {date,weekday:['周日','周一','周二','周三','周四','周五','周六'][i],label:date===today?'今天':String(Number(date.slice(8))),today:date===today,done:checkins.includes(date),future:date>today};});};
  const streak=(today,checkins=[])=>{const set=new Set(checkins);let date=set.has(today)?today:shift(today,-1),count=0;while(set.has(date)){count++;date=shift(date,-1);}return count;};
  const intake=(items,budget)=>{const total=items.reduce((n,i)=>n+(i.pending?0:Number(i.kcal)||0),0),ref=Number(budget)>0?Number(budget):null;return {total,budget:ref,remaining:ref===null?null:Math.max(0,ref-total),excess:ref===null?null:Math.max(0,total-ref),percent:ref===null?null:Math.min(100,total/ref*100),within:ref===null?null:total<=ref};};
  const api={shift,week,streak,intake};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DuyaHomeR4=api;
})(typeof window!=='undefined'?window:globalThis);
