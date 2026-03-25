import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  appointments: [],
  doctors: [],
  notifications: [],
  doctorSchedule: [],
  adminStats: null,
  doctorUtilization: [],
  loading: false,
  actionLoading: false,
  error: null,
  successMessage: null,
};

const getErrorMessage = (error, fallback) => {
  return error.response?.data?.error?.message || fallback;
};

export const bookAppointment = createAsyncThunk(
  'appointments/bookAppointment',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/appointments/book', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to book appointment'));
    }
  }
);

export const getMyAppointments = createAsyncThunk(
  'appointments/getMyAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/appointments/my');
      return response.data.data.appointments;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch appointments'));
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async ({ id, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/appointments/cancel/${id}`, {
        data: { cancellationReason },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to cancel appointment'));
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'appointments/rescheduleAppointment',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/appointments/reschedule/${id}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to reschedule appointment'));
    }
  }
);

export const getNotifications = createAsyncThunk(
  'appointments/getNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/appointments/notifications');
      return response.data.data.notifications;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch notifications'));
    }
  }
);

export const getDoctors = createAsyncThunk(
  'appointments/getDoctors',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/doctors', { params });
      return response.data.data.doctors;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch doctors'));
    }
  }
);

export const getDoctorSchedule = createAsyncThunk(
  'appointments/getDoctorSchedule',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/doctors/schedule');
      return response.data.data.schedule;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch doctor schedule'));
    }
  }
);

export const updateDoctorAvailability = createAsyncThunk(
  'appointments/updateDoctorAvailability',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.put('/doctors/availability', payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update availability'));
    }
  }
);

export const getAdminDashboardStats = createAsyncThunk(
  'appointments/getAdminDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch dashboard stats'));
    }
  }
);

export const getDoctorUtilization = createAsyncThunk(
  'appointments/getDoctorUtilization',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/utilization');
      return response.data.data.utilization;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch doctor utilization'));
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearAppointmentError: (state) => {
      state.error = null;
    },
    clearAppointmentSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bookAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = action.payload.message;

        if (action.payload.data.appointment) {
          state.appointments = [action.payload.data.appointment, ...state.appointments];
        }
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(getMyAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(getMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const updatedAppointment = action.payload.data.appointment;
        state.actionLoading = false;
        state.successMessage = action.payload.message;
        state.appointments = state.appointments.map((appointment) =>
          appointment._id === updatedAppointment._id ? updatedAppointment : appointment
        );
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(rescheduleAppointment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const cancelledAppointment = action.payload.data.cancelledAppointment;
        const replacementAppointment = action.payload.data.appointment || null;
        state.actionLoading = false;
        state.successMessage = action.payload.message;
        state.appointments = state.appointments.map((appointment) =>
          appointment._id === cancelledAppointment._id ? cancelledAppointment : appointment
        );

        if (replacementAppointment) {
          state.appointments = [replacementAppointment, ...state.appointments];
        }
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(getNotifications.pending, (state) => {
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(getDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = action.payload;
      })
      .addCase(getDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getDoctorSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctorSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorSchedule = action.payload;
      })
      .addCase(getDoctorSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateDoctorAvailability.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateDoctorAvailability.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.successMessage = 'Availability updated successfully';

        if (action.payload.autoAssignedAppointment) {
          state.doctorSchedule = [action.payload.autoAssignedAppointment, ...state.doctorSchedule];
        }
      })
      .addCase(updateDoctorAvailability.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(getAdminDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.adminStats = action.payload;
      })
      .addCase(getAdminDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getDoctorUtilization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDoctorUtilization.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorUtilization = action.payload;
      })
      .addCase(getDoctorUtilization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAppointmentError, clearAppointmentSuccess } = appointmentSlice.actions;

export default appointmentSlice.reducer;
