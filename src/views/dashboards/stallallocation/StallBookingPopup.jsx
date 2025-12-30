import { useEffect, useState } from 'react'

import axios from 'axios'
import Swal from 'sweetalert2'
import { Backdrop, CircularProgress } from '@mui/material'

import { getLocalStorageItem } from '@/utils/storage'

function StallBookingPopup({ onBookingSuccess, registrationUserId }) {
  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  const [stallDropDown, setStallDropDown] = useState([
    {
      id: '',
      stallNumber: '',
      slotGroup: '',
      isBooked: false
    }
  ])

  const [categoryDropdown, setCategoryDropdown] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const [stallMapImage, setStallMapImage] = useState('')

  // Fetch categories dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { type: 'EXHIBITORCATEGORY' }
        })

        if (response?.data?.status && response?.data?.data) {
          setCategoryDropdown(response.data.data)

          // if (response.data.data.length > 0) {
          //   setSelectedCategory(response.data.data[0].DropDownValue)
          // }
        }
      } catch (error) {
        console.log('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [token])


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/settingslist`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response?.data?.status && response?.data?.data) {
          // Find the StallMap entry
          const stallMapEntry = response.data.data.find(item => item.Key === 'StallMap')

          if (stallMapEntry && stallMapEntry.Value) {
            setStallMapImage(stallMapEntry.Value)
          }
        }
      } catch (error) {
        console.log('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [token])


  // Fetch stalls based on selected category
  useEffect(() => {
    const fetchStalls = async () => {
      try {
        setLoading(true)

        const params = {}

        if (selectedCategory) {
          params.SlotGroup = selectedCategory
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotlist`, {
          headers: { Authorization: `Bearer ${token}` },
          params: params
        })

        const stallData = response?.data?.data

        if (!stallData || !Array.isArray(stallData)) {
          console.log('Invalid stall data:', stallData)
          setStallDropDown([])
          setLoading(false)

          return
        }

        const transformedData = stallData.map(({ Id, SlotNumber, SlotGroup, IsBooked }) => ({
          id: Id,
          stallNumber: SlotNumber,
          slotGroup: SlotGroup,
          isBooked: IsBooked
        }))

        setStallDropDown(transformedData)
        setLoading(false)
      } catch (error) {
        console.log('Error fetching stalls:', error)
        setStallDropDown([])
        setLoading(false)
      }
    }

    // Always fetch stalls (with or without category filter)
    fetchStalls()
  }, [token, selectedCategory])

  const handleImageZoom = () => {
    Swal.fire({

      // imageUrl: '/images/web-logo/stall.png',

      imageUrl:stallMapImage,
      showCloseButton: true,
      showConfirmButton: false,
      width: '50%'
    })
  }

  const handleStallBooking = async stall => {
    Swal.fire({
      title: `Are you sure you want to book Stall ${stall.stallNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Book it!',
      cancelButtonText: 'Cancel'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          setLoading(true)

          const payload = {
            StallApprove: '2',
            SlotId: stall.id,
            Isbooked: '2',
            RegistrationId: registrationUserId,
            SavedBy: userInfo.id,
            SavedUserName: userInfo.userName
          }

          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotbooking`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.status === 200) {
            onBookingSuccess('table')
            Swal.fire('Success!', `Stall ${stall.stallNumber} booked successfully!`, 'success')
            setStallDropDown(prev => prev.map(s => (s.id === stall.id ? { ...s, isBooked: true } : s)))
            setLoading(false)
          }
        } catch (error) {
          Swal.fire('Error!', 'Failed to book the stall. Please try again.', 'error')
          console.log('Error booking stall:', error)
          setLoading(false)
        }
      }
    })
  }

  console.log('stall -- ', stallDropDown)

  const filteredStalls = stallDropDown.filter(stall => {
    const matchesSearch = stall.stallNumber.toLowerCase().includes(searchText.toLowerCase())
    const matchesFilter = filterGroup ? stall.slotGroup === filterGroup : true

    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        <img

          // src='/images/web-logo/stall.png'

          src={stallMapImage}
          alt='Graph'
          style={{ width: '100%', maxWidth: '600px', cursor: 'zoom-in' }}
          onClick={handleImageZoom}
        />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#006D5D',
                border: '1px solid #ccc',
                borderRadius: '50%'
              }}
            ></span>
            <span>Not Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#E8E8E8',
                border: '1px solid #ccc',
                borderRadius: '50%'
              }}
            ></span>
            <span> Available</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
            maxWidth: '600px'
          }}
        >
          {/* Category Dropdown */}


          <input
            type='text'
            placeholder='Search Stalls'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              padding: '10px',
              flex: 1,
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px',
              flex: 0.5,
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          >
            <option value=''>Select Category</option>
            {categoryDropdown.map(category => (
              <option key={category.Id} value={category.DropDownValue}>
                {category.DropDownValue}
              </option>
            ))}
          </select>

        </div>

        {selectedCategory && filteredStalls.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No stalls available for the selected category
          </div>
        )}

        <div
          id='stallButtons'
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px',
            justifyItems: 'center',
            alignItems: 'center',
            width: '100%',
            margin: '20px auto',
            padding: '20px'
          }}
        >
          {filteredStalls.map(stall => (
            <button
              key={stall.id}
              disabled={stall.isBooked}
              onClick={() => handleStallBooking(stall)}
              style={{
                padding: '10px',
                width: '120px',
                height: '50px',
                borderRadius: '8px',
                backgroundColor: stall.isBooked ? '#006D5D' : '#E8E8E8',
                cursor: stall.isBooked ? 'not-allowed' : 'pointer',
                color: stall.isBooked ? '#FFFFFF' : '#000000'
              }}
            >
              {stall.stallNumber}
            </button>
          ))}
        </div>
      </div>
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    </div>
  )
}

export default StallBookingPopup
