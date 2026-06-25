import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import UserCard from '../components/UserCard';

function SearchProd() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ ageMin: 18, ageMax: 80, distance: 100, popularityMin: 0 });
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/search?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setUsers(data.users || []);
  };

  useEffect(() => { fetchUsers(); }, [filters]);

  return (
    <div className="search-container">
      <div className="filters">
        <input type="number" onChange={(e) => setFilters({...filters, ageMin: e.target.value})} placeholder="Age Min" />
        <button onClick={fetchUsers}>Rechercher</button>
      </div>
      <div className="results-grid">
        {users.map(u => <UserCard key={u.id} user={u} />)}
      </div>
    </div>
  );
}
export default SearchProd;