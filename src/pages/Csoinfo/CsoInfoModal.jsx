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

const CsoInfoModal = (props) => {
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
              {t('cso_name')}: <span className="text-primary">{transaction.cso_name}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_code')}: <span className="text-primary">{transaction.cso_code}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_address')}: <span className="text-primary">{transaction.cso_address}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_phone')}: <span className="text-primary">{transaction.cso_phone}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_email')}: <span className="text-primary">{transaction.cso_email}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_website')}: <span className="text-primary">{transaction.cso_website}</span>
            </p>
          </tr>
          <tr>
            <p className="mb-2">
              {t('cso_description')}: <span className="text-primary">{transaction.cso_description}</span>
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
CsoInfoModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  transaction: PropTypes.object,
};
export default CsoInfoModal;
