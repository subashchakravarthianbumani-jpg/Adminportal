'use client'

import React from 'react' // This line is needed for JSX to work in Next.js 13+

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'

// External Libraries
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars for chart colors
const donutColors = {
  series1: '#006D5D', // Color for Approved Exhibitors
  series5: '#FF9900' // Color for Stall Booked
}

const ApexDonutChart = ({ bookedCount, approvedExhibitorCount, totalCount }) => {
  // Hooks
  const theme = useTheme()

  const safeBooked = Number(bookedCount) || 0
  const safeApprovedExhibitorCount = Number(approvedExhibitorCount) || 0
  const safeTotal = Number(totalCount) || 0

  // Vars
  const textSecondary = 'var(--mui-palette-text-secondary)'

  const options = {
    chart: {
      enabled: true,
      sparkline: {
        enabled: true // Minimal surrounding elements
      },
      toolbar: {
        show: false // Disable toolbar to avoid unnecessary space
      }
    },
    stroke: { width: 0 },
    labels: ['Stall Booked', 'Approved'],
    colors: [donutColors.series1, donutColors.series5], // Use defined color codes
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px' // Slightly smaller font for better fit
      },
      formatter: val => `${parseInt(val, 10)}%`,
      offsetX: 0, // Center horizontally
      offsetY: 3 // Slightly below the center
    },

    legend: {
      show: true, // Ensure legend is enabled
      fontSize: '13px',
      position: 'top',
      horizontalAlign: 'center', // Align legend properly
      labels: { colors: textSecondary }, // Ensure color is defined correctly
      markers: { height: 10, width: 10, offsetX: theme.direction === 'rtl' ? 5 : -2 },
      itemMargin: {
        vertical: 1, // Reduce vertical spacing between legend items
        horizontal: 8
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%', // Increase donut size for better space
          labels: {
            show: true,
            name: {
              color: '#000000',
              fontSize: '18px'
            },
            value: {
              fontSize: '16px', // Slightly smaller font for better fit
              color: '#000000',
              formatter: val => `${parseInt(val, 10)}`
            },
            total: {
              show: true,
              fontSize: '16px', // Keep it readable but smaller
              color: 'var(--mui-palette-text-primary)',
              formatter: () => {
                const totalBooked = Number(safeBooked) || 0
                const totalApproved = Number(safeApprovedExhibitorCount) || 0

                return `${totalBooked + totalApproved}`
              }
            }
          }
        },
        dataLabels: {
          offset: 0 // Adjust labels closer to the donut
        },
        expandOnClick: false
      }
    },
    responsive: [
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 150 // Reduce height for smaller screens
          },
          plotOptions: {
            pie: {
              donut: {
                size: '70%', // Smaller size for mobile
                labels: {
                  show: true,
                  name: {
                    fontSize: '0.7rem'
                  },
                  value: {
                    fontSize: '0.7rem'
                  },
                  total: {
                    fontSize: '0.7rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }

  // Download as SVG
  const downloadSVG = () => {
    const svg = document.querySelector('.apexcharts-canvas .apexcharts-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })

    saveAs(blob, 'StallBooked-Chart.svg')
  }

  // Download as PNG
  const downloadPNG = () => {
    html2canvas(document.querySelector('.apexcharts-canvas')).then(canvas => {
      canvas.toBlob(blob => {
        saveAs(blob, 'StallBooked-Chart.png')
      })
    })
  }

  // Download as CSV
  const downloadCSV = () => {
    const data = [
      ['Status', 'Count'],
      ['Total', maleCountData],
      ['Booked', safeBooked],
      ['Approved', safeApprovedExhibitorCount]
    ]

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

    saveAs(blob, 'StallBooked-Chart.csv')
  }

  // Toggle visibility for download options
  const [isDropdownOpen, setDropdownOpen] = React.useState(false)

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev)
  }

  return (
    <Card>
      <CardHeader
        title='Stall Booked'
        sx={{
          padding: '10px 16px', // Adjust padding values as needed
          '& .MuiCardHeader-action': {
            marginTop: 0 // Remove extra margin from the action section
          }
        }}
        action={
          <div className='relative'>
            {/* SVG Download Icon Button */}

            <IconButton onClick={toggleDropdown}>
              <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
                <path fill='none' d='M0 0h24v24H0V0z'></path>
                <path d='M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z'></path>
              </svg>
            </IconButton>

            {/* Conditional rendering of the download options */}
            {isDropdownOpen && (
              <div
                className='absolute mt-2 bg-white border p-1 rounded-md z-10'
                style={{ left: '-70px' }} // Adjust left position to appear to the left of the icon
              >
                <button
                  onClick={() => {
                    downloadSVG()
                    setDropdownOpen(false)
                  }}
                >
                  Download SVG
                </button>
                <button
                  onClick={() => {
                    downloadPNG()
                    setDropdownOpen(false)
                  }}
                >
                  Download PNG
                </button>
                <button
                  onClick={() => {
                    downloadCSV()
                    setDropdownOpen(false)
                  }}
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        }
        subheader={`Total Exhibitors ${safeTotal}`}
      />

      <CardContent style={{ display: 'flex', justifyContent: 'center' }}>
        {/* Donut Chart */}
        <AppReactApexCharts
          type='donut'
          width='300px' // Set the desired width
          height={190} // Adjust height as needed
          options={options}
          series={[safeBooked, safeApprovedExhibitorCount]}
        />
      </CardContent>
      <CardContent>
        <div className='flex justify-around'>
          <div className='flex items-center flex-col justify-center gap-1'>
            <div className='flex items-center justify-center gap-2'>
              <Typography className='font-medium' color='text.primary'>
                {safeBooked + safeApprovedExhibitorCount}
              </Typography>
            </div>
            <Typography>Total</Typography>
          </div>
          <Divider orientation='vertical' flexItem />
          <div className='flex items-center flex-col justify-center gap-1'>
            <div className='flex items-center justify-center gap-2'>
              <i className='ri-circle-fill text-[10px]' style={{ color: '#006D5D' }} />
              <Typography className='font-medium' color='text.primary'>
                {safeBooked}
              </Typography>
            </div>
            <Typography>Stall Booked</Typography>
          </div>
          <Divider orientation='vertical' flexItem />
          <div className='flex items-center flex-col justify-center gap-1'>
            <div className='flex items-center justify-center gap-2'>
              <i className='ri-circle-fill text-[10px]' style={{ color: '#FF9900' }} />
              <Typography className='font-medium' color='text.primary'>
                {safeApprovedExhibitorCount}
              </Typography>
            </div>
            <Typography>Approved</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApexDonutChart
