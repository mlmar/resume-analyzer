import { Message, MessageDataMap, MessageType } from "@/entrypoints/types/Message";

type Callback<T> = (data: T) => void;

const callbacksMap = new Map<MessageType, Set<Callback<never>>>();

export class InspectAPI {
    static open() {
        browser.runtime.onMessage.addListener(this.#listener);
    }

    static close() {
        browser.runtime.onMessage.removeListener(this.#listener);
    }

    static #listener(message: Message) {
        const callbacks = callbacksMap.get(message.type);
        if (callbacks) {
            for (const callback of callbacks) {
                callback(message.data as never);
            }
        }
    }

    static async toggle() {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        await browser.tabs.sendMessage(tab.id!, { type: MessageType.Inspect });
    }

    static addListener<K extends MessageType>(key: K, callback: Callback<MessageDataMap[K]>) {
        const callbacks = callbacksMap.get(key) ?? new Set();
        callbacksMap.set(key, callbacks as Set<Callback<never>>);
        callbacks.add(callback as Callback<never>);
    }

    static removeListener<K extends MessageType>(key: K, callback: Callback<MessageDataMap[K]>) {
        callbacksMap.get(key)?.delete(callback as Callback<never>);
    }
}