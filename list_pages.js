const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://developerseotowebdesign:dIdEytyWNIZApQns@cluster0.qp5ewpv.mongodb.net/unikriti?retryWrites=true&w=majority&appName=Cluster0";

const pageSchema = new mongoose.Schema({
  title: String,
  slug: String,
  status: String,
});

const Page = mongoose.models.Page || mongoose.model('Page', pageSchema);

async function listPages() {
  try {
    await mongoose.connect(MONGODB_URI);
    const pages = await Page.find({ status: 'published' }, 'title slug');
    console.log('Published Pages:');
    pages.forEach(p => console.log(`- ${p.title}: ${p.slug}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listPages();
