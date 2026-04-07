/**
 * VirusTotal API Integration
 * OSINT enrichment for sender domain, sender IP, and extracted URLs.
 */

export interface VTScore {
  harmless: number;
  malicious: number;
  suspicious: number;
  undetected: number;
  timeout: number;
  total: number;
  reputation?: number;
  lastAnalysisDate?: string;
}

export interface VTUrlResult {
  url: string;
  score: VTScore | null;
  error?: string;
}

export interface OSINTResults {
  senderDomain: string;
  senderDomainScore: VTScore | null;
  senderIp: string | null;
  senderIpScore: VTScore | null;
  urlResults: VTUrlResult[];
}

function getApiKey(): string {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) throw new Error("Missing VIRUSTOTAL_API_KEY");
  return key;
}

async function vtRequest(path: string): Promise<Record<string, unknown>> {
  const apiKey = getApiKey();
  const response = await fetch(`https://www.virustotal.com/api/v3${path}`, {
    headers: {
      "x-apikey": apiKey,
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return {};
  }

  if (!response.ok) {
    throw new Error(`VirusTotal API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

function extractStats(data: Record<string, unknown>): VTScore | null {
  const attrs = (data.data as Record<string, unknown>)?.attributes as
    | Record<string, unknown>
    | undefined;
  if (!attrs) return null;

  const stats = attrs.last_analysis_stats as Record<string, number> | undefined;
  if (!stats) return null;

  const reputation = attrs.reputation as number | undefined;
  const lastAnalysisDate = attrs.last_analysis_date as number | undefined;

  const harmless = stats.harmless ?? 0;
  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;
  const undetected = stats.undetected ?? 0;
  const timeout = stats.timeout ?? 0;
  const total = harmless + malicious + suspicious + undetected + timeout;

  return {
    harmless,
    malicious,
    suspicious,
    undetected,
    timeout,
    total,
    reputation,
    lastAnalysisDate: lastAnalysisDate
      ? new Date(lastAnalysisDate * 1000).toISOString()
      : undefined,
  };
}

/**
 * Looks up a domain in VirusTotal.
 */
export async function checkDomain(domain: string): Promise<VTScore | null> {
  try {
    const data = await vtRequest(`/domains/${encodeURIComponent(domain)}`);
    return extractStats(data);
  } catch (error) {
    console.warn(`VT domain lookup failed for ${domain}:`, error);
    return null;
  }
}

/**
 * Looks up an IP address in VirusTotal.
 */
export async function checkIp(ip: string): Promise<VTScore | null> {
  try {
    const data = await vtRequest(`/ip_addresses/${encodeURIComponent(ip)}`);
    return extractStats(data);
  } catch (error) {
    console.warn(`VT IP lookup failed for ${ip}:`, error);
    return null;
  }
}

/**
 * Looks up a URL in VirusTotal using the base64url-encoded URL format.
 */
export async function checkUrl(url: string): Promise<VTScore | null> {
  try {
    const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");
    const data = await vtRequest(`/urls/${urlId}`);
    return extractStats(data);
  } catch (error) {
    console.warn(`VT URL lookup failed for ${url}:`, error);
    return null;
  }
}

/**
 * Performs full OSINT enrichment: domain, IP, and URLs.
 * Limits URL checks to the first 5 to stay within API rate limits.
 */
export async function enrichWithOSINT(params: {
  senderDomain: string;
  senderIp: string | null;
  extractedLinks: string[];
}): Promise<OSINTResults> {
  const { senderDomain, senderIp, extractedLinks } = params;

  // Run domain and IP checks in parallel
  const [senderDomainScore, senderIpScore] = await Promise.all([
    senderDomain ? checkDomain(senderDomain) : Promise.resolve(null),
    senderIp ? checkIp(senderIp) : Promise.resolve(null),
  ]);

  // Check up to 5 URLs, rate-limited with small delays
  const urlsToCheck = extractedLinks.slice(0, 5);
  const urlResults: VTUrlResult[] = [];

  for (const url of urlsToCheck) {
    // Small delay to avoid rate limiting (4 requests/minute on free tier)
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const score = await checkUrl(url);
      urlResults.push({ url, score });
    } catch (error) {
      urlResults.push({ url, score: null, error: String(error) });
    }
  }

  return {
    senderDomain,
    senderDomainScore,
    senderIp,
    senderIpScore,
    urlResults,
  };
}
