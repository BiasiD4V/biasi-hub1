const SUPABASE_URL = 'https://vzaabtzcilyoknksvhrc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6YWFidHpjaWx5b2tua3N2aHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjQyNDYsImV4cCI6MjA5MDEwMDI0Nn0.L0nCAztRmHFTaJAoT22P_Y5eHUNG9-HStY3it1nSq1U';

async function query(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    }
  });
  return await res.json();
}

async function main() {
  // Ver todos os clientes atuais
  const clientes = await query('clientes?select=*&limit=5');
  console.log('=== CLIENTES ATUAIS ===');
  console.log('Colunas:', Object.keys(clientes[0] || {}));
  clientes.forEach((c, i) => console.log(`${i}:`, JSON.stringify(c)));

  // Contar total
  const total = await query('clientes?select=id&limit=1000');
  console.log('\nTotal clientes:', Array.isArray(total) ? total.length : 'erro');

  // Ver orcamentos
  const orcs = await query('orcamentos?select=*&limit=3');
  console.log('\n=== ORCAMENTOS ===');
  console.log('Colunas:', Object.keys(orcs[0] || {}));
  console.log('Total:', Array.isArray(orcs) ? orcs.length : 'erro');
}

main().catch(e => console.error(e));
