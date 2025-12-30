import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import 'dotenv/config'

// eslint-disable-next-line import/named
// import { db } from '../db' // Ensure to use your actual database connection method

// const SECRET_KEY = 'your-secret-key'
const SECRET_KEY = process.env.SECRET_KEY // Use your actual secret key
const ACCESS_TOKEN_EXPIRY = '7d' // 7 days expiry for the token

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export async function POST(req) {
  const { userName, password } = await req.json() // Get the request body (for POST requests)

  // Check if userName and password are provided
  if (!userName || !password) {
    return new Response(
      JSON.stringify({
        status: false,
        message: "Missing 'userName' or 'password'"
      }),
      { status: 400 }
    )
  }

  try {
    // Check if user exists in the database
    const [results] = await db.query('SELECT * FROM usermaster WHERE UserName = ? AND IsActive = 1', [userName])

    // return;

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ status: false, message: 'Invalid username or password' }), { status: 401 })
    }

    const user = results[0]
    const storedHash = user.Pasword

    if (!storedHash) {
      return new Response(JSON.stringify({ status: false, message: 'Error: Password hash not found in database' }), {
        status: 500
      })
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash)

    if (!isMatch) {
      return new Response(JSON.stringify({ status: false, message: 'Invalid username or password' }), { status: 401 })
    }

    // Generate an access token
    const accessToken = jwt.sign({ id: user.Id, userName: user.UserName }, SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    })

    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity

    // Insert the token into the database
    await db.query(
      `INSERT INTO tokens (UserId, Token, ValidUntil, IsActive, CreatedBy, CreatedByUserName, CreatedDate)
       VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP())`,
      [user.Id, accessToken, validUntil, user.Id, user.UserName]
    )

    // Prepare user info
    const userInfo = {
      id: user.Id,
      userName: user.UserName,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      phone: user.Phone
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Login successful',
        accessToken,
        userInfo
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error during login:', err)

    return new Response(JSON.stringify({ status: false, message: 'Internal Server Error' }), { status: 500 })
  }
}
