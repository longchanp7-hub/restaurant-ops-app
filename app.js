const MODULES=[
  {id:'sales',title:'売上',desc:'売上・利益・客単価',icon:'chart',bg:'linear-gradient(145deg,#34C759,#0A9F40)',ink:'#fff'},
  {id:'shift',title:'シフト',desc:'シフト・勤怠管理',icon:'shift',bg:'linear-gradient(145deg,#FFB340,#FF8C00)',ink:'#fff'},
  {id:'stock',title:'在庫',desc:'発注・在庫管理',icon:'stock',bg:'linear-gradient(145deg,#64D2FF,#0A84FF)',ink:'#fff'},
  {id:'accounting',title:'会計',desc:'会計・経費管理',icon:'accounting',bg:'linear-gradient(145deg,#BF5AF2,#8E44AD)',ink:'#fff'},
  {id:'staff',title:'スタッフ',desc:'スタッフ情報・育成',icon:'staff',bg:'linear-gradient(145deg,#FF6482,#FF375F)',ink:'#fff'},
  {id:'tasks',title:'タスク',desc:'やること・業務管理',icon:'tasks',bg:'linear-gradient(145deg,#FFD60A,#FFB800)',ink:'#4b3b00'},
  {id:'reports',title:'レポート',desc:'日報・分析・比較',icon:'reports',bg:'linear-gradient(145deg,#5AC8FA,#30B0C7)',ink:'#fff'},
  {id:'alerts',title:'通知',desc:'重要なお知らせ',icon:'bell',bg:'linear-gradient(145deg,#FF6961,#FF3B30)',ink:'#fff',badge:3},
  {id:'booking',title:'予約',desc:'予約・席の管理',icon:'booking',bg:'linear-gradient(145deg,#30D158,#1FAE45)',ink:'#fff',badge:2},
  {id:'customers',title:'顧客',desc:'顧客・来店履歴',icon:'customers',bg:'linear-gradient(145deg,#0A84FF,#0066CC)',ink:'#fff'},
  {id:'menu',title:'メニュー',desc:'商品・価格・メニュー',icon:'menu',bg:'linear-gradient(145deg,#FF9F0A,#FF7A00)',ink:'#fff'},
  {id:'help',title:'ヘルプ',desc:'マニュアル・問い合わせ',icon:'help',bg:'linear-gradient(145deg,#8E8E93,#636366)',ink:'#fff'},
  {id:'instagram',title:'Instagram',desc:'業務用Instagram',icon:'instagram',bg:'radial-gradient(circle at 30% 105%,#fdf497 0 8%,#fdf49700 32%),linear-gradient(135deg,#833AB4 0%,#FD1D1D 52%,#FCB045 100%)',ink:'#fff',brand:true,badge:4},
  {id:'facebook',title:'Facebook',desc:'業務用Facebook',icon:'facebook',bg:'#1877F2',ink:'#fff',brand:true,badge:1},
  {id:'x',title:'X',desc:'業務用X',icon:'x',bg:'#050505',ink:'#fff',brand:true},
  {id:'tiktok',title:'TikTok',desc:'業務用TikTok',icon:'tiktok',bg:'#050505',ink:'#fff',brand:true,badge:2}
];

const DOCK=[
  {id:'ai',title:'AIアシスタント',icon:'ai',bg:'linear-gradient(145deg,#7D7AFF,#5E5CE6)',ink:'#fff'},
  {id:'line',title:'LINE',icon:'line',bg:'#06C755',ink:'#fff',brand:true,badge:6},
  {id:'calendar',title:'カレンダー',icon:'calendar',bg:'#fff',ink:'#111',brand:true},
  {id:'settings',title:'設定',icon:'settings',bg:'linear-gradient(145deg,#EFEFF4,#8E8E93)',ink:'#fff',brand:true}
];

let storage;
try{
  storage=window.localStorage;
}catch(e){
  storage={getItem(){return null;},setItem(){throw new Error('storage unavailable');}};
}

let state=HomeState.load(storage,MODULES.map(m=>m.id));
let editing=false;
let drag=null;
let longPress=null;
let restoreFocus=null;

const $=id=>document.getElementById(id);
const grid=$('tileGrid');
const dock=$('dockGrid');
const sheet=$('bottomSheet');
const sheetBody=$('sheetBody');

