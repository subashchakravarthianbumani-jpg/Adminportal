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
import { Backdrop, CircularProgress } from '@mui/material'

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
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('')
  const [sorting, setsortingFilter] = useState([])

  const [originalData, setOriginalData] = useState([])

  const [data, setData] = useState([])
  const [categories, setCategories] = useState([])
  const [stateDatas, setStateDatas] = useState([])
  const [districtDatas, setDistrictDatas] = useState([])

  const [filteredCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [skip, setSkip] = useState(0)
   const [take, setTake] = useState(10)

  // Query parameters state
  const [filtersnone, setFilters] = useState({
    RegistrationType: 'OTHERS',
    IsActive: 1
  })

  const [stateDataSets, setStateDataSets] = useState({
    type: 'state',
    IsActive: 1
  })

  const [{ pageIndex, pageSize }, setPagination] = useState({
      pageIndex: 0,
      pageSize: 10
    })

  // Fetch registration data
  const fetchRegistrations = async (pageIndex = 0, pageSize = 10) => {
    setLoading(true)
    setError(null)

    try {
      const token = process.env.NEXT_PUBLIC_API_TOKEN || getLocalStorageItem('accessToken')

      const headers = { Authorization: `Bearer ${token}` }

      const skip = pageIndex * pageSize
      const take = pageSize

      const sortingState = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : {}

      const sortingPayload = sortingState.id
        ? {
            fieldName: sortingState.id,
            sort: sortingState.desc ? 'DESC' : 'ASC'
          }
        : {}

      const whereCondition = {
        RegistrationType: ['OTHERS'],
        IsActive: [1]
      }

      if (getStateId) {
        whereCondition.State = getStateId
      }

      if (districtFilter) {
        whereCondition.District = districtFilter
      }

      if (categoryTypeFilter) {
        whereCondition.OthersCategory = categoryTypeFilter
      }

      const requestData = {
        skip,
        take,
        searchString: globalFilter || '',
        sorting: sortingPayload,
        columnSearch: [],
        where: whereCondition
      }

      console.log('nandhu:', requestData)

      console.log('FINAL SENT DATA:', JSON.stringify(requestData, null, 2))

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/registrationlist`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
          type: 'OTHERSCATEGORY',
          IsActive: 1
        }
      })

      if (response.data.status && stateData.data.status && districtData.data.status && categoryDatas.data.status) {
        // setCategories(
        //   categoryDatas.data.data.map(item => ({
        //     value: item.DropDownValue,
        //     label: item.DropDownValue
        //   }))
        // )

        setCategories(
          categoryDatas.data.data.map(item => ({
            label: item.DropDownValue,
            value: item.Id // <- send Id when selected
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
            registrationno: item.RegistrationNo,
            category: item.OthersCategoryName,
            emailaddress: item.Email,
            phonenumber: item.Phone,
            age: item.Age,
            state: item.StateName,
            district: item.DistrictName,
            gender: item.GenderName
          }))
        )

        // Example fix if API uses camelCase:
        setData(
          response.data.data.map(item => ({
            firstname: item.FirstName,
            lastname: item.LastName,
            registrationno: item.RegistrationNo,
            category: item.OthersCategoryName,
            emailaddress: item.Email,
            phonenumber: item.Phone,
            age: item.Age,
            state: item.StateName,
            district: item.DistrictName,
            gender: item.GenderName
          }))
        )

        setTotalCount(response.data.filteredCount)
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

  useEffect(() => {
    fetchRegistrations()
  }, [filtersnone, getStateId])

  // Hooks

  // First Name,Last Name,Registration No,Registration Type,Email Address,Phone Number,Age,State,District
  const columns = useMemo(
    () => [
      columnHelper.accessor('registrationno', {
        cell: info => info.getValue(),
        header: 'Registration No'
      }),
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
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)

    const docWidth = 450 // A3 width in landscape mode
    const docHeight = 297 // A3 height in landscape mode

    const doc = new jsPDF('landscape', 'mm', [docWidth, docHeight])

    // Add title or header
    doc.text('Exported Data', 10, 10)

    // Format data for the table district state age email phone category registrationno lastname firstname
    const tableData = filteredData.map(item => [
      item.firstname,
      item.lastname,
      item.gender,
      item.registrationno,
      item.category,
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
      'Gender',
      'Registration No',
      'Category',
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
    doc.save('Others Details.pdf')
  }

  const exportToExcel = () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)

    const tableHeaders = [
      'First Name',
      'Last Name',
      'Gender',
      'Registration No',
      'Category',
      'Email Address',
      'Phone Number',
      'Age',
      'State',
      'District'
    ]

    const tableData = filteredData.map(item => [
      item.firstname,
      item.lastname,
      item.gender,
      item.registrationno,
      item.category,
      item.emailaddress,
      item.phonenumber,
      item.age,
      item.state,
      item.district
    ])

    // Convert the data to a worksheet

    // Combine headers and data
    const completeData = [tableHeaders, ...tableData]

    // Convert the data to a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(completeData)

    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Trigger download
    XLSX.writeFile(workbook, 'Others Details.xlsx')
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
      globalFilter,
      sorting
    },
    setStateDataSets: setStateFilter,
    districtFilter: setDistrictFilter,
    onStateFilterChange: setStateFilter,
    onDistrictFilterChange: setDistrictFilter,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setsortingFilter, // capture sorting click events
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Initial data load — after table is created
  useEffect(() => {
    if (!table) return
    fetchRegistrations(0, table.getState().pagination.pageSize || 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search
  useEffect(() => {
    if (!table) return

    const delay = setTimeout(() => {
      fetchRegistrations(0, table.getState().pagination.pageSize || 10)
    }, 500)

    return () => clearTimeout(delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter])

  // Debounce sorting change
  useEffect(() => {
    if (!table) return

    const delay = setTimeout(() => {
      const { pageIndex, pageSize } = table.getState().pagination

      fetchRegistrations(pageIndex, pageSize)
    }, 500)

    return () => clearTimeout(delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {
    // if (!getStateId) return

    // fetch district list based on state
    fetchRegistrations(table.getState().pagination.pageIndex, table.getState().pagination.pageSize)
  }, [getStateId])

  useEffect(() => {
    fetchRegistrations(table.getState().pagination.pageIndex, table.getState().pagination.pageSize)
  }, [districtFilter])

  useEffect(() => {
    // if (!categoryTypeFilter) return

    // fetch district list based on state
    fetchRegistrations(table.getState().pagination.pageIndex, table.getState().pagination.pageSize)
  }, [categoryTypeFilter])

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
        title='Others Details'
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
              value={categoryTypeFilter}
              onChange={e => setCategoryTypeFilter(e.target.value)}
              displayEmpty
              size='small'
              sx={{ minWidth: 250 }}
            >
              <MenuItem value=''>
                <em>Select Category</em>
              </MenuItem>

              {categories.map(c => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={getStateId || ''}
              onChange={e => {
                const selectedStateId = e.target.value

                setGetStateId(selectedStateId)
                setDistrictFilter('') // reset district
              }}
              displayEmpty
              sx={{
                minWidth: 200,
                height: 45,
                fontSize: '0.875rem'
              }}
            >
              <MenuItem value=''>
                <em>State</em>
              </MenuItem>

              {stateDatas.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={districtFilter || ''}
              onChange={e => {
                const selectedDistrictId = e.target.value

                setDistrictFilter(selectedDistrictId)

                fetchRegistrations(table.getState().pagination.pageIndex, table.getState().pagination.pageSize)
              }}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{ height: 45, fontSize: '0.875rem', padding: 0 }}
            >
              <MenuItem value=''>
                <em>District</em>
              </MenuItem>

              {districtDatas.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>

            {/* Search Input */}
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search all columns...'
              className='border rounded-md px-3 flex-grow'
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
                            onClick={() => {
                              const isDesc = sorting?.[0]?.id === header.column.id ? !sorting[0].desc : false

                              setsortingFilter([{ id: header.column.id, desc: isDesc }])
                            }}
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
        rowsPerPageOptions={[
          { label: '10', value: 10 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '500', value: 500 },
          { label: 'All', value: filteredCount }
        ]}
        component='div'
        count={filteredCount || 0}
        page={Math.floor(skip / take)}
        rowsPerPage={take}
        onPageChange={(_, newPage) => {
          console.log('Page changed to:', newPage)

          setSkip(newPage * take)
          table.setPageIndex(newPage)

          // Pass pageIndex and pageSize
          fetchRegistrations(newPage, take)
        }}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value)

          console.log('Page size changed to:', newSize)

          setSkip(0)
          setTake(newSize)
          table.setPageSize(newSize)
          table.setPageIndex(0)

          // Pass pageIndex (0) and new pageSize
          fetchRegistrations(0, newSize)
        }}
        labelDisplayedRows={() => {
          const count = filteredCount || 0
          const start = count === 0 ? 0 : skip + 1
          const end = Math.min(skip + take, count)

          return `${start}–${end} of ${count}`
        }}
      />
      {/* Full-Screen Loader */}
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    </Card>
  )
}

export default KitchenSink
