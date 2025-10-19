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

