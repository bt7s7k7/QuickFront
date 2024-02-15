import { ref } from "vue"
import { Optional } from "../comTypes/Optional"
import { Mutation } from "../struct/Mutation"

export const STATE = new class State {
    public readonly value = ref<any>(null)
    public actionHandler: ((action: string, data: any) => void) | null = null
    public postSync: ((value: any) => void) | null = null

    public action(action: string, data: any) {
        if (this.actionHandler == null) {
            // eslint-disable-next-line no-console
            console.error("No action handler set")
            return
        }

        this.actionHandler(action, data)
    }

    public sync(data: any) {
        this.postSync?.(data)
        this.value.value = data
    }
}

Object.assign(window, {
    STATE,
    useWebsocketConnection(url: string | URL) {
        return new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(url)
            socket.addEventListener("open", () => {

                STATE.actionHandler = (action, data) => {
                    socket.send(JSON.stringify({ kind: "action", action, data }))
                }

                socket.addEventListener("message", event => {
                    const message = Optional.pcall(() => JSON.parse(event.data)).filter(v => v != null && typeof v == "object").tryUnwrap()
                    if (message == null) return

                    if (message.kind == "sync") {
                        STATE.sync(message.data)
                        resolve()
                    } else if (message.kind == "mutation") {
                        const mutation = Mutation.AnyMutation_t.deserialize(message.mutation)
                        Mutation.apply(STATE.value.value, null, mutation)
                    }
                })
            })
        })
    }
})
