// V1.5-r16 single-mode audiences and unlimited invitation demo defaults.
window.__g16Demo=function(data,now){
  const clone=value=>JSON.parse(JSON.stringify(value));
  data.settings.cap=0;
  if(data.settings.userInviteStages?.length>1)data.settings.userInviteStages=data.settings.userInviteStages.slice(0,1);
  for(const activity of data.growthActivities||[]){
    const a=activity.audience||{};
    a.mode=a.mode||(a.userInviteCodes?.length?'userCodes':a.merchantCodes?.length?'merchants':a.userIds?.length?'users':'all');
    a.userIds=a.mode==='users'?(a.userIds||[]):[];
    a.merchantCodes=a.mode==='merchants'?(a.merchantCodes||[]):[];
    a.userInviteCodes=a.mode==='userCodes'?(a.userInviteCodes||[]):[];
    delete a.allUsers;
    delete a.inviteStatus;
    delete a.registeredFrom;
    delete a.registeredTo;
    activity.audience=clone(a);
  }
  data.revision=1;
  data.now=new Date(now).toISOString();
  return data;
};
