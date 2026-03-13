import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6+ no longer requires these options
      // useNewUrlParser and useUnifiedTopology are now default
    });

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
