import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { text, voice, phoneNumber } = await request.json();

        if (!text || !voice || !phoneNumber) {
            return NextResponse.json({ error: "Text, voice, and phone number are required" }, { status: 400 });
        }

        // Step 1: Generate audio using existing TTS
        const ttsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/text-to-speech`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, voice }),
        });

        if (!ttsResponse.ok) {
            const errorData = await ttsResponse.json();
            throw new Error(errorData.error || "Failed to generate audio");
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        // Step 2: Upload audio to a temporary service (using data URI for demo)
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

        // Step 3: Make call using Exotel API
        const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
        const exotelApiKey = process.env.EXOTEL_API_KEY;
        const exotelApiToken = process.env.EXOTEL_API_TOKEN;
        const exotelSubdomain = process.env.EXOTEL_SUBDOMAIN;

        if (!exotelAccountSid || !exotelApiKey || !exotelApiToken) {
            return NextResponse.json({ error: "Exotel credentials not configured" }, { status: 500 });
        }

        // Get virtual number from environment or use a default
        const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER;
        if (!virtualNumber || virtualNumber === "your_virtual_number_here") {
            return NextResponse.json({ 
                error: "Virtual number not configured. Please set EXOTEL_VIRTUAL_NUMBER in your environment variables." 
            }, { status: 400 });
        }

        // Exotel Connect API call
        const exotelResponse = await fetch(`https://${exotelSubdomain}/v1/Accounts/${exotelAccountSid}/Calls/connect.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${btoa(`${exotelApiKey}:${exotelApiToken}`)}`,
            },
            body: new URLSearchParams({
                From: virtualNumber,
                To: phoneNumber,
                CallerId: virtualNumber,
                TimeLimit: "30",
                TimeOut: "30",
                CallType: "trans",
                PlayMedia: audioUrl,
            }),
        });

        if (!exotelResponse.ok) {
            const errorData = await exotelResponse.text();
            console.error("Exotel API error:", errorData);
            return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 });
        }

        const callData = await exotelResponse.json();

        return NextResponse.json({
            success: true,
            callSid: callData.Call?.Sid,
            status: callData.Call?.Status,
            message: "Call initiated successfully"
        });

    } catch (error: any) {
        console.error("Error in make-call API:", error);
        return NextResponse.json({ error: error.message || "Failed to make call" }, { status: 500 });
    }
}
