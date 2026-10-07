const WHATSAPP_NUMBER = "50236529128";
const money = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const page = location.pathname.split('/').pop() || 'index.html';

const nav = [['index.html','Inicio'],['productos.html','Tienda Solar'],['servicios.html','Servicios'],['nosotros.html','Nosotros'],['contacto.html','Contacto']];
const seoPages={
  'servicios.html':{title:'Instalación y servicios de energía solar | EsquiSolar',description:'Diseño, instalación, mantenimiento, ampliación y bombeo solar para hogares, fincas y empresas en Guatemala.'},
  'nosotros.html':{title:'EsquiSolar | Soluciones solares en Guatemala',description:'Conozca a EsquiSolar y nuestro enfoque para diseñar soluciones solares claras, confiables y adaptadas a cada necesidad.'}
};
function setupPageSeo(){
  const seo=seoPages[page];if(!seo)return;
  document.title=seo.title;
  let description=document.querySelector('meta[name="description"]');if(description)description.content=seo.description;
  const canonicalUrl=`https://esquisolar.com/${page.replace(/\.html$/,'')}`;
  const definitions=[['link','canonical','href',canonicalUrl],['meta','og:title','content',seo.title],['meta','og:description','content',seo.description],['meta','og:type','content','website'],['meta','og:url','content',canonicalUrl],['meta','og:image','content','https://esquisolar.com/assets/images/hero-solar.png']];
  definitions.forEach(([tag,key,attribute,value])=>{const selector=tag==='link'?`link[rel="${key}"]`:`meta[property="${key}"]`;let element=document.querySelector(selector);if(!element){element=document.createElement(tag);element.setAttribute(tag==='link'?'rel':'property',key);document.head.appendChild(element)}element.setAttribute(attribute,value)});
}
function whatsappUrl(text){return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`}
function layout(){
  document.querySelector('[data-header]').innerHTML=`<div class="topbar">☀ Envíos a todo el país · Asesoría personalizada · Equipos con garantía</div><header class="site-header"><div class="container nav"><a class="brand" href="index.html"><img class="brand-logo" src="assets/images/logo-esquisolar-icon.webp" alt="Logo de EsquiSolar" width="52" height="48"><span>EsquiSolar</span></a><button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false">☰</button><nav class="nav-links" aria-label="Principal">${nav.map(([u,n])=>`<a href="${u}" ${page===u?'aria-current="page"':''}>${n}</a>`).join('')}</nav><div class="nav-actions"><a class="btn btn-outline btn-account" href="cuenta.html">👤 <span>Mi cuenta</span></a><a class="btn btn-primary" href="contacto.html#cotizacion">Solicitar cotización</a><button class="btn btn-outline cart-button" data-open-cart aria-label="Abrir carrito">🛒 <span class="cart-count" data-cart-count>0</span></button></div></div></header>`;
  document.querySelector('[data-footer]').innerHTML=`<footer class="footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="index.html"><img class="footer-logo" src="assets/images/logo-esquisolar.webp" alt="EsquiSolar — Energía solar, eficiencia, futuro" width="220" height="220"></a><a class="footer-admin-link" href="administrar-productos.html" title="Administrar productos">Soluciones solares para ahorro, independencia energética y respaldo confiable.</a></div><div><h4>Enlaces</h4>${nav.map(([u,n])=>`<a href="${u}">${n}</a>`).join('')}</div><div><h4>Contacto</h4><a href="${whatsappUrl('Hola, EsquiSolar. Quiero información.')}" target="_blank" rel="noopener">WhatsApp: +502 3652 9128</a><span>esquisolar@gmail.com</span><span>4-59 zona 1, sobre la sexta avenida, Esquipulas. Local EsquiSolar</span></div><div><h4>Horario y redes</h4><span>Lunes a sábado, 8:00 a. m. a 5:00 p. m.</span><a href="#">[FACEBOOK]</a><a href="#">[INSTAGRAM]</a><a href="#">[TIKTOK]</a></div></div><div class="footer-bottom">© ${new Date().getFullYear()} EsquiSolar · Información y precios sujetos a confirmación.</div></div></footer><a class="whatsapp-float" href="${whatsappUrl('Hola, EsquiSolar. Quiero solicitar una cotización.')}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">✆</a><div class="toast" role="status" aria-live="polite"></div>`;
  const toggle=document.querySelector('.menu-toggle'),links=document.querySelector('.nav-links');toggle.addEventListener('click',()=>{links.classList.toggle('open');toggle.setAttribute('aria-expanded',links.classList.contains('open'))});
}
function setupChatbot(){
  if(document.querySelector('[data-chatbot]'))return;
  if(!document.querySelector('link[href*="chatbot.css"]'))document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="css/chatbot.css?v=1">');
  document.body.insertAdjacentHTML('beforeend',`<div class="solar-chat" data-chatbot><button class="solar-chat-launcher" type="button" data-chat-toggle aria-label="Abrir asistente" aria-expanded="false"><span>☀</span><strong>¿Qué necesitas?</strong></button><section class="solar-chat-panel" data-chat-panel aria-label="Asistente EsquiSolar" hidden><header><div><strong>Asistente EsquiSolar</strong><small>Orientación rápida</small></div><button type="button" data-chat-close aria-label="Cerrar">×</button></header><div class="solar-chat-messages" data-chat-messages><div class="chat-message bot">¡Hola! Puedo ayudarte a encontrar productos, conocer envíos, garantías y sistemas solares. ¿Qué necesitas?</div></div><div class="chat-suggestions"><button type="button">Paneles solares</button><button type="button">Baterías</button><button type="button">Envíos</button><button type="button">Cotización</button></div><form data-chat-form><input name="message" autocomplete="off" placeholder="Escribe tu pregunta…" aria-label="Pregunta"><button type="submit" aria-label="Enviar">➤</button></form><p class="chat-disclaimer">Orientación automática. Confirmamos datos técnicos y existencias por WhatsApp.</p></section></div>`);
  const panel=document.querySelector('[data-chat-panel]'),messages=document.querySelector('[data-chat-messages]'),toggle=document.querySelector('[data-chat-toggle]');
  const open=()=>{panel.hidden=false;toggle.setAttribute('aria-expanded','true');setTimeout(()=>panel.querySelector('input').focus(),50)},close=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false')};
  toggle.addEventListener('click',()=>panel.hidden?open():close());document.querySelector('[data-chat-close]').addEventListener('click',close);
  const addMessage=(text,role='bot')=>{const div=document.createElement('div');div.className=`chat-message ${role}`;div.innerHTML=text;messages.appendChild(div);messages.scrollTop=messages.scrollHeight};
  async function answer(question){
    const q=question.toLowerCase();let reply='Puedo orientarte sobre productos, precios, envíos, garantías, instalación y cotizaciones. También puedes escribir el nombre o potencia de un equipo.';
    if(/env[ií]o|entrega|departamento|municipio/.test(q))reply='Realizamos envíos a toda Guatemala. El costo y tiempo dependen del municipio y del tamaño del equipo. <a href="contacto.html#cotizacion">Déjanos tus datos</a> para confirmarlo.';
    else if(/garant[ií]a/.test(q))reply='La garantía cambia según el equipo y la marca. En la página individual de cada producto verás la información disponible; la confirmamos antes de la compra.';
    else if(/instala|sistema|cotiza|factura|consumo/.test(q))reply='Para dimensionar un sistema necesitamos conocer tu consumo, equipos, ubicación y si deseas respaldo con baterías. <a href="contacto.html#cotizacion">Solicita una evaluación aquí</a>.';
    else if(/pago|precio|cuesta/.test(q))reply='Los precios aparecen en cada producto y se confirman junto con existencias y envío. Puedes agregar equipos al carrito y enviar la solicitud por WhatsApp.';
    else{
      let list=window.esquisolarProducts||[];if(!list.length){try{list=await fetch('data/productos.json?v=34').then(r=>r.json())}catch{list=[]}}
      const terms=q.split(/\s+/).filter(term=>term.length>2&&!['quiero','busco','necesito','tiene','tienen','para','precio'].includes(term));
      const matches=list.filter(p=>terms.some(term=>`${p.nombre} ${p.nombre_resumido||''} ${p.categoria} ${p.codigo}`.toLowerCase().includes(term))).slice(0,3);
      if(matches.length)reply=`Encontré estas opciones:<div class="chat-products">${matches.map(p=>`<a href="producto.html?producto=${encodeURIComponent(p.codigo)}"><strong>${p.nombre_resumido||p.nombre}</strong><span>${Number(p.precio)>0?money.format(p.precio):'Consultar precio'}</span></a>`).join('')}</div>`;
    }
    setTimeout(()=>addMessage(reply),250);
  }
  document.querySelector('[data-chat-form]').addEventListener('submit',event=>{event.preventDefault();const input=event.currentTarget.elements.message,text=input.value.trim();if(!text)return;addMessage(text,'user');input.value='';answer(text)});
  document.querySelector('.chat-suggestions').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;addMessage(button.textContent,'user');answer(button.textContent)});
}
function toast(message){const el=document.querySelector('.toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function sendQuote(form,title){if(!form.reportValidity())return;const data=new FormData(form);const lines=[`Hola, EsquiSolar. Quiero solicitar una cotización de ${title}:`,''];for(const [key,value] of data){if(value)lines.push(`${key}: ${value}`)}lines.push('','Quedo pendiente de su asesoría y confirmación.');window.open(whatsappUrl(lines.join('\n')),'_blank','noopener')}
document.addEventListener('DOMContentLoaded',()=>{setupPageSeo();layout();setupChatbot();document.querySelectorAll('[data-wa]').forEach(a=>a.href=whatsappUrl(a.dataset.wa));document.querySelectorAll('[data-quote-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();sendQuote(f,f.dataset.quoteForm)}));});
