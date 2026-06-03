const ENGINEER_NAME = 'Fayaz Syed';

const USER_NAV_ITEMS = [
  { id: 'ritm', label: 'RITM', desc: 'Request item tracking and user request management.' },
  { id: 'hcp', label: 'HCP', desc: 'Healthcare provider coordination and portal tracking.' },
  { id: 'new-inc', label: 'NEW INC', desc: 'Create and monitor new incident records quickly.' },
  { id: 'risk-record', label: 'RISK RECORD', desc: 'View and manage risk records and exposure details.' },
  { id: 'algosec', label: 'ALGOSEC', desc: 'Access firewall and network security policy analytics.' },
  { id: 'splunk', label: 'SPLUNK', desc: 'Log search, monitoring dashboards, and alert views.' }
];

const ENGINEER_NAV_ITEMS = [
  { id: 'home', label: 'HOME', desc: 'Return to the engineer dashboard and overview.' },
  { id: 'cds-tool', label: 'CDS TOOL', desc: 'Access the core CDS tools and configuration utilities.' },
  { id: 'war-room', label: 'WAR ROOM', desc: 'Open the war room view for incident collaboration and escalation.' },
  { id: 'splunk', label: 'SPLUNK', desc: 'Search logs, dashboards, and alerts in the Splunk view.' },
  { id: 'meetings', label: 'MEETINGS', desc: 'Review scheduled engineer meetings and collaboration notes.' },
  { id: 'pa', label: 'PA', desc: 'Access the production analytics assistant and status panel.' },
  { id: 'master-list', label: 'MASTER LIST', desc: 'View the master list of assets, tasks, and runbooks.' }
];

function getCurrentNavItems() {
  return getMode() === 'engineer' ? ENGINEER_NAV_ITEMS : USER_NAV_ITEMS;
}

function createNav(items) {
  const container = document.getElementById('nav-buttons');
  container.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    btn.dataset.id = item.id;
    btn.addEventListener('click', () => selectItem(item));
    container.appendChild(btn);
  });
}

function renderNav() {
  createNav(getCurrentNavItems());
}

function selectItem(item) {
  const explanation = document.getElementById('explanation-text');
  explanation.textContent = item.desc;
  const mainPanel = document.getElementById('main-panel');
  const title = mainPanel.querySelector('h2');
  const lead = mainPanel.querySelector('p');

  if (title) title.textContent = item.label;
  if (lead) lead.textContent = item.desc;

  if (getMode() === 'engineer' && !mainPanel.querySelector('.engineer-tools')) {
    mainPanel.insertAdjacentHTML('beforeend', modeSpecificContent());
  }
  if (getMode() !== 'engineer') {
    const engineerInfo = mainPanel.querySelector('.engineer-tools');
    if (engineerInfo) engineerInfo.remove();
  }

  // re-index content so search includes the newly shown content
  buildIndex();
}

// --- Search implementation ---
let SEARCH_INDEX = [];

function buildIndex() {
  SEARCH_INDEX = [];
  // index current nav items
  getCurrentNavItems().forEach(item => {
    SEARCH_INDEX.push({ type: 'nav', id: item.id, label: item.label, text: item.label + ' ' + item.desc });
  });
  // index explanation and main panel texts
  const explanation = document.getElementById('explanation-text');
  if (explanation) SEARCH_INDEX.push({ type: 'explanation', id: 'explanation', label: 'Explanation', text: explanation.textContent });
  const mainPanel = document.getElementById('main-panel');
  if (mainPanel) SEARCH_INDEX.push({ type: 'panel', id: 'main', label: mainPanel.querySelector('h2') ? mainPanel.querySelector('h2').textContent : 'Main', text: mainPanel.textContent });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('('+esc+')','ig');
  return text.replace(re, '<mark class="search-hit">$1</mark>');
}

