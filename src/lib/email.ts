// src/lib/email.ts - COMPLETE CLOUDFLARE WORKER VERSION
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
  private static apiSecret = 'cx4SDEZVb61gezXudvHm8nBsqPjrhopC'; // Your TinkByte API key

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

  // Test method
  static async testEmail(toEmail: string): Promise<EmailResult> {
    console.log('🧪 Testing email service via Worker...');
    
    const template: EmailTemplate = {
      to: toEmail,
      subject: 'TinkByte Email Test',
      html: `
        <h1>Email Test</h1>
        <p>This is a test email from TinkByte via Cloudflare Worker.</p>
        <p>If you receive this, your email service is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: `Email Test - This is a test email from TinkByte via Worker. Sent at: ${new Date().toISOString()}`
    };

    return this.sendEmail(template);
  }

  // Email verification template
  static async sendVerificationEmail(userEmail: string, token: string, confirmationUrl: string, displayName?: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Verify Your TinkByte Account',
      html: this.getVerificationEmailHTML(token, confirmationUrl, displayName),
      text: this.getVerificationEmailText(token, confirmationUrl, displayName),
    };

    return this.sendEmail(template);
  }

  // Invitation email template
  static async sendInvitationEmail(userEmail: string, inviterName: string, confirmationUrl: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `${inviterName} invited you to join TinkByte`,
      html: this.getInvitationEmailHTML(inviterName, confirmationUrl),
      text: this.getInvitationEmailText(inviterName, confirmationUrl),
    };

    return this.sendEmail(template);
  }

  // Email change confirmation
  static async sendEmailChangeConfirmation(userEmail: string, confirmationUrl: string, displayName?: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Confirm Your New Email Address - TinkByte',
      html: this.getEmailChangeConfirmationHTML(confirmationUrl, displayName),
      text: this.getEmailChangeConfirmationText(confirmationUrl, displayName),
    };

    return this.sendEmail(template);
  }

  // Password reset email
  static async sendPasswordResetEmail(userEmail: string, resetUrl: string, displayName?: string, otp?: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Reset Your TinkByte Password',
      html: this.getPasswordResetEmailHTML(resetUrl, displayName, otp),
      text: this.getPasswordResetEmailText(resetUrl, displayName, otp),
    };

    return this.sendEmail(template);
  }

  // Reauthentication email
  static async sendReauthenticationEmail(userEmail: string, reauthUrl: string, displayName?: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Confirm Your Identity - TinkByte',
      html: this.getReauthenticationEmailHTML(reauthUrl, displayName),
      text: this.getReauthenticationEmailText(reauthUrl, displayName),
    };

    return this.sendEmail(template);
  }

  // Newsletter subscription confirmation
  static async sendNewsletterSubscriptionEmail(userEmail: string, confirmationUrl: string, unsubscribeUrl: string, name?: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to TinkByte Weekly - Confirm Your Subscription',
      html: this.getNewsletterSubscriptionHTML(confirmationUrl, unsubscribeUrl, name),
      text: this.getNewsletterSubscriptionText(confirmationUrl, unsubscribeUrl, name),
    };

    return this.sendEmail(template);
  }

  // Welcome email for new users
  static async sendWelcomeEmail(userEmail: string, displayName: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to TinkByte - Where Builders Build the Future',
      html: this.getWelcomeEmailHTML(displayName),
      text: this.getWelcomeEmailText(displayName),
    };

    return this.sendEmail(template);
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

  // Common email footer
  private static getEmailFooter(): string {
    return `
    <div class="footer">
      <strong>TinkByte</strong><br>
      Where builders build the future<br>
      <a href="https://tinkbyte.com">tinkbyte.com</a>
    </div>
    `;
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
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      font-family: 'Space Grotesk', sans-serif;
      border-radius: 4px; /* Add slight rounding to match your design */
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
      transition: all 0.3s ease;
    }
    .btn-container {
      text-align: center;
      margin: 2rem 0;
    }
    .otp-section {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
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
      color: #dc2626;
      padding: 1rem;
      margin: 2rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
    }
    .warning {
      background: #fef2f2;
      border: 2px solid #dc2626;
      padding: 1rem;
      margin: 1.5rem 0;
      color: #991b1b;
    }
    .info-box {
      background: #f0f9ff;
      border: 2px solid #0ea5e9;
      padding: 1.5rem;
      margin: 2rem 0;
      text-align: center;
    }
    .invite-from {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      padding: 1.5rem;
      margin: 1.5rem 0;
      text-align: center;
    }
    .features {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
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

  // 1. Email Verification Template
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
          <p class="subtitle">Enter this code in TinkByte to complete your registration:</p>
          
          <div class="otp-section">
            <span class="otp-label">Your Verification Code</span>
            <div class="otp-code">${token}</div>
            <p class="otp-note">This code expires in 30 minutes</p>
          </div>
          
          <p>Alternatively, you can click the button below to verify automatically:</p>
          <div class="btn-container">
            <a href="${confirmationUrl}" class="btn">Verify Email Address</a>
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

  // 2. Invitation Email Template
  private static getInvitationEmailHTML(inviterName: string, confirmationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>You're Invited to TinkByte</title>
      ${this.getEmailStyles()}
    </head>
    <body>
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">You're Invited to TinkByte! 🎉</h2>
          
          <div class="invite-from">
            <strong>${inviterName}</strong> has invited you to join TinkByte
          </div>
          
          <p>Hi there,</p>
          
          <p>You've been personally invited to join TinkByte, the premier community for builders, developers, and tech innovators. We're excited to welcome you!</p>
          
          <div class="btn-container">
            <a href="${confirmationUrl}" class="btn">Accept Invitation</a>
          </div>
          
          <div class="info-box">
            <h3 style="color: #0c4a6e; margin: 0 0 1rem 0;">Join 10,000+ Builders</h3>
            <p style="margin: 0; color: #0c4a6e;">Building the future of technology, one project at a time.</p>
          </div>
          
          <p>This invitation will expire in 7 days.</p>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    </body>
    </html>
    `;
  }

  // 3. Email Change Confirmation Template
  private static getEmailChangeConfirmationHTML(confirmationUrl: string, displayName?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Confirm Your New Email Address</title>
      ${this.getEmailStyles()}
    </head>
    <body>
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Confirm Your New Email Address</h2>
          
          <p>Hi ${displayName || 'there'},</p>
          
          <p>You've requested to change your email address on TinkByte. Please confirm your new email address:</p>
          
          <div class="btn-container">
            <a href="${confirmationUrl}" class="btn">Confirm New Email</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> If you didn't request this change, please contact our support team immediately at <a href="mailto:support@tinkbyte.com" style="color: #991b1b;">support@tinkbyte.com</a>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    </body>
    </html>
    `;
  }

  // 4. Password Reset Template
  private static getPasswordResetEmailHTML(resetUrl: string, displayName?: string, otp?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your TinkByte Password</title>
      ${this.getEmailStyles()}
    </head>
    <body>
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Reset Your Password</h2>
          
          <p>Hi ${displayName || 'there'},</p>
          
          <p>We received a request to reset the password for your TinkByte account. Click the button below to create a new password:</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong>
            <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
              <li>This link expires in 1 hour</li>
              <li>Only use this if you requested it</li>
              <li>Never share this link with others</li>
            </ul>
          </div>
          
          <p>If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
          
          <p>Need help? Contact us at <a href="mailto:support@tinkbyte.com">support@tinkbyte.com</a></p>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    </body>
    </html>
    `;
  }


  // 5. Reauthentication Template
  private static getReauthenticationEmailHTML(reauthUrl: string, displayName?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Confirm Your Identity - TinkByte</title>
      ${this.getEmailStyles()}
    </head>
    <body>
      <div class="container">
        ${this.getEmailHeader()}
        
        <div class="content">
          <h2 class="title">Confirm Your Identity</h2>
          
          <p>Hi ${displayName || 'there'},</p>
          
          <p>For your security, we need to confirm your identity before proceeding with sensitive account changes.</p>
          
          <div class="btn-container">
            <a href="${reauthUrl}" class="btn">Confirm Identity</a>
          </div>
          
          <div class="info-box">
            <p style="margin: 0; color: #0c4a6e;"><strong>Why do we do this?</strong><br>
            This extra step helps protect your account from unauthorized changes.</p>
          </div>
          
          <p>This verification link will expire in 15 minutes.</p>
          
          <div class="security-note">
            🔒 If you didn't initiate this request, please contact support immediately.
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    </body>
    </html>
    `;
  }

  // 6. Newsletter Subscription Template
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
          
          <div class="info-box">
            <p style="margin: 0; color: #0c4a6e;">
              <strong>First newsletter drops this Friday!</strong><br>
              Get ready for some serious building inspiration.
            </p>
          </div>
        </div>
        
        ${this.getEmailFooter()}
      </div>
    </body>
    </html>
    `;
  }

  // 7. Welcome Email Template
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
          
          <div class="info-box">
            <h3 style="color: #0c4a6e; margin: 0 0 1rem 0;">Ready to Explore?</h3>
            <p style="margin: 0; color: #0c4a6e;">
              Check out our <a href="https://tinkbyte.com/articles" style="color: #0c4a6e;">latest articles</a> or browse by <a href="https://tinkbyte.com/categories" style="color: #0c4a6e;">categories</a> to find content that interests you.
            </p>
          </div>
          
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

  // Text versions for all templates (for better email client compatibility)
  private static getVerificationEmailText(token: string, confirmationUrl: string, displayName?: string): string {
    return `
Verify Your TinkByte Account

Hi ${displayName || 'there'}!

Enter this verification code in TinkByte: ${token}

Or click this link to verify automatically: ${confirmationUrl}

This code expires in 30 minutes.

If you didn't create this account, please ignore this email.

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getInvitationEmailText(inviterName: string, confirmationUrl: string): string {
    return `
You're Invited to TinkByte!

${inviterName} has invited you to join TinkByte, the premier community for builders, developers, and tech innovators.

Accept your invitation: ${confirmationUrl}

Join 10,000+ builders who are building the future of technology.

This invitation expires in 7 days.

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getEmailChangeConfirmationText(confirmationUrl: string, displayName?: string): string {
    return `
Confirm Your New Email Address

Hi ${displayName || 'there'},

You've requested to change your email address on TinkByte.

Confirm your new email: ${confirmationUrl}

If you didn't request this change, contact support@tinkbyte.com immediately.

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getPasswordResetEmailText(resetUrl: string, displayName?: string, otp?: string): string {
    return `
Reset Your TinkByte Password

Hi ${displayName || 'there'},

We received a request to reset the password for your TinkByte account.

${otp ? `Your Password Reset Code: ${otp}

Enter this code on the reset page along with your new password.
` : ''}

Reset your password: ${resetUrl}

Security Notice:
- This code expires in 30 minutes
- Only use if you requested it
- Never share this code

If you didn't request this, ignore this email.

Need help? Contact support@tinkbyte.com

TinkByte - Where builders build the future
https://tinkbyte.com
    `;
  }

  private static getReauthenticationEmailText(reauthUrl: string, displayName?: string): string {
    return `
Confirm Your Identity - TinkByte

Hi ${displayName || 'there'},

For security, we need to confirm your identity before proceeding.

Confirm identity: ${reauthUrl}

This link expires in 15 minutes.

If you didn't initiate this, contact support immediately.

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

First newsletter drops this Friday!

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
}