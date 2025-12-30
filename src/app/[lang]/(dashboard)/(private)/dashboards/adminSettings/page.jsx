'use client'

import { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

import axios from 'axios'
import { Backdrop, Box, Button, CircularProgress, Divider, Grid, Paper, Typography } from '@mui/material'
import { styled } from '@mui/system'
import { toast, ToastContainer } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import { getLocalStorageItem } from '@/utils/storage'
import { buildAssetUrl } from '@/utils/assetUrl'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

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
  padding: '12px 30px',
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

const SettingsAdmin = () => {
  const [loading, setLoading] = useState(false)
  const [settingsData, setSettingsData] = useState([])

  const [siteSettings, setSiteSettings] = useState({
    file1: null,
    file2: null,
    file3: null,
    file4: null,
    preview1: '',
    preview2: '',
    preview3: '',
    preview4: ''
  })

  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  const fetchSettings = async () => {
    try {
      setLoading(true)

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/settingslist`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const settings = response.data?.data || []

      setSettingsData(settings)

      const getValue = key => {
        const item = settings.find(i => i.Key === key)

        return item?.Value ? String(item.Value).trim() : ''
      }

      setSiteSettings(prev => ({
        ...prev,
        preview1: buildAssetUrl(getValue('AdminLogo') || ''),
        preview2: buildAssetUrl(getValue('AdminFaviLogo') || ''),
        preview3: buildAssetUrl(getValue('LoginMedia') || ''),
        preview4: buildAssetUrl(getValue('StallMap') || '')
      }))
    } catch (err) {
      console.error('Error fetching settings:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [token])

  const handleFileUpload = fileNumber => e => {
    const file = e.target.files[0]

    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    // LoginMedia (file3) can be image or video
    if (fileNumber === 3) {
      if (!isImage && !isVideo) {
        alert('Only image or video files are allowed!')
        e.target.value = ''

        return
      }
    } else {
      // All other files must be images
      if (!isImage) {
        alert('Only image files are allowed!')
        e.target.value = ''

        return
      }
    }

    setSiteSettings(prev => ({
      ...prev,
      [`file${fileNumber}`]: file,
      [`preview${fileNumber}`]: URL.createObjectURL(file)
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

      const uploads = [
        { key: 'AdminLogo', file: siteSettings.file1 },
        { key: 'AdminFaviLogo', file: siteSettings.file2 },
        { key: 'LoginMedia', file: siteSettings.file3 },
        { key: 'StallMap', file: siteSettings.file4 }
      ]

      for (const { key, file } of uploads) {
        if (file) {
          const fd = new FormData()
          const existing = findExisting(key)

          fd.append('Id', existing?.Id || '')
          fd.append('Key', key)
          fd.append('SType', key === 'LoginMedia' && file.type.startsWith('video/') ? 'Video' : 'Image')
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
        formDataList.map(async formData => {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/apps/settingsSaveUpdate`,
            formData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )

          // Handle both 204 No Content and 200 OK with data
          return res.status === 204 || res.status === 200 || res?.data?.status === true
        })
      )

      success = results.some(r => r === true)

      if (success) {
        toast.success('Settings updated successfully!')

        // Clear file inputs after successful upload
        setSiteSettings(prev => ({
          ...prev,
          file1: null,
          file2: null,
          file3: null,
          file4: null
        }))
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

  const renderPreview = (fileNum, previewUrl, file) => {
    if (!previewUrl) return null

    const isVideo = file?.type?.startsWith('video/') || previewUrl.includes('.mp4') || previewUrl.includes('.webm')

    return (
      <Box sx={{ mt: 2 }}>
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            style={{
              width: '100%',
              maxWidth: '150px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          />
        ) : (
          <img
            src={previewUrl}
            alt={`Preview ${fileNum}`}
            style={{
              width: '100%',
              maxWidth: '150px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}
          />
        )}
      </Box>
    )
  }

  const uploadItems = [
    { num: 1, label: 'Admin Panel Logo', accept: 'image/*', key: 'AdminLogo' },
    { num: 2, label: 'Admin Panel Favicon', accept: 'image/*', key: 'AdminFaviLogo' },
    { num: 3, label: 'Login Page Media', accept: 'image/*,video/*', key: 'LoginMedia' },
    { num: 4, label: 'Stall Allocation Map', accept: 'image/*', key: 'StallMap' }
  ]

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 2 }}>
      <ToastContainer position='top-right' autoClose={2000} hideProgressBar />
      <StyledPaper>
        <Typography variant='h5' textAlign='center' gutterBottom fontWeight='bold'>
          Admin Panel Settings
        </Typography>

        <Divider sx={{ margin: '20px 0' }} />

        <Box component='form' onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {uploadItems.map(({ num, label, accept, key }) => (
              <Grid
                key={num}
                item
                xs={12}
                sm={6}
                md={3}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <LabelTypography sx={{ textAlign: 'center', fontSize: '14px' }}>{label}</LabelTypography>

                <UploadButton accept={accept} id={`file-${num}`} onChange={handleFileUpload(num)} type='file' />

                <label htmlFor={`file-${num}`}>
                  <StyledButton variant='contained' component='span' sx={{ fontSize: '13px' }}>
                    Upload
                  </StyledButton>
                </label>

                {renderPreview(num, siteSettings[`preview${num}`], siteSettings[`file${num}`])}
              </Grid>
            ))}


            <br /><br />
            <Grid item xs={12} textAlign='center' sx={{ mt: 3 }}>
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

export default SettingsAdmin
