"use client"
import 'regenerator-runtime/runtime';
import { use, useCallback, useEffect, useState } from "react";
import { closeConnection, createNewSession, repeat, startSession, stopSession } from "./utils";
import { NewSessionApiRequest, NewSessionApiResponse } from "./types";

const empty: string[] = []

interface UseStreamingAvatar {
    session: NewSessionApiResponse | null;
    peerConnection: RTCPeerConnection | null;
    isConnectionOpen: boolean;
    stream: MediaStream | null;
    isLoading: boolean;
    isStarted: boolean;
    isTalking: boolean;
    repeatQueue: string[];
    isLoadingNewSession: boolean;
    isLoadingCloseConnection: boolean;
    isLoadingStartSession: boolean;
    handleCreateNewSession: () => void;
    handleCloseConnection: () => void;
    handleStart: () => void;
    handleRepeat: (text: string) => void;
    addToRepeatQueue: (message: string) => void;
    setSessionOptions: (options: NewSessionApiRequest) => void;
    sessionOptions: NewSessionApiRequest;
}

export default function useStreamingAvatar(): UseStreamingAvatar {
    const [session, setSession] = useState<NewSessionApiResponse | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoadingNewSession, setIsLoadingNewSession] = useState(false);
    const [isLoadingCloseConnection, setIsLoadingCloseConnection] = useState(false);
    const [isLoadingStartSession, setIsLoadingStartSession] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [repeatQueue, setRepeatQueue] = useState<string[]>(empty);
    const isConnectionOpen = !!(session && peerConnection)
    const isLoading = isLoadingNewSession || isLoadingCloseConnection || isLoadingStartSession
    const [talkingTime, setTalkingTime] = useState<number>(0)
    const isTalking = talkingTime > 0
    const [sessionOptions, setSessionOptions] = useState<NewSessionApiRequest>({ quality: 'high', avatar_name: 'Selina-blackabaya-20220608', voice: { voice_id: '76955c80188a4c149df169b5dc9e1a3a' } })

    const handleCreateNewSession = useCallback(async () => {
        console.log('handleCreateNewSession')
        if (isConnectionOpen) return;
        setIsLoadingNewSession(true);
        createNewSession(
            sessionOptions,
            {
                onSessionCreated(session) { setSession(session) },
                ontrack(event) {
                    console.log("Stream:", event.streams)
                    setStream(event.streams[0])
                },
                onSuccess(data) { setPeerConnection(data) },
                onFinally() { setIsLoadingNewSession(false) }
            })
    }, [isConnectionOpen, sessionOptions])

    const handleCloseConnection = useCallback(() => {
        console.log('handleCloseConnection')
        setIsLoadingCloseConnection(true);
        if (!session || !peerConnection) return
        closeConnection(session, peerConnection, {
            onSuccess: () => {
                setSession(null);
                setPeerConnection(null);
                setStream(null);
                setIsStarted(false);
            },
            onFinally() { setIsLoadingCloseConnection(false) }
        })
    }, [session, peerConnection])

    const handleStart = useCallback(async () => {
        if (isConnectionOpen || isStarted || session) return;
        setIsLoadingNewSession(true);
        createNewSession(
            sessionOptions,
            {
                onSessionCreated(session) { setSession(session) },
                ontrack(event) {
                    console.log("Stream:", event.streams)
                    setStream(event.streams[0])
                },
                async onSuccess(peerConnection, session) {
                    setPeerConnection(peerConnection)
                    try {
                        setIsLoadingStartSession(true);
                        const localDescription = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(localDescription);
                        // Start session
                        await startSession({ session_id: session.data.session_id, sdp: localDescription }, { onSuccess: () => setIsStarted(true) })
                    } catch (e) {
                        console.log('handleStart Error', e)
                    } finally {
                        setIsLoadingStartSession(false)
                    }
                },
                onFinally() { setIsLoadingNewSession(false) }
            })

        // Create and set local SDP description

    }, [isConnectionOpen, isStarted, session, sessionOptions])

    const handleRepeat = useCallback(async (text: string) => {
        console.log('handleRepeat')
        console.log('text', text)
        if (!text) {
            console.error('completion is required');
            return
        };
        if (!session || !peerConnection) {
            console.error('sessionInfo and peerConnection are required');
            return;
        }
        try {
            await repeat(
                { session_id: session.data.session_id, text, task_mode: 'sync', task_type: 'repeat'},
                {
                    onSuccess: async ({ duration_ms }) => {
                        setIsRequesting(false)
                        const delay = 0
                        const total = duration_ms - delay
                        console.log('Timer', total, 'started')
                        setTalkingTime(state => state + total)
                        setTimeout(() => {
                            setIsRequesting(false)
                            console.log('Timer', total, 'finsihed')
                            setTalkingTime(state => state - total)
                        }, total)
                    }
                });
        } catch (e) {
            console.log('handleRepeat Error', e)
        } finally {

        }

    }, [session, peerConnection])
    
    const addToRepeatQueue = useCallback((message: string) => {
        if (!isConnectionOpen) return
        if (!stream) return
        setRepeatQueue(state => [...state, message])
    }, [isConnectionOpen, stream])

    useEffect(() => {
        if (!isConnectionOpen) {
            setIsRequesting(false)
            setRepeatQueue(empty)
            return
        }
        if (isRequesting) return
        if (!stream) return
        if (repeatQueue.length > 0) {
            setIsRequesting(true)
            handleRepeat(repeatQueue[0])
            setRepeatQueue(state => state.slice(1))
        }
    }, [handleRepeat, repeatQueue, isRequesting, isConnectionOpen, stream])

    useEffect(() => {
        if (stream) return
        setRepeatQueue(empty)
        setIsRequesting(false)
    }, [stream])

    useEffect(() => {
        if (isConnectionOpen) return
        setIsRequesting(false)
        setTalkingTime(0)
        setRepeatQueue([])
    }, [isConnectionOpen])

    useEffect(() => {
        const handleBeforeUnload = () => {
            handleCloseConnection();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [handleCloseConnection]);

    /* useEffect(() => {
        if (isStarted || isLoading || isConnectionOpen || session) return
        console.log("testing123", "handleStart")
        handleStart()
    }, [isStarted, isLoading, handleStart, isConnectionOpen, session]) */

    return {
        session,
        peerConnection,
        isConnectionOpen,
        stream,
        isLoading,
        isLoadingNewSession,
        isLoadingCloseConnection,
        isLoadingStartSession,
        isStarted,
        isTalking,
        repeatQueue,
        handleCreateNewSession,
        handleCloseConnection,
        handleStart,
        handleRepeat,
        addToRepeatQueue,
        setSessionOptions,
        sessionOptions
    }
}
