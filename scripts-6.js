/* v22.js */
/* v22 — restore scoring guide, simplify experience lists, clean Persian chart titles, and bounded frequency labels */
(()=>{
  /* Remove the combining hamza-above form that rendered the final Persian heh poorly in Management. */
  try{
    T.fa.performanceChart="مقایسه عملکرد وزن‌دار شاخص‌ها";
    T.fa.qualityDistribution="توزیع وزن‌دار درجه کیفی";
  }catch(_){ }

  function refreshManagerChartTitles(){
    const performance=document.querySelector('#performanceChartTitle');
    const quality=document.querySelector('#qualityChartTitle');
    if(performance) performance.textContent=locale==='fa'?'مقایسه عملکرد وزن‌دار شاخص‌ها':T.en.performanceChart;
    if(quality) quality.textContent=locale==='fa'?'توزیع وزن‌دار درجه کیفی':T.en.qualityDistribution;
  }

  /* Restore the former compact two-column / five-row scoring guide. */
  renderScoreGuide=function(){
    const guide=document.querySelector('#scoreGuideGrid');
    if(!guide)return;
    guide.innerHTML=SCORE_LEVELS.map(level=>`<article class="guideLevel score-${level.n}"><div><strong style="background:${scoreColor(level.n)}">${localNumber(level.n)}</strong><b>${locale==='fa'?level.fa:level.en}</b></div><p>${locale==='fa'?level.desc:SCORE_DESCRIPTIONS_EN[level.n-1]}</p></article>`).join('');
  };

  /* Remove "Other" from both work-experience selectors and suppress the manual field. */
  function removeOtherExperienceOption(){
    const evaluator=document.querySelector('[data-experience-select="evaluator"]');
    const evaluatorOther=document.querySelector('[data-experience-other="evaluator"]');
    if(evaluator){
      evaluator.querySelector('option[value="other"]')?.remove();
      if(evaluator.value==='other'||state.metadata?.evaluatorExperienceCode==='other'){
        evaluator.value='';
        state.metadata.evaluatorExperienceCode='';
        state.metadata.evaluatorExperience='';
        state.metadata.evaluatorExperienceOther='';
        try{persist()}catch(_){ }
      }
    }
    if(evaluatorOther){evaluatorOther.hidden=true;evaluatorOther.value='';}

    const expert=document.querySelector('[data-expert-experience-select]');
    const expertOther=document.querySelector('[data-expert-experience-other]');
    if(expert){
      expert.querySelector('option[value="other"]')?.remove();
      if(expert.value==='other'||expertState?.info?.experienceCode==='other'){
        expert.value='';
        expertState.info.experienceCode='';
        expertState.info.experience='';
        expertState.info.experienceOther='';
        expertState.confirmed=false;
        try{persistExpert()}catch(_){ }
      }
    }
    if(expertOther){expertOther.hidden=true;expertOther.value='';}
  }

  /* Return expert confirmation eligibility to the original weight-based rule.
     This removes the "required expert information" warning sentence from the UI. */
  renderExpertStatus=function(){
    const total=expertTotal(),validTotal=Math.abs(total-1)<1e-9,complete=expertWeightsComplete();
    const status=document.querySelector('#expertWeightStatus');if(!status)return;
    const kind=validTotal?'valid':total<1?'low':'high',remaining=1-total;
    const totalValue=document.querySelector('#expertTotalValue'),remainingValue=document.querySelector('#expertRemainingValue');
    if(totalValue)totalValue.textContent=shownWeight(total.toFixed(3));
    if(remainingValue)remainingValue.textContent=shownWeight((Math.abs(remaining)<1e-9?0:remaining).toFixed(3));
    status.className=`expertWeightStatus ${kind}`;
    status.textContent=et(kind);
    const confirmButton=document.querySelector('#expertConfirmButton'),excelButton=document.querySelector('#expertExcelButton');
    if(confirmButton)confirmButton.disabled=!(validTotal&&complete);
    if(excelButton)excelButton.disabled=!(validTotal&&complete&&expertState.confirmed);
  };

  /* Weighted numeric frequency. The value label says Frequency/Fراوانی and is kept inside the track. */
  const activeNormalizedWeights=()=>{
    const list=window.ASSESSMENT_CRITERIA||[];
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    return total>0?raw.map(v=>v/total):list.map(()=>list.length?1/list.length:0);
  };
  const shownFrequency=v=>{
    const rounded=Math.round(v);
    return localNumber(Math.abs(v-rounded)<0.05?String(rounded):v.toFixed(1));
  };
  renderQualityChart=function(){
    const list=window.ASSESSMENT_CRITERIA||[],weights=activeNormalizedWeights(),buckets=Array(10).fill(0);
    let answeredMass=0,answeredCount=0;
    list.forEach((main,index)=>{
      const weight=weights[index]||0;if(weight<=0)return;
      const allItems=main.subgroups.flatMap(sub=>sub.items.map(item=>({sub,item})));
      const unit=allItems.length?weight/allItems.length:0;
      allItems.forEach(({sub,item})=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(n>=1&&n<=10){buckets[n-1]+=unit;answeredMass+=unit;answeredCount++;}
      });
    });
    const counts=answeredMass>0?buckets.map(v=>v/answeredMass*answeredCount):buckets;
    const host=document.querySelector('#qualityChart');if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty">${locale==='fa'?'با ثبت امتیاز، توزیع وزن‌دار کیفیت در این بخش نمایش داده می‌شود.':'The weighted quality distribution will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=count/max*100,level=SCORE_LEVELS.find(x=>x.n===i+1),label=locale==='fa'?level.fa:level.en;
      const frequency=locale==='fa'?`فراوانی: ${shownFrequency(count)}`:`Frequency: ${shownFrequency(count)}`;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${frequency}</b></div></div>`;
    }).join('');
  };

  /* Re-apply the small UI patches whenever locale/metadata/expert panel is rebuilt. */
  const baseSetLocale=setLocale;
  setLocale=function(next){
    const out=baseSetLocale(next);
    removeOtherExperienceOption();
    refreshManagerChartTitles();
    renderScoreGuide();
    return out;
  };
  const baseRenderMetadata=renderMetadata;
  renderMetadata=function(...args){const out=baseRenderMetadata(...args);removeOtherExperienceOption();return out;};

  const baseExpertRender=window.renderExpertPanel;
  window.renderExpertPanel=function(...args){const out=baseExpertRender?.(...args);removeOtherExperienceOption();renderExpertStatus();return out;};
  try{renderExpertPanel=window.renderExpertPanel}catch(_){ }

  removeOtherExperienceOption();
  refreshManagerChartTitles();
  renderScoreGuide();
  if(typeof update==='function')update();
})();

;
/* v23.js */
/* v23 — raw score-frequency distribution, Persian heh cleanup, and expert Excel gating */
(()=>{
  /* Avoid the combining ezafe mark after Persian heh in Management-facing text. */
  try{
    T.fa.managerRoleDesc='مشاهده داشبورد، نتایج و گزارش مدیریتی';
    T.fa.qualityDistribution='توزیع درجه کیفی';
    T.fa.qualityDistributionHint='فراوانی امتیازهای ۱ تا ۱۰ در شاخص‌های دارای وزن فعال';
    T.en.qualityDistribution='Quality Grade Distribution';
    T.en.qualityDistributionHint='Frequency of scores from 1 to 10 among criteria with active weight';
  }catch(_){ }

  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const hasActiveWeight=main=>Math.max(0,Number(state.weights?.[main.id])||0)>0;

  /* Frequency means the actual number of recorded occurrences of each score.
     Zero-weight criteria are excluded so disabling a criterion still updates the chart. */
  renderQualityChart=function(){
    const counts=Array(10).fill(0);
    criteria().forEach(main=>{
      if(!hasActiveWeight(main))return;
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(Number.isInteger(n)&&n>=1&&n<=10)counts[n-1]++;
      }));
    });
    const host=document.querySelector('#qualityChart');
    if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty">${locale==='fa'?'با ثبت امتیاز، فراوانی درجه‌های کیفی در این بخش نمایش داده می‌شود.':'The quality-grade frequency will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=max?count/max*100:0;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${label}</span><div class="qualityTrack"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i><b class="qualityCount" style="--quality-count-position:${width}%">${localNumber(count)}</b></div></div>`;
    }).join('');
  };

  /* Expert Excel is deliberately unavailable until the current weights have been finally confirmed. */
  const baseExpertStatus=renderExpertStatus;
  renderExpertStatus=function(...args){
    const out=baseExpertStatus(...args);
    const excel=document.querySelector('#expertExcelButton');
    if(excel){
      const totalOk=Math.abs(expertTotal()-1)<1e-9;
      const weightsOk=expertWeightsComplete();
      excel.disabled=!(expertState.confirmed&&totalOk&&weightsOk);
      excel.setAttribute('aria-disabled',excel.disabled?'true':'false');
      excel.title=excel.disabled
        ? (locale==='fa'?'پس از تأیید نهایی وزن‌ها فعال می‌شود.':'Available after final confirmation of the weights.')
        : '';
    }
    return out;
  };

  function refreshV23Text(){
    const role=document.querySelector('.managerRole [data-i18n="managerRoleDesc"]');
    if(role&&locale==='fa')role.textContent='مشاهده داشبورد، نتایج و گزارش مدیریتی';
    const qTitle=document.querySelector('#qualityChartTitle');
    const qHint=document.querySelector('#qualityChartHint');
    if(qTitle)qTitle.textContent=locale==='fa'?'توزیع درجه کیفی':'Quality Grade Distribution';
    if(qHint)qHint.textContent=locale==='fa'?'فراوانی امتیازهای ۱ تا ۱۰ در شاخص‌های دارای وزن فعال':'Frequency of scores from 1 to 10 among criteria with active weight';
  }

  const baseSetLocale=setLocale;
  setLocale=function(next){
    const out=baseSetLocale(next);
    refreshV23Text();
    renderExpertStatus();
    if(typeof update==='function')update();
    return out;
  };

  const priorManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=priorManagerRefresh(...args);
    refreshV23Text();
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  refreshV23Text();
  renderExpertStatus();
  if(typeof update==='function')update();
})();

