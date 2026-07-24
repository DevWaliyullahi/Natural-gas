// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  bootstrap: null, report: null, drillReport: null,
  auth: null,
  view: "dashboard", subView: null,
  drillTransporter: null,
  drillSupplier: null, drillSupplierTab: "details",
  drillCustomer: null,
  drillSubmission: null,
  drillSubmissionSub: null,
  navAccordion: { workspace: true, "master-data": true },
  chatEntity: null,
  aiActiveConv: null,
  aiMessages: {},
  escalations: [],
  escalationStageFilter: null,
  utilizationMode: "strategic",
  sectorDrill: null,
  flowChartMode: "bar",
  populationStatus: [],
  criticalIncidentsPage: 0,
  dismissedInsights: new Set(),
  bannerDismissed: false,
  notifOpen: false,
  showCustomDateRange: false,
  dgdrSupplierDrill: null,
  escalationViewMode: "card",
  showDateFilterPanel: false,
  incidentSeverityFilter: "",
  knowledgeDocs: [],
  knowledgeCategoryFilter: null,
  cases: [],
  caseStatusFilter: null,
  caseCategoryFilter: null,
  caseViewMode: "card",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const fmt = v => Number(v||0).toLocaleString(undefined,{maximumFractionDigits:2});
const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const fmtStatus = s => String(s||"").replaceAll("_"," ").replace("WITH WARNINGS","WITH FLAGS");

async function api(path,opts={}) {
  const r = await fetch(path,opts);
  const p = await r.json();
  if(!r.ok && !p.message && !p.errors) throw new Error("Request failed");
  return p;
}
function renderIcons() { if(window.lucide) window.lucide.createIcons(); }

function showToast(message,kind="success"){
  let host=document.getElementById("toastHost");
  if(!host){
    host=document.createElement("div");
    host.id="toastHost";
    host.style.cssText="position:fixed;top:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end";
    document.body.appendChild(host);
  }
  const el=document.createElement("div");
  const bg=kind==="error"?"#8d2020":"#12623d";
  el.style.cssText=`background:${bg};color:#fff;padding:12px 16px;border-radius:12px;font-size:13.5px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.18);max-width:340px;display:flex;align-items:center;gap:8px;opacity:0;transform:translateY(-8px);transition:opacity .2s ease,transform .2s ease`;
  el.innerHTML=`<i data-lucide="${kind==="error"?"alert-circle":"check-circle"}" style="width:16px;height:16px;flex-shrink:0"></i><span>${esc(message)}</span>`;
  host.appendChild(el);
  renderIcons();
  requestAnimationFrame(()=>{el.style.opacity="1";el.style.transform="translateY(0)";});
  setTimeout(()=>{
    el.style.opacity="0";el.style.transform="translateY(-8px)";
    setTimeout(()=>el.remove(),200);
  },3200);
}

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {label:"Super Admin — NGIC",   email:"admin@ngic.ng",        password:"demo1234",name:"NGIC Admin",      role:"admin",       userType:"super_admin",  transporterId:null},
  {label:"Platform User — DPR",  email:"regulator@dpr.gov.ng", password:"demo1234",name:"DPR Officer",     role:"admin",       userType:"platform_user",transporterId:null},
  {label:"Viewer — Regulatory",  email:"viewer@dpr.gov.ng",    password:"demo1234",name:"Regulatory Viewer",role:"viewer",     userType:"viewer",       transporterId:null},
  {label:"Transporter — NGIC",   email:"uploads@ngic.ng",      password:"demo1234",name:"NGIC Operator",   role:"transporter", userType:"platform_user",transporterId:"NGIC"},
  {label:"GASCO — Seplat Energy",email:"gasco@seplat.ng",      password:"demo1234",name:"Seplat GASCO Desk",role:"gasco",       userType:"platform_user",supplierId:"SEPLAT"},
  {label:"Shipper — TotalEnergies",email:"shipper@totalenergies.ng",password:"demo1234",name:"TotalEnergies Nomination Desk",role:"shipper",userType:"platform_user",shipperId:"SHIPPER-SUPPLIER-A"},
];

// ─── Mock users for Users management ─────────────────────────────────────────
let mockUsers = [
  {id:"USR-001",firstName:"Emeka",    lastName:"Okonkwo", email:"admin@ngic.ng",        userType:"super_admin",  role:"admin",      status:"active",  lastLogin:"2026-06-18"},
  {id:"USR-002",firstName:"Fatima",   lastName:"Bello",   email:"regulator@dpr.gov.ng", userType:"platform_user",role:"admin",      status:"active",  lastLogin:"2026-06-17"},
  {id:"USR-003",firstName:"Chukwudi", lastName:"Eze",     email:"uploads@ngic.ng",      userType:"platform_user",role:"transporter",status:"active",  lastLogin:"2026-06-19"},
  {id:"USR-004",firstName:"Amaka",    lastName:"Nwosu",   email:"uploads@gaslink.ng",   userType:"platform_user",role:"transporter",status:"active",  lastLogin:"2026-06-15"},
  {id:"USR-005",firstName:"Tunde",    lastName:"Adeyemi", email:"viewer@dpr.gov.ng",    userType:"viewer",       role:"viewer",     status:"active",  lastLogin:"2026-06-10"},
  {id:"USR-007",firstName:"Ngozi",    lastName:"Uche",    email:"gasco@seplat.ng",      userType:"platform_user",role:"gasco",      status:"active",  lastLogin:"2026-06-16"},
  {id:"USR-006",firstName:"Grace",    lastName:"Ibrahim", email:"grace.ibrahim@ngic.ng",userType:"platform_user",role:"admin",      status:"inactive",lastLogin:"2026-05-22"},
];
const USER_TYPE_LABELS = {super_admin:"Super Admin",platform_user:"Platform User",viewer:"Viewer"};

// ─── AI conversation seed ─────────────────────────────────────────────────────
const AI_CONVERSATIONS = [
  {id:"conv-1",title:"Shipper Imbalance Q1 2026",   date:"Jun 19"},
  {id:"conv-2",title:"NGIC Compliance Score",        date:"Jun 18"},
  {id:"conv-3",title:"Seplat Missing Submissions",   date:"Jun 17"},
  {id:"conv-4",title:"Pressure Breaches Analysis",   date:"Jun 16"},
  {id:"conv-5",title:"Entry and Exit Point Records", date:"Jun 15"},
  {id:"conv-6",title:"Offtaker Attribution Q1",      date:"Jun 14"},
  {id:"conv-7",title:"CNL Shrinkage Threshold",      date:"Jun 12"},
];

const AI_SEED_MESSAGES = {
  "conv-5":[
    {role:"user",text:"What entry points are associated with NGIC?"},
    {role:"bot", text:"Based on Q1 2026 data, NGIC operates through the following entry points: <strong>Escravos Gas Plant (EGP)</strong>, <strong>Obiafu/Obrikom (OB/OB)</strong>, and <strong>Utorogu Gas Plant (UGP)</strong>. These are the primary NEA injection points on the national network.<br><br>Effective injection across these points totalled <strong>8,412 MMScf</strong> for Q1 2026, with OB/OB contributing the largest share at approximately 41%."},
    {role:"user",text:"Are there any pressure breaches at Escravos?"},
    {role:"bot", text:"Yes — <strong>3 pressure breach flags</strong> were recorded at Escravos Gas Plant in Q1 2026:<br><br>1. <strong>2026-02-14</strong>: Entry pressure at 42.3 Barg against NEA band of 44–68 Barg → WARNING<br>2. <strong>2026-02-15</strong>: Pressure dropped to 41.8 Barg — consecutive low-pressure day<br>3. <strong>2026-03-07</strong>: Pressure spike to 71.2 Barg — above maximum band<br><br>All three are classified <strong>WARNING</strong>. Consider reviewing maintenance schedules at this entry point."},
  ],
  "conv-1":[
    {role:"user",text:"Which shipper has the highest imbalance this quarter?"},
    {role:"bot", text:"For Q1 2026, the mapped shipper account for <strong>TotalEnergies</strong> has the highest imbalance at <strong>14.2 MMScf</strong>. Review the linked supplier/GASCO delivery record and offtaker withdrawals before escalation."},
    {role:"user",text:"How does Seplat compare?"},
    {role:"bot", text:"<strong>Seplat Energy</strong> shows an imbalance of <strong>6.8 MMScf</strong> — significantly lower than TotalEnergies. Seplat's injection averaged <strong>175 MMScf/month</strong>, with attribution closely tracking effective injection after the 3.4% shrinkage deduction."},
  ],
};

// ─── Navigation ───────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  {group:"Operations"},
  {view:"dashboard",      icon:"layout-dashboard",    label:"Dashboard"},
  {view:"transportation", icon:"activity",            label:"Transportation"},
  {view:"dgdr",           icon:"target",              label:"DGDR / DGDO"},
  {view:"utilization",    icon:"pie-chart",           label:"Sector Utilisation"},
  {view:"exceptions",     icon:"triangle-alert",      label:"Potential Incidents"},
  {view:"escalations",    icon:"message-circle",      label:"Escalations"},
  {view:"cases",          icon:"folder-open",         label:"Case Management"},
  {view:"knowledge",      icon:"library",             label:"Knowledge Base"},
  {view:"ai",             icon:"sparkles",            label:"AI Intelligence"},
  {group:"Master Data"},
  {view:"transporters",   icon:"route",               label:"Transporter"},
  {view:"suppliers",      icon:"factory",             label:"Gas Suppliers"},
  {view:"shippers",       icon:"network",             label:"Shippers"},
  {view:"customers",      icon:"users",               label:"Offtakers"},
  {view:"points",         icon:"map-pin",             label:"Entry / Exit Points"},
  {group:"Configuration"},
  {view:"thresholds",     icon:"settings",            label:"Settings"},
  {view:"users",          icon:"user-cog",            label:"Users"},
];

const TRANSPORTER_NAV = [
  {accordion:"workspace",icon:"layout-dashboard", label:"Workspace"},
  {view:"dashboard",icon:"layout-dashboard",      label:"Dashboard",       parent:"workspace"},
  {view:"uploads",  icon:"upload-cloud",           label:"Upload & Reports",parent:"workspace"},
  {group:"Operations"},
  {view:"cases",    icon:"folder-open",            label:"Case Management"},
  {group:"Account"},
  {view:"profile",  icon:"user",                   label:"Profile"},
];

const GASCO_NAV = [
  {group:"Operations"},
  {view:"dashboard",   icon:"layout-dashboard", label:"Dashboard"},
  {view:"nomination",  icon:"clipboard-list",   label:"Nomination & Quality"},
  {view:"cases",       icon:"folder-open",      label:"Case Management"},
  {group:"Account"},
  {view:"profile",     icon:"user",             label:"Profile"},
];

const VIEWER_NAV = [
  {group:"Operations"},
  {view:"dashboard",   icon:"layout-dashboard", label:"Dashboard"},
  {view:"cases",       icon:"folder-open",      label:"Case Management"},
  {group:"Registry"},
  {view:"suppliers",   icon:"factory",          label:"Gas Suppliers"},
  {view:"shippers",    icon:"ship",             label:"Shippers"},
  {view:"customers",   icon:"building-2",       label:"Offtakers"},
];

const SHIPPER_NAV = [
  {group:"Operations"},
  {view:"dashboard",       icon:"layout-dashboard", label:"Dashboard"},
  {view:"shipperNomination",icon:"clipboard-list",  label:"My Nominations"},
  {view:"uploads",         icon:"upload-cloud",     label:"Upload Data"},
  {view:"cases",           icon:"folder-open",      label:"Case Management"},
  {group:"Account"},
  {view:"profile",         icon:"user",             label:"Profile"},
];

function renderNav() {
  const nav = $("#mainNav"); if(!nav) return;
  const role = state.auth?.role;
  let items = role==="transporter" ? TRANSPORTER_NAV : role==="gasco" ? GASCO_NAV : role==="shipper" ? SHIPPER_NAV : role==="viewer" ? VIEWER_NAV : ADMIN_NAV;
  let html="";
  for(let i=0;i<items.length;i++){
    const item=items[i];
    if(item.group){html+=`<p>${item.group}</p>`;continue;}
    if(item.accordion){
      const open=!!state.navAccordion[item.accordion];
      html+=`<button class="nav-item nav-accordion-head ${open?"open":""}" data-accordion="${item.accordion}">
        <i data-lucide="${item.icon}"></i><span>${item.label}</span>
        <i data-lucide="chevron-down" class="acc-chevron"></i>
      </button><div class="nav-accordion-body ${open?"open":""}" id="acc-${item.accordion}">`;
      continue;
    }
    if(item.parent){
      const active=state.view===item.view?"active":"";
      html+=`<button class="nav-item nav-sub ${active}" data-view="${item.view}"><i data-lucide="${item.icon}"></i><span>${item.label}</span></button>`;
      // close accordion body after last sibling
      const siblings=items.filter(x=>x.parent===item.parent);
      if(siblings[siblings.length-1]===item) html+=`</div>`;
      continue;
    }
    const active=state.view===item.view?"active":"";
    html+=`<button class="nav-item ${active}" data-view="${item.view}"><i data-lucide="${item.icon}"></i><span>${item.label}</span></button>`;
  }
  nav.innerHTML=html;
  renderIcons();
}

function setView(view){
  state.view=view;state.subView=null;
  state.drillTransporter=state.drillSupplier=state.drillCustomer=null;
  state.drillSubmission=state.drillSubmissionSub=null;
  state.sectorDrill=null;
  renderNav();renderApp();
}

// ─── Data fetching ────────────────────────────────────────────────────────────
let _activeFilters={};

async function fetchReport(extra={}){
  const p=new URLSearchParams();
  Object.entries({..._activeFilters,...extra}).forEach(([k,v])=>v&&p.set(k,v));
  const qs=p.toString();
  return api(`/api/report${qs?`?${qs}`:""}`);
}

async function fetchEscalations(extra={}){
  const p=new URLSearchParams();
  Object.entries(extra).forEach(([k,v])=>v&&p.set(k,v));
  const qs=p.toString();
  const result=await api(`/api/escalations${qs?`?${qs}`:""}`);
  return result.cases||[];
}

async function createEscalation(flagId){
  const author=state.auth?.name||"Analyst";
  const result=await api("/api/escalations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({flagId,author})});
  return result;
}

async function postEscalationAction(caseId,action,note=""){
  const author=state.auth?.name||"Analyst";
  return api(`/api/escalations/${caseId}/action`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,author,note})});
}

async function fetchPopulationStatus(){
  return (await api("/api/population-status")).rows||[];
}

async function fetchKnowledgeDocs(extra={}){
  const p=new URLSearchParams();
  Object.entries(extra).forEach(([k,v])=>v&&p.set(k,v));
  const qs=p.toString();
  const result=await api(`/api/knowledge-base${qs?`?${qs}`:""}`);
  return result.docs||[];
}

async function deleteKnowledgeDoc(docId){
  return api(`/api/knowledge-base/${docId}/delete`,{method:"POST"});
}

async function fetchCases(extra={}){
  const p=new URLSearchParams();
  Object.entries(extra).forEach(([k,v])=>v&&p.set(k,v));
  const qs=p.toString();
  const result=await api(`/api/cases${qs?`?${qs}`:""}`);
  return result.cases||[];
}

async function postCaseAction(caseId,action,extra={}){
  const author=state.auth?.name||"Analyst";
  return api(`/api/cases/${caseId}/action`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,author,...extra})});
}

async function fetchShipperNominations(shipperId){
  const p=new URLSearchParams();
  if(shipperId)p.set("shipper",shipperId);
  const result=await api(`/api/shipper/nominations?${p.toString()}`);
  return result.nominations||[];
}

async function refreshData(extra={}){
  _activeFilters={..._activeFilters,...extra};
  state.bootstrap=await api("/api/bootstrap");
  state.report=await fetchReport();
  state.escalations=await fetchEscalations();
  state.populationStatus=await fetchPopulationStatus();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function populateDemoSelect(){
  const sel=$("#demoSelect");if(!sel)return;
  sel.innerHTML=`<option value="">— Quick demo login —</option>`;
  DEMO_ACCOUNTS.forEach((a,i)=>{const o=document.createElement("option");o.value=i;o.textContent=a.label;sel.appendChild(o);});
}

function doLogin(){
  const email=$("#loginEmail")?.value.trim(),pw=$("#loginPassword")?.value.trim();
  if(!email||!pw){showLoginError("Enter email and password.");return;}
  const match=DEMO_ACCOUNTS.find(a=>a.email===email);
  if(!match||pw!=="demo1234"){showLoginError("Invalid credentials. Use the demo selector.");return;}
  state.auth={...match};
  try{localStorage.setItem("ti_auth",JSON.stringify(state.auth));}catch(_){}
  enterApp();
}

function doLogout(){
  state.auth=null;state.view="dashboard";_activeFilters={};
  state.drillTransporter=state.drillSupplier=state.drillCustomer=null;
  state.drillSubmission=state.drillSubmissionSub=null;
  try{localStorage.removeItem("ti_auth");}catch(_){}
  showPublic(false);
}

function showLoginError(msg){const el=$("#loginError");if(el){el.textContent=msg;el.style.display="block";}}

async function enterApp(){
  $("#publicSite").style.display="none";
  $("#appShell").style.display="";
  state.bannerDismissed=false;
  updateTopbar();renderNav();renderIcons();
  await refreshData();
  renderApp();
}

function showPublic(showLogin=false){
  $("#publicSite").style.display="";
  $("#appShell").style.display="none";
  if(showLogin){
    $("#homeView").style.display="none";
    $("#loginView").style.display="";
    populateDemoSelect();
    const em=$("#loginEmail");if(em)em.value="";
    const pw=$("#loginPassword");if(pw)pw.value="";
  }else{
    $("#homeView").style.display="";
    $("#loginView").style.display="none";
  }
  renderIcons();
}

function updateTopbar(){
  if(!state.auth)return;
  const ini=(state.auth.name||"TI").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const av=$("#userAvatar");if(av)av.textContent=ini;
  const un=$("#userName");if(un)un.textContent=state.auth.name;
  const ue=$("#userEmail");if(ue)ue.textContent=state.auth.email;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function pageHeader(title,desc,actions=""){
  const roleLabel=state.auth?.role==="admin"?"Admin workspace":state.auth?.role==="viewer"?"Viewer workspace":state.auth?.role==="gasco"?"GASCO workspace":state.auth?.role==="shipper"?"Shipper workspace":"Transporter workspace";
  return `<section class="page-hero"><div><span class="eyebrow">${roleLabel}</span><h1>${title}</h1><p>${desc}</p></div><div class="hero-actions">${actions}</div></section>`;
}

function backBtn(label="Back"){
  return `<button class="back-btn" data-back-btn="1"><i data-lucide="arrow-left"></i> ${label}</button>`;
}

const TIME_PRESETS=[["today","Today","2026-03-31","2026-03-31"],["week","Week","2026-03-25","2026-03-31"],["month","Month","2026-03-01","2026-03-31"],["quarter","Quarter","2026-01-01","2026-03-31"],["all","All","",""]];
const YEAR_RANGE=Array.from({length:2026-2010+1},(_,i)=>String(2026-i));

function halfYearPreset(year){
  const inQ2Plus = ["2026-04-01","2026-12-31"]; // demo data only spans Jan-Mar 2026, so H1 covers all seeded data
  return { h1:[`${year}-01-01`,`${year}-06-30`], h2:[`${year}-07-01`,`${year}-12-31`] };
}

function timeFilterBar(){
  const s=_activeFilters.startDate||"",e=_activeFilters.endDate||"";
  const active=TIME_PRESETS.find(([,,ps,pe])=>ps===s&&pe===e)?.[0]||(!s&&!e?"all":null);
  const years=YEAR_RANGE;
  const selectedYear=_activeFilters._year||years[0]||"2026";
  const half=halfYearPreset(selectedYear);
  const isH1=s===half.h1[0]&&e===half.h1[1], isH2=s===half.h2[0]&&e===half.h2[1];
  const isYear=s===`${selectedYear}-01-01`&&e===`${selectedYear}-12-31`;
  return `<div class="time-filter-bar-wrap">
    <div class="time-filter-bar">
      ${TIME_PRESETS.map(([key,label])=>`<button class="time-btn ${active===key?"active":""}" data-time-preset="${key}">${label}</button>`).join("")}
      <button class="time-btn ${isH1?"active":""}" data-time-half="h1">H1 ${selectedYear}</button>
      <button class="time-btn ${isH2?"active":""}" data-time-half="h2">H2 ${selectedYear}</button>
      <button class="time-btn ${isYear?"active":""}" data-time-half="year">Full Year</button>
      <select class="time-year-select" id="tf-year">
        ${years.map(y=>`<option value="${y}" ${y===selectedYear?"selected":""}>${y}</option>`).join("")}
      </select>
      <button class="time-btn ${state.showCustomDateRange?"active":""}" id="tf-custom-toggle">Custom…</button>
    </div>
    ${state.showCustomDateRange?`<div class="time-custom-range">
      <label>From <input type="date" id="tf-start" value="${s}"/></label>
      <label>To <input type="date" id="tf-end" value="${e}"/></label>
      <button class="primary-btn" id="tf-custom-apply" style="min-height:34px;font-size:13px;padding:0 14px">Apply Range</button>
    </div>`:""}
  </div>`;
}

function dateFilterSummaryLabel(){
  const s=_activeFilters.startDate||"",e=_activeFilters.endDate||"";
  const preset=TIME_PRESETS.find(([,,ps,pe])=>ps===s&&pe===e);
  if(preset)return preset[1];
  if(!s&&!e)return "All time";
  const selectedYear=_activeFilters._year||YEAR_RANGE[0];
  const half=halfYearPreset(selectedYear);
  if(s===half.h1[0]&&e===half.h1[1])return `H1 ${selectedYear}`;
  if(s===half.h2[0]&&e===half.h2[1])return `H2 ${selectedYear}`;
  if(s===`${selectedYear}-01-01`&&e===`${selectedYear}-12-31`)return `Full Year ${selectedYear}`;
  if(s&&e)return `${s} → ${e}`;
  return "Custom range";
}

function dateFilterDropdown(){
  const open=!!state.showDateFilterPanel;
  return `<div class="filter-dd ${open?"open":""}">
    <button type="button" class="filter-dd-toggle" id="dateFilterToggle"><i data-lucide="calendar"></i> ${esc(dateFilterSummaryLabel())} <i data-lucide="chevron-down"></i></button>
    ${open?`<div class="filter-dd-panel">${timeFilterBar()}</div>`:""}
  </div>`;
}

// ─── Chart tooltip registry ────────────────────────────────────────────────────
let _tipReg={},_tipSeq=0;
function regTip(label,items){const id="tip"+(_tipSeq++);_tipReg[id]={label,items};return id;}

function buildChartHitCols(data,x0,slotW,pT,pH,labelForTip,itemsForTip){
  return data.map((d,i)=>{
    const id=regTip(labelForTip(d,i),itemsForTip(d,i));
    return `<rect class="chart-hit-col" x="${(x0+i*slotW).toFixed(1)}" y="${pT}" width="${slotW.toFixed(1)}" height="${pH}" pointer-events="all" data-tip-id="${id}"></rect>`;
  }).join("");
}

function dateLabelShort(dateStr){
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"});
}
function dateLabelLong(dateStr){
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}

// ─── Shared trend chart (bar/line, with grid + hover tooltip hit-columns) ─────
function renderTrendChartSVG(data,seriesKeys,opts={}){
  if(!data.length)return`<div class="empty">No trend data.</div>`;
  const mode=opts.mode||"bar";
  const W=opts.W||920,H=opts.H||260,pX=opts.pX||48,pT=opts.pT||16,pB=opts.pB||34,pW=W-pX*2,pH=H-pT-pB;
  const max=Math.max(...data.map(d=>Math.max(...seriesKeys.map(([k])=>Math.abs(d[k]||0)))),1);
  const grid=[0.25,0.5,0.75,1].map(g=>`<line x1="${pX}" x2="${W-pX}" y1="${pT+pH-(g*pH)}" y2="${pT+pH-(g*pH)}" stroke="#edf1ee"/><text x="10" y="${pT+pH-(g*pH)+4}" font-size="10" fill="var(--muted)">${fmt(max*g)}</text>`).join("");
  const every=opts.labelEvery||Math.max(1,Math.ceil(data.length/12));
  const labelFor=(d,i)=>i%every===0?(d.label||dateLabelShort(d.date)):"";
  const tipLabel=(d)=>d.label||dateLabelLong(d.date);
  const tipItems=(d)=>seriesKeys.map(([key,color,name])=>({name:name||key,color,value:`${fmt(Math.abs(d[key]||0))} MMScf`}));

  let marks="";
  if(mode==="line"){
    const slot=pW/Math.max(data.length-1,1);
    const linePath=(key)=>data.map((d,i)=>{
      const v=Math.abs(d[key]||0),x=pX+i*slot,y=pT+pH-(v/max)*pH;
      return `${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const lines=seriesKeys.map(([key,color])=>`<path d="${linePath(key)}" fill="none" stroke="${color}" stroke-width="2.2"/>`).join("");
    const labels=data.map((d,i)=>{const l=labelFor(d,i);return l?`<text x="${(pX+i*slot).toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--muted)">${l}</text>`:"";}).join("");
    const hitW=Math.max(slot,4);
    const hits=buildChartHitCols(data,pX-hitW/2,hitW,pT,pH,tipLabel,tipItems);
    marks=`${lines}${labels}${hits}`;
  }else{
    const slot=pW/data.length,bW=Math.max(3,Math.min(11,(slot-10)/seriesKeys.length)),gap=2;
    const bars=data.map((d,i)=>{
      const baseX=pX+i*slot+(slot-(bW*seriesKeys.length+gap*(seriesKeys.length-1)))/2;
      const label=labelFor(d,i);
      const rs=seriesKeys.map(([key,color],ki)=>{
        const v=Math.abs(d[key]||0),h=(v/max)*pH,x=baseX+ki*(bW+gap),y=pT+pH-h;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bW.toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"></rect>`;
      }).join("");
      return `${rs}${label?`<text x="${(baseX+(bW*seriesKeys.length)/2).toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="10" fill="var(--muted)">${label}</text>`:""}`;
    }).join("");
    const hits=buildChartHitCols(data,pX,pW/data.length,pT,pH,tipLabel,tipItems);
    marks=`${bars}${hits}`;
  }
  return `<div class="flow-chart-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}${marks}</svg></div>`;
}

