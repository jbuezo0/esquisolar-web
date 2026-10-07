import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const projectDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const siteUrl="https://esquisolar.com";
const products=JSON.parse(await fs.readFile(path.join(projectDir,"data","productos.json"),"utf8"));
const headers=["id","title","description","link","image_link","availability","price","condition","brand","product_type","identifier_exists"];
const clean=value=>String(value??"").replace(/[\t\r\n]+/g," ").trim();
const absolute=relative=>new URL(relative.replaceAll("\\","/"),siteUrl+"/").href;
const rows=products.map(product=>[
  product.codigo,
  product.nombre_resumido||product.nombre,
  product.descripcion,
  `${siteUrl}/producto?producto=${encodeURIComponent(product.codigo)}`,
  absolute(product.imagen),
  "in_stock",
  `${Number(product.precio).toFixed(2)} GTQ`,
  "new",
  product.marca||"EsquiSolar",
  product.categoria,
  "no"
]);
const output=[headers,...rows].map(row=>row.map(clean).join("\t")).join("\r\n")+"\r\n";
await fs.writeFile(path.join(projectDir,"google-merchant-products.tsv"),output,"utf8");
console.log(JSON.stringify({products:rows.length,output:path.join(projectDir,"google-merchant-products.tsv")}));