function performSearch(q) {
  const resultsEl = document.getElementById('search-results');
  resultsEl.innerHTML = '';
  const qtrim = (q || '').trim();
  if (!qtrim) return;
  const matches = SEARCH_INDEX.map(item => {
    const idx = item.text.toLowerCase().indexOf(qtrim.toLowerCase());
    return idx >= 0 ? { item, idx } : null;
  }).filter(Boolean).sort((a,b)=>a.idx - b.idx).map(m=>m.item);
  matches.forEach(m => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${highlightMatch(m.label, qtrim)}</strong><div style="font-size:0.9em;color:#333">${highlightMatch(m.text.slice(0,160), qtrim)}</div>`;
    div.tabIndex = 0;
    div.addEventListener('click', ()=>{
      if (m.type === 'nav') {
        const navItem = getCurrentNavItems().find(n=>n.id===m.id);
        if (navItem) selectItem(navItem);
      }
      document.getElementById('search-results').innerHTML='';
      document.getElementById('search-input').value='';
    });
    div.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') div.click(); });
    resultsEl.appendChild(div);
  });
}

function modeSpecificContent() {
  const mode = getMode();
  if (mode === 'engineer') {
    return `<div class="engineer-tools"><h3>Engineer Tools</h3><p>Extra diagnostics and logs available in engineer mode.</p><p class="engineer-name">Engineer: ${ENGINEER_NAME}</p></div>`;
  }
  return '';
}

function getMode() {
  return document.body.classList.contains('engineer') ? 'engineer' : 'user';
}

function setupModeToggle() {
  const checkbox = document.getElementById('mode-checkbox');
  const leftLabel = document.getElementById('mode-label-left');
  const rightLabel = document.getElementById('mode-label-right');

  function updateModeState(isEngineer) {
    if (isEngineer) {
      document.body.classList.add('engineer');
      if (leftLabel && leftLabel.classList) leftLabel.classList.remove('active');
      if (rightLabel && rightLabel.classList) rightLabel.classList.add('active');
    } else {
      document.body.classList.remove('engineer');
      if (rightLabel && rightLabel.classList) rightLabel.classList.remove('active');
      if (leftLabel && leftLabel.classList) leftLabel.classList.add('active');
    }
    renderNav();
    const mainPanel = document.getElementById('main-panel');
    const title = mainPanel.querySelector('h2');
    const lead = mainPanel.querySelector('p');
    if (title) title.textContent = 'Welcome';
    if (lead) lead.textContent = `This portal is in ${isEngineer ? 'engineer' : 'user'} mode.`;

    if (isEngineer) {
      if (!mainPanel.querySelector('.engineer-tools')) {
        mainPanel.insertAdjacentHTML('beforeend', modeSpecificContent());
      }
    } else {
      const engineerInfo = mainPanel.querySelector('.engineer-tools');
      if (engineerInfo) engineerInfo.remove();
    }

    buildIndex();
  }

  checkbox.addEventListener('change', () => updateModeState(checkbox.checked));
  // initialize state based on checkbox
  updateModeState(checkbox.checked);
}

function initAdvisory() {
  const track = document.getElementById('advisory-track');
  // allow double click to pause/resume
  let paused = false;
  track.addEventListener('dblclick', () => {
    paused = !paused;
    track.style.animationPlayState = paused ? 'paused' : 'running';
  });
}

function isIPAddress(value) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function showCiscanOutput(message) {
  const output = document.getElementById('ciscan-output');
  output.textContent = message;
}

function ipToPtrName(ip) {
  return ip.split('.').reverse().join('.') + '.in-addr.arpa';
}

async function runDnsLookup(query) {
  if (!query) return showCiscanOutput('Enter an IP or hostname first.');
  showCiscanOutput('Resolving DNS records...');
  try {
    if (isIPAddress(query)) {
      const ptrName = ipToPtrName(query);
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(ptrName)}&type=PTR`);
      const data = await response.json();
      if (data.Status !== 0 || !data.Answer) {
        return showCiscanOutput(`Reverse DNS lookup for ${query} returned no PTR records.`);
      }
      const answers = data.Answer.map(a => `${a.name} PTR ${a.data}`).join('\n');
      showCiscanOutput(`Reverse DNS Lookup for ${query}:\n${answers}`);
      return;
    }

    const results = [];
    const queryTypes = ['A', 'AAAA'];
    for (const type of queryTypes) {
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=${type}`);
      const data = await response.json();
      if (data.Status === 0 && data.Answer) {
        results.push(...data.Answer.map(a => `${a.name} ${type} ${a.data}`));
      }
    }

    if (!results.length) {
      return showCiscanOutput(`Forward DNS lookup for ${query} returned no A or AAAA records.`);
    }

    showCiscanOutput(`Forward DNS Lookup for ${query}:\n${results.join('\n')}`);
  } catch (error) {
    showCiscanOutput(`DNS lookup failed: ${error.message}`);
  }
}

async function runOwnerLookup(query) {
  if (!query) return showCiscanOutput('Enter an IP or hostname first.');
  showCiscanOutput('Resolving owner information...');
  try {
    let ip = query;
    if (!isIPAddress(query)) {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=A`);
      const json = await dnsRes.json();
      if (json.Answer && json.Answer.length > 0) {
        ip = json.Answer.find(a => a.type === 1)?.data || json.Answer[0].data;
      }
    }
    const ownerResp = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    const owner = await ownerResp.json();
    if (owner.error) {
      showCiscanOutput(`Owner lookup completed for ${query}:\nNo owner information available.`);
      return;
    }
    showCiscanOutput(`Owner info for ${query}:\nIP: ${ip}\nOrganization: ${owner.org || 'N/A'}\nASN: ${owner.asn || 'N/A'}\nCity: ${owner.city || 'N/A'}\nRegion: ${owner.region || 'N/A'}\nCountry: ${owner.country_name || 'N/A'}`);
  } catch (error) {
    showCiscanOutput(`Owner lookup failed: ${error.message}`);
  }
}

