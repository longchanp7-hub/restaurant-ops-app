(function(root){
  'use strict';
  const M=root.OpsModel;
  const yen=n=>new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(n);
  const channelNames={website:'ホームページ',instagram:'Instagram',facebook:'Facebook',x:'X',tiktok:'TikTok',line:'LINE',ai:'AIアシスタント'};
  const activeStates={staff:'在籍',menu:'販売中',customers:'利用中',stock:'管理中',ingredients:'使用中'};
  function el(tag,props={},...children){const node=document.createElement(tag);for(const [key,value] of Object.entries(props)){if(key==='class')node.className=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2),value);else if(key==='text')node.textContent=value;else if(key in node)node[key]=value;else node.setAttribute(key,value);}for(const child of children.flat())if(child!==null&&child!==undefined)node.append(typeof child==='string'?document.createTextNode(child):child);return node;}
  const button=(text,action,kind='secondary')=>el('button',{type:'button',class:'ops-button '+kind,text,onclick:action});
  const message=text=>el('p',{class:'ops-note',text});
  const empty=text=>el('p',{class:'ops-empty',text});
  const card=(title,...children)=>el('section',{class:'ops-card'},el('h3',{text:title}),...children);
  const monthRange=()=>{const now=M.today();return [now.slice(0,7)+'-01',now.slice(0,7)+'-'+new Date(Number(now.slice(0,4)),Number(now.slice(5,7)),0).getDate()];};
  function init(options){
    const {storage,body,sheet,openSheet,notify,onChange,onCustomize}=options;
    const store=M.createStore(storage);
    let dirty=false,saving=false;
    let snapshot=store.data;
    const data=()=>snapshot;
    const status=el('div',{class:'ops-error',role:'alert',tabIndex:-1,hidden:true});
    function error(e){status.textContent=e.message||String(e);status.hidden=false;status.focus();}
    function safe(action){try{action();}catch(e){error(e);}}
    function canLeave(){if(saving){notify('保存が終わるまでお待ちください');return false;}return !dirty||window.confirm('保存していない入力があります。破棄して移動しますか？');}
    function shell(title,view){
      dirty=false;openSheet(title);sheet.classList.add('ops-sheet');body.classList.add('ops-content');body.append(status);status.hidden=true;
      if(store.error){status.textContent=store.error;status.hidden=false;}
      document.getElementById('closeSheet').focus();
    }
    function changed(){snapshot=store.data;dirty=false;onChange();}
    async function save(action,after){
      if(saving)return;
      saving=true;
      const pending=[...body.querySelectorAll('button[type=submit]')];pending.forEach(b=>{b.disabled=true;});
      try{
        // All cooperating tabs serialize their writes, then the store checks the original bytes.
        if(navigator.locks)await navigator.locks.request(M.KEY,action);else action();
        changed();notify('保存しました');after();
      }catch(e){error(e);}
      finally{saving=false;pending.forEach(b=>{b.disabled=!!store.error;});}
    }
    function download(name,content,type='application/json'){
      const url=URL.createObjectURL(new Blob([content],{type}));const a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    }
    function backup(){safe(()=>{download('restaurant-ops-'+M.today()+'.json',store.backup());notify('バックアップの保存先を確認してください');});}
    function rawExport(recovery=false){safe(()=>{const raw=recovery?store.recoveryData():store.rawData();if(raw===null)throw Error('保存された元データはありません。');let content=raw,name='元データ.txt';try{const d=M.validate(M.migrate(JSON.parse(raw)));content=JSON.stringify({format:'restaurant-ops-backup',version:M.VERSION,exportedAt:new Date().toISOString(),data:d},null,2);name='保全データ.json';}catch{}download((recovery?'復元前-':'現在-')+name,content);});}
    function input(field,value,source=data(),prefix='f-'){
      let node;
      const props={id:prefix+field.key,name:field.key,required:!!field.required};
      if(field.type==='select'||field.type==='ref'){
        node=el('select',props);
        if(field.type==='ref'){
          node.append(el('option',{value:'',text:field.required?'選択してください':'指定なし'}));
          for(const row of source.entities[field.ref]){
            if(row.status!==activeStates[field.ref]&&row.id!==value)continue;
            node.append(el('option',{value:row.id,text:row.name+(row.status!==activeStates[field.ref]?'（'+row.status+'）':'')}));
          }
        }else field.options.forEach(v=>node.append(el('option',{value:v,text:channelNames[v]||v})));
        node.value=value;
      }else if(field.type==='textarea'){node=el('textarea',{...props,rows:4,maxLength:10000,value});}
      else if(field.type==='checkbox'){node=el('input',{...props,type:'checkbox',checked:!!value});}
      else{
        node=el('input',{...props,type:field.type==='ref'?'text':field.type,value:value??''});
        if(field.type==='number'){node.min=field.min??'';node.max=field.max??'';node.step=field.integer?'1':'0.001';node.inputMode=field.integer?'numeric':'decimal';}
        else if(field.type==='date'){node.min='2000-01-01';node.max='2100-12-31';}
        else if(!['time','date'].includes(field.type))node.maxLength=300;
      }
      const label=el('label',{class:'ops-field'+(field.type==='textarea'?' wide':'')+(field.type==='checkbox'?' check':''),htmlFor:node.id},el('span',{text:field.label+(field.required?' *':'')}),node);
      return {label,node,field};
    }
    function form(fields,values,onSubmit,{submit='保存',extra=null}={}){
      const formNode=el('form',{class:'ops-form'}),controls=fields.map(f=>input(f,values[f.key]));
      formNode.append(...controls.map(c=>c.label));
      if(extra)formNode.append(extra);
      const saveButton=el('button',{type:'submit',class:'ops-button primary',text:submit,disabled:!!store.error});
      formNode.append(el('div',{class:'ops-actions wide'},saveButton));
      formNode.addEventListener('input',()=>{dirty=true;});formNode.addEventListener('change',()=>{dirty=true;});
      formNode.addEventListener('submit',event=>{event.preventDefault();if(!formNode.reportValidity())return;const result={};for(const c of controls)result[c.field.key]=c.field.type==='checkbox'?c.node.checked:c.field.type==='number'?(c.node.value===''?(c.field.nullable?null:NaN):Number(c.node.value)):c.node.value.trim();onSubmit(result,formNode);});
      return formNode;
    }
    function nav(title,action){return button(title,()=>{if(canLeave())action();});}
    function recordLabel(type,row){if(type==='shift')return (data().entities.staff.find(s=>s.id===row.staffId)?.name||'スタッフ')+' / '+row.date;if(type==='movements')return (data().entities.stock.find(s=>s.id===row.stockId)?.name||'在庫品')+' / '+row.kind;return row.name;}
    function detail(type,row){
      const d=data();
      if(type==='sales')return row.date+' · '+yen(M.saleTotal(row))+' · '+row.guests+'名 · '+row.payment;
      if(type==='stock')return M.stockQuantity(d,row.id)+' '+row.unit+' · 発注目安 '+row.minimum;
      if(type==='shift')return row.start+'–'+row.end+(row.overnight?'（翌日）':'')+' · 実働 '+M.shiftMinutes(row)+'分 · '+yen(Math.round(M.shiftMinutes(row)*row.wage/60));
      if(type==='movements')return row.date+' · '+(M.delta(row)>0?'+':'')+M.delta(row);
      if(type==='menu')return (row.category?row.category+' · ':'')+yen(row.price);
      if(type==='ingredients')return row.packQuantity+' '+row.packUnit+' / '+yen(row.packPrice);
      if(type==='recipes'){const cost=M.recipeCost(row);return row.date+' · '+row.servings+'食分 · 1食 '+costMoney(cost.perServing)+' · 原価率 '+(cost.rate===null?'算出不可':cost.rate.toFixed(1)+'%');}
      if(type==='expenses')return row.date+' · '+row.category+' · '+yen(row.amount);
      if(type==='booking')return row.date+' '+row.start+'–'+row.end+' · '+row.guests+'名'+(row.table?' · '+row.table:'');
      if(type==='staff')return (row.role||'担当未設定')+' · 時給 '+yen(row.wage);
      if(type==='customers')return [row.phone,row.tags].filter(Boolean).join(' · ');
      if(type==='drafts')return row.date+' · '+channelNames[row.channel];
      return [row.date,row.start,row.priority].filter(Boolean).join(' · ');
    }
    function exportRows(type,rows){
      const schema=M.schemas[type],fields=schema.fields;
      const header=['ID',...fields.map(f=>f.label)];if(type==='sales')header.push('伝票合計（円）','材料原価（未登録は空欄）','商品明細');if(type==='stock')header.push('現在庫');if(type==='recipes')header.push('材料費合計','1食原価','原価率（%）','1食材料粗利','材料明細');
      const csvRows=rows.map(r=>{const values=[r.id,...fields.map(f=>f.ref?(data().entities[f.ref].find(x=>x.id===r[f.key])?.name||''):r[f.key])];if(type==='sales')values.push(M.saleTotal(r),M.saleCost(r),r.lines.map(l=>l.name+' ×'+l.quantity+' @'+l.price).join(' / '));if(type==='stock')values.push(M.stockQuantity(data(),r.id));if(type==='recipes'){const c=M.recipeCost(r);values.push(c.total,c.perServing,c.rate===null?'':c.rate.toFixed(2),c.margin,r.lines.map(l=>l.name+' '+l.usageQuantity+l.usageUnit+' / 仕入 '+l.packPrice+'円 '+l.packQuantity+l.packUnit).join(' / '));}return values;});
      download(type+'-'+M.today()+'.csv',M.csv([header,...csvRows]),'text/csv;charset=utf-8');
    }
    function list(type,options={}){
      const schema=M.schemas[type];shell(options.title||schema.title,()=>list(type,options));
      const tools=el('div',{class:'ops-actions'});
      if(options.back)tools.append(nav('‹ 戻る',options.back));
      tools.append(button(schema.singular+'を追加',()=>editor(type,null,options),'primary'));
      if(type==='stock')tools.append(button('入出庫履歴',()=>list('movements',{back:()=>list('stock')})));
      if(type==='shift')tools.append(button('スタッフ',()=>list('staff',{back:()=>list('shift')})));
      if(type==='sales')tools.append(button('メニュー',()=>list('menu',{back:()=>list('sales')})));
      if(type==='menu')tools.append(button('原価計算',()=>list('recipes',{back:()=>list('menu')})));
      if(type==='stock')tools.append(button('材料・仕入価格',()=>list('ingredients',{back:()=>list('stock')})));
      if(type==='recipes')tools.append(button('材料・仕入価格',()=>list('ingredients',{back:()=>list('recipes',options)})));
      if(type==='booking')tools.append(button('顧客',()=>list('customers',{back:()=>list('booking')})));
      body.append(tools);
      if(type==='sales')body.append(message('税込の伝票を記録します。在庫の減算は「在庫」で別途入力します。取消伝票は集計から除外します。'));
      if(type==='shift')body.append(message('時刻は日本時間です。勤務済に変更すると勤怠実績として集計します。金額は時給×実働の参考額で、割増・控除を含みません。'));
      if(type==='stock')body.append(message('開始数量と入出庫履歴から在庫を計算します。数量は小数3桁まで。仕入代金は会計に別途記録してください。'));
      if(type==='booking')body.append(message('同日内の予約を管理します。席・人数の重複は保存前に確認表示します。キャンセルも履歴に残ります。'));
      if(type==='recipes')body.append(message('材料の仕入価格・内容量・使用量から計算します。採用した計算は適用日以降の売上入力で原価候補になります。材料価格の変更は保存済み計算や売上を自動変更しません。'));
      if(type==='ingredients')body.append(message('税込の仕入価格と内容量を入力します。g⇔kg、mL⇔Lの換算に対応。個・本・枚・袋は同じ単位同士で計算します。在庫と材料は関連付けのみで、自動入出庫は行いません。'));
      const search=el('input',{type:'search',placeholder:'名前・メモで検索','aria-label':'記録を検索'});
      const stateFilter=el('select',{'aria-label':'状態で絞り込み'},el('option',{value:'',text:'すべての状態'}));
      (schema.fields.find(f=>f.key==='status')?.options||[]).forEach(v=>stateFilter.append(el('option',{value:v,text:v})));
      const filters=el('div',{class:'ops-filters'},search,stateFilter);
      const hasDate=schema.fields.some(f=>f.key==='date');
      const from=el('input',{type:'date','aria-label':'期間の開始',value:['sales','shift','expenses'].includes(type)?monthRange()[0]:''});
      const to=el('input',{type:'date','aria-label':'期間の終了',value:['sales','shift','expenses'].includes(type)?monthRange()[1]:''});
      if(hasDate)filters.append(el('label',{},'開始',from),el('label',{},'終了',to));
      body.append(filters);
      const total=el('p',{class:'ops-note'}),records=el('div',{class:'ops-records'}),pager=el('div',{class:'ops-actions'});let page=0,filtered=[];
      tools.append(button('表示対象をCSV保存',()=>exportRows(type,filtered)));
      const draw=()=>{
        let rows=data().entities[type].filter(r=>!options.channel||r.channel===options.channel);
        rows=rows.filter(r=>(!stateFilter.value||r.status===stateFilter.value)&&(!from.value||!hasDate||r.date>=from.value)&&(!to.value||!hasDate||r.date<=to.value)&&(!search.value||JSON.stringify([recordLabel(type,r),r.notes,r.body,r.phone,r.tags]).toLowerCase().includes(search.value.toLowerCase()))).sort((a,b)=>(b.date||b.updatedAt).localeCompare(a.date||a.updatedAt)||b.updatedAt.localeCompare(a.updatedAt));
        filtered=rows;page=Math.min(page,Math.max(0,Math.ceil(rows.length/30)-1));
        let extra='';
        if(type==='sales')extra=' / 有効売上 '+yen(rows.filter(r=>r.status==='有効').reduce((n,r)=>n+M.saleTotal(r),0));
        if(type==='expenses')extra=' / 有効経費 '+yen(rows.filter(r=>r.status==='有効').reduce((n,r)=>n+r.amount,0));
        if(type==='shift')extra=' / 勤務済 '+(rows.filter(r=>r.status==='勤務済').reduce((n,r)=>n+M.shiftMinutes(r),0)/60).toFixed(1)+'時間';
        total.textContent=(from.value&&to.value&&from.value>to.value?'期間の開始・終了を確認してください。 ':'')+rows.length+'件'+extra;
        records.replaceChildren();
        if(!rows.length)records.append(empty('該当する記録はありません。「'+schema.singular+'を追加」から登録できます。'));
        rows.slice(page*30,page*30+30).forEach(row=>{
          const c=card(recordLabel(type,row),el('p',{class:'ops-record-meta',text:detail(type,row)}));
          if(row.status)c.append(el('span',{class:'ops-tag',text:row.status}));
          if(row.notes)c.append(el('p',{class:'ops-preview',text:row.notes}));
          if(row.body)c.append(el('p',{class:'ops-preview',text:row.body}));
          const actions=el('div',{class:'ops-actions'},button('詳細・編集',()=>editor(type,row.id,options)));
          if(type==='stock')actions.append(button('入出庫を記録',()=>editor('movements',null,{back:()=>list('stock'),values:{stockId:row.id}})));
          if(type==='customers')actions.append(button('来店履歴',()=>customerHistory(row)));
          if(type==='drafts')actions.append(button('本文をコピー',()=>copy(row.body)));
          c.append(actions);records.append(c);
        });
        pager.replaceChildren();
        if(page>0)pager.append(button('前の30件',()=>{page--;draw();}));
        if((page+1)*30<rows.length)pager.append(button('次の30件',()=>{page++;draw();}));
      };
      [search,stateFilter,from,to].forEach(n=>n.addEventListener('input',()=>{page=0;draw();}));body.append(total,records,pager);draw();
    }
    function editor(type,recordId,options={}){
      const schema=M.schemas[type],source=data(),existing=source.entities[type].find(r=>r.id===recordId);
      const values=existing?M.clone(existing):{...M.defaults(schema.fields),...options.values};
      if(!existing){if(type==='sales'){values.guests=1;values.name='売上伝票';values.lines=[{menuId:'',name:'',quantity:1,price:0,unitCost:null}];}if(type==='recipes')values.lines=[{ingredientId:'',name:'',packPrice:null,packQuantity:null,packUnit:'g',usageQuantity:null,usageUnit:'g'}];if(type==='booking')values.guests=1;if(type==='shift'){values.start='10:00';values.end='18:00';values.breakMinutes=60;}if(type==='drafts'&&options.channel)values.channel=options.channel;}
      shell(schema.singular+(recordId?'を編集':'を追加'),()=>editor(type,recordId,options));
      const back=()=>options.back?options.back():list(type,options);
      body.append(nav('‹ 一覧へ',back),message('入力後に「保存」を押してください。* は必須です。'+(recordId?'削除の代わりに状態を変更し、履歴を保持します。':'')));
      const warning=el('div',{class:'ops-notice wide',hidden:true,role:'status'});
      let lineEditor=null;
      if(type==='sales')lineEditor=saleLines(values.lines,source);
      if(type==='recipes')lineEditor=recipeLines(values.lines,source);
      const f=form(schema.fields,values,(record,formNode)=>{
        if(['sales','recipes'].includes(type))record.lines=lineEditor.read();
        if(type==='booking'&&record.status==='予約'){
          const overlaps=source.entities.booking.filter(b=>b.id!==recordId&&b.status==='予約'&&b.date===record.date&&b.start<record.end&&b.end>record.start);
          const warnings=[];
          if(record.table&&overlaps.some(b=>b.table===record.table))warnings.push('同じ席・テーブルの予約と時間が重なります。');
          if(source.settings.seats&&overlaps.reduce((n,b)=>n+b.guests,record.guests)>source.settings.seats)warnings.push('同時間帯の予約人数が席数を超える可能性があります。');
          const signature=JSON.stringify(record);
          if(warnings.length&&formNode.dataset.confirmed!==signature){warning.textContent=warnings.join(' ')+' 内容を確認し、問題なければもう一度「保存」を押してください。';warning.hidden=false;formNode.dataset.confirmed=signature;warning.scrollIntoView({block:'nearest'});return;}
        }
        save(()=>store.upsert(type,record,recordId),back);
      },{extra:el('div',{class:'wide'},...(lineEditor?[lineEditor.node]:[]),warning)});
      if(type==='shift')f.querySelector('[name=staffId]').addEventListener('change',event=>{const staff=source.entities.staff.find(s=>s.id===event.target.value);if(staff)f.querySelector('[name=wage]').value=staff.wage;});
      if(type==='booking')f.querySelector('[name=customerId]').addEventListener('change',event=>{const customer=source.entities.customers.find(s=>s.id===event.target.value);if(customer){f.querySelector('[name=name]').value=customer.name;f.querySelector('[name=phone]').value=customer.phone;}});
      if(type==='sales'){const update=()=>lineEditor.total(f.querySelector('[name=discount]').value);f.addEventListener('input',update);f.addEventListener('change',update);update();}
      if(type==='recipes'){
        const update=()=>lineEditor.total(f.querySelector('[name=servings]').value,f.querySelector('[name=sellingPrice]').value);
        f.querySelector('[name=menuId]').addEventListener('change',event=>{const item=source.entities.menu.find(m=>m.id===event.target.value);if(item){f.querySelector('[name=sellingPrice]').value=item.price;if(!f.querySelector('[name=name]').value)f.querySelector('[name=name]').value=item.name;}update();});
        f.addEventListener('input',update);f.addEventListener('change',update);update();
      }
      if(type==='ingredients')f.querySelector('[name=stockId]').addEventListener('change',event=>{const item=source.entities.stock.find(s=>s.id===event.target.value);if(item&&!f.querySelector('[name=name]').value)f.querySelector('[name=name]').value=item.name;});
      body.append(f);
    }
    function saleLines(initial,source){
      const node=card('商品明細（価格は税込）'),container=el('div',{class:'ops-lines'}),totalLabel=el('p',{class:'ops-total'});let rows=[];let discount=0;
      const read=()=>rows.map(r=>({menuId:r.menu.value,name:r.name.value.trim(),quantity:r.quantity.value===''?NaN:Number(r.quantity.value),price:r.price.value===''?NaN:Number(r.price.value),unitCost:r.unitCost.value===''?null:Number(r.unitCost.value)}));
      const total=v=>{discount=Number(v||0);const amount=read().reduce((n,r)=>n+r.quantity*r.price,0)-discount;totalLabel.textContent='伝票合計 '+(Number.isFinite(amount)?yen(amount):'入力を確認');};
      function add(line={menuId:'',name:'',quantity:1,price:0,unitCost:null}){
        if(rows.length>=100)return;
        const menu=el('select',{'aria-label':'登録メニュー'},el('option',{value:'',text:'自由入力'}));
        source.entities.menu.filter(m=>m.status==='販売中'||m.id===line.menuId).forEach(m=>menu.append(el('option',{value:m.id,text:m.name})));menu.value=line.menuId;
        const name=el('input',{value:line.name,required:true,maxLength:300,'aria-label':'明細の商品名',placeholder:'商品名'});
        const quantity=el('input',{type:'number',value:line.quantity,required:true,min:1,max:10000,step:1,inputMode:'numeric','aria-label':'明細の数量'});
        const price=el('input',{type:'number',value:line.price,required:true,min:0,max:100000000,step:1,inputMode:'numeric','aria-label':'明細の単価'});
        const unitCost=el('input',{type:'number',value:line.unitCost??'',min:0,max:100000000,step:0.001,inputMode:'decimal','aria-label':'明細の1点原価'});
        const row={menu,name,quantity,price,unitCost};rows.push(row);
        const box=el('div',{class:'ops-line'},el('label',{},'メニュー',menu),el('label',{},'商品名',name),el('label',{},'数量',quantity),el('label',{},'単価（円）',price));
        box.append(el('label',{},'1点の原価（円・不明は空欄）',unitCost));
        box.append(button('明細を外す',()=>{if(rows.length===1){notify('明細は1行以上必要です');return;}rows=rows.filter(r=>r!==row);box.remove();dirty=true;total(discount);},'subtle'));
        menu.addEventListener('change',()=>{const item=source.entities.menu.find(m=>m.id===menu.value);if(item){name.value=item.name;price.value=item.price;unitCost.value=M.menuCost(source,item.id,body.querySelector('[name=date]')?.value||M.today())??'';}else unitCost.value='';total(discount);});container.append(box);total(discount);
      }
      initial.forEach(add);node.append(container,button('明細を追加',()=>{add();dirty=true;}),totalLabel,message('原価は保存時の値を保持します。メニューを選ぶと営業日に有効な採用原価、なければ手入力原価をコピーします。不明は空欄のまま記録し、原価集計から区別します。'));return {node,read,total};
    }
    const costMoney=n=>n===null?'未設定':n.toLocaleString('ja-JP',{minimumFractionDigits:2,maximumFractionDigits:2})+'円';
    function recipeLines(initial,source){
      const node=card('材料明細'),container=el('div'),result=el('div',{class:'ops-cost-result'});let rows=[],servings=1,sellingPrice=null;
      const numeric=node=>node.value===''?null:Number(node.value);
      const read=()=>rows.map(r=>({ingredientId:r.ingredient.value,name:r.name.value.trim(),packPrice:numeric(r.packPrice),packQuantity:numeric(r.packQuantity),packUnit:r.packUnit.value,usageQuantity:numeric(r.usageQuantity),usageUnit:r.usageUnit.value}));
      const total=(count,price)=>{servings=Number(count);sellingPrice=price===''?null:Number(price);const c=M.recipeCost({lines:read(),servings,sellingPrice});result.replaceChildren();if(!c){result.append(message('価格・内容量・使用量・食数を入力してください。未入力の材料は0円として計算しません。単位は同じ種類で指定してください。'));return;}result.append(el('div',{class:'ops-metrics'},metric('料理全体の材料費',costMoney(c.total)),metric('1食あたり原価',costMoney(c.perServing)),metric('原価率',c.rate===null?'算出不可':c.rate.toFixed(1)+'%'),metric('1食の材料粗利',costMoney(c.margin))),message('金額表示と売上への原価コピーは小数第2位に四捨五入。原価率は丸め前の材料原価で計算します。販売価格0円・未設定の原価率は算出しません。人件費・光熱費は含みません。'));};
      function add(line={ingredientId:'',name:'',packPrice:null,packQuantity:null,packUnit:'g',usageQuantity:null,usageUnit:'g'}){
        if(rows.length>=100)return;
        const ingredient=el('select',{'aria-label':'登録材料'},el('option',{value:'',text:'自由入力'}));source.entities.ingredients.filter(i=>i.status==='使用中'||i.id===line.ingredientId).forEach(i=>ingredient.append(el('option',{value:i.id,text:i.name})));ingredient.value=line.ingredientId;
        const name=el('input',{value:line.name,required:true,maxLength:300,'aria-label':'明細の材料名'});
        const num=(value,label,min,step)=>el('input',{type:'number',value:value??'',required:true,min,max:100000000,step,inputMode:'decimal','aria-label':label});
        const packPrice=num(line.packPrice,'明細の仕入価格',0,1),packQuantity=num(line.packQuantity,'明細の内容量',0.001,0.001),usageQuantity=num(line.usageQuantity,'明細の使用量',0.001,0.001);
        const unit=(value,label)=>{const s=el('select',{'aria-label':label});Object.keys(M.UNITS).forEach(u=>s.append(el('option',{value:u,text:u})));s.value=value;return s;};
        const packUnit=unit(line.packUnit,'明細の内容量単位'),usageUnit=unit(line.usageUnit,'明細の使用量単位');const row={ingredient,name,packPrice,packQuantity,packUnit,usageQuantity,usageUnit};rows.push(row);
        const box=el('div',{class:'ops-line'},el('label',{},'登録材料',ingredient),el('label',{},'材料名',name),el('label',{},'1包装の税込価格（円）',packPrice),el('label',{},'1包装の内容量',packQuantity),el('label',{},'内容量の単位',packUnit),el('label',{},'料理全体への使用量',usageQuantity),el('label',{},'使用量の単位',usageUnit));
        ingredient.addEventListener('change',()=>{const item=source.entities.ingredients.find(i=>i.id===ingredient.value);if(item){name.value=item.name;packPrice.value=item.packPrice;packQuantity.value=item.packQuantity;packUnit.value=item.packUnit;usageUnit.value=item.packUnit;}total(servings,sellingPrice===null?'':sellingPrice);});
        box.append(button('材料を外す',()=>{if(rows.length===1){notify('材料は1行以上必要です');return;}rows=rows.filter(r=>r!==row);box.remove();dirty=true;total(servings,sellingPrice===null?'':sellingPrice);},'subtle'));container.append(box);
      }
      initial.forEach(add);node.append(container,button('材料を追加',()=>{add();dirty=true;total(servings,sellingPrice===null?'':sellingPrice);}),result);return {node,read,total};
    }
    function metric(label,value){return el('div',{class:'ops-metric'},el('small',{text:label}),el('strong',{text:value}));}
    function dashboard(accounting=false){
      shell(accounting?'会計':'レポート',()=>dashboard(accounting));
      const [start,end]=monthRange();const from=input({key:'from',label:'開始日',type:'date'},start),to=input({key:'to',label:'終了日',type:'date'},end);
      const panel=el('div');body.append(el('div',{class:'ops-actions'},button(accounting?'経費を記録':'日報を書く',()=>editor(accounting?'expenses':'reports',null,{back:()=>dashboard(accounting)}),'primary'),button(accounting?'経費一覧':'日報一覧',()=>list(accounting?'expenses':'reports',{back:()=>dashboard(accounting)})),button('売上を確認',()=>list('sales',{back:()=>dashboard(accounting)}))),el('div',{class:'ops-filters'},from.label,to.label),panel);
      const draw=()=>{
        panel.replaceChildren();if(!M.validDate(from.node.value)||!M.validDate(to.node.value)||from.node.value>to.node.value){panel.append(empty('集計期間を正しく指定してください。'));return;}
        const s=M.summary(data(),from.node.value,to.node.value),previousStart=new Date(from.node.value+'T00:00:00Z'),previousEnd=new Date(to.node.value+'T00:00:00Z');const span=previousEnd-previousStart+86400000;
        const prev=M.summary(data(),new Date(previousStart-span).toISOString().slice(0,10),new Date(previousEnd-span).toISOString().slice(0,10));
        const metrics=el('div',{class:'ops-metrics'},metric('税込売上',yen(s.revenue)),metric('記録済み経費',yen(s.expense)),metric('売上 − 記録済み経費',yen(s.balance)),metric('客単価',yen(s.average)),metric('客数 / 伝票数',s.guests+'名 / '+s.transactions+'件'),metric('直前の同日数との差',yen(s.revenue-prev.revenue)));
        panel.append(metrics,message('集計は有効な記録のみ。差額は税務上の利益ではありません。仕入・経費の未入力分は含みません。'),card('勤務実績（参考）',message('勤務済 '+(s.minutes/60).toFixed(1)+'時間 / 基本時給による参考額 '+yen(s.labor)),message('この金額は経費に自動計上しません。実際の支払額を経費に記録してください。')));
        panel.append(card('材料原価の記録',message('全明細に原価がある伝票 '+s.costedCount+'件 / 原価未登録を含む伝票 '+s.unknownCostCount+'件'),s.costedCount?el('div',{class:'ops-metrics'},metric('原価登録済伝票の売上',yen(s.costedRevenue)),metric('その材料原価',costMoney(s.materialCost)),metric('その材料粗利',costMoney(s.materialMargin))):message('原価集計の対象はありません。未登録の原価を0円として扱いません。'),message('保存時の明細原価だけを使用します。仕入経費とは別の参考値で、収支から二重に差し引きません。'),button('原価計算を開く',()=>list('recipes',{back:()=>dashboard(accounting)}))));
        const payments=card('決済方法別売上');Object.entries(s.payments).forEach(([k,v])=>payments.append(el('p',{class:'ops-pair'},el('span',{text:k}),el('strong',{text:yen(v)}))));panel.append(payments);
        const days=new Map();for(const sale of data().entities.sales.filter(r=>r.status==='有効'&&r.date>=from.node.value&&r.date<=to.node.value))days.set(sale.date,(days.get(sale.date)||0)+M.saleTotal(sale));
        const daily=card('日別売上');if(!days.size)daily.append(empty('この期間の売上記録はありません。'));[...days].sort().forEach(([date,amount])=>daily.append(el('p',{class:'ops-pair'},el('span',{text:date}),el('strong',{text:yen(amount)}))));panel.append(daily);
        const monthStart=M.today().slice(0,7)+'-01',monthEnd=monthRange()[1],month=M.summary(data(),monthStart,monthEnd);
        if(data().settings.target)panel.append(card('今月の目標',message(yen(month.revenue)+' / '+yen(data().settings.target)+'（'+(month.revenue/data().settings.target*100).toFixed(1)+'%）')));
        panel.append(button('集計をCSV保存',()=>download('集計-'+from.node.value+'-'+to.node.value+'.csv',M.csv([['開始','終了','税込売上','記録済み経費','差額','客数','伝票数','客単価','勤務済分','参考人件費'],[from.node.value,to.node.value,s.revenue,s.expense,s.balance,s.guests,s.transactions,s.average,s.minutes,s.labor]]),'text/csv;charset=utf-8')));
      };from.node.addEventListener('input',draw);to.node.addEventListener('input',draw);draw();
    }
    function customerHistory(customer){
      shell(customer.name+' · 来店履歴',()=>customerHistory(customer));body.append(nav('‹ 顧客一覧',()=>list('customers')));
      const sales=data().entities.sales.filter(s=>s.customerId===customer.id&&s.status==='有効').sort((a,b)=>b.date.localeCompare(a.date));
      const bookings=data().entities.booking.filter(s=>s.customerId===customer.id).sort((a,b)=>b.date.localeCompare(a.date));
      body.append(message('売上 '+sales.length+'件 / 合計 '+yen(sales.reduce((n,s)=>n+M.saleTotal(s),0))),card('売上履歴',...sales.map(s=>button(detail('sales',s),()=>editor('sales',s.id,{back:()=>customerHistory(customer)})))),card('予約履歴',...bookings.map(b=>button(detail('booking',b)+' / '+b.status,()=>editor('booking',b.id,{back:()=>customerHistory(customer)})))));
      if(!sales.length&&!bookings.length)body.append(empty('顧客を指定した売上・予約を登録するとここに表示されます。'));
    }
    function alertView(){
      shell('通知',alertView);body.append(message('登録データから生成したアプリ内の確認事項です。プッシュ通知や外部送信は行いません。'));
      const rows=M.alerts(data());const unread=rows.filter(x=>!x.read);
      if(!rows.length)body.append(empty('現在の確認事項はありません。'));
      if(unread.length)body.append(button('すべて確認済みにする',()=>save(()=>store.commit(d=>{d.acknowledged=[...new Set([...d.acknowledged,...rows.map(r=>r.key)])].slice(-10000);}),alertView)));
      rows.forEach(r=>body.append(card(r.title,message(r.detail),el('span',{class:'ops-tag',text:r.read?'確認済み':'未確認'}),el('div',{class:'ops-actions'},button('対象を開く',()=>open(r.target)),...(!r.read?[button('確認済み',()=>save(()=>store.commit(d=>{d.acknowledged=[...d.acknowledged,r.key].slice(-10000);}),alertView))]:[])))));
    }
    function calendarView(){
      shell('カレンダー',calendarView);body.append(message('予約・シフト・タスク・予定をまとめて表示します。時刻は日本時間です。'),el('div',{class:'ops-actions'},button('予定を追加',()=>editor('events',null,{back:calendarView}),'primary'),button('予定一覧',()=>list('events',{back:calendarView}))));
      const month=el('input',{type:'month',value:M.today().slice(0,7),'aria-label':'表示月'}),records=el('div');body.append(month,records);
      const draw=()=>{records.replaceChildren();if(!/^\d{4}-\d\d$/.test(month.value))return;const rows=M.calendar(data(),month.value+'-01',month.value+'-31');if(!rows.length)records.append(empty('この月の予定はありません。'));let last='';for(const r of rows){if(r.date!==last){records.append(el('h3',{text:r.date}));last=r.date;}records.append(button((r.time?r.time+' ':'')+'['+M.schemas[r.kind].title+'] '+r.title,()=>editor(r.kind,r.id,{back:calendarView})));}};month.addEventListener('input',draw);draw();
    }
    async function copy(text){try{await navigator.clipboard.writeText(text);notify('コピーしました');}catch{const box=el('textarea',{class:'ops-copy',value:text,readOnly:true,'aria-label':'コピー用の本文'});body.append(message('自動コピーできませんでした。本文を選択してコピーしてください。'),box);box.focus();box.select();}}
    function connections(channel){
      shell(channelNames[channel],()=>connections(channel));const c=data().connections[channel];
      body.append(card('外部サービスの状態：自動連携なし',message(channel==='ai'?'AIを実行する機能はありません。相談文の準備・保存・コピーができます。':'自動投稿・送信・同期は行いません。リンク、下書き、手動対応の記録を管理できます。'),message('このアプリは外部APIを利用しません。API料金がかかる連携やキー入力機能は搭載していません。')));
      if(c.url)body.append(el('a',{class:'ops-button primary',href:M.safeUrl(c.url),target:'_blank',rel:'noopener noreferrer',text:'登録した接続先を開く'}));
      body.append(el('div',{class:'ops-actions'},nav('外部ページのURLを設定',()=>connectionEditor(channel)),nav('下書きを追加',()=>editor('drafts',null,{channel,back:()=>connections(channel)})),nav('下書き一覧',()=>list('drafts',{channel,title:channelNames[channel]+'の下書き',back:()=>connections(channel)}))));
      if(c.notes)body.append(card('運用メモ',message(c.notes)));
      if(channel==='website'){
        const s=data().settings;body.append(card('店舗案内の原稿',message([s.name,s.address,s.phone,s.hours].filter(Boolean).join('\n')||'設定に店舗情報を登録してください。'),button('店舗情報をコピー',()=>copy([s.name,s.address,s.phone,s.hours].filter(Boolean).join('\n')))),message('店舗案内は原稿として保管します。外部ホームページは自動更新されません。'));
      }
      if(channel==='ai'){
        const topic=input({key:'topic',label:'相談したい内容',type:'textarea'},'今月の店舗運営について、優先して見直す点と行動案を整理してください。');
        const include=input({key:'include',label:'今月の売上・経費の合計だけを相談文に含める',type:'checkbox'},false);
        body.append(topic.label,include.label,button('相談文を作成して保存',()=>{const [from,to]=monthRange(),s=M.summary(data(),from,to);const text=topic.node.value.trim()+(include.node.checked?'\n\n期間: '+from+'〜'+to+'\n税込売上: '+s.revenue+'円\n記録済み経費: '+s.expense+'円\n客数: '+s.guests+'名\n未入力の経費がある可能性があります。':'');if(!topic.node.value.trim()){error(Error('相談したい内容を入力してください。'));return;}save(()=>store.upsert('drafts',{channel:'ai',name:'運営相談 '+M.today(),date:M.today(),body:text,status:'下書き'}),()=>list('drafts',{channel:'ai',back:()=>connections('ai')}));},'primary'),message('この操作は定型文の作成と端末保存です。AIへの送信・回答生成は行いません。氏名や連絡先は自動で含めません。'));
        topic.node.addEventListener('input',()=>{dirty=true;});
      }
    }
    function connectionEditor(channel){
      shell(channelNames[channel]+'の外部リンク',()=>connectionEditor(channel));body.append(nav('‹ 戻る',()=>connections(channel)),message('通常のWebページを開くためのURLを保存します。APIキー・パスワード・秘密の共有URLは入力しないでください。API通信や自動投稿は行いません。'));
      body.append(form([{key:'url',label:'HTTPSのURL',type:'url'},{key:'notes',label:'運用メモ',type:'textarea'}],data().connections[channel],values=>save(()=>{M.safeUrl(values.url);store.commit(d=>{d.connections[channel]=values;});},()=>connections(channel))));
    }
    function settings(){
      shell('設定・バックアップ',settings);const d=data();
      body.append(card('個人版の保存先',message('業務データはこの端末・このブラウザー・このサイト内に保存されます。別端末との自動同期はありません。ブラウザーのデータ削除や端末の故障で失われるため、作業後はJSONバックアップを端末外にも保管してください。'),message('バックアップには顧客・スタッフの情報も含まれます。GitHubや公開場所には置かないでください。ホームの並び順は業務バックアップの対象外で、復元時も現在の配置を保ちます。'),message('最終保存: '+(d.updatedAt?new Date(d.updatedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})+'（日本時間）':'まだ保存されていません'))));
      body.append(el('div',{class:'ops-actions'},button('JSONバックアップを保存',backup,'primary'),button('保存データを再読込',()=>{if(canLeave()){store.load();changed();settings();}}),button('現在の元データを書き出す',()=>rawExport()),button('復元前の安全コピーを書き出す',()=>rawExport(true)),nav('ホーム画面を編集',onCustomize)));
      const file=el('input',{type:'file',accept:'.json,application/json','aria-label':'バックアップJSONを選択'}),preview=el('div');
      file.addEventListener('change',async()=>{
        preview.replaceChildren();const selected=file.files[0];if(!selected)return;
        try{
          if(selected.size>20000000)throw Error('20MB以内のJSONを選択してください。');const imported=M.parseBackup(await selected.text());const expectedRaw=store.rawData();const count=Object.values(imported.data.entities).reduce((n,rs)=>n+rs.length,0);
          const checkbox=el('input',{type:'checkbox'});preview.append(card('復元内容の確認',message('店舗: '+(imported.data.settings.name||'未設定')+' / '+count+'件 / バックアップ作成: '+new Date(imported.exportedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})),message('現在の業務データを置き換えます。先に現在のJSONを保存してください。端末内にも直前のデータを1世代残します。'),el('label',{class:'ops-field check'},checkbox,el('span',{text:'現在の業務データを、この内容に置き換える'})),button('確認したバックアップを復元',()=>{if(!checkbox.checked){error(Error('置き換えの確認にチェックを入れてください。'));return;}if(!canLeave())return;save(()=>store.restore(imported.data,expectedRaw),settings);},'danger')));
        }catch(e){error(e);}
      });body.append(card('JSONバックアップから復元',file,preview));
      body.append(el('h3',{text:'店舗設定'}),form(M.settingsFields,d.settings,values=>save(()=>store.commit(next=>{next.settings=values;}),settings)));
    }
    function help(){
      shell('ヘルプ',help);
      const sections=[['最初の準備','設定で店舗名・席数・目標を保存し、スタッフ・メニュー・在庫品を登録してください。各機能で保存した後、再び開いて内容を確認できます。'],['原価計算','メニューの「原価計算」から、材料の仕入価格・内容量・使用量・出来上がり食数を登録します。gとkg、mLとLを換算します。価格は税込で統一し、廃棄や歩留まり分は使用量に含めてください。採用した計算は適用日以降の売上入力に使えます。過去の計算・売上は材料の価格変更では変わりません。'],['売上と会計','売上は複数明細の伝票として税込額を記録します。取消は集計対象外です。仕入や実際の給与支払は会計の経費に入力してください。会計は簡易の収支管理で、複式簿記・税務申告には対応していません。'],['シフトと在庫','夜勤は「終了は翌日」を指定し、実際に働いた記録を「勤務済」にします。在庫は開始数量＋入庫−出庫−廃棄±調整です。販売による自動減算や仕入による自動経費登録はありません。'],['予約・顧客・カレンダー','予約と売上に顧客を指定すると顧客画面で履歴を確認できます。予約・シフト・期限のあるタスク・予定はカレンダーに表示されます。日付・時刻は日本時間として扱います。'],['取消と保管','記録の編集画面で取消・キャンセル・退職・休止などに変更できます。関連する記録を壊さないため、完全削除は用意していません。個人情報の長期保管は避け、不要な連絡先やメモは編集して空欄にしてください。'],['通知と外部サービス','通知は在庫不足・期限のタスク・当日の予約から作られます。SNS・LINE・ホームページはURLと下書きの管理、AIは相談文の準備ができます。自動投稿・送信・AI実行・外部カレンダー同期は未接続です。'],['保存できないとき','保存エラーでは入力を画面に残します。別タブの変更がある場合は入力を控えてから設定で再読込してください。壊れたデータは自動初期化しません。元データを書き出し、正常なJSONを復元してください。'],['バックアップと端末移行','設定のJSONバックアップをダウンロードして安全な場所へ保管します。新端末で同じサイトを開き、設定でファイルを選択し、復元内容を確認します。現在の業務データは置換されます。CSVは閲覧・集計用で復元には使えません。'],['個人版の範囲','端末とブラウザー内だけの保存です。スタッフとの共有、ログイン・権限管理、複数店舗、暗号化、複数端末同期、オフライン起動の保証はありません。端末を他人と共有する場合は保存情報に注意してください。']];
      sections.forEach(([title,text])=>body.append(card(title,message(text))));body.append(button('設定・バックアップへ',settings,'primary'));
    }
    function open(type){
      if(!canLeave())return false;
      if(['settings','store'].includes(type))settings();
      else if(type==='accounting')dashboard(true);
      else if(type==='reports')dashboard(false);
      else if(type==='alerts')alertView();
      else if(type==='calendar')calendarView();
      else if(type==='help')help();
      else if(M.CHANNELS.includes(type))connections(type);
      else if(M.schemas[type])list(type);
      return true;
    }
    window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
    window.addEventListener('storage',event=>{if(event.key===M.KEY){if(!sheet.hidden){status.textContent='別のタブで保存データが変更されました。入力を控えてから、設定で保存データを再読込してください。';status.hidden=false;}notify('別タブの更新があります。設定から再読込してください');}});
    return {open,canLeave,close(){dirty=false;body.classList.remove('ops-content');sheet.classList.remove('ops-sheet');},get data(){return store.data;},get error(){return store.error;},badge(type){if(store.error)return 0;if(type==='alerts')return M.alerts(data()).filter(a=>!a.read).length;if(type==='booking')return data().entities.booking.filter(b=>b.date===M.today()&&b.status==='予約').length;return 0;}};
  }
  root.OpsUI={init};
})(globalThis);