// ─── Deterministic synthetic yearly series (for years outside the seeded 2026 demo dataset) ─
function seededRandom(seed){
  let s=seed>>>0;
  return function(){
    s=(s+0x6D2B79F5)>>>0;
    let t=s;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function synthDailySeriesForYear(year){
  const y=parseInt(year,10);
  const rand=seededRandom(y*1000+7);
  const days=(Date.UTC(y,11,31)-Date.UTC(y,0,1))/86400000+1;
  const base=760+rand()*220;
  const growth=1+(y-2010)*0.014;
  const series=[];
  for(let i=0;i<days;i++){
    const iso=new Date(Date.UTC(y,0,1)+i*86400000).toISOString().slice(0,10);
    const season=1+0.12*Math.sin((i/days)*Math.PI*2);
    const noise=0.9+rand()*0.2;
    const injection=Math.round(base*growth*season*noise*10)/10;
    const shrinkage=Math.round(injection*(0.012+rand()*0.01)*10)/10;
    const mlfLoss=Math.round(injection*(0.01+rand()*0.008)*10)/10;
    const imbalance=Math.round(injection*(rand()*0.06-0.03)*10)/10;
    const effectiveAttribution=Math.round((injection-shrinkage-mlfLoss-imbalance)*10)/10;
    series.push({date:iso,injection,effectiveAttribution,shrinkage,mlfLoss,imbalance});
  }
  return series;
}

function synthKpisFromSeries(series){
  const sum=f=>series.reduce((s,d)=>s+(d[f]||0),0);
  return {
    totalInjection:sum("injection"),
    effectiveAttribution:sum("effectiveAttribution"),
    totalShrinkage:sum("shrinkage"),
    totalMlfLoss:sum("mlfLoss"),
    totalImbalance:Math.abs(sum("imbalance")),
    exceptions:0,
    errors:0,
  };
}

function aggregateSeriesMonthly(series){
  const buckets={};
  for(const d of series){
    const key=d.date.slice(0,7);
    if(!buckets[key])buckets[key]={date:`${key}-01`,label:new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined,{month:"short",year:"2-digit"}),injection:0,effectiveAttribution:0,shrinkage:0,mlfLoss:0,imbalance:0};
    buckets[key].injection+=d.injection||0;
    buckets[key].effectiveAttribution+=d.effectiveAttribution||0;
    buckets[key].shrinkage+=d.shrinkage||0;
    buckets[key].mlfLoss+=d.mlfLoss||0;
    buckets[key].imbalance+=d.imbalance||0;
  }
  return Object.keys(buckets).sort().map(k=>buckets[k]);
}

function kpiCard(title,value,sub,featured=false,icon="activity",navTarget=null){
  const clk=navTarget?`kpi-clickable" data-view-target="${navTarget}`:'"';
  return `<article class="kpi ${featured?"featured ":""}${clk}><div class="kpi-head"><small>${title}</small><span class="round-link"><i data-lucide="${icon}"></i></span></div><strong>${value}</strong><span>${sub}</span></article>`;
}

function flowChart(series){
  const data=(series||state.report?.dailySeries||[]).slice(-30);
  if(!data.length)return`<div class="empty">No flow data.</div>`;
  const W=720,H=220,pX=36,pT=12,pB=28,pW=W-pX*2,pH=H-pT-pB;
  const max=Math.max(...data.map(d=>Math.max(d.injection,d.attribution)),1);
  const slot=pW/data.length,bW=Math.max(4,Math.min(18,slot*0.34)),gap=2,every=Math.ceil(data.length/8);
  const bars=data.map((d,i)=>{
    const x=pX+i*slot+(slot-(bW*2+gap))/2;
    const iH=(d.injection/max)*pH,aH=(d.attribution/max)*pH;
    let s=`<rect x="${x.toFixed(1)}" y="${(pT+pH-iH).toFixed(1)}" width="${bW.toFixed(1)}" height="${iH.toFixed(1)}" rx="2" fill="var(--green-dark)"></rect>`;
    s+=`<rect x="${(x+bW+gap).toFixed(1)}" y="${(pT+pH-aH).toFixed(1)}" width="${bW.toFixed(1)}" height="${aH.toFixed(1)}" rx="2" fill="#7fc9a3"></rect>`;
    if(i%every===0){const day=new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"});
      s+=`<text x="${(x+bW).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${day}</text>`;}
    return s;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
}

function trendGranularityLabel(trend){
  const g=trend?.granularity||"day";
  return g==="day"?"Daily":g==="week"?"Weekly":"Monthly";
}

function complianceGauge(score){
  const p=Math.min(100,Math.max(0,score));
  const color=p>=90?"#1d8b56":p>=70?"#d99b20":"#cf3e3e";
  return `<div class="compliance-gauge"><svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e5ebe6" stroke-width="14" stroke-linecap="round"/>
    <path d="M10 65 A 50 50 0 0 1 110 65" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${p*1.571} 157.1"/>
    <text x="60" y="62" text-anchor="middle" font-size="20" font-weight="800" fill="${color}">${p.toFixed(0)}%</text>
  </svg><span class="gauge-label">Compliance Score</span></div>`;
}

function waterfallChart(breakdown){
  if(!breakdown||!breakdown.totalInjection)return`<div class="empty">No transportation data.</div>`;
  const segs=[
    {label:"Effective Attribution",value:Math.max(breakdown.effectiveAttribution,0),color:"#137544"},
    {label:"Shrinkage",value:Math.max(breakdown.shrinkage,0),color:"#d99b20"},
    {label:"MLF Loss",value:Math.max(breakdown.mlfLoss,0),color:"#7fc9a3"},
    {label:"Imbalance / Unaccounted",value:Math.max(breakdown.imbalance,0),color:"#cf3e3e"},
  ].filter(s=>s.value>0.001);
  const total=breakdown.totalInjection;
  const W=720,H=90,pX=8,pW=W-pX*2;
  let x=pX,bars="";
  segs.forEach(s=>{
    const w=(s.value/total)*pW;
    bars+=`<rect x="${x.toFixed(1)}" y="20" width="${Math.max(w,0.5).toFixed(1)}" height="36" fill="${s.color}"></rect>`;
    x+=w;
  });
  const legend=segs.map(s=>`<span class="donut-legend-item"><span class="dot" style="background:${s.color}"></span>${s.label}: ${fmt(s.value)} MMScf (${((s.value/total)*100).toFixed(1)}%)</span>`).join("");
  return `<div class="waterfall-wrap">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <text x="${pX}" y="14" font-size="11" fill="var(--muted)">Total Injection: ${fmt(total)} MMScf</text>
      <rect x="${pX}" y="20" width="${pW}" height="36" rx="3" fill="none" stroke="#e5ebe6"></rect>
      ${bars}
    </svg>
    <div class="donut-legend" style="margin-top:8px">${legend}</div>
  </div>`;
}

function donutChart(slices){
  const total=slices.reduce((s,d)=>s+d.value,0);
  if(!slices.length||!total)return`<div class="empty">No exceptions.</div>`;
  const colors=["#cf3e3e","#d99b20","#137544","#7fc9a3","#063f27"];
  let offset=0,svgParts="";
  slices.forEach((d,i)=>{
    const share=d.value/total,angle=share*360,r=40,cx=60,cy=60;
    const sR=(offset-90)*Math.PI/180,eR=(offset-90+angle)*Math.PI/180;
    const x1=cx+r*Math.cos(sR),y1=cy+r*Math.sin(sR),x2=cx+r*Math.cos(eR),y2=cy+r*Math.sin(eR);
    svgParts+=`<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${angle>180?1:0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${colors[i%colors.length]}"/>`;
    offset+=angle;
  });
  const legend=slices.map((d,i)=>`<span class="donut-legend-item"><span class="dot" style="background:${colors[i%colors.length]}"></span>${d.label}: ${d.value}</span>`).join("");
  return `<div class="donut-wrap"><svg viewBox="0 0 120 120">${svgParts}<circle cx="60" cy="60" r="24" fill="white"/></svg><div class="donut-legend">${legend}</div></div>`;
}

// ─── Page-specific filter bars ─────────────────────────────────────────────────
function reportsFilterBar(){
  const shippers=state.report?.shipperSummary||[];
  const suppliers=state.report?.supplierSummary||[];
  const offtakers=state.report?.offtakerSummary||state.report?.customerSummary||[];
  return `<div class="page-filter-bar inline-filters">
    <label>Shipper<select id="pf-shipper">
      <option value="">All shippers</option>
      ${shippers.map(s=>`<option value="${s.shipperId}" ${_activeFilters.shipper===s.shipperId?"selected":""}>${s.shipper}</option>`).join("")}
    </select></label>
    <label>Gas Supplier / GASCO<select id="pf-supplier">
      <option value="">All suppliers</option>
      ${suppliers.map(s=>`<option value="${s.supplierId}" ${_activeFilters.supplier===s.supplierId?"selected":""}>${s.supplier}</option>`).join("")}
    </select></label>
    <label>Offtaker<select id="pf-customer">
      <option value="">All offtakers</option>
      ${offtakers.map(c=>`<option value="${c.offtakerId||c.customerId}" ${_activeFilters.customer===(c.offtakerId||c.customerId)?"selected":""}>${c.offtaker||c.customer}</option>`).join("")}
    </select></label>
    <button class="primary-btn" style="min-height:38px;font-size:13px;padding:0 16px" data-filter-apply="reports">Apply</button>
    <button class="outline-btn" style="min-height:38px;font-size:13px;padding:0 14px" data-filter-reset="1">Reset</button>
  </div>`;
}

const INCIDENT_CATEGORIES=[["threshold","Threshold Breaches"],["missing","Missing Submissions"],["volume","Volume Omissions"],["masterdata","Master Data Issues"],["rollup","Roll-up Mismatches"],["quality","Off-Spec Gas Quality"],["nomination","Nomination Variance"]];

function incidentsFilterRow(counts){
  const cur=state.subView||"threshold";
  const sev=state.incidentSeverityFilter||"";
  return `<div class="incidents-filter-row">
    ${dateFilterDropdown()}
    <select id="pf-category" class="filter-select-pill">
      ${INCIDENT_CATEGORIES.map(([key,label])=>`<option value="${key}" ${cur===key?"selected":""}>${label}${counts[key]?` (${counts[key]})`:""}</option>`).join("")}
    </select>
    <select id="pf-severity" class="filter-select-pill">
      <option value="" ${sev===""?"selected":""}>All severities</option>
      <option value="WARNING" ${sev==="WARNING"?"selected":""}>Warning</option>
      <option value="ERROR" ${sev==="ERROR"?"selected":""}>Critical</option>
    </select>
    <button type="button" class="filter-reset-link" id="incidentsFilterReset">Reset</button>
  </div>`;
}

function customersFilterBar(){
  const sectors=state.bootstrap?.sectors||[];
  const customers=state.report?.offtakerSummary||state.report?.customerSummary||[];
  return `<div class="page-filter-bar inline-filters">
    <label>Offtaker<select id="pf-customer">
      <option value="">All offtakers</option>
      ${customers.map(c=>`<option value="${c.offtakerId||c.customerId}" ${_activeFilters.customer===(c.offtakerId||c.customerId)?"selected":""}>${c.offtaker||c.customer}</option>`).join("")}
    </select></label>
    <label>Sector<select id="pf-sector">
      <option value="">All sectors</option>
      ${sectors.map(s=>`<option value="${s.id}" ${_activeFilters.sector===s.id?"selected":""}>${s.code} – ${s.name}</option>`).join("")}
    </select></label>
    <button class="primary-btn" style="min-height:38px;font-size:13px;padding:0 16px" data-filter-apply="customers">Apply</button>
    <button class="outline-btn" style="min-height:38px;font-size:13px;padding:0 14px" data-filter-reset="1">Reset</button>
  </div>`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function dashboardBodyHTML(dailySeries,k,subs,accepted){
  const mlfPct=k.totalInjection?((k.totalMlfLoss/k.totalInjection)*100):0;
  return `
    <section class="kpi-grid-6">
      ${metricCard("Total Injection",fmt(k.totalInjection),"MMScf","arrow-up-right","transportation",dailySeries)}
      ${metricCard("Effective Attribution",fmt(k.effectiveAttribution),"MMScf","activity","transportation",dailySeries)}
      ${metricCard("Shrinkage",fmt(k.totalShrinkage),"MMScf","sliders-horizontal","transportation",dailySeries)}
      ${metricCard("Imbalance",fmt(k.totalImbalance),"MMScf","scale","exceptions",dailySeries)}
      ${metricCard("MLF",`${fmt(mlfPct)}%`,"% loss","percent","transportation",dailySeries)}
      ${metricCard("Potential Incidents",fmt(k.exceptions),`${k.errors} critical`,"triangle-alert","exceptions",dailySeries)}
    </section>
    <section class="card chart-card dashboard-wide-card">
      <div class="card-title"><h2>Flow Trend</h2><span>Daily injection vs. effective attribution vs. shrinkage — hover any bar for details</span>
        <div class="chart-mode-toggle">
          <button class="chart-mode-btn ${(state.flowChartMode||"bar")==="bar"?"active":""}" data-flow-mode="bar">Bar</button>
          <button class="chart-mode-btn ${state.flowChartMode==="line"?"active":""}" data-flow-mode="line">Line</button>
        </div>
      </div>
      ${performanceChart(dailySeries)}
      <div class="chart-legend">
        <span><span class="legend-dot" style="background:var(--green-dark)"></span>Injection</span>
        <span><span class="legend-dot" style="background:#58b96b"></span>Effective attribution</span>
        <span><span class="legend-dot" style="background:#bedaaa"></span>Shrinkage</span>
        <span><span class="legend-dot" style="background:#f0b33b"></span>MLF loss</span>
        <span><span class="legend-dot" style="background:#cf3e3e"></span>Imbalance</span>
      </div>
    </section>
    <section class="dashboard-two-col">
      ${supplierDeliveryCard()}
      ${sectorUtilizationCard()}
    </section>
    <section class="dashboard-two-col">
      ${criticalExceptionsCard()}
      ${submissionComplianceCard(subs,accepted)}
    </section>
    <section class="dashboard-two-col">
      ${aiActionCards()}
      ${dgdrMiniCard()}
    </section>
    <section class="dashboard-two-col dashboard-continuation">
      ${injectionBreakdownCard()}
      ${offtakerDeliveryCard()}
      ${transporterPopulationStatusCard()}
      ${escalationTrackerCard()}
    </section>
    ${dashboardFooterStats(subs,accepted)}`;
}

function renderAdminDashboard(){
  const selectedYear=_activeFilters._year||"2026";
  const useSynthetic=selectedYear!=="2026";
  const dailySeries=useSynthetic?synthDailySeriesForYear(selectedYear):(state.report?.dailySeries||[]);
  const k=useSynthetic?synthKpisFromSeries(dailySeries):state.report.kpis;
  const subs=state.report.uploads;
  const accepted=subs.filter(s=>s.status==="ACCEPTED"||s.status==="ACCEPTED_WITH_WARNINGS").length;
  $("#pageContent").innerHTML=`
    ${pageHeader("Operations Dashboard","Daily submission overview, transport performance, demand tracking, imbalance monitoring, and regulatory exceptions.")}
    ${populationNotifyBanner()}
    ${timeFilterBar()}
    ${dashboardBodyHTML(dailySeries,k,subs,accepted)}`;
}

// ─── Scoped dashboard (transporter/shipper — same layout as admin, own data only) ──
async function renderScopedDashboard(reportFilters,title,desc,subsFilterFn){
  const prevReport=state.report;
  const scoped=await fetchReport(reportFilters);
  state.report=scoped;
  const dailySeries=scoped.dailySeries||[];
  const k=scoped.kpis;
  const subs=subsFilterFn?(scoped.uploads||[]).filter(subsFilterFn):(scoped.uploads||[]);
  const accepted=subs.filter(s=>s.status==="ACCEPTED"||s.status==="ACCEPTED_WITH_WARNINGS").length;
  $("#pageContent").innerHTML=`
    ${pageHeader(title,desc)}
    ${timeFilterBar()}
    ${dashboardBodyHTML(dailySeries,k,subs,accepted)}`;
  renderIcons();
  state.report=prevReport;
}

const METRIC_BAR_COLORS={
  "Total Injection":"#3fae6a",
  "Effective Attribution":"#2f6fed",
  "Shrinkage":"#cf3e3e",
  "Imbalance":"#3fae6a",
  "MLF":"#3fae6a",
  "Potential Incidents":"#cf3e3e",
};

function metricCard(title,value,sub,icon,navTarget,seriesOverride){
  const data=(seriesOverride||state.report?.dailySeries||[]).slice(-16);
  const field=title==="Total Injection"?"injection":title==="Effective Attribution"?"effectiveAttribution":title==="Shrinkage"?"shrinkage":title==="Imbalance"?"imbalance":"injection";
  const vals=data.map(d=>Math.abs(d[field]||0));
  const max=Math.max(...vals,1),last=vals[vals.length-1]||0;
  const pct=Math.max(8,Math.min(100,(last/max)*100));
  const barColor=METRIC_BAR_COLORS[title]||"var(--green)";
  return `<article class="metric-card" data-view-target="${navTarget}">
    <div class="metric-card-head"><small>${title}</small><i data-lucide="${icon}" style="color:${barColor}"></i></div>
    <strong>${value}</strong>
    <span>${sub}</span>
    <div class="metric-trend-track"><i style="width:${pct.toFixed(0)}%;background:${barColor}"></i></div>
  </article>`;
}

function performanceChart(seriesOverride){
  const full=(seriesOverride||state.report?.dailySeries||[]);
  const data=full.length>90?full.slice(-90):full;
  const keys=[
    ["injection","var(--green-dark)","Injection"],
    ["effectiveAttribution","#58b96b","Effective attribution"],
    ["shrinkage","#bedaaa","Shrinkage"],
    ["mlfLoss","#f0b33b","MLF loss"],
    ["imbalance","#cf3e3e","Imbalance"],
  ];
  return renderTrendChartSVG(data,keys,{mode:state.flowChartMode||"bar",W:920,H:260,pX:48,pT:16,pB:34});
}

function supplierDeliveryCard(){
  const rows=(state.report.gasSupplierSummary||state.report.supplierSummary||[]).slice(0,5);
  const shareRows=(state.report.gasSupplierSummary||state.report.supplierSummary||[]);
  return `<article class="card report-card">
    <div class="card-title"><h2>Supplier Delivery Performance</h2><span>DGDO / nomination lens — target vs. actual</span></div>
    <div class="split-chart-row">
      <div class="split-chart-col">
        ${barListChart(rows.map(r=>({label:r.gasSupplier||r.supplier,target:r.dgdoTarget||r.nominatedVolume||0,actual:r.dgdoActual||r.injection||0})))}
      </div>
      <div class="split-chart-col split-chart-col-narrow">
        ${donutChart(shareRows.map(r=>({label:r.gasSupplier||r.supplier,value:r.dgdoActual||r.injection||0})).filter(r=>r.value>0))}
        <button class="mini-btn" data-open-chart="supplier-share" style="margin-top:8px">View large pie chart</button>
      </div>
    </div>
    <button class="report-link" data-view-target="dgdr">View supplier delivery details <i data-lucide="arrow-right"></i></button>
  </article>`;
}

function barListChart(rows){
  if(!rows.length)return `<div class="empty">No supplier data.</div>`;
  const max=Math.max(...rows.map(r=>Math.max(r.target,r.actual)),1);
  return `<div class="bar-list bar-list-dual">${rows.map(r=>{
    const variance=r.target?((r.actual-r.target)/r.target)*100:0;
    return `<div class="bar-row-dual">
      <span class="bar-row-label">${esc(r.label)}</span>
      <div class="bar-row-track"><i class="bar-target" style="width:${Math.min((r.target/max)*100,100)}%"></i><i class="bar-actual" style="width:${Math.min((r.actual/max)*100,100)}%"></i></div>
      <strong class="bar-row-value">${variance>0?"+":""}${fmt(variance)}%</strong>
    </div>`;
  }).join("")}</div>
  <div class="chart-legend" style="margin-top:6px"><span><span class="legend-dot" style="background:#d8e6db"></span>Target</span><span><span class="legend-dot" style="background:var(--green-dark)"></span>Actual</span></div>`;
}

function sectorUtilizationCard(){
  const rows=state.report.utilization?.byStrategicSector||[];
  const total=rows.reduce((s,r)=>s+(r.effectiveAttribution||0),0);
  return `<article class="card report-card">
    <div class="card-title"><h2>Sector Utilisation</h2><span>Strategic sectors: GTP · GBI · GTC</span></div>
    <div class="split-chart-row">
      <div class="split-chart-col split-chart-col-narrow">
        ${donutChart(rows.map(r=>({label:r.sectorId,value:r.effectiveAttribution||0})).filter(r=>r.value>0))}
        <button class="mini-btn" data-open-chart="sector-utilization" style="margin-top:8px">View large pie chart</button>
      </div>
      <div class="split-chart-col">
        <div class="sector-share-list sector-share-list-clickable">${rows.map(r=>`<div class="clickable-row" data-sector-drill="${r.sectorId}" data-sector-kind="offtakers"><span><span class="dot sector-dot sector-${r.sectorId.toLowerCase()}"></span>${r.sectorId}</span><strong>${total?fmt((r.effectiveAttribution/total)*100):0}%</strong></div>`).join("")}</div>
      </div>
    </div>
    <button class="report-link" data-view-target="utilization">View utilisation details <i data-lucide="arrow-right"></i></button>
  </article>`;
}

function dgdrMiniCard(){
  const rows=state.report.dgdrDgdo?.bySector||[];
  const overall=state.report.dgdrDgdo?.overall||{};
  const body=rows.map(r=>dgdrMiniRow(r.sectorId,r.dgdrTarget,r.actual,r.variancePct)).join("")+
    dgdrMiniRow("Total",overall.dgdrTarget||0,overall.actual||0,overall.variancePct||0,true);
  return `<article class="card report-card">
    <div class="card-title"><h2>DGDR Performance</h2><span>Strategic sectors</span></div>
    <div class="table-wrap"><table class="mini-table"><thead><tr><th>Sector</th><th>Target</th><th>Actual</th><th>Performance</th></tr></thead><tbody>${body}</tbody></table></div>
    <button class="report-link" data-view-target="dgdr">View DGDR report <i data-lucide="arrow-right"></i></button>
  </article>`;
}

function dgdrMiniRow(label,target,actual,variance,isTotal=false){
  const perf=target?Math.max(0,(actual/target)*100):0;
  return `<tr class="${isTotal?"summary-row":""}"><td>${label}</td><td>${fmt(target)}</td><td>${fmt(actual)}</td><td><div class="progress-cell"><span class="progress-track"><span style="width:${Math.min(perf,100)}%"></span></span>${fmt(perf)}%</div></td></tr>`;
}

function injectionBreakdownCard(){
  return `<article class="card report-card">
    <div class="card-title"><h2>Injection Breakdown</h2><span>Where injected volume went</span></div>
    ${waterfallChart(state.report.transportationBreakdown)}
    <button class="report-link" data-view-target="transportation">View injection breakdown <i data-lucide="arrow-right"></i></button>
  </article>`;
}

function criticalExceptionsCard(){
  const all=state.report.exceptions||[];
  const pageSize=3;
  const maxPage=Math.max(0,Math.ceil(all.length/pageSize)-1);
  const curPage=Math.min(state.criticalIncidentsPage||0,maxPage);
  const rows=all.slice(curPage*pageSize,curPage*pageSize+pageSize);
  return `<article class="card report-card wide-card">
    <div class="card-title"><h2>Critical Potential Incidents</h2><span>${all.length} open flags</span></div>
    <div class="table-wrap"><table class="mini-table"><thead><tr><th>Entity</th><th>Issue</th><th>Severity</th><th>Action</th></tr></thead>
    <tbody>${rows.map(f=>`<tr class="clickable-row" data-open-incident="${f.id}"><td>${esc(f.shipper||f.supplier||f.offtaker||"Network")}</td><td>${esc(f.rule.replaceAll("_"," "))}</td><td><span class="severity ${f.severity.toLowerCase()}">${f.severity}</span></td><td><button class="chevron-btn" data-escalate-flag="${f.id}" title="Query"><i data-lucide="chevron-right"></i></button></td></tr>`).join("")||`<tr><td colspan="4"><div class="empty">No critical potential incidents.</div></td></tr>`}</tbody></table></div>
    <div class="card-footer-row">
      <button class="report-link" data-view-target="exceptions">View all potential incidents <i data-lucide="arrow-right"></i></button>
      ${all.length>pageSize?`<div class="mini-pagination">
        <button class="icon-btn" data-incidents-page="prev" ${curPage===0?"disabled":""}><i data-lucide="chevron-left"></i></button>
        <button class="icon-btn" data-incidents-page="next" ${curPage>=maxPage?"disabled":""}><i data-lucide="chevron-right"></i></button>
      </div>`:""}
    </div>
  </article>`;
}

function submissionComplianceCard(subs,accepted){
  const rows=subs.slice(0,4);
  const pct=subs.length?Math.round((accepted/subs.length)*100):0;
  return `<article class="card report-card"><div class="card-title"><h2>Compliance Monitoring</h2><span>${pct}% accepted</span></div>
    <div class="compliance-list">${rows.map(s=>`<div class="compliance-list-row">
      <span class="compliance-list-name"><span class="dot" style="background:${s.status==="ACCEPTED"?"var(--green)":"var(--amber)"}"></span>${esc(s.shipper||s.supplier)} Submission</span>
      <span class="compliance-list-date">${s.submitted_at?new Date(s.submitted_at).toLocaleDateString(undefined,{year:"numeric",month:"2-digit",day:"2-digit"}).split("/").join("-"):"-"}</span>
    </div>`).join("")||`<div class="empty">No submissions.</div>`}</div>
    <button class="report-link" data-view-target="transportation">View all compliance <i data-lucide="arrow-right"></i></button></article>`;
}

function offtakerDeliveryCard(){
  const rows=(state.report.offtakerSummary||[]).slice(0,6);
  return `<article class="card report-card"><div class="card-title"><h2>Offtaker Consumption vs Linked Delivery</h2><span>Exit-side checks</span></div>
    <div class="table-wrap"><table class="mini-table"><thead><tr><th>Offtaker</th><th>Sector</th><th>Effective Offtake</th><th>Imbalance</th><th>Status</th></tr></thead>
    <tbody>${rows.map(r=>{const status=Math.abs(r.imbalance||0)>1?"Review":"Within";return`<tr><td>${esc(r.offtaker)}</td><td>${r.sector}</td><td>${fmt(r.effectiveAttribution)}</td><td>${fmt(r.imbalance)}</td><td><span class="status-chip ${status.toLowerCase()}">${status}</span></td></tr>`;}).join("")||`<tr><td colspan="5"><div class="empty">No offtaker data.</div></td></tr>`}</tbody></table></div>
    <button class="report-link" data-view-target="customers">View detailed offtake report <i data-lucide="arrow-right"></i></button></article>`;
}

function populationNotifyBanner(){
  if(state.bannerDismissed)return "";
  const redRows=(state.populationStatus||[]).filter(r=>r.status==="RED");
  if(!redRows.length)return "";
  return `<div class="population-notify-banner dashboard-banner">
    <div class="banner-left"><i data-lucide="bell-ring"></i><span>${redRows.length} transporter${redRows.length>1?"s have":" has"} not submitted today's data — ${redRows.map(r=>esc(r.transporter)).join(", ")}.</span></div>
    <button class="banner-dismiss" data-dismiss-banner="1" title="Dismiss"><i data-lucide="x"></i></button>
  </div>`;
}

function renderNotifBell(){
  const btn=$("#notifBell"),dd=$("#notifDropdown");
  if(!btn||!dd)return;
  const redRows=(state.populationStatus||[]).filter(r=>r.status==="RED");
  const existingBadge=btn.querySelector(".notif-badge");
  if(existingBadge)existingBadge.remove();
  if(redRows.length){
    const badge=document.createElement("span");
    badge.className="notif-badge";
    badge.textContent=redRows.length>9?"9+":String(redRows.length);
    btn.appendChild(badge);
  }
  dd.innerHTML=`<h4>Missing daily submissions</h4>${redRows.length?redRows.map(r=>`<div class="notif-dropdown-row"><span class="population-dot red"></span>${esc(r.transporter)} has not submitted today</div>`).join(""):`<div class="notif-dropdown-empty">All transporters have submitted today.</div>`}`;
  dd.style.display=state.notifOpen?"block":"none";
  renderIcons();
}

function transporterPopulationStatusCard(){
  const rows=state.populationStatus||[];
  const anyRed=rows.some(r=>r.status==="RED");
  return `<article class="card report-card"><div class="card-title"><h2>Transporter Daily Population Status</h2><span>${rows[0]?.date||""}</span></div>
    ${anyRed?`<div class="population-notify-banner"><i data-lucide="bell-ring"></i> One or more transporters have not populated today's data.</div>`:""}
    <div class="population-status-list">${rows.map(r=>`<div class="population-status-row"><span class="population-dot ${r.status.toLowerCase()}"></span><span>${esc(r.transporter)}</span><small>${r.populated?"Populated":"Not populated"}</small></div>`).join("")||`<div class="empty">No transporter data.</div>`}</div>
  </article>`;
}

function escalationTrackerCard(){
  const rows=(state.escalations||[]).slice(0,5);
  return `<article class="card report-card"><div class="card-title"><h2>Escalation Tracker</h2><button class="mini-btn" data-view-target="escalations">View all</button></div>
    <div class="table-wrap"><table class="mini-table"><thead><tr><th>ID</th><th>Entity</th><th>Issue</th><th>Level</th><th>Status</th></tr></thead>
    <tbody>${rows.map(c=>`<tr><td>${c.id}</td><td>${esc(c.shipper||c.supplier||"Network")}</td><td>${esc(c.rule.replaceAll("_"," "))}</td><td>${c.stageLabel||c.stage}</td><td><span class="status-chip review">${c.status}</span></td></tr>`).join("")||`<tr><td colspan="5"><div class="empty">No escalations opened yet.</div></td></tr>`}</tbody></table></div></article>`;
}

function aiActionCards(){
  const rows=(state.report.aiInsights||[]).filter(item=>!state.dismissedInsights.has(item.id));
  const top=rows[0];
  const summary=top?String(top.summary||""):"";
  return `<article class="card report-card"><div class="card-title"><h2>AI Insights</h2><button class="mini-btn" data-view-target="ai">View all</button></div>
    ${top?`<div class="ai-highlight-card">
      <span class="ai-highlight-icon"><i data-lucide="brain"></i></span>
      <div>
        <strong>${esc(top.title)}</strong>
        <p>${esc(summary.slice(0,160))}${summary.length>160?"…":""}</p>
        <div class="ai-highlight-actions">
          <button class="mini-btn" data-insight="${top.id}">Action Required</button>
          <button class="outline-btn" style="min-height:32px;font-size:12.5px;padding:0 14px" data-dismiss-insight="${top.id}">Dismiss</button>
        </div>
      </div>
    </div>`:`<div class="empty">No AI remarks.</div>`}
  </article>`;
}

function dashboardFooterStats(subs,accepted){
  const completeness=subs.length?Math.round((accepted/subs.length)*1000)/10:0;
  return `<section class="dashboard-footer-stats card">
    <div><i data-lucide="refresh-cw"></i><span>Last updated</span><strong>${new Date().toLocaleString()}</strong></div>
    <div><i data-lucide="pie-chart"></i><span>Data completeness</span><strong>${fmt(completeness)}%</strong></div>
    <div class="clickable-row" data-view-target="exceptions"><i data-lucide="triangle-alert"></i><span>Open potential incidents</span><strong>${state.report.kpis.exceptions}</strong></div>
    <div><i data-lucide="download"></i><span>Exports available</span><strong>8</strong></div>
  </section>`;
}

function transporterRanking(){
  const tMap={};
  for(const s of state.report.uploads){
    if(!tMap[s.transporter_id])tMap[s.transporter_id]={name:s.transporter,total:0,ok:0};
    tMap[s.transporter_id].total++;
    if(s.status==="ACCEPTED"||s.status==="ACCEPTED_WITH_WARNINGS")tMap[s.transporter_id].ok++;
  }
  const rows=Object.entries(tMap).map(([id,d])=>({id,...d,score:d.total?Math.round((d.ok/d.total)*100):0})).sort((a,b)=>b.score-a.score);
  if(!rows.length)return`<div class="empty">No submission data.</div>`;
  return `<div class="ranking-list">${rows.map((r,i)=>`
    <div class="ranking-row"><span class="rank-num">${i+1}</span>
      <div class="rank-info"><strong>${r.name||r.id}</strong>
        <div class="rank-bar-wrap"><div class="rank-bar" style="width:${r.score}%;background:${r.score>=90?"var(--green)":r.score>=70?"var(--amber)":"var(--red)"}"></div></div>
      </div>
      <span class="rank-score ${r.score>=90?"score-good":r.score>=70?"score-warn":"score-bad"}">${r.score}%</span>
    </div>`).join("")}</div>`;
}

// ─── DGDR / DGDO Performance ────────────────────────────────────────────────────
async function renderDgdrPage(){
  const d=state.report.dgdrDgdo||{overall:{},bySector:[],bySupplier:[],periodDays:0};
  const shipperRows=state.report.shipperSummary||[];
  const perfPct=(target,actual)=>target?Math.max(0,(actual/target)*100):0;
  const performanceCard=(title,subtitle,target,actual,variance)=>{
    const pct=perfPct(target,actual);
    return `<article class="card metric-card compact-performance-card">
      <div class="metric-icon"><i data-lucide="${title==="Overall"?"gauge":"activity"}"></i></div>
      <h3>${esc(title)}</h3>
      <span>${esc(subtitle)}</span>
      <strong>${fmt(pct)}%</strong>
      <div class="progress-cell"><span class="progress-track"><span style="width:${Math.min(pct,100)}%"></span></span></div>
      <small>${fmt(actual)} / ${fmt(target)} MMScF · ${variance>0?"+":""}${fmt(variance)}%</small>
    </article>`;
  };
  const sectorCard=(s)=>{
    const remaining=Math.max(s.dgdrTarget-s.actual,0);
    const over=Math.max(s.actual-s.dgdrTarget,0);
    const slices=over>0
      ?[{label:"Delivered (at target)",value:s.dgdrTarget},{label:"Delivered above target",value:over}]
      :[{label:"Delivered",value:s.actual},{label:"Shortfall vs. DGDR",value:remaining}];
    return `<article class="card">
      <div class="card-title"><h2>${esc(s.sector)}</h2><span>${s.sectorId}</span></div>
      ${donutChart(slices.filter(x=>x.value>0))}
      <div class="health-grid" style="margin-top:10px">
        <div class="health-stat"><strong>${fmt(s.dgdrTarget)}</strong><span>DGDR Target (MMScf)</span></div>
        <div class="health-stat"><strong>${fmt(s.actual)}</strong><span>Actual Delivered</span></div>
        <div class="health-stat ${s.variancePct<0?"health-warn":""}"><strong>${s.variancePct>0?"+":""}${fmt(s.variancePct)}%</strong><span>Variance</span></div>
      </div>
    </article>`;
  };
  const supplierPie=(s)=>{
    const remaining=Math.max(s.dgdoTarget-s.actual,0);
    const over=Math.max(s.actual-s.dgdoTarget,0);
    const slices=over>0
      ?[{label:"Delivered (at target)",value:s.dgdoTarget},{label:"Delivered above target",value:over}]
      :[{label:"Delivered",value:s.actual},{label:"Shortfall vs. DGDO",value:remaining}];
    return `<article class="card">
      <div class="card-title"><h2>${esc(s.supplier)}</h2></div>
      ${donutChart(slices.filter(x=>x.value>0))}
      <div class="health-grid" style="margin-top:10px">
        <div class="health-stat"><strong>${fmt(s.dgdoTarget)}</strong><span>DGDO Target (MMScf)</span></div>
        <div class="health-stat"><strong>${fmt(s.actual)}</strong><span>Actual Injection</span></div>
        <div class="health-stat ${s.variancePct<0?"health-warn":""}"><strong>${s.variancePct>0?"+":""}${fmt(s.variancePct)}%</strong><span>Variance</span></div>
      </div>
    </article>`;
  };
  const supplierRows=d.bySupplier||[];
  const supplierTable=`<article class="card registry-card">
    <div class="card-title"><h2>Supplier / GASCO Delivery Performance</h2><span>${supplierRows.length} suppliers</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Gas Supplier / GASCO</th><th>DGDO Target</th><th>Actual Injection</th><th>Shortfall / Variance</th><th>Status</th><th></th></tr></thead>
      <tbody>${supplierRows.map(s=>{
        const shortfall=Math.abs(s.variancePct||0);
        const status=s.variancePct>3?"Over":s.variancePct<-3?"Under":"Within";
        return `<tr><td>${esc(s.supplier)}</td><td>${fmt(s.dgdoTarget)}</td><td>${fmt(s.actual)}</td><td>${fmt(shortfall)}%</td><td><span class="status-chip ${status.toLowerCase()}">${status}</span></td><td><button class="drill-link" data-drill-supplier="${s.supplierId}">Detail →</button></td></tr>`;
      }).join("")||`<tr><td colspan="6"><div class="empty">No supplier data for the active filters.</div></td></tr>`}</tbody>
    </table></div>
  </article>`;

  // ─── Supplier Delivery Performance: share of nominated volume + drill-down ───
  const totalNominated=shipperRows.reduce((s,r)=>s+(r.nominatedVolume||0),0);
  let drillPanel="";
  if(state.dgdrSupplierDrill){
    const drillRow=shipperRows.find(r=>r.linkedSupplierId===state.dgdrSupplierDrill);
    const drillReport=await fetchReport({supplier:state.dgdrSupplierDrill});
    const custRows=(drillReport.offtakerSummary||drillReport.customerSummary||[]);
    drillPanel=`<article class="card registry-card supplier-delivery-drill">
      <div class="card-title"><h2>${esc(drillRow?.shipper||state.dgdrSupplierDrill)} — Delivery to Customers</h2>
        <button class="icon-btn" data-close-supplier-drill="1"><i data-lucide="x"></i></button></div>
      <div class="health-grid" style="margin-top:4px;margin-bottom:16px">
        <div class="health-stat"><strong>${fmt(drillRow?.nominatedVolume||0)}</strong><span>Nomination (MMScf)</span></div>
        <div class="health-stat"><strong>${fmt(drillRow?.injection||0)}</strong><span>Injection (MMScf)</span></div>
        <div class="health-stat"><strong>${fmt(drillRow?.effectiveOfftake||0)}</strong><span>Effective Offtake / Attribution</span></div>
        <div class="health-stat ${drillRow?.variancePct<0?"health-warn":""}"><strong>${drillRow?.variancePct>0?"+":""}${fmt(drillRow?.variancePct||0)}%</strong><span>Nomination Variance</span></div>
      </div>
      <p style="color:var(--muted);font-size:12.5px;margin:0 0 12px">Nomination and injection are recorded at supplier/shipper level per NGTNC balancing rules; the table below shows how this supplier's attribution (delivered volume) split across its offtakers for the selected period.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Offtaker</th><th>Sector</th><th>Attribution (MMScf)</th><th>Share of Supplier Attribution</th><th></th></tr></thead>
        <tbody>${custRows.map(r=>{
          const totalAttr=custRows.reduce((s,x)=>s+(x.attribution||0),0);
          const share=totalAttr?((r.attribution||0)/totalAttr)*100:0;
          return `<tr><td>${esc(r.offtaker||r.customer)}</td><td><span class="sector-badge sector-${r.sector.toLowerCase()}">${r.sector}</span></td><td>${fmt(r.attribution)}</td><td>${fmt(share)}%</td><td><button class="drill-link" data-drill-customer="${r.offtakerId||r.customerId}">Detail →</button></td></tr>`;
        }).join("")||`<tr><td colspan="5"><div class="empty">No offtaker records for this supplier in the selected period.</div></td></tr>`}</tbody>
      </table></div>
    </article>`;
  }
  const nominationShareSection=`<article class="card supplier-delivery-hero">
    <div class="card-title"><h2>Supplier Delivery Performance</h2><span>Share of nominated volume for the selected period — click a supplier to see how it delivered to its customers</span></div>
    <div class="split-chart-row">
      <div class="split-chart-col split-chart-col-narrow">
        ${donutChart(shipperRows.map(r=>({label:r.linkedSupplier||r.shipper,value:r.nominatedVolume||0,id:r.linkedSupplierId})).filter(r=>r.value>0))}
      </div>
      <div class="split-chart-col">
        <div class="sector-share-list sector-share-list-clickable supplier-share-list">${shipperRows.filter(r=>r.nominatedVolume>0).map(r=>`
          <div class="clickable-row" data-supplier-pie-drill="${r.linkedSupplierId}">
            <span><span class="dot" style="background:${colorForIndex(shipperRows.indexOf(r))}"></span>${esc(r.linkedSupplier||r.shipper)}</span>
            <strong>${totalNominated?fmt((r.nominatedVolume/totalNominated)*100):0}%</strong>
          </div>`).join("")||`<div class="empty">No nomination data for the active filters.</div>`}
        </div>
      </div>
    </div>
  </article>
  ${drillPanel}`;

  $("#pageContent").innerHTML=`
    ${pageHeader("DGDR / DGDO Performance","Daily Gas Delivery Requirement (by sector) and Daily Gas Delivery Obligation (by supplier), target vs. actual.")}
    ${timeFilterBar()}
    ${nominationShareSection}
    <section class="kpi-grid-4">
      ${performanceCard("Overall",`${d.periodDays} day period`,d.overall.dgdrTarget||0,d.overall.actual||0,d.overall.variancePct||0)}
      ${d.bySector.map(s=>performanceCard(s.sectorId,s.sector,s.dgdrTarget,s.actual,s.variancePct)).join("")}
    </section>
    <h3 class="section-subhead">DGDR by Strategic Sector</h3>
    <section class="kpi-grid-3">${d.bySector.map(sectorCard).join("")}</section>
    <h3 class="section-subhead">Supplier / GASCO List</h3>
    ${supplierTable}
    <h3 class="section-subhead">DGDO by Supplier — Target vs. Actual</h3>
    <section class="kpi-grid-3">${d.bySupplier.map(supplierPie).join("")||`<div class="empty">No supplier data for the active filters.</div>`}</section>`;
  renderIcons();
}

function colorForIndex(i){
  const palette=["#063f27","#188a52","#58b96b","#8fd39e","#d99b20","#2b4db5","#7857c9","#cf3e3e","#0f9aa8","#b5642b"];
  return palette[i%palette.length];
}

// ─── Nomination variance (folded into Potential Incidents) ─────────────────────
function renderNominationIncidentTab(){
  const cfg=state.bootstrap?.monitoringConfig||{nominationVariancePct:3};
  const exc=state.report.exceptions||[];
  const nomFlags=exc.filter(f=>f.rule==="NOMINATION_VARIANCE");
  return `<div class="card-title"><h2>Nomination Variance</h2><span>${nomFlags.length} potential incident(s)</span></div>
  <p style="color:var(--muted);margin:0 0 16px">Shippers whose linked supplier/GASCO delivery falls outside the agreed nomination band (±${cfg.nominationVariancePct}% of daily nomination) are flagged for query and possible escalation.</p>
  <div class="table-wrap"><table><thead><tr><th>Date</th><th>Shipper</th><th>Linked Supplier / GASCO</th><th>Message</th><th></th></tr></thead>
  <tbody>${nomFlags.map(f=>`<tr><td>${f.affected_date||""}</td><td>${esc(f.shipper||f.supplier||f.supplier_id||"")}</td><td>${esc(f.gasSupplier||f.supplier||"")}</td><td>${esc(f.message)}</td><td>${f.escalationId?`<span class="escalation-stage-badge stage-${f.escalationStage?.toLowerCase()}">${f.escalationStage}</span>`:`<button class="mini-btn escalate-btn" data-escalate-flag="${f.id}">Escalate</button>`}</td></tr>`).join("")||`<tr><td colspan="5"><div class="empty">No nomination breaches for the active filters.</div></td></tr>`}</tbody></table></div>`;
}

// ─── Utilization Performance ─────────────────────────────────────────────────
function renderUtilizationPage(){
  if(state.sectorDrill){renderSectorDrilldown();return;}
  const u=state.report.utilization||{bySector:[],byStrategicSector:[],byDistributionSector:[],strategicTotal:0};
  const dgdr=state.report.dgdrDgdo?.overall||{dgdrTarget:0,actual:0,variancePct:0};
  const mode=state.utilizationMode||"strategic";
  const activeRows=mode==="all"?u.bySector:u.byStrategicSector;
  const asSlices=rows=>rows.map(r=>({label:`${r.sectorId} — ${r.sector}`,value:r.effectiveAttribution})).filter(s=>s.value>0);
  const strategicTotal=u.byStrategicSector.reduce((s,r)=>s+(r.effectiveAttribution||0),0);
  const sectorIcons={GTP:"zap",GBI:"factory",GTC:"building-2"};
  $("#pageContent").innerHTML=`
    ${pageHeader("Utilization Performance","How delivered gas volumes are utilized across all sectors, the three strategic sectors, and against the DGDR target.")}
    ${timeFilterBar()}
    <section class="sector-figure-strip">${u.byStrategicSector.map(r=>`
      <div class="sector-figure-block sector-figure-${r.sectorId.toLowerCase()}" data-sector-drill="${r.sectorId}" data-sector-kind="offtakers">
        <div class="sector-figure-icon"><i data-lucide="${sectorIcons[r.sectorId]||"circle"}"></i></div>
        <div class="sector-figure-code">${r.sectorId}</div>
        <div class="sector-figure-value">${strategicTotal?fmt((r.effectiveAttribution/strategicTotal)*100):0}%</div>
        <div class="sector-figure-label">${esc(r.sector)} · ${fmt(r.effectiveAttribution)} MMScf</div>
      </div>`).join("")}
    </section>
    <div class="report-tabs">
      <button class="tab ${mode==="strategic"?"active":""}" data-util-mode="strategic">Strategic Sectors</button>
      <button class="tab ${mode==="all"?"active":""}" data-util-mode="all">All Sectors</button>
    </div>
    <section class="dashboard-main-row">
      <article class="card">
        <div class="card-title"><h2>${mode==="strategic"?"Strategic Sector Utilisation":"All-Sector Utilisation"}</h2><span>${mode==="strategic"?"GTP · GBI · GTC":"GTP · GBI · GTC · LGD · RGD"}</span></div>
        ${donutChart(asSlices(activeRows))}
      </article>
      <article class="card">
        <div class="card-title"><h2>DGDR Target Position</h2><span>Strategic sectors only</span></div>
        <div class="health-grid">
          <div class="health-stat"><strong>${fmt(u.strategicTotal)}</strong><span>Strategic Actual (MMScf)</span></div>
          <div class="health-stat"><strong>${fmt(dgdr.dgdrTarget)}</strong><span>DGDR Target (MMScf)</span></div>
          <div class="health-stat ${dgdr.variancePct<0?"health-warn":""}"><strong>${dgdr.variancePct>0?"+":""}${fmt(dgdr.variancePct)}%</strong><span>Performance vs. Target</span></div>
        </div>
      </article>
    </section>
    <h3 class="section-subhead">${mode==="strategic"?"Strategic Sector Detail":"All Sector Detail"}</h3>
    <section class="card">
      ${sectorTable(activeRows)}
    </section>`;
}

function sectorTable(rows){
  return `<div class="table-wrap"><table><thead><tr><th>Sector</th><th>Offtakers</th><th>Shippers</th><th>Attribution</th><th>Shrinkage</th><th>Effective Attribution</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><span class="sector-badge sector-${r.sectorId.toLowerCase()}">${r.sectorId}</span> ${esc(r.sector)}</td>
      <td><button class="drill-link" data-sector-drill="${r.sectorId}" data-sector-kind="offtakers">${r.customers}</button></td>
      <td><button class="drill-link" data-sector-drill="${r.sectorId}" data-sector-kind="shippers">${r.suppliers}</button></td>
      <td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.effectiveAttribution)}</td>
    </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No data.</div></td></tr>`}</tbody></table></div>`;
}

function renderSectorDrilldown(){
  const {sectorId, kind}=state.sectorDrill;
  const row=(state.report.utilization?.bySector||[]).find(r=>r.sectorId===sectorId);
  if(!row){state.sectorDrill=null;renderUtilizationPage();return;}
  const isOfftakers=kind==="offtakers";
  const rows=isOfftakers
    ? (state.report.offtakerSummary||[]).filter(r=>row.offtakerIds?.includes(r.offtakerId))
    : (state.report.shipperSummary||[]).filter(r=>row.shipperIds?.includes(r.shipperId));
  $("#pageContent").innerHTML=`
    ${pageHeader(`${row.sectorId} ${isOfftakers?"Offtakers":"Shippers"}`,`${row.sector} — related ${isOfftakers?"offtakers":"shippers"} for the active reporting window.`,backBtn("Back to Utilisation"))}
    <article class="card registry-card">
      <div class="card-title"><h2>${isOfftakers?"Offtakers":"Shippers"}</h2><span>${rows.length} records</span></div>
      <div class="table-wrap"><table>
        ${isOfftakers
          ? `<thead><tr><th>Offtaker</th><th>Sector</th><th>Exit Point</th><th>Effective Attribution</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.offtaker)}</td><td>${r.sector}</td><td>${esc(r.exitPoint)}</td><td>${fmt(r.effectiveAttribution)}</td><td><button class="drill-link" data-drill-customer="${r.offtakerId}">Detail →</button></td></tr>`).join("")}</tbody>`
          : `<thead><tr><th>Shipper</th><th>Linked Supplier / GASCO</th><th>Injection</th><th>Effective Offtake</th><th>Imbalance</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.shipper)}</td><td>${esc(r.linkedSupplier)}</td><td>${fmt(r.injection)}</td><td>${fmt(r.effectiveOfftake)}</td><td>${fmt(r.imbalance)}</td><td><button class="drill-link" data-drill-supplier="${r.linkedSupplierId}">Detail →</button></td></tr>`).join("")}</tbody>`}
      </table></div>
    </article>`;
  renderIcons();
}
function renderReportsPage(){
  if(state.drillSubmission){renderSubmissionGroupDetail();return;}
  if(state.drillSubmissionSub){renderSubmissionSupplierDaily();return;}
  const tab=state.subView||"transportation";
  const tabs=[
    ["transportation","Transportation"],
    ["utilization","Utilisation"],
    ["shippers","Shippers"],
    ["offtakers","Offtakers"],
    ["dgdr","DGDR"],
    ["dgdo","DGDO"],
    ["escalations","Escalations"],
    ["submissions","Submissions"],
  ];
  $("#pageContent").innerHTML=`
    ${pageHeader("Reports","Drill into transport performance, shippers, offtakers, DGDR, DGDO, and escalation records.",
      `<button class="outline-btn" id="exportTable"><i data-lucide="download"></i> Export CSV</button>`)}
    ${reportsFilterBar()}
    <div class="report-tabs">
      ${tabs.map(([key,label])=>`<button class="tab ${tab===key?"active":""}" data-sub-view="${key}">${label}</button>`).join("")}
    </div>
    <article class="card registry-card">${renderReportTab(tab)}</article>`;
}

