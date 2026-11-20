import { useState } from 'react';
import { X, AlertCircle, Save, UtensilsCrossed } from 'lucide-react';

export const FOOD_CATEGORIES = [
  'Starters',
  'Main Course',
  'Pizza',
  'Burgers',
  'Desserts',
  'Drinks',
];

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

function FieldError({ id, msg }) {
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
}

function inputCls(hasError) {
  return [
    'w-full px-3 py-2 rounded-md bg-white border text-sm text-[#20251F] placeholder:text-[#74796F]',
    'transition-colors duration-150',
    hasError
      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none'
      : 'border-[#E6E8E1] focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20 outline-none',
  ].join(' ');
}

function ToggleField({ label, onLabel, offLabel, checked, onChange }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-[#E6E8E1] bg-[#FAFBF8]">
      <span className="text-xs font-semibold text-[#74796F]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between text-xs font-medium text-[#20251F] cursor-pointer pt-0.5"
      >
        <span>{checked ? onLabel : offLabel}</span>
        <span
          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-150 ${
            checked ? 'bg-[#526B50]' : 'bg-[#E6E8E1]'
          }`}
        >
          <span
            className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-150 ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
      </button>
    </div>
  );
}

export default function FoodForm({
  initialData = null,
  onSave,
  onCancel,
  isModal = false,
  title,
  serverError = '',
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initialData || {}) });
  const [errors, setErrors] = useState({});
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
    if (submitError) setSubmitError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      image: form.image ? form.image.trim() : '',
    };

    try {
      setIsSubmitting(true);
      if (typeof onSave === 'function') {
        await onSave(payload);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to save food item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeError = submitError || serverError;

  const formContent = (
    <form onSubmit={handleSubmit} noValidate>
      {activeError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-700 leading-relaxed font-medium">
            {activeError}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="food-name" className="block text-xs font-semibold text-[#20251F] mb-1">
            Food Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="food-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Truffle Mushroom Crostini"
            aria-invalid={!!errors.name}
            className={inputCls(!!errors.name)}
          />
          {errors.name && <FieldError id="err-name" msg={errors.name} />}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="food-desc" className="block text-xs font-semibold text-[#20251F] mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="food-desc"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of the dish and ingredients…"
            aria-invalid={!!errors.description}
            className={`${inputCls(!!errors.description)} resize-none`}
          />
          {errors.description && <FieldError id="err-desc" msg={errors.description} />}
        </div>

        <div>
          <label htmlFor="food-price" className="block text-xs font-semibold text-[#20251F] mb-1">
            Price (₹) <span className="text-rose-500">*</span>
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
            className={inputCls(!!errors.price)}
          />
          {errors.price && <FieldError id="err-price" msg={errors.price} />}
        </div>

        <div>
          <label htmlFor="food-category" className="block text-xs font-semibold text-[#20251F] mb-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="food-category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={`${inputCls(false)} cursor-pointer`}
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="food-image" className="block text-xs font-semibold text-[#20251F] mb-1">
            Image URL <span className="text-[#74796F] font-normal">(optional)</span>
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
          {form.image && !imagePreviewError && (
            <div className="mt-2.5 w-full h-32 rounded-lg overflow-hidden bg-[#EFF1EA] border border-[#E6E8E1]">
              <img
                src={form.image}
                alt="Preview"
                onError={() => setImagePreviewError(true)}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToggleField
            label="Dietary"
            onLabel="Vegetarian"
            offLabel="Non-Vegetarian"
            checked={form.isVeg}
            onChange={(v) => handleChange('isVeg', v)}
          />
          <ToggleField
            label="Highlight"
            onLabel="Bestseller"
            offLabel="Standard"
            checked={form.isPopular}
            onChange={(v) => handleChange('isPopular', v)}
          />
          <ToggleField
            label="Availability"
            onLabel="Available"
            offLabel="Hidden"
            checked={form.isAvailable}
            onChange={(v) => handleChange('isAvailable', v)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E6E8E1]">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-xs font-semibold text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md text-xs font-semibold bg-[#526B50] hover:bg-[#40563F] text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Dish</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  if (!isModal) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#20251F]/40 backdrop-blur-xs"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white border border-[#E6E8E1] rounded-xl shadow-lg z-10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E8E1] bg-[#FAFBF8]">
          <h3 className="text-base font-bold text-[#20251F]">
            {title || (initialData ? 'Edit Dish' : 'Add Food Item')}
          </h3>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-md text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-5 max-h-[calc(85vh-80px)] overflow-y-auto">
          {formContent}
        </div>
      </div>
    </div>
  );
}
