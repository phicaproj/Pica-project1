import AppError from '../../service/shared/appError';
import { NOT_FOUND, BAD_REQUEST } from '../../service/shared/http';
import { Blog } from './blog.model';
import { IBlogCreate } from './blog.types';
import mongoose from 'mongoose';
import { deleteObject, extractKeyFromUrl } from '../storage/beauvision.storage.service';

export class BlogService {
  static async createBlog(data: IBlogCreate) {
    if (data.isPublished) {
      return Blog.create({ ...data, publishedAt: new Date() });
    }
    return Blog.create(data);
  }

  static async getAllBlogs(includeUnpublished = false) {
    const filter = includeUnpublished ? {} : { isPublished: true };
    return Blog.find(filter).populate('authorId', 'name email').sort({ createdAt: -1 });
  }

  static async getBlogBySlug(slugOrId: string) {
    let query: any = { slug: slugOrId };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      query = { $or: [{ slug: slugOrId }, { _id: slugOrId }] };
    }
    const blog = await Blog.findOne(query).populate('authorId', 'name email');
    if (!blog) throw new AppError('Blog not found', NOT_FOUND);
    return blog;
  }

  static async updateBlog(blogId: string, data: Partial<IBlogCreate>) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        throw new AppError('Invalid blog ID format', BAD_REQUEST);
    }
    const updateData: any = { ...data };
    if (data.isPublished === true) {
      updateData.publishedAt = new Date();
    }

    const blog = await Blog.findByIdAndUpdate(blogId, updateData, { new: true });
    if (!blog) throw new AppError('Blog not found', NOT_FOUND);
    return blog;
  }

  static async deleteBlog(blogId: string) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        throw new AppError('Invalid blog ID format', BAD_REQUEST);
    }
    const blog = await Blog.findById(blogId);
    if (!blog) throw new AppError('Blog not found', NOT_FOUND);

    // Delete cover image from R2
    if (blog.coverImageUrl) {
      const coverKey = extractKeyFromUrl(blog.coverImageUrl);
      if (coverKey) await deleteObject(coverKey).catch(e => console.error('Failed to delete blog cover from R2:', e));
    }

    await Blog.findByIdAndDelete(blogId);
    return { message: 'Blog deleted successfully' };
  }
}
