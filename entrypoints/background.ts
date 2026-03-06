import { GithubModelResponse } from "@/entrypoints/types/GithubModelResponse";
import { GitHubCatalogModel } from "@/entrypoints/types/GitHubCatalogModel";
import { Message, MessageType } from "@/entrypoints/types/Message";
import { ANALYZE_MODEL, buildPrompt, matchSchema } from "@/entrypoints/lib/analyzeConfig";

export default defineBackground(() => {
    browser.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting panel behavior:", error));

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'loading') {
            browser.runtime.sendMessage({ type: MessageType.Reset })
        }
    });

    let lastActiveTabId: number | null = null;

    browser.tabs.onActivated.addListener((activeInfo) => {
        if (lastActiveTabId != null) {
            browser.tabs.sendMessage(lastActiveTabId, { type: MessageType.Inspect, data: false }).catch(() => {
                console.error('Resume-Extension: Failed to disable toggle mode for previous tab')
            });
            browser.tabs.sendMessage(lastActiveTabId, { type: MessageType.Clear }).catch(() => {
                console.error('Resume-Extension: Failed to clear selections for previous tab')
            });
        }
        lastActiveTabId = activeInfo.tabId;
        browser.runtime.sendMessage({ type: MessageType.Reset }).catch(() => {
            console.error('Resume-Extension: Failed to reset UI')
        });
    });

    browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
        if (message.type === MessageType.Analyze) {
            async function fetchGithubModelResponse() {
                try {
                    const payload = (message as Message<MessageType.Analyze>).data
                    const prompt = buildPrompt(payload.resume, payload.job);

                    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${payload.token}`
                        },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: prompt }],
                            response_format: {
                                type: "json_schema",
                                json_schema: {
                                    name: "resume_match",
                                    strict: true,
                                    schema: matchSchema // The schema we defined above
                                }
                            },
                            model: payload.model ?? ANALYZE_MODEL
                        })
                    });


                    const data = await response.json() as GithubModelResponse;
                    sendResponse({ success: true, data });
                } catch (error) {
                    console.error("AI Fetch Error:", error);
                    sendResponse({ success: false, error: 'Failed to fetch analysis' });
                }
            }

            fetchGithubModelResponse()
            return true;
        }

        if (message.type === MessageType.FetchModels) {
            async function fetchCatalogModels() {
                try {
                    const { token } = (message as Message<MessageType.FetchModels>).data;
                    const response = await fetch('https://models.github.ai/catalog/models', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github+json',
                            'X-GitHub-Api-Version': '2022-11-28'
                        }
                    });
                    if (!response.ok) {
                        sendResponse({ success: false, error: `HTTP ${response.status}` });
                        return;
                    }
                    const data = await response.json() as GitHubCatalogModel[];
                    sendResponse({ success: true, data });
                } catch (error) {
                    console.error('FetchModels Error:', error);
                    sendResponse({ success: false, error: 'Failed to fetch models' });
                }
            }

            fetchCatalogModels();
            return true;
        }
    });


});