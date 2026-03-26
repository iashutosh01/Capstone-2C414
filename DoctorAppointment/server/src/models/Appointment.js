import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
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
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'scheduled',
        'completed',
        'cancelled',
        'rescheduled',
        'waitlisted',
        'auto-assigned',
      ],
      default: 'scheduled',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    payment: {
      originalAmount: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      receipt: {
        type: String,
        default: '',
      },
      orderId: {
        type: String,
        default: '',
      },
      paymentId: {
        type: String,
        default: '',
      },
      signature: {
        type: String,
        default: '',
      },
      paidAt: {
        type: Date,
        default: null,
      },
      coupon: {
        couponId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Coupon',
          default: null,
        },
        code: {
          type: String,
          default: '',
        },
        discountType: {
          type: String,
          default: '',
        },
        discountValue: {
          type: Number,
          default: 0,
        },
        discountApplied: {
          type: Number,
          default: 0,
        },
      },
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    symptoms: {
      type: [String],
      default: [],
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
      default: 0,
    },
    source: {
      type: String,
      enum: ['manual', 'waitlist-auto'],
      default: 'manual',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending_payment', 'confirmed', 'scheduled', 'rescheduled', 'auto-assigned'] },
    },
  }
);

appointmentSchema.index(
  { patient: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending_payment', 'confirmed', 'scheduled', 'rescheduled', 'auto-assigned'] },
    },
  }
);

appointmentSchema.index({ patient: 1, appointmentDate: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
