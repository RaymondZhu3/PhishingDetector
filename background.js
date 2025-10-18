// background.js (Manifest V3 compatible)

// scan function returns a Promise that resolves with Gmail snippets
async function scan() {
    return new Promise((resolve, reject) => {
        // if 
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            // edge case - get the token failed
            if (chrome.runtime.lastError || !token) {
                console.error("Failed to get OAuth token:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }

            console.log("OAuth token acquired");

            try {
                // Get the 5 most recent threads
                const threadsResponse = await fetch(
                    "https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=5",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const threadsData = await threadsResponse.json();
                const threads = threadsData.threads || [];

                const snippets = [];

                // Get each thread's first message snippet
                for (const thread of threads) {
                    const threadResp = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const threadData = await threadResp.json();
                    const messages = threadData.messages || [];
                    if (messages.length > 0) {
                        snippets.push(messages[0].snippet || "(no snippet)");
                    }
                }

                resolve(snippets);
            } catch (err) {
                console.error("Error fetching Gmail data:", err);
                reject(err);
            }
        });
    });
}

// Listener for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "startScan") {
        console.log("Received scan request for tabId:", msg.tabId);

        scan()
            .then((results) => {
                console.log("Scan results:", results);
                sendResponse({ ok: true, results });
            })
            .catch((err) => {
                sendResponse({ ok: false, error: err.toString() });
            });

        return true; // important to keep sendResponse alive for async
    }
});
