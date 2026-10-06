import bcrypt from 'bcrypt';
import AppError from '../../service/shared/appError';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../../service/shared/http';
import {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from '../../service/shared/generateToken';
import { BeauvisionAdmin } from './admin.model';
import { IBeauvisionAdminCreate, IBeauvisionAdminLogin } from './admin.types';
import { sendAdminCredentialsEmail, sendAdminPasswordResetLinkEmail } from '../../service/shared/email.service';
import mongoose from 'mongoose';

export class AdminService {
  static async createAdmin(data: IBeauvisionAdminCreate, requesterRole?: string) {
    if (requesterRole !== 'OWNER' && data.role === 'OWNER') {
      throw new AppError('Only owners can create an owner account', UNAUTHORIZED);
    }
    if (requesterRole !== 'OWNER') {
       throw new AppError('Only owners can create admin accounts', UNAUTHORIZED);
    }

    const existingAdmin = await BeauvisionAdmin.findOne({ email: data.email });
    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', BAD_REQUEST);
    }

    const salt = await bcrypt.genSalt(10);
    // Use data.password if provided, else generate a random one for them to change later
    const plainPassword = data.password || Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const admin = await BeauvisionAdmin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: data.role || 'ADMIN',
    });

    // Send email with plainPassword
    await sendAdminCredentialsEmail({
      toEmail: admin.email,
      name: admin.name,
      password: plainPassword,
      loginUrl: 'https://beauvision.com/admin/login', // Adjust this as needed
    }).catch((e) => console.error('Failed to send admin credentials:', e));

    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;
    return adminResponse;
  }

  static async loginAdmin(data: IBeauvisionAdminLogin) {
    const admin = await BeauvisionAdmin.findOne({ email: data.email });
    if (!admin) {
      throw new AppError('Invalid credentials', UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(data.password || '', admin.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', UNAUTHORIZED);
    }

    const accessToken = generateAccessToken({ id: admin._id.toString(), role: admin.role });
    const refreshToken = generateRefreshToken({ id: admin._id.toString(), role: admin.role });

    const adminResponse = admin.toObject();
    delete (adminResponse as any).password;

    return { admin: adminResponse, accessToken, refreshToken };
  }

  static async getAllAdmins() {
    return BeauvisionAdmin.find().select('-password');
  }

  static async deleteAdmin(adminId: string, requesterRole: string) {
    if (requesterRole !== 'OWNER') {
      throw new AppError('Only owners can delete admin accounts', UNAUTHORIZED);
    }
    
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new AppError('Invalid admin ID format', BAD_REQUEST);
    }
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

  static async getProfile(adminId: string) {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new AppError('Invalid admin ID format', BAD_REQUEST);
    }
    const admin = await BeauvisionAdmin.findById(adminId).select('-password');
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    return admin;
  }

  static async updateProfile(adminId: string, name: string) {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new AppError('Invalid admin ID format', BAD_REQUEST);
    }
    const admin = await BeauvisionAdmin.findByIdAndUpdate(adminId, { name }, { new: true }).select(
      '-password'
    );
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
    }
    return admin;
  }

  static async changePassword(adminId: string, currentPass: string, newPass: string) {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new AppError('Invalid admin ID format', BAD_REQUEST);
    }
    const admin = await BeauvisionAdmin.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', NOT_FOUND);
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
    if (!admin) {
      // Do not reveal if user exists or not
      return { message: 'If that email is registered, a password reset link has been sent.' };
    }

    const token = generatePasswordResetToken({
      email: admin.email,
      purpose: 'password-reset',
      hashPrefix: admin.password.substring(0, 10),
    });
    const resetUrl = `https://beauvisiongroup.com/admin/reset-password?token=${token}`;

    await sendAdminPasswordResetLinkEmail(admin.email, resetUrl).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    return { message: 'If that email is registered, a password reset link has been sent.' };
  }

  static async resetPassword(token: string, newPass: string) {
    const decoded = verifyPasswordResetToken(token);
    const admin = await BeauvisionAdmin.findOne({ email: decoded.email });
    if (!admin || admin.password.substring(0, 10) !== decoded.hashPrefix) {
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
    
    const accessToken = generateAccessToken({ id: admin._id.toString(), role: admin.role });
    const refreshToken = generateRefreshToken({ id: admin._id.toString(), role: admin.role });
    
    return { accessToken, refreshToken };
  }
}
