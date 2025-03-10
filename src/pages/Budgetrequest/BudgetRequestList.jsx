import React, { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useTranslation } from "react-i18next";
import {
  Button,
  Col,
  Row,
  UncontrolledTooltip,
  Input,
  Badge,
} from "reactstrap";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  useFetchBudgetRequests,
  useSearchBudgetRequests,
} from "../../queries/budget_request_query";
import { useFetchBudgetYears } from "../../queries/budgetyear_query";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";
import AttachFileModal from "../../components/Common/AttachFileModal"
import ConvInfoModal from "../../pages/Conversationinformation/ConvInfoModal"
import { PAGE_ID } from "../../constants/constantFile";
import BudgetRequestModal from "./BudgetRequestModal"
import ExportToExcel from "../../components/Common/ExportToExcel";
import ExportToPDF from "../../components/Common/ExportToPdf";
import PrintPage from "../../components/Common/PrintPage";
import { budget_request } from "../../settings/printablecolumns";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};
const statusClasses = new Map([
  ["Approved", "success"],
  ["Rejected", "danger"],
  ["Requested", "secondary"],
]);
const BudgetRequestListModel = () => {
  document.title = " Budget Request List | PMS";
  const { t } = useTranslation();
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);

  const [budgetRequestMetaData, setBudgetRequestMetaData] = useState({});
  const [showCanvas, setShowCanvas] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [fileModal, setFileModal] = useState(false)
  const [convModal, setConvModal] = useState(false)

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } = useState(null);
  const { data: budgetYearData } = useFetchBudgetYears();

  const [projectParams, setProjectParams] = useState({});
  const [prjLocationRegionId, setPrjLocationRegionId] = useState(null);
  const [prjLocationZoneId, setPrjLocationZoneId] = useState(null);
  const [prjLocationWoredaId, setPrjLocationWoredaId] = useState(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [include, setInclude] = useState(0);

  const [transaction, setTransaction] = useState({});

  const budgetYearMap = useMemo(() => {
    return (
      budgetYearData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [budgetYearData]);

  const budgetYearOptions = useMemo(() => {
    return (
      budgetYearData?.data?.map((year) => ({
        label: year.bdy_name,
        value: year.bdy_id,
      })) || []
    );
  }, [budgetYearData]);

  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };

  const handleClick = (data) => {
    setShowCanvas(!showCanvas);
    setBudgetRequestMetaData(data);
  };

  const toggleViewModal = () => setModal1(!modal1);
  const toggleFileModal = () => setFileModal(!fileModal);
  const toggleConvModal = () => setConvModal(!convModal);

  // When selection changes, update selectedRows
  const onSelectionChanged = () => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
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
      ...(include === 1 && { include }),
    });
  }, [prjLocationRegionId, prjLocationZoneId, prjLocationWoredaId, include]);
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
    if (showSearchResult) {
      setShowSearchResult(false);
    }
  };

  const columnDefs = useMemo(() => {
    const baseColumnDefs = [
      {
        headerName: t("S.N"),
        field: "sn",
        valueGetter: (params) => params.node.rowIndex + 1,
        sortable: false,
        filter: false,
        flex: .5,
      },
      {
        headerName: t("bdr_budget_year_id"),
        field: "bdy_name",
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: (params) => {
          return truncateText(params.data.bdy_name, 30) || "-";
        },
      },
      {
        headerName: t("prj_name"),
        field: "prj_name",
        sortable: true,
        filter: true,
        flex: 2,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_name, 30) || "-";
        },
      },
      {
        headerName: t("prj_code"),
        field: "prj_code",
        sortable: true,
        filter: true,
        flex: 1.5,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_code, 30) || "-";
        },
      },
      {
        headerName: t("bdr_requested_date_gc"),
        field: "bdr_requested_date_gc",
        sortable: true,
        flex: 1,
        filter: "agDateColumnFilter",
        cellRenderer: (params) => {
          return truncateText(params.data.bdr_requested_date_gc, 30) || "-";
        },
      },
      {
        headerName: t("psc_sector_id"),
        field: "sector_name",
        sortable: true,
        flex: 1,
        filter: "agDateColumnFilter",
        cellRenderer: (params) => {
          return truncateText(params.data.sector_name, 30) || "-";
        },
      },
      {
        headerName: t("bdr_request_status"),
        field: "bdr_request_status",
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: (params) => {
          const badgeClass = params.data.color_code;
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {params.data.status_name}
            </Badge>
          );
        },
      },
      {
        headerName: t("view_detail"),
        field: "view_detail",
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Button

              type="button"
              color="primary"
              className="btn-sm"
              onClick={() => {
                toggleViewModal();
                console.log(params.data)
                setTransaction(params.data);
              }}
            >
              {t("view_detail")}
            </Button>
          );
        },
      },
      {
        headerName: t("attach_files"),
        field: "attach_files",
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Button
              outline
              type="button"
              color="success"
              className="btn-sm"
              onClick={() => {
                toggleFileModal();
                setTransaction(params.data);
              }}
            >
              {t("attach_files")}
            </Button>
          );
        },
      },
      {
        headerName: t("Message"),
        field: "Message",
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Button
              outline
              type="button"
              color="primary"
              className="btn-sm"
              onClick={() => {
                toggleConvModal();
                setTransaction(params.data);
              }}
            >
              {t("Message")}
            </Button>
          );
        },
      },
    ];
    return baseColumnDefs;
  }, []);
  console.log("error", error)
  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <BudgetRequestModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <AttachFileModal
        isOpen={fileModal}
        toggle={toggleFileModal}
        projectId={transaction?.bdr_project_id}
        ownerTypeId={PAGE_ID.PROJ_BUDGET_REQUEST}
        ownerId={transaction?.bdr_id}
      />
      <ConvInfoModal
        isOpen={convModal}
        toggle={toggleConvModal}
        ownerTypeId={PAGE_ID.PROJ_BUDGET_REQUEST}
        ownerId={transaction?.bdr_id ?? null}
      />
      <div className="page-content">
        <div className="">
          <Breadcrumbs
            title={t("budget_request")}
            breadcrumbItem={t("budget_request")}
          />
          <div className="w-100 d-flex gap-2">
            <TreeForLists
              onNodeSelect={handleNodeSelect}
              setIsAddressLoading={setIsAddressLoading}
              setInclude={setInclude}
            />
            <div className="w-100">
              <AdvancedSearch
                searchHook={useSearchBudgetRequests}
                dateSearchKeys={["budget_request_date"]}
                textSearchKeys={["prj_name", "prj_code"]}
                dropdownSearchKeys={[
                  {
                    key: "bdr_budget_year_id",
                    options: budgetYearOptions,
                  },
                ]}
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
                <>
                  <div
                    className="ag-theme-alpine"
                    style={{ height: "100%", width: "100%" }}
                  >
                    {/* Row for search input and buttons */}
                    <Row className="mb-3">
                      <Col sm="12" md="6">
                        <Input
                          type="text"
                          placeholder="Search..."
                          onChange={(e) => setQuickFilterText(e.target.value)}
                          className="mb-2"
                        />
                      </Col>
                      <Col
                        sm="12"
                        md="6"
                        className="text-md-end d-flex align-items-center justify-content-end gap-2"
                      ><ExportToExcel
                          tableData={showSearchResult
                            ? searchResults?.data
                            : data?.data || []}
                          tablename={"projects"}
                          excludeKey={["is_editable", "is_deletable"]}
                        />
                        <ExportToPDF
                          tableData={showSearchResult
                            ? searchResults?.data
                            : data?.data || []}
                          tablename={"projects"}
                          includeKey={budget_request}
                        />
                        <PrintPage
                          tableData={showSearchResult
                            ? searchResults?.data
                            : data?.data || []}
                          tablename={t("Projects")}
                          excludeKey={["is_editable", "is_deletable"]}
                          gridRef={gridRef}
                          columnDefs={columnDefs}
                          columnsToIgnore="3"
                        />
                      </Col>
                    </Row>
                    {/* AG Grid */}
                    <div style={{}}>
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
                        paginationPageSize={20}
                        quickFilterText={quickFilterText}
                        onSelectionChanged={onSelectionChanged}
                        rowHeight={30}
                        animateRows={true}
                        domLayout="autoHeight"
                      // onGridReady={(params) => {
                      //   params.api.sizeColumnsToFit();
                      // }}
                      />
                    </div>
                    {/*<BudgetRequestAnalysis
                      data={
                        showSearchResult
                          ? searchResults?.data
                          : data?.data || []
                      }
                    />*/}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
BudgetRequestListModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default BudgetRequestListModel;
