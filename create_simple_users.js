// Script para crear usuarios con contraseñas simples para demo
// Para uso local/desarrollo únicamente

const users = [
  {
    id: 1,
    email: 'admin@demo.com',
    password: 'admin123',
    full_name: 'Administrador Demo',
    role: 'ADMIN'
  },
  {
    id: 2,
    email: 'investigador@demo.com', 
    password: 'investigador123',
    full_name: 'Dr. Investigador Demo',
    role: 'INVESTIGATOR'
  }
];

console.log('=== CREDENCIALES DE ACCESO PARA DEMO ===\n');

users.forEach(user => {
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 Password: ${user.password}`);
  console.log(`👤 Rol: ${user.role}`);
  console.log(`📝 Nombre: ${user.full_name}`);
  console.log('');
});

console.log('=== DATOS TÉCNICOS ===');
console.log('Password Hash usado: $2b$10$dummyhashforadminuser123456789');
console.log('Nota: Las contraseñas reales deben ser validadas por el sistema de autenticación');