const express = require('express')
const AuthRouter = express.Router()
const { register, login, update, SendResetToken, ResetPassword } = require('../controllers/auth.controller')
const Auth = require('../middleware/Auth')

AuthRouter.post('/register', register)
AuthRouter.post('/login', login)
AuthRouter.patch('/forgot_password', SendResetToken)
AuthRouter.patch('/reset_password', ResetPassword)
AuthRouter.patch('/update_profile/:id', Auth, update)

module.exports = AuthRouter