/* ----------  Task model  ---------- */
class Task {
  constructor(title, description, color, date, status, budget, id = null) {
    this.title       = title;
    this.description = description;
    this.color       = color;
    this.date        = date;
    this.status      = status;
    this.budget      = budget ? parseFloat(budget).toFixed(2) : "0.00";
    this.id          = id ?? Date.now();          // unique id
  }
}

/* ----------  API → localStorage  ---------- */
const STORAGE_KEY = 'reactive-tasks';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeStore(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ----------  fake async wrappers (keep original shape) ---------- */
async function loadTasks() {
  showNotification('Loading tasks...', 'info');
  allTasks = readStore().map(t => new Task(t.title, t.description, t.color, t.date, t.status, t.budget, t.id));
  displayTasks();
  showNotification('Tasks loaded', 'success');
}

async function saveTaskToServer(task) {
  const list = readStore();
  list.push(task);
  writeStore(list);
  showNotification('Task saved', 'success');
  await loadTasks();
  return true;
}

async function updateTaskOnServer(task) {
  let list = readStore();
  const idx = list.findIndex(x => x.id == task.id);
  if (idx === -1) return false;
  list[idx] = task;
  writeStore(list);
  showNotification('Task updated', 'success');
  await loadTasks();
  return true;
}

async function deleteTaskFromServer(id) {
  let list = readStore();
  list = list.filter(x => x.id != id);
  writeStore(list);
  showNotification('Task deleted', 'success');
  await loadTasks();
  return true;
}

/* ----------  state  ---------- */
let allTasks = [];
let currentEditingTaskId = null;

/* ----------  colour helpers (unchanged) ---------- */
const SLIDER_MAX = 19;
const HUE_STEP   = 360 / SLIDER_MAX;
function getHslColor(v) {
  const hue = v * HUE_STEP;
  return `hsl(${hue}, 70%, 50%)`;
}
function getColorName(v) {
  const names = ['Red','Orange','Yellow','Green','Cyan','Blue','Magenta'];
  const step = SLIDER_MAX / names.length;
  return names[Math.floor(v / step)] || `Hue ${v}`;
}

/* ----------  form helpers ---------- */
function updateColorDisplay() {
  const slider  = document.getElementById('colorSlider');
  const nameBox = document.getElementById('colorNameDisplay');
  const hidden  = document.getElementById('color');
  const val     = parseInt(slider.value);
  nameBox.textContent = getColorName(val);
  hidden.value        = getHslColor(val);
}

function readFormValues(id = null) {
  return new Task(
    document.getElementById('title').value.trim(),
    document.getElementById('description').value.trim(),
    document.getElementById('color').value,
    document.getElementById('startDate').value,
    document.getElementById('status').value,
    document.getElementById('budget').value,
    id
  );
}

function validateInputs() {
  let ok = true;
  ['title','description','startDate','status'].forEach(i => {
    const el  = document.getElementById(i);
    const err = document.getElementById(i + 'Error');
    const bad = el.value.trim() === '';
    err.style.visibility = bad ? 'visible' : 'hidden';
    if (bad) ok = false;
  });
  const budgetEl  = document.getElementById('budget');
  const budgetErr = document.getElementById('budgetError');
  const v         = parseFloat(budgetEl.value);
  const bad       = budgetEl.value.trim() === '' || isNaN(v) || v < 0;
  budgetErr.style.visibility = bad ? 'visible' : 'hidden';
  if (bad) ok = false;
  return ok;
}

function resetForm() {
  document.getElementById('taskForm').reset();
  document.querySelectorAll('.text-danger').forEach(e => e.style.visibility = 'hidden');
  currentEditingTaskId = null;
  document.getElementById('colorSlider').value = 0;
  updateColorDisplay();
  document.getElementById('btnSave').style.display   = 'block';
  document.getElementById('btnUpdate').style.display = 'none';
}

/* ----------  display ---------- */
function displayTasks() {
  const box = document.getElementById('taskList');
  box.innerHTML = '';
  if (!allTasks.length) {
    box.innerHTML = '<p style="text-align:center;color:#6c757d;padding:20px;">No tasks yet – create one!</p>';
    updateMetrics(); return;
  }
  allTasks.forEach(t => {
    const status = t.status || 'To Do';
    const card   = document.createElement('div');
    card.className = 'task-card';
    card.style.setProperty('--task-color', t.color);
    const dateDisp = t.date ? new Date(t.date).toLocaleDateString() : 'Not set';
    card.innerHTML = `
      <div class="task-actions">
        <button class="action-btn edit-btn" onclick="editTask(${t.id})">✎</button>
        <button class="action-btn delete-btn" onclick="deleteTask(${t.id})">✖</button>
      </div>
      <div class="task-title-group">
        <span class="task-title">${t.title}</span>
        <span class="status-badge status-${status.toLowerCase().replace(/\s+/g,'-')}">${status}</span>
      </div>
      <p class="task-description">${t.description}</p>
      <div class="summary-metrics">
        <span>Start: <strong>${dateDisp}</strong></span> |
        <span>Budget: <strong>$${t.budget}</strong></span>
      </div>`;
    box.appendChild(card);
  });
  updateMetrics();
}

function updateMetrics() {
  document.getElementById('totalTasks').textContent      = allTasks.length;
  document.getElementById('tasksTodo').textContent       = allTasks.filter(t => t.status === 'To Do').length;
  document.getElementById('tasksInProgress').textContent = allTasks.filter(t => t.status === 'In Progress').length;
  document.getElementById('tasksDone').textContent       = allTasks.filter(t => t.status === 'Done').length;
  document.getElementById('tasksBlocked').textContent    = allTasks.filter(t => t.status === 'Blocked').length;
}

/* ----------  task actions ---------- */
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  await deleteTaskFromServer(id);
  if (currentEditingTaskId === id) resetForm();
}
function editTask(id) {
  const task = allTasks.find(t => t.id == id);
  if (!task) return;
  currentEditingTaskId = id;
  document.getElementById('title').value       = task.title;
  document.getElementById('description').value = task.description;
  document.getElementById('startDate').value   = task.date;
  document.getElementById('status').value      = task.status;
  document.getElementById('budget').value      = parseFloat(task.budget);
  if (task.color && task.color.startsWith('hsl')) {
    const h = parseInt(task.color.match(/hsl\((\d+)/)[1]);
    document.getElementById('colorSlider').value = Math.round(h / HUE_STEP);
  } else {
    document.getElementById('colorSlider').value = 0;
  }
  updateColorDisplay();
  document.getElementById('btnSave').style.display   = 'none';
  document.getElementById('btnUpdate').style.display = 'block';
  document.getElementById('createTaskHeader').scrollIntoView({behavior:'smooth'});
  document.getElementById('createTaskBody').classList.add('active');
}

/* ----------  form handlers ---------- */
function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateInputs()) return;
  if (currentEditingTaskId) { handleUpdateTask(); return; }
  saveTaskToServer(readFormValues()).then(ok => { if (ok) resetForm(); });
}
async function handleUpdateTask() {
  if (!validateInputs()) return;
  const ok = await updateTaskOnServer(readFormValues(currentEditingTaskId));
  if (ok) resetForm();
}

/* ----------  accordion & notifications ---------- */
function toggleAccordion(e) {
  e.currentTarget.nextElementSibling.classList.toggle('active');
}
function showNotification(msg, type = 'success') {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.className   = `notification notification-${type} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

/* ----------  boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  /* form */
  document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btnReset').addEventListener('click', resetForm);
  document.getElementById('btnUpdate').addEventListener('click', handleUpdateTask);
  /* accordion */
  document.getElementById('createTaskHeader').addEventListener('click', toggleAccordion);
  document.getElementById('taskListHeader').addEventListener('click', toggleAccordion);
  /* colour slider */
  const slider = document.getElementById('colorSlider');
  slider.addEventListener('input', updateColorDisplay);
  updateColorDisplay();
  /* expose globals for inline onclick */
  window.editTask   = editTask;
  window.deleteTask = deleteTask;
  /* initial load */
  loadTasks();
});