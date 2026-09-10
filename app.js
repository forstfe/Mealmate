'use strict';

const CHEF_PROXY = 'https://mealmate.grxq8hqb8r.workers.dev';
const STORE_KEY = 'mealmate_data';
const APP_VERSION = 102;
const MEALS = [
  ['breakfast','Frühstück','☀️'],
  ['lunch','Mittagessen','🍽️'],
  ['dinner','Abendessen','🌙']
];
const UNITS = ['g','kg','ml','l','Stück'];
const DEFAULT_SEARCHES = ['Schnelle Gerichte','Pasta','Hähnchen','Kartoffeln','Auflauf','Vegetarisch','Reis','Pfannkuchen'];
const STOPWORDS = new Set('mit und oder der die das ein eine einer einem einen für aus vom von auf in im am zu zum zur nach über ohne schnell schnelle rezept rezepte gericht gerichte lecker einfache einfach cremige gebratene gebratenes selbstgemacht selbstgemachte'.split(' '));

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const clone = x => JSON.parse(JSON.stringify(x));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const todayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (n,base=new Date()) => { const d=new Date(base); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return d; };
const parseNum = v => Number(String(v ?? '').replace(',','.')) || 0;

const seedRecipes = [
  {
    id:'seed-tomatenpasta', title:'Cremige Tomatenpasta', emoji:'🍝', image:'', time:25, servings:2,
    tags:['Pasta','Schnell'], favorite:false, rating:0, cookedCount:0, lastCooked:null,
    ingredients:[{name:'Pasta',quantity:250,unit:'g'},{name:'Gehackte Tomaten',quantity:400,unit:'g'},{name:'Zwiebel',quantity:1,unit:'Stück'},{name:'Knoblauch',quantity:2,unit:'Stück'}],
    steps:['Pasta nach Packungsangabe kochen.','Zwiebel und Knoblauch anschwitzen.','Tomaten zugeben, würzen und einkochen lassen.','Pasta unterheben und servieren.'],
    nutrition:{kcal:null,protein:null,carbs:null}, source:null
  },
  {
    id:'seed-kartoffelpfanne', title:'Kartoffel-Gemüse-Pfanne', emoji:'🥔', image:'', time:35, servings:2,
    tags:['Kartoffeln','Gemüse'], favorite:false, rating:0, cookedCount:0, lastCooked:null,
    ingredients:[{name:'Kartoffeln',quantity:500,unit:'g'},{name:'Paprika',quantity:1,unit:'Stück'},{name:'Zwiebel',quantity:1,unit:'Stück'}],
    steps:['Kartoffeln klein schneiden und vorgaren.','Gemüse schneiden.','Alles in der Pfanne kräftig anbraten und würzen.'], nutrition:{}, source:null
  },
  {
    id:'seed-haehnchenreis', title:'Hähnchen-Reis-Bowl', emoji:'🍚', image:'', time:30, servings:2,
    tags:['Hähnchen','Reis'], favorite:false, rating:0, cookedCount:0, lastCooked:null,
    ingredients:[{name:'Hähnchenbrust',quantity:300,unit:'g'},{name:'Reis',quantity:180,unit:'g'},{name:'Gurke',quantity:1,unit:'Stück'}],
    steps:['Reis garen.','Hähnchen würzen und anbraten.','Mit Gurke und gewünschtem Gemüse als Bowl anrichten.'], nutrition:{}, source:null
  },
  {
    id:'seed-pfannkuchen', title:'Pfannkuchen', emoji:'🥞', image:'', time:20, servings:2,
    tags:['Süß','Frühstück'], favorite:false, rating:0, cookedCount:0, lastCooked:null,
    ingredients:[{name:'Mehl',quantity:200,unit:'g'},{name:'Milch',quantity:400,unit:'ml'},{name:'Eier',quantity:2,unit:'Stück'}],
    steps:['Zutaten zu einem glatten Teig verrühren.','Portionsweise in einer Pfanne ausbacken.'], nutrition:{}, source:null
  }
];

function emptyPlan(){ return {breakfast:[],lunch:[],dinner:[]}; }
function normalizeMealList(v){ if(Array.isArray(v)) return v.filter(Boolean); return v ? [v] : []; }
function mealList(day,meal){ data.planner[day]??=emptyPlan(); data.planner[day][meal]=normalizeMealList(data.planner[day][meal]); return data.planner[day][meal]; }
function addToMeal(day,meal,id){ const list=mealList(day,meal); if(!list.includes(id)) list.push(id); }
function removeFromMeal(day,meal,index){ const list=mealList(day,meal); if(index>=0&&index<list.length) list.splice(index,1); }
function freshData(){
  return {
    schema:APP_VERSION,
    recipes:clone(seedRecipes), pantry:[], shopping:[], planner:{},
    settings:{theme:'system',name:'Felix'},
    taste:{keywordScores:{},seenRecommendations:[],interactions:0}
  };
}

function normalizeIngredient(x){
  if(typeof x === 'string') return parseIngredientText(x);
  return {name:String(x?.name||'Zutat').trim(), quantity:parseNum(x?.quantity), unit:UNITS.includes(x?.unit)?x.unit:(x?.unit||'')};
}
function normalizePantryItem(x){
  if(typeof x === 'string') return {id:uid(),name:x,quantity:1,unit:'Stück',barcode:'',image:''};
  return {id:x?.id||uid(),name:String(x?.name||'').trim(),quantity:parseNum(x?.quantity),unit:UNITS.includes(x?.unit)?x.unit:(x?.unit||'Stück'),barcode:String(x?.barcode||''),image:String(x?.image||'')};
}
function normalizeShoppingItem(x){
  if(typeof x === 'string') return {id:uid(),name:x,quantity:1,unit:'Stück',done:false};
  return {id:x?.id||uid(),name:String(x?.name||'').trim(),quantity:parseNum(x?.quantity ?? x?.missing ?? 1),unit:UNITS.includes(x?.unit)?x.unit:(x?.unit||'Stück'),done:!!x?.done};
}
function migrate(raw){
  const base=freshData();
  if(!raw || typeof raw!=='object') return base;
  const d={...base,...raw};
  d.settings={...base.settings,...(raw.settings||{})};
  d.taste={...base.taste,...(raw.taste||{})};
  d.taste.keywordScores={...(raw.taste?.keywordScores||{})};
  d.taste.seenRecommendations=Array.isArray(raw.taste?.seenRecommendations)?raw.taste.seenRecommendations.slice(-150):[];
  d.recipes=(Array.isArray(raw.recipes)&&raw.recipes.length?raw.recipes:base.recipes).map(r=>({
    id:r.id||uid(), title:r.title||'Rezept', emoji:r.emoji||'🍽️', image:r.image||'', time:parseNum(r.time)||30, servings:parseInt(r.servings)||2,
    tags:Array.isArray(r.tags)?r.tags.filter(Boolean):[], favorite:!!r.favorite, rating:parseInt(r.rating)||0, cookedCount:parseInt(r.cookedCount)||0, lastCooked:r.lastCooked||null,
    ingredients:(r.ingredients||[]).map(normalizeIngredient), steps:Array.isArray(r.steps)?r.steps.filter(Boolean):[], nutrition:r.nutrition||{}, source:r.source||null
  }));
  d.pantry=(raw.pantry||[]).map(normalizePantryItem).filter(x=>x.name);
  d.shopping=(raw.shopping||[]).map(normalizeShoppingItem).filter(x=>x.name);
  d.planner={};
  Object.entries(raw.planner||{}).forEach(([k,v])=>{
    if(typeof v==='string') d.planner[k]={breakfast:[],lunch:[v],dinner:[]};
    else {
      const obj=v||{};
      d.planner[k]={
        breakfast:normalizeMealList(obj.breakfast),
        lunch:normalizeMealList(obj.lunch),
        dinner:normalizeMealList(obj.dinner)
      };
    }
  });
  d.schema=APP_VERSION;
  return d;
}
function load(){ try{ const raw=localStorage.getItem(STORE_KEY); return migrate(raw?JSON.parse(raw):null); }catch{ return freshData(); } }
function save(renderAfter=true){ localStorage.setItem(STORE_KEY,JSON.stringify(data)); if(renderAfter) render(); }

