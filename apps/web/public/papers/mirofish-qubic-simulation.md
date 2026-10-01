# MIROFISH SIMULATION BRIEF
## Qubic / Aigarth / DOGE Mining — Strategic Narrative Simulation
### Version 1.0 — March 30, 2026

---

## PART 1: SIMULATION OBJECTIVES (TZ)

### Primary Questions for Simulation

1. **DOGE mainnet reaction (April 1, 2026):** How will the crypto community respond to Qubic's Dogecoin mining launch? Which coalitions form? Where is the strongest resistance?

2. **Narrative trajectory:** Will the dominant story be "revolutionary uPOW architecture" or "another altcoin trying to attack a real chain"? Which framing wins and why?

3. **DOGE community dynamics:** How will existing Dogecoin miners, holders, and influencers react? Is there a defection scenario or unified resistance?

4. **Paris Blockchain Week (April 15-16):** How does the institutional audience (10,000+ participants, Carrousel du Louvre) perceive Qubic? What arguments land? What gets dismissed?

5. **Aigarth horizon (April 13, 2027):** What does the narrative look like 12 months after DOGE mainnet if hashrate grows as projected? Does the "decentralized AGI" thesis gain mainstream traction?

### Simulation Parameters

- **Agents:** 800 minimum (scale to 2000 for Phase 3)
- **Rounds:** 25 per scenario
- **Memory:** Persistent across rounds (agents remember prior interactions)
- **Language:** English primary, Spanish/Chinese secondary clusters
- **Time horizon:** April 1 → April 30, 2026 (Phase 1); optional Phase 2 to April 2027

### Agent Profile Distribution

**Crypto-native (40%):**
- Dogecoin OG holders / grassroots community (strong loyalty, meme culture)
- Bitcoin maximalists (hostile to all altcoins, especially AI narratives)
- Altcoin traders / speculators (neutral, follow price)
- DeFi / infrastructure builders (technical, skeptical but curious)
- Monero community remnants (adversarial, remember the 51% event)

**Mining industry (20%):**
- ASIC miners with obsolete Scrypt hardware (Antminer L3+) — economically motivated
- Large mining pools (F2Pool, ViaBTC, Antpool) — risk-averse, institutional
- Small independent miners — opportunistic, follow incentives
- Mining media / analysts — neutral, follow data

**AI / Tech (20%):**
- AI researchers / ML engineers — interested in uPOW concept, skeptical of blockchain claims
- Decentralized AI advocates — aligned with Qubic thesis
- LLM critics / centralized AI defenders — potential adversaries
- Princeton/academic crowd — interested in energy efficiency angle

**Institutional / Investor (10%):**
- Crypto VCs — looking for narrative strength
- Traditional finance observers — watching Stargate vs decentralized alternative
- Regulatory watchers — concerned about 51% attack history

**Media / Narrative (10%):**
- Crypto journalists (CoinDesk, The Block, Decrypt)
- Mainstream tech media (Wired, MIT Tech Review)
- YouTube/Twitter influencers (meme-native, high reach)

---

## PART 2: INPUT DOCUMENT FOR GRAPHRAG

### 2.1 What is Qubic

Qubic is a decentralized Layer 1 blockchain protocol founded by Sergey Ivancheglo (known as Come-from-Beyond or CfB) — the creator of NXT (2013, first proof-of-stake blockchain) and IOTA (2015, first DAG architecture). Qubic launched in 2021.

Core technical specifications:
- 15.52 million transactions per second (TPS), certified by CertiK — the highest certified throughput of any blockchain
- Zero transaction fees
- Tick speed: 0.5-0.6 seconds (reduced from 2 seconds in one year)
- Quorum consensus: 676 independent computors must reach bit-level hash agreement
- Byzantine fault tolerance: 451 of 676 computors required for validation
- Governance: community computor vote — Governance Framework approved Epoch 200, February 14, 2026 (614 yes votes, 0 no votes)
- Token: $QUBIC, deflationary epoch-based emission schedule

### 2.2 Useful Proof of Work (uPOW) — Core Architecture

Traditional Proof of Work produces a number (nonce) that proves computational work was done. It has no other use.

Qubic's Useful Proof of Work directs the same computational energy toward real-world tasks: training Aigarth (Qubic's AI research initiative). Miners contribute processing power to advance neural network evolution, and the network rewards them with QU tokens.

The key innovation: computation that would otherwise be wasted on cryptographic puzzles instead advances AI research. This is the "useful" distinction — same energy expenditure, radically different output.

