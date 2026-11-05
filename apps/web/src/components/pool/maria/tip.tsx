'use client'

import { ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { ATRIUM, DONATION_ADDRESS } from '@/lib/donate'
import { Screen } from './flow'
import type { Go } from './flows'
import { Chips, CopyButton, Group, Say } from './ui'
import s from './maria.module.css'

/**
 * Tip Maria: the Atrium's address as a QR and a copy button. Opened from the quiet row under an answer,
 * never pushed: Maria does not ask for tips. The user sends from their own wallet; nothing is paid here.
 */
export function TipApp({ go }: { go: Go }) {
  const scroller = useRef<HTMLDivElement>(null)
  const home = () => go('home')
  return (
    <Screen
      dock={<Chips label="Done" onPick={home} options={[{ value: 'done', label: 'Done', primary: true }]} />}
      onBack={home}
      scrollRef={scroller}
      sub="Optional, and thank you."
      title="Tip Maria"
    >
      <Say>If I helped, you can leave a tip in QUBIC. {ATRIUM.line}</Say>
      <Group label="The Atrium's address">
        <li className={s.row} style={{ flexDirection: 'column', alignItems: 'center', gap: 14, padding: '18px 14px' }}>
          <div style={{ background: '#fff', padding: 10, borderRadius: 12, lineHeight: 0 }}>
            <QRCodeSVG aria-label="QR code of the Atrium's address" size={156} value={DONATION_ADDRESS} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span className={`${s.rowMono}`} style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontSize: 12.5 }}>
              {DONATION_ADDRESS}
            </span>
            <CopyButton label="Copy the address" text={DONATION_ADDRESS} />
          </div>
        </li>
        <li className={s.row}>
          <div className={s.rowMain}>
            <p className={s.rowBody} style={{ marginTop: 0 }}>
              Send from your own wallet, any amount. Nobody from QC will ever write to you for a tip or ask for your seed.
            </p>
            <a className={s.textLink} href={ATRIUM.page} rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 14 }} target="_blank">
              About the Atrium
              <ExternalLink aria-hidden size={13} />
            </a>
          </div>
        </li>
      </Group>
    </Screen>
  )
}
