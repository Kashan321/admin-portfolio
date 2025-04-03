import mongoose from 'mongoose';
import { Readable } from 'stream';
import { ObjectId } from 'mongodb';

// GridFS instance
let gfs;
let isGridFSInitialized = false;

// Initialize GridFS when MongoDB connection is ready
const initGridFS = () => {
  if (!isGridFSInitialized && mongoose.connection.readyState === 1) {
    const db = mongoose.connection.db;
    gfs = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'pdfs'
    });
    isGridFSInitialized = true;
    console.log('GridFS initialized successfully');
  }
};

// Event handlers for MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected - initializing GridFS');
  initGridFS();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  isGridFSInitialized = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isGridFSInitialized = false;
});

/**
 * Upload PDF to GridFS
 */
export const uploadPDF = async (req, res) => {
  try {
    // Initialize GridFS if not already done
    initGridFS();
    
    if (!isGridFSInitialized || !gfs) {
      return res.status(500).json({
        success: false,
        message: "Database connection not ready"
      });
    }

    const { pdf } = req.body;

    if (!pdf) {
      return res.status(400).json({
        success: false,
        message: "PDF data is required"
      });
    }

    // Delete previous PDF files if they exist
    const previousFiles = await gfs.find({ filename: 'document.pdf' }).toArray();

    if (previousFiles.length > 0) {
      await Promise.all(previousFiles.map(file => 
        gfs.delete(file._id)
      ));
      console.log(`Deleted ${previousFiles.length} previous PDF file(s)`);
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(pdf, "base64");
    const readStream = new Readable();
    readStream.push(buffer);
    readStream.push(null);

    // Create upload stream
    const uploadStream = gfs.openUploadStream('document.pdf', {
      contentType: 'application/pdf'
    });

    // Pipe the read stream to GridFS
    readStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      console.log('PDF saved successfully');
      res.status(200).json({
        success: true,
        message: "PDF saved successfully",
        fileId: uploadStream.id
      });
    });

    uploadStream.on('error', (err) => {
      console.error("Error saving PDF:", err);
      res.status(500).json({
        success: false,
        message: "Failed to save PDF"
      });
    });

  } catch (err) {
    console.error("Error in uploadPDF:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get PDF from GridFS
 */
export const getPDF = async (req, res) => {
  try {
    // Initialize GridFS if not already done
    initGridFS();
    
    if (!isGridFSInitialized || !gfs) {
      return res.status(500).json({
        success: false,
        message: "Database connection not ready"
      });
    }

    // Find the most recent PDF file
    const files = await gfs.find({ filename: 'document.pdf' })
      .sort({ uploadDate: -1 })
      .limit(1)
      .toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No PDF file found"
      });
    }

    const file = files[0];
    
    // Set response headers
    res.set({
      'Content-Type': file.contentType || 'application/pdf',
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Length': file.length
    });

    // Create download stream and pipe to response
    const downloadStream = gfs.openDownloadStream(file._id);
    
    downloadStream.on('error', (err) => {
      console.error("Error streaming PDF:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to stream PDF"
        });
      }
    });

    downloadStream.pipe(res);

  } catch (err) {
    console.error("Error in getPDF:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Delete PDF from GridFS
 */
export const deletePDF = async (req, res) => {
  try {
    // Initialize GridFS if not already done
    initGridFS();
    
    if (!isGridFSInitialized || !gfs) {
      return res.status(500).json({
        success: false,
        message: "Database connection not ready"
      });
    }

    const files = await gfs.find({ filename: 'document.pdf' }).toArray();

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No PDF file found to delete"
      });
    }

    await Promise.all(files.map(file => gfs.delete(file._id)));
    
    console.log(`Deleted ${files.length} PDF file(s)`);
    return res.status(200).json({
      success: true,
      message: `Deleted ${files.length} PDF file(s)`
    });

  } catch (err) {
    console.error("Error in deletePDF:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete PDF"
    });
  }
};