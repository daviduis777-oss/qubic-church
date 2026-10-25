'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useRef, useState } from 'react'

export type Me = { auth: 'qubic' | 'trip'; name: string; handle: string; id: string }

type Account = { address: string; name: string; amount: number }
type SignClientT = {
  connect: (o: unknown) => Promise<{ uri?: string; approval: () => Promise<{ topic: string }> }>
  request: <T>(o: { topic: string; chainId: string; request: { method: string; params?: unknown } }) => Promise<T>
  disconnect: (o: { topic: string; reason: { code: number; message: string } }) => Promise<void>
}

const CHAIN = 'qubic:mainnet'
const METHODS = ['qubic_requestAccounts', 'qubic_sign']

/**
 * Sign in with a Qubic wallet (WalletConnect, qubic_sign) or with a tripcode.
 * Nothing personal is sent: the wallet signs a one-time challenge, the server keeps the public ID.
 */
export function LoginBox({ onLogin }: { onLogin: (me: Me) => void }) {
  const [tab, setTab] = useState<'qubic' | 'trip'>('qubic')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [uri, setUri] = useState('')
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [secret, setSecret] = useState('')
  const client = useRef<SignClientT | null>(null)
  const topic = useRef('')
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

  useEffect(() => {
    try {
      setName(localStorage.getItem('qcf-name') ?? '')
    } catch {}
  }, [])

  const finish = useCallback(
    async (payload: Record<string, string>) => {
      const r = await fetch('/api/forum/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, name }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'login failed')
      try {
        localStorage.setItem('qcf-name', name)
      } catch {}
      onLogin(j.user)
    },
    [name, onLogin],
  )

  const connect = async () => {
    setErr('')
    if (name.trim().length < 2) return setErr('Pick a name first.')
    if (!projectId) return setErr('Wallet login is not configured on this site yet.')
    setBusy('Preparing the connection…')
    try {
      if (!client.current) {
        const { SignClient } = await import('@walletconnect/sign-client')
        client.current = (await SignClient.init({
          projectId,
          metadata: { name: 'Qubic Church Forum', description: 'Login by signature. Nothing moves.', url: 'https://qubic.church', icons: ['https://qubic.church/favicon.ico'] },
        })) as unknown as SignClientT
      }
      const { uri: u, approval } = await client.current.connect({ requiredNamespaces: { qubic: { chains: [CHAIN], methods: METHODS, events: ['accountsChanged'] } } })
      setUri(u ?? '')
      setBusy('Scan with the Qubic wallet, or open it on this phone, and approve.')
      const session = await approval()
      topic.current = session.topic
      setUri('')
      setBusy('Reading accounts…')
      const accs = await client.current.request<Account[]>({ topic: session.topic, chainId: CHAIN, request: { method: 'qubic_requestAccounts' } })
      setAccounts(accs)
      setBusy('')
    } catch (e) {
      setUri('')
      setBusy('')
      setErr((e as Error).message || 'Connection rejected.')
    }
  }

  const sign = async (address: string) => {
    setErr('')
    setBusy('Approve the signature in the wallet…')
    try {
      const ch = await (await fetch('/api/forum/nonce', { cache: 'no-store' })).json()
      const res = await client.current!.request<{ signature: string }>({ topic: topic.current, chainId: CHAIN, request: { method: 'qubic_sign', params: { from: address, message: ch.message } } })
      await finish({ method: 'qubic', identity: address, token: ch.token, signature: res.signature })
      try {
        await client.current!.disconnect({ topic: topic.current, reason: { code: 6000, message: 'logged in' } })
      } catch {}
    } catch (e) {
      setErr((e as Error).message || 'Signature rejected.')
    } finally {
      setBusy('')
    }
  }

  const trip = async () => {
    setErr('')
    setBusy('…')
    try {
      await finish({ method: 'trip', secret })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  const field = { width: '100%', maxWidth: 420, padding: '5px 7px', border: '1px solid #8a8a8a', font: 'inherit', background: '#fff' }

  return (
    <div className="qcf-box">
      <div className="qcf-cat">Login</div>
      <div className="qcf-win" style={{ padding: '10px 14px' }}>
        <p style={{ margin: '0 0 8px' }}>
          <b>Name on the forum</b>
          <br />
          <input maxLength={24} onChange={e => setName(e.target.value)} placeholder="how you want to be called" style={field} value={name} />
        </p>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700, margin: '10px 0 6px' }}>
          <button onClick={() => setTab('qubic')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: tab === 'qubic' ? '#000' : 'var(--qcf-link)', textDecoration: tab === 'qubic' ? 'none' : 'underline' }} type="button">
            Qubic wallet
          </button>
          <button onClick={() => setTab('trip')} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: tab === 'trip' ? '#000' : 'var(--qcf-link)', textDecoration: tab === 'trip' ? 'none' : 'underline' }} type="button">
            Tripcode
          </button>
        </div>

        {tab === 'qubic' && (
          <div>
            <p className="qcf-small qcf-muted" style={{ margin: '0 0 8px' }}>
              Your wallet signs a one-time line of text. That proves you hold the ID. No transaction, no seed, nothing leaves the wallet. We keep the public ID only.
            </p>
            {!uri && !accounts && (
              <button className="qcf-btn qcf-btn-main" disabled={Boolean(busy)} onClick={connect} style={{ cursor: 'pointer' }} type="button">
                Connect Qubic wallet
              </button>
            )}
            {uri && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff', padding: 8, border: '1px solid var(--qcf-line)' }}>
                  <QRCodeSVG size={180} value={uri} />
                </div>
                <div style={{ fontSize: 12 }}>
                  <p style={{ margin: '0 0 8px' }}>Scan this with the Qubic wallet app (Settings → WalletConnect).</p>
                  <p style={{ margin: '0 0 8px' }}>
                    On this phone:{' '}
                    <a className="qcf-btn" href={`qubic-wallet://pairwc/${uri}`}>
                      Open Qubic wallet
                    </a>
                  </p>
                </div>
              </div>
            )}
            {accounts && (
              <div>
                <p style={{ margin: '0 0 6px' }}>
                  <b>Sign in as</b>
                </p>
                {accounts.map(a => (
                  <p key={a.address} style={{ margin: '0 0 6px' }}>
                    <button className="qcf-btn" disabled={Boolean(busy)} onClick={() => sign(a.address)} style={{ cursor: 'pointer' }} type="button">
                      {a.name || 'account'} · {a.address.slice(0, 6)}…{a.address.slice(-4)}
                    </button>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'trip' && (
          <div>
            <p className="qcf-small qcf-muted" style={{ margin: '0 0 8px' }}>
              No wallet? Use a tripcode, the way the old boards did. Pick a secret word; the forum shows a short code made from it next to your name, so people know it is the same you. We store the code, never the word. Lose the word and the name is gone.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <input maxLength={64} onChange={e => setSecret(e.target.value)} placeholder="secret word, 8+ characters" style={field} type="password" value={secret} />
            </p>
            <button className="qcf-btn qcf-btn-main" disabled={Boolean(busy)} onClick={trip} style={{ cursor: 'pointer' }} type="button">
              Login with tripcode
            </button>
          </div>
        )}

        {busy && <p className="qcf-small" style={{ margin: '10px 0 0' }}>{busy}</p>}
        {err && (
          <p className="qcf-small" style={{ margin: '10px 0 0', color: '#b00' }}>
            {err}
          </p>
        )}
      </div>
    </div>
  )
}