;
/* v24.js */
/* v24 — unboxed chart values, external quality frequencies, and weight-aware radar */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];

  const weightedImpactRows=rows=>{
    const list=(rows||[]).map(r=>({...r,weight:Math.max(0,Number(r.weight)||0)}));
    const maxWeight=Math.max(0,...list.map(r=>r.weight));
    return list.map(r=>{
      const raw=Number.isFinite(r.avg100)?r.avg100:(Number.isFinite(r.avg)?r.avg*10:NaN);
      const impact=Number.isFinite(raw)&&maxWeight>0?raw*(r.weight/maxWeight):(r.weight===0?0:NaN);
      return {...r,raw100:raw,weightedVisual:Number.isFinite(impact)?Math.max(0,Math.min(100,impact)):NaN};
    });
  };

  /* Actual score frequency remains visible, but never sits on top of a colored bar. */
  renderQualityChart=function(){
    const counts=Array(10).fill(0);
    criteria().forEach(main=>{
      const weight=Math.max(0,Number(state.weights?.[main.id])||0);
      if(weight<=0)return;
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(Number.isInteger(n)&&n>=1&&n<=10)counts[n-1]++;
      }));
    });
    const host=document.querySelector('#qualityChart');
    if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'با ثبت امتیاز، فراوانی درجه‌های کیفی در این بخش نمایش داده می‌شود.':'The quality-grade frequency will appear after scores are recorded.'}</p>`;
      return;
    }
    host.innerHTML=counts.map((count,i)=>{
      const width=max?count/max*100:0;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr"><span class="qualityLabel">${esc(label)}</span><div class="qualityTrack" aria-label="${esc(label)}: ${localNumber(count)}"><i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i></div><b class="qualityFrequency">${localNumber(count)}</b></div>`;
    }).join('');
  };

  /* Radar uses the exact same relative weighted impact as the weighted column chart.
     A criterion with zero active weight is therefore plotted at the center (0). */
  renderRadar=function(rows){
    const host=document.querySelector('#radarChart');
    if(!host)return;
    const data=weightedImpactRows(rows);
    const hasAnyScore=data.some(r=>Number.isFinite(r.raw100));
    if(!hasAnyScore){
      host.innerHTML=`<p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار عنکبوتی نمایش داده می‌شود.':'The radar chart will appear after scores are recorded.'}</p>`;
      return;
    }
    const n=data.length,cx=380,cy=300,R=190;
    const angle=i=>-Math.PI/2+i*2*Math.PI/n;
    const point=(i,radius)=>{const a=angle(i);return[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]};
    const pts=radius=>data.map((_,i)=>point(i,radius).join(',')).join(' ');
    const impactValue=r=>Number.isFinite(r.weightedVisual)?r.weightedVisual:0;
    const dataPoints=data.map((r,i)=>point(i,impactValue(r)/100*R));
    const wedges=data.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return `<polygon points="${cx},${cy} ${p1.join(',')} ${p2.join(',')}" fill="${colors[i%colors.length]}" opacity=".075"/>`}).join('');
    const axes=data.map((r,i)=>{
      const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=dataPoints[i];
      const name=title(r.main.titleFa,'main',r.main.id),words=name.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]:[name];
      const impact=impactValue(r),value=(Number.isFinite(r.raw100)?fmt(impact):'—');
      const valueRadius=Math.max(30,impact/100*R+18),[scoreX,scoreY]=point(i,valueRadius);
      const anchor=ux>.28?'start':ux<-.28?'end':'middle',baseline=uy>.55?'hanging':uy<-.55?'auto':'middle';
      const circle=Number.isFinite(r.raw100)||r.weight<=0?`<circle cx="${vx}" cy="${vy}" r="${impact<=0?3.8:5.5}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2"/>`:'';
      const valueText=impact>0?`<text x="${scoreX}" y="${scoreY}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i%colors.length]}">${value}</text>`:'';
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i%colors.length]}88"/>${circle}${valueText}<text x="${lx}" y="${ly}" fill="${colors[i%colors.length]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join('')}</text>`;
    }).join('');
    host.innerHTML=`<svg viewBox="0 0 760 600" role="img" aria-label="${locale==='fa'?'نمودار عنکبوتی وزن‌دار شاخص‌ها از ۱۰۰':'Weighted criteria radar chart out of 100'}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join('')}${axes}<polygon points="${dataPoints.map(p=>p.join(',')).join(' ')}" class="radarData"/></svg>`;
  };

  /* Ensure the v24 renderers remain the final renderers after every manager refresh. */
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    const rows=args[0]||[];
    renderRadar(rows);
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  if(typeof update==='function')update();
})();

