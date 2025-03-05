import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  useFetchProjectPayments,
  useAddProjectPayment,
  useUpdateProjectPayment,
  useDeleteProjectPayment,
} from "../../queries/projectpayment_query";
import { useFetchPaymentCategorys } from "../../queries/paymentcategory_query";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";
import { useTranslation } from "react-i18next";
import DatePicker from "../../components/Common/DatePicker";
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
import { toast } from "react-toastify";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import { PAGE_ID } from "../../constants/constantFile";
import { useStatusCheck } from "../../hooks/useStatusCheck";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectPaymentModel = (props) => {
  const { passedId, isActive, status, startDate } = props;
  const param = { project_id: passedId };
  const { t } = useTranslation();

  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [projectPayment, setProjectPayment] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const performStatusCheck = useStatusCheck(PAGE_ID.PROJ_PAYMENT, status);
  const { data, isLoading, error, isError, refetch } = useFetchProjectPayments(
    param,
    isActive
  );
  const { data: budgetYearData } = usePopulateBudgetYears();
  const { data: bgYearsOptionsData } = useFetchBudgetYears();

  const addProjectPayment = useAddProjectPayment();
  const updateProjectPayment = useUpdateProjectPayment();
  const deleteProjectPayment = useDeleteProjectPayment();
  const { data: paymentCategoryData } = useFetchPaymentCategorys();

  const budgetYearMap = useMemo(() => {
    return (
      bgYearsOptionsData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [bgYearsOptionsData]);

  const handleAddProjectPayment = async (newProjectPayment) => {
    try {
      await addProjectPayment.mutateAsync(newProjectPayment);
      toast.success(t('add_success'), {
        autoClose: 2000,
      });
    } catch (error) {
      toast.error(t('add_failure'), {
        autoClose: 2000,
      });
    }
    toggle();
  };

  const handleUpdateProjectPayment = async (data) => {
    try {
      await updateProjectPayment.mutateAsync(data);
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

  const handleDeleteProjectPayment = async () => {
    if (projectPayment && projectPayment.prp_id) {
      try {
        const id = projectPayment.prp_id;
        await deleteProjectPayment.mutateAsync(id);
        toast.success(t('delete_success'), {
          autoClose: 2000,
        });
        validation.resetForm();
      } catch (error) {
        toast.error(t('delete_failure'), {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };
  const paymentCategoryMap = useMemo(() => {
    return (
      paymentCategoryData?.data?.reduce((acc, payment_category) => {
        acc[payment_category.pyc_id] = payment_category.pyc_name_or;
        return acc;
      }, {}) || {}
    );
  }, [paymentCategoryData]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      prp_project_id: passedId,
      prp_type: (projectPayment && projectPayment.prp_type) || "",
      prp_budget_year_id:
        (projectPayment && projectPayment.prp_budget_year_id) || "",
      prp_payment_date_et:
        (projectPayment && projectPayment.prp_payment_date_et) || "",
      prp_payment_date_gc:
        (projectPayment && projectPayment.prp_payment_date_gc) || "",
      prp_payment_amount:
        (projectPayment && projectPayment.prp_payment_amount) || "",
      prp_payment_percentage:
        (projectPayment && projectPayment.prp_payment_percentage) || "",
      prp_description: (projectPayment && projectPayment.prp_description) || "",
      prp_status: (projectPayment && projectPayment.prp_status) || "",

      is_deletable: (projectPayment && projectPayment.is_deletable) || 1,
      is_editable: (projectPayment && projectPayment.is_editable) || 1,
    },

    validationSchema: Yup.object({
      // prp_project_id: Yup.string().required(t("prp_project_id")),
      prp_type: numberValidation(1, 10, true)
        .test("unique-role-id", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.prp_type == value && item.prp_id !== projectPayment?.prp_id
          );
        }),
      prp_budget_year_id: numberValidation(1, 20, true),
      // prp_payment_date_et: Yup.string().required(t("prp_payment_date_et")),
      prp_payment_date_gc: Yup.string().required(t("prp_payment_date_gc")),
      prp_payment_amount: amountValidation(1, 10000000000, true),
      prp_payment_percentage: amountValidation(1, 100, true),
      prp_description: alphanumericValidation(3, 425, false)
      //prp_status: Yup.string().required(t("prp_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectPayment = {
          prp_id: projectPayment ? projectPayment.prp_id : 0,
          prp_project_id: values.prp_project_id,
          prp_budget_year_id: parseInt(values.prp_budget_year_id),
          prp_type: values.prp_type,
          prp_payment_date_et: values.prp_payment_date_et,
          prp_payment_date_gc: values.prp_payment_date_gc,
          prp_payment_amount: values.prp_payment_amount,
          prp_payment_percentage: values.prp_payment_percentage,
          prp_description: values.prp_description,
          prp_status: values.prp_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectPayment
        handleUpdateProjectPayment(updateProjectPayment);
      } else {
        const newProjectPayment = {
          prp_project_id: passedId,
          prp_type: values.prp_type,
          prp_budget_year_id: parseInt(values.prp_budget_year_id),
          prp_payment_date_et: values.prp_payment_date_et,
          prp_payment_date_gc: values.prp_payment_date_gc,
          prp_payment_amount: values.prp_payment_amount,
          prp_payment_percentage: values.prp_payment_percentage,
          prp_description: values.prp_description,
          prp_status: values.prp_status,
        };
        // save new ProjectPayments
        handleAddProjectPayment(newProjectPayment);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  useEffect(() => {
    setProjectPayment(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectPayment(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectPayment(null);
    } else {
      setModal(true);
    }
  };
  const handleProjectPaymentClick = (arg) => {
    if (!performStatusCheck()) return;
    const projectPayment = arg;
    setProjectPayment({
      prp_id: projectPayment.prp_id,
      prp_project_id: projectPayment.prp_project_id,
      prp_budget_year_id: projectPayment.prp_budget_year_id,
      prp_type: projectPayment.prp_type,
      prp_payment_date_et: projectPayment.prp_payment_date_et,
      prp_payment_date_gc: projectPayment.prp_payment_date_gc,
      prp_payment_amount: projectPayment.prp_payment_amount,
      prp_payment_percentage: projectPayment.prp_payment_percentage,
      prp_description: projectPayment.prp_description,
      prp_status: projectPayment.prp_status,
      is_deletable: projectPayment.is_deletable,
      is_editable: projectPayment.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectPayment) => {
    if (!performStatusCheck()) return;
    setProjectPayment(projectPayment);
    setDeleteModal(true);
  };
  const handleProjectPaymentClicks = () => {
    if (!performStatusCheck()) return;
    setIsEdit(false);
    setProjectPayment("");
    toggle();
  };

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
        accessorKey: "prp_type",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {paymentCategoryMap[cellProps.row.original.prp_type] || ""}
            </span>
          );
        },
      },

      {
        header: "",
        accessorKey: "prp_payment_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prp_payment_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_payment_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prp_payment_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prp_payment_percentage",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.prp_payment_percentage,
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
                    handleProjectPaymentClick(data);
                  }}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    {t("edit")}
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
  }, [handleProjectPaymentClick, toggleViewModal, onClickDelete]);

  if (isError) {
    <FetchErrorHandler error={error} refetch={refetch} />
  }

  return (
    <React.Fragment>
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t('project_payment')}
        description={transaction.prp_description}
        dateInEC={transaction.prp_payment_date_et}
        dateInGC={transaction.prp_payment_date_gc}
        fields={[
          { label: t('prp_type'), key: "prp_type", value: paymentCategoryMap[transaction.prp_type] },
          { label: t('prp_payment_amount'), key: "prp_payment_amount" },
          { label: t('prp_payment_percentage'), key: "prp_payment_percentage" },
          //{ label: t('prp_payment_percentage'), key: "prp_status" },
        ]}
        footerText={t('close')}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectPayment}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectPayment.isPending}
      />
      <div className={passedId ? "" : "page-content"}>
        <div className="container-fluid1">
          {passedId ? null : (
            <Breadcrumbs
              title={t("project_payment")}
              breadcrumbItem={t("project_payment")}
            />
          )}

          {isLoading || searchLoading ? (
            <Spinners top={"top-70"} />
          ) : (
            <TableContainer
              columns={columns}
              data={showSearchResults ? results : data?.data || []}
              isGlobalFilter={true}
              isAddButton={data?.previledge?.is_role_can_add == 1}
              isCustomPageSize={true}
              handleUserClick={handleProjectPaymentClicks}
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
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("project_payment")
                : t("add") + " " + t("project_payment")}
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
                    <Label>{t("prp_type")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prp_type"
                      type="select"
                      placeholder={t("insert_status_name_amharic")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_type || ""}
                      invalid={
                        validation.touched.prp_type &&
                          validation.errors.prp_type
                          ? true
                          : false
                      }
                      maxLength={20}
                    >
                      <option value="">{t('select_one')}</option>
                      {paymentCategoryData?.data?.map((data) => (
                        <option key={data.pyc_id} value={data.pyc_id}>
                          {data.pyc_name_or}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.prp_type &&
                      validation.errors.prp_type ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_type}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired="true"
                      validation={validation}
                      componentId="prp_payment_date_gc"
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("prp_payment_amount")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="prp_payment_amount"
                      type="number"
                      required="required"
                      placeholder={t("prp_payment_amount")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_payment_amount || ""}
                      invalid={
                        validation.touched.prp_payment_amount &&
                          validation.errors.prp_payment_amount
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prp_payment_amount &&
                      validation.errors.prp_payment_amount ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_payment_amount}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-6 mb-3">
                    <Label>{t("prp_payment_percentage")}</Label>
                    <div className="d-flex align-items-center">
                      <Input
                        name="prp_payment_percentage"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        onChange={(e) =>
                          validation.handleChange({
                            target: {
                              name: e.target.name,
                              value: e.target.value,
                            },
                          })
                        }
                        onBlur={validation.handleBlur}
                        value={validation.values.prp_payment_percentage || ""}
                        invalid={
                          validation.touched.prp_payment_percentage &&
                            validation.errors.prp_payment_percentage
                            ? true
                            : false
                        }
                        style={{ flex: 1 }}
                      />
                      <span className="ml-2">
                        {validation.values.prp_payment_percentage || "0"}%
                      </span>
                    </div>
                    {validation.touched.prp_payment_percentage &&
                      validation.errors.prp_payment_percentage ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_payment_percentage}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prp_description")}</Label>
                    <Input
                      name="prp_description"
                      type="textarea"
                      rows={3}
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
                    />
                    {validation.touched.prp_description &&
                      validation.errors.prp_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  {/* status */}
                  <Col className="col-md-6 mb-3" style={{ display: "none" }}>
                    <Label>{t("prp_status")}</Label>
                    <Input
                      name="prp_status"
                      type="select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prp_status || ""}
                      invalid={
                        validation.touched.prp_status &&
                          validation.errors.prp_status
                          ? true
                          : false
                      }
                    >
                      <option value="">Select Status</option>
                      <option value="0">{t("inactive")}</option>
                      <option value="1">{t("active")}</option>
                    </Input>
                    {validation.touched.prp_status &&
                      validation.errors.prp_status ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prp_status}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectPayment.isPending ||
                        updateProjectPayment.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectPayment.isPending ||
                            updateProjectPayment.isPending ||
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
                            addProjectPayment.isPending ||
                            updateProjectPayment.isPending ||
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
ProjectPaymentModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectPaymentModel;
