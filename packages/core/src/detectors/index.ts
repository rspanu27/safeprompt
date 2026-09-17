import type { Detector } from '../types';
import { cloudTokenDetector } from './cloud-token';
import { databaseUrlDetector } from './database-url';
import { emailDetector } from './email';
import { internalHostnameDetector } from './internal-hostname';
import { jwtDetector } from './jwt';
import { passwordAssignmentDetector } from './password-assignment';
import { privateIpDetector } from './private-ip';
import { privateKeyDetector } from './private-key';

/** Explicit rather than filesystem-scanned: nothing fires unless it's listed here. */
export const DETECTORS: readonly Detector[] = [
  privateKeyDetector,
  databaseUrlDetector,
  cloudTokenDetector,
  jwtDetector,
  passwordAssignmentDetector,
  privateIpDetector,
  internalHostnameDetector,
  emailDetector,
];
