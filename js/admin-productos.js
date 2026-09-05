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
  const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  return await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('IMAGE_PROCESSING')),'image/webp',.78));
}

$('#product-image').addEventListener('change',event=>{const file=event.target.files[0];if(!file)return;const url=URL.createObjectURL(file);$('[data-image-preview]').innerHTML=`<img src="${url}" alt="Vista previa del producto">`});

function resetProductForm(){
  const form=$('[data-product-form]');form.reset();form.elements.id.value='';form.elements.current_image.value='';form.elements.current_image_path.value='';
  $('#product-image').required=true;$('[data-image-required]').hidden=false;$('[data-image-help]').textContent='La imagen se optimiza antes de guardarse.';
  $('[data-image-preview]').innerHTML='<span>Vista previa</span>';$('[data-form-title]').textContent='Agregar producto';$('[data-save-product]').textContent='Guardar y publicar';$('[data-cancel-edit]').hidden=true;
}

$('[data-cancel-edit]').addEventListener('click',resetProductForm);

$('[data-product-form]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=$('[data-admin-status]'),button=form.querySelector('button[type="submit"]'),originalText=button.textContent;
  let imagePath=form.elements.current_image_path.value,imageUrl=form.elements.current_image.value,newImagePath='';button.disabled=true;button.textContent='Procesando…';status.textContent='Espere un momento. No cierre esta página.';
  try{
    const data=new FormData(form),file=data.get('image');
    if(file&&file.size){const blob=await optimizeImage(file);newImagePath=`${crypto.randomUUID()}.webp`;button.textContent='Subiendo imagen…';const {error:uploadError}=await supabaseClient.storage.from('productos').upload(newImagePath,blob,{contentType:'image/webp',cacheControl:'3600'});if(uploadError)throw uploadError;const {data:publicData}=supabaseClient.storage.from('productos').getPublicUrl(newImagePath);imagePath=newImagePath;imageUrl=publicData.publicUrl}
    const name=String(data.get('name')).trim(),oldPrice=String(data.get('old_price')).trim();
    const product={nombre:name,nombre_resumido:name,categoria:String(data.get('category')),descripcion:String(data.get('description')).trim(),precio:Number(data.get('price')),precio_anterior:oldPrice?Number(oldPrice):null,imagen:imageUrl,imagen_ruta:imagePath,garantia:String(data.get('warranty')),disponibilidad:String(data.get('availability')),etiqueta:String(data.get('label'))};
    button.textContent='Publicando…';
    const id=String(data.get('id'));let saveError;
    if(id){({error:saveError}=await supabaseClient.from('productos').update(product).eq('id',id))}else{({error:saveError}=await supabaseClient.from('productos').insert({...product,codigo:`PERSONAL-${Date.now()}`,marca:'EsquiSolar',modelo:'',especificaciones:[],destacado:false}))}
    if(saveError){if(newImagePath)await supabaseClient.storage.from('productos').remove([newImagePath]);throw saveError}
    if(id&&newImagePath&&form.elements.current_image_path.value)await supabaseClient.storage.from('productos').remove([form.elements.current_image_path.value]);
    resetProductForm();status.textContent=id?'Producto actualizado correctamente.':'Producto publicado para todos los visitantes.';await renderProductList();
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
  list.innerHTML=items.length?items.map(item=>`<article class="admin-product-row"><img src="${escapeHtml(item.imagen)}" alt=""><div><strong>${escapeHtml(item.nombre)}</strong><span>Q${Number(item.precio).toLocaleString('es-GT',{minimumFractionDigits:2})} · ${escapeHtml(item.disponibilidad)}</span></div><div class="admin-row-actions"><button class="btn btn-outline" type="button" data-edit-product="${item.id}">Editar</button><button class="icon-button" type="button" data-delete-product="${item.id}" data-image-path="${escapeHtml(item.imagen_ruta)}" aria-label="Eliminar ${escapeHtml(item.nombre)}">×</button></div></article>`).join(''):'<div class="empty">Todavía no ha agregado productos.</div>';
  list._items=items;
}

$('[data-custom-list]').addEventListener('click',async event=>{
  const editButton=event.target.closest('[data-edit-product]');
  if(editButton){const item=event.currentTarget._items?.find(product=>product.id===editButton.dataset.editProduct);if(!item)return;const form=$('[data-product-form]');form.elements.id.value=item.id;form.elements.current_image.value=item.imagen;form.elements.current_image_path.value=item.imagen_ruta;form.elements.name.value=item.nombre;form.elements.price.value=item.precio;form.elements.old_price.value=item.precio_anterior??'';form.elements.category.value=item.categoria;form.elements.label.value=item.etiqueta||'';form.elements.availability.value=item.disponibilidad;form.elements.warranty.value=item.garantia;form.elements.description.value=item.descripcion;$('#product-image').required=false;$('[data-image-required]').hidden=true;$('[data-image-help]').textContent='Opcional: elija otra imagen para reemplazar la actual.';$('[data-image-preview]').innerHTML=`<img src="${escapeHtml(item.imagen)}" alt="Imagen actual">`;$('[data-form-title]').textContent='Editar producto';$('[data-save-product]').textContent='Guardar cambios';$('[data-cancel-edit]').hidden=false;form.scrollIntoView({behavior:'smooth',block:'start'});return}
  const button=event.target.closest('[data-delete-product]');if(!button)return;
  if(!confirm('¿Desea eliminar este producto del catálogo?'))return;
  button.disabled=true;
  const {error}=await supabaseClient.from('productos').delete().eq('id',button.dataset.deleteProduct);
  if(error){alert('No se pudo eliminar el producto.');button.disabled=false;return}
  if(button.dataset.imagePath)await supabaseClient.storage.from('productos').remove([button.dataset.imagePath]);
  await renderProductList();
});

(async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session)await showWorkspace();else showLogin();const field=session?$('#product-name'):$('#admin-email');setTimeout(()=>field?.focus(),100)})();
