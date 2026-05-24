from fastapi import FastAPI
from .detectors import attachment_risk, contains_any, detect_urls, heuristic_probability, URGENCY_TERMS, CREDENTIAL_TERMS
from .openai_client import analyze_with_openai
from .schemas import AnalyzeEmailRequest, AnalyzeEmailResponse, AttachmentAnalysisRequest, ClassifyRequest

app = FastAPI(title="SentinelMail AI Analysis Service", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "sentinelmail-ai"}


@app.post("/analyze-email", response_model=AnalyzeEmailResponse)
def analyze_email(payload: AnalyzeEmailRequest):
    text = f"From: {payload.sender}\nReply-To: {payload.reply_to}\nSubject: {payload.subject}\n\n{payload.body}"
    malicious_url_count = detect_urls(payload.urls)
    attach_score = attachment_risk(payload.attachments)
    heuristic = heuristic_probability(text, malicious_url_count, attach_score)
    llm = analyze_with_openai(text)
    probability = float(llm.get("probability", heuristic)) if llm else heuristic
    if probability > 1:
        probability = probability / 100
    urgency = contains_any(text, URGENCY_TERMS)
    credential = contains_any(text, CREDENTIAL_TERMS)
    return {
        "model": llm.get("model", "heuristic-transformer-ready") if llm else "heuristic-transformer-ready",
        "phishing_probability": max(0, min(1, probability)),
        "malicious_url_count": malicious_url_count,
        "attachment_risk_score": attach_score,
        "sender_anomaly_score": 0.35 if payload.reply_to and payload.reply_to.split("@")[-1] not in payload.sender else 0.05,
        "urgency_detected": urgency,
        "credential_theft_detected": credential,
        "suspicious_intent": llm.get("suspicious_intent", "Credential theft or payment redirection indicators") if llm else "Heuristic phishing indicators",
        "tone_manipulation": llm.get("tone_manipulation", "Urgency and authority pressure") if llm else ("Urgency pressure" if urgency else "None detected"),
        "summary": llm.get("summary", "Message scored by URL, attachment, urgency, and credential-theft heuristics") if llm else "Message scored by URL, attachment, urgency, and credential-theft heuristics"
    }


@app.post("/classify-phishing")
def classify_phishing(payload: ClassifyRequest):
    probability = heuristic_probability(payload.text, detect_urls([]), 0)
    return {"phishing_probability": probability, "label": "phishing" if probability >= 0.65 else "benign"}


@app.post("/analyze-attachments")
def analyze_attachments(payload: AttachmentAnalysisRequest):
    return {"attachment_risk_score": attachment_risk(payload.attachments)}
