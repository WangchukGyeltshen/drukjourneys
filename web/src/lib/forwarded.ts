// Headers that tell the API which visitor a request is for, so its rate
// limiter counts visitors separately. The secret proves the request comes
// from this server. Without a secret nothing is forwarded.
export function buildForwardedHeaders(incoming: Headers): Record<string, string> {
  const secret = process.env.TRUSTED_PROXY_SECRET
  if (!secret) {
    return {}
  }
  const visitorIp = incoming.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  return { 'X-Proxy-Secret': secret, 'X-Client-IP': visitorIp }
}
