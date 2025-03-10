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

const ProjectBudgetExpenditureModal = (props) => {
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
            {t('pbe_reason')}: <span className="text-primary">{transaction.pbe_reason}</span>
          </p>
          </tr>
          <tr>
                    <p className="mb-2">
            {t('pbe_budget_code')}: <span className="text-primary">{transaction.pbe_budget_code}</span>
          </p>
          </tr>
            <tr>
                    <p className="mb-2">
            {t('pbe_budget_year')}: <span className="text-primary">{transaction.pbe_budget_year}</span>
          </p>
          </tr>
            <tr>
                    <p className="mb-2">
            {t('pbe_budget_month')}: <span className="text-primary">{transaction.pbe_budget_month}</span>
          </p>
          </tr>
          <tr>
                    <p className="mb-2">
            {t('pbe_used_date_gc')}: <span className="text-primary">{transaction.pbe_used_date_gc}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('ppe_amount')}: <span className="text-primary">{transaction.ppe_amount}</span>
          </p>
          </tr><tr>
                    <p className="mb-2">
            {t('pbe_description')}: <span className="text-primary">{transaction.pbe_description}</span>
          </p>
          </tr>
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
ProjectBudgetExpenditureModal.propTypes = {
  toggle: PropTypes.func,
  isOpen: PropTypes.bool,
  transaction: PropTypes.object,
};
export default ProjectBudgetExpenditureModal;
