import { createApp } from "vue"
import { App, startApp } from "./app/App"
import { FieldOptions } from "./formBuilder/FieldDrawer"
import * as binding from "./formML/Binding"
import * as form from "./formML/Form"
import * as customFields from "./quickFront/customFields"
import { registerForm } from "./quickFront/registration"
import { STATE, useWebsocketConnection } from "./quickFront/state"
import * as mutation from "./struct/Mutation"
import * as struct from "./struct/Struct"
import * as type from "./struct/Type"
import "./vue3gui/style.scss"
import { vue3gui } from "./vue3gui/vue3gui"

Object.assign(window,
    type, struct, mutation, binding, form, customFields,
    {
        startApp, STATE, useWebsocketConnection, registerForm,
        "_OUTPUT": customFields.makeOutput(),
        "_REPORT": (event => {
            const path = event.getPath()
            const value = event.value
            STATE.action("valueChanged", { path, value })
        }) satisfies FieldOptions["onChange"]
    }
)

const app = createApp(App)

app.use(vue3gui, {})

const root = document.createElement("div")
app.mount(root)

const init = (window as any).init
if (init == null) {
    // eslint-disable-next-line no-console
    console.error("Please define a global init() function")
} else {
    init()
}

