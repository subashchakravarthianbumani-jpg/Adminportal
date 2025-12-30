import { useEffect, useState } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'
import {  Backdrop, CircularProgress } from '@mui/material';

import { getLocalStorageItem } from '@/utils/storage'

function UpdateStall({ onBookingSuccess, registrationUserId,updatedValuesPage,fetchRegistration}) {
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

  const [loading, setLoading] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  const [bookedStallNumber, setBookedStallNumber] = useState({
    id: '',
    stallNumber: '',
    slotGroup: '',
    isBooked: false
  })

  const [filters, setFilters] = useState({
    RegistrationId: registrationUserId
  })

  const fetchStalls = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotlist`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const bookedStallData = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotlist`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      })

      const stallData = response?.data?.data || []

      const bookedStall = Array.isArray(bookedStallData?.data?.data)
        ? bookedStallData?.data?.data
        : [bookedStallData?.data?.data]

      const transformedData = stallData.map(({ Id, SlotNumber, SlotGroup, IsBooked }) => ({
        id: Id,
        stallNumber: SlotNumber,
        slotGroup: SlotGroup,
        isBooked: IsBooked?.data?.[0] === 1
      }))

      // const bookedTransformedData = bookedStall.map(({ Id, SlotNumber, SlotGroup, IsBooked }) => ({
      //   id: Id,
      //   stallNumber: SlotNumber,
      //   slotGroup: SlotGroup,
      //   isBooked: IsBooked?.data?.[0] === 1,
      // }));

      const bookedTransformedData = Array.isArray(bookedStall)
        ? bookedStall.map(({ Id, SlotNumber, SlotGroup, IsBooked }) => ({
            id: Id,
            stallNumber: SlotNumber,
            slotGroup: SlotGroup,
            isBooked: IsBooked?.data?.[0] === 1
          }))
        : []

      setStallDropDown(transformedData);

      setBookedStallNumber(bookedTransformedData[0] || null) // Handle single booked stall.
    } catch (error) {
      console.log('Error fetching stalls:', error)
    }
  }

  useEffect(() => {
    fetchStalls()
  }, [token, filters, registrationUserId])

  // Handle Image Zoom
  const handleImageZoom = () => {
    Swal.fire({
      imageUrl: '/images/web-logo/stall.png',
      showCloseButton: true,
      showConfirmButton: false,
      width: '50%'
    })
  }

  const handleStallUnBooking = async stall => {
    Swal.fire({
      title: `Are you sure you want to unbook Stall ${stall.stallNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Un-Book it!',
      cancelButtonText: 'Cancel'
    }).then(async result => {
      if (result.isConfirmed) {

        setLoading(true)

        try {
          const payload = {
            StallApprove: '2',
            SlotId: stall.id,
            Isbooked: '1',
            RegistrationId: registrationUserId, // Replace with actual RegistrationId
            SavedBy: userInfo.id,
            SavedUserName: userInfo.userName
          }

          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotbooking`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.status === 200) {
            // onBookingSuccess('table');
            setLoading(false)
            fetchStalls();
            Swal.fire('Success!', `Stall ${stall.stallNumber} un-booked successfully!`, 'success')
            setBookedStallNumber(prev => ({ ...prev, isBooked: false }))
            updatedValuesPage();
            fetchRegistration();
          }
        } catch (error) {
          Swal.fire('Error!', 'Failed to book the stall. Please try again.', 'error')
          console.log('Error booking stall:', error)
          setLoading(false)
        }
      }
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

        setLoading(true)

        try {

          const payload = {
            StallApprove: '2',
            SlotId: stall.id,
            Isbooked: '2',
            RegistrationId: registrationUserId, // Replace with actual RegistrationId
            SavedBy: userInfo.id,
            SavedUserName: userInfo.userName
          }

          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotbooking`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.status === 200) {
            fetchStalls();
            onBookingSuccess('table')
            setLoading(false)
            updatedValuesPage();
            fetchRegistration();

            // Swal.fire('Success!', `Stall ${stall.stallNumber} booked successfully!`, 'success')
                        // setStallDropDown(prev => prev.map(s => (s.id === stall.id ? { ...s, isBooked: true } : s)))
                        Swal.fire('Success!', `Stall ${stall.stallNumber} booked successfully!`, 'success');
            setStallDropDown(prev => prev.map(s => (s.id === stall.id ? { ...s, isBooked: true } : s)))
          }
        } catch (error) {
          setLoading(false)
          Swal.fire('Error!', 'Failed to book the stall. Please try again.', 'error')
          console.log('Error booking stall:', error)
        }
      }
    })
  }

  const filteredStalls = stallDropDown.filter(stall => {
    const matchesSearch = stall.stallNumber.toLowerCase().includes(searchText.toLowerCase())
    const matchesFilter = filterGroup ? stall.slotGroup === filterGroup : true

    return matchesSearch && matchesFilter
  })

  console.log(bookedStallNumber)

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
          src='/images/web-logo/stall.png'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#06568E',
                border: '1px solid #ccc',
                borderRadius: '50%'
              }}
            ></span>
            <span>Booked Stall</span>
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
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            style={{
              padding: '10px',
              flex: 0.5,
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          >
            <option value=''>All</option>
            {[...new Set(stallDropDown.map(stall => stall.slotGroup))].map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Stall Buttons */}
        {bookedStallNumber && bookedStallNumber.isBooked ? (
          <div
            id='stallButtons'
            style={{
              display: 'grid',
              gap: '15px',
              justifyItems: 'center',
              alignItems: 'center',
              width: '100%',
              margin: '20px auto',
              padding: '20px'
            }}
          >
            <h1>Booked Stall:</h1>
            <button
              key={bookedStallNumber.id}
              onClick={() => handleStallUnBooking(bookedStallNumber)}
              style={{
                padding: '10px',
                width: '120px',
                height: '50px',
                borderRadius: '8px',
                borderRadius: '8px',
                backgroundColor: '#06568E',
                cursor: 'pointer',
                color: '#FFFFFF'
              }}
            >
              {bookedStallNumber.stallNumber}
            </button>
          </div>
        ) : (
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
        )}
      </div>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  )
}

export default UpdateStall
