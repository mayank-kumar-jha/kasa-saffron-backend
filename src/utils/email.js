import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY || 're_fallback_key');

// Note: To send emails in production, your sender address must be a verified domain in Resend
// e.g., 'Kasa Saffron <info@kasasaffron.com>' if kasasaffron.com is verified on Resend.
// For testing without a verified domain, Resend allows sending from 'onboarding@resend.dev' to your registered email only.
const SENDER_EMAIL = process.env.NODE_ENV === 'production' 
  ? 'Kasa Saffron <info@kasasaffron.com>' 
  : 'Kasa Saffron <onboarding@resend.dev>'; 

export const sendWelcomeEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Welcome to the Kasa Saffron Family!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 30px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">WELCOME TO KASA SAFFRON</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #fdfaf5; text-align: center;">
            <p style="font-size: 18px; color: #BD561A; font-weight: bold; margin-bottom: 20px;">Dear ${name || 'Friend'},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for joining us! We are thrilled to welcome you to the Kasa Saffron family.</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Our promise is to bring you the finest quality saffron and an exquisite, authentic experience straight to your kitchen.</p>
            
            <div style="margin-top: 30px;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" style="background-color: #BD561A; color: #fff; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; letter-spacing: 1px;">EXPLORE OUR COLLECTION</a>
            </div>

            <hr style="border: 0; height: 1px; background-color: #E6C587; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #555; margin: 0;">Warmest Regards,</p>
            <p style="font-size: 16px; color: #720303; font-weight: bold; font-family: 'Times New Roman', serif; margin-top: 5px;">The Kasa Saffron Team</p>
          </div>
          <div style="background-color: #f4e4cf; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Kasa Saffron. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (Welcome Email):', error);
      return false;
    }
    
    console.log('Welcome email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error setting up welcome email:', error);
    return false;
  }
};

