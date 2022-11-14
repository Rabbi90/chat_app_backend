const mongoose = require('mongoose');


const RegisterSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    resetToken: {
        type: String,
        default: ''
    },
    ImagePath: {
        type: String,
        required: true
    }
}, { timestamps: true })

const AuthModel = mongoose.model('users', RegisterSchema)
module.exports = AuthModel