import type { Detector } from '../types';
import { emailDetector } from './email';

/** Explicit rather than filesystem-scanned: nothing fires unless it's listed here. */
export const DETECTORS: readonly Detector[] = [emailDetector];
