import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  hoverable = false,
  ...rest
}: CardProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
        hoverable ? "transition-shadow hover:shadow-md" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardImageProps {
  src?: string;
  alt?: string;
  fallback?: string;
}

Card.Image = function CardImage({ src, alt, fallback }: CardImageProps) {
  return (
    <div className="aspect-[4/3] w-full bg-slate-100">
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium">{fallback || "No image"}</span>
        </div>
      )}
    </div>
  );
};

Card.Body = function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-1 flex-col gap-1 p-4 ${className}`}>{children}</div>;
};

Card.Title = function CardTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-base font-semibold text-slate-900">{children}</h4>;
};

Card.Description = function CardDescription({ children }: { children: ReactNode }) {
  return <p className="line-clamp-2 text-sm text-slate-500">{children}</p>;
};

Card.Footer = function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-slate-100 p-4 pt-3">{children}</div>;
};
