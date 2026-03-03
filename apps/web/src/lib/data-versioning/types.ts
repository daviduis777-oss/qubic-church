/**
 * Data Versioning System - Type Definitions
 * Bulletproof type safety for version control, audit logging, and data integrity
 */

export interface DataVersion {
  id: string
  version: string // Semantic versioning: major.minor.patch
  timestamp: Date
  checksum: string // SHA-256 hash of data
  datasetName: string
  recordCount: number
  changeType: ChangeType
  changedBy: string
  changeDescription: string
  metadata: VersionMetadata
  verified: boolean
  backupPath?: string
}

export type ChangeType =
  | 'INITIAL_IMPORT'
  | 'DATA_UPDATE'
  | 'RECORD_ADDED'
  | 'RECORD_MODIFIED'
  | 'RECORD_DELETED'
  | 'SCHEMA_CHANGE'
  | 'VALIDATION_FIX'
  | 'ROLLBACK'
  | 'MERGE'

export interface VersionMetadata {
  source?: string
  importMethod?: string
  validationStatus: ValidationStatus
  affectedRecords?: string[]
  previousVersion?: string
  tags?: string[]
  notes?: string
}

export type ValidationStatus = 'VALID' | 'WARNING' | 'ERROR' | 'PENDING'

export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: AuditAction
  datasetName: string
  versionId?: string
  userId: string
  userAgent: string
  ipAddress?: string
  details: AuditDetails
  severity: AuditSeverity
  verified: boolean
}

export type AuditAction =
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'UPDATE'
  | 'DELETE'
  | 'ROLLBACK'
  | 'VERIFY'
  | 'BACKUP'
  | 'RESTORE'
  | 'VALIDATE'

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface AuditDetails {
  recordIds?: string[]
  exportFormat?: string
  changeCount?: number
  errorMessage?: string
  fromVersion?: string
  toVersion?: string
  [key: string]: any
}

export interface IntegrityCheck {
  id: string
  timestamp: Date
  datasetName: string
  versionId: string
  status: IntegrityStatus
  checksumMatch: boolean
  recordCountMatch: boolean
  schemaValid: boolean
  duplicatesFound: number
  corruptionDetected: boolean
  errors: string[]
  warnings: string[]
}

export type IntegrityStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING'

export interface DataBackup {
  id: string
  timestamp: Date
  datasetName: string
  versionId: string
  backupPath: string
  size: number
  compressed: boolean
  encrypted: boolean
  checksum: string
  autoBackup: boolean
  retentionDays: number
}

export interface VersionComparison {
  fromVersion: DataVersion
  toVersion: DataVersion
  recordsAdded: number
  recordsModified: number
  recordsDeleted: number
  checksumDiff: boolean
  schemaChanged: boolean
  changes: VersionChange[]
}

export interface VersionChange {
  type: 'ADD' | 'MODIFY' | 'DELETE'
  recordId: string
  fieldChanges?: FieldChange[]
}

export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
}

export interface RollbackRequest {
  targetVersionId: string
  reason: string
  createBackup: boolean
  userId: string
}

export interface RollbackResult {
  success: boolean
  newVersionId?: string
  backupId?: string
  recordsRestored: number
  errors: string[]
  auditLogId: string
}

export interface AccessControl {
  userId: string
  role: UserRole
  permissions: Permission[]
  datasets: string[]
  ipWhitelist?: string[]
}

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'AUDITOR'

export type Permission =
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'UPDATE'
  | 'DELETE'
  | 'ROLLBACK'
  | 'AUDIT'
  | 'BACKUP'
  | 'RESTORE'
  | 'ADMIN'
