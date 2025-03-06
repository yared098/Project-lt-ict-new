import React, { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import ApproverBudgetRequestListModal from "./ApproverBudgetRequestModal";
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
import BudgetRequestAnalysis from "./BudgetRequestAnalysis";
import {
  useSearchBudgetRequestforApproval,
} from "../../queries/budget_request_query";
import { useFetchBudgetYears } from "../../queries/budgetyear_query";
import { useSearchRequestFollowups, useFetchRequestFollowups } from "../../queries/requestfollowup_query"
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";
import AttachFileModal from "../../components/Common/AttachFileModal"
import ConvInfoModal from "../../pages/Conversationinformation/ConvInfoModal"
import { PAGE_ID } from "../../constants/constantFile";
import BudgetRequestModal from "./BudgetRequestModal";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ApproverBudgetRequestList = () => {
  document.title = " Budget Request List | PMS";

  const { t } = useTranslation();
  const [modal1, setModal1] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);

  const [budgetRequestMetaData, setBudgetRequestMetaData] = useState({});
  const [detailModal, setDetailModal] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false);
  const [fileModal, setFileModal] = useState(false)
  const [convModal, setConvModal] = useState(false)

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [transaction, setTransaction] = useState({});

  const { data, isLoading, error, isError, refetch } = useState(null);
  const { data: budgetYearData } = useFetchBudgetYears();

  const [projectParams, setProjectParams] = useState({});
  const [prjLocationRegionId, setPrjLocationRegionId] = useState(null);
  const [prjLocationZoneId, setPrjLocationZoneId] = useState(null);
  const [prjLocationWoredaId, setPrjLocationWoredaId] = useState(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [include, setInclude] = useState(0);

  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const user = storedUser?.user;
  const depId = user?.usr_officer_id > 0
    ? user.usr_officer_id
    : user?.usr_team_id > 0
      ? user.usr_team_id
      : user?.usr_directorate_id > 0
        ? user.usr_directorate_id
        : user?.usr_department_id > 0
          ? user.usr_department_id
          : null;

  //const depId = 1
  const { data: rqfData, isLoading: rqfLoading } = useFetchRequestFollowups()

  function markForwardedRequests(budgetRequests, forwardedRequests, depId) {
    const forwardedSet = new Set(
      forwardedRequests
        .filter(req => req.rqf_forwarding_dep_id === depId)
        .map(req => req.rqf_request_id)
    );

    return budgetRequests.map(request => ({
      ...request,
      forwarded: forwardedSet.has(request.bdr_id),
    }));
  }

  const transformedData = useMemo(() => {
    if (!searchResults?.data || !rqfData?.data) return [];
    return markForwardedRequests(searchResults.data, rqfData.data, depId);
  }, [searchResults, rqfData, depId])

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

  const handleEyeClick = (data) => {
    setShowCanvas(!showCanvas);
    setBudgetRequestMetaData(data);
  };

  const toggleDetailModal = () => setDetailModal(!detailModal)
  const toggleViewModal = () => setModal1(!modal1);
  const toggleFileModal = () => setFileModal(!fileModal);
  const toggleConvModal = () => setConvModal(!convModal);


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
        width: 60,
        flex: .5
      },
      {
        headerName: t("Year"),
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
      // {
      //   headerName: t("bdr_requested_amount"),
      //   field: "bdr_requested_amount",
      //   sortable: true,
      //   filter: true,
      //   flex: 1.2,
      //   valueFormatter: (params) => {
      //     if (params.value != null) {
      //       return new Intl.NumberFormat("en-US", {
      //         minimumFractionDigits: 2,
      //         maximumFractionDigits: 2,
      //       }).format(params.value);
      //     }
      //     return "0.00"; // Default value if null or undefined
      //   },
      // },
      // {
      //   headerName: t("bdr_released_amount"),
      //   field: "bdr_released_amount",
      //   sortable: true,
      //   filter: true,
      //   flex: 1.2,
      //   valueFormatter: (params) => {
      //     if (params.value != null) {
      //       return new Intl.NumberFormat("en-US", {
      //         minimumFractionDigits: 2,
      //         maximumFractionDigits: 2,
      //       }).format(params.value);
      //     }
      //     return "0.00"; // Default value if null or undefined
      //   },
      // },
      {
        headerName: t("bdr_requested_date_gc"),
        field: "bdr_requested_date_gc",
        sortable: true,
        filter: "agDateColumnFilter",
        flex: 1,
        cellRenderer: (params) => {
          return truncateText(params.data.bdr_requested_date_gc, 30) || "-";
        },
      },
      // {
      //   headerName: t("bdr_released_date_gc"),
      //   field: "bdr_released_date_gc",
      //   sortable: true,
      //   filter: "agDateColumnFilter",
      //   flex: 1,
      //   cellRenderer: (params) => {
      //     return truncateText(params.data.bdr_released_date_gc, 30) || "-";
      //   },
      // },
      {
        headerName: t("forwarded"),
        field: "forwarded",
        sortable: true,
        filter: true,
        flex: 1,
        cellRenderer: (params) => {
          const isForwarded = params.data.forwarded;
          return (
            <Badge className={`font-size-12 badge-soft-${isForwarded ? "danger" : "secondary"}`}>
              {isForwarded ? "forwarded" : "not forwarded"}
            </Badge>
          );
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
      // {
      //   headerName: t("view_detail"),
      //   field: "view_detail",
      //   flex: 1,
      //   cellRenderer: (params) => {
      //     return (
      //       <Button
      //         type="button"
      //         color="primary"
      //         className="btn-sm"
      //         onClick={() => {
      //           toggleDetailModal();
      //           setTransaction(params.data);
      //         }}
      //       >
      //         {t("view_detail")}
      //       </Button>
      //     );
      //   },
      // },
      {
        headerName: t("take_action"),
        field: "take_action",
        flex: 1,
        cellRenderer: (params) => {
          return (
            <Button
              type="button"
              color="primary"
              className="btn-sm"
              onClick={() => {
                const data = params.data;
                toggleViewModal();
                setTransaction(data);
              }}
            >
              {t("take_action")}
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

    if (
      data?.previledge?.is_role_editable &&
      data?.previledge?.is_role_deletable
    ) {
      baseColumnDefs.push({
        headerName: t("view_detail"),
        field: "view_detail",
        flex: 1,
        cellRenderer: (params) => (
          <div className="d-flex gap-3">
            {params.data.is_editable ? (
              <Link
                to="#"
                className="text-secondary"
                onClick={() => handleEyeClick(params.data)}
              >
                <i className="mdi mdi-eye font-size-18 ms-2" id="viewtooltip" />
                <UncontrolledTooltip placement="top" target="viewtooltip">
                  View
                </UncontrolledTooltip>
              </Link>
            ) : (
              ""
            )}
          </div>
        ),
      });
    }

    return baseColumnDefs;
  }, []);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <BudgetRequestModal
        isOpen={detailModal}
        toggle={toggleDetailModal}
        transaction={transaction}
      />
      <ApproverBudgetRequestListModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
        budgetYearMap={budgetYearMap}
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
                searchHook={useSearchBudgetRequestforApproval}
                // dateSearchKeys={["budget_request_date"]}
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
                    </Row>
                    {/* AG Grid */}
                    <div style={{ height: "600px", zoom: "90%" }}>
                      <AgGridReact
                        ref={gridRef}
                        rowData={
                          showSearchResult
                            ? transformedData
                            : data?.data || []
                        }
                        columnDefs={columnDefs}
                        pagination={true}
                        paginationPageSizeSelector={[10, 20, 30, 40, 50]}
                        paginationPageSize={10}
                        quickFilterText={quickFilterText}
                        onSelectionChanged={onSelectionChanged}
                        rowHeight={30}
                        animateRows={true}
                        domLayout="autoHeight" // Auto-size the grid to fit content
                      />
                    </div>
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
ApproverBudgetRequestList.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default ApproverBudgetRequestList;
