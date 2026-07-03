import apiClient from "./apiClient";

export async function getPaymentMethods() {
  const response = await apiClient.get("/payment-methods/me");
  return response.data;
}

export async function getDefaultPaymentMethod() {
  const methods = await getPaymentMethods();
  return methods.find((m) => m.isDefault) || methods[0] || null;
}

export async function createPaymentMethod(data) {
  const response = await apiClient.post("/payment-methods", data);
  return response.data;
}

export async function updatePaymentMethod(id, data) {
  const response = await apiClient.put(`/payment-methods/${id}`, data);
  return response.data;
}

export async function deletePaymentMethod(id) {
  await apiClient.delete(`/payment-methods/${id}`);
}
