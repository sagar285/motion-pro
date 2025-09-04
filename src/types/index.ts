export interface ContentBlock {
  id: string;
  type: 'text' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'code' | 'divider' | 'image' | 'table' | 'checklist' | 'advanced_table' | 'nested_list' | 'dropdown_table';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageItem {
  id: string;
  title: string;
  icon: string;
  type: 'page' | 'database';
  parentId?: string;
  status?: 'Management' | 'Execution' | 'Inbox';
  assignees?: string[];
  deadline?: string;
  content?: ContentBlock[];
  children?: PageItem[];  // Add this line
  properties?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  pageId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Subsection {
  id: string;
  title: string;
  pages: PageItem[];
  order: number;
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  pages: PageItem[];
  subsections?: Subsection[];
  order: number;
}

export interface Workspace {
  id: string;
  name: string;
  sections: Section[];
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
}

export type BlockType = ContentBlock['type'];

// Advanced block metadata types
export interface TableData {
  headers: string[];
  rows: string[][];
  columnTypes: string[];
  styling: {
    headerBg: string;
    alternatingRows: boolean;
    borders: boolean;
    compact: boolean;
  };
}

export interface ListItem {
  id: string;
  content: string;
  level: number;
  children: ListItem[];
}

export interface ChecklistItem {
  id: string;
  content: string;
  checked: boolean;
}

export interface ImageData {
  url: string;
  caption: string;
  alt: string;
}

export interface DropdownSection {
  id: string;
  title: string;
  isExpanded: boolean;
  tableData: {
    headers: string[];
    rows: string[][];
  };
}

// types/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  email_verified: boolean;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  email_verified?: boolean;
}

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface OTPRecord {
  id: number;
  email: string;
  otp: string;
  type: 'verification' | 'password_reset';
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// API Request/Response Types
export interface SignupRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

export interface ErrorResponse {
  error: string;
  requiresVerification?: boolean;
  email?: string;
}

export interface SignupResponse {
  message: string;
  user: UserResponse;
  emailSent: boolean;
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
  token: string;
}

// Form State Types
export interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string[];
  newPassword: string;
  confirmPassword: string;
}

// Component Props Types
export interface FormInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export interface OTPInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

// Database Configuration Types
export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
  reconnect: boolean;
}

// Email Configuration Types
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Utility Types
export type OTPType = 'verification' | 'password_reset';

export type RouteGuard = 'protected' | 'auth' | 'public';

export interface RouteConfig {
  path: string;
  guard: RouteGuard;
  redirectTo?: string;
}

// Environment Variables Type
export interface EnvConfig {
  DB_HOST: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_PORT: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  EMAIL_FROM: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  FRONTEND_URL: string;
}

// Extend Next.js Request type
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvConfig {}
  }
}

