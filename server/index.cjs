const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
// Local-only config loader. server/.env wins over a project-root .env; neither file is committed.
for (const envPath of [path.join(__dirname, '.env'), path.join(root, '.env')]) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const dbFile = process.env.NEXUS_DB_FILE || path.join(root, 'data', 'nexus.sqlite');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const db = new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('operator','customer')),name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,name TEXT NOT NULL,amount_paise INTEGER NOT NULL CHECK(amount_paise>=0),currency TEXT NOT NULL DEFAULT 'inr',interval TEXT NOT NULL DEFAULT 'month',included_units INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,razorpay_plan_id TEXT,limits_json TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,plan_id TEXT NOT NULL,status TEXT NOT NULL,provider_subscription_id TEXT UNIQUE,current_period_end TEXT,grace_until TEXT,FOREIGN KEY(customer_id) REFERENCES users(id),FOREIGN KEY(plan_id) REFERENCES plans(id));
CREATE TABLE IF NOT EXISTS usage_records(id TEXT PRIMARY KEY,subscription_id TEXT NOT NULL,meter TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>=0),source_event_id TEXT UNIQUE,created_at TEXT NOT NULL,FOREIGN KEY(subscription_id) REFERENCES subscriptions(id));
CREATE TABLE IF NOT EXISTS invoices(id TEXT PRIMARY KEY,subscription_id TEXT NOT NULL,provider_invoice_id TEXT UNIQUE,amount_paise INTEGER NOT NULL,status TEXT NOT NULL,issued_at TEXT NOT NULL,FOREIGN KEY(subscription_id) REFERENCES subscriptions(id));
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,subscription_id TEXT,plan_id TEXT,kind TEXT NOT NULL CHECK(kind IN ('subscribe','change','cancel','refund','campaign_send','website_publish')),status TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL,decided_by TEXT,decided_at TEXT,provider_ref TEXT,FOREIGN KEY(customer_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,at TEXT NOT NULL,actor_id TEXT,action TEXT NOT NULL,target TEXT,details TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS provider_events(id TEXT PRIMARY KEY,received_at TEXT NOT NULL);
`);
const planColumns=db.prepare('PRAGMA table_info(plans)').all().map(x=>x.name);
if(planColumns.includes('stripe_price_id')&&!planColumns.includes('razorpay_plan_id')){db.exec('ALTER TABLE plans RENAME COLUMN stripe_price_id TO razorpay_plan_id');db.exec("UPDATE plans SET razorpay_plan_id=NULL WHERE razorpay_plan_id LIKE 'price_%'");}
if(!db.prepare('PRAGMA table_info(plans)').all().some(x=>x.name==='limits_json'))db.exec("ALTER TABLE plans ADD COLUMN limits_json TEXT NOT NULL DEFAULT '{}'");
if(!db.prepare('PRAGMA table_info(subscriptions)').all().some(x=>x.name==='grace_until'))db.exec('ALTER TABLE subscriptions ADD COLUMN grace_until TEXT');
if(!db.prepare('PRAGMA table_info(requests)').all().some(x=>x.name==='provider_ref'))db.exec('ALTER TABLE requests ADD COLUMN provider_ref TEXT');
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const planCatalog = {
  starter: {name:'Starter',amount:199900,limits:{team_members:3,websites:1,crm_contacts:1000,campaign_emails:2000,webinars:1,ai_credits:100}},
  growth: {name:'Growth',amount:599900,limits:{team_members:10,websites:3,crm_contacts:10000,campaign_emails:15000,webinars:5,ai_credits:750}},
  scale: {name:'Scale',amount:1499900,limits:{team_members:25,websites:10,crm_contacts:50000,campaign_emails:60000,webinars:20,ai_credits:2500}}
};
function passwordHash(password) { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function passwordMatches(password, stored) { const [salt, digest] = stored.split(':'); const candidate = crypto.scryptSync(password, salt, 64); return crypto.timingSafeEqual(candidate, Buffer.from(digest, 'hex')); }
function audit(actor, action, target, details = {}) { db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(id(), now(), actor || null, action, target || null, JSON.stringify(details)); }
function seed() {
  if (db.prepare('SELECT COUNT(*) n FROM users').get().n) return;
  const demoPassword = process.env.NEXUS_DEMO_PASSWORD || 'NexusDemo!2026';
  for (const [uid, email, role, name] of [['operator-demo','nexus@nexus.demo','operator','Nexus Demo'],['customer-demo','customer@nexus.demo','customer','Demo Customer'],['customer-new-demo','newcustomer@nexus.demo','customer','New Demo Customer'],['customer-buyer-demo','buyer@nexus.demo','customer','Demo Buyer']]) db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(uid,email,passwordHash(demoPassword),role,name);
  for (const [pid,p] of Object.entries(planCatalog)) db.prepare('INSERT INTO plans(id,name,amount_paise,currency,interval,included_units,limits_json) VALUES(?,?,?,?,?,?,?)').run(pid,p.name,p.amount,'inr','month',p.limits.crm_contacts,JSON.stringify(p.limits));
  db.prepare('INSERT INTO subscriptions(id,customer_id,plan_id,status,current_period_end) VALUES(?,?,?,?,?)').run('sub-demo','customer-demo','growth','demo_active','2026-11-10');
  db.prepare('INSERT INTO invoices(id,subscription_id,amount_paise,status,issued_at) VALUES(?,?,?,?,?)').run('inv-demo','sub-demo',599900,'demo_paid',now());
  audit(null,'demo.seed','workspace',{notice:'Illustrative local records; no provider payment.'});
}
seed();
db.prepare("UPDATE users SET email='nexus@nexus.demo',name='Nexus Demo' WHERE id='operator-demo'").run();
db.prepare("DELETE FROM sessions WHERE user_id<>'operator-demo'").run();
if (!db.prepare('SELECT id FROM users WHERE email=?').get('buyer@nexus.demo')) {
  db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run('customer-buyer-demo','buyer@nexus.demo',passwordHash(process.env.NEXUS_DEMO_PASSWORD||'NexusDemo!2026'),'customer','Demo Buyer');
}
// These fixed local demo accounts always follow the configured demo password.
if (process.env.NEXUS_DEMO_PASSWORD) {
  const demoHash = passwordHash(process.env.NEXUS_DEMO_PASSWORD);
  db.prepare("UPDATE users SET password_hash=? WHERE id='operator-demo'").run(demoHash);
}
// Align pre-existing local demo data to the approved commercial catalog.
for (const [pid,p] of Object.entries(planCatalog)) {
  if (db.prepare('SELECT id FROM plans WHERE id=?').get(pid)) db.prepare('UPDATE plans SET name=?,amount_paise=?,included_units=?,limits_json=? WHERE id=?').run(p.name,p.amount,p.limits.crm_contacts,JSON.stringify(p.limits),pid);
  else db.prepare('INSERT INTO plans(id,name,amount_paise,currency,interval,included_units,limits_json) VALUES(?,?,?,?,?,?,?)').run(pid,p.name,p.amount,'inr','month',p.limits.crm_contacts,JSON.stringify(p.limits));
}
db.prepare("UPDATE subscriptions SET plan_id='growth' WHERE plan_id IN ('pro','business')").run();
db.prepare("UPDATE plans SET active=0 WHERE id IN ('pro','business')").run();
const json = (res, status, data, headers={}) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
const error = (res,status,message) => json(res,status,{error:message});
const one = (sql,...args) => db.prepare(sql).get(...args);
const all = (sql,...args) => db.prepare(sql).all(...args);
const cookie = req => Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));
function actor(req) { const token=cookie(req).nexus_session; if(!token)return null; return one('SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?',hash(token),Date.now()); }
async function body(req,limit=65536) { let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(new Error('Request too large'),{status:413});chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}')}catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}}
function requireRole(user,role) {if(!user)throw Object.assign(new Error('Sign in required'),{status:401});if(role&&user.role!==role)throw Object.assign(new Error('Forbidden'),{status:403});}
function requireJson(req) {if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('JSON content type required'),{status:415});}
function ownSubscription(user,subId) {const s=one('SELECT * FROM subscriptions WHERE id=?',subId);if(!s||user.role==='customer'&&s.customer_id!==user.id)throw Object.assign(new Error('Subscription not found'),{status:404});return s;}
function validatePlan(planId) {const p=one('SELECT * FROM plans WHERE id=? AND active=1',planId);if(!p)throw Object.assign(new Error('Plan not found'),{status:404});return p;}
const rate = new Map();
function loginLimit(req) {const key=req.socket.remoteAddress||'local',t=Date.now(),r=(rate.get(key)||[]).filter(x=>t-x<60000);if(r.length>=10)throw Object.assign(new Error('Too many attempts; retry shortly'),{status:429});r.push(t);rate.set(key,r);}
function requestRow(user,kind,subscriptionId,planId,details={}) {const rid=id();db.prepare('INSERT INTO requests(id,customer_id,subscription_id,plan_id,kind,status,details,created_at) VALUES(?,?,?,?,?,?,?,?)').run(rid,user.id,subscriptionId||null,planId||null,kind,'pending',JSON.stringify(details),now());audit(user.id,'approval.requested',rid,{kind,subscriptionId,planId});return one('SELECT * FROM requests WHERE id=?',rid);}
function razorpayEnabled(){return !!(process.env.RAZORPAY_TEST_KEY_ID?.startsWith('rzp_test_')&&process.env.RAZORPAY_TEST_KEY_SECRET)}
async function razorpay(method,endpoint,payload){if(!razorpayEnabled())throw Object.assign(new Error('Razorpay test keys are not configured'),{status:503});const response=await fetch('https://api.razorpay.com/v1'+endpoint,{method,headers:{Authorization:'Basic '+Buffer.from(`${process.env.RAZORPAY_TEST_KEY_ID}:${process.env.RAZORPAY_TEST_KEY_SECRET}`).toString('base64'),'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error?.description||'Razorpay request failed'),{status:502});return data;}
async function startCheckout(user,req,res){
  requireJson(req);
  const x=await body(req),plan=validatePlan(x.plan_id);
  const existing=one("SELECT * FROM subscriptions WHERE customer_id=? AND status NOT IN ('canceled','cancelled','demo_canceled') ORDER BY rowid DESC LIMIT 1",user.id);
  if(existing){
    if(existing.provider_subscription_id&&existing.status==='created'){
      const provider=await razorpay('GET',`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}`);
      if(provider.status==='created'&&provider.notes?.nexus_billing_mode!=='upfront_monthly_v1'){
        await razorpay('POST',`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}/cancel`,{cancel_at_cycle_end:false});
        db.prepare("UPDATE subscriptions SET status='canceled' WHERE id=?").run(existing.id);
        audit(user.id,'billing.old_checkout_replaced',existing.id,{providerSubscriptionId:existing.provider_subscription_id});
      }else if(provider.status==='created'){
        if(existing.plan_id===plan.id){
          if(!provider.short_url)return error(res,502,'Razorpay checkout link is unavailable');
          return json(res,200,{url:provider.short_url,subscription_id:existing.id,reused:true});
        }
        if(!plan.razorpay_plan_id)return error(res,409,'Plan has no Razorpay test plan ID');
        await razorpay('POST',`/subscriptions/${encodeURIComponent(existing.provider_subscription_id)}/cancel`,{cancel_at_cycle_end:false});
        db.prepare("UPDATE subscriptions SET status='canceled' WHERE id=?").run(existing.id);
        audit(user.id,'billing.pending_checkout_replaced',existing.id,{from:existing.plan_id,to:plan.id,providerSubscriptionId:existing.provider_subscription_id});
      }else{
        db.prepare('UPDATE subscriptions SET status=? WHERE id=?').run(provider.status||'authenticated',existing.id);
        return error(res,409,'Existing subscription has already been authorised; cancel it before buying again');
      }
    }else{
      return error(res,409,'Customer already has a subscription');
    }
  }
  if(!plan.razorpay_plan_id)return error(res,409,'Plan has no Razorpay test plan ID');
  const subId=id();
  const created=await razorpay('POST','/subscriptions',{plan_id:plan.razorpay_plan_id,total_count:11,quantity:1,start_at:Math.floor(Date.now()/1000)+30*86400,customer_notify:false,addons:[{item:{name:`Nexus ${plan.name} first month`,amount:plan.amount_paise,currency:'INR'}}],notes:{nexus_subscription_id:subId,nexus_customer_id:user.id,nexus_billing_mode:'upfront_monthly_v1'}});
  if(!created.id||!created.short_url)return error(res,502,'Razorpay did not return a checkout link');
  db.prepare('INSERT INTO subscriptions(id,customer_id,plan_id,status,provider_subscription_id,current_period_end) VALUES(?,?,?,?,?,?)').run(subId,user.id,plan.id,created.status||'created',created.id,null);
  audit(user.id,'billing.checkout_started',subId,{providerSubscriptionId:created.id,plan_id:plan.id,upfront_amount_paise:plan.amount_paise,next_charge_days:30,source:'billing_tab'});
  return json(res,201,{url:created.short_url,subscription_id:subId,reused:false});
}
function razorpaySignature(raw,header,secret){if(!header||!secret||!/^[a-f0-9]{64}$/i.test(header))return false;const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');return crypto.timingSafeEqual(Buffer.from(header,'hex'),Buffer.from(expected,'hex'));}
async function webhook(req,res){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>1048576)return error(res,413,'Webhook too large');chunks.push(chunk)}const raw=Buffer.concat(chunks).toString();if(!razorpaySignature(raw,req.headers['x-razorpay-signature'],process.env.RAZORPAY_WEBHOOK_SECRET))return error(res,400,'Invalid webhook signature');const eventId=req.headers['x-razorpay-event-id'];if(!eventId||typeof eventId!=='string')return error(res,400,'Missing event ID');let event;try{event=JSON.parse(raw)}catch{return error(res,400,'Invalid event')};if(one('SELECT id FROM provider_events WHERE id=?',eventId))return json(res,200,{received:true,duplicate:true});db.exec('BEGIN');try{db.prepare('INSERT INTO provider_events VALUES(?,?)').run(eventId,now());const entity=event.payload?.subscription?.entity,payment=event.payload?.payment?.entity,sub=entity?.id?one('SELECT * FROM subscriptions WHERE provider_subscription_id=?',entity.id):null;if(sub&&event.event?.startsWith('subscription.')){const matched=entity.plan_id?one('SELECT id FROM plans WHERE razorpay_plan_id=?',entity.plan_id):null;db.prepare('UPDATE subscriptions SET status=?,current_period_end=?,plan_id=? WHERE id=?').run(entity.status||sub.status,entity.current_end?new Date(entity.current_end*1000).toISOString():null,matched?.id||sub.plan_id,sub.id);audit(null,'billing.subscription_updated',sub.id,{status:entity.status,providerEvent:eventId});}
if(sub&&payment&&['subscription.charged','payment.failed'].includes(event.event)){const invoiceId=payment.invoice_id||payment.id,status=event.event==='subscription.charged'?'paid':'payment_failed',existing=one('SELECT id FROM invoices WHERE provider_invoice_id=?',invoiceId);if(existing)db.prepare('UPDATE invoices SET status=? WHERE id=?').run(status,existing.id);else db.prepare('INSERT INTO invoices VALUES(?,?,?,?,?,?)').run(id(),sub.id,invoiceId,payment.amount||0,status,now());db.prepare('UPDATE subscriptions SET grace_until=? WHERE id=?').run(event.event==='payment.failed'?new Date(Date.now()+5*86400000).toISOString():null,sub.id);audit(null,event.event,sub.id,{providerEvent:eventId,paymentId:payment.id,grace_days:event.event==='payment.failed'?5:0});}
db.exec('COMMIT');return json(res,200,{received:true});}catch(e){db.exec('ROLLBACK');return error(res,500,'Webhook processing failed');}}
async function api(req,res,url){const route=url.pathname,user=actor(req);if(route==='/api/health')return json(res,200,{ok:true,razorpayTestConfigured:razorpayEnabled(),geminiConfigured:!!process.env.GEMINI_API_KEY});if(route==='/api/login'&&req.method==='POST'){requireJson(req);loginLimit(req);const input=await body(req),found=one('SELECT * FROM users WHERE email=?',String(input.email||'').toLowerCase());if(found?.id!=='operator-demo'||!passwordMatches(String(input.password||''),found.password_hash))return error(res,401,'Invalid credentials');const token=crypto.randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),found.id,Date.now()+8*3600000);audit(found.id,'auth.login',found.id);return json(res,200,{user:{id:found.id,email:found.email,name:found.name,role:found.role}}, {'Set-Cookie':`nexus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`});}
if(route==='/api/logout'&&req.method==='POST'){if(user)db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);return json(res,200,{ok:true},{'Set-Cookie':'nexus_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
if(route==='/api/public/plans'&&req.method==='GET')return json(res,200,{plans:all("SELECT id,name,amount_paise,currency,interval,limits_json FROM plans WHERE active=1 AND razorpay_plan_id IS NOT NULL ORDER BY amount_paise")});
if(route==='/api/public/subscriptions/checkout'&&req.method==='POST'){loginLimit(req);const demoUser=one("SELECT id,email,name,role FROM users WHERE id='operator-demo'");return startCheckout(demoUser,req,res);}
requireRole(user);if(route==='/api/me')return json(res,200,{user});
if(route==='/api/plans'&&req.method==='GET')return json(res,200,{plans:all('SELECT * FROM plans WHERE active=1 ORDER BY amount_paise')});
if(route==='/api/admin/provision-razorpay-plans'&&req.method==='POST'){requireRole(user,'operator');const plans=all('SELECT * FROM plans WHERE active=1 ORDER BY amount_paise');const provisioned=[];for(const plan of plans){if(plan.razorpay_plan_id){provisioned.push({id:plan.id,razorpay_plan_id:plan.razorpay_plan_id,created:false});continue}const created=await razorpay('POST','/plans',{period:'monthly',interval:1,item:{name:`Nexus ${plan.name}`,amount:plan.amount_paise,currency:'INR',description:`Nexus ${plan.name} monthly plan; GST included.`},notes:{nexus_plan_id:plan.id,environment:'test'}});db.prepare('UPDATE plans SET razorpay_plan_id=? WHERE id=?').run(created.id,plan.id);audit(user.id,'plan.razorpay_created',plan.id,{providerPlanId:created.id});provisioned.push({id:plan.id,razorpay_plan_id:created.id,created:true})}return json(res,201,{plans:provisioned});}
if(route==='/api/plans'&&req.method==='POST'){requireRole(user,'operator');requireJson(req);const x=await body(req),amount=Number(x.amount_paise),units=Number(x.included_units||0);if(!String(x.name||'').trim()||!Number.isInteger(amount)||amount<100||!Number.isInteger(units)||units<0)return error(res,400,'Paid plans require at least INR 1.00 and valid usage');const pid=id();db.prepare('INSERT INTO plans(id,name,amount_paise,currency,interval,included_units) VALUES(?,?,?,?,?,?)').run(pid,String(x.name).slice(0,80),amount,'inr','month',units);audit(user.id,'plan.created',pid,{amount_paise:amount});return json(res,201,{plan:one('SELECT * FROM plans WHERE id=?',pid)});}
if(/^\/api\/plans\/[^/]+\/razorpay-plan$/.test(route)&&req.method==='POST'){requireRole(user,'operator');requireJson(req);const pid=route.split('/')[3],plan=validatePlan(pid),x=await body(req),providerId=String(x.razorpay_plan_id||'');if(!/^plan_[a-zA-Z0-9]+$/.test(providerId))return error(res,400,'Invalid Razorpay plan ID');const providerPlan=await razorpay('GET',`/plans/${encodeURIComponent(providerId)}`);if(providerPlan.period!=='monthly'||providerPlan.interval!==1||providerPlan.item?.currency!=='INR'||providerPlan.item?.amount!==plan.amount_paise)return error(res,409,'Razorpay test plan must be monthly, INR, and match the Nexus amount');db.prepare('UPDATE plans SET razorpay_plan_id=? WHERE id=?').run(providerId,pid);audit(user.id,'plan.razorpay_linked',pid,{providerPlanId:providerId});return json(res,200,{plan:one('SELECT * FROM plans WHERE id=?',pid)});}
if(route==='/api/subscriptions'&&req.method==='GET')return json(res,200,{subscriptions:all(`SELECT s.*,p.name plan_name,p.amount_paise,u.email customer_email FROM subscriptions s JOIN plans p ON p.id=s.plan_id JOIN users u ON u.id=s.customer_id ${user.role==='customer'?'WHERE s.customer_id=?':''} ORDER BY s.id`,...(user.role==='customer'?[user.id]:[]))});
if(route==='/api/subscriptions/checkout'&&req.method==='POST'){
  requireRole(user,'operator');
  return startCheckout(user,req,res);
}
if(/^\/api\/subscriptions\/[^/]+\/change$/.test(route)&&req.method==='POST'){
  requireRole(user,'operator');requireJson(req);
  const sub=ownSubscription(user,route.split('/')[3]),input=await body(req);
  if(!sub.provider_subscription_id)return error(res,409,'Sample subscription has no Razorpay subscription');
  if(['canceled','cancelled'].includes(sub.status))return error(res,409,'Subscription is canceled');
  const plan=validatePlan(input.plan_id),current=validatePlan(sub.plan_id);
  if(plan.id===current.id)return error(res,409,'Subscription is already on this plan');
  if(!plan.razorpay_plan_id)return error(res,409,'Target plan has no Razorpay test plan ID');
  const schedule=plan.amount_paise>current.amount_paise?'now':'cycle_end';
  await razorpay('PATCH',`/subscriptions/${encodeURIComponent(sub.provider_subscription_id)}`,{plan_id:plan.razorpay_plan_id,schedule_change_at:schedule,customer_notify:false});
  audit(user.id,'billing.plan_change_submitted',sub.id,{from:current.id,to:plan.id,schedule});
  return json(res,200,{submitted:true,schedule,notice:'Razorpay will confirm the final plan through a verified webhook.'});
}
if(/^\/api\/subscriptions\/[^/]+\/cancel$/.test(route)&&req.method==='POST'){
  requireRole(user,'operator');
  const sub=ownSubscription(user,route.split('/')[3]);
  if(!sub.provider_subscription_id)return error(res,409,'Sample subscription has no Razorpay subscription');
  if(['canceled','cancelled'].includes(sub.status))return error(res,409,'Subscription is already canceled');
  await razorpay('POST',`/subscriptions/${encodeURIComponent(sub.provider_subscription_id)}/cancel`,{cancel_at_cycle_end:false});
  audit(user.id,'billing.cancellation_submitted',sub.id,{immediate:true,no_refund:true});
  return json(res,200,{submitted:true,notice:'Razorpay will confirm cancellation through a verified webhook.'});
}
if(route==='/api/invoices'&&req.method==='GET')return json(res,200,{invoices:all(`SELECT i.*,u.email customer_email FROM invoices i JOIN subscriptions s ON s.id=i.subscription_id JOIN users u ON u.id=s.customer_id ${user.role==='customer'?'WHERE s.customer_id=?':''} ORDER BY i.issued_at DESC`,...(user.role==='customer'?[user.id]:[]))});
if(route==='/api/usage'&&req.method==='GET')return json(res,200,{usage:all(`SELECT ur.* FROM usage_records ur JOIN subscriptions s ON s.id=ur.subscription_id ${user.role==='customer'?'WHERE s.customer_id=?':''} ORDER BY ur.created_at DESC`,...(user.role==='customer'?[user.id]:[]))});
if(route==='/api/usage'&&req.method==='POST'){requireRole(user,'operator');requireJson(req);const x=await body(req),sub=ownSubscription(user,x.subscription_id),quantity=Number(x.quantity);if(!sub||!String(x.meter||'').trim()||!Number.isInteger(quantity)||quantity<0||!String(x.source_event_id||'').trim())return error(res,400,'Invalid usage record');const uid=id();try{db.prepare('INSERT INTO usage_records VALUES(?,?,?,?,?,?)').run(uid,sub.id,String(x.meter).slice(0,60),quantity,String(x.source_event_id),now())}catch{return error(res,409,'Duplicate source event')};audit(user.id,'usage.reported',uid,{subscription_id:sub.id,quantity});return json(res,201,{usage:one('SELECT * FROM usage_records WHERE id=?',uid)});}
if(route==='/api/requests'&&req.method==='GET')return json(res,200,{requests:all(`SELECT r.*,u.email customer_email FROM requests r JOIN users u ON u.id=r.customer_id WHERE r.kind IN ('change','cancel') ${user.role==='customer'?'AND r.customer_id=?':''} ORDER BY r.created_at DESC`,...(user.role==='customer'?[user.id]:[]))});
if(route==='/api/requests'&&req.method==='POST')return error(res,410,'Approval requests are no longer used');
if(/^\/api\/requests\/[^/]+\/decision$/.test(route)&&req.method==='POST')return error(res,410,'Approval requests are no longer used');
if(/^\/api\/requests\/[^/]+\/execute$/.test(route)&&req.method==='POST')return error(res,410,'Approval requests are no longer used');
if(route==='/api/audit'&&req.method==='GET'){requireRole(user,'operator');return json(res,200,{audit:all('SELECT * FROM audit ORDER BY at DESC LIMIT 100')});}
if(route==='/api/agent/draft'&&req.method==='POST'){requireRole(user,'operator');requireJson(req);const x=await body(req),goal=String(x.goal||'').trim();if(!goal||goal.length>1000)return error(res,400,'Provide a goal under 1000 characters');if(!process.env.GEMINI_API_KEY)return error(res,503,'Gemini API key is not configured');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL||'gemini-3.8-flash')}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:'You draft Nexus business workflow plans only. Never claim to execute, charge, send, publish, or approve. Show required human approvals for all consequential actions. Do not invent customer consent or billing state.'}]},contents:[{parts:[{text:goal}]}]}),signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Gemini request failed');const draft=(data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').slice(0,10000);audit(user.id,'agent.plan_drafted','workflow',{goal_length:goal.length});return json(res,200,{draft,executed:false});}finally{clearTimeout(timer)}}
return error(res,404,'Not found');}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
function staticFile(req,res,url){let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';const file=path.resolve(root,'dist','.'+pathname);if(!file.startsWith(path.resolve(root,'dist')+path.sep))return error(res,403,'Forbidden');fs.readFile(file,(e,data)=>{if(e)return error(res,404,'Not found');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",'Cache-Control':'no-store'});res.end(data)});}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/razorpay/webhook'&&req.method==='POST')return await webhook(req,res);if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(req.method!=='GET')return error(res,405,'Method not allowed');return staticFile(req,res,url);}catch(e){console.error(`[nexus] ${req.method} ${req.url}:`,e.stack||e.message);return error(res,e.status||500,e.status?e.message:'Request failed')}});
if(require.main===module)server.listen(Number(process.env.PORT||4175),'127.0.0.1',()=>console.log(`Nexus local server: http://127.0.0.1:${process.env.PORT||4175}`));
module.exports={server,db,razorpaySignature};

