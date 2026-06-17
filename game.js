/* ===================================================================
   UTILITAIRES
   =================================================================== */
const $=s=>document.querySelector(s);
const ce=(t,c)=>{let e=document.createElement(t); if(c)e.className=c; return e;};
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function fmt(n){ n=Math.floor(n);
  if(n>=1e9)return (n/1e9).toFixed(2)+'Md';
  if(n>=1e6)return (n/1e6).toFixed(2)+'M';
  if(n>=1e4)return (n/1e3).toFixed(1)+'k';
  return n.toLocaleString('fr-FR'); }
function toast(msg){ let t=$('#toast'); let d=ce('div','toast'); d.innerHTML=msg; t.appendChild(d);
  setTimeout(()=>d.remove(),3000); }

/* ===================================================================
   DONNÉES — types, races, stats, techniques, alliés, ennemis, carte
   =================================================================== */
const TYPES={
  feu:{n:'Feu',ico:'🔥',col:'#ff6b3d'},
  givre:{n:'Givre',ico:'❄️',col:'#5ec8e0'},
  foudre:{n:'Foudre',ico:'⚡',col:'#f5d020'},
  nature:{n:'Nature',ico:'🌿',col:'#7dc44a'},
  lumiere:{n:'Lumière',ico:'✨',col:'#ffe9a8'},
  tenebres:{n:'Ténèbres',ico:'🌑',col:'#9a6cff'},
  physique:{n:'Physique',ico:'⚔️',col:'#cbb88f'},
};
// cycle élémentaire : feu>nature>foudre>givre>feu ; lumiere<->tenebres
const STRONG={feu:['nature'],nature:['foudre'],foudre:['givre'],givre:['feu'],lumiere:['tenebres'],tenebres:['lumiere']};
function typeMult(atk,def){
  if(!atk||!def||atk==='physique'||def==='physique')return 1;
  if((STRONG[atk]||[]).includes(def))return 2;
  if((STRONG[def]||[]).includes(atk))return 0.5;
  return 1;
}
function tchip(t){ if(!t||!TYPES[t])return ''; let i=TYPES[t]; return `<span class="tchip" style="color:${i.col}">${i.ico} ${i.n}</span>`; }

const STAT_INFO={
  force:{n:'Force',ico:'💪',d:'Dégâts physiques & PV'},
  esprit:{n:'Esprit',ico:'🔮',d:'Dégâts magiques & Mana max'},
  vigueur:{n:'Vigueur',ico:'❤️',d:'PV max & résistance'},
  agilite:{n:'Agilité',ico:'🪶',d:'Vitesse & esquive'},
  chance:{n:'Chance',ico:'🍀',d:'Critique & butin'},
};
const STAT_KEYS=['force','esprit','vigueur','agilite','chance'];

const RACES={
  humain:{n:'Humain',ico:'🧑',base:{force:6,esprit:5,vigueur:6,agilite:5,chance:5},
    trees:['feu','lumiere','physique'],passive:'+12% XP gagnée',pid:'xp'},
  elfe:{n:'Elfe',ico:'🧝',base:{force:4,esprit:8,vigueur:4,agilite:8,chance:5},
    trees:['givre','nature','lumiere'],passive:'+18% esquive',pid:'dodge'},
  nain:{n:'Nain',ico:'🧔',base:{force:8,esprit:4,vigueur:9,agilite:3,chance:4},
    trees:['feu','physique'],passive:'+20% PV max',pid:'hp'},
  hobbit:{n:'Hobbit',ico:'🧒',base:{force:4,esprit:5,vigueur:5,agilite:7,chance:9},
    trees:['nature','physique'],passive:'+30% butin',pid:'drop'},
  orque:{n:'Orque',ico:'👹',base:{force:9,esprit:4,vigueur:7,agilite:5,chance:3},
    trees:['tenebres','feu','physique'],passive:'+15% dégâts physiques',pid:'phys'},
  rohirrim:{n:'Rohirrim',ico:'🐴',base:{force:7,esprit:4,vigueur:6,agilite:8,chance:5},
    trees:['physique','foudre','lumiere'],passive:'+15% vitesse',pid:'spd'},
  istari:{n:'Istari',ico:'🧙‍♂️',base:{force:3,esprit:10,vigueur:5,agilite:5,chance:6},
    trees:['feu','foudre','lumiere','givre'],passive:'+20% Mana max',pid:'mana'},
  sylvain:{n:'Elfe Sylvain',ico:'🧝‍♂️',base:{force:5,esprit:7,vigueur:5,agilite:8,chance:6},
    trees:['nature','givre','physique'],passive:'+20% soins prodigués',pid:'heal'},
  haradrim:{n:'Haradrim',ico:'🏜️',base:{force:8,esprit:5,vigueur:6,agilite:5,chance:7},
    trees:['feu','physique','tenebres'],passive:'+10% critique',pid:'crit'},
};

/* ÉVOLUTIONS DE RACE — 2 CHOIX par race (palier 1, niv 18) puis ASCENSION (palier 2, niv 40) */
const EVOLUTIONS={
  humain:[ {key:'dunedain',n:'Dúnedain',ico:'👑',pid:'xp',addTree:'lumiere',passive:'Lignée des Rois — polyvalent'},
           {key:'roi_guerrier',n:'Roi-Guerrier',ico:'⚔️',pid:'phys',addTree:'tenebres',passive:'Force martiale — +dégâts phys.'} ],
  elfe:[   {key:'haut_elfe',n:'Haut-Elfe',ico:'🧝‍♀️',pid:'dodge',addTree:'foudre',passive:'Grâce ancienne — +esquive'},
           {key:'archimage_elfe',n:'Archimage Elfe',ico:'🔮',pid:'mana',addTree:'givre',passive:'Arcane — +mana & magie'} ],
  nain:[   {key:'roi_nain',n:'Seigneur Nain',ico:'⛏️',pid:'hp',addTree:'foudre',passive:'Endurance — +PV'},
           {key:'berserk_nain',n:'Berserker Nain',ico:'🪓',pid:'phys',addTree:'feu',passive:'Rage de forge — +dégâts phys.'} ],
  hobbit:[ {key:'porteur',n:'Porteur de l\'Anneau',ico:'💍',pid:'drop',addTree:'tenebres',passive:'Fortune — +butin'},
           {key:'aventurier',n:'Aventurier Intrépide',ico:'🗡️',pid:'crit',addTree:'nature',passive:'Audace — +critique'} ],
  orque:[  {key:'uruk',n:'Uruk-Hai',ico:'👹',pid:'phys',addTree:'feu',passive:'Tueur-né — +dégâts phys.'},
           {key:'chaman_orque',n:'Chaman Orque',ico:'🔮',pid:'mana',addTree:'tenebres',passive:'Sombre magie — +mana'} ],
  rohirrim:[ {key:'marechal',n:'Maréchal de la Marche',ico:'🐎',pid:'spd',addTree:'lumiere',passive:'Célérité — +vitesse'},
           {key:'lancier_rohan',n:'Lancier du Rohan',ico:'🛡️',pid:'hp',addTree:'foudre',passive:'Mur de lances — +PV'} ],
  istari:[ {key:'mage_blanc',n:'Mage Blanc',ico:'🧙‍♂️',pid:'mana',addTree:'lumiere',passive:'Ordre Supérieur — +mana'},
           {key:'mage_noir',n:'Mage Noir',ico:'🪄',pid:'crit',addTree:'tenebres',passive:'Puissance brute — +critique'} ],
  sylvain:[ {key:'gardien_sylve',n:'Gardien de la Sylve',ico:'🌳',pid:'heal',addTree:'lumiere',passive:'Yavanna — +soins'},
           {key:'traqueur_sylve',n:'Traqueur Sylvain',ico:'🏹',pid:'dodge',addTree:'givre',passive:'Ombre des bois — +esquive'} ],
  haradrim:[ {key:'seigneur_serpent',n:'Seigneur Serpent',ico:'🐍',pid:'crit',addTree:'givre',passive:'Venin royal — +critique'},
           {key:'mahud',n:'Guerrier Mahûd',ico:'🐘',pid:'phys',addTree:'feu',passive:'Force du désert — +dégâts phys.'} ],
};
const EVO_T1_COST=25, EVO_T1_REQ=18, EVO_T2_COST=70, EVO_T2_REQ=40;
function addStats(base,d){ let nb={}; Object.keys(base).forEach(k=>nb[k]=base[k]+d); return nb; }
function withTree(trees,t){ let a=trees.slice(); if(t&&!a.includes(t))a.push(t); return a; }
// génère toutes les races évoluées (palier 1) + ascensions (palier 2)
Object.entries(EVOLUTIONS).forEach(([from,opts])=>{
  let b=RACES[from];
  opts.forEach(opt=>{
    let ascKey=opt.key+'_asc';
    RACES[opt.key]={n:opt.n,ico:opt.ico,base:addStats(b.base,3),trees:withTree(b.trees,opt.addTree),
      passive:opt.passive+' · puissance accrue',pid:opt.pid,evolved:true,evoFrom:from,tier:1,ascend:ascKey};
    RACES[ascKey]={n:opt.n+' Ascendant',ico:'🌟',base:addStats(b.base,7),trees:withTree(withTree(b.trees,opt.addTree),'tenebres'),
      passive:'Forme ultime — puissance majeure',pid:opt.pid,evolved:true,evoFrom:from,tier:2};
  });
});
const BASE_RACE_KEYS=Object.keys(EVOLUTIONS);
// options d'évolution proposées pour la forme actuelle
function evoOptions(){
  let r=RACES[S.race];
  if(!r.evolved){ return {tier:1,req:EVO_T1_REQ,cost:EVO_T1_COST,opts:(EVOLUTIONS[S.race]||[])}; }
  if(r.tier===1&&r.ascend){ let a=RACES[r.ascend]; return {tier:2,req:EVO_T2_REQ,cost:EVO_T2_COST,opts:[{key:r.ascend,n:a.n,ico:a.ico,passive:a.passive,pid:a.pid}]}; }
  return {tier:0,opts:[]}; // forme finale
}

/* ===================================================================
   ARBRES DE COMPÉTENCES PAR RACE — points gagnés à chaque niveau
   (avec prérequis : il faut investir en amont pour débloquer la suite)
   =================================================================== */
const LINEAGE_TALENT={
  xp:   {n:'Héritage des Rois',    eff:{atkPpct:0.10,atkMpct:0.10}, desc:'+10% dégâts physiques & magiques'},
  hp:   {n:'Peau de Pierre',       eff:{mitigFlat:0.08,hpPct:0.10}, desc:'+8% réduction de dégâts, +10% PV'},
  phys: {n:'Fureur Guerrière',     eff:{atkPpct:0.18}, desc:'+18% dégâts physiques'},
  mana: {n:'Source Inépuisable',   eff:{atkMpct:0.15,manaPct:0.15}, desc:'+15% dégâts magiques & mana'},
  dodge:{n:'Grâce Elfique',        eff:{dodgeFlat:0.12}, desc:'+12% esquive'},
  drop: {n:'Veine d\'Or',          eff:{dropPct:0.25,goldPct:0.20}, desc:'+25% butin, +20% or'},
  spd:  {n:'Vent de la Marche',    eff:{spdPct:0.15,critFlat:0.05}, desc:'+15% vitesse, +5% critique'},
  heal: {n:'Bénédiction Sylvestre',eff:{healPct:0.30}, desc:'+30% soins prodigués'},
  crit: {n:'Œil du Prédateur',     eff:{critFlat:0.10,critDmgPct:0.20}, desc:'+10% critique, +20% dégâts critiques'},
};
const PID_NODES={
  xp:   {util:{eff:{dropPct:0.05},n:'Meneur d\'hommes',d:'+5% butin / rang'},   spec:{eff:{critFlat:0.02},n:'Tacticien',d:'+2% critique / rang'}},
  hp:   {util:{eff:{mitigFlat:0.02},n:'Garde de fer',d:'+2% réduction / rang'}, spec:{eff:{hpPct:0.05},n:'Colosse',d:'+5% PV / rang'}},
  phys: {util:{eff:{atkPpct:0.05},n:'Brutalité',d:'+5% dégâts phys. / rang'},   spec:{eff:{lsFlat:0.02},n:'Soif de sang',d:'+2% vol de vie / rang'}},
  mana: {util:{eff:{atkMpct:0.05},n:'Arcaniste',d:'+5% dégâts mag. / rang'},     spec:{eff:{manaPct:0.06},n:'Réserve de mana',d:'+6% mana / rang'}},
  dodge:{util:{eff:{dodgeFlat:0.02},n:'Insaisissable',d:'+2% esquive / rang'},   spec:{eff:{spdPct:0.03},n:'Célérité',d:'+3% vitesse / rang'}},
  drop: {util:{eff:{dropPct:0.06},n:'Pillard',d:'+6% butin / rang'},             spec:{eff:{goldPct:0.06},n:'Cupidité',d:'+6% or & essence / rang'}},
  spd:  {util:{eff:{spdPct:0.04},n:'Vivacité',d:'+4% vitesse / rang'},           spec:{eff:{critFlat:0.02},n:'Précision',d:'+2% critique / rang'}},
  heal: {util:{eff:{healPct:0.06},n:'Mains guérisseuses',d:'+6% soins / rang'},  spec:{eff:{manaPct:0.05},n:'Méditation',d:'+5% mana / rang'}},
  crit: {util:{eff:{critFlat:0.03},n:'Œil affûté',d:'+3% critique / rang'},      spec:{eff:{critDmgPct:0.08},n:'Cruauté',d:'+8% dégâts crit. / rang'}},
};
const _raceTreeCache={};
function raceTreeFor(raceKey){
  let base=(RACES[raceKey]&&RACES[raceKey].evoFrom)||raceKey;
  if(_raceTreeCache[base])return _raceTreeCache[base];
  let pid=(RACES[base]&&RACES[base].pid)||'xp';
  let pn=PID_NODES[pid]||PID_NODES.xp; let cap=LINEAGE_TALENT[pid]||LINEAGE_TALENT.xp;
  let tree=[
    {id:base+'_atk', n:'Maîtrise au combat', tier:1,  max:3, eff:{atkPpct:0.04,atkMpct:0.04}, desc:'+4% dégâts / rang', req:[]},
    {id:base+'_def', n:'Endurance',          tier:1,  max:3, eff:{hpPct:0.05},                desc:'+5% PV max / rang', req:[]},
    {id:base+'_util',n:pn.util.n,            tier:5,  max:3, eff:pn.util.eff,                 desc:pn.util.d, req:[base+'_atk']},
    {id:base+'_spec',n:pn.spec.n,            tier:5,  max:3, eff:pn.spec.eff,                 desc:pn.spec.d, req:[base+'_def']},
    {id:base+'_cap', n:cap.n,                tier:12, max:1, eff:cap.eff,                     desc:'★ '+cap.desc, req:[base+'_util',base+'_spec'], cap:true},
  ];
  _raceTreeCache[base]=tree; return tree;
}
function allTalentNodes(){ return raceTreeFor(S.race); }
function talentRank(id){ return (S.talents&&S.talents[id])||0; }
function skillPrereqOk(node){ return (node.req||[]).every(r=>talentRank(r)>0); }
function talentBonus(){
  let b={atkPpct:0,atkMpct:0,hpPct:0,manaPct:0,critFlat:0,dodgeFlat:0,lsFlat:0,mitigFlat:0,healPct:0,spdPct:0,dropPct:0,critDmgPct:0,goldPct:0};
  let T=S.talents||{};
  allTalentNodes().forEach(node=>{ let r=T[node.id]||0; if(!r)return; for(let k in node.eff) b[k]=(b[k]||0)+node.eff[k]*r; });
  return b;
}

/* ===================================================================
   DÉFIS — objectifs qui donnent un but au farm (récompenses)
   =================================================================== */
function countRarityOwned(minRar){ let n=0; (S.inv||[]).forEach(it=>{if(it.rar>=minRar)n++;}); for(let sl in S.equip){let it=S.equip[sl]; if(it&&it.rar>=minRar)n++;} return n; }
const CHALLENGES=[
  {id:'c_z2',n:'Conquête : Vertbois',desc:'Vaincre le boss de la Forêt de Vertbois',reward:{tp:1},chk:()=>({cur:S.cleared.includes('z2')?1:0,max:1})},
  {id:'c_z4',n:'Conquête : Lothlórien',desc:'Vaincre le boss de la Lothlórien',reward:{tp:1,ess:10},chk:()=>({cur:S.cleared.includes('z4')?1:0,max:1})},
  {id:'c_z6',n:'Conquête : Mordor',desc:'Vaincre le boss du Mont Destin',reward:{tp:2,ess:20},chk:()=>({cur:S.cleared.includes('z6')?1:0,max:1})},
  {id:'c_z8',n:'Le Seigneur des Anneaux',desc:'Vaincre Barad-dûr',reward:{tp:3,gold:5000},chk:()=>({cur:S.cleared.includes('z8')?1:0,max:1})},
  {id:'c_fights',n:'Vétéran',desc:'Remporter 50 combats',reward:{tp:1,gold:1000},chk:()=>({cur:Math.min(50,(S.stats&&S.stats.fights)||0),max:50})},
  {id:'c_fights2',n:'Légende vivante',desc:'Remporter 200 combats',reward:{tp:2,gold:5000},chk:()=>({cur:Math.min(200,(S.stats&&S.stats.fights)||0),max:200})},
  {id:'c_bighit',n:'Coup fatal',desc:'Infliger 1000 dégâts en un seul coup',reward:{tp:1},chk:()=>({cur:Math.min(1000,(S.stats&&S.stats.maxHit)||0),max:1000})},
  {id:'c_interrupt',n:'Briseur de sorts',desc:'Interrompre 10 charges ennemies (Gel/Paralysie)',reward:{tp:1,ess:15},chk:()=>({cur:Math.min(10,(S.stats&&S.stats.interrupts)||0),max:10})},
  {id:'c_legend',n:'Collectionneur',desc:'Posséder 3 objets Légendaires ou +',reward:{tp:1},chk:()=>({cur:Math.min(3,countRarityOwned(4)),max:3})},
  {id:'c_unique',n:'Élu',desc:'Posséder un objet Unique',reward:{tp:2},chk:()=>({cur:Math.min(1,countRarityOwned(5)),max:1})},
  {id:'c_evolve',n:'Métamorphose',desc:'Faire évoluer ta race',reward:{tp:1},chk:()=>({cur:RACES[S.race].evolved?1:0,max:1})},
  {id:'c_party',n:'La Communauté',desc:'Recruter 6 compagnons',reward:{tp:1},chk:()=>({cur:Math.min(6,(S.recruited||[]).length),max:6})},
];

/* TECHNIQUES — kind: attack/heal/buff/debuff. type ou types:[a,b] (double-type).
   stat: force(phys)/esprit(magie). vfx: animation dédiée. */
const TECH=[
  // ---- PHYSIQUE ----
  {id:'ph1',n:'Taillade',ico:'🗡️',type:'physique',kind:'attack',pow:1.15,cost:0,stat:'force',target:'one',lvl:1,vfx:'slash',desc:'Frappe rapide, sans mana.'},
  {id:'ph2',n:'Frappe Lourde',ico:'🔨',type:'physique',kind:'attack',pow:1.9,cost:8,stat:'force',target:'one',lvl:3,vfx:'smash',desc:'Coup puissant.'},
  {id:'ph3',n:'Tourbillon',ico:'🌀',type:'physique',kind:'attack',pow:1.05,cost:14,stat:'force',target:'all',lvl:8,vfx:'cleave',desc:'Touche tous les ennemis.'},
  {id:'ph4',n:'Exécution',ico:'☠️',type:'physique',kind:'attack',pow:2.9,cost:22,stat:'force',target:'one',lvl:15,vfx:'pierce',desc:'Dégâts massifs mono-cible.'},
  {id:'ph5',n:'Lacération',ico:'⚔️',type:'physique',kind:'attack',pow:0.8,cost:12,stat:'force',target:'one',lvl:5,vfx:'slash3',hits:3,desc:'Frappe 3 fois.'},
  {id:'ph6',n:'Cri de Guerre',ico:'📣',type:'physique',kind:'buff',cost:12,stat:'force',target:'allyAll',lvl:7,status:'rage',vfx:'roar',desc:'Équipe enragée (+dégâts).'},
  // ---- FEU ----
  {id:'fe1',n:'Brandon',ico:'🔥',type:'feu',kind:'attack',pow:1.35,cost:7,stat:'esprit',target:'one',lvl:2,status:'brulure',vfx:'fireball',desc:'Peut brûler.'},
  {id:'fe2',n:'Vague de Flammes',ico:'🌋',type:'feu',kind:'attack',pow:1.15,cost:16,stat:'esprit',target:'all',lvl:6,status:'brulure',vfx:'flamewave',desc:'Brûle tous les ennemis.'},
  {id:'fe3',n:'Météore',ico:'☄️',type:'feu',kind:'attack',pow:3.1,cost:28,stat:'esprit',target:'one',lvl:13,status:'brulure',vfx:'meteor',desc:'Cataclysme de feu.'},
  {id:'fe4',n:'Embrasement',ico:'🔆',type:'feu',kind:'attack',pow:2.0,cost:20,stat:'esprit',target:'all',lvl:17,status:'brulure',vfx:'meteor',desc:'Pluie de feu sur tous.'},
  // ---- GIVRE ----
  {id:'gi1',n:'Éclat de Givre',ico:'❄️',type:'givre',kind:'attack',pow:1.3,cost:7,stat:'esprit',target:'one',lvl:2,status:'gel',vfx:'iceshard',desc:'Peut geler.'},
  {id:'gi2',n:'Blizzard',ico:'🌨️',type:'givre',kind:'attack',pow:1.1,cost:16,stat:'esprit',target:'all',lvl:6,status:'gel',vfx:'blizzard',desc:'Gèle la zone.'},
  {id:'gi3',n:'Tombeau de Glace',ico:'🧊',type:'givre',kind:'attack',pow:2.7,cost:26,stat:'esprit',target:'one',lvl:12,status:'gel',vfx:'frosttomb',desc:'Emprisonne la cible.'},
  // ---- FOUDRE ----
  {id:'fo1',n:'Étincelle',ico:'⚡',type:'foudre',kind:'attack',pow:1.35,cost:7,stat:'esprit',target:'one',lvl:3,status:'paralysie',vfx:'bolt',desc:'Peut paralyser.'},
  {id:'fo2',n:'Orage',ico:'🌩️',type:'foudre',kind:'attack',pow:1.15,cost:17,stat:'esprit',target:'all',lvl:7,status:'paralysie',vfx:'storm',desc:'Foudroie tous.'},
  {id:'fo3',n:'Jugement',ico:'⛈️',type:'foudre',kind:'attack',pow:3.0,cost:27,stat:'esprit',target:'one',lvl:14,status:'paralysie',vfx:'bolt',desc:'Frappe foudroyante.'},
  // ---- NATURE ----
  {id:'na1',n:'Ronces',ico:'🌿',type:'nature',kind:'attack',pow:1.25,cost:6,stat:'esprit',target:'one',lvl:2,status:'poison',vfx:'vine',desc:'Peut empoisonner.'},
  {id:'na2',n:'Don de la Forêt',ico:'🍃',type:'nature',kind:'heal',pow:0.55,cost:14,stat:'esprit',target:'allyAll',lvl:5,vfx:'heal',desc:'Soigne toute l\'équipe.'},
  {id:'na3',n:'Étreinte Sylvestre',ico:'🌳',type:'nature',kind:'attack',pow:1.1,cost:18,stat:'esprit',target:'all',lvl:10,status:'poison',vfx:'poisoncloud',desc:'Empoisonne tous.'},
  {id:'na4',n:'Régénération',ico:'💚',type:'nature',kind:'buff',cost:12,stat:'esprit',target:'ally',lvl:9,status:'regen',vfx:'heal',desc:'Régénère un allié sur 3 tours.'},
  {id:'na5',n:'Floraison',ico:'🌸',type:'nature',kind:'buff',cost:20,stat:'esprit',target:'allyAll',lvl:14,status:'regen',vfx:'heal',desc:'Régénération sur toute l\'équipe.'},
  // ---- LUMIERE ----
  {id:'lu1',n:'Aube',ico:'✨',type:'lumiere',kind:'heal',pow:0.75,cost:10,stat:'esprit',target:'ally',lvl:3,vfx:'heal',desc:'Soigne un allié.'},
  {id:'lu2',n:'Bénédiction',ico:'🌟',type:'lumiere',kind:'buff',cost:14,stat:'esprit',target:'allyAll',lvl:7,status:'benediction',vfx:'bless',desc:'+30% dégâts à l\'équipe.'},
  {id:'lu3',n:'Châtiment Sacré',ico:'🔆',type:'lumiere',kind:'attack',pow:2.5,cost:22,stat:'esprit',target:'one',lvl:11,vfx:'holybeam',desc:'Foudroie de lumière.'},
  {id:'lu4',n:'Lumière d\'Eärendil',ico:'🌠',type:'lumiere',kind:'attack',pow:1.7,cost:24,stat:'esprit',target:'all',lvl:16,vfx:'holybeam',desc:'Purifie tous les ennemis.'},
  {id:'lu5',n:'Lumière Guérisseuse',ico:'💖',type:'lumiere',kind:'heal',pow:0.95,cost:22,stat:'esprit',target:'allyAll',lvl:10,vfx:'heal',desc:'Soin puissant à toute l\'équipe.'},
  {id:'lu6',n:'Souffle de Vie',ico:'🕊️',type:'lumiere',kind:'heal',pow:0.6,cost:30,stat:'esprit',target:'ally',lvl:15,revive:true,vfx:'bless',desc:'Ranime un allié tombé.'},
  // ---- TENEBRES (plus puissantes — mais corruptrices) ----
  {id:'te1',n:'Lame d\'Ombre',ico:'🌑',type:'tenebres',kind:'attack',pow:1.7,cost:8,stat:'esprit',target:'one',lvl:1,status:'vuln',vfx:'shadowbolt',desc:'Rend vulnérable. (corrompt)'},
  {id:'te2',n:'Drain de Vie',ico:'🩸',type:'tenebres',kind:'attack',pow:1.8,cost:16,stat:'esprit',target:'one',lvl:5,drain:0.6,vfx:'drain',desc:'Vole la vie. (corrompt)'},
  {id:'te3',n:'Néant',ico:'⚫',type:'tenebres',kind:'attack',pow:1.6,cost:20,stat:'esprit',target:'all',lvl:10,status:'vuln',vfx:'voidnova',desc:'Engloutit tous. (corrompt)'},
  {id:'te4',n:'Apocalypse',ico:'💀',type:'tenebres',kind:'attack',pow:4.2,cost:34,stat:'esprit',target:'all',lvl:18,vfx:'voidnova',nazgul:true,desc:'Anéantissement (Nazgûl).'},
  {id:'te5',n:'Moisson d\'Âmes',ico:'🌫️',type:'tenebres',kind:'attack',pow:1.55,cost:24,stat:'esprit',target:'all',lvl:14,drain:0.4,vfx:'voidnova',desc:'Draine la vie de tous. (corrompt)'},
  {id:'te6',n:'Manteau de Terreur',ico:'👁️',type:'tenebres',kind:'attack',pow:1.4,cost:18,stat:'esprit',target:'all',lvl:8,status:'vuln',vfx:'cursemist',desc:'Terrorise tous les ennemis. (corrompt)'},
  // ---- PHYSIQUE (suite) ----
  {id:'ph7',n:'Brise-Garde',ico:'💥',type:'physique',kind:'attack',pow:1.5,cost:10,stat:'force',target:'one',lvl:9,status:'vuln',vfx:'smash',desc:'Brise la garde (vulnérable).'},
  {id:'ph8',n:'Charge Héroïque',ico:'🐎',type:'physique',kind:'attack',pow:2.6,cost:24,stat:'force',target:'one',lvl:19,vfx:'pierce',desc:'Charge dévastatrice.'},
  // ---- FEU (suite) ----
  {id:'fe5',n:'Comète',ico:'🌠',type:'feu',kind:'attack',pow:2.4,cost:18,stat:'esprit',target:'one',lvl:9,status:'brulure',vfx:'meteor',desc:'Boule de feu écrasante.'},
  // ---- GIVRE (suite) ----
  {id:'gi4',n:'Stalactite',ico:'🪨',type:'givre',kind:'attack',pow:2.5,cost:18,stat:'esprit',target:'one',lvl:15,status:'gel',vfx:'frosttomb',desc:'Empale la cible de glace.'},
  {id:'gi5',n:'Glaciation',ico:'🌬️',type:'givre',kind:'attack',pow:1.6,cost:24,stat:'esprit',target:'all',lvl:18,status:'gel',vfx:'blizzard',desc:'Gèle tous les ennemis.'},
  // ---- FOUDRE (suite) ----
  {id:'fo4',n:'Fulguration',ico:'🌟',type:'foudre',kind:'attack',pow:1.8,cost:23,stat:'esprit',target:'all',lvl:17,status:'paralysie',vfx:'storm',desc:'Décharge sur tous.'},
  // ---- NATURE (suite) ----
  {id:'na6',n:'Ronces Sanglantes',ico:'🥀',type:'nature',kind:'attack',pow:1.6,cost:16,stat:'esprit',target:'one',lvl:13,status:'poison',vfx:'poisoncloud',desc:'Poison aggravé.'},
  // ---- LUMIERE (suite) ----
  {id:'lu7',n:'Sanctuaire',ico:'⛩️',type:'lumiere',kind:'buff',cost:18,stat:'esprit',target:'allyAll',lvl:13,status:'benediction',vfx:'bless',desc:'Bénit toute l\'équipe.'},
  // ---- DOUBLE-TYPE ----
  {id:'dx1',n:'Tempête de Cendres',ico:'🌪️',types:['feu','foudre'],kind:'attack',pow:1.4,cost:20,stat:'esprit',target:'all',lvl:12,status:'brulure',vfx:'ashstorm',desc:'Feu + Foudre sur tous.'},
  {id:'dx2',n:'Aurore Boréale',ico:'🌈',types:['givre','lumiere'],kind:'attack',pow:1.8,cost:22,stat:'esprit',target:'one',lvl:13,status:'gel',vfx:'aurora',desc:'Givre + Lumière dévastateurs.'},
  {id:'dx3',n:'Ronce Foudroyée',ico:'🌿',types:['nature','foudre'],kind:'attack',pow:1.5,cost:18,stat:'esprit',target:'one',lvl:10,status:'paralysie',vfx:'thornbolt',desc:'Nature + Foudre.'},
  {id:'dx4',n:'Brume Maudite',ico:'☠️',types:['tenebres','givre'],kind:'attack',pow:1.45,cost:21,stat:'esprit',target:'all',lvl:14,status:'vuln',vfx:'cursemist',desc:'Ténèbres + Givre sur tous.'},
  {id:'dx5',n:'Lame Solaire',ico:'🌅',types:['physique','lumiere'],kind:'attack',pow:2.2,cost:18,stat:'force',target:'one',lvl:11,vfx:'sunblade',desc:'Physique + Lumière.'},
  {id:'dx6',n:'Fureur Volcanique',ico:'🌋',types:['feu','physique'],kind:'attack',pow:2.0,cost:19,stat:'force',target:'one',lvl:12,status:'brulure',vfx:'volcano',desc:'Feu + Physique.'},
  {id:'dx7',n:'Jugement Céleste',ico:'⚡',types:['foudre','lumiere'],kind:'attack',pow:2.0,cost:23,stat:'esprit',target:'all',lvl:15,status:'paralysie',vfx:'holybeam',desc:'Foudre + Lumière sur tous.'},
  {id:'dx8',n:'Cataclysme Infernal',ico:'🔥',types:['feu','tenebres'],kind:'attack',pow:2.4,cost:26,stat:'esprit',target:'all',lvl:17,status:'brulure',vfx:'voidnova',desc:'Feu + Ténèbres dévastateurs.'},
  {id:'dx9',n:'Hiver Sylvestre',ico:'🌲',types:['givre','nature'],kind:'attack',pow:1.6,cost:18,stat:'esprit',target:'all',lvl:11,status:'gel',vfx:'blizzard',desc:'Givre + Nature sur tous.'},
  {id:'dx10',n:'Lame Spectrale',ico:'👻',types:['physique','tenebres'],kind:'attack',pow:2.3,cost:20,stat:'force',target:'one',lvl:13,status:'vuln',vfx:'shadowbolt',desc:'Physique + Ténèbres.'},
  {id:'dx11',n:'Putréfaction',ico:'🦠',types:['nature','tenebres'],kind:'attack',pow:1.7,cost:22,stat:'esprit',target:'all',lvl:14,status:'poison',vfx:'poisoncloud',desc:'Nature + Ténèbres sur tous.'},
  {id:'dx12',n:'Tempête Polaire',ico:'🌨️',types:['givre','foudre'],kind:'attack',pow:1.9,cost:21,stat:'esprit',target:'one',lvl:13,status:'paralysie',vfx:'aurora',desc:'Givre + Foudre.'},
  // ---- BUFFS (alliés) ----
  {id:'bf1',n:'Hâte',ico:'💨',type:'physique',kind:'buff',cost:12,stat:'force',target:'allyAll',lvl:6,status:'fureur',vfx:'roar',desc:'+25% dégâts à l\'équipe (3 tours).'},
  {id:'bf2',n:'Mur de Boucliers',ico:'🛡️',type:'physique',kind:'buff',cost:14,stat:'force',target:'allyAll',lvl:8,status:'garde',vfx:'bless',desc:'-50% dégâts subis à l\'équipe.'},
  {id:'bf3',n:'Ardeur',ico:'🔥',type:'lumiere',kind:'buff',cost:10,stat:'esprit',target:'ally',lvl:5,status:'benediction',vfx:'bless',desc:'+30% dégâts à un allié ciblé.'},
  // ---- DEBUFFS (ennemis) ----
  {id:'db1',n:'Affaiblissement',ico:'🔻',type:'physique',kind:'debuff',cost:9,stat:'force',target:'one',lvl:4,status:'faiblesse',vfx:'smash',desc:'-30% dégâts ennemis (cible).'},
  {id:'db2',n:'Cri Démoralisant',ico:'📢',type:'physique',kind:'debuff',cost:16,stat:'force',target:'all',lvl:9,status:'faiblesse',vfx:'roar',desc:'-30% dégâts à tous les ennemis.'},
  {id:'db3',n:'Malédiction',ico:'💀',type:'tenebres',kind:'debuff',cost:18,stat:'esprit',target:'all',lvl:11,status:'vuln',vfx:'cursemist',desc:'+30% dégâts subis par tous (corrompt).'},
  {id:'db4',n:'Marque de l\'Ombre',ico:'🎯',type:'tenebres',kind:'debuff',cost:10,stat:'esprit',target:'one',lvl:6,status:'vuln',vfx:'shadowbolt',desc:'Marque une cible (+30% dégâts subis).'},
];
// Cooldowns (en tours/rounds) — les techniques puissantes se rechargent
// Cooldown calculé selon la PUISSANCE du sort : plus c'est fort, plus l'attente est longue.
function computeCd(t){
  let cd=0;
  if(t.kind==='attack'){ cd=Math.max(0,Math.round((t.pow-1.25)/0.6)); if(t.target==='all')cd+=1; if(t.hits&&t.hits>1)cd=Math.max(cd,1); }
  else if(t.kind==='heal'){ cd = t.revive?4 : (t.target==='allyAll'? (t.pow>=0.9?3:2) : (t.pow>=0.9?2:1)); }
  else if(t.kind==='buff'){ cd = t.target==='allyAll'?3:2; }
  else if(t.kind==='debuff'){ cd = t.target==='all'?2:1; }
  if(t.cost>=24)cd+=1;            // les sorts très coûteux attendent un peu plus
  if(t.nazgul)cd=Math.max(cd,5);  // techniques ultimes
  return Math.min(6,cd);
}
TECH.forEach(t=>{ t.cd=computeCd(t); });
const RING_FIGHTS=3; // l'Anneau / Pouvoir de Spectre : ultime indisponible pendant N combats après usage
const TECH_BY_ID={}; TECH.forEach(t=>TECH_BY_ID[t.id]=t);
function techTypes(t){ return t.types?t.types:[t.type]; }
function techPrimary(t){ return t.types?t.types[0]:t.type; }
function techEff(t,defType){
  let mults=techTypes(t).map(ty=>typeMult(ty,defType));
  let anyWeak=mults.some(m=>m>1.001), anyResist=mults.some(m=>m<0.999);
  if(anyWeak&&anyResist)return 1;        // un faible + un résistant → neutre
  if(anyWeak)return Math.max(...mults);  // au moins un type faible → bonus
  if(anyResist)return Math.min(...mults);// au moins un type résistant → malus
  return 1;
}

