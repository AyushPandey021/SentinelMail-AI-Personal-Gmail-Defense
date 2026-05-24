export function extractUrls(text = "") {
  return [...text.matchAll(/\bhttps?:\/\/[^\s<>"')]+/gi)].map((m) => m[0]);
}

export function extractAuthResults(headers = []) {
  const authHeader = headers.find((h) => h.name?.toLowerCase() === "authentication-results")?.value ?? "";
  return {
    spf: /spf=pass/i.test(authHeader) ? "pass" : /spf=fail/i.test(authHeader) ? "fail" : "unknown",
    dkim: /dkim=pass/i.test(authHeader) ? "pass" : /dkim=fail/i.test(authHeader) ? "fail" : "unknown",
    dmarc: /dmarc=pass/i.test(authHeader) ? "pass" : /dmarc=fail/i.test(authHeader) ? "fail" : "unknown"
  };
}

export function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

export function domainSimilarity(senderDomain, trustedDomains = []) {
  if (!senderDomain || trustedDomains.length === 0) return 0;
  const best = Math.min(...trustedDomains.map((domain) => levenshtein(senderDomain, domain) / Math.max(senderDomain.length, domain.length)));
  return best > 0 && best <= 0.35 ? 1 - best : 0;
}

export function hasHomoglyphs(value = "") {
  return /[а-яА-Яορеѕӏ]/u.test(value);
}
