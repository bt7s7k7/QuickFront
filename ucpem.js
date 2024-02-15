/// <reference path="./.vscode/config.d.ts" />

const { project, github, copy, join, constants } = require("ucpem")
const fs = require("fs")

project.prefix("src").res("quickFront",
    github("bt7s7k7/Vue3GUI").res("vue3gui"),
    github("bt7s7k7/Apsides").res("formBuilder"),
)

project.script("dev-server", async ([name]) => {
    const server = require(`./views/${name}.js`)
}, { desc: "Starts the specified development server :: Arguments: <name>", argc: 1 })

project.script("create-view", async ([name]) => {
    copy(join(constants.projectPath, "index.html"), join(constants.projectPath, "views", name + ".html"), {
        replacements: [
            [/__TITLE/, name],
            [/text: "[^"]*?"/, `text: "Edit your html file"`],
        ]
    })
}, { desc: "Creates a view :: Arguments: <name>", argc: 1 })

project.script("create-dev-server", async ([name]) => {
    fs.writeFileSync(join(constants.projectPath, "views", name + ".js"), `
/* eslint-disable no-console */
const express = require("express")
const { WebSocketServer } = require("ws")

const app = express()

app.get("/api/", (req, res) => {
    res.json({ success: true }).end()
})

const server = app.listen(8081)

const wss = new WebSocketServer({ server })

const value = { counter: 0 }
/** @type {Set<import("ws").WebSocket>} */
const sockets = new Set()

function increment(increase) {
    value.counter += increase
    for (const socket of sockets) socket.send(JSON.stringify({
        kind: "mutation", mutation: {
            type: "mut_assign",
            value: value.counter,
            key: "counter",
            path: []
        }
    }))
}

wss.on("connection", (socket) => {
    socket.on("error", console.error)

    sockets.add(socket)
    socket.on("close", () => {
        sockets.delete(socket)
        console.log("Lost connection")
    })

    console.log("New connection")

    socket.on("message", function message(data) {
        console.log("received: %s", data)

        const message = JSON.parse(data)
        if (message.kind == "action") {
            if (message.action == "increment") {
                increment(message.data)
            }
        }
    })

    socket.send(JSON.stringify({ kind: "sync", data: value }))
})`
    )
}, { desc: "Creates a view :: Arguments: <name>", argc: 1 })
