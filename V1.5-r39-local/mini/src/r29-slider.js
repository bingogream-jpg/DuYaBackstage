(()=>{
  const tick=value=>Math.max(0,Math.min(1000,Math.round((Number(value)||0)*10)));
  function fromBounds(first,second){const a=tick(first),b=Math.max(a,tick(second));return {carb:a/10,protein:(b-a)/10,fat:(1000-b)/10};}
  function move(percentages,thumb,value){const a=tick(percentages.carb),b=Math.min(1000,a+tick(percentages.protein)),v=tick(value);return thumb===0?fromBounds(Math.min(v,b)/10,b/10):fromBounds(a/10,Math.max(a,v)/10);}
  window.R29Ratios={fromBounds,move};
})();
