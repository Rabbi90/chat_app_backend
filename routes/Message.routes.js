const express = require('express')
const MessageRoutes = express.Router()
const Auth = require('../middleware/Auth')
const { SendMessage, GetMessage, GetLastMessage, UpdateStatus } = require('../controllers/message.contoller')

MessageRoutes.post('/send-message', Auth, SendMessage)
MessageRoutes.get('/get-message/:id', Auth, GetMessage)
MessageRoutes.get('/get-last-message/:id', Auth, GetLastMessage)
MessageRoutes.patch('/update-status', Auth, UpdateStatus)

module.exports = MessageRoutes