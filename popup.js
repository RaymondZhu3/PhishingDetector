// update counters
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("emailSummary", (data) => {
        if (data.emailSummary) {
            const urgentEl = document.getElementsByClassName("urgentVal")[0];
            const warningEl = document.getElementsByClassName("warningVal")[0];
            urgentEl.textContent = data.emailSummary.rCount;
            warningEl.textContent = data.emailSummary.yCount;
        }
    });
});

// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   // activeInfo object contains information about the newly active tab
//   // activeInfo.tabId: ID of the tab that has become active
//   // activeInfo.windowId: ID of the window containing the active tab
//   console.log("switched tab id: " + activeInfo.tabId);

//   console.log("Tab switched! New active tab ID:", activeInfo.tabId);
//   // You can perform actions here based on the tab switch,
//   // such as updating your extension's UI, fetching data, etc.
// });