document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

const byId=id=>MODULES.find(m=>m.id===id);
const visibleIds=()=>state.order.filter(id=>!state.hidden.includes(id));

function showToast(message){
  $('toast').textContent=message;
  $('toast').hidden=false;
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>$('toast').hidden=true,2600);
}

function persist(message){
  const saved=HomeState.save(storage,state);
  if(!saved){
    showToast('変更はこの画面では有効ですが、端末に保存できません。');
  }else if(message){
    showToast(message);
  }
  return saved;
}

function focusTile(id){
  grid.querySelector(`[data-id="${id}"] .tile-main`)?.focus();
}

function badgeMarkup(value){
  return value ? `<span class="badge" aria-label="未確認 ${value}件">${value}</span>` : '';
}

function moduleIconMarkup(item,kind='module-icon'){
  return `<span class="${kind}${item.brand?' brand':''}" style="--tile-bg:${item.bg};--tile-ink:${item.ink}">${icon(item.icon)}</span>`;
}

function render(){
  document.body.classList.toggle('editing',editing);
  $('editBtn').classList.toggle('active',editing);
  $('editBtn').setAttribute('aria-pressed',String(editing));
  $('editLabel').textContent=editing?'完了':'編集';
  $('introCard').hidden=!editing;
  $('addCard').hidden=!editing;

  const visible=visibleIds();
  $('emptyState').hidden=visible.length>0;
  grid.innerHTML='';

  visible.forEach((id,index)=>{
    const m=byId(id);
    const tile=document.createElement('article');
    tile.className='tile';
    tile.dataset.id=id;

    tile.innerHTML=
      `<button class="tile-main" type="button" aria-label="${m.title}${editing?'：ドラッグで移動':''}">
        <span class="icon-wrap">
          ${moduleIconMarkup(m)}
          ${badgeMarkup(m.badge)}
        </span>
        <span class="app-label">${m.title}</span>
      </button>
      <div class="tile-actions" ${editing?'':'hidden'}>
        <button class="remove" data-action="hide" aria-label="${m.title}を非表示">${icon('minus')}</button>
      </div>`;

    tile.querySelector('.tile-main').addEventListener('click',()=>{
      if(Date.now()<suppressUntil)return;
      if(!editing)showComing(m.title);
    });

    tile.querySelector('[data-action="hide"]').addEventListener('click',()=>{
      state.hidden.push(id);
      persist('ホームから非表示にしました');
      render();
      focusTile(visible[index+1]||visible[index-1]);
      if(visible.length===1)$('addCard').focus();
    });

    tile.querySelector('.tile-main').addEventListener('pointerdown',event=>onDown(event,tile,id));
    grid.appendChild(tile);
  });
}

function renderDock(){
  dock.innerHTML='';
  DOCK.forEach(item=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='dock-app';
    btn.setAttribute('aria-label',item.title);
    btn.innerHTML=`<span class="dock-icon-wrap">${moduleIconMarkup(item,'dock-icon')}${badgeMarkup(item.badge)}</span>`;
    btn.addEventListener('click',()=>{
      if(item.id==='settings')showSettings();
      else showComing(item.title);
    });
    dock.appendChild(btn);
  });
}

let suppressUntil=0;

function setEditing(value){
  clearLongPress();
  cancelDrag();
  editing=value;
  render();
}

function clearLongPress(){
  if(longPress){
    clearTimeout(longPress.timer);
    longPress=null;
  }
}

function onDown(event,tile,id){
  if(!event.isPrimary||event.button!==0)return;

  if(!editing){
    clearLongPress();
    longPress={
      x:event.clientX,
      y:event.clientY,
      pointer:event.pointerId,
      timer:setTimeout(()=>{
        longPress=null;
        suppressUntil=Date.now()+800;
        setEditing(true);
        showToast('ホームを編集できます');
      },520)
    };
    return;
  }

  event.preventDefault();
  cancelDrag();
  const rect=tile.getBoundingClientRect();
  drag={
    id,tile,pointer:event.pointerId,
    x:event.clientX,y:event.clientY,
    dx:event.clientX-rect.left,dy:event.clientY-rect.top,
    rect,target:null,ghost:null
  };
  tile.setPointerCapture(event.pointerId);
}

