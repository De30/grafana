import React, { useMemo, useState } from 'react';
import { Modal } from '@grafana/ui';
import { AddAlertRuleToDashboard } from '../components/rules/AddAlertRuleToDashboard';

function useAddToDashboardModal(ruleName: string) {
  const [showModal, setShowModal] = useState(false);

  const AddToDashboardModal = useMemo(
    () => (
      <Modal
        title="Add alert rule to dashboard"
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        closeOnBackdropClick={true}
        closeOnEscape={true}
      >
        <AddAlertRuleToDashboard ruleName={ruleName} />
      </Modal>
    ),
    [ruleName, showModal]
  );

  return {
    AddToDashboardModal,
    showAddToDashboardModal: () => setShowModal(true),
    hideAddToDashboardModal: () => setShowModal(false),
  };
}

export { useAddToDashboardModal };
