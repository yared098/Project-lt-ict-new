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

//import components
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";
import { alphanumericValidation,amountValidation,numberValidation } from '../../utils/Validation/validation';

import {
  useFetchStakeholderTypes,
  useSearchStakeholderTypes,
  useAddStakeholderType,
  useDeleteStakeholderType,
  useUpdateStakeholderType,
} from "../../queries/stakeholdertype_query";
import StakeholderTypeModal from "./StakeholderTypeModal";
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
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const StakeholderTypeModel = () => {
  //meta title
  document.title = " StakeholderType";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [stakeholderType, setStakeholderType] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchStakeholderTypes();

  const addStakeholderType = useAddStakeholderType();
  const updateStakeholderType = useUpdateStakeholderType();
  const deleteStakeholderType = useDeleteStakeholderType();
  //START CRUD
  const handleAddStakeholderType = async (data) => {
    try {
      await addStakeholderType.mutateAsync(data);
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

  const handleUpdateStakeholderType = async (data) => {
    try {
      await updateStakeholderType.mutateAsync(data);
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

  const handleDeleteStakeholderType = async () => {
    if (stakeholderType && stakeholderType.sht_id) {
      try {
        const id = stakeholderType.sht_id;
        await deleteStakeholderType.mutateAsync(id);
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
  //END CRUD
  //START FOREIGN CALLS

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,

    initialValues: {
      sht_type_name_or:
        (stakeholderType && stakeholderType.sht_type_name_or) || "",
      sht_type_name_am:
        (stakeholderType && stakeholderType.sht_type_name_am) || "",
      sht_type_name_en:
        (stakeholderType && stakeholderType.sht_type_name_en) || "",
      sht_description:
        (stakeholderType && stakeholderType.sht_description) || "",
      sht_status: (stakeholderType && stakeholderType.sht_status) || "",
      is_deletable: (stakeholderType && stakeholderType.is_deletable) || 1,
      is_editable: (stakeholderType && stakeholderType.is_editable) || 1,
    },

    validationSchema: Yup.object({
      sht_type_name_or: alphanumericValidation(2,100,true)
        .test("unique-sht_type_name_or", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.sht_type_name_or == value &&
              item.sht_id !== stakeholderType?.sht_id
          );
        }),
      sht_type_name_am: Yup.string().required(t("sht_type_name_am")),
      sht_type_name_en: alphanumericValidation(2,100,true),
      sht_description: alphanumericValidation(3,425,true),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateStakeholderType = {
          sht_id: stakeholderType?.sht_id,
          sht_type_name_or: values.sht_type_name_or,
          sht_type_name_am: values.sht_type_name_am,
          sht_type_name_en: values.sht_type_name_en,
          sht_description: values.sht_description,
          sht_status: values.sht_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update StakeholderType
        handleUpdateStakeholderType(updateStakeholderType);
      } else {
        const newStakeholderType = {
          sht_type_name_or: values.sht_type_name_or,
          sht_type_name_am: values.sht_type_name_am,
          sht_type_name_en: values.sht_type_name_en,
          sht_description: values.sht_description,
          sht_status: values.sht_status,
        };
        // save new StakeholderType
        handleAddStakeholderType(newStakeholderType);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch StakeholderType on component mount
  useEffect(() => {
    setStakeholderType(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setStakeholderType(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setStakeholderType(null);
    } else {
      setModal(true);
    }
  };

  const handleStakeholderTypeClick = (arg) => {
    const stakeholderType = arg;
    // console.log("handleStakeholderTypeClick", stakeholderType);
    setStakeholderType({
      sht_id: stakeholderType.sht_id,
      sht_type_name_or: stakeholderType.sht_type_name_or,
      sht_type_name_am: stakeholderType.sht_type_name_am,
      sht_type_name_en: stakeholderType.sht_type_name_en,
      sht_description: stakeholderType.sht_description,
      sht_status: stakeholderType.sht_status,
      is_deletable: stakeholderType.is_deletable,
      is_editable: stakeholderType.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (stakeholderType) => {
    setStakeholderType(stakeholderType);
    setDeleteModal(true);
  };

  const handleStakeholderTypeClicks = () => {
    setIsEdit(false);
    setStakeholderType("");
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
        accessorKey: "sht_type_name_or",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sht_type_name_or, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sht_type_name_am",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sht_type_name_am, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sht_type_name_en",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sht_type_name_en, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sht_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sht_description, 30) || "-"}
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
                    handleStakeholderTypeClick(data);
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
  }, [handleStakeholderTypeClick, toggleViewModal, onClickDelete]);
 if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <StakeholderTypeModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteStakeholderType}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteStakeholderType.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("stakeholder_type")}
            breadcrumbItem={t("stakeholder_type")}
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
                      isAddButton={data?.previledge?.is_role_can_add==1}
                      isCustomPageSize={true}
                      handleUserClick={handleStakeholderTypeClicks}
                      isPagination={true}
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("stakeholder_type")}
                      tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      pagination="pagination"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      divClassName="-"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("stakeholder_type")
                : t("add") + " " + t("stakeholder_type")}
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
                    <Label>{t("sht_type_name_or")}<span className="text-danger">*</span></Label>
                    <Input
                      name="sht_type_name_or"
                      type="text"
                      placeholder={t("sht_type_name_or")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sht_type_name_or || ""}
                      invalid={
                        validation.touched.sht_type_name_or &&
                        validation.errors.sht_type_name_or
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sht_type_name_or &&
                    validation.errors.sht_type_name_or ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sht_type_name_or}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sht_type_name_am")}<span className="text-danger">*</span></Label>
                    <Input
                      name="sht_type_name_am"
                      type="text"
                      placeholder={t("sht_type_name_am")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sht_type_name_am || ""}
                      invalid={
                        validation.touched.sht_type_name_am &&
                        validation.errors.sht_type_name_am
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sht_type_name_am &&
                    validation.errors.sht_type_name_am ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sht_type_name_am}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sht_type_name_en")}<span className="text-danger">*</span></Label>
                    <Input
                      name="sht_type_name_en"
                      type="text"
                      placeholder={t("sht_type_name_en")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sht_type_name_en || ""}
                      invalid={
                        validation.touched.sht_type_name_en &&
                        validation.errors.sht_type_name_en
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sht_type_name_en &&
                    validation.errors.sht_type_name_en ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sht_type_name_en}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sht_description")}</Label>
                    <Input
                      name="sht_description"
                      type="textarea"
                      placeholder={t("sht_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sht_description || ""}
                      invalid={
                        validation.touched.sht_description &&
                        validation.errors.sht_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.sht_description &&
                    validation.errors.sht_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sht_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addStakeholderType.isPending ||
                      updateStakeholderType.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addStakeholderType.isPending ||
                            updateStakeholderType.isPending ||
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
                            addStakeholderType.isPending ||
                            updateStakeholderType.isPending ||
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
StakeholderTypeModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default StakeholderTypeModel;
