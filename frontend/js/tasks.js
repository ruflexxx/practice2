// ===========================
// TaskFlow — Tasks JS Module
// ===========================

let editingTaskId = null;
let tags = [];
let categories = [];

// ---- Render a list of tasks ----
function renderTaskList(tasks, containerId = 'task-list') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No tasks found</h3>
        <p>Create your first task to get started</p>
        <button class="btn btn-primary" onclick="openTaskModal()">+ New Task</button>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map(task => renderTaskCard(task)).join('');

  // Attach check toggle listeners
  container.querySelectorAll('.task-check').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      const current = el.dataset.status;
      const next = current === 'completed' ? 'pending' : 'completed';
      try {
        await api.patch(`/tasks/${id}/status`, { status: next });
        el.dataset.status = next;
        el.textContent = next === 'completed' ? '✓' : '';
        el.classList.toggle('checked', next === 'completed');
        const card = el.closest('.task-card');
        card.classList.toggle('completed', next === 'completed');
        const titleEl = card.querySelector('.task-title');
        titleEl.style.textDecoration = next === 'completed' ? 'line-through' : '';
        Toast.success(next === 'completed' ? 'Task completed! 🎉' : 'Task reopened');
      } catch {
        Toast.error('Failed to update status');
      }
    });
  });

  // Edit buttons
  container.querySelectorAll('.task-edit-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskModal(el.dataset.id);
    });
  });

  // Delete buttons
  container.querySelectorAll('.task-delete-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteTask(el.dataset.id, el.dataset.title);
    });
  });

  // Card click → open edit
  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (id) openTaskModal(id);
    });
  });
}

function renderTaskCard(task) {
  const isCompleted = task.status === 'completed';
  const due = task.dueDate ? relativeDate(task.dueDate) : null;
  const overdue = task.dueDate && isOverdue(task.dueDate) && !isCompleted;

  let catBadge = '';
  if (task.category) {
    catBadge = `<span class="category-badge" style="background:${task.category.color}22;color:${task.category.color}">
      ${task.category.icon || '📁'} ${task.category.name}
    </span>`;
  }

  const tagBadges = (task.tags || []).slice(0, 3).map(t =>
    `<span class="tag">#${t}</span>`
  ).join('');

  return `
  <div class="task-card ${isCompleted ? 'completed' : ''}" data-id="${task._id}">
    <div class="task-check ${isCompleted ? 'checked' : ''}" data-id="${task._id}" data-status="${task.status}">
      ${isCompleted ? '✓' : ''}
    </div>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        <span class="badge badge-${task.status}">${task.status.replace('-', ' ')}</span>
        <span class="badge badge-${task.priority}">${task.priority}</span>
        ${catBadge}
        ${due ? `<span class="due-date ${overdue ? 'overdue' : ''}">📅 ${due}</span>` : ''}
        ${tagBadges}
      </div>
    </div>
    <div class="task-actions">
      <button class="btn btn-ghost btn-icon task-edit-btn" data-id="${task._id}" title="Edit">✏️</button>
      <button class="btn btn-ghost btn-icon task-delete-btn" data-id="${task._id}" data-title="${escapeHtml(task.title)}" title="Delete">🗑️</button>
    </div>
  </div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Modal ----
async function openTaskModal(taskId = null) {
  editingTaskId = taskId;
  const modal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const saveBtn = document.getElementById('save-task-btn');

  // Reset form
  resetTaskForm();
  await loadCategoriesIntoSelect();

  if (taskId) {
    modalTitle.textContent = 'Edit Task';
    saveBtn.textContent = 'Save Changes';
    try {
      const res = await api.get(`/tasks/${taskId}`);
      fillTaskForm(res.data);
    } catch {
      Toast.error('Failed to load task');
      return;
    }
  } else {
    modalTitle.textContent = 'New Task';
    saveBtn.textContent = 'Create Task';
  }

  modal.classList.add('open');
  document.getElementById('task-title').focus();
}

function closeModal() {
  document.getElementById('task-modal').classList.remove('open');
  editingTaskId = null;
  tags = [];
}

function resetTaskForm() {
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-status').value = 'pending';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-due').value = '';
  document.getElementById('task-category').value = '';
  document.getElementById('title-error').textContent = '';
  document.getElementById('title-error').classList.remove('visible');
  document.getElementById('task-title').classList.remove('error');
  tags = [];
  renderTagChips();
}

function fillTaskForm(task) {
  document.getElementById('task-title').value = task.title || '';
  document.getElementById('task-desc').value = task.description || '';
  document.getElementById('task-status').value = task.status || 'pending';
  document.getElementById('task-priority').value = task.priority || 'medium';
  document.getElementById('task-due').value = task.dueDate
    ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  document.getElementById('task-category').value = task.category?._id || task.category || '';
  tags = [...(task.tags || [])];
  renderTagChips();
}

async function loadCategoriesIntoSelect() {
  const select = document.getElementById('task-category');
  if (!select) return;
  try {
    const res = await api.get('/categories');
    categories = res.data || [];
    const current = select.value;
    select.innerHTML = '<option value="">No category</option>' +
      categories.map(c => `<option value="${c._id}">${c.icon || '📁'} ${c.name}</option>`).join('');
    if (current) select.value = current;
  } catch {}
}

// Tags input
document.addEventListener('DOMContentLoaded', () => {
  const tagsInput = document.getElementById('tags-input');
  const wrapper = document.getElementById('tags-wrapper');

  if (tagsInput) {
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = tagsInput.value.trim().replace(/,$/, '');
        if (val && !tags.includes(val) && tags.length < 10) {
          tags.push(val);
          renderTagChips();
        }
        tagsInput.value = '';
      } else if (e.key === 'Backspace' && !tagsInput.value && tags.length) {
        tags.pop();
        renderTagChips();
      }
    });

    if (wrapper) {
      wrapper.addEventListener('click', () => tagsInput.focus());
    }
  }

  // Save task
  const saveBtn = document.getElementById('save-task-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveTask);
  }
});

function renderTagChips() {
  const wrapper = document.getElementById('tags-wrapper');
  const input = document.getElementById('tags-input');
  if (!wrapper || !input) return;

  // Remove existing chips
  wrapper.querySelectorAll('.tag-chip').forEach(el => el.remove());

  const chips = tags.map((t, i) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${escapeHtml(t)}<button type="button" onclick="removeTag(${i})">✕</button>`;
    return chip;
  });

  chips.forEach(chip => wrapper.insertBefore(chip, input));
}

