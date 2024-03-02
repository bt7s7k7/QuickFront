import { defineComponent } from "vue"
import { toString } from "../comTypes/util"
import { getFieldDrawerProps, registerFieldDrawer, useFieldDrawerValue } from "../formBuilder/FieldDrawer"
import { CustomFieldAttribute, FormField_t, InfoField, LabelAttribute } from "../formML/Form"
import { Struct } from "../struct/Struct"
import { Type } from "../struct/Type"
import { Button } from "../vue3gui/Button"
import { grid } from "../vue3gui/grid"

export class ButtonField extends Struct.define("ButtonField", {
    variant: Type.string.as(Type.nullable),
    action: Type.string,
    path: Type.string.as(Type.array).as(Type.nullable)
}) { }
FormField_t.register(ButtonField)

export const ButtonFieldDrawer = defineComponent({
    name: "ButtonFieldDrawer",
    props: {
        ...getFieldDrawerProps(ButtonField)
    },
    noFieldDecoration: true,
    setup(props, ctx) {
        const field = props.field
        const path = props.path.add(props.binding.getKey())
        const key = path.join(".")

        return () => (
            <Button key={key} variant={field.variant as any} style={grid().colspan(2).$} data-action={field.action} data-path={field.path}>{props.label}</Button>
        )
    }
})
registerFieldDrawer(ButtonField, ButtonFieldDrawer)

export class OutputField extends Struct.define("OutputField", {
    mapper: Type.passthrough<(value: any) => string>(toString)
}) { }

export const OutputFieldDrawer = defineComponent({
    name: "ButtonFieldDrawer",
    props: {
        ...getFieldDrawerProps(OutputField)
    },
    setup(props, ctx) {
        const value = useFieldDrawerValue(props)

        return () => (
            <div>{props.field.mapper(value.value)}</div>
        )
    }
})
registerFieldDrawer(OutputField, OutputFieldDrawer)

export function makeButton(label: string, options: { action: string, path?: string[], variant?: string }) {
    return Type.empty.as(Type.annotate,
        new CustomFieldAttribute(new ButtonField({
            action: options.action,
            path: options.path,
            variant: options.variant
        })),
        new LabelAttribute(label)
    )
}

export function makeOutput(mapper = OutputField.props.mapper.default()) {
    return Type.empty.as(Type.annotate,
        new CustomFieldAttribute(new OutputField({ mapper }))
    )
}

export function makeInfo(decoration: InfoField["decoration"], text: string) {
    return Type.empty.as(Type.annotate,
        new CustomFieldAttribute(new InfoField({ text, decoration }))
    )
}
