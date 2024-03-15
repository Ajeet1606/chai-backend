//we're building a wrapper async function which can take a function and execute autonomously, like connecting to DB etc.

//promise method
// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch(err => next(err))
//     }
// };


//try-catch method
const asyncHandler = (func) => async (req, res, next) => {
    try {
        
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}

/**
 * breakdown of above syntax
 * const asyncHandler = () => {}
 * const asyncHandler = (func) => () => {}
 * const asyncHandler = (func) => async() => {}
 */

export {asyncHandler}