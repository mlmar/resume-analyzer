import { Message, MessageType } from "@/entrypoints/types/Message";

export default defineBackground(() => {
    browser.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting panel behavior:", error));

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'loading') {
            browser.runtime.sendMessage({ type: MessageType.Reset })
        }
    });

    browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
        if (message.type === MessageType.Analyze) {
            async function fetchGithubModelResponse() {
                try {
                    const payload = (message as Message<MessageType.Analyze>).data

                    const matchSchema = {
                        type: "object",
                        properties: {
                            matchScore: { type: "number", description: "A score from 0-100" },
                            matchingSkills: { type: "array", items: { type: "string" } },
                            missingSkills: { type: "array", items: { type: "string" } },
                            summary: { type: "string" }
                        },
                        required: ["matchScore", "matchingSkills", "missingSkills", "summary"],
                        additionalProperties: false
                    };

                    let prompt = 'Compare my resume to this job description:';
                    prompt += `<Resume>\n ${payload.resume} \n</Resume>\n`;
                    prompt += `<Job Description>\n ${payload.job} \n</Job Description>\n`;

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
                            model: "gpt-4o"
                        })
                    });

                    const data = await response.json();
                    sendResponse({ success: true, data });
                } catch (error) {
                    console.error("AI Fetch Error:", error);
                    sendResponse({ success: false, error: 'Failed' });
                }
            }

            fetchGithubModelResponse()

            return true;
        }
    });


});