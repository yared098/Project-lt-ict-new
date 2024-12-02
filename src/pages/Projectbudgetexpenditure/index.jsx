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
  useFetchProjectBudgetExpenditures,
  useSearchProjectBudgetExpenditures,
  useAddProjectBudgetExpenditure,
  useDeleteProjectBudgetExpenditure,
  useUpdateProjectBudgetExpenditure,
} from "../../queries/projectbudgetexpenditure_query";
import ProjectBudgetExpenditureModal from "./ProjectBudgetExpenditureModal";
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
import { ToastContainer,toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const ProjectBudgetExpenditureModel = () => {
  //meta title
  document.title = " ProjectBudgetExpenditure";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [projectBudgetExpenditure, setProjectBudgetExpenditure] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } = useFetchProjectBudgetExpenditures();

  const addProjectBudgetExpenditure = useAddProjectBudgetExpenditure();
  const updateProjectBudgetExpenditure = useUpdateProjectBudgetExpenditure();
  const deleteProjectBudgetExpenditure = useDeleteProjectBudgetExpenditure();
//START CRUD
  const handleAddProjectBudgetExpenditure = async (data) => {
    try {
      await addProjectBudgetExpenditure.mutateAsync(data);
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

  const handleUpdateProjectBudgetExpenditure = async (data) => {
    try {
      await updateProjectBudgetExpenditure.mutateAsync(data);
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
  const handleDeleteProjectBudgetExpenditure = async () => {
    if (projectBudgetExpenditure && projectBudgetExpenditure.pbe_id) {
      try {
        const id = projectBudgetExpenditure.pbe_id;
        await deleteProjectBudgetExpenditure.mutateAsync(id);
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
     pbe_reason:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_reason) || "", 
pbe_project_id:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_project_id) || "", 
pbe_budget_code_id:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_budget_code_id) || "", 
pbe_used_date_ec:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_used_date_ec) || "", 
pbe_used_date_gc:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_used_date_gc) || "", 
ppe_amount:(projectBudgetExpenditure && projectBudgetExpenditure.ppe_amount) || "", 
pbe_status:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_status) || "", 
pbe_description:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_description) || "", 
pbe_created_date:(projectBudgetExpenditure && projectBudgetExpenditure.pbe_created_date) || "", 

is_deletable: (projectBudgetExpenditure && projectBudgetExpenditure.is_deletable) || 1,
is_editable: (projectBudgetExpenditure && projectBudgetExpenditure.is_editable) || 1
    },

    validationSchema: Yup.object({
      pbe_reason: Yup.string().required(t('pbe_reason')),
pbe_project_id: Yup.string().required(t('pbe_project_id')),
pbe_budget_code_id: Yup.string().required(t('pbe_budget_code_id')),
pbe_used_date_ec: Yup.string().required(t('pbe_used_date_ec')),
pbe_used_date_gc: Yup.string().required(t('pbe_used_date_gc')),
ppe_amount: Yup.string().required(t('ppe_amount')),
pbe_status: Yup.string().required(t('pbe_status')),
pbe_description: Yup.string().required(t('pbe_description')),
pbe_created_date: Yup.string().required(t('pbe_created_date')),

    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProjectBudgetExpenditure = {
          pbe_id: projectBudgetExpenditure ? projectBudgetExpenditure.pbe_id : 0,
          pbe_id:projectBudgetExpenditure.pbe_id, 
pbe_reason:values.pbe_reason, 
pbe_project_id:values.pbe_project_id, 
pbe_budget_code_id:values.pbe_budget_code_id, 
pbe_used_date_ec:values.pbe_used_date_ec, 
pbe_used_date_gc:values.pbe_used_date_gc, 
ppe_amount:values.ppe_amount, 
pbe_status:values.pbe_status, 
pbe_description:values.pbe_description, 
pbe_created_date:values.pbe_created_date, 

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProjectBudgetExpenditure
        handleUpdateProjectBudgetExpenditure(updateProjectBudgetExpenditure);
        validation.resetForm();
      } else {
        const newProjectBudgetExpenditure = {
          pbe_reason:values.pbe_reason, 
pbe_project_id:values.pbe_project_id, 
pbe_budget_code_id:values.pbe_budget_code_id, 
pbe_used_date_ec:values.pbe_used_date_ec, 
pbe_used_date_gc:values.pbe_used_date_gc, 
ppe_amount:values.ppe_amount, 
pbe_status:values.pbe_status, 
pbe_description:values.pbe_description, 
pbe_created_date:values.pbe_created_date, 

        };
        // save new ProjectBudgetExpenditure
        handleAddProjectBudgetExpenditure(newProjectBudgetExpenditure);
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // Fetch ProjectBudgetExpenditure on component mount
  useEffect(() => {
    setProjectBudgetExpenditure(data);
  }, [data]);
useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProjectBudgetExpenditure(data);
      setIsEdit(false);
    }
  }, [data]);
