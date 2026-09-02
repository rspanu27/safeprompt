import { describe, expect, it } from 'vitest';
import { CORE_VERSION } from './index';

describe('@safeprompt/core', () => {
    it('exports package version', () => {
        expect(CORE_VERSION).toBe('0.0.0');
    });
});