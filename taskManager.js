// A simple class to create a new Task object
class Task {
    constructor(title, description, color, startDate, status, budget) {
        this.title = title;
        this.description = description;
        this.color = color;
        this.startDate = startDate;
        this.status = status;
        this.budget = parseFloat(budget).toFixed(2); 
        this.id = Date.now(); // Simple unique ID
    }
}

// Global array to store all created tasks (Data Source for Reactivity)
let allTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    // Attach form handler to intercept submission and prevent page reload
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleFormSubmit);
    
    // Attach click handlers for accordion collapse/expand (UI Reactivity)
    document.getElementById('createTaskHeader').addEventListener('click', toggleAccordion);
    document.getElementById('taskListHeader').addEventListener('click', toggleAccordion);

    // Initial load
    displayTasks(); 
    updateMetrics();
});

/**
 * Handles the form submission event, validating input and updating state.
 */
function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateInputs()) {
        return;
    }

    const newTask = readFormValues();
    // Update data state (allTasks array)
    allTasks.push(newTask);
    
    // Update UI (Task List and Metrics)
    displayTasks();
    highlightTaskList(); 
    
    // Clear form for next entry
    document.getElementById('taskForm').reset();
}

/**
 * Validates all required form inputs.
 */
function validateInputs() {
    let isValid = true;
    
    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const startDate = document.getElementById('startDate');
    const budget = document.getElementById('budget');
    
    const setError = (element, message) => {
        const errorElement = document.getElementById(element.id + 'Error');
        if (message) {
            errorElement.textContent = message;
            isValid = false;
        } else {
            errorElement.textContent = '';
        }
    };

    // Validation checks
    if (title.value.trim().length < 3) { setError(title, "Title must be at least 3 characters."); } else { setError(title, ""); }
    if (description.value.trim().length < 10) { setError(description, "Description must be at least 10 characters."); } else { setError(description, ""); }
    if (!startDate.value) { setError(startDate, "Start date is required."); } else { setError(startDate, ""); }
    const budgetValue = parseFloat(budget.value);
    if (isNaN(budgetValue) || budgetValue <= 0) { setError(budget, "Budget must be a positive number."); } else { setError(budget, ""); }
    
    return isValid;
}

/**
 * Calculates and updates the dashboard metrics (Reactive).
 */
function updateMetrics() {
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.status === 'Completed').length;
    const budgetSum = allTasks.reduce((acc, task) => acc + parseFloat(task.budget), 0);

    // Update UI text content
    document.getElementById('totalTasksCount').textContent = total;
    document.getElementById('completedTasksCount').textContent = completed;
    document.getElementById('totalBudget').textContent = budgetSum.toFixed(2);
}

/**
 * Toggles the visibility of the accordion body (Reactive UI).
 */
function toggleAccordion(e) {
    const body = e.currentTarget.nextElementSibling;
    
    if (body && body.classList.contains('accordion-body')) {
        body.classList.toggle('active');
        if (body.classList.contains('active')) {
            // Smoothly open
            body.style.maxHeight = body.scrollHeight + "px";
        } else {
            // Smoothly close
            body.style.maxHeight = "0";
        }
    }
}

/**
 * Clears the task list and redraws all tasks (Primary Reactivity function).
 */
function displayTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear existing tasks
    
    if (allTasks.length === 0) {
        taskList.innerHTML = `<div class="no-tasks-message"><p><strong>0 No tasks yet!</strong></p><p>Create your first task to get started!</p></div>`;
    } else {
        allTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.style.borderColor = task.color; 

            taskCard.innerHTML = `
                <h3>${task.title} 
                    <span class="status-tag status-${task.status.replace(/\s+/g, '-').toLowerCase()}">${task.status}</span>
                </h3>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Start Date:</strong> ${task.startDate}</p>
                <p><strong>Budget:</strong> $${task.budget}</p>
                <div class="card-actions">
                    <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
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

function highlightTaskList() {
    const taskListContainer = document.getElementById('taskList');
    taskListContainer.classList.add('highlight-success');
    setTimeout(() => {
        taskListContainer.classList.remove('highlight-success');
    }, 700);
}

function readFormValues() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const color = document.getElementById('color').value;
    const startDate = document.getElementById('startDate').value;
    const status = document.getElementById('status').value;
    const budget = document.getElementById('budget').value;
    
    return new Task(title, description, color, startDate, status, budget);
}

function editTask(id) {
    const taskToEdit = allTasks.find(task => task.id === id);
    if (taskToEdit) {
        alert(`Editing task: ${taskToEdit.title}. (Implementation required to load data into the form)`);
    }
}