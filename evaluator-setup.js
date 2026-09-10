/* Each evaluator entry starts with fresh choices, separate from assessment state. */
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
  const valid=value=>fields.every(([id,,,options])=>options.includes(value[id]));
  const roleLink=document.querySelector('[data-auth-page="roles"] [data-role="evaluator"]');
  if(!roleLink)return;
  try{sessionStorage.removeItem(`bamco-evaluator-choices:${sessionStorage.getItem('bamco-authenticated-user')||''}`)}catch(_){}
  const dialog=document.createElement('dialog');
  dialog.id='evaluatorSetup';dialog.className='evaluatorSetup';
  dialog.setAttribute('aria-labelledby','evaluatorSetupTitle');
  const form=document.createElement('form');
  form.innerHTML='<header><h2 id="evaluatorSetupTitle"></h2><button type="button" class="setupClose">×</button></header><div class="setupFields"></div><p class="setupError" role="alert"></p><footer><button type="button" class="setupCancel secondaryButton"></button><button type="submit" class="setupContinue"></button></footer>';
  dialog.append(form);document.body.append(dialog);
  const grid=form.querySelector('.setupFields');
  fields.forEach(([id,,,options])=>{
    const label=document.createElement('label');label.htmlFor=`setup-${id}`;
    const caption=document.createElement('span');caption.dataset.setupLabel=id;
    const select=document.createElement('select');select.id=label.htmlFor;select.name=id;select.required=true;
    select.add(new Option('',''));
    options.forEach(value=>{const option=new Option(value,value);option.lang='en';select.add(option)});
    select.addEventListener('change',()=>localizeSelect(select));
    label.append(caption,select);grid.append(label);
  });
  let opener=null,entering=false,prefetched=false;
  function prepareEvaluatorPage(){
    if(prefetched)return;prefetched=true;
    // Fetch resources only; never run the assessment or its storage initialization here.
    const resources=[
      'evaluator.html?v=85','styles-1.css?v=70','styles-2.css?v=70',
      'styles-3.css?v=70','styles-ui.css?v=70','panel-refinements.css?v=83',
      'scripts-1.js?v=70','scripts-2.js?v=85','scripts-3.js?v=70',
      'scripts-4.js?v=70','scripts-5.js?v=70','scripts-6.js?v=85',
      'scripts-7-base.js?v=81','scripts-8.js?v=81','scripts-9.js?v=70',
      'scripts-10.js?v=70','scripts-11.js?v=70','scripts-12.js?v=70'
    ];
    resources.forEach(href=>{const link=document.createElement('link');link.rel='prefetch';link.href=href;document.head.append(link)});
  }
  function localizeSelect(select){
    select.dir=fa()?'rtl':'ltr';
    select.lang=fa()&&!select.value?'fa':'en';
    select.options[0].textContent=copy('انتخاب کنید','Select');
    select.options[0].lang=fa()?'fa':'en';
    Array.from(select.options).forEach(option=>{option.dir=fa()?'rtl':'ltr'});
  }
  function translate(){
    form.querySelector('h2').textContent=copy('انتخاب مشخصات خودرو','Select vehicle details');
    fields.forEach(([id,persian,english])=>{
      form.querySelector(`[data-setup-label="${id}"]`).textContent=copy(persian,english);
      const select=form.elements.namedItem(id);
      localizeSelect(select);
    });
    form.querySelector('.setupClose').setAttribute('aria-label',copy('بستن','Close'));
    form.querySelector('.setupCancel').textContent=copy('انصراف','Cancel');
    form.querySelector('.setupContinue').textContent=copy('انتخاب و ورود ارزیاب','Select and enter evaluator panel');
  }
  function resetChoices(){
    entering=false;
    form.reset();
    form.querySelector('.setupContinue').disabled=false;
    form.querySelector('.setupError').textContent='';translate();
  }
  function open(){
    opener=document.activeElement;resetChoices();dialog.showModal();
    prepareEvaluatorPage();
  }
  function close(){if(!entering)dialog.close()}
  form.querySelector('.setupClose').addEventListener('click',close);
  form.querySelector('.setupCancel').addEventListener('click',close);
  dialog.addEventListener('close',()=>{if(!entering)opener?.focus({preventScroll:true})});
  dialog.addEventListener('cancel',event=>{if(entering)event.preventDefault()});
  roleLink.addEventListener('click',event=>{event.preventDefault();open()});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(entering)return;
    const choices=Object.fromEntries(fields.map(([id])=>[id,form.elements.namedItem(id).value]));
    if(!valid(choices)||!form.reportValidity())return;
    entering=true;form.querySelector('.setupContinue').disabled=true;
    // Navigate directly, keeping this dialog in place until the next document is ready.
    location.assign(new URL('evaluator.html?v=85',location.href).href);
  });
  window.addEventListener('pageshow',()=>{resetChoices();if(dialog.open)dialog.close()});
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
