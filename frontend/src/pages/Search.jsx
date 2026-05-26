import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import UserCard from "../components/UserCard";
import API_URL from "../config/api";
import { calculateAge } from "../utils/age";
import "../assets/css/search.css";

function Search() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [userTags, setUserTags] = useState([]);

  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(100);
  const [minFame, setMinFame] = useState(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("match");

  // Récupérer les suggestions du backend
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/search/suggestions?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des suggestions");
      }

      const data = await response.json();
      setUsers(data.suggestions || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les tags disponibles
  const fetchAvailableTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (err) {
      console.error("Erreur récupération tags disponibles:", err);
    }
  };

  // Récupérer les tags de l'utilisateur courant
  const fetchUserTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/tags/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const tags = await response.json();
        setUserTags(tags.map((t) => `#${t.name}`));
      }
    } catch (err) {
      console.error("Erreur récupération tags:", err);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchAvailableTags();
    fetchUserTags();
  }, []);

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  // Filtrer et trier les utilisateurs
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filtre par âge
    if (ageMin || ageMax) {
      result = result.filter((u) => {
        if (!u.birth_date) return true;
        const userAge = calculateAge(u.birth_date);
        if (!userAge) return true;
        const isValidMin = !ageMin || userAge >= ageMin;
        const isValidMax = !ageMax || userAge <= ageMax;
        return isValidMin && isValidMax;
      });
    }

    // Filtre par popularité
    if (minFame > 0) {
      result = result.filter((u) => (u.popularity_score || 0) >= minFame);
    }

    // Filtre par localisation
    if (locationFilter) {
      result = result.filter((u) =>
        u.location_city?.toLowerCase().includes(locationFilter.toLowerCase()),
      );
    }

    // Filtre par tags (sélection multiple)
    if (selectedTags.length > 0) {
      result = result.filter(
        (u) => u.tags && selectedTags.some((tag) => u.tags.includes(tag)),
      );
    }

    // Calculer le nombre de tags communs
    const getCommonTagsCount = (userTagsList) => {
      if (!userTagsList || !userTags) return 0;
      return userTagsList.filter((tag) => userTags.includes(tag)).length;
    };

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case "age":
          const ageA = a.birth_date ? calculateAge(a.birth_date) : 0;
          const ageB = b.birth_date ? calculateAge(b.birth_date) : 0;
          return ageA - ageB;
        case "fame":
          return (b.popularity_score || 0) - (a.popularity_score || 0);
        case "location":
          return (a.location_city || "").localeCompare(b.location_city || "");
        case "tags":
          return getCommonTagsCount(b.tags) - getCommonTagsCount(a.tags);
        case "match":
        default:
          const scoreA =
            (a.popularity_score || 0) + getCommonTagsCount(a.tags) * 10;
          const scoreB =
            (b.popularity_score || 0) + getCommonTagsCount(b.tags) * 10;
          return scoreB - scoreA;
      }
    });

    return result;
  }, [
    users,
    ageMin,
    ageMax,
    minFame,
    locationFilter,
    selectedTags,
    sortBy,
    userTags,
  ]);

  if (loading) {
    return (
      <div className="search-container">
        <div className="loading-spinner">Loading coffee lovers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="search-container">
      <aside className="search-filters">
        <h2>Filters</h2>

        <div className="filter-group">
          <label>
            Age Gap ({ageMin} - {ageMax})
          </label>
          <div className="range-inputs">
            <input
              type="number"
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              min="18"
              max="100"
            />
            <span>-</span>
            <input
              type="number"
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              min="18"
              max="100"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Min Popularity: {minFame}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={minFame}
            onChange={(e) => setMinFame(Number(e.target.value))}
            className="slider"
          />
        </div>

        <div className="filter-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="City"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Tags</label>
          <div className="tags-dropdown-container">
            <div
              className="tags-dropdown-trigger"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            >
              {selectedTags.length > 0 ? (
                <span>{selectedTags.length} tag(s) selected</span>
              ) : (
                <span>-- Select tags --</span>
              )}
              <span className="dropdown-arrow">
                {tagDropdownOpen ? "▲" : "▼"}
              </span>
            </div>
            {tagDropdownOpen && (
              <div className="tags-dropdown-menu">
                {availableTags.map((tag) => (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(`#${tag.name}`)}
                      onChange={() => toggleTag(`#${tag.name}`)}
                    />
                    <span className="tag-name">#{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Afficher les tags sélectionnés */}
          {selectedTags.length > 0 && (
            <div className="selected-tags-container">
              {selectedTags.map((tag) => (
                <span key={tag} className="selected-tag">
                  {tag}
                  <button
                    type="button"
                    className="remove-tag"
                    onClick={() => toggleTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="search-results">
        <div className="results-header">
          <h2>Suggested Matches</h2>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="match">Best Match</option>
            <option value="age">Age (Youngest)</option>
            <option value="location">Location (A-Z)</option>
            <option value="fame">Popularity</option>
            <option value="tags">Common Tags</option>
          </select>
        </div>

        <div className="users-grid">
          {filteredAndSortedUsers.length > 0 ? (
            filteredAndSortedUsers.map((u) => (
              <UserCard key={u.id} user={u} currentUserTags={userTags} />
            ))
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "#666",
              }}
            >
              <h3>No coffee lovers found with these exact filters.</h3>
              <p>Try widening your search criteria!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Search;
