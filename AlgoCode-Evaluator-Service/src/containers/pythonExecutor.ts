import createContainer from "./containerFactory";
import {PYTHON_IMAGE} from "../utils/constants"
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";
import CodeExecutorStrategy, { ExecutionResponse } from "../types/codeExecutorStrategy";

class PythonExecutor implements CodeExecutorStrategy {

    async execute(code: string, inputTestCase: string, outputTestCase:string): Promise<ExecutionResponse> {
        console.log("🚀 ~ runPython ~ inputTestCase:", inputTestCase, outputTestCase)
        const rawBuffer: Buffer[] = [];

        await pullImage(PYTHON_IMAGE);

        console.log("Initializing a new python docker container");

        const runCommand = `echo '${code.replace(/'/g, `'\\"`)}' > test.py && echo '${inputTestCase.replace(/'/g, `'\\"`)}' | python3 test.py`;
        const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
            '/bin/sh', 
            '-c',
            runCommand
        ]);
        
        await pythonDockerContainer.start();

        console.log("Started the docker container");

        const loggerStream = await pythonDockerContainer.logs({
            stdout: true,
            stderr:true,
            timestamps: false,
            follow: true,
        });

        loggerStream.on('data', (chunk)=>{
            rawBuffer.push(chunk);
        });

        try{
            const codeResponse: string = await this.fetchDecodedStream(loggerStream, rawBuffer);
            if(codeResponse.trim() === outputTestCase.trim()){
                return { output: codeResponse, status: "SUCCESS" }
            }else {
                return { output: codeResponse, status: 'WA'}
            }
        }catch (error){
            if(error === "TLE"){
                await pythonDockerContainer.kill();
            }
            return {
                output: error as string,
                status: "ERROR"
            }
        } finally{
            await pythonDockerContainer.remove();
        }

        
    }

    fetchDecodedStream(loggerStream: NodeJS.ReadableStream, rawBuffer: Buffer[]): Promise<string>{
        return new Promise((res, rej)=>{

            const timeout = setTimeout(()=>{
                console.log("Timeout called");
                rej('TLE');
            }, 2000);

            loggerStream.on('end', ()=>{
                clearTimeout(timeout);
                console.log(rawBuffer);
                const completeBuffer = Buffer.concat(rawBuffer);
                const decodedStream = decodeDockerStream(completeBuffer);
                console.log(decodedStream);
                if(decodedStream.stdout){
                    res(decodedStream.stdout);
                }else {
                    rej(decodedStream.stderr)
                }
            });
        });
    }
    
}

export default PythonExecutor;