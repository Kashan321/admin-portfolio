import mongoose from 'mongoose';
import { Readable } from 'stream';
import { ObjectId } from 'mongodb'; // Import ObjectId directly from mongodb
import userModel from "../modals/user.modal.js";

// Create a connection to MongoDB
const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  // Initialize GridFS using the native MongoDB driver
  const db = conn.db;
  gfs = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'pdfs'
  });
});

export const pdf = async (req, res) => {
    const { pdf } = req.body;
  
    if (!pdf) {
      return res.status(400).json({
        success: false,
        message: "PDF data is required"
      });
    }
  
    if (!gfs) {
      return res.status(500).json({
        success: false,
        message: "GridFS is not initialized"
      });
    }
  
    try {
      // Delete the previous PDF file (if it exists)
      const previousFiles = await gfs.find({ filename: 'document.pdf' }).toArray();
  
      if (previousFiles && previousFiles.length > 0) {
        for (const file of previousFiles) {
          await gfs.delete(file._id); // Delete each previous file
        }
      }
  
      // Assuming the PDF data is base64 encoded
      const buffer = Buffer.from(pdf, "base64");
  
      // Create a readable stream from the buffer
      const readStream = new Readable();
      readStream.push(buffer);
      readStream.push(null);
  
      // Create a writable stream to GridFS
      const writeStream = gfs.openUploadStream('document.pdf', {
        contentType: 'application/pdf'
      });
  
      readStream.pipe(writeStream);
  
      writeStream.on('finish', () => {
        return res.status(200).json({
          success: true,
          message: "PDF saved successfully",
          fileId: writeStream.id
        });
      });
  
      writeStream.on('error', (err) => {
        console.error("Error saving PDF:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to save PDF"
        });
      });
  
    } catch (err) {
      console.error("Error uploading PDF:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload PDF"
      });
    }
  };

  export const getPDF = async (req, res) => {
    if (!gfs) {
      return res.status(500).json({
        success: false,
        message: "GridFS is not initialized"
      });
    }
  
    try {
      // Find the PDF file by filename
      const files = await gfs.find({ filename: 'document.pdf' }).toArray();
  
      if (!files || files.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No PDF file found"
        });
      }
  
      const file = files[0];
  
      // Set the appropriate content type for the response
      res.set('Content-Type', file.contentType);
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
  
      // Create a readable stream from GridFS and pipe it to the response
      const readStream = gfs.openDownloadStream(file._id);
      readStream.pipe(res);
  
      readStream.on('error', (err) => {
        console.error("Error streaming PDF:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to stream PDF"
        });
      });
  
    } catch (err) {
      console.error("Error retrieving PDF:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve PDF"
      });
    }
  };