;
/* v26.js */
/* v26 — frequency immediately after each quality bar and consistent expert Excel styling support */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];

  renderQualityChart=function(){
    const counts=Array(10).fill(0);
    criteria().forEach(main=>{
      const weight=Math.max(0,Number(state.weights?.[main.id])||0);
      if(weight<=0)return;
      main.subgroups.forEach(sub=>sub.items.forEach(item=>{
        const n=Number(state.scores?.[itemKey(main,sub,item)]);
        if(Number.isInteger(n)&&n>=1&&n<=10)counts[n-1]++;
      }));
    });

    const host=document.querySelector('#qualityChart');
    if(!host)return;
    const max=Math.max(0,...counts);
    if(max<=0){
      host.innerHTML=`<p class="qualityEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'با ثبت امتیاز، فراوانی درجه‌های کیفی در این بخش نمایش داده می‌شود.':'The quality-grade frequency will appear after scores are recorded.'}</p>`;
      return;
    }

    host.innerHTML=counts.map((count,i)=>{
      const width=max?count/max*100:0;
      const level=SCORE_LEVELS.find(x=>x.n===i+1);
      const label=locale==='fa'?level.fa:level.en;
      return `<div class="qualityBar" dir="ltr">
        <span class="qualityLabel" dir="${locale==='fa'?'rtl':'ltr'}">${esc(label)}</span>
        <div class="qualityVisual">
          <div class="qualityTrack" aria-label="${esc(label)}: ${localNumber(count)}">
            <i style="--quality-width:${width}%;--quality-color:${scoreColor(i+1)}"></i>
            <b class="qualityFrequency" style="--quality-count-position:${width}%">${localNumber(count)}</b>
          </div>
        </div>
      </div>`;
    }).join('');
  };

  /* Keep the latest quality renderer active after every manager refresh. */
  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    renderQualityChart();
    return out;
  };
  window.managerRefresh=managerRefresh;

  if(typeof update==='function')update();
})();

;
/* v29.js */
/* v29 — strength threshold cleanup and compact equal empty chart cards */
(()=>{
  function syncEmptyChartCards(){
    const ids=['scoreChart','qualityChart','radarChart'];
    ids.forEach(id=>{
      const host=document.getElementById(id);
      if(!host)return;
      const empty=!!host.querySelector('.chartEmpty,.qualityEmpty');
      const card=host.closest('.card');
      host.classList.toggle('chartEmptyHost',empty);
      if(card)card.classList.toggle('chartEmptyCard',empty);
    });
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    syncEmptyChartCards();
    return out;
  };
  window.managerRefresh=managerRefresh;

  syncEmptyChartCards();
  requestAnimationFrame(syncEmptyChartCards);
})();

;
/* v30.js */
/* v30 — priority-only strengths (10/9/8) and weaknesses (1/2/3) */
(()=>{
  const criteria=()=>window.ASSESSMENT_CRITERIA||[];
  const activeNormalizedWeights=()=>{
    const list=criteria();
    const raw=list.map(main=>Math.max(0,Number(state.weights?.[main.id])||0));
    const total=raw.reduce((a,b)=>a+b,0);
    if(total>0)return raw.map(v=>v/total);
    return list.map(()=>list.length?1/list.length:0);
  };

  function renderPriorityStrengthWeakness(){
    const fa=locale==='fa';
    const weights=activeNormalizedWeights();
    const groups=criteria().map((main,index)=>{
      if((weights[index]||0)<=0)return null;
      const items=main.subgroups.flatMap(sub=>
        sub.items
          .map(item=>({sub,item,score:Number(state.scores?.[itemKey(main,sub,item)])}))
          .filter(row=>Number.isFinite(row.score))
      );
      return items.length?{main,items}:null;
    }).filter(Boolean);

    const pick=(items,levels)=>{
      const level=levels.find(n=>items.some(item=>item.score===n));
      return level===undefined?[]:items.filter(item=>item.score===level);
    };

    // Priority within each criterion: strongest available of 10→9→8, weakest available of 1→2→3.
    const strengths=groups
      .map(group=>({...group,items:pick(group.items,[10,9,8])}))
      .filter(group=>group.items.length);
    const weaknesses=groups
      .map(group=>({...group,items:pick(group.items,[1,2,3])}))
      .filter(group=>group.items.length);

    const render=(items,weak)=>items.length?items.map(group=>{
      const level=group.items[0].score;
      const scoreLevel=SCORE_LEVELS.find(x=>x.n===level);
      const levelTitle=fa?(scoreLevel?.fa||''):(scoreLevel?.en||'');
      const count=group.items.length;
      const countText=fa?`${localNumber(count)} مورد`:`${localNumber(count)} ${count===1?'item':'items'}`;
      return `<details class="performanceDetails"><summary><strong>${esc(title(group.main.titleFa,'main',group.main.id))}</strong><span>${countText} — ${levelTitle}</span></summary><div>${group.items.map(row=>`<article class="summaryPoint"><strong>${esc(fa?(row.item.titleFa||itemTitle(row.item)):itemTitleEn(row.item))}</strong><span>${localNumber(row.score)} ${fa?'از ۱۰':'out of 10'}</span><small>${esc(title(row.sub.titleFa,'sub',row.sub.id))}</small></article>`).join('')}</div></details>`;
    }).join(''):`<div class="auditEmpty">${fa?(weak?'موردی با امتیاز ۱ تا ۳ در شاخص‌های دارای وزن ثبت نشده است.':'موردی با امتیاز ۸ تا ۱۰ در شاخص‌های دارای وزن ثبت نشده است.'):(weak?'No item scored 1 to 3 in a criterion with active weight.':'No item scored 8 to 10 in a criterion with active weight.')}</div>`;

    const a=document.querySelector('#strengthList');
    const b=document.querySelector('#weaknessList');
    if(a)a.innerHTML=render(strengths,false);
    if(b)b.innerHTML=render(weaknesses,true);
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    renderPriorityStrengthWeakness();
    return out;
  };
  window.managerRefresh=managerRefresh;

  renderPriorityStrengthWeakness();
})();

