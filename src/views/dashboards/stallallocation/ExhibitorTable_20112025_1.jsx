/* eslint-disable react/jsx-no-undef */
'use client'

// React Imports

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import {  Backdrop, CircularProgress } from '@mui/material';

// MUI Imports
import { Box, Chip, ListItemText } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import { format } from 'date-fns'

// Third-party Imports
import classnames from 'classnames'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

import axios from 'axios'

import Swal from 'sweetalert2'

import IconButton from '@mui/material/IconButton'

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
import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

// Data Imports
import StallBookingPopup from './StallBookingPopup'

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

const ExhibitorTable = ({ updatedValuesPage }) => {
  // States
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sorting, setsortingFilter] = useState([])

  const [exhTypeFilter, setexhTypeFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('')

  const [getStateId, setGetStateId] = useState('')

  const [originalData, setOriginalData] = useState([])
  const [stateDatas, setStateDatas] = useState([])
  const [exhType, setexhType] = useState(['B2B', 'B2C', 'PSU'])
  const [districtDatas, setDistrictDatas] = useState([])
  const [filteredCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userInfo = JSON.parse(getLocalStorageItem('userInfo'))
  const token = getLocalStorageItem('accessToken')

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

  const [formData, setFormData] = useState({
    StallApprove: '',
    SlotId: '',
    Isbooked: '',
    RegistrationId: '',
    SavedBy: userInfo.id,
    SavedUserName: userInfo.userName
  })

  const [data, setData] = useState([])



  const [categories, setCategories] = useState([])


  useEffect(() => {
    updatedValuesPage();
  }, [originalData,data])

  // Hooks

   const [filtersnone, setFilters] = useState({
      RegistrationType: 'OTHERS',
      IsActive: 1,
      offset: 0
    })

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
            RegistrationType: ["EXHIBITORS"]
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

        console.log("rr:",requestData);

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

            console.log("rrr..check.",registrationData.data);


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

      console.log("----------------------",registrationData.data);
      console.log('------------------------mappedData-------------------------');

  const registrationTable = registrationData.data // ✅ direct array

       const formatDateTime = (value) => {
        if (!value) return '';
        const date = new Date(value);

        if (isNaN(date.getTime())) return '';

        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ` + `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
       };

       const mappedData = registrationTable.map(item => {
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
        community: item.CommunityName,
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
        stallbreadth: item.StallBreadth,
        alreadyAttended: item.AlreadyAttended === '0' ? 'No' : 'Yes',
        referencedBy: item.ReferenceByName,
        items: item.Items,
        createdOn: createdOn,
        modifiedOn: modifiedOn
      };
    });


      setOriginalData(mappedData)
      setData(mappedData)
      setTotalCount(registrationData.filteredCount)
      console.log('------------------------mappedData-------------------------');
      console.log(mappedData);
    } catch (err) {
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
  }, [filtersnone, getStateId])

  // First Name,Last Name,Registration No,Registration Type,Email Address,Phone Number,Age,State,District
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <IconButton color='success' size='small' onClick={() => handleApprove(row.original)}>
              ✔
            </IconButton>
            <IconButton color='error' size='small' onClick={() => handleReject(row.original)}>
              🗙
            </IconButton>
          </div>
        )
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
      columnHelper.accessor('stallbreadth', {
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
    []
  )

  const exportToPdf = () => {
    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

    const docWidth = 450; // A3 width in landscape mode
    const docHeight = 297; // A3 height in landscape mode

    const doc = new jsPDF('landscape', 'mm', [docWidth, docHeight]);

    doc.text('Exhibitor Registration', 10, 10);

    const tableData = filteredData.map(item => [
        item.exhType,
        item.firstname,
        item.lastname,
        item.registrationno,
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
        item.previousYearStallImage ? `${process.env.NEXT_PUBLIC_APP_URL}${item.previousYearStallImage}` : 'No Image URL',
    ]);

    const tableHeaders = [
        'Exhibitor Type',
        'First Name',
        'Last Name',
        'Registration No',
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
        'Previous Year Stall Image URL',
    ];

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
        15: { cellWidth: 50 }, // Previous Year Stall Image URL
        15: { cellWidth: 50 }, // Previous Year Stall Image URL
        },
    });

    doc.save('Exhibitor Registration.pdf');
};

  const exportToExcel = () => {


    const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

    console.log(filteredData);



    // Define the headers
    const headers = [
      'Exhibitor Type',
      'First Name',
      'Last Name',
      'Registration No',
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
      'Created On',
    ];

    // Map data to rows
    const ExcelData = filteredData.map(item => [
      item.exhType,
      item.firstname,
      item.lastname,
      item.registrationno,
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
      item.createdOn,
    ]);

    // Log the ExcelData to check for the URLs
    console.log('Excel Data:', ExcelData);

    // Combine headers and data
    const completeData = [headers, ...ExcelData];

    // Convert the data to a worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(completeData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Trigger download
    XLSX.writeFile(workbook, 'Exhibitors.xlsx');
  };



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



  useEffect(() => {
    if (!table) return;
    fetchRegistrations(0, table.getState().pagination.pageSize || 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!table) return;

    const delay = setTimeout(() => {
      fetchRegistrations(0, table.getState().pagination.pageSize || 10);
    }, 500);

    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

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

  const handleApprove = async (rowData) => {
    const confirmApprove = await Swal.fire({
      title: 'Do you want to approve this registration?',
      text: '',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    });

    if (confirmApprove.isConfirmed) {
      const payload = {
        RegistrationId: rowData.id,
        StallApprove: '1',
        SavedBy: userInfo.id,
        SavedUserName: userInfo.userName
      };

      try {
        await stallApproved(payload); // Approve the stall
        setFormData(prev => ({
          ...prev,
          StallApprove: payload.StallApprove,
          RegistrationId: payload.RegistrationId
        }));
        setSectionHandler('stall'); // Navigate to the desired section

        Swal.fire('Success', 'Registration approved successfully!', 'success');
      } catch (error) {
        console.log('Error:', error);
        setError(error.message || 'An unexpected error occurred.');
        Swal.fire('Error', error.message || 'Failed to approve the Registration.', 'error');

      }
    }
  };



  const stallApproved = async (payload) => {

    setLoading(true); // Start the loader

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apps/slotbooking`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      updatedValuesPage();
      setLoading(false); // Stop the loader after successful API call

      return response.data; // Return response data for further use, if needed
    } catch (error) {
      setLoading(false); // Stop the loader if an error occurs
      throw new Error(error.response?.data?.message || 'Failed to approve the stall.');
    }
  };


  const handleBookingSuccess = msg => {
    setLoading(true); // Start the loader
    updatedValuesPage();
    setFormData({
      ...formData,
      StallApprove: '',
      RegistrationId: ''
    })
    setSectionHandler(msg)
    console.log(msg) // You can handle the message further if needed
    setLoading(false); // Stop the loader after successful API call
  }

  const handleReject = async rowData => {
    const confirmReject = await Swal.fire({
      title: 'Do you want to reject this registration?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    })

    if (confirmReject.isConfirmed) {
      const payload = {
        RegistrationId: rowData.id,
        StallApprove: '1',
        SavedBy: userInfo.id,
        SavedUserName: userInfo.userName
      }

      try {
        updatedValuesPage();
        setLoading(true) // Indicate loading state
        await stallApproved(payload) // Pass the payload explicitly
        setFormData(prev => ({
          ...prev,
          StallApprove: payload.StallApprove,
          RegistrationId: payload.RegistrationId
        }))

        // Swal.fire({
        //   title: 'Rejected',
        //   text: 'Exhitor Rejected Successfully !ib.',
        //   icon: 'success'
        // })



        Swal.fire('Rejected', 'Rejected Successfully!', 'success').then(() => {
          fetchRegistrations()
        })
      } catch (error) {
        console.log('Error:', error)
        setError(error.message || 'An unexpected error occurred.')
        Swal.fire('Error', error.message || 'Failed to approve the stall.', 'error')
      } finally {
        setLoading(false) // Reset loading state
      }
    }
  }

  const handleSectionChange = () => {
    switch (sectionHandler) {
      case 'table':
        return (
          <>
            <Card>
              <CardHeader
                className='flex flex-wrap overflow-x-auto gap-y-2 items-center justify-between'
                title='Exhibitor Registration'
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
                      rowsPerPage={table?.getState()?.pagination?.pageSize || 10}
                      page={table?.getState()?.pagination?.pageIndex || 0}
                      onPageChange={(_, newPage) => {
                        table.setPageIndex(newPage);
                        const size = table.getState().pagination.pageSize || 10;

                        fetchRegistrations(newPage, size);
                      }}
                      onRowsPerPageChange={(e) => {
                        const newSize = Number(e.target.value);

                        table.setPageSize(newSize);
                        table.setPageIndex(0);
                        fetchRegistrations(0, newSize);
                      }}
                      labelDisplayedRows={({ page = 0, count = 0, rowsPerPage = 10 }) => {
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
                title='Exhibitor Registration'
              />
              <Button onClick={() => setSectionHandler('table')}>Back</Button>
              <StallBookingPopup registrationUserId={formData.RegistrationId} onBookingSuccess={handleBookingSuccess} />
            </Card>
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

  return <>{handleSectionChange()}</>
}

export default ExhibitorTable
