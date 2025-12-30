/* eslint-disable react/jsx-no-undef */
'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'


// MUI Imports
import { Box, Checkbox, Chip, ListItemText } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import { format } from 'date-fns'
import {  Backdrop, CircularProgress } from '@mui/material';

// Third-party Imports
import classnames from 'classnames'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

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

// Icon Imports
import axios from 'axios'

import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

// Data Imports
import UpdateStall from './UpdateStall'

import { getLocalStorageItem } from '@/utils/storage'


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

const StallBookedTable = ({ updatedValuesPage }) => {
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('')
  const [sorting, setsortingFilter] = useState([])

  const [exhTypeFilter, setexhTypeFilter] = useState('')
  const [exhType, setexhType] = useState(['B2B', 'B2C', 'PSU'])

  const [getStateId, setGetStateId] = useState('')

  const [originalData, setOriginalData] = useState([])
  const [stateDatas, setStateDatas] = useState([])
  const [districtDatas, setDistrictDatas] = useState([])
  const [filteredCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

  const [selectedRowsId, setSelectedRowsId] = useState([])

  // Stall status management
  const [sectionHandler, setSectionHandler] = useState('table')

  const [stallNumber, setStallNumber] = useState([
    {
      id: '',
      status: '',
      stallNumber: '',
      SlotGroup: '',
      IsBooked: ''
    }
  ]) // To hold the stall numbers

  useEffect(() => {
    updatedValuesPage();
  }, [originalData])

  const [formData, setFormData] = useState({
    StallApprove: '',
    SlotId: '',
    Isbooked: '',
    RegistrationId: '',
    SavedBy: userInfo.id,
    SavedUserName: userInfo.userName
  })

  const [data, setData] = useState([])

  // Query parameters state
  const [filtersnone, setFilters] = useState({
    RegistrationType: 'EXHIBITORS',
    IsStallApprove: 1,
    IsMoreStallsReq: 1
  })

  const [categories, setCategories] = useState([])

  // Hooks

  // Fetch registration data
  const fetchRegistrations = async (pageIndex = 0, pageSize = 10) => {
    setLoading(true)
    setError(null)

    try {
      const token = process.env.NEXT_PUBLIC_API_TOKEN || getLocalStorageItem('accessToken')

      const headers = { Authorization: `Bearer ${token}` }

      const skip = pageIndex * pageSize;
      const take = pageSize;

      const sortingState = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : {};

      const sortingPayload = sortingState.id
        ? {
            fieldName: sortingState.id,
            sort: sortingState.desc ? "DESC" : "ASC"
          }
        : {};


        const whereCondition = {
            RegistrationType: ["EXHIBITORS"],
            IsStallApproved: [1],
            IsMoreStallsReq: [1],
            IsActive: [1]
          };

          if (getStateId) {
            whereCondition.State = getStateId;
          }

          if (districtFilter) {
            whereCondition.District = districtFilter;
          }

          if (categoryTypeFilter) {
            whereCondition.BusinessCategory = categoryTypeFilter;
          }

          if (exhTypeFilter) {
            whereCondition.ExhType = exhTypeFilter;
          }


          const requestData = {
            skip,
            take,
            searchString: globalFilter || "",
            sorting: sortingPayload,
            columnSearch: [],
            where: whereCondition
          };

        console.log("nandhu:",requestData);

        console.log("FINAL SENT DATA:", JSON.stringify(requestData, null, 2));



      const requests = [
        axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/apps/registrationlist`,
          requestData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        ),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, { headers, params: stateDataSets }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
          headers,
          params: { type: 'district', IsActive: 1, offset: 0, DependentId: getStateId }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotlist`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
          headers,
          params: { type: 'BUSINESSCATEGORY', IsActive: 1, offset: 0 }
        })
      ]

      const [
        { data: registrationData },
        { data: stateData },
        { data: districtData },
        { data: slotData },
        { data: categoryData }
      ] = await Promise.all(requests)

      // Check all API responses for success
      const isValid = [registrationData, stateData, districtData, slotData, categoryData].every(
        response => response.status
      )

      if (!isValid) throw new Error('Invalid response from one or more APIs')

      // Process API data
      setStallNumber(
        slotData.data.map(({ Id, Status, SlotNumber, SlotGroup, IsBooked }) => ({
          id: Id,
          status: Status,
          stallNumber: SlotNumber,
          SlotGroup,
          IsBooked: IsBooked?.data ? IsBooked.data[0] : IsBooked || null
        }))
      )

      // setCategories(
      //   categoryData.data.map(({ DropDownValue }) => ({
      //     value: DropDownValue,
      //     label: DropDownValue
      //   }))
      // )

      setCategories(
        categoryData.data.map(item => ({
          label: item.DropDownValue,
          value: item.Id   // <- send Id when selected
        }))
      );

      setStateDatas(
        stateData.data.map(({ Id, DropDownValue }) => ({
          id: Id,
          label: DropDownValue
        }))
      )

      setDistrictDatas(
        districtData.data.map(({ Id, DropDownValue }) => ({
          id: Id,
          label: DropDownValue
        }))
      )

      const registrationTable = registrationData.data // ✅ direct array


      const mappedData = registrationTable.map(item => {

        const formatDateTime = (value) => {
        if (!value) return '';
        const date = new Date(value);

        if (isNaN(date.getTime())) return '';

        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ` + `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
       };

       const createdOn = formatDateTime(item.CreatedDate);
       const modifiedOn = formatDateTime(item.ModifiedDate);

       return {
        id: item.Id,
        exhType: item.ExhType,
        firstname: item.FirstName,
        lastname: item.LastName,
        registrationno: item.RegitrationNo,
        productimage: item.ProductImage,
        previousYearStallImage: item.PreviousYearStallImage,
        category: item.BusinessCategoryName,
        emailaddress: item.Email,
        phonenumber: item.Phone,
        age: item.Age === 0 ? '' : item.Age,
        community: item.community,
        companyName: item.CompanyName,
        natureOfBusiness: item.NatureOfActivities,
        yearEstablished: item.YearEstablished,
        state: item.StateName,
        district: item.DistrictName,
        businessTurnOver: item.BusinessTurnOver,
        udyogNumber: item.UdyogRegistrationId,
        GSTNumber: item.GSTNumber,
        panNo: item.PanNo,
        descriptionOfProducts: item.DescriptionOfProducts,
        stallSize: item.StallSize,
        stallLength: item.StallLength,
        stallbreadth: item.Stallbreadth,
        alreadyAttended: item.AlreadyAttended == '0'? 'No':'Yes',
        referencedBy: item.ReferenceByName,
        items: item.Items,
        SlotId: item.SlotId,

        createdOn: createdOn,

        // modifiedOn: format(new Date(item.ModifiedDate), 'yyyy-MM-dd HH:mm:ss'),
        slotNumber: item.SlotNumber
       }
      })

      setOriginalData(mappedData)
      setData(mappedData)
      setTotalCount(registrationData.filteredCount)
    } catch (err) {
      setLoading(false)
      console.log('Error fetching data:', err)
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const [stateDataSets, setStateDataSets] = useState({
    type: 'state',
    IsActive: 1,
    offset: 0
  })




  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchRegistrations()
  }, [filtersnone, getStateId, selectedRowsId])

  // States

  const [selectedRows, setSelectedRows] = useState([])
  const [selectedSlotIdRows, setSelectedSlotIdRows] = useState([])
  const [isHeaderCheckboxSelected, setIsHeaderCheckboxSelected] = useState(false)

  const handleCheckboxChange = (rowId, slotId) => {
    // Update selectedRows
    setSelectedRows(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId) // Remove rowId if already selected
        : [...prev, rowId] // Add rowId if not selected
    );

    // Update selectedSlotIdRows
    setSelectedSlotIdRows(prev =>
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId) // Remove slotId if already selected
        : [...prev, slotId] // Add slotId if not selected
    );
  };


  const handleRemove = async () => {
    if (selectedRows.length === 0) {
      Swal.fire('No rows selected', 'Please select rows to delete.', 'warning')

      return
    }

    const confirmApprove = await Swal.fire({
      title: `Do you want to remove ${selectedRows.length === 1 ? 'the stall' : 'the selected stalls'}?`,
      text: '',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    })

    if (confirmApprove.isConfirmed) {
      try {
        setLoading(true) // Indicate loading state

        fetchRegistrations();

        const payload = selectedRows.map((rowId, index) => ({
          RegistrationId: rowId, // Use rowId from selectedRows array
          Isbooked: '1',
          StallApprove: '2',
          SlotId: selectedSlotIdRows[index] || '', // Match SlotId using the same index from selectedSlotIdRows
          SavedBy: userInfo.id,
          SavedUserName: userInfo.userName,
        }));

        const responses = await Promise.all(
          payload.map(rowPayload =>
            axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotbooking`, rowPayload, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        )

        if (responses.every(response => response.status === 200)) {
          updatedValuesPage();
          fetchRegistrations();
          Swal.fire(
            'Success!',
            `${selectedRows.length === 1 ? 'The stall' : 'The selected stalls'} have been removed successfully!`,
            'success'
          )
          setSelectedRows([]) // Clear selected rows
          setSelectedSlotIdRows([]);
        }
      } catch (error) {
        console.log('Error:', error)
        Swal.fire('Error', error.message || 'Failed to remove the stall(s).', 'error')
      } finally {
        setLoading(false) // Reset loading state
      }
    }
  }

  const handleSendMessage = () => {

    const selectedEmails = data
      .filter(row => selectedRows.includes(row.id))
      .map(row => row.emailaddress)
      .join(','); // Convert array to comma-separated string

    Swal.fire({
      title: 'Send Email',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Subject">' +
        '<textarea id="swal-input2" class="swal2-textarea" placeholder="Type your message here..."></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const subject = document.getElementById('swal-input1').value;
        const message = document.getElementById('swal-input2').value;

        return { subject, message };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const { subject, message } = result.value;

        const payload = {
          to: selectedEmails, // Comma-separated email addresses
          subject: subject,
          message: message
        };

        // Sending email via axios post
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/email`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            // Extract success and failure email details
            const successEmails = res.data?.successEmails || [];
            const failedEmails = res.data?.failedEmails || [];

            // Create a formatted message with colors
            const message = `
              Emails Sent Successfully!<br />
              Emails Sent: ${successEmails.length + failedEmails.length}<br />
              <span style="color: green;">Success: ${successEmails.length} </span>
              <span style="color: red;"> Failed: ${failedEmails.length}</span>
            `;

            // Display the toast with HTML content
            toast.success(<div dangerouslySetInnerHTML={{ __html: message }} />);

          })
          .catch((error) => {
            const errorMessage =
              error.response?.data?.message || 'Failed to send emails. Please try again.';

            toast.error(`Error: ${errorMessage}`);
          });



      }
    });
  };


  const handleHeaderCheckboxChange = () => {
    setIsHeaderCheckboxSelected(prev => !prev)
    setSelectedRows(isHeaderCheckboxSelected ? [] : data.map(row => row.id))
  }

  const handleEditStall = async rowData => {
    const confirmApprove = await Swal.fire({
      title: 'Do you want to edit the stall?',
      text: '',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Edit',
      cancelButtonText: 'Cancel'
    })

    if (confirmApprove.isConfirmed) {
      const payload = {
        RegistrationId: rowData.id,
        StallApprove: '2',
        SavedBy: userInfo.id,
        SavedUserName: userInfo.userName
      }

      try {
        setLoading(true) // Indicate loading state
        setFormData(prev => ({
          ...prev,
          StallApprove: payload.StallApprove,
          RegistrationId: payload.RegistrationId
        }))
        setSectionHandler('stall') // Navigate to the desired section
        updatedValuesPage();
        fetchRegistrations();

        // Swal.fire('Success', 'The stall has been approved!', 'success');
      } catch (error) {
        console.log('Error:', error)
        setError(error.message || 'An unexpected error occurred.')
        Swal.fire('Error', error.message || 'Failed to approve the stall.', 'error')
      } finally {
        setLoading(false) // Reset loading state
      }
    }
  }

  // Hooks

  // First Name,Last Name,Registration No,Registration Type,Email Address,Phone Number,Age,State,District
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={selectedRows.length === data.length && data.length > 0} // Check if all rows are selected
            indeterminate={selectedRows.length > 0 && selectedRows.length < data.length} // Indeterminate if some rows are selected
            onChange={() => {
              if (selectedRows.length === data.length) {
                // Deselect all rows
                setSelectedRows([]);
                setSelectedSlotIdRows([]);
              } else {
                // Select all rows
                setSelectedRows(data.map(row => row.id));
                setSelectedSlotIdRows(data.map(row => row.SlotId)); // Select corresponding slot IDs
              }
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={
              selectedRows.includes(row.original.id) &&
              selectedSlotIdRows.includes(row.original.SlotId) // Check both row ID and slot ID
            }
            onChange={() => {
              handleCheckboxChange(row.original.id, row.original.SlotId); // Toggle selection for the individual row
            }}
          />
        )
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <>
            <Button variant='contained' color='primary' size='small' onClick={() => handleEditStall(row.original)}>
              Edit Stall
            </Button>
          </>
        )
      },
      columnHelper.accessor('slotNumber', {
        cell: info => info.getValue(),
        header: 'Stall Number'
      }),
      columnHelper.accessor('exhType', {
        cell: info => info.getValue(),
        header: 'Exhibitor Type'
      }),
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
      columnHelper.accessor('productimage', {
        cell: info => {
          const value = info.getValue()

          if (!value) {
            // Handle empty or null case
            return <div style={{ color: '#888', fontSize: '12px' }}>No Image Found!</div>
          }

          const isPDF = value.toLowerCase().endsWith('.pdf')

          return isPDF ? (
            <a href={`${process.env.NEXT_PUBLIC_APP_URL}${value}`} target='_blank' rel='noopener noreferrer'>
              <embed
                src={`${process.env.NEXT_PUBLIC_APP_URL}${value}`}
                type='application/pdf'
                style={{ width: '50px', height: '50px' }}
              />
            </a>
          ) : (
            <a href={`${process.env.NEXT_PUBLIC_APP_URL}${value}`} target='_blank' rel='noopener noreferrer'>
              <img
                src={`${process.env.NEXT_PUBLIC_APP_URL}${value}`}
                alt='Product'
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              />
            </a>
          )
        },
        header: 'Product Image'
      }),
      columnHelper.accessor('previousYearStallImage', {
        cell: info => {
          const value = info.getValue()

          if (!value) {
            // Handle empty or null case
            return <div style={{ color: '#888', fontSize: '12px' }}>No Image Found!</div>
          }

          const isPDF = value.toLowerCase().endsWith('.pdf')

          return isPDF ? (
            <a href={`${process.env.NEXT_PUBLIC_APP_URL}${value}`} target='_blank' rel='noopener noreferrer'>
              <embed
                src={`${process.env.NEXT_PUBLIC_APP_URL}${value}`}
                type='application/pdf'
                style={{ width: '50px', height: '50px' }}
              />
            </a>
          ) : (
            <a href={`${process.env.NEXT_PUBLIC_APP_URL}${value}`} target='_blank' rel='noopener noreferrer'>
              <img
                src={`${process.env.NEXT_PUBLIC_APP_URL}${value}`}
                alt='Previous Year Stall'
                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              />
            </a>
          )
        },
        header: 'Previous Year Stall Image'
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
      columnHelper.accessor('community', {
        cell: info => info.getValue(),
        header: 'Community'
      }),
      columnHelper.accessor('companyName', {
        cell: info => info.getValue(),
        header: 'Company Name'
      }),
      columnHelper.accessor('natureOfBusiness', {
        cell: info => info.getValue(),
        header: 'Nature Of Business'
      }),
      columnHelper.accessor('yearEstablished', {
        cell: info => info.getValue(),
        header: 'Year Established'
      }),
      columnHelper.accessor('state', {
        cell: info => info.getValue(),
        header: 'State'
      }),
      columnHelper.accessor('district', {
        cell: info => info.getValue(),
        header: 'District'
      }),
      columnHelper.accessor('businessTurnOver', {
        cell: info => info.getValue(),
        header: 'Business TurnOver'
      }),
      columnHelper.accessor('udyogNumber', {
        cell: info => info.getValue(),
        header: 'Udyog No'
      }),
      columnHelper.accessor('GSTNumber', {
        cell: info => info.getValue(),
        header: 'GST No'
      }),
      columnHelper.accessor('panNo', {
        cell: info => info.getValue(),
        header: 'PAN No'
      }),
      columnHelper.accessor('descriptionOfProducts', {
        cell: info => info.getValue(),
        header: 'Description Of Products'
      }),
      columnHelper.accessor('stallSize', {
        cell: info => info.getValue(),
        header: 'Stall Size Type'
      }),
      columnHelper.accessor('stallLength', {
        cell: info => info.getValue(),
        header: 'Stall Length'
      }),
      columnHelper.accessor('Stallbreadth', {
        cell: info => info.getValue(),
        header: 'Stall Breadth'
      }),
      columnHelper.accessor('alreadyAttended', {
        cell: info => info.getValue(),
        header: 'Participated'
      }),
      columnHelper.accessor('referencedBy', {
        cell: info => info.getValue(),
        header: 'Referenced By'
      }),
      columnHelper.accessor('items', {
        cell: info => info.getValue(),
        header: 'Items'
      }),
      columnHelper.accessor('createdOn', {
        cell: info => info.getValue(),
        header: 'Created On'
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRows]
  )

  const exportToPdf = () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)

    const docWidth = 450 // A3 width in landscape mode
    const docHeight = 297 // A3 height in landscape mode

    const doc = new jsPDF('landscape', 'mm', [docWidth, docHeight])

    doc.text('StallBooked', 10, 10)

    const tableData = filteredData.map(item => [
      item.exhType,
      item.firstname,
      item.lastname,
      item.registrationno,
      item.slotNumber,
      item.category,
      item.emailaddress,
      item.phonenumber,
      item.community,
      item.companyName,
      item.state,
      item.district,
      item.stallSize,
      item.stallLength,
      item.Stallbreadth,
      item.productimage ? `${process.env.NEXT_PUBLIC_APP_URL}${item.productimage}` : 'No Image URL',
      item.previousYearStallImage ? `${process.env.NEXT_PUBLIC_APP_URL}${item.previousYearStallImage}` : 'No Image URL'
    ])

    const tableHeaders = [
      'Exhibitor Type',
      'First Name',
      'Last Name',
      'Registration No',
      'Slot Number',
      'Category',
      'Email Address',
      'Phone Number',
      'Community',
      'Company Name',
      'State',
      'District',
      'Stall Size',
      'Stall Length',
      'Stall Breadth',
      'Product Image URL',
      'Previous Year Stall Image URL'
    ]

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      styles: { fontSize: 7, halign: 'center', overflow: 'linebreak' },
      startY: 30,
      columnStyles: {
        0: { cellWidth: 20 }, // Exhibitor Type
        1: { cellWidth: 20 }, // First Name
        2: { cellWidth: 20 }, // Last Name
        3: { cellWidth: 20 }, // Registration No
        4: { cellWidth: 25 }, // Category
        5: { cellWidth: 20 }, // Email Address
        6: { cellWidth: 20 }, // Phone Number
        7: { cellWidth: 25 }, // Community
        8: { cellWidth: 20 }, // Company Name
        9: { cellWidth: 25 }, // State
        10: { cellWidth: 25 }, // District
        11: { cellWidth: 20 }, // Stall Size
        12: { cellWidth: 20 }, // Stall Length
        13: { cellWidth: 20 }, // Stall Breadth
        14: { cellWidth: 20 }, // Product Image URL
        15: { cellWidth: 20 }, // Previous Year Stall Image URL
        16: { cellWidth: 50 }, // Previous Year Stall Image URL
        17: { cellWidth: 50 }, // Previous Year Stall Image URL
      }
    })

    doc.save('StallBooked.pdf')
  }

  const exportToExcel = () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original)

    console.log(filteredData)

    // Define the headers
    const headers = [
      'Exhibitor Type',
      'First Name',
      'Last Name',
      'Registration No',
      'Slot Number',
      'Category',
      'Email Address',
      'Phone Number',
      'Community',
      'Company Name',
      'Nature of Business',
      'Year Established',
      'State',
      'District',
      'Business Turnover',
      'Udyog Number',
      'GST Number',
      'PAN No',
      'Description of Products',
      'Stall Size',
      'Stall Length',
      'Stall Breadth',
      'Participated',
      'Referenced By',
      'Items',
      'Product Image URL',
      'Previous Year Stall Image URL',
      'Created On'
    ]

    // Map data to rows
    const ExcelData = filteredData.map(item => [
      item.exhType,
      item.firstname,
      item.lastname,
      item.registrationno,
      item.slotNumber,
      item.category,
      item.emailaddress,
      item.phonenumber,
      item.community,
      item.companyName,
      item.natureOfBusiness,
      item.yearEstablished,
      item.state,
      item.district,
      item.businessTurnOver,
      item.udyogNumber,
      item.GSTNumber,
      item.panNo,
      item.descriptionOfProducts,
      item.stallSize,
      item.stallLength,
      item.Stallbreadth,
      item.alreadyAttended,
      item.referencedBy,
      item.items,
      item.productimage ? `${process.env.NEXT_PUBLIC_APP_URL}${item.productimage}` : 'No Image URL',
      item.previousYearStallImage ? `${process.env.NEXT_PUBLIC_APP_URL}${item.previousYearStallImage}` : 'No Image URL',
      item.createdOn
    ])

    // Log the ExcelData to check for the URLs
    console.log('Excel Data:', ExcelData)

    // Combine headers and data
    const completeData = [headers, ...ExcelData]

    // Convert the data to a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(completeData)

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Trigger download
    XLSX.writeFile(workbook, 'StallBooked.xlsx')
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
        onSortingChange: setsortingFilter, // ✅ capture sorting click events
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

   // ✅ Initial data load — after table is created
  useEffect(() => {
    if (!table) return;
    fetchRegistrations(0, table.getState().pagination.pageSize || 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Debounce search
  useEffect(() => {
    if (!table) return;

    const delay = setTimeout(() => {
      fetchRegistrations(0, table.getState().pagination.pageSize || 10);
    }, 500);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

  // ✅ Debounce sorting change
  useEffect(() => {
    if (!table) return;

    const delay = setTimeout(() => {
      const { pageIndex, pageSize } = table.getState().pagination;

      fetchRegistrations(pageIndex, pageSize);
    }, 500);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);



  useEffect(() => {
    if (!getStateId) return;

    // fetch district list based on state
    fetchRegistrations(
      table.getState().pagination.pageIndex,
      table.getState().pagination.pageSize
    );

  }, [getStateId]);



  useEffect(() => {
    fetchRegistrations(
      table.getState().pagination.pageIndex,
      table.getState().pagination.pageSize
    );
  }, [districtFilter]);

      useEffect(() => {
    if (!categoryTypeFilter) return;

    // fetch district list based on state
    fetchRegistrations(
      table.getState().pagination.pageIndex,
      table.getState().pagination.pageSize
    );

  }, [categoryTypeFilter]);

  useEffect(() => {
    if (!exhTypeFilter) return;

    // fetch district list based on state
    fetchRegistrations(
      table.getState().pagination.pageIndex,
      table.getState().pagination.pageSize
    );

  }, [exhTypeFilter]);



  const handleChange = event => {
    setCategoryTypeFilter(event.target.value) // Always an array
  }

  const handleDelete = (valueToDelete, event) => {
    event.stopPropagation() // Prevent dropdown from opening
    setCategoryTypeFilter(prev => prev.filter(item => item !== valueToDelete)) // Remove item from selected filter
  }

  const handleBookingSuccess = msg => {
    setFormData({
      ...formData,
      StallApprove: '',
      RegistrationId: ''
    })
    fetchRegistrations();
    setSelectedRows([]) // Clear selected rows
    setSectionHandler(msg)
    console.log(msg) // You can handle the message further if needed
  }

  console.log(selectedRows);
  console.log(selectedSlotIdRows);


  const handleSectionChange = () => {
    switch (sectionHandler) {
      case 'table':
        return (
          <>
            <Card>
              <CardHeader
                className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
                title='StallBooked'
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
                        <Button
                          variant='contained'
                          className='text-white px-2 py-2 rounded-md'
                          onClick={handleSendMessage}
                        >
                          Send Email
                        </Button>
                        <Button
                          variant='contained'
                          className='text-white px-2 py-2 rounded-md'
                          color='error'
                          onClick={handleRemove}
                        >
                          Remove
                        </Button>
                        {/* <Button
                          variant='contained'
                          className='text-white px-2 py-2 rounded-md'
                          onClick={() => handleEditStall(selectedRows[0])}
                          disabled={selectedRows.length !== 1}
                        >
                          Edit Stall
                        </Button> */}
                      </div>
                    </div>

                    {/* Dropdowns for Registration Type, State, and District */}
                    <Select
                        value={categoryTypeFilter}
                        onChange={(e) => setCategoryTypeFilter(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ minWidth: 250 }}
                      >
                        <MenuItem value="">
                          <em>Select Category</em>
                        </MenuItem>

                        {categories.map(c => (
                          <MenuItem key={c.value} value={c.value}>
                            {c.label}
                          </MenuItem>
                        ))}
                    </Select>


                    {/* exhibitor type filter  */}

                    <Select
                      value={exhTypeFilter || ''}
                      onChange={e => {
                        const selectedItem = exhType.find(item => item === e.target.value)
                        const stateId = selectedItem ? selectedItem : null

                        setexhTypeFilter(e.target.value) // Update state filter
                      }}
                      displayEmpty
                      className='border rounded-md px-3 py-2'
                      sx={{
                        height: 45,
                        fontSize: '0.875rem',
                        padding: 0
                      }}
                    >
                      <MenuItem value=''>Exhibitor type</MenuItem>
                      {exhType.map((item, index) => (
                        <MenuItem key={index} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* state dropdown  */}

                    <Select
              value={getStateId || ""}
              onChange={e => {
                const selectedStateId = e.target.value;

                setGetStateId(selectedStateId);
                setDistrictFilter("");   // reset district

              }}
              displayEmpty
              sx={{
                minWidth: 200,
                height: 45,
                fontSize: "0.875rem",
              }}
            >
              <MenuItem value="">
                <em>State</em>
              </MenuItem>

              {stateDatas.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
                    </Select>



                    <Select
                      value={districtFilter || ""}
                      onChange={e => {
                        const selectedDistrictId = e.target.value;

                        setDistrictFilter(selectedDistrictId);

                        fetchRegistrations(
                          table.getState().pagination.pageIndex,
                          table.getState().pagination.pageSize
                        );
                      }}
                      displayEmpty
                      className="border rounded-md px-3 py-2"
                      sx={{ height: 45, fontSize: "0.875rem", padding: 0 }}
                    >
                      <MenuItem value="">
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
                                    onClick={() => {
                                      const isDesc = sorting?.[0]?.id === header.column.id ? !sorting[0].desc : false;

                                      setsortingFilter([{ id: header.column.id, desc: isDesc }]);
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
                rowsPerPageOptions={[
                  { label: '10', value: 10 },
                  { label: '50', value: 50 },
                  { label: '100', value: 100 },
                  { label: '500', value: 500 },
                  { label: 'All', value: filteredCount }
                ]}
                component="div"
                count={filteredCount || 0}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}

                onPageChange={(_, newPage) => {
                  table.setPageIndex(newPage);
                  const size = table.getState().pagination.pageSize;

                  fetchRegistrations(newPage, size);
                }}

                onRowsPerPageChange={(e) => {
                  const newSize = Number(e.target.value);

                  table.setPageSize(newSize);
                  table.setPageIndex(0);
                  fetchRegistrations(0, newSize);
                }}

                labelDisplayedRows={({ page, count }) => {
                  const rowsPerPage = table.getState().pagination.pageSize;
                  const start = count === 0 ? 0 : page * rowsPerPage + 1;
                  const end = Math.min(count, (page + 1) * rowsPerPage);

                  return `${start}–${end} of ${count}`;
                }}
              />
            </Card>
          </>
        )
        break
      case 'stall':
        return (
          <>
            <Card>
              <CardHeader
                className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
                title='Total Booked Stalls'
              />
              <Button onClick={() => setSectionHandler('table')}>Back</Button>
              <UpdateStall registrationUserId={formData.RegistrationId} onBookingSuccess={handleBookingSuccess} updatedValuesPage={updatedValuesPage} fetchRegistration={fetchRegistrations} />
            </Card>
            {/* Full-Screen Loader */}
   <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
          </>
        )
    }
  }

  return <>{handleSectionChange()}

  </>
}

export default StallBookedTable