/* STATUTS */
const STATUSES={
  brulure:{n:'Brûlure',ico:'🔥',col:'#ff6b3d',dot:0.05,el:'feu',desc:'Dégâts de feu/tour'},
  poison:{n:'Poison',ico:'🟢',col:'#7dc44a',dot:0.045,el:'nature',desc:'Dégâts/tour'},
  gel:{n:'Gel',ico:'❄️',col:'#5ec8e0',skip:0.35,desc:'Peut rater son tour'},
  paralysie:{n:'Paralysie',ico:'⚡',col:'#f5d020',skip:0.30,desc:'Peut rater son tour'},
  garde:{n:'Garde',ico:'🛡️',col:'#6fd6c4',def:0.5,desc:'-50% dégâts subis'},
  vuln:{n:'Vulnérable',ico:'💢',col:'#d2495c',vuln:0.3,desc:'+30% dégâts subis'},
  benediction:{n:'Bénédiction',ico:'🌟',col:'#ffe9a8',dmgUp:0.3,desc:'+30% dégâts infligés'},
  rage:{n:'Rage',ico:'🔺',col:'#ff6b88',dmgUp:0.4,desc:'+40% dégâts infligés'},
  regen:{n:'Régén.',ico:'💚',col:'#7dd0a8',regen:0.08,desc:'Soigne chaque tour'},
  faiblesse:{n:'Faiblesse',ico:'🔻',col:'#9b91b4',dmgDown:0.3,desc:'-30% dégâts infligés'},
  fureur:{n:'Fureur',ico:'⚔️',col:'#ff9a3d',dmgUp:0.25,desc:'+25% dégâts infligés'},
  charge:{n:'Charge',ico:'⚠️',col:'#ffcf5a',desc:'Prépare une attaque dévastatrice — interromps avec Gel ou Paralysie !'},
};
const TYPE_STATUS={feu:'brulure',nature:'poison',givre:'gel',foudre:'paralysie',tenebres:'vuln'};

/* ALLIÉS recrutables — caractéristiques propres, niveau & équipement individuels */
const ALLIES=[
  {id:'aragorn',n:'Aragorn',ico:'🤴',type:'physique',role:'Bretteur',base:{force:9,esprit:4,vigueur:7,agilite:6,chance:5},moves:['ph1','ph2','ph5','dx5']},
  {id:'legolas',n:'Legolas',ico:'🏹',type:'nature',role:'Archer',base:{force:6,esprit:6,vigueur:4,agilite:11,chance:7},moves:['ph1','na1','na3','dx3']},
  {id:'gandalf',n:'Gandalf',ico:'🧙',type:'lumiere',role:'Mage Blanc',base:{force:3,esprit:11,vigueur:5,agilite:6,chance:6},moves:['lu1','lu3','fo1','lu4']},
  {id:'gimli',n:'Gimli',ico:'🪓',type:'feu',role:'Berserker',base:{force:11,esprit:3,vigueur:9,agilite:3,chance:3},moves:['ph2','ph3','fe1','dx6']},
  {id:'galadriel',n:'Galadriel',ico:'👸',type:'givre',role:'Enchanteresse',base:{force:2,esprit:12,vigueur:4,agilite:7,chance:7},moves:['gi1','gi3','lu2','dx2']},
  {id:'eowyn',n:'Éowyn',ico:'🛡️',type:'lumiere',role:'Chevalière',base:{force:8,esprit:6,vigueur:7,agilite:6,chance:5},moves:['ph1','ph4','lu1','dx5']},
  {id:'elrond',n:'Elrond',ico:'🧝‍♂️',type:'lumiere',role:'Guérisseur',base:{force:4,esprit:11,vigueur:6,agilite:6,chance:6},moves:['lu5','lu1','na4','lu3']},
  {id:'arwen',n:'Arwen',ico:'👰',type:'nature',role:'Soigneuse',base:{force:3,esprit:10,vigueur:6,agilite:8,chance:7},moves:['na2','lu1','na5','gi1']},
  // ---- NOUVEAUX COMPAGNONS ----
  {id:'boromir',n:'Boromir',ico:'🛡️',type:'physique',role:'Capitaine',base:{force:10,esprit:4,vigueur:9,agilite:5,chance:4},moves:['ph2','ph6','ph7','dx5']},
  {id:'faramir',n:'Faramir',ico:'🏹',type:'physique',role:'Rôdeur',base:{force:7,esprit:6,vigueur:6,agilite:9,chance:6},moves:['ph1','ph5','na1','dx3']},
  {id:'theoden',n:'Théoden',ico:'👑',type:'lumiere',role:'Roi du Rohan',base:{force:8,esprit:6,vigueur:8,agilite:6,chance:5},moves:['ph6','lu2','ph4','dx7']},
  {id:'thranduil',n:'Thranduil',ico:'🍃',type:'givre',role:'Roi Sylvain',base:{force:5,esprit:10,vigueur:6,agilite:9,chance:6},moves:['gi1','gi4','na4','dx12']},
  {id:'radagast',n:'Radagast',ico:'🐦',type:'nature',role:'Mage Brun',base:{force:3,esprit:11,vigueur:5,agilite:6,chance:8},moves:['na3','na5','na6','dx9']},
  {id:'samsagace',n:'Samsagace',ico:'🍲',type:'nature',role:'Jardinier Fidèle',base:{force:5,esprit:6,vigueur:9,agilite:5,chance:9},moves:['ph1','na2','na4','lu1']},
  {id:'glorfindel',n:'Glorfindel',ico:'⚔️',type:'lumiere',role:'Seigneur Elfe',base:{force:9,esprit:8,vigueur:7,agilite:9,chance:6},moves:['dx5','lu3','ph4','lu6']},
  {id:'beorn',n:'Beorn',ico:'🐻',type:'physique',role:'Change-peau',base:{force:12,esprit:3,vigueur:11,agilite:4,chance:4},moves:['ph2','ph3','ph8','ph6']},
];
const ALLY_BY_ID={}; ALLIES.forEach(a=>ALLY_BY_ID[a.id]=a);

/* ENNEMIS — pools par zone */
const MOBS={
  gobelin:{n:'Gobelin',ico:'👺',type:'physique'},
  loup:{n:'Loup des Terres',ico:'🐺',type:'nature'},
  orque:{n:'Orque',ico:'👹',type:'physique'},
  araignee:{n:'Araignée Géante',ico:'🕷️',type:'nature'},
  troll:{n:'Troll des Cavernes',ico:'🧌',type:'physique',abil:['charge']},
  balrog_spawn:{n:'Flamme Maudite',ico:'🔥',type:'feu'},
  spectre:{n:'Spectre',ico:'👻',type:'tenebres'},
  esprit:{n:'Esprit Sylvestre',ico:'🧚',type:'nature',abil:['heal']},
  uruk:{n:'Uruk-hai',ico:'🗡️',type:'physique'},
  nazgul_mob:{n:'Cavalier Noir',ico:'🐴',type:'tenebres'},
  chauvesouris:{n:'Chauve-souris d\'Ombre',ico:'🦇',type:'tenebres'},
  orque_feu:{n:'Orque Pyromane',ico:'🔥',type:'feu'},
  golem:{n:'Golem de Pierre',ico:'🗿',type:'physique',abil:['charge']},
  serpent:{n:'Serpent de Givre',ico:'🐍',type:'givre'},
  demon:{n:'Démon Mineur',ico:'😈',type:'feu'},
  oeil_volant:{n:'Sentinelle de Sauron',ico:'👁️',type:'tenebres'},
  // --- soigneurs / soutiens (variété) ---
  chaman:{n:'Chaman Gobelin',ico:'🧪',type:'nature',abil:['heal']},
  pretre_noir:{n:'Prêtre Noir',ico:'🕯️',type:'tenebres',abil:['heal']},
  liche_mineure:{n:'Liche Mineure',ico:'💀',type:'givre',abil:['heal','charge']},
};
const BOSSES={
  warg:{n:'Seigneur Warg',ico:'🐗',type:'nature',abil:['summon'],summon:['loup','loup','gobelin']},
  balrog:{n:'Balrog',ico:'👹',type:'feu',abil:['charge'],summon:['balrog_spawn']},
  sorciere:{n:'Sorcière des Bois',ico:'🧙‍♀️',type:'givre',abil:['heal','summon'],summon:['araignee','esprit']},
  roi_spectre:{n:'Roi-Sorcier',ico:'☠️',type:'tenebres',abil:['summon','charge'],summon:['spectre','nazgul_mob']},
  saroumane:{n:'Saroumane',ico:'🧙‍♂️',type:'lumiere',abil:['heal','summon'],summon:['uruk','uruk']},
  sauron:{n:'Œil de Sauron',ico:'👁️',type:'tenebres',abil:['charge','summon'],summon:['oeil_volant','spectre']},
  shelob:{n:'Arachne l\'Insatiable',ico:'🕷️',type:'nature',abil:['summon'],summon:['araignee','araignee']},
  troll_roi:{n:'Roi des Trolls',ico:'🧌',type:'physique',abil:['charge','summon'],summon:['troll']},
  dragon:{n:'Dragon de Cendres',ico:'🐉',type:'feu',abil:['charge']},
  spectre_glace:{n:'Liche de Givre',ico:'❄️',type:'givre',abil:['heal','charge','summon'],summon:['serpent','spectre']},
  bouche:{n:'Bouche de Sauron',ico:'💀',type:'tenebres',abil:['summon','charge'],summon:['nazgul_mob','pretre_noir']},
  gothmog:{n:'Gothmog le Fléau',ico:'👹',type:'feu',abil:['charge','summon'],summon:['orque_feu','demon']},
};
/* mini-boss du donjon : pioche dans ce pool selon la zone */
const DUNGEON_MINIBOSS=['troll_roi','shelob','dragon','spectre_glace','bouche','gothmog','sorciere','balrog'];

/* CARTE — zones liées en chaîne, drops spécifiques */
const ZONES=[
  {id:'z1',n:'Terres Sauvages',ico:'🌄',type:'nature',lvl:1,mobs:['gobelin','loup'],boss:'warg',
   loot:['epee_rouillee','tunique_cuir','botte_usee'],recruits:['aragorn','samsagace'],
   desc:'Plaines battues par le vent où rôdent les wargs.'},
  {id:'z2',n:'Forêt de Vertbois',ico:'🌲',type:'nature',lvl:5,mobs:['araignee','esprit','loup','chaman'],boss:'sorciere',
   loot:['arc_elfe','cape_sylvestre','amulette_feuille'],recruits:['legolas','boromir'],
   desc:'Bois profonds tissés de toiles et de magie ancienne.'},
  {id:'z3',n:'Mines de la Moria',ico:'⛏️',type:'feu',lvl:10,mobs:['orque','troll','balrog_spawn','chaman'],boss:'balrog',
   loot:['hache_naine','plastron_mithril','anneau_braise'],recruits:['gimli','gandalf','radagast'],
   desc:'Galeries sans fin où dort une flamme oubliée.'},
  {id:'z4',n:'Lothlórien',ico:'🌟',type:'lumiere',lvl:16,mobs:['esprit','spectre','araignee','pretre_noir'],boss:'saroumane',
   loot:['baton_blanc','robe_etoilee','amulette_galadhrim'],recruits:['galadriel','elrond','glorfindel'],
   desc:'Forêt dorée où le temps lui-même se suspend.'},
  {id:'z5',n:'Champs du Pelennor',ico:'⚔️',type:'physique',lvl:24,mobs:['uruk','orque','nazgul_mob','golem','pretre_noir'],boss:'roi_spectre',
   loot:['lame_runique','heaume_gondor','anneau_vaillance'],recruits:['eowyn','theoden','faramir'],
   desc:'La grande bataille fait rage sous les murs de Minas Tirith.'},
  {id:'z6',n:'Mordor — le Mont Destin',ico:'🌋',type:'tenebres',lvl:34,mobs:['nazgul_mob','spectre','balrog_spawn','demon','liche_mineure'],boss:'sauron',
   loot:['lame_morgul','armure_obsidienne','anneau_unique'],recruits:['arwen','thranduil'],
   desc:'Le cœur des ténèbres. La fin du voyage — ou son commencement.'},
  {id:'z7',n:'Tour de Cirith Ungol',ico:'🗼',type:'tenebres',lvl:46,mobs:['araignee','chauvesouris','spectre','serpent','liche_mineure'],boss:'shelob',
   loot:['lame_morgul','armure_obsidienne','anneau_unique'],recruits:['beorn'],
   desc:'Un escalier sans fin gardé par une horreur tapie dans le noir.'},
  {id:'z8',n:'Barad-dûr',ico:'🏯',type:'tenebres',lvl:60,mobs:['nazgul_mob','demon','oeil_volant','golem','liche_mineure','pretre_noir'],boss:'gothmog',
   loot:['lame_morgul','armure_obsidienne','anneau_unique'],recruits:[],
   desc:'La Tour Sombre, dernier rempart de l\'Ennemi. Nul n\'en revient indemne.'},
];
const ZONE_BY_ID={}; ZONES.forEach(z=>ZONE_BY_ID[z.id]=z);

/* ITEMS — bases (par slot) + tables d'affixes par rareté */
const ITEM_BASES={
  epee_rouillee:{n:'Épée Rouillée',slot:'arme',ico:'🗡️',mainStat:'force'},
  arc_elfe:{n:'Arc Elfique',slot:'arme',ico:'🏹',mainStat:'agilite'},
  hache_naine:{n:'Hache Naine',slot:'arme',ico:'🪓',mainStat:'force'},
  baton_blanc:{n:'Bâton Blanc',slot:'arme',ico:'🪄',mainStat:'esprit'},
  lame_runique:{n:'Lame Runique',slot:'arme',ico:'⚔️',mainStat:'force'},
  lame_morgul:{n:'Lame de Morgul',slot:'arme',ico:'🗡️',mainStat:'esprit'},
  tunique_cuir:{n:'Tunique de Cuir',slot:'armure',ico:'🦺',mainStat:'vigueur'},
  cape_sylvestre:{n:'Cape Sylvestre',slot:'armure',ico:'🧥',mainStat:'agilite'},
  plastron_mithril:{n:'Plastron de Mithril',slot:'armure',ico:'🛡️',mainStat:'vigueur'},
  robe_etoilee:{n:'Robe Étoilée',slot:'armure',ico:'👘',mainStat:'esprit'},
  heaume_gondor:{n:'Heaume du Gondor',slot:'casque',ico:'⛑️',mainStat:'vigueur'},
  armure_obsidienne:{n:'Armure d\'Obsidienne',slot:'armure',ico:'🥷',mainStat:'force'},
  botte_usee:{n:'Bottes Usées',slot:'bottes',ico:'🥾',mainStat:'agilite'},
  amulette_feuille:{n:'Amulette de Feuille',slot:'amulette',ico:'📿',mainStat:'esprit'},
  anneau_braise:{n:'Anneau de Braise',slot:'anneau',ico:'💍',mainStat:'force'},
  amulette_galadhrim:{n:'Amulette Galadhrim',slot:'amulette',ico:'🔮',mainStat:'esprit'},
  anneau_vaillance:{n:'Anneau de Vaillance',slot:'anneau',ico:'💍',mainStat:'vigueur'},
  anneau_unique:{n:'L\'Anneau Unique',slot:'anneau',ico:'💍',mainStat:'chance'},
  // ---- NOUVEL ÉQUIPEMENT (plus de variété, tous slots/stats) ----
  dague_jet:{n:'Dague de Jet',slot:'arme',ico:'🔪',mainStat:'agilite'},
  lance_gondor:{n:'Lance du Gondor',slot:'arme',ico:'🔱',mainStat:'force'},
  marteau_forge:{n:'Marteau de Forge',slot:'arme',ico:'🔨',mainStat:'vigueur'},
  grimoire_arcane:{n:'Grimoire Arcanique',slot:'arme',ico:'📕',mainStat:'esprit'},
  fronde_hobbit:{n:'Fronde Hobbite',slot:'arme',ico:'🪀',mainStat:'chance'},
  harnais_ecailles:{n:'Harnais d\'Écailles',slot:'armure',ico:'🐲',mainStat:'force'},
  robe_mage:{n:'Robe de Mage',slot:'armure',ico:'🧙',mainStat:'esprit'},
  jaque_rodeur:{n:'Jaque de Rôdeur',slot:'armure',ico:'🧥',mainStat:'agilite'},
  cotte_mailles:{n:'Cotte de Mailles',slot:'armure',ico:'🛡️',mainStat:'vigueur'},
  heaume_ailé:{n:'Heaume Ailé',slot:'casque',ico:'🪖',mainStat:'agilite'},
  capuche_ombre:{n:'Capuche d\'Ombre',slot:'casque',ico:'🎭',mainStat:'esprit'},
  couronne_roi:{n:'Couronne du Roi',slot:'casque',ico:'👑',mainStat:'chance'},
  diademe_sage:{n:'Diadème du Sage',slot:'casque',ico:'💠',mainStat:'esprit'},
  bottes_celerite:{n:'Bottes de Célérité',slot:'bottes',ico:'👢',mainStat:'agilite'},
  greves_acier:{n:'Grèves d\'Acier',slot:'bottes',ico:'🥾',mainStat:'vigueur'},
  sandales_elfe:{n:'Sandales Elfiques',slot:'bottes',ico:'🩴',mainStat:'chance'},
  pendentif_braise:{n:'Pendentif de Braise',slot:'amulette',ico:'🔥',mainStat:'esprit'},
  collier_loup:{n:'Collier du Loup',slot:'amulette',ico:'🐺',mainStat:'force'},
  talisman_chance:{n:'Talisman de Chance',slot:'amulette',ico:'🍀',mainStat:'chance'},
  anneau_sorcier:{n:'Anneau du Sorcier',slot:'anneau',ico:'💍',mainStat:'esprit'},
  anneau_agilite:{n:'Anneau de Vivacité',slot:'anneau',ico:'💍',mainStat:'agilite'},
  anneau_fortune:{n:'Anneau de Fortune',slot:'anneau',ico:'💍',mainStat:'chance'},
  // ==== BASES DES OBJETS UNIQUES (sets parfaits par build) ====
  // MAGE — set "Regalia de l'Archimage"
  u_mage_arme:{n:'Bâton des Arcanes',slot:'arme',ico:'🪄',mainStat:'esprit',unique:true,set:'archimage',build:'Mage'},
  u_mage_armure:{n:'Robe du Vide',slot:'armure',ico:'🌌',mainStat:'esprit',unique:true,set:'archimage',build:'Mage'},
  u_mage_amulette:{n:'Œil de l\'Arcane',slot:'amulette',ico:'🔮',mainStat:'esprit',unique:true,set:'archimage',build:'Mage'},
  // GUERRIER — set "Panoplie du Roi-Guerrier"
  u_war_arme:{n:'Épée du Serment',slot:'arme',ico:'⚔️',mainStat:'force',unique:true,set:'guerrier',build:'Guerrier'},
  u_war_armure:{n:'Cuirasse du Rempart',slot:'armure',ico:'🛡️',mainStat:'vigueur',unique:true,set:'guerrier',build:'Guerrier'},
  u_war_amulette:{n:'Talisman de Sang',slot:'amulette',ico:'🩸',mainStat:'vigueur',unique:true,set:'guerrier',build:'Guerrier'},
  // HEALER — set "Atours de la Gardienne"
  u_heal_arme:{n:'Sceptre de Vie',slot:'arme',ico:'🌿',mainStat:'esprit',unique:true,set:'gardienne',build:'Soigneur'},
  u_heal_armure:{n:'Voiles Bénis',slot:'armure',ico:'👘',mainStat:'esprit',unique:true,set:'gardienne',build:'Soigneur'},
  u_heal_amulette:{n:'Larme d\'Estë',slot:'amulette',ico:'💧',mainStat:'esprit',unique:true,set:'gardienne',build:'Soigneur'},
  // ASSASSIN — set "Linceul de l'Ombre"
  u_assa_arme:{n:'Dagues Jumelles',slot:'arme',ico:'🗡️',mainStat:'agilite',unique:true,set:'assassin',build:'Assassin'},
  u_assa_armure:{n:'Cape Spectrale',slot:'armure',ico:'🥷',mainStat:'agilite',unique:true,set:'assassin',build:'Assassin'},
  u_assa_amulette:{n:'Croc Empoisonné',slot:'amulette',ico:'🦂',mainStat:'chance',unique:true,set:'assassin',build:'Assassin'},
};
// Templates fixes des objets uniques : affixes garantis + passif dédié
const UNIQUE_TEMPLATES={
  u_mage_arme:{aff:[['esprit',8],['critPct',12],['manaFlat',40]],passive:'p_archimage'},
  u_mage_armure:{aff:[['esprit',7],['manaFlat',60],['hpFlat',40]],passive:'p_archimage'},
  u_mage_amulette:{aff:[['esprit',6],['critPct',10],['manaFlat',35]],passive:'p_archimage'},
  u_war_arme:{aff:[['force',9],['critPct',8],['hpFlat',50]],passive:'p_roiguerrier'},
  u_war_armure:{aff:[['vigueur',9],['hpFlat',120],['force',4]],passive:'p_roiguerrier'},
  u_war_amulette:{aff:[['vigueur',7],['hpFlat',80],['lifesteal',8]],passive:'p_roiguerrier'},
  u_heal_arme:{aff:[['esprit',8],['manaFlat',45],['vigueur',4]],passive:'p_gardienne'},
  u_heal_armure:{aff:[['esprit',6],['hpFlat',90],['manaFlat',40]],passive:'p_gardienne'},
  u_heal_amulette:{aff:[['esprit',7],['manaFlat',50],['vigueur',5]],passive:'p_gardienne'},
  u_assa_arme:{aff:[['agilite',9],['critPct',18],['lifesteal',10]],passive:'p_assassin'},
  u_assa_armure:{aff:[['agilite',8],['critPct',10],['hpFlat',45]],passive:'p_assassin'},
  u_assa_amulette:{aff:[['chance',8],['critPct',14],['lifesteal',8]],passive:'p_assassin'},
};
const UNIQUE_BASE_IDS=Object.keys(UNIQUE_TEMPLATES);
// Bonus de set : actifs selon le nombre de pièces équipées (2 / 3)
const SET_BONUSES={
  archimage:{n:'Regalia de l\'Archimage',2:{critPct:10},3:{critPct:18,espritMul:0.15},desc2:'+10% critique',desc3:'+18% critique, +15% Esprit'},
  guerrier:{n:'Panoplie du Roi-Guerrier',2:{hpFlat:120},3:{hpFlat:260,forceMul:0.15},desc2:'+120 PV',desc3:'+260 PV, +15% Force'},
  gardienne:{n:'Atours de la Gardienne',2:{manaFlat:60},3:{manaFlat:120,healBonus:0.25},desc2:'+60 Mana',desc3:'+120 Mana, +25% soins'},
  assassin:{n:'Linceul de l\'Ombre',2:{critPct:12},3:{critPct:22,lifesteal:8},desc2:'+12% critique',desc3:'+22% critique, +8% vol de vie'},
};
const SLOTS=[{id:'arme',n:'Arme',ico:'⚔️'},{id:'armure',n:'Armure',ico:'🛡️'},{id:'casque',n:'Casque',ico:'⛑️'},
  {id:'bottes',n:'Bottes',ico:'🥾'},{id:'amulette',n:'Amulette',ico:'📿'},{id:'anneau',n:'Anneau',ico:'💍'}];
