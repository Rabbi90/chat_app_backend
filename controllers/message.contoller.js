const formidable = require('formidable')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const path = require('path')
const { MessagesValidation } = require('../models/Validator')
const MessageModal = require('../models/Message.model')
const mongoose = require('mongoose')


const SendMessage = (req, res) => {
    const formData = formidable()

    formData.parse(req, async(err, fields, files) => {
        if (err) throw err
        const { image } = files
        const { text, ReceiverId, SenderId, SenderName } = fields

        if (image) {
            if (!image.mimetype.includes('image')) return res.status(400).json({ error: 'Please Upload Image' })
            if (image.size > 1000000) return res.status(400).json({ error: 'Image Should Be Less Than 1MB' })

            const ImageName = image.originalFilename
            const ImageNewName = uuidv4() + ImageName
            image.originalFilename = ImageNewName

            const ImageFolder = path.join(__dirname, `../MessageImages/${image.originalFilename}`)
            fs.copyFile(image.filepath, ImageFolder, (er) => {
                if (er) console.log(er);
            })
        }

        const { error, value } = MessagesValidation.validate({ ReceiverId, SenderId, SenderName })
        if (error) return res.status(400).json({ error: error.details })

        const CreateNewMessage = await MessageModal.create({
            ReceiverId,
            SenderId,
            SenderName,
            Message: {
                text: text ? text : '',
                image: image ? image.originalFilename : ''
            }
        })

        return res.status(200).json({ CreateNewMessage })
    })
}


const GetMessage = async(req, res) => {
    const SenderId = req.userId
    const ReceiverId = req.params.id

    if (!SenderId || !ReceiverId) return res.status(400).json({ error: 'Please Login Again!' })
    if (!mongoose.Types.ObjectId.isValid(SenderId)) return res.status(400).json({ error: 'Invalid User!' })
    if (!mongoose.Types.ObjectId.isValid(ReceiverId)) return res.status(400).json({ error: 'Invalid User!' })

    const Chats = await MessageModal.find({
        "$or": [{
            SenderId: SenderId,
            ReceiverId: ReceiverId
        }, {
            ReceiverId: SenderId,
            SenderId: ReceiverId
        }]
    })


    return res.status(200).json({ Chats })
}

const GetLastMessage = async(req, res) => {
    const ReceiverId = req.params.id
    const UserLoginID = req.userId

    if (!ReceiverId) return res.status(400).json({ error: 'Invalid ID, No User Found!' })
    if (!mongoose.Types.ObjectId.isValid(ReceiverId)) return res.status(400).json({ error: 'Invalid User!' })

    const SingleChat = await MessageModal.find({
        "$or": [{
            SenderId: UserLoginID,
            ReceiverId: ReceiverId
        }, {
            ReceiverId: UserLoginID,
            SenderId: ReceiverId
        }]
    }).sort({ createdAt: -1 }).limit(1)
    return res.status(200).json(SingleChat[0])
}

const UpdateStatus = async(req, res) => {
    try {
        const MessageId = req.body.id
        const UserLoginID = req.userId

        if (!MessageId) return res.status(400).json({ error: 'Invalid ID, No Message Found!' })
        if (!UserLoginID) return res.status(400).json({ error: 'Invalid User, No User Found!' })
        if (!mongoose.Types.ObjectId.isValid(MessageId)) return res.status(400).json({ error: 'Invalid User!' })
        if (!mongoose.Types.ObjectId.isValid(UserLoginID)) return res.status(400).json({ error: 'Invalid User!' })

        await MessageModal.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(MessageId) }, { $set: { status: 'seen' } })

        return res.status(200).json({ success: 'ok' })
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
}

module.exports = { SendMessage, GetMessage, GetLastMessage, UpdateStatus }