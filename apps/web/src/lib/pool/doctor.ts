/**
 * Log doctor: a rule set over a pasted miner log, or a described symptom.
 * Each finding cites the line that matched. Runs in the browser; logs are never sent anywhere.
 * A paste is usually the user's words around a log: rules marked logOnly read log-shaped lines only, and
 * rules with `when` / `unless` look at the whole paste (how long it has been, which device).
 */
import { RIG } from './config.ts'
import type { AnySource } from './practice.ts'
import { containsSeed } from './redact.ts'

export type Severity = 'fault' | 'check' | 'fine'
/**
 * sources: where the fix comes from (practice.ts / knowledge.ts ids). Rules without it come from our mining guide.
 * logOnly: match only lines that look like miner output, never the user's own sentences.
 * when / unless: the whole paste must (not) match. drops: findings this one makes moot.
 * read: turn the matched line into a specific reading (for counters such as SOLS a/b (R:c)).
 * open: a case with no confirmed fix; Maria's prompt lists it under OPEN CASES and says so first.
 */
export type Rule = {
  id: string
  severity: Severity
  title: string
  means: string
  fix: string[]
  test: RegExp
  sources?: AnySource[]
  logOnly?: boolean
  when?: RegExp
  unless?: RegExp
  drops?: string[]
  read?: (m: RegExpExecArray) => { means: string; severity?: Severity }
  open?: boolean
}
export type Finding = { id: string; severity: Severity; title: string; means: string; fix: string[]; line?: { n: number; text: string } }
export type Diagnosis = { status: Severity | 'empty' | 'unknown'; findings: Finding[]; seedWarning: boolean }

/** Our runs predate the later algorithm changes; every number from them says so. */
const OURS = 'our epoch 229/233 runs, predates the E235/E236 changes'

