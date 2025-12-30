"use client"

import React from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import ConfigurationFields from '@/views/dashboards/configuration/ConfigurationFields'

function page() {
  return (
    <>
    <Grid container spacing={6}>
    <Grid item xs={12} md={12} lg={12}>
      <ConfigurationFields />
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
      {/* <KitchenSink/> */}
      </Grid>
    </Grid>
  </>
  )
}

export default page