const RARITIES=[
  {n:'Commun',affixes:1,mult:1.0},      // 0 — 60%
  {n:'Peu commun',affixes:2,mult:1.3},  // 1 — 25%
  {n:'Rare',affixes:3,mult:1.7},        // 2 — 10%
  {n:'Épique',affixes:4,mult:2.3},      // 3 — 4%
  {n:'Légendaire',affixes:5,mult:3.2},  // 4 — 1%
  {n:'Unique',affixes:6,mult:4.5,unique:true}, // 5 — 0,1% (sets de build)
];
// affixes possibles : stat plates + spéciaux
const AFFIX_POOL=[
  {k:'force',label:'Force',flat:true},{k:'esprit',label:'Esprit',flat:true},
  {k:'vigueur',label:'Vigueur',flat:true},{k:'agilite',label:'Agilité',flat:true},
  {k:'chance',label:'Chance',flat:true},
  {k:'critPct',label:'% Critique',pct:true},{k:'hpFlat',label:'PV',big:true},
  {k:'manaFlat',label:'Mana',mid:true},{k:'lifesteal',label:'% Vol de vie',pct:true},
];
const PASSIVES=[
  {id:'p_thorns',n:'Épines',desc:'Renvoie 15% des dégâts subis.'},
  {id:'p_firstaid',n:'Premiers Soins',desc:'+5% PV en début de combat.'},
  {id:'p_manaflow',n:'Flux de Mana',desc:'+3 mana/tour.'},
  {id:'p_lucky',n:'Chanceux',desc:'+15% chance de butin.'},
  {id:'p_berserk',n:'Berserk',desc:'+20% dégâts sous 30% PV.'},
  {id:'p_archimage',n:'Sceau de l\'Archimage',desc:'+15% dégâts magiques.'},
  {id:'p_roiguerrier',n:'Sang Royal',desc:'+12% dégâts physiques.'},
  {id:'p_gardienne',n:'Grâce d\'Estë',desc:'+20% soins prodigués.'},
  {id:'p_assassin',n:'Frappe de l\'Ombre',desc:'+10% critique permanent.'},
];

/* MATÉRIAUX de craft (tombent au combat) */
const MAT_NAMES={mat:'Fragments'}; // simplifié : une ressource de forge "Fragments"

/* ===================================================================
   ÉTAT
   =================================================================== */
const SAVE_KEY='lotr_jrpg_v1';
let S=null;
function defaultState(){
  return {
    v:2, created:false,
    name:'Voyageur', race:'humain',
    level:1, xp:0,
    statPoints:0, alloc:{force:0,esprit:0,vigueur:0,agilite:0,chance:0},
    talentPoints:0, talents:{}, challengesClaimed:[], stats:{fights:0,maxHit:0,interrupts:0},
    gold:50, ess:0, mat:0,
    hpCur:null, manaCur:null,
    equip:{arme:null,armure:null,casque:null,bottes:null,amulette:null,anneau:null},
    inv:[],
    learned:['ph1'], equippedTech:['ph1'],
    recruited:[], party:['hero'],
    allyData:{}, // id -> {level,xp,statPoints,alloc,equip,hpCur,manaCur}
    zoneIdx:0, cleared:[], curZone:'z1', reached:['z1'],
    corruption:0, isNazgul:false, ringUses:0,
    autoBattle:false, musicOn:true, sfxOn:true, musicVol:0.6, sfxVol:0.7,
    consumables:{potion:3, ether:1, potionPlus:0, etherPlus:0},
    kills:0, lastSave:Date.now(),
  };
}
function ensureAlly(id){
  if(!S.allyData)S.allyData={};
  if(!S.allyData[id]){
    S.allyData[id]={level:Math.max(1,S.level-1),xp:0,statPoints:0,
      alloc:{force:0,esprit:0,vigueur:0,agilite:0,chance:0},
      equip:{arme:null,armure:null,casque:null,bottes:null,amulette:null,anneau:null},
      hpCur:null,manaCur:null};
  }
  let ad=S.allyData[id];
  // grimoire propre au compagnon (apprises + équipées) — migration des anciens saves
  if(!Array.isArray(ad.learned)) ad.learned=ALLY_BY_ID[id].moves.slice();
  if(!Array.isArray(ad.moves)||!ad.moves.length) ad.moves=ALLY_BY_ID[id].moves.slice();
  return ad;
}

/* ===================================================================
   STATS DÉRIVÉES — unifiées héros / alliés
   =================================================================== */
function statBlockFor(kind,id){
  if(kind==='hero')return {base:RACES[S.race].base, alloc:S.alloc, level:S.level, equip:S.equip};
  let ad=ensureAlly(id);
  return {base:ALLY_BY_ID[id].base, alloc:ad.alloc, level:ad.level, equip:ad.equip};
}
function statOf(kind,id,k){
  let b=statBlockFor(kind,id);
  let v=b.base[k]+(b.alloc[k]||0)+Math.floor(b.level*0.4);
  for(let sl in b.equip){ let it=b.equip[sl]; if(it){ it.affixes.forEach(a=>{ if(a.k===k)v+=a.v; }); if(ITEM_BASES[it.base].mainStat===k)v+=it.mainVal; } }
  return Math.floor(v);
}
function totalStat(k){ return statOf('hero',null,k); } // compat héros
function derivedOf(kind,id){
  let b=statBlockFor(kind,id);
  let F=statOf(kind,id,'force'),E=statOf(kind,id,'esprit'),V=statOf(kind,id,'vigueur'),A=statOf(kind,id,'agilite'),C=statOf(kind,id,'chance');
  let lvl=b.level;
  let hp=40+V*12+lvl*8, mana=20+E*6+lvl*2;
  let atkP=6+F*2.2, atkM=5+E*2.4, spd=90+A*1.6;
  let crit=0.05+C*0.006, dodge=A*0.004, drop=1+C*0.02, healMul=1, ls=0;
  let critA=0,hpA=0,manaA=0;
  for(let sl in b.equip){ let it=b.equip[sl]; if(it)it.affixes.forEach(a=>{
    if(a.k==='critPct')critA+=a.v; if(a.k==='hpFlat')hpA+=a.v; if(a.k==='manaFlat')manaA+=a.v; if(a.k==='lifesteal')ls+=a.v; }); }
  crit+=critA/100; hp+=hpA; mana+=manaA;
  // passifs d'équipement permanents (set uniques)
  let atkPmul=1, atkMmul=1, healMulBonus=0;
  for(let sl in b.equip){ let it=b.equip[sl]; if(!it||!it.passive)continue;
    if(it.passive==='p_archimage')atkMmul+=0.15;
    if(it.passive==='p_roiguerrier')atkPmul+=0.12;
    if(it.passive==='p_gardienne')healMulBonus+=0.20;
    if(it.passive==='p_assassin')crit+=0.10;
  }
  // bonus de SET (2 / 3 pièces du même set équipées)
  let setCount={};
  for(let sl in b.equip){ let it=b.equip[sl]; if(it&&it.set)setCount[it.set]=(setCount[it.set]||0)+1; }
  for(let sid in setCount){ let sb=SET_BONUSES[sid]; if(!sb)continue; let n=setCount[sid];
    [2,3].forEach(th=>{ if(n>=th&&sb[th]){ let bn=sb[th];
      if(bn.critPct)crit+=bn.critPct/100; if(bn.hpFlat)hp+=bn.hpFlat; if(bn.manaFlat)mana+=bn.manaFlat;
      if(bn.lifesteal)ls+=bn.lifesteal; if(bn.espritMul)atkMmul+=bn.espritMul; if(bn.forceMul)atkPmul+=bn.forceMul;
      if(bn.healBonus)healMulBonus+=bn.healBonus; } });
  }
  atkP*=atkPmul; atkM*=atkMmul; healMul+=healMulBonus;
  let race= kind==='hero'?RACES[S.race]:null;
  if(race){ let p=race.pid;
    if(p==='hp')hp*=1.2; if(p==='phys')atkP*=1.15; if(p==='dodge')dodge+=0.18;
    if(p==='drop')drop+=0.30; if(p==='spd')spd*=1.15; if(p==='mana')mana*=1.2;
    if(p==='crit')crit+=0.08; if(p==='heal')healMul+=0.2;
  }
  if(race&&race.evolved){ hp*=1.12; mana*=1.10; atkP*=1.10; atkM*=1.10; crit+=0.03; spd*=1.05; }
  // ==== NAZGÛL : plus de mana — les techniques coûtent de la VIE. Gros réservoir + vol de vie. ====
  if(kind==='hero'&&S.isNazgul){
    atkM*=1.45; atkP*=1.30; hp*=1.6; mana=0;
    crit+=0.10; spd*=1.10; ls+=14; dodge+=0.04;
  }
  // ==== TALENTS (héros uniquement) ====
  let tb=null;
  if(kind==='hero'){ tb=talentBonus();
    atkP*=(1+tb.atkPpct); atkM*=(1+tb.atkMpct); hp*=(1+tb.hpPct); mana*=(1+tb.manaPct);
    crit+=tb.critFlat; dodge+=tb.dodgeFlat; ls+=tb.lsFlat*100; healMul+=tb.healPct; spd*=(1+tb.spdPct); drop+=tb.dropPct;
  }
  let type= kind==='hero'?heroType():ALLY_BY_ID[id].type;
  // ---- RÉDUCTION DE DÉGÂTS : Vigueur + pièces défensives (armure/casque/bottes) ----
  let def = V*1.7 + lvl*1.6;
  for(let sl in b.equip){ let it=b.equip[sl]; if(it){ let s=ITEM_BASES[it.base].slot;
    if(s==='armure'||s==='casque'||s==='bottes') def += it.mainVal*0.7; } }
  if(kind==='hero'&&S.isNazgul) def*=1.15;
  let mitig = clamp(def/(def+95) + (tb?tb.mitigFlat:0), 0, 0.7); // Vigueur + armure + talents
  return {F,E,V,A,C,maxHp:Math.floor(hp),maxMana:Math.floor(mana),atkP:Math.floor(atkP),atkM:Math.floor(atkM),
    spd:Math.floor(spd),crit:clamp(crit,0,0.65),dodge:clamp(dodge,0,0.45),drop,healMul,lifesteal:ls/100,mitig,type,
    critDmg:1.6+(tb?tb.critDmgPct:0), goldPct:(tb?tb.goldPct:0)};
}
function heroDerived(){ return derivedOf('hero',null); }
function allyLevel(id){ return ensureAlly(id).level; }
function allyDerived(id){ let d=derivedOf('ally',id); let ad=ensureAlly(id); d.moves=(ad.moves&&ad.moves.length?ad.moves:ALLY_BY_ID[id].moves).slice(); return d; }
// types possédés par un compagnon (pour ce qu'il peut apprendre)
function ownedTypesAlly(type){ return [...new Set([type,'physique'])]; }
function canAllyLearn(type,t){
  if(t.types) return t.types.some(ty=>ownedTypesAlly(type).includes(ty));
  return ownedTypesAlly(type).includes(t.type);
}
function xpNeeded(lv){ return Math.floor(50*Math.pow(1.27,lv-1)); }
function heroType(){ return S.isNazgul?'tenebres':(RACES[S.race].trees[0]); }

/* ===================================================================
   GÉNÉRATION D'OBJETS
   =================================================================== */
let _iid=1;
const AFFIX_LABEL={force:'Force',esprit:'Esprit',vigueur:'Vigueur',agilite:'Agilité',chance:'Chance',critPct:'% Critique',hpFlat:'PV',manaFlat:'Mana',lifesteal:'% Vol de vie'};
function genItem(baseId,rarityIdx,ilvl){
  // ---- OBJET UNIQUE : pièce de set à affixes fixes ----
  if(rarityIdx>=5){
    let uid = ITEM_BASES[baseId] && ITEM_BASES[baseId].unique ? baseId : pick(UNIQUE_BASE_IDS);
    let base=ITEM_BASES[uid]; let tpl=UNIQUE_TEMPLATES[uid];
    let scale=1+ilvl*0.05;
    let mainVal=Math.max(6,Math.floor((6+ilvl*1.0)*4.5));
    let affixes=tpl.aff.map(([k,v])=>({k,label:AFFIX_LABEL[k]||k,v:Math.floor(v*scale),pct:(k==='critPct'||k==='lifesteal')}));
    let it={iid:_iid++,base:uid,rar:5,ilvl,mainVal,affixes,name:base.n,unique:true,set:base.set,passive:tpl.passive};
    return it;
  }
  let base=ITEM_BASES[baseId]; let R=RARITIES[rarityIdx];
  let mainVal=Math.max(1,Math.floor((2+ilvl*0.8)*R.mult));
  let affixes=[];
  let pool=AFFIX_POOL.filter(a=>a.k!==base.mainStat);
  for(let i=0;i<R.affixes;i++){
    let a=pick(pool);
    let v;
    if(a.pct) v=Math.floor((3+ilvl*0.4)*R.mult/2);
    else if(a.big) v=Math.floor((10+ilvl*4)*R.mult);
    else if(a.mid) v=Math.floor((5+ilvl*2)*R.mult);
    else v=Math.max(1,Math.floor((1+ilvl*0.45)*R.mult));
    affixes.push({k:a.k,label:a.label,v,pct:a.pct});
  }
  let it={iid:_iid++,base:baseId,rar:rarityIdx,ilvl,mainVal,affixes,name:R.n+' '+base.n};
  if(rarityIdx>=3 && Math.random()<0.6){ it.passive=pick(PASSIVES.slice(0,5)).id; }
  return it;
}
function affixText(it){
  let parts=[`+${it.mainVal} ${STAT_INFO[ITEM_BASES[it.base].mainStat]?STAT_INFO[ITEM_BASES[it.base].mainStat].n:ITEM_BASES[it.base].mainStat}`];
  it.affixes.forEach(a=>parts.push(`+${a.v}${a.pct?'%':''} ${a.label}`));
  return parts.join(' · ');
}
function passiveText(it){
  let out='';
  if(it.passive){ let p=PASSIVES.find(x=>x.id===it.passive); if(p)out=`✦ ${p.n} — ${p.desc}`; }
  if(it.unique&&it.set&&SET_BONUSES[it.set]){ let sb=SET_BONUSES[it.set];
    out+=`${out?'<br>':''}⟡ Set « ${sb.n} » — 2 pièces : ${sb.desc2} · 3 pièces : ${sb.desc3}`; }
  return out;
}

/* ===================================================================
   SAUVEGARDE
   =================================================================== */
function save(){ try{ S.lastSave=Date.now(); localStorage.setItem(SAVE_KEY,JSON.stringify(S)); }catch(e){} }
function load(){ try{ let r=localStorage.getItem(SAVE_KEY); if(!r)return false; let d=JSON.parse(r);
  S=Object.assign(defaultState(),d);
  // migration : anciens saves n'ont pas "reached" → on débloque les zones déjà accessibles
  if(!Array.isArray(S.reached)||!S.reached.length){
    S.reached=ZONES.filter((z,i)=>i<=S.zoneIdx).map(z=>z.id);
    if(!S.reached.includes('z1'))S.reached.push('z1');
  }
  if(!S.talents)S.talents={};
  // migration : anciens talents génériques (t_*) → remboursés en points de compétence
  let refund=0; for(let k in S.talents){ if(/^t_/.test(k)){ refund+=S.talents[k]; delete S.talents[k]; } }
  if(refund){ S.talentPoints=(S.talentPoints||0)+refund; }
  if(typeof S.talentPoints!=='number')S.talentPoints=0;
  if(!S.stats)S.stats={fights:0,maxHit:0,interrupts:0};
  if(!Array.isArray(S.challengesClaimed))S.challengesClaimed=[];
  return true; }catch(e){ return false; } }

/* ===================================================================
   MOTEUR DE COMBAT
   =================================================================== */
let B=null;
function buildPartyCombatant(slot){
  if(slot==='hero'){
    let d=heroDerived();
    if(S.hpCur==null)S.hpCur=d.maxHp; if(S.manaCur==null)S.manaCur=d.maxMana;
    return {ref:'hero',isHero:true,name:S.name,ico:S.isNazgul?'☠️':RACES[S.race].ico,type:heroType(),
      get hp(){return S.hpCur;}, set hp(v){S.hpCur=clamp(v,0,d.maxHp);},
      get mana(){return S.manaCur;}, set mana(v){S.manaCur=clamp(v,0,d.maxMana);},
      maxHp:d.maxHp,maxMana:d.maxMana,d,spd:d.spd,statuses:[],alive:S.hpCur>0,
      moves:S.equippedTech.slice()};
  } else {
    let a=ALLY_BY_ID[slot]; let d=allyDerived(slot); let ad=ensureAlly(slot);
    if(ad.hpCur==null)ad.hpCur=d.maxHp; if(ad.manaCur==null)ad.manaCur=d.maxMana;
    ad.hpCur=clamp(ad.hpCur,0,d.maxHp); ad.manaCur=clamp(ad.manaCur,0,d.maxMana);
    return {ref:slot,isHero:false,isAlly:true,name:a.n,ico:a.ico,type:d.type,
      get hp(){return ad.hpCur;}, set hp(v){ad.hpCur=clamp(v,0,d.maxHp);},
      get mana(){return ad.manaCur;}, set mana(v){ad.manaCur=clamp(v,0,d.maxMana);},
      maxHp:d.maxHp,maxMana:d.maxMana,d:{atkP:d.atkP,atkM:d.atkM,crit:d.crit,lifesteal:d.lifesteal,dodge:d.dodge,mitig:d.mitig},
      spd:d.spd,statuses:[],alive:ad.hpCur>0,moves:d.moves};
  }
}
function mkMob(mk,lv,diff){ diff=diff||1; let m=MOBS[mk];
  let hp=Math.floor((55+lv*19)*diff);
  return {ref:'',name:m.n,ico:m.ico,type:m.type,hp,maxHp:hp,
    atk:Math.floor((7+lv*1.85)*diff),spd:92+lv+ri(0,16),crit:0.07,
    mitig:Math.min(0.22, lv*0.004),abilities:(m.abil||[]).slice(),summonPool:m.summon,statuses:[],alive:true,lv}; }
function mkBoss(bk,lv,diff,opts){ diff=diff||1; opts=opts||{}; let bd=BOSSES[bk];
  let hp=Math.floor((240+lv*46)*diff*(opts.hpMul||1));
  let atk=Math.floor((11+lv*2.15)*diff*(opts.atkMul||1));
  let e={ref:'boss',name:bd.n,ico:bd.ico,type:bd.type,hp,maxHp:hp,
    atk,baseAtk:atk,spd:100+lv,crit:0.10,mitig:Math.min(0.30,0.08+lv*0.004),
    abilities:(bd.abil||[]).slice(),summonPool:bd.summon,statuses:[],alive:true,isBoss:true,lv,baseMaxHp:hp};
  if(opts.phases){ e.phases=opts.phases; e.phase=0; e.baseName=bd.n; e.name=bd.n+' — Forme I'; }
  return e; }
// Difficulté qui grimpe avec le niveau de zone : douce au début, très raide en fin de jeu.
// En Nazgûl, le monde se durcit aussi (sinon le jeu devient trivial).
function worldDiff(zoneLvl){
  let d = 0.90 + Math.pow(Math.min(zoneLvl,60)/60, 1.4) * 1.25;
  if(S&&S.isNazgul) d *= 1.08;
  return d;
}
function buildEnemies(zone,boss,mult){
  // explore : packs de monstres (plus durs, jusqu'à 4)
  let arr=[];
  let wd=worldDiff(zone.lvl)*(mult||1);
  let count=ri(2,Math.min(4,2+Math.floor(zone.lvl/9)));
  for(let i=0;i<count;i++){ let mk=pick(zone.mobs); let lv=zone.lvl+ri(0,3);
    let e=mkMob(mk,lv,wd); e.ref='e'+i; arr.push(e); }
  return arr;
}
let RUN=null; // état du donjon en cours
let PATH=null; // sentier d'approche en cours
let mapView='map'; // 'map' | 'shop'
let SHOP=null; // stock de boutique
function startBattle(boss){
  // explore simple
  let zone=ZONE_BY_ID[S.curZone];
  if(S.hpCur<=0){ S.hpCur=Math.max(1,Math.floor(heroDerived().maxHp*0.3)); }
  let enemies=buildEnemies(zone,false);
  beginBattle(enemies,{label:'Combat',zone});
}
function beginBattle(enemies,ctx){
  ctx=ctx||{};
  if(S.ringLock>0)S.ringLock--; // l'ultime se "recharge" au fil des combats
  let roster = S.isNazgul ? S.party.filter(r=>r==='hero') : S.party.slice();
  if(!roster.includes('hero'))roster.unshift('hero');
  let party=roster.map(buildPartyCombatant);
  B={party,enemies,all:[],order:[],turnPtr:0,round:1,over:false,result:null,
     awaiting:false,menu:'root',curMember:null,target:null,boss:!!ctx.boss,log:[],timer:null,
     zone:ctx.zone||ZONE_BY_ID[S.curZone],minimized:false,ctx,ringReady:0,pendingTech:null};
  party.forEach(p=>{ if(p.isHero){ for(let sl in S.equip){let it=S.equip[sl]; if(it&&it.passive==='p_firstaid')p.hp=Math.min(p.maxHp,p.hp+Math.floor(p.maxHp*0.05));} } });
  openBattle();
  buildOrder();
  logB(`⚔ ${ctx.label?ctx.label+' — ':''}${enemies.map(e=>e.name).join(', ')} !`);
  updateFab();
  scheduleTurn(650);
}

/* ===== DONJON : 20 étapes, 4 boss, boss final à phases ===== */
function startDungeon(zone){
  RUN={zoneId:zone.id, step:1, total:20, gold:0, xp:0, mat:0, ess:0, drops:[]};
  // soin complet à l'entrée
  healTeamFull();
  toast(`🏰 Donjon : ${zone.n}. 20 étapes, 4 gardiens. Bonne chance.`);
  dungeonStep();
}
function isMiniBossStep(s){ return s===5||s===10||s===15; }
function dungeonStep(){
  let zone=ZONE_BY_ID[RUN.zoneId]; let s=RUN.step;
  // difficulté qui grimpe au fil des étapes ET selon la zone (fin de jeu bien plus dure)
  let diff=(1+ (s-1)*0.05) * worldDiff(zone.lvl);
  let lv=zone.lvl+Math.floor(s*0.5);
  let enemies=[];
  if(s===RUN.total){
    // BOSS FINAL multi-phases (de plus en plus dur — surtout l'attaque)
    let phases=[
      {name:'Forme I'},
      {name:'Forme II — Courroux', atkMul:1.15, hpMul:0.72},
      {name:'Forme III — Déchaînement', atkMul:1.3, hpMul:0.78, enrage:true},
      {name:'Forme IV — Apothéose', atkMul:1.5, hpMul:0.82, enrage:true},
    ];
    let e=mkBoss(zone.boss,lv+3,diff,{phases,hpMul:0.62});
    e.ref='boss'; enemies=[e];
  } else if(isMiniBossStep(s)){
    let bk=pick(DUNGEON_MINIBOSS);
    let e=mkBoss(bk,lv,diff,{hpMul:0.85}); e.ref='boss'; enemies=[e];
    if(s>=10){ let a=mkMob(pick(zone.mobs),lv,diff); a.ref='e1'; enemies.push(a); }
  } else {
    let count=ri(2,4);
    for(let i=0;i<count;i++){ let e=mkMob(pick(zone.mobs),lv,diff); e.ref='e'+i; enemies.push(e); }
  }
  let label= s===RUN.total?`Étape ${s}/20 — GARDIEN FINAL`:(isMiniBossStep(s)?`Étape ${s}/20 — Gardien`:`Étape ${s}/20`);
  beginBattle(enemies,{label,zone,boss:isMiniBossStep(s)||s===RUN.total});
}
function advancePhase(boss){
  boss.phase++;
  let ph=boss.phases[boss.phase];
  let base=boss.baseMaxHp||boss.maxHp;
  let nm=Math.floor(base*(ph.hpMul||1));
  boss.maxHp=nm; boss.hp=nm; boss.alive=true;
  boss.atk=Math.floor((boss.baseAtk||boss.atk)*(ph.atkMul||1)); // relatif à la base, pas cumulatif
  boss.name=boss.baseName+' — '+ph.name;
  if(ph.enrage)addStatus(boss,'rage',99);
  boss.statuses=boss.statuses.filter(s=>s.id==='rage');
  logB(`💥 ${boss.baseName} change de forme : ${ph.name} !`);
  flash('#7a1030',.6); bigShake();
  spawnBurst(unitEl(boss),'tenebres',true); novaRing(unitEl(boss),'#ff2d6a',4);
  renderBattle();
}
function buildOrder(){
  B.all=[...B.party,...B.enemies].filter(c=>c.alive);
  B.all.sort((a,b)=>(b.spd-a.spd)||(Math.random()-.5));
  B.order=B.all; B.turnPtr=0;
}
function aliveEnemies(){ return B.enemies.filter(e=>e.alive); }
function aliveParty(){ return B.party.filter(p=>p.alive); }
function scheduleTurn(d){ if(!B||B.over)return; if(B.timer)clearTimeout(B.timer); B.timer=setTimeout(nextTurn,d); }

