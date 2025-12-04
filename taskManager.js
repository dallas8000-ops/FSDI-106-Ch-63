// A simple class to create a new Task object
class Task {
    constructor(title, description, color, startDate, status, budget, id = Date.now()) {
        this.title = title;
        this.description = description;
        this.color = color;
        this.startDate = startDate;
        this.status = status;
        this.budget = parseFloat(budget).toFixed(2); 
        this.id = id; // Allow passing ID for update/edit
    }
}

// Global array to store all created tasks (Data Source for Reactivity)
let allTasks = [];
// Variable to hold the ID of the task being edited
let currentEditingTaskId = null; 

document.addEventListener('DOMContentLoaded', () => {
    // Attach form handler to intercept submission and prevent page reload
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleFormSubmit);
    
    // Attach click handlers for accordion collapse/expand (UI Reactivity)
    document.getElementById('createTaskHeader').addEventListener('click', toggleAccordion);
    document.getElementById('taskListHeader').addEventListener('click', toggleAccordion);

    // --- NEW: Attach handler for the Reset Form button ---
    document.getElementById('btnReset').addEventListener('click', resetForm);
    // --- NEW: Attach handler for the Update Task button (for edit flow) ---
    document.getElementById('btnUpdate').addEventListener('click', handleUpdateTask);
    
    // Initial load
    displayTasks(); 
    updateMetrics();
});

/**
 * Handles the form submission event (used for SAVE).
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // If we're in edit mode, prevent 'Save' from running and defer to 'Update'
    if (currentEditingTaskId !== null) {
        handleUpdateTask();
        return;
    }
    
    if (!validateInputs()) {
        return;
    }

    const newTask = readFormValues();
    // Update data state (allTasks array)
    allTasks.push(newTask);
    
    // Update UI (Task List & Metrics)
    displayTasks(); 
    highlightTaskList();
    
    // Clear the form
    resetForm();
}

/**
 * Handles the update task logic (for EDIT).
 */
function handleUpdateTask() {
    if (!validateInputs()) {
        return;
    }
    
    // 1. Read the new values, maintaining the original ID
    const updatedTaskData = readFormValues(currentEditingTaskId);
    
    // 2. Find the index of the task to update
    const index = allTasks.findIndex(task => task.id === currentEditingTaskId);
    
    if (index !== -1) {
        // 3. Replace the old task object with the new one
        allTasks[index] = updatedTaskData;
    }
    
    // 4. Update UI and reset state
    displayTasks(); 
    highlightTaskList();
    resetForm();
}

/**
 * Reads all values from the form inputs.
 * @param {number} [id] - The ID of the task being edited (optional).
 */
function readFormValues(id = null) {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    // Color is a radio input, so we use querySelector
    const color = document.querySelector('input[name="color"]:checked').value;
    const startDate = document.getElementById('startDate').value;
    const status = document.getElementById('status').value;
    const budget = document.getElementById('budget').value;
    
    // Use existing ID if provided, otherwise create a new one in the Task constructor
    return new Task(title, description, color, startDate, status, budget, id);
}

/**
 * Basic input validation. (Unchanged, so omitting for brevity, but it should remain)
 */
function validateInputs() {
    let isValid = true;
    
    const fields = [
        { id: 'title', message: 'Title is required.' },
        { id: 'description', message: 'Description is required.' },
        { id: 'startDate', message: 'Start Date is required.' },
        { id: 'status', message: 'Status is required.' },
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorElement = document.getElementById(`${field.id}Error`);
        
        if (input.value.trim() === '') {
            errorElement.style.display = 'block';
            isValid = false;
        } else {
            errorElement.style.display = 'none';
        }
    });

    // Budget validation (must be a number >= 0)
    const budgetInput = document.getElementById('budget');
    const budgetError = document.getElementById('budgetError');
    const budgetValue = parseFloat(budgetInput.value);

    if (isNaN(budgetValue) || budgetValue < 0) {
        budgetError.style.display = 'block';
        isValid = false;
    } else {
        budgetError.style.display = 'none';
    }

    return isValid;
}

/**
 * Toggles the visibility of an accordion body section. (Unchanged)
 */
