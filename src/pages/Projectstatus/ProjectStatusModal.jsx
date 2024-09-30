import React, { useTransition } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
} from "reactstrap"

const modalStyle = {
  width: '100%',
  height: '100%',
};

const ProjectStatusModal = (props) => {
  const { t } = useTranslation();
  const { isOpen, toggle, transaction } = props;

  return (
    <Modal
      isOpen={isOpen}
      role="dialog"
      autoFocus={true}
      centered={true}
      className="modal-xl"
      tabIndex="-1"
      toggle={toggle}
      style={modalStyle}
    >
      <div className="modal-xl">
        <ModalHeader toggle={toggle}>{t("View Details")}</ModalHeader>
        <ModalBody>
        <tr>
                    <p className="mb-2">
            {t('prs_status_name_or')}: <span className="text-primary">{transaction.prs_status_name_or}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_status_name_am')}: <span className="text-primary">{transaction.prs_status_name_am}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_status_name_en')}: <span className="text-primary">{transaction.prs_status_name_en}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_color_code')}: <span className="text-primary">{transaction.prs_color_code}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_order_number')}: <span className="text-primary">{transaction.prs_order_number}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_description')}: <span className="text-primary">{transaction.prs_description}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_status')}: <span className="text-primary">{transaction.prs_status}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('prs_spare_column')}: <span className="text-primary">{transaction.prs_spare_column}</span>
          </p>
          </tr>

          {transaction.is_deletable === 1 && (
            <p className="text-danger">data is deletable</p>
          )}
          
          {transaction.is_editable === 1 && (
            <p className="text-success">Editable</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" color="secondary" onClick={toggle}>
            {t('Close')}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};
ProjectStatusModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  transaction: PropTypes.object,
};
export default ProjectStatusModal;