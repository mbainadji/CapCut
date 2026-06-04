import axios from 'axios';
import RNFS from 'react-native-fs';
import { TranscriptionSegment } from '../types/editor.types';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcrireAudio(
  audioPath: string,
  apiKey: string
): Promise<TranscriptionSegment[]> {
  const srcPath = audioPath.replace('file://', '');

  // Lire le fichier audio en base64
  const audioBase64 = await RNFS.readFile(srcPath, 'base64');

  // Créer le FormData
  const formData = new FormData();
  formData.append('file', {
    uri: audioPath,
    type: 'audio/mpeg',
    name: 'audio.mp3',
  } as any);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await axios.post(WHISPER_URL, formData, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  });

  if (!response.data.segments) {
    throw new Error('Aucun segment retourné par Whisper');
  }

  return response.data.segments.map((seg: any) => ({
    start: seg.start,
    end: seg.end,
    texte: seg.text.trim(),
  }));
}

// Exemple d'appel API Whisper
/*
POST https://api.openai.com/v1/audio/transcriptions
Authorization: Bearer sk-...
Content-Type: multipart/form-data

{
  "file": <audio.mp3>,
  "model": "whisper-1",
  "response_format": "verbose_json",
  "timestamp_granularities": ["segment"]
}

Réponse :
{
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Bonjour tout le monde"
    },
    {
      "start": 2.5,
      "end": 5.0,
      "text": "Bienvenue dans ce tutoriel"
    }
  ]
}
*/
