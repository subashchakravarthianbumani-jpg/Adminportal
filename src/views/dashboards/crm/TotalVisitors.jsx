'use client'
import React from 'react';  // This line is needed for JSX to work in Next.js 13+

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

// External Libraries
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

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
        fontSize: '12px', // Reduced font size for percentage labels
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
      fontSize: '15px',
      position: 'top',
      labels: { colors: '#000000' },
      markers: {
        height: 10,
        width: 10,
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
          size: '65%',
          labels: {
            show: true,
            name: {
              color: '#000000',
              fontSize: '20px',
            },
            value: {
              fontSize: '18px',
              color: '#000000',
              formatter: val => `${parseInt(val, 10)}`,
            },
            total: {
              show: true,
              fontSize: '18px', // Adjusted font size for better visibility
              label: 'Total',
              color: '#000000',
              formatter: function (value) {
                // Calculate and return the total
                return value.globals.seriesTotals
                  .reduce((total, num) => total + num, 0)
                  .toString();
              }
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
  };


  // Download as SVG
  const downloadSVG = () => {
    const svg = document.querySelector('.apexcharts-canvas .apexcharts-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });

    saveAs(blob, 'Exhibitors.svg');
  };

  // Download as PNG
  const downloadPNG = () => {
    html2canvas(document.querySelector('.apexcharts-canvas')).then((canvas) => {
      canvas.toBlob((blob) => {
        saveAs(blob, 'Exhibitors.png');
      });
    });
  };

  // Download as CSV
  const downloadCSV = () => {
    const data = [
      ['Status', 'Count'],
      ['Exhibitors', exhibitorTotalCountDatas],
      ['Approved', approvedDatas],
      ['Rejected', rejectedData],
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    saveAs(blob, 'Exhibitors.csv');
  };

  // Toggle visibility for download options
  const [isDropdownOpen, setDropdownOpen] = React.useState(false);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };


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
          <div className="relative">
            {/* SVG Download Icon Button */}
            <IconButton onClick={toggleDropdown}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="none" d="M0 0h24v24H0V0z"></path>
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
              </svg>
            </IconButton>

            {/* Conditional rendering of the download options */}
            {isDropdownOpen && (
              <div
                className="absolute mt-2 bg-white border p-1 rounded-md z-10"
                style={{ left: '-70px' }} // Adjust left position to appear to the left of the icon
              >
                <button onClick={() => { downloadSVG(); setDropdownOpen(false); }}>Download SVG</button>
                <button onClick={() => { downloadPNG(); setDropdownOpen(false); }}>Download PNG</button>
                <button onClick={() => { downloadCSV(); setDropdownOpen(false); }}>Download CSV</button>
              </div>
            )}
          </div>
        }
        />

      <CardContent>
        <AppReactApexCharts type='donut' height={225} width='100%' series={[approvedDatas, rejectedData]} options={options} />

        <div className="flex justify-around">
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <Typography className="font-medium" color="text.primary">
                {Number(approvedDatas || 0) + Number(rejectedData || 0)}
              </Typography>
            </div>
            <Typography>Total</Typography>
          </div>
          <Divider orientation="vertical" flexItem />
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-circle-fill text-[10px]"  style={{ color: '#3366CC' }}/>
              <Typography className="font-medium" color="text.primary">
                {approvedDatas || 0}
              </Typography>
            </div>
            <Typography>Approved</Typography>
          </div>
          <Divider orientation="vertical" flexItem />
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-circle-fill text-[10px]" style={{ color: '#DC3912' }}/>
              <Typography className="font-medium" color="text.primary">
                {rejectedData || 0}
              </Typography>
            </div>
            <Typography>Rejected</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalVisitors
