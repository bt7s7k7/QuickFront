import { PropType, Teleport, defineComponent, onMounted } from "vue"
import { FormView } from "../formBuilder/FormView"
import { useForm } from "../formBuilder/useForm"
import { MOUNT_LIST, MountRegistration } from "./registration"
import { STATE } from "./state"

const _MountedForm = defineComponent({
    name: "_MountedForm",
    props: {
        registration: { type: Object as PropType<MountRegistration>, required: true },
    },
    setup(props, ctx) {
        const formViewForm = useForm({
            value: STATE.value,
            form: props.registration.form,
            binding: props.registration.binding,
            type: props.registration.type,

        })

        return () => (
            <FormView form={formViewForm} />
        )
    },
})

export const Home = (defineComponent({
    name: "Home",
    setup(props, ctx) {

        onMounted(() => {
            for (const source_1 of document.querySelectorAll("[data-action]")) {
                const source = source_1 as HTMLElement
                const action = source.dataset.action
                if (action == null) continue

                const path = source.dataset.path?.split(".")

                source.addEventListener("click", () => {
                    let data = null
                    if (path != null) {
                        data = STATE.value.value
                        for (const key of path) data = data[key]
                    }

                    STATE.action(action, data)
                })
            }
        })

        return () => [
            MOUNT_LIST.map(mount => (
                <Teleport to={mount.target}>
                    <_MountedForm registration={mount} />
                </Teleport>
            ))
        ]
    }
}))
