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

// Vars
const donutColors = {
  series1: '#006D5D',
  series2: '#FF9900',
  series3: '#826bf8',
  series4: '#32baff',
  series5: '#FF9900'
}

const ApexDonutChart = ({ bookedCount, approvedExhibitorCount, totalCount }) => {
  // Hooks
  const theme = useTheme()

  // Vars
  const textSecondary = 'var(--mui-palette-text-secondary)'

  const options = {
    stroke: { width: 0 }, // No outer stroke
    labels: ['Approved Exhibitor', 'Stall Booked'],
    colors: [donutColors.series1, donutColors.series5],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '13px', // Adjust font size for data labels
      },
      formatter: val => `${parseInt(val, 10)}%`,
    },
    legend: {
      fontSize: '13px',
      position: 'top',
      labels: { colors: textSecondary },
      markers: { height: 10, width: 10, offsetX: theme.direction === 'rtl' ? 7 : -4 },
      itemMargin: {
        vertical: 12,
        horizontal: 8,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%', // Increase donut thickness
          labels: {
            show: true,
            name: {
              fontSize: '15px',
            },
            value: {
              fontSize: '15px', // Reduced font size for donut values
              color: textSecondary,
              formatter: val => `${parseInt(val, 10)}`,
            },
            total: {
              show: true,
              fontSize: '13px',
              formatter: () => '',
              color: 'var(--mui-palette-text-primary)',
            },
          },
        },
        borderRadius: 50, // Adjusted for more rounded edges
        expandOnClick: false, // Prevent slices from expanding
      },
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 150,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 200,
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    fontSize: '0.6rem',
                  },
                  value: {
                    fontSize: '0.6rem',
                  },
                  total: {
                    fontSize: '0.6rem',
                  },
                },
              },
            },
          },
        },
      },
    ],
  };

  return (
    <Card>
      <CardHeader title="Stall Booked" subheader={`Total Exhibitors ${totalCount}`} />
      <CardContent style={{ display: 'flex', justifyContent: 'center' }}>
        <AppReactApexCharts
          type="donut"
          width="300px" // Set the desired width
          height={250}  // Adjust height as needed
          options={options}
          series={[approvedExhibitorCount, bookedCount]}
        />
      </CardContent>
    </Card>
  )

}

export default ApexDonutChart
