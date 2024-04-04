import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
    /**
     * get data from req
     * check if proper data is sent from client
     * check if files are right (video and image)
     * check if everything is receiver properly (video using multer)
     * upload to cloudinary & verify
     * return document.
     */
    console.log('Req arrived.');
    const {title, description} = req.body;

    if(!(title)){
        throw new ApiError(400, "Title is required.")
    }

    if(!description){
        throw new ApiError(400, "Description is required.")
    }

    const {videoFile, thumbnail} = req.files;
    
    //check if files are there??

    if(!videoFile){
        throw new ApiError(400, "Video file missing.")
    }

    if(!thumbnail){
        throw new ApiError(400, "Thumbnail missing.")
    }
    //check formats
    if(!(videoFile[0].mimetype.startsWith('video/'))){
        throw new ApiError(400, "Video File must be a video.")
    }

    if(!(thumbnail[0].mimetype.startsWith('image/'))){
        throw new ApiError(400, "Thumbnail must be an image file.")
    }

    const videoFileLocalPath = videoFile[0]?.path;
    const thumbnailLocalPath = thumbnail[0]?.path;

    const videoFileCloud = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailCloud = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFileCloud){
        throw new ApiError(400, "Failed to upload video.")
    }

    if(!thumbnailCloud){
        throw new ApiError(400, "Failed to upload thumbnail.")
    }

    const videoFileCloudUrl = videoFileCloud.url;
    const videoFileCloudDuration = videoFileCloud.duration;

    const video = await Video.create({
        title,
        description,
        videoFile: videoFileCloudUrl,
        thumbnail: thumbnailCloud.url,
        duration: videoFileCloudDuration
    })

    const createdVideoDocument = await Video.findById(video?._id);

    return res.status(200).json(new ApiResponse(201, createdVideoDocument, "Video File uploaded successfully."))
})


const deleteVideoById = asyncHandler(async(req, res) => {
    //get video id from query params
    //check if it exists
    //get from DB
    //delete from DB
    //return response
    const videoId = req.params?.videoId;
    if(!videoId){
        throw new ApiError(400, "Couldn't get the Video Id.")
    }

    const video = await Video.findByIdAndDelete(videoId);

    if(!video){
        throw new ApiError(400, "Video not found.")
    }
    return res.status(200).json(new ApiResponse(200, video, "Video Deleted Successfully."))
})

const getVideoById = asyncHandler(async (req, res) =>{
    //get id from URL params
    //search in DB
    //handle found/not found case
    //return response

    const videoId = req.params?.videoId
    if(!videoId){
        throw new ApiError(400, "Invalid Request.")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Invalid Video Id.")
    }

    return res.status(200).json(new ApiResponse(200, video, "Video Fetched Successfully."))
})
export {
    uploadVideo,
    deleteVideoById,
    getVideoById
}