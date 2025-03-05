import React, { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { isEmpty, update } from "lodash";
import * as Yup from "yup";
import { useFormik } from "formik";
import { Spinner } from "reactstrap";
import Spinners from "../../components/Common/Spinner";
import CascadingDropdowns from "../../components/Common/CascadingDropdowns1";
import CascadingDropdownsearch from "../../components/Common/CascadingDropdowns2";
import CascadingDepartmentDropdowns from "./CascadingDepartmentDropdowns";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import UserRoles from "../../pages/Userrole/index";
import UserSectorModel from "../Usersector";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import AdvancedSearch from "../../components/Common/AdvancedSearch";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import {
  phoneValidation,
  alphanumericValidation,
  amountValidation,
  numberValidation,
  dropdownValidation,
} from "../../utils/Validation/validation";
import {
  useFetchUserss,
  useSearchUserss,
  useAddUsers,
  useDeleteUsers,
  useUpdateUsers,
} from "../../queries/users_query";
import { useFetchSectorInformations } from "../../queries/sectorinformation_query";
import { useFetchDepartments } from "../../queries/department_query";
import UsersModal from "./UsersModal";
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
  ModalFooter,
  Badge,
  InputGroup,
  InputGroupText,
  FormGroup
} from "reactstrap";
import { toast } from "react-toastify";
import Select from "react-select"
import RightOffCanvas from "../../components/Common/RightOffCanvas";
import { createSelectOptions } from "../../utils/commonMethods";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useFetchCsoInfos } from "../../queries/csoinfo_query";

