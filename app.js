const APPS=[
  {id:'sales',title:'売上',desc:'売上・利益・客単価',icon:'sales',bg:'linear-gradient(145deg,#4fe26a,#10b84a)',ink:'#fff',zone:'home'},
  {id:'shift',title:'シフト',desc:'シフト・勤怠管理',icon:'shift',bg:'linear-gradient(145deg,#ffb449,#ff941a)',ink:'#fff',zone:'home'},
  {id:'stock',title:'在庫',desc:'発注・在庫管理',icon:'stock',bg:'linear-gradient(145deg,#65d4ff,#1599ff)',ink:'#fff',zone:'home'},
  {id:'staff',title:'スタッフ',desc:'スタッフ情報・育成',icon:'staff',bg:'linear-gradient(145deg,#ff6b8a,#ff4165)',ink:'#fff',zone:'home'},
  {id:'accounting',title:'会計',desc:'会計・経費管理',icon:'accounting',bg:'linear-gradient(145deg,#c15cf0,#9840cb)',ink:'#fff',zone:'home'},
  {id:'tasks',title:'タスク',desc:'やること・業務管理',icon:'tasks',bg:'linear-gradient(145deg,#ffdf32,#ffc400)',ink:'#4a3a00',zone:'home'},
  {id:'reports',title:'レポート',desc:'日報・分析・比較',icon:'reports',bg:'linear-gradient(145deg,#61d4e8,#33b8ce)',ink:'#fff',zone:'home'},
  {id:'alerts',title:'通知',desc:'重要なお知らせ',icon:'alerts',bg:'linear-gradient(145deg,#ff736e,#ff443b)',ink:'#fff',badge:3,zone:'home'},
  {id:'booking',title:'予約',desc:'予約・席の管理',icon:'booking',bg:'linear-gradient(145deg,#48dd6c,#19bd51)',ink:'#fff',badge:2,zone:'home'},
  {id:'customers',title:'顧客',desc:'顧客・来店履歴',icon:'customers',bg:'linear-gradient(145deg,#239bff,#087cf0)',ink:'#fff',zone:'home'},
  {id:'menu',title:'メニュー',desc:'商品・価格・メニュー',icon:'menu',bg:'linear-gradient(145deg,#ffad2e,#ff8212)',ink:'#fff',zone:'home'},
  {id:'help',title:'ヘルプ',desc:'マニュアル・問い合わせ',icon:'help',bg:'linear-gradient(145deg,#a1a1a7,#737378)',ink:'#fff',zone:'home'},
  {id:'instagram',title:'Instagram',desc:'業務用Instagram',icon:'instagram',bg:'radial-gradient(circle at 30% 105%,#fdf497 0 8%,#fdf49700 32%),linear-gradient(135deg,#833AB4 0%,#FD1D1D 52%,#FCB045 100%)',ink:'#fff',brand:true,badge:4,zone:'home'},
  {id:'facebook',title:'Facebook',desc:'業務用Facebook',icon:'facebook',bg:'#1877F2',ink:'#fff',brand:true,badge:1,zone:'home'},
  {id:'x',title:'X',desc:'業務用X',icon:'x',bg:'#050505',ink:'#fff',brand:true,zone:'home'},
  {id:'tiktok',title:'TikTok',desc:'業務用TikTok',icon:'tiktok',bg:'#050505',ink:'#fff',brand:true,badge:2,zone:'home'},
  {id:'ai',title:'AIアシスタント',desc:'AIアシスタント',icon:'ai',bg:'linear-gradient(145deg,#7f7cff,#5e5ce6)',ink:'#fff',zone:'dock'},
  {id:'line',title:'LINE',desc:'業務用LINE',icon:'line',bg:'#06C755',ink:'#fff',brand:true,badge:6,zone:'dock'},
  {id:'calendar',title:'カレンダー',desc:'予定・行事',icon:'calendar',bg:'#fff',ink:'#111',brand:true,zone:'dock'},
  {id:'settings',title:'設定',desc:'全体設定',icon:'settings',bg:'linear-gradient(145deg,#f0f0f4,#99999f)',ink:'#fff',brand:true,zone:'dock'}
];

