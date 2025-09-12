// Tipos para el sistema CTeI-Manager
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'INVESTIGATOR' | 'COMMUNITY';
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: number;
  name: string;
  short_name?: string;
  type: 'UNIVERSITY' | 'RESEARCH_CENTER' | 'COMPANY' | 'NGO' | 'GOVERNMENT' | 'OTHER';
  country: string;
  city?: string;
  website?: string;
  logo_url?: string;
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
  // Nuevos campos Fase 1
  status: 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'SUSPENDED';
  start_date?: string;
  end_date?: string;
  institution?: string;
  funding_source?: string;
  budget?: number;
  project_code?: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  collaborators?: ProjectCollaborator[];
  products?: Product[];
}

export interface ProductCategory {
  code: string;
  name: string;
  description: string;
  category_group: 'PUBLICATION' | 'SOFTWARE' | 'PATENT' | 'DATABASE' | 'TRAINING' | 'OTHER';
  impact_weight: number;
  required_fields?: string; // JSON
}

export interface Product {
  id: number;
  project_id: number;
  product_code: string;
  product_type: string; // Ahora usa códigos de product_categories
  description: string;
  is_public: 0 | 1;
  // Nuevos campos Fase 1
  doi?: string;
  url?: string;
  publication_date?: string;
  journal?: string;
  impact_factor?: number;
  citation_count?: number;
  metadata?: string; // JSON
  file_url?: string;
  // Nuevos campos Fase 1.1 - Autoría
  creator_id?: number;
  last_editor_id?: number;
  published_at?: string;
  published_by?: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  category?: ProductCategory;
  creator?: User;
  last_editor?: User;
  publisher?: User;
  authors?: ProductAuthor[];
}

export interface ProductAuthor {
  product_id: number;
  user_id: number;
  user?: User;
  author_role: 'AUTHOR' | 'CO_AUTHOR' | 'EDITOR' | 'REVIEWER';
  author_order: number;
  contribution_type?: string;
  added_at: string;
  added_by?: number;
}

export interface ProjectCollaborator {
  project_id: number;
  user_id: number;
  user?: User;
  // Nuevos campos Fase 1
  collaboration_role: 'CO_INVESTIGATOR' | 'RESEARCH_ASSISTANT' | 'ADVISOR' | 'EXTERNAL_COLLABORATOR';
  can_edit_project: boolean;
  can_add_products: boolean;
  can_manage_team: boolean;
  role_description?: string;
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
  // Nuevos campos Fase 1
  start_date?: string;
  end_date?: string;
  institution?: string;
  funding_source?: string;
  budget?: number;
  project_code?: string;
  status?: 'DRAFT' | 'ACTIVE';
}

export interface UpdateProjectRequest {
  title?: string;
  abstract?: string;
  keywords?: string;
  introduction?: string;
  methodology?: string;
  // Nuevos campos Fase 1
  status?: 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'SUSPENDED';
  start_date?: string;
  end_date?: string;
  institution?: string;
  funding_source?: string;
  budget?: number;
  project_code?: string;
}

export interface CreateProductRequest {
  product_code: string;
  product_type: string; // Código de product_categories
  description: string;
  // Nuevos campos Fase 1
  doi?: string;
  url?: string;
  publication_date?: string;
  journal?: string;
  impact_factor?: number;
  metadata?: string; // JSON
  file_url?: string;
  // Campos de autoría opcionales
  authors?: {
    user_id: number;
    author_role: 'AUTHOR' | 'CO_AUTHOR' | 'EDITOR' | 'REVIEWER';
    author_order: number;
    contribution_type?: string;
  }[];
}

export interface UpdateProductRequest {
  product_code?: string;
  product_type?: string;
  description?: string;
  // Nuevos campos Fase 1
  doi?: string;
  url?: string;
  publication_date?: string;
  journal?: string;
  impact_factor?: number;
  metadata?: string; // JSON
  file_url?: string;
}

export interface AddCollaboratorRequest {
  user_id: number;
  collaboration_role: 'CO_INVESTIGATOR' | 'RESEARCH_ASSISTANT' | 'ADVISOR' | 'EXTERNAL_COLLABORATOR';
  can_edit_project?: boolean;
  can_add_products?: boolean;
  can_manage_team?: boolean;
  role_description?: string;
}

export interface AddProductAuthorRequest {
  user_id: number;
  author_role: 'AUTHOR' | 'CO_AUTHOR' | 'EDITOR' | 'REVIEWER';
  author_order: number;
  contribution_type?: string;
}

export interface Bindings {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
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