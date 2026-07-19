import { useState } from 'react';
import type { Connection, ConnectionInput } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { pushToast } from '../../store/toast';
import { AlertIcon, CheckIcon } from '../ui/icons/general';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { SettingsDivider, SettingsRow } from '../ui/Settings';
import { Spinner } from '../ui/Spinner';
import { ColorSelect } from './ColorSelect';
import { CONN_COLORS, connColor } from './colors';

const field =
  'h-8 w-[220px] rounded-lg bg-white/5 px-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:ring-1 focus:ring-accent';

type AuthType = 'password' | 'key';

/** Editable settings rows for one SSH connection (also the new-connection pane). */
export function ConnectionForm({
  existing,
  onSaved,
  onDeleted,
}: {
  existing: Connection | null;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const save = useConnectionsStore((s) => s.save);
  const remove = useConnectionsStore((s) => s.remove);
  const test = useConnectionsStore((s) => s.test);
  const testState = useConnectionsStore((s) => (existing ? s.testStates[existing.id] : undefined));
  const [name, setName] = useState(existing?.name ?? '');
  const [host, setHost] = useState(existing?.host ?? '');
  const [port, setPort] = useState(String(existing?.port ?? 22));
  const [username, setUsername] = useState(existing?.username ?? '');
  const [authType, setAuthType] = useState<AuthType>(existing?.auth_type ?? 'password');
  const [password, setPassword] = useState(existing?.password ?? '');
  const [keyPath, setKeyPath] = useState(existing?.key_path ?? '');
  const [passphrase, setPassphrase] = useState(existing?.key_passphrase ?? '');
  const [iconColor, setIconColor] = useState(existing?.icon_color ?? null);
  const [saving, setSaving] = useState(false);

  // Save appears only when the form differs from the saved connection (or, for
  // a new connection, from the blank defaults).
  const current = [name.trim(), host.trim(), port, username.trim(), authType, password, keyPath.trim(), passphrase, iconColor];
  const initial = [
    existing?.name ?? '',
    existing?.host ?? '',
    String(existing?.port ?? 22),
    existing?.username ?? '',
    existing?.auth_type ?? 'password',
    existing?.password ?? '',
    existing?.key_path ?? '',
    existing?.key_passphrase ?? '',
    existing?.icon_color ?? null,
  ];
  const dirty = current.some((v, i) => v !== initial[i]);

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
      icon_color: iconColor,
    };
    setSaving(true);
    try {
      const saved = await save(input, existing?.id);
      pushToast('ok', existing ? 'Connection updated' : 'Connection saved');
      onSaved(saved.id);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing || !window.confirm(`Delete connection "${existing.name}"?`)) return;
    remove(existing.id)
      .then(onDeleted)
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
        <SettingsRow label="Icon color">
          <ColorSelect
            value={iconColor}
            autoColor={existing ? connColor(existing) : CONN_COLORS[0].value}
            onChange={setIconColor}
          />
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Authentication">
          <Select
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
            <SettingsRow label="Private key path" htmlFor="conn-key-path">
              <input id="conn-key-path" className={`${field} font-mono text-[12px]`} value={keyPath} onChange={(e) => setKeyPath(e.target.value)} placeholder="~/.ssh/id_ed25519" spellCheck={false} />
            </SettingsRow>
            <SettingsDivider />
            <SettingsRow label="Passphrase (optional)" htmlFor="conn-phrase">
              <input id="conn-phrase" type="password" className={field} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
            </SettingsRow>
          </>
        )}
      </div>
      {(existing || dirty) && (
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
                  <CheckIcon size={13} /> Reachable
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
          {dirty && (
            <Button variant="blurple" type="submit" disabled={saving} className="ml-auto">
              {saving && <Spinner size={12} className="text-white" />}
              Save
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
