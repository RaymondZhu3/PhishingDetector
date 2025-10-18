// background.js
// Make sure manifest.json has "identity" permission and oauth2.client_id configured.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "scan") {
    // Ask Chrome for an OAuth token (interactive -> shows consent popup if needed)
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "No token" });
        return; // note: sendResponse called synchronously above; but we also use return true below
      }

      // Example: call Gmail API to list recent messages (maxResults=10)
      fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10", {
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/json"
        }
      })
      .then(response => {
        if (!response.ok) throw new Error("Gmail API error: " + response.status);
        return response.json();
      })
      .then(data => {
        // data.messages is an array of message objects (id, threadId)
        // For demo purposes we'll return the message ids; you can then fetch each message body
        sendResponse({ messages: data.messages || [] });
      })
      .catch(err => {
        sendResponse({ error: err.message });
      });
    });

    // Keep the message channel open for sendResponse called asynchronously.
    return true;
  }
});
