import "./Status.css";

const Status = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case "접수전":
        return "status pending";
      case "접수":
        return "status received";
      case "진행중":
        return "status progress";
      case "완료":
        return "status done";
      default:
        return "status";
    }
  };

  return (
    <span className={getStatusClass()}>
      {status}
    </span>
  );
};

export default Status;
