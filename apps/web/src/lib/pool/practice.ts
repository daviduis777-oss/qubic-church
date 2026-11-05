/**
 * Practical knowledge for running a rig: per-OS procedures, checks and efficiency tips.
 * Every step carries a source with a date. The connect wizard, Maria's AI prompt and the Discord
 * Maria card (scripts/pool-card.mts) all read from here, so the three never disagree.
 *
 * The pool's own launch command is not public yet (TODO(Bob) in config.ts). Procedures never invent it:
 * they wrap MINER_COMMAND, "the command the pool setup page gives you", and stay correct for any command,
 * one line or several, with any quoting. Pure data and pure functions; no React, no network.
 */
import type { Os } from './config.ts'
import { POOL } from './config.ts'
import { SOURCES, type SourceId } from './knowledge.ts'

/** Date the procedures below were last checked against their sources. */
export const KNOWLEDGE_AS_OF = '2026-11-04'

/** Stands for the exact command the pool setup page gives. Replaced when POOL.launchLine is known. */
export const MINER_COMMAND = '<MINER_COMMAND>'

export type PracticeSourceId =
  | 'ubuntuNvidia'
  | 'cuda12'
  | 'nvidiaOpen'
  | 'rtx50'
  | 'nvidiaSmi'
  | 'persistence'
  | 'pugetPower'
  | 'systemdService'
  | 'systemdNetwork'
  | 'nohup'
  | 'journalctl'
  | 'pgrep'
  | 'localCheck'
  | 'nvidiaDrivers'
  | 'coreinfo'
  | 'defenderExclusion'
  | 'defenderHistory'
  | 'defenderPua'
  | 'smartscreen'
  | 'schtasks'
  | 'winPower'
  | 'powercfg'
  | 'caffeinate'
  | 'gatekeeper'
  | 'sequoia'
  | 'macSleep'
  | 'macTemp'
  | 'hiveCustom'
  | 'hiveShell'
  | 'qubicliHive'
  | 'clore'
  | 'vast'
  | 'octa'

export type Src = { label: string; url: string; date: string }