function runPing(query) {
  if (!query) return showCiscanOutput('Enter an IP or hostname first.');
  const lines = ['Pinging ' + query + ' with 32 bytes of data:'];
  for (let i = 0; i < 4; i++) {
    const ms = 15 + Math.floor(Math.random() * 40);
    lines.push(`Reply from ${query}: bytes=32 time=${ms}ms TTL=${56 + i}`);
  }
  lines.push('Ping statistics for ' + query + ':');
  lines.push('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)');
  showCiscanOutput(lines.join('\n'));
}

function runTracert(query) {
  if (!query) return showCiscanOutput('Enter an IP or hostname first.');
  const hops = [
    '  1    <1 ms    <1 ms    <1 ms  10.0.0.1',
    '  2     5 ms     4 ms     5 ms  172.16.0.1',
    '  3    10 ms     9 ms    10 ms  203.0.113.5',
    '  4    18 ms    17 ms    19 ms  198.51.100.2',
    `  5    23 ms    22 ms    23 ms  ${query}`
  ];
  showCiscanOutput(`Tracing route to ${query}\nover a maximum of 30 hops:\n\n${hops.join('\n')}`);
}

function runTrafficCheck(src, dest, port) {
  if (!src || !dest || !port) {
    return document.getElementById('traffic-output').textContent = 'Enter source IP, destination IP, and port.';
  }
  const denyPorts = [22, 23, 445, 3389];
  const allowPorts = [80, 443, 53, 123];
  const sameSubnet = src.split('.').slice(0,3).join('.') === dest.split('.').slice(0,3).join('.');
  const action = denyPorts.includes(port) ? 'DENY' : (allowPorts.includes(port) || sameSubnet ? 'ALLOW' : 'DENY');
  const details = [];
  details.push(`Traffic check result for ${src} -> ${dest}:${port}`);
  details.push('-------------------------------------------');
  details.push(`Source: ${src}`);
  details.push(`Destination: ${dest}`);
  details.push(`Port: ${port}`);
  details.push(`Protocol: TCP`);
  details.push(`Rule applied: ${action === 'ALLOW' ? 'trusted/internal or permitted service' : 'blocked by security policy'}`);
  details.push(`Decision: ${action}`);
  details.push(`Notes: ${action === 'ALLOW' ? 'Traffic is allowed by current policy rules.' : 'Traffic is denied based on configured port restrictions.'}`);
  document.getElementById('traffic-output').textContent = details.join('\n');
}

