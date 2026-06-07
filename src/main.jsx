import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

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

const SHORTCUTS = ['ServiceNow', 'WellMed', 'Logs SEET', 'Proxy Master List', 'Push List', 'Trainings', 'Mock WRS', 'Onboarding', 'FW Delivery', 'Smart Pay', 'Sparq', 'HR', 'Learning Portal'];

const FAQS = [
  ['How do I request a firewall rule change?', 'Submit a request through RITM with source, destination, service, and business justification. The security team reviews it and applies approved changes.'],
  ['How can I verify if traffic is blocked?', 'Use the Traffic Check tool to simulate the source, destination, and port. If the portal shows "denied," the firewall policy currently blocks that flow.'],
  ['Who do I contact for a security incident?', 'Contact the Security Operations Center and your on-call engineer immediately. For urgent issues, escalate through the war room and incident channels.']
];

const MONITORING_ALERTS = [
  ['Alert 1: CPU utilization spike', 'CPU utilization exceeded 90% on app-server-01 and may affect service response times.'],
  ['Alert 2: Memory usage spike', 'Memory usage on db-node-03 is above threshold and may lead to paging or slow queries.'],
  ['Alert 3: Disk I/O latency', 'Storage cluster is seeing elevated read/write latency that could impact backups and batch jobs.'],
  ['Alert 4: Failed deployment event', 'A recent production deployment failed in the pipeline and requires rollback review.'],
  ['Alert 5: High auth API error rate', 'Authentication API is returning an unusual error rate, potentially causing login issues.'],
  ['Alert 6: Network packet loss', 'Packet loss detected on VLAN 12, affecting VPN and remote access traffic.'],
  ['Alert 7: Cache service restart loop', 'Cache cluster nodes are restarting repeatedly, which may destabilize session handling.'],
  ['Alert 8: Database timeout', 'Billing service is experiencing database connection timeouts, impacting transaction processing.'],
  ['Alert 9: Unauthorized access blocked', 'WAF blocked an unauthorized access attempt, indicating potential probing activity.'],
  ['Alert 10: SSL expiration warning', 'portal.optum.com SSL certificate is nearing expiration and should be renewed soon.']
];

const INITIAL_FIREWALL_RULES = [
  { id: 'R1', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'ALLOW', comment: 'Web access', hitCount: 120, enabled: true },
  { id: 'R2', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'ALLOW', comment: 'Duplicate rule', hitCount: 90, enabled: true },
  { id: 'R3', src: '10.0.1.0/24', dest: '192.168.5.0/24', service: 'SSH', action: 'DENY', comment: '', hitCount: 0, enabled: true },
  { id: 'R4', src: '10.0.1.100/32', dest: '172.16.0.10/32', service: 'HTTPS', action: 'ALLOW', comment: 'Application server', hitCount: 55, enabled: true },
  { id: 'R5', src: '10.0.1.0/24', dest: '172.16.0.0/16', service: 'HTTP', action: 'DENY', comment: 'Shadowed by earlier allow', hitCount: 5, enabled: true },
  { id: 'R6', src: '10.0.2.0/24', dest: '192.168.5.0/24', service: 'DNS', action: 'ALLOW', comment: 'Core name service', hitCount: 8, enabled: true },
  { id: 'R7', src: '10.0.9.0/24', dest: '10.0.10.0/24', service: 'HTTPS', action: 'ALLOW', comment: 'Unused rule', hitCount: 0, enabled: true }
];

const FIREWALL_OBJECTS = [
  { name: 'WEB_SERVERS', type: 'network', value: '172.16.0.0/16' },
  { name: 'APP_SERVER', type: 'host', value: '172.16.0.10' },
  { name: 'SSH_HOSTS', type: 'network', value: '192.168.5.0/24' },
  { name: 'OLD_RANGE', type: 'network', value: '10.1.1.0/24' },
  { name: 'WEB_SERVERS_COPY', type: 'network', value: '172.16.0.0/16' }
];

