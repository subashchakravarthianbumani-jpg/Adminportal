'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import axios from 'axios'
import { Button } from '@mui/material'

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

// For Excel export
import * as XLSX from 'xlsx'

// For PDF export
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import { Backdrop, CircularProgress } from '@mui/material'


// Icon Imports
import ChevronRight from '@menu/svg/ChevronRight'

// Style Imports
import styles from '@core/styles/table.module.css'

// Utils
import { getLocalStorageItem } from '@/utils/storage'



// Column Definitions
const columnHelper = createColumnHelper()

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const formatIST = dateString => {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date
    .toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(',', '')
}

// Debounced Input Component
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return <TextField {...props} size='small' value={value} onChange={e => setValue(e.target.value)} />
}

const Filter = ({ column, table }) => {
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

const KitchenSink = () => {
  const [loading, setLoading] = useState(false)
  const [columnFilters, setColumnFilters] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [data, setData] = useState([])

  // Helper function to format JSON data
  const formatJsonData = jsonString => {
    if (!jsonString) return ''

    try {
      const parsed = JSON.parse(jsonString)

      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('ReferID', {
        cell: info => info.getValue(),
        header: 'ReferID'
      }),
      columnHelper.accessor('Description', {
        cell: info => info.getValue(),
        header: 'Description'
      }),
      columnHelper.accessor('Action', {
        cell: info => info.getValue(),
        header: 'Action'
      }),

      // columnHelper.accessor('OldData', {
      //   cell: info => {
      //     const value = info.getValue()

      //     return (
      //       <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
      //         {formatJsonData(value)}
      //       </pre>
      //     )
      //   },
      //   header: 'OldData'
      // }),
      // columnHelper.accessor('NewData', {
      //   cell: info => {
      //     const value = info.getValue()

      //     return (
      //       <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
      //         {formatJsonData(value)}
      //       </pre>
      //     )
      //   },
      //   header: 'NewData'
      // }),
      columnHelper.accessor('IPAddress', {
        cell: info => info.getValue(),
        header: 'IPAddress'
      }),

      // columnHelper.accessor('UserID', {
      //   cell: info => info.getValue(),
      //   header: 'UserID'
      // }),
      columnHelper.accessor('UserName', {
        cell: info => info.getValue(),
        header: 'UserName'
      }),
      columnHelper.accessor('LogTime', {
        cell: info => formatIST(info.getValue()),
        header: 'LogTime'
      })
    ],
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
  }, [table.getState().columnFilters[0]?.id])

  const userInfo = JSON.parse(getLocalStorageItem('userInfo') || '{}')
  const token = getLocalStorageItem('accessToken')

  const fetchRegistrations = () => {
    setLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/apps/loglist`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log(response.data.data)

        if (response.data.status) {
          setData(
            response.data.data.map(value => ({
              LogID: value.LogID,
              ReferID: value.ReferID,
              Description: value.Description,
              ModuleName: value.ModuleName,
              Action: value.Action,

              // OldData: value.OldData,
              // NewData: value.NewData,
              IPAddress: value.IPAddress,

              // UserID: value.UserID,
              UserName: value.UserName,
              LogTime: value.LogTime
            }))
          )
        } else {
          console.log('No data found.')
        }
      })
      .catch(err => {
        console.log('Error fetching data:', err)
      }).finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  // Export to Excel
  const exportToExcel = () => {
    // Get filtered data from the table
    const filteredData = table.getFilteredRowModel().rows.map(row => {
      const rowData = {}

      columns.forEach(col => {
        const accessor = col.accessorKey
        let value = row.original[accessor]

        if (accessor === 'LogTime') {
          value = formatIST(value)
        }

        // Format JSON fields for Excel
        // if (accessor === 'OldData' || accessor === 'NewData') {
        //   value = formatJsonData(value)
        // }

        rowData[accessor] = value
      })

      return rowData
    })

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(filteredData)

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // ReferID
      { wch: 30 }, // Description
      { wch: 15 }, // Action

      // { wch: 40 }, // OldData
      // { wch: 40 }, // NewData
      { wch: 15 }, // IPAddress

      // { wch: 10 }, // UserID
      { wch: 20 }, // UserName
      { wch: 20 } // LogTime
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, 'Logs')

    // Generate filename with timestamp
    const filename = `Logs_${new Date().toISOString().split('T')[0]}.xlsx`

    // Download file
    XLSX.writeFile(wb, filename)
  }

  // Export to PDF
  const exportToPdf = () => {
    const doc = new jsPDF('l', 'mm', 'a4') // landscape orientation

    // Get filtered data
    const filteredData = table.getFilteredRowModel().rows.map(row => [
      row.original.ReferID || '',
      row.original.Description || '',
      row.original.Action || '',

      // formatJsonData(row.original.OldData) || '',
      // formatJsonData(row.original.NewData) || '',
      row.original.IPAddress || '',

      // row.original.UserID || '',
      row.original.UserName || '',
      formatIST(row.original.LogTime) || ''
    ])

    // Add title
    doc.setFontSize(16)
    doc.text('Logs Report', 14, 15)

    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)

    // Add table
    doc.autoTable({
      // head: [['ReferID', 'Description', 'Action', 'OldData', 'NewData', 'IPAddress', 'UserID', 'UserName', 'LogTime']],
      head: [['ReferID', 'Description', 'Action', 'IPAddress', 'UserName', 'LogTime']],
      body: filteredData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 139, 202],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 }, // ReferID
        1: { cellWidth: 35 }, // Description
        2: { cellWidth: 20 }, // Action

        // 3: { cellWidth: 40 },  // OldData
        // 4: { cellWidth: 40 },  // NewData
        5: { cellWidth: 25 }, // IPAddress

        // 6: { cellWidth: 15 },  // UserID
        7: { cellWidth: 25 }, // UserName
        8: { cellWidth: 30 } // LogTime
      },
      margin: { top: 28 }
    })

    // Generate filename with timestamp
    const filename = `Logs_${new Date().toISOString().split('T')[0]}.pdf`

    // Download file
    doc.save(filename)
  }

  return (
    <Card>
      <CardHeader
        className='flex flex-wrap gap-y-2 items-center justify-between'
        title='Logs'
        action={
          <div className='flex items-center gap-x-4'>
            <div className='flex items-center justify-between'>
              <div className='flex gap-x-4'>
                <Button variant='contained' color='primary' onClick={exportToExcel}>
                  Excel
                </Button>
                <Button variant='contained' color='primary' onClick={exportToPdf}>
                  PDF
                </Button>
              </div>
            </div>

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
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronRight fontSize='1.25rem' className='-rotate-90' />,
                              desc: <ChevronRight fontSize='1.25rem' className='rotate-90' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                          {header.column.getCanFilter() && <Filter column={header.column} table={table} />}
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
        rowsPerPageOptions={[10, 25, 50, 100, 500, 1000, { label: 'All', value: data.length }]}
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
  )
}

export default KitchenSink
