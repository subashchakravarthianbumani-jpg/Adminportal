'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// Components Imports
import OptionsMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const   TotalVisitors = ({exhibitorTotalCountDatas,rejectedData,approvedDatas}) => {
  // Hooks
  const theme = useTheme()

  // Vars
  const textSecondary = 'var(--mui-palette-text-secondary)'

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    colors: ['#3366CC', '#DC3912'],
    stroke: { width: 0 },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '8px', // Reduced font size for percentage labels
        colors: ['#FFFFFF']
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        color: '#000',
        opacity: 0.1
      },
      formatter: function (val) {
        return `${val.toFixed(1)}%`; // Format percentage with one decimal
      }
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '10px',
        color: '#FFFFFF'
      }
    },
    legend: {
      show: true,
      fontSize: '9px',
      position: 'bottom',
      labels: { colors: '#000000' },
      markers: {
        height: 6,
        width: 6,
        offsetX: theme.direction === 'rtl' ? 5 : -2
      },
      itemMargin: { horizontal: 9 }
    },
    labels: ['Approved', 'Rejected'],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      pie: {
        customScale: 0.9,
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              offsetY: 55,
              fontSize: '0.3375rem',
              color: '#FFFFFF'
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              fontSize: '14px', // Adjusted font size for value text
              formatter: value => `${value}`,
              color: '#000000'
            },
            total: {
              show: true,
              fontSize: '0.6375rem',
              label: '',
              color: '#000000',
              formatter: value => `${value.globals.seriesTotals.reduce((total, num) => total + num)}`
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          chart: {
            height: 250
          }
        }
      }
    ]
  }

  return (
    <Card className=''>
          <CardHeader
          title="Exhibitors"
          sx={{
            padding: '4px 16px', // Adjust padding values as needed
            '& .MuiCardHeader-action': {
              marginTop: 0, // Remove extra margin from the action section
            },
          }}
          action={
            <OptionsMenu iconClassName="text-textPrimary" options={['Refresh', 'Update', 'Delete']} />
          }
        />

      <CardContent>
        <AppReactApexCharts type='donut' height={190} width='100%' series={[approvedDatas, rejectedData]} options={options} />
      </CardContent>
    </Card>
  )
}

export default TotalVisitors
