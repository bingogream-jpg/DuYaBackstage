// V1.5-r37 follow-up metadata migration. Existing reward and activity facts stay intact.
(()=>{
 const E=window.__DUYA_LOCAL_ENGINE;
 if(!E)return;
 const UPGRADE_BASE='2026-10-28T00:00:00+08:00';
 const isUnclaimed=event=>event&&['coupon','meal'].includes(event.type)&&!event.revokedAt&&!event.claimedAt&&!event.walletId&&!event.mealCreditId&&!['已领取','已发放'].includes(event.status);
 function rewardRules(data){
  const rules=data?.settings?.appRules?.rewardRules||{};
  return {couponClaimDays:Number(rules.couponClaimDays)||15,mealClaimDays:Number(rules.mealClaimDays)||15};
 }
 function migrate(data){
  if(!data)return false;
  let changed=false;
  for(const activity of data.activities37||[]){
   if(activity.intro==null){activity.intro=activity.desc||'';changed=true;}
   if(activity.note==null){activity.note=activity.desc||'';changed=true;}
  }
  if(!data.r37CommentsMigration){
   const rules=rewardRules(data),base=Date.parse(UPGRADE_BASE);
   for(const user of data.users||[])for(const event of user.rewards||[]){
    if(!isUnclaimed(event)||Number.isFinite(Date.parse(event.claimExpiresAt)))continue;
    const days=event.type==='coupon'?rules.couponClaimDays:rules.mealClaimDays;
    event.claimValidityDays=days;
    event.claimExpiresAt=new Date(base+days*86400000).toISOString();
    changed=true;
   }
   data.r37CommentsMigration={version:1,upgradedAt:new Date(base).toISOString(),rules};
   changed=true;
  }
  return changed;
 }
 function remainingDays(event,now=Date.now()){
  if(!event?.claimExpiresAt)return null;
  const remaining=Date.parse(event.claimExpiresAt)-now;
  return remaining<=0?0:Math.ceil(remaining/86400000);
 }
 window.R37CommentsData={migrate,remainingDays,rewardRules,upgradeBase:UPGRADE_BASE};
})();
