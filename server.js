import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import bodyParser from 'body-parser';
import mailRouter from './src/api/routes/sendmail.routes.js';
import { setIO } from './src/config/socket.config.js';

dotenv.config()

const app = express()
// const port = process.env.PORT || 5000

const server = http.createServer(app)

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:5000', 'https://pipopa.id', process.env.BE_SITE],
    default: 'http://localhost:3000'
}

app.use(cors(corsOptions))
app.use(bodyParser.json())

app.use(mailRouter)

app.get('/api', (req, res) => {
  res.send('Backend app 1.0')
})

app.get('/api/checkhealth', (req, res) => {
  res.send('Backend 1.0 OK')
})

let io = setIO(server)

io.on('connection', socket => {
    console.log(socket.id, "ID socket ")

})

server.listen(process.env.PORT || 5000, () => {
  console.log(`Your app running on port http://localhost:${process.env.PORT}`);
});