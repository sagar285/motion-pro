// lib/email.ts
import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

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

// Create transporter
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
    from: process.env.EMAIL_FROM as string,
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
    from: process.env.EMAIL_FROM as string,
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