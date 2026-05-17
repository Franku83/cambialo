import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter'

const TYPESENSE_HOST = process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? 'localhost'
const TYPESENSE_PORT = Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? 443)
const TYPESENSE_PROTOCOL = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https'
const SEARCH_API_KEY = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY ?? ''

// searchClient es null en SSR o si no está configurado
export const searchClient = SEARCH_API_KEY
  ? new TypesenseInstantSearchAdapter({
      server: {
        apiKey: SEARCH_API_KEY,
        nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: TYPESENSE_PROTOCOL }],
        cacheSearchResultsForSeconds: 30,
      },
      additionalSearchParameters: {
        query_by: 'brand,model_name,city',
        sort_by: 'is_bumped:desc,_text_match:desc,created_at:desc',
        per_page: 20,
      },
    }).searchClient
  : null

/** Parámetros de búsqueda directa (para el feed de la homepage sin InstantSearch) */
export const typesenseConfig = {
  host: TYPESENSE_HOST,
  port: TYPESENSE_PORT,
  protocol: TYPESENSE_PROTOCOL,
  searchApiKey: SEARCH_API_KEY,
  collectionName: 'listings',
}
