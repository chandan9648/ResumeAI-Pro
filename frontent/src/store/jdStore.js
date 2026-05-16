import { create } from 'zustand';
import { jdService } from '../services/jdService';

const useJDStore = create((set) => ({
  jds: [],
  currentJD: null,
  analyzing: false,
  matchScore: 0,
  missingSkills: [],
  extractedSkills: null,

  analyzeJD: async (data) => {
    set({ analyzing: true });
    try {
      const res = await jdService.analyze(data);
      const { jd, extractedSkills, matchScore, missingSkills } = res.data.data;
      set((state) => ({
        jds: [jd, ...state.jds],
        currentJD: jd,
        extractedSkills,
        matchScore,
        missingSkills,
        analyzing: false,
      }));
      return { success: true, jd, extractedSkills, matchScore, missingSkills };
    } catch (err) {
      set({ analyzing: false });
      return { success: false, message: err.response?.data?.message || 'Analysis failed' };
    }
  },

  fetchJDs: async () => {
    try {
      const res = await jdService.getAll();
      set({ jds: res.data.data.jds });
    } catch (_) {}
  },

  clearCurrentJD: () =>
    set({ currentJD: null, matchScore: 0, missingSkills: [], extractedSkills: null }),
}));

export default useJDStore;
