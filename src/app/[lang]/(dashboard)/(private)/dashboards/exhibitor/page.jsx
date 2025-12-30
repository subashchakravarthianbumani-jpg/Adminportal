// MUI Imports
'use client'

import { useEffect, useState } from 'react'

import axios from 'axios'
import Grid from '@mui/material/Grid'
import {  Backdrop, CircularProgress } from '@mui/material';

import { getLocalStorageItem } from '@/utils/storage'


// Components Imports
import KitchenSink from '@/views/dashboards/academy/KitchenSink'
import HorizontalWithBorder from '@/views/dashboards/academy/HorizontalWithBorder'

const DashboardAcademy = () => {
  const [exhibitorDataSets, setExhibitorDataSets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRegistrations = () => {
    setLoading(true)
    setError(null)

    const token = getLocalStorageItem('accessToken') // Replace with the actual token

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        console.log(response.data)
        console.log(response.data.data[0])

        if (response.data.status) {
          setExhibitorDataSets(response.data.data[0]) // Example assuming the data structure
        } else {
          setError(response.data.message || 'No data found')
        }
      })
      .catch(err => {
        console.log('Error fetching data:', err)
        setError(err.response?.data?.message || 'Something went wrong')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchRegistrations()
  }, [])

  console.log(exhibitorDataSets)

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12} md={3}>
          <HorizontalWithBorder
            title='Exhibitor'
            stats={exhibitorDataSets.ExhibitorsCount}
            trendNumber='+2'
            avatarIcon='ri-home-2-fill'
            color='primary'
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <HorizontalWithBorder
            title='Total Stall Booked'
            stats={exhibitorDataSets.ExhibitorsStallBookedCount}
            trendNumber='+2'
            avatarIcon='ri-bar-chart-fill'
            color='warning'
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <HorizontalWithBorder
            title='Total Approved'
            stats={exhibitorDataSets.ExhibitorsApprovedCount}
            trendNumber='+2'
            avatarIcon='ri-stack-fill'
            color='info'
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <HorizontalWithBorder
            title='Total Rejected'
            stats={exhibitorDataSets.ExhibitorsRejectedCount}
            trendNumber='+2'
            avatarIcon='ri-close-fill'
            color='error'
          />
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <KitchenSink />
        </Grid>
      </Grid>
        {/* Full-Screen Loader */}
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  )
}

export default DashboardAcademy