function renderReportTab(tab){
  if(tab==="transportation")return renderTransportationReport();
  if(tab==="utilization")return renderUtilisationReport();
  if(tab==="shippers")return renderReportShippers();
  if(tab==="offtakers")return renderReportOfftakers();
  if(tab==="dgdr")return renderDgdrReportTable();
  if(tab==="dgdo")return renderDgdoReportTable();
  if(tab==="escalations")return renderEscalationReportTable();
  if(tab==="submissions")return renderReportSubmissions();
  return "";
}

function renderTransportationReport(){
  const rows=state.report.dailySeries||[];
  return `<div class="card-title"><h2>Transportation Performance</h2><span>${rows.length} gas days</span></div>
  ${performanceChart()}
  <div class="table-wrap" style="margin-top:16px"><table>
    <thead><tr><th>Date</th><th>Injection</th><th>Effective Attribution</th><th>Shrinkage</th><th>MLF Loss</th><th>Imbalance</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td>${r.date}</td><td>${fmt(r.injection)}</td><td>${fmt(r.effectiveAttribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.mlfLoss)}</td><td>${fmt(r.imbalance)}</td></tr>`).join("")||`<tr><td colspan="6"><div class="empty">No transportation data.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderUtilisationReport(){
  const u=state.report.utilization||{bySector:[],byStrategicSector:[]};
  const mode=state.utilizationMode||"strategic";
  const rows=mode==="all"?u.bySector:u.byStrategicSector;
  const slices=rows.map(r=>({label:`${r.sectorId} — ${r.sector}`,value:r.effectiveAttribution})).filter(r=>r.value>0);
  return `<div class="card-title"><h2>Sector Utilisation Report</h2><span>${mode==="strategic"?"Strategic sectors":"All sectors"}</span></div>
  <div class="report-tabs inline-tabs">
    <button class="tab ${mode==="strategic"?"active":""}" data-util-mode="strategic">Strategic Sectors</button>
    <button class="tab ${mode==="all"?"active":""}" data-util-mode="all">All Sectors</button>
  </div>
  <div class="report-chart-grid">
    <div>${donutChart(slices)}</div>
    <div>${sectorTable(rows)}</div>
  </div>`;
}

function renderReportShippers(){
  const rows=state.report.shipperSummary||[];
  return `<div class="card-title"><h2>Shipper Performance</h2><span>${rows.length} shippers</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Shipper</th><th>Linked Supplier / GASCO</th><th>Days</th><th>Nominated</th><th>Injection</th><th>Effective Offtake</th><th>Imbalance</th><th>Variance</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${esc(r.shipper)}</td><td>${esc(r.linkedSupplier)}</td><td>${r.days}</td><td>${fmt(r.nominatedVolume)}</td><td>${fmt(r.injection)}</td><td>${fmt(r.effectiveOfftake)}</td><td>${fmt(r.imbalance)}</td><td>${r.variancePct>0?"+":""}${fmt(r.variancePct)}%</td>
      <td><button class="drill-link" data-drill-supplier="${r.linkedSupplierId}">Daily records →</button></td>
    </tr>`).join("")||`<tr><td colspan="9"><div class="empty">No shipper data.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderReportOfftakers(){
  const rows=state.report.offtakerSummary||[];
  return `<div class="card-title"><h2>Offtaker Report</h2><span>${rows.length} offtakers</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Offtaker</th><th>Sector</th><th>Linked Shippers</th><th>Exit Point</th><th>Attribution</th><th>Shrinkage</th><th>Eff. Attribution</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><button class="drill-link" data-drill-customer="${r.offtakerId}">${esc(r.offtaker)}</button></td><td><span class="sector-badge sector-${r.sector.toLowerCase()}">${r.sector}</span></td><td>${r.shipperCount}</td><td>${esc(r.exitPoint)}</td><td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.effectiveAttribution)}</td>
      <td><button class="drill-link" data-drill-customer="${r.offtakerId}">Detail →</button></td>
    </tr>`).join("")||`<tr><td colspan="8"><div class="empty">No offtaker data.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderDgdrReportTable(){
  const rows=state.report.dgdrDgdo?.bySector||[];
  const perfCell=(target,actual)=>{const perf=target?Math.max(0,(actual/target)*100):0;return `<div class="progress-cell"><span class="progress-track"><span style="width:${Math.min(perf,100)}%"></span></span>${fmt(perf)}%</div>`;};
  return `<div class="card-title"><h2>DGDR Report</h2><span>GTP + GBI + GTC</span></div>
  <div class="table-wrap"><table><thead><tr><th>Sector</th><th>DGDR Target</th><th>Actual Utilisation</th><th>Variance</th><th>Performance</th></tr></thead>
  <tbody>${rows.map(r=>`<tr><td>${r.sectorId} — ${esc(r.sector)}</td><td>${fmt(r.dgdrTarget)}</td><td>${fmt(r.actual)}</td><td>${r.variancePct>0?"+":""}${fmt(r.variancePct)}%</td><td>${perfCell(r.dgdrTarget,r.actual)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderDgdoReportTable(){
  const rows=state.report.gasSupplierSummary||[];
  return `<div class="card-title"><h2>DGDO Report</h2><span>Supplier / GASCO delivery obligation</span></div>
  <div class="table-wrap"><table><thead><tr><th>Gas Supplier / GASCO</th><th>DGDO Target</th><th>Actual Injection</th><th>Shortfall / Variance</th><th>Status</th><th></th></tr></thead>
  <tbody>${rows.map(r=>`<tr><td>${esc(r.gasSupplier)}</td><td>${fmt(r.dgdoTarget)}</td><td>${fmt(r.dgdoActual)}</td><td>${fmt(Math.abs(r.dgdoVariancePct||0))}%</td><td><span class="status-chip ${r.dgdoVariancePct<-3?"under":r.dgdoVariancePct>3?"over":"within"}">${r.dgdoVariancePct<-3?"Under":r.dgdoVariancePct>3?"Over":"Within"}</span></td><td><button class="drill-link" data-drill-supplier="${r.supplierId}">Detail →</button></td></tr>`).join("")}</tbody></table></div>`;
}

function renderEscalationReportTable(){
  const rows=state.escalations||[];
  return `<div class="card-title"><h2>Escalation Report</h2><span>${rows.length} cases</span></div>
  <div class="table-wrap"><table><thead><tr><th>ID</th><th>Entity</th><th>Rule</th><th>Stage</th><th>Status</th><th>Updated</th></tr></thead>
  <tbody>${rows.map(c=>`<tr><td>${c.id}</td><td>${esc(c.shipper||c.supplier||c.customer||"Network")}</td><td>${esc(c.rule.replaceAll("_"," "))}</td><td>${c.stageLabel||c.stage}</td><td>${c.status}</td><td>${c.updated_at?new Date(c.updated_at).toLocaleDateString():"-"}</td></tr>`).join("")||`<tr><td colspan="6"><div class="empty">Open an escalation from Alerts & Exceptions to populate this report.</div></td></tr>`}</tbody></table></div>`;
}

function renderReportSubmissions(){
  const subs=state.report.uploads;
  const groups={};
  for(const s of subs){
    const key=`${s.transporter_id}|${s.period}`;
    if(!groups[key])groups[key]={transporterId:s.transporter_id,transporter:s.transporter,period:s.period,subs:[],totalRecords:0,warnings:0};
    groups[key].subs.push(s);
    groups[key].totalRecords+=s.validation_summary.acceptedRecords||0;
    groups[key].warnings+=s.validation_summary.warnings||0;
  }
  const rows=Object.values(groups);
  return `<div class="card-title"><h2>Submissions</h2><span>${rows.length} filings · ${subs.length} records</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Transporter</th><th>Period</th><th>Suppliers</th><th>Records</th><th>Flags</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(g=>{
      const ok=g.subs.every(s=>s.status==="ACCEPTED"||s.status==="ACCEPTED_WITH_WARNINGS");
      return `<tr><td>${g.transporter}</td><td>${g.period}</td><td>${g.subs.length}</td><td>${g.totalRecords}</td><td>${g.warnings}</td>
        <td><span class="status-pill ${ok?"status-ok":"status-warn"}">${ok?"ACCEPTED":"PARTIAL"}</span></td>
        <td><button class="drill-link" data-drill-sub-group="${g.transporterId}|${encodeURIComponent(g.period)}">View Details →</button></td>
      </tr>`;
    }).join("")||`<tr><td colspan="7"><div class="empty">No submissions.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderSubmissionGroupDetail(){
  const[tid,enc]=state.drillSubmission.split("|");
  const period=decodeURIComponent(enc);
  const subs=state.report.uploads.filter(s=>s.transporter_id===tid&&s.period===period);
  const tName=subs[0]?.transporter||tid;
  $("#pageContent").innerHTML=`
    ${pageHeader("Submission Detail",`${tName} — ${period}`,backBtn("Back to Reports"))}
    <article class="card registry-card">
      <div class="card-title"><h2>Suppliers Filed</h2><span>${subs.length} records</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Supplier</th><th>Period</th><th>Status</th><th>Records</th><th>Flags</th><th>Submitted</th><th></th></tr></thead>
        <tbody>${subs.map(s=>`<tr>
          <td>${s.supplier}</td><td>${s.period}</td>
          <td><span class="status-pill ${s.status.includes("WARNING")?"status-warn":s.status==="ACCEPTED"?"status-ok":"status-err"}">${fmtStatus(s.status)}</span></td>
          <td>${s.validation_summary.acceptedRecords}</td><td>${s.validation_summary.warnings}</td>
          <td>${s.submitted_at?new Date(s.submitted_at).toLocaleDateString():"—"}</td>
          <td><button class="drill-link" data-drill-sub-supplier="${s.id}|${s.supplier_id}">Daily Records →</button></td>
        </tr>`).join("")}</tbody>
      </table></div>
    </article>`;
  renderIcons();
}

async function renderSubmissionSupplierDaily(){
  const[submissionId,supplierId]=state.drillSubmissionSub.split("|");
  const sup=state.bootstrap.suppliers.find(s=>s.id===supplierId);
  const sub=state.report.uploads.find(s=>s.id===submissionId);
  const d=await fetchReport({supplier:supplierId});
  const fMap={};
  d.exceptions.forEach(f=>{if(!fMap[f.affected_date])fMap[f.affected_date]=[];fMap[f.affected_date].push(f.message);});
  $("#pageContent").innerHTML=`
    ${pageHeader("Daily Records",`${sup?.name||supplierId} — ${sub?.period||""}`,backBtn("Back to Submission"))}
    <article class="card registry-card">
      <div class="card-title"><h2>Daily Supplier Log</h2>
        <button class="ask-ai-entity-btn" data-entity-type="supplier" data-entity-id="${supplierId}" data-entity-name="${sup?.name||supplierId}"><i data-lucide="sparkles"></i> Ask AI</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Injection (MMScf)</th><th>Attribution (MMScf)</th><th>Shrinkage</th><th>AI Remark</th></tr></thead>
        <tbody>${d.dailySeries.map(row=>{
          const remarks=(fMap[row.date]||[]).join("; ")||"—";
          const hasFlag=!!(fMap[row.date]||[]).length;
          return `<tr class="${hasFlag?"exc-row":""}"><td>${row.date}</td><td>${fmt(row.injection)}</td><td>${fmt(row.attribution)}</td><td>${fmt(row.shrinkage)}</td><td class="remark-cell ${hasFlag?"flag-remark":""}">${remarks}</td></tr>`;
        }).join("")||`<tr><td colspan="5"><div class="empty">No records.</div></td></tr>`}</tbody>
      </table></div>
    </article>`;
  renderIcons();
}

function renderReportTransporters(){
  const tMap={};
  for(const s of state.report.uploads){
    if(!tMap[s.transporter_id])tMap[s.transporter_id]={id:s.transporter_id,name:s.transporter,subs:[],records:0,warnings:0};
    tMap[s.transporter_id].subs.push(s);
    tMap[s.transporter_id].records+=s.validation_summary.acceptedRecords||0;
    tMap[s.transporter_id].warnings+=s.validation_summary.warnings||0;
  }
  const rows=Object.values(tMap);
  return `<div class="card-title"><h2>By Transporter</h2><span>${rows.length} transporters</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Transporter</th><th>Submissions</th><th>Suppliers Filed</th><th>Records</th><th>Flags</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${r.name}</td><td>${r.subs.length}</td><td>${new Set(r.subs.map(s=>s.supplier_id)).size}</td>
      <td>${r.records}</td><td>${r.warnings}</td>
      <td><button class="drill-link" data-drill-transporter="${r.id}">Detail →</button></td>
    </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No data.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderReportSuppliers(){
  const rows=state.report.supplierSummary;
  return `<div class="card-title"><h2>By Supplier</h2><span>${rows.length} suppliers</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Supplier</th><th>Days</th><th>Injection</th><th>Attribution</th><th>Shrinkage</th><th>Imbalance</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><button class="drill-link" data-drill-supplier="${r.supplierId}">${r.supplier}</button></td>
      <td>${r.days}</td><td>${fmt(r.injection)}</td><td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.supplierImbalance)}</td>
      <td><button class="drill-link" data-drill-supplier="${r.supplierId}">Detail →</button></td>
    </tr>`).join("")||`<tr><td colspan="7"><div class="empty">No data.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderReportCustomers(){
  const rows=state.report.customerSummary;
  return `<div class="card-title"><h2>By Customer</h2><span>${rows.length} customers</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Customer</th><th>Sector</th><th>Attribution</th><th>Shrinkage</th><th>Eff. Attribution</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><button class="drill-link" data-drill-customer="${r.customerId}">${r.customer}</button></td>
      <td><span class="sector-badge sector-${r.sector.toLowerCase()}">${r.sector}</span></td>
      <td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.effectiveAttribution)}</td>
      <td><button class="drill-link" data-drill-customer="${r.customerId}">Detail →</button></td>
    </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No data.</div></td></tr>`}</tbody>
  </table></div>`;
}