function toggleAccordion(e) {
    const body = e.currentTarget.nextElementSibling;
    body.classList.toggle('active');
}


/**
 * Counts tasks by status and updates the UI metrics. (Unchanged)
 */
function updateMetrics() {
    const total = allTasks.length;
    const todo = allTasks.filter(t => t.status === 'To Do').length;
    const inProgress = allTasks.filter(t => t.status === 'In Progress').length;
    const done = allTasks.filter(t => t.status === 'Done').length;
    const blocked = allTasks.filter(t => t.status === 'Blocked').length;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('tasksTodo').textContent = todo;
    document.getElementById('tasksInProgress').textContent = inProgress;
    document.getElementById('tasksDone').textContent = done;
    document.getElementById('tasksBlocked').textContent = blocked;
}

/**
 * Rerenders the entire task list based on the global allTasks array. (Unchanged, but crucial)
 */
function displayTasks() {
    const taskList = document.getElementById('taskList');
    // Clear existing list elements
    taskList.innerHTML = ''; 

    if (allTasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No tasks added yet. Create one to get started!</p>';
    } else {
        allTasks.forEach(task => {
            const statusClass = task.status.toLowerCase().replace(/\s+/g, '-');
            const statusBadgeClass = `status-${statusClass}`;
            
            // Create the HTML structure for the task card
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.style.setProperty('--task-color', task.color); // Set CSS variable for border
            
            taskCard.innerHTML = `
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="editTask(${task.id})">✎</button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">✖</button>
                </div>
                <div class="task-title-group">
                    <span class="task-title">${task.title}</span>
                    <span class="status-badge ${statusBadgeClass}">${task.status}</span>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="summary-metrics">
                    <span>Start: <strong>${task.startDate}</strong></span>
                    |
                    <span>Budget: <strong>$${task.budget}</strong></span>
                </div>
            `;
            taskList.appendChild(taskCard);
        });
    }

    // Always update metrics after display
    updateMetrics();
}

/**
 * Removes a task from the array and redisplays the list (Reactive Action).
 */
function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        // Update data state
        allTasks = allTasks.filter(task => task.id !== id);
        // Update UI
        displayTasks(); 
    }
}

/**
 * Provides a visual highlight to the task list container upon successful action. (Unchanged)
 */
function highlightTaskList() {
    const taskListContainer = document.getElementById('taskList');
    taskListContainer.classList.add('highlight-success');
    setTimeout(() => {
        taskListContainer.classList.remove('highlight-success');
    }, 700);
}

/**
 * Finds a task by ID and pre-populates the form for editing.
 */
function editTask(id) {
    const taskToEdit = allTasks.find(task => task.id === id);
    if (taskToEdit) {
        // Set the global editing ID
        currentEditingTaskId = id;

        // Pre-populate form fields
        document.getElementById('title').value = taskToEdit.title;
        document.getElementById('description').value = taskToEdit.description;
        document.querySelector(`input[name="color"][value="${taskToEdit.color}"]`).checked = true;
        document.getElementById('startDate').value = taskToEdit.startDate;
        document.getElementById('status').value = taskToEdit.status;
        document.getElementById('budget').value = taskToEdit.budget;
        
        // UI Change: Hide Save button, Show Update button
        document.getElementById('btnSave').style.display = 'none';
        document.getElementById('btnUpdate').style.display = 'block';
        document.getElementById('btnReset').style.display = 'block'; // Keep reset visible
        
        // Scroll to form and expand it
        document.getElementById('createTaskHeader').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('createTaskBody').classList.add('active');
    }
}

/**
 * Resets the form and returns the UI to "Save" mode.
 */
function resetForm() {
    // 1. Clear form values
    document.getElementById('taskForm').reset();
    
    // 2. Clear all error messages
    document.querySelectorAll('.text-danger').forEach(el => el.style.display = 'none');
    
    // 3. Reset the editing state
    currentEditingTaskId = null;
    
    // 4. UI Change: Show Save button, Hide Update button
    document.getElementById('btnSave').style.display = 'block';
    document.getElementById('btnUpdate').style.display = 'none';
    document.getElementById('btnReset').style.display = 'block';
}