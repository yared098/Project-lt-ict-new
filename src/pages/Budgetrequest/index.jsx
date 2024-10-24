import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
//import components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";

import {
  getBudgetRequest as onGetBudgetRequest,
  addBudgetRequest as onAddBudgetRequest,
  updateBudgetRequest as onUpdateBudgetRequest,
  deleteBudgetRequest as onDeleteBudgetRequest,
} from "../../store/budgetrequest/actions";
import { getBudgetYear } from "../../store/budgetyear/actions";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import BudgetRequestModal from "./BudgetRequestModal";
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
  FormGroup,
  InputGroup,
  Badge,
} from "reactstrap";
import { ToastContainer } from "react-toastify";
import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";
import { formatDate } from "../../utils/commonMethods";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const statusClasses = {
  Approved: "success",
  Rejected: "danger",
  Requested: "secondary",
};

const BudgetRequestModel = (props) => {
  //  get passed data from tab
  const { passedId } = props;
  //meta title
  document.title = " BudgetRequest";

  const { t } = useTranslation();

  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [budgetRequest, setBudgetRequest] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
  const [showSearchResults, setShowSearchResults] = useState(false); // To determine if search results should be displayed
  //START FOREIGN CALLS

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,

    initialValues: {
      bdr_budget_year_id:
        (budgetRequest && budgetRequest.bdr_budget_year_id) || "",
      bdr_requested_amount:
        (budgetRequest && budgetRequest.bdr_requested_amount) || "",

      bdr_project_id: passedId,
      bdr_requested_date_ec:
        (budgetRequest && budgetRequest.bdr_requested_date_ec) || "",
      bdr_requested_date_gc:
        (budgetRequest && budgetRequest.bdr_requested_date_gc) || "",

      bdr_description: (budgetRequest && budgetRequest.bdr_description) || "",
      bdr_status: (budgetRequest && budgetRequest.bdr_status) || "",
      bdr_request_status:
        (budgetRequest && budgetRequest.bdr_request_status) || "",

      is_deletable: (budgetRequest && budgetRequest.is_deletable) || 1,
      is_editable: (budgetRequest && budgetRequest.is_editable) || 1,
    },

    validationSchema: Yup.object({
      bdr_budget_year_id: Yup.string().required(t("bdr_budget_year_id")),
      bdr_requested_amount: Yup.number().required(t("bdr_requested_amount")),
      // bdr_released_amount: Yup.number().required(t("bdr_released_amount")),
      // bdr_project_id: Yup.string().required(t("bdr_project_id")),
      // bdr_requested_date_ec: Yup.string().required(t("bdr_requested_date_ec")),
      bdr_requested_date_gc: Yup.string().required(t("bdr_requested_date_gc")),
      // bdr_released_date_ec: Yup.string().required(t("bdr_released_date_ec")),
      // bdr_released_date_gc: Yup.string().required(t("bdr_released_date_gc")),
      bdr_description: Yup.string(),
      bdr_status: Yup.string(),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateBudgetRequest = {
          bdr_id: budgetRequest ? budgetRequest.bdr_id : 0,
          bdr_project_id: passedId,
          bdr_budget_year_id: values.bdr_budget_year_id,
          bdr_requested_amount: values.bdr_requested_amount,
          bdr_requested_date_ec: values.bdr_requested_date_ec,
          bdr_requested_date_gc: values.bdr_requested_date_gc,
          bdr_description: values.bdr_description,
          bdr_request_status: values.bdr_request_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update BudgetRequest
        dispatch(onUpdateBudgetRequest(updateBudgetRequest));
        validation.resetForm();
      } else {
        const newBudgetRequest = {
          bdr_budget_year_id: values.bdr_budget_year_id,
          bdr_project_id: passedId,
          bdr_requested_amount: values.bdr_requested_amount,
          bdr_requested_date_ec: values.bdr_requested_date_ec,
          bdr_requested_date_gc: values.bdr_requested_date_gc,
          bdr_description: values.bdr_description,
          bdr_request_status: "Requested",
        };
        // save new BudgetRequests
        dispatch(onAddBudgetRequest(newBudgetRequest));
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  const dispatch = useDispatch();
  // Fetch BudgetRequest on component mount
  useEffect(() => {
    dispatch(onGetBudgetRequest(passedId));
    dispatch(getBudgetYear());
  }, [dispatch]);

  const budgetRequestProperties = createSelector(
    (state) => state.BudgetRequestR, // this is geting from  reducer
    (BudgetRequestReducer) => ({
      // this is from Project.reducer
      budgetRequest: BudgetRequestReducer.budgetRequest,
      loading: BudgetRequestReducer.loading,
      update_loading: BudgetRequestReducer.update_loading,
    })
  );

  const {
    budgetRequest: { data, previledge },
    loading,
    update_loading,
  } = useSelector(budgetRequestProperties);

  const budgetYearProperties = createSelector(
    (state) => state.BudgetYearR, // this is geting from  reducer
    (BudgetYearReducer) => ({
      // this is from Project.reducer
      budgetYear: BudgetYearReducer.budgetYear,
      loading: BudgetYearReducer.loading,
      update_loading: BudgetYearReducer.update_loading,
    })
  );

  const {
    budgetYear: { data: budgetYearData, previledge: budgetYearPreviledge },
    loading: budgetYearLoading,
    update_loading: budgetYearUpdateLoading,
  } = useSelector(budgetYearProperties);

  const budgetYearMap = useMemo(() => {
    return budgetYearData.reduce((acc, year) => {
      acc[year.bdy_id] = year.bdy_name;
      return acc;
    }, {});
  }, [budgetYearData]);

  useEffect(() => {
    console.log("update_loading in useEffect", update_loading);
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
    setBudgetRequest(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setBudgetRequest(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setBudgetRequest(null);
    } else {
      setModal(true);
    }
  };

  const handleBudgetRequestClick = (arg) => {
    const budgetRequest = arg;
    // console.log("handleBudgetRequestClick", budgetRequest);
    setBudgetRequest({
      bdr_id: budgetRequest.bdr_id,
      bdr_budget_year_id: budgetRequest.bdr_budget_year_id,
      bdr_requested_amount: budgetRequest.bdr_requested_amount,
      bdr_project_id: budgetRequest.bdr_project_id,
      bdr_requested_date_ec: budgetRequest.bdr_requested_date_ec,
      bdr_requested_date_gc: budgetRequest.bdr_requested_date_gc,
      bdr_description: budgetRequest.bdr_description,
      bdr_request_status: budgetRequest.bdr_request_status,

      is_deletable: budgetRequest.is_deletable,
      is_editable: budgetRequest.is_editable,
    });

    setIsEdit(true);

    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (budgetRequest) => {
    setBudgetRequest(budgetRequest);
    setDeleteModal(true);
  };

  const handleDeleteBudgetRequest = () => {
    if (budgetRequest && budgetRequest.bdr_id) {
      dispatch(onDeleteBudgetRequest(budgetRequest.bdr_id));
      setDeleteModal(false);
    }
  };
  const handleBudgetRequestClicks = () => {
    setIsEdit(false);
    setBudgetRequest("");
    toggle();
  };
  const handleSearch = () => {
    setSearchLoading(true); // Set loading to true when search is initiated// Update filtered data with search results
    setShowSearchResults(true); // Show search results
    setSearchLoading(false);
  };

  const handleClearSearch = () => {
    setShowSearchResults(false);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "bdr_budget_year_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetYearMap[cellProps.row.original.bdr_budget_year_id] || ""}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bdr_requested_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bdr_requested_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bdr_released_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bdr_released_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bdr_requested_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bdr_requested_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "bdr_released_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.bdr_released_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        headerName: t("bdr_request_status"),
        accessorKey: "bdr_request_status",
        enableSorting: false,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const badgeClass =
            statusClasses[cellProps.row.original.bdr_request_status] ||
            "secondary";
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {cellProps.row.original.bdr_request_status}
            </Badge>
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
    if (previledge?.is_role_editable && previledge?.is_role_deletable) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: t("Action"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              {cellProps.row.original.is_editable && (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => {
                    const data = cellProps.row.original;
                    handleBudgetRequestClick(data);
                  }}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    Edit
                  </UncontrolledTooltip>
                </Link>
              )}

              {cellProps.row.original.is_deletable && (
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
  }, [handleBudgetRequestClick, toggleViewModal, onClickDelete]);

  return (
    <React.Fragment>
      <BudgetRequestModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBudgetRequest}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="container-fluid">
        {passedId ? null : (
          <Breadcrumbs
            title={t("budget_request")}
            breadcrumbItem={t("budget_request")}
          />
        )}
        {isLoading || searchLoading ? (
          <Spinners setLoading={setLoading} />
        ) : (
          <Row>
            <Col xs="12">
              <Card>
                <CardBody>
                  <TableContainer
                    columns={columns}
                    data={showSearchResults ? results : data}
                    isGlobalFilter={true}
                    isAddButton={true}
                    isCustomPageSize={true}
                    handleUserClick={handleBudgetRequestClicks}
                    isPagination={true}
                    // SearchPlaceholder="26 records..."
                    SearchPlaceholder={26 + " " + t("Results") + "..."}
                    buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                    buttonName={t("add") + " " + t("budget_request")}
                    tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                    theadClass="table-light"
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
        <Modal isOpen={modal} toggle={toggle} className="modal-xl">
          <ModalHeader toggle={toggle} tag="h4">
            {!!isEdit
              ? t("edit") + " " + t("budget_request")
              : t("add") + " " + t("budget_request")}
          </ModalHeader>
          <ModalBody>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                const modalCallback = () => setModal(false);
                if (isEdit) {
                  onUpdateBudgetRequest(validation.values, modalCallback);
                } else {
                  onAddBudgetRequest(validation.values, modalCallback);
                }
                return false;
              }}
            >
              <Row>
                <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_budget_year_id")}</Label>
                  <Input
                    name="bdr_budget_year_id"
                    type="select"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_budget_year_id || ""}
                    invalid={
                      validation.touched.bdr_budget_year_id &&
                      validation.errors.bdr_budget_year_id
                        ? true
                        : false
                    }
                    maxLength={20}
                  >
                    <option value="">Select Budget Year</option>
                    {budgetYearData?.map((data) => (
                      <option key={data.bdy_id} value={data.bdy_id}>
                        {data.bdy_name}
                      </option>
                    ))}
                  </Input>
                  {validation.touched.bdr_budget_year_id &&
                  validation.errors.bdr_budget_year_id ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_budget_year_id}
                    </FormFeedback>
                  ) : null}
                </Col>
                <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_requested_amount")}</Label>
                  <Input
                    name="bdr_requested_amount"
                    type="text"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_requested_amount || ""}
                    invalid={
                      validation.touched.bdr_requested_amount &&
                      validation.errors.bdr_requested_amount
                        ? true
                        : false
                    }
                    maxLength={20}
                  />
                  {validation.touched.bdr_requested_amount &&
                  validation.errors.bdr_requested_amount ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_requested_amount}
                    </FormFeedback>
                  ) : null}
                </Col>
                {/* <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_released_amount")}</Label>
                  <Input
                    name="bdr_released_amount"
                    type="text"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_released_amount || ""}
                    invalid={
                      validation.touched.bdr_released_amount &&
                      validation.errors.bdr_released_amount
                        ? true
                        : false
                    }
                    maxLength={20}
                  />
                  {validation.touched.bdr_released_amount &&
                  validation.errors.bdr_released_amount ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_released_amount}
                    </FormFeedback>
                  ) : null}
                </Col> */}

                <Col className="col-md-6 mb-3">
                  <FormGroup>
                    <Label>{t("bdr_requested_date_gc")}</Label>
                    <InputGroup>
                      <Flatpickr
                        id="DataPicker"
                        className={`form-control ${
                          validation.touched.bdr_requested_date_gc &&
                          validation.errors.bdr_requested_date_gc
                            ? "is-invalid"
                            : ""
                        }`}
                        name="bdr_requested_date_gc"
                        options={{
                          altInput: true,
                          altFormat: "Y/m/d",
                          dateFormat: "Y/m/d",
                          enableTime: false,
                        }}
                        value={validation.values.bdr_requested_date_gc || ""}
                        onChange={(date) => {
                          const formatedDate = formatDate(date[0]);
                          validation.setFieldValue(
                            "bdr_requested_date_gc",
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
                    {validation.touched.bdr_requested_date_gc &&
                    validation.errors.bdr_requested_date_gc ? (
                      <FormFeedback>
                        {validation.errors.bdr_requested_date_gc}
                      </FormFeedback>
                    ) : null}
                  </FormGroup>
                </Col>
                {/* <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_released_date_ec")}</Label>
                  <Input
                    name="bdr_released_date_ec"
                    type="text"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_released_date_ec || ""}
                    invalid={
                      validation.touched.bdr_released_date_ec &&
                      validation.errors.bdr_released_date_ec
                        ? true
                        : false
                    }
                    maxLength={20}
                  />
                  {validation.touched.bdr_released_date_ec &&
                  validation.errors.bdr_released_date_ec ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_released_date_ec}
                    </FormFeedback>
                  ) : null}
                </Col> */}
                {/* <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_released_date_gc")}</Label>
                  <Input
                    name="bdr_released_date_gc"
                    type="text"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_released_date_gc || ""}
                    invalid={
                      validation.touched.bdr_released_date_gc &&
                      validation.errors.bdr_released_date_gc
                        ? true
                        : false
                    }
                    maxLength={20}
                  />
                  {validation.touched.bdr_released_date_gc &&
                  validation.errors.bdr_released_date_gc ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_released_date_gc}
                    </FormFeedback>
                  ) : null}
                </Col> */}
                <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_description")}</Label>
                  <Input
                    name="bdr_description"
                    type="text"
                    placeholder={t("insert_status_name_amharic")}
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_description || ""}
                    invalid={
                      validation.touched.bdr_description &&
                      validation.errors.bdr_description
                        ? true
                        : false
                    }
                    maxLength={20}
                  />
                  {validation.touched.bdr_description &&
                  validation.errors.bdr_description ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_description}
                    </FormFeedback>
                  ) : null}
                </Col>
                {/* <Col className="col-md-6 mb-3">
                  <Label>{t("bdr_request_status")}</Label>
                  <Input
                    name="bdr_request_status"
                    type="select"
                    className="form-select"
                    onChange={(e) => {
                      validation.setFieldValue(
                        "bdr_request_status",
                        Number(e.target.value)
                      );
                    }}
                    onBlur={validation.handleBlur}
                    value={validation.values.bdr_request_status}
                  >
                    <option value={""}>Select status</option>
                    <option value={"Approved"}>{t("Approved")}</option>
                    <option value={"Rejected"}>{t("Rejected")}</option>
                  </Input>
                  {validation.touched.bdr_request_status &&
                  validation.errors.bdr_request_status ? (
                    <FormFeedback type="invalid">
                      {validation.errors.bdr_request_status}
                    </FormFeedback>
                  ) : null}
                </Col> */}
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
      {/* </div> */}
      <ToastContainer />
    </React.Fragment>
  );
};
BudgetRequestModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default BudgetRequestModel;
