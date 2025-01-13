# Heygen API Documentation

Welcome to the **Heygen API** documentation! This guide provides a comprehensive overview of how to use the Heygen API, including setup, authentication, key endpoints, and sample code snippets.

## Important

**This code is meant for closed POC presentation and testing. Therefore no security is implemented. So it is a must to refactor the APIs calls into a backend where the HeyGen API_KEY is safe.**

## Table of Contents

* [Introduction](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#introduction)
* [Prerequisites](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#prerequisites)
* [Authentication](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#authentication)
* [API Endpoints](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#api-endpoints)
* [Request and Response Formats](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#request-and-response-formats)
* [Error Handling](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#error-handling)
* [Rate Limits](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#rate-limits)
* [Examples](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#examples)
* [Support](https://chatgpt.com/c/6784a303-b750-8007-a365-fe883a56b6e9#support)

## Introduction

The Heygen API allows developers to integrate Heygen's features into their applications. These features include generating text-to-video content, customizing avatars, and managing media resources programmatically.

## Prerequisites

Before using the API, ensure you have the following:

1. A Heygen account.
2. An API key, which can be obtained from your Heygen dashboard.
3. Basic understanding of RESTful APIs.
4. A tool for testing API requests, such as Postman or cURL.

## Authentication

The Heygen API uses an API key for authentication. You must include your API key in the request headers for every request.

### Header Format

```typescript
{
    'Content-Type': 'application/json',
    'accept': 'application/json',
    'X-Api-Key': `YOUR_API_KEY`,
}
```

Replace `YOUR_API_KEY` with your actual API key.

## API Endpoints

### Base URL

All requests are made to the base URL:

```
https://api.heygen.com/v1
```

### 1. Creating A New Streaming Session

**Endpoint:** /streaming.new

**Method:** `POST`

**Description:** In order to start a streaming avatar you need to start a new session where you choose the `avatar_name` which is the avatar id. the `avatar_name` decides the UI of the avatar (a man in a suit, a middle east woman, ...etc). The `quality` decides the quality of the stream similar to when watching any streaming service (twitch, youtube, ...etc). The `voice_id` decides the voice of the avatar and it is independent from the avatar UI meaning you can have the voice of a woman on a man's UI.

#### Request Body

```typescript
{
    quality: "high" | "medium" | "low";
    avatar_name?: string;
    voice?: {
        voice_id?: string;
        rate?: number;
    };
}
```

#### Response Format

```typescript
{
    code: number;
    message: string;
    data: {
        ice_servers2: ICEServer[];
        sdp: RTCSessionDescriptionInit;
        session_id: string;
    };
}

ICEServer {
    urls: string;
    username: string;
    credential: string;
}
```

### 2. Handling ICE Candidate

**Endpoint:** `/streaming.ice`

**Method:** `POST`

**Description:** This is needed when recivign the ICE candidate when starting the RTC connection. the `session_id` is optained from the response of the `Creating A New Streaming Session` API.

#### Request Body

```typescript
{
    session_id: string;
    candidate: Object;
}
```

#### Response Format

```typescript
{
    status: string;
}
```

### 3. Start Session

**Endpoint:** `/streaming.start`

**Method:** `POST`

**Description:** This API is used to start the stream once everything is ready and connected.

#### Request Body

```typescript
{
    session_id: string;
    sdp: RTCSessionDescriptionInit;
}
```

#### Response Format

```typescript
{
    status: string;
}
```

### 4. Repeat Task

**Endpoint:** `/streaming.task`

**Method:** `POST`

**Description:** This API is used when everything is connected and the session is started. This tells the avatar to repeat a certain sentance through the `text` parameter. The `session_id` is the one obtained from the `Creating A New Streaming Session` API. The API returns `duration_ms` which is the time it will take the avatar to finish repeating te sentance in ms.

#### Request Body

```typescript
{
    session_id: string;
    text: string;
    task_mode: "sync" | "Async";
    task_type: "repeat" | "chat";
}
```

#### Response Format

```typescript
{
    duration_ms: number;
}
```

## Connection Process Steps

### 1. Create New Session

Get the `sdp`, `seesion_id`, `iceServers` from the `Creating A New Streaming Session` API.

### 2. Start RTC Connection

Start an `RTCPeerConnection` using the `iceServers.`

```typescript
// Create a new RTCPeerConnection
const peerConnection = new RTCPeerConnection({ iceServers });
```

### 3. Handle Candidate

Run the `Handling ICE Candidate` API when recieving the ICE candidate from the peerConnection.

```typescript
peerConnection.onicecandidate = ({ candidate }) => {
	if (!candidate) return;
	console.log('Received ICE candidate:', candidate);
	const handleICERequestData: HandleICEApiRequest = { session_id, candidate: candidate.toJSON() };
	handleICE(handleICERequestData);
	callbacks.onicecandidate?.(candidate);
};
```

### 4. Receive The Streaming Object

When everything is ready you should recieve the straming object as a `track`

```typescript
peerConnection.ontrack = (event) => {
            console.log('Received the track');
            if (event.track.kind === 'audio' || event.track.kind === 'video') {
                callbacks.ontrack?.(event);
            }
        };
```

### 5. Starting the Session

Once everything is ready the stream will be frozen until you call the API `Start Session` with the `session_id` obtained from `Creating A New Streaming Session` API.

**Full Connection Code**

Here is a `TypeScript` code that shows how to handle the RTC connection for the streaming avatar. the entire code can be found in the `utils.ts` file. The callbacks are used to handle the improtant events. The `ontrack` callback is the most important and it handles the steaming object that will be later used when rendaring the avatar. The `handleICE` function is just the `Handling ICE Candidate` API and it must be called once you rescive a candidate.

```typescript
# the following "serverSdp", "session_id", "iceServers" are obtained from the create new streaming session API
const serverSdp 
const session_id
const iceServers

// Create a new RTCPeerConnection
const peerConnection = new RTCPeerConnection({ iceServers });
// When ICE candidate is available, send it to the server
peerConnection.onicecandidate = ({ candidate }) => {
	if (!candidate) return;
	console.log('Received ICE candidate:', candidate);
	const handleICERequestData: HandleICEApiRequest = { session_id, candidate: candidate.toJSON() };
	handleICE(handleICERequestData);
	callbacks.onicecandidate?.(candidate);
};

// When ICE connection state changes, display the new state
peerConnection.oniceconnectionstatechange = (event) => {
	console.log('ICE connection state changed to', peerConnection.iceConnectionState);
	callbacks.oniceconnectionstatechange?.(peerConnection.iceConnectionState);
};
// When audio and video streams are received, display them in the video element
peerConnection.ontrack = (event) => {
	console.log('Received the track');
	if (event.track.kind === 'audio' || event.track.kind === 'video') {
		callbacks.ontrack?.(event);
	}
};

// When receiving a message, display it in the status element
peerConnection.ondatachannel = (event) => {
	console.log('Received a data channel');
	callbacks.ondatachannel?.(event);
};
// Set server's SDP as remote description
const remoteDescription = new RTCSessionDescription(serverSdp);
await peerConnection.setRemoteDescription(remoteDescription)
```

### 6. Handling The Streaming Object In React

Here is a  `React` `TypeScript` Component Code for rendering the streaming object.

```typescript
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
```

Originaly the streaming avatar comes with green screen. we can utilize that to prcess the stream to have any background color we want. However, wit is simpler to just remove the background of the avatar and then use CSS to decide the background. This way there will be more flexablility styling the avatar. The function `processImage` processes each iamge coming from the stream and for each pixel it checks if the pixel is green then sets it `alpha` to `0` so that it is transparent. Ofcourse you can change it by setting the `red` that is `data[i]`, the `green` that is `data[i+1]`, the `blue` that is `data[i+2]` or the `alpha` that is `data[i+3]` which is the transparency.

```typescript
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
```

## Codes

In `use-streaming-avatar.tsx` you will find a React Hook that handles everything.

In `StreamingAvatar.tsx` you will find the React Component that redners the stream.

In `utils.ts` you will find the APIs functions with their callbacks.

In `types.ts` yu will find the types for each API and thier callbacks.
