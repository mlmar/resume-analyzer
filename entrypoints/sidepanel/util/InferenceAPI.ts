export class InferenceAPI {
    static async prompt(prompt: string, token: string) {
        // browser is globally available in WXT
        const response = await browser.runtime.sendMessage({
            type: 'CALL_GITHUB_AI',
            prompt: prompt,
            token: token
        });

        if (response.success) {
            console.log("AI Result:", response.data);
            if (response.data.error) {
                throw new Error(response.data.message);
            }
        } else {
            console.error("AI Error:", response.error);
            throw new Error('Message failed');
        }
    }
}