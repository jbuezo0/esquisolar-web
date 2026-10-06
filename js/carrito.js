const CART_KEY='esqueSolarCart';
let products=[];
let cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');

function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart()}
function hasPrice(p){return Number.isFinite(Number(p?.precio))&&Number(p.precio)>0}
function displayPrice(p){return hasPrice(p)?money.format(Number(p.precio)):'Consultar precio'}
function count(){return cart.reduce((n,i)=>n+i.qty,0)}
function productImages(p){return [...new Set([...(Array.isArray(p?.imagenes)?p.imagenes:[]),p?.imagen].filter(Boolean))]}
function productUrl(p){return `producto.html?producto=${encodeURIComponent(p.codigo)}`}
function addToCart(id,qty=1){const found=cart.find(i=>i.id===id);found?found.qty+=qty:cart.push({id,qty});saveCart();toast('Producto agregado al carrito')}
function changeQty(id,d){const item=cart.find(i=>i.id===id);if(!item)return;item.qty+=d;if(item.qty<1)cart=cart.filter(i=>i.id!==id);saveCart()}
function removeItem(id){cart=cart.filter(i=>i.id!==id);saveCart()}
function clearCart(){cart=[];saveCart()}

function renderCart(){
  document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count());
  const list=document.querySelector('[data-cart-list]');if(!list)return;
  let total=0,hasPendingPrice=false;
  list.innerHTML=cart.length?cart.map(item=>{const p=products.find(x=>x.codigo===item.id);if(!p)return'';const priced=hasPrice(p),sub=priced?Number(p.precio)*item.qty:0;if(priced)total+=sub;else hasPendingPrice=true;return `<div class="cart-item"><div><strong>${p.nombre_resumido}</strong><div>${displayPrice(p)}${priced?' c/u':''}</div><div class="qty"><button onclick="changeQty('${p.codigo}',-1)" aria-label="Restar">−</button><span>${item.qty}</span><button onclick="changeQty('${p.codigo}',1)" aria-label="Sumar">+</button></div></div><div><strong>${priced?money.format(sub):'Por confirmar'}</strong><button class="icon-button" onclick="removeItem('${p.codigo}')" aria-label="Eliminar">×</button></div></div>`}).join(''):'<div class="empty">Tu carrito está vacío.</div>';
  document.querySelector('[data-cart-total]').textContent=hasPendingPrice?`${money.format(total)} + precios por confirmar`:money.format(total);
  document.querySelector('[data-checkout]').disabled=!cart.length;
}

async function setupCheckoutLocations(){
  const department=document.querySelector('[data-order-department]'),municipality=document.querySelector('[data-order-municipality]');if(!department||!municipality)return;
  try{const response=await fetch('data/ubicaciones-guatemala.json?v=1');if(!response.ok)throw new Error('No se pudo cargar la lista de ubicaciones');const locations=await response.json();locations.forEach(item=>department.add(new Option(item.departamento,item.departamento)));department.addEventListener('change',()=>{const selected=locations.find(item=>item.departamento===department.value);municipality.innerHTML='<option value="">Seleccione un municipio</option>';municipality.disabled=!selected;if(selected)selected.municipios.forEach(name=>municipality.add(new Option(name,name)))})}catch(error){department.innerHTML='<option value="">No se pudo cargar la lista</option>';department.disabled=true;municipality.disabled=true;console.error(error)}
}

