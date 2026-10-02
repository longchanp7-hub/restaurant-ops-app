// Only these application assets are ever included in the Pages artifact.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const destination=path.join(root,'dist');
const files=['index.html','styles.css','ops.css','icons.js','home-state.js','ops-model.js','ops-ui.js','app.js','manifest.webmanifest','app-icon.svg'];
if(fs.existsSync(destination))throw Error('dist already exists. Use a fresh checkout or move it aside before building.');
fs.mkdirSync(destination);
for(const name of files)fs.copyFileSync(path.join(root,name),path.join(destination,name));
console.log('Pages artifact: '+files.length+' application files, no business data or test output.');
