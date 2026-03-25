import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNotifications } from '../../redux/slices/appointmentSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.appointments);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        aria-label="View notifications"
      >
        <span className="text-lg">🔔</span>
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
                <div
                  key={notification._id}
                  className={`rounded-xl border px-3 py-3 ${
                    notification.isRead
                      ? 'border-gray-200 bg-white'
                      : 'border-blue-100 bg-blue-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
