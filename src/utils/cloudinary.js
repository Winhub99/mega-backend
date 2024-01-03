import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs"

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        //console.log("Uploading image with filepath: ",localFilePath);
        if(!localFilePath) return null
        //upload file on cloudinary
        const respone= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file is uploaded successfully
        //console.log("File has been uploaded successfully. :",respone.url)
        fs.unlinkSync(localFilePath)
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

  export {uploadOnCloudinary}