const FIREWALL_RULES = [
  { id: 'R1', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'ALLOW', comment: 'Web access', hitCount: 120, enabled: true },
  { id: 'R2', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'ALLOW', comment: 'Duplicate rule', hitCount: 90, enabled: true },
  { id: 'R3', src: '10.0.1.0/24', dest: '192.168.5.0/24', service: 'SSH', action: 'DENY', comment: '', hitCount: 0, enabled: true },
  { id: 'R4', src: '10.0.1.100/32', dest: '172.16.0.10/32', service: 'HTTPS', action: 'ALLOW', comment: 'Application server', hitCount: 55, enabled: true },
  { id: 'R5', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'DENY', comment: 'Shadowed by earlier allow', hitCount: 5, enabled: true },
  { id: 'R6', src: '10.0.2.0/24', dest: '192.168.5.0/24', service: 'DNS', action: 'ALLOW', comment: 'Core name service', hitCount: 8, enabled: true },
  { id: 'R7', src: '10.0.9.0/24', dest: '10.0.10.0/24', service: 'HTTPS', action: 'ALLOW', comment: 'Unused rule', hitCount: 0, enabled: true },
];

const FIREWALL_OBJECTS = [
  { name: 'WEB_SERVERS', type: 'network', value: '172.16.0.0/16' },
  { name: 'APP_SERVER', type: 'host', value: '172.16.0.10' },
  { name: 'SSH_HOSTS', type: 'network', value: '192.168.5.0/24' },
  { name: 'OLD_RANGE', type: 'network', value: '10.1.1.0/24' },
  { name: 'WEB_SERVERS_COPY', type: 'network', value: '172.16.0.0/16' }
];

let lastFirewallScan = { type: null, findings: [] };

function setFirewallOutput(lines, type) {
  lastFirewallScan = { type, findings: lines };
  document.getElementById('firewall-output').textContent = lines.join('\n');
}

function getUnusedFirewallLines() {
  const usedValues = new Set(FIREWALL_RULES.flatMap(rule => [rule.src, rule.dest]));
  const unusedObjects = FIREWALL_OBJECTS.filter(obj => !usedValues.has(obj.value));
  const unusedRules = FIREWALL_RULES.filter(rule => rule.enabled && rule.hitCount === 0);

  const lines = [];
  if (unusedObjects.length) {
    lines.push('Unused firewall objects:');
    unusedObjects.forEach(obj => lines.push(`- ${obj.name} (${obj.type}) ${obj.value}`));
  } else {
    lines.push('No unused firewall objects detected.');
  }
  lines.push('');
  if (unusedRules.length) {
    lines.push('Unused firewall rules (no traffic hits):');
    unusedRules.forEach(rule => lines.push(`- ${rule.id}: ${rule.src} -> ${rule.dest} ${rule.service} ${rule.action}`));
  } else {
    lines.push('No unused firewall rules detected.');
  }
  return lines;
}

function getDuplicateRuleLines() {
  const ruleMap = new Map();
  FIREWALL_RULES.forEach(rule => {
    const key = `${rule.src}|${rule.dest}|${rule.service}|${rule.action}`;
    if (!ruleMap.has(key)) ruleMap.set(key, []);
    ruleMap.get(key).push(rule.id);
  });
  const lines = [];
  const duplicates = [];
  ruleMap.forEach((ids, key) => {
    if (ids.length > 1) duplicates.push({ key, ids });
  });
  if (duplicates.length) {
    lines.push('Duplicate firewall rules detected:');
    duplicates.forEach(item => lines.push(`- ${item.key}: ${item.ids.join(', ')}`));
  } else {
    lines.push('No duplicate firewall rules detected.');
  }
  return lines;
}

function getShadowedRuleLines() {
  const shadows = [];
  for (let i = 0; i < FIREWALL_RULES.length; i += 1) {
    const rule = FIREWALL_RULES[i];
    for (let j = 0; j < i; j += 1) {
      const prior = FIREWALL_RULES[j];
      if (prior.src === rule.src && prior.dest === rule.dest && prior.service === rule.service && prior.action !== rule.action) {
        shadows.push(`Rule ${rule.id} may be shadowed by ${prior.id} (${prior.action} vs ${rule.action})`);
        break;
      }
    }
  }
  return shadows.length ? ['Shadowed rules:'].concat(shadows.map(item => `- ${item}`)) : ['No shadowed rules detected.'];
}