function nextTurn(){
  if(!B||B.over)return;
  if(B.turnPtr>=B.order.length){ B.round++; buildOrder(); }
  if(B.order.length===0)return;
  let actor=B.order[B.turnPtr];
  if(!actor||!actor.alive){ B.turnPtr++; return nextTurn(); }
  let skip=startStatuses(actor);
  if(checkEnd())return;
  renderBattle();
  if(!actor.alive){ B.turnPtr++; if(!checkEnd())scheduleTurn(380); return; }
  if(skip){ logB(`${actor.ico} ${actor.name} est entravé !`); flyText(unitEl(actor),'Entravé','miss'); endTurn(620); return; }
  let isParty=B.party.includes(actor);
  if(isParty){
    B.curMember=actor; B.menu='root';
    if(!B.target||!B.target.alive)B.target=aliveEnemies()[0];
    if(S.autoBattle){ B.awaiting=false; renderDock(); B.timer=setTimeout(()=>autoAct(actor),420); }
    else { B.awaiting=true; renderDock(); }
  } else {
    B.awaiting=false; renderDock(); B.timer=setTimeout(()=>enemyAct(actor),440);
  }
}
function endTurn(d){ if(!B||B.over)return; B.turnPtr++; renderBattle(); if(checkEnd())return; scheduleTurn(d||420); }

function checkEnd(){
  if(!B||B.over)return true;
  if(aliveEnemies().length===0){
    // boss final : passage de phase au lieu de mourir
    let fb=B.enemies.find(e=>e.phases && e.phase < e.phases.length-1);
    if(fb){ advancePhase(fb); return false; }
    B.over=true; clearTimeout(B.timer);
    if(PATH&&PATH.inCombat) pathCombatWin();
    else if(RUN) dungeonVictory(); else victory();
    return true;
  }
  if(aliveParty().length===0){ B.over=true; clearTimeout(B.timer); defeat(); return true; }
  return false;
}
function healTeamFull(){ let d=heroDerived(); S.hpCur=d.maxHp; S.manaCur=d.maxMana;
  S.recruited.forEach(id=>{ let ad=ensureAlly(id); let dd=allyDerived(id); ad.hpCur=dd.maxHp; ad.manaCur=dd.maxMana; }); }
function healTeamPct(p){ let d=heroDerived(); S.hpCur=Math.min(d.maxHp,(S.hpCur||0)+d.maxHp*p); S.manaCur=Math.min(d.maxMana,(S.manaCur||0)+d.maxMana*p);
  S.recruited.forEach(id=>{ let ad=ensureAlly(id); let dd=allyDerived(id); ad.hpCur=Math.min(dd.maxHp,(ad.hpCur||0)+dd.maxHp*p); ad.manaCur=Math.min(dd.maxMana,(ad.manaCur||0)+dd.maxMana*p); }); }

/* statuts */
function addStatus(c,id,turns){ let e=c.statuses.find(s=>s.id===id); if(e)e.turns=Math.max(e.turns,turns); else c.statuses.push({id,turns});
  // INTERRUPTION : geler/paralyser un ennemi qui charge annule son attaque dévastatrice
  if((id==='gel'||id==='paralysie') && c.charging){ c.charging=false; removeStatus(c,'charge');
    S.stats=S.stats||{}; S.stats.interrupts=(S.stats.interrupts||0)+1;
    logB(`✋ ${c.ico||''} ${c.name} est interrompu — sa charge est annulée !`); flyText(unitEl(c),'Interrompu !','heal'); sfx('interrupt'); }
}
function removeStatus(c,id){ c.statuses=c.statuses.filter(s=>s.id!==id); }
function hasStatus(c,id){ return c.statuses.some(s=>s.id===id); }
function startStatuses(actor){
  let skip=false;
  actor.statuses.forEach(s=>{ let d=STATUSES[s.id];
    if(d.dot){ let dmg=Math.max(1,Math.floor(actor.maxHp*d.dot)); actor.hp-=dmg; flyText(unitEl(actor),fmt(dmg),''); spawnBurst(unitEl(actor),d.el); }
    if(d.regen){ let h=Math.floor(actor.maxHp*d.regen); actor.hp=Math.min(actor.maxHp,actor.hp+h); flyText(unitEl(actor),'+'+fmt(h),'heal'); }
    if(d.skip&&Math.random()<d.skip)skip=true;
  });
  if(actor.hp<=0)actor.alive=false;
  actor.statuses.forEach(s=>s.turns--); actor.statuses=actor.statuses.filter(s=>s.turns>0);
  return skip;
}

/* dégâts */
function dmgCalc(attacker,target,raw,type,opts){
  opts=opts||{};
  let eff=opts.ignoreType?1:typeMult(type,target.type);
  if(opts.eff!=null)eff=opts.eff;
  let parts=[]; // détail « pourquoi ce chiffre »
  let d=raw*eff;
  if(eff>1.001)parts.push({t:`faiblesse ×${eff%1?eff.toFixed(1):eff}`,c:'good'});
  else if(eff<0.999)parts.push({t:`résistance ×${eff.toFixed(2).replace(/0$/,'')}`,c:'bad'});
  if(hasStatus(target,'vuln')){ d*=1.3; parts.push({t:'cible vulnérable +30%',c:'good'}); }
  if(hasStatus(target,'garde')){ d*=0.5; parts.push({t:'cible en garde −50%',c:'bad'}); }
  if(hasStatus(attacker,'benediction')){ d*=1.3; parts.push({t:'bénédiction +30%',c:'good'}); }
  if(hasStatus(attacker,'rage')){ d*=1.4; parts.push({t:'rage +40%',c:'good'}); }
  if(hasStatus(attacker,'fureur')){ d*=1.25; parts.push({t:'fureur +25%',c:'good'}); }
  if(hasStatus(attacker,'faiblesse')){ d*=0.7; parts.push({t:'affaibli −30%',c:'bad'}); }
  if(attacker.isHero){ for(let sl in S.equip){let it=S.equip[sl]; if(it&&it.passive==='p_berserk'&&attacker.hp<attacker.maxHp*0.3){d*=1.2; parts.push({t:'berserk +20%',c:'good'});}} }
  // réduction de dégâts de la cible (Vigueur + armure)
  let mit=(target.d&&typeof target.d.mitig==='number')?target.d.mitig:(target.mitig||0);
  d*=(1-mit);
  if(mit>0.005)parts.push({t:`réduction −${Math.round(mit*100)}%`,c:'bad'});
  let crit=Math.random()<((attacker.d&&attacker.d.crit!=null)?attacker.d.crit:(attacker.crit||0.06));
  if(crit){ let cd=(attacker.d&&attacker.d.critDmg)||1.6; d*=cd; parts.push({t:'CRITIQUE ×'+cd.toFixed(2).replace(/0$/,'').replace(/\.$/,''),c:'crit'}); }
  d=Math.max(1,Math.floor(d));
  if(attacker.isHero){ S.stats=S.stats||{}; if(d>(S.stats.maxHit||0))S.stats.maxHit=d; }
  let dg=(target.d&&target.d.dodge)?target.d.dodge:0;
  if(dg&&Math.random()<dg){ return {dmg:0,eff,crit:false,dodged:true,parts}; }
  target.hp-=d; if(target.hp<=0)target.alive=false;
  if(target.isHero){ for(let sl in S.equip){let it=S.equip[sl]; if(it&&it.passive==='p_thorns'){ let r=Math.floor(d*0.15); if(r>0&&attacker.alive){attacker.hp-=r; if(attacker.hp<=0)attacker.alive=false;} }} }
  return {dmg:d,eff,crit,dodged:false,parts};
}
// matchups de type d'une cible (faiblesses / résistances) pour l'affichage
function typeMatchup(defType){
  let weak=[],resist=[];
  for(let atk in TYPES){ let m=typeMult(atk,defType); if(m>1)weak.push(atk); else if(m<1)resist.push(atk); }
  return {weak,resist};
}
function effLabel(eff){ if(eff>1.001)return {txt:'×'+(eff%1?eff.toFixed(1):eff)+' efficace',cls:'good'}; if(eff<0.999)return {txt:'×'+eff.toFixed(2).replace(/0$/,'')+' résisté',cls:'bad'}; return {txt:'neutre',cls:'neu'}; }

/* ACTIONS JOUEUR */
function canAct(){ return B&&!B.over&&B.awaiting&&B.curMember&&B.curMember.alive&&B.party.includes(B.curMember); }
function techCdLeft(actor,t){ if(!t.cd)return 0; let r=actor.cds&&actor.cds[t.id]; return r&&B.round<r?(r-B.round):0; }
function setTechCd(actor,t){ if(t.cd){ actor.cds=actor.cds||{}; actor.cds[t.id]=B.round+t.cd; } }
function ringCdLeft(){ return Math.max(0, S.ringLock||0); } // en COMBATS
window.cmdAttack=function(){ if(!canAct())return; doMove(B.curMember,TECH_BY_ID.ph1,B.target); };
window.cmdOpenTech=function(){ if(!canAct())return; B.menu='tech'; renderDock(); };
window.cmdOpenItems=function(){ if(!canAct())return; B.menu='items'; renderDock(); };
window.cmdDefend=function(){ if(!canAct())return; let m=B.curMember; addStatus(m,'garde',1); m.mana=Math.min(m.maxMana,m.mana+Math.ceil(m.maxMana*0.08)); m.hp=Math.min(m.maxHp,m.hp+Math.floor(m.maxHp*0.04)); logB(`${m.ico} ${m.name} se met en garde.`); spawnBurst(unitEl(m),'lumiere',true); finishMember(); };
window.cmdBack=function(){ B.menu='root'; renderDock(); };
window.cmdUseTech=function(id){ if(!canAct())return; let t=TECH_BY_ID[id]; let m=B.curMember;
  if(S.isNazgul&&m.isHero){ if(t.cost&&m.hp<=hpCostOf(t)){ toast('🩸 Pas assez de vie pour cette technique !'); return; } }
  else if((m.mana||0)<t.cost){ toast('🔮 Pas assez de mana !'); return; }
  if(techCdLeft(m,t)>0){ toast(`⏳ Recharge : ${techCdLeft(m,t)} tour(s).`); return; }
  // soin/buff monocible → on choisit l'allié
  let needAlly = (t.kind==='heal'&&!t.revive&&t.target!=='allyAll') || (t.kind==='buff'&&t.target==='ally');
  if(needAlly){ B.menu='ally'; B.pendingTech=id; renderDock(); return; }
  let target=B.target; if(!target||!target.alive)target=aliveEnemies()[0];
  doMove(m,t,target); };
window.cmdSelectAlly=function(ref){ if(!canAct()||!B.pendingTech)return; let t=TECH_BY_ID[B.pendingTech];
  let ally=B.party.find(p=>p.ref===ref&&p.alive); if(!ally)return; B.pendingTech=null; doMove(B.curMember,t,ally); };
window.cmdSelectTarget=function(ref){ if(!B)return; let e=B.enemies.find(x=>x.ref===ref&&x.alive); if(e){B.target=e; renderEnemies(); renderDock();} };
window.cmdItem=function(kind){ if(!canAct())return; let m=B.curMember;
  S.consumables=S.consumables||{};
  if((S.consumables[kind]||0)<=0){ toast('Plus de stock — achète-en chez le marchand.'); return; }
  if(kind==='potion'){ let heal=Math.floor(m.maxHp*0.20); m.hp=Math.min(m.maxHp,m.hp+heal); flyText(unitEl(m),'+'+fmt(heal),'heal'); spawnBurst(unitEl(m),'lumiere',true); logB(`${m.name} boit une Potion (+${fmt(heal)} PV).`); sfx('heal'); }
  else if(kind==='potionPlus'){ let heal=Math.floor(m.maxHp*0.42); m.hp=Math.min(m.maxHp,m.hp+heal); flyText(unitEl(m),'+'+fmt(heal),'heal'); spawnBurst(unitEl(m),'lumiere',true); logB(`${m.name} boit une Grande Potion (+${fmt(heal)} PV).`); sfx('heal'); }
  else if(kind==='ether'){ let mn=Math.floor(m.maxMana*0.24); m.mana=Math.min(m.maxMana,m.mana+mn); flyText(unitEl(m),'+'+fmt(mn),'mana'); logB(`${m.name} boit un Éther (+${fmt(mn)} mana).`); sfx('magic'); }
  else if(kind==='etherPlus'){ let mn=Math.floor(m.maxMana*0.45); m.mana=Math.min(m.maxMana,m.mana+mn); flyText(unitEl(m),'+'+fmt(mn),'mana'); logB(`${m.name} boit un Grand Éther (+${fmt(mn)} mana).`); sfx('magic'); }
  S.consumables[kind]=Math.max(0,(S.consumables[kind]||0)-1); save();
  finishMember(); };

// Pouvoir de l'Anneau — accessible à tous dès le départ ; monte lentement la corruption
window.cmdRing=function(){ if(!canAct())return; let m=B.curMember; if(!m.isHero){ toast('Seul le Porteur peut user de l\'Anneau.'); return; }
  if(ringCdLeft()>0){ toast(`💍 ${S.isNazgul?'Pouvoir de Spectre':'L\'Anneau'} : indisponible (${ringCdLeft()} combat${ringCdLeft()>1?'s':''}).`); return; }
  B.awaiting=false;
  let targets=aliveEnemies(); let total=0;
  let raw=(m.d.atkM+m.d.atkP)*(S.isNazgul?3.1:2.6);
  ringFx();
  targets.forEach(tt=>{ let r=dmgCalc(m,tt,raw,'tenebres',{ignoreType:true}); if(!r.dodged){ flyText(unitEl(tt),fmt(r.dmg),'crit'); shake(unitEl(tt),true); total+=r.dmg; } });
  m.hp=Math.min(m.maxHp,m.hp+Math.floor(m.maxHp*0.15));
  if(!S.isNazgul){ addCorruption(4); }
  S.ringUses=(S.ringUses||0)+1;
  S.ringLock=RING_FIGHTS; // ultime : verrouillé pour plusieurs combats
  logB(`💍 ${m.name} déchaîne ${S.isNazgul?'le Pouvoir de Spectre':'l\'Anneau Unique'} — ${fmt(total)} dégâts ténébreux ! (indisponible ${RING_FIGHTS} combats)`);
  sfx(S.isNazgul?'spectre':'ring'); bigShake(); flash('#3a0a2a',.5);
  finishMember();
};

function hpCostOf(t){ return Math.max(3,Math.ceil(heroDerived().maxHp*((t.cost||0)/240))); }
function doMove(actor,t,target){
  B.awaiting=false;
  // coût : VIE en mode Nazgûl (le pouvoir a un prix), MANA sinon
  if(t.cost){
    if(S.isNazgul&&actor.isHero){ let hpCost=Math.max(3,Math.ceil(actor.maxHp*(t.cost/240)));
      actor.hp=Math.max(1,actor.hp-hpCost); flyText(unitEl(actor),'-'+fmt(hpCost),'crit'); spawnBurst(unitEl(actor),'tenebres'); }
    else actor.mana=Math.max(0,actor.mana-t.cost);
  }
  setTechCd(actor,t);
  let stat=t.stat==='force'?(actor.d.atkP):(actor.d.atkM);
  let prim=techPrimary(t);
  if(t.kind==='heal'){
    let healMul=(actor.isHero?heroDerived().healMul:1);
    let amt=Math.floor((stat*t.pow*0.75 + actor.maxHp*0.03)*healMul);
    let targets;
    if(t.revive){ let dead=B.party.find(p=>!p.alive); if(dead){ dead.alive=true; dead.hp=Math.floor(dead.maxHp*Math.max(0.4,t.pow)); flyText(unitEl(dead),'Ranimé !','heal'); playTechVfx(t,actor,[dead]); logB(`${actor.ico} ${actor.name} ranime ${dead.name} !`); sfx('heal'); finishMember(); return; }
      targets=[chosenAlly(target)]; }
    else targets= t.target==='allyAll'?aliveParty():[chosenAlly(target)];
    targets.forEach(tt=>{ if(!tt)return; tt.hp=Math.min(tt.maxHp,tt.hp+amt); flyText(unitEl(tt),'+'+fmt(amt),'heal'); });
    playTechVfx(t,actor,targets);
    logB(`${actor.ico} ${actor.name} — ${t.n} : +${fmt(amt)} PV.`);
    sfx('heal');
  } else if(t.kind==='buff'){
    let st=t.status||'benediction';
    let targets= t.target==='ally'?[chosenAlly(target)]:aliveParty();
    targets.forEach(tt=>{ if(tt)addStatus(tt,st,3); });
    playTechVfx(t,actor,targets);
    logB(`${actor.ico} ${actor.name} — ${t.n} : ${STATUSES[st]?STATUSES[st].n:'buff'} !`);
    sfx('buff');
  } else if(t.kind==='debuff'){
    let st=t.status||'faiblesse';
    let targets= t.target==='all'?aliveEnemies():[ (target&&target.alive&&!B.party.includes(target))?target:aliveEnemies()[0] ];
    playTechVfx(t,actor,targets);
    targets.forEach(tt=>{ if(!tt)return; addStatus(tt,st,st==='vuln'?2:3); flyText(unitEl(tt),STATUSES[st]?STATUSES[st].n:'—','miss'); });
    logB(`${actor.ico} ${actor.name} — ${t.n} : ${STATUSES[st]?STATUSES[st].n:''} sur ${targets.length>1?'tous':'la cible'}.`);
    sfx('debuff');
    if(actor.isHero&&!S.isNazgul&&techTypes(t).includes('tenebres')) addCorruption(2);
  } else { // attack
    let targets= t.target==='all'?aliveEnemies():[target&&target.alive?target:aliveEnemies()[0]];
    let hits=t.hits||1; let totalDealt=0; let big=false; let lastR=null;
    playTechVfx(t,actor,targets);
    targets.forEach(tt=>{
      if(!tt)return;
      for(let h=0;h<hits;h++){
        if(!tt.alive)break;
        let raw=stat*t.pow;
        // les Ténèbres se nourrissent de la corruption : +20% à +70% de dégâts
        if(techTypes(t).includes('tenebres')){
          if(actor.isHero) raw*= S.isNazgul ? 1.6 : (1.2 + (S.corruption||0)*0.005);
        }
        let eff=techEff(t,tt.type);
        let r=dmgCalc(actor,tt,raw,prim,{eff});
        if(r.dodged){ flyText(unitEl(tt),'Esquive','miss'); }
        else{ flyText(unitEl(tt),fmt(r.dmg),r.crit?'crit':''); totalDealt+=r.dmg; if(r.crit)big=true; lastR=r;
          if(t.status&&Math.random()<0.35&&tt.alive){ addStatus(tt,t.status,t.status==='vuln'?2:3); logB(`→ ${tt.name} : ${STATUSES[t.status].n}`); }
        }
      }
    });
    if(t.drain&&totalDealt>0){ let h=Math.floor(totalDealt*t.drain); actor.hp=Math.min(actor.maxHp,actor.hp+h); flyText(unitEl(actor),'+'+fmt(h),'heal'); }
    if(actor.d&&actor.d.lifesteal&&totalDealt>0){ let h=Math.floor(totalDealt*actor.d.lifesteal); if(h>0){actor.hp=Math.min(actor.maxHp,actor.hp+h); flyText(unitEl(actor),'+'+fmt(h),'heal');} }
    // détail « pourquoi ce chiffre » (pour les coups de l'équipe)
    if(lastR&&(actor.isHero||actor.isAlly)){
      B.lastHit={who:actor.name,move:t.n,dmg:totalDealt,hits:hits*targets.length,parts:lastR.parts};
      let dt=lastR.parts.length?' · '+lastR.parts.map(p=>p.t).join(' · '):'';
      logB(`${actor.ico} ${actor.name} — ${t.n}${t.cost?` (${t.cost} mana)`:''} : ${fmt(totalDealt)} dégâts${dt}.`);
    } else
    logB(`${actor.ico} ${actor.name} — ${t.n}${t.cost?` (${t.cost} mana)`:''} : ${fmt(totalDealt)} dégâts.`);
    sfx(big?'crit':(prim==='physique'?'hit':'magic'));
    // corruption : les Ténèbres rongent plus vite (le prix de leur puissance)
    if(actor.isHero&&!S.isNazgul&&techTypes(t).includes('tenebres')){ addCorruption(t.target==='all'?4:3); }
  }
  if(!t.cost){ actor.mana=Math.min(actor.maxMana,actor.mana+Math.ceil(actor.maxMana*0.05)); }
  finishMember();
}
function lowestAlly(){ let a=aliveParty(); a.sort((x,y)=>(x.hp/x.maxHp)-(y.hp/y.maxHp)); return a[0]; }
function chosenAlly(target){ return (target&&target.alive&&B.party.includes(target))?target:lowestAlly(); }
function finishMember(){ B.menu='root'; renderBattle(); endTurn(420); }

/* IA équipe (auto) */
function autoAct(m){
  if(!B||B.over||!m.alive)return; B.awaiting=true;
  let naz=S.isNazgul&&m.isHero;
  let usable=t=>(naz?(!t.cost||m.hp>hpCostOf(t)*1.5):(m.mana||0)>=t.cost) && techCdLeft(m,t)<=0;
  let moves=m.moves.map(id=>TECH_BY_ID[id]).filter(Boolean);
  // 1) ranimer un allié tombé si possible
  let reviveT=moves.find(t=>t.revive&&usable(t));
  if(reviveT&&B.party.some(p=>!p.alive)){ doMove(m,reviveT,null); return; }
  // 2) soigner si l'équipe est entamée
  let low=aliveParty().find(p=>p.hp<p.maxHp*0.45);
  let healT=moves.filter(t=>t.kind==='heal'&&!t.revive&&usable(t)).sort((a,b)=>b.pow-a.pow)[0];
  let aoeLow=aliveParty().filter(p=>p.hp<p.maxHp*0.6).length>=2;
  if(healT&&(low||(aoeLow&&healT.target==='allyAll'))){ doMove(m,healT,low||lowestAlly()); return; }
  // 3) buff utile en début de combat
  let buffT=moves.find(t=>t.kind==='buff'&&usable(t));
  if(buffT&&B.round<=2&&Math.random()<0.5){ doMove(m,buffT,lowestAlly()); return; }
  // 4) attaque : cible la plus faible (% PV), meilleure tech
  let enemies=aliveEnemies(); if(enemies.length===0){finishMember();return;}
  let target=enemies.slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
  // 4b) un debuff de temps en temps sur la cible
  let debT=moves.find(t=>t.kind==='debuff'&&usable(t)&&!hasStatus(target,t.status));
  if(debT&&Math.random()<0.35){ doMove(m,debT,target); return; }
  let atk=moves.filter(t=>t.kind==='attack'&&usable(t));
  let best=atk.sort((a,b)=>(b.pow*techEff(b,target.type))-(a.pow*techEff(a,target.type)))[0]||TECH_BY_ID.ph1;
  doMove(m,best,target);
}

/* IA ennemie — soigne, invoque, charge des attaques télégraphiées, frappe en zone */
function enemyAct(e){
  if(!B||B.over||!e.alive){ endTurn(360); return; }
  let targets=aliveParty(); if(targets.length===0){endTurn(360);return;}
  let enraged=hasStatus(e,'rage');
  let ab=e.abilities||[];

  // --- 0) CHARGE LIBÉRÉE : l'attaque dévastatrice télégraphiée frappe toute l'équipe ---
  if(e.charging){
    e.charging=false; removeStatus(e,'charge');
    logB(`💥 ${e.ico} ${e.name} libère ${e.chargeName||'sa charge'} sur toute l'équipe !`);
    flash('#7a1030',.55); bigShake();
    targets.forEach(tg=>{ let r=dmgCalc(e,tg,e.atk*(e.chargeMult||2.2),e.type,{});
      if(r.dodged)flyText(unitEl(tg),'Esquive','miss');
      else{ flyText(unitEl(tg),fmt(r.dmg),'crit'); spawnAttackVfx(e,tg,e.type,true); shake(unitEl(tg),true); } });
    e.chargedRecently=true; sfx('ehit'); endTurn(560); return;
  }

  // --- 1) SOIN : l'ennemi rétablit l'allié le plus mal en point ---
  if(ab.includes('heal') && Math.random()<0.5){
    let wounded=aliveEnemies().filter(x=>x.hp<x.maxHp*0.65).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];
    if(wounded){ let amt=Math.floor(wounded.maxHp*0.22); wounded.hp=Math.min(wounded.maxHp,wounded.hp+amt);
      flyText(unitEl(wounded),'+'+fmt(amt),'heal'); spawnBurst(unitEl(wounded),'lumiere',true);
      logB(`✨ ${e.ico} ${e.name} canalise un soin sur ${wounded.name} (+${fmt(amt)} PV).`); sfx('heal'); endTurn(480); return; }
  }

  // --- 2) INVOCATION : ajoute des renforts (plafonné) ---
  if(ab.includes('summon') && B.enemies.filter(x=>x.alive).length<5 && Math.random()<(enraged?0.5:0.3)){
    let n=ri(1,2); let made=[];
    for(let i=0;i<n && B.enemies.length<6;i++){
      let mk=pick(e.summonPool||['gobelin']); let mob=mkMob(mk, Math.max(1,(e.lv||5)-2), worldDiff(e.lv||5)*0.85);
      mob.ref='sum'+(B._sumc=(B._sumc||0)+1); B.enemies.push(mob); made.push(mob);
    }
    if(made.length){ logB(`👾 ${e.ico} ${e.name} invoque ${made.length} renfort(s) : ${made.map(m=>m.name).join(', ')} !`);
      flash('#3a1850',.3); renderBattle(); made.forEach(m=>{let el=unitEl(m); if(el)spawnBurst(el,'tenebres',true);});
      sfx('summon'); endTurn(520); return; }
  }

  // --- 3) PRÉPARATION DE CHARGE : télégraphiée, interruptible (gel / paralysie) ---
  if(ab.includes('charge') && !e.charging && !e.chargedRecently && Math.random()<(e.isBoss?0.32:0.4)){
    e.charging=true; e.chargeName=pick(['Déflagration','Frappe Cataclysmique','Souffle Dévastateur','Onde de Ruine']);
    e.chargeMult=e.isBoss?2.5:1.9; addStatus(e,'charge',5);
    logB(`⚠️ ${e.ico} ${e.name} prépare ${e.chargeName} ! Interromps-le avec un Gel ❄️ ou une Paralysie ⚡.`);
    flash('#ffcf5a',.18); renderBattle(); sfx('charge'); endTurn(520); return;
  }
  if(e.chargedRecently && Math.random()<0.5) e.chargedRecently=false; // peut recharger plus tard

  // --- AoE boss occasionnelle (hors charge) ---
  if(e.isBoss&&Math.random()<(enraged?0.4:0.22)){
    logB(`${e.ico} ${e.name} déchaîne une attaque de zone !`); flash('#7a1030',.35); bigShake();
    targets.forEach(tg=>{ let r=dmgCalc(e,tg,e.atk*0.8,e.type,{ignoreType:false});
      if(r.dodged)flyText(unitEl(tg),'Esquive','miss');
      else{ flyText(unitEl(tg),fmt(r.dmg),r.crit?'crit':''); spawnAttackVfx(e,tg,e.type,true); } });
    sfx('ehit'); endTurn(520); return;
  }
  // focus fire : 65% cible le plus bas en PV%
  let target= Math.random()<0.65 ? targets.slice().sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0] : pick(targets);
  let special=Math.random()<(e.isBoss?0.45:0.28);
  let raw=e.atk*(special?1.4:1);
  let r=dmgCalc(e,target,raw,e.type,{ignoreType:!special});
  if(r.dodged){ flyText(unitEl(target),'Esquive','miss'); logB(`${target.name} esquive ${e.name} !`); }
  else{
    flyText(unitEl(target),fmt(r.dmg),r.crit?'crit':'');
    spawnAttackVfx(e,target,e.type,r.crit||special);
    shake(unitEl(target),r.crit||special);
    logB(`${e.ico} ${e.name} ${special?'déchaîne':'frappe'} ${target.name} : ${fmt(r.dmg)}.`);
    if(special&&Math.random()<0.6&&TYPE_STATUS[e.type]&&target.alive){ addStatus(target,TYPE_STATUS[e.type],3); logB(`→ ${target.name} : ${STATUSES[TYPE_STATUS[e.type]].n}`); }
    sfx('ehit');
  }
  endTurn(440);
}

