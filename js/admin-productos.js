const $=selector=>document.querySelector(selector);

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function showLogin(){ $('[data-admin-login]').hidden=false;$('[data-admin-workspace]').hidden=true }
async function showWorkspace(){ $('[data-admin-login]').hidden=true;$('[data-admin-workspace]').hidden=false;await renderProductList() }

$('[data-login-form]').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=event.currentTarget.querySelector('button[type="submit"]'),error=$('[data-login-error]');
  button.disabled=true;button.textContent='Ingresando…';error.textContent='';
  const {error:loginError}=await supabaseClient.auth.signInWithPassword({email:$('#admin-email').value.trim(),password:$('#admin-password').value});
  button.disabled=false;button.textContent='Ingresar';
  if(loginError){error.textContent='No se pudo ingresar. Revise el correo y la clave.';return}
  $('#admin-password').value='';await showWorkspace();
});

$('[data-logout]').addEventListener('click',async()=>{await supabaseClient.auth.signOut();showLogin()});

async function optimizeImage(file){
  if(file.size>20*1024*1024)throw new Error('IMAGE_TOO_LARGE');
  const bitmap=await createImageBitmap(file),max=1200,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  return await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('IMAGE_PROCESSING')),'image/webp',.78));
}

$('#product-image').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;const url=URL.createObjectURL(file);$('[data-image-preview]').innerHTML=`<img src="${url}" alt="Vista previa del producto">`});

$('[data-product-form]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=$('[data-admin-status]'),button=form.querySelector('button[type="submit"]'),originalText=button.textContent;
  let imagePath='';button.disabled=true;button.textContent='Procesando imagen…';status.textContent='Espere un momento. No cierre esta página.';
  try{
    const data=new FormData(form),blob=await optimizeImage(data.get('image'));
    imagePath=`${crypto.randomUUID()}.webp`;button.textContent='Subiendo imagen…';
    const {error:uploadError}=await supabaseClient.storage.from('productos').upload(imagePath,blob,{contentType:'image/webp',cacheControl:'3600'});
    if(uploadError)throw uploadError;
    const {data:publicData}=supabaseClient.storage.from('productos').getPublicUrl(imagePath),name=String(data.get('name')).trim();
    const product={codigo:`PERSONAL-${Date.now()}`,nombre:name,nombre_resumido:name,categoria:String(data.get('category')),marca:'EsquiSolar',modelo:'',descripcion:String(data.get('description')).trim(),especificaciones:[],precio:Number(data.get('price')),precio_anterior:null,imagen:publicData.publicUrl,imagen_ruta:imagePath,garantia:'Consultar',disponibilidad:'Consultar existencias',destacado:false,etiqueta:'Nuevo'};
    button.textContent='Publicando…';
    const {error:insertError}=await supabaseClient.from('productos').insert(product);
    if(insertError){await supabaseClient.storage.from('productos').remove([imagePath]);throw insertError}
    form.reset();$('[data-image-preview]').innerHTML='<span>Vista previa</span>';status.textContent='Producto publicado para todos los visitantes.';await renderProductList();
  }catch(error){
    console.error(error);
    status.textContent=error.message==='IMAGE_TOO_LARGE'?'La fotografía supera 20 MB. Elija una imagen más pequeña.':'No se pudo publicar. Compruebe su conexión e inténtelo nuevamente.';
  }finally{button.disabled=false;button.textContent=originalText}
});

async function renderProductList(){
  const list=$('[data-custom-list]');list.innerHTML='<div class="empty">Cargando productos…</div>';
  const {data:items,error}=await supabaseClient.from('productos').select('*').order('creado_en',{ascending:false});
  if(error){list.innerHTML='<div class="empty">No se pudieron cargar los productos.</div>';return}
  $('[data-custom-count]').textContent=items.length;
  list.innerHTML=items.length?items.map(item=>`<article class="admin-product-row"><img src="${escapeHtml(item.imagen)}" alt=""><div><strong>${escapeHtml(item.nombre)}</strong><span>Q${Number(item.precio).toLocaleString('es-GT',{minimumFractionDigits:2})}</span></div><button class="icon-button" type="button" data-delete-product="${item.id}" data-image-path="${escapeHtml(item.imagen_ruta)}" aria-label="Eliminar ${escapeHtml(item.nombre)}">×</button></article>`).join(''):'<div class="empty">Todavía no ha agregado productos.</div>';
}

$('[data-custom-list]').addEventListener('click',async event=>{
  const button=event.target.closest('[data-delete-product]');if(!button)return;
  if(!confirm('¿Desea eliminar este producto del catálogo?'))return;
  button.disabled=true;
  const {error}=await supabaseClient.from('productos').delete().eq('id',button.dataset.deleteProduct);
  if(error){alert('No se pudo eliminar el producto.');button.disabled=false;return}
  if(button.dataset.imagePath)await supabaseClient.storage.from('productos').remove([button.dataset.imagePath]);
  await renderProductList();
});

(async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session)await showWorkspace();else showLogin();const field=session?$('#product-name'):$('#admin-email');setTimeout(()=>field?.focus(),100)})();
