import "./ProgressBar.css";

const STEPS = ["접수전", "접수중", "진행중", "완료"];

const ProgressBar = ({ status }) => {
  const currentIndex = STEPS.indexOf(status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="progress-bar">
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <div className="progress-bar-labels">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`progress-bar-label ${i <= activeIndex ? "active" : ""}`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