function isIPAddress(value) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function isValidCiscanTarget(query) {
  return /^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$|^(?:\d{1,3}\.){3}\d{1,3}$/.test(query);
}

function ipToPtrName(ip) {
  return `${ip.split('.').reverse().join('.')}.in-addr.arpa`;
}

function highlightParts(text, query) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="search-hit">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

function getUnusedFirewallLines(rules) {
  const usedValues = new Set(rules.flatMap(rule => [rule.src, rule.dest]));
  const unusedObjects = FIREWALL_OBJECTS.filter(obj => !usedValues.has(obj.value));
  const unusedRules = rules.filter(rule => rule.enabled && rule.hitCount === 0);
  const lines = [];

  lines.push(unusedObjects.length ? 'Unused firewall objects:' : 'No unused firewall objects detected.');
  unusedObjects.forEach(obj => lines.push(`- ${obj.name} (${obj.type}) ${obj.value}`));
  lines.push('');
  lines.push(unusedRules.length ? 'Unused firewall rules (no traffic hits):' : 'No unused firewall rules detected.');
  unusedRules.forEach(rule => lines.push(`- ${rule.id}: ${rule.src} -> ${rule.dest} ${rule.service} ${rule.action}`));
  return lines;
}

function getShadowedRuleLines(rules) {
  const shadows = [];
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    for (let j = 0; j < i; j += 1) {
      const prior = rules[j];
      if (prior.src === rule.src && prior.dest === rule.dest && prior.service === rule.service && prior.action !== rule.action) {
        shadows.push(`Rule ${rule.id} may be shadowed by ${prior.id} (${prior.action} vs ${rule.action})`);
        break;
      }
    }
  }
  return shadows.length ? ['Shadowed rules:', ...shadows.map(item => `- ${item}`)] : ['No shadowed rules detected.'];
}

function getDuplicateObjectLines() {
  const map = new Map();
  FIREWALL_OBJECTS.forEach(obj => {
    const key = `${obj.type}|${obj.value}`;
    map.set(key, [...(map.get(key) || []), obj.name]);
  });
  const duplicates = [...map.entries()].filter(([, names]) => names.length > 1);
  return duplicates.length ? ['Duplicate firewall objects:', ...duplicates.map(([key, names]) => `- ${key}: ${names.join(', ')}`)] : ['No duplicate firewall objects detected.'];
}

function getDuplicateRuleLines(rules) {
  const map = new Map();
  rules.forEach(rule => {
    const key = `${rule.src}|${rule.dest}|${rule.service}|${rule.action}`;
    map.set(key, [...(map.get(key) || []), rule.id]);
  });
  const duplicates = [...map.entries()].filter(([, ids]) => ids.length > 1);
  return duplicates.length ? ['Duplicate firewall rules detected:', ...duplicates.map(([key, ids]) => `- ${key}: ${ids.join(', ')}`)] : ['No duplicate firewall rules detected.'];
}

function Header({ isEngineer, setIsEngineer }) {
  return (
    <header>
      <div className="header-top">
        <div className="brand">
          <div className="brand-text">
            <div className="brand-name">OPTUM</div>
            <div className="brand-tagline">CDS Central Portal</div>
          </div>
        </div>
        <div className="mode-toggle">
          <span className={`mode-label left ${isEngineer ? '' : 'active'}`}>User</span>
          <label className="switch">
            <input type="checkbox" checked={isEngineer} onChange={event => setIsEngineer(event.target.checked)} />
            <span className="slider"></span>
          </label>
          <span className={`mode-label right ${isEngineer ? 'active' : ''}`}>Engineer</span>
        </div>
      </div>
      <div className="advisory-scroll" aria-hidden="false">
        <div className="advisory-track">Important advisory: System maintenance tonight 23:00 UTC - expect brief interruptions. * New security policy v2.1 published. * Contact ops for emergency access.</div>
      </div>
    </header>
  );
}

