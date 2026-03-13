import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import Button from '../../components/common/Button';

const DoctorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Dr. {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-gray-600">Specialization: {user?.specialization}</p>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Phone: {user?.phone}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-green-100 p-3 rounded-full w-12 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Today's Appointments</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-blue-100 p-3 rounded-full w-12 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Total Patients</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-purple-100 p-3 rounded-full w-12 mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Availability Status</h3>
            <p className="text-lg font-medium text-green-600">Available</p>
          </div>
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Doctor Portal Features Coming Soon</h3>
          <p className="text-green-800">
            Manage appointments, view patient records, set availability, and more features will be available soon.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
