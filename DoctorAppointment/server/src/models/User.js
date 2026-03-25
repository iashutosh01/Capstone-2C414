import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Common fields for all roles
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Patient-specific fields
    dateOfBirth: {
      type: Date,
      required: function () {
        return this.role === 'patient';
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: function () {
        return this.role === 'patient';
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        notes: String,
      },
    ],

    // Doctor-specific fields
    specialization: {
      type: String,
      required: function () {
        return this.role === 'doctor';
      },
    },
    licenseNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null
      required: function () {
        return this.role === 'doctor';
      },
    },
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    experience: {
      type: Number, // Years of experience
      required: function () {
        return this.role === 'doctor';
      },
    },
    consultationFee: {
      type: Number,
      required: function () {
        return this.role === 'doctor';
      },
    },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: String, // Format: "09:00"
        endTime: String, // Format: "17:00"
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'break', 'offline'],
      default: 'available',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availabilityUpdatedAt: {
      type: Date,
      default: null,
    },
    availabilityNotes: {
      type: String,
      trim: true,
      maxlength: [250, 'Availability notes cannot exceed 250 characters'],
      default: '',
    },
    maxDailyAppointments: {
      type: Number,
      min: [1, 'Max daily appointments must be at least 1'],
      default: 20,
    },

    // Admin-specific fields
    department: {
      type: String,
      required: function () {
        return this.role === 'admin';
      },
    },
    permissions: {
      type: [String],
      default: [],
    },

    // Timestamps
    lastLogin: Date,
    refreshToken: String,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ role: 1, availabilityStatus: 1 });

userSchema.pre('save', function (next) {
  if (this.role !== 'doctor') {
    this.availableSlots = [];
    this.availabilityStatus = 'offline';
    this.isAvailable = false;
    this.availabilityNotes = '';
    this.availabilityUpdatedAt = this.availabilityUpdatedAt || null;
    return next();
  }

  if (this.isModified('availabilityStatus') || this.isModified('isAvailable')) {
    this.availabilityUpdatedAt = new Date();
    this.isAvailable = this.availabilityStatus === 'available';
  }

  next();
});

const User = mongoose.model('User', userSchema);

export default User;
