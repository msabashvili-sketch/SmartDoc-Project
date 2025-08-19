// testlogin.js
const fetch = require("node-fetch");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

(async () => {
  try {
    const email = await ask("Enter email: ");
    const password = await ask("Enter password: ");
    rl.close();

    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json(); // parse JSON
    if (!res.ok) {
      console.error("Login failed:", data.message || data);
      return;
    }

    console.log("Login successful!");
    console.log("Token:", data.token);
    console.log("User:", data.user);
  } catch (err) {
    console.error("Error connecting to server:", err.message);
  }
})();