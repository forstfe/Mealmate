const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2,10);
const todayKey = () => new Date().toISOString().slice(0,10);

const seed = {
  recipes:[
    {id:'r1',title:'Cremige Tomatenpasta',emoji:'🍝',time:25,servings:2,tags:['Vegetarisch','Schnell'],ingredients:['250 g Pasta','1 Dose gehackte Tomaten','1 Zwiebel','2 Knoblauchzehen','100 ml Sahne','Parmesan','Salz','Pfeffer'],steps:['Pasta al dente kochen.','Zwiebel und Knoblauch anschwitzen.','Tomaten und Sahne zugeben und 10 Minuten köcheln.','Pasta unterheben und mit Parmesan servieren.'],nutrition:{kcal:640,protein:21,carbs:91},favorite:true},
    {id:'r2',title:'Kartoffel-Gemüse-Pfanne',emoji:'🥔',time:35,servings:2,tags:['Vegetarisch','Meal Prep'],ingredients:['500 g Kartoffeln','1 Paprika','1 Zucchini','1 Zwiebel','2 EL Öl','Paprikapulver','Salz','Pfeffer'],steps:['Kartoffeln würfeln und vorkochen.','Gemüse schneiden.','Alles in der Pfanne goldbraun braten und würzen.'],nutrition:{kcal:470,protein:10,carbs:68},favorite:false},
    {id:'r3',title:'Hähnchen-Reis-Bowl',emoji:'🍚',time:30,servings:2,tags:['Proteinreich'],ingredients:['300 g Hähnchenbrust','180 g Reis','1 Gurke','1 Karotte','2 EL Sojasauce','1 TL Honig'],steps:['Reis kochen.','Hähnchen anbraten und mit Sojasauce und Honig glasieren.','Gemüse schneiden und alles in Bowls anrichten.'],nutrition:{kcal:590,protein:43,carbs:72},favorite:true},
    {id:'r4',title:'Pfannkuchen',emoji:'🥞',time:20,servings:2,tags:['Süß','Schnell'],ingredients:['200 g Mehl','2 Eier','350 ml Milch','1 Prise Salz','1 TL Vanilleextrakt','Öl zum Braten'],steps:['Zutaten zu einem glatten Teig verrühren.','10 Minuten ruhen lassen.','Portionsweise in wenig Öl ausbacken.'],nutrition:{kcal:520,protein:20,carbs:65},favorite:false}
  ],
  pantry:['Pasta','gehackte Tomaten','Zwiebel','Knoblauch','Kartoffeln','Salz','Pfeffer'],
  shopping:[{id:'s1',text:'Milch',done:false},{id:'s2',text:'Eier',done:false}],
  planner:{},
  settings:{name:'Felix'}
};

const store = {
  get(){ try{ return JSON.parse(localStorage.getItem('mealmate_data')) || structuredClone(seed)}catch{ return structuredClone(seed)} },
  set(v){ localStorage.setItem('mealmate_data', JSON.stringify(v)); }
};
let data = store.get();
let view='home';
let filter='Alle';
let search='';
let modal=null;

function save(){store.set(data);render()}
function esc(s=''){return s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function ingredientName(s){return s.toLowerCase().replace(/^\s*[\d.,/]+\s*(g|kg|ml|l|el|tl|stk|stück|dose|dosen)?\s*/i,'').replace(/\([^)]*\)/g,'').trim()}
function matchRecipe(r){
  const pantry=data.pantry.map(x=>x.toLowerCase());
  const hits=r.ingredients.filter(i=>pantry.some(p=>ingredientName(i).includes(p)||p.includes(ingredientName(i)))).length;
  return Math.round(hits/r.ingredients.length*100);
}
function nav(){return `<nav class="nav">${[['home','⌂','Start'],['recipes','◫','Rezepte'],['plan','◷','Plan'],['shopping','✓','Einkauf'],['pantry','◉','Vorrat']].map(([v,i,l])=>`<button data-nav="${v}" class="${view===v?'active':''}"><span class="ico">${i}</span>${l}</button>`).join('')}</nav>`}
function header(title='MealMate',sub='Deine private Koch-App'){return `<header class="top"><div class="brandrow"><div><div class="brand">${title}</div><div class="sub">${sub}</div></div><button class="iconbtn" data-action="settings">⚙︎</button></div></header>`}

