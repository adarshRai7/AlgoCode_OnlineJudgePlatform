import { Job, Worker } from "bullmq";
import SampleJob from "../jobs/SampleJob";
import redisConnection from "../config/redisConfig";
import logger from "../config/loggerConfig";

export default function SampleWorker(queueName: string){
    new Worker(
        queueName,
        async (job: Job)=>{
            if(job.name === "SampleJob"){
                logger.info("Job picked is ", job.name);
                const sampleJobInstance = new SampleJob(job.data);
                sampleJobInstance.handler(job);
            }
        },{
            connection: redisConnection
        }
    );
}