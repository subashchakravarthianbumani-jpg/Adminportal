'use client'

// MUI Imports
import { useState, useEffect } from 'react'

import html2canvas from 'html2canvas';

import { Grid, Button } from '@mui/material';
import { jsPDF } from 'jspdf';

// Components Imports
import axios from 'axios'

import { getLocalStorageItem } from '@utils/storage'

import HorizontalWithBorder from '@/views/dashboards/crm/HorizontalWithBorder'
import HorizontalRegistration from '@/views/dashboards/crm/HorizontalRegistration'
import TotalRegistration from '@/views/dashboards/crm/TotalRegistration'
import SalesState from '@/views/dashboards/crm/SalesState'
import TotalVisitors from '@/views/dashboards/crm/TotalVisitors'
import TotalRevenue from '@/views/dashboards/crm/TotalRevenue'
import ApexDonutChart from '@/views/dashboards/crm/ApexDonutChart'
import ApexBarChart from '@/views/dashboards/crm/ApexBarChart'
import 'dotenv/config'

const DashboardCRM = () => {
  const [visitorDataSets, setVisitorDataSets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRegistrations = (token) => {
    setLoading(true)
    setError(null)

    // const token = getLocalStorageItem('accessToken');

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        console.log(response.data)
        console.log("Setting visitorDataSets ---", response.data.data[0])

        if (response.data.status) {
          setVisitorDataSets(response.data.data[0]) // Example assuming the data structure
        } else {
          setError(response.data.message || 'No data found')
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

    const token = getLocalStorageItem('accessToken');

    if (!token) {

      return;

    }

    fetchRegistrations(token)

  }, [])

  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('API_URL is not defined in environment variables')
  }

  const handlePrint = async () => {
    const input = document.getElementById("dashboard-content");

    // Dynamically load the Remix icon font
    const fontFace = new FontFace(
      "remixicon",
      'url("https://cdn.jsdelivr.net/npm/remixicon/fonts/remixicon.woff2")'
    );

    try {
      // Load and add the font to the document
      await fontFace.load();
      document.fonts.add(fontFace);

      // Wait for all styles to apply before rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      html2canvas(input, {
        scale: 2, // Increase resolution for better quality
        useCORS: true, // Enable CORS to load fonts and icons
        logging: true,
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png"); // Convert canvas to image
          const pdf = new jsPDF();
          const imgWidth = 190;
          const pageHeight = pdf.internal.pageSize.height;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          // Add the first page
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // Add additional pages if necessary
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          // Save the PDF
          pdf.save("dashboard.pdf");
        })
        .catch((err) => {
          console.log("Error generating PDF:", err);
        });
    } catch (error) {
      console.log("Error loading Remix font:", error);
    }
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h2>Dashboard</h2>
        <Button variant="contained" color="primary" onClick={handlePrint}>
          Print
        </Button>
      </div>

      {/* Dashboard Content */}
      <div id="dashboard-content">
      <Grid container spacing={4}>
      {/* Visitors */}
      <Grid item xs={12} sm={6} md={3} className="self-end">
        <HorizontalWithBorder
          title="Visitors"
          stats={visitorDataSets.VisitorCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-group-2-fill"
          color="primary"
        />
      </Grid>

      {/* Seminar Attendees */}
      <Grid item xs={12} sm={6} md={3} className="self-end">
        <HorizontalWithBorder
          title="Seminar Attendees"
          stats={visitorDataSets.SeminarAttendeeCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-group-3-fill"
          color="error"
        />
      </Grid>

      {/* Exhibitors */}
      <Grid item xs={12} sm={6} md={3} className="self-end">
        <HorizontalWithBorder
          title="Exhibitors"
          stats={visitorDataSets.ExhibitorsCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-home-2-fill"
          color="warning"
        />
      </Grid>

      {/* Speakers */}
      <Grid item xs={12} sm={6} md={3}>
        <HorizontalWithBorder
          title="Speakers"
          stats={visitorDataSets.SpeakersCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-mic-line"
          color="info"
        />
      </Grid>

      {/* Total Registration */}
      <Grid item xs={12} md={9}>
        <TotalRegistration totalCountDats={visitorDataSets.TotalCount ?? 0} />
      </Grid>

      {/* Sales State and New Registration */}
      <Grid item xs={12} sm={12} md={3}>
        <Grid item xs={12} md={12}>
         <HorizontalWithBorder
          title="Total Registration"
          stats={visitorDataSets.TotalCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-line-chart-line"
          color="primary"
        />
        </Grid>
        <Grid item xs={12} md={12} className="py-5">
        <HorizontalWithBorder
          title="Others"
          stats={visitorDataSets.OthersCount ?? 0}
          trendNumber="+2"
          avatarIcon="ri-account-pin-circle-line"
          color="warning"
        />
        </Grid>
        <Grid item xs={9} sm={6} md={12} className="py-5">
          <HorizontalRegistration
            title="New Registration"
            stats={visitorDataSets.TodayCount ?? 0}
            trendNumber="+2"
            avatarIcon="ri-user-add-fill"
            color="success"
          />
        </Grid>
      </Grid>

      {/* Total Revenue */}
      <Grid item xs={12} sm={6} md={4}>
        <TotalRevenue
          maleCountData={visitorDataSets.MaleCount ?? 0}
          femaleCountData={visitorDataSets.FemaleCount ?? 0}
          othersCountData={visitorDataSets.TransgenderCount ?? 0}
        />
      </Grid>


{/* Bar and Donut Charts */}
<Grid item xs={12} sm={12} md={8}>

  <Grid container spacing={3}>
    {/* Total Visitors and Donut Chart in the same row */}
    <Grid item xs={12}>
      <Grid container spacing={3}>
        {/* Total Visitors */}
        <Grid item xs={6}>
          <TotalVisitors
            approvedDatas={visitorDataSets.ExhibitorsApprovedCount ?? 0}
            rejectedData={visitorDataSets.ExhibitorsRejectedCount ?? 0}
            exhibitorTotalCountDatas={visitorDataSets.ExhibitorsCount ?? 0}
          />
        </Grid>
        {/* Apex Donut Chart */}
        <Grid item xs={6}>
          <ApexDonutChart
            totalCount={visitorDataSets.ExhibitorsCount ?? 0}
            approvedExhibitorCount={visitorDataSets.ExhibitorsApprovedCount ?? 0}
            bookedCount={visitorDataSets.ExhibitorsStallBookedCount ?? 0}
          />
        </Grid>
      </Grid>
    </Grid>

    {/* ApexBarChart below */}
    <Grid item xs={12}>
      <ApexBarChart
        totalCount={visitorDataSets.TotalCount ?? 0}
        Age50PlusCount={visitorDataSets.Age50PlusCount ?? 0}
        Age40To50Count={visitorDataSets.Age40To50Count ?? 0}
        Age20To40Count={visitorDataSets.Age20To40Count ?? 0}
        Below20Count={visitorDataSets.Below20Count ?? 0}
      />
    </Grid>
  </Grid>

</Grid>



    </Grid>
      </div>
    </div>
  );

}

export default DashboardCRM
