import { STUDENT_TYPES, PAYMENT_STATUSES } from '../../constants/registration';
import { FormInput } from '../FormInput';
import { SelectInput } from '../SelectInput';

export function RegistrationFilters({
  search,
  studentType,
  paymentStatus,
  onSearchChange,
  onStudentTypeChange,
  onPaymentStatusChange,
  onClear,
}) {
  return (
    <div className="filter-bar">
      <FormInput
        id="admin-search"
        label="Search"
        value={search}
        placeholder="Team, name, register no., email, phone"
        onChange={onSearchChange}
      />
      <SelectInput id="studentType" label="Residence" value={studentType} onChange={onStudentTypeChange}>
        <option value="ALL">All</option>
        <option value={STUDENT_TYPES.HOSTEL}>Hostel</option>
        <option value={STUDENT_TYPES.DAY_SCHOLAR}>Day scholar</option>
      </SelectInput>
      <SelectInput
        id="paymentStatus"
        label="Payment status"
        value={paymentStatus}
        onChange={onPaymentStatusChange}
      >
        <option value="ALL">All</option>
        <option value={PAYMENT_STATUSES.PENDING}>Pending</option>
        <option value={PAYMENT_STATUSES.PAID}>Paid</option>
        <option value={PAYMENT_STATUSES.FAILED}>Failed</option>
      </SelectInput>
      <button type="button" className="btn btn--secondary" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}
