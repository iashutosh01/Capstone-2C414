import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { resendVerificationEmail, verifyEmail } from '../../redux/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

const VerifyEmail = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token && !verificationAttempted) {
      dispatch(verifyEmail(token));
      setVerificationAttempted(true);
    }
  }, [token, dispatch, verificationAttempted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            The verification link may have expired or is invalid. Please try registering again or contact support.
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email to resend verification"
            className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-3">
            <Button
              onClick={() => dispatch(resendVerificationEmail(email))}
              variant="secondary"
              fullWidth
              disabled={!email}
            >
              Resend Verification
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="primary"
              fullWidth
            >
              Register Again
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              fullWidth
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been successfully verified. You can now sign in and start using the platform.
          </p>
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

  return null;
};

export default VerifyEmail;
