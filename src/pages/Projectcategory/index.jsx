import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";

import {
  useFetchProjectCategorys,
  useSearchProjectCategorys,
  useAddProjectCategory,
  useDeleteProjectCategory,
  useUpdateProjectCategory,
} from "../../queries/projectcategory_query";
import ProjectCategoryModal from "./ProjectCategoryModal";
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
  Badge,
} from "reactstrap";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectCategoryModel = () => {
  //meta title
  document.title = " ProjectCategory";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectCategory, setProjectCategory] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectCategorys();

  const addProjectCategory = useAddProjectCategory();
  const updateProjectCategory = useUpdateProjectCategory();
  const deleteProjectCategory = useDeleteProjectCategory();
  //START CRUD
  const handleAddProjectCategory = async (data) => {
    try {
      await addProjectCategory.mutateAsync(data);
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

  const handleUpdateProjectCategory = async (data) => {
    try {
      await updateProjectCategory.mutateAsync(data);
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
  const handleDeleteProjectCategory = async () => {
    if (projectCategory && projectCategory.pct_id) {
      try {
        const id = projectCategory.pct_id;
        await deleteProjectCategory.mutateAsync(id);
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
  //END CRUD
  //START FOREIGN CALLS

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,

    initialValues: {
      pct_name_or: (projectCategory && projectCategory.pct_name_or) || "",
      pct_name_am: (projectCategory && projectCategory.pct_name_am) || "",
      pct_name_en: (projectCategory && projectCategory.pct_name_en) || "",
      pct_code: (projectCategory && projectCategory.pct_code) || "",
      pct_description:
        (projectCategory && projectCategory.pct_description) || "",
      pct_status: (projectCategory && projectCategory.pct_status) || false,
      is_deletable: (projectCategory && projectCategory.is_deletable) || 1,
      is_editable: (projectCategory && projectCategory.is_editable) || 1,
    },

    validationSchema: Yup.object({
      pct_name_or: alphanumericValidation(2, 100, true).test(
        "unique-pct_name_or",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) =>
              item.pct_name_or == value &&
              item.pct_id !== projectCategory?.pct_id
          );
        }
      ),
      pct_name_am: Yup.string().required(t("pct_name_am")),
      pct_name_en: alphanumericValidation(2, 100, true),
      pct_description: alphanumericValidation(3, 425, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectCategory = {
          pct_id: projectCategory?.pct_id,
          pct_name_or: values.pct_name_or,
          pct_name_am: values.pct_name_am,
          pct_name_en: values.pct_name_en,
          pct_code: values.pct_code,
          pct_description: values.pct_description,
          pct_status: values.pct_status ? 1 : 0,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectCategory
        handleUpdateProjectCategory(updateProjectCategory);
      } else {
        const newProjectCategory = {
          pct_name_or: values.pct_name_or,
          pct_name_am: values.pct_name_am,
          pct_name_en: values.pct_name_en,
          pct_code: values.pct_code,
          pct_description: values.pct_description,
          pct_status: values.pct_status ? 1 : 0,
        };
        // save new ProjectCategory
        handleAddProjectCategory(newProjectCategory);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectCategory on component mount
  useEffect(() => {
    setProjectCategory(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectCategory(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectCategory(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectCategoryClick = (arg) => {
    const projectCategory = arg;
    // console.log("handleProjectCategoryClick", projectCategory);
    setProjectCategory({
      pct_id: projectCategory.pct_id,
      pct_name_or: projectCategory.pct_name_or,
      pct_name_am: projectCategory.pct_name_am,
      pct_name_en: projectCategory.pct_name_en,
      pct_code: projectCategory.pct_code,
      pct_description: projectCategory.pct_description,
      pct_status: projectCategory.pct_status === 1,

      is_deletable: projectCategory.is_deletable,
      is_editable: projectCategory.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectCategory) => {
    setProjectCategory(projectCategory);
    setDeleteModal(true);
  };

  const handleProjectCategoryClicks = () => {
    setIsEdit(false);
    setProjectCategory("");
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
        accessorKey: "pct_name_or",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pct_name_or, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pct_name_am",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pct_name_am, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pct_name_en",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pct_name_en, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "pct_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pct_code, 30) || "-"}
            </span>
          );
        },
      },
     {
        header: t('is_deleted'),        
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span className={cellProps.row.original.pct_status === 1 ? "btn btn-sm btn-soft-danger" : ""}>
              {cellProps.row.original.pct_status == 1
                ? t("yes")
                : t("no")
              }
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
      data?.previledge?.is_role_editable == 1 ||
      data?.previledge?.is_role_deletable == 1
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
                    handleProjectCategoryClick(data);
                  }}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    Edit
                  </UncontrolledTooltip>
                </Link>
              )}

              {cellProps.row.original.is_deletable == 9 && (
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
  }, [handleProjectCategoryClick, toggleViewModal, onClickDelete]);
  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <ProjectCategoryModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectCategory}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectCategory.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("project_category")}
            breadcrumbItem={t("project_category")}
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
                      isAddButton={data?.previledge?.is_role_can_add == 1}
                      isCustomPageSize={true}
                      handleUserClick={handleProjectCategoryClicks}
                      isPagination={true}
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("project_category")}
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
                ? t("edit") + " " + t("project_category")
                : t("add") + " " + t("project_category")}
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
                      {t("pct_name_or")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="pct_name_or"
                      type="text"
                      placeholder={t("pct_name_or")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pct_name_or || ""}
                      invalid={
                        validation.touched.pct_name_or &&
                        validation.errors.pct_name_or
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.pct_name_or &&
                    validation.errors.pct_name_or ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pct_name_or}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("pct_name_am")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="pct_name_am"
                      type="text"
                      placeholder={t("pct_name_am")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pct_name_am || ""}
                      invalid={
                        validation.touched.pct_name_am &&
                        validation.errors.pct_name_am
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.pct_name_am &&
                    validation.errors.pct_name_am ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pct_name_am}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("pct_name_en")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="pct_name_en"
                      type="text"
                      placeholder={t("pct_name_en")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pct_name_en || ""}
                      invalid={
                        validation.touched.pct_name_en &&
                        validation.errors.pct_name_en
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.pct_name_en &&
                    validation.errors.pct_name_en ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pct_name_en}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("pct_code")}</Label>
                    <Input
                      name="pct_code"
                      type="text"
                      placeholder={t("pct_code")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pct_code || ""}
                      invalid={
                        validation.touched.pct_code &&
                        validation.errors.pct_code
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.pct_code &&
                    validation.errors.pct_code ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pct_code}
                      </FormFeedback>
                    ) : null}
                  </Col>
                   <Col className="col-md-6 mb-3">
                  <div className="form-check mb-4">
                      <Label className="me-1" for="pct_status">
                        {t("is_deleted")}
                      </Label>
                      <Input
                        id="pct_status"
                        name="pct_status"
                        type="checkbox"
                        placeholder={t("is_deleted")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        checked={validation.values.pct_status}
                        invalid={
                          validation.touched.pct_status &&
                          validation.errors.pct_status
                            ? true
                            : false
                        }
                      />
                      {validation.touched.pct_status &&
                      validation.errors.pct_status ? (
                        <FormFeedback type="invalid">
                          {validation.errors.pct_status}
                        </FormFeedback>
                      ) : null}
                      </div>
                    </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("pct_description")}</Label>
                    <Input
                      name="pct_description"
                      type="textarea"
                      placeholder={t("pct_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.pct_description || ""}
                      invalid={
                        validation.touched.pct_description &&
                        validation.errors.pct_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.pct_description &&
                    validation.errors.pct_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.pct_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectCategory.isPending ||
                      updateProjectCategory.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectCategory.isPending ||
                            updateProjectCategory.isPending ||
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
                            addProjectCategory.isPending ||
                            updateProjectCategory.isPending ||
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
ProjectCategoryModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectCategoryModel;