function removeTag(index) {
  tags.splice(index, 1);
  renderTagChips();
}

async function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  const titleErr = document.getElementById('title-error');

  // Client-side validation
  if (!title) {
    document.getElementById('task-title').classList.add('error');
    titleErr.textContent = 'Task title is required';
    titleErr.classList.add('visible');
    document.getElementById('task-title').focus();
    return;
  }

  titleErr.classList.remove('visible');
  document.getElementById('task-title').classList.remove('error');

  const payload = {
    title,
    description: document.getElementById('task-desc').value.trim(),
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    dueDate: document.getElementById('task-due').value || null,
    category: document.getElementById('task-category').value || null,
    tags
  };

  const btn = document.getElementById('save-task-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    if (editingTaskId) {
      await api.put(`/tasks/${editingTaskId}`, payload);
      Toast.success('Task updated!');
    } else {
      await api.post('/tasks', payload);
      Toast.success('Task created!');
    }

    closeModal();

    // Refresh the page list
    if (typeof loadTasks === 'function') loadTasks();
    else if (typeof loadDashboard === 'function') loadDashboard();
  } catch (err) {
    Toast.error(err.message || 'Failed to save task');
  } finally {
    btn.disabled = false;
    btn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
  }
}

async function confirmDeleteTask(taskId, taskTitle) {
  if (!confirm(`Delete "${taskTitle}"? This cannot be undone.`)) return;

  try {
    await api.delete(`/tasks/${taskId}`);
    Toast.success('Task deleted');
    if (typeof loadTasks === 'function') loadTasks();
    else if (typeof loadDashboard === 'function') loadDashboard();
  } catch {
    Toast.error('Failed to delete task');
  }
}
