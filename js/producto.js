let detailImages=[];
let detailImageIndex=0;

function setDetailImage(index){
  detailImageIndex=(index+detailImages.length)%detailImages.length;
  const main=document.querySelector('[data-main-product-image]');
  if(main)main.src=detailImages[detailImageIndex];
  document.querySelectorAll('[data-product-thumb]').forEach((button,i)=>button.classList.toggle('active',i===detailImageIndex));
  const lightboxImage=document.querySelector('[data-lightbox-image]');if(lightboxImage)lightboxImage.src=detailImages[detailImageIndex];
}

function renderProductPage(allProducts){
  const code=new URLSearchParams(location.search).get('producto');
  const product=allProducts.find(item=>item.codigo===code);
  const host=document.querySelector('[data-product-page]');
  if(!product){host.innerHTML='<div class="card empty"><h1>Producto no encontrado</h1><p>El equipo solicitado ya no está disponible o cambió de dirección.</p><a class="btn btn-primary" href="productos.html">Volver a la tienda</a></div>';return}
  detailImages=productImages(product);detailImageIndex=0;
  const name=product.nombre_resumido||product.nombre;
  document.title=`${name} | EsquiSolar`;
  document.querySelector('[data-breadcrumb-product]').textContent=name;
  host.innerHTML=`<div class="product-gallery"><div class="product-thumbnails">${detailImages.map((image,index)=>`<button class="product-thumb${index===0?' active':''}" type="button" data-product-thumb="${index}" aria-label="Ver imagen ${index+1}"><img src="${image}" alt="${name}, imagen ${index+1}"></button>`).join('')}</div><button class="product-main-image" type="button" data-open-lightbox aria-label="Ampliar imagen"><img data-main-product-image src="${detailImages[0]}" alt="${name}"><span class="zoom-hint">⌕ Ampliar imagen</span></button></div><article class="product-page-info"><span class="product-meta">${productMeta(product)}</span><h1>${product.nombre}</h1><p class="product-code">Código: ${product.codigo}</p><div class="price product-page-price${hasPrice(product)?'':' price-consult'}">${displayPrice(product)}${product.precio_anterior?`<span class="old-price">Antes: ${money.format(product.precio_anterior)}</span>`:''}</div><p class="product-page-description">${product.descripcion||''}</p>${product.especificaciones?.length?`<h2>Características</h2><ul class="product-specs">${product.especificaciones.map(item=>`<li>${item}</li>`).join('')}</ul>`:''}<p><strong>Disponibilidad:</strong> ${product.disponibilidad||'Consultar existencias'}</p><p><strong>Garantía:</strong> ${product.garantia||'Consultar'}</p><div class="product-purchase"><button class="btn btn-primary" type="button" onclick="addToCart('${product.codigo}')">Agregar al carrito</button><a class="btn btn-green" href="${whatsappUrl(`Hola, EsquiSolar. Quiero información del producto ${product.nombre} (${product.codigo}).`)}" target="_blank" rel="noopener">Consultar</a></div></article>`;
  host.addEventListener('click',event=>{const thumb=event.target.closest('[data-product-thumb]');if(thumb)setDetailImage(Number(thumb.dataset.productThumb));if(event.target.closest('[data-open-lightbox]'))document.querySelector('[data-image-lightbox]').classList.add('open')});
  const related=allProducts.filter(item=>item.categoria===product.categoria&&item.codigo!==product.codigo).slice(0,4);document.querySelector('[data-related-products]').innerHTML=related.map(productCard).join('');
}

document.addEventListener('DOMContentLoaded',()=>{
  const lightbox=document.querySelector('[data-image-lightbox]');
  document.querySelector('[data-close-lightbox]').addEventListener('click',()=>lightbox.classList.remove('open'));
  document.querySelector('[data-lightbox-prev]').addEventListener('click',()=>setDetailImage(detailImageIndex-1));
  document.querySelector('[data-lightbox-next]').addEventListener('click',()=>setDetailImage(detailImageIndex+1));
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.classList.remove('open')});
  document.addEventListener('keydown',event=>{if(!lightbox.classList.contains('open'))return;if(event.key==='Escape')lightbox.classList.remove('open');if(event.key==='ArrowLeft')setDetailImage(detailImageIndex-1);if(event.key==='ArrowRight')setDetailImage(detailImageIndex+1)});
  if(window.esquisolarProducts?.length)renderProductPage(window.esquisolarProducts);else document.addEventListener('products-loaded',event=>renderProductPage(event.detail),{once:true});
});
