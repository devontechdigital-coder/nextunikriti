const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://developerseotowebdesign:dIdEytyWNIZApQns@cluster0.qp5ewpv.mongodb.net/unikriti?retryWrites=true&w=majority&appName=Cluster0";

async function checkTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const sample = await mongoose.connection.db.collection('timetables').findOne();
    if (!sample) {
       fs.writeFileSync('type_diag.json', JSON.stringify({ error: 'No data' }));
       process.exit(0);
    }
    
    const types = {
      _id: typeof sample._id,
      batchId: typeof sample.batchId,
      batchId_proto: Object.prototype.toString.call(sample.batchId),
      schoolId: typeof sample.schoolId,
      schoolId_proto: Object.prototype.toString.call(sample.schoolId),
      isBatchIdObjectId: sample.batchId instanceof mongoose.Types.ObjectId,
      sample
    };
    
    fs.writeFileSync('type_diag.json', JSON.stringify(types, null, 2));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('type_diag_error.txt', err.stack);
    process.exit(1);
  }
}

checkTypes();
