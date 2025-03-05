import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation, useParams } from "react-router-dom";
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
  useFetchBudgetRequests,
  useAddBudgetRequest,
  useUpdateBudgetRequest,
  useDeleteBudgetRequest,
} from "../../queries/budget_request_query";
import { useFetchProject } from "../../queries/project_query";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
import BudgetRequestModal from "./BudgetRequestModal";
import { useTranslation } from "react-i18next";
import BudgetRequestAmount from "../Budgetrequestamount/index";
import BudgetRequestTask from "../Budgetrequesttask/index";
import BudgetExSource from "../Budgetexsource/index";
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
  Badge,
} from "reactstrap";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import ProjectDetailColapse from "../Project/ProjectDetailColapse";
import RightOffCanvas from "../../components/Common/RightOffCanvas";
import ActionModal from "./ActionModal";
import AttachFileModal from "../../components/Common/AttachFileModal";
import ConvInfoModal from "../../pages/Conversationinformation/ConvInfoModal"
import {
  alphanumericValidation,
  formattedAmountValidation
} from "../../utils/Validation/validation";
import DatePicker from "../../components/Common/DatePicker";
import { PAGE_ID } from "../../constants/constantFile";
import FormattedAmountField from "../../components/Common/FormattedAmountField";
import { convertToNumericValue } from "../../utils/commonMethods";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const BudgetRequestModel = () => {
  const location = useLocation();
  const id = Number(location.pathname.split("/")[2]);
  const param = { project_id: id, request_type: "single" };
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [fileModal, setFileModal] = useState(false)
  const [convModal, setConvModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [budgetRequest, setBudgetRequest] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
  const [showSearchResults, setShowSearchResults] = useState(false); // To determine if search results should be displayed

  const [budgetRequestMetaData, setBudgetRequestMetaData] = useState([]);
  const [showCanvas, setShowCanvas] = useState(false);

  const { data, isLoading, isError, error, refetch } =
    useFetchBudgetRequests(param);
  const { data: budgetYearData } = usePopulateBudgetYears();
  const { data: bgYearsOptionsData } = useFetchBudgetYears();
  const addBudgetRequest = useAddBudgetRequest();
  const updateBudgetRequest = useUpdateBudgetRequest();
  const deleteBudgetRequest = useDeleteBudgetRequest();

  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;
  const project = useFetchProject(id, userId, true);

  const handleAddBudgetRequest = async (data) => {
    try {
      await addBudgetRequest.mutateAsync(data);
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

  const handleUpdateBudgetRequest = async (data) => {
    try {
      await updateBudgetRequest.mutateAsync(data);
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

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,
    initialValues: {
      bdr_budget_year_id:
        (budgetRequest && budgetRequest.bdr_budget_year_id) || "",
      bdr_requested_amount:
        (budgetRequest && budgetRequest.bdr_requested_amount) || "",
      bdr_project_id: id,
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
      bdr_requested_amount: formattedAmountValidation(1000, 10000000000, true),
      bdr_requested_date_gc: Yup.string().required(t("bdr_requested_date_gc")),
      bdr_description: alphanumericValidation(3, 425, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updatedBudgetRequest = {
          bdr_id: budgetRequest ? budgetRequest.bdr_id : 0,
          bdr_budget_year_id: parseInt(values.bdr_budget_year_id),
          bdr_requested_amount: convertToNumericValue(values.bdr_requested_amount),
          bdr_requested_date_ec: values.bdr_requested_date_ec,
          bdr_requested_date_gc: values.bdr_requested_date_gc,
          bdr_description: values.bdr_description,
          bdr_request_status: values.bdr_request_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        handleUpdateBudgetRequest(updatedBudgetRequest);
      } else {
        const newBudgetRequest = {
          bdr_budget_year_id: parseInt(values.bdr_budget_year_id),
          bdr_project_id: id,
          bdr_requested_amount: convertToNumericValue(values.bdr_requested_amount),
          bdr_requested_date_ec: values.bdr_requested_date_ec,
          bdr_requested_date_gc: values.bdr_requested_date_gc,
          bdr_description: values.bdr_description,
          bdr_request_status: 1,
        };
        handleAddBudgetRequest(newBudgetRequest);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  const toggleActionModal = () => setActionModal(!actionModal);
  const toggleFileModal = () => setFileModal(!fileModal);
  const toggleConvModal = () => setConvModal(!convModal);

  const budgetYearMap = useMemo(() => {
    return (
      bgYearsOptionsData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [bgYearsOptionsData]);

  useEffect(() => {
    setBudgetRequest(data?.data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setBudgetRequest(data?.data);
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
    setBudgetRequest({
      bdr_id: budgetRequest.bdr_id,
      bdr_budget_year_id: budgetRequest.bdr_budget_year_id,
      bdr_requested_amount: Number(budgetRequest.bdr_requested_amount).toLocaleString(),
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

  const handleDeleteBudgetRequest = async () => {
    if (budgetRequest && budgetRequest.bdr_id) {
      try {
        const id = budgetRequest.bdr_id;
        await deleteBudgetRequest.mutateAsync(id);
        toast.success(`Budget Request ${id} deleted successfully`, {
          autoClose: 2000,
        });
      } catch (error) {
        toast.error(`Failed to delete Budget Request ${budgetRequest.bdr_id}`, {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };

  const handleBudgetRequestClicks = () => {
    setIsEdit(false);
    setBudgetRequest("");
    toggle();
  };

  const handleClick = (data) => {
    setShowCanvas(!showCanvas);
    setBudgetRequestMetaData(data);
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
              {truncateText(Number(cellProps.row.original.bdr_requested_amount).toLocaleString(), 30) ||
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
              {truncateText(Number(cellProps.row.original.bdr_released_amount).toLocaleString(), 30) ||
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
          const badgeClass = cellProps.row.original.color_code;
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {cellProps.row.original.status_name}
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
                toggleViewModal();
                setTransaction(data);
              }}
            >
              {t("view_detail")}
            </Button>
          );
        },
      },
      {
        header: t("attach_files"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <Button
              outline
              type="button"
              color="success"
              className="btn-sm"
              onClick={() => {
                toggleFileModal();
                setTransaction(cellProps.row.original);
              }}
            >
              {t("attach_files")}
            </Button>
          );
        },
      },
      {
        header: t("Message"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <Button
              outline
              type="button"
              color="primary"
              className="btn-sm"
              onClick={() => {
                toggleConvModal();
                setTransaction(cellProps.row.original);
              }}
            >
              {t("Message")}
            </Button>
          );
        },
      },
    ];
    if (
      1 == 1
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
                  <Button
                    size="sm"
                    color="none"
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
                  </Button>
                )}
              {(data?.previledge?.is_role_deletable == 9 && cellProps.row.original?.is_deletable == 9) && (
                  <div>
                    <Button
                      size="sm"
                      color="none"
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
                    </Button>

                    <Button
                      size="sm"
                      color="none"
                      className="text-secondary me-2"
                      onClick={() => handleClick(cellProps.row.original)}
                    >
                      <i className="mdi mdi-cog font-size-18" id="viewtooltip" />
                      <UncontrolledTooltip placement="top" target="viewtooltip">
                        Budget Request Detail
                      </UncontrolledTooltip>
                    </Button>
                  </div>
                )}
            </div>
          );
        },
      });
    }
    if (project?.data?.request_role == "approver") {
      baseColumns.push({
        header: t("take_action"),
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
                toggleActionModal();
                setTransaction(data);
              }}
            >
              {t("take_action")}
            </Button>
          );
        },
      });
    }

    return baseColumns;
  }, [handleBudgetRequestClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <BudgetRequestModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <ActionModal
        isOpen={actionModal}
        toggle={toggleActionModal}
        data={transaction}
      />
      <AttachFileModal
        isOpen={fileModal}
        toggle={toggleFileModal}
        projectId={id}
        ownerTypeId={PAGE_ID.PROJ_BUDGET_REQUEST}
        ownerId={transaction?.bdr_id}
      />
      <ConvInfoModal
        isOpen={convModal}
        toggle={toggleConvModal}
        ownerTypeId={PAGE_ID.PROJ_BUDGET_REQUEST}
        ownerId={transaction?.bdr_id ?? null}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBudgetRequest}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteBudgetRequest.isPending}
      />
      {isLoading || isSearchLoading || project.isLoading ? (
        <Spinners />
      ) : (

        <TableContainer
          columns={columns}
          data={data?.data}
          isGlobalFilter={true}
          isAddButton={data?.previledge?.is_role_can_add == 1}
          isCustomPageSize={true}
          handleUserClick={handleBudgetRequestClicks}
          isPagination={true}
          SearchPlaceholder={t("filter_placeholder")}
          buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
          buttonName={t("add")}
          tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
          theadClass="table-light"
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
          infoIcon={true}
        />
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
              return false;
            }}
          >
            <Row>
              <Col className="col-md-6 mb-3">
                <Label>
                  {t("bdr_budget_year_id")}
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  name="bdr_budget_year_id"
                  type="select"
                  placeholder={t("bdr_budget_year_id")}
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
                  {budgetYearData?.data?.map((data) => (
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
                <FormattedAmountField
                  validation={validation}
                  fieldId={"bdr_requested_amount"}
                  isRequired={true}
                />
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
                <DatePicker
                  isRequired="true"
                  validation={validation}
                  componentId="bdr_requested_date_gc"
                />
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
                  type="textarea"
                  placeholder={t("bdr_description")}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.bdr_description || ""}
                  invalid={
                    validation.touched.bdr_description &&
                      validation.errors.bdr_description
                      ? true
                      : false
                  }
                  maxLength={200}
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
                  {addBudgetRequest.isPending ||
                    updateBudgetRequest.isPending ? (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={
                        addBudgetRequest.isPending ||
                        updateBudgetRequest.isPending ||
                        !validation.dirty
                      }
                    >
                      <Spinner size={"sm"} color="#fff" className="me-2" />
                      {t("Save")}
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={
                        addBudgetRequest.isPending ||
                        updateBudgetRequest.isPending ||
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
      {showCanvas && (
        <RightOffCanvas
          handleClick={handleClick}
          showCanvas={showCanvas}
          canvasWidth={84}
          name={t("budget_request")}
          id={budgetRequestMetaData.bdr_id}
          components={{
            [t("budget_request_amount")]: BudgetRequestAmount,
            [t("budget_request_task")]: BudgetRequestTask,
            [t("budget_ex_source")]: BudgetExSource,
          }}
        />
      )}
    </React.Fragment>
  );
};
BudgetRequestModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default BudgetRequestModel;
