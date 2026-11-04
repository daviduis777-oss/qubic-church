/**
 * Log doctor: a rule set over a pasted miner log, or a described symptom.
 * Each finding cites the line that matched. Runs in the browser; logs are never sent anywhere.
 */
import type { AnySource } from './practice.ts'
import { containsSeed } from './redact.ts'

export type Severity = 'fault' | 'check' | 'fine'
/** sources: where the fix comes from (practice.ts / knowledge.ts ids). Rules without it come from our mining guide. */
export type Rule = { id: string; severity: Severity; title: string; means: string; fix: string[]; test: RegExp; sources?: AnySource[] }
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
    test: /illegal instruction|sigill|avx-?(2|512)[^\n]*(not (supported|available|found|detected)|unsupported|missing)|(cpu|processor) does not support avx|requires avx|status=4\/ill\b/i,
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
    fix: ['Rent the box in another country. In our epoch 229 runs hosts in Russia, Belarus and China could not reach the pool or hung (tested against jetski, now gone).', 'On your own PC, check a firewall or VPN is not blocking it.'],
    test: /worker package download failed|package download failed/i,
    sources: ['guide', 'field-e229'],
  },
  {
    id: 'connection',
    severity: 'fault',
    title: 'Cannot connect to the pool',
    means: 'The server refused or dropped the connection, or it timed out.',
    fix: ['Check the machine is online: ping 1.1.1.1', 'Check a firewall, VPN or the host is not blocking outgoing connections.', 'Restart the miner once. If it persists, the pool may be in maintenance: wait a few minutes.'],
    // A line with HTTP 502 or websocket code 1006 is the pool side (rule pool-side), not this machine.
    test: /^(?![^\n]*\b(1006|502)\b)[^\n]*(econnrefused|connection refused|econnreset|connection reset|etimedout|connection timed out|could not connect|failed to connect|unable to connect|cannot connect|socket (error|closed|hang up)|websocket[^\n]*(error|closed)|network is unreachable)/i,
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
    id: 'defender',
    severity: 'fault',
    title: 'Windows Defender quarantined or blocked the miner',
    means: 'Microsoft lists cryptomining software as a potentially unwanted app category, so miner files get flagged and removed.',
    fix: [
      'Only if you downloaded it from the pool setup page: add the miner folder, and only that folder, as a Folder exclusion (Windows Security, Virus & threat protection, Manage settings, Exclusions, Add or remove exclusions).',
      'Then Protection history, open the item, Actions, Restore or Allow on device. A Blocked item was already removed: download it again from the setup page.',
      'Never exclude a whole drive or Downloads, and never for a miner from a chat link, a video or a "faster" fork.',
    ],
    test: /(windows|microsoft) defender|windows security[^\n]{0,40}(threat|quarantin|block)|threat (quarantined|blocked|found)|contains a virus or potentially unwanted software|(trojan|pua|program|hacktool):win(32|64)\/coinminer|\bcoinminer\b|potentially unwanted (app|application|software)/i,
    sources: ['defenderPua', 'defenderExclusion', 'defenderHistory'],
  },
  {
    id: 'smartscreen',
    severity: 'fault',
    title: 'SmartScreen stopped the miner from starting',
    means: '"Windows protected your PC" appears for files without reputation yet.',
    fix: ['Only for the miner from the pool setup page: choose More info, then Run anyway.', 'If it was not from the setup page, delete it and download the official one.'],
    test: /windows protected your pc|smartscreen|unrecognized app/i,
    sources: ['smartscreen'],
  },
  {
    id: 'gatekeeper',
    severity: 'fault',
    title: 'macOS will not open the miner',
    means: 'Gatekeeper blocks apps it cannot verify: "cannot be opened because the developer cannot be verified".',
    fix: [
      'Only for the miner from the pool setup page: try to open it once, then System Settings, Privacy & Security, scroll to Security, Open Anyway, and enter your password.',
      'The Open Anyway button stays for about an hour after the attempt.',
      'Control-click, Open only works before macOS 15 Sequoia.',
    ],
    test: /cannot be opened because (the developer cannot be verified|it is from an unidentified developer|apple cannot check it)|developer cannot be verified|apple could not verify|unidentified developer|is damaged and can.t be opened|not opened[^\n]{0,40}(apple|malware)/i,
    sources: ['gatekeeper', 'sequoia'],
  },
  {
    id: 'hive-install',
    severity: 'fault',
    title: 'HiveOS could not install the custom miner',
    means: 'The package behind the Installation URL did not download or unpack.',
    fix: [
      'Copy the Installation URL again from the pool setup page: it must be the direct link to the .tar.gz package.',
      'Leave Miner name as HiveOS fills it from the URL: the package name without version and extension.',
      'Check the rig is online (ping 1.1.1.1 in the Hive shell), then miner stop and miner start.',
      'Read the details with miner log.',
    ],
    test: /(custom miner|custom_(install_)?url|\/hive\/miners\/custom|h-(manifest\.conf|run\.sh|config\.sh|stats\.sh))[^\n]{0,80}(not found|fail|error|no such file|missing|cannot)|gzip: stdin: not in gzip format|tar: [^\n]*(cannot open|not in gzip format|error is not recoverable|unexpected eof)|no appsettings\.json/i,
    sources: ['hiveCustom', 'hiveShell', 'qubicliHive'],
  },
  {
    id: 'systemd',
    severity: 'fault',
    title: 'The miner service fails or keeps restarting',
    means: 'systemd started the miner, it exited, and Restart=always started it again.',
    fix: [
      'See why: journalctl -u qubic-miner -n 50 --no-pager. The real error is in the lines just above "Main process exited".',
      'status=203/EXEC: ExecStart is not an executable file. Use the full path and chmod +x /opt/qubic-miner/run.sh.',
      'status=200/CHDIR or 217/USER: the folder or the user named in the unit does not exist.',
      'Test it by hand as that user: sudo -u qubic /opt/qubic-miner/run.sh',
      'After a fix: sudo systemctl daemon-reload && sudo systemctl restart qubic-miner. After "Start request repeated too quickly", run sudo systemctl reset-failed qubic-miner first.',
    ],
    test: /\.service: (main process exited|failed with result|start request repeated too quickly|scheduled restart job|failed at step|control process exited)|start-limit-hit|activating \(auto-restart\)|status=2\d\d\/[a-z]+|failed to start [^\n]*\.service/i,
    sources: ['systemdService', 'journalctl', 'localCheck'],
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
    id: 'duplicate-process',
    severity: 'fault',
    title: 'A second miner process on this machine',
    means: '"Ant stream closed" every few seconds, or "address already in use", means two miner processes fight over the same cards and port. A multi-card rig that also mines on the CPU can loop the same line.',
    fix: [
      'List the miner processes: ps aux | grep -i miner (Windows: Task Manager, Details).',
      'Stop all of them, then start one instance only. One process per box: splitting the cards across several processes crashed them in our runs.',
      'If only one runs and this is a rig with 3 or more cards, turn CPU mining off (GPU only): 6 cards plus CPU looped "Ant stream closed" every 2 seconds in epoch 229.',
    ],
    test: /ant stream closed|address already in use|eaddrinuse/i,
    sources: ['field-e229'],
  },
  {
    id: 'crash',
    severity: 'fault',
    title: 'The miner crashed',
    means: 'It exited with a segmentation fault or a core dump.',
    fix: ['Download the current miner again from the setup page.', 'Try the backend Auto.', 'If it repeats, paste the 20 lines before the crash.'],
    test: /segmentation fault|core dumped|sigsegv|status=11\/segv\b|panicked at|fatal error/i,
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
    fix: ['Keep at least 8 CPU cores, 12 threads, per GPU.', 'Use a stronger CPU, or move to a more reliable host (98%+ reliability).'],
    test: /(rejected|expired|stale)[^\n]{0,20}(ant )?(candidates?|shares?|solutions?)|(candidates?|shares?|solutions?)[^\n]{0,10}(rejected|expired|stale)/i,
  },
  {
    id: 'old-miner',
    severity: 'check',
    title: 'The miner may be too old for the current algorithm',
    means: 'After an algorithm change an old miner keeps showing it/s while its work no longer counts: in epoch 224 stale clients showed hashrate but only invalid shares. Epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron networks.',
    fix: [
      'Download the current miner from the pool setup page and restart it once.',
      'Miners built for the jetski pool are gone and do not work on this pool.',
      'A new algorithm can take 1 to 2 epochs to settle. Judge by solutions on the pool, not it/s.',
    ],
    test: /(client|miner|trainer|version)[^\n]{0,40}(outdated|too old|deprecated|no longer supported|mismatch|update required|please update)|invalid (share|solution)s?\b|(share|solution) format|unsupported (task|template|algorithm)|unknown (task|template) (file|format|version)/i,
    sources: ['field', 'qli-mod'],
  },
  {
    id: 'pcie-narrow',
    severity: 'check',
    title: 'The card sits on a narrow PCIe link',
    means: 'x1, x2 or x4 starves the card: on 8 Sep 2026 PCIe 4.0 x4 halved the throughput of 2x RTX 4090 against x8, and x1 risers held RTX 5070 Tis far below a good host.',
    fix: [
      'Use PCIe 4.0 x8 or 3.0 x16 per card. Check: nvidia-smi -q | grep -A2 "Link Width"',
      'A card in a lower power state can show a narrow link at idle: read it while mining.',
      'On a rental, pick another host: cheap multi-card boxes are often old mining frames on x1 risers.',
    ],
    test: /^\s*current\s*:\s*[124]x\s*$|lnksta:[^\n]*width x[124]\b/i,
    sources: ['field-e229'],
  },
  {
    id: 'sleep',
    severity: 'check',
    title: 'The machine went to sleep',
    means: 'Sleep stops mining until the machine wakes up.',
    fix: [
      'Windows: powercfg /change standby-timeout-ac 0 and powercfg /change hibernate-timeout-ac 0, or set sleep to Never when plugged in.',
      'macOS: run the miner as caffeinate -dimsu ~/qubic-miner/run.sh and keep the power adapter in, or turn on Prevent automatic sleeping in Energy (Battery, Options on a MacBook).',
      'Linux: sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target',
    ],
    test: /pm: suspend (entry|exit)|systemd-sleep|reached target (sleep|suspend|hibernate)|(entering|going to) (sleep|suspend|hibernat)|suspending system|idle sleep|kernel-power[^\n]*(\b42\b|\b107\b|sleep)|(resumed|resume|wake|woke)( up)? from (sleep|suspend|standby|hibernat)|darkwake/i,
    sources: ['powercfg', 'winPower', 'caffeinate', 'macSleep', 'localCheck'],
  },
  {
    id: 'gpu-power',
    severity: 'check',
    title: 'The card is held by its power limit',
    means: 'nvidia-smi shows the clocks held down by power: expected at a limit you set, a problem if you did not set one.',
    fix: [
      'If you set the limit for efficiency, this is expected. Compare solutions per hour, not it/s.',
      'If you did not: check the limit with nvidia-smi -q -d POWER and raise it toward the default with sudo nvidia-smi -pl <WATTS>.',
      'HW Slowdown or HW Power Brake: check the power supply and its cables, and the cooling.',
    ],
    test: /(sw power cap|hw slowdown|hw power brake slowdown)\s*:\s*active\b|power[- ]limit(ed)?[^\n]{0,20}(reached|exceeded|hit)|(gpu|card|cuda)[^\n]{0,30}(power[- ]limited|power cap\b)/i,
    sources: ['nvidiaSmi', 'pugetPower'],
  },
  {
    id: 'thermal',
    severity: 'check',
    title: 'The hardware is throttling',
    means: 'It is too hot and slows itself down.',
    fix: ['Improve airflow and clean the fans.', 'Lower the thread count on a laptop.'],
    test: /^(?!.*\bnot active\b)(?!\s*clocks? (event|throttle) reasons\s*:?\s*$).*(thermal|throttl|temperature (too high|limit|critical)|overheat)/i,
  },
  {
    id: 'cold-start',
    severity: 'fine',
    title: 'Cold start',
    means: '"No trainer available", "wait for propagation", "bind failed" and status "starting" are normal for the first minutes.',
    fix: ['Do not restart in a loop: each restart resets the wait and the progress.', 'A fresh rig at 0 for 2 to 30 minutes is normal. Judge it after 20 minutes at the earliest.'],
    test: /no trainer available|wait(ing)? for propagation|bind failed(?![^\n]*in use)|status"?\s*[:=]\s*"?starting/i,
    sources: ['field-e233'],
  },
  {
    id: 'pool-side',
    severity: 'fine',
    title: 'A pool-side error, not your rig',
    means: 'HTTP 502, websocket close 1006, "retired-lease progress rejected", "ant lease expired" and "active search cancelled" come from the pool changing work or having an outage.',
    fix: ['Leave the rig alone. Do not restart: a restart resets the warm-up.', 'Wait 5 to 15 minutes. If nothing moves after 20 to 30 minutes, check the pool status channel.', 'Solutions can be lost during a pool outage; that is not your rig.'],
    test: /\b(http|status|code)\D{0,6}50[234]\b|bad gateway|websocket[^\n]{0,40}\b1006\b|\bclose[ds]?\D{0,8}1006\b|retired-lease progress rejected|(ant )?lease expired|ant progress rejected|ant work unavailable|active search cancelled|submission backlog|\borphaned\b/i,
    sources: ['field-e233'],
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
    fix: ['A fresh rig at 0 for 2 to 30 minutes is normal. Judge it after 20 minutes at the earliest, and read the rate after 2 hours: the first 1 to 2 hours run about 1.3 to 1.5x high.', 'Judge by solutions per hour on the pool and the wallet total, not it/s: it/s falls through an epoch with no change in solutions.', 'Leave it running. Hopping machines every few minutes only burns money.'],
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
  { id: 'no-sol', label: 'No solutions yet', finding: { id: 'no-sol', severity: 'fine', title: 'No solutions yet', means: 'A fresh rig at 0 for 2 to 30 minutes is normal, and even top rigs find solutions in bursts.', fix: ['Wait at least 20 minutes before judging.', 'Still 0 after 20 minutes with a normal it/s readout: restart once and wait 10 more minutes. Still 0: close it.', 'Read the rate after 2 hours, and judge by the wallet total on the pool.'] } },
  { id: 'its-drop', label: 'it/s keeps falling', finding: { id: 'its-drop', severity: 'fine', title: 'it/s falls during the epoch', means: 'Normal: each iteration gets heavier as the work matures. In our runs one rig fell from 508 to 280 it/s in 30 minutes with no change in solutions.', fix: ['Judge by solutions per hour on the pool, not it/s.', 'nvidia-smi: 100% use at normal clocks is fine; clocks dropping at 85 C or more is heat; use under 50% means the CPU or the pool starves the cards.'] } },
  { id: 'slow-host', label: 'Slower than the same card elsewhere', finding: { id: 'slow-host', severity: 'check', title: 'The host may hold the cards back', means: 'Some hosts throttle every card: on host 24255 every server held its RTX 5070 Tis back in our epoch 229 runs. A narrow PCIe link, too few CPU threads or a host power limit do the same.', fix: ['Check the link: nvidia-smi -q | grep -A2 "Link Width". PCIe 4.0 x8 or 3.0 x16 per card.', 'Check the power limit: nvidia-smi -q -d POWER. Hosts cut RTX 5080s to 250 W and 5090s to 400 W.', 'Keep 12+ CPU threads per card. On a rental, move to another host and note this host ID to avoid.'] } },
  { id: 'pool-errors', label: 'Pool errors (502, 1006)', finding: { id: 'pool-errors', severity: 'fine', title: 'Pool-side errors', means: 'HTTP 502, websocket close 1006 and "retired-lease progress rejected" come from the pool, not your rig.', fix: ['Leave the rig alone and do not restart.', 'Wait 5 to 15 minutes. After 20 to 30 minutes, check the pool status channel.'] } },
  { id: 'dies-terminal', label: 'Stops when I close the terminal', finding: { id: 'dies-terminal', severity: 'check', title: 'The miner dies with the terminal', means: 'A miner started in a browser terminal stops when that terminal closes. On 6 Sep 2026 three of our four rigs stopped overnight this way.', fix: ['Start it detached with nohup and a log file, or as a systemd service (see the Linux procedures).', 'On a rental, watch the maximum rental time and extend well before it ends.'] } },
  { id: 'frozen', label: 'Shares frozen', finding: { id: 'frozen', severity: 'fine', title: 'Shares frozen, reseeding, miners locked', means: 'Almost always pool or backend lag around an epoch change.', fix: ['Wait.', 'Restart the miner once if you want to be sure.'] } },
  { id: 'behind', label: 'Dashboard is behind', finding: { id: 'behind', severity: 'fine', title: 'Dashboard shows "behind"', means: 'Display lag. The work is counted.', fix: ['Ignore it, or restart the miner once.'] } },
  { id: 'missing', label: 'Worker not on dashboard', finding: { id: 'missing', severity: 'check', title: 'A worker shows nothing', means: 'Usually two machines share one worker name.', fix: ['Give each machine its own name starting with QC.', 'Check the address on the setup page is yours, all 60 letters.'] } },
  { id: 'rejected', label: 'Many rejected', finding: { id: 'rejected', severity: 'check', title: 'Many rejected or expired candidates', means: 'The CPU cannot keep up with the cards, or the host lags.', fix: ['Keep at least 8 CPU cores, 12 threads, per GPU.', 'Use a stronger CPU or a more reliable host.'] } },
  { id: 'sleeps', label: 'Stops when I walk away', finding: { id: 'sleeps', severity: 'check', title: 'Mining stops when nobody uses the machine', means: 'Almost always sleep or hibernation.', fix: ['Windows: powercfg /change standby-timeout-ac 0 and powercfg /change hibernate-timeout-ac 0.', 'macOS: run it as caffeinate -dimsu ~/qubic-miner/run.sh, on the power adapter.', 'Linux: sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target'] } },
  { id: 'blocked', label: 'Antivirus or macOS blocks it', finding: { id: 'blocked', severity: 'check', title: 'The system blocks the miner', means: 'Windows Defender, SmartScreen or macOS Gatekeeper stopped a file it does not know.', fix: ['Only for the miner from the pool setup page.', 'Windows: exclude only the miner folder in Windows Security, then Restore it from Protection history.', 'macOS: System Settings, Privacy & Security, Open Anyway.'] } },
  { id: 'wont-start', label: "Miner won't start", finding: { id: 'wont-start', severity: 'check', title: 'The miner does not start', means: 'I need the log to tell which of the usual causes it is.', fix: ['Run it once in the foreground and paste the last 30 lines here.', 'Common causes: missing NVIDIA driver, wrong backend for the CPU, file not executable.'] } },
]
