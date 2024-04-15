import { getValueByPath, setValueByPath } from "../comTypes/util"
import { STATE } from "./state"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface RestActionOptions {
    route: string
    method: HttpMethod
    store?: string[]
    multipart?: boolean
}

export interface RestConnectionOptions {
    base?: URL | string
    actions: Record<string, RestActionOptions>
    auth?: string[]
    initialActions?: string[]
    errorHandler?(error: RestRequestError): void
    onResponse?(response: string): void
}

export class RestRequestError extends Error {
    name = "RestRequestError"

    constructor(
        public readonly status: number,
        public readonly body: string
    ) { super(`REST request error ${status}: ${body}`) }
}

export class RestAction {
    public readonly route
    public readonly method
    public readonly store
    public readonly multipart

    public async execute(data: any, auth: string | null, onResponse: RestConnectionOptions["onResponse"]) {
        const requestInit: RequestInit = {
            method: this.method,
        }

        let route = this.route.href

        if (auth) {
            setValueByPath(requestInit, ["headers", "authorization"], `Bearer ${auth}`)
        }

        if (data) {
            if (this.method != "GET") {
                if (this.multipart) {
                    const formData = new FormData()
                    for (const [key, value] of Object.entries(data)) {
                        if (typeof value == "string" || value instanceof Blob) {
                            formData.set(key, value)
                            continue
                        }

                        if (value instanceof Array) {
                            for (const element of value) {
                                if (typeof element != "string" && !(element instanceof Blob)) continue
                                formData.append(key, element)
                            }
                            continue
                        }
                    }
                    requestInit.body = formData
                } else {
                    setValueByPath(requestInit, ["headers", "content-type"], `application/json`)
                    requestInit.body = JSON.stringify(data)
                }
            }

            route = route.replace(/:([a-z]\w*)/g, (_, select) => encodeURIComponent(data[select]))

        }

        const response = await fetch(route, requestInit)
        if ((response.status / 100 | 0) != 2) {
            throw new RestRequestError(response.status, await response.text())
        }

        const responseText = await response.text()
        onResponse?.(responseText)
        const result = responseText.trim() == "" ? null : JSON.parse(responseText)

        if (this.store) setValueByPath(STATE.value, this.store, result)
    }

    constructor(base: URL, options: RestActionOptions) {
        this.route = new URL(options.route, base)
        this.method = options.method
        this.store = options.store
        this.multipart = options.multipart ?? false
    }
}

export function useRestConnection(options: RestConnectionOptions) {
    const base = typeof options.base == "string" ? new URL(options.base, location.href) : options.base ?? new URL(location.href)

    const actions = new Map(Object.entries(options.actions).map(([key, value]) => [key, new RestAction(base, value)]))

    function auth() {
        if (options.auth == null) return null
        const authValue = getValueByPath(STATE.value, options.auth)
        return authValue
    }

    STATE.actionHandler = async (actionName, data) => {
        const action = actions.get(actionName)
        if (action == null) throw new Error("Tried to execute unknown action " + JSON.stringify(actionName))
        if (options.errorHandler) {
            try {
                await action.execute(data, auth(), options.onResponse)
            } catch (err) {
                if (!(err instanceof RestRequestError)) throw err
                options.errorHandler(err)
            }
        } else {
            await action.execute(data, auth(), options.onResponse)
        }
    }

    if (options.initialActions) {
        for (const action of options.initialActions) {
            STATE.action(action, null)
        }
    }
}
