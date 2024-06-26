import { Optional } from "../comTypes/Optional"
import { escapeHTML } from "../comTypes/util"
import { Mutation } from "../struct/Mutation"
import { STATE } from "./state"

export function useWebsocketConnection(url: string | URL) {
    return new Promise<void>((resolve, reject) => {
        const href = typeof url == "string" ? url : url.href

        const info = document.createElement("div")
        info.setAttribute("class", "m-2 p-2 absolute top-0 left-0 bg-white")
        info.innerHTML = escapeHTML(`Connecting to ${href}...`)
        document.body.appendChild(info)

        const connect = () => {
            const socket = new WebSocket(url)
            STATE.disposer = () => { terminate = true; socket.close() }
            socket.addEventListener("open", () => {
                info.remove()

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

            let error = false
            let terminate = false
            socket.addEventListener("error", () => {
                info.innerHTML = "Connection error! Attempting reconnect..."
                info.classList.add("text-danger")
                error = true
            })

            socket.addEventListener("close", () => {
                if (terminate) return
                setTimeout(() => {
                    if (!error) {
                        location.reload()
                    } else {
                        setTimeout(() => {
                            connect()
                        }, 500)
                    }
                }, 10)
            })
        }

        connect()
    })
}
