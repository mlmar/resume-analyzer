export default defineBackground(() => {
    browser.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting panel behavior:", error));

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'CALL_GITHUB_AI') {
            async function fetchGithubModelResponse() {
                try {
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
                    prompt += `<Resume>\n ${message.resume} \n</Resume>\n`;
                    prompt += `<Job Description>\n ${message.job} \n</Job Description>\n`;

                    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${message.token}`
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