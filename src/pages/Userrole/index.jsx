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
  getUserRole as onGetUserRole,
  addUserRole as onAddUserRole,
  updateUserRole as onUpdateUserRole,
  deleteUserRole as onDeleteUserRole,
} from "../../store/userrole/actions";

import { getRoles as onGetRoles } from "../../store/roles/actions";
//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
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
  InputGroup,
} from "reactstrap";
import { ToastContainer } from "react-toastify";
import DynamicDetailsModal from "../../components/Common/DynamicDetailsModal";

const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};

const UserRoleModel = (props) => {
  const { passedId } = props;
  //meta title
  document.title = " UserRole";

  const { t } = useTranslation();

  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [userRole, setUserRole] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false); // Search-specific loading state
  const [showSearchResults, setShowSearchResults] = useState(false); // To determine if search results should be displayed

  const dispatch = useDispatch();

  // Fetch UserRole on component mount
  useEffect(() => {
    dispatch(onGetUserRole(passedId));
    dispatch(onGetRoles());
  }, [dispatch]);

  const userRoleProperties = createSelector(
    (state) => state.UserRoleR, // this is geting from  reducer
    (UserRoleReducer) => ({
      // this is from Project.reducer
      userRole: UserRoleReducer.userRole,
      loading: UserRoleReducer.loading,
      update_loading: UserRoleReducer.update_loading,
    })
  );

  const {
    userRole: { data, previledge },
    loading,
    update_loading,
  } = useSelector(userRoleProperties);

  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,
    initialValues: {
      url_user_id: (userRole && userRole.url_user_id) || "",
      url_role_id: userRole && userRole.url_role_id,
      url_description: (userRole && userRole.url_description) || "",
      url_status: userRole && userRole.url_status,
      is_deletable: (userRole && userRole.is_deletable) || 1,
      is_editable: (userRole && userRole.is_editable) || 1,
    },

    validationSchema: Yup.object({
      url_role_id: Yup.number()
        .required(t("url_role_id"))
        .test("unique-role-id", t("Already exists"), (value) => {
          return !data.some(
            (item) =>
              item.url_role_id == value && item.url_id !== userRole?.url_id
          );
        }),
      // url_user_id: Yup.string().required(t("url_user_id")),
      url_description: Yup.string().required(t("url_description")),
      url_status: Yup.string().required(t("url_status")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateUserRole = {
          url_id: userRole ? userRole.url_id : 0,
          url_role_id: values.url_role_id,
          url_user_id: values.url_user_id,
          url_description: values.url_description,
          url_status: values.url_status,

          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
        };
        // update UserRole
        dispatch(onUpdateUserRole(updateUserRole));
        validation.resetForm();
      } else {
        const newUserRole = {
          url_user_id: passedId,
          url_description: values.url_description,
          url_status: values.url_status,
          url_role_id: Number(values.url_role_id),
        };

        dispatch(onAddUserRole(newUserRole));
        validation.resetForm();
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);

  // console.log("user role ..", userRole);

  const rolesProperties = createSelector(
    (state) => state.RolesR, // this is geting from  reducer
    (RolesReducer) => ({
      // this is from Project.reducer
      roles: RolesReducer.roles,
      loading: RolesReducer.loading,
      update_loading: RolesReducer.update_loading,
    })
  );

  const {
    roles: { data: roledata, previledge: rolepreviledge },
    loading: roleloading,
    update_loading: roleupdate_loading,
  } = useSelector(rolesProperties);

  const roleDataMap = useMemo(() => {
    return roledata.reduce((acc, role) => {
      acc[role.rol_id] = role.rol_name;
      return acc;
    }, {});
  }, [roledata]);

  useEffect(() => {
    setModal(false);
  }, [update_loading]);

  const selectSearchProperties = createSelector(
    (state) => state.search,
    (search) => ({
      results: search.results,
    })
  );

  const { results } = useSelector(selectSearchProperties);

  const [isLoading, setLoading] = useState(loading);

  useEffect(() => {
    setUserRole(data);
  }, [data]);

  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setUserRole(data);
      setIsEdit(false);
    }
  }, [data]);

  const toggle = () => {
    if (modal) {
      setModal(false);
      setUserRole(null);
    } else {
      setModal(true);
    }
  };

  const handleUserRoleClick = (arg) => {
    const userRole = arg;
    setUserRole({
      url_id: userRole.url_id,
      url_role_id: userRole.url_role_id,
      url_user_id: userRole.url_user_id,
      url_description: userRole.url_description,
      url_role_name: userRole.rol_name,
      url_status: userRole.url_status,
      is_deletable: userRole.is_deletable,
      is_editable: userRole.is_editable,
    });

    setIsEdit(true);

    toggle();
  };

  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);

  const onClickDelete = (userRole) => {
    setUserRole(userRole);
    setDeleteModal(true);
  };

  const handleDeleteUserRole = () => {
    if (userRole && userRole.url_id) {
      dispatch(onDeleteUserRole(userRole.url_id));
      dispatch(onGetUserRole(passedId));
      setDeleteModal(false);
    }
  };
  const handleUserRoleClicks = () => {
    setIsEdit(false);
    setUserRole("");
    toggle();
  };
  const handleSearch = () => {
    setSearchLoading(true); // Set loading to true when search is initiated// Update filtered data with search results
    setShowSearchResults(true); // Show search results
    setSearchLoading(false);
  };

  const handleClearSearch = () => {
    setShowSearchResults(false);
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: "",
        accessorKey: "url_role_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return <span>{roleDataMap[cellProps.row.original.url_role_id]}</span>;
        },
      },
      {
        header: "",
        accessorKey: "url_description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <span>
              {truncateText(cellProps.row.original.url_description, 30) || "-"}
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
    if (previledge?.is_role_editable && previledge?.is_role_deletable) {
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
                    handleUserRoleClick(data);
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
  }, [handleUserRoleClick, toggleViewModal, onClickDelete]);

  return (
    <React.Fragment>
      <DynamicDetailsModal
        isOpen={modal1}
        toggle={toggleViewModal} // Function to close the modal
        data={transaction} // Pass transaction as data to the modal
        title="View User Role Details"
        description={transaction.url_description}
        fields={[
          { label: "Role Name", key: "rol_name" },
          { label: "Status", key: "url_status" },
          { label: "Is Deletable", key: "is_deletable" },
          { label: "Is Editable", key: "is_editable" },
        ]}
        footerText="Close"
      />
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteUserRole}
        onCloseClick={() => setDeleteModal(false)}
      />

      {isLoading || searchLoading ? (
        <Spinners setLoading={setLoading} />
      ) : (
        <TableContainer
          columns={columns}
          data={showSearchResults ? results : data}
          isGlobalFilter={true}
          isAddButton={true}
          isCustomPageSize={true}
          handleUserClick={handleUserRoleClicks}
          isPagination={true}
          // SearchPlaceholder="26 records..."
          SearchPlaceholder={26 + " " + t("Results") + "..."}
          buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
          buttonName={t("add") + " " + t("user_role")}
          tableClass="align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
          theadClass="table-light"
          pagination="pagination"
          paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
        />
      )}
      <Modal isOpen={modal} toggle={toggle} className="modal-xl">
        <ModalHeader toggle={toggle} tag="h4">
          {!!isEdit
            ? t("edit") + " " + t("user_role")
            : t("add") + " " + t("user_role")}
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
                <Label>{t("url_role_id")}</Label>

                <Input
                  name="url_role_id"
                  type="select"
                  className="form-select"
                  onChange={(e) => {
                    validation.setFieldValue(
                      "url_role_id",
                      Number(e.target.value)
                    );
                  }}
                  onBlur={validation.handleBlur}
                  value={validation.values.url_role_id}
                  invalid={
                    validation.touched.url_role_id &&
                    Boolean(validation.errors.url_role_id)
                  }
                >
                  <option value={null}>Select Role</option>
                  {roledata.map((option) => (
                    <option key={option.rol_id} value={option.rol_id}>
                      {t(`${option.rol_name}`)}
                    </option>
                  ))}
                </Input>
                {validation.touched.url_role_id &&
                validation.errors.url_role_id ? (
                  <FormFeedback type="invalid">
                    {validation.errors.url_role_id}
                  </FormFeedback>
                ) : null}
              </Col>

              <Col className="col-md-6 mb-3">
                <Label>{t("url_description")}</Label>
                <Input
                  name="url_description"
                  type="textarea"
                  placeholder={t("url_description")}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.url_description || ""}
                  invalid={
                    validation.touched.url_description &&
                    validation.errors.url_description
                      ? true
                      : false
                  }
                  maxLength={20}
                />
                {validation.touched.url_description &&
                validation.errors.url_description ? (
                  <FormFeedback type="invalid">
                    {validation.errors.url_description}
                  </FormFeedback>
                ) : null}
              </Col>
              <Col className="col-md-6 mb-3">
                <Label>{t("url_status")}</Label>
                <Input
                  name="url_status"
                  type="select"
                  className="form-select"
                  onChange={(e) => {
                    validation.setFieldValue(
                      "url_status",
                      Number(e.target.value)
                    );
                  }}
                  onBlur={validation.handleBlur}
                  value={validation.values.url_status}
                  invalid={
                    validation.touched.url_status &&
                    Boolean(validation.errors.url_status)
                  }
                >
                  <option value={null}>Select status</option>
                  <option value={1}>{t("Active")}</option>
                  <option value={0}>{t("Inactive")}</option>
                </Input>
                {validation.touched.url_status &&
                validation.errors.url_status ? (
                  <FormFeedback type="invalid">
                    {validation.errors.url_status}
                  </FormFeedback>
                ) : null}
              </Col>
            </Row>
            <Row>
              <Col>
                <div className="text-end">
                  {update_loading ? (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={update_loading || !validation.dirty}
                    >
                      <Spinner size={"sm"} color="#fff" />
                      {t("Save")}
                    </Button>
                  ) : (
                    <Button
                      color="success"
                      type="submit"
                      className="save-user"
                      disabled={update_loading || !validation.dirty}
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
    </React.Fragment>
  );
};
UserRoleModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default UserRoleModel;
