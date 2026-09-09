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

  if(page==='roles'){
    const user=readUser();
    if(!user){window.location.replace(base('index.html?v=71'));return}
    document.querySelector('#signedInUser').textContent=user;
    const allowed=USER_ROLES[user]||[];
    document.querySelectorAll('[data-role]').forEach(link=>{link.hidden=!allowed.includes(link.dataset.role)});
    document.querySelector('#signOutButton').addEventListener('click',()=>{
      try{sessionStorage.removeItem(AUTH_KEY)}catch(_){}
      window.location.replace(base('index.html?v=71'));
    });
    return;
  }

  if(readUser()){window.location.replace(base('roles.html?v=71'));return}
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
  let fa=true;
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
  document.querySelector('#languageButton').addEventListener('click',()=>{
    fa=!fa;document.documentElement.lang=fa?'fa':'en';document.documentElement.dir=fa?'rtl':'ltr';
    document.querySelector('#languageButton').textContent=fa?'English':'فارسی';
    document.querySelector('#brandName').textContent=fa?'خودروسازان بم':'BAM Automotive Company';
    document.querySelector('#loginTitle').textContent=fa?'سامانه ارزیابی خودرو':'Vehicle Assessment System';
    document.querySelector('#loginIntro').textContent=fa?'برای ورود، نام کاربری و رمز عبور را وارد کنید.':'Enter your username and password to sign in.';
    document.querySelector('#usernameLabel').textContent=fa?'نام کاربری':'Username';
    document.querySelector('#passwordLabel').textContent=fa?'رمز عبور':'Password';
    answer.placeholder=fa?'پاسخ کپچا':'Captcha answer';loginButton.textContent=fa?'ورود':'Sign in';validateCaptcha();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const user=String(username.value||'').trim().toLowerCase();
    if(Number(answer.value)!==expected){validateCaptcha();return}
    if(users.has(user)&&password.value===PASSWORD){
      try{sessionStorage.setItem(AUTH_KEY,user)}catch(_){}
      loginMessage.className='message success';loginMessage.textContent=fa?'ورود موفق بود.':'Signed in.';
      window.location.replace(base('roles.html?v=71'));return;
    }
    loginMessage.className='message error';loginMessage.textContent=fa?'نام کاربری یا رمز عبور نادرست است.':'Incorrect username or password.';password.focus();password.select();makeCaptcha();
  });
  makeCaptcha();
})();
