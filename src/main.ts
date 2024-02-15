import { createApp } from "vue"
import { App } from "./app/App"
import * as binding from "./formML/Binding"
import * as form from "./formML/Form"
import * as customFields from "./quickFront/customFields"
import * as mutation from "./struct/Mutation"
import * as struct from "./struct/Struct"
import * as type from "./struct/Type"
import { LIGHT_THEME } from "./vue3gui/theme/light"
import "./vue3gui/theme/light.scss"
import { vue3gui } from "./vue3gui/vue3gui"

Object.assign(window,
    type, struct, mutation, binding, form, customFields
)

const app = createApp(App)

app.use(vue3gui, {
    theme: LIGHT_THEME
})

const root = document.createElement("div")
app.mount(root)

const init = (window as any).init
if (init == null) {
    // eslint-disable-next-line no-console
    console.error("Please define a global init() function")
} else {
    init()
}

