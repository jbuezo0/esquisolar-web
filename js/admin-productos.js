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

let gallery=[];
let editingProduct=null;
function galleryFor(item){return [...new Set([item.imagen,...(Array.isArray(item.imagenes)?item.imagenes:[])].filter(Boolean))].map(url=>({url}))}
function renderGallery(){
  const host=$('[data-image-preview]');host.style.cssText='display:flex;flex-wrap:wrap;gap:12px;height:auto;min-height:100px;padding:12px';
  host.innerHTML=gallery.length?gallery.map((image,index)=>`<div style="width:130px"><img src="${escapeHtml(image.url)}" alt="Foto ${index+1}" style="width:130px;height:110px;object-fit:contain"><button type="button" class="btn btn-outline" data-primary-image="${index}" ${index===0?'disabled':''}>${index===0?'Principal':'Usar principal'}</button><button type="button" class="btn btn-outline" data-remove-image="${index}">Quitar foto</button></div>`).join(''):'<span>Agregue al menos una foto.</span>';
}
function clearGallery(){gallery.forEach(image=>{if(image.file)URL.revokeObjectURL(image.url)});gallery=[]}
$('#product-image').addEventListener('change',event=>{for(const file of event.target.files){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){$('[data-admin-status]').textContent='Use fotos JPG, PNG o WebP de hasta 20 MB.';continue}gallery.push({file,url:URL.createObjectURL(file)})}event.target.value='';renderGallery()});
$('[data-add-image-url]').addEventListener('click',()=>{const field=$('#product-image-url');try{const url=new URL(field.value);if(!['https:','http:'].includes(url.protocol))throw new Error();if(!gallery.some(image=>image.url===url.href))gallery.push({url:url.href});field.value='';renderGallery()}catch{$('[data-admin-status]').textContent='Ingrese un enlace de imagen válido, comenzando con https://.'}});
$('[data-image-preview]').addEventListener('click',event=>{const remove=event.target.closest('[data-remove-image]'),primary=event.target.closest('[data-primary-image]');if(remove){const [image]=gallery.splice(Number(remove.dataset.removeImage),1);if(image.file)URL.revokeObjectURL(image.url)}if(primary){const [image]=gallery.splice(Number(primary.dataset.primaryImage),1);gallery.unshift(image)}renderGallery()});

function resetProductForm(){
  const form=$('[data-product-form]');form.reset();form.elements.id.value='';form.elements.current_image.value='';form.elements.current_image_path.value='';
  editingProduct=null;clearGallery();$('#product-image').required=false;$('[data-image-required]').hidden=false;$('[data-image-help]').textContent='Agregue varias fotos, elija la principal o quite las que ya no quiera. Se publican al guardar.';
  $('[data-image-preview]').innerHTML='<span>Vista previa</span>';$('[data-form-title]').textContent='Agregar producto';$('[data-save-product]').textContent='Guardar y publicar';$('[data-cancel-edit]').hidden=true;
}

$('[data-cancel-edit]').addEventListener('click',resetProductForm);

$('[data-product-form]').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=$('[data-admin-status]'),button=form.querySelector('button[type="submit"]'),originalText=button.textContent;
  if(!gallery.length){$('[data-admin-status]').textContent='Agregue al menos una foto antes de guardar.';return}
  const newPaths=[];let committed=false;form.inert=true;button.disabled=true;button.textContent='Procesando…';status.textContent='Espere un momento. No cierre esta página.';
  try{
    const data=new FormData(form),savedGallery=[];
    for(const image of gallery){if(!image.file){savedGallery.push(image.url);continue}const blob=await optimizeImage(image.file),path=`${crypto.randomUUID()}.webp`;button.textContent=`Subiendo foto ${savedGallery.length+1}…`;const {error:uploadError}=await supabaseClient.storage.from('productos').upload(path,blob,{contentType:'image/webp',cacheControl:'3600'});if(uploadError)throw uploadError;newPaths.push(path);const {data:publicData}=supabaseClient.storage.from('productos').getPublicUrl(path);savedGallery.push(publicData.publicUrl)}
    const name=String(data.get('name')).trim(),oldPrice=String(data.get('old_price')).trim();
    const product={nombre:name,nombre_resumido:editingProduct&&name===editingProduct.nombre?editingProduct.nombre_resumido:name,categoria:String(data.get('category')),marca:String(data.get('brand')).trim(),modelo:String(data.get('model')).trim(),descripcion:String(data.get('description')).trim(),precio:Number(data.get('price')),precio_anterior:oldPrice?Number(oldPrice):null,imagen:savedGallery[0],imagenes:savedGallery,imagen_ruta:'',garantia:String(data.get('warranty')),disponibilidad:String(data.get('availability')),etiqueta:String(data.get('label'))};
    button.textContent='Publicando…';
    const id=String(data.get('id'));let saveError;
    if(id){const result=await supabaseClient.from('productos').update(product).eq('id',id).select('id');saveError=result.error;if(!saveError&&!result.data?.length)throw new Error('NO_PERMISSION')}else{({error:saveError}=await supabaseClient.from('productos').insert({...product,codigo:`PERSONAL-${Date.now()}`,especificaciones:[],destacado:false}).select('id').single())}
    if(saveError)throw saveError;committed=true;
    resetProductForm();status.textContent=id?'Producto actualizado correctamente.':'Producto publicado para todos los visitantes.';await renderProductList();
  }catch(error){
    if(!committed&&newPaths.length)await supabaseClient.storage.from('productos').remove(newPaths);
    console.error(error);
    status.textContent=error.message==='IMAGE_TOO_LARGE'?'La fotografía supera 20 MB. Elija una imagen más pequeña.':'No se pudo publicar. Compruebe su conexión e inténtelo nuevamente.';
  }finally{form.inert=false;button.disabled=false;button.textContent=editingProduct?originalText:'Guardar y publicar'}
});

