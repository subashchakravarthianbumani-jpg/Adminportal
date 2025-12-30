/* eslint-disable react/jsx-no-undef */
'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// MUI Imports
import { Box, Chip, ListItemText } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import 'dotenv/config'
import SyncLoader from 'react-spinners/SyncLoader'

// Third-party Imports
import axios from 'axios'
import classnames from 'classnames'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
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
import { Backdrop, CircularProgress } from '@mui/material'

import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

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
  const [sorting, setsortingFilter] = useState([])
  const [stateFilter, setStateFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [registertypeFilter, setregistertypeFilter] = useState('')
  const [getStateId, setGetStateId] = useState('')
  const [categoryTypeFilter, setCategoryTypeFilter] = useState([])
  const [originalData, setOriginalData] = useState([])
  const [data, setData] = useState([])
  const [stateDatas, setStateDatas] = useState([])
  const [districtDatas, setDistrictDatas] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [categories, setCategories] = useState([
    {
      id: '0001',
      value: 'VISITOR',
      label: 'Visitor'
    },
    {
      id: '0002',
      value: 'Exhibitors',
      label: 'Exhibitors'
    },
    {
      id: '0001',
      value: 'OTHERS',
      label: 'Others'
    },
    {
      id: '0002',
      value: 'Seminar_Attendee',
      label: 'Seminar Attendee '
    }
  ])

  // Query parameters state
  const [filters, setFilters] = useState({
    RegistrationType: 'OTHERS',
    IsActive: 1,
    offset: 0
  })

  const [stateDataSets, setStateDataSets] = useState({
    type: 'state',
    IsActive: 1,
    offset: 0
  })

  // 🔹 Fetch Registrations with pagination control
const fetchRegistrations = async (pageIndex = 0, pageSize = 10) => {
  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem("accessToken");

    const skip = pageIndex * pageSize;
    const take = pageSize;

    // ✅ get sorting state safely
    const sortingState = Array.isArray(sorting) && sorting.length > 0 ? sorting[0] : {};

    // ✅ Map column ID to backend field name
    const fieldMap = {
      firstname: "FirstName",
      lastname: "LastName",
      registrationno: "RegistrationNo",
      category: "RegistrationType",
      emailaddress: "Email",
      phonenumber: "Phone",
      gender: "GenderName",
      state: "StateName",
      district: "DistrictName"
    };

    const sortingPayload = sortingState.id
      ? {
          fieldName: fieldMap[sortingState.id] || sortingState.id,
          sort: sortingState.desc ? "DESC" : "ASC"
        }
      : {};

    const requestData = {
      skip,
      take,
      searchString: globalFilter || "",
      sorting: sortingPayload,
      columnSearch: [],
      where: {}
    };

    console.log("📤 Request Payload:", requestData);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/apps/registrationlist`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );


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
          offset: 0,
          DependentId: getStateId // Pass the selected state's ID
        }
      })

      const categoryDatas = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apps/dropdownlist`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          type: 'OTHERSCATEGORY',
          IsActive: 1,
          offset: 0
        }
      })

      console.log("-----------response-----------",response);
      console.log("-----------stateData-----------",stateData.data.data);



    if (response.status === 200 && response.data?.data && stateData.data?.data && districtData.data?.data && categoryDatas.data?.data) {

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

      const mappedData = response.data.data.map(item => ({
        firstname: item.FirstName,
        lastname: item.LastName,
        registrationno: item.RegistrationNo,
        category: item.RegistrationType,
        emailaddress: item.Email,
        phonenumber: item.Phone,
        gender: item.GenderName,
        age: item.Age,
        state: item.StateName,
        district: item.DistrictName
      }));

      setOriginalData(mappedData);
      setData(mappedData);
      setTotalCount(response.data.totalCount || mappedData.length);
    } else {
      setData([]);
      setError("No data found");
    }
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    setError(err.response?.data?.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

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




  // Fetch data on component mount or filters change
  useEffect(() => {
    fetchRegistrations()
  }, [filters, getStateId])

  // Hooks

  // First Name,Last Name,Registration No,Registration Type,Email Address,Phone Number,Age,State,District
  const columns = useMemo(
    () => [
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
      columnHelper.accessor('registrationno', {
        cell: info => info.getValue(),
        header: 'Registration No'
      }),
      columnHelper.accessor('category', {
        cell: info => info.getValue(),
        header: 'Registration Type'
      }),
      columnHelper.accessor('emailaddress', {
        cell: info => info.getValue(),
        header: 'Email'
      }),
      columnHelper.accessor('phonenumber', {
        cell: info => info.getValue(),
        header: 'Phone Number'
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
    doc.text('Registration Details', 10, 10)

    // Format data for the table district state age email phone category registrationno lastname firstname
    const tableData = filteredData.map(item => [
      item.firstname,
      item.lastname,
      item.gender,
      item.registrationno,
      item.category,
      item.emailaddress,
      item.phonenumber,
      item.state,
      item.district
    ])

    // Define column headers
    const tableHeaders = [
      'First Name',
      'Last Name',
      'Gender',
      'Registration No',
      'Registration Type',
      'Email Address',
      'Phone Number',
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
    doc.save('Registration.pdf')
  }

  const exportToExcel = () => {


      const filteredData = table.getFilteredRowModel().rows.map(row => row.original);

      console.log(filteredData);



      // Define the headers
      const headers = [
        'First Name',
      'Last Name',
      'Gender',
      'Registration No',
      'Registration Type',
      'Email Address',
      'Phone Number',
      'State',
      'District'
      ];

      // Map data to rows
      const ExcelData = filteredData.map(item => [
        item.firstname,
      item.lastname,
      item.gender,
      item.registrationno,
      item.category,
      item.emailaddress,
      item.phonenumber,
      item.state,
      item.district
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
      XLSX.writeFile(workbook, 'Registration Details.xlsx');
    };

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
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setsortingFilter, // ✅ capture sorting click events
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  useEffect(() => {
    const filteredData = originalData.filter(item => {
      return (
        (categoryTypeFilter.length > 0
          ? categoryTypeFilter.some(filter => filter.toLowerCase() === item.category?.toLowerCase())
          : true) &&
        (stateFilter ? item.state?.toLowerCase() === stateFilter.toLowerCase() : true) &&
        (districtFilter ? item.district?.toLowerCase() === districtFilter.toLowerCase() : true)
      )
    })

    setData(filteredData)
  }, [categoryTypeFilter, stateFilter, districtFilter, originalData])




  useEffect(() => {
    if (table.getState().columnFilters[0]?.id === 'fullName') {
      if (table.getState().sorting[0]?.id !== 'fullName') {
        table.setSorting([{ id: 'fullName', desc: false }])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnFilters[0]?.id])

  const handleFilterChange = (filterType, value) => {
    // Update your filter state logic based on filterType and value
  }

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
        title='Registration Details'
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
            {/* <Select
              multiple
              value={categoryTypeFilter}
              onChange={handleChange}
              displayEmpty
              renderValue={selected => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selected.length === 0 ? (
                    <em>Registration Type</em>
                  ) : (
                    selected.map(value => (
                      <Chip
                        key={value}
                        label={categories.find(cat => cat.value === value)?.label}
                        size='small'
                        onDelete={event => handleDelete(value, event)} // Pass event to stop propagation
                      />
                    ))
                  )}
                </Box>
              )}
              sx={{ minWidth: 350, height: 45, fontSize: '0.875rem', maxWidth: '100%' }}
            >
              <MenuItem disabled value=''>
                <em>Category</em>
              </MenuItem>
              {categories.map(category => (
                <MenuItem key={category.value} value={category.value}>
                  <ListItemText primary={category.label} />
                </MenuItem>
              ))}
            </Select> */}
            <Select
              value={stateFilter || ''}
              onChange={e => {
                const selectedItem = stateDatas.find(item => item.label === e.target.value)
                const stateId = selectedItem?.id || null

                setStateFilter(e.target.value) // Update state filter
                setGetStateId(stateId) // Update selected state ID
              }}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{
                height: 45,
                fontSize: '0.875rem',
                padding: 0
              }}
            >
              <MenuItem value=''>State</MenuItem>
              {stateDatas.map(item => (
                <MenuItem key={item.id} value={item.label}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={districtFilter || ''}
              onChange={e => {
                const selectedItem = districtDatas.find(item => item.label === e.target.value)

                setDistrictFilter(e.target.value) // Update district filter
              }}
              displayEmpty
              className='border rounded-md px-3 py-2'
              sx={{
                height: 45,
                fontSize: '0.875rem',
                padding: 0
              }}
            >
              <MenuItem value=''>District</MenuItem>
              {districtDatas.map(item => (
                <MenuItem key={item.id} value={item.label}>
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
          { label: 'All', value: totalCount }
        ]}
        component="div"
        count={totalCount || 0}
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






      {/* Full-Screen Loader */}
      <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color='inherit' />
      </Backdrop>
    </Card>
  )
}

export default KitchenSink
