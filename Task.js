// A simple class to create a new Task object
class Task {
    constructor(title, description, color, startDate, status, budget, _id = null) {
        this.title = title;
        this.description = description;
        this.color = color;
        this.startDate = startDate;
        this.status = status;
        this.budget = parseFloat(budget).toFixed(2); 
        this._id = _id || Date.now().toString();
    }
}

// API Configuration
const API_URL = 'https://106api-b0bnggbsgnezbzcz.westus3-01.azurewebsites.net/api/tasks';

// Global array to store all created tasks (Data Source for Reactivity)
let allTasks = [];
// Variable to hold the ID of the task being edited
let currentEditingTaskId = null; 

// Color Logic Constants
const SLIDER_MAX = 19;
const HUE_STEP = 360 / SLIDER_MAX; 

/**
 * Maps a slider value (0-19) to an HSL color string.
 */
function getHslColor(value) {
    const hue = value * HUE_STEP;
    return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Gets a descriptive name for the color based on the slider value.
 */
function getColorName(value) {
    if (value === 0) return "Red";
    if (value >= 1 && value <= 3) return "Orange";
    if (value >= 4 && value <= 6) return "Yellow";
    if (value >= 7 && value <= 10) return "Green";
    if (value >= 11 && value <= 13) return "Cyan";
    if (value >= 14 && value <= 16) return "Blue";
    if (value >= 17 && value <= 19) return "Magenta";
    return `Hue ${value}`;
}

// ==================== API FUNCTIONS ====================

/**
 * Load all tasks from the server
 */
async function loadTasks() {
    try {
        showNotification('Loading tasks...', 'info');
        const response = await fetch(API_URL);
        
        if (response.ok) {
            const data = await response.json();
            allTasks = Array.isArray(data) ? data : [];
            displayTasks();
            showNotification('Tasks loaded successfully!', 'success');
        } else {
            console.error('Failed to load tasks');
            showNotification('Failed to load tasks from server', 'error');
            allTasks = [];
            displayTasks();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error connecting to server', 'error');
        allTasks = [];
        displayTasks();
    }
}

/**
 * Save a new task to the server
 */
async function saveTaskToServer(task) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            showNotification('Task saved successfully!', 'success');
            await loadTasks(); // Reload all tasks from server
            return true;
        } else {
            showNotification('Failed to save task', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification('Error saving task to server', 'error');
        return false;
    }
}

/**
 * Update an existing task on the server
 */
async function updateTaskOnServer(task) {
    try {
        const response = await fetch(`${API_URL}/${task._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(task)
        });
        
        if (response.ok) {
            showNotification('Task updated successfully!', 'success');
            await loadTasks(); // Reload all tasks from server
            return true;
        } else {
            showNotification('Failed to update task', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Error updating task on server', 'error');
        return false;
    }
}

/**
 * Delete a task from the server
 */
async function deleteTaskFromServer(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Task deleted successfully!', 'success');
            await loadTasks(); // Reload all tasks from server
            return true;
        } else {
            showNotification('Failed to delete task', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task from server', 'error');
        return false;
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleFormSubmit); 
    
    document.getElementById('createTaskHeader').addEventListener('click', toggleAccordion);
    document.getElementById('taskListHeader').addEventListener('click', toggleAccordion);

    document.getElementById('btnReset').addEventListener('click', resetForm);
    document.getElementById('btnUpdate').addEventListener('click', handleUpdateTask); 
    
    const colorSlider = document.getElementById('colorSlider');
    colorSlider.addEventListener('input', updateColorDisplay);
    
    // Initial call to set default color
    updateColorDisplay();

    // Make global functions available to the HTML for button clicks
    window.editTask = editTask;
    window.deleteTask = deleteTask;

    // Load tasks from server on page load
    loadTasks();
});

// ==================== FORM FUNCTIONS ====================

/**
 * Updates the color display text and the hidden input value based on the slider.
 */
function updateColorDisplay() {
    const slider = document.getElementById('colorSlider');
    const colorDisplay = document.getElementById('colorNameDisplay');
    const colorHiddenInput = document.getElementById('color');
    const sliderValue = parseInt(slider.value);
    
    const selectedColor = getHslColor(sliderValue);
    const colorName = getColorName(sliderValue);
    
    colorDisplay.textContent = colorName;
    colorHiddenInput.value = selectedColor;
}

/**
 * Handles the form submission event (used for SAVE).
 */
function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateInputs()) {
        return;
    }
    
    // If we're in edit mode, proceed to update
    if (currentEditingTaskId !== null) {
        handleUpdateTask();
        return;
    }
    
    // Otherwise, create a new task
    const newTask = readFormValues();
    saveTaskToServer(newTask);
    resetForm();
}

/**
 * Handles the update task logic (for EDIT).
 */
async function handleUpdateTask() {
    if (!validateInputs()) {
        return;
    }
    
    const updatedTaskData = readFormValues(currentEditingTaskId);
    const success = await updateTaskOnServer(updatedTaskData);
    
    if (success) {
        resetForm();
    }
}

/**
 * Reads all values from the form inputs.
 */
function readFormValues(id = null) {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const color = document.getElementById('color').value; 
    const startDate = document.getElementById('startDate').value;
    const status = document.getElementById('status').value;
    const budget = document.getElementById('budget').value;
    
    return new Task(title, description, color, startDate, status, budget, id);
}

/**
 * Basic input validation.
 */
function validateInputs() {
    let isValid = true;
    
    const fields = [
        { id: 'title' },
        { id: 'description' },
        { id: 'startDate' },
        { id: 'status' },
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const errorElement = document.getElementById(`${field.id}Error`);
        
        if (input.value.trim() === '') {
            errorElement.style.visibility = 'visible';
            isValid = false;
        } else {
            errorElement.style.visibility = 'hidden';
        }
    });

    // Budget validation
    const budgetInput = document.getElementById('budget');
    const budgetError = document.getElementById('budgetError');
    const budgetValue = parseFloat(budgetInput.value);

    if (budgetInput.value.trim() === '' || isNaN(budgetValue) || budgetValue < 0) {
        budgetError.style.visibility = 'visible'; 
        isValid = false;
    } else {
        budgetError.style.visibility = 'hidden';
    }

    return isValid;
}

/**
 * Resets the form and returns the UI to "Save" mode.
 */
function resetForm() {
    document.getElementById('taskForm').reset();
    
    document.querySelectorAll('.text-danger').forEach(el => el.style.visibility = 'hidden');
    
    currentEditingTaskId = null;
    
    document.getElementById('colorSlider').value = 0;
    updateColorDisplay(); 

    document.getElementById('btnSave').style.display = 'block';
    document.getElementById('btnUpdate').style.display = 'none';
}

// ==================== DISPLAY FUNCTIONS ====================

function toggleAccordion(e) {
    const body = e.currentTarget.nextElementSibling;
    body.classList.toggle('active');
}

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

function displayTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; 

    if (allTasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No tasks added yet. Create one to get started!</p>';
    } else {
        allTasks.forEach(task => {
            const statusClass = task.status.toLowerCase().replace(/\s+/g, '-');
            const statusBadgeClass = `status-${statusClass}`;
            
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.style.setProperty('--task-color', task.color); 
            
            taskCard.innerHTML = `
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="editTask('${task._id}')">✎</button>
                    <button class="action-btn delete-btn" onclick="deleteTask('${task._id}')">✖</button>
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

    updateMetrics();
}

// ==================== TASK ACTIONS ====================

async function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        await deleteTaskFromServer(id);
        if (currentEditingTaskId === id) {
            resetForm(); 
        }
    }
}

function editTask(id) {
    const taskToEdit = allTasks.find(task => task._id == id);
    if (taskToEdit) {
        currentEditingTaskId = id;

        document.getElementById('title').value = taskToEdit.title;
        document.getElementById('description').value = taskToEdit.description;
        document.getElementById('startDate').value = taskToEdit.startDate;
        document.getElementById('status').value = taskToEdit.status;
        document.getElementById('budget').value = parseFloat(taskToEdit.budget);
        
        const colorSlider = document.getElementById('colorSlider');
        
        if (taskToEdit.color && taskToEdit.color.startsWith('hsl')) {
            const hueMatch = taskToEdit.color.match(/hsl\((\d+)/);
            if (hueMatch && hueMatch[1]) {
                const hue = parseInt(hueMatch[1]);
                const sliderValue = Math.round(hue / HUE_STEP);
                colorSlider.value = sliderValue;
                updateColorDisplay(); 
            }
        } else {
            colorSlider.value = 0;
            updateColorDisplay();
        }
        
        document.getElementById('btnSave').style.display = 'none';
        document.getElementById('btnUpdate').style.display = 'block';
        
        document.getElementById('createTaskHeader').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('createTaskBody').classList.add('active');
    }
}

// ==================== NOTIFICATION SYSTEM ====================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification notification-${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}