const server = require('../index')
const { Server } = require('socket.io')
const { URL } = require('./Contants')
const sio = new Server(server, { cors: URL })

let users = []

let AddUser = (userInfo, userId, socketId) => {
    const isUserExist = users.some(user => user.userId === userId)
    if (!isUserExist && userId) {
        return users.push({ userId, socketId, userInfo })
    }
}

let RemoveUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId)
}

let FindUser = (id) => {
    return users.find(user => user.userId === id)
}

sio.on('connection', (socket) => {
    socket.on('AddUser', (userDetails) => {
        AddUser(userDetails, userDetails.ID, socket.id)
        sio.emit('ActiveUsers', users)
    })

    socket.on('SendMessage', (data) => {
        const user = FindUser(data.ReceiverId.toString())
        if (user !== undefined) {
            const base64String = btoa(new Uint8Array(data.Message.image).reduce(function(data, byte) {
                return data + String.fromCharCode(byte);
            }, ''));

            data = {...data,
                Message: {
                    text: data.Message.text,
                    image: base64String,
                }
            }
            socket.to(user.socketId).emit('GetMessage', data)
        }
    })

    socket.on('LastMessage', (data) => {
        const user = FindUser(data.LastMsg[0].ReceiverId.toString())
        if (user !== undefined) {
            socket.to(user.socketId).emit('LastMessage', data)
        }
    })

    socket.on('seen', (seenData) => {
        const user = FindUser(seenData.LastMsg[0].ReceiverId.toString())
        const user1 = FindUser(seenData.LastMsg[0].SenderId.toString())
        if (user !== undefined) {
            sio.to(user.socketId).emit('Seen', seenData)
        }
        if (user1 !== undefined) {
            sio.to(user1.socketId).emit('SeenSender', seenData)
        }
    })

    socket.on('TypingStart', (data) => {
        const user = FindUser(data.ReceiverId.toString())
        if (user !== undefined) {
            socket.to(user.socketId).emit('TypingStart', data)
        }
    })

    socket.on('TypingEnd', (data) => {
        if (data.ReceiverId) {
            const user = FindUser(data.ReceiverId.toString())
            if (user !== undefined) {
                socket.to(user.socketId).emit('TypingEnd', data)
            }
        }
    })

    socket.on('disconnect', () => {
        RemoveUser(socket.id)
        sio.emit('ActiveUsers', users)
    })
})