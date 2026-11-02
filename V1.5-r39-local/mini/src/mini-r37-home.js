// Home intake presentation; nutrition, water and navigation use existing actions.
(()=>{
 const base=SCREENS.home.render,keys=['carb','protein','fat'],labels=['碳水','蛋白质','脂肪'];
 const svg=(i)=>'<svg viewBox="0 0 32 36" aria-hidden="true"><path d="'+['M16 3S5 16 5 23a11 11 0 0022 0C27 16 16 3 16 3Z','M16 3C8 3 4 17 5 24c1 13 22 13 23 0C29 17 24 3 16 3Z','M12 3c-5 2-3 7-7 13-5 8 0 17 11 17s16-9 11-17c-4-6-2-11-7-13Z'][i]+'" fill="currentColor" stroke="white" stroke-width="2"/><path d="M10 23c0 4 2 6 5 6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
 SCREENS.home.render=function(){
  const box=document.createElement('div');box.innerHTML=base();const card=box.querySelector('.r29-intake');if(!card)return box.innerHTML;
  card.classList.add('r37h-intake');card.dataset.act='r37h-open-diet';card.tabIndex=0;card.setAttribute('aria-label','今日营养摄入，查看饮食记录');
  const totals=R25Nutrition.totals(r3Me().diet.filter(x=>x.date===r3Date())),target=R25Nutrition.getTarget(r3Me());
  card.querySelector('.r29-home-macros').innerHTML=keys.map((key,i)=>{const actual=Number(totals[key]),goal=Number(target.grams[key]),pct=goal>0?actual/goal*100:null;return '<div class="r37h-macro macro-'+key+'"><div class="r37h-macro-top"><i>'+svg(i)+'</i><div><span>'+labels[i]+'</span><b>'+actual.toFixed(1)+'g</b><small>/ '+goal.toFixed(1)+'g</small></div></div><div class="r37h-progress"><i><em style="width:'+Math.min(100,Math.max(0,pct||0))+'%"></em></i><small>'+(pct==null?'—':Math.round(pct)+'%')+'</small></div></div>';}).join('');
  const water=card.querySelector('.r29-water b');if(water)water.insertAdjacentHTML('beforeend','<small class="r37h-water-goal"> / 2.00 L</small>');
  return box.innerHTML;
 };
 r3Act('r37h-open-diet',()=>{V15().dietDate=r3Date();r3UI.dietDate36=r3Date();go('dietHome');});
 document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.r37h-intake')){event.preventDefault();event.target.click();}});
})();
