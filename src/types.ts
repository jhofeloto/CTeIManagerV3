// CODECTI Platform - Type Definitions

// Cloudflare Bindings
export interface Bindings {
  DB?: D1Database;
  KV?: KVNamespace;
  R2?: R2Bucket;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'collaborator' | 'researcher';
  iat: number;
  exp: number;
}

// User Types
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
  name: string;
  email: string;
  institution: string;
  password: string;
  role: 'admin' | 'collaborator' | 'researcher';
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  institution: string;
  role: 'admin' | 'collaborator' | 'researcher';
  is_active: boolean;
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
  total: number;
  message?: string;
}

export interface UserResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// Authentication Types
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

// Project Types
export interface Project {
  id: number;
  title: string;
  responsible_person: string;
  summary: string;
  description?: string;
  status: 'active' | 'completed';
  area?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  institution?: string;
  document_filename?: string;
  document_url?: string;
  document_size?: number;
  document_type?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_institution?: string;
}

export interface CreateProjectRequest {
  title: string;
  responsible_person: string;
  summary: string;
  status: 'active' | 'completed';
}

export interface UpdateProjectRequest {
  title: string;
  responsible_person: string;
  summary: string;
  status: 'active' | 'completed';
}

export interface ProjectsListResponse {
  success: boolean;
  projects: Project[];
  total: number;
  message?: string;
}

export interface ProjectResponse {
  success: boolean;
  project?: Project;
  message?: string;
}

export interface UploadResponse {
  success: boolean;
  filename?: string;
  url?: string;
  size?: number;
  type?: string;
  message?: string;
}

// Monitoring Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    memory: CheckResult;
    connectivity: CheckResult;
  };
}

export interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration: number;
  details?: any;
}

export interface LogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  metadata?: any;
}

export interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  context?: any;
}

export interface SystemMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    averageResponseTime: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
  };
}

export interface MonitoringResponse {
  success: boolean;
  data?: any;
  message?: string;
}

// Public Portal Types - HU-08: Portal Público de Proyectos
export interface PublicProject {
  id: number;
  title: string;
  summary: string;
  description?: string;
  status: 'active' | 'completed';
  area?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  institution?: string;
  responsible_person: string;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator_institution?: string;
  has_documents?: boolean;
  // Note: document_url is intentionally excluded for security
}

export interface PublicProjectsResponse {
  success: boolean;
  projects: PublicProject[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  message?: string;
}

export interface PublicProjectResponse {
  success: boolean;
  project?: PublicProject;
  message?: string;
}

export interface PublicStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_budget: number;
  by_area: Record<string, number>;
  by_institution: Record<string, number>;
  recent_projects: {
    id: number;
    title: string;
    institution?: string;
    created_at: string;
  }[];
}

export interface PublicStatsResponse {
  success: boolean;
  stats: PublicStats;
  message?: string;
}

// HU-09: Sistema de Noticias/Blog - Type Definitions
export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface NewsTag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image?: string;
  author_id: number;
  author_name?: string;
  author_email?: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  tags: NewsTag[];
  views_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsArticleRequest {
  title: string;
  summary: string;
  content: string;
  featured_image?: string;
  category_id: number;
  tag_ids: number[];
  status: 'draft' | 'published';
  is_featured: boolean;
  published_at?: string;
}

export interface UpdateNewsArticleRequest {
  title: string;
  summary: string;
  content: string;
  featured_image?: string;
  category_id: number;
  tag_ids: number[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  published_at?: string;
}

export interface NewsListResponse {
  success: boolean;
  articles: NewsArticle[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  message?: string;
}

export interface NewsArticleResponse {
  success: boolean;
  article?: NewsArticle;
  message?: string;
}

export interface NewsPublicResponse {
  success: boolean;
  articles: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    featured_image?: string;
    author_name: string;
    category_name: string;
    category_slug: string;
    views_count: number;
    published_at: string;
    tags: string[];
  }[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  message?: string;
}

export interface PublicNewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image?: string;
  author_name: string;
  category_name: string;
  category_slug: string;
  tags: string[];
  views_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface PublicNewsArticleResponse {
  success: boolean;
  article?: PublicNewsArticle;
  message?: string;
}

// HU-10: Sistema de Eventos y Convocatorias - Type Definitions
export interface EventCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  type: 'conference' | 'workshop' | 'seminar' | 'convocatoria' | 'curso' | 'feria';
  category_id: number;
  category_name?: string;
  category_slug?: string;
  organizer_id: number;
  organizer_name?: string;
  organizer_email?: string;
  organizer_institution?: string;
  
  // Event details
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  location: string;
  venue?: string;
  address?: string;
  virtual_link?: string;
  is_virtual: boolean;
  is_hybrid: boolean;
  
  // Capacity and registration
  max_participants?: number;
  current_participants: number;
  registration_required: boolean;
  registration_fee?: number;
  is_free: boolean;
  
  // Content and media
  featured_image?: string;
  agenda?: string;
  requirements?: string;
  target_audience?: string;
  learning_objectives?: string;
  
  // Status and visibility
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_featured: boolean;
  is_public: boolean;
  
  // SEO and engagement
  tags: string[];
  views_count: number;
  registrations_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id?: number;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_institution?: string;
  participant_position?: string;
  
  // Registration details
  registration_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  confirmation_code: string;
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_reference?: string;
  
  // Additional info
  dietary_requirements?: string;
  accessibility_needs?: string;
  comments?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  short_description: string;
  type: 'conference' | 'workshop' | 'seminar' | 'convocatoria' | 'curso' | 'feria';
  category_id: number;
  
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  location: string;
  venue?: string;
  address?: string;
  virtual_link?: string;
  is_virtual: boolean;
  is_hybrid: boolean;
  
  max_participants?: number;
  registration_required: boolean;
  registration_fee?: number;
  is_free: boolean;
  
  featured_image?: string;
  agenda?: string;
  requirements?: string;
  target_audience?: string;
  learning_objectives?: string;
  
  status: 'draft' | 'published';
  is_featured: boolean;
  is_public: boolean;
  tags: string[];
}

export interface UpdateEventRequest {
  title: string;
  description: string;
  short_description: string;
  type: 'conference' | 'workshop' | 'seminar' | 'convocatoria' | 'curso' | 'feria';
  category_id: number;
  
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  location: string;
  venue?: string;
  address?: string;
  virtual_link?: string;
  is_virtual: boolean;
  is_hybrid: boolean;
  
