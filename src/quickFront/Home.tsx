import { PropType, Teleport, defineComponent, nextTick, onMounted, ref } from "vue"
import { FormView } from "../formBuilder/FormView"
import { useForm } from "../formBuilder/useForm"
import { Modal } from "../vue3gui/Modal"
import { MountNode } from "../vue3gui/MountNode"
import { Tab, TabbedContainer, Tabs, useTabs } from "../vue3gui/Tabs"
import { findForms, hydrate } from "./hydrate"
import { FORM_MOUNT_LIST, InstantiatedModal, MODAL_FORM_LIST, MountRegistration, TABS_MOUNT_LIST, TabsRegistration } from "./registration"
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

const _MountedTabs = defineComponent({
    name: "_MountedTabs",
    props: {
        registration: { type: Object as PropType<TabsRegistration>, required: true }
    },
    setup(props, ctx) {
        const state = useTabs()

        if (props.registration.name) {
            // @ts-ignore
            window[`set${props.registration.name}Tab`] = function (tab: string) {
                state.selected = tab
            }
        }

        return () => (
            <div class="absolute-fill flex column">
                <div class="border-bottom px-2 pt-1">
                    <Tabs tabs={state} border />
                </div>
                <TabbedContainer externalTabs={state}>
                    {props.registration.children.map((v, i) => (
                        <Tab name={v.name}>
                            <MountNode node={v.content} />
                        </Tab>
                    ))}
                </TabbedContainer>
            </div>
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
            )),
            TABS_MOUNT_LIST.map(mount => (
                <Teleport to={mount.element}>
                    <_MountedTabs registration={mount} />
                </Teleport>
            ))
        ]
    }
}))
