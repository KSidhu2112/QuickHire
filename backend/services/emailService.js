const nodemailer = require('nodemailer');
const EmailNotificationHistory = require('../models/EmailNotificationHistory');

// ─── SMTP Transporter (lazy-init) ───────────────────────────────────
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };
    console.log('📧 Creating SMTP transporter:', { host: smtpConfig.host, port: smtpConfig.port, user: smtpConfig.auth.user });
    _transporter = nodemailer.createTransport(smtpConfig);
  }
  return _transporter;
}

// ─── Send via Resend API (preferred) ────────────────────────────
async function sendViaResendAPI({ to, toName, subject, htmlContent }) {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev'; // Resend sandbox email for testing
  const senderName = process.env.SENDER_NAME || 'QuickHire Team';

  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const payload = {
    from: `${senderName} <${senderEmail}>`,
    to: [to],
    subject,
    html: htmlContent,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API ${response.status}: ${errorBody}`);
  }

  return await response.json();
}

// ─── Send via Nodemailer SMTP (fallback) ────────────────────────────
async function sendViaSMTP({ to, toName, subject, htmlContent }) {
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@quickhire.com';
  const senderName = process.env.SENDER_NAME || 'QuickHire Team';

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html: htmlContent,
  });

  return { messageId: info.messageId };
}

// ─── Smart send: try Resend API first, fall back to SMTP ────────────
async function sendEmail({ to, toName, subject, htmlContent }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    console.log(`📧 [Resend API] → ${to}`);
    const result = await sendViaResendAPI({ to, toName, subject, htmlContent });
    console.log(`📧 ✅ [Resend API] Success → ${to} (ID: ${result.id})`);
    return result;
  }

  // Otherwise use SMTP
  console.log(`📧 [SMTP] → ${to}`);
  const result = await sendViaSMTP({ to, toName, subject, htmlContent });
  console.log(`📧 ✅ [SMTP] Success → ${to} (messageId: ${result.messageId})`);
  return result;
}

// ─── HTML Template ──────────────────────────────────────────────────
function buildJobAlertHtml(emp, job, frontendUrl) {
  const locationStr = job.location
    ? `${job.location.city || ''} ${job.location.state || ''}`.trim()
    : 'N/A';
  const salaryStr = job.salaryMin
    ? `₹${job.salaryMin} - ₹${job.salaryMax || job.salaryMin}`
    : 'N/A';

  return `
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
        .job-details {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px dashed #2563eb;
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
        }
        .job-title {
          font-size: 22px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0 0 15px 0;
          text-align: center;
        }
        .detail-row {
          display: flex;
          margin-bottom: 10px;
          font-size: 15px;
        }
        .detail-label {
          font-weight: bold;
          color: #1e40af;
          width: 100px;
        }
        .detail-value {
          color: #334155;
        }
        .message {
          color: #64748b;
          line-height: 1.8;
          font-size: 15px;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 30px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 15px 40px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 QuickHire</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">New Job Opportunity</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1e3a8a; margin-top: 0;">Hello ${emp.name}! 👋</h2>
          
          <p class="message">
            Great news! A new job has just been posted on QuickHire. Check out the details below:
          </p>
          
          <div class="job-details">
            <div class="job-title">${job.title}</div>
            <div style="max-width: 400px; margin: 0 auto;">
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${job.category || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${locationStr}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Salary:</span>
                <span class="detail-value">${salaryStr}</span>
              </div>
            </div>
          </div>
          
          <div class="button-container">
            <a href="${frontendUrl}/jobs/${job._id}" class="button">View & Apply Now</a>
          </div>
          
          <p class="message" style="margin-top: 30px;">
            Don't miss out on this opportunity. Apply early to increase your chances of getting hired!
          </p>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} QuickHire. All rights reserved.</p>
          <p style="margin: 0;">You are receiving this because you are registered as an employee on QuickHire.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Main: Send job alert emails to all employees ───────────────────
/**
 * Sends job alert emails to all employees using Promise.all.
 * Automatically chooses Resend HTTP API or SMTP based on the API key.
 * Does NOT block job creation — called fire-and-forget from the controller or matching service.
 */
exports.sendJobAlertEmails = async (employees, job) => {
  try {
    const JobNotification = require('../models/JobNotification');
    console.log(`\n📧 ========== JOB ALERT EMAIL SERVICE ==========`);
    console.log(`📧 Job: "${job.title}" (ID: ${job._id})`);
    console.log(`📧 Total employees to process: ${employees.length}`);

    const apiKey = process.env.RESEND_API_KEY;
    const method = apiKey ? 'Resend HTTP API' : 'SMTP';
    console.log(`📧 Send method: ${method}`);

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

    // Check which employees have already been notified for this job (prevent duplicates fully)
    const existingNotificationsSet = new Set();
    const existingNotificationsLogs = await EmailNotificationHistory.find({
      jobId: job._id,
      recipientEmail: { $in: employees.map(emp => emp.email) },
    });
    existingNotificationsLogs.forEach(n => existingNotificationsSet.add(n.recipientEmail));

    const employeesToNotify = employees.filter(emp => !existingNotificationsSet.has(emp.email));

    if (employeesToNotify.length === 0) {
      console.log('📧 All employees already notified for this job. Skipping.');
      console.log(`📧 ============================================\n`);
      return;
    }

    console.log(`📧 Sending emails to ${employeesToNotify.length} new employees...`);

    // Build all email promises — send in parallel with Promise.all
    const emailPromises = employeesToNotify.map(async (emp) => {
      try {
        const htmlContent = buildJobAlertHtml(emp, job, frontendUrl);

        await sendEmail({
          to: emp.email,
          toName: emp.name,
          subject: `🚀 New Job Opportunity: ${job.title}`,
          htmlContent,
        });

        // Record in notification history to prevent duplicates
        await EmailNotificationHistory.create({
          recipientEmail: emp.email,
          jobId: job._id,
        });

        // Track in JobNotification model for Analytics
        await JobNotification.findOneAndUpdate(
          { jobId: job._id, employeeId: emp._id },
          { status: 'sent', sentAt: new Date() },
          { new: true, runValidators: true }
        );

        return { email: emp.email, status: 'success' };
      } catch (err) {
        console.error(`📧 ❌ FAILED → ${emp.email}: ${err.message}`);

        await JobNotification.findOneAndUpdate(
          { jobId: job._id, employeeId: emp._id },
          { status: 'failed', errorMessage: err.message },
          { new: true, runValidators: true }
        );

        return { email: emp.email, status: 'failed', error: err.message };
      }
    });

    // Send all emails in parallel (async, non-blocking)
    const results = await Promise.all(emailPromises);

    // Summary
    const succeeded = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`\n📧 ========== EMAIL RESULTS ==========`);
    console.log(`📧 ✅ Sent: ${succeeded} | ❌ Failed: ${failed} | Total: ${results.length}`);
    if (failed > 0) {
      const failedEmails = results.filter(r => r.status === 'failed');
      console.log(`📧 Failed recipients:`, failedEmails.map(r => `${r.email} (${r.error})`));
    }
    console.log(`📧 ====================================\n`);
  } catch (error) {
    console.error(`📧 ❌ CRITICAL ERROR in sendJobAlertEmails:`, error.message);
    console.error(error.stack);
  }
};
