(function(root){
  const LEGACY_KEYS=['restaurantOpsHome.v2','restaurantOpsHome.v1'];
  const LAYOUT_KEY='restaurantOpsHome.v3';

  function uniqueValid(list,valid){
    const out=[];
    for(const id of Array.isArray(list)?list:[]){
      if(valid.has(id)&&!out.includes(id))out.push(id);
    }
    return out;
  }

  function normalize(saved,ids){
    if(!saved||!Array.isArray(saved.order)||!Array.isArray(saved.hidden))return {order:[...ids],hidden:[]};
    const valid=new Set(ids);
    const order=uniqueValid(saved.order,valid);
    ids.forEach(id=>{if(!order.includes(id))order.push(id);});
    return {order,hidden:uniqueValid(saved.hidden,valid)};
  }

  function load(storage,ids){
    for(const key of LEGACY_KEYS){
      try{
        const raw=storage.getItem(key);
        if(raw){
          const saved=JSON.parse(raw);
          if(Array.isArray(saved?.order)&&Array.isArray(saved?.hidden))return normalize(saved,ids);
        }
      }catch(e){}
    }
    return normalize(null,ids);
  }

  function save(storage,state){
    try{
      storage.setItem('restaurantOpsHome.v2',JSON.stringify(state));
      return true;
    }catch(e){
      return false;
    }
  }

  function move(state,fromId,toId){
    const order=[...state.order];
    const from=order.indexOf(fromId),to=order.indexOf(toId);
    if(from<0||to<0||from===to)return state;
    order.splice(to,0,order.splice(from,1)[0]);
    return {order,hidden:[...state.hidden]};
  }

  function normalizeLayout(saved,allIds,defaultHome,defaultDock,maxDock=4){
    const valid=new Set(allIds);
    const hidden=uniqueValid(saved?.hidden,valid);
    const hiddenSet=new Set(hidden);

    const dock=uniqueValid(saved?.dock,valid)
      .filter(id=>!hiddenSet.has(id))
      .slice(0,maxDock);
    const dockSet=new Set(dock);

    const home=uniqueValid(saved?.home,valid)
      .filter(id=>!hiddenSet.has(id)&&!dockSet.has(id));

    const assigned=new Set([...home,...dock,...hidden]);
    for(const id of defaultDock){
      if(!valid.has(id)||assigned.has(id)||dock.length>=maxDock)continue;
      dock.push(id);assigned.add(id);
    }
    for(const id of defaultHome){
      if(!valid.has(id)||assigned.has(id))continue;
      home.push(id);assigned.add(id);
    }
    for(const id of allIds){
      if(!assigned.has(id)){home.push(id);assigned.add(id);}
    }
    return {home,dock,hidden};
  }

  function migrateLegacy(storage,allIds,defaultHome,defaultDock,maxDock){
    for(const key of LEGACY_KEYS){
      try{
        const raw=storage.getItem(key);
        if(!raw)continue;
        const legacy=JSON.parse(raw);
        if(!Array.isArray(legacy?.order)||!Array.isArray(legacy?.hidden))continue;
        const valid=new Set(allIds);
        const hidden=uniqueValid(legacy.hidden,valid);
        const defaultDockSet=new Set(defaultDock);
        const legacyHome=uniqueValid(legacy.order,valid).filter(id=>!defaultDockSet.has(id));
        return normalizeLayout({home:legacyHome,dock:defaultDock,hidden},allIds,defaultHome,defaultDock,maxDock);
      }catch(e){}
    }
    return null;
  }

  function loadLayout(storage,allIds,defaultHome,defaultDock,maxDock=4){
    try{
      const raw=storage.getItem(LAYOUT_KEY);
      if(raw){
        const saved=JSON.parse(raw);
        if(Array.isArray(saved?.home)&&Array.isArray(saved?.dock)&&Array.isArray(saved?.hidden)){
          return normalizeLayout(saved,allIds,defaultHome,defaultDock,maxDock);
        }
      }
    }catch(e){}
    return migrateLegacy(storage,allIds,defaultHome,defaultDock,maxDock) ||
      normalizeLayout(null,allIds,defaultHome,defaultDock,maxDock);
  }

  function saveLayout(storage,layout){
    try{
      storage.setItem(LAYOUT_KEY,JSON.stringify(layout));
      return true;
    }catch(e){
      return false;
    }
  }

  function locate(layout,id){
    if(layout.home.includes(id))return 'home';
    if(layout.dock.includes(id))return 'dock';
    if(layout.hidden.includes(id))return 'hidden';
    return null;
  }

  function moveLayout(layout,id,targetZone,targetId=null,maxDock=4){
    const sourceZone=locate(layout,id);
    if(!sourceZone||!['home','dock'].includes(targetZone))return layout;

    const next={
      home:[...layout.home],
      dock:[...layout.dock],
      hidden:[...layout.hidden]
    };
    const sourceList=next[sourceZone];
    const sourceIndex=sourceList.indexOf(id);
    sourceList.splice(sourceIndex,1);

    if(targetZone==='dock'&&next.dock.length>=maxDock){
      const targetIndex=targetId?next.dock.indexOf(targetId):-1;
      const swapIndex=targetIndex>=0?targetIndex:next.dock.length-1;
      const displaced=next.dock[swapIndex];
      next.dock.splice(swapIndex,1,id);
      if(sourceZone==='home'){
        next.home.splice(Math.min(sourceIndex,next.home.length),0,displaced);
      }else{
        next.home.push(displaced);
      }
      return next;
    }

    const targetList=next[targetZone];
    let insertIndex=targetId?targetList.indexOf(targetId):-1;
    if(insertIndex<0)insertIndex=targetList.length;
    targetList.splice(insertIndex,0,id);
    return next;
  }

  function hideLayout(layout,id){
    const next={home:[...layout.home],dock:[...layout.dock],hidden:[...layout.hidden]};
    next.home=next.home.filter(x=>x!==id);
    next.dock=next.dock.filter(x=>x!==id);
    if(!next.hidden.includes(id))next.hidden.push(id);
    return next;
  }

  function restoreLayout(layout,id){
    const next={home:[...layout.home],dock:[...layout.dock],hidden:[...layout.hidden]};
    next.hidden=next.hidden.filter(x=>x!==id);
    if(!next.home.includes(id)&&!next.dock.includes(id))next.home.push(id);
    return next;
  }

  const api={
    normalize,load,save,move,
    normalizeLayout,loadLayout,saveLayout,moveLayout,hideLayout,restoreLayout
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.HomeState=api;
})(typeof globalThis!=='undefined'?globalThis:this);