function recipeCard(r){const m=matchRecipe(r);return `<article class="card" data-recipe="${r.id}"><div class="recipe-cover">${r.emoji||'🍽️'}</div><div class="recipe-body"><div class="recipe-title">${esc(r.title)}</div><div class="meta"><span class="pill">${r.time||'–'} Min.</span><span class="pill ${m>=60?'ok':''}">${m}% da</span></div></div></article>`}
function home(){
 const possible=[...data.recipes].sort((a,b)=>matchRecipe(b)-matchRecipe(a)).slice(0,4);
 return `${header()}<main class="content"><section class="hero"><h1>Was kann ich essen?</h1><p>Ich gleiche deine Vorräte mit deinen Rezepten ab und zeige dir, was gerade gut passt.</p></section>
 <div class="search"><input id="globalSearch" placeholder="Rezepte durchsuchen…" value="${esc(search)}"></div>
 <div class="section-title"><h2>Passt zu deinem Vorrat</h2><button data-nav="pantry">Vorrat ändern</button></div><div class="grid">${possible.map(recipeCard).join('')}</div>
 <div class="section-title"><h2>Favoriten</h2><button data-nav="recipes">Alle</button></div><div class="grid">${data.recipes.filter(r=>r.favorite).slice(0,3).map(recipeCard).join('')||'<div class="empty">Noch keine Favoriten.</div>'}</div>
 </main><button class="fab" data-action="addRecipe">+</button>${nav()}`}
function recipes(){
 const tags=['Alle','Favoriten','Schnell','Vegetarisch','Proteinreich','Meal Prep'];
 const list=data.recipes.filter(r=>{
   const q=search.toLowerCase(); const qok=!q||r.title.toLowerCase().includes(q)||r.ingredients.join(' ').toLowerCase().includes(q);
   const fok=filter==='Alle'||(filter==='Favoriten'?r.favorite:r.tags.includes(filter)); return qok&&fok;
 });
 return `${header('Rezepte',`${data.recipes.length} gespeichert`)}<main class="content"><div class="search"><input id="globalSearch" placeholder="Suche nach Rezept oder Zutat…" value="${esc(search)}"></div><div class="chips">${tags.map(t=>`<button class="chip ${filter===t?'active':''}" data-filter="${t}">${t}</button>`).join('')}</div><div class="section-title"><h2>Deine Rezepte</h2><button data-action="importRecipe">Importieren</button></div><div class="grid">${list.map(recipeCard).join('')||'<div class="empty">Keine Treffer.</div>'}</div></main><button class="fab" data-action="addRecipe">+</button>${nav()}`}
