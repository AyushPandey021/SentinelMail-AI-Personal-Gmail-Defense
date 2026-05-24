const CATEGORY_RULES = [
  {
    id: "SUSPICIOUS",
    label: "Suspicious",
    matches: ({ risk }) => ["HIGH", "CRITICAL"].includes(risk.level)
  },
  {
    id: "NO_REPLY",
    label: "No-reply / System",
    matches: ({ senderEmail }) => /(^|[._-])(no-?reply|donotreply|notification|notify|alerts?)([._-]|@)/i.test(senderEmail)
  },
  {
    id: "ADS",
    label: "Ads / Promotions",
    matches: ({ headers, text, senderEmail }) => {
      const listHeader = headers.find((header) => header.name?.toLowerCase() === "list-unsubscribe")?.value ?? "";
      return Boolean(listHeader) || /offer|sale|discount|deal|promo|newsletter|marketing|unsubscribe/i.test(`${senderEmail} ${text}`);
    }
  },
  {
    id: "SOCIAL",
    label: "Social",
    matches: ({ senderDomain, text }) => /instagram|facebook|twitter|x\.com|linkedin|youtube|snapchat|reddit/i.test(`${senderDomain} ${text}`)
  },
  {
    id: "FINANCE",
    label: "Finance",
    matches: ({ senderDomain, text }) => /bank|payment|invoice|statement|brokerage|funds|securities|upi|paypal|stripe|razorpay|indmoney|tax/i.test(`${senderDomain} ${text}`)
  },
  {
    id: "SECURITY",
    label: "Security Alerts",
    matches: ({ text }) => /security alert|password changed|new sign-in|login attempt|2-step|verification code|otp|recovery/i.test(text)
  },
  {
    id: "DEVELOPER",
    label: "Developer / Tools",
    matches: ({ senderDomain, text }) => /github|gitlab|vercel|netlify|mongodb|google ai|openai|api|codepen|developer|console|cloud/i.test(`${senderDomain} ${text}`)
  }
];

export function classifyEmailCategory({ senderEmail = "", senderDomain = "", subject = "", bodyText = "", headers = [], risk }) {
  const text = `${subject} ${bodyText}`.slice(0, 5000);
  const match = CATEGORY_RULES.find((rule) => rule.matches({ senderEmail, senderDomain, text, headers, risk }));
  return match ?? { id: "PERSONAL", label: "Personal / Other" };
}

export const CATEGORY_LABELS = Object.fromEntries([...CATEGORY_RULES, { id: "PERSONAL", label: "Personal / Other" }].map((item) => [item.id, item.label]));
