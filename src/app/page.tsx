import TextToSpeech from "@/components/TextToSpeech";
import Image from "next/image";

export default function Home() {
  return (
   <main className="min-h-screen p-4 bg-gray-50">
    <div className="max-w-2xl mx-auto">
      <TextToSpeech/>
    </div>
   </main>
  );
}
