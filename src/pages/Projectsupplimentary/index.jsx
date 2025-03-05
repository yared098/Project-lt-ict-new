import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";
import {
  useFetchProjectSupplimentarys,
  useSearchProjectSupplimentarys,
  useAddProjectSupplimentary,
  useDeleteProjectSupplimentary,
  useUpdateProjectSupplimentary,
} from "../../queries/projectsupplimentary_query";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
import { useTranslation } from "react-i18next";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";
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
  InputGroup,
  InputGroupText,
} from "reactstrap";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import DatePicker from "../../components/Common/DatePicker";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectSupplimentaryModel = (props) => {
  const { passedId, isActive, projectName, startDate } = props;
  const param = { prs_project_id: passedId };
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectSupplimentary, setProjectSupplimentary] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectSupplimentarys(param, isActive);
  const { data: budgetYearData } = usePopulateBudgetYears();
  const { data: bgYearsOptionsData } = useFetchBudgetYears();
  const addProjectSupplimentary = useAddProjectSupplimentary();
  const updateProjectSupplimentary = useUpdateProjectSupplimentary();
  const deleteProjectSupplimentary = useDeleteProjectSupplimentary();

  const budgetYearMap = useMemo(() => {
    return (
      bgYearsOptionsData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [bgYearsOptionsData]);
  //START CRUD
  const handleAddProjectSupplimentary = async (data) => {
    try {
      await addProjectSupplimentary.mutateAsync(data);
      toast.success(t("add_success"), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.success(t("add_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
  };

  const handleUpdateProjectSupplimentary = async (data) => {
    try {
      await updateProjectSupplimentary.mutateAsync(data);
      toast.success(t("update_success"), {
        autoClose: 2000,
      });
      validation.resetForm();
    } catch (error) {
      toast.success(t("update_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
  };
  const handleDeleteProjectSupplimentary = async () => {
    if (projectSupplimentary && projectSupplimentary.prs_id) {
      try {
        const id = projectSupplimentary.prs_id;
        await deleteProjectSupplimentary.mutateAsync(id);
        toast.success(t("delete_success"), {
          autoClose: 2000,
        });
      } catch (error) {
        toast.success(t("delete_failure"), {
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
      prs_requested_amount:
        (projectSupplimentary && projectSupplimentary.prs_requested_amount) ||
        "",
      prs_budget_year_id:
        (projectSupplimentary && projectSupplimentary.prs_requested_amount) ||
        "",
      prs_released_amount:
        (projectSupplimentary && projectSupplimentary.prs_released_amount) ||
        "",
      prs_project_id:
        (projectSupplimentary && projectSupplimentary.prs_project_id) || "",
      prs_requested_date_ec:
        (projectSupplimentary && projectSupplimentary.prs_requested_date_ec) ||
        "",
      prs_requested_date_gc:
        (projectSupplimentary && projectSupplimentary.prs_requested_date_gc) ||
        "",
      prs_released_date_ec:
        (projectSupplimentary && projectSupplimentary.prs_released_date_ec) ||
        "",
      prs_released_date_gc:
        (projectSupplimentary && projectSupplimentary.prs_released_date_gc) ||
        "",
      prs_description:
        (projectSupplimentary && projectSupplimentary.prs_description) || "",
      prs_status:
        (projectSupplimentary && projectSupplimentary.prs_status) || "",

      is_deletable:
        (projectSupplimentary && projectSupplimentary.is_deletable) || 1,
      is_editable:
        (projectSupplimentary && projectSupplimentary.is_editable) || 1,
    },

    validationSchema: Yup.object({
      prs_requested_amount: amountValidation(1000, 100000000, true),
      prs_released_amount: amountValidation(1000, 100000000, true),
      prs_budget_year_id: numberValidation(1, 20, true),
      //prs_project_id: Yup.string().required(t("prs_project_id")),
      //prs_requested_date_ec: Yup.string().required(t("prs_requested_date_ec")),
      prs_requested_date_gc: Yup.string().required(t("prs_requested_date_gc"))
        .test(
          'is-before-end-date',
          'request date must be earlier than or equal to the released date',
          function (value) {
            const { prs_released_date_gc } = this.parent; // Access other fields in the form
            return !prs_released_date_gc || !value || new Date(value) <= new Date(prs_released_date_gc);
          }),
      prs_released_date_gc: Yup.string()
        .required(t("prs_released_date_gc"))
        .test("unique-prj_name", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) =>
              item.prs_requested_date_gc == value &&
              item.prs_id !== projectSupplimentary?.prs_id
          );
        }),
      //prs_released_date_ec: Yup.string().required(t("prs_released_date_ec")),
      //prs_released_date_gc: Yup.string().required(t("prs_released_date_gc")),
      prs_description: alphanumericValidation(3, 425, false),
      //prs_status: Yup.string().required(t("prs_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectSupplimentary = {
          prs_id: projectSupplimentary?.prs_id,
          prs_budget_year_id: parseInt(values.prs_budget_year_id),
          prs_requested_amount: values.prs_requested_amount,
          prs_released_amount: values.prs_released_amount,
          // prs_project_id: values.prs_project_id,
          prs_requested_date_ec: values.prs_requested_date_ec,
          prs_requested_date_gc: values.prs_requested_date_gc,
          prs_released_date_ec: values.prs_released_date_ec,
          prs_released_date_gc: values.prs_released_date_gc,
          prs_description: values.prs_description,
          prs_status: values.prs_status,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectSupplimentary
        handleUpdateProjectSupplimentary(updateProjectSupplimentary);
      } else {
        const newProjectSupplimentary = {
          prs_budget_year_id: parseInt(values.prs_budget_year_id),
          prs_requested_amount: values.prs_requested_amount,
          prs_released_amount: values.prs_released_amount,
          prs_project_id: passedId,
          prs_requested_date_ec: values.prs_requested_date_ec,
          prs_requested_date_gc: values.prs_requested_date_gc,
          prs_released_date_ec: values.prs_released_date_ec,
          prs_released_date_gc: values.prs_released_date_gc,
          prs_description: values.prs_description,
          prs_status: values.prs_status,
        };
        // save new ProjectSupplimentary
        handleAddProjectSupplimentary(newProjectSupplimentary);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectSupplimentary on component mount
  useEffect(() => {
    setProjectSupplimentary(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectSupplimentary(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectSupplimentary(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectSupplimentaryClick = (arg) => {
    const projectSupplimentary = arg;
    setProjectSupplimentary({
      prs_id: projectSupplimentary.prs_id,
      prs_budget_year_id: projectSupplimentary.prs_budget_year_id,
      prs_requested_amount: projectSupplimentary.prs_requested_amount,
      prs_released_amount: projectSupplimentary.prs_released_amount,
      prs_project_id: projectSupplimentary.prs_project_id,
      prs_requested_date_ec: projectSupplimentary.prs_requested_date_ec,
      prs_requested_date_gc: projectSupplimentary.prs_requested_date_gc,
      prs_released_date_ec: projectSupplimentary.prs_released_date_ec,
      prs_released_date_gc: projectSupplimentary.prs_released_date_gc,
      prs_description: projectSupplimentary.prs_description,
      prs_status: projectSupplimentary.prs_status,
      is_deletable: projectSupplimentary.is_deletable,
      is_editable: projectSupplimentary.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectSupplimentary) => {
    setProjectSupplimentary(projectSupplimentary);
    setDeleteModal(true);
  };

  const handleProjectSupplimentaryClicks = () => {
    setIsEdit(false);
    setProjectSupplimentary("");
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
        accessorKey: "prs_requested_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prs_requested_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "budget_year_id",
        accessorKey: "prs_budget_year_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetYearMap[cellProps.row.original.prs_budget_year_id] || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prs_released_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prs_released_amount, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prs_requested_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prs_requested_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prs_released_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prs_released_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prs_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prs_description, 30) || "-"}
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
                      handleProjectSupplimentaryClick(data);
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
  }, [handleProjectSupplimentaryClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <DynamicDetailsModal
        projectName={projectName}
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t("project_supplimentary")}
        description={transaction.prs_description}
        fields={[
          { label: t("prs_requested_date_gc"), key: "prs_requested_date_gc" },
          { label: t("prs_released_date_gc"), key: "prs_released_date_gc" },
          { label: t("prs_requested_amount"), key: "prs_requested_amount" },
          { label: t("prs_released_amount"), key: "prs_released_amount" },
        ]}
        footerText={t("close")}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectSupplimentary}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectSupplimentary.isPending}
      />
      <>
        <div className="container-fluid1">
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
                      isAddButton={data?.previledge?.is_role_can_add == 1}
                      isCustomPageSize={true}
                      handleUserClick={handleProjectSupplimentaryClicks}
                      isPagination={true}
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add")}
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
                ? t("edit") + " " + t("project_supplimentary")
                : t("add") + " " + t("project_supplimentary")}
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
                    <Label>{t("prs_budget_year_id")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prs_budget_year_id"
                      type="select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prs_budget_year_id || ""}
                      invalid={
                        validation.touched.prs_budget_year_id &&
                          validation.errors.prs_budget_year_id
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
                    {validation.touched.prs_budget_year_id &&
                      validation.errors.prs_budget_year_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prs_budget_year_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("prs_requested_amount")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="prs_requested_amount"
                      type="number"
                      placeholder={t("prs_requested_amount")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prs_requested_amount || ""}
                      invalid={
                        validation.touched.prs_requested_amount &&
                          validation.errors.prs_requested_amount
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prs_requested_amount &&
                      validation.errors.prs_requested_amount ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prs_requested_amount}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("prs_released_amount")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="prs_released_amount"
                      type="number"
                      placeholder={t("prs_released_amount")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prs_released_amount || ""}
                      invalid={
                        validation.touched.prs_released_amount &&
                          validation.errors.prs_released_amount
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.prs_released_amount &&
                      validation.errors.prs_released_amount ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prs_released_amount}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired="true"
                      validation={validation}
                      componentId="prs_requested_date_gc"
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired="true"
                      validation={validation}
                      componentId="prs_released_date_gc"
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("prs_description")}</Label>
                    <Input
                      name="prs_description"
                      type="textarea"
                      placeholder={t("prs_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prs_description || ""}
                      invalid={
                        validation.touched.prs_description &&
                          validation.errors.prs_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.prs_description &&
                      validation.errors.prs_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prs_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectSupplimentary.isPending ||
                        updateProjectSupplimentary.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectSupplimentary.isPending ||
                            updateProjectSupplimentary.isPending ||
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
                            addProjectSupplimentary.isPending ||
                            updateProjectSupplimentary.isPending ||
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
ProjectSupplimentaryModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectSupplimentaryModel;
