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
import DeleteModal from "../../components/Common/DeleteModal";
import {
  useFetchProjectContractors,
  useSearchProjectContractors,
  useAddProjectContractor,
  useDeleteProjectContractor,
  useUpdateProjectContractor,
} from "../../queries/projectcontractor_query";
import { useFetchContractorTypes } from "../../queries/contractortype_query";
import ProjectContractorModal from "./ProjectContractorModal";
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
  CardHeader,
  FormGroup,
  Badge,
  InputGroup,
  Collapse
} from "reactstrap";
import "flatpickr/dist/themes/material_blue.css";
import Flatpickr from "react-flatpickr";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import { createSelectOptions } from "../../utils/commonMethods";
import { formatDate } from "../../utils/commonMethods";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";
import DatePicker from "../../components/Common/DatePicker";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectContractorModel = (props) => {
  const { passedId, isActive, startDate } = props;
  const param = { cni_project_id: passedId };
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectContractor, setProjectContractor] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProjectContractors(param, isActive);

  const addProjectContractor = useAddProjectContractor();
  const updateProjectContractor = useUpdateProjectContractor();
  const deleteProjectContractor = useDeleteProjectContractor();

  const { data: contractorTypeData } = useFetchContractorTypes();
  const contractorTypeOptions = createSelectOptions(
    contractorTypeData?.data || [],
    "cnt_id",
    "cnt_type_name_or"
  );

  //START CRUD
  const handleAddProjectContractor = async (data) => {
    try {
      await addProjectContractor.mutateAsync(data);
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

  const handleUpdateProjectContractor = async (data) => {
    try {
      await updateProjectContractor.mutateAsync(data);
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
  const handleDeleteProjectContractor = async () => {
    if (projectContractor && projectContractor.cni_id) {
      try {
        const id = projectContractor.cni_id;
        await deleteProjectContractor.mutateAsync(id);
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

  // validation
  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      cni_name: (projectContractor && projectContractor.cni_name) || "",
      cni_tin_num: (projectContractor && projectContractor.cni_tin_num) || "",
      cni_contractor_type_id:
        (projectContractor && projectContractor.cni_contractor_type_id) || "",
      cni_vat_num: (projectContractor && projectContractor.cni_vat_num) || "",
      cni_total_contract_price:
        (projectContractor && projectContractor.cni_total_contract_price) || "",
      cni_contract_start_date_et:
        (projectContractor && projectContractor.cni_contract_start_date_et) ||
        "",
      cni_contract_start_date_gc:
        (projectContractor && projectContractor.cni_contract_start_date_gc) ||
        "",
      cni_contract_end_date_et:
        (projectContractor && projectContractor.cni_contract_end_date_et) || "",
      cni_contract_end_date_gc:
        (projectContractor && projectContractor.cni_contract_end_date_gc) || "",
      cni_contact_person:
        (projectContractor && projectContractor.cni_contact_person) || "",
      cni_phone_number:
        (projectContractor && projectContractor.cni_phone_number) || "",
      cni_address: (projectContractor && projectContractor.cni_address) || "",
      cni_email: (projectContractor && projectContractor.cni_email) || "",
      cni_website: (projectContractor && projectContractor.cni_website) || "",
      cni_project_id: passedId,
      cni_procrument_method:
        (projectContractor && projectContractor.cni_procrument_method) || "",
      cni_bid_invitation_date:
        (projectContractor && projectContractor.cni_bid_invitation_date) || "",
      cni_bid_opening_date:
        (projectContractor && projectContractor.cni_bid_opening_date) || "",
      cni_bid_evaluation_date:
        (projectContractor && projectContractor.cni_bid_evaluation_date) || "",
      cni_bid_award_date:
        (projectContractor && projectContractor.cni_bid_award_date) || "",
      cni_bid_contract_signing_date:
        (projectContractor &&
          projectContractor.cni_bid_contract_signing_date) ||
        "",
      cni_description:
        (projectContractor && projectContractor.cni_description) || "",
      cni_status: (projectContractor && projectContractor.cni_status) || "",

      is_deletable: (projectContractor && projectContractor.is_deletable) || 1,
      is_editable: (projectContractor && projectContractor.is_editable) || 1,
    },

    validationSchema: Yup.object({
      cni_name: Yup.string().required(t("cni_name")),
      cni_tin_num: Yup.string().required(t("cni_tin_num")),
      cni_vat_num: Yup.string().required(t("cni_vat_num")),
      cni_total_contract_price: Yup.string().required(
        t("cni_total_contract_price")
      ),
      cni_contract_start_date_gc: Yup.string().required(
        t("cni_contract_start_date_gc")
      ),
      cni_contract_end_date_gc: Yup.string().required(
        t("cni_contract_end_date_gc")
      ),
      cni_contact_person: Yup.string().required(t("cni_contact_person")),
      cni_phone_number: Yup.string().required(t("cni_phone_number")),
      //cni_address: Yup.string().required(t("cni_address")),
      cni_procrument_method: Yup.string().required(t("cni_procrument_method")),
      //cni_bid_invitation_date: Yup.string().required( t("cni_bid_invitation_date")),
      //cni_bid_opening_date: Yup.string().required(t("cni_bid_opening_date")),
      //cni_bid_evaluation_date: Yup.string().required( t("cni_bid_evaluation_date")),
      //cni_bid_award_date: Yup.string().required(t("cni_bid_award_date")),
      //cni_bid_contract_signing_date: Yup.string().required(t("cni_bid_contract_signing_date"))
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectContractor = {
          cni_id: projectContractor.cni_id,
          cni_name: values.cni_name,
          cni_tin_num: values.cni_tin_num,
          cni_contractor_type_id: values.cni_contractor_type_id,
          cni_vat_num: values.cni_vat_num,
          cni_total_contract_price: values.cni_total_contract_price,
          cni_contract_start_date_et: values.cni_contract_start_date_et,
          cni_contract_start_date_gc: values.cni_contract_start_date_gc,
          cni_contract_end_date_et: values.cni_contract_end_date_et,
          cni_contract_end_date_gc: values.cni_contract_end_date_gc,
          cni_contact_person: values.cni_contact_person,
          cni_phone_number: values.cni_phone_number,
          cni_address: values.cni_address,
          cni_email: values.cni_email,
          cni_website: values.cni_website,
          cni_project_id: passedId,
          cni_procrument_method: values.cni_procrument_method,
          cni_bid_invitation_date: values.cni_bid_invitation_date,
          cni_bid_opening_date: values.cni_bid_opening_date,
          cni_bid_evaluation_date: values.cni_bid_evaluation_date,
          cni_bid_award_date: values.cni_bid_award_date,
          cni_bid_contract_signing_date: values.cni_bid_contract_signing_date,
          cni_description: values.cni_description,
          cni_status: values.cni_status,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectContractor
        handleUpdateProjectContractor(updateProjectContractor);
        validation.resetForm();
      } else {
        const newProjectContractor = {
          cni_name: values.cni_name,
          cni_tin_num: values.cni_tin_num,
          cni_contractor_type_id: values.cni_contractor_type_id,
          cni_vat_num: values.cni_vat_num,
          cni_total_contract_price: values.cni_total_contract_price,
          cni_contract_start_date_et: values.cni_contract_start_date_et,
          cni_contract_start_date_gc: values.cni_contract_start_date_gc,
          cni_contract_end_date_et: values.cni_contract_end_date_et,
          cni_contract_end_date_gc: values.cni_contract_end_date_gc,
          cni_contact_person: values.cni_contact_person,
          cni_phone_number: values.cni_phone_number,
          cni_address: values.cni_address,
          cni_email: values.cni_email,
          cni_website: values.cni_website,
          cni_project_id: passedId,
          cni_procrument_method: values.cni_procrument_method,
          cni_bid_invitation_date: values.cni_bid_invitation_date,
          cni_bid_opening_date: values.cni_bid_opening_date,
          cni_bid_evaluation_date: values.cni_bid_evaluation_date,
          cni_bid_award_date: values.cni_bid_award_date,
          cni_bid_contract_signing_date: values.cni_bid_contract_signing_date,
          cni_description: values.cni_description,
          cni_status: values.cni_status,
        };
        // save new ProjectContractor
        handleAddProjectContractor(newProjectContractor);
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectContractor on component mount
  useEffect(() => {
    setProjectContractor(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectContractor(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectContractor(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectContractorClick = (arg) => {
    const projectContractor = arg;
    // console.log("handleProjectContractorClick", projectContractor);
    setProjectContractor({
      cni_id: projectContractor.cni_id,
      cni_name: projectContractor.cni_name,
      cni_tin_num: projectContractor.cni_tin_num,
      cni_contractor_type_id: projectContractor.cni_contractor_type_id,
      cni_vat_num: projectContractor.cni_vat_num,
      cni_total_contract_price: projectContractor.cni_total_contract_price,
      cni_contract_start_date_et: projectContractor.cni_contract_start_date_et,
      cni_contract_start_date_gc: projectContractor.cni_contract_start_date_gc,
      cni_contract_end_date_et: projectContractor.cni_contract_end_date_et,
      cni_contract_end_date_gc: projectContractor.cni_contract_end_date_gc,
      cni_contact_person: projectContractor.cni_contact_person,
      cni_phone_number: projectContractor.cni_phone_number,
      cni_address: projectContractor.cni_address,
      cni_email: projectContractor.cni_email,
      cni_website: projectContractor.cni_website,
      cni_project_id: projectContractor.cni_project_id,
      cni_procrument_method: projectContractor.cni_procrument_method,
      cni_bid_invitation_date: projectContractor.cni_bid_invitation_date,
      cni_bid_opening_date: projectContractor.cni_bid_opening_date,
      cni_bid_evaluation_date: projectContractor.cni_bid_evaluation_date,
      cni_bid_award_date: projectContractor.cni_bid_award_date,
      cni_bid_contract_signing_date:
        projectContractor.cni_bid_contract_signing_date,
      cni_description: projectContractor.cni_description,
      cni_status: projectContractor.cni_status,

      is_deletable: projectContractor.is_deletable,
      is_editable: projectContractor.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectContractor) => {
    setProjectContractor(projectContractor);
    setDeleteModal(true);
  };

  const handleProjectContractorClicks = () => {
    setIsEdit(false);
    setProjectContractor("");
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
        accessorKey: "cni_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cni_name, 30) || "-"}
            </span>
          );
        },
      },

      {
        header: "",
        accessorKey: "cni_contractor_type_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.cni_contractor_type_id,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "cni_tin_num",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cni_tin_num, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "cni_total_contract_price",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.cni_total_contract_price,
                30
              ) || "-"}
            </span>
          );
        },
      },

      {
        header: "",
        accessorKey: "cni_contract_start_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.cni_contract_start_date_gc,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "cni_contract_end_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.cni_contract_end_date_gc,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "cni_contact_person",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cni_contact_person, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "cni_phone_number",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cni_phone_number, 30) || "-"}
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
                    handleProjectContractorClick(data);
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
  }, [handleProjectContractorClick, toggleViewModal, onClickDelete]);

  if (isError) {
    <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title={t('project_contractor')}
        description={transaction.cni_description}

        fields={[
          /* { label: t('prp_type'), key: "prp_type", value:paymentCategoryMap[transaction.prp_type]},*/
          { label: t('cni_name'), key: "cni_name" },
          { label: t('cni_tin_num'), key: "cni_tin_num" },
          { label: t('cni_vat_num'), key: "cni_vat_num" },
          { label: t('cni_total_contract_price'), key: "cni_total_contract_price" },
          { label: t('cni_contract_start_date_gc'), key: "cni_contract_start_date_gc" },
          { label: t('cni_contract_end_date_gc'), key: "cni_contract_end_date_gc" },
          { label: t('cni_contact_person'), key: "cni_contact_person" },
          { label: t('cni_phone_number'), key: "cni_phone_number" },
          { label: t('cni_address'), key: "cni_address" },
          { label: t('cni_email'), key: "cni_email" },
          { label: t('cni_website'), key: "cni_website" },
          { label: t('cni_procrument_method'), key: "cni_procrument_method" },
          { label: t('cni_bid_invitation_date'), key: "cni_bid_invitation_date" },
          { label: t('cni_bid_opening_date'), key: "cni_bid_opening_date" },
          { label: t('cni_bid_award_date'), key: "cni_bid_award_date" },
          { label: t('cni_bid_contract_signing_date'), key: "cni_bid_contract_signing_date" },
          //{ label: t('prp_payment_percentage'), key: "prp_status" },
        ]}
        footerText={t('close')}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectContractor}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectContractor.isPending}
      />
      <div className={passedId ? "" : "page-content"}>
        <div className="container-fluid1">
          {isLoading || isSearchLoading ? (
            <Spinners top={isActive ? "top-70" : ""} />
          ) : (
            <TableContainer
              columns={columns}
              data={showSearchResult ? searchResults?.data : data?.data || []}
              isGlobalFilter={true}
              isAddButton={data?.previledge?.is_role_can_add == 1}
              isCustomPageSize={true}
              handleUserClick={handleProjectContractorClicks}
              isPagination={true}
              SearchPlaceholder={t("filter_placeholder")}
              buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
              buttonName={t("add") + " " + t("project_contractor")}
              tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
              theadClass="table-light"
              pagination="pagination"
              paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
            />
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("project_contractor")
                : t("add") + " " + t("project_contractor")}
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
                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_name")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_name"
                      type="text"
                      placeholder={t("cni_name")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_name || ""}
                      invalid={
                        validation.touched.cni_name &&
                          validation.errors.cni_name
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.cni_name &&
                      validation.errors.cni_name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_tin_num")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_tin_num"
                      type="text"
                      placeholder={t("cni_tin_num")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_tin_num || ""}
                      invalid={
                        validation.touched.cni_tin_num &&
                          validation.errors.cni_tin_num
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_tin_num &&
                      validation.errors.cni_tin_num ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_tin_num}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_contractor_type_id")}{" "}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_contractor_type_id"
                      id="cni_contractor_type_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_contractor_type_id || ""}
                      invalid={
                        validation.touched.cni_contractor_type_id &&
                          validation.errors.cni_contractor_type_id
                          ? true
                          : false
                      }
                    >
                      <option value={null}>Select Contractor Type</option>
                      {contractorTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`${option.label}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.cni_contractor_type_id &&
                      validation.errors.cni_contractor_type_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_contractor_type_id}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_vat_num")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_vat_num"
                      type="text"
                      placeholder={t("cni_vat_num")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_vat_num || ""}
                      invalid={
                        validation.touched.cni_vat_num &&
                          validation.errors.cni_vat_num
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_vat_num &&
                      validation.errors.cni_vat_num ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_vat_num}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_total_contract_price")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_total_contract_price"
                      type="text"
                      placeholder={t("cni_total_contract_price")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_total_contract_price || ""}
                      invalid={
                        validation.touched.cni_total_contract_price &&
                          validation.errors.cni_total_contract_price
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_total_contract_price &&
                      validation.errors.cni_total_contract_price ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_total_contract_price}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_contact_person")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_contact_person"
                      type="text"
                      placeholder={t("cni_contact_person")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_contact_person || ""}
                      invalid={
                        validation.touched.cni_contact_person &&
                          validation.errors.cni_contact_person
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_contact_person &&
                      validation.errors.cni_contact_person ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_contact_person}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>
                      {t("cni_phone_number")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_phone_number"
                      type="text"
                      placeholder={t("cni_phone_number")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_phone_number || ""}
                      invalid={
                        validation.touched.cni_phone_number &&
                          validation.errors.cni_phone_number
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_phone_number &&
                      validation.errors.cni_phone_number ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_phone_number}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("cni_address")}</Label>
                    <Input
                      name="cni_address"
                      type="text"
                      placeholder={t("cni_address")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_address || ""}
                      invalid={
                        validation.touched.cni_address &&
                          validation.errors.cni_address
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.cni_address &&
                      validation.errors.cni_address ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_address}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("cni_email")}</Label>
                    <Input
                      name="cni_email"
                      type="text"
                      placeholder={t("cni_email")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_email || ""}
                      invalid={
                        validation.touched.cni_email &&
                          validation.errors.cni_email
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_email &&
                      validation.errors.cni_email ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_email}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("cni_website")}</Label>
                    <Input
                      name="cni_website"
                      type="text"
                      placeholder={t("cni_website")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_website || ""}
                      invalid={
                        validation.touched.cni_website &&
                          validation.errors.cni_website
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_website &&
                      validation.errors.cni_website ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_website}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-8 mb-3">
                    <Label>
                      {t("cni_procrument_method")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="cni_procrument_method"
                      type="text"
                      placeholder={t("cni_procrument_method")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_procrument_method || ""}
                      invalid={
                        validation.touched.cni_procrument_method &&
                          validation.errors.cni_procrument_method
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.cni_procrument_method &&
                      validation.errors.cni_procrument_method ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_procrument_method}
                      </FormFeedback>
                    ) : null}
                  </Col>

                  <Col className="col-md-12 mb-3">
                    <Card>
                      <CardHeader
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        <span style={{ fontSize: '0.9rem' }}>
                          {isExpanded ? '▼' : '▶'} {isExpanded ? 'Collapse Date Fields' : 'Expand Date Fields'}
                        </span>
                      </CardHeader>
                      <Collapse isOpen={isExpanded}>
                        <CardBody>
                          <Row>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_contract_start_date_gc"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_contract_end_date_gc"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_bid_invitation_date"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_bid_opening_date"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_bid_evaluation_date"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_bid_award_date"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                            <Col className="col-md-4 mb-3">
                              <DatePicker
                                isRequired={true}
                                componentId={"cni_bid_contract_signing_date"}
                                validation={validation}
                                minDate={startDate} />
                            </Col>
                          </Row>
                        </CardBody>
                      </Collapse>
                    </Card>
                  </Col>

                  <Col className="col-md-12 mb-3">
                    <Label>{t("cni_description")}</Label>
                    <Input
                      name="cni_description"
                      type="textarea"
                      rows={4}
                      placeholder={t("cni_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cni_description || ""}
                      invalid={
                        validation.touched.cni_description &&
                          validation.errors.cni_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.cni_description &&
                      validation.errors.cni_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.cni_description}
                      </FormFeedback>
                    ) : null}
                  </Col>

                </Row>

                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectContractor.isPending ||
                        updateProjectContractor.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectContractor.isPending ||
                            updateProjectContractor.isPending ||
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
                            addProjectContractor.isPending ||
                            updateProjectContractor.isPending ||
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
ProjectContractorModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectContractorModel;
