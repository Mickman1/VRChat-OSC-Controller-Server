const chalk = require('chalk')

// Profanity filter
const { Profanity, ProfanityOptions } = require('@2toad/profanity')
const options = new ProfanityOptions()
options.wholeWord = false
const profanity = new Profanity(options)

const commandMap = {
	'ping': 										() => pong(),
	'keyDownMoveForward': 			() => oscClient.send('/input/MoveForward', true),
	'keyDownMoveBackward': 			() => oscClient.send('/input/MoveBackward', true),
	'keyDownMoveLeft': 					() => oscClient.send('/input/MoveLeft', true),
	'keyDownMoveRight': 				() => oscClient.send('/input/MoveRight', true),
	'keyDownRun': 							() => oscClient.send('/input/Run', true),
	'keyDownJump': 							() => oscClient.send('/input/Jump', 1),
	'keyDownSpinHoldLeft': 			() => oscClient.send('/input/SpinHoldLR', -1.0000001),
	'keyDownSpinHoldRight': 		() => oscClient.send('/input/SpinHoldLR', 1.0000001),
	'keyDownSpinHoldUp': 				() => oscClient.send('/input/SpinHoldUD', -1.0000001),
	'keyDownSpinHoldDown': 			() => oscClient.send('/input/SpinHoldUD', 1.0000001),
	'keyDownSpinHoldCCW': 			() => oscClient.send('/input/SpinHoldCwCcw', -1.0000001),
	'keyDownSpinHoldCW': 				() => oscClient.send('/input/SpinHoldCwCcw', 1.0000001),
	'keyDownVoice': 						() => oscClient.send('/input/Voice', 1),
	'keyDownLookLeft': 					() => oscClient.send('/input/LookLeft', 1),
	'keyDownLookRight': 				() => oscClient.send('/input/LookRight', 1),
	'keyDownMoveHoldForward': 	() => oscClient.send('/input/MoveHoldFB', 1.0000001),
	'keyDownMoveHoldBackward': 	() => oscClient.send('/input/MoveHoldFB', -1.0000001),
	'joystickHorizontal': 			(value) => joystickHorizontal(value),
	'keyUpAll': 								() => keyUpAll(),
	'keyUpMoveForward': 				() => oscClient.send('/input/MoveForward', false),
	'keyUpMoveBackward': 				() => oscClient.send('/input/MoveBackward', false),
	'keyUpMoveLeft': 						() => oscClient.send('/input/MoveLeft', false),
	'keyUpMoveRight': 					() => oscClient.send('/input/MoveRight', false),
	'keyUpRun': 								() => oscClient.send('/input/Run', false),
	'keyUpJump': 								() => oscClient.send('/input/Jump', 0),
	'keyUpSpinHoldLeft': 				() => oscClient.send('/input/SpinHoldLR', 0.0000001),
	'keyUpSpinHoldRight': 			() => oscClient.send('/input/SpinHoldLR', 0.0000001),
	'keyUpSpinHoldUp': 					() => oscClient.send('/input/SpinHoldUD', 0.0000001),
	'keyUpSpinHoldDown': 				() => oscClient.send('/input/SpinHoldUD', 0.0000001),
	'keyUpSpinHoldCCW': 				() => oscClient.send('/input/SpinHoldCwCcw', -0.0000001),
	'keyUpSpinHoldCW': 					() => oscClient.send('/input/SpinHoldCwCcw', 0.0000001),
	'keyUpVoice': 							() => oscClient.send('/input/Voice', 0),
	'keyUpLookLeft': 						() => oscClient.send('/input/LookLeft', 0),
	'keyUpLookRight': 					() => oscClient.send('/input/LookRight', 0),
}

// VRChat OSC
const { Client, Server } = require('node-osc')
const osc = require('node-osc')
const oscClient = new Client('127.0.0.1', 9000)
const oscServer = new Server(9001, '127.0.0.1', () => {
	console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.yellow('OSC Server started at 9001'))
})

// Express for WebSockets
const express = require('express')
const WebSocket = require('ws')
const SocketServer = require('ws').Server

let hornsTimeout
let isReceivingInput = false

const expressPort = 2096
const expressServer = express().listen(expressPort, () => {
	console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}]`), chalk.yellow(`WebSocket Server started at ${expressPort}`))
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

		if (messageObject.type === 'input') {
			isReceivingInput = true

			oscClient.send('/avatar/parameters/Horns', true)

			clearTimeout(hornsTimeout)
			hornsTimeout = setTimeout(() => {
				isReceivingInput = false
				oscClient.send('/avatar/parameters/Horns', false)
			}, 2000)
		}
		else if (!isReceivingInput)
			oscClient.send('/avatar/parameters/Horns', false)

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
			processInput(message.command, message.value)
			break
		case 'chatbox':
			processChat(message.chatboxMessage)
			break
		case 'ping':
			//console.log(chalk`{cyan [${new Date().toLocaleTimeString()}]} {white 🏓: Ping}`)
			pong()
			break
	}
}

function processInput(command, value) {
	if (commandMap[command]) {
		commandMap[command](value)

		console.log(chalk`{cyan [${new Date().toLocaleTimeString()}]} {white 🕹️: ${command}}`)
	}
}

function processChat(chatboxMessage) {
	// Pass "3" as the CensorType, censors all vowels
	const censoredMessage = profanity.censor(chatboxMessage, 3)
	oscClient.send('/chatbox/input', censoredMessage, true)

	console.log(chalk`{cyan [${new Date().toLocaleTimeString()}]} {white ⌨️: "${chatboxMessage}"}`)
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

function joystickHorizontal(value) {
	// JavaScript floats don't play nice with node-osc, have to specify type
	let msg = new osc.Message('/input/LookHorizontal')
	msg.append({
		type: 'f',
		value: value
	})
	oscClient.send(msg)
}

//TODO: Only pong the client that pinged
function pong() {
	wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send('pong')
		}
	})
}
