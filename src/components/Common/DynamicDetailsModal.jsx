import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
  Col,
  Row,
} from "reactstrap";

const modalStyle = {
  width: "100%",
  height: "100%",
};

const DynamicDetailsModal = (props) => {
  const { t } = useTranslation();
  const {
    isOpen,
    toggle,
    data,
    fields,
    title,
    description,
    footerText,
    modalClassName,
    dateInGC,
    dateInEC,
  } = props;

  const renderTableRows = () => {
    // Ensure that fields is an array and data (transaction) is an object
    if (Array.isArray(fields) && typeof data === "object") {
      return fields.map((field, index) => (
        <tr key={index}>
          <th scope="row">{field.label} :</th>
          <td>
            {typeof data[field.key] === "number"
              ? data[field.key].toLocaleString()
              : data && data[field.key]
              ? data[field.key]
              : "N/A"}
          </td>
        </tr>
      ));
    }
    return null; // Return null if fields or data are not valid
  };

  return (
    <Modal
      isOpen={isOpen}
      role="dialog"
      autoFocus={true}
      centered={true}
      className={modalClassName || "modal-xl"}
      tabIndex="-1"
      toggle={toggle}
      style={modalStyle}
    >
      <div className={modalClassName || "modal-xl"}>
        <ModalHeader toggle={toggle}>{t(title)}</ModalHeader>
        <ModalBody>
          <div className="d-flex">
            <div className="flex-grow-1 overflow-hidden">
              <h5 className="text-truncate font-size-15">{t("Description")}</h5>
              <p className="text-muted">{description || "N/A"}</p>
            </div>
          </div>

          <h5 className="font-size-15 mt-4">{t("Details")}</h5>

          <div className="text-muted mt-4">
            <Table className="table-nowrap mb-0">
              <tbody>{renderTableRows()}</tbody>
            </Table>
          </div>

          {/* Static date fields */}
          <Row className="task-dates justify-content-center">
            {dateInEC && (
              <Col sm="4" xs="6">
                <div className="mt-4 text-center">
                  <h5 className="font-size-14">
                    <i className="bx bx-calendar me-1 text-primary" /> Date in
                    Ethiopian Calendar
                  </h5>
                  <p className="text-muted mb-0">{dateInEC}</p>
                </div>
              </Col>
            )}

            {dateInGC && (
              <Col sm="4" xs="6">
                <div className="mt-4 text-center">
                  <h5 className="font-size-14">
                    <i className="bx bx-calendar-check me-1 text-primary" />{" "}
                    Date in Gregorian Calendar
                  </h5>
                  <p className="text-muted mb-0">{dateInGC}</p>
                </div>
              </Col>
            )}
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button type="button" color="secondary" onClick={toggle}>
            {t(footerText || "Close")}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

DynamicDetailsModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  data: PropTypes.object, // Ensure data is an object
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
    })
  ).isRequired,
  title: PropTypes.string,
  footerText: PropTypes.string,
  modalClassName: PropTypes.string,
};

export default DynamicDetailsModal;
