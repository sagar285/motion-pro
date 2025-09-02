// lib/email.ts
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// Import notification types (add this import)
export type NotificationType = 
  | 'workspace_created'
  | 'workspace_updated' 
  | 'workspace_deleted'
  | 'page_created'
  | 'page_updated'
  | 'page_deleted'
  | 'section_created'
  | 'section_updated'
  | 'section_deleted'
  | 'member_added'
  | 'member_removed'
  | 'comment_added'
  | 'assignment_changed';

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

// Create transporter - Fix: Use createTransport (not createTransporter)
const transporter: Transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: parseInt('587'),
  secure: false,
  auth: {
    user: 'amanrajlahar@gmail.com',
    pass: 'ivxgadzggrugprdw'
  }
} as EmailConfig);

// Verify transporter
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, otp: string, name: string): Promise<boolean> {
  const mailOptions: MailOptions = {
    from: process.env.EMAIL_FROM || 'amanrajlahar@gmail.com',
    to: email,
    subject: 'Verify Your Motion-Pro Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(45deg, #60a5fa, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 24px;">MP</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Motion-Pro</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">Secure Management System</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Welcome to Motion-Pro, ${name}!</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Thank you for signing up for Motion-Pro. To complete your registration and secure your account, please verify your email address using the OTP code below:
              </p>
              
              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #374151; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                <div style="background: white; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">This code expires in 10 minutes</p>
              </div>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Enter this code on the verification page to activate your account and start using Motion-Pro's powerful management features.
              </p>
              
              <!-- Security Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 30px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">Security Notice</h3>
                <p style="color: #78350f; font-size: 14px; margin: 0;">
                  If you didn't create an account with Motion-Pro, please ignore this email. Your security is important to us.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
                This email was sent to ${email}
              </p>
              <div style="color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© 2024 Motion-Pro. All rights reserved.</p>
                <p style="margin: 5px 0 0;">Professional Management System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, otp: string, name: string): Promise<boolean> {
  const mailOptions: MailOptions = {
    from: process.env.EMAIL_FROM || 'amanrajlahar@gmail.com',
    to: email,
    subject: 'Reset Your Motion-Pro Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(45deg, #60a5fa, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 24px;">MP</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Motion-Pro</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">Password Reset Request</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello ${name}, we received a request to reset your Motion-Pro account password. Use the OTP code below to reset your password:
              </p>
              
              <!-- OTP Code -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #991b1b; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Password Reset Code</p>
                <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px;">${otp}</span>
                </div>
                <p style="color: #991b1b; font-size: 12px; margin-top: 15px;">This code expires in 10 minutes</p>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 30px 0;">
                <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">Security Notice</h3>
                <p style="color: #78350f; font-size: 14px; margin: 0;">
                  If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
                This email was sent to ${email}
              </p>
              <div style="color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© 2024 Motion-Pro. All rights reserved.</p>
                <p style="margin: 5px 0 0;">Professional Management System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// ===== NEW NOTIFICATION EMAIL FUNCTIONS =====
// Add these new functions to support the notification system

// Send notification email
export async function sendNotificationEmail(
  email: string, 
  name: string, 
  title: string, 
  message: string,
  type: NotificationType,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  const mailOptions: MailOptions = {
    from: process.env.EMAIL_FROM || 'amanrajlahar@gmail.com',
    to: email,
    subject: `Motion-Pro: ${title}`,
    html: generateNotificationEmailTemplate(name, title, message, type, metadata,email)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${email} for ${type}`);
    return true;
  } catch (error) {
    console.error(`Error sending notification email to ${email}:`, error);
    return false;
  }
}

// Generate notification email template
function generateNotificationEmailTemplate(
  name: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata: Record<string, any>,
  email: string
): string {
  const iconMap: Record<NotificationType, string> = {
    'workspace_created': '🏢',
    'workspace_updated': '📝',
    'workspace_deleted': '🗑️',
    'page_created': '📄',
    'page_updated': '✏️',
    'page_deleted': '🗑️',
    'section_created': '📁',
    'section_updated': '📝',
    'section_deleted': '🗑️',
    'member_added': '👋',
    'member_removed': '👋',
    'comment_added': '💬',
    'assignment_changed': '📋'
  };

  const colorMap: Record<NotificationType, { bg: string; border: string; text: string }> = {
    'workspace_created': { bg: '#f0f9ff', border: '#0ea5e9', text: '#075985' },
    'workspace_updated': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    'workspace_deleted': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    'page_created': { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    'page_updated': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    'page_deleted': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    'section_created': { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    'section_updated': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    'section_deleted': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    'member_added': { bg: '#f0f9ff', border: '#0ea5e9', text: '#075985' },
    'member_removed': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    'comment_added': { bg: '#faf5ff', border: '#a855f7', text: '#7c2d12' },
    'assignment_changed': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' }
  };

  const icon = iconMap[type] || '📢';
  const colors = colorMap[type] || { bg: '#f3f4f6', border: '#6b7280', text: '#374151' };

  // Generate additional details based on metadata
  let additionalDetails = '';
  if (metadata.changes && Object.keys(metadata.changes).length > 0) {
    const changesList = Object.entries(metadata.changes)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');
    additionalDetails = `
      <div style="margin-top: 20px;">
        <h4 style="color: ${colors.text}; margin: 0 0 10px; font-size: 14px;">Changes Made:</h4>
        <ul style="color: ${colors.text}; font-size: 13px; margin: 0; padding-left: 20px;">
          ${changesList}
        </ul>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(45deg, #60a5fa, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 24px;">MP</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Motion-Pro</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">Workspace Notification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Hello ${name}!</h2>
            
            <!-- Notification Badge -->
            <div style="background: ${colors.bg}; border-left: 4px solid ${colors.border}; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <span style="font-size: 24px; line-height: 1;">${icon}</span>
                <div>
                  <h3 style="color: ${colors.text}; margin: 0 0 10px; font-size: 18px; font-weight: bold;">${title}</h3>
                  <p style="color: ${colors.text}; font-size: 16px; margin: 0; line-height: 1.5;">${message}</p>
                  ${additionalDetails}
                </div>
              </div>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: linear-gradient(135deg, #3730a3, #1e40af); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                View in Motion-Pro Dashboard
              </a>
            </div>
            
            <!-- Timestamp -->
            <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin: 30px 0; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Time:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
            
            <!-- Unsubscribe Notice -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
                You received this notification because you're a member of this workspace.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color: #3730a3; text-decoration: none;">
                  Manage notification preferences in your dashboard
                </a>
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
              This notification was sent to ${email}
            </p>
            <div style="color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© 2024 Motion-Pro. All rights reserved.</p>
              <p style="margin: 5px 0 0;">Professional Management System</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Interface for notification data in daily digest
interface NotificationData {
  id: string;
  title: string;
  message: string;
  workspace_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Send daily digest email (for users who prefer batched notifications)
export async function sendDailyDigestEmail(
  email: string,
  name: string,
  notifications: NotificationData[]
): Promise<boolean> {
  if (notifications.length === 0) return true;

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const workspaceId = notification.workspace_id || 'general';
    if (!acc[workspaceId]) acc[workspaceId] = [];
    acc[workspaceId].push(notification);
    return acc;
  }, {} as Record<string, NotificationData[]>);

  const digestContent = Object.entries(groupedNotifications)
    .map(([workspaceId, notifs]) => {
      const workspaceName = notifs[0]?.metadata?.workspaceName || 'General';
      const notificationList = notifs.map((n: NotificationData) => 
        `<li style="margin-bottom: 8px; color: #374151; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="color: #1f2937;">${n.title}:</strong> ${n.message}
         </li>`
      ).join('');
      
      return `
        <div style="margin-bottom: 30px; background: #f9fafb; border-radius: 8px; padding: 20px;">
          <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            📁 ${workspaceName}
          </h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${notificationList}
          </ul>
        </div>
      `;
    }).join('');

  const mailOptions: MailOptions = {
    from: process.env.EMAIL_FROM || 'amanrajlahar@gmail.com',
    to: email,
    subject: `Motion-Pro Daily Digest - ${notifications.length} Updates`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Digest</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(45deg, #60a5fa, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 24px;">MP</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Motion-Pro</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">Daily Activity Digest</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-bottom: 10px; font-size: 24px;">Hello ${name}!</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Here's your daily summary of <strong>${notifications.length} activities</strong> across your workspaces.
              </p>
              
              ${digestContent}
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #3730a3, #1e40af); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Open Motion-Pro Dashboard
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
                Daily digest for ${email}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color: #3730a3; text-decoration: none;">
                  Manage notification preferences in your dashboard
                </a>
              </p>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 15px;">
                <p style="margin: 0;">© 2024 Motion-Pro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Daily digest sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending daily digest to ${email}:`, error);
    return false;
  }
}

// Send welcome email for new workspace members
export async function sendWorkspaceMemberWelcomeEmail(
  email: string,
  name: string,
  workspaceName: string,
  inviterName: string
): Promise<boolean> {
  const mailOptions: MailOptions = {
    from: process.env.EMAIL_FROM || 'amanrajlahar@gmail.com',
    to: email,
    subject: `Welcome to ${workspaceName} - Motion-Pro`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${workspaceName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(45deg, #60a5fa, #a855f7); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-weight: bold; font-size: 24px;">MP</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Motion-Pro</h1>
              <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">Workspace Invitation</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Welcome ${name}!</h2>
              
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <span style="font-size: 24px; line-height: 1;">👋</span>
                  <div>
                    <h3 style="color: #075985; margin: 0 0 10px; font-size: 18px; font-weight: bold;">You've been added to ${workspaceName}</h3>
                    <p style="color: #075985; font-size: 16px; margin: 0; line-height: 1.5;">
                      ${inviterName} has added you as a member of the "${workspaceName}" workspace in Motion-Pro.
                    </p>
                  </div>
                </div>
              </div>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                You now have access to collaborate on projects, view shared content, and receive updates about workspace activities.
              </p>
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #3730a3, #1e40af); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Access ${workspaceName}
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px;">
                This invitation was sent to ${email}
              </p>
              <div style="color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">© 2024 Motion-Pro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email} for workspace ${workspaceName}`);
    return true;
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    return false;
  }
}

// Interface for batch email data
interface BatchEmailData {
  email: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

// Batch email sending for multiple notifications
export async function sendBatchNotificationEmails(
  emailData: BatchEmailData[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };
  
  // Process emails in chunks to avoid overwhelming the SMTP server
  const chunkSize = 5;
  for (let i = 0; i < emailData.length; i += chunkSize) {
    const chunk = emailData.slice(i, i + chunkSize);
    
    const promises = chunk.map(async (data: BatchEmailData) => {
      try {
        const success = await sendNotificationEmail(
          data.email,
          data.name,
          data.title,
          data.message,
          data.type,
          data.metadata || {}
        );
        
        if (success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Failed to send to ${data.email}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error sending to ${data.email}: ${error}`);
      }
    });
    
    await Promise.all(promises);
    
    // Add small delay between chunks to be respectful to SMTP server
    if (i + chunkSize < emailData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Batch email results: ${results.sent} sent, ${results.failed} failed`);
  return results;
}