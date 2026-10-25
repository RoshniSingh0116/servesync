/**
 * FoodForm.jsx
 * ServeSync — Admin Dashboard (Member 3)
 *
 * Reusable controlled form for adding or editing a food item.
 * Used by both AddFoodPage and inline editing in FoodTable.
 */

import { useState, useEffect } from 'react';
import { X, AlertCircle, Save, UtensilsCrossed } from 'lucide-react';
import { CATEGORIES } from '../../mocks/mockData';

// All non-"All" categories from the shared mock data
const FOOD_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: FOOD_CATEGORIES[0] || 'Starters',
  image: '',
  isVeg: true,
  isPopular: false,
  isAvailable: true,
};

/**
 * FoodForm Component
 *
 * @param {Object} props
 * @param {Object|null}  props.initialData   - Pre-filled data when editing; null for add
 * @param {Function}     props.onSave        - Called with the validated form object
 * @param {Function}     [props.onCancel]    - Called when the user cancels
 * @param {boolean}      [props.isModal]     - Render with modal chrome (header + close btn)
 * @param {string}       [props.title]       - Override title shown in modal header
 */
export default function FoodForm({
  initialData = null,
  onSave,
  onCancel,
  isModal = false,
  title,
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initialData || {}) });
  const [errors, setErrors] = useState({});
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Reset when initialData changes (e.g. modal open/close)
  useEffect(() => {
    setForm({ ...EMPTY_FORM, ...(initialData || {}) });
    setErrors({});
    setImagePreviewError(false);
  }, [initialData]);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Food name is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.price && form.price !== 0) {
      errs.price = 'Price is required.';
    } else {
      const p = parseFloat(form.price);
      if (isNaN(p) || p <= 0) errs.price = 'Price must be a positive number.';
    }
    if (!form.category) errs.category = 'Category is required.';
    return errs;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      image: form.image.trim(),
    });
  }

  const formContent = (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Food Name */}
        <div className="sm:col-span-2">
          <label htmlFor="food-name" className="block text-sm font-semibold text-[#F5F5F0] mb-1.5">
            Food Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="food-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Paneer Tikka Masala"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'err-name' : undefined}
            className={inputCls(!!errors.name)}
          />
          {errors.name && <FieldError id="err-name" msg={errors.name} />}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label htmlFor="food-desc" className="block text-sm font-semibold text-[#F5F5F0] mb-1.5">
            Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="food-desc"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of the dish…"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'err-desc' : undefined}
            className={`${inputCls(!!errors.description)} resize-none`}
          />
          {errors.description && <FieldError id="err-desc" msg={errors.description} />}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="food-price" className="block text-sm font-semibold text-[#F5F5F0] mb-1.5">
            Price (₹) <span className="text-rose-400">*</span>
          </label>
          <input
            id="food-price"
            type="number"
            min="1"
            step="1"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="e.g. 299"
            aria-invalid={!!errors.price}
            aria-describedby={errors.price ? 'err-price' : undefined}
            className={inputCls(!!errors.price)}
          />
          {errors.price && <FieldError id="err-price" msg={errors.price} />}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="food-category" className="block text-sm font-semibold text-[#F5F5F0] mb-1.5">
            Category <span className="text-rose-400">*</span>
          </label>
          <select
            id="food-category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            aria-invalid={!!errors.category}
            className={`${inputCls(!!errors.category)} cursor-pointer`}
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-[#171A19]">
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <FieldError id="err-cat" msg={errors.category} />}
        </div>

        {/* Image URL */}
        <div className="sm:col-span-2">
          <label htmlFor="food-image" className="block text-sm font-semibold text-[#F5F5F0] mb-1.5">
            Image URL{' '}
            <span className="text-[#A8B3AA] font-normal text-xs">(optional)</span>
          </label>
          <input
            id="food-image"
            type="url"
            value={form.image}
            onChange={(e) => {
              handleChange('image', e.target.value);
              setImagePreviewError(false);
            }}
            placeholder="https://images.unsplash.com/…"
            className={inputCls(false)}
          />
          {/* Image Preview */}
          {form.image && !imagePreviewError && (
            <div className="mt-2 w-full h-32 rounded-xl overflow-hidden bg-[#38443C] border border-[#38443C]">
              <img
                src={form.image}
                alt="Preview"
                onError={() => setImagePreviewError(true)}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {form.image && imagePreviewError && (
            <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Could not load preview — URL may be invalid.
            </p>
          )}
        </div>

        {/* Toggles Row */}
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Veg / Non-Veg */}
          <ToggleField
            label="Diet Type"
            onLabel="Vegetarian"
            offLabel="Non-Vegetarian"
            checked={form.isVeg}
            onColor="bg-emerald-700"
            offColor="bg-rose-700"
            onChange={(v) => handleChange('isVeg', v)}
          />

          {/* Popular */}
          <ToggleField
            label="Bestseller"
            onLabel="Yes"
            offLabel="No"
            checked={form.isPopular}
            onColor="bg-[#E5B86A]/80"
            offColor="bg-[#38443C]"
            onChange={(v) => handleChange('isPopular', v)}
          />

          {/* Available */}
          <ToggleField
            label="Availability"
            onLabel="Available"
            offLabel="Unavailable"
            checked={form.isAvailable}
            onColor="bg-[#24543A]"
            offColor="bg-[#38443C]"
            onChange={(v) => handleChange('isAvailable', v)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#38443C]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#A8B3AA] bg-[#171A19] border border-[#38443C] hover:text-[#F5F5F0] hover:border-[#82B895]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98] text-[#F5F0E6] border border-[#326B4B] transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg shadow-[#24543A]/20 focus:outline-none focus:ring-2 focus:ring-[#82B895]"
        >
          <Save className="w-4 h-4" />
          {initialData ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </form>
  );

  if (!isModal) return formContent;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="bg-[#222825] border border-[#38443C] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#38443C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#24543A] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-[#E5B86A]" />
            </div>
            <h2 id="food-form-title" className="text-lg font-bold text-[#F5F5F0]">
              {title || (initialData ? 'Edit Food Item' : 'Add New Food Item')}
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close form"
              className="text-[#A8B3AA] hover:text-[#F5F5F0] p-1.5 rounded-lg hover:bg-[#171A19] cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#82B895]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6">{formContent}</div>
      </div>
    </div>
  );
}

/* ─── Local helpers ────────────────────────────────────────────────────── */

function inputCls(hasError) {
  return `
    w-full px-4 py-2.5 rounded-xl bg-[#171A19] border text-sm text-[#F5F5F0]
    placeholder-[#A8B3AA] transition-colors
    focus:outline-none focus:ring-2 focus:ring-[#82B895]/50
    ${hasError ? 'border-rose-600 focus:border-rose-500' : 'border-[#38443C] focus:border-[#82B895]'}
  `;
}

function FieldError({ id, msg }) {
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  );
}

function ToggleField({ label, onLabel, offLabel, checked, onColor, offColor, onChange }) {
  return (
    <div className="bg-[#171A19] border border-[#38443C] rounded-xl p-3 flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#A8B3AA] uppercase tracking-wider">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex w-full items-center justify-center px-3 py-2 rounded-lg
          text-xs font-bold transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[#82B895]
          ${checked ? `${onColor} text-white` : `${offColor} text-[#A8B3AA] hover:text-[#F5F5F0]`}
        `}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${checked ? 'bg-white' : 'bg-[#A8B3AA]'}`} />
          {checked ? onLabel : offLabel}
        </span>
      </button>
    </div>
  );
}
