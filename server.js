import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import mailRouter from './src/api/routes/sendmail.routes.js';

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:5000', 'https://pipopa.id'],
    default: 'http://localhost:3000'
}

app.use(cors(corsOptions))
app.use(bodyParser.json())

app.use(mailRouter)

app.get('/api/checkhealth', (req, res) => {
  res.send('Backend 1.0 OK')
})

app.listen(port, () => {
  console.log(`Pipopa backend listening on port ${port}`)
})