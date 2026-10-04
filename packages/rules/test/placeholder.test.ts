import { describe, expect, it } from 'vitest';
import { RULES_VERSION } from '../src/index';

describe('@thirtyone/rules', () => {
  it('loads', () => {
    expect(RULES_VERSION).toBe('0.0.0');
  });
});