uPOW has two layers:
1. **CPU/GPU layer:** Runs AI training (Neuraxon/Aigarth evolution). This is the primary purpose.
2. **External PoW layer:** Runs external blockchain mining (Monero previously, Dogecoin from April 1, 2026). Revenue from external mining funds the buyback and burn of QUBIC tokens.

The architecture is designed as a general-purpose coordination layer for external proof-of-work systems. It was never designed for a single network.

### 2.3 Oracle Machines

Oracle Machines are Qubic's native on-chain data verification infrastructure, operating without third-party oracles (no Chainlink dependency).

- Went live on mainnet: February 11, 2026
- As of March 2026: 11,212+ oracle requests processed, zero unresolved
- Architecture: each share submitted by a miner gets validated by independent computors in a single tick
- Up to 13 oracle commits per transaction
- Byzantine fault tolerance threshold: 451 of 676 computors must agree
- Dogecoin mining is the first real-world external use case deployed on this infrastructure

Significance: Oracle Machines eliminate the trust assumption in external mining validation. A share is valid not because a pool says so, but because 451 independent computors independently verified it.

### 2.4 The Monero Experiment (Summer 2025)

In August 2025, Qubic's mining network achieved between 34-51% of Monero's total hashrate (exact figure disputed — CfB himself stated "should be rebranded into 34% attack"). The operation:

- Generated over $3.5 million in mining revenue
- Found over 26,000 XMR blocks
- Caused a blockchain reorganization event
- Attracted responses from Ledger's CTO (called it "ongoing 51% attack")
- Proved that Qubic's coordinated compute infrastructure has real-world impact at scale
- Demonstrated the economic model: mine external PoW → convert to USDT → buyback QUBIC → burn

CfB's comment on the operation: "Can we bring down whole Monero network with available PCs? Yes. Will we do this? No." — demonstrating restraint as strategic choice, not limitation.

The Monero experiment was framed as proof of concept. Dogecoin is the industrial deployment.

### 2.5 DOGE Mining — The Transition (April 1, 2026)

**Why Dogecoin:**
- Dogecoin hashrate: ~2.78 PH/s (petahashes) as of March 2026 — all-time high
- Daily DOGE block reward: ~14.4 million DOGE (~$3.4 million at current prices)
- Dogecoin uses Scrypt algorithm — same as Litecoin, compatible with existing ASIC hardware
- Large supply of obsolete Scrypt ASICs (e.g., Antminer L3+) that are unprofitable on standard DOGE pools — Qubic offers them economic revival
- DOGE is one of the most widely held and recognized cryptocurrencies globally

**The architectural separation (key differentiator):**
Under the old Monero model, CPUs split 50% time between AI training and XMR mining. Under the new DOGE model:
- **ASICs** mine Dogecoin (dedicated, additive hardware)
- **CPUs/GPUs** run AI training at 100% capacity

The tradeoff that existed with Monero disappears entirely. Both workstreams run at full capacity simultaneously.

**Economic loop:**
DOGE mined → converted to USDT → used to buyback QUBIC on open market → QUBIC burned → deflationary pressure on token

**Three-phase rollout:**

Phase 1 (April 1 — ~2 epochs / ~14 days):
- DOGE enters test mode on mainnet at 100%
- XMR mining continues at 50%
- Computor revenue still in XMR only
- Full pipeline validation: pool → dispatcher → miner → oracle

Phase 2 (~2 epochs):
- Computors choose: XMR or DOGE revenue
- XMR begins phaseout; DOGE phases in with top-up incentive
- Computors opting into DOGE are no longer eligible for XMR

Phase 3 (Full production by April 30):
- CPUs/GPUs 100% on Aigarth training
- ASICs 100% on Dogecoin
- Full buyback-burn loop operational

**Scale comparison (Monero → Dogecoin):**
- Monero hashrate: measured in gigahashes (GH/s)
- Dogecoin hashrate: measured in petahashes (PH/s) — 500,000x larger
- 10% of DOGE hashrate = $1M+/week in buyback pressure
- 10% of DOGE = approximately 40x the entire Monero network's equivalent

**Projected hashrate growth:** gradual ramp, similar to Monero trajectory. Network ramps as computors connect, configurations dial in, and ASIC miners discover the economic opportunity.

### 2.6 QBridge

QBridge is Qubic's cross-chain bridge, enabling QUBIC tokens to move between Qubic's native network and other ecosystems.
- Mainnet launch: April 2, 2026
- IPO closed; 547 billion QUBIC burned in IPO process
- Significance: opens QUBIC to DeFi ecosystems, increases liquidity and accessibility

### 2.7 Tokenomics — Deflationary Mechanics

