// Global scope variable (accessible everywhere)
const globalMessage = "The button was clicked!"; 

// 1. Basic JavaScript Function
function updateText(newText) {
    // Local scope variable (only accessible inside this function)
    const elementId = "#outputArea"; 
    
    // Using jQuery to easily find the element and change its text
    $(elementId).text(newText);
}

// 2. Using jQuery to attach an event listener after the DOM is ready
$(document).ready(function() {
    
    // Attach the updateText function to the button's click event
    $("#changeTextBtn").on("click", function() {
        // Call the function using the global variable
        updateText(globalMessage);
        
        // Demonstrate scope: This would cause an error because elementId is local
        // console.log(elementId); 
    });
});