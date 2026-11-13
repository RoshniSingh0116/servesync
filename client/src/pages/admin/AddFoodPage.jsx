/**
 * AddFoodPage.jsx
 * ServeSync — Admin Dashboard (Member 3, Commit 5)
 *
 * Standalone page for adding a new food item.
 * Connected to POST /api/foods via adminApi service.
 * Displays validation messages, loading state, and success feedback.
 *
 * Route: /admin/add-food
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Utensils,
  UtensilsCrossed,
  CheckCircle2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import FoodForm from '../../components/admin/FoodForm';
import { addFoodItem } from '../../services/adminApi';

export default function AddFoodPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [savedItem, setSavedItem] = useState(null);
  const [serverError, setServerError] = useState('');

  async function handleSave(formData) {
    setServerError('');
    try {
      const response = await addFoodItem(formData);
      setSavedItem(response?.food || formData);
      setSaved(true);
    } catch (err) {
      setServerError(err.message || 'Failed to add food item. Please check inputs and try again.');
      throw err; // Let FoodForm handle button state
    }
  }

  function handleAddAnother() {
    setSaved(false);
    setSavedItem(null);
    setServerError('');
  }

  function handleGoToDashboard() {
    navigate('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex flex-col selection:bg-[#24543A] selection:text-[#F5F0E6]">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C] px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Back button */}
        <button
          type="button"
          onClick={handleGoToDashboard}
          aria-label="Back to Admin Dashboard"
          className="p-2 rounded-lg text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center shadow">
            <Utensils className="w-4 h-4 text-[#E5B86A]" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#F5F5F0] leading-none">
              Serve<span className="text-[#E5B86A]">Sync</span>
            </span>
            <span className="text-[10px] text-[#A8B3AA] block uppercase tracking-widest font-medium leading-none mt-0.5">
              Admin
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#38443C] mx-1 hidden sm:block" />

        <div className="flex-1">
          <h1 className="text-sm font-bold text-[#F5F5F0]">Add New Food Item</h1>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 py-8 max-w-3xl w-full mx-auto">
        {saved && savedItem ? (
          /* ── Success State ─────────────────────────────────── */
          <SuccessState
            item={savedItem}
            onAddAnother={handleAddAnother}
            onGoToDashboard={handleGoToDashboard}
          />
        ) : (
          /* ── Form State ────────────────────────────────────── */
          <>
            {/* Page heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#24543A] border border-[#326B4B] flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-[#E5B86A]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#F5F5F0] leading-none">
                    Add Food Item
                  </h2>
                  <p className="text-sm text-[#A8B3AA] mt-1">
                    Fill in the details below to add a new dish to the live MongoDB menu.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Banner if any */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-700/60"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-300 leading-relaxed font-medium">
                  {serverError}
                </p>
              </div>
            )}

            {/* Form card */}
            <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-6 sm:p-8 shadow-xl">
              <FoodForm
                initialData={null}
                onSave={handleSave}
                onCancel={handleGoToDashboard}
                isModal={false}
                serverError={serverError}
              />
            </div>
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#38443C] bg-[#222825] py-4 px-6 text-xs text-[#A8B3AA] flex items-center justify-between mt-auto">
        <span>
          <span className="font-semibold text-[#F5F5F0]">ServeSync</span> · Add Food · Member 3
        </span>
        <span className="text-[#82B895]">Backend Integrated</span>
      </footer>
    </div>
  );
}

/* ─── Success State Component ──────────────────────────────────────────── */
function SuccessState({ item, onAddAnother, onGoToDashboard }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#24543A]/30 border border-[#82B895]/50 flex items-center justify-center mb-5 shadow-lg">
        <CheckCircle2 className="w-8 h-8 text-[#82B895]" />
      </div>

      <h2 className="text-2xl font-black text-[#F5F5F0] mb-2">
        Item Added Successfully!
      </h2>
      <p className="text-sm text-[#A8B3AA] max-w-sm mb-2">
        <span className="font-semibold text-[#F5F5F0]">"{item.name}"</span> has been
        persisted to MongoDB and is live on the menu.
      </p>

      {/* Quick summary */}
      <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
        <span className="px-3 py-1 rounded-full bg-[#222825] border border-[#38443C] text-xs text-[#A8B3AA] font-medium">
          {item.category}
        </span>
        <span className="px-3 py-1 rounded-full bg-[#222825] border border-[#38443C] text-xs text-[#E5B86A] font-bold">
          ₹{item.price}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            item.isVeg
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
              : 'bg-rose-950/40 border-rose-700/60 text-rose-400'
          }`}
        >
          {item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onAddAnother}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98] text-[#F5F0E6] border border-[#326B4B] transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg shadow-[#24543A]/20 focus:outline-none focus:ring-2 focus:ring-[#82B895]"
        >
          <Plus className="w-4 h-4" />
          Add Another Item
        </button>
        <button
          type="button"
          onClick={onGoToDashboard}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#A8B3AA] bg-[#171A19] border border-[#38443C] hover:text-[#F5F5F0] hover:border-[#82B895]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
