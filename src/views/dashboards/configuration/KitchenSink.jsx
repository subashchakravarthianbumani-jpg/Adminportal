'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'

import { Autocomplete, Button, Grid } from '@mui/material'
import axios from 'axios'
import { toast } from 'react-toastify'

// MUI Imports
import Fab from '@mui/material/Fab'

// Third-party Imports
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import classnames from 'classnames'

import Swal from 'sweetalert2'

import { Backdrop, CircularProgress } from '@mui/material'

// Icon Imports
import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

import { getLocalStorageItem } from '@/utils/storage'

// Data Imports

// Column Definitions
const columnHelper = createColumnHelper()


const hasInvalidTags = value => {
  const tagPattern = /<\/?[^>]+>/gi;

  if (tagPattern.test(value)) return true;

  const allowedPattern = /^[A-Za-z0-9 .,_-]*$/;

  return !allowedPattern.test(value);
};


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
  const [generalValue, setGeneralValue] = useState({
    id: '',
    title: ''
  })

  const [categoryValue, setCategoryValue] = useState(null)
  const [value, setValue] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [loading, setLoading] = useState(false)

  // States
  // const ConfigurationFields = [
  //   { title: 'Gender', id: 'gender' },
  //   { title: 'Community', id: 'Community' },
  //   { title: 'State', id: 'state' },
  //   { title: 'Registration Type', id: 'registertype' },
  //   { title: 'Referenced By', id: 'ReferenceBy' },
  //   { title: 'Disclaimer', id: 'Disclaimer' },
  // ]

  useEffect(() => {
    fetchSelfTypeList()
  }, [])

  const [configurationFields, setConfigurationFields] = useState([])

  const fetchSelfTypeList = async () => {
    setLoading(true)

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist?type=Self`)

      if (response.data.status && response.data.data.length > 0) {
        const arr = response.data.data.map(item => ({
          title: item.DropDownValue,
          id: item.Code
        }))

        setConfigurationFields(arr)
      }
    } catch (error) {
      console.log('Error loading self type list:', error)
    } finally {
      setLoading(false)
    }
  }

  // States
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [editDataSet, setEditDataSet] = useState({
    id: '',
    type: '',
    code: ''
  })

  const [deleteDataSet, setDeleteDataSet] = useState({
    id: '',
    type: ''
  })

  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  const [data, setData] = useState([])

  const [databaseDatas, setDatabaseDatas] = useState([])

  const [error, setError] = useState({ type: '', code: '' })

  const handleSubmit = async () => {
    setLoading(true)

    if (!validateFields()) {
      return
    }

    try {
      // Retrieve user info and token from local storage
      if (!userInfo || !token) {
        console.log('User information or token is missing')

        Swal.fire({
          icon: 'error',
          title: 'Authentication Required',
          text: 'Please log in again.'
        })

        return
      }

      // Construct payload
      const payload = {
        Code: editDataSet.code,
        Id: editDataSet.id || '',
        Type: generalValue?.id || 'Self', // Use optional chaining for safety
        Value: editDataSet.type || '',
        DependentId: '',
        SavedBy: userInfo.id,
        SavedUserName: userInfo.userName
      }

      // Make API request
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/configurationSaveUpdate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Handle successful response
      if (response?.data?.status === true) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Configuration saved successfully!'
        })
        fetchRegistrations()
        setEditDataSet({
          id: '',
          type: '',
          code: ''
        })
        console.log('Response:', response.data)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response?.data?.message || 'Failed to save configuration.'
        })

        console.log('API Response Error:', response.data)
      }
    } catch (error) {
      console.log('Error occurred during form submission:', error)

      const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.'

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setGeneralValue({
      id: '',
      title: ''
    })
    setCategoryValue(null)
    setValue('')
    setEditDataSet({
      id: '',
      type: '',
      code: ''
    })
    setData([])
  }

  const fetchRegistrations = () => {
    setLoading(true)
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist?type=${generalValue.id || 'null'}`)
      .then(response => {
        console.log(response.data.data)

        // console.log(response.data.data[0][0])

        if (response.data.status) {
          setDatabaseDatas(response.data.data)
          setData(response.data.data)

          // setVisitorDataSets(response.data.data[0][0]) // Example assuming the data structure
        } else {
          toast.error('No data found.')
          console.log('No data found.')

          // setError(response.data.message || 'No data found')
        }
      })
      .catch(err => {
        toast.error('Error fetching data:', err)
        console.log('Error fetching data:', err)

        // setError(err.response?.data?.message || 'Something went wrong')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Fetch data on component mount or filters change
  useEffect(() => {
    if (generalValue.id) {
      fetchRegistrations()
    }
  }, [generalValue.id])

  // Handlers
  const handleEdit = row => {
    setEditDataSet(() => ({
      id: row.Id,
      type: row.DropDownValue,
      code: row.Code
    }))
    console.log('Edit', row)
  }

  const handleCustomValueChange = event => {
    setEditDataSet({
      ...editDataSet,
      type: event.target.value
    })
  }

  const handleCustomValueChangeCode = event => {
    setEditDataSet({
      ...editDataSet,
      code: event.target.value
    })
  }

  const handleDelete = async row => {
    try {
      if (!userInfo || !token) {
        console.log('User information or token is missing')
        Swal.fire({
          icon: 'error',
          title: 'Authentication required',
          text: 'Please log in again.'
        })

        return
      }

      // Show confirmation dialog FIRST
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      })

      // Only proceed if user confirms
      if (result.isConfirmed) {
        setLoading(true)

        try {
          const payload = {
            Id: row.Id || '',
            IsActive: '0',
            SavedBy: userInfo.id,
            SavedUserName: userInfo.userName
          }

          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/configurationDelete`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response?.data?.status == true) {
            // Changed === to ==
            // fetchRegistrationsUpdate()
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Configuration deleted successfully.'
            })
            console.log('Response:', response.data)
            fetchRegistrations()
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed to delete',
              text: response?.data?.message || 'Failed to delete configuration.'
            })
            toast.error('API Response Error:', response.data)
            console.log('API Response Error:', response.data)
          }
        } catch (error) {
          console.log('Error occurred during deletion:', error)

          const errorMessage = error.response?.message || 'An unexpected error occurred. Please try again.'

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
          })
        } finally {
          setLoading(false) // Only called if confirmed
        }
      }
    } catch (error) {
      // This catches errors from the confirmation dialog itself
      console.log('Error showing confirmation dialog:', error)
    }
  }

  // Hooks
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Fab color='primary' aria-label='edit' size='small' onClick={() => handleEdit(row.original)}>
              <i className='ri-pencil-line' />
            </Fab>
            <Fab color='error' aria-label='edit' size='small' onClick={() => handleDelete(row.original)}>
              <i className='ri-close-line' />
            </Fab>
          </div>
        )
      }),
      columnHelper.accessor('Code', {
        cell: info => info.getValue(),
        header: 'Code'
      }),
      columnHelper.accessor('DropDownValue', {
        cell: info => info.getValue(),
        header: 'Value'
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

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
    if (table.getState().columnFilters[0]?.id === 'fullName') {
      if (table.getState().sorting[0]?.id !== 'fullName') {
        table.setSorting([{ id: 'fullName', desc: false }])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters[0]?.id])

  const validateFields = () => {
    let hasError = false

    let newError = { type: '', code: '' }

    if (!editDataSet.type) {
      newError.type = 'Value is required'
      hasError = true
    }

    if (!editDataSet.code) {
      newError.code = 'Code is required'
      hasError = true
    }

    setError(newError)

    return !hasError
  }

  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              value={generalValue || null} // Use the entire object for value
              options={configurationFields}
              onChange={(event, newValue) => {
                setGeneralValue(() => ({
                  id: newValue?.id || '', // Fallback to empty string if undefined
                  title: newValue?.title || '' // Use `title` instead of `type` for consistency
                }))

                if (!newValue) {
                  setData([])
                  setEditDataSet({ type: '', code: '' })
                  setCategoryValue({ id: '', title: '', type: '' }) // Reset second dropdown value
                }
              }}
              id='autocomplete-general'
              getOptionLabel={option => option?.title || ''} // Safeguard option
              isOptionEqualToValue={(option, value) => option?.id === value?.id} // Safeguard both option and value
              renderInput={params => <TextField {...params} label='Configuration ' />}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label='Value'
              value={editDataSet.type}

              // onChange={handleCustomValueChange}

               onChange={e => {
                  const value = e.target.value

                  if (hasInvalidTags(value)) {
                    toast.error('HTML, XML or Script tags are not allowed!')

                    return
                  }

                  handleCustomValueChange(e);
                }}
              error={!!error.type}
              helperText={error.type}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label='Code'
              value={editDataSet.code}

              // onChange={handleCustomValueChangeCode}

              onChange={e => {
                  const value = e.target.value

                  if (hasInvalidTags(value)) {
                    toast.error('HTML, XML or Script tags are not allowed!')

                    return
                  }

                  handleCustomValueChangeCode(e);
                }}
              fullWidth
              error={!!error.code}
              helperText={error.code}
            />
          </Grid>
          <Grid item xs={12} className='flex justify-end'>
            <Button variant='contained' color='primary' onClick={handleSubmit} style={{ marginRight: '8px' }}>
              Submit
            </Button>
            <Button variant='outlined' color='secondary' onClick={handleReset}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </div>
      <Card className='p-4'>
        <CardHeader
          className='flex flex-wrap gap-y-2 items-center justify-between'
          title='Configuration'
          action={
            <div className='flex items-center gap-x-4'>
              <div className='flex items-center justify-between px-4'></div>
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

        <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
          <CircularProgress color='inherit' />
        </Backdrop>
      </Card>
    </>
  )
}

export default KitchenSink