const DEFAULT_HOME=APPS.filter(a=>a.zone==='home').map(a=>a.id);
const DEFAULT_DOCK=APPS.filter(a=>a.zone==='dock').map(a=>a.id);
const ALL_IDS=APPS.map(a=>a.id);
const MAX_DOCK=4;

let storage;
try{
  storage=window.localStorage;
}catch(e){
  storage={getItem(){return null;},setItem(){throw new Error('storage unavailable');}};
}

let layout=HomeState.loadLayout(storage,ALL_IDS,DEFAULT_HOME,DEFAULT_DOCK,MAX_DOCK);
let editing=false;
let drag=null;
let longPress=null;
let restoreFocus=null;
let suppressUntil=0;

const $=id=>document.getElementById(id);
const grid=$('tileGrid');
const dock=$('dockGrid');
const sheet=$('bottomSheet');
const sheetBody=$('sheetBody');

document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

const byId=id=>APPS.find(a=>a.id===id);

function showToast(message){
  $('toast').textContent=message;
  $('toast').hidden=false;
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>$('toast').hidden=true,2500);
}

function persist(message){
  const saved=HomeState.saveLayout(storage,layout);
  if(!saved)showToast('この画面では変更されていますが、端末に保存できません。');
  else if(message)showToast(message);
  return saved;
}

function badgeMarkup(value){
  return value ? `<span class="badge" aria-label="未確認 ${value}件">${value}</span>` : '';
}

function artwork(item,kind){
  return `<span class="${kind}${item.brand?' brand':''}" style="--tile-bg:${item.bg};--tile-ink:${item.ink}">${icon(item.icon)}</span>`;
}

function renderHome(){
  grid.innerHTML='';
  $('emptyState').hidden=layout.home.length>0;

  layout.home.forEach(id=>{
    const item=byId(id);
    if(!item)return;

    const tile=document.createElement('article');
    tile.className='tile app-item';
    tile.dataset.id=id;
    tile.dataset.zone='home';
    tile.innerHTML=`
      <button class="tile-main drag-handle" type="button" aria-label="${item.title}${editing?'：ドラッグで移動':''}">
        <span class="icon-wrap">${artwork(item,'module-icon')}${badgeMarkup(item.badge)}</span>
        <span class="app-label">${item.title}</span>
      </button>
      <button class="remove-home" type="button" ${editing?'':'hidden'} aria-label="${item.title}をホームから外す">${icon('minus')}</button>
    `;

    const handle=tile.querySelector('.drag-handle');
    handle.addEventListener('click',()=>{
      if(Date.now()<suppressUntil)return;
      if(!editing)openApp(item);
    });
    handle.addEventListener('pointerdown',e=>onPointerDown(e,tile,id,'home'));
    tile.querySelector('.remove-home').addEventListener('click',()=>{
      layout=HomeState.hideLayout(layout,id);
      persist('ホームから非表示にしました');
      renderAll();
    });

    grid.appendChild(tile);
  });
}

function renderDock(){
  dock.innerHTML='';
  layout.dock.forEach(id=>{
    const item=byId(id);
    if(!item)return;

    const wrap=document.createElement('div');
    wrap.className='dock-app app-item';
    wrap.dataset.id=id;
    wrap.dataset.zone='dock';
    wrap.innerHTML=`
      <button class="dock-button drag-handle" type="button" aria-label="${item.title}${editing?'：ドラッグで移動':''}">
        <span class="dock-icon-wrap">${artwork(item,'dock-icon')}${badgeMarkup(item.badge)}</span>
      </button>
      <button class="dock-remove" type="button" ${editing?'':'hidden'} aria-label="${item.title}をホームから外す">${icon('minus')}</button>
    `;

    const handle=wrap.querySelector('.drag-handle');
    handle.addEventListener('click',()=>{
      if(Date.now()<suppressUntil)return;
      if(!editing)openApp(item);
    });
    handle.addEventListener('pointerdown',e=>onPointerDown(e,wrap,id,'dock'));
    wrap.querySelector('.dock-remove').addEventListener('click',()=>{
      layout=HomeState.hideLayout(layout,id);
      persist('ホームから非表示にしました');
      renderAll();
    });

    dock.appendChild(wrap);
  });
}

