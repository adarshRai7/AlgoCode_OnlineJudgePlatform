import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from "express";

export const validateDto = ( schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction)=>{
    try {
        schema.parse({  
            ...req.body
        });
        next();
    } catch (error) {
        return res.status(404).json({
            success: false,
            data: {},
            message: "Invalid request params received",
            error: error
        });
    }
};