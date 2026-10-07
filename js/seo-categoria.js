function renderSeoCategoryProducts(items){
  const grid=document.querySelector('[data-seo-products]');
  if(!grid)return;
  const categories=(grid.dataset.categories||'').split('|').filter(Boolean);
  const matches=(items||[]).filter(product=>categories.includes(product.categoria));
  grid.innerHTML=matches.length?matches.slice(0,8).map(productCard).join(''):'<div class="card empty empty-store">Consulte por WhatsApp la disponibilidad de esta categoría.</div>';
  const count=document.querySelector('[data-seo-product-count]');
  if(count)count.textContent=`${matches.length} producto${matches.length===1?'':'s'} en el catálogo`;
}
document.addEventListener('products-loaded',event=>renderSeoCategoryProducts(event.detail));
document.addEventListener('DOMContentLoaded',()=>{if(window.esquisolarProducts?.length)renderSeoCategoryProducts(window.esquisolarProducts)});
