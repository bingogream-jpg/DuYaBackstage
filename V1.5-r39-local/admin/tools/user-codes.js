// Build-time edits apply only to the r38 artifact, never to an older prototype.
module.exports=function userCodes(app){
 const helper=`
 function x38AllUsers(){const result=new Map(data.users.map(u=>[u.id,u]));for(const u of window.R3?.state?.users||[]){const p=u.profile||{};if(!result.has(u.id))result.set(u.id,{...p,id:u.id,name:u.name,phone:p.phone||'',goal:u.goal||'健康饮食',tags:u.tags||[],note:u.note||'',__shared38:true,__source38:u});}return [...result.values()];}
 function x38AllLogins(){const rows=[...data.logins];for(const u of window.R3?.state?.users||[]){const events=(u.loginEvents||[]).map(x=>typeof x==='string'?x:x.at||x.time||x.date).filter(Boolean);for(const day of u.loginDates||[])if(!events.some(t=>String(t).startsWith(day)))events.push(day);for(const time of events)if(!rows.some(x=>x.userId===u.id&&x.time===time))rows.push({userId:u.id,userName:u.name,time:String(time)});}return rows;}
 function x38Codes(id){const d=window.R3?.state;return window.R38DietUpgrade.personalCodes(d?.users?.find(u=>u.id===id),d);}
 function x38Export(title,rows){return window.R36AdminReview.xlsx(title,rows[0],rows.slice(1));}
 function x38CodeMatch(id,prefix){const c=x38Codes(id),f=state.filters;return (!f[prefix+'OwnCode']||c.own.toLowerCase().includes(f[prefix+'OwnCode'].trim().toLowerCase()))&&(!f[prefix+'MerchantCode']||c.bound.toLowerCase().includes(f[prefix+'MerchantCode'].trim().toLowerCase()));}
 function x38CodeFields(prefix){return '<label class="x38-code-filter"><span>本人邀请码</span><input data-filter="'+prefix+'OwnCode" placeholder="输入本人邀请码" value="'+escapeHTML(state.filters[prefix+'OwnCode']||'')+'"></label><label class="x38-code-filter"><span>绑定邀请码</span><input data-filter="'+prefix+'MerchantCode" placeholder="输入绑定邀请码" value="'+escapeHTML(state.filters[prefix+'MerchantCode']||'')+'"></label>';}
 function x38CodeCells(id){const c=x38Codes(id);return '<td>'+escapeHTML(c.own||'—')+'</td><td>'+escapeHTML(c.boundText||'—')+'</td>';}
 function x38LoginFilter(r){const q=(state.filters.loginSearch||'').toLowerCase(),act=state.filters.loginActivity||'全部活跃度';return x38CodeMatch(r.userId,'login')&&(act==='全部活跃度'||loginActivity(r.time)===act)&&(!q||String(r.userName+r.userId).toLowerCase().includes(q));}
 `;
 app=app.replace('  function filteredUsers()',helper+'\n  function filteredUsers()');
 app=app.replace('function userLogins(u){return data.logins.filter','function userLogins(u){return x38AllLogins().filter');
 app=app.replace('function userSubStatus(u){',"function userSubStatus(u){if(u?.__shared38)return window.R38Data.orderStatus(u.__source38);");
 app=app.replace('function userPurchaseSummary(u){',"function userPurchaseSummary(u){if(u?.__shared38){const records=(u.__source38.orders||[]).filter(o=>o.status!=='已退款');return {records,brands:[...new Set(records.map(o=>o.brand||o.brandId))],remaining:records.reduce((n,o)=>n+Number(o.remaining||0),0),subscribed:records.some(o=>['进行中','未开始','已暂停'].includes(o.status))};}");
 const queryStart=app.indexOf('  function filteredUsers()'),queryEnd=app.indexOf('  function renderUsers()',queryStart);
 app=app.slice(0,queryStart)+app.slice(queryStart,queryEnd).replace('return data.users.filter','return x38AllUsers().filter')+app.slice(queryEnd);
 app=app.replace('return(!subscribedOnly||purchase.subscribed)','return x38CodeMatch(u.id,\'user\')&&(!subscribedOnly||purchase.subscribed)');
 const start=app.indexOf('  function renderUsers()'),end=app.indexOf('  function renderAddresses',start);
 let users=app.slice(start,end);
 users=users.replace("${filterTabs('userStatus'","${x38CodeFields('user')}${filterTabs('userStatus'");
 users=users.replace('<th>手机号</th>','<th>手机号</th><th>本人邀请码</th><th>绑定邀请码</th>');
 users=users.replace('<td>${u.phone}</td>','<td>${u.phone}</td>${x38CodeCells(u.id)}');
 users=users.replaceAll('data-action="view-user" data-id="${u.id}"','data-action="${u.__shared38?\'r3-user\':\'view-user\'}" data-id="${u.id}"').replaceAll('data-action="edit-user-note" data-id="${u.id}"','data-action="${u.__shared38?\'r3-user\':\'edit-user-note\'}" data-id="${u.id}"');
 app=app.slice(0,start)+users+app.slice(end);
 const a=app.indexOf('  function renderLoginUsers()'),b=app.indexOf('  function renderCollaborations',a);
 let logins=app.slice(a,b);
 logins=logins.replaceAll('data.logins','x38AllLogins()').replaceAll('data.users.find','x38AllUsers().find');
 logins=logins.replace(/const list=rows\.filter\(r=>[^\n]+;/,'const list=rows.filter(x38LoginFilter);');
 logins=logins.replace("${filterTabs('loginActivity'","${x38CodeFields('login')}${filterTabs('loginActivity'");
 logins=logins.replace('<th>手机号</th>','<th>手机号</th><th>本人邀请码</th><th>绑定邀请码</th>');
 logins=logins.replace("<td>${u.phone||'—'}</td>","<td>${u.phone||'—'}</td>${x38CodeCells(r.userId)}");
 logins=logins.replaceAll('data-action="view-user" data-id="${r.userId}"','data-action="${u.__shared38?\'r3-user\':\'view-user\'}" data-id="${r.userId}"').replaceAll('data-action="edit-user-note" data-id="${r.userId}"','data-action="${u.__shared38?\'r3-user\':\'edit-user-note\'}" data-id="${r.userId}"');
 app=app.slice(0,a)+logins+app.slice(b);
 app=app.replace("['用户名称','用户ID','手机号','性别'","['用户名称','用户ID','手机号','本人邀请码','绑定邀请码','性别'");
 app=app.replace('return [u.name,u.id,u.phone,u.gender','return [u.name,u.id,u.phone,x38Codes(u.id).own||\'—\',x38Codes(u.id).boundText||\'—\',u.gender');
 app=app.replace("['用户ID','用户名','手机号','订购状态'","['用户ID','用户名','手机号','本人邀请码','绑定邀请码','订购状态'");
 app=app.replace('[...latest.values()].map(l=>{const u=data.users.find','[...latest.values()].filter(x38LoginFilter).map(l=>{const u=data.users.find');
 app=app.replace("return [l.userId,l.userName,u?.phone||'—',u?","return [l.userId,l.userName,u?.phone||'—',x38Codes(l.userId).own||'—',x38Codes(l.userId).boundText||'—',u?");
 app=app.replace(/if\(action==='export-logins'\)[^\n]+/,line=>line.replaceAll('data.logins','x38AllLogins()').replaceAll('data.users.find','x38AllUsers().find'));
 app=app.replace(/if\(action==='export-(?:users|logins)'\)[^\n]+/g,line=>line.replace('genericExport(','x38Export('));
 return app;
};