function Navigation({ navItems, onSelect, searchIndex }) {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  const matches = useMemo(() => {
    if (!trimmedQuery) return [];
    return searchIndex
      .map(item => {
        const idx = item.text.toLowerCase().indexOf(trimmedQuery.toLowerCase());
        return idx >= 0 ? { item, idx } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.idx - b.idx)
      .map(match => match.item);
  }, [searchIndex, trimmedQuery]);

  function chooseResult(result) {
    if (result.type === 'nav') {
      const navItem = navItems.find(item => item.id === result.id);
      if (navItem) onSelect(navItem);
    }
    setQuery('');
  }

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <div className="nav-content">
        <div className="nav-buttons">
          {navItems.map(item => <button key={item.id} type="button" onClick={() => onSelect(item)}>{item.label}</button>)}
        </div>
        <div className="nav-search search-container">
          <input id="search-input" type="search" placeholder="Search the portal..." aria-label="Search the portal" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => event.key === 'Escape' && setQuery('')} />
          {matches.length > 0 && (
            <div className="search-results" role="listbox" aria-label="Search results">
              {matches.map(result => (
                <div key={`${result.type}-${result.id}`} role="option" tabIndex="0" onClick={() => chooseResult(result)} onKeyDown={event => event.key === 'Enter' && chooseResult(result)}>
                  <strong>{highlightParts(result.label, trimmedQuery)}</strong>
                  <div className="search-result-copy">{highlightParts(result.text.slice(0, 160), trimmedQuery)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function ShortcutPanel() {
  return (
    <aside className="shortcut-panel" aria-label="Engineer shortcuts">
      <h2>Engineer Shortcuts</h2>
      <div className="shortcut-grid">
        {SHORTCUTS.map(shortcut => <a href="#" key={shortcut}>{shortcut}</a>)}
      </div>
    </aside>
  );
}

function FaqPanel() {
  return (
    <section className="faq-panel" aria-label="User FAQ">
      <h3>Frequently Asked Questions</h3>
      <div className="faq-list">
        {FAQS.map(([question, answer], index) => (
          <details className="faq-item" key={question}>
            <summary>
              <span className="faq-icon">{index + 1}</span>
              <span className="faq-title">{question}</span>
              <span className="faq-toggle">+</span>
            </summary>
            <div className="faq-answer">{answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function CiscanPanel() {
  const [target, setTarget] = useState('');
  const [output, setOutput] = useState('');
  const activeNetworkStream = useRef(null);

  useEffect(() => () => {
    if (activeNetworkStream.current) activeNetworkStream.current.close();
  }, []);

  async function runDnsLookup() {
    const query = target.trim();
    if (!query) return setOutput('Enter an IP or hostname first.');
    setOutput('Resolving DNS records...');
    try {
      if (isIPAddress(query)) {
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(ipToPtrName(query))}&type=PTR`);
        const data = await response.json();
        if (data.Status !== 0 || !data.Answer) return setOutput(`Reverse DNS lookup for ${query} returned no PTR records.`);
        return setOutput(`Reverse DNS Lookup for ${query}:\n${data.Answer.map(answer => `${answer.name} PTR ${answer.data}`).join('\n')}`);
      }

      const results = [];
      for (const type of ['A', 'AAAA']) {
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=${type}`);
        const data = await response.json();
        if (data.Status === 0 && data.Answer) results.push(...data.Answer.map(answer => `${answer.name} ${type} ${answer.data}`));
      }
      setOutput(results.length ? `Forward DNS Lookup for ${query}:\n${results.join('\n')}` : `Forward DNS lookup for ${query} returned no A or AAAA records.`);
    } catch (error) {
      setOutput(`DNS lookup failed: ${error.message}`);
    }
  }

  async function runOwnerLookup() {
    const query = target.trim();
    if (!query) return setOutput('Enter an IP or hostname first.');
    setOutput('Resolving owner information...');
    try {
      let ip = query;
      if (!isIPAddress(query)) {
        const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(query)}&type=A`);
        const json = await dnsRes.json();
        if (json.Answer?.length > 0) ip = json.Answer.find(answer => answer.type === 1)?.data || json.Answer[0].data;
      }
      const ownerResp = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
      const owner = await ownerResp.json();
      if (owner.error) return setOutput(`Owner lookup completed for ${query}:\nNo owner information available.`);
      setOutput(`Owner info for ${query}:\nIP: ${ip}\nOrganization: ${owner.org || 'N/A'}\nASN: ${owner.asn || 'N/A'}\nCity: ${owner.city || 'N/A'}\nRegion: ${owner.region || 'N/A'}\nCountry: ${owner.country_name || 'N/A'}`);
    } catch (error) {
      setOutput(`Owner lookup failed: ${error.message}`);
    }
  }

  function runNetworkUtility(tool) {
    const query = target.trim();
    if (!query) return setOutput('Enter an IP or hostname first.');
    if (!isValidCiscanTarget(query)) return setOutput('Enter a valid hostname or IPv4 address. Do not include protocol, path, or spaces.');
    if (activeNetworkStream.current) activeNetworkStream.current.close();

    setOutput('');
    const source = new EventSource(`/api/network/${tool}?target=${encodeURIComponent(query)}`);
    activeNetworkStream.current = source;
    ['status', 'output', 'done', 'error'].forEach(eventName => {
      source.addEventListener(eventName, event => {
        if (eventName === 'error' && !event.data) {
          setOutput(prev => `${prev}\nConnection to network utility stream failed. Start the API server with npm run server so the local server can run Windows utilities.`);
          source.close();
          activeNetworkStream.current = null;
          return;
        }
        const data = JSON.parse(event.data);
        setOutput(prev => `${prev}${eventName === 'status' ? `${data.text}\n\n` : data.text}`);
        if (eventName === 'done' || eventName === 'error') {
          source.close();
          activeNetworkStream.current = null;
        }
      });
    });
  }

  return (
    <section className="ciscan-panel" aria-label="CIScan tool">
      <h3>CIScan Tool</h3>
      <p>Enter an IP address or hostname and run DNS lookup, owner lookup, ping, or tracert.</p>
      <div className="ciscan-inputs">
        <input type="text" placeholder="Enter IP or hostname" aria-label="CIScan target" value={target} onChange={event => setTarget(event.target.value)} />
        <button type="button" onClick={runDnsLookup}>DNS Lookup</button>
        <button type="button" onClick={runOwnerLookup}>Owner</button>
        <button type="button" onClick={() => runNetworkUtility('ping')}>Ping</button>
        <button type="button" onClick={() => runNetworkUtility('tracert')}>Tracert</button>
      </div>
      <div className="ciscan-output" aria-live="polite">{output}</div>
    </section>
  );
}

function TrafficPanel() {
  const [sourceIp, setSourceIp] = useState('');
  const [destinationIp, setDestinationIp] = useState('');
  const [port, setPort] = useState('');
  const [output, setOutput] = useState('');

  function runTrafficCheck() {
    const numericPort = Number(port);
    if (!sourceIp.trim() || !destinationIp.trim() || !numericPort) return setOutput('Enter source IP, destination IP, and port.');
    const denyPorts = [22, 23, 445, 3389];
    const allowPorts = [80, 443, 53, 123];
    const sameSubnet = sourceIp.split('.').slice(0, 3).join('.') === destinationIp.split('.').slice(0, 3).join('.');
    const action = denyPorts.includes(numericPort) ? 'DENY' : (allowPorts.includes(numericPort) || sameSubnet ? 'ALLOW' : 'DENY');
    setOutput([`Traffic check result for ${sourceIp} -> ${destinationIp}:${numericPort}`, '-------------------------------------------', `Source: ${sourceIp}`, `Destination: ${destinationIp}`, `Port: ${numericPort}`, 'Protocol: TCP', `Rule applied: ${action === 'ALLOW' ? 'trusted/internal or permitted service' : 'blocked by security policy'}`, `Decision: ${action}`, `Notes: ${action === 'ALLOW' ? 'Traffic is allowed by current policy rules.' : 'Traffic is denied based on configured port restrictions.'}`].join('\n'));
  }

  return (
    <section className="traffic-panel" aria-label="Traffic check tool">
      <h3>Traffic Check Tool</h3>
      <p>Enter source IP, destination IP, and port to see whether traffic is allowed or denied.</p>
      <div className="traffic-inputs">
        <input type="text" placeholder="Source IP" aria-label="Traffic source IP" value={sourceIp} onChange={event => setSourceIp(event.target.value)} />
        <input type="text" placeholder="Destination IP" aria-label="Traffic destination IP" value={destinationIp} onChange={event => setDestinationIp(event.target.value)} />
        <input type="number" placeholder="Port" aria-label="Traffic port" value={port} onChange={event => setPort(event.target.value)} />
        <button type="button" onClick={runTrafficCheck}>Check Traffic</button>
      </div>
      <div className="traffic-output" aria-live="polite">{output}</div>
    </section>
  );
}

function FirewallPanel() {
  const [rules, setRules] = useState(INITIAL_FIREWALL_RULES);
  const [output, setOutput] = useState('');

  function runSanitizationScan() {
    setOutput(['=== Firewall Sanitization Scan ===', '', ...getUnusedFirewallLines(rules), '', ...getShadowedRuleLines(rules), '', ...getDuplicateObjectLines()].join('\n'));
  }

  function runComplianceScan() {
    const issues = [];
    const noComment = rules.filter(rule => !rule.comment.trim()).map(rule => rule.id);
    if (noComment.length) issues.push(`Rules missing comments: ${noComment.join(', ')}`);
    if (rules.filter(rule => rule.action === 'DENY' && rule.service === 'DNS').length) issues.push('Review DNS deny rules for possible overblocking.');
    if (!issues.length) issues.push('Firewall compliance scan passed. No issues found.');
    setOutput(['Firewall compliance issues:', ...issues.map(issue => `- ${issue}`)].join('\n'));
  }

  function applyFirewallActions() {
    const lines = ['=== Firewall Action Plan ===', ''];
    const usedValues = new Set(rules.flatMap(rule => [rule.src, rule.dest]));
    const unusedObjects = FIREWALL_OBJECTS.filter(obj => !usedValues.has(obj.value));
    const unusedRules = rules.filter(rule => rule.enabled && rule.hitCount === 0);
    if (unusedObjects.length) {
      lines.push('Unused firewall objects identified:');
      unusedObjects.forEach(obj => lines.push(`- ${obj.name} (${obj.type}) ${obj.value} - recommend removal from policy`));
      lines.push('');
    }
    if (unusedRules.length) {
      lines.push('Unused firewall rules identified:');
      unusedRules.forEach(rule => lines.push(`- ${rule.id}: ${rule.src} -> ${rule.dest} ${rule.service} ${rule.action} - disabling rule as unused`));
      lines.push('');
      setRules(currentRules => currentRules.map(rule => unusedRules.some(unused => unused.id === rule.id) ? { ...rule, enabled: false } : rule));
    }
    getShadowedRuleLines(rules).slice(1).forEach(line => lines.push(`${line} - flag for cleanup or reorder`));
    getDuplicateRuleLines(rules).slice(1).forEach(line => lines.push(`${line} - consider removing or consolidating`));
    if (lines.length === 2) lines.push('No automated actions required. Firewall policy appears compliant with current sample dataset.');
    setOutput(lines.join('\n'));
  }

  return (
    <section className="firewall-panel" aria-label="Firewall sanitization and compliance tools">
      <h3>Firewall Sanitization & Compliance</h3>
      <p>This engineer-only section detects unused firewall objects/rules, shadowed rules, duplicate objects/rules, and compliance issues.</p>
      <div className="firewall-inputs">
        <button type="button" onClick={runSanitizationScan}>Run Sanitization Scan</button>
        <button type="button" onClick={() => setOutput(getUnusedFirewallLines(rules).join('\n'))}>Find Unused Objects/Rules</button>
        <button type="button" onClick={() => setOutput(getShadowedRuleLines(rules).join('\n'))}>Find Shadowed Rules</button>
        <button type="button" onClick={() => setOutput(getDuplicateObjectLines().join('\n'))}>Find Duplicate Objects/Rules</button>
        <button type="button" onClick={runComplianceScan}>FW Compliance Scan</button>
      </div>
      <div className="firewall-actions">
        <button type="button" onClick={applyFirewallActions}>Apply Recommended Actions</button>
      </div>
      <div className="firewall-output" aria-live="polite">{output}</div>
    </section>
  );
}

function MonitoringPanel() {
  return (
    <section className="monitoring-panel" aria-label="Glass Monitoring">
      <div className="monitoring-header">
        <h3>Glass Monitoring</h3>
        <p>Live top alerts for engineers.</p>
      </div>
      {MONITORING_ALERTS.map(([title, description]) => (
        <div className="monitoring-item" key={title}>
          <div className="monitoring-item-title">{title}</div>
          <div className="monitoring-item-desc">{description}</div>
        </div>
      ))}
    </section>
  );
}

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);

  function submitMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages(current => current.concat([
      { id: `${Date.now()}-user`, from: 'user', text },
      { id: `${Date.now()}-bot`, from: 'bot', text: `I received your message: ${text}` }
    ]));
    setDraft('');
  }

  return (
    <div id="sec-chat" className="chat-widget" aria-hidden="false">
      <button className="chat-toggle" aria-expanded={isOpen} aria-label="Open CDS Assistant" onClick={() => setIsOpen(true)}>Chat</button>
      <div className={`chat-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <span>CDS Assistant</span>
          <button className="chat-close" aria-label="Close chat" onClick={() => setIsOpen(false)}>x</button>
        </div>
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map(message => (
            <div className={`chat-message ${message.from}`} key={message.id}>
              <div className="bubble">{message.text}</div>
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={submitMessage}>
          <input type="text" autoComplete="off" placeholder="Ask the CDS Assistant about firewall changes, traffic, or security policies..." value={draft} onChange={event => setDraft(event.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [isEngineer, setIsEngineer] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const navItems = isEngineer ? ENGINEER_NAV_ITEMS : USER_NAV_ITEMS;
  const title = selectedItem ? selectedItem.label : 'Welcome';
  const lead = selectedItem ? selectedItem.desc : `This portal is in ${isEngineer ? 'engineer' : 'user'} mode.`;

  useEffect(() => {
    document.body.classList.toggle('engineer', isEngineer);
    setSelectedItem(null);
  }, [isEngineer]);

  const searchIndex = useMemo(() => {
    const panelText = [title, lead, FAQS.map(([q, a]) => `${q} ${a}`).join(' '), 'CIScan Tool Traffic Check Tool Glass Monitoring Firewall Sanitization Compliance'].join(' ');
    return navItems.map(item => ({ type: 'nav', id: item.id, label: item.label, text: `${item.label} ${item.desc}` })).concat({ type: 'panel', id: 'main', label: title, text: panelText });
  }, [lead, navItems, title]);

  return (
    <>
      <Header isEngineer={isEngineer} setIsEngineer={setIsEngineer} />
      <Navigation navItems={navItems} onSelect={setSelectedItem} searchIndex={searchIndex} />
      <main>
        <section className="content container">
          <ShortcutPanel />
          <section className="main-panel" id="main-panel">
            <h2>{title}</h2>
            <p>{lead}</p>
            <FaqPanel />
            <div className="panel-row">
              <CiscanPanel />
              <TrafficPanel />
              <FirewallPanel />
            </div>
            {isEngineer && (
              <div className="engineer-tools">
                <h3>Engineer Tools</h3>
                <p>Extra diagnostics and logs available in engineer mode.</p>
                <p className="engineer-name">Engineer: {ENGINEER_NAME}</p>
              </div>
            )}
            <MonitoringPanel />
          </section>
        </section>
      </main>
      <footer>
        <p>&copy; 2026 OPTUM. All rights reserved.</p>
      </footer>
      <ChatWidget />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
