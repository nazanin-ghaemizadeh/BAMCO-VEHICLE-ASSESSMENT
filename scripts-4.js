/* manager.js */
const MANAGER_STORAGE_KEY="bamco-manager-weight-control";
let managerWeightState={pending:null,activeExpert:"",activeSource:"default"};
try{managerWeightState={...managerWeightState,...JSON.parse(localStorage.getItem(MANAGER_STORAGE_KEY)||"{}")}}catch(_){}
const norm=s=>String(s??"").replace(/[\u200c\u200f\u202a-\u202e]/g," ").replace(/\([^)]*\)/g," ").replace(/\s+/g," ").trim().toLowerCase();
function expectedCriteria(){return window.ASSESSMENT_CRITERIA.map(m=>({id:String(m.id),fa:clean(m.titleFa),en:title(m.titleFa,"main",m.id)}))}
function managerMessage(text,kind="neutral"){const el=document.querySelector("#managerWeightMessage");if(el){el.textContent=text;el.className=`managerWeightMessage ${kind}`}}
function persistManager(){localStorage.setItem(MANAGER_STORAGE_KEY,JSON.stringify(managerWeightState))}
function cellText(cell){const v=cell?.value;if(v&&typeof v==="object")return String(v.result??v.text??v.richText?.map(x=>x.text).join("")??"");return String(v??"")}
async function inspectWeightFile(file){
 if(!window.ExcelJS)throw new Error("ماژول اکسل در دسترس نیست.");const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());
 const ws=wb.worksheets.find(s=>s.actualRowCount>=15)||wb.worksheets[0];if(!ws)throw new Error("فایل فاقد شیت قابل خواندن است.");
 const expected=expectedCriteria(),aliases=new Map();expected.forEach(x=>{aliases.set(norm(x.fa),x);aliases.set(norm(x.en),x);aliases.set(x.id,x)});
 const found=[],unknown=[];let expert="";
 ws.eachRow(row=>{const values=row.values.slice(1).map(v=>cellText({value:v}).trim());const label=norm(values[0]||"");if(!expert&&(/نام.*(خبره|خانوادگی)/.test(values[0]||"")||/^(full name|expert name|name)$/.test(label)))expert=values.slice(1).find(Boolean)||"";let match=null,name="",weight=NaN;for(let i=0;i<values.length;i++){const candidate=aliases.get(norm(values[i]));if(candidate){match=candidate;name=values[i];for(let j=i+1;j<values.length;j++){const n=Number(String(values[j]).replace(/٫/g,".").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)));if(Number.isFinite(n)){weight=n;break}}break}}if(match&&Number.isFinite(weight))found.push({id:match.id,name:match.fa,weight});else if(Number.isFinite(Number(values.at(-1)))&&values.some(Boolean)&&row.number>1)unknown.push(values.filter(Boolean)[0])});
 const counts={};found.forEach(x=>counts[x.id]=(counts[x.id]||0)+1);const duplicate=expected.filter(x=>(counts[x.id]||0)>1),missing=expected.filter(x=>!counts[x.id]);const knownIds=new Set(expected.map(x=>x.id));const extra=found.filter(x=>!knownIds.has(x.id));const total=found.reduce((s,x)=>s+x.weight,0),negative=found.filter(x=>x.weight<0);const valid=!duplicate.length&&!missing.length&&!extra.length&&!negative.length&&found.length===15&&Math.abs(total-1)<1e-9;
 return {valid,found,total,negative:negative.map(x=>x.name),duplicate:duplicate.map(x=>x.fa),missing:missing.map(x=>x.fa),unknown:[...new Set([...unknown,...extra.map(x=>x.name)])],expert,fileName:file.name};
}
function renderWeightPreview(data){const box=document.querySelector("#managerWeightPreview");if(!box)return;if(!data){box.innerHTML="";return}const problems=[];if(data.missing.length)problems.push(`شاخص‌های مفقود: ${data.missing.join("، ")}`);if(data.duplicate.length)problems.push(`شاخص‌های تکراری: ${data.duplicate.join("، ")}`);if(data.unknown.length)problems.push(`شاخص‌های ناشناخته: ${data.unknown.join("، ")}`);if(data.negative?.length)problems.push(`وزن منفی مجاز نیست: ${data.negative.join("، ")}`);if(Math.abs(data.total-1)>=1e-9)problems.push(`مجموع وزن‌ها ${data.total.toFixed(6)} است و باید دقیقاً ۱ باشد.`);box.innerHTML=`<div class="weightAudit"><strong>${esc(data.fileName)}</strong><span>مجموع: ${localNumber(data.total.toFixed(6))}</span><span>تعداد شاخص معتبر: ${localNumber(data.found.length)} از ۱۵</span></div>${problems.length?`<ul>${problems.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<div class="weightValid">✓ فایل شامل ۱۵ شاخص معتبر و مجموع دقیقاً برابر ۱ است.</div>`}`}
function bindManagerControls(){const input=document.querySelector("#managerWeightInput"),approve=document.querySelector("#managerApproveWeights");if(!input||input.dataset.bound)return;input.dataset.bound="1";input.addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;approve.disabled=true;managerMessage("در حال بررسی فایل…");try{const audit=await inspectWeightFile(file);managerWeightState.pending=audit;persistManager();renderWeightPreview(audit);approve.disabled=!audit.valid;managerMessage(audit.valid?"فایل معتبر است؛ برای اعمال وزن‌ها تأیید مدیر لازم است.":"فایل پذیرفته نشد؛ خطاهای زیر را اصلاح کنید.",audit.valid?"success":"error")}catch(err){managerWeightState.pending=null;persistManager();renderWeightPreview(null);managerMessage(err.message||"فایل Excel قابل خواندن نیست.","error")}e.target.value=""});approve.addEventListener("click",()=>{const p=managerWeightState.pending;if(!p?.valid)return;const next={};p.found.forEach(x=>next[x.id]=x.weight);state.weights=next;managerWeightState.activeExpert=p.expert||"";managerWeightState.activeSource=p.fileName;managerWeightState.pending=null;persistManager();persist();renderWeightPreview(null);approve.disabled=true;managerMessage("وزن‌ها با تأیید مدیر اعمال شدند و داشبورد به‌روزرسانی شد.","success");update()})}
function managerDecision(score){const en=locale==="en";if(!Number.isFinite(score))return{label:en?"Not assessed":"ارزیابی نشده",kind:"neutral",text:en?"Scores are required before a result can be calculated.":"برای محاسبه نتیجه، ثبت امتیاز لازم است."};if(score>=85)return{label:en?"Preliminary pass":"عبور مقدماتی",kind:"pass",text:en?"Proceed to economic assessment, industrialization feasibility, and subsequent approvals.":"ورود به ارزیابی‌های اقتصادی، امکان‌سنجی صنعتی‌سازی و تأییدهای بعدی"};if(score>=75)return{label:en?"Conditional pass":"عبور مشروط",kind:"conditional",text:en?"Continue after a corrective plan is submitted and identified weaknesses are re-verified.":"ادامه بررسی پس از ارائه برنامه اصلاحی و تأیید مجدد ضعف‌ها"};if(score>=65)return{label:en?"Revise and reassess":"اصلاح و ارزیابی مجدد",kind:"revise",text:en?"Pause the process until technical corrections are implemented.":"توقف فرایند تا اجرای اصلاحات فنی"};return{label:en?"Preliminary rejection":"رد در ارزیابی مقدماتی",kind:"reject",text:en?"Further localization assessment is not recommended.":"عدم توصیه برای ادامه فرایند داخلی‌سازی"}}
function renderRadar(rows){const host=document.querySelector("#radarChart");if(!host)return;const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];const good=rows.filter(r=>Number.isFinite(r.avg100));if(!good.length){host.innerHTML=`<p class="chartEmpty">${locale==="fa"?"پس از ثبت امتیازها، نمودار عنکبوتی نمایش داده می‌شود.":"The radar chart will appear after scores are recorded."}</p>`;return}const n=rows.length,cx=380,cy=300,R=190,angle=i=>-Math.PI/2+i*2*Math.PI/n,point=(i,radius)=>{const a=angle(i);return[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]},pts=radius=>rows.map((_,i)=>point(i,radius).join(",")).join(" ");const dataPoints=rows.map((r,i)=>point(i,(Number.isFinite(r.avg100)?r.avg100:0)/100*R));const wedges=rows.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return`<polygon points="${cx},${cy} ${p1.join(",")} ${p2.join(",")}" fill="${colors[i]}" opacity=".075"/>`}).join("");const axes=rows.map((r,i)=>{const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=dataPoints[i],name=title(r.main.titleFa,"main",r.main.id),words=name.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(" "),words.slice(cut).join(" ")]:[name],value=Number.isFinite(r.avg100)?fmt(r.avg100):"—",scoreX=vx+ux*18,scoreY=vy+uy*18,anchor=ux>.28?"start":ux<-.28?"end":"middle",baseline=uy>.55?"hanging":uy<-.55?"auto":"middle";return`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i]}88"/><circle cx="${vx}" cy="${vy}" r="5.5" fill="${colors[i]}" stroke="#fff" stroke-width="2"/><text x="${scoreX}" y="${scoreY}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i]}">${value}</text><text x="${lx}" y="${ly}" fill="${colors[i]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join("")}</text>`}).join("");host.innerHTML=`<svg viewBox="0 0 760 600" role="img" aria-label="${locale==="fa"?"نمودار عنکبوتی شاخص‌ها از ۱۰۰":"Criteria radar chart out of 100"}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join("")}${axes}<polygon points="${dataPoints.map(p=>p.join(",")).join(" ")}" class="radarData"/></svg>`}
function translateManagerStatic(){const en=locale==="en",set=(sel,text)=>{const el=document.querySelector(sel);if(el)el.textContent=text};set("#managerWeightPanel h2",en?"Upload Expert Weights":"بارگذاری وزن‌های خبره");set("#managerWeightPanel .sectionTitle p",en?"The Excel file is validated first and affects results only after management approval.":"فایل Excel ابتدا اعتبارسنجی می‌شود و فقط پس از تأیید مدیر روی نتایج اثر می‌گذارد.");set(".managerUploadButton",en?"Select Excel File":"انتخاب فایل Excel");set("#managerApproveWeights",en?"Approve and Apply Weights":"تأیید و اعمال وزن‌ها");set("#scoreScaleText",en?"Score scale: 0–100":"مقیاس امتیاز: ۰ تا ۱۰۰");set(".classificationCard h2",en?"Final Vehicle Result Classification":"طبقه‌بندی نتیجه نهایی خودرو");set(".classificationCard .sectionTitle p",en?"Decision basis for continuing the localization process":"مبنای تصمیم‌گیری برای ادامه فرایند داخلی‌سازی");const labels=en?[["85-100","Preliminary pass","Proceed to economic assessment, industrialization feasibility, and subsequent approvals."],["75-85","Conditional pass","Continue after a corrective plan and re-verification of identified weaknesses."],["65-75","Revise and reassess","Pause the process until technical corrections are implemented."],["Below 65","Preliminary rejection","Further localization assessment is not recommended."]]:[["۸۵-۱۰۰","عبور مقدماتی","ورود به ارزیابی‌های اقتصادی، امکان‌سنجی صنعتی‌سازی و تأییدهای بعدی"],["۷۵-۸۵","عبور مشروط","ادامه بررسی پس از ارائه برنامه اصلاحی و تأیید مجدد ضعف‌های شناسایی‌شده"],["۶۵-۷۵","اصلاح و ارزیابی مجدد","توقف فرایند تا اجرای اصلاحات فنی"],["کمتر از ۶۵","رد در ارزیابی مقدماتی","عدم توصیه برای ادامه فرایند داخلی‌سازی"]];document.querySelectorAll(".classificationRow").forEach((row,i)=>{const [range,label,desc]=labels[i];row.querySelector("strong").textContent=range;row.querySelector("span").textContent=label;row.querySelector("p").textContent=desc})}
function managerRefresh(rows,final10,percent){translateManagerStatic();const final100=Number.isFinite(final10)?final10*10:NaN,d=managerDecision(final100);const vehicle=[state.metadata.brand,state.metadata.model].filter(Boolean).join(" ")||"—";let localExpert="";try{localExpert=JSON.parse(localStorage.getItem("bamco-vehicle-expert-weights")||"{}").info?.name||""}catch(_){}document.querySelector("#managerVehicleName").textContent=vehicle;document.querySelector("#managerAssessmentDate").textContent=formatAssessmentDate(state.metadata.date)||"—";document.querySelector("#managerEvaluatorName").textContent=state.metadata.evaluator||"—";document.querySelector("#managerExpertName").textContent=managerWeightState.activeExpert||localExpert||"—";const badge=document.querySelector("#managerFinalBadge");badge.textContent=d.label;badge.className=`managerFinalBadge ${d.kind}`;document.querySelector("#managerTemporaryLabel").textContent=percent<100&&Number.isFinite(final100)?(locale==="fa"?`نتیجه موقت · تکمیل ${localNumber(percent)}٪`:`Provisional result · ${localNumber(percent)}% complete`):d.text;document.querySelector("#activeWeightsLabel").textContent=managerWeightState.activeSource==="default"?(locale==="fa"?"وزن‌های پیش‌فرض برابر":"Equal default weights"):(locale==="fa"?`فایل فعال: ${managerWeightState.activeSource}`:`Active file: ${managerWeightState.activeSource}`);renderRadar(rows)}
translateManagerStatic=function(){const en=locale==="en",set=(sel,text)=>{const el=document.querySelector(sel);if(el)el.textContent=text};set("#managerWeightPanel h2",en?"Upload Expert Weights":"بارگذاری وزن‌های خبره");set("#managerWeightPanel .sectionTitle p",en?"The Excel file is validated first and affects results only after management approval.":"فایل Excel ابتدا اعتبارسنجی می‌شود و فقط پس از تأیید مدیر روی نتایج اثر می‌گذارد.");const upload=document.querySelector(".managerUploadButton");if(upload?.firstChild?.nodeType===Node.TEXT_NODE)upload.firstChild.nodeValue=en?"Select Excel File":"انتخاب فایل Excel";set("#managerApproveWeights",en?"Approve and Apply Weights":"تأیید و اعمال وزن‌ها");set("#scoreScaleText",en?"Score scale: 0–100":"مقیاس امتیاز: ۰ تا ۱۰۰");set(".classificationCard h2",en?"Final Vehicle Result Classification":"طبقه‌بندی نتیجه نهایی خودرو");set(".classificationCard .sectionTitle p",en?"Decision basis for continuing the localization process":"مبنای تصمیم‌گیری برای ادامه فرایند داخلی‌سازی");const labels=en?[["85-100","Preliminary pass","Proceed to economic assessment, industrialization feasibility, and subsequent approvals."],["75-85","Conditional pass","Continue after a corrective plan and re-verification of identified weaknesses."],["65-75","Revise and reassess","Pause the process until technical corrections are implemented."],["Below 65","Preliminary rejection","Further localization assessment is not recommended."]]:[["۸۵-۱۰۰","عبور مقدماتی","ورود به ارزیابی‌های اقتصادی، امکان‌سنجی صنعتی‌سازی و تأییدهای بعدی"],["۷۵-۸۵","عبور مشروط","ادامه بررسی پس از ارائه برنامه اصلاحی و تأیید مجدد ضعف‌های شناسایی‌شده"],["۶۵-۷۵","اصلاح و ارزیابی مجدد","توقف فرایند تا اجرای اصلاحات فنی"],["کمتر از ۶۵","رد در ارزیابی مقدماتی","عدم توصیه برای ادامه فرایند داخلی‌سازی"]];document.querySelectorAll(".classificationRow").forEach((row,i)=>{const [range,label,desc]=labels[i];row.querySelector("strong").textContent=range;row.querySelector("span").textContent=label;row.querySelector("p").textContent=desc})};
window.refreshManagerLanguage=()=>{if(typeof update==="function")update()};
const managerRefreshBase=managerRefresh;
const translateManagerStaticBase=translateManagerStatic;
translateManagerStatic=function(){translateManagerStaticBase();if(locale!=="fa")return;const hint=document.querySelector("#managerWeightPanel .sectionTitle p"),upload=document.querySelector(".managerUploadButton");if(hint)hint.textContent="فایل اکسل ابتدا اعتبارسنجی می‌شود و فقط پس از تأیید مدیر روی نتایج اثر می‌گذارد.";if(upload?.firstChild?.nodeType===Node.TEXT_NODE)upload.firstChild.nodeValue="انتخاب فایل اکسل"};
managerRefresh=function(...args){managerRefreshBase(...args);const button=document.querySelector("#managerExcelButton");if(button)button.textContent=locale==="fa"?'خروجی اکسل داشبورد':'Export Dashboard to Excel'};
async function exportManagerDashboard(){
 if(!window.ExcelJS){alert(locale==="fa"?"ماژول خروجی اکسل در دسترس نیست.":"The Excel export module is unavailable.");return}
 const fa=locale==="fa",txt=(a,b)=>fa?a:b;
 document.querySelectorAll('[data-final-comment]').forEach(input=>{const role=input.dataset.finalComment;if(role){state.finalComments=state.finalComments||{};state.finalComments[role]=input.value||""}});if(typeof persist==="function")persist();
 if(typeof update==='function')update();
 const criteria=window.ASSESSMENT_CRITERIA||[],criteriaCount=criteria.length||1;
 const rawWeights=criteria.map(main=>{const w=Number(state.weights?.[main.id]??(1/criteriaCount));return Number.isFinite(w)&&w>=0?w:0});
 const rawWeightTotal=rawWeights.reduce((sum,w)=>sum+w,0);
 const normalizedWeights=rawWeightTotal>0?rawWeights.map(w=>w/rawWeightTotal):criteria.map(()=>1/criteriaCount);
 const rows=criteria.map((main,index)=>{const values=valuesForMain(main),counts=mainCounts(main),avg=values.length?values.reduce((a,b)=>a+b,0)/values.length:NaN,avg100=Number.isFinite(avg)?avg*10:NaN,weight=normalizedWeights[index]||0,contribution=Number.isFinite(avg100)?avg100*weight:NaN;return {main,avg,avg100,weight,contribution,answered:counts.answered,total:counts.total,completion:counts.total?counts.answered/counts.total*100:0}});
 const rated=rows.filter(r=>Number.isFinite(r.contribution)&&Number.isFinite(r.weight)),completedWeight=rated.reduce((sum,r)=>sum+r.weight,0),finalScore=completedWeight>0?rated.reduce((sum,r)=>sum+r.contribution,0)/completedWeight:NaN,maxWeight=Math.max(0,...rows.map(r=>r.weight));
 const weightedVisual=r=>{if(!Number.isFinite(r.avg100))return NaN;if(r.weight<=0)return 0;return maxWeight>0?Math.max(0,Math.min(100,r.avg100*(r.weight/maxWeight))):NaN};
 const qualityCounts=Array(10).fill(0);rows.forEach(r=>{if(r.weight<=0)return;r.main.subgroups.forEach(sub=>sub.items.forEach(item=>{const n=Number(state.scores?.[itemKey(r.main,sub,item)]);if(Number.isInteger(n)&&n>=1&&n<=10)qualityCounts[n-1]++}))});
 const criterionName=main=>fa?persianCriterionName(main):title(main.titleFa,"main",main.id);
 const wb=new ExcelJS.Workbook();wb.creator="BAMCO Vehicle Assessment";wb.created=new Date();
 const ws=wb.addWorksheet(txt("داشبورد مدیریت","Management Dashboard"));ws.views=[{rightToLeft:fa,showGridLines:false}];ws.properties.defaultRowHeight=23;
 ws.mergeCells("A1:G1");ws.getCell("A1").value=txt("خلاصه داشبورد مدیریت ارزیابی خودرو","Vehicle Assessment Management Dashboard");ws.getCell("A1").font={bold:true,size:18,color:{argb:"FFFFFFFF"}};ws.getCell("A1").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF163B69"}};ws.getCell("A1").alignment={horizontal:"center",vertical:"middle"};ws.getRow(1).height=34;
 const expertName=(typeof expertState!=="undefined"&&expertState?.info?.name)||managerWeightState.activeExpert||"";
 [[txt("نام خودرو","Vehicle"),[state.metadata.brand,state.metadata.model].filter(Boolean).join(" ")],[txt("نام ارزیاب","Evaluator"),state.metadata.evaluator],[txt("نام خبره","Expert"),expertName],[txt("تاریخ ارزیابی","Assessment Date"),formatAssessmentDate(state.metadata.date,true)],[txt("شماره شاسی خودرو","VIN"),state.metadata.vin],[txt("امتیاز نهایی","Final Score"),Number.isFinite(finalScore)?Number(finalScore.toFixed(2)):""]].forEach((item,index)=>{ws.getCell(index+3,1).value=item[0];ws.getCell(index+3,1).font={bold:true};ws.getCell(index+3,2).value=item[1]||""});
 const header=ws.addRow([txt("ردیف","No."),txt("کد شاخص","Code"),txt("شاخص","Criterion"),txt("میانگین از ۱۰","Average / 10"),txt("وزن فعال","Active Weight"),txt("سهم در امتیاز کل","Contribution / 100"),txt("نرخ تکمیل","Completion")]);header.eachCell(cell=>{cell.font={bold:true,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF2463A5"}};cell.alignment={horizontal:"center",vertical:"middle"}});
 rows.forEach((r,index)=>{const row=ws.addRow([index+1,r.main.id,criterionName(r.main),Number.isFinite(r.avg)?Number(r.avg.toFixed(2)):"",Number(r.weight.toFixed(6)),Number.isFinite(r.contribution)?Number(r.contribution.toFixed(2)):"",Number((r.completion/100).toFixed(4))]);if(index%2)row.eachCell(cell=>cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF1F6FB"}})});
 ws.getColumn(7).numFmt="0%";ws.columns=[{width:8},{width:13},{width:42},{width:16},{width:13},{width:20},{width:15}];ws.autoFilter={from:{row:9,column:1},to:{row:9,column:7}};ws.eachRow((row,rowNumber)=>{if(rowNumber>9)row.eachCell(cell=>{cell.alignment={horizontal:"center",vertical:"middle",wrapText:true};cell.border={bottom:{style:"thin",color:{argb:"FFDCE4ED"}}}})});
 const palette=["#2463a5","#b54d66","#128778","#d58a24","#7454b8","#d9673a","#3e8c47","#ad5f99","#2c7d9a","#96733c","#5475b5","#b85c48","#4b9a91","#8f5c6b","#527e50"];
 const chartDataUrl=kind=>{const canvas=document.createElement("canvas"),W=1200,H=500;canvas.width=W;canvas.height=H;const c=canvas.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,W,H);c.fillStyle="#163b69";c.font="bold 25px Tahoma";c.textAlign="center";c.fillText(kind==="bar"?txt("مقایسه عملکرد وزن‌دار شاخص‌ها","Weighted Criterion Performance"):kind==="quality"?txt("توزیع درجه کیفی","Quality Grade Distribution"):txt("نمودار عنکبوتی وزن‌دار شاخص‌ها","Weighted Criteria Radar"),W/2,36);
   if(kind==="bar"){const data=rows.map(r=>({...r,visual:weightedVisual(r)})).filter(r=>Number.isFinite(r.visual)).sort((a,b)=>b.visual-a.visual),pad=65,base=420,maxH=320,bw=42,gap=(W-pad*2)/Math.max(1,data.length);data.forEach((r,i)=>{const v=r.visual,x=pad+i*gap+gap/2;c.fillStyle="#e8eef5";c.fillRect(x-bw/2,base-maxH,bw,maxH);if(v>0){c.fillStyle=palette[i%palette.length];c.fillRect(x-bw/2,base-maxH*v/100,bw,maxH*v/100)}c.fillStyle="#294a72";c.font="bold 15px Tahoma";c.fillText(Number.isFinite(v)?v.toFixed(1):"—",x,base-(v>0?maxH*v/100:0)-8);c.save();c.translate(x,base+14);c.rotate(-Math.PI/4);c.textAlign="right";c.font="12px Tahoma";c.fillText(criterionName(r.main),0,0);c.restore()})}
   else if(kind==="quality"){const max=Math.max(1,...qualityCounts),left=205,right=90,top=68,rowH=38,trackW=W-left-right-60;qualityCounts.forEach((count,i)=>{const y=top+i*rowH,label=fa?(SCORE_LEVELS.find(x=>x.n===i+1)?.fa||String(i+1)):(SCORE_LEVELS.find(x=>x.n===i+1)?.en||String(i+1)),width=count/max*trackW;c.textAlign="right";c.fillStyle="#294a72";c.font="14px Tahoma";c.fillText(label,left-18,y+18);c.fillStyle="#edf3f8";c.fillRect(left,y,trackW,20);if(width>0){c.fillStyle=scoreColor(i+1);c.fillRect(left,y,width,20)}c.textAlign="left";c.fillStyle="#111827";c.font="bold 15px Tahoma";c.fillText(String(count),left+Math.min(width+8,trackW+10),y+16)})}
   else{const cx=W/2,cy=265,R=175,n=rows.length,pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]};c.strokeStyle="#cad9e5";[.2,.4,.6,.8,1].forEach(k=>{c.beginPath();rows.forEach((_,i)=>{const [x,y]=pt(i,R*k);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()});rows.forEach((r,i)=>{const [x,y]=pt(i,R);c.strokeStyle=palette[i%palette.length];c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke()});const values=rows.map(r=>weightedVisual(r));c.beginPath();rows.forEach((r,i)=>{const v=Number.isFinite(values[i])?values[i]:0,[x,y]=pt(i,R*v/100);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fillStyle="#2463a533";c.fill();c.strokeStyle="#2463a5";c.lineWidth=3;c.stroke();rows.forEach((r,i)=>{const v=Number.isFinite(values[i])?values[i]:0,[x,y]=pt(i,R*v/100),[lx,ly]=pt(i,R+42);c.fillStyle=palette[i%palette.length];c.beginPath();c.arc(x,y,v<=0?3.5:5,0,Math.PI*2);c.fill();c.font="bold 13px Tahoma";c.textAlign=lx>cx+20?"left":lx<cx-20?"right":"center";if(v>0)c.fillText(v.toFixed(1),x+(x-cx)*.08,y+(y-cy)*.08);c.font="11px Tahoma";c.fillText(criterionName(r.main),lx,ly)})}
   return canvas.toDataURL("image/png").split(",")[1]};
 [["bar",27],["quality",52],["radar",77]].forEach(([kind,row])=>{const id=wb.addImage({base64:chartDataUrl(kind),extension:"png"});ws.addImage(id,{tl:{col:0,row:row-1},ext:{width:1040,height:430}});for(let rr=row;rr<row+24;rr++)ws.getRow(rr).height=15});

 /* Final comments from all three roles. */
 const comments=wb.addWorksheet(txt("نظرات نهایی","Final Comments"));comments.views=[{rightToLeft:fa,showGridLines:false}];comments.mergeCells("A1:D1");comments.getCell("A1").value=txt("نظرات نهایی ارزیاب، خبره و مدیریت","Evaluator, Expert and Management Final Comments");comments.getCell("A1").font={bold:true,size:17,color:{argb:"FFFFFFFF"}};comments.getCell("A1").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF163B69"}};comments.getCell("A1").alignment={horizontal:"center"};comments.columns=[{width:26},{width:80},{width:14},{width:14}];
 const commentRows=[[txt("نظر نهایی ارزیاب","Evaluator Final Comment"),state.finalComments?.evaluator||""],[txt("نظر نهایی خبره","Expert Final Comment"),state.finalComments?.expert||""],[txt("نظر نهایی مدیریت","Management Final Comment"),state.finalComments?.manager||""]];
 commentRows.forEach((item,i)=>{const r=3+i*4;comments.getCell(r,1).value=item[0];comments.getCell(r,1).font={bold:true,color:{argb:"FF244B70"}};comments.getCell(r,1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFEAF3F8"}};comments.mergeCells(r+1,1,r+3,4);const cell=comments.getCell(r+1,1);cell.value=item[1];cell.alignment={horizontal:fa?"right":"left",vertical:"top",wrapText:true};[r+1,r+2,r+3].forEach(x=>comments.getRow(x).height=24)});
 if(window.addVehicleViewsWorksheet)window.addVehicleViewsWorksheet(wb,state.vehiclePhotos||{},fa);

 /* Multi-vehicle comparison exported when one or more comparison JSON files are loaded. */
 let comparisonCases=[];try{const parsed=JSON.parse(sessionStorage.getItem("bamco-multi-vehicle-comparisons")||"[]");if(Array.isArray(parsed))comparisonCases=parsed.filter(x=>x?.state?.scores&&typeof x.state.scores==="object")}catch(_){}
 if(!comparisonCases.length){try{const legacy=JSON.parse(sessionStorage.getItem("bamco-second-vehicle-comparison")||"null");if(legacy?.state?.scores)comparisonCases=[legacy]}catch(_){}}
 if(comparisonCases.length){
   const valuesForCase=(main,scores)=>main.subgroups.flatMap(sub=>sub.items.map(item=>Number(scores?.[itemKey(main,sub,item)])).filter(n=>Number.isFinite(n)&&n>0));
   const metricsForState=caseState=>{const caseRows=criteria.map((main,index)=>{const values=valuesForCase(main,caseState?.scores||{}),total=main.subgroups.reduce((sum,sub)=>sum+sub.items.length,0),avg=values.length?values.reduce((a,b)=>a+b,0)/values.length:NaN,avg100=Number.isFinite(avg)?avg*10:NaN,weight=normalizedWeights[index]||0,contribution=Number.isFinite(avg100)?avg100*weight:NaN;return {main,avg,avg100,weight,contribution,answered:values.length,total,completion:total?values.length/total*100:0}});const ratedRows=caseRows.filter(r=>Number.isFinite(r.contribution)&&Number.isFinite(r.weight)),rw=ratedRows.reduce((sum,r)=>sum+r.weight,0),final=rw>0?ratedRows.reduce((sum,r)=>sum+r.contribution,0)/rw:NaN,totalAnswered=caseRows.reduce((s,r)=>s+r.answered,0),totalItems=caseRows.reduce((s,r)=>s+r.total,0);return {rows:caseRows,final100:final,completion:totalItems?totalAnswered/totalItems*100:0}};
   const allStates=[{state:{metadata:state.metadata||{},scores:state.scores||{}},fileName:"current"},...comparisonCases],allMetrics=allStates.map(x=>metricsForState(x.state)),labels=allStates.map((x,i)=>[x.state.metadata?.brand,x.state.metadata?.model].filter(Boolean).join(" ").trim()||txt(`خودرو ${i+1}`,`Vehicle ${i+1}`));
   const cmp=wb.addWorksheet(txt("مقایسه خودروها","Vehicle Comparison"));cmp.views=[{rightToLeft:fa,showGridLines:false}];cmp.properties.defaultRowHeight=22;
   const totalCols=3+labels.length+(labels.length-1);const lastCol=Math.min(26,totalCols);cmp.mergeCells(1,1,1,lastCol);cmp.getCell(1,1).value=txt("مقایسه چندخودرویی ارزیابی‌ها","Multi-Vehicle Assessment Comparison");cmp.getCell(1,1).font={bold:true,size:18,color:{argb:"FFFFFFFF"}};cmp.getCell(1,1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF163B69"}};cmp.getCell(1,1).alignment={horizontal:"center",vertical:"middle"};cmp.getRow(1).height=34;
   labels.forEach((label,i)=>{const r=3+i;cmp.getCell(r,1).value=txt(`خودرو ${i+1}`,`Vehicle ${i+1}`);cmp.getCell(r,1).font={bold:true,color:{argb:"FF244B70"}};cmp.getCell(r,2).value=label;cmp.getCell(r,3).value=Number.isFinite(allMetrics[i].final100)?Number(allMetrics[i].final100.toFixed(2)):"";cmp.getCell(r,4).value=Number((allMetrics[i].completion/100).toFixed(4));cmp.getCell(r,4).numFmt="0%"});
   const headerRow=4+labels.length,head=[txt("ردیف","No."),txt("کد شاخص","Code"),txt("شاخص","Criterion"),...labels];for(let i=1;i<labels.length;i++)head.push(txt(`اختلاف ${i+1} با خودروی فعلی`,`Δ Vehicle ${i+1} vs Current`));const cmpHeader=cmp.getRow(headerRow);cmpHeader.values=head;cmpHeader.eachCell(cell=>{cell.font={bold:true,color:{argb:"FFFFFFFF"}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF167D78"}};cell.alignment={horizontal:"center",vertical:"middle",wrapText:true}});
   rows.forEach((r,index)=>{const scores=allMetrics.map(m=>Number.isFinite(m.rows[index]?.avg)?Number(m.rows[index].avg.toFixed(2)):"");const diffs=allMetrics.slice(1).map(m=>Number.isFinite(r.avg)&&Number.isFinite(m.rows[index]?.avg)?Number((m.rows[index].avg-r.avg).toFixed(2)):"");const row=cmp.addRow([index+1,r.main.id,criterionName(r.main),...scores,...diffs]);if(index%2)row.eachCell(cell=>cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF1F6FB"}});row.eachCell(cell=>{cell.alignment={horizontal:"center",vertical:"middle",wrapText:true};cell.border={bottom:{style:"thin",color:{argb:"FFDCE4ED"}}}});row.getCell(3).alignment={horizontal:fa?"right":"left",vertical:"middle",wrapText:true};for(let c=4+labels.length;c<=3+labels.length+(labels.length-1);c++)row.getCell(c).numFmt="+0.00;-0.00;0.00"});
   cmp.getColumn(1).width=8;cmp.getColumn(2).width=12;cmp.getColumn(3).width=38;for(let c=4;c<=3+labels.length;c++)cmp.getColumn(c).width=18;for(let c=4+labels.length;c<=totalCols;c++)cmp.getColumn(c).width=18;
   const comparisonRadarImage=(caseRows,label)=>{const canvas=document.createElement("canvas"),W=900,H=650;canvas.width=W;canvas.height=H;const c=canvas.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,W,H);c.fillStyle="#163b69";c.font="bold 23px Tahoma";c.textAlign="center";c.fillText(label,W/2,32);const cx=W/2,cy=318,R=190,n=caseRows.length,pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]},values=caseRows.map(r=>weightedVisual(r));c.strokeStyle="#cad9e5";[.2,.4,.6,.8,1].forEach(k=>{c.beginPath();caseRows.forEach((_,i)=>{const [x,y]=pt(i,R*k);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.stroke()});caseRows.forEach((r,i)=>{const [x,y]=pt(i,R);c.strokeStyle=palette[i%palette.length];c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke()});c.beginPath();caseRows.forEach((r,i)=>{const v=Number.isFinite(values[i])?values[i]:0,[x,y]=pt(i,R*v/100);i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fillStyle="#2463a533";c.fill();c.strokeStyle="#2463a5";c.lineWidth=3;c.stroke();caseRows.forEach((r,i)=>{const v=Number.isFinite(values[i])?values[i]:0,[x,y]=pt(i,R*v/100),[lx,ly]=pt(i,R+72),a=-Math.PI/2+i*2*Math.PI/n,ux=Math.cos(a);c.fillStyle=palette[i%palette.length];c.beginPath();c.arc(x,y,v<=0?3.5:5,0,Math.PI*2);c.fill();if(v>0){c.font="bold 13px Tahoma";c.textAlign=ux>.28?"left":ux<-.28?"right":"center";c.fillText(v.toFixed(1),x+ux*18,y+Math.sin(a)*18)}c.font="11px Tahoma";c.textAlign=lx>cx+20?"left":lx<cx-20?"right":"center";c.fillText(criterionName(r.main),lx,ly)});return canvas.toDataURL("image/png").split(",")[1]};
   const radarStart=headerRow+18;allMetrics.forEach((m,i)=>{const imageId=wb.addImage({base64:comparisonRadarImage(m.rows,labels[i]),extension:"png"}),pairCol=i%2===0?0:7,pairRow=radarStart+Math.floor(i/2)*27;cmp.addImage(imageId,{tl:{col:pairCol,row:pairRow-1},ext:{width:600,height:455}});for(let rr=pairRow;rr<pairRow+26;rr++)cmp.getRow(rr).height=15});
   cmp.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9};
 }
 ws.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9};ws.headerFooter.oddFooter=fa?"&Cصفحه &P از &N":"&CPage &P of &N";
 const buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`management_dashboard_${window.englishFileToken?window.englishFileToken(state.metadata.model,"vehicle"):"vehicle"}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
window.exportManagerDashboard=exportManagerDashboard;
document.addEventListener("DOMContentLoaded",()=>{bindManagerControls();const button=document.querySelector("#managerExcelButton");if(button)button.addEventListener("click",exportManagerDashboard)});
window.bindManagerControls=bindManagerControls;


/* v12 — bilingual weight-file status and remove/reset control */
(function(){
  const defaultWeights=()=>Object.fromEntries((window.ASSESSMENT_CRITERIA||[]).map(main=>[String(main.id),1/15]));
  const noFileMessage=()=>locale==="fa"?"هنوز فایلی انتخاب نشده است.":"No file has been selected yet.";
  renderWeightPreview=function(data){
    const box=document.querySelector("#managerWeightPreview");if(!box)return;if(!data){box.innerHTML="";return}
    const fa=locale==="fa",problems=[];
    if(data.missing.length)problems.push((fa?"شاخص‌های مفقود: ":"Missing criteria: ")+data.missing.join(fa?"، ":", "));
    if(data.duplicate.length)problems.push((fa?"شاخص‌های تکراری: ":"Duplicate criteria: ")+data.duplicate.join(fa?"، ":", "));
    if(data.unknown.length)problems.push((fa?"شاخص‌های ناشناخته: ":"Unknown criteria: ")+data.unknown.join(fa?"، ":", "));
    if(data.negative?.length)problems.push((fa?"وزن منفی مجاز نیست: ":"Negative weights are not allowed: ")+data.negative.join(fa?"، ":", "));
    if(Math.abs(data.total-1)>=1e-9)problems.push(fa?`مجموع وزن‌ها ${data.total.toFixed(6)} است و باید دقیقاً ۱ باشد.`:`The total weight is ${data.total.toFixed(6)} and must equal exactly 1.`);
    box.innerHTML=`<div class="weightAudit"><strong>${esc(data.fileName)}</strong><span>${fa?"مجموع":"Total"}: ${localNumber(data.total.toFixed(6))}</span><span>${fa?`تعداد شاخص معتبر: ${localNumber(data.found.length)} از ۱۵`:`Valid criteria: ${localNumber(data.found.length)} of 15`}</span></div>${problems.length?`<ul>${problems.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<div class="weightValid">✓ ${fa?"فایل شامل ۱۵ شاخص معتبر و مجموع دقیقاً برابر ۱ است.":"The file contains all 15 valid criteria and the total weight equals exactly 1."}</div>`}`;
  };
  const updateRemoveButton=()=>{
    const btn=document.querySelector("#managerRemoveWeights");
    if(btn)btn.disabled=!(managerWeightState.pending||(managerWeightState.activeSource&&!["default","expert"].includes(managerWeightState.activeSource)));
  };
  const originalTranslateManagerStatic=translateManagerStatic;
  translateManagerStatic=function(){
    originalTranslateManagerStatic();
    const en=locale==="en",set=(sel,text)=>{const el=document.querySelector(sel);if(el)el.textContent=text};
    set("#managerRemoveWeights",en?"Remove File / Restore Defaults":"حذف فایل و بازگشت به پیش‌فرض");
    const msg=document.querySelector("#managerWeightMessage");
    if(msg&&msg.classList.contains("neutral")&&!managerWeightState.pending){msg.textContent=noFileMessage()}
    updateRemoveButton();
  };

  bindManagerControls=function(){
    const input=document.querySelector("#managerWeightInput"),approve=document.querySelector("#managerApproveWeights"),remove=document.querySelector("#managerRemoveWeights");
    if(!input)return;
    if(!input.dataset.bound){
      input.dataset.bound="1";
      input.addEventListener("change",async e=>{
        const file=e.target.files[0];if(!file)return;
        approve.disabled=true;
        managerMessage(locale==="fa"?"در حال بررسی فایل…":"Validating file…");
        try{
          const audit=await inspectWeightFile(file);managerWeightState.pending=audit;persistManager();renderWeightPreview(audit);approve.disabled=!audit.valid;
          managerMessage(audit.valid?(locale==="fa"?"فایل معتبر است؛ برای اعمال وزن‌ها تأیید مدیر لازم است.":"The file is valid. Management approval is required before applying the weights."):(locale==="fa"?"فایل پذیرفته نشد؛ خطاهای زیر را اصلاح کنید.":"The file was rejected. Correct the issues shown below."),audit.valid?"success":"error");
        }catch(err){managerWeightState.pending=null;persistManager();renderWeightPreview(null);managerMessage(locale==="fa"?(err.message||"فایل Excel قابل خواندن نیست."):"The Excel file could not be read.","error")}
        e.target.value="";updateRemoveButton();
      });
      approve.addEventListener("click",()=>{
        const p=managerWeightState.pending;if(!p?.valid)return;
        const next={};p.found.forEach(x=>next[x.id]=x.weight);state.weights=next;managerWeightState.activeExpert=p.expert||"";managerWeightState.activeSource=p.fileName;managerWeightState.pending=null;persistManager();persist();renderWeightPreview(null);approve.disabled=true;
        managerMessage(locale==="fa"?"وزن‌ها با تأیید مدیر اعمال شدند و داشبورد به‌روزرسانی شد.":"The weights were approved and applied. The dashboard has been updated.","success");updateRemoveButton();update();
      });
    }
    if(remove&&!remove.dataset.bound){
      remove.dataset.bound="1";
      remove.addEventListener("click",()=>{
        const hadActive=!!(managerWeightState.activeSource&&!["default","expert"].includes(managerWeightState.activeSource));
        let hasConfirmedExpert=false;try{const ex=JSON.parse(localStorage.getItem("bamco-vehicle-expert-weights")||"null");hasConfirmedExpert=!!(ex?.confirmed||ex?.confirmedSnapshot?.weights)}catch(_){}const question=locale==="fa"?(hadActive?(hasConfirmedExpert?"فایل وزن مدیریتی حذف شود و وزن‌های تأییدشده خبره دوباره فعال شوند؟":"فایل وزن مدیریتی حذف شود و وزن‌ها به حالت پیش‌فرض برابر بازگردند؟"):"فایل انتخاب‌شده حذف شود؟"):(hadActive?(hasConfirmedExpert?"Remove the management weight file and return to the confirmed expert weights?":"Remove the management weight file and restore equal default weights?"):"Remove the selected file?");
        if(!confirm(question))return;
        managerWeightState.pending=null;
        const restored=window.restoreBaselineWeightsAfterManagerOverride?window.restoreBaselineWeightsAfterManagerOverride():false;
        if(!restored){managerWeightState.activeExpert="";managerWeightState.activeSource="default";state.weights=defaultWeights();persistManager();persist();}
        renderWeightPreview(null);approve.disabled=true;input.value="";
        managerMessage(locale==="fa"?(managerWeightState.activeSource==="expert"?"فایل مدیریتی حذف شد و وزن‌های تأییدشده خبره دوباره فعال شدند.":"فایل حذف شد و وزن‌ها به حالت پیش‌فرض برابر بازگشتند."):(managerWeightState.activeSource==="expert"?"The management file was removed and the confirmed expert weights are active again.":"The file was removed and equal default weights were restored."),"neutral");
        updateRemoveButton();update();
      });
    }
    translateManagerStatic();updateRemoveButton();
  };
  window.bindManagerControls=bindManagerControls;
  const previousRefreshLanguage=window.refreshManagerLanguage;
  window.refreshManagerLanguage=()=>{if(previousRefreshLanguage)previousRefreshLanguage();translateManagerStatic()};
  document.addEventListener("DOMContentLoaded",()=>{bindManagerControls();translateManagerStatic()});
})();


/* v18 — automatic Expert → Management weight synchronization with optional management override */
(function(){
  const equalWeights=()=>Object.fromEntries((window.ASSESSMENT_CRITERIA||[]).map(main=>[String(main.id),1/15]));
  const readExpert=()=>{try{return JSON.parse(localStorage.getItem("bamco-vehicle-expert-weights")||"null")}catch(_){return null}};
  const confirmedExpertData=(data)=>{if(data?.confirmed&&data.weights)return data;const snap=data?.confirmedSnapshot;if(snap?.weights)return {confirmed:true,weights:snap.weights,info:snap.info||data?.info||{},confirmedAt:snap.confirmedAt};return null};
  const normalizedExpert=(data)=>{
    data=confirmedExpertData(data);if(!data?.weights)return null;
    const next={};let total=0;
    for(const main of (window.ASSESSMENT_CRITERIA||[])){
      const raw=String(data.weights[main.id]??"").trim();
      let value=0;
      if(raw.includes("/")){const [a,b]=raw.replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).split("/").map(Number);value=b?a/b:NaN}
      else value=Number(raw.replace(/٫/g,".").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
      if(!Number.isFinite(value)||value<0)return null;
      next[main.id]=value; total+=value;
    }
    return Math.abs(total-1)<1e-9?next:null;
  };
  const isFileOverride=()=>managerWeightState.activeSource&&!["default","expert"].includes(managerWeightState.activeSource);
  function activateExpert(data,force=false){
    const source=confirmedExpertData(data),weights=normalizedExpert(data);if(!weights||!source)return false;
    if(isFileOverride()&&!force)return false;
    state.weights=weights;
    managerWeightState.activeSource="expert";
    managerWeightState.activeExpert=source.info?.name||"";
    managerWeightState.pending=null;
    persistManager();persist();
    return true;
  }
  function activateDefault(){
    state.weights=equalWeights();managerWeightState.activeSource="default";managerWeightState.activeExpert="";managerWeightState.pending=null;persistManager();persist();
  }
  function updateSourceLabel(){
    const label=document.querySelector("#activeWeightsLabel");
    if(label){
      if(managerWeightState.activeSource==="expert")label.textContent=locale==="fa"?"وزن‌های تأییدشده خبره":"Confirmed expert weights";
      else if(managerWeightState.activeSource==="default")label.textContent=locale==="fa"?"وزن‌های پیش‌فرض برابر":"Equal default weights";
      else label.textContent=locale==="fa"?`فایل مدیریتی فعال: ${managerWeightState.activeSource}`:`Active management file: ${managerWeightState.activeSource}`;
    }
    const remove=document.querySelector("#managerRemoveWeights");
    if(remove){const expert=readExpert();remove.textContent=confirmedExpertData(expert)?(locale==="fa"?"حذف فایل و بازگشت به وزن خبره":"Remove File / Return to Expert Weights"):(locale==="fa"?"حذف فایل و بازگشت به پیش‌فرض":"Remove File / Restore Defaults")}
  }
  function syncBaseline(){
    if(isFileOverride()){updateSourceLabel();return}
    const expert=readExpert();
    if(!activateExpert(expert,false))activateDefault();
    updateSourceLabel();
  }
  window.applyConfirmedExpertWeights=(data)=>{
    const ok=activateExpert(data,false);updateSourceLabel();if(ok&&typeof update==="function")update();return ok;
  };
  window.onExpertWeightsCleared=()=>{
    if(!isFileOverride()){activateDefault();updateSourceLabel();if(typeof update==="function")update()}
  };
  window.restoreBaselineWeightsAfterManagerOverride=()=>{
    const expert=readExpert();
    if(activateExpert(expert,true)){updateSourceLabel();return true}
    activateDefault();updateSourceLabel();return true;
  };
  window.getManagerWeightBackup=()=>JSON.parse(JSON.stringify(managerWeightState));
  window.restoreManagerWeightBackup=(data)=>{
    managerWeightState={pending:null,activeExpert:"",activeSource:"default",...(data||{})};persistManager();syncBaseline();
  };
  const previousBind=window.bindManagerControls;
  window.bindManagerControls=function(){syncBaseline();if(previousBind)previousBind();updateSourceLabel()};
  const previousRefresh=managerRefresh;
  managerRefresh=function(...args){previousRefresh(...args);updateSourceLabel()};window.managerRefresh=managerRefresh;
  const previousTranslate=translateManagerStatic;
  translateManagerStatic=function(){previousTranslate();updateSourceLabel()};
  document.addEventListener("DOMContentLoaded",()=>{syncBaseline();updateSourceLabel()});
})();
