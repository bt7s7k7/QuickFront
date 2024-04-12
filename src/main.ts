import { mdiChevronDown, mdiChevronLeft, mdiChevronRight, mdiChevronUp, mdiDelete, mdiMinus, mdiPlus } from "@mdi/js"
import { createApp } from "vue"
import { App, startApp } from "./app/App"
import { FieldOptions } from "./formBuilder/FieldDrawer"
import * as binding from "./formML/Binding"
import * as form from "./formML/Form"
import * as customFields from "./quickFront/customFields"
import { openModal, registerForm } from "./quickFront/registration"
import { STATE } from "./quickFront/state"
import { useWebsocketConnection } from "./quickFront/websocketConnection"
import * as mutation from "./struct/Mutation"
import * as struct from "./struct/Struct"
import * as type from "./struct/Type"
import "./vue3gui/style.scss"
import { vue3gui } from "./vue3gui/vue3gui"

const util = Object.fromEntries(Object.values(import.meta.glob("./comTypes/*", { eager: true })).flatMap(v => Object.entries(v as object)))

Object.assign(window,
    type, struct, mutation, binding, form, customFields, util,
    {
        startApp, STATE, useWebsocketConnection, registerForm, openModal,
        "_OUTPUT": customFields.makeOutput(),
        "_REPORT": (event => {
            const path = event.getPath()
            const value = event.value
            STATE.action("valueChanged", { path, value })
        }) satisfies FieldOptions["onChange"],
        mdiMinus, mdiPlus, mdiDelete, mdiChevronUp, mdiChevronDown, mdiChevronRight, mdiChevronLeft
    }
)

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
    // eslint-disable-next-line no-console
    console.error(err, instance, info)
    STATE.dispose()
}

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

