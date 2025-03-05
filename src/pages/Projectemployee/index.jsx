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
  phoneValidation
} from "../../utils/Validation/validation";
import {
  useFetchProjectEmployees,
  useSearchProjectEmployees,
  useAddProjectEmployee,
  useDeleteProjectEmployee,
  useUpdateProjectEmployee,
} from "../../queries/projectemployee_query";
import ProjectEmployeeModal from "./ProjectEmployeeModal";
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
  InputGroup,
InputGroupText
} from "reactstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import DatePicker from "../../components/Common/DatePicker";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectEmployeeModel = (props) => {
  const { passedId, isActive, startDate } = props;
  const param = { emp_project_id: passedId };

  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectEmployee, setProjectEmployee] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } = useFetchProjectEmployees(
    param,
    isActive
  );

  const addProjectEmployee = useAddProjectEmployee();
  const updateProjectEmployee = useUpdateProjectEmployee();
  const deleteProjectEmployee = useDeleteProjectEmployee();
  //START CRUD
  const handleAddProjectEmployee = async (data) => {
    try {
      await addProjectEmployee.mutateAsync(data);
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

  const handleUpdateProjectEmployee = async (data) => {
    try {
      await updateProjectEmployee.mutateAsync(data);
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
  const handleDeleteProjectEmployee = async () => {
    if (projectEmployee && projectEmployee.emp_id) {
      try {
        const id = projectEmployee.emp_id;
        await deleteProjectEmployee.mutateAsync(id);
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
  // validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      emp_id_no: (projectEmployee && projectEmployee.emp_id_no) || "",
      emp_full_name: (projectEmployee && projectEmployee.emp_full_name) || "",
      emp_email: (projectEmployee && projectEmployee.emp_email) || "",
      emp_phone_num: (projectEmployee && projectEmployee.emp_phone_num) || "",
      emp_role: (projectEmployee && projectEmployee.emp_role) || "",
      emp_project_id: (projectEmployee && projectEmployee.emp_project_id) || "",
      emp_start_date_ec:
        (projectEmployee && projectEmployee.emp_start_date_ec) || "",
      emp_start_date_gc:
        (projectEmployee && projectEmployee.emp_start_date_gc) || "",
      emp_end_date_ec:
        (projectEmployee && projectEmployee.emp_end_date_ec) || "",
      emp_end_date_gc:
        (projectEmployee && projectEmployee.emp_end_date_gc) || "",
      emp_address: (projectEmployee && projectEmployee.emp_address) || "",
      emp_description:
        (projectEmployee && projectEmployee.emp_description) || "",
      emp_current_status:
        (projectEmployee && projectEmployee.emp_current_status) || "",
      is_deletable: (projectEmployee && projectEmployee.is_deletable) || 1,
      is_editable: (projectEmployee && projectEmployee.is_editable) || 1,
    },
    validationSchema: Yup.object({
      emp_id_no: alphanumericValidation(3, 10, true).test(
        "unique-role-id",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) =>
              item.emp_id_no == value && item.emp_id !== projectEmployee?.emp_id
          );
        }
      ),
      emp_full_name: alphanumericValidation(3, 200, true),
      emp_email: alphanumericValidation(5, 50, false).email(
        "ivalid email address"
      ),
      emp_phone_num: phoneValidation(true),
      emp_role: alphanumericValidation(3, 425, true),
      //emp_project_id: Yup.string().required(t("emp_project_id")),
      //emp_start_date_ec: Yup.string().required(t("emp_start_date_ec")),
      emp_start_date_gc: Yup.string().required(t("emp_start_date_gc"))
        .test(
          'is-before-end-date',
          'start date must be earlier than or equal to end date',
          function (value) {
            const { emp_end_date_gc } = this.parent; // Access other fields in the form
            return !emp_end_date_gc || !value || new Date(value) <= new Date(emp_end_date_gc);
          }),
      // emp_end_date_ec: Yup.string().required(t("emp_end_date_ec")),
      //emp_end_date_gc: Yup.string().required(t("emp_end_date_gc")),
      emp_address: alphanumericValidation(3, 425, false),
      emp_description: alphanumericValidation(3, 425, false),
      //emp_current_status: Yup.string().required(t("emp_current_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectEmployee = {
          emp_id: projectEmployee?.emp_id,
          emp_id_no: values.emp_id_no,
          emp_full_name: values.emp_full_name,
          emp_email: values.emp_email,
          emp_phone_num: values.emp_phone_num,
          emp_role: values.emp_role,
          //emp_project_id: values.emp_project_id,
          emp_start_date_ec: values.emp_start_date_ec,
          emp_start_date_gc: values.emp_start_date_gc,
          emp_end_date_ec: values.emp_end_date_ec,
          emp_end_date_gc: values.emp_end_date_gc,
          emp_address: values.emp_address,
          emp_description: values.emp_description,
          emp_current_status: values.emp_current_status,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectEmployee
        handleUpdateProjectEmployee(updateProjectEmployee);
      } else {
        const newProjectEmployee = {
          emp_id_no: values.emp_id_no,
          emp_full_name: values.emp_full_name,
          emp_email: values.emp_email,
          emp_phone_num: values.emp_phone_num,
          emp_role: values.emp_role,
          emp_project_id: passedId,
          emp_start_date_ec: values.emp_start_date_ec,
          emp_start_date_gc: values.emp_start_date_gc,
          emp_end_date_ec: values.emp_end_date_ec,
          emp_end_date_gc: values.emp_end_date_gc,
          emp_address: values.emp_address,
          emp_description: values.emp_description,
          emp_current_status: values.emp_current_status,
        };
        // save new ProjectEmployee
        handleAddProjectEmployee(newProjectEmployee);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  useEffect(() => {
    setProjectEmployee(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectEmployee(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectEmployee(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectEmployeeClick = (arg) => {
    const projectEmployee = arg;
    // console.log("handleProjectEmployeeClick", projectEmployee);
    setProjectEmployee({
      emp_id: projectEmployee.emp_id,
      emp_id_no: projectEmployee.emp_id_no,
      emp_full_name: projectEmployee.emp_full_name,
      emp_email: projectEmployee.emp_email,
      emp_phone_num: projectEmployee.emp_phone_num,
      emp_role: projectEmployee.emp_role,
      emp_project_id: projectEmployee.emp_project_id,
      emp_start_date_ec: projectEmployee.emp_start_date_ec,
      emp_start_date_gc: projectEmployee.emp_start_date_gc,
      emp_end_date_ec: projectEmployee.emp_end_date_ec,
      emp_end_date_gc: projectEmployee.emp_end_date_gc,
      emp_address: projectEmployee.emp_address,
      emp_description: projectEmployee.emp_description,
      emp_current_status: projectEmployee.emp_current_status,
      is_deletable: projectEmployee.is_deletable,
      is_editable: projectEmployee.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectEmployee) => {
    setProjectEmployee(projectEmployee);
    setDeleteModal(true);
  };

  const handleProjectEmployeeClicks = () => {
    setIsEdit(false);
    setProjectEmployee("");
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
        accessorKey: "emp_id_no",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_id_no, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_full_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_full_name, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_email",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_email, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_phone_num",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_phone_num, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_role",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_role, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_start_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_start_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "emp_end_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.emp_end_date_gc, 30) || "-"}
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
      data?.previledge?.is_role_editable ||
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
              {(data?.previledge?.is_role_editable == 1 && cellProps.row.original?.is_editable == 1) && (
                  <Link
                    to="#"
                    className="text-success"
                    onClick={() => {
                      const data = cellProps.row.original;
                      handleProjectEmployeeClick(data);
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
  }, [handleProjectEmployeeClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t("project_employee")}
        description={transaction.emp_description}
        fields={[
          { label: t("emp_id_no"), key: "emp_id_no" },
          { label: t("emp_full_name"), key: "emp_full_name" },
          { label: t("emp_email"), key: "emp_email" },
          { label: t("emp_phone_num"), key: "emp_phone_num" },

          { label: t("emp_role"), key: "emp_role" },
          { label: t("emp_start_date_gc"), key: "emp_start_date_gc" },
          { label: t("emp_end_date_gc"), key: "emp_end_date_gc" },
          { label: t("emp_address"), key: "emp_address" },
        ]}
        footerText={t("close")}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectEmployee}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectEmployee.isPending}
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
                      handleUserClick={handleProjectEmployeeClicks}
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
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("project_employee")
                : t("add") + " " + t("project_employee")}
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
                    <Label>{t("emp_id_no")}</Label>
                    <span className="text-danger">*</span>
                    <Input
                      name="emp_id_no"
                      type="text"
                      placeholder={t("emp_id_no")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_id_no || ""}
                      invalid={
                        validation.touched.emp_id_no &&
                          validation.errors.emp_id_no
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.emp_id_no &&
                      validation.errors.emp_id_no ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_id_no}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("emp_full_name")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="emp_full_name"
                      type="text"
                      placeholder={t("emp_full_name")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_full_name || ""}
                      invalid={
                        validation.touched.emp_full_name &&
                          validation.errors.emp_full_name
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.emp_full_name &&
                      validation.errors.emp_full_name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_full_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("emp_email")}</Label>
                    <Input
                      name="emp_email"
                      type="text"
                      placeholder={t("emp_email")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_email || ""}
                      invalid={
                        validation.touched.emp_email &&
                          validation.errors.emp_email
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.emp_email &&
                      validation.errors.emp_email ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_email}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                  <InputGroup>
                      <InputGroupText>{"+251"}</InputGroupText>
                      <Input
                        name="emp_phone_num"
                        type="text"
                        placeholder="Enter phone number"
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          let formattedValue = inputValue.replace(/^0/, "");
                          formattedValue = formattedValue.replace(/[^\d]/g, "");
                          formattedValue = formattedValue.substring(0, 9);
                          validation.setFieldValue(
                            "emp_phone_num",
                            formattedValue
                          );
                        }}
                        onBlur={validation.handleBlur}
                        value={validation.values.emp_phone_num}
                        invalid={
                          validation.touched.emp_phone_num &&
                          !!validation.errors.emp_phone_num
                        }
                      />
                      {validation.touched.emp_phone_num &&
                      validation.errors.emp_phone_num ? (
                        <FormFeedback type="invalid">
                          {validation.errors.emp_phone_num}
                        </FormFeedback>
                      ) : null}
                    </InputGroup>
                    </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("emp_role")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="emp_role"
                      type="text"
                      placeholder={t("emp_role")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_role || ""}
                      invalid={
                        validation.touched.emp_role &&
                          validation.errors.emp_role
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.emp_role &&
                      validation.errors.emp_role ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_role}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired={true}
                      componentId={"emp_start_date_gc"}
                      validation={validation}
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired={true}
                      componentId={"emp_end_date_gc"}
                      validation={validation}
                      minDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("emp_address")}</Label>
                    <Input
                      name="emp_address"
                      type="textarea"
                      placeholder={t("emp_address")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_address || ""}
                      invalid={
                        validation.touched.emp_address &&
                          validation.errors.emp_address
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.emp_address &&
                      validation.errors.emp_address ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_address}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("emp_description")}</Label>
                    <Input
                      name="emp_description"
                      type="textarea"
                      placeholder={t("emp_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.emp_description || ""}
                      invalid={
                        validation.touched.emp_description &&
                          validation.errors.emp_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.emp_description &&
                      validation.errors.emp_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.emp_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectEmployee.isPending ||
                        updateProjectEmployee.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectEmployee.isPending ||
                            updateProjectEmployee.isPending ||
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
                            addProjectEmployee.isPending ||
                            updateProjectEmployee.isPending ||
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
      {/*   */}
    </React.Fragment>
  );
};
ProjectEmployeeModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectEmployeeModel;
