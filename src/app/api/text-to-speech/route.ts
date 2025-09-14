import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.ELEVEN_LABS_API_KEY;
        if (!apiKey) {
            console.error("ELEVEN_LABS_API_KEY is not set");
            return NextResponse.json({ error: "ELEVEN_LABS_API_KEY is not set" }, { status: 500 });
        }
    

        const { text, voice } = await request.json();

        if (!text || !voice) {
            return NextResponse.json({ error: "Text and voice are required" }, { status: 400 });
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": apiKey,
            },
            body: JSON.stringify({ 
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("ElevenLabs API error:", errorData);
            return NextResponse.json({ error: errorData.error }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, { headers: { "Content-Type": "audio/mpeg" } });
    } catch (error: any) { 
        console.error("Error in text-to-speech API:", error);
        
        let errorMessage = "Failed to generate audio";
        
        if (error.name === 'AbortError') {
            errorMessage = "Request timed out. Please check your internet connection and try again.";
        } else if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
            errorMessage = "Connection timeout. Please check your internet connection and ElevenLabs API status.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}  




