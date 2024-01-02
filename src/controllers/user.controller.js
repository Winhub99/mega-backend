import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req,res)=>{
    //Steps to register the user 
    /*
    1.get user details from front end
    2.validate input,check for compulsory fields
    3.check if user already exists or not
    4. check for images,and check for avatar as it is compulsory
    5.upload images to cloudinary
    6.check if avatar was uploaded successfully
    7.create user object- create and entry in db
    8.remove password(protected) and refresh token fields from response
    9.check for successfull user creation
    10. return response 
    */
    const {username,fullname,email,password} = req.body
    console.log("the email sent is : ", email)
    
    if([username,fullname,email,password].some((field)=>(field)?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existingUser = User.findOne({
        $or:[{username},{email}]
    })

    if(existingUser){
        throw new ApiError(409,"User with email or password already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath)
    const cover = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        cover:cover?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })

    const createdUser = User.findById(user._id).select(
        "-password refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong,while creating the user!")
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registered Successfully!")
    )

})

export {registerUser}