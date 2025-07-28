// src/lib/email.ts - COMPLETE EMAIL SERVICE
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
      console.log('📧 Email Service: Sending via Cloudflare Worker...');
      console.log('📧 To:', template.to);
      console.log('📧 Subject:', template.subject);

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

      console.log('✅ Email sent successfully via Worker');
      console.log('✅ Email ID:', data?.id);
      
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
  otp?: string // Make OTP optional since we're using Supabase's link
): Promise<EmailResult> {
  const template: EmailTemplate = {
    to: userEmail,
    subject: 'Reset Your TinkByte Password',
    html: this.getPasswordResetEmailHTML(resetUrl, displayName),
    text: this.getPasswordResetEmailText(resetUrl, displayName),
  };

  return this.sendEmail(template);
}


  // Common email styles
  private static getEmailStyles(): string {
    return `
    <style>
      body {
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #1e293b;
        margin: 0;
        padding: 0;
        background: #f8fafc;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 0; /* Square design - no radius */
      }
      .header {
        background: linear-gradient(135deg, #243788 0%, #b4bce1 100%);
        padding: 2rem;
        text-align: center;
        border-bottom: 4px solid #243788;
      }
      .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      .logo-icon-text {
        width: 40px;
        height: 40px;
        background: white;
        color: #243788;
        border: 2px solid white;
        border-radius: 0; /* Square design */
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.2rem;
        font-family: 'Space Grotesk', sans-serif;
      }
      .logo {
        color: white;
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .tagline {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        margin: 0;
        font-weight: 500;
      }
      .content {
        padding: 2.5rem 2rem;
      }
      .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #243788;
        margin: 0 0 1.5rem 0;
        text-align: center;
      }
      .subtitle {
        color: #64748b;
        font-size: 1rem;
        margin: 0 0 2rem 0;
        text-align: center;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #243788, #1e2d6b);
        color: white !important;
        padding: 14px 28px;
        text-decoration: none;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.875rem;
        border: 2px solid #243788;
        border-radius: 0; /* Square design */
        transition: all 0.3s ease;
      }
      .btn-container {
        text-align: center;
        margin: 2rem 0;
      }
      .otp-section {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 0; /* Square design */
        padding: 2rem;
        margin: 2rem 0;
        text-align: center;
      }
      .otp-label {
        color: #243788;
        font-weight: 700;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 1rem;
        display: block;
      }
      .otp-code {
        font-size: 2.5rem;
        font-weight: 800;
        color: #243788;
        letter-spacing: 0.5rem;
        font-family: 'Courier New', monospace;
        background: white;
        padding: 1rem 2rem;
        border: 3px solid #243788;
        border-radius: 0; /* Square design */
        display: inline-block;
        margin: 0 0 1rem 0;
      }
      .otp-note {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .security-note {
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid #fecaca;
        border-radius: 0; /* Square design */
        color: #dc2626;
        padding: 1rem;
        margin: 2rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        text-align: center;
      }
      .features {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 0; /* Square design */
        padding: 1.5rem;
        margin: 2rem 0;
        text-align: left;
      }
      .features h3 {
        color: #243788;
        font-weight: 700;
        margin: 0 0 1rem 0;
        font-size: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: center;
      }
      .features ul {
        margin: 0;
        padding-left: 1.5rem;
        list-style: none;
      }
      .features li {
        margin: 0.75rem 0;
        font-weight: 500;
        position: relative;
        padding-left: 1.5rem;
      }
      .features li:before {
        content: "✅";
        position: absolute;
        left: 0;
      }
      .footer {
        background: #1e293b;
        color: #94a3b8;
        padding: 2rem;
        text-align: center;
        font-size: 0.875rem;
      }
      .footer strong {
        color: white;
      }
      .footer a {
        color: #b4bce1;
        text-decoration: none;
      }
    </style>
    `;
  }

  private static getEmailHeader(): string {
    return `
    <div class="header">
      <div class="logo-container">
        <div class="logo-icon-text">TB</div>
        <h1 class="logo">TinkByte</h1>
      </div>
      <p class="tagline">Where builders build the future</p>
    </div>
    `;
  }

  private static getEmailFooter(): string {
    return `
    <div class="footer">
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
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Verify Your Email</h2>
          <p class="subtitle">Hi ${displayName || 'Builder'}! Enter this code in TinkByte to complete your registration:</p>
          
          <div class="otp-section">
            <span class="otp-label">Your Verification Code</span>
            <div class="otp-code">${token}</div>
            <p class="otp-note">This code expires in 30 minutes</p>
          </div>
          
          <div class="security-note">
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
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Welcome to TinkByte, ${displayName}! 🎉</h2>
          
          <p>We're excited to have you join our community of builders, creators, and innovators who are shaping the future of technology.</p>
          
          <div class="features">
            <h3>Get Started</h3>
            <ul>
              <li>Complete your profile to connect with other builders</li>
              <li>Explore our latest articles on product innovation</li>
              <li>Join discussions and share your insights</li>
              <li>Subscribe to TinkByte Weekly for curated content</li>
              <li>Follow your favorite authors and topics</li>
            </ul>
          </div>
          
          <div class="btn-container">
            <a href="https://tinkbyte.com/profile" class="btn">Complete Your Profile</a>
          </div>
          
          <p>At TinkByte, we focus on real solutions, practical insights, and genuine innovation. No hype, just substance that helps you build better products.</p>
          
          <p>Questions? Reply to this email or reach out at <a href="mailto:hello@tinkbyte.com">hello@tinkbyte.com</a></p>
          
          <p>Happy building!<br>
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
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Welcome to TinkByte Weekly! 📬</h2>
          
          <p>Hi ${name || 'Builder'},</p>
          
          <p>Thanks for subscribing to TinkByte Weekly! You're about to join thousands of builders who get the best tech innovation insights delivered to their inbox.</p>
          
          <div class="btn-container">
            <a href="${confirmationUrl}" class="btn">Confirm Subscription</a>
          </div>
          
          <div class="features">
            <h3>What You'll Get Every Week</h3>
            <ul>
              <li>Latest articles on product building and innovation</li>
              <li>Curated tools and resources for builders</li>
              <li>Community highlights and success stories</li>
              <li>Exclusive insights from industry leaders</li>
              <li>No fluff, just actionable content</li>
            </ul>
          </div>
          
          <p>We respect your inbox. You can <a href="${unsubscribeUrl}">unsubscribe</a> at any time.</p>
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
    <div class="container">
      ${this.getEmailHeader()}
      
      <div class="content">
        <h2 class="title">Reset Your Password</h2>
        <p class="subtitle">Hi ${displayName}, we received a request to reset your TinkByte password.</p>
        
        <div class="btn-container">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </div>
        
        <div class="security-note">
          🔒 If you didn't request this reset, please ignore this email. Your password will remain unchanged.
        </div>
        
        <p>For security reasons, this link will expire in 60 minutes. If you need a new reset link, you can request one at <a href="https://tinkbyte.com/auth/forgot-password">tinkbyte.com/auth/forgot-password</a></p>
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
}}