// Script para crear hashes de contraseña válidos usando Web Crypto API

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt-ctei-manager');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  console.log('Generando hashes de contraseña...\n');
  
  const users = [
    { email: 'admin@demo.com', password: 'admin123', role: 'ADMIN', name: 'Administrador Demo' },
    { email: 'investigador@demo.com', password: 'investigador123', role: 'INVESTIGATOR', name: 'Dr. Investigador Demo' }
  ];
  
  for (const user of users) {
    const hash = await hashPassword(user.password);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Password: ${user.password}`);
    console.log(`🔐 Hash: ${hash}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`📝 Name: ${user.name}`);
    console.log('');
  }
  
  // Generar comandos SQL
  console.log('=== COMANDOS SQL PARA ACTUALIZAR ===\n');
  
  const adminHash = await hashPassword('admin123');
  const investigadorHash = await hashPassword('investigador123');
  
  console.log(`UPDATE users SET email = 'admin@demo.com', password_hash = '${adminHash}', full_name = 'Administrador Demo', role = 'ADMIN' WHERE id = 1;`);
  console.log(`UPDATE users SET email = 'investigador@demo.com', password_hash = '${investigadorHash}', full_name = 'Dr. Investigador Demo', role = 'INVESTIGATOR' WHERE id = 2;`);
}

main().catch(console.error);