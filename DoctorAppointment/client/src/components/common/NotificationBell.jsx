import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationAsRead,
} from '../../redux/slices/appointmentSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.appointments);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await dispatch(markNotificationAsRead(notification._id));
    }

    setOpen(false);

    if (notification.relatedAppointment && user?.role === 'patient') {
      navigate(`/patient/invoice/${notification.relatedAppointment}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        aria-label="View notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-3 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <span className="text-xs text-gray-500">{notifications.length} total</span>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-gray-500">
                No notifications yet.
              </p>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition hover:border-blue-200 hover:shadow-sm ${
                    notification.isRead
                      ? 'border-gray-200 bg-white'
                      : 'border-blue-100 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
