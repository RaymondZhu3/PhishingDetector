// background.js (Manifest V3 compatible)

// scan function returns a Promise that resolves with Gmail snippets
async function scan() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            // edge case - get the token failed
            if (chrome.runtime.lastError || !token) {
                console.error("Failed to get OAuth token:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }

            console.log("OAuth token acquired");

            try {
                const threadsResponse = await fetch(
                    "https://gmail.googleapis.com/gmail/v1/users/me/threads",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );


                const threadsData = await threadsResponse.json();

                const threads = threadsData.threads || [];

                const snippets = [];

                // Get each thread's first message snippet
                for (const thread of threads) {
                    // get individual response
                    const threadResp = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const threadData = await threadResp.json();
                    // console.log(threadData["messages"][0]["labelIds"]);
                    if (threadData["messages"][0]["labelIds"].includes('INBOX')) {
                        // the message is in the inbox and can therefore be analyzed
                        console.log("here!!!");
                        analyzeMsg(threadData["messages"][0]["snippet"], 
                                   threadData["messages"][0]["payload"]["headers"])
                                   // attachments
                                   // link is safe - safe browsing API
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

function analyzeMsg(snippet, headers) {
    console.log("headers:");
    console.log(headers);
}
// Listener for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "startScan") {
        console.log("Received scan request for tabId:", msg.tabId);

        scan()
            .then((results) => {
                // console.log("Scan results:", results);
                sendResponse({ ok: true, results });
            })
            .catch((err) => {
                sendResponse({ ok: false, error: err.toString() });
            });

        return true; // important to keep sendResponse alive for async
    }
});
