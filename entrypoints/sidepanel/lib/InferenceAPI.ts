import { GithubModelResponse } from "@/entrypoints/types/GithubModelResponse";
import { Message, MessageType } from "@/entrypoints/types/Message";


export class InferenceAPI {
    static async prompt(props: Message<MessageType.Analyze>['data']): Promise<GithubModelResponse> {
        // browser is globally available in WXT
        const response = await browser.runtime.sendMessage({
            type: MessageType.Analyze,
            data: props
        });

        if (response.success) {
            if (response.data.error) {
                console.error("AI Error:", response.data.error);
                throw new Error(response.data.error.message);
            }
            return JSON.parse(response.data.choices[0].message.content) as GithubModelResponse;
        } else {
            console.error("AI Error:", response.error);
            throw new Error('Message failed');
        }
    }
}