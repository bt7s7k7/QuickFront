import { PropType, Teleport, defineComponent, onMounted } from "vue"
import { GenericParser } from "../comTypes/GenericParser"
import { Optional } from "../comTypes/Optional"
import { escapeRegex, isWhitespace } from "../comTypes/util"
import { FormView } from "../formBuilder/FormView"
import { useForm } from "../formBuilder/useForm"
import { Type } from "../struct/Type"
import { makeInfo } from "./customFields"
import { MOUNT_LIST, MountRegistration, registerForm } from "./registration"
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

export const Home = (defineComponent({
    name: "Home",
    setup(props, ctx) {

        while (true) {
            const template = document.querySelector("template[for]")
            if (template == null) break

            const parser = new GenericParser(template.getAttribute("for")!)
            const name = parser.readUntil(" ")
            parser.skipWhile(isWhitespace)
            if (!parser.consume("in")) continue
            const expr = parser.readUntil(() => false)
            const value = Optional.pcall(() => new Function("return (" + expr + ")")()).filterType(Array).assertType<any[]>().unwrapOrError()
            if (value instanceof Error) {
                // eslint-disable-next-line no-console
                console.error(value)
                continue
            }

            const resultBuilder = document.createElement("template")
            const regex = new RegExp(name.startsWith("$") ? escapeRegex(name) + "\\b" : "\\b" + escapeRegex(name) + "\\b", "g")

            const content = template.innerHTML
            for (const element of value) {
                const newContent = content.replace(regex, element)
                resultBuilder.innerHTML = newContent
                for (const child of resultBuilder.content.children) {
                    template.parentElement!.insertBefore(child, template)
                }
            }

            template.remove()
        }

        for (const target of document.querySelectorAll("[form-type]") as NodeListOf<HTMLElement>) {
            const options: MountRegistration = { target }

            Optional.value(target.getAttribute("form-type")).notNull().do(v => (window as any)[v]).filter(v => Type.isType(v)).do(v => options.type = v)
            Optional.value(target.getAttribute("label-width")).notNull().do(v => +v).notNaN().do(v => options.fieldOptions = { labelWidth: v })
            Optional.value(target.getAttribute("path")).notNull().try(v => v.startsWith("'") ? JSON.parse(`[${v}]`) : v.split(".")).filterType(Array).assertType<string[]>().do(v => options.path = v)

            options.type ??= Type.object({
                _1: makeInfo("error", "Form type not found")
            })

            registerForm(options)
        }

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
