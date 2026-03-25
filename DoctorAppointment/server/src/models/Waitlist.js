import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor is required'],
      index: true,
    },
    requestedDate: {
      type: Date,
      required: [true, 'Requested date is required'],
      index: true,
    },
    preferredStartTime: {
      type: String,
      default: '',
    },
    preferredEndTime: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    emergencyLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    noShowHistory: {
      type: Number,
      min: 0,
      default: 0,
    },
    priorityScore: {
      type: Number,
      required: [true, 'Priority score is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'assigned', 'expired', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    assignedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

waitlistSchema.index({ doctor: 1, requestedDate: 1, status: 1, priorityScore: -1, createdAt: 1 });
waitlistSchema.index(
  { patient: 1, doctor: 1, requestedDate: 1, preferredStartTime: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'waiting',
    },
  }
);

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;
