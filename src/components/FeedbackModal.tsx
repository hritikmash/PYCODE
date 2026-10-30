import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Star, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Gauge, 
  Sliders, 
  Send,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UPGRADE_OPTIONS = [
  'Code Editor & Autocomplete',
  'AI Response Generation Speed',
  'Python Execution Sandbox',
  'Error Diagnostics & Line Highlighting',
  'Flowchart & Complexity Analyzer',
  'Multi-Device Sync',
  'Dark/Light Theme Customization',
  'Sample Code Library & Tutorials'
];

export const FeedbackModal: React.FC = () => {
  const { isFeedbackModalOpen, closeFeedbackModal, user } = useAuth();

  const [performanceRating, setPerformanceRating] = useState<number>(5);
  const [speedCategory, setSpeedCategory] = useState<'lightning' | 'good' | 'average' | 'sluggish'>('good');
  const [accuracyRating, setAccuracyRating] = useState<number>(5);
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [customUpgrade, setCustomUpgrade] = useState('');
  const [addSuggestions, setAddSuggestions] = useState('');
  const [comments, setComments] = useState('');
  const [submitterName, setSubmitterName] = useState(user?.name || '');
  const [submitterEmail, setSubmitterEmail] = useState(user?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isFeedbackModalOpen) return null;

  const toggleUpgradeOption = (opt: string) => {
    if (selectedUpgrades.includes(opt)) {
      setSelectedUpgrades(selectedUpgrades.filter(item => item !== opt));
    } else {
      setSelectedUpgrades([...selectedUpgrades, opt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const allUpgrades = [...selectedUpgrades];
    if (customUpgrade.trim() && !allUpgrades.includes(customUpgrade.trim())) {
      allUpgrades.push(customUpgrade.trim());
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          performanceRating,
          speedCategory,
          accuracyRating,
          upgradeFields: allUpgrades,
          addSuggestions,
          comments,
          userName: submitterName.trim() || user?.name || 'Anonymous',
          userEmail: submitterEmail.trim() || user?.email || undefined
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
      if (!res.ok) {
        throw new Error(data.error || `Failed to submit feedback (${res.status})`);
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error sending feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    closeFeedbackModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-2xl bg-[#1e1f20] border border-[#282a2c] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282a2c] bg-[#171819]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white tracking-tight">Pycode Feedback & Ideas</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800">
                  Site Performance
                </span>
              </div>
              <p className="text-xs text-[#8e918f]">
                Help us upgrade Pycode: tell us how the site performs and what we should build next!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeFeedbackModal}
            className="p-2 rounded-xl hover:bg-[#282a2c] text-[#8e918f] hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSubmitted ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-600/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">Thank you for your feedback!</h4>
              <p className="text-xs text-[#8e918f] max-w-md mx-auto">
                Your ratings and suggestions regarding site performance and upgrade fields have been recorded and sent to the Pycode team.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Back to Python Studio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 [scrollbar-width:thin]">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Performance & Speed Rating */}
            <div className="p-4 rounded-2xl bg-[#171819] border border-[#282a2c] space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>1. How is the overall site performance & speed?</span>
              </div>

              {/* 1-5 Star Visual Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPerformanceRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= performanceRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-[#3b3d40]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-[#c4c7c5]">
                  {performanceRating === 5 && '⚡ Lightning Fast & Smooth'}
                  {performanceRating === 4 && '🚀 Very Fast'}
                  {performanceRating === 3 && '👍 Stable & Good'}
                  {performanceRating === 2 && '🐢 Slightly Sluggish'}
                  {performanceRating === 1 && '⚠️ Needs Work & Laggy'}
                </span>
              </div>

              {/* Speed Category Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { id: 'lightning', label: '⚡ Ultra Fast' },
                  { id: 'good', label: '🚀 Responsive' },
                  { id: 'average', label: '⚖️ Average' },
                  { id: 'sluggish', label: '🐢 Laggy' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSpeedCategory(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      speedCategory === item.id
                        ? 'bg-sky-950/70 text-sky-300 border-sky-600/80 shadow-xs'
                        : 'bg-[#1e1f20] text-[#8e918f] border-[#282a2c] hover:border-[#3b3d40] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Fields that need to be upgraded */}
            <div className="p-4 rounded-2xl bg-[#171819] border border-[#282a2c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>2. Which areas or fields need to be upgraded?</span>
                </div>
                <span className="text-[11px] text-[#8e918f]">(Select all that apply)</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {UPGRADE_OPTIONS.map((opt) => {
                  const isSelected = selectedUpgrades.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleUpgradeOption(opt)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500 font-medium'
                          : 'bg-[#1e1f20] text-[#8e918f] border-[#282a2c] hover:border-[#3b3d40] hover:text-white'
                      }`}
                    >
                      {opt} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customUpgrade}
                onChange={(e) => setCustomUpgrade(e.target.value)}
                placeholder="Other field or feature that needs an upgrade..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none mt-2"
              />
            </div>

            {/* Section 3: What should we add next? */}
            <div className="p-4 rounded-2xl bg-[#171819] border border-[#282a2c] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>3. What new features or tools should we add?</span>
              </div>
              <textarea
                value={addSuggestions}
                onChange={(e) => setAddSuggestions(e.target.value)}
                placeholder="e.g. Add NumPy & Pandas visualization, export code to Jupyter Notebook, real-time multiplayer code sharing, Python unit test generator..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none resize-none"
              />
            </div>

            {/* Section 4: General feedback / comments */}
            <div className="p-4 rounded-2xl bg-[#171819] border border-[#282a2c] space-y-2.5">
              <label className="block text-xs font-semibold text-white">
                4. Any additional comments or thoughts?
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us what you loved or what caused friction during your Python debugging session..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1f20] border border-[#282a2c] text-xs text-white placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none resize-none"
              />
            </div>

            {/* Submitter details (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#8e918f] mb-1">Your Name (optional)</label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2 rounded-xl bg-[#171819] border border-[#282a2c] text-white text-xs placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#8e918f] mb-1">Your Email (optional)</label>
                <input
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#171819] border border-[#282a2c] text-white text-xs placeholder-[#5e6160] focus:border-[#a8c7fa] outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeFeedbackModal}
                className="px-4 py-2 rounded-full text-xs text-[#8e918f] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