;
/* v32.js */
/* v32 — evidence removal fix, lock hardening, reopen translation/header layout, management revision history */
(()=>{
  const isLocked=()=>!!state?.workflow?.locked&&!(window.BAMCO_CAN_EDIT_CASE&&window.BAMCO_CAN_EDIT_CASE());

  function syncLockedMediaControls(){
    const locked=isLocked();
    document.querySelectorAll('[data-attachment-input],[data-vehicle-photo],[data-remove-attachment],[data-remove-vehicle-photo]').forEach(control=>{
      if('disabled' in control)control.disabled=locked;
      control.setAttribute('aria-disabled',locked?'true':'false');
    });
    document.querySelectorAll('.uploadButton,.vehiclePhotoButton,.vehiclePhotoRemove,.attachment button').forEach(control=>{
      control.setAttribute('aria-disabled',locked?'true':'false');
    });
  }

  function syncReopenUi(){
    const unlock=document.querySelector('#unlockAssessmentButton');
    if(unlock){
      const hasActive=state?.workflow?.editAuthorization?.status==='active';unlock.textContent=hasActive?(locale==='fa'?'تغییر مجوز ویرایش':'Change Edit Permission'):(locale==='fa'?'صدور مجوز ویرایش':'Grant Edit Permission');
      unlock.setAttribute('aria-label',unlock.textContent);
      document.body.classList.toggle('reopenVisible',!unlock.hidden);
    }else{
      document.body.classList.remove('reopenVisible');
    }
  }

  function revisionEntries(){
    return (Array.isArray(state?.auditTrail)?state.auditTrail:[])
      .filter(entry=>entry&&entry.type==='edit'&&entry.at)
      .slice()
      .reverse();
  }

  function renderRevisionHistory(){
    const card=document.querySelector('#revisionHistoryCard');
    const host=document.querySelector('#revisionHistoryList');
    if(!card||!host)return;
    const entries=revisionEntries();
    const show=currentRole==='manager'&&entries.length>0;
    card.hidden=!show;
    if(!show){host.innerHTML='';return;}

    const fa=locale==='fa';
    const title=document.querySelector('#revisionHistoryTitle');
    const hint=document.querySelector('#revisionHistoryHint');
    if(title)title.textContent=fa?'سوابق اصلاحات پرونده':'Case Revision History';
    if(hint)hint.textContent=fa
      ?'نام، دلیل اصلاح، تاریخ و زمان مجوز ویرایش و تغییرات همان جلسه'
      :'Name, revision reason, date, and time of the editing authorization and its session changes.';

    host.innerHTML=entries.map(entry=>{
      const d=new Date(entry.at);
      const date=Number.isNaN(d.getTime())?'—':d.toLocaleDateString(fa?'fa-IR':'en-GB',{year:'numeric',month:'2-digit',day:'2-digit'});
      const time=Number.isNaN(d.getTime())?'—':d.toLocaleTimeString(fa?'fa-IR':'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const matchingAuthorization=(Array.isArray(state?.auditTrail)?state.auditTrail:[]).find(auth=>auth&&auth.type==='edit_authorization'&&(auth.at===entry.sessionOpenedAt||auth.at===entry.at)&&(!entry.actor||!auth.targetUser||String(auth.targetUser).toLowerCase()===String(entry.actor).toLowerCase()));
      const role=entry.targetRole||matchingAuthorization?.targetRole||'';
      const roleText=role==='expert'?(fa?'خبره':'Expert'):role==='evaluator'?(fa?'ارزیاب':'Evaluator'):'—';
      return `<article class="revisionEntry">
        <div class="revisionField"><span>${fa?'نام ویرایش‌کننده':'Editor'}</span><strong>${esc(entry.actor||'—')}</strong></div>
        <div class="revisionField revisionRole"><span>${fa?'نقش اصلاح‌کننده':'Revision role'}</span><strong>${roleText}</strong></div>
        <div class="revisionField revisionReason"><span>${fa?'دلیل اصلاح':'Revision reason'}</span><strong>${esc(entry.reason||'—')}</strong></div>
        <div class="revisionField"><span>${fa?(entry.pending?'تاریخ مجوز ویرایش':'تاریخ ویرایش'):(entry.pending?'Authorization date':'Revision date')}</span><strong>${date}</strong></div>
        <div class="revisionField"><span>${fa?(entry.pending?'زمان مجوز ویرایش':'زمان ویرایش'):(entry.pending?'Authorization time':'Revision time')}</span><strong>${time}</strong></div>
      </article>`;
    }).join('');
  }

  /* Capture remove clicks so newly-added evidence is removable immediately.
     This also prevents the older per-button listener from firing a second time. */
  document.addEventListener('click',event=>{
    const remove=event.target.closest?.('[data-remove-attachment]');
    if(remove){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(isLocked())return;
      const raw=remove.dataset.removeAttachment||'';
      const cut=raw.lastIndexOf('|');
      if(cut<1)return;
      const key=raw.slice(0,cut),index=Number(raw.slice(cut+1));
      if(!Number.isInteger(index))return;
      removeAttachment(key,index);
      return;
    }

    if(isLocked()&&event.target.closest?.('.uploadButton,.vehiclePhotoButton,.vehiclePhotoRemove')){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);

  /* Block file-input mutation events while locked, even if triggered outside normal pointer flow. */
  document.addEventListener('change',event=>{
    if(!isLocked())return;
    if(event.target.matches?.('[data-attachment-input],[data-vehicle-photo]')){
      event.preventDefault();
      event.stopImmediatePropagation();
      event.target.value='';
    }
  },true);

  const previousManagerRefresh=window.managerRefresh||managerRefresh;
  managerRefresh=function(...args){
    const out=previousManagerRefresh(...args);
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
    return out;
  };
  window.managerRefresh=managerRefresh;

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const out=previousSetLocale(next);
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
    return out;
  };

  /* Keep role switches and any direct workflow redraws synchronized. */
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{
    syncReopenUi();
    syncLockedMediaControls();
    renderRevisionHistory();
  }));

  syncReopenUi();
  syncLockedMediaControls();
  renderRevisionHistory();
  if(typeof update==='function')update();
})();

