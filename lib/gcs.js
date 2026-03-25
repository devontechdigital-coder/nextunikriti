import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCP_BUCKET_NAME || 'lms-secure-videos';

export const bucket = storage.bucket(bucketName);

/**
 * Configure CORS for the bucket to allow browser-based uploads
 */
export async function setupCors() {
  await bucket.setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
      origin: ['*'], // In production, replace with specific domain
      responseHeader: ['Content-Type', 'x-goog-resumable'],
    },
  ]);
  console.log('CORS configuration applied to bucket:', bucketName);
}

/**
 * List files and virtual "folders" (prefixes) in a bucket
 * @param {string} prefix 
 */
export async function listFiles(prefix = '') {
  const cleanPrefix = prefix.endsWith('/') || prefix === '' ? prefix : `${prefix}/`;
  const [files, , apiResponse] = await bucket.getFiles({
    prefix: cleanPrefix,
    delimiter: '/',
  });

  const folders = apiResponse?.prefixes || [];
  
  // Also include files that end with / as folders (GCS folder placeholders)
  files.forEach(file => {
    if (file.name.endsWith('/') && file.name !== cleanPrefix) {
      if (!folders.includes(file.name)) {
        folders.push(file.name);
      }
    }
  });

  const fileList = files
    .filter(file => !file.name.endsWith('/')) // Exclude folder placeholders from files list
    .map(file => ({
      name: file.name,
      id: file.id,
      metadata: file.metadata,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
    }));

  return { files: fileList, folders };
}

/**
 * Delete a file or a "folder" (everything under a prefix)
 * @param {string} name 
 */
export async function deleteFile(name) {
  if (name.endsWith('/')) {
    // Delete all files with this prefix (recursive folder delete)
    await bucket.deleteFiles({ prefix: name });
    // Also try to delete the folder placeholder explicitly if it wasn't caught
    try { await bucket.file(name).delete(); } catch (e) {}
  } else {
    try {
      await bucket.file(name).delete();
    } catch (error) {
      if (error.code !== 404) throw error;
    }
  }
}

export async function renameFile(oldName, newName) {
  if (oldName.endsWith('/')) {
    const [files] = await bucket.getFiles({ prefix: oldName });
    if (files.length === 0) {
      // Try to move just the placeholder if no files under it
      try { await bucket.file(oldName).move(newName); } catch (e) {}
    } else {
      await Promise.all(
        files.map(async (file) => {
          const relativePath = file.name.substring(oldName.length);
          const targetName = `${newName}${relativePath}`;
          await file.move(targetName);
        })
      );
    }
  } else {
    const file = bucket.file(oldName);
    await file.move(newName);
  }
}

/**
 * Create a virtual folder placeholder
 * @param {string} folderPath 
 */
export async function createFolder(folderPath) {
  const name = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  await bucket.file(name).save('');
}

/**
 * Generate a signed URL for uploading to GCS directly from client
 * @param {string} filename 
 * @param {string} contentType 
 */
export async function generateV4UploadSignedUrl(filename, contentType) {
  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  };

  const [url] = await bucket.file(filename).getSignedUrl(options);
  return url;
}

/**
 * Generate a signed URL for secure download/streaming access
 * @param {string} filename 
 */
export async function generateV4ReadSignedUrl(filename) {
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  };

  const [url] = await bucket.file(filename).getSignedUrl(options);
  return url;
}