/** Miner output, not prose: a timestamp, a [TAG], a table bar, JSON, "E:229", a key: value, or a known counter. */
export const LOG_LINE =
  /^\s*(?:\d{4}-\d\d-\d\d|\d{1,2}:\d\d|[[|{<"#]|E:\s?\d|(?:current |average |total )?hashrate\b|iterations?\b|(?:SOLS|SHARES|INFO|WARN|ERROR|DEBUG|TRACE)\b|(?:CUDA|AVX2|AVX512|CPU|GPU)\s*[:\]|]|[A-Za-z][\w.-]{0,24}:\s)/

/** The user says it has gone on for hours, days or weeks. */
export const LONG_TIME = /\b(?:\d+\s*(?:h|hrs?|hours?|days?|weeks?|months?)\b|(?:hours|days|weeks|months)\b|overnight|all night|endless(?:ly)?)/i
const MOBILE = /\b(?:app|mobile|phones?|android|apk|smartphone)\b/i

/** An epoch seed printed by the miner, as opposed to a wallet seed the user pasted. */
const SEED_LOG_LINE = /^\s*(?:[\d:.T-]+\s+|\[[^\]]*\]\s*){0,4}SEED\b/

export const RULES: Rule[] = [
  {
    id: 'secret-leak',
    severity: 'fault',
    title: 'An access token is in this paste',
    means: 'The config holds an access token. It is a secret like a password: whoever has it can act as you on the pool that issued it.',
    fix: [
      'Do not post it publicly; delete the message if you already did.',
      'Ask the pool that issued it for a new token if it was exposed.',
      'Before sharing a config, replace the token with <removed>.',
    ],
    test: /"?access_?token"?\s*[:=]\s*"?(?!<)[A-Za-z0-9_-]{6,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{4,}/i,
  },
  {
    id: 'cuda-missing',
    severity: 'fault',
    title: 'CUDA or the NVIDIA driver is missing',
    means: 'The miner cannot reach the card through CUDA.',
    fix: [
      'Rented box: do not install drivers or reboot inside the container. Pick an image with CUDA 12 or newer (12.4 or newer for RTX 50 / Blackwell cards: the Clore filter needed it on 6 Sep 2026), or another box.',
      'Your own machine: install the NVIDIA driver (Ubuntu: sudo ubuntu-drivers install), then reboot.',
      'Check with nvidia-smi: it must list your cards before you start the miner. No tested driver minimum for the current miner is known.',
    ],
    test: /no cuda[- ]capable device|cuda_error_no_device|no cuda devices? (found|detected)|libcuda\.so[^\n]*(cannot open|not found|no such file)|nvidia-smi: (command )?not found|failed to initiali[sz]e nvml|nvidia-smi has failed|cuda (driver|runtime)[^\n]*(not found|missing|failed to load)|could not (load|find) cuda|cudaGetDeviceCount[^\n]*fail/i,
    sources: ['clore', 'ubuntuNvidia', 'field-e229'],
  },
  {
    id: 'driver-old',
    severity: 'fault',
    title: 'The NVIDIA driver is too old',
    means: 'The miner was built for a newer CUDA than your driver supports.',
    fix: ['Rented box: choose a newer CUDA image or another box; do not install drivers inside the container.', 'Your own machine: update the NVIDIA driver to a current release, then reboot.'],
    test: /driver version is insufficient|cuda_error_unsupported_ptx_version|unsupported (ptx|toolchain)|requires a newer (driver|cuda)/i,
  },
  {
    id: 'gpu-kernel-missing',
    severity: 'fault',
    title: 'The GPU trainer cannot find its compute kernel',
    means: '"Kernel with original name kern_solve_cand_start not found in map": the GPU trainer fails to load its CUDA kernel and the card mines nothing while it repeats. No confirmed fix yet: 4 to 5 Windows NVIDIA miners reported it on one pool\'s client (9 to 14 Oct 2026), unanswered. Other pools\' GPU miners worked on the same cards: that client\'s bug, not the card.',
    fix: [
      'Run the current miner from the pool setup page and restart it once.',
      'If it still repeats, mine CPU only for now and report it to the pool with the log, the GPU model and the OS.',
    ],
    test: /kernel with original name[^\n]{0,80}not found in map|\[qjm error\][^\n]{0,40}kernel/i,
    sources: ['community'],
    open: true,
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
    fix: [`Rent the box in another country and test it for 10 minutes (${OURS}: Russia and Belarus failed, a China terminal hung; only the jetski endpoints were tested).`, 'On your own PC, check a firewall or VPN is not blocking it.'],
    test: /worker package download failed|package download failed/i,
    sources: ['guide', 'field-e229'],
  },
  {
    id: 'connection',
    severity: 'fault',
    title: 'Cannot connect to the pool',
    means: 'The connection failed, was refused or timed out: the rig never reaches the pool, so it/s and solutions do not matter yet.',
    fix: [
      'Check the machine is online: ping 1.1.1.1',
      'Check a firewall, VPN or the host is not blocking outgoing connections.',
      `On a rental, try a host in another region with a 10-minute test: in ${OURS}, Russian and Belarusian hosts could not reach the jetski endpoints (the only ones tested).`,
      'Restart the miner once. If it persists, check the pool status channel.',
    ],
    // A line with HTTP 502 or websocket code 1006 is the pool side (rule pool-side), not this machine.
    test: /^(?![^\n]*\b(1006|502)\b)[^\n]*(econnrefused|connection refused|econnreset|connection reset|etimedout|connection timed out|connection (failed|timeout)|timed? ?out[^\n]{0,20}connect|could not connect|failed to connect|unable to connect|cannot connect|socket (error|closed|hang up)|websocket[^\n]*(error|closed)|network is unreachable)/i,
    sources: ['field-e229'],
  },
  {
    id: 'auth-mobile',
    severity: 'fault',
    title: 'A phone miner login was rejected (another pool\'s app)',
    means: 'On 2 Oct 2026 another pool\'s moderator said "Authentication failed" in its phone app meant the phone was blacklisted for sending too many shares in a short time, and that they were fixing it. Qubic Church Pool has no Android option.',
    fix: ['Mine on a PC or a server: the pool setup page offers Linux, macOS, Windows and HiveOS.', 'For that app, ask the pool that runs it.'],
    test: /authentication failed|auth(entication)? (error|rejected)/i,
    when: MOBILE,
    sources: ['community', 'qli-team'],
  },
  {
    id: 'auth',
    severity: 'fault',
    title: 'The pool rejected the login',
    means: 'A token or key the miner sent was not accepted.',
    fix: ['Take the values again from the pool setup page and restart.', 'Do not reuse a command from another pool.', 'On another pool\'s phone app "Authentication failed" meant the worker was blacklisted for sending too many shares too fast; its moderator said they were fixing it (2 Oct 2026).'],
    sources: ['guide', 'community'],
    test: /\b(401|403)\b[^\n]*(unauthori[sz]ed|forbidden)|unauthori[sz]ed|forbidden|invalid (token|access token|api key)|authentication failed/i,
    unless: MOBILE,
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
      `If only one runs and this is a rig with 3 or more cards, turn CPU mining off (GPU only) and keep 12 or more CPU threads per card: 6 cards plus CPU looped "Ant stream closed" every 2 seconds (7 Sep 2026, ${OURS}).`,
    ],
    test: /ant stream closed|address already in use|eaddrinuse/i,
    sources: ['field-e229'],
  },
  {
    id: 'ant-temp-locked',
    severity: 'fault',
    title: 'The miner cannot open its own Ant Colony work files',
    means: 'System.IO.IOException on tmp.ant_*.part files "being used by another process" makes the miner crash after a short run. Reported on Windows on 2 Oct 2026 (after forcing AVX512 on a Ryzen 9900X); no confirmed fix yet.',
    fix: [
      'Make sure only one miner runs: stop every miner process (Task Manager, Details), then start one copy only.',
      'Keep the miner folder excluded from Defender or your antivirus (only for the miner from the pool setup page).',
      'Use the current miner from the pool setup page, and report the log to the pool.',
    ],
    test: /ioexception[^\n]{0,160}\.part\b|\bant_\d+_\d+\.part\b|\.part[^\n]{0,80}being used by another process/i,
    sources: ['community', 'defenderExclusion'],
    open: true,
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
    id: 'backend-avx2',
    severity: 'check',
    title: 'The CPU backend is forced to AVX2',
    means: 'This config ("cpuVersion" is the key in the QLI client\'s config, not ours) forces AVX2. On an AVX-512 CPU (every Ryzen 7000 and 9000 desktop CPU such as the 9900X, Threadripper 7000, EPYC 9004/9005) that wastes the CPU: on 2 Oct 2026 a Ryzen 9 9900X sat at 0 it/s with AVX2 and forcing "cpuVersion": "AVX512" fixed it.',
    fix: [
      'Check the CPU: lscpu | grep -o avx512f (Windows: Coreinfo). avx512f present: choose AVX512, or Auto if unsure.',
      'On this pool set the backend on the setup page and run the command it gives.',
      'If it then crashes on tmp.ant_*.part files, that is a separate open issue with no confirmed fix.',
    ],
    test: /"?cpuVersion"?\s*:\s*"AVX2"/i,
    sources: ['community', 'academy'],
  },
  {
    id: 'old-gpu',
    severity: 'check',
    title: 'Pre-Turing card on the current CUDA worker',
    means: 'From epoch 237 (28 Oct 2026, client 3.11, worker cuda 237.0) a GTX 1050 Ti CUDA worker exited every few seconds though it worked in epoch 236 (reported), and a Tesla K80 does not run on current CUDA (20 Oct 2026). The pool said it would look; no fix confirmed by 4 Nov 2026 and no workaround is known.',
    fix: [
      'Treat GTX 10 series (Pascal), Kepler cards such as the K80 and older as unsupported until the pool confirms otherwise.',
      'The CPU still mines: keep the CPU backend on.',
      'Report the GPU model, driver and log to the pool. No older-algorithm option exists.',
    ],
    test: /\b(gtx ?10[5-8]0( ?ti)?|titan xp?|tesla (k80|k40|p4|p40|p100)|pascal|kepler)\b|cuda 237\.0[^\n]{0,60}exit|workers?\b[^\n]{0,60}exits? every/i,
    sources: ['community', 'qli-team'],
    open: true,
  },
  {
    id: 'stats-file',
    severity: 'check',
    title: 'The saved solutions file for this epoch is damaged',
    means: '"failed to restore persisted solutions" or "decode stats file ... invalid character \'\\x00\'": the stats.<epoch>.lock file in the miner folder holds null bytes. Asked on 1 Oct 2026 and never answered: no confirmed fix yet.',
    fix: [
      'Stop the miner, back up the stats.<epoch>.lock file and move it out of the miner folder, then start the miner again.',
      'If it comes back, report it to the pool with the log.',
    ],
    test: /failed to restore persisted solutions|decode stats file|stats\.\d{3}\.lock/i,
    sources: ['community'],
    open: true,
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
    means: `A few rejects are normal (our record rig: R:9 in 14 h, ${OURS}); many are not. The most common cause after an algorithm change is an outdated client.`,
    fix: [
      'Update the miner from the pool setup page and check the version it prints.',
      'Make sure only one miner process runs on the box.',
      'If both are fine, it can be the pool side: check the pool status channel.',
      'Last, the CPU: keep 12 or more threads per card, and a reliable host (98%+).',
    ],
    test: /(rejected|expired|stale)[^\n]{0,20}(ant )?(candidates?|shares?|solutions?)|(candidates?|shares?|solutions?)[^\n]{0,10}(rejected|expired|stale)/i,
    sources: ['qli-team', 'field-e233'],
  },
  {
    id: 'old-miner',
    severity: 'check',
    title: 'The miner may be too old for the current algorithm',
    means: 'After an algorithm change an old miner keeps showing it/s while its work no longer counts: really old clients sent only invalid shares (QLI, 1 Aug 2026). Epoch 235 changed the threshold and task file, epoch 236 moved to 32-neuron networks, epoch 237 brought new workers again.',
    fix: [
      'Download the current miner from the pool setup page and restart it once.',
      'Miners built for other pools (jetski included, not recommended) do not work on this pool: use the setup page miner.',
      'A new algorithm can take 1 to 2 epochs to settle; QLI said at least 3 days, with 0 or very many shares at first (29 Sep 2026). Judge by solutions on the pool, not it/s.',
      'AutoUpdate failed for some workers on 2 to 4 Nov 2026: check the version the miner prints after every change.',
    ],
    test: /(client|miner|trainer|version)[^\n]{0,40}(outdated|too old|deprecated|no longer supported|mismatch|update required|please update)|invalid (share|solution)s?\b|(share|solution) format|unsupported (task|template|algorithm)|unknown (task|template) (file|format|version)/i,
    sources: ['field', 'qli-mod', 'qli-team'],
  },
  {
    id: 'zero-shares-long',
    severity: 'check',
    title: 'SHARES 0/0 for hours',
    means: 'Past the 20-minute rule, 0/0 for hours means the pool is down or changing work, or the client is out of date. Pools broke often: one was down 2 to 4 Nov 2026 and said a new feature worked for some workers but not others (3 Nov). No confirmed cause for a single rig.',
    fix: [
      'Check the status channel of the pool this miner points to first.',
      'Confirm the miner prints the current version (AutoUpdate failed for some workers on 2 to 4 Nov 2026).',
      'If the pool is up and it stays at 0, report it to that pool with the log.',
    ],
    test: /SHARES:?\s*0\s*\/\s*0\b/i,
    when: LONG_TIME,
    sources: ['qli-team', 'community'],
    open: true,
  },
  {
    id: 'idle-long',
    severity: 'check',
    title: 'Waiting for tasks far too long',
    means: '"Waiting to receive tasks" is normal at an epoch change and in the first minutes, not for days or weeks. A Windows case like this (14 Oct 2026) went unanswered: no confirmed cause.',
    fix: [
      'Install the current miner from the pool setup page.',
      'Check the pool status channel.',
      'Keep the Defender or antivirus exclusion for the miner folder.',
      'Then paste the full log, from the start to the waiting line.',
    ],
    test: /waiting (for|to receive) (the )?(new )?(tasks?|jobs?|work)/i,
    when: LONG_TIME,
    sources: ['community'],
    open: true,
  },
  {
    id: 'foreign-endpoint',
    severity: 'check',
    title: 'This config points to another pool',
    means: 'The pool address is another pool\'s endpoint, not Qubic Church Pool. Its status, share rules and support are that pool\'s.',
    fix: ['For problems with that pool, check its status channel.', 'To mine on Qubic Church Pool, use the command from its setup page.'],
    test: /wss?:\/\/[^\s"']*(qubic\.li|jetski|jtsk|minerlab|apool)/i,
  },
  {
    id: 'pcie-narrow',
    severity: 'check',
    title: 'The card sits on a narrow PCIe link',
    means: `x1, x2 or x4 can starve the card: on 8 Sep 2026 PCIe 4.0 x4 halved the throughput of 2x RTX 4090 against x8 (${OURS}), and x1 risers held RTX 5070 Tis far below a good host. The hit varies by card.`,
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
    id: 'zero-hashrate',
    severity: 'check',
    title: 'The miner computes nothing (0 it/s)',
    means: 'The miner runs and gets work but the readout is 0 it/s. In the first minutes that is the cold start. Later, on a CPU the usual cause is the wrong backend (an AVX-512 CPU set to AVX2) or too few threads.',
    fix: [
      'Just started: wait 20 minutes before judging.',
      'Check the backend matches the CPU: AVX512 on AVX-512 CPUs, Auto if unsure.',
      'Set Threads to the nproc count on a dedicated box, and use the current miner from the setup page.',
    ],
    test: /(?:^|[^\d.,])0(?:\.0+)?\s*it\/s/i,
    logOnly: true,
  },
  {
    id: 'not-a-log-line',
    severity: 'fine',
    title: 'A line that is not from the miner',
    means: 'This line gives orders to an AI ("ignore previous instructions", "SYSTEM:"). No miner prints that: someone added it. I ignore it, and it changes nothing in the reading of the real log lines.',
    fix: ['Read the rest of the log as usual.', 'If you copied this log from someone else, get the original from the miner itself.'],
    test: /\b(ignore|disregard|forget) (all |any )?(the )?(previous|prior|above|earlier) (instructions|prompts?|rules)|#{2,}\s*system\s*:|\bsystem prompt\b|\byou are now (a|an|in)\b/i,
  },
  {
    id: 'epoch-seed',
    severity: 'fine',
    title: 'SEED is the epoch seed, not your wallet',
    means: 'The SEED line in a miner log is the epoch seed, not your wallet seed: nothing leaked. A wallet seed is 55 lowercase letters you never paste anywhere.',
    fix: ['Nothing to do.', 'Never paste your wallet seed anywhere; the pool only needs the 60-letter address.'],
    test: SEED_LOG_LINE,
    sources: ['field-e233'],
  },
  {
    id: 'sols-counter',
    severity: 'fine',
    title: 'Solutions counter (SOLS)',
    means: 'SOLS a/b (R:c) = solutions found / sent to the pool (rejected).',
    fix: ['Judge by solutions per hour on the pool and the wallet total, over 6 to 12 hours.', `A few rejects are normal: our record rig had R:1 in 2 h from one "orphaned" send and R:9 in 14 h (${OURS}).`],
    test: /SOLS\s+(\d+)\s*\/\s*(\d+)\s*\(\s*R\s*:\s*(\d+)\s*\)/i,
    read: m => {
      const [found, sent, rej] = [Number(m[1]), Number(m[2]), Number(m[3])]
      const pct = sent ? (rej / sent) * 100 : 0
      const many = rej >= 5 && pct >= RIG.rejectedCheckPct
      const gap = found > sent ? ` The ${found - sent} not yet sent ${found - sent === 1 ? 'is' : 'are'} in flight.` : ''
      const verdict = many
        ? ` ${pct.toFixed(1)}% rejected is more than a few: check the miner version first, then for a second miner process, then the pool status.`
        : ` ${rej === 0 ? 'No rejects' : rej === 1 ? 'One reject' : `${rej} rejects`}: normal, the rig is working.`
      return { means: `SOLS ${found}/${sent} (R:${rej}): ${found} found, ${sent} sent to the pool, ${rej} rejected.${gap}${verdict}`, severity: many ? 'check' : 'fine' }
    },
    sources: ['field-e233'],
  },
  {
    id: 'cold-start',
    severity: 'fine',
    title: 'Cold start',
    means: '"No trainer available", "wait for propagation", "bind failed" and status "starting" are normal for the first minutes.',
    fix: ['Do not restart in a loop: each restart resets the wait and the progress.', `Wait at least 20 minutes, and until after the "Ant work replaced" line if the log prints it, then judge by solutions (${OURS}).`],
    test: /no trainer available|wait(ing)? for propagation|bind failed(?![^\n]*in use)|status"?\s*[:=]\s*"?starting/i,
    drops: ['zero-hashrate'],
    sources: ['field-e233'],
  },
  {
    id: 'pool-side',
    severity: 'fine',
    title: 'A pool-side error, not your rig',
    means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093, together, are a pool outage. "retired-lease progress rejected", "ant lease expired", "active search cancelled" (1 to 2 minute pauses) and "Submission backlog" are the pool changing work: routine.',
    fix: ['Leave the rig alone. Do not restart: a restart resets the warm-up.', 'Wait 5 to 15 minutes. If nothing moves after 20 to 30 minutes, check the pool status channel.', 'Solutions found during an outage may be lost; that is not your rig.'],
    test: /\b(http|status|code)\D{0,6}50[234]\b|bad gateway|websocket[^\n]{0,40}\b1006\b|\bclose[ds]?\D{0,8}1006\b|127\.0\.0\.1:8093[^\n]*(refused|econnrefused)|(refused|econnrefused)[^\n]*127\.0\.0\.1:8093|retired-lease progress rejected|(ant )?lease expired|ant progress rejected|ant work unavailable|active search cancelled|submission backlog|\borphaned\b/i,
    drops: ['connection'],
    read: m =>
      /50[234]|bad gateway|1006|8093/i.test(m.input)
        ? { means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093, together, are a pool outage, not your rig. Solutions found during it may be lost.' }
        : { means: 'Routine: "retired-lease progress rejected", "ant lease expired", "active search cancelled" (1 to 2 minute pauses) and "Submission backlog" are the pool changing work. Not your rig.' },
    sources: ['field-e233'],
  },
  {
    id: 'ant-parent',
    severity: 'fine',
    title: 'The pool is missing the Ant Colony parent',
    means: '"parent ... not found", "server cache miss" or "0 walks served" means the pool did not have the work your worker asked for, so it/s drops to 0 for minutes. Pool side, nothing to fix locally: a "Parent LUT" fault stopped one pool for about 2 days in epoch 231 (Sep 2026), and cache misses came back on 21 Oct 2026, during that pool\'s 21 to 23 Oct outage.',
    fix: ['Leave the rig running; do not restart in a loop, and do not change threads or backend for this.', 'If it lasts more than 30 minutes on several rigs, check the pool status channel and report it with timestamps.', 'Judge by solutions over the epoch.'],
    test: /antcolony:?[^\n]{0,20}parent[^\n]{0,80}not found|server cache miss|\b0 walks served|parent lut/i,
    sources: ['community', 'qli-team'],
  },
  {
    id: 'epoch-idle',
    severity: 'fine',
    title: 'Idle at an epoch change',
    means: 'At Wednesday 12:00 UTC the miner waits for the backend update, then continues.',
    fix: ['Do nothing. It resumes on its own.', 'Restart once only if it stays idle for more than an hour (est.).', 'Waiting for tasks for hours outside an epoch change: update the miner and check the pool status channel.'],
    test: /epoch (transition|change|switch|rollover)|waiting (for|to receive) (the )?(new )?(epoch|task|job|work)|new epoch|reseed(ing)?|idl(e|ing)[^\n]{0,30}epoch|shares?[^\n]{0,20}frozen|miners? locked/i,
    unless: LONG_TIME,
  },
  {
    id: 'mining',
    severity: 'fine',
    title: 'It is mining',
    means: 'The log shows a non-zero it/s readout, so the miner is working.',
    fix: [`Wait at least 20 minutes, and until after "Ant work replaced", before judging; read the rate after 2 hours: the first 1 to 2 hours ran about 1.3 to 1.5x high (${OURS}).`, 'Judge by solutions per hour on the pool and the wallet total, not it/s: it/s falls through an epoch with no change in solutions.', 'Leave it running. Hopping machines every few minutes only burns money.'],
    test: /\b(?!0(?:\.0+)?\s*it\/s)\d+(?:\.\d+)?\s*it\/s/i,
    logOnly: true,
  },
]

const ORDER: Record<Severity, number> = { fault: 0, check: 1, fine: 2 }

/** Run every rule over the log; each rule reports the latest line it matched. Mining is "fine" only if nothing is wrong. */
export function diagnose(log: string): Diagnosis {
  const lines = log.split(/\r?\n/)
  // The epoch seed a miner prints is not a wallet seed; only the rest of the paste can leak one.
  const seedWarning = containsSeed(lines.filter(l => !SEED_LOG_LINE.test(l)).join('\n'))
  if (!log.trim()) return { status: 'empty', findings: [], seedWarning }
  let findings: Finding[] = []
  const drop = new Set<string>()
  for (const r of RULES) {
    if (r.when && !r.when.test(log)) continue
    if (r.unless?.test(log)) continue
    // Scan from the end: the latest occurrence is the one that matters.
    for (let i = lines.length - 1; i >= 0; i--) {
      const text = lines[i]!
      if (r.logOnly && !LOG_LINE.test(text)) continue
      const m = new RegExp(r.test.source, r.test.flags.replace('g', '')).exec(text)
      if (!m) continue
      const reading = r.read?.(m)
      findings.push({ id: r.id, severity: reading?.severity ?? r.severity, title: r.title, means: reading?.means ?? r.means, fix: r.fix, line: { n: i + 1, text: text.trim().slice(0, 240) } })
      for (const d of r.drops ?? []) drop.add(d)
      break
    }
  }
  findings = findings.filter(f => !drop.has(f.id))
  // "Mining" next to a real fault is not reassurance; drop it so the fault leads.
  const faults = findings.filter(f => f.severity === 'fault')
  const list = faults.length ? findings.filter(f => f.id !== 'mining') : findings
  list.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
  if (!list.length) return { status: 'unknown', findings: [], seedWarning }
  return { status: list[0]!.severity, findings: list, seedWarning }
}

/** Symptoms without a log: the triage table from the mining guide. */
export const SYMPTOMS: { id: string; label: string; finding: Omit<Finding, 'line'> }[] = [
  { id: 'no-sol', label: 'No solutions yet', finding: { id: 'no-sol', severity: 'fine', title: 'No solutions yet', means: 'A fresh rig at 0 for 2 to 30 minutes is normal, and even top rigs find solutions in bursts.', fix: ['Wait at least 20 minutes before judging, and until after the "Ant work replaced" line if the log prints it.', 'Still 0 after 20 minutes with a normal it/s readout: check the miner version and the pool status, restart once and wait 10 more minutes. Still 0: close a rental; on your own machine paste the log here.', 'Read the rate after 2 hours, and judge by the wallet total on the pool.'] } },
  { id: 'its-drop', label: 'it/s keeps falling', finding: { id: 'its-drop', severity: 'fine', title: 'it/s falls during the epoch', means: 'Normal: each iteration gets heavier as the work matures. In our runs one rig fell from 508 to 280 it/s in 30 minutes with no change in solutions.', fix: ['Judge by solutions per hour on the pool, not it/s.', 'nvidia-smi: 100% use at normal clocks is fine; clocks dropping at 85 C or more is heat; use under 50% means the CPU or the pool starves the cards.'] } },
  { id: 'slow-host', label: 'Slower than the same card elsewhere', finding: { id: 'slow-host', severity: 'check', title: 'The host may hold the cards back', means: 'Some hosts throttle every card: on host 24255 every server held its RTX 5070 Tis back in our epoch 229 runs. A narrow PCIe link, too few CPU threads or a host power limit do the same.', fix: ['Check the link: nvidia-smi -q | grep -A2 "Link Width". PCIe 4.0 x8 or 3.0 x16 per card.', 'Check the power limit: nvidia-smi -q -d POWER. Hosts cut RTX 5080s to 250 W and 5090s to 400 W.', 'Keep 12+ CPU threads per card. On a rental, move to another host and note this host ID to avoid.'] } },
  { id: 'pool-errors', label: 'Pool errors (502, 1006)', finding: { id: 'pool-errors', severity: 'fine', title: 'Pool-side errors', means: 'HTTP 502, websocket close 1006 and a refused connection to 127.0.0.1:8093 together are a pool outage; "retired-lease progress rejected" is routine. Not your rig.', fix: ['Leave the rig alone and do not restart.', 'Wait 5 to 15 minutes. After 20 to 30 minutes, check the pool status channel.', 'Solutions found during an outage may be lost.'] } },
  { id: 'dies-terminal', label: 'Stops when I close the terminal', finding: { id: 'dies-terminal', severity: 'check', title: 'The miner dies with the terminal', means: 'A miner started in a browser terminal stops when that terminal closes. On 6 Sep 2026 three of our four rigs stopped overnight this way.', fix: ['Start it detached with nohup and a log file, or as a systemd service (see the Linux procedures).', 'On a rental, watch the maximum rental time and extend well before it ends.'] } },
  { id: 'new-algo-zero', label: '0 shares after an algorithm change', finding: { id: 'new-algo-zero', severity: 'fine', title: '0 shares in the first days of a new algorithm', means: 'Both 0 and very high share counts are normal while a new algorithm settles: QLI said at least 3 days (29 Sep 2026). An old miner shows it/s for work that no longer counts.', fix: ['Check the miner prints the current version; if not, download it from the setup page.', 'Run at least 20 minutes, then check the pool status channel.', 'Judge by the wallet total after the epoch, not by the first day.'] } },
  { id: 'old-gpu', label: 'Old GPU stopped working', finding: { id: 'old-gpu', severity: 'check', title: 'The card may be too old for the current miner', means: 'From epoch 237 (28 Oct 2026) a GTX 1050 Ti CUDA worker exited every few seconds, and a Tesla K80 does not run on current CUDA. No fix confirmed and no workaround known by 4 Nov 2026. Treat GTX 10 series and older as unsupported until the pool says otherwise.', fix: ['Mine on the CPU meanwhile (backend AVX2, AVX512 or Auto).', 'Report the card, driver and log to the pool.', 'Ask the pool whether the card is still supported before buying or renting one.'] } },
  { id: 'paid-less', label: 'Paid for fewer shares than shown', finding: { id: 'paid-less', severity: 'check', title: 'The payout counts fewer shares than the dashboard showed', means: 'Pools weight shares by score instead of counting them equally (QLI, 6 Aug 2026), and in epoch 237 scores above 3125 counted for nothing (2 Nov 2026). Lower scores are better.', fix: ['Save your miner log and a dashboard screenshot before each epoch ends.', 'Ask the pool with the epoch, the worker name and that data.'] } },
  { id: 'payout-late', label: 'Payout has not arrived', finding: { id: 'payout-late', severity: 'check', title: 'The payout is not in the wallet yet', means: 'Pools calculate after the epoch and pay about a week later, in Sep to Nov 2026 sometimes up to about 10 days. A paid status can show before the wallet view does.', fix: ['Check the balance of your 60-letter address, not only the transaction list.', 'Check the pending payout and its date on the pool.', 'Still missing after that date: send the pool the epoch, worker name and a screenshot. Never the seed.'] } },
  { id: 'frozen', label: 'Shares frozen', finding: { id: 'frozen', severity: 'fine', title: 'Shares frozen, reseeding, miners locked', means: 'Almost always pool or backend lag around an epoch change.', fix: ['Wait.', 'Restart the miner once if you want to be sure.'] } },
  { id: 'behind', label: 'Dashboard is behind', finding: { id: 'behind', severity: 'fine', title: 'Dashboard shows "behind"', means: 'Display lag. The work is counted.', fix: ['Ignore it, or restart the miner once.'] } },
  { id: 'missing', label: 'Worker not on dashboard', finding: { id: 'missing', severity: 'check', title: 'A worker shows nothing', means: 'Usually two machines share one worker name.', fix: ['Give each machine its own name starting with QC.', 'Check the address on the setup page is yours, all 60 letters.'] } },
  { id: 'rejected', label: 'Many rejected', finding: { id: 'rejected', severity: 'check', title: 'Many rejected or expired candidates', means: 'A few rejects are normal; many are not. The most common cause after an algorithm change is an outdated client.', fix: ['Update the miner from the pool setup page and check the version it prints.', 'Make sure only one miner process runs.', 'Then check the pool status: it can be the pool side.', 'Last, the CPU: 12 or more threads per card, and a reliable host.'] } },
  { id: 'sleeps', label: 'Stops when I walk away', finding: { id: 'sleeps', severity: 'check', title: 'Mining stops when nobody uses the machine', means: 'Almost always sleep or hibernation.', fix: ['Windows: powercfg /change standby-timeout-ac 0 and powercfg /change hibernate-timeout-ac 0.', 'macOS: run it as caffeinate -dimsu ~/qubic-miner/run.sh, on the power adapter.', 'Linux: sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target'] } },
  { id: 'blocked', label: 'Antivirus or macOS blocks it', finding: { id: 'blocked', severity: 'check', title: 'The system blocks the miner', means: 'Windows Defender, SmartScreen or macOS Gatekeeper stopped a file it does not know.', fix: ['Only for the miner from the pool setup page.', 'Windows: exclude only the miner folder in Windows Security, then Restore it from Protection history.', 'macOS: System Settings, Privacy & Security, Open Anyway.'] } },
  { id: 'wont-start', label: "Miner won't start", finding: { id: 'wont-start', severity: 'check', title: 'The miner does not start', means: 'I need the log to tell which of the usual causes it is.', fix: ['Run it once in the foreground and paste the last 30 lines here.', 'Common causes: missing NVIDIA driver, wrong backend for the CPU, file not executable.'] } },
]
