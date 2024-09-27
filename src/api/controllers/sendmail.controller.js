import nodemailer from 'nodemailer'

export const sendmailHandler = async (req, res) => {
    const { firstName, lastName, email, subject, message } = req.body;

  // Set up the nodemailer transport using SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ? process.env.MAIL_HOST : "",
    port: process.env.MAIL_PORT ? process.env.MAIL_PORT : "",
    auth: {
      user: process.env.MAIL_USER ? process.env.MAIL_USER : "", // Replace with your Gmail email
      pass: process.env.MAIL_PASS ? process.env.MAIL_PASS : "",  // Replace with your Gmail app password
    },
  });

  // Email content and recipient details
  const mailOptions = {
    from: email, // Sender's email
    to: process.env.MAIL_TARGET ? process.env.MAIL_TARGET : "", // Replace with your email where the contact form emails should be sent
    subject: subject || 'New Contact Form Submission',
    text: `You received a new message from ${firstName} ${lastName} (${email}):\n\n${message}`,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
}