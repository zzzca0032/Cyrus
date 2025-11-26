import React, { useEffect, useRef } from 'react';

interface WebcamFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void;
}

export const WebcamFeed: React.FC<WebcamFeedProps> = ({ onVideoReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60 }
          },
          audio: false,
        });

        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          if (videoRef.current) {
            onVideoReady(videoRef.current);
          }
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 opacity-60 mix-blend-screen filter contrast-125 brightness-75 grayscale-[0.3]"
      autoPlay
      playsInline
      muted
    />
  );
};
