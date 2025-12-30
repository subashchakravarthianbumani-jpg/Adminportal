// Next Imports
import { NextResponse } from 'next/server'

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import 'dotenv/config'

// Mock data for demo purpose
// import { users } from './users'

// Database connection setup
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})

const SECRET_KEY = process.env.SECRET_KEY // Use your actual secret key
const ACCESS_TOKEN_EXPIRY = '7d'

// export async function POST(req) {
//   // Vars
//   const { email, password } = await req.json()
//   const user = users.find(u => u.email === email && u.password === password)
//   let response = null

//   if (user) {
//     const { password: _, ...filteredUserData } = user

//     response = {
//       ...filteredUserData
//     }

//     return NextResponse.json(response)
//   } else {
//     // We return 401 status code and error message if user is not found
//     return NextResponse.json(
//       {
//         // We create object here to separate each error message for each field in case of multiple errors
//         message: ['Email or Password is invalid']
//       },
//       {
//         status: 401,
//         statusText: 'Unauthorized Access'
//       }
//     )
//   }
// }
export async function POST(req) {
  const { email, password } = await req.json() // Extract email and password from the request body

  let response = null

  try {
    // Query the database to find a user by email
    const [rows] = await db.execute('SELECT * FROM usermaster WHERE UserName = ?', [email])

    if (rows.length > 0) {
      const user = rows[0] // Get the user data from the first row
      let accessToken = ''

      // Compare the provided password with the hashed password
      const isMatch = await bcrypt.compare(password, user.Pasword)

      if (isMatch) {
        // If the passwords match, return user data excluding the password
        const { Password: _, ...filteredUserData } = user

        // Generate an access token
        const accessToken = jwt.sign({ id: user.Id, userName: user.UserName }, SECRET_KEY, {
          expiresIn: ACCESS_TOKEN_EXPIRY
        })

        const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity

        response = {
          // ...filteredUserData,
          accessToken: accessToken,
          UserInfo: {
            id: user.Id,
            userName: user.UserName,
            firstName: user.FirstName,
            lastName: user.LastName,
            email: user.Email,
            phone: user.Phone
          }
        }

        // Insert the token into the database
        await db.query(
          `INSERT INTO tokens (UserId, Token, ValidUntil, IsActive, CreatedBy, CreatedByUserName, CreatedDate)
   VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP())`,
          [response.Id, accessToken, validUntil, response.Id, response.UserName]
        )

        return NextResponse.json(response)

        // console.log(response);
      } else {
        // If the password doesn't match, return a 401 Unauthorized response
        return NextResponse.json(
          
          // {
          //   status: 401,
          //   statusText: 'Unauthorized Access',
          //   message: ['Email or Password is invalid']
          // }
          // ,
          // {
          //   status: 401,
          //   statusText: 'Unauthorized Access'
          // }
          {
            // We create object here to separate each error message for each field in case of multiple errors
            message: ['Invalid email or password']
          },
          {
            status: 500,
            statusText: 'Unauthorized Access'
          }
        )
      }
    } else {
      // If no user is found, return a 401 Unauthorized response
      return NextResponse.json(

        // {
        //   message: ['Email or Password is invalid']
        // },
        // {
        //   status: 401,
        //   statusText: 'Unauthorized Access',
        //   message: ['Email or Password is invalid']
        // }
        {
          // We create object here to separate each error message for each field in case of multiple errors
          message: ['Invalid email or password']
        },
        {
          status: 401,
          statusText: 'Unauthorized Access'
        }
      )
    }
  } catch (error) {
    // Handle any errors that occur during the database query
    return NextResponse.json(

      // {
      //   message: ['An error occurred while processing your request']
      // },
      // {
      //   status: 500,
      //   statusText: 'Internal Server Error',
      //   message: ['An error occurred while processing your request']
      // }
      {
        // We create object here to separate each error message for each field in case of multiple errors
        message: ['An error occurred while processing your request']
      },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    )
  }
}
