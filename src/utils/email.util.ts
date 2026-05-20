import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "mail.gmx.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Verify transporter configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("✅ Email server is ready to send messages");
      return true;
    } catch (error) {
      console.error("❌ Email server connection failed:", error);
      return false;
    }
  }

  // Send email
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Digital Health Assistant" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return false;
    }
  }

  // Send OTP email
  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const subject = "Verify Your Email - Digital Health Assistant";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .otp-box {
              background-color: #f0f8ff;
              border: 2px dashed #4CAF50;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 30px 0;
              border-radius: 8px;
              color: #333;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin-top: 20px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>Email Verification</h2>
              <p>Hello,</p>
              <p>Thank you for registering with Digital Health Assistant. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">${otp}</div>
              
              <p>This OTP will expire in <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this verification, please ignore this email or contact our support team.
              </div>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - Email Verification

Hello,

Thank you for registering with Digital Health Assistant. To complete your registration, please verify your email address using the OTP below:

OTP: ${otp}

This OTP will expire in 10 minutes.

Security Notice: If you didn't request this verification, please ignore this email or contact our support team.

This is an automated email. Please do not reply.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({ to: email, subject, text, html });
  }

  // Send password reset email
  async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;
    const subject = "Reset Your Password - Digital Health Assistant";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #45a049;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin-top: 20px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4CAF50;">${resetLink}</p>
              
              <p>This link will expire in <strong>1 hour</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact our support team immediately.
              </div>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - Password Reset Request

Hello,

We received a request to reset your password. Click the link below to reset it:

${resetLink}

This link will expire in 1 hour.

Security Notice: If you didn't request a password reset, please ignore this email or contact our support team immediately.

This is an automated email. Please do not reply.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({ to: email, subject, text, html });
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = "Welcome to Digital Health Assistant!";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>Welcome, ${firstName}! 🎉</h2>
              <p>Your email has been successfully verified!</p>
              <p>Thank you for joining Digital Health Assistant. We're excited to help you on your health journey.</p>
              <p>You can now access all features of our platform.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - Welcome!

Welcome, ${firstName}! 🎉

Your email has been successfully verified!

Thank you for joining Digital Health Assistant. We're excited to help you on your health journey.

You can now access all features of our platform.

This is an automated email. Please do not reply.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({ to: email, subject, text, html });
  }

  // Send new ticket notification to admin
  async sendTicketCreatedAdminEmail(
    ticketId: string,
    userEmail: string,
    subject: string,
    priority: string
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const emailSubject = `🎫 New Support Ticket: ${subject}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .ticket-info {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .priority-high { color: #f44336; font-weight: bold; }
            .priority-medium { color: #ff9800; font-weight: bold; }
            .priority-low { color: #4CAF50; font-weight: bold; }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>New Support Ticket Received</h2>
              
              <div class="ticket-info">
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>From:</strong> ${userEmail}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Priority:</strong> <span class="priority-${priority.toLowerCase()}">${priority}</span></p>
              </div>
              
              <p>Please log in to the admin panel to view and respond to this ticket.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - New Support Ticket

Ticket ID: ${ticketId}
From: ${userEmail}
Subject: ${subject}
Priority: ${priority}

Please log in to the admin panel to view and respond to this ticket.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({
      to: adminEmail!,
      subject: emailSubject,
      text,
      html,
    });
  }

  // Send ticket confirmation to user
  async sendTicketCreatedUserEmail(
    email: string,
    firstName: string,
    ticketId: string,
    subject: string
  ): Promise<boolean> {
    const emailSubject = "Support Ticket Created - Digital Health Assistant";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .ticket-box {
              background-color: #f0f8ff;
              border-left: 4px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>Support Ticket Created</h2>
              <p>Hello ${firstName},</p>
              <p>Your support ticket has been successfully created. Our team will review it and get back to you soon.</p>
              
              <div class="ticket-box">
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Status:</strong> Open</p>
              </div>
              
              <p>You can view your ticket status in your account dashboard.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - Support Ticket Created

Hello ${firstName},

Your support ticket has been successfully created. Our team will review it and get back to you soon.

Ticket ID: ${ticketId}
Subject: ${subject}
Status: Open

You can view your ticket status in your account dashboard.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({
      to: email,
      subject: emailSubject,
      text,
      html,
    });
  }

  // Send ticket resolution notification to user
  async sendTicketResolvedEmail(
    email: string,
    firstName: string,
    ticketId: string,
    subject: string,
    resolutionNote: string
  ): Promise<boolean> {
    const emailSubject = "Support Ticket Resolved - Digital Health Assistant";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              color: #4CAF50;
              margin-bottom: 30px;
            }
            .ticket-box {
              background-color: #f0f8ff;
              border-left: 4px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .resolution {
              background-color: #e8f5e9;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1 class="header">🏥 Digital Health Assistant</h1>
              <h2>✅ Support Ticket Resolved</h2>
              <p>Hello ${firstName},</p>
              <p>Your support ticket has been resolved by our team.</p>
              
              <div class="ticket-box">
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Status:</strong> Resolved</p>
              </div>
              
              <div class="resolution">
                <h3>Resolution:</h3>
                <p>${resolutionNote}</p>
              </div>
              
              <p>If you have any further questions or need additional assistance, please feel free to create a new support ticket.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Digital Health Assistant - Support Ticket Resolved

Hello ${firstName},

Your support ticket has been resolved by our team.

Ticket ID: ${ticketId}
Subject: ${subject}
Status: Resolved

Resolution:
${resolutionNote}

If you have any further questions or need additional assistance, please feel free to create a new support ticket.

© ${new Date().getFullYear()} Digital Health Assistant. All rights reserved.
    `;

    return await this.sendEmail({
      to: email,
      subject: emailSubject,
      text,
      html,
    });
  }

}

export default new EmailService();
