import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, clearError, clearMessage } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message, isAuthenticated } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    // Patient fields
    dateOfBirth: '',
    gender: '',
    // Doctor fields
    specialization: '',
    licenseNumber: '',
    experience: '',
    consultationFee: '',
    // Admin fields
    department: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearMessage());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (message && message.includes('Registration successful')) {
      setRegistrationSuccess(true);
    }
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role }));
    setStep(2);
  };

  const validateStep2 = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.phone) {
      errors.phone = 'Phone is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = 'Phone must be 10 digits';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const validateStep3 = () => {
    const errors = {};

    if (selectedRole === 'patient') {
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) errors.gender = 'Gender is required';
    } else if (selectedRole === 'doctor') {
      if (!formData.specialization) errors.specialization = 'Specialization is required';
      if (!formData.licenseNumber) errors.licenseNumber = 'License number is required';
      if (!formData.experience) errors.experience = 'Years of experience is required';
      if (!formData.consultationFee) errors.consultationFee = 'Consultation fee is required';
    } else if (selectedRole === 'admin') {
      if (!formData.department) errors.department = 'Department is required';
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep2();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateStep3();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Prepare data based on role
    const submitData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
    };

    if (selectedRole === 'patient') {
      submitData.dateOfBirth = formData.dateOfBirth;
      submitData.gender = formData.gender;
    } else if (selectedRole === 'doctor') {
      submitData.specialization = formData.specialization;
      submitData.licenseNumber = formData.licenseNumber;
      submitData.experience = parseInt(formData.experience);
      submitData.consultationFee = parseFloat(formData.consultationFee);
    } else if (selectedRole === 'admin') {
      submitData.department = formData.department;
    }

    await dispatch(register(submitData));
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            size="lg"
            fullWidth
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="mb-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our hospital appointment management system
          </p>

          {/* Progress indicator */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Role</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Details</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Complete</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-center text-gray-700 mb-6">Select your role to get started</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleRoleSelect('patient')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Patient</h3>
                  <p className="text-sm text-gray-600 mt-2">Book appointments and manage health records</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('doctor')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Doctor</h3>
                  <p className="text-sm text-gray-600 mt-2">Manage appointments and patient care</p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('admin')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin</h3>
                  <p className="text-sm text-gray-600 mt-2">Manage system and oversee operations</p>
                </div>
              </button>
            </div>

            <div className="text-center pt-4">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Already have an account? <span className="text-blue-600 font-medium">Sign in</span>
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Basic Information */}
        {step === 2 && (
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={formErrors.firstName}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={formErrors.lastName}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="1234567890"
              error={formErrors.phone}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
              required
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                fullWidth
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                fullWidth
              >
                Next
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Role-specific Information */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === 'patient' && (
              <>
                <Input
                  label="Date of Birth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  error={formErrors.dateOfBirth}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gender && <p className="mt-1 text-sm text-red-500">{formErrors.gender}</p>}
                </div>
              </>
            )}

            {selectedRole === 'doctor' && (
              <>
                <Input
                  label="Specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology"
                  error={formErrors.specialization}
                  required
                />
                <Input
                  label="License Number"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  error={formErrors.licenseNumber}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Years of Experience"
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    error={formErrors.experience}
                    required
                  />
                  <Input
                    label="Consultation Fee"
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    error={formErrors.consultationFee}
                    required
                  />
                </div>
              </>
            )}

            {selectedRole === 'admin' && (
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., IT, Operations"
                error={formErrors.department}
                required
              />
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                fullWidth
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
              >
                Create Account
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
