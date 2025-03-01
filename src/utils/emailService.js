// Fix EmailJS initialization and error handling

import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
// This should be done once when the app starts
emailjs.init("P_vvkj76LJzEvipCY");

const SERVICE_ID = 'service_1pw3job';
const TEMPLATE_ID = 'template_d7h6i4d';

// Wrapper function to ensure emailjs is initialized before sending
const safeEmailjsSend = async (serviceId, templateId, templateParams) => {
  try {
    if (!emailjs.send) {
      console.error('EmailJS send function not available');
      throw new Error('Email service not properly initialized');
    }
    return await emailjs.send(serviceId, templateId, templateParams);
  } catch (error) {
    console.error('Error in emailjs.send:', error);
    throw error;
  }
};

export const sendEmail = async ({ to, name, subject, html }) => {
  try {
    const templateParams = {
      to_email: to,
      to_name: name,
      subject: subject,
      message: html
    };

    console.log('Sending email with params:', templateParams);
    const response = await safeEmailjsSend(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Error sending email: ${error.message}`);
  }
};

export const sendApprovalEmail = async (userData, tempPassword) => {
  try {
    const userName = userData.name || userData.email.split('@')[0];
    
    // When using EmailJS templates, just pass the template variables
    const templateParams = {
      to_email: userData.email,
      to_name: userName,
      message: tempPassword,
      subject: "Your Account Has Been Approved"
    };

    console.log('Sending approval email to:', userData.email);
    const response = await safeEmailjsSend(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log('Approval email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send approval email:', error);
    // Show the error but continue with the approval process
    alert(`Note: Email could not be sent to ${userData.email}. Please inform the user manually.`);
    // Return a fake success to allow the approval process to continue
    return { status: "Email failed but continuing with approval" };
  }
};