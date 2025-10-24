import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin', 'superadmin']
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }
  
  try {
    console.log('Hashing password for admin:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!this.password) {
      console.error('No password hash found for comparison');
      return false;
    }
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Method to remove password from JSON response
adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.__v;
  return admin;
};

// Create index on email for faster lookups
adminSchema.index({ email: 1 });

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;