export interface VideoGenerationRequest {
  prompt: string
  style: string
  ratio: string
  duration: number
}

export interface VideoRecord {
  id: string
  prompt: string
  style: string
  ratio: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  outputUrl: string | null
  createdAt: string
  creditsUsed: number
}

export interface UserCredits {
  credits: number
}