function getDuplicateObjectLines() {
  const objMap = new Map();
  FIREWALL_OBJECTS.forEach(obj => {
    const key = `${obj.type}|${obj.value}`;
    if (!objMap.has(key)) objMap.set(key, []);
    objMap.get(key).push(obj.name);
  });
  const lines = [];
  const duplicates = [];
  objMap.forEach((names, key) => {
    if (names.length > 1) duplicates.push({ key, names });
  });
  if (duplicates.length) {
    lines.push('Duplicate firewall objects:');
    duplicates.forEach(item => lines.push(`- ${item.key}: ${item.names.join(', ')}`));
  } else {
    lines.push('No duplicate firewall objects detected.');
  }
  return lines;
}

function findUnusedFirewallItems() {
  document.getElementById('firewall-output').textContent = getUnusedFirewallLines().join('\n');
}

function findShadowedRules() {
  document.getElementById('firewall-output').textContent = getShadowedRuleLines().join('\n');
}

function findDuplicateObjects() {
  document.getElementById('firewall-output').textContent = getDuplicateObjectLines().join('\n');
}

function runSanitizationScan() {
  const lines = [];
  lines.push('=== Firewall Sanitization Scan ===');
  lines.push('');
  lines.push(...getUnusedFirewallLines());
  lines.push('');
  lines.push(...getShadowedRuleLines());
  lines.push('');
  lines.push(...getDuplicateObjectLines());
  document.getElementById('firewall-output').textContent = lines.join('\n');
}

function runComplianceScan() {
  const issues = [];
  const noComment = FIREWALL_RULES.filter(rule => !rule.comment.trim()).map(rule => rule.id);
  if (noComment.length) {
    issues.push(`Rules missing comments: ${noComment.join(', ')}`);
  }
  const blockedToUnused = FIREWALL_RULES.filter(rule => rule.action === 'DENY' && rule.service === 'DNS').length;
  if (blockedToUnused) {
    issues.push('Review DNS deny rules for possible overblocking.');
  }
  if (!issues.length) {
    issues.push('Firewall compliance scan passed. No issues found.');
  }
  setFirewallOutput(['Firewall compliance issues:'].concat(issues.map(issue => `- ${issue}`)), 'compliance');
}

function applyFirewallActions() {
  const lines = ['=== Firewall Action Plan ===', ''];
  const usedValues = new Set(FIREWALL_RULES.flatMap(rule => [rule.src, rule.dest]));
  const unusedObjects = FIREWALL_OBJECTS.filter(obj => !usedValues.has(obj.value));
  const unusedRules = FIREWALL_RULES.filter(rule => rule.enabled && rule.hitCount === 0);

  if (unusedObjects.length) {
    lines.push('Unused firewall objects identified:');
    unusedObjects.forEach(obj => lines.push(`- ${obj.name} (${obj.type}) ${obj.value} — recommend removal from policy`));
    lines.push('');
  }

  if (unusedRules.length) {
    lines.push('Unused firewall rules identified:');
    unusedRules.forEach(rule => {
      lines.push(`- ${rule.id}: ${rule.src} -> ${rule.dest} ${rule.service} ${rule.action} — disabling rule as unused`);
      rule.enabled = false;
    });
    lines.push('');
  }

  const shadowed = [];
  for (let i = 0; i < FIREWALL_RULES.length; i += 1) {
    const rule = FIREWALL_RULES[i];
    for (let j = 0; j < i; j += 1) {
      const prior = FIREWALL_RULES[j];
      if (prior.src === rule.src && prior.dest === rule.dest && prior.service === rule.service && prior.action !== rule.action) {
        shadowed.push({ rule, prior });
        break;
      }
    }
  }
  if (shadowed.length) {
    lines.push('Shadowed rules identified:');
    shadowed.forEach(item => lines.push(`- ${item.rule.id} may be shadowed by ${item.prior.id} — flag for cleanup or reorder`));
    lines.push('');
  }

  const duplicateGroups = [];
  const ruleMap = new Map();
  FIREWALL_RULES.forEach(rule => {
    const key = `${rule.src}|${rule.dest}|${rule.service}|${rule.action}`;
    if (!ruleMap.has(key)) ruleMap.set(key, []);
    ruleMap.get(key).push(rule);
  });
  ruleMap.forEach(rules => {
    if (rules.length > 1) duplicateGroups.push(rules);
  });

  if (duplicateGroups.length) {
    lines.push('Duplicate firewall rules identified:');
    duplicateGroups.forEach(group => {
      const keep = group[0];
      group.slice(1).forEach(rule => {
        lines.push(`- ${rule.id} duplicates ${keep.id} — consider removing or consolidating`);
      });
    });
  }

  if (lines.length === 2) {
    lines.push('No automated actions required. Firewall policy appears compliant with current sample dataset.');
  }

  setFirewallOutput(lines, 'action');
}

