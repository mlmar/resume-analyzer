type Callback = (data: string[]) => void;
type Message = {
    type: string,
    data: string[]
}

const callbacks = new Set<Callback>();

export class InspectAPI {

    static open() {
        browser.runtime.onMessage.addListener(this.#listener);
    }

    static close() {
        browser.runtime.onMessage.removeListener(this.#listener);
    }

    static #listener(message: Message) {
        if (message.type === 'TEXT_GRABBED') {
            for (const callback of callbacks) {
                callback(message.data);
            }
        }
    }

    static async toggle() {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        await browser.tabs.sendMessage(tab.id!, { type: 'TOGGLE_INSPECT' });
    };

    static addListener(callback: Callback) {
        callbacks.add(callback);
    }

    static removeListener(callback: Callback) {
        callbacks.delete(callback);
    }
}