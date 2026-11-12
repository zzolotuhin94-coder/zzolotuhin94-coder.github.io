// Mini-Supabase für Tests: Auth (Passwort/Refresh), RPC wie schema.sql, Storage, send-order
const http=require('http'),fs=require('fs');
const users={'anna@x':{id:'u-anna',pw:'pw1',name:'Anna',role:'owner'},'bernd@x':{id:'u-bernd',pw:'pw2',name:'Bernd',role:'chef'},'tom@x':{id:'u-tom',pw:'pw3',name:'Tom',role:'staff'}};
const RID='11111111-1111-1111-1111-111111111111';let state=null,version=0,updatedBy=null;const files={},mails=[];let tokN=0;const toks={};
const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization, apikey, content-type, x-upsert','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
http.createServer((q,s)=>{const ch=[];q.on('data',d=>ch.push(d));q.on('end',()=>{const buf=Buffer.concat(ch);const u=new URL(q.url,'http://x');
 const send=(c,o,ct='application/json')=>{s.writeHead(c,{...cors,'content-type':ct});s.end(ct==='application/json'?JSON.stringify(o):o)};
 if(q.method==='OPTIONS')return send(200,{});
 if(u.pathname==='/app/'||u.pathname==='/app/index.html'){return send(200,fs.readFileSync('/home/user/zzolotuhin94-coder.github.io/dahuam/index.html'),'text/html; charset=utf-8');}
 if(u.pathname==='/stats')return send(200,{version,mails,files:Object.keys(files),updatedBy});
 if(q.headers.apikey!=='anon-key')return send(401,{message:'No API key'});
 if(u.pathname==='/auth/v1/token'){const j=JSON.parse(buf.toString()||'{}');let usr;
   if(u.searchParams.get('grant_type')==='password'){usr=users[j.email];if(!usr||usr.pw!==j.password)return send(400,{error_description:'Invalid login credentials'});}
   else {usr=toks['r:'+j.refresh_token];if(!usr)return send(400,{error_description:'bad refresh'});}
   const t='t'+(++tokN);toks[t]=usr;toks['r:rf'+tokN]=usr;return send(200,{access_token:t,refresh_token:'rf'+tokN,expires_in:3600,user:{id:usr.id,email:j.email}});}
 const usr=toks[(q.headers.authorization||'').replace('Bearer ','')];if(!usr)return send(401,{message:'JWT invalid'});
 const body=()=>JSON.parse(buf.toString()||'{}');
 if(u.pathname==='/rest/v1/rpc/my_memberships')return send(200,[{restaurant_id:RID,restaurant_name:'DAHUAM.202',name:usr.name,role:usr.role}]);
 if(u.pathname==='/rest/v1/rpc/get_state')return send(200,state?{version,data:state,updated_at:new Date().toISOString(),updated_by:updatedBy}:{version:0,data:null});
 if(u.pathname==='/rest/v1/rpc/get_version')return send(200,{version,updated_by:updatedBy});
 if(u.pathname==='/rest/v1/rpc/save_state'){const j=body();if(state&&version!==(j.p_expected||0))return send(200,{ok:false,version,data:state});state=j.p_data;version=state&&version?version+1:1;if(version===1&&j.p_expected)version=1;updatedBy=usr.name;return send(200,{ok:true,version});}
 const m=u.pathname.match(/^\/storage\/v1\/object\/(?:authenticated\/)?photos\/(.+)$/);
 if(m){if(q.method==='POST'||q.method==='PUT'){files[m[1]]=buf;return send(200,{Key:m[1]});} if(!files[m[1]])return send(404,{message:'not found'});return send(200,files[m[1]],'image/jpeg');}
 if(u.pathname==='/functions/v1/send-order'){if(usr.role==='staff')return send(403,{message:'Mitarbeiter dürfen keine Bestellungen senden'});const j=body();mails.push({to:j.to,subject:j.subject,by:usr.name,len:j.text.length});return send(200,{id:'msg-'+mails.length});}
 send(404,{message:'nope '+u.pathname});});}).listen(9922,()=>console.log('mock up'));
