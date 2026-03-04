import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    vite: () => {
        return {
            plugins: [tailwindcss()]
        }
    },
    webExt: {
        chromiumArgs: [// Enables the Prompt API
            '--remote-debugging-port=9222'
        ],
    },
    manifest: {
        permissions: ["storage"],
        host_permissions: [
            "https://models.inference.ai.azure.com/*"
        ]
    },
    modules: ['@wxt-dev/module-vue'],
});
