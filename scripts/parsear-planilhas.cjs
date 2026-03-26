const XLSX = require('xlsx');
const fs = require('fs');
const base = 'C:\\Users\\Ryan\\Downloads\\PLATAFORMA - BIASIHUB';

// ====== PARSEAR CLIENTES ======
const wbC = XLSX.readFile(base + '\\CLIENTES BIASI - DETALHADO.xlsx');
const sheetC = wbC.Sheets[wbC.SheetNames[0]];
const rawC = XLSX.utils.sheet_to_json(sheetC, {defval: '', header: 1});

const clientes = [];
let cur = null;

for (const row of rawC) {
  const c0 = (row[0] || '').toString().trim();
  const c1 = (row[1] || '').toString().trim();
  const c6 = (row[6] || '').toString().trim();
  const c7 = (row[7] || '').toString().trim();
  const c8 = (row[8] || '').toString().trim();
  const c10 = (row[10] || '').toString().trim();

  if (c0 === 'Cliente') {
    if (cur && cur.nome_original) clientes.push(cur);
    const match = c1.match(/^(\d+)\s*-\s*(.+)$/);
    cur = {
      codigo: match ? match[1] : '',
      nome: match ? match[2].trim() : c1,
      nome_original: c1,
      fantasia: '', cnpj_cpf: '', tipo_pessoa: '', tipo_cliente: '',
      endereco: '', bairro: '', municipio: '', uf: '', cep: '',
      ie: '', telefone: '', email: '', site: '', contato: '', observacao: ''
    };
    continue;
  }
  if (!cur) continue;

  if (c0 === 'Fantasia') cur.fantasia = c1;
  if (c0 === 'Endereço' && !cur.endereco) cur.endereco = c1;
  if (c0 === 'Complemento' && c1) cur.endereco += ', ' + c1;
  if (c0 === 'Bairro') { cur.bairro = c1; if (c8 === 'CEP') cur.cep = c10; }
  if (c0 === 'Município') { cur.municipio = c1; if (c8 === 'UF') cur.uf = c10; }
  if (c0 === 'Tipo pessoa') { cur.tipo_pessoa = c1; if (c8 === 'CNPJ' || c8 === 'CPF') cur.cnpj_cpf = c10; }
  if (c0 === 'Tipo cliente') cur.tipo_cliente = c1;
  if (c0 === 'Inscrição') { cur.ie = c1; if (c8 === 'Contato') cur.contato = c10; }
  if (c0 === 'Observação') cur.observacao = c1;
  if (c0 === 'Site') cur.site = c1;
  if (c0 === 'e-Mail' || c0 === 'Email') cur.email = c1;
  if ((c0 === 'Comercial' || c0 === 'Celular' || c0 === 'Residencial') && c6 && c7) {
    const tel = `(${c6})${c7}`;
    if (!cur.telefone) cur.telefone = tel;
    else cur.telefone += ', ' + tel;
  }
}
if (cur && cur.nome_original) clientes.push(cur);

console.log('=== CLIENTES EXTRAIDOS:', clientes.length, '===');
clientes.slice(0, 5).forEach((c, i) => {
  console.log(`\nCliente ${i}: ${c.nome}`);
  console.log(`  CNPJ/CPF: ${c.cnpj_cpf}`);
  console.log(`  Tipo: ${c.tipo_pessoa} | ${c.tipo_cliente}`);
  console.log(`  Cidade: ${c.municipio}/${c.uf}`);
  console.log(`  Tel: ${c.telefone}`);
});

// Estatísticas
const comCnpj = clientes.filter(c => c.cnpj_cpf).length;
const semCnpj = clientes.filter(c => !c.cnpj_cpf).length;
console.log(`\nEstatísticas: ${comCnpj} com CNPJ/CPF, ${semCnpj} sem`);

// ====== PARSEAR FORNECEDORES ======
const wbF = XLSX.readFile(base + '\\FORNECEDORES BIASI.xlsx');
const sheetF = wbF.Sheets[wbF.SheetNames[0]];
const rawF = XLSX.utils.sheet_to_json(sheetF, {defval: '', header: 1});

const fornecedores = [];
for (let i = 3; i < rawF.length; i++) {
  const row = rawF[i];
  const nome = (row[0] || '').toString().trim();
  if (!nome) continue;
  const match = nome.match(/^(\d+)\s*-\s*(.+)$/);
  if (!match) continue;

  const cnpj = (row[2] || '').toString().trim();
  const ie = (row[4] || '').toString().trim();
  const endereco = (row[6] || '').toString().trim();
  const municipio_uf = (row[7] || '').toString().trim();
  const cep = (row[8] || '').toString().trim();
  const telefone = (row[10] || '').toString().trim();
  const tipo = (row[12] || '').toString().trim();
  const avaliacao = (row[14] || '').toString().trim();

  const parts = municipio_uf.split('/');
  fornecedores.push({
    codigo: match[1],
    nome: match[2].trim(),
    cnpj, ie: ie.toString(), endereco,
    municipio: parts[0] || '', uf: parts[1] || '',
    cep, telefone, tipo, avaliacao
  });
}

console.log(`\n=== FORNECEDORES EXTRAIDOS: ${fornecedores.length} ===`);
fornecedores.slice(0, 3).forEach((f, i) => {
  console.log(`\nFornecedor ${i}: ${f.nome}`);
  console.log(`  CNPJ: ${f.cnpj}`);
  console.log(`  Cidade: ${f.municipio}/${f.uf}`);
});

// Salvar JSONs
fs.writeFileSync(base + '\\clientes_parsed.json', JSON.stringify(clientes, null, 2));
fs.writeFileSync(base + '\\fornecedores_parsed.json', JSON.stringify(fornecedores, null, 2));
console.log('\nJSONs salvos com sucesso!');
