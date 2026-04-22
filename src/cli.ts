#!/usr/bin/env ts-node
/**
 * CLI de Jarvis — modo texto sin GUI ni voz
 * Uso: npx ts-node src/cli.ts
 */
import * as readline from 'readline'
import { Assistant } from './core/assistant'
import { getLogger } from './core/logger'

const log = getLogger('cli')

async function main() {
  console.log('╔═══════════════════════════════╗')
  console.log('║   JARVIS — Modo CLI de texto  ║')
  console.log('║   Escribí "salir" para salir  ║')
  console.log('╚═══════════════════════════════╝\n')

  const assistant = new Assistant()
  await assistant.start({ voice: false })  // sin voz ni wake word en CLI

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = () => rl.question('Vos: ', async (input) => {
    const text = input.trim()
    if (!text) { prompt(); return }
    if (['salir', 'exit', 'quit'].includes(text.toLowerCase())) {
      await assistant.stop()
      console.log('\nHasta luego.')
      process.exit(0)
    }
    try {
      const reply = await assistant.process(text)
      console.log(`\nJarvis: ${reply}\n`)
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`)
    }
    prompt()
  })
  prompt()
}

main().catch(console.error)
