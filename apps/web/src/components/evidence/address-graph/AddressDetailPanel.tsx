'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Copy,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Network,
  Key,
  Hash,
  Layers,
  Clock,
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AddressDetailPanelProps, AddressNode, AddressEdge } from './types'
import { NODE_TYPE_CONFIG, METHOD_CONFIG, XOR_RING_CONFIG, EDGE_TYPE_CONFIG } from './constants'
import { useBlockchainData } from '@/lib/hooks/useBlockchainData'
import { formatBTC, getAddressStatus, getAddressAge } from '@/lib/blockchain/blockchain-api'

// =============================================================================
// ADDRESS DETAIL PANEL
// =============================================================================

export function AddressDetailPanel({
  node,
  connections,
  onClose,
  onNodeClick,
  getNodeById,
}: AddressDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const config = NODE_TYPE_CONFIG[node.type]

  // Fetch live blockchain data
  const lookupAddress = node.derivedAddress || node.address
  const { data: blockchainData, isLoading, error, refetch } = useBlockchainData(
    lookupAddress && !lookupAddress.startsWith('[') ? lookupAddress : null
  )

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const totalConnections = connections.incoming.length + connections.outgoing.length

  return (
    <motion.div
      className="absolute top-0 right-0 h-full w-96 bg-gray-950/95 border-l border-white/[0.04] backdrop-blur-xl overflow-hidden flex flex-col"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 flex-shrink-0"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-sm font-medium" style={{ color: config.color }}>
                {config.label}
              </span>
              {node.isVIP && (
                <span className="px-1.5 py-0.5 text-[10px] bg-[#D4AF37]/20 text-[#D4AF37]">
                  VIP
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-white truncate">
                {node.address.length > 30
                  ? `${node.address.slice(0, 16)}...${node.address.slice(-10)}`
                  : node.address}
              </code>
              <button
                onClick={() => handleCopy(node.address, 'address')}
                className="p-1 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                {copiedField === 'address' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mt-1 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-2 bg-white/5 text-center">
            <div className="text-lg font-bold text-white">{totalConnections}</div>
            <div className="text-[10px] text-gray-500">Connections</div>
          </div>
          {node.blockHeight !== undefined && (
            <div className="p-2 bg-white/5 text-center">
              <div className="text-lg font-bold text-[#D4AF37]">
                {node.blockHeight.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500">Block</div>
            </div>
          )}
          {node.amount !== undefined && (
            <div className="p-2 bg-white/5 text-center">
              <div className="text-lg font-bold text-[#D4AF37]">
                {node.amount.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-500">BTC</div>
            </div>
          )}
          {node.xorRings > 0 && (
            <div className="p-2 bg-white/5 text-center">
              <div className="text-lg font-bold text-[#D4AF37]">{node.xorRings}</div>
              <div className="text-[10px] text-gray-500">XOR Rings</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="identity" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start px-4 pt-2 bg-transparent border-b border-white/[0.04] rounded-none flex-shrink-0">
          <TabsTrigger
            value="identity"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Fingerprint className="w-3.5 h-3.5 mr-1.5" />
            Identity
          </TabsTrigger>
          <TabsTrigger
            value="connections"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Network className="w-3.5 h-3.5 mr-1.5" />
            Connections ({totalConnections})
          </TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Live Blockchain Data */}
          {lookupAddress && !lookupAddress.startsWith('[') && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Live Blockchain Data
                </h3>
                <button
                  onClick={refetch}
                  disabled={isLoading}
                  className="p-1 hover:bg-white/10 transition-colors disabled:opacity-50"
                  title="Refresh blockchain data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                  <span className="ml-2 text-sm text-gray-400">Fetching data...</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Error</span>
                  </div>
                  <p className="text-xs text-red-400/80">{error.message}</p>
                </div>
              )}

              {blockchainData && !isLoading && (
                <div className="space-y-3">
                  {/* Address Status Badge */}
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-400">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 ${
                          blockchainData.balance > 0
                            ? 'bg-[#D4AF37]'
                            : blockchainData.hasTransactions
                            ? 'bg-[#D4AF37]'
                            : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          blockchainData.balance > 0
                            ? 'text-[#D4AF37]'
                            : blockchainData.hasTransactions
                            ? 'text-[#D4AF37]'
                            : 'text-gray-500'
                        }`}
                      >
                        {getAddressStatus(blockchainData)}
                      </span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="p-3 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs text-[#D4AF37]/80">Current Balance</span>
                    </div>
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      {formatBTC(blockchainData.balance, 8)}
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white/5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[10px] text-gray-500">Received</span>
                      </div>
                      <div className="text-sm font-semibold text-[#D4AF37]">
                        {formatBTC(blockchainData.totalReceived, 4)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[10px] text-gray-500">Sent</span>
                      </div>
                      <div className="text-sm font-semibold text-[#D4AF37]">
                        {formatBTC(blockchainData.totalSent, 4)}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Count */}
                  <DataRow
                    icon={<Activity className="w-3.5 h-3.5" />}
                    label="Transactions"
                    value={blockchainData.txCount.toLocaleString()}
                  />

                  {/* Timestamps */}
                  {blockchainData.firstSeen && (
                    <DataRow
                      icon={<Clock className="w-3.5 h-3.5" />}
                      label="First Seen"
                      value={`${blockchainData.firstSeen.toLocaleDateString()} ${blockchainData.firstSeen.toLocaleTimeString()}`}
                    />
                  )}
                  {blockchainData.lastSeen && (
                    <DataRow
                      icon={<Clock className="w-3.5 h-3.5" />}
                      label="Last Seen"
                      value={`${blockchainData.lastSeen.toLocaleDateString()} ${blockchainData.lastSeen.toLocaleTimeString()}`}
                    />
                  )}

                  {/* Age */}
                  {blockchainData.firstSeen && (
                    <DataRow
                      icon={<Clock className="w-3.5 h-3.5" />}
                      label="Age"
                      value={`${getAddressAge(blockchainData)} days`}
                    />
                  )}

                  {/* Data Source */}
                  <div className="flex items-center justify-between p-2 bg-white/5">
                    <span className="text-xs text-gray-500">Source</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 capitalize">{blockchainData._source}</span>
                      {blockchainData._source === 'cache' && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-[#D4AF37]/20 text-[#D4AF37]">
                          Cached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Static Blockchain Data (from initial load) */}
          {(node.blockHeight !== undefined || node.amount !== undefined || node.scriptType || node.pubkey) && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Static Block Data
              </h3>
              <div className="space-y-2">
                {node.blockHeight !== undefined && (
                  <DataRow
                    icon={<Clock className="w-3.5 h-3.5" />}
                    label="Block Height"
                    value={node.blockHeight.toLocaleString()}
                  />
                )}
                {node.amount !== undefined && (
                  <DataRow
                    icon={<Coins className="w-3.5 h-3.5" />}
                    label="Mining Reward"
                    value={`${node.amount.toFixed(8)} BTC`}
                  />
                )}
                {node.scriptType && (
                  <DataRow
                    icon={<Layers className="w-3.5 h-3.5" />}
                    label="Script Type"
                    value={node.scriptType.toUpperCase()}
                  />
                )}
                {node.pubkey && (
                  <DataRow
                    icon={<Key className="w-3.5 h-3.5" />}
                    label="Public Key"
                    value={`${node.pubkey.slice(0, 20)}...`}
                    copyable
                    fullValue={node.pubkey}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
              </div>
            </section>
          )}

          {/* Derivation Data */}
          {(node.matrixPosition || node.derivationMethod || node.xorVariant !== undefined) && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Derivation Data
              </h3>
              <div className="space-y-2">
                {node.matrixPosition && (
                  <DataRow
                    icon={<Hash className="w-3.5 h-3.5" />}
                    label="Matrix Position"
                    value={`[${node.matrixPosition[0]}, ${node.matrixPosition[1]}]`}
                  />
                )}
                {node.derivationMethod && (
                  <div className="flex items-center justify-between p-2 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">Method</span>
                    </div>
                    <div
                      className="px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${METHOD_CONFIG[node.derivationMethod]?.color}20`,
                        color: METHOD_CONFIG[node.derivationMethod]?.color,
                      }}
                    >
                      {METHOD_CONFIG[node.derivationMethod]?.label || node.derivationMethod}
                    </div>
                  </div>
                )}
                {node.xorVariant !== undefined && node.xorVariant > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400">XOR Variant</span>
                    </div>
                    <div
                      className="px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${XOR_RING_CONFIG[node.xorVariant]?.color || '#fff'}20`,
                        color: XOR_RING_CONFIG[node.xorVariant]?.color || '#fff',
                      }}
                    >
                      {XOR_RING_CONFIG[node.xorVariant]?.label || `XOR ${node.xorVariant}`}
                    </div>
                  </div>
                )}
                {node.compressed !== undefined && (
                  <DataRow
                    icon={<Layers className="w-3.5 h-3.5" />}
                    label="Compression"
                    value={node.compressed ? 'Compressed' : 'Uncompressed'}
                  />
                )}
                {node.hash160 && (
                  <DataRow
                    icon={<Hash className="w-3.5 h-3.5" />}
                    label="Hash160"
                    value={`${node.hash160.slice(0, 16)}...`}
                    copyable
                    fullValue={node.hash160}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
              </div>
            </section>
          )}

          {/* Qubic Data */}
          {(node.seed || node.documentedIdentity || node.seedValidated !== undefined) && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Qubic Data
              </h3>
              <div className="space-y-2">
                {node.seed && (
                  <DataRow
                    icon={<Key className="w-3.5 h-3.5" />}
                    label="Seed"
                    value={`${node.seed.slice(0, 20)}...`}
                    copyable
                    fullValue={node.seed}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
                {node.documentedIdentity && (
                  <DataRow
                    icon={<Fingerprint className="w-3.5 h-3.5" />}
                    label="Documented Identity"
                    value={`${node.documentedIdentity.slice(0, 20)}...`}
                    copyable
                    fullValue={node.documentedIdentity}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
                {node.realIdentity && (
                  <DataRow
                    icon={<Fingerprint className="w-3.5 h-3.5" />}
                    label="Computed Identity"
                    value={`${node.realIdentity.slice(0, 20)}...`}
                    copyable
                    fullValue={node.realIdentity}
                    onCopy={handleCopy}
                    copiedField={copiedField}
                  />
                )}
                {node.seedValidated !== undefined && (
                  <div className="flex items-center justify-between p-2 bg-white/5">
                    <div className="flex items-center gap-2">
                      {node.seedValidated ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="text-xs text-gray-400">Seed Validation</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        node.seedValidated ? 'text-[#D4AF37]' : 'text-red-400'
                      }`}
                    >
                      {node.seedValidated ? 'Verified Match' : 'Mismatch'}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Derived Bitcoin Address (for P2PK) */}
          {node.derivedAddress && node.derivedAddress !== node.address && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Derived Bitcoin Address
              </h3>
              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs text-[#D4AF37] font-medium">P2PKH Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-white break-all">
                    {node.derivedAddress}
                  </code>
                  <button
                    onClick={() => handleCopy(node.derivedAddress!, 'derivedAddress')}
                    className="p-1 hover:bg-white/10 transition-colors flex-shrink-0"
                  >
                    {copiedField === 'derivedAddress' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#D4AF37]/60 mt-2">
                  This is the P2PKH address derived from the original P2PK public key
                </p>
              </div>
            </section>
          )}

          {/* External Links */}
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              External Links
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Use derivedAddress for P2PK outputs, otherwise use address */}
              {(() => {
                const lookupAddress = node.derivedAddress || node.address
                const isValidAddress = lookupAddress && !lookupAddress.startsWith('[') && lookupAddress.length > 20
                return (
                  <>
                    <a
                      href={isValidAddress ? `https://www.blockchain.com/btc/address/${lookupAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                        isValidAddress
                          ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={(e) => !isValidAddress && e.preventDefault()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Blockchain.com
                    </a>
                    <a
                      href={isValidAddress ? `https://mempool.space/address/${lookupAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                        isValidAddress
                          ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={(e) => !isValidAddress && e.preventDefault()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Mempool.space
                    </a>
                    <a
                      href={isValidAddress ? `https://blockchair.com/bitcoin/address/${lookupAddress}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                        isValidAddress
                          ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={(e) => !isValidAddress && e.preventDefault()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Blockchair
                    </a>
                  </>
                )
              })()}
            </div>
          </section>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Outgoing */}
          {connections.outgoing.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Outgoing ({connections.outgoing.length})
              </h3>
              <div className="space-y-2">
                {connections.outgoing.slice(0, 20).map((edge) => (
                  <ConnectionRow
                    key={edge.id}
                    edge={edge}
                    nodeId={edge.target}
                    getNodeById={getNodeById}
                    onClick={onNodeClick}
                    direction="out"
                  />
                ))}
                {connections.outgoing.length > 20 && (
                  <p className="text-xs text-gray-600 text-center py-2">
                    +{connections.outgoing.length - 20} more
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Incoming */}
          {connections.incoming.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Incoming ({connections.incoming.length})
              </h3>
              <div className="space-y-2">
                {connections.incoming.slice(0, 20).map((edge) => (
                  <ConnectionRow
                    key={edge.id}
                    edge={edge}
                    nodeId={edge.source}
                    getNodeById={getNodeById}
                    onClick={onNodeClick}
                    direction="in"
                  />
                ))}
                {connections.incoming.length > 20 && (
                  <p className="text-xs text-gray-600 text-center py-2">
                    +{connections.incoming.length - 20} more
                  </p>
                )}
              </div>
            </section>
          )}

          {totalConnections === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="w-12 h-12 text-gray-700 mb-4" />
              <p className="text-sm text-gray-500">No connections found</p>
              <p className="text-xs text-gray-600 mt-1">
                This node is isolated in the current view
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// =============================================================================
// DATA ROW COMPONENT
// =============================================================================

interface DataRowProps {
  icon: React.ReactNode
  label: string
  value: string
  copyable?: boolean
  fullValue?: string
  onCopy?: (text: string, field: string) => void
  copiedField?: string | null
}

function DataRow({
  icon,
  label,
  value,
  copyable,
  fullValue,
  onCopy,
  copiedField,
}: DataRowProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-white/5 group">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <code className="text-xs font-mono text-white">{value}</code>
        {copyable && onCopy && (
          <button
            onClick={() => onCopy(fullValue || value, label)}
            className="p-1 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedField === label ? (
              <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
            ) : (
              <Copy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CONNECTION ROW COMPONENT
// =============================================================================

interface ConnectionRowProps {
  edge: AddressEdge
  nodeId: string
  getNodeById: (id: string) => AddressNode | undefined
  onClick: (node: AddressNode) => void
  direction: 'in' | 'out'
}

function ConnectionRow({
  edge,
  nodeId,
  getNodeById,
  onClick,
  direction,
}: ConnectionRowProps) {
  const targetNode = getNodeById(nodeId)
  if (!targetNode) return null

  const edgeConfig = EDGE_TYPE_CONFIG[edge.type]
  const nodeConfig = NODE_TYPE_CONFIG[targetNode.type]

  return (
    <button
      onClick={() => onClick(targetNode)}
      className="w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 transition-colors text-left group"
    >
      {/* Direction indicator */}
      <div
        className={`w-6 h-6 flex items-center justify-center ${
          direction === 'out' ? 'bg-[#D4AF37]/20' : 'bg-[#D4AF37]/20'
        }`}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 ${
            direction === 'out' ? 'text-[#D4AF37]' : 'text-[#D4AF37] rotate-180'
          }`}
        />
      </div>

      {/* Node info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 flex-shrink-0"
            style={{ backgroundColor: targetNode.color }}
          />
          <code className="text-xs font-mono text-white truncate">
            {targetNode.address.length > 24
              ? `${targetNode.address.slice(0, 12)}...${targetNode.address.slice(-8)}`
              : targetNode.address}
          </code>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-500">{nodeConfig.label}</span>
          <span
            className="text-[10px] px-1.5 py-0.5"
            style={{
              backgroundColor: `${edgeConfig.color}20`,
              color: edgeConfig.color,
            }}
          >
            {edgeConfig.label}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
    </button>
  )
}
