const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const http = require('http')
const app = express()
const server = http.createServer(app)

const config = require('./config/config');
const AuthRouter = require('./routes/Auth.routes');
const OtherRouter = require('./routes/other.routes');
const MessageRouter = require('./routes/Message.routes');
const { URL } = require('./Global/Contants');
const PORT = config.app.port
require('./config/db')


app.use(cors({ origin: URL }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('./Images'))
app.use(express.static('./MessageImages'))

app.use('/api', OtherRouter)
app.use('/auth', AuthRouter)
app.use('/message', MessageRouter)

app.use((req, res, next) => {
    res.status(500).json({
        message: "Invalid Url !!"
    })
    next()
})

app.use((err, req, res, next) => {
    res.status(500).json({
        message: "Something is Wrong !!"
    })
    next()
})

server.listen(PORT, () => {
    console.log(`Server Running On http://localhost:${PORT}`);
})

module.exports = server
require('./Global/Socket')