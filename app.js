    let state = loadState();
    let toastTimer;

    function loadState() {
      try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return {
          completed: new Set(Array.isArray(raw.completed) ? raw.completed : []),
          archived: new Set(Array.isArray(raw.archived) ? raw.archived : [])
        };
      } catch (_) {
        return { completed: new Set(), archived: new Set() };
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed: [...state.completed],
        archived: [...state.archived]
      }));
    }

    function remainingFor(section) {
      return tasks.filter(t => t.section === section && !state.archived.has(t.id) && !state.completed.has(t.id)).length;
    }

    function activeTotalFor(section) {
      return tasks.filter(t => t.section === section && !state.archived.has(t.id)).length;
    }

    function renderSummary() {
      const el = document.getElementById('summaryGrid');
      const totalRemaining = tasks.filter(t => !state.archived.has(t.id) && !state.completed.has(t.id)).length;
      const chips = sectionOrder.map(section => {
        const m = sectionMeta[section];
        return `<button type="button" class="summary-chip" data-jump="${section}" aria-label="Jump to ${m.name}; ${remainingFor(section)} tasks remaining"><span class="label">${m.short}</span><span class="value">${remainingFor(section)}</span></button>`;
      }).join('');
      el.innerHTML = chips + `<div class="summary-chip total"><span class="label">Total</span><span class="value">${totalRemaining}</span></div>`;
      el.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click', () => {
        document.getElementById(`section-${btn.dataset.jump}`)?.scrollIntoView({behavior:'smooth', block:'start'});
      }));
    }

    function renderSections() {
      const host = document.getElementById('sections');
      host.innerHTML = '';
      sectionOrder.forEach(section => {
        const meta = sectionMeta[section];
        const sectionTasks = tasks.filter(t => t.section === section && !state.archived.has(t.id));
        const wrap = document.createElement('section');
        wrap.className = 'section';
        wrap.id = `section-${section}`;

        const priority = meta.priority ? `<span class="priority ${meta.priority === 'Secondary' ? 'secondary' : ''}">${meta.priority}</span>` : '';
        wrap.innerHTML = `
          <div class="section-head">
            <div>
              <div class="section-kicker">${priority}</div>
              <h2>${meta.name}</h2>
              <p class="section-sub">${meta.subtitle}</p>
            </div>
            <div class="section-count"><strong>${remainingFor(section)}</strong> left / ${activeTotalFor(section)}</div>
          </div>
          <div class="tasks"></div>`;

        const list = wrap.querySelector('.tasks');
        let lastGroup = null;
        sectionTasks.forEach(task => {
          if (task.group && task.group !== lastGroup) {
            const g = document.createElement('div');
            g.className = 'group-label';
            g.textContent = task.group;
            list.appendChild(g);
            lastGroup = task.group;
          }
          list.appendChild(buildTask(task));
        });

        host.appendChild(wrap);
      });
    }

    function buildTask(task) {
      const article = document.createElement('article');
      const checked = state.completed.has(task.id);
      article.className = `task${checked ? ' completed' : ''}`;
      article.dataset.id = task.id;
      const note = task.note ? `<span class="task-note">${task.note}</span>` : '';
      const code = task.code ? `<span class="task-code">${task.code}</span>` : '';
      article.innerHTML = `
        <label class="task-label">
          <input type="checkbox" ${checked ? 'checked' : ''} aria-label="${escapeHtml(task.title)}" />
          <span class="task-copy">
            <span class="task-title">${task.title}</span>
            ${note}
            ${code}
          </span>
        </label>`;
      const input = article.querySelector('input');
      input.addEventListener('change', () => {
        if (input.checked) state.completed.add(task.id);
        else state.completed.delete(task.id);
        saveState();
        renderAll(false);
      });
      return article;
    }

    function renderArchive() {
      const archivedTasks = tasks.filter(t => state.archived.has(t.id));
      document.getElementById('archiveCount').textContent = `${archivedTasks.length} ${archivedTasks.length === 1 ? 'item' : 'items'}`;
      const host = document.getElementById('archiveContent');
      if (!archivedTasks.length) {
        host.innerHTML = `<div class="archive-empty">Cleared tasks will appear here so you can restore one if needed.</div>`;
        return;
      }
      host.innerHTML = `<div class="archive-list">${archivedTasks.map(task => `
        <div class="archived-task">
          <div>
            <span class="arch-title">${task.title}</span>
            <span class="arch-section">${sectionMeta[task.section].name}</span>
          </div>
          <button type="button" class="restore-btn" data-restore="${task.id}">Restore</button>
        </div>`).join('')}</div>`;
      host.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.restore;
        state.archived.delete(id);
        state.completed.delete(id);
        saveState();
        renderAll();
        showToast('Task restored');
      }));
    }

    function updateClearButton() {
      const btn = document.getElementById('clearChecked');
      const count = [...state.completed].filter(id => !state.archived.has(id)).length;
      btn.disabled = count === 0;
      btn.textContent = count ? `Clear checked (${count})` : 'Clear checked';
    }

    function clearChecked() {
      const ids = [...state.completed].filter(id => !state.archived.has(id));
      if (!ids.length) return;
      ids.forEach(id => state.archived.add(id));
      state.completed.clear();
      saveState();
      renderAll();
      showToast(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} moved to Recoverable`);
    }

    function renderAll(keepScroll = true) {
      const y = window.scrollY;
      renderSummary();
      renderSections();
      renderArchive();
      updateClearButton();
      if (keepScroll) requestAnimationFrame(() => window.scrollTo(0, y));
    }

    function showToast(message) {
      const t = document.getElementById('toast');
      t.textContent = message;
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    }

    document.getElementById('clearChecked').addEventListener('click', clearChecked);
    renderAll(false);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
    }
