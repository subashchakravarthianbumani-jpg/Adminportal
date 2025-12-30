'use client'

import { useEffect, useMemo, useState } from 'react'

import dynamic from 'next/dynamic'

import { Backdrop, CircularProgress } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Box, Button, FormControlLabel, Grid, Paper, Switch, TextField, Typography } from '@mui/material'
import { styled } from '@mui/system'
import axios from 'axios'

import { getLocalStorageItem } from '@/utils/storage'
import { buildAssetUrl } from '@/utils/assetUrl'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues

// const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  )
})

const hasInvalidTags = value => {
  const tagPattern = /<\/?[^>]+>/gi;

  if (tagPattern.test(value)) return true;

  const allowedPattern = /^[A-Za-z0-9 .,_-]*$/;

  return !allowedPattern.test(value);
};

const safeHandleInputChange = field => e => {
  const value = e.target.value

  if (hasInvalidTags(value)) {
    toast.error('Invalid characters detected!')

    return
  }

  handleInputChange(field)(e)
}

// Styled components
const UploadButton = styled('input')({
  display: 'none'
})

const StyledPaper = styled(Paper)({
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
  maxWidth: '900px',
  margin: '0 auto'
})

const StyledButton = styled(Button)({
  color: '#ffffff',
  borderRadius: '25px',
  padding: '12px 24px',
  fontWeight: 'bold',
  fontSize: '16px',
  '&:hover': {
    backgroundColor: '#0056b3'
  }
})

const LabelTypography = styled(Typography)({
  fontWeight: 500,
  marginBottom: '8px'
})

// Styled Quill Editor
const StyledQuillWrapper = styled(Box)({
  '& .quill': {
    borderRadius: '8px',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    '&:hover': {
      borderColor: 'rgba(0, 0, 0, 0.87)'
    }
  },
  '& .ql-toolbar': {
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
  },
  '& .ql-container': {
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    minHeight: '200px',
    fontSize: '14px'
  },
  '& .ql-editor': {
    minHeight: '200px'
  }
})

