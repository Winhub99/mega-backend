import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

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
   //step 1
    const {username,fullname,email,password} = req.body
    console.log("the email sent is : ", email)
    //step 2
    if([username,fullname,email,password].some((field)=>(field)?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    //step 3
    const existingUser =await User.findOne({
        $or:[{username},{email}]
    })

    if(existingUser){
        throw new ApiError(409,"User with email or password already exists")
    }

    console.log(req.files);
    //step 4
    const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.cover[0]?.path;

   let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.cover) && req.files.cover.length >0){
         coverImageLocalPath = req.files.cover[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //step 5
    const avatar =await uploadOnCloudinary(avatarLocalPath)
    //console.log("the avatar image is: ",avatar)
    const cover = await uploadOnCloudinary(coverImageLocalPath)
    //console.log("the cover image is: ",cover)
    //step 6
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //step 7
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:cover?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })

    //step 8 i.e removing protected data from created user object
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //step 9
    if(!createdUser){
        throw new ApiError(500,"Something went wrong,while creating the user!")
    }

    //step 10
  //  console.log(createdUser)
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully!")
    )

})

const generateRefreshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating tokens")
    }
}
const loginUser = asyncHandler(async (req,res)=>{
    //req body => data
    //decide basis for login either username or email based
    //search for user
    //check password
    //access and refresh token genration
    // send these tokens in a cookie
    const {username,password,email} = req.body

    if(!(email || password)){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken}= await generateRefreshAndAccessToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options ={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken
                },
                "User logged in Successfully"
                )
        )
})

const logoutUser = asyncHandler(async (req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{"refreshToken":undefined}
        },
        {
            new:true
        }
        )
    
    const options={
        httpOnly:true,
        secure:true
    }    

    return res
            .status(200)
            .clearCookie("accessToken",options)
            .clearCookie("refreshToken",options)
            .json(new ApiResponse(200, {}, "User logged out"))

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
try {
    
      const incomingRefeshToken = req.cookies.refreshToken || req.body.refreshToken
    
      if(!incomingRefeshToken){
        throw new ApiError(401,"unauthorized request")
      }
    
      const decodedToken = jwt.verify(incomingRefeshToken,process.env.REFRESH_TOKEN_SECRET)
    
      const user= await User.findById(decodedToken?._id)
    
      if(!user){
        throw new ApiError(401,"Invalid refresh token")
      }
    
      if(incomingRefeshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token either expired or used")
      }
    
      const options={
        httpOnly:true,
        secure:true
      }
    
      const {newAccessToken, newRefreshToken} = await generateRefreshAndAccessToken(user._id)
    
      return res
            .status(200)
            .cookie("accessToken",newAccessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(new ApiResponse(
                200,{
                    accessToken:newAccessToken,
                    refreshToken:newRefreshToken,
                },
                    "Access token refreshed"
                )
            )
} catch (error) {
    throw new ApiError(401, error?.message ||"Invalid refresh token")
}

})
export {registerUser,loginUser,logoutUser,refreshAccessToken}