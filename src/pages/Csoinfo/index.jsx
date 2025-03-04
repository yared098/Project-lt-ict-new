import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import TableContainer from "../../components/Common/TableContainer";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import DeleteModal from "../../components/Common/DeleteModal";
import {
  useFetchCsoInfos,
  useSearchCsoInfos,
  useAddCsoInfo,
  useDeleteCsoInfo,
  useUpdateCsoInfo,
} from "../../queries/csoinfo_query";
import CsoInfoModal from "./CsoInfoModal";
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
  InputGroup,
  InputGroupText
} from "reactstrap";
import { toast } from "react-toastify";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import { phoneValidation, alphanumericValidation, websiteUrlValidation } from "../../utils/Validation/validation";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const CsoInfoModel = () => {
  document.title = " CSO Info | PMS";

  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [csoInfo, setCsoInfo] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);
  
  const { data, isLoading, error, isError, refetch } = useFetchCsoInfos();
  const addCsoInfo = useAddCsoInfo();
  const updateCsoInfo = useUpdateCsoInfo();
  const deleteCsoInfo = useDeleteCsoInfo();
  //START CRUD
  const handleAddCsoInfo = async (data) => {
    try {
      await addCsoInfo.mutateAsync(data);
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
  const handleUpdateCsoInfo = async (data) => {
    try {
      await updateCsoInfo.mutateAsync(data);
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
  const handleDeleteCsoInfo = async () => {
    if (csoInfo && csoInfo.cso_id) {
      try {
        const id = csoInfo.cso_id;
        await deleteCsoInfo.mutateAsync(id);
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

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      cso_name: (csoInfo && csoInfo.cso_name) || "",
      cso_code: (csoInfo && csoInfo.cso_code) || "",
      cso_address: (csoInfo && csoInfo.cso_address) || "",
      cso_phone: (csoInfo && csoInfo.cso_phone) || "",
      cso_email: (csoInfo && csoInfo.cso_email) || "",
      cso_website: (csoInfo && csoInfo.cso_website) || "",
      cso_description: (csoInfo && csoInfo.cso_description) || "",
      is_deletable: (csoInfo && csoInfo.is_deletable) || 1,
      is_editable: (csoInfo && csoInfo.is_editable) || 1
    },
    validationSchema: Yup.object({
      cso_name: alphanumericValidation(3, 150, true),
      cso_code: alphanumericValidation(3, 20, true).test(
        "unique-cso_code",
        t("Already exists"),
        (value) => {
          return !data?.data.some(
            (item) => item.cso_code == value && item.cso_id !== csoInfo?.cso_id
          );
        }
      ),
      cso_address: alphanumericValidation(3, 150, true),
      cso_phone: phoneValidation(true),
      cso_email: Yup.string()
        .required(t("cso_email"))
        .email(t("Invalid email format"))
        .test("unique-cso_email", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) => item.cso_email === value && item.cso_id !== csoInfo?.cso_id
          );
        }),
      cso_website: websiteUrlValidation(true),
      cso_description: alphanumericValidation(3, 450, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateCsoInfo = {
          cso_id: csoInfo?.cso_id,
          cso_name: values.cso_name,
          cso_code: values.cso_code,
          cso_address: values.cso_address,
          cso_phone: values.cso_phone,
          cso_email: values.cso_email,
          cso_website: values.cso_website,
          cso_description: values.cso_description,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update CsoInfo
        handleUpdateCsoInfo(updateCsoInfo);
      } else {
        const newCsoInfo = {
          cso_name: values.cso_name,
          cso_code: values.cso_code,
          cso_address: values.cso_address,
          cso_phone: `+251${values.cso_phone}`,
          cso_email: values.cso_email,
          cso_website: values.cso_website,
          cso_description: values.cso_description,
        };
        // save new CsoInfo
        handleAddCsoInfo(newCsoInfo);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  // Fetch CsoInfo on component mount
  useEffect(() => {
    setCsoInfo(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setCsoInfo(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setCsoInfo(null);
    } else {
      setModal(true);
    }
  };
  const handleCsoInfoClick = (arg) => {
    const csoInfo = arg;
    setCsoInfo({
      cso_id: csoInfo.cso_id,
      cso_name: csoInfo.cso_name,
      cso_code: csoInfo.cso_code,
      cso_address: csoInfo.cso_address,
      cso_phone: Number(csoInfo.cso_phone.toString().replace(/^(\+?251)/, "")),
      cso_email: csoInfo.cso_email,
      cso_website: csoInfo.cso_website,
      cso_description: csoInfo.cso_description,
      is_deletable: csoInfo.is_deletable,
      is_editable: csoInfo.is_editable,
    });
    setIsEdit(true);
    toggle();
  };
  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (csoInfo) => {
    setCsoInfo(csoInfo);
    setDeleteModal(true);
  };
  const handleCsoInfoClicks = () => {
    setIsEdit(false);
    setCsoInfo("");
    toggle();
  }
  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };
  //START UNCHANGED
  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: '',
        accessorKey: 'cso_name',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_name, 30) ||
                '-'}
            </span>
          );
        },
      },
      {
        header: '',
        accessorKey: 'cso_code',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_code, 30) ||
                '-'}
            </span>
          );
        },
      },
      {
        header: '',
        accessorKey: 'cso_address',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_address, 30) ||
                '-'}
            </span>
          );
        },
      },
      {
        header: '',
        accessorKey: 'cso_phone',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_phone, 30) ||
                '-'}
            </span>
          );
        },
      },
      {
        header: '',
        accessorKey: 'cso_email',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_email, 30) ||
                '-'}
            </span>
          );
        },
      },
      {
        header: '',
        accessorKey: 'cso_website',
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.cso_website, 30) ||
                '-'}
            </span>
          );
        },
      },
      // {
      //   header: '',
      //   accessorKey: 'cso_description',
      //   enableColumnFilter: false,
      //   enableSorting: true,
      //   cell: (cellProps) => {
      //     return (
      //       <span>
      //         {truncateText(cellProps.row.original.cso_description, 30) ||
      //           '-'}
      //       </span>
      //     );
      //   },
      // },
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
                    handleCsoInfoClick(data);
                  }}
                >
                  <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                  <UncontrolledTooltip placement="top" target="edittooltip">
                    Edit
                  </UncontrolledTooltip>
                </Link>
              )}
            </div>
          );
        },
      });
    }
    return baseColumns;
  }, [handleCsoInfoClick, toggleViewModal, onClickDelete]);

  if (isError) {
    <FetchErrorHandler error={error} refetch={refetch} />
  }
  return (
    <React.Fragment>
      <CsoInfoModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteCsoInfo}
        onCloseClick={() => setDeleteModal(false)}
        isLoading={deleteCsoInfo.isPending}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs
            title={t("cso_info")}
            breadcrumbItem={t("cso_info")}
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
                      handleUserClick={handleCsoInfoClicks}
                      isPagination={true}
                      SearchPlaceholder={26 + " " + t("Results") + "..."}
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
              {!!isEdit ? (t("edit") + " " + t("cso_info")) : (t("add") + " " + t("cso_info"))}
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
                    <Label>{t('cso_name')}</Label>
                    <Input
                      name='cso_name'
                      type='text'
                      placeholder={t('cso_name')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_name || ''}
                      invalid={
                        validation.touched.cso_name &&
                          validation.errors.cso_name
                          ? true
                          : false
                      }
                    />
                    {validation.touched.cso_name &&
                      validation.errors.cso_name ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className='col-md-6 mb-3'>
                    <Label>{t('cso_code')}</Label>
                    <Input
                      name='cso_code'
                      type='text'
                      placeholder={t('cso_code')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_code || ''}
                      invalid={
                        validation.touched.cso_code &&
                          validation.errors.cso_code
                          ? true
                          : false
                      }
                    />
                    {validation.touched.cso_code &&
                      validation.errors.cso_code ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_code}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className='col-md-6 mb-3'>
                    <Label>{t('cso_address')}</Label>
                    <Input
                      name='cso_address'
                      type='text'
                      placeholder={t('cso_address')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_address || ''}
                      invalid={
                        validation.touched.cso_address &&
                          validation.errors.cso_address
                          ? true
                          : false
                      }
                    />
                    {validation.touched.cso_address &&
                      validation.errors.cso_address ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_address}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <Label>
                      Phone Number <span className="text-danger">*</span>
                    </Label>
                    <InputGroup>
                      <InputGroupText>{"+251"}</InputGroupText>
                      <Input
                        name="cso_phone"
                        type="text"
                        placeholder="Enter phone number"
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          let formattedValue = inputValue.replace(/^0/, "");
                          formattedValue = formattedValue.replace(/[^\d]/g, "");
                          formattedValue = formattedValue.substring(0, 9);
                          validation.setFieldValue(
                            "cso_phone",
                            formattedValue
                          );
                        }}
                        onBlur={validation.handleBlur}
                        value={validation.values.cso_phone}
                        invalid={
                          validation.touched.cso_phone &&
                          !!validation.errors.cso_phone
                        }
                      />
                      {validation.touched.cso_phone &&
                        validation.errors.cso_phone ? (
                        <FormFeedback type="invalid">
                          {validation.errors.cso_phone}
                        </FormFeedback>
                      ) : null}
                    </InputGroup>
                  </Col>
                  <Col className='col-md-6 mb-3'>
                    <Label>{t('cso_email')}</Label>
                    <Input
                      name='cso_email'
                      type='text'
                      placeholder={t('cso_email')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_email || ''}
                      invalid={
                        validation.touched.cso_email &&
                          validation.errors.cso_email
                          ? true
                          : false
                      }
                    />
                    {validation.touched.cso_email &&
                      validation.errors.cso_email ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_email}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className='col-md-6 mb-3'>
                    <Label>{t('cso_website')}</Label>
                    <Input
                      name='cso_website'
                      type='text'
                      placeholder={t('cso_website')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_website || ''}
                      invalid={
                        validation.touched.cso_website &&
                          validation.errors.cso_website
                          ? true
                          : false
                      }
                    />
                    {validation.touched.cso_website &&
                      validation.errors.cso_website ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_website}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className='col-md-12 mb-3'>
                    <Label>{t('cso_description')}</Label>
                    <Input
                      name='cso_description'
                      type='textarea'
                      rows={4}
                      placeholder={t('cso_description')}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.cso_description || ''}
                      invalid={
                        validation.touched.cso_description &&
                          validation.errors.cso_description
                          ? true
                          : false
                      }
                      maxLength={200}
                    />
                    {validation.touched.cso_description &&
                      validation.errors.cso_description ? (
                      <FormFeedback type='invalid'>
                        {validation.errors.cso_description}
                      </FormFeedback>
                    ) : null}
                  </Col>

                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addCsoInfo.isPending || updateCsoInfo.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addCsoInfo.isPending ||
                            updateCsoInfo.isPending ||
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
                            addCsoInfo.isPending ||
                            updateCsoInfo.isPending ||
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
CsoInfoModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default CsoInfoModel;