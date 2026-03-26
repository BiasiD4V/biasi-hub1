const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(
  'https://vzaabtzcilyoknksvhrc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6YWFidHpjaWx5b2tua3N2aHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjQyNDYsImV4cCI6MjA5MDEwMDI0Nn0.L0nCAztRmHFTaJAoT22P_Y5eHUNG9-HStY3it1nSq1U'
);

const CLIENTES_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/CLIENTES BIASI - DETALHADO.xlsx';
const FORNECEDORES_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/FORNECEDORES BIASI.xlsx';
const CONTROLE_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/CONTROLE DE PROPOSTAS-2025.xlsm';

// ============ PARSE CLIENTES ============
function parseClientes() {
  const wb = XLSX.readFile(CLIENTES_PATH, { codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

  const clientes = [];
  let current = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = String(row[0] || '').trim();
    const val = String(row[1] || '').trim();
    const val10 = String(row[10] || '').trim();

    if (label === 'Cliente' && val) {
      if (current) clientes.push(current);
      current = { nome: val.replace(/^\d+\s*-\s*/, '').trim(), fantasia: '', cnpj: '', tipoPessoa: '', tipoCliente: '', municipio: '', uf: '', telefone: '', email: '' };
    }
    if (!current) continue;

    if (label === 'Fantasia') current.fantasia = val;
    if (label === 'Tipo pessoa') { current.tipoPessoa = val; if (val10.match(/\d{2}\.\d{3}\.\d{3}/)) current.cnpj = val10; }
    if (label === 'Tipo cliente') current.tipoCliente = val;
    if (label === 'Município') { current.municipio = val; if (val10) current.uf = val10; }
    if (label.includes('Telefone') && (val || val10)) current.telefone = val10 || val;
    if (label.includes('mail') && val) current.email = val;
  }
  if (current) clientes.push(current);
  return clientes;
}

// ============ PARSE FORNECEDORES ============
function parseFornecedores() {
  const wb = XLSX.readFile(FORNECEDORES_PATH, { codepage: 65001 });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });

  const fornecedores = [];
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    const credor = String(row[0] || '').trim();
    if (!credor) continue;

    const nome = credor.replace(/^\d+\s*-\s*/, '').trim();
    const cnpj = String(row[2] || '').trim();
    const ie = String(row[4] || '').trim();
    const endereco = String(row[6] || '').trim();
    const municipioFull = String(row[7] || '').trim();
    const cep = String(row[8] || '').trim();
    const telefone = String(row[10] || '').trim();
    const tipo = String(row[12] || '').trim();
    const classifTrib = String(row[13] || '').trim();
    const avaliacao = String(row[14] || '').trim();

    let municipio = municipioFull, uf = '';
    const match = municipioFull.match(/(.+)\/(\w{2})$/);
    if (match) { municipio = match[1].trim(); uf = match[2]; }

    fornecedores.push({ nome, cnpj, ie, endereco, municipio, uf, cep, telefone, tipo, classifTrib, avaliacao });
  }
  return fornecedores;
}

