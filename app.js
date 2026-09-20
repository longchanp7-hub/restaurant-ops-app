const MODULES=[
{id:'sales',title:'売上・経営分析',desc:'数字から、お店の今を知る',icon:'chart',soft:'#e5f0e9',ink:'#367557'},
{id:'shift',title:'シフト・勤怠',desc:'チームの働き方を整える',icon:'shift',soft:'#f6ecdf',ink:'#a87636'},
{id:'stock',title:'発注・在庫',desc:'必要なものを、必要なだけ',icon:'stock',soft:'#e7eef7',ink:'#587ba0'},
{id:'accounting',title:'会計・経費',desc:'日々のお金の流れを管理',icon:'accounting',soft:'#edeafa',ink:'#8170a5'},
{id:'staff',title:'スタッフ',desc:'一人ひとりと、チームを育む',icon:'staff',soft:'#f8e9e5',ink:'#b87565'},
{id:'tasks',title:'タスク・業務',desc:'今日のやることを、着実に',icon:'tasks',soft:'#f5f0da',ink:'#9a8935'},
{id:'reports',title:'レポート・分析',desc:'記録を、次の判断につなぐ',icon:'reports',soft:'#e9eeed',ink:'#607e74'},
{id:'ai',title:'AIアシスタント',desc:'考える仕事に、もうひとり',icon:'ai',soft:'#f0e9f4',ink:'#92719f'},
{id:'alerts',title:'通知・アラート',desc:'大切なことを、見逃さない',icon:'bell',soft:'#f7eae9',ink:'#b36e6a'}];
let storage;try{storage=window.localStorage;}catch(e){storage={getItem(){return null;},setItem(){throw new Error('storage unavailable');}};}
let state=HomeState.load(storage,MODULES.map(m=>m.id)),editing=false,drag=null,longPress=null,restoreFocus=null,sheetMode='';
const $=id=>document.getElementById(id),grid=$('tileGrid'),sheet=$('bottomSheet'),body=$('sheetBody');
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const byId=id=>MODULES.find(m=>m.id===id),visibleIds=()=>state.order.filter(id=>!state.hidden.includes(id));
function showToast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>$('toast').hidden=true,4000);}
function persist(message){const saved=HomeState.save(storage,state);if(!saved)showToast('変更はこの画面で有効です。端末に保存できないため、再読み込みで元に戻ります。');else if(message)showToast(message);return saved;}
function focusTile(id,action='main'){grid.querySelector(`[data-id="${id}"] [data-action="${action}"]`)?.focus();}
function render(){
 document.body.classList.toggle('editing',editing);$('editBtn').classList.toggle('active',editing);$('editBtn').setAttribute('aria-pressed',String(editing));$('editLabel').textContent=editing?'完了':'編集';
 ['addCard','resetBtn','introCard'].forEach(id=>$(id).hidden=!editing);$('modeText').textContent=editing?'使いやすい順番に、並べ替え。':'よく使う機能をまとめて。';
 const visible=visibleIds();$('moduleCount').textContent=visible.length;$('emptyState').hidden=visible.length>0;
 grid.innerHTML='';visible.forEach((id,index)=>{const m=byId(id),tile=document.createElement('article');tile.className='tile';tile.dataset.id=id;tile.style.setProperty('--tile-soft',m.soft);tile.style.setProperty('--tile-ink',m.ink);
 tile.innerHTML=`<button class="tile-main" type="button" data-action="main" aria-label="${m.title}${editing?'：長押し・ドラッグで移動':''}"><span class="module-icon">${icon(m.icon)}</span><span class="tile-arrow">${icon('arrow')}</span><h3>${m.title}</h3><p>${m.desc}</p></button><div class="tile-actions" ${editing?'':'hidden'}><button class="remove" data-action="hide" aria-label="${m.title}を非表示">${icon('minus')}</button><button data-action="left" aria-label="${m.title}を前へ移動" ${index===0?'disabled':''}>${icon('left')}</button><button data-action="right" aria-label="${m.title}を後ろへ移動" ${index===visible.length-1?'disabled':''}>${icon('right')}</button></div>`;
 tile.querySelector('[data-action="main"]').addEventListener('click',()=>{if(Date.now()<suppressUntil)return;if(!editing)showComing(m.title);});
 tile.querySelector('[data-action="hide"]').addEventListener('click',()=>{state.hidden.push(id);persist('ホームから非表示にしました');render();focusTile(visible[index+1]||visible[index-1]);if(visible.length===1)$('addCard').focus();});
 ['left','right'].forEach((direction,i)=>tile.querySelector(`[data-action="${direction}"]`).addEventListener('click',()=>{const target=visible[index+(i?1:-1)];if(target){state=HomeState.move(state,id,target);persist();render();focusTile(id);}}));
 tile.querySelector('.tile-main').addEventListener('pointerdown',event=>onDown(event,tile,id));grid.appendChild(tile);
 });
}
let suppressUntil=0;
function setEditing(value){clearLongPress();cancelDrag();editing=value;render();}
function clearLongPress(){if(longPress){clearTimeout(longPress.timer);longPress=null;}}
function onDown(event,tile,id){
 if(!event.isPrimary||event.button!==0)return;
 if(!editing){clearLongPress();longPress={x:event.clientX,y:event.clientY,pointer:event.pointerId,timer:setTimeout(()=>{longPress=null;suppressUntil=Date.now()+800;setEditing(true);showToast('ホームを編集できます');},520)};return;}
 event.preventDefault();cancelDrag();const rect=tile.getBoundingClientRect();drag={id,tile,pointer:event.pointerId,x:event.clientX,y:event.clientY,dx:event.clientX-rect.left,dy:event.clientY-rect.top,rect,target:null,ghost:null};tile.setPointerCapture(event.pointerId);
}
function onMove(event){
 if(longPress&&event.pointerId===longPress.pointer&&Math.hypot(event.clientX-longPress.x,event.clientY-longPress.y)>10)clearLongPress();
 if(!drag||event.pointerId!==drag.pointer)return;
 if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<7)return;
 event.preventDefault();if(!drag.ghost){drag.ghost=drag.tile.cloneNode(true);drag.ghost.classList.add('drag-ghost');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.inert=true;drag.ghost.style.width=drag.rect.width+'px';document.body.appendChild(drag.ghost);drag.tile.classList.add('dragging');}
 drag.ghost.style.left=(event.clientX-drag.dx)+'px';drag.ghost.style.top=(event.clientY-drag.dy)+'px';
 const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('.tile:not(.drag-ghost)');grid.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));drag.target=hit&&hit.dataset.id!==drag.id?hit.dataset.id:null;if(drag.target)hit.classList.add('drop-target');
 if(event.clientY<80)window.scrollBy(0,-9);else if(event.clientY>window.innerHeight-100)window.scrollBy(0,9);
}
function onUp(event){clearLongPress();if(!drag||event.pointerId!==drag.pointer)return;const {id,target,ghost}=drag;cancelDrag();if(ghost){suppressUntil=Date.now()+500;if(target){state=HomeState.move(state,id,target);persist('並び順を変更しました');}render();focusTile(id);}}
function cancelDrag(){if(!drag)return;const {tile,pointer,ghost}=drag;ghost?.remove();tile.classList.remove('dragging');if(tile.hasPointerCapture(pointer))tile.releasePointerCapture(pointer);grid.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));drag=null;}
window.addEventListener('pointermove',onMove,{passive:false});window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',()=>{clearLongPress();cancelDrag();});window.addEventListener('blur',()=>{clearLongPress();cancelDrag();});
function openSheet(title,mode='info'){clearLongPress();cancelDrag();restoreFocus=document.activeElement;sheetMode=mode;$('sheetTitle').textContent=title;body.replaceChildren();sheet.hidden=false;$('sheetBackdrop').hidden=false;document.body.style.overflow='hidden';document.querySelector('.app-shell').inert=true;$('closeSheet').focus();}
function closeSheet(){sheet.hidden=true;$('sheetBackdrop').hidden=true;document.body.style.overflow='';document.querySelector('.app-shell').inert=false;if(restoreFocus?.isConnected)restoreFocus.focus();else $('editBtn').focus();sheetMode='';}
function showComing(title){openSheet(title);const p=document.createElement('p');p.className='sheet-message';p.textContent='この機能は準備中です。まずはホームを使いやすく整え、各機能の詳細は次の段階で設計します。';body.appendChild(p);}
function renderHidden(){body.innerHTML='<div class="hidden-list"></div>';const list=body.firstElementChild;if(!state.hidden.length){list.innerHTML='<p class="sheet-message">すべての機能をホームに表示しています。</p>';return;}state.hidden.forEach(id=>{const m=byId(id),row=document.createElement('div');row.className='hidden-item';row.style.setProperty('--tile-soft',m.soft);row.style.setProperty('--tile-ink',m.ink);row.innerHTML=`<span class="module-icon">${icon(m.icon)}</span><div class="copy"><strong>${m.title}</strong><p>${m.desc}</p></div><button aria-label="${m.title}を追加">追加</button>`;row.querySelector('button').addEventListener('click',()=>{state.hidden=state.hidden.filter(x=>x!==id);persist('ホームに追加しました');render();renderHidden();body.querySelector('button')?.focus();if(!state.hidden.length)$('closeSheet').focus();});list.appendChild(row);});}
$('editBtn').addEventListener('click',()=>setEditing(!editing));$('addCard').addEventListener('click',()=>{openSheet('機能を追加','add');renderHidden();});$('closeSheet').addEventListener('click',closeSheet);$('sheetBackdrop').addEventListener('click',closeSheet);
$('resetBtn').addEventListener('click',()=>{openSheet('配置をリセット');body.innerHTML='<p class="sheet-message">9つの機能を初期の並び順に戻します。</p><button class="primary-button" id="confirmReset" style="margin-top:20px">初期配置に戻す</button>';$('confirmReset').addEventListener('click',()=>{state=HomeState.normalize(null,MODULES.map(m=>m.id));persist('初期配置に戻しました');render();closeSheet();});});
$('alertsBtn').addEventListener('click',()=>showComing('お知らせ'));$('storeBtn').addEventListener('click',()=>showComing('店舗を選択'));document.querySelectorAll('[data-coming]').forEach(btn=>btn.addEventListener('click',()=>showComing(btn.dataset.coming)));$('homeBtn').addEventListener('click',()=>{setEditing(false);window.scrollTo({top:0,behavior:'smooth'});});
$('settingsBtn').addEventListener('click',()=>{openSheet('ホームの設定');body.innerHTML='<p class="sheet-message">ホームの並び順と表示する機能は、この端末に保存されます。</p><button class="settings-link" id="customize" style="width:100%;background:white">ホームを編集 <span>→</span></button><a class="settings-link" href="icon-candidates.html">アプリアイコン 8案を見る <span>↗</span></a>';$('customize').addEventListener('click',()=>{closeSheet();setEditing(true);$('editBtn').focus();});});
document.addEventListener('keydown',event=>{if(sheet.hidden)return;if(event.key==='Escape'){event.preventDefault();closeSheet();}if(event.key==='Tab'){const all=[...sheet.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')];const first=all[0],last=all[all.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
render();
