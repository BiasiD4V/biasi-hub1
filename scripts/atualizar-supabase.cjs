const { Client } = require('pg');
const fs = require('fs');

const base = 'C:\\Users\\Ryan\\Downloads\\PLATAFORMA - BIASIHUB';

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.vzaabtzcilyoknksvhrc',
  password: 'BiasHub2025@Secure!',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Conectado ao Supabase PostgreSQL!');

  // 1. Adicionar colunas na tabela clientes
  console.log('\n=== Adicionando colunas na tabela clientes ===');
  const novaColunas = [
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fantasia TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tipo_cliente TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS bairro TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ie TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_erp TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefone TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS site TEXT",
    "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS observacao TEXT",
  ];
  for (const sql of novaColunas) {
    await client.query(sql);
  }
  console.log('Colunas adicionadas!');

  // 2. Limpar clientes antigos
  console.log('\n=== Substituindo clientes ===');
  await client.query('DELETE FROM clientes');
  console.log('Clientes antigos removidos');

  // 3. Inserir clientes reais da planilha
  const clientes = JSON.parse(fs.readFileSync(base + '\\clientes_parsed.json', 'utf8'));
  let insertedC = 0;
  for (const c of clientes) {
    await client.query(`
      INSERT INTO clientes (nome, fantasia, cnpj_cpf, tipo_pessoa, tipo_cliente, tipo, cidade, estado, endereco, bairro, cep, ie, telefone, email, site, codigo_erp, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
    `, [
      c.nome, c.fantasia, c.cnpj_cpf, c.tipo_pessoa, c.tipo_cliente,
      (c.tipo_cliente || '').toLowerCase() === 'privado' ? 'privado' : (c.tipo_cliente || '').toLowerCase() === 'publico' ? 'publico' : 'outro',
      c.municipio, c.uf, c.endereco, c.bairro, c.cep, c.ie,
      c.telefone, c.email, c.site, c.codigo
    ]);
    insertedC++;
  }
  console.log(`${insertedC} clientes inseridos!`);

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
    )
  `);
  console.log('Tabela fornecedores criada!');

  // 5. Habilitar RLS e policy para fornecedores
  await client.query("ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY");
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fornecedores' AND policyname = 'fornecedores_anon_read') THEN
        EXECUTE 'CREATE POLICY fornecedores_anon_read ON fornecedores FOR SELECT USING (true)';
      END IF;
    END $$;
  `);
  console.log('RLS configurado!');

  // 6. Inserir fornecedores
  console.log('\n=== Inserindo fornecedores ===');
  const fornecedores = JSON.parse(fs.readFileSync(base + '\\fornecedores_parsed.json', 'utf8'));
  let insertedF = 0;
  for (const f of fornecedores) {
    await client.query(`
      INSERT INTO fornecedores (codigo_erp, nome, cnpj, ie, endereco, municipio, uf, cep, telefone, tipo, avaliacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [f.codigo, f.nome, f.cnpj, f.ie, f.endereco, f.municipio, f.uf, f.cep, f.telefone, f.tipo, f.avaliacao]);
    insertedF++;
    if (insertedF % 200 === 0) console.log(`  ${insertedF} fornecedores inseridos...`);
  }
  console.log(`${insertedF} fornecedores inseridos!`);

  // 7. Verificação final
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  const countC = await client.query('SELECT COUNT(*) FROM clientes');
  console.log('Total clientes:', countC.rows[0].count);
  const sampleC = await client.query('SELECT nome, cnpj_cpf, tipo_cliente, cidade, estado FROM clientes LIMIT 3');
  sampleC.rows.forEach(r => console.log('  ', JSON.stringify(r)));

  const countF = await client.query('SELECT COUNT(*) FROM fornecedores');
  console.log('Total fornecedores:', countF.rows[0].count);
  const sampleF = await client.query('SELECT nome, cnpj, municipio, uf FROM fornecedores LIMIT 3');
  sampleF.rows.forEach(r => console.log('  ', JSON.stringify(r)));

  await client.end();
  console.log('\nConcluído!');
}

main().catch(e => { console.error(e); process.exit(1); });
