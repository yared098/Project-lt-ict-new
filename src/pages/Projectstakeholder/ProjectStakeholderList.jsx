import React, { useEffect, useMemo, useState, useRef } from "react";
import Spinners from "../../components/Common/Spinner";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useSearchProjectStakeholders } from "../../queries/projectstakeholder_query";
import { useTranslation } from "react-i18next";
import { Col, Row, Input } from "reactstrap";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectStakeholderList = () => {
  //meta title
  document.title = " ProjectStakeholder";
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [projectParams, setProjectParams] = useState({});
  const [prjLocationRegionId, setPrjLocationRegionId] = useState(null);
  const [prjLocationZoneId, setPrjLocationZoneId] = useState(null);
  const [prjLocationWoredaId, setPrjLocationWoredaId] = useState(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [include, setInclude] = useState(0);
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
    gridRef.current.api.setRowData(showSearchResult ? results : data);
  };
  //START FOREIGN CALLS

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
  };

  //START UNCHANGED
  const columns = useMemo(() => {
    const baseColumns = [
      {
        headerName: t("S.N"),
        field: "sn",
        valueGetter: (params) => params.node.rowIndex + 1,
        sortable: false,
        filter: false,
        width: 60,
      },
      {
        headerName: t("prj_name"),
        field: "prj_name",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_name, 30) || "-";
        },
      },
      {
        headerName: t("prj_code"),
        field: "prj_code",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_code, 30) || "-";
        },
      },
      {
        headerName: t("psh_name"),
        field: "psh_name",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(params.data.psh_name, 30) || "-";
        },
      },
      {
        headerName: t("psh_stakeholder_type"),
        field: "psh_stakeholder_type",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(params.data.psh_stakeholder_type, 30) || "-";
        },
      },
      {
        headerName: t("psh_representative_name"),
        field: "psh_representative_name",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(params.data.psh_representative_name, 30) || "-";
        },
      },
      {
        headerName: t("psh_representative_phone"),
        field: "psh_representative_phone",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(params.data.psh_representative_phone, 30) || "-";
        },
      },
      {
        headerName: t("psh_role"),
        field: "psh_role",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          return truncateText(params.data.psh_role, 30) || "-";
        },
      },
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
              setInclude={setInclude}
            />
            <div className="w-100">
              <AdvancedSearch
                searchHook={useSearchProjectStakeholders}
                textSearchKeys={["prj_name", "prj_code"]}
                dateSearchKeys={[]}
                dropdownSearchKeys={[]}
                checkboxSearchKeys={[]}
                component_params={{}}
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
                      columnDefs={columns}
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
export default ProjectStakeholderList;
