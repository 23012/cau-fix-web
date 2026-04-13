import "./ProgressBar.css";

const STEPS = ["접수전", "진행중", "완료"];

const ProgressBar = ({ status }) => {
  const currentIndex = STEPS.indexOf(status);
  // 접수 상태는 접수전과 같은 단계로 처리
  const activeIndex = status === "접수" ? 0 : currentIndex === -1 ? 0 : currentIndex;

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
