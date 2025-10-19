// document.getElementById("scanBtn").addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         chrome.tabs.sendMessage(tabs[0].id, { type: "scanNow" }, (response) => {
//             if (response.ok) {
//                 console.log(`Scanned ${response.scanned} emails`);
//                 alert(`Scanned ${response.scanned} emails!`);
//             } else {
//                 console.error(response.error);
//                 alert("Error scanning emails: " + response.error);
//             }
//         });
//     });
// });

// chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         chrome.tabs.sendMessage(tabs[0].id, { type: "scanNow" }, (response) => {
//             if (response.ok) {
//                 console.log(`Scanned ${response.scanned} emails`);
//                 alert(`Scanned ${response.scanned} emails!`);
//             } else {
//                 console.error(response.error);
//                 alert("Error scanning emails: " + response.error);
//             }
//         });
//     });

// console.log(redCounter);

function renderCounts(red, yellow) {
    const urgentEl = document.getElementsByClassName("urgentVal")[0];
    const warningEl = document.getElementsByClassName("warningVal")[0];
    if (urgentEl) urgentEl.textContent = red ?? 0;
    if (warningEl) warningEl.textContent = yellow ?? 0;
}

// // On popup open
// document.addEventListener("DOMContentLoaded", () => {
//     chrome.storage.local.get(["redCount","yellowCount"], (items) => {
//         renderCounts(items.redCount || 0, items.yellowCount || 0);
//     });
// });

// // Listen for live updates while popup is open
// chrome.runtime.onMessage.addListener((msg) => {
//     if (msg.type === "countsUpdated") {
//         renderCounts(msg.redCount, msg.yellowCount);
//     }
// });

document.addEventListener("DOMContentLoaded", () => {
    console.log("popup has beern opened!!");
    chrome.storage.local.get("emailSummary", (data) => {
        if (data.emailSummary) {
            console.log("got here!");
            console.log(data);
            const urgentEl = document.getElementsByClassName("urgentVal")[0];
            const warningEl = document.getElementsByClassName("warningVal")[0];
            urgentEl.textContent = data.emailSummary.rCount;
            warningEl.textContent = data.emailSummary.yCount;
        }
    });
});

