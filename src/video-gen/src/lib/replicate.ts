import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export const VIDEO_MODELS = {
  wan21: 'wavespeedai/wan-2.1-t2v-480p',
  cogvideo: 'lucataco/cogvideox-5b',
  mochi: 'fofr/mochi-1',
} as const

export type VideoModel = keyof typeof VIDEO_MODELS

export const STYLES: Record<string, { label: string; prompt: string }> = {
  cinematic:   { label: 'Cinématique',   prompt: 'cinematic style, film grain, dramatic lighting' },
  anime:       { label: 'Anime',         prompt: 'anime style, vibrant colors, smooth animation' },
  realistic:   { label: 'Réaliste',      prompt: 'photorealistic, 8K, ultra detailed' },
  artistic:    { label: 'Artistique',    prompt: 'artistic style, painterly, expressive brushstrokes' },
  futuristic:  { label: 'Futuriste',     prompt: 'futuristic, sci-fi aesthetic, neon lights, cyberpunk' },
}

export const RATIOS: Record<string, { label: string; width: number; height: number }> = {
  '16:9':  { label: '16:9 (Paysage)',  width: 1280, height: 720 },
  '9:16':  { label: '9:16 (Portrait)', width: 720,  height: 1280 },
  '1:1':   { label: '1:1 (Carré)',     width: 1024, height: 1024 },
}

export async function generateVideo({
  prompt,
  style,
  ratio,
  duration = 5,
}: {
  prompt: string
  style: string
  ratio: string
  duration?: number
}): Promise<string> {
  const styleData = STYLES[style] ?? STYLES.cinematic
  const ratioData = RATIOS[ratio] ?? RATIOS['16:9']
  const fullPrompt = `${prompt}, ${styleData.prompt}`

  const prediction = await replicate.predictions.create({
    model: VIDEO_MODELS.wan21,
    input: {
      prompt: fullPrompt,
      negative_prompt: 'blurry, low quality, distorted, text, watermark',
      width: ratioData.width,
      height: ratioData.height,
      num_frames: duration * 8,
      num_inference_steps: 30,
    },
  })

  return prediction.id
}

export async function getPredictionStatus(predictionId: string) {
  return replicate.predictions.get(predictionId)
}
