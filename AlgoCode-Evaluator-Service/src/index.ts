import express, { Express } from 'express';
import serverConfig from './config/serverConfig';
import apiRouter from './routes';
import SubmissionWorker from './workers/submissionWorker';
import bullBoardAdapter from './config/bullBoardConfig';

import bodyParser from "body-parser";
import { submission_queue } from './utils/constants';

const app: Express = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use('/api', apiRouter);
app.use('/ui', bullBoardAdapter.getRouter());


app.listen(serverConfig.PORT, ()=>{
    console.log(`Server started at *:${serverConfig.PORT}`);
    console.log(`BullBoard dashboard up at http://localhost:${serverConfig.PORT}/ui`)
    SubmissionWorker(submission_queue);
});
