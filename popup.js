// whenever the popup button is clicked, this code is run

function scanBtn() {
    console.log("button is scannign");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scanBtn");
  btn.addEventListener("click", () => {
    console.log("button is scanning");
    scanBtn();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const demoBtn = document.getElementById("demoBtn");
  const resultsDiv = document.getElementById("results");

  // Scan button: calls background.js to scan Gmail
  scanBtn.addEventListener("click", () => {
    resultsDiv.textContent = "Requesting permission and scanning...";
    chrome.runtime.sendMessage({ action: "scan" }, (response) => {
      if (!response) {
        resultsDiv.textContent = "No response from background script.";
        return;
      }
      if (response.error) {
        resultsDiv.textContent = "Error: " + response.error;
        return;
      }
      const messages = response.messages;
      resultsDiv.innerHTML = "";
      if (!messages || messages.length === 0) {
        resultsDiv.textContent = "No recent messages found.";
        return;
      }
      const ul = document.createElement("ul");
      messages.forEach(m => {
        const li = document.createElement("li");
        li.textContent = m.id;
        ul.appendChild(li);
      });
      const title = document.createElement("div");
      title.className = "verdict";
      title.textContent = `Found ${messages.length} messages (IDs):`;
      resultsDiv.appendChild(title);
      resultsDiv.appendChild(ul);
    });
  });

  // Demo button: opens demo.html in a new tab
  demoBtn.addEventListener("click", () => {
    const demoUrl = chrome.runtime.getURL("demo.html");
    window.open(demoUrl, "_blank");
  });
});
