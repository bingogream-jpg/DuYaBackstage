// V1.5-r35 mini-program nutrition and food picker presentation fixes.
(()=>{
  const base=SCREENS.dietSearch.render;
  SCREENS.dietSearch.render=function(){
    const box=document.createElement('div');
    box.innerHTML=base();
    const header=box.querySelector('.r27-food-head');
    const search=box.querySelector('.r27-food-search');
    if(header&&search){
      const back=header.querySelector(':scope>button');
      const added=header.querySelector(':scope>span')?.textContent.trim()||'';
      header.classList.add('r35-food-head');
      header.innerHTML='';
      if(back)header.append(back);
      header.append(search);
      if(added){
        const chip=document.createElement('span');
        chip.className='r35-added-chip';
        chip.textContent=added;
        box.querySelector('.r27-food-tools')?.append(chip);
      }
    }
    return box.innerHTML;
  };
  window.R35Mini={renderFoodHeader:true};
})();
