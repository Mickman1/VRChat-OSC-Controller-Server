const chalk = require('chalk')

// Profanity filter
const { Profanity, ProfanityOptions } = require('@2toad/profanity')
const options = new ProfanityOptions()
options.wholeWord = false
const profanity = new Profanity(options)

// VRChat OSC
const { Client, Server } = require('node-osc')
const oscClient = new Client('127.0.0.1', 9000)
const oscServer = new Server(9001, '127.0.0.1', () => {
	console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.yellow('OSC Server online'))
})

oscServer.on('message', (msg) => {
	console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.grey(msg))
})

// Express for WebSockets
const express = require('express')
const WebSocket = require('ws')
const SocketServer = require('ws').Server

const expressPort = 2096
const expressServer = express().listen(expressPort, () => {
	console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.yellow(`Server started at ${expressPort}`))
})

const wss = new SocketServer({ server: expressServer })

wss.on('connection', (ws, request) => {
	let clientUptimeDateStart = Date.now()
	console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.hex('#6ee859')('[Server] Client connected.'))

	ws.on('close', () => {
		console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.hex('#e85959')(`[Server] Client disconnected. Client uptime was ${(Date.now() - clientUptimeDateStart) / 1000} seconds.`))
	})

	ws.on('message', (message) => {
		const messageString = message.toString()
		const messageObject = JSON.parse(message)
		console.log(chalk.cyan(`${new Date().toLocaleTimeString()}:`), chalk.grey(`${messageString}`))

		processMessage(messageObject)

		// Broadcast to everyone else connected
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		})
	})
})

function processMessage(message) {
	switch (message.type) {
		case 'input':
			processInput(message.message)
			break
		case 'chatbox':
			processChat(message.message)
			break
	}
}

function processInput(message) {
	switch (message) {
		case 'keyDownForward':
			oscClient.send('/input/MoveForward', true)
			break
		case 'keyDownBackward':
			oscClient.send('/input/MoveBackward', true)
			break
		case 'keyDownLeft':
			oscClient.send('/input/MoveLeft', true)
			break
		case 'keyDownRight':
			oscClient.send('/input/MoveRight', true)
			break
		case 'keyDownSprint':
			oscClient.send('/input/Run', true)
			break
		case 'keyDownJump':
			oscClient.send('/input/Jump', 1)
			break
		case 'keyDownCrouch':
			oscClient.send('/avatar/parameters/Upright', 0.6)
			break
		case 'keyDownProne':
			oscClient.send('/avatar/parameters/Upright', 0.35)
			break
		case 'keyUpForward':
			oscClient.send('/input/MoveForward', false)
			break
		case 'keyUpBackward':
			oscClient.send('/input/MoveBackward', false)
			break
		case 'keyUpLeft':
			oscClient.send('/input/MoveLeft', false)
			break
		case 'keyUpRight':
			oscClient.send('/input/MoveRight', false)
			break
		case 'keyUpSprint':
			oscClient.send('/input/Run', false)
			break
		case 'keyUpJump':
			oscClient.send('/input/Jump', 0)
			break
		case 'keyUpCrouch':
			oscClient.send('/avatar/parameters/Upright', 1)
			break
		case 'keyUpProne':
			oscClient.send('/avatar/parameters/Upright', 1)
			break
	}
}

function processChat(message) {	
	// Pass "3" as the CensorType, censors all vowels
	oscClient.send('/chatbox/input', `${profanity.censor(message, 3)}`, true)
}
