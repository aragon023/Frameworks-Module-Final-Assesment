export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
