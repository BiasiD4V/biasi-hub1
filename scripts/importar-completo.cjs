const { Client } = require('pg');
const XLSX = require('xlsx');

const PG_CONFIG = {
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.vzaabtzcilyoknksvhrc',
  password: 'BiasHub2025@Secure!',
  ssl: { rejectUnauthorized: false }
};

const CLIENTES_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/CLIENTES BIASI - DETALHADO.xlsx';
const FORNECEDORES_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/FORNECEDORES BIASI.xlsx';
const CONTROLE_PATH = 'C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/CONTROLE DE PROPOSTAS-2025.xlsm';

// ============ SCHEMA ============
const SCHEMA_SQL = `
-- Adicionar colunas faltantes em clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cliente TEXT;

-- Criar tabela fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  inscricao_estadual TEXT,
  endereco TEXT,
  municipio TEXT,
  uf TEXT,
  cep TEXT,
  telefone TEXT,
  tipo TEXT,
  classificacao_tributaria TEXT,
  avaliacao TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para fornecedores
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura fornecedores" ON fornecedores;
CREATE POLICY "Permitir leitura fornecedores" ON fornecedores FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir insercao fornecedores" ON fornecedores;
CREATE POLICY "Permitir insercao fornecedores" ON fornecedores FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir update fornecedores" ON fornecedores;
CREATE POLICY "Permitir update fornecedores" ON fornecedores FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Permitir delete fornecedores" ON fornecedores;
CREATE POLICY "Permitir delete fornecedores" ON fornecedores FOR DELETE USING (true);
`;

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
    const val8 = String(row[8] || '').trim();
    const val10 = String(row[10] || '').trim();

    if (label === 'Cliente' && val) {
      if (current) clientes.push(current);
      current = {
        nome: val.replace(/^\d+\s*-\s*/, '').trim(),
        fantasia: '',
        cnpj: '',
        tipoPessoa: '',
        tipoCliente: '',
        municipio: '',
        uf: '',
        telefone: '',
        email: ''
      };
    }
    if (!current) continue;

    if (label === 'Fantasia') current.fantasia = val;
    if (label === 'Tipo pessoa') {
      current.tipoPessoa = val;
      if (val8.toLowerCase().includes('cnpj') || val10.match(/\d{2}\.\d{3}\.\d{3}/)) {
        current.cnpj = val10;
      }
    }
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
  // Header at row 4 (0-indexed), data starts at row 5
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

    // Separar municipio/uf
    let municipio = municipioFull;
    let uf = '';
    const match = municipioFull.match(/(.+)\/(\w{2})$/);
    if (match) {
      municipio = match[1].trim();
      uf = match[2];
    }

    fornecedores.push({ nome, cnpj, ie, endereco, municipio, uf, cep, telefone, tipo, classifTrib, avaliacao });
  }

  return fornecedores;
}

