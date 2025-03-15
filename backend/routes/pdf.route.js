import express from 'express'
import { getPDF, pdf } from '../controllers/pdf.controller.js'
import { ensureAuthenticated } from '../middleware/auth.middleware.js'

const pdf_router = express.Router()

pdf_router.post('/send-pdf', ensureAuthenticated, pdf)
pdf_router.get('/pdf-files', getPDF)

export default pdf_router

