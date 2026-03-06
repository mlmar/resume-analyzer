export enum MessageType {
    Text = 'GRAB_TEXT',
    Inspect = 'TOGGLE_INSPECT',
    Reset = 'RESET',
    Analyze = 'ANALYZE'
}

export type MessageDataMap = {
    [MessageType.Text]: string[];
    [MessageType.Inspect]: undefined;
    [MessageType.Reset]: undefined;
    [MessageType.Analyze]: {
        resume: string,
        job: string,
        token: string
    }
};

export type Message<K extends MessageType = MessageType> = {
    [T in K]: { type: T; data: MessageDataMap[T] }
}[K];