import './Input.css'

export default function Input({
  label,
  error,
  type = 'text',
  id,
  className = '',
  ...props
}) {
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="input-group__label">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        className="input-group__input"
        {...props}
      />
      {error && (
        <span className="input-group__error">{error}</span>
      )}
    </div>
  )
}
