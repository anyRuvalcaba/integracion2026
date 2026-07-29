import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import AddressForm from "../components/Checkout/Address/AddressForm";
import AddressList from "../components/Checkout/Address/AddressList";
import PaymentForm from "../components/Checkout/Payment/PaymentForm";
import PaymentList from "../components/Checkout/Payment/PaymentList";
import SummarySection from "../components/Checkout/shared/SummarySection";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import apiClient from "../services/apiClient";
import {
  createPaymentMethod,
  deletePaymentMethod,
  getDefaultPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../services/paymentService";
import {
  createAddress,
  deleteAddress,
  getDefaultShippingAddress,
  getShippingAddresses,
  updateAddress,
} from "../services/shippingService";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();

  const subtotal = typeof total === "number" ? total : 0;
  const TAX_RATE = 0.16;
  const SHIPPING_RATE = 350;
  const FREE_SHIPPING_THRESHOLD = 1000;

  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );
  const [isOrderFinished, setIsOrderFinished] = useState(false);

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  useEffect(() => {
    if (!items || items.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [items, navigate]);

  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoadingLocal(true);
      setLocalError(null);
      try {
        const [addrList, firstAddress, payList, firstPayment] =
          await Promise.all([
            getShippingAddresses(),
            getDefaultShippingAddress(),
            getPaymentMethods(),
            getDefaultPaymentMethod(),
          ]);

        setAddresses(addrList || []);
        setPayments(payList || []);
        setSelectedAddress(firstAddress);
        setSelectedPayment(firstPayment);
        setAddressSectionOpen(!firstAddress);
        setPaymentSectionOpen(!firstPayment);
      } catch (err) {
        setLocalError("No se pudo cargar direcciones o métodos de pago.");
      } finally {
        setLoadingLocal(false);
      }
    }

    loadData();
  }, []);

  // --- HANDLERS DIRECCIONES ---

  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  const handleAddressDelete = async (address) => {
    setLocalError(null);
    try {
      await deleteAddress(address._id);
      const updated = addresses.filter((a) => a._id !== address._id);
      if (selectedAddress?._id === address._id) {
        setSelectedAddress(updated[0] || null);
      }
      setAddresses(updated);
    } catch {
      setLocalError("No se pudo eliminar la dirección.");
    }
  };

  const handleAddressSubmit = async (formData) => {
    setLocalError(null);
    try {
      if (editingAddress) {
        const updated = await updateAddress(editingAddress._id, formData);
        setAddresses((prev) =>
          prev.map((a) => (a._id === editingAddress._id ? updated : a))
        );
        if (selectedAddress?._id === editingAddress._id) {
          setSelectedAddress(updated);
        }
      } else {
        const created = await createAddress(formData);
        setAddresses((prev) => [...prev, created]);
        setSelectedAddress(created);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressSectionOpen(false);
    } catch {
      setLocalError("No se pudo guardar la dirección.");
    }
  };

  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  // --- HANDLERS PAGOS ---

  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPayment(null);
    setPaymentSectionOpen(true);
  };

  const handlePaymentEdit = (payment) => {
    setShowPaymentForm(true);
    setEditingPayment(payment);
    setPaymentSectionOpen(true);
  };

  const handlePaymentDelete = async (payment) => {
    setLocalError(null);
    try {
      await deletePaymentMethod(payment._id);
      const updated = payments.filter((p) => p._id !== payment._id);
      if (selectedPayment?._id === payment._id) {
        setSelectedPayment(updated[0] || null);
      }
      setPayments(updated);
    } catch {
      setLocalError("No se pudo eliminar el método de pago.");
    }
  };

  const handlePaymentSubmit = async (formData) => {
    setLocalError(null);
    try {
      if (editingPayment) {
        const updated = await updatePaymentMethod(editingPayment._id, formData);
        setPayments((prev) =>
          prev.map((p) => (p._id === editingPayment._id ? updated : p))
        );
        if (selectedPayment?._id === editingPayment._id) {
          setSelectedPayment(updated);
        }
      } else {
        const created = await createPaymentMethod({
          ...formData,
          user: user.userId,
        });
        setPayments((prev) => [...prev, created]);
        setSelectedPayment(created);
      }
      setShowPaymentForm(false);
      setEditingPayment(null);
      setPaymentSectionOpen(false);
    } catch {
      setLocalError("No se pudo guardar el método de pago.");
    }
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  // --- CREAR ORDEN ---

  const handleCreateOrder = async () => {
    if (!selectedAddress || !selectedPayment || !items || items.length === 0) {
      return;
    }
    setLocalError(null);
    try {
      const orderPayload = {
        user: user.userId,
        products: items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        address: selectedAddress._id,
        paymentMethod: selectedPayment._id,
        totalPrice: grandTotal,
        shippingCost: shippingCost,
      };

      const response = await apiClient.post("/orders", orderPayload);
      const order = response.data;

      setIsOrderFinished(true);
      clearCart();
      navigate("/order-confirmation", { state: { order } });
    } catch {
      setLocalError("No se pudo crear la orden. Intenta de nuevo.");
    }
  };

  const paymentLabel =
    selectedPayment
      ? selectedPayment.cardHolderName || selectedPayment.type
      : null;

  return (
    loadingLocal ? (
      <Loading message="Cargando direcciones y métodos de pago..." />
    ) : localError ? (
      <ErrorMessage message={localError} />
    ) : (
      <div className="checkout-container">
        <div className="checkout-left">
          <SummarySection
            title="1. Dirección de envío"
            selected={selectedAddress}
            summaryContent={
              <div className="selected-address">
                <p>{selectedAddress?.address}</p>
                <p>
                  {selectedAddress?.city}, {selectedAddress?.state}{" "}
                  {selectedAddress?.postalCode}
                </p>
              </div>
            }
            isExpanded={
              showAddressForm || addressSectionOpen || !selectedAddress
            }
            onToggle={handleAddressToggle}
          >
            {!showAddressForm && !editingAddress ? (
              <AddressList
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={handleSelectAddress}
                onEdit={handleAddressEdit}
                onAdd={handleAddressNew}
                onDelete={handleAddressDelete}
              />
            ) : (
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={handleCancelAddress}
                initialValues={editingAddress || {}}
                isEdit={!!editingAddress}
              />
            )}
          </SummarySection>

          <SummarySection
            title="2. Método de pago"
            selected={selectedPayment}
            summaryContent={
              <div className="selected-payment">
                <p>{paymentLabel}</p>
                {selectedPayment?.cardNumber && (
                  <p>**** {selectedPayment.cardNumber.replace(/-/g, "").slice(-4)}</p>
                )}
              </div>
            }
            isExpanded={
              showPaymentForm || paymentSectionOpen || !selectedPayment
            }
            onToggle={handlePaymentToggle}
          >
            {!showPaymentForm && !editingPayment ? (
              <PaymentList
                payments={payments}
                selectedPayment={selectedPayment}
                onSelect={handleSelectPayment}
                onEdit={handlePaymentEdit}
                onAdd={handlePaymentNew}
                onDelete={handlePaymentDelete}
              />
            ) : (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancelPayment}
                initialValues={editingPayment || {}}
                isEdit={!!editingPayment}
              />
            )}
          </SummarySection>

          <SummarySection
            title="3. Revisa tu pedido"
            selected={true}
            isExpanded={true}
          >
            <CartView />
          </SummarySection>
        </div>

        <div className="checkout-right">
          <div className="checkout-summary">
            <h3>Resumen de la Orden</h3>
            <div className="summary-details">
              <p>
                <strong>Dirección de envío:</strong> {selectedAddress?.address}
              </p>
              <p>
                <strong>Método de pago:</strong> {paymentLabel}
              </p>
              <div className="order-costs">
                <p>
                  <strong>Subtotal:</strong> {formatMoney(subtotal)}
                </p>
                <p>
                  <strong>IVA (16%):</strong> {formatMoney(taxAmount)}
                </p>
                <p>
                  <strong>Envío:</strong>{" "}
                  {shippingCost === 0 ? "Gratis" : formatMoney(shippingCost)}
                </p>
                <hr />
                <p>
                  <strong>Total:</strong>{" "}
                  <span data-testid="checkout-grand-total">{formatMoney(grandTotal)}</span>
                </p>
              </div>
              <p>
                <strong>Fecha estimada de entrega:</strong>{" "}
                {new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <Button
              data-testid="checkout-confirm-button"
              className="pay-button"
              disabled={
                !selectedAddress ||
                !selectedPayment ||
                !items ||
                items.length === 0
              }
              title={
                !items || items.length === 0
                  ? "No hay productos en el carrito"
                  : !selectedAddress
                  ? "Selecciona una dirección de envío"
                  : !selectedPayment
                  ? "Selecciona un método de pago"
                  : "Confirmar y realizar el pago"
              }
              onClick={handleCreateOrder}
            >
              Confirmar y Pagar
            </Button>
          </div>
        </div>
      </div>
    )
  );
}
