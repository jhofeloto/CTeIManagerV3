// CODECTI Platform - Database Mock Setup for Integration Tests

interface MockUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'collaborator';
  is_active: number;
  created_at: string;
}

interface MockProject {
  id: number;
  title: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface MockFile {
  id: number;
  project_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

export class MockDatabase {
  private users: MockUser[] = [
    {
      id: 1,
      email: 'admin@codecti.choco.gov.co',
      // password123 hashed
      password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      name: 'Administrador Sistema',
      role: 'admin',
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'investigador1@codecti.choco.gov.co',
      // password123 hashed
      password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      name: 'Investigador Colaborador',
      role: 'collaborator',
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ];

  private projects: MockProject[] = [
    {
      id: 1,
      title: 'Proyecto de Investigación Test',
      description: 'Descripción del proyecto de prueba',
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private files: MockFile[] = [
    {
      id: 1,
      project_id: 1,
      filename: 'project_1_123456.pdf',
      original_name: 'documento_prueba.pdf',
      file_size: 1024,
      content_type: 'application/pdf',
      uploaded_at: new Date().toISOString()
    }
  ];

  // Mock D1 Database methods
  prepare(query: string) {
    const self = this;
    
    return {
      bind: (...params: any[]) => {
        return {
          first: async (): Promise<any> => {
            // Mock query execution based on common patterns
            if (query.includes('FROM users WHERE email = ?') || query.includes('FROM users WHERE email = ? AND is_active = 1')) {
              const email = params[0];
              const user = self.users.find(u => u.email === email && u.is_active === 1);
              return user || null;
            }
            
            if (query.includes('SELECT id, email, name, role FROM users WHERE id = ?')) {
              const id = params[0];
              const user = self.users.find(u => u.id === id);
              if (user) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role
                };
              }
              return null;
            }

            if (query.includes('SELECT * FROM projects')) {
              return self.projects[0] || null;
            }

            return null;
          },
          all: async (): Promise<{ results: any[] }> => {
            if (query.includes('SELECT * FROM projects')) {
              return { results: self.projects };
            }
            
            if (query.includes('SELECT * FROM files')) {
              return { results: self.files };
            }

            return { results: [] };
          },
          run: async (): Promise<{ success: boolean; meta: { last_row_id?: number } }> => {
            // Mock successful operations
            return {
              success: true,
              meta: {
                last_row_id: Math.floor(Math.random() * 1000) + 1
              }
            };
          }
        };
      },
      first: async (): Promise<any> => {
        if (query.includes('SELECT * FROM users')) {
          return self.users[0] || null;
        }
        return null;
      },
      all: async (): Promise<{ results: any[] }> => {
        if (query.includes('SELECT * FROM projects')) {
          return { results: self.projects };
        }
        return { results: [] };
      },
      run: async (): Promise<{ success: boolean; meta: { last_row_id?: number } }> => {
        return {
          success: true,
          meta: {
            last_row_id: Math.floor(Math.random() * 1000) + 1
          }
        };
      }
    };
  }
}

// Mock Cloudflare environment
export function createMockEnv() {
  const mockDB = new MockDatabase();
  
  return {
    DB: mockDB,
    KV: {
      get: async (key: string) => null,
      put: async (key: string, value: string) => {},
      delete: async (key: string) => {}
    },
    R2: {
      get: async (key: string) => null,
      put: async (key: string, value: any) => {},
      delete: async (key: string) => {}
    }
  };
}

// Mock context factory for Hono
export function createMockContext() {
  const env = createMockEnv();
  
  return {
    env,
    get: (key: string) => {
      if (key === 'user') return null;
      if (key === 'requestId') return 'test-request-id';
      return null;
    },
    set: (key: string, value: any) => {},
    executionCtx: {
      waitUntil: (promise: Promise<any>) => {},
      passThroughOnException: () => {}
    }
  };
}