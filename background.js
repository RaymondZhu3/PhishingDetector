// Listener for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.type === "checkMalicious") {

		checkMalicious()
			.then((results) => {
				sendResponse({ ok: true, results });
			})
			.catch((err) => {
				sendResponse({ ok: false, error: err.toString() });
			});

		return true; // important to keep sendResponse alive for async
	}
});
function checkMalicious() {
    const fs = require('fs');

    // Read API key from local text file (synchronously)
    const apiKey = fs.readFileSync('apikey.txt', 'utf8').trim();

    const url = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + apiKey;
    const data = {
        "client": {
            "clientId": "UT Austin",
            "clientVersion": "1.5.2"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM", "WINDOWS", "LINUX", "ANDROID", "OSX", "CHROME", "IOS"],
            "threatEntryTypes": ["URL", "EXECUTABLE"],
            "threatEntries": [
                { "url": link }
            ]
        }
    };
    fetch(url, {
        method: 'POST', // Specify the HTTP method
        headers: {
            'Content-Type': 'application/json' // Indicate the type of content in the body
        },
        body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // at least one malicious link
            return response.json().length > 0;
        })
}