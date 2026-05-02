const API = '/api';
console.log("DASHBOARD SCRIPT LOADED - v10");
console.log("App Initialization sequence started");

let S = {
    token: sessionStorage.getItem('tk') || '',
    role: sessionStorage.getItem('rl') || '',
    user: JSON.parse(sessionStorage.getItem('u') || 'null'),
    tabId: sessionStorage.getItem('tab_id') || ''
};

// ── Init ──
function init() {
    console.log("App Init. Token:", !!S.token);
    if (!S.token) {
        goto('login');
        return;
    }
    renderDash();
}

// ── Navigation ──
function goto(screen) {
    ['login', 'register'].forEach(s => {
        const el = document.getElementById(s + '-screen');
        if (el) el.classList.toggle('hidden', s !== screen);
    });
    const dash = document.getElementById('dashboard-screen');
    if (dash) dash.classList.add('hidden');
}

function renderDash() {
    const login = document.getElementById('login-screen');
    const register = document.getElementById('register-screen');
    const dash = document.getElementById('dashboard-screen');
    const navAdmin = document.getElementById('nav-admin');

    if (login) login.classList.add('hidden');
    if (register) register.classList.add('hidden');
    if (dash) dash.classList.remove('hidden');

    const isAdmin = (S.role || '').toLowerCase() === 'admin';
    if (isAdmin && navAdmin) navAdmin.classList.remove('hidden');

    if (S.user) {
        const initials = (S.user.name || 'U').substring(0, 2).toUpperCase();
        const avatar = document.getElementById('sb-avatar');
        const name = document.getElementById('sb-name');
        const role = document.getElementById('sb-role');
        if (avatar) avatar.textContent = initials;
        if (name) name.textContent = S.user.name;
        if (role) role.textContent = S.role || 'member';
        const navTasksLabel = document.querySelector('.nav-item[onclick*="tasks"] span');
        if (navTasksLabel) navTasksLabel.textContent = isAdmin ? 'All Tasks' : 'My Tasks';
    }
    loadAll();
}

function switchView(view, btn) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');

    const titles = {
        overview: ['Overview', "Welcome back. Here's what needs attention."],
        tasks: ['My Tasks', 'All your assigned work in one place.'],
        admin: ['Admin Panel', 'Manage projects, tasks, and team members.']
    };

    const titleEl = document.getElementById('view-title');
    const subtitleEl = document.getElementById('view-subtitle');
    const secOverdue = document.getElementById('sec-overdue');
    const secTasks = document.getElementById('sec-tasks');
    const secAdmin = document.getElementById('sec-admin');

    if (titleEl) titleEl.textContent = titles[view][0];
    if (subtitleEl) subtitleEl.textContent = titles[view][1];

    if (secOverdue) secOverdue.classList.toggle('hidden', view !== 'overview');
    if (secTasks) secTasks.classList.toggle('hidden', view === 'admin');
    if (secAdmin) secAdmin.classList.toggle('hidden', view !== 'admin');

    if (view === 'admin') {
        loadAdmin();
    }
    loadAll();

    // Close mobile sidebar on selection
    if (window.innerWidth <= 900) {
        const layout = document.querySelector('.dash-layout');
        if (layout) layout.classList.remove('sidebar-open-mobile');
    }
}

// ── Auth ──
async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    if (!email || !pw) return toast('Enter email and password', 'error');

    setBtn('login-btn', true);
    try {
        const r = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pw })
        });

        let d = {};
        const text = await r.text();
        try {
            if (text) d = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error(`Server returned an invalid response (Status: ${r.status}). Please check backend logs.`);
        }

        if (!r.ok) {
            throw new Error(d.detail || `Login failed (Status: ${r.status})`);
        }

        S.token = d.access_token;
        S.role = d.role;
        S.user = { name: d.name || email.split('@')[0], email };
        S.tabId = 'active-' + Date.now();
        
        sessionStorage.setItem('tk', S.token);
        sessionStorage.setItem('rl', S.role);
        sessionStorage.setItem('u', JSON.stringify(S.user));
        sessionStorage.setItem('tab_id', S.tabId);

        renderDash();
        toast('Welcome back!', 'success');
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        setBtn('login-btn', false);
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-password').value;
    if (!name || !email || !pw) return toast('All fields required', 'error');

    setBtn('reg-btn', true);
    try {
        const r = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pw })
        });

        let d = {};
        const text = await r.text();
        try {
            if (text) d = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
        }

        if (!r.ok) {
            throw new Error(d.detail || `Registration failed (Status: ${r.status})`);
        }

        toast('Account created! Please sign in.', 'success');
        goto('login');
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        setBtn('reg-btn', false);
    }
}

