import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHORIZED,
} from '../../service/shared/http';
import {
  generateAccessToken,
  generateBeauvisionInviteToken,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyBeauvisionInviteToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from '../../service/shared/generateToken';
import { BeauvisionAdmin } from './admin.model';
import {
  IBeauvisionAdminAcceptInvite,
  IBeauvisionAdminAccessUpdate,
  IBeauvisionAdminCreate,
  IBeauvisionAdminInvite,
  IBeauvisionAdminLogin,
  IBeauvisionAdminStatusUpdate,
} from './admin.types';
import {
  sendAdminCredentialsEmail,
  sendAdminInviteEmail,
  sendAdminPasswordResetLinkEmail,
} from '../../service/shared/email.service';
import { BEAUVISION_APP_URL } from '../../Config/env';

const BEAUVISION_BASE_URL = BEAUVISION_APP_URL.replace(/\/$/, '');

function assertValidAdminId(adminId: string) {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new AppError('Invalid admin ID format', BAD_REQUEST);
  }
}

function sanitizeAdmin(admin: any) {
  const adminResponse = admin.toObject();
  delete adminResponse.password;
  return adminResponse;
}

function inviteLinkFor(email: string) {
  const token = generateBeauvisionInviteToken({
    email,
    purpose: 'beauvision-admin-invite',
  });
  return `${BEAUVISION_BASE_URL}/admin/accept-invite#token=${encodeURIComponent(token)}`;
}

export class AdminService {
  static async createAdmin(data: IBeauvisionAdminCreate, requesterRole?: string) {
    if (requesterRole !== 'OWNER') {
      throw new AppError('Only super admins can create admin accounts', FORBIDDEN);
    }

    const existingAdmin = await BeauvisionAdmin.findOne({ email: data.email });
    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', CONFLICT);
    }

