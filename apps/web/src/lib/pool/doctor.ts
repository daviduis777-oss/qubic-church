/**
 * Log doctor: a rule set over a pasted miner log, or a described symptom.
 * Each finding cites the line that matched. Runs in the browser; logs are never sent anywhere.
 */
import { containsSeed } from './redact.ts'

export type Severity = 'fault' | 'check' | 'fine'
export type Rule = { id: string; severity: Severity; title: string; means: string; fix: string[]; test: RegExp }
export type Finding = { id: string; severity: Severity; title: string; means: string; fix: string[]; line?: { n: number; text: string } }
export type Diagnosis = { status: Severity | 'empty' | 'unknown'; findings: Finding[]; seedWarning: boolean }

export const RULES: Rule[] = [
  {
    id: 'cuda-missing',
    severity: 'fault',
    title: 'CUDA or the NVIDIA driver is missing',
    means: 'The miner cannot reach the card through CUDA.',
    fix: ['Install or update the NVIDIA driver, then reboot.', 'On a rented box, pick an image with CUDA preinstalled.', 'Check with nvidia-smi: it must list your card.'],
    test: /no cuda[- ]capable device|cuda_error_no_device|libcuda\.so[^\n]*(cannot open|not found|no such file)|nvidia-smi: (command )?not found|failed to initiali[sz]e nvml|nvidia-smi has failed|cuda (driver|runtime)[^\n]*(not found|missing|failed to load)|could not (load|find) cuda|cudaGetDeviceCount[^\n]*fail/i,
  },
  {
    id: 'driver-old',
    severity: 'fault',
    title: 'The NVIDIA driver is too old',
    means: 'The miner was built for a newer CUDA than your driver supports.',
    fix: ['Update the NVIDIA driver to a current release, then reboot.', 'On a rented box, choose a newer CUDA image.'],
    test: /driver version is insufficient|cuda_error_unsupported_ptx_version|unsupported (ptx|toolchain)|requires a newer (driver|cuda)/i,
  },
  {
    id: 'oom',
    severity: 'fault',
    title: 'Out of memory',
    means: 'The card or the machine ran out of memory and the miner stopped.',
    fix: ['Close other programs that use the GPU (games, other miners, AI tools).', 'Lower the thread count.', 'On a rented box, pick one with more RAM.'],
    test: /out of memory|cuda_error_out_of_memory|cudaErrorMemoryAllocation|std::bad_alloc|cannot allocate memory|oom[- ]kill|killed process \d+/i,
  },
  {
    id: 'no-avx',
    severity: 'fault',
    title: 'The CPU lacks the instructions this backend needs',
    means: 'The miner asked for AVX-512 or AVX2 and the CPU does not have it.',
    fix: ['Set the backend to AVX2, or Auto, on the pool setup page.', 'If AVX2 also fails, this CPU cannot mine: use a GPU or another machine.', 'Check on Linux: grep -o -m1 avx512f /proc/cpuinfo'],
    test: /illegal instruction|sigill|avx-?(2|512)[^\n]*(not (supported|available|found|detected)|unsupported|missing)|(cpu|processor) does not support avx|requires avx/i,
  },
  {
    id: 'invalid-wallet',
    severity: 'fault',
    title: 'The wallet address is rejected',
    means: 'The pool did not accept the address the miner sent.',
    fix: ['Use your address: exactly 60 uppercase letters, copied from your wallet.', 'Never the 55-letter seed.', 'Enter it again on the pool setup page and restart the miner.'],
    test: /invalid (wallet|address|payout|public ?id|qubic ?id)|(wallet|address)[^\n]{0,30}(invalid|malformed|not valid|rejected|wrong)|bad (wallet|address)/i,
  },
  {
    id: 'dns',
    severity: 'fault',
    title: 'The pool address does not resolve',
    means: 'DNS cannot find the pool server, so the miner never connects.',
    fix: ['Check the internet connection on that machine.', 'Set a public DNS resolver, for example 1.1.1.1 or 8.8.8.8.', 'If you copied a server name, copy it again from the setup page.'],
    test: /enotfound|eai_again|getaddrinfo|could not resolve|name or service not known|temporary failure in name resolution|no such host|nodename nor servname/i,
  },
  {
    id: 'package-download',
    severity: 'fault',
    title: 'Worker package download failed',
    means: 'This region cannot reach the pool servers.',
    fix: ['Rent the box in another country.', 'On your own PC, check a firewall or VPN is not blocking it.'],
    test: /worker package download failed|package download failed/i,
  },
  {
    id: 'connection',
    severity: 'fault',
    title: 'Cannot connect to the pool',
    means: 'The server refused or dropped the connection, or it timed out.',
    fix: ['Check the machine is online: ping 1.1.1.1', 'Check a firewall, VPN or the host is not blocking outgoing connections.', 'Restart the miner once. If it persists, the pool may be in maintenance: wait a few minutes.'],
    test: /econnrefused|connection refused|econnreset|connection reset|etimedout|connection timed out|could not connect|failed to connect|unable to connect|cannot connect|socket (error|closed|hang up)|websocket[^\n]*(error|closed)|network is unreachable/i,
  },
  {
    id: 'auth',
    severity: 'fault',
    title: 'The pool rejected the login',
    means: 'A token or key the miner sent was not accepted.',
    fix: ['Take the values again from the pool setup page and restart.', 'Do not reuse a command from another pool.'],
    test: /\b(401|403)\b[^\n]*(unauthori[sz]ed|forbidden)|unauthori[sz]ed|forbidden|invalid (token|access token|api key)/i,
  },
  {
    id: 'permission',
    severity: 'fault',
    title: 'The miner is not allowed to run',
    means: 'The file is not executable, or the folder is not writable.',
    fix: ['Make it executable: chmod +x ./<miner file>', 'Run it from a folder you own, such as your home folder.'],
    test: /permission denied|eacces|operation not permitted|cannot execute binary/i,
  },
  {
    id: 'crash',
    severity: 'fault',
    title: 'The miner crashed',
    means: 'It exited with a segmentation fault or a core dump.',
    fix: ['Download the current miner again from the setup page.', 'Try the backend Auto.', 'If it repeats, paste the 20 lines before the crash.'],
    test: /segmentation fault|core dumped|sigsegv|panicked at|fatal error/i,
  },
  {
    id: 'duplicate-worker',
    severity: 'check',
    title: 'Two machines share one worker name',
    means: 'The dashboard blurs them and one looks dead.',
    fix: ['Give every machine its own name, for example QC.rig-a and QC.rig-b.', 'Restart the miner on one of them with the new name.'],
    test: /duplicate worker|worker (name )?(already|is already) (in use|connected|registered|exists)|same worker name/i,
  },
  {
    id: 'rejected',
    severity: 'check',
    title: 'Many rejected or expired candidates',
    means: 'The CPU cannot keep up with the cards, or the host lags.',
    fix: ['Keep at least 8 CPU cores per GPU.', 'Use a stronger CPU, or move to a more reliable host (99%+ uptime).'],
    test: /(rejected|expired|stale)[^\n]{0,20}(ant )?(candidates?|shares?|solutions?)|(candidates?|shares?|solutions?)[^\n]{0,10}(rejected|expired|stale)/i,
  },
  {
    id: 'thermal',
    severity: 'check',
    title: 'The hardware is throttling',
    means: 'It is too hot and slows itself down.',
    fix: ['Improve airflow and clean the fans.', 'Lower the thread count on a laptop.'],
    test: /thermal|throttl|temperature (too high|limit|critical)|overheat/i,
  },
  {
    id: 'epoch-idle',
    severity: 'fine',
    title: 'Idle at an epoch change',
    means: 'At Wednesday 12:00 UTC the miner waits for the backend update, then continues.',
    fix: ['Do nothing. It resumes on its own.', 'Restart once only if it stays idle for more than an hour (est.).'],
    test: /epoch (transition|change|switch|rollover)|waiting for (the )?(new )?(epoch|task|job|work)|new epoch|reseed(ing)?|idl(e|ing)[^\n]{0,30}epoch|shares?[^\n]{0,20}frozen|miners? locked/i,
  },
  {
    id: 'mining',
    severity: 'fine',
    title: 'It is mining',
    means: 'The log shows an it/s readout, so the miner is working.',
    fix: ['No solutions in the first hour is normal. They arrive in 5 to 30 minutes, sometimes longer.', 'Leave it running. Hopping machines every few minutes only burns money.'],
    test: /\d+(\.\d+)?\s*it\/s/i,
  },
]

