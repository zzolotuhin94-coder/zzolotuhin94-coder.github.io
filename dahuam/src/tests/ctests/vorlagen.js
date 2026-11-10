// lädt alle Vorlagen (CSV und Excel) über die Oberfläche nach ../c-out/vorlagen
const L = require('./lib'); const fs = require('fs'); const path = require('path');
(async () => { const b = await L.launch(); const {p} = await L.open(b); const dir = path.join(L.OUT, 'vorlagen'); fs.mkdirSync(dir, {recursive:true});
  for(const t of ['menu', 'prod', 'rec', 'team']){ await L.openImp(p, t); for(const k of ['csv', 'xlsx']){ const d = await L.dl(p, () => p.click(`#app [data-act="impTpl"][data-id="${k}"]`)); fs.renameSync(d.file, path.join(dir, d.name)); console.log(d.name); } }
  await b.close(); })();
