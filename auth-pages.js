(()=>{
  'use strict';
  const AUTH_KEY='bamco-authenticated-user';
  const USER_ROLES={
    'ghaemizadeh@bamco.ir':['evaluator','expert','manager'],
    'a.zare@bamco.ir':['evaluator','expert','manager'],
    'tanhayian@bamco.ir':['evaluator','expert','manager'],
    'hosseinzadeh@bamco.ir':['manager']
  };
  const PASSWORD='123456';
  const page=document.body.dataset.authPage;
  const users=new Set(Object.keys(USER_ROLES));
  const base=file=>new URL(file,window.location.href).href;
  const readUser=()=>{try{const user=sessionStorage.getItem(AUTH_KEY)||'';return users.has(user)?user:''}catch(_){return ''}};
  const clearLegacyCaches=()=>{
    if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(items=>items.forEach(item=>item.unregister())).catch(()=>{});
    if('caches' in window)caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).catch(()=>{});
  };
  clearLegacyCaches();
  let fa=true;
  try{fa=sessionStorage.getItem('bamco-locale')!=='en'}catch(_){}
  const copy={
    fa:{language:'English',brand:'خودروسازان بم',loginTitle:'سامانه ارزیابی خودرو',loginIntro:'برای ورود، نام کاربری و رمز عبور را وارد کنید.',username:'نام کاربری',password:'رمز عبور',captcha:'پاسخ کپچا',signIn:'ورود',rolesTitle:'انتخاب پنل',rolesIntro:'پنل موردنظر را برای ادامه انتخاب کنید.',signOut:'خروج از حساب',signedIn:'کاربر واردشده:',evaluator:'ورود ارزیاب',evaluatorDesc:'ثبت اطلاعات، چک‌لیست، امتیازها و تصاویر مستند',expert:'ورود خبره',expertDesc:'ثبت اطلاعات تخصصی و تعیین وزن شاخص‌های اصلی',manager:'ورود مدیریت',managerDesc:'مشاهده داشبورد، نتایج و گزارش مدیریتی'},
    en:{language:'Persian',brand:'BAM Automotive Company',loginTitle:'Vehicle Assessment System',loginIntro:'Enter your username and password to sign in.',username:'Username',password:'Password',captcha:'Captcha answer',signIn:'Sign in',rolesTitle:'Choose a Panel',rolesIntro:'Choose an available panel to continue.',signOut:'Sign out',signedIn:'Signed in as:',evaluator:'Evaluator Login',evaluatorDesc:'Record vehicle details, checklist scores, notes, and supporting images',expert:'Expert Login',expertDesc:'Enter expert details and assign weights to the main criteria',manager:'Management Login',managerDesc:'Review the dashboard, assessment results, and management report'}
  };
  const setText=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value};
  const applyLocale=()=>{
    const t=copy[fa?'fa':'en'];
    document.documentElement.lang=fa?'fa':'en';document.documentElement.dir=fa?'rtl':'ltr';
    setText('#languageButton',t.language);const languageButton=document.querySelector('#languageButton');if(languageButton)languageButton.lang='en';setText('#brandName',t.brand);setText('#loginTitle',t.loginTitle);setText('#loginIntro',t.loginIntro);setText('#usernameLabel',t.username);setText('#passwordLabel',t.password);setText('#loginButton',t.signIn);
    const captcha=document.querySelector('#captchaAnswer');
    if(captcha){
      captcha.placeholder=t.captcha;captcha.setAttribute('aria-label',t.captcha);
      captcha.lang=fa?'fa':'en';captcha.dir=fa?'rtl':'ltr';
    }
    const captchaRefresh=document.querySelector('#captchaRefresh');
    if(captchaRefresh)captchaRefresh.setAttribute('aria-label',fa?'کپچای جدید':'New captcha');
    const captchaVerified=document.querySelector('.captchaBox')?.classList.contains('valid');
    setText('#captchaMessage',captchaVerified?(fa?'تأیید شد.':'Verified.'):(fa?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer above.'));
    setText('#rolesTitle',t.rolesTitle);setText('#rolesIntro',t.rolesIntro);setText('#signOutButton',t.signOut);setText('#signedInLabel',t.signedIn);
    setText('#evaluatorTitle',t.evaluator);setText('#evaluatorDesc',t.evaluatorDesc);setText('#expertTitle',t.expert);setText('#expertDesc',t.expertDesc);setText('#managerTitle',t.manager);setText('#managerDesc',t.managerDesc);
  };
  document.querySelector('#languageButton')?.addEventListener('click',()=>{fa=!fa;try{sessionStorage.setItem('bamco-locale',fa?'fa':'en')}catch(_){}applyLocale()});
  applyLocale();

  if(page==='roles'){
    const user=readUser();
    if(!user){window.location.replace(base('index.html?v=74'));return}
    document.querySelector('#signedInUser').textContent=user;
    const allowed=USER_ROLES[user]||[];
    document.querySelectorAll('[data-role]').forEach(link=>{link.hidden=!allowed.includes(link.dataset.role)});
    document.querySelector('#signOutButton').addEventListener('click',()=>{
      try{sessionStorage.removeItem(AUTH_KEY)}catch(_){}
      window.location.replace(base('index.html?v=74'));
    });
    return;
  }

  if(readUser()){window.location.replace(base('roles.html?v=74'));return}
  const form=document.querySelector('#loginForm');
  const username=document.querySelector('#username');
  const password=document.querySelector('#password');
  const answer=document.querySelector('#captchaAnswer');
  const question=document.querySelector('#captchaQuestion');
  const refresh=document.querySelector('#captchaRefresh');
  const captchaBox=document.querySelector('.captchaBox');
  const captchaMessage=document.querySelector('#captchaMessage');
  const loginButton=document.querySelector('#loginButton');
  const loginMessage=document.querySelector('#loginMessage');
  let expected=0;
  const makeCaptcha=()=>{
    const a=Math.floor(Math.random()*8)+2,b=Math.floor(Math.random()*8)+1;
    expected=a+b;question.textContent=`${a} + ${b} = ?`;answer.value='';loginButton.disabled=true;captchaBox.className='captchaBox';captchaMessage.textContent=fa?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer above.';
  };
  const validateCaptcha=()=>{
    const ok=Number(answer.value)===expected;
    loginButton.disabled=!ok;captchaBox.className=`captchaBox ${answer.value?(ok?'valid':'invalid'):''}`.trim();
    captchaMessage.textContent=ok?(fa?'تأیید شد.':'Verified.'):(fa?'پاسخ عبارت بالا را وارد کنید.':'Enter the answer above.');
  };
  answer.addEventListener('input',validateCaptcha);refresh.addEventListener('click',makeCaptcha);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const user=String(username.value||'').trim().toLowerCase();
    if(Number(answer.value)!==expected){validateCaptcha();return}
    if(users.has(user)&&password.value===PASSWORD){
      try{sessionStorage.setItem(AUTH_KEY,user)}catch(_){}
      loginMessage.className='message success';loginMessage.textContent=fa?'ورود موفق بود.':'Signed in.';
      window.location.replace(base('roles.html?v=74'));return;
    }
    loginMessage.className='message error';loginMessage.textContent=fa?'نام کاربری یا رمز عبور نادرست است.':'Incorrect username or password.';password.focus();password.select();makeCaptcha();
  });
  makeCaptcha();
})();
