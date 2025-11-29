function sayHello() {
  console.log("Hello World");
  howAreYou();
}

function sayGoodbye() {
  console.log("Goodbye World");
}

function howAreYou() {
  console.log("How are you, World?");
  sayGoodbye();
}

window.onload = howAreYou;
// execute the function when the page loads -
// this means that i wait until the html and the css are loaded before i
// execute the javascript