import axios from 'axios'
import { BasePlugin, PluginCommand } from '../base'
import { getConfig } from '../../core/config'

export default class WebSearchPlugin extends BasePlugin {
  readonly name = 'web-search'
  readonly description = 'Búsqueda en internet con DuckDuckGo'

  readonly commands: PluginCommand[] = [
    {
      pattern: /buscá?\s+(?:en\s+(?:internet|la\s+web)\s+)?(.+)/i,
      description: 'Buscar en internet',
      handler: async (text, match) => {
        const query = match?.[1]?.trim() || text
        return await this.search(query)
      },
    },
    {
      pattern: /(?:qué\s+es|que\s+es|definición\s+de|definicion\s+de)\s+(.+)/i,
      description: 'Buscar definición',
      handler: async (text, match) => {
        const query = match?.[1]?.trim() || text
        return await this.search(query)
      },
    },
    {
      pattern: /(?:clima|tiempo)\s+(?:en\s+)?(.+)/i,
      description: 'Consultar clima',
      handler: async (text, match) => {
        const city = match?.[1]?.trim() || 'Buenos Aires'
        return await this.search(`clima ${city} hoy`)
      },
    },
  ]

  private async search(query: string): Promise<string> {
    const maxResults = getConfig().getOrDefault(5, 'integrations', 'webSearch', 'maxResults')
    try {
      const { data } = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_redirect: 1, no_html: 1 },
        timeout: 8000,
      })

      if (data.AbstractText) {
        return data.AbstractText.slice(0, 400)
      }

      const results = data.RelatedTopics?.slice(0, maxResults) || []
      if (results.length) {
        return results
          .filter((r: { Text?: string }) => r.Text)
          .map((r: { Text: string }, i: number) => `${i + 1}. ${r.Text}`)
          .join('\n')
      }

      return `No encontré resultados para: "${query}"`
    } catch {
      return `Error buscando: "${query}". Verificá tu conexión.`
    }
  }
}
