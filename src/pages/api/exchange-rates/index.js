import { handleApiRequest, jsonSuccess, jsonError } from '@/lib/api-utils.js'

export const GET = async ({ locals, url }) => {
  return handleApiRequest(async () => {
    const userId = locals.user?.id
    if (!userId) {
      return jsonError('Unauthorized', 401)
    }

    const from = url.searchParams.get('from') || 'USD'
    const to = url.searchParams.get('to') || 'THB'

    if (from === to) {
      return jsonSuccess({
        from,
        to,
        rate: 1,
        timestamp: new Date().toISOString(),
      })
    }

    const pair = `${from}${to}=X`
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}?interval=1d&range=1d`

    const response = await fetch(yahooUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate')
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]
    const rate = result?.meta?.regularMarketPrice

    if (!rate) {
      throw new Error('Exchange rate not found')
    }

    return jsonSuccess({
      from,
      to,
      rate,
      timestamp: new Date().toISOString(),
    })
  })
}
