import { useTranslation } from 'react-i18next'
import { Spinner, Modal, ModalBody, ModalHeader, Form, FormGroup, Label, Input, Button, Row, Col } from 'reactstrap'
import * as Yup from "yup";
import { useFormik } from "formik";
import { useUpdateBudgetRequestApproval } from "../../../queries/budget_request_query";
import { toast } from "react-toastify"
import DatePicker from "../../../components/Common/DatePicker";
import FormattedAmountField from '../../../components/Common/FormattedAmountField';

const ApproveModal = ({ isOpen, toggle, request, toggleParent, action }) => {
  const { t } = useTranslation()
  const { mutateAsync, isPending } = useUpdateBudgetRequestApproval();
  const handleUpdateBudgetRequest = async (data) => {
    try {
      await mutateAsync(data);
      toast.success(t("update_success"), {
        autoClose: 2000,
      });
    } catch (error) {
      toast.error(t("update_failure"), {
        autoClose: 2000,
      });
    }
    toggle();
    toggleParent()
  };
  const validationSchema = Yup.object().shape({
    bdr_released_amount: action === "approve"
      ? Yup.number()
        .required("Released amount is required")
        .min(0, "Released amount must be greater or equal to 0")
        .max(request.bdr_requested_amount,
          `Can not release more than requested, ${parseFloat(request.bdr_requested_amount).toLocaleString()}`)
      : Yup.number().optional(),

    bdr_physical_approved: action === "approve"
      ? Yup.number()
        .required("Physical approved amount is required")
        .min(0, "Must be greater or equal to 0")
        .max(100, "Must be less or equal to 100")
      : Yup.number().optional(),

    bdr_financial_recommended: action === "recommend"
      ? Yup.number()
        .required("Financial recommended amount is required")
        .min(0, "Must be greater or equal to 0")
        .max(parseFloat(request.bdr_requested_amount),
          `Recommended amount must be less or equal to the Requested amount, ${parseFloat(request.bdr_requested_amount).toLocaleString()}`)
      : Yup.number().optional(),

    bdr_physical_recommended: action === "recommend"
      ? Yup.number()
        .required("Physical recommended amount is required")
        .min(0, "Must be greater or equal to 0")
        .max(100, "Recommended physical must be less or equal to 100")
      : Yup.number().optional(),

    bdr_released_date_gc: Yup.date().required("Action date is required"),
    bdr_action_remark: Yup.string().required("Action remark is required"),
  });

  const formik = useFormik({
    initialValues: {
      bdr_id: request.bdr_id || "",
      bdr_request_status: action === "recommend" ? 2 : action === "approve" ? 3 : 4,
      bdr_released_amount: action === "approve" ? request.bdr_released_amount || "" : "",
      bdr_physical_approved: action === "approve" ? request.bdr_physical_approved || "" : "",
      bdr_financial_recommended: action === "recommend" ? request.bdr_financial_recommended || "" : "",
      bdr_physical_recommended: action === "recommend" ? request.bdr_physical_recommended || "" : "",
      bdr_released_date_gc: request.bdr_released_date_gc || "",
      bdr_action_remark: request.bdr_action_remark || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      handleUpdateBudgetRequest(values);
      formik.resetForm();
      toggle();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      centered
      className=""
      toggle={toggle}
      size='lg'
    >
      <ModalHeader toggle={toggle}>{action === "recommend" ? t("Recommend") : action === "approve" ? t("Approve") : t("Reject")}</ModalHeader>
      <ModalBody>
        <Form onSubmit={formik.handleSubmit}>
          <Row>
            {action === "approve" && (
              <Col md={6}>
                <small className="text-muted">
                  Recommended: {request.bdr_financial_recommended ?? "N/A"}
                </small>
                <FormattedAmountField
                  validation={formik}
                  fieldId={"bdr_released_amount"}
                  isRequired={true}
                  className="col-md-12 mb-3"
                  allowDecimal={true}
                />
              </Col>
            )}
            {action === "approve" && (
              <Col md={6}>
                <small className="text-muted">
                  Recommended: {request.bdr_physical_recommended ?? "N/A"}
                </small>
                <FormattedAmountField
                  validation={formik}
                  fieldId={"bdr_physical_approved"}
                  label={t("bdr_physical_approved") + " " + t("in_percent")}
                  isRequired={true}
                  className="col-md-12 mb-3"
                  allowDecimal={true}
                />
              </Col>
            )}
          </Row>
          <Row>
            {action === "recommend" && (
              <FormattedAmountField
                validation={formik}
                fieldId={"bdr_financial_recommended"}
                isRequired={true}
                className="col-md-6 mb-3"
                allowDecimal={true}
              />
            )}
            {action === "recommend" && (
              <FormattedAmountField
                validation={formik}
                fieldId={"bdr_physical_recommended"}
                label={t("bdr_physical_recommended") + " " + t("in_percent")}
                isRequired={true}
                className="col-md-6 mb-3"
                allowDecimal={true}
              />
            )}
          </Row>
          <FormGroup>
            <DatePicker
              isRequired={true}
              componentId={"bdr_released_date_gc"}
              validation={formik}
              minDate={request?.bdr_requested_date_gc}
              label={action === "approve" ? "bdr_released_date_gc" : action === "reject" ? "Rejection Date" : "Recommendation Date"}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t("bdr_action_remark")}</Label>
            <Input
              type="textarea"
              name="bdr_action_remark"
              rows={4}
              onChange={formik.handleChange}
              value={formik.values.bdr_action_remark}
              invalid={
                formik.touched.bdr_action_remark &&
                  formik.errors.bdr_action_remark
                  ? true
                  : false
              }
            />
            {formik.errors.bdr_action_remark &&
              formik.touched.bdr_action_remark && (
                <div className="text-danger">
                  {formik.errors.bdr_action_remark}
                </div>
              )}
          </FormGroup>
          <div className='d-flex gap-2 align-items-center justify-content-end'>
            <Button type="button" color="secondary" onClick={toggle}>
              {t("Close")}
            </Button>
            <Button
              type="submit"
              color={action === "recommend" ? "primary" : action === "approve" ? "success" : "danger"}
              className="w-md"
              disabled={isPending}
            >
              <span className="flex align-items-center justify-content-center">
                {isPending ? <Spinner size={"sm"} /> : ""}
                <span className="ms-2">{action === "recommend" ? t("Recommend") : action === "approve" ? t("Approve") : t("Reject")}</span>
              </span>
            </Button>
          </div>
        </Form>
      </ModalBody>
    </Modal>
  )
}

export default ApproveModal