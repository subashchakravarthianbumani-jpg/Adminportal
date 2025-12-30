import jwt from 'jsonwebtoken'; // Use jwt library for token validation

import nodemailer from 'nodemailer'; // Use nodemailer for sending emails

import db from '../db'; // Ensure you have the correct database connection file



const SECRET_KEY = process.env.SECRET_KEY; // Replace with your secret key

// Middleware to validate JWT token
const validateToken = async (req) => {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });

    // Check if token is active
    const [rows] = await db.query('SELECT * FROM tokens WHERE Token = ? AND IsActive = 1', [token]);

    if (!rows.length) {
      throw new Error('Unauthorized');
    }

    return decoded; // Return decoded user info
  } catch (err) {
    console.error('Error during token validation:', err.message);
    throw new Error('Unauthorized');
  }
};

export async function POST(req) {
  try {
    // Validate token
    // const user = await validateToken(req);

    // sql = "SELECT * FROM registrationmaster WHERE RegitrationType = 'EXHIBITORS'";

    // Parse the request body
    const body = await req.json();
    const { to, subject, message } = body;


    if (!to || !subject || !message) {
      throw new Error('Missing required fields: to, subject, or message');
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // Your SMTP host
      port: process.env.SMTP_PORT, // SMTP port (e.g., 587)
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password
      },
    });

    // Send email
    const emailInfo = await transporter.sendMail({
      from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`, // Sender address
      to, // Receiver address
      subject, // Subject line
      message
    });


    console.log('Email sent successfully:', emailInfo.messageId);

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Email sent successfully',
        emailId: emailInfo.messageId,
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
