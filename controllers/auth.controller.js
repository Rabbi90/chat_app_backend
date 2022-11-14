require('dotenv').config()
const formidable = require('formidable')
const bcrypt = require('bcrypt')
const { schema, schemaUpdate } = require('../models/Validator')
const AuthModel = require('../models/Register.model')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const validator = require('validator');
const sendMail = require('./sent.email')


const register = (req, res) => {
    const formData = formidable()

    formData.parse(req, async(err, fields, files) => {
        if (err) throw err
        const { username, email, password, confirm_password } = fields
        const { image } = files

        const { error, value } = schema.validate({ username, email, password, confirm_password, image })
        if (error) return res.status(400).json({ error: error.details })
        if (!image.mimetype.includes('image')) return res.status(400).json({ error: 'Please Upload Image' })
        if (image.size > 1000000) return res.status(400).json({ error: 'Image Should Be Less Than 1MB' })

        const EmailExist = await AuthModel.findOne({ email: value.email })
        if (EmailExist) return res.status(400).json({ error: 'User Already Exist' })

        const ImageName = image.originalFilename
        const ImageNewName = uuidv4() + ImageName
        image.originalFilename = ImageNewName

        const ImageFolder = path.join(__dirname, `../Images/${image.originalFilename}`)
        fs.copyFile(image.filepath, ImageFolder, (er) => {
            if (er) console.log(er);
        })

        const hash = bcrypt.hashSync(value.password, 10)
        const SaveUser = await AuthModel.create({
            username,
            email,
            password: hash,
            ImagePath: image.originalFilename
        })

        const token = jwt.sign({
            ID: SaveUser._id,
            EMAIL: SaveUser.email,
            USERNAME: SaveUser.username,
            IMAGE: SaveUser.ImagePath
        }, process.env.SECRET, { expiresIn: '1d' })

        return res.status(201).json({ token, path: 'Registration' })
    })
}



const login = async(req, res) => {
    const formData = formidable()
    formData.parse(req, async(err, fields) => {
        if (err) throw err
        const { email, password } = fields

        if (!email || !password) return res.status(400).json({ error: 'Field Cannot Be Empty' })

        const EmailExist = await AuthModel.findOne({ email }).select('+password')
        if (!EmailExist) return res.status(400).json({ error: 'No User Found' })

        // if (EmailExist.isLogin === true) return res.status(400).json({ error: 'Someone is Already Logged in, Logout First Then Try Again' })

        const compare = bcrypt.compareSync(password, EmailExist.password)
        if (!compare) return res.status(400).json({ error: 'Incorrect Password' })

        const token = jwt.sign({
            ID: EmailExist._id,
            EMAIL: EmailExist.email,
            USERNAME: EmailExist.username,
            IMAGE: EmailExist.ImagePath
        }, process.env.SECRET, { expiresIn: '1d' })

        // await AuthModel.findOne({ _id: new mongoose.Types.ObjectId(EmailExist._id) }, { $set: { isLogin: true } })

        return res.status(200).json({ token, path: 'Login' })
    })
}

const Logout = async(req, res) => {
    // const token = req.headers.authorization
    // const decode = jwt.verify(token, process.env.SECRET)
    // const userId = req.userId

    // if (!token) return res.status(400).json({ error: 'Authorization Revoked!!' })
    // if (!decode.email) return res.status(400).json({ error: 'Authorization Revoked!!' })
    // if (!userId) return res.status(400).json({ error: 'You Are Not Valid User!!' })

    // const EmailExist = await AuthModel.findOne({ email: decode.email }).select('+password')
    // if (!EmailExist) return res.status(400).json({ error: 'No User Found' })

    // await AuthModel.findOne({ _id: new mongoose.Types.ObjectId(EmailExist._id) }, { $set: { isLogin: false } })

    // return res.status(200).json({ success: 'ok' })
}


