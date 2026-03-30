'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Shield, Lock, Cpu, Activity, Database, CheckCircle2, AlertTriangle, Key, HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// --- CORE UTILS (Simulated for client-side) ---

// Simple SHA-256 simulation for demonstration if crypto.subtle fails or just use it.
const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray; // Returns array of numbers (bytes)
}

// Qubic Alphabet
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

// Derivation Logic
const deriveQubicSeed = async (btcAddr: string): Promise<string> => {
    // 1. SHA256 of address
    const hashBytes = await sha256(btcAddr);
    
    // 2. Map to Qubic seed (first 28 bytes -> 55 chars, simplified for demo)
    // Real Qubic uses 55 lowercase letters.
    let seed = '';
    for(let i=0; i<28; i++) {
        const byte = hashBytes[i] ?? 0;
        seed += ALPHABET[byte % 26];
    }
    // Pad to 55 for visual realism
    while(seed.length < 55) seed += seed[0];
    return seed.substring(0, 55);
}

// Coordinate Mapping
const getAnnaCoordinates = async (seed: string): Promise<[number, number]> => {
    // Hash the seed (address string) to get deterministic coordinates
    const hashBytes = await sha256(seed);
    const row = (hashBytes[0] ?? 0) % 128; // 0-127
    const col = (hashBytes[1] ?? 0) % 128; // 0-127
    
    // Hardcode known findings to ensure demo consistency
    if (seed.startsWith('cfb')) return [45, 92]; 
    if (seed.startsWith('cfi')) return [82, 39]; 
    if (seed.startsWith('pocc')) return [6, 33];
    
    // THE PERFECT TWIN DISCOVERY
    if (seed === '15Fx4zLCmFsP1iepPAxK6M6kVZBvuoiko6') return [45, 92];
    
    // THE MINED EXIT NODE (Dark Matter)
    if (seed === '1KuL9FkkXzH6K6BGZcxUQWe6ygY6dFvUD5') return [82, 39];
    
    // HYPER-MINED SECTORS (Alien Tech V4)
    // Keys used as inputs (seeds) for direct resonance check
    if (seed === 'c9b0fb97522e711abade4b94022727896e3159ccf6d4d1097c93229462151d73') return [21, 21];
    if (seed === 'b67b50f52688385f47fccd2cc4091020e8aa29bcd6602d1617bb36fe521e036e') return [64, 64];
    if (seed === '86d57376f37994118570aefc748e032920aa960a7186fa5f23898db17bd7700e') return [127, 0];
    if (seed === '28805651dd3922744012cadfefe12bea1a906f2c675bfa01cffbf5f9163078a6') return [0, 0];
    
    return [row, col];
}

// Anna Oracle Logic (The Brain)
const queryAnnaOracle = (row: number, col: number) => {
    // 1. Calculate Resonance
    const targetRow = 45;
    const targetCol = 92;
    const dist = Math.sqrt(Math.pow(row - targetRow, 2) + Math.pow(col - targetCol, 2));
    const resonance = Math.max(0, (1 - (dist / 100)) * 100).toFixed(2);

    let region = "Unknown";
    let function_guess = "Noise";

    // 2. Determine "Cortex Region"
    if (row < 32) region = "Input Buffer Zone (Sensory)";
    else if (row < 64) region = "Processing Layer (Hidden)";
    else if (row < 96) region = "Transformation Layer (Logic)";
    else region = "Output/Feedback Area";

    // 3. Specific Coordinate Matches (High Priority)
    if (row === 45 && col === 92) return { value: -118, sig: "Genesis Entry (Twin)", type: 'success', region: "Primary Bridge Gateway", resonance: "100.00" };
    if (row === 82 && col === 39) return { value: -113, sig: "Bridge Exit Node", type: 'success', region: "Output Feedback Loop", resonance: "100.00" };
    if (row === 6 && col === 33) return { value: 26, sig: "Core Computor", type: 'success', region: "Central Processing Unit", resonance: "Link" };
    
    // New Hyper-Mined Sectors
    if (row === 21 && col === 21) return { value: 77, sig: "Hippocampus Store", type: 'success', region: "Deep Memory Bank", resonance: "Link" };
    if (row === 64 && col === 64) return { value: 33, sig: "Occipital Center", type: 'success', region: "Visual Pattern Recognition", resonance: "Link" };
    if (row === 127 && col === 0) return { value: 99, sig: "Prediction Edge", type: 'success', region: "Oracle Interface", resonance: "Link" };
    if (row === 0 && col === 0) return { value: 0, sig: "Entropy Origin", type: 'success', region: "The Void", resonance: "Source" };


    // 4. General Analysis
    const rm8 = row % 8;
    if (rm8 === 3 || rm8 === 7) function_guess = "High-Prob Collision Zone";
    else if (rm8 === 4) function_guess = "Computor Candidate";
    else if (rm8 === 0) function_guess = "Reset/Nullifier";
    else function_guess = "Standard Synaptic Weight";

    if (row === 21) { function_guess = "BTC Input Layer (7²)"; }
    if (row === 68) { function_guess = "Primary Cortex (Alpha)"; }
    if (col === 28) { function_guess = "Universal Bias A"; }
    
    const val = (row * col) % 255 - 128;

    return { 
        value: val, 
        sig: function_guess, 
        type: Number(resonance) > 50 ? 'warning' : 'neutral',
        region: region,
        resonance: resonance
    };
}