let data=load();
let view='home';
let recipeTab='mine';
let stockTab='shopping';
let recipeFilter='all';
let search='';
let exploreQuery='Schnelle Gerichte';
let exploreItems=[];
let exploreLoading=false;
let exploreError='';
let recItems=[];
let recLoading=false;
let recError='';
let recCycle=0;
let modal=null;
let toastTimer=null;
let barcodeScanner=null;
let barcodeScanBusy=false;
let stockFabOpen=false;

function applyTheme(){
  const pref=data.settings.theme||'system';
  const dark=pref==='dark'||(pref==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
  const meta=$('meta[name="theme-color"]'); if(meta) meta.content=dark?'#111310':'#f7f6f2';
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{ if(data.settings.theme==='system') applyTheme(); });

function flash(msg){
  const t=$('#toast'); if(!t)return; clearTimeout(toastTimer); t.textContent=msg; t.hidden=false;
  toastTimer=setTimeout(()=>t.hidden=true,2400);
}
function fmtQty(q,u){
  q=parseNum(q); if(!q)return '';
  const n=Number.isInteger(q)?String(q):q.toLocaleString('de-DE',{maximumFractionDigits:2});
  return `${n} ${u||''}`.trim();
}
function normalizeUnit(q,u){
  q=parseNum(q); if(u==='kg')return[q*1000,'g']; if(u==='l')return[q*1000,'ml']; return[q,u];
}
function convertFromBase(q,u,target){
  if(u==='g'&&target==='kg') return q/1000; if(u==='ml'&&target==='l')return q/1000; return q;
}
function sameKind(u1,u2){ return u1===u2 || (['g','kg'].includes(u1)&&['g','kg'].includes(u2)) || (['ml','l'].includes(u1)&&['ml','l'].includes(u2)); }
function pantryAvailable(name,unit){
  let total=0,baseUnit=unit;
  for(const p of data.pantry){ if(p.name.toLowerCase()===name.toLowerCase()&&sameKind(p.unit,unit)){ const [q,u]=normalizeUnit(p.quantity,p.unit); total+=q; baseUnit=u; } }
  const [,reqBase]=normalizeUnit(1,unit);
  return {quantity:convertFromBase(total,reqBase,unit),unit};
}
function recipeById(id){ return data.recipes.find(r=>r.id===id); }
function plannedRecipeCount(){ return Object.values(data.planner).reduce((n,p)=>n+MEALS.reduce((sum,[m])=>sum+normalizeMealList(p?.[m]).length,0),0); }

function nav(){
  return `<nav class="bottom-nav">
    ${[['home','⌂','Start'],['recipes','◫','Rezepte'],['plan','▦','Plan'],['shopping','✓','Einkauf']].map(([id,icon,label])=>`<button class="nav-btn ${view===id?'active':''}" data-nav="${id}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join('')}
  </nav>`;
}
function topbar(title='MealMate'){
  return `<div class="topbar"><div class="brand"><div class="brand-mark">🍴</div><div><h1>${esc(title)}</h1><small>Deine private Koch-App</small></div></div><button class="icon-btn" data-action="settings" aria-label="Einstellungen">⚙️</button></div>`;
}
function appShell(body){ return `<div class="app-shell"><div class="content">${body}</div>${nav()}${modal||''}</div>`; }

function homeView(){
  const cooked=data.recipes.reduce((n,r)=>n+(r.cookedCount||0),0);
  const fav=data.recipes.filter(r=>r.favorite).length;
  return `${topbar()}<section class="hero"><h2>Was möchtest du heute essen?</h2><p>MealMate lernt aus deinen gespeicherten, bewerteten und gekochten Rezepten und sucht passende neue Ideen bei Chefkoch.</p><div class="hero-stats"><div class="stat"><b>${data.recipes.length}</b><span>Rezepte</span></div><div class="stat"><b>${fav}</b><span>Favoriten</span></div><div class="stat"><b>${cooked}</b><span>gekocht</span></div></div></section>
  <div class="section-head"><div><h2>Für dich empfohlen</h2><p>Neue Vorschläge aus Chefkoch – passend zu deinem Geschmack.</p></div><button class="text-btn" data-action="refreshRecommendations">↻ Tauschen</button></div>
  ${recommendationHtml()}
  <div class="section-head"><div><h2>Heute im Plan</h2></div><button class="text-btn" data-nav="plan">Öffnen</button></div>${todayPlanHtml()}`;
}
function recommendationHtml(){
  if(recLoading) return `<div class="loader">Passende Chefkoch-Rezepte werden gesucht …</div>`;
  if(recError && !recItems.length) return `<div class="notice">${esc(recError)}<br><button class="secondary" style="margin-top:10px" data-action="refreshRecommendations">Erneut versuchen</button></div>`;
  if(!recItems.length) return `<div class="loader">Empfehlungen werden vorbereitet …</div>`;
  return `<div class="grid">${recItems.slice(0,4).map(r=>chefCard(r,true)).join('')}</div>`;
}
function todayPlanHtml(){
  const p=data.planner[todayKey()]||emptyPlan();
  const rows=[];
  MEALS.forEach(([m,label,icon])=>normalizeMealList(p[m]).forEach(id=>{
    const r=recipeById(id);
    rows.push(`<div class="list-card"><div class="meal-thumb">${r?.image?`<img src="${esc(r.image)}" alt="">`:r?.emoji||icon}</div><div class="list-main"><b>${esc(r?.title||'Unbekanntes Rezept')}</b><small>${label}</small></div></div>`);
  }));
  return rows.length?rows.join(''):`<div class="notice">Für heute ist noch nichts geplant.</div>`;
}

function recipesView(){
  return `${topbar('Rezepte')}<div class="tabs"><button class="tab ${recipeTab==='mine'?'active':''}" data-recipe-tab="mine">Meine Rezepte</button><button class="tab ${recipeTab==='explore'?'active':''}" data-recipe-tab="explore">Erkunden</button></div>${recipeTab==='mine'?myRecipesHtml():exploreHtml()}`;
}
function myRecipesHtml(){
  const filtered=data.recipes.filter(r=>{
    const q=search.trim().toLowerCase();
    const okQ=!q||`${r.title} ${(r.tags||[]).join(' ')} ${(r.ingredients||[]).map(i=>i.name).join(' ')}`.toLowerCase().includes(q);
    const okF=recipeFilter==='all'||(recipeFilter==='favorite'&&r.favorite)||(recipeFilter==='cooked'&&r.cookedCount>0);
    return okQ&&okF;
  });
  return `<div class="search-row"><input class="input" id="recipeSearch" placeholder="Rezepte durchsuchen …" value="${esc(search)}"></div><div class="chips"><button class="chip ${recipeFilter==='all'?'active':''}" data-filter="all">Alle</button><button class="chip ${recipeFilter==='favorite'?'active':''}" data-filter="favorite">Favoriten</button><button class="chip ${recipeFilter==='cooked'?'active':''}" data-filter="cooked">Schon gekocht</button></div>
    ${filtered.length?`<div class="grid">${filtered.map(recipeCard).join('')}</div>`:`<div class="empty-state"><div class="big">🍽️</div>Keine passenden Rezepte gefunden.</div>`}<button class="fab" data-action="addRecipe" aria-label="Rezept hinzufügen">＋</button>`;
}
function exploreHtml(){
  const chips=['Schnelle Gerichte','Lasagne','Hähnchen','Pasta','Kartoffeln','Vegetarisch','Auflauf','Pfannkuchen'];
  return `<form class="search-row" id="exploreForm"><input class="input" name="q" placeholder="Chefkoch durchsuchen …" value="${esc(exploreQuery)}"><button class="primary">Suchen</button></form><div class="chips">${chips.map(q=>`<button class="chip ${q===exploreQuery?'active':''}" data-explore="${esc(q)}">${esc(q)}</button>`).join('')}</div>${exploreLoading?`<div class="loader">Chefkoch wird geladen …</div>`:exploreError?`<div class="notice">${esc(exploreError)}</div>`:exploreItems.length?`<div class="grid">${exploreItems.map(x=>chefCard(x,false)).join('')}</div>`:`<div class="loader">Rezepte werden vorbereitet …</div>`}`;
}
function recipeCard(r){
  return `<article class="recipe-card" data-open-recipe="${esc(r.id)}"><div class="recipe-image-wrap">${r.image?`<img class="recipe-image" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">`:`<div class="recipe-placeholder">${esc(r.emoji||'🍽️')}</div>`}</div><div class="recipe-body"><h3 class="recipe-title">${esc(r.title)}</h3><div class="recipe-meta">${r.time||30} Min. · ${r.servings||2} Portionen</div><div class="card-actions"><button class="fav ${r.favorite?'active':''}" data-action="favorite" data-id="${r.id}">${r.favorite?'♥':'♡'} Merken</button><button data-action="planRecipe" data-id="${r.id}">＋ Plan</button></div></div></article>`;
}
function chefCard(r,personal){
  return `<article class="recipe-card"><div class="recipe-image-wrap">${r.image?`<img class="recipe-image" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy" referrerpolicy="no-referrer">`:`<div class="recipe-placeholder">🍽️</div>`}</div><div class="recipe-body"><h3 class="recipe-title">${esc(r.title)}</h3><div class="recipe-meta">${esc(r.meta||'Chefkoch')}</div>${personal?`<div class="recipe-meta">✨ Für dich ausgewählt</div>`:''}<div class="card-actions"><button data-action="saveChef" data-url="${esc(r.url)}">♡ Merken</button><button data-action="planChef" data-url="${esc(r.url)}">＋ Plan</button><button data-action="openChef" data-url="${esc(r.url)}">Original</button></div></div></article>`;
}

function planView(){
  const days=[0,1,2,3,4,5,6].map(addDays);
  return `${topbar('Wochenplan')}<div class="section-head"><div><h2>Deine Woche</h2><p>Gericht kurz gedrückt halten und dann an die gewünschte Stelle ziehen. Nach links wischen zeigt „Löschen“.</p></div><button class="text-btn" data-action="autoPlan">Auto-Plan</button></div>${days.map(planDayHtml).join('')}<button class="secondary" style="width:100%;margin-top:4px" data-action="planToShopping">Zutaten der Woche zur Einkaufsliste</button>`;
}
function planDayHtml(d){
  const k=todayKey(d),p=data.planner[k]||emptyPlan();
  const weekday=d.toLocaleDateString('de-DE',{weekday:'long'}),date=d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'});
  return `<section class="plan-day"><div class="day-title"><h3>${weekday}</h3><span>${date}</span></div>${MEALS.map(([m,label,icon])=>mealGroupHtml(k,m,label,icon,normalizeMealList(p[m]))).join('')}</section>`;
}
function mealGroupHtml(day,meal,label,icon,ids){
  const cards=ids.map((id,index)=>{
    const r=recipeById(id); if(!r)return'';
    return `<div class="swipe-shell"><button class="swipe-delete" data-delete-slot="${day}|${meal}|${index}">Löschen</button><div class="meal-slot" data-slot="${day}|${meal}|${index}" data-recipe-id="${r.id}"><div class="meal-thumb">${r.image?`<img src="${esc(r.image)}" alt="">`:esc(r.emoji||'🍽️')}</div><div class="meal-info"><b>${esc(r.title)}</b><small>${r.time||30} Min.</small></div></div></div>`;
  }).join('');
  const content=ids.length
    ? `${cards}<div class="meal-slot empty-slot meal-add-target" data-add-slot="${day}|${meal}">＋ Zu ${label} hinzufügen</div>`
    : `<div class="meal-slot empty-slot" data-empty-slot="${day}|${meal}">＋ Gericht wählen</div>`;
  return `<div class="meal-row"><div class="meal-label">${icon} ${label}</div><div class="meal-stack" data-drop-slot="${day}|${meal}">${content}</div></div>`;
}

function shoppingView(){
  return `${topbar('Einkauf & Vorrat')}<div class="tabs"><button class="tab ${stockTab==='shopping'?'active':''}" data-stock-tab="shopping">Einkaufsliste</button><button class="tab ${stockTab==='pantry'?'active':''}" data-stock-tab="pantry">Vorrat</button></div>${stockTab==='shopping'?shoppingHtml():pantryHtml()}`;
}
function shoppingHtml(){
  const sorted=[...data.shopping].sort((a,b)=>Number(a.done)-Number(b.done));
  return `${sorted.length?sorted.map(x=>`<div class="list-card ${x.done?'done':''}"><button class="check ${x.done?'checked':''}" data-check-shopping="${x.id}">${x.done?'✓':''}</button><div class="list-main"><b>${esc(x.name)}</b><small>${x.done?'Erledigt':'Noch einkaufen'}</small></div><span class="qty-badge">${esc(fmtQty(x.quantity,x.unit))}</span>${x.done?`<button class="mini-icon" data-move-pantry="${x.id}" title="In Vorrat">＋🥫</button>`:''}<button class="mini-icon" data-remove-shopping="${x.id}">✕</button></div>`).join(''):`<div class="empty-state"><div class="big">🛒</div>Deine Einkaufsliste ist leer.</div>`}<button class="fab" data-action="addShopping">＋</button>`;
}
function pantryHtml(){
  return `${data.pantry.length?data.pantry.map(x=>`<div class="list-card">${x.image?`<img class="stock-thumb" src="${esc(x.image)}" alt="">`:''}<div class="list-main"><b>${esc(x.name)}</b><small>${x.barcode?`Strichcode ${esc(x.barcode)} · `:''}Im Vorrat</small></div><span class="qty-badge">${esc(fmtQty(x.quantity,x.unit))}</span><button class="mini-icon" data-remove-pantry="${x.id}">✕</button></div>`).join(''):`<div class="empty-state"><div class="big">🥫</div>Noch keine Vorräte eingetragen.<br><br>Tippe unten rechts auf ＋ und wähle manuelle Eingabe oder Strichcode-Scan.</div>`}<div class="stock-fab-wrap ${stockFabOpen?'open':''}" id="stockFabWrap"><div class="stock-fab-menu" aria-hidden="${stockFabOpen?'false':'true'}"><button class="stock-fab-action" data-action="scanBarcode"><span class="stock-fab-action-icon">▣</span><span><b>Strichcode scannen</b><small>Produkt mit der Kamera erfassen</small></span></button><button class="stock-fab-action" data-action="addPantry"><span class="stock-fab-action-icon">✎</span><span><b>Manuell eingeben</b><small>Produkt und Menge selbst eintragen</small></span></button></div><button class="fab stock-fab-toggle" data-stock-fab-toggle aria-expanded="${stockFabOpen?'true':'false'}" aria-label="Vorrat hinzufügen"><span>＋</span></button></div>`;
}

function settingsModal(){
  const theme=data.settings.theme||'system';
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Einstellungen</h2><button class="close" data-close>×</button></div><div class="detail-block"><h3>Darstellung</h3><div class="theme-choice"><button class="${theme==='light'?'active':''}" data-theme-choice="light">☀️ Hell</button><button class="${theme==='dark'?'active':''}" data-theme-choice="dark">🌙 Dunkel</button><button class="${theme==='system'?'active':''}" data-theme-choice="system">◐ Automatisch</button></div></div><div class="detail-block"><h3>Daten</h3><p style="color:var(--muted)">Deine Rezepte, Bewertungen, Vorräte und Lernwerte bleiben lokal auf diesem Gerät gespeichert.</p></div></section></div>`;
}
function recipeModal(r){
  if(!r)return'';
  const ingredients=(r.ingredients||[]).map(i=>{const av=pantryAvailable(i.name,i.unit);const missing=Math.max(0,parseNum(i.quantity)-av.quantity);return `<div class="ingredient"><span>${esc(i.name)}</span><small>${esc(fmtQty(i.quantity,i.unit))}${av.quantity?` · Vorrat ${esc(fmtQty(av.quantity,i.unit))}${missing?` · fehlt ${esc(fmtQty(missing,i.unit))}`:' · vorhanden'}`:''}</small></div>`}).join('');
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${esc(r.title)}</h2><button class="close" data-close>×</button></div>${r.image?`<img class="detail-image" src="${esc(r.image)}" alt="${esc(r.title)}">`:`<div class="recipe-placeholder" style="border-radius:20px">${esc(r.emoji||'🍽️')}</div>`}<div class="card-actions"><button class="fav ${r.favorite?'active':''}" data-action="favorite" data-id="${r.id}">${r.favorite?'♥ Favorit':'♡ Favorit'}</button><button data-action="cooked" data-id="${r.id}">✓ Heute gekocht</button><button data-action="planRecipe" data-id="${r.id}">＋ Plan</button></div><div class="detail-block"><h3>Deine Bewertung</h3><div class="rating">${[1,2,3,4,5].map(n=>`<button class="star ${n<=(r.rating||0)?'':'off'}" data-rate="${r.id}|${n}">★</button>`).join('')}</div></div><div class="detail-block"><h3>Zutaten</h3>${ingredients||'<p>Keine Zutaten hinterlegt.</p>'}<button class="secondary" style="width:100%;margin-top:10px" data-action="recipeToShopping" data-id="${r.id}">Fehlende Zutaten einkaufen</button></div><div class="detail-block"><h3>Zubereitung</h3>${(r.steps||[]).map((s,i)=>`<div class="step"><span class="step-num">${i+1}</span><span>${esc(s)}</span></div>`).join('')||'<p>Keine Schritte hinterlegt.</p>'}</div>${r.source?.url?`<button class="secondary" style="width:100%;margin-top:12px" data-action="openChef" data-url="${esc(r.source.url)}">Original bei Chefkoch</button>`:''}</section></div>`;
}
function pickerModal(recipeId){
  const r=recipeById(recipeId); if(!r)return'';
  const days=[0,1,2,3,4,5,6].map(addDays);
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${esc(r.title)} planen</h2><button class="close" data-close>×</button></div><p class="modal-hint">Grün markierte Mahlzeiten enthalten bereits mindestens ein Gericht. Du kannst trotzdem weitere hinzufügen.</p>${days.map(d=>{const k=todayKey(d),p=data.planner[k]||emptyPlan();return `<div class="detail-block"><b>${d.toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'})}</b><div class="card-actions meal-choices">${MEALS.map(([m,l])=>{const count=normalizeMealList(p[m]).length;return `<button class="meal-choice ${count?'occupied':''}" data-place="${k}|${m}|${r.id}">${l}${count?` · ${count}`:''}</button>`}).join('')}</div></div>`}).join('')}</section></div>`;
}
function chooseRecipeModal(day,meal){
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Gericht wählen</h2><button class="close" data-close>×</button></div><div class="grid">${data.recipes.map(r=>`<article class="recipe-card" data-pick="${day}|${meal}|${r.id}"><div class="recipe-image-wrap">${r.image?`<img class="recipe-image" src="${esc(r.image)}" alt="">`:`<div class="recipe-placeholder">${esc(r.emoji||'🍽️')}</div>`}</div><div class="recipe-body"><h3 class="recipe-title">${esc(r.title)}</h3></div></article>`).join('')}</div></section></div>`;
}
function addItemModal(kind){
  const title=kind==='pantry'?'Vorrat hinzufügen':'Zur Einkaufsliste';
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${title}</h2><button class="close" data-close>×</button></div><form id="itemForm" data-kind="${kind}" class="form-grid"><input class="input" name="name" placeholder="z. B. Milch" required><div class="form-row"><input class="input" name="quantity" inputmode="decimal" placeholder="Menge" required><select class="input" name="unit">${UNITS.map(u=>`<option>${u}</option>`).join('')}</select><button class="primary">Speichern</button></div></form></section></div>`;
}

function barcodeScannerModal(message='Richte die Kamera auf den Strichcode des Produkts.'){
  return `<div class="modal-back"><section class="modal barcode-modal"><div class="modal-head"><h2>Strichcode scannen</h2><button class="close" data-close>×</button></div><p class="modal-hint">${esc(message)}</p><div id="barcode-reader" class="barcode-reader"><div class="scanner-placeholder">📷<br><small>Kamera wird gestartet …</small></div></div><div class="barcode-guide"><span></span></div><div class="detail-block"><h3>Oder Nummer eingeben</h3><form id="barcodeManualForm" class="search-row"><input class="input" name="barcode" inputmode="numeric" autocomplete="off" placeholder="EAN / UPC" required><button class="primary">Suchen</button></form></div></section></div>`;
}
function parsePackageQuantity(product){
  const raw=String(product?.quantity||'').trim();
  let m=raw.match(/([\d.,]+)\s*(kg|g|ml|l)\b/i);
  if(m){let q=parseNum(m[1]),u=m[2].toLowerCase();return {quantity:q||1,unit:u};}
  const q=parseNum(product?.product_quantity);
  let u=String(product?.product_quantity_unit||'').toLowerCase();
  if(q&&['kg','g','ml','l'].includes(u))return {quantity:q,unit:u};
  return {quantity:1,unit:'Stück'};
}
function barcodeProductModal(barcode,product=null,error=''){
  const qty=parsePackageQuantity(product||{});
  const name=(product?.product_name_de||product?.product_name||product?.product_name_en||'').trim();
  const brand=String(product?.brands||'').split(',')[0].trim();
  const image=product?.image_front_small_url||product?.image_front_url||'';
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>${product?'Produkt gefunden':'Produkt eintragen'}</h2><button class="close" data-close>×</button></div>${error?`<div class="notice">${esc(error)}</div>`:''}${image?`<div class="barcode-product-head"><img src="${esc(image)}" alt=""><div><b>${esc(name||'Unbekanntes Produkt')}</b>${brand?`<small>${esc(brand)}</small>`:''}</div></div>`:''}<form id="barcodePantryForm" class="form-grid" data-barcode="${esc(barcode)}" data-image="${esc(image)}"><label class="field-label">Produktname</label><input class="input" name="name" value="${esc(name||brand)}" placeholder="Produktname" required><label class="field-label">Menge im Vorrat</label><div class="form-row barcode-qty-row"><input class="input" name="quantity" inputmode="decimal" value="${esc(qty.quantity)}" required><select class="input" name="unit">${UNITS.map(u=>`<option ${u===qty.unit?'selected':''}>${u}</option>`).join('')}</select><button class="primary">Hinzufügen</button></div><div class="barcode-number">Strichcode: ${esc(barcode)}</div></form></section></div>`;
}
async function stopBarcodeScanner(){
  const scanner=barcodeScanner; barcodeScanner=null; barcodeScanBusy=false;
  if(scanner){try{await scanner.stop();}catch{} try{await scanner.clear();}catch{}}
}
async function lookupBarcode(barcode){
  barcode=String(barcode||'').replace(/\D/g,'');
  if(!barcode)return;
  await stopBarcodeScanner();
  modal=`<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Produkt suchen</h2><button class="close" data-close>×</button></div><div class="loader">Strichcode ${esc(barcode)} wird gesucht …</div></section></div>`;render();
  try{
    const fields='code,product_name,product_name_de,product_name_en,brands,quantity,product_quantity,product_quantity_unit,image_front_small_url,image_front_url';
    const res=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,{headers:{Accept:'application/json'}});
    if(!res.ok)throw new Error();
    const json=await res.json();
    if(json.status===1&&json.product) modal=barcodeProductModal(barcode,json.product);
    else modal=barcodeProductModal(barcode,null,'Das Produkt wurde nicht in der Produktdatenbank gefunden. Du kannst den Namen trotzdem selbst eintragen.');
  }catch{
    modal=barcodeProductModal(barcode,null,'Die Produktdatenbank ist gerade nicht erreichbar. Du kannst das Produkt trotzdem manuell eintragen.');
  }
  render();
}
async function startBarcodeScanner(){
  const el=$('#barcode-reader'); if(!el)return;
  if(typeof Html5Qrcode==='undefined'){
    el.innerHTML='<div class="notice">Der Kamera-Scanner konnte nicht geladen werden. Du kannst den Strichcode unten manuell eingeben.</div>';
    return;
  }
  try{
    const formats=(window.Html5QrcodeSupportedFormats?[
      Html5QrcodeSupportedFormats.EAN_13,Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128
    ]:undefined);
    barcodeScanner=new Html5Qrcode('barcode-reader',formats?{formatsToSupport:formats,verbose:false}:{verbose:false});
    const qrbox=(w,h)=>({width:Math.min(Math.floor(w*.86),360),height:Math.min(Math.floor(h*.34),150)});
    await barcodeScanner.start({facingMode:'environment'},{fps:12,qrbox,aspectRatio:1.55},async decoded=>{
      if(barcodeScanBusy)return; barcodeScanBusy=true; try{navigator.vibrate?.(20);}catch{} await lookupBarcode(decoded);
    },()=>{});
  }catch(e){
    barcodeScanner=null;
    const target=$('#barcode-reader');if(target)target.innerHTML='<div class="notice">Die Kamera konnte nicht geöffnet werden. Erlaube MealMate den Kamerazugriff oder gib den Strichcode unten ein.</div>';
  }
}
function addPantryProduct(item){
  const name=String(item.name||'').trim(),quantity=parseNum(item.quantity),unit=String(item.unit||'Stück'); if(!name||!quantity)return false;
  const existing=data.pantry.find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.unit===unit);
  if(existing){existing.quantity+=quantity;if(item.barcode&&!existing.barcode)existing.barcode=item.barcode;if(item.image&&!existing.image)existing.image=item.image;}
  else data.pantry.push({id:uid(),name,quantity,unit,barcode:item.barcode||'',image:item.image||''});
  return true;
}

function addRecipeModal(){
  return `<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Rezept hinzufügen</h2><button class="close" data-close>×</button></div><form id="recipeForm" class="form-grid"><input class="input" name="title" placeholder="Name des Rezepts" required><input class="input" name="image" placeholder="Bild-URL (optional)"><input class="input" name="tags" placeholder="Tags, z. B. Pasta, schnell"><textarea class="input" name="ingredients" rows="6" placeholder="Zutaten, eine pro Zeile\nz. B. 250 g Pasta"></textarea><textarea class="input" name="steps" rows="6" placeholder="Zubereitung, ein Schritt pro Zeile"></textarea><button class="primary">Rezept speichern</button></form><div class="detail-block"><h3>Oder von Chefkoch importieren</h3><form id="importForm" class="search-row"><input class="input" name="url" type="url" placeholder="Chefkoch-Rezeptlink" required><button class="primary">Importieren</button></form></div></section></div>`;
}
function embeddedChefModal(url,srcdoc=''){
  if(srcdoc){const safe=srcdoc.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<head([^>]*)>/i,`<head$1><base href="https://www.chefkoch.de/">`);return `<div class="modal-back"><section class="modal chef-browser"><div class="modal-head"><h2>Originalrezept bei Chefkoch</h2><button class="close" data-close>×</button></div><iframe class="chef-frame" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin" srcdoc="${esc(safe)}"></iframe></section></div>`;}
  return `<div class="modal-back"><section class="modal chef-browser"><div class="modal-head"><h2>Originalrezept bei Chefkoch</h2><button class="close" data-close>×</button></div><div class="embedded-loading">Originalrezept wird geladen …</div></section></div>`;
}

function chefUrl(q){ return `https://www.chefkoch.de/rs/s0/${encodeURIComponent(q)}/Rezepte.html`; }
function proxyUrl(target){ return `${CHEF_PROXY}/proxy?url=${encodeURIComponent(target)}`; }
async function proxyFetchText(url){
  const res=await fetch(proxyUrl(url),{headers:{Accept:'text/html'}});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}
function resolveImage(img){
  if(!img)return'';
  let raw=img.getAttribute('src')||img.getAttribute('data-src')||img.getAttribute('data-lazy-src')||'';
  const srcset=img.getAttribute('srcset')||img.getAttribute('data-srcset')||'';
  if(srcset){const parts=srcset.split(',').map(x=>x.trim().split(/\s+/)[0]).filter(Boolean); if(parts.length) raw=parts[parts.length-1];}
  try{return raw?new URL(raw,'https://www.chefkoch.de').href:''}catch{return''}
}
function parseChefResults(html){
  const doc=new DOMParser().parseFromString(html,'text/html'),out=[],seen=new Set();
  $$('a[href*="/rezepte/"]',doc).forEach(a=>{
    let href=a.getAttribute('href')||''; try{href=new URL(href,'https://www.chefkoch.de').href}catch{return}
    if(!/chefkoch\.de\/rezepte\/\d+/i.test(href)||seen.has(href))return;
    const box=a.closest('article,li,[class*="recipe"],[class*="result"],[class*="card"]')||a.parentElement;
    const title=(a.querySelector('h2,h3,[class*="title"]')?.textContent||a.getAttribute('title')||a.textContent||box?.querySelector('h2,h3')?.textContent||'').replace(/\s+/g,' ').trim();
    if(title.length<3||title.length>180)return;
    const image=resolveImage(box?.querySelector('img')||a.querySelector('img'));
    const text=(box?.textContent||'').replace(/\s+/g,' ').trim();
    const tm=text.match(/\b\d+\s*Min\.?/i)?.[0]||'';
    seen.add(href); out.push({title,url:href,image,meta:tm?`${tm} · Chefkoch`:'Chefkoch'});
  });
  return out;
}
function jsonLdRecipe(doc){
  for(const s of $$('script[type="application/ld+json"]',doc)){
    try{const raw=JSON.parse(s.textContent),nodes=Array.isArray(raw)?raw:(raw?.['@graph']||[raw]);const r=nodes.find(x=>{const t=x?.['@type'];return t==='Recipe'||(Array.isArray(t)&&t.includes('Recipe'))});if(r)return r}catch{}
  }
  return null;
}
function durationMinutes(v){if(!v)return 30;const h=+(String(v).match(/(\d+)H/)?.[1]||0),m=+(String(v).match(/(\d+)M/)?.[1]||0);return h*60+m||30}
function instructionText(x){if(Array.isArray(x))return x.flatMap(i=>i?.itemListElement?instructionText(i.itemListElement):(typeof i==='string'?[i]:[i?.text||i?.name].filter(Boolean)));if(typeof x==='string')return[x];return[]}
function recipeImageValue(v){if(Array.isArray(v)){const x=v[0];return typeof x==='string'?x:(x?.url||'')}return typeof v==='object'?(v?.url||''):(v||'')}
function parseIngredientText(line){
  line=String(line||'').trim();
  const m=line.match(/^([\d.,]+)\s*(kg|g|ml|l|Stück|Stk\.?)?\s+(.+)$/i);
  if(!m)return{name:line,quantity:0,unit:''};
  let unit=m[2]||''; if(/^stk/i.test(unit))unit='Stück';
  return{name:m[3].trim(),quantity:parseNum(m[1]),unit};
}
async function fetchChefRecipe(url){
  const html=await proxyFetchText(url),doc=new DOMParser().parseFromString(html,'text/html'),r=jsonLdRecipe(doc);
  if(!r)throw new Error('Keine strukturierten Rezeptdaten gefunden.');
  const kws=[];
  const add=v=>{if(Array.isArray(v))v.forEach(add);else if(v)String(v).split(',').forEach(x=>kws.push(x.trim()))}; add(r.recipeCategory);add(r.recipeCuisine);add(r.keywords);
  return {id:uid(),title:r.name||'Chefkoch-Rezept',emoji:'🍽️',image:recipeImageValue(r.image),time:durationMinutes(r.totalTime||r.prepTime),servings:parseInt(String(r.recipeYield||'2'))||2,tags:[...new Set(kws.filter(Boolean))].slice(0,12),ingredients:(r.recipeIngredient||[]).map(parseIngredientText),steps:instructionText(r.recipeInstructions),nutrition:{kcal:parseInt(r.nutrition?.calories)||null,protein:parseInt(r.nutrition?.proteinContent)||null,carbs:parseInt(r.nutrition?.carbohydrateContent)||null},favorite:false,rating:0,cookedCount:0,lastCooked:null,source:{name:'Chefkoch',url}};
}
async function enrichCards(items,limit=8){
  const arr=items.slice(0,limit);
  await Promise.all(arr.map(async x=>{if(x.image)return;try{const r=await fetchChefRecipe(x.url);x.image=r.image;x.meta=`${r.time} Min. · Chefkoch`;x.tags=r.tags}catch{}}));
  return items;
}

function keywordsFromRecipe(r){
  const list=[...(r.tags||[]),...(r.ingredients||[]).slice(0,6).map(i=>i.name),...String(r.title||'').split(/[^A-Za-zÄÖÜäöüß]+/)];
  return [...new Set(list.map(x=>String(x).trim().toLowerCase()).filter(x=>x.length>=3&&!STOPWORDS.has(x)))];
}
function learnFromRecipe(r,weight){
  if(!r)return; for(const k of keywordsFromRecipe(r).slice(0,12)) data.taste.keywordScores[k]=(data.taste.keywordScores[k]||0)+weight;
  data.taste.interactions=(data.taste.interactions||0)+1;
}
function rebuildTasteFromHistory(){
  const scores={}; const old=data.taste.keywordScores||{};
  data.recipes.forEach(r=>{
    const w=(r.favorite?3:0)+(r.rating||0)*1.4+Math.min(r.cookedCount||0,5)*2;
    if(!w)return; keywordsFromRecipe(r).forEach(k=>scores[k]=(scores[k]||0)+w);
  });
  for(const[k,v]of Object.entries(old))scores[k]=(scores[k]||0)+v*.35;
  data.taste.keywordScores=scores;
}
function personalizedQueries(){
  rebuildTasteFromHistory();
  const ranked=Object.entries(data.taste.keywordScores).sort((a,b)=>b[1]-a[1]).map(([k])=>k).filter(k=>!/^\d+$/.test(k));
  const unique=[]; for(const x of ranked){const pretty=x.charAt(0).toUpperCase()+x.slice(1);if(!unique.includes(pretty))unique.push(pretty);if(unique.length>=10)break;}
  return unique.length?unique:DEFAULT_SEARCHES;
}
async function loadRecommendations(force=false){
  if(recLoading)return; recLoading=true;recError='';render();
  try{
    const qs=personalizedQueries();
    const q=qs[recCycle%qs.length]||DEFAULT_SEARCHES[recCycle%DEFAULT_SEARCHES.length];
    recCycle++;
    let items=parseChefResults(await proxyFetchText(chefUrl(q)));
    const seen=new Set(data.taste.seenRecommendations||[]);
    let fresh=items.filter(x=>!seen.has(x.url)); if(fresh.length<4)fresh=items;
    fresh=fresh.sort(()=>Math.random()-.5);
    await enrichCards(fresh,6);
    recItems=fresh.slice(0,6);
    if(!recItems.length)throw new Error('Keine Vorschläge gefunden.');
    data.taste.seenRecommendations=[...seen,...recItems.map(x=>x.url)].slice(-120); save(false);
  }catch(e){recError='Die persönlichen Chefkoch-Empfehlungen konnten gerade nicht geladen werden.';}
  recLoading=false;render();
}
async function loadExplore(q=exploreQuery){
  exploreQuery=(q||'Schnelle Gerichte').trim();exploreLoading=true;exploreError='';render();
  try{let items=parseChefResults(await proxyFetchText(chefUrl(exploreQuery)));await enrichCards(items,10);exploreItems=items.slice(0,30);if(!exploreItems.length)throw new Error();}
  catch{exploreItems=[];exploreError='Chefkoch konnte über deinen Worker gerade nicht geladen werden.';}
  exploreLoading=false;render();
}

function addShoppingRequirement(name,quantity,unit){
  if(!name||!quantity)return;
  const av=pantryAvailable(name,unit).quantity;
  const already=data.shopping.filter(x=>!x.done&&x.name.toLowerCase()===name.toLowerCase()&&sameKind(x.unit,unit)).reduce((s,x)=>{const [q]=normalizeUnit(x.quantity,x.unit);const [,baseU]=normalizeUnit(1,unit);return s+convertFromBase(q,baseU,unit)},0);
  const missing=Math.max(0,quantity-av-already); if(missing<=0)return;
  const existing=data.shopping.find(x=>!x.done&&x.name.toLowerCase()===name.toLowerCase()&&x.unit===unit);
  if(existing)existing.quantity+=missing;else data.shopping.push({id:uid(),name,quantity:missing,unit,done:false});
}
function recipeToShopping(r){(r.ingredients||[]).forEach(i=>addShoppingRequirement(i.name,parseNum(i.quantity),i.unit));}
function plannerToShopping(){
  const needs={};
  Object.values(data.planner).forEach(p=>MEALS.forEach(([m])=>normalizeMealList(p?.[m]).forEach(id=>{const r=recipeById(id);if(!r)return;(r.ingredients||[]).forEach(i=>{const key=`${i.name.toLowerCase()}|${i.unit}`;needs[key]??={name:i.name,quantity:0,unit:i.unit};needs[key].quantity+=parseNum(i.quantity);});})));
  Object.values(needs).forEach(i=>addShoppingRequirement(i.name,i.quantity,i.unit)); save(); flash('Fehlende Zutaten wurden zur Einkaufsliste hinzugefügt.');
}
function autoPlan(){
  if(!data.recipes.length)return;
  const weighted=[...data.recipes].sort((a,b)=>((b.rating||0)*2+(b.favorite?3:0)+(b.cookedCount||0)) - ((a.rating||0)*2+(a.favorite?3:0)+(a.cookedCount||0)));
  let ix=Math.floor(Math.random()*weighted.length);
  [0,1,2,3,4,5,6].forEach(n=>{const k=todayKey(addDays(n));data.planner[k]??=emptyPlan();MEALS.forEach(([m])=>{data.planner[k][m]=[weighted[ix++%weighted.length].id];});});save();flash('Die Woche wurde vorgeschlagen.');
}

async function importChef(url,planAfter=false){
  try{
    let r=data.recipes.find(x=>x.source?.url===url);
    if(!r){flash('Rezept wird importiert …');r=await fetchChefRecipe(url);data.recipes.unshift(r);learnFromRecipe(r,2);save(false);}
    if(planAfter){modal=pickerModal(r.id);render();}else{r.favorite=true;learnFromRecipe(r,3);save();flash(`${r.title} wurde gemerkt.`);}
  }catch{flash('Das Rezept konnte nicht importiert werden.');}
}
async function openChefEmbedded(url){
  modal=embeddedChefModal(url);render();
  try{const html=await proxyFetchText(url);modal=embeddedChefModal(url,html);render();}
  catch{modal=`<div class="modal-back"><section class="modal"><div class="modal-head"><h2>Chefkoch</h2><button class="close" data-close>×</button></div><div class="notice">Das Originalrezept konnte nicht eingebettet werden.</div></section></div>`;render();}
}

function render(){
  applyTheme();
  const body=view==='home'?homeView():view==='recipes'?recipesView():view==='plan'?planView():shoppingView();
  $('#app').innerHTML=appShell(body);bind();
  if(view==='home'&&!recLoading&&!recItems.length&&!recError)setTimeout(()=>loadRecommendations(),0);
  if(view==='recipes'&&recipeTab==='explore'&&!exploreLoading&&!exploreItems.length&&!exploreError)setTimeout(()=>loadExplore(exploreQuery),0);
}

function bind(){
  $$('[data-nav]').forEach(b=>b.onclick=async()=>{await stopBarcodeScanner();view=b.dataset.nav;modal=null;render();});
  $$('[data-recipe-tab]').forEach(b=>b.onclick=()=>{recipeTab=b.dataset.recipeTab;render();});
  $$('[data-stock-tab]').forEach(b=>b.onclick=()=>{stockTab=b.dataset.stockTab;render();});
  $$('[data-filter]').forEach(b=>b.onclick=()=>{recipeFilter=b.dataset.filter;render();});
  $$('[data-close]').forEach(b=>b.onclick=async()=>{await stopBarcodeScanner();modal=null;render();});
  $$('[data-theme-choice]').forEach(b=>b.onclick=()=>{data.settings.theme=b.dataset.themeChoice;save(false);applyTheme();modal=settingsModal();render();});
  $$('[data-open-recipe]').forEach(card=>card.onclick=e=>{if(e.target.closest('button'))return;modal=recipeModal(recipeById(card.dataset.openRecipe));render();});
  $$('[data-action]').forEach(b=>b.onclick=e=>{e.stopPropagation();action(b.dataset.action,b.dataset.id,b.dataset.url);});
  const stockFab=$('[data-stock-fab-toggle]');if(stockFab)stockFab.onclick=e=>{e.stopPropagation();stockFabOpen=!stockFabOpen;const wrap=$('#stockFabWrap');if(wrap){wrap.classList.toggle('open',stockFabOpen);stockFab.setAttribute('aria-expanded',String(stockFabOpen));wrap.querySelector('.stock-fab-menu')?.setAttribute('aria-hidden',String(!stockFabOpen));}};
  $$('[data-rate]').forEach(b=>b.onclick=()=>{const[id,n]=b.dataset.rate.split('|');const r=recipeById(id);r.rating=+n;learnFromRecipe(r,+n);save(false);modal=recipeModal(r);render();});
  $$('[data-place]').forEach(b=>b.onclick=()=>{const[d,m,id]=b.dataset.place.split('|');addToMeal(d,m,id);learnFromRecipe(recipeById(id),1);modal=null;save();flash('Zum Wochenplan hinzugefügt.');});
  $$('[data-pick]').forEach(b=>b.onclick=()=>{const[d,m,id]=b.dataset.pick.split('|');addToMeal(d,m,id);modal=null;save();});
  $$('[data-empty-slot],[data-add-slot]').forEach(b=>b.onclick=()=>{const raw=b.dataset.emptySlot||b.dataset.addSlot;const[d,m]=raw.split('|');modal=chooseRecipeModal(d,m);render();});
  $$('[data-delete-slot]').forEach(b=>b.onclick=()=>{const[d,m,i]=b.dataset.deleteSlot.split('|');removeFromMeal(d,m,+i);save();});
  $$('[data-check-shopping]').forEach(b=>b.onclick=()=>{const x=data.shopping.find(x=>x.id===b.dataset.checkShopping);if(x){x.done=!x.done;save();}});
  $$('[data-remove-shopping]').forEach(b=>b.onclick=()=>{data.shopping=data.shopping.filter(x=>x.id!==b.dataset.removeShopping);save();});
  $$('[data-remove-pantry]').forEach(b=>b.onclick=()=>{data.pantry=data.pantry.filter(x=>x.id!==b.dataset.removePantry);save();});
  $$('[data-move-pantry]').forEach(b=>b.onclick=()=>{const x=data.shopping.find(x=>x.id===b.dataset.movePantry);if(x){data.pantry.push({id:uid(),name:x.name,quantity:x.quantity,unit:x.unit});data.shopping=data.shopping.filter(i=>i.id!==x.id);save();flash('In den Vorrat übernommen.');}});
  $$('[data-explore]').forEach(b=>b.onclick=()=>loadExplore(b.dataset.explore));
  const rs=$('#recipeSearch');if(rs)rs.oninput=e=>{search=e.target.value;render();setTimeout(()=>$('#recipeSearch')?.focus(),0)};
  const ef=$('#exploreForm');if(ef)ef.onsubmit=e=>{e.preventDefault();loadExplore(new FormData(ef).get('q'));};
  const itemForm=$('#itemForm');if(itemForm)itemForm.onsubmit=e=>{e.preventDefault();const fd=new FormData(itemForm),x={id:uid(),name:String(fd.get('name')).trim(),quantity:parseNum(fd.get('quantity')),unit:String(fd.get('unit'))};if(itemForm.dataset.kind==='pantry')data.pantry.push(x);else data.shopping.push({...x,done:false});modal=null;save();};
  const bmf=$('#barcodeManualForm');if(bmf)bmf.onsubmit=e=>{e.preventDefault();lookupBarcode(new FormData(bmf).get('barcode'));};
  const bpf=$('#barcodePantryForm');if(bpf)bpf.onsubmit=e=>{e.preventDefault();const fd=new FormData(bpf);if(addPantryProduct({name:fd.get('name'),quantity:fd.get('quantity'),unit:fd.get('unit'),barcode:bpf.dataset.barcode,image:bpf.dataset.image})){modal=null;save();flash('Produkt wurde zum Vorrat hinzugefügt.');}};
  const rf=$('#recipeForm');if(rf)rf.onsubmit=e=>{e.preventDefault();const fd=new FormData(rf);const r={id:uid(),title:String(fd.get('title')).trim(),emoji:'🍽️',image:String(fd.get('image')).trim(),time:30,servings:2,tags:String(fd.get('tags')).split(',').map(x=>x.trim()).filter(Boolean),ingredients:String(fd.get('ingredients')).split('\n').map(parseIngredientText).filter(x=>x.name),steps:String(fd.get('steps')).split('\n').map(x=>x.trim()).filter(Boolean),nutrition:{},favorite:false,rating:0,cookedCount:0,lastCooked:null,source:null};data.recipes.unshift(r);modal=null;save();};
  const im=$('#importForm');if(im)im.onsubmit=e=>{e.preventDefault();const url=String(new FormData(im).get('url')).trim();importChef(url,false);};
  bindMealGestures();
}

function action(a,id,url){
  if(a==='settings'){modal=settingsModal();render();return;}
  if(a==='refreshRecommendations'){recItems=[];recError='';loadRecommendations(true);return;}
  if(a==='favorite'){const r=recipeById(id);if(!r)return;r.favorite=!r.favorite;learnFromRecipe(r,r.favorite?3:-1);save(false);modal=modal?recipeModal(r):null;render();return;}
  if(a==='cooked'){const r=recipeById(id);if(!r)return;r.cookedCount=(r.cookedCount||0)+1;r.lastCooked=todayKey();learnFromRecipe(r,4);save(false);modal=recipeModal(r);render();flash('Als heute gekocht gespeichert.');return;}
  if(a==='planRecipe'){modal=pickerModal(id);render();return;}
  if(a==='recipeToShopping'){const r=recipeById(id);if(r){recipeToShopping(r);save();flash('Fehlende Zutaten hinzugefügt.');}return;}
  if(a==='saveChef'){importChef(url,false);return;}
  if(a==='planChef'){importChef(url,true);return;}
  if(a==='openChef'){openChefEmbedded(url);return;}
  if(a==='autoPlan'){autoPlan();return;}
  if(a==='planToShopping'){plannerToShopping();return;}
  if(a==='addShopping'){modal=addItemModal('shopping');render();return;}
  if(a==='addPantry'){stockFabOpen=false;modal=addItemModal('pantry');render();return;}
  if(a==='scanBarcode'){stockFabOpen=false;modal=barcodeScannerModal();render();setTimeout(startBarcodeScanner,120);return;}
  if(a==='addRecipe'){modal=addRecipeModal();render();return;}
  if(a==='testWorker'){fetch(`${CHEF_PROXY}/health`).then(r=>r.json()).then(j=>flash(j.ok?'Worker verbunden.':'Worker antwortet unerwartet.')).catch(()=>flash('Worker nicht erreichbar.'));return;}
}

function bindMealGestures(){
  const HOLD_MS=320;
  const PRESS_FEEDBACK_MS=110;
  const MOVE_TOLERANCE=20;
  const SWIPE_OPEN=42;
  const DELETE_WIDTH=88;
  const SCROLL_DEAD_TOP=0.28;
  const SCROLL_DEAD_BOTTOM=0.72;
  const MAX_SCROLL_SPEED=28;

  $$('.meal-slot[data-slot]').forEach(slot=>{
    let sx=0,sy=0,dx=0,dy=0,pointerId=null;
    let holdTimer=null,pressTimer=null,dragging=false,swiping=false,cancelled=false,ghost=null,source=null;
    let lastX=0,lastY=0,scrollRaf=0;

    const clearTimers=()=>{
      if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}
      if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}
      slot.classList.remove('pressing');
    };
    const clearTargets=()=>$$('.drag-over,.drag-zone-active').forEach(x=>x.classList.remove('drag-over','drag-zone-active'));
    const targetAt=(x,y)=>{
      const el=document.elementFromPoint(x,y);
      return el?.closest('.meal-stack[data-drop-slot]')||null;
    };
    const moveGhost=(x,y)=>{
      if(!ghost)return;
      ghost.style.left=`${x}px`;
      ghost.style.top=`${Math.max(72,y-64)}px`;
    };
    const updateTarget=(x,y)=>{
      clearTargets();
      $$('.meal-stack[data-drop-slot]').forEach(z=>z.classList.add('drag-zone-active'));
      const target=targetAt(x,y);
      if(target)target.classList.add('drag-over');
      return target;
    };
    const autoScroll=()=>{
      scrollRaf=0;
      if(!dragging)return;
      const h=window.innerHeight;
      const topEdge=h*SCROLL_DEAD_TOP;
      const bottomEdge=h*SCROLL_DEAD_BOTTOM;
      let speed=0;
      if(lastY<topEdge){
        const intensity=Math.min(1,(topEdge-lastY)/Math.max(1,topEdge));
        speed=-MAX_SCROLL_SPEED*Math.pow(intensity,1.35);
      }else if(lastY>bottomEdge){
        const intensity=Math.min(1,(lastY-bottomEdge)/Math.max(1,h-bottomEdge));
        speed=MAX_SCROLL_SPEED*Math.pow(intensity,1.35);
      }
      if(Math.abs(speed)>.35){
        const scroller=document.scrollingElement||document.documentElement;
        const before=scroller.scrollTop;
        scroller.scrollTop+=speed;
        if(scroller.scrollTop!==before) updateTarget(lastX,lastY);
        scrollRaf=requestAnimationFrame(autoScroll);
      }
    };
    const scheduleAutoScroll=()=>{
      if(scrollRaf)return;
      scrollRaf=requestAnimationFrame(autoScroll);
    };
    const stopAutoScroll=()=>{if(scrollRaf){cancelAnimationFrame(scrollRaf);scrollRaf=0;}};

    const startDrag=(x,y)=>{
      if(cancelled||swiping||dragging)return;
      clearTimers();
      dragging=true; source=slot.dataset.slot;
      slot.classList.remove('revealed'); slot.style.transform=''; slot.style.transition='';
      slot.classList.add('dragging'); document.body.classList.add('plan-dragging');
      const rect=slot.getBoundingClientRect();
      ghost=slot.cloneNode(true);
      ghost.classList.remove('dragging','revealed','drag-over','pressing');
      ghost.classList.add('drag-ghost');
      ghost.removeAttribute('data-slot');
      ghost.style.width=`${Math.min(rect.width,window.innerWidth-24)}px`;
      document.body.appendChild(ghost);
      moveGhost(x,y); updateTarget(x,y);
      try{navigator.vibrate?.(18);}catch{}
    };
    const stopDrag=(e,commit=true)=>{
      clearTimers();
      if(!dragging)return;
      const target=targetAt(e.clientX,e.clientY);
      const dest=target?.dataset.dropSlot;
      stopAutoScroll(); clearTargets();
      ghost?.remove(); ghost=null;
      slot.classList.remove('dragging'); document.body.classList.remove('plan-dragging'); dragging=false;
      if(commit&&dest&&source){
        try{navigator.vibrate?.(10);}catch{}
        movePlanItem(source,dest);
      }
      source=null;
    };

    slot.addEventListener('contextmenu',e=>e.preventDefault());
    slot.addEventListener('pointerdown',e=>{
      if(e.button!==undefined&&e.button!==0)return;
      if(e.target.closest('button'))return;
      sx=e.clientX; sy=e.clientY; lastX=sx; lastY=sy; dx=dy=0; pointerId=e.pointerId;
      cancelled=false; swiping=false; dragging=false;
      slot.setPointerCapture?.(pointerId);
      pressTimer=setTimeout(()=>{if(!cancelled&&!swiping)slot.classList.add('pressing');},PRESS_FEEDBACK_MS);
      holdTimer=setTimeout(()=>startDrag(sx,sy),HOLD_MS);
    });
    slot.addEventListener('pointermove',e=>{
      if(pointerId===null||e.pointerId!==pointerId)return;
      dx=e.clientX-sx; dy=e.clientY-sy; lastX=e.clientX; lastY=e.clientY;
      if(dragging){
        e.preventDefault();
        moveGhost(lastX,lastY); updateTarget(lastX,lastY); scheduleAutoScroll();
        return;
      }
      const ax=Math.abs(dx), ay=Math.abs(dy), moved=Math.hypot(dx,dy);
      if(moved>MOVE_TOLERANCE){
        clearTimers();
        if(ay>ax+10){cancelled=true;return;}
        if(ax>ay+4)swiping=true;
      }
      if(swiping){
        if(dx<0){
          e.preventDefault(); slot.style.transition='none'; slot.style.transform=`translateX(${Math.max(-DELETE_WIDTH,dx)}px)`;
        }else if(slot.classList.contains('revealed')){
          e.preventDefault(); slot.style.transition='none'; slot.style.transform=`translateX(${Math.min(0,-DELETE_WIDTH+dx)}px)`;
        }
      }
    });
    const finish=e=>{
      if(pointerId===null||(e.pointerId!==undefined&&e.pointerId!==pointerId))return;
      clearTimers();
      if(dragging)stopDrag(e,true);
      else if(swiping){
        slot.style.transition=''; slot.style.transform='';
        if(dx<-SWIPE_OPEN)slot.classList.add('revealed'); else if(dx>30)slot.classList.remove('revealed');
      }
      pointerId=null; swiping=false; cancelled=false; dx=dy=0;
    };
    slot.addEventListener('pointerup',finish);
    slot.addEventListener('pointercancel',e=>{
      clearTimers(); stopAutoScroll();
      if(dragging)stopDrag(e,false);
      slot.style.transition=''; slot.style.transform=''; slot.classList.remove('pressing');
      pointerId=null; swiping=false; cancelled=false; dx=dy=0;
    });
  });

  document.addEventListener('pointerdown',e=>{
    if(!e.target.closest('.swipe-shell'))$$('.meal-slot.revealed').forEach(x=>x.classList.remove('revealed'));
  });
}
function movePlanItem(source,dest){
  const[sd,sm,siRaw]=source.split('|'),[dd,dm]=dest.split('|'); const si=+siRaw;
  const sourceList=mealList(sd,sm); if(si<0||si>=sourceList.length)return;
  const [id]=sourceList.splice(si,1); const destList=mealList(dd,dm);
  if(!(sd===dd&&sm===dm) && !destList.includes(id)) destList.push(id);
  else if(sd===dd&&sm===dm) destList.push(id);
  save();
}

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