/* FIN DE COMBAT */
function grantRewards(zone,boss,opt){
  opt=opt||{};
  let lv=zone.lvl + (opt.lvBonus||0);
  let mult=opt.mult||1;
  let gp=1+(heroDerived().goldPct||0);
  let gold=Math.floor((boss?70:20)*(1+lv*0.5)*(Math.random()*0.4+0.8)*mult*gp);
  let xp=Math.floor((boss?120:30)*Math.pow(1.18,lv-1)*mult);
  if(RACES[S.race].pid==='xp')xp=Math.floor(xp*1.12);
  let matG=ri(boss?10:1,boss?20:5);
  let essG=Math.round((boss?ri(3,7):(Math.random()<0.5?ri(1,2):0))*gp);
  S.gold+=gold; S.mat+=matG; S.ess+=essG; S.kills+=B.enemies.length;
  S.stats=S.stats||{}; S.stats.fights=(S.stats.fights||0)+1;
  let drops=[]; let drop=heroDerived().drop;
  let nDrops=boss?ri(2,3):(Math.random()<0.55*drop?1:0);
  for(let i=0;i<nDrops;i++){ let r=rollRarity(boss,drop,opt.eliteBonus||0);
    let baseId = r>=5 ? pick(UNIQUE_BASE_IDS) : pickDropBase(zone);
    let it=genItem(baseId,r,lv+(boss?3:0)); S.inv.push(it); drops.push(it); }
  // niveaux héros
  S.xp+=xp; let gained=0; while(S.xp>=xpNeeded(S.level)){ S.xp-=xpNeeded(S.level); S.level++; S.statPoints+=3; S.talentPoints=(S.talentPoints||0)+1; gained++; }
  // niveaux alliés
  let allyMsgs=[];
  S.recruited.forEach(id=>{ let ad=ensureAlly(id); let active=S.party.includes(id);
    let axp=Math.floor(xp*(active?0.9:0.4)); ad.xp+=axp; let ag=0;
    while(ad.xp>=xpNeeded(ad.level)){ ad.xp-=xpNeeded(ad.level); ad.level++; ad.statPoints+=3; ag++; }
    if(ag>0)allyMsgs.push(`${ALLY_BY_ID[id].ico} ${ALLY_BY_ID[id].n} niv.${ad.level}`);
  });
  return {gold,xp,matG,essG,drops,gained,levelGain:gained,allyMsgs,drop};
}
function victory(){
  let zone=B.zone; let boss=B.boss;
  let R=grantRewards(zone,boss,{});
  let recruitedMsg='';
  let pool=(zone.recruits||[]).filter(id=>!S.recruited.includes(id));
  if(pool.length){ let recruit=null;
    if(Math.random()<0.10*R.drop)recruit=pick(pool);
    if(recruit){ S.recruited.push(recruit); let ad=ensureAlly(recruit); ad.level=Math.max(1,S.level-1);
      if(S.party.length<3)S.party.push(recruit);
      recruitedMsg=`${ALLY_BY_ID[recruit].ico} ${ALLY_BY_ID[recruit].n} rejoint ta quête !`; }
  }
  if(S.hpCur<=0)S.hpCur=Math.floor(heroDerived().maxHp*0.4);
  save();
  showResult(true,Object.assign(R,{recruitedMsg}));
}
function dungeonVictory(){
  let zone=ZONE_BY_ID[RUN.zoneId]; let s=RUN.step;
  let boss=isMiniBossStep(s)||s===RUN.total;
  let R=grantRewards(zone,boss,{lvBonus:Math.floor(s*0.8),mult: boss?1.1:0.5});
  RUN.gold+=R.gold; RUN.xp+=R.xp; RUN.mat+=R.matG; RUN.ess+=R.essG; RUN.drops.push(...R.drops);
  save();
  if(s>=RUN.total){ return dungeonComplete(); }
  // checkpoint : soin partiel après un gardien
  if(isMiniBossStep(s)){ healTeamPct(0.5); logB('✨ Un répit : l\'équipe récupère un peu.'); }
  RUN.step++;
  // enchaîne l'étape suivante
  let auto=S.autoBattle||B.minimized;
  let prog={step:RUN.step-1,total:RUN.total,levelGain:R.levelGain,allyMsgs:R.allyMsgs,boss};
  if(auto){ if(B&&B.minimized){ toast(`Étape ${prog.step}/20 franchie`); } setTimeout(()=>{ if(RUN){ closeBattleKeep(); dungeonStep(); } },900); }
  else { showStepResult(prog); }
}
function showStepResult(p){
  let ov=$('#resultOverlay'); ov.classList.add('on','win');
  ov.innerHTML=`<h2>Étape ${p.step}/20</h2>
    <div class="reward-line">${p.boss?'⚔️ Gardien vaincu !':'Zone franchie.'}</div>
    ${p.levelGain?`<div class="reward-line" style="color:var(--ember-bright)">⭐ Niveau ${S.level} !</div>`:''}
    ${(p.allyMsgs&&p.allyMsgs.length)?`<div class="reward-line" style="color:var(--xp)">⬆ ${p.allyMsgs.join(' · ')}</div>`:''}
    <div class="sub" style="margin:8px 0">Progression : ${p.step}/20 · 4 gardiens</div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn gold block" onclick="nextDungeonStep()">Continuer ▸</button>
      <button class="btn ghost" onclick="abandonDungeon()">Abandonner</button>
    </div>`;
  sfx('win');
}
window.nextDungeonStep=function(){ $('#resultOverlay').classList.remove('on','win','lose'); if(RUN){ closeBattleKeep(); dungeonStep(); } };
window.abandonDungeon=function(){ RUN=null; $('#resultOverlay').classList.remove('on','win','lose'); closeBattle(); openScreen('map'); renderTop(); renderMap(); };
function closeBattleKeep(){ if(B&&B.timer)clearTimeout(B.timer); B=null; } // ferme le combat sans quitter l'overlay/donjon
function dungeonComplete(){
  let zone=ZONE_BY_ID[RUN.zoneId];
  // grosse récompense de fin
  let bonusGold=Math.floor(zone.lvl*60+RUN.gold*0.5); S.gold+=bonusGold;
  let bonusEss=ri(8,16); S.ess+=bonusEss;
  // clear + déblocage + recrue garantie
  let recruitedMsg='';
  if(!S.cleared.includes(zone.id)){ S.cleared.push(zone.id);
    let idx=ZONES.findIndex(z=>z.id===zone.id); if(idx<ZONES.length-1)S.zoneIdx=Math.max(S.zoneIdx,idx+1);
    let pool=(zone.recruits||[]).filter(id=>!S.recruited.includes(id));
    if(pool.length){ let r=pool[0]; S.recruited.push(r); let ad=ensureAlly(r); ad.level=Math.max(1,S.level-1); if(S.party.length<3)S.party.push(r);
      recruitedMsg=`${ALLY_BY_ID[r].ico} ${ALLY_BY_ID[r].n} rejoint ta quête !`; }
  }
  let drops=RUN.drops.slice(-4);
  let data={gold:RUN.gold+bonusGold,xp:RUN.xp,matG:RUN.mat,essG:RUN.ess+bonusEss,drops,recruitedMsg,dungeon:true,zoneName:zone.n};
  RUN=null; save();
  showResult(true,data);
}
function rollRarity(boss,drop,eliteBonus){
  // shift : la chance (drop), les boss et les élites poussent vers le haut
  let luck=(drop>1?(drop-1):0);
  let shift=luck*0.10 + (boss?0.07:0) + (eliteBonus||0);
  let r=Math.max(0,Math.random()-shift*Math.random());
  if(r<0.001)return 5; // Unique     0,1%
  if(r<0.011)return 4; // Légendaire  1%
  if(r<0.051)return 3; // Épique      4%
  if(r<0.151)return 2; // Rare        10%
  if(r<0.401)return 1; // Peu commun  25%
  return 0;            // Commun      60%
}
// chaque région peut lâcher n'importe quel type d'item, avec un biais sur son butin signature
const ALL_DROP_BASES=Object.keys(ITEM_BASES).filter(id=>!ITEM_BASES[id].unique && id!=='anneau_unique');
function pickDropBase(zone){
  if(zone&&zone.loot&&zone.loot.length&&Math.random()<0.45)return pick(zone.loot);
  return pick(ALL_DROP_BASES);
}
function defeat(){
  let inDungeon=!!RUN; RUN=null;
  let inPath=!!PATH; PATH=null;
  let lost=Math.floor(S.gold*(inDungeon?0.15:0.08)); S.gold-=lost;
  S.hpCur=Math.floor(heroDerived().maxHp*0.4); S.manaCur=Math.floor(heroDerived().maxMana*0.4);
  save();
  showResult(false,{lost,inDungeon,inPath});
}

/* ===================================================================
   AFFICHAGE COMBAT
   =================================================================== */
function openBattle(){ $('#battle').classList.add('on'); B.minimized=false; $('#resultOverlay').classList.remove('on','win','lose'); spawnEmbers(); Music.ensure(); updateFab(); }
function closeBattle(){ $('#battle').classList.remove('on'); B=null; updateFab(); }
function spawnEmbers(){ let e=$('#embers'); if(!e)return; if(e.childElementCount>0)return;
  for(let i=0;i<22;i++){ let p=ce('div','ember'); p.style.left=rnd(0,100)+'%';
    p.style.animationDuration=rnd(6,14)+'s'; p.style.animationDelay=(-rnd(0,12))+'s';
    p.style.setProperty('--drift',rnd(-40,40)+'px'); let s=rnd(2,5); p.style.width=s+'px'; p.style.height=s+'px';
    e.appendChild(p); } }
function logB(msg){ if(!B)return; B.log.unshift(msg); if(B.log.length>16)B.log.length=16;
  let el=$('#combatLog'); if(el)el.innerHTML=B.log.slice(0,3).map((l,i)=>`<div${i===0?' class="lnew"':''}>${l}</div>`).join(''); }
function unitEl(c){ if(!c)return null;
  if(B&&B.party.includes(c))return document.querySelector(`.pmember[data-ref="${c.ref}"]`);
  return document.querySelector(`.enemy-unit[data-ref="${c.ref}"]`); }

function renderBattle(){ renderInit(); renderEnemies(); renderParty(); renderBanner(); }
function renderInit(){
  let el=$('#initRibbon'); if(!el||!B)return;
  let cur=B.order[B.turnPtr];
  el.innerHTML=`<span class="rlabel">M${B.round}</span>`+B.order.map(c=>{
    let enemy=B.enemies.includes(c);
    return `<span class="init-chip ${enemy?'enemy':''} ${cur&&cur===c?'cur':''} ${c.alive?'':'dead'}">${c.ico}</span>`;
  }).join('');
}
function renderEnemies(){
  let el=$('#enemyRow'); if(!el||!B)return;
  el.innerHTML=B.enemies.map(e=>{
    let pct=Math.max(0,e.hp/e.maxHp*100);
    let tgt=(B.target===e)?'targeted':'';
    return `<div class="enemy-unit ${e.isBoss?'boss':''} ${tgt} ${e.alive?'':'dead'}" data-ref="${e.ref}" onclick="cmdSelectTarget('${e.ref}')">
      <div class="statusline">${e.statuses.map(s=>`<span class="st" style="color:${STATUSES[s.id].col}" title="${STATUSES[s.id].n} — ${STATUSES[s.id].desc}">${STATUSES[s.id].ico}<sub>${s.turns<90?s.turns:''}</sub></span>`).join('')}</div>
      <div class="portrait">${e.ico}</div>
      <div class="ename">${e.name} ${tchip(e.type)}</div>
      <div class="ehp"><div class="bar hp"><i style="width:${pct}%"></i></div></div>
      <div class="ehp-num">${fmt(Math.max(0,e.hp))}/${fmt(e.maxHp)}</div>
      ${tgt?`<div class="emu">${matchupHtml(e.type)}</div>`:''}
    </div>`;
  }).join('');
}
function renderParty(){
  let el=$('#partyRow'); if(!el||!B)return;
  let cur=B.order[B.turnPtr];
  el.innerHTML=B.party.map(p=>{
    let hpct=Math.max(0,p.hp/p.maxHp*100), mpct=Math.max(0,(p.mana||0)/(p.maxMana||1)*100);
    return `<div class="pmember ${cur===p?'cur':''} ${p.alive?'':'dead'}" data-ref="${p.ref}">
      <div class="ptop"><span class="pico">${p.ico}</span>
        <div style="flex:1;min-width:0"><div class="pname">${p.name}</div>
        <div class="statusline" style="justify-content:flex-start">${p.statuses.map(s=>`<span class="st" style="color:${STATUSES[s.id].col}">${STATUSES[s.id].ico}</span>`).join('')}</div></div>
      </div>
      <div class="pbars">
        <div class="pnum"><span>PV</span><span>${fmt(Math.max(0,p.hp))}/${fmt(p.maxHp)}</span></div>
        <div class="bar hp"><i style="width:${hpct}%"></i></div>
        ${(p.isHero&&S.isNazgul)?`<div class="pnum naz-note"><span>🩸 Magie de sang</span></div>`:`<div class="pnum"><span>MP</span><span>${fmt(p.mana||0)}/${fmt(p.maxMana||0)}</span></div>
        <div class="bar mp"><i style="width:${mpct}%"></i></div>`}
      </div>
    </div>`;
  }).join('');
}
function renderBanner(){
  let el=$('#turnBanner'); if(!el||!B)return;
  let cur=B.order[B.turnPtr];
  if(B.over){ el.innerHTML=''; return; }
  if(S.autoBattle){ el.innerHTML=`<span class="auto">⚡ Combat automatique</span>`; return; }
  if(cur&&B.party.includes(cur)&&B.awaiting)el.innerHTML=`<span class="you">▶ ${cur.name} — à toi de jouer</span>`;
  else if(cur)el.innerHTML=`<span class="wait">${cur.ico} ${cur.name}…</span>`;
  else el.innerHTML='';
}
function renderDock(){
  let el=$('#cmdDock'); if(!el)return;
  let auto=S.autoBattle;
  let autoBtn=`<button class="auto-pill ${auto?'on':''}" onclick="toggleAuto()">${auto?'⚡ AUTO ON':'AUTO OFF'}</button>`;
  if(!B||B.over){ el.innerHTML=`<div class="dock-head"><span class="dt">—</span>${autoBtn}</div>`; return; }
  let cur=B.curMember; let myTurn=cur&&cur.alive&&B.awaiting&&B.party.includes(cur)&&!auto&&B.order[B.turnPtr]===cur;
  if(!myTurn){ el.innerHTML=`<div class="dock-head"><span class="dt">${cur?cur.name:''}</span>${autoBtn}</div>
    <div style="text-align:center;color:var(--faint);padding:14px;font-size:12px">${auto?'L\'équipe combat seule…':'…'}</div>`; return; }
  if(B.menu==='tech'){
    let naz = S.isNazgul && cur.isHero;
    let rows=cur.moves.map(id=>{ let t=TECH_BY_ID[id]; if(!t)return''; let cd=techCdLeft(cur,t);
      let hpc = naz?hpCostOf(t):0;
      let aff=(naz ? (!t.cost || cur.hp>hpc) : (cur.mana||0)>=t.cost) && cd<=0;
      let effPill='';
      if(t.kind==='attack'&&B.target){ let e=techEff(t,B.target.type); let L=effLabel(e); if(e!==1)effPill=`<span class="eff-pill ${L.cls}">${L.txt}</span>`; }
      let chips=techTypes(t).map(ty=>tchip(ty)).join('');
      let kindIco=t.kind==='heal'?'💚':t.kind==='buff'?'⤴️':t.kind==='debuff'?'⤵️':'';
      let costTxt = t.cost ? (naz?`❤️ ${hpc}`:`${t.cost} MP`) : '—';
      let right = cd>0?`<span class="tc cd">⏳ ${cd}</span>`:`<span class="tc">${costTxt}</span>`;
      return `<div class="tech-row ${aff?'':'dim'}" onclick="${aff?`cmdUseTech('${id}')`:''}">
        <span class="ti">${t.ico}</span>
        <span class="tn">${kindIco}${t.n} ${chips}${effPill}<small>${t.desc}${t.cd?` · ⏳${t.cd}t`:''}</small></span>
        ${right}</div>`;
    }).join('');
    el.innerHTML=`<div class="dock-head"><span class="dt">Techniques — ${cur.name}</span><button class="back-x" onclick="cmdBack()">‹ Retour</button></div>
      ${B.target?`<div class="target-strip">🎯 ${B.target.name} ${tchip(B.target.type)} ${matchupHtml(B.target.type)}</div>`:''}
      <div class="cmd-list">${rows||'<div class="empty-note">Aucune technique équipée.</div>'}</div>`;
  } else if(B.menu==='ally'){
    let t=TECH_BY_ID[B.pendingTech];
    let rows=aliveParty().map(p=>`<div class="tech-row" onclick="cmdSelectAlly('${p.ref}')">
        <span class="ti">${p.ico}</span>
        <span class="tn">${p.name}<small>PV ${fmt(p.hp)}/${fmt(p.maxHp)}</small></span>
        <span class="tc">${Math.round(p.hp/p.maxHp*100)}%</span></div>`).join('');
    el.innerHTML=`<div class="dock-head"><span class="dt">${t?t.ico+' '+t.n:'Cible'} — sur qui ?</span><button class="back-x" onclick="cmdBack()">‹ Retour</button></div>
      <div class="cmd-list">${rows}</div>`;
  } else if(B.menu==='items'){
    let C=S.consumables||{};
    let item=(k,ico,n,desc)=>{ let q=C[k]||0; return `<div class="tech-row ${q>0?'':'dim'}" onclick="${q>0?`cmdItem('${k}')`:''}">
        <span class="ti">${ico}</span><span class="tn">${n}<small>${desc}</small></span><span class="tc">×${q}</span></div>`; };
    el.innerHTML=`<div class="dock-head"><span class="dt">Objets</span><button class="back-x" onclick="cmdBack()">‹ Retour</button></div>
      <div class="cmd-list">
        ${item('potion','🧪','Potion','+20% PV')}
        ${item('potionPlus','🍶','Grande Potion','+42% PV')}
        ${item('ether','🔵','Éther','+24% Mana')}
        ${item('etherPlus','🟦','Grand Éther','+45% Mana')}
        <div class="empty-note" style="font-size:11px">Réappro chez le 🛒 Marchand.</div>
      </div>`;
  } else if(B.menu==='info'){
    let tgt=B.target&&B.target.alive?B.target:null;
    let chart=Object.keys(TYPES).filter(t=>t!=='physique').map(t=>{ let mu=typeMatchup(t);
      return `<div class="chart-row"><span>${TYPES[t].ico} ${TYPES[t].n}</span>
        <span class="cg">▲ ${mu.weak.map(x=>TYPES[x].ico).join('')||'—'}</span>
        <span class="cb">▼ ${mu.resist.map(x=>TYPES[x].ico).join('')||'—'}</span></div>`; }).join('');
    el.innerHTML=`<div class="dock-head"><span class="dt">ℹ️ Infos de combat</span><button class="back-x" onclick="cmdBack()">‹ Retour</button></div>
      <div class="cmd-list info-list">
        <div class="info-sec"><b>${cur.ico} ${cur.name} — effets actifs</b>${statusListHtml(cur)||'<div class="empty-note">Aucun effet.</div>'}</div>
        ${tgt?`<div class="info-sec"><b>🎯 ${tgt.name} ${tchip(tgt.type)}</b><div class="mini">${matchupText(tgt.type)}</div>${statusListHtml(tgt)||''}</div>`:''}
        ${B.lastHit?`<div class="info-sec"><b>🔎 Dernier coup — ${B.lastHit.move} (${fmt(B.lastHit.dmg)} dégâts)</b><div class="mini">${B.lastHit.parts.length?B.lastHit.parts.map(p=>`<span class="eff-pill ${p.c}">${p.t}</span>`).join(' '):'coup de base, aucun modificateur'}</div></div>`:''}
        <div class="info-sec"><b>Table des types</b> <span class="mini">(▲ efficace contre · ▼ résiste à)</span>${chart}</div>
        <div class="info-sec mini">Dégâts = base × type × statuts × (1 − réduction) × critique. La <b>réduction</b> vient de la Vigueur et de l'armure.</div>
      </div>`;
  } else {
    let rcd=ringCdLeft();
    let ringBtn = cur.isHero ? `<button class="cmd ring ${rcd>0?'dim':''}" onclick="cmdRing()">💍 ${S.isNazgul?'Pouvoir de Spectre':'Pouvoir de l\'Anneau'}${rcd>0?` — ⏳ ${rcd} combat${rcd>1?'s':''}`:''}</button>` : '';
    let tgtStrip = B.target&&B.target.alive ? `<div class="target-strip">🎯 ${B.target.name} ${tchip(B.target.type)} ${matchupHtml(B.target.type)}</div>` : '';
    let curFx = statusInline(cur);
    el.innerHTML=`<div class="dock-head"><span class="dt">${cur.ico} ${cur.name}${curFx}</span>${autoBtn}</div>
      ${tgtStrip}
      <div class="cmd-grid">
        <button class="cmd atk" onclick="cmdAttack()">⚔️ Attaque</button>
        <button class="cmd tech" onclick="cmdOpenTech()">📖 Techniques</button>
        <button class="cmd def" onclick="cmdDefend()">🛡️ Défendre</button>
        <button class="cmd item" onclick="cmdOpenItems()">🎒 Objets</button>
      </div>
      <div style="display:flex;gap:7px;margin-top:7px">
        ${ringBtn?`<div style="flex:1">${ringBtn}</div>`:''}
        <button class="cmd info-btn" onclick="cmdInfo()" title="Efficacité, effets, table des types">ℹ️</button>
      </div>`;
  }
}
// helpers de lisibilité
function matchupText(type){ let m=typeMatchup(type);
  return `Faible à : ${m.weak.map(x=>TYPES[x].ico+' '+TYPES[x].n).join(', ')||'rien'} · Résiste à : ${m.resist.map(x=>TYPES[x].ico+' '+TYPES[x].n).join(', ')||'rien'}`; }
function matchupHtml(type){ let m=typeMatchup(type);
  return `<span class="mu good">▲ ${m.weak.map(x=>TYPES[x].ico).join('')||'—'}</span> <span class="mu bad">▼ ${m.resist.map(x=>TYPES[x].ico).join('')||'—'}</span>`; }
function statusListHtml(unit){ if(!unit.statuses||!unit.statuses.length)return '';
  return unit.statuses.map(s=>{ let d=STATUSES[s.id]; return `<div class="fx-row"><span class="st" style="color:${d.col}">${d.ico} ${d.n}</span><span class="mini">${d.desc}${s.turns&&s.turns<90?` · ${s.turns}t`:''}</span></div>`; }).join(''); }
function statusInline(unit){ if(!unit.statuses||!unit.statuses.length)return '';
  return ' '+unit.statuses.map(s=>`<span class="st" style="color:${STATUSES[s.id].col}" title="${STATUSES[s.id].n} — ${STATUSES[s.id].desc}">${STATUSES[s.id].ico}</span>`).join(''); }
window.cmdInfo=function(){ if(!B)return; B.menu='info'; renderDock(); };
window.toggleAuto=function(){ S.autoBattle=!S.autoBattle; sfx('click');
  renderDock(); renderBanner(); updateFab();
  if(S.autoBattle&&B&&!B.over){ let cur=B.order[B.turnPtr]; if(cur&&B.party.includes(cur)&&B.awaiting){ B.awaiting=false; setTimeout(()=>autoAct(cur),250); } }
  save();
};

/* RÉSULTAT */
function showResult(win,data){
  let auto=S.autoBattle, mini=B&&B.minimized;
  // hors-page : on enchaîne sans overlay
  if(mini){
    if(win){ toast('🏆 Victoire'+(data.gold?` · +${fmt(data.gold)} or`:'')); afterBattle('again',true); }
    else { toast('💀 Défaite…'); afterBattle('map',true); }
    return;
  }
  let ov=$('#resultOverlay'); ov.classList.add('on',win?'win':'lose');
  if(win){
    let lootHtml=(data.drops||[]).map(it=>`<div class="loot-pop rar-${it.rar}" style="color:inherit"><span style="color:${['#c7c7c7','#8fe08f','#8fc0ff','#d6a8ff','var(--ember-bright)','#ff96ae'][it.rar]}">${ITEM_BASES[it.base].ico} ${it.name}</span></div>`).join('');
    ov.innerHTML=`<h2>${data.dungeon?'🏰 Donjon vaincu !':'Victoire'}</h2>
      ${data.dungeon?`<div class="reward-line" style="color:var(--ember-bright)">${data.zoneName} — conquis de fond en comble</div>`:''}
      <div class="reward-line">🪙 <span class="v">${fmt(data.gold)}</span> or · ⚡ <span class="v">${fmt(data.xp)}</span> XP</div>
      <div class="reward-line">⛏️ <span class="v">${data.matG}</span> fragments${data.essG?` · 💎 <span class="v">${data.essG}</span> essence`:''}</div>
      ${data.levelGain?`<div class="reward-line" style="color:var(--ember-bright)">⭐ Niveau ${S.level} ! (+${data.levelGain*3} points de stat)</div>`:''}
      ${(data.allyMsgs&&data.allyMsgs.length)?`<div class="reward-line" style="color:var(--xp)">⬆ ${data.allyMsgs.join(' · ')}</div>`:''}
      ${lootHtml?`<div class="divider">Butin</div>${lootHtml}`:''}
      ${data.recruitedMsg?`<div class="reward-line" style="color:var(--spectral);margin-top:8px">${data.recruitedMsg}</div>`:''}
      <div style="display:flex;gap:8px;margin-top:18px">
        ${data.path?`<button class="btn gold block" onclick="pathContinue()">Continuer le sentier ▸</button>`
          :data.dungeon?`<button class="btn gold block" onclick="afterBattle('map')">Retour à la carte</button>`
          :`<button class="btn gold" onclick="afterBattle('again')">Encore ▸</button>
            <button class="btn ghost" onclick="afterBattle('map')">Carte</button>`}
      </div>`;
    sfx('win');
    if(auto&&!data.dungeon&&!data.path){ setTimeout(()=>{ if($('#resultOverlay').classList.contains('on'))afterBattle('again'); },1500); }
  } else {
    ov.innerHTML=`<h2>Défaite…</h2>
      <div class="reward-line">${data.inDungeon?'Le donjon t\'a vaincu. Tu perds ta progression et ':'Tu perds '}${fmt(data.lost)} or et bats en retraite.</div>
      <div style="display:flex;gap:8px;margin-top:18px">
        <button class="btn gold" onclick="afterBattle('map')">Retour à la carte</button>
      </div>`;
    sfx('lose');
  }
}
window.afterBattle=function(what,silent){
  $('#resultOverlay').classList.remove('on','win','lose');
  if(what==='again'){
    // enchaîne un combat d'exploration (mode farm)
    let wasMini=B&&B.minimized;
    closeBattleKeep();
    if(wasMini){ startBattle(false); if(B)B.minimized=true; $('#battle').classList.remove('on'); }
    else { closeBattle(); openScreen('map'); setTimeout(()=>startBattle(false),60); }
  } else {
    closeBattle(); if(!silent)openScreen('map');
  }
  renderTop(); if($('#screen-map')&&!$('#screen-map').classList.contains('hidden'))renderMap(); updateFab();
};

/* bouton flottant : revenir au combat quand on l'a minimisé */
function updateFab(){ let f=$('#battleFab'); if(!f)return;
  let show = B && !B.over && B.minimized;
  f.style.display= show?'flex':'none';
  if(show)f.innerHTML=`⚔️ Combat en cours${S.autoBattle?' · AUTO':''} <span style="opacity:.7">↩︎</span>`;
}
window.returnToBattle=function(){ if(!B)return; B.minimized=false; document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); $('#battle').classList.add('on'); renderBattle(); updateFab(); };

/* ===================================================================
   VFX
   =================================================================== */
function flyText(el,txt,cls){
  let fx=$('#fx'); if(!el||!fx)return;
  let r=el.getBoundingClientRect(); let br=$('#battle').getBoundingClientRect();
  let d=ce('div','fnum '+(cls||''));
  d.textContent=(cls==='crit'?txt+' !':txt);
  d.style.left=(r.left-br.left+r.width/2)+'px';
  d.style.top=(r.top-br.top+r.height*0.3)+'px';
  fx.appendChild(d); setTimeout(()=>d.remove(),1000);
}
function centerOf(el){ let br=$('#battle').getBoundingClientRect(); let r=el.getBoundingClientRect();
  return {x:r.left-br.left+r.width/2, y:r.top-br.top+r.height/2}; }
