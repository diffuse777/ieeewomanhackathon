import { formatFeePerParticipant, formatMoney } from '../../constants/hackathon';
import { isHostelMember, studentTypeLabel } from '../../utils/registrationForm';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function Value({ children }) {
  if (children == null || children === '') {
    return '—';
  }
  return children;
}

export function RegistrationDetails({ team }) {
  const members = Array.isArray(team.members) ? team.members : [];
  const upiReference = team.payment?.paymentTransactionId;

  return (
    <div className="registration-detail">
      <section className="registration-detail__section">
        <h2>Team & payment</h2>
        <div className="data-table-wrap">
          <table className="data-table data-table--detail">
            <tbody>
              <tr>
                <th scope="row">Team name</th>
                <td>{team.teamName}</td>
                <th scope="row">Members</th>
                <td>{team.memberCount}</td>
              </tr>
              <tr>
                <th scope="row">Fee</th>
                <td>{formatFeePerParticipant()}</td>
                <th scope="row">Total amount</th>
                <td>{formatMoney(team.totalAmount)}</td>
              </tr>
              <tr>
                <th scope="row">Payment status</th>
                <td>
                  <span className={`badge badge--${String(team.paymentStatus || '').toLowerCase()}`}>
                    {team.paymentStatus}
                  </span>
                </td>
                <th scope="row">Paid at</th>
                <td>{formatDate(team.payment?.paidAt)}</td>
              </tr>
              <tr>
                <th scope="row">UPI reference ID</th>
                <td colSpan={3}>
                  <Value>{upiReference}</Value>
                </td>
              </tr>
              <tr>
                <th scope="row">Registered</th>
                <td>{formatDate(team.createdAt)}</td>
                <th scope="row">Updated</th>
                <td>{formatDate(team.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="registration-detail__section">
        <h2>Participants</h2>
        <div className="data-table-wrap">
          <table className="data-table data-table--participants">
            <thead>
              <tr>
                <th>S.no</th>
                <th>Name</th>
                <th>Reg.no</th>
                <th>Dept</th>
                <th>Sec</th>
                <th>Email</th>
                <th>Ph.no</th>
                <th>DS/H</th>
                <th>Hostel Name</th>
                <th>Warden Name</th>
                <th>Warden contact</th>
                <th>Room no</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => {
                const hostel = isHostelMember(member.studentType);
                return (
                  <tr key={member.id || member.registerNumber || index}>
                    <td>{index + 1}</td>
                    <td>{member.name}</td>
                    <td>{member.registerNumber}</td>
                    <td>{member.department}</td>
                    <td>{member.section}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>{studentTypeLabel(member.studentType)}</td>
                    <td>{hostel ? <Value>{member.hostelName}</Value> : '—'}</td>
                    <td>{hostel ? <Value>{member.wardenName}</Value> : '—'}</td>
                    <td>{hostel ? <Value>{member.wardenContactNumber}</Value> : '—'}</td>
                    <td>{hostel ? <Value>{member.roomNumber}</Value> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
