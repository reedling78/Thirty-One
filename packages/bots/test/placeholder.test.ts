import { describe, expect, it } from 'vitest';
import { BOTS_VERSION, rulesVersion } from '../src/index';

describe('@thirtyone/bots', () => {
  it('loads and sees the rules package', () => {
    expect(BOTS_VERSION).toBe('0.0.0');
    expect(rulesVersion).toBe('0.2.0');
  });
});
