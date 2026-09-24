const ICON_PATHS={
  chevron:'<path d="m9 5 7 7-7 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  move:'<path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-9 9-3-3 3-3m9 9-3 3-3-3m9-9 3 3-3 3"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>'
};

function standardIcon(path){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
}

const BUSINESS_ART={
sales:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 48V18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M13 48h39" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="20" y="31" width="6" height="12" rx="3" fill="#fff"/><rect x="31" y="24" width="6" height="19" rx="3" fill="#fff" opacity=".92"/><rect x="42" y="17" width="6" height="26" rx="3" fill="#fff" opacity=".84"/><path d="M20 25c6-8 12 3 18-5 4-5 8-4 12-10" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".66"/></svg>',
shift:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="15" width="38" height="36" rx="9" fill="none" stroke="#fff" stroke-width="4"/><path d="M13 27h38M22 11v9m20-9v9" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="m24 39 5 5 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
stock:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 11 20 11-20 11L12 22l20-11Z" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 22v21l20 11 20-11V22M32 33v21" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/><path d="m22 17 20 11" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/></svg>',
accounting:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="9" width="32" height="46" rx="8" fill="rgba(255,255,255,.16)" stroke="#fff" stroke-width="3.5"/><rect x="22" y="16" width="20" height="9" rx="3" fill="#fff" opacity=".9"/><g fill="#fff"><circle cx="24" cy="34" r="2.8"/><circle cx="32" cy="34" r="2.8"/><circle cx="40" cy="34" r="2.8"/><circle cx="24" cy="42" r="2.8"/><circle cx="32" cy="42" r="2.8"/><circle cx="40" cy="42" r="2.8"/><rect x="21" y="48" width="22" height="3.5" rx="1.75"/></g></svg>',
staff:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="25" cy="24" r="8" fill="rgba(255,255,255,.2)" stroke="#fff" stroke-width="3.5"/><circle cx="43" cy="26" r="6.5" fill="rgba(255,255,255,.13)" stroke="#fff" stroke-width="3.2"/><path d="M10 51c1-10 7-16 15-16s14 6 15 16M36 39c2-4 5-6 9-6 7 0 11 5 12 13" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
tasks:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="16" y="12" width="34" height="42" rx="8" fill="rgba(255,255,255,.14)" stroke="#4a3a00" stroke-width="3.5"/><path d="M25 12v-2h16v2" fill="none" stroke="#4a3a00" stroke-width="3.5" stroke-linecap="round"/><path d="m23 30 4 4 8-9M23 43l4 4 8-9M39 31h6M39 44h6" fill="none" stroke="#4a3a00" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
reports:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 9h22l10 10v36H18a6 6 0 0 1-6-6V15a6 6 0 0 1 6-6Z" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-width="3.5"/><path d="M40 9v11h10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/><rect x="22" y="38" width="5" height="10" rx="2.5" fill="#fff"/><rect x="31" y="30" width="5" height="18" rx="2.5" fill="#fff" opacity=".9"/><rect x="40" y="34" width="5" height="14" rx="2.5" fill="#fff" opacity=".78"/></svg>',
alerts:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 43h32c-4-5-5-10-5-18a11 11 0 0 0-22 0c0 8-1 13-5 18Z" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="3.8" stroke-linejoin="round"/><path d="M27 49c1 4 9 4 10 0" fill="none" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/><circle cx="43" cy="16" r="3" fill="#fff" opacity=".7"/></svg>',
booking:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="14" width="40" height="38" rx="9" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="3.5"/><path d="M12 27h40M22 10v9m20-9v9" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="35" cy="39" r="8" fill="none" stroke="#fff" stroke-width="3.2"/><path d="M35 35v5l4 2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
customers:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="26" cy="24" r="8" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="3.5"/><circle cx="44" cy="27" r="6" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="3.2"/><path d="M10 51c1-10 7-16 16-16s15 6 16 16M39 39c2-3 5-5 8-5 6 0 10 5 11 12" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
menu:'<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="17" y="10" width="30" height="44" rx="7" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-width="3.5"/><path d="M24 21h16M24 29h16M24 37h10M24 45h13" stroke="#fff" stroke-width="3.3" stroke-linecap="round"/><circle cx="40" cy="37" r="2.2" fill="#fff"/></svg>',
help:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="3.5"/><path d="M24 25c1-6 6-9 12-8 6 1 9 5 8 10-1 6-8 6-10 11-.5 1-.6 2-.6 4" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><circle cx="32" cy="48" r="2.4" fill="#fff"/></svg>',
ai:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m32 9 6 14 14 6-14 6-6 14-6-14-14-6 14-6 6-14Z" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/><path d="m49 10 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#fff"/></svg>'
};

