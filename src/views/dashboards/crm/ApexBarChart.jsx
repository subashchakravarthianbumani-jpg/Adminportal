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

const ApexBarChart = ({ Below20Count, Age20To40Count, Age40To50Count, Age50PlusCount, totalCount }) => {
  // Hooks
  const theme = useTheme()

  // Vars
  const divider = 'var(--mui-palette-divider)'
  const disabledText = 'var(--mui-palette-text-disabled)'

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: true, tools: { download: true } }, // Enable download button on toolbar
      offsetX: theme.direction === 'rtl' ? 10 : -10
    },
    colors: ['#006D5D'], // Updated color to #006D5D
    dataLabels: {
      enabled: true, // Enable data labels
      style: {
        fontSize: '12px',
        colors: ['#000000'] // Set color to black for visibility
      },
      offsetX: 10, // Positioning data label to the right of the bar
      offsetY: -10, // Positioning data label above the bar
      formatter: function (value) {
        return `${value}` // Display the value outside the bar
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
        barHeight: '30%',
        horizontal: true
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
        style: { colors: '#000000', fontSize: '13px' } // Set y-axis label color to black
      }
    },
    xaxis: {
      axisTicks: { show: false },
      categories: ['50+', '40-50', '20-40', 'Below 20'],
      labels: {
        style: { colors: '#000000', fontSize: '13px' } // Set x-axis label color to black
      }
    },

    // Adding toolbar for download options
    toolbar: {
      show: true,
      tools: {
        download:
          '<img src="https://image.shutterstock.com/image-vector/download-icon-on-computer-button-260nw-1181500900.jpg" alt="Download" width="20" height="20">'
      }
    }
  }

  const downloadChart = type => {
    const chart = document.querySelector('.apexcharts-canvas')
    const imgURI = chart.querySelector('image').src
    const link = document.createElement('a')

    link.href = imgURI
    link.download = `chart.${type}`
    link.click()
  }

  const safeNumber = value => (typeof value === 'number' && !isNaN(value) ? value : 0)

  return (
    <Card>
      <CardHeader
        title='Age'
        subheader={`Total Count: ${safeNumber(totalCount)}`}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
      />
      <CardContent>
        <AppReactApexCharts
          type='bar'
          width='100%'
          height={165}
          options={options}
          series={[
            {
              data: [
                safeNumber(Age50PlusCount),
                safeNumber(Age40To50Count),
                safeNumber(Age20To40Count),
                safeNumber(Below20Count)
              ]
            }
          ]}
        />
      </CardContent>
    </Card>
  )
}

export default ApexBarChart
