import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import "./search.css";

const Search = ({ onSearchChange }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery("");
      onSearchChange("");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <div className="search-container">
      <div className={`search-input-wrapper ${searchOpen ? 'open' : ''}`}>
        <input
          type="text"
          className="search-input"
          placeholder="제목을 입력하세요"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <button className="icon-btn" onClick={toggleSearch}>
        <SearchIcon size={28} />
      </button>
    </div>
  );
};

export default Search;
