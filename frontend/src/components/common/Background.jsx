import "./Background.css";


const Background = ({ image, overlayOpacity = 0.5 }) => (
  <div className="bg-cover-full" style={{ backgroundImage: `url(${image})` }}>
    <div className="bg-overlay" style={{ opacity: overlayOpacity }} />
  </div>
);

export default Background;
