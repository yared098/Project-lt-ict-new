import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
//import components
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";

import CascadingDropdowns from "../../components/Common/CascadingDropdowns2";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";

import {
  useFetchProposalRequests,
  useSearchProposalRequests,
  useAddProposalRequest,
  useDeleteProposalRequest,
  useUpdateProposalRequest,
} from "../../queries/proposalrequest_query";
import ProposalRequestModal from "./ProposalRequestModal";
import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import {
  Button,
  Col,
  Row,
  UncontrolledTooltip,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Input,
  FormFeedback,
  Label,
  Card,
  CardBody,
  FormGroup,
  Badge,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";
import { useFetchRequestStatuss } from "../../queries/requeststatus_query";
import { useFetchRequestCategorys } from "../../queries/requestcategory_query";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProposalRequestList = () => {
  //meta title
  document.title = " ProposalRequest";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [proposalRequest, setProposalRequest] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [projectParams, setProjectParams] = useState({});
  const [prjLocationRegionId, setPrjLocationRegionId] = useState(null);
  const [prjLocationZoneId, setPrjLocationZoneId] = useState(null);
  const [prjLocationWoredaId, setPrjLocationWoredaId] = useState(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const { data, isLoading, error, isError, refetch } = useState("");
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);

  // When selection changes, update selectedRows
  const onSelectionChanged = () => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
  };
  // Filter by marked rows
  const filterMarked = () => {
    if (gridRef.current) {
      gridRef.current.api.setRowData(selectedRows);
    }
  };
  // Clear the filter and show all rows again
  const clearFilter = () => {
    gridRef.current.api.setRowData(showSearchResults ? results : data);
  };
  //START FOREIGN CALLS

  const { data: statusData } = useFetchRequestStatuss();

  const statusMap = useMemo(() => {
    return (
      statusData?.data?.reduce((acc, year) => {
        acc[year.rqs_id] = year.rqs_name_or;
        return acc;
      }, {}) || {}
    );
  }, [statusData]);

  const { data: categoryData } = useFetchRequestCategorys();

  const categoryMap = useMemo(() => {
    return (
      categoryData?.data?.reduce((acc, year) => {
        acc[year.rqc_id] = year.rqc_name_or;
        return acc;
      }, {}) || {}
    );
  }, [categoryData]);

  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };
  useEffect(() => {
    setProjectParams({
      ...(prjLocationRegionId && {
        prj_location_region_id: prjLocationRegionId,
      }),
      ...(prjLocationZoneId && { prj_location_zone_id: prjLocationZoneId }),
      ...(prjLocationWoredaId && {
        prj_location_woreda_id: prjLocationWoredaId,
      }),
    });
  }, [prjLocationRegionId, prjLocationZoneId, prjLocationWoredaId]);
  const handleNodeSelect = (node) => {
    if (node.level === "region") {
      setPrjLocationRegionId(node.id);
      setPrjLocationZoneId(null); // Clear dependent states
      setPrjLocationWoredaId(null);
    } else if (node.level === "zone") {
      setPrjLocationZoneId(node.id);
      setPrjLocationWoredaId(null); // Clear dependent state
    } else if (node.level === "woreda") {
      setPrjLocationWoredaId(node.id);
    }
  };

  //START UNCHANGED
  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        headerName: "Title",
        field: "prr_title",
        sortable: true,
        filter: false,
        cellRenderer: (params) => truncateText(params.value, 30) || "-",
      },
      {
        headerName: "Project ID",
        field: "prr_project_id",
        sortable: true,
        filter: false,
        cellRenderer: (params) => truncateText(params.value, 30) || "-",
      },
      {
        headerName: "Request Status",
        field: "prr_request_status_id",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(statusMap[params.value] || "", 30) || "-";
        },
      },
      {
        headerName: "Request Category",
        field: "prr_request_category_id",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(categoryMap[params.value] || "", 30) || "-";
        },
      },
      // {
      //   headerName: "Request Date (ET)",
      //   field: "prr_request_date_et",
      //   sortable: true,
      //   filter: false,
      //   cellRenderer: (params) => truncateText(params.value, 30) || "-",
      // },
      {
        headerName: "Request Date (GC)",
        field: "prr_request_date_gc",
        sortable: true,
        filter: false,
        cellRenderer: (params) => truncateText(params.value, 30) || "-",
      },
      {
        headerName: "Description",
        field: "prr_description",
        sortable: true,
        filter: false,
        cellRenderer: (params) => truncateText(params.value, 30) || "-",
      },
      // {
      //   headerName: "Status",
      //   field: "prr_status",
      //   sortable: true,
      //   filter: false,
      //   cellRenderer: (params) => truncateText(params.value, 30) || "-",
      // },
    ];
    return baseColumns;
  });
  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <div className="page-content">
        <div>
          <Breadcrumbs
            title={t("project")}
            breadcrumbItem={t("Project Payment List")}
          />
          <div className="w-100 d-flex gap-2">
            <TreeForLists
              onNodeSelect={handleNodeSelect}
              setIsAddressLoading={setIsAddressLoading}
            />
            <div className="w-100">
              <AdvancedSearch
                searchHook={useSearchProposalRequests}
                textSearchKeys={["prj_name", "prj_code"]}
                dateSearchKeys={["payment_date"]}
                dropdownSearchKeys={[
                  {
                    key: "prp_type",
                    options: [
                      { value: "Advance", label: "Advance" },
                      { value: "Interim", label: "Interim" },
                      { value: "Final", label: "Final" },
                    ],
                  },
                ]}
                checkboxSearchKeys={[]}
                Component={CascadingDropdowns}
                component_params={{
                  dropdown1name: "prj_location_region_id",
                  dropdown2name: "prj_location_zone_id",
                  dropdown3name: "prj_location_woreda_id",
                }}
                additionalParams={projectParams}
                setAdditionalParams={setProjectParams}
                onSearchResult={handleSearchResults}
                setIsSearchLoading={setIsSearchLoading}
                setSearchResults={setSearchResults}
                setShowSearchResult={setShowSearchResult}
              />
              {isLoading || isSearchLoading ? (
                <Spinners />
              ) : (
                <div
                  className="ag-theme-alpine"
                  style={{ height: "100%", width: "100%" }}
                >
                  {/* Row for search input and buttons */}
                  <Row className="mb-3">
                    <Col sm="12" md="6">
                      {/* Search Input for  Filter */}
                      <Input
                        type="text"
                        placeholder="Search..."
                        onChange={(e) => setQuickFilterText(e.target.value)}
                        className="mb-2"
                        style={{ width: "50%", maxWidth: "400px" }}
                      />
                    </Col>
                    <Col sm="12" md="6" className="text-md-end"></Col>
                  </Row>

                  {/* AG Grid */}
                  <div>
                    <AgGridReact
                      ref={gridRef}
                      rowData={
                        showSearchResult
                          ? searchResults?.data
                          : data?.data || []
                      }
                      columnDefs={columnDefs}
                      pagination={true}
                      paginationPageSizeSelector={[10, 20, 30, 40, 50]}
                      paginationPageSize={10}
                      quickFilterText={quickFilterText}
                      onSelectionChanged={onSelectionChanged}
                      rowHeight={30} // Set the row height here
                      animateRows={true} // Enables row animations
                      domLayout="autoHeight" // Auto-size the grid to fit content
                      onGridReady={(params) => {
                        params.api.sizeColumnsToFit(); // Size columns to fit the grid width
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
export default ProposalRequestList;
