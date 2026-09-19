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

const STORAGE_KEY = 'restaurantOpsHome.v2';
let editing = false;
let dragId = null;
let pointerDrag = null;
let longPressTimer = null;
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
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(localStorage.getItem('restaurantOpsHome.v1'));
    if(saved?.order && Array.isArray(saved.order) && saved?.hidden && Array.isArray(saved.hidden)){
      const valid = new Set(MODULES.map(m=>m.id));
      const order = saved.order.filter(id=>valid.has(id));
      MODULES.forEach(m=>{ if(!order.includes(m.id)) order.push(m.id); });
      return {order, hidden:saved.hidden.filter(id=>valid.has(id))};
    }
  }catch(e){}
  return {order: MODULES.map(m=>m.id), hidden: []};
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function byId(id){ return MODULES.find(m=>m.id===id); }
function visibleIds(){ return state.order.filter(id=>!state.hidden.includes(id)); }
function setEditing(value){
  editing = value;
  if(!editing) cancelPointerDrag();
  render();
}

function render(){
  document.body.classList.toggle('editing', editing);
  editBtn.classList.toggle('active', editing);
  editBtn.textContent = editing ? '編集完了' : '編集';
  addCard.hidden = !editing;
  resetBtn.hidden = !editing;
  introCard.hidden = !editing;
  modeText.textContent = editing ? '長押し・ドラッグで並べ替え / −で非表示' : 'よく使う機能';

  grid.innerHTML='';
  visibleIds().forEach(id=>{
    const m = byId(id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className='tile';
    btn.draggable = editing;
    btn.dataset.id=id;
    btn.style.setProperty('--tile-bg',m.bg);
    btn.innerHTML = `<span class="remove" aria-label="非表示">−</span><span class="drag" aria-hidden="true">≡</span><div class="icon">${m.icon}</div><h3>${m.title}</h3><p>${m.desc.replace(/\n/g,'<br>')}</p>`;

    btn.addEventListener('click',(e)=>{
      if(btn.dataset.suppressClick==='1'){
        btn.dataset.suppressClick='0';
        return;
      }
      if(editing){
        if(e.target.closest('.remove')) hideModule(id);
        return;
      }
      showToast(`${m.title}：詳細画面は後から設計します`);
    });

    btn.addEventListener('dragstart',(e)=>{
      if(!editing){ e.preventDefault(); return; }
      dragId=id;
      btn.classList.add('dragging');
      if(e.dataTransfer) e.dataTransfer.effectAllowed='move';
    });
    btn.addEventListener('dragend',()=>{ dragId=null; btn.classList.remove('dragging'); });
    btn.addEventListener('dragover',(e)=>{ if(editing) e.preventDefault(); });
    btn.addEventListener('drop',(e)=>{ e.preventDefault(); if(dragId && dragId!==id) reorder(dragId,id); });

    btn.addEventListener('pointerdown',(e)=>handlePointerDown(e, btn, id));
    grid.appendChild(btn);
  });
  renderHidden();
}

function handlePointerDown(e, tile, id){
  if(e.target.closest('.remove')) return;

  if(!editing){
    clearTimeout(longPressTimer);
    const sx=e.clientX, sy=e.clientY;
    longPressTimer=setTimeout(()=>{
      setEditing(true);
      showToast('編集モードにしました');
    },520);
    const cancel=()=>{
      clearTimeout(longPressTimer);
      window.removeEventListener('pointerup',cancel);
      window.removeEventListener('pointercancel',cancel);
      window.removeEventListener('pointermove',moveCancel);
    };
    const moveCancel=(ev)=>{
      if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>12) cancel();
    };
    window.addEventListener('pointerup',cancel,{once:true});
    window.addEventListener('pointercancel',cancel,{once:true});
    window.addEventListener('pointermove',moveCancel);
    return;
  }

  if(e.pointerType==='mouse') return;
  e.preventDefault();
  tile.setPointerCapture?.(e.pointerId);
  startPointerDrag(tile,id,e);
}