;
/* v40.js */
/* v47 — dedicated Management multi-vehicle comparison workspace */
(()=>{
  const MULTI_KEY='bamco-multi-vehicle-comparisons';
  const COUNT_KEY='bamco-comparison-vehicle-count';
  const LEGACY_SECOND_KEY='bamco-second-vehicle-comparison';
  const MAX_COMPARE=5;
  let comparisonMode=false;
  let compareCount=0;
  let comparisonCases=[];

  const safeParse=value=>{try{return JSON.parse(value)}catch(_){return null}};
  try{
    const stored=safeParse(sessionStorage.getItem(MULTI_KEY)||'[]');
    if(Array.isArray(stored))comparisonCases=stored.slice(0,MAX_COMPARE);
    compareCount=Math.max(0,Math.min(MAX_COMPARE,Number(sessionStorage.getItem(COUNT_KEY)||0)||0));
    if(!comparisonCases.length){
      const legacy=safeParse(sessionStorage.getItem(LEGACY_SECOND_KEY)||'null');
      if(legacy?.state?.scores){comparisonCases=[legacy];compareCount=Math.max(compareCount,1)}
    }
    if(compareCount&&comparisonCases.length<compareCount)comparisonCases=[...comparisonCases,...Array(compareCount-comparisonCases.length).fill(null)];
    if(!compareCount&&comparisonCases.some(Boolean))compareCount=Math.min(MAX_COMPARE,comparisonCases.length);
  }catch(_){}

  function persistComparison(){
    comparisonCases=comparisonCases.slice(0,compareCount||MAX_COMPARE);
    try{sessionStorage.setItem(MULTI_KEY,JSON.stringify(comparisonCases));sessionStorage.setItem(COUNT_KEY,String(compareCount||0))}catch(_){}
    const first=comparisonCases.find(Boolean);try{first?sessionStorage.setItem(LEGACY_SECOND_KEY,JSON.stringify(first)):sessionStorage.removeItem(LEGACY_SECOND_KEY)}catch(_){}
  }

  function normalizedWeights(){
    const criteria=window.ASSESSMENT_CRITERIA||[];if(!criteria.length)return [];
    const raw=criteria.map(main=>{const w=Number(state.weights?.[main.id]??(1/criteria.length));return Number.isFinite(w)&&w>=0?w:0});
    const total=raw.reduce((a,b)=>a+b,0);return total>0?raw.map(w=>w/total):criteria.map(()=>1/criteria.length);
  }
  function valuesForScores(main,scores){return main.subgroups.flatMap(sub=>sub.items.map(item=>Number(scores?.[itemKey(main,sub,item)])).filter(n=>Number.isFinite(n)&&n>0))}
  function caseMetrics(caseState){
    const criteria=window.ASSESSMENT_CRITERIA||[],weights=normalizedWeights(),maxWeight=Math.max(0,...weights);let answered=0,totalItems=0;
    const rows=criteria.map((main,index)=>{const vals=valuesForScores(main,caseState?.scores||{}),total=main.subgroups.reduce((sum,sub)=>sum+sub.items.length,0);answered+=vals.length;totalItems+=total;const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN,avg100=Number.isFinite(avg)?avg*10:NaN,weight=weights[index]||0,contribution=Number.isFinite(avg100)?avg100*weight:NaN,weightedVisual=Number.isFinite(avg100)?(weight<=0?0:(maxWeight>0?Math.max(0,Math.min(100,avg100*(weight/maxWeight))):NaN)):NaN;return {main,avg,avg100,weight,contribution,weightedVisual,answered:vals.length,total}});
    const rated=rows.filter(r=>Number.isFinite(r.contribution)&&Number.isFinite(r.weight)),ratedWeight=rated.reduce((sum,r)=>sum+r.weight,0),final100=ratedWeight>0?rated.reduce((sum,r)=>sum+r.contribution,0)/ratedWeight:NaN;
    return {rows,final100,completion:totalItems?Math.round(answered/totalItems*100):0,answered,total:totalItems};
  }
  function vehicleLabel(caseState,fallback){const meta=caseState?.metadata||{};return [meta.brand,meta.model].filter(Boolean).join(' ').trim()||fallback}
  function signed(value,digits=2){if(!Number.isFinite(value))return '—';const n=Number(value.toFixed(digits));return localNumber(`${n>0?'+':''}${n.toFixed(digits)}`)}
  function criterionLabel(main){return title(main.titleFa,'main',main.id)}

  function setComparisonMode(active){
    comparisonMode=Boolean(active)&&currentRole==='manager';document.documentElement.classList.toggle('managerComparisonMode',comparisonMode);
    const card=document.querySelector('#managerComparisonCard'),entry=document.querySelector('#managerComparisonEntry');if(card)card.hidden=!comparisonMode||currentRole!=='manager';if(entry)entry.hidden=comparisonMode||currentRole!=='manager';
    if(comparisonMode){window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(renderComparison)}
  }

  function ensureComparisonSection(){
    let card=document.querySelector('#managerComparisonCard');if(card)return card;const weightPanel=document.querySelector('#managerWeightPanel');if(!weightPanel)return null;
    const entry=document.createElement('section');entry.className='card managerOnly managerComparisonEntry';entry.id='managerComparisonEntry';entry.hidden=currentRole!=='manager';entry.innerHTML=`<div class="comparisonEntryCopy"><div><h2 id="comparisonEntryTitle"></h2><p id="comparisonEntryHint"></p></div><button id="openComparisonMode" type="button"></button></div>`;weightPanel.insertAdjacentElement('afterend',entry);
    card=document.createElement('section');card.className='card managerOnly managerComparisonCard managerComparisonWorkspace';card.id='managerComparisonCard';card.hidden=true;card.innerHTML=`
      <div class="comparisonWorkspaceHeader"><button class="comparisonBackButton" id="closeComparisonMode" type="button"></button><div class="comparisonWorkspaceTitle"><h2 id="comparisonTitle"></h2><p id="comparisonHint"></p></div><span class="comparisonStatus" id="comparisonStatus"></span></div>
      <div id="comparisonConfigArea"></div><div class="vehicleComparisonBody" id="vehicleComparisonBody"></div>`;entry.insertAdjacentElement('afterend',card);
    entry.querySelector('#openComparisonMode').addEventListener('click',()=>setComparisonMode(true));card.querySelector('#closeComparisonMode').addEventListener('click',()=>setComparisonMode(false));
    return card;
  }

  function setComparisonCount(next){
    const n=Math.max(1,Math.min(MAX_COMPARE,Number(next)||1));
    if(n<compareCount&&comparisonCases.slice(n).some(Boolean)){
      const ok=confirm(locale==='fa'?'با کاهش تعداد، خودروهای بارگذاری‌شده خارج از محدوده جدید حذف می‌شوند. ادامه می‌دهید؟':'Reducing the count will remove loaded vehicles outside the new range. Continue?');if(!ok)return false;
    }
    compareCount=n;comparisonCases=comparisonCases.slice(0,n);while(comparisonCases.length<n)comparisonCases.push(null);persistComparison();renderComparison();return true;
  }

  function parseAssessmentFile(file,index){
    const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(String(reader.result||'')),loaded=parsed?.state||parsed?.payload?.state||parsed?.payload||parsed;if(!loaded||typeof loaded!=='object'||!loaded.scores||typeof loaded.scores!=='object')throw new Error('invalid');comparisonCases[index]={fileName:file.name,savedAt:parsed?.savedAt||parsed?.createdAt||null,state:{metadata:{...(loaded.metadata||{})},scores:{...(loaded.scores||{})}}};persistComparison();renderComparison()}catch(_){alert(locale==='fa'?'فایل JSON ارزیابی قابل خواندن نیست.':'The assessment JSON file could not be read.')}};reader.onerror=()=>alert(locale==='fa'?'خواندن فایل ناموفق بود.':'The file could not be read.');reader.readAsText(file);
  }

  function singleRadar(rows,name){
    const colors=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'],data=rows||[],hasAny=data.some(r=>Number.isFinite(r.avg100));
    if(!hasAny)return `<article class="comparisonRadarPane"><strong>${esc(name)}</strong><div class="comparisonManagerRadar radarChart"><p class="chartEmpty" dir="${locale==='fa'?'rtl':'ltr'}">${locale==='fa'?'پس از ثبت امتیازها، نمودار عنکبوتی نمایش داده می‌شود.':'The radar chart will appear after scores are recorded.'}</p></div></article>`;
    const n=data.length,cx=380,cy=300,R=190,angle=i=>-Math.PI/2+i*2*Math.PI/n,point=(i,radius)=>{const a=angle(i);return[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius]},pts=radius=>data.map((_,i)=>point(i,radius).join(',')).join(' '),impactValue=r=>Number.isFinite(r.weightedVisual)?r.weightedVisual:0,dataPoints=data.map((r,i)=>point(i,impactValue(r)/100*R));
    const wedges=data.map((r,i)=>{const p1=point(i,R),p2=point((i+1)%n,R);return `<polygon points="${cx},${cy} ${p1.join(',')} ${p2.join(',')}" fill="${colors[i%colors.length]}" opacity=".075"/>`}).join('');
    const axes=data.map((r,i)=>{const a=angle(i),ux=Math.cos(a),uy=Math.sin(a),[x,y]=point(i,R),[lx,ly]=point(i,R+72),[vx,vy]=dataPoints[i],label=title(r.main.titleFa,'main',r.main.id),words=label.split(/\s+/),cut=Math.ceil(words.length/2),lines=words.length>3?[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]:[label],impact=impactValue(r),value=Number.isFinite(r.avg100)?fmt(impact):'—',valueRadius=Math.max(30,impact/100*R+18),[scoreX,scoreY]=point(i,valueRadius),anchor=ux>.28?'start':ux<-.28?'end':'middle',baseline=uy>.55?'hanging':uy<-.55?'auto':'middle',circle=Number.isFinite(r.avg100)||r.weight<=0?`<circle cx="${vx}" cy="${vy}" r="${impact<=0?3.8:5.5}" fill="${colors[i%colors.length]}" stroke="#fff" stroke-width="2"/>`:'',valueText=impact>0?`<text x="${scoreX}" y="${scoreY}" text-anchor="${anchor}" dominant-baseline="${baseline}" class="radarValue" fill="${colors[i%colors.length]}">${value}</text>`:'';return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:${colors[i%colors.length]}88"/>${circle}${valueText}<text x="${lx}" y="${ly}" fill="${colors[i%colors.length]}">${lines.map((line,j)=>`<tspan x="${lx}" dy="${j?15:0}">${esc(line)}</tspan>`).join('')}</text>`}).join('');
    return `<article class="comparisonRadarPane"><strong>${esc(name)}</strong><div class="comparisonManagerRadar radarChart"><svg viewBox="0 0 760 600" role="img" aria-label="${locale==='fa'?'نمودار عنکبوتی وزن‌دار شاخص‌ها از ۱۰۰':'Weighted criteria radar chart out of 100'}">${wedges}${[.2,.4,.6,.8,1].map(x=>`<polygon points="${pts(R*x)}" class="radarGrid"/>`).join('')}${axes}<polygon points="${dataPoints.map(p=>p.join(',')).join(' ')}" class="radarData"/></svg></div></article>`;
  }

  function renderConfig(card){
    const root=card.querySelector('#comparisonConfigArea'),fa=locale==='fa';if(!root)return;
    if(!compareCount){root.innerHTML=`<section class="comparisonCountPrompt"><div><h3>${fa?'چند خودرو با خودروی فعلی مقایسه شود؟':'How many vehicles should be compared with the current vehicle?'}</h3><p>${fa?'تعداد خودروهای مقایسه‌ای را مشخص کنید؛ سپس برای هر خودرو یک فایل JSON بارگذاری می‌شود.':'Choose the number of comparison vehicles, then load one JSON assessment for each vehicle.'}</p></div><label><span>${fa?'تعداد خودروهای مقایسه‌ای':'Comparison vehicles'}</span><select id="comparisonVehicleCount">${Array.from({length:MAX_COMPARE},(_,i)=>`<option value="${i+1}">${localNumber(i+1)}</option>`).join('')}</select></label><button id="applyComparisonCount" type="button">${fa?'ادامه و بارگذاری فایل‌ها':'Continue to File Uploads'}</button></section>`;root.querySelector('#applyComparisonCount').onclick=()=>setComparisonCount(root.querySelector('#comparisonVehicleCount').value);return}
    const loaded=comparisonCases.filter(Boolean).length;
    root.innerHTML=`<div class="comparisonCountToolbar"><div><strong>${fa?'تعداد خودروهای مقایسه‌ای':'Comparison vehicles'}: ${localNumber(compareCount)}</strong><span>${fa?`${localNumber(loaded)} فایل بارگذاری شده`:`${loaded} file${loaded===1?'':'s'} loaded`}</span></div><label><span>${fa?'تغییر تعداد':'Change count'}</span><select id="comparisonVehicleCount">${Array.from({length:MAX_COMPARE},(_,i)=>`<option value="${i+1}" ${i+1===compareCount?'selected':''}>${localNumber(i+1)}</option>`).join('')}</select></label><button id="applyComparisonCount" type="button">${fa?'اعمال':'Apply'}</button></div><div class="multiComparisonUploadGrid">${Array.from({length:compareCount},(_,index)=>{const item=comparisonCases[index],name=item?vehicleLabel(item.state,fa?`خودروی مقایسه‌ای ${localNumber(index+1)}`:`Comparison Vehicle ${index+1}`):'';return `<article class="comparisonUploadSlot ${item?'loaded':''}"><div><small>${fa?'خودروی مقایسه‌ای':'Comparison Vehicle'} ${localNumber(index+1)}</small><strong>${item?esc(name):(fa?'فایلی بارگذاری نشده':'No file loaded')}</strong>${item?`<span dir="ltr">${esc(item.fileName||'')}</span>`:''}</div><div class="comparisonSlotActions"><label class="comparisonUploadButton">${item?(fa?'تعویض فایل':'Replace File'):(fa?'بارگذاری JSON':'Load JSON')}<input data-comparison-file="${index}" type="file" accept="application/json,.json" hidden></label><button class="comparisonRemoveButton" data-remove-comparison="${index}" type="button" ${item?'':'disabled'}>${fa?'حذف':'Remove'}</button></div></article>`}).join('')}</div>`;
    root.querySelector('#applyComparisonCount').onclick=()=>setComparisonCount(root.querySelector('#comparisonVehicleCount').value);
    root.querySelectorAll('[data-comparison-file]').forEach(input=>input.addEventListener('change',e=>{const file=e.target.files?.[0];if(file)parseAssessmentFile(file,Number(e.target.dataset.comparisonFile));e.target.value=''}));
    root.querySelectorAll('[data-remove-comparison]').forEach(btn=>btn.addEventListener('click',()=>{const index=Number(btn.dataset.removeComparison);comparisonCases[index]=null;persistComparison();renderComparison()}));
  }

  function renderComparison(){
    const card=ensureComparisonSection(),entry=document.querySelector('#managerComparisonEntry');if(!card||!entry)return;const fa=locale==='fa',set=(root,sel,text)=>{const el=root.querySelector(sel);if(el)el.textContent=text};
    set(entry,'#comparisonEntryTitle',fa?'مقایسه خودروها':'Vehicle Comparison');set(entry,'#comparisonEntryHint',fa?'ارزیابی خودروی فعلی را هم‌زمان با یک یا چند خودروی دیگر مقایسه کنید.':'Compare the current assessment with one or more other vehicles.');set(entry,'#openComparisonMode',fa?'ورود به بخش مقایسه':'Open Comparison');
    card.hidden=!comparisonMode||currentRole!=='manager';entry.hidden=comparisonMode||currentRole!=='manager';set(card,'#closeComparisonMode',fa?'بازگشت به داشبورد مدیریت':'Back to Management Dashboard');set(card,'#comparisonTitle',fa?'مقایسه چندخودرویی ارزیابی‌ها':'Multi-Vehicle Assessment Comparison');set(card,'#comparisonHint',fa?'ابتدا تعداد خودروهای مقایسه‌ای را مشخص کنید، سپس فایل JSON هر خودرو را جداگانه بارگذاری کنید.':'Choose how many vehicles to compare, then load each vehicle assessment JSON separately.');
    renderConfig(card);
    const status=card.querySelector('#comparisonStatus'),body=card.querySelector('#vehicleComparisonBody'),loadedItems=comparisonCases.map((item,index)=>item?{item,index}:null).filter(Boolean);if(status)status.textContent=!compareCount?(fa?'انتخاب تعداد':'Choose count'):(fa?`${localNumber(loadedItems.length)} از ${localNumber(compareCount)} بارگذاری شده`:`${loadedItems.length} of ${compareCount} loaded`);
    if(!compareCount){if(body)body.innerHTML='';return}
    if(!loadedItems.length){if(body)body.innerHTML=`<div class="comparisonEmpty comparisonModeEmpty"><strong>${fa?'هنوز هیچ خودروی مقایسه‌ای بارگذاری نشده است.':'No comparison vehicle has been loaded yet.'}</strong><span>${fa?'از بالا فایل JSON هر خودرو را بارگذاری کنید.':'Load each vehicle JSON from the slots above.'}</span></div>`;return}
    const current={metadata:state.metadata||{},scores:state.scores||{}},allCases=[{state:current,index:-1},...loadedItems.map(x=>({state:x.item.state,index:x.index}))],metrics=allCases.map(x=>caseMetrics(x.state)),names=allCases.map((x,i)=>vehicleLabel(x.state,i===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?`خودروی ${localNumber(i+1)}`:`Vehicle ${i+1}`)));
    const scoreCards=metrics.map((m,i)=>`<article><small>${i===0?(fa?'خودروی فعلی':'Current Vehicle'):(fa?'خودروی مقایسه‌ای':'Comparison Vehicle')}</small><strong>${esc(names[i])}</strong><b>${Number.isFinite(m.final100)?fmt(m.final100):'—'} <em>/ ${localNumber(100)}</em></b><span>${fa?'تکمیل':'Completion'}: ${localNumber(m.completion)}٪</span>${i?`<span class="comparisonCardDiff ${Number.isFinite(m.final100)&&Number.isFinite(metrics[0].final100)?(m.final100-metrics[0].final100>0?'positive':m.final100-metrics[0].final100<0?'negative':'equal'):''}" dir="ltr">Δ ${signed(Number.isFinite(m.final100)&&Number.isFinite(metrics[0].final100)?m.final100-metrics[0].final100:NaN)}</span>`:''}</article>`).join('');
    const radars=`<div class="comparisonChartCard comparisonRadarPairCard"><div class="comparisonChartHeader"><div><h3>${fa?'نمودارهای عنکبوتی مقایسه‌ای':'Comparative Radar Charts'}</h3><p>${fa?'هر خودرو با منطق و رنگ‌بندی نمودار مدیریت نمایش داده می‌شود.':'Each vehicle uses the management radar logic and criterion color scheme.'}</p></div></div><div class="comparisonRadarPair multiRadarGrid">${metrics.map((m,i)=>singleRadar(m.rows,names[i])).join('')}</div></div>`;
    const accent=['#2463a5','#b54d66','#128778','#d58a24','#7454b8','#d9673a','#3e8c47','#ad5f99','#2c7d9a','#96733c','#5475b5','#b85c48','#4b9a91','#8f5c6b','#527e50'];
    const grid=`58px 72px minmax(250px,1.55fr) repeat(${metrics.length},minmax(145px,.78fr))`,minWidth=500+metrics.length*155;
    const head=`<div class="comparisonHead managementStyleComparisonHead multiVehicleComparisonHead" style="grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span>${fa?'ردیف':'No.'}</span><span>${fa?'آیکون':'Icon'}</span><strong>${fa?'شاخص':'Criterion'}</strong>${names.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`;
    const tableRows=metrics[0].rows.map((r,rowIndex)=>`<article class="comparisonRow managementStyleComparisonRow multiVehicleComparisonRow" style="--row-accent:${accent[rowIndex%accent.length]};grid-template-columns:${grid}!important;min-width:${minWidth}px!important"><span class="comparisonRowNumber">${localNumber(rowIndex+1)}</span><span class="comparisonRowIcon">${criterionIconForMain(r.main)}</span><strong class="comparisonCriterion">${criterionLabel(r.main)}</strong>${metrics.map((m,i)=>{const value=m.rows[rowIndex]?.avg,diff=i&&Number.isFinite(value)&&Number.isFinite(metrics[0].rows[rowIndex]?.avg)?value-metrics[0].rows[rowIndex].avg:NaN;return `<span class="comparisonVehicleScore multiVehicleScore"><b>${Number.isFinite(value)?fmt(value):'—'}</b>${i?`<small class="${Number.isFinite(diff)?(diff>0?'positive':diff<0?'negative':'equal'):''}" dir="ltr">${signed(diff)}</small>`:''}</span>`}).join('')}</article>`).join('');
    body.innerHTML=`<div class="comparisonScoreGrid multiComparisonScoreGrid">${scoreCards}</div><div class="comparisonChartsGrid comparisonRadarOnlyGrid">${radars}</div><div class="comparisonTable managementStyleComparisonTable multiVehicleComparisonTable">${head}${tableRows}</div>`;
  }

  const previousManagerRefresh=window.managerRefresh||managerRefresh;managerRefresh=function(...args){const result=previousManagerRefresh(...args);renderComparison();return result};window.managerRefresh=managerRefresh;
  const previousSetLocale=setLocale;setLocale=function(next){const result=previousSetLocale(next);renderComparison();return result};
  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(()=>{if(currentRole!=='manager')setComparisonMode(false);renderComparison()}));
  ensureComparisonSection();renderComparison();
})();

