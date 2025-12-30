/* eslint-disable react/jsx-no-undef */
'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import { Checkbox, ListItemText, Chip, Box } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

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

const KitchenSink = () => {
  // States
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [registerTypeFilter, setRegisterTypeFilter] = useState([])

  const [data, setData] = useState(() => defaultData)

  const categories = [
    { value: 'Visitor', label: 'Visitor' },
    { value: 'Seminar Attendee', label: 'Seminar Attendee' },
    { value: 'Others', label: 'Others' }
  ]

  // Hooks

  // First Name,Last Name,Registration No,Registration Type,Email Address,Phone Number,Age,State,District
  const columns = useMemo(
    () => [
      columnHelper.accessor('firstname', {
        cell: info => info.getValue(),
        header: 'First Name'
      }),
      columnHelper.accessor('lastname', {
        cell: info => info.getValue(),
        header: 'Last Name'
      }),
      columnHelper.accessor('registrationno', {
        cell: info => info.getValue(),
        header: 'Registration No'
      }),
      columnHelper.accessor('registrationType', {
        cell: info => info.getValue(),
        header: 'Registration Type'
      }),
      columnHelper.accessor('emailaddress', {
        cell: info => info.getValue(),
        header: 'Email'
      }),
      columnHelper.accessor('phonenumber', {
        cell: info => info.getValue(),
        header: 'Phone Number'
      }),
      columnHelper.accessor('age', {
        cell: info => info.getValue(),
        header: 'Age'
      }),
      columnHelper.accessor('state', {
        cell: info => info.getValue(),
        header: 'State'
      }),
      columnHelper.accessor('district', {
        cell: info => info.getValue(),
        header: 'District'
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const exportToPdf = () => {
    const doc = new jsPDF()

    // Add title or header
    doc.text('Exported Data', 10, 10)

    // Format data for the table
    const tableData = data.map(item => [
      item.firstname,
      item.lastname,
      item.registrationno,
      item.registrationType,
      item.emailaddress,
      item.phonenumber,
      item.age,
      item.state,
      item.district
    ])

    // Define column headers
    const tableHeaders = [
      'First Name',
      'Last Name',
      'Registration No',
      'Registration Type',
      'Email Address',
      'Phone Number',
      'Age',
      'State',
      'District'
    ]

    // Add table
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20
    })

    // Save the PDF
    doc.save('Register.pdf')
  }

  const exportToExcel = () => {
    // Convert the data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Trigger download
    XLSX.writeFile(workbook, 'Register.xlsx')
  }

  const Filter = ({ column, table }) => {
    // Vars
    const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id)
    const columnFilterValue = column.getFilterValue()

    return typeof firstValue === 'number' ? (
      <div className='flex gap-x-2'>
        <TextField
          fullWidth
          type='number'
          size='small'
          sx={{ minInlineSize: 100, maxInlineSize: 125 }}
          value={columnFilterValue?.[0] ?? ''}
          onChange={e => column.setFilterValue(old => [e.target.value, old?.[1]])}
          placeholder={`Min ${column.getFacetedMinMaxValues()?.[0] ? `(${column.getFacetedMinMaxValues()?.[0]})` : ''}`}
        />
        <TextField
          fullWidth
          type='number'
          size='small'
          sx={{ minInlineSize: 100, maxInlineSize: 125 }}
          value={columnFilterValue?.[1] ?? ''}
          onChange={e => column.setFilterValue(old => [old?.[0], e.target.value])}
          placeholder={`Max ${column.getFacetedMinMaxValues()?.[1] ? `(${column.getFacetedMinMaxValues()?.[1]})` : ''}`}
        />
      </div>
    ) : (
      <TextField
        fullWidth
        size='small'
        sx={{ minInlineSize: 100 }}
        value={columnFilterValue ?? ''}
        onChange={e => column.setFilterValue(e.target.value)}
        placeholder='Search...'
      />
    )
  }

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      columnFilters,
      globalFilter
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  useEffect(() => {
    const filteredData = defaultData.filter(item => {
      return (
        (registerTypeFilter.length > 0
          ? registerTypeFilter.some(register => register.toLowerCase() === item.registrationType.toLowerCase())
          : true) &&
        (stateFilter ? item.state.toLowerCase() === stateFilter.toLowerCase() : true) &&
        (districtFilter ? item.district.toLowerCase() === districtFilter.toLowerCase() : true)
      );
    });

    setData(filteredData);
  }, [registerTypeFilter, stateFilter, districtFilter]);


  useEffect(() => {
    if (table.getState().columnFilters[0]?.id === 'fullName') {
      if (table.getState().sorting[0]?.id !== 'fullName') {
        table.setSorting([{ id: 'fullName', desc: false }])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters[0]?.id])

  const handleFilterChange = (filterType, value) => {
    // Update your filter state logic based on filterType and value
  }

  const districtOptions = useMemo(() => {
    const stateToDistrictMap = {
      Tamilnadu: ['Chennai', 'Coimbatore', 'Madurai'],
      Kerala: ['Kochi', 'Trivandrum', 'Kozhikode'],
      Karnataka: ['Bangalore', 'Mysore', 'Hubli']
    }

    return stateToDistrictMap[stateFilter] || []
  }, [stateFilter])

  const handleChange = event => {
    setRegisterTypeFilter(event.target.value) // Always an array
  }

  const handleDelete = (valueToDelete, event) => {
    event.stopPropagation() // Prevent dropdown from opening
    setRegisterTypeFilter(prev => prev.filter(item => item !== valueToDelete)) // Remove item from selected filter
  }

  return (
    <Card>
      <CardHeader
        className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
        title='Registration'
        action={
          <div className='flex items-center gap-x-4'>
            <div className='flex items-center justify-between px-4'>
              <div className='flex gap-x-4'>
                <Button variant='contained' className='text-white px-2 py-1 rounded-md' onClick={exportToExcel}>
                  Excel
                </Button>
                <Button variant='contained' className='text-white px-2 py-1 rounded-md' onClick={exportToPdf}>
                  PDF
                </Button>
              </div>
            </div>
            {/* Dropdowns for Registration Type, State, and District */}
            <Select
              multiple
              value={registerTypeFilter}
              onChange={handleChange}
              displayEmpty
              renderValue={selected => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selected.length === 0 ? (
                    <em>Registration Type</em>
                  ) : (
                    selected.map(value => (
                      <Chip
                        key={value}
                        label={categories.find(cat => cat.value === value)?.label}
                        size='small'
                        onDelete={event => handleDelete(value, event)} // Pass event to stop propagation
                      />
                    ))
                  )}
                </Box>
              )}
              sx={{ minWidth: 300,height:35,fontSize:'0.875rem', maxWidth: '100%' }}
            >
              <MenuItem disabled value=''>
                <em>register</em>
              </MenuItem>
              {categories.map(register => (
                <MenuItem key={register.value} value={register.value}>
                  <ListItemText primary={register.label} />
                </MenuItem>
              ))}
            </Select>
            <Select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              displayEmpty
              className='border rounded-md px-3 py-2 '
              sx={{
                height: 35, // Adjust the height as needed
                fontSize: '0.875rem', // Optional: Decrease the font size for better fit
                padding: 0 // Optional: Adjust padding to further control the size
              }}
            >
              <MenuItem value=''>State</MenuItem>
              <MenuItem value='Tamilnadu'>Tamilnadu</MenuItem>
              <MenuItem value='Kerala'>Kerala</MenuItem>
              <MenuItem value='Karnataka'>Karnataka</MenuItem>
            </Select>

            <Select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{
                height: 35, // Adjust the height as needed
                fontSize: '0.875rem', // Optional: Decrease the font size for better fit
                padding: 0 // Optional: Adjust padding to further control the size
              }}
            >
              <MenuItem value=''>District</MenuItem>
              <MenuItem value='Chennai'>Chennai</MenuItem>
              <MenuItem value='Coimbatore'>Coimbatore</MenuItem>
              <MenuItem value='Madurai'>Madurai</MenuItem>
            </Select>

            {/* Search Input */}
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search all columns...'
              className='border rounded-md px-3 py-2 flex-grow'
            />
          </div>
        }
      />
      {/* Buttons for Excel and PDF export */}

      <div className='overflow-x-auto'>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronRight fontSize='1.25rem' className='-rotate-90' />,
                              desc: <ChevronRight fontSize='1.25rem' className='rotate-90' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                          {header.column.getCanFilter() && <Filter column={header.column} table={table} />}
                        </>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          {table.getFilteredRowModel().rows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map(row => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => {
                      return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    })}
                  </tr>
                )
              })}
            </tbody>
          )}
        </table>
      </div>
      <TablePagination
        rowsPerPageOptions={[7, 10, 25, { label: 'All', value: data.length }]}
        component='div'
        className='border-bs'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        SelectProps={{
          inputProps: { 'aria-label': 'rows per page' }
        }}
        onPageChange={(_, page) => {
          table.setPageIndex(page)
        }}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />
    </Card>
  )
}

export default KitchenSink
