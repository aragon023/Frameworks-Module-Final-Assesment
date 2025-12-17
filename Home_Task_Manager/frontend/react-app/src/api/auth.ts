export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}
