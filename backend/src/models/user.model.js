import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { type } from "os";

const placesWithDescriptionSchema = new Schema({
    placeName: { type: String, required: true },
    placeImageUrl: {type : String},
    description: { type: String, required: true }
}, { timestamps: false, _id: false })

const savedTripsSchema = new Schema(
    {
        tripName: { type: String, required: true },
        days: { type: Number, required: true },
        startDate: { type: Date, required: true },
        placesWithDescription: { type: [placesWithDescriptionSchema] },
        budget: { type: Number, required: true }
    }, { timestamps: true }
)

savedTripsSchema.virtual("endDate").get(function () {
    if (!this.startDate || !this.days) return null;
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.days - 1)
    return end
})

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        contactNumber: {
            type: Number,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            default: null
        },
        commentsPosted: [
            {
                type: Schema.Types.ObjectId,
                ref: "Comment",
            }
        ],
        savedTrips: { 
            type: [savedTripsSchema], 
            default: [] 
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)