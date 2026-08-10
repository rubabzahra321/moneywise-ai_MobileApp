const Resend = require('resend');

class EmailService {
  constructor() {
    // Initialize Resend with API key
    this.resend = new Resend.Resend(process.env.RESEND_API_KEY);
    this.from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  }

  async sendPasswordReset(email, resetToken) {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === '') {
        console.log('⚠️ RESEND_API_KEY not set in .env — password reset email not sent.');
        console.log(`📧 Password reset token for ${email}: ${resetToken}`);
        return { success: true, mock: true };
      }

      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
      
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [email],
        subject: 'Reset Your MoneyWise AI Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; }
              .logo { font-size: 24px; font-weight: bold; color: #6C63FF; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #6C63FF; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer { text-align: center; padding: 20px 0; color: #888; font-size: 12px; }
              .warning { background-color: #FFF3CD; padding: 12px; border-radius: 8px; border-left: 4px solid #FFC107; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">💰 MoneyWise AI</div>
                <h2>Password Reset Request</h2>
              </div>
              
              <p>Hello,</p>
              <p>We received a request to reset your password for your MoneyWise AI account.</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #F8F9FE; padding: 12px; border-radius: 8px;">${resetLink}</p>
              
              <div class="warning">
                <strong>⚠️ This link will expire in 1 hour.</strong>
              </div>
              
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              
              <hr>
              <div class="footer">
                <p>MoneyWise AI - Smart Finance Assistant</p>
                <p>&copy; 2024 MoneyWise AI. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error };
      }

      console.log(`✅ Password reset email sent to ${email}`);
      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcome(email, name) {
    try {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === '') {
        console.log(`📧 Welcome email mock for ${email}: Welcome ${name}!`);
        return { success: true, mock: true };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [email],
        subject: 'Welcome to MoneyWise AI! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; }
              .logo { font-size: 24px; font-weight: bold; color: #6C63FF; }
              .features { display: flex; flex-wrap: wrap; justify-content: space-around; margin: 20px 0; }
              .feature { flex: 1; min-width: 150px; padding: 12px; text-align: center; }
              .feature-icon { font-size: 32px; }
              .footer { text-align: center; padding: 20px 0; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">💰 MoneyWise AI</div>
                <h2>Welcome ${name}! 🎉</h2>
              </div>
              
              <p>Thank you for joining MoneyWise AI! We're excited to help you take control of your finances.</p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h4>Smart Tracking</h4>
                  <p>Auto-categorize expenses</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <h4>AI Insights</h4>
                  <p>Personalized recommendations</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🎯</div>
                  <h4>Budget Goals</h4>
                  <p>Track and achieve</p>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}" style="display: inline-block; padding: 12px 24px; background-color: #6C63FF; color: white; text-decoration: none; border-radius: 8px;">
                  Get Started
                </a>
              </div>
              
              <hr>
              <div class="footer">
                <p>MoneyWise AI - Smart Finance Assistant</p>
                <p>&copy; 2024 MoneyWise AI. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error };
      }

      console.log(`✅ Welcome email sent to ${email}`);
      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();