export type GithubModelResponse = {
    matchScore: string,
    matchingSkills: string[],
    missingSkills: string[],
    summary: string
}

export class InferenceAPI {
    static async prompt(props: { resume: string, job: string, token: string }): Promise<GithubModelResponse> {
        // browser is globally available in WXT
        const response = await browser.runtime.sendMessage({
            type: 'CALL_GITHUB_AI',
            ...props
        });

        if (response.success) {
            if (response.data.error) {
                throw new Error(response.data.message);
            }
            return JSON.parse(response.data.choices[0].message.content) as GithubModelResponse;
        } else {
            console.error("AI Error:", response.error);
            throw new Error('Message failed');
        }
    }
}