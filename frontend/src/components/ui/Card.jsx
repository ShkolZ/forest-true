import './Card.css'

export default function Card({ children, className = '', hoverable = false, onClick, ...props }) {
  return (
    <div
      className={`card ${hoverable ? 'card--hoverable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Image = function CardImage({ src, alt, fallback }) {
  return (
    <div className="card__image">
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="card__image-fallback">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          </svg>
          <span>{fallback || 'No image'}</span>
        </div>
      )}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`card__body ${className}`}>{children}</div>
}

Card.Title = function CardTitle({ children }) {
  return <h4 className="card__title">{children}</h4>
}

Card.Description = function CardDescription({ children }) {
  return <p className="card__description">{children}</p>
}

Card.Footer = function CardFooter({ children }) {
  return <div className="card__footer">{children}</div>
}
