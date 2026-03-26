const XLSX = require('xlsx');
const base = 'C:\\Users\\Ryan\\Downloads\\PLATAFORMA - BIASIHUB';
const wbC = XLSX.readFile(base + '\\CLIENTES BIASI - DETALHADO.xlsx');
const sheetC = wbC.Sheets[wbC.SheetNames[0]];
const rawC = XLSX.utils.sheet_to_json(sheetC, {defval: '', header: 1});

// Mostrar as primeiras 50 linhas raw
for (let i = 0; i < 50; i++) {
  const row = rawC[i];
  if (!row) continue;
  const vals = row.map((v,j) => v ? `[${j}]=${v}` : '').filter(Boolean).join(' | ');
  if (vals) console.log(`ROW ${i}: ${vals}`);
}