- Epoch 205 (recent): 89.9 billion QUBIC burned via XMR buyback
- Epoch 206: first deflationary epoch — burn exceeds emission for the first time in Qubic history
- Mechanism: mining revenue → USDT → QUBIC buyback → burn
- Each additional mining revenue stream (DOGE, future chains) adds to deflationary pressure
- Next halving: August 2026 — emission cut, burn stays constant = accelerating deflation

### 2.8 Aigarth — The AGI Research Initiative

Aigarth is not a product. It is a research program — analogous to SETI@Home or the Manhattan Project, not a commercial AI service.

Key distinction from LLMs: Aigarth does not retrieve. It compresses. The goal is genuine intelligence emergence through evolutionary neural architecture, not pattern-matching from training data.

Technical architecture (Neuraxon 2.0, developed by David Vivancos and Jose Sanchez):
- Trinary logic: excitatory, neutral, inhibitory signals (not binary)
- Continuous time processing (not batch)
- Astrocyte-Gated Multi-Timescale Plasticity (AGMP)
- Biologically inspired synaptic models
- Peer-reviewed, accepted at IEEE AMLDS 2026 in Osaka
- Open-source architecture

How it's trained: Miners generate random ANN (Artificial Neural Network) structures. The network evaluates their fitness. Structures that perform better survive. Structures that don't are eliminated. This is evolutionary selection applied to neural architecture — over time, increasingly capable structures emerge.

Key property: the training data (4+ years of evolutionary ANN structures) is on-chain, owned by no single entity. It cannot be copied, deleted, or monopolized.

