'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import Image from 'next/image'

// MUI Imports
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress' // Import CircularProgress
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { valibotResolver } from '@hookform/resolvers/valibot'
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { email, minLength, nonEmpty, object, pipe, string } from 'valibot'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

import useSettingsList from '../views/useSettingsList'

// Util Imports

const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Please enter a valid email address')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  )
})

const Login = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [loading, setLoading] = useState(false) // Loading state

  const { settingsList, loadingList } = useSettingsList()

  const loginMedia = settingsList?.find(x => x.Key === 'LoginMedia')?.Value
  const adminLogo = settingsList?.find(x => x.Key === 'AdminLogo')?.Value

  // Hooks
  const router = useRouter()
  const { lang: locale } = useParams()
  const { settings } = useSettings()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)

  const onSubmit = async data => {
    setLoading(true)

    const res = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false
    })

    if (res?.ok) {
      const apiRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const apiResult = await apiRes.json()

      if (apiRes.ok) {
        localStorage.setItem('accessToken', apiResult.accessToken)
        localStorage.setItem('userInfo', JSON.stringify(apiResult.UserInfo))
        router.replace('/')
      } else {
        setErrorState(apiResult.message || 'Login failed. Please try again.')
      }
    } else {
      setErrorState(res.error || 'Login failed. Please check your credentials.')
    }

    setLoading(false) // Reset loading state after submission
  }

  return (
    <div className='flex flex-col md:flex-row items-center justify-center h-screen overflow-hidden'>
      {/* Left Section */}
      <div className='hidden md:flex items-center justify-center flex-1 bg-gray-50'>
        {/* <img
          src="/images/illustrations/auth/TNBEAT_Loogin.png"
          alt="Illustration"
          className="max-w-full h-auto object-contain"
        /> */}

        {<img src={loginMedia || 'Loading...'} alt='Login Media' className='max-w-full h-auto object-contain' />}
      </div>

      {/* Right Section */}
      <div
        className='flex flex-col  shadow-md rounded-lg p-6 w-full max-w-md md:flex-1 md:mx-auto'
        style={{ height: '590px' }}
      >
        <div className='flex justify-center mb-6'>
          {
            <img src={adminLogo || 'Loading...'} alt='Admin Logo' className='h-20 object-contain' />
          }

          {/* <Logo /> */}
        </div>
        <Typography variant='h4' align='center' gutterBottom>
          TN-BEAT EXPO!
        </Typography>
        <Typography align='center' className='mb-4'>
          Login to your account
        </Typography>

        <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Email Field */}
          <Controller
            name='email'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type='email'
                label='Email'
                variant='outlined'
                error={!!errors.email || !!errorState}
                helperText={errors.email?.message || errorState}
                aria-label='Email'
              />
            )}
          />

          {/* Password Field */}
          <Controller
            name='password'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Password'
                type={isPasswordShown ? 'text' : 'password'}
                variant='outlined'
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={handleClickShowPassword} aria-label='toggle password visibility'>
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                aria-label='Password'
              />
            )}
          />

          {/* Submit Button */}
          <Button fullWidth variant='contained' color='primary' type='submit' aria-label='Log In' disabled={loading}>
            {loading ? <CircularProgress size={24} color='inherit' /> : 'Log In'}
          </Button>
        </form>

        <div className='mt-4 text-center'>
          <Typography>Application by </Typography>
          <Link href='https://pixoustech.com/' legacyBehavior>
            <a
              style={{
                color: '#8c57ff',
                textDecoration: 'none'
              }}
              target='_blank'
              rel='noopener noreferrer'
            >
              Pixous Technologies
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
