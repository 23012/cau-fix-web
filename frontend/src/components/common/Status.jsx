import { STATUS_CLASS } from "../../constants/status";
import "./Status.css";

const Status = ({ status }) => {
  const className = STATUS_CLASS[status] || "";

  return (
    <span className={`status ${className}`}>
      {status}
    </span>
  );
};

export default Status;
