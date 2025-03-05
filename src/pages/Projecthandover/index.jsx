import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import Spinners from "../../components/Common/Spinner";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  useFetchProjectHandovers,
  useSearchProjectHandovers,
  useAddProjectHandover,
  useDeleteProjectHandover,
  useUpdateProjectHandover,
} from "../../queries/projecthandover_query";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
import ProjectHandoverModal from "./ProjectHandoverModal";
import ConvInfoModal from "../Conversationinformation/ConvInfoModal"
import { useTranslation } from "react-i18next";
import { PAGE_ID } from "../../constants/constantFile";
import DatePicker from "../../components/Common/DatePicker";
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
  Spinner
} from "reactstrap";
import {
  alphanumericValidation,
  amountValidation,
  numberValidation,
} from "../../utils/Validation/validation";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import FileUploadField from "../../components/Common/FileUploadField";
import AttachFileModal from "../../components/Common/AttachFileModal";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectHandoverModel = (props) => {
  const { passedId, isActive, startDate } = props;
  const param = { prh_project_id: passedId };

  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [fileModal, setFileModal] = useState(false)
  const [convModal, setConvModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false);
  const [projectHandover, setProjectHandover] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } = useFetchProjectHandovers(
    param,
    isActive
  );
  const { data: budgetYearData } = usePopulateBudgetYears();
  const { data: bgYearsOptionsData } = useFetchBudgetYears();

  const addProjectHandover = useAddProjectHandover();
  const updateProjectHandover = useUpdateProjectHandover();
  const deleteProjectHandover = useDeleteProjectHandover();

  const budgetYearMap = useMemo(() => {
    return (
      bgYearsOptionsData?.data?.reduce((acc, year) => {
        acc[year.bdy_id] = year.bdy_name;
        return acc;
      }, {}) || {}
    );
  }, [bgYearsOptionsData]);

  const handleAddProjectHandover = async (
    newProjectHandover
  ) => {
    try {
      await addProjectHandover.mutateAsync(newProjectHandover);
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
  const handleUpdateProjectHandover = async (
    updateData
  ) => {
    try {
      await updateProjectHandover.mutateAsync(updateData),
        toast.success(t("update_success"), { autoClose: 2000 });
      validation.resetForm();
    } catch (error) {
      toast.error(t("update_failure"), { autoClose: 2000 });
    } finally {
      toggle();
    }
  };

  const handleDeleteProjectHandover = async () => {
    if (projectHandover && projectHandover.prh_id) {
      try {
        const id = projectHandover.prh_id;
        await deleteProjectHandover.mutateAsync(id);
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

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      prh_project_id: (projectHandover && projectHandover.prh_project_id) || "",
      prh_budget_year_id:
        (projectHandover && projectHandover.prh_budget_year_id) || "",
      prh_handover_date_ec:
        (projectHandover && projectHandover.prh_handover_date_ec) ||
        "2017/04/07",
      prh_handover_date_gc:
        (projectHandover && projectHandover.prh_handover_date_gc) || "",
      prh_description:
        (projectHandover && projectHandover.prh_description) || "",
      prh_status: (projectHandover && projectHandover.prh_status) || "",
      is_deletable: (projectHandover && projectHandover.is_deletable) || 1,
      is_editable: (projectHandover && projectHandover.is_editable) || 1,
    },

    validationSchema: Yup.object({
      //prh_project_id: Yup.string().required(t("prh_project_id")),
      // prh_handover_date_ec: Yup.string().required(t("prh_handover_date_ec")),
      prh_handover_date_gc: Yup.string().required(t("prh_handover_date_gc")),
      prh_description: alphanumericValidation(3, 425, false),
      //prh_status: Yup.string().required(t("prh_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectHandover = {
          prh_id: projectHandover?.prh_id,
          prh_budget_year_id: parseInt(values.prh_budget_year_id),
          prh_handover_date_ec: values.prh_handover_date_ec,
          prh_handover_date_gc: values.prh_handover_date_gc,
          prh_description: values.prh_description,
          prh_status: values.prh_status,
        };

        handleUpdateProjectHandover(
          updateProjectHandover
        );
      } else {
        const newProjectHandover = {
          prh_project_id: passedId,
          prh_budget_year_id: parseInt(values.prh_budget_year_id),
          prh_handover_date_ec: values.prh_handover_date_ec,
          prh_handover_date_gc: values.prh_handover_date_gc,
          prh_description: values.prh_description,
          prh_status: values.prh_status,
        };
        handleAddProjectHandover(newProjectHandover);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  const toggleFileModal = () => setFileModal(!fileModal);
  const toggleConvModal = () => setConvModal(!convModal);

  useEffect(() => {
    setProjectHandover(data?.data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectHandover(data?.data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setProjectHandover(null);
    } else {
      setModal(true);
    }
  };

  const handleProjectHandoverClick = (arg) => {
    const projectHandover = arg;
    setProjectHandover({
      prh_id: projectHandover.prh_id,
      prh_budget_year_id: projectHandover.prh_budget_year_id,
      prh_project_id: projectHandover.prh_project_id,
      prh_handover_date_ec: projectHandover.prh_handover_date_ec,
      prh_handover_date_gc: projectHandover.prh_handover_date_gc,
      prh_description: projectHandover.prh_description,
      prh_status: projectHandover.prh_status,
      is_deletable: projectHandover.is_deletable,
      is_editable: projectHandover.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectHandover) => {
    setProjectHandover(projectHandover);
    setDeleteModal(true);
  };

  const handleProjectHandoverClicks = () => {
    setIsEdit(false);
    setProjectHandover("");
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
        accessorKey: "prh_budget_year_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {budgetYearMap[cellProps.row.original.prh_budget_year_id] || "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prh_handover_date_gc",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prh_handover_date_gc, 30) ||
                "-"}
            </span>
          );
        },
      },
      {
        header: "",
        accessorKey: "prh_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.prh_description, 30) || "-"}
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
                toggleViewModal();
                setTransaction(cellProps.row.original);
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
              type="button"
              color="primary"
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
                      handleProjectHandoverClick(data);
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
  }, [handleProjectHandoverClick, toggleViewModal, onClickDelete]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <ProjectHandoverModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <AttachFileModal
        isOpen={fileModal}
        toggle={toggleFileModal}
        projectId={passedId}
        ownerTypeId={PAGE_ID.PROJ_HANDOVER}
        ownerId={transaction?.prh_id}
      />
      <ConvInfoModal
        isOpen={convModal}
        toggle={toggleConvModal}
        ownerTypeId={PAGE_ID.PROJ_HANDOVER}
        ownerId={transaction?.prh_id ?? null}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteProjectHandover}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectHandover.isPending}
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
                      handleUserClick={handleProjectHandoverClicks}
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
                ? t("edit") + " " + t("project_handover")
                : t("add") + " " + t("project_handover")}
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
                    <Label>{t("prh_budget_year_id")}<span className="text-danger">*</span></Label>
                    <Input
                      name="prh_budget_year_id"
                      type="select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prh_budget_year_id || ""}
                      invalid={
                        validation.touched.prh_budget_year_id &&
                          validation.errors.prh_budget_year_id
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
                    {validation.touched.prh_budget_year_id &&
                      validation.errors.prh_budget_year_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prh_budget_year_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <DatePicker
                      isRequired="true"
                      validation={validation}
                      componentId="prh_handover_date_gc"
                      startDate={startDate}
                    />
                  </Col>
                  <Col className="col-md-12 mb-3">
                    <Label>{t("prh_description")}</Label>
                    <Input
                      name="prh_description"
                      type="textarea"
                      rows={4}
                      placeholder={t("prh_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.prh_description || ""}
                      invalid={
                        validation.touched.prh_description &&
                          validation.errors.prh_description
                          ? true
                          : false
                      }
                    />
                    {validation.touched.prh_description &&
                      validation.errors.prh_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.prh_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectHandover.isPending ||
                        updateProjectHandover.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectHandover.isPending ||
                            updateProjectHandover.isPending ||
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
                            addProjectHandover.isPending ||
                            updateProjectHandover.isPending ||
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
ProjectHandoverModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectHandoverModel;
