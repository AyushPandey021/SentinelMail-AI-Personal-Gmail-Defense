import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { collections, oid } from "../../db/mongo.js";
import { HttpError } from "../../middleware/errorHandler.js";

function signAccess(user) {
  return jwt.sign(
    { sub: user._id.toString(), organizationId: user.organizationId.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL }
  );
}

function signRefresh(user) {
  return jwt.sign({ sub: user.id, tokenId: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function login(email, password) {
  const { users, refreshTokens } = await collections();
  const user = await users.findOne({ emailLower: email.toLowerCase(), status: "ACTIVE" });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  await refreshTokens.insertOne({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date()
  });
  return { accessToken, refreshToken, user: publicUser(user) };
}

export async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }
  const tokenHash = sha256(refreshToken);
  const { users, refreshTokens } = await collections();
  const token = await refreshTokens.findOne({
    userId: oid(payload.sub),
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
  const user = token ? await users.findOne({ _id: token.userId, status: "ACTIVE" }) : null;
  if (!user) throw new HttpError(401, "Refresh token revoked");
  await refreshTokens.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  const newRefresh = signRefresh(user);
  await refreshTokens.insertOne({
    userId: user._id,
    tokenHash: sha256(newRefresh),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date()
  });
  return { accessToken: signAccess(user), refreshToken: newRefresh, user: publicUser(user) };
}

export async function logout(refreshToken) {
  if (refreshToken) {
    const { refreshTokens } = await collections();
    await refreshTokens.updateOne({ tokenHash: sha256(refreshToken) }, { $set: { revokedAt: new Date() } });
  }
}

function publicUser(user) {
  return { id: user._id.toString(), email: user.email, name: user.name, role: user.role, organizationId: user.organizationId.toString() };
}
