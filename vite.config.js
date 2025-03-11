import { defineConfig } from "vite"
import inject from "@rollup/plugin-inject"
import legacy from "@vitejs/plugin-legacy"

export default defineConfig({
    plugins: [
        legacy({
            targets: ["chrome >= 64", "safari >= 12"],
        }),
        inject({
            jQuery: "jquery",
        }),
    ],
    optimizeDeps: {
        include: ["jquery"],
    },
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
