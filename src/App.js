import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./App.scss"; // Import SCSS file for styling
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWaveSquare } from "@fortawesome/free-solid-svg-icons";
const App = () => {
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(300);
  const [amplitude, setAmplitude] = useState(100);
  const [frequency, setFrequency] = useState(0.02);
  const [circlePos, setCirclePos] = useState({ x: 0, y: 0 });
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoSrc, setVideoSrc] = useState("");

  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const circleRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const isRecordingRef = useRef(false);

 
  const generateSineWavePath = () => {
    let pathData = "";
    for (let x = 0; x < width; x++) {
      const y = amplitude * Math.sin(frequency * x) + height / 2;
      pathData += x === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    }
    return pathData;
  };

  
  const animateCircle = (time) => {
    const x = (time / 10) % width;
    const y = amplitude * Math.sin(frequency * x) + height / 2;
  
    setCirclePos({ x, y });
  
    // Draw to canvas in sync with animation
    drawCanvas();
  
    animationFrameIdRef.current = requestAnimationFrame(animateCircle);
  };

  useEffect(() => {
    animationFrameIdRef.current = requestAnimationFrame(animateCircle);
    return () => cancelAnimationFrame(animationFrameIdRef.current);
  }, [width, height, amplitude, frequency]);

 
  const drawCanvas = () => {
    const svgElement = svgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

 
const startRecording = async () => {
  isRecordingRef.current = true;
  setRecordedChunks([]);

  const canvas = canvasRef.current;
  if (!canvas) {
    console.error("Canvas reference is null");
    return;
  }

  const stream = canvas.captureStream();
  if (!stream) {
    console.error("Failed to capture stream from canvas");
    return;
  }

  const mediaRec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  mediaRecorderRef.current = mediaRec;

  mediaRec.ondataavailable = (e) => {
    if (e.data.size > 0) {
      setRecordedChunks((prev) => [...prev, e.data]);
    }
  };

  mediaRec.onerror = (e) => {
    console.error("MediaRecorder error:", e);
  };

  mediaRec.onstart = () => {
    console.log("Recording started");
  };


  requestAnimationFrame(() => {
    mediaRec.start(0); 
  });
};


const stopRecording = () => {
  isRecordingRef.current = false;

  const mediaRecorder = mediaRecorderRef.current;
  if (mediaRecorder) {
    mediaRecorder.stop();

    mediaRecorder.onstop = () => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: "video/webm;codecs=vp9" });
        const videoURL = URL.createObjectURL(blob);
        setVideoSrc(videoURL);
      }
    };
  }
};


  return (
    <div className="sine-wave-container">
      {/* Header with logo */}
      <header className="header">
        <motion.div
          className="logo"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src="SoundWave.png" alt="Logo" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           <FontAwesomeIcon icon={faWaveSquare} style={{ marginRight: "10px" }} />
          Sine Wave Line Chart Generator
        </motion.h1>
      </header>

      <div className="controls">
        <label>
          Width:
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
        <label>
          Amplitude:
          <input
            type="number"
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
          />
        </label>
        <label>
          Frequency:
          <input
            type="number"
            step="0.01"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
        </label>
      </div>

      <div>
        <button onClick={startRecording} disabled={isRecordingRef.current}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecordingRef.current}>
          Stop Recording
        </button>
      </div>

     
      <canvas ref={canvasRef} width={width} height={height} style={{ display: "none" }}></canvas>

      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: "1px solid black", backgroundColor: "grey" }}
      >
       
        <rect x="0" y="0" width={width} height={height} fill="grey" />

       
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="black" strokeWidth="2" />
        <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="black" strokeWidth="2" />

       
        <path
          d={generateSineWavePath()}
          stroke="blue"
          fill="transparent"
          strokeWidth="2"
        />
       
        <circle
          ref={circleRef}
          cx={circlePos.x}
          cy={circlePos.y}
          r="10"
          fill="red"
          transition={{
            duration: 1, 
            repeat: Infinity, 
          }}
        />
      </svg>

   
      {videoSrc && (
        <div>
          <h2>Recorded Video:</h2>
          <video controls src={videoSrc} width={width} height={height}></video>
        </div>
      )}
    </div>
  );
};

export default App;
