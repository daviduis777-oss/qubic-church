'use client'

import { TraderMaria } from './TraderMaria'
import { TrackRecord, useRecord } from './TrackRecord'

/** The record and Trader Maria read the same record, fetched once. */
export function RecordSection() {
  const r = useRecord()
  return (
    <>
      <TrackRecord r={r} />
      <TraderMaria r={r} />
    </>
  )
}