const toggle = () => {
    if (modal) {
      setModal(false);
       setProjectBudgetExpenditure(null);
    } else {
      setModal(true);
    }
  };

   const handleProjectBudgetExpenditureClick = (arg) => {
    const projectBudgetExpenditure = arg;
    // console.log("handleProjectBudgetExpenditureClick", projectBudgetExpenditure);
    setProjectBudgetExpenditure({
      pbe_id:projectBudgetExpenditure.pbe_id, 
pbe_reason:projectBudgetExpenditure.pbe_reason, 
pbe_project_id:projectBudgetExpenditure.pbe_project_id, 
pbe_budget_code_id:projectBudgetExpenditure.pbe_budget_code_id, 
pbe_used_date_ec:projectBudgetExpenditure.pbe_used_date_ec, 
pbe_used_date_gc:projectBudgetExpenditure.pbe_used_date_gc, 
ppe_amount:projectBudgetExpenditure.ppe_amount, 
pbe_status:projectBudgetExpenditure.pbe_status, 
pbe_description:projectBudgetExpenditure.pbe_description, 
pbe_created_date:projectBudgetExpenditure.pbe_created_date, 

      is_deletable: projectBudgetExpenditure.is_deletable,
      is_editable: projectBudgetExpenditure.is_editable,
    });
    setIsEdit(true);
    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (projectBudgetExpenditure) => {
    setProjectBudgetExpenditure(projectBudgetExpenditure);
    setDeleteModal(true);
  };

  const handleProjectBudgetExpenditureClicks = () => {
    setIsEdit(false);
    setProjectBudgetExpenditure("");
    toggle();
  }
;  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };
  //START UNCHANGED
  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: '',
        accessorKey: 'pbe_reason',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_reason, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_project_id',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_project_id, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_budget_code_id',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_budget_code_id, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_used_date_ec',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_used_date_ec, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_used_date_gc',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_used_date_gc, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'ppe_amount',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.ppe_amount, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_status',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_status, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_description',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_description, 30) ||
                '-'}
            </span>
          );
        },
      }, 
{
        header: '',
        accessorKey: 'pbe_created_date',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.pbe_created_date, 30) ||
                '-'}
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
                    handleProjectBudgetExpenditureClick(data);
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
  }, [handleProjectBudgetExpenditureClick, toggleViewModal, onClickDelete]);

  return (
    <React.Fragment>
      <ProjectBudgetExpenditureModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
       onDeleteClick={handleDeleteProjectBudgetExpenditure}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteProjectBudgetExpenditure.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("project_budget_expenditure")}
            breadcrumbItem={t("project_budget_expenditure")}
          />
          <AdvancedSearch
            searchHook={useSearchProjectBudgetExpenditures}
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
                      handleUserClick={handleProjectBudgetExpenditureClicks}
                      isPagination={true}
                      // SearchPlaceholder="26 records..."
                      SearchPlaceholder={26 + " " + t("Results") + "..."}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={t("add") +" "+ t("project_budget_expenditure")}
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
              {!!isEdit ? (t("edit") + " "+t("project_budget_expenditure")) : (t("add") +" "+t("project_budget_expenditure"))}
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
                  <Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_reason')}</Label>
                      <Input
                        name='pbe_reason'
                        type='text'
                        placeholder={t('pbe_reason')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_reason || ''}
                        invalid={
                          validation.touched.pbe_reason &&
                          validation.errors.pbe_reason
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_reason &&
                      validation.errors.pbe_reason ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_reason}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_project_id')}</Label>
                      <Input
                        name='pbe_project_id'
                        type='text'
                        placeholder={t('pbe_project_id')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_project_id || ''}
                        invalid={
                          validation.touched.pbe_project_id &&
                          validation.errors.pbe_project_id
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_project_id &&
                      validation.errors.pbe_project_id ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_project_id}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_budget_code_id')}</Label>
                      <Input
                        name='pbe_budget_code_id'
                        type='text'
                        placeholder={t('pbe_budget_code_id')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_budget_code_id || ''}
                        invalid={
                          validation.touched.pbe_budget_code_id &&
                          validation.errors.pbe_budget_code_id
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_budget_code_id &&
                      validation.errors.pbe_budget_code_id ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_budget_code_id}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_used_date_ec')}</Label>
                      <Input
                        name='pbe_used_date_ec'
                        type='text'
                        placeholder={t('pbe_used_date_ec')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_used_date_ec || ''}
                        invalid={
                          validation.touched.pbe_used_date_ec &&
                          validation.errors.pbe_used_date_ec
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_used_date_ec &&
                      validation.errors.pbe_used_date_ec ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_used_date_ec}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_used_date_gc')}</Label>
                      <Input
                        name='pbe_used_date_gc'
                        type='text'
                        placeholder={t('pbe_used_date_gc')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_used_date_gc || ''}
                        invalid={
                          validation.touched.pbe_used_date_gc &&
                          validation.errors.pbe_used_date_gc
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_used_date_gc &&
                      validation.errors.pbe_used_date_gc ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_used_date_gc}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('ppe_amount')}</Label>
                      <Input
                        name='ppe_amount'
                        type='text'
                        placeholder={t('ppe_amount')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.ppe_amount || ''}
                        invalid={
                          validation.touched.ppe_amount &&
                          validation.errors.ppe_amount
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.ppe_amount &&
                      validation.errors.ppe_amount ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.ppe_amount}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_status')}</Label>
                      <Input
                        name='pbe_status'
                        type='text'
                        placeholder={t('pbe_status')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_status || ''}
                        invalid={
                          validation.touched.pbe_status &&
                          validation.errors.pbe_status
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_status &&
                      validation.errors.pbe_status ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_status}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_description')}</Label>
                      <Input
                        name='pbe_description'
                        type='text'
                        placeholder={t('pbe_description')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_description || ''}
                        invalid={
                          validation.touched.pbe_description &&
                          validation.errors.pbe_description
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_description &&
                      validation.errors.pbe_description ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_description}
                        </FormFeedback>
                      ) : null}
                    </Col> 
<Col className='col-md-6 mb-3'>
                      <Label>{t('pbe_created_date')}</Label>
                      <Input
                        name='pbe_created_date'
                        type='text'
                        placeholder={t('pbe_created_date')}
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.pbe_created_date || ''}
                        invalid={
                          validation.touched.pbe_created_date &&
                          validation.errors.pbe_created_date
                            ? true
                            : false
                        }
                        maxLength={20}
                      />
                      {validation.touched.pbe_created_date &&
                      validation.errors.pbe_created_date ? (
                        <FormFeedback type='invalid'>
                          {validation.errors.pbe_created_date}
                        </FormFeedback>
                      ) : null}
                    </Col> 
                
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addProjectBudgetExpenditure.isPending || updateProjectBudgetExpenditure.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addProjectBudgetExpenditure.isPending ||
                            updateProjectBudgetExpenditure.isPending ||
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
                            addProjectBudgetExpenditure.isPending ||
                            updateProjectBudgetExpenditure.isPending ||
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
      <ToastContainer />
    </React.Fragment>
  );
};
ProjectBudgetExpenditureModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default ProjectBudgetExpenditureModel;