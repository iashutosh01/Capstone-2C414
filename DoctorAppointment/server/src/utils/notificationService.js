import Notification from '../models/Notification.js';

export const createNotification = async ({
  recipient,
  relatedAppointment = null,
  type = 'system',
  title,
  message,
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient,
    relatedAppointment,
    type,
    title,
    message,
    metadata,
    channel: 'in-app',
  });

  console.log(`[Notification:${type}] ${message}`);

  return notification;
};
