import OpenAI from 'openai';
import { VideoMetadata } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  async transcribeAudio(audioPath: string): Promise<string> {
    try {
      const fs = await import('fs');
      const audioFile = fs.createReadStream(audioPath);

      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'gpt-4o-mini-transcribe',
        language: 'es',
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async analyzeTranscription(
    transcription: string
  ): Promise<VideoMetadata> {
    try {
      const prompt = `Analiza la siguiente transcripción de video y extrae:
1. Participantes: nombres de las personas mencionadas o protagonistas
2. Situación: descripción breve de la situación principal o tema central
3. Nombre recomendado: un nombre limpio y profesional para el archivo de video

REGLAS PARA EL NOMBRE:
- Estructura: [Participantes] - [Situación principal].mp4
- Ejemplos: "Juan Pérez e Isabel López - Discuten sobre política económica.mp4"
- Debe ser específico, no genérico
- Evita nombres como "Video editado", "Entrevista viral", "Momento polémico"
- Máximo 100 caracteres antes de la extensión
- En español
- Sin caracteres especiales inválidos para nombres de archivo

TRANSCRIPCIÓN:
${transcription}

Responde en JSON con esta estructura exacta:
{
  "participantes": ["Nombre1", "Nombre2"],
  "situacion": "Descripción corta de la situación",
  "nombre_archivo": "Nombre Final - Situación.mp4",
  "confianza": "alta|media|baja"
}

Si no puedes identificar claramente participantes o situación, usa "baja" en confianza.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;

      const parsed = JSON.parse(jsonStr);

      return {
        participantes: Array.isArray(parsed.participantes)
          ? parsed.participantes
          : [parsed.participantes || 'Desconocido'],
        situacion: parsed.situacion || 'Sin información',
        nombre_archivo: parsed.nombre_archivo || 'Video Procesado.mp4',
        confianza: parsed.confianza || 'baja',
      };
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      return {
        participantes: ['Desconocido'],
        situacion: 'Error en análisis',
        nombre_archivo: 'Video Procesado.mp4',
        confianza: 'baja',
      };
    }
  }

  isGenericName(fileName: string): boolean {
    const genericPatterns = [
      /^video\s*\d*\.mp4$/i,
      /^entrevista\s*\d*\.mp4$/i,
      /^momento\s*\d*\.mp4$/i,
      /^editado\s*\d*\.mp4$/i,
      /^clips?\.mp4$/i,
      /^farándula.*\.mp4$/i,
      /^sin.*nombre.*\.mp4$/i,
    ];

    return genericPatterns.some(pattern => pattern.test(fileName));
  }
}