function spawnBurst(el,type,soft){
  let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el); let col=TYPES[type]?TYPES[type].col:'#fff';
  let b=ce('div','burst'); let sz=soft?70:110;
  b.style.width=sz+'px'; b.style.height=sz+'px'; b.style.left=c.x+'px'; b.style.top=c.y+'px';
  b.style.background=`radial-gradient(circle, ${col} 0%, transparent 70%)`;
  b.style.animation='burstOut .55s ease-out forwards';
  fx.appendChild(b); setTimeout(()=>b.remove(),560);
  // particules
  let n=soft?6:12;
  for(let i=0;i<n;i++){ let p=ce('div','particle'); let ang=Math.random()*Math.PI*2; let dist=rnd(20,70);
    let sp=rnd(4,9); p.style.width=sp+'px'; p.style.height=sp+'px'; p.style.background=col;
    p.style.left=c.x+'px'; p.style.top=c.y+'px';
    p.style.setProperty('--tx',Math.cos(ang)*dist+'px');
    p.animate([{transform:'translate(-50%,-50%)',opacity:1},{transform:`translate(${Math.cos(ang)*dist-50}%,${Math.sin(ang)*dist-50}%)`,opacity:0}],{duration:550,easing:'ease-out'});
    fx.appendChild(p); setTimeout(()=>p.remove(),560);
  }
}
function spawnSlash(el){ let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el);
  let s=ce('div','slashfx'); s.style.left=c.x+'px'; s.style.top=c.y+'px'; fx.appendChild(s); setTimeout(()=>s.remove(),320); }
function spawnProjectile(fromEl,toEl,type,then){
  let fx=$('#fx'); if(!fromEl||!toEl||!fx){ if(then)then(); return; }
  let a=centerOf(fromEl), b=centerOf(toEl); let col=TYPES[type]?TYPES[type].col:'#fff';
  let p=ce('div','projectile'); p.style.left=a.x+'px'; p.style.top=a.y+'px';
  p.style.background=`radial-gradient(circle, #fff, ${col} 55%, transparent 75%)`;
  p.style.boxShadow=`0 0 16px ${col}`;
  fx.appendChild(p);
  let t0=performance.now(), dur=240;
  function step(now){ let k=Math.min(1,(now-t0)/dur);
    p.style.left=(a.x+(b.x-a.x)*k)+'px'; p.style.top=(a.y+(b.y-a.y)*k)+'px';
    if(k<1)requestAnimationFrame(step); else { p.remove(); if(then)then(); } }
  requestAnimationFrame(step);
}
function spawnAttackVfx(attacker,target,type,big){
  let el=unitEl(target); if(!el)return;
  if(type==='physique'){ spawnSlash(el); shake(el,big); }
  else {
    let from=unitEl(attacker);
    spawnProjectile(from,el,type,()=>{ spawnBurst(el,type,false); shake(el,big); });
    if(!from){ spawnBurst(el,type,false); shake(el,big); }
  }
  if(big){ let f=$('#flash'); if(f){ f.style.opacity='.6'; setTimeout(()=>f.style.opacity='0',110);} bigShake(); }
}
function shake(el,big){ if(!el)return; el.classList.remove('shk','bigshk'); void el.offsetWidth; el.classList.add(big?'bigshk':'shk'); }
function bigShake(){ let b=$('#battle'); b.classList.remove('bigshk'); void b.offsetWidth; b.classList.add('bigshk'); setTimeout(()=>b.classList.remove('bigshk'),500); }
function flash(col,a){ let f=$('#flash'); if(!f)return; if(col)f.style.background=col; f.style.opacity=(a||0.6); setTimeout(()=>{f.style.opacity='0';},120); }

/* éléments qui tombent du ciel / faisceaux */
function dropFrom(el,col,emoji,sz){ let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el);
  let d=ce('div','dropfx'); d.textContent=emoji; d.style.left=c.x+'px'; d.style.top=(c.y-220)+'px'; d.style.fontSize=(sz||44)+'px';
  fx.appendChild(d);
  d.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,160px) scale(1.1)',opacity:1,offset:.8},{transform:'translate(-50%,170px) scale(1.2)',opacity:0}],{duration:380,easing:'cubic-bezier(.5,0,1,.4)'});
  setTimeout(()=>{ d.remove(); spawnBurst(el,col,false); shake(el,true); },360);
}
function beamDown(el,col){ let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el);
  let b=ce('div','beamfx'); b.style.left=c.x+'px'; b.style.top='0px'; b.style.height=(c.y)+'px';
  b.style.background=`linear-gradient(180deg, transparent, ${col})`; b.style.boxShadow=`0 0 24px ${col}`;
  fx.appendChild(b); b.animate([{opacity:0,transform:'translateX(-50%) scaleX(.3)'},{opacity:1,transform:'translateX(-50%) scaleX(1)',offset:.3},{opacity:0}],{duration:420,easing:'ease-out'});
  setTimeout(()=>{ b.remove(); spawnBurst(el,col,false); shake(el,true); },300);
}
function shards(el,col,n){ let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el);
  for(let i=0;i<(n||6);i++){ let s=ce('div','shardfx'); let ang=rnd(0,Math.PI*2),dist=rnd(30,60);
    s.style.left=(c.x+Math.cos(ang)*dist)+'px'; s.style.top=(c.y+Math.sin(ang)*dist)+'px';
    s.style.background=`linear-gradient(${rnd(0,360)}deg, ${col}, #fff)`; fx.appendChild(s);
    s.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.2) rotate(0deg)'},{opacity:1,transform:`translate(-50%,-50%) scale(1) rotate(${rnd(-60,60)}deg)`,offset:.4},{opacity:0,transform:'translate(-50%,-50%) scale(.6)'}],{duration:rnd(360,520),easing:'ease-out'});
    setTimeout(()=>s.remove(),540);
  }
  spawnBurst(el,col,true);
}
function novaRing(el,col,sz){ let fx=$('#fx'); if(!el||!fx)return; let c=centerOf(el);
  let r=ce('div','novafx'); r.style.left=c.x+'px'; r.style.top=c.y+'px'; r.style.borderColor=col; r.style.boxShadow=`0 0 24px ${col}`;
  fx.appendChild(r); r.animate([{opacity:.9,transform:'translate(-50%,-50%) scale(.2)'},{opacity:0,transform:`translate(-50%,-50%) scale(${sz||3})`}],{duration:520,easing:'ease-out'});
  setTimeout(()=>r.remove(),540);
}
function multiSlash(el,n){ for(let i=0;i<(n||3);i++)setTimeout(()=>spawnSlash(el),i*110); shake(el,true); }

const VFX_EL={meteor:'feu',flamewave:'feu',fireball:'feu',volcano:'feu',
  iceshard:'givre',blizzard:'givre',frosttomb:'givre',
  bolt:'foudre',storm:'foudre',spark:'foudre',
  vine:'nature',poisoncloud:'nature',
  holybeam:'lumiere',bless:'lumiere',heal:'lumiere',
  shadowbolt:'tenebres',drain:'tenebres',voidnova:'tenebres',cursemist:'tenebres'};

function playTechVfx(t,attacker,targets){
  let vfx=t.vfx||'burst'; let prim=techPrimary(t); let col=TYPES[prim]?TYPES[prim].col:'#fff';
  let from=unitEl(attacker);
  targets.forEach((tt,i)=>{ let el=unitEl(tt); if(!el)return;
    setTimeout(()=>{
      switch(vfx){
        case'slash': case'smash': case'cleave': case'pierce': spawnSlash(el); shake(el,vfx!=='slash'); break;
        case'slash3': multiSlash(el,3); break;
        case'sunblade': spawnSlash(el); spawnBurst(el,'lumiere',false); break;
        case'volcano': spawnSlash(el); spawnBurst(el,'feu',false); break;
        case'meteor': dropFrom(el,'feu','☄️',54); flash('#ff7a3d',.4); break;
        case'fireball': spawnProjectile(from,el,'feu',()=>spawnBurst(el,'feu',false)); break;
        case'flamewave': spawnBurst(el,'feu',false); break;
        case'iceshard': spawnProjectile(from,el,'givre',()=>shards(el,TYPES.givre.col,6)); break;
        case'blizzard': shards(el,TYPES.givre.col,7); break;
        case'frosttomb': dropFrom(el,'givre','🧊',54); break;
        case'bolt': case'spark': beamDown(el,TYPES.foudre.col); break;
        case'storm': beamDown(el,TYPES.foudre.col); break;
        case'thornbolt': beamDown(el,TYPES.foudre.col); spawnBurst(el,'nature',true); break;
        case'vine': spawnBurst(el,'nature',false); break;
        case'poisoncloud': spawnBurst(el,'nature',false); novaRing(el,TYPES.nature.col,2.2); break;
        case'holybeam': beamDown(el,TYPES.lumiere.col); flash('#fff3c8',.4); break;
        case'shadowbolt': spawnProjectile(from,el,'tenebres',()=>spawnBurst(el,'tenebres',false)); break;
        case'drain': spawnProjectile(from,el,'tenebres',()=>{spawnBurst(el,'tenebres',false); if(from)spawnProjectile(el,from,'tenebres');}); break;
        case'voidnova': novaRing(el,TYPES.tenebres.col,3); spawnBurst(el,'tenebres',false); break;
        case'cursemist': novaRing(el,TYPES.tenebres.col,2.4); spawnBurst(el,'givre',true); break;
        case'ashstorm': spawnBurst(el,'feu',false); shards(el,TYPES.foudre.col,4); break;
        case'aurora': beamDown(el,TYPES.givre.col); spawnBurst(el,'lumiere',false); break;
        case'heal': spawnBurst(el,'lumiere',true); break;
        case'bless': novaRing(el,TYPES.lumiere.col,2); spawnBurst(el,'lumiere',true); break;
        case'roar': novaRing(el,'#ff6b88',2); break;
        default: { if(from&&prim!=='physique')spawnProjectile(from,el,prim,()=>spawnBurst(el,prim,false)); else spawnBurst(el,prim,false); }
      }
    }, i*70);
  });
  if(t.target==='all'||t.pow>=2.4){ bigShake(); flash(col,.35); }
}

function ringFx(){
  let fx=$('#fx'); if(!fx)return;
  flash('#1a0a2e',.55);
  // halo ténébreux global + anneau central
  let br=$('#battle').getBoundingClientRect();
  let cx=br.width/2, cy=br.height*0.45;
  let r=ce('div','ringhalo'); r.style.left=cx+'px'; r.style.top=cy+'px'; fx.appendChild(r);
  r.animate([{opacity:.95,transform:'translate(-50%,-50%) scale(.3) rotate(0deg)'},{opacity:0,transform:'translate(-50%,-50%) scale(4) rotate(40deg)'}],{duration:700,easing:'ease-out'});
  setTimeout(()=>r.remove(),720);
  // nova sur chaque ennemi
  aliveEnemies().forEach((tt,i)=>{ let el=unitEl(tt); if(el)setTimeout(()=>novaRing(el,TYPES.tenebres.col,3),i*80+200); });
  bigShake();
}

/* ===================================================================
   AUDIO (léger)
   =================================================================== */
let AC=null;
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function beep(freq,dur,type,vol){ let a=ac(); if(!a)return; let sv=(S&&typeof S.sfxVol==='number')?S.sfxVol:0.7; if(sv<=0)return; try{ let o=a.createOscillator(),g=a.createGain();
  o.type=type||'sine'; o.frequency.value=freq; g.gain.value=(vol||0.08)*sv; o.connect(g); g.connect(a.destination);
  g.gain.setValueAtTime(g.gain.value,a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+(dur||0.15));
  o.start(); o.stop(a.currentTime+(dur||0.15)); }catch(e){} }
function sfx(k){
  if(S&&!S.sfxOn)return;
  switch(k){
    case'click':beep(420,0.06,'triangle',0.05);break;
    case'hit':beep(190,0.08,'square',0.07);setTimeout(()=>beep(140,0.07,'square',0.05),40);break;
    case'crit':beep(240,0.07,'square',0.09);setTimeout(()=>beep(360,0.1,'sawtooth',0.08),50);setTimeout(()=>beep(180,0.12,'square',0.06),110);break;
    case'ehit':beep(110,0.14,'sawtooth',0.07);break;
    case'magic':beep(660,0.16,'sine',0.06);setTimeout(()=>beep(880,0.14,'sine',0.05),60);break;
    case'buff':[523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,0.16,'sine',0.05),i*55));break;
    case'debuff':[420,330,260].forEach((f,i)=>setTimeout(()=>beep(f,0.16,'sawtooth',0.05),i*55));break;
    case'heal':beep(720,0.16,'sine',0.06);setTimeout(()=>beep(960,0.18,'sine',0.05),70);break;
    case'summon':[160,200,150,190].forEach((f,i)=>setTimeout(()=>beep(f,0.16,'sawtooth',0.06),i*70));break;
    case'interrupt':beep(900,0.05,'square',0.08);setTimeout(()=>beep(500,0.12,'triangle',0.06),50);break;
    case'charge':[200,260,330,420].forEach((f,i)=>setTimeout(()=>beep(f,0.13,'triangle',0.05),i*90));break;
    case'win':[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.2,'triangle',0.07),i*120));break;
    case'lose':[300,240,180].forEach((f,i)=>setTimeout(()=>beep(f,0.3,'sawtooth',0.06),i*150));break;
    case'level':[659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.18,'sine',0.07),i*90));break;
    case'evolve':[392,523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.22,'triangle',0.07),i*110));break;
    case'ring':[110,98,82,73].forEach((f,i)=>setTimeout(()=>beep(f,0.4,'sawtooth',0.06),i*90));break;
    case'spectre':[73,69,58,49,73].forEach((f,i)=>setTimeout(()=>beep(f,0.45,'sawtooth',0.07),i*100));break;
  }
}

/* ---- MUSIQUE DE COMBAT ÉPIQUE (procédurale, en boucle) ---- */
const Music=(function(){
  let cur=null, started=false;
  function getVol(){ return (S&&typeof S.musicVol==='number')?S.musicVol:0.55; }
  function el(){ return S&&S.isNazgul ? $('#bgmNazgul') : $('#bgmAdventure'); }
  function fadeTo(audio,target,ms){ if(!audio)return; let steps=12,i=0,from=audio.volume;
    let iv=setInterval(()=>{ i++; audio.volume=Math.max(0,Math.min(1,from+(target-from)*(i/steps)));
      if(i>=steps){ clearInterval(iv); if(target===0){try{audio.pause();}catch(e){}} } }, ms/12); }
  function play(audio){ if(!audio)return; try{ audio.loop=true; audio.volume=0; let p=audio.play(); if(p&&p.catch)p.catch(()=>{}); fadeTo(audio,getVol(),800); }catch(e){} }
  return {
    ensure(){ // démarre la musique sur le premier geste utilisateur
      if(!(S&&S.musicOn))return; if(getVol()<=0)return; let want=el(); if(!want)return;
      if(cur===want&&!want.paused)return;
      if(cur&&cur!==want)fadeTo(cur,0,500);
      cur=want; play(want); started=true;
    },
    update(){ // appelé quand on devient Nazgûl (changement d'ambiance)
      if(!started)return; let want=el();
      if(cur!==want){ if(cur)fadeTo(cur,0,600); cur=want; if(S&&S.musicOn)play(want); }
    },
    setVolume(v){ if(S)S.musicVol=v; if(cur)cur.volume=Math.max(0,Math.min(1,v));
      if(v>0&&S&&S.musicOn&&!(cur&&!cur.paused))this.ensure();
      if(v<=0&&cur){ try{cur.pause();}catch(e){} } },
    stop(){ if(cur){ fadeTo(cur,0,400); } cur=null; started=false; },
    setEnabled(on){ if(on){ this.ensure(); } else { if(cur)fadeTo(cur,0,400); cur=null; started=false; } },
    isPlaying(){ return !!(cur&&!cur.paused); }
  };
})();

/* ===================================================================
   NAVIGATION ÉCRANS
   =================================================================== */
function openScreen(name){
  if($('#battle').classList.contains('on')&&B&&!B.over){
    // en mode AUTO : on peut quitter l'écran, le combat continue en arrière-plan
    if(S.autoBattle){ B.minimized=true; $('#battle').classList.remove('on'); }
    else return; // combat manuel : reste sur l'écran
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  let sc=$('#screen-'+name); if(sc)sc.classList.remove('hidden');
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.screen===name));
  if(name==='map'){ mapView='map'; renderMap(); }
  if(name==='party')renderPartyScreen();
  if(name==='bag')renderBag();
  if(name==='tech')renderTech();
  if(name==='hero')renderHeroScreen();
  updateFab();
}
document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click',()=>{ sfx('click'); openScreen(b.dataset.screen); }));

/* ===================================================================
   ÉCRAN CARTE
   =================================================================== */
function renderMap(){
  let el=$('#screen-map'); if(!el)return;
  if(mapView==='shop') return renderShop(el);
  if(mapView==='challenges') return renderChallenges(el);
  if(PATH) return renderPath(el);
  let html=`<div class="panel-title">Terres du Milieu</div>
    <div class="sub" style="text-align:center;margin-bottom:14px">Voyage de zone en zone. Affronte, pille, recrute.</div>
    <div id="mapWrap">`;
  ZONES.forEach((z,i)=>{
    let unlocked=i<=S.zoneIdx;
    let cleared=S.cleared.includes(z.id);
    let reached=S.reached.includes(z.id);
    let cur=S.curZone===z.id;
    html+=`<div class="zone-node ${unlocked?'':'locked'} ${cur?'current':''}" ${unlocked?`onclick="goZone('${z.id}')"`:''}>
      <div class="znum">${i+1}</div>
      <div class="zico">${unlocked?z.ico:'🔒'}</div>
      <div class="zmid">
        <div class="zname">${z.n} ${tchip(z.type)}</div>
        <div class="zdesc">${unlocked?z.desc:'Vainc le boss précédent pour débloquer.'}</div>
        <div class="zmeta">Niveau conseillé ${z.lvl}${(unlocked&&!reached)?' · 🥾 sentier à parcourir':''}${(z.recruits&&z.recruits.length&&unlocked)?` · Recrues : ${z.recruits.map(r=>ALLY_BY_ID[r].n).join(', ')}`:''}</div>
      </div>
      ${cleared?'<span class="cleared-tag">✓ Boss vaincu</span>':''}
    </div>`;
    if(i<ZONES.length-1)html+=`<div class="zconnector"></div>`;
  });
  html+=`</div>`;
  // actions de la zone courante
  let z=ZONE_BY_ID[S.curZone];
  let bossDone=S.cleared.includes(z.id);
  let reached=S.reached.includes(z.id);
  html+=`<div class="card" style="position:sticky;bottom:0">
    <div style="text-align:center;font-family:'Cinzel';font-size:13px;margin-bottom:8px">Zone : <span style="color:var(--ember-bright)">${z.n}</span>${bossDone?' <span class="cleared-tag">✓ conquise</span>':''}</div>
    <div style="display:flex;gap:8px">
      <button class="btn gold block mode-btn" onclick="explore()">⚔️ Exploration<small>combats à l'infini</small></button>
      <button class="btn gold block mode-btn" onclick="startPath('${z.id}')">🗺️ Aventure<small>jusqu'au boss</small></button>
    </div>
    <div class="sub" style="text-align:center;font-size:11px;margin-top:6px">L'<b>exploration</b> enchaîne des combats sans fin pour farmer XP &amp; butin. La <b>carte d'aventure</b> (plus exigeante : élites, events, trésors) mène au ${BOSSES[z.boss].ico} ${BOSSES[z.boss].n} et débloque la zone suivante.</div>`;
  html+=`<div style="text-align:center;margin-top:8px;font-size:12px;color:var(--muted)">PV ${fmt(Math.max(0,S.hpCur||0))}/${fmt(heroDerived().maxHp)} · Mana ${fmt(S.manaCur||0)}/${fmt(heroDerived().maxMana)}
      <button class="btn sm ghost" style="margin-left:8px" onclick="rest()">🏕️ Repos (🪙 ${fmt(restCost())})</button></div>
  </div>`;
  // CAMP DE BASE : entraînement + marchand (utilité de l'or)
  let trainCost=trainingCost();
  html+=`<div class="card">
    <div class="cz" style="font-size:13px;color:var(--ember-bright);margin-bottom:8px">⛺ Camp de base</div>
    <div style="display:flex;gap:8px">
      <button class="btn block ${S.gold>=trainCost?'gold':'ghost'}" onclick="train()">🏋️ Entraînement (🪙 ${fmt(trainCost)})</button>
      <button class="btn block gold" onclick="openShop()">🛒 Marchand</button>
    </div>
    <button class="btn block gold" style="margin-top:8px" onclick="openChallenges()">🏅 Défis${challengeClaimable()?` <span class="badge-dot">●</span>`:''}</button>
    <div class="sub" style="text-align:center;font-size:11px;margin-top:6px">L'entraînement convertit ton or en XP (toute l'équipe). Les défis récompensent ta progression (points de talent, or, essence).</div>
  </div>`;
  el.innerHTML=html;
}
window.goZone=function(id){ let i=ZONES.findIndex(z=>z.id===id); if(i>S.zoneIdx){toast('🔒 Zone verrouillée.');return;} S.curZone=id; sfx('click'); mapView='map'; renderMap(); renderTop(); save(); };
window.explore=function(){ ac(); Music.ensure(); startBattle(false); };
window.fightBoss=function(){ if(!S.reached.includes(S.curZone)){toast('🥾 Rejoins d\'abord la région.');return;} ac(); Music.ensure(); startDungeon(ZONE_BY_ID[S.curZone]); };
window.rest=function(){ let c=restCost(); if(S.gold<c){toast('🪙 Pas assez d\'or.');return;} S.gold-=c; healTeamFull(); sfx('heal'); toast(`🏕️ Repos pris (\u00b7${fmt(c)} or). Équipe restaurée.`); renderMap(); renderTop(); save(); };
function restCost(){ return 12 + S.level*3; }

/* ===================================================================
   CAMP : ENTRAÎNEMENT (or → XP) + MARCHAND (boutique)
   =================================================================== */
function trainingCost(){ return Math.floor(70 + S.level*38); }
function gainHeroXp(xp){ S.xp+=xp; let g=0; while(S.xp>=xpNeeded(S.level)){ S.xp-=xpNeeded(S.level); S.level++; S.statPoints+=3; S.talentPoints=(S.talentPoints||0)+1; g++; } return g; }
window.train=function(){ let c=trainingCost(); if(S.gold<c){toast('🪙 Pas assez d\'or.');return;}
  S.gold-=c; let xp=Math.floor(xpNeeded(S.level)*0.5)+15; let g=gainHeroXp(xp);
  // l'entraînement profite à toute l'équipe (compagnons recrutés inclus)
  let allyUps=[];
  (S.recruited||[]).forEach(id=>{ let ad=ensureAlly(id); ad.xp=(ad.xp||0)+Math.floor(xp*0.8); let ag=0;
    while(ad.xp>=xpNeeded(ad.level)){ ad.xp-=xpNeeded(ad.level); ad.level++; ad.statPoints=(ad.statPoints||0)+3; ag++; }
    if(ag)allyUps.push(`${ALLY_BY_ID[id].ico} ${ALLY_BY_ID[id].n} niv.${ad.level}`); });
  sfx(g||allyUps.length?'level':'click');
  toast(g?`⭐ Entraînement — niveau ${S.level} !`:`🏋️ +${fmt(xp)} XP à toute l'équipe.`);
  if(allyUps.length)setTimeout(()=>toast('⬆ '+allyUps.join(' · ')),700);
  renderMap(); renderTop(); save(); };
function ensureShop(refresh){
  let z=ZONE_BY_ID[S.curZone]; let lv=z.lvl+ri(0,3);
  if(SHOP && !refresh) return;
  let n=5; let stock=[];
  for(let i=0;i<n;i++){
    // le marchand vend surtout du commun→rare, parfois mieux
    let r=Math.random(); let rar = r<0.5?0 : r<0.8?1 : r<0.95?2 : 3;
    let base = pickDropBase(z); let it=genItem(base,rar,lv);
    it.price=Math.floor(sellPrice(it)*3);
    stock.push(it);
  }
  SHOP={stock};
}
window.openShop=function(){ ac(); ensureShop(false); mapView='shop'; sfx('click'); renderMap(); };
window.closeShop=function(){ mapView='map'; sfx('click'); renderMap(); };
function challengeClaimable(){ return CHALLENGES.some(c=>{ let p=c.chk(); return p.cur>=p.max && !(S.challengesClaimed||[]).includes(c.id); }); }
function rewardText(rw){ let p=[]; if(rw.tp)p.push(`⭐ ${rw.tp} pt talent`); if(rw.gold)p.push(`🪙 ${fmt(rw.gold)}`); if(rw.ess)p.push(`💎 ${rw.ess}`); return p.join(' · '); }
function renderChallenges(el){
  let html=`<div class="panel-title">🏅 Défis</div>
    <div class="sub" style="text-align:center;margin-bottom:10px">Objectifs de progression — récompenses en points de talent, or et essence.</div>`;
  CHALLENGES.forEach(c=>{ let p=c.chk(); let done=p.cur>=p.max; let claimed=(S.challengesClaimed||[]).includes(c.id);
    let pct=Math.min(100,p.cur/p.max*100);
    html+=`<div class="chal ${done?'done':''} ${claimed?'claimed':''}">
      <div class="chal-mid">
        <div class="chal-n">${claimed?'✓ ':''}${c.n}</div>
        <div class="chal-d">${c.desc}</div>
        <div class="bar" style="margin-top:5px;height:7px"><i style="width:${pct}%;background:linear-gradient(90deg,var(--xp),var(--ember))"></i></div>
        <div class="chal-meta">${Math.min(p.cur,p.max)} / ${p.max} · Récompense : ${rewardText(c.reward)}</div>
      </div>
      <div>${claimed?'<span class="chal-tag">Réclamé</span>':done?`<button class="btn sm gold" onclick="claimChallenge('${c.id}')">Réclamer</button>`:'<span class="chal-tag pending">En cours</span>'}</div>
    </div>`;
  });
  html+=`<button class="btn ghost block" style="margin-top:10px" onclick="closeChallenges()">↩︎ Retour</button>`;
  el.innerHTML=html;
}
window.openChallenges=function(){ ac(); mapView='challenges'; sfx('click'); renderMap(); };
window.closeChallenges=function(){ mapView='map'; sfx('click'); renderMap(); };
window.claimChallenge=function(id){ let c=CHALLENGES.find(x=>x.id===id); if(!c)return;
  let p=c.chk(); if(p.cur<p.max){toast('Défi non terminé.');return;}
  if((S.challengesClaimed||[]).includes(id)){return;}
  S.challengesClaimed=S.challengesClaimed||[]; S.challengesClaimed.push(id);
  let rw=c.reward; if(rw.tp)S.talentPoints=(S.talentPoints||0)+rw.tp; if(rw.gold)S.gold+=rw.gold; if(rw.ess)S.ess+=rw.ess;
  sfx('level'); toast(`🏅 Défi accompli : ${rewardText(rw)} !`); renderChallenges($('#screen-map')); renderTop(); save(); };
window.refreshShop=function(){ let cost=Math.floor(40+S.level*6); if(S.gold<cost){toast('🪙 Pas assez d\'or.');return;} S.gold-=cost; ensureShop(true); sfx('click'); renderMap(); renderTop(); save(); };
window.buyShop=function(idx){ if(!SHOP)return; let it=SHOP.stock[idx]; if(!it)return; if(it.sold){toast('Déjà acheté.');return;}
  if(S.gold<it.price){toast('🪙 Pas assez d\'or.');return;}
  S.gold-=it.price; it.sold=true; let copy=Object.assign({},it); delete copy.price; delete copy.sold; copy.iid=_iid++;
  S.inv.push(copy); sfx('level'); toast(`🛒 ${it.name} acheté !`); renderMap(); renderTop(); save(); };
function renderShop(el){
  let rcost=Math.floor(40+S.level*6);
  let C=S.consumables||(S.consumables={});
  let html=`<div class="panel-title">🛒 Marchand</div>
    <div class="sub" style="text-align:center;margin-bottom:10px">Or : 🪙 ${fmt(S.gold)} · Stock de ${ZONE_BY_ID[S.curZone].n}</div>`;
  // --- rayon consommables (toujours disponible) ---
  html+=`<div class="divider">Consommables</div>`;
  CONSUMABLE_SHOP.forEach(c=>{
    html+=`<div class="inv-item" style="margin-bottom:6px">
      <span class="iico">${c.ico}</span>
      <div class="imid"><div class="iname">${c.n} <span style="color:var(--faint)">(en stock : ×${C[c.key]||0})</span></div>
        <div class="iaff">${c.desc}</div></div>
      <button class="btn sm ${S.gold>=c.price?'gold':'ghost'}" onclick="buyConsumable('${c.key}')">🪙 ${fmt(c.price)}</button>
    </div>`;
  });
  // --- équipement ---
  html+=`<div class="divider">Équipement</div>`;
  SHOP.stock.forEach((it,idx)=>{
    let col=['#c7c7c7','#8fe08f','#8fc0ff','#d6a8ff','var(--ember-bright)','#ff96ae'][it.rar];
    html+=`<div class="inv-item rar-${it.rar}" style="margin-bottom:6px">
      <span class="iico">${ITEM_BASES[it.base].ico}</span>
      <div class="imid">
        <div class="iname" style="color:${col}">${it.name}</div>
        <div class="iaff">${affixText(it)}</div>
        ${passiveText(it)?`<div class="ipass">${passiveText(it)}</div>`:''}
      </div>
      <button class="btn sm ${it.sold?'ghost':(S.gold>=it.price?'gold':'ghost')}" ${it.sold?'disabled':''} onclick="buyShop(${idx})">${it.sold?'Vendu':'🪙 '+fmt(it.price)}</button>
    </div>`;
  });
  html+=`<div style="display:flex;gap:8px;margin-top:12px">
    <button class="btn block ${S.gold>=rcost?'gold':'ghost'}" onclick="refreshShop()">🔄 Renouveler l'équipement (🪙 ${fmt(rcost)})</button>
    <button class="btn ghost block" onclick="closeShop()">↩︎ Retour</button>
  </div>`;
  el.innerHTML=html;
}
const CONSUMABLE_SHOP=[
  {key:'potion',ico:'🧪',n:'Potion',desc:'+20% PV en combat',price:40},
  {key:'potionPlus',ico:'🍶',n:'Grande Potion',desc:'+42% PV en combat',price:110},
  {key:'ether',ico:'🔵',n:'Éther',desc:'+24% Mana en combat',price:55},
  {key:'etherPlus',ico:'🟦',n:'Grand Éther',desc:'+45% Mana en combat',price:140},
];
window.buyConsumable=function(key){ let c=CONSUMABLE_SHOP.find(x=>x.key===key); if(!c)return;
  if(S.gold<c.price){toast('🪙 Pas assez d\'or.');return;}
  S.gold-=c.price; S.consumables=S.consumables||{}; S.consumables[key]=(S.consumables[key]||0)+1;
  sfx('level'); toast(`🛒 ${c.n} acheté (×${S.consumables[key]}).`); renderShop($('#screen-map')); renderTop(); save(); };

/* ===================================================================
   CARTE D'AVENTURE — façon Slay the Spire : graphe à embranchements
   menant au boss de la région. Events aléatoires + posés.
   =================================================================== */
const NODE_TYPES={
  combat:  {ico:'⚔️', n:'Combat',      col:'#cbb88f'},
  elite:   {ico:'💀', n:'Élite',       col:'#d2495c'},
  event:   {ico:'❓', n:'Event',       col:'#6fd6c4'},
  treasure:{ico:'💰', n:'Trésor',      col:'#ffd06b'},
  merchant:{ico:'🛒', n:'Marchand',    col:'#9a6cff'},
  rest:    {ico:'🏕️', n:'Campement',   col:'#7dd0a8'},
  boss:    {ico:'👑', n:'Boss',        col:'#ff5a7a'},
};
function rollNodeType(rowIdx,lastIdx){
  if(rowIdx===0) return 'combat';
  if(rowIdx===lastIdx) return Math.random()<0.65?'rest':'merchant';
  let depth=rowIdx/lastIdx, pool=['combat','combat','combat','event','event','treasure','merchant','rest'];
  if(depth>0.3)pool.push('elite');
  if(depth>0.55)pool.push('elite');
  return pick(pool);
}
function buildPathMap(zone){
  let floors = clamp(6+Math.floor(zone.lvl/18),6,9); // 6 à 9 paliers + boss
  let rows=[];
  for(let r=0;r<floors;r++){
    let w = r===0?ri(2,3):ri(2,4);
    let row=[];
    for(let c=0;c<w;c++) row.push({type:rollNodeType(r,floors-1),next:[],visited:false});
    rows.push(row);
  }
  rows.push([{type:'boss',next:[],visited:false}]); // sommet
  // arêtes entre paliers
  for(let r=0;r<rows.length-1;r++){
    let a=rows[r].length, b=rows[r+1].length;
    for(let i=0;i<a;i++){
      let primary = a===1?0:Math.round(i*(b-1)/(a-1));
      let set=new Set([primary]);
      if(Math.random()<0.5){ let nb=primary+(Math.random()<0.5?-1:1); if(nb>=0&&nb<b)set.add(nb); }
      rows[r][i].next=[...set];
    }
    for(let j=0;j<b;j++){ if(!rows[r].some(n=>n.next.includes(j))){ let i=Math.round(j*(a-1)/((b-1)||1)); rows[r][i].next.push(j); } }
  }
  return rows;
}
window.startPath=function(zoneId){
  let zone=ZONE_BY_ID[zoneId]; S.curZone=zoneId;
  PATH={zoneId, rows:buildPathMap(zone), cur:{r:-1,c:-1}, started:false, inCombat:false, pending:null};
  S.path=PATH; ac(); sfx('click'); mapView='map'; openScreen('map'); renderMap(); save();
};
window.abandonPath=function(){ PATH=null; S.path=null; mapView='map'; sfx('click'); renderMap(); renderTop(); save(); };
function pathReachable(r,c){
  if(!PATH||PATH.inCombat)return false;
  if(!PATH.started) return r===0;
  if(r!==PATH.cur.r+1) return false;
  let cn=PATH.rows[PATH.cur.r][PATH.cur.c];
  return cn.next.includes(c);
}
function renderPath(el){
  let zone=ZONE_BY_ID[PATH.zoneId];
  let rows=PATH.rows, R=rows.length;
  let topPad=9, gap=Math.max(11,Math.min(15,(100)/(R+1))), H=topPad*2+(R-1)*gap;
  let xOf=(row,i)=>{ let n=row.length; return n===1?50:(13+(74)*(i/(n-1))); };
  let yOf=(r)=>topPad+(R-1-r)*gap; // r=0 en bas, boss en haut
  // lignes
  let lines='';
  for(let r=0;r<R-1;r++){ rows[r].forEach((node,i)=>{ node.next.forEach(j=>{
    let x1=xOf(rows[r],i),y1=yOf(r),x2=xOf(rows[r+1],j),y2=yOf(r+1);
    let lit = (PATH.started&&PATH.cur.r===r&&PATH.cur.c===i) || node.visited;
    lines+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lit?'rgba(230,167,62,.55)':'rgba(120,110,150,.28)'}" stroke-width="${lit?0.9:0.6}" stroke-dasharray="${lit?'':'1.4 1.4'}"/>`;
  }); }); }
  // noeuds
  let nodes='';
  for(let r=0;r<R;r++){ rows[r].forEach((node,i)=>{
    let x=xOf(rows[r],i),y=yOf(r);
    let t=NODE_TYPES[node.type];
    let isCur = PATH.started&&PATH.cur.r===r&&PATH.cur.c===i;
    let reach = pathReachable(r,i);
    let rad = node.type==='boss'?6.4:4.6;
    let fill = node.visited?'#1c1730':(reach?'rgba(40,32,66,.95)':'rgba(20,16,32,.9)');
    let stroke = isCur?'#ffd06b':(reach?t.col:(node.visited?t.col:'rgba(120,110,150,.4)'));
    let sw = isCur||reach?1.1:0.7;
    let glow = reach||isCur?`filter="url(#glow)"`:'';
    let click = reach?`onclick="pathGo(${r},${i})" style="cursor:pointer"`:'';
    let op = (!PATH.started||reach||node.visited||isCur)?1:0.55;
    nodes+=`<g ${click} opacity="${op}">
      <circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${glow}/>
      <text x="${x}" y="${y}" font-size="${node.type==='boss'?6:4.3}" text-anchor="middle" dominant-baseline="central">${node.type==='boss'?BOSSES[zone.boss].ico:t.ico}</text>
      ${isCur?`<circle cx="${x}" cy="${y}" r="${rad+1.6}" fill="none" stroke="#ffd06b" stroke-width="0.5" opacity="0.7"/>`:''}
    </g>`;
  }); }
  let progress = PATH.started?`Palier ${PATH.cur.r+1}`:'Choisis ton point de départ';
  let html=`<div class="panel-title">🗺️ ${zone.n}</div>
    <div class="sub" style="text-align:center;margin-bottom:6px">${progress} — grimpe jusqu'au ${BOSSES[zone.boss].ico} ${BOSSES[zone.boss].n}. Touche un nœud relié pour avancer.</div>
    <div class="sts-legend">
      ${Object.entries(NODE_TYPES).map(([k,v])=>`<span><i style="color:${v.col}">${v.ico}</i>${v.n}</span>`).join('')}
    </div>
    <div class="sts-wrap">
      <svg viewBox="0 0 100 ${H.toFixed(1)}" preserveAspectRatio="xMidYMid meet" class="sts-svg">
        <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter></defs>
        ${lines}${nodes}
      </svg>
    </div>
    <button class="btn ghost block" style="margin-top:8px" onclick="abandonPath()">↩︎ Quitter la carte</button>`;
  el.innerHTML=html;
}
window.pathGo=function(r,c){
  if(!pathReachable(r,c))return;
  let node=PATH.rows[r][c]; let zone=ZONE_BY_ID[PATH.zoneId]; ac();
  if(node.type==='combat'||node.type==='elite'){
    PATH.pending={r,c,type:node.type}; PATH.inCombat=true; save();
    Music.ensure();
    let enemies;
    if(node.type==='elite'){ let lv=zone.lvl+ri(1,4); let e=mkBoss(pick(DUNGEON_MINIBOSS),lv,worldDiff(zone.lvl)*1.05,{hpMul:0.72}); e.ref='boss'; enemies=[e]; }
    else enemies=buildEnemies(zone,false,1.18);
    beginBattle(enemies,{label:node.type==='elite'?'Élite':'Combat',zone,boss:node.type==='elite'});
    return;
  }
  if(node.type==='boss'){
    PATH.pending={r,c,type:'boss'}; PATH.inCombat=true; save();
    Music.ensure(); startPathBoss(zone); return;
  }
  // events instantanés : on se place sur le nœud puis on résout
  PATH.started=true; PATH.cur={r,c}; node.visited=true;
  resolveNode(node,zone); save(); renderMap();
};
function resolveNode(node,zone){
  let type=node.type;
  if(type==='event') type=pick(['treasure','merchant','rest','recruit','blessing']);
  if(type==='treasure'){
    let lv=zone.lvl+ri(0,4); let r=rollRarity(false,heroDerived().drop,0.12);
    let baseId=r>=5?pick(UNIQUE_BASE_IDS):pickDropBase(zone);
    let it=genItem(baseId,r,lv); S.inv.push(it);
    let g=Math.floor(zone.lvl*12*(Math.random()*0.5+0.8)); S.gold+=g;
    sfx('win'); toast(`💰 Trésor : ${it.name} + ${fmt(g)} or !`);
  } else if(type==='rest'){
    healTeamFull(); sfx('heal'); toast('🏕️ Campement : équipe restaurée.');
  } else if(type==='merchant'){
    ensureShop(true); mapView='shop'; sfx('click'); // ouvre la boutique ; retour = reviendra à la carte
    return; // renderMap() (appelé après) affichera la boutique
  } else if(type==='recruit'){
    let pool=(zone.recruits||[]).filter(id=>!S.recruited.includes(id));
    if(pool.length){ let id=pick(pool); S.recruited.push(id); let ad=ensureAlly(id); ad.level=Math.max(1,S.level-1);
      if(S.party.length<3)S.party.push(id); sfx('win'); toast(`🤝 ${ALLY_BY_ID[id].n} rejoint ta quête !`); }
    else { let g=Math.floor(zone.lvl*12); S.gold+=g; toast(`Une rencontre… +${fmt(g)} or.`); }
  } else if(type==='blessing'){
    let g=Math.floor(zone.lvl*16); let e=ri(2,6); S.gold+=g; S.ess+=e;
    sfx('level'); toast(`✨ Bénédiction : +${fmt(g)} or, +${e} essence.`);
  }
}
function startPathBoss(zone){
  let lv=zone.lvl+3;
  let phases=[
    {name:'Forme I'},
    {name:'Forme II — Courroux', atkMul:1.15, hpMul:0.72},
    {name:'Forme III — Déchaînement', atkMul:1.3, hpMul:0.78, enrage:true},
    {name:'Forme IV — Apothéose', atkMul:1.5, hpMul:0.82, enrage:true},
  ];
  let e=mkBoss(zone.boss,lv,worldDiff(zone.lvl),{phases,hpMul:0.9}); e.ref='boss';
  beginBattle([e],{label:`${BOSSES[zone.boss].n} — Boss de région`,zone,boss:true});
}
function pathCombatWin(){
  let zone=ZONE_BY_ID[PATH.zoneId];
  if(PATH.pending&&PATH.pending.type==='boss'){ return pathBossWin(zone); }
  let elite=PATH.pending&&PATH.pending.type==='elite';
  // valide le nœud (placé seulement maintenant)
  let p=PATH.pending; PATH.rows[p.r][p.c].visited=true; PATH.cur={r:p.r,c:p.c}; PATH.started=true;
  PATH.inCombat=false; PATH.pending=null;
  let R=grantRewards(zone,elite,{eliteBonus:elite?0.12:0});
  if(S.hpCur<=0)S.hpCur=Math.floor(heroDerived().maxHp*0.4);
  save();
  showResult(true,Object.assign(R,{path:true}));
}
function pathBossWin(zone){
  let R=grantRewards(zone,true,{lvBonus:4,mult:1.2});
  let bonusGold=Math.floor(zone.lvl*60); S.gold+=bonusGold; let bonusEss=ri(8,16); S.ess+=bonusEss;
  let recruitedMsg='';
  if(!S.cleared.includes(zone.id)){ S.cleared.push(zone.id);
    if(!S.reached.includes(zone.id))S.reached.push(zone.id);
    let idx=ZONES.findIndex(z=>z.id===zone.id); if(idx<ZONES.length-1)S.zoneIdx=Math.max(S.zoneIdx,idx+1);
    let pool=(zone.recruits||[]).filter(id=>!S.recruited.includes(id));
    if(pool.length){ let id=pool[0]; S.recruited.push(id); let ad=ensureAlly(id); ad.level=Math.max(1,S.level-1);
      if(S.party.length<3)S.party.push(id); recruitedMsg=`${ALLY_BY_ID[id].ico} ${ALLY_BY_ID[id].n} rejoint ta quête !`; }
  }
  if(S.hpCur<=0)S.hpCur=Math.floor(heroDerived().maxHp*0.5);
  PATH=null; S.path=null; mapView='map'; save();
  showResult(true,Object.assign(R,{dungeon:true,zoneName:zone.n,gold:R.gold+bonusGold,essG:R.essG+bonusEss,recruitedMsg}));
}
window.pathContinue=function(){
  $('#resultOverlay').classList.remove('on','win','lose');
  closeBattle(); openScreen('map'); renderMap();
};

/* ===================================================================
   ÉCRAN ÉQUIPE — roster + fiche détaillée (niveau, stats, équipement)
   =================================================================== */
let partyView={mode:'roster', id:null};
function renderPartyScreen(){
  let el=$('#screen-party'); if(!el)return;
  if(partyView.mode==='detail'){ return renderCharDetail(el, partyView.id); }
  let html=`<div class="panel-title">Ta Compagnie</div>
    <div class="sub" style="text-align:center;margin-bottom:12px">Équipe active de 3. Gère niveaux, stats et équipement de chacun.</div>`;
  html+=`<div class="divider">En première ligne (${S.party.length}/3)</div>`;
  S.party.forEach(ref=>html+=memberRow(ref,true));
  let bench=S.recruited.filter(r=>!S.party.includes(r));
  html+=`<div class="divider">Réserve</div>`;
  if(bench.length===0&&S.recruited.length===0)html+=`<div class="empty-note">Aucun allié encore rallié. En explorant une région, ses héros peuvent rejoindre ta quête — et les boss les rallient à coup sûr.</div>`;
  bench.forEach(ref=>html+=memberRow(ref,false));
  html+=`<div class="divider">À découvrir</div>`;
  let pending=ZONES.filter(z=>(z.recruits||[]).some(r=>!S.recruited.includes(r)));
  if(pending.length===0)html+=`<div class="empty-note">Tu as rallié tous les héros connus.</div>`;
  pending.forEach(z=>{ let unknown=z.recruits.filter(r=>!S.recruited.includes(r));
    html+=`<div class="inv-item" style="opacity:.55"><span class="iico">❓</span>
      <div class="imid"><div class="iname">${unknown.length} héros inconnu(s)</div><div class="iaff">${z.n} — explore ou vaincs ${BOSSES[z.boss].n}</div></div></div>`; });
  el.innerHTML=html;
}
function memberRow(ref,active){
  if(ref==='hero'){ let d=heroDerived();
    return `<div class="inv-item rar-4"><span class="iico">${S.isNazgul?'☠️':RACES[S.race].ico}</span>
      <div class="imid"><div class="iname">${S.name} (toi) ${tchip(heroType())}</div>
      <div class="iaff">Niv. ${S.level} · PV ${fmt(d.maxHp)} · ATQ ${fmt(Math.max(d.atkP,d.atkM))} · Vit ${d.spd}</div></div>
      <button class="btn sm gold" onclick="openCharDetail('hero')">Gérer</button></div>`; }
  let a=ALLY_BY_ID[ref]; let d=allyDerived(ref); let ad=ensureAlly(ref); let pts=ad.statPoints>0?` · <span style="color:var(--ember-bright)">${ad.statPoints}⊕</span>`:'';
  return `<div class="inv-item rar-2"><span class="iico">${a.ico}</span>
    <div class="imid"><div class="iname">${a.n} ${tchip(a.type)}</div>
    <div class="iaff">${a.role} · Niv.${ad.level} · PV ${fmt(d.maxHp)} · Vit ${d.spd}${pts}</div></div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <button class="btn sm gold" onclick="openCharDetail('${ref}')">Gérer</button>
      ${active?`<button class="btn sm ghost" onclick="benchAlly('${ref}')">Retirer</button>`
              :`<button class="btn sm ghost" onclick="activateAlly('${ref}')" ${S.party.length>=3?'disabled':''}>Aligner</button>`}
    </div></div>`;
}
window.openCharDetail=function(id){ partyView={mode:'detail',id}; sfx('click'); renderPartyScreen(); };
window.closeCharDetail=function(){ partyView={mode:'roster',id:null}; sfx('click'); renderPartyScreen(); };

