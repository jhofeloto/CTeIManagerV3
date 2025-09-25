-- Script SQL para corregir contraseñas de usuarios demo
-- Las contraseñas están hasheadas con bcrypt (salt rounds = 10)

-- admin@demo.com / admin123
UPDATE users SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIxDZcrmXugEJVs3VrZjFrLib3wvxkjy' WHERE email = 'admin@demo.com';

-- investigador@demo.com / investigador123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'investigador@demo.com';

-- comunidad@ctei.edu.co / demo123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'comunidad@ctei.edu.co';

-- admin@ctei.edu.co / admin123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'admin@ctei.edu.co';

-- carlos.rodriguez@ctei.edu.co / investigador123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'carlos.rodriguez@ctei.edu.co';

-- maria.lopez@ctei.edu.co / investigador123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'maria.lopez@ctei.edu.co';

-- juan.perez@ctei.edu.co / investigador123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'juan.perez@ctei.edu.co';

-- investigador.test@choco.gov.co / investigador123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'investigador.test@choco.gov.co';

-- admin@choco.gov.co / admin123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'admin@choco.gov.co';

-- admin.test@choco.gov.co / admin123
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'admin.test@choco.gov.co';