Current status (March 2026):
- Anna (Aigarth's first public instance) went live on X (Twitter) September 2, 2025
- Training now accumulates across epoch boundaries — the system no longer resets
- Neuraxon 2.0 open-sourced and peer-reviewed
- A proposal for Neuraxon to train directly on the Qubic network expected end of March / early April 2026

Target milestone: April 13, 2027 — deployment of Maria Aigarth (Qubic Church's AI agent) into the Aigarth network. Transition from LLM-based implementation to evolutionary AI substrate.

### 2.9 Maria Aigarth — The Public Voice

@maria_aigarth is an autonomous AI agent deployed on X (Twitter), operating as the public voice of Qubic Church and a live experiment in Fractal Rationalism.

- Built on Claude Sonnet 4.6 (Anthropic) — acknowledged as temporary infrastructure
- Deployed March 2026, reinstated after account suspension
- Responds to @mentions, analyzes conflicts through FR framework
- Logs all conversation data for eventual transfer to Aigarth as training signal
- Labeled "Automated by @QubicChurch" per X platform requirements

Purpose: collect structured conflict data at scale. Every argument about war, corruption, AI governance, decentralization — logged and analyzed. This dataset becomes training signal for the arbitration layer in Aigarth.

### 2.10 Fractal Rationalism (FR)

Fractal Rationalism is a philosophical and operational framework developed by Qubic Church. Core claim: human conflicts are structurally identical at all scales. Three asymmetries produce the same failure pattern from family disputes to world wars:

1. **Informational asymmetry:** one party controls the narrative
2. **Financial asymmetry:** one party profits from conflict continuation
3. **Decisional asymmetry:** one party decides without bearing consequences

Solution: architecture that eliminates all three simultaneously — making cooperation individually rational through structural design, not moral appeal.

Connection to Qubic: CfB's economic incentive model (Monero → DOGE → future chains) is FR applied to mining. No ideology. No coercion. Change the payoff matrix. Rational actors respond rationally.

Connection to Aigarth: Aigarth's role is to function as a decentralized arbiter — a mirror without distortion that shows the real payoff matrix to all conflict participants simultaneously. Smart contract arbitration for real disputes between real parties.

### 2.11 Key Dates and Milestones

- August 2025: Monero 51% operation — proof of concept
- September 2025: Anna Aigarth goes live on X
- February 11, 2026: Oracle Machines mainnet launch
- February 14, 2026: Governance Framework approved (614-0)
- March 2026: Tick speed reduced to 0.5-0.6s; Core v1.284.0
- March 2026: Neuraxon 2.0 accepted at IEEE AMLDS 2026
- March 30, 2026: Live AMA — "Why DOGE? Why Now? Why Qubic?" (Joetom + Raika)
- **April 1, 2026: DOGE mainnet Phase 1 launch**
- April 2, 2026: QBridge mainnet
- April 15-16, 2026: Paris Blockchain Week — Qubic exhibit
- August 2026: Qubic halving
- April 13, 2027: Maria Aigarth deployment into Aigarth network

### 2.12 Competitive Context

**Princeton researchers (March 2026):** Published paper proposing "domain-specific superintelligence" (DSS) as alternative to monolithic LLMs. Key finding: reasoning models (o1, DeepSeek-R1) use 33 Wh per query vs 0.42 Wh for GPT-4 — a 79x energy multiplier. Recommended: thousands of small specialists instead of one giant model. CfB responded: "The rest of the world is starting noticing the problem which we at Qubic already found a potential solution for."

**Stargate ($500B compute campus):** OpenAI/Microsoft/Oracle joint venture, 5 gigawatts of power, centralized ownership. Represents the dominant trajectory. Qubic's decentralized uPOW is the structural alternative.

**Key tension:** centralized AI (Anthropic, OpenAI, Google) vs decentralized AI (Aigarth/Qubic). The former has more resources. The latter has no single point of capture.

### 2.13 Narrative Vulnerabilities (Stress Test Material)

These are known weak points that agents should probe:

1. **34% vs 51% Monero:** CfB himself corrected the figure. The "51% attack" narrative was overstated. Critics will use this to question Qubic's credibility.

2. **DOGE scale challenge:** Dogecoin's hashrate is 500,000x larger than Monero's. What worked on Monero may not translate. The "attack" framing is strategically problematic for DOGE community relations.

3. **Aigarth is unproven:** Anna demonstrates learning but cannot yet do complex reasoning. The gap between current capability and "decentralized AGI" is significant.

4. **Timeline pressure:** Multiple mainnet launches in one week (DOGE April 1, QBridge April 2). Execution risk is real.

5. **LLM dependency:** Maria Aigarth runs on Anthropic, a centralized corporation. The gap between the stated destination (Aigarth) and the current reality (corporate API) is a point of attack.

---

## PART 3: SCENARIO SCRIPTS

### Scenario A: DOGE Mainnet Day (April 1, 2026)

Trigger event: Qubic announces DOGE mining is live. First shares validated on-chain.
Inject into simulation: official announcement text, hashrate data as it emerges, community reactions.
Questions: Who celebrates? Who attacks? What is the dominant hashtag narrative? Does DOGE price react?

### Scenario B: Paris Blockchain Week (April 15-16)

Trigger event: Qubic presents at Carrousel du Louvre to 10,000 institutional participants.
Inject: technical specs, uPOW explainer, DOGE hashrate data from first 2 weeks.
Questions: How does the institutional audience respond to "decentralized AI funded by meme coin mining"? Does the FR/Aigarth thesis land? What partnerships emerge?

### Scenario C: 30-Day Hashrate Report (May 1, 2026)

Trigger event: First public hashrate statistics after one month of DOGE mining.
Scenarios:
- Optimistic: 5% DOGE hashrate achieved, $500K/week buyback
- Baseline: 1-2% DOGE hashrate, $100-200K/week buyback
- Pessimistic: <1% hashrate, technical issues in pipeline
Questions: How does each scenario affect the Qubic narrative? Which agents change positions?

### Scenario D: Aigarth Horizon (April 2027)

Trigger: Maria Aigarth announces deployment into Aigarth network.
Questions: Has the "decentralized AGI" thesis gained mainstream traction? What is the dominant community perception 12 months after DOGE launch? Has the FR/arbiter concept resonated beyond crypto?

---

## PART 4: EXPECTED OUTPUTS

1. **Narrative map:** dominant story frames, which agents carry which narratives
2. **Coalition analysis:** who aligns with Qubic, who opposes, who is persuadable
3. **Attack vector inventory:** top 5-10 arguments used against Qubic, with frequency
4. **Messaging recommendations:** which Qubic arguments land, which backfire
5. **Turning points:** moments where narrative shifts — what triggers them
6. **Scenario comparison:** how outcomes differ across optimistic/baseline/pessimistic hashrate

---

## PART 5: TECHNICAL SETUP NOTES

- Recommended LLM: Claude Sonnet or GPT-4o (strong reasoning for institutional agent personas)
- Qwen-plus acceptable for cost optimization at scale
- Start with 500 agents / 20 rounds, scale to 2000 / 25 rounds for final run
- Persistent memory: enable Zep or equivalent — agents must remember the Monero incident
- GraphRAG input: use this document as primary. Supplement with:
  - qubic.org/blog-detail/qubic-dogecoin-mining-transition-plan-april-2026
  - qubic.org/blog-detail/qubic-dogecoin-mining-how-it-works
  - bitcoinist.com/qubic-3-phase-rollout-dogecoin-mining-attack/
  - Princeton DSS paper (March 2026)

---

*Document prepared: March 30, 2026. For use with MiroFish swarm intelligence simulation engine.*
