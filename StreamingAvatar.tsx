"use client"
import React, { useEffect, useRef } from 'react';


const processImage = (imageData: ImageData) => {
    const { data, width, height } = imageData;
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const alpha = data[i + 3];

        // Check if the pixel is green
        if (green > 90 && red < 90 && blue < 90) {
            data[i + 3] = 0; // Set the alpha channel to 0
        }
    }

    return imageData;
};


function StreamingAvatar({ stream }: { stream: MediaStream | null }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        try {
            if (!stream || !videoRef.current || !canvasRef.current) return
            const video = videoRef.current;
            const canvas = canvasRef.current;
            video.style.display = 'none';
            const context = canvas.getContext('2d', { willReadFrequently: true });
            video.srcObject = stream;
            const processFrame = () => {
                try {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
                    if (imageData) {
                        const processedImageData = processImage(imageData);
                        context?.putImageData(processedImageData, 0, 0);
                    }
                    requestAnimationFrame(processFrame);
                } catch (e) { console.log(e); }
            };
            video.addEventListener('loadedmetadata', processFrame);
            return () => {
                video.srcObject = null;
                video.removeEventListener('loadedmetadata', processFrame);
            };
        } catch (e) { console.log(e) }
    }, [stream]);
    return (
        <>
            
                {stream && (<div className='w-full h-full z-10 flex justify-center items-center'>
                    <video autoPlay ref={videoRef} className="max-w-full max-h-full" />
                    <canvas ref={canvasRef} className="max-w-full max-h-full" />
                </div>)}
        </>
    );
}

export default StreamingAvatar