function onMove(event){
  if(longPress&&event.pointerId===longPress.pointer&&Math.hypot(event.clientX-longPress.x,event.clientY-longPress.y)>10){
    clearLongPress();
  }
  if(!drag||event.pointerId!==drag.pointer)return;
  if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7)return;

  event.preventDefault();

  if(!drag.ghost){
    drag.ghost=drag.tile.cloneNode(true);
    drag.ghost.classList.add('drag-ghost');
    drag.ghost.setAttribute('aria-hidden','true');
    drag.ghost.inert=true;
    drag.ghost.style.width=drag.rect.width+'px';
    document.body.appendChild(drag.ghost);
    drag.tile.classList.add('dragging');
  }

  drag.ghost.style.left=(event.clientX-drag.dx)+'px';
  drag.ghost.style.top=(event.clientY-drag.dy)+'px';

  const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('.tile:not(.drag-ghost)');
  grid.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  drag.target=hit&&hit.dataset.id!==drag.id?hit.dataset.id:null;
  if(drag.target)hit.classList.add('drop-target');

  if(event.clientY<70)window.scrollBy(0,-8);
  else if(event.clientY>window.innerHeight-120)window.scrollBy(0,8);
}

function onUp(event){
  clearLongPress();
  if(!drag||event.pointerId!==drag.pointer)return;
  const {id,target,ghost}=drag;
  cancelDrag();
  if(ghost){
    suppressUntil=Date.now()+500;
    if(target){
      state=HomeState.move(state,id,target);
      persist('並び順を変更しました');
    }
    render();
    focusTile(id);
  }
}

function cancelDrag(){
  if(!drag)return;
  const {tile,pointer,ghost}=drag;
  ghost?.remove();
  tile.classList.remove('dragging');
  if(tile.hasPointerCapture(pointer))tile.releasePointerCapture(pointer);
  grid.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
  drag=null;
}

window.addEventListener('pointermove',onMove,{passive:false});
window.addEventListener('pointerup',onUp);
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

function showComing(title){
  openSheet(title);
  const p=document.createElement('p');
  p.className='sheet-message';
  p.textContent='見た目を先に作り込んでいる段階です。この機能の中身や外部サービスとの接続方法は次の段階で決めます。';
  sheetBody.appendChild(p);
  $('closeSheet').focus();
}

function renderHidden(){
  sheetBody.innerHTML='<div class="hidden-list"></div>';
  const list=sheetBody.firstElementChild;

  if(!state.hidden.length){
    list.innerHTML='<p class="sheet-message">現在、非表示の機能はありません。</p>';
    return;
  }

  state.hidden.forEach(id=>{
    const m=byId(id);
    if(!m)return;
    const row=document.createElement('div');
    row.className='hidden-item';
    row.innerHTML=`${moduleIconMarkup(m)}<div class="copy"><strong>${m.title}</strong><p>${m.desc}</p></div><button type="button">追加</button>`;
    row.querySelector('button').addEventListener('click',()=>{
      state.hidden=state.hidden.filter(x=>x!==id);
      persist('ホームに追加しました');
      render();
      renderHidden();
    });
    list.appendChild(row);
  });
}

function showSettings(){
  openSheet('設定');
  sheetBody.innerHTML=
    '<p class="sheet-message">今はホーム画面の見た目と操作感を優先して作っています。各機能の中身と、LINE・Instagramなどの接続方法は後で決めます。</p>'+
    '<button class="settings-link" id="customize" type="button">ホームを編集 <span>›</span></button>'+
    '<div class="settings-link" aria-label="採用中のアプリアイコン">アプリアイコン <span>A案</span></div>';
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
  sheetBody.innerHTML='<p class="sheet-message">ホームの16個のアイコンを初期配置に戻します。</p><button class="primary-button" id="confirmReset" type="button" style="margin-top:18px">初期配置に戻す</button>';
  $('confirmReset').addEventListener('click',()=>{
    state=HomeState.normalize(null,MODULES.map(m=>m.id));
    persist('初期配置に戻しました');
    render();
    closeSheet();
  });
  $('closeSheet').focus();
});

$('storeBtn').addEventListener('click',()=>showComing('店舗を選択'));
$('searchBtn').addEventListener('click',()=>showComing('検索'));

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

render();
renderDock();
