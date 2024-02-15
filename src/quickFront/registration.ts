import { markRaw } from "vue"
import { Form } from "../formML/Form"
import { Binding } from "../formML/Binding"
import { Type } from "../struct/Type"

export interface MountRegistration {
    target: string
    form: Form
    binding?: Binding
    type?: Type<any>
}

export const MOUNT_LIST: MountRegistration[] = []

Object.assign(window, {
    registerForm(registration: MountRegistration) {
        markRaw(registration)
        MOUNT_LIST.push(registration)
    }
})
