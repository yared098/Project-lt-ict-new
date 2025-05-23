import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { before, isEmpty, update } from "lodash";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner, Table } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useFetchProgramInfos, useSearchProgramInfos, useAddProgramInfo, useDeleteProgramInfo, useUpdateProgramInfo } from "../../queries/programinfo_cso_query";
import { useTranslation } from "react-i18next";
import Spinners from "../../components/Common/Spinner";
import {
  Button,
  Col,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Input,
  FormFeedback,
  Label,
} from "reactstrap";
import {
  alphanumericValidation,
} from "../../utils/Validation/validation";
import { toast } from "react-toastify";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import ProjectTabs from "./ProjectTabs2";

const ProjectModel = () => {
  document.title = "Programs";
  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } =
    useFetchProgramInfos();
  const addProgramInfo = useAddProgramInfo();
  const updateProgramInfo = useUpdateProgramInfo();
  const deleteProgramInfo = useDeleteProgramInfo();
  //START CRUD
  const handleAddProgramInfo = async (data) => {
    try {
      await addProgramInfo.mutateAsync(data);
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
  const handleUpdateProgramInfo = async (data) => {
    try {
      await updateProgramInfo.mutateAsync(data);
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
  const handleDeleteProgramInfo = async () => {
    if (programInfo && programInfo.pri_id) {
      try {
        const id = programInfo.pri_id;
        await deleteProgramInfo.mutateAsync(id);
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
      pri_owner_region_id: 1,
      pri_owner_zone_id: 1,
      pri_owner_woreda_id: 1,
      pri_sector_id: 1,
      pri_name_or: (programInfo && programInfo.pri_name_or) || "",
      pri_name_am: (programInfo && programInfo.pri_name_am) || "",
      pri_name_en: (programInfo && programInfo.pri_name_en) || "",
      pri_program_code: (programInfo && programInfo.pri_program_code) || "",
      pri_description: (programInfo && programInfo.pri_description) || "",
      pri_status: (programInfo && programInfo.pri_status) || "",
      is_deletable: (programInfo && programInfo.is_deletable) || 1,
      is_editable: (programInfo && programInfo.is_editable) || 1
    },
    validationSchema: Yup.object({
      pri_owner_region_id: Yup.number().required(t('pri_owner_region_id')),
      pri_owner_zone_id: Yup.number().required(t('pri_owner_zone_id')),
      pri_owner_woreda_id: Yup.number().required(t('pri_owner_woreda_id')),
      pri_sector_id: Yup.number().required(t('pri_sector_id')),
      pri_name_or: alphanumericValidation(2, 100, true),
      pri_name_am: alphanumericValidation(2, 100, true),
      pri_name_en: alphanumericValidation(2, 100, true),
      pri_program_code: alphanumericValidation(2, 10, true),
      pri_description: alphanumericValidation(2, 100, false),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateProgramInfo = {
          pri_id: programInfo?.pri_id,
          pri_owner_region_id: 1,
          pri_owner_zone_id: 1,
          pri_owner_woreda_id: 1,
          pri_sector_id: 1,
          pri_name_or: values.pri_name_or,
          pri_name_am: values.pri_name_am,
          pri_name_en: values.pri_name_en,
          pri_program_code: values.pri_program_code,
          pri_description: values.pri_description,
          pri_status: values.pri_status,
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update ProgramInfo
        handleUpdateProgramInfo(updateProgramInfo);
      } else {
        const newProgramInfo = {
          pri_owner_region_id: 1,
          pri_owner_zone_id: 1,
          pri_owner_woreda_id: 1,
          pri_sector_id: 1,
          pri_name_or: values.pri_name_or,
          pri_name_am: values.pri_name_am,
          pri_name_en: values.pri_name_en,
          pri_program_code: values.pri_program_code,
          pri_description: values.pri_description,
          pri_status: values.pri_status,
        };
        // save new ProgramInfo
        handleAddProgramInfo(newProgramInfo);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  // Fetch ProgramInfo on component mount
  useEffect(() => {
    setProgramInfo(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setProgramInfo(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setProgramInfo(null);
    } else {
      setModal(true);
    }
  };
  const handleProgramInfoClick = (arg) => {
    const programInfo = arg;
    setProgramInfo({
      pri_id: programInfo.pri_id,
      pri_name_or: programInfo.pri_name_or,
      pri_name_am: programInfo.pri_name_am,
      pri_name_en: programInfo.pri_name_en,
      pri_program_code: programInfo.pri_program_code,
      pri_description: programInfo.pri_description,
      pri_status: programInfo.pri_status,
      is_deletable: programInfo.is_deletable,
      is_editable: programInfo.is_editable,
    });
    setIsEdit(true);
    toggle();
  };
  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (programInfo) => {
    setProgramInfo(programInfo);
    setDeleteModal(true);
  };
  const handleProgramInfoClicks = () => {
    setIsEdit(false);
    setProgramInfo("");
    toggle();
  }
  const handleSearch = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <div>
          <Breadcrumbs />
          <div className="w-100 d-flex gap-2">
            <>
              <div className="w-100">
                <AdvancedSearch
                  searchHook={useSearchProgramInfos}
                  textSearchKeys={["pri_name_en"]}
                  checkboxSearchKeys={[]}
                  // additionalParams={projectParams}
                  // setAdditionalParams={setProjectParams}
                  setSearchResults={setSearchResults}
                  setShowSearchResult={setShowSearchResult}
                // params={params}
                // setParams={setParams}
                // searchParams={searchParams}
                // setSearchParams={setSearchParams}
                />
                {isLoading ?
                  <Spinners /> :
                  <ProjectTabs
                    projects={data}
                    handleAddClick={handleProgramInfoClicks}
                    handleEditClick={handleProgramInfoClick}
                  />}
                <Modal isOpen={modal} toggle={toggle} className="modal-xl">
                  <ModalHeader toggle={toggle} tag="h4">
                    {!!isEdit ? (t("edit") + " " + t("program_info")) : (t("add") + " " + t("program_info"))}
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
                          <Label>{t('pri_name_or')}<span className="text-danger">*</span></Label>
                          <Input
                            name='pri_name_or'
                            type='text'
                            placeholder={t('pri_name_or')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.pri_name_or || ''}
                            invalid={
                              validation.touched.pri_name_or &&
                                validation.errors.pri_name_or
                                ? true
                                : false
                            }
                            maxLength={20}
                          />
                          {validation.touched.pri_name_or &&
                            validation.errors.pri_name_or ? (
                            <FormFeedback type='invalid'>
                              {validation.errors.pri_name_or}
                            </FormFeedback>
                          ) : null}
                        </Col>
                        <Col className='col-md-6 mb-3'>
                          <Label>{t('pri_name_am')}<span className="text-danger">*</span></Label>
                          <Input
                            name='pri_name_am'
                            type='text'
                            placeholder={t('pri_name_am')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.pri_name_am || ''}
                            invalid={
                              validation.touched.pri_name_am &&
                                validation.errors.pri_name_am
                                ? true
                                : false
                            }
                            maxLength={20}
                          />
                          {validation.touched.pri_name_am &&
                            validation.errors.pri_name_am ? (
                            <FormFeedback type='invalid'>
                              {validation.errors.pri_name_am}
                            </FormFeedback>
                          ) : null}
                        </Col>
                        <Col className='col-md-6 mb-3'>
                          <Label>{t('pri_name_en')}<span className="text-danger">*</span></Label>
                          <Input
                            name='pri_name_en'
                            type='text'
                            placeholder={t('pri_name_en')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.pri_name_en || ''}
                            invalid={
                              validation.touched.pri_name_en &&
                                validation.errors.pri_name_en
                                ? true
                                : false
                            }
                            maxLength={20}
                          />
                          {validation.touched.pri_name_en &&
                            validation.errors.pri_name_en ? (
                            <FormFeedback type='invalid'>
                              {validation.errors.pri_name_en}
                            </FormFeedback>
                          ) : null}
                        </Col>
                        <Col className='col-md-6 mb-3'>
                          <Label>{t('pri_program_code')}<span className="text-danger">*</span></Label>
                          <Input
                            name='pri_program_code'
                            type='text'
                            placeholder={t('pri_program_code')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.pri_program_code || ''}
                            invalid={
                              validation.touched.pri_program_code &&
                                validation.errors.pri_program_code
                                ? true
                                : false
                            }
                            maxLength={20}
                          />
                          {validation.touched.pri_program_code &&
                            validation.errors.pri_program_code ? (
                            <FormFeedback type='invalid'>
                              {validation.errors.pri_program_code}
                            </FormFeedback>
                          ) : null}
                        </Col>
                        <Col className='col-md-12 mb-3'>
                          <Label>{t('pri_description')}</Label>
                          <Input
                            name='pri_description'
                            type='textarea'
                            rows={4}
                            placeholder={t('pri_description')}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.pri_description || ''}
                            invalid={
                              validation.touched.pri_description &&
                                validation.errors.pri_description
                                ? true
                                : false
                            }
                            maxLength={20}
                          />
                          {validation.touched.pri_description &&
                            validation.errors.pri_description ? (
                            <FormFeedback type='invalid'>
                              {validation.errors.pri_description}
                            </FormFeedback>
                          ) : null}
                        </Col>
                      </Row>
                      <Row>
                        <Col>
                          <div className="text-end">
                            {addProgramInfo.isPending || updateProgramInfo.isPending ? (
                              <Button
                                color="success"
                                type="submit"
                                className="save-user"
                                disabled={
                                  addProgramInfo.isPending ||
                                  updateProgramInfo.isPending ||
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
                                  addProgramInfo.isPending ||
                                  updateProgramInfo.isPending ||
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
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
ProjectModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default ProjectModel;
