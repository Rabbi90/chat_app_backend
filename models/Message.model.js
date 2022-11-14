const { boolean } = require('joi');
const mongoose = require('mongoose');


const Messages = new mongoose.Schema({
    SenderName: {
        type: String,
        required: true
    },
    SenderId: {
        type: String,
        required: true
    },
    ReceiverId: {
        type: String,
        required: true
    },
    Message: {
        text: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: '',
        }
    },
    status: {
        type: String,
        default: 'unseen'
    },
    isLogin: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true })

const MessageModal = mongoose.model('messages', Messages)
module.exports = MessageModal