import bcrypt from 'bcrypt';

// Función para crear hash de contraseña
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

// Función principal
async function createUsers() {
    console.log('Creando hashes de contraseñas...');
    
    const users = [
        {
            email: 'admin@ctei.gov.co',
            password: 'admin123',
            full_name: 'Administrador del Sistema',
            role: 'ADMIN'
        },
        {
            email: 'researcher@ctei.gov.co', 
            password: 'researcher123',
            full_name: 'Investigador Principal',
            role: 'INVESTIGATOR'
        },
        {
            email: 'viewer@ctei.gov.co',
            password: 'viewer123', 
            full_name: 'Usuario Visualizador',
            role: 'COMMUNITY'
        }
    ];
    
    console.log('-- Insertar usuarios demo');
    console.log('DELETE FROM users WHERE email IN (\'admin@ctei.gov.co\', \'researcher@ctei.gov.co\', \'viewer@ctei.gov.co\');');
    
    for (const user of users) {
        const hashedPassword = await hashPassword(user.password);
        console.log(`INSERT INTO users (email, password_hash, full_name, role) VALUES ('${user.email}', '${hashedPassword}', '${user.full_name}', '${user.role}');`);
    }
    
    console.log('-- Usuarios creados exitosamente');
}

createUsers().catch(console.error);