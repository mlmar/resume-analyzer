// entrypoints/background.ts
export default defineBackground(() => {
    browser.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting panel behavior:", error));

    // REMOVE 'async' from this callback
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'CALL_GITHUB_AI') {

            // Execute the async work in a separate self-calling block or helper
            (async () => {
                try {
                    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${message.token}`
                        },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: message.prompt }],
                            model: "gpt-4o"
                        })
                    });

                    const data = await response.json();
                    sendResponse({ success: true, data });
                } catch (error) {
                    console.error("AI Fetch Error:", error);
                    sendResponse({ success: false, error: 'Failed' });
                }
            })();

            return true;
        }
    });
});