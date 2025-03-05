import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { before, isEmpty, update } from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import CascadingDropdowns from "../../components/Common/CascadingDropdowns2";
//import components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./ag-grid.css";
import { useFetchProjectCategorys } from "../../queries/projectcategory_query";
import { useFetchSectorInformations } from "../../queries/sectorinformation_query";
import { useTranslation } from "react-i18next";

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
  FormGroup,
  InputGroup,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  Badge
} from "reactstrap";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
  onlyAmharicValidation
} from "../../utils/Validation/validation";
import { toast } from "react-toastify";
import { createSelectOptions, createMultiSelectOptions } from "../../utils/commonMethods";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";
import { useProjectListContext } from "../../context/ProjectListContext";
import SearchForProject from "../../components/Common/SearchForProject";
import ExportToExcel from "../../components/Common/ExportToExcel";
import ExportToPDF from "../../components/Common/ExportToPdf";
import PrintPage from "../../components/Common/PrintPage";

const linkMapping = {
  34: "budget_request",
  61: "project_plan",
  39: "project_budget_expenditure"
};

const ProjectModel = () => {
  document.title = " Project";

  const [projectMetaData, setProjectMetaData] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [project, setProject] = useState(null);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);
  const {
    setSearchResults,
    isSearchLoading,
    showSearchResult,
    setShowSearchResult,
    projectParams,
    setProjectParams,
    setPrjLocationRegionId,
    setPrjLocationZoneId,
    setPrjLocationWoredaId,
    setSelectedLocations,
    params,
    setParams,
    searchParams,
    setSearchParams,
    searchData,
    setInclude,
  } = useProjectListContext();

  const [isAddressLoading, setIsAddressLoading] = useState(false);

  const { data, isLoading, error, isError, refetch } = useState(false);
  const { data: projectCategoryData } = useFetchProjectCategorys();
  const {
    pct_name_en: projectCategoryOptionsEn,
    pct_name_or: projectCategoryOptionsOr,
    pct_name_am: projectCategoryOptionsAm,
  } = createMultiSelectOptions(
    projectCategoryData?.data || [],
    "pct_id",
    ["pct_name_en", "pct_name_or", "pct_name_am"]
  );
  const { data: sectorInformationData } = useFetchSectorInformations();
  const sectorInformationOptions = createSelectOptions(
    sectorInformationData?.data || [],
    "sci_id",
    "sci_name_en"
  );
  const [allowedTabs, setAllowedTabs] = useState(searchData?.allowedTabs || []);
  const allowedLinks = searchData?.allowedLinks || []

  useEffect(() => {
    if (projectMetaData?.prj_project_status_id <= 4) {
      setAllowedTabs([54, 37]);
    } else {
      setAllowedTabs(searchData?.allowedTabs || []);
    }
  }, [projectMetaData?.prj_project_status_id, searchData]);

  useEffect(() => {
    setProject(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProject(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProject(null);
    } else {
      setModal(true);
    }
  };

  const handleNodeSelect = useCallback(
    (node) => {
      if (node.level === "region") {
        setPrjLocationRegionId(node.id);
        setPrjLocationZoneId(null);
        setPrjLocationWoredaId(null);
      } else if (node.level === "zone") {
        setPrjLocationZoneId(node.id);
        setPrjLocationWoredaId(null);
      } else if (node.level === "woreda") {
        setPrjLocationWoredaId(node.id);
      }

      if (showSearchResult) {
        setShowSearchResult(false);
      }
    },
    [
      setPrjLocationRegionId,
      setPrjLocationZoneId,
      setPrjLocationWoredaId,
      showSearchResult,
      setShowSearchResult,
    ]
  );
  const handleClick = (data) => {
    setShowCanvas(!showCanvas);
    setProjectMetaData(data);
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (project) => {
    setProject(project);
    setDeleteModal(true);
  };
  const localeText = {
    // For Pagination Panel
    page: t("page"),
    more: t("more"),
    to: t("to"),
    of: t("of"),
    next: t("next"),
    last: t("last"),
    first: t("first"),
    previous: t("previous"),
    loadingOoo: t("loadingOoo"),
    noRowsToShow: t("noRowsToShow"),
    // For Set Filter
    selectAll: t("selectAll"),
    equals: t("equals"),
    notEqual: t("notEqual"),
    lessThan: t("lessThan"),
    greaterThan: t("greaterThan"),
    inRange: t("inRange"),
    lessThanOrEqual: t("lessThanOrEqual"),
    greaterThanOrEqual: t("greaterThanOrEqual"),
    contains: t("contains"),
    notContains: t("notContains"),
    startsWith: t("startsWith"),
    endsWith: t("endsWith"),
    // For Column Menu
    pinColumn: t("pinColumn"),
    before: t("before"),
    after: t("after"),
  };
  const columnDefs = useMemo(() => {
    const baseColumnDefs = [
      {
        headerName: t("S.N"),
        field: "sn",
        valueGetter: (params) => params.node.rowIndex + 1,
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "prj_name",
        headerName: t("prj_name"),
        sortable: true,
        filter: "agTextColumnFilter",
        flex: 5
      },
      {
        field: "prj_code",
        headerName: t("prj_code"),
        sortable: true,
        filter: "agTextColumnFilter",
        /*floatingFilter: true,*/
        flex: 4
      },
      {
        field: "zone_name",
        headerName: t("prj_owner_zone_id"),
        sortable: true,
        filter: "agTextColumnFilter",
        flex: 3
      },
      {
        field: "sector_name",
        headerName: t("prj_sector_id"),
        sortable: true,
        filter: "agTextColumnFilter",
        flex: 3
      },
      {
        headerName: t("prs_status"),
        field: "bdr_request_status",
        sortable: true,
        filter: true,
        flex: 2,
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
        field: "prj_total_estimate_budget",
        headerName: t("prj_total_estimate_budget"),
        flex: 3,
        valueFormatter: (params) => {
          if (params.node.footer) {
            return params.value
              ? `$${params.value.toLocaleString()}` // Show total in footer
              : "";
          }
          return params.value ? `${params.value.toLocaleString()}` : "";
        },
      },
      {
        headerName: t("view_details"),
        sortable: false,
        filter: false,
        flex: 1.5,
        cellRenderer: (params) => {
          if (params.node.footer) {
            return ""; // Suppress button for footer
          }
          const { prj_id } = params.data || {};
          return (
            <Link to={`/projectdetail/${prj_id}`} target="_blank">
              <Button type="button" className="btn-sm mb-1 default" outline>
                <i className="fa fa-eye"></i>
              </Button>
            </Link>
          );
        },
      },
    ];
    return baseColumnDefs;
  }, [data, onClickDelete, t]);
  const rowData = useMemo(() => {
    return showSearchResult ? searchData?.data : data?.data || [];
  }, [showSearchResult, searchData?.data, data?.data]);

  const searchConfig = useMemo(
    () => ({
      params,
      projectParams,
      showSearchResult,
    }),
    [params, projectParams, showSearchResult]
  );

  const handleSearch = useCallback((searchResults) => {
    setSearchResults(searchResults);
    setShowSearchResult(true);
  }, []);

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
  };
  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);
  const onSelectionChanged = useCallback(() => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
  }, []);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <div className="page-content">
        <div>
          <Breadcrumbs title={t("project")} breadcrumbItem={t("project")} />
          <div className="w-100 d-flex gap-2">
            <>
              <TreeForLists
                onNodeSelect={handleNodeSelect}
                setIsAddressLoading={setIsAddressLoading}
                setInclude={setInclude}
              />
              <div className="w-100">
                <SearchForProject
                  textSearchKeys={["prj_name", "prj_code"]}
                  dropdownSearchKeys={[
                    {
                      key: "prj_project_category_id",
                      options: lang === "en"
                        ? projectCategoryOptionsEn
                        : lang === "am"
                          ? projectCategoryOptionsAm
                          : projectCategoryOptionsOr
                      ,
                    },
                  ]}
                  checkboxSearchKeys={[]}
                  additionalParams={searchConfig.projectParams}
                  setAdditionalParams={setProjectParams}
                  setSearchResults={handleSearch}
                  setShowSearchResult={setShowSearchResult}
                  params={searchConfig.params}
                  setParams={setParams}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                />

                <div
                  className="ag-theme-alpine"
                  style={{ height: "100%", width: "100%" }}
                >
                  <Row className="mb-3">
                    <Col sm="12" md="6">
                      <Input
                        type="text"
                        placeholder={t("Search") + "..."}
                        onChange={(e) => setQuickFilterText(e.target.value)}
                        className="mb-2"
                      />
                    </Col>
                    <Col
                      sm="12"
                      md="6"
                      className="text-md-end d-flex align-items-center justify-content-end gap-2"
                    >
                      <ExportToExcel
                        tableData={searchData?.data || []}
                        tablename={"projects"}
                        excludeKey={["is_editable", "is_deletable"]}
                      />
                      <ExportToPDF
                        tableData={searchData?.data || []}
                        tablename={"projects"}
                        excludeKey={["is_editable", "is_deletable"]}
                      />
                      <PrintPage
                        tableData={searchData?.data || []}
                        tablename={t("Projects")}
                        excludeKey={["is_editable", "is_deletable"]}
                        gridRef={gridRef}
                        columnDefs={columnDefs}
                        columnsToIgnore="3"
                      />
                    </Col>
                  </Row>
                  <div style={{ height: "500px", overflow: "visible" }}>
                    <AgGridReact
                      rowStyle={{ overflow: "visible" }}
                      ref={gridRef}
                      rowData={rowData}
                      // immutableData={true}
                      getRowId={(params) => String(params.data.prj_id)}
                      columnDefs={columnDefs}
                      pagination={true}
                      paginationPageSizeSelector={[10, 20, 30, 40, 50]}
                      paginationPageSize={10}
                      quickFilterText={quickFilterText}
                      onSelectionChanged={onSelectionChanged}
                      rowHeight={32} // Set the row height here
                      animateRows={true} // Enables row animations
                      domLayout="normal" // Auto-size the grid to fit content
                      onGridReady={(params) => {
                        params.api.sizeColumnsToFit(); // Size columns to fit the grid width
                      }}
                      localeText={localeText} // Dynamically translated texts
                    />
                  </div>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
ProjectModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default ProjectModel;