const SettingsForm = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [formValues, setFormValues] = useState({
    VISITOR: false,
    SEMINAR_ATTENDEE: false,
    EXHIBITOR: false,
    OTHERS: false
  })

  const [formLabel, setFormLabel] = useState({ label: '' })
  const [settingsData, setSettingsData] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [footerLabel, setFooterLabel] = useState('')

  // Site Settings State
  const [siteSettings, setSiteSettings] = useState({
    file1: null,
    file2: null,
    file3: null,
    file4: null,
    preview1: '',
    preview2: '',
    preview3: '',
    preview4: '',
    editorContent: ''
  })

  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'align',
    'link'
  ]

  // In your fetchSettings function, update the date conversion:

  const fetchSettings = async () => {
    try {
      setLoading(true)

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/settingslist`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const settings = response.data?.data || []

      setData(settings)
      setSettingsData(settings)

      const getValue = key => {
        const item = settings.find(i => i.Key === key)

        return item?.Value ? String(item.Value).trim() : ''
      }

      const getStatus = key => {
        const item = settings.find(i => i.Key === key)

        return item?.Status === 1
      }

      setFooterLabel(getValue('FooterLabel'))

      const convertToInputFormat = dateStr => {
        if (!dateStr || typeof dateStr !== 'string') return ''

        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/')

          if (!day || !month || !year) return ''

          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
          const [day, month, year] = dateStr.split('-')

          if (!day || !month || !year) return ''

          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        return dateStr
      }

      setFromDate(convertToInputFormat(getValue('FromDate')))
      setToDate(convertToInputFormat(getValue('ToDate')))

      setFormLabel({
        label: getValue('Label')
      })

      setFormValues({
        VISITOR: getStatus('Visitors'),
        SEMINAR_ATTENDEE: getStatus('SeminarAttendee'),
        EXHIBITOR: getStatus('Exhibitors'),
        OTHERS: getStatus('Others')
      })

      setSiteSettings(prev => ({
        ...prev,
        preview1: buildAssetUrl(getValue('TamilNaduLogo')),
        preview2: buildAssetUrl(getValue('TAHDCOLogo')),
        preview3: buildAssetUrl(getValue('EventLogo')),
        preview4: buildAssetUrl(getValue('FaviconLogo')),

        // preview1: getValue('TamilNaduLogo') || '',
        // preview2: getValue('TAHDCOLogo') || '',
        // preview3: getValue('EventLogo') || '',
        // preview4: getValue('FaviconLogo') || '',
        editorContent: getValue('MainFooter') || ''
      }))
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [token])

  const handleSwitchChange = field => event => {
    setFormValues(prevValues => ({
      ...prevValues,
      [field]: event.target.checked
    }))
  }

  const handleInputChange = field => event => {
    setFormLabel(prevLabel => ({
      ...prevLabel,
      [field]: event.target.value
    }))
  }

  const handleFileUpload = fileNumber => e => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type?.startsWith('image/')) {
      alert('Only image files are allowed!')
      e.target.value = ''

      return
    }

    setSiteSettings(prev => ({
      ...prev,
      [`file${fileNumber}`]: file,
      [`preview${fileNumber}`]: URL.createObjectURL(file)
    }))
  }

  const handleEditorChange = content => {
    setSiteSettings(prev => ({
      ...prev,
      editorContent: content
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    let success = false

    try {
      const formDataList = []
      const userId = userInfo?.Id || ''
      const userName = `${userInfo?.FirstName || ''} ${userInfo?.LastName || ''}`.trim()

      const findExisting = key => settingsData.find(s => s.Key === key)

      const pushIfChanged = (key, sType, value, status = 1) => {
        const existing = findExisting(key)

        if (!existing || existing.Value !== String(value) || existing.Status !== status) {
          formDataList.push({
            Id: existing?.Id || '', // Pass existing ID or empty string
            Key: key,
            SType: sType,
            Value: value,
            Status: status
          })
        }
      }

      // Convert from YYYY-MM-DD to DD/MM/YYYY before saving
      const convertToStorageFormat = dateStr => {
        if (!dateStr) return ''
        const [year, month, day] = dateStr.split('-')

        if (!year || !month || !day) return ''

        return `${day}/${month}/${year}`
      }

      pushIfChanged('Visitors', 'RegisterType', 'Visitors', formValues.VISITOR ? 1 : 0)
      pushIfChanged('SeminarAttendee', 'RegisterType', 'Seminar Attendee', formValues.SEMINAR_ATTENDEE ? 1 : 0)
      pushIfChanged('Exhibitors', 'RegisterType', 'Exhibitors', formValues.EXHIBITOR ? 1 : 0)
      pushIfChanged('Others', 'RegisterType', 'Others', formValues.OTHERS ? 1 : 0)
      pushIfChanged('Label', 'Text', formLabel.label || '')
      pushIfChanged('FromDate', 'Date', convertToStorageFormat(fromDate))
      pushIfChanged('ToDate', 'Date', convertToStorageFormat(toDate))
      pushIfChanged('FooterLabel', 'Text', footerLabel || '')
      pushIfChanged('MainFooter', 'HTML', siteSettings.editorContent || '')

      const uploads = [
        { key: 'TamilNaduLogo', file: siteSettings.file1 },
        { key: 'TAHDCOLogo', file: siteSettings.file2 },
        { key: 'EventLogo', file: siteSettings.file3 },
        { key: 'FaviconLogo', file: siteSettings.file4 }
      ]

      for (const { key, file } of uploads) {
        if (file) {
          const fd = new FormData()
          const existing = findExisting(key)

          fd.append('Id', existing?.Id || '')
          fd.append('Key', key)
          fd.append('SType', 'Image')
          fd.append('SavedBy', userId)
          fd.append('SavedUserName', userName)
          fd.append('Value', file)
          formDataList.push(fd)
        }
      }

      if (formDataList.length === 0) {
        toast.info('No changes detected.')

        return setLoading(false)
      }

      const results = await Promise.all(
        formDataList.map(async item => {
          let formData

          if (item instanceof FormData) {
            // Already a FormData object (for file uploads)
            formData = item
          } else {
            // Create FormData for non-file data
            formData = new FormData()
            formData.append('Id', item.Id || '') // KEY FIX: Include ID
            formData.append('Key', item.Key || '')
            formData.append('SType', item.SType || '')
            formData.append('Value', item.Value ?? '')
            formData.append('Status', item.Status ?? 1)
            formData.append('SavedBy', userId)
            formData.append('SavedUserName', userName)
          }

          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/settingsSaveUpdate`, formData, {
            headers: { Authorization: `Bearer ${token}` }
          })

          // Handle both 204 No Content and 200 OK with data
          return res.status === 204 || res.status === 200 || res?.data?.status === true
        })
      )

      success = results.some(r => r === true)

      if (success) {
        toast.success('Settings updated successfully!')
      } else {
        toast.error('Failed to update settings.')
      }

      fetchSettings()
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings.')
      fetchSettings()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '10vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 2 }}>
      <StyledPaper>
        <Typography variant='h4' textAlign='center' gutterBottom fontWeight='bold' sx={{ mb: 4 }}>
          Form Settings
        </Typography>

        <Box component='form' onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Four Logo Uploads */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Logo Settings
              </Typography>
              <Grid container spacing={3}>
                {[
                  { num: 1, label: 'Tamil Nadu Logo' },
                  { num: 2, label: 'TAHDCO Logo' },
                  { num: 3, label: 'Event Logo' },
                  { num: 4, label: 'Favicon Logo' }
                ].map(({ num, label }) => (
                  <Grid item xs={12} sm={6} md={3} key={num}>
                    <Box sx={{ textAlign: 'center' }}>
                      <LabelTypography>{label}</LabelTypography>
                      <UploadButton accept='image/*' id={`file-${num}`} onChange={handleFileUpload(num)} type='file' />
                      <label htmlFor={`file-${num}`}>
                        <StyledButton variant='contained' component='span' sx={{ fontSize: '13px' }}>
                          Upload
                        </StyledButton>
                      </label>

                      {siteSettings[`preview${num}`] && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={siteSettings[`preview${num}`]}
                            alt={`${label} Preview`}
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Label Input */}
            <Grid item xs={12}>
              <TextField
                label='Label'
                variant='outlined'
                fullWidth
                value={formLabel.label}
                onChange={e => {
                  const value = e.target.value

                  if (hasInvalidTags(value)) {

                    // toast.error('HTML, XML or Script tags are not allowed!')

                    return
                  }

                  handleInputChange('label')(e)
                }}

                // onChange={handleInputChange('label')}
                required
              />
            </Grid>

            {/* Registration Type Switches */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Registration Types
              </Typography>
              <Grid container spacing={2}>
                {['VISITOR', 'SEMINAR_ATTENDEE', 'EXHIBITOR', 'OTHERS'].map(field => (
                  <Grid item xs={6} sm={3} key={field}>
                    <FormControlLabel
                      control={
                        <Switch checked={formValues[field]} onChange={handleSwitchChange(field)} color='primary' />
                      }
                      label={field.replace('_', ' ')}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Footer Label */}
            <Grid item xs={12}>
              <TextField
                label='Footer Label'
                variant='outlined'
                fullWidth
                value={footerLabel}
                onChange={e => {
                  const value = e.target.value

                  if (hasInvalidTags(value)) {

                    // toast.error('Invalid characters detected! HTML, XML, or Scripts are not allowed!')

                    return
                  }

                  setFooterLabel(value)
                }}

                // onChange={e => setFooterLabel(e.target.value)}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Event Date Range
              </Typography>
              <Grid container spacing={3} alignItems='center'>
                <Grid item xs={12} sm={5}>
                  <LabelTypography>From Date</LabelTypography>
                  <TextField
                    fullWidth
                    type='date'
                    InputLabelProps={{ shrink: true }}
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ textAlign: 'center', pt: { xs: 0, sm: 4 } }}>
                  <Typography variant='h5'>—</Typography>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <LabelTypography>To Date</LabelTypography>
                  <TextField
                    fullWidth
                    type='date'
                    InputLabelProps={{ shrink: true }}
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    disabled={!fromDate}
                    inputProps={{
                      min: fromDate
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Footer Content - Quill Editor */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Footer Content
              </Typography>
              <StyledQuillWrapper>
                {isMounted && (
                  <ReactQuill
                    theme='snow'
                    value={siteSettings.editorContent}
                    onChange={handleEditorChange}
                    modules={modules}
                    formats={formats}
                    placeholder='Enter footer content here...'
                  />
                )}
              </StyledQuillWrapper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
              <StyledButton variant='contained' type='submit' sx={{ minWidth: '200px' }}>
                Save Settings
              </StyledButton>
            </Grid>
          </Grid>
        </Box>
      </StyledPaper>

      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    </Box>
  )
}

export default SettingsForm