export const sendB2BEnquiryEmail = async (leadData, toEmail = 'info@kasasaffron.com') => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: toEmail,
      replyTo: leadData.email,
      subject: `New B2B Enquiry: ${leadData.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 20px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">NEW B2B ENQUIRY</h2>
          </div>
          <div style="padding: 30px; background-color: #fdfaf5;">
            <p style="font-size: 16px; margin-bottom: 20px;">You have received a new B2B partnership enquiry. Here are the details:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A; width: 40%;">Company Name:</td>
                <td style="padding: 12px 0; color: #555;">${leadData.companyName || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A;">Contact Person:</td>
                <td style="padding: 12px 0; color: #555;">${leadData.contactPerson || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A;">Email Address:</td>
                <td style="padding: 12px 0; color: #555;"><a href="mailto:${leadData.email}" style="color: #BD561A; text-decoration: none;">${leadData.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A;">Phone Number:</td>
                <td style="padding: 12px 0; color: #555;">${leadData.phone || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A;">Business Type:</td>
                <td style="padding: 12px 0; color: #555;">${leadData.businessType || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px 0; font-weight: bold; color: #BD561A;">Estimated Volume:</td>
                <td style="padding: 12px 0; color: #555;">${leadData.estimatedVolume || 'N/A'}</td>
              </tr>
            </table>

            <div style="background-color: #fff; border-left: 4px solid #BD561A; padding: 15px; margin-top: 25px;">
              <h4 style="margin: 0 0 10px 0; color: #BD561A;">Additional Notes:</h4>
              <p style="margin: 0; color: #555; white-space: pre-wrap; font-style: italic;">${leadData.notes || 'No notes provided.'}</p>
            </div>

            <div style="text-align: center; margin-top: 35px;">
              <a href="mailto:${leadData.email}" style="background-color: #BD561A; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">REPLY TO CUSTOMER</a>
            </div>
          </div>
          <div style="background-color: #f4e4cf; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">This email was automatically generated by the Kasa Saffron System.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (B2B Enquiry):', error);
      return false;
    }
    
    console.log('B2B enquiry email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error setting up B2B email:', error);
    return false;
  }
};

export const sendInquiryReceivedEmail = async (email, name) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Inquiry Received - Kasa Saffron',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 30px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">INQUIRY RECEIVED</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #fdfaf5; text-align: center;">
            <p style="font-size: 18px; color: #BD561A; font-weight: bold; margin-bottom: 20px;">Dear ${name || 'Valued Customer'},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for reaching out to us.</p>
            <p style="font-size: 16px; margin-bottom: 30px;">This email is to confirm that we have successfully received your inquiry. One of our representatives will review your request and get back to you <strong>within 48 hours</strong>.</p>
            
            <hr style="border: 0; height: 1px; background-color: #E6C587; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #555; margin: 0;">Warmest Regards,</p>
            <p style="font-size: 16px; color: #720303; font-weight: bold; font-family: 'Times New Roman', serif; margin-top: 5px;">The Kasa Saffron Team</p>
          </div>
          <div style="background-color: #f4e4cf; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Kasa Saffron. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (Inquiry Received):', error);
      return false;
    }
    
    console.log('Inquiry received email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error setting up inquiry received email:', error);
    return false;
  }
};

export const sendCustomEmail = async (toEmail, subject, htmlContent, attachments = []) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    });

    if (error) {
      console.error(`Resend API Error (Custom Email to ${toEmail}):`, error);
      return { success: false, error: error.message };
    }
    
    console.log('Custom email sent via Resend to %s: %s', toEmail, data?.id);
    return { success: true, queued: false };
  } catch (error) {
    console.error(`Error setting up custom email to ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetOtpEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 30px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">PASSWORD RESET</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #fdfaf5; text-align: center;">
            <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password. Use the verification code below to proceed.</p>
            
            <div style="margin: 40px 0;">
              <span style="background-color: #BD561A; color: #fff; padding: 14px 40px; border-radius: 4px; font-weight: bold; font-size: 24px; letter-spacing: 5px;">${otp}</span>
            </div>

            <p style="font-size: 14px; color: #555; margin-bottom: 30px;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
            
            <hr style="border: 0; height: 1px; background-color: #E6C587; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #555; margin: 0;">Warmest Regards,</p>
            <p style="font-size: 16px; color: #720303; font-weight: bold; font-family: 'Times New Roman', serif; margin-top: 5px;">The Kasa Saffron Team</p>
          </div>
          <div style="background-color: #f4e4cf; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Kasa Saffron. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (Password Reset):', error);
      throw new Error('Failed to send password reset email');
    }
    
    console.log('Password reset email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendRegistrationOtpEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Verify your Kasa Saffron Account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 30px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">WELCOME TO KASA SAFFRON</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #fdfaf5; text-align: center;">
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for registering! Please use the verification code below to activate your account.</p>
            
            <div style="margin: 40px 0;">
              <span style="background-color: #BD561A; color: #fff; padding: 14px 40px; border-radius: 4px; font-weight: bold; font-size: 24px; letter-spacing: 5px;">${otp}</span>
            </div>

            <p style="font-size: 14px; color: #555; margin-bottom: 30px;">This code will expire in 15 minutes. If you did not create an account with us, please ignore this email.</p>
            
            <hr style="border: 0; height: 1px; background-color: #E6C587; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #555; margin: 0;">Warmest Regards,</p>
            <p style="font-size: 16px; color: #720303; font-weight: bold; font-family: 'Times New Roman', serif; margin-top: 5px;">The Kasa Saffron Team</p>
          </div>
          <div style="background-color: #f4e4cf; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Kasa Saffron. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (Registration OTP):', error);
      throw new Error('Failed to send registration email');
    }
    
    console.log('Registration OTP email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error sending registration OTP email:', error);
    throw error;
  }
};

export const sendPaymentConfirmationEmail = async (email, name, orderId, totalAmount) => {
  try {
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Payment Confirmation - Kasa Saffron',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #E6C587; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2c0107; padding: 30px; text-align: center;">
            <h2 style="color: #E6C587; margin: 0; font-family: 'Times New Roman', serif; letter-spacing: 2px;">PAYMENT SUCCESSFUL</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #fdfaf5; text-align: center;">
            <p style="font-size: 18px; color: #BD561A; font-weight: bold; margin-bottom: 20px;">Dear ${name || 'Customer'},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">We have successfully received your payment of <b>€${totalAmount}</b> for Order #${orderId.substring(0,8).toUpperCase()}.</p>
            <p style="font-size: 16px; margin-bottom: 30px;">Your order is now being processed. We will notify you once it has been shipped or is ready for pickup.</p>
            
            <p style="font-size: 14px; color: #666; margin-top: 40px;">Thank you for choosing Kasa Saffron.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error (Payment Confirmation):', error);
      return false;
    }
    
    console.log('Payment confirmation email sent via Resend:', data);
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
};
