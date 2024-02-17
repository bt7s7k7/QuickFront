import { markRaw } from "vue"
import { FieldOptions } from "../formBuilder/FieldDrawer"
import { Form } from "../formML/Form"
import { Type } from "../struct/Type"

export interface MountRegistration {
    target: string
    form: Form
    path?: string[]
    type?: Type<any>
    fieldOptions?: Partial<FieldOptions>
}

export const MOUNT_LIST: MountRegistration[] = []

Object.assign(window, {
    registerForm(registration: MountRegistration) {
        markRaw(registration)
        MOUNT_LIST.push(registration)
    }
})
