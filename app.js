// Konfigurasi Firebase Realtime Database
const firebaseConfig = {
  databaseURL: "https://aisyarah-app-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const $ = (s) => document.querySelector(s); const $$ = (s) => [...document.querySelectorAll(s)];

let appData = {
  mood: [],
  notes: [],
  memories: [],
  plans: []
};

// Ambil dan pantau data secara real-time dari Firebase
db.ref("ira_aisyarah_space").on("value", (snapshot) => {
  const val = snapshot.val();
  if (val) {
    appData = {
      mood: val.mood || [],
      notes: val.notes || [],
      memories: val.memories || [],
      plans: val.plans || []
    };
  }
  renderAll();
});

function syncToFirebase() {
  db.ref("ira_aisyarah_space").set(appData);
}

function toast(message){
  const el = $("#toast");   el.textContent = message;   el.classList.add("show");   clearTimeout(window.toastTimer);   window.toastTimer = setTimeout(()=>el.classList.remove("show"), 2200); }  function navigate(page){   $$(".page").forEach(p=>p.classList.toggle("active", p.id === `page-${page}`));
  $$(".nav-item").forEach(b=>b.classList.toggle("active", b.dataset.page === page));
  window.scrollTo({top:0, behavior:"smooth"});
}

$$(".nav-item").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.page))); $$
("[data-page-target]").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.pageTarget)));

$("#today").textContent = new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date());

const startDate = new Date(new Date().getFullYear(), 10, 6);
if(new Date() < startDate) startDate.setFullYear(startDate.getFullYear()-1);
$("#sinceDate").textContent = "6 November";
$("#daysTogether").textContent = Math.max(1, Math.floor((new Date()-startDate)/86400000));

const quotes = [
  "Kamu nggak harus jadi sempurna. Jadi Aisyarah aja sudah cukup.",
  "Semoga hari ini ada satu hal kecil yang bikin kamu senyum.",
  "Kalau hari ini berat, istirahat dulu. Besok kita lanjut lagi.",
  "Ada banyak hal indah yang belum kita temui. Pelan-pelan ya.",
  "Terima kasih sudah jadi bagian paling hangat dari hari-hariku."
];
$("#dailyQuote").textContent = quotes[new Date().getDate() % quotes.length];

function renderMood(){
  const history = appData.mood;
  const current = history[0];
  $("#homeMood").textContent = current ? `${current.emoji} ${current.mood}` : "Belum diisi";
  $$("#moodOptions button").forEach(b=>b.classList.toggle("selected", current?.mood===b.dataset.mood));
  const list=$("#moodHistory");
  if(!history.length){list.innerHTML='<div class="empty">Belum ada mood. Pilih mood di atas ya ♡</div>';return}
  list.innerHTML=history.slice(0,12).map((x)=>`
    <div class="history-row"><b>${x.emoji} ${escapeHtml(x.mood)}</b><span>${escapeHtml(x.date)}</span></div>
  `).join("");
}

$$(".mood-options button").forEach(btn=>btn.addEventListener("click",()=>{
  const today=new Intl.DateTimeFormat("id-ID",{dateStyle:"full"}).format(new Date());
  appData.mood.unshift({mood:btn.dataset.mood,emoji:btn.dataset.emoji,date:today});
  appData.mood = appData.mood.slice(0,30);
  syncToFirebase();
  toast("Mood disimpan & disinkronkan ♡");
}));

$("#clearMood").addEventListener("click",()=>{
  appData.mood = [];
  syncToFirebase();
  toast("Riwayat mood dihapus");
});

function renderNotes(){
  const notes=appData.notes;
  const list=$("#notesList");
  if(!notes.length){list.innerHTML='<div class="empty">Belum ada surat. Tulis surat pertama untuk Aisyarah ♡</div>';return}
  list.innerHTML=notes.map((n,i)=>`
    <article class="note-card">
      <h3>${escapeHtml(n.title)}</h3>
      <p>${escapeHtml(n.body)}</p>
      <div class="note-meta"><span>${escapeHtml(n.date)}</span><button class="delete-btn" onclick="deleteNote(${i})">Hapus</button></div>
    </article>
  `).join("");
}

