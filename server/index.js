const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://shipping-management.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Create reusable transporter with more secure settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test the email configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email verification error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Endpoint for admin notification
app.post('/api/notify-admin', async (req, res) => {
  const { name, email } = req.body;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL, // Get admin email from env
    subject: 'New User Registration Request',
    html: `
      <h2>New User Registration Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
      <p>Please review this request in your admin dashboard.</p>
      <a href="${process.env.APP_URL}/admin/verify" style="
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
      ">Review Request</a>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Admin notification sent successfully' });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ error: 'Failed to send admin notification' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
