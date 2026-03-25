import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ name: 1 });

    const normalizedCategories = categories.map(cat => {
      const obj = cat.toObject();
      obj._id = obj._id.toString(); 
      obj.parentId = obj.parentId ? obj.parentId.toString() : null;
      return obj;
    });

    return NextResponse.json({ success: true, data: normalizedCategories });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, slug, icon, image, parentId,
      description, shortDescription, highlights, faq,
      metaTitle, metaDescription, metaKeywords
    } = await req.json();
    console.log('Category POST Request:', { name, parentId });

    await connectDB();

    const castedParentId = parentId && mongoose.Types.ObjectId.isValid(parentId)
      ? new mongoose.Types.ObjectId(parentId)
      : null;

    const category = await Category.create({
      name,
      slug,
      icon,
      image,
      parentId: castedParentId,
      description,
      shortDescription,
      highlights,
      faq,
      metaTitle,
      metaDescription,
      metaKeywords
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Category POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      id, name, slug, icon, image, parentId,
      description, shortDescription, highlights, faq,
      metaTitle, metaDescription, metaKeywords
    } = await req.json();
    console.log('Category PUT Request:', { id, name, parentId });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid Category ID' }, { status: 400 });
    }

    await connectDB();
    
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    category.name = name;
    category.slug = slug;
    category.icon = icon;
    category.image = image;
    category.description = description;
    category.shortDescription = shortDescription;
    category.highlights = highlights;
    category.faq = faq;
    category.metaTitle = metaTitle;
    category.metaDescription = metaDescription;
    category.metaKeywords = metaKeywords;
    
    category.parentId = parentId && mongoose.Types.ObjectId.isValid(parentId)
      ? new mongoose.Types.ObjectId(parentId)
      : null;
    
    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Category PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await connectDB();
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
