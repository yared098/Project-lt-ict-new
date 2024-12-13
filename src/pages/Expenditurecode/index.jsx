import React, { useEffect, useMemo, useState } from "react";
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
import SearchComponent from "../../components/Common/SearchComponent";
//import components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";

import {
  useFetchExpenditureCodes,
  useSearchExpenditureCodes,
  useAddExpenditureCode,
  useDeleteExpenditureCode,
  useUpdateExpenditureCode,
} from "../../queries/expenditurecode_query";
import ExpenditureCodeModal from "./ExpenditureCodeModal";
import { useTranslation } from "react-i18next";

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ExpenditureCodeModel = () => {
  //meta title
  document.title = " ExpenditureCode";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [expenditureCode, setExpenditureCode] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchExpenditureCodes();

  const addExpenditureCode = useAddExpenditureCode();
  const updateExpenditureCode = useUpdateExpenditureCode();
  const deleteExpenditureCode = useDeleteExpenditureCode();
  //START CRUD
  const handleAddExpenditureCode = async (data) => {
    try {
      await addExpenditureCode.mutateAsync(data);
      toast.success(`Data added successfully`, {
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Failed to add data", {
        autoClose: 2000,
      });
    }
    toggle();
  };

  const handleUpdateExpenditureCode = async (data) => {
    try {
      await updateExpenditureCode.mutateAsync(data);
      toast.success(`data updated successfully`, {
        autoClose: 2000,
      });
    } catch (error) {
      toast.error(`Failed to update Data`, {
        autoClose: 2000,
      });
    }
    toggle();
  };
  const handleDeleteExpenditureCode = async () => {
    if (expenditureCode && expenditureCode.pec_id) {
      try {
        const id = expenditureCode.pec_id;
        await deleteExpenditureCode.mutateAsync(id);
        toast.success(`Data deleted successfully`, {
          autoClose: 2000,
        });
      } catch (error) {
        toast.error(`Failed to delete Data`, {
          autoClose: 2000,
        });
      }
      setDeleteModal(false);
    }
  };
  //END CRUD
  //START FOREIGN CALLS

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,

    initialValues: {
      pec_name: (expenditureCode && expenditureCode.pec_name) || "",
      pec_code: (expenditureCode && expenditureCode.pec_code) || "",
      pec_status: (expenditureCode && expenditureCode.pec_status) || "",
      pec_description:
        (expenditureCode && expenditureCode.pec_description) || "",
      is_deletable: (expenditureCode && expenditureCode.is_deletable) || 1,
      is_editable: (expenditureCode && expenditureCode.is_editable) || 1,
    },

    validationSchema: Yup.object({
      pec_name: Yup.string()
        .required(t("pec_name"))
        .test("unique-pec_name", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.pec_name == value && item.pec_id !== expenditureCode?.pec_id
          );
        }),
      pec_code: Yup.string()
        .required(t("pec_code"))
        .test("unique-pec_code", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.pec_code == value && item.pec_id !== expenditureCode?.pec_id
          );
        }),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateExpenditureCode = {
          pec_id: expenditureCode?.pec_id,
          pec_name: values.pec_name,
          pec_code: values.pec_code,
          pec_status: values.pec_status,
          pec_description: values.pec_description,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ExpenditureCode
        handleUpdateExpenditureCode(updateExpenditureCode);
        validation.resetForm();
      } else {
        const newExpenditureCode = {
          pec_name: values.pec_name,
          pec_code: values.pec_code,
          pec_status: values.pec_status,
          pec_description: values.pec_description,
        };
        // save new ExpenditureCode
        handleAddExpenditureCode(newExpenditureCode);
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ExpenditureCode on component mount
  useEffect(() => {
    setExpenditureCode(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setExpenditureCode(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setExpenditureCode(null);
    } else {
      setModal(true);
    }
  };

  const handleExpenditureCodeClick = (arg) => {
    const expenditureCode = arg;
    // console.log("handleExpenditureCodeClick", expenditureCode);
    setExpenditureCode({
      pec_id: expenditureCode.pec_id,
      pec_name: expenditureCode.pec_name,
      pec_code: expenditureCode.pec_code,
      pec_status: expenditureCode.pec_status,
      pec_description: expenditureCode.pec_description,
      pec_created_date: expenditureCode.pec_created_date,

      is_deletable: expenditureCode.is_deletable,
      is_editable: expenditureCode.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (expenditureCode) => {
    setExpenditureCode(expenditureCode);
    setDeleteModal(true);
  };

  const handleExpenditureCodeClicks = () => {
    setIsEdit(false);
    setExpenditureCode("");
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
        accessorKey: "pec_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pec_name, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pec_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pec_code, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pec_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pec_description, 30) || "-"}
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
              {cellProps.row.original.is_editable && (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => {
                    const data = cellProps.row.original;
                    handleExpenditureCodeClick(data);
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
  }, [handleExpenditureCodeClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <ExpenditureCodeModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteExpenditureCode}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteExpenditureCode.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("expenditure_code")}
            breadcrumbItem={t("expenditure_code")}
          />
          <AdvancedSearch
            searchHook={useSearchExpenditureCodes}
            textSearchKeys={["pec_name", "pec_code"]}
            dropdownSearchKeys={[]}
            checkboxSearchKeys={[]}
            onSearchResult={handleSearchResults}
            setIsSearchLoading={setIsSearchLoading}
            setSearchResults={setSearchResults}
            setShowSearchResult={setShowSearchResult}
          />
          {isLoading || isSearchLoading ? (
            <Spinners />
          ) : (
            <Row>
              <Col xs="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={
                        showSearchResult
                          ? searchResults?.data
                          : data?.data || []
                      }
                      isGlobalFilter={true}
                      isAddButton={true}
                      isCustomPageSize={true}
                      handleUserClick={handleExpenditureCodeClicks}
                      isPagination={true}
                      // SearchPlaceholder="26 records..."
                      SearchPlaceholder={26 + " " + t("Results") + "..."}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("expenditure_code")}
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
                ? t("edit") + " " + t("expenditure_code")
                : t("add") + " " + t("expenditure_code")}
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
                    <Label>{t("pec_name")}</Label>
                    <Input
                      name="pec_name"
                      type="text"
                      placeholder={t("pec_name")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pec_name || ""}
                      invalid={
                        validation.touched.pec_name &&
                        validation.errors.pec_name
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.pec_name &&
                    validation.errors.pec_name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pec_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("pec_code")}</Label>
                    <Input
                      name="pec_code"
                      type="text"
                      placeholder={t("pec_code")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pec_code || ""}
                      invalid={
                        validation.touched.pec_code &&
                        validation.errors.pec_code
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.pec_code &&
                    validation.errors.pec_code ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pec_code}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("pec_description")}</Label>
                    <Input
                      name="pec_description"
                      type="textarea"
                      placeholder={t("pec_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pec_description || ""}
                      invalid={
                        validation.touched.pec_description &&
                        validation.errors.pec_description
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.pec_description &&
                    validation.errors.pec_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pec_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addExpenditureCode.isPending ||
                      updateExpenditureCode.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addExpenditureCode.isPending ||
                            updateExpenditureCode.isPending ||
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
                            addExpenditureCode.isPending ||
                            updateExpenditureCode.isPending ||
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
ExpenditureCodeModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ExpenditureCodeModel;
