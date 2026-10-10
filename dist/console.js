let currentUser = null;
let state = {};
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const table = (heads, rows) => rows.length ? `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<div class="empty">No saved workflow events yet.</div>';

async function api(path, method='GET', payload) {
  const response = await fetch('/api' + path, {method, credentials:'same-origin', headers:payload ? {'Content-Type':'application/json'} : {}, body:payload ? JSON.stringify(payload) : undefined});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function notice(message) {
  const node = $('#notice');
  node.textContent = message;
  node.style.display = 'block';
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => node.style.display = 'none', 6000);
}

function render() {
  const auditRows = (state.audit || []).map(item => [escapeHtml(item.at?.slice(0, 19)), escapeHtml(item.actor_id || 'Provider / system'), escapeHtml(item.action), escapeHtml(item.target || '—')]);
  $('#content').innerHTML = `<div class="workflow-console">
    <section class="card workflow-planner">
      <span class="eyebrow">GEMINI PLANNER · DRAFT ONLY</span>
      <h2>What do you want to work on?</h2>
      <p>Describe a business goal. Gemini will propose reviewable steps without executing them.</p>
      <form id="agent-form">
        <label for="workflow-goal">Business goal</label>
        <textarea id="workflow-goal" name="goal" required maxlength="1000" placeholder="Plan a follow-up for webinar attendees"></textarea>
        <div class="workflow-form-foot"><span>Gemini: ${state.health.geminiConfigured ? 'ready' : 'not configured'}</span><button class="primary">Create draft</button></div>
      </form>
      <div id="agent-result" class="workflow-result" aria-live="polite"></div>
    </section>
    <div class="workflow-scope"><span>Authenticated demo account</span><span>Drafts cannot execute actions</span><span>Saved audit activity</span></div>
    <section class="card workflow-audit"><div class="panel-head"><div><h2>Activity</h2><p>Recent workflow and security events</p></div></div>${table(['TIME','ACTOR','ACTION','TARGET'], auditRows)}</section>
  </div>`;
}

async function refresh() {
  try {
    const [me, health, audit] = await Promise.all([api('/me'), api('/health'), api('/audit')]);
    currentUser = me.user;
    state = {health, audit:audit.audit};
    $('#login').hidden = true;
    $('#workspace').hidden = false;
    $('#identity').innerHTML = `<span>${escapeHtml(currentUser.name)}</span><button id="logout">Sign out</button>`;
    render();
  } catch (error) {
    if (error.message === 'Sign in required') {
      currentUser = null;
      $('#login').hidden = false;
      $('#workspace').hidden = true;
      $('#identity').innerHTML = '';
    } else notice(error.message);
  }
}

document.addEventListener('click', async event => {
  if (event.target.id !== 'logout') return;
  await api('/logout', 'POST');
  currentUser = null;
  await refresh();
});

document.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  try {
    if (event.target.id === 'login-form') {
      await api('/login', 'POST', {email:data.email, password:data.password});
      await refresh();
    }
    if (event.target.id === 'agent-form') {
      const result = await api('/agent/draft', 'POST', {goal:data.goal});
      $('#agent-result').textContent = result.draft;
      notice('Draft created; no action executed');
    }
  } catch (error) {
    notice(error.message);
  }
});

refresh();
