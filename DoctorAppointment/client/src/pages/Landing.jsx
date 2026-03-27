import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';

const Landing = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    const routes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
    };
    return routes[user.role] || '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">TeleHealth🩺

                </span>
                <p className="text-xs text-gray-500 hidden sm:block">AI-Powered Healthcare</p>
              </div>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                    <Avatar
                      src={user?.profileImage}
                      name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                      size="sm"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <Link to={getDashboardRoute()}>
                    <Button variant="primary" size="md">Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="md" className="px-3 sm:px-4">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="md" className="px-3 sm:px-4">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-4">
                <span className="bg-blue-50 border border-blue-200 shadow-sm text-blue-700 text-sm font-medium px-4 py-2 rounded-full">
                  Trusted by 100+ Healthcare Facilities
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                AI-Powered Doctor Appointment
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mt-2">
                  Management System
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl">
                Transform your healthcare facility with intelligent appointment scheduling.
                <span className="font-semibold text-gray-900"> Reduce wait times by 60%</span> and
                <span className="font-semibold text-gray-900"> increase efficiency by 40%</span> with our AI-powered smart allocation system.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full">
                    Get Started Free
                    <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">HIPAA Compliant</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right Content - Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl p-8 shadow-2xl ring-1 ring-slate-900/5">
                <div className="bg-white rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Today's Schedule</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Live</span>
                  </div>
                  {/* Mock Calendar */}
                  <div className="space-y-4">
                    {[
                      { time: '09:00 AM', patient: 'Sarah Johnson', status: 'completed' },
                      { time: '10:30 AM', patient: 'Mike Davis', status: 'in-progress' },
                      { time: '11:45 AM', patient: 'Emma Wilson', status: 'scheduled' },
                      { time: '02:00 PM', patient: '3 in Waitlist', status: 'waitlist' },
                    ].map((apt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{apt.patient}</p>
                            <p className="text-sm text-gray-500">{apt.time}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          apt.status === 'waitlist' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.status.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-100 hidden sm:block">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">60%</p>
                    <p className="text-sm text-gray-500">Faster Processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, intelligent, and efficient - our AI-powered system streamlines the entire appointment process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-green-200 to-blue-200"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white border-4 border-blue-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg mx-auto">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center"> Doctor Marks Availability </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Doctors set their availability and the system creates optimized time slots automatically and it helps in optimizing wait times 
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-blue-50 p-4 rounded-xl w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-semibold">Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white border-4 border-green-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg mx-auto">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Patient Books or Joins Waitlist</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Patients book available slots instantly or join an intelligent waitlist for automatic allocation
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-green-50 p-4 rounded-xl w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Queue:</span>
                      <span className="text-green-600 font-semibold">3 waiting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white border-4 border-indigo-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg mx-auto">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">AI Allocates Slots Intelligently</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Our AI optimizes scheduling based on priority, doctor availability, and patient needs
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-indigo-50 p-4 rounded-xl w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">AI Active:</span>
                      <span className="text-indigo-600 font-semibold">Optimizing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage appointments efficiently and improve patient care
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Doctor Presence</h3>
              <p className="text-gray-600 leading-relaxed">
                Live tracking of doctor availability with instant updates to prevent scheduling conflicts
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Waitlist</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart queue management with predictive analytics for optimal patient flow and reduced wait times
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Appointment Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete appointment lifecycle management with reminders, rescheduling, and cancellation handling
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Patient Portal</h3>
              <p className="text-gray-600 leading-relaxed">
                Secure patient access to medical history, appointments, prescriptions, and lab results
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Admin Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive analytics and reporting with real-time insights for data-driven decisions
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Fully responsive design for seamless access on smartphones, tablets, and desktops
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Notifications</h3>
              <p className="text-gray-600 leading-relaxed">
                Automated reminders and notifications via SMS, email, and push notifications
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Compliant</h3>
              <p className="text-gray-600 leading-relaxed">
                HIPAA compliant with end-to-end encryption and robust security measures
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our System Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Healthcare Providers Choose TeleHealth🩺
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Transform your healthcare facility with measurable results and improved patient satisfaction
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    ),
                    title: 'Faster OPD Movement',
                    description: 'Reduce patient processing time by 60% with automated scheduling and smart queue management'
                  },
                  {
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                    title: 'Reduced Wait Times',
                    description: 'Cut average waiting time from 2 hours to 30 minutes with AI-powered slot allocation'
                  },
                  {
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    ),
                    title: 'Efficient Resource Allocation',
                    description: 'Optimize doctor schedules and facility resources with data-driven insights'
                  },
                  {
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                    title: 'Improved Patient Satisfaction',
                    description: 'Achieve 95% patient satisfaction with transparent scheduling and reduced delays'
                  }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {benefit.icon}
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { number: '100+', label: 'Healthcare Facilities', color: 'from-blue-500 to-blue-600' },
                { number: '50K+', label: 'Appointments/Month', color: 'from-green-500 to-green-600' },
                { number: '95%', label: 'Patient Satisfaction', color: 'from-indigo-500 to-indigo-600' },
                { number: '60%', label: 'Time Saved', color: 'from-purple-500 to-purple-600' }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Facility?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join hundreds of healthcare providers who have already improved their patient care with our AI-powered system
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 w-full"
              >
                Get Started Free
                <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 w-full"
              >
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 text-sm">
            No credit card required • Free 30-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-2xl font-bold">TeleHealth🩺</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-Powered Doctor Appointment Management System helping healthcare facilities reduce wait times and improve patient care.
              </p>
              <div className="flex space-x-4">
                {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-gray-600 rounded"></div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Features', 'How It Works', 'Pricing', 'About Us', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                {['Help Center', 'Documentation', 'API Reference', 'Privacy Policy', 'Terms of Service'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} TeleHealth🩺. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Made with care for better healthcare
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
