import React, { useMemo, useState, useCallback, lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "../../hooks/useAuthUser";
import {
  Button,
  Col,
  Row,
  UncontrolledTooltip,
  Badge,
  Card,
  CardBody,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import classnames from "classnames";
import { useSearchProjects, useFindProjects } from "../../queries/cso_project_query";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
const TableContainer = lazy(() => import("../../components/Common/TableContainer"));
const BudgetRequestRegistration = lazy(() => import("../Csobudgetrequest/BudgetRequestRegistration"));

const ProjectTabs = ({ program, handleAddClick, handleEditClick, handleTabChange }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(1);
  const [passedSteps, setPassedSteps] = useState([1]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programName, setProgramName] = useState(null)
  const [selectedProgramStatus, setSelectedProgramStatus] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null)

  useEffect(() => {
    handleTabChange(activeTab, selectedProgram)
  }, [activeTab, selectedProgram])

  const { user: storedUser, isLoading: authLoading, userId } = useAuthUser();

  const param = { object_type_id: 5, parent_id: selectedProgram }
  const isValidParam = Object.keys(param).length > 0 &&
    Object.values(param).every((value) => value !== null && value !== undefined);

  const { data, isLoading, isError, error, refetch } = useFindProjects(param, isValidParam, userId)

  const toggleTab = useCallback((tab) => {
    if (activeTab !== tab) {
      setPassedSteps((prevSteps) => [...prevSteps, tab]);
      if (tab >= 1 && tab <= 4) {
        setActiveTab(tab);
      }
    }
  }, [activeTab]);

  const isNextButtonDisabled = useCallback(() => {
    return !selectedProgram;
  }, [selectedProgram]);

  const programColumns = useMemo(() => {
    const baseColumns = [
      {
        header: t("Select"),
        accessorKey: "Select",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <span>
            <input
              type="radio"
              name="selectedRow"
              checked={selectedProgram === row.original.prj_id}
              onChange={() => {
                setSelectedProgram(row.original.prj_id);
                setSelectedProgramStatus(row.original.prj_project_status_id); // Set selected project status
                setProgramName(row.original.prj_name);
              }}
            />
          </span>
        ),
      },
      {
        header: "Program Name",
        accessorKey: "prj_name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => (
          <span>{row.original.footer ? t("Total") : getValue()}</span>
        ),
      },
      {
        header: t("prj_code"),
        accessorKey: "prj_code",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => (
          <span>{row.original.footer ? t("Total") : getValue()}</span>
        ),
      },
      {
        header: t("prj_project_status_id"),
        accessorKey: "prj_project_status_id",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Badge className={`font-size-12 badge-soft-${row.original.color_code}`}>
            {row.original.status_name}
          </Badge>
        ),
      },
      {
        header: t("prj_total_estimate_budget"),
        accessorKey: "prj_total_estimate_budget",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => {
          const value = getValue();
          return (
            <span>
              {row.original.footer
                ? value
                  ? `$${value.toLocaleString()}`
                  : ""
                : value
                  ? `${value.toLocaleString()}`
                  : ""}
            </span>
          );
        },
      },
      {
        header: t("view_details"),
        accessorKey: "view_details",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          if (row.original.footer) return "";
          const { prj_id } = row.original || {};
          return (
            <Link to={`/projectdetail_cso/${prj_id}#proposal_request`} target="_blank">
              <Button type="button" className="btn-sm mb-1 default" outline>
                <i className="fa fa-eye"></i>
              </Button>
            </Link>
          );
        },
      }
    ];

    if (program?.previledge?.is_role_editable === 1 || program?.previledge?.is_role_deletable === 1) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: "Action",
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="d-flex gap-3">
            {(program?.previledge?.is_role_editable === 1 && row.original?.is_editable === 1 && row.original.prj_project_status_id === 1) && (
              <Link
                to="#"
                className="text-success"
                onClick={() => handleEditClick(row.original)}
              >
                <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                <UncontrolledTooltip placement="top" target="edittooltip">
                  Edit
                </UncontrolledTooltip>
              </Link>
            )}
          </div>
        ),
      });
    }
    return baseColumns;
  }, [program, t, selectedProgram]);

  const activitiesColumn = useMemo(() => {
    const baseColumns = [
      {
        header: t("prj_name"),
        accessorKey: "prj_name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => (
          <span>{row.original.footer ? t("Total") : getValue()}</span>
        ),
      },
      {
        header: t("prj_code"),
        accessorKey: "prj_code",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => (
          <span>{row.original.footer ? t("Total") : getValue()}</span>
        ),
      },
      {
        header: t("prj_project_status_id"),
        accessorKey: "prj_project_status_id",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Badge className={`font-size-12 badge-soft-${row.original.color_code}`}>
            {row.original.status_name}
          </Badge>
        ),
      },
      {
        header: t("prj_total_estimate_budget"),
        accessorKey: "prj_total_estimate_budget",
        enableSorting: true,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => {
          const value = getValue();
          return (
            <span>
              {row.original.footer
                ? value
                  ? `$${value.toLocaleString()}`
                  : ""
                : value
                  ? `${value.toLocaleString()}`
                  : ""}
            </span>
          );
        },
      },
      {
        header: t("view_details"),
        accessorKey: "view_details",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          if (row.original.footer) return "";
          const { prj_id } = row.original || {};
          return (
            <Link to={`/projectdetail_cso/${prj_id}#proposal_request`} target="_blank">
              <Button type="button" className="btn-sm mb-1 default" outline>
                <i className="fa fa-eye"></i>
              </Button>
            </Link>
          );
        },
      }
    ];

    if (program?.previledge?.is_role_editable === 1 || program?.previledge?.is_role_deletable === 1) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: "Action",
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="d-flex gap-3">
            {(program?.previledge?.is_role_editable === 1 && row.original?.is_editable === 1 && row.original.prj_project_status_id === 1) && (
              <Link
                to="#"
                className="text-success"
                onClick={() => handleEditClick(row.original)}
              >
                <i className="mdi mdi-pencil font-size-18" id="edittooltip" />
                <UncontrolledTooltip placement="top" target="edittooltip">
                  Edit
                </UncontrolledTooltip>
              </Link>
            )}
          </div>
        ),
      });
    }
    return baseColumns;
  }, [program, t, selectedProgram]);

  if (isError) {
    return <FetchErrorHandler error={error} refetch={refetch} />
  }

  return (
    <Col lg="12">
      <Card>
        <CardBody>
          <h4 className="card-title mb-4"></h4>
          <div className="wizard clearfix">
            <div className="actions clearfix">
              <ul>
                <li>
                  <Button
                    color="primary"
                    onClick={() => toggleTab(activeTab - 1)}
                    disabled={activeTab === 1}
                  >
                    Previous
                  </Button>
                </li>
                <li>
                  <Button
                    color="primary"
                    onClick={() => toggleTab(activeTab + 1)}
                    disabled={isNextButtonDisabled() || activeTab === 3}
                  >
                    Next
                  </Button>
                </li>
              </ul>
            </div>
            <div className="steps clearfix">
              <ul>
                <NavItem className={classnames({ current: activeTab === 1 })}>
                  <NavLink
                    className={classnames({ current: activeTab === 1 })}
                    onClick={() => setActiveTab(1)}
                    disabled={!passedSteps.includes(1)}
                  >
                    <span className="number">1.</span> Programs
                  </NavLink>
                </NavItem>
                <NavItem className={classnames({ current: activeTab === 2 })}>
                  <NavLink
                    className={classnames({ active: activeTab === 2 })}
                    onClick={() => setActiveTab(2)}
                    disabled={!passedSteps.includes(2)}
                  >
                    <span className="number">2.</span> Activities
                  </NavLink>
                </NavItem>
                <NavItem className={classnames({ current: activeTab === 3 })}>
                  <NavLink
                    className={classnames({ active: activeTab === 3 })}
                    onClick={() => setActiveTab(3)}
                    disabled={!passedSteps.includes(3)}
                  >
                    <span className="number">3.</span> Proposal Request
                  </NavLink>
                </NavItem>
              </ul>
            </div>
            <div className="content clearfix">
              <TabContent activeTab={activeTab} className="body">
                <TabPane tabId={1}>
                  {programName && (
                    <h5 className="mb-3 text-primary">
                      {t("Selected program")}: {programName}
                    </h5>
                  )}
                  <Suspense fallback={<div>Loading...</div>}>
                    <TableContainer
                      columns={programColumns}
                      data={program?.data || []}
                      isAddButton={program?.previledge?.is_role_can_add === 1}
                      isCustomPageSize
                      handleUserClick={handleAddClick}
                      isPagination
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={`${t("add")} ${t("program")}`}
                      tableClass="table-sm align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                      pagination="pagination"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      excludeKey={["is_editable", "is_deletable", "Select"]}
                      tableName="Project Data"
                      isExcelExport
                      isPdfExport
                    />
                  </Suspense>
                </TabPane>
                <TabPane tabId={2}>
                  {programName && (
                    <h5 className="mb-3 text-primary">
                      {t("Activities for the program")}: {programName}
                    </h5>
                  )}
                  <Suspense fallback={<div>Loading...</div>}>
                    <TableContainer
                      columns={activitiesColumn}
                      data={data?.data || []}
                      isLoading={isLoading}
                      isAddButton={data?.previledge?.is_role_can_add === 1}
                      isCustomPageSize
                      handleUserClick={handleAddClick}
                      isPagination
                      SearchPlaceholder={t("filter_placeholder")}
                      buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                      buttonName={`${t("add")} ${t("Actitvity")}`}
                      tableClass="table-sm align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                      pagination="pagination"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      excludeKey={["is_editable", "is_deletable", "Select"]}
                      tableName="Project Data"
                      isExcelExport
                      isPdfExport
                    />
                  </Suspense>
                </TabPane>
                <TabPane tabId={3}>
                  {programName && (
                    <h5 className="mb-3 text-primary">
                      {t("Proposal request for the program")}: {programName}
                    </h5>
                  )}
                  <Suspense fallback={<div>Loading...</div>}>
                    <BudgetRequestRegistration projectStatus={selectedProgramStatus} projectId={selectedProgram} isActive={activeTab === 2} />
                  </Suspense>
                </TabPane>
              </TabContent>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  );
};

export default ProjectTabs;