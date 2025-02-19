const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Add immediate check for environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
  console.error('Missing required environment variables!');
  console.log('Current environment:', {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS?.slice(0, 4) + '...',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL
  });
  process.exit(1);
}

const app = express();

// Update CORS configuration for both local and production
app.use(cors({
  origin: ['http://localhost:3000', 'https://shipping-management.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is running',
    env: {
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'Set' : 'Not set'
    }
  });
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/notify-admin', async (req, res) => {
  console.log('Received notification request:', req.body);
  const { name, email } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New User Registration Request',
      html: `
        <h2>New User Registration Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Please review this request in your admin dashboard.</p>
        <a href="http://shipping-management.vercel.app" style="
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Email configuration:', {
    USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
    PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
    ADMIN: process.env.ADMIN_EMAIL ? 'Set' : 'Not set'
  });
});
