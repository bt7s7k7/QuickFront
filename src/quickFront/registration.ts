import { Ref, markRaw, ref } from "vue"
import { FieldOptions } from "../formBuilder/FieldDrawer"
import { Form } from "../formML/Form"
import { Type } from "../struct/Type"
import { ModalOptions } from "../vue3gui/DynamicsEmitter"

export interface MountRegistration {
    target: string | HTMLElement
    form?: Form
    path?: string[]
    type?: Type<any>
    fieldOptions?: Partial<FieldOptions>
}

export const FORM_MOUNT_LIST: MountRegistration[] = []

export function registerForm(registration: MountRegistration) {
    markRaw(registration)
    FORM_MOUNT_LIST.push(registration)
}

export interface ModalRegistration {
    name: string
    props: ModalOptions["props"]
    element: HTMLElement
    callback?: (success: boolean) => void
}

export type InstantiatedModal = ModalRegistration & { open: Ref<boolean> }

export const MODAL_FORM_LIST: InstantiatedModal[] = []
const _MODAL_LOOKUP = new Map<string, InstantiatedModal>()

export function registerModal(registration: ModalRegistration) {
    markRaw(registration)
    const instance: InstantiatedModal = { ...registration, open: ref(false) }
    MODAL_FORM_LIST.push(instance)
    _MODAL_LOOKUP.set(instance.name, instance)
}

export function openModal(name: string) {
    _MODAL_LOOKUP.get(name)!.open.value = true
}
