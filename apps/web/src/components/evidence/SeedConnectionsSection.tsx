'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VerificationBadge } from '@/components/ui/VerificationBadge'
import {
  CORE_FORMULA,
  K12_DERIVATION,
  CFB_CLONES,
  ARB_ORACLE,
  VERIFICATION_CHECKLIST,
  KEY_ADDRESSES,
} from '@/data/research-summary'

export function SeedConnectionsSection() {
  const [activeTab, setActiveTab] = useState<'formula' | 'k12' | 'clones' | 'verification'>('formula')

  return (
    <section id="seed-connections" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <VerificationBadge level="verified" size="sm" />
            <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Mathematical Proofs
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Seed Connections
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The mathematical relationships between Bitcoin and Qubic, verified with 99% confidence.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'formula', label: 'Core Formula' },
            { id: 'k12', label: 'K12 Derivation' },
            { id: 'clones', label: '1CFB Clones' },
            { id: 'verification', label: 'Verification' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Core Formula Tab */}
          {activeTab === 'formula' && (
            <div className="space-y-6">
              <div className="p-6 border border-border bg-card/50 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="text-4xl md:text-5xl font-mono font-bold text-primary mb-2">
                    {CORE_FORMULA.equation}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <VerificationBadge level="verified" size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {CORE_FORMULA.validation.confidence}% Confidence
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50">
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      {CORE_FORMULA.components.blockHeight.value}
                    </div>
                    <div className="text-sm font-medium">
                      {CORE_FORMULA.components.blockHeight.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prime #{CORE_FORMULA.components.blockHeight.primeIndex}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      47<sup>2</sup> = {CORE_FORMULA.components.primeSquared.value}
                    </div>
                    <div className="text-sm font-medium">
                      {CORE_FORMULA.components.primeSquared.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Prime #{CORE_FORMULA.components.primeSquared.primeIndex}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      {CORE_FORMULA.components.alpha.value}
                    </div>
                    <div className="text-sm font-medium">
                      {CORE_FORMULA.components.alpha.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {CORE_FORMULA.components.alpha.physicsConnection}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 font-mono text-sm">
                  <div className="text-muted-foreground mb-1">Calculation:</div>
                  <div>{CORE_FORMULA.validation.calculation}</div>
                </div>
              </div>
            </div>
          )}

          {/* K12 Derivation Tab */}
          {activeTab === 'k12' && (
            <div className="space-y-6">
              <div className="p-6 border border-border bg-card/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">{K12_DERIVATION.algorithm}</h3>
                <p className="text-muted-foreground mb-6">
                  The KangarooTwelve hash function derives Qubic identities through a 4-step chain.
                </p>

                <div className="space-y-4">
                  {K12_DERIVATION.chain.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.operation}</div>
                        <div className="text-sm text-muted-foreground">
                          {step.input} → {step.output}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50">
                    <div className="text-sm font-medium mb-2">Identity Format</div>
                    <div className="font-mono text-xs space-y-1">
                      <div>Total Length: {K12_DERIVATION.identityFormat.totalLength}</div>
                      <div>Body: {K12_DERIVATION.identityFormat.bodyLength} chars</div>
                      <div>Checksum: {K12_DERIVATION.identityFormat.checksumLength} chars</div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50">
                    <div className="text-sm font-medium mb-2">Seed Format</div>
                    <div className="font-mono text-xs space-y-1">
                      <div>Length: {K12_DERIVATION.seedFormat.length} chars</div>
                      <div>Charset: a-z only</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1CFB Clones Tab */}
          {activeTab === 'clones' && (
            <div className="space-y-6">
              <div className="p-6 border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold">1CFB Address Pattern</h3>
                  <VerificationBadge level="verified" size="sm" />
                </div>

                <div className="p-4 bg-muted/50 mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Original Address</div>
                  <div className="font-mono text-sm break-all">{CFB_CLONES.original.address}</div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Block: {CFB_CLONES.original.block}</span>
                    <span>Amount: {CFB_CLONES.original.amount} BTC</span>
                    <span>Status: {CFB_CLONES.original.status}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-3">Cloning Methods</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {CFB_CLONES.cloningMethods.map((method, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 border border-border">
                        <div className="font-medium font-mono">{method.method}</div>
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {method.xorValues.map((xor) => (
                            <span key={xor} className="px-2 py-0.5 bg-primary/20 text-xs font-mono">
                              XOR {xor}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{CFB_CLONES.cloneCount}</div>
                    <div className="text-sm text-muted-foreground">Total Clones</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{CFB_CLONES.hashPrefix}</div>
                    <div className="text-sm text-muted-foreground">Hash Prefix</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{CFB_CLONES.matchLength.min}-{CFB_CLONES.matchLength.max}</div>
                    <div className="text-sm text-muted-foreground">Bytes Matched</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="p-6 border border-border bg-card/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Verification Checklist</h3>
                <p className="text-muted-foreground mb-6">
                  All claims verified against on-chain data and mathematical proofs.
                </p>

                <div className="space-y-2">
                  {VERIFICATION_CHECKLIST.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center justify-between p-3',
                        item.verified ? 'bg-[#D4AF37]/10' : 'bg-[#D4AF37]/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-5 h-5 flex items-center justify-center text-xs',
                          item.verified ? 'bg-[#D4AF37] text-white' : 'bg-[#D4AF37] text-black'
                        )}>
                          {item.verified ? '✓' : '?'}
                        </div>
                        <span className="font-mono text-sm">{item.claim}</span>
                      </div>
                      <span className={cn(
                        'text-sm font-medium',
                        item.confidence >= 95 ? 'text-[#D4AF37]' :
                        item.confidence >= 70 ? 'text-[#D4AF37]' :
                        'text-[#D4AF37]'
                      )}>
                        {item.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Addresses */}
              <div className="p-6 border border-border bg-card/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Key Addresses</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Bitcoin</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#D4AF37]/10">
                        <div className="text-xs text-muted-foreground">Genesis</div>
                        <div className="font-mono text-sm break-all">{KEY_ADDRESSES.bitcoin.genesis}</div>
                      </div>
                      <div className="p-3 bg-[#D4AF37]/10">
                        <div className="text-xs text-muted-foreground">CFB</div>
                        <div className="font-mono text-sm break-all">{KEY_ADDRESSES.bitcoin.cfb}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Qubic</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#D4AF37]/10">
                        <div className="text-xs text-muted-foreground">ARB Oracle</div>
                        <div className="font-mono text-xs break-all">{KEY_ADDRESSES.qubic.arb}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
