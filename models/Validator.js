const Joi = require('joi');

const schema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(12)
        .required(),

    password: Joi.string()
        .min(6)
        .max(30)
        .required(),

    confirm_password: Joi.string()
        .min(3)
        .max(30)
        .valid(Joi.ref('password'))
        .required(),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })
        .required(),

    image: Joi.any()
        .required()
        .messages({
            'any.required': 'Profile Image Cannot Be Empty'
        })

})


const schemaUpdate = Joi.object({
    username: Joi.string()
        .allow('')
        .min(3)
        .max(12),

    old_password: Joi.string()
        .allow('')
        .min(6)
        .max(30),

    password: Joi.string()
        .allow('')
        .min(6)
        .max(30),

    confirm_password: Joi.string()
        .allow('')
        .min(6)
        .max(30),

    email: Joi.string()
        .allow('')
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })

})


const MessagesValidation = Joi.object({
    SenderName: Joi.string().required(),
    SenderId: Joi.string().required(),
    ReceiverId: Joi.string().required(),
})

module.exports = { schema, schemaUpdate, MessagesValidation }