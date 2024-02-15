import { defineComponent, ref } from "vue"
import { Home } from "../quickFront/Home"
import { DynamicsEmitter, useDynamicsEmitter } from "../vue3gui/DynamicsEmitter"

const active = ref(false)
Object.assign(window, {
    startApp() {
        active.value = true
    }
})

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
                {active.value && <Home />}
            </DynamicsEmitter>
        )
    }
})
