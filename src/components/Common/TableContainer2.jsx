import React, { Fragment, useEffect, useState, useRef } from "react";
import { Row, Table, Button, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FOOTER_TEXT, COPYRIGHT_YEAR } from "../../constants/constantFile";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { UncontrolledTooltip } from "reactstrap";
import { rankItem } from "@tanstack/match-sorter-utils";
import ExportToExcel from "../../components/Common/ExportToExcel";
import PrintHtmlPage from "../../components/Common/PrintHtmlPage";
import { FaInfoCircle } from "react-icons/fa";
import ExportToPDF from "./ExportToPdf";

// Column Filter
const Filter = ({ column }) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <>
      <DebouncedInput
        type="text"
        value={columnFilterValue ?? ""}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Search..."
        className="w-36 border shadow rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  );
};

// Global Filter
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, onChange, value]);

  return (
    <React.Fragment>
      <Col sm={4}>
        <input
          {...props}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Col>
    </React.Fragment>
  );
};

const MAX_PAGE_NUMBERS = 10;

const TableContainer2 = ({
  columns,
  data,
  tableClass,
  theadClass,
  divClassName,
  isBordered,
  isPagination,
  isGlobalFilter,
  paginationWrapper,
  SearchPlaceholder,
  pagination,
  buttonClass,
  buttonName,
  isAddButton,
  isCustomPageSize,
  handleUserClick,
  isJobListGlobalFilter,
  isExcelExport = false,
  isPdfExport = false,
  isPrint = true,
  excludeKey = [],
  tableName = "",
  infoIcon = false,
}) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { t } = useTranslation();
  const pageIndexRef = useRef(0); // Store the page index
  const [pageSize, setPageSize] = useState(10);
  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const table = useReactTable({
    columns,
    data,
    filterFns: { fuzzy: fuzzyFilter },
    state: {
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: pageIndexRef.current,
        pageSize,
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    setPageIndex,
    nextPage,
    previousPage,
    getState,
  } = table;

  useEffect(() => {
    setPageIndex(pageIndexRef.current); // Apply the saved page index
  }, [data]); // Reapply the page index after data update

  const rowsToFill = 7 - getRowModel().rows.length;

  const paginationState = getState().pagination;
  const totalPages = getPageOptions().length;
  const currentPage = paginationState.pageIndex;

  // Calculate the start and end of the current range
  const startPage =
    Math.floor(currentPage / MAX_PAGE_NUMBERS) * MAX_PAGE_NUMBERS;
  const endPage = Math.min(startPage + MAX_PAGE_NUMBERS, totalPages);

  // Create the page numbers to display
  const visiblePageNumbers = getPageOptions().slice(startPage, endPage);

  const handlePrevious = () => {
    if (getCanPreviousPage()) {
      pageIndexRef.current = currentPage - 1; // Decrement the page index
      previousPage(); // Call the function to go to the previous page
    }
  };

  const handleNext = () => {
    if (getCanNextPage()) {
      pageIndexRef.current = currentPage + 1; // Increment the page index
      nextPage(); // Call the function to go to the next page
    }
  };

  return (
    <Fragment>
      <Row className="mb-2 d-flex align-items-center justify-content-between">
        <>
          {isCustomPageSize && (
            <Col sm={2} className="">
              <select
                className="form-select pageSize my-auto"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {t("Showing")} {pageSize}
                  </option>
                ))}
              </select>
            </Col>
          )}
          {isGlobalFilter && (
            <DebouncedInput
              value={globalFilter ?? ""}
              onChange={(value) => setGlobalFilter(String(value))}
              className="form-control search-box me-2 my-auto d-inline-block"
              placeholder={SearchPlaceholder}
            />
          )}
        </>

        <Col sm={6}>
          <div className="text-sm-end d-flex align-items-center justify-content-end gap-1">
            {isAddButton && (
              <Button
                type="button"
                className="btn-soft-success m-2"
                onClick={handleUserClick}
              >
                <i className="mdi mdi-plus me-1"></i> {buttonName}
              </Button>
            )}
            {isExcelExport && (
              <ExportToExcel
                tableData={data}
                tablename={tableName}
                excludeKey={excludeKey}
              />
            )}

            {isPdfExport && (
              <ExportToPDF
                tableData={data}
                tablename={tableName}
                excludeKey={excludeKey}
              />
            )}
            {isPrint && (
              <PrintHtmlPage
                tableData={data}
                tablename={tableName}
                excludeKey={excludeKey}
              />
            )}
            {infoIcon &&
              <div>
                <FaInfoCircle size={20} id="info" />
                <UncontrolledTooltip placement="top" target="info">
                  Sample Info
                </UncontrolledTooltip>
              </div>}
          </div>
        </Col>
      </Row>
      <div className={divClassName ? divClassName : "table-responsive"}>
        <div id='printable-table'>
          <Table
            hover
            className={`${tableClass}`}
            bordered={isBordered}
          >
            <thead className={theadClass}>
              {getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {/* <th>{t("S.N")}</th> */}
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`${header.column.columnDef.enableSorting
                        ? "sorting sorting_desc"
                        : ""
                        }`}
                    >
                      {header.isPlaceholder ? null : (
                        <Fragment>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(t(header.id), header.getContext())}
                            {{
                              asc: "",
                              desc: "",
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                          {header.column.getCanFilter() ? (
                            <div>
                              <Filter column={header.column} table={table} />
                            </div>
                          ) : null}
                        </Fragment>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody style={{ height: "auto" }}>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="text-center py-5">
                    No data available
                  </td>
                </tr>
              ) : (
                getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {/* <td>{Number(row.id) + 1}</td> */}
                    {
                      row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))
                    }
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
        {isPagination && (
          <Row>
            <Col sm={12} md={5}>
              <div className="dataTables_info">
                {paginationState.pageSize > data.length
                  ? `${t("Showing")} ${data.length} of ${data.length}`
                  : `${t("Showing")} ${paginationState.pageSize} of ${data.length
                  }`}
              </div>
            </Col>
            <Col sm={12} md={7}>
              <div className={paginationWrapper}>
                <ul className={pagination}>
                  {/* Previous Button */}
                  <li
                    className={`paginate_button page-item previous ${!getCanPreviousPage() ? "disabled" : ""
                      }`}
                  >
                    <Link to="#" className="page-link" onClick={handlePrevious}>
                      <i className="mdi mdi-chevron-left"></i>
                    </Link>
                  </li>

                  {/* Render visible page numbers */}
                  {visiblePageNumbers.map((item) => (
                    <li
                      key={item}
                      className={`paginate_button page-item ${currentPage === item ? "active" : ""
                        }`}
                    >
                      <Link
                        to="#"
                        className="page-link"
                        onClick={() => {
                          pageIndexRef.current = item;
                          setPageIndex(item);
                        }}
                      >
                        {item + 1}
                      </Link>
                    </li>
                  ))}

                  {/* Next Button */}
                  <li
                    className={`paginate_button page-item next ${!getCanNextPage() ? "disabled" : ""
                      }`}
                  >
                    <Link to="#" className="page-link" onClick={handleNext}>
                      <i className="mdi mdi-chevron-right"></i>
                    </Link>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        )}
      </div>
    </Fragment >
  );
};
export default TableContainer2;