  max_participants?: number;
  registration_required: boolean;
  registration_fee?: number;
  is_free: boolean;
  
  featured_image?: string;
  agenda?: string;
  requirements?: string;
  target_audience?: string;
  learning_objectives?: string;
  
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_featured: boolean;
  is_public: boolean;
  tags: string[];
}

export interface EventRegistrationRequest {
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  participant_institution?: string;
  participant_position?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  comments?: string;
}

export interface EventsListResponse {
  success: boolean;
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  message?: string;
}

export interface EventResponse {
  success: boolean;
  event?: Event;
  message?: string;
}

export interface EventRegistrationResponse {
  success: boolean;
  registration?: EventRegistration;
  message?: string;
}

export interface PublicEventsResponse {
  success: boolean;
  events: {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    type: string;
    category_name: string;
    category_slug: string;
    organizer_name: string;
    start_date: string;
    end_date: string;
    location: string;
    is_virtual: boolean;
    is_hybrid: boolean;
    is_free: boolean;
    registration_fee?: number;
    current_participants: number;
    max_participants?: number;
    registration_required: boolean;
    featured_image?: string;
    tags: string[];
    views_count: number;
  }[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  message?: string;
}

export interface PublicEventResponse {
  success: boolean;
  event?: {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description: string;
    type: string;
    category_name: string;
    organizer_name: string;
    organizer_institution: string;
    start_date: string;
    end_date: string;
    registration_start?: string;
    registration_end?: string;
    location: string;
    venue?: string;
    address?: string;
    virtual_link?: string;
    is_virtual: boolean;
    is_hybrid: boolean;
    max_participants?: number;
    current_participants: number;
    registration_required: boolean;
    registration_fee?: number;
    is_free: boolean;
    featured_image?: string;
    agenda?: string;
    requirements?: string;
    target_audience?: string;
    learning_objectives?: string;
    tags: string[];
    views_count: number;
    registrations_count: number;
    can_register: boolean;
    registration_status: 'not_started' | 'open' | 'closed' | 'full';
  };
  message?: string;
}

// HU-11: Resources and Scientific Documents System Types

export interface ResourceCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Resource {
  id: number;
  title: string;
  slug: string;
  description: string;
  summary: string;
  type: 'document' | 'video' | 'presentation' | 'dataset' | 'software' | 'manual' | 'guide';
  category_id: number;
  category_name: string;
  category_slug: string;
  
  author: string;
  author_institution: string;
  created_by: number;
  creator_name: string;
  
  file_url?: string;
  file_size?: number;
  file_type?: string;
  download_url?: string;
  external_url?: string;
  
  language: string;
  publication_date: string;
  keywords: string[];
  tags: string[];
  
  is_featured: boolean;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
  
  downloads_count: number;
  views_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface CreateResourceRequest {
  title: string;
  description: string;
  summary: string;
  type: 'document' | 'video' | 'presentation' | 'dataset' | 'software' | 'manual' | 'guide';
  category_id: number;
  
  author: string;
  author_institution: string;
  
  file_url?: string;
  external_url?: string;
  
  language: string;
  publication_date: string;
  keywords: string[];
  tags: string[];
  
  is_featured: boolean;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
}

export interface UpdateResourceRequest {
  title: string;
  description: string;
  summary: string;
  type: 'document' | 'video' | 'presentation' | 'dataset' | 'software' | 'manual' | 'guide';
  category_id: number;
  
  author: string;
  author_institution: string;
  
  file_url?: string;
  external_url?: string;
  
  language: string;
  publication_date: string;
  keywords: string[];
  tags: string[];
  