// ─── Alerts & Potential Incidents ─────────────────────────────────────────────
function renderExceptionsPage(){
  const tab=state.subView||"threshold";
  const sevFilter=state.incidentSeverityFilter||"";
  const all=sevFilter?state.report.exceptions.filter(f=>f.severity===sevFilter):state.report.exceptions;
  const missing=state.bootstrap.transporters.filter(t=>!state.report.uploads.find(u=>u.transporter_id===t.id));
  const threshold=all.filter(f=>["PRESSURE_OUTSIDE_NEA","CONDENSATE_THRESHOLD","SHRINKAGE_THRESHOLD","MLF_LOSS_THRESHOLD"].includes(f.rule));
  const volume=all.filter(f=>f.rule==="MISSING_INJECTION");
  const masterData=all.filter(f=>["UNKNOWN_CUSTOMER","UNKNOWN_SUPPLIER","SUPPLIER_SHEET_NOT_FOUND"].includes(f.rule));
  const rollup=all.filter(f=>f.rule==="ATTRIBUTION_EXCEEDS_EFFECTIVE_INJECTION");
  const quality=all.filter(f=>f.rule==="OFF_SPEC_GAS");
  const nomination=all.filter(f=>f.rule==="NOMINATION_VARIANCE");
  const counts={threshold:threshold.length,missing:missing.length,volume:volume.length,masterdata:masterData.length,rollup:rollup.length,quality:quality.length,nomination:nomination.length};
  $("#pageContent").innerHTML=`
    ${pageHeader("Potential Incidents","Six-category potential-incident command centre, with AI consequence-management recommendations and regulatory citations.")}
    ${incidentsFilterRow(counts)}
    <article class="card registry-card">
      ${tab==="threshold"?renderExceptionList(threshold,"Threshold Breaches","Pressure, condensate, shrinkage, and MLF measurement-loss values outside configured bands."):""}
      ${tab==="missing"?renderMissingSubmissions(missing):""}
      ${tab==="volume"?renderExceptionList(volume,"Volume Omissions","Blank injection or attribution cells."):""}
      ${tab==="masterdata"?renderExceptionList(masterData,"Master Data Issues","Unrecognised suppliers, customers, or entry points."):""}
      ${tab==="rollup"?renderExceptionList(rollup,"Roll-up Mismatches","Total customer attribution exceeds effective injection."):""}
      ${tab==="quality"?renderExceptionList(quality,"Off-Spec Gas Quality","Gas quality/lab reports from suppliers that fall outside the agreed specification."):""}
      ${tab==="nomination"?renderNominationIncidentTab():""}
    </article>`;
}

function renderExceptionList(flags,title,desc){
  return `<div class="card-title"><h2>${title}</h2><span>${flags.length} potential incident(s)</span></div>
  <p style="color:var(--muted);margin:0 0 16px">${desc}</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Severity</th><th>Rule</th><th>Message</th><th>Date</th><th>Accountable Entity</th><th>Escalation</th></tr></thead>
    <tbody>${flags.map(f=>`<tr class="exc-row clickable-row ${f.severity.toLowerCase()}" data-open-incident="${f.id}">
      <td><span class="severity ${f.severity.toLowerCase()}">${f.severity}</span></td>
      <td>${f.rule.replaceAll("_"," ")}</td><td>${f.message}${f.recommendedAction?`<div class="ai-recommend-line"><i data-lucide="sparkles"></i> ${esc(f.recommendedAction)}</div>`:""}${f.regulatoryReference?`<div class="pia-ref-line"><i data-lucide="scale"></i> ${esc(f.regulatoryReference.act)}, ${esc(f.regulatoryReference.section)}; ${esc(f.regulatoryReference.code)}</div>`:""}</td>
      <td>${f.affected_date||"—"}</td><td>${f.shipper||f.supplier||f.offtaker||"—"}${f.gasSupplier?`<small class="cell-note">GASCO: ${esc(f.gasSupplier)}</small>`:""}</td>
      <td>${f.escalationId?`<span class="escalation-stage-badge stage-${f.escalationStage?.toLowerCase()}">${f.escalationStage}</span> <button class="mini-btn" data-view-target="escalations">View</button>`:`<button class="mini-btn escalate-btn" data-escalate-flag="${f.id}"><i data-lucide="triangle-alert"></i> Escalate</button>`}</td>
    </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No issues.</div></td></tr>`}</tbody>
  </table></div>`;
}

// ─── Escalations ──────────────────────────────────────────────────────────────
function escStatusClass(c){return c.status==="RESOLVED"||c.status==="CLOSED"?"within":"review";}

function escalationCompactCard(c){
  return `<article class="card escalation-card-compact" data-open-escalation="${c.id}">
    <div class="esc-card-top">
      <span class="severity ${c.severity.toLowerCase()}">${c.severity}</span>
      <span class="escalation-stage-badge stage-${c.stage.toLowerCase()}">${c.stageLabel}</span>
    </div>
    <h3>${esc(c.rule.replaceAll("_"," "))}</h3>
    <p class="esc-card-entity">${esc(c.shipper||c.supplier||c.supplier_id||"Network")} · ${c.affected_date||"—"}</p>
    <p class="esc-card-msg">${esc(c.message)}</p>
    <div class="esc-card-foot">
      <span class="status-chip ${escStatusClass(c)}">${c.status}</span>
      <span class="esc-card-view">View details <i data-lucide="arrow-right"></i></span>
    </div>
  </article>`;
}

function escalationListTable(cases){
  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Entity</th><th>Issue</th><th>Severity</th><th>Stage</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>${cases.map(c=>`<tr class="clickable-row" data-open-escalation="${c.id}">
      <td>${c.id}</td>
      <td>${esc(c.shipper||c.supplier||c.supplier_id||"Network")}</td>
      <td>${esc(c.rule.replaceAll("_"," "))}</td>
      <td><span class="severity ${c.severity.toLowerCase()}">${c.severity}</span></td>
      <td><span class="escalation-stage-badge stage-${c.stage.toLowerCase()}">${c.stageLabel}</span></td>
      <td><span class="status-chip ${escStatusClass(c)}">${c.status}</span></td>
      <td>${c.affected_date||"—"}</td>
      <td><button class="mini-btn" data-open-escalation="${c.id}">View</button></td>
    </tr>`).join("")||`<tr><td colspan="8"><div class="empty">No escalation cases.</div></td></tr>`}</tbody>
  </table></div>`;
}

async function renderEscalationsPage(){
  state.escalations=await fetchEscalations();
  const all=state.escalations;
  const cases=state.escalationStageFilter?all.filter(c=>c.stage===state.escalationStageFilter):all;
  const open=cases.filter(c=>c.status==="OPEN"||c.status==="IN_PROGRESS");
  const closed=cases.filter(c=>c.status==="RESOLVED"||c.status==="CLOSED");
  const stages=state.bootstrap.escalationStages||[];
  const viewMode=state.escalationViewMode||"card";

  $("#pageContent").innerHTML=`
    ${pageHeader("Escalations","AI-flagged exceptions routed through the Analyst → Manager → Director → DG → Ag. Chief Executive escalation path.")}
    <div class="escalation-toolbar">
      <div class="report-tabs" style="margin:0">
        <button class="tab ${!state.escalationStageFilter?"active":""}" data-esc-stage-filter="">All (${all.length})</button>
        ${stages.map(s=>`<button class="tab ${state.escalationStageFilter===s.id?"active":""}" data-esc-stage-filter="${s.id}">${s.label} (${all.filter(c=>c.stage===s.id).length})</button>`).join("")}
      </div>
      <div class="seg-toggle">
        <button class="seg-btn ${viewMode==="card"?"active":""}" data-esc-view-mode="card"><i data-lucide="layout-grid"></i> Card</button>
        <button class="seg-btn ${viewMode==="list"?"active":""}" data-esc-view-mode="list"><i data-lucide="list"></i> List</button>
      </div>
    </div>
    <h3 class="section-subhead">Open Cases</h3>
    ${open.length
      ?(viewMode==="card"?`<section class="escalation-grid">${open.map(escalationCompactCard).join("")}</section>`:escalationListTable(open))
      :`<div class="empty">No open escalation cases. Use the Escalate button on a flagged exception in Alerts & Exceptions to open one.</div>`}
    ${closed.length?`<h3 class="section-subhead">Resolved / Closed</h3>${viewMode==="card"?`<section class="escalation-grid">${closed.map(escalationCompactCard).join("")}</section>`:escalationListTable(closed)}`:""}`;
  renderIcons();
}

function openEscalationModal(caseId){
  const c=(state.escalations||[]).find(x=>x.id===caseId);if(!c)return;
  const stages=state.bootstrap.escalationStages||[];
  const idx=stages.findIndex(s=>s.id===c.stage);
  const isFinal=idx===stages.length-1;
  const isOpen=c.status!=="RESOLVED"&&c.status!=="CLOSED";
  $("#escalationModalBody").innerHTML=`
    <div class="incident-modal-head">
      <span class="severity ${c.severity.toLowerCase()}">${c.severity}</span>
      <h2>${esc(c.rule.replaceAll("_"," "))}</h2>
    </div>
    <p class="muted" style="font-size:13px">${esc(c.message)}</p>
    <div class="escalation-meta escalation-modal-meta">
      <span><strong>Shipper / Supplier:</strong> ${esc(c.shipper||c.supplier||c.supplier_id||"—")}</span>
      <span><strong>Date:</strong> ${c.affected_date||"—"}</span>
      <span><strong>Stage:</strong> <span class="escalation-stage-badge stage-${c.stage.toLowerCase()}">${c.stageLabel}</span></span>
      <span><strong>Status:</strong> ${c.status}</span>
    </div>
    <details class="escalation-report" open><summary>AI-generated report</summary><pre>${esc(c.ai_report)}</pre></details>
    <div class="escalation-btn-row" style="margin-top:10px">
      <button class="outline-btn" style="min-height:32px;font-size:12.5px" data-gen-letter="${c.id}"><i data-lucide="file-text"></i> Generate Report</button>
    </div>
    <div class="escalation-notes" style="margin-top:14px">${c.notes.map(n=>`<div class="escalation-note"><strong>${esc(n.author)}</strong> <span class="muted">· ${(stages.find(s=>s.id===n.stage)||{}).label||n.stage} · ${n.action}</span><p>${esc(n.text)}</p></div>`).join("")||`<p class="muted" style="font-size:12.5px">No notes yet.</p>`}</div>
    ${isOpen?`
    <div class="escalation-actions">
      <input type="text" class="escalation-note-input" data-note-for="${c.id}" placeholder="Add a note…"/>
      <div class="escalation-btn-row">
        <button class="mini-btn" data-esc-action="comment" data-esc-case="${c.id}">Comment</button>
        ${!isFinal?`<button class="primary-btn" data-esc-action="advance" data-esc-case="${c.id}" style="min-height:34px;font-size:13px">Escalate to ${stages[idx+1].label} →</button>`:""}
        <button class="outline-btn" data-esc-action="resolve" data-esc-case="${c.id}" style="min-height:34px;font-size:13px">Resolve</button>
        <button class="outline-btn" data-esc-action="close" data-esc-case="${c.id}" style="min-height:34px;font-size:13px">Close</button>
      </div>
    </div>`:`<button class="mini-btn" style="margin-top:10px" data-esc-action="reopen" data-esc-case="${c.id}">Reopen</button>`}
  `;
  $("#escalationModal").classList.add("open");$("#escalationModal").setAttribute("aria-hidden","false");
  renderIcons();
}

// ─── Knowledge Base ─────────────────────────────────────────────────────────────
function knowledgeDocCard(d){
  const canManage=state.auth?.role==="admin";
  return `<article class="card escalation-card-compact">
    <div class="esc-card-top">
      <span class="status-chip within">${esc(d.categoryLabel||d.category)}</span>
      ${canManage?`<button class="icon-btn" data-delete-kb-doc="${d.id}" title="Delete"><i data-lucide="trash-2"></i></button>`:""}
    </div>
    <h3>${esc(d.title)}</h3>
    <p class="esc-card-msg">${esc(d.description)||"No description provided."}</p>
    ${d.tags&&d.tags.length?`<p class="esc-card-entity">${d.tags.map(t=>esc(t)).join(" · ")}</p>`:""}
    <div class="esc-card-foot">
      <span class="esc-card-entity" style="margin:0">${esc(d.uploaded_by)} · ${(d.uploaded_at||"").slice(0,10)}</span>
      ${d.hasFile?`<a class="esc-card-view" href="/api/knowledge-base/${d.id}/file" download><i data-lucide="download"></i> Download</a>`:`<span class="esc-card-entity" style="margin:0">No file attached</span>`}
    </div>
  </article>`;
}

async function renderKnowledgePage(){
  const filters={};
  if(state.knowledgeCategoryFilter)filters.category=state.knowledgeCategoryFilter;
  state.knowledgeDocs=await fetchKnowledgeDocs(filters);
  const docs=state.knowledgeDocs;
  const categories=state.bootstrap.knowledgeCategories||[];
  const canUpload=true;

  $("#pageContent").innerHTML=`
    ${pageHeader("Knowledge Base","Policy, regulatory, and other reference documents available to platform users.",
      canUpload?`<button class="primary-btn" data-open-knowledge-upload><i data-lucide="upload"></i> Upload Document</button>`:"")}
    <div class="escalation-toolbar">
      <div class="report-tabs" style="margin:0">
        <button class="tab ${!state.knowledgeCategoryFilter?"active":""}" data-kb-category-filter="">All (${docs.length})</button>
        ${categories.map(c=>`<button class="tab ${state.knowledgeCategoryFilter===c.id?"active":""}" data-kb-category-filter="${c.id}">${c.label}</button>`).join("")}
      </div>
    </div>
    ${docs.length?`<section class="escalation-grid">${docs.map(knowledgeDocCard).join("")}</section>`
      :`<div class="empty">No documents yet. Use Upload Document to add a policy, regulation, SOP, or reference file.</div>`}`;
  renderIcons();
}

function openKnowledgeUploadModal(){
  const categories=state.bootstrap?.knowledgeCategories||[];
  $("#knowledgeUploadForm").innerHTML=`
    <label>Title<input name="title" type="text" required placeholder="e.g. NGTNC Amendment Circular 2026-04"/></label>
    <label>Category<select name="category" required>${categories.map(c=>`<option value="${c.id}">${c.label}</option>`).join("")}</select></label>
    <label>Description<textarea name="description" rows="2" placeholder="What this document covers"></textarea></label>
    <label>Tags (comma-separated)<input name="tags" type="text" placeholder="e.g. NGTNC, balancing, 2026"/></label>
    <label class="file-drop">
      <input name="file" type="file" required/>
      <i data-lucide="file-up"></i>
      <span>Drop document here or click to browse</span>
    </label>
    <button class="primary-btn full-btn" type="submit"><i data-lucide="upload"></i> Upload to Knowledge Base</button>`;
  $("#knowledgeUploadResult").innerHTML="";
  $("#knowledgeUploadModal").classList.add("open");$("#knowledgeUploadModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitKnowledgeUpload(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);
  fd.set("uploadedBy",state.auth?.name||"Platform User");
  const r=await fetch("/api/knowledge-base",{method:"POST",body:fd});
  const result=await r.json();
  $("#knowledgeUploadResult").innerHTML=`<div class="result-line">${result.ok?"Document uploaded.":result.message}</div>`;
  if(result.ok){
    await renderKnowledgePage();
    setTimeout(()=>{$("#knowledgeUploadModal").classList.remove("open");},700);
  }
}

// ─── Case Management (complaints) ───────────────────────────────────────────────
function casePriorityClass(p){
  if(p==="CRITICAL"||p==="HIGH")return "high";
  if(p==="MEDIUM")return "medium";
  return "";
}
function caseStatusClass(c){return c.status==="RESOLVED"||c.status==="CLOSED"?"within":"review";}

function caseCompactCard(c){
  return `<article class="card escalation-card-compact" data-open-case="${c.id}">
    <div class="esc-card-top">
      <span class="severity ${casePriorityClass(c.priority)}">${c.priority}</span>
      <span class="status-chip within">${esc(c.categoryLabel||c.category)}</span>
    </div>
    <h3>${esc(c.subject)}</h3>
    <p class="esc-card-entity">${esc(c.complainant_name)}${c.complainant_org?` · ${esc(c.complainant_org)}`:""} · ${c.complainant_role}</p>
    <p class="esc-card-msg">${esc(c.description)}</p>
    <div class="esc-card-foot">
      <span class="status-chip ${caseStatusClass(c)}">${fmtStatus(c.status)}</span>
      <span class="esc-card-view">View details <i data-lucide="arrow-right"></i></span>
    </div>
  </article>`;
}

function caseListTable(cases){
  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Complainant</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned To</th><th></th></tr></thead>
    <tbody>${cases.map(c=>`<tr class="clickable-row" data-open-case="${c.id}">
      <td>${c.id}</td>
      <td>${esc(c.complainant_name)}${c.complainant_org?`<br><span class="muted" style="font-size:12px">${esc(c.complainant_org)}</span>`:""}</td>
      <td>${esc(c.subject)}</td>
      <td>${esc(c.categoryLabel||c.category)}</td>
      <td><span class="severity ${casePriorityClass(c.priority)}">${c.priority}</span></td>
      <td><span class="status-chip ${caseStatusClass(c)}">${fmtStatus(c.status)}</span></td>
      <td>${esc(c.assigned_to)}</td>
      <td><button class="mini-btn" data-open-case="${c.id}">View</button></td>
    </tr>`).join("")||`<tr><td colspan="8"><div class="empty">No cases logged.</div></td></tr>`}</tbody>
  </table></div>`;
}

