import { getValueByPath, setValueByPath } from "../comTypes/util"
import { STATE } from "./state"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface RestActionOptions {
    route: string
    method: HttpMethod
    store: string[]
}

export interface RestConnectionOptions {
    base?: URL | string
    actions: Record<string, RestActionOptions>
    auth?: string[]
    initialActions?: string[]
    errorHandler?(error: RestRequestError): void
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

    public async execute(data: any, auth: string | null) {
        const requestInit: RequestInit = {
            method: this.method,
        }

        if (auth) {
            setValueByPath(requestInit, ["headers", "authorization"], `Bearer ${auth}`)
        }

        if (data) {
            setValueByPath(requestInit, ["headers", "content-type"], `application/json`)
            requestInit.body = JSON.stringify(data)
        }

        const response = await fetch(this.route, requestInit)
        if ((response.status / 100 | 0) != 2) {
            throw new RestRequestError(response.status, await response.text())
        }

        const responseText = await response.text()
        const result = JSON.parse(responseText)

        setValueByPath(STATE.value, this.store, result)
    }

    constructor(base: URL, options: RestActionOptions) {
        this.route = new URL(options.route, base)
        this.method = options.method
        this.store = options.store
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
                await action.execute(data, auth())
            } catch (err) {
                if (!(err instanceof RestRequestError)) throw err
                options.errorHandler(err)
            }
        } else {
            await action.execute(data, auth())
        }
    }

    if (options.initialActions) {
        for (const action of options.initialActions) {
            STATE.action(action, null)
        }
    }
}
