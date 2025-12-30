'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import axios from 'axios'

// Component Imports

import { Backdrop, CircularProgress } from '@mui/material'

import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

import { getLocalStorageItem } from '@/utils/storage'



const UserListCards = () => {
  const [visitorDataSets, setVisitorDataSets] = useState({
    SeminarAttendeeCount: '0',
    AgricultureCount: '0',
    HorticultureCount: '0',
    GeneralPublicCount: '0'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Vars
  const dataSets = [
    {
      title: `Total Seminar Attendee's`,
      stats: `${visitorDataSets.SeminarAttendeeCount}`,
      avatarIcon: 'ri-group-line',
      avatarColor: 'primary',
      trend: 'positive',
      trendNumber: '29%',
      subtitle: 'Total Register'
    },
    {
      title: 'Agriculture',
      stats: `${visitorDataSets.AgricultureCount}`,
      avatarIcon: 'ri-user-add-line',
      avatarColor: 'error',
      trend: 'positive',
      trendNumber: '18%',
      subtitle: 'Last week analytics'
    },
    {
      title: 'Horticulture',
      stats: `${visitorDataSets.HorticultureCount}`,
      avatarIcon: 'ri-user-follow-line',
      avatarColor: 'success',
      trend: 'negative',
      trendNumber: '14%',
      subtitle: 'Last week analytics'
    }
  ]

  const fetchRegistrations = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getLocalStorageItem('accessToken') // Replace with the actual token

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log(response.data)
      console.log(response.data.data[0])

      if (response.data.status) {
        setVisitorDataSets(response.data.data[0])

        // Example fix if API uses camelCase:

        // setTotalCount(response.data.totalCount)
      } else {
        setError(response.data.message || 'No data found')
      }
    } catch (err) {
      console.log('Error fetching data:', err)
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchRegistrations()
  }, [])

  console.log(visitorDataSets)

  return (
    <Grid container spacing={6}>
      {dataSets.map((item, i) => (
        <Grid key={i} item xs={12} sm={6} md={3}>
          <HorizontalWithSubtitle {...item} />
        </Grid>
      ))}
      {/* Full-Screen Loader */}
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    </Grid>
  )
}

export default UserListCards
