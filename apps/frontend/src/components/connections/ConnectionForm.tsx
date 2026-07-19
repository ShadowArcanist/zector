import { useState } from 'react';
import type { Connection, ConnectionInput } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { pushToast } from '../../store/toast';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

const field =
  'h-8 w-full rounded-md border border-edge2 bg-bg0 px-2.5 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:border-accent-dim';
const label = 'mb-1 block text-[11px] font-medium tracking-wide text-fg-faint uppercase';

export function ConnectionForm({
  existing,
  onDone,
}: {
  existing: Connection | null;
  onDone: () => void;
}) {
  const save = useConnectionsStore((s) => s.save);
  const [name, setName] = useState(existing?.name ?? '');
  const [host, setHost] = useState(existing?.host ?? '');
  const [port, setPort] = useState(String(existing?.port ?? 22));
  const [username, setUsername] = useState(existing?.username ?? '');
  const [authType, setAuthType] = useState<'password' | 'key'>(existing?.auth_type ?? 'password');
  const [password, setPassword] = useState(existing?.password ?? '');
  const [privateKey, setPrivateKey] = useState(existing?.private_key ?? '');
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
      private_key: authType === 'key' ? privateKey : null,
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

  return (
    <form
      className="flex flex-col gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <label className={label} htmlFor="conn-name">Name</label>
        <input id="conn-name" className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="my server" autoFocus />
      </div>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <label className={label} htmlFor="conn-host">Host</label>
          <input id="conn-host" className={field} value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.10" />
        </div>
        <div className="w-20">
          <label className={label} htmlFor="conn-port">Port</label>
          <input id="conn-port" className={field} value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="conn-user">Username</label>
        <input id="conn-user" className={field} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="root" />
      </div>
      <div>
        <span className={label}>Authentication</span>
        <div className="flex overflow-hidden rounded-md border border-edge2">
          {(['password', 'key'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 cursor-pointer py-1.5 text-[12px] font-medium transition-colors ${
                authType === t ? 'bg-bg3 text-fg' : 'bg-bg0 text-fg-faint hover:text-fg-dim'
              }`}
              onClick={() => setAuthType(t)}
            >
              {t === 'password' ? 'Password' : 'Private key'}
            </button>
          ))}
        </div>
      </div>
      {authType === 'password' ? (
        <div>
          <label className={label} htmlFor="conn-pass">Password</label>
          <input id="conn-pass" type="password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      ) : (
        <>
          <div>
            <label className={label} htmlFor="conn-key">Private key</label>
            <textarea
              id="conn-key"
              className="h-28 w-full resize-y rounded-md border border-edge2 bg-bg0 p-2.5 font-mono text-[11px] text-fg outline-none placeholder:text-fg-faint focus:border-accent-dim"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
              spellCheck={false}
            />
          </div>
          <div>
            <label className={label} htmlFor="conn-phrase">Passphrase (optional)</label>
            <input id="conn-phrase" type="password" className={field} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
          </div>
        </>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="subtle" onClick={onDone}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={saving}>
          {saving && <Spinner size={12} className="text-white" />}
          {existing ? 'Save changes' : 'Add connection'}
        </Button>
      </div>
    </form>
  );
}
