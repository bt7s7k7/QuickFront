import { mdiAccount, mdiCheck, mdiChevronDown, mdiChevronLeft, mdiChevronRight, mdiChevronUp, mdiClose, mdiDelete, mdiHome, mdiMinus, mdiPlus } from "@mdi/js"
import { computed, createApp, defineComponent, markRaw, reactive, ref, shallowRef, toRaw, toRef, toRefs, unref, watch, watchEffect } from "vue"
import { App, startApp } from "./app/App"
import { FieldOptions } from "./formBuilder/FieldDrawer"
import * as customFields from "./quickFront/customFields"
import { openModal, registerForm } from "./quickFront/registration"
import { useRestConnection } from "./quickFront/restConnection"
import { STATE } from "./quickFront/state"
import { useWebsocketConnection } from "./quickFront/websocketConnection"
import { Button, ButtonGroup } from "./vue3gui/Button"
import { Circle } from "./vue3gui/Circle"
import { useDynamicsEmitter } from "./vue3gui/DynamicsEmitter"
import { Icon } from "./vue3gui/Icon"
import { LoadingIndicator } from "./vue3gui/LoadingIndicator"
import { MenuItem } from "./vue3gui/MenuItem"
import { Overlay } from "./vue3gui/Overlay"
import { Slider } from "./vue3gui/Slider"
import * as tabs from "./vue3gui/Tabs"
import { TextField } from "./vue3gui/TextField"
import { UploadOverlay } from "./vue3gui/UploadOverlay"
import "./vue3gui/style.scss"
import { useGrab } from "./vue3gui/useGrab"
import * as vueUtil from "./vue3gui/util"
import { vue3gui } from "./vue3gui/vue3gui"

function flattenObject(object: any) {
    return Object.fromEntries(Object.values(object).flatMap(v => Object.entries(v as object)))
}

const util = flattenObject(import.meta.glob("./comTypes/*", { eager: true }))
const struct = flattenObject(import.meta.glob("./struct/*", { eager: true }))
const formML = flattenObject(import.meta.glob("./formML/*", { eager: true }))
const formBuilder = flattenObject(import.meta.glob("./formBuilder/*", { eager: true }))

Object.assign(window,
    struct, customFields, util, formML, formBuilder, vueUtil, tabs,
    {
        startApp, STATE, useWebsocketConnection, useRestConnection, registerForm, openModal,
        "_OUTPUT": customFields.makeOutput(),
        "_REPORT": (event => {
            const path = event.getPath()
            const value = event.value
            STATE.action("valueChanged", { path, value })
        }) satisfies FieldOptions["onChange"],
        mdiMinus, mdiPlus, mdiDelete, mdiChevronUp, mdiChevronDown, mdiChevronRight, mdiChevronLeft, mdiHome, mdiAccount, mdiCheck, mdiClose,
        createApp, defineComponent, watchEffect, toRefs, toRef, unref, computed, watch, markRaw, toRaw, shallowRef, ref, reactive,
        UploadOverlay, Circle, useGrab, Slider, LoadingIndicator, Overlay, MenuItem, useDynamicsEmitter, ButtonGroup, Icon, TextField, Button,
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

