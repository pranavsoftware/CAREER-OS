/**
 * FormField: label + input wrapper.
 * type: text | textarea | select | number | date | email | password
 * options: for select type [{ value, label }] or string[]
 */
export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  options,
  required,
  placeholder,
  disabled,
  rows = 4,
  min,
  max,
  step,
  children,
}) {
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    fontSize: 14,
    color: '#111827',
    background: disabled ? '#F9FAFB' : '#fff',
    outline: 'none',
  };

  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e.target.value);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          {label}{required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
        </label>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          style={{ ...inputStyle, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          {!required && <option value="">-- Select --</option>}
          {(options || []).map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          style={inputStyle}
        />
      )}
    </div>
  );
}
