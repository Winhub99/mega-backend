class ApiError extends Error{
    constructor(
        statusCode,
        errors=[],
        message="Someting went wrong!",
        stack=""){
            super(message)
            this.statusCode=statusCode,
            this.data= null,
            this.message=message,
            this.errors=errors,
            this.success=false

            if(stack){
                this.stack= stack
            }else{
                Error.captureStackTrace(this,this.constructor)
            }
        }
}

export {ApiError}