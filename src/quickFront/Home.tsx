import { PropType, Teleport, defineComponent, nextTick, onMounted, ref } from "vue"
import { FormView } from "../formBuilder/FormView"
import { useForm } from "../formBuilder/useForm"
import { Modal } from "../vue3gui/Modal"
import { MountNode } from "../vue3gui/MountNode"
import { findForms, hydrate } from "./hydrate"
import { FORM_MOUNT_LIST, InstantiatedModal, MODAL_FORM_LIST, MountRegistration } from "./registration"
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
            path: props.registration.path,
            type: props.registration.type,
            fieldOptions: props.registration.fieldOptions
        })

        return () => (
            <FormView form={formViewForm} />
        )
    },
})

const _MountedModal = defineComponent({
    name: "_MountedModal",
    props: {
        registration: { type: Object as PropType<InstantiatedModal>, required: true }
    },
    setup(props, ctx) {
        const cancel = () => { props.registration.callback?.(false); props.registration.open.value = false }
        const ok = () => { props.registration.callback?.(true); props.registration.open.value = false }

        return () => (
            <Modal {...props.registration.props} show={props.registration.open.value} onCancel={cancel} onOk={ok}>
                <MountNode node={props.registration.element} />
            </Modal>
        )
    },
})

export const Home = (defineComponent({
    name: "Home",
    setup(props, ctx) {
        findForms()

        const ready = ref(false)

        onMounted(() => {
            hydrate(document)
            nextTick(() => ready.value = true)
        })

        return () => ready.value && [
            FORM_MOUNT_LIST.map(mount => (
                <Teleport to={mount.target}>
                    <_MountedForm registration={mount} />
                </Teleport>
            )),
            MODAL_FORM_LIST.map(mount => (
                <_MountedModal registration={mount} />
            ))
        ]
    }
}))
