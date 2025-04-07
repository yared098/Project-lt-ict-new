import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectDashboard } from "../../helpers/Project_Backend";
import { withTranslation } from "react-i18next";
import SupersetDashboard from "../../pages/Dashboard/SupersetDashboard";
import Spinners from "../../components/Common/Spinner";
import FetchErrorHandler from "../../components/Common/FetchErrorHandler";
import ChangePasswordModal from "../../components/Common/ChangePasswordModal";
import { Col, Row, UncontrolledAlert } from "reactstrap";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  document.title = "Project Management System";
  const role = "Deputy";

  const { t } = useTranslation();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const authUser = JSON.parse(localStorage.getItem("authUser"));

  // Fetch data using TanStack Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projectDashboard", role],
    queryFn: () => getProjectDashboard({ role }),
  });

  if (isLoading) return <Spinners />;
  if (isError) return <FetchErrorHandler error={error} refetch={refetch} />;

  return (
    <div className="page-content">
      <div className="container-fluid1">
        <div className="row">
          {authUser?.user?.usr_password_changed === 0 && (
            <Row className="justify-content-center">
              <Col lg={12}>
                <UncontrolledAlert
                  color="warning"
                  className="alert-dismissible fade show"
                  role="alert"
                >
                  <i className="mdi mdi-alert-outline me-2"></i>{" "}
                  <strong>{t("notice")}:</strong>{" "}
                  {t("your_account_is_still_using_the")}{" "}
                  <strong>{t("administrator_assigned_password")}</strong>.{" "}
                  {t("for_security_reasons_please")}{" "}
                  <a
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="custom-link"
                    style={{ textDecoration: "underline", fontWeight: "bold" }}
                  >
                    {t("click_me_to_update_your_password")}
                  </a>{" "}
                  {t("promptly")}.
                </UncontrolledAlert>
              </Col>
            </Row>
          )}
          <ChangePasswordModal
            isOpen={isPasswordModalOpen}
            toggle={() => setIsPasswordModalOpen(!isPasswordModalOpen)}
            user={authUser}
          />

          {data.map((supersetPath, index) => (
            <div key={index}>
              {supersetPath ? (
                <SupersetDashboard dashboardPath={supersetPath.superset_url} />
              ) : (
                <div>Loading data...</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default withTranslation()(Dashboard);
