import mongoose, { Schema } from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps:True})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)