function setupCart(){
  document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" data-cart-drawer><aside class="drawer" aria-label="Carrito"><div class="drawer-head"><h2>Tu pedido</h2><button class="icon-button" data-close-cart aria-label="Cerrar">×</button></div><div data-cart-list></div><div class="cart-total"><span>Total estimado</span><span data-cart-total>Q0.00</span></div><p class="notice">Precios sujetos a confirmación. El envío se cotiza según la ubicación.</p><div class="actions"><button class="btn btn-green" data-checkout>Finalizar pedido</button><button class="btn btn-outline" onclick="clearCart()">Vaciar carrito</button></div></aside></div><div class="modal" data-checkout-modal><div class="modal-panel"><div class="modal-head"><div><h2>Completa tu pedido</h2><p>Te llevaremos a WhatsApp para confirmar disponibilidad y envío.</p></div><button class="icon-button" data-close-checkout>×</button></div><form data-order-form class="form-grid"><div class="field"><label>Nombre *</label><input name="Nombre" required></div><div class="field"><label>Teléfono *</label><input name="Teléfono" inputmode="tel" required></div><div class="field"><label>Departamento *</label><select name="Departamento" data-order-department autocomplete="address-level1" required><option value="">Seleccione un departamento</option></select></div><div class="field"><label>Municipio *</label><select name="Municipio" data-order-municipality autocomplete="address-level2" required disabled><option value="">Primero seleccione un departamento</option></select></div><div class="field"><label>Tipo de entrega *</label><select name="Tipo de entrega" required><option value="">Seleccione</option><option>Recoger</option><option>Envío</option></select></div><div class="field full"><label>Dirección o referencia</label><input name="Dirección"></div><div class="field full"><label>Comentarios</label><textarea name="Comentarios"></textarea></div><div class="full notice">Los precios están sujetos a confirmación y el envío se cotiza según la ubicación.</div><button class="btn btn-green full">Enviar pedido por WhatsApp</button></form></div></div>`);
  setupCheckoutLocations();
  const drawer=document.querySelector('[data-cart-drawer]'),modal=document.querySelector('[data-checkout-modal]');
  document.addEventListener('click',e=>{if(e.target.closest('[data-open-cart]'))drawer.classList.add('open');if(e.target.closest('[data-close-cart]')||e.target===drawer)drawer.classList.remove('open');if(e.target.closest('[data-checkout]'))modal.classList.add('open');if(e.target.closest('[data-close-checkout]')||e.target===modal)modal.classList.remove('open')});
  document.querySelector('[data-order-form]').addEventListener('submit',e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const d=Object.fromEntries(new FormData(e.currentTarget));let total=0,hasPendingPrice=false;const lines=['Hola, EsquiSolar. Quiero solicitar información y confirmar la disponibilidad de los siguientes productos:',''];cart.forEach((item,i)=>{const p=products.find(x=>x.codigo===item.id);if(!p)return;const priced=hasPrice(p),sub=priced?Number(p.precio)*item.qty:0;if(priced)total+=sub;else hasPendingPrice=true;lines.push(`${i+1}. ${item.qty} × ${p.nombre_resumido}`,`   Precio unitario: ${displayPrice(p)}`,`   Subtotal: ${priced?money.format(sub):'Por confirmar'}`,'')});lines.push(`Total estimado: ${money.format(total)}${hasPendingPrice?' más precios por confirmar':''}`,'','Datos del cliente:',`Nombre: ${d.Nombre}`,`Teléfono: ${d.Teléfono}`,`Departamento: ${d.Departamento}`,`Municipio: ${d.Municipio}`,`Dirección: ${d.Dirección||'No indicada'}`,`Tipo de entrega: ${d['Tipo de entrega']}`,`Comentarios: ${d.Comentarios||'Ninguno'}`,'','Quedo pendiente de la confirmación de disponibilidad, costo de envío y forma de pago.');window.open(whatsappUrl(lines.join('\n')),'_blank','noopener')});renderCart();
}

async function loadProducts(){
  try{const r=await fetch('data/productos.json?v=34');const base=await r.json();let online=[];if(typeof supabaseClient!=='undefined'){const result=await supabaseClient.from('productos').select('*').order('creado_en',{ascending:false});if(result.error)console.error(result.error);online=result.data||[]}products=[...online,...base];window.esquisolarProducts=products;renderCart();document.dispatchEvent(new CustomEvent('products-loaded',{detail:products}));return products}catch(e){console.error(e);return[]}
}

