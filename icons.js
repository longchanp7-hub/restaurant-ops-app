const ICON_PATHS={
chart:'<path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6"/>',
shift:'<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-11 5 2 2 4-4"/>',
stock:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9m-5-16 9 5"/>',
accounting:'<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8m-8 4h2m4 0h2m-8 4h2m4 0h2m-8 3h2m4 0h2"/>',
staff:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/>',
tasks:'<rect x="5" y="4" width="15" height="17" rx="3"/><path d="M9 3v3m-1 6 2 2 4-4m-4 8h6"/>',
reports:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 17v-3m4 3v-5m4 5v-2"/>',
ai:'<path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Zm7 0v4m-2-2h4"/>',
bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 13h6"/>',
store:'<path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0M9 21v-6h6v6"/>',
settings:'<path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
chevron:'<path d="m9 5 7 7-7 7"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
minus:'<path d="M5 12h14"/>',
close:'<path d="m6 6 12 12M6 18 18 6"/>',
move:'<path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-9 9-3-3 3-3m9 9-3 3-3-3m9-9 3 3-3 3"/>',
search:'<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
booking:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-8 4v3m-2-1.5h4"/>',
customers:'<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0m1.5-5a4.5 4.5 0 0 1 4.5 4.5"/>',
menu:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 0 1 4.8 1c0 2-2.6 2-2.6 4m0 3h.01"/>'
};

function standardIcon(path){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
}
function instagramIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.6" cy="7.6" r="1.1" fill="#fff"/></svg>';
}
function facebookIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7h2.6l.5-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8V11H6.2v3h3.1v7h4.2Z" fill="#fff"/></svg>';
}
function xIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h3.7l3.8 5.1 4.7-5.1H19l-5.7 6.3L19.4 19h-3.7l-4.2-5.6L6.4 19H4.6l6-6.8L5 4.5Zm3 1.6L16.5 17.4H18L9.5 6.1H8Z" fill="#fff"/></svg>';
}
function tiktokIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 5v8.3a4.8 4.8 0 1 1-4-4.7v2.6a2.2 2.2 0 1 0 1.4 2.1V5h2.6Z" fill="#25F4EE" transform="translate(-.7,.4)"/><path d="M14.2 5c.4 1.9 1.7 3.2 3.8 3.7v2.6c-1.5-.2-2.8-.8-3.8-1.8v3.8a4.8 4.8 0 1 1-4-4.7v2.6a2.2 2.2 0 1 0 1.4 2.1V5h2.6Z" fill="#FE2C55" transform="translate(.7,-.3)"/><path d="M14.2 5c.4 1.9 1.7 3.2 3.8 3.7v2.1c-1.5-.2-2.8-.8-3.8-1.8v4.3a4.8 4.8 0 1 1-4-4.7v2.6a2.2 2.2 0 1 0 1.4 2.1V5h2.6Z" fill="#fff"/></svg>';
}
function lineIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.2c0-4.1-3.7-7.4-8.3-7.4S3.4 7.1 3.4 11.2c0 3.7 3 6.8 7 7.3.3.1.7.2.8.5.1.2.1.6 0 1l-.3 1.4c-.1.4-.3 1.5 1.3.8 1.7-.7 4.4-2.6 6-4.5 1.2-1.3 1.8-3.7 1.8-6.5Z" fill="#fff"/><text x="6.2" y="13.2" fill="#06C755" font-size="4.6" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="800">LINE</text></svg>';
}
function calendarIcon(){
  const now=new Date();
  const d=now.getDate();
  const days=['日','月','火','水','木','金','土'];
  const w=days[now.getDay()];
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4.8" fill="#fff"/><rect x="2" y="2" width="20" height="6.5" rx="4.8" fill="#FF3B30"/><rect x="2" y="6.5" width="20" height="2" fill="#FF3B30"/><text x="12" y="6.3" text-anchor="middle" fill="#fff" font-size="3.5" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="700">'+w+'</text><text x="12" y="18.2" text-anchor="middle" fill="#111" font-size="10.2" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="400">'+d+'</text></svg>';
}
function settingsIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9d9df"/><stop offset="1" stop-color="#8e8e93"/></linearGradient></defs><circle cx="12" cy="12" r="8.8" fill="url(#sg)"/><path d="m12 5.2 1.2.4.6 1.6 1.7.7 1.5-.8 1 1-.8 1.5.7 1.7 1.6.6.4 1.2-.4 1.2-1.6.6-.7 1.7.8 1.5-1 1-1.5-.8-1.7.7-.6 1.6-1.2.4-1.2-.4-.6-1.6-1.7-.7-1.5.8-1-1 .8-1.5-.7-1.7-1.6-.6-.4-1.2.4-1.2 1.6-.6.7-1.7-.8-1.5 1-1 1.5.8 1.7-.7.6-1.6 1.2-.4Z" fill="#f7f7fa"/><circle cx="12" cy="12" r="2.5" fill="#8e8e93"/></svg>';
}

function icon(name){
  if(name==='instagram') return instagramIcon();
  if(name==='facebook') return facebookIcon();
  if(name==='x') return xIcon();
  if(name==='tiktok') return tiktokIcon();
  if(name==='line') return lineIcon();
  if(name==='calendar') return calendarIcon();
  if(name==='settings') return settingsIcon();
  return standardIcon(ICON_PATHS[name]||ICON_PATHS.help);
}