function setupCiscanControls() {
  document.getElementById('dns-btn').addEventListener('click', () => runDnsLookup(document.getElementById('ciscan-input').value.trim()));
  document.getElementById('owner-btn').addEventListener('click', () => runOwnerLookup(document.getElementById('ciscan-input').value.trim()));
  document.getElementById('ping-btn').addEventListener('click', () => runPing(document.getElementById('ciscan-input').value.trim()));
  document.getElementById('tracert-btn').addEventListener('click', () => runTracert(document.getElementById('ciscan-input').value.trim()));
  document.getElementById('traffic-btn').addEventListener('click', () => runTrafficCheck(
    document.getElementById('traffic-src').value.trim(),
    document.getElementById('traffic-dest').value.trim(),
    Number(document.getElementById('traffic-port').value)
  ));
  document.getElementById('unused-fw-btn').addEventListener('click', () => findUnusedFirewallItems());
  document.getElementById('shadowed-fw-btn').addEventListener('click', () => findShadowedRules());
  document.getElementById('duplicate-fw-btn').addEventListener('click', () => findDuplicateObjects());
  document.getElementById('sanitization-fw-btn').addEventListener('click', () => runSanitizationScan());
  document.getElementById('compliance-fw-btn').addEventListener('click', () => runComplianceScan());
  document.getElementById('fw-action-btn').addEventListener('click', () => applyFirewallActions());
}

function initPortalApp() {
  renderNav();
  setupModeToggle();
  initAdvisory();
  setupCiscanControls();

  // search wiring
  buildIndex();
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  let timer = null;
  if (input) {
    input.addEventListener('input', (e)=>{
      clearTimeout(timer);
      timer = setTimeout(()=> performSearch(e.target.value), 150);
    });
    input.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') { input.value=''; resultsEl.innerHTML=''; }
    });
  }

  // click outside to close results
  document.addEventListener('click', (ev)=>{
    if (!ev.target.closest('.search-container')) resultsEl.innerHTML='';
  });

  // Ensure the three tool panels are grouped into a `.panel-row` so CSS
  // can display them side-by-side reliably across browsers.
  (function wrapToolPanels(){
    const main = document.getElementById('main-panel');
    if (!main) return;
    const cis = main.querySelector('.ciscan-panel');
    const traf = main.querySelector('.traffic-panel');
    const fw = main.querySelector('.firewall-panel');
    if (cis && traf && fw) {
      if (cis.parentElement && cis.parentElement.classList && cis.parentElement.classList.contains('panel-row')) return;
      const row = document.createElement('div');
      row.className = 'panel-row';
      main.insertBefore(row, cis);
      row.appendChild(cis);
      row.appendChild(traf);
      row.appendChild(fw);
    }
  })();

  // --- Security chatbot (SIMPLIFIED FOR DEBUG) ---
  window._chatDebug = { step: 'init' };

  const chatForm = document.getElementById('chat-form');
  window._chatDebug.chatFormExists = !!chatForm;

  if (chatForm) {
    window._chatDebug.step = 'attaching listener';
    window._chatFormListenerAttached = true;
    chatForm.addEventListener('submit', (e)=>{
      window._chatDebug.step = 'submit fired';
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const msgs = document.getElementById('chat-messages');
      if (!input || !msgs) return;

      const q = input.value.trim();
      if (!q) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'chat-message user';
      userMsg.innerHTML = '<div class="bubble">' + q + '</div>';
      msgs.appendChild(userMsg);

      input.value = '';

      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      botMsg.innerHTML = '<div class="bubble">I received your message: ' + q + '</div>';
      msgs.appendChild(botMsg);
    });
    window._chatDebug.step = 'listener attached';
  }

  const chatToggle = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', ()=>{
      const input = document.getElementById('chat-input');
      if (input) input.focus();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortalApp);
} else {
  initPortalApp();
}

