'use client'

import { useState, useEffect } from 'react'

import {
  Grid,
  TextField,
  Autocomplete,
  Button,
  Card,
  CardHeader,
  Backdrop,
  CircularProgress,
  IconButton,
  Box,
  Chip,
  Typography,
  Tooltip,
  Paper,
  InputAdornment,
  alpha
} from '@mui/material'
import TablePagination from '@mui/material/TablePagination'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { getLocalStorageItem } from '@/utils/storage'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

// Column Helper
const columnHelper = createColumnHelper()

export default function ExhibitorCodeGenerator() {
  const [mode, setMode] = useState('default')
  const [loading, setLoading] = useState(false)
  const [categoryList, setCategoryList] = useState([])
  const [searchFilter, setSearchFilter] = useState('')

  const [form, setForm] = useState({
    category: null,
    prefix: '',
    count: '',
    suffix: '',
    from: '',
    to: ''
  })

  const [tableData, setTableData] = useState([])
  const userInfo = JSON.parse(getLocalStorageItem('userInfo') || 'null')
  const token = getLocalStorageItem('accessToken')

  useEffect(() => {
    fetchCategoryList()
  }, [])

  const fetchCategoryList = async () => {
    setLoading(true)

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist?type=EXHIBITORCATEGORY`)

      if (res.data.status) {
        const arr = res.data.data.map(item => ({
          id: item.Code,
          title: item.DropDownValue
        }))

        setCategoryList(arr)
      }
    } catch (err) {
      console.log('Error loading category list', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTableData = async (slotGroup = '') => {
    setLoading(true)

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotlist?SlotGroup=${slotGroup}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (res.data.status) {
        setTableData(res.data.data)
      }
    } catch (err) {
      console.log('Error fetching table', err)
    } finally {
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   fetchTableData()
  // }, [])

  const resetForm = () => {
    setForm({ category: null, prefix: '', count: '', suffix: '', from: '', to: '' })
  }

  const backToDefault = () => {
    resetForm()
    setMode('default')
    fetchTableData()
  }

  const openGenerateMode = () => {
    setMode('generate')
  }

  const openRenameMode = () => {
    setMode('rename')
  }

  const openDeleteMode = () => {
    setMode('delete')
  }

  const handleGenerateSubmit = async () => {
    if (!form.category) return Swal.fire('Error', 'Select Category', 'error')
    if (!form.prefix || !form.from || !form.to) return Swal.fire('Error', 'Prefix, From and To are required', 'error')

    const fromNum = parseInt(form.from)
    const toNum = parseInt(form.to)

    if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
      return Swal.fire('Error', 'Invalid From/To range', 'error')
    }

    const payload = {
      action: 'generate',
      Category: form.category.id,
      Prefix: form.prefix,
      From: form.from, // Send From instead of Count
      To: form.to, // Send To
      Suffix: form.suffix || null,
      SavedBy: userInfo?.id,
      SavedUserName: userInfo?.userName
    }

    try {
      setLoading(true)

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotSaveUpdate`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (res.data.status) {
        Swal.fire('Success', res.data.message || 'Codes Generated Successfully', 'success')
        backToDefault()
      } else {
        Swal.fire('Error', res.data.message || 'Failed to generate', 'error')
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRenameSubmit = async () => {
    if (!form.category) return Swal.fire('Error', 'Select Category', 'error')
    if (!form.prefix || !form.from || !form.to) return Swal.fire('Error', 'Prefix, From and To are required', 'error')

    const payload = {
      action: 'rename',
      Category: form.category.id,
      Prefix: form.prefix,
      From: form.from,
      To: form.to,
      Suffix: form.suffix || '',
      SavedBy: userInfo?.id,
      SavedUserName: userInfo?.userName
    }

    try {
      setLoading(true)

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotSaveUpdate`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (res.data.status) {
        Swal.fire('Success', res.data.message || 'Renamed Successfully', 'success')
        backToDefault()
      } else {
        Swal.fire('Error', res.data.message || 'Rename failed', 'error')
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRangeSubmit = async () => {
    if (!form.category) return Swal.fire('Error', 'Select Category', 'error')
    if (!form.prefix || !form.from || !form.to) return Swal.fire('Error', 'From and To are required', 'error')

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the selected range. This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (!confirm.isConfirmed) return

    const payload = {
      action: 'delete',
      Category: form.category.id,
      Prefix: form.prefix,
      From: form.from,
      To: form.to,
      Suffix: form.suffix || '',
      SavedBy: userInfo?.id
    }

    try {
      setLoading(true)

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotSaveUpdate`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (res.data.status) {
        Swal.fire('Deleted', res.data.message || 'Records removed', 'success')
        backToDefault()
      } else {
        Swal.fire('Error', res.data.message || 'Delete failed', 'error')
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = row => {
    setForm({
      category: categoryList.find(c => c.id === row.SlotGroup) || null,
      prefix: row.Prefix || '',
      count: '',
      suffix: row.Suffix || '',
      from: '',
      to: ''
    })

    setMode('generate')
  }

  const handleDelete = async row => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (!confirm.isConfirmed) return

    try {
      setLoading(true)

      const payload = {
        action: 'deleteSingle',
        Id: row.Id,
        DeletedBy: userInfo?.id,
        DeletedByUserName: userInfo?.userName
      }

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotSaveUpdate`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (res.data.status) {
        Swal.fire('Deleted!', res.data.message || 'Record removed', 'success')
        fetchTableData(form.category?.title || '')
      } else {
        Swal.fire('Error', res.data.message || 'Delete failed', 'error')
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    columnHelper.display({
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton size='small' color='primary' onClick={() => handleEdit(row.original)}>
            <i className='ri-pencil-line' />
          </IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(row.original)}>
            <i className='ri-close-line' />
          </IconButton>
        </div>
      )
    }),
    columnHelper.accessor('SlotNumber', { header: 'Slot Number' })
  ]

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Filter data based on search
  const filteredData = table
    .getRowModel()
    .rows.filter(row => row.original.SlotNumber?.toLowerCase().includes(searchFilter.toLowerCase()))

  const blockInvalidChars = e => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      {/* Control Panel */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems='center'>
          {/* Category Selector - Always Visible */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              value={form.category}
              options={categoryList}
              getOptionLabel={o => o?.title || ''}
              onChange={(e, v) => {
                setForm({ ...form, category: v })

                if (v) {
                  fetchTableData(v.title)
                } else {
                  // fetchTableData()
                }
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Exhibitor Category'
                  variant='outlined'
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='ri-folder-line' />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* Default Mode - Action Buttons */}
          {mode === 'default' && (
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  variant='contained'
                  size='large'
                  startIcon={<i className='ri-add-circle-line' />}
                  onClick={openGenerateMode}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    boxShadow: 3
                  }}
                >
                  Generate
                </Button>

                {/* <Button
                  variant='outlined'
                  size='large'
                  startIcon={<i className='ri-edit-line' />}
                  onClick={openRenameMode}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Rename
                </Button> */}

                <Button
                  variant='outlined'
                  color='error'
                  size='large'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={openDeleteMode}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  Delete Range
                </Button>
              </Box>
            </Grid>
          )}

          {/* Generate Mode Fields */}
          {mode === 'generate' && (
            <>
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label='Prefix'
                  fullWidth
                  value={form.prefix}
                  onChange={e => setForm({ ...form, prefix: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label='From'
                  type='number'
                  fullWidth
                  value={form.from}
                  error={Boolean(form.fromError)}
                  helperText={form.fromError}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, from: val, fromError: '' }

                      // Validate empty
                      if (val === '') {
                        updated.fromError = 'From number is required'
                        updated.to = ''
                        updated.toError = ''

                        return updated
                      }

                      // Clear 'to' if invalid
                      if (prev.to && Number(prev.to) < Number(val)) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label='To'
                  type='number'
                  fullWidth
                  value={form.to}
                  error={Boolean(form.toError)}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, to: val, toError: '' }
                      const fromValue = Number(prev.from || 0)

                      // Allow empty input
                      if (val === '') {
                        updated.toError = 'To number is required'

                        return updated
                      }

                      const toValue = Number(val)

                      // Validate: to >= from
                      if (toValue < fromValue) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'

                        return updated
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  label='Suffix'
                  fullWidth
                  value={form.suffix}
                  onChange={e => setForm({ ...form, suffix: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='contained'
                    fullWidth
                    onClick={handleGenerateSubmit}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Generate
                  </Button>
                  <IconButton
                    color='default'
                    onClick={backToDefault}
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <i className='ri-arrow-go-back-line' />
                  </IconButton>
                </Box>
              </Grid>
            </>
          )}

          {/* Rename Mode Fields */}
          {mode === 'rename' && (
            <>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='Prefix'
                  fullWidth
                  value={form.prefix}
                  onChange={e => setForm({ ...form, prefix: e.target.value })}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  label='From'
                  type='number'
                  fullWidth
                  value={form.from}
                  error={Boolean(form.fromError)}
                  helperText={form.fromError}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, from: val, fromError: '' }

                      // Validate empty
                      if (val === '') {
                        updated.fromError = 'From number is required'
                        updated.to = ''
                        updated.toError = ''

                        return updated
                      }

                      // Clear 'to' if invalid
                      if (prev.to && Number(prev.to) < Number(val)) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  label='To'
                  type='number'
                  fullWidth
                  value={form.to}
                  error={Boolean(form.toError)}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, to: val, toError: '' }
                      const fromValue = Number(prev.from || 0)

                      // Allow empty input
                      if (val === '') {
                        updated.toError = 'To number is required'

                        return updated
                      }

                      const toValue = Number(val)

                      // Validate: to >= from
                      if (toValue < fromValue) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'

                        return updated
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='Suffix'
                  fullWidth
                  value={form.suffix}
                  onChange={e => setForm({ ...form, suffix: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='contained'
                    fullWidth
                    onClick={handleRenameSubmit}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Submit
                  </Button>
                  <IconButton
                    color='default'
                    onClick={backToDefault}
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <i className='ri-arrow-go-back-line' />
                  </IconButton>
                </Box>
              </Grid>
            </>
          )}

          {/* Delete Mode Fields */}
          {mode === 'delete' && (
            <>
            <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='Prefix'
                  fullWidth
                  value={form.prefix}
                  onChange={e => setForm({ ...form, prefix: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='From Stall number'
                  fullWidth
                  value={form.from} // FIXED
                  error={Boolean(form.fromError)}
                  helperText={form.fromError}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, from: val, fromError: '' }

                      // Validate empty
                      if (val === '') {
                        updated.fromError = 'From number is required'
                        updated.to = ''
                        updated.toError = ''

                        return updated
                      }

                      // Clear 'to' if invalid
                      if (prev.to && Number(prev.to) < Number(val)) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='To Stall number'
                  fullWidth
                  value={form.to} // FIXED
                  error={Boolean(form.toError)}
                  helperText={form.toError}
                  onKeyDown={blockInvalidChars}
                  onChange={e => {
                    let val = e.target.value

                    if (!/^\d*$/.test(val)) return

                    setForm(prev => {
                      const updated = { ...prev, to: val, toError: '' }
                      const fromValue = Number(prev.from || 0)

                      // Allow empty input
                      if (val === '') {
                        updated.toError = 'To number is required'

                        return updated
                      }

                      const toValue = Number(val)

                      // Validate: to >= from
                      if (toValue <= fromValue) {
                        updated.to = ''
                        updated.toError = 'To number must be greater than or equal to From'

                        return updated
                      }

                      return updated
                    })
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  label='Suffix'
                  fullWidth
                  value={form.suffix}
                  onChange={e => setForm({ ...form, suffix: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='contained'
                    color='error'
                    fullWidth
                    onClick={handleDeleteRangeSubmit}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    Delete
                  </Button>
                  <IconButton
                    color='default'
                    onClick={backToDefault}
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <i className='ri-arrow-go-back-line' />
                  </IconButton>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Slots Display Section */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Header with search and stats */}
        <Box
          sx={{
            p: 3,
            bgcolor: alpha('#667eea', 0.05),
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
          >
            <Box>
              <Typography variant='h5' fontWeight={600} gutterBottom>
                Stalls
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<i className='ri-record-circle-line' />}
                  label={`Total: ${tableData.length}`}
                  color='primary'
                  size='small'
                />
                {form.category && (
                  <Chip label={form.category.title} color='secondary' size='small' variant='outlined' />
                )}{' '}
                &nbsp;&nbsp;
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    bgcolor: 'error.light',
                    border: '2px solid',
                    borderColor: 'error.main',
                    borderRadius: '4px'
                  }}
                />
                <Typography variant='body2'>Red is Booked Stalls</Typography>
              </Box>
            </Box>

            <TextField
              placeholder='Search slots...'
              size='small'
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        {/* Slots Grid */}
        <Box sx={{ p: 4 }}>
          {filteredData.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(100px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(120px, 1fr))',
                  md: 'repeat(auto-fill, minmax(130px, 1fr))'
                },
                gap: 2.5
              }}
            >
              {filteredData.map(row => (
                <Paper
                  key={row.id}
                  elevation={0}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    border: '2px solid',
                    borderColor: row.original.IsBooked ? 'error.main' : 'divider',
                    backgroundColor: row.original.IsBooked ? 'error.light' : 'background.paper',

                    // borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)',
                      transform: 'translateY(-4px) scale(1.02)',
                      '& .slot-actions': {
                        opacity: 1,
                        transform: 'translateY(0)'
                      },
                      '& .slot-number': {
                        color: 'primary.main',
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  <Typography
                    className='slot-number'
                    variant='h5'
                    fontWeight={700}
                    sx={{
                      color: 'text.primary',
                      letterSpacing: '0.5px',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      px: 1
                    }}
                  >
                    {row.original.SlotNumber}
                  </Typography>

                  <Box
                    className='slot-actions'
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      opacity: 0,
                      transform: 'translateY(10px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* <Tooltip title="Edit" arrow>
                      <IconButton
                        size='small'
                        onClick={() => handleEdit(row.original)}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        <i className='ri-pencil-line' style={{ fontSize: '14px' }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete" arrow>
                      <IconButton
                        size='small'
                        onClick={() => handleDelete(row.original)}
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'error.dark'
                          }
                        }}
                      >
                        <i className='ri-delete-bin-line' style={{ fontSize: '14px' }} />
                      </IconButton>
                    </Tooltip> */}
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 12,
                color: 'text.secondary'
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: alpha('#667eea', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <i className='ri-inbox-line' style={{ fontSize: '56px', color: '#667eea' }} />
              </Box>
              <Typography variant='h5' fontWeight={600} gutterBottom>
                {searchFilter ? 'No matching slots found' : 'No slots generated yet'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {searchFilter
                  ? 'Try adjusting your search criteria'
                  : 'Select a category and click "Generate" to create slots'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2 }}>
            <TablePagination
              rowsPerPageOptions={[10, 50, 100, 500, { label: 'All', value: tableData.length }]}
              count={tableData.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={(_, page) => table.setPageIndex(page)}
              onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
              component='div'
            />
          </Box>
        )}
      </Paper>

      <Backdrop open={loading} sx={{ color: '#fff', zIndex: 9999 }}>
        <CircularProgress color='inherit' size={60} />
      </Backdrop>
    </Box>
  )
}
