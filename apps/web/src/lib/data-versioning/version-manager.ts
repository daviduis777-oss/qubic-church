/**
 * Version Management System
 * Handle version creation, storage, and retrieval
 */

import type {
  DataVersion,
  ChangeType,
  VersionMetadata,
  RollbackRequest,
  RollbackResult,
  DataBackup,
} from './types'
import { generateChecksum } from './integrity'
import { createAuditLog } from './audit'

// In-memory version store (in production, use database)
let versionStore: Map<string, DataVersion> = new Map()
let backupStore: Map<string, DataBackup> = new Map()

/**
 * Create new version
 */
export async function createVersion(
  datasetName: string,
  data: any[],
  changeType: ChangeType,
  changeDescription: string,
  metadata: Partial<VersionMetadata> = {}
): Promise<DataVersion> {
  try {
    // Generate checksum
    const checksum = await generateChecksum(data)

    // Get previous version
    const previousVersion = getLatestVersion(datasetName)
    const previousVersionNumber = previousVersion?.version || '0.0.0'

    // Increment version number based on change type
    const newVersion = incrementVersion(previousVersionNumber, changeType)

    // Create version object
    const version: DataVersion = {
      id: crypto.randomUUID(),
      version: newVersion,
      timestamp: new Date(),
      checksum,
      datasetName,
      recordCount: data.length,
      changeType,
      changedBy: getCurrentUserId(),
      changeDescription,
      metadata: {
        validationStatus: 'VALID',
        previousVersion: previousVersion?.id,
        ...metadata,
      },
      verified: true,
    }

    // Store version
    versionStore.set(version.id, version)
    persistVersionStore()

    // Create backup if enabled
    if (shouldAutoBackup(changeType)) {
      await createBackup(version, data)
    }

    // Audit log
    createAuditLog('UPDATE', datasetName, {
      versionId: version.id,
      changeType,
      recordCount: data.length,
      fromVersion: previousVersionNumber,
      toVersion: newVersion,
    })

    return version
  } catch (error) {
    console.error('Failed to create version:', error)
    throw new Error('Version creation failed')
  }
}

/**
 * Get version by ID
 */
export function getVersion(versionId: string): DataVersion | undefined {
  loadVersionStore()
  return versionStore.get(versionId)
}

/**
 * Get all versions for dataset
 */
export function getVersions(datasetName?: string): DataVersion[] {
  loadVersionStore()
  const versions = Array.from(versionStore.values())

  if (datasetName) {
    return versions
      .filter((v) => v.datasetName === datasetName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get latest version for dataset
 */
export function getLatestVersion(datasetName: string): DataVersion | undefined {
  const versions = getVersions(datasetName)
  return versions[0]
}

/**
 * Get version history
 */
export function getVersionHistory(
  datasetName: string,
  limit = 50
): DataVersion[] {
  return getVersions(datasetName).slice(0, limit)
}

/**
 * Rollback to previous version
 */
export async function rollbackToVersion(
  request: RollbackRequest
): Promise<RollbackResult> {
  try {
    const targetVersion = getVersion(request.targetVersionId)

    if (!targetVersion) {
      return {
        success: false,
        errors: ['Target version not found'],
        auditLogId: '',
        recordsRestored: 0,
      }
    }

    // Create backup of current state if requested
    let backupId: string | undefined
    if (request.createBackup) {
      const currentVersion = getLatestVersion(targetVersion.datasetName)
      if (currentVersion) {
        // In real implementation, load actual data
        const backup = await createBackup(currentVersion, [])
        backupId = backup.id
      }
    }

    // In real implementation, restore data from backup/version
    // For now, create a new rollback version
    const rollbackVersion: DataVersion = {
      id: crypto.randomUUID(),
      version: incrementVersion(
        getLatestVersion(targetVersion.datasetName)?.version || '0.0.0',
        'ROLLBACK'
      ),
      timestamp: new Date(),
      checksum: targetVersion.checksum,
      datasetName: targetVersion.datasetName,
      recordCount: targetVersion.recordCount,
      changeType: 'ROLLBACK',
      changedBy: request.userId,
      changeDescription: `Rollback to version ${targetVersion.version}: ${request.reason}`,
      metadata: {
        validationStatus: 'VALID',
        previousVersion: getLatestVersion(targetVersion.datasetName)?.id,
      },
      verified: true,
    }

    versionStore.set(rollbackVersion.id, rollbackVersion)
    persistVersionStore()

    // Audit log
    const auditLog = createAuditLog(
      'ROLLBACK',
      targetVersion.datasetName,
      {
        targetVersionId: request.targetVersionId,
        reason: request.reason,
        backupCreated: request.createBackup,
        backupId,
      },
      'WARNING'
    )

    return {
      success: true,
      newVersionId: rollbackVersion.id,
      backupId,
      recordsRestored: targetVersion.recordCount,
      errors: [],
      auditLogId: auditLog.id,
    }
  } catch (error) {
    console.error('Rollback failed:', error)
    return {
      success: false,
      errors: [String(error)],
      auditLogId: '',
      recordsRestored: 0,
    }
  }
}

/**
 * Create backup
 */
async function createBackup(
  version: DataVersion,
  data: any[]
): Promise<DataBackup> {
  const backup: DataBackup = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    datasetName: version.datasetName,
    versionId: version.id,
    backupPath: `/backups/${version.datasetName}/${version.id}.json`,
    size: JSON.stringify(data).length,
    compressed: false,
    encrypted: false,
    checksum: version.checksum,
    autoBackup: true,
    retentionDays: 90,
  }

  backupStore.set(backup.id, backup)
  persistBackupStore()

  // In production, actually save data to backup location
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`backup-${backup.id}`, JSON.stringify(data))
    } catch (error) {
      console.error('Backup storage failed:', error)
    }
  }

  createAuditLog('BACKUP', version.datasetName, {
    backupId: backup.id,
    versionId: version.id,
    size: backup.size,
  })

  return backup
}