  is_featured: boolean;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
}

export interface ResourcesListResponse {
  success: boolean;
  data: {
    resources: Resource[];
    total: number;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface ResourceResponse {
  success: boolean;
  data?: Resource;
  message?: string;
}

export interface PublicResourcesResponse {
  success: boolean;
  data: {
    resources: {
      id: number;
      title: string;
      slug: string;
      summary: string;
      type: string;
      category_name: string;
      category_slug: string;
      author: string;
      author_institution: string;
      publication_date: string;
      language: string;
      file_type?: string;
      file_size?: number;
      external_url?: string;
      keywords: string[];
      tags: string[];
      downloads_count: number;
      views_count: number;
    }[];
    total: number;
  };
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface PublicResourceResponse {
  success: boolean;
  data?: {
    id: number;
    title: string;
    slug: string;
    description: string;
    summary: string;
    type: string;
    category_name: string;
    author: string;
    author_institution: string;
    publication_date: string;
    language: string;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    download_url?: string;
    external_url?: string;
    keywords: string[];
    tags: string[];
    downloads_count: number;
    views_count: number;
  };
  message?: string;
}

// HU-12: Analytics and Reports System Types

export interface AnalyticsMetrics {
  // Platform overview
  overview: {
    total_projects: number;
    total_users: number;
    total_news: number;
    total_events: number;
    total_resources: number;
    active_projects: number;
    published_news: number;
    upcoming_events: number;
    public_resources: number;
  };
  
  // Projects analytics
  projects: {
    by_status: {
      active: number;
      completed: number;
    };
    by_area: Record<string, number>;
    by_institution: Record<string, number>;
    by_month: Array<{
      month: string;
      count: number;
    }>;
    recent_activity: Array<{
      id: number;
      title: string;
      created_at: string;
      status: string;
    }>;
  };
  
  // Users analytics
  users: {
    by_role: {
      admin: number;
      collaborator: number;
      researcher: number;
    };
    by_institution: Record<string, number>;
    active_users: number;
    inactive_users: number;
    recent_registrations: Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      created_at: string;
    }>;
  };
  
  // News analytics
  news: {
    by_status: {
      draft: number;
      published: number;
      archived: number;
    };
    by_category: Record<string, number>;
    total_views: number;
    most_viewed: Array<{
      id: number;
      title: string;
      views_count: number;
      category_name: string;
    }>;
    recent_articles: Array<{
      id: number;
      title: string;
      status: string;
      views_count: number;
      created_at: string;
    }>;
  };
  
  // Events analytics
  events: {
    by_status: {
      draft: number;
      published: number;
      cancelled: number;
      completed: number;
    };
    by_type: Record<string, number>;
    by_category: Record<string, number>;
    total_registrations: number;
    upcoming_count: number;
    most_popular: Array<{
      id: number;
      title: string;
      registrations_count: number;
      views_count: number;
      start_date: string;
    }>;
  };
  
  // Resources analytics
  resources: {
    by_status: {
      draft: number;
      published: number;
      archived: number;
    };
    by_type: Record<string, number>;
    by_category: Record<string, number>;
    total_downloads: number;
    total_views: number;
    most_downloaded: Array<{
      id: number;
      title: string;
      downloads_count: number;
      views_count: number;
      type: string;
    }>;
  };
  
  // Engagement metrics
  engagement: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    bounce_rate: number;
    avg_session_duration: number;
    page_views: Record<string, number>;
  };
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsMetrics;
  generated_at: string;
  message?: string;
}

export interface ReportFilter {
  date_from?: string;
  date_to?: string;
  category?: string;
  status?: string;
  type?: string;
  institution?: string;
  author?: string;
}

export interface GenerateReportRequest {
  report_type: 'projects' | 'users' | 'news' | 'events' | 'resources' | 'comprehensive';
  format: 'json' | 'csv' | 'pdf';
  filters?: ReportFilter;
  include_charts?: boolean;
  include_details?: boolean;
}

export interface ReportResponse {
  success: boolean;
  data?: {
    report_id: string;
    report_type: string;
    format: string;
    generated_at: string;
    download_url?: string;
    file_size?: number;
    expires_at?: string;
  };
  message?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'radar' | 'polarArea';
  data: ChartData;
  options?: {
    responsive?: boolean;
    plugins?: {
      title?: {
        display: boolean;
        text: string;
      };
      legend?: {
        display: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
      };
    };
    scales?: {
      y?: {
        beginAtZero: boolean;
        title?: {
          display: boolean;
          text: string;
        };
      };
      x?: {
        title?: {
          display: boolean;
          text: string;
        };
      };
    };
  };
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  size: 'small' | 'medium' | 'large' | 'full';
  data: any;
  config?: any;
  order: number;
  visible: boolean;
}

// HU-13: Advanced File Management System Types

export interface FileDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  
  // File metadata
  title?: string;
  description?: string;
  tags: string[];
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  
  // File organization
  folder_path: string;
  is_public: boolean;
  access_level: 'public' | 'internal' | 'private' | 'restricted';
  
  // Relationships
  entity_type: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  parent_folder_id?: string;
  
  // Version control
  version: number;
  is_current_version: boolean;
  previous_version_id?: string;
  
  // User tracking
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_by_email: string;
  
  // Usage metrics
  download_count: number;
  view_count: number;
  last_accessed_at?: string;
  
  // File status
  status: 'active' | 'archived' | 'deleted';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Additional metadata
  checksum?: string;
  thumbnail_url?: string;
  preview_url?: string;
  external_url?: string;
  
  // Permissions
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
}

export interface FileFolder {
  id: string;
  name: string;
  path: string;
  parent_id?: string;
  
  // Folder metadata
  description?: string;
  color?: string;
  icon?: string;
  
  // Relationships
  entity_type: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  
  // Permissions
  is_public: boolean;
  access_level: 'public' | 'internal' | 'private' | 'restricted';
  
  // User tracking
  created_by: number;
  created_by_name: string;
  
  // Statistics
  file_count: number;
  folder_count: number;
  total_size: number;
  
