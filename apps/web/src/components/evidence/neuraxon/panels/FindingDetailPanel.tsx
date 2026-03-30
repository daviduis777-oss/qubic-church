'use client'

import { X, MapPin, Binary, Sigma, AlertTriangle, RotateCcw, Copy, ExternalLink, Globe, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SelectedElement, BridgeNode, InterestingAddress } from '../types'

interface FindingDetailPanelProps {
  element: SelectedElement
  onClose: () => void
}

export function FindingDetailPanel({ element, onClose }: FindingDetailPanelProps) {
  return (
    <div className="absolute top-3 right-2 left-2 sm:left-auto sm:right-3 sm:w-[320px] max-h-[80%] overflow-y-auto pointer-events-auto bg-black/80 backdrop-blur-sm border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <ElementIcon type={element.type} />
          <span className="text-xs font-mono text-[#D4AF37]/70 uppercase tracking-wider">
            {elementTitle(element)}
          </span>
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {element.type === 'matrix-cell' && <MatrixCellDetail row={element.row} col={element.col} value={element.value} />}
        {element.type === 'bridge-node' && <BridgeNodeDetail node={element.node} />}
        {element.type === 'eigenvalue' && <EigenvalueDetail index={element.index} data={element.data} />}
        {element.type === 'anomaly' && <AnomalyDetail pair={element.pair} />}
        {element.type === 'period4-phase' && <Period4Detail phase={element.phase} behavior={element.behavior} energy={element.energy} />}
        {element.type === 'address' && <AddressDetail address={element.address} />}
        {element.type === 'message' && <MessageDetail text={element.text} method={element.method} positions={element.positions} pValue={element.pValue} />}
      </div>
    </div>
  )
}

function ElementIcon({ type }: { type: SelectedElement['type'] }) {
  switch (type) {
    case 'matrix-cell': return <MapPin className="w-3.5 h-3.5 text-[#D4AF37]/50" />
    case 'bridge-node': return <Binary className="w-3.5 h-3.5 text-blue-400/50" />
    case 'eigenvalue': return <Sigma className="w-3.5 h-3.5 text-purple-400/50" />
    case 'anomaly': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50" />
    case 'period4-phase': return <RotateCcw className="w-3.5 h-3.5 text-emerald-400/50" />
    case 'address': return <Globe className="w-3.5 h-3.5 text-cyan-400/50" />
    case 'message': return <MessageSquare className="w-3.5 h-3.5 text-pink-400/50" />
  }
}

function elementTitle(el: SelectedElement): string {
  switch (el.type) {
    case 'matrix-cell': return 'Matrix Cell'
    case 'bridge-node': return 'Bridge Node'
    case 'eigenvalue': return 'Eigenvalue'
    case 'anomaly': return 'Anomaly Pair'
    case 'period4-phase': return 'Period-4 Phase'
    case 'address': return 'Address'
    case 'message': return 'Message'
  }
}

function DetailRow({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      <span className={cn('text-xs text-white/70 text-right', mono && 'font-mono')}>{value}</span>
    </div>
  )
}

function MatrixCellDetail({ row, col, value }: { row: number; col: number; value: number }) {
  const strata = row === 21 ? 'Input Layer' : row === 68 ? 'Transform Layer' : row === 96 ? 'Output Layer' : 'Hidden'
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Position" value={`[${row}, ${col}]`} />
        <DetailRow label="Value" value={value} />
        <DetailRow label="Normalized" value={(value / 127).toFixed(3)} />
        <DetailRow label="Row Strata" value={strata} />
        <DetailRow label="Mirror Pos" value={`[${127 - row}, ${127 - col}]`} />
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Each cell in the 128x128 Anna Matrix encodes an interaction weight.
          {row === 21 && ' Row 21 is the Bitcoin input layer -- where external data enters the network.'}
          {row === 68 && ' Row 68 is the transformation bridge -- where 137 write operations (the fine-structure constant) occur.'}
          {row === 96 && ' Row 96 is the output layer -- where processed results exit the network.'}
        </p>
      </div>
    </>
  )
}

