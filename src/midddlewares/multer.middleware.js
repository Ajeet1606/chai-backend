import multer from "multer";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage
});

const handleMulterError = (err, req, res, next) =>{
    if(err instanceof MulterError){
        if(err.code === "LIMIT_UNEXPECTED_FILE"){
            throw new ApiError(400, "Too many files uploaded.")
        }else{
            throw new ApiError(400, `${err.message}`)
        }
    }else{
        throw new ApiError(500, "Something went wrong.")
    }
}

export {handleMulterError}