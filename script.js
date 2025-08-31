
        // Enhanced JavaScript for the To-Do List Application
        document.addEventListener('DOMContentLoaded', function() {
            // State management
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentList = 'all';
            let currentSort = 'date';
            
            // DOM Elements
            const taskList = document.getElementById('task-list');
            const themeToggle = document.getElementById('theme-toggle');
            const quickAddBtn = document.getElementById('quick-add-btn');
            const quickAddPanel = document.getElementById('quick-add-panel');
            const quickAddInput = document.getElementById('quick-add-input');
            const quickAddSubmit = document.getElementById('quick-add-submit');
            const taskModal = document.getElementById('task-modal');
            const saveTaskBtn = document.getElementById('save-task');
            const cancelTaskBtn = document.getElementById('cancel-task');
            const closeModalBtn = document.querySelector('.close-modal');
            const sortSelect = document.getElementById('sort-select');
            const searchInput = document.getElementById('search-input');
            
            // Initialize the application
            function init() {
                loadTasks();
                setupEventListeners();
                updateStats();
                setupTheme();
            }
            
            // Set up theme from localStorage
            function setupTheme() {
                const savedTheme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
                updateThemeIcon(savedTheme);
            }
            
            // Update theme icon based on current theme
            function updateThemeIcon(theme) {
                const icon = themeToggle.querySelector('i');
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            // Set up all event listeners
            function setupEventListeners() {
                // Theme toggle
                themeToggle.addEventListener('click', toggleTheme);
                
                // Quick add task
                quickAddBtn.addEventListener('click', toggleQuickAdd);
                quickAddSubmit.addEventListener('click', addQuickTask);
                quickAddInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') addQuickTask();
                });
                
                // Modal operations
                quickAddBtn.addEventListener('click', openModal);
                saveTaskBtn.addEventListener('click', saveTask);
                cancelTaskBtn.addEventListener('click', closeModal);
                closeModalBtn.addEventListener('click', closeModal);
                
                // Sorting and filtering
                sortSelect.addEventListener('change', function() {
                    currentSort = this.value;
                    renderTasks();
                });
                
                searchInput.addEventListener('input', function() {
                    renderTasks();
                });
                
                // Click outside modal to close
                window.addEventListener('click', function(e) {
                    if (e.target === taskModal) closeModal();
                });
                
                // Import/Export functionality
                document.getElementById('import-btn').addEventListener('click', importTasks);
                document.getElementById('export-btn').addEventListener('click', exportTasks);
                document.getElementById('file-input').addEventListener('change', handleFileImport);
                
                // List selection
                document.querySelectorAll('.sidebar-menu a').forEach(item => {
                    item.addEventListener('click', function(e) {
                        e.preventDefault();
                        document.querySelectorAll('.sidebar-menu li').forEach(li => {
                            li.classList.remove('active');
                        });
                        this.parentElement.classList.add('active');
                        
                        const listName = this.textContent.trim();
                        document.getElementById('current-view').textContent = listName;
                        currentList = this.getAttribute('data-list') || 'all';
                        renderTasks();
                    });
                });
                
                // Add new list
                document.getElementById('add-list-btn').addEventListener('click', addNewList);
                
                // Add subtask
                document.getElementById('add-subtask').addEventListener('click', addSubtask);
                
                // Add attachment
                document.getElementById('add-attachment').addEventListener('click', function() {
                    document.getElementById('file-upload').click();
                });
            }
            
            // Theme toggle functionality
            function toggleTheme() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
                
                // Add animation class for smooth transition
                document.body.classList.add('theme-transition');
                setTimeout(() => {
                    document.body.classList.remove('theme-transition');
                }, 300);
            }
            
            // Quick add panel toggle
            function toggleQuickAdd() {
                quickAddPanel.classList.toggle('active');
                if (quickAddPanel.classList.contains('active')) {
                    quickAddInput.focus();
                }
            }
            
            // Add task from quick add
            function addQuickTask() {
                const title = quickAddInput.value.trim();
                if (title) {
                    const newTask = {
                        id: Date.now().toString(),
                        title: title,
                        completed: false,
                        priority: 'medium',
                        dueDate: null,
                        list: 'home',
                        createdAt: new Date().toISOString()
                    };
                    
                    tasks.unshift(newTask);
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    // Show confirmation animation
                    const confirmation = document.createElement('div');
                    confirmation.className = 'notification';
                    confirmation.innerHTML = `<i class="fas fa-check"></i> Task added successfully`;
                    document.body.appendChild(confirmation);
                    
                    setTimeout(() => {
                        confirmation.classList.add('show');
                    }, 10);
                    
                    setTimeout(() => {
                        confirmation.classList.remove('show');
                        setTimeout(() => {
                            document.body.removeChild(confirmation);
                        }, 300);
                    }, 2000);
                    
                    quickAddInput.value = '';
                    quickAddPanel.classList.remove('active');
                }
            }
            
            // Open modal for new task or editing
            function openModal(taskId = null) {
                const modalTitle = document.getElementById('modal-title');
                const isEdit = taskId !== null;
                
                if (isEdit) {
                    modalTitle.textContent = 'Edit Task';
                    const task = tasks.find(t => t.id === taskId);
                    populateModal(task);
                } else {
                    modalTitle.textContent = 'Add New Task';
                    resetModal();
                }
                
                taskModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Close modal
            function closeModal() {
                taskModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                resetModal();
            }
            
            // Reset modal form
            function resetModal() {
                document.getElementById('task-title').value = '';
                document.querySelectorAll('.priority-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector('.priority-btn.medium').classList.add('active');
                document.getElementById('due-date').value = '';
                document.getElementById('due-time').value = '';
                document.getElementById('reminder').value = '';
                document.getElementById('repeat-frequency').value = 'none';
                document.getElementById('subtasks-container').innerHTML = '';
                document.getElementById('task-list-select').value = 'home';
                document.getElementById('task-notes').value = '';
                document.getElementById('attachments-container').innerHTML = '';
            }
            
            // Populate modal with task data
            function populateModal(task) {
                document.getElementById('task-title').value = task.title;
                
                // Set priority
                document.querySelectorAll('.priority-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.priority === task.priority) {
                        btn.classList.add('active');
                    }
                });
                
                // Set due date and time if available
                if (task.dueDate) {
                    const date = new Date(task.dueDate);
                    document.getElementById('due-date').value = date.toISOString().split('T')[0];
                    document.getElementById('due-time').value = date.toTimeString().substring(0, 5);
                }
                
                // Set other fields
                if (task.reminder) {
                    document.getElementById('reminder').value = task.reminder;
                }
                
                if (task.repeat) {
                    document.getElementById('repeat-frequency').value = task.repeat;
                }
                
                // Populate subtasks
                const subtasksContainer = document.getElementById('subtasks-container');
                subtasksContainer.innerHTML = '';
                
                if (task.subtasks && task.subtasks.length > 0) {
                    task.subtasks.forEach(subtask => {
                        const subtaskEl = createSubtaskElement(subtask);
                        subtasksContainer.appendChild(subtaskEl);
                    });
                }
                
                if (task.list) {
                    document.getElementById('task-list-select').value = task.list;
                }
                
                if (task.notes) {
                    document.getElementById('task-notes').value = task.notes;
                }
                
                // Populate attachments
                const attachmentsContainer = document.getElementById('attachments-container');
                attachmentsContainer.innerHTML = '';
                
                if (task.attachments && task.attachments.length > 0) {
                    task.attachments.forEach(attachment => {
                        const attachmentEl = createAttachmentElement(attachment);
                        attachmentsContainer.appendChild(attachmentEl);
                    });
                }
                
                // Set save button to update mode
                saveTaskBtn.dataset.mode = 'edit';
                saveTaskBtn.dataset.id = task.id;
            }
            
            // Create subtask element
            function createSubtaskElement(subtask) {
                const div = document.createElement('div');
                div.className = 'subtask-item';
                div.innerHTML = `
                    <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                    <input type="text" class="subtask-text" value="${subtask.title}" placeholder="Subtask title">
                    <div class="subtask-actions">
                        <button class="task-btn delete-subtask"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                return div;
            }
            
            // Add new subtask
            function addSubtask() {
                const subtasksContainer = document.getElementById('subtasks-container');
                const subtaskEl = createSubtaskElement({ title: '', completed: false });
                subtasksContainer.appendChild(subtaskEl);
            }
            
            // Create attachment element
            function createAttachmentElement(attachment) {
                const div = document.createElement('div');
                div.className = 'attachment-item';
                div.innerHTML = `
                    <div class="attachment-icon">
                        <i class="fas fa-file"></i>
                    </div>
                    <div class="attachment-name">${attachment.name}</div>
                    <div class="attachment-actions">
                        <button class="task-btn download-attachment"><i class="fas fa-download"></i></button>
                        <button class="task-btn delete-attachment"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                return div;
            }
            
            // Save task from modal
            function saveTask() {
                const title = document.getElementById('task-title').value.trim();
                if (!title) return;
                
                const priority = document.querySelector('.priority-btn.active').dataset.priority;
                const dueDate = document.getElementById('due-date').value;
                const dueTime = document.getElementById('due-time').value;
                const reminder = document.getElementById('reminder').value;
                const repeat = document.getElementById('repeat-frequency').value;
                const list = document.getElementById('task-list-select').value;
                const notes = document.getElementById('task-notes').value;
                
                // Collect subtasks
                const subtasks = [];
                const subtaskElements = document.querySelectorAll('.subtask-item');
                subtaskElements.forEach(item => {
                    const checkbox = item.querySelector('.subtask-checkbox');
                    const input = item.querySelector('.subtask-text');
                    if (input.value.trim()) {
                        subtasks.push({
                            title: input.value.trim(),
                            completed: checkbox.checked
                        });
                    }
                });
                
                // Collect attachments (in a real app, you'd handle file uploads)
                const attachments = [];
                const attachmentElements = document.querySelectorAll('.attachment-item');
                attachmentElements.forEach(item => {
                    const nameElement = item.querySelector('.attachment-name');
                    if (nameElement) {
                        attachments.push({
                            name: nameElement.textContent,
                            // In a real app, you'd store the file data or path
                        });
                    }
                });
                
                let dueDateTime = null;
                if (dueDate && dueTime) {
                    dueDateTime = new Date(`${dueDate}T${dueTime}`).toISOString();
                } else if (dueDate) {
                    dueDateTime = new Date(`${dueDate}T23:59:59`).toISOString();
                }
                
                const isEdit = saveTaskBtn.dataset.mode === 'edit';
                
                if (isEdit) {
                    // Update existing task
                    const taskId = saveTaskBtn.dataset.id;
                    const taskIndex = tasks.findIndex(t => t.id === taskId);
                    
                    if (taskIndex !== -1) {
                        tasks[taskIndex] = {
                            ...tasks[taskIndex],
                            title,
                            priority,
                            dueDate: dueDateTime,
                            reminder,
                            repeat,
                            list,
                            notes,
                            subtasks,
                            attachments
                        };
                    }
                } else {
                    // Create new task
                    const newTask = {
                        id: Date.now().toString(),
                        title,
                        completed: false,
                        priority,
                        dueDate: dueDateTime,
                        reminder,
                        repeat,
                        list,
                        notes,
                        subtasks,
                        attachments,
                        createdAt: new Date().toISOString()
                    };
                    
                    tasks.unshift(newTask);
                }
                
                saveTasks();
                renderTasks();
                updateStats();
                closeModal();
                
                // Show success message
                showNotification(isEdit ? 'Task updated successfully!' : 'Task added successfully!');
            }
            
            // Show notification
            function showNotification(message) {
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('show');
                }, 10);
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }
            
            // Load tasks from localStorage
            function loadTasks() {
                const storedTasks = localStorage.getItem('tasks');
                if (storedTasks) {
                    tasks = JSON.parse(storedTasks);
                    renderTasks();
                }
            }
            
            // Save tasks to localStorage
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            // Render tasks based on current filters
            function renderTasks() {
                const searchTerm = searchInput.value.toLowerCase();
                
                let filteredTasks = tasks.filter(task => {
                    // Filter by search term
                    if (searchTerm && !task.title.toLowerCase().includes(searchTerm)) {
                        return false;
                    }
                    
                    // Filter by current list
                    if (currentList !== 'all' && task.list !== currentList) {
                        return false;
                    }
                    
                    // Additional filtering based on current view
                    if (currentList === 'today') {
                        const today = new Date().toDateString();
                        if (!task.dueDate || new Date(task.dueDate).toDateString() !== today) {
                            return false;
                        }
                    } else if (currentList === 'overdue') {
                        if (!task.dueDate || new Date(task.dueDate) >= new Date()) {
                            return false;
                        }
                    } else if (currentList === 'prioritized') {
                        if (task.priority !== 'high') {
                            return false;
                        }
                    }
                    
                    return true;
                });
                
                // Sort tasks
                filteredTasks.sort((a, b) => {
                    if (currentSort === 'date') {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    } else if (currentSort === 'priority') {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    } else if (currentSort === 'name') {
                        return a.title.localeCompare(b.title);
                    }
                    return 0;
                });
                
                // Render tasks
                taskList.innerHTML = '';
                
                if (filteredTasks.length === 0) {
                    taskList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>No tasks found</h3>
                            <p>${searchTerm ? 'Try a different search term' : 'Add a new task to get started'}</p>
                        </div>
                    `;
                    return;
                }
                
                filteredTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            }
            
            // Create task element
            function createTaskElement(task) {
                const taskEl = document.createElement('div');
                taskEl.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
                taskEl.dataset.id = task.id;
                
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const isOverdue = dueDate && dueDate < new Date() && !task.completed;
                
                let dueText = '';
                if (dueDate) {
                    if (isOverdue) {
                        dueText = `Overdue: ${formatDate(dueDate)}`;
                    } else {
                        dueText = `Due: ${formatDate(dueDate)}`;
                    }
                }
                
                const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
                const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
                const subtasksText = totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} subtasks` : '';
                
                taskEl.innerHTML = `
                    <div class="task-checkbox-wrapper">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="checkbox-replacement">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <div class="task-content">
                        <h3 class="task-title">${task.title}</h3>
                        <div class="task-meta">
                            ${dueText ? `<span class="task-due ${isOverdue ? 'overdue' : ''}"><i class="fas fa-clock"></i> ${dueText}</span>` : ''}
                            ${subtasksText ? `<span class="task-subtasks"><i class="fas fa-list-check"></i> ${subtasksText}</span>` : ''}
                            <span class="task-list">${task.list}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                        <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                // Add event listeners
                const checkbox = taskEl.querySelector('.task-checkbox');
                checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
                
                const editBtn = taskEl.querySelector('.edit');
                editBtn.addEventListener('click', () => openModal(task.id));
                
                const deleteBtn = taskEl.querySelector('.delete');
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
                
                return taskEl;
            }
            
            // Format date for display
            function formatDate(date) {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                if (date.toDateString() === today.toDateString()) {
                    return 'Today' + (date.toTimeString() !== '23:59:59' ? `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '');
                } else if (date.toDateString() === tomorrow.toDateString()) {
                    return 'Tomorrow' + (date.toTimeString() !== '23:59:59' ? `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '');
                } else {
                    return date.toLocaleDateString() + (date.toTimeString() !== '23:59:59' ? `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '');
                }
            }
            
            // Toggle task completion
            function toggleTaskComplete(taskId) {
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = !tasks[taskIndex].completed;
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    // Add completion animation
                    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
                    if (taskElement) {
                        if (tasks[taskIndex].completed) {
                            taskElement.classList.add('just-completed');
                            setTimeout(() => {
                                taskElement.classList.remove('just-completed');
                            }, 1000);
                        }
                    }
                }
            }
            
            // Delete task
            function deleteTask(taskId) {
                if (confirm('Are you sure you want to delete this task?')) {
                    tasks = tasks.filter(t => t.id !== taskId);
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    // Show delete notification
                    showNotification('Task deleted successfully!');
                }
            }
            
            // Update task statistics
            function updateStats() {
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.completed).length;
                const overdueTasks = tasks.filter(t => {
                    return t.dueDate && new Date(t.dueDate) < new Date() && !t.completed;
                }).length;
                
                document.getElementById('total-tasks').textContent = totalTasks;
                document.getElementById('completed-tasks').textContent = completedTasks;
                document.getElementById('overdue-tasks').textContent = overdueTasks;
                
                // Update progress ring
                updateProgressRing(completedTasks, totalTasks);
            }
            
            // Update progress ring visualization
            function updateProgressRing(completed, total) {
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                const circle = document.querySelector('.progress-ring-value');
                const text = document.querySelector('.progress-text');
                
                if (circle) {
                    const circumference = 2 * Math.PI * 16;
                    const dashoffset = circumference - (percentage / 100) * circumference;
                    circle.style.strokeDasharray = `${circumference} ${circumference}`;
                    circle.style.strokeDashoffset = dashoffset;
                }
                
                if (text) {
                    text.textContent = `${percentage}%`;
                }
            }
            
            // Add new list
            function addNewList() {
                const listName = prompt('Enter the name for your new list:');
                if (listName && listName.trim()) {
                    const listsContainer = document.getElementById('lists-container');
                    const newList = document.createElement('li');
                    newList.innerHTML = `<a href="#" data-list="${listName.toLowerCase()}"><i class="fas fa-list"></i> ${listName}</a>`;
                    listsContainer.appendChild(newList);
                    
                    // Add event listener to the new list
                    newList.querySelector('a').addEventListener('click', function(e) {
                        e.preventDefault();
                        document.querySelectorAll('.sidebar-menu li').forEach(li => {
                            li.classList.remove('active');
                        });
                        this.parentElement.classList.add('active');
                        
                        document.getElementById('current-view').textContent = listName;
                        currentList = this.getAttribute('data-list');
                        renderTasks();
                    });
                    
                    // Add the new list to the task list select in modal
                    const select = document.getElementById('task-list-select');
                    const option = document.createElement('option');
                    option.value = listName.toLowerCase();
                    option.textContent = listName;
                    select.appendChild(option);
                }
            }
            
            // Export tasks to JSON file
            function exportTasks() {
                const dataStr = JSON.stringify(tasks, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = 'tasks.json';
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            }
            
            // Import tasks from JSON file
            function importTasks() {
                document.getElementById('file-input').click();
            }
            
            // Handle file import
            function handleFileImport(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importedTasks = JSON.parse(e.target.result);
                        if (Array.isArray(importedTasks)) {
                            if (confirm('This will replace your current tasks. Continue?')) {
                                tasks = importedTasks;
                                saveTasks();
                                renderTasks();
                                updateStats();
                                showNotification('Tasks imported successfully!');
                            }
                        } else {
                            alert('Invalid file format');
                        }
                    } catch (error) {
                        alert('Error parsing file: ' + error.message);
                    }
                };
                reader.readAsText(file);
                
                // Reset file input
                e.target.value = '';
            }
            
            // Initialize the app
            init();
        });
    