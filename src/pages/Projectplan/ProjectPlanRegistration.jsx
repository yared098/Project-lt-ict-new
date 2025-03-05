import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { isEmpty } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import DeleteModal from "../../components/Common/DeleteModal";
import GanttChart from "../GanttChart/index.jsx";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";
import {
  useFetchProjectPlans,
  useAddProjectPlan,
  useDeleteProjectPlan,
  useUpdateProjectPlan,
} from "../../queries/projectplan_query";
import { useFetchProject } from "../../queries/project_query";
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
  Card,
  CardBody,
} from "reactstrap";
import {
  alphanumericValidation,
  numberValidation,
} from "../../utils/Validation/validation";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import { createSelectOptions, formatDate } from "../../utils/commonMethods";
import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";
import { useFetchBudgetYears } from "../../queries/budgetyear_query";
import DatePicker from "../../components/Common/DatePicker";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectPlanModel = () => {
  const location = useLocation();
  const id = Number(location.pathname.split("/")[2]);
  const param = { pld_project_id: id };

  const { t, i18n } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [projectPlan, setProjectPlan] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [transaction, setTransaction] = useState({});
  const [projectPlanSelected, setProjectPlanSelected] = useState(null);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectPlans(param);
  const { data: budgetYearData } = useFetchBudgetYears();

  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;

  const project = useFetchProject(id, userId, true);
  const projectStartDate = project?.data?.data?.prj_start_date_gc || ""
  const projectStatusId = project?.data?.data?.prj_project_status_id || ""

  const addProjectPlan = useAddProjectPlan();
  const updateProjectPlan = useUpdateProjectPlan();
  const deleteProjectPlan = useDeleteProjectPlan();
  const budgetYearMap = useMemo(() => {
    return (
      budgetYearData?.data?.reduce((acc, budget_year) => {
        acc[budget_year.bdy_id] = budget_year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [budgetYearData]);
  //START CRUD
  const handleAddProjectPlan = async (data) => {
    try {
      await addProjectPlan.mutateAsync(data);
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

  const handleUpdateProjectPlan = async (data) => {
    try {
      await updateProjectPlan.mutateAsync(data);
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
  const handleDeleteProjectPlan = async () => {
    if (projectPlan && projectPlan.pld_id) {
      try {
        const id = projectPlan.pld_id;
        await deleteProjectPlan.mutateAsync(id);
        if (id === projectPlanSelected?.pld_id) {
          setProjectPlanSelected(null);
        }
        toast.success(t("delete_success"), {
          autoClose: 2000,
        });
      } catch (error) {
        toast.error(t("delete_failure"), {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      pld_name: (projectPlan && projectPlan.pld_name) || "",
      pld_project_id: (projectPlan && projectPlan.pld_id) || "",
      pld_budget_year_id: (projectPlan && projectPlan.pld_budget_year_id) || "",
      pld_start_date_ec: (projectPlan && projectPlan.pld_start_date_ec) || "",
      pld_start_date_gc: (projectPlan && projectPlan.pld_start_date_gc) || "",
      pld_end_date_ec: (projectPlan && projectPlan.pld_end_date_ec) || "",
      pld_end_date_gc: (projectPlan && projectPlan.pld_end_date_gc) || "",
      pld_description: (projectPlan && projectPlan.pld_description) || "",
      pld_status: (projectPlan && projectPlan.pld_status) || "",
      is_deletable: (projectPlan && projectPlan.is_deletable) || 1,
      is_editable: (projectPlan && projectPlan.is_editable) || 1,
    },

    validationSchema: Yup.object({
      pld_name: alphanumericValidation(3, 200, true),
      //pld_project_id: Yup.string().required(t("pld_project_id")),
      pld_budget_year_id: numberValidation(1, 20, true),
      //pld_start_date_ec: Yup.string().required(t("pld_start_date_ec")),
      pld_start_date_gc: Yup.string()
        .required(t("pld_start_date_gc"))
        .test(
          "is-before-end-date",
          "start date must be earlier than or equal to end date",
          function (value) {
            const { pld_end_date_gc } = this.parent; // Access other fields in the form
            return (
              !pld_end_date_gc ||
              !value ||
              new Date(value) <= new Date(pld_end_date_gc)
            );
          }
        ),
      pld_description: alphanumericValidation(3, 425, false),
      //pld_status: Yup.string().required(t("pld_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectPlan = {
          pld_id: projectPlan?.pld_id,
          pld_name: values.pld_name,
          pld_project_id: values.pld_project_id,
          pld_budget_year_id: Number(values.pld_budget_year_id),
          pld_start_date_ec: values.pld_start_date_ec,
          pld_start_date_gc: values.pld_start_date_gc,
          pld_end_date_ec: values.pld_end_date_ec,
          pld_end_date_gc: values.pld_end_date_gc,
          pld_description: values.pld_description,
          pld_status: values.pld_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectPlan
        handleUpdateProjectPlan(updateProjectPlan);
      } else {
        const newProjectPlan = {
          pld_name: values.pld_name,
          pld_project_id: id,
          pld_budget_year_id: Number(values.pld_budget_year_id),
          pld_start_date_ec: values.pld_start_date_ec,
          pld_start_date_gc: values.pld_start_date_gc,
          pld_end_date_ec: values.pld_end_date_ec,
          pld_end_date_gc: values.pld_end_date_gc,
          pld_description: values.pld_description,
          pld_status: values.pld_status,
        };
        // save new ProjectPlan
        handleAddProjectPlan(newProjectPlan);
      }
    },
  });

  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectPlan on component mount
  useEffect(() => {
    setProjectPlan(data?.data);
    if (projectPlanSelected) {
      const plan = data?.data.find(
        (plan) => plan.id === projectPlanSelected?.id
      );
      setProjectPlanSelected(plan);
    }
  }, [data?.data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectPlan(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectPlan(null);
    } else {
      setModal(true);
    }
  };

  const [rerenderKey, setRerenderKey] = useState(0);
  useEffect(() => {
    const handleLanguageChange = () => {
      setRerenderKey((prevState) => prevState + 1);
    };
    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n, t]);

  const handleProjectPlanClick = (arg) => {
    const projectPlan = arg;
    setProjectPlan({
      pld_id: projectPlan.pld_id,
      pld_name: projectPlan.pld_name,
      pld_project_id: projectPlan.pld_project_id,
      pld_budget_year_id: projectPlan.pld_budget_year_id,
      pld_start_date_ec: projectPlan.pld_start_date_ec,
      pld_start_date_gc: projectPlan.pld_start_date_gc,
      pld_end_date_ec: projectPlan.pld_end_date_ec,
      pld_end_date_gc: projectPlan.pld_end_date_gc,
      pld_description: projectPlan.pld_description,
      pld_status: projectPlan.pld_status,
      is_deletable: projectPlan.is_deletable,
      is_editable: projectPlan.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectPlan) => {
    setProjectPlan(projectPlan);
    setDeleteModal(true);
  };

  const handleProjectPlanClicks = () => {
    setIsEdit(false);
    setProjectPlan("");
    toggle();
  };

  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };

  //START UNCHANGED projectPlanSelected
  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "pld_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pld_name, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pld_budget_year_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetYearMap[cellProps.row.original.pld_budget_year_id] || ""}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pld_start_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pld_start_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pld_end_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pld_end_date_gc, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: t("view_detail"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <Button
              type="button"
              color="soft-primary"
              className="btn-sm"
              onClick={() => {
                const data = cellProps.row.original;
                toggleViewModal(data);
                setTransaction(cellProps.row.original);
              }}
            >
              {t("view_detail")}
            </Button>
          );
        },
      },
      {
        header: t("view_gannt"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <Button
              type="button"
              color="soft-primary"
              className="btn-sm"
              onClick={() => {
                setProjectPlanSelected(cellProps.row.original);
              }}
            >
              {t("view_gannt")} <i class="fa fa-arrow-down ml-2"></i>
            </Button>
          );
        },
      },
    ];
    if (
      data?.previledge?.is_role_editable &&
      data?.previledge?.is_role_deletable
    ) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: t("Action"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              {(data?.previledge?.is_role_editable == 1 && cellProps.row.original?.is_editable ==1) && (
                  <Link
                    className="text-success"
                    onClick={() => {
                      const data = cellProps.row.original;
                      handleProjectPlanClick(data);
                    }}
                  >
                    <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                    <UncontrolledTooltip placement="top" target="edittooltip">
                      Edit
                    </UncontrolledTooltip>
                  </Link>
                )}
{(data?.previledge?.is_role_deletable == 9 && cellProps.row.original?.is_deletable == 9) && (
                  <Link
                    to="#"
                    className="text-danger"
                    onClick={() => {
                      const data = cellProps.row.original;
                      onClickDelete(data);
                    }}
                  >
                    <i
                      className="mdi mdi-delete font-size-18"
                      id="deletetooltip"
                    />
                    <UncontrolledTooltip placement="top" target="deletetooltip">
                      Delete
                    </UncontrolledTooltip>
                  </Link>
                )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [handleProjectPlanClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t('project_payment')}
        description={transaction.pld_description}
        dateInEC={transaction.prp_payment_date_gc}
        dateInGC={transaction.prp_payment_date_gc}
        fields={[
          { label: t('pld_name'), key: "pld_name" },
          { label: t('pld_budget_year_id'), key: "prp_type", value: budgetYearMap[transaction.pld_budget_year_id] },
          { label: t('prp_payment_percentage'), key: "prp_payment_percentage" },
          { label: t('pld_start_date_gc'), key: "pld_start_date_gc" },
          { label: t('pld_end_date_gc'), key: "pld_end_date_gc" },
          { label: t('pld_create_time'), key: "pld_create_time" }
        ]}
        footerText={t('close')}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectPlan}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectPlan.isPending}
      />
      {isLoading || isSearchLoading || project.isLoading ? (
        <Spinners />
      ) : (
        <Row>

          {/* TableContainer for displaying data */}
          <Col lg={12}>
            <TableContainer
              columns={columns}
              data={
                showSearchResult
                  ? searchResults?.data
                  : data?.data || []
              }
              isGlobalFilter={true}
              isAddButton={data?.previledge?.is_role_can_add == 1}
              isCustomPageSize={true}
              handleUserClick={handleProjectPlanClicks}
              isPagination={true}
              SearchPlaceholder={t("filter_placeholder")}
              buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
              buttonName={`${t("add")}`}
              tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
              theadClass="table-light"
              pagination="pagination"
              paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
            />
          </Col>
          {projectPlanSelected && (
            <div className="w-100">
              <Card className="text-center my-3 py-2">
                <h3>
                  {t("view_gannt")} : {projectPlanSelected.pld_name}
                </h3>
              </Card>
              <Col lg={12}>
                <GanttChart
                  key={rerenderKey}
                  pld_id={projectPlanSelected.pld_id}
                  name={projectPlanSelected.pld_name}
                  startDate={projectPlanSelected.pld_start_date_gc}
                  endDate={projectPlanSelected.pld_end_date_gc}
                  projectStatusId={projectStatusId}
                />
              </Col>
            </div>
          )}
        </Row>
      )}
      <Modal isOpen={modal} toggle={toggle} className="modal-xl">
        <ModalHeader toggle={toggle} tag="h4">
          {!!isEdit
            ? t("edit") + " " + t("project_plan")
            : t("add") + " " + t("project_plan")}
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
              <Col className="col-md-6 mb-3">
                <Label>{t("pld_name")}</Label>
                <Input
                  name="pld_name"
                  type="text"
                  placeholder={t("pld_name")}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.pld_name || ""}
                  invalid={
                    validation.touched.pld_name &&
                      validation.errors.pld_name
                      ? true
                      : false
                  }
                  maxLength={200}
                />
                {validation.touched.pld_name &&
                  validation.errors.pld_name ? (
                  <FormFeedback type="invalid">
                    {validation.errors.pld_name}
                  </FormFeedback>
                ) : null}
              </Col>
              <Col className="col-md-6 mb-3">
                <Label>
                  {t("pld_budget_year_id")}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  name="pld_budget_year_id"
                  type="select"
                  className="form-select"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.pld_budget_year_id || ""}
                  invalid={
                    validation.touched.pld_budget_year_id &&
                      validation.errors.pld_budget_year_id
                      ? true
                      : false
                  }
                >
                  <option value={null}>{t("select_one")}</option>
                  {budgetYearData?.data?.map((data) => (
                    <option key={data.bdy_id} value={data.bdy_id}>
                      {data.bdy_name}
                    </option>
                  ))}
                </Input>
                {validation.touched.pld_budget_year_id &&
                  validation.errors.pld_budget_year_id ? (
                  <FormFeedback type="invalid">
                    {validation.errors.pld_budget_year_id}
                  </FormFeedback>
                ) : null}
              </Col>
              <Col className="col-md-6 mb-3">
                <DatePicker
                  isRequired="true"
                  validation={validation}
                  componentId="pld_start_date_gc"
                  minDate={projectStartDate}
                />
              </Col>
              <Col className="col-md-6 mb-3">
                <DatePicker
                  isRequired="true"
                  validation={validation}
                  componentId="pld_end_date_gc"
                  minDate={validation.values.pld_start_date_gc}
                />
              </Col>
              <Col className="col-md-6 mb-3">
                <Label>{t("pld_description")}</Label>
                <Input
                  name="pld_description"
                  type="textarea"
                  placeholder={t("pld_description")}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.pld_description || ""}
                  invalid={
                    validation.touched.pld_description &&
                      validation.errors.pld_description
                      ? true
                      : false
                  }
                  maxLength={425}
                />
                {validation.touched.pld_description &&
                  validation.errors.pld_description ? (
                  <FormFeedback type="invalid">
                    {validation.errors.pld_description}
                  </FormFeedback>
                ) : null}
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="text-end">
                  {addProjectPlan.isPending ||
                    updateProjectPlan.isPending ? (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={
                        addProjectPlan.isPending ||
                        updateProjectPlan.isPending ||
                        !validation.dirty
                      }
                    >
                      <Spinner size={"sm"} color="light" className="me-2" />
                      {t("Save")}
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={
                        addProjectPlan.isPending ||
                        updateProjectPlan.isPending ||
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
    </React.Fragment>
  );
};
ProjectPlanModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectPlanModel;
