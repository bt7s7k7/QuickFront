import { defineComponent, ref } from "vue"
import { Home } from "../quickFront/Home"
import { DynamicsEmitter, useDynamicsEmitter } from "../vue3gui/DynamicsEmitter"

export const APP_ACTIVE = ref(false)
export function startApp(exports?: object) {
    if (exports) Object.assign(window, exports)
    APP_ACTIVE.value = true
}

const _DynamicEmitterShare = defineComponent({
    name: "_DynamicEmitterShare",
    setup(props, ctx) {
        const emitter = useDynamicsEmitter()
        Object.assign(window, { emitter })

        return () => []
    },
})

export const App = defineComponent({
    name: "App",
    setup(props, ctx) {
        return () => (
            <DynamicsEmitter>
                <_DynamicEmitterShare />
                {APP_ACTIVE.value && <Home />}
            </DynamicsEmitter>
        )
    }
})
