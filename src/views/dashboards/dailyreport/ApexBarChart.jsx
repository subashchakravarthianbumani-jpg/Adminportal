'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const ApexBarChart = ({ state, Exhibitors, Visitors, SeminarAttendees, Officers, Others, totalCount }) => {
  // Hooks
  const theme = useTheme()

  // Remove 0th index
  const filteredState = state.slice(1)
  const filteredExhibitors = Exhibitors.slice(1)
  const filteredVisitors = Visitors.slice(1)
  const filteredSeminarAttendees = SeminarAttendees.slice(1)
  const filteredOfficers = Officers.slice(1)
  const filteredOthers = Others.slice(1)

  // Dynamic Height Calculation
  const chartHeight = filteredState.length * 30 // 30px per row (adjust as needed)

  // Vars
  const divider = 'var(--mui-palette-divider)'

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      offsetX: theme.direction === 'rtl' ? 10 : -10,
      stacked: true // Enable stacking
    },
    colors: ['#009688', '#FF7043', '#66BB6A', '#42A5F5', '#FF4081'], // Brighter colors for each series
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px', // Reduced font size for better spacing
        colors: ['#ffffff'] // White text for better contrast
      },
      formatter: (val) => val // Display the value inside the bar
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true,
        barHeight: '20%', // Adjusted bar height to prevent overlap
      }
    },
    grid: {
      borderColor: divider,
      xaxis: {
        lines: { show: false }
      },
      padding: {
        top: -10
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#000000', // Set y-axis labels to dark black
          fontSize: '12px' // Reduced font size to prevent overlap
        }
      }
    },
    xaxis: {
      axisTicks: { show: false },
      categories: filteredState,
      labels: {
        style: {
          colors: '#000000', // Set x-axis labels to dark black
          fontSize: '12px' // Reduced font size to prevent overlap
        }
      }
    }
  }

  const seriesData = [
    { name: 'Exhibitors', data: filteredExhibitors },
    { name: 'Visitors', data: filteredVisitors },
    { name: 'Seminar Attendees', data: filteredSeminarAttendees },
    { name: 'Officers', data: filteredOfficers },
    { name: 'Others', data: filteredOthers }
  ]

  const getCurrentDate = () => {
    const currentDate = new Date()

    return currentDate.toLocaleDateString('en-US', {
      weekday: undefined,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).replace(',', ' ,')
  }

  return (
    <Card>
      <CardHeader
        title={`State Count Logged as ${getCurrentDate()} `}
        subheader={`Total Count: ${totalCount}`}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] },
          '& .MuiCardHeader-subheader': {
            fontWeight: 'bold', // Makes the subheader bold
            color: 'black' // Adjust the color for brightness
          },
          '& .MuiCardHeader-title': {
            fontWeight: 'bold', // Makes the subheader bold
            color: 'black', // Adjust the color for brightness
            marginBottom: '10px'
          }
        }}
      />

      <CardContent>
        <div style={{ overflowY: 'auto', maxHeight: '400px' }}> {/* Add scrolling if needed */}
          <AppReactApexCharts
            type='bar'
            width='100%'
            height={chartHeight} // Set dynamic height
            options={options}
            series={seriesData} // Use the stacked series data
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ApexBarChart
