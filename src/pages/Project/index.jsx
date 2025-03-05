import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty } from "lodash";
import * as Yup from "yup";
import { useFormik } from "formik";
import { CardBody, Spinner } from "reactstrap";
import CascadingDropdowns from "../../components/Common/CascadingDropdowns2";
import TableContainer from "../../components/Common/TableContainer";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./ag-grid.css";
import {
  useFetchProjects,
  useSearchProjects,
  useAddProject,
  useDeleteProject,
  useUpdateProject,
} from "../../queries/project_query";
import { useFetchProjectCategorys } from "../../queries/projectcategory_query";
import { useFetchSectorInformations } from "../../queries/sectorinformation_query";
import { useTranslation } from "react-i18next";
import ProgramInfoModel from "../Programinfo";
//import BudgetRequestModel from "../../pages/BudgetRequest";
//import ProjectPlanModel from "../../pages/ProjectPlan";
import { project_info } from "../../settings/printablecolumns";
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
import TreeForLists from "./TreeForProject";
import { useProjectContext } from "../../context/ProjectContext";

const ProjectModel = () => {
  document.title = "Projects";
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
    setSelectedLocations,
    params,
    setParams,
    searchParams,
    setSearchParams,
    searchData,
    setInclude,
  } = useProjectContext();

  const [selectedPage, setSelectedPage] = useState({ page: "", data: null });
  const [selectedNode, setSelectedNode] = useState(null)
  let param = {}
  if (selectedPage.page == "project") {
    param = { program_id: selectedPage.data.pri_id }
  }
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useSearchProjects(param, Object.keys(param).length > 0);
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

  const addProject = useAddProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const handleAddProject = async (data) => {
    try {
      await addProject.mutateAsync(data);
      toast.success(t("add_success"), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.error(t("add_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
  };

  const handleUpdateProject = async (data) => {
    try {
      await updateProject.mutateAsync(data);
      toast.success(t("update_success"), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.error(t("update_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
  };
  const handleDeleteProject = async () => {
    if (project && project.prj_id) {
      try {
        const id = project.prj_id;
        await deleteProject.mutateAsync(id);
        toast.success(t("delete_success"), {
          autoClose: 2000,
        });
      } catch (error) {
        toast.error(t("delete_success"), {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };
  const [allowedTabs, setAllowedTabs] = useState(data?.allowedTabs || []);
  const allowedLinks = data?.allowedLinks || []

  useEffect(() => {
    if (projectMetaData?.prj_project_status_id <= 4) {
      setAllowedTabs([54, 37]);
    } else {
      setAllowedTabs(data?.allowedTabs || []);
    }
  }, [projectMetaData?.prj_project_status_id, data]);

  // validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      prj_name: (project && project.prj_name) || "",
      prj_name_am: (project && project.prj_name_am) || "",
      prj_name_en: (project && project.prj_name_en) || "",
      prj_code: (project && project.prj_code) || "",
      prj_project_status_id: (project && project.prj_project_status_id) || "",
      prj_project_category_id:
        (project && project.prj_project_category_id) || "",
      prj_project_budget_source_id:
        (project && project.prj_project_budget_source_id) || "",
      prj_total_estimate_budget:
        (project && project.prj_total_estimate_budget) || "",
      prj_total_actual_budget:
        (project && project.prj_total_actual_budget) || "",
      prj_geo_location: (project && project.prj_geo_location) || "",
      prj_sector_id: (project && project.prj_sector_id) || "",
      prj_location_region_id: (project && project.prj_location_region_id) || "",
      prj_location_zone_id: (project && project.prj_location_zone_id) || "",
      prj_location_woreda_id: (project && project.prj_location_woreda_id) || "",
      prj_location_kebele_id: (project && project.prj_location_kebele_id) || "",
      prj_location_description:
        (project && project.prj_location_description) || "",
      //prj_owner_region_id: (project && project.prj_owner_region_id) || "",
      /*prj_owner_zone_id: (project && project.prj_owner_zone_id) || "",
      prj_owner_woreda_id: (project && project.prj_owner_woreda_id) || "",
      prj_owner_kebele_id: (project && project.prj_owner_kebele_id) || "",*/
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
     // prj_department_id: (project && project.prj_department_id) || "",
      is_deletable: (project && project.is_deletable) || 1,
      is_editable: (project && project.is_editable) || 1,
    },

    validationSchema: Yup.object({
      prj_name: alphanumericValidation(3, 200, true).test(
        "unique-prj_name",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) => item.prj_name == value && item.prj_id !== project?.prj_id
          );
        }
      ),
      prj_name_am: onlyAmharicValidation(3, 200, true)
        .test("unique-prj_name_am", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.prj_name_am == value && item.prj_id !== project?.prj_id
          );
        }),
      prj_name_en: alphanumericValidation(3, 200, true).test(
        "unique-prj_name_en",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) =>
              item.prj_name_en == value && item.prj_id !== project?.prj_id
          );
        }
      ),
      prj_code: alphanumericValidation(3, 20, true).test(
        "unique-prj_code",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) => item.prj_code == value && item.prj_id !== project?.prj_id
          );
        }
      ),
      //prj_project_status_id: Yup.string().required(t('prj_project_status_id')),
      prj_project_category_id: numberValidation(1, 200, true),
      //prj_project_budget_source_id: Yup.string().required(t('prj_project_budget_source_id')),
      //prj_total_estimate_budget: amountValidation(1000, 1000000000000, true),

      prj_total_actual_budget: amountValidation(1000, 1000000000000, false),
      //prj_geo_location: Yup.string().required(t('prj_geo_location')),
      //prj_sector_id: Yup.string().required(t("prj_sector_id")),
      prj_location_region_id: Yup.string().required(
        t("prj_location_region_id")
      ),
      prj_location_zone_id: Yup.string().required(t("prj_location_zone_id")),
      prj_location_woreda_id: Yup.string().required(
        t("prj_location_woreda_id")
      ),
      //prj_department_id: Yup.string().required(t("prj_department_id")),
      prj_urban_ben_number: numberValidation(10, 10000000, false),
      prj_rural_ben_number: numberValidation(10, 10000000, false),
      prj_location_description: alphanumericValidation(3, 425, false),
      //prj_outcome: alphanumericValidation(3, 425, true),
      prj_remark: alphanumericValidation(3, 425, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProject = {
          prj_id: project.prj_id,
          prj_name: values.prj_name,
          prj_name_am: values.prj_name_am,
          prj_name_en: values.prj_name_en,
          prj_code: values.prj_code,
          prj_project_status_id: values.prj_project_status_id,
          prj_project_category_id: values.prj_project_category_id,
          prj_project_budget_source_id: values.prj_project_budget_source_id,
          prj_total_estimate_budget: values.prj_total_estimate_budget,
          prj_total_actual_budget: values.prj_total_actual_budget,
          prj_geo_location: values.prj_geo_location,
          prj_sector_id: Number(selectedPage.data.pri_sector_id),
          prj_location_region_id: Number(values.prj_location_region_id),
          prj_location_zone_id: Number(values.prj_location_zone_id),
          prj_location_woreda_id: Number(values.prj_location_woreda_id),
          prj_location_kebele_id: values.prj_location_kebele_id,
          prj_location_description: values.prj_location_description,
          prj_owner_region_id: Number(selectedPage.data.pri_owner_region_id),
          prj_owner_zone_id: Number(selectedPage.data.pri_owner_zone_id),
          prj_owner_woreda_id: Number(selectedPage.data.pri_owner_woreda_id),
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
          //prj_department_id: Number(values.prj_department_id),
          prj_program_id: Number(selectedPage.data.pri_id),
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update Project
        handleUpdateProject(updateProject);
      } else {
        const newProject = {
          prj_name: values.prj_name,
          prj_name_am: values.prj_name_am,
          prj_name_en: values.prj_name_en,
          prj_code: values.prj_code,
          prj_project_status_id: values.prj_project_status_id,
          prj_project_category_id: values.prj_project_category_id,
          prj_project_budget_source_id: values.prj_project_budget_source_id,
          prj_total_estimate_budget: values.prj_total_estimate_budget,
          prj_total_actual_budget: values.prj_total_actual_budget,
          prj_geo_location: values.prj_geo_location,
          prj_sector_id: Number(selectedPage.data.pri_sector_id),
          prj_location_region_id: Number(values.prj_location_region_id),
          prj_location_zone_id: Number(values.prj_location_zone_id),
          prj_location_woreda_id: Number(values.prj_location_woreda_id),
          prj_location_kebele_id: values.prj_location_kebele_id,
          prj_location_description: values.prj_location_description,
          prj_owner_region_id: Number(selectedPage.data.pri_owner_region_id),
          prj_owner_zone_id: Number(selectedPage.data.pri_owner_zone_id),
          prj_owner_woreda_id: Number(selectedPage.data.pri_owner_woreda_id),
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
          //prj_department_id: Number(values.prj_department_id),
          prj_program_id: Number(selectedPage.data.pri_id)
        };
        // save new Project
        handleAddProject(newProject);
      }
    },
  });
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

  const [breadcrumb, setBreadcrumb] = useState([])
  const getBreadcrumbPath = (node) => {
    const breadcrumbArray = [];
    while (node && node.data) {
      breadcrumbArray.unshift(node.data);
      if (node.data.name === "oromia") break;
      node = node.parent;
    }
    setBreadcrumb((prev) =>
      JSON.stringify(prev) !== JSON.stringify(breadcrumbArray) ? breadcrumbArray : prev
    );
  };

  useEffect(() => {
    if (selectedNode) {
      getBreadcrumbPath(selectedNode);
    }
  }, [lang]);

  const levels = ["region", "zone", "woreda", "cluster", "sector", "program"];

  const handleNodeSelect = useCallback(
    (node) => {
      setSelectedNode(node)
      getBreadcrumbPath(node)
      setSelectedPage((prev) => {
        let newState = { ...prev };

        if (node.data?.level === "sector") {
          newState = { page: "program", data: node.data };
        } else if (node.data?.level === "program") {
          newState = { page: "project", data: node.data };
        } else {
          newState = { page: "", data: null }
        }

        return newState;
      });
      setSelectedLocations((prev) => {
        const newState = { ...prev };
        const selectedIndex = levels.indexOf(node?.data?.level);
        newState[node?.data?.level] = node.data?.id;
        levels.slice(selectedIndex + 1).forEach((level) => {
          newState[level] = null;
        });
        return newState;
      });

      if (showSearchResult) {
        setShowSearchResult(false);
      }
    },
    [showSearchResult, setShowSearchResult]
  );

  const handleClick = (data) => {
    setShowCanvas(!showCanvas);
    setProjectMetaData(data);
  };

  const handleProjectClick = (arg) => {
    const project = arg;
    setProject({
      prj_id: project.prj_id,
      prj_name: project.prj_name,
      prj_name_am: project.prj_name_am,
      prj_name_en: project.prj_name_en,
      prj_code: project.prj_code,
      prj_project_status_id: project.prj_project_status_id,
      prj_project_category_id: project.prj_project_category_id,
      prj_project_budget_source_id: project.prj_project_budget_source_id,
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
      //prj_department_id: project.prj_department_id,
      is_deletable: project.is_deletable,
      is_editable: project.is_editable,
    });
    setIsEdit(true);
    toggle();
  };
  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (project) => {
    setProject(project);
    setDeleteModal(true);
  };

  const handleProjectClicks = () => {
    setIsEdit(false);
    setProject("");
    toggle();
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: t("prj_name"),
        accessorKey: "prj_name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.footer ? t("Total") : cellProps.getValue()}
            </span>
          );
        },
      },
      {
        header: t("prj_code"),
        accessorKey: "prj_code",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.footer ? t("Total") : cellProps.getValue()}
            </span>
          );
        },
      },
      {
        header: t("zone_owner"),
        accessorKey: "add_name_or",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.footer ? t("Total") : cellProps.getValue()}
            </span>
          );
        },
      },
      {
        header: t("prs_status"),
        accessorKey: "bdr_request_status",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const badgeClass = cellProps.row.original.color_code;
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {cellProps.row.original.status_name}
            </Badge>
          );
        },
      },
      {
        header: t("prj_total_estimate_budget"),
        accessorKey: "prj_total_estimate_budget",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const value = cellProps.getValue();
          return (
            <span>
              {cellProps.row.original.footer
                ? value
                  ? `$${value.toLocaleString()}`
                  : ""
                : value
                  ? `${value.toLocaleString()}`
                  : ""}
            </span>
          );
        },
      },
      {
        header: t("view_details"),
        accessorKey: "view_details",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cellProps) => {
          if (cellProps.row.original.footer) {
            return "";
          }
          const { prj_id } = cellProps.row.original || {};
          return (
            <Link to={`/Projectdetail/${prj_id}#budget_request`} target="_blank" >
              <Button type="button" className="btn-sm mb-1 default" outline>
                <i className="fa fa-eye"></i>
              </Button>
            </Link>
          );
        },
      }
    ];
    if (
     data?.previledge?.is_role_editable==1 ||
     data?.previledge?.is_role_deletable==1
    ) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: t("Action"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              {(data?.previledge?.is_role_editable == 1 && cellProps.row.original?.is_editable == 1) && (
                  <Link
                    to="#"
                    className="text-success"
                    onClick={() => {
                      const data = cellProps.row.original;
                      handleProjectClick(data);
                    }}
                  >
                    <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                    <UncontrolledTooltip placement="top" target="edittooltip">
                      Edit
                    </UncontrolledTooltip>
                  </Link>
                )}
            </div>
          );
        },
      });
    }
    return baseColumns;
  }, [data, handleProjectClick, onClickDelete, t]);
  const getTranslatedName = (node) => {
    if (lang === "en" && node.add_name_en) return node.add_name_en;
    if (lang === "am" && node.add_name_am) return node.add_name_am;
    return node.name;
  };

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProject}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProject.isPending}
      />
      <div className="page-content">
        <div>
          <Breadcrumbs title={t("project")} breadcrumbItem={t("project")} />
          <div className="w-100 d-flex gap-2">
            <TreeForLists
              onNodeSelect={handleNodeSelect}
              setIsAddressLoading={setIsAddressLoading}
              setInclude={setInclude}
            />
            <div className="w-100">
              <Card className="w-100 d-flex">
                <CardBody>
                  {breadcrumb.map((node, index) => (
                    <span key={index} className="me-1">
                      {getTranslatedName(node)} {index < breadcrumb.length - 1 && <strong>{" > "}</strong>}
                    </span>
                  ))}
                </CardBody>
              </Card>
              {selectedPage.page === "project" ?
                <>
                  <div className="w-100">
                    <TableContainer
                      columns={columns}
                      data={data?.data || []}
                      isGlobalFilter={true}
                      isAddButton={data?.previledge?.is_role_can_add == 1}
                      isCustomPageSize={true}
                      handleUserClick={handleProjectClicks}
                      isPagination={true}
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("project")}
                      tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      pagination="pagination"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      excludeKey={["is_editable", "is_deletable"]} // will be used by export to excel and pdf components
                      tableName="Project Data" // will be used by export to excel and pdf components
                    />
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
                            return false;
                          }}
                        >
                          <Row>
                            <Col className="col-md-12 mb-3">
                              <CascadingDropdowns
                                validation={validation}
                                dropdown1name="prj_location_region_id"
                                dropdown2name="prj_location_zone_id"
                                dropdown3name="prj_location_woreda_id"
                                isEdit={isEdit}
                              />
                            </Col>
                            <Col className="col-md-12 mb-3">
                              <Label>{t("prj_location_description")}</Label>
                              <Input
                                name="prj_location_description"
                                type="textarea"
                                placeholder={t("prj_location_description")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={
                                  validation.values.prj_location_description || ""
                                }
                                invalid={
                                  validation.touched.prj_location_description &&
                                    validation.errors.prj_location_description
                                    ? true
                                    : false
                                }
                                maxLength={200}
                              />
                              {validation.touched.prj_location_description &&
                                validation.errors.prj_location_description ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_location_description}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <Label>
                                {t("prj_name")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="prj_name"
                                type="text"
                                placeholder={t("prj_name")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_name || ""}
                                invalid={
                                  validation.touched.prj_name &&
                                    validation.errors.prj_name
                                    ? true
                                    : false
                                }
                                maxLength={200}
                              />
                              {validation.touched.prj_name &&
                                validation.errors.prj_name ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_name}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <Label>
                                {t("prj_name_am")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="prj_name_am"
                                type="text"
                                placeholder={t("prj_name_am")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_name_am || ""}
                                invalid={
                                  validation.touched.prj_name_am &&
                                    validation.errors.prj_name_am
                                    ? true
                                    : false
                                }
                                maxLength={200}
                              />
                              {validation.touched.prj_name_am &&
                                validation.errors.prj_name_am ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_name_am}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <Label>
                                {t("prj_name_en")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="prj_name_en"
                                type="text"
                                placeholder={t("prj_name_en")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_name_en || ""}
                                invalid={
                                  validation.touched.prj_name_en &&
                                    validation.errors.prj_name_en
                                    ? true
                                    : false
                                }
                                maxLength={200}
                              />
                              {validation.touched.prj_name_en &&
                                validation.errors.prj_name_en ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_name_en}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <Label>
                                {t("prj_code")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="prj_code"
                                type="text"
                                placeholder={t("prj_code")}
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
                              <Label>
                                {t("prj_project_category_id")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                name="prj_project_category_id"
                                type="select"
                                className="form-select"
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={
                                  validation.values.prj_project_category_id || ""
                                }
                                invalid={
                                  validation.touched.prj_project_category_id &&
                                    validation.errors.prj_project_category_id
                                    ? true
                                    : false
                                }
                              >
                                <option value={null}>
                                  {t("prj_select_category")}
                                </option>
                                {lang === "en"
                                  ? projectCategoryOptionsEn.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {t(`${option.label}`)}
                                    </option>
                                  ))
                                  : lang === "am"
                                    ? projectCategoryOptionsAm.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {t(`${option.label}`)}
                                      </option>
                                    ))
                                    : projectCategoryOptionsOr.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {t(`${option.label}`)}
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
                              <Label>
                                {t("prj_total_estimate_budget")}
                                <span className="text-danger">*</span>
                              </Label>
                              <Input
                                minLength="3"
                                maxLength="12"
                                min="1"
                                step=".01"
                                name="prj_total_estimate_budget"
                                type="number"
                                placeholder={t("prj_total_estimate_budget")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={
                                  validation.values.prj_total_estimate_budget || ""
                                }
                                invalid={
                                  validation.touched.prj_total_estimate_budget &&
                                    validation.errors.prj_total_estimate_budget
                                    ? true
                                    : false
                                }
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
                                step=".01"
                                placeholder={t("prj_total_actual_budget")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={
                                  validation.values.prj_total_actual_budget || ""
                                }
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
                            <Col className="col-md-6 mb-3">
                              <Label>{t("prj_urban_ben_number")}</Label>
                              <Input
                                name="prj_urban_ben_number"
                                type="number"
                                placeholder={t("prj_urban_ben_number")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_urban_ben_number || ""}
                                invalid={
                                  validation.touched.prj_urban_ben_number &&
                                    validation.errors.prj_urban_ben_number
                                    ? true
                                    : false
                                }
                              />
                              {validation.touched.prj_urban_ben_number &&
                                validation.errors.prj_urban_ben_number ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_urban_ben_number}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-6 mb-3">
                              <Label>{t("prj_rural_ben_number")}</Label>
                              <Input
                                name="prj_rural_ben_number"
                                type="number"
                                placeholder={t("prj_rural_ben_number")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_rural_ben_number || ""}
                                invalid={
                                  validation.touched.prj_rural_ben_number &&
                                    validation.errors.prj_rural_ben_number
                                    ? true
                                    : false
                                }
                              />
                              {validation.touched.prj_rural_ben_number &&
                                validation.errors.prj_rural_ben_number ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_rural_ben_number}
                                </FormFeedback>
                              ) : null}
                            </Col>
                            <Col className="col-md-6 mb-3">
                              <Label>{t("prj_outcome")}</Label>
                              <Input
                                name="prj_outcome"
                                type="textarea"
                                placeholder={t("prj_outcome")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_outcome || ""}
                                invalid={
                                  validation.touched.prj_outcome &&
                                    validation.errors.prj_outcome
                                    ? true
                                    : false
                                }
                                maxLength={200}
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
                                placeholder={t("prj_remark")}
                                onChange={validation.handleChange}
                                onBlur={validation.handleBlur}
                                value={validation.values.prj_remark || ""}
                                invalid={
                                  validation.touched.prj_remark &&
                                    validation.errors.prj_remark
                                    ? true
                                    : false
                                }
                                maxLength={200}
                              />
                              {validation.touched.prj_remark &&
                                validation.errors.prj_remark ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.prj_remark}
                                </FormFeedback>
                              ) : null}
                            </Col>
                          </Row>
                          <Row>
                            <Col>
                              <div className="text-end">
                                {addProject.isPending || updateProject.isPending ? (
                                  <Button
                                    color="success"
                                    type="submit"
                                    className="save-user"
                                    disabled={
                                      addProject.isPending ||
                                      updateProject.isPending ||
                                      !validation.dirty
                                    }
                                  >
                                    <Spinner
                                      size={"sm"}
                                      color="light"
                                      className="me-2"
                                    />
                                    {t("Save")}
                                  </Button>
                                ) : (
                                  <Button
                                    color="success"
                                    type="submit"
                                    className="save-user"
                                    disabled={
                                      addProject.isPending ||
                                      updateProject.isPending ||
                                      !validation.dirty
                                    }
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
                </>
                :
                selectedPage.page === "program" ? <ProgramInfoModel node={selectedPage.data} />
                  : <div></div>}
            </div>
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
