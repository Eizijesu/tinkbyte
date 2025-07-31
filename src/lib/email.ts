// src/lib/email.ts - FIXED CSS & Perfect Square Design
import { config } from './config';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  data?: any;
  error?: string;
  id?: string;
}

export class EmailService {
  private static workerUrl = 'https://tinkbyte-email.victoriousvirtue.workers.dev/';
  private static apiSecret = 'cx4SDEZVb61gezXudvHm8nBsqPjrhopC';

  static async sendEmail(template: EmailTemplate): Promise<EmailResult> {
    try {
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiSecret,
        },
        body: JSON.stringify({
          to: template.to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Worker API Error:', data);
        return { success: false, error: data.message || 'Email sending failed' };
      }

      return { success: true, data, id: data?.id };
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email verification template (for signup)
  static async sendVerificationEmail(userEmail: string, token: string, confirmationUrl: string, displayName?: string): Promise<EmailResult> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Verify Your TinkByte Account',
      html: this.getVerificationEmailHTML(token, confirmationUrl, displayName),
      text: this.getVerificationEmailText(token, confirmationUrl, displayName),
    };

    return this.sendEmail(template);
  }

  // Welcome email for new users
  static async sendWelcomeEmail(userEmail: string, displayName: string): Promise<EmailResult> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to TinkByte - Where Builders Build the Future',
      html: this.getWelcomeEmailHTML(displayName),
      text: this.getWelcomeEmailText(displayName),
    };

    return this.sendEmail(template);
  }

  // Newsletter subscription
  static async sendNewsletterSubscriptionEmail(userEmail: string, confirmationUrl: string, unsubscribeUrl: string, name?: string): Promise<EmailResult> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to TinkByte Weekly - Confirm Your Subscription',
      html: this.getNewsletterSubscriptionHTML(confirmationUrl, unsubscribeUrl, name),
      text: this.getNewsletterSubscriptionText(confirmationUrl, unsubscribeUrl, name),
    };

    return this.sendEmail(template);
  }

  // Password reset email template
  static async sendPasswordResetEmail(
    userEmail: string, 
    resetUrl: string, 
    displayName: string, 
    otp?: string
  ): Promise<EmailResult> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Reset Your TinkByte Password',
      html: this.getPasswordResetEmailHTML(resetUrl, displayName),
      text: this.getPasswordResetEmailText(resetUrl, displayName),
    };

    return this.sendEmail(template);
  }

  // FIXED: Perfect Square Email Styles
  private static getEmailStyles(): string {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          background: #f1f5f9;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border: 3px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          padding: 2.5rem 2rem;
          text-align: center;
          border-bottom: 4px solid #1e40af;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .logo-square {
          width: 48px;
          height: 48px;
          background: white;
          color: #1e40af;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.5rem;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.02em;
        }
        
        .brand-name {
          color: white;
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .brand-tagline {
          color: rgba(255, 255, 255, 0.95);
          font-size: 0.875rem;
          margin: 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .email-content {
          padding: 3rem 2rem;
        }
        
        .content-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e40af;
          margin: 0 0 1rem 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        .content-subtitle {
          color: #64748b;
          font-size: 1.125rem;
          margin: 0 0 2rem 0;
          text-align: center;
          font-weight: 500;
        }
        
        .primary-button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: white !important;
          padding: 16px 32px;
          text-decoration: none;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          border: 3px solid #1e40af;
          transition: all 0.3s ease;
          text-align: center;
          display: inline-block;
        }
        
        .primary-button:hover {
          background: linear-gradient(135deg, #1e40af, #1e3a8a);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(30, 64, 175, 0.3);
        }
        
        .button-container {
          text-align: center;
          margin: 2.5rem 0;
        }
        
        .verification-section {
          background: #f8fafc;
          border: 3px solid #e2e8f0;
          padding: 2.5rem;
          margin: 2.5rem 0;
          text-align: center;
        }
        
        .verification-label {
          color: #1e40af;
          font-weight: 800;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
          display: block;
        }
        
        .verification-code {
          font-size: 3rem;
          font-weight: 900;
          color: #1e40af;
          letter-spacing: 0.5rem;
          font-family: 'Courier New', monospace;
          background: white;
          padding: 1.5rem 2rem;
          border: 4px solid #1e40af;
          display: inline-block;
          margin: 0 0 1.5rem 0;
        }
        
        .verification-note {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .security-warning {
          background: rgba(239, 68, 68, 0.1);
          border: 3px solid #fca5a5;
          color: #dc2626;
          padding: 1.5rem;
          margin: 2.5rem 0;
          font-size: 0.875rem;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .features-section {
          background: #f8fafc;
          border: 3px solid #e2e8f0;
          padding: 2rem;
          margin: 2.5rem 0;
        }
        
        .features-title {
          color: #1e40af;
          font-weight: 800;
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
        }
        
        .features-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        
        .features-item {
          margin: 1rem 0;
          font-weight: 600;
          position: relative;
          padding-left: 2rem;
          color: #374151;
        }
        
        .features-item:before {
          content: "■";
          position: absolute;
          left: 0;
          color: #3b82f6;
          font-size: 1.2rem;
        }
        
        .email-footer {
          background: #1e293b;
          color: #94a3b8;
          padding: 2.5rem 2rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .email-footer strong {
          color: white;
          font-weight: 900;
        }
        
        .email-footer a {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 700;
        }
        
        .email-footer a:hover {
          color: #93c5fd;
        }
        
        .content-text {
          font-size: 1rem;
          line-height: 1.7;
          color: #374151;
          margin: 1.5rem 0;
          font-weight: 500;
        }
        
        .content-text strong {
          color: #1e40af;
          font-weight: 700;
        }
        
        .content-text a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }
        
        .content-text a:hover {
          color: #1e40af;
          text-decoration: underline;
        }
      </style>
    `;
  }

  private static getEmailHeader(): string {
    return `
      <div class="email-header">
        <div class="logo-section">
          <div class="logo-square">TB</div>
          <h1 class="brand-name">TinkByte</h1>
        </div>
        <p class="brand-tagline">Where builders build the future</p>
      </div>
    `;
  }

  private static getEmailFooter(): string {
    return `
      <div class="email-footer">
        <strong>TinkByte</strong><br>
        Where builders build the future<br>
        <a href="https://tinkbyte.com">tinkbyte.com</a>
      </div>
    `;
  }

  // Email verification template
  private static getVerificationEmailHTML(token: string, confirmationUrl: string, displayName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify Your Email - TinkByte</title>
        ${this.getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader()}
          
          <div class="email-content">
            <h2 class="content-title">Verify Your Email</h2>
            <p class="content-subtitle">Hi ${displayName || 'Builder'}! Enter this code to complete your registration:</p>
            
            <div class="verification-section">
              <span class="verification-label">Your Verification Code</span>
              <div class="verification-code">${token}</div>
              <p class="verification-note">This code expires in 30 minutes</p>
            </div>
            
            <div class="security-warning">
              🔒 If you didn't create this account, please ignore this email.
            </div>
          </div>
          
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  // Welcome email template
  private static getWelcomeEmailHTML(displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to TinkByte</title>
        ${this.getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader()}
          
          <div class="email-content">
            <h2 class="content-title">Welcome ${displayName}! 🎉</h2>
            
            <p class="content-text">We're excited to have you join our community of builders, creators, and innovators who are shaping the future of technology.</p>
            
            <div class="features-section">
              <h3 class="features-title">Get Started</h3>
              <ul class="features-list">
                <li class="features-item">Complete your profile to connect with other builders</li>
                <li class="features-item">Explore our latest articles on product innovation</li>
                <li class="features-item">Join discussions and share your insights</li>
                <li class="features-item">Subscribe to TinkByte Weekly for curated content</li>
                <li class="features-item">Follow your favorite authors and topics</li>
              </ul>
            </div>
            
            <div class="button-container">
              <a href="https://tinkbyte.com/profile" class="primary-button">Complete Your Profile</a>
            </div>
            
            <p class="content-text">At TinkByte, we focus on <strong>real solutions</strong>, <strong>practical insights</strong>, and <strong>genuine innovation</strong>. No hype, just substance that helps you build better products.</p>
            
            <p class="content-text">Questions? Reply to this email or reach out at <a href="mailto:hello@tinkbyte.com">hello@tinkbyte.com</a></p>
            
            <p class="content-text">Happy building!<br>
            <strong>The TinkByte Team</strong></p>
          </div>
          
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  // Newsletter subscription template
  private static getNewsletterSubscriptionHTML(confirmationUrl: string, unsubscribeUrl: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to TinkByte Weekly</title>
        ${this.getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader()}
          
          <div class="email-content">
            <h2 class="content-title">Welcome to TinkByte Weekly! 📬</h2>
            
            <p class="content-text">Hi <strong>${name || 'Builder'}</strong>,</p>
            
            <p class="content-text">Thanks for subscribing to TinkByte Weekly! You're about to join thousands of builders who get the best tech innovation insights delivered to their inbox.</p>
            
            <div class="button-container">
              <a href="${confirmationUrl}" class="primary-button">Confirm Subscription</a>
            </div>
            
            <div class="features-section">
              <h3 class="features-title">What You'll Get Every Week</h3>
              <ul class="features-list">
                <li class="features-item">Latest articles on product building and innovation</li>
                <li class="features-item">Curated tools and resources for builders</li>
                <li class="features-item">Community highlights and success stories</li>
                <li class="features-item">Exclusive insights from industry leaders</li>
                <li class="features-item">No fluff, just actionable content</li>
              </ul>
            </div>
            
            <p class="content-text">We respect your inbox. You can <a href="${unsubscribeUrl}">unsubscribe</a> at any time.</p>
          </div>
          
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  // Password reset HTML template
  private static getPasswordResetEmailHTML(resetUrl: string, displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Your Password - TinkByte</title>
        ${this.getEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader()}
          
          <div class="email-content">
            <h2 class="content-title">Reset Your Password</h2>
            <p class="content-subtitle">Hi <strong>${displayName}</strong>, we received a request to reset your TinkByte password.</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="primary-button">Reset Password</a>
            </div>
            
            <div class="security-warning">
              🔒 If you didn't request this reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p class="content-text">For security reasons, this link will expire in <strong>60 minutes</strong>. If you need a new reset link, you can request one at <a href="https://tinkbyte.com/auth/forgot-password">tinkbyte.com/auth/forgot-password</a></p>
          </div>
          
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  // Text versions for better email client compatibility
  private static getVerificationEmailText(token: string, confirmationUrl: string, displayName?: string): string {
    return `
Verify Your TinkByte Account

Hi ${displayName || 'Builder'}!

Enter this verification code in TinkByte: ${token}

This code expires in 30 minutes.

If you didn't create this account, please ignore this email.

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getWelcomeEmailText(displayName: string): string {
    return `
Welcome to TinkByte, ${displayName}!

We're excited to have you join our community of builders and innovators.

Get started:
- Complete your profile: https://tinkbyte.com/profile
- Explore articles: https://tinkbyte.com/articles
- Browse categories: https://tinkbyte.com/categories
- Join discussions and share insights
- Subscribe to TinkByte Weekly

At TinkByte, we focus on real solutions and genuine innovation - no hype, just substance.

Questions? Email hello@tinkbyte.com

Happy building!
The TinkByte Team

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getNewsletterSubscriptionText(confirmationUrl: string, unsubscribeUrl: string, name?: string): string {
    return `
Welcome to TinkByte Weekly!

Hi ${name || 'Builder'},

Thanks for subscribing to TinkByte Weekly!

Confirm your subscription: ${confirmationUrl}

What you'll get:
- Latest product building insights
- Curated tools and resources
- Community highlights
- Exclusive industry insights
- No fluff, just actionable content

Unsubscribe anytime: ${unsubscribeUrl}

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  // Password reset text template
  private static getPasswordResetEmailText(resetUrl: string, displayName: string): string {
    return `
Reset Your TinkByte Password

Hi ${displayName},

We received a request to reset your password.

Click here to reset your password: ${resetUrl}

This link expires in 60 minutes.

If you didn't request this reset, please ignore this email.

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }
}