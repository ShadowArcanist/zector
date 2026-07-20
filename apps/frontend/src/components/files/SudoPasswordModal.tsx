import { useState } from 'react';
import { CONNECTION_FIELD_CLASS } from '../connections/formStyles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';

export function SudoPasswordModal({
  path,
  onClose,
  onSubmit,
}: {
  path: string;
  onClose: () => void;
  onSubmit: (password: string) => Promise<string | null>;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!password || submitting) return;
    const attempt = password;
    setPassword('');
    setError(null);
    setSubmitting(true);
    const message = await onSubmit(attempt);
    setSubmitting(false);
    if (message) setError(message);
    else onClose();
  };

  return (
    <Modal title="Try as sudo" onClose={onClose} width="w-[400px]" surface="bg-menu">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-3 px-5 pb-4">
          <p className="text-[13px] leading-relaxed text-fg-dim">
            Enter your Mac login password to open <span className="font-mono text-fg">{path}</span>.
            The password is used for this request only and is never saved.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${CONNECTION_FIELD_CLASS} w-full`}
            placeholder="Password"
            aria-label="Sudo password"
            autoComplete="off"
            autoFocus
          />
          {error && <p className="text-[12px] leading-relaxed text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/6 px-5 py-3.5">
          <Button size="sm" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" type="submit" disabled={!password || submitting}>
            {submitting && <Spinner size={12} className="text-bg0" />}
            Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
