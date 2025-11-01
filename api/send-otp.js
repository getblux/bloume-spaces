import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otpCode } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: 'elisha@bloume.shop',
    subject: 'Your Bloume OTP Code',
    text: `Your OTP code is: ${otpCode}`,
    html: `<strong>Your OTP code is: ${otpCode}</strong>`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}