function renderCharDetail(el,id){
  let isHero=id==='hero';
  let d= isHero?heroDerived():allyDerived(id);
  let lvl= isHero?S.level:ensureAlly(id).level;
  let xp= isHero?S.xp:ensureAlly(id).xp;
  let pts= isHero?S.statPoints:ensureAlly(id).statPoints;
  let alloc= isHero?S.alloc:ensureAlly(id).alloc;
  let equip= isHero?S.equip:ensureAlly(id).equip;
  let name= isHero?S.name:ALLY_BY_ID[id].n;
  let ico= isHero?(S.isNazgul?'☠️':RACES[S.race].ico):ALLY_BY_ID[id].ico;
  let sub= isHero?`${RACES[S.race].ico} ${RACES[S.race].n}`:`${ALLY_BY_ID[id].role} ${tchip(ALLY_BY_ID[id].type)}`;
  let html=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <button class="back-x" onclick="closeCharDetail()">‹ Compagnie</button>
      <div class="panel-title" style="flex:1;margin:0;font-size:16px">${ico} ${name}</div></div>
    <div class="sub" style="text-align:center;margin-bottom:10px">${sub} · Niveau ${lvl}</div>
    <div class="card">
      <div class="pnum" style="font-size:11px;color:var(--muted);display:flex;justify-content:space-between"><span>XP</span><span>${fmt(xp)} / ${fmt(xpNeeded(lvl))}</span></div>
      <div class="bar xp"><i style="width:${Math.min(100,xp/xpNeeded(lvl)*100)}%"></i></div>
    </div>`;
  // stats allocation
  html+=`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class="cz" style="font-size:13px;color:var(--ember-bright)">Caractéristiques</span>
      <span style="font-size:12px;color:var(--muted)">Points : <b style="color:var(--ember-bright)">${pts}</b></span></div>`;
  STAT_KEYS.forEach(k=>{ let info=STAT_INFO[k]; let val= isHero?totalStat(k):statOf('ally',id,k);
    html+=`<div class="stat-row"><div style="flex:1"><div class="sname">${info.ico} ${info.n}</div><div class="sdesc">${info.d}</div></div>
      <div class="sval">${val}</div>
      <button class="plusbtn" onclick="${isHero?`allocStat('${k}')`:`allocAlly('${id}','${k}')`}" ${pts<=0?'disabled':''}>+</button></div>`; });
  html+=`</div>`;
  // équipement
  html+=`<div class="card"><div class="cz" style="font-size:13px;color:var(--ember-bright);margin-bottom:8px">Équipement</div><div class="equip-grid">`;
  SLOTS.forEach(sl=>{ let it=equip[sl.id];
    html+=`<div class="eslot ${it?'filled rar-'+it.rar:''}" onclick="openPicker('${id}','${sl.id}')">
      <div class="eslico">${it?ITEM_BASES[it.base].ico:sl.ico}</div>
      <div class="esllab">${sl.n}</div>
      <div class="eitem">${it?`<span class="rar-${it.rar}" style="color:inherit">${RARITIES[it.rar].n}</span>`:'<span style="color:var(--faint)">vide</span>'}</div>
    </div>`; });
  html+=`</div><div class="sub" style="text-align:center;font-size:11px">Touche un emplacement pour équiper depuis ton sac.</div></div>`;
  // derived
  html+=`<div class="card">
    <div class="kv"><span class="k">⚔️ Attaque physique</span><span class="v">${fmt(d.atkP)}</span></div>
    <div class="kv"><span class="k">🔮 Attaque magique</span><span class="v">${fmt(d.atkM)}</span></div>
    <div class="kv"><span class="k">❤️ PV max</span><span class="v">${fmt(d.maxHp)}</span></div>
    <div class="kv"><span class="k">💧 Mana max</span><span class="v">${fmt(d.maxMana)}</span></div>
    <div class="kv"><span class="k">🪶 Vitesse</span><span class="v">${d.spd}</span></div>
    <div class="kv"><span class="k">🎯 Critique</span><span class="v">${Math.round(d.crit*100)}%</span></div>
    <div class="kv"><span class="k">💨 Esquive</span><span class="v">${Math.round(d.dodge*100)}%</span></div>
  </div>`;
  if(!isHero){
    let active=S.party.includes(id);
    html+=`<div style="display:flex;gap:8px">
      ${active?`<button class="btn ghost block" onclick="benchAlly('${id}');closeCharDetail()">Mettre en réserve</button>`
              :`<button class="btn gold block" onclick="activateAlly('${id}');renderPartyScreen()" ${S.party.length>=3?'disabled':''}>Aligner au combat</button>`}</div>`;
    let mvs=ALLY_BY_ID[id].moves.map(m=>TECH_BY_ID[m]).filter(Boolean);
    html+=`<div class="card" style="margin-top:10px"><div class="cz" style="font-size:12px;color:var(--muted);margin-bottom:6px">Techniques innées</div>
      ${mvs.map(t=>`<div style="font-size:12px;padding:3px 0">${t.ico} ${t.n} ${techTypes(t).map(ty=>tchip(ty)).join('')}</div>`).join('')}</div>`;
  } else {
    html+=`<button class="btn ghost block" onclick="openScreen('hero')">Voir corruption & options ▸</button>`;
  }
  el.innerHTML=html;
}
window.benchAlly=function(ref){ S.party=S.party.filter(r=>r!==ref); sfx('click'); if(partyView.mode!=='detail')renderPartyScreen(); save(); };
window.activateAlly=function(ref){ if(S.party.length>=3){toast('Équipe pleine (3 max).');return;} if(!S.party.includes(ref))S.party.push(ref); sfx('click'); renderPartyScreen(); save(); };
window.allocAlly=function(id,k){ let ad=ensureAlly(id); if(ad.statPoints<=0)return; ad.statPoints--; ad.alloc[k]=(ad.alloc[k]||0)+1; sfx('click'); renderPartyScreen(); save(); };

/* picker d'équipement (modal) pour héros ou allié */
window.openPicker=function(target,slot){
  let equip= target==='hero'?S.equip:ensureAlly(target).equip;
  let cur=equip[slot];
  let items=S.inv.filter(it=>ITEM_BASES[it.base].slot===slot).sort((a,b)=>b.rar-a.rar||b.ilvl-a.ilvl);
  let bg=ce('div','modal-bg'); bg.onclick=e=>{ if(e.target===bg)bg.remove(); };
  let rows=items.map(it=>`<div class="inv-item rar-${it.rar}" style="margin-bottom:6px;cursor:pointer" onclick="pickEquip('${target}','${it.iid}')">
      <span class="iico">${ITEM_BASES[it.base].ico}</span>
      <div class="imid"><div class="iname">${it.name} <span style="color:var(--faint);font-size:10px">i${it.ilvl}</span></div>
      <div class="iaff">${affixText(it)}</div>${it.passive?`<div class="ipass">${passiveText(it)}</div>`:''}</div></div>`).join('');
  bg.innerHTML=`<div class="modal"><h3>${SLOTS.find(s=>s.id===slot).ico} ${SLOTS.find(s=>s.id===slot).n}</h3>
    ${cur?`<button class="btn ghost block" style="margin-bottom:10px" onclick="pickUnequip('${target}','${slot}')">Déséquiper ${cur.name}</button>`:''}
    ${rows||'<div class="empty-note">Aucune pièce de ce type dans ton sac.</div>'}
    <button class="btn ghost block" style="margin-top:8px" onclick="this.closest('.modal-bg').remove()">Fermer</button></div>`;
  document.body.appendChild(bg);
};
window.pickEquip=function(target,iid){ equipTo(target,parseInt(iid)); document.querySelectorAll('.modal-bg').forEach(m=>m.remove()); renderPartyScreen(); renderTop(); };
window.pickUnequip=function(target,slot){ unequipFrom(target,slot); document.querySelectorAll('.modal-bg').forEach(m=>m.remove()); renderPartyScreen(); renderTop(); };
function equipTo(target,iid){ let it=S.inv.find(x=>x.iid===iid); if(!it)return; let slot=ITEM_BASES[it.base].slot;
  let eq= target==='hero'?S.equip:ensureAlly(target).equip;
  let prev=eq[slot]; eq[slot]=it; S.inv=S.inv.filter(x=>x.iid!==iid); if(prev)S.inv.push(prev);
  if(target==='hero')S.hpCur=Math.min(S.hpCur,heroDerived().maxHp); sfx('click'); toast(`✓ ${it.name} équipé.`); save(); }
function unequipFrom(target,slot){ let eq= target==='hero'?S.equip:ensureAlly(target).equip; let it=eq[slot]; if(!it)return; eq[slot]=null; S.inv.push(it); sfx('click'); save(); }

/* ===================================================================
   ÉCRAN SAC (inventaire + équipement + forge)
   =================================================================== */
let bagFilter='all';
function renderBag(){
  let el=$('#screen-bag'); if(!el)return;
  let html=`<div class="panel-title">Sac & Équipement</div>`;
  // slots
  html+=`<div class="card"><div class="equip-grid">`;
  SLOTS.forEach(sl=>{ let it=S.equip[sl.id];
    html+=`<div class="eslot ${it?'filled rar-'+it.rar:''}" onclick="${it?`unequip('${sl.id}')`:''}">
      <div class="eslico">${it?ITEM_BASES[it.base].ico:sl.ico}</div>
      <div class="esllab">${sl.n}</div>
      <div class="eitem">${it?`<span class="iname rar-${it.rar}" style="color:inherit">${RARITIES[it.rar].n}</span>`:'<span style="color:var(--faint)">vide</span>'}</div>
    </div>`; });
  html+=`</div><div class="sub" style="text-align:center;font-size:11px">Touche un emplacement équipé pour le déséquiper.</div></div>`;
  // inventaire
  html+=`<div class="divider">Inventaire (${S.inv.length})</div>`;
  if(S.inv.length===0)html+=`<div class="empty-note">Ton sac est vide. Les ennemis et les boss laissent tomber de l'équipement — les zones avancées offrent les pièces les plus rares.</div>`;
  let sorted=S.inv.slice().sort((a,b)=>b.rar-a.rar||b.ilvl-a.ilvl);
  sorted.forEach(it=>{ let b=ITEM_BASES[it.base];
    html+=`<div class="inv-item rar-${it.rar}">
      <span class="iico">${b.ico}</span>
      <div class="imid">
        <div class="iname">${it.name} <span style="color:var(--faint);font-size:10px">i${it.ilvl}</span></div>
        <div class="iaff">${affixText(it)}</div>
        ${it.passive?`<div class="ipass">${passiveText(it)}</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <button class="btn sm gold" onclick="equip(${it.iid})">Équiper</button>
        <button class="btn sm ghost" onclick="forgeItem(${it.iid})">⚒️ ${forgeCost(it)}</button>
        <button class="btn sm ghost" onclick="sellItem(${it.iid})">💰 ${fmt(sellPrice(it))}</button>
      </div>
    </div>`; });
  el.innerHTML=html;
}
const RARITY_VALUE=[1,1.6,2.6,4,6,9]; // Commun → Unique
function sellPrice(it){ let m=RARITY_VALUE[it.rar]||1; return Math.floor((it.ilvl*5+15)*m); }
function forgeCost(it){ return (8*(it.rar+1)*(it.ilvl||1)) + ' frag'; }
window.equip=function(iid){ let it=S.inv.find(x=>x.iid===iid); if(!it)return; let slot=ITEM_BASES[it.base].slot;
  let prev=S.equip[slot]; S.equip[slot]=it; S.inv=S.inv.filter(x=>x.iid!==iid); if(prev)S.inv.push(prev);
  S.hpCur=Math.min(S.hpCur,heroDerived().maxHp); sfx('click'); toast(`✓ ${it.name} équipé.`); renderBag(); renderTop(); save(); };
window.unequip=function(slot){ let it=S.equip[slot]; if(!it)return; S.equip[slot]=null; S.inv.push(it); sfx('click'); renderBag(); renderTop(); save(); };
window.sellItem=function(iid){ let it=S.inv.find(x=>x.iid===iid); if(!it)return; S.gold+=sellPrice(it); S.inv=S.inv.filter(x=>x.iid!==iid); sfx('click'); renderBag(); renderTop(); save(); };
window.forgeItem=function(iid){ let it=S.inv.find(x=>x.iid===iid); if(!it)return; let cost=8*(it.rar+1)*(it.ilvl||1);
  if(S.mat<cost){toast('⛏️ Pas assez de fragments.');return;}
  S.mat-=cost; it.ilvl+=1; it.mainVal=Math.floor(it.mainVal*1.12)+1; it.affixes.forEach(a=>a.v=Math.floor(a.v*1.12)+1);
  it.name=it.name.replace(/ \+\d+$/,'')+' +'+(it.ilvl);
  sfx('magic'); toast(`⚒️ ${it.name} amélioré !`); renderBag(); renderTop(); save(); };

/* ===================================================================
   ÉCRAN TECHNIQUES
   =================================================================== */
let techTab=null;
let techWho='hero';
function availableTrees(){
  let trees=RACES[S.race].trees.slice();
  trees.push('physique');      // tout le monde sait se battre
  trees.push('tenebres');      // l'Anneau ouvre la voie des Ténèbres à tous
  trees.push('double');        // techniques double-type
  return [...new Set(trees)];
}
// types RÉELLEMENT possédés par le perso (pour les attaques doubles)
function ownedTypes(){
  let t=RACES[S.race].trees.slice();
  t.push('physique');                 // tout le monde manie l'arme
  if(S.isNazgul)t.push('tenebres');   // la voie de l'Ombre n'est innée qu'au Nazgûl
  return [...new Set(t)];
}
function canLearnTech(t){
  if(t.types){
    // ATTAQUE DOUBLE : apprenable uniquement si on POSSÈDE l'un des deux types
    let owned=ownedTypes();
    return t.types.some(ty=>owned.includes(ty));
  }
  // technique simple : selon les arbres disponibles (Anneau inclus)
  let avail=availableTrees();
  return avail.includes(t.type);
}
// abstraction du "sujet" du grimoire : héros ou compagnon
function techSubject(){
  if(techWho==='hero'||!S.recruited.includes(techWho)){
    return {who:'hero', name:RACES[S.race].n, ico:RACES[S.race].ico,
      trees:availableTrees(), learned:S.learned, equipped:S.equippedTech,
      level:S.level, can:t=>canLearnTech(t), nazgulOnly:true};
  }
  let id=techWho, type=ALLY_BY_ID[id].type, ad=ensureAlly(id);
  return {who:id, name:ALLY_BY_ID[id].n, ico:ALLY_BY_ID[id].ico,
    trees:[...new Set([type,'physique','double'])], learned:ad.learned, equipped:ad.moves,
    level:ad.level, can:t=>canAllyLearn(type,t), nazgulOnly:false};
}
function renderTech(){
  let el=$('#screen-tech'); if(!el)return;
  let SU=techSubject();
  let trees=SU.trees;
  if(!techTab||!trees.includes(techTab))techTab=trees[0];
  // sélecteur de grimoire (héros + compagnons recrutés)
  let whoBtns=`<button class="btn sm ${SU.who==='hero'?'gold':'ghost'}" onclick="setTechWho('hero')">${RACES[S.race].ico} ${S.isNazgul?'Spectre':'Héros'}</button>`;
  (S.recruited||[]).forEach(id=>{ whoBtns+=`<button class="btn sm ${SU.who===id?'gold':'ghost'}" onclick="setTechWho('${id}')">${ALLY_BY_ID[id].ico} ${ALLY_BY_ID[id].n}</button>`; });
  let html=`<div class="panel-title">Grimoire</div>
    <div class="who-bar">${whoBtns}</div>
    <div class="sub" style="text-align:center;margin:8px 0 6px">Apprends des techniques (💎 essence) ${SU.who==='hero'?'selon ta race (l\'Anneau ouvre les Ténèbres)':'selon le type du compagnon'}. Équipe-en jusqu'à 6.</div>
    <div style="text-align:center;margin-bottom:10px;font-size:12px">${SU.ico} ${SU.name} — Équipées : <b style="color:var(--ember-bright)">${SU.equipped.length}/6</b> · Essence : 💎 ${fmt(S.ess)}</div>`;
  html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">`;
  trees.forEach(t=>{ let label= t==='double'?'🌪️ Doubles':`${TYPES[t].ico} ${TYPES[t].n}`;
    html+=`<button class="btn sm ${techTab===t?'gold':'ghost'}" onclick="setTechTab('${t}')">${label}</button>`; });
  html+=`</div>`;
  let list = techTab==='double'
    ? TECH.filter(t=>t.types)
    : TECH.filter(t=>!t.types && t.type===techTab && (!t.nazgul||(SU.nazgulOnly&&S.isNazgul)));
  list.forEach(t=>{
    let learned=SU.learned.includes(t.id);
    let equipped=SU.equipped.includes(t.id);
    let canLearn=SU.level>=t.lvl && SU.can(t);
    let cost=techCost(t);
    let cls=equipped?'equipped':learned?'learned':canLearn?'':'locked';
    let chips=techTypes(t).map(ty=>tchip(ty)).join('');
    let cdTxt=t.cd?` · ⏳ ${t.cd}t`:'';
    html+=`<div class="tech-card ${cls}">
      <span class="tcico">${t.ico}</span>
      <div class="tcmid">
        <div class="tcname">${t.n} ${chips}</div>
        <div class="tcmeta">${t.desc} · ${t.cost?t.cost+' mana':'sans mana'} · ${t.target==='all'?'tous':t.target==='allyAll'?'équipe':t.target==='ally'?'allié':'cible'}${cdTxt}</div>
        <div class="tcmeta" style="color:var(--faint)">Requiert niv. ${t.lvl}${!SU.can(t)?' · type non maîtrisé':''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${learned
          ? (equipped?`<button class="btn sm ghost" onclick="unequipTech('${t.id}')">Retirer</button>`:`<button class="btn sm gold" onclick="equipTech('${t.id}')">Équiper</button>`)
          : `<button class="btn sm ${canLearn&&S.ess>=cost?'gold':'ghost'}" onclick="learnTech('${t.id}')" ${canLearn&&S.ess>=cost?'':'disabled'}>Apprendre 💎${cost}</button>`}
      </div>
    </div>`;
  });
  el.innerHTML=html;
}
function techCost(t){ return Math.max(1,Math.floor(t.lvl*0.8)+ (t.cost?Math.floor(t.cost/6):0)); }
window.setTechTab=function(t){ techTab=t; sfx('click'); renderTech(); };
window.setTechWho=function(w){ techWho=w; techTab=null; sfx('click'); renderTech(); };
window.learnTech=function(id){ let t=TECH_BY_ID[id]; let SU=techSubject();
  if(SU.level<t.lvl){toast('Niveau requis non atteint.');return;}
  if(!SU.can(t)){toast('Type non maîtrisé.');return;}
  if(SU.learned.includes(id)){return;}
  let cost=techCost(t); if(S.ess<cost){toast('💎 Pas assez d\'essence.');return;}
  S.ess-=cost; SU.learned.push(id); sfx('level'); toast(`📖 ${SU.name} apprend ${t.n} !`); renderTech(); renderTop(); save(); };
window.equipTech=function(id){ let SU=techSubject(); if(SU.equipped.length>=6){toast('6 techniques max équipées.');return;} if(!SU.equipped.includes(id))SU.equipped.push(id); sfx('click'); renderTech(); save(); };
window.unequipTech=function(id){ let SU=techSubject(); if(SU.equipped.length<=1){toast('Garde au moins une technique.');return;} let i=SU.equipped.indexOf(id); if(i>=0)SU.equipped.splice(i,1); sfx('click'); renderTech(); save(); };

/* ===================================================================
   ÉCRAN HÉROS (stats + allocation + corruption)
   =================================================================== */
function renderHeroScreen(){
  let el=$('#screen-hero'); if(!el)return;
  let d=heroDerived(); let race=RACES[S.race];
  let html=`<div class="panel-title">${S.isNazgul?'☠️ '+S.name:S.name}</div>
    <div class="sub" style="text-align:center">${race.ico} ${race.n} · Niveau ${S.level}</div>
    <div class="card" style="margin-top:10px">
      <div class="pnum" style="font-size:11px;color:var(--muted);display:flex;justify-content:space-between"><span>XP</span><span>${fmt(S.xp)} / ${fmt(xpNeeded(S.level))}</span></div>
      <div class="bar xp"><i style="width:${Math.min(100,S.xp/xpNeeded(S.level)*100)}%"></i></div>
      <div style="text-align:center;margin-top:8px;font-size:12px;color:var(--spectral)">✦ ${race.passive}</div>
    </div>`;
  // ÉVOLUTION DE RACE (choix multiples + ascension)
  let ev=evoOptions();
  if(ev.tier===0){
    html+=`<div class="card" style="border:1px solid var(--ember)"><div class="cz" style="font-size:13px;color:var(--ember-bright)">🌟 Forme ultime atteinte</div>
      <div class="sub" style="font-size:11px;margin-top:4px">${race.ico} ${race.n} — tu as atteint le sommet de ta lignée.</div></div>`;
  } else {
    let ok=S.level>=ev.req && S.ess>=ev.cost;
    html+=`<div class="card" style="border:1px solid var(--line2)">
      <div class="cz" style="font-size:13px;color:var(--ember-bright);margin-bottom:4px">${ev.tier===2?'🌟 Ascension':'⭐ Évolution'} — choix de voie</div>
      <div class="sub" style="font-size:11px;margin-bottom:8px">Requis : niveau ${ev.req} · 💎 ${ev.cost} essence ${ok?'':'<span style="color:var(--blood)">(non rempli)</span>'}. ${ev.tier===2?'+7 à toutes les stats.':'+3 à toutes les stats, un nouvel arbre élémentaire, et une voie de spécialisation.'}</div>`;
    ev.opts.forEach(opt=>{
      html+=`<div class="evo-opt">
        <div class="evo-mid"><div class="evo-n">${opt.ico} ${opt.n}</div><div class="evo-d">${opt.passive}</div></div>
        <button class="btn sm ${ok?'gold':'ghost'}" ${ok?'':'disabled'} onclick="evolveRace('${opt.key}')">Choisir</button>
      </div>`;
    });
    html+=`</div>`;
  }
  // allocation
  html+=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class="cz" style="font-size:14px;color:var(--ember-bright)">Caractéristiques</span>
      <span style="font-size:12px;color:var(--muted)">Points : <b style="color:var(--ember-bright)">${S.statPoints}</b></span>
    </div>`;
  STAT_KEYS.forEach(k=>{ let info=STAT_INFO[k];
    html+=`<div class="stat-row">
      <div style="flex:1"><div class="sname">${info.ico} ${info.n}</div><div class="sdesc">${info.d}</div></div>
      <div class="sval">${totalStat(k)}</div>
      <button class="plusbtn" onclick="allocStat('${k}')" ${S.statPoints<=0?'disabled':''}>+</button>
    </div>`; });
  html+=`</div>`;
  // derived
  html+=`<div class="card">
    <div class="kv"><span class="k">⚔️ Attaque physique</span><span class="v">${fmt(d.atkP)}</span></div>
    <div class="kv"><span class="k">🔮 Attaque magique</span><span class="v">${fmt(d.atkM)}</span></div>
    <div class="kv"><span class="k">❤️ PV max</span><span class="v">${fmt(d.maxHp)}</span></div>
    <div class="kv"><span class="k">💧 Mana max</span><span class="v">${fmt(d.maxMana)}</span></div>
    <div class="kv"><span class="k">🪶 Vitesse</span><span class="v">${d.spd}</span></div>
    <div class="kv"><span class="k">🎯 Critique</span><span class="v">${Math.round(d.crit*100)}%</span></div>
    <div class="kv"><span class="k">💨 Esquive</span><span class="v">${Math.round(d.dodge*100)}%</span></div>
    <div class="kv"><span class="k">🍀 Bonus butin</span><span class="v">+${Math.round((d.drop-1)*100)}%</span></div>
  </div>`;
  // ===== ARBRE DE COMPÉTENCES (par race) =====
  let baseRaceName=RACES[(RACES[S.race].evoFrom||S.race)].n;
  html+=`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span class="cz" style="font-size:14px;color:var(--ember-bright)">⭐ Arbre — ${baseRaceName}</span>
      <span style="font-size:12px;color:var(--muted)">Points : <b style="color:var(--ember-bright)">${S.talentPoints||0}</b>${(S.talentPoints>0)?' ✨':''}</span>
    </div>
    <div class="skilltree">`;
  let tree=allTalentNodes();
  let tiers=[...new Set(tree.map(n=>n.tier))].sort((a,b)=>a-b);
  tiers.forEach((tier,ti)=>{
    if(ti>0)html+=`<div class="skill-link">┊</div>`;
    html+=`<div class="skill-tier">`;
    tree.filter(n=>n.tier===tier).forEach(t=>{ let r=talentRank(t.id); let maxed=r>=t.max;
      let lvlOk=S.level>=t.tier; let prereq=skillPrereqOk(t);
      let can=!maxed&&lvlOk&&prereq&&(S.talentPoints||0)>0;
      let locked=!lvlOk||!prereq;
      html+=`<div class="skill-node ${r>0?'on':''} ${locked?'locked':''} ${t.cap?'cap':''}">
        <div class="sk-mid"><div class="sk-n">${t.cap?'★ ':''}${t.n} <span class="sk-rank">${r}/${t.max}</span></div>
          <div class="sk-d">${t.desc}</div>
          <div class="sk-req">${!lvlOk?`niv. ${t.tier} requis`:!prereq?'prérequis manquant':''}</div></div>
        <button class="plusbtn" onclick="learnTalent('${t.id}')" ${can?'':'disabled'}>+</button>
      </div>`;
    });
    html+=`</div>`;
  });
  html+=`</div>
    <button class="btn sm ghost block" style="margin-top:8px" onclick="resetTalents()">↺ Réinitialiser (rend les points)</button>
  </div>`;
  // Anneau & corruption
  html+=`<div class="card ring-card">
    <div class="cz" style="font-size:13px;color:var(--ember-bright);margin-bottom:6px">💍 L'Anneau Unique</div>
    <div class="sub" style="font-size:11px;margin-bottom:8px">Tu portes l'Anneau depuis le départ. En combat, son <b>Pouvoir</b> déchaîne les ténèbres sur tous les ennemis — mais chaque usage te corrompt un peu plus.${S.ringUses?` (utilisé ${S.ringUses} fois)`:''}</div>
    <div class="cz" style="font-size:12px;color:var(--arcane-bright);margin-bottom:6px">🌑 Corruption ${Math.round(S.corruption)}%</div>
    <div class="bar" style="background:#000"><i style="width:${S.corruption}%;background:linear-gradient(90deg,var(--arcane),var(--blood))"></i></div>
    <div class="sub" style="font-size:11px;margin-top:6px">${S.isNazgul?'Tu as succombé à l\'Ombre. Tu es désormais un Nazgûl, et l\'Anneau ne te coûte plus rien.':'À 100%, l\'Ombre te consume et tu deviens un Nazgûl.'}</div>
    ${S.isNazgul?'':`<button class="btn sm ghost block" style="margin-top:8px" onclick="purify()">✨ Purifier (-20%, 30 essence)</button>`}
  </div>`;
  // options audio
  let mv=Math.round((S.musicVol!=null?S.musicVol:0.6)*100), sv=Math.round((S.sfxVol!=null?S.sfxVol:0.7)*100);
  html+=`<div class="card">
    <div class="cz" style="font-size:13px;color:var(--ember-bright);margin-bottom:6px">⚙️ Options</div>
    <div class="kv"><span class="k">🎵 Musique</span><button class="btn sm ${S.musicOn?'gold':'ghost'}" onclick="toggleMusic()">${S.musicOn?'Activée':'Coupée'}</button></div>
    <div class="vol-row"><span class="vol-ico">🔉</span>
      <input class="vol-slider" type="range" min="0" max="100" value="${mv}" oninput="setMusicVol(this.value)" ${S.musicOn?'':'disabled'}>
      <span class="vol-val" id="mvVal">${mv}%</span></div>
    <div class="kv" style="margin-top:8px"><span class="k">🔊 Effets sonores</span><button class="btn sm ${S.sfxOn?'gold':'ghost'}" onclick="toggleSfx()">${S.sfxOn?'Activés':'Coupés'}</button></div>
    <div class="vol-row"><span class="vol-ico">🔉</span>
      <input class="vol-slider" type="range" min="0" max="100" value="${sv}" oninput="setSfxVol(this.value)" ${S.sfxOn?'':'disabled'}>
      <span class="vol-val" id="svVal">${sv}%</span></div>
  </div>`;
  html+=`<button class="btn ghost block" onclick="hardReset()" style="margin-top:6px;opacity:.6">↺ Nouvelle partie</button>`;
  el.innerHTML=html;
}
window.toggleMusic=function(){ S.musicOn=!S.musicOn; sfx('click'); Music.setEnabled(S.musicOn); renderHeroScreen(); save(); };
window.toggleSfx=function(){ S.sfxOn=!S.sfxOn; renderHeroScreen(); save(); };
window.setMusicVol=function(v){ v=Number(v)/100; S.musicVol=v; let l=$('#mvVal'); if(l)l.textContent=Math.round(v*100)+'%'; Music.setVolume(v); save(); };
window.setSfxVol=function(v){ v=Number(v)/100; S.sfxVol=v; let l=$('#svVal'); if(l)l.textContent=Math.round(v*100)+'%'; if(v>0)beep(660,0.05,'sine',0.06); save(); };
window.allocStat=function(k){ if(S.statPoints<=0)return; S.statPoints--; S.alloc[k]=(S.alloc[k]||0)+1;
  S.hpCur=Math.min(S.hpCur==null?1e9:S.hpCur,heroDerived().maxHp); sfx('click'); renderHeroScreen(); renderTop(); save(); };
window.learnTalent=function(id){ if((S.talentPoints||0)<=0){toast('Aucun point de compétence.');return;}
  let node=allTalentNodes().find(t=>t.id===id); if(!node)return;
  if(S.level<node.tier){toast(`Niveau ${node.tier} requis.`);return;}
  if(!skillPrereqOk(node)){toast('Prérequis manquant dans l\'arbre.');return;}
  let r=talentRank(id); if(r>=node.max){toast('Compétence au maximum.');return;}
  S.talents=S.talents||{}; S.talents[id]=r+1; S.talentPoints--;
  sfx('level'); renderHeroScreen(); renderTop(); save(); };
window.resetTalents=function(){ let spent=0; for(let id in (S.talents||{}))spent+=S.talents[id];
  if(!spent){toast('Aucun talent à réinitialiser.');return;}
  S.talentPoints=(S.talentPoints||0)+spent; S.talents={};
  S.hpCur=Math.min(S.hpCur,heroDerived().maxHp); sfx('click'); toast(`↺ ${spent} point(s) de talent rendus.`); renderHeroScreen(); renderTop(); save(); };
window.purify=function(){ if(S.ess<30){toast('Pas assez d\'essence.');return;} S.ess-=30; S.corruption=Math.max(0,S.corruption-20); sfx('heal'); renderHeroScreen(); renderTop(); save(); };
window.evolveRace=function(toKey){
  let ev=evoOptions(); if(ev.tier===0){toast('Forme ultime déjà atteinte.');return;}
  let opt=ev.opts.find(o=>o.key===toKey); if(!opt){toast('Choix invalide.');return;}
  if(S.level<ev.req){toast(`Niveau ${ev.req} requis.`);return;}
  if(S.ess<ev.cost){toast('💎 Pas assez d\'essence.');return;}
  if(!RACES[toKey]){toast('Forme indisponible.');return;}
  S.ess-=ev.cost; S.race=toKey;
  S.hpCur=heroDerived().maxHp; if(!S.isNazgul)S.manaCur=heroDerived().maxMana;
  sfx('evolve'); flash('#e6a73e',.5); toast(`🌟 Tu évolues en ${RACES[S.race].ico} ${RACES[S.race].n} !`);
  renderHeroScreen(); renderTop(); save();
};
window.hardReset=function(){ if(confirm('Effacer la sauvegarde et recommencer ?')){ localStorage.removeItem(SAVE_KEY); location.reload(); } };

/* corruption gain quand on lance une tech ténèbres (héros) */
function addCorruption(n){ if(S.isNazgul)return; S.corruption=clamp(S.corruption+n,0,100); if(S.corruption>=100)becomeNazgul(); }
function becomeNazgul(){ S.isNazgul=true; document.body.classList.add('nazgul'); toast('☠️ L\'Ombre t\'a consumé… Tu deviens un Nazgûl !'); sfx('lose'); Music.update(); save(); }

/* ===================================================================
   BARRE DU HAUT
   =================================================================== */
function renderTop(){
  $('#rGold').textContent=fmt(S.gold);
  $('#rEss').textContent=fmt(S.ess);
  $('#rMat').textContent=fmt(S.mat);
  $('#regionPill').textContent=ZONE_BY_ID[S.curZone]?ZONE_BY_ID[S.curZone].n:'—';
  $('#corrBar').style.width=S.corruption+'%';
}

/* ===================================================================
   ÉCRAN TITRE / CRÉATION
   =================================================================== */
let mkName='', mkRace='humain';
function renderTitle(){
  let t=$('#title');
  t.innerHTML=`<h1>L'Ascension<br>de l'Ombre</h1>
    <div class="tsub">un voyage à travers les Terres du Milieu</div>
    <div style="width:100%;max-width:380px;margin-top:10px">
      <div class="cz" style="font-size:12px;color:var(--muted);text-align:left;margin-bottom:4px">Ton nom</div>
      <input class="field-input" id="mkNameInput" maxlength="14" placeholder="Voyageur" value="${mkName}">
      <div class="cz" style="font-size:12px;color:var(--muted);text-align:left;margin:14px 0 4px">Ta lignée</div>
      <div class="choice-grid" id="raceGrid">
        ${BASE_RACE_KEYS.map(k=>[k,RACES[k]]).map(([k,r])=>`<div class="choice ${mkRace===k?'sel':''}" data-race="${k}">
          <div class="cico">${r.ico}</div><div class="cname">${r.n}</div>
          <div class="cdesc">${r.passive}<br><span style="color:var(--spectral)">${r.trees.map(tt=>TYPES[tt].ico).join(' ')}</span></div></div>`).join('')}
      </div>
      <button class="btn gold block" style="margin-top:18px;padding:14px" id="startBtn">Commencer l'aventure ▸</button>
    </div>`;
  t.querySelector('#mkNameInput').addEventListener('input',e=>mkName=e.target.value);
  t.querySelectorAll('.choice').forEach(c=>c.addEventListener('click',()=>{ mkRace=c.dataset.race; ac();
    t.querySelectorAll('.choice').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); sfx('click'); }));
  t.querySelector('#startBtn').addEventListener('click',()=>{ ac(); startNewGame(); });
}
function startNewGame(){
  S=defaultState();
  S.name=(mkName||'Voyageur').trim().slice(0,14)||'Voyageur';
  S.race=mkRace; S.created=true;
  // tech de départ selon race (1ère du 1er arbre + taillade)
  let firstTree=RACES[S.race].trees[0];
  let starter=TECH.find(t=>!t.types&&t.type===firstTree&&t.lvl<=3&&t.id!=='ph1')||TECH.find(t=>!t.types&&t.type===firstTree&&t.lvl<=2);
  S.learned=['ph1']; S.equippedTech=['ph1'];
  if(starter&&!S.learned.includes(starter.id)){ S.learned.push(starter.id); S.equippedTech.push(starter.id); }
  let d=heroDerived(); S.hpCur=d.maxHp; S.manaCur=d.maxMana;
  save();
  $('#title').classList.add('hidden');
  openScreen('map'); renderTop();
  toast(`Bienvenue, ${S.name} le ${RACES[S.race].n}. Ton voyage commence.`);
}

/* ===================================================================
   BOUCLE LÉGÈRE (autosave + régén carte)
   =================================================================== */
let lastT=Date.now();
setInterval(()=>{
  if(!S||!S.created)return;
  let now=Date.now(),dt=(now-lastT)/1000; lastT=now;
  // régén hors combat (y compris si un combat AUTO tourne en arrière-plan : pas de régén)
  if(!(B&&!B.over)){ let d=heroDerived();
    if(S.hpCur<d.maxHp)S.hpCur=Math.min(d.maxHp,S.hpCur+d.maxHp*0.02*dt);
    if(S.manaCur<d.maxMana)S.manaCur=Math.min(d.maxMana,S.manaCur+d.maxMana*0.04*dt);
  }
},1000);
setInterval(()=>{ if(S&&S.created)save(); },15000);

/* démarre la musique de fond au premier geste de l'utilisateur (politique autoplay) */
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>{ if(S&&S.musicOn)Music.ensure(); },{passive:true}));

/* ===================================================================
   INIT
   =================================================================== */
(function init(){
  let loaded=load();
  if(loaded&&S.created){
    if(S.isNazgul)document.body.classList.add('nazgul');
    $('#title').classList.add('hidden');
    let d=heroDerived(); if(S.hpCur==null)S.hpCur=d.maxHp; if(S.manaCur==null)S.manaCur=d.maxMana;
    // reprise d'une carte d'aventure en cours
    PATH = S.path || null;
    if(PATH && PATH.inCombat){ PATH.inCombat=false; PATH.pending=null; } // le combat interrompu est annulé
    openScreen('map'); renderTop();
  } else {
    renderTitle();
  }
})();

/* musique : démarre au premier geste utilisateur (politique autoplay) */
function _musicKick(){ if(S&&S.created&&S.musicOn)Music.ensure(); }
['click','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,_musicKick,{passive:true}));

/* clavier (desktop) : actions de combat */
window.addEventListener('keydown',e=>{
  if(!B||B.over||!B.awaiting)return;
  let cur=B.curMember; if(!cur||!B.party.includes(cur))return;
  if(S.autoBattle)return;
  let k=e.key.toLowerCase();
  if(B.menu==='root'){
    if(k==='a'){cmdAttack();} else if(k==='t'){cmdOpenTech();} else if(k==='d'){cmdDefend();} else if(k==='o'){cmdOpenItems();} else if(k==='r'){cmdRing();}
  } else if(e.key==='Escape'){ cmdBack(); }
  else if(B.menu==='tech'){ let n=parseInt(k); if(n>=1&&n<=cur.moves.length){ cmdUseTech(cur.moves[n-1]); } }
});