// ============ PARSE CONTROLE ============
function parseControle() {
  const wb = XLSX.readFile(CONTROLE_PATH, { codepage: 65001 });
  const ws = wb.Sheets['CONTROLE'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  return data.slice(5).filter(r => r[5] && String(r[5]).trim() !== '').map(r => ({
    numero: String(r[3] || '').trim(),
    dataEntrada: r[4] ? String(r[4]).trim() : null,
    cliente: String(r[5] || '').trim(),
    obra: String(r[6] || '').trim(),
    objeto: String(r[7] || '').trim(),
    disciplina: String(r[8] || '').trim(),
    responsavel: String(r[9] || '').trim(),
    valorOrcado: parseFloat(String(r[10] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || null,
    valorMat: parseFloat(String(r[11] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || null,
    valorMO: parseFloat(String(r[12] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || null,
    status: String(r[13] || '').trim(),
  }));
}

function parseData(dataStr) {
  if (!dataStr) return null;
  const num = Number(dataStr);
  if (!isNaN(num) && num > 40000 && num < 50000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    if (parts.length === 3) { const [a, b, c] = parts; if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`; }
  }
  return null;
}

function mapStatus(s) {
  const map = { 'RECEBIDO': 'recebido', 'ORCAMENTO': 'em_andamento', 'ENVIADO': 'enviado', 'CLIENTE NAO DEU RETORNO': 'negociacao', 'EM REVISAO': 'em_revisao', 'NEGOCIACAO FUTURA': 'negociacao_futura', 'NEGOCIACAO': 'negociacao', 'FECHADO': 'fechado', 'DECLINADO': 'cancelado', 'CANCELADO': 'cancelado', 'NAO FECHADO': 'cancelado' };
  return map[s?.toUpperCase()] || 'recebido';
}

function mapDisciplina(d) {
  const map = { 'LOTEAMENTO': 'loteamento', 'INDUSTRIAL': 'industrial', 'PREDIAL': 'predial', 'PROJETO': 'projeto', 'LICITACAO': 'licitacao', 'LICITAÇÃO': 'licitacao' };
  return map[d?.toUpperCase()] || 'outro';
}

async function main() {
  console.log('=== IMPORTACAO COMPLETA BIASI HUB ===\n');

  // 1. Parse
  console.log('1. Lendo planilhas...');
  const clientes = parseClientes();
  console.log(`   Clientes: ${clientes.length}`);
  const fornecedores = parseFornecedores();
  console.log(`   Fornecedores: ${fornecedores.length}`);
  const propostas = parseControle();
  console.log(`   Propostas: ${propostas.length}`);

  // 2. Limpar dados existentes
  console.log('\n2. Limpando dados existentes...');
  let { error: e1 } = await supabase.from('orcamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) console.error('   Erro limpar orcamentos:', e1.message); else console.log('   Orcamentos limpos');
  let { error: e2 } = await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) console.error('   Erro limpar clientes:', e2.message); else console.log('   Clientes limpos');
  let { error: e3 } = await supabase.from('fornecedores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e3) console.error('   Erro limpar fornecedores:', e3.message); else console.log('   Fornecedores limpos');

  // 3. Importar clientes
  console.log('\n3. Importando clientes...');
  const clienteIds = new Map();

  for (let i = 0; i < clientes.length; i += 20) {
    const lote = clientes.slice(i, i + 20).map(cli => ({
      nome: cli.nome,
      nome_fantasia: cli.fantasia || null,
      cnpj: cli.cnpj || null,
      tipo_pessoa: cli.tipoPessoa === 'Física' ? 'PF' : 'PJ',
      tipo_cliente: cli.tipoCliente || 'PRIVADO',
      tipo: cli.tipoCliente === 'PÚBLICO' ? 'prefeitura' : 'outro',
      cidade: cli.municipio || null,
      estado: cli.uf || null,
      contato_telefone: cli.telefone || null,
      contato_email: cli.email || null,
      ativo: true,
    }));

    const { data, error } = await supabase.from('clientes').insert(lote).select('id, nome');
    if (error) {
      console.error(`   Erro lote ${i}: ${error.message}`);
      // Try one by one
      for (const cli of lote) {
        const { data: d, error: e } = await supabase.from('clientes').insert(cli).select('id, nome');
        if (e) console.error(`     Falha: ${cli.nome}: ${e.message}`);
        else if (d) d.forEach(c => clienteIds.set(c.nome.toUpperCase(), c.id));
      }
    } else if (data) {
      data.forEach(c => clienteIds.set(c.nome.toUpperCase(), c.id));
      console.log(`   Lote ${i + 1}-${i + lote.length}: OK`);
    }
  }
  console.log(`   Total clientes: ${clienteIds.size}`);

  // 4. Importar fornecedores
  console.log('\n4. Importando fornecedores...');
  let fornCount = 0;

  for (let i = 0; i < fornecedores.length; i += 50) {
    const lote = fornecedores.slice(i, i + 50).map(f => ({
      nome: f.nome,
      cnpj: f.cnpj || null,
      inscricao_estadual: f.ie || null,
      endereco: f.endereco || null,
      municipio: f.municipio || null,
      uf: f.uf || null,
      cep: f.cep || null,
      telefone: f.telefone || null,
      tipo: f.tipo || null,
      classificacao_tributaria: f.classifTrib || null,
      avaliacao: f.avaliacao || null,
      ativo: true,
    }));

    const { data, error } = await supabase.from('fornecedores').insert(lote).select('id');
    if (error) {
      console.error(`   Erro lote ${i}: ${error.message}`);
    } else {
      fornCount += data.length;
      if (i % 500 === 0) console.log(`   ${fornCount}/${fornecedores.length}...`);
    }
  }
  console.log(`   Total fornecedores: ${fornCount}`);

  // 5. Importar orcamentos
  console.log('\n5. Importando orcamentos...');
  let orcCount = 0;

  for (let i = 0; i < propostas.length; i += 20) {
    const lote = propostas.slice(i, i + 20).map(p => {
      let clienteId = null;
      const nomeUpper = p.cliente.toUpperCase();
      for (const [key, id] of clienteIds) {
        if (key === nomeUpper || key.includes(nomeUpper) || nomeUpper.includes(key)) {
          clienteId = id; break;
        }
      }
      return {
        numero: p.numero,
        cliente_id: clienteId,
        nome_obra: p.obra || p.objeto || 'Sem nome',
        objeto: p.objeto || null,
        disciplina: mapDisciplina(p.disciplina),
        responsavel: p.responsavel || null,
        status: mapStatus(p.status),
        valor_orcado: p.valorOrcado,
        valor_material: p.valorMat,
        valor_mao_obra: p.valorMO,
        data_entrada: parseData(p.dataEntrada),
      };
    });

    const { data, error } = await supabase.from('orcamentos').insert(lote).select('id');
    if (error) {
      console.error(`   Erro lote orc ${i}: ${error.message}`);
      for (const orc of lote) {
        const { data: d, error: e } = await supabase.from('orcamentos').insert(orc).select('id');
        if (e) console.error(`     Falha orc ${orc.numero}: ${e.message}`);
        else orcCount++;
      }
    } else {
      orcCount += data.length;
      console.log(`   Lote ${i + 1}-${i + lote.length}: OK`);
    }
  }
  console.log(`   Total orcamentos: ${orcCount}`);

  // 6. Summary
  const { count: cc } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
  const { count: cf } = await supabase.from('fornecedores').select('*', { count: 'exact', head: true });
  const { count: co } = await supabase.from('orcamentos').select('*', { count: 'exact', head: true });

  console.log('\n=== RESUMO FINAL ===');
  console.log(`Clientes:     ${cc}`);
  console.log(`Fornecedores: ${cf}`);
  console.log(`Orcamentos:   ${co}`);
  console.log('\n=== IMPORTACAO CONCLUIDA ===');
}

main().catch(err => { console.error('ERRO FATAL:', err); process.exit(1); });
