export function getOptimizedTripadvisorUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  return originalUrl.replace("/photo-o/", "/photo-m/1280/");
}
