import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        //upload file on cloudinary
        const respone= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file is uploaded successfully
        console.log("File has been uploaded successfully. :",respone.url)
        return respone
    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temp file
        return null

    }
}

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET 
  });