//import ImageUploader from "../../components/Common/ImageUploader";
const truncateText = (text, maxLength) => {
  if (typeof text !== "string") {
    return text;
  }
  return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
};
const statusClasses = {
  1: "success", // Green for completed
  0: "danger", // Yellow for started
};
const statusText = {
  1: "Active", // Green for completed
  0: "Inactive", // Yellow for started
};
const UsersModel = () => {
  document.title = "Users | PMS";

  const { t } = useTranslation();
  const [modal, setModal] = useState(false);
  const [modal1, setModal1] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searcherror, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const { data, isLoading, error, isError, refetch } = useFetchUserss(null);
  const { data: sectorInformationData } = useFetchSectorInformations();
  const sectorInformationOptions = createSelectOptions(
    sectorInformationData?.data || [],
    "sci_id",
    "sci_name_en"
  );
  const sectorInformationMap = useMemo(() => {
    return (
      sectorInformationData?.data?.reduce((acc, sector) => {
        acc[sector.sci_id] = sector.sci_name_en;
        return acc;
      }, {}) || {}
    );
  }, [sectorInformationData]);
  const { data: departmentData } = useFetchDepartments();
  const departmentOptions = createSelectOptions(
    departmentData?.data || [],
    "dep_id",
    "dep_name_en"
  );
  const { data: csoData } = useFetchCsoInfos()
  const csoOptions = createSelectOptions(csoData?.data || [], "cso_id", "cso_name")

  const addUsers = useAddUsers();
  const updateUsers = useUpdateUsers();
  const deleteUsers = useDeleteUsers();
  const [users, setUsers] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const gridRef = useRef(null);
  const [userMetaData, setUserData] = useState({});
  const [showCanvas, setShowCanvas] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };
  //START CRUD
  const handleAddUsers = async (data) => {
    try {
      await addUsers.mutateAsync(data);
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
  const handleUpdateUsers = async (data) => {
    try {
      await updateUsers.mutateAsync(data);
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
  const handleDeleteUsers = async () => {
    if (users && users.usr_id) {
      try {
        const id = users.usr_id;
        await deleteUsers.mutateAsync(id);
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
  const handleSearchResults = ({ data, error }) => {
    setSearchResults(data);
    setSearchError(error);
    setShowSearchResult(true);
  };
  // validation
  const validation = useFormik({
    // enableReinitialize: use this flag when initial values need to be changed
    enableReinitialize: true,
    initialValues: {
      usr_email: (users && users.usr_email) || "",
      usr_password: (users && users.usr_password) || "",
      usr_full_name: (users && users.usr_full_name) || "",
      usr_phone_number: (users && users.usr_phone_number) || "",
      usr_role_id: (users && users.usr_role_id) || "",
      usr_region_id: (users && users.usr_region_id) || "",
      usr_zone_id: (users && users.usr_zone_id) || "",
      usr_woreda_id: (users && users.usr_woreda_id) || "",
      usr_sector_id: (users && users.usr_sector_id) || "",
      usr_is_active: (users && users.usr_is_active) || "",
      usr_picture: (users && users.usr_picture) || "",
      usr_last_logged_in: (users && users.usr_last_logged_in) || "",
      usr_ip: (users && users.usr_ip) || "",
      usr_remember_token: (users && users.usr_remember_token) || "",
      usr_notified: (users && users.usr_notified) || "",
      usr_description: (users && users.usr_description) || "",
      usr_status: (users && users.usr_status) || "",
      usr_department_id: (users && users.usr_department_id) || "",
      is_deletable: (users && users.is_deletable) || 1,
      is_editable: (users && users.is_editable) || 1,
      usr_directorate_id: (users && users.usr_directorate_id) || "",
      usr_team_id: (users && users.usr_team_id) || "",
      usr_officer_id: (users && users.usr_officer_id) || "",
      usr_owner_id: (users && users.usr_owner_id) || "",
    },
    validationSchema: Yup.object({
      usr_email: Yup.string()
        .required(t("usr_email"))
        .email(t("Invalid email format"))
        .test("unique-usr_email", t("Already exists"), (value) => {
          return !data?.data.some(
            (item) => item.usr_email === value && item.usr_id !== users?.usr_id
          );
        }),
      usr_password: !isEdit && Yup.string()
        .required(t("usr_password"))
        .min(8, t("Password must be at least 8 characters"))
        .matches(
          /[a-z]/,
          t("Password must contain at least one lowercase letter")
        )
        .matches(
          /[A-Z]/,
          t("Password must contain at least one uppercase letter")
        )
        .matches(/\d/, t("Password must contain at least one number"))
        .matches(
          /[@$!%*?&#]/,
          t("Password must contain at least one special character")
        ),
      usr_full_name: alphanumericValidation(3, 50, true),
      usr_phone_number: phoneValidation(true),
      usr_sector_id: dropdownValidation(1, 100, true),
      usr_department_id: dropdownValidation(1, 100, true),
      usr_region_id: Yup.number().required(t("usr_region_id")),
      // usr_zone_id: Yup.number().required(t("usr_zone_id")),
      //usr_woreda_id: Yup.number().required(t("usr_woreda_id")),
    }),
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: (values) => {
      if (isEdit) {
        const updateUsers = {
          usr_id: users?.usr_id,
          usr_email: values.usr_email,
          usr_full_name: values.usr_full_name,
          usr_phone_number: values.usr_phone_number,
          usr_role_id: values.usr_role_id,
          usr_region_id: Number(values.usr_region_id),
          usr_woreda_id: Number(values.usr_woreda_id),
          usr_zone_id: Number(values.usr_zone_id),
          usr_sector_id: Number(values.usr_sector_id),
          usr_is_active: Number(values.usr_is_active),
          usr_picture: values.usr_picture,
          usr_last_logged_in: values.usr_last_logged_in,
          usr_ip: values.usr_ip,
          usr_remember_token: values.usr_remember_token,
          usr_notified: Number(values.usr_notified),
          usr_description: values.usr_description,
          usr_status: values.usr_status,
          usr_department_id: Number(values.usr_department_id),
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
          usr_directorate_id: Number(values.usr_directorate_id),
          usr_team_id: Number(values.usr_team_id),
          usr_officer_id: Number(values.usr_officer_id),
          usr_owner_id: Number(values.usr_owner_id),
        };
        // update Users
        handleUpdateUsers(updateUsers);
      } else if (isDuplicateModalOpen) {
        const duplcateuser = {
          usr_email: "",
          usr_password: values.usr_password,
          usr_full_name: values.usr_full_name,
          usr_phone_number: values.usr_phone_number,
          usr_role_id: values.usr_role_id,
          usr_region_id: Number(values.usr_region_id),
          usr_zone_id: Number(values.usr_zone_id),
          usr_woreda_id: Number(values.usr_woreda_id),
          usr_sector_id: Number(values.usr_sector_id),
          usr_is_active: Number(values.usr_is_active),
          usr_picture: values.usr_picture,
          usr_last_logged_in: values.usr_last_logged_in,
          usr_ip: values.usr_ip,
          usr_remember_token: values.usr_remember_token,
          usr_notified: Number(values.usr_notified),
          usr_description: values.usr_description,
          usr_status: values.usr_status,
          usr_department_id: Number(values.usr_department_id),
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
          usr_directorate_id: Number(values.usr_directorate_id),
          usr_team_id: Number(values.usr_team_id),
          usr_officer_id: Number(values.usr_officer_id),
          usr_owner_id: Number(values.usr_owner_id),
        };
        // setSelectedDepartment(values.usr_department_id);
        // update Users
        handleAddUsers(duplcateuser);
      } else {
        const newUsers = {
          usr_email: values.usr_email,
          usr_password: values.usr_password,
          usr_full_name: values.usr_full_name,
          usr_phone_number: `+251${values.usr_phone_number}`,
          usr_role_id: Number(values.usr_role_id),
          usr_region_id: Number(values.usr_region_id),
          usr_zone_id: Number(values.usr_zone_id),
          usr_woreda_id: Number(values.usr_woreda_id),
          usr_sector_id: Number(values.usr_sector_id),
          usr_is_active: Number(values.usr_is_active),
          usr_picture: values.usr_picture,
          usr_last_logged_in: values.usr_last_logged_in,
          usr_ip: values.usr_ip,
          usr_remember_token: values.usr_remember_token,
          usr_notified: Number(values.usr_notified),
          usr_description: values.usr_description,
          //usr_status: Number(values.usr_status),
          usr_status: 1,
          usr_department_id: Number(values.usr_department_id),
          is_deletable: values.is_deletable,
          is_editable: values.is_editable,
          usr_directorate_id: Number(values.usr_directorate_id),
          usr_team_id: Number(values.usr_team_id),
          usr_officer_id: Number(values.usr_officer_id),
          usr_owner_id: Number(values.usr_owner_id),
        };
        handleAddUsers(newUsers);
      }
    },
  });
  const [transaction, setTransaction] = useState({});
  const toggleViewModal = () => setModal1(!modal1);
  useEffect(() => {
    setUsers(data);
  }, [data]);
  useEffect(() => {
    if (!isEmpty(data) && !!isEdit) {
      setUsers(data);
      setIsEdit(false);
    }
  }, [data]);
  const toggle = () => {
    if (modal) {
      setModal(false);
      setIsDuplicateModalOpen(false);
      setUsers(null);
    } else {
      setModal(true);
    }
  };
  const handleUsersClick = (arg) => {
    const user = arg;
    setUsers({
      usr_id: user.usr_id,
      usr_email: user.usr_email,
      usr_password: user.usr_password,
      usr_full_name: user.usr_full_name,
      usr_phone_number: Number(user.usr_phone_number.toString().replace(/^(\+?251)/, "")),
      usr_role_id: Number(user.usr_role_id),
      usr_region_id: Number(user.usr_region_id),
      usr_zone_id: Number(user.usr_zone_id),
      usr_woreda_id: Number(user.usr_woreda_id),
      usr_sector_id: Number(user.usr_sector_id),
      usr_is_active: user.usr_is_active,
      usr_picture: user.usr_picture,
      usr_last_logged_in: user.usr_last_logged_in,
      usr_ip: user.usr_ip,
      usr_remember_token: user.usr_remember_token,
      usr_notified: user.usr_notified,
      usr_description: user.usr_description,
      usr_status: user.usr_status,
      usr_department_id: Number(user.usr_department_id),
      is_deletable: user.is_deletable,
      is_editable: user.is_editable,
      usr_directorate_id: Number(user.usr_directorate_id),
      usr_team_id: Number(user.usr_team_id),
      usr_officer_id: Number(user.usr_officer_id),
      usr_owner_id: Number(user.usr_owner_id),
    });
    setIsEdit(true);
    toggle();
  };
  const handleUsersDuplicateClick = (arg) => {
    const users = arg;
    setUsers({
      usr_id: users.usr_id,
      usr_email: "",
      usr_password: users.usr_password,
      usr_full_name: users.usr_full_name,
      usr_phone_number: users.usr_phone_number,
      usr_role_id: Number(users.usr_role_id),
      usr_region_id: Number(users.usr_region_id),
      usr_woreda_id: Number(users.usr_woreda_id),
      usr_sector_id: Number(users.usr_sector_id),
      usr_is_active: users.usr_is_active,
      usr_picture: users.usr_picture,
      usr_last_logged_in: users.usr_last_logged_in,
      usr_ip: users.usr_ip,
      usr_remember_token: users.usr_remember_token,
      usr_notified: users.usr_notified,
      usr_description: users.usr_description,
      usr_status: users.usr_status,
      usr_department_id: Number(users.usr_department_id),
      is_deletable: users.is_deletable,
      is_editable: users.is_editable,
    });
    setIsDuplicateModalOpen(true);
    toggle();
  };
  //delete projects
  const [deleteModal, setDeleteModal] = useState(false);
  const onClickDelete = (users) => {
    setUsers(users);
    setDeleteModal(true);
  };
  const handleClick = (data) => {
    setShowCanvas(!showCanvas); // Toggle canvas visibility
    // setProjectMetaData(data);
    setUserData(data);
  };
  const handleUsersClicks = () => {
    setIsEdit(false);
    setUsers("");
    toggle();
  };

  const getStatusOption = (value) =>
    csoOptions.find((option) => option.value === value) || null;

  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        headerName: t("s_n"),
        valueGetter: "node.rowIndex + 1",
        flex: 1,
      },
      {
        headerName: t("usr_email"),
        field: "usr_email",
        sortable: true,
        filter: false,
        flex: 4,
        cellRenderer: (params) =>
          truncateText(params.data.usr_email, 30) || "-",
      },
      {
        headerName: t("usr_full_name"),
        field: "usr_full_name",
        sortable: true,
        filter: false,
        flex: 4,
        cellRenderer: (params) =>
          truncateText(params.data.usr_full_name, 30) || "-",
      },
      {
        headerName: t("usr_phone_number"),
        field: "usr_phone_number",
        sortable: true,
        filter: false,
        flex: 3,
        cellRenderer: (params) =>
          truncateText(params.data.usr_phone_number, 30) || "-",
      },
      {
        headerName: t("usr_sector_id"),
        field: "sector_name",
        sortable: true,
        filter: false,
        flex: 3,
        cellRenderer: (params) =>
          sectorInformationMap[params.data.usr_sector_id],
      },
      /*   {
        headerName: t("usr_is_active"),
        field: "usr_is_active",
        sortable: true,
        filter: false,
        cellRenderer: (params) => {
          // Determine badge class based on status value
          const badgeClass =
            statusClasses[params.data.usr_is_active] || "secondary";
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {statusText[params.value]}
            </Badge>
          );
        },
      },*/
      {
        headerName: t("view_detail"),
        flex: 2,
        sortable: true,
        filter: false,
        cellRenderer: (params) => (
          <Button
            type="button"
            color="primary"
            className="btn-sm"
            onClick={() => {
              const userdata = params.data;
              toggleViewModal(userdata);
              setTransaction(userdata);
            }}
          >
            {t("view_detail")}
          </Button>
        ),
      },
    ];
    if (
      /*data?.previledge?.is_role_editable &&
      data?.previledge?.is_role_deletable*/
      1 == 1
    ) {
      baseColumns.push({
        headerName: t("Action"),
        sortable: true,
        filter: false,
        flex: 2,
        cellRenderer: (params) => (
          <div className="d-flex gap-3">
            {(params.data?.is_editable || params.data?.is_role_editable) && (
              <Button
                size="sm"
                color="none"
                className="text-success"
                onClick={() => handleUsersClick(params.data)}
                type="button"
              >
                <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                <UncontrolledTooltip placement="top" target="edittooltip">
                  Edit
                </UncontrolledTooltip>
              </Button>
            )}
            {/* add view project  */}
            {params.data?.is_editable || params.data?.is_role_editable ? (
              <Link
                to="#"
                className="text-secondary ms-2"
                onClick={() => handleClick(params.data)}
              >
                <i className="mdi mdi-eye font-size-18" id="viewtooltip" />
                <UncontrolledTooltip placement="top" target="viewtooltip">
                  View
                </UncontrolledTooltip>
              </Link>
            ) : (
              ""
            )}
            {/* added duplicat  */}
            {/* Add duplicate project icon */}
            {(params.data?.is_editable == 90 && params.data?.is_role_editable) && (
              <Link
                to="#"
                className="text-primary"
                onClick={() => {
                  handleUsersDuplicateClick(params.data);
                }}
              >
                <i
                  className="mdi mdi-content-duplicate font-size-18"
                  id="duplicateTooltip"
                />
                <UncontrolledTooltip placement="top" target="duplicateTooltip">
                  Duplicate
                </UncontrolledTooltip>
              </Link>
            )}
            {/* End of duplicate project icon */}
          </div>
        ),
      });
    }
    return baseColumns;
  }, [
    handleUsersClick,
    toggleViewModal,
    onClickDelete,
    handleUsersDuplicateClick,
  ]);
  // When selection changes, update selectedRows
  const onSelectionChanged = () => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);
    setSelectedRows(selectedData);
  };
  // Filter by marked rows
  const filterMarked = () => {
    if (gridRef.current) {
      gridRef.current.api.setRowData(selectedRows);
    }
  };

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />;
  }

  return (
    <React.Fragment>
      <UsersModal
        isOpen={modal1}
        toggle={toggleViewModal}
        transaction={transaction}
      />
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title={t("users")} breadcrumbItem={t("users")} />
          <AdvancedSearch
            searchHook={useSearchUserss}
            textSearchKeys={["usr_email", "usr_phone_number"]}
            dropdownSearchKeys={[
              {
                key: "usr_sector_id",
                options: sectorInformationOptions,
              },
            ]}
            checkboxSearchKeys={[]}
            Component={CascadingDropdownsearch}
            component_params={{
              dropdown1name: "usr_region_id",
              dropdown2name: "usr_zone_id",
              dropdown3name: "usr_woreda_id",
            }}
            onSearchResult={handleSearchResults}
            setIsSearchLoading={setIsSearchLoading}
            setSearchResults={setSearchResults}
            setShowSearchResult={setShowSearchResult}
          />
          {isLoading || isSearchLoading ? (
            <Spinners top={"top-60"} />
          ) : (
            <div
              className="ag-theme-alpine"
              style={{ height: "100%", width: "100%" }}
            >
              {/* Row for search input and buttons */}
              <Row className="mb-3">
                <Col sm="12" md="6">
                  {/* Search Input for  Filter */}
                  <Input
                    type="text"
                    placeholder="Search..."
                    onChange={(e) => setQuickFilterText(e.target.value)}
                    className="mb-2"
                  />
                </Col>
                <Col sm="12" md="6" className="text-md-end">
                  <Button color="success" onClick={handleUsersClicks}>
                    {t("add")}
                  </Button>
                </Col>
              </Row>
              {/* AG Grid */}
              <div style={{ minHeight: "600px" }}>
                <AgGridReact
                  ref={gridRef}
                  rowData={
                    showSearchResult ? searchResults?.data : data?.data || []
                  }
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSizeSelector={[10, 20, 30, 40, 50]}
                  paginationPageSize={20}
                  quickFilterText={quickFilterText}
                  onSelectionChanged={onSelectionChanged}
                  rowHeight={30} // Set the row height here
                  animateRows={true} // Enables row animations
                  domLayout="autoHeight" // Auto-size the grid to fit content
                  onGridReady={(params) => {
                    params.api.sizeColumnsToFit(); // Size columns to fit the grid width
                  }}
                />
              </div>
            </div>
          )}
          <Modal isOpen={modal} toggle={toggle} className="modal-xl">
            <ModalHeader toggle={toggle} tag="h4">
              {isDuplicateModalOpen ? (
                t("Duplicate ") + " " + t("users")
              ) : (
                <div>
                  {!!isEdit
                    ? t("edit") + " " + t("users")
                    : t("add") + " " + t("users")}
                </div>
              )}
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
                      {t("usr_email")} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="usr_email"
                      type="text"
                      placeholder={t("usr_email")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.usr_email || ""}
                      invalid={
                        validation.touched.usr_email &&
                          validation.errors.usr_email
                          ? true
                          : false
                      }
                      maxLength={30}
                    />
                    {validation.touched.usr_email &&
                      validation.errors.usr_email ? (
                      <FormFeedback type="invalid">
                        {validation.errors.usr_email}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  {!isEdit &&
                    <Col className="col-md-4 mb-3">
                      <Label>
                        {t("usr_password")} <span className="text-danger">*</span>
                      </Label>
                      <InputGroup>
                        <Input
                          name="usr_password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("usr_password")}
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.usr_password || ""}
                          invalid={
                            validation.touched.usr_password &&
                              validation.errors.usr_password
                              ? true
                              : false
                          }
                          maxLength={20}
                        />
                        <InputGroupText
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer" }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </InputGroupText>
                        {validation.touched.usr_password &&
                          validation.errors.usr_password ? (
                          <FormFeedback type="invalid">
                            {validation.errors.usr_password}
                          </FormFeedback>
                        ) : null}
                      </InputGroup>
                    </Col>}
                  <Col className={`${isEdit ? "col-md-8" : "col-md-4"} mb-3`}>
                    <Label>
                      {t("usr_full_name")}{" "}
                      <span className="text-danger">*</span>
                    </Label>
                    <Input
                      name="usr_full_name"
                      type="text"
                      placeholder={t("usr_full_name")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.usr_full_name || ""}
                      invalid={
                        validation.touched.usr_full_name &&
                          validation.errors.usr_full_name
                          ? true
                          : false
                      }
                      maxLength={30}
                    />
                    {validation.touched.usr_full_name &&
                      validation.errors.usr_full_name ? (
                      <FormFeedback type="invalid">
                        {validation.errors.usr_full_name}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>
                      Phone Number <span className="text-danger">*</span>
                    </Label>
                    <InputGroup>
                      <InputGroupText>{"+251"}</InputGroupText>
                      <Input
                        name="usr_phone_number"
                        type="text"
                        placeholder="Enter phone number"
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          let formattedValue = inputValue.replace(/^0/, "");
                          formattedValue = formattedValue.replace(/[^\d]/g, "");
                          formattedValue = formattedValue.substring(0, 9);
                          validation.setFieldValue(
                            "usr_phone_number",
                            formattedValue
                          );
                        }}
                        onBlur={validation.handleBlur}
                        value={validation.values.usr_phone_number}
                        invalid={
                          validation.touched.usr_phone_number &&
                          !!validation.errors.usr_phone_number
                        }
                      />
                      {validation.touched.usr_phone_number &&
                        validation.errors.usr_phone_number ? (
                        <FormFeedback type="invalid">
                          {validation.errors.usr_phone_number}
                        </FormFeedback>
                      ) : null}
                    </InputGroup>
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <Label>{t("usr_sector_id")} <span className="text-danger">*</span></Label>
                    <Input
                      name="usr_sector_id"
                      type="select"
                      className="form-select"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.usr_sector_id || ""}
                      invalid={
                        validation.touched.usr_sector_id &&
                          validation.errors.usr_sector_id
                          ? true
                          : false
                      }
                    >
                      <option value="">{t("select_one")}</option>
                      {sectorInformationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`${option.label}`)}
                        </option>
                      ))}
                    </Input>
                    {validation.touched.usr_sector_id &&
                      validation.errors.usr_sector_id ? (
                      <FormFeedback type="invalid">
                        {validation.errors.usr_sector_id}
                      </FormFeedback>
                    ) : null}
                  </Col>
                  <Col className="col-md-4 mb-3">
                    <FormGroup>
                      <Label>{t("usr_owner_id")}</Label>
                      <Select
                        name="usr_owner_id"
                        options={csoOptions}
                        value={getStatusOption(validation.values.usr_owner_id)}
                        onChange={(selected) => validation.setFieldValue("usr_owner_id", selected.value)}
                        className="select2-selection"
                        invalid={
                          validation.touched.usr_owner_id &&
                            validation.errors.usr_owner_id
                            ? true
                            : false
                        }
                      />
                      {validation.errors.usr_owner_id &&
                        validation.touched.usr_owner_id && (
                          <div className="text-danger">
                            {validation.errors.usr_owner_id}
                          </div>
                        )}
                    </FormGroup>
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <CascadingDropdowns
                      validation={validation}
                      dropdown1name="usr_region_id"
                      dropdown2name="usr_zone_id"
                      dropdown3name="usr_woreda_id"
                      isEdit={isEdit}
                      required={true}
                    />
                  </Col>
                  <Col className="col-md-6 mb-3">
                    <CascadingDepartmentDropdowns
                      validation={validation}
                      dropdown1name="usr_department_id"
                      dropdown2name="usr_directorate_id"
                      dropdown3name="usr_team_id"
                      dropdown4name="usr_officer_id"
                      isEdit={isEdit}
                      required={true}
                    />
                  </Col>
                  {/*<ImageUploader validation={validation} />*/}

                  <Col className="col-md-12 mb-3">
                    <Label>{t("usr_description")}</Label>
                    <Input
                      name="usr_description"
                      type="textarea"
                      rows={4}
                      placeholder={t("usr_description")}
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.usr_description || ""}
                      invalid={
                        validation.touched.usr_description &&
                          validation.errors.usr_description
                          ? true
                          : false
                      }
                      maxLength={20}
                    />
                    {validation.touched.usr_description &&
                      validation.errors.usr_description ? (
                      <FormFeedback type="invalid">
                        {validation.errors.usr_description}
                      </FormFeedback>
                    ) : null}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      {addUsers.isPending || updateUsers.isPending ? (
                        <Button
                          color="success"
                          type="submit"
                          className="save-user"
                          disabled={
                            addUsers.isPending ||
                            updateUsers.isPending ||
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
                            addUsers.isPending ||
                            updateUsers.isPending ||
                            !validation.dirty
                          }
                        >
                          {isDuplicateModalOpen ? (
                            <div>{t("Save Duplicate")}</div>
                          ) : (
                            <div>{t("Save")}</div>
                          )}
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
            {isDuplicateModalOpen ? (
              <ModalFooter>
                <div className="text-center text-warning mb-4">
                  {t(
                    "This entry contains duplicate information. Please review and modify the form to avoid duplicates. If you still wish to proceed, click Save to add this user as a new entry."
                  )}
                </div>
              </ModalFooter>
            ) : null}
          </Modal>
        </div>
      </div>
      {showCanvas && (
        <RightOffCanvas
          handleClick={handleClick}
          showCanvas={showCanvas}
          canvasWidth={84}
          name={userMetaData.usr_name || "User Roles"}
          id={userMetaData.usr_id}
          components={{ "User Roles": UserRoles, "User Sector": UserSectorModel }}
        />
      )}
    </React.Fragment>
  );
};
UsersModel.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};
export default UsersModel;
