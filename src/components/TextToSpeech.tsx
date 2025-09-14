"use client";
import React, { useState } from "react";

const TextToSpeech = () => {
    const [text, setText] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callStatus, setCallStatus] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState("pNInz6obpgDQGcFmaJgB"); // Update
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Updated voice IDs from ElevenLabs (as of 2024)
    const voices = [
        { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
        { id: "21m00Tcm4TLvDq8ikWAM", name: "Rachel" },
        { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
        { id: "TxGEqnHWrfWFTfGW9XjX", name: "Dorothy" },
        { id: "CYw3kZ02Hs0563khs1Fj", name: "Josh" },
        { id: "ThT5KcBeYPX3keUQqHPh", name: "Antoni" },
        { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
        { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
        { id: "ErXwobaYiN019PkySvjV", name: "Arnold" },
        { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
        { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam" }
    ];

    const handleGenerateAudio = async () => {
        if (!text.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/text-to-speech", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    text, 
                    voice: selectedVoice, 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate audio");
            }

            // Get the audio buffer from response
            const audioBuffer = await response.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
            
            // Create and play audio
            const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
            setAudioElement(audio);
            audio.onended = () => setIsPlaying(false);
            audio.onplay = () => setIsPlaying(true);
            audio.onpause = () => setIsPlaying(false);
            
            await audio.play();
        } catch (error: any) {
            console.error("Error generating audio:", error);
            setError(error.message || "Failed to generate audio");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCall = async () => {
        if (!text.trim() || !phoneNumber.trim()) return;
        
        setIsCalling(true);
        setError(null);
        setCallStatus("Initiating call...");

        try {
            const response = await fetch("/api/make-call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    voice: selectedVoice,
                    phoneNumber: phoneNumber.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to make call");
            }

            setCallStatus(`Call initiated successfully! Call ID: ${data.callSid}`);
            
            // Simulate call status updates
            setTimeout(() => setCallStatus("Call ringing..."), 2000);
            setTimeout(() => setCallStatus("Call connected - playing message"), 5000);
            setTimeout(() => setCallStatus("Call completed"), 15000);

        } catch (error: any) {
            console.error("Error making call:", error);
            setError(error.message || "Failed to make call");
            setCallStatus(null);
        } finally {
            setIsCalling(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                AI Voice Call Demo
            </h1>
            
            <div className="space-y-6">
                {/* Text Input */}
                <div>
                    <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your message:
                    </label>
                    <textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                    />
                </div>

                {/* Voice Selection */}
                <div>
                    <label htmlFor="voice" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Voice:
                    </label>
                    <select
                        id="voice"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {voices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Phone Number Input */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number:
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number (e.g., +1234567890)"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleGenerateAudio}
                        disabled={isGenerating || isCalling || !text.trim()}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isGenerating ? "Generating..." : "Generate Audio"}
                    </button>
                    
                    <button
                        onClick={handleCall}
                        disabled={isGenerating || isCalling || !text.trim() || !phoneNumber.trim()}
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCalling ? "Calling..." : "Call Now"}
                    </button>
                </div>

                {/* Call Status */}
                {callStatus && (
                    <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                        {callStatus}
                    </div>
                )}

                {/* Audio Controls */}
                {audioElement && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Audio Player:</h3>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    if (isPlaying) {
                                        audioElement.pause();
                                    } else {
                                        audioElement.play();
                                    }
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {isPlaying ? "Pause" : "Play"}
                            </button>
                            <span className="text-sm text-gray-600">
                                Status: {isPlaying ? "Playing" : "Paused"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-md">
                    <p><strong>Note:</strong> This demo generates AI voice using ElevenLabs and makes actual phone calls using Exotel API. Make sure you have a valid virtual number configured in your Exotel account.</p>
                </div>
            </div>
        </div>
    );
};

export default TextToSpeech;