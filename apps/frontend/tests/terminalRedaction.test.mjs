import assert from 'node:assert/strict';
import test from 'node:test';
import { createStreamRedactor } from '../src/components/terminal/redaction.ts';

test('terminal redaction replaces configured addresses', () => {
  const redact = createStreamRedactor(['203.0.113.10', '2001:db8::10']);
  assert.equal(redact('host 203.0.113.10 and 2001:db8::10\n'), 'host REDACTED and REDACTED\n');
});

test('terminal redaction handles addresses split across websocket frames', () => {
  const redact = createStreamRedactor(['203.0.113.10']);
  assert.equal(redact('from 203.0.'), 'from ');
  assert.equal(redact('113.10 ok\n'), 'REDACTED ok\n');
});
