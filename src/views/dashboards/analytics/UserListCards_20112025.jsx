'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import axios from 'axios'

// Component Imports

import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

import { getLocalStorageItem } from '@/utils/storage'


const UserListCards = () => {
  const [visitorDataSets, setVisitorDataSets] = useState({
    VisitorCount: '0',
    StudentCount: '0',
    EntrepreneurCount: '0',
    GeneralPublicCount: '0'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Vars
  const dataSets = [
    {
      title: 'Visitor Registration',
      stats: `${visitorDataSets.VisitorCount}`,
      avatarIcon: 'ri-group-line',
      avatarColor: 'primary',
      trend: 'positive',
      trendNumber: '29%',
      subtitle: 'Total Register'
    },
    {
      title: 'Student',
      stats: `${visitorDataSets.StudentCount}`,
      avatarIcon: 'ri-user-add-line',
      avatarColor: 'error',
      trend: 'positive',
      trendNumber: '18%',
      subtitle: 'Last week analytics'
    },
    {
      title: 'Entrepreneur',
      stats: `${visitorDataSets.EntrepreneurCount}`,
      avatarIcon: 'ri-user-follow-line',
      avatarColor: 'success',
      trend: 'negative',
      trendNumber: '14%',
      subtitle: 'Last week analytics'
    },
    {
      title: 'General Public',
      stats: `${visitorDataSets.GeneralPublicCount}`,
      avatarIcon: 'ri-user-search-line',
      avatarColor: 'warning',
      trend: 'positive',
      trendNumber: '42%',
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
    </Grid>
  )
}

export default UserListCards