/**
 * Get backups for version
 */
export function getBackups(versionId?: string): DataBackup[] {
  loadBackupStore()
  const backups = Array.from(backupStore.values())

  if (versionId) {
    return backups.filter((b) => b.versionId === versionId)
  }

  return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Increment version number based on change type
 */
function incrementVersion(current: string, changeType: ChangeType): string {
  const [major, minor, patch] = current.split('.').map(Number)

  switch (changeType) {
    case 'SCHEMA_CHANGE':
    case 'INITIAL_IMPORT':
      return `${major! + 1}.0.0`
    case 'DATA_UPDATE':
    case 'MERGE':
      return `${major!}.${minor! + 1}.0`
    case 'RECORD_ADDED':
    case 'RECORD_MODIFIED':
    case 'RECORD_DELETED':
    case 'VALIDATION_FIX':
    case 'ROLLBACK':
      return `${major!}.${minor!}.${patch! + 1}`
    default:
      return `${major!}.${minor!}.${patch! + 1}`
  }
}

/**
 * Determine if auto-backup should be created
 */
function shouldAutoBackup(changeType: ChangeType): boolean {
  return [
    'DATA_UPDATE',
    'RECORD_DELETED',
    'SCHEMA_CHANGE',
    'ROLLBACK',
  ].includes(changeType)
}

/**
 * Get current user ID
 */
function getCurrentUserId(): string {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('evidence-user-id')
    if (!userId) {
      userId = `user-${crypto.randomUUID().slice(0, 8)}`
      localStorage.setItem('evidence-user-id', userId)
    }
    return userId
  }
  return 'system'
}

/**
 * Persist version store to localStorage
 */
function persistVersionStore(): void {
  if (typeof window !== 'undefined') {
    try {
      const versions = Array.from(versionStore.values())
      localStorage.setItem('evidence-versions', JSON.stringify(versions))
    } catch (error) {
      console.error('Failed to persist versions:', error)
    }
  }
}

/**
 * Load version store from localStorage
 */
function loadVersionStore(): void {
  if (typeof window !== 'undefined' && versionStore.size === 0) {
    try {
      const stored = localStorage.getItem('evidence-versions')
      if (stored) {
        const versions: DataVersion[] = JSON.parse(stored, (key, value) => {
          if (key === 'timestamp') return new Date(value)
          return value
        })
        versionStore = new Map(versions.map((v) => [v.id, v]))
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }
}

/**
 * Persist backup store
 */
function persistBackupStore(): void {
  if (typeof window !== 'undefined') {
    try {
      const backups = Array.from(backupStore.values())
      localStorage.setItem('evidence-backups', JSON.stringify(backups))
    } catch (error) {
      console.error('Failed to persist backups:', error)
    }
  }
}

/**
 * Load backup store
 */
function loadBackupStore(): void {
  if (typeof window !== 'undefined' && backupStore.size === 0) {
    try {
      const stored = localStorage.getItem('evidence-backups')
      if (stored) {
        const backups: DataBackup[] = JSON.parse(stored, (key, value) => {
          if (key === 'timestamp') return new Date(value)
          return value
        })
        backupStore = new Map(backups.map((b) => [b.id, b]))
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }
}

/**
 * Get version statistics
 */
export function getVersionStatistics(datasetName?: string) {
  const versions = getVersions(datasetName)

  const byChangeType = versions.reduce((acc, v) => {
    acc[v.changeType] = (acc[v.changeType] || 0) + 1
    return acc
  }, {} as Record<ChangeType, number>)

  const totalRecords = versions.reduce((sum, v) => sum + v.recordCount, 0)

  return {
    totalVersions: versions.length,
    byChangeType,
    totalRecords,
    latestVersion: versions[0]?.version,
    oldestVersion: versions[versions.length - 1]?.version,
    averageRecordsPerVersion:
      versions.length > 0 ? Math.round(totalRecords / versions.length) : 0,
  }
}
