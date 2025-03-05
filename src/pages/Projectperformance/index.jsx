import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  useFetchProjectPerformances,
  useSearchProjectPerformances,
  useAddProjectPerformance,
  useDeleteProjectPerformance,
  useUpdateProjectPerformance,
} from "../../queries/projectperformance_query";
import { useFetchProjectStatuss } from "../../queries/projectstatus_query";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
import { useFetchBudgetMonths } from "../../queries/budgetmonth_query";
import ProjectPerformanceModal from "./ProjectPerformanceModal";
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
} from "reactstrap";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";
import DatePicker from "../../components/Common/DatePicker";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectPerformanceModel = (props) => {
  const { passedId, isActive, startDate } = props;
  const param = { prp_project_id: passedId };
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectPerformance, setProjectPerformance] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectPerformances(param, isActive);
  const { data: budgetYearData } = usePopulateBudgetYears();
  const { data: bgYearsOptionsData } = useFetchBudgetYears();
  const { data: budgetMonthData } = useFetchBudgetMonths();
  const { data: projectStatusData } = useFetchProjectStatuss();
  const addProjectPerformance = useAddProjectPerformance();
  const updateProjectPerformance = useUpdateProjectPerformance();
  const deleteProjectPerformance = useDeleteProjectPerformance();

  //START CRUD
  const handleAddProjectPerformance = async (data) => {
    try {
      await addProjectPerformance.mutateAsync(data);
      toast.success(t('add_success'), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.error(t('add_failure'), {
        autoClose: 2000,
      });
    }
    toggle();
  };
  const handleUpdateProjectPerformance = async (data) => {
    try {
      await updateProjectPerformance.mutateAsync(data);
      toast.success(t('update_success'), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.error(t('update_failure'), {
        autoClose: 2000,
      });
    }
    toggle();
  };
  const handleDeleteProjectPerformance = async () => {
    if (projectPerformance && projectPerformance.prp_id) {
      try {
        const id = projectPerformance.prp_id;
        await deleteProjectPerformance.mutateAsync(id);
        toast.success(t('delete_success'), {
          autoClose: 2000,
        });
      } catch (error) {
        toast.error(t('delete_failure'), {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      prp_project_id:
        (projectPerformance && projectPerformance.prp_project_id) || "",
      prp_budget_year_id:
        (projectPerformance && projectPerformance.prp_budget_year_id) || "",
      prp_budget_month_id:
        (projectPerformance && projectPerformance.prp_budget_month_id) || "",
      prp_project_status_id:
        (projectPerformance && projectPerformance.prp_project_status_id) || "",
      prp_record_date_gc:
        (projectPerformance && projectPerformance.prp_record_date_gc) || "",
      prp_total_budget_used:
        (projectPerformance && projectPerformance.prp_total_budget_used) || "0",
      prp_physical_performance:
        (projectPerformance && projectPerformance.prp_physical_performance) || "0",
      prp_description:
        (projectPerformance && projectPerformance.prp_description) || "",
      prp_status: (projectPerformance && projectPerformance.prp_status) || "",
      is_deletable:
        (projectPerformance && projectPerformance.is_deletable) || 1,
      is_editable: (projectPerformance && projectPerformance.is_editable) || 1,
    },

    validationSchema: Yup.object({
      // prp_project_id: Yup.string().required(t('prp_project_id')),
      prp_project_status_id: numberValidation(1, 20, true)
        .test("unique-status-id", t("Status already exists for the selected budget"), function (value) {
          const { prp_budget_year_id, prp_budget_month_id } = this.parent;
          if (!data?.data) return true;
          return !data?.data.some(
            (item) =>
              item.prp_project_status_id === value &&
              item.prp_budget_year_id === prp_budget_year_id &&
              item.prp_budget_month_id === prp_budget_month_id &&
              item.prp_id !== projectPerformance.prp_id
          );
        }),
      prp_budget_year_id: numberValidation(1, 20, true),
      prp_budget_month_id: numberValidation(1, 20, true)
        .test("unique-month-id", t("Already exists."), function (value) {
          const { prp_budget_year_id } = this.parent;
          return !data?.data.some(
            (item) =>
              item.prp_budget_month_id == value && item.prp_budget_year_id == prp_budget_year_id && item.prp_id !== projectPerformance?.prp_id
          );
        }),
      //prp_record_date_ec: Yup.string().required(t('prp_record_date_ec')),
      prp_record_date_gc: Yup.date().required(t("val_required")).typeError("Invalid date format"),
      prp_total_budget_used: amountValidation(0, 10000000000, true),
      prp_physical_performance: amountValidation(0, 100, true),
      prp_description: alphanumericValidation(3, 425, false)
      // prp_status: Yup.string().required(t('prp_status')),
      //prp_created_date: Yup.string().required(t('prp_created_date')),
      //prp_termination_reason_id: Yup.string().required(t('prp_termination_reason_id')),
    }),
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectPerformance = {
          prp_id: projectPerformance?.prp_id,
          //prp_project_id: passedId,
          prp_project_status_id: parseInt(values.prp_project_status_id),
          prp_budget_month_id: parseInt(values.prp_budget_month_id),
          prp_budget_year_id: parseInt(values.prp_budget_year_id),
          //prp_record_date_ec: values.prp_record_date_ec,
          prp_record_date_gc: values.prp_record_date_gc,
          prp_total_budget_used: values.prp_total_budget_used,
          prp_physical_performance: values.prp_physical_performance,
          prp_description: values.prp_description,
          prp_status: 0,
          //prp_created_date: values.prp_created_date,
          //prp_termination_reason_id: values.prp_termination_reason_id,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectPerformance
        handleUpdateProjectPerformance(updateProjectPerformance);
      } else {
        const newProjectPerformance = {
          prp_project_id: passedId,
          prp_project_status_id: parseInt(values.prp_project_status_id),
          //prp_record_date_ec: values.prp_record_date_ec,
          prp_budget_month_id: parseInt(values.prp_budget_month_id),
          prp_budget_year_id: parseInt(values.prp_budget_year_id),
          prp_record_date_gc: values.prp_record_date_gc,
          prp_total_budget_used: values.prp_total_budget_used,
          prp_physical_performance: values.prp_physical_performance,
          prp_description: values.prp_description,
          prp_status: 0,
          //prp_created_date: 2024,
          //prp_termination_reason_id: values.prp_termination_reason_id,
        };
        // save new ProjectPerformance
        handleAddProjectPerformance(newProjectPerformance);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  const budgetYearMap = useMemo(() => {
    return (
      bgYearsOptionsData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [bgYearsOptionsData]);
  const projectStatusMap = useMemo(() => {
    return (
      projectStatusData?.data?.reduce((acc, project_status) => {
        acc[project_status.prs_id] = project_status.prs_status_name_or;
        return acc;
      }, {}) || {}
    );
  }, [projectStatusData]);

  const budgetMonthMap = useMemo(() => {
    return (
      budgetMonthData?.data?.reduce((acc, month) => {
        acc[month.bdm_id] = month.bdm_month;
        return acc;
      }, {}) || {}
    );
  }, [budgetMonthData]);

  // Fetch ProjectPerformance on component mount
  useEffect(() => {
    setProjectPerformance(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectPerformance(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectPerformance(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectPerformanceClick = (arg) => {
    const projectPerformance = arg;
    setProjectPerformance({
      prp_id: projectPerformance.prp_id,
      prp_project_id: projectPerformance.prp_project_id,
      prp_project_status_id: projectPerformance.prp_project_status_id,
      prp_record_date_ec: projectPerformance.prp_record_date_ec,
      prp_record_date_gc: projectPerformance.prp_record_date_gc,
      prp_total_budget_used: projectPerformance.prp_total_budget_used,
      prp_physical_performance: projectPerformance.prp_physical_performance,
      prp_description: projectPerformance.prp_description,
      prp_status: projectPerformance.prp_status,
      prp_created_date: projectPerformance.prp_created_date,
      prp_termination_reason_id: projectPerformance.prp_termination_reason_id,
      prp_budget_month_id: projectPerformance.prp_budget_month_id,
      prp_budget_year_id: projectPerformance.prp_budget_year_id,
      is_deletable: projectPerformance.is_deletable,
      is_editable: projectPerformance.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectPerformance) => {
    setProjectPerformance(projectPerformance);
    setDeleteModal(true);
  };

  const handleProjectPerformanceClicks = () => {
    setIsEdit(false);
    setProjectPerformance("");
    toggle();
  };
  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };
  //START UNCHANGED
  const columns = useMemo(() => {
    const baseColumns = [

      {
        header: "",
        accessorKey: "prp_budget_year_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetYearMap[cellProps.row.original.prp_budget_year_id] || ""}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_budget_month_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetMonthMap[cellProps.row.original.prp_budget_month_id] || ""}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_project_status_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {projectStatusMap[cellProps.row.original.prp_project_status_id] || ""}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_record_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prp_record_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_total_budget_used",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prp_total_budget_used, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_physical_performance",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.prp_physical_performance,
                30
              ) || "-"}
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
              color="primary"
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
                      handleProjectPerformanceClick(data);
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
  }, [handleProjectPerformanceClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <ProjectPerformanceModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
        budgetYearMap={budgetYearMap}
        budgetMonthMap={budgetMonthMap}
        projectStatusMap={projectStatusMap}
      />
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t('project_performance')}
        description={transaction.prp_description}
        dateInGC={transaction.prp_record_date_gc}
        fields={[
          { label: t('prp_budget_year_id'), key: "prp_budget_year_id", value: budgetYearMap[transaction.prp_budget_year_id] },
          { label: t('prp_budget_month_id'), key: "prp_budget_month_id", value: budgetMonthMap[transaction.prp_budget_month_id] },
          { label: t('prp_project_status_id'), key: "prp_project_status_id", value: projectStatusMap[transaction.prp_project_status_id] },
          { label: t('prp_total_budget_used'), key: "prp_total_budget_used" },
          { label: t('prp_physical_performance'), key: "prp_physical_performance" }
        ]}
        footerText={t('close')}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectPerformance}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectPerformance.isPending}
      />
      <div className="page-content1">
        <div className="container-fluid1">
          {isLoading || isSearchLoading ? (
            <Spinners top={isActive ? "top-70" : ""} />
          ) : (
            <TableContainer
              columns={columns}
              data={showSearchResult ? searchResults?.data : data?.data || []}
              isGlobalFilter={true}
              isAddButton={data?.previledge?.is_role_can_add == 1}
              isCustomPageSize={true}
              handleUserClick={handleProjectPerformanceClicks}
              isPagination={true}
              // SearchPlaceholder="26 records..."
              SearchPlaceholder={t("filter_placeholder")}
              buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
              buttonName={t("add")}
              tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
              theadClass="table-light"
              pagination="pagination"
              paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
            />
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("project_performance")
                : t("add") + " " + t("project_performance")}
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
                    <Label>{t("prp_budget_year_id")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prp_budget_year_id"
                      type="select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_budget_year_id || ""}
                      invalid={
                        validation.touched.prp_budget_year_id &&
                          validation.errors.prp_budget_year_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    >
                      <option value="">{t('select_one')}</option>
                      {budgetYearData?.data?.map((data) => (
                        <option key={data.bdy_id} value={data.bdy_id}>
                          {data.bdy_name}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prp_budget_year_id &&
                      validation.errors.prp_budget_year_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_budget_year_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prp_budget_month_id")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prp_budget_month_id"
                      type="select"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_budget_month_id || ""}
                      invalid={
                        validation.touched.prp_budget_month_id &&
                          validation.errors.prp_budget_month_id
                          ? true
                          : false
                      }
                      maxLength={20}
                    >
                      <option value="">{t('select_one')}</option>
                      {budgetMonthData?.data?.map((data) => (
                        <option key={data.bdm_id} value={data.bdm_id}>
                          {data.bdm_month}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prp_budget_month_id &&
                      validation.errors.prp_budget_month_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_budget_month_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("prp_project_status_id")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="prp_project_status_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_project_status_id || ""}
                      invalid={
                        validation.touched.prp_project_status_id &&
                          validation.errors.prp_project_status_id
                          ? true
                          : false
                      }
                    >
                      <option value="">{t('select_one')}</option>
                      {projectStatusData?.data?.map((data) => (
                        <option key={data.prs_id} value={data.prs_id}>
                          {data.prs_status_name_or}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prp_project_status_id &&
                      validation.errors.prp_project_status_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_project_status_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired="true"
                      validation={validation}
                      componentId="prp_record_date_gc"
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prp_total_budget_used")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prp_total_budget_used"
                      type="number"
                      placeholder={t("prp_total_budget_used")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_total_budget_used || ""}
                      invalid={
                        validation.touched.prp_total_budget_used &&
                          validation.errors.prp_total_budget_used
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prp_total_budget_used &&
                      validation.errors.prp_total_budget_used ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_total_budget_used}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prp_physical_performance")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prp_physical_performance"
                      type="number"
                      placeholder={t("prp_physical_performance")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_physical_performance || ""}
                      invalid={
                        validation.touched.prp_physical_performance &&
                          validation.errors.prp_physical_performance
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prp_physical_performance &&
                      validation.errors.prp_physical_performance ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_physical_performance}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-12 mb-3">
                    <Label>{t("prp_description")}</Label>
                    <Input
                      name="prp_description"
                      type="textarea"
                      rows={4}
                      placeholder={t("prp_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_description || ""}
                      invalid={
                        validation.touched.prp_description &&
                          validation.errors.prp_description
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prp_description &&
                      validation.errors.prp_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectPerformance.isPending ||
                        updateProjectPerformance.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectPerformance.isPending ||
                            updateProjectPerformance.isPending ||
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
                            addProjectPerformance.isPending ||
                            updateProjectPerformance.isPending ||
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
      </div>
    </React.Fragment>
  );
};
ProjectPerformanceModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectPerformanceModel;
