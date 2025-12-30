import React from 'react';

import dynamic from 'next/dynamic';

import CardHeader from '@mui/material/CardHeader';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { styled } from '@mui/material/styles';

// Styled Card Component
const Card = styled(MuiCard)(({ color }) => ({
  transition: 'border 0.3s ease-in-out, box-shadow 0.3s ease-in-out, margin 0.3s ease-in-out',
  borderBottomWidth: '2px',
  borderBottomColor: `var(--mui-palette-${color}-darkerOpacity)`,
  '[data-skin="bordered"] &:hover': {
    boxShadow: 'none',
  },
  '&:hover': {
    borderBottomWidth: '3px',
    borderBottomColor: `var(--mui-palette-${color}-main) !important`,
    boxShadow: 'var(--mui-customShadows-xl)',
    marginBlockEnd: '-1px',
  },
}));

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const TotalRegistration = ({ Category = [], Values = [] }) => {
  // Filter out entries with 0 values
  const filteredData = Category.map((cat, index) => ({
    category: cat,
    value: Values[index],
  })).filter((item) => item.value > 0);

  const filteredCategories = filteredData.map((item) => item.category);
  const filteredValues = filteredData.map((item) => item.value);

  // Calculate the chart options and series directly
  const series = [
    {
      name: 'Categories',
      data: filteredValues,
    },
  ];

  const options = {
    chart: {
      type: 'bar',
      height: 500,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '80%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: filteredCategories,
    },
    yaxis: {
      title: {
        text: 'Count',
      },
      min: 0,
      max: Math.max(...filteredValues) + 1,
    },
    fill: {
      opacity: 1,
    },
    colors: ['#3366CC', '#DC3912', '#FF9900', '#006D5D', '#FFCC00', '#8E44AD', '#F39C12'],
  };

  const getCurrentDate = () => {
    const currentDate = new Date();

    return currentDate
      .toLocaleDateString('en-US', {
        weekday: undefined,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      .replace(',', ' ,');
  };

  return (
    <div>
      <div id="chart">
        <Card color="primary">
          <CardHeader
            title={`Business Categories as ${getCurrentDate()}`}
            subheader={`Total Registration: ${filteredValues.reduce((a, b) => a + b, 0)}`}
            sx={{
              '& .MuiCardHeader-subheader': {
                fontWeight: 'bold',
                color: 'black',
              },
              '& .MuiCardHeader-title': {
                fontWeight: 'bold',
                color: 'black',
                marginBottom: '10px',
              },
            }}
          />
          <CardContent>
            <ReactApexChart options={options} series={series} type="bar" height={316} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TotalRegistration;
