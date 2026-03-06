export enum MessageType {
    Text = 'GRAB_TEXT',
    Inspect = 'TOGGLE_INSPECT',
    Clear = 'CLEAR_INSPECT',
    Reset = 'RESET',
    Analyze = 'ANALYZE',
    FetchModels = 'FETCH_MODELS',
    Highlight = 'HIGHLIGHT_SKILL'
}

export type MessageDataMap = {
    [MessageType.Text]: string[];
    [MessageType.Inspect]: boolean | undefined;
    [MessageType.Clear]: undefined;
    [MessageType.Reset]: undefined;
    [MessageType.Analyze]: {
        resume: string,
        job: string,
        token: string,
        model: string
    },
    [MessageType.FetchModels]: {
        token: string
    },
    [MessageType.Highlight]: string | null
};

export type Message<K extends MessageType = MessageType> = {
    [T in K]: { type: T; data: MessageDataMap[T] }
}[K];