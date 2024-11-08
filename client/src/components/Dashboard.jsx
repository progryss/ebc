import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import RowDetails from "./rowDetails";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer} from 'react-toastify';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import AddRow from "./addRow";

export default function Dashboard() {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);
  const [columnWidths, setColumnWidths] = useState({});
  const [rowPopop, setRowPopop] = useState(null);
  const [trigerUseeffectByDelete, setTrigerUseeffectByDelete] = useState(false);
  const tableHeaderRef = useRef(null);
  const [file, setFile] = useState(null);
  const [refreshData, setRefreshData] = useState(false);

  const [modelOpen, setModelOpen] = React.useState(false);
  const handleCloseModel = () => setModelOpen(false);
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const gettingOptions = JSON.parse(localStorage.getItem('filterOptions'))
  const navigate = useNavigate();
  const opt = {
    relationship: "null",
    filterMonth: "null",
    dateFrom: "",
    dateTo: ""
  }
  const [filterOptions, setFilterOptions] = useState(gettingOptions || opt);

  const searchItems = (searchValue) => {
    if (searchValue !== '') {
      const filteredData = data.filter((item) => {
        return (
          item?.make?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.model?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          // item?.year?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.engineType?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.sku?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.bhp?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.caliper?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.discDiameter?.toLowerCase()?.includes(searchValue?.toLowerCase()) ||
          item?.carEnd?.toLowerCase()?.includes(searchValue?.toLowerCase())
        );
      });
      setFilteredResults(filteredData);
    } else {
      setFilteredResults(data);
    }
    setCurrentPage(1);
  };

  const serverUrl = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    function hit() {
      fetch(`${serverUrl}/api/csv-data`, {
        method: 'GET',
        headers: {
          "Content-Type": 'application/json'
        },
        credentials: 'include'
      })
        .then(response => response?.json())
        .then(data => {
          if (data.length > 0) {
            const keys = Object.keys(data[0])?.filter(key => key !== '_id' && key !== '__v');
            const initialColumns = [
              { id: 'serialNumber', title: 'Sr No.' },
              { id: 'selectAll', title: 'Select All' },
              { id: 'make', title: 'Make' },
              { id: 'model', title: 'Model' },
              { id: 'year', title: 'Year' },
              { id: 'engineType', title: 'Engine Type' },
              { id: 'sku', title: 'Sku' },
              { id: 'bhp', title: 'Bhp' },
              { id: 'caliper', title: 'Caliper' },
              { id: 'discDiameter', title: 'Disc Diameter' },
              { id: 'included', title: 'Included' },
              { id: 'carEnd', title: 'Car End' }
            ];
            const savedColumns = JSON.parse(localStorage.getItem('columns'));
            if (savedColumns) {
              setColumns(savedColumns);
            } else {
              setColumns(initialColumns);
            }
            const rowData = data.map((item, index) => ({ ...item, originalIndex: index }));
            const enrichedData = [...rowData]?.reverse();
            setApiKeys(keys);
            setData(enrichedData);
            setFilteredResults(enrichedData);
          } else {
            const rowData = data.map((item, index) => ({ ...item, originalIndex: index }));
            const enrichedData = [...rowData]?.reverse();
            setData(enrichedData);
            setFilteredResults(enrichedData);
            setSelectAll(!selectAll);
          }
        })
        .catch((err) => {
          console.log(err, "Error in Getting Members");
          navigate('/login');

        })
      const savedWidths = JSON.parse(localStorage.getItem('columnWidths'));
      if (savedWidths) {
        setColumnWidths(savedWidths);
      }
    }
    hit()
  }, [rowPopop, trigerUseeffectByDelete, refreshData]);

  useEffect(() => {
    const filteredData = data.filter((item) => {
      const dueDate = new Date(item.dueDate * 1000);
      const fromCondition = filterOptions?.dateFrom ? dueDate >= new Date(filterOptions?.dateFrom) : true;
      const toDateCondition = filterOptions?.dateTo ? dueDate <= new Date(filterOptions?.dateTo) : true;
      const relationshipCondition = filterOptions?.relationship !== "null" ? item.relationship === filterOptions?.relationship : true;
      const monthYearCondition = filterOptions?.filterMonth !== "null" ? compareMonthYear(item.dueDate, filterOptions?.filterMonth) : true;

      return fromCondition && relationshipCondition && toDateCondition && monthYearCondition === true;
    });
    setFilteredResults(filteredData)
    localStorage.setItem('filterOptions', JSON.stringify(filterOptions))
  }, [filterOptions, data])

  useEffect(() => {

  }, [filteredResults])

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updatedColumns = Array.from(columns);
    const [reorderedColumn] = updatedColumns?.splice(result.source.index, 1);
    if (result?.source?.index !== 0 && result?.source?.index !== 1) {
      updatedColumns.splice(result?.destination?.index, 0, reorderedColumn);
    }
    setColumns(updatedColumns);
    localStorage.setItem('columns', JSON.stringify(updatedColumns));
  };

  const handleToggleColumn = (key) => {
    const columnExists = columns?.find(column => column.id === key);
    let updatedColumns;
    if (columnExists) {
      updatedColumns = columns?.filter(column => column.id !== key);
    } else {
      const newColumn = { id: key, title: key.charAt(0).toUpperCase() + key.slice(1) };
      updatedColumns = [...columns, newColumn];
    }
    setColumns(updatedColumns);
    localStorage.setItem('columns', JSON.stringify(updatedColumns));
  };

  const isDate = (value) => {
    return !isNaN(Date.parse(value));
  };

  const handleSort = (columnId) => {
    let direction = 'ascending';
    if (sortConfig.key === columnId && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: columnId, direction });

    const sortedData = [...data].sort((a, b) => {
      let aValue = a[columnId];
      let bValue = b[columnId];

      // Check if the values are dates
      if (isDate(aValue) && isDate(bValue)) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setData(sortedData);
    setFilteredResults(sortedData); // Update filteredResults with sorted data
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredResults?.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    window.scrollTo({
      top: tableHeaderRef.current.offsetTop,
      behavior: 'smooth',
    });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    window.scrollTo({
      top: tableHeaderRef.current.offsetTop,
      behavior: 'smooth',
    });
  };

  const getPageNumbers = () => {
    const totalPageNumbersToShow = 3; // Number of page numbers to display
    const totalPageNumbers = totalPages;
    const current = currentPage;

    const pageNumbers = [];

    // Always show the first page
    pageNumbers.push(1);

    if (current > 3) {
      pageNumbers.push('...');
    }

    // Calculate start and end page numbers
    const startPage = Math.max(2, current - 1);
    const endPage = Math.min(totalPages - 1, current + 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (current < totalPages - 2) {
      pageNumbers.push('...');
    }

    // Always show the last page if there are more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const handleResize = (columnId, width) => {
    const updatedWidths = {
      ...columnWidths,
      [columnId]: width
    };
    setColumnWidths(updatedWidths);
    localStorage.setItem('columnWidths', JSON.stringify(updatedWidths));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSelectedRows(newSelectAll ? data.map((row) => row._id) : []);
  };

  const handleSelectRow = (id) => {
    const newSelectedRows = selectedRows.includes(id)
      ? selectedRows.filter(rowId => rowId !== id)
      : [...selectedRows, id];
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.length === data.length);
  };

  function compareMonthYear(itemDate, monthYearStr) {
    const date = new Date(itemDate * 1000);
    const [month, year] = monthYearStr.split('_');
    const monthIndex = new Date(`${month} 1, 2022`).getMonth();
    return date.getFullYear() === parseInt(year) && date.getMonth() === monthIndex;
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };


  const deleteRowFromTable = async () => {
    // console.log(selectedRows);
    let userResponseText = selectedRows.length === 0 ? "No data Selected" : `Are you sure you want to delete ${selectedRows.length} Enquiries?`;
    const userResponse = window.confirm(userResponseText);
    if (userResponse) {
      try {
        const response = await axios.delete(`${serverUrl}/api/delete-rows`, {
          headers: {
            'Content-Type': 'application/json'
          },
          data: { ids: selectedRows }
        });
        setTrigerUseeffectByDelete(!trigerUseeffectByDelete)
      } catch (error) {
        console.error('Error:', error);
      }
    }
    setSelectedRows([])
  }

  const syncProduct = async () => {
    try {
      let response = await axios.post(`${serverUrl}/api/sync-products`, {
        "Content-Type": "application/json"
      });
      alert('All Shopify products sync');
      console.log(response)

    } catch (error) {
      console.error('Error saving products:', error);
      alert('Failed to save products.');
    }
  }

  const deleteProduct = async () => {
    try {
      await fetch(`${serverUrl}/api/delete-products`, {
        method: 'POST'
      });
      alert('All Shopify products Deleted');

    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete products.'); // Display error message
    }
  }

  const fileInputRef = React.useRef();

  const handleUploadCsv = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch(`${serverUrl}/api/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.text();
        alert(result);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear file input field
        }
        setTrigerUseeffectByDelete(!trigerUseeffectByDelete)
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to upload file: ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const deleteCsvData = async () => {
    try {
      await fetch(`${serverUrl}/api/delete-csv`, {
        method: 'POST'
      });
      alert('CSV data deleted successfully');
      refreshIt()
    } catch (error) {
      console.error('Error in deleting Csv data', error);
      alert('Failed to delete Csv data.');
    }
  }

  const refreshIt = () => {
    setRefreshData(!refreshData)
  }

  return (
    <>
     <ToastContainer position="top-right" hideProgressBar={true} />


      <div className="container-fluid customer-container">
        <div className="card card-block border-0 customer-table-css-main">
          <div className="card-body p-0">
            <div className="py-3 bg-light add-cutomer-section">
              <div className="row">
                <div className="col-lg-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="no-of-item">{filteredResults.length} Items</span>
                    </div>
                    <div className="searchParentWrapper">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control bg-custom border-end-0 search-input"
                          placeholder="Search"
                          onChange={(e) => searchItems(e.target.value)}
                        />
                        <div className="input-group-append">
                          <button
                            className="btn border border-start-0 search-icon-custom"
                            type="button"
                            style={{ height: '100%' }}
                          >
                            <i className="fa fa-search"></i>
                          </button>
                        </div>
                      </div>
                      <div className="d-flex">
                        <div>
                          <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="importCompany" />
                          <button
                            className="btn btn-primary"
                            onClick={handleUploadCsv}
                          >
                            <i className="fas fa-file-export me-1"></i> Import CSV
                          </button>
                        </div>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={deleteCsvData}
                        >
                          <i className="fa fa-trash me-1"></i> Delete CSV
                        </button>

                        <button
                          className="btn btn-primary ms-2"
                          onClick={deleteRowFromTable}
                        >
                          <i className="fa fa-trash me-1"></i> Delete Row
                        </button>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={syncProduct}
                        >
                          <i className="fas fa-sync me-1"></i> Sync Product
                        </button>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={deleteProduct}
                        >
                          <i className="fa fa-trash me-1"></i> Delete Product
                        </button>
                        <div className="dropdown ms-2">
                          <button
                            className="btn btn-primary ml-3 dropdown-toggle text-nowrap"
                            type="button"
                            id="dropdownMenuButton"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ height: '100%' }}
                          >
                            <i className="fas fa-plus me-2"></i> Add Column
                          </button>
                          <ul className="dropdown-menu addCol" aria-labelledby="dropdownMenuButton">
                            {apiKeys.map((key) => (
                              !["companyId", "locationId", "companyRoleId", "companyContactId"].includes(key) && ( // Only render if key is not "firstName"
                                <li key={key}>
                                  <label className="dropdown-item">
                                    <input
                                      type="checkbox"
                                      onChange={() => handleToggleColumn(key)}
                                      checked={columns.some(column => column.id === key)}
                                    /> {key}
                                  </label>
                                </li>
                              )
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Button variant="contained" onClick={handleOpen} className="mb-3">Add Row</Button>
              <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <div>
                  <AddRow refresh={refreshIt} close={handleClose} />
                </div>
              </Modal>
            </div>

            <div className="table-responsive customerTable">
              <DragDropContext onDragEnd={onDragEnd}>
                <table className="table text-start customer-table-css">
                  <thead ref={tableHeaderRef}>
                    <Droppable droppableId="columns" direction="horizontal">
                      {(provided) => (
                        <tr ref={provided.innerRef} {...provided.droppableProps}>
                          {columns.map((column, index) => (
                            <Draggable
                              key={`row-${index}`}
                              draggableId={column.id}
                              index={index}
                              isDragDisabled={index === 0 || index === 1}
                            >
                              {(provided) => (
                                <th
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="text-center"
                                >
                                  <ResizableBox
                                    width={columnWidths[column.id] || 100}
                                    height={23}
                                    axis="x"
                                    minConstraints={[10, 30]}
                                    maxConstraints={[2000, 23]}
                                    resizeHandles={["e"]}
                                    className="resize-handle"
                                    onResizeStop={(e, data) => handleResize(column.id, data.size.width)}
                                  >
                                    <div {...(index !== 0 && index !== 1 ? provided.dragHandleProps : {})}>
                                      {column.id === 'selectAll' ? (
                                        <>
                                          <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                          />
                                        </>
                                      ) : (
                                        <div className="d-flex align-items-center gap-2 justify-content-between">
                                          <span className="truncate-text" title={column.title}>{column.title}</span>
                                          {column.id !== 'serialNumber' && (
                                            <div className="ml-2 sortable-header" onClick={() => handleSort(column.id)}>
                                              <i className={`fas ${sortConfig.key === column.id && sortConfig.direction === 'ascending' ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </ResizableBox>
                                </th>
                              )}
                            </Draggable>
                          ))}
                          {provided?.placeholder}
                        </tr>
                      )}
                    </Droppable>
                  </thead>
                  <tbody>
                    {currentRows.length > 0 ? (
                      currentRows.map((row, rowIndex) => (
                        <tr
                          key={`row-${rowIndex}`}
                          onClick={(e) => {
                            const target = e.target;
                            const isCheckbox = target.tagName.toLowerCase() === 'input' && target.type === 'checkbox';
                            if (!isCheckbox) {
                              setRowPopop(row);
                              setModelOpen(true)
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {columns.map((column,index) => {
                            if (column.id === 'serialNumber') {
                              return (
                                <td key={`row-${index}`}>{indexOfFirstRow + rowIndex + 1}</td>
                              );
                            } else if (column.id === 'selectAll') {
                              return (
                                <td key={`row-${index}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.includes(row._id)}
                                    onChange={() => handleSelectRow(row._id)}
                                  />
                                </td>
                              );
                            } else if (column.id === 'year') {
                              return (
                                <td key={`row-${index}`}>
                                  <span>{row[column.id][0] + "-" + row[column.id][row[column.id].length - 1]}</span>
                                </td>
                              );
                            } else {
                              return (
                                <td key={`row-${index}`} >
                                  <span className={column.id}> {column.id === 'included' ? row[column.id].join(', ') : row[column.id]} </span>
                                </td>
                              );
                            }
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="text-center">
                          No results found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </DragDropContext>
            </div>

            {/* pagination */}
            {filteredResults.length > 0 && (
              <nav className="mt-3">
                <ul className="customer-pagination pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={handlePrevPage}>
                      <i className="fa fa-chevron-left"></i>
                    </button>
                  </li>

                  {/* Generate page numbers */}
                  {getPageNumbers().map((pageNumber, index) => (
                    <li
                      key={index}
                      className={`page-item ${pageNumber === currentPage ? 'active' : ''
                        } ${pageNumber === '...' ? 'disabled' : ''}`}
                    >
                      {pageNumber === '...' ? (
                        <span className="page-link">...</span>
                      ) : (
                        <button
                          className="page-link"
                          onClick={() => {
                            setCurrentPage(pageNumber);
                            window.scrollTo({
                              top: tableHeaderRef.current.offsetTop,
                              behavior: 'smooth',
                            });
                          }}
                        >
                          {pageNumber}
                        </button>
                      )}
                    </li>
                  ))}

                  <li
                    className={`page-item ${currentPage === totalPages ? 'disabled' : ''
                      }`}
                  >
                    <button className="page-link" onClick={handleNextPage}>
                      <i className="fa fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}


          </div>
        </div>
      </div>
      <Modal
        open={modelOpen}
        onClose={handleCloseModel}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div>
          <RowDetails data={rowPopop} refresh={refreshIt} closeModel={handleCloseModel} />
        </div>
      </Modal>
    </>
  )
}
