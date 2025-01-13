export interface NewSessionApiRequest {
    quality: "high" | "medium" | "low";
    avatar_name?: string;
    voice?: {
        voice_id?: string;
        rate?: number;
    };
}

export interface ICEServer {
    urls: string;
    username: string;
    credential: string;
}

export interface NewSessionApiResponse {
    code: number;
    message: string;
    data: {
        ice_servers2: ICEServer[];
        sdp: RTCSessionDescriptionInit;
        session_id: string;
    };
}

export interface NewSessionApiCallbacks {
    onSuccess?: (data: NewSessionApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}



export interface StartSessionApiRequest {
    session_id: string;
    sdp: RTCSessionDescriptionInit;
}

export interface StartSessionApiResponse {
    status: string;
}

export interface StartSessionApiCallbacks {
    onSuccess?: (data: StartSessionApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}
export interface StopSessionApiRequest {
    session_id: string;
}

export interface StopSessionApiResponse {
    status: string;
}

export interface StopSessionApiCallbacks {
    onSuccess?: (data: StopSessionApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}

export interface CloseConnectionHandlerCallbacks {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}
export interface HandleICEApiRequest {
    session_id: string;
    candidate: Object;
}

export interface HandleICEApiResponse {
    status: string;
}

export interface HandleICEApiCallbacks {
    onSuccess?: (data: HandleICEApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}

export interface RepeatApiRequest {
    session_id: string;
    text: string;
    task_mode: "sync" | "Async";
    task_type: "repeat" | "chat";
}

export interface RepeatApiResponse {
    duration_ms: number;
}

export interface RepeatApiCallbacks {
    onSuccess?: (data: RepeatApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}

export interface CreateNewSessionCallbacks {
    onicecandidate?: (candidate: RTCIceCandidate) => void;
    oniceconnectionstatechange?: (state: RTCIceConnectionState) => void;
    ontrack?: (event: RTCTrackEvent) => void;
    ondatachannel?: (event: RTCDataChannelEvent) => void;
    onSessionCreated?: (session: NewSessionApiResponse) => void;
    onSuccess?: (peerConnection: RTCPeerConnection, session: NewSessionApiResponse) => void;
    onError?: (error: any) => void;
    onFinally?: () => void;
}
