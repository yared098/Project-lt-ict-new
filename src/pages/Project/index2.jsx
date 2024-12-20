import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import SearchComponent from "../../components/Common/SearchComponent";
//import components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";

import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "bootstrap/dist/css/bootstrap.min.css";

import {
  getProject as onGetProject,
  addProject as onAddProject,
  updateProject as onUpdateProject,
  deleteProject as onDeleteProject,
} from "../../store/project/actions";
import { getProjectStatus } from "../../store/projectstatus/actions";
import { getProjectCategory } from "../../store/projectcategory/actions";
import { getBudgetSource } from "../../store/budgetsource/actions";
import { getSectorCategory } from "../../store/sectorcategory/actions";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import ProjectModal from "./ProjectModal";
import { useTranslation } from "react-i18next";
import RightOffCanvas from "../../components/Common/RightOffCanvas";
import ProjectDocument from "../Projectdocument";
import ProjectPayment from "../Projectpayment";
import ProjectStakeholder from "../Projectstakeholder";
import Projectcontractor from "../Projectcontractor";
import Budgetrequest from "../Budgetrequest";
import GeoLocation from "../GeoLocation";
import ProjectBudgetExpenditureModel from "../Projectbudgetexpenditure";
import ProjectEmployeeModel from "../../pages/Projectemployee";
import ProjectHandoverModel from "../Projecthandover";
import ProjectPerformanceModel from "../Projectperformance";
import ProjectSupplimentaryModel from "../Projectsupplimentary";
import ProjectVariationModel from "../Projectvariation";