function plan(){
 const days=[0,1,2,3,4,5,6].map(n=>{const d=new Date();d.setDate(d.getDate()+n);return d});
 return `${header('Wochenplan','Plane deine nächsten Mahlzeiten')}<main class="content"><div class="list">${days.map(d=>{const k=d.toISOString().slice(0,10);const rid=data.planner[k];const r=data.recipes.find(x=>x.id===rid);return `<div class="row"><div class="row-main"><div class="row-title">${d.toLocaleDateString('de-DE',{weekday:'long'})}</div><div class="row-sub">${d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</div>${r?`<div style="margin-top:7px;font-weight:750">${r.emoji} ${esc(r.title)}</div>`:''}</div><button class="secondary" data-plan="${k}">${r?'Ändern':'+ Planen'}</button></div>`}).join('')}</div><div class="section-title"><h2>Einkauf automatisch ergänzen</h2></div><button class="primary" style="width:100%" data-action="planToShopping">Zutaten aus dem Wochenplan hinzufügen</button></main>${nav()}`}
function shopping(){return `${header('Einkaufsliste','Alles lokal auf deinem iPhone')}<main class="content"><div class="search"><input id="newShopping" placeholder="Artikel hinzufügen…"><button class="primary" data-action="addShopping">+</button></div><div class="list">${data.shopping.map(x=>`<div class="row"><button class="check ${x.done?'done':''}" data-check="${x.id}">${x.done?'✓':''}</button><div class="row-main"><div class="row-title" style="${x.done?'text-decoration:line-through;color:#929792':''}">${esc(x.text)}</div></div><button class="iconbtn" style="width:34px;height:34px;font-size:14px" data-del-shopping="${x.id}">×</button></div>`).join('')||'<div class="empty">Deine Liste ist leer.</div>'}</div>${data.shopping.length?'<div style="height:12px"></div><button class="secondary danger" style="width:100%" data-action="clearDone">Erledigte löschen</button>':''}</main>${nav()}`}
function pantry(){return `${header('Vorrat','Damit MealMate weiß, was da ist')}<main class="content"><div class="search"><input id="newPantry" placeholder="Zutat hinzufügen…"><button class="primary" data-action="addPantry">+</button></div><div class="chips" style="flex-wrap:wrap;overflow:visible">${data.pantry.map((p,i)=>`<button class="chip" data-del-pantry="${i}">${esc(p)} ×</button>`).join('')}</div><div class="section-title"><h2>Beste Treffer</h2></div><div class="grid">${[...data.recipes].sort((a,b)=>matchRecipe(b)-matchRecipe(a)).map(recipeCard).join('')}</div></main>${nav()}`}

function recipeModal(r){return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${esc(r.title)}</h2><button class="close" data-close>×</button></div><div class="detail-cover">${r.emoji||'🍽️'}</div><div class="meta" style="margin:14px 0"><span class="pill">${r.time||'–'} Min.</span><span class="pill">${r.servings||2} Portionen</span><span class="pill ok">${matchRecipe(r)}% vorhanden</span></div><div class="kpis"><div class="kpi"><b>${r.nutrition?.kcal||'–'}</b><span>kcal</span></div><div class="kpi"><b>${r.nutrition?.protein||'–'} g</b><span>Protein</span></div><div class="kpi"><b>${r.nutrition?.carbs||'–'} g</b><span>Kohlenhydrate</span></div></div><div class="section-title"><h2>Zutaten</h2><button data-action="recipeToShopping" data-id="${r.id}">+ Einkauf</button></div><ul class="ingredients">${r.ingredients.map(i=>`<li><span>${esc(i)}</span></li>`).join('')}</ul><div class="section-title"><h2>Zubereitung</h2></div><ol class="steps">${r.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="actions"><button class="secondary" data-action="favorite" data-id="${r.id}">${r.favorite?'★ Favorit':'☆ Favorit'}</button><button class="secondary" data-action="editRecipe" data-id="${r.id}">Bearbeiten</button></div></section></div>`}
function recipeForm(r={}){return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${r.id?'Rezept bearbeiten':'Neues Rezept'}</h2><button class="close" data-close>×</button></div><form id="recipeForm" data-id="${r.id||''}"><div class="field"><label>Name</label><input name="title" required value="${esc(r.title||'')}"></div><div class="field"><label>Emoji / Symbol</label><input name="emoji" value="${esc(r.emoji||'🍽️')}"></div><div class="field"><label>Zeit in Minuten</label><input name="time" type="number" inputmode="numeric" value="${r.time||30}"></div><div class="field"><label>Portionen</label><input name="servings" type="number" inputmode="numeric" value="${r.servings||2}"></div><div class="field"><label>Zutaten – eine pro Zeile</label><textarea name="ingredients" required>${esc((r.ingredients||[]).join('\n'))}</textarea></div><div class="field"><label>Zubereitung – ein Schritt pro Zeile</label><textarea name="steps" required>${esc((r.steps||[]).join('\n'))}</textarea></div><div class="field"><label>Tags – mit Komma trennen</label><input name="tags" value="${esc((r.tags||[]).join(', '))}"></div><div class="field"><label>Nährwerte pro Portion (optional)</label><div class="actions"><input name="kcal" type="number" placeholder="kcal" value="${r.nutrition?.kcal||''}"><input name="protein" type="number" placeholder="Protein g" value="${r.nutrition?.protein||''}"><input name="carbs" type="number" placeholder="KH g" value="${r.nutrition?.carbs||''}"></div></div><button class="primary" style="width:100%">Speichern</button>${r.id?'<div style="height:10px"></div><button type="button" class="secondary danger" style="width:100%" data-action="deleteRecipe" data-id="'+r.id+'">Rezept löschen</button>':''}</form></section></div>`}
function importModal(){return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Rezept importieren</h2><button class="close" data-close>×</button></div><div class="notice">Direktes Auslesen fremder Websites oder Social-Media-Apps ist in einer rein lokalen PWA wegen Browser- und Plattformbeschränkungen nicht zuverlässig möglich. Du kannst aber Rezepttext einfügen und MealMate zerlegt ihn automatisch in Zutaten und Schritte.</div><form id="importForm"><div class="field"><label>Titel</label><input name="title" placeholder="z. B. Lasagne"></div><div class="field"><label>Rezepttext</label><textarea name="text" style="min-height:220px" placeholder="Zutaten:\n500 g ...\n...\n\nZubereitung:\n1. ..."></textarea></div><button class="primary" style="width:100%">Importieren</button></form></section></div>`}
function planModal(date){return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Gericht wählen</h2><button class="close" data-close>×</button></div><div class="list">${data.recipes.map(r=>`<button class="row" style="text-align:left" data-plan-recipe="${r.id}" data-date="${date}"><div style="font-size:30px">${r.emoji}</div><div class="row-main"><div class="row-title">${esc(r.title)}</div><div class="row-sub">${r.time} Min.</div></div></button>`).join('')}</div><div style="height:10px"></div><button class="secondary danger" style="width:100%" data-plan-recipe="" data-date="${date}">Planung entfernen</button></section></div>`}
function settingsModal(){return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Einstellungen</h2><button class="close" data-close>×</button></div><div class="row"><div class="row-main"><div class="row-title">Offline & privat</div><div class="row-sub">Alle Daten bleiben in diesem Browser auf deinem Gerät.</div></div></div><div class="section-title"><h2>Datensicherung</h2></div><div class="actions"><button class="secondary" data-action="export">Exportieren</button><label class="secondary" style="text-align:center;cursor:pointer">Importieren<input id="backupFile" type="file" accept="application/json" hidden></label></div><div class="section-title"><h2>Installation auf dem iPhone</h2></div><div class="notice">In Safari öffnen → Teilen → „Zum Home-Bildschirm“. Danach startet MealMate wie eine normale App im Vollbild.</div></section></div>`}
function render(){
 let html = view==='home'?home():view==='recipes'?recipes():view==='plan'?plan():view==='shopping'?shopping():pantry();
 $('#app').innerHTML=`<div class="app">${html}${modal||''}</div>`; bind();
}
function bind(){
 $$('[data-nav]').forEach(b=>b.onclick=()=>{view=b.dataset.nav;modal=null;render()});
 $$('[data-recipe]').forEach(c=>c.onclick=()=>{const r=data.recipes.find(x=>x.id===c.dataset.recipe);modal=recipeModal(r);render()});
 $$('[data-close]').forEach(b=>b.onclick=()=>{modal=null;render()});
 $$('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});
 const gs=$('#globalSearch'); if(gs) gs.oninput=e=>{search=e.target.value; if(view==='home') view='recipes'; render()};
 $$('[data-action]').forEach(b=>b.onclick=(e)=>action(b.dataset.action,b.dataset.id,e));
 $$('[data-check]').forEach(b=>b.onclick=()=>{const x=data.shopping.find(x=>x.id===b.dataset.check);x.done=!x.done;save()});
 $$('[data-del-shopping]').forEach(b=>b.onclick=()=>{data.shopping=data.shopping.filter(x=>x.id!==b.dataset.delShopping);save()});
 $$('[data-del-pantry]').forEach(b=>b.onclick=()=>{data.pantry.splice(+b.dataset.delPantry,1);save()});
 $$('[data-plan]').forEach(b=>b.onclick=()=>{modal=planModal(b.dataset.plan);render()});
 $$('[data-plan-recipe]').forEach(b=>b.onclick=()=>{if(b.dataset.planRecipe)data.planner[b.dataset.date]=b.dataset.planRecipe;else delete data.planner[b.dataset.date];modal=null;save()});
 const rf=$('#recipeForm'); if(rf) rf.onsubmit=e=>{e.preventDefault();const f=new FormData(rf);const id=rf.dataset.id||uid();const old=data.recipes.find(x=>x.id===id);const rec={id,title:f.get('title').trim(),emoji:f.get('emoji')||'🍽️',time:+f.get('time')||30,servings:+f.get('servings')||2,ingredients:f.get('ingredients').split('\n').map(x=>x.trim()).filter(Boolean),steps:f.get('steps').split('\n').map(x=>x.trim()).filter(Boolean),tags:f.get('tags').split(',').map(x=>x.trim()).filter(Boolean),nutrition:{kcal:+f.get('kcal')||null,protein:+f.get('protein')||null,carbs:+f.get('carbs')||null},favorite:old?.favorite||false}; if(old) data.recipes=data.recipes.map(x=>x.id===id?rec:x);else data.recipes.unshift(rec);modal=null;save()};
 const inf=$('#importForm'); if(inf) inf.onsubmit=e=>{e.preventDefault();const f=new FormData(inf), raw=f.get('text').trim(); const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean); let split=lines.findIndex(x=>/zubereitung|anleitung|zubereiten/i.test(x)); if(split<0) split=Math.max(1,Math.floor(lines.length*.45)); const ing=lines.slice(0,split).filter(x=>!/zutaten/i.test(x)).map(x=>x.replace(/^[-•]\s*/,'')); const steps=lines.slice(split+1).map(x=>x.replace(/^\d+[.)]\s*/,'')); data.recipes.unshift({id:uid(),title:f.get('title').trim()||'Importiertes Rezept',emoji:'📥',time:30,servings:2,tags:['Importiert'],ingredients:ing,steps:steps.length?steps:['Zubereitung nach Originalrezept.'],nutrition:{},favorite:false}); modal=null;view='recipes';save()};
 const bf=$('#backupFile'); if(bf) bf.onchange=e=>{const file=e.target.files[0]; if(!file)return; const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save()}catch{alert('Die Datei konnte nicht gelesen werden.')}};r.readAsText(file)};
}
function action(a,id,e){
 if(a==='addRecipe'){modal=recipeForm();render()}
 if(a==='editRecipe'){const r=data.recipes.find(x=>x.id===id);modal=recipeForm(r);render()}
 if(a==='deleteRecipe'){data.recipes=data.recipes.filter(x=>x.id!==id);modal=null;save()}
 if(a==='importRecipe'){modal=importModal();render()}
 if(a==='settings'){modal=settingsModal();render()}
 if(a==='favorite'){const r=data.recipes.find(x=>x.id===id);r.favorite=!r.favorite;modal=recipeModal(r);save()}
 if(a==='addShopping'){const i=$('#newShopping'); if(i?.value.trim()){data.shopping.push({id:uid(),text:i.value.trim(),done:false});save()}}
 if(a==='clearDone'){data.shopping=data.shopping.filter(x=>!x.done);save()}
 if(a==='addPantry'){const i=$('#newPantry'); if(i?.value.trim()&&!data.pantry.some(x=>x.toLowerCase()===i.value.trim().toLowerCase())){data.pantry.push(i.value.trim());save()}}
 if(a==='recipeToShopping'){const r=data.recipes.find(x=>x.id===id);r.ingredients.forEach(text=>{if(!data.shopping.some(x=>x.text===text))data.shopping.push({id:uid(),text,done:false})});save();modal=recipeModal(r);render()}
 if(a==='planToShopping'){Object.values(data.planner).forEach(rid=>{const r=data.recipes.find(x=>x.id===rid);r?.ingredients.forEach(text=>{if(!data.shopping.some(x=>x.text===text))data.shopping.push({id:uid(),text,done:false})})});view='shopping';save()}
 if(a==='export'){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='mealmate-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
}
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