function AddressRow({ label, address, explorerUrl }: { label: string; address: string; explorerUrl: string }) {
  const handleCopy = () => {
    try { navigator.clipboard.writeText(address) } catch { /* noop */ }
  }

  return (
    <div className="space-y-1">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex items-start gap-1">
        <span className="text-[10px] font-mono text-white/70 break-all leading-relaxed flex-1">
          {address}
        </span>
        <button onClick={handleCopy} className="p-0.5 text-white/30 hover:text-white/60 transition-colors shrink-0" title="Copy address">
          <Copy className="w-3 h-3" />
        </button>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="p-0.5 text-white/30 hover:text-white/60 transition-colors shrink-0" title="View in explorer">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

function BridgeNodeDetail({ node }: { node: BridgeNode }) {
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Name" value={node.name} />
        <DetailRow label="Type" value={node.type} />
        <DetailRow label="Category" value={node.ternary_category} />
        {node.bitcoin_address && (
          <AddressRow
            label="BTC Address"
            address={node.bitcoin_address}
            explorerUrl={`https://www.blockchain.com/btc/address/${node.bitcoin_address}`}
          />
        )}
        {node.qubic_identity && (
          <AddressRow
            label="Qubic ID"
            address={node.qubic_identity}
            explorerUrl={`https://explorer.qubic.org/network/address/${node.qubic_identity}`}
          />
        )}
        {node.metadata.column !== undefined && <DetailRow label="Column" value={node.metadata.column} />}
        {node.metadata.hash160_prefix && <DetailRow label="Hash160" value={node.metadata.hash160_prefix} />}
        {node.special && <DetailRow label="Special" value={node.special} />}
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Bridge nodes connect the Anna Matrix to real Bitcoin and Qubic addresses.
          Each node represents a matrix column mapped to a cryptographic identity through K12 hashing.
          {node.special && ` This node is marked as special: ${node.special}.`}
        </p>
      </div>
    </>
  )
}

function EigenvalueDetail({ index, data }: { index: number; data: { real: number; imag: number; magnitude: number; angle_deg: number } }) {
  const isDominant = Math.abs(data.angle_deg) > 89 && Math.abs(data.angle_deg) < 91
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Index" value={`#${index}`} />
        <DetailRow label="Real" value={data.real.toFixed(3)} />
        <DetailRow label="Imaginary" value={data.imag.toFixed(3)} />
        <DetailRow label="Magnitude" value={data.magnitude.toFixed(3)} />
        <DetailRow label="Angle" value={`${data.angle_deg.toFixed(3)}°`} />
        {isDominant && <DetailRow label="Dominance" value="40.4% spectral power" />}
      </div>
      {isDominant && (
        <div className="bg-[#D4AF37]/[0.06] border border-[#D4AF37]/15 p-2 mt-2">
          <p className="text-[11px] text-[#D4AF37]/60 leading-relaxed">
            This is the dominant eigenvalue at 90.456° -- the mathematical source of the period-4 behavioral cycle.
            It creates the COOP-COOP-REST-REST rhythm that produces 33% stable cooperation in artificial life simulations.
          </p>
        </div>
      )}
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          Eigenvalues describe the fundamental modes of the matrix. The angle determines the period of oscillation,
          and the magnitude determines how strongly that mode amplifies signals.
        </p>
      </div>
    </>
  )
}

function AnomalyDetail({ pair }: { pair: { pos: [number, number]; value: number; mirrorPos: [number, number]; mirrorValue: number; sum: number } }) {
  const isSpecial = pair.pos[0] === 22 && pair.pos[1] === 22
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Position" value={`[${pair.pos[0]}, ${pair.pos[1]}]`} />
        <DetailRow label="Value" value={pair.value} />
        <DetailRow label="Mirror Position" value={`[${pair.mirrorPos[0]}, ${pair.mirrorPos[1]}]`} />
        <DetailRow label="Mirror Value" value={pair.mirrorValue} />
        <DetailRow label="Sum" value={pair.sum} />
        {isSpecial && <DetailRow label="Special" value="Only cell where value = mirror_value" />}
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          This anomaly pair breaks the matrix's 99.58% point symmetry.
          Of 16,384 cells, only 68 (34 pairs) deviate from perfect M[r,c] + M[127-r, 127-c] = -1.
          {isSpecial && ' Position [22,22] is unique: the only cell where value equals its mirror, with coordinate sum 127 (Mersenne prime).'}
        </p>
      </div>
    </>
  )
}

function Period4Detail({ phase, behavior, energy }: { phase: number; behavior: string; energy: number }) {
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Phase" value={`${phase + 1} of 4`} />
        <DetailRow label="Behavior" value={behavior} />
        <DetailRow label="Energy Level" value={energy} />
        <DetailRow label="Sequence" value="COOP → COOP → REST → REST" />
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          The period-4 cycle emerges from the dominant eigenvalue at 90.456°.
          Every 4 ticks, the system returns to its starting state.
          This creates a natural rhythm: two ticks of cooperation followed by two ticks of rest.
          In 10M-tick ALife simulations, this produces exactly 33.0% (±0.1%) cooperation rate across all seeds tested.
        </p>
      </div>
    </>
  )
}

function AddressDetail({ address }: { address: InterestingAddress }) {
  return (
    <>
      <div className="space-y-1.5">
        <AddressRow
          label="BTC Address"
          address={address.address}
          explorerUrl={`https://www.blockchain.com/btc/address/${address.address}`}
        />
        <DetailRow label="Position" value={`[${address.position[0]}, ${address.position[1]}]`} />
        <DetailRow label="Method" value={address.method} />
        <DetailRow label="XOR Value" value={address.xor} />
        <DetailRow label="Compressed" value={address.compressed ? 'Yes' : 'No'} />
        <DetailRow label="Hash160" value={address.hash160.slice(0, 20) + '...'} />
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          This Bitcoin address was derived from the Anna Matrix using the {address.method} extraction method.
          It is positioned at matrix coordinate [{address.position[0]}, {address.position[1]}] with XOR distance {address.xor} from a known hash prefix.
        </p>
      </div>
    </>
  )
}

function MessageDetail({ text, method, positions, pValue }: { text: string; method: string; positions: number[][]; pValue: number }) {
  return (
    <>
      <div className="space-y-1.5">
        <DetailRow label="Text" value={text} />
        <DetailRow label="Method" value={method} />
        <DetailRow label="Positions" value={positions.map((p) => `[${p[0]},${p[1]}]`).join(' ')} />
        <DetailRow label="p-Value" value={pValue.toFixed(4)} />
        <DetailRow label="Significance" value={pValue < 0.01 ? 'High' : pValue < 0.05 ? 'Moderate' : 'Low'} />
      </div>
      <div className="bg-white/[0.02] border border-white/[0.04] p-2 mt-2">
        <p className="text-[11px] text-white/40 leading-relaxed">
          The text "{text}" was found encoded in the matrix using the {method} extraction method
          across {positions.length} consecutive cells. The p-value of {pValue} indicates the
          probability of this pattern occurring by chance in a random matrix.
        </p>
      </div>
    </>
  )
}
