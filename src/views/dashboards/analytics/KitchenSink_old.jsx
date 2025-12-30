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
import SyncLoader from 'react-spinners/SyncLoader'
import 'dotenv/config'

// Third-party Imports
import classnames from 'classnames'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import axios from 'axios'


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
import {  Backdrop, CircularProgress } from '@mui/material';

import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports

import styles from '@core/styles/table.module.css'

import { getLocalStorageItem } from '@/utils/storage'



// Data Imports
// import defaultData from './data'

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
  const [getStateId, setGetStateId] = useState('')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState([])

  const [originalData, setOriginalData] = useState([])

  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [stateDatas, setStateDatas] = useState([])
  const [districtDatas, setDistrictDatas] = useState([])

  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Query parameters state
  const [filters, setFilters] = useState({
    RegistrationType: 'VISITOR',
    IsActive: 1
  })

  const [stateDataSets, setStateDataSets] = useState({
    type: 'state',
    IsActive: 1
  })

  const [districtDataSets, setDistrictDataSets] = useState({
    type: 'district',
    IsActive: 1,
    DependentId: getStateId
  })

  // Fetch registration data
  const fetchRegistrations = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getLocalStorageItem('accessToken') // Replace with the actual token

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/registrationlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: filters // Pass filters as query parameters
      })

      const stateData = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: stateDataSets // Pass filters as query parameters
      })

      const districtData = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          type: 'district',
          IsActive: 1,
          DependentId: getStateId // Pass the selected state's ID
        }
      })

      const categoryDatas = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          type: 'visitorcategory',
          IsActive: 1
        }
      })

      if (response.data.status && stateData.data.status && districtData.data.status && categoryDatas.data.status) {
        setCategories(
          categoryDatas.data.data.map(item => ({
            id: item.Id,
            value: item.DropDownValue,
            label: item.DropDownValue
          }))
        )

        setStateDatas(
          stateData.data.data.map(item => ({
            id: item.Id,
            label: item.DropDownValue
          }))
        )
        setDistrictDatas(
          districtData.data.data.map(item => ({
            id: item.Id,
            label: item.DropDownValue
          }))
        )
        setOriginalData(
          response.data.data.map(item => ({
            firstname: item.FirstName,
            lastname: item.LastName,
            registrationno: item.RegitrationNo,
            category: item.VisitorCategoryName,
            emailaddress: item.Email,
            phonenumber: item.Phone,
            age: item.Age,
            state: item.StateName,
            district: item.DistrictName,
            referenceByName: item.ReferenceByName,
            visitorCategoryName: item.VisitorCategoryName,
            purposeOfVisit: item.PurposeOfVisit,
            gender: item.GenderName
          }))
        )

        // Example fix if API uses camelCase:
        setData(
          response.data.data.map(item => ({
            firstname: item.FirstName,
            lastname: item.LastName,
            registrationno: item.RegitrationNo,
            category: item.VisitorCategoryName,
            emailaddress: item.Email,
            phonenumber: item.Phone,
            age: item.Age,
            state: item.StateName,
            district: item.DistrictName,
            referenceByName: item.ReferenceByName,
            visitorCategoryName: item.VisitorCategoryName,
            purposeOfVisit: item.PurposeOfVisit,
            gender: item.GenderName
          }))
        )

        setTotalCount(response.data.totalCount)
      } else {
        setError(response.data.message || 'No data found')
      }
    } catch (err) {
      console.log('Error fetching data:', err)
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchRegistrations()
  }, [filters, getStateId])

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
      columnHelper.accessor('gender', {
        cell: info => info.getValue(),
        header: 'Gender'
      }),
      columnHelper.accessor('registrationno', {
        cell: info => info.getValue(),
        header: 'Registration No'
      }),
      columnHelper.accessor('category', {
        cell: info => info.getValue(),
        header: 'Category'
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
      ,
      columnHelper.accessor('purposeOfVisit', {
        cell: info => info.getValue(),
        header: 'Purpose Of Visit'
      }),
      columnHelper.accessor('visitorCategoryName', {
        cell: info => info.getValue(),
        header: 'Visitor Category'
      }),
      columnHelper.accessor('state', {
        cell: info => info.getValue(),
        header: 'State'
      }),
      columnHelper.accessor('district', {
        cell: info => info.getValue(),
        header: 'District'
      }),
      columnHelper.accessor('referenceByName', {
        cell: info => info.getValue(),
        header: 'Reference By'
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const exportToPdf = () => {

    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)

            const docWidth = 450 // A3 width in landscape mode
            const docHeight = 297 // A3 height in landscape mode

            const doc = new jsPDF('landscape', 'mm', [docWidth, docHeight])


        // Add title or header
        doc.text('Visitor Details', 10, 10)


    // Format data for the table district state age email phone category registrationno lastname firstname
    const tableData = filteredData.map(item => [
      item.firstname,
      item.lastname,
      item.registrationno,
      item.category,
      item.gender,
      item.emailaddress,
      item.phonenumber,
      item.age,
      item.state,
      item.district,
      item.referenceByName,
      item.purposeOfVisit,
      item.visitorCategoryName,


    ])

    // Define column headers
    const tableHeaders = [
      'First Name',
      'Last Name',
      'Registration No',
      'Category',
      'Gender',
      'Email Address',
      'Phone Number',
      'Age',
      'State',
      'District',
      'Reference By',
      'Purpose Of Visit',
      'Visitor Category'
    ]

    // Add table
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20
    })

    // Save the PDF
    doc.save('Visitor Details.pdf')
  }

  const exportToExcel = () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);


    const tableHeaders = [
      'First Name',
      'Last Name',
      'Registration No',
      'Category',
      'Gender',
      'Email Address',
      'Phone Number',
      'Age',
      'State',
      'District',
      'Reference By',
      'Purpose Of Visit',
      'Visitor Category'
    ];

    const tableData = filteredData.map(item => [
      item.firstname,
      item.lastname,
      item.registrationno,
      item.category,
      item.gender,
      item.emailaddress,
      item.phonenumber,
      item.age,
      item.state,
      item.district,
      item.referenceByName,
      item.purposeOfVisit,
      item.visitorCategoryName,
    ]);

    // Convert the data to a worksheet

   // Combine headers and data
       const completeData = [tableHeaders, ...tableData];

       // Convert the data to a worksheet
       const worksheet = XLSX.utils.aoa_to_sheet(completeData);

       // Create a new workbook
       const workbook = XLSX.utils.book_new();

       // Append the worksheet to the workbook
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

       // Trigger download
       XLSX.writeFile(workbook, 'Visitor Details.xlsx');
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
    const filteredData = originalData.filter(item => {
      return (
        (categoryTypeFilter.length > 0
          ? categoryTypeFilter.some(filter => filter.toLowerCase() === item.category?.toLowerCase())
          : true) &&
        (stateFilter ? item.state?.toLowerCase() === stateFilter.toLowerCase() : true) &&
        (districtFilter ? item.district?.toLowerCase() === districtFilter.toLowerCase() : true)
      )
    })

    setData(filteredData)
  }, [categoryTypeFilter, stateFilter, districtFilter, originalData])

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

  const handleChange = event => {
    setCategoryTypeFilter(event.target.value) // Always an array
  }

  const handleDelete = (valueToDelete, event) => {
    event.stopPropagation() // Prevent dropdown from opening
    setCategoryTypeFilter(prev => prev.filter(item => item !== valueToDelete)) // Remove item from selected filter
  }

  return (
    <Card>
      <CardHeader
        className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
        title='Visitors Details'
        action={
          <div className='flex items-center gap-x-4'>
            <div className='flex items-center justify-between px-4'>
              <div className='flex gap-x-4'>
                <Button variant='contained' className='text-white px-2 py-2 rounded-md' onClick={exportToExcel}>
                  Excel
                </Button>
                <Button variant='contained' className='text-white px-2 py-2 rounded-md' onClick={exportToPdf}>
                  PDF
                </Button>
              </div>
            </div>
            {/* Dropdowns for Registration Type, State, and District */}
            <Select
              multiple
              value={categoryTypeFilter}
              onChange={handleChange}
              displayEmpty
              renderValue={selected => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selected.length === 0 ? (
                    <em>Category</em>
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
              sx={{ minWidth: 350, height: 45, fontSize: '0.875rem', maxWidth: '100%' }}
            >
              <MenuItem disabled value=''>
                <em>Category</em>
              </MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.value}>
                  <ListItemText primary={category.label} />
                </MenuItem>
              ))}
            </Select>
            <Select
              value={stateFilter || ''}
              onChange={e => {
                const selectedItem = stateDatas.find(item => item.label === e.target.value)
                const stateId = selectedItem?.id || null

                setStateFilter(e.target.value) // Update state filter
                setGetStateId(stateId) // Update selected state ID
              }}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{
                height: 45,
                fontSize: '0.875rem',
                padding: 0
              }}
            >
              <MenuItem value=''>State</MenuItem>
              {stateDatas.map(item => (
                <MenuItem key={item.id} value={item.label}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={districtFilter || ''}
              onChange={e => {
                const selectedItem = districtDatas.find(item => item.label === e.target.value)

                setDistrictFilter(e.target.value) // Update district filter
              }}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{
                height: 45,
                fontSize: '0.875rem',
                padding: 0
              }}
            >
              <MenuItem value=''>District</MenuItem>
              {districtDatas.map(item => (
                <MenuItem key={item.id} value={item.label}>
                  {item.label}
                </MenuItem>
              ))}
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
                          {/* {header.column.getCanFilter() && <Filter column={header.column} table={table} />} */}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
                    <p>No data found</p>
                  </div>
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

       {/* Full-Screen Loader */}
       <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

    </Card>
  )
}

export default KitchenSink