// ============ PARSE CONTROLE (orcamentos) ============
function parseControle() {
  const wb = XLSX.readFile(CONTROLE_PATH, { codepage: 65001 });
  const ws = wb.Sheets['CONTROLE'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
  const rows = data.slice(5).filter(r => r[5] && String(r[5]).trim() !== '');

  return rows.map(r => ({
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
    if (parts.length === 3) {
      const [a, b, c] = parts;
      if (c.length === 4) return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
  }
  return null;
}

function mapStatus(s) {
  const map = {
    'RECEBIDO': 'recebido', 'ORCAMENTO': 'em_andamento', 'ENVIADO': 'enviado',
    'CLIENTE NAO DEU RETORNO': 'negociacao', 'EM REVISAO': 'em_revisao',
    'NEGOCIACAO FUTURA': 'negociacao_futura', 'NEGOCIACAO': 'negociacao',
    'FECHADO': 'fechado', 'DECLINADO': 'cancelado', 'CANCELADO': 'cancelado', 'NAO FECHADO': 'cancelado',
  };
  return map[s?.toUpperCase()] || 'recebido';
}

function mapDisciplina(d) {
  const map = {
    'LOTEAMENTO': 'loteamento', 'INDUSTRIAL': 'industrial', 'PREDIAL': 'predial',
    'PROJETO': 'projeto', 'LICITACAO': 'licitacao', 'LICITAÇÃO': 'licitacao',
  };
  return map[d?.toUpperCase()] || 'outro';
}

// ============ MAIN ============
async function main() {
  console.log('=== IMPORTACAO COMPLETA BIASI HUB ===\n');

  // 1. Parse Excel files
  console.log('1. Lendo planilhas...');
  const clientes = parseClientes();
  console.log(`   Clientes: ${clientes.length}`);
  const fornecedores = parseFornecedores();
  console.log(`   Fornecedores: ${fornecedores.length}`);
  const propostas = parseControle();
  console.log(`   Propostas/Orcamentos: ${propostas.length}`);

  // 2. Connect to PostgreSQL
  console.log('\n2. Conectando ao PostgreSQL...');
  const pg = new Client(PG_CONFIG);
  await pg.connect();
  console.log('   Conectado!');

  // 3. Schema updates
  console.log('\n3. Atualizando schema...');
  await pg.query(SCHEMA_SQL);
  console.log('   Schema atualizado!');

  // 4. Limpar dados existentes
  console.log('\n4. Limpando dados existentes...');
  await pg.query('DELETE FROM orcamentos');
  await pg.query('DELETE FROM clientes');
  await pg.query('DELETE FROM fornecedores');
  console.log('   Dados limpos!');

  // 5. Importar clientes
  console.log('\n5. Importando clientes...');
  const clienteIds = new Map(); // nome_upper -> id

  for (const cli of clientes) {
    const tipoPessoa = cli.tipoPessoa === 'Física' ? 'PF' : 'PJ';
    const tipoCliente = cli.tipoCliente || 'PRIVADO';

    const { rows } = await pg.query(
      `INSERT INTO clientes (nome, nome_fantasia, cnpj, tipo_pessoa, tipo_cliente, tipo, cidade, estado, contato_telefone, contato_email, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       RETURNING id`,
      [cli.nome, cli.fantasia || null, cli.cnpj || null, tipoPessoa, tipoCliente,
       tipoCliente === 'PÚBLICO' ? 'prefeitura' : 'outro',
       cli.municipio || null, cli.uf || null, cli.telefone || null, cli.email || null]
    );
    clienteIds.set(cli.nome.toUpperCase(), rows[0].id);
  }
  console.log(`   ${clienteIds.size} clientes importados!`);

  // 6. Importar fornecedores
  console.log('\n6. Importando fornecedores...');
  let fornCount = 0;
  const batchSize = 50;

  for (let i = 0; i < fornecedores.length; i += batchSize) {
    const batch = fornecedores.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const f of batch) {
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8}, $${paramIdx + 9}, $${paramIdx + 10})`);
      params.push(f.nome, f.cnpj || null, f.ie || null, f.endereco || null, f.municipio || null, f.uf || null, f.cep || null, f.telefone || null, f.tipo || null, f.classifTrib || null, f.avaliacao || null);
      paramIdx += 11;
    }

    await pg.query(
      `INSERT INTO fornecedores (nome, cnpj, inscricao_estadual, endereco, municipio, uf, cep, telefone, tipo, classificacao_tributaria, avaliacao)
       VALUES ${values.join(', ')}`,
      params
    );
    fornCount += batch.length;
    if (i % 500 === 0) console.log(`   ${fornCount}/${fornecedores.length}...`);
  }
  console.log(`   ${fornCount} fornecedores importados!`);

  // 7. Importar orcamentos
  console.log('\n7. Importando orcamentos...');
  let orcCount = 0;

  for (const p of propostas) {
    // Match cliente by name
    let clienteId = null;
    const nomeUpper = p.cliente.toUpperCase();
    for (const [key, id] of clienteIds) {
      if (key === nomeUpper || key.includes(nomeUpper) || nomeUpper.includes(key)) {
        clienteId = id;
        break;
      }
    }

    try {
      await pg.query(
        `INSERT INTO orcamentos (numero, cliente_id, nome_obra, objeto, disciplina, responsavel, status, valor_orcado, valor_material, valor_mao_obra, data_entrada)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [p.numero, clienteId, p.obra || p.objeto || 'Sem nome', p.objeto || null,
         mapDisciplina(p.disciplina), p.responsavel || null, mapStatus(p.status),
         p.valorOrcado, p.valorMat, p.valorMO, parseData(p.dataEntrada)]
      );
      orcCount++;
    } catch (err) {
      console.error(`   Erro orc ${p.numero}: ${err.message}`);
    }
  }
  console.log(`   ${orcCount} orcamentos importados!`);

  // 8. Summary
  const { rows: countCli } = await pg.query('SELECT COUNT(*) FROM clientes');
  const { rows: countForn } = await pg.query('SELECT COUNT(*) FROM fornecedores');
  const { rows: countOrc } = await pg.query('SELECT COUNT(*) FROM orcamentos');

  console.log('\n=== RESUMO FINAL ===');
  console.log(`Clientes:     ${countCli[0].count}`);
  console.log(`Fornecedores: ${countForn[0].count}`);
  console.log(`Orcamentos:   ${countOrc[0].count}`);
  console.log('\n=== IMPORTACAO CONCLUIDA ===');

  await pg.end();
}

main().catch(err => { console.error('ERRO FATAL:', err); process.exit(1); });
