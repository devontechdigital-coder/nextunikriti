import connectDB from './db';
import Setting from '@/models/Setting';

export async function getSettings() {
  try {
    await connectDB();
    const settings = await Setting.find({});
    
    // Transform array of {key, value} to a single object { [key]: value }
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return settingsObj;
  } catch (error) {
    console.error('Error fetching settings on server:', error);
    return {};
  }
}
