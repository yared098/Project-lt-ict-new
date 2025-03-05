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
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";

import {
  useFetchSectorInformations,
  useSearchSectorInformations,
  useAddSectorInformation,
  useDeleteSectorInformation,
  useUpdateSectorInformation,
} from "../../queries/sectorinformation_query";
import { useFetchSectorCategorys } from "../../queries/sectorcategory_query";
import SectorInformationModal from "./SectorInformationModal";
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
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import { createSelectOptions } from "../../utils/commonMethods";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const SectorInformationModel = () => {
  //meta title
  document.title = " SectorInformation";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [sectorInformation, setSectorInformation] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchSectorInformations();
  const { data: sectorCategoryData } = useFetchSectorCategorys();
  const sectorCategoryOptions = createSelectOptions(
    sectorCategoryData?.data || [],
    "psc_id",
    "psc_name"
  );
  const addSectorInformation = useAddSectorInformation();
  const updateSectorInformation = useUpdateSectorInformation();
  const deleteSectorInformation = useDeleteSectorInformation();

  const handleAddSectorInformation = async (data) => {
    try {
      await addSectorInformation.mutateAsync(data);
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

  const handleUpdateSectorInformation = async (data) => {
    try {
      await updateSectorInformation.mutateAsync(data);
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

  const handleDeleteSectorInformation = async () => {
    if (sectorInformation && sectorInformation.sci_id) {
      try {
        const id = sectorInformation.sci_id;
        await deleteSectorInformation.mutateAsync(id);
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
      sci_name_or: (sectorInformation && sectorInformation.sci_name_or) || "",
      sci_name_am: (sectorInformation && sectorInformation.sci_name_am) || "",
      sci_name_en: (sectorInformation && sectorInformation.sci_name_en) || "",
      sci_code: (sectorInformation && sectorInformation.sci_code) || "",
      sci_sector_category_id:
        (sectorInformation && sectorInformation.sci_sector_category_id) || "",
      sci_available_at_region:
        (sectorInformation && sectorInformation.sci_available_at_region) ||
        false,
      sci_available_at_zone:
        (sectorInformation && sectorInformation.sci_available_at_zone) || false,
      sci_available_at_woreda:
        (sectorInformation && sectorInformation.sci_available_at_woreda) ||
        false,
      sci_description:
        (sectorInformation && sectorInformation.sci_description) || "",
      sci_status: (sectorInformation && sectorInformation.sci_status) || "",

      is_deletable: (sectorInformation && sectorInformation.is_deletable) || 1,
      is_editable: (sectorInformation && sectorInformation.is_editable) || 1,
    },
    validationSchema: Yup.object({
      sci_name_or: alphanumericValidation(2, 100, true).test(
        "unique-sci_name_or",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) =>
              item.sci_name_or == value &&
              item.sci_id !== sectorInformation?.sci_id
          );
        }
      ),
      sci_sector_category_id: numberValidation(1, 10, true),
      sci_name_am: Yup.string().required(t("sci_name_am")),
      sci_name_en: alphanumericValidation(2, 100, true),
      sci_code: numberValidation(100, 300, false),
      sci_description: alphanumericValidation(3, 425, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateSectorInformation = {
          sci_id: sectorInformation?.sci_id,
          sci_name_or: values.sci_name_or,
          sci_name_am: values.sci_name_am,
          sci_name_en: values.sci_name_en,
          sci_code: values.sci_code,
          sci_sector_category_id: values.sci_sector_category_id,
          sci_available_at_region: values.sci_available_at_region ? 1 : 0,
          sci_available_at_zone: values.sci_available_at_zone ? 1 : 0,
          sci_available_at_woreda: values.sci_available_at_woreda ? 1 : 0,
          sci_description: values.sci_description,
          sci_status: values.sci_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update SectorInformation
        handleUpdateSectorInformation(updateSectorInformation);
      } else {
        const newSectorInformation = {
          sci_name_or: values.sci_name_or,
          sci_name_am: values.sci_name_am,
          sci_name_en: values.sci_name_en,
          sci_code: values.sci_code,
          sci_sector_category_id: values.sci_sector_category_id,
          sci_available_at_region: values.sci_available_at_region ? 1 : 0,
          sci_available_at_zone: values.sci_available_at_zone ? 1 : 0,
          sci_available_at_woreda: values.sci_available_at_woreda ? 1 : 0,
          sci_description: values.sci_description,
          sci_status: values.sci_status,
        };
        // save new SectorInformation
        handleAddSectorInformation(newSectorInformation);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch SectorInformation on component mount
  useEffect(() => {
    setSectorInformation(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setSectorInformation(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setSectorInformation(null);
    } else {
      setModal(true);
    }
  };

  const handleSectorInformationClick = (arg) => {
    const sectorInformation = arg;
    // console.log("handleSectorInformationClick", sectorInformation);
    setSectorInformation({
      sci_id: sectorInformation.sci_id,
      sci_name_or: sectorInformation.sci_name_or,
      sci_name_am: sectorInformation.sci_name_am,
      sci_name_en: sectorInformation.sci_name_en,
      sci_code: sectorInformation.sci_code,
      sci_sector_category_id: sectorInformation.sci_sector_category_id,
      sci_available_at_region: sectorInformation.sci_available_at_region === 1,
      sci_available_at_zone: sectorInformation.sci_available_at_zone === 1,
      sci_available_at_woreda: sectorInformation.sci_available_at_woreda === 1,
      sci_description: sectorInformation.sci_description,
      sci_status: sectorInformation.sci_status,

      is_deletable: sectorInformation.is_deletable,
      is_editable: sectorInformation.is_editable,
    });
    //setSelectedSectorCategory(sectorInformation.sci_sector_category_id);
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (sectorInformation) => {
    setSectorInformation(sectorInformation);
    setDeleteModal(true);
  };

  const handleSectorInformationClicks = () => {
    setIsEdit(false);
    setSectorInformation("");
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
        accessorKey: "sci_name_or",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sci_name_or, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_name_am",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sci_name_am, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_name_en",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sci_name_en, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_code",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.sci_code, 30) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_sector_category_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(
                cellProps.row.original.sci_sector_category_id,
                30
              ) || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_available_at_region",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.sci_available_at_region == 1
                ? "Yes"
                : "No"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_available_at_zone",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.sci_available_at_zone == 1 ? "Yes" : "No"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "sci_available_at_woreda",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.sci_available_at_woreda == 1
                ? "Yes"
                : "No"}
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
                    handleSectorInformationClick(data);
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
  }, [handleSectorInformationClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }
  return (
    <React.Fragment>
      <SectorInformationModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteSectorInformation}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteSectorInformation.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("sector_information")}
            breadcrumbItem={t("sector_information")}
          />
          <AdvancedSearch
            searchHook={useSearchSectorInformations}
            textSearchKeys={["sci_name_or"]}
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
                      isAddButton={data?.previledge?.is_role_can_add == 1}
                      isCustomPageSize={true}
                      handleUserClick={handleSectorInformationClicks}
                      isPagination={true}
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") + " " + t("sector_information")}
                      tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      pagination="pagination"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      divClassName="table-responsive"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {!!isEdit
                ? t("edit") + " " + t("sector_information")
                : t("add") + " " + t("sector_information")}
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
                      {t("sci_name_or")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="sci_name_or"
                      type="text"
                      placeholder={t("sci_name_or")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_name_or || ""}
                      invalid={
                        validation.touched.sci_name_or &&
                        validation.errors.sci_name_or
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sci_name_or &&
                    validation.errors.sci_name_or ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_name_or}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("sci_name_am")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="sci_name_am"
                      type="text"
                      placeholder={t("sci_name_am")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_name_am || ""}
                      invalid={
                        validation.touched.sci_name_am &&
                        validation.errors.sci_name_am
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sci_name_am &&
                    validation.errors.sci_name_am ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_name_am}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      {t("sci_name_en")}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="sci_name_en"
                      type="text"
                      placeholder={t("sci_name_en")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_name_en || ""}
                      invalid={
                        validation.touched.sci_name_en &&
                        validation.errors.sci_name_en
                          ? true
                          : false
                      }
                      maxLength={100}
                    />
                    {validation.touched.sci_name_en &&
                    validation.errors.sci_name_en ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_name_en}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sci_code")}</Label>
                    <Input
                      name="sci_code"
                      type="text"
                      placeholder={t("sci_code")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_code || ""}
                      invalid={
                        validation.touched.sci_code &&
                        validation.errors.sci_code
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.sci_code &&
                    validation.errors.sci_code ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_code}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sci_sector_category_id")}</Label>
                    <Input
                      name="sci_sector_category_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_sector_category_id || ""}
                      invalid={
                        validation.touched.sci_sector_category_id &&
                        validation.errors.sci_sector_category_id
                          ? true
                          : false
                      }
                    >
                      <option value={null}>Select Sector Category</option>
                      {sectorCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`${option.label}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.sci_sector_category_id &&
                    validation.errors.sci_sector_category_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_sector_category_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Row>
                    <Col className="col-md-4 mb-3">
                      <Label className="me-1">
                        {t("sci_available_at_region")}
                      </Label>
                      <Input
                        name="sci_available_at_region"
                        type="checkbox"
                        placeholder={t("sci_available_at_region")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        checked={validation.values.sci_available_at_region}
                        invalid={
                          validation.touched.sci_available_at_region &&
                          validation.errors.sci_available_at_region
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.sci_available_at_region &&
                      validation.errors.sci_available_at_region ? (
                        <FormFeedback type="invalid">
                          {validation.errors.sci_available_at_region}
                        </FormFeedback>
                      ) : null}
                    </Col>
                    <Col className="col-md-4 mb-3">
                      <Label className="me-1">
                        {t("sci_available_at_zone")}
                      </Label>
                      <Input
                        name="sci_available_at_zone"
                        type="checkbox"
                        placeholder={t("sci_available_at_zone")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        checked={validation.values.sci_available_at_zone}
                        invalid={
                          validation.touched.sci_available_at_zone &&
                          validation.errors.sci_available_at_zone
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.sci_available_at_zone &&
                      validation.errors.sci_available_at_zone ? (
                        <FormFeedback type="invalid">
                          {validation.errors.sci_available_at_zone}
                        </FormFeedback>
                      ) : null}
                    </Col>
                    <Col className="col-md-4 mb-3">
                      <Label className="me-1">
                        {t("sci_available_at_woreda")}
                      </Label>
                      <Input
                        name="sci_available_at_woreda"
                        type="checkbox"
                        placeholder={t("sci_available_at_woreda")}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        checked={validation.values.sci_available_at_woreda}
                        invalid={
                          validation.touched.sci_available_at_woreda &&
                          validation.errors.sci_available_at_woreda
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.sci_available_at_woreda &&
                      validation.errors.sci_available_at_woreda ? (
                        <FormFeedback type="invalid">
                          {validation.errors.sci_available_at_woreda}
                        </FormFeedback>
                      ) : null}
                    </Col>
                  </Row>
                  <Col className="col-md-6 mb-3">
                    <Label>{t("sci_description")}</Label>
                    <Input
                      name="sci_description"
                      type="textarea"
                      placeholder={t("sci_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.sci_description || ""}
                      invalid={
                        validation.touched.sci_description &&
                        validation.errors.sci_description
                          ? true
                          : false
                      }
                      maxLength={425}
                    />
                    {validation.touched.sci_description &&
                    validation.errors.sci_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.sci_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addSectorInformation.isPending ||
                      updateSectorInformation.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addSectorInformation.isPending ||
                            updateSectorInformation.isPending ||
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
                            addSectorInformation.isPending ||
                            updateSectorInformation.isPending ||
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
SectorInformationModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default SectorInformationModel;
