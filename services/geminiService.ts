import { GoogleGenAI, Modality } from "@google/genai";
import { PromoRequest, VideoAnalysisResult, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Video Analysis ---

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeVideoContent = async (file: File, language: Language): Promise<VideoAnalysisResult> => {
  try {
    const videoPart = await fileToGenerativePart(file);

    const langInstruction = language === 'id' 
      ? "Gunakan BAHASA INDONESIA untuk output JSON." 
      : "Use ENGLISH for the JSON output.";

    const prompt = `
      Analyze this video.
      ${langInstruction}
      
      Context:
      1. Web/App Demo: Identify App Name, Tech Stack, UI/UX features.
      2. Physical Product: Extract Product Name, USP.
      3. Story: Extract Plot/Premise.
      
      Return a valid JSON object with keys: "productName", "description", "targetAudience".
      - "productName": Project/Product Name.
      - "description": Key Features, Stack, or Plot.
      - "targetAudience": Who is this for?
      
      Do not include markdown formatting or backticks, just raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [videoPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");
    
    return JSON.parse(text) as VideoAnalysisResult;
  } catch (error) {
    console.error("Video Analysis Error:", error);
    throw error;
  }
};

// --- Text Generation ---

export const generatePromoText = async (request: PromoRequest): Promise<string> => {
  const isStory = request.contentType === 'Story';
  const isWebShowcase = request.contentType === 'Web Showcase';
  const lang = request.language === 'id' ? 'BAHASA INDONESIA' : 'ENGLISH';

  const baseContext = `
    Content Type: ${request.contentType}
    Topic/Product: ${request.productName}
    Description/Tech Stack: ${request.description}
    Target Audience: ${request.targetAudience}
    Platform: ${request.platform}
    Tone: ${request.tone}
    Output Language: ${lang}
  `;

  let specificInstructions = '';

  if (isWebShowcase) {
    specificInstructions = `
      MODE: WEB DEVELOPER PORTFOLIO SHOWCASE
      
      Task: Create a technical yet engaging presentation script to showcase a coding project/website.
      
      Structure (Adapt to Platform):
      1. Hook: Problem statement or visual hook.
      2. The Solution: Introduce the Web App.
      3. Tech Stack Flex: Mention technologies (React, Tailwind, etc) to show expertise.
      4. Key Features: UX highlights.
      5. Closing/CTA: View demo or hire developer.

      Format:
      - Use SCRIPT format with [Visual] instructions.
      - Narrator: Professional, competent, enthusiastic (Tech Lead vibe).
    `;
  } else if (isStory) {
    specificInstructions = `
      MODE: CREATIVE STORYTELLING
      
      Task: Write an engaging story or entertainment script.
      
      If Platform is YouTube Shorts/TikTok:
      - Short video script (30-60s).
      - Focus on drama, humor, or moral message.
      - Use STANDARD SCRIPT format:
        [Visual]: ...
        Narrator: ...
      
      If other platforms:
      - Short fiction / micro-fiction.
    `;
  } else {
    specificInstructions = `
      MODE: MARKETING PROMOTION
      
      Task: Write high-conversion ad copy.
      
      If Platform is YouTube Shorts/TikTok:
      - Short video ad script.
      - Use STANDARD SCRIPT format:
        [Visual]: ...
        Narrator: ...
      
      If other platforms:
      - Caption or sales email.
    `;
  }

  const prompt = `
    Create content in ${lang}.
    
    INPUT DATA:
    ${baseContext}

    INSTRUCTIONS:
    ${specificInstructions}
    
    - Ensure the language is natural ${request.language === 'id' ? 'Indonesian' : 'English'}.
    - Return ONLY the main content text.
  `;

  try {
    let systemInstruction = "You are a world-class copywriter.";
    if (isStory) systemInstruction = "You are a best-selling author and creative scriptwriter.";
    if (isWebShowcase) systemInstruction = "You are a Senior Developer Advocate and Tech Content Creator.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Text Generation Error:", error);
    throw error;
  }
};

// --- Audio Generation (TTS) ---

// Helper: Create WAV Header for PCM data
function createWavHeader(sampleRate: number, numChannels: number, dataLength: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF'); // ChunkID
  view.setUint32(4, 36 + dataLength, true); // ChunkSize
  writeString(8, 'WAVE'); // Format
  writeString(12, 'fmt '); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate (16-bit)
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data'); // Subchunk2ID
  view.setUint32(40, dataLength, true); // Subchunk2Size

  return buffer;
}

// Helper: Base64 decode
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: PCM to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generatePromoSpeech = async (text: string, voiceName: string = 'Kore'): Promise<{ buffer: AudioBuffer, blob: Blob }> => {
  try {
    // SMART FILTERING FOR TTS (STRICT NARRATOR ONLY)
    
    // 1. Remove Markdown formatting
    const processedText = text.replace(/[*#_`]/g, ''); 

    const lines = processedText.split('\n');
    const spokenLines: string[] = [];

    const ignoreRegex = /^(?:\[?Visual|\[?Video|\[?Gambar|\[?Image|\[?Footage|\[?Scene|\[?Adegan|\[?Shot|\[?Frame|\[?Clip|\[?Audio|\[?Suara|\[?Sound|\[?Musik|\[?Music|\[?BGM|\[?Backsound|\[?SFX|\[?Efek|\[?Text|\[?Teks|\[?Caption|\[?Tulisan|\[?Headline|\[?Lower Third|\[?Setting|\[?Latar|\[?Lokasi|\[?Place|\[?Cut to|\[?Fade|\[?Dissolve|\[?Zoom|\[?Pan|\[?Tilt)(?:\s+\d+)?(?:[:\-]|\s|$)/i;
    const speakerRegex = /^(?:Narator|Host|Presenter|Voiceover|VO|Karakter|Pria|Wanita|Anak|Ibu|Bapak|Cowok|Cewek|Speaker|Tokoh|Orang|Narrator|Man|Woman|Boy|Girl|Character)(?:\s+\d+)?\s*[:\-]\s*/i;

    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[')) continue; 
      if (ignoreRegex.test(trimmed)) continue;

      const speakerMatch = trimmed.match(speakerRegex);
      if (speakerMatch) {
        trimmed = trimmed.substring(speakerMatch[0].length).trim();
      }

      trimmed = trimmed.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

      if (trimmed.length > 0) {
        spokenLines.push(trimmed);
      }
    }

    const finalText = spokenLines.join(' ');
    const textToSay = finalText || text.replace(/\[.*?\]/g, '');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: textToSay }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Decode base64 to raw PCM bytes
    const audioBytes = decode(base64Audio);

    // Create WAV Blob
    const wavHeader = createWavHeader(24000, 1, audioBytes.length);
    const wavBlob = new Blob([wavHeader, audioBytes], { type: 'audio/wav' });

    // Create AudioBuffer for immediate playback
    const audioBuffer = await decodeAudioData(
      audioBytes,
      outputAudioContext,
      24000,
      1
    );

    return { buffer: audioBuffer, blob: wavBlob };

  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw error;
  }
};