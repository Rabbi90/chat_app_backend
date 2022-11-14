const express = require('express')
const OtherRoutes = express.Router()
const Auth = require('../middleware/Auth')
const { GetFriends, GetDetails } = require('../controllers/other.controller')

OtherRoutes.get('/friends', Auth, GetFriends)
OtherRoutes.get('/friends/:id', Auth, GetDetails)

module.exports = OtherRoutes