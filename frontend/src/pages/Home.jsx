import { useState, useRef, useContext } from "react";
import axios from "axios";
import { auth_context } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";

function Home() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
    const fileInputRef = useRef(null);
    const { token } = useContext(auth_context);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;

        // Reset states
        setUploadStatus({ type: null, message: "" });

        if (!file) {
            setSelectedFile(null);
            setPreviewUrl(null);
            return;
        }

        // Validate file type
        if (file.type !== "application/pdf") {
            setUploadStatus({
                type: "error",
                message: "Please select a valid PDF file",
            });
            return;
        }

        setSelectedFile(file);

        // Create a preview URL for the PDF
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadStatus({ type: null, message: "" });

        try {
            // Convert PDF file to base64
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);

            reader.onloadend = async () => {
                const base64String = reader.result.split(",")[1];

                // Make a POST request to upload the PDF
                const response = await axios.post(
                    `${API_BASE_URL}/send-pdf`,
                    { pdf: base64String },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
console.log("RESPONSE", response)
                if (response.status === 200) {
                    setUploadStatus({
                        type: "success",
                        message: `File "${selectedFile.name}" uploaded successfully!`,
                    });

                    // Reset the form after successful upload
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                } else {
                    throw new Error("Upload failed");
                }
            };
        } catch (error) {
            setUploadStatus({
                type: "error",
                message: "Failed to upload file. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files?.[0] || null;
        if (!file) return;

        // Update the file input value
        if (fileInputRef.current) {
            // Create a DataTransfer object to set the files property
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;

            // Trigger the onChange event manually
            const event = new Event("change", { bubbles: true });
            fileInputRef.current.dispatchEvent(event);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">PDF File Upload</h1>

                {/* File Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center
            ${selectedFile ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"}
            hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-upload"
                        ref={fileInputRef}
                    />

                    {!selectedFile ? (
                        <div>
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <p className="mt-2 text-gray-600">Drag and drop your PDF here, or</p>
                            <label
                                htmlFor="pdf-upload"
                                className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors duration-200"
                            >
                                Browse Files
                            </label>
                            <p className="mt-1 text-sm text-gray-500">Only PDF files are supported</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center flex-col">
                            <svg
                                className="h-10 w-10 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="mt-2 text-xs text-red-500 hover:text-red-700"
                            >
                                Remove file
                            </button>
                        </div>
                    )}
                </div>

                {/* PDF Preview */}
                {previewUrl && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Preview</h2>
                        <div className="border rounded-lg overflow-hidden h-96">
                            <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                        </div>
                    </div>
                )}

                {/* Upload Status */}
                {uploadStatus.type && (
                    <div
                        className={`mb-4 p-3 rounded-md ${uploadStatus.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                    >
                        {uploadStatus.message}
                    </div>
                )}

                {/* Upload Button */}
                {selectedFile && (
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading}
                        className={`w-full py-3 px-4 rounded-md font-medium text-white
              ${isUploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"}
              transition-colors duration-200 flex items-center justify-center`}
                    >
                        {isUploading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            "Upload PDF"
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default Home;