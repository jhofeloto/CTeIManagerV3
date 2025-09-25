// Script para corregir contraseñas de usuarios demo
import bcrypt from 'bcryptjs';

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function fixPasswords() {
  console.log('Corrigiendo contraseñas de usuarios demo...');

  // Usuarios y sus contraseñas en texto plano
  const users = [
    { email: 'admin@demo.com', password: 'admin123' },
    { email: 'investigador@demo.com', password: 'investigador123' },
    { email: 'comunidad@ctei.edu.co', password: 'demo123' },
    { email: 'admin@ctei.edu.co', password: 'admin123' },
    { email: 'carlos.rodriguez@ctei.edu.co', password: 'investigador123' },
    { email: 'maria.lopez@ctei.edu.co', password: 'investigador123' },
    { email: 'juan.perez@ctei.edu.co', password: 'investigador123' },
    { email: 'investigador.test@choco.gov.co', password: 'investigador123' },
    { email: 'admin@choco.gov.co', password: 'admin123' },
    { email: 'admin.test@choco.gov.co', password: 'admin123' }
  ];

  for (const user of users) {
    try {
      const hashedPassword = await hashPassword(user.password);
      console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE email = '${user.email}';`);
    } catch (error) {
      console.error(`Error hashing password for ${user.email}:`, error);
    }
  }
}

fixPasswords().catch(console.error);