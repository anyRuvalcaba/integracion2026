import Button from "../../common/Button";
import "./PaymentItem.css";

const TYPE_LABELS = {
  credit_card: "Tarjeta de Crédito",
  debit_card: "Tarjeta de Débito",
  paypal: "PayPal",
  bank_transfer: "Transferencia Bancaria",
  cash_on_delivery: "Pago en Efectivo",
};

const PaymentItem = ({ payment, isSelected, onSelect, onEdit, onDelete }) => {
  const maskCardNumber = (number) => {
    if (!number) return null;
    return `**** **** **** ${number.replace(/-/g, "").slice(-4)}`;
  };

  const masked = maskCardNumber(payment.cardNumber);

  return (
    <div
      className={`payment-item ${isSelected ? "selected" : ""} ${
        payment.isDefault ? "isDefault" : ""
      }`}
    >
      <div className="payment-content">
        <h4>{TYPE_LABELS[payment.type] || payment.type}</h4>
        {payment.cardHolderName && <p>{payment.cardHolderName}</p>}
        {masked && <p>{masked}</p>}
        {payment.expiryDate && <p>Vence: {payment.expiryDate}</p>}
        {payment.isDefault && (
          <span className="isDefault-badge">Predeterminada</span>
        )}
      </div>
      <div className="payment-actions">
        <Button onClick={() => onSelect(payment)} disabled={isSelected}>
          {isSelected ? "Seleccionada" : "Seleccionar"}
        </Button>
        <Button variant="secondary" onClick={() => onEdit(payment)}>
          Editar
        </Button>
        <Button variant="danger" onClick={() => onDelete(payment)}>
          Eliminar
        </Button>
      </div>
    </div>
  );
};

export default PaymentItem;
