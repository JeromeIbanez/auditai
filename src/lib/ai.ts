import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? 'openai'

  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return openai(process.env.OPENAI_MODEL ?? 'gpt-4o')
  }

  if (provider === 'anthropic') {
    // Switch: npm install @ai-sdk/anthropic, then uncomment below
    // const { createAnthropic } = await import('@ai-sdk/anthropic')
    // const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    // return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6')
    throw new Error('Anthropic provider: install @ai-sdk/anthropic and uncomment in src/lib/ai.ts')
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`)
}

export { getModel }
