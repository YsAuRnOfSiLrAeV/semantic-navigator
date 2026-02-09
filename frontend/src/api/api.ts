export type Point = {
    id: string;
    x: number;
    y: number;
    cluster: number;
    headline: string;
    short_description: string;
    link: string;
    category: string;
};
  
const API_BASE = "http://127.0.0.1:8000";
  
export async function fetchPoints(limit?: number, signal?: AbortSignal): Promise<Point[]> {
    const url = new URL(`${API_BASE}/points`);
    if (limit !== undefined) url.searchParams.set("limit", String(limit));

    // assigned to abort controller signal to cancel the request if the component is unmounted
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`Failed to load points: ${res.status}`);
    return (await res.json()) as Point[];
}