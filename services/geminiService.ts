import { GoogleGenAI, Modality } from "@google/genai";
import { ScriptBlock, VoiceName, MelodyConfig } from "../types";
import { GEMINI_MODEL } from "../constants";
import { blobToBase64, bufferToWave } from "../audioHelpers";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to decode Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const generateAudioFromScript = async (blocks: ScriptBlock[]): Promise<string> => {
  const client = getClient();
  
  // Format: "SpeakerName: Text content"
  const promptText = blocks.map(b => `${b.speaker}: ${b.text}`).join('\n');
  
  const uniqueSpeakers = new Map<string, VoiceName>();
  blocks.forEach(b => {
    if (!uniqueSpeakers.has(b.speaker)) {
      uniqueSpeakers.set(b.speaker, b.voice);
    }
  });

  const speakerVoiceConfigs = Array.from(uniqueSpeakers.entries()).map(([speakerName, voiceName]) => ({
    speaker: speakerName,
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: voiceName
      }
    }
  }));

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: speakerVoiceConfigs
          }
        }
      }
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini.");
    }

    return audioPart.inlineData.data;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};

export const generateMelody = async (config: MelodyConfig): Promise<string> => {
  const client = getClient();

  // Creative prompting to induce musicality/emotion in the TTS model
  // We use a specific voice 'Fenrir' or 'Kore' usually good for expressive tones.
  const promptText = `(Singing in a ${config.mood} ${config.genre} style) ${config.text}`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Zephyr' // Zephyr is usually clear and bright, good for melody attempts
            }
          }
        }
      }
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini.");
    }

    return audioPart.inlineData.data;
  } catch (error) {
    console.error("Gemini Melody Error:", error);
    throw error;
  }
};

export const transformAudio = async (audioBuffer: AudioBuffer, instruction: string): Promise<string> => {
  const client = getClient();
  
  // 1. Convert AudioBuffer to WAV Blob
  const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
  
  // 2. Convert Blob to Base64
  const base64Audio = await blobToBase64(wavBlob);

  // Strict prompt for high fidelity preservation
  const prompt = `
  Task: Audio-to-Audio Transformation.
  Input: An audio file containing music or vocals.
  Instruction: ${instruction}.

  CRITICAL CONSTRAINTS:
  1. PRESERVE the original melody, harmony, tempo, rhythm, and song structure EXACTLY.
  2. DO NOT compose a new song. The output must align perfectly with the original audio.
  3. ONLY change the vocal timbre (voice character) or instrumentation style as requested.
  4. If the instruction asks to change the voice, keep the original lyrics and pitch melody but swap the singer's tone.
  5. High fidelity output required.
  `;

  try {
    // We use gemini-2.5-flash which supports multimodal input
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/wav',
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseModalities: [Modality.AUDIO]
        // Note: We remove speechConfig here to let the model generate purely based on input + prompt
        // instead of forcing a specific TTS voice overlaid on top.
      }
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);

    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini.");
    }

    return audioPart.inlineData.data;

  } catch (error) {
    console.error("Gemini Transform Error:", error);
    throw error;
  }
};