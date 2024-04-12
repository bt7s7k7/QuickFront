import { ref } from "vue"

export const STATE = new class State {
    public readonly value = ref<any>(null)
    public actionHandler: ((action: string, data: any) => any) | null = null
    public postSync: ((value: any) => void) | null = null
    public disposer: (() => void) | null = null

    public action(action: string, data: any) {
        if (this.actionHandler == null) {
            // eslint-disable-next-line no-console
            console.error("No action handler set")
            return
        }

        return this.actionHandler(action, data)
    }

    public dispose() {
        this.disposer?.()
        this.disposer = null
    }

    public sync(data: any) {
        this.postSync?.(data)
        this.value.value = data
    }
}