;
/* v42.js */
/* v42 — authenticated entry, complete restore refresh, comparison presentation refinements */
(()=>{
  const AUTH_KEY='bamco-authenticated-user';
  const USER_ROLES={
    'ghaemizadeh@bamco.ir':['evaluator','expert','manager'],
    'a.zare@bamco.ir':['evaluator','expert','manager'],
    'tanhayian@bamco.ir':['evaluator','expert','manager'],
    'hosseinzadeh@bamco.ir':['manager']
  };
  const USERS=new Set(Object.keys(USER_ROLES));
  const PASSWORD='123456';
  window.BAMCO_USER_ROLES=USER_ROLES;
  window.BAMCO_AUTH_USERS=Object.keys(USER_ROLES);

  const authForm=document.querySelector('#entryAuthForm');
  const usernameInput=document.querySelector('#authUsername');
  const passwordInput=document.querySelector('#authPassword');
  const authMessage=document.querySelector('#entryAuthMessage');
  const roleChoices=document.querySelector('#entryRoleChoices');
  const authenticatedBar=document.querySelector('#entryAuthenticatedBar');
  const authenticatedUser=document.querySelector('#entryAuthenticatedUser');
  const signOutButton=document.querySelector('#entrySignOutButton');

  function readUser(){
    try{
      const value=sessionStorage.getItem(AUTH_KEY)||'';
      return USERS.has(value)?value:'';
    }catch(_){return ''}
  }

  function setAuthUser(value){
    const user=String(value||'').trim().toLowerCase();
    window.BAMCO_AUTH_USER=USERS.has(user)?user:null;
    try{
      if(window.BAMCO_AUTH_USER)sessionStorage.setItem(AUTH_KEY,window.BAMCO_AUTH_USER);
      else sessionStorage.removeItem(AUTH_KEY);
    }catch(_){}
    renderAuthState();
  }

  function authCopy(){
    const fa=locale==='fa';
    const prompt=document.querySelector('#entryAuthPrompt');
    const userLabel=document.querySelector('#authUsernameLabel');
    const passwordLabel=document.querySelector('#authPasswordLabel');
    const loginButton=document.querySelector('#authLoginButton');
    const allowedRoles=USER_ROLES[window.BAMCO_AUTH_USER]||[];
    if(prompt)prompt.textContent=window.BAMCO_AUTH_USER
      ? (allowedRoles.length===1
          ? (fa?'پنل مجاز حساب خود را برای ادامه انتخاب کنید.':'Choose the panel available to this account.')
          : (fa?'یکی از پنل‌های مجاز را برای ادامه انتخاب کنید.':'Choose one of your available panels to continue.'))
      : (fa?'برای ورود، نام کاربری و رمز عبور را وارد کنید.':'Enter your username and password to sign in.');
    if(userLabel)userLabel.textContent=fa?'نام کاربری':'Username';
    if(passwordLabel)passwordLabel.textContent=fa?'رمز عبور':'Password';
    if(loginButton)loginButton.textContent=fa?'ورود':'Sign in';
    if(signOutButton)signOutButton.textContent=fa?'خروج از حساب':'Sign out';
    if(authenticatedUser&&window.BAMCO_AUTH_USER){
      authenticatedUser.innerHTML=fa
        ? `<span class="authSignedLabel" dir="rtl">کاربر واردشده:</span> <bdi class="authSignedEmail" dir="ltr">${window.BAMCO_AUTH_USER}</bdi>`
        : `<span class="authSignedLabel" dir="ltr">Signed in as:</span> <bdi class="authSignedEmail" dir="ltr">${window.BAMCO_AUTH_USER}</bdi>`;
    }
    if(usernameInput)usernameInput.placeholder='name@bamco.ir';
  }

  function renderRoleAccess(){
    const roles=USER_ROLES[window.BAMCO_AUTH_USER]||[];
    document.querySelectorAll('#entryRoleChoices [data-role]').forEach(button=>{
      const allowed=roles.includes(button.dataset.role);
      button.hidden=!allowed;
      button.disabled=!allowed;
      button.setAttribute('aria-hidden',allowed?'false':'true');
    });
  }

  function renderAuthState(){
    const loggedIn=!!window.BAMCO_AUTH_USER;
    const page=currentPage();
    const entryScreen=document.querySelector('#entryScreen');
    entryScreen?.classList.toggle('authenticatedStep',loggedIn&&page==='roles.html');
    if(authForm)authForm.hidden=loggedIn;
    if(roleChoices)roleChoices.hidden=!loggedIn;
    if(authenticatedBar)authenticatedBar.hidden=!loggedIn;
    if(authMessage&&!loggedIn)authMessage.textContent='';
    renderRoleAccess();
    authCopy();
    if(window.BAMCO_REFRESH_EDIT_PERMISSION_UI)window.BAMCO_REFRESH_EDIT_PERMISSION_UI();
  }

  window.BAMCO_AUTH_USER=readUser()||null;
  renderAuthState();

  authForm?.addEventListener('submit',event=>{
    event.preventDefault();
    const username=String(usernameInput?.value||'').trim().toLowerCase();
    const password=String(passwordInput?.value||'');
    if(USERS.has(username)&&password===PASSWORD){
      if(authMessage){authMessage.className='entryAuthMessage success';authMessage.textContent=locale==='fa'?'ورود موفق بود. پنل موردنظر را انتخاب کنید.':'Signed in. Choose a panel.';}
      if(passwordInput)passwordInput.value='';
      setAuthUser(username);
      window.location.assign(appRoute('roles'));
      return;
    }
    if(authMessage){authMessage.className='entryAuthMessage error';authMessage.textContent=locale==='fa'?'نام کاربری یا رمز عبور نادرست است.':'Incorrect username or password.';}
    passwordInput?.focus();
    if(passwordInput)passwordInput.select();
  });

  signOutButton?.addEventListener('click',()=>{
    setAuthUser('');
    if(usernameInput)usernameInput.value='';
    if(passwordInput)passwordInput.value='';
    window.location.replace(appRoute('login'));
  });

  /* Defense in depth: a role cannot be entered before a valid local sign-in. */
  document.querySelectorAll('#entryRoleChoices button[data-role]').forEach(button=>{
    button.addEventListener('click',event=>{
      const user=window.BAMCO_AUTH_USER;
      const allowed=user&&(USER_ROLES[user]||[]).includes(button.dataset.role);
      if(allowed)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(authMessage){
        authMessage.className='entryAuthMessage error';
        authMessage.textContent=!user
          ?(locale==='fa'?'ابتدا وارد حساب کاربری شوید.':'Sign in first.')
          :(locale==='fa'?'این حساب به این پنل دسترسی ندارد.':'This account does not have access to this panel.');
      }
      if(!user)usernameInput?.focus();
    },true);
  });

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const result=previousSetLocale(next);
    authCopy();
    return result;
  };

  /* Login, role selection and the application are separate document navigations. */
  document.querySelector('#switchRoleButton')?.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(appRoute('roles'));
  },true);
  const routePage=currentPage();
  const routeRole=routePage.replace(/\.html$/,'');
  const appPages=['evaluator','expert','manager'];
  const allowedRoles=USER_ROLES[window.BAMCO_AUTH_USER]||[];
  if(!window.BAMCO_AUTH_USER&&(routePage==='roles.html'||appPages.includes(routeRole))){
    window.location.replace(appRoute('login'));
  }else if(window.BAMCO_AUTH_USER&&(routePage==='index.html'||routePage==='app.html')){
    window.location.replace(appRoute('roles'));
  }else if(appPages.includes(routeRole)){
    if(allowedRoles.includes(routeRole))enter(routeRole);
    else window.location.replace(appRoute('roles'));
  }

  /* A full-case restore must visibly restore final comments and revision history, not only state. */
  window.addEventListener('bamco:case-restored',()=>{
    document.querySelectorAll('[data-final-comment]').forEach(input=>{
      const role=input.dataset.finalComment;
      input.value=state.finalComments?.[role]||'';
    });
    try{setLocale(locale)}catch(_){
      if(typeof update==='function')update();
    }
  });

  /* Exact legacy artifact requested to be absent from the comparison workspace. */
  function scrubLegacyComparisonArtifact(){
    const root=document.querySelector('#managerComparisonCard');
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(node.nodeValue?.includes('465360.262'))node.nodeValue=node.nodeValue.replace(/465360\.262/g,'');
    });
  }
  const comparisonRoot=document.querySelector('#managerComparisonCard');
  if(comparisonRoot){
    scrubLegacyComparisonArtifact();
    new MutationObserver(scrubLegacyComparisonArtifact).observe(comparisonRoot,{subtree:true,childList:true,characterData:true});
  }
})();

