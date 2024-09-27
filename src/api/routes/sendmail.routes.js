import express from 'express'
import { sendmailHandler } from '../controllers/sendmail.controller.js'

const router = express.Router()

router.post('/api/sendmail', sendmailHandler)

export default router