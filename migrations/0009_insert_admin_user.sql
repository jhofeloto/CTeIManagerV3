-- Insert initial admin user for production deployment
-- This migration ensures there's always an admin user available

-- Insert admin user with bcrypt hash for password 'admin123'
-- The hash $2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi corresponds to 'admin123'
INSERT OR IGNORE INTO users (
    email, 
    password_hash, 
    full_name, 
    role,
    created_at,
    updated_at
) VALUES (
    'admin@demo.com',
    '$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi',
    'Administrador Demo',
    'ADMIN',
    datetime('now'),
    datetime('now')
);

-- Insert investigator user with bcrypt hash for password 'investigador123'  
-- The hash $2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm corresponds to 'investigador123'
INSERT OR IGNORE INTO users (
    email,
    password_hash, 
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    'investigador@demo.com',
    '$2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm', 
    'Dr. Investigador Demo',
    'INVESTIGATOR',
    datetime('now'),
    datetime('now')
);

-- Verify insertion with a SELECT (for logging purposes)
-- This will show in migration logs if users were created
SELECT 'Users created successfully:' as message;
SELECT id, email, full_name, role, created_at FROM users WHERE email IN ('admin@demo.com', 'investigador@demo.com');