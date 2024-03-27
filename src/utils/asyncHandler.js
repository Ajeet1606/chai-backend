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
        await func(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
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