async function renderProductList(){
  const list=$('[data-custom-list]');list.innerHTML='<div class="empty">Cargando productos…</div>';
  const {data:items,error}=await supabaseClient.from('productos').select('*').eq('activo',true).order('nombre',{ascending:true});
  if(error){list.innerHTML='<div class="empty">No se pudieron cargar los productos.</div>';return}
  $('[data-custom-count]').textContent=items.length;
  list.innerHTML=items.length?items.map(item=>`<article class="admin-product-row"><img src="${escapeHtml(item.imagen)}" alt=""><div><strong>${escapeHtml(item.nombre)}</strong><span>Q${Number(item.precio).toLocaleString('es-GT',{minimumFractionDigits:2})} · ${escapeHtml(item.disponibilidad)}</span></div><div class="admin-row-actions"><button class="btn btn-outline" type="button" data-edit-product="${item.id}">Editar</button><button class="icon-button" type="button" data-delete-product="${item.id}" data-image-path="${escapeHtml(item.imagen_ruta)}" aria-label="Eliminar ${escapeHtml(item.nombre)}">×</button></div></article>`).join(''):'<div class="empty">Todavía no ha agregado productos.</div>';
  list._items=items;
}

$('[data-custom-list]').addEventListener('click',async event=>{
  const editButton=event.target.closest('[data-edit-product]');
  if(editButton){const item=event.currentTarget._items?.find(product=>product.id===editButton.dataset.editProduct);if(!item)return;resetProductForm();editingProduct=item;const form=$('[data-product-form]');form.elements.id.value=item.id;form.elements.current_image.value=item.imagen;form.elements.current_image_path.value=item.imagen_ruta;form.elements.name.value=item.nombre;form.elements.brand.value=item.marca||'';form.elements.model.value=item.modelo||'';form.elements.price.value=item.precio;form.elements.old_price.value=item.precio_anterior??'';for(const [field,value] of [['category',item.categoria],['label',item.etiqueta||''],['availability',item.disponibilidad],['warranty',item.garantia]]){const select=form.elements[field];if(![...select.options].some(option=>option.value===value))select.add(new Option(value,value));select.value=value}form.elements.description.value=item.descripcion;gallery=galleryFor(item);renderGallery();$('[data-image-required]').hidden=true;$('[data-form-title]').textContent='Editar producto';$('[data-save-product]').textContent='Guardar cambios';$('[data-cancel-edit]').hidden=false;form.scrollIntoView({behavior:'smooth',block:'start'});return}
  const button=event.target.closest('[data-delete-product]');if(!button)return;
  if(!confirm('¿Desea eliminar este producto del catálogo?'))return;
  button.disabled=true;
  const {data:removed,error}=await supabaseClient.from('productos').update({activo:false}).eq('id',button.dataset.deleteProduct).select('id');
  if(error||!removed?.length){alert('No se pudo eliminar el producto.');button.disabled=false;return}
  await renderProductList();
});

(async()=>{const {data:{session}}=await supabaseClient.auth.getSession();if(session)await showWorkspace();else showLogin();const field=session?$('#product-name'):$('#admin-email');setTimeout(()=>field?.focus(),100)})();
