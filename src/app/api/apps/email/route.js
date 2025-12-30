import path from 'path';

import jwt from 'jsonwebtoken';

import nodemailer from 'nodemailer';

import db from '../db';

const SECRET_KEY = process.env.SECRET_KEY;
const logoPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'public', 'images', 'logos', 'logo.png');

// Middleware to validate JWT token
const validateToken = async (req) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });

    const [rows] = await db.query('SELECT * FROM tokens WHERE Token = ? AND IsActive = 1', [token]);

    if (!rows.length) {
      throw new Error('Unauthorized');
    }

    return decoded;
  } catch (err) {
    console.error('Error during token validation:', err.message);
    throw new Error('Unauthorized');
  }
};

export async function POST(req) {
  try {
    const sql = "SELECT FirstName, LastName, RegitrationNo, RegitrationType, CreatedDate, Email FROM registrationmaster WHERE RegitrationType = 'EXHIBITORS'";
    const [rows] = await db.query(sql);

    const body = await req.json();
    const { to, subject, message } = body;

    if (!subject || !message) {
      throw new Error('Missing required fields: subject or message');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let recipients = [];

    if (to) {
      recipients = to.split(',').map(email => email.trim());
    } else {
      recipients = rows.map(dataObject => dataObject.Email).filter(email => email);
    }

    const successEmails = [];
    const failedEmails = [];

    const emailPromises = recipients.map(async (recipientEmail) => {
      const dataObject = rows.find(row => row.Email === recipientEmail);

      const htmlContent = `
        <p>Dear ${dataObject ? dataObject.FirstName : 'Recipient'},</p>
        <p>Your Registration details are mentioned below:</p>
        <table>
          <tr><td>Registration Number</td><td>:<b> ${dataObject ? dataObject.RegitrationNo : 'N/A'}</b></td></tr>
          <tr><td>Registration Type</td><td>:<b> ${dataObject ? dataObject.RegitrationType : 'N/A'}</b></td></tr>
          <tr><td>Registration Date and Time</td><td>:<b> ${dataObject ? dataObject.CreatedDate : 'N/A'}</b></td></tr>
          <tr><td>Registration Status</td><td>:<b> Active</b></td></tr>
        </table>
        <p><b>${message}</b></p>
        <p>If you have any questions, please reach out to TN-BEAT EXPO management.</p>
        <p>Thanks,</p>
        <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
        <img src="cid:logo" alt="Logo" style="max-width: 100%; height: auto; max-width: 377px;" />
      `;

      try {
        await transporter.sendMail({
          from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject,
          html: htmlContent,
          attachments: [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'logo',
            },
          ],
        });
        successEmails.push(recipientEmail);
      } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error.message);
        failedEmails.push(recipientEmail);
      }
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Emails processed.',
        successEmails,
        failedEmails,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in Email API:', err.message);

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error',
      }),
      { status: err.status || 500 }
    );
  }
}