    const role = data.role || 'ADMIN';
    const permissions = role === 'OWNER' ? [] : data.permissions || [];
    const salt = await bcrypt.genSalt(10);
    // Use data.password if provided, else generate a random one for them to change later
    const plainPassword = data.password || Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const admin = await BeauvisionAdmin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      role,
      permissions,
      status: 'ACTIVE',
      activatedAt: new Date(),
    });

    await sendAdminCredentialsEmail({
      toEmail: admin.email,
      name: admin.name,
      password: plainPassword,
      loginUrl: `${BEAUVISION_BASE_URL}/admin/login`,
    }).catch((e) => console.error('Failed to send admin credentials:', e));

    return sanitizeAdmin(admin);
  }

  static async inviteAdmin(data: IBeauvisionAdminInvite) {
    const existingAdmin = await BeauvisionAdmin.findOne({ email: data.email });
    if (existingAdmin) {
      throw new AppError('This email already belongs to an existing account', CONFLICT);
    }

    const role = data.role || 'ADMIN';
    const permissions = role === 'OWNER' ? [] : data.permissions || [];
    const fallbackName = data.email.split('@')[0] || 'Admin';
    const name = data.name?.trim() || (fallbackName.length >= 3 ? fallbackName : 'Admin');

    const admin = await BeauvisionAdmin.create({
      name,
      email: data.email,
      password: undefined,
      role,
      permissions,
      status: 'ACTIVE',
      activatedAt: null,
    });

    const sent = await sendAdminInviteEmail(
      admin.email,
      inviteLinkFor(admin.email),
      role === 'OWNER' ? 'SUPER ADMIN' : role
    );

    if (!sent.success) {
      await BeauvisionAdmin.findByIdAndDelete(admin._id);
      throw new AppError(
        'Could not send the invitation email. Please verify the address and try again.',
        CONFLICT
      );
    }

    return {
      message: `Invitation sent to ${admin.email}`,
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }

  static async resendAdminInvite(adminId: string) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    if (admin.password) {
      throw new AppError('This admin has already activated their account', CONFLICT);
    }
    if (admin.status === 'DISABLED') {
      throw new AppError('Cannot resend an invite to a disabled admin', CONFLICT);
    }

    const sent = await sendAdminInviteEmail(
      admin.email,
      inviteLinkFor(admin.email),
      admin.role === 'OWNER' ? 'SUPER ADMIN' : admin.role
    );

    if (!sent.success) {
      throw new AppError(
        'Could not send the invitation email. Please verify the address and try again.',
        CONFLICT
      );
    }

    return {
      message: `Invitation re-sent to ${admin.email}`,
      admin: { id: admin._id.toString(), email: admin.email },
    };
  }

  static async acceptInvite(data: IBeauvisionAdminAcceptInvite) {
    const payload = verifyBeauvisionInviteToken(data.token);

    if (payload.purpose !== 'beauvision-admin-invite') {
      throw new AppError('Invalid invite link', BAD_REQUEST);
    }

    const admin = await BeauvisionAdmin.findOne({
      email: payload.email.trim().toLowerCase(),
    });

    if (!admin) {
      throw new AppError('This invitation is no longer valid', BAD_REQUEST);
    }
    if (admin.password) {
      throw new AppError(
        'This invitation has already been used. Please sign in instead.',
        CONFLICT
      );
    }
    if (admin.status === 'DISABLED') {
      throw new AppError('This account has been disabled. Contact support.', FORBIDDEN);
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(data.newPassword, salt);
    if (data.name) admin.name = data.name;
    admin.activatedAt = new Date();
    await admin.save();

    return { message: 'Account activated. You can now sign in.' };
  }

  static async loginAdmin(data: IBeauvisionAdminLogin) {
    const admin = await BeauvisionAdmin.findOne({ email: data.email });
    if (!admin || !admin.password) {
      throw new AppError('Invalid credentials', UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(data.password, admin.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', UNAUTHORIZED);
    }

    if (admin.status === 'DISABLED') {
      throw new AppError('Your account has been suspended. Contact support.', FORBIDDEN);
    }

    const permissions = admin.role === 'OWNER' ? [] : admin.permissions || [];
    const accessToken = generateAccessToken({
      id: admin._id.toString(),
      role: admin.role,
      adminRoleName: admin.role === 'OWNER' ? 'SUPER ADMIN' : admin.role,
      permissions,
    });
    const refreshToken = generateRefreshToken({
      id: admin._id.toString(),
      role: admin.role,
    });

    return { admin: sanitizeAdmin(admin), accessToken, refreshToken };
  }

  static async getAllAdmins() {
    const admins = await BeauvisionAdmin.find().sort({ createdAt: -1 });

    return admins.map((admin) => ({
      ...sanitizeAdmin(admin),
      pendingInvite: !admin.password,
    }));
  }

  static async deleteAdmin(adminId: string, requesterRole: string) {
    if (requesterRole !== 'OWNER') {
      throw new AppError('Only super admins can delete admin accounts', FORBIDDEN);
    }

    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    if (admin.role === 'OWNER') {
      throw new AppError('Cannot delete the owner account', BAD_REQUEST);
    }

    await BeauvisionAdmin.findByIdAndDelete(adminId);
    return { message: 'Admin deleted successfully' };
  }

  static async updateAdminAccess(adminId: string, data: IBeauvisionAdminAccessUpdate) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }

    if (data.role === 'OWNER') {
      admin.role = 'OWNER';
      admin.permissions = [];
    } else if (data.role === 'ADMIN') {
      if (admin.role === 'OWNER') {
        throw new AppError('Cannot demote the owner account', BAD_REQUEST);
      }
      admin.role = 'ADMIN';
      if (data.permissions !== undefined) {
        admin.permissions = data.permissions;
      }
    } else if (data.permissions !== undefined && admin.role !== 'OWNER') {
      admin.permissions = data.permissions;
    }

    await admin.save();
    return sanitizeAdmin(admin);
  }

  static async updateAdminStatus(
    adminId: string,
    data: IBeauvisionAdminStatusUpdate,
    callerId?: string
  ) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }

    if (callerId === adminId) {
      throw new AppError('You cannot change the status of your own account', CONFLICT);
    }

    if (admin.role === 'OWNER' && data.status === 'DISABLED') {
      throw new AppError('Cannot disable the owner account', BAD_REQUEST);
    }

    if (admin.status === data.status) {
      return {
        message: `Admin is already ${data.status}`,
        admin: { id: admin._id.toString(), status: admin.status },
      };
    }

    admin.status = data.status;
    await admin.save();

    return {
      message:
        data.status === 'DISABLED'
          ? 'Admin disabled successfully'
          : 'Admin reactivated successfully',
      admin: { id: admin._id.toString(), status: admin.status },
    };
  }

  static async getProfile(adminId: string) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId).select('-password');
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    return admin;
  }

  static async updateProfile(adminId: string, name: string) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findByIdAndUpdate(adminId, { name }, { new: true }).select(
      '-password'
    );
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    return admin;
  }

  static async changePassword(adminId: string, currentPass: string, newPass: string) {
    assertValidAdminId(adminId);

    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    if (!admin.password) {
      throw new AppError('This account has not been activated yet', BAD_REQUEST);
    }

    const isMatch = await bcrypt.compare(currentPass, admin.password);
    if (!isMatch) {
      throw new AppError('Incorrect current password', BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPass, salt);
    await admin.save();

    return { message: 'Password changed successfully' };
  }

  static async forgotPassword(email: string) {
    const admin = await BeauvisionAdmin.findOne({ email });
    if (!admin || !admin.password) {
      // Do not reveal if user exists or not
      return { message: 'If that email is registered, a password reset link has been sent.' };
    }

    const token = generatePasswordResetToken({
      email: admin.email,
      purpose: 'password-reset',
      hashPrefix: admin.password.substring(0, 10),
    });
    const resetUrl = `${BEAUVISION_BASE_URL}/admin/reset-password?token=${token}`;

    await sendAdminPasswordResetLinkEmail(admin.email, resetUrl).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    return { message: 'If that email is registered, a password reset link has been sent.' };
  }

  static async resetPassword(token: string, newPass: string) {
    const decoded = verifyPasswordResetToken(token);
    const admin = await BeauvisionAdmin.findOne({ email: decoded.email });
    if (
      !admin ||
      !admin.password ||
      admin.password.substring(0, 10) !== decoded.hashPrefix
    ) {
      throw new AppError('Invalid or expired token', BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPass, salt);
    await admin.save();

    return { message: 'Password has been successfully reset' };
  }

  static async refreshAdminToken(token: string) {
    const decoded = verifyRefreshToken(token);

    const admin = await BeauvisionAdmin.findById(decoded.id);
    if (!admin) {
      throw new AppError('Admin not found or deleted', UNAUTHORIZED);
    }
    if (admin.status === 'DISABLED') {
      throw new AppError('Your account has been suspended. Contact support.', FORBIDDEN);
    }

    const permissions = admin.role === 'OWNER' ? [] : admin.permissions || [];
    const accessToken = generateAccessToken({
      id: admin._id.toString(),
      role: admin.role,
      adminRoleName: admin.role === 'OWNER' ? 'SUPER ADMIN' : admin.role,
      permissions,
    });
    const refreshToken = generateRefreshToken({
      id: admin._id.toString(),
      role: admin.role,
    });

    return { accessToken, refreshToken };
  }
}
