const MODULES = [
  {id:'sales', title:'売上・経営分析', desc:'日次・月次の売上\n利益率・客単価など', icon:'▥', bg:'linear-gradient(145deg,#dff7df,#eefbed)'},
  {id:'shift', title:'シフト・勤怠管理', desc:'シフト作成\n勤怠打刻・集計など', icon:'👥', bg:'linear-gradient(145deg,#ffe7d1,#fff1e4)'},
  {id:'stock', title:'発注・在庫管理', desc:'発注・仕入れ\n在庫数の把握など', icon:'📦', bg:'linear-gradient(145deg,#d9efff,#eaf6ff)'},
  {id:'accounting', title:'会計・経費管理', desc:'経費の記録\n支払い管理など', icon:'¥', bg:'linear-gradient(145deg,#eee2ff,#f7f0ff)'},
  {id:'staff', title:'スタッフ管理', desc:'スタッフ情報\n評価・育成など', icon:'👨‍👩‍👧', bg:'linear-gradient(145deg,#ffdfe7,#fff0f4)'},
  {id:'tasks', title:'タスク・業務管理', desc:'やることリスト\n業務の進捗管理など', icon:'✓', bg:'linear-gradient(145deg,#fff0bf,#fff8dc)'},
  {id:'reports', title:'レポート・分析', desc:'自動レポート生成\n店舗ごとの比較など', icon:'▤', bg:'linear-gradient(145deg,#e5e8ec,#f5f6f8)'},
  {id:'ai', title:'AIアシスタント', desc:'データを分析し\n気づきをお知らせ', icon:'🤖', bg:'linear-gradient(145deg,#ebe4ff,#f5f1ff)'},
  {id:'alerts', title:'通知・アラート', desc:'異常の検知・お知らせ\n重要な情報をすぐに', icon:'🔔', bg:'linear-gradient(145deg,#ffe2e8,#fff1f4)'}
];

const STORAGE_KEY = 'restaurantOpsHome.v1';
let editing = false;
let dragId = null;
let state = loadState();

const grid = document.getElementById('tileGrid');
const editBtn = document.getElementById('editBtn');
const addCard = document.getElementById('addCard');
const resetBtn = document.getElementById('resetBtn');
const modeText = document.getElementById('modeText');
const introCard = document.getElementById('introCard');
const bottomSheet = document.getElementById('bottomSheet');
const sheetBackdrop = document.getElementById('sheetBackdrop');
const hiddenList = document.getElementById('hiddenList');
const closeSheet = document.getElementById('closeSheet');
const toast = document.getElementById('toast');

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved?.order && Array.isArray(saved.order) && saved?.hidden && Array.isArray(saved.hidden)) return saved;
  }catch(e){}
  return {order: MODULES.map(m=>m.id), hidden: []};
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function byId(id){ return MODULES.find(m=>m.id===id); }
function visibleIds(){ return state.order.filter(id=>!state.hidden.includes(id)); }

function render(){
  document.body.classList.toggle('editing', editing);
  editBtn.classList.toggle('active', editing);
  editBtn.textContent = editing ? '編集完了' : '編集';
  addCard.hidden = !editing;
  resetBtn.hidden = !editing;
  introCard.hidden = !editing;
  modeText.textContent = editing ? '長押し感覚で並べ替え・不要な機能は非表示' : 'よく使う機能';

  grid.innerHTML='';
  visibleIds().forEach(id=>{
    const m = byId(id);
    const btn = document.createElement('button');
    btn.className='tile'; btn.draggable = editing; btn.dataset.id=id; btn.style.setProperty('--tile-bg',m.bg);
    btn.innerHTML = `<span class="remove" aria-label="非表示">−</span><span class="drag">≡</span><div class="icon">${m.icon}</div><h3>${m.title}</h3><p>${m.desc.replace(/\n/g,'<br>')}</p>`;
    btn.addEventListener('click',(e)=>{
      if(editing){
        if(e.target.closest('.remove')) hideModule(id);
        return;
      }
      showToast(`${m.title}：詳細画面は後から設計します`);
    });
    btn.addEventListener('dragstart',()=>{ dragId=id; btn.classList.add('dragging'); });
    btn.addEventListener('dragend',()=>{ dragId=null; btn.classList.remove('dragging'); });
    btn.addEventListener('dragover',(e)=>e.preventDefault());
    btn.addEventListener('drop',(e)=>{ e.preventDefault(); if(dragId && dragId!==id) reorder(dragId,id); });
    grid.appendChild(btn);
  });
  renderHidden();
}

function hideModule(id){
  if(!state.hidden.includes(id)) state.hidden.push(id);
  save(); render(); showToast('ホームから非表示にしました');
}
function restoreModule(id){
  state.hidden = state.hidden.filter(x=>x!==id);
  if(!state.order.includes(id)) state.order.push(id);
  save(); render(); showToast('ホームに追加しました');
}
function reorder(fromId,toId){
  const visible = visibleIds();
  const from=visible.indexOf(fromId), to=visible.indexOf(toId);
  if(from<0||to<0) return;
  visible.splice(to,0,visible.splice(from,1)[0]);
  const hiddenSet = new Set(state.hidden);
  const hiddenInOrder = state.order.filter(id=>hiddenSet.has(id));
  state.order = [...visible, ...hiddenInOrder.filter(id=>!visible.includes(id))];
  save(); render();
}
function renderHidden(){
  const ids = state.hidden;
  hiddenList.innerHTML = ids.length ? '' : '<p style="color:#7b8797;font-size:13px">現在、非表示の機能はありません。</p>';
  ids.forEach(id=>{
    const m=byId(id); const row=document.createElement('div'); row.className='hidden-item';
    row.innerHTML=`<div class="mini-icon" style="--mini-bg:${m.bg}">${m.icon}</div><div class="copy"><strong>${m.title}</strong><span>${m.desc.replace(/\n/g,' / ')}</span></div><button>追加</button>`;
    row.querySelector('button').addEventListener('click',()=>restoreModule(id));
    hiddenList.appendChild(row);
  });
}
function openSheet(){ bottomSheet.hidden=false; sheetBackdrop.hidden=false; document.body.style.overflow='hidden'; }
function closeSheetFn(){ bottomSheet.hidden=true; sheetBackdrop.hidden=true; document.body.style.overflow=''; }
function showToast(msg){ toast.textContent=msg; toast.hidden=false; clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.hidden=true,1700); }

editBtn.addEventListener('click',()=>{ editing=!editing; render(); });
addCard.addEventListener('click',openSheet);
closeSheet.addEventListener('click',closeSheetFn);
sheetBackdrop.addEventListener('click',closeSheetFn);
resetBtn.addEventListener('click',()=>{ state={order:MODULES.map(m=>m.id),hidden:[]}; save(); render(); showToast('初期状態に戻しました'); });
document.getElementById('alertsBtn').addEventListener('click',()=>showToast('通知画面は後から設計します'));

render();