function productMeta(p){return [p.categoria,p.marca,p.modelo].filter(Boolean).join(' · ')}
function productCard(p){
  const displayName=p.nombre_resumido||p.nombre||'Producto solar',meta=productMeta(p),images=productImages(p),url=productUrl(p);
  return `<article class="card product-card"><a class="product-image-link" href="${url}" aria-label="Ver ${displayName}"><div class="product-image">${p.imagen?`<img src="${p.imagen}" alt="${displayName}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=product-placeholder>☀</span>')">`:'<span class="product-placeholder">☀</span>'}${p.etiqueta?`<span class="badge">${p.etiqueta}</span>`:''}${images.length>1?`<span class="gallery-count">▧ ${images.length} fotos</span>`:''}</div></a><div class="product-body">${meta?`<span class="product-meta">${meta}</span>`:''}<a class="product-title-link" href="${url}"><h3 class="product-name">${displayName}</h3></a><div class="price product-price${hasPrice(p)?'':' price-consult'}">${displayPrice(p)}${p.precio_anterior?`<span class="old-price">Antes: ${money.format(p.precio_anterior)}</span>`:''}</div><p class="product-description">${p.descripcion||''}</p><span class="product-stock">${p.disponibilidad||'Consultar existencias'}</span><div class="product-actions"><a class="btn btn-dark" href="${url}">Ver producto</a><button class="btn btn-primary cart-compact" onclick="addToCart('${p.codigo}')" aria-label="Agregar ${displayName} al carrito">🛒</button></div></div></article>`
}

function setupCatalog(){
  const grid=document.querySelector('[data-product-grid]'),search=document.querySelector('[data-search]'),heroSearch=document.querySelector('[data-store-search]'),cat=document.querySelector('[data-category]'),sort=document.querySelector('[data-sort]'),countLabel=document.querySelector('[data-results-count]'),categoryStrip=document.querySelector('[data-category-strip]');
  const categories=[...new Set(products.map(p=>p.categoria))].sort();
  categories.forEach(c=>cat.add(new Option(c,c)));
  const categoryImages={};categories.forEach(c=>categoryImages[c]=products.find(p=>p.categoria===c)?.imagen);
  categoryStrip.innerHTML=`<button class="category-tile active" type="button" data-category-value=""><span class="category-picture"><span class="product-placeholder">☀</span></span><span>Todos</span></button>`+categories.map(c=>`<button class="category-tile" type="button" data-category-value="${c}"><span class="category-picture"><img src="${categoryImages[c]}" alt="" loading="lazy"></span><span>${c}</span></button>`).join('');
  function draw(){let rows=products.filter(p=>`${p.nombre} ${p.nombre_resumido||''} ${p.marca||''} ${p.modelo||''} ${p.codigo}`.toLowerCase().includes(search.value.toLowerCase())&&(!cat.value||p.categoria===cat.value));if(sort.value==='asc')rows.sort((a,b)=>(Number(a.precio)||Infinity)-(Number(b.precio)||Infinity));if(sort.value==='desc')rows.sort((a,b)=>(Number(b.precio)||0)-(Number(a.precio)||0));grid.innerHTML=rows.length?rows.map(productCard).join(''):'<div class="card empty empty-store">No encontramos productos con esos filtros.</div>';countLabel.textContent=`${rows.length} producto${rows.length===1?'':'s'}`;categoryStrip.querySelectorAll('[data-category-value]').forEach(button=>button.classList.toggle('active',button.dataset.categoryValue===cat.value))}
  [search,cat,sort].forEach(x=>x.addEventListener('input',draw));
  categoryStrip.addEventListener('click',event=>{const button=event.target.closest('[data-category-value]');if(!button)return;cat.value=button.dataset.categoryValue;draw();document.querySelector('.store-products').scrollIntoView({behavior:'smooth'})});
  const runHeroSearch=()=>{search.value=heroSearch.value;draw();document.querySelector('.store-products').scrollIntoView({behavior:'smooth'})};heroSearch.addEventListener('keydown',event=>{if(event.key==='Enter')runHeroSearch()});document.querySelector('[data-store-search-button]').addEventListener('click',runHeroSearch);
  document.querySelector('[data-mobile-filter]').addEventListener('click',()=>document.querySelector('[data-filter-panel]').classList.toggle('open'));
  document.querySelector('[data-mobile-sort]').addEventListener('click',()=>{document.querySelector('[data-filter-panel]').classList.add('open');sort.focus()});draw();
}

function showProduct(id){location.href=`producto.html?producto=${encodeURIComponent(id)}`}
document.addEventListener('DOMContentLoaded',async()=>{setupCart();await loadProducts();if(document.querySelector('[data-product-grid]')&&document.querySelector('[data-category-strip]'))setupCatalog();const linkedProduct=new URLSearchParams(location.search).get('producto');if(linkedProduct&&location.pathname.endsWith('productos.html'))showProduct(linkedProduct)});
