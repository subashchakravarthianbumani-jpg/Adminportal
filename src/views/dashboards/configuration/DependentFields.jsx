'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'

import IconButton from '@mui/material/IconButton'

import { toast } from 'react-toastify'

import Swal from 'sweetalert2'

import { Autocomplete, Button, Grid } from '@mui/material'
import axios from 'axios'

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

import { Backdrop, CircularProgress } from '@mui/material'


// Icon Imports
import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

// Data Imports
import defaultData from './data'

import { getLocalStorageItem } from '@/utils/storage'



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

const DependentFields = () => {
  const [loading, setLoading] = useState(false)

  const [generalValue, setGeneralValue] = useState({
    id: '',
    type: '',
    idValue: ''
  })

  const [categoryValue, setCategoryValue] = useState({
    id: '',
    type: '',
    title: ''
  })

  console.log(generalValue)
  console.log(categoryValue)

  const [value, setValue] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [isDependent, setIsDependent] = useState(true) // State for the switch toggle
  // States

  // const top100Films = [
  //   { title: 'State', id: 'state' }
  // ]

  const [top100Films, SetTop100Films] = useState([{ title: 'State', id: 'state' }])

  const [firstDropdowns, setFirstDropdowns] = useState([{ title: '', id: '', idValue: '' }])

  const [secondDropdown, setSecondDropdown] = useState([
    {
      id: '',
      title: ''
    }
  ])

  // States
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')

  const [editDataSet, setEditDataSet] = useState({
    id: '',
    type: '',
    code: ''
  })

  const [error, setError] = useState({ type: '', code: '' });

  const [data, setData] = useState([])

  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  // Handlers

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist?type=Dependent`)
      .then(response => {
        if (response.data.status && Array.isArray(response.data.data)) {
          console.log(response.data.data)

          const newFilms = response.data.data.map(value => ({
            id: value.DropDownValue,
            title: value.DropDownValue,
            idValue: value.Id
          }))

          setFirstDropdowns(prevFilms => {
            const existingIds = new Set(prevFilms.map(film => film.id))
            const uniqueNewFilms = newFilms.filter(film => !existingIds.has(film.id))

            return [...prevFilms, ...uniqueNewFilms]
          })
        } else {
          console.log('No data found or data is not in the expected format.')
        }
      })
      .catch(err => {
        toast.error('Error fetching data:', err)
        console.log('Error fetching data:', err)
      }).finally(() => {
      setLoading(false);
    });
  }, [])

  console.log(top100Films)

  const fetchRegistrations = () => {
    setLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist?type=${generalValue.id || 'null'}`)
      .then(response => {
        console.log(response.data.data)

        // console.log(response.data.data)

        if (response.data.status) {
          setSecondDropdown(
            response.data.data.map(e => ({
              id: e.Id,
              title: e.DropDownValue,
              type: e.DropDownValue
            }))
          )

          // setVisitorDataSets(response.data.data[0][0]) // Example assuming the data structure
        } else {
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
        setLoading(false);
      })
  }

  const fetchRegistrationsUpdate = () => {
    if (categoryValue.id) {
      setLoading(true);
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
          params: {
            type: '', // If 'type' is not needed, consider removing it
            DependentId: categoryValue.id
          }
        })
        .then(response => {
          console.log(response.data.data)

          if (response.data.status) {
            setData(response.data.data)


            console.log(response.data.data)
          } else {
            console.log('No data found.')
          }
        })
        .catch(err => {
          toast.error('Error fetching data:', err)
          console.log('Error fetching data:', err)
        }).finally(() => {
      setLoading(false);
    });
    }
  }

  useEffect(() => {
    fetchRegistrationsUpdate()
  }, [categoryValue])

  console.log(categoryValue)

  // Fetch data on component mount or filters change
  useEffect(() => {
    if (generalValue.id) {
      fetchRegistrations()
    }
  }, [generalValue.id])

  const handleCategoryChange = (event, newValue) => {
    setCategoryValue(newValue)
  }

  const handleValueChange = (event, newValue) => {
    setValue(newValue)
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

  const handleSubmit = async () => {
    setLoading(true);

    if (!validateFields()) {
      return;
    }

    try {
      if (!userInfo || !token) {
        toast.error('User information or token is missing')
        console.log('User information or token is missing')

        Swal.fire({
          icon: 'error',
          title: 'Authentication required',
          text: 'Please log in again.'
        })

        return
      }

      const { id: editId, type: editType, code: editCode } = editDataSet || {}
      const { id: categoryId, type: categoryType } = categoryValue || {}
      const { id: userId, userName } = userInfo || {}

      const payload = {
        Code: editCode || '',
        Id: editId || '',
        Type: categoryType || generalValue.id || 'Dependent',
        Value: editType || '',
        DependentId: categoryId || generalValue.idValue,
        SavedBy: userId || '',
        SavedUserName: userName || ''
      }

      console.log('Payload being sent:', payload)

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/configurationSaveUpdate`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response?.data?.status === true) {
        setLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Configuration saved successfully!'
        })

        setEditDataSet({
          id: '',
          type: '',
          code: ''
        })

        // Fetch and re-render updated data
        fetchRegistrationsUpdate()
        console.log('Response:', response.data)
      } else {
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: response?.data?.message || 'Failed to save configuration.'
        })
        toast.error('API Response Error:', response.data)
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
    }finally {
    setLoading(false);
  }

    console.log('Submitted:', {
      generalValue,
      categoryValue,
      value: editDataSet,
      customValue
    })
  }

  console.log(generalValue)

  const handleReset = () => {
    setGeneralValue({
      id: '',
      type: '',
      idValue: ''
    })
    setCategoryValue({
      id: '',
      title: '',
      type: ''
    })
    setValue('')
    setCustomValue('')
  }

  console.log(categoryValue)
  console.log(generalValue)

  const handleGeneralChange = (event, newValue) => {
    console.log('General:', newValue)

    setGeneralValue(newValue)
  }

  // Handlers
  const handleEdit = row => {
    setEditDataSet(() => ({
      id: row.Id,
      type: row.DropDownValue,
      code: row.Code
    }))
    console.log('Edit', row)
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

    // Only start loading AFTER user confirms
    if (result.isConfirmed) {
      setLoading(true) // Move this here

      const payload = {
        Id: row.Id || '',
        IsActive: '0',
        SavedBy: userInfo.id,
        SavedUserName: userInfo.userName
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/apps/configurationDelete`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response?.data?.status === true) {
        fetchRegistrationsUpdate()
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Configuration deleted successfully.'
        })
        fetchRegistrations()
        console.log('Response:', response.data)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to delete',
          text: response?.data?.message || 'Failed to delete configuration.'
        })
        toast.error('API Response Error:', response.data)
        console.log('API Response Error:', response.data)
      }
    }
  } catch (error) {
    console.log('Error occurred during deletion:', error)

    const errorMessage =
      error.response?.data?.message || 'An unexpected error occurred. Please try again.'

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMessage
    })
  } finally {
    setLoading(false)
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
    let hasError = false;
    let newError = { type: '', code: '' };

    if (!editDataSet.type) {
      newError.type = 'Value is required';
      hasError = true;
    }

    if (!editDataSet.code) {
      newError.code = 'Code is required';
      hasError = true;
    }

    setError(newError);

return !hasError;
  };




  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              value={generalValue}
              options={firstDropdowns}
              onChange={(event, newValue) => {
                setGeneralValue(newValue || { id: '', type: '', idValue: '' })

                if (!newValue) {
                  fetchRegistrations()
                  setSecondDropdown([]) // Clear second dropdown options
                  setCategoryValue({ id: '', title: '', type: '' }) // Reset second dropdown value
                  setData([]) // Clear other dependent data

                  // Clear third and fourth input fields
                  setEditDataSet({ type: '', code: '' })
                }
              }}
              id='autocomplete-first'
              getOptionLabel={option => option.title || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={params => <TextField {...params} label='Configuration' />}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              value={categoryValue}
              options={secondDropdown}
              onChange={(event, newValue) => {
                setCategoryValue({
                  id: newValue?.id || '',
                  title: newValue?.title || '',
                  type: newValue?.type || ''
                })

                if (!newValue) {
                  fetchRegistrations()
                  setData([])
                }
              }}
              id='autocomplete-second'
              getOptionLabel={option => option.title || ''}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={params => <TextField {...params} label='Dependent' />}
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
              error={!!error.code}
              helperText={error.code}
              fullWidth
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
          title='Dependent List
'
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

export default DependentFields
