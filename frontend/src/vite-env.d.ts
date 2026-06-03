/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, never>
  export default content
}
