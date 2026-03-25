import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  url: { 
    type: String, 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Menu', 
    default: null 
  },
  order: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  type: { 
    type: String, 
    enum: ['header', 'footer'], 
    default: 'header' 
  },
  footerSection: { 
    type: String, 
    default: 'Quick Links' 
  }
}, { timestamps: true, strict: false });

// Force clear model to handle Next.js hot reloading
if (mongoose.models.Menu) {
  delete mongoose.models.Menu;
}

export default mongoose.model('Menu', menuSchema);
