'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import axios from 'axios'


import Grid from '@mui/material/Grid'
import {  Backdrop, CircularProgress } from '@mui/material';

import { getLocalStorageItem } from '@/utils/storage'


// Components Imports
import HorizontalWithBorder from '@/views/dashboards/stallallocation/HorizontalWithBorder'

// eslint-disable-next-line import/no-unresolved
import ApprovedTable from '@/views/dashboards/stallallocation/ApprovedTable'

// eslint-disable-next-line import/no-unresolved
import RejectedTable from '@/views/dashboards/stallallocation/RejectedTable'

// eslint-disable-next-line import/no-unresolved
import StallBookedTable from '@/views/dashboards/stallallocation/StallBookedTable'
// eslint-disable-next-line import/no-unresolved
import ExhibitorTable from '@/views/dashboards/stallallocation/ExhibitorTable'

const DashboardAnalytics = () => {
  const [typeofDatas, setTypeofDatas] = useState('exhibitor')

  // Function to check if the current card is selected
  const isSelected = type => typeofDatas === type

  const [visitorDataSets, setVisitorDataSets] = useState({
    TotalCount: '0',
    VisitorCount: '0',
    SeminarAttendeeCount: '0',
    OthersCount: '0'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const updatedValuesPage=()=>{
    fetchRegistrations()
  }

  // Function to render tables conditionally
  const handleTypeOfData = () => {
    switch (typeofDatas) {
      case 'approved':
        return <ApprovedTable updatedValuesPage={updatedValuesPage} />
      case 'rejected':
        return <RejectedTable updatedValuesPage={updatedValuesPage}/>
      case 'stallBooked':
        return <StallBookedTable updatedValuesPage={updatedValuesPage}/>
      case 'exhibitor':
        return <ExhibitorTable updatedValuesPage={updatedValuesPage}/>
      default:
        return null
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Exhibitor */}
      <Grid
        item
        xs={12}
        md={3}
        onClick={() => setTypeofDatas('exhibitor')}
        style={{
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isSelected('exhibitor') ? 'scale(0.9)' : 'scale(1)',
          boxShadow: isSelected('exhibitor') ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <HorizontalWithBorder
          title='Exhibitor'
          stats={visitorDataSets.ExhibitorsWaitingCount}
          trendNumber='+2'
          avatarIcon='ri-user-fill'
          color='primary'
        />
      </Grid>

      {/* Total Approved */}
      <Grid
        item
        xs={12}
        md={3}
        onClick={() => setTypeofDatas('approved')}
        style={{
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isSelected('approved') ? 'scale(0.9)' : 'scale(1)',
          boxShadow: isSelected('approved') ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <HorizontalWithBorder
          title='Total Approved'
          stats={visitorDataSets.ExhibitorsApprovedCount}
          trendNumber='+2'
          avatarIcon='ri-shake-hands-fill'
          color='info'
        />
      </Grid>

      {/* Total Stall Booked */}
      <Grid
        item
        xs={12}
        md={3}
        onClick={() => setTypeofDatas('stallBooked')}
        style={{
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isSelected('stallBooked') ? 'scale(0.9)' : 'scale(1)',
          boxShadow: isSelected('stallBooked') ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <HorizontalWithBorder
          title='Total Stall Booked'
          stats={visitorDataSets.ExhibitorsStallBookedCount}
          trendNumber='+2'
          avatarIcon='ri-bar-chart-2-fill'
          color='primary'
        />
      </Grid>

      {/* Total Rejected */}
      <Grid
        item
        xs={12}
        md={3}
        onClick={() => setTypeofDatas('rejected')}
        style={{
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: isSelected('rejected') ? 'scale(0.9)' : 'scale(1)',
          boxShadow: isSelected('rejected') ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        <HorizontalWithBorder
          title='Total Rejected'
          stats={visitorDataSets.ExhibitorsRejectedCount}
          trendNumber='+2'
          avatarIcon='ri-close-fill'
          color='error'
        />
      </Grid>

      {/* Render Table Based on State */}
      <Grid item xs={12}>
        {handleTypeOfData()}
      </Grid>
       {/* Full-Screen Loader */}
       <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Grid>
  )
}

export default DashboardAnalytics
