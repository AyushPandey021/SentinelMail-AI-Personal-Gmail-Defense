import { collections, oid } from "../../db/mongo.js";

export function audit({ organizationId, userId = null, action, entityType, entityId = null, metadata = {} }) {
  return collections().then(({ auditLogs }) =>
    auditLogs.insertOne({
      organizationId: oid(organizationId),
      userId: userId ? oid(userId) : null,
      action,
      entityType,
      entityId: entityId ? oid(entityId) : null,
      metadata,
      createdAt: new Date()
    })
  );
}
