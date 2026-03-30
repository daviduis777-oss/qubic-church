/**
 * Data Versioning System - Main Export
 * Bulletproof version control with comprehensive audit logging
 */

// Types
export * from './types'

// Integrity & Validation
export {
  generateChecksum,
  verifyChecksum,
  performIntegrityCheck,
  validateVersion,
  compareVersions,
} from './integrity'

// Audit Logging
export {
  createAuditLog,
  getAuditLog,
  getAuditStatistics,
  exportAuditLog,
  clearAuditLog,
  detectSuspiciousActivity,
} from './audit'

// Version Management
export {
  createVersion,
  getVersion,
  getVersions,
  getLatestVersion,
  getVersionHistory,
  rollbackToVersion,
  getBackups,
  getVersionStatistics,
} from './version-manager'
