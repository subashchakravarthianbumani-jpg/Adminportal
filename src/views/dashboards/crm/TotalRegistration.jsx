'use client'

// pages/ChartPage.js (or another suitable location)

import React, { useState, useEffect } from 'react'

import dynamic from 'next/dynamic'

import CardHeader from '@mui/material/CardHeader'

// MUI Imports
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

import axios from 'axios'

import OptionsMenu from '@core/components/option-menu'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

import { getLocalStorageItem } from '@utils/storage'

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const Card = styled(MuiCard)(({ color }) => ({
  transition: 'border 0.3s ease-in-out, box-shadow 0.3s ease-in-out, margin 0.3s ease-in-out',
  borderBottomWidth: '2px',
  borderBottomColor: `var(--mui-palette-${color}-darkerOpacity)`,
  '[data-skin="bordered"] &:hover': {
    boxShadow: 'none'
  },
  '&:hover': {
    borderBottomWidth: '3px',
    borderBottomColor: `var(--mui-palette-${color}-main) !important`,
    boxShadow: 'var(--mui-customShadows-xl)',
    marginBlockEnd: '-1px'
  }
}))

const TotalRegistration = ({ totalCountDats }) => {
  const [visitorDataSets, setVisitorDataSets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRegistrations = () => {
    setLoading(true)
    setError(null)

    const token = getLocalStorageItem('accessToken');

    // const token =
    //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyOTc4NzljLWE5MzEtMTFlZS1hMTE3LTAwMTU1ZTFmNWQwNyIsInVzZXJOYW1lIjoiYWRtaW5AcGl4b3VzLmNvbSIsImlhdCI6MTczNTMyMTgzMCwiZXhwIjoxNzM1OTI2NjMwfQ.yezrI-RYk9RQfxYTRSj6kVsCA5-TlSgr_q_DgZBjyoQ' // Replace with the actual token

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/lastIntervals`, {
        params: { intervalType: 'day' }
      })
      .then(response => {
        const { status, data, message } = response.data

        console.log('Full Response:', response.data)
        console.log('First Item:', data)

        if (status) {
          setVisitorDataSets(data) // Update the state with the actual data
        } else {
          setError(message || 'No data found')
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

  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchRegistrations()
  }, [])

  console.log(visitorDataSets)

  // Initialize state with fallback data
  // Initial chart state
  const [state, setState] = useState({
    series: [],
    options: {
      chart: { type: 'bar', height: 450 },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 5, borderRadiusApplication: 'end' }
      },
      dataLabels: {
        enabled: true,
        style: { colors: ['#FFF'], fontSize: '12px', fontWeight: 'bold' },
        formatter: val => val,
        offsetY: -10
      },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: [], labels: { formatter: val => val } },
      yaxis: { title: { text: '' } },
      fill: { opacity: 1 },
      colors: ['#3366CC', '#DC3912', '#FF9900', '#006D5D']
    }
  })

  // Update chart when visitorDataSets changes
  useEffect(() => {
    if (!visitorDataSets || !visitorDataSets.length) return

    const categories = visitorDataSets.map(item => new Date(item.Interval).toLocaleDateString())

    const series = [
      { name: 'Visitors', data: visitorDataSets.map(item => item.VisitorCount) },
      { name: 'Seminar Attendees', data: visitorDataSets.map(item => item.SeminarAttendeeCount) },
      { name: 'Exhibitors', data: visitorDataSets.map(item => item.ExhibitorCount) },
      { name: 'Others', data: visitorDataSets.map(item => item.OthersCount) }
    ]

    setState(prev => ({
      ...prev,
      series,
      options: {
        ...prev.options,
        xaxis: { ...prev.options.xaxis, categories }
      }
    }))
  }, [visitorDataSets])

  useEffect(() => {
    if (visitorDataSets && visitorDataSets.length) {
      // Extract categories (dates) and series data
      const categories = visitorDataSets.map(item => new Date(item.Interval).toLocaleDateString())

      const series = [
        {
          name: 'Visitors',
          data: visitorDataSets.map(item => item.VisitorCount)
        },
        {
          name: 'Seminar Attendees',
          data: visitorDataSets.map(item => item.SeminarAttendeeCount)
        },
        {
          name: 'Exhibitors',
          data: visitorDataSets.map(item => item.ExhibitorCount)
        },
        {
          name: 'Others',
          data: visitorDataSets.map(item => item.OthersCount)
        }
      ]

      // Update chart state
      setState(prevState => ({
        ...prevState,
        series,
        options: {
          ...prevState.options,
          xaxis: {
            ...prevState.options.xaxis,
            categories
          },
          colors: ['#3366CC', '#DC3912', '#FF9900', '#006D5D'] // Custom bar colors
        }
      }))
    }
  }, [visitorDataSets])

  // Make sure state is fully defined before rendering the chart
  const isReady = state.series && state.options && state.series.length > 0 && state.options.xaxis

  if (!isReady) {
    // If data is not ready, render a fallback loading state or message
    return <div>Loading chart...</div>
  }

  return (
    <div>
      <div id='chart'>
        <Card color={'primary'}>
          <CardHeader
            title='Total Registration'
            subheader={`Total Registration ${totalCountDats}`}

            // action={
            //   <OptionsMenu
            //     iconClassName="text-textPrimary"
            //     options={["Last 5 Days", "Last 5 Weeks", "Last 5 Months"]}
            //   />
            // }
          />
          <ReactApexChart options={state.options} series={state.series} type='bar' height={316} />
        </Card>
      </div>
      <div id='html-dist'></div>
    </div>
  )
}

export default TotalRegistration
