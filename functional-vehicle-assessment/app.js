
(function(){
'use strict';
const DB=window.BAMCO_DATA;
const KEY='bamco-functional-assessment-v1';
const scoreWords=['','غیرقابل قبول','بحرانی','بسیار ضعیف','ضعیف','حداقل پذیرش','مرزی','قابل قبول','رضایت‌بخش','بسیار عالی','ممتاز'];
const defaultConfig={vclass:'M1',body:'Sedan',power:'ICE',gear:'Automatic',driveType:'FWD',driveKm:5250,durKm:45000,durDays:90,startOdo:5000};
const state={config:{...defaultConfig},tab:'setup',driveDay:1,durDay:1,category:'همه',query:'',page:0,records:{},mileage:{drive:{},durability:{}},setupComplete:false};
const categories=[...new Set(DB.tests.map(x=>x.cat))];
const testById=new Map(DB.tests.map(x=>[x.id,x]));
const byId=id=>document.getElementById(id);
const number=n=>Number(n||0).toLocaleString('fa-IR',{maximumFractionDigits:1});
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=s=>String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/ة/g,'ه');
function save(){try{localStorage.setItem(KEY,JSON.stringify({config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete}));return true}catch(e){toast('حافظه مرورگر پر شده است؛ نسخه پشتیبان بگیرید.');return false}}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v){state.config={...defaultConfig,...(v.config||{})};delete state.config.cabin;delete state.config.seatRows;delete state.config.offroad;state.records=v.records||{};state.mileage=v.mileage||{drive:{},durability:{}};state.setupComplete=Boolean(v.setupComplete);state.tab=state.setupComplete?'drive':'setup';}}catch(e){console.warn('Cannot read saved assessment',e)}}
let tm;function toast(s){const t=byId('toast');t.textContent=s;t.classList.remove('hidden');clearTimeout(tm);tm=setTimeout(()=>t.classList.add('hidden'),3200)}
function conf(){return state.config}
function parts(s){return String(s||'').split(/\s*\/\s*|\s*\|\s*/).map(x=>x.trim()).filter(Boolean)}
function allowed(rule,value){if(!rule||rule==='All'||rule==='None')return true;return parts(rule).includes(String(value))}
function applicable(t){
const v=t.vehicle||{},c=conf();
if(!allowed(v.cls,c.vclass)||!allowed(v.body,c.body)||!allowed(v.power,c.power)||!allowed(v.gear,c.gear)||!allowed(v.drive,c.driveType))return false;
const label=(t.name+' '+t.sub+' '+t.route).toLowerCase();
if(!['AWD','4WD'].includes(c.driveType)&&(/خارج.?جاده|آفرود|off.road|قفل دیفرانسیل/i.test(label)||String(t.route).includes('خاکی')))return false;
if(c.gear==='Manual'&&(/گیربکس اتوماتیک|دنده اتوماتیک|تیپ.?ترونیک|p\/n|p، r، n، d/i.test(label)))return false;
if(c.gear==='Automatic'&&(/کیفیت تعویض دنده دستی|پدال کلاچ|اهرم کلاچ/i.test(label)))return false;
if(c.power==='ICE'&&(/باتری کششی|موتور برقی محرکه|اینورتر قدرت|برد تمام.برقی|ترمز احیاکننده|شارژ باتری ولتاژ بالا/i.test(label)))return false;
return true
}
const candidates=tab=>DB.tests.filter(t=>t.scope.includes(tab==='drive'?'drive':tab==='durability'?'durability':'supplementary')&&applicable(t));
function activeRoutes(){const a=DB.routes.filter(r=>['AWD','4WD'].includes(conf().driveType)||(!/خارج.?جاده|خاکی/i.test(r.name)));const total=a.reduce((v,x)=>v+Math.max(0,x.durShare),0);return a.map(x=>({...x,share:x.durShare/total}))}
function dayCategoryPlan(){
const n=Math.max(1,Math.min(365,Number(conf().durDays)||90)),totalKm=Math.max(100,Number(conf().durKm)||45000),routes=activeRoutes();
const raw=routes.map(r=>n*r.share),counts=raw.map(Math.floor),left=n-counts.reduce((a,b)=>a+b,0);
const order=raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac);
for(let j=0;j<left;j++)counts[order[j%order.length].i]++;
const used=counts.map(()=>0),picked=[];
for(let d=1;d<=n;d++){let chosen=-1,best=-Infinity;for(let i=0;i<routes.length;i++){if(used[i]>=counts[i])continue;const v=d*counts[i]/n-used[i];if(v>best){best=v;chosen=i}}if(chosen<0)chosen=0;used[chosen]++;picked.push(chosen)}
const alloc=counts.map((count,i)=>count?Math.max(0,Math.round(totalKm*routes[i].share)):0),assigned=alloc.reduce((a,b)=>a+b,0);
if(alloc.length)alloc[alloc.length-1]+=totalKm-assigned;
const countLeft=counts.slice(),kmLeft=alloc.slice(),out=[];let sum=0;
for(let d=1;d<=n;d++){const i=picked[d-1];const km=countLeft[i]>1?Math.max(0,Math.floor(kmLeft[i]/countLeft[i])):kmLeft[i];countLeft[i]--;kmLeft[i]-=km;sum+=km;const r=routes[i];out.push({day:d,type:r.name,route:r.suggest||r.name,km,cum:sum,odo:Number(conf().startOdo)+sum,cap:r.cap,over:km>r.cap});}
return out
}
function driveProgram(){const days=DB.driveDays;const rset=DB.routes,counts={};days.forEach(x=>counts[x.route]=(counts[x.route]||0)+1);
const valid=rset.filter(r=>counts[r.name]);const denominator=valid.reduce((a,b)=>a+b.driveShare,0)||1;const kmLeft={};valid.forEach(r=>kmLeft[r.name]=Math.round(Number(conf().driveKm)*r.driveShare/denominator));
const target=Number(conf().driveKm),allocated=Object.values(kmLeft).reduce((a,b)=>a+b,0);if(valid.length)kmLeft[valid[valid.length-1].name]+=target-allocated;
const rem={...counts};let cum=0;
return days.map(x=>{const r=valid.find(v=>v.name===x.route);let km=0;if(r){km=rem[x.route]>1?Math.floor(kmLeft[x.route]/rem[x.route]):kmLeft[x.route];kmLeft[x.route]-=km;rem[x.route]--;}else{km=Math.floor(target/days.length)}cum+=km;return {...x,km,cum}})
}
function checksOnPlan(plan){
let milestones=new Map(),step=5000;
for(const p of plan){while(step<=p.cum&&step<=Number(conf().durKm)){if(!milestones.has(p.day))milestones.set(p.day,[]);milestones.get(p.day).push(step);step+=5000;}}
return milestones
}
function durabilityTestsForDay(day,plan){
const milestones=checksOnPlan(plan),m=milestones.get(day)||[],n=plan.length;
return candidates('durability').filter(t=>{if(t.freq.includes('روزانه'))return true;if(t.freq.includes('۵۰۰۰')||t.freq.includes('5000'))return m.length>0;return day===1||day===Math.ceil(n/2)||day===n;});
}
function currentDay(){return state.tab==='drive'?state.driveDay:state.durDay}
function scope(){return state.tab}
function dayItems(){
if(state.tab==='supplementary')return candidates('supplementary');
if(state.tab==='drive')return candidates('drive').filter(t=>t.days.includes(state.driveDay));
return durabilityTestsForDay(state.durDay,dayCategoryPlan())
}
function ratedKey(t){return state.tab+':'+(state.tab==='supplementary'?'general':currentDay())+':'+t.id}
function record(t){return state.records[ratedKey(t)]||{}}
function avg(items){if(!items.length)return null;return items.reduce((a,b)=>a+b,0)/items.length}
function scoresForTab(tab){return Object.entries(state.records).filter(([k,v])=>k.startsWith(tab+':')&&Number(v.score)>=1&&Number(v.score)<=10).map(([k,v])=>({id:k.split(':').pop(),score:Number(v.score),entry:v}))}
function viewSummary(items){const scored=items.filter(t=>Number(record(t).score)>0).length;return [items.length,scored]}
function renderSetup(){for(const [k,v] of Object.entries(conf())){const e=byId(k);if(e)e.value=v;}const m=Math.ceil(Number(conf().durKm||45000)/Math.max(1,Number(conf().durDays||90)));byId('setupInfo').textContent='میانگین لازم: '+number(m)+' کیلومتر در روز. مسافت هدف هر نوع مسیر و روزهای کنترل، بعد از شروع برنامه محاسبه می‌شوند. داده‌های قبلی شما در همین مرورگر باقی می‌مانند.'}
function getDriveRoute(p){return p.name||p.route||'تهران'}
function routeTokens(label){
 const v=String(label||'').replace(/[\u200c\u200f]/g,' ').replace(/ و بازگشت.*| دور برگشت.*|مطابق مجوز مسیر/g,'').trim();
 const separators=/\s+[–—-]\s+|\s+به\s+/;
 const p=v.split(separators).map(x=>x.trim()).filter(Boolean);
 if(p.length>1)return [p[0],p[p.length-1]];
 return [p[0]||'تهران',p[0]||'تهران'];
}
const cityCoords={
 'تهران':[51.3890,35.6892],'قم':[50.8764,34.6416],'کرج':[50.9916,35.8400],'دیزین':[51.423,36.05],
 'ساری':[53.0586,36.5659],'فیروزکوه':[52.7751,35.7569],'قزوین':[50.0041,36.2688],
 'کاشان':[51.4272,33.9850],'اصفهان':[51.6660,32.6539],'یزد':[54.3675,31.8974],
 'کرمان':[57.0788,30.2839],'شهداد':[57.6969,30.4214],'بم':[58.3568,29.1060],
 'زاهدان':[60.8729,29.4963],'جیرفت':[57.7382,28.6751],'شیراز':[52.5311,29.5926],
 'مشهد':[59.6168,36.2605],'گرگان':[54.4342,36.8456],'رشت':[49.5887,37.2808],
 'شاهرود':[54.9763,36.4182],'اراک':[49.6892,34.0917],'ساوه':[50.3566,35.0213]
};
function cityCoordinate(name){
 const raw=String(name||'').replace(/[()]/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک');
 const names=Object.keys(cityCoords).filter(k=>raw.includes(k)).sort((a,b)=>b.length-a.length);
 return names.length?cityCoords[names[0]]:null;
}
let currentRouteRequest=0;
async function showRouteEstimate(origin,destination,targetKm){
 const token=++currentRouteRequest;
 const field=byId('liveRouteEstimate');
 if(!field)return;
 const a=cityCoordinate(origin),b=cityCoordinate(destination);
 if(!a||!b||a.join(',')===b.join(',')){
  field.textContent='این روز مسیر شهری یا حلقه‌ای دارد؛ زمان و مسافت جاده‌ای باید با انتخاب نقاط دقیق در گوگل مپ مشخص شود.';
  return;
 }
 field.textContent='در حال دریافت مسافت و زمان تخمینی مسیر جاده‌ای…';
 try{
  const url='https://router.project-osrm.org/route/v1/driving/'+a.join(',')+';'+b.join(',')+'?overview=false';
  const res=await fetch(url,{signal:AbortSignal.timeout(11000)});
  if(!res.ok)throw Error('routing unavailable');
  const json=await res.json();if(token!==currentRouteRequest)return;
  if(json.code!=='Ok'||!json.routes?.length)throw Error('no route');
  const km=json.routes[0].distance/1000;
  const hours=json.routes[0].duration/3600;
  const h=Math.floor(hours),m=Math.round((hours-h)*60);
  field.innerHTML='<b>برآورد مسیر یک‌طرفه:</b> '+number(km)+' کیلومتر · '+number(h)+' ساعت و '+number(m)+' دقیقه'+
  '<br><small>برآورد جاده‌ای بر اساس داده نقشه باز و بدون ترافیک زنده است؛ مسافت هدف برنامه '+number(targetKm)+' کیلومتر است و ممکن است به تکرار مسیر نیاز داشته باشد. برای مسافت و زمان لحظه‌ای گوگل روی لینک مسیر‌یابی کلیک کنید.</small>';
 }catch(e){
  if(token!==currentRouteRequest)return;
  field.textContent='برآورد خودکار در دسترس نیست. مسافت و زمان تخمینی مسیر را از لینک گوگل مپ مشاهده کنید.';
 }
}
function mapHtml(p){
 const rname=state.tab==='drive'?getDriveRoute(p):p.route;
 const endpoints=routeTokens(rname),origin=endpoints[0],destination=endpoints[1];
 const params='saddr='+encodeURIComponent(origin+', Iran')+'&daddr='+encodeURIComponent(destination+', Iran');
 const embed='https://maps.google.com/maps?'+params+'&output=embed&hl=fa';
 const link='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin+', Iran')+'&destination='+encodeURIComponent(destination+', Iran')+'&travelmode=driving';
 queueMicrotask(()=>showRouteEstimate(origin,destination,p.km));
 return '<div class="map-grid"><iframe title="مسیر آنلاین گوگل مپ برای روز انتخاب‌شده" class="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="'+esc(embed)+'"></iframe><div class="route-info"><h3>مشخصات مسیر روز</h3><p><b>مبدأ:</b> '+esc(origin)+'<br><b>مقصد:</b> '+esc(destination)+'</p><p><b>مسیر پیشنهادی:</b> '+esc(rname)+'</p><p><b>نوع مسیر:</b> '+esc(p.type||p.route)+'</p><p><b>هدف پیمایش روز:</b> '+number(p.km)+' کیلومتر</p><div class="route-estimate" id="liveRouteEstimate">در حال آماده‌سازی برآورد مسیر…</div><a class="map-link" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">نمایش مسیر و زمان ترافیکی در گوگل مپ</a><p class="disclaimer">در مسیرهای شهری و حلقه‌ای، مبدأ و مقصد دقیق باید در گوگل مپ مشخص شوند. مسافت هدف روز الزاماً معادل فاصله مستقیم بین دو شهر نیست.</p></div></div>';
}
function renderKpis(items){
const total=state.tab==='drive'?candidates('drive').length:state.tab==='durability'?candidates('durability').length:candidates('supplementary').length;
const count=scoresForTab(state.tab).length,mean=avg(scoresForTab(state.tab).map(x=>x.score));
const current=state.tab==='drive'?state.driveDay:state.durDay;
const days=state.tab==='supplementary'?'بدون زمان‌بندی':(state.tab==='drive'?26:Number(conf().durDays))+' روز';
byId('kpis').innerHTML=[
['آزمون‌های قابل‌اجرا',number(total)],['نمره‌های ثبت‌شده',number(count)],['میانگین نمره',mean==null?'—':number(mean)+' / ۱۰'],['برنامه ارزیابی',days]
].map(x=>'<div class="kpi"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong></div>').join('')
}
function renderCategories(items){
const grouped=new Map();items.forEach(t=>grouped.set(t.cat,(grouped.get(t.cat)||0)+1));
byId('categories').innerHTML=['<button class="cat-item '+(state.category==='همه'?'active':'')+'" data-category="همه"><span>همه شاخص‌ها</span><span>'+number(items.length)+'</span></button>'].concat(categories.filter(c=>grouped.has(c)).map(c=>'<button class="cat-item '+(state.category===c?'active':'')+'" data-category="'+esc(c)+'"><span>'+esc(c)+'</span><span>'+number(grouped.get(c))+'</span></button>')).join('')
}
function renderSchedule(){
const s=byId('schedulePanel');
if(state.tab==='supplementary'){s.innerHTML='<div class="section-heading"><div><h2>پرسشنامه تکمیلی</h2><p>این موارد برنامه روزانه ندارند و بر اساس وضعیت خودرو قابل ارزیابی هستند.</p></div><span class="chip">بدون روز و کیلومتر</span></div>';return}
const plan=state.tab==='drive'?driveProgram():dayCategoryPlan(),d=state.tab==='drive'?state.driveDay:state.durDay,p=plan[d-1],milestone=state.tab==='durability'?(checksOnPlan(plan).get(d)||[]):[];
if(!p){s.innerHTML='<div class="empty">برنامه روزانه پیدا نشد.</div>';return}
const indexText=state.tab==='drive'?'برنامه ۲۶ روزه قابلیت رانندگی':'برنامه انعطاف‌پذیر دوام';
const buttons=plan.map(x=>'<button class="day-btn '+(x.day===d?'active':'')+'" data-day="'+x.day+'"><b>روز '+number(x.day)+'</b><small>'+number(x.km)+' km</small></button>').join('');
const mVal=Number((state.mileage[state.tab]||{})[d])||0;
s.innerHTML='<div class="section-heading"><div><h2>'+indexText+'</h2><p>روز موردنظر را انتخاب کنید تا مسیر و آزمون‌های مرتبط نمایش داده شوند.</p></div><span class="chip">روز '+number(d)+' از '+number(plan.length)+'</span></div><div class="day-list">'+buttons+'</div><div class="day-meta"><span class="meta-tag">هدف روز: '+number(p.km)+' km</span><span class="meta-tag">هدف تجمعی: '+number(p.cum)+' km</span>'+(state.tab==='durability'?'<span class="meta-tag">کیلومترشمار هدف: '+number(p.odo)+' km</span>':'')+(milestone.length?'<span class="meta-tag">کنترل: '+milestone.map(x=>number(x)).join('، ')+' km</span>':'')+'</div>'+(p.over?'<div class="notice">هدف پیمایش این روز از سقف پیشنهادی نوع مسیر بیشتر است. پیش از اجرای میدانی مسیر یا تعداد روزها را بازبینی کنید.</div>':'')+mapHtml(p)+'<hr class="separator"><div class="day-status"><b>پیمایش واقعی روز '+number(d)+':</b> <input aria-label="کیلومتر واقعی پیموده‌شده" id="actualKm" type="number" min="0" step="0.1" value="'+mVal+'"> <span>کیلومتر</span> <button class="secondary" data-savekm="1">ثبت کیلومتر</button></div>'
}
const scoreColors=[null,['#f9e6ea','#e7b0ba','#ac2441'],['#fae1e5','#eba2b0','#be304a'],['#fae8e1','#f5b49d','#c84c33'],['#fff0df','#f5c09a','#cf752a'],['#fff4df','#f5ce8f','#cb8a1d'],['#fff7dd','#e9d075','#b79817'],['#eff6df','#bdd889','#619825'],['#e4f4e8','#9fd5ad','#22834e'],['#def1eb','#93ceb6','#167d55'],['#dcefe8','#85c1aa','#0e7451']];
function renderQuestions(){
const all=dayItems();
if(state.category!=='همه'&&!all.some(t=>t.cat===state.category))state.category='همه';
renderCategories(all);
const q=fa(state.query).toLowerCase();
const filtered=all.filter(t=>(state.category==='همه'||t.cat===state.category)&&(!q||fa([t.id,t.cat,t.sub,t.name].join(' ')).toLowerCase().includes(q)));
const size=12,pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(state.page,pages-1);state.page=page;
const select=filtered.slice(page*size,(page+1)*size);
let html='<div class="section-heading"><div><h2>فهرست آزمون‌های '+(state.tab==='drive'?'قابلیت رانندگی':state.tab==='durability'?'دوام عملکردی':'تکمیلی')+'</h2><p>'+number(all.length)+' آزمون در این بخش · '+number(filtered.length)+' مورد مطابق فیلتر</p></div><input class="search" id="questionSearch" placeholder="جست‌وجوی شاخص یا عنوان آزمون" value="'+esc(state.query)+'"></div>';
if(!select.length)html+='<div class="empty">آزمونی مطابق فیلتر یا روز انتخاب‌شده پیدا نشد.</div>';
for(const t of select){
const rec=record(t),colors=scoreColors;
html+='<article class="question" id="q-'+esc(t.id)+'"><div class="question-head"><div><h3>'+esc(fa(t.name))+'</h3><small>'+esc(t.id)+' | '+esc(fa(t.cat))+' ← '+esc(fa(t.sub))+'</small></div><span class="chip">'+(state.tab==='durability'?esc(fa(t.freq)):state.tab==='drive'?'ارزیابی قابلیت رانندگی':'پرسشنامه تکمیلی')+'</span></div>';
if(t.profile)html+='<p>'+esc(fa(t.profile))+'</p>';
else if(t.route)html+='<p>شرایط مسیر موردنیاز: '+esc(fa(t.route))+'</p>';
if(t.measure)html+='<p class="tiny">روش سنجش: '+esc(fa(t.measure))+'</p>';
html+='<div class="scores" role="group" aria-label="نمره آزمون از ۱ تا ۱۰">';
for(let i=1;i<=10;i++){let c=colors[i];html+='<button class="score '+(Number(rec.score)===i?'selected':'')+'" data-score="'+i+'" data-test="'+esc(t.id)+'" title="'+esc(scoreWords[i])+'" style="--score-bg:'+c[0]+';--score-border:'+c[1]+';--score-text:'+c[2]+'"><strong>'+number(i)+'</strong><small>'+esc(scoreWords[i])+'</small></button>'}
html+='</div><div class="note-wrap"><div class="note-actions"><label class="label-block" for="note-'+esc(t.id)+'">یادداشت ارزیاب</label><span class="tiny">در صورت نیاز تصویر هم پیوست کنید.</span></div><textarea id="note-'+esc(t.id)+'" data-note="'+esc(t.id)+'" placeholder="مشاهده، ایراد یا نکته قابل پیگیری را ثبت کنید...">'+esc(rec.note||'')+'</textarea><div class="note-actions"><input type="file" accept="image/*" data-photo="'+esc(t.id)+'" aria-label="بارگذاری عکس ارزیابی">'+(rec.photo?'<img src="'+rec.photo+'" alt="تصویر ثبت‌شده برای آزمون">':'')+'</div></div></article>'
}
html+='<div class="toolbar"><button class="secondary" data-pagejump="'+(page-1)+'" '+(page===0?'disabled':'')+'>صفحه قبل</button><span class="tiny">صفحه '+number(page+1)+' از '+number(pages)+'</span><button class="secondary" data-pagejump="'+(page+1)+'" '+(page>=pages-1?'disabled':'')+'>صفحه بعد</button></div>';
byId('questionsPanel').innerHTML=html
}
function renderResults(){
let all=Object.values(state.records).filter(x=>Number(x.score)>=1&&Number(x.score)<=10).length;
let html='<div class="section-heading"><div><h2>نتایج عملکرد و میانگین شاخص‌ها</h2><p>ملاک محاسبه، میانگین حسابی نمره‌های ثبت‌شده از ۱ تا ۱۰ است. آزمون‌های بدون نمره وارد میانگین نمی‌شوند.</p></div><span class="chip">'+number(all)+' نمره ثبت‌شده</span></div>';
const sumAll=Object.values(state.records).map(x=>Number(x.score)).filter(x=>x>=1&&x<=10);
html+='<div class="kpis"><div class="kpi"><small>میانگین کل</small><strong>'+(avg(sumAll)==null?'—':number(avg(sumAll)))+'</strong></div><div class="kpi"><small>کل ارزیابی‌ها</small><strong>'+number(sumAll.length)+'</strong></div><div class="kpi"><small>آزمون‌های بانک اصلی</small><strong>'+number(DB.tests.length)+'</strong></div><div class="kpi"><small>شاخص‌های اصلی</small><strong>'+number(categories.length)+'</strong></div></div>';
for(const section of [{key:'drive',label:'قابلیت رانندگی'},{key:'durability',label:'دوام عملکردی'},{key:'supplementary',label:'پرسشنامه تکمیلی'}]){
let vals=scoresForTab(section.key);
html+='<h3 style="margin:27px 0 11px;color:#1b4b70">'+section.label+' — میانگین '+(avg(vals.map(x=>x.score))==null?'—':number(avg(vals.map(x=>x.score))))+'</h3><div style="overflow-x:auto"><table class="result-table"><thead><tr><th>شاخص اصلی</th><th>تعداد نمره</th><th>میانگین از ۱۰</th><th>نمایش میانگین</th></tr></thead><tbody>';
for(const cat of categories){const a=vals.filter(x=>testById.get(x.id)?.cat===cat).map(x=>x.score);if(!a.length)continue;html+='<tr><td>'+esc(fa(cat))+'</td><td>'+number(a.length)+'</td><td><b>'+number(avg(a))+'</b></td><td><div class="bar"><i style="width:'+(avg(a)*10)+'%"></i></div></td></tr>'}
html+='</tbody></table></div>';
}
html+='<div class="toolbar"><button class="primary" data-exportcsv="1">خروجی اکسل‌پذیر CSV نتایج</button><button class="secondary" data-import="1">بازیابی فایل پشتیبان JSON</button><button class="secondary" data-clear="1">پاک‌کردن نمره‌ها</button></div><p class="disclaimer">ثبت داده‌ها در مرورگر همین دستگاه است و بین کاربران همگام نمی‌شود. برای نگهداری سازمانی و تجمیع تیمی، اتصال به پایگاه داده و احراز هویت جداگانه لازم است.</p>';
byId('resultsPanel').innerHTML=html
}
function render(){
const titles={setup:['تنظیم مشخصات خودرو و برنامه آزمون','اطلاعات خودرو و طول برنامه، مبنای فیلتر و زمان‌بندی هستند.'],drive:['آزمون قابلیت رانندگی','برنامه ۲۶ روزه با شاخص‌ها و مسیرهای قابل‌اجرا'],durability:['آزمون دوام عملکردی','پایش روزانه و مقایسه عملکرد تا پایان کیلومتر هدف'],supplementary:['پرسشنامه تکمیلی','ارزیابی‌های مستقل از برنامه کیلومتری'],results:['نتایج و میانگین‌ها','خلاصه نمره هر شاخص و هر حوزه ارزیابی']};
byId('pageTitle').textContent=titles[state.tab][0];byId('pageSub').textContent=titles[state.tab][1];
byId('headerVehicle').textContent=conf().vclass+' · '+conf().body+' · '+conf().power+' · '+conf().driveType;
document.querySelectorAll('[data-tab]').forEach(e=>e.classList.toggle('active',e.dataset.tab===state.tab));
byId('setupPanel').classList.toggle('hidden',state.tab!=='setup');
byId('workPanel').classList.toggle('hidden',state.tab==='setup'||state.tab==='results');
byId('resultsPanel').classList.toggle('hidden',state.tab!=='results');
byId('editSetupBtn').classList.toggle('hidden',state.tab==='setup');
if(state.tab==='setup')renderSetup();else if(state.tab==='results')renderResults();else{const items=dayItems();renderKpis(items);renderSchedule();renderQuestions();}
}
function changeTab(tab){if(tab!=='setup'&&!state.setupComplete){toast('ابتدا مشخصات خودرو را ثبت کنید.');return}state.tab=tab;state.category='همه';state.query='';state.page=0;render();window.scrollTo({top:0,behavior:'smooth'})}
function exportFile(content,name,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportJSON(){exportFile(JSON.stringify({schema:1,savedAt:new Date().toISOString(),config:state.config,records:state.records,mileage:state.mileage,setupComplete:state.setupComplete},null,2),'BAMCO-assessment-backup.json','application/json;charset=utf-8');toast('فایل پشتیبان آماده شد.')}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}
function exportCSV(){const rows=[['حوزه','روز','شناسه آزمون','شاخص','زیرشاخص','عنوان آزمون','نمره','یادداشت']];for(const [key,rec] of Object.entries(state.records)){const [tab,day,id]=key.split(':'),t=testById.get(id);if(!t)continue;rows.push([tab,day,id,t.cat,t.sub,t.name,rec.score||'',rec.note||''])}exportFile('\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'BAMCO-assessment-results.csv','text/csv;charset=utf-8');toast('خروجی نتایج آماده شد.')}
function updateRating(btn){const id=btn.dataset.test,t=testById.get(id);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),score:Number(btn.dataset.score)};save();const sy=window.scrollY;render();window.scrollTo(0,sy)}
function uploadPicture(file,testId){if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{const canvas=document.createElement('canvas'),max=850,ratio=Math.min(1,max/Math.max(im.width,im.height));canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.55),t=testById.get(testId);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),photo:data};if(save()){toast('عکس برای این آزمون ثبت شد.');const sy=window.scrollY;render();window.scrollTo(0,sy)}};im.src=reader.result};reader.readAsDataURL(file)}
byId('vehicleForm').addEventListener('submit',e=>{e.preventDefault();for(const k of Object.keys(defaultConfig)){let v=byId(k).value;if(['driveKm','durKm','durDays','startOdo'].includes(k))v=Number(v);state.config[k]=v;}if(state.config.durDays<1||state.config.durDays>365){toast('تعداد روز باید بین ۱ تا ۳۶۵ باشد.');return}state.setupComplete=true;save();changeTab('drive');toast('مشخصات خودرو ثبت و برنامه آماده شد.')});
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.tab){changeTab(el.dataset.tab);return}
if(el.id==='editSetupBtn'){changeTab('setup');return}
if(el.id==='backupBtn'){exportJSON();return}
if(el.dataset.day){const v=Number(el.dataset.day);if(state.tab==='drive')state.driveDay=v;else state.durDay=v;state.page=0;state.category='همه';state.query='';render();return}
if(el.dataset.category){state.category=el.dataset.category;state.page=0;render();return}
if(el.dataset.score){updateRating(el);return}
if(el.dataset.pagejump){state.page=Number(el.dataset.pagejump);renderQuestions();byId('questionsPanel').scrollIntoView({behavior:'smooth',block:'start'});return}
if(el.dataset.savekm){const n=Number(byId('actualKm')?.value||0);if(n<0||!Number.isFinite(n)){toast('کیلومتر واردشده معتبر نیست.');return}const tab=state.tab;state.mileage[tab]=state.mileage[tab]||{};state.mileage[tab][currentDay()]=n;save();toast('پیمایش واقعی این روز ثبت شد.');return}
if(el.dataset.exportcsv){exportCSV();return}
if(el.dataset.import){byId('importBackup').click();return}
if(el.dataset.clear){if(confirm('تمام نمره‌ها و یادداشت‌های ثبت‌شده پاک شوند؟')){state.records={};save();render();toast('نتایج پاک شدند.')}return}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.note){const t=testById.get(el.dataset.note);if(!t)return;const k=ratedKey(t);state.records[k]={...(state.records[k]||{}),note:el.value};save();return}if(el.dataset.photo){uploadPicture(el.files?.[0],el.dataset.photo);return}});
document.addEventListener('input',e=>{if(e.target.id==='questionSearch'){state.query=e.target.value;state.page=0;const field=e.target;const pos=field.selectionStart;renderQuestions();const newField=byId('questionSearch');newField.focus();newField.setSelectionRange(pos,pos)}});
byId('importBackup').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{try{const obj=JSON.parse(fr.result);if(!obj||!obj.records||!obj.config)throw Error('Invalid');if(!confirm('اطلاعات موجود با فایل پشتیبان جایگزین شود؟'))return;state.config={...defaultConfig,...obj.config};state.records=obj.records;state.mileage=obj.mileage||{drive:{},durability:{}};state.setupComplete=true;save();render();toast('بازیابی پشتیبان انجام شد.')}catch(err){toast('فایل JSON معتبر نیست.')}};fr.readAsText(file);e.target.value=''});
load();render();
})();