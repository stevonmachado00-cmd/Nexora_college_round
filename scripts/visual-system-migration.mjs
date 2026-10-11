// One-time, inspectable migration of legacy presentation values to Nexus tokens.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
const walk = p => fs.readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(p,e.name)) : [path.join(p,e.name)]);
const files = [...walk('dist').filter(p=>!p.startsWith('dist'+path.sep+'builder')), ...walk('builder/src')].filter(p=>/\.(css|js|tsx|html)$/.test(p));
const space = [8,16,24,32,48,64];
const types = [12,14,16,20,24,32,48,64];
const nearest = (n,scale) => scale.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a);
const spacingProp = /^(padding|margin|gap|row-gap|column-gap)(-|$)/;
const findings=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8');
 for(const [i,line] of source.split('\n').entries()){
  for(const [kind,re] of [['arrow',/[→↗←]/g],['middle-dot',/·/g],['uppercase-label',/>[A-Z][A-Z /&]{3,}</g],['uppercase-css',/text-transform\s*:\s*uppercase/g],['shadow',/box-shadow\s*:[^;}]+/g],['raw-color',/#[0-9a-fA-F]{3,8}\b/g],['spacing',/(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:[^;}"\n]+/g]]){
   for(const match of line.matchAll(re)) findings.push({file:file.replaceAll('\\','/'),line:i+1,column:match.index+1,kind,value:match[0]});
  }
 }
}
if(!process.argv.includes('--apply')){
 fs.writeFileSync('docs/visual-audit-before.json',JSON.stringify({created:'2026-10-11',files:files.length,findings},null,2)+'\n');
 console.log(JSON.stringify({files:files.length,findings:findings.length,counts:Object.fromEntries([...new Set(findings.map(f=>f.kind))].map(k=>[k,findings.filter(f=>f.kind===k).length]))}));
 process.exit();
}
function color(value,prop,selector=''){
 return value.replace(/#[\da-f]{3,8}\b/gi,hex=>{
  let h=hex.slice(1); if(h.length===3||h.length===4)h=h.split('').map(c=>c+c).join('');
  const rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));const max=Math.max(...rgb),min=Math.min(...rgb); const light=(max+min)/2;
  if(/error|danger|delete/.test(selector))return 'var(--nx-error)';
  if(/success|\.green|\.online|\.up\b/.test(selector))return light>195?'var(--nx-success-soft)':'var(--nx-success)';
  if(/warning|\.amber|\.offline/.test(selector))return light>195?'var(--nx-warning-soft)':'var(--nx-warning)';
  if(/shadow/.test(prop))return 'var(--nx-line)';
  if(/border|stroke/.test(prop))return 'var(--nx-line)';
  if(max-min>28) return light>190?'var(--nx-brand-soft)':light<62?'var(--nx-ink)':'var(--nx-brand)';
  if(light>248)return 'var(--nx-surface)'; if(light>231)return 'var(--nx-paper)';if(light>200)return 'var(--nx-line)';
  if(light>95)return 'var(--nx-muted)';return 'var(--nx-ink)';
 });
}
function val(prop,value,selector){
 if(spacingProp.test(prop))value=value.replace(/(-?\d*\.?\d+)px/g,(_,x)=>+x===0?'0':`${+x<0?'-':''}var(--nx-space-${nearest(Math.abs(+x),space)})`);
 if(prop==='font-size')value=value.replace(/(\d*\.?\d+)px/g,(_,x)=>`var(--nx-text-${nearest(+x,types)})`);
 if(prop==='text-transform'&&value==='uppercase')return 'none';
 if(prop==='box-shadow')return /modal|dialog|popover|toast/.test(selector)?'var(--nx-shadow-overlay)':'none';
 if(prop==='font-family'&&!/--/.test(value))return 'var(--nx-font-body)';
 return color(value,prop,selector);
}
for(const file of files){
 let source=fs.readFileSync(file,'utf8');
 if(file.endsWith('.css')){
  const ast=postcss.parse(source); ast.walkAtRules('import',r=>{if(r.params.includes('fonts.googleapis'))r.remove()});
  ast.walkDecls(d=>{d.value=val(d.prop,d.value,d.parent.selector||'');});source=ast.toString();
 }else{
  source=source.replace(/[ \t]*[→↗←][ \t]*/g,' ').replaceAll(' · ','. ').replaceAll(' ·','').replaceAll('· ','');
  source=source.replace(/(style=")([^"]+)(")/g,(_,a,body,z)=>a+body.replace(/([\w-]+):([^;]+)/g,(__,p,v)=>`${p}:${val(p,v,'')}`)+z);
  source=source.replace(/>([A-Z][A-Z /&]{3,})</g,(_,label)=>'>'+label[0]+label.slice(1).toLowerCase()+'<');
 }
 fs.writeFileSync(file,source);
}
console.log(`Migrated ${files.length} presentation files. Authored project records were not modified.`);