function renderAll(){
  document.body.classList.toggle('editing',editing);
  $('editBtn').classList.toggle('active',editing);
  $('editBtn').setAttribute('aria-pressed',String(editing));
  $('editLabel').textContent=editing?'完了':'編集';
  $('introCard').hidden=!editing;
  $('addCard').hidden=!editing;
  renderHome();
  renderDock();
}

function setEditing(value){
  clearLongPress();
  cancelDrag();
  editing=value;
  renderAll();
}

function clearLongPress(){
  if(longPress){
    clearTimeout(longPress.timer);
    longPress=null;
  }
}

function onPointerDown(event,element,id,zone){
  if(!event.isPrimary||event.button!==0)return;

  if(!editing){
    clearLongPress();
    longPress={
      pointer:event.pointerId,
      x:event.clientX,
      y:event.clientY,
      timer:setTimeout(()=>{
        longPress=null;
        suppressUntil=Date.now()+800;
        setEditing(true);
        showToast('ホーム画面を編集');
      },500)
    };
    return;
  }

  event.preventDefault();
  cancelDrag();

  const rect=element.getBoundingClientRect();
  drag={
    id,zone,element,pointer:event.pointerId,
    startX:event.clientX,startY:event.clientY,
    dx:event.clientX-rect.left,dy:event.clientY-rect.top,
    rect,ghost:null,targetZone:null,targetId:null
  };
  element.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event){
  if(longPress&&event.pointerId===longPress.pointer&&Math.hypot(event.clientX-longPress.x,event.clientY-longPress.y)>10){
    clearLongPress();
  }
  if(!drag||event.pointerId!==drag.pointer)return;
  if(!drag.ghost&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<7)return;

  event.preventDefault();

  if(!drag.ghost){
    drag.ghost=drag.element.cloneNode(true);
    drag.ghost.classList.add('drag-ghost');
    drag.ghost.setAttribute('aria-hidden','true');
    drag.ghost.inert=true;
    drag.ghost.style.width=drag.rect.width+'px';
    drag.ghost.style.height=drag.rect.height+'px';
    document.body.appendChild(drag.ghost);
    drag.element.classList.add('dragging');
  }

  drag.ghost.style.left=(event.clientX-drag.dx)+'px';
  drag.ghost.style.top=(event.clientY-drag.dy)+'px';

  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));

  const hit=document.elementFromPoint(event.clientX,event.clientY);
  const target=hit?.closest('.app-item:not(.drag-ghost)');
  const dockHit=hit?.closest('#dockGrid');
  const gridHit=hit?.closest('#tileGrid');

  if(target&&target.dataset.id!==drag.id){
    drag.targetId=target.dataset.id;
    drag.targetZone=target.dataset.zone;
    target.classList.add('drop-target');
  }else if(dockHit){
    drag.targetId=null;
    drag.targetZone='dock';
    dock.classList.add('drop-target');
  }else if(gridHit){
    drag.targetId=null;
    drag.targetZone='home';
    grid.classList.add('drop-target');
  }else{
    drag.targetId=null;
    drag.targetZone=null;
  }

  if(event.clientY<70)window.scrollBy(0,-8);
  else if(event.clientY>window.innerHeight-120)window.scrollBy(0,8);
}

function onPointerUp(event){
  clearLongPress();
  if(!drag||event.pointerId!==drag.pointer)return;

  const {id,targetZone,targetId,ghost}=drag;
  cancelDrag();

  if(ghost){
    suppressUntil=Date.now()+500;
    if(targetZone){
      layout=HomeState.moveLayout(layout,id,targetZone,targetId,MAX_DOCK);
      persist('配置を変更しました');
    }
    renderAll();
    requestAnimationFrame(()=>document.querySelector(`[data-id="${id}"] .drag-handle`)?.focus());
  }
}

function cancelDrag(){
  if(!drag)return;
  const {element,pointer,ghost}=drag;
  ghost?.remove();
  element.classList.remove('dragging');
  if(element.hasPointerCapture?.(pointer))element.releasePointerCapture(pointer);
  document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  drag=null;
}

window.addEventListener('pointermove',onPointerMove,{passive:false});
window.addEventListener('pointerup',onPointerUp);
window.addEventListener('pointercancel',()=>{clearLongPress();cancelDrag();});
window.addEventListener('blur',()=>{clearLongPress();cancelDrag();});