const update = async(req, res) => {
    const formData = formidable()
    const id = req.params.id
    const userId = req.userId

    if (!id || !userId) {
        return res.status(400).json({ error: 'You Are Not Valid User!!' })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No User Found!!' })
    }

    if (id !== userId) {
        return res.status(400).json({ error: 'You Are Not Valid User!!' })
    }

    const FindUser = await AuthModel.findById({ _id: new mongoose.Types.ObjectId(id) }).select('+password')
    if (!FindUser) return res.status(400).json({ error: 'No User Found' })


    formData.parse(req, async(err, fields, files) => {
        if (err) throw err

        const { username, email, old_password, password, confirm_password } = fields
        const { image } = files

        const { error, value } = schemaUpdate.validate({ username, email, old_password, password, confirm_password })
        if (error) return res.status(400).json({ error: error.details })

        if (image) {
            if (!image.mimetype.includes('image')) return res.status(400).json({ error: 'Please Upload Image' })
            if (image.size > 1000000) return res.status(400).json({ error: 'Image Should Be Less Than 1MB' })

            const ImageName = image.originalFilename
            const ImageNewName = uuidv4() + ImageName
            image.originalFilename = ImageNewName

            const ImageFolder = path.join(__dirname, `../Images/${image.originalFilename}`)
            fs.copyFile(image.filepath, ImageFolder, (er) => {
                if (er) console.log(er);
                fs.unlink(path.join(__dirname, `../Images/${FindUser.ImagePath}`), (er) => { if (er) throw er })
            })
        }

        if ((password || confirm_password) && !old_password) return res.status(400).json({ error: 'Enter Old Password!!' })
        if (old_password) {
            if (!password && !confirm_password) return res.status(400).json({ error: 'New Password Cannot Be Empty!!' })
            if (password !== confirm_password) return res.status(400).json({ error: 'New Password & Confirm Password Didn\'t Match!!' })

            const confirm = bcrypt.compareSync(old_password, FindUser.password)
            if (!confirm) return res.status(400).json({ error: 'Old Password is Incorrect!!' })

            var hash = bcrypt.hashSync(password, 10)
        }

        await AuthModel.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, {
            username: username ? username : FindUser.username,
            email: email ? email : FindUser.email,
            password: hash ? hash : FindUser.password,
            ImagePath: image ? image.originalFilename : FindUser.ImagePath,
        }, { new: true })

        return res.status(200).json({ update: 'ok' })
    })
}


const SendResetToken = async(req, res) => {
    const { email } = req.body

    if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Enter Valid Email Address!!' })

    const EmailExist = await AuthModel.findOne({ email })
    if (!EmailExist) return res.status(400).json({ error: 'No User Found!!' })

    const token = jwt.sign({ email }, process.env.SECRET, { expiresIn: '10m' })
    sendMail(EmailExist.email, token)
    await AuthModel.findOneAndUpdate({ email: EmailExist.email }, { $set: { resetToken: token } }, { new: true })

    return res.status(200).json({ message: `Reset Email Set To ${EmailExist.email}` })
}


const ResetPassword = async(req, res) => {
    const { password, confirm_password, token } = req.body

    if (!token) return res.status(400).json({ error: 'Invalid User, Try Again !!' })
    if (!password || !confirm_password) return res.status(400).json({ error: 'Field Cannot Be Empty !!' })

    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (decodedToken.exp * 1000 < new Date().getTime()) return res.status(400).json({ error: 'Invalid User, Try Forgot Password Again' })

    const { error, value } = schemaUpdate.validate({ email: decodedToken.email, password, confirm_password })
    if (error) return res.status(400).json({ error: error.details })

    if (password !== confirm_password) return res.status(400).json({ error: 'Confirm Password Didn\'t Match!!' })

    if (!decodedToken) return res.status(400).json({ error: 'Invalid User, try Again!!' })
    if (!decodedToken.email) return res.status(400).json({ error: 'Invalid User, try Again!!' })

    const EmailExist = await AuthModel.findOne({ email: decodedToken.email })
    if (!EmailExist) return res.status(400).json({ error: 'No User Found!!' })

    if (token !== EmailExist.resetToken) return res.status(400).json({ error: 'Something is Wrong!!' })

    const hash = bcrypt.hashSync(value.password, 10)

    await AuthModel.findOneAndUpdate({ email: EmailExist.email }, { $set: { password: hash, resetToken: '' } }, { new: true })
    return res.status(200).json({ message: `Password Updated, Please Login Now !` })
}


module.exports = { register, login, update, SendResetToken, ResetPassword, Logout }