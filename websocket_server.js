const chalk = require('chalk')

// Profanity filter
const { Profanity, ProfanityOptions } = require('@2toad/profanity')

const options = new ProfanityOptions()
options.wholeWord = false

const profanity = new Profanity(options)

// VRChat OSC
const { Client, Server } = require('node-osc')

const oscClient = new Client('127.0.0.1', 9000)

var oscServer = new Server(9001, '127.0.0.1', () => {
	console.log(chalk.yellow('OSC Server online'))
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
	console.log(chalk.yellow(`Server started at ${expressPort}`))
})

const wss = new SocketServer({ server: expressServer })

wss.on('connection', (ws, request) => {
	console.log(chalk.greenBright('[Server] Client connected.'))

	let clientUptimeDateStart = Date.now()

	ws.on('close', () => {
		console.log(chalk.redBright(`[Server] Client disconnected.\nClient uptime was ${(Date.now() - clientUptimeDateStart) / 1000} seconds.`))
	})

	ws.on('message', (message) => {
		// Convert incomming Buffer to readable String
		let messageString = Buffer.from(message).toString()
		console.log(chalk.cyan(`${new Date().toLocaleTimeString()}: `), chalk.grey(`${messageString}`))

		// Pass "3" as the CensorType, censors all vowels
		oscClient.send('/chatbox/input', `${profanity.censor(messageString, 3)}`, true)

		// Broadcast to everyone else connected
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		})
	})
})
