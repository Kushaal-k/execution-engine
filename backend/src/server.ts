import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import connectDB from "./db/config.js";
import dotenv from "dotenv";
import redis from "./redis.js";
import type { IExecutionResponse, IInputCodeRequest } from "./types/types.js"
import {ResponseModel} from "./models/response.model.js"

dotenv.config()
connectDB();

const app = express();
app.use(express.json());
app.use(cors())

const QUEUE_KEY = 'jobs:pending'

app.post('/api/response', async (req: Request<{}, {}, IInputCodeRequest>, res: Response) => {
    const {code, language, stdin} = req.body;
    
    try {
        const job = await ResponseModel.create({
                        code,
                        ...(stdin !== undefined && {stdin}),
                        language,
                    })
        
        const job_id = job._id.toString();
        
        await redis.lpush(
            QUEUE_KEY, 
            JSON.stringify({id: job_id})
        )  

        return res.status(200).json({ "status": `${job.status}`, jobId: job_id })
    } catch (error) {
        return res.status(500).json({ "status":  "Failed"})
    }

    

    // return res
    
    // const response: IExecutionResponse = {
    //         stdout, 
    //         error: stderr,
    //         executionTime: Number(end - start) / 1_000_000,
    //         memoryUsed: 0,
    //         exitCode: exitCode as number | null
    //     }
    
    //             res.status(200).json(response);    

    //             res.status(200).json({
    //                         stdout: "",
    //                         error: "Error while processing code!",
    //                         executionTime: 0,
    //                         memoryUsed: 0,
    //                         exitCode: null
    //                     })
})

app.get("/api/response/:id", async (req: Request, res: Response<IExecutionResponse>) => {
    const job_id = req.params.id;

    try {
        const job = await ResponseModel.findById(job_id);

        if(!job){
            return res.status(500)
        }
        res
        .status(200)
        .json({
            status: job.status || "Pending",
            stdout: job.stdout || "",
            error: job.error || "",
            executionTime: job.executionTime || 0,
            memoryUsed: job.memoryUsed || 0,
            exitCode: job.exitCode || 1
        })

        
    } catch (error) {
        if(error instanceof Error){
            res
            .status(500)
            .json({
                status: "Failed",
                stdout: "",
                error: error.message,
                executionTime: 0,
                memoryUsed: 0,
                exitCode: 1
            })
        }
    }
})

app.listen(3000, () => {
    console.log(`App is running at http://localhost:3000`)
})