function openSheet(title){
  clearLongPress();
  cancelDrag();
  restoreFocus=document.activeElement;
  $('sheetTitle').textContent=title;
  sheetBody.replaceChildren();
  sheet.hidden=false;
  $('sheetBackdrop').hidden=false;
  document.body.style.overflow='hidden';
}

function closeSheet(){
  sheet.hidden=true;
  $('sheetBackdrop').hidden=true;
  document.body.style.overflow='';
  if(restoreFocus?.isConnected)restoreFocus.focus();
}

function openApp(item){
  if(item.id==='settings')return showSettings();
  openSheet(item.title);
  const p=document.createElement('p');
  p.className='sheet-message';
  p.textContent='現在はホーム画面の見た目と操作感を優先して作り込んでいます。この機能の中身や外部サービスとの接続方法は次の段階で決めます。';
  sheetBody.appendChild(p);
  $('closeSheet').focus();
}

function renderHidden(){
  const list=document.createElement('div');
  list.className='hidden-list';

  if(!layout.hidden.length){
    list.innerHTML='<p class="sheet-message">現在、非表示の機能はありません。</p>';
  }else{
    layout.hidden.forEach(id=>{
      const item=byId(id);
      if(!item)return;
      const row=document.createElement('div');
      row.className='hidden-item';
      row.innerHTML=`${artwork(item,'module-icon')}<div class="copy"><strong>${item.title}</strong><p>${item.desc}</p></div><button type="button">追加</button>`;
      row.querySelector('button').addEventListener('click',()=>{
        layout=HomeState.restoreLayout(layout,id);
        persist('ホームに追加しました');
        renderAll();
        openAddSheet();
      });
      list.appendChild(row);
    });
  }

  sheetBody.replaceChildren(list);
}

function openAddSheet(){
  $('sheetTitle').textContent='機能を追加';
  renderHidden();
  $('closeSheet').focus();
}

function showSettings(){
  openSheet('設定');
  sheetBody.innerHTML=
    '<p class="sheet-message">見た目と操作感を先に整えている段階です。各機能やSNS連携は後で設定します。</p>'+
    '<button class="settings-link" id="customize" type="button">ホーム画面を編集 <span>›</span></button>'+
    '<div class="settings-link">アプリアイコン <span>A案</span></div>';
  $('customize').addEventListener('click',()=>{
    closeSheet();
    setEditing(true);
    $('editBtn').focus();
  });
  $('closeSheet').focus();
}

$('editBtn').addEventListener('click',()=>setEditing(!editing));
$('addCard').addEventListener('click',()=>{
  openSheet('機能を追加');
  renderHidden();
  $('closeSheet').focus();
});
$('closeSheet').addEventListener('click',closeSheet);
$('sheetBackdrop').addEventListener('click',closeSheet);

$('resetBtn').addEventListener('click',()=>{
  openSheet('配置をリセット');
  sheetBody.innerHTML='<p class="sheet-message">ホーム画面とDockを初期配置に戻します。</p><button class="primary-button" id="confirmReset" type="button" style="margin-top:18px">初期配置に戻す</button>';
  $('confirmReset').addEventListener('click',()=>{
    layout=HomeState.normalizeLayout(null,ALL_IDS,DEFAULT_HOME,DEFAULT_DOCK,MAX_DOCK);
    persist('初期配置に戻しました');
    renderAll();
    closeSheet();
  });
  $('closeSheet').focus();
});

$('storeBtn').addEventListener('click',()=>openApp({id:'store',title:'店舗を選択'}));
$('searchBtn').addEventListener('click',()=>openApp({id:'search',title:'検索'}));

document.addEventListener('keydown',event=>{
  if(sheet.hidden)return;
  if(event.key==='Escape'){
    event.preventDefault();
    closeSheet();
    return;
  }
  if(event.key==='Tab'){
    const all=[...sheet.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')];
    if(!all.length)return;
    const first=all[0],last=all[all.length-1];
    if(event.shiftKey&&document.activeElement===first){
      event.preventDefault();
      last.focus();
    }else if(!event.shiftKey&&document.activeElement===last){
      event.preventDefault();
      first.focus();
    }
  }
});

renderAll();
