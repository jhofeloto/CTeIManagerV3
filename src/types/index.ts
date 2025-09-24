// CODECTI Platform - Type Definitions

export interface Bindings {
  DB: D1Database;
  R2: R2Bucket;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'collaborator' | 'researcher';
  institution?: string;
  created_at: string;
  is_active: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  institution?: string;
  role: 'admin' | 'collaborator' | 'researcher';
}

export interface RegisterRequest {
  name: string;
  email: string;
  institution: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface Project {
  id: number;
  title: string;
  responsible_person: string;
  summary: string;
  status: 'active' | 'completed';
  document_filename?: string;
  document_url?: string;
  document_size?: number;
  document_type?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string; // Joined from users table
}

export interface CreateProjectRequest {
  title: string;
  responsible_person: string;
  summary: string;
  status: 'active' | 'completed';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: number;
}

export interface ProjectsListResponse {
  success: boolean;
  projects: Project[];
  total: number;
}

export interface ProjectResponse {
  success: boolean;
  project?: Project;
  message?: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface Session {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  size?: number;
  type?: string;
  message?: string;
}