import React, { useMemo, useCallback, lazy, Suspense } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  FormGroup,
  Label,
  Input,
  Spinner,
} from "reactstrap";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useUpdateBudgetRequestApproval } from "../../queries/budget_request_query";
import { useFetchRequestStatuss } from "../../queries/requeststatus_query";
import { useAuthUser } from "../../hooks/useAuthUser";
import { toast } from "react-toastify";
import { createSelectOptions } from "../../utils/commonMethods";
import { TabWrapper } from "../../components/Common/DetailViewWrapper";
import { useFetchProject } from "../../queries/project_query";
import DatePicker from "../../components/Common/DatePicker";

const RequestFollowupModel = lazy(() => import("../Requestfollowup"));
const AssignCsoRequests = lazy(() => import("./AssignCsoRequests"));

const ApproverBudgetRequestListModal = ({ isOpen, toggle, transaction, budgetYearMap = {} }) => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useUpdateBudgetRequestApproval();
  const { data: statusData } = useFetchRequestStatuss();

  const statusOptions = useMemo(
    () => createSelectOptions(statusData?.data || [], "rqs_id", "rqs_name_en"),
    [statusData]
  );

  const getStatusOption = useCallback(
    (value) => statusOptions.find((option) => option.value === value) || null,
    [statusOptions]
  );

  const projectId = transaction?.bdr_project_id;
  const { user: storedUser, isLoading: authLoading, userId } = useAuthUser();
  const { data: project } = useFetchProject(projectId, userId, isOpen);

  const handleUpdateBudgetRequest = async (data) => {
    try {
      await mutateAsync(data);
      toast.success(t("add_success"), { autoClose: 2000 });
    } catch (error) {
      toast.error(t("add_failure"), { autoClose: 2000 });
    }
    toggle();
  };

  const validationSchema = Yup.object().shape({
    bdr_request_status: Yup.string().required("Status is required"),
    bdr_released_amount: Yup.number()
      .min(0, "Released amount must be greater or equal to 0")
      .max(transaction.bdr_requested_amount, "Cannot release more than requested")
      .when("bdr_request_status", {
        is: "Accepted",
        then: (schema) => schema.required("Released amount is required"),
      }),
    bdr_released_date_gc: Yup.date().required("Action date is required"),
    bdr_action_remark: Yup.string().required("Action remark is required"),
  });

  const formik = useFormik({
    initialValues: {
      bdr_id: transaction.bdr_id || "",
      bdr_request_status: transaction.bdr_request_status || "",
      bdr_released_amount:
        transaction.bdr_request_status == 2 ? transaction.bdr_released_amount || "" : "",
      bdr_released_date_gc: transaction.bdr_released_date_gc || "",
      bdr_action_remark: transaction.bdr_action_remark || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      handleUpdateBudgetRequest(values);
      formik.resetForm();
      toggle();
    },
  });

  const handleStatusChange = useCallback(
    (selectedOption) => {
      formik.setFieldValue("bdr_request_status", selectedOption.value);
    },
    [formik]
  );

  const tabs = useMemo(
    () => [
      {
        id: "take_action",
        label: t("take_action"),
        content: (
          <Row>
            <Col xl={5}>
              <Card>
                <CardBody>
                  <h5 className="fw-semibold">Overview</h5>
                  <Table>
                    <tbody>
                      {[[t("Year"), budgetYearMap[transaction.bdr_budget_year_id]],
                      [t("prj_total_estimate_budget"), project?.data?.prj_total_estimate_budget],
                      [t("bdr_requested_date_gc"), transaction.bdr_requested_date_gc],
                      [t("bdr_description"), transaction.bdr_description]].map(([label, value]) => (
                        <tr key={label}>
                          <th>{label}</th>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
            <Col xl={7}>
              <Card>
                <CardBody>
                  <h5 className="fw-semibold">Take Action</h5>
                  <form onSubmit={formik.handleSubmit}>
                    <FormGroup>
                      <Label>Status</Label>
                      <Select
                        name="bdr_request_status"
                        options={statusOptions}
                        value={getStatusOption(formik.values.bdr_request_status)}
                        onChange={handleStatusChange}
                      />
                    </FormGroup>
                    <FormGroup>
                      <DatePicker isRequired componentId="bdr_released_date_gc" validation={formik} />
                    </FormGroup>
                    <FormGroup>
                      <Label>Action Remark</Label>
                      <Input
                        type="textarea"
                        name="bdr_action_remark"
                        rows={4}
                        onChange={formik.handleChange}
                        value={formik.values.bdr_action_remark}
                      />
                    </FormGroup>
                    <Button type="submit" color="primary" className="w-md" disabled={isPending}>
                      {isPending ? <Spinner size="sm" className="me-2" /> : null} Submit
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ),
      },
      { id: "request_followup", label: t("request_follow_up"), content: <Suspense fallback={<Spinner />}><RequestFollowupModel request={transaction} /></Suspense> },
      { id: "Assign", label: "Assign", content: <Suspense fallback={<Spinner />}><AssignCsoRequests request={transaction} isActive={isOpen} budgetYearMap={budgetYearMap} /></Suspense> },
    ],
    [transaction, budgetYearMap, project, statusOptions, handleStatusChange]
  );

  return (
    <Modal isOpen={isOpen} centered className="modal-xl" toggle={toggle}>
      <ModalHeader toggle={toggle}>{t("take_action")}</ModalHeader>
      <ModalBody><TabWrapper tabs={tabs} /></ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>{t("Close")}</Button>
      </ModalFooter>
    </Modal>
  );
};
export default ApproverBudgetRequestListModal;