async function renderCasesPage(){
  state.cases=await fetchCases();
  const all=state.cases;
  let cases=state.caseStatusFilter?all.filter(c=>c.status===state.caseStatusFilter):all;
  if(state.caseCategoryFilter)cases=cases.filter(c=>c.category===state.caseCategoryFilter);
  const open=cases.filter(c=>c.status==="OPEN"||c.status==="IN_PROGRESS");
  const closed=cases.filter(c=>c.status==="RESOLVED"||c.status==="CLOSED");
  const statuses=[{id:"OPEN",label:"Open"},{id:"IN_PROGRESS",label:"In Progress"},{id:"RESOLVED",label:"Resolved"},{id:"CLOSED",label:"Closed"}];
  const viewMode=state.caseViewMode||"card";
  const canLog=state.auth?.role==="shipper"||state.auth?.role==="gasco"||state.auth?.role==="transporter";

  $("#pageContent").innerHTML=`
    ${pageHeader("Case Management","Complaints and enquiries logged from shippers, suppliers, offtakers, transporters, or the public.",
      canLog?`<button class="primary-btn" data-open-log-case><i data-lucide="plus"></i> Log Complaint</button>`:"")}
    <div class="escalation-toolbar">
      <div class="report-tabs" style="margin:0">
        <button class="tab ${!state.caseStatusFilter?"active":""}" data-case-status-filter="">All (${all.length})</button>
        ${statuses.map(s=>`<button class="tab ${state.caseStatusFilter===s.id?"active":""}" data-case-status-filter="${s.id}">${s.label} (${all.filter(c=>c.status===s.id).length})</button>`).join("")}
      </div>
      <div class="seg-toggle">
        <button class="seg-btn ${viewMode==="card"?"active":""}" data-case-view-mode="card"><i data-lucide="layout-grid"></i> Card</button>
        <button class="seg-btn ${viewMode==="list"?"active":""}" data-case-view-mode="list"><i data-lucide="list"></i> List</button>
      </div>
    </div>
    <h3 class="section-subhead">Open Cases</h3>
    ${open.length
      ?(viewMode==="card"?`<section class="escalation-grid">${open.map(caseCompactCard).join("")}</section>`:caseListTable(open))
      :`<div class="empty">No open cases.${canLog?" Use Log Complaint to record one.":""}</div>`}
    ${closed.length?`<h3 class="section-subhead">Resolved / Closed</h3>${viewMode==="card"?`<section class="escalation-grid">${closed.map(caseCompactCard).join("")}</section>`:caseListTable(closed)}`:""}`;
  renderIcons();
}

