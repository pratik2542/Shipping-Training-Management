import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_1pw3job';
const TEMPLATE_ID = 'template_d7h6i4d';
const PUBLIC_KEY = 'P_vvkj76LJzEvipCY';

export const sendEmail = async ({ to, name, subject, html }) => {
  try {
    const templateParams = {
      to_email: to,
      to_name: name,
      subject: subject,
      message: html
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
};
