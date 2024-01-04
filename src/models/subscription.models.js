import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    subscriber:{
        type: mongoose.Types.ObjectId,//the one who is subscribing
        ref:"User"
    },
    channel:{
        type:mongoose.Types.ObjectId,//subscribing to
        ref:"User"
    }

})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)