function doLogout() {
    sessionStorage.clear();
    location.reload();
}

// ── Data ──
async function loadAll() {
    const secAdmin = document.getElementById('sec-admin');
    const isAdminView = secAdmin && !secAdmin.classList.contains('hidden');
    
    const isAdmin = S.role && S.role.toLowerCase() === 'admin';
    
    if (isAdmin) {
        // Admins see global stats in cards and global overdue list
        await Promise.all([
            loadAdminStats(),
            loadOverdue()
        ]);
        
        if (isAdminView) {
            await loadAdminTasks();
        } else {
            // In overview, admin sees all tasks for global visibility
            await loadAdminTasks();
        }
    } else {
        // Members see their own tasks
        await Promise.all([loadTasks(), loadOverdue()]);
    }
}

async function loadAdminStats() {
    try {
        const r = await fetch(`${API}/dashboard/admin-stats`, { headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) {
            updateStatsFromObj({});
            return;
        }
        const stats = await r.json();
        console.log("Admin Stats Loaded:", stats);
        updateStatsFromObj(stats);
    } catch (e) { 
        console.error("Admin Stats Error:", e);
        updateStatsFromObj({});
    }
}

async function loadAdminTasks() {
    try {
        const r = await fetch(`${API}/dashboard/all-tasks`, { headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) {
            if (r.status === 401) doLogout();
            return;
        }
        const tasks = (await r.json()) || [];
        const countEl = document.getElementById('tasks-count');
        if (countEl) countEl.textContent = tasks.length;
        renderTasks('tasks-list', tasks);
    } catch (e) { console.error("Admin tasks load error:", e); }
}

function updateStatsFromObj(stats) {
    const els = {
        'stat-total': stats.total,
        'stat-done': stats.completed,
        'stat-progress': stats.in_progress,
        'stat-overdue': stats.overdue,
        'overdue-count': stats.overdue
    };
    for (const [id, val] of Object.entries(els)) {
        const el = document.getElementById(id);
        if (el) el.textContent = (val !== undefined && val !== null) ? val : '0';
    }
}

async function loadTasks() {
    try {
        const r = await fetch(`${API}/dashboard/my-tasks`, { headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) {
            if (r.status === 401) doLogout();
            return;
        }
        const tasks = await r.json();
        
        // Update Stats only for members (Admins use loadAdminStats)
        if ((S.role || '').toLowerCase() !== 'admin') {
            updateStats(tasks);
        }
        
        const countEl = document.getElementById('tasks-count');
        if (countEl) countEl.textContent = tasks.length;
        renderTasks('tasks-list', tasks);
    } catch (e) {
        console.error("Load tasks error:", e);
    }
}

function updateStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done").length;
    const inProgress = tasks.filter(t => t.status === "in-progress").length;
    const overdue = tasks.filter(t => 
        new Date(t.due_date) < new Date() && t.status !== "done"
    ).length;

    const els = {
        'stat-total': total,
        'stat-done': completed,
        'stat-progress': inProgress,
        'stat-overdue': overdue,
        'overdue-count': overdue
    };

    for (const [id, val] of Object.entries(els)) {
        const el = document.getElementById(id);
        if (el) el.textContent = (val !== undefined && val !== null) ? val : '0';
    }
}

async function loadOverdue() {
    try {
        const r = await fetch(`${API}/dashboard/overdue`, { headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) {
            if (r.status === 401) doLogout();
            return;
        }
        const tasks = (await r.json()) || [];
        const statEl = document.getElementById('stat-overdue');
        const countEl = document.getElementById('overdue-count');
        if (statEl) statEl.textContent = tasks.length;
        if (countEl) countEl.textContent = tasks.length;
        renderTasks('overdue-list', tasks, true);
    } catch (e) {
        console.error("Overdue tasks load error:", e);
    }
}

// Deprecated: Stats now calculated in loadTasks for consistency
async function loadSummary() {
    // Keep for legacy or if needed for global stats
}

async function loadAdmin() {
    try {
        const [pr, ur] = await Promise.all([
            fetch(`${API}/projects/`, { headers: { Authorization: `Bearer ${S.token}` } }),
            fetch(`${API}/auth/users`, { headers: { Authorization: `Bearer ${S.token}` } })
        ]);

        const projList = document.getElementById('admin-projects');
        const userList = document.getElementById('admin-users');

        if (!pr.ok) {
            const errorText = await pr.text();
            throw new Error(`Failed to load projects: ${pr.status} ${errorText.substring(0, 50)}`);
        }
        if (!ur.ok) {
            const errorText = await ur.text();
            throw new Error(`Failed to load users: ${ur.status} ${errorText.substring(0, 50)}`);
        }

        const projects = await pr.json();
        const users = await ur.json();

        if (projList) {
            projList.innerHTML = projects.length
                ? projects.map(p => `
                    <div class="id-item">
                        <span class="id-pill">#${p.id}</span>
                        <span style="flex:1">${p.name}</span>
                        <button class="btn-icon-danger" onclick="deleteProject(${p.id})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>`).join('')
                : '<p style="color:var(--text-muted);font-size:12px">No projects yet.</p>';
        }

        if (userList) {
            const members = users.filter(u => u.role !== 'admin');
            userList.innerHTML = members.length
                ? members.map(u => `
                    <div class="id-item">
                        <span class="id-pill">#${u.id}</span>
                        <span style="flex:1">${u.name || 'Unknown'} <span style="color:var(--text-muted);margin-left:4px;font-size:11px">${u.email}</span></span>
                        <button class="btn-icon-danger" onclick="deleteUser(${u.id})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>`).join('')
                : '<p style="color:var(--text-muted);font-size:12px">No members found.</p>';
        }
    } catch (e) {
        console.error("Admin load error:", e);
        const pl = document.getElementById('admin-projects');
        const ul = document.getElementById('admin-users');
        if (pl) pl.innerHTML = `<p style="color:var(--rose);font-size:11px">Error: ${e.message}</p>`;
        if (ul) ul.innerHTML = `<p style="color:var(--rose);font-size:11px">Error: ${e.message}</p>`;
    }
}

// ── Render Tasks ──
function renderTasks(id, tasks, isOverdue = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!tasks || !tasks.length) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" />
                    </svg>
                </div>
                <p>${isOverdue ? 'No overdue tasks! You\'re all caught up.' : 'No tasks assigned yet. Your dashboard is clear.'}</p>
            </div>`;
        return;
    }
    el.innerHTML = tasks.map(t => {
        const isTaskOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
        const barClass = isTaskOverdue ? 'ts-overdue' : (t.status === 'done' ? 'ts-done' : t.status === 'in-progress' ? 'ts-in-progress' : 'ts-todo');
        
        // Better date formatting
        let dueStr = 'No due date';
        if (t.due_date) {
            try {
                const d = new Date(t.due_date);
                if (isNaN(d.getTime())) {
                    dueStr = t.due_date;
                } else {
                    dueStr = d.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    });
                }
            } catch (e) {
                dueStr = t.due_date;
            }
        }

        const statusLabel = isTaskOverdue ? 'overdue' : t.status;
        
        return `
            <div class="task-item animate-in ${barClass} ${isTaskOverdue ? 'is-overdue-card' : ''}">
                <div class="task-body">
                    <div class="task-top-row">
                        <span class="id-pill">#${t.id}</span>
                        <span class="task-project-tag">${t.project_name || 'General'}</span>
                        <div style="flex:1"></div>
                        <div class="status-badge ${statusLabel}">
                            ${statusLabel.replace('-', ' ')}
                        </div>
                    </div>
                    
                    <h4 class="task-title-text">${t.title}</h4>
                    <p class="task-desc-text">${t.description || 'No description provided.'}</p>
                    
                    <div class="task-meta-row">
                        <div class="task-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>${dueStr}</span>
                        </div>
                        <div class="task-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>${t.assigned_to_name || 'Unassigned'}</span>
                        </div>
                    </div>
                </div>

                <div class="task-actions">
                    ${t.status === 'todo' ? `
                        <button class="btn-action start" onclick="updateStatus('${t.id}', 'in-progress')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                            Start Task
                        </button>` : ''}
                    ${t.status !== 'done' ? `
                        <button class="btn-action complete" onclick="updateStatus('${t.id}', 'done')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Complete
                        </button>` : ''}
                    <div style="flex:1"></div>
                    <select class="status-select" onchange="updateStatus('${t.id}', this.value)">
                        <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>Todo</option>
                        <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="done" ${t.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                </div>
            </div>`;
    }).join('');
}

async function updateStatus(id, status) {
    try {
        const r = await fetch(`${API}/tasks/${id}?status=${status}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${S.token}` }
        });
        if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            throw new Error(d.detail || 'Permission denied');
        }
        toast('Status updated', 'success');
        loadAll();
    } catch (e) {
        toast(e.message, 'error');
        loadAll();
    }
}

// ── Modals ──
window.openModal = async function (type) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const projBox = document.getElementById('modal-project');
    const taskBox = document.getElementById('modal-task');

    if (overlay) overlay.classList.remove('hidden');
    if (title) title.textContent = type === 'project' ? 'New Project' : 'Assign New Task';
    if (projBox) projBox.classList.toggle('hidden', type !== 'project');
    if (taskBox) taskBox.classList.toggle('hidden', type !== 'task');

    if (type === 'task') {
        const userSel = document.getElementById('new-task-user');
        const projSel = document.getElementById('new-task-project');
        if (!userSel || !projSel) return;

        try {
            const [pr, ur] = await Promise.all([
                fetch(`${API}/projects/`, { headers: { Authorization: `Bearer ${S.token}` } }),
                fetch(`${API}/auth/users`, { headers: { Authorization: `Bearer ${S.token}` } })
            ]);
            const projects = await pr.json();
            const users = await ur.json();

            userSel.innerHTML = '<option value="">Select Member</option>' +
                users.filter(u => u.role !== 'admin').map(u => `<option value="${u.id}">${u.name}</option>`).join('');

            projSel.innerHTML = '<option value="">Select Project</option>' +
                projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        } catch (e) {
            console.error('Failed to populate selects:', e);
        }
    }
};

window.closeModal = function () {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
};

async function createProject() {
    const name = document.getElementById('new-proj-name').value.trim();
    const description = document.getElementById('new-proj-desc').value.trim();
    if (!name) return toast('Project name required', 'error');
    try {
        const r = await fetch(`${API}/projects/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${S.token}`
            },
            body: JSON.stringify({ name, description })
        });
        if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            throw new Error(d.detail || 'Failed to create project');
        }
        toast('Project created!', 'success');
        closeModal();
        loadAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function createTask() {
    const title = document.getElementById('new-task-title').value.trim();
    const description = document.getElementById('new-task-desc').value.trim();
    const assigned_to = parseInt(document.getElementById('new-task-user').value);
    const project_id = parseInt(document.getElementById('new-task-project').value);
    const due_date = document.getElementById('new-task-date').value;
    if (!title || !description || !assigned_to || !project_id || !due_date) return toast('All fields required', 'error');
    try {
        const r = await fetch(`${API}/tasks/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${S.token}`
            },
            body: JSON.stringify({ title, description, assigned_to, project_id, due_date })
        });
        const d = await r.json();
        if (!r.ok) {
            let errorMsg = 'Failed to create task';
            if (d.detail) {
                if (Array.isArray(d.detail)) {
                    errorMsg = d.detail.map(e => e.msg).join(', ');
                } else {
                    errorMsg = d.detail;
                }
            }
            throw new Error(errorMsg);
        }
        toast('Task assigned!', 'success');
        closeModal();
        loadAll();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will be affected.')) return;
    try {
        const r = await fetch(`${API}/projects/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) throw new Error('Failed to delete project');
        toast('Project deleted', 'success');
        loadAdmin();
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
        const r = await fetch(`${API}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${S.token}` } });
        if (!r.ok) {
            const d = await r.json();
            throw new Error(d.detail || 'Failed to delete member');
        }
        toast('Member deleted', 'success');
        loadAdmin();
    } catch (e) { toast(e.message, 'error'); }
}


// ── Helpers ──
window.togglePw = function (id) {
    const el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
};

function setBtn(id, loading) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    const arrow = btn.querySelector('.btn-arrow');

    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (arrow) arrow.classList.toggle('hidden', loading);
}

function toast(msg, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    const icon = type === 'success'
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    let displayMsg = msg;
    if (typeof msg === 'object' && msg !== null) {
        displayMsg = msg.detail || JSON.stringify(msg);
        if (Array.isArray(displayMsg)) {
            displayMsg = displayMsg.map(e => e.msg || JSON.stringify(e)).join(', ');
        }
    }
    
    t.innerHTML = icon + displayMsg;
    t.className = `toast ${type}`;
    t.classList.remove('hidden');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.add('hidden'), 3000);
}

// Attach to window for HTML calls
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doLogout = doLogout;
window.switchView = switchView;
window.goto = goto;
window.createProject = createProject;
window.createTask = createTask;
window.updateStatus = updateStatus;
window.deleteProject = deleteProject;
window.deleteUser = deleteUser;

document.addEventListener('DOMContentLoaded', init);

// Close modal on overlay click
document.addEventListener('click', e => {
    const overlay = document.getElementById('modal-overlay');
    if (e.target === overlay) closeModal();
});
