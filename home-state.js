(function(root){
  function normalize(saved,ids){if(!saved||!Array.isArray(saved.order)||!Array.isArray(saved.hidden))return {order:[...ids],hidden:[]};const valid=new Set(ids),order=[...new Set(saved.order.filter(id=>valid.has(id)))];ids.forEach(id=>{if(!order.includes(id))order.push(id);});return {order,hidden:[...new Set(saved.hidden.filter(id=>valid.has(id)))]};}
  function load(storage,ids){for(const key of ['restaurantOpsHome.v2','restaurantOpsHome.v1']){try{const raw=storage.getItem(key);if(raw){const saved=JSON.parse(raw);if(Array.isArray(saved?.order)&&Array.isArray(saved?.hidden))return normalize(saved,ids);}}catch(e){}}return normalize(null,ids);}
  function save(storage,state){try{storage.setItem('restaurantOpsHome.v2',JSON.stringify(state));return true;}catch(e){return false;}}
  function move(state,fromId,toId){const order=[...state.order],from=order.indexOf(fromId),to=order.indexOf(toId);if(from<0||to<0||from===to)return state;order.splice(to,0,order.splice(from,1)[0]);return {order,hidden:[...state.hidden]};}
  const api={normalize,load,save,move};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HomeState=api;
})(typeof globalThis!=='undefined'?globalThis:this);
