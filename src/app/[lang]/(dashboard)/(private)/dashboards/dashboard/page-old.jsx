'use client'

// MUI Imports
import { useState, useEffect } from 'react'

import html2canvas from 'html2canvas';

import {  Backdrop, CircularProgress } from '@mui/material';

import { Grid, Button } from '@mui/material';
import { jsPDF } from 'jspdf';

// Components Imports
import axios from 'axios'

import { getLocalStorageItem } from '@/utils/storage'


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

  const fetchRegistrations = () => {
    setLoading(true)
    setError(null)

    const token =
      getLocalStorageItem('accessToken'); // Replace with the actual token

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        console.log(response.data)
        console.log(response.data.data[0])

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
    fetchRegistrations()
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
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} md={3} className="self-end">
            <HorizontalWithBorder
              title="Visitors"
              stats={visitorDataSets.VisitorCount}
              trendNumber="+2"
              avatarIcon="ri-group-2-fill"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} className="self-end">
            <HorizontalWithBorder
              title="Seminar Attendees"
              stats={visitorDataSets.SeminarAttendeeCount}
              trendNumber="+2"
              avatarIcon="ri-group-3-fill"
              color="error"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} className="self-end">
            <HorizontalWithBorder
              title="Exhibitors"
              stats={visitorDataSets.ExhibitorsCount}
              trendNumber="+2"
              avatarIcon="ri-home-2-fill"
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <HorizontalWithBorder
              title="Speakers"
              stats={visitorDataSets.SpeakersCount}
              trendNumber="+2"
              avatarIcon="ri-mic-line"
              color="info"
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <TotalRegistration totalCountDats={visitorDataSets.TotalCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Grid item xs={12} sm={12} md={12}>
              <HorizontalWithBorder
                title="Others"
                stats={visitorDataSets.OthersCount}
                trendNumber="+2"
                avatarIcon="ri-group-fill"
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={12} className="py-3">
              <SalesState totalCount={visitorDataSets.TotalCount} />
            </Grid>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TotalRevenue
              maleCountData={visitorDataSets.MaleCount}
              femaleCountData={visitorDataSets.FemaleCount}
              othersCountData={visitorDataSets .MaleCount}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Grid item xs={12} sm={12} md={12}>
              <TotalVisitors
                approvedDatas={visitorDataSets.ExhibitorsApprovedCount}
                rejectedData={visitorDataSets.ExhibitorsRejectedCount}
                exhibitorTotalCountDatas={visitorDataSets.ExhibitorsCount}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={12} className="pt-5">
              <ApexBarChart
                totalCount={visitorDataSets.TotalCount}
                Age50PlusCount={visitorDataSets.Age50PlusCount}
                Age40To50Count={visitorDataSets.Age40To50Count}
                Age20To40Count={visitorDataSets.Age20To40Count}
                Below20Count={visitorDataSets.Below20Count}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Grid item xs={9} sm={6} md={12}>
              <HorizontalRegistration
                title="New Registration"
                stats={visitorDataSets.TodayCount}
                trendNumber="+2"
                avatarIcon="ri-user-add-fill"
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={12} className="pt-5">
              <ApexDonutChart
                totalCount={visitorDataSets.ExhibitorsCount}
                approvedExhibitorCount={visitorDataSets.ExhibitorsApprovedCount}
                bookedCount={visitorDataSets.ExhibitorsStallBookedCount}
              />
            </Grid>
          </Grid>
        </Grid>
      </div>
         {/* Full-Screen Loader */}
         <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );

}

export default DashboardCRM
