import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import { Segment, TranscriptionSegment, Beat } from '../types/editor.types';

const OUTPUT_DIR = `${RNFS.CachesDirectoryPath}/capcut_segments`;

export async function initialiserDossier(): Promise<void> {
  const exists = await RNFS.exists(OUTPUT_DIR);
  if (!exists) await RNFS.mkdir(OUTPUT_DIR);
}

export async function nettoyerCache(): Promise<void> {
  try {
    const files = await RNFS.readDir(OUTPUT_DIR);
    for (const f of files) await RNFS.unlink(f.path);
  } catch {}
}

// Couper un segment
export async function couperSegment(
  videoUri: string,
  startTime: number,
  endTime: number,
  segmentId: string
): Promise<string> {
  await initialiserDossier();
  const outputPath = `${OUTPUT_DIR}/segment_${segmentId}.mp4`;
  const srcPath = videoUri.replace('file://', '');
  const duration = endTime - startTime;

  const cmd = `-y -i "${srcPath}" -ss ${startTime.toFixed(3)} -t ${duration.toFixed(3)} -c:v libx264 -c:a aac -avoid_negative_ts 1 "${outputPath}"`;

  const session = await FFmpegKit.execute(cmd);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const logs = await session.getAllLogsAsString();
    throw new Error(`FFmpeg error: ${logs}`);
  }
  return `file://${outputPath}`;
}

// Détection de scènes
export async function detecterScenes(
  videoUri: string,
  sensibilite: number
): Promise<number[]> {
  const srcPath = videoUri.replace('file://', '');
  const logPath = `${OUTPUT_DIR}/scenes.txt`;

  const cmd = `-y -i "${srcPath}" -vf "select='gt(scene,${sensibilite})',showinfo" -vsync vfr -f null -`;

  const timestamps: number[] = [0];
  const session = await FFmpegKit.execute(cmd);
  const logs = await session.getAllLogsAsString();

  // Parser les logs pour extraire les timestamps
  const regex = /pts_time:([\d.]+)/g;
  let match;
  while ((match = regex.exec(logs)) !== null) {
    const t = parseFloat(match[1]);
    if (t > 0) timestamps.push(t);
  }

  return timestamps.sort((a, b) => a - b);
}

// Détection des silences
export async function detecterSilences(
  videoUri: string,
  seuilDb: number,
  dureeMin: number
): Promise<{ start: number; end: number }[]> {
  const srcPath = videoUri.replace('file://', '');
  const cmd = `-y -i "${srcPath}" -af "silencedetect=noise=${seuilDb}dB:d=${dureeMin}" -f null -`;

  const session = await FFmpegKit.execute(cmd);
  const logs = await session.getAllLogsAsString();

  const silences: { start: number; end: number }[] = [];
  const startRegex = /silence_start: ([\d.]+)/g;
  const endRegex = /silence_end: ([\d.]+)/g;

  const starts: number[] = [];
  const ends: number[] = [];

  let m;
  while ((m = startRegex.exec(logs)) !== null) starts.push(parseFloat(m[1]));
  while ((m = endRegex.exec(logs)) !== null) ends.push(parseFloat(m[1]));

  for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
    silences.push({ start: starts[i], end: ends[i] });
  }
  return silences;
}

// Extraire l'audio pour Whisper
export async function extraireAudio(videoUri: string): Promise<string> {
  await initialiserDossier();
  const srcPath = videoUri.replace('file://', '');
  const outputPath = `${OUTPUT_DIR}/audio_whisper.mp3`;

  const cmd = `-y -i "${srcPath}" -vn -ar 16000 -ac 1 -b:a 64k "${outputPath}"`;

  const session = await FFmpegKit.execute(cmd);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    throw new Error('Impossible d\'extraire l\'audio');
  }
  return `file://${outputPath}`;
}

// Concaténer les segments
export async function concatenerSegments(segments: Segment[]): Promise<string> {
  await initialiserDossier();
  const listPath = `${OUTPUT_DIR}/concat_list.txt`;
  const outputPath = `${OUTPUT_DIR}/final_output.mp4`;

  const listContent = segments
    .filter(s => s.outputPath)
    .map(s => `file '${s.outputPath!.replace('file://', '')}'`)
    .join('\n');

  await RNFS.writeFile(listPath, listContent, 'utf8');

  const cmd = `-y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
  const session = await FFmpegKit.execute(cmd);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    throw new Error('Impossible de concaténer les segments');
  }
  return `file://${outputPath}`;
}

// Obtenir la durée d'une vidéo
export async function obtenirDuree(videoUri: string): Promise<number> {
  const srcPath = videoUri.replace('file://', '');
  const cmd = `-i "${srcPath}"`;
  const session = await FFmpegKit.execute(cmd);
  const logs = await session.getAllLogsAsString();

  const match = logs.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!match) return 0;

  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const s = parseFloat(match[3]);
  return h * 3600 + m * 60 + s;
}
