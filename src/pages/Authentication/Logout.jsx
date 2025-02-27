import React, { useEffect } from "react";
import withRouter from "../../components/Common/withRouter";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("authUser");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  }, []);

  return <></>;
};

export default withRouter(Logout);
