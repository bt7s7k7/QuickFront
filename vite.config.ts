import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import * as dotenv from "dotenv"
import { rename } from "fs/promises"
import { join } from "path"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig(() => {
    dotenv.config({ path: join(__dirname, ".env.local") })
    dotenv.config({ path: join(__dirname, ".env") })

    return {
        appType: "mpa",
        plugins: [vue(), vueJsx()],
        resolve: {
            preserveSymlinks: true
        },
        server: {
            port: +(process.env.PORT ?? 8080),
            proxy: {
                "^/api": {
                    target: "http://localhost:8081/",
                    changeOrigin: true,
                    ws: true,
                }
            }
        },
        build: {
            rollupOptions: {
                input: "src/main.ts",
                output: {
                    entryFileNames: `assets/quick-front.js`,
                    chunkFileNames: `assets/[name].js`,
                    assetFileNames: `assets/[name].[ext]`
                },
            },
        }
    }
})
