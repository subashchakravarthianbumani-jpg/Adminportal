'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// Component Imports
import OptionsMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const TotalRevenue = ({ othersCountData, femaleCountData, maleCountData }) => {
  const textSecondaryColor = 'var(--mui-palette-text-secondary)'

  const maxValue = maleCountData + femaleCountData + othersCountData;

// Calculate series as percentages of the maximum value with two decimal places
const series = [
  Number(((maleCountData / maxValue) * 100).toFixed(2)),
  Number(((femaleCountData / maxValue) * 100).toFixed(2)),
  Number(((othersCountData / maxValue) * 100).toFixed(2))
]

const options = {
  chart: {
    sparkline: { enabled: true }
  },
  labels: ['Male', 'Female', 'Others'],
  legend: {
    show: true, // Enable legend
    position: 'top', // Position it at the top
    horizontalAlign: 'left', // Align it to the left
    fontSize: '12px', // Optional: Adjust font size
    labels: {
      colors: 'var(--mui-palette-text-primary)' // Optional: Set label color
    }
  },
  stroke: { lineCap: 'round' },
  colors: ['#3366CC', '#DC3912', '#FF9900'],
  states: {
    hover: {
      filter: { type: 'none' }
    },
    active: {
      filter: { type: 'none' }
    }
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '55%' // Adjusted to leave more empty space
      },
      track: {
        background: '#e7e7e7',
        strokeWidth: '100%',
        margin: 10, // Creates the empty space between the bars
        opacity: 1
      },
      dataLabels: {
        name: {
          offsetY: 28,
          fontSize: '0.75rem',
          color: textSecondaryColor
        },
        value: {
          offsetY: -12,
          fontWeight: 500,
          fontSize: '1.75rem',
          color: 'var(--mui-palette-text-primary)',
          formatter(value) {
            return `${value}%`
          }
        },
        total: {
          show: true,
          fontWeight: 400,
          fontSize: '0.75rem',
          color: textSecondaryColor,
          label: `Total ${new Date().getFullYear()}`,
          formatter() {
            return `${maxValue}`
          }
        }
      },
      barWidth: '20%' // Adjust this value as per your preference
    }
  },
  yaxis: {
    max: 100 // Radial bar percentages
  }
}


  return (
    <Card>
    <CardHeader
      title="Gender"
      action={<OptionsMenu options={['Last 28 Days', 'Last Month', 'Last Year']} iconClassName="text-textPrimary" />}
    />
    <CardContent>
      <AppReactApexCharts
        type="radialBar"
        height={380}
        width="100%"
        series={series}
        options={options}
      />
      <div className="flex justify-around">
        <div className="flex items-center flex-col justify-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <i className="ri-circle-fill text-[10px]" style={{ color: "#3366CC" }} />
            <Typography className="font-medium" color="text.primary">
              {maleCountData}
            </Typography>
          </div>
          <Typography>Male</Typography>
        </div>
        <Divider orientation="vertical" className="bs-auto" />
        <div className="flex items-center flex-col justify-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <i className="ri-circle-fill text-[10px]" style={{ color: "#DC3912" }} />
            <Typography className="font-medium" color="text.primary">
              {femaleCountData}
            </Typography>
          </div>
          <Typography>Female</Typography>
        </div>
        <Divider orientation="vertical" className="bs-auto" />
        <div className="flex items-center flex-col justify-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <i className="ri-circle-fill text-[10px]" style={{ color: "#FF9900" }} />
            <Typography className="font-medium" color="text.primary">
              {othersCountData}
            </Typography>
          </div>
          <Typography>Others</Typography>
        </div>
      </div>
    </CardContent>
  </Card>

  )
}

export default TotalRevenue
