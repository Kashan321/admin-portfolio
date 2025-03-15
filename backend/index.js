import express from 'express'
import { connectDb } from './database/db.js'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from "body-parser"
import router from './routes/auth.route.js'
import pdf_router from './routes/pdf.route.js'
dotenv.config()

const app = express()
const port = process.env.PORT || 4000
app.use(cors())
app.use(bodyParser.json({limit: '50mb'}))

app.use('/api/auth', router)
app.use('/api', pdf_router)

app.listen(port, (req, res) => {
    connectDb()
    console.log("APP IS RUNNING ON PORT", port)
})