import apiClient from "./apiClient";

export async function getShippingAddresses() {
  const response = await apiClient.get("/addresses");
  return response.data;
}

export async function getDefaultShippingAddress() {
  const addresses = await getShippingAddresses();
  return addresses.find((a) => a.isDefault) || addresses[0] || null;
}

export async function createAddress(data) {
  const response = await apiClient.post("/addresses", data);
  return response.data;
}

export async function updateAddress(id, data) {
  const response = await apiClient.put(`/addresses/${id}`, data);
  return response.data;
}

export async function deleteAddress(id) {
  await apiClient.delete(`/addresses/${id}`);
}
