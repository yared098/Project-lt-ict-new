import React, { useEffect, lazy, useMemo, useState,useRef } from "react";
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
//import SearchComponent from "../../components/Common/SearchComponent";
//import components
const AgGridContainer = lazy(() =>
  import("../../components/Common/AgGridContainer")
);
import "bootstrap/dist/css/bootstrap.min.css";
import CascadingDropdowns from "../../components/Common/CascadingDropdowns2";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";

import {
  useFetchProcurementInformations,
  useSearchProcurementInformations,
  useAddProcurementInformation,
  useDeleteProcurementInformation,
  useUpdateProcurementInformation,
} from "../../queries/procurementinformation_query";
import ProcurementInformationModal from "./ProcurementInformationModal";
import { useTranslation } from "react-i18next";
import { useFetchProcurementStages } from "../../queries/procurementstage_query";
import { useFetchProcurementMethods } from "../../queries/procurementmethod_query";
import { useSelector, useDispatch } from "react-redux";
import { createSelectOptions, createMultiSelectOptions } from "../../utils/commonMethods";

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
import { ToastContainer,toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import TreeForLists from "../../components/Common/TreeForLists";
import { createSelector } from "reselect";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProcurementInformationList = () => {
  //meta title
  document.title = " ProcurementInformation";
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [procurementInformation, setProcurementInformation] = useState(null);

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
  const { data, isLoading, error, isError, refetch } =  useState("");
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);
 const { data: procurementStageData } = useFetchProcurementStages();
  const { data: procurementMethodData } = useFetchProcurementMethods();
     const {
    pst_name_en: procurementStageOptionsEn,
    pst_name_or: procurementStageOptionsOr,
    pst_name_am: procurementStageOptionsAm,
  } = createMultiSelectOptions(procurementStageData?.data || [], "pst_id", [
    "pst_name_en",
    "pst_name_or",
    "pst_name_am",
  ]);

 const procurementStageMap = useMemo(() => {
    return (
      procurementStageData?.data?.reduce((acc, procurement_stage) => {
        acc[procurement_stage.pst_id] =
          lang === "en"
            ? procurement_stage.pst_name_en
            : lang === "am"
            ? procurement_stage.pst_name_am
            : procurement_stage.pst_name_or;
        return acc;
      }, {}) || {}
    );
  }, [procurementStageData, lang]);

  const {
    prm_name_en: procurementMethodOptionsEn,
    prm_name_or: procurementMethodOptionsOr,
    prm_name_am: procurementMethodOptionsAm,
  } = createMultiSelectOptions(procurementMethodData?.data || [], "prm_id", [
    "prm_name_en",
    "prm_name_or",
    "prm_name_am",
  ]);

 const procurementMethodMap = useMemo(() => {
    return (
      procurementMethodData?.data?.reduce((acc, procurement_method) => {
        acc[procurement_method.prm_id] =
          lang === "en"
            ? procurement_method.prm_name_en
            : lang === "am"
            ? procurement_method.prm_name_am
            : procurement_method.prm_name_or;
        return acc;
      }, {}) || {}
    );
  }, [procurementMethodData, lang]);
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
  const columnDefs  = useMemo(() => {
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
        headerName: t("pri_total_procurement_amount"),
        field: "pri_total_procurement_amount",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_total_procurement_amount, 30) || "-";
        },
      },
       {
        headerName: t("pri_bid_announced_date"),
        field: "pri_bid_announced_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_announced_date, 30) || "-";
        },
      },
      {
        headerName: t("pri_bid_invitation_date"),
        field: "pri_bid_invitation_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_invitation_date, 30) || "-";
        },
      },
        {
        headerName: t("pri_bid_opening_date"),
        field: "pri_bid_opening_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_opening_date, 30) || "-";
        },
      },
      {
        headerName: t("pri_bid_closing_date"),
        field: "pri_bid_closing_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_closing_date, 30) || "-";
        },
      },
       {
        headerName: t("pri_bid_evaluation_date"),
        field: "pri_bid_evaluation_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_evaluation_date, 30) || "-";
        },
      },
      {
        headerName: t("pri_bid_award_date"),
        field: "pri_bid_award_date",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.pri_bid_award_date, 30) || "-";
        },
      },
      {
        headerName: t("pri_procurement_stage_id"),
        field: "pri_procurement_stage_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(procurementStageMap[params.data.pri_procurement_stage_id], 30) || "-";

        },
      },
      {
        headerName: t("pri_procurement_method_id"),
        field: "pri_procurement_method_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(procurementMethodMap[params.data.pri_procurement_method_id], 30) || "-";
        },
      }
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
            searchHook={useSearchProcurementInformations}
            textSearchKeys={["prj_name", "prj_code"]}
            dateSearchKeys={[]}
             dropdownSearchKeys={[
            {
             key: "pri_procurement_stage_id",
             options:
                      lang === "en"
                        ? procurementStageOptionsEn
                        : lang === "am"
                        ? procurementStageOptionsAm
                        : procurementStageOptionsOr,
             },
             {
              key: "pri_procurement_method_id",
              options:
                      lang === "en"
                        ? procurementMethodOptionsEn
                        : lang === "am"
                        ? procurementMethodOptionsAm
                        : procurementMethodOptionsOr,
            },
            ]}
            
            checkboxSearchKeys={[]}
            additionalParams={projectParams}
            setAdditionalParams={setProjectParams}
            onSearchResult={handleSearchResults}
            setIsSearchLoading={setIsSearchLoading}
            setSearchResults={setSearchResults}
            setShowSearchResult={setShowSearchResult}
          >
          <AgGridContainer
                  rowData={
                    showSearchResult ? searchResults?.data : data?.data || []
                  }
                  columnDefs={columnDefs}
                  isLoading={isSearchLoading}
                  isPagination={true}
                  rowHeight={35}
                  paginationPageSize={10}
                  isGlobalFilter={true}
                  isExcelExport={true}
                  isPdfExport={true}
                  isPrint={true}
                  tableName="Project Procurement"
                  includeKey={[
                    "prj_name",
                    "prj_code",
                    "pri_total_procurement_amount",
                    "pri_bid_opening_date",
                    "pri_bid_closing_date",
                  ]}
                  excludeKey={["is_editable", "is_deletable"]}
                />
              </AdvancedSearch>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
export default ProcurementInformationList;