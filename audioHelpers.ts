import { AudioEditConfig } from './types';

// Helper function to decode raw audio data from Gemini
export const decodeAudioData = async (
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16Data = new Int16Array(bytes.buffer);
  const sampleRate = 24000; // Gemini default usually
  const channels = 1;
  
  const audioBuffer = audioContext.createBuffer(channels, int16Data.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < int16Data.length; i++) {
    channelData[i] = int16Data[i] / 32768.0;
  }
  
  return audioBuffer;
};

// Convert Blob to Base64 string
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Process Audio: Trim and Fade
export const processAudioBuffer = (
  originalBuffer: AudioBuffer,
  config: AudioEditConfig,
  ctx: AudioContext
): AudioBuffer => {
  const { trimStart, trimEnd, fadeIn, fadeOut } = config;
  
  // Calculate new duration
  const originalDuration = originalBuffer.duration;
  let newDuration = originalDuration - trimStart - trimEnd;
  
  // Safety check: minimum 0.1s
  if (newDuration < 0.1) newDuration = 0.1;
  
  const sampleRate = originalBuffer.sampleRate;
  const newLength = Math.floor(newDuration * sampleRate);
  const startOffset = Math.floor(trimStart * sampleRate);
  
  const newBuffer = ctx.createBuffer(
    originalBuffer.numberOfChannels,
    newLength,
    sampleRate
  );

  for (let ch = 0; ch < originalBuffer.numberOfChannels; ch++) {
    const oldData = originalBuffer.getChannelData(ch);
    const newData = newBuffer.getChannelData(ch);

    // 1. Copy (Trimming)
    for (let i = 0; i < newLength; i++) {
      // Prevent out of bounds
      const oldIndex = i + startOffset;
      if (oldIndex < oldData.length) {
        newData[i] = oldData[oldIndex];
      } else {
        newData[i] = 0;
      }
    }

    // 2. Apply Fade In
    const fadeInSamples = Math.floor(fadeIn * sampleRate);
    if (fadeInSamples > 0) {
      for (let i = 0; i < fadeInSamples && i < newLength; i++) {
        newData[i] *= (i / fadeInSamples); // Linear ramp 0 -> 1
      }
    }

    // 3. Apply Fade Out
    const fadeOutSamples = Math.floor(fadeOut * sampleRate);
    if (fadeOutSamples > 0) {
      for (let i = 0; i < fadeOutSamples && i < newLength; i++) {
        const reverseIndex = newLength - 1 - i;
        newData[reverseIndex] *= (i / fadeOutSamples); // Linear ramp 0 -> 1 (applied from end)
      }
    }
  }

  return newBuffer;
};

// WAV Header generator
export function bufferToWave(abuffer: AudioBuffer, len: number) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {             
      sample = Math.max(-1, Math.min(1, channels[i][pos])); 
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
      view.setInt16(44 + offset, sample, true); 
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}