let cachedToken: { token: string; expiry: number } | null = null;

export async function getGCPAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiry - 60000) {
    return cachedToken.token;
  }

  const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
  const res = await fetch(metadataUrl, { headers: { 'Metadata-Flavor': 'Google' } });

  if (!res.ok) {
    throw new Error(`GCP metadata token request failed: ${res.status}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}