const ORDER: Record<Severity, number> = { fault: 0, check: 1, fine: 2 }

/** Run every rule over the log; each rule reports the first line it matched. Mining is "fine" only if nothing is wrong. */
export function diagnose(log: string): Diagnosis {
  const seedWarning = containsSeed(log)
  const lines = log.split(/\r?\n/)
  if (!log.trim()) return { status: 'empty', findings: [], seedWarning }
  const findings: Finding[] = []
  for (const r of RULES) {
    // Scan from the end: the latest occurrence is the one that matters.
    for (let i = lines.length - 1; i >= 0; i--) {
      const text = lines[i]!
      if (r.test.test(text)) {
        findings.push({ id: r.id, severity: r.severity, title: r.title, means: r.means, fix: r.fix, line: { n: i + 1, text: text.trim().slice(0, 240) } })
        break
      }
    }
  }
  // "Mining" next to a real fault is not reassurance; drop it so the fault leads.
  const faults = findings.filter(f => f.severity === 'fault')
  const list = faults.length ? findings.filter(f => f.id !== 'mining') : findings
  list.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
  if (!list.length) return { status: 'unknown', findings: [], seedWarning }
  return { status: list[0]!.severity, findings: list, seedWarning }
}

/** Symptoms without a log: the triage table from the mining guide. */
export const SYMPTOMS: { id: string; label: string; finding: Omit<Finding, 'line'> }[] = [
  { id: 'no-sol', label: 'No solutions yet', finding: { id: 'no-sol', severity: 'fine', title: 'No solutions in the first hour', means: 'Normal. Solutions arrive in 5 to 30 minutes, sometimes longer.', fix: ['Leave it running.', 'Hopping machines every few minutes only burns money.', 'Judge it after a full epoch by your cost per solution.'] } },
  { id: 'frozen', label: 'Shares frozen', finding: { id: 'frozen', severity: 'fine', title: 'Shares frozen, reseeding, miners locked', means: 'Almost always pool or backend lag around an epoch change.', fix: ['Wait.', 'Restart the miner once if you want to be sure.'] } },
  { id: 'behind', label: 'Dashboard is behind', finding: { id: 'behind', severity: 'fine', title: 'Dashboard shows "behind"', means: 'Display lag. The work is counted.', fix: ['Ignore it, or restart the miner once.'] } },
  { id: 'missing', label: 'Worker not on dashboard', finding: { id: 'missing', severity: 'check', title: 'A worker shows nothing', means: 'Usually two machines share one worker name.', fix: ['Give each machine its own name starting with QC.', 'Check the address on the setup page is yours, all 60 letters.'] } },
  { id: 'rejected', label: 'Many rejected', finding: { id: 'rejected', severity: 'check', title: 'Many rejected or expired candidates', means: 'The CPU cannot keep up with the cards, or the host lags.', fix: ['Keep at least 8 CPU cores per GPU.', 'Use a stronger CPU or a more reliable host.'] } },
  { id: 'wont-start', label: "Miner won't start", finding: { id: 'wont-start', severity: 'check', title: 'The miner does not start', means: 'I need the log to tell which of the usual causes it is.', fix: ['Run it once in the foreground and paste the last 30 lines here.', 'Common causes: missing NVIDIA driver, wrong backend for the CPU, file not executable.'] } },
]
