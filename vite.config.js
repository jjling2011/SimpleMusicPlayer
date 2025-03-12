import { defineConfig } from "vite"
import legacy from "@vitejs/plugin-legacy"

export default defineConfig({
    plugins: [
        legacy({
            targets: ["chrome >= 64", "safari >= 12"],
        }),
    ],
    build: {
        emptyOutDir: true,
        rollupOptions: {
            output: {
                assetFileNames: "res/css/[name][hash][extname]",
                chunkFileNames: "res/js/[name]-[hash].js",
                entryFileNames: "res/js/[name]-[hash].js",
            },
        },
    },
})
