const mongoose = require('mongoose')
const config = require('./config')
const URL = config.db.url


mongoose.connect(URL)
    .then(() => {
        console.log('Connected To MongoDB Successfully')
    }).catch(er => {
        console.log(er.message)
        process.exit(1)
    })