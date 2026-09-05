const CUSTOM_PRODUCTS_KEY='esquiSolarCustomProducts';
const ADMIN_PASSWORD_KEY='esquiSolarAdminPassword';
const ADMIN_SESSION_KEY='esquiSolarAdminSession';
const $=selector=>document.querySelector(selector);

async function hashPassword(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('')}
function customProducts(){try{return JSON.parse(localStorage.getItem(CUSTOM_PRODUCTS_KEY)||'[]')}catch{return[]}}
function saveCustomProducts(items){localStorage.setItem(CUSTOM_PRODUCTS_KEY,JSON.stringify(items))}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function showWorkspace(){ $('[data-admin-login]').hidden=true;$('[data-admin-workspace]').hidden=false;renderCustomList() }
function configureLogin(){const exists=Boolean(localStorage.getItem(ADMIN_PASSWORD_KEY));$('[data-login-title]').textContent=exists?'Administrar productos':'Crear clave privada';$('[data-login-help]').textContent=exists?'Ingrese su clave para continuar.':'Escriba una clave de al menos 6 caracteres. Esta clave se guardará únicamente en este navegador.';$('#admin-password').autocomplete=exists?'current-password':'new-password'}

$('[data-login-form]').addEventListener('submit',async event=>{event.preventDefault();const input=$('#admin-password');const entered=await hashPassword(input.value);const saved=localStorage.getItem(ADMIN_PASSWORD_KEY);if(!saved){localStorage.setItem(ADMIN_PASSWORD_KEY,entered);sessionStorage.setItem(ADMIN_SESSION_KEY,'1');showWorkspace();return}if(entered===saved){sessionStorage.setItem(ADMIN_SESSION_KEY,'1');showWorkspace()}else{$('[data-login-error]').textContent='La clave no es correcta.';input.select()}});
$('[data-logout]').addEventListener('click',()=>{sessionStorage.removeItem(ADMIN_SESSION_KEY);location.reload()});

async function optimizeImage(file){
  if(file.size>20*1024*1024)throw new Error('IMAGE_TOO_LARGE');
  const bitmap=await createImageBitmap(file);
  const max=720,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close();
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('IMAGE_PROCESSING')),'image/webp',.7));
  return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob)});
}
$('#product-image').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;const url=URL.createObjectURL(file);$('[data-image-preview]').innerHTML=`<img src="${url}" alt="Vista previa del producto">`});
$('[data-product-form]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=$('[data-admin-status]'),button=form.querySelector('button[type="submit"]'),originalText=button.textContent;
  button.disabled=true;button.textContent='Procesando imagen…';status.textContent='Espere un momento. No cierre esta página.';
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{
    const data=new FormData(form);const image=await optimizeImage(data.get('image'));button.textContent='Publicando…';
    await new Promise(resolve=>setTimeout(resolve,0));
    const items=customProducts();items.unshift({codigo:`PERSONAL-${Date.now()}`,nombre:String(data.get('name')).trim(),nombre_resumido:String(data.get('name')).trim(),categoria:String(data.get('category')),marca:'EsquiSolar',modelo:'',descripcion:String(data.get('description')).trim(),especificaciones:[],precio:Number(data.get('price')),precio_anterior:null,imagen:image,garantia:'Consultar',disponibilidad:'Consultar existencias',destacado:false,etiqueta:'Nuevo'});
    saveCustomProducts(items);form.reset();$('[data-image-preview]').innerHTML='<span>Vista previa</span>';status.textContent='Producto publicado correctamente.';renderCustomList();
  }catch(error){
    if(error.message==='IMAGE_TOO_LARGE')status.textContent='La fotografía supera 20 MB. Elija una imagen más pequeña.';
    else if(error.name==='QuotaExceededError')status.textContent='No hay espacio suficiente en este navegador. Elimine algún producto o use una imagen más pequeña.';
    else status.textContent='No se pudo procesar la imagen. Pruebe con una fotografía JPG, PNG o WebP.';
  }finally{button.disabled=false;button.textContent=originalText}
});

function renderCustomList(){const items=customProducts();$('[data-custom-count]').textContent=items.length;$('[data-custom-list]').innerHTML=items.length?items.map(item=>`<article class="admin-product-row"><img src="${item.imagen}" alt=""><div><strong>${escapeHtml(item.nombre)}</strong><span>Q${Number(item.precio).toLocaleString('es-GT',{minimumFractionDigits:2})}</span></div><button class="icon-button" type="button" data-delete-product="${item.codigo}" aria-label="Eliminar ${escapeHtml(item.nombre)}">×</button></article>`).join(''):'<div class="empty">Todavía no ha agregado productos.</div>'}
$('[data-custom-list]').addEventListener('click',event=>{const button=event.target.closest('[data-delete-product]');if(!button)return;if(!confirm('¿Desea eliminar este producto del catálogo?'))return;saveCustomProducts(customProducts().filter(item=>item.codigo!==button.dataset.deleteProduct));renderCustomList()});

configureLogin();
if(sessionStorage.getItem(ADMIN_SESSION_KEY)==='1')showWorkspace();
document.addEventListener('pointerdown',event=>{const field=event.target.closest('input,textarea');if(field)setTimeout(()=>field.focus({preventScroll:true}),0)},{passive:true});
window.addEventListener('load',()=>{const field=$('[data-admin-workspace]').hidden?$('#admin-password'):$('#product-name');setTimeout(()=>field?.focus(),100)});