export const PRACTICE_SOURCES: Record<PracticeSourceId, Src> = {
  ubuntuNvidia: { label: 'Ubuntu Server docs, NVIDIA drivers installation', url: 'https://ubuntu.com/server/docs/how-to/graphics/install-nvidia-drivers/', date: 'updated 26 Jun 2026' },
  cuda12: { label: 'NVIDIA CUDA 12.0 release notes, minimum driver table', url: 'https://docs.nvidia.com/cuda/archive/12.0.0/cuda-toolkit-release-notes/index.html', date: 'checked 4 Nov 2026' },
  nvidiaOpen: { label: 'NVIDIA blog, transition to open GPU kernel modules', url: 'https://developer.nvidia.com/blog/nvidia-transitions-fully-towards-open-source-gpu-kernel-modules', date: '17 Jul 2024' },
  rtx50: { label: 'Atomic Object, RTX 50 drivers on Ubuntu', url: 'https://spin.atomicobject.com/nvidia-rtx-50-ubuntu/', date: '1 May 2025' },
  nvidiaSmi: { label: 'nvidia-smi(1) manual', url: 'https://man.archlinux.org/man/nvidia-smi.1.txt', date: 'checked 4 Nov 2026' },
  persistence: { label: 'NVIDIA driver docs, Persistence Mode', url: 'https://docs.nvidia.com/deploy/driver-persistence/persistence-mode-legacy.html', date: 'updated 4 Nov 2026' },
  pugetPower: { label: 'Puget Systems, RTX 3090 power limiting with systemd and nvidia-smi', url: 'https://www.pugetsystems.com/?p=8420', date: '24 Nov 2020' },
  systemdService: { label: 'systemd.service(5), Restart= and RestartSec=', url: 'https://github.com/systemd/systemd/blob/main/man/systemd.service.xml', date: 'systemd main, checked 4 Nov 2026' },
  systemdNetwork: { label: 'systemd docs, Running services after the network is up', url: 'https://github.com/systemd/systemd/blob/main/docs/NETWORK_ONLINE.md', date: 'systemd main, checked 4 Nov 2026' },
  nohup: { label: 'nohup(1), GNU coreutils 9.11', url: 'https://man7.org/linux/man-pages/man1/nohup.1.html', date: 'Apr 2026' },
  journalctl: { label: 'journalctl(1)', url: 'https://manpages.debian.org/buster/systemd/journalctl.1.en.html', date: 'checked 4 Nov 2026' },
  pgrep: { label: 'pgrep(1), procps-ng', url: 'https://www.mankier.com/1/pgrep', date: '29 Dec 2025' },
  localCheck: { label: 'Run and checked on Ubuntu 24.04 (util-linux 2.39.3, systemd 255)', url: '', date: '4 Nov 2026' },
  nvidiaDrivers: { label: 'NVIDIA GeForce drivers page and NVIDIA app', url: 'https://www.nvidia.com/en-us/geforce/drivers/', date: 'updated 29 Oct 2026' },
  coreinfo: { label: 'Microsoft Sysinternals, Coreinfo v4.02', url: 'https://learn.microsoft.com/sysinternals/downloads/coreinfo', date: '12 Aug 2026' },
  defenderExclusion: { label: 'Microsoft Support, add an exclusion to Windows Security', url: 'https://support.microsoft.com/help/4028485', date: '14 Jan 2026' },
  defenderHistory: { label: 'Microsoft Support, Protection history in Windows Security', url: 'https://support.microsoft.com/windows/protection-history-f1e5fd95-09b4-46d1-b8c7-1059a1e09708', date: '17 Mar 2026' },
  defenderPua: { label: 'Microsoft, how Microsoft identifies malware and potentially unwanted apps', url: 'https://learn.microsoft.com/en-us/defender-xdr/criteria', date: 'updated 10 Sep 2026' },
  smartscreen: { label: 'Microsoft Learn, SmartScreen reputation', url: 'https://learn.microsoft.com/windows/apps/package-and-deploy/smartscreen-reputation', date: 'updated 6 May 2026' },
  schtasks: { label: 'Microsoft Learn, schtasks create', url: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create', date: '10 Oct 2023' },
  winPower: { label: 'Microsoft Support, power and sleep settings', url: 'https://support.microsoft.com/en-us/windows/how-to-adjust-power-and-sleep-settings-26f623b5-4fcc-4194-863d-b824e5ea7679', date: '4 Jun 2026' },
  powercfg: { label: 'Microsoft Learn, powercfg options; Microsoft Q&A, timeout 0 disables sleep', url: 'https://learn.microsoft.com/en-us/answers/questions/264345/what-does-powercfg-change-standby-timeout-ac-0-do', date: '21 Aug 2024' },
  caffeinate: { label: 'caffeinate(8) manual', url: 'https://www.sudo.is/docs/macos/man_caffeinate.html', date: 'checked 4 Nov 2026' },
  gatekeeper: { label: 'Apple, open a Mac app from an unknown developer', url: 'https://support.apple.com/en-gb/guide/mac-help/mh40616/', date: 'checked 4 Nov 2026' },
  sequoia: { label: 'AppleInsider, Control-click Gatekeeper bypass removed in macOS Sequoia', url: 'https://appleinsider.com/articles/24/08/06/apple-removes-control-click-option-for-skipping-gatekeeper-in-macos-sequoia', date: '6 Aug 2024' },
  macSleep: { label: 'Apple, prevent your Mac from sleeping', url: 'https://support.apple.com/guide/mac-help/prevent-your-mac-from-sleeping-mchle41a6ccd/mac', date: 'checked 4 Nov 2026' },
  macTemp: { label: 'Apple, Mac laptop operating temperatures', url: 'https://support.apple.com/102336', date: '2 Apr 2026' },
  hiveCustom: { label: 'Hiveon, adding a custom miner to a flight sheet', url: 'https://intercom.help/hiveon/en/articles/6656886-adding-a-custom-miner', date: '14 Jun 2024' },
  hiveShell: { label: 'Hive OS Linux guide, shell commands', url: 'https://hiveon.com/knowledge-base/guides/linux/', date: 'checked 4 Nov 2026' },
  qubicliHive: { label: 'qubic.li HiveOS package (reference for how a Qubic miner is packaged, not our pool)', url: 'https://github.com/qubic-li/hiveos', date: 'v3.13.0, checked 4 Nov 2026' },
  clore: { label: 'Clore.ai FAQ', url: 'https://docs.clore.ai/help/faq', date: 'checked 4 Nov 2026' },
  vast: { label: 'Vast.ai docs, template settings', url: 'https://docs.vast.ai/guides/templates/template-settings', date: 'checked 4 Nov 2026' },
  octa: { label: 'OctaSpace docs, CPU/GPU rental', url: 'https://docs.octa.space/cpugpu-rental', date: 'checked 4 Nov 2026' },
}

export type AnySource = SourceId | PracticeSourceId

export const sourceOf = (id: AnySource): Src => (id in PRACTICE_SOURCES ? PRACTICE_SOURCES[id as PracticeSourceId] : SOURCES[id as SourceId])
export const practiceSourceLine = (ids: AnySource[]) => [...new Set(ids)].map(id => `${sourceOf(id).label} (${sourceOf(id).date})`).join('; ')

/** extra: a nice-to-have step the wizard shows but the brief (AI prompt) text leaves out, to keep the prompt short. */
export type PStep = { title: string; body?: string; command?: string; sources: AnySource[]; extra?: boolean }
export type PCheck = { title: string; command?: string; body?: string }
export type ProcedureId = 'linux-nvidia' | 'linux-cpu' | 'linux-run' | 'linux-systemd' | 'linux-nohup' | 'gpu-power' | 'windows' | 'macos' | 'hiveos' | 'rental'
export type Procedure = { id: ProcedureId; title: string; summary: string; steps: PStep[]; checks: PCheck[] }

/* ---------- shared pieces ---------- */

export const ONLY_OFFICIAL = 'Only for the miner you downloaded from the pool setup page. Never for a file from a chat, a video or a "faster" fork.'

/** The start script. The quoted 'EOF' keeps the pasted command byte for byte; the pid file lets one command stop it. */
export const runScript = (dir: string) =>
  [`mkdir -p ${dir}`, `cat > ${dir}/run.sh <<'EOF'`, '#!/usr/bin/env bash', 'cd "$(dirname "$0")" || exit 1', 'echo $$ > miner.pid', MINER_COMMAND, 'EOF', `chmod +x ${dir}/run.sh`].join('\n')

export const detachCommand = (dir: string) => `setsid -f nohup ${dir}/run.sh > ${dir}/miner.log 2>&1 < /dev/null`
export const stopCommand = (dir: string) => `kill -- -"$(cat ${dir}/miner.pid)"`

export const SYSTEMD_UNIT = [
  '[Unit]',
  `Description=Qubic miner (${POOL.name})`,
  'Wants=network-online.target',
  'After=network-online.target',
  '',
  '[Service]',
  'Type=simple',
  'User=qubic',
  'WorkingDirectory=/opt/qubic-miner',
  'ExecStart=/opt/qubic-miner/run.sh',
  'Restart=always',
  'RestartSec=10',
  '',
  '[Install]',
  'WantedBy=multi-user.target',
].join('\n')

export const POWER_UNIT = [
  '[Unit]',
  'Description=NVIDIA persistence mode and power limit',
  'After=systemd-modules-load.service',
  'Before=qubic-miner.service',
  '',
  '[Service]',
  'Type=oneshot',
  'ExecStart=/usr/bin/nvidia-smi -pm 1',
  'ExecStart=/usr/bin/nvidia-smi -pl <WATTS>',
  '',
  '[Install]',
  'WantedBy=multi-user.target',
].join('\n')

const writeUnit = (name: string, unit: string) => `sudo tee /etc/systemd/system/${name}.service > /dev/null <<'EOF'\n${unit}\nEOF`

const CPU_CHECK: PStep[] = [
  { title: 'Check for AVX-512', command: "lscpu | grep -o 'avx512[a-z]*' | sort -u", body: 'avx512f in the output means AVX-512: choose the AVX512 backend. Nothing printed means no AVX-512: choose AVX2, or Auto if unsure.', sources: ['localCheck', 'academy'] },
  { title: 'Count the threads', command: 'nproc', body: 'Enter this number as Threads on a dedicated machine. Keep at least 8 CPU cores per GPU.', sources: ['localCheck', 'guide'] },
  { title: 'Check the memory', command: 'free -h', body: 'The total column: 16 GB minimum, 32 GB or more recommended.', sources: ['localCheck', 'academy'] },
]

/* ---------- procedures ---------- */

export const PROCEDURES: Record<ProcedureId, Procedure> = {
  'linux-nvidia': {
    id: 'linux-nvidia',
    title: 'NVIDIA driver on Ubuntu 22.04 / 24.04 (your own machine)',
    summary: 'Own machine only: install a driver that supports CUDA 12 with ubuntu-drivers, then check it with nvidia-smi. On a rented container never install drivers or reboot: pick an image with CUDA instead.',
    steps: [
      { title: 'Update and reboot', command: 'sudo apt update && sudo apt upgrade -y && sudo reboot', sources: ['ubuntuNvidia'] },
      { title: 'See which drivers fit the card', command: 'sudo ubuntu-drivers list', body: 'On a headless server use sudo ubuntu-drivers list --gpgpu for the -server branches.', sources: ['ubuntuNvidia'] },
      { title: 'Install the recommended driver and reboot', command: 'sudo ubuntu-drivers install && sudo reboot', body: 'ubuntu-drivers installs signed drivers, so Secure Boot keeps working. CUDA 12 needs driver 525.60.13 or newer; any current branch has that. RTX 50 cards need a 570 or newer branch with the open kernel modules (package names end in -open).', sources: ['ubuntuNvidia', 'cuda12', 'nvidiaOpen', 'rtx50'] },
      { title: 'Check the card', command: 'nvidia-smi', body: 'It must list every card and a driver version. "No devices were found": check lsmod | grep nouveau and follow the Ubuntu guide to blocklist nouveau.', sources: ['ubuntuNvidia', 'nvidiaSmi'] },
      { title: 'Optional: keep the GPU initialized', command: 'sudo nvidia-smi -pm 1', body: 'Persistence mode keeps the driver loaded between runs. It resets at reboot; NVIDIA marks it legacy in favour of the nvidia-persistenced daemon.', sources: ['nvidiaSmi', 'persistence'], extra: true },
    ],
    checks: [{ title: 'nvidia-smi lists the card and the driver', command: 'nvidia-smi' }],
  },
  'linux-cpu': {
    id: 'linux-cpu',
    title: 'Check the CPU and memory on Linux',
    summary: 'Three commands tell you the backend, the thread count and whether the RAM is enough.',
    steps: CPU_CHECK,
    checks: [],
  },
  'linux-run': {
    id: 'linux-run',
    title: 'Save the start command on Linux',
    summary: 'Put the miner in its own folder and save the pool command in run.sh, so every way of running it uses the same line.',
    steps: [
      { title: 'Download the miner into its own folder', command: 'mkdir -p ~/qubic-miner && cd ~/qubic-miner', body: 'Take the download from the pool setup page and unpack it here. Nothing from other sites.', sources: ['guide'] },
      { title: 'Save the pool command in run.sh', command: runScript('~/qubic-miner'), body: `Paste the command the pool setup page gives you in place of ${MINER_COMMAND}, on its own line or lines. The quoted 'EOF' keeps it exactly as pasted. It must run without asking questions.`, sources: ['localCheck'] },
      { title: 'Test it in the foreground', command: '~/qubic-miner/run.sh', body: 'Wait for an it/s line, then stop it with Ctrl+C. If it fails, paste the output into Fix my rig.', sources: ['guide'] },
    ],
    checks: [],
  },
  'linux-systemd': {
    id: 'linux-systemd',
    title: 'Run it as a systemd service (starts at boot, restarts on crash)',
    summary: 'A dedicated user, a unit with Restart=always after network-online.target, and the log in journalctl.',
    steps: [
      { title: 'Create a dedicated user', command: 'sudo useradd --system --create-home --home-dir /opt/qubic-miner --shell /usr/sbin/nologin qubic', body: 'The miner runs as this user, not as root.', sources: ['systemdService'] },
      { title: 'Move the miner folder to it', command: 'sudo cp -r ~/qubic-miner/. /opt/qubic-miner/ && sudo chown -R qubic:qubic /opt/qubic-miner', body: 'If the pool command has a path into your home folder, change it to /opt/qubic-miner in /opt/qubic-miner/run.sh.', sources: ['localCheck'] },
      { title: 'Test as that user', command: 'sudo -u qubic /opt/qubic-miner/run.sh', body: 'Wait for an it/s line, then Ctrl+C. This catches permission problems before the service hides them.', sources: ['localCheck'] },
      { title: 'Write the service unit', command: writeUnit('qubic-miner', SYSTEMD_UNIT), body: 'Restart=always restarts it whenever it exits; RestartSec=10 waits 10 seconds first (the default is 100 ms). Wants= plus After=network-online.target starts it once the network is up.', sources: ['systemdService', 'systemdNetwork', 'localCheck'] },
      { title: 'Enable and start it', command: 'sudo systemctl daemon-reload && sudo systemctl enable --now qubic-miner', body: 'enable makes it start at every boot; --now starts it right away. Stop any nohup copy first: one miner per machine.', sources: ['systemdService', 'guide'] },
    ],
    checks: [
      { title: 'The service is active (running)', command: 'systemctl status qubic-miner --no-pager' },
      { title: 'The log shows an it/s line', command: 'journalctl -u qubic-miner -f', body: 'Ctrl+C leaves the log, the miner keeps running. The last 50 lines: journalctl -u qubic-miner -n 50 --no-pager' },
      { title: 'It starts at boot', command: 'systemctl is-enabled qubic-miner', body: 'Prints enabled. Reboot once and check the status again.' },
      { title: 'Stop or remove it', command: 'sudo systemctl disable --now qubic-miner', body: 'Stops the service and its miner, and turns off the autostart.' },
    ],
  },
  'linux-nohup': {
    id: 'linux-nohup',
    title: 'Run it detached with nohup (quick, no autostart)',
    summary: 'Keeps mining after you close the terminal or the SSH session. It does not come back after a reboot: use the systemd service for that.',
    steps: [
      { title: 'Start it detached', command: detachCommand('~/qubic-miner'), body: 'setsid and nohup keep it running after the terminal closes. Output goes to miner.log.', sources: ['nohup', 'localCheck'] },
      { title: 'Stop it', command: stopCommand('~/qubic-miner'), body: 'Stops run.sh and the miner it started, using the pid run.sh saved.', sources: ['localCheck'] },
    ],
    checks: [
      { title: 'The log shows an it/s line', command: 'tail -f ~/qubic-miner/miner.log', body: 'Ctrl+C stops tail, not the miner.' },
      { title: 'Exactly one copy is running', command: 'pgrep -fa qubic-miner/run.sh', body: 'One line. Two lines means you started it twice: stop it and start once.' },
    ],
  },
  'gpu-power': {
    id: 'gpu-power',
    title: 'Power limit for efficiency (NVIDIA, Linux)',
    summary: 'General GPU advice, not measured on Qubic: a lower power limit often keeps most of the throughput for less power and heat.',
    steps: [
      { title: 'See the allowed range', command: 'nvidia-smi -q -d POWER', body: 'Shows the current, default, minimum and maximum power limit of each card, in watts.', sources: ['nvidiaSmi'] },
      { title: 'Set a lower limit', command: 'sudo nvidia-smi -pl <WATTS>', body: 'Watts, between the minimum and maximum. Add -i 0 for one card only. No tested offset exists for Qubic: pick a lower value inside that range and judge it by solutions per hour. Lower power is the safe direction: do not raise clocks or voltage.', sources: ['nvidiaSmi'] },
      { title: 'Measure solutions, not it/s', body: 'Keep each setting for several hours (est.) and compare solutions per hour. Keep the lowest limit that does not cost solutions. As a general example, Puget Systems kept about 95% of ML training performance with RTX 3090 cards limited from 350 W to 280 W (24 Nov 2020).', sources: ['pugetPower', 'guide'] },
      { title: 'Re-apply it at every boot', command: `${writeUnit('gpu-power-limit', POWER_UNIT)}\nsudo systemctl daemon-reload && sudo systemctl enable --now gpu-power-limit`, body: 'Put your watts in place of <WATTS>. Persistence mode resets at reboot, so a small boot service sets both before the miner starts.', sources: ['nvidiaSmi', 'pugetPower', 'localCheck'] },
    ],
    checks: [
      { title: 'Why the clocks are held', command: 'nvidia-smi -q -d PERFORMANCE', body: 'SW Power Cap: Active is expected at a limit you set. HW Slowdown or Thermal Slowdown: Active means heat or power trouble: improve the cooling.' },
    ],
  },
  windows: {
    id: 'windows',
    title: 'Windows: driver, antivirus, autostart, no sleep',
    summary: 'NVIDIA driver, AVX-512 check, one excluded folder for the official miner, a Task Scheduler autostart and sleep turned off.',
    steps: [
      { title: 'NVIDIA cards: install the current driver', body: 'From nvidia.com/drivers or the NVIDIA app. CUDA 12 needs 527.41 or newer on Windows; Game Ready and Studio drivers both work. Check in Command Prompt with nvidia-smi.', command: 'nvidia-smi', sources: ['nvidiaDrivers', 'cuda12', 'nvidiaSmi'] },
      { title: 'Check for AVX-512', command: 'Coreinfo64.exe -accepteula -f | findstr /i "AVX-512"', body: 'Coreinfo is from Microsoft Sysinternals. A * after AVX-512-F means supported, a - means not: then choose AVX2 or Auto. Or look up the CPU on the AMD or Intel product page.', sources: ['coreinfo'] },
      { title: 'Count the threads', command: 'echo %NUMBER_OF_PROCESSORS%', sources: ['guide'] },
      { title: 'Make one folder for the miner', command: 'mkdir C:\\QubicMiner', body: 'Download the miner from the pool setup page into this folder only.', sources: ['guide'] },
      { title: 'If Defender removes or blocks the miner', body: `Microsoft lists cryptomining software as a potentially unwanted app category, so miners are often flagged. ${ONLY_OFFICIAL} Open Windows Security, Virus & threat protection, Manage settings, Exclusions, Add or remove exclusions, add a Folder: C:\\QubicMiner. Exclude only that folder, never a whole drive or Downloads. Then in Protection history open the item, Actions, Restore (or Allow on device).`, sources: ['defenderPua', 'defenderExclusion', 'defenderHistory'] },
      { title: 'If SmartScreen says "Windows protected your PC"', body: `It warns about files without reputation. ${ONLY_OFFICIAL} Choose More info, then Run anyway.`, sources: ['smartscreen'] },
      { title: 'Save the pool command in run-miner.bat', command: `cd /d C:\\QubicMiner\n${MINER_COMMAND}`, body: `In Notepad, paste these two lines with the command the pool setup page gives in place of ${MINER_COMMAND}, and save as C:\\QubicMiner\\run-miner.bat (Save as type: All files). Double-click it once and wait for an it/s line. If the setup page gives a PowerShell command, save it as run-miner.ps1 instead and use powershell -NoProfile -ExecutionPolicy Bypass -File C:\\QubicMiner\\run-miner.ps1 below.`, sources: ['guide'] },
      { title: 'Start it at logon with Task Scheduler', command: 'schtasks /create /tn "Qubic Miner" /tr "C:\\QubicMiner\\run-miner.bat" /sc onlogon /delay 0001:00 /rl HIGHEST /f', body: 'Run in Command Prompt as administrator. The miner window opens one minute after you log in. For a box nobody logs in to, /sc onstart /ru SYSTEM starts it at boot, hidden, with no window: check in Task Manager that it mines before you rely on it. Remove with schtasks /delete /tn "Qubic Miner" /f', sources: ['schtasks'] },
      { title: 'Keep the PC awake', command: 'powercfg /change standby-timeout-ac 0\npowercfg /change hibernate-timeout-ac 0', body: 'Or Settings, System, Power & battery, Screen, sleep & hibernate timeouts: sleep Never when plugged in. 0 turns the timeout off. The screen may still turn off; that is fine.', sources: ['winPower', 'powercfg'] },
    ],
    checks: [
      { title: 'The miner window shows an it/s line' },
      { title: 'The task is there', command: 'schtasks /query /tn "Qubic Miner"', body: 'After a reboot and logon the miner starts by itself.' },
      { title: 'Nothing new in Protection history', body: 'Windows Security, Protection history. Events stay there for two weeks.' },
    ],
  },
  macos: {
    id: 'macos',
    title: 'macOS on Apple Silicon: CPU mining, awake and cool',
    summary: 'Open the official miner past Gatekeeper, run it under caffeinate so the Mac stays awake, keep a MacBook plugged in and cool.',
    steps: [
      { title: 'Download the miner into its own folder', command: 'mkdir -p ~/qubic-miner && cd ~/qubic-miner', body: 'Apple Silicon mines on the CPU. Take the macOS download from the pool setup page and unpack it here.', sources: ['partner', 'guide'] },
      { title: 'If macOS says the developer cannot be verified', body: `${ONLY_OFFICIAL} Try to open it once, then System Settings, Privacy & Security, scroll to Security, Open Anyway, and enter your password. The button stays for about an hour after the attempt. Control-click, Open only works before macOS 15 Sequoia.`, sources: ['gatekeeper', 'sequoia'] },
      { title: 'Save the pool command in run.sh', command: runScript('~/qubic-miner'), body: `Paste the command the pool setup page gives in place of ${MINER_COMMAND}.`, sources: ['localCheck'] },
      { title: 'Count the threads', command: 'sysctl -n hw.logicalcpu', sources: ['guide'] },
      { title: 'Run it awake', command: 'caffeinate -dimsu ~/qubic-miner/run.sh', body: 'caffeinate holds the Mac awake for as long as the miner runs. Leave the Terminal window open; Ctrl+C stops both. The system-sleep part (-s) only holds on the power adapter, so keep a MacBook plugged in.', sources: ['caffeinate'] },
      { title: 'Or turn off sleep in Settings', body: 'Desktop Mac: System Settings, Energy, Prevent automatic sleeping when the display is off. MacBook: System Settings, Battery, Options, Prevent automatic sleeping on power adapter when the display is off.', sources: ['macSleep'], extra: true },
      { title: 'Keep a MacBook cool', body: 'Use it on a firm, level surface with free airflow, never on a bed or a cushion, in a room between 10 and 35 °C. A fanless MacBook Air gets hot under constant load: leave two threads free.', sources: ['macTemp', 'guide'], extra: true },
    ],
    checks: [
      { title: 'Terminal shows an it/s line' },
      { title: 'Activity Monitor shows the miner using the CPU', body: 'And the Mac is still awake after 30 minutes away (est.).' },
    ],
  },
  hiveos: {
    id: 'hiveos',
    title: 'HiveOS: a custom miner in a flight sheet',
    summary: 'Add the pool HiveOS package as a Custom miner, apply the flight sheet to one rig, read the log in the Hive shell.',
    steps: [
      { title: 'Add your wallet', body: 'Wallets, Add wallet: your 60-letter uppercase address. Never the seed.', sources: ['hiveCustom'] },
      { title: 'Start a flight sheet with a Custom miner', body: 'Flight Sheets, new: Coin as the pool setup page says, Wallet the one above, Pool: Configure in miner, Miner: Custom, then Setup Miner Config.', sources: ['hiveCustom'] },
      { title: 'Fill the Custom miner fields from the pool setup page', body: 'Installation URL: the HiveOS package link from the pool setup page (Miner name fills itself from it). Hash algorithm, Wallet and worker template, Pool URL and Extra config arguments: exactly as the setup page shows, with backend and threads. The qubic.li Qubic package, as a reference for how Qubic miners are packaged, leaves Hash algorithm as ---- and puts settings in Extra config arguments.', sources: ['hiveCustom', 'qubicliHive'] },
      { title: 'Use a QC. worker name', body: `If the template uses %WORKER_NAME%, HiveOS fills in the rig name: rename the rig to its ${POOL.workerPrefix} name, or type the ${POOL.workerPrefix} name into the template.`, sources: ['hiveCustom', 'guide'] },
      { title: 'Apply it to this rig only', body: 'Apply Changes, Create Flight Sheet, then apply it to one rig, so every worker name stays unique.', sources: ['hiveCustom', 'guide'] },
    ],
    checks: [
      { title: 'The miner screen shows an it/s line', command: 'miner', body: 'In the Hive shell. Leave it with Ctrl+A, then D; the miner keeps running.' },
      { title: 'Read the log', command: 'miner log', body: 'The qubic.li package writes to /var/log/miner/custom/custom.log, so tail -n 50 /var/log/miner/custom/custom.log works for packages built the same way.' },
      { title: 'The cards are seen', command: 'nvidia-info' },
    ],
  },
  rental: {
    id: 'rental',
    title: 'A rented box (Clore.ai, Vast.ai, OctaSpace)',
    summary: 'Pick a box that passes the checks, a CUDA image, SSH or web terminal, and an on-start command that wraps the pool command.',
    steps: [
      { title: 'Deposit small, test one box for an hour', body: 'Scale only after one box mines cleanly. Never type a card number or the seed into a rental site.', sources: ['guide'] },
      { title: 'Check before you rent', body: 'CPU model with AVX-512, at least 8 CPU cores per GPU, PCIe x8 or better per card, 99% or better reliability, 16 GB RAM or more, and a region that can reach the pool (Worker package download failed means try another country).', sources: ['guide', 'academy'] },
      { title: 'Choose the image and the access', body: 'An Ubuntu image with CUDA 12 or newer that matches the host driver (12.4 or newer for RTX 50 / Blackwell cards: the Clore filter needed it on 6 Sep 2026): Clore offers official CUDA images, Vast has an [Automatic] tag that matches the host CUDA. Never install drivers or reboot inside the container: if nvidia-smi is missing, change the image or the box. Connect over SSH with your public key (OctaSpace: Dashboard, Service sessions), or the web terminal where offered. Clore spot rentals are cheaper but can be outbid; on-demand cannot.', sources: ['clore', 'vast', 'octa', 'field-e229'] },
      { title: 'Paste this as the on-start command', command: `${runScript('/root/qubic-miner')}\n${detachCommand('/root/qubic-miner')}`, body: `Clore runs it after the container starts; on Vast it is the On-start script, in the SSH or Jupyter launch mode. Put every line the setup page gives, download included, in place of ${MINER_COMMAND}: the container can start fresh.`, sources: ['clore', 'vast', 'localCheck'] },
      { title: 'Give each box its own worker name', body: `${POOL.workerPrefix}5070ti-a, ${POOL.workerPrefix}5070ti-b and so on.`, sources: ['guide'] },
    ],
    checks: [
      { title: 'The log shows an it/s line', command: 'tail -f /root/qubic-miner/miner.log' },
      { title: 'The cards are busy', command: 'nvidia-smi' },
      { title: 'The CPU has AVX-512 and enough cores', command: "lscpu | grep -o 'avx512[a-z]*' | sort -u; nproc; nvidia-smi -L", body: 'nproc divided by the number of cards nvidia-smi -L lists: 8 or more.' },
      { title: 'Stop it', command: stopCommand('/root/qubic-miner') },
    ],
  },
}

/* ---------- efficiency tips ---------- */

export type Tip = { title: string; text: string; general?: boolean; sources: AnySource[] }

export const TIPS: Tip[] = [
  { title: 'One miner per machine', text: 'Two copies fight over the same CPU and cards. Check with pgrep, systemctl status or Task Manager.', sources: ['guide'] },
  { title: 'Unique worker names', text: `Every machine its own ${POOL.workerPrefix} name, or the dashboard blurs them and one looks dead.`, sources: ['guide'] },
  { title: '8+ CPU cores per GPU', text: 'The CPU feeds the cards: at least 12 threads per card in our epoch 233 runs (predates the E235/E236 changes).', sources: ['guide', 'field-e233'] },
  { title: 'Lower the power limit, then measure', text: 'General GPU advice, not measured on Qubic: a lower power limit often keeps most of the throughput. Step down, run each step for hours, keep the lowest limit that keeps solutions per hour.', general: true, sources: ['nvidiaSmi', 'pugetPower'] },
  { title: 'Cool before you push', text: 'Clean fans and free airflow first. HW Slowdown or Thermal Slowdown in nvidia-smi -q -d PERFORMANCE means heat or power trouble.', general: true, sources: ['nvidiaSmi', 'macTemp'] },
  { title: 'No sleep, no surprise reboots', text: 'Turn sleep off (powercfg, caffeinate, Energy settings) and use an autostart (systemd, Task Scheduler) so a reboot does not end mining.', sources: ['winPower', 'caffeinate', 'systemdService'] },
  { title: 'Judge by cost per solution', text: 'it/s is speed, not pay. After one full epoch: cost per solution = daily cost ÷ solutions per day.', sources: ['guide'] },
  { title: 'Check the version after every algorithm change', text: 'Read the version the miner prints after each change; AutoUpdate failed for some workers on 2 to 4 Nov 2026. An old miner keeps showing it/s for work that no longer counts.', sources: ['qli-team'] },
  { title: 'Keep your own record', text: 'Before each epoch ends, save the miner log and a screenshot of the pool dashboard. Payout disputes on 2 Nov 2026 had no data behind them.', sources: ['community'] },
]

/* ---------- selection ---------- */

export type Where = 'own' | 'rental'
export type ProcedureInput = { os: Os; hw: 'cpu' | 'nvidia' | 'amd' | 'apple'; where?: Where; dedicated?: boolean }

/** Which procedures apply, in order. A rental is always a Linux container. */
export function proceduresFor(i: ProcedureInput): Procedure[] {
  const ids: ProcedureId[] = []
  if (i.where === 'rental') ids.push('rental')
  else if (i.os === 'linux') {
    if (i.hw === 'nvidia') ids.push('linux-nvidia')
    ids.push('linux-cpu', 'linux-run', i.dedicated === false ? 'linux-nohup' : 'linux-systemd')
    if (i.hw === 'nvidia') ids.push('gpu-power')
  } else if (i.os === 'windows') ids.push('windows')
  else if (i.os === 'macos') ids.push('macos')
  else ids.push('hiveos')
  return ids.map(id => PROCEDURES[id])
}

/** Put the real pool command in place of MINER_COMMAND once it is known. */
export function withCommand(text: string, command?: string | null): string {
  return command ? text.split(MINER_COMMAND).join(command) : text
}

/** Compact text form for Maria's AI prompt and the Discord card. `brief` drops the summary line (the prompt). */
export function procedureText(p: Procedure, opts: { sources?: boolean; brief?: boolean } = {}): string {
  const steps = p.steps.filter(s => !(opts.brief && s.extra)).map((s, n) => {
    const head = `${n + 1}. ${s.title}.${s.body ? ` ${s.body}` : ''}${opts.sources ? ` [${practiceSourceLine(s.sources)}]` : ''}`
    return s.command ? `${head}\n${s.command.split('\n').map(l => `    ${l}`).join('\n')}` : head
  })
  const checks = p.checks.map(c => `- Check: ${c.title}${c.command ? `: ${c.command}` : ''}${c.body ? `. ${c.body}` : ''}`)
  return [opts.brief ? `${p.title}.` : `${p.title}. ${p.summary}`, ...steps, ...checks].join('\n')
}

export const procedureSources = (p: Procedure): AnySource[] => [...new Set(p.steps.flatMap(s => s.sources))]
