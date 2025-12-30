'use client'

// MUI Imports
import { useEffect, useState } from 'react'

import html2canvas from 'html2canvas'

import { Button, Grid } from '@mui/material'
import { jsPDF } from 'jspdf'

// Components Imports
import axios from 'axios'

import { getLocalStorageItem } from '@/utils/storage'


import ApexBarChart from '@/views/dashboards/dailyreport/ApexBarChart'
import HorizontalWithBorder from '@/views/dashboards/dailyreport/HorizontalWithBorder'
import TotalRegistration from '@/views/dashboards/dailyreport/TotalRegistration'
import 'dotenv/config'

const DashboardCRM = () => {
  const [visitorDataSets, setVisitorDataSets] = useState([])
  const [DailyDataSets, setDailyDataSets] = useState([])
  const [dailyStateSets, setDailyStateSets] = useState([])
  const [dailyBusCatSets, setDailyBusCatSets] = useState([])
  const [dailyBusTraSets, setDailyBusTraSets] = useState([])
  const [ExhibitorTypeData, setExhibitorTypeDataSets] = useState([])
  const [StallBookedData , setStallBookedDataSets] =  useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRegistrations = () => {
    setLoading(true)
    setError(null)

    const token = getLocalStorageItem('accessToken') // Replace with the actual token

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {

        if (response.data.status) {
          setVisitorDataSets(response.data.data[0]) // Example assuming the data structure

          console.log("response visitor-----",response.data.data[0])
        } else {
          setError(response.data.message || 'No data found')
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err)
        setError(err.response?.data?.message || 'Something went wrong')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const fetchdailyReport = () => {
    setLoading(true)
    setError(null)

    const token = getLocalStorageItem('accessToken') // Replace with the actual token

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dailyReport`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        console.log("response-----",response.data)

        //console.log("First Set values : " , response.data)

        if (response.data.status) {

          setDailyDataSets(response.data.Overall)

          // Assuming response.data.State contains your data
          const stateData = response.data.State;  // All the state data

          console.log("State Data : " , stateData)
          const BusinessData = response.data.BusinessCategory;
          const BusinessTrade= response.data.BusinessTrade;
          const ExhibitorTypeData = response.data.ExhibitorType;
           const StallBookData = response.data.StallBooking;

          const states = stateData.map(state => state.state);
          const exhibitors = stateData.map(state => parseInt(state.TotalExhibitorsCount));
          const visitors = stateData.map(state => parseInt(state.TotalVisitorCount));
          const seminarAttendees = stateData.map(state => parseInt(state.TotalSeminarAttendeeCount));
          const officers = stateData.map(state => parseInt(state.TotalCount));  // Assuming officers count is under `TodayCount`
          const others = stateData.map(state => parseInt(state.TotalOthersCount));

          const OverallCount = StallBookData.map(stall => stall.OverallCount)

          console.log("OverallCount  : " + OverallCount);
          const TotalCount = StallBookData.map(stall => stall.TotalCount)
          const LeftCount = StallBookData.map(stall => stall.LeftCount)
          const B2BCount = StallBookData.map(stall => stall.B2BCount)
          const B2CCount = StallBookData.map(stall => stall.B2CCount)
          const PSUCount = StallBookData.map(stall => stall.PSUCount)


          console.log("StateDate : " + states);
          console.log("exhibitors : " + exhibitors);
          console.log("visitors : " + visitors);
          console.log("seminarAttendees : " + seminarAttendees);
          console.log("officers : " + officers);
          console.log("others : " + others);


          const TodayB2BCount = ExhibitorTypeData.map(ExhibitorTypeData => parseInt(ExhibitorTypeData.TotalB2BCount, 10) || 0);
          const TodayPSUCount = ExhibitorTypeData.map(ExhibitorTypeData => parseInt(ExhibitorTypeData.TotalPSUCount, 10) || 0);
          const TodayB2CCount = ExhibitorTypeData.map(ExhibitorTypeData => parseInt(ExhibitorTypeData.TotalB2CCount, 10) || 0);

          // const ExhibitorType = ExhibitorTypeData.map(ExhibitorType => TodayB2BCount );

          //console.log("------", ExhibitorTypeData)

          // const ExhibitorType = stateData.map(state => parseInt(state.TodayOthersCount));

      // Assuming BusinessData is the array with the given data structure
      const filteredBusinessData = BusinessData.filter(
        item => item.BusinessCategory && parseInt(item.TotalCount, 10) > 0
      );

      const states1 = filteredBusinessData.map(item => item.BusinessCategory); // Map BusinessCategory after filtering
      const exhibitors1 = filteredBusinessData.map(item => parseInt(item.TotalCount, 10)); // Map TotalCount after filtering

          const states2 = BusinessTrade.map(BusinessTrade => BusinessTrade.BusinessTrade || "Unknown"); // BusinessCategory or "Unknown" if null
          const exhibitors2 = BusinessTrade.map(BusinessTrade => parseInt(BusinessTrade.TotalCount, 10) || 0); // Parse exhibitors count

//console.log("states1 :" + states1);
//console.log("exhibitors1 :" + exhibitors1);


          // Calculate the total count
          const totalCount = exhibitors.reduce((total, count) => total + count, 0) +
          visitors.reduce((total, count) => total + count, 0) +
          seminarAttendees.reduce((total, count) => total + count, 0) +
          officers.reduce((total, count) => total + count, 0) +
          others.reduce((total, count) => total + count, 0);

          // Assuming you want to set these values in state
            setDailyBusCatSets({
              states1,
              exhibitors1
            });

            setDailyBusTraSets({
              states2,
              exhibitors2
            });

          // Set the daily state sets
          setDailyStateSets({
            state: states,
            Exhibitors: exhibitors,
            Visitors: visitors,
            SeminarAttendees: seminarAttendees,
            Others: others,
            totalCount: totalCount,
          });

          setExhibitorTypeDataSets({
            TodayB2BCount,
            TodayB2CCount,
            TodayPSUCount
          });

          setStallBookedDataSets({
            OverallCount : OverallCount,
            TotalCount : TotalCount,
            LeftCount :LeftCount,
            B2BCount : B2BCount,
            B2CCount : B2CCount,
            PSUCount : PSUCount
          })

        } else {
          setError(response.data.message || 'No data found')
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err)
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

  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchdailyReport()
  }, [])



  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('API_URL is not defined in environment variables')
  }

  const handlePrint = async () => {
    const dashboardContent = document.getElementById("dashboard-content");
    const tableContent = document.getElementById("tradetable");
    const printTableValues = document.getElementById("PrintTableValues");
    const totalRegistrationContent = document.getElementById("total-registration");
    const stateCountTable = document.getElementById("StateCounttable");

    const link = document.createElement("link");

    link.href = "https://cdn.jsdelivr.net/npm/remixicon/fonts/remixicon.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    try {
        await document.fonts.ready;
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;

        const margin = 10;
        const padding = 10;

        // Page 1: Title page
        pdf.setLineWidth(1);
        pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

        const centerY = pageHeight / 2;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("TN-BEAT-2025", pageWidth / 2, centerY - 15, { align: "center" });
        pdf.setFontSize(16);
        pdf.text("Daily Report", pageWidth / 2, centerY, { align: "center" });

        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        pdf.setFontSize(18);
        pdf.text(formattedDate, pageWidth / 2, centerY + 15, { align: "center" });

        pdf.addPage();

        // Page 2: Dashboard content
        const dashboardCanvas = await html2canvas(dashboardContent, {
            scale: 2,
            useCORS: true,
        });

        const dashboardImgData = dashboardCanvas.toDataURL("image/png");
        const imgWidth = pageWidth - margin * 2 - padding * 2;
        const dashboardImgHeight = (dashboardCanvas.height * imgWidth) / dashboardCanvas.width;

        pdf.setLineWidth(1);
        pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
        let position = margin + padding + 5;

        pdf.addImage(dashboardImgData, "PNG", margin + padding, position, imgWidth, dashboardImgHeight);

        pdf.addPage();

        // Page 3: Total Registration and Table Content
        const totalRegistrationCanvas = await html2canvas(totalRegistrationContent, {
            scale: 2,
            useCORS: true,
        });

        const totalRegistrationImgData = totalRegistrationCanvas.toDataURL("image/png");

        const totalRegistrationImgHeight =
            (totalRegistrationCanvas.height * imgWidth) / totalRegistrationCanvas.width;

        let positionThirdPage = margin + padding + 5;

        pdf.setLineWidth(1);
        pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
        pdf.addImage(
            totalRegistrationImgData,
            "PNG",
            margin + padding,
            positionThirdPage,
            imgWidth,
            totalRegistrationImgHeight
        );

        const tableCanvas = await html2canvas(tableContent, {
            scale: 2,
            useCORS: true,
        });

        const tableImgData = tableCanvas.toDataURL("image/png");
        const tableImgHeight = (tableCanvas.height * imgWidth) / tableCanvas.width;

        positionThirdPage += totalRegistrationImgHeight + 5;

        if (positionThirdPage + tableImgHeight > pageHeight - margin) {
            pdf.addPage();
            positionThirdPage = margin + padding + 5;
        }

        pdf.addImage(
            tableImgData,
            "PNG",
            margin + padding,
            positionThirdPage,
            imgWidth,
            tableImgHeight
        );

        const printTableValuesCanvas = await html2canvas(printTableValues, {
            scale: 2,
            useCORS: true,
        });

        const printTableValuesImgData = printTableValuesCanvas.toDataURL("image/png");

        const printTableValuesImgHeight =
            (printTableValuesCanvas.height * imgWidth) / printTableValuesCanvas.width;

        let positionBelowTable = positionThirdPage + tableImgHeight + 5;

        if (positionBelowTable + printTableValuesImgHeight > pageHeight - margin) {
            pdf.addPage();
            positionBelowTable = margin + padding + 5;
        }

        pdf.addImage(
            printTableValuesImgData,
            "PNG",
            margin + padding,
            positionBelowTable,
            imgWidth,
            printTableValuesImgHeight
        );

        pdf.addPage();

        // Last Page: StateCounttable
        const stateCountCanvas = await html2canvas(stateCountTable, {
            scale: 2,
            useCORS: true,
        });

        const stateCountImgData = stateCountCanvas.toDataURL("image/png");

        const stateCountImgHeight =
            (stateCountCanvas.height * imgWidth) / stateCountCanvas.width;

        pdf.setLineWidth(1);
        pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
        pdf.addImage(
            stateCountImgData,
            "PNG",
            margin + padding,
            margin + padding + 5,
            imgWidth,
            stateCountImgHeight
        );

        const fileName = `Daily Report - ${formattedDate}.pdf`;

        pdf.save(fileName);
    } catch (error) {
        console.error("Error generating PDF:", error);
    }
};


// Use default values to avoid TypeError
const states3 = Array.isArray(dailyBusTraSets.states2) ? dailyBusTraSets.states2.slice(1) : []; // Remove the first element
const exhibitors3 = Array.isArray(dailyBusTraSets.exhibitors2) ? dailyBusTraSets.exhibitors2.slice(1) : []; // Remove the first element

// Check if both arrays have the same length before mapping
const data = states3.map((state, index) => ({
  business: state,
  exhibitors: exhibitors3[index] || 0 // Default to 0 if exhibitors3[index] is undefined
}));

const statename = Array.isArray(dailyStateSets.state) ? dailyStateSets.state.slice(1) : []; // Remove the first element
const exhibitorsvalue = Array.isArray(dailyStateSets.Exhibitors) ? dailyStateSets.Exhibitors.slice(1) : []; // Remove the first element
const visitorvalue = Array.isArray(dailyStateSets.Visitors) ? dailyStateSets.Visitors.slice(1) : []; // Remove the first element
const seminarattendeevalue = Array.isArray(dailyStateSets.SeminarAttendees) ? dailyStateSets.SeminarAttendees.slice(1) : []; // Remove the first element
const othersvalue = Array.isArray(dailyStateSets.Others) ? dailyStateSets.Others.slice(1) : []; // Remove the first element

// Check if both arrays have the same length before mapping
const data2 = statename.map((state, index) => ({
  StateName: state,
  exhibitors: exhibitorsvalue[index] || 0 ,// Default to 0 if exhibitors3[index] is undefined
  Visitors: visitorvalue[index] || 0,
  SeminarAttendees: seminarattendeevalue[index] || 0,
  Others: othersvalue[index] || 0
}));



//console.log("------data2-------")

//Log the resulting data for debugging
//console.log(data2);


//console.log("------data-------")

 // Filter out exhibitors that are less than or equal to 0
const filteredExhibitors = data
.map(row => row.exhibitors)
.filter(value => value > 0); // Only keep values greater than 0

// Calculate highest and lowest values only if there are valid exhibitors
const highestValue = filteredExhibitors.length > 0 ? Math.max(...filteredExhibitors) : null;
const lowestValue = filteredExhibitors.length > 0 ? Math.min(...filteredExhibitors) : null;

  const getCurrentDate = () => {
    const currentDate = new Date()

    return currentDate
      .toLocaleDateString('en-US', {
        weekday: undefined,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      .replace(',', ' ,')
  }

  //console.log("-----------------------------------")
  console.log("DailyStateSets ------------ : " ,DailyDataSets);

  return (
    <div>
      {/* Daily Report Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h1>Daily Report</h1>
        <Button variant='contained' color='primary' onClick={handlePrint}>
          Print
        </Button>
      </div>

      {/* Dashboard Content */}
      <div id='dashboard-content'>
        {/* Wrapper for Header and Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center', // Vertically align items
            justifyContent: 'space-between', // Space between items
            padding: '10px',
            marginBottom: '15px',
            position: 'relative' // Required to center the header
          }}
        >
          {/* Card Section */}
          <div
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '15px',
              maxWidth: '350px',
              backgroundColor: '#ffffff',
              boxShadow: '0px 4px 8px rgba(25, 14, 14, 0.1)', // Optional shadow
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: '10px',
                marginBottom: '10px'
              }}
            >
              <p
                style={{
                  margin: '0',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  color: '#4a4a4a',
                  textAlign: 'left'
                }}
              >
                Team – Registration Deck
              </p>
            </div>

            {/* Content */}
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '8px 0', fontSize: '15px', color: '#4a4a4a' }}>
                <strong>Report Date: </strong> {getCurrentDate()}
              </p>
              <p style={{ margin: '8px 0', fontSize: '15px', color: '#4a4a4a' }}>
                <strong>Reported By: </strong> Pixous Technologies Pvt Ltd
              </p>
            </div>
          </div>

          {/* TN BEAT EXPO Header */}
          <h1
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)', // Center horizontally
              fontSize: '25px',
              fontWeight: 'bold',
              margin: 0,
              textAlign: 'center'
            }}
          >
            TN BEAT EXPO - 2025
          </h1>

          {/* Right Side Image */}
          <div
            style={{
              maxWidth: '150px',
              maxHeight: '150px',
              marginLeft: '15px'
            }}
          >
            <img
              src='/images/logos/Pixous_Tech_Logo.png' // Replace with your image URL
              alt='Expo Logo'
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px' // Optional for rounded corners
              }}
            />
          </div>
        </div>

        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} md={3} className='self-end'>
            <HorizontalWithBorder
              title='Visitors'
              stats={DailyDataSets[0]?.TodayVisitorCount || 0}
              trendNumber='+2'
              color='primary'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} className='self-end'>
            <HorizontalWithBorder
              title='Seminar Attendees'
              stats={DailyDataSets[0]?.TodaySeminarAttendeeCount || 0}
              trendNumber='+2'
              color='error'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} className='self-end'>
            <HorizontalWithBorder
              title='Exhibitors'
              stats={DailyDataSets[0]?.TodayExhibitorsCount || 0}
              trendNumber='+2'
              color='warning'
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <HorizontalWithBorder
              title='Others'
              stats={DailyDataSets[0]?.TodayOthersCount || 0}
              trendNumber='+2'
              color='info'
            />
          </Grid>
        </Grid>
        {/* Two Tables in the Same Row */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          {/* Table 1: Overall Status */}
          <div style={{ flex: '1', padding: '15px', marginRight: '20px' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
              Overall Status Before {getCurrentDate()}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #ddd' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Total Count</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.PreviousDaysCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Visitors</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.PreviousDaysVisitorCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Seminar Attendees</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.PreviousDaysSeminarAttendeeCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Exhibitors</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.PreviousDaysExhibitorsCount || 0}</td>
                </tr>
                {/* <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Officers</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>40</td>
                </tr> */}
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Others</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.PreviousDaysOthersCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Additional Data (Example) */}
          <div style={{ flex: '1', padding: '15px' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
              Overall Status as {getCurrentDate()}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Total Count</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.TotalCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Visitors</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.VisitorCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Seminar Attendees</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.SeminarAttendeeCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Exhibitors</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.ExhibitorsCount || 0}</td>
                </tr>
                {/* <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Officers</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>40</td>
                </tr> */}
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Others</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{DailyDataSets[0]?.OthersCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


           <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
         {/* Table 2: Additional Data (Example) */}
         <div style={{ flex: '1', padding: '15px' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
              Exhibitor Types as {getCurrentDate()}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>B2B</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{ExhibitorTypeData.TodayB2BCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>B2C</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{ExhibitorTypeData.TodayB2CCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>PSUs</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{ExhibitorTypeData.TodayPSUCount || 0}</td>
                </tr>

              </tbody>
            </table>
          </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
         {/* Table 2: Additional Data (Example) */}
         <div style={{ flex: '1', padding: '15px' }}>
            <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
              Stall Booked Status as {getCurrentDate()}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', border: '2px solid #ddd', textAlign: 'left' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Overall Stalls</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.OverallCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Total Stalls Booked</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.TotalCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>Available Stalls</td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.LeftCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>B2B Allotted Stalls </td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.B2BCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>B2C Allotted Stalls </td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.B2CCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>PSUs Allotted Stalls </td>
                  <td style={{ padding: '10px', border: '2px solid #ddd' }}>{StallBookedData.PSUCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>

          {/* <ApexBarChart
                totalCount={visitorDataSets.TotalCount}
                state={visitorDataSets.state}
                Exhibitors={visitorDataSets.Exhibitors}
                Visitors={visitorDataSets.Visitors}
                SeminarAttendees={visitorDataSets.SeminarAttendees}
                Officers={visitorDataSets.Officers}
                Others={visitorDataSets.Others}
              /> */}
{/*
              <ApexBarChart
                state={dailyStateSets.state || []}  // default empty array if data is missing
                Exhibitors={dailyStateSets.Exhibitors || []}
                Visitors={dailyStateSets.Visitors || []}
                SeminarAttendees={dailyStateSets.SeminarAttendees || []}
                Officers={dailyStateSets.Officers || []}
                Others={dailyStateSets.Others || []}
                totalCount={dailyStateSets.totalCount || 0}
              /> */}

            {/* <ApexBarChart
                state={dailyStateSets.state || []}  // default empty array if data is missing
                Exhibitors={dailyStateSets.Exhibitors || []}
                Visitors={dailyStateSets.Visitors || []}
                SeminarAttendees={dailyStateSets.SeminarAttendees || []}
                Officers={dailyStateSets.Officers || []}
                Others={dailyStateSets.Others || []}
                totalCount={dailyStateSets.totalCount || 0}
              /> */}
</div>

              <div id= "StateCounttable" style={{ marginTop: '20px', padding: '20px', }}>
  <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold', textAlign: 'left' }}>
    State Count Logged as {getCurrentDate()}
  </h2>

  {/* <h5 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold', textAlign: 'left' }}>
    Total Count: {dailyStateSets.totalCount || 0}
  </h5> */}
  <table
  id="tradetablenew"
  style={{
    width: '100%',
    border: '2px solid #ddd',
    borderCollapse: 'collapse',
  }}
>
  <thead>
    {/* <tr style={{ backgroundColor: '#f5f5f5' }}> */}
    <tr>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        S No
      </th>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        State
      </th>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        Exhibitors
      </th>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        Visitors
      </th>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        Seminar Attendees
      </th>
      <th
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
          fontWeight: 'bold',
        }}
      >
        Others
      </th>
    </tr>
  </thead>
  <tbody>
  {/* <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' }}></tr> */}
    {data2.map((row, index) => (
      <tr key={index} style={{  }}>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {index + 1}
        </td>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {row.StateName}
        </td>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {row.exhibitors}
        </td>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {row.Visitors}
        </td>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {row.SeminarAttendees}
        </td>
        <td
          style={{
            padding: '8px',
            textAlign: 'center',
            border: '1px solid #ddd',
          }}
        >
          {row.Others}
        </td>
      </tr>
    ))}
  </tbody>
  <tfoot>
    {/* <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}> */}
    <tr style={{ fontWeight: 'bold' }}>
      <td
        colSpan="2"
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
        }}
      >
        Total
      </td>
      <td
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
        }}
      >
        {data2.reduce((sum, row) => sum + row.exhibitors, 0)}
      </td>
      <td
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
        }}
      >
        {data2.reduce((sum, row) => sum + row.Visitors, 0)}
      </td>
      <td
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
        }}
      >
        {data2.reduce((sum, row) => sum + row.SeminarAttendees, 0)}
      </td>
      <td
        style={{
          padding: '10px',
          textAlign: 'center',
          border: '2px solid #ddd',
        }}
      >
        {data2.reduce((sum, row) => sum + row.Others, 0)}
      </td>
    </tr>
  </tfoot>
</table>

</div>

<div id="total-registration">
  <TotalRegistration
    Category={dailyBusCatSets.states1}
    Values={dailyBusCatSets.exhibitors1}
  />
</div>


        <div id="TableHeader" style={{ marginTop: '20px', padding: '20px' }}>
  <h2 style={{ marginBottom: '15px', fontSize: '20px', fontWeight: 'bold', textAlign: 'left' }}>
    Business Trade as {getCurrentDate()}
  </h2>

  <table
    id="tradetable"
    style={{ width: '100%', border: '3px solid #ddd', borderCollapse: 'collapse', height: 'auto' }}
  >
    <thead>
      <tr>
        <th
          style={{
            padding: '8px',
            textAlign: 'center',
            borderRight: '3px solid #ddd',
            borderBottom: '3px solid #ddd',
          }}
        >
          Business Trade
        </th>
        <th
          style={{
            padding: '8px',
            textAlign: 'center',
            borderBottom: '3px solid #ddd',
          }}
        >
          Total Exhibitors
        </th>
      </tr>
    </thead>
    <tbody>
      {data.map((row, index) => (
        <tr key={index}>
          <td
            style={{
              padding: '8px',
              border: row.exhibitors === highestValue
                ? '3px solid green'
                : row.exhibitors === lowestValue
                ? '3px solid red'
                : '1px solid #ddd',
              borderRight: '3px solid #ddd',
              textAlign: 'left',
            }}
          >
            {row.business}
          </td>
          <td
            style={{
              padding: '8px',
              border: row.exhibitors === highestValue
                ? '3px solid green'
                : row.exhibitors === lowestValue
                ? '3px solid red'
                : '1px solid #ddd',
              textAlign: 'center',
            }}
          >
            {row.exhibitors}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div
      id="PrintTableValues" style={{ marginTop: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px',}}
  >
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '10px' }}>Highest Value:</span>
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: 'green',
          border: '1px solid black',
        }}
      ></div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '10px' }}>Lowest Value:</span>
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: 'red',
          border: '1px solid black',
        }}
      ></div>
    </div>
  </div>

</div>


    </div>
  )
}

export default DashboardCRM
