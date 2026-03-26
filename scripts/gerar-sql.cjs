const fs = require('fs');
const base = 'C:\\Users\\Ryan\\Downloads\\PLATAFORMA - BIASIHUB';

function esc(s) {
  if (!s) return 'NULL';
  return "'" + s.replace(/'/g, "''") + "'";
}

// CLIENTES
const clientes = JSON.parse(fs.readFileSync(base + '\\clientes_parsed.json', 'utf8'));
let sql = '-- INSERIR 145 CLIENTES REAIS DA BIASI\n';

for (const c of clientes) {
  const tipo = (c.tipo_cliente || '').toLowerCase().includes('privado') ? 'privado'
    : (c.tipo_cliente || '').toLowerCase().includes('publico') ? 'publico' : 'outro';
  sql += `INSERT INTO clientes (nome, fantasia, cnpj_cpf, tipo_pessoa, tipo_cliente, tipo, cidade, estado, endereco, bairro, cep, ie, telefone, email, site, codigo_erp, ativo) VALUES (${esc(c.nome)}, ${esc(c.fantasia)}, ${esc(c.cnpj_cpf)}, ${esc(c.tipo_pessoa)}, ${esc(c.tipo_cliente)}, ${esc(tipo)}, ${esc(c.municipio)}, ${esc(c.uf)}, ${esc(c.endereco)}, ${esc(c.bairro)}, ${esc(c.cep)}, ${esc(c.ie)}, ${esc(c.telefone)}, ${esc(c.email)}, ${esc(c.site)}, ${esc(c.codigo)}, true);\n`;
}

fs.writeFileSync('C:\\Users\\Ryan\\Downloads\\Claude\\orcamentos\\scripts\\sql\\02-clientes.sql', sql);
console.log(`Gerado 02-clientes.sql com ${clientes.length} INSERTs`);

// FORNECEDORES
const fornecedores = JSON.parse(fs.readFileSync(base + '\\fornecedores_parsed.json', 'utf8'));
let sqlF = '-- INSERIR 1621 FORNECEDORES DA BIASI\n';

for (const f of fornecedores) {
  sqlF += `INSERT INTO fornecedores (codigo_erp, nome, cnpj, ie, endereco, municipio, uf, cep, telefone, tipo, avaliacao) VALUES (${esc(f.codigo)}, ${esc(f.nome)}, ${esc(f.cnpj)}, ${esc(f.ie)}, ${esc(f.endereco)}, ${esc(f.municipio)}, ${esc(f.uf)}, ${esc(f.cep)}, ${esc(f.telefone)}, ${esc(f.tipo)}, ${esc(f.avaliacao)});\n`;
}

fs.writeFileSync('C:\\Users\\Ryan\\Downloads\\Claude\\orcamentos\\scripts\\sql\\03-fornecedores.sql', sqlF);
console.log(`Gerado 03-fornecedores.sql com ${fornecedores.length} INSERTs`);

// ARQUIVO COMPLETO (tudo junto)
const schema = fs.readFileSync('C:\\Users\\Ryan\\Downloads\\Claude\\orcamentos\\scripts\\sql\\01-schema.sql', 'utf8');
const fullSql = schema + '\n\n' + sql + '\n\n' + sqlF;
fs.writeFileSync('C:\\Users\\Ryan\\Downloads\\Claude\\orcamentos\\scripts\\sql\\EXECUTAR-TUDO.sql', fullSql);
console.log(`\nGerado EXECUTAR-TUDO.sql (arquivo completo)`);
console.log(`Tamanho: ${(fullSql.length / 1024).toFixed(0)} KB`);
