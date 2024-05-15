const chalk = require('chalk')

// Profanity filter
const { Profanity, ProfanityOptions } = require('@2toad/profanity')
const options = new ProfanityOptions()
options.wholeWord = false
const profanity = new Profanity(options)

const inputMap = {
	'keyDownForward': 	() => oscClient.send('/input/MoveForward', true),
	'keyDownBackward': 	() => oscClient.send('/input/MoveBackward', true),
	'keyDownLeft': 			() => oscClient.send('/input/MoveLeft', true),
	'keyDownRight': 		() => oscClient.send('/input/MoveRight', true),
	'keyDownSprint': 		() => oscClient.send('/input/Run', true),
	'keyDownJump': 			() => oscClient.send('/input/Jump', 1),
	'keyDownCrouch': 		() => oscClient.send('/input/GrabAxisRight', 1),
	'keyDownProne': 		() => oscClient.send('/avatar/parameters/Upright', 0.35),
	'keyDownVoice': 		() => oscClient.send('/input/Voice', 1),
	'keyDownLookLeft': 	() => oscClient.send('/input/LookLeft', 1),
	'keyDownLookRight': () => oscClient.send('/input/LookRight', 1),
	'keyUpAll': 				() => keyUpAll(),
	'keyUpForward': 		() => oscClient.send('/input/MoveForward', false),
	'keyUpBackward': 		() => oscClient.send('/input/MoveBackward', false),
	'keyUpLeft': 				() => oscClient.send('/input/MoveLeft', false),
	'keyUpRight': 			() => oscClient.send('/input/MoveRight', false),
	'keyUpSprint': 			() => oscClient.send('/input/Run', false),
	'keyUpJump': 				() => oscClient.send('/input/Jump', 0),
	'keyUpCrouch': 			() => oscClient.send('/avatar/parameters/Go/Horizon', false),
	'keyUpProne': 			() => oscClient.send('/avatar/parameters/Upright', 1),
	'keyUpVoice': 			() => oscClient.send('/input/Voice', 0),
	'keyUpLookLeft': 		() => oscClient.send('/input/LookLeft', 0),
	'keyUpLookRight': 	() => oscClient.send('/input/LookRight', 0),
}

// VRChat OSC
const { Client, Server } = require('node-osc')
const oscClient = new Client('127.0.0.1', 9000)
const oscServer = new Server(9001, '127.0.0.1', () => {
	console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.yellow('OSC Server online at 9000'))
})

// Express for WebSockets
const express = require('express')
const WebSocket = require('ws')
const SocketServer = require('ws').Server

const expressPort = 2096
const expressServer = express().listen(expressPort, () => {
	console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.yellow(`Server started at ${expressPort}`))
})

const wss = new SocketServer({ server: expressServer })

wss.on('connection', (ws, request) => {
	let clientStartTime = Date.now()
	console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.hex('#6ee859')('Client connected'))

	ws.on('close', () => {
		console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`),
		chalk.hex('#e85959')(`Client disconnected after ${(Date.now() - clientStartTime) / 1000} seconds`))
	})

	ws.on('message', (message) => {
		const messageObject = JSON.parse(message)

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
	if (inputMap[message])
		inputMap[message]()
	else
		return;

	console.log(chalk`{cyan [${new Date().toLocaleTimeString()}]} {white 🕹️: ${message}}`)
}

function processChat(message) {
	// Pass "3" as the CensorType, censors all vowels
	const censoredMessage = profanity.censor(message, 3)
	oscClient.send('/chatbox/input', censoredMessage, true)
	
	console.log(chalk`{cyan [${new Date().toLocaleTimeString()}]} {white ⌨️: "${message}"}`)
}

function keyUpAll() {
	oscClient.send('/input/MoveForward', false)
	oscClient.send('/input/MoveBackward', false)
	oscClient.send('/input/MoveLeft', false)
	oscClient.send('/input/MoveRight', false)
	oscClient.send('/input/Run', false)
	oscClient.send('/input/Jump', 0)
	oscClient.send('/input/LookLeft', 0)
	oscClient.send('/input/LookRight', 0)
}
