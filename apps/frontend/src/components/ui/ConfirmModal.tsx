import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

/**
 * Small confirmation dialog on the Modal shell: title, one-line body, and a
 * Cancel / destructive-action button pair (e.g. "Discard changes?").
 */
export function ConfirmModal({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel} width="w-[380px]">
      <div className="px-5 pb-4 text-[13px] leading-relaxed text-fg-dim">{body}</div>
      <div className="flex justify-end gap-2 border-t border-white/6 px-5 py-3.5">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
