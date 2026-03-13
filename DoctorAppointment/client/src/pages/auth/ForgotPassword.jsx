import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotPassword, clearError, clearMessage } from '../../redux/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearMessage());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      setEmailSent(true);
    }
  }, [message]);

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    await dispatch(forgotPassword(email));
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <p className="text-sm text-gray-500 mb-6">
            If you don't see the email, check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setEmailSent(false);
                dispatch(clearMessage());
              }}
              variant="outline"
              fullWidth
            >
              Try Different Email
            </Button>
            <Link to="/login">
              <Button variant="primary" fullWidth>
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            placeholder="you@example.com"
            error={emailError}
            required
            autoComplete="email"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Send Reset Link
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
