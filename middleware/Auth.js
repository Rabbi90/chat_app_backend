const jwt = require('jsonwebtoken')
require('dotenv').config()

const Auth = (req, res, next) => {
    try {
        const token = req.headers.authorization

        if (token) {
            const decodedToken = jwt.verify(token, process.env.SECRET)
            if (decodedToken.exp * 1000 < new Date().getTime()) {
                return res.status(400).json({ error: 'You Have To Login' })
            }
            req.userId = decodedToken.ID
        } else {
            return res.status(400).json({ error: 'You Have To Login' })
        }

        return next()
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

module.exports = Auth