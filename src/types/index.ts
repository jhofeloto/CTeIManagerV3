// Tipos para el sistema CTeI-Manager
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'INVESTIGATOR' | 'COMMUNITY';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  abstract: string;
  keywords?: string;
  introduction?: string;
  methodology?: string;
  owner_id: number;
  is_public: 0 | 1;
  created_at: string;
  updated_at: string;
  owner?: User;
  collaborators?: User[];
  products?: Product[];
}

export interface Product {
  id: number;
  project_id: number;
  product_code: string;
  product_type: 'TOP' | 'A' | 'B' | 'ASC' | 'DPC' | 'FRH_A' | 'FRH_B';
  description: string;
  is_public: 0 | 1;
  created_at: string;
  updated_at: string;
  project?: Project;
}

export interface ProjectCollaborator {
  project_id: number;
  user_id: number;
  added_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'COMMUNITY' | 'INVESTIGATOR';
}

export interface CreateProjectRequest {
  title: string;
  abstract: string;
  keywords?: string;
  introduction?: string;
  methodology?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  abstract?: string;
  keywords?: string;
  introduction?: string;
  methodology?: string;
}

export interface CreateProductRequest {
  product_code: string;
  product_type: 'TOP' | 'A' | 'B' | 'ASC' | 'DPC' | 'FRH_A' | 'FRH_B';
  description: string;
}

export interface UpdateProductRequest {
  product_code?: string;
  product_type?: 'TOP' | 'A' | 'B' | 'ASC' | 'DPC' | 'FRH_A' | 'FRH_B';
  description?: string;
}

export interface Bindings {
  DB: D1Database;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalProducts: number;
  publicProjects: number;
  publicProducts: number;
  projectsByType?: Record<string, number>;
  productsByType?: Record<string, number>;
}