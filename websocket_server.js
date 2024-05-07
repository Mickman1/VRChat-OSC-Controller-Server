// VRChat OSC
const { Client, Server } = require('node-osc')

const oscClient = new Client('127.0.0.1', 9000)

var oscServer = new Server(9001, '127.0.0.1', () => {
	console.log('\x1b[33mOSC Server online\x1b[0m')
})

oscServer.on('message', function (msg) {
	//console.log(msg)
})

// Express for WebSockets
const express = require('express')
const WebSocket = require('ws')
const SocketServer = require('ws').Server

const expressPort = 2096
const expressServer = express().listen(expressPort, () => {
	console.log(`Server started at ${expressPort}`)
})

const wss = new SocketServer({ server: expressServer })

wss.on('connection', (ws, request) => {
	console.log('[Server] Client connected.')

	let clientUptimeDateStart = Date.now()

	ws.on('close', () => {
		console.log(`[Server] Client disconnected.\nClient uptime was ${(Date.now() - clientUptimeDateStart) / 1000} seconds.`)
	})

	ws.on('message', (message) => {
		// Convert incomming Buffer to readable String
		let messageString = Buffer.from(message).toString()
		console.log(messageString)

		oscClient.send('/chatbox/input', `${messageString}`, true)

		// Broadcast to everyone else connected
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		})
	})
})
