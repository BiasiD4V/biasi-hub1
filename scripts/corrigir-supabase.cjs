const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.vzaabtzcilyoknksvhrc:BiasHub2025%40Secure!@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado ao Supabase Postgres!');

  // 1. Alterar tabela clientes - adicionar campos faltantes
  console.log('\n=== Alterando tabela clientes ===');
  await client.query(`
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bairro TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ie TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_erp TEXT;
  `);
  console.log('Colunas adicionadas!');

  // 2. Limpar tabelas dependentes e depois clientes
  console.log('\n=== Limpando dados antigos (mock) ===');
  // Verificar quais tabelas existem e limpar na ordem certa
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  console.log('Tabelas existentes:', tables.rows.map(r => r.table_name).join(', '));

  // Limpar tabelas que referenciam clientes primeiro
  try { await client.query('DELETE FROM interacoes'); console.log('  interacoes limpas'); } catch(e) { console.log('  interacoes: ' + e.message); }
  try { await client.query('DELETE FROM qualificacoes'); console.log('  qualificacoes limpas'); } catch(e) { console.log('  qualificacoes: ' + e.message); }
  try { await client.query('DELETE FROM orcamentos'); console.log('  orcamentos limpos'); } catch(e) { console.log('  orcamentos: ' + e.message); }

  const del = await client.query('DELETE FROM clientes');
  console.log(`  Deletados ${del.rowCount} clientes antigos`);

  // 3. Inserir clientes corretos com CNPJ
  console.log('\n=== Inserindo clientes corretos ===');
  const clientes = JSON.parse(fs.readFileSync('C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/clientes_parsed.json', 'utf8'));

  let insertedClientes = 0;
  for (const c of clientes) {
    const tipo = mapTipoCliente(c.tipo_cliente);
    await client.query(`
      INSERT INTO clientes (nome, tipo, cnpj_cpf, nome_fantasia, tipo_pessoa, cidade, estado, endereco, bairro, cep, ie, contato_telefone, contato_email, codigo_erp, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
    `, [
      c.nome,
      tipo,
      c.cnpj_cpf || null,
      c.fantasia || null,
      c.tipo_pessoa || null,
      c.municipio || null,
      c.uf || null,
      c.endereco || null,
      c.bairro || null,
      c.cep || null,
      c.ie || null,
      c.telefone || null,
      c.email || null,
      c.codigo || null
    ]);
    insertedClientes++;
  }
  console.log(`Inseridos ${insertedClientes} clientes!`);

  // 4. Criar tabela fornecedores
  console.log('\n=== Criando tabela fornecedores ===');
  await client.query(`
    CREATE TABLE IF NOT EXISTS fornecedores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      codigo_erp TEXT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      ie TEXT,
      endereco TEXT,
      municipio TEXT,
      uf TEXT,
      cep TEXT,
      telefone TEXT,
      tipo TEXT,
      avaliacao TEXT,
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMPTZ DEFAULT now(),
      atualizado_em TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log('Tabela fornecedores criada!');

  // 5. Habilitar RLS na tabela fornecedores
  await client.query(`
    ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Permitir leitura publica fornecedores" ON fornecedores FOR SELECT USING (true);
    CREATE POLICY IF NOT EXISTS "Permitir insercao fornecedores" ON fornecedores FOR INSERT WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "Permitir atualizacao fornecedores" ON fornecedores FOR UPDATE USING (true);
    CREATE POLICY IF NOT EXISTS "Permitir delecao fornecedores" ON fornecedores FOR DELETE USING (true);
  `);
  console.log('RLS configurado!');

  // 6. Inserir fornecedores
  console.log('\n=== Inserindo fornecedores ===');
  const fornecedores = JSON.parse(fs.readFileSync('C:/Users/Ryan/Downloads/PLATAFORMA - BIASIHUB/fornecedores_parsed.json', 'utf8'));

  let insertedForn = 0;
  // Inserir em lotes de 50 para ser mais rápido
  const batchSize = 50;
  for (let i = 0; i < fornecedores.length; i += batchSize) {
    const batch = fornecedores.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const f of batch) {
      values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10})`);
      params.push(
        f.codigo || null,
        f.nome,
        f.cnpj || null,
        f.ie || null,
        f.endereco || null,
        f.municipio || null,
        f.uf || null,
        f.cep || null,
        f.telefone || null,
        f.tipo || null,
        f.avaliacao || null
      );
      paramIdx += 11;
    }

    await client.query(`
      INSERT INTO fornecedores (codigo_erp, nome, cnpj, ie, endereco, municipio, uf, cep, telefone, tipo, avaliacao)
      VALUES ${values.join(', ')}
    `, params);

    insertedForn += batch.length;
    if (insertedForn % 500 === 0 || insertedForn === fornecedores.length) {
      console.log(`  ${insertedForn}/${fornecedores.length} fornecedores inseridos...`);
    }
  }
  console.log(`Inseridos ${insertedForn} fornecedores!`);

  // 7. Verificar resultado
  console.log('\n=== RESULTADO FINAL ===');
  const countCli = await client.query('SELECT COUNT(*) FROM clientes');
  const countForn = await client.query('SELECT COUNT(*) FROM fornecedores');
  console.log(`Clientes: ${countCli.rows[0].count}`);
  console.log(`Fornecedores: ${countForn.rows[0].count}`);

  // Amostra de cliente com CNPJ
  const sample = await client.query('SELECT nome, cnpj_cpf, tipo, cidade, estado FROM clientes LIMIT 3');
  console.log('\nAmostra clientes:');
  sample.rows.forEach(r => console.log(`  ${r.nome} | CNPJ: ${r.cnpj_cpf} | ${r.tipo} | ${r.cidade}-${r.estado}`));

  await client.end();
  console.log('\nConcluído!');
}

function mapTipoCliente(tipo) {
  if (!tipo) return 'outro';
  const t = tipo.toUpperCase().trim();
  if (t === 'PRIVADO') return 'privado';
  if (t === 'PÚBLICO' || t === 'PUBLICO') return 'publico';
  return 'outro';
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
