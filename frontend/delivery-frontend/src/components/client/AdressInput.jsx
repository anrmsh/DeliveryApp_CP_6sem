import { useState, useRef, useEffect } from "react";
import "../../styles/client/AdressInput.css";

/**
 * AddressInput — поле ввода адреса с автодополнением через Nominatim (OpenStreetMap).
 *
 * Props:
 *   value        — текущее значение строки
 *   onChange(val, coords) — вызывается при изменении текста
 *   onSelect(val, coords) — вызывается когда пользователь выбрал подсказку
 *                           coords = { lat, lng } | null
 *   placeholder  — placeholder текст
 *   label        — подпись поля
 */
export default function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "Начните вводить адрес...",
  label,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [open, setOpen]               = useState(false);
  const debounceRef = useRef(null);
  const wrapRef     = useRef(null);

  // Закрыть дропдаун при клике снаружи
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val, null);

    clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json&limit=6&addressdetails=1` +
          `&q=${encodeURIComponent(val)}`;
        const res  = await fetch(url, {
          headers: { "Accept-Language": "ru", "User-Agent": "DelivryApp/1.0" },
        });
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    const label = item.display_name;
    const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    onChange(label, coords);
    if (onSelect) onSelect(label, coords);
    setSuggestions([]);
    setOpen(false);
  };

  // Форматируем подсказку: город + улица + дом
  const formatSuggestion = (item) => {
    const a = item.address || {};
    const parts = [
      a.city || a.town || a.village || a.county,
      a.road || a.pedestrian,
      a.house_number,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : item.display_name;
  };

  return (
    <div className="addr-wrap" ref={wrapRef}>
      {label && <label className="addr-label">{label}</label>}
      <div className="addr-input-wrap">
        <i className="bx bx-map addr-icon" />
        <input
          className="addr-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <div className="addr-spinner" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="addr-dropdown">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              className="addr-item"
              onMouseDown={() => handleSelect(item)}
            >
              <i className="bx bx-map-pin addr-item-icon" />
              <div className="addr-item-text">
                <div className="addr-item-main">{formatSuggestion(item)}</div>
                <div className="addr-item-sub">{item.display_name}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}