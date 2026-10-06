const authLoading=document.querySelector('[data-auth-loading]');
const authGuest=document.querySelector('[data-auth-guest]');
const authUser=document.querySelector('[data-auth-user]');
const authMessage=document.querySelector('[data-auth-message]');
const authForm=document.querySelector('[data-email-auth]');
let authMode='login';

function setAuthMessage(message,type='info'){authMessage.textContent=message;authMessage.dataset.type=type}
function displayAccount(session){
  authLoading.hidden=true;
  if(!session){authGuest.hidden=false;authUser.hidden=true;return}
  authGuest.hidden=true;authUser.hidden=false;
  const user=session.user;
  const name=user.user_metadata?.full_name||user.user_metadata?.name||user.email?.split('@')[0]||'Cliente EsquiSolar';
  document.querySelector('[data-user-name]').textContent=`Hola, ${name}`;
  document.querySelector('[data-user-email]').textContent=user.email||'Cuenta conectada';
  document.querySelector('[data-user-initial]').textContent=name.trim().charAt(0).toUpperCase()||'E';
}
function setMode(mode){
  authMode=mode;
  document.querySelectorAll('[data-auth-tab]').forEach(button=>{const active=button.dataset.authTab===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  const signingUp=mode==='signup';
  document.querySelector('[data-name-field]').hidden=!signingUp;
  document.querySelector('#account-name').required=signingUp;
  document.querySelector('#account-password').autocomplete=signingUp?'new-password':'current-password';
  document.querySelector('[data-password-help]').textContent=signingUp?'Use al menos 8 caracteres.':'Ingrese su contraseña.';
  document.querySelector('[data-auth-submit]').textContent=signingUp?'Crear mi cuenta':'Ingresar';
  document.querySelector('[data-reset-password]').hidden=signingUp;
  setAuthMessage('');
}
async function signInWithProvider(provider){
  setAuthMessage(`Abriendo ${provider==='google'?'Google':'Facebook'}…`);
  const {error}=await supabaseClient.auth.signInWithOAuth({provider,options:{redirectTo:`${location.origin}/cuenta.html`}});
  if(error)setAuthMessage(`No se pudo iniciar con ${provider==='google'?'Google':'Facebook'}: ${error.message}`,'error');
}
document.querySelectorAll('[data-oauth]').forEach(button=>button.addEventListener('click',()=>signInWithProvider(button.dataset.oauth)));
document.querySelectorAll('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.authTab)));
authForm.addEventListener('submit',async event=>{
  event.preventDefault();const submit=document.querySelector('[data-auth-submit]');const data=new FormData(authForm);submit.disabled=true;submit.textContent='Procesando…';setAuthMessage('');
  try{
    if(authMode==='signup'){
      const {data:result,error}=await supabaseClient.auth.signUp({email:data.get('email').trim(),password:data.get('password'),options:{data:{full_name:data.get('name').trim()},emailRedirectTo:`${location.origin}/cuenta.html`}});
      if(error)throw error;if(result.session)displayAccount(result.session);else setAuthMessage('Cuenta creada. Revise su correo para confirmar el acceso.','success');
    }else{
      const {data:result,error}=await supabaseClient.auth.signInWithPassword({email:data.get('email').trim(),password:data.get('password')});if(error)throw error;displayAccount(result.session);
    }
  }catch(error){setAuthMessage(authMode==='signup'?'No se pudo crear la cuenta. Revise los datos o pruebe con otro correo.':'Correo o contraseña incorrectos.','error')}
  finally{submit.disabled=false;submit.textContent=authMode==='signup'?'Crear mi cuenta':'Ingresar'}
});
document.querySelector('[data-reset-password]').addEventListener('click',async()=>{
  const email=authForm.elements.email.value.trim();if(!email){setAuthMessage('Escriba primero su correo electrónico.','error');authForm.elements.email.focus();return}
  const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/cuenta.html`});setAuthMessage(error?'No se pudo enviar el enlace. Revise el correo.':'Le enviamos un enlace para restablecer su contraseña.',error?'error':'success');
});
document.querySelector('[data-sign-out]').addEventListener('click',async()=>{await supabaseClient.auth.signOut();displayAccount(null);setMode('login')});
supabaseClient.auth.onAuthStateChange((_event,session)=>displayAccount(session));
supabaseClient.auth.getSession().then(({data})=>displayAccount(data.session));