function openLogCaseModal(){
  const categories=state.bootstrap?.complaintCategories||[];
  const roles=state.bootstrap?.complaintRoles||[];
  const priorities=state.bootstrap?.complaintPriorities||[];
  const suppliers=state.bootstrap?.suppliers||[];
  const customers=state.bootstrap?.customers||[];
  const transporters=state.bootstrap?.transporters||[];
  $("#logCaseForm").innerHTML=`
    <label>Category<select name="category" required>${categories.map(c=>`<option value="${c.id}">${c.label}</option>`).join("")}</select></label>
    <label>Subject<input name="subject" type="text" required placeholder="Short summary of the complaint"/></label>
    <label>Description<textarea name="description" rows="3" required placeholder="Full details of the complaint or enquiry"></textarea></label>
    <label>Complainant Name<input name="complainantName" type="text" required/></label>
    <label>Complainant Organisation<input name="complainantOrg" type="text" placeholder="Optional"/></label>
    <label>Complainant Role<select name="complainantRole" required>${roles.map(r=>`<option value="${r}">${r.replaceAll("_"," ")}</option>`).join("")}</select></label>
    <label>Email<input name="complainantEmail" type="email" placeholder="Optional"/></label>
    <label>Phone<input name="complainantPhone" type="text" placeholder="Optional"/></label>
    <label>Related Gas Supplier / GASCO (optional)<select name="relatedSupplierId"><option value="">— None —</option>${suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></label>
    <label>Related Offtaker (optional)<select name="relatedCustomerId"><option value="">— None —</option>${customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></label>
    <label>Related Transporter (optional)<select name="relatedTransporterId"><option value="">— None —</option>${transporters.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}</select></label>
    <label>Priority<select name="priority" required>${priorities.map(p=>`<option value="${p}" ${p==="MEDIUM"?"selected":""}>${p}</option>`).join("")}</select></label>
    <label>Supporting Document (optional)<input name="attachment" type="file"/></label>
    <button class="primary-btn full-btn" type="submit"><i data-lucide="send"></i> Log Complaint</button>`;
  $("#logCaseResult").innerHTML="";
  $("#logCaseModal").classList.add("open");$("#logCaseModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitLogCase(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);
  fd.set("author",state.auth?.name||"Analyst");
  const r=await fetch("/api/cases",{method:"POST",body:fd});
  const result=await r.json();
  $("#logCaseResult").innerHTML=`<div class="result-line">${result.ok?"Complaint logged.":result.message}</div>`;
  if(result.ok){
    await renderCasesPage();
    setTimeout(()=>{$("#logCaseModal").classList.remove("open");},700);
  }
}

function openCaseDetailModal(caseId){
  const c=(state.cases||[]).find(x=>x.id===caseId);if(!c)return;
  const isOpen=c.status!=="RESOLVED"&&c.status!=="CLOSED";
  const canAct=state.auth?.role!=="admin"&&state.auth?.role!=="viewer";
  const relatedBits=[
    c.relatedSupplierName?`<span><strong>Supplier:</strong> ${esc(c.relatedSupplierName)}</span>`:"",
    c.relatedCustomerName?`<span><strong>Offtaker:</strong> ${esc(c.relatedCustomerName)}</span>`:"",
    c.relatedTransporterName?`<span><strong>Transporter:</strong> ${esc(c.relatedTransporterName)}</span>`:"",
  ].filter(Boolean).join("");
  $("#caseDetailModalBody").innerHTML=`
    <div class="incident-modal-head">
      <span class="severity ${casePriorityClass(c.priority)}">${c.priority}</span>
      <h2>${esc(c.subject)}</h2>
    </div>
    <p class="muted" style="font-size:13px">${esc(c.description)}</p>
    <div class="escalation-meta escalation-modal-meta">
      <span><strong>Complainant:</strong> ${esc(c.complainant_name)}${c.complainant_org?` (${esc(c.complainant_org)})`:""} · ${c.complainant_role}</span>
      ${c.complainant_email?`<span><strong>Email:</strong> ${esc(c.complainant_email)}</span>`:""}
      ${c.complainant_phone?`<span><strong>Phone:</strong> ${esc(c.complainant_phone)}</span>`:""}
      ${relatedBits}
      <span><strong>Category:</strong> ${esc(c.categoryLabel||c.category)}</span>
      <span><strong>Status:</strong> ${fmtStatus(c.status)}</span>
      <span><strong>Assigned To:</strong> ${esc(c.assigned_to)}</span>
    </div>
    ${c.attachment_file_name?`<p style="margin:10px 0"><a class="esc-card-view" href="/api/cases/${c.id}/attachment" download><i data-lucide="paperclip"></i> ${esc(c.attachment_file_name)}</a></p>`:""}
    <div class="escalation-notes" style="margin-top:14px">${c.notes.map(n=>`<div class="escalation-note"><strong>${esc(n.author)}</strong> <span class="muted">· ${n.action}</span><p>${esc(n.text)}</p></div>`).join("")||`<p class="muted" style="font-size:12.5px">No notes yet.</p>`}</div>
    ${isOpen&&canAct?`
    <div class="escalation-actions">
      <input type="text" class="escalation-note-input" data-case-note-for="${c.id}" placeholder="Add a note…"/>
      <div class="escalation-btn-row" style="flex-wrap:wrap">
        <button class="mini-btn" data-case-action="comment" data-case-id="${c.id}">Comment</button>
        <input type="text" class="escalation-note-input" style="max-width:180px" data-case-assignee-for="${c.id}" placeholder="Assign to…"/>
        <button class="mini-btn" data-case-action="assign" data-case-id="${c.id}">Assign</button>
        ${c.status==="OPEN"?`<button class="outline-btn" data-case-action="start" data-case-id="${c.id}" style="min-height:34px;font-size:13px">Start Investigation</button>`:""}
        <button class="outline-btn" data-case-action="resolve" data-case-id="${c.id}" style="min-height:34px;font-size:13px">Resolve</button>
        <button class="outline-btn" data-case-action="close" data-case-id="${c.id}" style="min-height:34px;font-size:13px">Close</button>
      </div>
    </div>`:!isOpen&&canAct?`<button class="mini-btn" style="margin-top:10px" data-case-action="reopen" data-case-id="${c.id}">Reopen</button>`:""}
  `;
  $("#caseDetailModal").classList.add("open");$("#caseDetailModal").setAttribute("aria-hidden","false");
  renderIcons();
}

function renderMissingSubmissions(missing){
  const openPeriods=state.bootstrap.periods?.filter(p=>p.status==="OPEN")||[];
  const months=openPeriods.filter(p=>p.id!=="2026"&&p.id!=="Q1-2026").map(p=>p.name);
  return `<div class="card-title"><h2>Missing Submissions</h2><span>${missing.length} transporters</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Transporter</th><th>Code</th><th>Missing Month(s)</th><th>Status</th></tr></thead>
    <tbody>${missing.length?missing.map(t=>`<tr>
      <td>${t.name}</td><td>${t.code}</td>
      <td>${months.length?months.join(", "):"All open periods"}</td>
      <td><span class="severity error">MISSING</span></td>
    </tr>`).join(""):`<tr><td colspan="4"><div class="empty">All transporters have submitted.</div></td></tr>`}</tbody>
  </table></div>`;
}

// ─── Supplier Detail ──────────────────────────────────────────────────────────
async function renderSupplierDetail(supplierId){
  const sup=state.bootstrap.suppliers.find(s=>s.id===supplierId);if(!sup)return;
  state.drillSupplier=supplierId;
  state.drillReport=await fetchReport({supplier:supplierId});
  const d=state.drillReport,supSum=(d.gasSupplierSummary||d.supplierSummary)[0],shipper=(d.shipperSummary||[])[0],tab=state.drillSupplierTab||"details";
  $("#pageContent").innerHTML=`
    ${pageHeader("Gas Supplier / GASCO Detail",`${sup.name} — injection, entry-point delivery, DGDO performance, and linked shipper records.`,backBtn("Back"))}
    <section class="transporter-drill-hero">
      <h2>${sup.name}</h2><p>${sup.code}</p>
      <div class="region-tags">${supSum?`<span class="region-tag">${fmt(supSum.injection)} MMScf injected</span><span class="region-tag">${supSum.days} gas days</span><span class="region-tag">Linked shipper: ${esc(shipper?.shipper||sup.name)}</span><span class="region-tag">${supSum.offtakers||supSum.customers} offtakers</span>`:""}</div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="ask-ai-entity-btn" data-entity-type="supplier" data-entity-id="${supplierId}" data-entity-name="${sup.name}"><i data-lucide="sparkles"></i> Ask AI about ${sup.name}</button>
        <button class="primary-btn" style="min-height:36px" data-open-nomination="true"><i data-lucide="clipboard-list"></i> Daily Nomination & Quality</button>
      </div>
    </section>
    <div class="report-tabs">
      <button class="tab ${tab==="details"?"active":""}" data-supplier-tab="details">Details</button>
      <button class="tab ${tab==="log"?"active":""}" data-supplier-tab="log">Daily Log</button>
      <button class="tab ${tab==="customers"?"active":""}" data-supplier-tab="customers">Offtaker Records</button>
      <button class="tab ${tab==="nomination"?"active":""}" data-supplier-tab="nomination">Nomination & Quality</button>
      <button class="tab ${tab==="shipperNom"?"active":""}" data-supplier-tab="shipperNom">Shipper Nominations</button>
    </div>
    <article class="card registry-card">
      ${tab==="details"?renderSupplierDetailsTab(sup,supSum):""}
      ${tab==="log"?renderSupplierLogTab(d):""}
      ${tab==="customers"?renderSupplierCustomerTab(d):""}
      ${tab==="nomination"?await renderSupplierNominationTab(supplierId):""}
      ${tab==="shipperNom"?await renderSupplierShipperNominationTab(supplierId):""}
    </article>`;
  renderIcons();
}

async function renderSupplierShipperNominationTab(supplierId){
  const linkedShipper=(state.bootstrap.shippers||[]).find(s=>s.linkedSupplierId===supplierId);
  const shipperId=linkedShipper?.id||`SHIPPER-${supplierId}`;
  const rows=await fetchShipperNominations(shipperId);
  const discrepancies=rows.filter(r=>r.hasDiscrepancy).length;
  return `<div class="card-title"><h2>Shipper Self-Reported Nominations</h2><span>${rows.length} submission${rows.length===1?"":"s"}${discrepancies?` · ${discrepancies} flagged`:""}</span></div>
  <p style="color:var(--muted);margin:0 0 16px">What the linked shipper says it nominated for each gas day, entered directly by the shipper, cross-checked against the transporter's reported injection figure for the same day.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Date</th><th>Shipper-Reported Nomination (MMScf)</th><th>Transporter-Reported Injection (MMScf)</th><th>Variance</th><th>Note</th><th>Supporting File</th></tr></thead>
    <tbody>${rows.map(shipperNominationRow).join("")||`<tr><td colspan="6"><div class="empty">No shipper-submitted nominations yet for this supplier's linked shipper.</div></td></tr>`}</tbody>
  </table></div>`;
}

async function renderSupplierNominationTab(supplierId){
  const result=await api(`/api/gasco/nominations?supplier=${supplierId}`);
  const rows=result.nominations||[];
  return `<div class="card-title"><h2>Daily Nomination & Quality Submissions</h2><button class="mini-btn" data-open-nomination="true">New Submission</button></div>
  <p style="color:var(--muted);margin:0 0 16px">Previous day's nominated volume and injection, the gas quality (lab) report backing it, and today's projection — replaces manual sheet upload for this workflow.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Date</th><th>Prev. Day Nomination</th><th>Prev. Day Injection</th><th>Quality Report</th><th>Projection Today</th><th>Dispute Note</th><th>Combined Report</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="${r.off_spec?"row-warn":""}">
      <td>${r.date}</td><td>${fmt(r.previous_day_volume_mmscf)}</td><td>${fmt(r.previous_day_injection_mmscf)}</td>
      <td>${esc(r.quality_report_file_name)}${r.off_spec?` <span class="severity error">OFF-SPEC</span>`:""}${r.quality_report_path?` <a class="report-link" style="margin:0" href="/api/quality-report-file?nominationId=${r.id}" target="_blank">View PDF</a>`:""}</td>
      <td>${fmt(r.projection_today_mmscf)}</td><td>${esc(r.dispute_note)||"—"}</td>
      <td><a class="report-link" style="margin:0" href="/api/combined-report?supplierId=${supplierId}&date=${r.date}" target="_blank"><i data-lucide="download"></i> PDF</a></td>
    </tr>`).join("")||`<tr><td colspan="7"><div class="empty">No nomination/quality submissions yet.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderSupplierDetailsTab(sup,supSum){
  return `<div class="card-title"><h2>Gas Supplier / GASCO Details</h2></div>
  <div class="detail-grid">
    <div class="detail-section"><h3>Registration</h3><dl class="detail-dl">
      <div><dt>ID</dt><dd>${sup.id}</dd></div>
      <div><dt>Code</dt><dd>${sup.code}</dd></div>
      <div><dt>Name</dt><dd>${sup.name}</dd></div>
      <div><dt>Status</dt><dd><span class="severity low">ACTIVE</span></dd></div>
    </dl></div>
    ${supSum?`<div class="detail-section"><h3>Period Performance</h3><dl class="detail-dl">
      <div><dt>Gas Days</dt><dd>${supSum.days}</dd></div>
      <div><dt>Injection</dt><dd>${fmt(supSum.injection)} MMScf</dd></div>
      <div><dt>Effective Injection</dt><dd>${fmt(supSum.effectiveInjection)} MMScf</dd></div>
      <div><dt>Attribution</dt><dd>${fmt(supSum.attribution)} MMScf</dd></div>
      <div><dt>Shrinkage</dt><dd>${fmt(supSum.shrinkage)} MMScf</dd></div>
      <div><dt>Imbalance</dt><dd>${fmt(supSum.supplierImbalance)} MMScf</dd></div>
      <div><dt>Offtakers</dt><dd>${supSum.offtakers||supSum.customers}</dd></div>
      <div><dt>DGDO Target</dt><dd>${fmt(supSum.dgdoTarget)} MMScf</dd></div>
      <div><dt>DGDO Variance</dt><dd>${supSum.dgdoVariancePct>0?"+":""}${fmt(supSum.dgdoVariancePct)}%</dd></div>
    </dl></div>`:""}
  </div>
  ${supSum?.aiRemark?`<div class="ai-remark-card"><i data-lucide="sparkles"></i><p>${supSum.aiRemark}</p></div>`:""}`;
}

function renderSupplierLogTab(d){
  const fMap={};
  d.exceptions.forEach(f=>{if(!fMap[f.affected_date])fMap[f.affected_date]=[];fMap[f.affected_date].push(f.message);});
  return `<div class="card-title"><h2>Daily Log</h2>
    <label class="ncelas-remember" style="margin-left:auto"><input type="checkbox" id="highlightToggle" checked> Highlight exceptions</label>
  </div>
  <div class="table-wrap"><table id="supplierLogTable">
    <thead><tr><th>Date</th><th>Injection (MMScf)</th><th>Attribution (MMScf)</th><th>Shrinkage</th><th>AI Remark</th><th></th></tr></thead>
    <tbody>${d.dailySeries.map(row=>{
      const remarks=(fMap[row.date]||[]).join("; ")||"";
      const hasFlag=!!remarks;
      return `<tr class="${hasFlag?"exc-row":""}">
        <td>${row.date}</td><td>${fmt(row.injection)}</td><td>${fmt(row.attribution)}</td><td>${fmt(row.shrinkage)}</td>
        <td class="remark-cell ${hasFlag?"flag-remark":""}">${remarks||"—"}</td>
        <td><button class="drill-link" data-supplier-tab="customers">Offtakers →</button></td>
      </tr>`;
    }).join("")||`<tr><td colspan="6"><div class="empty">No records.</div></td></tr>`}</tbody>
  </table></div>`;
}

function renderSupplierCustomerTab(d){
  const rows=d.offtakerSummary||d.customerSummary;
  return `<div class="card-title"><h2>Offtaker Records</h2><span>${rows.length} offtakers</span></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Offtaker</th><th>Sector</th><th>Attribution</th><th>Shrinkage</th><th>Eff. Attribution</th><th></th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td><button class="drill-link" data-drill-customer="${r.offtakerId||r.customerId}">${r.offtaker||r.customer}</button></td>
      <td><span class="sector-badge sector-${r.sector.toLowerCase()}">${r.sector}</span></td>
      <td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td><td>${fmt(r.effectiveAttribution)}</td>
      <td><button class="drill-link" data-drill-customer="${r.offtakerId||r.customerId}">Detail →</button></td>
    </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No records.</div></td></tr>`}</tbody>
  </table></div>`;
}

// ─── Customer Detail with daily log ──────────────────────────────────────────
async function renderCustomerDetail(customerId){
  const custSum=(state.report.offtakerSummary||state.report.customerSummary).find(c=>(c.offtakerId||c.customerId)===customerId);
  const d=await fetchReport({customer:customerId});
  const fMap={};
  d.exceptions.forEach(f=>{if(!fMap[f.affected_date])fMap[f.affected_date]=[];fMap[f.affected_date].push(f.message);});
  const name=custSum?.offtaker||custSum?.customer||customerId;
  const sector=custSum?.sector||"GTP";
  const sColors={GTP:"#063f27",GBI:"#8c5f06",GTC:"#2b4db5"};
  $("#pageContent").innerHTML=`
    ${pageHeader("Offtaker Detail",`${name} — exit-side attribution, shrinkage, imbalance, and daily records.`,backBtn("Back to Offtakers"))}
    <section class="transporter-drill-hero" style="background:linear-gradient(145deg,${sColors[sector]||"#063f27"},#188a52)">
      <h2>${name}</h2><p>${customerId}</p>
      <div class="region-tags">
        <span class="region-tag">Sector: ${sector}</span>
        ${custSum?`<span class="region-tag">${fmt(custSum.attribution)} MMScf received</span>`:""}
        ${custSum?.exitPoint?`<span class="region-tag">Exit: ${custSum.exitPoint}</span>`:""}
      </div>
      <div style="margin-top:14px"><button class="ask-ai-entity-btn" data-entity-type="offtaker" data-entity-id="${customerId}" data-entity-name="${name}"><i data-lucide="sparkles"></i> Ask AI about ${name}</button></div>
    </section>
    <section class="kpi-grid-5" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
      ${kpiCard("Attribution",custSum?fmt(custSum.attribution):"—","MMScf",true,"git-merge")}
      ${kpiCard("Shrinkage",custSum?fmt(custSum.shrinkage):"—","MMScf",false,"trending-down")}
      ${kpiCard("Imbalance",custSum?fmt(custSum.imbalance):"—","MMScf",false,"activity")}
      ${kpiCard("Eff. Attribution",custSum?fmt(custSum.effectiveAttribution):"—","MMScf",false,"check-circle")}
    </section>
    <article class="card registry-card" style="margin-top:14px">
      <div class="card-title"><h2>Daily Records</h2><span>${d.dailySeries.length} gas days</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Injection (MMScf)</th><th>Attribution (MMScf)</th><th>Shrinkage</th><th>AI Remark</th></tr></thead>
        <tbody>${d.dailySeries.map(row=>{
          const remarks=(fMap[row.date]||[]).join("; ")||"";
          const hasFlag=!!remarks;
          return `<tr class="${hasFlag?"exc-row":""}"><td>${row.date}</td><td>${fmt(row.injection)}</td><td>${fmt(row.attribution)}</td><td>${fmt(row.shrinkage)}</td><td class="remark-cell ${hasFlag?"flag-remark":""}">${remarks||"—"}</td></tr>`;
        }).join("")||`<tr><td colspan="5"><div class="empty">No records.</div></td></tr>`}</tbody>
      </table></div>
      ${custSum?.aiRemark?`<div class="ai-remark-card" style="margin-top:16px"><i data-lucide="sparkles"></i><p>${custSum.aiRemark}</p></div>`:""}
    </article>`;
  renderIcons();
}

// ─── Registry pages ───────────────────────────────────────────────────────────
function renderRegistryPage(type){
  const isViewer=state.auth?.role==="viewer";
  const cfgs={
    transporters:{title:"Transporters",singular:"Transporter",desc:"Registered pipeline operators.",
      columns:["Name","Code","Network","Status",""],filterBar:"",
      rows:()=>state.bootstrap.transporters.map(t=>[t.name,t.code,transporterNetworkName(t.id),`<span class="severity low">ACTIVE</span>`,`<button class="drill-link" data-drill-transporter="${t.id}">View →</button>`])},
    shippers:{title:"Shippers",singular:"Shipper",desc:"Accountable network users mapped to linked supplier/GASCO delivery records for v1.",
      columns:["Name","Code","Linked Supplier / GASCO","Status",""],filterBar:"",
      rows:()=>state.bootstrap.shippers.map(s=>[s.name,s.code,esc(s.linkedSupplier||"—"),`<span class="severity low">ACTIVE</span>`,`<button class="drill-link" data-drill-supplier="${s.linkedSupplierId}">Performance →</button>`])},
    suppliers:{title:"Gas Suppliers / GASCOS",singular:"Gas Supplier",desc:"Registered gas suppliers and producers responsible for injection, entry-point delivery, and DGDO performance.",
      columns:["Name","Code","DGDO Status",""],filterBar:"",
      rows:()=>state.bootstrap.suppliers.map(s=>[`<button class="drill-link" data-drill-supplier="${s.id}">${s.name}</button>`,s.code,`<span class="severity low">ACTIVE</span>`,`<button class="drill-link" data-drill-supplier="${s.id}">Detail →</button>`])},
    customers:{title:"Offtakers",singular:"Offtaker",desc:"Registered exit-side gas receivers grouped by utilisation sector.",
      columns:["Name","Code","Sector","Exit Point",""],filterBar:customersFilterBar(),
      rows:()=>state.bootstrap.customers.map(c=>[`<button class="drill-link" data-drill-customer="${c.id}">${c.name}</button>`,c.code,`<span class="sector-badge sector-${c.sector.toLowerCase()}">${c.sector}</span>`,exitName(c.exitPointId),`<button class="drill-link" data-drill-customer="${c.id}">Detail →</button>`])},
  };
  const cfg=cfgs[type];if(!cfg)return;
  const addBtn=!isViewer && type!=="shippers"?`<button class="primary-btn" data-add-entity="${type}"><i data-lucide="plus"></i> Add ${cfg.singular}</button>`:"";
  const rows=cfg.rows();
  $("#pageContent").innerHTML=`
    ${pageHeader(cfg.title,cfg.desc,addBtn)}
    ${cfg.filterBar}
    <section class="card registry-card">
      <div class="card-title"><h2>${cfg.title}</h2><span>${rows.length} records</span></div>
      <div class="table-wrap"><table>
        <thead><tr>${cfg.columns.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${cfg.columns.length}"><div class="empty">No records.</div></td></tr>`}</tbody>
      </table></div>
    </section>`;
}

function renderPointsPage(){
  const isViewer=state.auth?.role==="viewer";
  const addBtn=!isViewer?`<button class="primary-btn" data-add-entity="entry-points"><i data-lucide="plus"></i> Entry Point</button><button class="outline-btn" data-add-entity="exit-points"><i data-lucide="plus"></i> Exit Point</button>`:"";
  const ep=state.bootstrap.entryPoints,xp=state.bootstrap.exitPoints;
  const ptRow=(r,type)=>`<tr><td>${r.name}</td><td>${r.code}</td><td>${r.location}</td><td>${r.min_pressure_barg}–${r.max_pressure_barg} Barg</td>${type==="exit"?`<td>${r.shrinkage_threshold_mmscf} MMScf</td>`:""}</tr>`;
  $("#pageContent").innerHTML=`
    ${pageHeader("Entry / Exit Points","Injection and offtake points.",addBtn)}
    <section class="split-grid">
      <article class="card registry-card">
        <div class="card-title"><h2>Entry Points</h2><span>${ep.length}</span></div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Code</th><th>Location</th><th>Entry Pressure (Barg)</th></tr></thead>
        <tbody>${ep.map(r=>ptRow(r,"entry")).join("")}</tbody></table></div>
      </article>
      <article class="card registry-card">
        <div class="card-title"><h2>Exit Points</h2><span>${xp.length}</span></div>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Code</th><th>Location</th><th>Exit Pressure (Barg)</th><th>Shrinkage</th></tr></thead>
        <tbody>${xp.map(r=>ptRow(r,"exit")).join("")}</tbody></table></div>
      </article>
    </section>`;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
function renderThresholdsPage(){
  const thresholds=state.bootstrap.thresholds||[];
  const mLabels={PRESSURE_BARG:"Entry Pressure (Barg)",SHRINKAGE_MMSCF:"Shrinkage (MMScf)",SHIPPER_IMBALANCE_MMSCF:"Shipper Imbalance",CONDENSATE_LTRS:"Condensate Drop-out",MISSING_DATA:"Missing Data",NOMINATION_VARIANCE_PCT:"Nomination Variance (%)",LINE_PACK_VARIANCE_PCT:"Line-Pack Variance (%)",MLF_LOSS_PCT:"MLF Measurement Loss (%)"};
  const mDesc={PRESSURE_BARG:"Entry pressure outside the agreed NEA band triggers a warning.",SHRINKAGE_MMSCF:"Shrinkage above the agreed maximum is flagged.",SHIPPER_IMBALANCE_MMSCF:"Imbalance values outside the agreed band are flagged.",CONDENSATE_LTRS:"Condensate drop-out above this level is flagged.",MISSING_DATA:"Severity for blank injection or attribution cells.",NOMINATION_VARIANCE_PCT:"Daily injection more than this percent away from the nominated volume is flagged as over- or under-delivery.",LINE_PACK_VARIANCE_PCT:"Gap between total injection and total uptake beyond this percent is flagged for investigation.",MLF_LOSS_PCT:"Measurement loss implied by the meter linearity factor (1 - MLF) above this percent is flagged as a possible calibration issue."};
  const isViewer=state.auth?.role==="viewer";
  const scada=state.bootstrap?.scadaPilotActors||[];
  $("#pageContent").innerHTML=`
    ${pageHeader("Thresholds","Validation rules applied to all uploaded workbooks.")}
    <section class="card" style="margin-bottom:18px">
      <div class="card-title"><h2>SCADA Integration — Pilot</h2><span>Real-time data hookup, phased rollout</span></div>
      <p style="color:var(--muted);font-size:12.5px;margin:0 0 12px">The platform is architected to hook up to SCADA for real-time injection/pressure feeds. No live feed is connected in this prototype; the actors below are the proposed pilot scope discussed with the regulator before wider rollout.</p>
      <div class="scada-pilot-list">${scada.map(a=>`<div class="scada-pilot-row"><span class="population-dot amber"></span><span>${esc(a.name)}</span><small>${fmtStatus(a.status)}</small></div>`).join("")}</div>
    </section>
    <section class="thresholds-grid">
      ${thresholds.map(t=>`
        <div class="threshold-card">
          <div class="threshold-head"><strong>${mLabels[t.metric]||t.metric}</strong><span class="severity ${t.severity.toLowerCase()}">${t.severity}</span></div>
          <p>${mDesc[t.metric]||""}</p>
          <div class="threshold-inputs">
            <label>Min<input type="number" class="thresh-input" data-rule="${t.id}" data-field="warning_min" value="${t.warning_min??""}" placeholder="None" step="any" ${isViewer?"disabled":""}/></label>
            <label>Max<input type="number" class="thresh-input" data-rule="${t.id}" data-field="warning_max" value="${t.warning_max??""}" placeholder="None" step="any" ${isViewer?"disabled":""}/></label>
          </div>
          ${!isViewer?`<button class="primary-btn save-threshold" data-rule="${t.id}" style="margin-top:12px;min-height:40px;font-size:14px"><i data-lucide="save"></i> Save</button>`:""}
          <div class="thresh-result" id="tr-${t.id}"></div>
        </div>`).join("")}
    </section>`;
}

async function saveThreshold(ruleId){
  const minEl=document.querySelector(`.thresh-input[data-rule="${ruleId}"][data-field="warning_min"]`);
  const maxEl=document.querySelector(`.thresh-input[data-rule="${ruleId}"][data-field="warning_max"]`);
  const result=await api(`/api/thresholds/${ruleId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({warning_min:minEl?.value||null,warning_max:maxEl?.value||null})});
  const res=$(`#tr-${ruleId}`);
  if(res)res.innerHTML=`<div class="result-line">${result.ok?"Saved.":result.message}</div>`;
  if(result.ok)state.bootstrap.thresholds=state.bootstrap.thresholds.map(t=>t.id===ruleId?result.threshold:t);
}

// ─── Users ────────────────────────────────────────────────────────────────────
function renderUsersPage(){
  $("#pageContent").innerHTML=`
    ${pageHeader("Users","Manage platform access — activate, deactivate, and assign roles.",
      `<button class="primary-btn" id="openAddUser"><i data-lucide="user-plus"></i> Add User</button>`)}
    <article class="card registry-card">
      <div class="card-title"><h2>All Users</h2><span>${mockUsers.length} accounts</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>User Type</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
        <tbody>${mockUsers.map(u=>`<tr>
          <td>${u.firstName} ${u.lastName}</td><td>${u.email}</td>
          <td><span class="user-type-badge ut-${u.userType}">${USER_TYPE_LABELS[u.userType]||u.userType}</span></td>
          <td><span class="status-pill ${u.status==="active"?"status-ok":"status-err"}">${u.status.toUpperCase()}</span></td>
          <td>${u.lastLogin}</td>
          <td><button class="mini-btn ${u.status==="active"?"btn-deactivate":"btn-activate"}" data-user-toggle="${u.id}">${u.status==="active"?"Deactivate":"Activate"}</button></td>
        </tr>`).join("")}</tbody>
      </table></div>
    </article>`;
}

// ─── AI Intelligence (ChatGPT-style) ─────────────────────────────────────────
function renderAiPage(){
  const convId=state.aiActiveConv;
  const seedMsgs=convId?AI_SEED_MESSAGES[convId]||[]:[];
  const myMsgs=convId?(state.aiMessages[convId]||[]):[];
  const msgs=[...seedMsgs,...myMsgs];
  const contextNote=state.chatEntity?`${state.chatEntity.type}: ${state.chatEntity.name}`:state.auth?.transporterId?`Transporter: ${state.auth.transporterId}`:"Platform-wide";
  const initials=(state.auth?.name||"TI").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const leftSide=`<aside class="ai-sidebar">
    <div class="ai-sidebar-header">
      <div><span class="ai-sidebar-brand">Transporter AI</span><span class="ai-sidebar-sub">NMDPRA Intelligence</span></div>
      <button class="ai-new-chat-btn" id="aiNewChat" title="New chat"><i data-lucide="square-pen"></i></button>
    </div>
    <p class="ai-sidebar-section">Chats</p>
    <div class="ai-conv-list">
      ${AI_CONVERSATIONS.map(c=>`
        <button class="ai-conv-item ${convId===c.id?"active":""}" data-ai-conv="${c.id}">
          <span class="ai-conv-title">${c.title}</span>
          <span class="ai-conv-date">${c.date}</span>
        </button>`).join("")}
    </div>
    <div class="ai-sidebar-user">
      <div class="avatar" style="width:34px;height:34px;font-size:13px;flex-shrink:0">${initials}</div>
      <span>${state.auth?.name||"User"}</span>
    </div>
  </aside>`;

  const chatInputArea=`<div class="ai-chat-input-area">
    <div class="ai-context-chip"><i data-lucide="info"></i> ${contextNote}</div>
    <div class="ai-input-row">
      <input id="aiChatInput" placeholder="Ask anything about the gas data…" autocomplete="off"/>
      <button id="aiSendBtn"><i data-lucide="send"></i></button>
    </div>
  </div>`;

  const rightSide = msgs.length
    ? `<div class="ai-chat-area">
        <div class="ai-chat-messages" id="aiMessages">
          ${msgs.map(m=>m.role==="user"
            ?`<div class="ai-msg-row user"><div class="ai-bubble user-bubble">${esc(m.text)}</div></div>`
            :`<div class="ai-msg-row bot"><div class="ai-bot-icon"><i data-lucide="sparkles"></i></div><div class="ai-bubble bot-bubble">${m.text}</div></div>`
          ).join("")}
        </div>
        ${chatInputArea}
      </div>`
    : `<div class="ai-empty-area">
        <div class="ai-ready-state">
          <div class="ai-ready-icon"><i data-lucide="sparkles"></i></div>
          <h2>Ready when you are.</h2>
          <p>Ask anything about injection volumes, shipper imbalance, offtaker withdrawals, exceptions, or DGDR/DGDO performance.</p>
          <div class="ai-suggestion-row">
            <button class="ai-suggestion-btn" data-ai-prompt="Which shipper has the highest imbalance this quarter?"><i data-lucide="activity"></i><span>Review shipper imbalance</span></button>
            <button class="ai-suggestion-btn" data-ai-prompt="Show all pressure breaches in Q1 2026"><i data-lucide="triangle-alert"></i><span>Analyse exceptions</span></button>
            <button class="ai-suggestion-btn" data-ai-prompt="What is the overall compliance score for all transporters?"><i data-lucide="check-circle"></i><span>Check compliance</span></button>
          </div>
        </div>
        ${chatInputArea}
      </div>`;

  $("#pageContent").innerHTML=`<div class="ai-page-layout">${leftSide}<div class="ai-main">${rightSide}</div></div>`;
  renderIcons();
  const inp=$("#aiChatInput");
  if(inp)inp.addEventListener("keydown",e=>e.key==="Enter"&&sendAiMessage());
  const msgEl=$("#aiMessages");if(msgEl)msgEl.scrollTop=msgEl.scrollHeight;
}

function sendAiMessage(question){
  const inp=$("#aiChatInput");
  const q=question||inp?.value?.trim();if(!q)return;
  if(inp)inp.value="";
  const k=state.report.kpis;
  const insight=state.report.aiInsights[0];
  const entityNote=state.chatEntity?`Regarding <strong>${state.chatEntity.name}</strong>: `:"";
  const answer=`${entityNote}Based on Q1 2026 data: total injection is <strong>${fmt(k.totalInjection)} MMScf</strong>, effective attribution is <strong>${fmt(k.effectiveAttribution)} MMScf</strong>, and <strong>${k.exceptions} exception(s)</strong> require review.${insight?`<br><br>${insight.summary}`:""}`;
  if(!state.aiActiveConv){
    const newId=`conv-new-${Date.now()}`;
    AI_CONVERSATIONS.unshift({id:newId,title:q.slice(0,42),date:"Just now"});
    state.aiActiveConv=newId;
  }
  if(!state.aiMessages[state.aiActiveConv])state.aiMessages[state.aiActiveConv]=[];
  state.aiMessages[state.aiActiveConv].push({role:"user",text:q},{role:"bot",text:answer});
  renderAiPage();
}

// ─── Transporter workspace ────────────────────────────────────────────────────
async function renderTransporterDashboard(){
  const tid=state.auth?.transporterId;
  await renderScopedDashboard(
    {transporter:tid},
    "My Dashboard",
    `Welcome back, ${state.auth?.name||"Transporter User"} — your submissions, transport performance, and exceptions for ${transporterNetworkName(tid)}.`,
    u=>!tid||u.transporter_id===tid
  );
  const actionsHost=document.querySelector("#pageContent .hero-actions");
  if(actionsHost&&!actionsHost.querySelector("[data-open-daily-entry]")){
    actionsHost.insertAdjacentHTML("afterbegin",`<button class="primary-btn" data-open-daily-entry="true"><i data-lucide="edit-3"></i> Daily Data Entry</button>
       <button class="outline-btn" data-open-upload="true"><i data-lucide="upload"></i> Upload Workbook</button>`);
    renderIcons();
  }
}

async function renderShipperDashboard(){
  const shipperId=state.auth?.shipperId;
  const linkedSupplierId=(state.bootstrap.shippers||[]).find(s=>s.id===shipperId)?.linkedSupplierId;
  const linkedName=(state.bootstrap.shippers||[]).find(s=>s.id===shipperId)?.linkedSupplier||"your linked supplier";
  await renderScopedDashboard(
    {supplier:linkedSupplierId},
    "My Dashboard",
    `Welcome back, ${state.auth?.name||"Shipper User"} — transport performance and exceptions for ${linkedName}.`,
    u=>!linkedSupplierId||u.supplier_id===linkedSupplierId
  );
  const actionsHost=document.querySelector("#pageContent .hero-actions");
  if(actionsHost&&!actionsHost.querySelector("[data-open-shipper-nomination]")){
    actionsHost.insertAdjacentHTML("afterbegin",`<button class="primary-btn" data-open-shipper-nomination><i data-lucide="clipboard-list"></i> Log Nomination</button>
       <button class="outline-btn" data-open-upload="true"><i data-lucide="upload"></i> Upload Workbook</button>`);
    renderIcons();
  }
}

function renderTransporterDrilldown(){
  const t=state.bootstrap.transporters.find(x=>x.id===state.drillTransporter);
  if(!t){$("#pageContent").innerHTML=`<div class="empty">Transporter not found.</div>`;return;}
  const uploads=state.report.uploads.filter(r=>r.transporter_id===t.id);
  const summary=state.report.supplierSummary;
  const totInj=summary.reduce((s,r)=>s+(r.injection||0),0),totAttr=summary.reduce((s,r)=>s+(r.attribution||0),0);
  $("#pageContent").innerHTML=`
    ${pageHeader("Transporter Detail","Network-level rollup.",backBtn("Back"))}
    <section class="transporter-drill-hero">
      <h2>${t.name}</h2><p>${transporterNetworkName(t.id)}</p>
      <div class="region-tags">${transporterRegions(t.id).map(r=>`<span class="region-tag">${r}</span>`).join("")||`<span class="region-tag">National</span>`}</div>
      <div style="margin-top:14px"><button class="ask-ai-entity-btn" data-entity-type="transporter" data-entity-id="${t.id}" data-entity-name="${t.name}"><i data-lucide="sparkles"></i> Ask AI about ${t.name}</button></div>
    </section>
    <section class="kpi-grid-5" style="grid-template-columns:repeat(4,1fr)">
      ${kpiCard("Total Injection",fmt(totInj),"MMScf",true,"arrow-up-right")}
      ${kpiCard("Total Attribution",fmt(totAttr),"MMScf",false,"git-merge")}
      ${kpiCard("Submissions",uploads.length,"filed",false,"file-spreadsheet")}
      ${kpiCard("Potential Incidents",state.report.exceptions.length,"flags",false,"triangle-alert","exceptions")}
    </section>
    <section class="drill-section">
      <div class="drill-section-title">Supplier Assignments</div>
      <article class="card registry-card">
        <div class="table-wrap"><table>
          <thead><tr><th>Supplier</th><th>Days</th><th>Injection</th><th>Attribution</th><th>Shrinkage</th><th></th></tr></thead>
          <tbody>${summary.map(r=>`<tr>
            <td><button class="drill-link" data-drill-supplier="${r.supplierId}">${r.supplier}</button></td>
            <td>${r.days}</td><td>${fmt(r.injection)}</td><td>${fmt(r.attribution)}</td><td>${fmt(r.shrinkage)}</td>
            <td><button class="drill-link" data-drill-supplier="${r.supplierId}">Detail →</button></td>
          </tr>`).join("")||`<tr><td colspan="6"><div class="empty">No data.</div></td></tr>`}</tbody>
        </table></div>
      </article>
    </section>
    <section class="drill-section">
      <div class="drill-section-title">Submissions (${uploads.length})</div>
      <article class="card registry-card">
        <div class="table-wrap"><table>
          <thead><tr><th>Supplier</th><th>Period</th><th>Status</th><th>Records</th><th>Flags</th></tr></thead>
          <tbody>${uploads.map(r=>`<tr>
            <td>${r.supplier}</td><td>${r.period}</td>
            <td><span class="status-pill ${r.status.includes("WARNING")?"status-warn":"status-ok"}">${fmtStatus(r.status)}</span></td>
            <td>${r.validation_summary.acceptedRecords}</td><td>${r.validation_summary.warnings}</td>
          </tr>`).join("")||`<tr><td colspan="5"><div class="empty">No submissions.</div></td></tr>`}</tbody>
        </table></div>
      </article>
    </section>`;
  renderIcons();
}

function renderProfilePage(){
  const auth=state.auth,tid=auth?.transporterId;
  const transporter=tid?state.bootstrap.transporters.find(t=>t.id===tid):null;
  $("#pageContent").innerHTML=`
    ${pageHeader("Profile","Your account details and security settings.")}
    <div class="split-grid">
      <article class="card">
        <div class="card-title"><h2>Account Details</h2></div>
        <div class="profile-hero">
          <div class="avatar large-avatar">${(auth?.name||"TI").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
          <div><strong class="profile-name">${auth?.name||"User"}</strong><span class="profile-email">${auth?.email||""}</span>
            <span class="user-type-badge ut-${auth?.userType}" style="margin-top:8px;display:inline-block">${USER_TYPE_LABELS[auth?.userType]||auth?.role?.toUpperCase()}</span></div>
        </div>
        <dl class="detail-dl" style="margin-top:22px">
          <div><dt>Role</dt><dd>${auth?.role==="admin"?"Admin / Regulator":auth?.role==="viewer"?"Viewer":auth?.role==="gasco"?"GASCO / Supplier":auth?.role==="shipper"?"Shipper":"Transporter Operator"}</dd></div>
          <div><dt>User Type</dt><dd>${USER_TYPE_LABELS[auth?.userType]||"—"}</dd></div>
          <div><dt>Email</dt><dd>${auth?.email||"—"}</dd></div>
          <div><dt>Transporter ID</dt><dd>${tid||"N/A"}</dd></div>
        </dl>
      </article>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${transporter?`<article class="card">
          <div class="card-title"><h2>Assigned Transporter</h2></div>
          <dl class="detail-dl">
            <div><dt>Name</dt><dd>${transporter.name}</dd></div>
            <div><dt>Code</dt><dd>${transporter.code}</dd></div>
            <div><dt>Network</dt><dd>${transporterNetworkName(tid)}</dd></div>
          </dl>
        </article>`:""}
        <article class="card">
          <div class="card-title"><h2>Reset Password</h2></div>
          <div class="reset-pw-form">
            <label>Current Password<input type="password" id="currentPw" placeholder="Current password"/></label>
            <label>New Password<input type="password" id="newPw" placeholder="New password"/></label>
            <label>Confirm New Password<input type="password" id="confirmPw" placeholder="Confirm"/></label>
            <button class="primary-btn" id="resetPwBtn" style="margin-top:8px"><i data-lucide="lock"></i> Update Password</button>
            <div id="resetPwResult"></div>
          </div>
        </article>
      </div>
    </div>`;
  const btn=$("#resetPwBtn");
  if(btn)btn.addEventListener("click",()=>{
    const cp=$("#currentPw")?.value,np=$("#newPw")?.value,cf=$("#confirmPw")?.value,res=$("#resetPwResult");
    if(!cp||!np||!cf){if(res)res.innerHTML=`<div class="result-line">Fill all fields.</div>`;return;}
    if(np!==cf){if(res)res.innerHTML=`<div class="result-line">Passwords do not match.</div>`;return;}
    if(res)res.innerHTML=`<div class="result-line" style="color:var(--green)">Password updated (demo).</div>`;
  });
  renderIcons();
}

function renderUploadsPage(isTransporter=false){
  const uploads=state.report.uploads;
  const role=state.auth?.role;
  let filtered=uploads;
  if(role==="transporter"&&state.auth?.transporterId){
    filtered=uploads.filter(u=>u.transporter_id===state.auth.transporterId);
  }else if(role==="shipper"){
    const linkedSupplierId=(state.bootstrap.shippers||[]).find(s=>s.id===state.auth?.shipperId)?.linkedSupplierId;
    filtered=linkedSupplierId?uploads.filter(u=>u.supplier_id===linkedSupplierId):uploads;
  }
  const scoped=role==="transporter"||role==="shipper";
  $("#pageContent").innerHTML=`
    ${pageHeader(scoped?"Upload & Reports":"Upload History",
      scoped?"Submit workbooks and review your validation outcomes.":"All transporter submissions.",
      `<button class="primary-btn" data-open-upload="true"><i data-lucide="upload"></i> Upload Workbook</button>`)}
    <section class="card registry-card">
      <div class="card-title"><h2>Submissions</h2><span>${filtered.length} records</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>File</th><th>Transporter</th><th>Supplier</th><th>Period</th><th>Status</th><th>Records</th><th>Flags</th><th></th></tr></thead>
        <tbody>${filtered.map(r=>`<tr>
          <td>${r.source_file_name}</td><td>${r.transporter}</td><td>${r.supplier}</td><td>${r.period}</td>
          <td><span class="status-pill ${r.status.includes("WARNING")?"status-warn":r.status==="ACCEPTED"?"status-ok":"status-err"}">${fmtStatus(r.status)}</span></td>
          <td>${r.validation_summary.acceptedRecords}</td><td>${r.validation_summary.warnings}</td>
          <td><button class="drill-link" data-drill-supplier="${r.supplier_id}">View Details →</button></td>
        </tr>`).join("")||`<tr><td colspan="8"><div class="empty">No uploads yet.</div></td></tr>`}</tbody>
      </table></div>
    </section>`;
}

// ─── Helper: transporter info ─────────────────────────────────────────────────
function transporterNetworkName(id){const m={NGIC:"National Gas Transmission Network",GASLINK:"Greater Lagos Industrial Area Network",CHGC:"Trans Amadi / Greater Port Harcourt Network",ACCUGAS:"Uquo to South-East Gas Network",SNG:"Shell Nigeria Gas Distribution Network"};return m[id]||"Registered network";}
function transporterRegions(id){const m={NGIC:["National","Western","Eastern"],GASLINK:["Lagos","Ogun"],CHGC:["Rivers"],ACCUGAS:["Akwa Ibom","Cross River"],SNG:["Ogun","Abia","Rivers"]};return m[id]||[];}
function exitName(id){return state.bootstrap.exitPoints.find(p=>p.id===id)?.name||id||"Unassigned";}

// ─── Main Router ──────────────────────────────────────────────────────────────
function renderApp(){
  if(!state.auth)return;
  _tipReg={};_tipSeq=0;
  renderNav();
  if(state.drillTransporter){renderTransporterDrilldown();return;}
  if(state.drillSubmissionSub){renderSubmissionSupplierDaily();return;}
  if(state.drillSubmission){renderSubmissionGroupDetail();return;}
  if(state.drillSupplier){renderSupplierDetail(state.drillSupplier);return;}
  if(state.drillCustomer){renderCustomerDetail(state.drillCustomer);return;}
  const v=state.view,role=state.auth.role,isViewer=role==="viewer",isAdmin=role==="admin"||isViewer;
  if(isAdmin){
    if(v==="dashboard")isViewer?renderLimitedDashboard():renderAdminDashboard();
    else if(v==="cases")renderCasesPage();
    else if(isViewer&&v==="suppliers")renderRegistryPage("suppliers");
    else if(isViewer&&v==="shippers")renderRegistryPage("shippers");
    else if(isViewer&&v==="customers")renderRegistryPage("customers");
    else if(isViewer)renderLimitedDashboard();
    else if(v==="transportation")renderReportsPage();
    else if(v==="reports")renderReportsPage();
    else if(v==="dgdr")renderDgdrPage();
    else if(v==="utilization")renderUtilizationPage();
    else if(v==="exceptions")renderExceptionsPage();
    else if(v==="escalations")renderEscalationsPage();
    else if(v==="knowledge")renderKnowledgePage();
    else if(v==="ai")renderAiPage();
    else if(v==="transporters")renderRegistryPage("transporters");
    else if(v==="suppliers")renderRegistryPage("suppliers");
    else if(v==="shippers")renderRegistryPage("shippers");
    else if(v==="customers")renderRegistryPage("customers");
    else if(v==="points")renderPointsPage();
    else if(v==="thresholds")renderThresholdsPage();
    else if(v==="users")renderUsersPage();
    else renderAdminDashboard();
  }else if(role==="gasco"){
    if(v==="dashboard")renderLimitedDashboard();
    else if(v==="nomination")renderGascoNominationPage();
    else if(v==="cases")renderCasesPage();
    else if(v==="profile")renderProfilePage();
    else renderLimitedDashboard();
  }else if(role==="shipper"){
    if(v==="dashboard")renderShipperDashboard();
    else if(v==="shipperNomination")renderShipperNominationPage();
    else if(v==="uploads")renderUploadsPage(true);
    else if(v==="cases")renderCasesPage();
    else if(v==="profile")renderProfilePage();
    else renderShipperDashboard();
  }else{
    if(v==="dashboard")renderTransporterDashboard();
    else if(v==="uploads")renderUploadsPage(true);
    else if(v==="cases")renderCasesPage();
    else if(v==="profile")renderProfilePage();
    else renderTransporterDashboard();
  }
  renderNotifBell();
  renderIcons();
}

// ─── Limited dashboard (Viewer / GASCO roles) — 5 KPI cards + trend only ──────
function renderLimitedDashboard(){
  const selectedYear=_activeFilters._year||"2026";
  const useSynthetic=selectedYear!=="2026";
  const dailySeries=useSynthetic?synthDailySeriesForYear(selectedYear):(state.report?.dailySeries||[]);
  const k=useSynthetic?synthKpisFromSeries(dailySeries):state.report.kpis;
  const mlfPct=k.totalInjection?((k.totalMlfLoss/k.totalInjection)*100):0;
  $("#pageContent").innerHTML=`
    ${pageHeader("Dashboard","Daily injection, attribution, and network trend overview.")}
    ${timeFilterBar()}
    <section class="kpi-grid-6">
      ${metricCard("Total Injection",fmt(k.totalInjection),"MMScf","arrow-up-right","dashboard",dailySeries)}
      ${metricCard("Effective Attribution",fmt(k.effectiveAttribution),"MMScf","activity","dashboard",dailySeries)}
      ${metricCard("Shrinkage",fmt(k.totalShrinkage),"MMScf","sliders-horizontal","dashboard",dailySeries)}
      ${metricCard("Imbalance",fmt(k.totalImbalance),"MMScf","scale","dashboard",dailySeries)}
      ${metricCard("MLF",`${fmt(mlfPct)}%`,"% loss","percent","dashboard",dailySeries)}
    </section>
    <section class="card chart-card dashboard-wide-card">
      <div class="card-title"><h2>Flow Trend</h2><span>Daily injection vs. effective attribution vs. shrinkage — hover any bar for details</span></div>
      ${performanceChart(dailySeries)}
      <div class="chart-legend">
        <span><span class="legend-dot" style="background:var(--green-dark)"></span>Injection</span>
        <span><span class="legend-dot" style="background:#58b96b"></span>Effective attribution</span>
        <span><span class="legend-dot" style="background:#bedaaa"></span>Shrinkage</span>
        <span><span class="legend-dot" style="background:#f0b33b"></span>MLF loss</span>
        <span><span class="legend-dot" style="background:#cf3e3e"></span>Imbalance</span>
      </div>
    </section>`;
}

// ─── GASCO Nomination & Quality page ──────────────────────────────────────────
async function renderGascoNominationPage(){
  const supplierId=state.auth?.supplierId;
  const sup=state.bootstrap.suppliers.find(s=>s.id===supplierId);
  const result=supplierId?await api(`/api/gasco/nominations?supplier=${supplierId}`):{nominations:[]};
  const rows=result.nominations||[];
  $("#pageContent").innerHTML=`
    ${pageHeader("Nomination & Quality",`${sup?sup.name+" — ":""}previous day's nominated volume and injection, the gas quality (lab) report backing it, and today's projection.`)}
    <article class="card registry-card">
      <div class="card-title"><h2>Daily Nomination & Quality Submissions</h2><button class="primary-btn" style="min-height:36px" data-open-nomination="true"><i data-lucide="clipboard-list"></i> New Submission</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Prev. Day Nomination</th><th>Prev. Day Injection</th><th>Quality Report</th><th>Projection Today</th><th>Dispute Note</th><th>Combined Report</th></tr></thead>
        <tbody>${rows.map(r=>`<tr class="${r.off_spec?"row-warn":""}">
          <td>${r.date}</td><td>${fmt(r.previous_day_volume_mmscf)}</td><td>${fmt(r.previous_day_injection_mmscf)}</td>
          <td>${esc(r.quality_report_file_name)}${r.off_spec?` <span class="severity error">OFF-SPEC</span>`:""}${r.quality_report_path?` <a class="report-link" style="margin:0" href="/api/quality-report-file?nominationId=${r.id}" target="_blank">View PDF</a>`:""}</td>
          <td>${fmt(r.projection_today_mmscf)}</td><td>${esc(r.dispute_note)||"—"}</td>
          <td><a class="report-link" style="margin:0" href="/api/combined-report?supplierId=${supplierId}&date=${r.date}" target="_blank"><i data-lucide="download"></i> PDF</a></td>
        </tr>`).join("")||`<tr><td colspan="7"><div class="empty">No nomination submissions yet.</div></td></tr>`}</tbody>
      </table></div>
    </article>`;
  renderIcons();
}

// ─── Entity modal ─────────────────────────────────────────────────────────────
const ENTITY_CONFIGS={
  suppliers:{title:"Supplier",endpoint:"suppliers",fields:[["code","Supplier Code","text"],["name","Supplier Name","text"],["gasPlant","Gas Plant","text"],["entryPointId","Entry Point","entrySelect"],["minPressure","Min Entry Pressure (Barg)","number"],["maxPressure","Max Entry Pressure (Barg)","number"],["dgdoTarget","Daily Obligation Target — DGDO (MMScfd)","number"]]},
  customers:{title:"Customer",endpoint:"customers",fields:[["code","Customer Code","text"],["name","Customer Name","text"],["sectorId","Sector","sectorSelect"],["exitPointId","Exit Point","exitSelect"],["contractVolume","Contract / DGDR Volume (MMScfd)","number"]]},
  transporters:{title:"Transporter",endpoint:"transporters",fields:[["code","Code","text"],["name","Name","text"],["networkName","Network Name","text"],["email","Contact Email","email"],["invite","Invite user to login","checkbox"]]},
  "entry-points":{title:"Entry Point",endpoint:"entry-points",fields:[["code","Code","text"],["name","Name","text"],["location","Location","text"],["minPressure","Min Pressure (Barg)","number"],["maxPressure","Max Pressure (Barg)","number"]]},
  "exit-points":{title:"Exit Point",endpoint:"exit-points",fields:[["code","Code","text"],["name","Name","text"],["location","Location","text"],["minPressure","Min Pressure (Barg)","number"],["maxPressure","Max Pressure (Barg)","number"],["shrinkageThreshold","Shrinkage Threshold (MMScf)","number"]]},
};

function openEntityModal(type){
  const cfg=ENTITY_CONFIGS[type];if(!cfg)return;
  state._entityType=type;
  $("#entityModalTitle").textContent=`Add ${cfg.title}`;
  $("#entityResult").innerHTML="";
  const b=state.bootstrap;
  $("#entityForm").innerHTML=cfg.fields.map(([name,label,ft])=>{
    if(ft==="sectorSelect")return`<label>${label}<select name="${name}">${(b.sectors||[]).map(s=>`<option value="${s.id}">${s.code} – ${s.name}</option>`).join("")}</select></label>`;
    if(ft==="entrySelect")return`<label>${label}<select name="${name}">${(b.entryPoints||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></label>`;
    if(ft==="exitSelect")return`<label>${label}<select name="${name}">${(b.exitPoints||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></label>`;
    if(ft==="checkbox")return`<label class="ncelas-remember" style="gap:10px;flex-direction:row;align-items:center"><input type="checkbox" name="${name}"> ${label}</label>`;
    return`<label>${label}<input name="${name}" type="${ft}" ${name==="name"?"required":""}/></label>`;
  }).join("")+`<button class="primary-btn full-btn" type="submit"><i data-lucide="plus"></i> Save ${cfg.title}</button>`;
  $("#entityModal").classList.add("open");$("#entityModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitEntity(event){
  event.preventDefault();
  const cfg=ENTITY_CONFIGS[state._entityType];if(!cfg)return;
  const payload=Object.fromEntries(new FormData(event.currentTarget).entries());
  const result=await api(`/api/registry/${cfg.endpoint}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  $("#entityResult").innerHTML=`<div class="result-line">${result.ok?"Saved successfully.":result.message}</div>`;
  if(result.ok){await refreshData();renderApp();setTimeout(()=>{$("#entityModal").classList.remove("open");},600);}
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function openUpload(){
  let h=$("#hiddenTransporterId");
  if(!h){h=document.createElement("input");h.type="hidden";h.name="transporterId";h.id="hiddenTransporterId";const f=$("#uploadForm");if(f)f.appendChild(h);}
  h.value=state.auth?.transporterId||"NGIC";
  $("#uploadModal").classList.add("open");$("#uploadModal").setAttribute("aria-hidden","false");
}

async function submitUpload(event){
  event.preventDefault();
  $("#uploadResult").innerHTML=`<div class="result-line">Processing…</div>`;
  const result=await api("/api/uploads",{method:"POST",body:new FormData(event.currentTarget)});
  const lines=[];
  if(result.ok)lines.push(`<div class="result-line"><strong>Accepted:</strong> ${result.submission.validation_summary.acceptedRecords} records.</div>`);
  for(const e of result.errors||[])lines.push(`<div class="result-line"><strong>Error:</strong> ${e.message}</div>`);
  for(const w of result.warnings||[])lines.push(`<div class="result-line"><strong>Note:</strong> ${w.message}</div>`);
  $("#uploadResult").innerHTML=lines.join("");
  if(result.ok){await refreshData();renderApp();}
}

// ─── Chat panel (floating) ────────────────────────────────────────────────────
function openChat(){updateChatContext();renderPromptGrid();const p=$("#chatPanel");if(p){p.classList.add("open");p.setAttribute("aria-hidden","false");}}
function closeChat(){const p=$("#chatPanel");if(p){p.classList.remove("open");p.setAttribute("aria-hidden","true");}state.chatEntity=null;}
function toggleExpandChat(){closeChat();setView("ai");}

function updateChatContext(){
  const el=$("#chatContext");if(!el)return;
  if(state.chatEntity)el.textContent=`${state.chatEntity.type}: ${state.chatEntity.name}`;
  else if(state.auth?.transporterId)el.textContent=`Transporter: ${state.auth.transporterId}`;
  else el.textContent="Platform-wide view";
}

function renderPromptGrid(){
  const el=$("#promptGrid");if(!el)return;
  const chatPrompts={
    supplier:n=>[`What is ${n}'s total injection?`,`Any pressure breaches for ${n}?`,`Which offtakers are linked to ${n}?`],
    customer:n=>[`${n}'s attributed volume this period?`,`Any shrinkage issues for ${n}?`,`Which shipper is linked to ${n}?`],
    transporter:n=>[`How many submissions has ${n} filed?`,`Missing submissions from ${n}?`,`${n}'s compliance score?`],
  };
  const prompts=state.chatEntity?(chatPrompts[state.chatEntity.type]?.(state.chatEntity.name)||[])
    :state.auth?.role==="transporter"
    ?["How are my submissions performing?","Any exceptions in my data?","What is my total injection this period?"]
    :["Which shipper has the highest imbalance?","Show pressure breaches this quarter.","Which offtakers are above linked delivery?","What is the line-pack status?"];
  el.innerHTML=prompts.map(p=>`<button data-prompt="${p}">${p}</button>`).join("");
}

function sendChatPanel(q=$("#chatInput")?.value?.trim()){
  if(!q)return;
  const log=$("#chatLog");
  const k=state.report.kpis;
  const entityNote=state.chatEntity?`Regarding <strong>${state.chatEntity.name}</strong>: `:"";
  const answer=`${entityNote}Total injection: <strong>${fmt(k.totalInjection)} MMScf</strong>. Effective attribution: <strong>${fmt(k.effectiveAttribution)} MMScf</strong>. Exceptions: <strong>${k.exceptions}</strong>. ${state.report.aiInsights[0]?.summary||""}`;
  if(log){
    log.innerHTML+=`<div class="chat-bubble user"><div class="chat-msg">${esc(q)}</div></div>`;
    log.innerHTML+=`<div class="chat-bubble bot"><div class="chat-avatar"><i data-lucide="sparkles"></i></div><div class="chat-msg">${answer}</div></div>`;
    log.scrollTop=log.scrollHeight;
  }
  const inp=$("#chatInput");if(inp)inp.value="";
  renderIcons();
}

function openEntityAI(type,id,name){
  state.chatEntity={type,id,name};
  openChat();
}

function openInsight(id){
  const pool=[...(state.drillReport?.aiInsights||[]),...(state.report?.aiInsights||[])];
  const item=pool.find(x=>x.id===id);if(!item)return;
  $("#drawerTitle").textContent=item.title;
  $("#drawerSummary").textContent=item.summary;
  $("#drawerAction").textContent=item.suggested_action;
  $("#drawerEvidence").innerHTML=(item.evidence||[]).map(e=>`<div class="evidence"><strong>${e.value}</strong><span>${e.label}</span></div>`).join("");
  $("#insightDrawer").classList.add("open");$("#insightDrawer").setAttribute("aria-hidden","false");
}

// ─── Potential incident detail modal ──────────────────────────────────────────
function openIncidentModal(flagId){
  const flag=(state.report?.exceptions||[]).find(f=>f.id===flagId);if(!flag)return;
  const ref=flag.regulatoryReference;
  $("#incidentModalBody").innerHTML=`
    <div class="incident-modal-head">
      <span class="severity ${flag.severity.toLowerCase()}">${flag.severity}</span>
      <h2>${esc(flag.rule.replaceAll("_"," "))}</h2>
    </div>
    <dl class="detail-dl">
      <div><dt>Entity</dt><dd>${esc(flag.shipper||flag.supplier||flag.offtaker||"Network")}</dd></div>
      <div><dt>Date</dt><dd>${flag.affected_date||"—"}</dd></div>
      <div><dt>Finding</dt><dd>${esc(flag.message)}</dd></div>
    </dl>
    <div class="ai-remark-card"><i data-lucide="sparkles"></i><p><strong>Consequence Management recommendation:</strong> ${esc(flag.recommendedAction)}</p></div>
    ${ref?`<div class="pia-ref-card"><i data-lucide="scale"></i><p><strong>Regulatory basis:</strong> ${esc(ref.act)}, ${esc(ref.section)}; ${esc(ref.code)}.</p></div>`:""}
    <div class="escalation-btn-row" style="margin-top:16px">
      ${flag.escalationId
        ?`<span class="escalation-stage-badge stage-${flag.escalationStage?.toLowerCase()}">${flag.escalationStage}</span> <button class="mini-btn" data-view-target="escalations">View in Escalations</button>`
        :`<button class="primary-btn" style="min-height:36px" data-incident-escalate="${flag.id}"><i data-lucide="triangle-alert"></i> Escalate this potential incident</button>`}
    </div>`;
  $("#incidentModal").classList.add("open");$("#incidentModal").setAttribute("aria-hidden","false");
  renderIcons();
}

// ─── Escalation report — formal letter (Word / PDF) ───────────────────────────
async function openLetterModal(caseId){
  const letter=await api(`/api/escalations/${caseId}/letter`);
  $("#letterModalBody").innerHTML=`
    <div class="formal-letter" id="printableLetter">
      <div class="formal-letter-header">
        <strong>NIGERIAN MIDSTREAM AND DOWNSTREAM PETROLEUM REGULATORY AUTHORITY (NMDPRA)</strong>
        <span>Transporter Intelligence — Compliance Monitoring</span>
      </div>
      <div class="formal-letter-meta">
        <div><span>From</span><strong>${esc(letter.fromTitle)}</strong></div>
        <div><span>To</span><strong>${esc(letter.toTitle)}</strong></div>
        <div><span>Reference</span><strong>${esc(letter.referenceNumber)}</strong></div>
        <div><span>Date</span><strong>${letter.date}</strong></div>
      </div>
      <p class="formal-letter-subject"><u>Subject: ${esc(letter.subject)}</u></p>
      ${letter.body.map(p=>`<p>${esc(p)}</p>`).join("")}
      <p class="formal-letter-stage"><strong>Stage of approval:</strong> ${esc(letter.approvalStage)}</p>
      ${letter.approvalTrail.length?`<div class="audit-trail"><strong>Audit trail — Analyst / Manager / Director / Executive comments:</strong>
        <table class="audit-trail-table"><thead><tr><th>Author</th><th>Stage</th><th>Action</th><th>Timestamp</th></tr></thead>
        <tbody>${letter.approvalTrail.map(t=>`<tr><td>${esc(t.author)}</td><td>${esc(t.stage)}</td><td>${esc(t.action)}</td><td>${new Date(t.timestamp).toLocaleString()}</td></tr>`).join("")}</tbody></table>
      </div>`:""}
      ${letter.comments.length?`<div class="letter-comments"><strong>Comments:</strong><ul>${letter.comments.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div>`:""}
    </div>
    <div class="escalation-btn-row" style="margin-top:16px">
      <button class="primary-btn" style="min-height:36px" id="printLetterBtn"><i data-lucide="printer"></i> Print</button>
      <a class="outline-btn" style="min-height:36px" href="/api/escalations/${caseId}/letter.docx"><i data-lucide="file-text"></i> Download Word (.docx)</a>
      <a class="outline-btn" style="min-height:36px" href="/api/escalations/${caseId}/letter.pdf"><i data-lucide="file-down"></i> Download PDF</a>
    </div>`;
  $("#letterModal").classList.add("open");$("#letterModal").setAttribute("aria-hidden","false");
  renderIcons();
}

// ─── Large chart modal ─────────────────────────────────────────────────────────
function openChartModal(kind){
  let title="",body="";
  if(kind==="sector-utilization"){
    const rows=state.report.utilization?.byStrategicSector||[];
    title="Sector Utilisation — Strategic Sectors";
    body=donutChart(rows.map(r=>({label:`${r.sectorId} — ${r.sector}`,value:r.effectiveAttribution||0})).filter(r=>r.value>0));
  }else if(kind==="supplier-share"){
    const rows=(state.report.gasSupplierSummary||state.report.supplierSummary||[]);
    title="Supplier / GASCO Share of Injection";
    body=donutChart(rows.map(r=>({label:r.gasSupplier||r.supplier,value:r.dgdoActual||r.injection||0})).filter(r=>r.value>0));
  }
  $("#chartModalTitle").textContent=title;
  $("#chartModalBody").innerHTML=`<div class="chart-modal-large">${body}</div>`;
  $("#chartModal").classList.add("open");$("#chartModal").setAttribute("aria-hidden","false");
  renderIcons();
}

// ─── Transporter direct daily data entry ──────────────────────────────────────
function openDailyEntryModal(){
  const suppliers=state.bootstrap?.suppliers||[];
  $("#dailyEntryForm").innerHTML=`
    <label>Date<input type="date" name="date" value="${state.bootstrap?.today||""}" required/></label>
    <label>Gas Supplier / GASCO<select name="supplierId" required>${suppliers.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></label>
    <label>Entry Pressure (Barg)<input type="number" step="any" name="entryPressure" required/></label>
    <label>Condensate (Litres)<input type="number" step="any" name="condensate"/></label>
    <label>Injection (MMScf)<input type="number" step="any" name="injection" required/></label>
    <label>MLF (Measurement Loss Factor)<input type="number" step="any" name="mlf" value="0.998"/></label>
    <button class="primary-btn full-btn" type="submit"><i data-lucide="save"></i> Submit Daily Entry</button>`;
  $("#dailyEntryResult").innerHTML="";
  $("#dailyEntryModal").classList.add("open");$("#dailyEntryModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitDailyEntry(event){
  event.preventDefault();
  const payload=Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.transporterId=state.auth?.transporterId||"NGIC";
  const result=await api("/api/daily-entry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  $("#dailyEntryResult").innerHTML=`<div class="result-line">${result.ok?"Daily entry recorded successfully.":result.message}</div>`;
  if(result.ok){await refreshData();renderApp();setTimeout(()=>{$("#dailyEntryModal").classList.remove("open");},700);}
}

// ─── Gasco/supplier daily nomination + quality workflow ───────────────────────
function openNominationModal(supplierId){
  const suppliers=state.bootstrap?.suppliers||[];
  const locked=state.auth?.role==="gasco";
  const sid=locked?state.auth.supplierId:(supplierId||state.drillSupplier||suppliers[0]?.id);
  $("#nominationForm").innerHTML=`
    <label>Gas Supplier / GASCO
      <select name="supplierId" ${locked?"disabled":""} required>${suppliers.map(s=>`<option value="${s.id}" ${s.id===sid?"selected":""}>${s.name}</option>`).join("")}</select>
      ${locked?`<input type="hidden" name="supplierId" value="${sid}"/>`:""}
    </label>
    <label>Date<input type="date" name="date" value="${state.bootstrap?.today||""}" required/></label>
    <label>Previous Day Volume — Nomination (MMScf)<input type="number" step="any" name="previousDayVolume" required/></label>
    <label>Previous Day Injection (MMScf)<input type="number" step="any" name="previousDayInjection" required/></label>
    <label>Quality (Lab) Report — PDF Upload<input type="file" name="qualityReportFile" accept="application/pdf"/></label>
    <label>Lab-Measured MLF (optional, from quality report)<input type="number" step="any" min="0" max="1" name="labMlf" placeholder="e.g. 0.9978"/></label>
    <label class="ncelas-remember" style="gap:10px;flex-direction:row;align-items:center"><input type="checkbox" name="offSpec"> Flag as off-spec (fails agreed gas quality specification)</label>
    <label>Projection for Today (MMScf)<input type="number" step="any" name="projectionToday" required/></label>
    <label>Dispute / Argue a Figure (optional)<textarea name="disputeNote" rows="2" placeholder="Use this field to formally dispute a previously recorded figure…"></textarea></label>
    <button class="primary-btn full-btn" type="submit"><i data-lucide="send"></i> Submit Nomination & Quality Report</button>`;
  $("#nominationResult").innerHTML="";
  $("#nominationModal").classList.add("open");$("#nominationModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitNomination(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);
  const r=await fetch("/api/gasco/nominations",{method:"POST",body:fd});
  const result=await r.json();
  $("#nominationResult").innerHTML=`<div class="result-line">${result.ok?"Nomination & quality report submitted.":result.message}</div>`;
  if(result.ok){
    await refreshData();
    if(state.drillSupplier)await renderSupplierDetail(state.drillSupplier);else renderApp();
    setTimeout(()=>{$("#nominationModal").classList.remove("open");},700);
  }
}

// ─── Shipper self-reported nomination (direct entry, cross-checked vs transporter data) ──
function shipperNominationRow(r){
  const hasCompare=r.transporterInjectionMmscf!==null&&r.transporterInjectionMmscf!==undefined;
  return `<tr class="${r.hasDiscrepancy?"row-warn":""}">
    <td>${r.date}</td>
    <td>${fmt(r.nominated_volume_mmscf)}</td>
    <td>${hasCompare?fmt(r.transporterInjectionMmscf):"—"}</td>
    <td>${hasCompare?`<span class="status-chip ${r.hasDiscrepancy?"over":"within"}">${r.variancePct>0?"+":""}${fmt(r.variancePct)}%</span>`:`<span class="muted" style="font-size:12.5px">No transporter record yet</span>`}</td>
    <td>${esc(r.note)||"—"}</td>
    <td>${r.hasFile?`<a class="report-link" style="margin:0" href="/api/shipper/nominations/${r.id}/file" target="_blank"><i data-lucide="download"></i> ${esc(r.file_name)}</a>`:"—"}</td>
  </tr>`;
}

async function renderShipperNominationPage(){
  const shipperId=state.auth?.shipperId;
  const rows=await fetchShipperNominations(shipperId);
  const linkedSupplier=state.bootstrap?.shippers?.find(s=>s.id===shipperId);
  const discrepancies=rows.filter(r=>r.hasDiscrepancy).length;
  $("#pageContent").innerHTML=`
    ${pageHeader("My Nominations",`Log the volume ${esc(linkedSupplier?.name||"your organisation")} nominated each gas day, directly or with a supporting file — cross-checked against the transporter's reported figure for the same day.`,
      `<button class="primary-btn" data-open-shipper-nomination><i data-lucide="plus"></i> Log Nomination</button>`)}
    ${discrepancies?`<div style="display:flex;align-items:center;gap:10px;background:#fff4da;color:#8c5f06;padding:12px 16px;border-radius:14px;margin-bottom:16px;font-size:13.5px;font-weight:700"><i data-lucide="triangle-alert"></i> ${discrepancies} nomination${discrepancies>1?"s":""} differ from the transporter's reported figure by more than ${state.bootstrap?.monitoringConfig?.nominationVariancePct||5}%.</div>`:""}
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Your Nominated Volume (MMScf)</th><th>Transporter-Reported Injection (MMScf)</th><th>Variance</th><th>Note</th><th>Supporting File</th></tr></thead>
      <tbody>${rows.map(shipperNominationRow).join("")||`<tr><td colspan="6"><div class="empty">No nominations logged yet. Use Log Nomination to record your first one.</div></td></tr>`}</tbody>
    </table></div>`;
  renderIcons();
}

function openShipperNominationModal(){
  $("#shipperNominationForm").innerHTML=`
    <label>Date<input type="date" name="date" value="${state.bootstrap?.today||""}" required/></label>
    <label>Volume You Nominated (MMScf)<input type="number" step="any" name="nominatedVolume" required/></label>
    <label>Note (optional)<textarea name="note" rows="2" placeholder="Any context for this nomination"></textarea></label>
    <label>Supporting Document (optional)<input type="file" name="file"/></label>
    <input type="hidden" name="shipperId" value="${state.auth?.shipperId||""}"/>
    <button class="primary-btn full-btn" type="submit"><i data-lucide="send"></i> Submit Nomination</button>`;
  $("#shipperNominationResult").innerHTML="";
  $("#shipperNominationModal").classList.add("open");$("#shipperNominationModal").setAttribute("aria-hidden","false");
  renderIcons();
}

async function submitShipperNomination(event){
  event.preventDefault();
  const fd=new FormData(event.currentTarget);
  const r=await fetch("/api/shipper/nominations",{method:"POST",body:fd});
  const result=await r.json();
  $("#shipperNominationResult").innerHTML=`<div class="result-line">${result.ok?"Nomination submitted.":result.message}</div>`;
  if(result.ok){
    await renderShipperNominationPage();
    showToast(result.nomination?.hasDiscrepancy?"Nomination submitted — discrepancy flagged against transporter figure.":"Nomination submitted.",result.nomination?.hasDiscrepancy?"error":"success");
    setTimeout(()=>{$("#shipperNominationModal").classList.remove("open");},700);
  }
}

// ─── Add User modal ───────────────────────────────────────────────────────────
function openAddUserModal(){const m=$("#addUserModal");if(!m)return;$("#addUserResult").innerHTML="";m.classList.add("open");m.setAttribute("aria-hidden","false");}
function closeAddUserModal(){const m=$("#addUserModal");if(!m)return;m.classList.remove("open");m.setAttribute("aria-hidden","true");}

function submitAddUser(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const fn=fd.get("firstName")?.trim(),ln=fd.get("lastName")?.trim(),em=fd.get("email")?.trim(),ut=fd.get("userType"),invite=fd.get("invite");
  if(!fn||!ln||!em||!ut){$("#addUserResult").innerHTML=`<div class="result-line">Fill all required fields.</div>`;return;}
  mockUsers.push({id:`USR-${String(mockUsers.length+1).padStart(3,"0")}`,firstName:fn,lastName:ln,email:em,userType:ut,role:ut==="viewer"?"viewer":"admin",status:"active",lastLogin:"—"});
  $("#addUserResult").innerHTML=`<div class="result-line" style="color:var(--green)">User added${invite?" — invitation sent":""}.</div>`;
  setTimeout(()=>{closeAddUserModal();renderUsersPage();renderIcons();},700);
}

function toggleUserStatus(userId){
  const u=mockUsers.find(x=>x.id===userId);if(!u)return;
  u.status=u.status==="active"?"inactive":"active";
  renderUsersPage();renderIcons();
}

// ─── Event Binding ────────────────────────────────────────────────────────────
function bindEvents(){
  document.body.addEventListener("click",async e=>{
    // Public
    if(e.target.closest("#goLogin")||e.target.closest("#heroGetStarted")||e.target.closest("#ctaGetStarted")){showPublic(true);return;}
    if(e.target.closest("#backToHome")){showPublic(false);return;}
    if(e.target.closest("#loginBtn")){doLogin();return;}
    if(e.target.closest("#msLoginBtn")){showLoginError("Microsoft SSO not configured in demo.");return;}
    const faqQ=e.target.closest(".ncelas-faq-q");
    if(faqQ){faqQ.closest(".ncelas-faq-item")?.classList.toggle("open");renderIcons();return;}
    if(e.target.closest("#logoutBtn")){doLogout();return;}

    // Notifications bell
    if(e.target.closest("#notifBell")){state.notifOpen=!state.notifOpen;renderNotifBell();return;}
    if(state.notifOpen&&!e.target.closest(".notif-wrap")){state.notifOpen=false;renderNotifBell();}
    const dismissBannerEl=e.target.closest("[data-dismiss-banner]");
    if(dismissBannerEl){state.bannerDismissed=true;renderApp();return;}

    // Nav accordion
    const accBtn=e.target.closest("[data-accordion]");
    if(accBtn){const key=accBtn.dataset.accordion;state.navAccordion[key]=!state.navAccordion[key];$(`#acc-${key}`)?.classList.toggle("open",state.navAccordion[key]);accBtn.classList.toggle("open",state.navAccordion[key]);renderIcons();return;}

    // Nav
    const navItem=e.target.closest(".nav-item[data-view]");
    if(navItem){state.subView=null;setView(navItem.dataset.view);return;}
    const viewTarget=e.target.closest("[data-view-target]");
    if(viewTarget){state.drillSupplier=state.drillCustomer=state.drillTransporter=state.drillSubmission=state.drillSubmissionSub=null;state.dgdrSupplierDrill=null;setView(viewTarget.dataset.viewTarget);return;}

    // Back btn — resolve from drill state
    if(e.target.closest("[data-back-btn]")){
      if(state.sectorDrill){state.sectorDrill=null;renderUtilizationPage();renderIcons();}
      else if(state.drillSubmissionSub){state.drillSubmissionSub=null;renderApp();}
      else if(state.drillSubmission){state.drillSubmission=null;state.view="reports";renderApp();}
      else if(state.drillSupplier){state.drillSupplier=null;state.drillReport=null;renderApp();}
      else if(state.drillCustomer){state.drillCustomer=null;renderApp();}
      else if(state.drillTransporter){state.drillTransporter=null;renderApp();}
      return;
    }

    // Sub-view tabs
    const svEl=e.target.closest("[data-sub-view]");
    if(svEl){state.subView=svEl.dataset.subView;if(state.view==="reports"||state.view==="transportation")renderReportsPage();else if(state.view==="exceptions")renderExceptionsPage();renderIcons();return;}
    const utilModeEl=e.target.closest("[data-util-mode]");
    if(utilModeEl){
      state.utilizationMode=utilModeEl.dataset.utilMode;
      state.sectorDrill=null;
      if(state.view==="reports")renderReportsPage();else renderUtilizationPage();
      renderIcons();
      return;
    }
    const sectorDrillEl=e.target.closest("[data-sector-drill]");
    if(sectorDrillEl){
      state.view="utilization";
      state.sectorDrill={sectorId:sectorDrillEl.dataset.sectorDrill,kind:sectorDrillEl.dataset.sectorKind};
      renderUtilizationPage();
      renderIcons();
      return;
    }

    // Supplier tab
    const stEl=e.target.closest("[data-supplier-tab]");
    if(stEl){state.drillSupplierTab=stEl.dataset.supplierTab;if(state.drillSupplier)await renderSupplierDetail(state.drillSupplier);return;}

    // Submission drills
    const sgEl=e.target.closest("[data-drill-sub-group]");
    if(sgEl){state.drillSubmission=sgEl.dataset.drillSubGroup;state.drillSubmissionSub=null;renderApp();return;}
    const ssEl=e.target.closest("[data-drill-sub-supplier]");
    if(ssEl){state.drillSubmissionSub=ssEl.dataset.drillSubSupplier;renderApp();return;}

    // Entity drills
    const dtEl=e.target.closest("[data-drill-transporter]");
    if(dtEl){state.drillSupplier=state.drillCustomer=null;state.drillTransporter=dtEl.dataset.drillTransporter;renderTransporterDrilldown();return;}
    const dsEl=e.target.closest("[data-drill-supplier]");
    if(dsEl){state.drillTransporter=state.drillCustomer=null;state.drillSubmission=state.drillSubmissionSub=null;state.drillSupplierTab="details";await renderSupplierDetail(dsEl.dataset.drillSupplier);return;}
    const dcEl=e.target.closest("[data-drill-customer]");
    if(dcEl){state.drillTransporter=state.drillSupplier=null;state.drillCustomer=dcEl.dataset.drillCustomer;await renderCustomerDetail(dcEl.dataset.drillCustomer);return;}

    // Add entity
    const addEnt=e.target.closest("[data-add-entity]");
    if(addEnt){openEntityModal(addEnt.dataset.addEntity);return;}

    // Users
    if(e.target.closest("#openAddUser")){openAddUserModal();return;}
    if(e.target.closest("#closeAddUserModal")){closeAddUserModal();return;}
    const utEl=e.target.closest("[data-user-toggle]");
    if(utEl){toggleUserStatus(utEl.dataset.userToggle);return;}

    // Upload
    if(e.target.closest("[data-open-upload]")){openUpload();return;}
    if(e.target.closest("#closeUpload")){$("#uploadModal").classList.remove("open");return;}
    if(e.target.closest("#closeEntityModal")){$("#entityModal").classList.remove("open");return;}

    // Insight
    const dismissInsEl=e.target.closest("[data-dismiss-insight]");
    if(dismissInsEl){state.dismissedInsights.add(dismissInsEl.dataset.dismissInsight);renderApp();return;}
    const insEl=e.target.closest("[data-insight]");
    if(insEl){openInsight(insEl.dataset.insight);return;}
    if(e.target.closest("#closeDrawer")){$("#insightDrawer").classList.remove("open");return;}

    // Chat panel
    if(e.target.closest("#chatLauncher")){openChat();return;}
    if(e.target.closest("#closeChat")){closeChat();return;}
    if(e.target.closest("#expandChat")){toggleExpandChat();return;}
    const promptEl=e.target.closest("[data-prompt]");
    if(promptEl){sendChatPanel(promptEl.dataset.prompt);return;}
    if(e.target.closest("#sendChat")){sendChatPanel();return;}

    // Ask AI entity
    const aiEnt=e.target.closest(".ask-ai-entity-btn");
    if(aiEnt){openEntityAI(aiEnt.dataset.entityType,aiEnt.dataset.entityId,aiEnt.dataset.entityName);return;}

    // AI page
    const convEl=e.target.closest("[data-ai-conv]");
    if(convEl){state.aiActiveConv=convEl.dataset.aiConv;renderAiPage();return;}
    if(e.target.closest("#aiNewChat")){state.aiActiveConv=null;renderAiPage();return;}
    const aiPromptEl=e.target.closest("[data-ai-prompt]");
    if(aiPromptEl){sendAiMessage(aiPromptEl.dataset.aiPrompt);return;}
    if(e.target.closest("#aiSendBtn")){sendAiMessage();return;}

    // Thresholds
    const saveT=e.target.closest(".save-threshold");
    if(saveT){await saveThreshold(saveT.dataset.rule);renderIcons();return;}

    // Critical incidents card pagination
    const incPageEl=e.target.closest("[data-incidents-page]");
    if(incPageEl){
      const dir=incPageEl.dataset.incidentsPage;
      state.criticalIncidentsPage=Math.max(0,(state.criticalIncidentsPage||0)+(dir==="next"?1:-1));
      renderApp();
      return;
    }

    // Escalations
    const escFlagEl=e.target.closest("[data-escalate-flag]");
    if(escFlagEl){
      await createEscalation(escFlagEl.dataset.escalateFlag);
      state.report=await fetchReport();
      renderApp();
      showToast("Escalation case opened.");
      return;
    }
    const escStageFilterEl=e.target.closest("[data-esc-stage-filter]");
    if(escStageFilterEl){
      state.escalationStageFilter=escStageFilterEl.dataset.escStageFilter||null;
      await renderEscalationsPage();
      renderIcons();
      return;
    }
    const escActionEl=e.target.closest("[data-esc-action]");
    if(escActionEl){
      const caseId=escActionEl.dataset.escCase;
      const action=escActionEl.dataset.escAction;
      const noteInput=document.querySelector(`.escalation-note-input[data-note-for="${caseId}"]`);
      const note=noteInput?.value?.trim()||"";
      if(action==="comment"&&!note){noteInput?.focus();return;}
      const modalWasOpen=$("#escalationModal")?.classList.contains("open");
      const result=await postEscalationAction(caseId,action,note);
      await renderEscalationsPage();
      if(modalWasOpen)openEscalationModal(caseId);
      renderIcons();
      if(result?.ok){
        const stageLabel=result.case?.stageLabel;
        const toastMsg=action==="advance"?`Case escalated to ${stageLabel}.`
          :action==="resolve"?"Case marked resolved."
          :action==="close"?"Case closed."
          :action==="reopen"?"Case reopened."
          :action==="comment"?"Note added.":"Case updated.";
        showToast(toastMsg);
      }else if(result&&!result.ok){
        showToast(result.message||"Action failed.","error");
      }
      return;
    }

    // Generate escalation report letter
    const genLetterEl=e.target.closest("[data-gen-letter]");
    if(genLetterEl){await openLetterModal(genLetterEl.dataset.genLetter);return;}
    if(e.target.closest("#printLetterBtn")){window.print();return;}
    if(e.target.closest("#closeLetterModal")){$("#letterModal").classList.remove("open");return;}

    // Supplier Delivery Performance drill-down (nomination share pie)
    const supPieDrillEl=e.target.closest("[data-supplier-pie-drill]");
    if(supPieDrillEl){state.dgdrSupplierDrill=supPieDrillEl.dataset.supplierPieDrill;await renderDgdrPage();renderIcons();return;}
    if(e.target.closest("[data-close-supplier-drill]")){state.dgdrSupplierDrill=null;await renderDgdrPage();renderIcons();return;}

    // Potential incident detail modal
    const openIncEl=e.target.closest("[data-open-incident]");
    if(openIncEl){openIncidentModal(openIncEl.dataset.openIncident);return;}
    if(e.target.closest("#closeIncidentModal")){$("#incidentModal").classList.remove("open");return;}
    const incEscEl=e.target.closest("[data-incident-escalate]");
    if(incEscEl){
      await createEscalation(incEscEl.dataset.incidentEscalate);
      state.report=await fetchReport();
      $("#incidentModal").classList.remove("open");
      renderApp();
      showToast("Escalation case opened.");
      return;
    }

    // Large chart modal
    if(e.target.closest("#closeChartModal")){$("#chartModal").classList.remove("open");return;}
    const bigChartEl=e.target.closest("[data-open-chart]");
    if(bigChartEl){openChartModal(bigChartEl.dataset.openChart);return;}

    // Flow chart mode toggle
    const flowModeEl=e.target.closest("[data-flow-mode]");
    if(flowModeEl){state.flowChartMode=flowModeEl.dataset.flowMode;renderApp();return;}

    // Daily entry (transporter direct data entry)
    if(e.target.closest("[data-open-daily-entry]")){openDailyEntryModal();return;}
    if(e.target.closest("#closeDailyEntryModal")){$("#dailyEntryModal").classList.remove("open");return;}

    // Gasco nomination modal
    if(e.target.closest("[data-open-nomination]")){openNominationModal();return;}
    if(e.target.closest("#closeNominationModal")){$("#nominationModal").classList.remove("open");return;}

    // KPI nav
    const kpiEl=e.target.closest(".kpi-clickable");
    if(kpiEl){setView(kpiEl.dataset.viewTarget);return;}

    // Date filter dropdown (consolidated presets + year + custom range)
    if(e.target.closest("#dateFilterToggle")){state.showDateFilterPanel=!state.showDateFilterPanel;renderApp();return;}

    // Time preset
    const tpEl=e.target.closest("[data-time-preset]");
    if(tpEl){
      const p=TIME_PRESETS.find(x=>x[0]===tpEl.dataset.timePreset);if(!p)return;
      _activeFilters={..._activeFilters,startDate:p[2],endDate:p[3]};
      if(!p[2])delete _activeFilters.startDate;
      if(!p[3])delete _activeFilters.endDate;
      state.showCustomDateRange=false;
      state.showDateFilterPanel=false;
      await refreshData();renderApp();return;
    }
    const thEl=e.target.closest("[data-time-half]");
    if(thEl){
      const year=_activeFilters._year||YEAR_RANGE[0];
      const half=halfYearPreset(year);
      const kind=thEl.dataset.timeHalf;
      if(kind==="h1"){_activeFilters.startDate=half.h1[0];_activeFilters.endDate=half.h1[1];}
      else if(kind==="h2"){_activeFilters.startDate=half.h2[0];_activeFilters.endDate=half.h2[1];}
      else {_activeFilters.startDate=`${year}-01-01`;_activeFilters.endDate=`${year}-12-31`;}
      state.showCustomDateRange=false;
      state.showDateFilterPanel=false;
      await refreshData();renderApp();return;
    }
    if(e.target.closest("#tf-custom-toggle")){state.showCustomDateRange=!state.showCustomDateRange;renderApp();return;}
    if(e.target.closest("#tf-custom-apply")){
      const sv=$("#tf-start")?.value,ev=$("#tf-end")?.value;
      if(sv)_activeFilters.startDate=sv;else delete _activeFilters.startDate;
      if(ev)_activeFilters.endDate=ev;else delete _activeFilters.endDate;
      state.showDateFilterPanel=false;
      await refreshData();renderApp();return;
    }

    // Potential Incidents filter reset
    if(e.target.closest("#incidentsFilterReset")){
      delete _activeFilters.startDate;delete _activeFilters.endDate;delete _activeFilters._year;
      state.incidentSeverityFilter="";state.subView="threshold";state.showDateFilterPanel=false;
      await refreshData();renderApp();return;
    }

    // Escalation detail modal
    const openEscEl=e.target.closest("[data-open-escalation]");
    if(openEscEl){openEscalationModal(openEscEl.dataset.openEscalation);return;}
    if(e.target.closest("#closeEscalationModal")){$("#escalationModal").classList.remove("open");return;}

    // Escalation card/list view toggle
    const escViewEl=e.target.closest("[data-esc-view-mode]");
    if(escViewEl){state.escalationViewMode=escViewEl.dataset.escViewMode;await renderEscalationsPage();renderIcons();return;}

    // Knowledge Base
    if(e.target.closest("[data-open-knowledge-upload]")){openKnowledgeUploadModal();return;}
    if(e.target.closest("#closeKnowledgeUploadModal")){$("#knowledgeUploadModal").classList.remove("open");return;}
    const kbCatEl=e.target.closest("[data-kb-category-filter]");
    if(kbCatEl){state.knowledgeCategoryFilter=kbCatEl.dataset.kbCategoryFilter||null;await renderKnowledgePage();return;}
    const kbDeleteEl=e.target.closest("[data-delete-kb-doc]");
    if(kbDeleteEl){
      if(confirm("Remove this document from the Knowledge Base?")){
        await deleteKnowledgeDoc(kbDeleteEl.dataset.deleteKbDoc);
        await renderKnowledgePage();
      }
      return;
    }

    // Case Management
    if(e.target.closest("[data-open-log-case]")){openLogCaseModal();return;}
    if(e.target.closest("#closeLogCaseModal")){$("#logCaseModal").classList.remove("open");return;}
    if(e.target.closest("#closeCaseDetailModal")){$("#caseDetailModal").classList.remove("open");return;}

    // Shipper self-reported nomination
    if(e.target.closest("[data-open-shipper-nomination]")){openShipperNominationModal();return;}
    if(e.target.closest("#closeShipperNominationModal")){$("#shipperNominationModal").classList.remove("open");return;}
    const openCaseEl=e.target.closest("[data-open-case]");
    if(openCaseEl){openCaseDetailModal(openCaseEl.dataset.openCase);return;}
    const caseStatusFilterEl=e.target.closest("[data-case-status-filter]");
    if(caseStatusFilterEl){state.caseStatusFilter=caseStatusFilterEl.dataset.caseStatusFilter||null;await renderCasesPage();renderIcons();return;}
    const caseViewEl=e.target.closest("[data-case-view-mode]");
    if(caseViewEl){state.caseViewMode=caseViewEl.dataset.caseViewMode;await renderCasesPage();renderIcons();return;}
    const caseActionEl=e.target.closest("[data-case-action]");
    if(caseActionEl){
      const caseId=caseActionEl.dataset.caseId;
      const action=caseActionEl.dataset.caseAction;
      const noteInput=document.querySelector(`.escalation-note-input[data-case-note-for="${caseId}"]`);
      const assigneeInput=document.querySelector(`.escalation-note-input[data-case-assignee-for="${caseId}"]`);
      const note=noteInput?.value?.trim()||"";
      if(action==="comment"&&!note){noteInput?.focus();return;}
      if(action==="assign"&&!assigneeInput?.value?.trim()){assigneeInput?.focus();return;}
      const assignedTo=assigneeInput?.value?.trim();
      const modalWasOpen=$("#caseDetailModal")?.classList.contains("open");
      const result=await postCaseAction(caseId,action,{note,assignedTo});
      await renderCasesPage();
      if(modalWasOpen)openCaseDetailModal(caseId);
      renderIcons();
      if(result?.ok){
        const toastMsg=action==="assign"?`Case assigned to ${assignedTo}.`
          :action==="start"?"Investigation started."
          :action==="resolve"?"Case marked resolved."
          :action==="close"?"Case closed."
          :action==="reopen"?"Case reopened."
          :action==="comment"?"Note added.":"Case updated.";
        showToast(toastMsg);
      }else if(result&&!result.ok){
        showToast(result.message||"Action failed.","error");
      }
      return;
    }

    // Page filters apply
    const pfApply=e.target.closest("[data-filter-apply]");
    if(pfApply){
      const extra={};
      const t=$("#pf-transporter");if(t?.value)extra.transporter=t.value;else delete _activeFilters.transporter;
      const sh=$("#pf-shipper");if(sh?.value)extra.shipper=sh.value;else delete _activeFilters.shipper;
      const s=$("#pf-supplier");if(s?.value)extra.supplier=s.value;else delete _activeFilters.supplier;
      const c=$("#pf-customer");if(c?.value)extra.customer=c.value;else delete _activeFilters.customer;
      const et=$("#pf-exceptionType");if(et?.value)extra.exceptionType=et.value;else delete _activeFilters.exceptionType;
      const sv=$("#pf-severity");if(sv?.value)extra.severity=sv.value;else delete _activeFilters.severity;
      const sec=$("#pf-sector");if(sec?.value)extra.sector=sec.value;else delete _activeFilters.sector;
      _activeFilters={..._activeFilters,...extra};
      await refreshData();renderApp();return;
    }
    const pfReset=e.target.closest("[data-filter-reset]");
    if(pfReset){_activeFilters={};await refreshData();renderApp();return;}

    // Export
    if(e.target.closest("#exportTable")){exportTableCSV();return;}

    // Highlight toggle
    const ht=e.target.closest("#highlightToggle");
    if(ht){$("#supplierLogTable")?.classList.toggle("no-highlight",!ht.checked);return;}
  });

  document.body.addEventListener("change",e=>{
    if(e.target.id==="demoSelect"){
      const acc=DEMO_ACCOUNTS[parseInt(e.target.value)];
      if(acc){const em=$("#loginEmail");if(em)em.value=acc.email;const pw=$("#loginPassword");if(pw)pw.value="demo1234";}
    }
    if(e.target.id==="tf-year"){_activeFilters._year=e.target.value;renderApp();}
    if(e.target.id==="pf-category"){state.subView=e.target.value;renderExceptionsPage();renderIcons();}
    if(e.target.id==="pf-severity"){state.incidentSeverityFilter=e.target.value;renderExceptionsPage();renderIcons();}
  });

  // Chart hover tooltip (delegated — chart markup is rebuilt on every render)
  document.body.addEventListener("mousemove",e=>{
    const tip=$("#chartTooltip");if(!tip)return;
    const hit=e.target.closest(".chart-hit-col");
    const data=hit&&_tipReg[hit.dataset.tipId];
    if(!data){tip.classList.remove("visible");return;}
    tip.innerHTML=`<div class="ctt-title">${esc(data.label)}</div>`+data.items.map(it=>`<div class="ctt-row"><span class="ctt-row-label"><span class="ctt-dot" style="background:${it.color}"></span>${esc(it.name)}</span><strong class="ctt-val">${it.value}</strong></div>`).join("");
    tip.classList.add("visible");
    const pad=16,vw=window.innerWidth,vh=window.innerHeight;
    let x=e.clientX+pad,y=e.clientY+pad;
    const rect=tip.getBoundingClientRect();
    if(x+rect.width>vw-8)x=e.clientX-rect.width-pad;
    if(y+rect.height>vh-8)y=e.clientY-rect.height-pad;
    tip.style.left=`${x}px`;tip.style.top=`${y}px`;
  });
  document.body.addEventListener("mouseleave",()=>{$("#chartTooltip")?.classList.remove("visible");},true);

  const ef=$("#entityForm");if(ef)ef.addEventListener("submit",submitEntity);
  const af=$("#addUserForm");if(af)af.addEventListener("submit",submitAddUser);
  const uf=$("#uploadForm");if(uf)uf.addEventListener("submit",submitUpload);
  const def=$("#dailyEntryForm");if(def)def.addEventListener("submit",submitDailyEntry);
  const nf=$("#nominationForm");if(nf)nf.addEventListener("submit",submitNomination);
  const kuf=$("#knowledgeUploadForm");if(kuf)kuf.addEventListener("submit",submitKnowledgeUpload);
  const lcf=$("#logCaseForm");if(lcf)lcf.addEventListener("submit",submitLogCase);
  const snf=$("#shipperNominationForm");if(snf)snf.addEventListener("submit",submitShipperNomination);
  const wf=$("#workbookFile");if(wf)wf.addEventListener("change",e=>{const fn=$("#fileName");if(fn)fn.textContent=e.target.files[0]?.name||"No file selected";});
  const ci=$("#chatInput");if(ci)ci.addEventListener("keydown",e=>e.key==="Enter"&&sendChatPanel());
}

function exportTableCSV(){
  const t=document.querySelector("#pageContent table");if(!t)return;
  const rows=Array.from(t.querySelectorAll("tr")).map(tr=>Array.from(tr.querySelectorAll("th,td")).map(cell=>`"${cell.textContent.trim().replace(/"/g,'""')}"`).join(","));
  const blob=new Blob([rows.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="transporter-data.csv";a.click();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init(){
  bindEvents();
  try{const s=localStorage.getItem("ti_auth");if(s)state.auth=JSON.parse(s);}catch(_){}
  if(state.auth)await enterApp();
  else showPublic(false);
}

init().catch(err=>{document.body.innerHTML=`<main style="padding:40px;color:#cf3e3e">Failed to start: ${err.message}</main>`;});
