// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Core Interfaces
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
  email_verified: boolean;
}

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface OTPRecord extends RowDataPacket {
  id: number;
  email: string;
  otp: string;
  type: 'verification' | 'password_reset';
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface LoginAttempt {
  email: string;
  ip_address: string;
  success: boolean;
  attempted_at: Date;
}

export interface SessionData {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: Date;
  created_at: Date;
}

// Password Management
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
}

// JWT Token Management
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!"Aman1234") {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(payload, "Aman1234", {
    expiresIn: '7d',
    issuer: 'motion-pro',
    audience: 'motion-pro-users'
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!'Aman1234' || !token) {
      return null;
    }
    
    return jwt.verify(token, 'Aman1234', {
      issuer: 'motion-pro',
      audience: 'motion-pro-users'
    }) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function generateRefreshToken(): string {
  return jwt.sign(
    { type: 'refresh' }, 
    'Aman1234' as string, 
    { expiresIn: '30d' }
  );
}

// OTP Management
export function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export async function storeOTP(
  email: string, 
  otp: string, 
  type: 'verification' | 'password_reset' = 'verification'
): Promise<void> {
  if (!email || !otp) {
    throw new Error('Email and OTP are required');
  }

  const db = await getConnection();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  try {
    // Delete existing OTPs for this email and type
    await db.execute(
      'DELETE FROM otps WHERE email = ? AND type = ?',
      [email.toLowerCase().trim(), type]
    );
    
    // Insert new OTP
    await db.execute(
      'INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)',
      [email.toLowerCase().trim(), otp, type, expiresAt]
    );
  } catch (error) {
    console.error('Failed to store OTP:', error);
    throw new Error('Failed to generate verification code');
  }
}

export async function verifyOTP(
  email: string, 
  otp: string, 
  type: 'verification' | 'password_reset' = 'verification'
): Promise<boolean> {
  if (!email || !otp) {
    return false;
  }

  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<OTPRecord[]>(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND type = ? AND expires_at > NOW() AND used = FALSE',
      [email.toLowerCase().trim(), otp, type]
    );
    
    if (rows.length === 0) {
      return false;
    }
    
    // Mark OTP as used
    await db.execute(
      'UPDATE otps SET used = TRUE WHERE id = ?',
      [rows[0].id]
    );
    
    return true;
  } catch (error) {
    console.error('OTP verification failed:', error);
    return false;
  }
}

export async function cleanupExpiredOTPs(): Promise<void> {
  const db = await getConnection();
  
  try {
    await db.execute('DELETE FROM otps WHERE expires_at < NOW() OR used = TRUE');
  } catch (error) {
    console.error('Failed to cleanup expired OTPs:', error);
  }
}

// User Management
export async function createUser(userData: CreateUserData): Promise<UserResponse> {
  const { name, email, phone, password } = userData;
  
  // Validate input
  if (!name?.trim() || !email?.trim() || !password) {
    throw new Error('Name, email, and password are required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const db = await getConnection();
  const cleanEmail = email.toLowerCase().trim();
  
  try {
    // Check if user exists
    const [existingUsers] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );
    
    if (existingUsers.length > 0) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert user
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO users (name, email, phone, password, email_verified) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, phone?.trim() || null, hashedPassword, false]
    );
    
    return {
      id: result.insertId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim(),
      email_verified: false
    };
  } catch (error: any) {
    if (error.message === 'User already exists') {
      throw error;
    }
    console.error('User creation failed:', error);
    throw new Error('Failed to create user account');
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!email) {
    return null;
  }

  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  if (!id || id <= 0) {
    return null;
  }

  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    return null;
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<boolean> {
  if (!id || id <= 0) {
    return false;
  }

  const db = await getConnection();
  const allowedFields = ['name', 'phone', 'email_verified'];
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  
  try {
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return false;
    }
    
    updateValues.push(id);
    
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to update user:', error);
    return false;
  }
}

export async function verifyUserEmail(email: string): Promise<boolean> {
  if (!email) {
    return false;
  }

  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE users SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to verify user email:', error);
    return false;
  }
}

export async function updatePassword(email: string, newPassword: string): Promise<boolean> {
  if (!email || !newPassword) {
    return false;
  }

  const db = await getConnection();
  
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [hashedPassword, email.toLowerCase().trim()]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to update password:', error);
    return false;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  if (!id || id <= 0) {
    return false;
  }

  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return false;
  }
}

// Authentication
export async function authenticateUser(email: string, password: string): Promise<UserResponse | null> {
  if (!email || !password) {
    return null;
  }

  try {
    const user = await getUserByEmail(email);
    
    if (!user || !user.password) {
      return null;
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      // Log failed attempt
      await logLoginAttempt(email, 'unknown', false);
      return null;
    }
    
    // Log successful attempt
    await logLoginAttempt(email, 'unknown', true);
    
    // Return user without password
    const { password: _, reset_token, reset_token_expires, created_at, updated_at, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

// Session Management
export async function createSession(userId: number, sessionToken: string): Promise<boolean> {
  const db = await getConnection();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  try {
    await db.execute(
      'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
      [userId, sessionToken, expiresAt]
    );
    return true;
  } catch (error) {
    console.error('Failed to create session:', error);
    return false;
  }
}

export async function validateSession(sessionToken: string): Promise<User | null> {
  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<(SessionData & RowDataPacket)[]>(
      'SELECT s.*, u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > NOW()',
      [sessionToken]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as any; // TypeScript workaround for joined query
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

export async function deleteSession(sessionToken: string): Promise<boolean> {
  const db = await getConnection();
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM sessions WHERE session_token = ?',
      [sessionToken]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to delete session:', error);
    return false;
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  const db = await getConnection();
  
  try {
    await db.execute('DELETE FROM sessions WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}

// Reset Token Management
export async function storeResetToken(email: string, token: string): Promise<boolean> {
  if (!email || !token) {
    return false;
  }

  const db = await getConnection();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  try {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [token, expiresAt, email.toLowerCase().trim()]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Failed to store reset token:', error);
    return false;
  }
}

export async function verifyResetToken(token: string): Promise<User | null> {
  if (!token) {
    return null;
  }

  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('Reset token verification failed:', error);
    return null;
  }
}

// Security & Logging
export async function logLoginAttempt(email: string, ipAddress: string, success: boolean): Promise<void> {
  const db = await getConnection();
  
  try {
    await db.execute(
      'INSERT INTO login_attempts (email, ip_address, success, attempted_at) VALUES (?, ?, ?, NOW())',
      [email.toLowerCase().trim(), ipAddress, success]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
}

export async function getRecentLoginAttempts(email: string, timeWindowMinutes: number = 15): Promise<number> {
  const db = await getConnection();
  
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND success = FALSE AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)',
      [email.toLowerCase().trim(), timeWindowMinutes]
    );
    
    return rows[0]?.count || 0;
  } catch (error) {
    console.error('Failed to get login attempts:', error);
    return 0;
  }
}

export async function isAccountLocked(email: string): Promise<boolean> {
  const attempts = await getRecentLoginAttempts(email, 15);
  return attempts >= 5; // Lock after 5 failed attempts in 15 minutes
}

// Utility Functions
export function sanitizeUserForResponse(user: User): UserResponse {
  const { password, reset_token, reset_token_expires, created_at, updated_at, ...sanitized } = user;
  return sanitized;
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  return { isValid: errors.length === 0, errors };
}