const express = require('express');
const {createServer} = require('http');
const {Server} = require("socket.io");
const Redis = require('ioredis');
const bodyParser = require('body-parser');

const app = express();
const httpServer = createServer(app);
const redisCache = new Redis();
app.use(bodyParser.json());

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket)=>{
    console.log("A new user connected ", socket.id);

    socket.on('setUserId', (userId)=>{
        redisCache.set(userId, socket.id);
    });

    socket.on('getConnectionId', async (userId)=>{
        const connectionId = await redisCache.get(userId);
        socket.emit('connectionId', connectionId);
        const allConnections = await redisCache.keys('*');
        // console.log(allConnections);
    });
});

app.post('/sendPayload', async (req,res) => {
    const {userId, payload} = req.body;
    	if(!userId || !payload){
        	res.status(400).send('Invalid request');
    	}
    	const socketId = await redisCache.get(userId);
    	if(socketId){
        	io.to(socketId).emit('submissionPayloadResponse', payload);
        	res.send("Payload sent successfully!");
    	}else{
        	res.status(404).send("User not connected");
    	}
	});

httpServer.listen(3003, ()=>{
    console.log("Server is up on port 3003");
});