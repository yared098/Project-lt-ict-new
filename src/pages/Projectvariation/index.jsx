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
  useFetchProjectVariations,
  useSearchProjectVariations,
  useAddProjectVariation,
  useDeleteProjectVariation,
  useUpdateProjectVariation,
} from "../../queries/projectvariation_query";
import ProjectVariationModal from "./ProjectVariationModal";
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
  InputGroup
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";
import { formatDate } from "../../utils/commonMethods";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectVariationModel = (props) => {
  document.title = " ProjectVariation";
  const { passedId, isActive } = props;
  const param = { prv_project_id: passedId };

  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectVariation, setProjectVariation] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectVariations(param, isActive);

  const addProjectVariation = useAddProjectVariation();
  const updateProjectVariation = useUpdateProjectVariation();
  const deleteProjectVariation = useDeleteProjectVariation();
  //START CRUD
  const handleAddProjectVariation = async (data) => {
    try {
      await addProjectVariation.mutateAsync(data);
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

  const handleUpdateProjectVariation = async (data) => {
    try {
      await updateProjectVariation.mutateAsync(data);
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
  const handleDeleteProjectVariation = async () => {
    if (projectVariation && projectVariation.prv_id) {
      try {
        const id = projectVariation.prv_id;
        await deleteProjectVariation.mutateAsync(id);
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
      prv_requested_amount:
        (projectVariation && projectVariation.prv_requested_amount) || "",
      prv_released_amount:
        (projectVariation && projectVariation.prv_released_amount) || "",
      prv_project_id:
        (projectVariation && projectVariation.prv_project_id) || "",
      prv_requested_date_ec:
        (projectVariation && projectVariation.prv_requested_date_ec) || "",
      prv_requested_date_gc:
        (projectVariation && projectVariation.prv_requested_date_gc) || "",
      prv_released_date_ec:
        (projectVariation && projectVariation.prv_released_date_ec) || "",
      prv_released_date_gc:
        (projectVariation && projectVariation.prv_released_date_gc) || "",
      prv_description:
        (projectVariation && projectVariation.prv_description) || "",
      prv_status: (projectVariation && projectVariation.prv_status) || "",

      is_deletable: (projectVariation && projectVariation.is_deletable) || 1,
      is_editable: (projectVariation && projectVariation.is_editable) || 1,
    },

    validationSchema: Yup.object({
      prv_requested_amount: Yup.string().required(t("prv_requested_amount")),
      //prv_released_amount: Yup.string().required(t("prv_released_amount")),
     // prv_project_id: Yup.string().required(t("prv_project_id")),
      //prv_requested_date_ec: Yup.string().required(t("prv_requested_date_ec")),
      prv_requested_date_gc: Yup.string().required(t("prv_requested_date_gc")),
     // prv_released_date_ec: Yup.string().required(t("prv_released_date_ec")),
      //prv_released_date_gc: Yup.string().required(t("prv_released_date_gc")),
      //prv_description: Yup.string().required(t("prv_description")),
      //prv_status: Yup.string().required(t("prv_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectVariation = {
          prv_id: projectVariation ? projectVariation.prv_id : 0,
          prv_requested_amount: values.prv_requested_amount,
          prv_released_amount: values.prv_released_amount,
          //prv_project_id: values.prv_project_id,
          prv_requested_date_ec: values.prv_requested_date_ec,
          prv_requested_date_gc: values.prv_requested_date_gc,
          prv_released_date_ec: values.prv_released_date_ec,
          prv_released_date_gc: values.prv_released_date_gc,
          prv_description: values.prv_description,
          prv_status: values.prv_status,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectVariation
        handleUpdateProjectVariation(updateProjectVariation);
        validation.resetForm();
      } else {
        const newProjectVariation = {
          prv_requested_amount: values.prv_requested_amount,
          prv_released_amount: values.prv_released_amount,
          prv_project_id: passedId,
          prv_requested_date_ec: values.prv_requested_date_ec,
          prv_requested_date_gc: values.prv_requested_date_gc,
          prv_released_date_ec: values.prv_released_date_ec,
          prv_released_date_gc: values.prv_released_date_gc,
          prv_description: values.prv_description,
          prv_status: values.prv_status,
        };
        // save new ProjectVariation
        handleAddProjectVariation(newProjectVariation);
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectVariation on component mount
  useEffect(() => {
    setProjectVariation(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectVariation(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectVariation(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectVariationClick = (arg) => {
    const projectVariation = arg;
    // console.log("handleProjectVariationClick", projectVariation);
    setProjectVariation({
      prv_id: projectVariation.prv_id,
      prv_requested_amount: projectVariation.prv_requested_amount,
      prv_released_amount: projectVariation.prv_released_amount,
      prv_project_id: projectVariation.prv_project_id,
      prv_requested_date_ec: projectVariation.prv_requested_date_ec,
      prv_requested_date_gc: projectVariation.prv_requested_date_gc,
      prv_released_date_ec: projectVariation.prv_released_date_ec,
      prv_released_date_gc: projectVariation.prv_released_date_gc,
      prv_description: projectVariation.prv_description,
      prv_status: projectVariation.prv_status,

      is_deletable: projectVariation.is_deletable,
      is_editable: projectVariation.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectVariation) => {
    setProjectVariation(projectVariation);
    setDeleteModal(true);
  };

  const handleProjectVariationClicks = () => {
    setIsEdit(false);
    setProjectVariation("");
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
        accessorKey: "prv_requested_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prv_requested_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prv_released_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prv_released_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prv_requested_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prv_requested_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prv_released_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prv_released_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prv_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prv_description, 30) || "-"}
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
              {(cellProps.row.original?.is_editable ||
                cellProps.row.original?.is_role_editable) && (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => {
                    const data = cellProps.row.original;
                    handleProjectVariationClick(data);
                  }}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    Edit
                  </UncontrolledTooltip>
                </Link>
              )}

              {(cellProps.row.original?.is_deletable ||
                cellProps.row.original?.is_role_deletable) && (
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
  }, [handleProjectVariationClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <ProjectVariationModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectVariation}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectVariation.isPending}
      />
      <>
        <div className="container-fluid1">
          {/* <Breadcrumbs
            title={t("project_variation")}
            breadcrumbItem={t("project_variation")}
          />
          <AdvancedSearch
            searchHook={useSearchProjectVariations}
            textSearchKeys={["dep_name_am", "dep_name_en", "dep_name_or"]}
            dropdownSearchKeys={[
              {
                key: "example",
                options: [
                  { value: "Freelance", label: "Example1" },
                  { value: "Full Time", label: "Example2" },
                  { value: "Part Time", label: "Example3" },
                  { value: "Internship", label: "Example4" },
                ],
              },
            ]}
            checkboxSearchKeys={[
              {
                key: "example1",
                options: [
                  { value: "Engineering", label: "Example1" },
                  { value: "Science", label: "Example2" },
                ],
              },
            ]}
            onSearchResult={handleSearchResults}
            setIsSearchLoading={setIsSearchLoading}
            setSearchResults={setSearchResults}
            setShowSearchResult={setShowSearchResult}
          /> */}
          {isLoading || isSearchLoading ? (
            <Spinners top={isActive ? "top-70" : ""} />
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
                      handleUserClick={handleProjectVariationClicks}
                      isPagination={true}
                      // SearchPlaceholder="26 records..."
                      SearchPlaceholder={26 + " " + t("Results") + "..."}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("project_variation")}
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
                ? t("edit") + " " + t("project_variation")
                : t("add") + " " + t("project_variation")}
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
                    <Label>{t("prv_requested_amount")}</Label>
                    <Input
                      name="prv_requested_amount"
                      type="number"
                      placeholder={t("prv_requested_amount")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prv_requested_amount || ""}
                      invalid={
                        validation.touched.prv_requested_amount &&
                        validation.errors.prv_requested_amount
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prv_requested_amount &&
                    validation.errors.prv_requested_amount ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prv_requested_amount}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prv_released_amount")}</Label>
                    <Input
                      name="prv_released_amount"
                      type="number"
                      placeholder={t("prv_released_amount")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prv_released_amount || ""}
                      invalid={
                        validation.touched.prv_released_amount &&
                        validation.errors.prv_released_amount
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prv_released_amount &&
                    validation.errors.prv_released_amount ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prv_released_amount}
                      </FormFeedback>
                    ) : null}
                  </Col>
                 <Col className="col-md-6 mb-3">
                    <FormGroup>
                      <Label>{t("prv_requested_date_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${validation.touched.prv_requested_date_gc &&
                              validation.errors.prv_requested_date_gc
                              ? "is-invalid"
                              : ""
                            }`}
                          name="prv_requested_date_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prv_requested_date_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prv_requested_date_gc",
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
                      {validation.touched.prv_requested_date_gc &&
                        validation.errors.prv_requested_date_gc ? (
                        <FormFeedback>
                          {validation.errors.prv_requested_date_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>
                   <Col className="col-md-6 mb-3">
                    <FormGroup>
                      <Label>{t("prv_released_date_gc")}</Label>
                      <InputGroup>
                        <Flatpickr
                          id="DataPicker"
                          className={`form-control ${validation.touched.prv_released_date_gc &&
                              validation.errors.prv_released_date_gc
                              ? "is-invalid"
                              : ""
                            }`}
                          name="prv_released_date_gc"
                          options={{
                            altInput: true,
                            altFormat: "Y/m/d",
                            dateFormat: "Y/m/d",
                            enableTime: false,
                          }}
                          value={validation.values.prv_released_date_gc || ""}
                          onChange={(date) => {
                            const formatedDate = formatDate(date[0]);
                            validation.setFieldValue(
                              "prv_released_date_gc",
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
                      {validation.touched.prv_released_date_gc &&
                        validation.errors.prv_released_date_gc ? (
                        <FormFeedback>
                          {validation.errors.prv_released_date_gc}
                        </FormFeedback>
                      ) : null}
                    </FormGroup>
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prv_description")}</Label>
                    <Input
                      name="prv_description"
                      type="textarea"
                      placeholder={t("prv_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prv_description || ""}
                      invalid={
                        validation.touched.prv_description &&
                        validation.errors.prv_description
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prv_description &&
                    validation.errors.prv_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prv_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectVariation.isPending ||
                      updateProjectVariation.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectVariation.isPending ||
                            updateProjectVariation.isPending ||
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
                            addProjectVariation.isPending ||
                            updateProjectVariation.isPending ||
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
    </React.Fragment>
  );
};
ProjectVariationModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectVariationModel;
