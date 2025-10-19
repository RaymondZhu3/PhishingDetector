// whenever the popup button is clicked, this code is run


async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("scanBtn");
    btn.addEventListener("click", async () => {

        // check whether the user is on the gmail tab
        let curTab = await getCurrentTab();  // wait for the promise to resolve
        if (!curTab) {
            console.log("No active tab found");
            return;
        }

        if (curTab.url.startsWith("https://mail.google.com")) {
            console.log("Current Gmail tab:", curTab.url);
            // Here you can send a message to background.js to start scan
            chrome.runtime.sendMessage(
                { type: "startScan", tabId: curTab.id },
                (response) => {
                    if (response.ok) {
                        results = response.results;
                        console.log("Num Yellow: " + results[0] + "\nNum Red: " + results[1]);
                    } else {
                        console.error("Scan error:", response.error);
                    }
                }
            );
        } else {
            console.log("Please open Gmail to scan");
        }
    });
});
