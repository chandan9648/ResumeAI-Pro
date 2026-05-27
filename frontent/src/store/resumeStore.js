import { create } from 'zustand';
import { resumeService } from '../services/resumeService';

const useResumeStore = create((set, get) => ({
  resumes: [],
  currentResume: null,
  loading: false,
  uploading: false,
  optimizing: false,
  error: null,

  fetchResumes: async () => {
    set({ loading: true });
    try {
      const res = await resumeService.getAll();
      set({ resumes: res.data.data.resumes, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message });
    }
  },

  fetchResume: async (id) => {
    set({ loading: true });
    try {
      const res = await resumeService.getById(id);
      set({ currentResume: res.data.data.resume, loading: false });
      return res.data.data.resume;
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message });
      return null;
    }
  },

  uploadResume: async (formData) => {
    set({ uploading: true });
    try {
      const res = await resumeService.upload(formData);
      const { resume } = res.data.data;
      set((state) => ({ resumes: [resume, ...state.resumes], uploading: false }));
      return { success: true, resume };
    } catch (err) {
      set({ uploading: false });
      const data = err.response?.data;
      if (data?.limitReached) {
        return { success: false, limitReached: true, message: data.message };
      }
      return { success: false, message: data?.message || 'Upload failed' };
    }
  },

  optimizeResume: async (resumeId, jdText, missingSkills) => {
    set({ optimizing: true });
    try {
      const res = await resumeService.optimize({ resumeId, jdText, missingSkills });
      const { resume } = res.data.data;
      set((state) => ({
        optimizing: false,
        currentResume: resume,
        resumes: state.resumes.map((r) => (r._id === resume._id ? resume : r)),
      }));
      return { success: true, resume };
    } catch (err) {
      set({ optimizing: false });
      return { success: false, message: err.response?.data?.message || 'Optimization failed' };
    }
  },

  updateResume: async (id, data) => {
    try {
      const res = await resumeService.update(id, data);
      const { resume } = res.data.data;
      set((state) => ({
        currentResume: resume,
        resumes: state.resumes.map((r) => (r._id === resume._id ? resume : r)),
      }));
      return { success: true, resume };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  reparseResume: async (id) => {
    try {
      const res = await resumeService.reparse(id);
      const { resume } = res.data.data;
      set((state) => ({
        currentResume: resume,
        resumes: state.resumes.map((r) => (r._id === resume._id ? resume : r)),
      }));
      return { success: true, resume };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Re-parse failed' };
    }
  },

  duplicateResume: async (id) => {
    try {
      const res = await resumeService.duplicate(id);
      const { resume } = res.data.data;
      set((state) => ({ resumes: [resume, ...state.resumes] }));
      return { success: true, resume };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  deleteResume: async (id) => {
    try {
      await resumeService.delete(id);
      set((state) => ({
        resumes: state.resumes.filter((r) => r._id !== id),
        currentResume: state.currentResume?._id === id ? null : state.currentResume,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  setCurrentResume: (resume) => set({ currentResume: resume }),
}));

export default useResumeStore;
