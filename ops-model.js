(function(root){
  'use strict';
  const VERSION=2, KEY='restaurantOpsData.v1', RECOVERY_KEY=KEY+'.beforeRestore';
  const CHANNELS=['website','instagram','facebook','x','tiktok','line','ai'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const id=()=>globalThis.crypto.randomUUID();
  const f=(key,label,type='text',extra={})=>({key,label,type,...extra});
  const state=(values)=>f('status','状態','select',{options:values});
  const notes=f('notes','メモ','textarea');
  const required={required:true};
  const money={min:0,max:100000000,integer:true};
  const count={min:0,max:1000000};
  const UNITS={g:{group:'mass',factor:1},kg:{group:'mass',factor:1000},mL:{group:'volume',factor:1},L:{group:'volume',factor:1000},個:{group:'piece',factor:1},本:{group:'bottle',factor:1},枚:{group:'sheet',factor:1},袋:{group:'bag',factor:1}};
  const schemas={
    staff:{title:'スタッフ',singular:'スタッフ',fields:[f('name','氏名','text',required),f('role','担当'),f('phone','連絡先','tel'),f('wage','時給（円）','number',money),state(['在籍','休職','退職']),notes]},
    menu:{title:'メニュー',singular:'商品',fields:[f('name','商品名','text',required),f('category','分類'),f('price','税込価格（円）','number',money),f('cost','手入力の1食原価（円・未設定は空欄）','number',{min:0,max:100000000,nullable:true}),state(['販売中','休止']),notes]},
    customers:{title:'顧客',singular:'顧客',fields:[f('name','顧客名','text',required),f('phone','電話番号','tel'),f('email','メール','email'),f('tags','タグ'),state(['利用中','保管']),notes]},
    stock:{title:'在庫',singular:'在庫品',fields:[f('name','品名','text',required),f('unit','単位（kg・個など）','text',required),f('openingDate','開始日','date',required),f('opening','開始時の数量','number',count),f('minimum','発注目安の数量','number',count),f('cost','単位あたり参考原価（円・未設定は空欄）','number',{min:0,max:100000000,nullable:true}),state(['管理中','休止']),notes]},
    ingredients:{title:'材料・仕入価格',singular:'材料',fields:[f('name','材料名','text',required),f('stockId','関連する在庫品','ref',{ref:'stock'}),f('packPrice','1包装の仕入価格（税込円）','number',{...money,required:true,default:null}),f('packQuantity','1包装の内容量','number',{min:0.001,max:1000000,required:true,default:null}),f('packUnit','内容量の単位','select',{options:Object.keys(UNITS)}),state(['使用中','休止']),notes]},
    recipes:{title:'原価計算',singular:'原価計算',fields:[f('name','料理名・計算名','text',required),f('menuId','関連するメニュー','ref',{ref:'menu'}),f('date','適用日','date',required),f('servings','出来上がり食数','number',{min:0.001,max:10000,required:true,default:1}),f('sellingPrice','1食の税込販売価格（未設定は空欄）','number',{...money,nullable:true}),state(['試作','採用','保管']),notes]},
    movements:{title:'入出庫',singular:'入出庫',fields:[f('stockId','在庫品','ref',{ref:'stock',required:true}),f('date','日付','date',required),f('kind','区分','select',{options:['入庫','出庫','廃棄','差分調整']}),f('quantity','数量（差分調整のみ負数可）','number',{min:-1000000,max:1000000}),state(['有効','取消']),notes]},
    shift:{title:'シフト',singular:'シフト',fields:[f('staffId','スタッフ','ref',{ref:'staff',required:true}),f('date','勤務日','date',required),f('start','開始','time',required),f('end','終了','time',required),f('overnight','終了は翌日','checkbox'),f('breakMinutes','休憩（分）','number',{min:0,max:1439,integer:true}),f('wage','適用時給（円）','number',money),state(['予定','勤務済','欠勤','取消']),notes]},
    expenses:{title:'会計・経費',singular:'経費',fields:[f('date','日付','date',required),f('name','支払先・内容','text',required),f('category','区分','select',{options:['仕入','人件費','家賃','水道光熱','消耗品','広告','その他']}),f('amount','税込金額（円）','number',{...money,min:1}),f('payment','支払方法','select',{options:['現金','カード','振込','その他']}),state(['有効','取消']),notes]},
    tasks:{title:'タスク',singular:'タスク',fields:[f('name','タスク名','text',required),f('date','期限','date',required),f('staffId','担当','ref',{ref:'staff'}),f('priority','優先度','select',{options:['通常','高','低']}),state(['未着手','進行中','完了','取消']),notes]},
    booking:{title:'予約',singular:'予約',fields:[f('name','予約名','text',required),f('customerId','顧客','ref',{ref:'customers'}),f('phone','電話番号','tel'),f('date','来店日','date',required),f('start','開始','time',required),f('end','終了','time',required),f('guests','人数','number',{min:1,max:999,integer:true}),f('table','席・テーブル'),state(['予約','来店済','キャンセル','無断キャンセル']),notes]},
    events:{title:'予定',singular:'予定',fields:[f('name','予定名','text',required),f('date','日付','date',required),f('start','開始時刻','time'),f('end','終了時刻','time'),state(['予定','完了','取消']),notes]},
    reports:{title:'日報',singular:'日報',fields:[f('date','営業日','date',required),f('name','見出し','text',required),f('notes','営業の振り返り・引継ぎ','textarea',required)]},
    drafts:{title:'投稿・相談の下書き',singular:'下書き',fields:[f('channel','対象','select',{options:CHANNELS}),f('name','件名','text',required),f('date','予定日','date',required),f('body','本文','textarea',required),state(['下書き','準備完了','手動対応済'])]},
    sales:{title:'売上',singular:'売上',fields:[f('date','営業日','date',required),f('name','伝票名・摘要','text',required),f('customerId','顧客','ref',{ref:'customers'}),f('guests','客数','number',{min:1,max:999,integer:true}),f('payment','決済方法','select',{options:['現金','カード','電子決済','その他']}),f('discount','値引き（円）','number',money),state(['有効','取消']),notes]}
  };
  const settingsFields=[f('name','店舗名'),f('phone','電話番号','tel'),f('address','住所'),f('seats','席数（0は未設定）','number',{min:0,max:10000,integer:true}),f('target','月間売上目標（円・0は未設定）','number',money),f('hours','営業時間'),f('notes','店舗メモ','textarea')];
  function defaults(fields){return Object.fromEntries(fields.map(x=>[x.key,Object.hasOwn(x,'default')?x.default:x.nullable?null:x.type==='number'?0:x.type==='checkbox'?false:x.type==='date'?today():x.type==='select'?x.options[0]:'']));}
  function blank(){return {version:VERSION,revision:0,updatedAt:null,settings:defaults(settingsFields),entities:Object.fromEntries(Object.keys(schemas).map(k=>[k,[]])),connections:Object.fromEntries(CHANNELS.map(k=>[k,{url:'',notes:''}])),acknowledged:[]};}
  function fail(message){throw new Error(message);}
  function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(label+'の形式が不正です。');}
  function exactKeys(value,keys,label){object(value,label);if(Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(value,k)))fail(label+'の項目が一致しません。');}
  function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return value>='2000-01-01'&&value<='2100-12-31'&&!Number.isNaN(+d)&&d.toISOString().slice(0,10)===value;}
  function validTime(value){return typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
  function safeUrl(value){if(value==='')return '';try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)fail('invalid');return u.href;}catch{fail('URLは認証情報を含まない https:// から始まる形式にしてください。');}}
  function checkField(field,value){
    const label=field.label;
    if(field.type==='number'){
      if(field.nullable&&value===null)return;
      if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>100000000||value<(field.min??-Infinity)||value>(field.max??Infinity)||(field.integer&&!Number.isInteger(value))||Math.abs(value*1000-Math.round(value*1000))>0.00001)fail(label+'の数値・範囲を確認してください（小数は3桁まで）。');
    }else if(field.type==='checkbox'){if(typeof value!=='boolean')fail(label+'が不正です。');}
    else{
      if(typeof value!=='string'||value.length>(field.type==='textarea'?10000:300))fail(label+'は'+(field.type==='textarea'?'10000':'300')+'文字以内で入力してください。');
      if(field.required&&!value.trim())fail(label+'を入力してください。');
      if(field.type==='select'&&!field.options.includes(value))fail(label+'を選択してください。');
      if(field.type==='date'&&value&&!validDate(value))fail(label+'に有効な日付（2000〜2100年）を入力してください。');
      if(field.type==='time'&&value&&!validTime(value))fail(label+'の時刻を確認してください。');
      if(field.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))fail(label+'を確認してください。');
    }
  }
  const validId=value=>typeof value==='string'&&/^[\w-]{1,80}$/.test(value);
  const stamp=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT/.test(value)&&Number.isFinite(Date.parse(value));
  function saleTotal(sale){return sale.lines.reduce((sum,line)=>sum+line.quantity*line.price,0)-sale.discount;}
  const roundCost=n=>Math.round((n+Number.EPSILON)*100)/100;
  function recipeCost(recipe){
    if(!recipe.lines?.length||!(recipe.servings>0))return null;
    let total=0;
    for(const line of recipe.lines){
      const pack=UNITS[line.packUnit],usage=UNITS[line.usageUnit];
      if(line.packPrice===null||!Number.isFinite(line.packPrice)||line.packPrice<0||!(line.packQuantity>0)||!(line.usageQuantity>0)||!pack||!usage||pack.group!==usage.group)return null;
      total+=line.packPrice*line.usageQuantity*usage.factor/(line.packQuantity*pack.factor);
    }
    const perServing=total/recipe.servings;
    return {total:roundCost(total),perServing:roundCost(perServing),rate:recipe.sellingPrice>0?perServing/recipe.sellingPrice*100:null,margin:recipe.sellingPrice===null?null:roundCost(recipe.sellingPrice-perServing)};
  }
  function menuCost(data,menuId,date=today()){
    const recipe=data.entities.recipes.filter(r=>r.menuId===menuId&&r.status==='採用'&&r.date<=date).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt))[0];
    return recipe?recipeCost(recipe).perServing:(data.entities.menu.find(m=>m.id===menuId)?.cost??null);
  }
  function saleCost(sale){return sale.lines.some(l=>l.unitCost===null)?null:roundCost(sale.lines.reduce((n,l)=>n+l.unitCost*l.quantity,0));}
  function shiftRange(s){const start=Date.parse(s.date+'T'+s.start+':00Z');let end=Date.parse(s.date+'T'+s.end+':00Z');if(s.overnight)end+=86400000;return [start,end];}
  function shiftMinutes(s){const [a,b]=shiftRange(s);return (b-a)/60000-s.breakMinutes;}
  function delta(m){return ['出庫','廃棄'].includes(m.kind)?-m.quantity:m.quantity;}
  function stockQuantity(data,stockId){const item=data.entities.stock.find(x=>x.id===stockId);return Math.round((item.opening+data.entities.movements.filter(m=>m.stockId===stockId&&m.status==='有効').reduce((n,m)=>n+delta(m),0))*1000)/1000;}
  function validate(data){
    exactKeys(data,['version','revision','updatedAt','settings','entities','connections','acknowledged'],'データ');
    if(data.version!==VERSION)fail('このデータのバージョンには対応していません。');
    if(!Number.isSafeInteger(data.revision)||data.revision<0||!(data.updatedAt===null||stamp(data.updatedAt)))fail('保存情報が不正です。');
    exactKeys(data.settings,settingsFields.map(f=>f.key),'店舗設定');
    settingsFields.forEach(f=>checkField(f,data.settings[f.key]));
    exactKeys(data.entities,Object.keys(schemas),'業務データ');
    const allIds=new Set();
    for(const [type,schema] of Object.entries(schemas)){
      const rows=data.entities[type];
      if(!Array.isArray(rows)||rows.length>50000)fail(schema.title+'の件数が不正です。');
      for(const row of rows){
        exactKeys(row,['id','createdAt','updatedAt',...schema.fields.map(f=>f.key),...(['sales','recipes'].includes(type)?['lines']:[])],schema.singular);
        if(!validId(row.id)||allIds.has(row.id)||!stamp(row.createdAt)||!stamp(row.updatedAt))fail(schema.singular+'のID・日時が不正または重複しています。');
        allIds.add(row.id);
        schema.fields.forEach(f=>checkField(f,row[f.key]));
        if(type==='sales'){
          if(!Array.isArray(row.lines)||!row.lines.length||row.lines.length>100)fail('売上明細は1〜100行必要です。');
          row.lines.forEach(line=>{
            exactKeys(line,['menuId','name','quantity','price','unitCost'],'売上明細');
            checkField(f('name','商品名','text',required),line.name);
            checkField(f('quantity','販売数量','number',{min:1,max:10000,integer:true}),line.quantity);
            checkField(f('price','販売価格','number',money),line.price);
            checkField(f('unitCost','保存時の1点原価','number',{min:0,max:100000000,nullable:true}),line.unitCost);
            if(typeof line.menuId!=='string'||(line.menuId&&!data.entities.menu.some(m=>m.id===line.menuId)))fail('売上明細の商品が見つかりません。');
          });
          const total=saleTotal(row);
          if(!Number.isSafeInteger(total)||total<0||total>100000000)fail('値引きは明細合計以下、伝票合計は1億円以下にしてください。');
        }
        if(type==='recipes'){
          if(!Array.isArray(row.lines)||!row.lines.length||row.lines.length>100)fail('材料明細は1〜100行必要です。');
          for(const line of row.lines){
            exactKeys(line,['ingredientId','name','packPrice','packQuantity','packUnit','usageQuantity','usageUnit'],'材料明細');
            checkField(f('name','材料名','text',required),line.name);
            checkField(f('packPrice','仕入価格','number',money),line.packPrice);
            for(const key of ['packQuantity','usageQuantity'])checkField(f(key,'内容量・使用量','number',{min:0.001,max:1000000}),line[key]);
            for(const key of ['packUnit','usageUnit'])checkField(f(key,'材料の単位','select',{options:Object.keys(UNITS)}),line[key]);
            if(UNITS[line.packUnit].group!==UNITS[line.usageUnit].group)fail('内容量と使用量の単位を合わせてください。g⇔kg、mL⇔Lのみ換算できます。');
            if(typeof line.ingredientId!=='string'||(line.ingredientId&&!data.entities.ingredients.some(i=>i.id===line.ingredientId)))fail('材料の参照先が見つかりません。');
          }
          const result=recipeCost(row);
          if(!result||result.total>100000000||result.perServing>100000000)fail('材料の価格・数量・食数を確認してください。計算結果は1億円以下にしてください。');
        }
        if(type==='shift'){
          const [a,b]=shiftRange(row);
          if(b<=a||b-a>86400000||shiftMinutes(row)<=0)fail('勤務時間は24時間以内、休憩は勤務時間未満にしてください。夜勤は「終了は翌日」を選択します。');
        }
        if(type==='booking'&&row.end<=row.start)fail('予約の終了は開始より後にしてください（同日内）。');
        if(type==='events'&&((row.end&&!row.start)||(row.end&&row.end<=row.start)))fail('予定の終了は開始より後にしてください（同日内）。');
        if(type==='movements'&&(row.quantity===0||(row.kind!=='差分調整'&&row.quantity<0)))fail('入出庫数量は正数、差分調整は0以外にしてください。');
      }
    }
    for(const [type,schema] of Object.entries(schemas))for(const row of data.entities[type])for(const field of schema.fields.filter(f=>f.ref))if(row[field.key]&&!data.entities[field.ref].some(x=>x.id===row[field.key]))fail(schema.singular+'の'+field.label+'が見つかりません。');
    const shifts=data.entities.shift.filter(s=>['予定','勤務済'].includes(s.status)).sort((a,b)=>shiftRange(a)[0]-shiftRange(b)[0]);
    const ends=new Map();
    for(const s of shifts){const [a,b]=shiftRange(s);if((ends.get(s.staffId)??-Infinity)>a)fail('同じスタッフの勤務時間が重複しています。');ends.set(s.staffId,b);}
    for(const item of data.entities.stock){
      let quantity=item.opening;
      for(const m of data.entities.movements.filter(m=>m.stockId===item.id&&m.status==='有効').sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))){
        if(m.date<item.openingDate)fail('入出庫日は在庫の開始日以降にしてください。');
        quantity=Math.round((quantity+delta(m))*1000)/1000;
        if(quantity<0||quantity>100000000)fail(item.name+'の在庫が途中で負数または上限超過になります。日付と数量を確認してください。');
      }
    }
    exactKeys(data.connections,CHANNELS,'接続先');
    for(const value of Object.values(data.connections)){exactKeys(value,['url','notes'],'接続先');checkField(f('url','URL'),value.url);safeUrl(value.url);checkField(notes,value.notes);}
    if(!Array.isArray(data.acknowledged)||data.acknowledged.length>10000||data.acknowledged.some(x=>typeof x!=='string'||x.length>250))fail('確認済み通知の形式が不正です。');
    return data;
  }
  function migrate(value){
    if(value?.version!==1)return value;
    const d=clone(value);d.version=VERSION;
    if(!d.entities||!Array.isArray(d.entities.sales)||!Array.isArray(d.entities.menu)||!Array.isArray(d.entities.stock))fail('旧データの形式が不正です。');
    exactKeys(d.entities,Object.keys(schemas).filter(k=>!['ingredients','recipes'].includes(k)),'旧業務データ');
    // A version-1 zero was also the default for an unknown cost. Preserve that uncertainty.
    for(const row of [...d.entities.menu,...d.entities.stock])if(row.cost===0)row.cost=null;
    for(const sale of d.entities.sales){if(!Array.isArray(sale.lines))fail('旧売上明細が不正です。');for(const line of sale.lines){exactKeys(line,['menuId','name','quantity','price'],'旧売上明細');line.unitCost=null;}}
    d.entities.ingredients=[];d.entities.recipes=[];
    return d;
  }
  function createStore(storage){
    let current=blank(),raw=null,error=null;
    function load(){
      try{const nextRaw=storage.getItem(KEY);const next=nextRaw===null?blank():validate(migrate(JSON.parse(nextRaw)));raw=nextRaw;current=next;error=null;return true;}
      catch(e){error='保存データを読み込めません。元データを保護するため入力を停止しています。設定から元データを書き出し、バックアップを復元してください。 '+e.message;return false;}
    }
    load();
    function commit(mutator){
      if(error)fail(error);
      if(storage.getItem(KEY)!==raw)fail('別のタブでデータが変更されました。入力内容を控え、設定の「保存データを再読込」を押してください。');
      const next=clone(current);mutator(next);next.revision=current.revision+1;next.updatedAt=new Date().toISOString();validate(next);
      const nextRaw=JSON.stringify(next);
      try{storage.setItem(KEY,nextRaw);}catch{fail('端末に保存できませんでした。入力内容は画面に残っています。空き容量とブラウザー設定を確認し、バックアップを保存してください。');}
      current=next;raw=nextRaw;return clone(current);
    }
    function upsert(type,values,recordId){
      if(!schemas[type])fail('未知の機能です。');
      return commit(data=>{
        const rows=data.entities[type],index=recordId?rows.findIndex(x=>x.id===recordId):-1;
        if(recordId&&index<0)fail('編集対象が見つかりません。');
        const now=new Date().toISOString();
        const row={...clone(values),id:recordId||id(),createdAt:index<0?now:rows[index].createdAt,updatedAt:now};
        if(index<0)rows.push(row);else rows[index]=row;
      });
    }
    function backup(){if(error)fail('読み込みに失敗しています。「元データを書き出す」を使用してください。');return JSON.stringify({format:'restaurant-ops-backup',version:VERSION,exportedAt:new Date().toISOString(),data:current},null,2);}
    function restore(candidate,expectedRaw){
      const next=clone(validate(candidate));
      const oldRaw=storage.getItem(KEY);
      if(oldRaw!==expectedRaw)fail('プレビュー後に保存内容が変わりました。ファイルを選び直してください。');
      // Preserve the exact old bytes before touching the primary key. A failed write never clears it.
      if(oldRaw!==null){try{storage.setItem(RECOVERY_KEY,oldRaw);}catch{fail('復元前の安全コピーを保存できません。元データは変更していません。');}}
      next.revision=Math.max(next.revision,current.revision)+1;next.updatedAt=new Date().toISOString();validate(next);
      const serialized=JSON.stringify(next);
      try{storage.setItem(KEY,serialized);}catch{fail('復元データを保存できません。元データは変更していません。');}
      raw=serialized;current=next;error=null;
    }
    return {get data(){return clone(current);},get error(){return error;},get raw(){return raw;},load,commit,upsert,backup,restore,rawData:()=>storage.getItem(KEY),recoveryData:()=>storage.getItem(RECOVERY_KEY)};
  }
  function parseBackup(text){
    if(typeof text!=='string'||text.length>20000000)fail('バックアップは20MB以内のJSONを選択してください。');
    let parsed;try{parsed=JSON.parse(text);}catch{fail('JSONを読み取れません。ファイルを確認してください。');}
    exactKeys(parsed,['format','version','exportedAt','data'],'バックアップ');
    if(parsed.format!=='restaurant-ops-backup'||![1,VERSION].includes(parsed.version)||parsed.data?.version!==parsed.version||!stamp(parsed.exportedAt))fail('店舗運営アプリの対応するバックアップではありません。');
    parsed.data=validate(migrate(parsed.data));return parsed;
  }
  function summary(data,from,to){
    const within=r=>r.date>=from&&r.date<=to;
    const sales=data.entities.sales.filter(r=>r.status==='有効'&&within(r));
    const expenses=data.entities.expenses.filter(r=>r.status==='有効'&&within(r));
    const revenue=sales.reduce((n,s)=>n+saleTotal(s),0),expense=expenses.reduce((n,e)=>n+e.amount,0),guests=sales.reduce((n,s)=>n+s.guests,0);
    const shifts=data.entities.shift.filter(r=>r.status==='勤務済'&&within(r));
    const labor=shifts.reduce((n,s)=>n+Math.round(shiftMinutes(s)*s.wage/60),0);
    const costed=sales.filter(s=>saleCost(s)!==null),costedRevenue=costed.reduce((n,s)=>n+saleTotal(s),0),materialCost=roundCost(costed.reduce((n,s)=>n+saleCost(s),0));
    return {revenue,expense,balance:revenue-expense,guests,transactions:sales.length,average:guests?Math.round(revenue/guests):0,labor,costedCount:costed.length,unknownCostCount:sales.length-costed.length,costedRevenue,materialCost,materialMargin:roundCost(costedRevenue-materialCost),minutes:shifts.reduce((n,s)=>n+shiftMinutes(s),0),payments:Object.fromEntries(['現金','カード','電子決済','その他'].map(p=>[p,sales.filter(s=>s.payment===p).reduce((n,s)=>n+saleTotal(s),0)]))};
  }
  function alerts(data,date=today()){
    const out=[];
    const add=(key,title,detail,target)=>out.push({key,title,detail,target,read:data.acknowledged.includes(key)});
    for(const s of data.entities.stock.filter(x=>x.status==='管理中')){const q=stockQuantity(data,s.id);if(q<=s.minimum)add('stock:'+s.id+':'+q,s.name+'の在庫が発注目安以下',q+' '+s.unit+' / 目安 '+s.minimum,'stock');}
    for(const t of data.entities.tasks.filter(t=>['未着手','進行中'].includes(t.status)&&t.date<=date))add('task:'+t.id+':'+t.updatedAt,t.name,t.date+(t.date<date?' 期限超過':' 本日期限'),'tasks');
    for(const b of data.entities.booking.filter(b=>b.status==='予約'&&b.date===date))add('booking:'+b.id+':'+b.updatedAt,b.name+'様の予約',b.start+' / '+b.guests+'名','booking');
    return out;
  }
  function calendar(data,from,to){
    const out=[];const add=(r,kind,title,time='')=>{if(r.date>=from&&r.date<=to)out.push({id:r.id,date:r.date,time,title,kind});};
    data.entities.booking.filter(r=>r.status==='予約').forEach(r=>add(r,'booking',r.name+'様 '+r.guests+'名',r.start));
    data.entities.shift.filter(r=>['予定','勤務済'].includes(r.status)).forEach(r=>add(r,'shift',(data.entities.staff.find(s=>s.id===r.staffId)?.name||'')+' '+r.start+'–'+r.end+(r.overnight?'（翌日）':''),r.start));
    data.entities.tasks.filter(r=>['未着手','進行中'].includes(r.status)).forEach(r=>add(r,'tasks',r.name));
    data.entities.events.filter(r=>r.status!=='取消').forEach(r=>add(r,'events',r.name+(r.status==='完了'?'（完了）':''),r.start));
    return out.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  }
  function csv(rows){const cell=value=>{let text=String(value??'');if(/^[\s]*[=+\-@]|^[\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n');}
  const api={VERSION,KEY,RECOVERY_KEY,CHANNELS,UNITS,schemas,settingsFields,defaults,blank,today,validate,migrate,createStore,parseBackup,saleTotal,saleCost,recipeCost,menuCost,shiftMinutes,stockQuantity,delta,summary,alerts,calendar,csv,safeUrl,validDate,clone};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OpsModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
