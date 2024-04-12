import { defineComponent, h, onMounted } from "vue"
import { GenericParser } from "../comTypes/GenericParser"
import { ImmutableList } from "../comTypes/ImmutableList"
import { Optional } from "../comTypes/Optional"
import { escapeRegex, getValueByPath, isWhitespace, runString, setValueByPath, toString, unreachable } from "../comTypes/util"
import { Mutation } from "../struct/Mutation"
import { Type } from "../struct/Type"
import { ModalOptions } from "../vue3gui/DynamicsEmitter"
import { MountNode } from "../vue3gui/MountNode"
import { makeInfo } from "./customFields"
import { MountRegistration, TABS_MOUNT_LIST, TabsRegistration, registerForm, registerModal } from "./registration"
import { STATE } from "./state"

function _makeParser<S>(target: HTMLElement, receiver: S) {
    return function parseAttribute<T, U>(attributeName: string, parse: (v: string) => T, verify: (v: Optional<T>) => Optional<U>, path?: (v: Mutation.TypedPath<S>) => any) {
        const optionalValue = Optional.value(target.getAttribute(attributeName)).notNull().try(parse) as Optional<T>
        if (optionalValue.rejected) return optionalValue as Optional<never>
        const optionalVerified = verify(optionalValue)

        if (optionalVerified.rejected) {
            // eslint-disable-next-line no-console
            console.warn("Failed to parse attribute " + JSON.stringify(attributeName) + " on element ", target, optionalVerified.rejected)
            return optionalVerified
        }
        const value = optionalVerified.unwrap()

        if (path != null) {
            const pathActual = Mutation.getPath(path(Mutation.typedPath(null)))
            const final = pathActual.pop()!

            let assignTarget = receiver as any
            for (const segment of pathActual) {
                assignTarget[segment] ??= {}
                assignTarget = assignTarget[segment]
            }
            assignTarget[final] = value
        }

        return optionalVerified
    }
}

const _FIND_CONSTANT = (v: string) => (window as any)[v]

let nextID = 0
function _FROM_TEMPLATE(name: string) {
    const source = document.querySelector(`template[name=${JSON.stringify(name)}]`) as HTMLTemplateElement ?? unreachable()
    const content = source.innerHTML

    const when = Optional.value(source.getAttribute("when")).notNull().do(v => runString({ source: "return (props) => (" + v + ")", url: "c:/code/" + (nextID++) })).tryUnwrap()
    const className = source.getAttribute("class")

    const component = defineComponent({
        name: "_Templated",
        props: { props: { type: null } },
        setup(props, ctx) {
            let placedContent = content
            for (const [key, value] of Object.entries(props.props)) {
                placedContent = placedContent.replace(new RegExp("\\$" + escapeRegex(key) + "\\b", "g"), value instanceof ImmutableList ? value.join(".") : toString(value))
            }

            const element = document.createElement("td")
            if (className) element.setAttribute("class", className)

            onMounted(() => {
                element.innerHTML = placedContent
                hydrate(element)
            })

            return () => (
                h(MountNode, { node: element })
            )
        },
    })

    return (props: any) => {
        if (when != null && !when(props)) return
        return h(component, { props })
    }
}

export function findForms() {
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
            template.remove()
            // eslint-disable-next-line no-console
            console.error(value)
            // eslint-disable-next-line no-console
            console.error("Error during instantiation of template, therefore it was removed from the document")
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

        const parseAttribute = _makeParser(target, options)

        parseAttribute("form-type", _FIND_CONSTANT, v => v.filter(v => Type.isType(v)), v => v.type)
        parseAttribute("path", v => v.startsWith("'") ? JSON.parse(`[${v}]`) : v.split("."), v => v.filterType(Array).assertType<string[]>(), v => v.path)
        parseAttribute("label-width", v => +v, v => v.notNaN(), v => v.fieldOptions!.labelWidth)
        parseAttribute("onchange", _FIND_CONSTANT, v => v.filterType(Function), v => v.fieldOptions!.onChange)
        parseAttribute("prefix", _FROM_TEMPLATE, v => v, v => v.fieldOptions!.prefix)
        parseAttribute("suffix", _FROM_TEMPLATE, v => v, v => v.fieldOptions!.suffix)
        const readonly = parseAttribute("readonly", () => true, v => v)
        if (readonly) {
            setValueByPath(options, ["fieldsOptions", "disable"], () => true)
        }

        options.type ??= Type.object({
            _1: makeInfo("error", "Form type not found")
        })

        registerForm(options)
    }
}

export function hydrate(targetNode: Element | Document) {
    for (const source_1 of targetNode.querySelectorAll("[data-action]")) {
        const source = source_1 as HTMLElement
        const action = source.dataset.action
        if (action == null) continue

        const path = source.dataset.path?.split(".")
        const getter = source.dataset.data ? runString({ source: "return () => (" + source.dataset.data + ")", url: "c:/code/" + (nextID++) }) : null

        source.addEventListener("click", () => {
            let data = null

            if (path != null) {
                data = getValueByPath(STATE.value, path)
            }

            if (getter != null) {
                data = getter()
            }

            STATE.action(action, data)
        })
    }

    for (const source_1 of targetNode.querySelectorAll("[data-icon]")) {
        const source = source_1 as HTMLElement
        const iconName = source.getAttribute("data-icon")
        const icon = (window as any)[iconName!]
        const iconElement = document.createElement("svg")
        iconElement.innerHTML = `<svg class="as-icon" fill="currentColor" viewBox="0 0 24 24"> <g> <path d="${icon}" /> <rect width="24" height="24" fill="transparent" /> </g> </svg>`
        source.prepend(iconElement)
    }

    for (const source_1 of targetNode.querySelectorAll("[data-tabs]")) {
        const source = source_1 as HTMLElement
        const parseAttribute = _makeParser(source, {})
        const name = parseAttribute("data-tabs", v => v, v => v).unwrap()

        const tab: TabsRegistration = {
            element: source, name,
            children: []
        }

        const children = [...source.children]
        for (const child of children) {
            child.remove()
            const name = child.getAttribute("data-tab-name") ?? child.tagName
            tab.children.push({ name, content: child as HTMLElement })
        }

        TABS_MOUNT_LIST.push(tab)
    }

    for (const source_1 of targetNode.querySelectorAll("[data-modal]")) {
        const source = source_1 as HTMLElement
        const props: ModalOptions["props"] = {}

        const parseAttribute = _makeParser(source, props)

        parseAttribute("ok-button", v => v == "" ? true : v, v => v, v => v.okButton)
        parseAttribute("cancel-button", v => v == "" ? true : v, v => v, v => v.cancelButton)
        parseAttribute("backdrop-cancels", v => true, v => v, v => v.backdropCancels)

        const name = parseAttribute("data-modal", v => v, v => v).unwrap()

        const callback = parseAttribute("onclose", _FIND_CONSTANT, v => v.filterType(Function)).tryUnwrap()
        source.remove()

        registerModal({ name, element: source, props, callback: callback as any })
    }
}
