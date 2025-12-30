"use client"

import React from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports

import StallSettingsFields from '@/views/dashboards/stallSettings/StallSettingsFields'

function page() {
  return (
    <>
    <Grid container spacing={6}>
    <Grid item xs={12} md={12} lg={12}>
      <StallSettingsFields />
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
      </Grid>
    </Grid>
  </>
  )
}

export default page
