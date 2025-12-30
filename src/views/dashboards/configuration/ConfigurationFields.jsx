import React, { useState, useMemo, useEffect } from 'react'

import { Card, CardHeader, TextField, Autocomplete, Button, Grid } from '@mui/material'
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'

import FormControlLabel from '@mui/material/FormControlLabel'

import TablePagination from '@mui/material/TablePagination'

import IconButton from '@mui/material/IconButton'

// MUI Imports
import Fab from '@mui/material/Fab'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

import KitchenSink from './KitchenSink'
import ConfigurationList from './ConfigurationList'

// Icon Imports
import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

// Data Imports
import defaultData from './data'

// Column Definitions
const columnHelper = createColumnHelper()

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// A debounced input react component
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} size='small' value={value} onChange={e => setValue(e.target.value)} />
}

export default function ConfigurationFields() {

  const [isDependent, setIsDependent] = useState(false) // State for the switch toggle
  // States

  const handleSwitchChange = event => {
    setIsDependent(event.target.checked)
  }

  return (
    <Card>
      <CardHeader
        className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
        title={isDependent ? 'Dependent' : 'Configuration Records'}
        action={
          <FormControlLabel
            control={<Switch checked={isDependent} onChange={handleSwitchChange} />}
            label='Dependent'
          />
        }
      />

      <ConfigurationList types={isDependent}/>

    </Card>
  )
}
