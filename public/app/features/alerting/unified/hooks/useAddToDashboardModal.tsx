import React, { useMemo, useState } from 'react';
import { CombinedRule } from 'app/types/unified-alerting';
import { Modal } from '@grafana/ui';
import { AddAlertRuleToDashboard } from '../components/rules/AddAlertRuleToDashboard';

function useAddToDashboardModal(rule: CombinedRule) {
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
        <AddAlertRuleToDashboard rule={rule} />
      </Modal>
    ),
    [rule, showModal]
  );

  return {
    AddToDashboardModal,
    showAddToDashboardModal: () => setShowModal(true),
    hideAddToDashboardModal: () => setShowModal(false),
  };
}

export { useAddToDashboardModal };
