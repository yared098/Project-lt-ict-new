import React, { useState, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Label,
  Input,
  InputGroup,
  FormGroup,
  Spinner,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Accordion,
  Table,
  UncontrolledTooltip,
} from "reactstrap";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useUpdateBudgetRequestApproval } from "../../queries/budget_request_query";
import { useFetchRequestStatuss } from "../../queries/requeststatus_query";
import { toast } from "react-toastify";
import { createSelectOptions } from "../../utils/commonMethods";
import { TabWrapper } from "../../components/Common/DetailViewWrapper";
import { Link } from "react-router-dom";
import ActionForm from "./ActionForm";
import { useFetchBudgetRequestAmounts } from "../../queries/budgetrequestamount_query";
import { useFetchProject } from "../../queries/project_query";
import TableContainer from "../../components/Common/TableContainer";
import { useFetchBudgetRequestTasks } from "../../queries/budgetrequesttask_query";
import { useFetchBudgetExSources } from "../../queries/budgetexsource_query";
import DatePicker from "../../components/Common/DatePicker";
import RequestFollowupModel from "../Requestfollowup";
import AssignCsoRequests from "./AssignCsoRequests";
import { convertToNumericValue } from "../../utils/commonMethods";
const modalStyle = {
  width: "100%",
};
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ApproverBudgetRequestListModal = (props) => {
  const { t } = useTranslation();
  const { isOpen, toggle, transaction, budgetYearMap = {} } = props;
  const { mutateAsync, isPending } = useUpdateBudgetRequestApproval();

  const { data: statusData } = useFetchRequestStatuss()
  const statusOptions = createSelectOptions(statusData?.data || [], "rqs_id", "rqs_name_en")
  const getStatusOption = (value) =>
    statusOptions.find((option) => option.value === value) || null;

  const projectId = transaction?.bdr_project_id;
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;
  const { data: project, isLoading: isProjectLoading } = useFetchProject(projectId, userId, isOpen);

  const handleUpdateBudgetRequest = async (data) => {
    try {
      await mutateAsync(data);
      toast.success(t("add_success"), {
        autoClose: 2000,
      });
    } catch (error) {
      toast.error(t("add_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
  };

  const validationSchema = Yup.object().shape({
    bdr_request_status: Yup.string().required("Status is required"),
    bdr_released_amount: Yup.number()
      .min(0, "Released amount must be greater or equal to 0")
      .max(
        transaction.bdr_requested_amount,
        "Can not release more than requested"
      )
      .when("bdr_request_status", {
        is: "Accepted",
        then: (schema) => schema.required("Released amount is required"),
        otherwise: (schema) => schema.optional(),
      }),
    bdr_released_date_gc: Yup.date().required("Action date is required"),
    bdr_action_remark: Yup.string().required("Action remark is required"),
  });

  const formik = useFormik({
    initialValues: {
      bdr_id: transaction.bdr_id || "",
      bdr_request_status: transaction.bdr_request_status || "",
      bdr_released_amount:
        transaction.bdr_request_status == 2
          ? transaction.bdr_released_amount || ""
          : "",
      bdr_released_date_gc: transaction.bdr_released_date_gc || "",
      bdr_action_remark: transaction.bdr_action_remark || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      handleUpdateBudgetRequest(values);
      formik.resetForm();
      toggle();
    },
  });

  const handleStatusChange = (selectedOption) => {
    formik.setFieldValue("bdr_request_status", selectedOption.value);
  };

  const tabs = [
    {
      id: "take_action",
      label: `${t("take_action")}`,
      content: (
        <Row>
          <Col xl={5}>
            <Card>
              <CardBody>
                <h5 className="fw-semibold">Overview</h5>
                <Table>
                  <tbody>
                    {[
                      [t("Year"), budgetYearMap[transaction.bdr_budget_year_id]],
                      [t("prj_total_estimate_budget"), project?.data?.prj_total_estimate_budget],
                      [t("prj_start_date_plan_gc"), project?.data?.prj_start_date_plan_gc],
                      [t("prj_end_date_plan_gc"), project?.data?.prj_end_date_plan_gc],
                      [t("bdr_requested_date_gc"), transaction.bdr_requested_date_gc],
                      [t("bdr_description"), transaction.bdr_description],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <th>{label}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
          <Col xl={7}>
            <Card>
              <CardBody>
                <CardTitle className="mb-4">Take Action</CardTitle>
                <form onSubmit={formik.handleSubmit}>
                  <FormGroup>
                    <Label>Status</Label>
                    <Select
                      name="bdr_request_status"
                      options={statusOptions}
                      value={getStatusOption(formik.values.bdr_request_status)}
                      onChange={handleStatusChange}
                      className="select2-selection"
                      invalid={
                        formik.touched.bdr_request_status &&
                          formik.errors.bdr_request_status
                          ? true
                          : false
                      }
                    />
                    {formik.errors.bdr_request_status &&
                      formik.touched.bdr_request_status && (
                        <div className="text-danger">
                          {formik.errors.bdr_request_status}
                        </div>
                      )}
                  </FormGroup>
                  <FormGroup>
                    <DatePicker
                      isRequired={true}
                      componentId={"bdr_released_date_gc"}
                      validation={formik}
                      minDate={transaction?.bdr_requested_date_gc}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Action Remark</Label>
                    <Input
                      type="textarea"
                      name="bdr_action_remark"
                      rows={4}
                      onChange={formik.handleChange}
                      value={formik.values.bdr_action_remark}
                      invalid={
                        formik.touched.bdr_action_remark &&
                          formik.errors.bdr_action_remark
                          ? true
                          : false
                      }
                    />
                    {formik.errors.bdr_action_remark &&
                      formik.touched.bdr_action_remark && (
                        <div className="text-danger">
                          {formik.errors.bdr_action_remark}
                        </div>
                      )}
                  </FormGroup>
                  {isPending ? (
                    <Button
                      type="submit"
                      color="primary"
                      className="w-md"
                      disabled
                    >
                      <span className="flex align-items-center justify-content-center">
                        <Spinner size={"sm"} />{" "}
                        <span className="ms-2">Submit</span>
                      </span>
                    </Button>
                  ) : (
                    <Button type="submit" color="primary" className="w-md">
                      Submit
                    </Button>
                  )}
                </form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: "request_followup",
      label: `${t("request_follow_up")}`,
      content: <RequestFollowupModel request={transaction} />
    },
    {
      id: "Assign",
      label: "Assign",
      content: <AssignCsoRequests request={transaction} isActive={isOpen} budgetYearMap={budgetYearMap} />
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      centered
      className="modal-xl"
      toggle={toggle}
      style={modalStyle}
    >
      <ModalHeader toggle={toggle}>{t("take_action")}</ModalHeader>
      <ModalBody>
        <TabWrapper tabs={tabs} />
      </ModalBody>
      <ModalFooter>
        <Button type="button" color="secondary" onClick={toggle}>
          {t("Close")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

ApproverBudgetRequestListModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  transaction: PropTypes.object,
  budgetYearMap: PropTypes.object,
};

export default ApproverBudgetRequestListModal;

const TakeActionForm = (props) => {
  const { t } = useTranslation();
  const { data } = props;
  const [open, setOpen] = useState();
  const [budgetRequestAmount, setBudgetRequestAmount] = useState();

  const [openActonForm, setOpenActionForm] = useState(false);
  const toggleActionFormModal = () => setOpenActionForm(!openActonForm);

  const toggleAcc = (id) => {
    if (open === id) {
      setOpen();
    } else {
      setOpen(id);
    }
  };

  const [subOpen, setSubOpen] = useState();
  const toggleSubAcc = (id) => {
    if (subOpen === id) {
      setSubOpen();
    } else {
      setSubOpen(id);
    }
  };

  const id = data?.bdr_id;
  const param = { budget_request_id: id };
  const brAmounts = useFetchBudgetRequestAmounts(param, open === "1");
  const brTasks = useFetchBudgetRequestTasks(param, open === "2");
  const brExSources = useFetchBudgetExSources(param, open === "3");

  const handleBudgetRequestAmountClick = (arg) => {
    const budgetRequestAmount = arg;
    setBudgetRequestAmount({
      bra_id: budgetRequestAmount.bra_id,
      bra_expenditure_code_id: budgetRequestAmount.bra_expenditure_code_id,
      bra_budget_request_id: budgetRequestAmount.bra_budget_request_id,
      bra_current_year_expense: budgetRequestAmount.bra_current_year_expense,
      bra_requested_amount: budgetRequestAmount.bra_requested_amount,
      bra_approved_amount: budgetRequestAmount.bra_approved_amount,
      bra_source_government_requested:
        budgetRequestAmount.bra_source_government_requested,
      bra_source_government_approved:
        budgetRequestAmount.bra_source_government_approved,
      bra_source_internal_requested:
        budgetRequestAmount.bra_source_internal_requested,
      bra_source_internal_approved:
        budgetRequestAmount.bra_source_internal_approved,
      bra_source_support_requested:
        budgetRequestAmount.bra_source_support_requested,
      bra_source_support_approved:
        budgetRequestAmount.bra_source_support_approved,
      bra_source_support_code: budgetRequestAmount.bra_source_support_code,
      bra_source_credit_requested:
        budgetRequestAmount.bra_source_credit_requested,
      bra_source_credit_approved:
        budgetRequestAmount.bra_source_credit_approved,
      bra_source_credit_code: budgetRequestAmount.bra_source_credit_code,
      bra_source_other_requested:
        budgetRequestAmount.bra_source_other_requested,
      bra_source_other_approved: budgetRequestAmount.bra_source_other_approved,
      bra_source_other_code: budgetRequestAmount.bra_source_other_code,
      bra_requested_date: budgetRequestAmount.bra_requested_date,
      bra_approved_date: budgetRequestAmount.bra_approved_date,
      bra_description: budgetRequestAmount.bra_description,
      bra_status: budgetRequestAmount.bra_status,
      is_deletable: budgetRequestAmount.is_deletable,
      is_editable: budgetRequestAmount.is_editable,
    });
    toggleActionFormModal();
  };

  const braColumns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "bra_expenditure_code_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_expenditure_code_id,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_current_year_expense",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_current_year_expense,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_requested_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bra_requested_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_approved_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bra_approved_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_government_requested",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_government_requested,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_government_approved",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_government_approved,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_internal_requested",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_internal_requested,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_internal_approved",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_internal_approved,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_support_requested",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_support_requested,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_support_approved",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_support_approved,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_support_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_support_code,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_credit_requested",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_credit_requested,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_credit_approved",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_credit_approved,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_source_credit_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.bra_source_credit_code,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_requested_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bra_requested_date, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bra_approved_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bra_approved_date, 30) ||
                "-"}
            </span>
          );
        },
      },
    ];
    if (
      brAmounts?.data?.previledge?.is_role_editable == 1 ||
      brAmounts?.data?.previledge?.is_role_deletable == 1
    ) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: t("Action"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              {cellProps.row.original.is_editable == 1 && (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => {
                    const data = cellProps.row.original;
                    handleBudgetRequestAmountClick(data);
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
  }, [brAmounts, handleBudgetRequestAmountClick]);

  const brTasksColumns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "brt_task_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.brt_task_name, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_measurement",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.brt_measurement, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_previous_year_physical",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_previous_year_physical,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_previous_year_financial",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_previous_year_financial,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_current_year_physical",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_current_year_physical,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_current_year_financial",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_current_year_financial,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_next_year_physical",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_next_year_physical,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "brt_next_year_financial",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.brt_next_year_financial,
                30
              ) || "-"}
            </span>
          );
        },
      },
    ];
    return baseColumns;
  }, []);

  const brExSourceColumns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "bes_organ_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bes_organ_code, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bes_org_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bes_org_name, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bes_support_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bes_support_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bes_credit_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bes_credit_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bes_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bes_description, 30) || "-"}
            </span>
          );
        },
      },
    ];

    return baseColumns;
  }, []);

  return (
    <>
      <ActionForm
        isOpen={openActonForm}
        toggle={toggleActionFormModal}
        amount={budgetRequestAmount}
      />
      <Row>
        <Col xl={12}>
          <Card>
            <CardBody>
              <CardTitle className="mb-4">Overview</CardTitle>
              <Col>
                <div className="mt-4">
                  <Accordion open={open} toggle={toggleAcc}>
                    <AccordionItem>
                      <AccordionHeader targetId="1">
                        Budget Request Amount
                      </AccordionHeader>
                      <AccordionBody accordionId="1">
                        <Accordion
                          flush
                          open={subOpen}
                          toggle={toggleSubAcc}
                        >
                          {brAmounts?.isLoading ? (
                            <div className="w-100 d-flex align-items-center justify-content-center">
                              <Spinner size={"sm"} color="primary" />
                            </div>
                          ) : (
                            <TableContainer
                              columns={braColumns}
                              data={brAmounts?.data?.data || []}
                              isGlobalFilter={true}
                              isCustomPageSize={true}
                              isPagination={true}
                              SearchPlaceholder={t("filter_placeholder")}
                              buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                              buttonName={t("add")}
                              tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                              theadClass="table-light"
                              pagination="pagination"
                              paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                            />
                          )}
                        </Accordion>
                      </AccordionBody>
                    </AccordionItem>
                    <AccordionItem>
                      <AccordionHeader targetId="2">
                        Budget Request Task
                      </AccordionHeader>
                      <AccordionBody accordionId="2">
                        {brTasks?.isLoading ? (
                          <div className="w-100 d-flex align-items-center justify-content-center">
                            <Spinner size={"sm"} color="primary" />
                          </div>
                        ) : (
                          <TableContainer
                            columns={brTasksColumns}
                            data={brTasks?.data?.data || []}
                            isGlobalFilter={true}
                            isCustomPageSize={true}
                            isPagination={true}
                            SearchPlaceholder={t("filter_placeholder")}
                            buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                            tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                            theadClass="table-light"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                          />
                        )}
                      </AccordionBody>
                    </AccordionItem>
                    <AccordionItem>
                      <AccordionHeader targetId="3">
                        Budget Request External Source
                      </AccordionHeader>
                      <AccordionBody accordionId="3">
                        {brExSources?.isLoading ? (
                          <div className="w-100 d-flex align-items-center justify-content-center">
                            <Spinner size={"sm"} color="primary" />
                          </div>
                        ) : (
                          <TableContainer
                            columns={brExSourceColumns}
                            data={brExSources?.data?.data || []}
                            isGlobalFilter={true}
                            isCustomPageSize={true}
                            isPagination={true}
                            SearchPlaceholder={t("filter_placeholder")}
                            buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                            tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                            theadClass="table-light"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                          />
                        )}
                      </AccordionBody>
                    </AccordionItem>
                  </Accordion>
                </div>
              </Col>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}