;
/* v45.js */
/* v45 — locked evaluator experience hardening */
(()=>{
  function evaluatorEditAuthorized(){
    try{return currentRole==='evaluator' && !!window.BAMCO_CAN_EDIT_CASE?.()}catch(_){return false}
  }

  function enforceEvaluatorExperienceLock(){
    const select=document.querySelector('[data-experience-select="evaluator"]');
    const other=document.querySelector('[data-experience-other="evaluator"]');
    if(!select&&!other)return;
    const locked=!!state?.workflow?.locked;
    const canEdit=!locked || evaluatorEditAuthorized();
    if(select){
      select.disabled=!canEdit;
      select.setAttribute('aria-disabled',canEdit?'false':'true');
    }
    if(other){
      other.disabled=!canEdit;
      other.setAttribute('aria-disabled',canEdit?'false':'true');
    }
  }

  /* Re-apply after every metadata render, language switch, role change and permission refresh. */
  if(typeof renderMetadata==='function'){
    const previousRenderMetadata=renderMetadata;
    renderMetadata=function(...args){
      const out=previousRenderMetadata(...args);
      enforceEvaluatorExperienceLock();
      return out;
    };
  }

  const previousSetLocale=setLocale;
  setLocale=function(next){
    const out=previousSetLocale(next);
    enforceEvaluatorExperienceLock();
    return out;
  };

  document.querySelector('#switchRoleButton')?.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorExperienceLock));
  document.querySelectorAll('#entryRoleChoices button[data-role]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(enforceEvaluatorExperienceLock)));

  /* Capture-phase guard: even scripted or keyboard changes cannot mutate this field while locked. */
  document.addEventListener('change',event=>{
    if(!event.target?.matches?.('[data-experience-select="evaluator"]'))return;
    if(!state?.workflow?.locked || evaluatorEditAuthorized())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderMetadata();
  },true);
  document.addEventListener('input',event=>{
    if(!event.target?.matches?.('[data-experience-other="evaluator"]'))return;
    if(!state?.workflow?.locked || evaluatorEditAuthorized())return;
    event.preventDefault();
    event.stopImmediatePropagation();
    renderMetadata();
  },true);

  const observer=new MutationObserver(()=>enforceEvaluatorExperienceLock());
  observer.observe(document.body,{subtree:true,childList:true});
  enforceEvaluatorExperienceLock();
})();
