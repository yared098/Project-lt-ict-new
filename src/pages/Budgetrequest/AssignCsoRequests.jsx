import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Col,
  Input,
  Label,
  Row,
  Spinner,
  Table,
  FormFeedback,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import CascadingDropdowns from "../../components/Common/CascadingDropdowns1";
import { useUpdateProject, useFetchProject } from "../../queries/project_query";
import { useFetchSectorInformations } from "../../queries/sectorinformation_query";
import { createMultiSelectOptions } from "../../utils/commonMethods";

const AssignCsoRequests = ({ request, isActive, budgetYearMap }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const projectId = request?.bdr_project_id;
  const storedUser = JSON.parse(localStorage.getItem("authUser"));
  const userId = storedUser?.user.usr_id;

  const { data: project, isLoading: isProjectLoading } = useFetchProject(projectId, userId, isActive);
  const { data: sectorData } = useFetchSectorInformations();

  const sectorOptions = createMultiSelectOptions(sectorData?.data || [], "sci_id", ["sci_name_en", "sci_name_or", "sci_name_am"]);
  const { mutateAsync, isPending } = useUpdateProject();

  const validationSchema = Yup.object().shape({
    prj_sector_id: Yup.string().required(t("prj_sector_id")),
    prj_owner_region_id: Yup.string().required(t("prj_owner_region_id")),
    prj_owner_zone_id: Yup.string().required(t("prj_owner_zone_id")),
    prj_owner_woreda_id: Yup.string().required(t("prj_owner_woreda_id")),
  });

  const formik = useFormik({
    initialValues: {
      prj_id: projectId,
      prj_owner_region_id: project?.data?.prj_owner_region_id || "",
      prj_owner_zone_id: project?.data?.prj_owner_zone_id || "",
      prj_owner_woreda_id: project?.data?.prj_owner_woreda_id || "",
      prj_sector_id: project?.data?.prj_sector_id || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await mutateAsync(values);
        toast.success(t("add_success"), { autoClose: 2000 });
        formik.resetForm();
      } catch (error) {
        toast.error(t("add_failure"), { autoClose: 2000 });
      }
    },
  });

  return (
    <Row>
      <Col xl={5}>
        <Card>
          <CardBody>
            <h5 className="fw-semibold">Overview</h5>
            <Table>
              <tbody>
                {[
                  [t("Year"), budgetYearMap[request.bdr_budget_year_id]],
                  [t("prj_total_estimate_budget"), project?.data?.prj_total_estimate_budget],
                  [t("prj_start_date_plan_gc"), project?.data?.prj_start_date_plan_gc],
                  [t("prj_end_date_plan_gc"), project?.data?.prj_end_date_plan_gc],
                  [t("bdr_requested_date_gc"), request.bdr_requested_date_gc],
                  [t("bdr_description"), request.bdr_description],
                ].map(([label, value]) => (
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
            <CardTitle className="mb-4">Assign</CardTitle>
            <form onSubmit={formik.handleSubmit}>
              <Row>
                <Col xl={12} className="mb-3">
                  <CascadingDropdowns
                    validation={formik}
                    dropdown1name="prj_owner_region_id"
                    dropdown2name="prj_owner_zone_id"
                    dropdown3name="prj_owner_woreda_id"
                  />
                </Col>
                <Col xl={12} className="mb-3">
                  <Label>
                    {t("prj_sector_id")} <span className="text-danger">*</span>
                  </Label>
                  <Input
                    name="prj_sector_id"
                    type="select"
                    className="form-select"
                    {...formik.getFieldProps("prj_sector_id")}
                    invalid={formik.touched.prj_sector_id && !!formik.errors.prj_sector_id}
                  >
                    <option value="">{t("prj_select_category")}</option>
                    {sectorOptions[`sci_name_${lang}`]?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.label)}
                      </option>
                    ))}
                  </Input>
                  {formik.touched.prj_sector_id && formik.errors.prj_sector_id && (
                    <FormFeedback>{formik.errors.prj_sector_id}</FormFeedback>
                  )}
                </Col>
              </Row>
              <Button type="submit" color="primary" className="w-md" disabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner size="sm" /> <span className="ms-2">Submit</span>
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

AssignCsoRequests.propTypes = {
  request: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  budgetYearMap: PropTypes.object.isRequired,
};

export default AssignCsoRequests;
