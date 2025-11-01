import sgMail from '@sendgrid/mail';

// Use Vite environment variable
sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

export const sendOTPEmail = async (email, otpCode) => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otpCode }),
      });
  
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };