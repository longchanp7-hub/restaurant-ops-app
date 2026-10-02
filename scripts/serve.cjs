const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
function createServer(){return http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';}catch{res.writeHead(400).end();return;}
  if(!/^(index\.html|app\.js|icons\.js|home-state\.js|ops-model\.js|ops-ui\.js|styles\.css|ops\.css|manifest\.webmanifest|app-icon\.svg|icon-candidates\.html|icons\/[\w-]+\.svg)$/.test(name)){res.writeHead(404).end('Not found');return;}
  fs.readFile(path.join(root,name),(error,content)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(name)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(content);});
});}
if(require.main===module){const server=createServer();server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('店舗運営: http://127.0.0.1:'+server.address().port));}
module.exports={createServer};
