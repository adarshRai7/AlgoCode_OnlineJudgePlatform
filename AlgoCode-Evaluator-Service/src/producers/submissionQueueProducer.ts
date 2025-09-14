import submissionQueue from "../queues/submissionQueue";
import { SubmissionPayload } from "../types/submissionPayload";

export default async function(payload: Record<string, SubmissionPayload>){
    await submissionQueue.add("SubmissionJob", payload);
    console.log("Successfully added a new submission job");
}