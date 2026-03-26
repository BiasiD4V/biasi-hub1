const XLSX = require('xlsx');
const path = require('path');

const base = 'C:\\Users\\Ryan\\Downloads\\PLATAFORMA - BIASIHUB';

// Ler CLIENTES
const wbC = XLSX.readFile(path.join(base, 'CLIENTES BIASI - DETALHADO.xlsx'));
console.log('=== CLIENTES BIASI ===');
console.log('Sheets:', wbC.SheetNames);
const sheetC = wbC.Sheets[wbC.SheetNames[0]];
const dataC = XLSX.utils.sheet_to_json(sheetC, {defval: ''});
console.log('Total rows:', dataC.length);
if (dataC.length > 0) {
  console.log('Columns:', JSON.stringify(Object.keys(dataC[0])));
  dataC.slice(0, 10).forEach((r, i) => console.log('ROW', i, JSON.stringify(r)));
}

console.log('');

// Ler FORNECEDORES
const wbF = XLSX.readFile(path.join(base, 'FORNECEDORES BIASI.xlsx'));
console.log('=== FORNECEDORES BIASI ===');
console.log('Sheets:', wbF.SheetNames);
const sheetF = wbF.Sheets[wbF.SheetNames[0]];
const dataF = XLSX.utils.sheet_to_json(sheetF, {defval: ''});
console.log('Total rows:', dataF.length);
if (dataF.length > 0) {
  console.log('Columns:', JSON.stringify(Object.keys(dataF[0])));
  dataF.slice(0, 10).forEach((r, i) => console.log('ROW', i, JSON.stringify(r)));
}
