import { useState } from 'react';
import type { Connection, ConnectionInput } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { pushToast } from '../../store/toast';
import { AlertIcon, CheckIcon } from '../ui/icons/general';
import { Button } from '../ui/Button';
import { Segmented, SettingsDivider, SettingsRow } from '../ui/Settings';
import { Spinner } from '../ui/Spinner';

const field =
  'h-8 w-[220px] rounded-lg bg-black/25 px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:ring-1 focus:ring-accent';

/** Editable settings rows for one SSH connection (also the new-connection pane). */
export function ConnectionForm({
  existing,
  onDone,
}: {
  existing: Connection | null;
  onDone: () => void;
}) {
  const save = useConnectionsStore((s) => s.save);
  const remove = useConnectionsStore((s) => s.remove);
  const test = useConnectionsStore((s) => s.test);
  const testState = useConnectionsStore((s) => (existing ? s.testStates[existing.id] : undefined));
  const [name, setName] = useState(existing?.name ?? '');
  const [host, setHost] = useState(existing?.host ?? '');
  const [port, setPort] = useState(String(existing?.port ?? 22));
  const [username, setUsername] = useState(existing?.username ?? '');
  const [authType, setAuthType] = useState<'password' | 'key'>(existing?.auth_type ?? 'password');
  const [password, setPassword] = useState(existing?.password ?? '');
  const [keyPath, setKeyPath] = useState(existing?.key_path ?? '');
  const [passphrase, setPassphrase] = useState(existing?.key_passphrase ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const portNum = Number.parseInt(port, 10);
    if (!name.trim() || !host.trim() || !username.trim() || Number.isNaN(portNum)) {
      pushToast('error', 'Name, host, port and username are required');
      return;
    }
    const input: ConnectionInput = {
      name: name.trim(),
      host: host.trim(),
      port: portNum,
      username: username.trim(),
      auth_type: authType,
      password: authType === 'password' ? password : null,
      // Pass any existing pasted key through unchanged (legacy fallback used by
      // the backend only when key_path is empty); new forms only set key_path.
      private_key: authType === 'key' ? (existing?.private_key ?? null) : null,
      key_path: authType === 'key' && keyPath.trim() ? keyPath.trim() : null,
      key_passphrase: authType === 'key' && passphrase ? passphrase : null,
    };
    setSaving(true);
    try {
      await save(input, existing?.id);
      pushToast('ok', existing ? 'Connection updated' : 'Connection saved');
      onDone();
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing || !window.confirm(`Delete connection "${existing.name}"?`)) return;
    remove(existing.id)
      .then(onDone)
      .catch((err) => pushToast('error', err instanceof Error ? err.message : 'Delete failed'));
  };

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <SettingsRow label="Name" htmlFor="conn-name">
          <input id="conn-name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="my server" autoFocus={!existing} />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Host" htmlFor="conn-host">
          <input id="conn-host" className={field} value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.10" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Port" htmlFor="conn-port">
          <input id="conn-port" className={`${field} w-[80px]`} value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Username" htmlFor="conn-user">
          <input id="conn-user" className={field} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="root" />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Authentication">
          <Segmented
            value={authType}
            options={[
              { value: 'password', label: 'Password' },
              { value: 'key', label: 'Private key' },
            ]}
            onChange={setAuthType}
          />
        </SettingsRow>
        <SettingsDivider />
        {authType === 'password' ? (
          <SettingsRow label="Password" htmlFor="conn-pass">
            <input id="conn-pass" type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
          </SettingsRow>
        ) : (
          <>
            <SettingsRow
              label="Private key path"
              description="Path on the machine running Zector"
              htmlFor="conn-key-path"
            >
              <input id="conn-key-path" className={`${field} font-mono text-[12px]`} value={keyPath} onChange={(e) => setKeyPath(e.target.value)} placeholder="~/.ssh/id_ed25519" spellCheck={false} />
            </SettingsRow>
            <SettingsDivider />
            <SettingsRow label="Passphrase" description="Optional" htmlFor="conn-phrase">
              <input id="conn-phrase" type="password" className={field} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
            </SettingsRow>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-white/6 px-5 py-3.5">
        {existing && (
          <>
            <Button variant="ghost" onClick={() => void test(existing.id)} disabled={testState?.state === 'testing'}>
              Test
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
            {testState?.state === 'testing' && <Spinner size={13} />}
            {testState?.state === 'ok' && (
              <span className="flex items-center gap-1 text-[12px] text-ok">
                <CheckIcon size={13} /> Connected
              </span>
            )}
            {testState?.state === 'error' && (
              <span
                className="flex min-w-0 items-center gap-1 truncate text-[12px] text-danger"
                title={testState.message}
              >
                <AlertIcon size={13} className="shrink-0" /> {testState.message}
              </span>
            )}
          </>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving && <Spinner size={12} className="text-bg0" />}
            {existing ? 'Save changes' : 'Add connection'}
          </Button>
        </div>
      </div>
    </form>
  );
}
