import React, {
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "./ag-grid.css";
import { useTranslation } from "react-i18next";
import { useFetchBudgetYears, usePopulateBudgetYears } from "../../queries/budgetyear_query";
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
  Badge,
  Card,
  CardBody,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import {
  alphanumericValidation,
} from "../../utils/Validation/validation";
import classnames from "classnames";
import { toast } from "react-toastify";
import DatePicker from "../../components/Common/DatePicker";
import TableContainer2 from "../../components/Common/TableContainer2";
import {
  useAddBudgetRequest,
  useUpdateBudgetRequest,
  useDeleteBudgetRequest,
  useFetchBudgetRequests
} from "../../queries/budget_request_query";
import BudgetRequestRegistration from "../Budgetrequest/BudgetRequestRegistration"

const ProjectTabs = ({ projects, handleAddClick, handleEditClick }) => {
  const [activeTab, setactiveTab] = useState(1)
  const [passedSteps, setPassedSteps] = useState([1])
  const [selectedProject, setSelectedProject] = useState(null)
  const { t } = useTranslation()

  function toggleTab(tab) {
    if (activeTab !== tab) {
      var modifiedSteps = [...passedSteps, tab]
      if (tab >= 1 && tab <= 4) {
        setactiveTab(tab)
        setPassedSteps(modifiedSteps)
      }
    }
  }

  const isNextButtonDisabled = () => {
    if (activeTab === 1 && !selectedProject) {
      return true;
    }
    return false;
  };

  const projectColumns = useMemo(() => {
    const baseColumns = [
      {
        header: t("Select"),
        accessorKey: "Select",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              <input
                type="radio"
                name="selectedRow"
                checked={selectedProject == cellProps.row.original.prj_id}
                onChange={() => setSelectedProject(cellProps.row.original.prj_id)}
              />
            </span>
          );
        },
      },
      {
        header: t("prj_name"),
        accessorKey: "prj_name",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.footer ? t("Total") : cellProps.getValue()}
            </span>
          );
        },
      },
      {
        header: t("prj_code"),
        accessorKey: "prj_code",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          return (
            <span>
              {cellProps.row.original.footer ? t("Total") : cellProps.getValue()}
            </span>
          );
        },
      },
      {
        header: t("prj_project_status_id"),
        accessorKey: "prj_project_status_id",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const badgeClass = cellProps.row.original.color_code;
          return (
            <Badge className={`font-size-12 badge-soft-${badgeClass}`}>
              {cellProps.row.original.status_name}
            </Badge>
          );
        },
      },
      {
        header: t("prj_total_estimate_budget"),
        accessorKey: "prj_total_estimate_budget",
        enableSorting: true,
        enableColumnFilter: false,
        cell: (cellProps) => {
          const value = cellProps.getValue();
          return (
            <span>
              {cellProps.row.original.footer
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
        cell: (cellProps) => {
          if (cellProps.row.original.footer) {
            return "";
          }
          const { prj_id } = cellProps.row.original || {};
          return (
            <Link to={`/projectdetail_cso/${prj_id}#proposal_request`} target="_blank" >
              <Button type="button" className="btn-sm mb-1 default" outline>
                <i className="fa fa-eye"></i>
              </Button>
            </Link>
          );
        },
      }
    ];
    if (
      projects?.previledge?.is_role_editable == 1 ||
      projects?.previledge?.is_role_deletable == 1
    ) {
      baseColumns.push({
        header: t("Action"),
        accessorKey: t("Action"),
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              {(projects?.previledge?.is_role_editable == 1 && cellProps.row.original?.is_editable == 1 && cellProps.row.original.prj_project_status_id == 1) && (
                <Link
                  to="#"
                  className="text-success"
                  onClick={() => {
                    const data = cellProps.row.original;
                    handleEditClick(data);
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
  }, [projects, t, selectedProject]);

  return (
    <Col lg="12">
      <Card>
        <CardBody>
          <h4 className="card-title mb-4"></h4>
          <div className="wizard clearfix">
            <div className="steps clearfix">
              <ul>
                <NavItem
                  className={classnames({ current: activeTab === 1 })}
                >
                  <NavLink
                    className={classnames({ current: activeTab === 1 })}
                    onClick={() => {
                      setactiveTab(1)
                    }}
                    disabled={!(passedSteps || []).includes(1)}
                  >
                    <span className="number">1.</span> Projects
                  </NavLink>
                </NavItem>
                <NavItem
                  className={classnames({ current: activeTab === 2 })}
                >
                  <NavLink
                    className={classnames({ active: activeTab === 2 })}
                    onClick={() => {
                      setactiveTab(2)
                    }}
                    disabled={!(passedSteps || []).includes(2)}
                  >
                    <span className="number">2.</span> Proposal
                    Request
                  </NavLink>
                </NavItem>
              </ul>
            </div>
            <div className="content clearfix">
              <TabContent activeTab={activeTab} className="body">
                <TabPane tabId={1}>
                  <TableContainer2
                    columns={projectColumns}
                    data={projects?.data || []}
                    isAddButton={projects?.previledge?.is_role_can_add == 1}
                    isCustomPageSize={true}
                    handleUserClick={handleAddClick}
                    isPagination={true}
                    SearchPlaceholder={t("filter_placeholder")}
                    buttonClass="btn btn-success waves-effect waves-light mb-2 me-2 addOrder-modal"
                    buttonName={t("add") + " " + t("project")}
                    tableClass="table-sm align-middle table-nowrap dt-responsive nowrap w-100 table-check dataTable no-footer dtr-inline"
                    // theadClass="table-light"
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                    excludeKey={["is_editable", "is_deletable"]} // will be used by export to excel and pdf components
                    tableName="Project Data" // will be used by export to excel and pdf components
                    isExcelExport={true}
                    isPdfExport={true}
                  />
                </TabPane>
                <TabPane tabId={2}>
                  <BudgetRequestRegistration projectId={selectedProject} isActive={activeTab == 2} />
                </TabPane>
              </TabContent>
            </div>
            <div className="actions clearfix">
              <ul>
                <li>
                  <Button
                    color="primary"
                    onClick={() => {
                      toggleTab(activeTab - 1)
                    }}
                    disabled={activeTab == 1}
                  >
                    Previous
                  </Button>
                </li>
                <li className={""}>
                  {activeTab === 2 ? (
                    <Button
                      type="submit"
                      color="primary"
                      disabled
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      color="primary"
                      onClick={() => {
                        toggleTab(activeTab + 1);
                      }}
                      disabled={isNextButtonDisabled()}
                    >
                      Next
                    </Button>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default ProjectTabs