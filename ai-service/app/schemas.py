from pydantic import BaseModel, Field


class Attachment(BaseModel):
    name: str
    contentType: str | None = None
    size: int = 0


class AnalyzeEmailRequest(BaseModel):
    sender: str
    reply_to: str | None = None
    subject: str | None = ""
    headers: list[dict] = Field(default_factory=list)
    body: str | None = ""
    urls: list[str] = Field(default_factory=list)
    attachments: list[Attachment] = Field(default_factory=list)


class AnalyzeEmailResponse(BaseModel):
    model: str
    phishing_probability: float
    malicious_url_count: int
    attachment_risk_score: float
    sender_anomaly_score: float
    urgency_detected: bool
    credential_theft_detected: bool
    suspicious_intent: str
    tone_manipulation: str
    summary: str


class ClassifyRequest(BaseModel):
    text: str


class AttachmentAnalysisRequest(BaseModel):
    attachments: list[Attachment] = Field(default_factory=list)
