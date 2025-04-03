import mongoose from 'mongoose';
import { Readable } from 'stream';
import userModel from "../modals/user.modal.js";

// Define the schema for storing PDFs
const pdfSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
}, { timestamps: true });

// Create the PDF model
const PDF = mongoose.model('PDF', pdfSchema);

export const pdf = async (req, res) => {
  const { pdf } = req.body;

  if (!pdf) {
    return res.status(400).json({
      success: false,
      message: "PDF data is required"
    });
  }

  try {
    // Assuming the PDF data is base64 encoded
    const buffer = Buffer.from(pdf, "base64");

    // Delete the previous PDF file (if it exists)
    await PDF.deleteMany({ filename: 'document.pdf' });

    // Create a new PDF document
    const newPDF = new PDF({
      filename: 'document.pdf',
      contentType: 'application/pdf',
      data: buffer
    });

    // Save the new PDF document
    await newPDF.save();

    return res.status(200).json({
      success: true,
      message: "PDF saved successfully",
      fileId: newPDF._id
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
  try {
    // Find the PDF file by filename
    const file = await PDF.findOne({ filename: 'document.pdf' });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "No PDF file found"
      });
    }

    // Set the appropriate content type for the response
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    // Create a readable stream from the buffer and pipe it to the response
    const readStream = new Readable();
    readStream.push(file.data);
    readStream.push(null);
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