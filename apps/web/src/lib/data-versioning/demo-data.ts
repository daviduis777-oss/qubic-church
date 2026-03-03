/**
 * Demo Data for Versioning System
 * Initialize sample versions and audit logs for demonstration
 */

import type { DataVersion, AuditLogEntry } from './types'

/**
 * Initialize demo versions if none exist
 */
export function initializeDemoVersions(): void {
  if (typeof window === 'undefined') return

  // Check if versions already exist
  const existing = localStorage.getItem('evidence-versions')
  if (existing) return

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const demoVersions: DataVersion[] = [
    {
      id: 'v1',
      version: '1.0.0',
      timestamp: new Date(now - 90 * day),
      checksum:
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      datasetName: 'bitcoin-addresses',
      recordCount: 950000,
      changeType: 'INITIAL_IMPORT',
      changedBy: 'system',
      changeDescription: 'Initial import of Bitcoin addresses from Qubic seeds',
      metadata: {
        validationStatus: 'VALID',
        source: 'qubic-seed-derivation',
        importMethod: 'k12-hash',
      },
      verified: true,
    },
    {
      id: 'v2',
      version: '1.1.0',
      timestamp: new Date(now - 60 * day),
      checksum:
        'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      datasetName: 'bitcoin-addresses',
      recordCount: 1000000,
      changeType: 'DATA_UPDATE',
      changedBy: 'admin-user',
      changeDescription: 'Added additional 50,000 addresses from new seed batch',
      metadata: {
        validationStatus: 'VALID',
        previousVersion: 'v1',
        affectedRecords: ['50000 new records'],
      },
      verified: true,
    },
    {
      id: 'v3',
      version: '2.0.0',
      timestamp: new Date(now - 30 * day),
      checksum:
        'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
      datasetName: 'patoshi-addresses',
      recordCount: 21953,
      changeType: 'INITIAL_IMPORT',
      changedBy: 'system',
      changeDescription:
        'Imported Patoshi addresses from blocks 1-36,288 (2009-2010)',
      metadata: {
        validationStatus: 'VALID',
        source: 'blockchain-analysis',
        importMethod: 'patoshi-pattern-detection',
        tags: ['early-mining', 'satoshi'],
      },
      verified: true,
    },
    {
      id: 'v4',
      version: '2.0.1',
      timestamp: new Date(now - 15 * day),
      checksum:
        'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
      datasetName: 'patoshi-addresses',
      recordCount: 21953,
      changeType: 'VALIDATION_FIX',
      changedBy: 'data-validator',
      changeDescription: 'Fixed checksum validation errors in 127 records',
      metadata: {
        validationStatus: 'VALID',
        previousVersion: 'v3',
        affectedRecords: ['127 records fixed'],
      },
      verified: true,
    },
    {
      id: 'v5',
      version: '3.0.0',
      timestamp: new Date(now - 7 * day),
      checksum:
        'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
      datasetName: 'qubic-seeds',
      recordCount: 23765,
      changeType: 'INITIAL_IMPORT',
      changedBy: 'system',
      changeDescription: 'Imported complete Qubic seed dataset',
      metadata: {
        validationStatus: 'VALID',
        source: 'qubic-network',
        importMethod: 'direct-export',
      },
      verified: true,
    },
    {
      id: 'v6',
      version: '1.1.1',
      timestamp: new Date(now - 1 * day),
      checksum:
        'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      datasetName: 'bitcoin-addresses',
      recordCount: 999950,
      changeType: 'RECORD_DELETED',
      changedBy: 'data-curator',
      changeDescription: 'Removed 50 duplicate addresses identified by collision analysis',
      metadata: {
        validationStatus: 'VALID',
        previousVersion: 'v2',
        affectedRecords: ['50 duplicates removed'],
      },
      verified: true,
      backupPath: '/backups/bitcoin-addresses/v2-before-dedup.json',
    },
  ]

  localStorage.setItem('evidence-versions', JSON.stringify(demoVersions))

  // Initialize demo audit logs
  const demoAuditLogs: AuditLogEntry[] = [
    {
      id: 'a1',
      timestamp: new Date(now - 90 * day),
      action: 'IMPORT',
      datasetName: 'bitcoin-addresses',
      versionId: 'v1',
      userId: 'system',
      userAgent: 'Node.js/Import Script',
      details: {
        recordCount: 950000,
        importMethod: 'k12-hash',
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a2',
      timestamp: new Date(now - 60 * day),
      action: 'UPDATE',
      datasetName: 'bitcoin-addresses',
      versionId: 'v2',
      userId: 'admin-user',
      userAgent: 'Chrome/120.0',
      details: {
        changeCount: 50000,
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a3',
      timestamp: new Date(now - 45 * day),
      action: 'EXPORT',
      datasetName: 'bitcoin-addresses',
      userId: 'researcher-1',
      userAgent: 'Firefox/119.0',
      details: {
        exportFormat: 'json',
        recordCount: 1000000,
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a4',
      timestamp: new Date(now - 30 * day),
      action: 'VERIFY',
      datasetName: 'patoshi-addresses',
      versionId: 'v3',
      userId: 'data-validator',
      userAgent: 'Chrome/120.0',
      details: {
        checksumValid: true,
        recordCountValid: true,
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a5',
      timestamp: new Date(now - 15 * day),
      action: 'UPDATE',
      datasetName: 'patoshi-addresses',
      versionId: 'v4',
      userId: 'data-validator',
      userAgent: 'Chrome/120.0',
      details: {
        changeCount: 127,
        changeType: 'VALIDATION_FIX',
      },
      severity: 'WARNING',
      verified: true,
    },
    {
      id: 'a6',
      timestamp: new Date(now - 10 * day),
      action: 'BACKUP',
      datasetName: 'bitcoin-addresses',
      versionId: 'v2',
      userId: 'system',
      userAgent: 'Backup Service',
      details: {
        backupSize: 52428800,
        compressed: false,
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a7',
      timestamp: new Date(now - 7 * day),
      action: 'IMPORT',
      datasetName: 'qubic-seeds',
      versionId: 'v5',
      userId: 'system',
      userAgent: 'Import Script',
      details: {
        recordCount: 23765,
        source: 'qubic-network',
      },
      severity: 'INFO',
      verified: true,
    },
    {
      id: 'a8',
      timestamp: new Date(now - 2 * day),
      action: 'VERIFY',
      datasetName: 'bitcoin-addresses',
      userId: 'security-auditor',
      userAgent: 'Chrome/120.0',
      details: {
        integrityCheck: 'PASS',
        duplicatesFound: 50,
      },
      severity: 'WARNING',
      verified: true,
    },
    {
      id: 'a9',
      timestamp: new Date(now - 1 * day),
      action: 'DELETE',
      datasetName: 'bitcoin-addresses',
      versionId: 'v6',
      userId: 'data-curator',
      userAgent: 'Chrome/120.0',
      details: {
        recordIds: ['50 duplicate addresses'],
        backupCreated: true,
      },
      severity: 'WARNING',
      verified: true,
    },
    {
      id: 'a10',
      timestamp: new Date(now - 12 * 60 * 60 * 1000), // 12 hours ago
      action: 'EXPORT',
      datasetName: 'patoshi-addresses',
      userId: 'researcher-2',
      userAgent: 'Safari/17.0',
      details: {
        exportFormat: 'csv',
        recordCount: 21953,
      },
      severity: 'INFO',
      verified: true,
    },
  ]

  localStorage.setItem('evidence-audit-log', JSON.stringify(demoAuditLogs))

  // Initialize demo backups
  const demoBackups = [
    {
      id: 'b1',
      timestamp: new Date(now - 10 * day),
      datasetName: 'bitcoin-addresses',
      versionId: 'v2',
      backupPath: '/backups/bitcoin-addresses/v2-auto-backup.json',
      size: 52428800,
      compressed: false,
      encrypted: false,
      checksum:
        'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      autoBackup: true,
      retentionDays: 90,
    },
    {
      id: 'b2',
      timestamp: new Date(now - 1 * day),
      datasetName: 'bitcoin-addresses',
      versionId: 'v2',
      backupPath: '/backups/bitcoin-addresses/v2-before-dedup.json',
      size: 52428900,
      compressed: false,
      encrypted: false,
      checksum:
        'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      autoBackup: true,
      retentionDays: 90,
    },
  ]

  localStorage.setItem('evidence-backups', JSON.stringify(demoBackups))

}

/**
 * Reset demo data (for testing)
 */
export function resetDemoData(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem('evidence-versions')
  localStorage.removeItem('evidence-audit-log')
  localStorage.removeItem('evidence-backups')

}
