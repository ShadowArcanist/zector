/** Redact exact values without exposing one split across WebSocket frames. */
export function createStreamRedactor(values: string[]) {
  const secrets = [...new Set(values.filter(Boolean))].sort((a, b) => b.length - a.length);
  const maxPrefix = Math.max(0, (secrets[0]?.length ?? 0) - 1);
  let pending = '';

  return (chunk: string) => {
    const text = pending + chunk;
    let keep = 0;
    for (let n = 1; n <= Math.min(maxPrefix, text.length); n += 1) {
      const suffix = text.slice(-n);
      if (secrets.some((secret) => secret.startsWith(suffix))) keep = n;
    }
    pending = keep ? text.slice(-keep) : '';
    let safe = keep ? text.slice(0, -keep) : text;
    for (const secret of secrets) safe = safe.split(secret).join('REDACTED');
    return safe;
  };
}
