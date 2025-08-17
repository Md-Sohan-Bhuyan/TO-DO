document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const quickAddBtn = document.getElementById('quick-add-btn');
    const quickAddPanel = document.getElementById('quick-add-panel');
    const quickAddInput = document.getElementById('quick-add-input');
    const quickAddSubmit = document.getElementById('quick-add-submit');
    const taskModal = document.getElementById('task-modal');
    const saveTaskBtn = document.getElementById('save-task');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const closeModalBtn = document.querySelector('.close-modal');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtasksContainer = document.getElementById('subtasks-container');
    const priorityBtns = document.querySelectorAll('.priority-btn');
    const addAttachmentBtn = document.getElementById('add-attachment');
    const fileUpload = document.getElementById('file-upload');
    const attachmentsContainer = document.getElementById('attachments-container');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('file-input');
    const addListBtn = document.getElementById('add-list-btn');
    const listsContainer = document.getElementById('lists-container');
    const taskListContainer = document.getElementById('task-list');
    const currentViewElement = document.getElementById('current-view');
    const sortSelect = document.getElementById('sort-select');
    const searchInput = document.querySelector('.search-box input');

    // App State
    let currentTheme = localStorage.getItem('theme') || 'light';
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let lists = JSON.parse(localStorage.getItem('lists')) || ['Home', 'Groceries', 'Work', 'Birthdays', 'Movies'];
    let currentTaskId = null;
    let currentView = 'all';
    let currentListFilter = null;
    let currentSort = 'date';
    let currentSearch = '';

    // Initialize the app
    function init() {
        setTheme(currentTheme);
        renderTaskList();
        updateStats();
        renderLists();
        
        // Event listeners
        themeToggle.addEventListener('click', toggleTheme);
        quickAddBtn.addEventListener('click', toggleQuickAddPanel);
        quickAddSubmit.addEventListener('click', addTaskFromQuickAdd);
        quickAddInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTaskFromQuickAdd();
        });
        
        saveTaskBtn.addEventListener('click', saveTask);
        cancelTaskBtn.addEventListener('click', closeTaskModal);
        closeModalBtn.addEventListener('click', closeTaskModal);
        addSubtaskBtn.addEventListener('click', addSubtask);
        
        priorityBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                priorityBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        addAttachmentBtn.addEventListener('click', function() {
            fileUpload.click();
        });
        
        fileUpload.addEventListener('change', handleFileUpload);
        exportBtn.addEventListener('click', exportTasks);
        importBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', importTasks);
        addListBtn.addEventListener('click', addNewList);
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            renderTaskList();
        });
        
        searchInput.addEventListener('input', function() {
            currentSearch = this.value.toLowerCase();
            renderTaskList();
        });
        
        // Set up sidebar navigation
        setupSidebarNavigation();
        
        // Close modal when clicking outside
        taskModal.addEventListener('click', function(e) {
            if (e.target === taskModal) {
                closeTaskModal();
            }
        });
    }

    // Theme functions
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(currentTheme);
    }

    // Task modal functions
    function openTaskModal(taskId = null) {
        currentTaskId = taskId;
        const modalTitle = document.getElementById('modal-title');
        
        if (taskId) {
            // Edit existing task
            modalTitle.textContent = 'Edit Task';
            const task = tasks.find(t => t.id === taskId);
            populateTaskForm(task);
        } else {
            // Create new task
            modalTitle.textContent = 'Add New Task';
            resetTaskForm();
        }
        
        taskModal.classList.add('active');
    }

    function closeTaskModal() {
        taskModal.classList.remove('active');
        resetTaskForm();
    }

    function populateTaskForm(task) {
        document.getElementById('task-title').value = task.title || '';
        document.getElementById('task-notes').value = task.notes || '';
        document.getElementById('task-list-select').value = task.list || 'home';
        document.getElementById('repeat-frequency').value = task.repeat || 'none';
        
        // Set priority
        priorityBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.priority-btn.${task.priority}`).classList.add('active');
        
        // Set due date and time
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
            document.getElementById('due-time').value = dueDate.toTimeString().substring(0, 5);
        }
        
        // Set reminder
        if (task.reminder) {
            const reminderDate = new Date(task.reminder);
            // Format for datetime-local input (YYYY-MM-DDTHH:MM)
            const formattedReminder = reminderDate.toISOString().slice(0, 16);
            document.getElementById('reminder').value = formattedReminder;
        }
        
        // Populate subtasks
        subtasksContainer.innerHTML = '';
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
                addSubtaskToDOM(subtask);
            });
        }
        
        // Populate attachments
        attachmentsContainer.innerHTML = '';
        if (task.attachments && task.attachments.length > 0) {
            task.attachments.forEach(attachment => {
                addAttachmentToDOM(attachment);
            });
        }
    }

    function resetTaskForm() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-notes').value = '';
        document.getElementById('task-list-select').value = 'home';
        document.getElementById('repeat-frequency').value = 'none';
        document.getElementById('due-date').value = '';
        document.getElementById('due-time').value = '';
        document.getElementById('reminder').value = '';
        
        priorityBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.priority-btn.medium').classList.add('active');
        
        subtasksContainer.innerHTML = '';
        attachmentsContainer.innerHTML = '';
    }

    // Task CRUD functions
    function saveTask() {
        const title = document.getElementById('task-title').value.trim();
        if (!title) return;
        
        const notes = document.getElementById('task-notes').value;
        const list = document.getElementById('task-list-select').value;
        const priority = document.querySelector('.priority-btn.active').dataset.priority;
        const repeat = document.getElementById('repeat-frequency').value;
        
        let dueDate = null;
        const dateInput = document.getElementById('due-date').value;
        const timeInput = document.getElementById('due-time').value;
        if (dateInput) {
            dueDate = timeInput ? `${dateInput}T${timeInput}:00` : `${dateInput}T00:00:00`;
        }
        
        let reminder = null;
        const reminderInput = document.getElementById('reminder').value;
        if (reminderInput) {
            reminder = reminderInput + ':00';
        }
        
        // Get subtasks from DOM
        const subtaskElements = subtasksContainer.querySelectorAll('.subtask-item');
        const subtasks = Array.from(subtaskElements).map(el => {
            return {
                id: parseInt(el.dataset.id),
                text: el.querySelector('.subtask-text').textContent,
                completed: el.querySelector('.subtask-checkbox').checked
            };
        });
        
        // Get attachments from DOM
        const attachmentElements = attachmentsContainer.querySelectorAll('.attachment-item');
        const attachments = Array.from(attachmentElements).map(el => {
            return {
                id: el.dataset.id,
                name: el.querySelector('.attachment-name').textContent,
                type: el.dataset.type
            };
        });
        
        if (currentTaskId) {
            // Update existing task
            const taskIndex = tasks.findIndex(t => t.id === currentTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title,
                    notes,
                    list,
                    priority,
                    dueDate,
                    reminder,
                    repeat,
                    subtasks,
                    attachments,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new task
            const newTask = {
                id: Date.now(),
                title,
                notes,
                list,
                priority,
                dueDate,
                reminder,
                repeat,
                subtasks,
                attachments,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            tasks.unshift(newTask);
        }
        
        saveToLocalStorage();
        renderTaskList();
        updateStats();
        closeTaskModal();
    }

    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveToLocalStorage();
        renderTaskList();
        updateStats();
    }

    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            saveToLocalStorage();
            renderTaskList();
            updateStats();
        }
    }

    // Subtask functions
    function addSubtask() {
        const subtaskId = Date.now();
        const newSubtask = {
            id: subtaskId,
            text: 'New subtask',
            completed: false
        };
        addSubtaskToDOM(newSubtask);
    }

    function addSubtaskToDOM(subtask) {
        const subtaskElement = document.createElement('div');
        subtaskElement.className = 'subtask-item';
        subtaskElement.dataset.id = subtask.id;
        
        subtaskElement.innerHTML = `
            <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
            <div class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</div>
            <div class="subtask-actions">
                <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        subtasksContainer.appendChild(subtaskElement);
        
        // Add event listeners for the new subtask
        const editBtn = subtaskElement.querySelector('.edit');
        const deleteBtn = subtaskElement.querySelector('.delete');
        const checkbox = subtaskElement.querySelector('.subtask-checkbox');
        const textElement = subtaskElement.querySelector('.subtask-text');
        
        editBtn.addEventListener('click', function() {
            const newText = prompt('Edit subtask:', subtask.text);
            if (newText !== null) {
                textElement.textContent = newText;
                subtask.text = newText;
            }
        });
        
        deleteBtn.addEventListener('click', function() {
            subtaskElement.remove();
        });
        
        checkbox.addEventListener('change', function() {
            subtask.completed = this.checked;
            textElement.classList.toggle('completed', this.checked);
        });
    }

    // Attachment functions
    function handleFileUpload(e) {
        const files = e.target.files;
        if (files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const attachment = {
                id: Date.now() + i,
                name: file.name,
                type: file.type.split('/')[0] || 'file',
                file: file
            };
            addAttachmentToDOM(attachment);
        }
        
        // Reset file input
        fileUpload.value = '';
    }

    function addAttachmentToDOM(attachment) {
        const attachmentElement = document.createElement('div');
        attachmentElement.className = 'attachment-item';
        attachmentElement.dataset.id = attachment.id;
        attachmentElement.dataset.type = attachment.type;
        
        let iconClass = 'fa-file';
        if (attachment.type === 'image') iconClass = 'fa-image';
        else if (attachment.type === 'video') iconClass = 'fa-video';
        else if (attachment.type === 'audio') iconClass = 'fa-music';
        else if (attachment.type === 'pdf') iconClass = 'fa-file-pdf';
        
        attachmentElement.innerHTML = `
            <div class="attachment-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="attachment-name">${attachment.name}</div>
            <div class="attachment-actions">
                <button class="task-btn delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        attachmentsContainer.appendChild(attachmentElement);
        
        // Add event listener for delete button
        const deleteBtn = attachmentElement.querySelector('.delete');
        deleteBtn.addEventListener('click', function() {
            attachmentElement.remove();
        });
    }

    // List functions
    function renderLists() {
        listsContainer.innerHTML = '';
        lists.forEach(list => {
            const listElement = document.createElement('li');
            listElement.innerHTML = `
                <a href="#" data-list="${list.toLowerCase()}">
                    <i class="fas fa-list"></i> ${list}
                </a>
            `;
            listsContainer.appendChild(listElement);
        });
    }

    function addNewList() {
        const listName = prompt('Enter new list name:');
        if (listName && listName.trim()) {
            const formattedName = listName.trim();
            if (!lists.includes(formattedName)) {
                lists.push(formattedName);
                saveToLocalStorage();
                renderLists();
                
                // Add the new list to the task list select in the modal
                const select = document.getElementById('task-list-select');
                const option = document.createElement('option');
                option.value = formattedName.toLowerCase();
                option.textContent = formattedName;
                select.appendChild(option);
            }
        }
    }

    // Task rendering functions
    function renderTaskList() {
        taskListContainer.innerHTML = '';
        
        let filteredTasks = [...tasks];
        
        // Apply view filter
        if (currentView === 'today') {
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                return task.dueDate.split('T')[0] === today;
            });
        } else if (currentView === 'upcoming') {
            const today = new Date();
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate > today;
            });
        } else if (currentView === 'week') {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate <= nextWeek;
            });
        } else if (currentView === 'priority') {
            filteredTasks = filteredTasks.filter(task => task.priority === 'high');
        } else if (currentView === 'overdue') {
            const now = new Date();
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate || task.completed) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate < now;
            });
        }
        
        // Apply list filter
        if (currentListFilter) {
            filteredTasks = filteredTasks.filter(task => task.list === currentListFilter);
        }
        
        // Apply search filter
        if (currentSearch) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(currentSearch) || 
                (task.notes && task.notes.toLowerCase().includes(currentSearch))
            );
        }
        
        // Apply sorting
        if (currentSort === 'date') {
            filteredTasks.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return new Date(b.createdAt) - new Date(a.createdAt);
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else if (currentSort === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            filteredTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        } else if (currentSort === 'name') {
            filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
        }
        
        // Render tasks
        if (filteredTasks.length === 0) {
            taskListContainer.innerHTML = '<div class="empty-state">No tasks found</div>';
        } else {
            filteredTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
                taskElement.dataset.id = task.id;
                
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const now = new Date();
                const isOverdue = dueDate && dueDate < now && !task.completed;
                
                taskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="task-meta">
                            ${dueDate ? `
                                <div class="task-due ${isOverdue ? 'overdue' : ''}">
                                    <i class="fas fa-calendar-day"></i>
                                    ${formatDate(dueDate)}
                                </div>
                            ` : ''}
                            <div class="task-list">${task.list}</div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                        <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                taskListContainer.appendChild(taskElement);
                
                // Add event listeners
                const checkbox = taskElement.querySelector('.task-checkbox');
                const editBtn = taskElement.querySelector('.edit');
                const deleteBtn = taskElement.querySelector('.delete');
                
                checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
                editBtn.addEventListener('click', () => openTaskModal(task.id));
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this task?')) {
                        deleteTask(task.id);
                    }
                });
            });
        }
    }

    function formatDate(date) {
        const options = { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('en-US', options);
    }

    // Stats functions
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const overdueTasks = tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            return new Date(task.dueDate) < new Date();
        }).length;
        
        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('overdue-tasks').textContent = overdueTasks;
    }

    // Quick add functions
    function toggleQuickAddPanel() {
        quickAddPanel.classList.toggle('active');
        if (quickAddPanel.classList.contains('active')) {
            quickAddInput.focus();
        } else {
            quickAddInput.value = '';
        }
    }

    function addTaskFromQuickAdd() {
        const title = quickAddInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now(),
            title,
            list: 'home',
            priority: 'medium',
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveToLocalStorage();
        renderTaskList();
        updateStats();
        
        quickAddInput.value = '';
        quickAddPanel.classList.remove('active');
    }

    // Import/Export functions
    function exportTasks() {
        const data = {
            tasks,
            lists,
            version: '1.0',
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `akta-tasks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importTasks(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (Array.isArray(data.tasks)) {
                    tasks = data.tasks;
                } else if (Array.isArray(data)) {
                    // Handle case where file is just an array of tasks
                    tasks = data;
                }
                
                if (Array.isArray(data.lists)) {
                    lists = data.lists;
                }
                
                saveToLocalStorage();
                renderTaskList();
                renderLists();
                updateStats();
                
                // Update the task list select in the modal
                const select = document.getElementById('task-list-select');
                select.innerHTML = '';
                lists.forEach(list => {
                    const option = document.createElement('option');
                    option.value = list.toLowerCase();
                    option.textContent = list;
                    select.appendChild(option);
                });
                
                alert('Tasks imported successfully!');
            } catch (error) {
                console.error('Error importing tasks:', error);
                alert('Error importing tasks. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        fileInput.value = '';
    }

    // Helper functions
    function saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('lists', JSON.stringify(lists));
    }

    function setupSidebarNavigation() {
        // Overview section
        document.querySelectorAll('.menu-section:first-child li a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const view = this.textContent.trim().toLowerCase().replace(' ', '-');
                currentView = view === 'all-tasks' ? 'all' : view;
                currentListFilter = null;
                currentViewElement.textContent = this.textContent.trim();
                
                // Update active state
                document.querySelectorAll('.menu-section:first-child li').forEach(li => {
                    li.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                renderTaskList();
            });
        });
        
        // Lists section
        document.querySelectorAll('#lists-container li a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const list = this.dataset.list;
                currentListFilter = list;
                currentView = 'all';
                currentViewElement.textContent = this.textContent.trim();
                
                // Update active state
                document.querySelectorAll('#lists-container li').forEach(li => {
                    li.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                renderTaskList();
            });
        });
    }

    // Initialize the app
    init();
});