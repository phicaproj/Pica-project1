import prisma from '../../Config/db';

export async function logAudit(params: {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        field: params.field,
        oldValue: params.oldValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
