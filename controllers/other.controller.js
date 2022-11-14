const AuthModel = require('../models/Register.model')
const mongoose = require('mongoose')
const MessageModal = require('../models/Message.model')



const GetFriends = async(req, res) => {
    const userId = req.userId
    let FriendsANDLastMsg = []

    if (!userId) return res.status(400).json({ error: 'Please Login!!' })
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'No User Found!!' })

    const AllFriends = await AuthModel.find({ _id: { $ne: new mongoose.Types.ObjectId(userId) } }, { 'username': 1, 'ImagePath': 1 })

    for (let i = 0; i < AllFriends.length; i++) {
        const LastMsg = await MessageModal.find({
            "$or": [{
                SenderId: AllFriends[i]._id,
                ReceiverId: userId
            }, {
                ReceiverId: AllFriends[i]._id,
                SenderId: userId
            }]
        }).sort({ createdAt: -1 }).limit(1)
        FriendsANDLastMsg = [...FriendsANDLastMsg, {
            Friends: AllFriends[i],
            LastMsg: LastMsg
        }]
    }

    return res.status(200).json(FriendsANDLastMsg)
}

const GetDetails = async(req, res) => {
    const userId = req.userId
    const { id } = req.params

    if (!userId || !id) return res.status(400).json({ error: 'Something is Missing!!' })
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'No User Found!!' })
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'No User Found!!' })

    const GetUserDetails = await AuthModel.findById(id, { 'username': 1, 'ImagePath': 1, 'email': 1 })
    return res.status(200).json({ GetUserDetails })
}

module.exports = { GetFriends, GetDetails }