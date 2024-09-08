const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Config = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
};

const s3Client = new S3Client(s3Config);

// for unique file name
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }

    const file = req.file;
    const key = randomImageName();
    const fileExtension = file.originalname.split('.').pop();

    // Determine the content type based on the file extension
    const contentType = fileExtension === 'pdf' ? 'application/pdf' : file.mimetype;

    const bucketParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${key}.${fileExtension}`,
      Body: file.buffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(bucketParams));

    const fileUrl = `${process.env.S3_BUCKET_URL}/${key}.${fileExtension}`;

    res.status(200).json({ status: 'success', uploadedUrl: fileUrl });
  } catch (err) {
    console.error('Error', err);
    res.status(500).json({ status: 'fail', message:err.message });
  }
};

module.exports = uploadImage;