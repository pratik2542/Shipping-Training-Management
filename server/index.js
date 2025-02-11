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

// Update CORS to be more permissive in development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Create transporter with debug logging
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug logs
  logger: true  // Enable logger
});

app.post('/api/notify-admin', async (req, res) => {
  console.log('Received notification request:', req.body);
  const { name, email } = req.body;

  try {
    // Verify transporter configuration
    await transporter.verify();
    console.log('Transporter verified successfully');

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

    console.log('Sending email with options:', mailOptions);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    
    res.status(200).json({ 
      message: 'Admin notification sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to send admin notification',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment variables loaded:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'Set' : 'Not set'
  });
});
