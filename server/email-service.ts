import { AnalysisResult, User } from "../drizzle/schema";

/**
 * Email Service for Teeth Damage Analysis System
 * 
 * Handles sending email notifications for:
 * - Analysis completion
 * - Critical findings
 * - System alerts
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate email template for analysis completion
 */
export function generateAnalysisCompleteEmail(
  user: User,
  analysisUrl: string,
  severity: string
): EmailTemplate {
  const severityColorMap: Record<string, string> = {
    low: "#10b981",
    moderate: "#f59e0b",
    high: "#ef4444",
  };
  const severityColor = severityColorMap[severity] || "#10b981";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #c4b5fd 0%, #fbcfe8 50%, #a7f3d0 100%); padding: 30px; text-align: center; border-radius: 8px; }
          .header h1 { color: #4a3f6b; margin: 0; }
          .content { padding: 30px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
          .severity-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${severityColor}; }
          .cta-button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #c4b5fd 0%, #fbcfe8 100%); color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .disclaimer { background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Analysis Complete!</h1>
            <p>Your dental image has been analyzed</p>
          </div>
          
          <div class="content">
            <p>Hi ${user.name || "there"},</p>
            
            <p>Your teeth damage analysis has been completed successfully. Here's a summary of your results:</p>
            
            <p>
              <strong>Overall Severity:</strong><br>
              <span class="severity-badge">${severity.toUpperCase()}</span>
            </p>
            
            <p>
              <a href="${analysisUrl}" class="cta-button">View Full Analysis Results</a>
            </p>
            
            <p>The detailed analysis includes:</p>
            <ul>
              <li>Detected dental issues with confidence scores</li>
              <li>Tooth-specific locations and severity levels</li>
              <li>Personalized care recommendations</li>
            </ul>
            
            <div class="disclaimer">
              <strong>Important Disclaimer:</strong> This analysis is not a medical diagnosis and should not replace a licensed dentist. 
              Please consult with a dental professional for proper diagnosis and treatment recommendations.
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Teeth Damage Analysis System. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Analysis Complete!

Hi ${user.name || "there"},

Your teeth damage analysis has been completed successfully.

Overall Severity: ${severity.toUpperCase()}

View your full analysis results here: ${analysisUrl}

The detailed analysis includes:
- Detected dental issues with confidence scores
- Tooth-specific locations and severity levels
- Personalized care recommendations

IMPORTANT DISCLAIMER: This analysis is not a medical diagnosis and should not replace a licensed dentist. 
Please consult with a dental professional for proper diagnosis and treatment recommendations.

---
© 2024 Teeth Damage Analysis System. All rights reserved.
This is an automated message. Please do not reply to this email.
  `;

  return {
    subject: `Your Dental Analysis Results - ${severity.toUpperCase()} Severity`,
    html,
    text,
  };
}

/**
 * Generate email template for critical findings alert (admin)
 */
export function generateCriticalFindingEmail(
  adminEmail: string,
  studentName: string,
  severity: string,
  issueCount: number,
  adminUrl: string
): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px; }
          .alert h2 { color: #991b1b; margin-top: 0; }
          .cta-button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>⚠️ Critical Finding Alert</h2>
            <p>A student submission has been flagged for review due to critical findings.</p>
            
            <p>
              <strong>Student:</strong> ${studentName}<br>
              <strong>Severity Level:</strong> ${severity.toUpperCase()}<br>
              <strong>Issues Detected:</strong> ${issueCount}
            </p>
            
            <p>
              <a href="${adminUrl}" class="cta-button">Review in Admin Dashboard</a>
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Teeth Damage Analysis System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
CRITICAL FINDING ALERT

A student submission has been flagged for review due to critical findings.

Student: ${studentName}
Severity Level: ${severity.toUpperCase()}
Issues Detected: ${issueCount}

Review in Admin Dashboard: ${adminUrl}

---
© 2024 Teeth Damage Analysis System. All rights reserved.
  `;

  return {
    subject: `[ALERT] Critical Finding - ${studentName}`,
    html,
    text,
  };
}

/**
 * Send email via Manus built-in notification API
 * 
 * In production, this would integrate with SendGrid, AWS SES, or similar
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string | undefined; error?: string | undefined }> {
  try {
    // TODO: Integrate with actual email service
    // For now, log the email that would be sent
    console.log(`[EMAIL] Sending to ${to}`);
    console.log(`[EMAIL] Subject: ${template.subject}`);
    console.log(`[EMAIL] Body preview: ${template.text.substring(0, 100)}...`);

    // Simulate successful send
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(
  recipients: Array<{ email: string; template: EmailTemplate }>
): Promise<Array<{ email: string; success: boolean; error?: string }>> {
  return Promise.all(
    recipients.map(async ({ email, template }) => {
      const result = await sendEmail(email, template);
      return {
        email,
        success: result.success,
        error: result.error,
      };
    })
  );
}
