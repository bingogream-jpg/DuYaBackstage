  // V1.5-r26.1: in-memory-safe demo user switching.
  (()=>{
    function installUserSwitch(){
      const select=document.querySelector('#r3-account');
      if(!select)return;
      select.onchange=event=>{
        const next=event.target.value;
        window.R3.setUser(next);
        if(!window.__DUYA_LOCAL__?.storageHealth?.().memoryOnly){
          location.reload();
          return;
        }
        window.__r3Mini?.apply?.();
        if(typeof render==='function')render();
      };
    }
    if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(installUserSwitch,0),{once:true});
    else setTimeout(installUserSwitch,0);
  })();
