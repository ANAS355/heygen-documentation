import axios from 'axios';
import { CloseConnectionHandlerCallbacks, CreateNewSessionCallbacks, HandleICEApiCallbacks, HandleICEApiRequest, HandleICEApiResponse, NewSessionApiCallbacks, NewSessionApiRequest, NewSessionApiResponse, RepeatApiCallbacks, RepeatApiRequest, RepeatApiResponse, StartSessionApiCallbacks, StartSessionApiRequest, StartSessionApiResponse, StopSessionApiCallbacks, StopSessionApiRequest, StopSessionApiResponse } from './types';

export async function measureExecutionTime<T>(func: () => Promise<T>, functionName: string): Promise<T> {
    const startTime = Date.now();
    const result = await func();
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    console.log(`Time of ${functionName}: ${executionTime/1000} s`);
    return result;
  }

const heygen_API = {
    apiKey: 'YOUR_API_KEY',
    serverUrl: 'https://api.heygen.com',
};
const apiKey = heygen_API.apiKey;
const SERVER_URL = heygen_API.serverUrl;
const headers = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    'X-Api-Key': apiKey,
}

// New session
export async function newSession(
    requestData: NewSessionApiRequest,
    callbacks: NewSessionApiCallbacks = {
        onSuccess: (data) => { },
        onError: (error) => { },
        onFinally: () => { },
    }
): Promise<NewSessionApiResponse> {
    try {
        const response: NewSessionApiResponse = (await axios.post(`${SERVER_URL}/v1/streaming.new`, requestData, { headers })).data;
        console.log('newSession response', response)
        callbacks.onSuccess?.(response);
        return response;
    } catch (e: any) {
        console.error("newSession Error", e)
        callbacks.onError?.(e);
        throw e;
    } finally {
        callbacks.onFinally?.();
    }
}

// Start the session
export async function startSession(
    requestData: StartSessionApiRequest,
    callbacks: StartSessionApiCallbacks = {
        onSuccess: (data) => { },
        onError: (error) => { },
        onFinally: () => { },
    }
) {
    try {
        const response: StartSessionApiResponse = (await axios.post(`${SERVER_URL}/v1/streaming.start`, requestData, { headers })).data;
        callbacks.onSuccess?.(response);
    } catch (e) {
        console.log('startSession Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}

// Stop session
export async function stopSession(
    requestData: StopSessionApiRequest,
    callbacks: StopSessionApiCallbacks = {
        onSuccess: (data) => { },
        onError: (error) => { },
        onFinally: () => { },
    }
) {
    try {
        const response: StopSessionApiResponse = (await axios.post(`${SERVER_URL}/v1/streaming.stop`, requestData, { headers })).data;
        callbacks.onSuccess?.(response);
        console.log('stopSession response', response)
    } catch (e) {
        console.log('stopSession Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}

// Close Connection
export async function closeConnection(
    sessionInfo: NewSessionApiResponse | null,
    peerConnection: RTCPeerConnection | null,
    callbacks: CloseConnectionHandlerCallbacks = {
        onSuccess: () => { },
        onError: (error) => { },
        onFinally: () => { },
    }) {
    if (!sessionInfo || !peerConnection) {
        console.log('sessionInfo', sessionInfo)
        console.log('peerConnection', peerConnection)
        console.error('sessionInfo and peerConnection are required');
        callbacks.onError?.('sessionInfo is required');
        return;
    }
    try {
        await stopSession({ session_id: sessionInfo.data.session_id });
        peerConnection?.close();
        console.log('closeConnection Success');
        callbacks.onSuccess?.();
    } catch (e) {
        console.error('closeConnection Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}

// Submit the ICE candidate
export async function handleICE(
    requestData: HandleICEApiRequest,
    callbacks: HandleICEApiCallbacks = {
        onSuccess: (data) => { },
        onError: (error) => { },
        onFinally: () => { },
    }
) {
    try {
        const response: HandleICEApiResponse = (await axios.post(`${SERVER_URL}/v1/streaming.ice`, requestData, { headers })).data;
        callbacks.onSuccess?.(response);
    } catch (e) {
        console.log('ICE Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}

// Submit the ICE candidate
export async function repeat(
    requestData: RepeatApiRequest,
    callbacks: RepeatApiCallbacks = {
        onSuccess: (data) => { },
        onError: (error) => { },
        onFinally: () => { },
    }
) {
    try {
        console.log('repeat request', requestData)
        const response: RepeatApiResponse = await fetch(`${SERVER_URL}/v1/streaming.task`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestData)
        }).then(res => res.json());
        console.log('repeat response', response)
        // const response: RepeatApiResponse = await measureExecutionTime(async () => (await axios.post(`${SERVER_URL}/v1/streaming.task`, requestData, { headers })).data.data, 'repeat')
        // console.log('repeat response', response)
        callbacks.onSuccess?.(response);
    } catch (e) {
        console.log('repeat Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}

// Create a new session
export async function createNewSession(newSessionRequestData: NewSessionApiRequest, callbacks: CreateNewSessionCallbacks = {
    onicecandidate: (candidate) => { },
    oniceconnectionstatechange: (state) => { },
    ontrack: (event) => { },
    ondatachannel: (event) => { },
    onSessionCreated: (session) => { },
    onSuccess: (peerConnection) => { },
    onError: (error) => { },
    onFinally: () => { }
}) {
    try {
        // Call the new export interface to get the server's offer SDP and ICE server to create a new RTCPeerConnection
        const newSessionInfo = await newSession(newSessionRequestData, { onSuccess: callbacks.onSessionCreated });
        const { data: { sdp, ice_servers2: iceServers, session_id } } = newSessionInfo;
        const serverSdp = sdp;

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
        console.log('serverSdp', serverSdp)
        // Set server's SDP as remote description
        const remoteDescription = new RTCSessionDescription(serverSdp);
        await peerConnection.setRemoteDescription(remoteDescription);

        callbacks.onSuccess?.(peerConnection, newSessionInfo);
    } catch (e) {
        console.log('createNewSession Error', e)
        callbacks.onError?.(e);
    } finally {
        callbacks.onFinally?.();
    }
}