  // Status
  status: 'active' | 'archived' | 'deleted';
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FileUploadRequest {
  file: File | ArrayBuffer;
  filename: string;
  title?: string;
  description?: string;
  tags?: string[];
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  folder_path?: string;
  entity_type: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  is_public?: boolean;
  access_level?: 'public' | 'internal' | 'private' | 'restricted';
}

export interface FileUploadResponse {
  success: boolean;
  data?: FileDocument;
  message?: string;
  upload_progress?: number;
}

export interface FileListRequest {
  entity_type?: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  folder_path?: string;
  category?: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  access_level?: 'public' | 'internal' | 'private' | 'restricted';
  status?: 'active' | 'archived' | 'deleted';
  search?: string;
  tags?: string[];
  sort_by?: 'created_at' | 'updated_at' | 'filename' | 'file_size' | 'download_count';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FileListResponse {
  success: boolean;
  data: {
    files: FileDocument[];
    folders: FileFolder[];
    total_files: number;
    total_folders: number;
    total_size: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  message?: string;
}

export interface FileUpdateRequest {
  title?: string;
  description?: string;
  tags?: string[];
  category?: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  folder_path?: string;
  is_public?: boolean;
  access_level?: 'public' | 'internal' | 'private' | 'restricted';
  status?: 'active' | 'archived' | 'deleted';
}

export interface FileVersionInfo {
  id: string;
  version: number;
  filename: string;
  file_size: number;
  checksum: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
  change_notes?: string;
  is_current: boolean;
}

export interface FileVersionHistory {
  success: boolean;
  data: {
    current_file: FileDocument;
    versions: FileVersionInfo[];
    total_versions: number;
  };
  message?: string;
}

export interface FolderCreateRequest {
  name: string;
  path?: string;
  parent_id?: string;
  description?: string;
  color?: string;
  icon?: string;
  entity_type: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  is_public?: boolean;
  access_level?: 'public' | 'internal' | 'private' | 'restricted';
}

export interface FileSearchRequest {
  query: string;
  entity_type?: 'project' | 'event' | 'resource' | 'news' | 'user' | 'general';
  entity_id?: number;
  category?: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  file_extension?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  min_size?: number;
  max_size?: number;
  uploaded_by?: number;
  limit?: number;
  offset?: number;
}

export interface FileSearchResponse {
  success: boolean;
  data: {
    files: FileDocument[];
    total_results: number;
    search_time_ms: number;
    suggestions?: string[];
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface FileStats {
  total_files: number;
  total_folders: number;
  total_size: number;
  total_downloads: number;
  total_views: number;
  files_by_category: Record<string, number>;
  files_by_extension: Record<string, number>;
  files_by_access_level: Record<string, number>;
  storage_usage_by_entity: Record<string, number>;
  top_downloaded: FileDocument[];
  recent_uploads: FileDocument[];
  large_files: FileDocument[];
}

export interface FileStatsResponse {
  success: boolean;
  data: FileStats;
  generated_at: string;
  message?: string;
}

// HU-14: Scientific Publications and DOI System Types

export interface Publication {
  id: string;
  
  // Basic publication info
  title: string;
  abstract: string;
  content?: string;  // Full text content if available
  
  // Authors and contributors
  authors: PublicationAuthor[];
  corresponding_author_id: string;
  
  // Publication details
  publication_type: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'dataset' | 'software' | 'patent' | 'other';
  publication_status: 'draft' | 'under_review' | 'published' | 'retracted' | 'archived';
  
  // Academic metadata
  journal_name?: string;
  journal_issn?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  publication_date: string;
  
  // DOI and identifiers
  doi: string;  // Generated DOI (e.g., 10.5281/codecti.choco.2024.001)
  isbn?: string;
  arxiv_id?: string;
  pubmed_id?: string;
  
  // Subject classification
  subject_areas: string[];
  keywords: string[];
  research_areas: string[];
  
  // Dublin Core metadata
  dublin_core: DublinCoreMetadata;
  
  // Files and attachments
  pdf_file_id?: string;
  pdf_url?: string;
  supplementary_files: string[];  // File IDs from file system
  
  // Institutional info
  institution: string;
  department?: string;
  funding_sources: FundingSource[];
  
  // Academic relations
  cites: string[];  // DOIs of cited publications
  cited_by: string[];  // DOIs of citing publications
  related_publications: string[];
  
  // Quality and review
  peer_reviewed: boolean;
  review_status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
  quality_score?: number;  // 0-100
  
  // Usage metrics
  download_count: number;
  view_count: number;
  citation_count: number;
  altmetric_score?: number;
  
  // Access and licensing
  access_type: 'open_access' | 'restricted' | 'embargo' | 'closed';
  license: 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'CC-BY-NC-SA' | 'CC0' | 'all_rights_reserved' | 'custom';
  embargo_date?: string;
  
  // System metadata
  created_by: number;
  created_by_name: string;
  created_by_email: string;
  last_modified_by: number;
  last_modified_by_name: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // ORCID integration
  orcid_verified: boolean;
  
  // Additional metadata
  language: string;
  geographic_coverage?: string[];
  temporal_coverage?: string;
  methodology?: string;
  
  // Internal system
  internal_notes?: string;
  tags: string[];
  featured: boolean;
}

export interface PublicationAuthor {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  orcid?: string;
  position: number;  // Author order
  role: 'primary' | 'corresponding' | 'contributor' | 'supervisor';
  contribution?: string;  // What did they contribute
}

export interface DublinCoreMetadata {
  // Dublin Core 15 elements
  title: string;
  creator: string[];
  subject: string[];
  description: string;
  publisher: string;
  contributor: string[];
  date: string;
  type: string;
  format: string;
  identifier: string;  // DOI
  source?: string;
  language: string;
  relation?: string[];
  coverage?: string;
  rights: string;
  
  // Dublin Core Terms (additional)
  abstract?: string;
  audience?: string;
  available?: string;
  bibliographicCitation?: string;
  conformsTo?: string;
  created?: string;
  dateAccepted?: string;
  dateCopyrighted?: string;
  dateSubmitted?: string;
  extent?: string;
  hasFormat?: string;
  hasPart?: string[];
  hasVersion?: string;
  isFormatOf?: string;
  isPartOf?: string;
  isReferencedBy?: string[];
  isReplacedBy?: string;
  isRequiredBy?: string[];
  isVersionOf?: string;
  issued?: string;
  license?: string;
  mediator?: string;
  medium?: string;
  modified?: string;
  provenance?: string;
  references?: string[];
  replaces?: string;
  requires?: string[];
  rightsHolder?: string;
  spatial?: string;
  tableOfContents?: string;
  temporal?: string;
  valid?: string;
}

export interface FundingSource {
  id: string;
  name: string;
  grant_number?: string;
  amount?: number;
  currency?: string;
  type: 'government' | 'university' | 'private' | 'international' | 'ngo' | 'other';
  country?: string;
}

export interface CreatePublicationRequest {
  title: string;
  abstract: string;
  content?: string;
  authors: Omit<PublicationAuthor, 'id'>[];
  corresponding_author_email: string;
  publication_type: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'dataset' | 'software' | 'patent' | 'other';
  journal_name?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  publication_date: string;
  subject_areas: string[];
  keywords: string[];
  institution: string;
  department?: string;
  funding_sources?: Omit<FundingSource, 'id'>[];
  access_type: 'open_access' | 'restricted' | 'embargo' | 'closed';
  license: 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'CC-BY-NC-SA' | 'CC0' | 'all_rights_reserved' | 'custom';
  pdf_file_id?: string;
  supplementary_files?: string[];
  language?: string;
  tags?: string[];
}

export interface UpdatePublicationRequest {
  title?: string;
  abstract?: string;
  content?: string;
  authors?: PublicationAuthor[];
  corresponding_author_id?: string;
  publication_type?: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'dataset' | 'software' | 'patent' | 'other';
  journal_name?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  subject_areas?: string[];
  keywords?: string[];
  funding_sources?: FundingSource[];
  access_type?: 'open_access' | 'restricted' | 'embargo' | 'closed';
  license?: 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'CC-BY-NC-SA' | 'CC0' | 'all_rights_reserved' | 'custom';
  publication_status?: 'draft' | 'under_review' | 'published' | 'retracted' | 'archived';
  tags?: string[];
  featured?: boolean;
}

export interface PublicationListRequest {
  publication_type?: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'dataset' | 'software' | 'patent' | 'other';
  publication_status?: 'draft' | 'under_review' | 'published' | 'retracted' | 'archived';
  access_type?: 'open_access' | 'restricted' | 'embargo' | 'closed';
  author?: string;
  institution?: string;
  journal?: string;
  year?: number;
  subject_area?: string;
  keyword?: string;
  search?: string;
  featured?: boolean;
  sort_by?: 'publication_date' | 'created_at' | 'title' | 'citation_count' | 'download_count' | 'view_count';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PublicationListResponse {
  success: boolean;
  data: {
    publications: Publication[];
    total_publications: number;
    featured_publications: Publication[];
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters?: {
    available_subjects: string[];
    available_institutions: string[];
    available_journals: string[];
    available_years: number[];
    available_types: string[];
  };
  message?: string;
}

export interface PublicationResponse {
  success: boolean;
  data?: Publication;
  message?: string;
}

export interface PublicationSearchRequest {
  query: string;
  publication_type?: 'article' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'dataset' | 'software' | 'patent' | 'other';
  subject_area?: string;
  author?: string;
  institution?: string;
  journal?: string;
  year_from?: number;
  year_to?: number;
  access_type?: 'open_access' | 'restricted' | 'embargo' | 'closed';
  has_doi?: boolean;
  peer_reviewed?: boolean;
  limit?: number;
  offset?: number;
}

export interface PublicationSearchResponse {
  success: boolean;
  data: {
    publications: Publication[];
    total_results: number;
    search_time_ms: number;
    suggestions?: string[];
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
  };
  message?: string;
}

export interface CitationFormat {
  format: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'nature' | 'science';
  citation: string;
}

export interface CitationExport {
  format: 'bibtex' | 'ris' | 'endnote' | 'mendeley' | 'zotero';
  content: string;
  filename: string;
}

export interface CitationResponse {
  success: boolean;
  data: {
    publication_id: string;
    doi: string;
    citations: CitationFormat[];
    exports: CitationExport[];
  };
  message?: string;
}

export interface DOIResponse {
  success: boolean;
  data: {
    doi: string;
    url: string;
    metadata: DublinCoreMetadata;
    created_at: string;
  };
  message?: string;
}

export interface PublicationStats {
  total_publications: number;
  publications_by_type: Record<string, number>;
  publications_by_status: Record<string, number>;
  publications_by_access: Record<string, number>;
  publications_by_year: Record<string, number>;
  publications_by_institution: Record<string, number>;
  publications_by_subject: Record<string, number>;
  
  total_authors: number;
  total_citations: number;
  total_downloads: number;
  total_views: number;
  
  top_cited: Publication[];
  most_downloaded: Publication[];
  recent_publications: Publication[];
  top_authors: Array<{
    name: string;
    orcid?: string;
    affiliation: string;
    publication_count: number;
    citation_count: number;
  }>;
  
  impact_metrics: {
    h_index: number;
    i10_index: number;
    average_citations: number;
    total_open_access: number;
    international_collaborations: number;
  };
  
  temporal_trends: {
    monthly_publications: Record<string, number>;
    yearly_citations: Record<string, number>;
    growth_rate: number;
  };
}

export interface PublicationStatsResponse {
  success: boolean;
  data: PublicationStats;
  generated_at: string;
  message?: string;
}

export interface ORCIDProfile {
  orcid: string;
  name: string;
  affiliation: string;
  email?: string;
  verified: boolean;
  publication_count: number;
  citation_count: number;
  h_index?: number;
  last_sync: string;
}

export interface PublicationMetrics {
  publication_id: string;
  doi: string;
  
  // Citation metrics
  citation_count: number;
  self_citations: number;
  recent_citations: number;  // Last 2 years
  
  // Usage metrics
  download_count: number;
  view_count: number;
  pdf_downloads: number;
  
  // Altmetrics
  altmetric_score: number;
  social_media_mentions: number;
  news_mentions: number;
  blog_mentions: number;
  
  // Geographic distribution
  country_views: Record<string, number>;
  institutional_downloads: Record<string, number>;
  
  // Temporal patterns
  monthly_views: Record<string, number>;
  monthly_downloads: Record<string, number>;
  
  // Quality indicators
  peer_review_score?: number;
  editorial_rating?: number;
  
  last_updated: string;
}

export interface PublicationMetricsResponse {
  success: boolean;
  data: PublicationMetrics;
  message?: string;
}

// HU-15: CTeI Indicators and Visualization System Types

export interface CTeIIndicators {
  regional_productivity: RegionalProductivity;
  institutional_comparison: InstitutionalMetrics[];
  research_areas: ResearchAreaMetrics[];
  collaboration_networks: CollaborationNetwork;
  impact_metrics: ImpactMetrics;
  temporal_trends: TemporalTrend[];
  geographic_distribution: GeographicMetrics[];
  generated_at: string;
}

export interface RegionalProductivity {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_publications: number;
  total_researchers: number;
  total_institutions: number;
  research_groups: number;
  annual_growth_rate: number;
  productivity_index: number;
  regional_ranking: number;
  budget_allocation: number;
  international_collaborations: number;
  patents_registered: number;
  technology_transfers: number;
}

export interface InstitutionalMetrics {
  institution: string;
  category: 'universidad' | 'centro_investigacion' | 'empresa' | 'gobierno' | 'ong';
  projects_count: number;
  publications_count: number;
  researchers_count: number;
  students_count: number;
  active_collaborations: number;
  budget_total: number;
  productivity_score: number;
  innovation_index: number;
  impact_factor: number;
  ranking_position: number;
  h_index: number;
  patents_count: number;
  spin_offs: number;
  international_projects: number;
}

export interface ResearchAreaMetrics {
  area: string;
  area_code: string;  // UNESCO classification code
  projects_count: number;
  publications_count: number;
  researchers_involved: number;
  institutions_participating: number;
  funding_total: number;
  collaboration_score: number;
  international_links: number;
  societal_impact: number;
  technology_transfer: number;
  patent_applications: number;
  startup_creations: number;
  policy_contributions: number;
  media_coverage: number;
}

export interface CollaborationNetwork {
  total_collaborations: number;
  internal_collaborations: number;
  national_collaborations: number;
  international_collaborations: number;
  inter_institutional: number;
  interdisciplinary: number;
  network_density: number;
  clustering_coefficient: number;
  key_nodes: CollaborationNode[];
  collaboration_strength: Record<string, number>;
  geographic_reach: string[];
}

export interface CollaborationNode {
  entity: string;
  type: 'institution' | 'researcher' | 'project' | 'research_group';
  connections: number;
  centrality_score: number;
  influence_index: number;
  geographic_location: string;
  specialization_areas: string[];
}

export interface ImpactMetrics {
  // Academic impact
  total_citations: number;
  h_index: number;
  i10_index: number;
  field_weighted_citation_impact: number;
  average_citations_per_publication: number;
  most_cited_publications: CitedPublication[];
  
  // Societal impact
  societal_impact_score: number;
  policy_documents_influenced: number;
  media_mentions: number;
  social_media_reach: number;
  
  // Economic impact
  technology_adoption_rate: number;
  patent_citations: number;
  licensing_revenue: number;
  startup_valuations: number;
  job_creation: number;
  
  // Environmental impact
  environmental_benefits: number;
  sustainable_development_contributions: number;
  carbon_footprint_reduction: number;
}

export interface CitedPublication {
  id: string;
  title: string;
  authors: string[];
  citations: number;
  year: number;
  journal?: string;
  doi?: string;
  research_area: string;
  institution: string;
}

export interface TemporalTrend {
  period: string;  // YYYY-MM format
  year: number;
  month?: number;
  quarter?: number;
  
  // Core metrics
  projects: number;
  publications: number;
  researchers: number;
  funding: number;
  collaborations: number;
  
  // Innovation metrics
  innovation_output: number;
  patents_filed: number;
  technology_transfers: number;
  startups_created: number;
  
  // Quality metrics
  citation_rate: number;
  international_collaboration_rate: number;
  industry_partnerships: number;
  
  // Growth indicators
  project_growth_rate: number;
  researcher_growth_rate: number;
  publication_growth_rate: number;
  funding_growth_rate: number;
}

export interface GeographicMetrics {
  municipality: string;
  department: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Activity metrics
  projects_count: number;
  institutions_count: number;
  researchers_count: number;
  publications_count: number;
  
  // Investment metrics
  funding_amount: number;
  infrastructure_investment: number;
  equipment_value: number;
  
  // Specialization
  specialization_areas: string[];
  dominant_research_area: string;
  specialization_index: number;
  
  // Connectivity
  collaboration_index: number;
  international_connections: number;
  national_connections: number;
  
  // Socioeconomic
  population: number;
  gdp_contribution: number;
  employment_in_ctei: number;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  subtitle?: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'strategic' | 'custom';
  scope: 'municipal' | 'departmental' | 'regional' | 'national';
  
  period: {
    start_date: string;
    end_date: string;
    label: string;  // e.g., "Q1 2024", "2024", "Enero-Marzo 2024"
  };
  
  // Content sections
  executive_summary: string;
  key_findings: string[];
  recommendations: Recommendation[];
  strategic_priorities: string[];
  risk_assessment: RiskAssessment[];
  
  // Data and analysis
  indicators: CTeIIndicators;
  benchmarks: BenchmarkComparison[];
  swot_analysis: SWOTAnalysis;
  
  // Visualizations
  visualizations: ReportVisualization[];
  infographics: InfographicElement[];
  
  // Metadata
  generated_by: string;
  generated_by_role: string;
  reviewed_by?: string;
  approved_by?: string;
  generated_at: string;
  review_date?: string;
  approval_date?: string;
  
  // Distribution
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  confidentiality: 'public' | 'internal' | 'restricted' | 'confidential';
  target_audience: string[];
  
  // Version control
  version: string;
  previous_version_id?: string;
  
  // Export formats
  available_formats: ('pdf' | 'word' | 'powerpoint' | 'web')[];
  download_urls: Record<string, string>;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'policy' | 'investment' | 'collaboration' | 'infrastructure' | 'capacity' | 'innovation';
  target_entities: string[];
  implementation_timeline: string;
  expected_impact: string;
  resources_required: string;
  success_indicators: string[];
  status: 'proposed' | 'in_progress' | 'implemented' | 'on_hold' | 'cancelled';
}

export interface RiskAssessment {
  risk: string;
  category: 'strategic' | 'operational' | 'financial' | 'technological' | 'regulatory';
  probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategies: string[];
  responsible_entity: string;
  monitoring_indicators: string[];
}

export interface SWOTAnalysis {
  strengths: SWOTElement[];
  weaknesses: SWOTElement[];
  opportunities: SWOTElement[];
  threats: SWOTElement[];
  strategic_implications: string[];
  action_items: string[];
}

export interface SWOTElement {
  factor: string;
  description: string;
  impact_level: 'high' | 'medium' | 'low';
  evidence: string[];
  related_indicators: string[];
}

export interface BenchmarkComparison {
  category: string;
  indicator: string;
  choco_value: number;
  choco_position: number;
  
  // Comparative data
  national_average: number;
  national_median: number;
  regional_average: number;
  
  // Peer comparison
  peer_departments: {
    department: string;
    value: number;
    position: number;
  }[];
  
  // International reference
  international_reference?: {
    country: string;
    region?: string;
    value: number;
    source: string;
  };
  
  // Performance analysis
  performance_gap: number;
  percentile_rank: number;
  trend: 'improving' | 'stable' | 'declining';
  target_value?: number;
  target_year?: number;
}

export interface ReportVisualization {
  id: string;
  title: string;
  description: string;
  type: 'chart' | 'map' | 'network' | 'table' | 'infographic' | 'dashboard';
  category: 'overview' | 'trends' | 'comparison' | 'geographic' | 'network' | 'performance';
  
  // Chart configuration
  chart_config?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'bubble' | 'heatmap';
    data_source: string;
    x_axis: string;
    y_axis: string;
    series?: string[];
    colors: string[];
    interactive: boolean;
  };
  
  // Map configuration
  map_config?: {
    type: 'choropleth' | 'markers' | 'heatmap' | 'network';
    base_layer: 'openstreet' | 'satellite' | 'terrain';
    data_layer: string;
    zoom_level: number;
    center: {
      lat: number;
      lng: number;
    };
  };
  
  // Data and display
  data_source: string;
  refresh_frequency: string;
  last_updated: string;
  export_formats: string[];
  
  // Layout
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
}

export interface InfographicElement {
  id: string;
  title: string;
  type: 'metric' | 'icon' | 'chart_mini' | 'progress' | 'comparison' | 'trend';
  value: string | number;
  unit?: string;
  icon?: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  change_value?: number;
  change_period?: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IndicatorFilter {
  // Geographic filters
  municipalities?: string[];
  departments?: string[];
  regions?: string[];
  
  // Entity filters
  institutions?: string[];
  institution_types?: ('universidad' | 'centro_investigacion' | 'empresa' | 'gobierno' | 'ong')[];
  research_areas?: string[];
  
  // Temporal filters
  date_range?: {
    start: string;
    end: string;
  };
  comparison_period?: {
    start: string;
    end: string;
  };
  
  // Metric filters
  indicator_types?: ('productivity' | 'impact' | 'collaboration' | 'innovation' | 'quality')[];
  min_threshold?: Record<string, number>;
  max_threshold?: Record<string, number>;
  
  // Analysis scope
  comparison_level?: 'municipal' | 'departmental' | 'regional' | 'national' | 'international';
  aggregation_level?: 'individual' | 'institutional' | 'municipal' | 'departmental';
  
  // Data quality
  verified_data_only?: boolean;
  complete_data_only?: boolean;
  peer_reviewed_only?: boolean;
}

// API Request/Response types for HU-15

export interface CTeIIndicatorsRequest {
  filters?: IndicatorFilter;
  include_benchmarks?: boolean;
  include_trends?: boolean;
  include_forecasts?: boolean;
  granularity?: 'monthly' | 'quarterly' | 'yearly';
}

export interface CTeIIndicatorsResponse {
  success: boolean;
  data: CTeIIndicators;
  metadata: {
    calculation_date: string;
    data_sources: string[];
    coverage_period: string;
    reliability_score: number;
    completeness_percentage: number;
  };
  message?: string;
}

export interface ExecutiveReportRequest {
  type: 'monthly' | 'quarterly' | 'annual' | 'strategic' | 'custom';
  scope: 'municipal' | 'departmental' | 'regional' | 'national';
  period: {
    start_date: string;
    end_date: string;
  };
  filters?: IndicatorFilter;
  include_recommendations?: boolean;
  include_benchmarks?: boolean;
  include_visualizations?: boolean;
  template?: string;
  format?: 'json' | 'pdf' | 'word' | 'powerpoint';
}

export interface ExecutiveReportResponse {
  success: boolean;
  data: ExecutiveReport;
  download_urls?: Record<string, string>;
  message?: string;
}

export interface BenchmarkingRequest {
  target_entity: string;
  entity_type: 'municipality' | 'institution' | 'research_area' | 'department';
  comparison_entities?: string[];
  indicators: string[];
  time_period: {
    start: string;
    end: string;
  };
  include_international?: boolean;
}

export interface BenchmarkingResponse {
  success: boolean;
  data: {
    target_entity: string;
    benchmarks: BenchmarkComparison[];
    ranking_position: number;
    percentile_rank: number;
    key_insights: string[];
    improvement_areas: string[];
  };
  message?: string;
}

export interface GeographicAnalysisRequest {
  scope: 'choco' | 'colombia' | 'region';
  indicators: string[];
  aggregation_level: 'municipality' | 'department' | 'region';
  time_period?: {
    start: string;
    end: string;
  };
  include_demographics?: boolean;
}

export interface GeographicAnalysisResponse {
  success: boolean;
  data: {
    geographic_data: GeographicMetrics[];
    regional_summary: RegionalProductivity;
    spatial_patterns: {
      hotspots: GeographicMetrics[];
      clusters: {
        name: string;
        municipalities: string[];
        characteristics: string[];
      }[];
      connectivity_matrix: Record<string, Record<string, number>>;
    };
  };
  message?: string;
}

// HU-17: Notifications and Communication System Types

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'project' | 'event' | 'publication' | 'system';
  category: 'general' | 'project' | 'event' | 'publication' | 'resource' | 'user' | 'system' | 'deadline' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // User targeting
  recipient_id: number;
  recipient_email: string;
  recipient_name: string;
  sender_id?: number;
  sender_name?: string;
  
  // Notification content
  action_url?: string;
  action_text?: string;
  icon?: string;
  image_url?: string;
  
  // Related entities
  entity_type?: 'project' | 'event' | 'publication' | 'resource' | 'user' | 'news';
  entity_id?: string | number;
  entity_name?: string;
  
  // Status and timing
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'archived';
  is_read: boolean;
  read_at?: string;
  
  // Delivery channels
  channels: NotificationChannel[];
  email_sent: boolean;
  email_sent_at?: string;
  push_sent: boolean;
  push_sent_at?: string;
  
  // Scheduling
  scheduled_for?: string;
  expires_at?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  tags: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface NotificationChannel {
  type: 'in_app' | 'email' | 'push' | 'sms' | 'whatsapp';
  enabled: boolean;
  delivered: boolean;
  delivered_at?: string;
  error_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  
  // Message content
  subject?: string;
  content: string;
  message_type: 'text' | 'rich' | 'file' | 'link' | 'system';
  
  // Participants
  sender_id: number;
  sender_name: string;
  sender_email: string;
  recipients: MessageRecipient[];
  
  // Message status
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  is_broadcast: boolean;
  
  // Attachments and media
  attachments: MessageAttachment[];
  
  // Threading
  thread_id?: string;
  reply_to_id?: string;
  
  // Message properties
  priority: 'low' | 'medium' | 'high';
  is_urgent: boolean;
  requires_response: boolean;
  
  // Delivery tracking
  sent_at?: string;
  delivered_at?: string;
  read_receipts: MessageReadReceipt[];
  
  // Related entities
  related_entity_type?: 'project' | 'event' | 'publication' | 'resource';
  related_entity_id?: string | number;
  
  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MessageRecipient {
  user_id: number;
  user_name: string;
  user_email: string;
  role: string;
  status: 'pending' | 'delivered' | 'read' | 'archived';
  delivered_at?: string;
  read_at?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface MessageReadReceipt {
  user_id: number;
  user_name: string;
  read_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Conversation {
  id: string;
  title: string;
  type: 'direct' | 'group' | 'broadcast' | 'system';
  
  // Participants
  participants: ConversationParticipant[];
  created_by: number;
  created_by_name: string;
  
  // Conversation status
  status: 'active' | 'archived' | 'deleted';
  is_muted: boolean;
  
  // Message statistics
  total_messages: number;
  unread_count: number;
  last_message_id?: string;
  last_message_content?: string;
  last_message_at?: string;
  last_message_sender?: string;
  
  // Related context
  related_entity_type?: 'project' | 'event' | 'publication' | 'resource';
  related_entity_id?: string | number;
  related_entity_name?: string;
  
  // Settings
  auto_archive_days?: number;
  notification_enabled: boolean;
  
  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface ConversationParticipant {
  user_id: number;
  user_name: string;
  user_email: string;
  role: 'owner' | 'admin' | 'member' | 'observer';
  joined_at: string;
  last_seen_at?: string;
  is_muted: boolean;
  notification_enabled: boolean;
}

export interface NotificationPreference {
  user_id: number;
  
  // Channel preferences
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  
  // Category preferences
  project_notifications: boolean;
  event_notifications: boolean;
  publication_notifications: boolean;
  resource_notifications: boolean;
  system_notifications: boolean;
  collaboration_notifications: boolean;
  deadline_notifications: boolean;
  
  // Timing preferences
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;
  timezone: string;
  
  // Frequency preferences
  digest_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'disabled';
  digest_time?: string; // HH:MM format for daily/weekly
  digest_day?: number; // 0-6 for weekly (0 = Sunday)
  
  // Advanced preferences
  auto_mark_read: boolean;
  group_similar_notifications: boolean;
  
  // Contact preferences
  phone_number?: string;
  whatsapp_number?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'project' | 'event' | 'publication' | 'system' | 'deadline';
  type: 'email' | 'push' | 'in_app' | 'sms';
  
  // Template content
  subject_template: string;
  body_template: string;
  html_template?: string;
  
  // Template variables
  variables: TemplateVariable[];
  
  // Styling and branding
  brand_color?: string;
  logo_url?: string;
  
  // Usage settings
  is_active: boolean;
  is_system: boolean; // System templates cannot be deleted
  
  // Usage statistics
  usage_count: number;
  last_used_at?: string;
  
  // Metadata
  tags: string[];
  created_by: number;
  created_by_name: string;
  
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'url' | 'email';
  description: string;
  required: boolean;
  default_value?: string;
}

export interface CommunicationStats {
  // Notification statistics
  total_notifications: number;
  notifications_sent_today: number;
  notifications_read_rate: number;
  notifications_by_type: Record<string, number>;
  notifications_by_channel: Record<string, number>;
  
  // Message statistics
  total_messages: number;
  messages_sent_today: number;
  active_conversations: number;
  average_response_time: number; // in minutes
  
  // User engagement
  most_active_users: {
    user_id: number;
    user_name: string;
    messages_sent: number;
    notifications_read: number;
  }[];
  
  // Channel performance
  channel_delivery_rates: {
    email: number;
    push: number;
    in_app: number;
    sms: number;
  };
  
  // Temporal patterns
  hourly_activity: Record<string, number>; // hour -> count
  daily_activity: Record<string, number>; // date -> count
  
  // Response metrics
  urgent_messages_count: number;
  overdue_responses: number;
  average_read_time: number; // in minutes
  
  generated_at: string;
}

// API Request/Response types for HU-17

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'project' | 'event' | 'publication' | 'system';
  category: 'general' | 'project' | 'event' | 'publication' | 'resource' | 'user' | 'system' | 'deadline' | 'collaboration';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Recipients
  recipient_ids?: number[];
  recipient_emails?: string[];
  broadcast_to_all?: boolean;
  broadcast_to_roles?: ('admin' | 'collaborator' | 'researcher')[];
  
  // Optional content
  action_url?: string;
  action_text?: string;
  icon?: string;
  image_url?: string;
  
  // Related entity
  entity_type?: 'project' | 'event' | 'publication' | 'resource' | 'user' | 'news';
  entity_id?: string | number;
  
  // Delivery options
  channels?: ('in_app' | 'email' | 'push' | 'sms')[];
  scheduled_for?: string;
  expires_at?: string;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  recipients: number[];
  subject?: string;
  content: string;
  message_type?: 'text' | 'rich' | 'file' | 'link';
  priority?: 'low' | 'medium' | 'high';
  is_urgent?: boolean;
  requires_response?: boolean;
  
  // Threading
  conversation_id?: string;
  reply_to_id?: string;
  
  // Related context
  related_entity_type?: 'project' | 'event' | 'publication' | 'resource';
  related_entity_id?: string | number;
  
  // Attachments
  attachment_urls?: string[];
  
  tags?: string[];
}

export interface NotificationListRequest {
  user_id?: number;
  type?: 'info' | 'success' | 'warning' | 'error' | 'project' | 'event' | 'publication' | 'system';
  category?: 'general' | 'project' | 'event' | 'publication' | 'resource' | 'user' | 'system' | 'deadline' | 'collaboration';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'archived';
  is_read?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'priority' | 'read_at';
  sort_order?: 'asc' | 'desc';
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total_count: number;
    unread_count: number;
    urgent_count: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    pages: number;
    current_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  message?: string;
}

export interface MessageListRequest {
  conversation_id?: string;
  user_id?: number;
  message_type?: 'text' | 'rich' | 'file' | 'link' | 'system';
  is_unread?: boolean;
  priority?: 'low' | 'medium' | 'high';
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListRequest {
  user_id?: number;
  type?: 'direct' | 'group' | 'broadcast' | 'system';
  status?: 'active' | 'archived' | 'deleted';
  has_unread?: boolean;
  related_entity_type?: 'project' | 'event' | 'publication' | 'resource';
  related_entity_id?: string | number;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification;
  message?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: Message;
  message?: string;
}

export interface ConversationResponse {
  success: boolean;
  data?: Conversation;
  message?: string;
}

export interface CommunicationStatsResponse {
  success: boolean;
  data: CommunicationStats;
  generated_at: string;
  message?: string;
}

export interface BulkNotificationRequest {
  template_id?: string;
  notifications: CreateNotificationRequest[];
  send_immediately?: boolean;
  batch_size?: number;
}

export interface BulkNotificationResponse {
  success: boolean;
  data: {
    total_notifications: number;
    successful_sends: number;
    failed_sends: number;
    batch_id: string;
    failed_notifications?: {
      index: number;
      error: string;
      notification: CreateNotificationRequest;
    }[];
  };
  message?: string;
}