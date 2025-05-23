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

const ProjectComponentModal = (props) => {
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
            {t('pcm_project_id')}: <span className="text-primary">{transaction.pcm_project_id}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pcm_component_name')}: <span className="text-primary">{transaction.pcm_component_name}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pcm_unit_measurement')}: <span className="text-primary">{transaction.pcm_unit_measurement}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pcm_amount')}: <span className="text-primary">{transaction.pcm_amount}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pcm_description')}: <span className="text-primary">{transaction.pcm_description}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pcm_status')}: <span className="text-primary">{transaction.pcm_status}</span>
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
ProjectComponentModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  transaction: PropTypes.object,
};
export default ProjectComponentModal;