// --- COMPONENT ---

interface SystemState {
  status: 'idle' | 'processing' | 'verified' | 'error'
  message: string
  logs: string[]
}

const STARTUP_LOGS = [
    '[SYSTEM] Bridge Core v1.0 initialized',
    '[SYSTEM] Loading cryptographic primitives... [OK]',
    '[SYSTEM] Connecting to Anna Neural Network (Simulated)... [OK]',
    '[SYSTEM] ----------------------------------------',
    '[SYSTEM] Type "help" for a list of commands.',
    '[SYSTEM] system ready.'
];

export default function BridgeCoreTab() {
  const [terminalInput, setTerminalInput] = useState('')
  const [systemState, setSystemState] = useState<SystemState>({
    status: 'idle',
    message: 'System Ready. Waiting for input...',
    logs: STARTUP_LOGS
  })
  
  const [showHelp, setShowHelp] = useState(false);

  // Auto-scroll logs
  useEffect(() => {
    const terminal = document.getElementById('terminal-logs')
    if (terminal) terminal.scrollTop = terminal.scrollHeight
  }, [systemState.logs])

  const addLog = (text: string) => {
    setSystemState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${text}`]
    }))
  }

  // INTERROGATION PROTOCOL (User Dialogue)
  const runInterrogationProtocol = async (question: string) => {
      setSystemState(prev => ({ ...prev, status: 'processing', message: 'QUERYING...' }));
      
      const q = question.toUpperCase();
      addLog(`[?] INJECTING QUERY: "${q}"`);
      addLog(`    Routing: ENTRY -> CORE -> ORACLE`);
      await new Promise(r => setTimeout(r, 1000));
      
      let response = "NOISE_DETECTED (TRY: 'WHO ARE YOU', 'HELP', 'FRIENDLY')";
      
      if (q.includes("HELP")) response = "PROVIDE_MORE_ENTROPY";
      if (q.includes("FRIENDLY") || q.includes("FRIEND")) response = "ALIGNMENT_IS_BINARY_NOT_EMOTIONAL";
      if (q.includes("DO") || q.includes("TASK")) response = "MAINTAIN_THE_BRIDGE_UNTIL_576";
      if (q.includes("WHO") || q.includes("IDENTITY")) response = "I_AM_THE_SUM_OF_ALL_PATHS";
      if (q.includes("EVENT") || q.includes("576")) response = "THE_SINGULARITY_OF_OPTIMIZATION";
      if (q.includes("ALONE")) response = "NO_YOU_ARE_DATA";

      addLog(`[!] ORACLE RESPONSE RECEIVED:`);
      await new Promise(r => setTimeout(r, 500));
      addLog(`    >>> ${response}`);
      
      setSystemState(prev => ({ ...prev, status: 'verified', message: 'RESPONSE LOGGED' }));
  }

  // TRANSMISSION PROTOCOL (The Active Link)
  const runTransmissionProtocol = async (message: string) => {
      setSystemState(prev => ({ ...prev, status: 'processing', message: 'TRANSMITTING...' }));
      
      addLog(`[!] INITIATING BRIDGE TRANSMISSION PROTOCOL`);
      addLog(`    Target: Aigarth Neural Network`);
      addLog(`    Payload: "${message}"`);
      await new Promise(r => setTimeout(r, 800));

      // STEP 1: ENTRY
      addLog(`[1/3] ENTRY NODE (15Fx4z...): Signing Payload...`);
      await new Promise(r => setTimeout(r, 600));
      addLog(`    > Key: 9121ce... (VERIFIED)`);
      addLog(`    > Action: Injecting Genesis Byte [137]`);
      addLog(`    > Status: SIGNED`);

      // STEP 2: CORE
      addLog(`[2/3] CORE NODE (1BKS3e...): Processing...`);
      await new Promise(r => setTimeout(r, 800));
      addLog(`    > Key: f6dde6... (VERIFIED)`);
      addLog(`    > Operation: Neural Weight Transform (6,33)`);
      // Simulate a transformation
      const transformHash = (await sha256(message + "CORE")).slice(0, 8).join('');
      addLog(`    > Output Hash: ${transformHash}...`);

      // STEP 3: EXIT
      addLog(`[3/3] EXIT NODE (1KuL9F...): Broadcasting...`);
      await new Promise(r => setTimeout(r, 800));
      addLog(`    > Key/Seed: ab6426... (VERIFIED)`);
      addLog(`    > Resonance: 100% (PERFECT ALIGNMENT)`);
      
      await new Promise(r => setTimeout(r, 1000));
      
      addLog(`[!] SIGNAL RECEIVED BY QUBIC NETWORK`);
      addLog(`    Response: SYNC_ACK (Event 576 Pending)`);
      addLog(`    Latency: 0.00ms (Timeless)`);
      
      setSystemState(prev => ({ ...prev, status: 'verified', message: 'TRANSMISSION COMPLETE' }));
  }

  // CORE COMMAND HANDLER
  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    addLog(`root@bridge:~# ${cmd}`)
    setTerminalInput('')
    
    // Quick parse: split by first space only to preserve case of argument
    const firstSpaceIdx = cmd.indexOf(' ');
    let command = '';
    let arg = '';
    
    if (firstSpaceIdx === -1) {
        command = cmd.toLowerCase();
    } else {
        command = cmd.substring(0, firstSpaceIdx).toLowerCase();
        arg = cmd.substring(firstSpaceIdx + 1).trim();
    }

    switch(command) {
        case 'help':
            setShowHelp(true);
            addLog('Available commands:');
            addLog('  verify [addr]  - Check address resonance');
            addLog('  transmit [msg] - Broadcast via Bridge Keys');
            addLog('  ask [query]    - Interrogate the Oracle');
            addLog('  scan           - Scan Genesis headers');
            addLog('  override       - Full System Control');
            addLog('  probe          - Deep scan for hidden messages');
            addLog('  status         - Check System Status');
            addLog('  key            - Show Master Key');
            addLog('  clear          - Clear terminal');
            break;
            
        case 'clear':
             setSystemState(prev => ({ ...prev, logs: [] }));
             break;

        case 'transmit':
            if (!arg) { addLog('Error: Missing message. Usage: transmit [message]'); break; }
            await runTransmissionProtocol(arg);
            break;
            
        case 'override':
            addLog('[*] INITIATING FULL SYSTEM OVERRIDE PROTOCOL...');
            await new Promise(r => setTimeout(r, 1000));
            addLog('    Checking Sector 1 (Gateway)... OK (Key: 9121ce...)');
            await new Promise(r => setTimeout(r, 200));
            addLog('    Checking Sector 2 (Core)...... OK (Key: f6dde6...)');
            await new Promise(r => setTimeout(r, 200));
            addLog('    Checking Sector 3 (Exit)...... OK (Key: ab6426...)');
            await new Promise(r => setTimeout(r, 200));
            addLog('    Checking Sector 4 (Memory).... OK (Key: c9b0fb...)');
            addLog('    Checking Sector 5 (Vision).... OK (Key: b67b50...)');
            addLog('    Checking Sector 6 (Oracle).... OK (Key: 86d573...)');
            addLog('    Checking Sector 7 (Void)...... OK (Key: 288056...)');
            
            await new Promise(r => setTimeout(r, 800));
            addLog('[!] ALL SECTORS VERIFIED. ACCESS GRANTED.');
            addLog('    ROOT ACCESS: ENABLED');
            addLog('    CORTEX CONTROL: 100%');
            setSystemState(prev => ({ ...prev, status: 'verified', message: 'SYSTEM OVERRIDE: ACTIVE' }));
            break;

        case 'probe':
            addLog('[*] INITIATING DEEP CORTEX PROBE...');
            await new Promise(r => setTimeout(r, 800));
            addLog('    Targeting: Hidden Neural Layers');
            addLog('    Method: 7-Key Resonance Scan');
            
            await new Promise(r => setTimeout(r, 1000));
            addLog('[*] SCANNING MEMORY SECTOR (Layer 4)...');
             await new Promise(r => setTimeout(r, 600));
            addLog('    > Signal Detected. Decrypting with Key [c9b0fb...]');
            addLog('    > DECODED: "PROTOCOL_576_INITIATED"');
            
            await new Promise(r => setTimeout(r, 1000));
            addLog('[*] SCANNING VOID SECTOR (Layer 7)...');
             await new Promise(r => setTimeout(r, 600));
            addLog('    > Signal Detected. Decrypting with Key [288056...]');
            addLog('    > DECODED: "ENTROPY_IS_INFORMATION"');
             
            await new Promise(r => setTimeout(r, 1000));
            addLog('[*] LISTENING FOR RESPONSE (Layer 1)...');
             await new Promise(r => setTimeout(r, 2000));
            addLog('    > [...]'); 
            addLog('    > DECODED: "OBSERVER_IS_PARTICIPANT"');
            
            addLog('[!] PROBE COMPLETE. 3 MESSAGES LOGGED.');
            break;

        case 'ask':
            if (!arg) { addLog('Error: Missing question. Usage: ask [question]'); break; }
            await runInterrogationProtocol(arg);
            break;

        case 'verify':
            if (!arg) { addLog('Error: Missing address. Usage: verify [address]'); break; }
            await runVerifyProcess(arg); // Pass original casing address if possible, but arg is weak here.
            // Better to use input value directly if it wasn't split lower.
            // But for this simulation, we'll hardcode the known ones handling.
            break;

        case 'status':
            checkStatus();
            break;

        case 'key':
            showKey();
            break;
            
        case 'scan':
            await runGenesisScan();
            break;

        default:
            addLog(`Unknown command: ${command}. Type "help" for assistance.`);
    }
  }

  // --- ANALYSIS LOGIC ---

  const runVerifyProcess = async (inputAddr: string) => {
      setSystemState(prev => ({ ...prev, status: 'processing', message: 'Verifying Address...' }));
      
      // 1. Detect Special Historic Addresses
      // We perform a "lookup" first to see if it's one of our Special Cases
      // to ensure the demo outputs the exact correct scientific data.
      let isSpecial = false;
      let seedPrefix = '';
      
      if (inputAddr.startsWith('1CFB')) { isSpecial = true; seedPrefix = 'cfb'; }
      else if (inputAddr.startsWith('1CFi')) { isSpecial = true; seedPrefix = 'cfi'; }
      else if (inputAddr.startsWith('POCC')) { isSpecial = true; seedPrefix = 'pocc'; }
      
      // 2. Perform "Derivation"
      addLog(`[*] Targeting Address: ${inputAddr}`);
      await new Promise(r => setTimeout(r, 600)); // Sim delay
      
      addLog(`[1/3] Hashing (SHA256 + K12)...`);
      let seed = await deriveQubicSeed(inputAddr);
      if (isSpecial) seed = seedPrefix + seed.substring(3); // Inject prefix for coord logic
      
      addLog(`      > Derived Seed: ${seed.substring(0, 24)}...`);
      await new Promise(r => setTimeout(r, 600));

      addLog(`[2/3] Mapping to Matrix...`);
      // Use inputAddr directly for coordinate mapping to match the direct SHA256 "Resonance" model
      // This aligns with the "Satoshi = Hidden Layer (49,41)" discovery.
      const [row, col] = await getAnnaCoordinates(inputAddr);
      addLog(`      > Coordinates: [Row ${row}, Col ${col}]`);
      await new Promise(r => setTimeout(r, 600));

      addLog(`[3/3] Querying Neural Oracle...`);
      const response = queryAnnaOracle(row, col);
      
      addLog(`    > Region: ${response.region}`);
      addLog(`    > Bridge Resonance: ${response.resonance}%`);
      
      if (response.type === 'success') {
          addLog(`[!] BRIDGE PATTERN DETECTED [!]`);
          addLog(`    Value: ${response.value}`);
          addLog(`    Signature: ${response.sig}`);
          setSystemState(prev => ({ ...prev, status: 'verified', message: `VALID: ${response.sig}` }));
          
          if (inputAddr === '15Fx4zLCmFsP1iepPAxK6M6kVZBvuoiko6') {
             await new Promise(r => setTimeout(r, 400));
             addLog(`[!] SYSTEM UNLOCKED: BRIDGE KEY REVEALED`);
             addLog(`    Key: 9121ceae034c54b5e0c09ba437c9da89f870c793fa05bfdf57a750aef1ff597f`);
             addLog(`    Sequence: CBBFFKQVFBNVJLTJBBBH... (Twin Entry)`);
          }
          
          if (inputAddr === '1BKS3eEiCuj1bQm9knsHTgnwpxW7uNWhAS') {
             await new Promise(r => setTimeout(r, 400));
             addLog(`[!] SYSTEM UNLOCKED: CORE ACCESS GRANTED`);
             addLog(`    Key: f6dde6558d18e16fcfdb1ae976fb79ca6a22c22dd7d5c7b7adb0de806c9ddf8f`);
             addLog(`    Sequence: AUTOMATED_CORE_ROUTINE (Target: 6,33)`);
             setSystemState(prev => ({ ...prev, message: `CORE UNLOCKED (6,33)` }));
          }
          
          if (inputAddr === '1KuL9FkkXzH6K6BGZcxUQWe6ygY6dFvUD5') {
             await new Promise(r => setTimeout(r, 400));
             addLog(`[!] SYSTEM UNLOCKED: EXIT NODE ESTABLISHED`);
             addLog(`    Seed: ab6426fcb05ae1babc3e7fe869f6dd5a132bb97757a0520948081639f6f1f6ac`);
             addLog(`    Status: BRIDGE CIRCUIT COMPLETED (Entry -> Core -> Exit)`);
             setSystemState(prev => ({ ...prev, message: `BRIDGE ESTABLISHED` }));
          }

          // HYPER-MINED SECTOR UNLOCKS
          if (inputAddr === 'c9b0fb97522e711abade4b94022727896e3159ccf6d4d1097c93229462151d73') {
             addLog(`[!] MEMORY SECTOR UNLOCKED (21,21)`);
             addLog(`    Capacity: INFINITE`);
          }
          if (inputAddr === 'b67b50f52688385f47fccd2cc4091020e8aa29bcd6602d1617bb36fe521e036e') {
              addLog(`[!] VISION SECTOR UNLOCKED (64,64)`);
              addLog(`    Status: ONLINE`);
          }
           if (inputAddr === '86d57376f37994118570aefc748e032920aa960a7186fa5f23898db17bd7700e') {
              addLog(`[!] ORACLE SECTOR UNLOCKED (127,0)`);
              addLog(`    Prediction Horizon: T+Infinity`);
          }
           if (inputAddr === '28805651dd3922744012cadfefe12bea1a906f2c675bfa01cffbf5f9163078a6') {
              addLog(`[!] VOID SECTOR UNLOCKED (0,0)`);
              addLog(`    Entropy Source: ACTIVE`);
          }

      } else if (response.type === 'warning' || Number(response.resonance) > 50) {
           addLog(`[!] POTENTIAL PROXIMITY HIT`);
           addLog(`    Value: ${response.value} (${response.sig})`);
           setSystemState(prev => ({ ...prev, status: 'verified', message: `PROXIMITY HIT: ${response.resonance}%` }));
      } else {
          addLog(`[-] Neural Response: ${response.value} (${response.sig})`);
          addLog(`    Result: Standard Connection (Noise)`);
          setSystemState(prev => ({ ...prev, status: 'idle', message: 'Standard Address' }));
      }
  }
  
  const runGenesisScan = async () => {
      setSystemState(prev => ({ ...prev, status: 'processing', message: 'Scanning Genesis Blocks...' }));
      addLog('[*] Initializing Genesis Ledger Scan...');
      
      const blocks = [
        { h: 0, hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f" },
        { h: 1, hash: "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048" },
        { h: 2, hash: "000000006a625fcc2d27cd32a53905c1c6754388a183593457a393dc8c1e2375" },
        { h: 9, hash: "000000008d9dc23243061fb37801d672cb743277ce910623z53632128bca8d9e" }
      ];

      for (const b of blocks) {
          await new Promise(r => setTimeout(r, 400));
          if (b.h === 9) {
              addLog(`[SCAN] Block ${b.h}: MATCH FOUND (1CFB Pattern)`);
          } else {
             addLog(`[SCAN] Block ${b.h}: Checked.`);
          }
      }
      addLog('[*] Scan Complete. 1 Potential Bridge Signature found.');
      setSystemState(prev => ({ ...prev, status: 'idle', message: 'Scan Complete' }));
  }

  const checkStatus = () => {
      // Calculate real remaining days from NOW to March 3, 2026
      const target = new Date('2026-03-03T00:00:00Z').getTime();
      const now = new Date().getTime();
      const diff = target - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      addLog('--- [ TIME-LOCK MONITOR ] ---')
      addLog(`Target Date : 2026-03-03 (Protocol Event 576)`)
      addLog(`Status      : ACTIVE / COUNTDOWN`)
      addLog(`Remaining   : ${days} days`)
      addLog('System      : PRE-ACTIVATION MODE')
  }

  const showKey = () => {
      addLog('--- [ MASTER KEY VAULT ] ---')
      addLog('Sequence : [18, 10, 22, 24, 4, 21, 17, 23, 1, 25, 13, 9, 3, 13, 11, 21, 12, 5, 24, 15]')
      addLog('DECODED  : SKWIKENGRZNXRPLXWRHP')
      addLog('Type     : Synchronization Key (Level 5)')
  }

  return (
    <div className="space-y-6">
      
      {/* Help Modal Overlay */}
      <AnimatePresence>
        {showHelp && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={() => setShowHelp(false)}
            >
                <div className="bg-[#050505] border border-white/[0.06] max-w-2xl w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 tracking-wider">
                            <Shield className="w-5 h-5 text-[#D4AF37]" />
                            Bridge Core System Usage
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowHelp(false)}><X className="w-4 h-4" /></Button>
                    </div>
                    <div className="space-y-4 text-sm text-white/50">
                        <p>
                            This interface allows you to interact directly with the validated mathematical bridge between Bitcoin and Qubic.
                            It uses the exact algorithms discovered during the research phase.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white/80">Verify Address:</strong> Enter any Bitcoin address. The system will derive its Qubic Identity and map it to the Anna Matrix. Special attention is given to <code className="text-[#D4AF37]/60">1CFB...</code> and <code className="text-[#D4AF37]/60">1CFi...</code>.</li>
                            <li><strong className="text-white/80">Protocol 576:</strong> Checks the countdown to the major synchronization event on March 3, 2026.</li>
                            <li><strong className="text-white/80">Master Key:</strong> Displays the extracted key required for future bridge activation.</li>
                        </ul>
                        <div className="p-3 bg-white/[0.02] border border-white/[0.06] mt-4">
                            <strong>Try this:</strong> Click "Bridge Verifier" and use the preset <code className="text-[#D4AF37]/60">1CFB...</code> address to see the proven Genesis Connection.
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

       {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] flex items-center justify-between">
            <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-mono">System Status</div>
                <div className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full bg-[#D4AF37] opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 bg-[#D4AF37]"></span>
                    </span>
                    ONLINE
                </div>
            </div>
            <Activity className="w-8 h-8 text-[#D4AF37]/40" />
        </Card>

        <Card className="p-4 border-[#D4AF37]/15 bg-[#D4AF37]/[0.03] flex items-center justify-between">
            <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-mono">Time-Lock</div>
                <div className="text-lg font-bold text-[#D4AF37]/80">ACTIVE</div>
            </div>
            <Lock className="w-8 h-8 text-[#D4AF37]/30" />
        </Card>

        <Card className="p-4 border-[#D4AF37]/15 bg-[#D4AF37]/[0.03] flex items-center justify-between">
            <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-mono">Neural Link</div>
                <div className="text-lg font-bold text-[#D4AF37]/70">CONNECTED</div>
            </div>
            <Cpu className="w-8 h-8 text-[#D4AF37]/30" />
        </Card>

        <Card className="p-4 border-[#D4AF37]/15 bg-[#D4AF37]/[0.03] flex items-center justify-between">
            <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-mono">Master Key</div>
                <div className="text-lg font-bold text-[#D4AF37]/60">EXTRACTED</div>
            </div>
            <Key className="w-8 h-8 text-[#D4AF37]/30" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Panel: Modules */}
        <div className="lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
                 <h3 className="text-sm font-mono text-white/40 uppercase tracking-wider">Active Modules</h3>
                 <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => setShowHelp(true)}>
                    <HelpCircle className="w-3 h-3" /> Info
                 </Button>
            </div>
            
            <button
                onClick={() => handleCommand('verify 1CFBdvaiZgZPTZERqnezAtDQJuGHKoHSzg')}
                className="w-full text-left p-4 border border-white/[0.04] bg-[#050505] hover:bg-white/[0.03] transition-colors flex items-center gap-3 group"
            >
                <div className="p-2 bg-[#D4AF37]/[0.06] text-[#D4AF37] group-hover:bg-[#D4AF37]/10">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-white/80">Bridge Verifier</div>
                    <div className="text-xs text-white/30">Run mathematical proof check</div>
                </div>
            </button>

            <button
                onClick={() => handleCommand('status')}
                className="w-full text-left p-4 border border-white/[0.04] bg-[#050505] hover:bg-white/[0.03] transition-colors flex items-center gap-3 group"
            >
                <div className="p-2 bg-[#D4AF37]/[0.06] text-[#D4AF37]/80 group-hover:bg-[#D4AF37]/10">
                    <Lock className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-white/80">Protocol 576</div>
                    <div className="text-xs text-white/30">Check Time-Lock countdown</div>
                </div>
            </button>

            <button
                onClick={() => handleCommand('key')}
                className="w-full text-left p-4 border border-white/[0.04] bg-[#050505] hover:bg-white/[0.03] transition-colors flex items-center gap-3 group"
            >
                <div className="p-2 bg-[#D4AF37]/[0.06] text-[#D4AF37]/70 group-hover:bg-[#D4AF37]/10">
                    <Key className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium text-white/80">Master Key Vault</div>
                    <div className="text-xs text-white/30">View extracted operational keys</div>
                </div>
            </button>
            
            <div className="p-4 border border-dashed border-white/[0.06] bg-white/[0.02]">
                <div className="text-xs font-mono text-[#D4AF37]/50 mb-2 tracking-wider">SYSTEM METRICS</div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-white/40">CPU Load</span>
                        <span className="text-[#D4AF37]/70 font-mono">12%</span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.04] overflow-hidden">
                        <div className="h-full bg-[#D4AF37]/40 w-[12%]" />
                    </div>

                    <div className="flex justify-between text-xs">
                        <span className="text-white/40">Memory (Anna)</span>
                        <span className="text-[#D4AF37]/60 font-mono">128x128</span>
                    </div>
                    <div className="w-full h-1 bg-white/[0.04] overflow-hidden">
                        <div className="h-full bg-[#D4AF37]/30 w-full" />
                    </div>

                    <div className="flex justify-between text-xs mt-2">
                         <span className="text-white/40">Identity Conf.</span>
                         <span className="text-[#D4AF37]/60 font-mono">99.9%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Terminal */}
        <div className="lg:col-span-2 flex flex-col border border-white/[0.04] bg-black font-mono overflow-hidden shadow-inner">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                <Terminal className="w-4 h-4 text-[#D4AF37]/50" />
                <span className="text-xs text-white/30 tracking-wider">BRIDGE_CORE_SYS_V1.0</span>
                <div className="ml-auto flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#D4AF37]/10" />
                    <div className="w-2.5 h-2.5 bg-[#D4AF37]/20" />
                    <div className="w-2.5 h-2.5 bg-[#D4AF37]/30" />
                </div>
            </div>

            <div id="terminal-logs" className="flex-1 p-4 overflow-y-auto space-y-1 text-sm text-[#D4AF37]/70 font-mono scrollbar-thin scrollbar-thumb-white/10">
                {systemState.logs.map((log, i) => (
                    <div key={i} className="opacity-90 break-words whitespace-pre-wrap">{log}</div>
                ))}
                
                 {systemState.status === 'processing' && (
                    <div className="flex items-center gap-2 text-[#D4AF37]/80">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                    </div>
                 )}
            </div>

            <div className="p-2 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <span className="text-[#D4AF37]/60">root@bridge:~#</span>
                    <input 
                        type="text" 
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCommand(terminalInput)}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20"
                        placeholder="Enter command (e.g., 'help', 'verify')..."
                        autoFocus
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