function businessIcon(name){
  return BUSINESS_ART[name]||null;
}

function instagramIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="44" rx="14" fill="none" stroke="#fff" stroke-width="5"/><circle cx="32" cy="32" r="10" fill="none" stroke="#fff" stroke-width="5"/><circle cx="46" cy="18" r="3.5" fill="#fff"/></svg>';
}
function facebookIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M37 55V35h8l2-9h-10v-5c0-4 2-6 7-6h4V7c-2 0-5-1-9-1-10 0-16 6-16 17v3H15v9h8v20h14Z" fill="#fff"/></svg>';
}
function xIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 13h11l10 14 13-14h6L39 31l17 20H45L34 36 20 51h-6l17-19L15 13Zm9 5 23 28h4L28 18h-4Z" fill="#fff"/></svg>';
}
function tiktokIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M37 12v23c0 10-7 17-17 17S5 45 5 36c0-8 6-15 15-16v9c-4 1-7 3-7 7 0 4 3 7 7 7s8-3 8-8V12h9Z" fill="#25F4EE" transform="translate(-2 1)"/><path d="M37 12c1 7 6 12 14 14v9c-6-1-10-3-14-7v7c0 10-7 17-17 17S5 45 5 36c0-8 6-15 15-16v9c-4 1-7 3-7 7 0 4 3 7 7 7s8-3 8-8V12h10Z" fill="#FE2C55" transform="translate(2 -1)"/><path d="M37 12c1 7 6 12 14 14v7c-6-1-10-3-14-7v9c0 10-7 17-17 17S5 45 5 36c0-8 6-15 15-16v9c-4 1-7 3-7 7 0 4 3 7 7 7s8-3 8-8V12h10Z" fill="#fff"/></svg>';
}
function lineIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M56 29c0-12-11-22-25-22S6 17 6 29c0 11 9 20 21 22 .8.2 2 .6 2.3 1.4.3.7.2 1.7.1 2.4l-.8 4.3c-.3 1.2-1 4.4 4 2.3 5-2 13-7.8 18-13.4 3.6-4 5.4-11 5.4-19Z" fill="#fff"/><text x="18" y="35" fill="#06C755" font-size="12" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="800">LINE</text></svg>';
}
function calendarIcon(){
  const now=new Date();
  const d=now.getDate();
  const days=['日','月','火','水','木','金','土'];
  const w=days[now.getDay()];
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="5" width="52" height="54" rx="13" fill="#fff"/><path d="M6 18V18A13 13 0 0 1 19 5h26a13 13 0 0 1 13 13H6Z" fill="#FF3B30"/><text x="32" y="15" text-anchor="middle" fill="#fff" font-size="9" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="700">'+w+'</text><text x="32" y="47" text-anchor="middle" fill="#111" font-size="28" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="400">'+d+'</text></svg>';
}
function settingsIcon(){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eeeeF2"/><stop offset="1" stop-color="#9d9da3"/></linearGradient></defs><circle cx="32" cy="32" r="25" fill="url(#sg)"/><path d="m32 13 4 2 2 5 5 2 5-2 4 4-2 5 2 5 5 2v6l-5 2-2 5 2 5-4 4-5-2-5 2-2 5h-6l-2-5-5-2-5 2-4-4 2-5-2-5-5-2v-6l5-2 2-5-2-5 4-4 5 2 5-2 2-5 4-2Z" fill="#f8f8fa"/><circle cx="32" cy="32" r="9" fill="#8e8e93"/></svg>';
}

function icon(name){
  const artwork=businessIcon(name);
  if(artwork)return artwork;
  if(name==='instagram')return instagramIcon();
  if(name==='facebook')return facebookIcon();
  if(name==='x')return xIcon();
  if(name==='tiktok')return tiktokIcon();
  if(name==='line')return lineIcon();
  if(name==='calendar')return calendarIcon();
  if(name==='settings')return settingsIcon();
  return standardIcon(ICON_PATHS[name]||ICON_PATHS.close);
}
