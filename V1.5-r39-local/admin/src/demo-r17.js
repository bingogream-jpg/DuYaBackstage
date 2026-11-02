// V1.5-r17 keeps the r16 data snapshot; presentation and derived reward records changed.
window.__g17Demo=function(data,now){
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
