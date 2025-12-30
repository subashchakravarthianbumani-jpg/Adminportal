import React from 'react'

import { Card, CardHeader, TextField, Autocomplete, Button, Grid } from '@mui/material'

import KitchenSink from './KitchenSink'
import StallSettingsFields from './StallSettingsFields'

function StallSettingsList({types}) {
  // alert(types);

  const handleSections = () => {
    switch (types) {
      case true:
        return <StallSettingsFields />
      case false:
        return   <KitchenSink />
      default:
        return <h1>Hello</h1>
    }
  }

  return (
    <>
    {handleSections()}

    </>
  )
}

export default StallSettingsList
