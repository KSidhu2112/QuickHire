const nodemailer = require('nodemailer');

// Create transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'registration') => {
  try {
    const subject = purpose === 'registration'
      ? '🔐 QuickHire - Email Verification OTP'
      : '🔐 QuickHire - Password Reset OTP';

    const title = purpose === 'registration'
      ? 'Verify Your Email Address'
      : 'Reset Your Password';

    const message1 = purpose === 'registration'
      ? 'Hello! Thank you for registering with QuickHire. To complete your registration, please use the OTP code below:'
      : 'Hello! We received a request to reset your password. Use the OTP code below to verify your identity:';

    const message2 = purpose === 'registration'
      ? 'Enter this code on the verification page to activate your account and start your job search journey!'
      : 'Enter this code to set a new password. If you didn\'t request a password reset, you can safely ignore this email.';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f0f9ff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
          }
          .content {
            padding: 40px 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px dashed #2563eb;
            border-radius: 10px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .message {
            color: #64748b;
            line-height: 1.8;
            font-size: 15px;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            color: #92400e;
          }
          .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            color: #64748b;
            font-size: 13px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 QuickHire</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">AI-Powered Job Platform</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1e3a8a; margin-top: 0;">${title}</h2>
            
            <p class="message">
              ${message1}
            </p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Your OTP Code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #64748b; font-size: 13px;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
            </div>
            
            <p class="message">
              ${message2}
            </p>
            
            <div class="warning">
              ⚠️ <strong>Security Note:</strong> Never share this OTP with anyone. 
              QuickHire will never ask for your OTP via phone or email.
            </div>
            
            <p class="message" style="margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} QuickHire. All rights reserved.</p>
            <p style="margin: 0;">Questions? Contact us at <a href="mailto:${process.env.SENDER_EMAIL}" style="color: #2563eb;">${process.env.SENDER_EMAIL}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    console.log('📧 Attempting to send email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('📧 SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SENDER_EMAIL
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f0f9ff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center; color: white; }
          .content { padding: 40px 30px; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 Welcome to QuickHire!</h1>
          </div>
          <div class="content">
            <h2 style="color: #1e3a8a;">Hello ${name}! 👋</h2>
            <p style="color: #64748b; line-height: 1.8;">
              Your email has been successfully verified! You're now part of the QuickHire community.
            </p>
            <p style="color: #64748b; line-height: 1.8;">
              Start exploring thousands of job opportunities tailored just for you with our AI-powered matching system.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Start Job Hunting 🚀
              </a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} QuickHire. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: '🎉 Welcome to QuickHire - Let\'s Get Started!',
      html: htmlContent,
    });

    console.log('✅ Welcome email sent successfully');
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};
