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
      throw err;
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
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex flex-col font-sans">
      <header className="sticky top-0 z-20 bg-white border-b border-[#E6E8E1] px-4 sm:px-6 h-16 flex items-center gap-4">
        <button
          type="button"
          onClick={handleGoToDashboard}
          aria-label="Back to Admin Dashboard"
          className="p-2 rounded-md bg-[#FAFBF8] border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#74796F] hover:text-[#20251F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#526B50] text-white flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-[#20251F] leading-none block">
              Dinning Room
            </span>
            <span className="text-xs text-[#74796F] leading-none block mt-0.5">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#E6E8E1] mx-1 hidden sm:block" />

        <div className="flex-1">
          <h1 className="text-sm font-semibold text-[#20251F]">Add Food Item</h1>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-2xl w-full mx-auto">
        {saved && savedItem ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>

            <h2 className="text-xl font-bold text-[#20251F] mb-1.5">
              Dish Added Successfully
            </h2>
            <p className="text-xs text-[#74796F] max-w-sm mb-4">
              &quot;{savedItem.name}&quot; has been published to the menu.
            </p>

            <div className="flex items-center gap-2 mb-6 flex-wrap justify-center text-xs">
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E6E8E1] text-[#20251F] font-medium">
                {savedItem.category}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-[#E6E8E1] text-[#526B50] font-bold">
                ₹{savedItem.price}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md font-semibold border ${
                  savedItem.isVeg
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {savedItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddAnother}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#526B50] hover:bg-[#40563F] text-white transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Item
              </button>
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-[#74796F] bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] hover:text-[#20251F] transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#20251F]">Add New Dish</h2>
              <p className="text-xs text-[#74796F] mt-1">
                Fill in the dish specifications to update the restaurant menu.
              </p>
            </div>

            <div className="bg-white border border-[#E6E8E1] rounded-xl p-6 shadow-xs">
              <FoodForm
                initialData={null}
                onSave={handleSave}
                onCancel={handleGoToDashboard}
                isModal={false}
                serverError={serverError}
              />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E6E8E1] bg-white py-4 px-6 text-xs text-[#74796F] flex items-center justify-between mt-auto">
        <span>Dinning Room · Admin Portal</span>
        <span>Menu Management</span>
      </footer>
    </div>
  );
}
