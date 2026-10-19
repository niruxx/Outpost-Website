/*
 * Live demo: a simulated Outpost panel that runs entirely in the browser. Nothing is installed or
 * sent anywhere — instances, logs, metrics and players are generated here. It reuses the page's
 * `ui-*` hooks, so whichever theme is picked restyles the demo too.
 */
(function () {
  'use strict';

  var root = document.getElementById('demo-root');
  if (!root) return;
  var main = root.querySelector('[data-demo-main]');
  var modalHost = root.querySelector('[data-demo-modal]');
  var toastHost = root.querySelector('[data-demo-toasts]');

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function clock(ms) {
    return new Date(ms || Date.now()).toTimeString().slice(0, 8);
  }
  function fmtMem(mb) {
    return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : Math.round(mb) + ' MB';
  }
  function fmtUptime(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    if (h >= 24) return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
    if (h) return h + 'h ' + m + 'm';
    return m + 'm ' + (s % 60) + 's';
  }
  function fmtDate(ms) {
    var d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + d.toTimeString().slice(0, 5);
  }

  /* ---------- What can be created ---------- */
  var TEMPLATES = {
    paper: { label: 'Paper', desc: 'Minecraft Java with plugins', group: 'game', emoji: '⛏️', sub: 'Paper 1.21', port: '25565/tcp', flavor: 'minecraft', install: 'jar', jar: 'paper-1.21.jar', e: ['#1f3d1a', '#14240f'], mem: [1700, 2600], cpu: [6, 28] },
    vanilla: { label: 'Vanilla', desc: 'Minecraft Java, data packs', group: 'game', emoji: '⛏️', sub: 'Vanilla 1.21', port: '25565/tcp', flavor: 'minecraft', install: 'jar', jar: 'server.jar', e: ['#2b4a1f', '#162a10'], mem: [1400, 2200], cpu: [5, 24] },
    bedrock: { label: 'Bedrock', desc: 'Minecraft Bedrock Edition', group: 'game', emoji: '🪨', sub: 'Minecraft Bedrock', port: '19132/udp', flavor: 'bedrock', install: 'zip', e: ['#3a3f45', '#1d2024'], mem: [500, 900], cpu: [3, 14] },
    valheim: { label: 'Valheim', desc: 'Steam · BepInEx mods', group: 'game', emoji: '🪖', sub: 'Valheim', port: '2456/udp', flavor: 'valheim', install: 'steam', app: 896660, e: ['#3a2d1a', '#21190f'], mem: [2600, 3400], cpu: [10, 32] },
    palworld: { label: 'Palworld', desc: 'Steam · .pak mods', group: 'game', emoji: '🐾', sub: 'Palworld', port: '8211/udp', flavor: 'palworld', install: 'steam', app: 2394010, e: ['#173a4a', '#0f2330'], mem: [4800, 7200], cpu: [14, 40] },
    vrising: { label: 'V Rising', desc: 'Windows-only · runs with Wine', group: 'game', emoji: '🧛', sub: 'V Rising · Wine', port: '9876/udp', flavor: 'wine', install: 'steam', windows: true, app: 1829350, exe: 'VRisingServer.exe', e: ['#4a1d24', '#2b0f14'], mem: [2400, 3600], cpu: [8, 26] },
    terraria: { label: 'Terraria', desc: 'Vanilla dedicated server', group: 'game', emoji: '🌳', sub: 'Terraria', port: '7777/tcp', flavor: 'terraria', install: 'zip', e: ['#24461f', '#132810'], mem: [400, 800], cpu: [3, 12] },
    jellyfin: { label: 'Jellyfin', desc: 'Media streaming', group: 'app', emoji: '🎞️', sub: 'Catalog app', port: '8096/tcp', flavor: 'app', image: 'jellyfin/jellyfin:latest', ready: '[INF] Startup complete 0:00:03.41', web: true, e: ['#2a1d4a', '#140f2b'], mem: [380, 620], cpu: [1, 9] },
    kuma: { label: 'Uptime Kuma', desc: 'Uptime monitoring', group: 'app', emoji: '📈', sub: 'Catalog app', port: '3001/tcp', flavor: 'app', image: 'louislam/uptime-kuma:1', ready: 'Listening on 3001', web: true, e: ['#1d3a2e', '#0f2219'], mem: [90, 140], cpu: [0.5, 3] },
    vaultwarden: { label: 'Vaultwarden', desc: 'Bitwarden-compatible passwords', group: 'app', emoji: '🔐', sub: 'Catalog app', port: '8080/tcp', flavor: 'app', image: 'vaultwarden/server:latest', ready: 'Rocket has launched from http://0.0.0.0:80', web: true, e: ['#1d2f4a', '#0f1a2b'], mem: [30, 60], cpu: [0.2, 2] },
    postgres: { label: 'PostgreSQL', desc: 'Database', group: 'app', emoji: '🐘', sub: 'Catalog app', port: '5432/tcp', flavor: 'app', image: 'postgres:16', ready: 'database system is ready to accept connections', e: ['#1d2f4a', '#101c2e'], mem: [60, 140], cpu: [0.5, 5] },
    portainer: { label: 'Portainer', desc: 'Container management UI', group: 'app', emoji: '🧭', sub: 'Platform tool', port: '9443/tcp', flavor: 'app', image: 'portainer/portainer-ce:lts', ready: 'starting HTTPS server', web: true, e: ['#173a4a', '#0d2230'], mem: [40, 80], cpu: [0.3, 3] },
  };

  var KINDS = [
    { id: 'game', emoji: '🎮', label: 'Game server', desc: 'Minecraft or Steam, installed and updated for you' },
    { id: 'app', emoji: '📦', label: 'App from the catalog', desc: 'Web apps, databases, Portainer…' },
    { id: 'container', emoji: '🐳', label: 'Docker container', desc: 'Any image from any registry' },
    { id: 'custom', emoji: '⌨️', label: 'Custom process', desc: 'Your own binary or shell script' },
  ];

  var PLAYER_POOL = ['Steve', 'Alex', 'Zuri', 'Kai', 'Noor', 'Sunny', 'Efe', 'Makena', 'Ari'];
  var CHAT = ['anyone got spare iron?', 'brb', 'the creeper got me again', 'who built the giant duck', 'gg', 'base tour at spawn in 5', 'found diamonds!!'];

  /* ---------- State ---------- */
  var state, nextId, timers;

  function newInstance(t, name, extra) {
    var inst = {
      id: nextId++,
      name: name,
      t: t,
      status: 'stopped',
      players: [],
      ops: [],
      log: [],
      cpu: 0,
      mem: 0,
      net: 0,
      cpuHist: [],
      memHist: [],
      startedAt: 0,
      autoRestart: true,
      attempts: 0,
      snapshots: [],
      cmdHist: [],
      busySnap: false,
    };
    for (var k in extra) inst[k] = extra[k];
    return inst;
  }

  function seedHistory(inst) {
    for (var i = 0; i < 40; i++) {
      inst.cpuHist.push(rand(inst.t.cpu[0], inst.t.cpu[1]));
      inst.memHist.push(rand(inst.t.mem[0], inst.t.mem[1]));
    }
    inst.cpu = inst.cpuHist[39];
    inst.mem = inst.memHist[39];
    inst.net = rand(20, 400);
  }

  function init() {
    if (timers) timers.forEach(clearTimeout);
    timers = [];
    nextId = 1;
    var now = Date.now();
    var smp = newInstance(TEMPLATES.paper, 'Survival SMP', {
      status: 'running',
      startedAt: now - (3 * 3600 + 12 * 60) * 1000,
      players: ['Steve', 'Alex', 'Zuri'],
      ops: ['Steve'],
      snapshots: [
        { label: 'nightly', at: now - 86400000 * 1 - 3600000 * 5, size: '2.1 GB' },
        { label: 'before-1.21-update', at: now - 86400000 * 3, size: '1.9 GB' },
      ],
    });
    var vik = newInstance(TEMPLATES.valheim, 'Vikings', { status: 'running', startedAt: now - 26 * 3600000 });
    var jf = newInstance(TEMPLATES.jellyfin, 'Jellyfin', { status: 'running', startedAt: now - 9 * 86400000 });
    var pal = newInstance(TEMPLATES.palworld, 'Palworld', {
      snapshots: [{ label: 'auto', at: now - 86400000 * 2, size: '640 MB' }],
    });
    [smp, vik, jf].forEach(seedHistory);
    pal.cpuHist = [];
    pal.memHist = [];

    var t0 = smp.startedAt;
    smp.log = [
      { t: clock(t0), c: 'sys', x: '[Outpost] Starting: java -Xms1G -Xmx4G -jar paper-1.21.jar nogui' },
      { t: clock(t0 + 2000), c: '', x: '[Server thread/INFO]: Starting minecraft server version 1.21' },
      { t: clock(t0 + 6000), c: '', x: '[Server thread/INFO]: Done (4.21s)! For help, type "help"' },
      { t: clock(now - 3600000), c: '', x: '[Server thread/INFO]: Steve joined the game' },
      { t: clock(now - 2400000), c: '', x: '[Server thread/INFO]: Alex joined the game' },
      { t: clock(now - 1900000), c: 'chat', x: '<Alex> base tour at spawn in 5' },
      { t: clock(now - 600000), c: '', x: '[Server thread/INFO]: Zuri joined the game' },
      { t: clock(now - 300000), c: 'chat', x: '<Zuri> who built the giant duck' },
    ];
    vik.log = [
      { t: clock(vik.startedAt), c: 'sys', x: '[Outpost] Starting: ./valheim_server.x86_64 -name Vikings -port 2456 -world Dedicated' },
      { t: clock(vik.startedAt + 4000), c: '', x: 'Game server connected' },
      { t: clock(now - 1200000), c: '', x: 'World saved ( 312.4ms )' },
    ];
    jf.log = [
      { t: clock(jf.startedAt), c: 'sys', x: '[Outpost] Container started (a3f9c2e1)' },
      { t: clock(jf.startedAt + 3000), c: '', x: '[INF] Startup complete 0:00:03.41' },
    ];
    pal.log = [{ t: clock(now - 7200000), c: 'sys', x: '[Outpost] Process exited with code 0' }];

    state = {
      view: 'instances',
      filter: 'all',
      selected: null,
      tab: 'console',
      modal: null,
      instances: [smp, vik, jf, pal],
      audit: [
        { at: now - 86400000, who: 'alex', what: 'signed in (2FA)' },
        { at: now - 3600000 * 5, who: 'system', what: 'created scheduled snapshot "nightly" of Survival SMP' },
        { at: now - 3600000 * 3.2, who: 'admin', what: 'started Survival SMP' },
      ],
    };
    modalHost.innerHTML = '';
    toastHost.innerHTML = '';
    render();
  }

  function byId(id) {
    for (var i = 0; i < state.instances.length; i++) if (state.instances[i].id === id) return state.instances[i];
    return null;
  }
  function current() {
    return state.view === 'detail' ? byId(state.selected) : null;
  }
  function audit(what, who) {
    state.audit.push({ at: Date.now(), who: who || 'admin', what: what });
  }
  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  /* ---------- Console ---------- */
  function log(inst, text, cls) {
    var line = { t: clock(), c: cls || '', x: text };
    inst.log.push(line);
    if (inst.log.length > 300) inst.log.shift();
    var cur = current();
    if (cur === inst && state.tab === 'console') {
      var out = main.querySelector('.con-out');
      if (out) {
        var nearBottom = out.scrollHeight - out.scrollTop - out.clientHeight < 40;
        out.insertAdjacentHTML('beforeend', lineHtml(line));
        if (nearBottom) out.scrollTop = out.scrollHeight;
      }
    }
  }

  function lineHtml(l) {
    return '<div class="ln ' + l.c + '"><span class="ts">' + l.t + '</span>' + esc(l.x) + '</div>';
  }

  // Play lines one after another, then call done. Lines are [text, class] or a function.
  function play(inst, lines, done, gap) {
    var i = 0;
    inst.seq = (inst.seq || 0) + 1;
    var seq = inst.seq;
    (function step() {
      if (inst.seq !== seq) return; // superseded (e.g. killed)
      if (i >= lines.length) {
        if (done) done();
        return;
      }
      var l = lines[i++];
      if (typeof l === 'function') l();
      else log(inst, l[0], l[1]);
      later(step, (gap || 420) + rand(0, 380));
    })();
  }

  function startLines(inst) {
    var t = inst.t;
    switch (t.flavor) {
      case 'minecraft':
        return [
          ['[Outpost] Starting: java -Xms1G -Xmx4G -jar ' + t.jar + ' nogui', 'sys'],
          ['[Server thread/INFO]: Starting minecraft server version 1.21'],
          ['[Server thread/INFO]: Loading properties'],
          ['[Server thread/INFO]: Default game type: SURVIVAL'],
          ['[Server thread/INFO]: Preparing level "world"'],
          ['[Server thread/INFO]: Preparing spawn area: 47%'],
          ['[Server thread/INFO]: Preparing spawn area: 91%'],
          ['[Server thread/INFO]: Done (' + rand(3, 7).toFixed(2) + 's)! For help, type "help"'],
          ['[Outpost] Ready pattern matched — instance is running', 'sys'],
        ];
      case 'bedrock':
        return [
          ['[Outpost] Starting: ./bedrock_server', 'sys'],
          ['[INFO] Starting Server'],
          ['[INFO] Version: 1.21.44.01'],
          ['[INFO] IPv4 supported, port: 19132'],
          ['[INFO] Server started.'],
        ];
      case 'valheim':
        return [
          ['[Outpost] Starting: ./valheim_server.x86_64 -name "' + inst.name + '" -port 2456 -world Dedicated', 'sys'],
          ['Steam game server initialized'],
          ['Load world: Dedicated (Dedicated)'],
          ['Game server connected'],
        ];
      case 'palworld':
        return [
          ['[Outpost] Starting: ./PalServer.sh -port=8211', 'sys'],
          ['Setting breakpad minidump AppID = 2394010'],
          ['[S_API] SteamAPI_Init() succeeded'],
          ['Running Palworld dedicated server on :8211'],
        ];
      case 'wine':
        return [
          ['[Outpost] Windows executable detected — launching with Wine (WINEPREFIX=./.wine)', 'sys'],
          ['[Outpost] Starting: wine ./' + t.exe, 'sys'],
          ['[Server] Loading server settings'],
          ['[Server] Loading world "' + inst.name + '"'],
          ['[Server] Server started on port ' + t.port.split('/')[0]],
        ];
      case 'terraria':
        return [
          ['[Outpost] Starting: ./TerrariaServer -port 7777 -autocreate 2 -world worlds/' + inst.name + '.wld', 'sys'],
          ['Terraria Server v1.4.4.9'],
          ['Resetting game objects 100%'],
          ['Loading world data: 100%'],
          ['Server started'],
        ];
      case 'custom':
        return [
          ['[Outpost] Starting: /bin/sh -c "' + (inst.cmd || './start.sh') + '"', 'sys'],
          ['SERVER_PORT=' + (inst.port || 8000) + ' SERVER_NAME=' + inst.name],
          ['Listening on 0.0.0.0:' + (inst.port || 8000)],
        ];
      default:
        return [
          ['[Outpost] docker run --name outpost-' + inst.id + ' -p ' + t.port.replace('/tcp', '') + ' -v ./data:/data --memory 2g --security-opt no-new-privileges ' + t.image, 'sys'],
          ['[Outpost] Container started (' + Math.random().toString(16).slice(2, 10) + ')', 'sys'],
          [t.ready || '[Outpost] Container is running'],
        ];
    }
  }

  function stopLines(inst) {
    switch (inst.t.flavor) {
      case 'minecraft':
        return [
          ['[Outpost] Sending console command: stop', 'sys'],
          ['[Server thread/INFO]: Stopping the server'],
          ['[Server thread/INFO]: Saving players'],
          ['[Server thread/INFO]: Saving worlds'],
          ['[Server thread/INFO]: ThreadedAnvilChunkStorage: All dimensions are saved'],
          ['[Outpost] Process exited with code 0', 'sys'],
        ];
      case 'valheim':
        return [
          ['[Outpost] Sending SIGINT (Valheim only saves its world on SIGINT)', 'sys'],
          ['World saved ( ' + rand(200, 500).toFixed(1) + 'ms )'],
          ['Net scene destroyed'],
          ['[Outpost] Process exited with code 0', 'sys'],
        ];
      case 'palworld':
        return [
          ['[Outpost] Sending SIGTERM', 'sys'],
          ['[Outpost] Still running after the grace period — force-stopping (its autosave is kept)', 'warn'],
          ['[Outpost] Process killed', 'sys'],
        ];
      case 'bedrock':
        return [['[Outpost] Sending console command: stop', 'sys'], ['[INFO] Server stop requested.'], ['[INFO] Stopping server...'], ['Quit correctly'], ['[Outpost] Process exited with code 0', 'sys']];
      case 'wine':
        return [['[Outpost] Sending SIGINT through Wine', 'sys'], ['[Server] Saving world…'], ['[Server] Shutdown complete'], ['[Outpost] Process exited with code 0', 'sys']];
      case 'terraria':
        return [['[Outpost] Sending console command: exit', 'sys'], ['Saving world data: 100%'], ['[Outpost] Process exited with code 0', 'sys']];
      case 'custom':
        return [['[Outpost] Sending SIGTERM to the process group', 'sys'], ['[Outpost] Process exited with code 0', 'sys']];
      default:
        return [['[Outpost] docker stop outpost-' + inst.id, 'sys'], ['[Outpost] Container exited (0)', 'sys']];
    }
  }

  function installLines(inst) {
    var t = inst.t;
    if (t.install === 'jar') {
      return [
        ['[Outpost] Fetching the version list…', 'sys'],
        ['[Outpost] Downloading ' + t.jar + ' … 38%', 'sys'],
        ['[Outpost] Downloading ' + t.jar + ' … 100%', 'sys'],
        ['[Outpost] Writing eula.txt (accepted at creation)', 'sys'],
        ['[Outpost] Install complete', 'sys'],
      ];
    }
    if (t.install === 'steam') {
      return [
        ['[Outpost] steamcmd ' + (t.windows ? '+@sSteamCmdForcePlatformType windows ' : '') + '+login anonymous +app_update ' + t.app + ' validate +quit', 'sys'],
        [' Update state (0x61) downloading, progress: 12.40'],
        [' Update state (0x61) downloading, progress: 57.83'],
        [' Update state (0x61) downloading, progress: 100.00'],
        ["Success! App '" + t.app + "' fully installed."],
        ['[Outpost] Install complete', 'sys'],
      ];
    }
    if (t.install === 'zip') {
      return [['[Outpost] Downloading server archive … 100%', 'sys'], ['[Outpost] Unpacking…', 'sys'], ['[Outpost] Install complete', 'sys']];
    }
    if (inst.cmd) {
      return [['[Outpost] Created instance folder ./instances/' + inst.id, 'sys'], ['[Outpost] Upload your files in File Management, then press Start', 'sys']];
    }
    return [
      ['[Outpost] Pulling ' + t.image, 'sys'],
      [t.image.split(':')[1] + ': Pulling from ' + t.image.split(':')[0]],
      ['Digest: sha256:' + Math.random().toString(16).slice(2, 14) + '…'],
      ['Status: Downloaded newer image for ' + t.image],
      ['[Outpost] Image ready', 'sys'],
    ];
  }

  /* ---------- Lifecycle ---------- */
  function setStatus(inst, s) {
    inst.status = s;
    if (s === 'running') {
      inst.startedAt = Date.now();
      inst.cpu = rand(inst.t.cpu[0], inst.t.cpu[1]);
      inst.mem = rand(inst.t.mem[0], inst.t.mem[1]);
    }
    if (s === 'stopped' || s === 'crashed') {
      inst.cpu = 0;
      inst.mem = 0;
      inst.net = 0;
      inst.players = [];
    }
    render();
  }

  function start(inst, quiet) {
    if (inst.status !== 'stopped' && inst.status !== 'crashed') return;
    setStatus(inst, 'starting');
    if (!quiet) audit('started ' + inst.name);
    play(inst, startLines(inst), function () {
      setStatus(inst, 'running');
      if (inst.t.flavor === 'minecraft') later(function () { maybeJoin(inst, true); }, 2500);
    });
  }

  function stop(inst, then) {
    if (inst.status !== 'running') return;
    setStatus(inst, 'stopping');
    if (!then) audit('stopped ' + inst.name);
    play(inst, stopLines(inst), function () {
      setStatus(inst, 'stopped');
      if (then) then();
    }, 360);
  }

  function restart(inst) {
    audit('restarted ' + inst.name);
    stop(inst, function () {
      later(function () { start(inst, true); }, 500);
    });
  }

  function kill(inst) {
    if (inst.status === 'stopped' || inst.status === 'installing') return;
    inst.seq = (inst.seq || 0) + 1; // cancel whatever was playing
    log(inst, '[Outpost] Killed (SIGKILL)', 'warn');
    audit('killed ' + inst.name);
    setStatus(inst, 'stopped');
  }

  function crash(inst) {
    if (inst.status !== 'running') return;
    inst.seq = (inst.seq || 0) + 1;
    if (inst.t.flavor === 'minecraft') {
      log(inst, '[Server thread/ERROR]: Encountered an unexpected exception', 'err');
      log(inst, 'java.lang.OutOfMemoryError: Java heap space', 'err');
      log(inst, '    at net.minecraft.world.level.chunk.ChunkAccess.<init>(ChunkAccess.java:98)', 'err');
    } else {
      log(inst, 'Segmentation fault (core dumped)', 'err');
    }
    log(inst, '[Outpost] Process exited with code 137 — crashed', 'err');
    setStatus(inst, 'crashed');
    audit(inst.name + ' crashed', 'system');
    toast('🔔 Discord alert sent: “' + inst.name + ' crashed”', 'info');
    if (!inst.autoRestart) return;
    inst.attempts++;
    log(inst, '[Outpost] Auto-restart in 5s (attempt ' + inst.attempts + ' of 3)', 'warn');
    var seq = inst.seq;
    later(function () {
      if (inst.seq !== seq || inst.status !== 'crashed') return;
      start(inst, true);
      audit('auto-restarted ' + inst.name, 'system');
    }, 5000);
  }

  function maybeJoin(inst, force) {
    if (inst.status !== 'running' || inst.t.flavor !== 'minecraft') return;
    if (inst.players.length >= 6) return;
    var free = PLAYER_POOL.filter(function (p) { return inst.players.indexOf(p) < 0; });
    if (!free.length || (!force && Math.random() > 0.5)) return;
    var p = pick(free);
    inst.players.push(p);
    log(inst, '[Server thread/INFO]: ' + p + ' joined the game');
    if (state.view === 'detail' && state.tab === 'players' && current() === inst) render();
  }

  /* ---------- Console commands ---------- */
  function command(inst, raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    inst.cmdHist.push(cmd);
    inst.histIdx = inst.cmdHist.length;
    log(inst, '> ' + cmd, 'cmd');
    var parts = cmd.split(/\s+/);
    var verb = parts[0].replace(/^\//, '').toLowerCase();
    var arg = parts.slice(1).join(' ');

    if (verb === 'stop' || verb === 'exit' || verb === 'quit') {
      stop(inst);
      return;
    }
    if (inst.t.flavor !== 'minecraft') {
      if (verb === 'help') log(inst, '[Outpost] This process has no command list of its own — input is sent to its stdin. "stop" stops it.', 'sys');
      else log(inst, '[Outpost] Sent to stdin', 'sys');
      return;
    }
    var I = '[Server thread/INFO]: ';
    switch (verb) {
      case 'help':
        log(inst, I + 'Try: list, say <message>, op <player>, deop <player>, kick <player>, time set day|night, weather clear|rain, stop');
        break;
      case 'list':
        log(inst, I + 'There are ' + inst.players.length + ' of a max of 20 players online: ' + inst.players.join(', '));
        break;
      case 'say':
        log(inst, I + '[Server] ' + (arg || '…'), 'chat');
        break;
      case 'op':
      case 'deop':
      case 'kick': {
        var who = matchPlayer(inst, parts[1]);
        if (!who) {
          log(inst, I + 'No player was found', 'warn');
          break;
        }
        playerAction(inst, verb, who, true);
        break;
      }
      case 'time':
        log(inst, I + 'Set the time to ' + (/night/i.test(arg) ? 13000 : 1000));
        break;
      case 'weather':
        log(inst, I + 'Changing to ' + (/rain/i.test(arg) ? 'rain' : 'clear') + ' weather');
        break;
      case 'seed':
        log(inst, I + 'Seed: [-4172144997902289642]');
        break;
      default:
        log(inst, I + 'Unknown or incomplete command. Type "help" for a few to try.', 'warn');
    }
  }

  function matchPlayer(inst, name) {
    if (!name) return null;
    for (var i = 0; i < inst.players.length; i++) if (inst.players[i].toLowerCase() === name.toLowerCase()) return inst.players[i];
    return null;
  }

  function playerAction(inst, verb, who, fromConsole) {
    var I = '[Server thread/INFO]: ';
    if (!fromConsole) log(inst, '> ' + verb + ' ' + who, 'cmd');
    if (verb === 'op') {
      if (inst.ops.indexOf(who) < 0) inst.ops.push(who);
      log(inst, I + 'Made ' + who + ' a server operator');
      audit('opped ' + who + ' on ' + inst.name);
    } else if (verb === 'deop') {
      inst.ops = inst.ops.filter(function (p) { return p !== who; });
      log(inst, I + 'Made ' + who + ' no longer a server operator');
      audit('deopped ' + who + ' on ' + inst.name);
    } else if (verb === 'kick') {
      inst.players = inst.players.filter(function (p) { return p !== who; });
      log(inst, I + 'Kicked ' + who + ': Kicked by an operator');
      log(inst, I + who + ' left the game');
      audit('kicked ' + who + ' from ' + inst.name);
    }
    if (state.tab === 'players') render();
  }

  /* ---------- Toasts ---------- */
  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'ui-toast ui-toast-' + (kind || 'info');
    el.textContent = msg;
    toastHost.appendChild(el);
    while (toastHost.children.length > 3) toastHost.removeChild(toastHost.firstChild);
    later(function () {
      el.classList.add('out');
      later(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3600);
  }

  /* ---------- Rendering ---------- */
  var STATUS = {
    running: ['is-on', 'Running'],
    starting: ['is-busy', 'Starting'],
    stopping: ['is-busy', 'Stopping'],
    installing: ['is-busy', 'Installing'],
    crashed: ['is-bad', 'Crashed'],
    stopped: ['', 'Stopped'],
  };

  function badge(inst) {
    var s = STATUS[inst.status];
    return '<span class="ui-badge ' + s[0] + '"><i class="dot"></i>' + s[1] + '</span>';
  }

  function emblem(inst, big) {
    return '<span class="emblem' + (big ? ' big' : '') + '" style="--e1:' + inst.t.e[0] + ';--e2:' + inst.t.e[1] + '">' + inst.t.emoji + '</span>';
  }

  function subline(inst) {
    return esc(inst.t.sub) + ' · ' + esc(inst.port ? inst.port + '/tcp' : inst.t.port);
  }

  function hostGauges() {
    return (
      '<div class="mock-gauges">' +
      '<div class="ui-card gauge"><small>CPU</small><b data-live="host-cpu"></b><span class="bar"><i data-live="host-cpu-bar"></i></span></div>' +
      '<div class="ui-card gauge"><small>Memory</small><b data-live="host-mem"></b><span class="bar"><i data-live="host-mem-bar"></i></span></div>' +
      '<div class="ui-card gauge"><small>Disk</small><b>41% · 196 GB free</b><span class="bar"><i style="width:41%"></i></span></div>' +
      '</div>'
    );
  }

  function instanceRows(list) {
    if (!list.length) {
      return '<div class="demo-empty">Nothing here yet. <button type="button" class="ui-btn ui-btn-ghost ui-btn-xs" data-act="new">Create one →</button></div>';
    }
    return (
      '<div class="mock-list">' +
      list
        .map(function (inst) {
          var running = inst.status === 'running';
          var action =
            inst.status === 'stopped' || inst.status === 'crashed'
              ? '<button type="button" class="ui-btn ui-btn-xs" data-act="start" data-id="' + inst.id + '">▶ Start</button>'
              : running
                ? '<button type="button" class="ui-btn ui-btn-xs" data-act="stop" data-id="' + inst.id + '">■ Stop</button>'
                : '<button type="button" class="ui-btn ui-btn-xs" disabled>…</button>';
          return (
            '<div class="ui-card inst demo-inst">' +
            emblem(inst) +
            '<button type="button" class="inst-name inst-open" data-act="open" data-id="' + inst.id + '"><b>' + esc(inst.name) + '</b><small>' + subline(inst) + '</small></button>' +
            '<span class="inst-metrics">' +
            (running ? '<span data-live="cpu:' + inst.id + '"></span><span data-live="mem:' + inst.id + '"></span>' : '') +
            (inst.t.flavor === 'minecraft' && running ? '<span>👤 ' + inst.players.length + '</span>' : '') +
            '</span>' +
            badge(inst) +
            action +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderInstances() {
    var groups = [
      ['all', 'All'],
      ['game', '🎮 Games'],
      ['app', '📦 Apps'],
      ['container', '🐳 Containers'],
      ['custom', '⌨️ Custom'],
    ];
    var list = state.instances.filter(function (i) {
      return state.filter === 'all' || i.t.group === state.filter;
    });
    return (
      '<div class="mock-head"><span class="ui-page-title">Instances</span><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-act="new">＋ New instance</button></div>' +
      hostGauges() +
      '<div class="chips" role="group" aria-label="Filter">' +
      groups
        .map(function (g) {
          var on = state.filter === g[0];
          return '<button type="button" class="ui-btn ui-btn-xs' + (on ? ' ui-btn-primary' : '') + '" aria-pressed="' + on + '" data-act="filter" data-filter="' + g[0] + '">' + g[1] + '</button>';
        })
        .join('') +
      '</div>' +
      instanceRows(list)
    );
  }

  function renderDocker() {
    var list = state.instances.filter(function (i) {
      return i.t.group === 'app' || i.t.group === 'container';
    });
    return (
      '<div class="mock-head"><span class="ui-page-title">Docker</span><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-act="new" data-kind="container">＋ New container</button></div>' +
      '<div class="ui-card engine"><span class="engine-dot"></span><div><b>Container engine: Podman 5.2 (rootless)</b><small>API socket available · no root daemon · each container only sees its own folder</small></div></div>' +
      instanceRows(list)
    );
  }

  function renderUsers() {
    var rows = [
      ['admin', 'Administrator', 'Everything', '✅'],
      ['alex', 'Moderator', 'Survival SMP, Vikings · max 3 instances, 4 GB each', '✅'],
      ['sam', 'Viewer', 'Survival SMP (view files, console output)', '—'],
    ];
    return (
      '<div class="mock-head"><span class="ui-page-title">Users</span><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-act="stub" data-name="Inviting users">＋ Add user</button></div>' +
      '<div class="table-wrap"><table class="ui-table"><thead><tr><th>User</th><th>Role</th><th>Access</th><th>2FA</th></tr></thead><tbody>' +
      rows
        .map(function (r) {
          return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>';
        })
        .join('') +
      '</tbody></table></div>' +
      '<p class="demo-note">Each user gets their own permissions per instance — start/stop, console, files, plugins, snapshots — and the API enforces them, not just the UI.</p>'
    );
  }

  function renderAudit() {
    var items = state.audit.slice().reverse();
    return (
      '<div class="mock-head"><span class="ui-page-title">Audit log</span></div>' +
      '<p class="demo-note">Everything you do in this demo is recorded here, just like in the real panel.</p>' +
      '<ul class="audit">' +
      items
        .map(function (a) {
          return '<li><span class="when">' + fmtDate(a.at) + '</span><b>' + esc(a.who) + '</b> ' + esc(a.what) + '</li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function renderDetail(inst) {
    var s = inst.status;
    var canStart = s === 'stopped' || s === 'crashed';
    var running = s === 'running';
    var tabs = [['console', '🖥️ Console'], ['status', '📊 Status']];
    if (inst.t.flavor === 'minecraft') tabs.push(['players', '👤 Players']);
    tabs.push(['snapshots', '📸 Snapshots']);
    if (!tabs.some(function (t) { return t[0] === state.tab; })) state.tab = 'console';

    var html =
      '<button type="button" class="ui-btn ui-btn-ghost ui-btn-xs back" data-act="back">← Instances</button>' +
      '<div class="det-head">' +
      emblem(inst, true) +
      '<div class="det-title"><span class="ui-page-title">' + esc(inst.name) + '</span><small>' + subline(inst) + '</small></div>' +
      badge(inst) +
      '</div>' +
      '<div class="det-actions">' +
      '<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-act="start" data-id="' + inst.id + '"' + (canStart ? '' : ' disabled') + '>▶ Start</button>' +
      '<button type="button" class="ui-btn ui-btn-sm" data-act="stop" data-id="' + inst.id + '"' + (running ? '' : ' disabled') + '>■ Stop</button>' +
      '<button type="button" class="ui-btn ui-btn-sm" data-act="restart" data-id="' + inst.id + '"' + (running ? '' : ' disabled') + '>↻ Restart</button>' +
      '<button type="button" class="ui-btn ui-btn-sm ui-btn-danger" data-act="kill" data-id="' + inst.id + '"' + (s === 'starting' || s === 'stopping' || running ? '' : ' disabled') + '>✕ Kill</button>' +
      (inst.t.web ? '<button type="button" class="ui-btn ui-btn-sm" data-act="webui" data-id="' + inst.id + '"' + (running ? '' : ' disabled') + '>↗ Open web UI</button>' : '') +
      '</div>' +
      '<div class="tabs dtabs" role="tablist">' +
      tabs
        .map(function (t) {
          var on = state.tab === t[0];
          return '<button type="button" role="tab" aria-selected="' + on + '" class="ui-btn ui-btn-xs' + (on ? ' ui-btn-primary' : '') + '" data-act="tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
        })
        .join('') +
      '</div>';

    if (state.tab === 'console') html += renderConsole(inst);
    else if (state.tab === 'status') html += renderStatus(inst);
    else if (state.tab === 'players') html += renderPlayers(inst);
    else html += renderSnapshots(inst);
    return html;
  }

  function renderConsole(inst) {
    var live = inst.status === 'running';
    var hint = inst.t.flavor === 'minecraft' ? 'Type a command — try "help", "list" or "say hi"' : 'Send input to the process — "stop" stops it';
    return (
      '<div class="ui-terminal demo-console">' +
      '<div class="term-bar"><span>console · ' + esc(inst.name) + '</span><span class="term-live">' + (live ? '● live' : '○ offline') + '</span></div>' +
      '<div class="con-out" role="log" aria-label="Console output">' + inst.log.map(lineHtml).join('') + '</div>' +
      '<form class="con-form" data-form="console" data-id="' + inst.id + '">' +
      '<span class="prompt" aria-hidden="true">&gt;</span>' +
      '<input class="con-input" name="cmd" autocomplete="off" spellcheck="false" aria-label="Console command" placeholder="' +
      esc(live ? hint : 'Start the instance to send commands') + '"' + (live ? '' : ' disabled') + ' />' +
      '</form></div>'
    );
  }

  function spark(id, key) {
    return '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline data-live="' + key + ':' + id + '" points="" /></svg>';
  }

  function renderStatus(inst) {
    var running = inst.status === 'running';
    return (
      '<div class="tiles">' +
      '<div class="ui-card tile"><small>CPU</small><b data-live="cpu:' + inst.id + '">—</b>' + spark(inst.id, 'spark-cpu') + '</div>' +
      '<div class="ui-card tile"><small>Memory</small><b data-live="mem:' + inst.id + '">—</b>' + spark(inst.id, 'spark-mem') + '</div>' +
      '<div class="ui-card tile"><small>Network</small><b data-live="net:' + inst.id + '">—</b><span class="tile-sub">host-wide, like the real panel</span></div>' +
      '<div class="ui-card tile"><small>Uptime</small><b data-live="up:' + inst.id + '">—</b><span class="tile-sub">' + (inst.attempts ? 'restarted ' + inst.attempts + '× after crashes' : 'no crashes') + '</span></div>' +
      '</div>' +
      '<div class="ui-card restart-card">' +
      '<h3 class="ui-card-title">♻️ Automatic restart</h3>' +
      '<label class="switch-row"><input type="checkbox" data-act="autorestart" data-id="' + inst.id + '"' + (inst.autoRestart ? ' checked' : '') + ' /> <span>Restart when it crashes (wait 5s, give up after 3 tries)</span></label>' +
      '<div class="restart-row"><button type="button" class="ui-btn ui-btn-sm ui-btn-danger" data-act="crash" data-id="' + inst.id + '"' + (running ? '' : ' disabled') + '>💥 Simulate a crash</button>' +
      '<span class="muted">' + (running ? 'Then watch the console.' : 'Start the instance first.') + '</span></div>' +
      '</div>'
    );
  }

  function renderPlayers(inst) {
    if (inst.status !== 'running') return '<div class="demo-empty">Start the server to see who’s online.</div>';
    if (!inst.players.length) return '<div class="demo-empty">Nobody’s online yet — give it a few seconds.</div>';
    return (
      '<div class="mock-list">' +
      inst.players
        .map(function (p) {
          var op = inst.ops.indexOf(p) >= 0;
          return (
            '<div class="ui-card inst player">' +
            '<span class="head" style="--h:' + (p.charCodeAt(0) * 37) % 360 + '">' + p[0] + '</span>' +
            '<span class="inst-name"><b>' + esc(p) + '</b><small>' + (op ? '⭐ Operator' : 'Player') + '</small></span>' +
            '<button type="button" class="ui-btn ui-btn-xs" data-act="' + (op ? 'deop' : 'op') + '" data-id="' + inst.id + '" data-player="' + esc(p) + '">' + (op ? 'Deop' : 'Op') + '</button>' +
            '<button type="button" class="ui-btn ui-btn-xs ui-btn-danger" data-act="kick" data-id="' + inst.id + '" data-player="' + esc(p) + '">Kick</button>' +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderSnapshots(inst) {
    var list = inst.snapshots.slice().reverse();
    return (
      '<div class="snap-head"><span class="muted">Scheduled nightly at 03:00 · keeping the last 7</span>' +
      '<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-act="snap" data-id="' + inst.id + '"' + (inst.busySnap ? ' disabled' : '') + '>' + (inst.busySnap ? 'Creating…' : '＋ Create snapshot') + '</button></div>' +
      (list.length
        ? '<div class="mock-list">' +
          list
            .map(function (sn) {
              var idx = inst.snapshots.indexOf(sn);
              return (
                '<div class="ui-card inst snap">' +
                '<span class="snap-icon">📸</span>' +
                '<span class="inst-name"><b>' + esc(sn.label) + '</b><small>' + fmtDate(sn.at) + ' · ' + sn.size + '</small></span>' +
                '<button type="button" class="ui-btn ui-btn-xs" data-act="diff" data-id="' + inst.id + '">Restore one file</button>' +
                '<button type="button" class="ui-btn ui-btn-xs" data-act="restore" data-id="' + inst.id + '" data-snap="' + idx + '">Restore all</button>' +
                '</div>'
              );
            })
            .join('') +
          '</div>'
        : '<div class="demo-empty">No snapshots yet.</div>')
    );
  }

  function navState() {
    var view = state.view === 'detail' ? 'instances' : state.view;
    var items = root.querySelectorAll('.demo-nav .ui-nav-item');
    for (var i = 0; i < items.length; i++) {
      var on = items[i].dataset.view === view;
      items[i].classList.toggle('is-active', on);
      items[i].firstElementChild.classList.toggle('bg-secondary-container', on);
      if (on) items[i].setAttribute('aria-current', 'page');
      else items[i].removeAttribute('aria-current');
    }
  }

  function mobileNav() {
    var v = state.view === 'detail' ? 'instances' : state.view;
    return (
      '<div class="demo-mnav">' +
      [['instances', '🎮'], ['docker', '🐳'], ['users', '👥'], ['audit', '🧾']]
        .map(function (n) {
          return '<button type="button" class="ui-btn ui-btn-xs' + (v === n[0] ? ' ui-btn-primary' : '') + '" data-act="nav" data-view="' + n[0] + '">' + n[1] + ' ' + n[0][0].toUpperCase() + n[0].slice(1) + '</button>';
        })
        .join('') +
      '</div>'
    );
  }

  function render() {
    // Keep what the visitor is typing and where they've scrolled across re-renders.
    var input = main.querySelector('.con-input');
    var typed = input ? input.value : '';
    var hadFocus = input && document.activeElement === input;
    var scroll = main.scrollTop;
    var out = main.querySelector('.con-out');
    var outAtBottom = !out || out.scrollHeight - out.scrollTop - out.clientHeight < 40;
    var outScroll = out ? out.scrollTop : 0;

    var html;
    if (state.view === 'detail' && current()) html = renderDetail(current());
    else if (state.view === 'docker') html = renderDocker();
    else if (state.view === 'users') html = renderUsers();
    else if (state.view === 'audit') html = renderAudit();
    else {
      state.view = 'instances';
      html = renderInstances();
    }
    main.innerHTML = mobileNav() + html;
    main.scrollTop = scroll;
    navState();

    var newOut = main.querySelector('.con-out');
    if (newOut) newOut.scrollTop = outAtBottom ? newOut.scrollHeight : outScroll;
    var newInput = main.querySelector('.con-input');
    if (newInput) {
      newInput.value = typed;
      if (hadFocus && !newInput.disabled) newInput.focus({ preventScroll: true });
    }
    updateLive();
  }

  /* ---------- New instance dialog ---------- */
  function openModal(kind) {
    state.modal = { step: kind ? 2 : 1, kind: kind || null, tpl: null };
    renderModal();
    var first = modalHost.querySelector('button, input');
    if (first) first.focus({ preventScroll: true });
  }

  function closeModal() {
    state.modal = null;
    modalHost.innerHTML = '';
  }

  function renderModal() {
    var m = state.modal;
    var body;
    if (m.step === 1) {
      body =
        '<p class="modal-lead">What do you want to create?</p><div class="pick-grid">' +
        KINDS.map(function (k) {
          return '<button type="button" class="ui-card pick" data-act="kind" data-kind="' + k.id + '"><span class="pick-emoji">' + k.emoji + '</span><b>' + k.label + '</b><small>' + k.desc + '</small></button>';
        }).join('') +
        '</div>';
    } else {
      var fields = '';
      if (m.kind === 'game' || m.kind === 'app') {
        fields +=
          '<div class="pick-grid three">' +
          Object.keys(TEMPLATES)
            .filter(function (k) { return TEMPLATES[k].group === m.kind; })
            .map(function (k) {
              var t = TEMPLATES[k];
              return '<button type="button" class="ui-card pick small" aria-pressed="' + (m.tpl === k) + '" data-act="tpl" data-tpl="' + k + '"><span class="pick-emoji">' + t.emoji + '</span><b>' + t.label + '</b><small>' + t.desc + '</small></button>';
            })
            .join('') +
          '</div>';
      } else if (m.kind === 'container') {
        fields += '<label class="field"><span>Image</span><input class="ui-input" name="image" value="nginx:alpine" required /></label>';
      } else {
        fields += '<label class="field"><span>Start command</span><input class="ui-input" name="cmd" value="./start.sh --port {{PORT}}" required /></label>';
      }
      var defName = m.tpl ? TEMPLATES[m.tpl].label + (m.kind === 'game' ? ' server' : '') : m.kind === 'container' ? 'My container' : m.kind === 'custom' ? 'My script' : '';
      body =
        '<form data-form="create">' +
        fields +
        '<label class="field"><span>Name</span><input class="ui-input" name="name" maxlength="40" value="' + esc(m.name || defName) + '" required /></label>' +
        (m.kind === 'game' && m.tpl && TEMPLATES[m.tpl].flavor === 'minecraft' ? '<label class="switch-row"><input type="checkbox" required checked /> <span>I accept the Minecraft EULA</span></label>' : '') +
        '<div class="modal-actions"><button type="button" class="ui-btn ui-btn-sm" data-act="mback">← Back</button>' +
        '<button type="submit" class="ui-btn ui-btn-sm ui-btn-primary"' + ((m.kind === 'game' || m.kind === 'app') && !m.tpl ? ' disabled' : '') + '>Create</button></div>' +
        '</form>';
    }
    modalHost.innerHTML =
      '<div class="demo-backdrop" data-act="mclose"></div>' +
      '<div class="ui-window demo-modal" role="dialog" aria-modal="true" aria-label="New instance">' +
      '<div class="ui-window-header"><h3 class="ui-window-title">New instance</h3><button type="button" class="ui-window-close" data-act="mclose" aria-label="Close">✕</button></div>' +
      '<div class="ui-window-body">' + body + '</div></div>';
  }

  function create(form) {
    var m = state.modal;
    var name = (form.elements.name.value || '').trim().slice(0, 40) || 'New instance';
    var t, extra = {};
    if (m.kind === 'game' || m.kind === 'app') {
      t = TEMPLATES[m.tpl];
    } else if (m.kind === 'container') {
      var image = (form.elements.image.value || 'nginx:alpine').trim().slice(0, 60);
      if (image.indexOf(':') < 0) image += ':latest';
      t = { label: image, group: 'container', emoji: '🐳', sub: 'Docker · ' + image, port: '8080/tcp', flavor: 'app', image: image, e: ['#173a4a', '#0d2230'], mem: [20, 120], cpu: [0.2, 4] };
    } else {
      extra.cmd = (form.elements.cmd.value || './start.sh').trim().slice(0, 80);
      extra.port = 8000 + nextId;
      t = { label: 'Custom', group: 'custom', emoji: '⌨️', sub: 'Custom process', port: extra.port + '/tcp', flavor: 'custom', e: ['#20262b', '#0f1316'], mem: [30, 200], cpu: [0.5, 8] };
    }
    var inst = newInstance(t, name, extra);
    inst.status = 'installing';
    state.instances.push(inst);
    audit('created ' + name + ' (' + (t.sub || t.label) + ')');
    closeModal();
    state.view = 'detail';
    state.selected = inst.id;
    state.tab = 'console';
    render();
    play(inst, installLines(inst), function () {
      setStatus(inst, 'stopped');
      toast('✅ ' + name + ' is ready — press Start', 'success');
    }, 380);
  }

  /* ---------- Live metrics ---------- */
  var visible = false;

  function tick() {
    if (!state || !visible || document.hidden) return;
    state.instances.forEach(function (inst) {
      if (inst.status === 'running' || inst.status === 'starting') {
        var lo = inst.t.cpu[0], hi = inst.t.cpu[1];
        if (inst.status === 'starting') { lo = hi; hi = hi * 2.2; }
        inst.cpu = clamp(inst.cpu + rand(-0.25, 0.25) * (hi - lo), lo, hi);
        inst.mem = clamp(inst.mem + rand(-0.06, 0.08) * (inst.t.mem[1] - inst.t.mem[0]), inst.t.mem[0], inst.t.mem[1]);
        inst.net = clamp(inst.net + rand(-60, 60), 10, 900);
        inst.cpuHist.push(inst.cpu);
        inst.memHist.push(inst.mem);
        if (inst.cpuHist.length > 40) inst.cpuHist.shift();
        if (inst.memHist.length > 40) inst.memHist.shift();
      }
      if (inst.status === 'running' && inst.t.flavor === 'minecraft') {
        var r = Math.random();
        if (r < 0.04) maybeJoin(inst);
        else if (r < 0.06 && inst.players.length > 1) {
          var p = pick(inst.players);
          inst.players = inst.players.filter(function (x) { return x !== p; });
          log(inst, '[Server thread/INFO]: ' + p + ' left the game');
          if (state.view === 'detail' && state.tab === 'players' && current() === inst) render();
        } else if (r < 0.1 && inst.players.length) {
          log(inst, '<' + pick(inst.players) + '> ' + pick(CHAT), 'chat');
        }
      }
    });
    updateLive();
  }

  function hostNumbers() {
    var cpu = 3, mem = 3.4 * 1024;
    state.instances.forEach(function (i) {
      cpu += i.cpu / 4;
      mem += i.mem;
    });
    return { cpu: clamp(cpu, 0, 100), mem: mem };
  }

  function sparkPoints(hist, max) {
    if (hist.length < 2) return '';
    var step = 100 / (hist.length - 1);
    return hist
      .map(function (v, i) {
        return (i * step).toFixed(1) + ',' + (28 - (v / max) * 26).toFixed(1);
      })
      .join(' ');
  }

  function updateLive() {
    var els = main.querySelectorAll('[data-live]');
    if (!els.length) return;
    var host = hostNumbers();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var parts = el.dataset.live.split(':');
      var key = parts[0];
      var inst = parts[1] ? byId(+parts[1]) : null;
      var on = inst && (inst.status === 'running' || inst.status === 'starting');
      switch (key) {
        case 'host-cpu': el.textContent = Math.round(host.cpu) + '%'; break;
        case 'host-cpu-bar': el.style.width = host.cpu + '%'; break;
        case 'host-mem': el.textContent = (host.mem / 1024).toFixed(1) + ' / 16 GB'; break;
        case 'host-mem-bar': el.style.width = clamp((host.mem / 16384) * 100, 0, 100) + '%'; break;
        case 'cpu': el.textContent = on ? (el.tagName === 'B' ? '' : 'CPU ') + inst.cpu.toFixed(1) + '%' : '—'; break;
        case 'mem': el.textContent = on ? (el.tagName === 'B' ? '' : 'RAM ') + fmtMem(inst.mem) : '—'; break;
        case 'net': el.textContent = on ? '↓ ' + Math.round(inst.net) + ' KB/s  ↑ ' + Math.round(inst.net * 0.4) + ' KB/s' : '—'; break;
        case 'up': el.textContent = inst.status === 'running' ? fmtUptime(Date.now() - inst.startedAt) : '—'; break;
        case 'spark-cpu': el.setAttribute('points', sparkPoints(inst.cpuHist, Math.max(10, inst.t.cpu[1] * 2.2))); break;
        case 'spark-mem': el.setAttribute('points', sparkPoints(inst.memHist, inst.t.mem[1] * 1.15)); break;
      }
    }
  }

  /* ---------- Events ---------- */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.disabled) return;
    var act = el.dataset.act;
    var inst = el.dataset.id ? byId(+el.dataset.id) : null;
    switch (act) {
      case 'nav':
        state.view = el.dataset.view;
        state.filter = 'all';
        main.scrollTop = 0;
        render();
        break;
      case 'stub':
        toast(el.dataset.name + ' isn’t part of the demo — install Outpost to explore it.', 'info');
        break;
      case 'filter':
        state.filter = el.dataset.filter;
        render();
        break;
      case 'open':
        state.view = 'detail';
        state.selected = inst.id;
        state.tab = 'console';
        main.scrollTop = 0;
        render();
        break;
      case 'back':
        state.view = 'instances';
        render();
        break;
      case 'tab':
        state.tab = el.dataset.tab;
        render();
        break;
      case 'start': start(inst); break;
      case 'stop': stop(inst); break;
      case 'restart': restart(inst); break;
      case 'kill': kill(inst); break;
      case 'crash': crash(inst); break;
      case 'op':
      case 'deop':
      case 'kick':
        playerAction(inst, act, el.dataset.player);
        break;
      case 'webui':
        toast('In the real panel this opens ' + inst.name + ' on port ' + inst.t.port.split('/')[0] + '.', 'info');
        break;
      case 'snap':
        inst.busySnap = true;
        render();
        later(function () {
          inst.busySnap = false;
          var label = 'manual-' + new Date().toTimeString().slice(0, 5).replace(':', '');
          inst.snapshots.push({ label: label, at: Date.now(), size: (rand(0.4, 2.4)).toFixed(1) + ' GB' });
          audit('created snapshot "' + label + '" of ' + inst.name);
          toast('📸 Snapshot of ' + inst.name + ' created', 'success');
          render();
        }, 1400);
        break;
      case 'restore':
        if (inst.status !== 'stopped' && inst.status !== 'crashed') {
          toast('Stop ' + inst.name + ' before restoring a whole snapshot.', 'error');
        } else {
          var sn = inst.snapshots[+el.dataset.snap];
          log(inst, '[Outpost] Restored snapshot "' + sn.label + '"', 'sys');
          audit('restored snapshot "' + sn.label + '" of ' + inst.name);
          toast('♻️ Restored “' + sn.label + '”', 'success');
        }
        break;
      case 'diff':
        toast('The real panel shows a line-by-line diff against the live file, then restores just that file. Works while running.', 'info');
        break;
      case 'new':
        openModal(el.dataset.kind);
        break;
      case 'kind':
        state.modal = { step: 2, kind: el.dataset.kind, tpl: null };
        renderModal();
        break;
      case 'tpl': {
        var nameInput = modalHost.querySelector('input[name="name"]');
        var prevTpl = state.modal.tpl;
        var prevDefault = prevTpl ? TEMPLATES[prevTpl].label + (state.modal.kind === 'game' ? ' server' : '') : '';
        if (nameInput && nameInput.value && nameInput.value !== prevDefault) state.modal.name = nameInput.value;
        state.modal.tpl = el.dataset.tpl;
        renderModal();
        break;
      }
      case 'mback':
        state.modal = { step: 1 };
        renderModal();
        break;
      case 'mclose':
        closeModal();
        break;
    }
  });

  root.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.act === 'autorestart') {
      var inst = byId(+el.dataset.id);
      inst.autoRestart = el.checked;
      audit((el.checked ? 'enabled' : 'disabled') + ' auto-restart for ' + inst.name);
    }
  });

  root.addEventListener('submit', function (e) {
    var form = e.target;
    e.preventDefault();
    if (form.dataset.form === 'console') {
      var inst = byId(+form.dataset.id);
      var input = form.elements.cmd;
      if (inst.status !== 'running') return;
      command(inst, input.value);
      input.value = '';
    } else if (form.dataset.form === 'create') {
      create(form);
    }
  });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.modal) {
      closeModal();
      e.stopPropagation();
      return;
    }
    var input = e.target;
    if (!input.classList || !input.classList.contains('con-input')) return;
    var inst = current();
    if (!inst || !inst.cmdHist.length) return;
    if (inst.histIdx == null) inst.histIdx = inst.cmdHist.length;
    if (e.key === 'ArrowUp') {
      inst.histIdx = Math.max(0, inst.histIdx - 1);
      input.value = inst.cmdHist[inst.histIdx];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      inst.histIdx = Math.min(inst.cmdHist.length, inst.histIdx + 1);
      input.value = inst.cmdHist[inst.histIdx] || '';
      e.preventDefault();
    }
  });

  var reset = document.getElementById('demo-reset');
  if (reset) {
    reset.addEventListener('click', function () {
      init();
      toast('Demo reset', 'info');
    });
  }

  // Only animate while the demo is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(root);
  } else {
    visible = true;
  }
  setInterval(tick, 1500);

  init();
})();