window.deleteNote=(i)=>{
  appData.notes.splice(i,1);
  syncToFirebase();
  toast("Surat dihapus");
};

$("#saveNote").addEventListener("click",()=>{
  const title=$("#noteTitle").value.trim(), body=$("#noteBody").value.trim();
  if(!title||!body){toast("Judul dan isi surat belum lengkap");return}
  appData.notes.unshift({title,body,date:new Intl.DateTimeFormat("id-ID",{dateStyle:"medium"}).format(new Date())});
  syncToFirebase();
  $("#noteTitle").value="";$("#noteBody").value="";
  toast("Surat tersimpan & terkirim ♡");
});

function renderMemories(){
  const arr=[...appData.memories].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tl=$("#timeline");
  if(!arr.length){tl.innerHTML='<div class="empty">Belum ada kenangan yang dicatat.</div>';return}
  tl.innerHTML=arr.map((m)=>`
    <article class="memory-item">
      <div class="memory-date">${formatDate(m.date)}</div>
      <h3>${escapeHtml(m.title)}</h3>
      <p>${escapeHtml(m.desc)}</p>
      <button class="delete-btn" onclick="deleteMemory('${escapeHtml(m.title)}')" style="margin-top:12px">Hapus</button>
    </article>
  `).join("");
}

function formatDate(s){return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(new Date(s+"T00:00:00"))}

window.deleteMemory=(title)=>{
  appData.memories = appData.memories.filter(m => m.title !== title);
  syncToFirebase();
  toast("Kenangan dihapus");
};

$("#memoryDate").valueAsDate=new Date();
$("#saveMemory").addEventListener("click",()=>{
  const title=$("#memoryTitle").value.trim(), desc=$("#memoryDesc").value.trim(), date=$("#memoryDate").value;
  if(!title||!desc||!date){toast("Lengkapi kenangannya dulu");return}
  appData.memories.push({title,desc,date});
  syncToFirebase();
  $("#memoryTitle").value="";$("#memoryDesc").value="";
  toast("Kenangan ditambahkan ♡");
});

function renderPlans(){
  const a=appData.plans, list=$("#plansList");
  if(!a.length){list.innerHTML='<div class="empty">Belum ada rencana. Tambahkan satu impian kecil.</div>';return}
  list.innerHTML=a.map((p,i)=>`
    <div class="plan ${p.done?"done":""}">
      <button class="check" onclick="togglePlan(${i})">${p.done?"✓":""}</button>
      <span class="plan-text">${escapeHtml(p.text)}</span>
      <button class="plan-delete" onclick="deletePlan(${i})">×</button>
    </div>
  `).join("");
}

window.togglePlan=(i)=>{
  appData.plans[i].done = !appData.plans[i].done;
  syncToFirebase();
};

window.deletePlan=(i)=>{
  appData.plans.splice(i,1);
  syncToFirebase();
  toast("Rencana dihapus");
};

$("#addPlan").addEventListener("click",()=>{
  const input=$("#planInput"), text=input.value.trim(); if(!text){toast("Tulis rencananya dulu");return}
  appData.plans.push({text,done:false});
  syncToFirebase();
  input.value="";
  toast("Rencana ditambahkan");
});

$("#planInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("#addPlan").click()});

function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("#themeBtn").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("aisyarah_dark", document.body.classList.contains("dark"));
  $("#themeBtn span").textContent=document.body.classList.contains("dark")?"Mode terang":"Mode malam";
});

if(localStorage.getItem("aisyarah_dark")==="true"){
  document.body.classList.add("dark"); $("#themeBtn span").textContent="Mode terang";
}

$("#mobileMenu").addEventListener("click",()=>{
  const choice=prompt("Buka halaman: home / mood / notes / memories / plans");
  if(choice && ["home","mood","notes","memories","plans"].includes(choice.toLowerCase())) navigate(choice.toLowerCase());
});

function renderAll(){
  renderMood();
  renderNotes();
  renderMemories();
  renderPlans();
}