import { defineConfig } from "vite"

export default defineConfig({
    plugins: [],
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
