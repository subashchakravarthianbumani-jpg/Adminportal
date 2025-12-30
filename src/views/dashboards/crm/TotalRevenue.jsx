'use client';

import React from 'react';  // This line is needed for JSX to work in Next.js 13+

// Next Imports
import dynamic from 'next/dynamic';

// MUI Imports
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';

// External Libraries
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

// Dynamic Component Import
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false });

const TotalRevenue = ({ othersCountData, femaleCountData, maleCountData }) => {
  const textSecondaryColor = 'var(--mui-palette-text-secondary)';

  // Calculate the total count
  const totalCount = maleCountData + femaleCountData + othersCountData || 0;

  // Calculate series as percentages of the total count
  const series = [
    Number(((maleCountData / totalCount) * 100).toFixed(2)),
    Number(((femaleCountData / totalCount) * 100).toFixed(2)),
    Number(((othersCountData / totalCount) * 100).toFixed(2)),
  ];

  const options = {
    chart: {
      sparkline: { enabled: true },
    },
    labels: ['Male', 'Female', 'Others'],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      labels: {
        colors: 'var(--mui-palette-text-primary)',
      },
    },
    stroke: { lineCap: 'round' },
    colors: ['#3366CC', '#DC3912', '#FF9900'],
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
    plotOptions: {
      radialBar: {
        hollow: { size: '55%' },
        track: {
          background: '#e7e7e7',
          strokeWidth: '100%',
          margin: 10,
        },
        dataLabels: {
          name: {
            offsetY: 28,
            fontSize: '0.75rem',
            color: textSecondaryColor,
          },
          value: {
            offsetY: 0,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: 'var(--mui-palette-text-primary)',
            formatter(value) {
              return `${value}%`;
            },
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '0.75rem',
            color: textSecondaryColor,
            formatter() {
              return totalCount;
            },
          },
        },
      },
    },
    yaxis: { max: 100 },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value, { seriesIndex }) => {
          const counts = [maleCountData || 0 , femaleCountData || 0, othersCountData || 0];

          return `${counts[seriesIndex]} counts`;
        },
      },
    },
  };

  // Download as SVG
  const downloadSVG = () => {
    const svg = document.querySelector('.apexcharts-canvas .apexcharts-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });

    saveAs(blob, 'Gender-Chart.svg');
  };

  // Download as PNG
  const downloadPNG = () => {
    html2canvas(document.querySelector('.apexcharts-canvas')).then((canvas) => {
      canvas.toBlob((blob) => {
        saveAs(blob, 'Gender-Chart.png');
      });
    });
  };

  // Download as CSV
  const downloadCSV = () => {
    const data = [
      ['Gender', 'Count'],
      ['Male', maleCountData || 0],
      ['Female', femaleCountData || 0],
      ['Others', othersCountData || 0],
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    saveAs(blob, 'Gender-Chart.csv');
  };

  // Toggle visibility for download options
  const [isDropdownOpen, setDropdownOpen] = React.useState(false);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  return (
    <Card>
      <CardHeader
        title="Gender"
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
        <AppReactApexCharts
          type="radialBar"
          height={1005}
          width="100%"
          series={series}
          options={options}
        />
        <div className="flex justify-around mt-5">
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-circle-fill text-[10px]" style={{ color: '#3366CC' }} />
              <Typography className="font-medium" color="text.primary">
                {maleCountData}
              </Typography>
            </div>
            <Typography>Male</Typography>
          </div>
          <Divider orientation="vertical" flexItem />
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-circle-fill text-[10px]" style={{ color: '#DC3912' }} />
              <Typography className="font-medium" color="text.primary">
                {femaleCountData}
              </Typography>
            </div>
            <Typography>Female</Typography>
          </div>
          <Divider orientation="vertical" flexItem />
          <div className="flex items-center flex-col justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-circle-fill text-[10px]" style={{ color: '#FF9900' }} />
              <Typography className="font-medium" color="text.primary">
                {othersCountData}
              </Typography>
            </div>
            <Typography>Others</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalRevenue;
