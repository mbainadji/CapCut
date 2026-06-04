import axios from 'axios';
import RNFS from 'react-native-fs';
import { Beat } from '../types/editor.types';

// URL de votre serveur FastAPI
const BEAT_API_URL = 'http://votre-serveur:8000/analyze-beats';

export async function analyserBeats(
  audioPath: string,
  sensibilite: 'every' | 'every2' | 'bar'
): Promise<Beat[]> {
  const srcPath = audioPath.replace('file://', '');

  const formData = new FormData();
  formData.append('audio', {
    uri: audioPath,
    type: 'audio/mpeg',
    name: 'audio.mp3',
  } as any);
  formData.append('sensitivity', sensibilite);

  const response = await axios.post(BEAT_API_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  return response.data.beats.map((b: any) => ({
    time: b.time,
    strength: b.strength || 1.0,
  }));
}

/*
=== BACKEND FastAPI (main.py) ===

from fastapi import FastAPI, UploadFile, File, Form
import librosa
import numpy as np
import tempfile
import os

app = FastAPI()

@app.post("/analyze-beats")
async def analyze_beats(
    audio: UploadFile = File(...),
    sensitivity: str = Form("every")
):
    # Sauvegarder le fichier temporairement
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Charger avec librosa
        y, sr = librosa.load(tmp_path)

        # Détecter les beats
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)

        # Filtrer selon la sensibilité
        if sensitivity == "every2":
            beat_times = beat_times[::2]
        elif sensitivity == "bar":
            beat_times = beat_times[::4]

        beats = [{"time": float(t), "strength": 1.0} for t in beat_times]

        return {"beats": beats, "tempo": float(tempo)}

    finally:
        os.unlink(tmp_path)

# Lancer : uvicorn main:app --host 0.0.0.0 --port 8000
*/
