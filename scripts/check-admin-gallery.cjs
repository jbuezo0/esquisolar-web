const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=JSON.parse(fs.readFileSync(path.join(root,'data/productos.json'),'utf8'));
const listeners=new Map(),elements=new Map();
const make=()=>({value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},options:[],add(option){this.options.push(option)},addEventListener(type,fn){this.listeners??={};this.listeners[type]=fn},focus(){},scrollIntoView(){}});
const get=selector=>{if(!elements.has(selector))elements.set(selector,make());return elements.get(selector)};
const form=get('[data-product-form]');form.elements={};
for(const key of ['id','current_image','current_image_path','name','brand','model','price','old_price','category','label','availability','warranty','description'])form.elements[key]=make();
form.reset=()=>{Object.values(form.elements).forEach(field=>field.value='')};form.reportValidity=()=>true;form.querySelector=()=>get('[data-save-product]');
let database=[{...base[0],id:'test-id',imagenes:[base[0].imagen,'https://example.com/second.jpg'],activo:true}],writes=0,fail=false;
const supabase={
  auth:{getSession:async()=>({data:{session:null}})},
  from(){return {
    select(){return {eq(){return this},order:async()=>({data:database,error:null})}},
    update(payload){return {eq(){return {select:async()=>{
      if(fail)return {data:null,error:{message:'denied'}};
      writes++;database[0]={...database[0],...payload};
      return {data:[{id:'test-id'}],error:null};
    }}}}}
  }}
};
const context=vm.createContext({document:{querySelector:get},supabaseClient:supabase,console:{error(){}},URL,Option:function(text,value){this.text=text;this.value=value},setTimeout(){},FormData:class{constructor(form){this.form=form}get(name){return this.form.elements[name]?.value??null}},crypto:require('node:crypto').webcrypto});
vm.runInContext(fs.readFileSync(path.join(root,'js/admin-productos.js'),'utf8'),context);
(async()=>{
  await vm.runInContext('renderProductList()',context);
  const list=get('[data-custom-list]');
  await list.listeners.click({target:{closest:selector=>selector==='[data-edit-product]'?{dataset:{editProduct:'test-id'}}:null},currentTarget:list});
  assert.equal(form.elements.category.value,base[0].categoria,'An original category must survive editing');
  const gallery=get('[data-image-preview]');
  gallery.listeners.click({target:{closest:selector=>selector==='[data-primary-image]'?{dataset:{primaryImage:'1'}}:null}});
  gallery.listeners.click({target:{closest:selector=>selector==='[data-remove-image]'?{dataset:{removeImage:'1'}}:null}});
  await form.listeners.submit({preventDefault(){},currentTarget:form});
  assert.equal(writes,1);assert.equal(database[0].imagen,'https://example.com/second.jpg');
  assert.equal(database[0].imagenes.length,1,'Removed photo must stay removed');
  assert.deepEqual(database[0].especificaciones,base[0].especificaciones,'Technical specs must remain untouched');
  assert.equal(database[0].codigo,base[0].codigo);
  await list.listeners.click({target:{closest:selector=>selector==='[data-edit-product]'?{dataset:{editProduct:'test-id'}}:null},currentTarget:list});
  assert.equal(vm.runInContext('gallery.length',context),1,'Saved gallery must reload');
  fail=true;await form.listeners.submit({preventDefault(){},currentTarget:form});
  assert.equal(writes,1);assert.equal(form.elements.id.value,'test-id','Failed save must preserve editor');
  const cartContext=vm.createContext({localStorage:{getItem:()=>null},document:{addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,dispatchEvent(){}},window:{},fetch:async()=>({json:async()=>base}),supabaseClient:{from(){return {select(){return {order:async()=>({data:[database[0],{...base[1],activo:false}],error:null})}}}}},CustomEvent:function(type,opts){this.detail=opts.detail},console});
  vm.runInContext(fs.readFileSync(path.join(root,'js/carrito.js'),'utf8'),cartContext);
  const merged=await vm.runInContext('loadProducts()',cartContext);
  assert.equal(merged.length,56);assert.equal(new Set(merged.map(p=>p.codigo)).size,56);
  assert.equal(merged.find(p=>p.codigo===base[0].codigo).imagen,'https://example.com/second.jpg');
  assert.ok(!merged.some(p=>p.codigo===base[1].codigo),'Removed original product must not return');
  console.log('PASS: edit original, preserve category/specs/code, change main photo, remove photo, reload, failed save, merge without duplicates, exclude removed product.');
})().catch(error=>{console.error(error);process.exitCode=1});
