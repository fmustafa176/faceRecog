import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./styles.css";

function App() {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [userName, setUserName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [capturedImages, setCapturedImages] = useState([]);
  const [registrationStep, setRegistrationStep] = useState(1);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImages(prev => [...prev, imageSrc]);
    setMessage(`✅ Image ${capturedImages.length + 1} captured!`);
  };

  const captureForAttendance = async () => {
    setLoading(true);
    setMessage("👀 Scanning face...");
    
    const imageSrc = webcamRef.current.getScreenshot();
    
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post("http://localhost:8000/attendance", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data.attendance_marked) {
        setMessage(`✅ Attendance marked for ${res.data.student.name}! (Confidence: ${(res.data.confidence * 100).toFixed(1)}%)`);
      } else {
        setMessage("❌ No match found. Please register first.");
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      setMessage("❌ Error connecting to server. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (capturedImages.length < 3) {
      setMessage("❌ Please capture at least 3 images for registration");
      return;
    }

    setLoading(true);
    setMessage("📸 Registering...");

    try {
      const formData = new FormData();
      formData.append("name", userName);
      formData.append("student_id", studentId);

      for (let i = 0; i < capturedImages.length; i++) {
        const response = await fetch(capturedImages[i]);
        const blob = await response.blob();
        const file = new File([blob], `face_${i}.jpg`, { type: "image/jpeg" });
        formData.append("images", file);
      }

      const res = await axios.post("http://localhost:8000/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000
      });

      if (res.data.success) {
        setMessage(`✅ ${res.data.message}`);
        setRegistering(false);
        setRegistrationStep(1);
        setUserName("");
        setStudentId("");
        setCapturedImages([]);
      } else {
        setMessage(`❌ ${res.data.detail || 'Registration failed'}`);
      }
    } catch (error) {
      console.error("Registration Error:", error);
      if (error.response) {
        setMessage(`❌ Registration failed: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        setMessage("❌ Cannot connect to server. Make sure backend is running on port 8000.");
      } else {
        setMessage(`❌ Registration error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const startRegistration = () => {
    setRegistering(true);
    setRegistrationStep(1);
    setCapturedImages([]);
    setMessage("📝 Enter your details to start registration");
  };

  const cancelRegistration = () => {
    setRegistering(false);
    setRegistrationStep(1);
    setUserName("");
    setStudentId("");
    setCapturedImages([]);
    setMessage("");
  };

  return (
    <div className="app-container">
      <div className="main-card">
        {/* Header */}
        <div className="app-header">
          <h1>🎯 Face Recognition Attendance</h1>
          <p>Secure and automated attendance system</p>
        </div>

        {/* Camera Section */}
        <div className="camera-container">
          <div className="webcam-wrapper">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={400}
              height={300}
            />
          </div>
        </div>

        {/* Controls Section */}
        <div className="controls-container">
          {!registering ? (
            // Attendance Mode
            <div className="button-group">
              <button
                onClick={captureForAttendance}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    Processing...
                  </>
                ) : (
                  "📷 Mark Attendance"
                )}
              </button>
              <button
                onClick={startRegistration}
                disabled={loading}
                className="btn btn-secondary"
              >
                👤 Register New Student
              </button>
            </div>
          ) : (
            // Registration Mode
            <div className="registration-form">
              {/* Step Indicator */}
              <div className="step-indicator">
                <div className={`step ${registrationStep >= 1 ? 'active' : ''} ${registrationStep > 1 ? 'completed' : ''}`}>
                  1
                </div>
                <div className={`step ${registrationStep >= 2 ? 'active' : ''}`}>
                  2
                </div>
              </div>

              {registrationStep === 1 ? (
                // Step 1: Enter Details
                <div>
                  <h3>Step 1: Enter Your Details</h3>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Student ID</label>
                    <input
                      type="text"
                      placeholder="Enter your student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="button-group">
                    <button
                      onClick={() => setRegistrationStep(2)}
                      disabled={!userName || !studentId}
                      className="btn btn-warning"
                    >
                      Next: Capture Images →
                    </button>
                    <button
                      onClick={cancelRegistration}
                      className="btn btn-danger"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Capture Images
                <div>
                  <h3>Step 2: Capture Face Images</h3>
                  <p>Capture multiple images from different angles for better recognition</p>
                  
                  {/* Progress Bar */}
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(capturedImages.length / 10) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="capture-count">
                    {capturedImages.length} / 10 images captured
                  </div>

                  <div className="button-group">
                    <button
                      onClick={captureImage}
                      disabled={capturedImages.length >= 10}
                      className="btn btn-secondary"
                    >
                      📸 Capture Image ({capturedImages.length}/10)
                    </button>
                    
                    <button
                      onClick={registerUser}
                      disabled={capturedImages.length < 3 || loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="loading-dots">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                          Registering...
                        </>
                      ) : (
                        `✅ Complete Registration`
                      )}
                    </button>
                    
                    <button
                      onClick={() => setRegistrationStep(1)}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', color: 'white' }}
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Image Preview */}
                  {capturedImages.length > 0 && (
                    <div className="image-preview">
                      {capturedImages.map((img, index) => (
                        <img 
                          key={index} 
                          src={img} 
                          alt={`Capture ${index + 1}`}
                          className="preview-image"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`message-container ${
              message.includes("✅") ? "message-success" : 
              message.includes("❌") ? "message-error" : ""
            }`}>
              <p className="message-text">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;