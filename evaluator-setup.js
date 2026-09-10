/* These session-only choices are deliberately separate from assessment state. */
(()=>{
  'use strict';
  const fields=[
    ['vehicleClass','رده خودروی مجاز','Permitted vehicle class',['M1','N1']],
    ['bodyType','نوع بدنه','Body type',['Sedan','SUV','CUV','Pickup','Station']],
    ['cabinType','نوع کابین','Cabin type',['Single','Extra','Double']],
    ['seatRows','تعداد ردیف صندلی','Seat rows',['1','2','3']],
    ['powertrain','قوای محرکه مجاز','Permitted powertrain',['ICE','HEV','PHEV','BEV','EREV']],
    ['transmission','گیربکس مجاز','Permitted transmission',['Manual','Automatic','Single-Speed']],
    ['driveSystem','سیستم محرک مجاز','Permitted drive system',['FWD','RWD','AWD','4WD']]
  ];
  const vehicles=['X3','SR6','X5','J7','T8','SR3','EJ7+','EJ7','Eagle','A5','T9','J4','K7','S3','J5','J3','S5'];
  fields.push(['referenceOne','خودروی مرجع اول','First reference vehicle',vehicles],['referenceTwo','خودروی مرجع دوم','Second reference vehicle',vehicles]);
  const fa=()=>document.documentElement.lang!=='en';
  const copy=(persian,english)=>fa()?persian:english;
  const key=()=>`bamco-evaluator-choices:${sessionStorage.getItem('bamco-authenticated-user')||''}`;
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(key())||'{}')}catch(_){return {}}};
  const valid=value=>fields.every(([id,,,options])=>options.includes(value[id]));
  const roleLink=document.querySelector('[data-auth-page="roles"] [data-role="evaluator"]');
  const isEvaluator=/\/evaluator\.html$/.test(location.pathname);
  if(!roleLink&&!isEvaluator)return;
  const dialog=document.createElement('dialog');
  dialog.id='evaluatorSetup';dialog.className='evaluatorSetup';
  dialog.setAttribute('aria-labelledby','evaluatorSetupTitle');
  dialog.setAttribute('aria-describedby','evaluatorSetupHint');
  const form=document.createElement('form');
  form.innerHTML='<header><h2 id="evaluatorSetupTitle"></h2><button type="button" class="setupClose">×</button></header><p id="evaluatorSetupHint"></p><div class="setupFields"></div><p class="setupError" role="alert"></p><footer><button type="button" class="setupCancel secondaryButton"></button><button type="submit" class="setupContinue"></button></footer>';
  dialog.append(form);document.body.append(dialog);
  const grid=form.querySelector('.setupFields');
  fields.forEach(([id,,,options])=>{
    const label=document.createElement('label');label.htmlFor=`setup-${id}`;
    const caption=document.createElement('span');caption.dataset.setupLabel=id;
    const select=document.createElement('select');select.id=label.htmlFor;select.name=id;select.required=true;select.dir='ltr';select.lang='en';
    select.add(new Option('',''));
    options.forEach(value=>select.add(new Option(value,value)));
    label.append(caption,select);grid.append(label);
  });
  let entryMode=false,opener=null;
  function translate(){
    form.querySelector('h2').textContent=copy('انتخاب مشخصات خودرو','Select vehicle details');
    form.querySelector('#evaluatorSetupHint').textContent=copy('این انتخاب‌ها صرفاً اطلاعاتی هستند و روی امتیازها، وزن‌ها، مقایسه یا تحلیل فنی اثری ندارند.','These choices are informational only and do not affect scores, weights, comparisons, or technical analysis.');
    fields.forEach(([id,persian,english])=>{
      form.querySelector(`[data-setup-label="${id}"]`).textContent=copy(persian,english);
      const select=form.elements.namedItem(id);
      select.options[0].textContent=copy('انتخاب کنید','Select');select.options[0].lang=fa()?'fa':'en';
    });
    form.querySelector('.setupClose').setAttribute('aria-label',copy('بستن','Close'));
    form.querySelector('.setupCancel').textContent=copy('انصراف','Cancel');
    form.querySelector('.setupContinue').textContent=entryMode?copy('انتخاب و ورود ارزیاب','Select and enter evaluator panel'):copy('ثبت انتخاب‌ها','Save choices');
    renderSummary();
  }
  function open(enter){
    entryMode=enter;opener=document.activeElement;
    const saved=read();fields.forEach(([id])=>{form.elements.namedItem(id).value=saved[id]||''});
    form.querySelector('.setupError').textContent='';translate();dialog.showModal();
  }
  function close(){dialog.close();opener?.focus()}
  form.querySelector('.setupClose').addEventListener('click',close);
  form.querySelector('.setupCancel').addEventListener('click',close);
  dialog.addEventListener('close',()=>opener?.focus());
  roleLink?.addEventListener('click',event=>{event.preventDefault();open(true)});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const choices=Object.fromEntries(fields.map(([id])=>[id,form.elements.namedItem(id).value]));
    if(!valid(choices)||!form.reportValidity())return;
    try{sessionStorage.setItem(key(),JSON.stringify(choices))}catch(_){
      form.querySelector('.setupError').textContent=copy('ثبت انتخاب‌ها در این مرورگر ممکن نیست. دسترسی ذخیره‌سازی را فعال کنید.','Choices could not be saved. Enable browser storage.');return;
    }
    close();renderSummary();
    if(entryMode)location.assign(new URL('evaluator.html?v=80',location.href).href);
  });
  let summary;
  if(isEvaluator){
    summary=document.createElement('section');summary.className='card evaluatorOnly evaluatorChoiceSummary';
    summary.innerHTML='<div><strong></strong><p></p></div><button type="button"></button>';
    document.querySelector('.metadata')?.insertAdjacentElement('afterend',summary);
    summary.querySelector('button').addEventListener('click',()=>open(false));
  }
  function renderSummary(){
    if(!summary)return;
    summary.querySelector('strong').textContent=copy('مشخصات انتخابی خودرو','Selected vehicle details');
    const saved=read();const p=summary.querySelector('p');p.replaceChildren();
    fields.forEach(([id,persian,english],index)=>{
      if(index)p.append(' · ');
      p.append(copy(persian,english)+': ');
      const value=document.createElement('bdi');value.lang='en';value.dir='ltr';value.textContent=saved[id]||'—';p.append(value);
    });
    summary.querySelector('button').textContent=copy('انتخاب مشخصات','Select details');
  }
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
