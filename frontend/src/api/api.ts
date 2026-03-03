import { type TravelPoint} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
  
export async function fetchPoints(limit?: number, signal?: AbortSignal): Promise<TravelPoint[]> {
    const url = new URL(`${API_BASE}/points`);
    if (limit !== undefined) url.searchParams.set("limit", String(limit));

    // assigned to abort controller signal to cancel the request if the component is unmounted
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`Failed to load points: ${res.status}`);
    return (await res.json()) as TravelPoint[];
}