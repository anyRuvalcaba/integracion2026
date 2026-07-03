import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./PaymentForm.css";

const PAYMENT_TYPES = [
  { value: "credit_card", label: "Tarjeta de Crédito" },
  { value: "debit_card", label: "Tarjeta de Débito" },
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Transferencia Bancaria" },
  { value: "cash_on_delivery", label: "Pago en Efectivo" },
];

const PaymentForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) => {
  const emptyForm = {
    type: "credit_card",
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
    isDefault: false,
  };

  const [formData, setFormData] = useState({ ...emptyForm, ...initialValues });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({ ...emptyForm, ...initialValues });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!isEdit) {
      setFormData(emptyForm);
    }
  };

  const isCard =
    formData.type === "credit_card" || formData.type === "debit_card";

  return (
    <form className="payment-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Editar Método de Pago" : "Nuevo Método de Pago"}</h3>

      <div className="form-group">
        <label htmlFor="type">Tipo de pago</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          {PAYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isCard && (
        <>
          <Input
            label="Número de tarjeta"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}"
            placeholder="1234-5678-9012-3456"
          />

          <Input
            label="Nombre del titular"
            name="cardHolderName"
            value={formData.cardHolderName}
            onChange={handleChange}
          />

          <div className="form-row">
            <Input
              label="Fecha de expiración"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              pattern="[0-9]{2}/[0-9]{2}"
            />

            <Input
              label="CVV"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              type="password"
              maxLength="4"
              pattern="[0-9]{3,4}"
            />
          </div>
        </>
      )}

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          id="isDefaultPayment"
        />
        <label htmlFor="isDefaultPayment">
          Establecer como método de pago predeterminado
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Guardar Cambios" : "Agregar Método de Pago"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};

export default PaymentForm;
