/**
 * Data Integrity & Validation Utilities
 * Bulletproof checksums, validation, and corruption detection
 */

import type { IntegrityCheck, DataVersion, ValidationStatus } from './types'

/**
 * Generate SHA-256 checksum for data
 * Used for tamper detection and version verification
 */
export async function generateChecksum(data: any): Promise<string> {
  try {
    const jsonString = JSON.stringify(data, Object.keys(data).sort())
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(jsonString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('Checksum generation failed:', error)
    throw new Error('Failed to generate data checksum')
  }
}

/**
 * Verify data integrity against stored checksum
 */
export async function verifyChecksum(
  data: any,
  expectedChecksum: string
): Promise<boolean> {
  try {
    const actualChecksum = await generateChecksum(data)
    return actualChecksum === expectedChecksum
  } catch (error) {
    console.error('Checksum verification failed:', error)
    return false
  }
}

/**
 * Comprehensive integrity check for dataset
 */
export async function performIntegrityCheck(
  data: any[],
  version: DataVersion
): Promise<IntegrityCheck> {
  const errors: string[] = []
  const warnings: string[] = []

  // Checksum verification
  const checksumMatch = await verifyChecksum(data, version.checksum)
  if (!checksumMatch) {
    errors.push('Checksum mismatch - data may be corrupted or tampered')
  }

  // Record count verification
  const recordCountMatch = data.length === version.recordCount
  if (!recordCountMatch) {
    errors.push(
      `Record count mismatch: expected ${version.recordCount}, found ${data.length}`
    )
  }

  // Schema validation
  const schemaValid = validateSchema(data)
  if (!schemaValid) {
    errors.push('Schema validation failed - data structure is invalid')
  }

  // Duplicate detection
  const duplicatesFound = detectDuplicates(data)
  if (duplicatesFound > 0) {
    warnings.push(`Found ${duplicatesFound} duplicate records`)
  }

  // Corruption detection
  const corruptionDetected = detectCorruption(data)
  if (corruptionDetected) {
    errors.push('Data corruption detected - malformed or missing fields')
  }

  // Determine overall status
  let status: IntegrityCheck['status']
  if (errors.length > 0) {
    status = 'FAIL'
  } else if (warnings.length > 0) {
    status = 'WARNING'
  } else {
    status = 'PASS'
  }

  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    datasetName: version.datasetName,
    versionId: version.id,
    status,
    checksumMatch,
    recordCountMatch,
    schemaValid,
    duplicatesFound,
    corruptionDetected,
    errors,
    warnings,
  }
}

/**
 * Validate data schema consistency
 */
function validateSchema(data: any[]): boolean {
  if (data.length === 0) return true

  try {
    const firstRecord = data[0]
    const expectedKeys = Object.keys(firstRecord).sort()

    for (const record of data) {
      const recordKeys = Object.keys(record).sort()
      if (JSON.stringify(recordKeys) !== JSON.stringify(expectedKeys)) {
        return false
      }
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Detect duplicate records in dataset
 */
function detectDuplicates(data: any[]): number {
  try {
    const seen = new Set<string>()
    let duplicates = 0

    for (const record of data) {
      const key = JSON.stringify(record, Object.keys(record).sort())
      if (seen.has(key)) {
        duplicates++
      } else {
        seen.add(key)
      }
    }

    return duplicates
  } catch (error) {
    return 0
  }
}

/**
 * Detect data corruption (malformed fields, missing required data)
 */
function detectCorruption(data: any[]): boolean {
  try {
    for (const record of data) {
      // Check for null prototype attacks
      if (Object.getPrototypeOf(record) !== Object.prototype) {
        return true
      }

      // Check for circular references
      try {
        JSON.stringify(record)
      } catch (e) {
        return true
      }

      // Check for non-serializable values
      for (const value of Object.values(record)) {
        if (value === undefined || typeof value === 'function') {
          return true
        }
      }
    }

    return false
  } catch (error) {
    return true
  }
}

/**
 * Validate version metadata
 */
export function validateVersion(version: DataVersion): ValidationStatus {
  const errors: string[] = []

  // Check required fields
  if (!version.id || !version.version || !version.checksum) {
    return 'ERROR'
  }

  // Validate version format (semantic versioning)
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(version.version)) {
    errors.push('Invalid version format')
  }

  // Validate checksum format (64 hex characters for SHA-256)
  if (!/^[a-f0-9]{64}$/i.test(version.checksum)) {
    errors.push('Invalid checksum format')
  }

  // Validate record count
  if (version.recordCount < 0) {
    errors.push('Invalid record count')
  }

  if (errors.length > 0) {
    return 'ERROR'
  }

  return 'VALID'
}

/**
 * Compare two versions for differences
 */
export function compareVersions(
  oldData: any[],
  newData: any[],
  idField = 'id'
): {
  added: any[]
  modified: any[]
  deleted: any[]
} {
  const oldMap = new Map(oldData.map((item) => [item[idField], item]))
  const newMap = new Map(newData.map((item) => [item[idField], item]))

  const added: any[] = []
  const modified: any[] = []
  const deleted: any[] = []

  // Find added and modified
  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id)
    if (!oldItem) {
      added.push(newItem)
    } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      modified.push({ old: oldItem, new: newItem })
    }
  }

  // Find deleted
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      deleted.push(oldItem)
    }
  }

  return { added, modified, deleted }
}