function startPointerDrag(tile,id,e){
  cancelPointerDrag();
  const rect=tile.getBoundingClientRect();
  pointerDrag={id,tile,pointerId:e.pointerId,offsetX:e.clientX-rect.left,offsetY:e.clientY-rect.top};
  tile.classList.add('pointer-dragging');
  tile.dataset.suppressClick='1';
  updateFloatingTile(e.clientX,e.clientY);

  tile.addEventListener('pointermove',onPointerMove);
  tile.addEventListener('pointerup',onPointerUp,{once:true});
  tile.addEventListener('pointercancel',onPointerUp,{once:true});
}

function onPointerMove(e){
  if(!pointerDrag || e.pointerId!==pointerDrag.pointerId) return;
  e.preventDefault();
  updateFloatingTile(e.clientX,e.clientY);
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.tile');
  if(target && target.dataset.id && target.dataset.id!==pointerDrag.id){
    reorder(pointerDrag.id,target.dataset.id,false);
    pointerDrag.id=target.dataset.id===pointerDrag.id ? pointerDrag.id : pointerDrag.tile.dataset.id;
  }
}

function updateFloatingTile(x,y){
  if(!pointerDrag) return;
  const {tile,offsetX,offsetY}=pointerDrag;
  tile.style.left=`${x-offsetX}px`;
  tile.style.top=`${y-offsetY}px`;
}

function onPointerUp(e){
  if(!pointerDrag || e.pointerId!==pointerDrag.pointerId) return;
  const {tile}=pointerDrag;
  tile.releasePointerCapture?.(e.pointerId);
  cancelPointerDrag();
  save();
  render();
}

function cancelPointerDrag(){
  if(!pointerDrag) return;
  const {tile}=pointerDrag;
  tile.classList.remove('pointer-dragging');
  tile.style.left='';
  tile.style.top='';
  tile.removeEventListener('pointermove',onPointerMove);
  pointerDrag=null;
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
function reorder(fromId,toId,rerender=true){
  const visible = visibleIds();
  const from=visible.indexOf(fromId), to=visible.indexOf(toId);
  if(from<0||to<0) return;
  visible.splice(to,0,visible.splice(from,1)[0]);
  const hiddenSet = new Set(state.hidden);
  const hiddenInOrder = state.order.filter(id=>hiddenSet.has(id));
  state.order = [...visible, ...hiddenInOrder.filter(id=>!visible.includes(id))];
  save();
  if(rerender) render();
}
function renderHidden(){
  const ids = state.hidden;
  hiddenList.innerHTML = ids.length ? '' : '<p style="color:#7b8797;font-size:13px">現在、非表示の機能はありません。</p>';
  ids.forEach(id=>{
    const m=byId(id);
    const row=document.createElement('div');
    row.className='hidden-item';
    row.innerHTML=`<div class="mini-icon" style="--mini-bg:${m.bg}">${m.icon}</div><div class="copy"><strong>${m.title}</strong><span>${m.desc.replace(/\n/g,' / ')}</span></div><button type="button">追加</button>`;
    row.querySelector('button').addEventListener('click',()=>restoreModule(id));
    hiddenList.appendChild(row);
  });
}
function openSheet(){ bottomSheet.hidden=false; sheetBackdrop.hidden=false; document.body.style.overflow='hidden'; }
function closeSheetFn(){ bottomSheet.hidden=true; sheetBackdrop.hidden=true; document.body.style.overflow=''; }
function showToast(msg){ toast.textContent=msg; toast.hidden=false; clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.hidden=true,1700); }

editBtn.addEventListener('click',()=>setEditing(!editing));
addCard.addEventListener('click',openSheet);
closeSheet.addEventListener('click',closeSheetFn);
sheetBackdrop.addEventListener('click',closeSheetFn);
resetBtn.addEventListener('click',()=>{ state={order:MODULES.map(m=>m.id),hidden:[]}; save(); render(); showToast('初期状態に戻しました'); });
document.getElementById('alertsBtn').addEventListener('click',()=>showToast('通知画面は後から設計します'));

render();
