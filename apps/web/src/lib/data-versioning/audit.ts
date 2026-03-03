/**
 * Audit Logging System
 * Comprehensive tracking of all data access and modifications
 */

import type { AuditLogEntry, AuditAction, AuditSeverity, AuditDetails } from './types'

// In-memory audit log store (in production, use database)
let auditLog: AuditLogEntry[] = []

/**
 * Create audit log entry
 */
export function createAuditLog(
  action: AuditAction,
  datasetName: string,
  details: AuditDetails,
  severity: AuditSeverity = 'INFO'
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    action,
    datasetName,
    userId: getCurrentUserId(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    ipAddress: 'Client', // In production, get from server
    details,
    severity,
    verified: true,
  }

  auditLog.push(entry)

  // Persist to localStorage for demo
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('evidence-audit-log') || '[]'
      const existing = JSON.parse(stored)
      existing.push(entry)
      // Keep only last 10000 entries
      if (existing.length > 10000) {
        existing.shift()
      }
      localStorage.setItem('evidence-audit-log', JSON.stringify(existing))
    } catch (error) {
      console.error('Failed to persist audit log:', error)
    }
  }

  // Log critical actions to console
  if (severity === 'CRITICAL' || severity === 'ERROR') {
    console.warn(`[AUDIT ${severity}]`, action, datasetName, details)
  }

  return entry
}

/**
 * Get all audit logs
 */
export function getAuditLog(filters?: {
  datasetName?: string
  action?: AuditAction
  userId?: string
  startDate?: Date
  endDate?: Date
  severity?: AuditSeverity
}): AuditLogEntry[] {
  // Load from localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('evidence-audit-log')
      if (stored) {
        auditLog = JSON.parse(stored, (key, value) => {
          if (key === 'timestamp') return new Date(value)
          return value
        })
      }
    } catch (error) {
      console.error('Failed to load audit log:', error)
    }
  }

  let filtered = [...auditLog]

  if (filters) {
    if (filters.datasetName) {
      filtered = filtered.filter((log) => log.datasetName === filters.datasetName)
    }
    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action)
    }
    if (filters.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId)
    }
    if (filters.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate!)
    }
    if (filters.severity) {
      filtered = filtered.filter((log) => log.severity === filters.severity)
    }
  }

  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get audit statistics
 */
export function getAuditStatistics() {
  const logs = getAuditLog()

  const byAction = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {} as Record<AuditAction, number>)

  const bySeverity = logs.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1
    return acc
  }, {} as Record<AuditSeverity, number>)

  const byDataset = logs.reduce((acc, log) => {
    acc[log.datasetName] = (acc[log.datasetName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueUsers = new Set(logs.map((log) => log.userId)).size

  return {
    totalLogs: logs.length,
    byAction,
    bySeverity,
    byDataset,
    uniqueUsers,
    firstLog: logs[logs.length - 1]?.timestamp,
    lastLog: logs[0]?.timestamp,
  }
}

/**
 * Export audit log
 */
export function exportAuditLog(format: 'json' | 'csv' = 'json'): string {
  const logs = getAuditLog()

  if (format === 'json') {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalEntries: logs.length,
        entries: logs,
      },
      null,
      2
    )
  }

  // CSV format
  const headers = [
    'Timestamp',
    'Action',
    'Dataset',
    'User ID',
    'Severity',
    'Details',
  ]
  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.action,
    log.datasetName,
    log.userId,
    log.severity,
    JSON.stringify(log.details),
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

/**
 * Clear audit log (ADMIN only)
 */
export function clearAuditLog(userId: string, reason: string): void {
  // Log the clear action before clearing
  createAuditLog(
    'DELETE',
    'audit-log',
    { reason, clearedEntries: auditLog.length },
    'CRITICAL'
  )

  auditLog = []

  if (typeof window !== 'undefined') {
    localStorage.removeItem('evidence-audit-log')
  }
}

/**
 * Get current user ID (mock for demo)
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
  return 'anonymous'
}

/**
 * Security: Detect suspicious patterns
 */
export function detectSuspiciousActivity(): {
  suspicious: boolean
  reasons: string[]
} {
  const logs = getAuditLog()
  const reasons: string[] = []
  const now = Date.now()
  const oneHour = 60 * 60 * 1000

  // Too many exports in short time
  const recentExports = logs.filter(
    (log) =>
      log.action === 'EXPORT' && now - log.timestamp.getTime() < oneHour
  )
  if (recentExports.length > 100) {
    reasons.push(`Unusual export activity: ${recentExports.length} exports in 1 hour`)
  }

  // Multiple failed operations
  const recentErrors = logs.filter(
    (log) =>
      log.severity === 'ERROR' && now - log.timestamp.getTime() < oneHour
  )
  if (recentErrors.length > 50) {
    reasons.push(`High error rate: ${recentErrors.length} errors in 1 hour`)
  }

  // Rollback abuse
  const recentRollbacks = logs.filter(
    (log) =>
      log.action === 'ROLLBACK' && now - log.timestamp.getTime() < oneHour
  )
  if (recentRollbacks.length > 5) {
    reasons.push(`Excessive rollbacks: ${recentRollbacks.length} in 1 hour`)
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  }
}