import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";

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
  InputGroup,
  Badge,
} from "reactstrap";
import { ToastContainer } from "react-toastify";
import { formatDate } from "../../utils/commonMethods";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectModel = () => {
  //meta title
  document.title = " Project";

  const { t } = useTranslation();

  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [project, setProject] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
  const [showSearchResults, setShowSearchResults] = useState(false); // To determine if search results should be displayed

  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);

  //START FOREIGN CALLS
  const [projectStatusOptions, setProjectStatusOptions] = useState([]);
  const [selectedProjectStatus, setSelectedProjectStatus] = useState("");
  const [projectCategoryOptions, setProjectCategoryOptions] = useState([]);
  const [selectedProjectCategory, setSelectedProjectCategory] = useState("");
  const [budgetSourceOptions, setBudgetSourceOptions] = useState([]);
  const [selectedBudgetSource, setSelectedBudgetSource] = useState("");
  const [projectMetaData, setProjectMetaData] = useState({});
  const [showCanvas, setShowCanvas] = useState(false);

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,

    initialValues: {
      prj_name: (project && project.prj_name) || "",
      prj_code: (project && project.prj_code) || "",
      prj_total_estimate_budget:
        (project && project.prj_total_estimate_budget) || "",
      prj_total_actual_budget:
        (project && project.prj_total_actual_budget) || "",
      // prj_geo_location: (project && project.prj_geo_location) || "",
      prj_sector_id: (project && project.prj_sector_id) || "",
      prj_location_region_id: (project && project.prj_location_region_id) || "",
      prj_location_zone_id: (project && project.prj_location_zone_id) || "",
      prj_location_woreda_id: (project && project.prj_location_woreda_id) || "",
      prj_location_kebele_id: (project && project.prj_location_kebele_id) || "",
      prj_location_description:
        (project && project.prj_location_description) || "",
      prj_owner_region_id: (project && project.prj_owner_region_id) || "",
      prj_owner_zone_id: (project && project.prj_owner_zone_id) || "",
      prj_owner_woreda_id: (project && project.prj_owner_woreda_id) || "",
      prj_owner_kebele_id: (project && project.prj_owner_kebele_id) || "",
      prj_owner_description: (project && project.prj_owner_description) || "",
      prj_start_date_et: (project && project.prj_start_date_et) || "",
      prj_start_date_gc: (project && project.prj_start_date_gc) || "",
      prj_start_date_plan_et: (project && project.prj_start_date_plan_et) || "",
      prj_start_date_plan_gc: (project && project.prj_start_date_plan_gc) || "",
      prj_end_date_actual_et: (project && project.prj_end_date_actual_et) || "",
      prj_end_date_actual_gc: (project && project.prj_end_date_actual_gc) || "",
      prj_end_date_plan_gc: (project && project.prj_end_date_plan_gc) || "",
      prj_end_date_plan_et: (project && project.prj_end_date_plan_et) || "",
      prj_outcome: (project && project.prj_outcome) || "",
      prj_deleted: (project && project.prj_deleted) || "",
      prj_remark: (project && project.prj_remark) || "",
      prj_created_date: (project && project.prj_created_date) || "",
      prj_owner_id: (project && project.prj_owner_id) || "",
      prj_urban_ben_number: (project && project.prj_urban_ben_number) || "",
      prj_rural_ben_number: (project && project.prj_rural_ben_number) || "",

      is_deletable: (project && project.is_deletable) || 1,
      is_editable: (project && project.is_editable) || 1,
    },

    validationSchema: Yup.object({
      prj_name: Yup.string().required(t("prj_name")),
      prj_code: Yup.string().required(t("prj_code")),
      prj_total_estimate_budget: Yup.number().required(
        t("prj_total_estimate_budget")
      ),
      prj_total_actual_budget: Yup.number().required(
        t("prj_total_actual_budget")
      ),

      prj_sector_id: Yup.string().required(t("prj_sector_id")),
      prj_location_region_id: Yup.string().required(
        t("prj_location_region_id")
      ),
      prj_location_zone_id: Yup.string().required(t("prj_location_zone_id")),
      prj_location_woreda_id: Yup.string().required(
        t("prj_location_woreda_id")
      ),
      prj_location_kebele_id: Yup.string().required(
        t("prj_location_kebele_id")
      ),
      prj_location_description: Yup.string().required(
        t("prj_location_description")
      ),
      prj_start_date_et: Yup.string().required(t("prj_start_date_et")),
      prj_start_date_gc: Yup.string().required(t("prj_start_date_gc")),
      prj_start_date_plan_et: Yup.string().required(
        t("prj_start_date_plan_et")
      ),
      prj_start_date_plan_gc: Yup.string().required(
        t("prj_start_date_plan_gc")
      ),
      prj_end_date_actual_et: Yup.string().required(
        t("prj_end_date_actual_et")
      ),
      prj_end_date_actual_gc: Yup.string().required(
        t("prj_end_date_actual_gc")
      ),
      prj_end_date_plan_gc: Yup.string().required(t("prj_end_date_plan_gc")),
      prj_end_date_plan_et: Yup.string().required(t("prj_end_date_plan_et")),
      prj_outcome: Yup.string().required(t("prj_outcome")),
      prj_remark: Yup.string().required(t("prj_remark")),
      prj_urban_ben_number: Yup.number().required(t("prj_urban_ben_number")),
      prj_rural_ben_number: Yup.number().required(t("prj_rural_ben_number")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProject = {
          prj_id: project ? project.prj_id : 0,
          prj_name: values.prj_name,
          prj_code: values.prj_code,
          prj_total_estimate_budget: values.prj_total_estimate_budget,
          prj_total_actual_budget: values.prj_total_actual_budget,
          prj_sector_id: values.prj_sector_id,
          prj_location_region_id: values.prj_location_region_id,
          prj_location_zone_id: values.prj_location_zone_id,
          prj_location_woreda_id: values.prj_location_woreda_id,
          prj_location_kebele_id: values.prj_location_kebele_id,
          prj_location_description: values.prj_location_description,
          prj_owner_region_id: values.prj_owner_region_id,
          prj_owner_zone_id: values.prj_owner_zone_id,
          prj_owner_woreda_id: values.prj_owner_woreda_id,
          prj_owner_kebele_id: values.prj_owner_kebele_id,
          prj_owner_description: values.prj_owner_description,
          prj_start_date_et: values.prj_start_date_et,
          prj_start_date_gc: values.prj_start_date_gc,
          prj_start_date_plan_et: values.prj_start_date_plan_et,
          prj_start_date_plan_gc: values.prj_start_date_plan_gc,
          prj_end_date_actual_et: values.prj_end_date_actual_et,
          prj_end_date_actual_gc: values.prj_end_date_actual_gc,
          prj_end_date_plan_gc: values.prj_end_date_plan_gc,
          prj_end_date_plan_et: values.prj_end_date_plan_et,
          prj_outcome: values.prj_outcome,
          prj_deleted: values.prj_deleted,
          prj_remark: values.prj_remark,
          prj_created_date: values.prj_created_date,
          prj_owner_id: values.prj_owner_id,
          prj_urban_ben_number: values.prj_urban_ben_number,
          prj_rural_ben_number: values.prj_rural_ben_number,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update Project
        console.log(updateProject);
        dispatch(onUpdateProject(updateProject));
        validation.resetForm();
      } else {
        const newProject = {
          prj_name: values.prj_name,
          prj_code: values.prj_code,
          prj_total_estimate_budget: values.prj_total_estimate_budget,
          prj_total_actual_budget: values.prj_total_actual_budget,
          prj_sector_id: values.prj_sector_id,
          prj_location_region_id: values.prj_location_region_id,
          prj_location_zone_id: values.prj_location_zone_id,
          prj_location_woreda_id: values.prj_location_woreda_id,
          prj_location_kebele_id: values.prj_location_kebele_id,
          prj_location_description: values.prj_location_description,
          prj_owner_region_id: values.prj_owner_region_id,
          prj_owner_zone_id: values.prj_owner_zone_id,
          prj_owner_woreda_id: values.prj_owner_woreda_id,
          prj_owner_kebele_id: values.prj_owner_kebele_id,
          prj_owner_description: values.prj_owner_description,
          prj_start_date_et: values.prj_start_date_et,
          prj_start_date_gc: values.prj_start_date_gc,
          prj_start_date_plan_et: values.prj_start_date_plan_et,
          prj_start_date_plan_gc: values.prj_start_date_plan_gc,
          prj_end_date_actual_et: values.prj_end_date_actual_et,
          prj_end_date_actual_gc: values.prj_end_date_actual_gc,
          prj_end_date_plan_gc: values.prj_end_date_plan_gc,
          prj_end_date_plan_et: values.prj_end_date_plan_et,
          prj_outcome: values.prj_outcome,
          prj_deleted: values.prj_deleted,
          prj_remark: values.prj_remark,
          prj_created_date: values.prj_created_date,
          prj_owner_id: values.prj_owner_id,
          prj_urban_ben_number: values.prj_urban_ben_number,
          prj_rural_ben_number: values.prj_rural_ben_number,
        };
        // save new Projects
        dispatch(onAddProject(newProject));
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  const dispatch = useDispatch();
  // Fetch Project on component mount
  useEffect(() => {
    dispatch(onGetProject());
    dispatch(getProjectStatus());
    dispatch(getBudgetSource());
    dispatch(getProjectCategory());
    dispatch(getSectorCategory());
  }, [dispatch]);

  const projectProperties = createSelector(
    (state) => state.ProjectR,
    (ProjectReducer) => ({
      project: ProjectReducer.project,
      loading: ProjectReducer.loading,
      update_loading: ProjectReducer.update_loading,
    })
  );

  const {
    project: { data, previledge },
    loading,
    update_loading,
  } = useSelector(projectProperties);

  const projectStatusProperties = createSelector(
    (state) => state.ProjectStatusR,
    (ProjectStatusReducer) => ({
      projectStatus: ProjectStatusReducer.projectStatus,
      loading: ProjectStatusReducer.loading,
      update_loading: ProjectStatusReducer.update_loading,
    })
  );
  const {
    projectStatus: {
      data: projectStatusData,
      previledge: projectStatusPreviledge,
    },
    loading: projectStatusLoading,
    update_loading: projectStatusUpdateLoading,
  } = useSelector(projectStatusProperties);

  const projectCategoryProperties = createSelector(
    (state) => state.ProjectCategoryR,
    (ProjectCategoryReducer) => ({
      projectCategory: ProjectCategoryReducer.projectCategory,
      loading: ProjectCategoryReducer.loading,
      update_loading: ProjectCategoryReducer.update_loading,
    })
  );
  const {
    projectCategory: {
      data: projectCategoryData,
      previledge: projectCategoryPreviledge,
    },
    loading: projectCategoryLoading,
    update_loading: projectCategoryUpdateLoading,
  } = useSelector(projectCategoryProperties);

  const budgetSourceProperties = createSelector(
    (state) => state.BudgetSourceR,
    (BudgetSourceReducer) => ({
      budgetSource: BudgetSourceReducer.budgetSource,
      loading: BudgetSourceReducer.loading,
      update_loading: BudgetSourceReducer.update_loading,
    })
  );
  const {
    budgetSource: {
      data: budgetSourceData,
      previledge: budgetSourcePreviledge,
    },
    loading: budgetSourceLoading,
    update_loading: budgetSourceUpdateLoading,
  } = useSelector(budgetSourceProperties);

  const sectorCategoryProperties = createSelector(
    (state) => state.SectorCategoryR,
    (SectorCategoryReducer) => ({
      sectorCategory: SectorCategoryReducer.sectorCategory,
      loading: SectorCategoryReducer.loading,
      update_loading: SectorCategoryReducer.update_loading,
    })
  );

  const {
    sectorCategory: { data: sectorCategoryData, previledge: sectorPrivledge },
    loading: sectorLoading,
    update_loading: sectorUpdateLoading,
  } = useSelector(sectorCategoryProperties);

  useEffect(() => {
    setModal(false);
  }, [update_loading]);

  const selectSearchProperties = createSelector(
    (state) => state.search,
    (search) => ({
      results: search.results,
    })
  );

  const { results } = useSelector(selectSearchProperties);

  const [isLoading, setLoading] = useState(loading);
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

  const handleProjectClick = (arg) => {
    const project = arg;
    // console.log("handleProjectClick", project);
    setProject({
      prj_id: project.prj_id,
      prj_name: project.prj_name,
      prj_code: project.prj_code,
      prj_total_estimate_budget: project.prj_total_estimate_budget,
      prj_total_actual_budget: project.prj_total_actual_budget,
      prj_geo_location: project.prj_geo_location,
      prj_sector_id: project.prj_sector_id,
      prj_location_region_id: project.prj_location_region_id,
      prj_location_zone_id: project.prj_location_zone_id,
      prj_location_woreda_id: project.prj_location_woreda_id,
      prj_location_kebele_id: project.prj_location_kebele_id,
      prj_location_description: project.prj_location_description,
      prj_owner_region_id: project.prj_owner_region_id,
      prj_owner_zone_id: project.prj_owner_zone_id,
      prj_owner_woreda_id: project.prj_owner_woreda_id,
      prj_owner_kebele_id: project.prj_owner_kebele_id,
      prj_owner_description: project.prj_owner_description,
      prj_start_date_et: project.prj_start_date_et,
      prj_start_date_gc: project.prj_start_date_gc,
      prj_start_date_plan_et: project.prj_start_date_plan_et,
      prj_start_date_plan_gc: project.prj_start_date_plan_gc,
      prj_end_date_actual_et: project.prj_end_date_actual_et,
      prj_end_date_actual_gc: project.prj_end_date_actual_gc,
      prj_end_date_plan_gc: project.prj_end_date_plan_gc,
      prj_end_date_plan_et: project.prj_end_date_plan_et,
      prj_outcome: project.prj_outcome,
      prj_deleted: project.prj_deleted,
      prj_remark: project.prj_remark,
      prj_created_date: project.prj_created_date,
      prj_owner_id: project.prj_owner_id,
      prj_urban_ben_number: project.prj_urban_ben_number,
      prj_rural_ben_number: project.prj_rural_ben_number,

      is_deletable: project.is_deletable,
      is_editable: project.is_editable,
    });

    setIsEdit(true);

    toggle();
  };

  const handleClick = (data) => {
    setShowCanvas(!showCanvas); // Toggle canvas visibility
    setProjectMetaData(data);
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (project) => {
    setProject(project);
    setDeleteModal(true);
  };

  const handleDeleteProject = () => {
    if (project && project.prj_id) {
      dispatch(onDeleteProject(project.prj_id));
      setDeleteModal(false);
    }
  };
  const handleProjectClicks = () => {
    setIsEdit(false);
    setProject("");
    toggle();
  };

  const columnDefs = useMemo(() => {
    const baseColumnDefs = [
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
        headerName: t("prj_total_estimate_budget"),
        field: "prj_total_estimate_budget",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_total_estimate_budget, 30) || "-";
        },
      },
      {
        headerName: t("prj_total_actual_budget"),
        field: "prj_total_actual_budget",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_total_actual_budget, 30) || "-";
        },
      },
      {
        headerName: t("prj_sector_id"),
        field: "prj_sector_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_sector_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_location_zone_id"),
        field: "prj_location_zone_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_location_zone_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_location_woreda_id"),
        field: "prj_location_woreda_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_location_woreda_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_location_kebele_id"),
        field: "prj_location_kebele_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_location_kebele_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_owner_zone_id"),
        field: "prj_owner_zone_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_owner_zone_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_owner_woreda_id"),
        field: "prj_owner_woreda_id",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_owner_woreda_id, 30) || "-";
        },
      },
      {
        headerName: t("prj_start_date_et"),
        field: "prj_start_date_et",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_start_date_et, 30) || "-";
        },
      },
      {
        headerName: t("prj_start_date_gc"),
        field: "prj_start_date_gc",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_start_date_gc, 30) || "-";
        },
      },
      {
        headerName: t("prj_start_date_plan_et"),
        field: "prj_start_date_plan_et",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_start_date_plan_et, 30) || "-";
        },
      },
      {
        headerName: t("prj_start_date_plan_gc"),
        field: "prj_start_date_plan_gc",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_start_date_plan_gc, 30) || "-";
        },
      },
      {
        headerName: t("prj_end_date_actual_et"),
        field: "prj_end_date_actual_et",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_end_date_actual_et, 30) || "-";
        },
      },
      {
        headerName: t("prj_end_date_actual_gc"),
        field: "prj_end_date_actual_gc",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_end_date_actual_gc, 30) || "-";
        },
      },
      {
        headerName: t("prj_end_date_plan_gc"),
        field: "prj_end_date_plan_gc",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_end_date_plan_gc, 30) || "-";
        },
      },
      {
        headerName: t("prj_end_date_plan_et"),
        field: "prj_end_date_plan_et",
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
          return truncateText(params.data.prj_end_date_plan_et, 30) || "-";
        },
      },
      {
        headerName: t("view_detail"),
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          const { prj_id } = params.data;

          return (
            <Link to={`/Project/${prj_id}`}>
              <Button type="button" color="primary" className="btn-sm">
                {t("view_detail")}
              </Button>
            </Link>
          );
        },
      },
    ];

    // Adding the action buttons column
    if (previledge?.is_role_editable && previledge?.is_role_deletable) {
      baseColumnDefs.push({
        headerName: t("actions"),
        field: "actions",
        cellRenderer: (params) => {
          return (
            <div className="action-icons">
              {params.data.is_editable ? (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => handleProjectClick(params.data)}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    Edit
                  </UncontrolledTooltip>
                </Link>
              ) : (
                ""
              )}
              {params.data.is_editable ? (
                <Link
                  to="#"
                  className="text-secondary ms-2"
                  onClick={() => handleClick(params.data)}
                >
                  <i className="mdi mdi-eye font-size-18" id="viewtooltip" />
                  <UncontrolledTooltip placement="top" target="viewtooltip">
                    View
                  </UncontrolledTooltip>
                </Link>
              ) : (
                ""
              )}
              {params.data.is_deletable ? (
                <Link
                  to="#"
                  className="text-danger ms-2"
                  onClick={() => onClickDelete(params.data)}
                >
                  <i
                    className="mdi mdi-delete font-size-18"
                    id="deletetooltip"
                  />
                  <UncontrolledTooltip placement="top" target="deletetooltip">
                    Delete
                  </UncontrolledTooltip>
                </Link>
              ) : (
                ""
              )}
            </div>
          );
        },
      });
    }

    return baseColumnDefs;
  }, [handleProjectClick, toggleViewModal, onClickDelete]);

  const project_status = [
    { label: "select Status name", value: "" },
    { label: "Active", value: 1 },
    { label: "Inactive", value: 0 },
  ];

  const dropdawntotal = [project_status];

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

  return (
    <React.Fragment>
      <ProjectModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProject}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title={t("project")} breadcrumbItem={t("project")} />
          {isLoading || searchLoading ? (
            <Spinners setLoading={setLoading} />
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
                  />
                </Col>
                <Col sm="12" md="6" className="text-md-end">
                  <Button
                    color="primary"
                    className="me-2"
                    onClick={filterMarked}
                  >
                    Filter Marked
                  </Button>
                  <Button
                    color="secondary"
                    className="me-2"
                    onClick={clearFilter}
                  >
                    Clear Filter
                  </Button>
                  <Button color="success" onClick={handleProjectClicks}>
                    Add New
                  </Button>
                </Col>
              </Row>

              {/* AG Grid */}
              <div style={{ height: "400px" }}>
                <AgGridReact
                  ref={gridRef}
                  rowData={showSearchResults ? results : data}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSizeSelector={[10, 20, 30, 40, 50]}
                  paginationPageSize={10}
                  quickFilterText={quickFilterText}
                  onSelectionChanged={onSelectionChanged}
                />
              </div>
            </div>
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("project")
                : t("add") + " " + t("project")}
            </ModalHeader>
            <ModalBody>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  const modalCallback = () => setModal(false);
                  if (isEdit) {
                    onUpdateProject(validation.values, modalCallback);
                  } else {
                    onAddProject(validation.values, modalCallback);
                  }
                  return false;
                }}
              >
                <Row>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_name")}</Label>
                    <Input
                      name="prj_name"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_name || ""}
                      invalid={
                        validation.touched.prj_name &&
                        validation.errors.prj_name
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_name &&
                    validation.errors.prj_name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_code")}</Label>
                    <Input
                      name="prj_code"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_code || ""}
                      invalid={
                        validation.touched.prj_code &&
                        validation.errors.prj_code
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_code &&
                    validation.errors.prj_code ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_code}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_project_status_id")}</Label>
                    <Input
                      name="prj_project_status_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_project_status_id}
                    >
                      <option value={""}>{t(`Select Project Status`)}</option>
                      {projectStatusData.map((option) => (
                        <option key={option.prs_id} value={option.prs_id}>
                          {t(`${option.prs_status_name_or}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prj_project_status_id &&
                    validation.errors.prj_project_status_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_project_status_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_project_category_id")}</Label>
                    <Input
                      name="prj_project_category_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_project_category_id}
                    >
                      <option value={""}>{t(`Select Project Category`)}</option>
                      {projectCategoryData.map((option) => (
                        <option key={option.pct_id} value={option.pct_id}>
                          {t(`${option.pct_name_or}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prj_project_category_id &&
                    validation.errors.prj_project_category_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_project_category_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_project_budget_source_id")}</Label>
                    <Input
                      name="prj_project_budget_source_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_project_budget_source_id}
                    >
                      <option value={""}>
                        {t(`Select Project Budget Source`)}
                      </option>
                      {budgetSourceData.map((option) => (
                        <option key={option.pbs_id} value={option.pbs_id}>
                          {t(`${option.pbs_name_or}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prj_project_budget_source_id &&
                    validation.errors.prj_project_budget_source_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_project_budget_source_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_total_estimate_budget")}</Label>
                    <Input
                      name="prj_total_estimate_budget"
                      type="number"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_total_estimate_budget || ""}
                      invalid={
                        validation.touched.prj_total_estimate_budget &&
                        validation.errors.prj_total_estimate_budget
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_total_estimate_budget &&
                    validation.errors.prj_total_estimate_budget ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_total_estimate_budget}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_total_actual_budget")}</Label>
                    <Input
                      name="prj_total_actual_budget"
                      type="number"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_total_actual_budget || ""}
                      invalid={
                        validation.touched.prj_total_actual_budget &&
                        validation.errors.prj_total_actual_budget
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_total_actual_budget &&
                    validation.errors.prj_total_actual_budget ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_total_actual_budget}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_sector_id")}</Label>
                    <Input
                      name="prj_sector_id"
                      type="select"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_sector_id || ""}
                      invalid={
                        validation.touched.prj_sector_id &&
                        validation.errors.prj_sector_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    >
                      <option value={""}>{t(`Select Project Sector`)}</option>
                      {sectorCategoryData.map((option) => (
                        <option key={option.psc_id} value={option.psc_id}>
                          {t(`${option.psc_name}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prj_sector_id &&
                    validation.errors.prj_sector_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_sector_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_location_region_id")}</Label>
                    <Input
                      name="prj_location_region_id"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_location_region_id || ""}
                      invalid={
                        validation.touched.prj_location_region_id &&
                        validation.errors.prj_location_region_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_location_region_id &&
                    validation.errors.prj_location_region_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_location_region_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_location_zone_id")}</Label>
                    <Input
                      name="prj_location_zone_id"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_location_zone_id || ""}
                      invalid={
                        validation.touched.prj_location_zone_id &&
                        validation.errors.prj_location_zone_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_location_zone_id &&
                    validation.errors.prj_location_zone_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_location_zone_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_location_woreda_id")}</Label>
                    <Input
                      name="prj_location_woreda_id"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_location_woreda_id || ""}
                      invalid={
                        validation.touched.prj_location_woreda_id &&
                        validation.errors.prj_location_woreda_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_location_woreda_id &&
                    validation.errors.prj_location_woreda_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_location_woreda_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_location_kebele_id")}</Label>
                    <Input
                      name="prj_location_kebele_id"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_location_kebele_id || ""}
                      invalid={
                        validation.touched.prj_location_kebele_id &&
                        validation.errors.prj_location_kebele_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_location_kebele_id &&
                    validation.errors.prj_location_kebele_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_location_kebele_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_location_description")}</Label>
                    <Input
                      name="prj_location_description"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_location_description || ""}
                      invalid={
                        validation.touched.prj_location_description &&
                        validation.errors.prj_location_description
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_location_description &&
                    validation.errors.prj_location_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_location_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_owner_description")}</Label>
                    <Input
                      name="prj_owner_description"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_owner_description || ""}
                      invalid={
                        validation.touched.prj_owner_description &&
                        validation.errors.prj_owner_description
                          ? true
                          : false
                      }
                    />
                    {validation.touched.prj_owner_description &&
                    validation.errors.prj_owner_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_owner_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_start_date_et")}</Label>
                    <Input
                      name="prj_start_date_et"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_start_date_et || ""}
                      invalid={
                        validation.touched.prj_start_date_et &&
                        validation.errors.prj_start_date_et
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_start_date_et &&
                    validation.errors.prj_start_date_et ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_start_date_et}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <FormGroup>
                      <Label>{t("prj_start_date_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${
                            validation.touched.prj_start_date_gc &&
                            validation.errors.prj_start_date_gc
                              ? "is-invalid"
                              : ""
                          }`}
                          name="prj_start_date_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prj_start_date_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prj_start_date_gc",
                              formatedDate
                            ); // Set value in Formik
                          }}
                          onBlur={validation.handleBlur}
                        />

                        <Button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled
                        >
                          <i className="fa fa-calendar" aria-hidden="true" />
                        </Button>
                      </InputGroup>
                      {validation.touched.prj_start_date_gc &&
                      validation.errors.prj_start_date_gc ? (
                        <FormFeedback>
                          {validation.errors.prj_start_date_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_start_date_plan_et")}</Label>
                    <Input
                      name="prj_start_date_plan_et"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_start_date_plan_et || ""}
                      invalid={
                        validation.touched.prj_start_date_plan_et &&
                        validation.errors.prj_start_date_plan_et
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_start_date_plan_et &&
                    validation.errors.prj_start_date_plan_et ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_start_date_plan_et}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <FormGroup>
                      <Label>{t("prj_start_date_plan_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${
                            validation.touched.prj_start_date_plan_gc &&
                            validation.errors.prj_start_date_plan_gc
                              ? "is-invalid"
                              : ""
                          }`}
                          name="prj_start_date_plan_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prj_start_date_plan_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prj_start_date_plan_gc",
                              formatedDate
                            ); // Set value in Formik
                          }}
                          onBlur={validation.handleBlur}
                        />

                        <Button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled
                        >
                          <i className="fa fa-calendar" aria-hidden="true" />
                        </Button>
                      </InputGroup>
                      {validation.touched.prj_start_date_plan_gc &&
                      validation.errors.prj_start_date_plan_gc ? (
                        <FormFeedback>
                          {validation.errors.prj_start_date_plan_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_end_date_actual_et")}</Label>
                    <Input
                      name="prj_end_date_actual_et"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_end_date_actual_et || ""}
                      invalid={
                        validation.touched.prj_end_date_actual_et &&
                        validation.errors.prj_end_date_actual_et
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_end_date_actual_et &&
                    validation.errors.prj_end_date_actual_et ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_end_date_actual_et}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <FormGroup>
                      <Label>{t("prj_end_date_actual_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${
                            validation.touched.prj_end_date_actual_gc &&
                            validation.errors.prj_end_date_actual_gc
                              ? "is-invalid"
                              : ""
                          }`}
                          name="prj_end_date_actual_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prj_end_date_actual_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prj_end_date_actual_gc",
                              formatedDate
                            ); // Set value in Formik
                          }}
                          onBlur={validation.handleBlur}
                        />

                        <Button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled
                        >
                          <i className="fa fa-calendar" aria-hidden="true" />
                        </Button>
                      </InputGroup>
                      {validation.touched.prj_end_date_actual_gc &&
                      validation.errors.prj_end_date_actual_gc ? (
                        <FormFeedback>
                          {validation.errors.prj_end_date_actual_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <FormGroup>
                      <Label>{t("prj_end_date_plan_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${
                            validation.touched.prj_end_date_plan_gc &&
                            validation.errors.prj_end_date_plan_gc
                              ? "is-invalid"
                              : ""
                          }`}
                          name="prj_end_date_plan_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prj_end_date_plan_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prj_end_date_plan_gc",
                              formatedDate
                            ); // Set value in Formik
                          }}
                          onBlur={validation.handleBlur}
                        />

                        <Button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled
                        >
                          <i className="fa fa-calendar" aria-hidden="true" />
                        </Button>
                      </InputGroup>
                      {validation.touched.prj_end_date_plan_gc &&
                      validation.errors.prj_end_date_plan_gc ? (
                        <FormFeedback>
                          {validation.errors.prj_end_date_plan_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_end_date_plan_et")}</Label>
                    <Input
                      name="prj_end_date_plan_et"
                      type="text"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_end_date_plan_et || ""}
                      invalid={
                        validation.touched.prj_end_date_plan_et &&
                        validation.errors.prj_end_date_plan_et
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_end_date_plan_et &&
                    validation.errors.prj_end_date_plan_et ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_end_date_plan_et}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_urban_ben_number")}</Label>
                    <Input
                      name="prj_urban_ben_number"
                      type="number"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_urban_ben_number || ""}
                      invalid={
                        validation.touched.prj_urban_ben_number &&
                        validation.errors.prj_urban_ben_number
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_urban_ben_number &&
                    validation.errors.prj_urban_ben_number ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_urban_ben_number}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("prj_rural_ben_number")}</Label>
                    <Input
                      name="prj_rural_ben_number"
                      type="number"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prj_rural_ben_number || ""}
                      invalid={
                        validation.touched.prj_rural_ben_number &&
                        validation.errors.prj_rural_ben_number
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prj_rural_ben_number &&
                    validation.errors.prj_rural_ben_number ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prj_rural_ben_number}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Row>
                    <Col className="col-md-6 mb-3">
                      <Label>{t("prj_outcome")}</Label>
                      <Input
                        name="prj_outcome"
                        type="textarea"
                        rows={6}
                        placeholder={t("insert_status_name_amharic")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.prj_outcome || ""}
                        invalid={
                          validation.touched.prj_outcome &&
                          validation.errors.prj_outcome
                            ? true
                            : false
                        }
                      />
                      {validation.touched.prj_outcome &&
                      validation.errors.prj_outcome ? (
                        <FormFeedback type="invalid">
                          {validation.errors.prj_outcome}
                        </FormFeedback>
                      ) : null}
                    </Col>

                    <Col className="col-md-6 mb-3">
                      <Label>{t("prj_remark")}</Label>
                      <Input
                        name="prj_remark"
                        type="textarea"
                        rows={6}
                        placeholder={t("insert_status_name_amharic")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.prj_remark || ""}
                        invalid={
                          validation.touched.prj_remark &&
                          validation.errors.prj_remark
                            ? true
                            : false
                        }
                      />
                      {validation.touched.prj_remark &&
                      validation.errors.prj_remark ? (
                        <FormFeedback type="invalid">
                          {validation.errors.prj_remark}
                        </FormFeedback>
                      ) : null}
                    </Col>
                  </Row>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {update_loading ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={update_loading || !validation.dirty}
                        >
                          <Spinner size={"sm"} color="#fff" />
                          {t("Save")}
                        </Button>
                      ) : (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={update_loading || !validation.dirty}
                        >
                          {t("Save")}
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
        </div>
      </div>

      {showCanvas && (
        <RightOffCanvas
          handleClick={handleClick}
          showCanvas={showCanvas}
          canvasWidth={84}
          name={projectMetaData.prj_name}
          id={projectMetaData.prj_id}
          components={{
            Documents: ProjectDocument,
            Payments: ProjectPayment,
            Stakeholder: ProjectStakeholder,
            Contractor: Projectcontractor,
            "Budget Request": Budgetrequest,
            "Geo Location": GeoLocation,
            "Budget Expenditures": ProjectBudgetExpenditureModel,
            Employees: ProjectEmployeeModel,
            Handover: ProjectHandoverModel,
            Performance: ProjectPerformanceModel,
            Supplementary: ProjectSupplimentaryModel,
            Variations: ProjectVariationModel,
          }}
        />
      )}
    </React.Fragment>
  );
};
ProjectModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectModel;
