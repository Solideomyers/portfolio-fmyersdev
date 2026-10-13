import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const SRC = 'docs/handoff/design/design-system';

test('token files are byte-identical to the handoff', () => {
  for (const file of readdirSync(`${SRC}/tokens`)) {
    expect(readFileSync(`src/styles/tokens/${file}`, 'utf8'), file).toBe(
      readFileSync(`${SRC}/tokens/${file}`, 'utf8'),
    );
  }
  expect(readFileSync('src/styles/motion.css', 'utf8')).toBe(
    readFileSync(`${SRC}/motion.css`, 'utf8'),
  );
});
